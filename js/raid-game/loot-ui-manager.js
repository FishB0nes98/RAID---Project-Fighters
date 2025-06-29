/**
 * Loot UI Manager for Project Fighters
 * Handles the visual display of loot rewards
 */

class LootUIManager {
    constructor() {
        this.isInitialized = false;
        this.currentLootDisplay = null;
        this.modalElement = null; // Store reference to the modal
        this.gridElement = null;  // Store reference to the grid inside the modal
        this.init();
    }

    /**
     * Initialize the loot UI system
     */
    init() {
        this.createAndAttachModal(); // Call the new method
        this.isInitialized = true;
        console.log('[LootUIManager] Loot UI system initialized');
    }

    /**
     * Creates the loot rewards modal structure, appends it to body, and stores references.
     */
    createAndAttachModal() {
        // Remove any existing modal to prevent duplicates if called multiple times
        const existingModal = document.getElementById('loot-rewards-modal');
        if (existingModal) {
            existingModal.remove();
            console.log('[LootUIManager] createAndAttachModal: Removed existing modal.');
        }

        console.log('[LootUIManager] createAndAttachModal: Creating new modal structure...');
        const modal = document.createElement('div');
        modal.id = 'loot-rewards-modal';
        modal.className = 'loot-rewards-modal hidden';
        modal.innerHTML = `
            <div class="loot-rewards-container">
                <div class="loot-rewards-header">
                    <h2 class="loot-rewards-title">🎁 Loot Rewards! 🎁</h2>
                    <div class="loot-rewards-subtitle">Items obtained from stage completion</div>
                </div>
                <div class="loot-rewards-content">
                    <div class="loot-items-grid" id="loot-items-grid">
                        <!-- Loot items will be added here -->
                    </div>
                </div>
                <div class="loot-rewards-footer">
                    <button class="loot-claim-button" id="loot-claim-button">
                        ✨ Claim Rewards ✨
                    </button>
                </div>
            </div>
            <div class="loot-rewards-backdrop"></div>
        `;

        document.body.appendChild(modal);
        console.log('[LootUIManager] createAndAttachModal: Modal appended to body.');

        // Store references directly
        this.modalElement = modal;
        this.gridElement = modal.querySelector('#loot-items-grid');

        // Setup event listeners for this specific modal instance
        this.setupEventListeners(modal);
        console.log('[LootUIManager] createAndAttachModal: Event listeners setup.');

        if (!this.gridElement) {
            console.error('[LootUIManager] CRITICAL: loot-items-grid not found within the created modal!');
        }
    }

    /**
     * Setup event listeners for the loot modal
     */
    setupEventListeners(modal) {
        const claimButton = modal.querySelector('#loot-claim-button');
        // No need for backdrop event listener, as it's not used in this version.
        // const backdrop = modal.querySelector('.loot-rewards-backdrop');

        // Claim button
        claimButton.addEventListener('click', () => {
            this.hideLootRewards();
        });

        // Escape key
        // Ensure this event listener is added only once globally or managed properly
        // For simplicity, directly add to document and remove when modal is cleaned up
        // or ensure it's not duplicated.
        // Let's assume it's already handled by the global keydown listener on document.
        // If not, it needs a proper management.
        // For now, removing the direct `document.addEventListener` here to prevent duplicates
        // if `createAndAttachModal` is called multiple times.
        
        // The modal will be hidden by the game manager after XP rewards are shown
        // or by the claim button
    }

    /**
     * Show loot rewards with animation
     * @param {Array} lootItems - Array of { itemId, quantity }
     * @param {Function} onClaimed - Callback when rewards are claimed
     */
    async showLootRewards(lootItems, onClaimed = null) {
        if (!this.isInitialized) {
            console.error('[LootUIManager] UI not initialized');
            return;
        }

        if (!lootItems || lootItems.length === 0) {
            console.log('[LootUIManager] No loot to display');
            return;
        }

        console.log('[LootUIManager] Showing loot rewards:', lootItems);

        // Check if modal element is still in the DOM, if not, recreate and re-attach
        if (!document.body.contains(this.modalElement)) {
            console.warn('[LootUIManager] showLootRewards: Modal element not found in DOM, re-creating and re-attaching...');
            this.createAndAttachModal(); // This will also re-assign modalElement and gridElement
            // No need for setTimeout/await here after re-attaching, as references are direct.
        }
        
        // Defensive check, should ideally not be hit if createAndAttachModal works correctly.
        if (!this.gridElement) { 
            console.error('[LootUIManager] showLootRewards: Grid element is still null, cannot display loot.');
            return;
        }

        // Clear previous loot
        this.gridElement.innerHTML = '';

        // Store callback
        this.onClaimedCallback = onClaimed;

        // Create loot item cards
        const lootDescriptions = window.LootManager.getFormattedLootDescription(lootItems);
        lootDescriptions.forEach((loot, index) => {
            const itemCard = this.createLootItemCard(loot, index);
            this.gridElement.appendChild(itemCard);
        });

        // Show modal with animation
        this.modalElement.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.modalElement.classList.add('visible');
        });

        // Play entrance animations for items
        this.playLootItemAnimations(this.gridElement);

        // Store current display
        this.currentLootDisplay = { lootItems, onClaimed };
    }

    /**
     * Create a loot item card
     * @param {Object} loot - Loot description object
     * @param {number} index - Item index for animation delay
     * @returns {HTMLElement} The item card element
     */
    createLootItemCard(loot, index) {
        const card = document.createElement('div');
        card.className = `loot-item-card rarity-${loot.rarity}`;
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="loot-item-glow"></div>
            <div class="loot-item-image-container">
                <img src="${loot.image}" alt="${loot.name}" class="loot-item-image" />
            </div>
            <div class="loot-item-info">
                <div class="loot-item-name">${loot.name}</div>
                <div class="loot-item-rarity">${this.capitalizeFirst(loot.rarity)}</div>
                ${loot.quantity > 1 ? `<div class="loot-item-quantity-display">x${loot.quantity}</div>` : ''}
            </div>
            <div class="loot-item-description">${loot.description}</div>
            ${this.createRarityEffects(loot.rarity)}
        `;

        // Add hover effects
        card.addEventListener('mouseenter', () => {
            this.playItemHoverEffect(card);
        });

        return card;
    }

    /**
     * Create rarity-specific visual effects
     * @param {string} rarity - Item rarity
     * @returns {string} HTML string for effects
     */
    createRarityEffects(rarity) {
        let effects = '';

        switch (rarity) {
            case 'legendary':
                effects = `
                    <div class="rarity-effect legendary-effect">
                        <div class="legendary-sparkle"></div>
                        <div class="legendary-sparkle"></div>
                        <div class="legendary-sparkle"></div>
                    </div>
                `;
                break;
            case 'epic':
                effects = `
                    <div class="rarity-effect epic-effect">
                        <div class="epic-glow"></div>
                    </div>
                `;
                break;
            case 'rare':
                effects = `
                    <div class="rarity-effect rare-effect">
                        <div class="rare-shimmer"></div>
                    </div>
                `;
                break;
            default:
                effects = '';
        }

        return effects;
    }

    /**
     * Play entrance animations for loot items
     * @param {HTMLElement} grid - The loot items grid
     */
    playLootItemAnimations(grid) {
        const items = grid.querySelectorAll('.loot-item-card');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
                this.playItemDropSound();
            }, index * 150);
        });
    }

    /**
     * Play hover effect for an item
     * @param {HTMLElement} card - The item card
     */
    playItemHoverEffect(card) {
        card.classList.add('hover-effect');
        setTimeout(() => {
            card.classList.remove('hover-effect');
        }, 300);
    }

    /**
     * Hide loot rewards with animation
     */
    hideLootRewards() {
        if (!this.modalElement || !this.modalElement.classList.contains('visible')) return;

        console.log('[LootUIManager] Hiding loot rewards modal...');

        // Play exit animation
        this.modalElement.classList.remove('visible');
        this.modalElement.classList.add('hiding');

        setTimeout(() => {
            this.modalElement.classList.add('hidden');
            this.modalElement.classList.remove('hiding');
            
            // Clear current display
            this.currentLootDisplay = null;

            // Force clear any lingering backdrop effects
            this.clearBackdropEffects();

            // Call callback if provided
            if (this.onClaimedCallback) {
                this.onClaimedCallback();
                this.onClaimedCallback = null;
            }
            
            console.log('[LootUIManager] Loot rewards modal hidden');
        }, 3000);
    }

    /**
     * Force clear any lingering backdrop effects that might cause blur
     */
    clearBackdropEffects() {
        // Remove any lingering backdrop elements
        const lingerings = document.querySelectorAll('.loot-rewards-backdrop, .xp-display-backdrop');
        lingerings.forEach(element => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
        
        // Force repaint to clear any lingering backdrop-filter effects
        document.body.style.transform = 'translateZ(0)';
        requestAnimationFrame(() => {
            document.body.style.transform = '';
        });
        
        console.log('[LootUIManager] Backdrop effects cleared');
    }

    /**
     * Play item drop sound effect
     */
    playItemDropSound() {
        // You can implement sound effects here if you have audio assets
        // Example: this.playSound('sounds/item_drop.mp3');
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Show a simple loot notification (alternative to full modal)
     * @param {Array} lootItems - Array of { itemId, quantity }
     */
    showLootNotification(lootItems) {
        if (!lootItems || lootItems.length === 0) return;

        const lootDescriptions = window.LootManager.getFormattedLootDescription(lootItems);
        
        lootDescriptions.forEach((loot, index) => {
            setTimeout(() => {
                this.createFloatingLootNotification(loot);
            }, index * 500);
        });
    }

    /**
     * Create a floating loot notification
     * @param {Object} loot - Loot description object
     */
    createFloatingLootNotification(loot) {
        const notification = document.createElement('div');
        notification.className = `loot-notification rarity-${loot.rarity}`;
        notification.innerHTML = `
            <img src="${loot.image}" alt="${loot.name}" class="loot-notification-image" />
            <div class="loot-notification-text">
                <div class="loot-notification-name">${loot.displayText}</div>
                <div class="loot-notification-type">Obtained!</div>
            </div>
        `;

        // Position at center and animate
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.zIndex = '10000';

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('animate-in');
        });

        // Remove after animation
        setTimeout(() => {
            notification.classList.add('animate-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.modalElement) {
            this.modalElement.remove();
        }
        this.isInitialized = false;
        this.currentLootDisplay = null;
        this.modalElement = null;
        this.gridElement = null;
    }
}

// Initialize global loot UI manager
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.LootUIManager = new LootUIManager();
        });
    } else {
        window.LootUIManager = new LootUIManager();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LootUIManager };
}
