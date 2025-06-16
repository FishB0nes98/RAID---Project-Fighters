// Skin Shop JavaScript
class SkinShop {
    constructor() {
        this.currentCategory = 'all';
        this.currentSort = 'release';
        this.searchQuery = '';
        this.allSkins = [];
        this.filteredSkins = [];
        this.selectedSkinForPurchase = null;
    }

    // Initialize the skin shop
    async init() {
        console.log('[SkinShop] Initializing...');
        
        try {
            // Initialize skin manager
            const initialized = await window.SkinManager.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize skin manager');
            }

            // Load and display skins
            await this.loadSkins();
            this.setupEventListeners();
            this.updateFMDisplay();
            
            // Hide loading screen and show content
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('shop-content').style.display = 'block';
            
            console.log('[SkinShop] Initialized successfully');
        } catch (error) {
            console.error('[SkinShop] Initialization error:', error);
            
            // Hide loading screen
            document.getElementById('loading-screen').style.display = 'none';
            
            // Show error message instead of content
            if (error.message.includes('timeout') || error.message.includes('not signed in')) {
                this.showAuthError();
            } else {
                this.showNotification('Failed to load skin shop. Please try again.', 'error');
                document.getElementById('shop-content').style.display = 'block';
            }
        }
    }

    // Load all skins with ownership status
    async loadSkins() {
        this.allSkins = window.SkinManager.getAllSkinsWithOwnership();
        this.filterAndDisplaySkins();
        console.log(`[SkinShop] Loaded ${this.allSkins.length} skins`);
    }

    // Set up event listeners
    setupEventListeners() {
        // Category navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleCategoryChange(e.target.dataset.category);
            });
        });

        // Sort dropdown
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndDisplaySkins();
        });

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterAndDisplaySkins();
        });

        // Purchase confirmation
        document.getElementById('confirm-purchase').addEventListener('click', () => {
            this.confirmPurchase();
        });

        // Click outside modal to close
        document.getElementById('purchase-modal').addEventListener('click', (e) => {
            if (e.target.id === 'purchase-modal') {
                this.closePurchaseModal();
            }
        });
    }

    // Handle category change
    handleCategoryChange(category) {
        this.currentCategory = category;
        
        // Update active nav button
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.filterAndDisplaySkins();
    }

    // Filter and display skins based on current filters
    filterAndDisplaySkins() {
        let filtered = [...this.allSkins];

        // Apply category filter
        if (this.currentCategory !== 'all') {
            if (this.currentCategory === 'owned') {
                filtered = filtered.filter(skin => skin.owned);
            } else {
                filtered = filtered.filter(skin => skin.category === this.currentCategory);
            }
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(skin => 
                skin.name.toLowerCase().includes(this.searchQuery) ||
                skin.description.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'release':
                    // Preserve order from registry (no sorting - keeps original order)
                    return 0;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rarity':
                    const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
                    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                default:
                    return 0;
            }
        });

        this.filteredSkins = filtered;
        this.displaySkins();
    }

    // Display skins in the grid
    displaySkins() {
        const grid = document.getElementById('skins-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredSkins.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.filteredSkins.map(skin => this.createSkinCard(skin)).join('');

        // Add click listeners to purchase buttons
        grid.querySelectorAll('.purchase-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const skinId = e.target.dataset.skinId;
                this.showPurchaseModal(skinId);
            });
        });
    }

    // Create a skin card HTML
    createSkinCard(skin) {
        const canAfford = window.SkinManager.getFighterMoney() >= skin.price;
        const rarityClass = `rarity-${skin.rarity}`;

        return `
            <div class="skin-card">
                <div class="skin-image-container">
                    <img class="skin-image" src="${skin.imagePath}" alt="${skin.name}" 
                         onerror="this.src='Icons/characters/default.png'">
                    <div class="skin-rarity-badge ${rarityClass}">${skin.rarity}</div>
                    ${skin.owned ? '<div class="owned-badge">Owned</div>' : ''}
                </div>
                <div class="skin-info">
                    <h3 class="skin-name">${skin.name}</h3>
                    <p class="skin-description">${skin.description}</p>
                    <div class="skin-footer">
                        <div class="skin-price">
                            <span class="price-amount">${skin.price.toLocaleString()}</span>
                            <span class="price-currency">FM</span>
                        </div>
                        ${skin.owned 
                            ? '<div class="owned-label">Owned</div>'
                            : `<button class="purchase-button" 
                                 data-skin-id="${skin.id}" 
                                 ${!canAfford ? 'disabled' : ''}>
                                 ${canAfford ? 'Purchase' : 'Insufficient FM'}
                               </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // Show purchase confirmation modal
    showPurchaseModal(skinId) {
        const skin = window.SkinRegistry.getSkin(skinId);
        if (!skin) return;

        this.selectedSkinForPurchase = skin;

        // Update modal content
        document.getElementById('preview-image').src = skin.imagePath;
        document.getElementById('preview-name').textContent = skin.name;
        document.getElementById('preview-description').textContent = skin.description;
        document.getElementById('preview-price').textContent = skin.price.toLocaleString();
        document.getElementById('current-balance').textContent = window.SkinManager.getFighterMoney().toLocaleString();

        // Show modal
        document.getElementById('purchase-modal').style.display = 'flex';
    }

    // Close purchase modal
    closePurchaseModal() {
        document.getElementById('purchase-modal').style.display = 'none';
        this.selectedSkinForPurchase = null;
    }

    // Confirm and process purchase
    async confirmPurchase() {
        if (!this.selectedSkinForPurchase) return;

        const confirmButton = document.getElementById('confirm-purchase');
        confirmButton.disabled = true;
        confirmButton.textContent = 'Processing...';

        try {
            const result = await window.SkinManager.purchaseSkin(this.selectedSkinForPurchase.id);
            
            if (result.success) {
                this.showNotification(`Successfully purchased ${this.selectedSkinForPurchase.name}!`, 'success');
                this.closePurchaseModal();
                
                // Refresh data and display
                await this.loadSkins();
                this.updateFMDisplay();
            } else {
                this.showNotification(result.error || 'Purchase failed', 'error');
            }
        } catch (error) {
            console.error('[SkinShop] Purchase error:', error);
            this.showNotification('Purchase failed. Please try again.', 'error');
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = 'Purchase';
        }
    }

    // Update FM display
    updateFMDisplay() {
        const fmAmount = document.getElementById('fm-amount');
        const currentFM = window.SkinManager.getFighterMoney();
        fmAmount.textContent = currentFM.toLocaleString();
    }

    // Show authentication error
    showAuthError() {
        const shopContent = document.getElementById('shop-content');
        shopContent.innerHTML = `
            <div class="auth-error">
                <div class="auth-error-icon">🔒</div>
                <h2>Authentication Required</h2>
                <p>You need to be signed in to access the Skin Shop.</p>
                <div class="auth-error-actions">
                    <button class="back-button" onclick="goBack()">
                        <span>←</span> Back to Character Selection
                    </button>
                </div>
            </div>
        `;
        shopContent.style.display = 'block';
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageEl = document.getElementById('notification-message');

        // Set content
        messageEl.textContent = message;
        icon.textContent = type === 'success' ? '✅' : '❌';
        
        // Set type class
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        // Auto hide after 4 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
}

// Global functions
function goBack() {
    window.location.href = 'character-selector.html';
}

function closePurchaseModal() {
    if (window.skinShop) {
        window.skinShop.closePurchaseModal();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.skinShop = new SkinShop();
    await window.skinShop.init();
});

 