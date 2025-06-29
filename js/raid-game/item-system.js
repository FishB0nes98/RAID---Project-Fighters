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

        // Apply each stat bonus with careful handling
        Object.entries(this.statBonuses).forEach(([stat, bonus]) => {
            // Special handling for HP and healing power
            if (stat === 'hp' || stat === 'maxHp') {
                // Preserve initial current HP while increasing max HP
                const baseMaxHp = character.baseStats.maxHp || character.baseStats.hp || 0;
                const initialCurrentHp = character.stats.currentHp || baseMaxHp;
                
                // Only apply if the bonus is significant
                if (!character.itemBonuses[stat] || bonus > character.itemBonuses[stat]) {
                    character.itemBonuses[stat] = bonus;
                    
                    // Increase max HP
                    const newMaxHp = baseMaxHp + bonus;
                    character.stats.maxHp = newMaxHp;
                    
                    // Preserve initial current HP percentage
                    const currentHpPercentage = initialCurrentHp / baseMaxHp;
                    character.stats.currentHp = Math.floor(newMaxHp * currentHpPercentage);
                    
                    console.log(`[Item] Applied max HP bonus: +${bonus}, new maxHp: ${newMaxHp}, initial currentHp: ${character.stats.currentHp}`);
                }
            } else if (stat === 'healingPower') {
                // Prevent duplicate healing power bonuses
                const currentHealingPower = character.stats.healingPower || 0;
                const talentHealingPower = character.baseStats.healingPower || 0;
                
                // Only apply if the item bonus is greater than the current healing power
                // and doesn't exceed a reasonable total
                if (bonus > 0 && currentHealingPower < bonus + talentHealingPower) {
                    const newHealingPower = Math.min(
                        currentHealingPower + bonus, 
                        talentHealingPower + bonus
                    );
                    
                    character.stats.healingPower = newHealingPower;
                    console.log(`[Item] Applied healing power bonus: +${bonus}, new healingPower: ${character.stats.healingPower}`);
                }
            } else {
                // Default handling for other stats
                if (!character.itemBonuses[stat]) {
                    character.itemBonuses[stat] = 0;
                }
                character.itemBonuses[stat] += bonus;
            }
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
                
                // Format percentage stats correctly
                const isPercentageStat = ['critChance', 'critMultiplier', 'dodgeChance', 'lifeSteal', 'healingPower'].includes(stat);
                const displayValue = isPercentageStat ? `${Math.round(bonus * 100)}%` : bonus;
                
                description += `\n${prefix}${displayValue} ${statName}`;
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
            manaPerTurn: 'Mana per Turn',
            lifeSteal: 'Life Steal',
            healingPower: 'Healing Power',
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

        // ABYSSAL ITEMS
        this.registerItem(new Item(
            'abyssal_anchor',
            'Abyssal Anchor',
            'A heavy anchor forged in the depths of the abyss, providing exceptional protection. The dark metal seems to absorb incoming attacks.',
            'items/abyssal_anchor.webp',
            'rare',
            {
                armor: 10            // 10 flat armor points
            }
        ));

        this.registerItem(new Item(
            'abyssal_echo',
            'Abyssal Echo',
            'A mysterious resonance trapped within a crystalline structure. The echo whispers of ancient powers and forgotten crafting techniques.',
            'items/abyssal_echo.png',
            'rare',
            {},
            'crafting'
        ));

        // NEW CRAFTING AND EQUIPMENT ITEMS
        this.registerItem(new Item(
            'cursed_water_vial',
            'Cursed Water Vial',
            'A vial filled with dark, corrupted water from the depths. The liquid seems to pulse with malevolent energy, perfect for dark crafting rituals.',
            'items/cursed_water_vial.png',
            'uncommon',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'pearl_of_the_depths',
            'Pearl of the Depths',
            'A luminous pearl harvested from the deepest ocean trenches. Its gentle glow enhances healing magic and restorative abilities.',
            'items/pearl_of_the_depths.webp',
            'epic',
            {
                healingPower: 0.10    // 10% healing power increase
            }
        ));

        this.registerItem(new Item(
            'piranha_tooth',
            'Piranha Tooth',
            'A razor-sharp tooth from a ferocious piranha. Its deadly edge can be used in weapon crafting or as a component for enhanced damage.',
            'items/piranha_tooth.png',
            'common',
            {
                physicalDamage: 2
            },
            'crafting'
        ));

        this.registerItem(new Item(
            'piranha_scales',
            'Piranha Scales',
            'Tough, iridescent scales from a piranha. These scales are highly valued for their durability and can be used in armor crafting.',
            'items/piranha_scales.png',
            'common',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'pearl_gun',
            'Pearl Gun',
            'An elegant firearm crafted with pearl inlays and enchanted with precision magic. Its shots have an uncanny ability to find their mark.',
            'items/pearl_gun.webp',
            'rare',
            {
                critChance: 0.20     // 20% crit chance
            }
        ));

        // ATLANTEAN ITEMS
        this.registerItem(new Item(
            'atlantean_crown',
            'Atlantean Crown',
            'A magnificent crown worn by the rulers of lost Atlantis. Imbued with the power of the ocean depths, it enhances all aspects of combat prowess.',
            'items/atlantean_crown.webp',
            'epic',
            {
                physicalDamage: 10,
                magicalDamage: 15,
                armor: 5,
                magicalShield: 5,
                hp: 50,
                mana: 50,
                critChance: 0.05,    // 5% as decimal
                critMultiplier: 0.05, // 5% as decimal  
                dodgeChance: 0.05    // 5% as decimal
            }
        ));

        this.registerItem(new Item(
            'atlantean_trident_of_time',
            'Atlantean Trident of Time',
            'A legendary weapon that once belonged to the time-keepers of Atlantis. Its three prongs can pierce through reality itself, dealing devastating damage while draining life from enemies.',
            'items/atlantean_trident_time.png',
            'legendary',
            {
                physicalDamage: 295,
                lifesteal: 0.10      // 10% as decimal
            }
        ));

        this.registerItem(new Item(
            'atlantis_teardrop',
            'Atlantis Teardrop',
            'A crystallized tear from the last queen of Atlantis, shed as her kingdom sank beneath the waves. Contains immense magical energy.',
            'items/atlantis_teardrop.webp',
            'epic',
            {
                mana: 325
            }
        ));

        this.registerItem(new Item(
            'tidal_charm',
            'Tidal Charm',
            'When you heal, a random ally is also healed for 25% of the original amount.',
            'items/Tidal_Charm.png',
            'rare',
            {},
            'equipment'
        ));

        this.registerItem(new Item(
            'leviathans_fang',
            "Leviathan's Fang",
            'Your Q ability when used, it casts one additional time.',
            'items/leviathans_fang.webp',
            'legendary',
            {},
            'equipment'
        ));

        // NEWLY ADDED ITEMS
        this.registerItem(new Item(
            'murky_water_vial',
            'Murky Water Vial',
            'A vial of murky water, used for crafting.',
            'items/Murky_Water_Vial.png',
            'common',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'shadow_essence',
            'Shadow Essence',
            'A dark, swirling essence, used for crafting.',
            'items/shadow_essence.png',
            'rare',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'stormcallers_orb',
            "Stormcaller's Orb",
            'Increases Crit Damage by an additional 20%.',
            'items/stormcallers_orb.webp',
            'epic',
            {
                critMultiplier: 0.20 // 20% crit damage
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'tideborn_breastplate',
            'Tideborn Breastplate',
            'Heals 5% of the damage received.',
            'items/tideborn_breastplate.webp',
            'epic',
            {}, // Removed healingPower stat bonus
            'equipment'
        ));

        this.registerItem(new Item(
            'water_elemental_crystal',
            'Water Elemental Crystal',
            '+22 Mana regen, +5 HP Regen',
            'items/water_elemental_crystal.webp',
            'rare',
            {
                manaPerTurn: 22,
                hpPerTurn: 5
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'wavebreaker',
            'Wavebreaker',
            '+30 Physical Damage +150 HP',
            'items/wavebreaker.webp',
            'epic',
            {
                physicalDamage: 30,
                hp: 150
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'void_essence',
            'Void Essence',
            'A dark, unstable essence, used for crafting.',
            'items/Void_Essence.png',
            'legendary',
            {},
            'crafting'
        ));

        // Ice Items
        this.registerItem(new Item(
            'ice_dagger',
            'Ice Dagger',
            '+25 AD. Gives your Q ability 10% chance to freeze the target for 2 turns.',
            'items/ice_dagger.png',
            'rare',
            { physicalDamage: 25 },
            'equipment'
        ));

        this.registerItem(new Item(
            'ice_flask',
            'Ice Flask',
            'A flask containing a chilling liquid. Used in ice-related crafting recipes.',
            'items/ice_flask.png',
            'common',
            {},
            'crafting'
        ));

        const iceShard = new Item(
            'ice_shard',
            'Ice Shard',
            'Throws an ice shard onto a random enemy dealing 200 Magical Damage and freezing it for 3 turns.',
            'items/ice_shard.png',
            'uncommon',
            {},
            'consumable'
        );

        iceShard.setConsumableEffect((character) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const enemies = window.gameManager.gameState.aiCharacters.filter(enemy => !enemy.isDead());
            if (enemies.length === 0) {
                log('No enemies to target.', 'system');
                return { success: false, message: 'No valid targets' };
            }

            const target = enemies[Math.floor(Math.random() * enemies.length)];
            const damage = 200;
            const freezeDuration = 3;

            // Apply damage
            const result = target.applyDamage(damage, 'magical', character, { abilityId: 'ice_shard' });
            log(`${character.name} used Ice Shard on ${target.name}, dealing ${damage} magical damage!`, 'consumable-use');

            // Only apply freeze if damage wasn't dodged
            if (!result.isDodged) {
                const existingFreeze = target.debuffs && target.debuffs.find(d => d.id === 'freeze');
                if (!existingFreeze) {
                    const freezeDebuff = {
                        id: 'freeze',
                        name: 'Frozen',
                        icon: '❄️',
                        duration: freezeDuration,
                        maxDuration: freezeDuration,
                        isDebuff: true,
                        source: character.name,
                        description: 'Frozen solid! Character is stunned for the duration.',
                        type: 'stun', // This will prevent the character from acting
                        onRemove: function(character) {
                            if (window.AtlanteanSubZeroAbilities) {
                                window.AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                            }
                        }
                    };
                    
                    target.addDebuff(freezeDebuff, character);
                    
                    if (window.AtlanteanSubZeroAbilities && window.AtlanteanSubZeroAbilities.showFreezeApplicationVFX) {
                        window.AtlanteanSubZeroAbilities.showFreezeApplicationVFX(target);
                    }
                    
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`❄️ ${target.name} is frozen solid!`, 'debuff');
                    }
                }
            }

            return { success: true, message: 'Used Ice Shard' };
        }, 10); // 10 turn cooldown

        this.registerItem(iceShard);

        // New Items from Request
        this.registerItem(new Item(
            'icicle_spear',
            'Icicle Spear',
            '+180 Magical Damage. Your abilities have a 5% chance to freeze the target damaged.',
            'items/icicle_spear.webp',
            'legendary',
            { magicalDamage: 180 },
            'equipment'
        ));

        this.registerItem(new Item(
            'golden_arrow',
            'Golden Arrow',
            '+50 Physical & +50 Magical Damage. Your abilities now also scale with 20% of your magical Damage.',
            'items/golden_arrow.webp',
            'legendary',
            { physicalDamage: 50, magicalDamage: 50 },
            'equipment'
        ));

        this.registerItem(new Item(
            'golden_mask',
            'Golden Mask',
            '+10 Magic Resistance.',
            'items/golden_mask.webp',
            'common',
            { magicalShield: 10 },
            'equipment'
        ));

        // NEW ATLANTEAN ITEMS
        this.registerItem(new Item(
            'fish_scale_shoulderplate',
            'Fish Scale Shoulderplate',
            'Every turn 15% chance to be healed by 15% of your MaxHP/HP.',
            'items/fish_scale_shoulderplate.webp',
            'epic',
            {
                armor: 4,
                magicalShield: 4
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'kotal_kahns_atlantean_dagger',
            'Kotal Kahn\'s Atlantean Dagger',
            'Legendary dagger that enhances healing and vitality.',
            'items/kotal_kahns_atlantean_dagger.webp',
            'legendary',
            {
                healingPower: 0.15,
                hpPerTurn: 50,
                hp: 400
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'leviathan_scale',
            'Leviathan Scale',
            'A massive scale from the legendary Leviathan, containing ancient oceanic power. Used in advanced crafting recipes.',
            'items/leviathan_scale.webp',
            'epic',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'mermaid_essence',
            'Mermaid Essence',
            'A concentrated essence of mermaid magic, enhancing life-stealing abilities.',
            'items/mermaid_essence.webp',
            'rare',
            {
                lifesteal: 0.08        // 8% lifesteal
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'seaborn_crown',
            'Seaborn Crown',
            'Your Heals place a buff on the healed target increasing their armor by 5.',
            'items/seaborn_crown.webp',
            'legendary',
            {},
            'equipment'
        ));
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

        // For consumables and crafting materials, try to stack with existing items first
        if (item.isConsumable || item.type === 'crafting') {
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
            if (slotIndex >= 0 && slotIndex < this.maxSlots) {
                if (this.items[slotIndex] === null || this.items[slotIndex] === undefined) {
                    // Slot is empty, add item
                    this.items[slotIndex] = { itemId, quantity };
                    console.log(`📦 [CharacterInventory] Added ${itemId} (qty: ${quantity}) to slot ${slotIndex}`);
                    return true;
                } else {
                    // Slot is occupied, try to stack if same item and stackable
                    const existingSlot = this.items[slotIndex];
                    if (existingSlot.itemId === itemId) {
                        const item = window.ItemRegistry?.getItem(itemId);
                        if (item && (item.isConsumable || item.type === 'crafting')) {
                            existingSlot.quantity += quantity;
                            console.log(`📦 [CharacterInventory] Stacked ${itemId}, new quantity: ${existingSlot.quantity}`);
                            return true;
                        }
                    }
                    console.warn(`📦 [CharacterInventory] Cannot add to occupied slot ${slotIndex}:`, existingSlot);
                    return false;
                }
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
        
        // Firebase doesn't allow undefined values - convert any undefined to null
        const cleanedItems = itemsArray.map(item => item === undefined ? null : item);
        
        console.log(`📦 [CharacterInventory] Serializing ${this.characterId}:`, {
            original: this.items,
            cleaned: cleanedItems,
            hasUndefined: itemsArray.some(item => item === undefined)
        });
        
        return {
            characterId: this.characterId,
            maxSlots: this.maxSlots,
            items: cleanedItems,
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
        this.items = []; // Array of objects: { itemId: 'item_id', quantity: 1 } or for compatibility with old saves: just item ID strings
    }

    /**
     * Add an item to global inventory with stacking support
     * @param {string} itemId - The item ID to add
     * @param {number} quantity - Quantity to add (default 1)
     */
    addItem(itemId, quantity = 1) {
        console.log(`[GlobalInventory] DEBUG: Adding item "${itemId}" (qty: ${quantity}) to global inventory`);
        
        const item = window.ItemRegistry?.getItem(itemId);
        
        // For consumables and crafting materials, try to stack with existing items
        if (item && (item.isConsumable || item.type === 'crafting')) {
            for (let i = 0; i < this.items.length; i++) {
                const existing = this.items[i];
                // Handle both new format (objects) and old format (strings)
                const existingItemId = typeof existing === 'object' ? existing.itemId : existing;
                
                if (existingItemId === itemId) {
                    // Found existing stack, add to it
                    if (typeof existing === 'object') {
                        existing.quantity += quantity;
                    } else {
                        // Convert old format to new format
                        this.items[i] = { itemId: itemId, quantity: 1 + quantity };
                    }
                    console.log(`[GlobalInventory] Stacked ${quantity} ${itemId}. New quantity: ${this.items[i].quantity || (quantity + 1)}`);
                    return;
                }
            }
        }
        
        // No existing stack found or not stackable, add new entry
        this.items.push({ itemId, quantity });
    }

    /**
     * Stack two items if they are the same consumable or crafting material
     * @param {number} sourceIndex - Index of source item
     * @param {number} targetIndex - Index of target item
     * @returns {boolean} True if items were stacked
     */
    stackItems(sourceIndex, targetIndex) {
        if (sourceIndex === targetIndex) return false;
        
        const sourceEntry = this.items[sourceIndex];
        const targetEntry = this.items[targetIndex];
        
        if (!sourceEntry || !targetEntry) return false;
        
        // Handle both new format (objects) and old format (strings)
        const sourceItemId = typeof sourceEntry === 'object' ? sourceEntry.itemId : sourceEntry;
        const targetItemId = typeof targetEntry === 'object' ? targetEntry.itemId : targetEntry;
        const sourceQuantity = typeof sourceEntry === 'object' ? sourceEntry.quantity : 1;
        
        if (sourceItemId === targetItemId) {
            const item = window.ItemRegistry?.getItem(sourceItemId);
            if (item && (item.isConsumable || item.type === 'crafting')) {
                // Add source quantity to target
                if (typeof targetEntry === 'object') {
                    targetEntry.quantity += sourceQuantity;
                } else {
                    // Convert target to new format
                    this.items[targetIndex] = { itemId: targetItemId, quantity: 1 + sourceQuantity };
                }
                
                // Remove source entry
                this.items.splice(sourceIndex, 1);
                console.log(`[GlobalInventory] Stacked ${sourceQuantity} ${sourceItemId} into existing stack`);
                return true;
            }
        }
        return false;
    }

    /**
     * Remove items from global inventory
     * @param {number} index - The index of the item to remove
     * @param {number} quantity - Quantity to remove (default 1, or all if quantity >= stack size)
     * @returns {Object|null} The removed item info or null
     */
    removeItem(index, quantity = 1) {
        console.log(`🗑️ [GlobalInventory] removeItem called: index=${index}, quantity=${quantity}`);
        console.log(`🗑️ [GlobalInventory] Current items before removal:`, this.items);
        
        if (index >= 0 && index < this.items.length) {
            const entry = this.items[index];
            console.log(`🗑️ [GlobalInventory] Entry at index ${index}:`, entry);
            
            // Handle both new format (objects) and old format (strings)
            if (typeof entry === 'object') {
                console.log(`🗑️ [GlobalInventory] Current quantity: ${entry.quantity}, removing: ${quantity}`);
                
                if (entry.quantity <= quantity) {
                    // Remove entire stack
                    console.log(`🗑️ [GlobalInventory] Removing entire stack (${entry.quantity} <= ${quantity})`);
                    const removedStack = this.items.splice(index, 1)[0];
                    console.log(`🗑️ [GlobalInventory] Removed stack:`, removedStack);
                    console.log(`🗑️ [GlobalInventory] Items after complete removal:`, this.items);
                    return removedStack;
                } else {
                    // Remove partial quantity
                    console.log(`🗑️ [GlobalInventory] Removing partial quantity (${entry.quantity} > ${quantity})`);
                    const originalQuantity = entry.quantity;
                    entry.quantity -= quantity;
                    console.log(`🗑️ [GlobalInventory] Updated quantity: ${originalQuantity} → ${entry.quantity}`);
                    console.log(`🗑️ [GlobalInventory] Items after partial removal:`, this.items);
                    return { itemId: entry.itemId, quantity };
                }
            } else {
                // Old format - remove the entire entry
                console.log(`🗑️ [GlobalInventory] Old format entry, removing entire item`);
                const removedItem = this.items.splice(index, 1)[0];
                console.log(`🗑️ [GlobalInventory] Items after old format removal:`, this.items);
                return { itemId: removedItem, quantity: 1 };
            }
        } else {
            console.warn(`🗑️ [GlobalInventory] Invalid index: ${index} (length: ${this.items.length})`);
        }
        return null;
    }

    /**
     * Get all items in global inventory (for display)
     * @returns {Array<string>} Array of item IDs (expanded for display)
     */
    getAllItems() {
        const expandedItems = [];
        
        this.items.forEach(entry => {
            if (typeof entry === 'object') {
                // New format: repeat itemId by quantity
                for (let i = 0; i < entry.quantity; i++) {
                    expandedItems.push(entry.itemId);
                }
            } else {
                // Old format: just add the string
                expandedItems.push(entry);
            }
        });
        
        return expandedItems;
    }

    /**
     * Get item stacks (for UI display)
     * @returns {Array<Object>} Array of {itemId, quantity} objects
     */
    getItemStacks() {
        return this.items.map(entry => {
            if (typeof entry === 'object') {
                return { ...entry };
            } else {
                return { itemId: entry, quantity: 1 };
            }
        });
    }

    /**
     * Get item count by ID
     * @param {string} itemId - The item ID
     * @returns {number} Total quantity of this item in inventory
     */
    getItemCount(itemId) {
        let totalCount = 0;
        
        this.items.forEach(entry => {
            if (typeof entry === 'object') {
                if (entry.itemId === itemId) {
                    totalCount += entry.quantity;
                }
            } else {
                if (entry === itemId) {
                    totalCount += 1;
                }
            }
        });
        
        return totalCount;
    }

    /**
     * Serialize global inventory for saving
     * @returns {Array} Array of item stacks
     */
    serialize() {
        // Convert all items to new format for saving
        return this.items.map(entry => {
            if (typeof entry === 'object') {
                return { itemId: entry.itemId, quantity: entry.quantity };
            } else {
                return { itemId: entry, quantity: 1 };
            }
        });
    }

    /**
     * Deserialize global inventory from saved data
     * @param {Array} data - Array of item IDs or stack objects
     */
    deserialize(data) {
        console.log('[GlobalInventory] DEBUG: deserialize() called with data:', data);
        console.log('[GlobalInventory] DEBUG: Current items before deserialize:', this.items);
        
        if (!Array.isArray(data)) {
            this.items = [];
            return;
        }
        
        // Handle both old format (string arrays) and new format (object arrays)
        this.items = data.map(entry => {
            if (typeof entry === 'string') {
                // Old format: convert to new format
                return { itemId: entry, quantity: 1 };
            } else if (entry && typeof entry === 'object' && entry.itemId) {
                // New format: ensure quantity exists
                return { itemId: entry.itemId, quantity: entry.quantity || 1 };
            }
            return null;
        }).filter(entry => entry !== null);
        
        console.log('[GlobalInventory] DEBUG: Items after deserialize:', this.items);
    }
}

// Global instances should be created manually in the initialization process
// to avoid automatic item addition during script loading

// Export classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Item, ItemRegistry, CharacterInventory, GlobalInventory };
}
