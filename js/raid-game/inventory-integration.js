/**
 * Inventory Integration Manager
 * Handles integration between inventory system and raid game
 */

class InventoryIntegrationManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the inventory integration
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Inventory Integration Manager...');
        
        // Ensure item system is available
        if (!window.ItemRegistry) {
            console.error('ItemRegistry not found! Make sure item-system.js is loaded.');
            return;
        }

        // Only load global inventory if it hasn't been loaded yet
        if (!window.GlobalInventory || !window.GlobalInventory.items || window.GlobalInventory.items.length === 0) {
            console.log('Loading global inventory (not yet loaded)...');
            await this.loadGlobalInventory();
        } else {
            console.log('Global inventory already loaded with', window.GlobalInventory.items.length, 'items - skipping duplicate load');
        }
        
        this.initialized = true;
        console.log('Inventory Integration Manager initialized successfully');
    }

    /**
     * Load global inventory from Firebase
     */
    async loadGlobalInventory() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const globalRef = firebase.database().ref(`users/${user.uid}/globalInventory`);
                const snapshot = await globalRef.once('value');
                const inventoryData = snapshot.val();
                
                if (inventoryData) {
                    if (inventoryData.items && Array.isArray(inventoryData.items)) {
                        // New format: wrapped object with items array
                        window.GlobalInventory.deserialize(inventoryData.items);
                        console.log('Global inventory loaded from Firebase (new format):', inventoryData.items);
                    } else if (Array.isArray(inventoryData)) {
                        // Old format: direct array (backward compatibility)
                        window.GlobalInventory.deserialize(inventoryData);
                        console.log('Global inventory loaded from Firebase (old format):', inventoryData);
                    } else {
                        // Unknown format, start fresh
                        window.GlobalInventory.items = [];
                        console.log('Unknown inventory format, starting empty');
                    }
                } else {
                    console.log('No existing inventory found - user starts with empty inventory');
                    // Users should start with empty inventories and earn items through gameplay
                    window.GlobalInventory.items = [];
                }
            } else {
                console.log('No Firebase auth - starting with empty inventory');
                // Users should start with empty inventories
                window.GlobalInventory.items = [];
            }
        } catch (error) {
            console.error('Failed to load global inventory:', error);
            // Start with empty inventory on error
            window.GlobalInventory.items = [];
        }
    }

    /**
     * Initialize default inventory for new users (DISABLED)
     */
    async initializeDefaultInventory() {
        // Don't add default items - let users start with empty inventories
        // Items should be earned through gameplay
        console.log('Skipping default inventory initialization - users should earn items through gameplay');
    }

    /**
     * Save global inventory to Firebase
     */
    async saveGlobalInventory() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const globalRef = firebase.database().ref(`users/${user.uid}/globalInventory`);
                
                // Use consistent format with loot manager
                const serializedData = {
                    items: window.GlobalInventory.serialize(),
                    lastUpdated: Date.now()
                };
                
                await globalRef.set(serializedData);
                console.log('Global inventory saved to Firebase with new format');
            }
        } catch (error) {
            console.error('Failed to save global inventory:', error);
        }
    }

    /**
     * Apply character inventory items to a character
     * @param {Character|Object} character - The character to apply items to (could be raid game Character class or story mode object)
     */
    async applyCharacterInventory(character) {
        if (!character || !character.id) return;

        try {
            // Load character's inventory
            const inventory = await this.loadCharacterInventory(character.id);
            
            // Apply inventory items to character
            if (inventory) {
                inventory.applyToCharacter(character);
                console.log(`Applied inventory items to ${character.name}:`, character.itemBonuses);
                
                // Check if character has recalculateStats method (raid game characters)
                if (typeof character.recalculateStats === 'function') {
                    // Trigger stats recalculation to apply item bonuses (raid game mode)
                    character.recalculateStats('inventory_applied');
                    console.log(`[InventoryIntegration] Recalculated stats for raid character: ${character.name}`);
                } else {
                    // Handle story mode characters that don't have methods
                    console.log(`[InventoryIntegration] Applied inventory to story character: ${character.name} (no stat recalculation needed)`);
                    
                    // For story mode characters, manually apply bonuses to stats if needed
                    if (character.itemBonuses && character.stats) {
                        Object.keys(character.itemBonuses).forEach(stat => {
                            if (character.stats.hasOwnProperty(stat)) {
                                // Store original value if not already stored
                                const originalKey = `original_${stat}`;
                                if (!character.stats[originalKey]) {
                                    character.stats[originalKey] = character.stats[stat];
                                }
                                
                                // Apply bonus
                                character.stats[stat] = character.stats[originalKey] + character.itemBonuses[stat];
                                console.log(`[InventoryIntegration] Applied ${stat} bonus: ${character.itemBonuses[stat]} (${character.stats[originalKey]} -> ${character.stats[stat]})`);
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to apply inventory to ${character.name}:`, error);
        }
    }

    /**
     * Load character inventory from Firebase
     * @param {string} characterId - The character ID
     * @returns {CharacterInventory} The character's inventory
     */
    async loadCharacterInventory(characterId) {
        // Check if inventory already exists in memory
        if (window.CharacterInventories.has(characterId)) {
            return window.CharacterInventories.get(characterId);
        }

        let inventory = null;
        
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                const inventoryRef = firebase.database().ref(`users/${user.uid}/characterInventories/${characterId}`);
                const snapshot = await inventoryRef.once('value');
                const inventoryData = snapshot.val();
                
                if (inventoryData) {
                    inventory = CharacterInventory.deserialize(inventoryData);
                    console.log(`Loaded inventory for ${characterId} from Firebase:`, inventoryData);
                } else {
                    // Create new inventory
                    inventory = new CharacterInventory(characterId, 6);
                    console.log(`Created new inventory for ${characterId}`);
                }
            } else {
                // Create new inventory if no Firebase
                inventory = new CharacterInventory(characterId, 6);
                console.log(`Created new inventory for ${characterId} (no Firebase)`);
            }
        } catch (error) {
            console.error(`Failed to load inventory for ${characterId}:`, error);
            // Fallback to new inventory
            inventory = new CharacterInventory(characterId, 6);
        }

        // Store in memory
        window.CharacterInventories.set(characterId, inventory);
        return inventory;
    }

    /**
     * Apply inventories to all player characters
     * @param {Array<Character>} characters - Array of characters
     */
    async applyInventoriesToCharacters(characters) {
        if (!Array.isArray(characters)) return;

        const promises = characters.map(character => this.applyCharacterInventory(character));
        await Promise.all(promises);
        
        console.log(`Applied inventories to ${characters.length} characters`);
    }
}

// Global instance
window.InventoryIntegrationManager = new InventoryIntegrationManager();
