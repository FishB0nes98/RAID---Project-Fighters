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
        this.type = type; // 'equipment', 'consumable', 'crafting', 'lootbox'
        
        // Type-specific properties
        this.isConsumable = type === 'consumable';
        this.isLootbox = type === 'lootbox';
        this.effect = null; // Function to execute when consumed
        this.cooldownTurns = 0; // Cooldown in turns
        this.lootTable = null; // For lootbox items - defines what items can be obtained
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
     * Set loot table for lootbox items
     * @param {Array} lootTable - Array of {itemId, weight, quantity} objects
     */
    setLootTable(lootTable) {
        this.lootTable = lootTable;
        return this;
    }

    /**
     * Open lootbox and generate random items
     * @param {Character} character - The character opening the lootbox
     * @returns {Object} Result object with success status, message, and generated items
     */
    openLootbox(character) {
        if (!this.isLootbox || !this.lootTable) {
            return { success: false, message: 'Item is not a lootbox or has no loot table' };
        }

        const generatedItems = [];
        const totalWeight = this.lootTable.reduce((sum, entry) => sum + entry.weight, 0);
        
        // Generate only 1 item from the loot table
        const roll = Math.random() * totalWeight;
        let currentWeight = 0;
        
        for (const lootEntry of this.lootTable) {
            currentWeight += lootEntry.weight;
            if (roll <= currentWeight) {
                const quantity = lootEntry.quantity || 1;
                generatedItems.push({
                    itemId: lootEntry.itemId,
                    quantity: quantity
                });
                break;
            }
        }

        return {
            success: true,
            message: `Opened ${this.name}`,
            items: generatedItems
        };
    }

    /**
     * Use consumable item (if it's consumable)
     * @param {Character} character - The character using the item
     * @param {Character} target - The target character (for targeting consumables)
     * @returns {Object} Result object with success status and message
     */
    useConsumable(character, target = null) {
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
        const result = this.effect(character, target);
        
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
        
        // Check for special item effects that need to be applied
        if (this.id === 'shinnoks_dark_magic_bubble' && window.shinnoksDarkMagicBubbleHandler) {
            // Apply Shinnok's Dark Magic Bubble buff immediately when item is equipped
            window.shinnoksDarkMagicBubbleHandler.applyDarkMagicBuffToCharacter(character);
        }
        
        if (this.id === 'shadow_dagger' && window.shadowDaggerHandler) {
            // Apply Shadow Dagger armor penetration buff immediately when item is equipped
            window.shadowDaggerHandler.applyShadowDaggerBuffToCharacter(character);
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
        } else if (this.isLootbox) {
            description += `\n\nType: Lootbox`;
            description += `\nClick to open and discover treasures!`;
        } else if (Object.keys(this.statBonuses).length > 0) {
            description += '\n\nStat Bonuses:';
            Object.entries(this.statBonuses).forEach(([stat, bonus]) => {
                const statName = this.formatStatName(stat);
                const prefix = bonus > 0 ? '+' : '';
                
                // Format percentage stats correctly
                const isPercentageStat = ['critChance', 'critMultiplier', 'dodgeChance', 'lifesteal', 'healingPower'].includes(stat);
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
            lifesteal: 'Life Steal',  // Support both camelCase and lowercase
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
        manaSack.setConsumableEffect((character, target) => {
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

        // Ice Shard - Consumable Item (Target Enemy)
        const iceShard = new Item(
            'ice_shard',
            'Ice Shard',
            'A crystalline fragment of pure ice magic. When thrown at an enemy, it deals 250 damage and freezes them for 2 turns.',
            'items/ice_shard.png',
            'uncommon',
            {},
            'consumable'
        );

        // Set consumable effect for Ice Shard
        iceShard.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            // Ice Shard requires a target
            if (!target) {
                return { success: false, message: 'Ice Shard requires a target', needsTarget: true, targetType: 'enemy' };
            }

            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            if (target.isDead()) {
                return { success: false, message: 'Target is already dead' };
            }

            // Validate that target is an enemy
            if (target.isAI === character.isAI) {
                return { success: false, message: 'Ice Shard can only target enemies' };
            }

            // Apply damage first
            const damage = 250;
            const result = target.applyDamage(damage, 'magical', character, {
                source: 'Ice Shard',
                canDodge: true
            });

            log(`${character.name} throws an Ice Shard at ${target.name}!`, 'consumable-use');

            // If damage wasn't dodged, apply freeze
            if (!result.isDodged) {
                // Apply freeze debuff for 2 turns
                const freezeDebuff = {
                    id: 'freeze',
                    name: 'Freeze',
                    icon: 'items/ice_shard.png',
                    duration: 2,
                    maxDuration: 2,
                    isDebuff: true,
                    source: character.name,
                    description: 'Frozen solid! Abilities have only 58% chance to succeed.',
                    effect: function(character) {
                        // Freeze effect is handled in the ability usage logic
                    },
                    onRemove: function(character) {
                        if (window.AtlanteanSubZeroAbilities) {
                            // Natural expiry melt
                            window.AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                        }
                    }
                };
                
                target.addDebuff(freezeDebuff);
                
                // Show freeze VFX if available
                if (window.AtlanteanSubZeroAbilities) {
                    window.AtlanteanSubZeroAbilities.showFreezeApplicationVFX(target);
                }
                
                log(`💧 ${target.name} is frozen solid for 2 turns!`, 'debuff');
            } else {
                log(`${target.name} dodged the Ice Shard!`, 'dodge');
            }

            // Update character UIs
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
                updateCharacterUI(target);
            }

            return { success: true, message: `Ice Shard hit ${target.name} for ${damage} damage!` };
        }, 8); // 3 turn cooldown

        // Mark as targeting consumable
        iceShard.needsTarget = true;
        iceShard.targetType = 'enemy';

        this.registerItem(iceShard);

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

        // ATLANTEAN TREASURE CHEST - LOOTBOX
        const atlanteanTreasureChest = new Item(
            'atlantean_treasure_chest',
            'Atlantean Treasure Chest',
            'A treasure chest from the depths of Atlantis. What wonders does it hold?',
            'items/atlantean_treasure_chest.webp',
            'rare',
            {},
            'lootbox'
        );

        // Set the loot table for Atlantean Treasure Chest
        atlanteanTreasureChest.setLootTable([
            { itemId: 'cursed_water_vial', weight: 6, quantity: 1 },
            { itemId: 'abyssal_echo', weight: 6, quantity: 1 },
            { itemId: 'piranha_tooth', weight: 6, quantity: 1 },
            { itemId: 'piranha_scales', weight: 6, quantity: 1 },
            { itemId: 'murky_water_vial', weight: 6, quantity: 1 },
            { itemId: 'deep_sea_essence', weight: 6, quantity: 1 },
            { itemId: 'leviathan_scale', weight: 3, quantity: 1 },
            { itemId: 'atlantean_treasure_chest', weight: 4, quantity: 2 },
            { itemId: 'abyssal_anchor', weight: 3, quantity: 1 },
            { itemId: 'pearl_gun', weight: 3, quantity: 1 },
            { itemId: 'mermaid_essence', weight: 3, quantity: 1 },
            { itemId: 'tidal_charm', weight: 3, quantity: 1 },
            { itemId: 'tridens_vow', weight: 2, quantity: 1 },
            { itemId: 'zasalamel_scythe', weight: 2, quantity: 1 },
            { itemId: 'shinnoks_dark_magic_bubble', weight: 2, quantity: 1 },
            { itemId: 'shadow_dagger', weight: 2, quantity: 1 },
            { itemId: 'fish_scale_shoulderplate', weight: 1.5, quantity: 1 },
            { itemId: 'atlantean_crown', weight: 1.5, quantity: 1 },
            { itemId: 'atlantis_teardrop', weight: 1.5, quantity: 1 },
            { itemId: 'pearl_of_the_depths', weight: 1.5, quantity: 1 },
            { itemId: 'atlantean_trident_of_time', weight: 1, quantity: 1 },
            { itemId: 'leviathans_fang', weight: 1, quantity: 1 },
            { itemId: 'kotal_kahns_atlantean_dagger', weight: 1, quantity: 1 },
            { itemId: 'seaborn_crown', weight: 1, quantity: 1 }
        ]);

        this.registerItem(atlanteanTreasureChest);

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
            'items/leviathan_scale.png',
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

        // Zasalamel Scythe - Epic Item
        this.registerItem(new Item(
            'zasalamel_scythe',
            'Zasalamel Scythe',
            '+50 Physical Damage, +10% Lifesteal. Your Q ability also restores 50% of the damage it deals.',
            'items/zasalamel_scythe.png',
            'epic',
            {
                physicalDamage: 50,
                lifesteal: 0.10     // 10% lifesteal (lowercase to match character stats)
            },
            'equipment'
        ));

        // Shinnok's Dark Magic Bubble - Epic Item
        this.registerItem(new Item(
            'shinnoks_dark_magic_bubble',
            "Shinnok's Dark Magic Bubble",
            '+20% Lifesteal. At the start of the game, grants a permanent buff that gives +2 magical damage every turn.',
            'items/shinnoks_dark_magic_bubble.webp',
            'epic',
            {
                lifesteal: 0.20     // 20% lifesteal
            },
            'equipment'
        ));

        // Deep Sea Essence - Crafting Material
        this.registerItem(new Item(
            'deep_sea_essence',
            'Deep Sea Essence',
            'A mystical essence harvested from the deepest trenches of the ocean. Pulsing with ancient marine magic, this rare material is essential for crafting the most powerful aquatic equipment.',
            'items/deep_sea_essence.png',
            'rare',
            {},
            'crafting'
        ));


        // Ice Dagger - Equipment Item
        this.registerItem(new Item(
            'ice_dagger',
            'Ice Dagger',
            'A razor-sharp dagger forged from eternal ice. Its blade never dulls and cuts through enemies with freezing precision, leaving frostbite in its wake.',
            'items/ice_dagger.png',
            'uncommon',
            {
                physicalDamage: 35,
                critChance: 0.12
            },
            'equipment'
        ));

        // Ice Flask - Crafting Material
        this.registerItem(new Item(
            'ice_flask',
            'Ice Flask',
            'A specially crafted flask that can contain and preserve the essence of eternal ice. Used by master craftsmen to infuse equipment with freezing properties.',
            'items/ice_flask.png',
            'uncommon',
            {},
            'crafting'
        ));

        // Shadow Dagger - Epic Item
        this.registerItem(new Item(
            'shadow_dagger',
            'Shadow Dagger',
            '+25 Physical Damage. At game start, one of your random abilities gains the power to ignore 100% armor.',
            'items/shadow_dagger.png',
            'epic',
            {
                physicalDamage: 25
            },
            'equipment'
        ));

        // Cursed Shell - Crafting Material
        this.registerItem(new Item(
            'cursed_shell',
            'Cursed Shell',
            'A mysterious shell tainted with dark magic. Its surface pulses with an eerie glow, making it valuable for crafting cursed equipment.',
            'items/underwater_cursed_shell.png',
            'uncommon',
            {},
            'crafting'
        ));

        // Triden's Vow - Epic Item
        this.registerItem(new Item(
            'tridens_vow',
            "Triden's Vow",
            '+15% Crit Chance. Has 20% chance when you use an ability not to end your turn (doesn\'t call "acted").',
            'items/tridents_vow.webp',
            'epic',
            {
                critChance: 0.15    // 15% crit chance
            },
            'equipment'
        ));

        // Initialize special item effects after all items are registered
        this.initializeSpecialItemEffects();
    }

    /**
     * Initialize special item effects and handlers
     */
    initializeSpecialItemEffects() {
        // Set up Triden's Vow special effect
        this.setupTridensVowEffect();
    }

    /**
     * Set up Triden's Vow special effect - 20% chance to not end turn
     */
    setupTridensVowEffect() {
        // Check if already set up
        if (window.tridensVowHandler) return;

        const tridensVowHandler = {
            // Check if a character has Triden's Vow equipped
            hasItem: function(character) {
                if (!character) return false;
                
                // Check in character's equippedItems array
                if (character.equippedItems && Array.isArray(character.equippedItems)) {
                    for (let i = 0; i < character.equippedItems.length; i++) {
                        const item = character.equippedItems[i];
                        if (item && item.id === 'tridens_vow') {
                            return true;
                        }
                    }
                }
                
                // Check in character's inventory
                if (window.CharacterInventories && window.CharacterInventories.get) {
                    const inventory = window.CharacterInventories.get(character.id);
                    if (inventory) {
                        const items = inventory.getAllItems();
                        for (let i = 0; i < items.length; i++) {
                            const slot = items[i];
                            if (slot && slot.itemId === 'tridens_vow') {
                                return true;
                            }
                        }
                    }
                }
                
                // Check in character's items array (alternative structure)
                if (character.items && Array.isArray(character.items)) {
                    for (let i = 0; i < character.items.length; i++) {
                        const item = character.items[i];
                        if (item && (item.id === 'tridens_vow' || item.itemId === 'tridens_vow')) {
                            return true;
                        }
                    }
                }
                
                return false;
            },

            // Handle ability usage with Triden's Vow effect
            onAbilityUsed: function(character, ability) {
                const hasItem = this.hasItem(character);
                if (!hasItem) return false;

                // 20% chance to not end turn
                const chance = 0.20;
                const roll = Math.random();
                
                if (roll < chance) {
                    // Show visual effect
                    this.showTridensVowEffect(character);
                    
                    // Prevent turn from ending using the game manager
                    if (window.gameManager) {
                        try {
                            // Set the prevent turn end flag
                            window.gameManager.preventTurnEndFlag = true;
                            
                            // Remove character from acted list if present
                            if (window.gameManager.actedCharacters && Array.isArray(window.gameManager.actedCharacters)) {
                                const charIndex = window.gameManager.actedCharacters.indexOf(character.id);
                                if (charIndex > -1) {
                                    window.gameManager.actedCharacters.splice(charIndex, 1);
                                }
                                
                                // Also try instance ID
                                const instanceIndex = window.gameManager.actedCharacters.indexOf(character.instanceId);
                                if (instanceIndex > -1) {
                                    window.gameManager.actedCharacters.splice(instanceIndex, 1);
                                }
                            }
                            
                            // Reset character's hasActed flag if it exists
                            if (character.hasActed !== undefined) {
                                character.hasActed = false;
                            }
                            
                            // Update UI to show character can act again
                            if (window.gameManager.uiManager) {
                                window.gameManager.uiManager.markCharacterAsActive(character);
                                window.gameManager.uiManager.updateEndTurnButton();
                            }
                            
                            // Add log entry
                            if (window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `⚡ ${character.name}'s Triden's Vow allows another action!`,
                                    'item-effect'
                                );
                            }
                            
                            return true; // Effect triggered
                        } catch (error) {
                            console.error('[Triden\'s Vow] Error applying effect:', error);
                        }
                    }
                }
                
                return false; // Effect didn't trigger
            },

            // Show visual effect for Triden's Vow activation
            showTridensVowEffect: function(character) {
                try {
                    // Find the character's visual element
                    const characterElement = document.getElementById(`character-${character.instanceId}`) || 
                                           document.getElementById(`character-${character.id}`) ||
                                           document.querySelector(`[data-character-id="${character.id}"]`);
                    
                    if (characterElement) {
                        // Create effect container
                        const effectContainer = document.createElement('div');
                        effectContainer.className = 'tridens-vow-effect';
                        
                        // Create glow effect
                        const glowEffect = document.createElement('div');
                        glowEffect.className = 'tridens-vow-glow';
                        
                        // Create text effect
                        const textEffect = document.createElement('div');
                        textEffect.className = 'tridens-vow-text';
                        textEffect.textContent = 'Triden\'s Vow!';
                        
                        // Assemble effect
                        effectContainer.appendChild(glowEffect);
                        effectContainer.appendChild(textEffect);
                        
                        // Position relative to character
                        characterElement.style.position = 'relative';
                        characterElement.appendChild(effectContainer);
                        
                        // Remove effect after animation
                        setTimeout(() => {
                            if (effectContainer.parentNode) {
                                effectContainer.parentNode.removeChild(effectContainer);
                            }
                        }, 1500);
                    }
                } catch (error) {
                    console.error('[Triden\'s Vow] Error showing visual effect:', error);
                }
            }
        };

        // Store globally for access
        window.tridensVowHandler = tridensVowHandler;

        // Hook into the game's ability usage system
        const setupAbilityHook = () => {
            // Method 1: Listen for AbilityUsed event (capitalized)
            document.addEventListener('AbilityUsed', (event) => {
                if (event.detail && event.detail.caster && event.detail.ability) {
                    tridensVowHandler.onAbilityUsed(event.detail.caster, event.detail.ability);
                }
            });
            
            // Method 2: Hook into Character.useAbility if available
            const checkForCharacterSystem = () => {
                if (window.Character && window.Character.prototype && window.Character.prototype.useAbility) {
                    if (!window.Character.prototype.useAbility._tridensVowHooked) {
                        const originalUseAbility = window.Character.prototype.useAbility;
                        
                        window.Character.prototype.useAbility = function(abilityIndex, target) {
                            const result = originalUseAbility.call(this, abilityIndex, target);
                            
                            if (this.abilities && this.abilities[abilityIndex]) {
                                const ability = this.abilities[abilityIndex];
                                setTimeout(() => {
                                    tridensVowHandler.onAbilityUsed(this, ability);
                                }, 50);
                            }
                            
                            return result;
                        };
                        
                        window.Character.prototype.useAbility._tridensVowHooked = true;
                    }
                } else {
                    setTimeout(checkForCharacterSystem, 100);
                }
            };
            
            checkForCharacterSystem();
        };

        setupAbilityHook();
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
     * @param {Character} target - The target character (for targeting consumables)
     * @returns {Object} Result object with success status and message
     */
    useConsumableItem(slotIndex, character, target = null) {
        const slot = this.items[slotIndex];
        if (!slot) {
            return { success: false, message: 'No item in this slot' };
        }

        const item = window.ItemRegistry?.getItem(slot.itemId);
        if (!item || !item.isConsumable) {
            return { success: false, message: 'Item is not consumable' };
        }

        // Try to use the consumable
        const result = item.useConsumable(character, target);
        
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
        const item = window.ItemRegistry.getItem(itemId);
        if (!item) {
            console.error(`[GlobalInventory] Attempted to add unknown item: ${itemId}`);
            return;
        }

        // For stackable items, try to stack with existing items first
        if (item.isConsumable || item.type === 'crafting' || item.type === 'lootbox') {
            for (let i = 0; i < this.items.length; i++) {
                const existingItem = this.items[i];
                if (existingItem && existingItem.itemId === itemId) {
                    existingItem.quantity += quantity;
                    return; // Item stacked, no need to add to a new slot
                }
            }
        }

        // If not stackable or no existing stack, find the first empty slot
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === null || this.items[i] === undefined) {
                this.items[i] = { itemId, quantity };
                added = true;
                break;
            }
        }

        // If no empty slots were found, add it to the end
        if (!added) {
            this.items.push({ itemId, quantity });
        }
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

        if (!Array.isArray(data)) {
            // Do not wipe existing items if data is invalid
            return;
        }

        // Clear the current inventory before loading new data
        this.items = [];

        // Handle both old format (string arrays) and new format (object arrays)
        const loadedItems = data.map(entry => {
            if (typeof entry === 'string') {
                return { itemId: entry, quantity: 1 };
            } else if (entry && typeof entry === 'object' && entry.itemId) {
                return { itemId: entry.itemId, quantity: entry.quantity || 1 };
            }
            return null;
        }).filter(entry => entry !== null);

        this.items = loadedItems;

        console.log('[GlobalInventory] DEBUG: Items after deserialize:', this.items);
    }
}

// Global instances should be created manually in the initialization process
// to avoid automatic item addition during script loading

// Zasalamel Scythe Q ability healing effect handler
class ZasalamelScytheHandler {
    constructor() {
        this.boundOnDamageDealt = this.onDamageDealt.bind(this);
        this.initialize();
    }

    initialize() {
        // Listen for damage dealt events
        document.addEventListener('character:damage-dealt', this.boundOnDamageDealt);
        console.log('[ZasalamelScythe] Handler initialized - listening for Q ability damage');
    }

    onDamageDealt(event) {
        const { character: caster, target, damage, damageType, options } = event.detail;
        
        if (!caster || !damage || damage <= 0) return;
        
        // Check if this damage came from a Q ability (index 0)
        const isQAbility = options && options.abilityIndex === 0;
        if (!isQAbility) return;
        
        // Check if the caster has Zasalamel Scythe equipped
        const casterInventory = window.CharacterInventories?.get(caster.id);
        if (!casterInventory) return;
        
        const hasZasalamelScythe = casterInventory.getAllItems().some(itemSlot => 
            itemSlot && itemSlot.itemId === 'zasalamel_scythe'
        );
        
        if (!hasZasalamelScythe) return;
        
        // Calculate healing amount (50% of damage dealt)
        const healingAmount = Math.floor(damage * 0.5);
        
        if (healingAmount <= 0) return;
        
        // Apply healing to the caster
        const currentHp = caster.stats.currentHp || 0;
        const maxHp = caster.stats.maxHp || caster.stats.hp || 100;
        
        if (currentHp >= maxHp) {
            console.log(`[ZasalamelScythe] ${caster.name} already at full HP`);
            return;
        }
        
        const actualHealing = Math.min(healingAmount, maxHp - currentHp);
        caster.stats.currentHp = Math.min(maxHp, currentHp + actualHealing);
        
        // Log the healing
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`⚰️ ${caster.name}'s Zasalamel Scythe restores ${actualHealing} HP from Q ability damage!`, 'heal');
        
        // Trigger healing animation if available
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.triggerHealingAnimation(caster, 'restore', actualHealing);
        }
        
        // Update character UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(caster);
        }
        
        console.log(`[ZasalamelScythe] ${caster.name} healed for ${actualHealing} HP (${damage} damage * 50%)`);
    }

    destroy() {
        document.removeEventListener('character:damage-dealt', this.boundOnDamageDealt);
        console.log('[ZasalamelScythe] Handler destroyed');
    }
}

// Shinnok's Dark Magic Bubble start-of-game buff handler
class ShinnoksDarkMagicBubbleHandler {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Listen for game start events to apply the permanent buff
        document.addEventListener('game:start', this.onGameStart.bind(this));
        document.addEventListener('character:initialized', this.onCharacterInitialized.bind(this));
        document.addEventListener('character:items-applied', this.onCharacterItemsApplied.bind(this));
        console.log('[ShinnoksDarkMagicBubble] Handler initialized - listening for game start and item application');
    }

    onGameStart(event) {
        console.log('[ShinnoksDarkMagicBubble] Game started, checking for items...');
        this.applyDarkMagicBuffs();
    }

    onCharacterItemsApplied(event) {
        if (event.detail && event.detail.character) {
            this.applyDarkMagicBuffToCharacter(event.detail.character);
        }
    }

    onCharacterInitialized(event) {
        if (event.detail && event.detail.character) {
            // Delay to ensure items are loaded
            setTimeout(() => {
                this.applyDarkMagicBuffToCharacter(event.detail.character);
            }, 100);
        }
    }

    applyDarkMagicBuffs() {
        // Check all characters for the item
        if (window.gameManager && window.gameManager.gameState) {
            const allCharacters = [
                ...(window.gameManager.gameState.playerCharacters || []),
                ...(window.gameManager.gameState.aiCharacters || [])
            ];
            
            allCharacters.forEach(character => {
                this.applyDarkMagicBuffToCharacter(character);
            });
        }
    }

    applyDarkMagicBuffToCharacter(character) {
        if (!character) return;
        
        // Check if character has Shinnok's Dark Magic Bubble
        let hasItem = false;
        
        // Check in character inventory
        if (window.CharacterInventories) {
            const inventory = window.CharacterInventories.get(character.id);
            if (inventory) {
                const items = inventory.getAllItems();
                hasItem = items.some(slot => slot && slot.itemId === 'shinnoks_dark_magic_bubble');
            }
        }
        
        if (!hasItem) return;
        
        // Check if buff already applied
        const existingBuff = character.buffs?.find(b => b.id === 'shinnoks_dark_magic');
        if (existingBuff) {
            console.log(`[ShinnoksDarkMagicBubble] ${character.name} already has Dark Magic buff`);
            return;
        }
        
        // Apply permanent buff that gives +2 magical damage every turn
        const darkMagicBuff = {
            id: 'shinnoks_dark_magic',
            name: "Shinnok's Dark Magic",
            icon: '🔮',
            duration: -1, // Permanent
            isDebuff: false,
            isPermanent: true,
            source: "Shinnok's Dark Magic Bubble",
            description: 'Grants +2 magical damage every turn. This effect stacks.',
            
            onTurnStart: function(character) {
                // Increase magical damage by 2
                if (!character.stats.magicalDamage) {
                    character.stats.magicalDamage = 0;
                }
                character.stats.magicalDamage += 2;
                
                // Also update base stats for persistence
                if (!character.baseStats.magicalDamage) {
                    character.baseStats.magicalDamage = 0;
                }
                character.baseStats.magicalDamage += 2;
                
                if (window.gameManager) {
                    window.gameManager.addLogEntry(
                        `🔮 ${character.name}'s Dark Magic increases magical damage by 2! (Total: ${character.stats.magicalDamage})`,
                        'buff'
                    );
                }
                
                console.log(`[ShinnoksDarkMagicBubble] ${character.name} gained +2 magical damage (Total: ${character.stats.magicalDamage})`);
            }
        };
        
        character.addBuff(darkMagicBuff, character);
        console.log(`[ShinnoksDarkMagicBubble] Applied Dark Magic buff to ${character.name}`);
    }
}

// Global debug and test functions for Triden's Vow
window.debugTridensVow = function() {
    console.log('[Triden\'s Vow Debug] Current state:');
    console.log('- Handler available:', !!window.tridensVowHandler);
    console.log('- Character with item:', window.gameManager?.gameState?.playerCharacters?.find(c => 
        window.tridensVowHandler?.hasItem(c)));
};

window.testTridensVowEffect = function(characterName = 'Atlantean Kagome') {
    const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.name === characterName);
    if (!character) {
        console.log('[Triden\'s Vow Test] Character not found:', characterName);
        return;
    }
    
    if (!window.tridensVowHandler) {
        console.log('[Triden\'s Vow Test] Handler not available');
        return;
    }
    
    console.log('[Triden\'s Vow Test] Testing effect for:', character.name);
    const result = window.tridensVowHandler.onAbilityUsed(character, { name: 'Test Ability', id: 'test' });
    console.log('[Triden\'s Vow Test] Result:', result);
    return result;
};

window.testTridensVowGuaranteed = function(characterName = 'Atlantean Kagome') {
    const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.name === characterName);
    if (!character || !window.tridensVowHandler) {
        console.log('[Triden\'s Vow Test] Character or handler not available');
        return;
    }
    
    // Temporarily override Math.random to guarantee activation
    const originalRandom = Math.random;
    Math.random = () => 0.1; // Always roll low enough to activate
    
    console.log('[Triden\'s Vow Test] Testing with guaranteed activation...');
    const result = window.tridensVowHandler.onAbilityUsed(character, { name: 'Test Ability', id: 'test' });
    
    // Restore original Math.random
    Math.random = originalRandom;
    
    console.log('[Triden\'s Vow Test] Guaranteed test result:', result);
    return result;
};

window.giveTridensVow = function(characterName = 'Atlantean Kagome') {
    console.log('=== GIVING TRIDEN\'S VOW TO CHARACTER ===');
    
    const foundCharacter = window.gameManager?.gameState?.playerCharacters?.find(c => c.name === characterName);
    if (!foundCharacter) {
        console.log('[Triden\'s Vow] Character not found:', characterName);
        return;
    }
    
    const inventory = window.CharacterInventories?.get(foundCharacter.id);
    if (!inventory) {
        console.log('[Triden\'s Vow] No inventory found for character');
        return;
    }
    
    const success = inventory.addItem('tridens_vow', 1);
    console.log(`[Triden's Vow] Added Triden's Vow to ${characterName}'s inventory:`, success);
};

// Debug function to give Ice Shard to a character
window.giveIceShard = function(characterName = 'Atlantean Kagome') {
    console.log('=== GIVING ICE SHARD TO CHARACTER ===');
    
    const foundCharacter = window.gameManager?.gameState?.playerCharacters?.find(c => c.name === characterName);
    if (!foundCharacter) {
        console.error(`Character "${characterName}" not found. Available characters:`, 
            window.gameManager?.gameState?.playerCharacters?.map(c => c.name) || 'No characters found');
        return;
    }
    
    const inventory = window.CharacterInventories?.get(foundCharacter.id);
    if (!inventory) {
        console.error(`No inventory found for character ${foundCharacter.name}`);
        return;
    }
    
    const success = inventory.addItem('ice_shard', 1);
    console.log(`[Ice Shard] Added Ice Shard to ${characterName}'s inventory:`, success);
    
    // Check if item was added
    const items = inventory.getAllItems();
    console.log(`[Ice Shard] Character inventory now contains:`, items);
};

window.testIceShard = function() {
    console.log('=== TESTING ICE SHARD ITEM ===');
    
    // Check if ItemRegistry has the ice shard
    const iceShard = window.ItemRegistry?.getItem('ice_shard');
    if (iceShard) {
        console.log('[Ice Shard] Found in ItemRegistry:', iceShard);
        console.log('[Ice Shard] Properties:', {
            id: iceShard.id,
            name: iceShard.name,
            isConsumable: iceShard.isConsumable,
            needsTarget: iceShard.needsTarget,
            targetType: iceShard.targetType,
            cooldownTurns: iceShard.cooldownTurns
        });
    } else {
        console.error('[Ice Shard] NOT found in ItemRegistry');
    }
    
    // List all items in registry
    const allItems = window.ItemRegistry?.getAllItems();
    console.log('[Ice Shard] All items in registry:', allItems?.map(item => item.id) || 'No items');
};

console.log('Ice Shard debug functions loaded:');
console.log('- testIceShard() - Test if Ice Shard is properly loaded');
console.log('- giveIceShard("Character Name") - Give Ice Shard to a character');
