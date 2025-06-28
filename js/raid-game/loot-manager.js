/**
 * Loot System for Project Fighters
 * Handles stage loot tables, drop chances, and reward distribution
 */

class LootTable {
    constructor(items = [], guaranteedItems = []) {
        this.items = items; // Array of { itemId, dropChance, quantityMin?, quantityMax? }
        this.guaranteedItems = guaranteedItems; // Array of { itemId, quantityMin?, quantityMax? }
    }

    /**
     * Add an item to the loot table
     * @param {string} itemId - The item ID
     * @param {number} dropChance - Drop chance (0-1)
     * @param {number} quantityMin - Minimum quantity to drop (default 1)
     * @param {number} quantityMax - Maximum quantity to drop (default quantityMin)
     */
    addItem(itemId, dropChance, quantityMin = 1, quantityMax = null) {
        this.items.push({ 
            itemId, 
            dropChance, 
            quantityMin, 
            quantityMax: quantityMax !== null ? quantityMax : quantityMin 
        });
    }

    /**
     * Add a guaranteed item to the loot table
     * @param {string} itemId - The item ID
     * @param {number} quantityMin - Minimum quantity to drop (default 1)
     * @param {number} quantityMax - Maximum quantity to drop (default quantityMin)
     */
    addGuaranteedItem(itemId, quantityMin = 1, quantityMax = null) {
        this.guaranteedItems.push({ 
            itemId, 
            quantityMin, 
            quantityMax: quantityMax !== null ? quantityMax : quantityMin 
        });
    }

    /**
     * Generate loot based on drop chances
     * @returns {Array} Array of { itemId, quantity }
     */
    generateLoot() {
        const loot = [];

        // Add guaranteed items first
        this.guaranteedItems.forEach(item => {
            const quantity = this.getRandomQuantity(item.quantityMin, item.quantityMax);
            loot.push({ itemId: item.itemId, quantity });
        });

        // Roll for chance-based items
        this.items.forEach(item => {
            const roll = Math.random();
            if (roll <= item.dropChance) {
                const quantity = this.getRandomQuantity(item.quantityMin, item.quantityMax);
                loot.push({ itemId: item.itemId, quantity });
            }
        });

        return loot;
    }

    /**
     * Get random quantity between min and max (inclusive)
     * @param {number} min - Minimum quantity
     * @param {number} max - Maximum quantity
     * @returns {number} Random quantity
     */
    getRandomQuantity(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

class LootManager {
    constructor() {
        this.stageLootTables = new Map();
        this.initializeDefaultLootTables();
    }

    /**
     * Initialize default loot tables for stages
     */
    initializeDefaultLootTables() {
        // Tutorial Training Grounds - 100% Long Sword drop
        const trainingGroundsLoot = new LootTable();
        trainingGroundsLoot.addGuaranteedItem('long_sword', 1);
        this.stageLootTables.set('training_grounds', trainingGroundsLoot);
        this.stageLootTables.set('tutorial_first_steps_0', trainingGroundsLoot); // Story mode format

        // Advanced Training - New consumable items
        const advancedTrainingLoot = new LootTable();
        // Mana Sack: 100% drop chance, 1-3 quantity
        advancedTrainingLoot.addItem('mana_sack', 1.0, 1, 3);
        // Infernal Cinder: 75% drop chance, 1-4 quantity  
        advancedTrainingLoot.addItem('infernal_cinder', 0.75, 1, 4);
        this.stageLootTables.set('advanced_training', advancedTrainingLoot);

        console.log('[LootManager] Initialized default loot tables including Advanced Training');
    }

    /**
     * Register a loot table for a stage
     * @param {string} stageId - The stage identifier
     * @param {LootTable} lootTable - The loot table
     */
    registerStageLootTable(stageId, lootTable) {
        this.stageLootTables.set(stageId, lootTable);
        console.log(`[LootManager] Registered loot table for stage: ${stageId}`);
    }

    /**
     * Get loot table for a stage
     * @param {string} stageId - The stage identifier
     * @returns {LootTable|null} The loot table or null if not found
     */
    getStageLootTable(stageId) {
        return this.stageLootTables.get(stageId) || null;
    }

    /**
     * Generate loot for a completed stage
     * @param {string} stageId - The stage identifier
     * @returns {Array} Array of loot items { itemId, quantity }
     */
    generateStageLoot(stageId) {
        let lootTable = this.getStageLootTable(stageId);
        
        // If no predefined loot table, try to load from current stage data
        if (!lootTable && window.gameManager?.stageManager?.currentStage) {
            const currentStage = window.gameManager.stageManager.currentStage;
            console.log(`[LootManager] Checking current stage data for loot:`, {
                stageId: stageId,
                currentStageName: currentStage.name,
                hasLoot: !!currentStage.loot,
                lootData: currentStage.loot
            });
            
            if (currentStage.loot) {
                console.log(`[LootManager] Loading loot table from stage data for: ${stageId}`);
                lootTable = this.createLootTableFromStageData(currentStage);
                // Cache it for future use
                this.registerStageLootTable(stageId, lootTable);
            } else {
                console.log(`[LootManager] Current stage has no loot data:`, currentStage.name);
            }
        } else if (!window.gameManager?.stageManager?.currentStage) {
            console.log(`[LootManager] No current stage available in game manager`);
        }

        if (!lootTable) {
            console.log(`[LootManager] No loot table found for stage: ${stageId}`);
            return [];
        }

        const loot = lootTable.generateLoot();
        console.log(`[LootManager] Generated loot for stage ${stageId}:`, loot);
        return loot;
    }

    /**
     * Award loot to player's global inventory
     * @param {string} userId - The user ID
     * @param {Array} lootItems - Array of { itemId, quantity }
     * @returns {Promise<boolean>} Success status
     */
    async awardLootToPlayer(userId, lootItems) {
        if (!lootItems || lootItems.length === 0) {
            console.log('[LootManager] No loot to award');
            return true;
        }

        try {
            console.log(`[LootManager] Awarding loot to user ${userId}:`, lootItems);

            // Ensure GlobalInventory exists
            if (!window.GlobalInventory) {
                console.error('[LootManager] GlobalInventory not available');
                return false;
            }

            // Load current global inventory using the inventory system
            const inventoryRef = firebase.database().ref(`users/${userId}/globalInventory`);
            const snapshot = await inventoryRef.once('value');
            const currentData = snapshot.val();

            // Handle different data formats for backward compatibility
            if (currentData) {
                if (Array.isArray(currentData)) {
                    // Old format: direct array
                    console.log('[LootManager] Loading old format (direct array):', currentData);
                    window.GlobalInventory.deserialize(currentData);
                } else if (currentData.items && Array.isArray(currentData.items)) {
                    // New format: wrapped object
                    console.log('[LootManager] Loading new format (wrapped object):', currentData.items);
                    window.GlobalInventory.deserialize(currentData.items);
                } else {
                    // Unknown format, start fresh
                    console.log('[LootManager] Unknown format, starting fresh');
                    window.GlobalInventory.items = [];
                }
            } else {
                // No existing data
                console.log('[LootManager] No existing inventory data');
                window.GlobalInventory.items = [];
            }

            // Add each loot item to GlobalInventory
            lootItems.forEach(lootItem => {
                for (let i = 0; i < lootItem.quantity; i++) {
                    window.GlobalInventory.addItem(lootItem.itemId);
                    console.log(`[LootManager] Added ${lootItem.itemId} to GlobalInventory`);
                }
            });

            // Save using the proper format that inventory system expects
            const serializedData = {
                items: window.GlobalInventory.serialize(),
                lastUpdated: Date.now()
            };
            
            await inventoryRef.set(serializedData);
            console.log(`[LootManager] ✅ Successfully awarded loot to user ${userId} using proper format`);
            return true;

        } catch (error) {
            console.error('[LootManager] Error awarding loot to player:', error);
            return false;
        }
    }

    /**
     * Process stage completion loot
     * @param {string} stageId - The stage identifier
     * @param {string} userId - The user ID
     * @returns {Promise<Array>} Array of awarded loot items
     */
    async processStageCompletionLoot(stageId, userId) {
        console.log(`[LootManager] Processing stage completion loot for stage: ${stageId}, user: ${userId}`);

        try {
            // Generate loot for the stage
            const loot = this.generateStageLoot(stageId);

            if (loot.length === 0) {
                console.log(`[LootManager] No loot generated for stage: ${stageId}`);
                return [];
            }

            // Award loot to player
            const success = await this.awardLootToPlayer(userId, loot);

            if (success) {
                console.log(`[LootManager] ✅ Successfully processed stage completion loot`);
                return loot;
            } else {
                console.error(`[LootManager] Failed to award loot to player`);
                return [];
            }

        } catch (error) {
            console.error('[LootManager] Error processing stage completion loot:', error);
            return [];
        }
    }

    /**
     * Create a loot table from stage data
     * @param {Object} stageData - Stage data containing loot information
     * @returns {LootTable} The created loot table
     */
    createLootTableFromStageData(stageData) {
        const lootTable = new LootTable();

        if (stageData.loot) {
            // Add guaranteed items (legacy format)
            if (stageData.loot.guaranteed) {
                stageData.loot.guaranteed.forEach(item => {
                    lootTable.addGuaranteedItem(item.itemId, item.quantity || 1);
                });
            }

            // Add chance-based items (legacy format)
            if (stageData.loot.chance) {
                stageData.loot.chance.forEach(item => {
                    lootTable.addItem(item.itemId, item.dropChance, item.quantity || 1);
                });
            }

            // Add items with new format (supports quantity ranges)
            if (stageData.loot.items) {
                stageData.loot.items.forEach(item => {
                    const quantityMin = item.quantityMin || item.quantity || 1;
                    const quantityMax = item.quantityMax || item.quantity || quantityMin;
                    lootTable.addItem(item.itemId, item.dropChance, quantityMin, quantityMax);
                });
            }
        }

        return lootTable;
    }

    /**
     * Get formatted loot description for UI
     * @param {Array} lootItems - Array of { itemId, quantity }
     * @returns {Array} Array of formatted loot descriptions
     */
    getFormattedLootDescription(lootItems) {
        const descriptions = [];

        lootItems.forEach(lootItem => {
            const item = window.ItemRegistry?.getItem(lootItem.itemId);
            if (item) {
                const quantityText = lootItem.quantity > 1 ? ` x${lootItem.quantity}` : '';
                descriptions.push({
                    name: item.name,
                    quantity: lootItem.quantity,
                    rarity: item.rarity,
                    description: item.description,
                    image: item.image,
                    displayText: `${item.name}${quantityText}`
                });
            } else {
                descriptions.push({
                    name: lootItem.itemId,
                    quantity: lootItem.quantity,
                    rarity: 'common',
                    description: 'Unknown item',
                    image: 'items/default.png',
                    displayText: `${lootItem.itemId} x${lootItem.quantity}`
                });
            }
        });

        return descriptions;
    }
}

// Initialize global loot manager
if (typeof window !== 'undefined') {
    window.LootManager = new LootManager();
    console.log('[LootManager] Global loot manager initialized');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LootManager, LootTable };
} 