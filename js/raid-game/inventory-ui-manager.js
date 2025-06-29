/**
 * Inventory UI Manager
 * Handles the inventory interface for character selector
 */

class InventoryUIManager {
    constructor() {
        this.currentCharacterId = null;
        this.currentCharacterInventory = null;
        this.isDragging = false;
        this.dragItem = null;
        this.dragSource = null;
        this.modal = null;
        this.tooltip = null;
        this.init();
    }

    /**
     * Initialize the inventory UI manager
     */
    init() {
        this.createModal();
        this.createTooltip();
        this.setupEventListeners();
    }

    /**
     * Create the inventory modal HTML
     */
    createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('inventory-modal');
        if (existingModal) {
            console.log('[InventoryUI] Removing existing modal before creating new one');
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'inventory-modal';
        modal.id = 'inventory-modal';
        
        modal.innerHTML = `
            <div class="inventory-container">
                <div class="inventory-header">
                    <h2 class="inventory-title">Inventory Management</h2>
                    <button class="inventory-close" id="inventory-close">Close</button>
                </div>
                
                <div class="inventory-layout">
                    <!-- Character Inventory -->
                    <div class="inventory-section">
                        <h3 id="character-inventory-title">Character Inventory (6 slots)</h3>
                        <div class="character-inventory-grid" id="character-inventory-grid">
                            <!-- Character inventory slots will be generated here -->
                        </div>
                    </div>
                    
                    <!-- Global Inventory -->
                    <div class="inventory-section">
                        <h3>Global Inventory</h3>
                        <div class="global-inventory-grid" id="global-inventory-grid">
                            <!-- Global inventory items will be generated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        console.log('[InventoryUI] New modal created and added to DOM');
    }

    /**
     * Create tooltip for item information
     */
    createTooltip() {
        // Remove existing tooltip if it exists
        const existingTooltip = document.getElementById('item-tooltip');
        if (existingTooltip) {
            console.log('[InventoryUI] Removing existing tooltip before creating new one');
            existingTooltip.remove();
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.id = 'item-tooltip';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
        console.log('[InventoryUI] New tooltip created and added to DOM');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('[InventoryUI] Setting up event listeners...');
        
        // Close modal - use querySelector to ensure we get the right element
        const closeButton = this.modal.querySelector('#inventory-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                console.log('[InventoryUI] Close button clicked');
                this.closeModal();
            });
            console.log('[InventoryUI] Close button listener attached');
        } else {
            console.error('[InventoryUI] Close button not found in modal');
        }

        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                console.log('[InventoryUI] Backdrop clicked, closing modal');
                this.closeModal();
            }
        });

        // ESC key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('visible')) {
                console.log('[InventoryUI] Escape key pressed, closing modal');
                this.closeModal();
            }
        };

        // Add drop listeners to global inventory grid for endless functionality
        const globalGrid = this.modal.querySelector('#global-inventory-grid');
        if (globalGrid) {
            globalGrid.addEventListener('dragover', this.handleDragOver.bind(this));
            globalGrid.addEventListener('dragleave', this.handleDragLeave.bind(this));
            globalGrid.addEventListener('drop', this.handleDrop.bind(this));
        }
        
        // Store reference for cleanup
        this.escapeHandler = escapeHandler;
        document.addEventListener('keydown', escapeHandler);

        // Mouse move for tooltip positioning
        const mouseMoveHandler = (e) => {
            if (this.tooltip && this.tooltip.classList.contains('visible')) {
                this.positionTooltip(e.clientX, e.clientY);
            }
        };
        
        // Store reference for cleanup
        this.mouseMoveHandler = mouseMoveHandler;
        document.addEventListener('mousemove', mouseMoveHandler);
        
        console.log('[InventoryUI] All event listeners set up successfully');
    }

    /**
     * Open inventory modal for a character
     * @param {string} characterId - The character ID
     */
    async openModal(characterId) {
        console.log(`[InventoryUI] Opening inventory modal for character: ${characterId}`);
        
        // Ensure modal exists and is properly set up
        if (!this.modal || !document.getElementById('inventory-modal')) {
            console.log('[InventoryUI] Modal missing, reinitializing...');
            this.init();
        }
        
        this.currentCharacterId = characterId;
        
        // Load character inventory
        await this.loadCharacterInventory(characterId);
        console.log(`[InventoryUI] Character inventory loaded:`, this.currentCharacterInventory);
        
        // Load global inventory
        await this.loadGlobalInventory();
        console.log(`[InventoryUI] Global inventory loaded:`, window.GlobalInventory.getAllItems());
        
        // Update title
        const titleElement = document.getElementById('character-inventory-title');
        if (titleElement) {
            const characterName = this.getCharacterName(characterId);
            titleElement.textContent = `${characterName} Inventory (6 slots)`;
        } else {
            console.warn('[InventoryUI] Title element not found - modal may not be properly initialized');
        }
        
        // Render inventories
        this.renderCharacterInventory();
        this.renderGlobalInventory();
        
        // Show modal
        if (this.modal) {
            this.modal.classList.add('visible');
            console.log(`[InventoryUI] Modal opened and visible`);
        } else {
            console.error('[InventoryUI] Failed to open modal - modal element is null');
            throw new Error('Modal element is not available');
        }
    }

    /**
     * Close inventory modal
     */
    closeModal() {
        console.log('[InventoryUI] Closing inventory modal');
        
        if (this.modal) {
            this.modal.classList.remove('visible');
            console.log('[InventoryUI] Modal hidden');
        }
        
        this.hideTooltip();
        
        // Save inventories when closing
        if (this.currentCharacterId && this.currentCharacterInventory) {
            console.log('[InventoryUI] Saving character inventory for:', this.currentCharacterId);
            this.saveCharacterInventory();
        }
        
        console.log('[InventoryUI] Saving global inventory');
        this.saveGlobalInventory();
        
        console.log('[InventoryUI] Modal closed successfully');
    }

    /**
     * Open global inventory modal (raid game only)
     */
    async openGlobalInventoryModal() {
        console.log('[InventoryUI] Opening global inventory modal');
        
        // Load global inventory
        await this.loadGlobalInventory();
        
        // Create a redesigned modal for global inventory
        let globalModal = document.getElementById('global-inventory-modal');
        if (!globalModal) {
            console.log('[InventoryUI] Creating new global inventory modal');
            globalModal = document.createElement('div');
            globalModal.className = 'global-inventory-modal';
            globalModal.id = 'global-inventory-modal';
            
            globalModal.innerHTML = `
                <div class="global-inventory-container">
                    <div class="global-inventory-header">
                        <div class="header-left">
                            <div class="inventory-icon">⚔️</div>
                            <div class="header-text">
                                <h2 class="global-inventory-title">Treasure Vault</h2>
                                <p class="inventory-subtitle">Your collected items and equipment</p>
                            </div>
                        </div>
                        <div class="header-right">
                            <div class="inventory-count">
                                <span class="count-label">Items:</span>
                                <span class="count-number" id="global-item-count">0</span>
                            </div>
                            <button class="modern-close-btn" id="global-inventory-close">✕</button>
                        </div>
                    </div>
                    
                    <div class="inventory-controls">
                        <div class="search-container">
                            <input type="text" 
                                   id="global-inventory-search" 
                                   class="inventory-search" 
                                   placeholder="🔍 Search items...">
                        </div>
                        <div class="filter-container">
                            <select id="global-inventory-filter" class="inventory-filter">
                                <option value="all">All Items</option>
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="epic">Epic</option>
                                <option value="legendary">Legendary</option>
                            </select>
                        </div>
                        <div class="sort-container">
                            <select id="global-inventory-sort" class="inventory-sort">
                                <option value="name">Sort by Name</option>
                                <option value="rarity">Sort by Rarity</option>
                                <option value="type">Sort by Type</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="global-inventory-content">
                        <div class="inventory-grid-container">
                            <div class="global-inventory-grid-modern" id="global-inventory-grid-raid">
                                <!-- Items will be rendered here -->
                            </div>
                        </div>
                        
                        <div class="inventory-sidebar">
                            <div class="item-preview" id="item-preview">
                                <div class="preview-placeholder">
                                    <div class="preview-icon">👁️</div>
                                    <p>Hover over an item to preview</p>
                                </div>
                            </div>
                            
                            <div class="inventory-stats">
                                <h4>Collection Stats</h4>
                                <div class="stat-row">
                                    <span>Total Items:</span>
                                    <span id="total-items">0</span>
                                </div>
                                <div class="stat-row">
                                    <span>Common:</span>
                                    <span id="common-count">0</span>
                                </div>
                                <div class="stat-row">
                                    <span>Rare:</span>
                                    <span id="rare-count">0</span>
                                </div>
                                <div class="stat-row">
                                    <span>Epic:</span>
                                    <span id="epic-count">0</span>
                                </div>
                                <div class="stat-row">
                                    <span>Legendary:</span>
                                    <span id="legendary-count">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="inventory-background-effects">
                    <div class="floating-particle"></div>
                    <div class="floating-particle"></div>
                    <div class="floating-particle"></div>
                    <div class="floating-particle"></div>
                    <div class="floating-particle"></div>
                </div>
            `;
            
            document.body.appendChild(globalModal);
            
            // Add close event listener
            globalModal.querySelector('#global-inventory-close').addEventListener('click', () => {
                globalModal.classList.remove('visible');
                this.hideTooltip();
            });
            
            // Close on outside click
            globalModal.addEventListener('click', (e) => {
                if (e.target === globalModal) {
                    globalModal.classList.remove('visible');
                    this.hideTooltip();
                }
            });
            
            // Add search functionality
            const searchInput = globalModal.querySelector('#global-inventory-search');
            searchInput.addEventListener('input', (e) => {
                this.filterGlobalInventory(e.target.value, 'search');
            });
            
            // Add filter functionality
            const filterSelect = globalModal.querySelector('#global-inventory-filter');
            filterSelect.addEventListener('change', (e) => {
                this.filterGlobalInventory(e.target.value, 'filter');
            });
            
            // Add sort functionality
            const sortSelect = globalModal.querySelector('#global-inventory-sort');
            sortSelect.addEventListener('change', (e) => {
                this.sortGlobalInventory(e.target.value);
            });
        }
        
        // Render global inventory items with enhanced design
        this.renderGlobalInventoryModern();
        this.updateInventoryStats();
        
        // Show modal
        globalModal.classList.add('visible');
        console.log('[InventoryUI] Global inventory modal opened and visible');
    }
    
    /**
     * Render global inventory in read-only mode
     */
    renderGlobalInventoryReadOnly() {
        const grid = document.getElementById('global-inventory-grid-raid');
        if (!grid) return;
        
        grid.innerHTML = '';

        const globalItems = window.GlobalInventory.getAllItems();
        
        if (globalItems.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'inventory-empty-message';
            emptyMessage.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px 20px;
                color: #888;
                font-style: italic;
            `;
            emptyMessage.textContent = 'No items in global inventory';
            grid.appendChild(emptyMessage);
            return;
        }

        globalItems.forEach((itemId, index) => {
            const item = window.ItemRegistry.getItem(itemId);
            if (item) {
                const slot = this.createInventorySlot(index, 'global-readonly');
                this.populateSlot(slot, item, index, 'global-readonly');
                
                // Remove drag functionality
                slot.draggable = false;
                slot.addEventListener('dragstart', (e) => e.preventDefault());
                
                grid.appendChild(slot);
            }
        });
    }

    /**
     * Load character inventory from storage
     * @param {string} characterId - The character ID
     */
    async loadCharacterInventory(characterId) {
        console.log(`Loading character inventory for: ${characterId}`);
        
        // Check if inventory already exists in memory
        if (window.CharacterInventories.has(characterId)) {
            this.currentCharacterInventory = window.CharacterInventories.get(characterId);
            console.log('Loaded character inventory from memory');
            return this.currentCharacterInventory;
        }

        try {
            // Try to load from Firebase if available
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const inventoryRef = firebase.database().ref(`users/${user.uid}/characterInventories/${characterId}`);
                const snapshot = await inventoryRef.once('value');
                const inventoryData = snapshot.val();
                
                if (inventoryData) {
                    this.currentCharacterInventory = CharacterInventory.deserialize(inventoryData);
                    console.log('Loaded character inventory from Firebase:', inventoryData);
                } else {
                    // Create new inventory
                    this.currentCharacterInventory = new CharacterInventory(characterId, 6);
                    console.log('Created new character inventory (no Firebase data)');
                }
            } else {
                // Create new inventory if no Firebase
                this.currentCharacterInventory = new CharacterInventory(characterId, 6);
                console.log('Created new character inventory (no Firebase auth)');
            }
        } catch (error) {
            console.error('Failed to load character inventory:', error);
            // Fallback to new inventory
            this.currentCharacterInventory = new CharacterInventory(characterId, 6);
            console.log('Created fallback character inventory');
        }

        // Store in memory
        window.CharacterInventories.set(characterId, this.currentCharacterInventory);
        console.log('Character inventory stored in memory');
        return this.currentCharacterInventory;
    }

    /**
     * Save character inventory to storage
     */
    async saveCharacterInventory() {
        if (!this.currentCharacterId || !this.currentCharacterInventory) {
            console.warn('⚠️ Cannot save character inventory - missing character ID or inventory');
            return;
        }

        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const inventoryRef = firebase.database().ref(`users/${user.uid}/characterInventories/${this.currentCharacterId}`);
                const serializedData = this.currentCharacterInventory.serialize();
                
                // Validate data before sending to Firebase
                const hasUndefinedValues = JSON.stringify(serializedData).includes('undefined');
                if (hasUndefinedValues) {
                    console.error('❌ [SaveCharacter] Data contains undefined values!', serializedData);
                    throw new Error('Cannot save data with undefined values to Firebase');
                }
                
                console.log(`💾 [SaveCharacter] Saving inventory for ${this.currentCharacterId}:`, serializedData);
                await inventoryRef.set(serializedData);
                console.log('✅ Character inventory saved successfully to Firebase');
                
                // Verify what was actually saved
                const savedData = await inventoryRef.once('value');
                console.log('🔍 [SaveCharacter] Verification - Data in Firebase after save:', savedData.val());
                
            } else {
                console.warn('⚠️ No Firebase auth available - character inventory not saved');
            }
        } catch (error) {
            console.error('❌ Failed to save character inventory:', error);
            console.error('❌ Character inventory state:', this.currentCharacterInventory?.items);
        }
    }

    /**
     * Load global inventory from storage
     */
    async loadGlobalInventory() {
        console.log('[InventoryUI] === LOADING GLOBAL INVENTORY ===');
        console.log('[InventoryUI] Current global inventory before loading:', window.GlobalInventory ? window.GlobalInventory.getAllItems() : 'GlobalInventory not available');
        
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                console.log('[InventoryUI] Loading from Firebase for user:', user.uid);
                
                const globalRef = firebase.database().ref(`users/${user.uid}/globalInventory`);
                const snapshot = await globalRef.once('value');
                const inventoryData = snapshot.val();
                
                console.log('[InventoryUI] Firebase inventory data received:', inventoryData);
                
                if (inventoryData) {
                    if (inventoryData.items && Array.isArray(inventoryData.items)) {
                        // New format: wrapped object with items array
                        console.log('[InventoryUI] Found new format inventory data, deserializing...');
                        window.GlobalInventory.deserialize(inventoryData.items);
                        console.log('[InventoryUI] Loaded user inventory from Firebase (new format):', window.GlobalInventory.getAllItems());
                    } else if (Array.isArray(inventoryData)) {
                        // Old format: direct array (backward compatibility)
                        console.log('[InventoryUI] Found old format inventory data, deserializing...');
                        window.GlobalInventory.deserialize(inventoryData);
                        console.log('[InventoryUI] Loaded user inventory from Firebase (old format):', window.GlobalInventory.getAllItems());
                    } else {
                        // Unknown format, start fresh
                        console.log('[InventoryUI] Unknown inventory format, starting with empty inventory');
                        window.GlobalInventory.items = [];
                    }
                } else {
                    console.log('[InventoryUI] No existing inventory found - user starts with empty inventory');
                    console.log('[InventoryUI] Ensuring inventory is empty...');
                    // Ensure inventory is empty
                    window.GlobalInventory.items = [];
                    console.log('[InventoryUI] Confirmed empty inventory:', window.GlobalInventory.getAllItems());
                }
            } else {
                console.log('[InventoryUI] No Firebase auth, using local storage or empty inventory');
                
                // Try local storage first
                const localInventory = localStorage.getItem('globalInventory');
                if (localInventory) {
                    try {
                        const inventoryData = JSON.parse(localInventory);
                        console.log('[InventoryUI] Found local storage inventory:', inventoryData);
                        window.GlobalInventory.deserialize(inventoryData);
                        console.log('[InventoryUI] Loaded inventory from local storage');
                    } catch (e) {
                        console.error('[InventoryUI] Failed to parse local inventory:', e);
                        // Start with empty inventory
                        window.GlobalInventory.items = [];
                    }
                } else {
                    // Start with empty inventory
                    console.log('[InventoryUI] No local storage found, starting with empty inventory');
                    window.GlobalInventory.items = [];
                }
            }
        } catch (error) {
            console.error('[InventoryUI] Failed to load global inventory:', error);
            // Start with empty inventory on error
            window.GlobalInventory.items = [];
        }
        
        console.log('[InventoryUI] === GLOBAL INVENTORY LOADING COMPLETE ===');
        console.log('[InventoryUI] Final global inventory items:', window.GlobalInventory.getAllItems());
        console.log('[InventoryUI] Total items count:', window.GlobalInventory.getAllItems().length);
    }

    /**
     * Add starter items to global inventory (DISABLED - users should earn items through gameplay)
     */
    addStarterItems() {
        console.log('[InventoryUI] addStarterItems() called but DISABLED - users should earn items through gameplay');
        // Do nothing - users should start with empty inventories
    }

    /**
     * Add default items to global inventory (DISABLED - users should earn items through gameplay)
     */
    addDefaultItems() {
        console.log('[InventoryUI] addDefaultItems() called but DISABLED - users should earn items through gameplay');
        // Do nothing - users should start with empty inventories
    }

    /**
     * Save global inventory to storage
     */
    async saveGlobalInventory() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const globalRef = firebase.database().ref(`users/${user.uid}/globalInventory`);
                
                // Get the actual internal items and serialized data for comparison
                const internalItems = window.GlobalInventory.items;
                const serializedItems = window.GlobalInventory.serialize();
                
                // Use consistent format with loot manager
                const serializedData = {
                    items: serializedItems,
                    lastUpdated: Date.now()
                };
                
                console.log('💾 [SaveInventory] Internal GlobalInventory.items:', internalItems);
                console.log('💾 [SaveInventory] Serialized items:', serializedItems);
                console.log('💾 [SaveInventory] Final data being saved to Firebase:', serializedData);
                
                await globalRef.set(serializedData);
                console.log('✅ Global inventory saved successfully to Firebase');
                
                // Verify what was actually saved
                const savedData = await globalRef.once('value');
                console.log('🔍 [SaveInventory] Verification - Data in Firebase after save:', savedData.val());
                
            } else {
                console.warn('⚠️ No Firebase auth available - global inventory not saved');
            }
        } catch (error) {
            console.error('❌ Failed to save global inventory:', error);
        }
    }

    /**
     * Render character inventory grid
     */
    renderCharacterInventory() {
        const grid = document.getElementById('character-inventory-grid');
        if (!grid) {
            console.error('[InventoryUI] Character inventory grid not found');
            return;
        }
        
        console.log(`[InventoryUI] Rendering character inventory...`);
        console.log(`[InventoryUI] Current character inventory:`, this.currentCharacterInventory);
        console.log(`[InventoryUI] Grid element:`, grid);
        grid.innerHTML = '';

        for (let i = 0; i < 6; i++) {
            console.log(`[InventoryUI] Creating slot ${i}...`);
            const slot = this.createInventorySlot(i, 'character');
            console.log(`[InventoryUI] Slot ${i} created:`, slot);
            
            const itemSlot = this.currentCharacterInventory.getItem(i);
            console.log(`[InventoryUI] Slot ${i}: itemSlot = ${itemSlot}`);
            
            if (itemSlot && itemSlot.itemId) {
                const item = window.ItemRegistry.getItem(itemSlot.itemId);
                if (item) {
                    console.log(`[InventoryUI] Populating slot ${i} with item:`, item);
                    this.populateSlot(slot, item, i, 'character');
                } else {
                    console.warn(`[InventoryUI] Item not found in registry: ${itemSlot.itemId}`);
                }
            }
            
            console.log(`[InventoryUI] Appending slot ${i} to grid...`);
            grid.appendChild(slot);
            console.log(`[InventoryUI] Grid children count after slot ${i}:`, grid.children.length);
        }
        
        console.log(`[InventoryUI] Character inventory rendered with ${grid.children.length} slots`);
        console.log(`[InventoryUI] Final grid HTML:`, grid.outerHTML);
    }

    /**
     * Render global inventory grid
     */
    renderGlobalInventory() {
        const grid = document.getElementById('global-inventory-grid');
        if (!grid) {
            console.error('[InventoryUI] Global inventory grid not found');
            return;
        }
        
        console.log(`[InventoryUI] Rendering global inventory...`);
        grid.innerHTML = '';

        const items = window.GlobalInventory.getAllItems();
        console.log(`[InventoryUI] Global inventory items to render:`, items);
        
        if (items.length === 0) {
            console.log(`[InventoryUI] No items in global inventory`);
            
            // Show empty state message
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'inventory-empty-state';
            emptyMessage.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                padding: 40px 20px;
                font-size: 1.1rem;
                background: rgba(0, 0, 0, 0.2);
                border: 2px dashed rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                margin: 20px 0;
            `;
            emptyMessage.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 15px;">📦</div>
                <div style="font-weight: bold; margin-bottom: 10px;">Your inventory is empty</div>
                <div style="font-size: 0.9rem;">Complete story stages and battles to collect items!</div>
            `;
            grid.appendChild(emptyMessage);
            
            console.log(`[InventoryUI] Global inventory rendered with empty state message`);
            return;
        }
        
        // Use the new getItemStacks method for proper stack display
        const itemStacks = window.GlobalInventory.getItemStacks();
        console.log(`🎨 [RenderGlobal] Rendering ${itemStacks.length} item stacks:`, itemStacks);
        
        itemStacks.forEach((stack, index) => {
            const item = window.ItemRegistry.getItem(stack.itemId);
            if (item) {
                console.log(`🎨 [RenderGlobal] Creating slot ${index} for ${stack.itemId} (qty: ${stack.quantity}):`, item);
                const slot = this.createInventorySlot(index, 'global');
                this.populateSlot(slot, item, index, 'global');
                grid.appendChild(slot);
            } else {
                console.warn(`❌ [RenderGlobal] Item not found in registry: ${stack.itemId}`);
            }
        });

        // Add empty slots to make grid look better (max 8 additional)
        const uniqueItemCount = itemStacks.length;
        const emptySlots = Math.max(0, Math.min(8, 12 - uniqueItemCount));
        for (let i = 0; i < emptySlots; i++) {
            const slot = this.createInventorySlot(items.length + i, 'global', true);
            grid.appendChild(slot);
        }
        
        console.log(`[InventoryUI] Global inventory rendered with ${grid.children.length} total slots (${uniqueItemCount} unique items + ${emptySlots} empty)`);
    }

    /**
     * Create an inventory slot element
     * @param {number} index - Slot index
     * @param {string} type - 'character' or 'global'
     * @param {boolean} isEmpty - Whether this is an empty slot
     */
    createInventorySlot(index, type, isEmpty = false) {
        console.log(`[InventoryUI] Creating slot: index=${index}, type=${type}, isEmpty=${isEmpty}`);
        const slot = document.createElement('div');
        slot.className = `inventory-slot ${isEmpty ? 'empty' : ''}`;
        slot.dataset.index = index;
        slot.dataset.type = type;
        
        console.log(`[InventoryUI] Slot element created:`, slot);
        console.log(`[InventoryUI] Slot className:`, slot.className);
        console.log(`[InventoryUI] Slot dataset:`, slot.dataset);

        // Add drag and drop event listeners
        slot.addEventListener('dragover', this.handleDragOver.bind(this));
        slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
        slot.addEventListener('drop', this.handleDrop.bind(this));
        
        console.log(`[InventoryUI] Added drop listeners to slot ${type}[${index}]`);

        return slot;
    }

    /**
     * Populate a slot with item data
     * @param {HTMLElement} slot - The slot element
     * @param {Item} item - The item data
     * @param {number} index - Slot index
     * @param {string} type - 'character' or 'global'
     */
    populateSlot(slot, item, index, type) {
        slot.classList.remove('empty');
        slot.classList.add(item.getRarityClass());
        
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.draggable = true;
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.index = index;
        itemElement.dataset.type = type;
        
        // Get quantity based on inventory type
        let quantity = 1;
        if (type === 'character') {
            const itemSlot = this.currentCharacterInventory.getItem(index);
            quantity = itemSlot ? itemSlot.quantity || 1 : 1;
        } else if (type === 'global') {
            // For global inventory, get the actual stack quantity
            const itemStacks = window.GlobalInventory.getItemStacks();
            const stack = itemStacks[index];
            quantity = stack ? stack.quantity : 1;
        }
        
        // Show quantity badge for stackable items with quantity > 1
        const quantityBadge = ((item.isConsumable || item.type === 'crafting') && quantity > 1) ? 
            `<div class="item-quantity-badge">${quantity}</div>` : '';
        
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='items/placeholder.png'">
            ${quantityBadge}
        `;

        // Add event listeners
        itemElement.addEventListener('dragstart', this.handleDragStart.bind(this));
        itemElement.addEventListener('dragend', this.handleDragEnd.bind(this));
        itemElement.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
        itemElement.addEventListener('mouseleave', () => this.hideTooltip());
        
        console.log(`Added drag listeners to item ${item.name} at ${type}[${index}] with quantity ${quantity}`);

        slot.appendChild(itemElement);
    }

    /**
     * Handle drag start
     */
    handleDragStart(e) {
        this.isDragging = true;
        
        // Find the inventory item element (in case drag started from child element like image)
        let dragElement = e.target;
        while (dragElement && !dragElement.classList.contains('inventory-item')) {
            dragElement = dragElement.parentElement;
        }
        
        if (!dragElement) {
            console.warn('Could not find inventory-item element');
            return;
        }
        
        this.dragItem = {
            itemId: dragElement.dataset.itemId,
            index: parseInt(dragElement.dataset.index),
            type: dragElement.dataset.type
        };
        this.dragSource = dragElement;
        
        dragElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Required for drag to work
        
        console.log('Drag started:', this.dragItem);
        this.hideTooltip();
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        this.isDragging = false;
        
        // Find the inventory item element (in case drag ended from child element)
        let dragElement = e.target;
        while (dragElement && !dragElement.classList.contains('inventory-item')) {
            dragElement = dragElement.parentElement;
        }
        
        if (dragElement) {
            dragElement.classList.remove('dragging');
        }
        
        // Remove drag-over effects from all slots
        document.querySelectorAll('.inventory-slot.drag-over').forEach(slot => {
            slot.classList.remove('drag-over');
        });
        
        console.log('Drag ended');
        this.dragItem = null;
        this.dragSource = null;
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const slot = e.currentTarget;
        slot.classList.add('drag-over');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(e) {
        const slot = e.currentTarget;
        slot.classList.remove('drag-over');
    }

    /**
     * Handle drop
     */
    handleDrop(e) {
        if (!this.isDragging || !this.dragItem) {
            console.warn('Drop ignored - not dragging or no drag item');
            return;
        }
        
        e.preventDefault();
        const targetSlot = e.currentTarget;
        targetSlot.classList.remove('drag-over');

        // Handle drop on the entire global inventory grid
        if (targetSlot.id === 'global-inventory-grid') {
            if (this.dragItem.type === 'character') {
                const removedItem = this.currentCharacterInventory.removeItem(this.dragItem.index);
                if (removedItem) {
                    window.GlobalInventory.addItem(removedItem.itemId, removedItem.quantity);
                    this.renderBothInventories();
                    this.saveCharacterInventory();
                    this.saveGlobalInventory();
                }
            }
            return;
        }
        
        const targetIndex = parseInt(targetSlot.dataset.index);
        const targetType = targetSlot.dataset.type;
        
        console.log('Drop detected:', {
            source: this.dragItem,
            target: { index: targetIndex, type: targetType }
        });
        
        // Don't allow dropping on the exact same slot unless we're stacking
        if (this.dragItem.type === targetType && this.dragItem.index === targetIndex) {
            console.log('Drop ignored - same slot');
            return;
        }

        // Check if this could be a stacking operation for different slots
        if (this.dragItem.type === targetType) {
            if (targetType === 'character') {
                const sourceSlot = this.currentCharacterInventory.getItem(this.dragItem.index);
                const targetSlot = this.currentCharacterInventory.getItem(targetIndex);
                
                // Same item type - check if it's stackable
                const item = window.ItemRegistry?.getItem(sourceSlot.itemId);
                if (item && (item.isConsumable || item.type === 'crafting')) {
                    console.log('Stacking items:', sourceSlot.itemId, 'quantities:', sourceSlot.quantity, '+', targetSlot.quantity);
                    // Stackable item - combine stacks
                    targetSlot.quantity += sourceSlot.quantity;
                    this.currentCharacterInventory.removeItem(this.dragItem.index); // Remove source stack
                    this.renderCharacterInventory();
                    this.saveCharacterInventory();
                    console.log('Items stacked successfully');
                    return;
                }
            } else if (targetType === 'global') {
                // Check for global inventory stacking
                const globalItems = window.GlobalInventory.getAllItems();
                const sourceItemId = globalItems[this.dragItem.index];
                const targetItemId = globalItems[targetIndex];
                
                if (sourceItemId && targetItemId && sourceItemId === targetItemId) {
                    const item = window.ItemRegistry?.getItem(sourceItemId);
                    if (item && (item.isConsumable || item.type === 'crafting')) {
                        console.log('Allowing global inventory stacking operation');
                    }
                }
            }
        }
        
        this.moveItem(this.dragItem, { index: targetIndex, type: targetType });
    }

    /**
     * Move an item between inventories or slots
     * @param {Object} source - Source item info
     * @param {Object} target - Target slot info
     */
    moveItem(source, target) {
        const sourceItem = source.itemId;
        
        console.log(`🔄 Moving item ${sourceItem} from ${source.type}[${source.index}] to ${target.type}[${target.index}]`);
        
        if (source.type === 'global' && target.type === 'character') {
            // Moving from global to character inventory
            console.log('Checking character inventory space...', {
                hasSpace: this.currentCharacterInventory.hasSpace(),
                targetIndex: target.index,
                maxSlots: this.currentCharacterInventory.maxSlots
            });
            
            if (target.index < 6) { // Always allow if targeting a valid slot
                console.log('📦 Moving from global to character');
                
                // Get the source stack info from global inventory
                const itemStacks = window.GlobalInventory.getItemStacks();
                const sourceStack = itemStacks[source.index];
                
                console.log('📊 Before move - Global stacks:', itemStacks);
                console.log('📊 Source stack:', sourceStack);
                
                if (!sourceStack) {
                    console.warn('❌ Source stack not found at index:', source.index);
                    return;
                }
                
                console.log(`🗑️ Removing 1 from global stack (${sourceStack.quantity} → ${sourceStack.quantity - 1})`);
                
                // Remove from global (quantity 1)
                const removedItem = window.GlobalInventory.removeItem(source.index, 1);
                console.log('🗑️ RemoveItem result:', removedItem);
                
                // Check stack after removal
                const stacksAfterRemoval = window.GlobalInventory.getItemStacks();
                console.log('📊 After removal - Global stacks:', stacksAfterRemoval);
                
                // Add to character (replace if slot is occupied)
                const replacedItem = this.currentCharacterInventory.removeItem(target.index);
                if (replacedItem) {
                    console.log('🔄 Replacing existing item:', replacedItem);
                    window.GlobalInventory.addItem(replacedItem.itemId, replacedItem.quantity);
                }
                
                console.log(`➕ Adding ${sourceStack.itemId} to character slot ${target.index}`);
                const addResult = this.currentCharacterInventory.addItem(sourceStack.itemId, 1, target.index);
                
                if (!addResult) {
                    console.error('❌ Failed to add item to character inventory! Rolling back...');
                    // Roll back the global inventory removal
                    window.GlobalInventory.addItem(sourceStack.itemId, 1);
                    // Roll back the replaced item removal
                    if (replacedItem) {
                        this.currentCharacterInventory.addItem(replacedItem.itemId, replacedItem.quantity, target.index);
                    }
                    return;
                }
                
                // Log final states before saving
                const finalGlobalStacks = window.GlobalInventory.getItemStacks();
                console.log('📊 Final global stacks before save:', finalGlobalStacks);
                
                this.renderBothInventories();
                this.saveGlobalInventory();
                this.saveCharacterInventory();
                console.log('✅ Move completed successfully');
            } else {
                console.warn('❌ Invalid target slot index:', target.index);
            }
        } else if (source.type === 'character' && target.type === 'global') {
            console.log('Moving from character to global');
            // Moving from character to global inventory
            const removedItem = this.currentCharacterInventory.removeItem(source.index);
            if (removedItem) {
                window.GlobalInventory.addItem(removedItem.itemId, removedItem.quantity);
            }
            
            this.renderBothInventories();
            this.saveGlobalInventory();
            this.saveCharacterInventory();
            console.log('Move completed successfully');
        } else if (source.type === 'character' && target.type === 'character') {
            console.log('Moving within character inventory');
            
            // Get the actual slot data to check for stacking
            const sourceSlot = this.currentCharacterInventory.getItem(source.index);
            const targetSlot = this.currentCharacterInventory.getItem(target.index);
            
            // Check if we can stack items
            if (sourceSlot && targetSlot && sourceSlot.itemId === targetSlot.itemId) {
                // Same item type - check if it's stackable
                const item = window.ItemRegistry?.getItem(sourceSlot.itemId);
                if (item && (item.isConsumable || item.type === 'crafting')) {
                    console.log('Stacking items:', sourceSlot.itemId, 'quantities:', sourceSlot.quantity, '+', targetSlot.quantity);
                    // Stackable item - combine stacks
                    targetSlot.quantity += sourceSlot.quantity;
                    this.currentCharacterInventory.removeItem(source.index); // Remove source stack
                    this.renderCharacterInventory();
                    this.saveCharacterInventory();
                    console.log('Items stacked successfully');
                    return;
                }
            }
            
            // Not stackable or different items - swap positions
            this.currentCharacterInventory.moveItem(source.index, target.index);
            this.renderCharacterInventory();
            this.saveCharacterInventory();
            console.log('Move completed successfully');
        } else if (source.type === 'global' && target.type === 'global') {
            console.log('Moving within global inventory');
            
            // Get the actual item stacks from global inventory
            const itemStacks = window.GlobalInventory.getItemStacks();
            const sourceStack = itemStacks[source.index];
            const targetStack = itemStacks[target.index];
            
            // Check if we can stack items
            if (sourceStack && targetStack && sourceStack.itemId === targetStack.itemId) {
                const item = window.ItemRegistry?.getItem(sourceStack.itemId);
                if (item && (item.isConsumable || item.type === 'crafting')) {
                    console.log('Stacking global inventory items:', sourceStack.itemId);
                    
                    // Use the new stacking method
                    if (window.GlobalInventory.stackItems(source.index, target.index)) {
                        this.renderGlobalInventory();
                        this.saveGlobalInventory();
                        console.log('Global inventory items stacked successfully');
                        return;
                    }
                }
            }
            
            // Swap positions in global inventory if not stacking
            // Since we're working with stacks now, we need to swap the actual stack objects
            const sourceStackCopy = { ...sourceStack };
            const targetStackCopy = { ...targetStack };
            
            // Get the internal items array and swap the stack objects directly
            const internalItems = window.GlobalInventory.items;
            if (internalItems[source.index] && internalItems[target.index]) {
                const temp = internalItems[target.index];
                internalItems[target.index] = internalItems[source.index];
                internalItems[source.index] = temp;
            }
            
            this.renderGlobalInventory();
            this.saveGlobalInventory();
            console.log('Global inventory move completed successfully');
        }
    }

    /**
     * Render both inventories
     */
    renderBothInventories() {
        this.renderCharacterInventory();
        this.renderGlobalInventory();
    }

    /**
     * Show item tooltip
     * @param {Event} e - Mouse event
     * @param {Item} item - Item data
     */
    showTooltip(e, item) {
        const tooltip = this.tooltip;
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <img src="${item.image}" alt="${item.name}" class="tooltip-image" onerror="this.src='items/placeholder.png'">
                <div>
                    <h3 class="tooltip-name">${item.name}</h3>
                    <p class="tooltip-rarity ${item.rarity}">${item.rarity}</p>
                </div>
            </div>
            <div class="tooltip-description">${item.description}</div>
            ${this.generateStatsHTML(item)}
        `;
        
        tooltip.classList.add('visible');
        this.positionTooltip(e.clientX, e.clientY);
    }

    /**
     * Generate stats HTML for tooltip
     * @param {Item} item - Item data
     */
    generateStatsHTML(item) {
        if (Object.keys(item.statBonuses).length === 0) {
            return '';
        }
        
        let statsHTML = '<div class="tooltip-stats"><h4>Stat Bonuses:</h4>';
        
        Object.entries(item.statBonuses).forEach(([stat, bonus]) => {
            const statName = item.formatStatName(stat);
            const prefix = bonus > 0 ? '+' : '';
            statsHTML += `
                <div class="stat-bonus">
                    <span class="stat-name">${statName}</span>
                    <span class="stat-value">${prefix}${bonus}</span>
                </div>
            `;
        });
        
        statsHTML += '</div>';
        return statsHTML;
    }

    /**
     * Hide item tooltip
     */
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }

    /**
     * Position tooltip relative to mouse
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    positionTooltip(x, y) {
        const tooltip = this.tooltip;
        const rect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let left = x + 15;
        let top = y + 15;
        
        // Adjust if tooltip goes off screen
        if (left + rect.width > viewport.width) {
            left = x - rect.width - 15;
        }
        
        if (top + rect.height > viewport.height) {
            top = y - rect.height - 15;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    /**
     * Get character name from ID
     * @param {string} characterId - Character ID
     */
    getCharacterName(characterId) {
        // This should be connected to your character registry
        // For now, return a formatted version of the ID
        return characterId.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Render global inventory with modern design
     */
    renderGlobalInventoryModern() {
        const grid = document.getElementById('global-inventory-grid-raid');
        if (!grid) return;
        
        grid.innerHTML = '';

        const globalItems = window.GlobalInventory.getAllItems();
        
        if (globalItems.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'inventory-empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">📦</div>
                <h3>Your vault is empty</h3>
                <p>Collect items during battles to build your collection!</p>
            `;
            grid.appendChild(emptyState);
            return;
        }

        // Use the new getItemStacks method for proper stack display
        const itemStacks = window.GlobalInventory.getItemStacks();
        itemStacks.forEach((stack, index) => {
            const item = window.ItemRegistry.getItem(stack.itemId);
            if (item) {
                const itemCard = this.createModernItemCard(item, index, stack.quantity);
                grid.appendChild(itemCard);
            }
        });
    }

    /**
     * Create modern item card
     */
    createModernItemCard(item, index, quantity = 1) {
        const card = document.createElement('div');
        card.className = `modern-item-card rarity-${item.rarity}`;
        card.dataset.itemId = item.id;
        card.dataset.rarity = item.rarity;
        card.dataset.name = item.name.toLowerCase();
        
        // Show quantity badge for stackable items with quantity > 1
        const quantityBadge = ((item.isConsumable || item.type === 'crafting') && quantity > 1) ? 
            `<div class="item-quantity-badge">${quantity}</div>` : '';
        
        card.innerHTML = `
            <div class="item-card-glow"></div>
            <div class="item-card-content">
                <div class="item-image-container">
                    <img src="${item.image}" alt="${item.name}" class="modern-item-image">
                    <div class="rarity-gem rarity-${item.rarity}"></div>
                    ${quantityBadge}
                </div>
                <div class="item-info">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-rarity rarity-${item.rarity}">${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</p>
                </div>
            </div>
            <div class="item-card-effects">
                <div class="sparkle"></div>
                <div class="sparkle"></div>
                <div class="sparkle"></div>
            </div>
        `;
        
        // Add hover effects for preview
        card.addEventListener('mouseenter', () => {
            this.showItemPreview(item);
            this.addItemCardHoverEffect(card);
        });
        
        card.addEventListener('mouseleave', () => {
            this.hideItemPreview();
            this.removeItemCardHoverEffect(card);
        });
        
        // Add click for detailed view
        card.addEventListener('click', () => {
            this.showItemDetailModal(item);
        });
        
        return card;
    }

    /**
     * Show item preview in sidebar
     */
    showItemPreview(item) {
        const preview = document.getElementById('item-preview');
        if (!preview) return;
        
        const rarityColors = {
            'common': '#6bddaa',
            'rare': '#4dabf5',
            'epic': '#b362ff',
            'legendary': '#ffbd00'
        };
        
        preview.innerHTML = `
            <div class="preview-header">
                <img src="${item.image}" alt="${item.name}" class="preview-image">
                <div class="preview-title">
                    <h3 style="color: ${rarityColors[item.rarity] || '#fff'}">${item.name}</h3>
                    <p class="preview-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</p>
                </div>
            </div>
            
            <div class="preview-description">
                <p>${item.description || 'A valuable item in your collection.'}</p>
            </div>
            
            ${item.statBonuses && Object.keys(item.statBonuses).length > 0 ? `
                <div class="preview-stats">
                    <h4>Stat Bonuses:</h4>
                    ${Object.entries(item.statBonuses).map(([stat, bonus]) => `
                        <div class="preview-stat">
                            <span class="stat-name">${this.formatStatName(stat)}:</span>
                            <span class="stat-value ${bonus > 0 ? 'positive' : 'negative'}">
                                ${bonus > 0 ? '+' : ''}${bonus}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Hide item preview
     */
    hideItemPreview() {
        const preview = document.getElementById('item-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <div class="preview-placeholder">
                <div class="preview-icon">👁️</div>
                <p>Hover over an item to preview</p>
            </div>
        `;
    }

    /**
     * Add hover effect to item card
     */
    addItemCardHoverEffect(card) {
        card.classList.add('hovered');
        
        // Add floating animation
        card.style.transform = 'translateY(-5px) scale(1.02)';
        card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
    }

    /**
     * Remove hover effect from item card
     */
    removeItemCardHoverEffect(card) {
        card.classList.remove('hovered');
        
        // Reset animations
        card.style.transform = '';
        card.style.boxShadow = '';
    }

    /**
     * Filter global inventory items
     */
    filterGlobalInventory(value, type) {
        const cards = document.querySelectorAll('.modern-item-card');
        
        cards.forEach(card => {
            let shouldShow = true;
            
            if (type === 'search' && value.trim()) {
                const itemName = card.dataset.name;
                shouldShow = itemName.includes(value.toLowerCase().trim());
            } else if (type === 'filter' && value !== 'all') {
                const itemRarity = card.dataset.rarity;
                shouldShow = itemRarity === value;
            }
            
            if (shouldShow) {
                card.style.display = 'block';
                card.classList.add('filter-enter');
                setTimeout(() => card.classList.remove('filter-enter'), 300);
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Sort global inventory items
     */
    sortGlobalInventory(sortBy) {
        const grid = document.getElementById('global-inventory-grid-raid');
        if (!grid) return;
        
        const cards = Array.from(grid.querySelectorAll('.modern-item-card'));
        
        cards.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.dataset.name.localeCompare(b.dataset.name);
                case 'rarity':
                    const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
                    return (rarityOrder[b.dataset.rarity] || 0) - (rarityOrder[a.dataset.rarity] || 0);
                case 'type':
                    // Could implement type sorting if items have types
                    return a.dataset.name.localeCompare(b.dataset.name);
                default:
                    return 0;
            }
        });
        
        // Re-append sorted cards
        cards.forEach(card => grid.appendChild(card));
    }

    /**
     * Update inventory statistics
     */
    updateInventoryStats() {
        const globalItems = window.GlobalInventory.getAllItems();
        const stats = { total: 0, common: 0, rare: 0, epic: 0, legendary: 0 };
        
        globalItems.forEach(itemId => {
            const item = window.ItemRegistry.getItem(itemId);
            if (item) {
                stats.total++;
                stats[item.rarity] = (stats[item.rarity] || 0) + 1;
            }
        });
        
        // Update count display
        const countElement = document.getElementById('global-item-count');
        if (countElement) countElement.textContent = stats.total;
        
        // Update sidebar stats
        const statElements = {
            'total-items': stats.total,
            'common-count': stats.common,
            'rare-count': stats.rare,
            'epic-count': stats.epic,
            'legendary-count': stats.legendary
        };
        
        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    /**
     * Format stat name for display
     */
    formatStatName(stat) {
        const statNames = {
            'physicalDamage': 'Physical Damage',
            'magicalDamage': 'Magical Damage',
            'armor': 'Armor',
            'magicalShield': 'Magical Shield',
            'speed': 'Speed',
            'critChance': 'Critical Chance',
            'critMultiplier': 'Critical Multiplier',
            'dodgeChance': 'Dodge Chance',
            'hp': 'Health Points',
            'mana': 'Mana Points'
        };
        
        return statNames[stat] || stat;
    }

    /**
     * Show detailed item modal (future enhancement)
     */
    showItemDetailModal(item) {
        // This could be expanded for detailed item examination
        console.log('Detailed view for:', item.name);
    }

    /**
     * Cleanup event listeners (useful for reinitializing)
     */
    cleanup() {
        console.log('[InventoryUI] Cleaning up event listeners');
        
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        
        console.log('[InventoryUI] Cleanup completed');
    }

    /**
     * Reinitialize the inventory UI (useful for story mode)
     */
    reinitialize() {
        console.log('[InventoryUI] Reinitializing inventory UI manager');
        
        // Clean up old listeners first
        this.cleanup();
        
        // Check if modal and tooltip exist and are properly set
        const existingModal = document.getElementById('inventory-modal');
        const existingTooltip = document.getElementById('item-tooltip');
        
        if (existingModal && this.modal === existingModal) {
            console.log('[InventoryUI] Modal exists and is properly referenced, just resetting event listeners');
            // Modal exists and is correctly referenced, just need to reset event listeners
            this.setupEventListeners();
            
            // Ensure tooltip is set correctly
            if (existingTooltip) {
                this.tooltip = existingTooltip;
            } else {
                this.createTooltip();
            }
        } else {
            console.log('[InventoryUI] Modal missing or incorrectly referenced, performing full reinitialization');
            // Need full reinitialization
            this.init();
        }
        
        console.log('[InventoryUI] Reinitialization completed successfully');
    }

    /**
     * Create and show the consumable items window
     */
    async createConsumableWindow() {
        // Remove existing consumable window if it exists
        const existingWindow = document.getElementById('consumable-window');
        if (existingWindow) {
            existingWindow.remove();
        }

        // Create the consumable window
        const consumableWindow = document.createElement('div');
        consumableWindow.className = 'consumable-window';
        consumableWindow.id = 'consumable-window';
        
        consumableWindow.innerHTML = `
            <div class="consumable-header">
                <h3 class="consumable-title">Consumable Items</h3>
                <button class="consumable-close" id="consumable-close">✕</button>
            </div>
            <div class="consumable-content" id="consumable-content">
                <div class="consumable-loading">Loading character inventories...</div>
            </div>
        `;
        
        document.body.appendChild(consumableWindow);
        
        // Make it draggable
        this.makeWindowDraggable(consumableWindow);
        
        // Add event listeners
        const closeButton = consumableWindow.querySelector('#consumable-close');
        closeButton.addEventListener('click', () => {
            this.closeConsumableWindow();
        });
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeConsumableWindow();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Load and display consumable items
        await this.loadConsumableItems();
        
        // Position the window
        this.positionConsumableWindow(consumableWindow);
        
        return consumableWindow;
    }

    /**
     * Make a window draggable
     */
    makeWindowDraggable(windowElement) {
        const header = windowElement.querySelector('.consumable-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = windowElement.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // Keep window within viewport
            const maxLeft = window.innerWidth - windowElement.offsetWidth;
            const maxTop = window.innerHeight - windowElement.offsetHeight;
            
            const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
            const clampedTop = Math.max(0, Math.min(newTop, maxTop));
            
            windowElement.style.left = clampedLeft + 'px';
            windowElement.style.top = clampedTop + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });
        
        header.style.cursor = 'grab';
    }

    /**
     * Load and display consumable items from all player characters
     */
    async loadConsumableItems() {
        const contentDiv = document.getElementById('consumable-content');
        if (!contentDiv) return;
        
        // Check if we're in a raid game
        if (!window.gameManager || !window.gameManager.gameState || !window.gameManager.gameState.playerCharacters) {
            contentDiv.innerHTML = '<div class="consumable-no-items">No game active</div>';
            return;
        }
        
        const playerCharacters = window.gameManager.gameState.playerCharacters;
        const consumablesByCharacter = new Map();
        
        // Load inventories for all player characters
        for (const character of playerCharacters) {
            const inventory = await this.loadCharacterInventory(character.id);
            
            if (inventory && typeof inventory.getConsumableItems === 'function') {
                const consumables = inventory.getConsumableItems();
                
                if (consumables.length > 0) {
                    consumablesByCharacter.set(character, consumables);
                }
            } else {
                console.warn(`[InventoryUI] Invalid inventory for character ${character.id}:`, inventory);
            }
        }
        
        // Generate HTML for consumables
        if (consumablesByCharacter.size === 0) {
            contentDiv.innerHTML = '<div class="consumable-no-items">No consumable items found</div>';
            return;
        }
        
        let html = '';
        
        
        for (const [character, consumables] of consumablesByCharacter) {
            // Get character image from registry
            const characterImage = this.getCharacterImageFromRegistry(character.id);
            
            html += `
                <div class="character-consumables">
                    <div class="character-header">
                        <img src="${characterImage}" alt="${character.name}" class="character-icon" onerror="this.src='Icons/characters/default-character.png'">
                        <span class="character-name">${character.name}</span>
                    </div>
                    <div class="consumable-items">
            `;
            
            consumables.forEach((consumableData) => {
                const item = window.ItemRegistry?.getItem(consumableData.itemId);
                if (!item) return;
                
                // Use the actual slot index from consumableData, not the forEach index
                const actualSlotIndex = consumableData.slotIndex;
                
                // Check cooldown status
                const isOnCooldown = character.consumableCooldowns && character.consumableCooldowns[item.id] > 0;
                const cooldownTurns = isOnCooldown ? character.consumableCooldowns[item.id] : 0;
                
                html += `
                    <div class="consumable-item ${isOnCooldown ? 'on-cooldown' : ''}" 
                         data-character-id="${character.id}" 
                         data-slot-index="${actualSlotIndex}"
                         data-item-id="${item.id}">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}" onerror="this.src='Icons/default-icon.jpg'">
                            ${consumableData.quantity > 1 ? `<span class="item-quantity">${consumableData.quantity}</span>` : ''}
                            ${isOnCooldown ? `<div class="cooldown-overlay">${cooldownTurns}</div>` : ''}
                        </div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-description">${item.description}</div>
                            ${isOnCooldown ? `<div class="cooldown-text">Cooldown: ${cooldownTurns} turns</div>` : ''}
                        </div>
                        <button class="use-item-btn" ${isOnCooldown ? 'disabled' : ''}>
                            ${isOnCooldown ? 'On Cooldown' : 'Use'}
                        </button>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        contentDiv.innerHTML = html;
        
        // Add click handlers for use buttons
        this.attachConsumableClickHandlers();
    }

    /**
     * Attach click handlers to consumable use buttons
     */
    attachConsumableClickHandlers() {
        const useButtons = document.querySelectorAll('.use-item-btn');
        
        useButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                if (button.disabled) return;
                
                const itemElement = button.closest('.consumable-item');
                const characterId = itemElement.dataset.characterId;
                const slotIndex = parseInt(itemElement.dataset.slotIndex);
                const itemId = itemElement.dataset.itemId;
                
                await this.useConsumableItem(characterId, slotIndex, itemId);
            });
        });
    }

    /**
     * Use a consumable item
     */
    async useConsumableItem(characterId, slotIndex, itemId) {
        // Find the character
        const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.id === characterId);
        if (!character) {
            console.error('Character not found:', characterId);
            return;
        }
        
        // Load character inventory
        const inventory = await this.loadCharacterInventory(characterId);
        
        if (!inventory || typeof inventory.useConsumableItem !== 'function') {
            console.error('Invalid inventory for character:', characterId, inventory);
            return;
        }
        
        // Use the consumable
        const result = inventory.useConsumableItem(slotIndex, character);
        
        if (result.success) {
            // Save the updated inventory
            await this.saveCharacterInventoryById(characterId, inventory);
            
            // Update character UI if available
            if (window.gameManager?.uiManager?.updateCharacterUI) {
                window.gameManager.uiManager.updateCharacterUI(character);
            }
            
            // Reload the consumable items display immediately to show cooldown
            await this.loadConsumableItems();
            
            // Show success message
            if (window.gameManager?.addLogEntry) {
                window.gameManager.addLogEntry(`${character.name} used ${window.ItemRegistry.getItem(itemId)?.name}!`, 'consumable-use');
            }
        } else {
            // Show error message
            console.warn('Failed to use consumable:', result.message);
            if (window.gameManager?.addLogEntry) {
                window.gameManager.addLogEntry(`Failed to use item: ${result.message}`, 'error');
            }
        }
    }

    /**
     * Position the consumable window
     */
    positionConsumableWindow(windowElement) {
        // Position in top-right area, avoiding the quick action bar
        const rightOffset = 20;
        const topOffset = 100;
        
        windowElement.style.position = 'fixed';
        windowElement.style.right = rightOffset + 'px';
        windowElement.style.top = topOffset + 'px';
        windowElement.style.zIndex = '1001';
    }

    /**
     * Get character image from character registry
     */
    getCharacterImageFromRegistry(characterId) {
        try {
            // Try to get character registry from game manager first
            let characterRegistry = null;
            
            if (window.gameManager && window.gameManager.characterRegistry) {
                characterRegistry = window.gameManager.characterRegistry;
            } else if (window.characterRegistry) {
                characterRegistry = window.characterRegistry;
            } else {
                // Fallback: try to load from the registry file
                console.warn('[InventoryUI] Character registry not found, using fallback');
                return `Icons/characters/default-character.png`; // Fallback image
            }
            
            // Find character in registry
            let character = null;
            if (Array.isArray(characterRegistry)) {
                character = characterRegistry.find(c => c.id === characterId);
            } else if (characterRegistry.characters && Array.isArray(characterRegistry.characters)) {
                character = characterRegistry.characters.find(c => c.id === characterId);
            }
            
            if (character && character.image) {
                return character.image;
            } else {
                console.warn(`[InventoryUI] Character ${characterId} not found in registry or missing image`);
                return `Icons/characters/default-character.png`; // Fallback image
            }
        } catch (error) {
            console.error('[InventoryUI] Error getting character image from registry:', error);
            return `Icons/characters/default-character.png`; // Fallback image
        }
    }

    /**
     * Close the consumable window
     */
    closeConsumableWindow() {
        const window = document.getElementById('consumable-window');
        if (window) {
            window.remove();
        }
    }

    /**
     * Save character inventory by ID
     */
    async saveCharacterInventoryById(characterId, inventory) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const inventoryRef = firebase.database().ref(`users/${user.uid}/characterInventories/${characterId}`);
                await inventoryRef.set(inventory.serialize());
                console.log(`Saved inventory for ${characterId}`);
                
                // Update memory cache
                window.CharacterInventories.set(characterId, inventory);
            }
        } catch (error) {
            console.error(`Failed to save inventory for ${characterId}:`, error);
        }
    }
}

// Make the InventoryUIManager class globally available
if (typeof window !== 'undefined') {
    window.InventoryUIManager = InventoryUIManager;
    console.log('[InventoryUI] InventoryUIManager class made globally available');
}

// Auto-initialization for raid game mode (not needed for story mode)
// Story mode handles initialization manually
if (typeof window !== 'undefined' && !window.isStoryMode) {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if this is NOT story mode
        if (window.location.pathname.includes('story.html')) {
            console.log('[InventoryUI] Story mode detected, skipping auto-initialization');
            return;
        }
        
        // Ensure global variables exist before creating the UI manager
        if (!window.ItemRegistry) {
            console.log('[InventoryUI] Creating ItemRegistry for raid game mode');
            window.ItemRegistry = new ItemRegistry();
        }
        if (!window.GlobalInventory) {
            console.log('[InventoryUI] Creating GlobalInventory for raid game mode');
            window.GlobalInventory = new GlobalInventory();
        }
        if (!window.CharacterInventories) {
            console.log('[InventoryUI] Creating CharacterInventories for raid game mode');
            window.CharacterInventories = new Map();
        }
        
        // Initialize the UI manager instance for raid game mode
        window.inventoryUIManager = new InventoryUIManager();
        
        console.log('[InventoryUI] Auto-initialization completed for raid game mode');
    });
}
