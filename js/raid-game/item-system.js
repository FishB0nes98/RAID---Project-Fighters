/**
 * Item System for Project Fighters
 * Handles stat-boosting items and consumable items for characters
 */

class Item {
    constructor(id, name, description, image, rarity = 'common', statBonuses = {}, type = 'equipment') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.image = image; // Path to item image
        this.rarity = rarity; // common, rare, epic, legendary
        this.statBonuses = statBonuses; // { physicalDamage: 50, magicalDamage: 50, ... }
        this.type = type; // 'equipment', 'consumable', 'crafting'
        
        // Consumable-specific properties
        this.isConsumable = type === 'consumable';
        this.effect = null; // Function to execute when consumed
        this.cooldownTurns = 0; // Cooldown in turns
    }

    /**
     * Set consumable effect and cooldown
     * @param {Function} effectFunction - Function to execute when consumed
     * @param {number} cooldownTurns - Cooldown in turns
     */
    setConsumableEffect(effectFunction, cooldownTurns = 0) {
        this.effect = effectFunction;
        this.cooldownTurns = cooldownTurns;
        return this;
    }

    /**
     * Use consumable item (if it's consumable)
     * @param {Character} character - The character using the item
     * @returns {Object} Result object with success status and message
     */
    useConsumable(character) {
        if (!this.isConsumable || !this.effect) {
            return { success: false, message: 'Item is not consumable' };
        }

        // Check if character is on cooldown for this item type
        if (character.consumableCooldowns && character.consumableCooldowns[this.id] > 0) {
            return { 
                success: false, 
                message: `${this.name} is on cooldown for ${character.consumableCooldowns[this.id]} more turns` 
            };
        }

        // Execute the consumable effect
        const result = this.effect(character);
        
        if (result.success) {
            // Set cooldown
            if (!character.consumableCooldowns) {
                character.consumableCooldowns = {};
            }
            character.consumableCooldowns[this.id] = this.cooldownTurns;
        }

        return result;
    }

    /**
     * Apply this item's stat bonuses to a character
     * @param {Character} character - The character to apply bonuses to
     */
    applyToCharacter(character) {
        if (this.isConsumable) return; // Consumables don't provide passive bonuses

        if (!character.itemBonuses) {
            character.itemBonuses = {};
        }

        // Apply each stat bonus
        Object.entries(this.statBonuses).forEach(([stat, bonus]) => {
            if (!character.itemBonuses[stat]) {
                character.itemBonuses[stat] = 0;
            }
            character.itemBonuses[stat] += bonus;
        });

        // Recalculate character stats
        if (character.recalculateStats) {
            character.recalculateStats('item_applied');
        }
    }

    /**
     * Remove this item's stat bonuses from a character
     * @param {Character} character - The character to remove bonuses from
     */
    removeFromCharacter(character) {
        if (this.isConsumable) return; // Consumables don't provide passive bonuses

        if (!character.itemBonuses) {
            return;
        }

        // Remove each stat bonus
        Object.entries(this.statBonuses).forEach(([stat, bonus]) => {
            if (character.itemBonuses[stat]) {
                character.itemBonuses[stat] -= bonus;
                if (character.itemBonuses[stat] <= 0) {
                    delete character.itemBonuses[stat];
                }
            }
        });

        // Recalculate character stats
        if (character.recalculateStats) {
            character.recalculateStats('item_removed');
        }
    }

    /**
     * Get CSS class for rarity styling
     */
    getRarityClass() {
        return `rarity-${this.rarity}`;
    }

    /**
     * Get formatted description with stat bonuses
     */
    getFormattedDescription() {
        let description = this.description;
        
        if (this.isConsumable) {
            description += `\n\nType: Consumable`;
            if (this.cooldownTurns > 0) {
                description += `\nCooldown: ${this.cooldownTurns} turns`;
            }
        } else if (Object.keys(this.statBonuses).length > 0) {
            description += '\n\nStat Bonuses:';
            Object.entries(this.statBonuses).forEach(([stat, bonus]) => {
                const statName = this.formatStatName(stat);
                const prefix = bonus > 0 ? '+' : '';
                description += `\n${prefix}${bonus} ${statName}`;
            });
        }
        
        return description;
    }

    /**
     * Format stat name for display
     */
    formatStatName(stat) {
        const statNames = {
            physicalDamage: 'Physical Damage',
            magicalDamage: 'Magical Damage',
            armor: 'Armor',
            magicalShield: 'Magical Shield',
            hp: 'Health Points',
            mana: 'Mana Points',
            speed: 'Speed',
            critChance: 'Critical Chance',
            critMultiplier: 'Critical Multiplier',
            dodgeChance: 'Dodge Chance',
            hpPerTurn: 'HP per Turn',
            manaPerTurn: 'Mana per Turn'
        };
        return statNames[stat] || stat;
    }
}

class ItemRegistry {
    constructor() {
        this.items = new Map();
        this.initializeDefaultItems();
    }

    /**
     * Initialize default items
     */
    initializeDefaultItems() {
        // Tutorial reward - Long Sword
        this.registerItem(new Item(
            'long_sword',
            'Long Sword',
            'A sturdy steel sword perfect for beginning warriors. Its balanced design enhances physical combat effectiveness.',
            'items/long_sword.webp',
            'common',
            {
                physicalDamage: 5
            }
        ));

        // Golden Arrow - the first item as requested
        this.registerItem(new Item(
            'golden_arrow',
            'Golden Arrow',
            'A magnificent arrow crafted from pure gold, imbued with ancient magic that enhances both physical and magical combat abilities.',
            'items/golden_arrow.webp',
            'legendary',
            {
                physicalDamage: 50,
                magicalDamage: 50
            }
        ));

        // Add more items here as needed
        this.registerItem(new Item(
            'jade_dagger',
            'Jade Dagger',
            'A mystical dagger carved from precious jade.',
            'items/jade_dagger.webp',
            'rare',
            {
                physicalDamage: 30,
                critChance: 5
            }
        ));

        this.registerItem(new Item(
            'amethyst_dragon_scale',
            'Amethyst Dragon Scale',
            'A protective scale from an ancient dragon.',
            'items/amethyst_dragon_scale.webp',
            'epic',
            {
                armor: 25,
                magicalShield: 25
            }
        ));

        this.registerItem(new Item(
            'pearl_gun',
            'Pearl Gun',
            'A powerful weapon from the depths of the ocean.',
            'items/pearl_gun.webp',
            'epic',
            {
                physicalDamage: 40,
                speed: 10
            }
        ));

        this.registerItem(new Item(
            'tridents_vow',
            'Trident\'s Vow',
            'A sacred trident that enhances magical abilities.',
            'items/tridents_vow.webp',
            'legendary',
            {
                magicalDamage: 60,
                mana: 100
            }
        ));

        // FARM DISTURBANCE LOOT ITEMS
        this.registerItem(new Item(
            'farmer_rifle',
            'Farmer Rifle',
            'A reliable hunting rifle used by farmers to protect their crops. Increases physical damage significantly.',
            'items/farmer_rifle.webp',
            'uncommon',
            {
                physicalDamage: 25
            }
        ));

        this.registerItem(new Item(
            'thunder_gloves',
            'Thunder Gloves',
            'Electrified gloves that enhance magical abilities with crackling energy. Worn by skilled elemental farmers.',
            'items/thunder_gloves.webp',
            'uncommon',
            {
                magicalDamage: 25
            }
        ));

        // NEW ITEMS FOR ADVANCED TRAINING STAGE

        // Infernal Cinder - Crafting Material
        this.registerItem(new Item(
            'infernal_cinder',
            'Infernal Cinder',
            'A glowing ember from the depths of hell, containing concentrated fire magic. Used in advanced crafting recipes.',
            'items/infernal_cinder.webp',
            'uncommon',
            {},
            'crafting'
        ));

        // Mana Sack - Consumable Item
        const manaSack = new Item(
            'mana_sack',
            'Mana Sack',
            'A mystical pouch filled with concentrated mana essence. Restores 500 mana when consumed.',
            'items/mana_sack.webp',
            'common',
            {},
            'consumable'
        );

        // Set consumable effect for Mana Sack
        manaSack.setConsumableEffect((character) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const manaRestoreAmount = 500;
            const currentMana = character.stats.currentMana || 0;
            const maxMana = character.stats.maxMana || character.stats.mana || 0;
            
            if (currentMana >= maxMana) {
                return { success: false, message: 'Character already has full mana' };
            }

            const newMana = Math.min(maxMana, currentMana + manaRestoreAmount);
            const actualRestored = newMana - currentMana;
            
            character.stats.currentMana = newMana;
            
            log(`${character.name} consumed a Mana Sack and restored ${actualRestored} mana!`, 'consumable-use');

            // Trigger mana animation if available
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.triggerManaAnimation(character, 'restore', actualRestored);
            }

            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }

            return { success: true, message: `Restored ${actualRestored} mana` };
        }, 5); // 5 turn cooldown

        this.registerItem(manaSack);
    }

    /**
     * Register a new item
     * @param {Item} item - The item to register
     */
    registerItem(item) {
        this.items.set(item.id, item);
    }

    /**
     * Get an item by ID
     * @param {string} itemId - The item ID
     * @returns {Item|null} The item or null if not found
     */
    getItem(itemId) {
        return this.items.get(itemId) || null;
    }

    /**
     * Get all items
     * @returns {Array<Item>} Array of all items
     */
    getAllItems() {
        return Array.from(this.items.values());
    }

    /**
     * Get items by rarity
     * @param {string} rarity - The rarity to filter by
     * @returns {Array<Item>} Array of items with the specified rarity
     */
    getItemsByRarity(rarity) {
        return this.getAllItems().filter(item => item.rarity === rarity);
    }
}

class CharacterInventory {
    constructor(characterId, maxSlots = 6) {
        this.characterId = characterId;
        this.maxSlots = maxSlots;
        this.items = new Array(maxSlots).fill(null); // Array of objects: { itemId: 'item_id', quantity: 1 } or null
    }

    /**
     * Add an item to the inventory with stacking support
     * @param {string} itemId - The item ID to add
     * @param {number} quantity - Quantity to add (default 1)
     * @param {number} slotIndex - Optional slot index, auto-find if not provided
     * @returns {boolean} Success
     */
    addItem(itemId, quantity = 1, slotIndex = null) {
        const item = window.ItemRegistry?.getItem(itemId);
        if (!item) return false;

        // For consumables, try to stack with existing items first
        if (item.isConsumable) {
            for (let i = 0; i < this.maxSlots; i++) {
                const slot = this.items[i];
                if (slot && slot.itemId === itemId) {
                    // Found existing stack, add to it
                    slot.quantity += quantity;
                    return true;
                }
            }
        }

        if (slotIndex !== null) {
            // Add to specific slot
            if (slotIndex >= 0 && slotIndex < this.maxSlots && this.items[slotIndex] === null) {
                this.items[slotIndex] = { itemId, quantity };
                return true;
            }
        } else {
            // Find first empty slot
            for (let i = 0; i < this.maxSlots; i++) {
                if (this.items[i] === null) {
                    this.items[i] = { itemId, quantity };
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Remove items from a specific slot
     * @param {number} slotIndex - The slot index
     * @param {number} quantity - Quantity to remove (default 1)
     * @returns {Object|null} The removed item info or null
     */
    removeItem(slotIndex, quantity = 1) {
        if (slotIndex >= 0 && slotIndex < this.maxSlots && this.items[slotIndex]) {
            const slot = this.items[slotIndex];
            
            if (slot.quantity <= quantity) {
                // Remove entire stack
                const removedItem = { ...slot };
                this.items[slotIndex] = null;
                return removedItem;
            } else {
                // Remove partial quantity
                slot.quantity -= quantity;
                return { itemId: slot.itemId, quantity };
            }
        }
        return null;
    }

    /**
     * Use a consumable item from inventory
     * @param {number} slotIndex - The slot index
     * @param {Character} character - The character using the item
     * @returns {Object} Result object with success status and message
     */
    useConsumableItem(slotIndex, character) {
        const slot = this.items[slotIndex];
        if (!slot) {
            return { success: false, message: 'No item in this slot' };
        }

        const item = window.ItemRegistry?.getItem(slot.itemId);
        if (!item || !item.isConsumable) {
            return { success: false, message: 'Item is not consumable' };
        }

        // Try to use the consumable
        const result = item.useConsumable(character);
        
        if (result.success) {
            // Remove one from the stack
            this.removeItem(slotIndex, 1);
        }

        return result;
    }

    /**
     * Move an item from one slot to another
     * @param {number} fromSlot - Source slot index
     * @param {number} toSlot - Destination slot index
     * @returns {boolean} Success
     */
    moveItem(fromSlot, toSlot) {
        if (fromSlot >= 0 && fromSlot < this.maxSlots && 
            toSlot >= 0 && toSlot < this.maxSlots) {
            const temp = this.items[toSlot];
            this.items[toSlot] = this.items[fromSlot];
            this.items[fromSlot] = temp;
            return true;
        }
        return false;
    }

    /**
     * Get item at specific slot
     * @param {number} slotIndex - The slot index
     * @returns {Object|null} The item slot data or null
     */
    getItem(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.maxSlots) {
            return this.items[slotIndex];
        }
        return null;
    }

    /**
     * Get all items in inventory
     * @returns {Array<Object|null>} Array of item slot data or null
     */
    getAllItems() {
        return [...this.items];
    }

    /**
     * Get all consumable items with their character info
     * @returns {Array} Array of consumable items with slot info
     */
    getConsumableItems() {
        const consumables = [];
        this.items.forEach((slot, index) => {
            if (slot) {
                const item = window.ItemRegistry?.getItem(slot.itemId);
                if (item && item.isConsumable) {
                    consumables.push({
                        slotIndex: index,
                        itemId: slot.itemId,
                        quantity: slot.quantity,
                        item: item,
                        characterId: this.characterId
                    });
                }
            }
        });
        return consumables;
    }

    /**
     * Check if inventory has space
     * @returns {boolean} True if has empty slot
     */
    hasSpace() {
        return this.items.includes(null);
    }

    /**
     * Get number of empty slots
     * @returns {number} Number of empty slots
     */
    getEmptySlots() {
        return this.items.filter(item => item === null).length;
    }

    /**
     * Apply all inventory items to a character
     * @param {Character} character - The character to apply items to
     */
    applyToCharacter(character) {
        // Clear existing item bonuses
        character.itemBonuses = {};

        // Ensure this.items is an array
        if (!Array.isArray(this.items)) {
            console.warn('CharacterInventory.items is not an array:', this.items);
            this.items = new Array(this.maxSlots).fill(null);
            return;
        }

        // Apply each item (only equipment items provide passive bonuses)
        this.items.forEach(slot => {
            if (slot && slot.itemId) {
                const item = window.ItemRegistry?.getItem(slot.itemId);
                if (item && !item.isConsumable) { // Only apply equipment items
                    item.applyToCharacter(character);
                }
            }
        });
    }

    /**
     * Serialize inventory for saving
     * @returns {Object} Serialized inventory data
     */
    serialize() {
        // Ensure items is always a proper array for Firebase
        const itemsArray = Array.isArray(this.items) ? [...this.items] : new Array(this.maxSlots).fill(null);
        
        return {
            characterId: this.characterId,
            maxSlots: this.maxSlots,
            items: itemsArray,
            // Add a marker to help with deserialization
            _isArray: true
        };
    }

    /**
     * Deserialize inventory from saved data
     * @param {Object} data - Serialized inventory data
     * @returns {CharacterInventory} New inventory instance
     */
    static deserialize(data) {
        const inventory = new CharacterInventory(data.characterId, data.maxSlots);
        
        // Handle Firebase object-to-array conversion and upgrade old format
        if (data.items) {
            if (Array.isArray(data.items)) {
                // Convert old format (just itemId strings) to new format (objects with itemId and quantity)
                inventory.items = data.items.map(item => {
                    if (typeof item === 'string') {
                        // Old format: just itemId string
                        return { itemId: item, quantity: 1 };
                    } else if (item && typeof item === 'object' && item.itemId) {
                        // New format: object with itemId and quantity
                        return { itemId: item.itemId, quantity: item.quantity || 1 };
                    }
                    return null; // Empty slot
                });
            } else if (typeof data.items === 'object') {
                // Firebase converted sparse array to object, convert back
                console.log('[CharacterInventory] Converting Firebase object to array:', data.items);
                inventory.items = new Array(data.maxSlots).fill(null);
                
                // Convert object keys to array indices
                Object.entries(data.items).forEach(([key, value]) => {
                    const index = parseInt(key);
                    if (!isNaN(index) && index >= 0 && index < data.maxSlots) {
                        if (typeof value === 'string') {
                            // Old format
                            inventory.items[index] = { itemId: value, quantity: 1 };
                        } else if (value && typeof value === 'object' && value.itemId) {
                            // New format
                            inventory.items[index] = { itemId: value.itemId, quantity: value.quantity || 1 };
                        }
                    }
                });
                
                console.log('[CharacterInventory] Converted to array:', inventory.items);
            } else {
                // Fallback to empty array
                inventory.items = new Array(data.maxSlots).fill(null);
            }
        } else {
            // No items data, create empty array
            inventory.items = new Array(data.maxSlots).fill(null);
        }
        
        return inventory;
    }
}

class GlobalInventory {
    constructor() {
        this.items = []; // Array of item IDs
    }

    /**
     * Add an item to global inventory
     * @param {string} itemId - The item ID to add
     */
    addItem(itemId) {
        console.log(`[GlobalInventory] DEBUG: Adding item "${itemId}" to global inventory. Stack trace:`, new Error().stack);
        this.items.push(itemId);
    }

    /**
     * Remove an item from global inventory
     * @param {number} index - The index of the item to remove
     * @returns {string|null} The removed item ID or null
     */
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Get all items in global inventory
     * @returns {Array<string>} Array of item IDs
     */
    getAllItems() {
        return [...this.items];
    }

    /**
     * Get item count by ID
     * @param {string} itemId - The item ID
     * @returns {number} Number of this item in inventory
     */
    getItemCount(itemId) {
        return this.items.filter(id => id === itemId).length;
    }

    /**
     * Serialize global inventory for saving
     * @returns {Array<string>} Array of item IDs
     */
    serialize() {
        return [...this.items];
    }

    /**
     * Deserialize global inventory from saved data
     * @param {Array<string>} data - Array of item IDs
     */
    deserialize(data) {
        console.log('[GlobalInventory] DEBUG: deserialize() called with data:', data);
        console.log('[GlobalInventory] DEBUG: Current items before deserialize:', this.items);
        
        this.items = data || [];
        
        console.log('[GlobalInventory] DEBUG: Items after deserialize:', this.items);
    }
}

// Global instances should be created manually in the initialization process
// to avoid automatic item addition during script loading

// Export classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Item, ItemRegistry, CharacterInventory, GlobalInventory };
} 