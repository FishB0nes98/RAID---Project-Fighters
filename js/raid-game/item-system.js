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
    async openLootbox(character) {
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
            } else {
                // Default handling for all stats, including healingPower
                if (!character.itemBonuses[stat]) {
                    character.itemBonuses[stat] = 0;
                }
                character.itemBonuses[stat] += bonus;
                console.log(`[Item] Applied item bonus to itemBonuses.${stat}: +${bonus}, new total: ${character.itemBonuses[stat]}`);
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

        // Dispatch a custom event to notify that items have been applied
        document.dispatchEvent(new CustomEvent('character:items-applied', {
            detail: { character: character }
        }));
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
     * Set up Crow Crown special effect
     */
    setupCrowCrownEffect() {
        if (window.crowCrownHandler) return;

        const handler = {
            hasItem: function(character) {
                if (!character) return false;
                const inventory = window.CharacterInventories?.get(character.id);
                return inventory?.getAllItems().some(slot => slot?.itemId === 'crow_crown');
            },
            applyEffect: function(character) {
                console.log(`[CrowCrown] applyEffect called for character: ${character.name}`);
                if (this.hasItem(character)) {
                    const characterElement = document.getElementById(`character-${character.instanceId}`) || 
                                           document.getElementById(`character-${character.id}`) ||
                                           document.querySelector(`[data-character-id="${character.id}"]`);
                    if (characterElement) {
                        characterElement.classList.add('crow-crown-visual');
                        // Add helper classes to ALL parent containers to disable CSS containment
                        document.body.classList.add('has-crow-crown');
                        const gameContainer = document.querySelector('.game-container');
                        if (gameContainer) {
                            gameContainer.classList.add('has-crow-crown');
                        }
                        const charactersContainer = characterElement.closest('.characters-container');
                        if (charactersContainer) {
                            charactersContainer.classList.add('has-crow-crown');
                        }
                        const section = characterElement.closest('.top-section, .bottom-section');
                        if (section) {
                            section.classList.add('has-crow-crown');
                        }
                        console.log(`[CrowCrown] Applied 'crow-crown-visual' to element:`, characterElement);
                    } else {
                        console.warn(`[CrowCrown] Character element NOT FOUND for ${character.name} (ID: ${character.instanceId || character.id}). VFX not applied.`);
                    }
                } else {
                    console.log(`[CrowCrown] Character ${character.name} does NOT have Crow Crown equipped (hasItem returned false).`);
                }
            },
            removeEffect: function(character) {
                console.log(`[CrowCrown] removeEffect called for character: ${character.name}`);
                const characterElement = document.getElementById(`character-${character.instanceId}`);
                if (characterElement) {
                    characterElement.classList.remove('crow-crown-visual');
                    // Remove helper classes if no more crow crown characters exist
                    if (!document.querySelector('.crow-crown-visual')) {
                        document.body.classList.remove('has-crow-crown');
                        const gameContainer = document.querySelector('.game-container');
                        if (gameContainer) {
                            gameContainer.classList.remove('has-crow-crown');
                        }
                        document.querySelectorAll('.characters-container, .top-section, .bottom-section').forEach(el => {
                            el.classList.remove('has-crow-crown');
                        });
                    }
                    console.log(`[CrowCrown] Removed 'crow-crown-visual' from element:`, characterElement);
                } else {
                    console.warn(`[CrowCrown] Character element NOT FOUND for ${character.name} (ID: ${character.instanceId || character.id}). VFX not removed.`);
                }
            },
            hasItem: function(character) {
                if (!character) {
                    console.log('[CrowCrown][hasItem] Character object is null or undefined.');
                    return false;
                }
                console.log(`[CrowCrown][hasItem] Checking for Crow Crown on ${character.name} (ID: ${character.id || character.instanceId})`);
                
                // Check equippedItems
                if (character.equippedItems && Array.isArray(character.equippedItems)) {
                    const foundInEquipped = character.equippedItems.some(item => item && item.id === 'crow_crown');
                    if (foundInEquipped) {
                        console.log('[CrowCrown][hasItem] Found in character.equippedItems.');
                        return true;
                    }
                    console.log('[CrowCrown][hasItem] Not found in character.equippedItems.');
                }
                
                // Check inventory via CharacterInventories
                if (window.CharacterInventories && window.CharacterInventories.get) {
                    const inventory = window.CharacterInventories.get(character.id);
                    if (inventory) {
                        const allInventoryItems = inventory.getAllItems();
                        const foundInInventory = allInventoryItems.some(slot => slot && slot.itemId === 'crow_crown');
                        if (foundInInventory) {
                            console.log('[CrowCrown][hasItem] Found in window.CharacterInventories.');
                            return true;
                        }
                        console.log('[CrowCrown][hasItem] Not found in window.CharacterInventories.');
                    } else {
                        console.log('[CrowCrown][hasItem] No inventory found for character in window.CharacterInventories.');
                    }
                }
                
                // Check character.items (fallback for older or alternative structures)
                if (character.items && Array.isArray(character.items)) {
                    const foundInCharacterItems = character.items.some(item => item && (item.id === 'crow_crown' || item.itemId === 'crow_crown'));
                    if (foundInCharacterItems) {
                        console.log('[CrowCrown][hasItem] Found in character.items.');
                        return true;
                    }
                    console.log('[CrowCrown][hasItem] Not found in character.items.');
                }
                
                console.log(`[CrowCrown][hasItem] Crow Crown NOT found for ${character.name}. Returning false.`);
                return false;
            }
        };

        window.crowCrownHandler = handler;

        document.addEventListener('character:items-applied', (event) => {
            console.log(`[CrowCrown] Event 'character:items-applied' received for character:`, event.detail.character.name);
            if (event.detail && event.detail.character) {
                handler.applyEffect(event.detail.character);
            }
        });

        document.addEventListener('character:items-removed', (event) => {
            console.log(`[CrowCrown] Event 'character:items-removed' received for character:`, event.detail.character.name);
            if (event.detail && event.detail.character) {
                handler.removeEffect(event.detail.character);
            }
        });
        
        console.log('[CrowCrown] Handler initialized.');
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

        // Strange Fungoose - Consumable Item
        const strangeFungoose = new Item(
            'strange_fungoose',
            'Strange Fungoose',
            'A peculiar mushroom that either provides a burst of healing or unleashes a detrimental force upon consumption. A gamble with fate.',
            'items/strange_fungoose.png',
            'rare',
            {},
            'consumable'
        );

        strangeFungoose.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const outcome = Math.random(); // 0 to 1
            const amount = 1000;

            if (outcome < 0.5) { // 50% chance to heal
                const healResult = character.heal(amount, character);
                log(`🍄 ${character.name} consumed a Strange Fungoose and was healed for ${healResult.healAmount} HP!`, 'consumable-use');
                
                // Trigger healing animation if available
                if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerHealingAnimation === 'function') {
                    window.gameManager.uiManager.triggerHealingAnimation(character, 'restore', healResult.healAmount);
                }
                return { success: true, message: `Healed for ${healResult.healAmount} HP.` };
            } else { // 50% chance to deal damage
                const damageResult = character.applyDamage(amount, 'true', null, {
                    source: 'Strange Fungoose',
                    canDodge: false,
                    canCrit: false
                });
                log(`🍄 ${character.name} consumed a Strange Fungoose and took ${damageResult.damage} damage!`, 'consumable-use');
                
                // Trigger damage animation if available
                if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerDamageAnimation === 'function') {
                    window.gameManager.uiManager.triggerDamageAnimation(character, 'damage', damageResult.damage);
                }
                return { success: true, message: `Took ${damageResult.damage} damage.` };
            }
        }, 3); // 3 turn cooldown

        this.registerItem(strangeFungoose);

        // Rotten Apple - Consumable Item
        const rottenApple = new Item(
            'rotten_apple',
            'Rotten Apple',
            'A foul-smelling apple that offers instant relief, but at a cost. Heals for 500 HP but inflicts a permanent curse.',
            'items/rotten_apple.png',
            'common',
            {},
            'consumable'
        );

        rottenApple.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            // Heal the character
            const healAmount = 500;
            const currentHp = character.stats.currentHp || 0;
            const maxHp = character.stats.maxHp || character.stats.hp || 0;
            
            if (currentHp >= maxHp) {
                return { success: false, message: 'Character already has full HP' };
            }

            const newHp = Math.min(maxHp, currentHp + healAmount);
            const actualHealed = newHp - currentHp;
            
            character.stats.currentHp = newHp;
            
            log(`🍎 ${character.name} consumed a Rotten Apple and restored ${actualHealed} HP!`, 'consumable-use');

            // Apply permanent debuff
            const permanentDebuff = {
                id: 'rotten_apple_curse',
                name: 'Rotten Apple Curse',
                icon: 'items/rotten_apple.png', // Icon for the debuff
                duration: -1, // Permanent
                isDebuff: true,
                isPermanent: true,
                source: 'Rotten Apple',
                description: 'Permanently deals 10 damage each turn.',
                
                onTurnStart: function(debuffHolder) {
                    const damage = 10;
                    if (!debuffHolder || debuffHolder.isDead()) {
                        return; // Do nothing if the character is dead
                    }
                    
                    const result = debuffHolder.applyDamage(damage, 'true', null, {
                        source: 'Rotten Apple Curse',
                        canDodge: false,
                        canCrit: false
                    });

                    log(`💀 ${debuffHolder.name} takes ${damage} damage from the Rotten Apple Curse!`, 'debuff-damage');
                    
                    // Trigger damage animation if available
                    if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerDamageAnimation === 'function') {
                        window.gameManager.uiManager.triggerDamageAnimation(debuffHolder, 'damage', damage);
                    }
                    
                    // Update character UI
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(debuffHolder);
                    }
                }
            };
            
            // Check if buff already applied to prevent duplicates
            const existingCurse = character.buffs?.find(b => b.id === 'rotten_apple_curse');
            if (!existingCurse) {
                character.addDebuff(permanentDebuff);
                log(`😈 ${character.name} is cursed by the Rotten Apple!`, 'debuff');
            }

            // Trigger healing animation if available
            if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerHealingAnimation === 'function') {
                window.gameManager.uiManager.triggerHealingAnimation(character, 'restore', actualHealed);
            }

            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }

            return { success: true, message: `Restored ${actualHealed} HP and cursed!` };
        }, 12); // 12 turn cooldown

        this.registerItem(rottenApple);

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
        }, 8); // 8 turn cooldown

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

        const basketofGoods = new Item(
            'basket_of_goods',
            'Basket of Goods',
            'A basket filled with various farm items. May contain rare video skins!',
            'items/basket_of_goods.png',
            'rare',
            {},
            'lootbox'
        );
        
        // Override openLootbox method for Basket of Goods to include skin drops
        basketofGoods.openLootbox = async function(character) {
            if (!this.isLootbox || !this.lootTable) {
                return { success: false, message: 'Item is not a lootbox or has no loot table' };
            }

            const results = [];
            
            // First, check for skin drop (3% chance - balanced for gameplay)
            const skinDropChance = Math.random();
            console.log('[BasketOfGoods] Skin drop roll:', skinDropChance);
            
            if (skinDropChance < 0.03) { // 3% chance
                console.log('[BasketOfGoods] Skin drop triggered!');
                // Get available skins that the user doesn't own
                const availableSkins = this.getAvailableVideoSkins();
                console.log('[BasketOfGoods] Available skins:', availableSkins);
                
                if (availableSkins.length > 0) {
                    const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
                    console.log('[BasketOfGoods] Selected skin:', randomSkin);
                    
                    results.push({
                        type: 'skin',
                        skinId: randomSkin.id,
                        skinName: randomSkin.name,
                        characterId: randomSkin.characterId
                    });
                    
                    // Grant the skin to the user (await the async operation)
                    const grantResult = await this.grantSkinToUser(randomSkin.id);
                    console.log('[BasketOfGoods] Skin grant result:', grantResult);
                } else {
                    console.log('[BasketOfGoods] No available skins to grant');
                }
            } else {
                console.log('[BasketOfGoods] No skin drop this time');
            }
            
            // Then generate normal items
            const generatedItems = [];
            const totalWeight = this.lootTable.reduce((sum, entry) => sum + entry.weight, 0);
            
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
                items: generatedItems,
                specialRewards: results // Include skin drops as special rewards
            };
        };
        
        // Method to get available video skins that user doesn't own
        basketofGoods.getAvailableVideoSkins = function() {
            const videoSkins = [
                { id: 'farmer_shoma_video', name: 'Farmer Shoma Video', characterId: 'farmer_shoma' },
                { id: 'farmer_raiden_video', name: 'Farmer Raiden Video', characterId: 'farmer_raiden' },
                { id: 'farmer_nina_video', name: 'Farmer Nina Video', characterId: 'farmer_nina' },
                { id: 'farmer_alice_video', name: 'Farmer Alice Video', characterId: 'farmer_alice' },
                { id: 'farmer_cham_cham_video', name: 'Farmer Cham Cham Video', characterId: 'farmer_cham_cham' }
            ];
            
            console.log('[BasketOfGoods] All video skins:', videoSkins);
            console.log('[BasketOfGoods] SkinManager available:', !!window.SkinManager);
            console.log('[BasketOfGoods] SkinManager initialized:', window.SkinManager?.initialized);
            console.log('[BasketOfGoods] SkinManager currentUserId:', window.SkinManager?.currentUserId);
            
            // Filter out skins the user already owns (now that SkinManager is working)
            if (window.SkinManager && window.SkinManager.initialized && window.SkinManager.currentUserId) {
                const availableSkins = videoSkins.filter(skin => {
                    const owns = window.SkinManager.ownsSkin(skin.id);
                    console.log(`[BasketOfGoods] User owns ${skin.id}:`, owns);
                    return !owns;
                });
                console.log('[BasketOfGoods] Available skins after filtering:', availableSkins);
                
                if (availableSkins.length === 0) {
                    console.log('[BasketOfGoods] User owns all video skins! No skins to grant.');
                }
                
                return availableSkins;
            }
            
            // If SkinManager not available, return all (fallback)
            console.log('[BasketOfGoods] SkinManager not ready, returning all skins as fallback');
            return videoSkins;
        };
        
        // Method to grant skin to user
        basketofGoods.grantSkinToUser = async function(skinId) {
            try {
                console.log('[BasketOfGoods] Attempting to grant skin:', skinId);
                
                // Check if SkinManager is available
                if (!window.SkinManager) {
                    console.error('[BasketOfGoods] SkinManager not available');
                    return false;
                }

                // Try to initialize SkinManager if not already initialized
                if (!window.SkinManager.initialized) {
                    console.log('[BasketOfGoods] SkinManager not initialized, attempting to initialize...');
                    try {
                        const initResult = await window.SkinManager.initialize();
                        if (!initResult) {
                            console.warn('[BasketOfGoods] SkinManager initialization failed, using fallback method');
                            return await this.grantSkinFallback(skinId);
                        }
                    } catch (initError) {
                        console.warn('[BasketOfGoods] SkinManager initialization error, using fallback:', initError);
                        return await this.grantSkinFallback(skinId);
                    }
                }

                // Wait for SkinManager to be ready (shorter timeout)
                const isReady = await window.SkinManager.waitForReady(3000);
                if (!isReady) {
                    console.warn('[BasketOfGoods] SkinManager not ready after waiting, using fallback method');
                    return await this.grantSkinFallback(skinId);
                }

                // Use the optimized grantSkin method
                const result = await window.SkinManager.grantSkin(skinId, 'basket_of_goods');
                
                if (result.success) {
                    console.log(`[BasketOfGoods] Successfully granted skin ${skinId}`);
                    return true;
                } else {
                    console.error(`[BasketOfGoods] Failed to grant skin ${skinId}:`, result.error);
                    return false;
                }
            } catch (error) {
                console.error('[BasketOfGoods] Error granting skin:', error);
                return await this.grantSkinFallback(skinId);
            }
        };

        // Fallback method to grant skin directly to Firebase
        basketofGoods.grantSkinFallback = async function(skinId) {
            try {
                console.log('[BasketOfGoods] Using fallback method to grant skin:', skinId);
                
                // Get current user from Firebase auth
                const currentUser = window.auth?.currentUser || firebase?.auth()?.currentUser;
                if (!currentUser) {
                    console.error('[BasketOfGoods] No authenticated user found for fallback method');
                    return false;
                }

                const userId = currentUser.uid;
                const database = window.database || firebase.database();
                
                if (!database) {
                    console.error('[BasketOfGoods] Firebase database not available');
                    return false;
                }

                // Add skin directly to Firebase
                await database.ref(`users/${userId}/RAIDSkin/${skinId}`).set({
                    grantedAt: Date.now(),
                    source: 'basket_of_goods',
                    price: 0
                });

                // Update local SkinManager data if available
                if (window.SkinManager && window.SkinManager.ownedSkins) {
                    window.SkinManager.ownedSkins[skinId] = {
                        grantedAt: Date.now(),
                        source: 'basket_of_goods',
                        price: 0
                    };
                }

                console.log(`[BasketOfGoods] Successfully granted skin ${skinId} using fallback method`);
                return true;
            } catch (error) {
                console.error('[BasketOfGoods] Fallback method error:', error);
                return false;
            }
        };
        
        this.registerItem(basketofGoods);

        // Set the loot table for Basket of Goods
        basketofGoods.setLootTable([
            { itemId: 'cow_bell', weight: 3, quantity: 1 },
            { itemId: 'iron_nail', weight: 6, quantity: 1 },
            { itemId: 'wooden_plank', weight: 6, quantity: 1 },
            { itemId: 'corn', weight: 6, quantity: 1 },
            { itemId: 'goat_milk_crafting', weight: 6, quantity: 1 },
            { itemId: 'pork', weight: 6, quantity: 1 },
            { itemId: 'crow_feather', weight: 6, quantity: 1 },
            { itemId: 'red_linen', weight: 4, quantity: 2 },
            { itemId: 'green_apple', weight: 3, quantity: 1 },
            { itemId: 'yellow_apple', weight: 3, quantity: 1 },
            { itemId: 'healthy_apple', weight: 3, quantity: 1 },
            { itemId: 'rake', weight: 3, quantity: 1 },
            { itemId: 'carrot', weight: 3, quantity: 1 },
            { itemId: 'alcohol', weight: 3, quantity: 1 },
            { itemId: 'carrot_cannon', weight: 2, quantity: 1 },
            { itemId: 'pitchfork', weight: 3, quantity: 1 },
            { itemId: 'fertilizer_sprayer', weight: 2, quantity: 1 },
            { itemId: 'corn_spear', weight: 1.5, quantity: 1 },
            { itemId: 'dog_collar', weight: 1, quantity: 1 },
            { itemId: 'beehive_bomb', weight: 3, quantity: 1 },
            { itemId: 'exploding_pumpkin', weight: 2, quantity: 1 },
            { itemId: 'double_kitchen_knife', weight: 1, quantity: 1 },
            { itemId: 'kotal_kahns_atlantean_dagger', weight: 1, quantity: 1 },
            { itemId: 'seaborn_crown', weight: 1, quantity: 1 }
        ]);

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
        this.registerItem(atlanteanTreasureChest);

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

        // Override openLootbox method for Atlantean Treasure Chest to include skin drops
        atlanteanTreasureChest.openLootbox = async function(character) {
            if (!this.isLootbox || !this.lootTable) {
                return { success: false, message: 'Item is not a lootbox or has no loot table' };
            }

            const results = [];
            
            // First, check for skin drop (3% chance - same as Basket of Goods)
            const skinDropChance = Math.random();
            console.log('[AtlanteanTreasureChest] Skin drop roll:', skinDropChance);
            
            if (skinDropChance < 0.03) { // 3% chance
                console.log('[AtlanteanTreasureChest] Skin drop triggered!');
                // Get available skins that the user doesn't own
                const availableSkins = this.getAvailableVideoSkins();
                console.log('[AtlanteanTreasureChest] Available skins:', availableSkins);
                
                if (availableSkins.length > 0) {
                    const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
                    console.log('[AtlanteanTreasureChest] Selected skin:', randomSkin);
                    
                    results.push({
                        type: 'skin',
                        skinId: randomSkin.id,
                        skinName: randomSkin.name,
                        characterId: randomSkin.characterId
                    });
                    
                    // Grant the skin to the user (await the async operation)
                    const grantResult = await this.grantSkinToUser(randomSkin.id);
                    console.log('[AtlanteanTreasureChest] Skin grant result:', grantResult);
                } else {
                    console.log('[AtlanteanTreasureChest] No available skins to grant');
                }
            } else {
                console.log('[AtlanteanTreasureChest] No skin drop this time');
            }
            
            // Then generate normal items
            const generatedItems = [];
            const totalWeight = this.lootTable.reduce((sum, entry) => sum + entry.weight, 0);
            
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
                items: generatedItems,
                specialRewards: results // Include skin drops as special rewards
            };
        };
        
        // Method to get available Atlantean video skins that user doesn't own
        atlanteanTreasureChest.getAvailableVideoSkins = function() {
            const videoSkins = [
                { id: 'atlantean_kagome_video', name: 'Atlantean Kagome Video', characterId: 'atlantean_kagome' },
                { id: 'atlantean_kotal_kahn_video', name: 'Atlantean Kotal Kahn Video', characterId: 'atlantean_kotal_kahn' },
                { id: 'atlantean_sub_zero_video', name: 'Atlantean Sub Zero Video', characterId: 'atlantean_sub_zero_playable' },
                { id: 'atlantean_christie_video', name: 'Atlantean Christie Video', characterId: 'atlantean_christie' }
            ];
            
            console.log('[AtlanteanTreasureChest] All video skins:', videoSkins);
            console.log('[AtlanteanTreasureChest] SkinManager available:', !!window.SkinManager);
            console.log('[AtlanteanTreasureChest] SkinManager initialized:', window.SkinManager?.initialized);
            console.log('[AtlanteanTreasureChest] SkinManager currentUserId:', window.SkinManager?.currentUserId);
            
            // Filter out skins the user already owns
            if (window.SkinManager && window.SkinManager.initialized && window.SkinManager.currentUserId) {
                const availableSkins = videoSkins.filter(skin => {
                    const owns = window.SkinManager.ownsSkin(skin.id);
                    console.log(`[AtlanteanTreasureChest] User owns ${skin.id}:`, owns);
                    return !owns;
                });
                console.log('[AtlanteanTreasureChest] Available skins after filtering:', availableSkins);
                
                if (availableSkins.length === 0) {
                    console.log('[AtlanteanTreasureChest] User owns all Atlantean video skins! No skins to grant.');
                }
                
                return availableSkins;
            }
            
            // If SkinManager not available, return all (fallback)
            console.log('[AtlanteanTreasureChest] SkinManager not ready, returning all skins as fallback');
            return videoSkins;
        };
        
        // Method to grant skin to user (same as Basket of Goods)
        atlanteanTreasureChest.grantSkinToUser = async function(skinId) {
            try {
                console.log('[AtlanteanTreasureChest] Attempting to grant skin:', skinId);
                
                // Check if SkinManager is available
                if (!window.SkinManager) {
                    console.error('[AtlanteanTreasureChest] SkinManager not available');
                    return false;
                }

                // Try to initialize SkinManager if not already initialized
                if (!window.SkinManager.initialized) {
                    console.log('[AtlanteanTreasureChest] SkinManager not initialized, attempting to initialize...');
                    try {
                        const initResult = await window.SkinManager.initialize();
                        if (!initResult) {
                            console.warn('[AtlanteanTreasureChest] SkinManager initialization failed, using fallback method');
                            return await this.grantSkinFallback(skinId);
                        }
                    } catch (initError) {
                        console.warn('[AtlanteanTreasureChest] SkinManager initialization error, using fallback:', initError);
                        return await this.grantSkinFallback(skinId);
                    }
                }

                // Wait for SkinManager to be ready (shorter timeout)
                const isReady = await window.SkinManager.waitForReady(3000);
                if (!isReady) {
                    console.warn('[AtlanteanTreasureChest] SkinManager not ready after waiting, using fallback method');
                    return await this.grantSkinFallback(skinId);
                }

                // Use the optimized grantSkin method
                const result = await window.SkinManager.grantSkin(skinId, 'atlantean_treasure_chest');
                
                if (result.success) {
                    console.log(`[AtlanteanTreasureChest] Successfully granted skin ${skinId}`);
                    return true;
                } else {
                    console.error(`[AtlanteanTreasureChest] Failed to grant skin ${skinId}:`, result.error);
                    return false;
                }
            } catch (error) {
                console.error('[AtlanteanTreasureChest] Error granting skin:', error);
                return await this.grantSkinFallback(skinId);
            }
        };

        // Fallback method to grant skin directly to Firebase
        atlanteanTreasureChest.grantSkinFallback = async function(skinId) {
            try {
                console.log('[AtlanteanTreasureChest] Using fallback method to grant skin:', skinId);
                
                // Get current user from Firebase auth
                const currentUser = window.auth?.currentUser || firebase?.auth()?.currentUser;
                if (!currentUser) {
                    console.error('[AtlanteanTreasureChest] No authenticated user found for fallback method');
                    return false;
                }

                const userId = currentUser.uid;
                const database = window.database || firebase.database();
                
                if (!database) {
                    console.error('[AtlanteanTreasureChest] Firebase database not available');
                    return false;
                }

                // Add skin directly to Firebase
                await database.ref(`users/${userId}/RAIDSkin/${skinId}`).set({
                    grantedAt: Date.now(),
                    source: 'atlantean_treasure_chest',
                    price: 0
                });

                // Update local SkinManager data if available
                if (window.SkinManager && window.SkinManager.ownedSkins) {
                    window.SkinManager.ownedSkins[skinId] = {
                        grantedAt: Date.now(),
                        source: 'atlantean_treasure_chest',
                        price: 0
                    };
                }

                console.log(`[AtlanteanTreasureChest] Successfully granted skin ${skinId} using fallback method`);
                return true;
            } catch (error) {
                console.error('[AtlanteanTreasureChest] Fallback method error:', error);
                return false;
            }
        };

        this.registerItem(atlanteanTreasureChest);

        // NEW ITEMS
        this.registerItem(new Item(
            'corrupted_tree_branch',
            'Corrupted Tree Branch',
            '+5% Healing Power. A gnarled branch pulsating with dark energy, harvested from a blighted forest.',
            'items/corrupted_tree_branch.png',
            'uncommon',
            {
                healingPower: 0.05
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'grizzly_fur_shoulderplate',
            'Grizzly Fur Shoulderplate',
            '+10 Magic Resistance. Heavy shoulderplate crafted from the hide of an ancient grizzly bear, providing robust magical defense.',
            'items/grizzly_fur_shoulderplate.png',
            'rare',
            {
                magicalShield: 10
            },
            'equipment'
        ));

        this.registerItem(new Item(
            'grizzly_fur',
            'Grizzly Fur',
            'Thick, coarse fur from a grizzly bear. A valuable crafting material for sturdy armor and warm clothing.',
            'items/grizzly_fur.png',
            'common',
            {},
            'crafting'
        ));

        this.registerItem(new Item(
            'corrupted_wood',
            'Corrupted Wood',
            'Wood tainted by dark magic, brittle yet imbued with strange energies. Useful in forbidden crafting rituals.',
            'items/corrupted_wood.png',
            'common',
            {},
            'crafting'
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

        // FARM-RELATED ITEMS
        
        // Pitchfork - Equipment Item
        this.registerItem(new Item(
            'pitchfork',
            'Pitchfork',
            'A sturdy farming tool that doubles as a formidable weapon. Its sharp prongs deal significant physical damage to enemies.',
            'items/pitchfork.png',
            'uncommon',
            {
                physicalDamage: 45
            },
            'equipment'
        ));

        // Carrot Cannon - Equipment Item
        this.registerItem(new Item(
            'carrot_cannon',
            'Carrot Cannon',
            'A whimsical contraption that launches carrots with surprising accuracy. Your Q ability gains +15% crit chance.',
            'items/carrot_cannon.png',
            'rare',
            {},
            'equipment'
        ));

        // Corn - Consumable Item
        const corn = new Item(
            'corn',
            'Corn',
            'A nutritious ear of corn that enhances reflexes when consumed. Grants temporary agility boost.',
            'items/corn.png',
            'common',
            {},
            'consumable'
        );

        // Set consumable effect for Corn
        corn.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            // Create dodge chance buff
            const cornDodgeBuff = new Effect(
                'corn_dodge_boost',
                'Corn Agility',
                'items/corn.png',
                4,
                null,
                false
            );

            cornDodgeBuff.setDescription('Gains 10% dodge chance for 4 turns');
            cornDodgeBuff.statModifiers = [{
                stat: 'dodgeChance',
                value: 0.10,
                operation: 'add'
            }];

            character.addBuff(cornDodgeBuff);

            log(`🌽 ${character.name} consumed corn and gained enhanced agility (+10% dodge chance)!`, 'consumable-use');

            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }

            return { success: true, message: 'Gained 10% dodge chance for 4 turns' };
        }, 0); // No cooldown

        this.registerItem(corn);

        // Alcohol - Consumable Item
        const alcohol = new Item(
            'alcohol',
            'Alcohol',
            'Heals for 3000 HP but reduces Armor and Magic Shield to 0 for 5 turns.',
            'items/alcohol.png',
            'uncommon',
            {},
            'consumable'
        );

        alcohol.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const healAmount = 3000;
            const healResult = character.heal(healAmount, character);
            log(`🍺 ${character.name} drinks alcohol, healing for ${healResult.healAmount} HP but becomes drunk!`, 'consumable-use');
            
            const alcoholDebuff = new Effect(
                'alcohol_debuff',
                'Drunk',
                'items/alcohol.png',
                5,
                null,
                true
            ).setDescription('Armor and Magic Shield reduced to 0.');

            alcoholDebuff.onApply = function(character) {
                this.originalBaseArmor = character.baseStats.armor;
                this.originalBaseMagicShield = character.baseStats.magicalShield;
                
                character.baseStats.armor = 0;
                character.baseStats.magicalShield = 0;
                
                log(`${character.name} is drunk! Armor and Magic Shield reduced to 0.`, 'debuff');
            };
            
            alcoholDebuff.remove = function(character) {
                if (this.originalBaseArmor !== undefined) {
                    character.baseStats.armor = this.originalBaseArmor;
                }
                if (this.originalBaseMagicShield !== undefined) {
                    character.baseStats.magicalShield = this.originalBaseMagicShield;
                }
                log(`${character.name} is no longer drunk. Armor and Magic Shield restored.`, 'system');
            };

            character.addDebuff(alcoholDebuff);

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }

            return { success: true, message: `Healed for ${healResult.healAmount} HP and became drunk.` };
        }, 10);

        this.registerItem(alcohol);

        // Carrot - Consumable Item
        const carrot = new Item(
            'carrot',
            'Carrot',
            'A fresh carrot. Reduces all active ability cooldowns by 1 turn.',
            'items/carrot.png',
            'common',
            {},
            'consumable'
        );

        carrot.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            character.abilities.forEach(ability => {
                if (ability.currentCooldown > 0) {
                    ability.reduceCooldown();
                }
            });

            log(`🥕 ${character.name} consumed a Carrot, reducing all active cooldowns by 1 turn!`, 'consumable-use');
            
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }

            return { success: true, message: 'All active cooldowns reduced by 1.' };
        }, 10);

        this.registerItem(carrot);

        // Healthy Apple - Consumable Item
        const healthyApple = new Item(
            'healthy_apple',
            'Healthy Apple',
            'A crisp, healthy apple. Heals for 500 HP.',
            'items/healthy_apple.png',
            'common',
            {},
            'consumable'
        );

        healthyApple.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const healAmount = 500;
            const healResult = character.heal(healAmount, character);
            log(`🍎 ${character.name} consumed a Healthy Apple and was healed for ${healResult.healAmount} HP!`, 'consumable-use');
            
            if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerHealingAnimation === 'function') {
                window.gameManager.uiManager.triggerHealingAnimation(character, 'restore', healResult.healAmount);
            }
            return { success: true, message: `Healed for ${healResult.healAmount} HP.` };
        }, 4);

        this.registerItem(healthyApple);

        // Yellow Apple - Crafting Material
        this.registerItem(new Item(
            'yellow_apple',
            'Yellow Apple',
            'A sweet yellow apple, perfect for crafting.',
            'items/yellow_apple.png',
            'common',
            {},
            'crafting'
        ));

        // Green Apple - Crafting Material
        this.registerItem(new Item(
            'green_apple',
            'Green Apple',
            'A tart green apple, useful in various recipes.',
            'items/green_apple.png',
            'common',
            {},
            'crafting'
        ));

        // Rake - Equipment Item
        this.registerItem(new Item(
            'rake',
            'Rake',
            'A simple garden rake. Increases critical damage.',
            'items/rake.png',
            'uncommon',
            {
                critDamage: 0.20
            },
            'equipment'
        ));

        // Fertilizer Sprayer - Equipment Item
        this.registerItem(new Item(
            'fertilizer_sprayer',
            'Fertilizer Sprayer',
            'A device for spraying fertilizer. Provides steady health regeneration.',
            'items/fertilizer_sprayer.png',
            'rare',
            {
                hpPerTurn: 12
            },
            'equipment'
        ));

        // Cow Bell - Equipment Item
        this.registerItem(new Item(
            'cow_bell',
            'Cow Bell',
            'A loud cow bell. Bolsters magical power and mana regeneration.',
            'items/cow_bell.png',
            'rare',
            {
                magicalDamage: 70,
                manaPerTurn: 20
            },
            'equipment'
        ));

        // Iron Nail - Crafting Material
        this.registerItem(new Item(
            'iron_nail',
            'Iron Nail',
            'A standard iron nail, a basic building component.',
            'items/iron_nail.png',
            'common',
            {},
            'crafting'
        ));

        // Wooden Plank - Crafting Material
        this.registerItem(new Item(
            'wooden_plank',
            'Wooden Plank',
            'A sturdy wooden plank, essential for construction.',
            'items/wooden_plank.png',
            'common',
            {},
            'crafting'
        ));

        // Corn Spear - Equipment Item
        this.registerItem(new Item(
            'corn_spear',
            'Corn Spear',
            'A spear made from hardened corn stalks. Surprisingly sharp.',
            'items/corn_spear.png',
            'uncommon',
            {
                physicalDamage: 30,
                critDamage: 0.05,
                critChance: 0.05
            },
            'equipment'
        ));

        // Goat Milk - Crafting Material
        this.registerItem(new Item(
            'goat_milk_crafting',
            'Goat Milk',
            'Fresh goat milk, a versatile crafting ingredient.',
            'items/goat_milk.png',
            'common',
            {},
            'crafting'
        ));

        // Milking Bucket - Crafting Material
        this.registerItem(new Item(
            'milking_bucket',
            'Milking Bucket',
            'A bucket used for milking goats.',
            'items/milking_bucket.png',
            'common',
            {},
            'crafting'
        ));

        // Goat Milk - Consumable
        const goatMilkConsumable = new Item(
            'goat_milk_consumable',
            'Goat Milk',
            'A refreshing drink that permanently boosts your vitality. Grants a non-deletable +50 HP regen buff.',
            'items/goat_milk.png',
            'epic',
            {},
            'consumable'
        );

        goatMilkConsumable.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            if (!target) {
                 return { success: false, message: 'Goat Milk requires a target.', needsTarget: true, targetType: 'ally_or_self' };
            }

            const permanentHpRegenBuff = new Effect(
                'goat_milk_hp_regen',
                'Goat Milk Vitality',
                'items/goat_milk.png',
                -1, // Permanent
                null,
                false // isDebuff
            ).setDescription('Permanently regenerates 50 HP per turn.');
            
            permanentHpRegenBuff.statModifiers = [{
                stat: 'hpPerTurn',
                value: 50,
                operation: 'add'
            }];
            permanentHpRegenBuff.isPermanent = true;

            target.addBuff(permanentHpRegenBuff);
            log(`🥛 ${target.name} drinks Goat Milk and feels invigorated! Gained a permanent +50 HP regen buff.`, 'consumable-use');
            
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(target);
            }

            return { success: true, message: `Granted permanent HP regen to ${target.name}.` };
        }, 50);
        goatMilkConsumable.needsTarget = true;
        goatMilkConsumable.targetType = 'ally_or_self';
        this.registerItem(goatMilkConsumable);
        
        // Dog Collar - Equipment Item
        this.registerItem(new Item(
            'dog_collar',
            'Dog Collar',
            'A sturdy collar. Your Q and W damage abilities cause the enemy to bleed.',
            'items/dog_collar.png',
            'epic',
            {},
            'equipment'
        ));

        // Beehive Bomb - Consumable/Crafting Item
        const beehiveBomb = new Item(
            'beehive_bomb',
            'Beehive Bomb',
            'A buzzing beehive rigged to explode. Deals 300 magical damage to a target.',
            'items/beehive_bomb.png',
            'uncommon',
            {},
            'consumable' 
        );
        beehiveBomb.type = 'crafting'; 

        beehiveBomb.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!target) {
                return { success: false, message: 'Beehive Bomb requires a target', needsTarget: true, targetType: 'enemy' };
            }
            if (target.isDead()) {
                return { success: false, message: 'Target is already defeated.' };
            }
            if (target.isAI === character.isAI) {
                return { success: false, message: 'Cannot target allies.' };
            }

            const damage = 300;
            const damageResult = target.applyDamage(damage, 'magical', character, { abilityId: 'beehive_bomb' });
            log(`🐝 ${character.name} throws a Beehive Bomb at ${target.name}, dealing ${damageResult.damage} magical damage!`, 'consumable-use');
            
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(target);
            }

            return { success: true, message: `Dealt ${damageResult.damage} damage to ${target.name}.` };
        }, 5);
        beehiveBomb.needsTarget = true;
        beehiveBomb.targetType = 'enemy';
        this.registerItem(beehiveBomb);

        // Exploding Pumpkin - Consumable Item
        const explodingPumpkin = new Item(
            'exploding_pumpkin',
            'Exploding Pumpkin',
            'Places a ticking pumpkin on an enemy. It explodes for 1000 damage after 5 turns.',
            'items/exploding_pumpkin.png',
            'epic',
            {},
            'consumable'
        );

        explodingPumpkin.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

            if (!target) {
                return { success: false, message: 'Exploding Pumpkin requires a target', needsTarget: true, targetType: 'enemy' };
            }
            if (target.isDead()) {
                return { success: false, message: 'Target is already defeated.' };
            }
            if (target.isAI === character.isAI) {
                return { success: false, message: 'Cannot target allies.' };
            }

            const debuff = new Effect(
                `exploding_pumpkin_${Date.now()}`,
                'Exploding Pumpkin',
                'items/exploding_pumpkin.png',
                5,
                null,
                true
            ).setDescription('A ticking time bomb! Will explode for 1000 damage when the timer runs out.');

            debuff.onRemove = function(char) {
                if (char.isDead()) return;
                log(`🎃 The Exploding Pumpkin on ${char.name} detonates!`, 'debuff-effect');
                const damage = 1000;
                char.applyDamage(damage, 'magical', character, { abilityId: 'exploding_pumpkin' });
            };

            target.addDebuff(debuff);
            log(`🎃 ${character.name} places an Exploding Pumpkin on ${target.name}. It will explode in 5 turns!`, 'consumable-use');

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(target);
            }
            
            return { success: true, message: `Pumpkin placed on ${target.name}.` };
        }, 15);
        explodingPumpkin.needsTarget = true;
        explodingPumpkin.targetType = 'enemy';
        this.registerItem(explodingPumpkin);

        // Pork - Consumable Item
        const pork = new Item(
            'pork',
            'Pork',
            'A succulent piece of cooked pork. Heals for 1500 HP.',
            'items/pork.png',
            'common',
            {},
            'consumable'
        );

        pork.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            const healAmount = 1500;
            const healResult = character.heal(healAmount, character);
            log(`🍖 ${character.name} consumed Pork and was healed for ${healResult.healAmount} HP!`, 'consumable-use');
            
            if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.triggerHealingAnimation === 'function') {
                window.gameManager.uiManager.triggerHealingAnimation(character, 'restore', healResult.healAmount);
            }
            return { success: true, message: `Healed for ${healResult.healAmount} HP.` };
        }, 15); // 15 turn cooldown

        this.registerItem(pork);

        // Red Linen - Consumable Item
        const redLinen = new Item(
            'red_linen',
            'Red Linen',
            'A vibrant red cloth. When shown to an enemy, it taunts them, forcing them to attack only you for 3 turns.',
            'items/red_linen.png',
            'uncommon',
            {},
            'consumable'
        );

        redLinen.setConsumableEffect((character, target) => {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            if (!target) {
                return { success: false, message: 'Red Linen requires a target', needsTarget: true, targetType: 'enemy' };
            }

            if (!character || character.isDead()) {
                return { success: false, message: 'Character is dead or invalid' };
            }

            if (target.isDead()) {
                return { success: false, message: 'Target is already dead' };
            }

            if (target.isAI === character.isAI) {
                return { success: false, message: 'Red Linen can only target enemies' };
            }

            const debuffId = `taunt_debuff_${Date.now()}`;
            const duration = 3;

            log(`${character.name} taunts ${target.name} with Red Linen!`);

            const tauntDebuff = {
                id: debuffId,
                name: 'Taunted',
                icon: 'items/red_linen.png',
                duration: duration,
                isDebuff: true,
                description: `Taunted by ${character.name}. Can only target ${character.name}.`,
                forcedTargetCaster: character,
                forcedTargetCasterId: character.instanceId || character.id,
                remove: (char) => {
                    log(`${char.name}'s Taunt debuff fades.`);
                    if (char.forcedTargeting && char.forcedTargeting.debuffId === debuffId) {
                        delete char.forcedTargeting;
                    }
                }
            };

            target.addDebuff(tauntDebuff);
            
            target.forcedTargeting = {
                type: 'taunt',
                casterId: character.instanceId || character.id,
                casterName: character.name,
                debuffId: debuffId
            };

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
                updateCharacterUI(target);
            }

            return { success: true, message: `${target.name} is taunted!` };
        }, 10);

        redLinen.needsTarget = true;
        redLinen.targetType = 'enemy';

        this.registerItem(redLinen);
        
        // Double Kitchen Knife - Equipment Item
        this.registerItem(new Item(
            'double_kitchen_knife',
            'Double Kitchen Knife',
            'A pair of wickedly sharp kitchen knives. Your E ability activates twice when used.',
            'items/double_kitchen_knife.png',
            'epic',
            {
                physicalDamage: 25
            },
            'equipment'
        ));

        // Crow Feather - Crafting Material
        this.registerItem(new Item(
            'crow_feather',
            'Crow Feather',
            'A dark feather from a crow. Used in crafting.',
            'items/crow_feather.png',
            'common',
            {},
            'crafting'
        ));

        // Crow Crown - Equipment Item
        this.registerItem(new Item(
            'crow_crown',
            'Crow Crown',
            'A crown made of crow feathers. The owner of this item has a dark creative visual on his character-container.',
            'items/crow_crown.png',
            'epic',
            {},
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
        
        // Set up Carrot Cannon special effect
        this.setupCarrotCannonEffect();

        // Set up Double Kitchen Knife special effect
        this.setupDoubleKitchenKnifeEffect();

        // Set up Dog Collar special effect
        this.setupDogCollarEffect();

        // Set up Crow Crown special effect
        this.setupCrowCrownEffect();
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
     * Set up Carrot Cannon special effect - 15% crit chance to Q ability
     */
    setupCarrotCannonEffect() {
        // Check if already set up
        if (window.carrotCannonHandler) return;

        const carrotCannonHandler = {
            // Check if a character has Carrot Cannon equipped
            hasItem: function(character) {
                if (!character) return false;
                
                // Check in character's equippedItems array
                if (character.equippedItems && Array.isArray(character.equippedItems)) {
                    for (let i = 0; i < character.equippedItems.length; i++) {
                        const item = character.equippedItems[i];
                        if (item && item.id === 'carrot_cannon') {
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
                            if (slot && slot.itemId === 'carrot_cannon') {
                                return true;
                            }
                        }
                    }
                }
                
                // Check in character's items array (alternative structure)
                if (character.items && Array.isArray(character.items)) {
                    for (let i = 0; i < character.items.length; i++) {
                        const item = character.items[i];
                        if (item && (item.id === 'carrot_cannon' || item.itemId === 'carrot_cannon')) {
                            return true;
                        }
                    }
                }
                
                return false;
            },

            // Apply Carrot Cannon effect to Q ability
            onAbilityUsed: function(character, ability, abilityIndex) {
                const hasItem = this.hasItem(character);
                if (!hasItem) return false;

                // Only apply to Q ability (index 0)
                if (abilityIndex !== 0) return false;

                // Apply crit chance boost directly to character stats
                this.applyCarrotCannonCritBoost(character);
                return true;
            },

            // Apply crit chance boost directly to character stats
            applyCarrotCannonCritBoost: function(character) {
                // Store original crit chance if not already stored
                if (!character._carrotCannonOriginalCrit) {
                    character._carrotCannonOriginalCrit = character.stats.critChance || 0;
                }

                // Apply +15% crit chance directly to stats
                character.stats.critChance = (character.stats.critChance || 0) + 0.15;

                // Log the effect
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(
                        `🥕 ${character.name}'s Carrot Cannon enhances their aim (+15% crit chance)!`,
                        'item-effect'
                    );
                }

                console.log(`[Carrot Cannon] Applied +15% crit chance to ${character.name}'s Q ability (New crit: ${character.stats.critChance})`);
                
                // Schedule restoration of original crit chance after ability execution
                setTimeout(() => {
                    if (character._carrotCannonOriginalCrit !== undefined) {
                        character.stats.critChance = character._carrotCannonOriginalCrit;
                        delete character._carrotCannonOriginalCrit;
                        console.log(`[Carrot Cannon] Restored original crit chance to ${character.stats.critChance}`);
                    }
                }, 100);
            }
        };

        // Store globally for access
        window.carrotCannonHandler = carrotCannonHandler;

        // Hook into the game's ability usage system
        const setupCarrotAbilityHook = () => {
            // Method 1: Listen for AbilityUsed event
            document.addEventListener('AbilityUsed', (event) => {
                if (event.detail && event.detail.caster && event.detail.ability && event.detail.abilityIndex !== undefined) {
                    carrotCannonHandler.onAbilityUsed(event.detail.caster, event.detail.ability, event.detail.abilityIndex);
                }
            });
            
            // Method 2: Hook into Character.useAbility if available
            const checkForCharacterSystem = () => {
                if (window.Character && window.Character.prototype && window.Character.prototype.useAbility) {
                    if (!window.Character.prototype.useAbility._carrotCannonHooked) {
                        const originalUseAbility = window.Character.prototype.useAbility;
                        
                        window.Character.prototype.useAbility = function(abilityIndex, target) {
                            // Apply Carrot Cannon effect before ability execution
                            if (abilityIndex === 0) { // Q ability
                                carrotCannonHandler.onAbilityUsed(this, this.abilities[abilityIndex], abilityIndex);
                            }
                            
                            const result = originalUseAbility.call(this, abilityIndex, target);
                            return result;
                        };
                        
                        window.Character.prototype.useAbility._carrotCannonHooked = true;
                    }
                } else {
                    setTimeout(checkForCharacterSystem, 100);
                }
            };
            
            checkForCharacterSystem();
        };

        setupCarrotAbilityHook();
    }

    /**
     * Set up Double Kitchen Knife special effect - E ability activates twice
     */
    setupDoubleKitchenKnifeEffect() {
        if (window.doubleKitchenKnifeHandler) return;

        const handler = {
            hasItem: function(character) {
                if (!character) {
                    console.log('[DoubleKitchenKnife Debug] hasItem: character object is null or undefined.');
                    return false;
                }

                console.log(`[DoubleKitchenKnife Debug] Checking for item on ${character.name} (ID: ${character.id})`);

                // Check 1: character.equippedItems
                if (character.equippedItems && Array.isArray(character.equippedItems)) {
                    console.log('[DoubleKitchenKnife Debug] Checking character.equippedItems:', character.equippedItems);
                    if (character.equippedItems.some(item => item && item.id === 'double_kitchen_knife')) {
                        console.log('[DoubleKitchenKnife Debug] Found item in character.equippedItems.');
                        return true;
                    }
                } else {
                    console.log('[DoubleKitchenKnife Debug] character.equippedItems not found or not an array.');
                }

                // Check 2: window.CharacterInventories
                if (window.CharacterInventories && window.CharacterInventories.get) {
                    const inventory = window.CharacterInventories.get(character.id);
                    if (inventory) {
                        const items = inventory.getAllItems();
                        console.log(`[DoubleKitchenKnife Debug] Checking inventory for ${character.name}:`, items);
                        if (items.some(slot => slot && slot.itemId === 'double_kitchen_knife')) {
                            console.log('[DoubleKitchenKnife Debug] Found item in window.CharacterInventories.');
                            return true;
                        }
                    } else {
                        console.log(`[DoubleKitchenKnife Debug] No inventory found for ${character.name} in window.CharacterInventories.`);
                    }
                } else {
                    console.log('[DoubleKitchenKnife Debug] window.CharacterInventories not available.');
                }

                // Check 3: character.items
                if (character.items && Array.isArray(character.items)) {
                    console.log('[DoubleKitchenKnife Debug] Checking character.items:', character.items);
                    if (character.items.some(item => item && (item.id === 'double_kitchen_knife' || item.itemId === 'double_kitchen_knife'))) {
                        console.log('[DoubleKitchenKnife Debug] Found item in character.items.');
                        return true;
                    }
                } else {
                    console.log('[DoubleKitchenKnife Debug] character.items not found or not an array.');
                }

                console.log(`[DoubleKitchenKnife Debug] Item not found for ${character.name}. Returning false.`);
                return false;
            }
        };
        window.doubleKitchenKnifeHandler = handler;
        console.log('[DoubleKitchenKnife] Handler initialized.');
    }

    /**
     * Set up Dog Collar special effect - Q and W abilities apply bleed
     */
    setupDogCollarEffect() {
        if (window.dogCollarHandler) return;

        const handler = {
            hasItem: function(character) {
                if (!character) return false;
                if (character.equippedItems?.some(item => item?.id === 'dog_collar')) return true;
                const inventory = window.CharacterInventories?.get(character.id);
                return inventory?.getAllItems().some(slot => slot?.itemId === 'dog_collar');
            },
            onDamageDealt: function(event) {
                const { character: caster, target, damage, options } = event.detail;
                if (!caster || !target || damage <= 0) return;

                const abilityIndex = options?.abilityIndex;
                if ((abilityIndex !== 0 && abilityIndex !== 1) || !this.hasItem(caster)) return;

                if (window.HoundPassive) {
                    const passiveHandler = new window.HoundPassive();
                    passiveHandler.applyBleedingStack(caster, target);
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`🩸 ${caster.name}'s Dog Collar causes ${target.name} to bleed!`, 'item-effect');
                }
            }
        };

        window.dogCollarHandler = handler;
        document.addEventListener('character:damage-dealt', handler.onDamageDealt.bind(handler));
        console.log('[DogCollar] Handler initialized.');
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
