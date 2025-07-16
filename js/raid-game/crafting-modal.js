/**
 * Crafting Modal Manager
 * Handles the crafting interface and lootbox opening functionality
 */

class CraftingModal {
    constructor() {
        this.modal = null;
        this.currentLootbox = null;
        this.isDragging = false;
        this.isOpening = false;
        this.init();
    }

    /**
     * Initialize the crafting modal
     */
    init() {
        this.createModal();
        this.setupEventListeners();
        console.log('[CraftingModal] Initialized successfully');
    }

    /**
     * Create the crafting modal HTML
     */
    createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('crafting-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'crafting-modal';
        modal.id = 'crafting-modal';

        modal.innerHTML = `
            <div class="crafting-container">
                <div class="crafting-content">
                    <div class="crafting-header">
                        <h2 class="crafting-title">🔨 Crafting Workshop</h2>
                        <button class="crafting-close" id="crafting-close">Close</button>
                    </div>
                    
                    <div class="crafting-layout">
                        <!-- Player Inventory -->
                        <div class="crafting-inventory-section">
                            <h3 class="crafting-inventory-title">📦 Your Inventory</h3>
                            <div class="crafting-inventory-grid" id="crafting-inventory-grid">
                                <!-- Inventory items will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Lootbox Opening Section -->
                        <div class="lootbox-section">
                            <div class="lootbox-opening-area" id="lootbox-drop-zone">
                                <div class="lootbox-instructions-container">
                                    <div class="lootbox-drop-zone">✨ Drop Lootbox Here ✨</div>
                                    <div class="lootbox-instructions">
                                        Drag and drop a lootbox from your inventory to open it!<br>
                                        <small>Only one lootbox at a time</small>
                                    </div>
                                </div>
                                
                                <div class="lootbox-preview" id="lootbox-preview">
                                    <img id="lootbox-preview-img" src="" alt="Lootbox">
                                    <h3 class="lootbox-name" id="lootbox-preview-name"></h3>
                                    <button class="open-lootbox-btn" id="open-lootbox-btn">
                                        🎁 Open Lootbox 🎁
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Lootbox Opening Animation -->
            <div class="lootbox-opening" id="lootbox-opening">
                <div class="lootbox-animation-container">
                    <div class="lootbox-chest" id="lootbox-chest">
                        <img id="lootbox-chest-img" src="" alt="Opening...">
                    </div>
                    <div class="lootbox-opening-text" id="lootbox-opening-text">Opening...</div>
                    
                    <div class="lootbox-results" id="lootbox-results">
                        <!-- Results will be populated here -->
                        <button class="lootbox-continue-btn" id="lootbox-continue-btn">Continue</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const closeBtn = document.getElementById('crafting-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Setup drag and drop for lootbox area
        this.setupLootboxDropZone();

        // Setup open lootbox button
        const openBtn = document.getElementById('open-lootbox-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openLootbox());
        }

        // Setup continue button for lootbox results
        const continueBtn = document.getElementById('lootbox-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.closeLootboxAnimation());
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('visible')) {
                this.hide();
            }
        });
    }

    /**
     * Setup drag and drop functionality for lootbox area
     */
    setupLootboxDropZone() {
        const dropZone = document.getElementById('lootbox-drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('dragover');
            }
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const itemData = e.dataTransfer.getData('application/json');
            if (itemData) {
                try {
                    const data = JSON.parse(itemData);
                    this.handleLootboxDrop(data);
                } catch (error) {
                    console.error('[CraftingModal] Error parsing dropped item data:', error);
                }
            }
        });
    }

    /**
     * Handle lootbox being dropped in the drop zone
     */
    handleLootboxDrop(itemData) {
        console.log('[CraftingModal] Lootbox dropped:', itemData);
        
        // Get the item from registry
        const item = window.ItemRegistry?.getItem(itemData.itemId);
        if (!item || !item.isLootbox) {
            console.warn('[CraftingModal] Dropped item is not a lootbox:', itemData);
            return;
        }

        // Store current lootbox info
        this.currentLootbox = {
            item: item,
            sourceSlot: itemData.slotIndex,
            sourceType: itemData.sourceType // 'global' or 'character'
        };

        // Show lootbox preview
        this.showLootboxPreview(item);
    }

    /**
     * Show lootbox preview in the drop zone
     */
    showLootboxPreview(item) {
        const previewImg = document.getElementById('lootbox-preview-img');
        const previewName = document.getElementById('lootbox-preview-name');
        const preview = document.getElementById('lootbox-preview');
        const instructions = document.querySelector('.lootbox-instructions-container');

        if (previewImg && previewName && preview && instructions) {
            previewImg.src = item.image;
            previewImg.alt = item.name;
            previewName.textContent = item.name;
            
            instructions.style.display = 'none';
            preview.classList.add('visible');
        }
    }

    /**
     * Clear lootbox preview
     */
    clearLootboxPreview() {
        const preview = document.getElementById('lootbox-preview');
        const instructions = document.querySelector('.lootbox-instructions-container');

        if (preview && instructions) {
            preview.classList.remove('visible');
            instructions.style.display = 'block';
        }

        this.currentLootbox = null;
    }

    /**
     * Open the current lootbox
     */
    async openLootbox() {
        if (!this.currentLootbox || this.isOpening) return;

        this.isOpening = true;
        const { item, sourceSlot, sourceType } = this.currentLootbox;

        console.log('[CraftingModal] Opening lootbox:', item.name);

        // Show opening animation
        this.showLootboxAnimation(item);

        // Simulate opening delay
        await this.delay(2000);

        // Get a character reference for opening (use current user's first character or create temp)
        const character = this.getCurrentCharacter();
        
        // Open the lootbox (await if it's async)
        const result = await item.openLootbox(character);
        
        if (result.success) {
            console.log('[CraftingModal] Lootbox opened successfully:', result);
            
            // Remove one lootbox from inventory and save to Firebase
            await this.removeLootboxFromInventory(sourceSlot, sourceType);
            
            // Add items to global inventory and save to Firebase
            await this.addItemsToGlobalInventory(result.items);
            
            // Check for special rewards (skin drops)
            if (result.specialRewards && result.specialRewards.length > 0) {
                // Show special skin drop effect first
                await this.showSkinDropEffect(result.specialRewards);
                // Then show normal results
                this.showLootboxResults(result.items, item, result.specialRewards);
            } else {
                // Show normal results
                this.showLootboxResults(result.items, item);
            }
        } else {
            console.error('[CraftingModal] Failed to open lootbox:', result.message);
            this.closeLootboxAnimation();
        }

        this.isOpening = false;
    }

    /**
     * Show lootbox opening animation
     */
    showLootboxAnimation(item) {
        const openingModal = document.getElementById('lootbox-opening');
        const chestImg = document.getElementById('lootbox-chest-img');
        const openingText = document.getElementById('lootbox-opening-text');

        if (openingModal && chestImg && openingText) {
            chestImg.src = item.image;
            chestImg.alt = item.name;
            openingText.textContent = `Opening ${item.name}...`;
            
            openingModal.classList.add('visible');
        }
    }

    /**
     * Show special skin drop effect
     */
    async showSkinDropEffect(specialRewards) {
        const skin = specialRewards.find(reward => reward.type === 'skin');
        if (!skin) return;
        
        // Create skin drop effect overlay
        const overlay = document.createElement('div');
        overlay.className = 'skin-drop-overlay';
        overlay.innerHTML = `
            <div class="skin-drop-content">
                <div class="skin-drop-sparkles">✨🎬✨</div>
                <div class="skin-drop-title">RARE SKIN DROPPED!</div>
                <div class="skin-drop-name">${skin.skinName}</div>
                <div class="skin-drop-subtitle">Video skin unlocked for ${skin.characterId.replace('_', ' ')}</div>
                <div class="skin-drop-continue">Click to continue...</div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Add styles if not already present
        if (!document.querySelector('#skin-drop-styles')) {
            const styles = document.createElement('style');
            styles.id = 'skin-drop-styles';
            styles.textContent = `
                .skin-drop-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,215,0,0.9) 0%, rgba(255,140,0,0.8) 50%, rgba(0,0,0,0.9) 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: skinDropFadeIn 0.5s ease-out;
                }
                
                .skin-drop-content {
                    text-align: center;
                    animation: skinDropBounce 1s ease-out;
                }
                
                .skin-drop-sparkles {
                    font-size: 48px;
                    margin-bottom: 20px;
                    animation: skinDropSparkle 2s infinite;
                }
                
                .skin-drop-title {
                    font-size: 36px;
                    font-weight: bold;
                    color: #FFD700;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    margin-bottom: 15px;
                    letter-spacing: 2px;
                }
                
                .skin-drop-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #FFF;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    margin-bottom: 10px;
                }
                
                .skin-drop-subtitle {
                    font-size: 18px;
                    color: #FFF;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    margin-bottom: 30px;
                    text-transform: capitalize;
                }
                
                .skin-drop-continue {
                    font-size: 16px;
                    color: #FFD700;
                    opacity: 0.8;
                    animation: skinDropPulse 2s infinite;
                }
                
                @keyframes skinDropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes skinDropBounce {
                    0% { transform: scale(0.3) translateY(-100px); opacity: 0; }
                    50% { transform: scale(1.1) translateY(0); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                
                @keyframes skinDropSparkle {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(5deg) scale(1.1); }
                    50% { transform: rotate(-5deg) scale(1.2); }
                    75% { transform: rotate(5deg) scale(1.1); }
                }
                
                @keyframes skinDropPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Return promise that resolves when user clicks or after timeout
        return new Promise((resolve) => {
            let resolved = false;
            
            const resolveOnce = () => {
                if (resolved) return;
                resolved = true;
                
                overlay.style.animation = 'skinDropFadeIn 0.3s ease-in reverse';
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 300);
            };
            
            // Click to continue
            overlay.addEventListener('click', resolveOnce);
            
            // Auto-continue after 5 seconds if user doesn't click
            setTimeout(() => {
                console.log('[CraftingModal] Auto-continuing skin drop effect after timeout');
                resolveOnce();
            }, 5000);
            
            // Also add keyboard support (Enter or Space)
            const keyHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    document.removeEventListener('keydown', keyHandler);
                    resolveOnce();
                }
            };
            document.addEventListener('keydown', keyHandler);
        });
    }

    /**
     * Show lootbox opening results
     */
    showLootboxResults(items, lootboxItem, specialRewards = []) {
        const resultsContainer = document.getElementById('lootbox-results');
        const openingText = document.getElementById('lootbox-opening-text');

        if (!resultsContainer || !openingText) return;

        // Update opening text
        openingText.textContent = `${lootboxItem.name} Opened!`;

        // Clear previous results
        const existingRewards = resultsContainer.querySelectorAll('.lootbox-reward');
        existingRewards.forEach(reward => reward.remove());

        let rewardIndex = 0;

        // Add special rewards first (like skin drops)
        specialRewards.forEach((specialReward) => {
            if (specialReward.type === 'skin') {
                const skinRewardElement = this.createSkinRewardElement(specialReward);
                
                // Add with delay for dramatic effect
                setTimeout(() => {
                    resultsContainer.insertBefore(skinRewardElement, resultsContainer.lastElementChild);
                }, rewardIndex * 300);
                
                rewardIndex++;
            }
        });

        // Add each regular item reward
        items.forEach((itemReward) => {
            const rewardItem = window.ItemRegistry?.getItem(itemReward.itemId);
            if (rewardItem) {
                const rewardElement = this.createRewardElement(rewardItem, itemReward.quantity);
                
                // Add with delay for dramatic effect
                setTimeout(() => {
                    resultsContainer.insertBefore(rewardElement, resultsContainer.lastElementChild);
                }, rewardIndex * 300);
                
                rewardIndex++;
            }
        });

        // Show results after a short delay
        setTimeout(() => {
            resultsContainer.classList.add('visible');
        }, 500);
    }

    /**
     * Create a reward element for display
     */
    createRewardElement(item, quantity) {
        const rewardDiv = document.createElement('div');
        rewardDiv.className = `lootbox-reward rarity-${item.rarity}`;
        
        rewardDiv.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="lootbox-reward-info">
                <div class="lootbox-reward-name">${item.name}</div>
                <div class="lootbox-reward-quantity">Quantity: ${quantity}</div>
            </div>
        `;
        
        return rewardDiv;
    }

    /**
     * Create a skin reward element for display
     */
    createSkinRewardElement(skinReward) {
        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'lootbox-reward rarity-legendary skin-reward';
        
        // Get skin from registry for display info
        const skin = window.SkinRegistry?.getSkin(skinReward.skinId);
        const displayName = skin ? skin.name : skinReward.skinName;
        const characterName = skinReward.characterId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        rewardDiv.innerHTML = `
            <div class="skin-reward-icon">🎬</div>
            <div class="lootbox-reward-info">
                <div class="lootbox-reward-name">${displayName}</div>
                <div class="lootbox-reward-quantity">Video Skin - ${characterName}</div>
                <div class="skin-reward-badge">✨ RARE SKIN UNLOCKED ✨</div>
            </div>
        `;
        
        return rewardDiv;
    }

    /**
     * Close lootbox animation and return to crafting modal
     */
    closeLootboxAnimation() {
        const openingModal = document.getElementById('lootbox-opening');
        const resultsContainer = document.getElementById('lootbox-results');

        if (openingModal) {
            openingModal.classList.remove('visible');
        }

        if (resultsContainer) {
            resultsContainer.classList.remove('visible');
        }

        // Clear lootbox preview
        this.clearLootboxPreview();

        // Refresh inventory display
        this.refreshInventory();
    }

    /**
     * Remove lootbox from inventory after opening and save to Firebase
     */
    async removeLootboxFromInventory(slotIndex, sourceType) {
        if (sourceType === 'global' && window.GlobalInventory) {
            const removed = window.GlobalInventory.removeItem(slotIndex, 1);
            console.log('[CraftingModal] Removed lootbox from global inventory:', removed);
            
            // Save the removal to Firebase
            await this.saveToFirebase();
        } else if (sourceType === 'character' && window.CharacterInventories) {
            // Handle character inventory removal if needed
            console.log('[CraftingModal] Character inventory lootbox removal not implemented yet');
        }
    }

    /**
     * Add opened items to global inventory and save to Firebase
     */
    async addItemsToGlobalInventory(items) {
        if (!window.GlobalInventory) return;

        items.forEach(itemReward => {
            window.GlobalInventory.addItem(itemReward.itemId, itemReward.quantity);
            console.log(`[CraftingModal] Added ${itemReward.quantity}x ${itemReward.itemId} to global inventory`);
        });

        // Save to Firebase if user is logged in
        await this.saveToFirebase();
    }

    /**
     * Save global inventory to Firebase
     */
    async saveToFirebase() {
        try {
            // Check if Firebase and user authentication are available
            if (!this.isUserAuthenticated()) {
                console.log('[CraftingModal] User not authenticated, skipping Firebase save');
                return;
            }

            const user = this.getCurrentUser();
            if (!user) {
                console.log('[CraftingModal] No user found, skipping Firebase save');
                return;
            }

            console.log('[CraftingModal] Saving inventory for user:', user.uid);

            // Update userData if available
            if (window.userData) {
                window.userData.globalInventory = window.GlobalInventory.serialize();
                console.log('[CraftingModal] Updated userData.globalInventory');
            }

            // Save to Firebase database
            const userRef = firebase.database().ref(`users/${user.uid}`);
            const updateData = {
                globalInventory: window.GlobalInventory.serialize(),
                lastActive: firebase.database.ServerValue.TIMESTAMP
            };

            await userRef.update(updateData);
            console.log('[CraftingModal] ✅ Successfully saved global inventory to Firebase');

            // Also call the global save function if available
            if (typeof window.saveUserData === 'function') {
                await window.saveUserData();
            }

        } catch (error) {
            console.error('[CraftingModal] Error saving to Firebase:', error);
            
            // Show user-friendly error message
            if (error.code === 'PERMISSION_DENIED') {
                console.warn('[CraftingModal] Permission denied - user may not have write access');
            } else {
                console.error('[CraftingModal] Unexpected error during save:', error.message);
            }
        }
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        try {
            return typeof firebase !== 'undefined' && 
                   firebase.auth && 
                   firebase.auth().currentUser !== null;
        } catch (error) {
            console.error('[CraftingModal] Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        try {
            if (this.isUserAuthenticated()) {
                return firebase.auth().currentUser;
            }
            return null;
        } catch (error) {
            console.error('[CraftingModal] Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get current character for lootbox opening
     */
    getCurrentCharacter() {
        // Try to get current user's first character or create a temporary one
        if (window.characters && window.characters.length > 0) {
            return window.characters[0];
        }
        
        // Create a temporary character for lootbox opening
        return {
            id: 'temp_character',
            name: 'Temporary Character',
            stats: {},
            consumableCooldowns: {}
        };
    }

    /**
     * Show the crafting modal
     */
    show() {
        if (!this.modal) {
            this.createModal();
            this.setupEventListeners();
        }

        this.modal.classList.add('visible');
        this.refreshInventory();
        
        console.log('[CraftingModal] Modal shown');
    }

    /**
     * Hide the crafting modal
     */
    hide() {
        if (this.modal) {
            this.modal.classList.remove('visible');
            this.clearLootboxPreview();
        }
        
        console.log('[CraftingModal] Modal hidden');
    }

    /**
     * Refresh inventory display
     */
    refreshInventory() {
        this.populateInventoryGrid();
    }

    /**
     * Populate the inventory grid with items
     */
    populateInventoryGrid() {
        const grid = document.getElementById('crafting-inventory-grid');
        if (!grid) {
            console.error('[CraftingModal] Inventory grid element not found');
            return;
        }

        // Clear existing items
        grid.innerHTML = '';

        console.log('[CraftingModal] Populating inventory grid...');
        console.log('[CraftingModal] window.GlobalInventory exists:', !!window.GlobalInventory);
        console.log('[CraftingModal] window.ItemRegistry exists:', !!window.ItemRegistry);

        // Get global inventory items
        if (window.GlobalInventory) {
            console.log('[CraftingModal] GlobalInventory available, checking methods...');
            console.log('[CraftingModal] GlobalInventory instance:', window.GlobalInventory);
            console.log('[CraftingModal] GlobalInventory constructor:', window.GlobalInventory.constructor.name);
            
            // Check if GlobalInventory has items
            console.log('[CraftingModal] GlobalInventory.items:', window.GlobalInventory.items);
            console.log('[CraftingModal] GlobalInventory.items length:', window.GlobalInventory.items?.length);
            console.log('[CraftingModal] GlobalInventory.items is array:', Array.isArray(window.GlobalInventory.items));
            
            let itemStacks = [];
            
            if (typeof window.GlobalInventory.getItemStacks === 'function') {
                itemStacks = window.GlobalInventory.getItemStacks();
                console.log('[CraftingModal] Got item stacks via getItemStacks():', itemStacks);
            } else {
                console.error('[CraftingModal] getItemStacks method not available');
                return;
            }
            
            console.log('[CraftingModal] Processing', itemStacks.length, 'item stacks');
            
            if (Array.isArray(itemStacks) && itemStacks.length > 0) {
                let slotsCreated = 0;
                itemStacks.forEach((stack, index) => {
                    if (stack && stack.itemId) {
                        const item = window.ItemRegistry?.getItem(stack.itemId);
                        if (item) {
                            console.log(`[CraftingModal] Creating slot for ${item.name} (${stack.quantity}) - isLootbox: ${!!item.isLootbox}`);
                            const slotElement = this.createInventorySlot(item, stack.quantity, index, 'global');
                            grid.appendChild(slotElement);
                            slotsCreated++;
                        } else {
                            console.warn(`[CraftingModal] Item not found in registry: ${stack.itemId}`);
                        }
                    }
                });
                console.log(`[CraftingModal] Created ${slotsCreated} inventory slots`);
            } else {
                console.warn('[CraftingModal] No items found in global inventory');
                
                // Show a message in the grid
                const noItemsMessage = document.createElement('div');
                noItemsMessage.className = 'no-items-message';
                noItemsMessage.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #888;">
                        <p>No items in your global inventory</p>
                        <p style="font-size: 0.9em;">Try using the test function: <code>testCraftingModal()</code></p>
                    </div>
                `;
                grid.appendChild(noItemsMessage);
            }
        } else {
            console.error('[CraftingModal] GlobalInventory not available');
            
            // Show error message in the grid
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #f44;">
                    <p>❌ Global inventory system not loaded</p>
                    <p style="font-size: 0.9em;">Please refresh the page and try again</p>
                </div>
            `;
            grid.appendChild(errorMessage);
        }

        // Add empty slots for visual consistency
        const currentSlots = grid.children.length;
        const minSlots = 24; // Show at least 24 slots
        for (let i = currentSlots; i < minSlots; i++) {
            const emptySlot = this.createEmptySlot();
            grid.appendChild(emptySlot);
        }
    }

    /**
     * Create an inventory slot element
     */
    createInventorySlot(item, quantity, slotIndex, sourceType) {
        const slot = document.createElement('div');
        slot.className = `crafting-inventory-slot rarity-${item.rarity}`;
        
        // Only make lootboxes draggable
        if (item.isLootbox) {
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => {
                const itemData = {
                    itemId: item.id,
                    slotIndex: slotIndex,
                    sourceType: sourceType,
                    quantity: 1 // Only allow dragging 1 lootbox at a time
                };
                e.dataTransfer.setData('application/json', JSON.stringify(itemData));
                slot.classList.add('dragging');
            });

            slot.addEventListener('dragend', () => {
                slot.classList.remove('dragging');
            });
        }

        slot.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            ${quantity > 1 ? `<div class="item-quantity">${quantity}</div>` : ''}
        `;

        // Add tooltip
        slot.title = `${item.name}\n${item.description}`;

        return slot;
    }

    /**
     * Create an empty inventory slot
     */
    createEmptySlot() {
        const slot = document.createElement('div');
        slot.className = 'crafting-inventory-slot';
        return slot;
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destroy the crafting modal
     */
    destroy() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        this.currentLootbox = null;
        this.isDragging = false;
        this.isOpening = false;
    }
}

// Global instance
window.CraftingModal = new CraftingModal();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraftingModal;
}
