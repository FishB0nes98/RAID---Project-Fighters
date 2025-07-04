/**
 * Item Database JavaScript
 * Displays and manages the item database interface with Firebase integration
 */

class ItemDatabase {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentFilters = {
            search: '',
            rarity: 'all',
            type: 'all'
        };
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            // Wait for Firebase to be ready
            await this.waitForFirebase();

            // Set up authentication listener
            this.setupAuthListener();

            // Initialize GlobalInventory
            if (!window.GlobalInventory) {
                window.GlobalInventory = new GlobalInventory();
                console.log('[ItemDatabase] GlobalInventory initialized');
            }

            // Initialize userData
            if (!window.userData) {
                window.userData = {
                    username: '',
                    email: '',
                    uid: '',
                    globalInventory: []
                };
                console.log('[ItemDatabase] userData initialized');
            }

            // Initialize item registry if not already done
            if (!window.ItemRegistry) {
                window.ItemRegistry = new ItemRegistry();
            }
            
            // Get all items from the registry
            this.items = window.ItemRegistry.getAllItems();
            this.filteredItems = [...this.items];
            
            console.log(`[ItemDatabase] Loaded ${this.items.length} items`);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderItems();
            this.updateItemsCount();

            // Ensure admin button is hidden initially
            this.forceHideAdminButton();
            this.updateAdminButton();

            // Track database usage
            this.trackDatabaseUsage();

            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('[ItemDatabase] Failed to initialize:', error);
            this.showError('Failed to load item database');
            this.hideLoadingScreen();
        }
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebase && window.auth && window.database) {
                resolve();
                return;
            }
            
            const checkFirebase = setInterval(() => {
                if (window.firebase && window.auth && window.database) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        });
    }

    setupAuthListener() {
        if (window.auth) {
            window.auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    console.log('[ItemDatabase] User authenticated:', user.uid);
                    
                    // Check admin status
                    await this.checkUserAdminStatus(user);
                    
                    // Load user's global inventory if exists
                    try {
                        const userRef = window.database.ref(`users/${user.uid}`);
                        const snapshot = await userRef.once('value');
                        if (snapshot.exists()) {
                            const userData = snapshot.val();
                            
                            // Initialize userData for the session (don't overwrite Firebase)
                            window.userData = userData;
                            
                            if (userData.globalInventory) {
                                if (userData.globalInventory.items && Array.isArray(userData.globalInventory.items)) {
                                    // New format: wrapped object with items array
                                    window.GlobalInventory.deserialize(userData.globalInventory.items);
                                    console.log('[ItemDatabase] Loaded user global inventory (new format)');
                                } else if (Array.isArray(userData.globalInventory)) {
                                    // Old format: direct array (backward compatibility)
                                    window.GlobalInventory.deserialize(userData.globalInventory);
                                    console.log('[ItemDatabase] Loaded user global inventory (old format)');
                                } else {
                                    console.log('[ItemDatabase] Invalid global inventory format, starting empty');
                                }
                            }
                        } else {
                            // User doesn't exist in Firebase, initialize minimal userData
                            window.userData = {
                                username: user.displayName || 'Anonymous',
                                email: user.email,
                                uid: user.uid,
                                globalInventory: {
                                    items: [],
                                    lastUpdated: Date.now()
                                }
                            };
                        }
                    } catch (error) {
                        console.error('[ItemDatabase] Error loading user data:', error);
                    }
                    
                } else {
                    this.isAdmin = false;
                    this.updateUserStatus();
                    this.updateAdminButton(); // Hide admin button when logged out
                }
            });
        }
    }

    async checkUserAdminStatus(user) {
        try {
            if (!user || !window.database) {
                this.isAdmin = false;
                this.updateUserStatus();
                this.updateAdminButton(); // Update admin button visibility
                return;
            }

            // Get user data from Firebase
            const userRef = window.database.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const username = userData.username;
                
                // Check if user is admin (FishB0nes98)
                this.isAdmin = username === 'FishB0nes98';
                
                console.log(`[ItemDatabase] User: ${username}, Admin: ${this.isAdmin}`);
                
                // Update UI
                this.updateUserStatus(username);
                this.updateAdminButton(); // Update admin button visibility
            } else {
                this.isAdmin = false;
                this.updateUserStatus();
                this.updateAdminButton(); // Update admin button visibility
            }
        } catch (error) {
            console.error('[ItemDatabase] Error checking admin status:', error);
            this.isAdmin = false;
            this.updateUserStatus();
            this.updateAdminButton(); // Update admin button visibility
        }
    }

    updateUserStatus(username = null) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusText) {
            if (this.currentUser && username) {
                statusIndicator.classList.add('logged-in');
                statusText.textContent = username;
                
                if (this.isAdmin) {
                    statusIndicator.classList.add('admin');
                    statusText.textContent = `${username} (Admin)`;
                } else {
                    statusIndicator.classList.remove('admin');
                }
            } else {
                statusIndicator.classList.remove('logged-in', 'admin');
                statusText.textContent = 'Not logged in';
            }
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    }

    async trackDatabaseUsage() {
        try {
            if (!window.database) return;
            
            const user = this.currentUser;
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            
            // Track anonymous usage (optional - don't fail if permission denied)
            const usageRef = window.database.ref('analytics/itemDatabase');
            await usageRef.push({
                timestamp,
                userLoggedIn: !!user,
                userIsAdmin: this.isAdmin,
                itemCount: this.items.length
            });
            
            console.log('[ItemDatabase] Usage tracked');
        } catch (error) {
            // Don't log analytics errors as they're not critical
            if (error.code === 'PERMISSION_DENIED') {
                console.log('[ItemDatabase] Analytics tracking disabled (permission denied)');
            } else {
                console.error('[ItemDatabase] Error tracking usage:', error);
            }
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('item-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Rarity filters
        const rarityFilters = document.getElementById('rarity-filters');
        if (rarityFilters) {
            rarityFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    // Remove active class from all rarity buttons
                    rarityFilters.querySelectorAll('.filter-btn').forEach(btn => 
                        btn.classList.remove('active')
                    );
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update filter
                    this.currentFilters.rarity = e.target.dataset.rarity;
                    this.applyFilters();
                }
            });
        }

        // Type filters
        const typeFilters = document.getElementById('type-filters');
        if (typeFilters) {
            typeFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    // Remove active class from all type buttons
                    typeFilters.querySelectorAll('.filter-btn').forEach(btn => 
                        btn.classList.remove('active')
                    );
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update filter
                    this.currentFilters.type = e.target.dataset.type;
                    this.applyFilters();
                }
            });
        }

        // Modal close events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeItemModal();
            }
        });
    }

    applyFilters() {
        this.filteredItems = this.items.filter(item => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const matchesSearch = 
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.description.toLowerCase().includes(searchTerm) ||
                    item.id.toLowerCase().includes(searchTerm);
                    
                if (!matchesSearch) return false;
            }

            // Rarity filter
            if (this.currentFilters.rarity !== 'all') {
                if (item.rarity !== this.currentFilters.rarity) return false;
            }

            // Type filter
            if (this.currentFilters.type !== 'all') {
                const itemType = item.isConsumable ? 'consumable' : item.type;
                if (itemType !== this.currentFilters.type) return false;
            }

            return true;
        });

        this.renderItems();
        this.updateItemsCount();
    }

    renderItems() {
        const itemsGrid = document.getElementById('items-grid');
        const noResults = document.getElementById('no-results');
        
        if (!itemsGrid) return;

        if (this.filteredItems.length === 0) {
            itemsGrid.style.display = 'none';
            if (noResults) {
                noResults.classList.add('show');
            }
            return;
        }

        itemsGrid.style.display = 'grid';
        if (noResults) {
            noResults.classList.remove('show');
        }

        itemsGrid.innerHTML = this.filteredItems.map(item => this.createItemCard(item)).join('');
    }

    createItemCard(item) {
        const rarityClass = `rarity-${item.rarity}`;
        const itemType = item.isConsumable ? 'consumable' : item.type;
        
        // Format stats for display
        const statChips = this.getStatChips(item);
        
        // Handle item image
        const imageElement = item.image ? 
            `<img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="item-placeholder" style="display: none;">📦</div>` :
            `<div class="item-placeholder">📦</div>`;

        return `
            <div class="item-card ${rarityClass}" onclick="itemDatabase.showItemModal('${item.id}')">
                <div class="item-image-container">
                    ${imageElement}
                    <div class="item-rarity-badge ${item.rarity}">${item.rarity}</div>
                    <div class="item-type-badge">${itemType}</div>
                </div>
                <div class="item-info">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-stats">
                        ${statChips}
                    </div>
                </div>
            </div>
        `;
    }

    getStatChips(item) {
        const chips = [];
        
        // Add stat bonuses
        if (item.statBonuses && Object.keys(item.statBonuses).length > 0) {
            Object.entries(item.statBonuses).forEach(([stat, value]) => {
                const formattedStat = this.formatStatName(stat);
                const formattedValue = this.formatStatValue(stat, value);
                chips.push(`<span class="stat-chip positive">+${formattedValue} ${formattedStat}</span>`);
            });
        }

        // Add consumable info
        if (item.isConsumable && item.cooldownTurns) {
            chips.push(`<span class="stat-chip">${item.cooldownTurns} turn cooldown</span>`);
        }

        return chips.join('');
    }

    formatStatName(stat) {
        const statNames = {
            physicalDamage: 'Physical Damage',
            magicalDamage: 'Magical Damage',
            armor: 'Armor',
            magicalShield: 'Magic Shield',
            hp: 'Health',
            mana: 'Mana',
            speed: 'Speed',
            critChance: 'Crit Chance',
            critMultiplier: 'Crit Damage',
            dodgeChance: 'Dodge Chance',
            hpPerTurn: 'HP Regen',
            manaPerTurn: 'Mana Regen',
            lifeSteal: 'Life Steal',
            lifesteal: 'Life Steal',
            healingPower: 'Healing Power'
        };
        return statNames[stat] || stat;
    }

    formatStatValue(stat, value) {
        // Percentage stats
        const percentageStats = ['critChance', 'critMultiplier', 'dodgeChance', 'lifeSteal', 'lifesteal', 'healingPower'];
        
        if (percentageStats.includes(stat)) {
            return `${(value * 100).toFixed(0)}%`;
        }
        
        return value;
    }

    showItemModal(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        // Store current item for admin functionality
        window.currentItemData = item;

        const modal = document.getElementById('item-modal');
        const modalTitle = document.getElementById('modal-item-name');
        const modalImg = document.getElementById('modal-item-img');
        const modalRarity = document.getElementById('modal-item-rarity');
        const modalDescription = document.getElementById('modal-item-description');
        const modalStats = document.getElementById('modal-item-stats');
        const modalMeta = document.getElementById('modal-item-meta');

        if (modalTitle) modalTitle.textContent = item.name;
        
        if (modalImg) {
            modalImg.src = item.image || '';
            modalImg.alt = item.name;
            modalImg.style.display = item.image ? 'block' : 'none';
        }

        if (modalRarity) {
            modalRarity.textContent = item.rarity.toUpperCase();
            modalRarity.className = `modal-item-rarity ${item.rarity}`;
            modalRarity.style.background = `var(--rarity-${item.rarity})`;
            if (item.rarity === 'legendary') {
                modalRarity.style.color = 'var(--text-primary)';
            }
        }

        if (modalDescription) {
            modalDescription.innerHTML = item.getFormattedDescription();
        }

        if (modalStats) {
            modalStats.innerHTML = this.createModalStats(item);
        }

        if (modalMeta) {
            modalMeta.innerHTML = this.createModalMeta(item);
        }

        // Check admin status and show/hide admin button
        this.checkAdminStatus();

        // Also check after a short delay to handle any timing issues
        setTimeout(() => {
            this.updateAdminButton();
        }, 100);

        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    checkAdminStatus() {
        this.updateAdminButton();
    }

    updateAdminButton() {
        const adminButton = document.getElementById('admin-add-button');
        if (adminButton) {
            // Only show if user is logged in AND is admin
            if (this.isAdmin && this.currentUser) {
                adminButton.classList.remove('hidden');
                adminButton.classList.add('show');
                console.log('[ItemDatabase] Admin button shown for:', this.currentUser.uid);
            } else {
                adminButton.classList.add('hidden');
                adminButton.classList.remove('show');
                console.log('[ItemDatabase] Admin button hidden - Admin:', this.isAdmin, 'User:', !!this.currentUser);
            }
        } else {
            console.log('[ItemDatabase] Admin button element not found');
        }
    }

    forceHideAdminButton() {
        const adminButton = document.getElementById('admin-add-button');
        if (adminButton) {
            adminButton.classList.add('hidden');
            adminButton.classList.remove('show');
            console.log('[ItemDatabase] Admin button force hidden');
        }
    }

    createModalStats(item) {
        if (!item.statBonuses || Object.keys(item.statBonuses).length === 0) {
            return '<p>No stat bonuses</p>';
        }

        const statsList = Object.entries(item.statBonuses).map(([stat, value]) => {
            const formattedStat = this.formatStatName(stat);
            const formattedValue = this.formatStatValue(stat, value);
            
            return `
                <div class="stat-item">
                    <span class="stat-name">${formattedStat}</span>
                    <span class="stat-value">+${formattedValue}</span>
                </div>
            `;
        }).join('');

        return `
            <h4>Stats</h4>
            <div class="stats-list">
                ${statsList}
            </div>
        `;
    }

    createModalMeta(item) {
        const itemType = item.isConsumable ? 'Consumable' : (item.type || 'Equipment');
        
        let metaItems = [
            { label: 'Type', value: itemType },
            { label: 'Rarity', value: item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1) },
            { label: 'ID', value: item.id }
        ];

        if (item.isConsumable && item.cooldownTurns) {
            metaItems.push({ label: 'Cooldown', value: `${item.cooldownTurns} turns` });
        }

        return metaItems.map(meta => `
            <div class="meta-item">
                <span class="meta-label">${meta.label}:</span>
                <span class="meta-value">${meta.value}</span>
            </div>
        `).join('');
    }

    closeItemModal() {
        const modal = document.getElementById('item-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    updateItemsCount() {
        const countElement = document.getElementById('items-count');
        if (countElement) {
            const count = this.filteredItems.length;
            countElement.textContent = `${count} Item${count !== 1 ? 's' : ''}`;
        }
    }

    showError(message) {
        const itemsGrid = document.getElementById('items-grid');
        const noResults = document.getElementById('no-results');
        
        if (itemsGrid) itemsGrid.style.display = 'none';
        if (noResults) {
            noResults.innerHTML = `
                <div class="no-results-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="retry-button" onclick="location.reload()">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    Retry
                </button>
            `;
            noResults.classList.add('show');
        }
    }
}

// Global functions for modal control
window.closeItemModal = function() {
    if (window.itemDatabase) {
        window.itemDatabase.closeItemModal();
    }
};

window.addItemToInventory = async function() {
    const currentItem = window.currentItemData;
    if (!currentItem) {
        alert('No item selected!');
        return;
    }

    // Double check admin status
    if (!window.itemDatabase.isAdmin || !window.itemDatabase.currentUser) {
        alert('❌ Access denied. Admin privileges required.');
        console.log('[ItemDatabase] Access denied - User:', window.itemDatabase.currentUser?.uid, 'Admin:', window.itemDatabase.isAdmin);
        return;
    }
    
    try {
        const user = window.auth.currentUser;
        if (!user) {
            alert('❌ Please log in to add items to inventory.');
            return;
        }

        // Verify user is the same as our tracked current user
        if (user.uid !== window.itemDatabase.currentUser?.uid) {
            alert('❌ Authentication mismatch. Please refresh the page.');
            return;
        }

        // Use the same admin function as character selector
        if (typeof window.adminAddItemToGlobal === 'function') {
            const success = window.adminAddItemToGlobal(currentItem.id, 1);
            if (success) {
                alert(`✅ Added ${currentItem.name} to global inventory!`);
                console.log('[ItemDatabase] Item added using adminAddItemToGlobal:', currentItem.id);
            } else {
                alert('❌ Failed to add item to global inventory.');
                console.error('[ItemDatabase] adminAddItemToGlobal returned false');
            }
        } else {
            // Fallback to direct Firebase save if admin function not available
            console.warn('[ItemDatabase] adminAddItemToGlobal not available, using fallback method');
            
            // This is the corrected part.
            // We need to fetch the current inventory, add to it, then save it back.
            const userRef = window.database.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val() || {};
            
            // Get current global inventory (check both old and new formats)
            let globalInventoryData = [];
            if (userData.globalInventory) {
                if (userData.globalInventory.items && Array.isArray(userData.globalInventory.items)) {
                    // New format: wrapped object with items array
                    globalInventoryData = userData.globalInventory.items;
                } else if (Array.isArray(userData.globalInventory)) {
                    // Old format: direct array
                    globalInventoryData = userData.globalInventory;
                }
            }
            
            // Use the GlobalInventory class to add the item
            const tempInventory = new GlobalInventory();
            tempInventory.deserialize(globalInventoryData);
            tempInventory.addItem(currentItem.id, 1);
            
            // Serialize the updated inventory with the new nested format
            const updatedInventory = {
                items: tempInventory.serialize(),
                lastUpdated: Date.now()
            };
            
            // Save it back to Firebase
            await window.database.ref(`users/${user.uid}/globalInventory`).set(updatedInventory);
            
            alert(`✅ Added ${currentItem.name} to global inventory!`);
            
            // Manually update local global inventory instance
            if (window.GlobalInventory) {
                window.GlobalInventory.addItem(currentItem.id, 1);
            }
            
            // Close modal
            closeItemModal();
        }
    } catch (error) {
        console.error('Error adding item to inventory:', error);
        alert('❌ Failed to add item to inventory. Please try again.');
    }
};

/**
 * Opens the item detail modal
 * @param {string} itemId - The ID of the item to display
 */
window.showItemDetailModal = function(itemId) {
    const item = window.ItemRegistry.getItem(itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    
    // Set modal content
    const modalTitle = document.getElementById('modal-item-name');
    const modalDescription = document.getElementById('modal-item-description');
    const modalStats = document.getElementById('modal-item-stats');
    const modalMeta = document.getElementById('modal-item-meta');
    
    if (modalTitle) modalTitle.textContent = item.name;
    if (modalDescription) modalDescription.innerHTML = item.getFormattedDescription();
    if (modalStats) modalStats.innerHTML = window.itemDatabase.createModalStats(item);
    if (modalMeta) modalMeta.innerHTML = window.itemDatabase.createModalMeta(item);
    
    // Show modal
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

// ===== ADMIN INVENTORY FUNCTIONS =====
// These functions mirror the ones in character-selector.html for consistency

window.adminAddItemToGlobal = function(itemId, quantity = 1) {
    // Check if user is admin
    if (!window.itemDatabase || !window.itemDatabase.isAdmin || !window.itemDatabase.currentUser) {
        console.error('[ADMIN] Access denied. Admin privileges required.');
        return false;
    }
    
    console.log(`[ADMIN] Adding ${quantity}x ${itemId} to global inventory`);
    
    const item = window.ItemRegistry.getItem(itemId);
    if (!item) {
        console.error(`[ADMIN] Item "${itemId}" not found! Use listAvailableItems() to see valid items.`);
        return false;
    }
    
    // Initialize GlobalInventory if not exists
    if (!window.GlobalInventory) {
        window.GlobalInventory = new GlobalInventory();
    }
    
    // Add to GlobalInventory
    window.GlobalInventory.addItem(itemId, quantity);
    console.log(`[ADMIN] ✅ Successfully added ${quantity}x ${item.name} (${item.rarity}) to global inventory`);
    
    // CRITICAL: Sync userData with GlobalInventory before saving
    if (window.userData) {
        window.userData.globalInventory = window.GlobalInventory.serialize();
        console.log(`[ADMIN] 🔄 Synced userData.globalInventory`);
    }
    
    // Save to Firebase
    if (window.saveUserData) {
        window.saveUserData();
        console.log(`[ADMIN] 💾 Saved to Firebase`);
    } else {
        console.warn(`[ADMIN] ⚠️ saveUserData function not available, trying direct save...`);
        adminForceSave();
    }
    
    // Refresh UI if modal is open
    if (window.inventoryUIManager) {
        window.inventoryUIManager.renderGlobalInventory();
    }
    
    return true;
};

window.adminForceSave = async function() {
    try {
        if (!window.itemDatabase || !window.itemDatabase.currentUser) {
            console.error('[ADMIN] No user logged in');
            return;
        }
        
        const user = window.itemDatabase.currentUser;
        const userRef = window.database.ref(`users/${user.uid}`);
        
        // ONLY update the globalInventory field, don't overwrite other data
        const updateData = {
            globalInventory: window.GlobalInventory ? window.GlobalInventory.serialize() : [],
            lastActive: firebase.database.ServerValue.TIMESTAMP
        };
        
        await userRef.update(updateData);
        console.log('[ADMIN] 💾 Force saved global inventory to Firebase');
        
    } catch (error) {
        console.error('[ADMIN] Error force saving:', error);
    }
};

window.listAvailableItems = function() {
    if (!window.ItemRegistry) {
        console.error('[ADMIN] ItemRegistry not available');
        return;
    }
    
    const items = window.ItemRegistry.getAllItems();
    console.log('📋 Available Items:');
    items.forEach(item => {
        console.log(`  ${item.id} - ${item.name} (${item.rarity})`);
    });
    
    return items;
};

window.viewGlobalInventory = function() {
    if (!window.GlobalInventory) {
        console.log('[Admin] Global inventory not initialized');
        return;
    }
    console.log('[Admin] Global inventory:', window.GlobalInventory.getAllItems());
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.itemDatabase = new ItemDatabase();
});

// Add some utility functions for debugging
window.debugItemDatabase = function() {
    if (window.itemDatabase) {
        console.log('Items:', window.itemDatabase.items);
        console.log('Filtered Items:', window.itemDatabase.filteredItems);
        console.log('Current Filters:', window.itemDatabase.currentFilters);
        console.log('Current User:', window.itemDatabase.currentUser);
        console.log('Is Admin:', window.itemDatabase.isAdmin);
        console.log('Firebase Auth:', window.auth?.currentUser);
    }
};

window.debugAdminStatus = function() {
    if (window.itemDatabase) {
        console.log('=== Admin Status Debug ===');
        console.log('Current User:', window.itemDatabase.currentUser);
        console.log('Is Admin:', window.itemDatabase.isAdmin);
        console.log('Firebase Current User:', window.auth?.currentUser);
        
        const adminButton = document.getElementById('admin-add-button');
        console.log('Admin Button Element:', adminButton);
        console.log('Admin Button Hidden:', adminButton?.classList.contains('hidden'));
        
        if (window.itemDatabase.currentUser) {
            window.itemDatabase.checkUserAdminStatus(window.itemDatabase.currentUser);
        }
    }
};

window.forceHideAdminButton = function() {
    if (window.itemDatabase) {
        window.itemDatabase.forceHideAdminButton();
    }
};

window.reloadItemDatabase = function() {
    if (window.itemDatabase) {
        window.itemDatabase.init();
    }
};

window.saveUserData = async function() {
    try {
        if (!window.itemDatabase || !window.itemDatabase.currentUser) {
            console.error('[ItemDatabase] No user logged in');
            return;
        }
        
        const user = window.itemDatabase.currentUser;
        const userRef = window.database.ref(`users/${user.uid}`);
        
        // ONLY update the globalInventory field, don't overwrite other data
        const updateData = {
            globalInventory: window.GlobalInventory ? window.GlobalInventory.serialize() : [],
            lastActive: firebase.database.ServerValue.TIMESTAMP
        };
        
        await userRef.update(updateData);
        console.log('[ItemDatabase] 💾 Updated global inventory in Firebase');
        
    } catch (error) {
        console.error('[ItemDatabase] Error saving user data:', error);
    }
};
