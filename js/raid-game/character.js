// Character class definition for Roguelike Raid Game
class Character {
    constructor(id, name, image, stats) {
        this.id = id;
        this.name = name;
        this.image = image;
        
        // XP and Level System - NEW
        this.experience = 0; // Current experience points
        this.level = 1; // Current level (starts at 1)
        
        // Store base stats separately
        this.baseStats = {
            physicalDamage: stats.physicalDamage || 0,
            magicalDamage: stats.magicalDamage || 0,
            armor: stats.armor || 0,
            magicalShield: stats.magicalShield || 0,
            lifesteal: stats.lifesteal || 0,
            dodgeChance: stats.dodgeChance || 0,
            critChance: stats.critChance || 0,
            critDamage: stats.critDamage || 1.5,
            healingPower: stats.healingPower || 0,
            maxHp: stats.hp || 100,
            hpPerTurn: stats.hpPerTurn || 0,
            maxMana: stats.mana || 100,
            manaPerTurn: stats.manaPerTurn || 0
        };

        // Current stats including modifications
        this.stats = {
            ...this.baseStats, // Start with base stats
            currentHp: stats.hp || 100, // Keep current HP/Mana separate
            currentMana: stats.mana || 100,
        };
        // Ensure currentHp/Mana are not in baseStats if they were copied
        delete this.baseStats.currentHp;
        delete this.baseStats.currentMana;

        // Shield system - NEW
        this.shield = 0; // Current shield amount
        this.enableMysticBarrier = false; // Flag for Mystic Barrier talent

        this.abilities = [];
        this.buffs = [];
        this.debuffs = [];
        this.isAI = false;
        this.passive = null;
        this.passiveHandler = null;
        
        // --- NEW: Store talent modifications --- 
        this.talentModifiers = { 
            stats: {},      // { statName: { add: 0, multiply: 1 } }
            abilities: {}   // { abilityId: { property: { add: 0, multiply: 1 } } }
        };
        // --- END NEW ---

        // Add talent-related properties
        this.healingReceivedMultiplier = 1.0; // New property for Enhanced Recovery talent
        this.buffDurationBonus = 0; // New property for Lasting Protection talent
        this.manaCostMultiplier = 1.0; // Add manaCostMultiplier property
        
        // Properties for Farmer Nina's talents
        this.enablePainIntoPower = false; // <-- NEW: Flag for Pain into Power talent
        this.critDamageFromTakingDamageBonus = 0; // <-- NEW: Bonus crit damage accumulated
    }

    // --- XP and Level System Methods ---
    
    /**
     * Calculate required XP for a specific level
     * @param {number} level - Target level
     * @returns {number} XP required to reach that level from level 1
     */
    static calculateXPRequiredForLevel(level) {
        if (level <= 1) return 0;
        
        let totalXP = 0;
        for (let i = 1; i < level; i++) {
            // XP required to go from level i to level i+1
            totalXP += this.getXPRequiredForLevelUp(i);
        }
        return totalXP;
    }
    
    /**
     * Get XP required to level up from a specific level
     * @param {number} fromLevel - Current level
     * @returns {number} XP needed to go to next level
     */
    static getXPRequiredForLevelUp(fromLevel) {
        if (fromLevel === 1) return 1000; // Level 1 to 2: 1000 XP
        if (fromLevel === 2) return 1500; // Level 2 to 3: 1500 XP (total 2500 from start)
        
        // For levels 3+, use a scaling formula
        // Base XP increases by 500 each level, plus additional scaling
        const baseIncrease = 500;
        const scalingFactor = Math.floor(fromLevel / 5) * 250; // Additional 250 XP every 5 levels
        return 1000 + (fromLevel - 1) * baseIncrease + scalingFactor;
    }
    
    /**
     * Calculate level from total XP
     * @param {number} totalXP - Total experience points
     * @returns {number} Character level
     */
    static calculateLevelFromXP(totalXP) {
        if (totalXP < 0) return 1;
        
        let level = 1;
        let xpForCurrentLevel = 0;
        
        while (true) {
            const xpNeededForNextLevel = this.getXPRequiredForLevelUp(level);
            if (xpForCurrentLevel + xpNeededForNextLevel > totalXP) {
                break;
            }
            xpForCurrentLevel += xpNeededForNextLevel;
            level++;
        }
        
        return level;
    }
    
    /**
     * Get XP progress for current level
     * @returns {Object} Progress information for current level
     */
    getXPProgress() {
        const currentLevel = this.level;
        const currentXP = this.experience;
        
        // XP required to reach current level
        const xpForCurrentLevel = Character.calculateXPRequiredForLevel(currentLevel);
        
        // XP required to reach next level
        const xpForNextLevel = Character.calculateXPRequiredForLevel(currentLevel + 1);
        
        // Progress within current level
        const progressXP = currentXP - xpForCurrentLevel;
        const progressNeeded = xpForNextLevel - xpForCurrentLevel;
        
        return {
            currentLevel: currentLevel,
            currentXP: currentXP,
            progressXP: progressXP,
            progressNeeded: progressNeeded,
            xpForCurrentLevel: xpForCurrentLevel,
            xpForNextLevel: xpForNextLevel,
            progressPercentage: progressNeeded > 0 ? (progressXP / progressNeeded) * 100 : 100
        };
    }
    
    /**
     * Add experience points to the character
     * @param {number} xpAmount - Amount of XP to add
     * @returns {Object} Level up information
     */
    addExperience(xpAmount) {
        if (typeof xpAmount !== 'number' || xpAmount < 0) {
            console.warn(`[Character ${this.name}] Invalid XP amount: ${xpAmount}`);
            return { leveledUp: false, oldLevel: this.level, newLevel: this.level };
        }
        
        const oldLevel = this.level;
        const oldXP = this.experience;
        
        // Add XP
        this.experience += xpAmount;
        
        // Calculate new level
        const newLevel = Character.calculateLevelFromXP(this.experience);
        const leveledUp = newLevel > oldLevel;
        
        if (leveledUp) {
            this.level = newLevel;
            console.log(`[Character ${this.name}] LEVEL UP! ${oldLevel} → ${newLevel} (XP: ${oldXP} → ${this.experience})`);
        } else {
            console.log(`[Character ${this.name}] Gained ${xpAmount} XP (Total: ${this.experience})`);
        }
        
        return {
            leveledUp: leveledUp,
            oldLevel: oldLevel,
            newLevel: newLevel,
            xpGained: xpAmount,
            totalXP: this.experience
        };
    }
    
    /**
     * Set character XP and level (used when loading from Firebase)
     * @param {number} experience - Total experience points
     * @param {number} level - Character level (optional, will be calculated if not provided)
     */
    setExperienceAndLevel(experience, level = null) {
        this.experience = Math.max(0, experience || 0);
        
        if (level !== null && typeof level === 'number' && level >= 1) {
            this.level = level;
        } else {
            // Calculate level from XP if not provided or invalid
            this.level = Character.calculateLevelFromXP(this.experience);
        }
        
        console.log(`[Character ${this.name}] Set to Level ${this.level} with ${this.experience} XP`);
    }

    // --- NEW: Apply Talent Effects ---
    applyTalentEffects(talentDefinitions, selectedTalents) {
        console.log(`[Character ${this.name}] Applying talent effects for:`, selectedTalents);
        this.talentModifiers = { stats: {}, abilities: {} }; // Reset modifiers

        for (const talentId in selectedTalents) {
            const talentRank = selectedTalents[talentId] === true ? 1 : selectedTalentId; // Get rank
            const talent = talentDefinitions[talentId];

            if (!talent || !talent.effects) continue;

            console.log(`[Character ${this.name}] Applying talent: ${talent.name} (Rank ${talentRank})`);

            talent.effects.forEach(effect => {
                // Adjust effect value based on rank (assuming linear scaling for now)
                const scaledValue = effect.value * talentRank;
                
                switch (effect.type) {
                    case 'stat_mod':
                        this.applyStatModification(effect.stat, effect.operation, scaledValue);
                        break;
                    case 'ability_mod':
                        this.applyAbilityModification(effect.abilityId, effect.property, effect.operation, scaledValue);
                        break;
                    case 'modify_passive':
                        if (this.passive && this.passive.id === effect.passiveId) {
                            console.log(`  - Modifying passive ${effect.passiveId}.${effect.property} to ${effect.value}`);
                            this.passive[effect.property] = effect.value;
                            if (this.passiveHandler && typeof this.passiveHandler.onTalentModified === 'function') {
                                this.passiveHandler.onTalentModified(effect.property, effect.value);
                            }
                        } else {
                            console.warn(`  - Passive ${effect.passiveId} not found or ID mismatch.`);
                        }
                        break;
                     case 'modify_character_property': // Handling for direct property mods
                         console.log(`  - Modifying character property ${effect.property} to ${effect.value}`);
                         this[effect.property] = effect.value;
                         // Specific handling for passive descriptions, etc., might be needed here or in the passive handler
                         if (this.passive && this.passive.id === 'farmer_shoma_passive' && (effect.property === 'passiveCritBoostValue' || effect.property === 'passiveTriggerTurn')) {
                             if (this.passiveHandler && typeof this.passiveHandler.updateDescription === 'function') {
                                this.passiveHandler.updateDescription(); // Tell handler to update based on new char properties
                             } else {
                                console.warn(`Passive handler for ${this.passive.id} missing updateDescription method.`);
                             }
                         }
                         break;
                    default:
                        console.warn(`[Character ${this.name}] Unknown talent effect type: ${effect.type} for talent ${talentId}`);
                }
            });
        }
        
        // After processing all talents, recalculate final stats
        this.recalculateStats('applyTalentEffects'); // Pass context
        
        console.log(`[Character ${this.name}] Finished applying talents. Final stats:`, this.stats);
    }

    applyStatModification(statName, operation, value) {
        // Apply modification based on operation
        switch (operation) {
            case 'add':
                // Apply additive change to both base and current stats for recalculation consistency
                this.baseStats[statName] = (this.baseStats[statName] || 0) + value;
                // We primarily modify baseStats; recalculateStats will handle applying it to current stats
                break;
            case 'subtract':
                this.baseStats[statName] = (this.baseStats[statName] || 0) - value;
                break;
            case 'multiply': // Usually applied as a percentage bonus in recalc
                console.warn(`[Character ${this.name}] Talent operation 'multiply' for stat ${statName} should typically be handled via percentage buffs/debuffs or direct base stat setting.`);
                // If truly needed, modify base stat directly:
                // this.baseStats[statName] = (this.baseStats[statName] || 0) * value;
                break;
            case 'set':
                // Direct set (use cautiously - overwrites base)
                this.baseStats[statName] = value;
                break;
            default:
                 console.warn(`[Character ${this.name}] Unsupported talent operation '${operation}' for stat ${statName}.`);
                 return; // Do nothing if operation is unknown
        }

        console.log(`[Character ${this.name}] Talent stat mod applied to BASE: ${statName} ${operation} ${value}. New base: ${this.baseStats[statName]}`);

        // Recalculate stats to apply effects and clamp values
        this.recalculateStats('applyStatModification'); // Pass context
    }

    applyAbilityModification(abilityId, property, operation, value) {
        // Find the ability instance on the character
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) {
            console.warn(`[Character ${this.name}] applyAbilityModification: Ability ${abilityId} not found.`);
            return;
        }

        // Directly modify the ability property on the instance
        let directlyModified = false;
        try {
            if (operation === 'set') {
                ability[property] = value;
                directlyModified = true;
            } else if (operation === 'add') {
                 ability[property] = (ability[property] || 0) + value;
                 directlyModified = true;
            } else if (operation === 'subtract') {
                 ability[property] = (ability[property] || 0) - value;
                 directlyModified = true;
            } else if (operation === 'multiply') {
                 ability[property] = (ability[property] || 0) * value;
                 directlyModified = true;
            } else {
                console.warn(`[Character ${this.name}] Unsupported talent operation '${operation}' for ability ${abilityId}.${property}.`);
            }

            if (directlyModified) {
                console.log(`[Character ${this.name}] DIRECT MODIFICATION applied: ${abilityId}.${property} ${operation} ${value}. New value: ${ability[property]}`);
                
                // --- NEW: Update Apple Throw description if Nurturing Toss talent is applied ---
                if (abilityId === 'farmer_shoma_w' && property === 'appliesHealingPowerBuff' && value === true) {
                    if (ability.baseDescription) { // Append to existing base description if available
                        ability.baseDescription += " Talent: Grants stacking Healing Power on use.";
                    } else { // Otherwise, modify the current description
                         ability.description += " Talent: Grants stacking Healing Power on use.";
                    }
                    console.log(`  - Appended Nurturing Toss info to ${abilityId} description.`);
                }
                // --- END NEW ---

                // Regenerate description if method exists
                if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                     console.log(`  - Regenerated description for ${abilityId} after direct talent application.`);
                }
            }

        } catch (e) {
            console.error(`[Character ${this.name}] Error directly modifying ability ${abilityId}.${property}:`, e);
        }

         // Store modifier details mainly for potential future use or debugging, 
         // but the primary mechanism is now direct modification.
         if (!this.talentModifiers.abilities[abilityId]) {
             this.talentModifiers.abilities[abilityId] = {};
         }
         if (!this.talentModifiers.abilities[abilityId][property]) {
             this.talentModifiers.abilities[abilityId][property] = {}; // Store operation and value
         }
         this.talentModifiers.abilities[abilityId][property][operation] = value;
         console.log(`[Character ${this.name}] Ability mod info stored: ${abilityId}.${property} ${operation} ${value}`);

         // Update UI if the character is already rendered
         if (typeof updateCharacterUI === 'function' && document.getElementById(`character-${this.instanceId || this.id}`)) {
             setTimeout(() => updateCharacterUI(this), 0); 
         }
    }
    
    // Method to recalculate stats based on base stats and modifiers
    recalculateStats(callerContext = 'unknown') {
        // <<< NEW: Log caller context >>>
        console.log(`[RecalcStats] Called from ${callerContext} for ${this.name}`);
        
        // Store current resources to preserve them
        const preservedCurrentHp = this.stats.currentHp;
        const preservedCurrentMana = this.stats.currentMana;
        
        // Reset stats to base values
        Object.keys(this.baseStats).forEach(stat => {
            this.stats[stat] = this.baseStats[stat];
        });
        
        // Apply stage modifications if they exist
        if (this.stageModifications) {
            console.log(`[RecalcStats] Re-applying stage modifications for ${this.name}:`, this.stageModifications);
            
            // Note: For stage modifications, baseStats should already be updated to include them
            // This is just a safety check in case baseStats weren't properly updated
            if (this.stageModifications.hpMultiplier && this.stageModifications.hpMultiplier !== 1) {
                // The baseStats should already include the multiplier, but double-check
                const expectedHp = Math.floor((this.stats.maxHp || this.stats.hp) * this.stageModifications.hpMultiplier);
                
                // Check if the character is already properly initialized with stage modifications
                // If maxHp is already in the expected range (accounting for the multiplier), don't change it
                const currentMaxHp = this.stats.maxHp;
                const isAlreadyCorrect = Math.abs(currentMaxHp - expectedHp) < 100; // Allow small variance
                
                // Only apply correction if we're in the middle of character creation/initialization
                // Don't apply if the character is already in combat (has been initialized properly)
                const isInCombat = window.gameManager && window.gameManager.gameState && 
                                 (window.gameManager.gameState.playerCharacters.includes(this) || 
                                  window.gameManager.gameState.aiCharacters.includes(this));
                
                if (!isInCombat && !isAlreadyCorrect && this.stats.maxHp !== expectedHp && this.baseStats.maxHp !== expectedHp) {
                    console.log(`[RecalcStats] Correcting HP during initialization: expected ${expectedHp}, got ${this.stats.maxHp}, applying stage modification`);
                    this.stats.maxHp = expectedHp;
                    if (this.baseStats.maxHp) {
                        this.baseStats.maxHp = expectedHp;
                    } else if (this.baseStats.hp) {
                        this.baseStats.hp = expectedHp;
                    }
                } else {
                    console.log(`[RecalcStats] Skipping HP correction for ${this.name} - character is in combat or already correct (maxHp: ${currentMaxHp}, expected: ${expectedHp})`);
                }
            }
            
            if (this.stageModifications.speedMultiplier && this.stageModifications.speedMultiplier !== 1) {
                // The baseStats should already include the multiplier, but double-check
                const expectedSpeed = Math.floor(this.stats.speed * this.stageModifications.speedMultiplier);
                if (this.stats.speed !== expectedSpeed && this.baseStats.speed !== expectedSpeed) {
                    console.log(`[RecalcStats] Correcting Speed: expected ${expectedSpeed}, got ${this.stats.speed}, applying stage modification`);
                    this.stats.speed = expectedSpeed;
                    this.baseStats.speed = expectedSpeed;
                }
            }
        }
        
        // Set current HP and mana back to their preserved values
        this.stats.currentHp = preservedCurrentHp;
        this.stats.currentMana = preservedCurrentMana;
        
        // <<< END NEW LOG >>>
        
        // Combine buff and debuff effects for processing
        const activeEffects = [...this.buffs, ...this.debuffs];
        
        // Apply bonusDodgeChance if exists (for Farmer Raiden's Lightning Evasion talent)
        if (this.bonusDodgeChance !== undefined) {
            this.stats.dodgeChance = (this.stats.dodgeChance || 0) + this.bonusDodgeChance;
            console.log(`[RecalcStats] Applied bonus dodge chance +${this.bonusDodgeChance} for ${this.name}, new total: ${this.stats.dodgeChance}`);
        }
        
        // Apply bonusCritChance if exists (for Farmer Raiden's Thunder Perception talent)
        if (this.bonusCritChance !== undefined) {
            this.stats.critChance = (this.stats.critChance || 0) + this.bonusCritChance;
            console.log(`[RecalcStats] Applied bonus crit chance +${this.bonusCritChance} for ${this.name}, new total: ${this.stats.critChance}`);
        }
        
        activeEffects.forEach(effect => {
            // --- ADDED DEBUG LOG ---
            if (effect.id === 'nurturing_toss_buff') {
                console.log(`[Recalc DEBUG - Nurturing Toss] Inspecting effect: ID=${effect.id}, Stacks=${effect.currentStacks}, StatModifiers=`, JSON.stringify(effect.statModifiers));
            }
            if (effect.id === 'lunar_empowerment_buff') {
                console.log(`[Character.js DEBUG] recalculateStats: Processing lunar_empowerment_buff.`);
                console.log(`[Character.js DEBUG] lunar_empowerment_buff statModifiers:`, JSON.stringify(effect.statModifiers));
            }
            // --- END DEBUG LOG ---

            if (effect.statModifiers) {
                // --- Ensure statModifiers is treated as an array ---
                const modifiers = Array.isArray(effect.statModifiers) ? effect.statModifiers : [effect.statModifiers];
                // --- End Ensure ---

                // --- Filter out invalid modifiers ---
                const validModifiers = modifiers.filter(modifier => {
                    if (!modifier || typeof modifier !== 'object') {
                        console.warn(`Invalid modifier object in effect ${effect.id}:`, modifier);
                        return false;
                    }
                    if (modifier.stat === undefined || modifier.stat === null) {
                        console.warn(`Modifier with undefined/null stat in effect ${effect.id}:`, modifier);
                        return false;
                    }
                    if (typeof modifier.value !== 'number') {
                        console.warn(`Modifier with non-numeric value in effect ${effect.id}:`, modifier);
                        return false;
                    }
                    return true;
                });
                // --- End Filter ---

                // --- CORRECTED LOOP for Array of Modifiers ---
                // Use the filtered 'validModifiers' array here
                validModifiers.forEach(modifier => { // Changed from effect.statModifiers.forEach
                    const stat = modifier.stat;
                    const modifierValue = modifier.value;
                    const operation = modifier.operation || 'add'; // Default to add

                    if (effect.id === 'lunar_empowerment_buff') {
                        console.log(`[Character.js DEBUG] recalculateStats (lunar_empowerment_buff): Modifier - stat=${stat}, value=${modifierValue}, operation=${operation}`);
                        console.log(`[Character.js DEBUG] recalculateStats (lunar_empowerment_buff): BEFORE this.stats.${stat} = ${this.stats[stat]}`);
                    }

                    if (this.stats[stat] !== undefined && typeof modifierValue === 'number') {
                        // Stack logic (remains the same)
                        const latestEffectInstance = this.buffs.find(b => b.id === effect.id) || this.debuffs.find(d => d.id === effect.id);
                        const stacks = (latestEffectInstance && latestEffectInstance.stackable && latestEffectInstance.currentStacks) ? latestEffectInstance.currentStacks : 1;
                        const totalModifier = modifierValue * stacks;

                        // <<< NEW: Specific log for Low Tide Power >>>
                        let logLowTide = false;
                        if (effect.id === 'low_tide_power_buff' && stat === 'magicalDamage') {
                            console.log(`%c[DEBUG-LOWTIDE] recalculateStats processing Low Tide Power buff. Current MD: ${this.stats.magicalDamage}`, 'color: green; font-weight: bold;');
                            logLowTide = true;
                        }
                        // <<< END NEW >>>

                        if (stacks > 1) {
                            console.log(`[Recalc Per Stack] ${this.name}: Effect ${effect.name || effect.id} applying stat ${stat} (Stacks: ${stacks}, Value per stack: ${modifierValue}, Total: ${totalModifier})`);
                        }

                        // Apply based on operation
                        switch (operation) {
                            case 'add':
                                this.stats[stat] += totalModifier;
                                break;
                            case 'multiply': // Example for future use
                                // Be cautious with multiplicative stacking order
                                this.stats[stat] *= totalModifier;
                                break;
                            case 'add_base_percentage': // New operation
                                const baseStatValue = this.baseStats[stat] || 0;
                                const percentageBonus = baseStatValue * totalModifier;
                                this.stats[stat] += percentageBonus;
                                console.log(`[Recalc ${operation}] Added ${percentageBonus.toFixed(2)} (${(totalModifier * 100).toFixed(1)}% of base ${baseStatValue.toFixed(2)}) to ${stat}. New value: ${this.stats[stat].toFixed(2)}`);
                                break;
                            case 'set': 
                                // Set operation - use the highest value if multiple set operations exist
                                const currentValue = this.stats[stat];
                                if (totalModifier > currentValue || currentValue === this.baseStats[stat]) {
                                    this.stats[stat] = totalModifier;
                                    console.log(`[Recalc ${operation}] Set ${stat} to ${totalModifier} (was ${currentValue}) from effect ${effect.name || effect.id}`);
                                } else {
                                    console.log(`[Recalc ${operation}] Keeping higher ${stat} value ${currentValue} instead of ${totalModifier} from effect ${effect.name || effect.id}`);
                                }
                                break;
                            // Add other operations if needed
                            default:
                                 console.warn(`Unsupported operation '${operation}' for stat modifier in effect ${effect.id}`);
                        }

                        // <<< NEW: Specific log for Low Tide Power (After) >>>
                        if (logLowTide) {
                            console.log(`%c[DEBUG-LOWTIDE] MD AFTER applying Low Tide Power buff: ${this.stats.magicalDamage}`, 'color: green; font-weight: bold;');
                        }
                        // <<< END NEW >>>

                        // Logging for healing power (remains the same)
                        if (stat === 'healingPower') {
                            console.log(`[Recalc HEAL final] Stat ${stat} changed to ${this.stats[stat]} after applying ${effect.name || effect.id} (Stacks: ${stacks}, Total Bonus: ${totalModifier})`);
                        }

                        if (effect.id === 'lunar_empowerment_buff') {
                            console.log(`[Character.js DEBUG] recalculateStats (lunar_empowerment_buff): AFTER this.stats.${stat} = ${this.stats[stat]}`);
                        }
                    } else {
                        if (this.stats[stat] === undefined) {
                            console.warn(`Stat '${stat}' not found on character for effect ${effect.id}`);
                        } else {
                            console.warn(`Invalid stat modifier value for ${stat} in effect ${effect.id}:`, modifierValue);
                        }
                    }
                });
                // --- END CORRECTED LOOP ---
            }
            // Potential future handling for non-stat effects like damage multipliers
            // if (effect.effects) { ... }
        });

        // --- Clamp Resource Values --- 
        const maxHp = this.stats.maxHp !== undefined ? this.stats.maxHp : (this.stats.hp || 0);
        this.stats.currentHp = Math.min(preservedCurrentHp, maxHp);
        this.stats.currentHp = Math.max(0, this.stats.currentHp);

        const maxMana = this.stats.maxMana !== undefined ? this.stats.maxMana : (this.stats.mana || 0);
        this.stats.currentMana = Math.min(preservedCurrentMana, maxMana);
        this.stats.currentMana = Math.max(0, this.stats.currentMana);

        // <<< ADDED SPECIFIC HEALING POWER LOG >>>
        console.log(`[Recalc Final Check] ${this.name}'s Healing Power before final log: ${this.stats.healingPower}`);
        // <<< END ADDED LOG >>>
        
        // Update the character UI to reflect the recalculated stats
        if (typeof window !== 'undefined' && window.gameManager && window.gameManager.uiManager) {
            console.log(`[RecalcStats] Updating UI for ${this.name} after stat recalculation`);
            window.gameManager.uiManager.updateCharacterUI(this);
        } else if (typeof updateCharacterUI === 'function') {
            // Fallback to global function if available
            updateCharacterUI(this);
        } else {
            console.log(`[RecalcStats] No UI update method available for ${this.name}`);
        }

        console.log(`${this.name} stats recalculated:`, this.stats);

        // Trigger UI update
        if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
            setTimeout(() => window.gameManager.uiManager.updateCharacterUI(this), 0); 
        } else if (typeof updateCharacterUI === 'function') {
            setTimeout(() => updateCharacterUI(this), 0); 
        }
        
        // Update any open stats menu
        this.updateStatsMenuIfOpen();
        
        // Regenerate ability descriptions to reflect stat changes
        if (this.abilities) {
            this.abilities.forEach(ability => {
                if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                }
            });
        }
        
        // <<< NEW: Apply Pain into Power bonus AFTER other modifiers >>>
        if (this.critDamageFromTakingDamageBonus > 0) {
            const originalCritDamage = this.stats.critDamage;
            this.stats.critDamage += this.critDamageFromTakingDamageBonus;
            console.log(`[RecalcStats - PainIntoPower] Applied +${(this.critDamageFromTakingDamageBonus * 100).toFixed(1)}% Crit Damage. Total: ${(this.stats.critDamage * 100).toFixed(1)}%`);
        }
        // <<< END NEW >>>



        // <<< NEW: Apply Siegfried's Passive Bonus >>>
        if (this.id === 'schoolboy_siegfried' && this.passiveHandler) {
            const buffCount = this.buffs.length;
            const bonusPerBuff = 125; // +125 Physical Damage per buff
            const passiveBonus = buffCount * bonusPerBuff;
            
            if (passiveBonus > 0) {
                const originalPhysicalDamage = this.stats.physicalDamage;
                this.stats.physicalDamage += passiveBonus;
                console.log(`[RecalcStats - Siegfried Passive] Applied +${passiveBonus} Physical Damage for ${buffCount} buffs. Total: ${this.stats.physicalDamage}`);
            }
        }
        // <<< END NEW >>>
    }

    // Add an ability to the character
    addAbility(ability) {
        // Assign this character as the owner of the ability instance
        ability.character = this;
        this.abilities.push(ability);
    }

    // Use an ability by its index
    useAbility(index, target) {
        if (index < 0 || index >= this.abilities.length) {
            console.error(`Invalid ability index: ${index} for ${this.name}`);
            return false;
        }
        
        const ability = this.abilities[index];

        // --- NEW: Check for 'It finally rains!' modifier for zero mana cost ---
        let actualManaCost = ability.manaCost;
        let skipManaCheck = false;
        if (window.gameManager && window.gameManager.stageManager) {
            const rainModifier = window.gameManager.stageManager.getStageModifier('it_finally_rains');
            if (rainModifier && !this.isAI) { // Only affects player characters
                skipManaCheck = true;
                actualManaCost = 0; // Although we skip the check, conceptually the cost is 0
                // Optional: Log this event?
                // const log = window.gameManager.addLogEntry.bind(window.gameManager);
                // log(`${this.name}'s ${ability.name} costs 0 mana due to rain!`);
            }
        }
        // --- END NEW ---

        // --- PRE-CHECKS (Modified for mana cost) ---
        if (ability.isDisabled) {
             const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
             log(`${this.name}'s ${ability.name} is disabled.`);
             return false;
        }
        if (ability.currentCooldown > 0) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${ability.name} is on cooldown: ${ability.currentCooldown} turns remaining`);
            return false;
        }
        // --- MODIFIED MANA CHECK ---
        if (!skipManaCheck && this.stats.currentMana < actualManaCost) { 
        // --- END MODIFIED MANA CHECK ---
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} has not enough mana to use ${ability.name}`);
            return false;
        }
         if (this.isStunned()) {
             const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
             log(`${this.name} is stunned and cannot use ${ability.name}.`);
             return false;
         }
        // --- END PRE-CHECKS ---

        // --- Check for Ability Disable Debuff ---
        const disableDebuff = this.debuffs.find(d => 
            d.effects && 
            d.effects.disabledAbilityIndex === index
        );
        if (disableDebuff) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} cannot use ${ability.name} because it is disabled by ${disableDebuff.name}.`);
            return false;
        }
        // --- END Ability Disable Check ---

        // --- NEW: Check for Smoke Cloud modifier ---
        if (window.gameManager && window.gameManager.stageManager && !this.isAI) {
            // Only affects player characters
            const smokeModifier = window.gameManager.stageManager.getStageModifier('smoke_cloud');
            if (smokeModifier && window.stageModifiersRegistry) {
                // 42% chance to miss
                if (Math.random() < 0.21) {
                    // Consume mana since the attempt was made
                    if (!skipManaCheck) {
                        this.stats.currentMana -= actualManaCost;
                        
                        // Trigger mana animation for wasted casting
                        if (actualManaCost > 0 && window.gameManager && window.gameManager.uiManager) {
                            window.gameManager.uiManager.triggerManaAnimation(this, 'drain', actualManaCost);
                        }
                    }
                    
                    // Put ability on cooldown
                    ability.currentCooldown = ability.cooldown;
                    
                    // Show miss VFX
                    window.stageModifiersRegistry.createSmokeCloudMissVFX(this);
                    
                    // Add to battle log
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${this.name}'s ${ability.name} is obscured by the smoke cloud and misses completely!`, 'miss');
                    
                    // Update UI to show cooldown and mana loss
                    if (window.updateCharacterUI) {
                        window.updateCharacterUI(this);
                    }
                    
                    // Return false to indicate the ability failed - do NOT execute the ability effect
                    return false;
                }
            }
        }
        // --- END Smoke Cloud Check ---

        // --- NEW: Shoma -> Julia Interaction Sound ---
        let targetIsJulia = false;
        if (Array.isArray(target)) {
            targetIsJulia = target.some(t => t && t.id === 'schoolgirl_julia');
        } else if (target) {
            targetIsJulia = target.id === 'schoolgirl_julia';
        }

        // Play interaction sound if Shoma targets Julia with ANY ability
        if (this.id === 'schoolboy_shoma' && targetIsJulia) { 
            // <<< ADD DEBUG LOGS HERE >>>
            console.log(`[DEBUG Interaction Sound] Condition met! Caster: ${this.name}, Target is Julia: ${targetIsJulia}, Ability: ${ability.name}`);
            const interactionSounds = ['sounds/julia_shoma.mp3', 'sounds/julia_shoma2.mp3'];
            const randomSound = interactionSounds[Math.floor(Math.random() * interactionSounds.length)];
            console.log(`[DEBUG Interaction Sound] Chosen sound: ${randomSound}`);
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            if (typeof playSound === 'function') {
                 console.log(`[DEBUG Interaction Sound] Calling playSound function.`);
                 playSound(randomSound);
            } else {
                 console.error(`[DEBUG Interaction Sound] playSound function not found or not a function!`);
            }
            // Optional: Keep or remove the specific log message
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} used ${ability.name} on Julia! (Interaction sound played)`); 
        } else {
             // <<< ADD DEBUG LOG HERE >>>
             if (this.id === 'schoolboy_shoma') {
                 console.log(`[DEBUG Interaction Sound] Condition NOT met. Caster: ${this.name}, Target is Julia: ${targetIsJulia}, Ability: ${ability.name}`);
             }
        }
        // --- END NEW ---

        // --- CONSUME MANA BEFORE USING ABILITY ---
        if (!skipManaCheck) {
            // Consume mana
            this.stats.currentMana -= actualManaCost;
            
            // Trigger mana animation for casting
            if (actualManaCost > 0 && window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.triggerManaAnimation(this, 'drain', actualManaCost);
                window.gameManager.uiManager.triggerManaAnimation(this, 'casting', actualManaCost);
            }
        }
        
        // Set cooldown (unless reset by ability effect)
        ability.currentCooldown = ability.cooldown;
        
        // Use the ability and apply its effect
        // Pass the target(s) directly to the ability's use method
        // --- MODIFIED: Pass actualManaCost to ability.use --- 
        const success = ability.use(this, target, actualManaCost);
        // --- END MODIFIED --- 
        
        // Dispatch a custom event for VFX only if successful
        if (success) {
            // --- STATISTICS TRACKING: Record basic ability usage ---
            if (window.statisticsManager) {
                window.statisticsManager.recordAbilityUse(this, ability.id);
                console.log(`[Character.useAbility] Recorded statistics for ${this.name} using ${ability.name || ability.id}`);
            }
            // --- END STATISTICS TRACKING ---
            
            // --- NEW: Check the result for Predator's Focus Cooldown Reduction ---
            const abilityResult = window.abilityLastResult || {}; // Get result from global storage
            
            // Set cooldown AFTER checking the result
            if (abilityResult.predatorFocusCooldownReduced) {
                // Apply reduced cooldown if the talent triggered CDR
                ability.currentCooldown = Math.max(0, ability.cooldown - 1);
                console.log(`[PredatorFocus Apply] ${ability.name} cooldown set to ${ability.currentCooldown} (reduced by talent).`);
            } else if (!abilityResult.resetCooldown) {
                // Apply normal cooldown (unless resetCooldown was true)
                ability.currentCooldown = ability.cooldown;
            }
            // If resetCooldown was true, currentCooldown remains 0 (handled in Ability.use)
            // --- END NEW --- 

            const abilityUsedEvent = new CustomEvent('AbilityUsed', {
                detail: {
                    caster: this,
                    target: target, // Pass original target info
                    ability: ability
                }
            });
            document.dispatchEvent(abilityUsedEvent);
        } else {
            // Log if ability.use returned false for some internal reason
            console.warn(`${this.name}'s attempt to use ${ability.name} returned false.`);
            // Restore mana if the ability use failed internally after mana was spent
            this.stats.currentMana += actualManaCost; 
        }
        
        // Update UI after ability use
        if (window.updateCharacterUI) {
            window.updateCharacterUI(this);
        }
        
        return success;
    }

    // Apply damage, now accepts caster as an argument
    applyDamage(amount, type, caster = null, options = {}) { // Added options object
        // If character is dead, no damage to apply
        if (this.isDead()) {
            console.log(`${this.name} is already dead, damage ignored.`);
            return { damage: 0, isCritical: false, isDodged: false };
        }
        
        // Skip damage if character is untargetable
        if (this.isUntargetable()) {
            // Dispatch a damage event with 0 damage
            if (caster) {
                console.log(`[Event Dispatch] Character is untargetable, dispatching zero-damage event`);
                document.dispatchEvent(new CustomEvent('character:damage-dealt', {
                    detail: {
                        character: caster,
                        target: this,
                        damage: 0,
                        damageType: type,
                        isCritical: false,
                        missed: true
                    }
                }));
            }
            return { damage: 0, isCritical: false, isDodged: true };
        }
        
        // Destructure options
        const { isChainReaction = false, isRetaliation = false, bypassMagicalShield = false, bypassArmor = false } = options;

        // Store original amount for logging
        const originalAmount = amount;
        
        // Apply dodge chance check
        if (Math.random() < this.stats.dodgeChance) {
            console.log(`[${this.name}] Dodged an attack of ${amount} ${type} damage`);
            
            // --- STATISTICS TRACKING: Record dodge ---
            if (window.statisticsManager) {
                window.statisticsManager.recordDodge(this, caster, options.abilityId);
            }
            // --- END STATISTICS TRACKING ---
            
            // Check specifically for Zoey's dodge for debugging
            if (this.id === 'zoey') {
                console.log(`[ZOEY DODGE DETECTED] Zoey dodged an attack! Dispatching event...`);
            }
            
            // Dispatch a character:dodged event for talents to hook into
            try {
                document.dispatchEvent(new CustomEvent('character:dodged', {
                    detail: {
                        character: this,
                        attacker: caster,
                        damageAmount: amount,
                        damageType: type
                    }
                }));
                
                // For Zoey specifically, add extra debug
                if (this.id === 'zoey') {
                    console.log(`[ZOEY DODGE EVENT] Event dispatched, verifying if handler will catch it...`);
                    console.log(`[ZOEY DODGE EVENT] Forcing direct call to passive handler (fallback)...`);
                    
                    // Direct call to Zoey's passive handler if exists
                    if (this.passiveHandler) {
                        console.log(`[ZOEY DODGE EVENT] Found passiveHandler, attempting direct call`);
                        try {
                            if (typeof this.passiveHandler.onCharacterDodged === 'function') {
                                this.passiveHandler.onCharacterDodged({
                                    detail: { character: this, attacker: caster }
                                });
                                console.log(`[ZOEY DODGE EVENT] Successfully called passive directly`);
                            } else {
                                console.log(`[ZOEY DODGE EVENT] No onCharacterDodged method found on passive`);
                            }
                        } catch (err) {
                            console.error(`[ZOEY DODGE EVENT] Error calling passive directly:`, err);
                        }
                    } else {
                        console.log(`[ZOEY DODGE EVENT] No passiveHandler found for direct call`);
                    }
                }
            } catch (error) {
                console.error(`[DODGE EVENT ERROR] Failed to dispatch dodge event:`, error);
            }
            
            // Trigger the dodge handler in passive for Nimble Strikes talent
            if (this.passiveHandler && typeof this.passiveHandler.onDodge === 'function') {
                this.passiveHandler.onDodge(this, caster);
            }
            
            // Check if this is Zoey for custom VFX
            if (this.id === 'zoey' && typeof window.showZoeyDodgeVFX === 'function') {
                window.showZoeyDodgeVFX(this);
            } else {
                // Use enhanced dodge VFX for other characters
                this.showEnhancedDodgeVFX();
            }
            
            // Add dodge class for Nimble Strikes VFX
            if (this.dodgeGrantsCritBuff) {
                const elementId = this.instanceId || this.id;
                const dodgeText = document.querySelector(`#character-${elementId} .dodge-text`);
                if (dodgeText) {
                    dodgeText.classList.add('nimble-strikes-active');
                    setTimeout(() => {
                        dodgeText.classList.remove('nimble-strikes-active');
                    }, 1500);
                }
            }
            
            // Invoke the game engine's onDodge callback if available
            if (window.gameEngine && typeof window.gameEngine.onDodge === 'function') {
                window.gameEngine.onDodge(this, caster);
            }
            
            // Agile Counterforce: direct talent implementation when Zoey dodges
            if (this.id === 'zoey' && this.hasTalent && this.hasTalent('agile_counterforce')) {
                const baseMagical = this.stats.magicalDamage || 0;
                const buffVal = Math.floor(baseMagical * 0.1);
                const buff = {
                    id: `agile_counterforce_buff_${Date.now()}`,
                    name: 'Agile Counterforce',
                    description: `Increases Magical Damage by ${buffVal} for 4 turns.`,
                    icon: 'Icons/talents/agile_counterforce.webp',
                    duration: 4,
                    statModifiers: [{ stat: 'magicalDamage', value: buffVal, operation: 'add' }]
                };
                this.addBuff(buff);
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Agile Counterforce grants +${buffVal} Magical Damage!`, 'zoey talent-effect');
                }
            }
            
            return { damage: 0, isCritical: false, isDodged: true };
        }

        // --- NEW: Affection Damage Reduction Check ---
        let damage = amount; // Use a local variable for damage calculation
        
        // --- LOG instanceId --- 
        console.log(`[ApplyDamage Debug - ${this.name}] instanceId: ${this.instanceId || this.id} - Starting damage calculation`); // <<< ADDED INSTANCE ID LOG
        
        if (caster) { // Only apply if there is a caster
            const affectionBuff = this.buffs.find(b => 
                b.id.startsWith('affection_buff_') && 
                b.targetId === caster.id
            );
            if (affectionBuff) {
                const reduction = 0.5; // 50% reduction
                const originalDamage = damage;
                damage *= (1 - reduction);
                damage = Math.max(1, Math.floor(damage)); // Ensure damage is at least 1
                const logFunction = window.gameManager ? 
                    window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                logFunction(`${this.name}'s Affection reduces incoming damage from ${caster.name} by 50% (from ${Math.round(originalDamage)} to ${Math.round(damage)})!`, 'buff-effect');
            }
        }
        // --- END NEW ---

        // Check for critical hit
        let isCritical = false;
        
        // --- Add caster check for critical hit calculation --- 
        const critSource = caster || this.isDamageSource; // Prioritize direct caster
        if (critSource && Math.random() < (critSource.stats.critChance || 0)) {
            let critDamageMultiplier = critSource.stats.critDamage || 1.5; // Use source's crit damage
            
            // --- DEBUG: Check critDamageMultiplier --- 
            console.log(`[Crit Debug - ${critSource.name}] Crit Chance: ${critSource.stats.critChance}, Rolled Crit: true`);
            console.log(`[Crit Debug - ${critSource.name}] Base Crit Multiplier: ${critDamageMultiplier}, Type: ${typeof critDamageMultiplier}`);
            
            // Ensure multiplier is a valid number
            if (typeof critDamageMultiplier !== 'number' || isNaN(critDamageMultiplier)) {
                console.warn(`[Crit Debug - ${critSource.name}] Invalid critDamageMultiplier (${critDamageMultiplier}), defaulting to 1.5`);
                critDamageMultiplier = 1.5;
            }
            // --- END DEBUG --- 
            
            damage = Math.floor(damage * critDamageMultiplier);
            isCritical = true;

            // --- DEBUG: Log damage after crit calculation ---
            console.log(`[Crit Debug - ${critSource.name}] Damage after crit calculation: ${damage}`);
            // --- END DEBUG ---

            const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {}; // Get playSound function

            if (isCritical) {
                 logFunction(`${critSource.name} critically strikes ${this.name}! (x${critDamageMultiplier.toFixed(2)})`, 'critical');
                 // Play Farmer Shoma specific crit sounds
                 if (critSource.id === 'farmer_shoma') {
                     playSound('sounds/fshoma_letsgo.mp3', 0.7); // Crit dealt sound
                 }
                 if (this.id === 'farmer_shoma') {
                    playSound('sounds/fshoma_ouch.mp3', 0.7); // Crit taken sound
                 }
                 
                 // --- NEW: Check for Critical Reflexes talent ---
                 if (critSource.critReducesCooldowns) {
                     // Reduce all active ability cooldowns by 1
                     let cooldownsReduced = false;
                     critSource.abilities.forEach(ability => {
                         if (ability.currentCooldown > 0) {
                             ability.reduceCooldown();
                             cooldownsReduced = true;
                             
                             // Add visual feedback for cooldown reduction
                             setTimeout(() => {
                                 const sourceElementId = critSource.instanceId || critSource.id;
                                 const sourceElement = document.getElementById(`character-${sourceElementId}`);
                                 if (sourceElement) {
                                     // Find ability elements and add glow effect
                                     const abilityElements = sourceElement.querySelectorAll('.ability');
                                     abilityElements.forEach((abilityEl, index) => {
                                         if (index < critSource.abilities.length && 
                                             critSource.abilities[index].id === ability.id) {
                                             // Add glow effect class
                                             abilityEl.classList.add('cooldown-reduced');
                                             
                                             // Remove class after animation completes
                                             setTimeout(() => {
                                                 abilityEl.classList.remove('cooldown-reduced');
                                             }, 1000);
                                         }
                                     });
                                     
                                     // Add cooldown reduction indicator
                                     const reflexesVfx = document.createElement('div');
                                     reflexesVfx.className = 'critical-reflexes-vfx';
                                     sourceElement.appendChild(reflexesVfx);
                                     
                                     // Add floating "-1" indicator
                                     const indicator = document.createElement('div');
                                     indicator.className = 'cooldown-reduction-indicator';
                                     indicator.textContent = '-1 CD';
                                     indicator.style.left = `${50 + (Math.random() * 40 - 20)}%`;
                                     indicator.style.top = `${60 + (Math.random() * 20 - 10)}%`;
                                     reflexesVfx.appendChild(indicator);
                                     
                                     // Clean up VFX after animation completes
                                     setTimeout(() => {
                                         if (reflexesVfx.parentNode) {
                                             reflexesVfx.remove();
                                         }
                                     }, 1200);
                                 }
                             }, 0);
                         }
                     });
                     
                     if (cooldownsReduced) {
                         logFunction(`${critSource.name}'s Critical Reflexes reduced active ability cooldowns by 1!`, 'talent-effect');
                         
                         // Show floating text if showFloatingText function exists in window.gameManager
                         if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
                             const elementId = critSource.instanceId || critSource.id;
                             window.gameManager.showFloatingText(`character-${elementId}`, '-1 CD', 'buff');
                         }
                         
                         // Update UI if available
                         if (typeof updateCharacterUI === 'function') {
                             updateCharacterUI(critSource);
                         }
                     }
                 }
                 
                 // --- NEW: Check for Critical Power talent ---
                 if (critSource.enableCriticalPowerBuff && 
                     critSource.id === 'farmer_nina' && 
                     typeof window.applyCriticalPowerBuff === 'function') {
                     
                     console.log(`[Critical Power] Detected critical hit from ${critSource.name}, applying buff`);
                     window.applyCriticalPowerBuff(critSource);
                 }
                 // --- END NEW ---
            }
        }
        // --- End caster check --- 
        
        // Apply damage modifiers (like Silencing Ring) FROM THE CASTER
        if (caster && typeof caster.calculateDamage === 'function') {
            // MODIFIED: Pass target (this) to calculateDamage
            damage = caster.calculateDamage(damage, type, this); 
        }
        
        let damageAfterMods = damage; // Store damage before armor/shield
        console.log(`[ApplyDamage Debug - ${this.name}] Damage after crit/caster mods: ${damageAfterMods}`); // <<< ADDED LOG

        // Apply armor/magical shield reduction as percentage-based
        if (type === 'physical') {
            // <<< Check bypassArmor >>>
            if (!bypassArmor) {
                // Convert armor to percentage-based reduction (capped at 80%)
                const damageReduction = Math.min(0.8, this.stats.armor / 100);
                damageAfterMods = Math.max(1, Math.floor(damageAfterMods * (1 - damageReduction)));
            } else {
                 const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                 log(`(${caster ? caster.name : 'Source'}'s Peck) bypassed ${this.name}'s armor!`, 'passive'); 
            }
        } else if (type === 'magical') {
            // If bypassMagicalShield is true, skip the reduction logic entirely.
            // The damageAfterMods value will remain unchanged from before this check.
            if (!bypassMagicalShield) { 
                // Convert magical shield to percentage-based reduction (capped at 80%)
                const damageReduction = Math.min(0.8, this.stats.magicalShield / 100);
                damageAfterMods = Math.max(1, Math.floor(damageAfterMods * (1 - damageReduction)));
            } else {
                // Log that shield was bypassed (no damage modification needed here)
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`(${caster ? caster.name : 'Source'}'s Zap) bypassed ${this.name}'s magical shield!`, 'passive'); // Changed log message for clarity
            }
        }

        console.log(`[ApplyDamage Debug - ${this.name}] Damage after armor/shield: ${damageAfterMods}`); // <<< ADDED LOG

        // --- NEW: Check for Hooked debuff --- 
        const hookedDebuff = this.debuffs.find(d => d.id === 'hooked_debuff');
        if (hookedDebuff && hookedDebuff.increasesDamageTaken) {
            const originalDamage = damageAfterMods;
            damageAfterMods = Math.floor(damageAfterMods * hookedDebuff.increasesDamageTaken);
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} is Hooked and takes ${Math.round((hookedDebuff.increasesDamageTaken - 1) * 100)}% increased damage! (${Math.round(originalDamage)} -> ${Math.round(damageAfterMods)})`, 'debuff-effect');
        }
        // --- END NEW ---

        // --- NEW: Fire Shield Check ---
        const fireShieldBuff = this.buffs.find(b => b.id === 'fire_shield_buff');
        let finalDamage = damageAfterMods; // Initialize final damage with damage after armor/hooked
        let retaliationDamage = 0;
        let didRetaliate = false; // Flag to ensure retaliation happens only once per hit

        console.log(`[ApplyDamage Debug - ${this.name}] Damage before Fire Shield check: ${finalDamage}`); // <<< ADDED LOG

        if (fireShieldBuff && caster && !caster.isDead() && !isRetaliation && !didRetaliate) { // Check buff, attacker, not already retaliation, and hasn't retaliated yet
            const reductionPercent = fireShieldBuff.effects?.damageReductionPercent || 0.25; // Default 25%
            const retaliationPercent = fireShieldBuff.effects?.retaliationPercent || 0.50; // Default 50%

            // 1. Calculate Retaliation Damage (based on damage *before* Fire Shield reduction)
            retaliationDamage = Math.floor(damageAfterMods * retaliationPercent);

            // 2. Apply Fire Shield Damage Reduction to the final damage amount
            finalDamage = Math.max(1, Math.floor(finalDamage * (1 - reductionPercent)));

            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Fire Shield reduces incoming damage by ${reductionPercent * 100}% (from ${Math.round(damageAfterMods)} to ${Math.round(finalDamage)})!`, 'buff-effect');

            // 3. Trigger Retaliation (moved below HP update)
            didRetaliate = true; // Mark that retaliation is planned for this hit
        }
        // --- END Fire Shield Check ---

        console.log(`[ApplyDamage Debug - ${this.name}] Final damage before shield/HP reduction: ${finalDamage}`); // <<< ADDED LOG
        const originalHp = this.stats.currentHp; // Store HP before damage
        const originalShield = this.shield; // Store shield before damage
        console.log(`[ApplyDamage Debug - ${this.name}] HP before reduction: ${originalHp}, Shield: ${originalShield}`); // <<< ADDED LOG
        
        // NEW: Apply shield logic
        let damageToShield = 0;
        let damageToHp = finalDamage;
        
        if (this.shield > 0) {
            if (finalDamage <= this.shield) {
                // Shield absorbs all damage
                damageToShield = finalDamage;
                damageToHp = 0;
                this.shield -= finalDamage;
                
                // Trigger shield damaged animation
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.triggerShieldAnimation(this, 'damaged');
                }
            } else {
                // Shield absorbs part of damage, rest goes to HP
                damageToShield = this.shield;
                damageToHp = finalDamage - this.shield;
                this.shield = 0;
                
                // Trigger shield broken animation
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.triggerShieldAnimation(this, 'broken');
                }
            }
            
            // Log shield interaction
            if (window.gameManager) {
                if (damageToHp === 0) {
                    window.gameManager.addLogEntry(`${this.name}'s shield absorbs ${damageToShield} damage!`, 'buff-effect');
                } else {
                    window.gameManager.addLogEntry(`${this.name}'s shield absorbs ${damageToShield} damage, ${damageToHp} damage to health!`, 'buff-effect');
                }
            }
        }
        
        // Apply damage to HP
        this.stats.currentHp = Math.max(0, this.stats.currentHp - damageToHp);
        
        // Trigger HP animation for damage
        if (damageToHp > 0 && window.gameManager && window.gameManager.uiManager) {
            this._lastDamageWasCritical = isCritical;
            window.gameManager.uiManager.triggerHPAnimation(this, 'damage', damageToHp, isCritical);
        }
        
        console.log(`[ApplyDamage Debug - ${this.name}] HP after reduction: ${this.stats.currentHp}, Shield after: ${this.shield}`); // <<< ADDED LOG
        const actualDamageTaken = originalHp - this.stats.currentHp; // Calculate actual HP lost
        const totalDamageAbsorbed = originalShield - this.shield; // Calculate shield damage absorbed
        console.log(`[ApplyDamage Debug - ${this.name}] Actual HP damage: ${actualDamageTaken}, Shield damage: ${totalDamageAbsorbed}`); // <<< ADDED LOG

        // --- STATISTICS TRACKING: Record damage dealt and taken ---
        if (window.statisticsManager && actualDamageTaken > 0) {
            window.statisticsManager.recordDamageDealt(caster, this, actualDamageTaken, type, isCritical, options.abilityId);
        }
        if (window.statisticsManager && totalDamageAbsorbed > 0) {
            window.statisticsManager.recordShieldAbsorption(this, totalDamageAbsorbed);
        }
        // --- END STATISTICS TRACKING ---

        // --- QUEST TRACKING: Record damage dealt by player characters ---
        if (caster && !caster.isAI && this.isAI && actualDamageTaken > 0) {
            if (typeof window.questManager !== 'undefined' && window.questManager.initialized) {
                window.questManager.updateQuestProgress('totalDamageDealt', actualDamageTaken);
            }
        }
        // --- END QUEST TRACKING ---

        // --- Apply Lifesteal to the caster --- 
        if (caster && actualDamageTaken > 0) { // Only apply if there is a caster and damage was dealt
            caster.applyLifesteal(actualDamageTaken);
        }
        // --- End Lifesteal Application ---

        // --- NEW: Dispatch damageDealt event ---
        if (caster && actualDamageTaken > 0) {
            const damageDealtEvent = new CustomEvent('damageDealt', {
                detail: {
                    source: caster,       // The character who dealt the damage
                    target: this,         // The character who received the damage
                    damage: actualDamageTaken, // The actual HP lost
                    type: type,           // 'physical' or 'magical'
                    isCritical: isCritical, // Boolean
                    options: options      // Pass along original options if needed
                }
            });
            console.log(`[Event Dispatch] Firing damageDealt: ${caster.name} -> ${this.name}, Damage: ${actualDamageTaken}`);
            document.dispatchEvent(damageDealtEvent);
        }
        // --- END NEW ---
        
        // Always update UI, even if damage is 0 (e.g., for dodge text)
        updateCharacterUI(this);
        
        // --- NEW: Apply Fire Shield Retaliation (after HP update) ---
        if (retaliationDamage > 0 && caster && !caster.isDead() && didRetaliate) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Fire Shield retaliates against ${caster.name}!`, 'buff-effect');
            // Apply as magical damage, originating from 'this' (the shielded character)
            // Pass isRetaliation: true to prevent infinite loops
            caster.applyDamage(retaliationDamage, 'magical', this, { isRetaliation: true });

            // --- Add Retaliation VFX ---
            const casterElementId = caster.instanceId || caster.id;
            const casterElement = document.getElementById(`character-${casterElementId}`);
            if (casterElement) {
                const retaliateVfx = document.createElement('div');
                retaliateVfx.className = 'fire-shield-retaliate-vfx'; // Needs CSS definition
                casterElement.appendChild(retaliateVfx);
                setTimeout(() => retaliateVfx.remove(), 1000); // Matches damage VFX duration
            }
            // --- End Retaliation VFX ---
        }
        // --- END Retaliation ---
        
        // --- LOGGING BEFORE DEATH PROCESSING ---
        if (this.stats.currentHp <= 0) {
             console.log(`[Character applyDamage] ${this.name} HP reached 0 or below. Current gameState.playerCharacters:`, JSON.stringify(window.gameManager?.gameState?.playerCharacters.map(c => c.id)));
             console.log(`[Character applyDamage] ${this.name} HP reached 0 or below. Current gameState.aiCharacters:`, JSON.stringify(window.gameManager?.gameState?.aiCharacters.map(c => c.id)));
        }
        // --- END LOGGING ---
        
        // --- Passive Hook: onDamageTaken ---
        if (actualDamageTaken > 0 && this.passiveHandler && typeof this.passiveHandler.onDamageTaken === 'function') {
            console.log(`[Passive Debug] Calling onDamageTaken for ${this.name} (Passive: ${this.passive?.id}, Handler: ${this.passiveHandler.constructor.name})`); // Added logging
            // Pass damage details and the attacker (caster)
            const damageInfo = {
                damage: actualDamageTaken,
                type: type,
                isCritical: isCritical,
                rawAmount: amount // Pass the original requested damage amount too
            };
            try {
                 this.passiveHandler.onDamageTaken(this, damageInfo, caster);
            } catch (error) {
                console.error(`Error executing onDamageTaken passive for ${this.name}:`, error);
            }
        } else if (actualDamageTaken > 0) {
            // Added detailed check logging
            console.log(`[Passive Debug] onDamageTaken check failed for ${this.name}. Has passiveHandler: ${!!this.passiveHandler}, Handler type: ${typeof this.passiveHandler}, Has onDamageTaken: ${!!this.passiveHandler?.onDamageTaken}, onDamageTaken type: ${typeof this.passiveHandler?.onDamageTaken}`); 
        }
        // --- END Passive Hook ---

        // Remove Farmer Nina's hiding buff if she takes damage
        if (damage > 0 && this.id === 'farmer_nina') {
            // Find the hiding buff if it exists
            const hidingBuff = this.buffs.find(buff => buff && buff.id === 'farmer_nina_w_hiding_buff');
            if (hidingBuff && !hidingBuff.wasHidingBroken) {
                // Log message
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                log(`${this.name}'s hiding is broken after taking damage!`);
                
                // Mark hiding as broken
                hidingBuff.wasHidingBroken = true;
                
                // Remove the hiding buff
                if (typeof this.removeBuff === 'function') {
                    this.removeBuff(hidingBuff.id);
                } else {
                    // Fallback removal
                    const index = this.buffs.indexOf(hidingBuff);
                    if (index !== -1) {
                        this.buffs.splice(index, 1);
                    }
                }
                
                // Restore opacity immediately
                const charElement = document.getElementById(`character-${this.id}`);
                if (charElement) {
                    charElement.style.opacity = '1';
                    charElement.dataset.isHiding = "false";
                }
                
                // Also clear any hiding flags
                delete this._hidingActive;
                delete this.isUntargetable;
            }
        }
        
        // Play damage animation and VFX
        // Use instanceId if available, otherwise fallback to id
        const elementIdForDamage = this.instanceId || this.id;
        // --- DEBUG --- 
        console.log(`[VFX DEBUG] applyDamage trying to get element for target: ID=${this.id}, InstanceID=${this.instanceId}, ElementIDToFind=character-${elementIdForDamage}`);
        // --- END DEBUG ---
        const damageCharElement = document.getElementById(`character-${elementIdForDamage}`);
        if (damageCharElement) {
            // Add shake animation
            damageCharElement.classList.add('shake-animation');
            
            // Create damage number VFX
            const damageVfx = document.createElement('div');
            damageVfx.className = 'damage-vfx';
            if (isCritical) {
                damageVfx.classList.add('critical');
                // Play sound if the character being hit is Schoolgirl Ayane
                if (this.id === 'schoolgirl_ayane') {
                    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSound('sounds/ayane_ohshit.mp3');
                }
            }
            // --- DEBUG: Log damage value just before setting textContent ---
            console.log(`[VFX Debug - ${this.name}] Setting damage VFX text. Damage value: ${actualDamageTaken}, isCritical: ${isCritical}`);
            // --- END DEBUG ---
            damageVfx.textContent = `-${Math.round(actualDamageTaken)}`;
            damageCharElement.appendChild(damageVfx);
            
            // Add blood splatter VFX for physical damage
            if (type === 'physical') {
                const bloodVfx = document.createElement('div');
                bloodVfx.className = 'blood-vfx';
                damageCharElement.appendChild(bloodVfx);
            }
            
            // Add magical effect for magical damage
            if (type === 'magical') {
                const magicVfx = document.createElement('div');
                magicVfx.className = 'magic-vfx';
                damageCharElement.appendChild(magicVfx);
            }
            
            // Remove the animation classes and VFX elements after animation completes
            setTimeout(() => {
                damageCharElement.classList.remove('shake-animation');
                // Remove lifesteal classes from this querySelectorAll
                const vfxElements = damageCharElement.querySelectorAll('.damage-vfx, .blood-vfx, .magic-vfx'); 
                vfxElements.forEach(el => el.remove());
            }, 1000);
        }
        
        // Play sound if Schoolgirl Elphelt takes 500+ damage
        if (this.id === 'schoolgirl_elphelt' && damage >= 500) {
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/elphelt_help.mp3');
        }
        
        // Check for Elphelt crit sound condition *here*
        console.log(`[APPLY_DAMAGE_DEBUG] Caster: ${caster ? caster.id : 'NULL/UNDEFINED'}, isCritical: ${isCritical}`); // More specific debug
        if (caster && isCritical && caster.id === 'schoolgirl_elphelt') {
            console.log(`[SOUND DEBUG] Elphelt crit detected inside applyDamage! Playing sound.`);
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/elphelt_go.mp3');
        }
        
        // --- NEW: Trigger Caster's Chain Reaction Passive (if applicable) --- 
        if (caster && caster.passive && caster.passive.id === 'infernal_chain_reaction' && !isChainReaction) {
            // Check if the global passive function exists (based on the ID/convention)
            if (typeof window.infernalScorpionChainReactionPassive === 'function') {
                // Pass necessary info to the passive function
                const damageResultForPassive = {
                    damage: actualDamageTaken, // Use actual HP lost 
                    type: type, // Original damage type
                    isCritical: isCritical // Original crit status
                };
                // Call the global passive function directly
                // 'this' refers to the target receiving the damage
                // Pass options, including isChainReaction flag
                window.infernalScorpionChainReactionPassive(caster, this, null, damageResultForPassive, { isChainReaction: true });
            } else {
                console.warn(`Global passive function 'infernalScorpionChainReactionPassive' not found for passive ${caster.passive.id}. Ensure the script (${caster.passive.script}) is loaded correctly.`);
            }
        }
        // --- END NEW ---

        // Check if character is dead
        if (this.isDead()) {
            // Play death animation, sound, remove character, etc.
            // Use instanceId if available, otherwise fallback to id
            const elementIdForDeath = this.instanceId || this.id;
            // --- DEBUG ---
            console.log(`[DEATH DEBUG] applyDamage trying to get element for dying target: ID=${this.id}, InstanceID=${this.instanceId}, ElementIDToFind=character-${elementIdForDeath}`);
            // --- END DEBUG ---
            const deadCharElement = document.getElementById(`character-${elementIdForDeath}`);
            if (deadCharElement) {
                deadCharElement.classList.add('death-animation');
                deadCharElement.classList.add('character-dead'); // Add class for greyed-out state
                // Optional: Play death sound
                // Remove element after animation - REMOVED
                // setTimeout(() => {
                //     deadCharElement.remove();
                // }, 1000);
            }

            // Remove character from the game state in GameManager (handle this there)
            if (window.gameManager) {
                window.gameManager.handleCharacterDeath(this);
            }
        }
        
        // <<< NEW: Handle Pain into Power Talent (Farmer Nina) >>>
        if (this.id === 'farmer_nina' && this.enablePainIntoPower && actualDamageTaken > 0) {
            const critBonusPerHit = 0.02; // <-- MODIFIED: Reduced from 0.05 to 0.02
            this.critDamageFromTakingDamageBonus += critBonusPerHit;
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Pain into Power activates! +${critBonusPerHit * 100}% Crit Damage gained. Total bonus: ${(this.critDamageFromTakingDamageBonus * 100).toFixed(1)}%`, 'talent-effect');
            // Recalculate stats to apply the new crit damage immediately
            this.recalculateStats('pain_into_power_triggered'); 
            
            // Optional: Show a small VFX
            if (window.gameManager?.showFloatingText) {
                window.gameManager.showFloatingText(`character-${this.instanceId || this.id}`, `+${critBonusPerHit * 100}% Crit Dmg`, 'buff');
            }
        }
        // <<< END NEW >>>
        
        // After damage is calculated and applied
        if (actualDamageTaken > 0 && caster) {
            // Log the event dispatch for debugging
            console.log(`[Event Dispatch] Firing character:damage-dealt event: ${caster.name} -> ${this.name}, Damage: ${actualDamageTaken}, Type: ${type}, Critical: ${isCritical}`);
            
            // Dispatch a damage-dealt event for talents like Water Dance
            document.dispatchEvent(new CustomEvent('character:damage-dealt', {
                detail: {
                    character: caster,
                    target: this,
                    damage: actualDamageTaken,
                    damageType: type,
                    isCritical: isCritical,
                    options: options
                }
            }));
            
            // Also fire the legacy event for backward compatibility
            if (typeof CustomEvent === 'function') {
                const damageEvent = new CustomEvent('damageDealt', {
                    detail: {
                        source: caster,
                        target: this,
                        amount: actualDamageTaken,
                        type: type,
                        isCritical: isCritical
                    }
                });
                
                console.log(`[Event Dispatch] Firing legacy damageDealt event`);
                document.dispatchEvent(damageEvent);
            }
        }
        
        // --- NEW: Stun removal mechanic (70% chance when taking damage) ---
        if (actualDamageTaken > 0 && this.isStunned()) {
            // 70% chance that damage removes stun
            if (Math.random() < 0.7) {
                // Find all stun debuffs
                const stunDebuffs = this.debuffs.filter(debuff => 
                    (debuff.id && debuff.id === 'stun') || 
                    (debuff.id && debuff.id.includes('stun')) ||
                    (debuff.effects && debuff.effects.cantAct === true) ||
                    (debuff.name && debuff.name.toLowerCase().includes('stun'))
                );
                
                if (stunDebuffs.length > 0) {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    
                    // Remove all stun debuffs
                    stunDebuffs.forEach(stunDebuff => {
                        this.removeDebuff(stunDebuff.id);
                        log(`${this.name} breaks free from ${stunDebuff.name || 'Stun'} after taking damage!`, 'buff-effect');
                    });
                    
                    // Show visual effect for breaking stun
                    const elementId = this.instanceId || this.id;
                    const charElement = document.getElementById(`character-${elementId}`);
                    if (charElement) {
                        const breakFreeVfx = document.createElement('div');
                        breakFreeVfx.className = 'stun-break-vfx';
                        breakFreeVfx.innerHTML = `
                            <div class="stun-break-text">BREAK FREE!</div>
                            <div class="stun-break-particles"></div>
                        `;
                        charElement.appendChild(breakFreeVfx);
                        
                        // Add particle effects
                        for (let i = 0; i < 8; i++) {
                            const particle = document.createElement('div');
                            particle.className = 'stun-break-particle';
                            particle.style.setProperty('--angle', `${i * 45}deg`);
                            particle.style.setProperty('--delay', `${i * 0.05}s`);
                            breakFreeVfx.appendChild(particle);
                        }
                        
                        // Remove VFX after animation
                        setTimeout(() => {
                            if (breakFreeVfx.parentNode === charElement) {
                                charElement.removeChild(breakFreeVfx);
                            }
                        }, 2000);
                    }
                    
                    // Update UI to reflect stun removal
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(this);
                    }
                }
            }
        }
        // --- END stun removal mechanic ---

        return { damage: actualDamageTaken, isCritical: isCritical, dodged: false }; // Return actual damage dealt
    }

    // Calculate the final damage after applying modifiers
    calculateDamage(baseDamage, type, target = null) {
        let finalDamage = baseDamage;

        // Apply buffs/debuffs that modify outgoing damage (if any)
        // Example: buffs could increase finalDamage, debuffs could decrease it
        // Note: This logic should be implemented based on specific buff/debuff effects.

        // --- NEW: Check for outgoing damage reduction from debuffs ---
        if (this.debuffs && this.debuffs.length > 0) {
            for (const debuff of this.debuffs) {
                if (debuff.effects && typeof debuff.effects.damageReductionPercent === 'number') {
                    const reductionPercent = debuff.effects.damageReductionPercent;
                    const originalDamage = finalDamage;
                    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - reductionPercent)));
                    
                    console.log(`[Outgoing Damage Reduction] ${this.name} has debuff ${debuff.name || debuff.id} reducing outgoing damage by ${reductionPercent * 100}% - ${originalDamage} → ${finalDamage}`);
                    
                    // Add log entry
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(`${this.name}'s ${debuff.name || 'debuff'} reduces outgoing damage by ${Math.round(reductionPercent * 100)}%!`, 'debuff-effect');
                    }
                }
            }
        }
        // --- END NEW ---

        // --- NEW: Apply Debuff Exploitation talent (damage increase per debuff) ---
        if (this.damagePerDebuff && this.damagePerDebuff > 0 && target) {
            if (target.debuffs && target.debuffs.length > 0) {
                const debuffCount = target.debuffs.length;
                const damageIncrease = this.damagePerDebuff * debuffCount;
                const originalDamage = finalDamage;
                
                // Apply percentage increase for each debuff
                finalDamage = Math.floor(finalDamage * (1 + damageIncrease));
                
                // Log the damage increase
                console.log(`[Debuff Exploitation] ${this.name} dealing ${Math.round(damageIncrease * 100)}% bonus damage (${debuffCount} debuffs) - ${originalDamage} → ${finalDamage}`);
                
                // Show VFX for Debuff Exploitation
                if (window.showDebuffExploitationVFX && typeof window.showDebuffExploitationVFX === 'function') {
                    window.showDebuffExploitationVFX(this, target, debuffCount, damageIncrease);
                }
                else if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
                    const elementId = this.instanceId || this.id;
                    window.gameManager.showFloatingText(`character-${elementId}`, `+${Math.round(damageIncrease * 100)}% DMG (${debuffCount} debuffs)`, 'buff');
                }
                
                // Add log entry
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${this.name}'s Debuff Exploitation increases damage by ${Math.round(damageIncrease * 100)}% (${debuffCount} debuffs on target)!`, 'talent-effect');
                }
            }
        }
        // --- END NEW ---

        // --- NEW: Apply Stage Modifiers --- 
        if (this.stageModifiers) {
            const multiplier = this.stageModifiers.damageMultiplier || 0;
            const reduction = this.stageModifiers.damageReduction || 0;

            // Apply multiplier first, then reduction
            finalDamage = finalDamage * (1 + multiplier);
            finalDamage = finalDamage * (1 - reduction);
        }
        // --- END NEW ---
        
        // Ensure damage is at least 1 (or 0 if desired)
        finalDamage = Math.max(1, Math.floor(finalDamage)); 

        // Return the final calculated damage
        return finalDamage;
    }

    // --- MODIFIED: Added options parameter and caster parameter ---
    heal(amount, caster = null, options = {}) {
    // --- END MODIFICATION ---
        let baseHealAmount = amount;
        let isCritical = false;

        // --- NEW: Apply Enhanced Recovery talent effect ---
        if (this.healingReceivedMultiplier && this.healingReceivedMultiplier !== 1.0) {
            const originalAmount = baseHealAmount;
            baseHealAmount = Math.floor(baseHealAmount * this.healingReceivedMultiplier);
            console.log(`[Heal] ${this.name} has Enhanced Recovery: ${originalAmount} → ${baseHealAmount} (x${this.healingReceivedMultiplier})`);
            
            // Show visual effect for Enhanced Recovery talent
            if (window.showEnhancedRecoveryVFX && typeof window.showEnhancedRecoveryVFX === 'function') {
                window.showEnhancedRecoveryVFX(this, originalAmount, baseHealAmount);
            }
            
            // Add log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${this.name}'s Enhanced Recovery increases healing by ${Math.round(baseHealAmount - originalAmount)}.`, 'talent-effect');
            }
        }
        // --- END NEW ---

        // --- NEW: Check for Critical Heal ---
        if (caster && caster.stats && Math.random() < (caster.stats.critChance || 0)) {
            let critDamageMultiplier = caster.stats.critDamage || 1.5; // Use critDamage for heals too?
            // Ensure multiplier is valid
            if (typeof critDamageMultiplier !== 'number' || isNaN(critDamageMultiplier)) {
                console.warn(`[Crit Heal Debug - ${caster.name}] Invalid critDamageMultiplier (${critDamageMultiplier}), defaulting to 1.5`);
                critDamageMultiplier = 1.5;
            }
            baseHealAmount = Math.floor(baseHealAmount * critDamageMultiplier);
            isCritical = true;
            console.log(`[Crit Heal Debug - ${caster.name}] Critical Heal! Multiplier: ${critDamageMultiplier}, Base Amount: ${baseHealAmount}`);
            
            // --- DISPATCH CRITICAL HEAL EVENT ---
            const critHealEvent = new CustomEvent('criticalHeal', {
                detail: {
                    source: caster, // The character who performed the heal
                    target: this,   // The character receiving the heal
                    healAmount: baseHealAmount, // The crit-modified heal amount
                    isCritical: true
                }
            });
            console.log(`%c[Critical Heal Event] About to dispatch event from ${caster.name} healing ${this.name}`, 'color: magenta; font-weight: bold;', critHealEvent);
            document.dispatchEvent(critHealEvent);
            console.log(`%c[Critical Heal Event] Event dispatched!`, 'color: magenta; font-weight: bold;');
            // --- END DISPATCH ---
        }
        // --- END NEW ---

        // --- MODIFIED: Use caster's healingPower ---
        const casterHealingPower = (caster && caster.stats && typeof caster.stats.healingPower === 'number') ? caster.stats.healingPower : 0;
        const finalHealAmount = Math.floor(baseHealAmount * (1 + casterHealingPower));
        // --- END MODIFICATION ---

        let actualHealAmount;
        if (options.allowOverheal) {
            actualHealAmount = finalHealAmount;
        } else {
            actualHealAmount = Math.min(this.stats.maxHp - this.stats.currentHp, finalHealAmount);
        }
        this.stats.currentHp += actualHealAmount;

        // Trigger HP animation for healing
        if (actualHealAmount > 0 && window.gameManager && window.gameManager.uiManager) {
            this._lastHealWasCritical = isCritical;
            window.gameManager.uiManager.triggerHPAnimation(this, 'healing', actualHealAmount, isCritical);
        }

        // Hook for passive handlers on receiving heal
        if (actualHealAmount > 0 && this.passiveHandler && typeof this.passiveHandler.onHealReceived === 'function') {
            this.passiveHandler.onHealReceived(this, actualHealAmount, isCritical); // Pass isCritical flag
        }

        // --- STATISTICS TRACKING: Record healing done ---
        if (window.statisticsManager && actualHealAmount > 0) {
            const healType = options.healType || 'direct';
            window.statisticsManager.recordHealingDone(caster, this, actualHealAmount, isCritical, options.abilityId, healType);
        }
        // --- END STATISTICS TRACKING ---

        // --- NEW: Infernal Birdie Drink Up! Cooldown Reduction ---
        if (actualHealAmount > 0 && this.id === 'infernal_birdie') {
            const drinkUpAbility = this.abilities.find(ability => ability.id === 'infernal_birdie_drink_up');
            if (drinkUpAbility) {
                // reduceCooldown internally checks if currentCooldown > 0 and logs
                drinkUpAbility.reduceCooldown(); 
            }
        }
        // --- END NEW ---
        
        // --- MODIFIED: Check options before playing VFX and add critical class --- 
        if (!options.suppressDefaultVFX) {
            // Play healing VFX
            // Use instanceId if available, otherwise fallback to id
            const elementId = this.instanceId || this.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                // Removed heal-animation class
                
                // Create healing number VFX
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx';
                if (isCritical) {
                    healVfx.classList.add('critical');
                    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    logFunction(`${caster.name} critically heals ${this.name}!`, 'critical-heal'); // Add specific log class
                }
                healVfx.textContent = `+${Math.round(actualHealAmount)}`;
                charElement.appendChild(healVfx);
                
                // Add healing particles
                const healParticles = document.createElement('div');
                healParticles.className = 'heal-particles';
                if (isCritical) {
                    healParticles.classList.add('critical');
                }
                charElement.appendChild(healParticles);
                
                // Remove the VFX elements after animation completes
                setTimeout(() => {
                    // Removed heal-animation class removal
                    const vfxElements = charElement.querySelectorAll('.heal-vfx, .heal-particles');
                    vfxElements.forEach(el => el.remove());
                }, 1500); // Slightly longer duration for crits?
            }
        }
        // --- END MODIFICATION ---
        
        // --- NEW: Check for Healing Fire stage modifier ---
        if (actualHealAmount > 0) {
            // Check if target has healing fire modifier
            const targetIsPlayer = window.gameManager && 
                window.gameManager.gameState && 
                window.gameManager.gameState.playerCharacters && 
                window.gameManager.gameState.playerCharacters.includes(this);
                
            if (targetIsPlayer && this.stageModifiers && this.stageModifiers.healingFire) {
                const targetFireDamage = Math.floor(actualHealAmount * 0.22); // 22% of heal as fire damage
                
                if (targetFireDamage > 0) {
                    // Apply fire damage to target after the heal
                    setTimeout(() => {
                        this.applyDamage(targetFireDamage, 'fire', null, { 
                            isStageEffect: true,
                            stageModifierName: 'Healing Fire' 
                        });
                        
                        // Add log entry for target
                        if (window.gameManager && window.gameManager.addLogEntry) {
                            window.gameManager.addLogEntry(
                                `🔥💚 ${this.name}'s healing is corrupted by infernal flames, taking ${targetFireDamage} fire damage!`, 
                                'stage-effect healing-fire'
                            );
                        }
                        
                        // Create healing fire damage VFX for target
                        if (window.stageModifiersRegistry && window.stageModifiersRegistry.createHealingFireDamageVFX) {
                            window.stageModifiersRegistry.createHealingFireDamageVFX(this, targetFireDamage);
                        }
                        
                        // Update UI after damage
                        updateCharacterUI(this);
                    }, 800); // Delay the damage slightly after the heal VFX
                }
            }
            
            // Check if caster has healing fire modifier (burns the healer too)
            if (caster) {
                const casterIsPlayer = window.gameManager && 
                    window.gameManager.gameState && 
                    window.gameManager.gameState.playerCharacters && 
                    window.gameManager.gameState.playerCharacters.includes(caster);
                    
                if (casterIsPlayer && caster.stageModifiers && caster.stageModifiers.healingFire) {
                    const casterFireDamage = Math.floor(actualHealAmount * 0.22); // 22% of heal as fire damage
                    
                    if (casterFireDamage > 0) {
                        // Apply fire damage to caster after the heal
                        setTimeout(() => {
                            caster.applyDamage(casterFireDamage, 'fire', null, { 
                                isStageEffect: true,
                                stageModifierName: 'Healing Fire' 
                            });
                            
                            // Add log entry for caster
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `🔥💚 ${caster.name} is burned by the corrupted healing energy for ${casterFireDamage} fire damage!`, 
                                    'stage-effect healing-fire'
                                );
                            }
                            
                            // Create healing fire damage VFX for caster
                            if (window.stageModifiersRegistry && window.stageModifiersRegistry.createHealingFireDamageVFX) {
                                window.stageModifiersRegistry.createHealingFireDamageVFX(caster, casterFireDamage);
                            }
                            
                            // Update UI after damage
                            updateCharacterUI(caster);
                        }, 1000); // Delay caster damage slightly more than target damage
                    }
                }
            }
        }
        // --- END NEW ---
        
        updateCharacterUI(this); // Add UI update call here
        
        return { healAmount: Math.floor(actualHealAmount), isCritical: isCritical }; // Return object
    }

    applyLifesteal(damage) {
        if (!this.stats.lifesteal || this.stats.lifesteal <= 0 || damage <= 0) {
            return 0;
        }

        const healAmount = Math.floor(damage * this.stats.lifesteal);
        this.heal(healAmount, this, { healType: 'lifesteal' });
        
        // Return the heal amount for VFX and logging
        return healAmount;
    }

    regenerateResources() {
        // Standard HP/Mana regen from base stats
        const baseHpRegen = this.stats.hpPerTurn || 0;
        const baseManaRegen = this.stats.manaPerTurn || 0;
        
        this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + baseHpRegen);
        this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + baseManaRegen);

        // --- Handle Stage Modifier Healing (Turn Start Healing) ---
        if (this.stageModifiers && this.stageModifiers.turnStartHealing) {
            const healPercent = this.stageModifiers.turnStartHealing;
            const healAmount = Math.floor(this.stats.maxHp * healPercent);
            
            if (healAmount > 0) {
                const oldHp = this.stats.currentHp;
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
                const actualHealed = this.stats.currentHp - oldHp;
                
                if (actualHealed > 0) {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`${this.name} is healed for ${actualHealed} HP by the Healing Farm Wind.`, 'stage-effect wind-heal');
                    
                    // Show healing VFX
                    this.showWindHealVFX(actualHealed);
                }
            }
        }

        // --- Handle Fixed Stage Modifier Healing ---
        if (this.stageModifiers && this.stageModifiers.turnStartHealingFixed) {
            const healAmount = this.stageModifiers.turnStartHealingFixed;
            
            if (healAmount > 0) {
                const oldHp = this.stats.currentHp;
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
                const actualHealed = this.stats.currentHp - oldHp;
                
                if (actualHealed > 0) {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`${this.name} is healed for ${actualHealed} HP by the heavy rain!`, 'stage-effect rain-heal');
                    
                    // Show heavy rain healing VFX
                    this.showHeavyRainHealVFX(actualHealed);
                }
            }
        }

        // --- NEW: Handle Natural Regeneration talent --- 
        const hpRegenPercent = this.hpRegenPercent || 0; // Get property set by talent
        const manaRegenPercent = this.manaRegenPercent || 0; // Get property set by talent
        let talentRegenLog = '';
        let regeneratedHpFromTalent = 0;
        let regeneratedManaFromTalent = 0;

        if (hpRegenPercent > 0) {
            const hpToRegen = Math.floor(this.stats.maxHp * hpRegenPercent);
            if (hpToRegen > 0) {
                const oldHp = this.stats.currentHp;
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + hpToRegen);
                regeneratedHpFromTalent = this.stats.currentHp - oldHp;
                if (regeneratedHpFromTalent > 0) {
                    talentRegenLog += ` ${regeneratedHpFromTalent} HP`;
                    // Add simple VFX for HP regen
                    // this.showRegenVFX(regeneratedHpFromTalent, 'hp');
                }
            }
        }

        if (manaRegenPercent > 0) {
            const manaToRegen = Math.floor(this.stats.maxMana * manaRegenPercent);
            if (manaToRegen > 0) {
                const oldMana = this.stats.currentMana;
                this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + manaToRegen);
                regeneratedManaFromTalent = this.stats.currentMana - oldMana;
                if (regeneratedManaFromTalent > 0) {
                    talentRegenLog += `${talentRegenLog ? ' and' : ''} ${regeneratedManaFromTalent} Mana`;
                    // Add simple VFX for Mana regen
                    // this.showRegenVFX(regeneratedManaFromTalent, 'mana');
                }
            }
        }

        if (talentRegenLog) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} regenerates${talentRegenLog} from Natural Regeneration.`, 'talent-effect');
        }
        // --- END NEW --- 

        // Apply Atlantean Kagome passive: heals HP equal to missing mana
        if (this.id === 'atlantean_kagome' && this.passive && this.passive.id === 'atlantean_kagome_passive') {
            const missingMana = this.stats.maxMana - this.stats.currentMana;
            if (missingMana > 0) {
                // Calculate heal amount with healing power modifier
                const healAmount = missingMana * (1 + this.stats.healingPower);
                
                // Apply the healing
                const previousHp = this.stats.currentHp;
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
                const actualHealAmount = this.stats.currentHp - previousHp;
                
                // Log the passive effect
                const logFunction = window.gameManager ? 
                    window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                logFunction(`${this.name}'s Atlantean Blessing healed for ${Math.round(actualHealAmount)} HP from missing mana!`);
                
                // Add a visual effect for healing from missing mana
                const charElement = document.getElementById(`character-${this.id}`);
                if (charElement) {
                    // Create healing VFX
                    const healVfx = document.createElement('div');
                    healVfx.className = 'heal-vfx';
                    healVfx.textContent = `+${Math.round(actualHealAmount)} HP`;
                    charElement.appendChild(healVfx);
                    
                    // Removed glow effect
                    
                    // Create heal particles
                    const healParticles = document.createElement('div');
                    healParticles.className = 'heal-particles';
                    charElement.appendChild(healParticles);
                    
                    // Remove the VFX elements after animation completes
                    setTimeout(() => {
                        // Removed heal-animation class removal
                        const vfxElements = charElement.querySelectorAll('.heal-vfx, .heal-particles');
                        vfxElements.forEach(el => el.remove());
                    }, 1000);
                }
            }
        }
        
        // Normal mana regeneration for all characters
        this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + this.stats.manaPerTurn);
        
        updateCharacterUI(this);
    }

    // Show wind healing VFX
    showWindHealVFX(healAmount) {
        // Use instanceId first, fallback to id for element lookup
        const elementId = this.instanceId || this.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            // Create enhanced wind healing VFX container
            const windHealContainer = document.createElement('div');
            windHealContainer.className = 'wind-heal-vfx-container';
            charElement.appendChild(windHealContainer);
            
            // Create main healing number with wind styling
            const windHealVfx = document.createElement('div');
            windHealVfx.className = 'wind-heal-vfx healing-wind-number';
            windHealVfx.textContent = `+${healAmount} HP`;
            windHealContainer.appendChild(windHealVfx);
            
            // Create glowing aura around character
            const healingAura = document.createElement('div');
            healingAura.className = 'wind-healing-aura';
            windHealContainer.appendChild(healingAura);
            
            // Create multiple leaf particles that blow across
            for (let i = 0; i < 8; i++) {
                const leaf = document.createElement('div');
                leaf.className = 'wind-healing-leaf';
                leaf.style.left = `${Math.random() * 120 - 10}%`;
                leaf.style.top = `${Math.random() * 120 - 10}%`;
                leaf.style.animationDelay = `${Math.random() * 1}s`;
                leaf.style.animationDuration = `${2 + Math.random() * 1}s`;
                windHealContainer.appendChild(leaf);
            }
            
            // Create sparkle effects
            for (let i = 0; i < 12; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'wind-healing-sparkle';
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.top = `${Math.random() * 100}%`;
                sparkle.style.animationDelay = `${Math.random() * 2}s`;
                windHealContainer.appendChild(sparkle);
            }
            
            // Create floating heal particles with wind effect
            const windParticles = document.createElement('div');
            windParticles.className = 'wind-heal-particles';
            windHealContainer.appendChild(windParticles);
            
            // Create wind ripple effect
            const windRipple = document.createElement('div');
            windRipple.className = 'wind-healing-ripple';
            windHealContainer.appendChild(windRipple);
            
            // Create additional wind effect particles around the character
            for (let i = 0; i < 10; i++) {
                const windParticle = document.createElement('div');
                windParticle.className = 'wind-heal-mini-particle';
                windParticle.style.left = `${Math.random() * 100}%`;
                windParticle.style.top = `${Math.random() * 100}%`;
                windParticle.style.animationDelay = `${Math.random() * 0.8}s`;
                windHealContainer.appendChild(windParticle);
            }
            
            // Create gentle wind swirl effect
            const windSwirl = document.createElement('div');
            windSwirl.className = 'wind-heal-swirl';
            windHealContainer.appendChild(windSwirl);
            
            // Create wind trail effect
            const windTrail = document.createElement('div');
            windTrail.className = 'wind-healing-trail';
            windHealContainer.appendChild(windTrail);
            
            // Enhance with healing wind VFX if available
            if (window.gameManager && window.gameManager.stageManager && window.gameManager.stageManager.healingWindVFX) {
                window.gameManager.stageManager.healingWindVFX.enhanceHealingNumber(windHealVfx);
            }
            
            // Play healing wind sound if available
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                window.gameManager.playSound('sounds/wind_heal.mp3', 0.4);
            }
            
            // Remove the VFX elements after animation completes
            setTimeout(() => {
                if (windHealContainer && windHealContainer.parentNode) {
                    windHealContainer.parentNode.removeChild(windHealContainer);
                }
            }, 3000);
        }
    }

    // Show heavy rain healing VFX for "It's raining man!" modifier
    showHeavyRainHealVFX(healAmount) {
        // Use instanceId first, fallback to id for element lookup
        const elementId = this.instanceId || this.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            // Create heavy rain healing VFX container
            const rainHealContainer = document.createElement('div');
            rainHealContainer.className = 'heavy-rain-heal-vfx-container';
            charElement.appendChild(rainHealContainer);
            
            // Create main healing number with rain styling
            const rainHealVfx = document.createElement('div');
            rainHealVfx.className = 'heavy-rain-heal-vfx rain-healing-number';
            rainHealVfx.textContent = `+${healAmount} HP`;
            rainHealContainer.appendChild(rainHealVfx);
            
            // Create electric-blue aura around character
            const healingAura = document.createElement('div');
            healingAura.className = 'rain-healing-aura';
            rainHealContainer.appendChild(healingAura);
            
            // Create multiple rain droplets that fall around character
            for (let i = 0; i < 12; i++) {
                const droplet = document.createElement('div');
                droplet.className = 'rain-healing-droplet';
                droplet.style.left = `${Math.random() * 120 - 10}%`;
                droplet.style.top = `${Math.random() * 50 - 10}%`;
                droplet.style.animationDelay = `${Math.random() * 0.8}s`;
                droplet.style.animationDuration = `${1 + Math.random() * 0.5}s`;
                rainHealContainer.appendChild(droplet);
            }
            
            // Create lightning flash effects
            for (let i = 0; i < 3; i++) {
                const lightning = document.createElement('div');
                lightning.className = 'rain-healing-lightning';
                lightning.style.left = `${Math.random() * 100}%`;
                lightning.style.top = `${Math.random() * 100}%`;
                lightning.style.animationDelay = `${Math.random() * 1.5}s`;
                rainHealContainer.appendChild(lightning);
            }
            
            // Create floating heal particles with electric effect
            const rainParticles = document.createElement('div');
            rainParticles.className = 'rain-heal-particles';
            rainHealContainer.appendChild(rainParticles);
            
            // Create storm ripple effect
            const stormRipple = document.createElement('div');
            stormRipple.className = 'rain-healing-ripple';
            rainHealContainer.appendChild(stormRipple);
            
            // Create additional storm effect particles around the character
            for (let i = 0; i < 8; i++) {
                const stormParticle = document.createElement('div');
                stormParticle.className = 'rain-heal-storm-particle';
                stormParticle.style.left = `${Math.random() * 100}%`;
                stormParticle.style.top = `${Math.random() * 100}%`;
                stormParticle.style.animationDelay = `${Math.random() * 1}s`;
                rainHealContainer.appendChild(stormParticle);
            }
            
            // Create electric swirl effect
            const electricSwirl = document.createElement('div');
            electricSwirl.className = 'rain-heal-electric-swirl';
            rainHealContainer.appendChild(electricSwirl);
            
            // Play generated rain healing sound
            this.generateRainHealSound();
            
            // Remove the VFX elements after animation completes
            setTimeout(() => {
                if (rainHealContainer && rainHealContainer.parentNode) {
                    rainHealContainer.parentNode.removeChild(rainHealContainer);
                }
            }, 2500);
        }
    }

    // Generate gentle rain healing sound using Web Audio API
    generateRainHealSound() {
        try {
            // Create audio context if it doesn't exist
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 1.5; // 1.5 seconds
            
            // Create main gain node for volume control
            const mainGain = audioContext.createGain();
            mainGain.connect(audioContext.destination);
            mainGain.gain.setValueAtTime(0.3, audioContext.currentTime);

            // Generate gentle rain droplet sounds
            this.createRainDropletSounds(audioContext, mainGain, 0, duration);
            
            // Generate soft healing chime
            this.createHealingChime(audioContext, mainGain, 0.2);

        } catch (error) {
            console.warn('[Character] Could not generate rain heal sound:', error);
        }
    }

    // Create gentle rain droplet sounds
    createRainDropletSounds(audioContext, destination, delay, duration) {
        const dropletCount = 8 + Math.random() * 4; // 8-12 droplets
        
        for (let i = 0; i < dropletCount; i++) {
            const dropDelay = delay + Math.random() * duration * 0.8;
            
            // Create a short burst of filtered noise for each droplet
            const bufferSize = audioContext.sampleRate * 0.1; // 0.1 seconds per droplet
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate soft white noise
            for (let j = 0; j < bufferSize; j++) {
                data[j] = (Math.random() * 2 - 1) * 0.3 * Math.pow(1 - j / bufferSize, 1.5);
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            // Band-pass filter for water droplet sound
            const bandPass = audioContext.createBiquadFilter();
            bandPass.type = 'bandpass';
            bandPass.frequency.setValueAtTime(1200 + Math.random() * 800, audioContext.currentTime);
            bandPass.Q.setValueAtTime(3, audioContext.currentTime);

            // Envelope for droplet
            const gain = audioContext.createGain();
            const startTime = audioContext.currentTime + dropDelay;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

            source.connect(bandPass);
            bandPass.connect(gain);
            gain.connect(destination);

            source.start(startTime);
            source.stop(startTime + 0.1);
        }
    }

    // Create soft healing chime sound
    createHealingChime(audioContext, destination, delay) {
        // Create a pleasant healing tone using oscillators
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

            // Gentle envelope for healing chime
            const gain = audioContext.createGain();
            const startTime = audioContext.currentTime + delay + (index * 0.1);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

            // Add slight reverb effect with delay
            const delayNode = audioContext.createDelay();
            delayNode.delayTime.setValueAtTime(0.1, audioContext.currentTime);
            const delayGain = audioContext.createGain();
            delayGain.gain.setValueAtTime(0.2, audioContext.currentTime);

            oscillator.connect(gain);
            gain.connect(destination);
            
            // Connect delay line for reverb
            gain.connect(delayNode);
            delayNode.connect(delayGain);
            delayGain.connect(destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.8);
        });
    }

    addBuff(buff) {
        // Debug logging for buff name
        const buffName = buff.name || buff.id || 'unknown buff';
        console.log(`[AddBuff Debug] Adding ${buffName} to ${this.name}`);

        if (buff && buff.id === 'lunar_empowerment_buff') {
            console.log(`[Character.js DEBUG] addBuff: Adding lunar_empowerment_buff. Current character buffs:`, JSON.stringify(this.buffs.map(b => b.id)));
            console.log(`[Character.js DEBUG] lunar_empowerment_buff object being added:`, JSON.stringify(buff));
        }

        // <<< NEW: Specific log for Low Tide Power >>>
        if (buff && buff.id === 'low_tide_power_buff') {
            console.log(`%c[DEBUG-LOWTIDE] addBuff called for Low Tide Power buff on ${this.name}`, 'color: blue; font-weight: bold;');
        }
        // <<< END NEW >>>

        // --- NEW: Apply Lasting Protection talent effect ---
        if (this.buffDurationBonus && this.buffDurationBonus > 0 && buff.duration) {
            const originalDuration = buff.duration;
            buff.duration += this.buffDurationBonus;
            console.log(`[AddBuff] ${this.name} has Lasting Protection: ${buffName} duration ${originalDuration} → ${buff.duration} (+${this.buffDurationBonus} turns)`);
            
            // Show visual effect for Lasting Protection talent
            if (window.showLastingProtectionVFX && typeof window.showLastingProtectionVFX === 'function') {
                window.showLastingProtectionVFX(this, buffName, originalDuration, buff.duration);
            }
            
            // Add log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${this.name}'s Lasting Protection extends ${buffName} by ${this.buffDurationBonus} turns.`, 'talent-effect');
            }
        }
        // --- END NEW ---

        // ---- THUNDER PERCEPTION TALENT HOOK ----
        // Check for Thunder Perception talent (added directly in Character class for reliability)
        if (this.critOnBuff === true && buff) {
            const isThunderPerceptionBuff = buff.id && buff.id.startsWith('thunder_perception_crit_');
            if (!isThunderPerceptionBuff) {
                console.log(`[Character.addBuff] ${this.name} has critOnBuff talent and is receiving non-TP buff: ${buffName}`);
                this._shouldApplyThunderPerception = true;
                this._triggeringBuff = buff;
            } else {
                console.log(`[Character.addBuff] Skipping Thunder Perception check for TP buff`);
            }
        }
        // ---- END THUNDER PERCEPTION TALENT HOOK ----

        // ... (Original addBuff logic: Find existing, add new buff, apply onApply, recalculate stats) ...
        // --- NOTE: Make sure this part adds the *original* buff to this.buffs and calls recalculateStats --- 
        const existingBuff = this.buffs.find(b => b.id === buff.id);
        let buffAppliedSuccessfully = false;
        
        if (existingBuff) {
            // ... (handle existing buff: stacks, duration refresh) ...
            this.recalculateStats('addBuff-refresh'); // Recalculate after refreshing existing
            buffAppliedSuccessfully = true;
        } else {
            // ... (handle adding new buff: clone, push to this.buffs, apply onApply) ...
            if (buff.onApply && typeof buff.onApply === 'function') {
                const onApplyResult = buff.onApply(this);
                if (onApplyResult === false) {
                    console.log(`onApply for buff ${buffName} returned false, buff not applied`);
                    // If onApply fails, don't add the buff and don't trigger TP
                    this._shouldApplyThunderPerception = false; 
                    return false; 
                }
            }
            this.buffs.push(buff); // Add the processed original buff
            console.log(`Added buff: ${buffName} to ${this.name}`);
            this.recalculateStats('addBuff-new'); // Recalculate after adding new
            buffAppliedSuccessfully = true;
        }
        // --- END Original addBuff logic --- 

        // ---- APPLY THUNDER PERCEPTION AFTER ORIGINAL BUFF IS ADDED ----
        if (this._shouldApplyThunderPerception && this.critOnBuff === true) {
            console.log(`[Character.addBuff] Applying Thunder Perception buff for ${this.name} after ${this._triggeringBuff.name || this._triggeringBuff.id}`);
            this._shouldApplyThunderPerception = false; // Reset flag
            
            // Create the Thunder Perception buff object
            const critBuff = {
                id: `thunder_perception_crit_${Date.now()}`, // Unique ID for stacking
                name: "Thunder Perception",
                duration: 3, // 3 turns duration
                icon: "Icons/abilities/lightning_orb.webp", 
                description: "Increased Critical Chance from Thunder Perception talent.",
                onApply: (target) => {
                    target.bonusCritChance = (target.bonusCritChance || 0) + 0.10;
                    // Note: recalculateStats will be called after adding this buff
                    if (window.gameManager?.addLogEntry) {
                        window.gameManager.addLogEntry(`${target.name}'s Thunder Perception activates! +10% Critical Chance for 3 turns.`, 'system-update');
                    } else {
                        console.log(`${target.name}'s Thunder Perception activates! +10% Critical Chance for 3 turns.`);
                    }
                    return true;
                },
                onRemove: (target) => {
                    target.bonusCritChance = (target.bonusCritChance || 0) - 0.10;
                    target.recalculateStats('thunder-perception-crit-removed'); // Recalculate when removed
                    if (window.gameManager?.addLogEntry) {
                        window.gameManager.addLogEntry(`${target.name}'s Thunder Perception Critical Chance buff fades.`, 'system');
                    } else {
                        console.log(`${target.name}'s Thunder Perception Critical Chance buff fades.`);
                    }
                    return true;
                },
                // Ensure it doesn't trigger itself or other unwanted effects
                isDebuff: false,
                maxStacks: Infinity, // Allow stacking
                stacks: 1
            };
            
            // --- Directly add the crit buff --- 
            // Apply its onApply effect manually
            if (critBuff.onApply) {
                critBuff.onApply(this); 
            }
            // Push to the buffs array
            this.buffs.push(critBuff);
            console.log(`[Character.addBuff] Directly added Thunder Perception buff (ID: ${critBuff.id}) to ${this.name}`);
            
            // Recalculate stats *after* manually adding the TP buff
            this.recalculateStats('addBuff-thunder-perception');
            
            // --- END Direct add --- 
            
            // ... (VFX and sound logic remains the same) ...
            // Create visual effect if possible
            if (window.gameManager && typeof window.gameManager.uiManager !== 'undefined') {
                // Add the visual effect
                try {
                    const charElement = document.getElementById(`character-${this.instanceId}`);
                    if (charElement) {
                        // Create crit effect container
                        const critEffect = document.createElement('div');
                        critEffect.className = 'thunder-perception-effect';
                        charElement.appendChild(critEffect);
                        
                        // Create crit text
                        const critText = document.createElement('div');
                        critText.className = 'thunder-perception-text';
                        critText.textContent = '+10% CRIT';
                        critEffect.appendChild(critText);
                        
                        // Remove effect after animation completes
                        setTimeout(() => {
                            critEffect.remove();
                        }, 2000);
                    }
                } catch (e) {
                    console.error(`Error creating Thunder Perception VFX: ${e.message}`);
                }
            }
            
            // Play sound if possible
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                window.gameManager.playSound('sounds/buff_applied.mp3', 0.6);
            }
            // Clean up temporary trigger buff
            this._triggeringBuff = null;
        }
        // ---- END THUNDER PERCEPTION APPLICATION ----
        
        // --- STATISTICS TRACKING: Record buff application ---
        if (buffAppliedSuccessfully && window.statisticsManager && buff.appliedBy) {
            window.statisticsManager.recordStatusEffect(buff.appliedBy, this, 'buff', buff.id, false, buff.abilityId);
        }
        // --- END STATISTICS TRACKING ---

        // --- DISPATCH BuffApplied EVENT ---
        if (buffAppliedSuccessfully) {
            const event = new CustomEvent('BuffApplied', { 
                detail: { 
                    character: this, 
                    buff: buff // The original buff object that was added/refreshed
                } 
            });
            document.dispatchEvent(event);
            console.log(`[Character.addBuff] Dispatched BuffApplied event for ${this.name} with buff ${buff.name || buff.id}`);
        }
        // --- END DISPATCH BuffApplied EVENT ---

        // NEW: Update shield if buff was applied successfully
        if (buffAppliedSuccessfully) {
            this.updateShield();
        }

        // Return the status of applying the *original* buff
        return buffAppliedSuccessfully; 
    }

    addDebuff(debuff) {
        // Check if we're dealing with a special case for stacking Target Lock
        const isStackingTargetLock = debuff.id === 'farmer_nina_e_target_lock' && 
                                     debuff.isPermanent === true && 
                                     debuff.stackCount > 0;
                                     
        // Special handling for stacking debuffs - we've already removed the previous one
        if (isStackingTargetLock) {
            // Just add the new debuff with its stack count
            this.debuffs.push(debuff);
            debuff.character = this; // Assign character reference
            
            console.log(`[Stacking Debuff] Added ${debuff.name} with ${debuff.stackCount} stacks to ${this.name}`);
            
            // Call onApply if it exists
            if (typeof debuff.onApply === 'function') {
                try {
                    debuff.onApply(this);
                } catch (e) {
                    console.error(`Error executing onApply for stacking debuff ${debuff.id} on ${this.name}:`, e);
                }
            }
            
            // Recalculate stats after adding the debuff
            this.recalculateStats();
            updateCharacterUI(this);
            return;
        }
        
        // Regular debuff handling (non-stacking cases)
        const existingDebuffIndex = this.debuffs.findIndex(d => d.id === debuff.id);
        if (existingDebuffIndex !== -1) {
            // For permanent debuffs (duration -1), don't reset duration
            if (this.debuffs[existingDebuffIndex].duration === -1) {
                console.log(`Kept permanent debuff: ${debuff.name} on ${this.name}`);
            } else if (debuff.duration === -1) {
                // If new debuff is permanent but existing isn't, make it permanent
                this.debuffs[existingDebuffIndex].duration = -1;
                console.log(`Upgraded debuff: ${debuff.name} on ${this.name} to permanent`);
            } else {
                // Normal case: take the longer duration
                this.debuffs[existingDebuffIndex].duration = Math.max(this.debuffs[existingDebuffIndex].duration, debuff.duration);
                console.log(`Refreshed duration for debuff: ${debuff.name} on ${this.name}`);
            }
        } else {
            this.debuffs.push(debuff);
            debuff.character = this; // Assign character reference

            // Call onApply if it exists
            if (typeof debuff.onApply === 'function') {
                try {
                    debuff.onApply(this); // Pass the character instance
                } catch (e) {
                     console.error(`Error executing onApply for debuff ${debuff.id} on ${this.name}:`, e);
                }
            }

            console.log(`Added debuff: ${debuff.name} to ${this.name}`);
            
            // --- STATISTICS TRACKING: Record debuff application ---
            if (window.statisticsManager && debuff.appliedBy) {
                window.statisticsManager.recordStatusEffect(debuff.appliedBy, this, 'debuff', debuff.id, true, debuff.abilityId);
            }
            // --- END STATISTICS TRACKING ---
            
            // Recalculate stats after adding the debuff
            this.recalculateStats();
        }
        updateCharacterUI(this);
    }

    removeBuff(buffId) {
        const index = this.buffs.findIndex(buff => buff.id === buffId);
        if (index !== -1) {
            const buffToRemove = this.buffs[index]; // Get the buff object first

            // <<< NEW: Specific log for Low Tide Power >>>
            if (buffToRemove && buffToRemove.id === 'low_tide_power_buff') {
                console.log(`%c[DEBUG-LOWTIDE] removeBuff called for Low Tide Power buff on ${this.name}`, 'color: orange; font-weight: bold;');
            }
            // <<< END NEW >>>

            // --- MODIFIED: Check for and call .remove() --- 
            if (typeof buffToRemove.remove === 'function') {
                try {
                    // MODIFIED: Call onRemove which might modify character stats or have side effects
                    buffToRemove.onRemove(this);
                } catch (e) {
                    console.error(`Error executing onRemove() for buff ${buffToRemove.id} on ${this.name}:`, e);
                }
            }
            // --- END MODIFIED ---

            // Remove the buff from the array AFTER calling onRemove
            this.buffs.splice(index, 1);
            console.log(`Removed buff: ${buffToRemove.name} from ${this.name}`);
            
            // Recalculate stats AFTER onRemove has been called and buff is removed from array
            this.recalculateStats('removeBuff');

            // --- DISPATCH BuffRemoved EVENT ---
            const event = new CustomEvent('BuffRemoved', { 
                detail: { 
                    character: this, 
                    buffId: buffId,
                    buff: buffToRemove // The buff object that was removed
                } 
            });
            document.dispatchEvent(event);
            console.log(`[Character.removeBuff] Dispatched BuffRemoved event for ${this.name} with buff ${buffToRemove.name || buffToRemove.id}`);
            // --- END DISPATCH BuffRemoved EVENT ---

            // NEW: Update shield after removing buff
            this.updateShield();

            updateCharacterUI(this); // Update UI after all operations
            return true;
        }
        return false;
    }

    removeDebuff(debuffId) {
        const index = this.debuffs.findIndex(debuff => debuff.id === debuffId);
        if (index !== -1) {
            const debuff = this.debuffs[index];
             console.log(`Removing debuff: ${debuff.name} from ${this.name}`);

            // Call the debuff's specific remove function *before* removing it
            if (typeof debuff.remove === 'function') {
                 try {
                    debuff.remove(this);
                } catch (error) {
                    console.error(`Error executing remove function for debuff ${debuff.name}:`, error);
                }
            }

            this.debuffs.splice(index, 1);

            // Recalculate stats after removing the debuff
            this.recalculateStats();

            // Call passive handler's onDebuffRemoved method if it exists
            if (this.passiveHandler && typeof this.passiveHandler.onDebuffRemoved === 'function') {
                this.passiveHandler.onDebuffRemoved(this);
            }

            updateCharacterUI(this); // Update UI after recalculating stats
        } else {
            console.log(`Attempted to remove non-existent debuff ID: ${debuffId} from ${this.name}`);
        }
    }

    processEffects(shouldReduceDuration = false, shouldRegenerateResources = true) {
        if (!this.stats) {
            console.error(`processEffects called on character ${this.name || this.id} with no stats object.`);
            return;
        }

        // --- NEW: Turn Start Hooks for Buffs/Debuffs ---
        // Call onTurnStart for buffs
        this.buffs.forEach(buff => {
            if (typeof buff.onTurnStart === 'function') {
                try {
                    buff.onTurnStart(this);
                } catch (error) {
                    console.error(`Error executing onTurnStart for buff ${buff.name || buff.id}:`, error);
                }
            }
        });
        // Call onTurnStart for debuffs
        this.debuffs.forEach(debuff => {
            if (typeof debuff.onTurnStart === 'function') {
                try {
                    debuff.onTurnStart(this);
                } catch (error) {
                    console.error(`Error executing onTurnStart for debuff ${debuff.name || debuff.id}:`, error);
                }
            }
        });
        // --- END Turn Start Hooks ---

        // --- Passive Hook: onTurnStart ---
        if (this.passiveHandler && typeof this.passiveHandler.onTurnStart === 'function') {
            try {
                // Get current turn number from game manager
                const currentTurn = window.gameManager ? window.gameManager.turnNumber : 1;
                
                // Call with character and turn number parameters
                this.passiveHandler.onTurnStart(this, currentTurn);
            } catch (error) {
                console.error(`Error executing onTurnStart passive for ${this.name}:`, error);
            }
        }
        // --- END Passive Hook ---

        // Process buffs first
        // Loop backwards to handle removals safely
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];

            // ---> ADDED LOGGING 1 <---
            if (buff.id === 'farmer_nina_w_hiding_buff') {
                console.log(`%c[HIDING DEBUG - Loop Check 1] Processing Hiding buff. Index: ${i}, Duration BEFORE Decrement: ${buff.duration}, wasHidingBroken: ${buff.wasHidingBroken}`, 'color: cyan');
            }

            // Apply buff effect (per-turn effects)
            if (typeof buff.effect === 'function') {
                try {
                    buff.effect(this);
                } catch (error) {
                    console.error("Error applying buff effect:", error);
                }
            }

            // MODIFIED: Apply onTurnEnd effect only if durations are being reduced
            if (shouldReduceDuration && typeof buff.onTurnEnd === 'function') {
                try {
                    buff.onTurnEnd(this);
                } catch (error) {
                    console.error(`Error applying onTurnEnd for buff ${buff.name || buff.id}:`, error);
                }
            }

            // Reduce duration only if shouldReduceDuration is true AND duration is not permanent (-1)
            if (shouldReduceDuration && buff.duration !== -1) {
                buff.duration--;
                // Set flag for UI animation when duration changes
                buff.durationChanged = true;
                // ---> ADDED LOGGING 2 <---
                if (buff.id === 'farmer_nina_w_hiding_buff') {
                     console.log(`%c[HIDING DEBUG - Loop Check 2] Hiding buff duration AFTER Decrement: ${buff.duration}, wasHidingBroken: ${buff.wasHidingBroken}`, 'color: cyan');
                } else {
                     console.log(`[DEBUG] ${this.name}'s buff ${buff.name || buff.id} reduced to ${buff.duration} turns remaining`);
                }
            }

            // ---> ADDED LOGGING 3 <---
            if (buff.id === 'farmer_nina_w_hiding_buff') {
                console.log(`%c[HIDING DEBUG - Loop Check 3] BEFORE expiration check. Duration: ${buff.duration}, wasHidingBroken: ${buff.wasHidingBroken}`, 'color: cyan');
            }

            // Remove if expired (duration <= 0 and not permanent)
            // ---> MODIFIED CHECK TO <= 0 <---
            if (buff.duration !== -1 && buff.duration <= 0) {
                // ---> ADDED LOGGING 4 <---
                if (buff.id === 'farmer_nina_w_hiding_buff') {
                     console.log(`%c[HIDING DEBUG - Loop Check 4] Entered EXPIRATION block (duration <= 0). Duration: ${buff.duration}, wasHidingBroken: ${buff.wasHidingBroken}`, 'color: magenta; font-weight: bold;');
                }

                const buffName = buff.name || buff.id;
                console.log(`[DEBUG] Buff ${buffName} on ${this.name} expired.`);

                if (buff.id === 'farmer_nina_w_hiding_buff') {
                    console.warn(`%c[HIDING DEBUG - processEffects] Removing expired hiding buff. Current wasHidingBroken state: ${buff.wasHidingBroken}`, 'color: orange; font-weight: bold;');
                }

                if (typeof buff.onRemove === 'function') {
                     // ... existing try/catch for onRemove ...
                     try {
                        console.log(`[DEBUG] Calling onRemove for ${buffName}`);
                        buff.onRemove(this); // Call the buff's specific remove logic
                    } catch (error) {
                        console.error(`Error executing onRemove for buff ${buffName}:`, error);
                    }
                }
                // Remove from the array
                this.buffs.splice(i, 1); // <<< REMOVED AFTER onRemove IS CALLED >>>

                // Log expiration
                try {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${this.name}'s ${buffName} effect has expired.`);
                } catch (error) {
                    console.error("Error logging buff expiration:", error);
                }

                // <<< IMPORTANT: Recalculate stats AFTER removal >>>
                this.recalculateStats('processEffects-buff-removed');
            }
        } // End of buff loop

        // Process debuffs (similar loop)
        for (let i = this.debuffs.length - 1; i >= 0; i--) {
            const debuff = this.debuffs[i];

            // --- APPLY Damage Over Time (DoT) Effects --- 
            if (debuff.effect && debuff.effect.type === 'damage_over_time') {
                const dotDamage = debuff.effect.value || 0;
                if (dotDamage > 0) {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`${this.name} takes ${dotDamage} damage from ${debuff.name || 'DoT effect'}.`, 'debuff');
                    
                    // Directly apply damage without triggering on-hit effects
                    this.stats.currentHp = Math.max(0, this.stats.currentHp - dotDamage);
                    
                    // Show VFX for DoT damage (e.g., bleeding VFX)
                    if (debuff.id === 'bleeding_wounds' && window.HoundPassive) {
                        const passiveHandler = new window.HoundPassive(); // TODO: Consider getting instance from character if available
                        passiveHandler.showBleedDamageVFX(this, dotDamage);
                    } else {
                        // Generic DoT VFX?
                    }

                    if (this.stats.currentHp === 0) {
                        log(`${this.name} succumbed to ${debuff.name || 'DoT effect'}!`, 'death');
                        if (window.gameManager) {
                            window.gameManager.handleCharacterDeath(this);
                        }
                        // If character died, no need to process further effects for them this turn
                        // This might need more robust handling depending on game flow
                        return; 
                    }
                }
            }
            // --- END DoT --- 

            // Apply other debuff effects (per-turn effects)
            if (typeof debuff.effect === 'function') {
                try {
                    debuff.effect(this);
                } catch (error) {
                    console.error("Error applying debuff effect:", error);
                }
            }

            // MODIFIED: Apply onTurnEnd effect only if durations are being reduced
            if (shouldReduceDuration && typeof debuff.onTurnEnd === 'function') {
                try {
                    debuff.onTurnEnd(this);
                } catch (error) {
                    console.error(`Error applying onTurnEnd for debuff ${debuff.name || debuff.id}:`, error);
                }
            }

            // Reduce duration only if shouldReduceDuration is true AND duration is not permanent (-1)
            if (shouldReduceDuration && debuff.duration !== -1) {
                debuff.duration--;
                // Set flag for UI animation when duration changes
                debuff.durationChanged = true;
                console.log(`[DEBUG] ${this.name}'s debuff ${debuff.name || debuff.id} reduced to ${debuff.duration} turns remaining`);
            }

            // Remove if expired (duration > 0 and reaches 0)
            if (debuff.duration === 0) { // Check for exactly 0, ignoring permanent -1
                // <<< MODIFICATION: Call onRemove directly >>>
                const debuffName = debuff.name || debuff.id;
                console.log(`[DEBUG] Debuff ${debuffName} on ${this.name} expired.`);
                if (typeof debuff.onRemove === 'function') {
                    try {
                        console.log(`[DEBUG] Calling onRemove for ${debuffName}`);
                        debuff.onRemove(this);
                    } catch (error) {
                        console.error(`Error executing onRemove for debuff ${debuffName}:`, error);
                    }
                }
                // Remove from the array
                this.debuffs.splice(i, 1);
                // <<< END MODIFICATION >>>
                
                // Log expiration
                try {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${this.name}'s ${debuffName} effect has expired.`);
                } catch (error) {
                    console.error("Error logging debuff expiration:", error);
                }
                
                // <<< IMPORTANT: Recalculate stats AFTER removal >>>
                this.recalculateStats('processEffects-debuff-removed');
            }
        }

        // --- NEW: Process ability disable durations ---
        this.abilities.forEach(ability => {
            if (ability.isDisabled && shouldReduceDuration) {
                ability.disabledDuration--;
                if (ability.disabledDuration <= 0) {
                    ability.isDisabled = false;
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${this.name}'s ${ability.name} is no longer disabled.`);
                    // No need to call remove here, the debuff removal handles the main cleanup
                }
            }
        });
        // --- END NEW ---

        // Regenerate resources like HP/Mana per turn after processing effects
        if (shouldRegenerateResources) {
            this.regenerateResources();
        }

        // NEW: Update shield after processing effects (buffs may have expired)
        this.updateShield();

        // Update UI after processing all effects for the turn
        updateCharacterUI(this);
    }

    addAbility(ability) {
        this.abilities.push(ability);
    }

    resetAbilityCooldowns() {
        console.log(`Resetting cooldowns for ${this.name}`);
        this.abilities.forEach(ability => {
            console.log(`  Before: ${ability.name} cooldown: ${ability.currentCooldown}`);
            ability.currentCooldown = 0;
            console.log(`  After: ${ability.name} cooldown: ${ability.currentCooldown}`);
        });
    }

    isDead() {
        return this.stats.currentHp <= 0;
    }

    isStunned() {
        return this.debuffs.some(debuff => 
            debuff.id === 'stun' || 
            (debuff.effects && debuff.effects.cantAct === true)
        );
    }

    // Check if character has a specific buff
    hasBuff(buffId) {
        return this.buffs.some(buff => buff.id === buffId);
    }
    
    // --- NEW: Helper method to check for Desperate Strength buff ---
    hasDesperateStrength() {
        return this.buffs.some(buff => buff.id === 'desperate_strength_buff');
    }
    // --- END NEW ---

    // --- NEW: Check if character is untargetable by abilities due to buffs ---
    isUntargetable() {
        // Check both buffs and debuffs arrays
        const allEffects = [...this.buffs, ...this.debuffs];
        return allEffects.some(effect => effect.isUntargetable === true);
    }
    // --- END NEW ---

    // Method to show stun visual effect
    showStunVFX() {
        // Get the character element using instanceId or id
        const elementId = this.instanceId || this.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create stun VFX container
        const stunVFX = document.createElement('div');
        stunVFX.className = 'stun-vfx';
        
        // Create stars
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.className = 'stun-star';
            star.textContent = '✦';
            star.style.animationDelay = `${i * 0.2}s`;
            stunVFX.appendChild(star);
        }
        
        // Create stun text
        const stunText = document.createElement('div');
        stunText.className = 'stun-text';
        stunText.textContent = 'STUNNED';
        stunVFX.appendChild(stunText);
        
        // Add VFX to the character element
        charElement.appendChild(stunVFX);
        
        // Remove after animation completes
        setTimeout(() => {
            if (stunVFX && stunVFX.parentNode === charElement) {
                charElement.removeChild(stunVFX);
            }
        }, 2000);
    }

    applyDebuff(debuff) {
        // Add the debuff to the character
        this.debuffs.push(debuff);
        debuff.character = this; // Assign character reference
        
        // Check if this is a stun debuff and show visual effect
        if (debuff.id === 'stun' || 
            (debuff.name && debuff.name.toLowerCase().includes('stun')) || 
            (debuff.effects && debuff.effects.cantAct === true)) {
            console.log(`Showing stun VFX for ${this.name} (debuff: ${debuff.id})`);
            this.showStunVFX();
        }
        
        // Recalculate stats after adding the debuff
        this.recalculateStats();
        
        // Update UI
        updateCharacterUI(this);
        
        return this.debuffs;
    }

    /*
     * Check if this character has a specific talent
     * @param {string} talentId - The talent ID to check
     * @returns {boolean} - Whether the character has the talent
     */
    hasTalent(talentId) {
        if (!this.appliedTalents || !Array.isArray(this.appliedTalents)) {
            return false;
        }
        return this.appliedTalents.includes(talentId);
    }

    // NEW: Shield calculation methods
    calculateMysticBarrierShield() {
        if (!this.enableMysticBarrier) return 0;
        
        // Count non-permanent buffs
        const nonPermanentBuffs = this.buffs.filter(buff => 
            !buff.isPermanent && 
            buff.duration > 0
        );
        
        const shieldAmount = nonPermanentBuffs.length * 400;
        console.log(`[${this.name}] Mystic Barrier: ${nonPermanentBuffs.length} buffs = ${shieldAmount} shield`);
        return shieldAmount;
    }

    updateShield() {
        if (this.enableMysticBarrier) {
            const newShield = this.calculateMysticBarrierShield();
            const oldShield = this.shield;
            this.shield = newShield;
            
            if (newShield !== oldShield && window.gameManager) {
                if (newShield > oldShield) {
                    window.gameManager.addLogEntry(`${this.name}'s Mystic Barrier increases to ${newShield} shield!`, 'zoey talent-effect');
                } else if (newShield < oldShield && oldShield > 0) {
                    window.gameManager.addLogEntry(`${this.name}'s Mystic Barrier decreases to ${newShield} shield.`, 'zoey talent-effect');
                }
            }
        }
    }
    
    // Update the stats menu if it's currently open and showing this character
    updateStatsMenuIfOpen() {
        if (window.gameManager && window.gameManager.characterStatsMenu) {
            const statsMenu = window.gameManager.characterStatsMenu;
            
            // Check if the stats menu is visible and if it's showing this character
            if (statsMenu.style.display === 'block') {
                // Get the character name from the menu header to check if it matches this character
                const headerElement = statsMenu.querySelector('.stats-menu-header');
                if (headerElement && headerElement.textContent === this.name) {
                    // Refresh the stats menu with updated data
                    console.log(`[UpdateStatsMenu] Refreshing stats menu for ${this.name} due to stat changes`);
                    
                    // Get the current position of the menu (if available)
                    const rect = statsMenu.getBoundingClientRect();
                    const x = rect.left;
                    const y = rect.top;
                    
                    // Re-render the stats menu with updated stats
                    window.gameManager.showCharacterStatsMenu(this, x, y);
                }
            }
        }
    }
    
    // Enhanced dodge VFX method for all characters (except Zoey who has custom implementation)
    showEnhancedDodgeVFX() {
        // Get character element
        const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (!charElement) return;
        
        // Create VFX container
        const dodgeVfx = document.createElement('div');
        dodgeVfx.className = 'dodge-vfx';
        
        // Create the DODGE! text
        const dodgeText = document.createElement('div');
        dodgeText.className = 'dodge-text';
        dodgeText.textContent = 'DODGE!';
        dodgeVfx.appendChild(dodgeText);
        
        // Create dodge particles
        const dodgeParticles = document.createElement('div');
        dodgeParticles.className = 'dodge-particles';
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'dodge-particle';
            // Add random particle direction variables
            const dx = (Math.random() - 0.5) * 60; // Random X direction
            const dy = (Math.random() - 0.5) * 40 - 20; // Random Y direction (bias upward)
            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);
            dodgeParticles.appendChild(particle);
        }
        dodgeVfx.appendChild(dodgeParticles);
        
        // Create afterimage effect
        const characterImage = charElement.querySelector('.character-image');
        if (characterImage) {
            const afterimage = document.createElement('div');
            afterimage.className = 'dodge-afterimage';
            afterimage.style.backgroundImage = `url(${characterImage.src})`;
            dodgeVfx.appendChild(afterimage);
        }
        
        // Create speed lines
        const speedLines = document.createElement('div');
        speedLines.className = 'dodge-speed-lines';
        for (let i = 0; i < 4; i++) {
            const speedLine = document.createElement('div');
            speedLine.className = 'speed-line';
            speedLines.appendChild(speedLine);
        }
        dodgeVfx.appendChild(speedLines);
        
        // Add to character element
        charElement.appendChild(dodgeVfx);
        
        // Play dodge sound effect
        if (window.gameManager && window.gameManager.playSound) {
            window.gameManager.playSound('sounds/dodge_whoosh.mp3', 0.5).catch(() => {
                // Fallback if specific dodge sound doesn't exist - try generic swoosh
                window.gameManager.playSound('sounds/whoosh.mp3', 0.4).catch(() => {
                    console.log('No dodge sound effect available');
                });
            });
        }
        
        // Add screen shake effect for dramatic impact
        this.addDodgeScreenShake();
        
        // Remove after animation completes
        setTimeout(() => {
            if (dodgeVfx.parentNode === charElement) {
                charElement.removeChild(dodgeVfx);
            }
        }, 900); // Slightly longer than animation duration to ensure it completes
    }
    
    // Add subtle screen shake for dodge effect
    addDodgeScreenShake() {
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            battleContainer.classList.add('dodge-shake');
            setTimeout(() => {
                battleContainer.classList.remove('dodge-shake');
            }, 200);
        }
    }
}

// Ability class definition
class Ability {
    /**
     * Represents a character ability.
     * @param {string} id - Unique identifier for the ability.
     * @param {string} name - Display name of the ability.
     * @param {string} icon - Path to the ability icon.
     * @param {number} manaCost - Mana cost to use the ability.
     * @param {number} cooldown - Cooldown duration in turns.
     * @param {function} effect - The function executed when the ability is used.
     */
    constructor(id, name, icon, manaCost, cooldown, effect) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.manaCost = manaCost;
        this.baseCooldown = cooldown; // Store base cooldown for reference
        this.cooldown = cooldown;
        this.currentCooldown = 0;
        this.effect = effect; // (caster, targetOrTargets, ability, actualManaCost, options) => {}
        this.description = ''; // Will be generated
        this.baseDescription = ''; // Template for description - IMPORTANT
        this.targetType = 'enemy'; // Default target type ('enemy', 'ally', 'self', 'any', 'aoe_enemy', 'aoe_ally')
        this.requiresTarget = !['aoe_enemy', 'aoe_ally', 'self'].includes(this.targetType); // Default based on initial type
        this.baseDamage = 0; // Add baseDamage property if not present
        this.healAmount = 0; // Add healAmount property if not present
        this.stunChance = 0; // Add stunChance property if not present
        // Add other potential properties that descriptions might reference
    }

    /**
     * Executes the ability's effect.
     * @param {Character} caster - The character using the ability.
     * @param {Character | Character[]} targetOrTargets - The target(s) of the ability.
     * @param {number} actualManaCost - The actual mana cost paid after modifiers.
     * @param {object} options - Additional options for the ability effect.
     */
    use(caster, targetOrTargets, actualManaCost, options = {}) {
        if (this.effect) {
            try {
                // --- STATISTICS TRACKING: Set ability ID in options for tracking ---
                options.abilityId = this.id;
                // --- END STATISTICS TRACKING ---
                
                // Call the effect function and capture its return value
                const effectResult = this.effect(caster, targetOrTargets, this, actualManaCost, options);
                
                // Store the result in a global variable for the GameManager to access
                window.abilityLastResult = effectResult || {};
                
                // Set cooldown after successful use, unless the ability effect requests to reset it
                if (effectResult && effectResult.resetCooldown) {
                    console.log(`[Ability.use] ${this.name} returned resetCooldown=true, keeping cooldown at 0`);
                    this.currentCooldown = 0;
                } else {
                    this.currentCooldown = this.cooldown;
                }
                
                // Log if ability prevented turn end
                if (effectResult && effectResult.doesNotEndTurn) {
                    console.log(`[Ability.use] ${this.name} returned doesNotEndTurn=true`);
                }
                
                return true;
            } catch (error) {
                console.error(`Error executing ability ${this.name} (${this.id}):`, error);
                window.abilityLastResult = {}; // Reset on error
                return false;
            }
        }
        window.abilityLastResult = {}; // Reset if no effect
        return false; // If no effect exists
    }

    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= 1;
        }
    }

    /**
     * Sets the description for the ability and stores the base template.
     * @param {string} description - The description template string (e.g., "Deals {baseDamage} damage.").
     * @returns {Ability} The Ability instance for chaining.
     */
    setDescription(description) {
        // Ensure baseDescription is set from the provided description
        this.baseDescription = description; 
        this.description = this.generateDescription(); // Generate initial description
        return this;
    }

    /**
     * Generates the ability description by replacing placeholders with current values
     * and appending talent information.
     * @returns {string} The generated description string.
     */
    generateDescription() {
        // Fallback: If baseDescription is somehow empty, try to use the current description as a base
        // or set a default to avoid errors downstream.
        if (!this.baseDescription) {
            if (this.description) { // If a description exists (e.g. from JSON initial load)
                console.warn(`[Ability.generateDescription] Missing baseDescription for ability "${this.id}". Using current description as base.`);
                this.baseDescription = this.description;
            } else {
                console.warn(`[Ability.generateDescription] Missing baseDescription AND description for ability "${this.id}". Setting a default.`);
                this.baseDescription = `Default description for ${this.name || this.id}.`;
            }
        }

        let generatedDesc = this.baseDescription;
        let talentEffectsHtml = '';

        // --- Placeholder Replacement --- 
        const placeholders = generatedDesc.match(/\{[a-zA-Z0-9_]+\}/g) || [];
        placeholders.forEach(placeholder => {
            const propertyName = placeholder.slice(1, -1); // Remove {}
            let value = this[propertyName]; // Get value from the ability instance

            if (value === undefined) {
                console.warn(`[Ability.generateDescription] Property "${propertyName}" not found on ability "${this.id}" for description generation.`);
                value = `[${propertyName}]`; // Indicate missing value
            }

            // Format percentages nicely
            if (typeof value === 'number' && (
                propertyName.toLowerCase().includes('chance') ||
                propertyName.toLowerCase().includes('modifier') ||
                propertyName.toLowerCase().includes('percent')
            )) {
                if (value >= 0 && value <= 1) {
                    value = `${Math.round(value * 100)}%`;
                }
            }
            generatedDesc = generatedDesc.replace(placeholder, value);
        });

        // --- Append Talent Information --- 
        // This is a generic spot. Character-specific abilities (like Renée's)
        // should ideally have their own generateDescription methods that handle
        // their specific talent texts. This generic one won't know about them.
        // However, if a character-specific generateDescription is not attached, this will run.

        // Example of how talent effects COULD be generically appended if stored on the ability
        if (this.talentModifiers && typeof this.talentModifiers === 'object') {
            for (const talentKey in this.talentModifiers) {
                // This is a very basic example; actual formatting would be more complex
                // and depend on how talent effects are structured.
                 if (this.talentModifiers[talentKey] && talentKey !== 'toString') { // Added check for own property
                    talentEffectsHtml += `\n<span class="talent-effect">Talent: ${talentKey} active.</span>`;
                 }
            }
        }


        // Combine base description and talent effects
        const finalDescription = generatedDesc + talentEffectsHtml;

        // Update the ability's description property
        this.description = finalDescription;
        return finalDescription;
    }

    /**
     * Sets the target type for the ability.
     * @param {string} targetType - The target type ('enemy', 'ally', 'self', 'any', 'aoe_enemy', 'aoe_ally').
     * @returns {Ability} The Ability instance for chaining.
     */
    setTargetType(targetType) {
        this.targetType = targetType;
        this.requiresTarget = !['aoe_enemy', 'aoe_ally', 'self'].includes(this.targetType); // Update based on new target type
        return this;
    }
}

// Effect class definition
class Effect {
    constructor(id, name, icon, duration, effect, isDebuff = false) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.duration = duration;
        this.effect = effect;
        this.isDebuff = isDebuff;
        this.description = "";
        // statModifiers will be set explicitly by buffs that need them
        // this.statModifiers = {}; // Don't initialize as empty object
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    // Clone method to create a deep copy of an Effect
    clone() {
        const cloned = new Effect(
            this.id,
            this.name,
            this.icon,
            this.duration,
            this.effect, // Copies the main (per-turn) effect function
            this.isDebuff
        );
        
        cloned.description = this.description;
        
        // Ensure stat modifiers are properly deep copied
        if (Array.isArray(this.statModifiers)) {
            cloned.statModifiers = this.statModifiers.map(mod => ({ ...mod })); 
        } else if (typeof this.statModifiers === 'object' && this.statModifiers !== null) {
            cloned.statModifiers = { ...this.statModifiers };
        }
        
        // Copy Target Lock specific properties
        if (this.stackCount !== undefined) {
            cloned.stackCount = this.stackCount;
        }
        if (this.isPermanent !== undefined) {
            cloned.isPermanent = this.isPermanent;
        }
        if (this.hasArmorBreach !== undefined) {
            cloned.hasArmorBreach = this.hasArmorBreach;
        }
        
        // Copy stackable properties 
        if (this.stackable !== undefined) {
            cloned.stackable = this.stackable;
        }
        if (this.maxStacks !== undefined) {
            cloned.maxStacks = this.maxStacks;
        }
        if (this.currentStacks !== undefined) {
            cloned.currentStacks = this.currentStacks;
        }

        // Copy any other custom properties
        if (this.originalStats) {
            cloned.originalStats = {...this.originalStats};
        }
        
        // Deep copy effects if they exist
        if (this.effects) {
            cloned.effects = JSON.parse(JSON.stringify(this.effects));
        }
        
        // Copy all methods
        if (typeof this.remove === 'function' && this.remove !== Effect.prototype.remove) {
            cloned.remove = this.remove;
        }
        if (typeof this.onRemove === 'function') {
            cloned.onRemove = this.onRemove;
        }
        if (typeof this.onApply === 'function') {
            cloned.onApply = this.onApply;
        }
        if (typeof this.onTurnStart === 'function') {
            cloned.onTurnStart = this.onTurnStart;
        }
        if (typeof this.onTurnEnd === 'function') {
            cloned.onTurnEnd = this.onTurnEnd;
        }
        
        // Copy any additional properties we haven't explicitly handled
        for (const key in this) {
            if (!cloned.hasOwnProperty(key) && 
                this.hasOwnProperty(key) && 
                key !== 'character') { // Skip character reference to avoid circular references
                try {
                    // Try to deep copy if possible
                    if (typeof this[key] === 'object' && this[key] !== null) {
                        cloned[key] = JSON.parse(JSON.stringify(this[key]));
                    } else {
                        cloned[key] = this[key];
                    }
                } catch (e) {
                    // Fall back to simple assignment if deep copy fails
                    cloned[key] = this[key];
                    console.log(`Simple copy for property ${key} during Effect clone`);
                }
            }
        }
        
        return cloned;
    }

    // Called when an effect is removed
    remove(character) {
        // Default removal implementation with enhanced error handling
        try {
            if (character && character.name) {
                console.log(`Effect ${this.name || 'unnamed'} removed from ${character.name}`);
            } else {
                console.log(`Effect ${this.name || 'unnamed'} removed`);
            }
        } catch (error) {
            console.error("Error in Effect.remove:", error);
        }
    }
}

window.Effect = Effect; // Make Effect class globally accessible

// Character data utility factory
const CharacterFactory = {
    // <<< ADDED: Custom character class registry >>>
    customCharacterClasses: {},
    talentDefinitionsCache: {}, // Cache for loaded talent definitions
    abilityEffectRegistry: {}, // Registry for custom ability effects
    abilityRegistry: {}, // Registry for complex ability logic

    /**
     * Register a custom Character class to be used when creating characters with a specific ID
     * @param {string} characterId - The character ID to associate with this custom class
     * @param {function} characterClass - The custom Character class constructor
     */
    registerCharacterClass(characterId, characterClass) {
        if (!characterId || typeof characterId !== 'string') {
            console.error('[CharFactory] Invalid characterId provided to registerCharacterClass');
            return;
        }
        
        if (!characterClass || typeof characterClass !== 'function') {
            console.error('[CharFactory] Invalid characterClass provided to registerCharacterClass');
            return;
        }
        
        console.log(`[CharFactory] Registering custom character class for: ${characterId}`);
        this.customCharacterClasses[characterId] = characterClass;
    },
    // <<< END ADDED >>>

    // Creates a character from a character definition
    async createCharacter(charData, selectedTalentIds = []) { // selectedTalentIds will be ignored here now
        console.log(`[CharFactory] createCharacter called for ID: ${charData ? charData.id : 'UNKNOWN'}. Talent application deferred to TalentManager.`);

        if (!charData || !charData.id || !charData.stats) {
            console.error("[CharFactory] Invalid or incomplete charData received:", charData);
            return null;
        }

        let character;

        if (charData.id && this.customCharacterClasses[charData.id]) {
            console.log(`[CharFactory] Creating character ${charData.id} using custom class ${this.customCharacterClasses[charData.id].name}`);
            const CustomClass = this.customCharacterClasses[charData.id];
            try {
                character = new CustomClass(
                    charData.id,
                    charData.name,
                    charData.image,
                    { ...charData.stats }
                );
            } catch (error) {
                console.error(`[CharFactory] Error instantiating custom class ${CustomClass.name} for ${charData.id}:`, error);
                character = new Character(
                    charData.id,
                    charData.name,
                    charData.image,
                    charData.stats
                );
            }
        } else {
            console.log(`[CharFactory] Creating character ${charData.id} using base Character class`);
            character = new Character(
                charData.id,
                charData.name,
                charData.image,
                charData.stats
            );
        }

        if (!character) {
            console.error(`[CharFactory] Failed to instantiate character object for ${charData.id}`);
            return null;
        }

        if (!character.baseStats) {
             character.baseStats = { ...character.stats };
             console.log(`[CharFactory] Set base stats for ${character.name} from initial stats.`);
        } else {
             console.log(`[CharFactory] Base stats for ${character.name} were already set by constructor.`);
        }

        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = AbilityFactory.createAbility(abilityData);
                if (ability) {
                    character.addAbility(ability);
                } else {
                    console.warn(`[CharFactory] Failed to create ability from data for ${character.name}:`, abilityData);
                }
            });
        }

        // >>> TALENT APPLICATION DURING CHARACTER CREATION IS NOW REMOVED/DEFERRED <<<
        // The TalentManager.enhanceCharacterWithTalents method will handle this after character creation.
        /*
        if (selectedTalentIds && selectedTalentIds.length > 0) {
            console.log(`[CharFactory] DEFERRED: Applying ${selectedTalentIds.length} talents to ${character.name} via TalentManager later.`);
            // const talentDefinitions = await this.loadTalentDefinitions(character.id);
            // if (talentDefinitions) {
            //     this.applyTalents(character, talentDefinitions, selectedTalentIds); // DO NOT APPLY HERE
            // } else {
            //     console.warn(`[CharFactory] Could not load talent definitions for ${character.id} during initial creation phase.`);
            // }
        }
        */
        
        // character.appliedTalents will be set by TalentManager when it applies talents.
        // character.appliedTalents = selectedTalentIds; // DO NOT SET HERE

        if (charData.passive) {
            character.passive = { ...charData.passive };
            const passiveId = charData.passive.id;
            console.log(`[CharFactory] Character ${character.name} has passive: ${passiveId}`);
            const isCustomCharacter = character.constructor !== Character;
            if (!isCustomCharacter) { 
                let PassiveHandlerClass = null;
                 if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.getHandlerClass === 'function') {
                     PassiveHandlerClass = window.PassiveFactory.getHandlerClass(passiveId);
                     if (!PassiveHandlerClass) { 
                        PassiveHandlerClass = this.checkHardcodedPassives(passiveId);
                    }
                 } else {
                     console.error("[CharFactory] PassiveFactory not available.");
                     PassiveHandlerClass = this.checkHardcodedPassives(passiveId);
                 }

                if (PassiveHandlerClass) {
                    try {
                        character.passiveHandler = new PassiveHandlerClass(character);
                        console.log(`[CharFactory] Instantiated passive handler ${PassiveHandlerClass.name} for ${character.name}`);
                        if (character.passiveHandler && typeof character.passiveHandler.initialize === 'function') {
                            console.log(`[CharFactory] Initializing passive handler ${character.passiveHandler.constructor.name} for ${character.name}.`);
                            character.passiveHandler.initialize(character);
                        } else {
                            console.log(`[CharFactory] No passive handler or initialize method found for ${character.name}.`);
                        }
                    } catch (error) {
                        console.error(`[CharFactory] Error instantiating or initializing passive handler ${PassiveHandlerClass.name}:`, error);
                    }
                } else {
                    console.warn(`[CharFactory] No passive handler class found for ${passiveId}`);
                }
            }
        }

        character.abilities.forEach(ability => {
            if (typeof ability.generateDescription === 'function') {
                const generatedDesc = ability.generateDescription();
                if (ability.description !== generatedDesc) {
                    ability.description = generatedDesc; 
                    console.log(`[CharFactory Post-Passive Init Update] Regenerated description for ${character.name}'s ${ability.id} via generateDescription.`);
                }
            } 
        });

        // Load character XP and level data from Firebase
        if (window.characterXPManager && window.characterXPManager.initialized) {
            try {
                await window.characterXPManager.applyXPToCharacter(character);
                console.log(`[CharFactory] Applied XP data to ${character.name}: Level ${character.level} (${character.experience} XP)`);
            } catch (error) {
                console.warn(`[CharFactory] Failed to load XP data for ${character.name}:`, error);
                // Continue with default values (Level 1, 0 XP) that were set in constructor
            }
        } else {
            console.warn(`[CharFactory] CharacterXPManager not available, using default XP values for ${character.name}`);
        }

        console.log(`[CharFactory] Finished creating character ${character.name} (talent application deferred).`, character);
        return character;
    },

    // --- NEW: Load Talent Definitions (with caching) ---
    talentDefinitionsCache: {}, // Add cache object
    async loadTalentDefinitions(characterId) {
        if (this.talentDefinitionsCache[characterId]) {
            return this.talentDefinitionsCache[characterId];
        }
        try {
            const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
            if (!response.ok) {
                // If 404 or other error, store null and return
                console.warn(`No talent file found for ${characterId} or failed to load. Status: ${response.status}`);
                this.talentDefinitionsCache[characterId] = null; 
                return null;
            }
            const data = await response.json();
            this.talentDefinitionsCache[characterId] = data.talentTree; // Store only the talentTree part
            return data.talentTree;
        } catch (error) {
            console.error(`Error loading talent definitions for ${characterId}:`, error);
            this.talentDefinitionsCache[characterId] = null; // Cache null on error
            return null;
        }
    },

    // --- NEW: Apply Talents Logic ---
    applyTalents(character, talentDefinitions, selectedTalentIds) {
        selectedTalentIds.forEach(talentId => {
            const talent = talentDefinitions[talentId];
            if (!talent) {
                console.warn(`[CharFactory] Talent ${talentId} not found.`);
                return;
            }

            console.log(`[CharFactory] Applying talent: ${talent.name}`);
            
            // Handle single effect or array of effects
            const effects = Array.isArray(talent.effect) ? talent.effect : [talent.effect];
            
            effects.forEach(effect => {
                if (!effect || !effect.type) {
                    console.warn(`[CharFactory] Talent ${talentId} has invalid or missing effect property:`, effect);
                    return; // Skip this invalid effect
                }

                switch (effect.type) {
                    case 'modify_stat':
                         console.log(`[CharFactory] Applying talent: ${talent.name}`); // Line ~1764
                         if (effect.stat && effect.value !== undefined) {
                             const operation = effect.operation || 'set';
                             // Determine if this should modify base stats (e.g., maxHp, maxMana, or if explicitly targeted)
                             const isBaseStatModification = (effect.target === 'base' || ['maxHp', 'maxMana', 'physicalDamage', 'magicalDamage', 'armor', 'magicalShield', 'speed'].includes(effect.stat)); // Added common base stats

                             if (isBaseStatModification) {
                                 // Modify the BASE stat directly
                                 if (character.baseStats && character.baseStats[effect.stat] !== undefined) {
                                     if (operation === 'add') { // Ensure this check works
                                         character.baseStats[effect.stat] += effect.value;
                                         console.log(`  - Modifying BASE stat ${effect.stat} adding ${effect.value}`); // Corrected log
                                     } else if (operation === 'multiply') {
                                         character.baseStats[effect.stat] *= effect.value;
                                         console.log(`  - Modifying BASE stat ${effect.stat} multiplying by ${effect.value}`);
                                     } else { // Default to 'set' - This path should ideally only be hit if operation is explicitly 'set'
                                         character.baseStats[effect.stat] = effect.value;
                                         // Corrected log to reflect 'set' operation accurately
                                         console.log(`  - Setting BASE stat ${effect.stat} to ${effect.value}`);
                                     }
                                 } else {
                                     console.warn(`  - Base stat ${effect.stat} not found or inaccessible`);
                                 }
                             } else {
                                 // Modify the current operational stat using the character's method
                                 console.log(`  - Modifying operational stat ${effect.stat} using applyStatModification`);
                                 character.applyStatModification(effect.stat, operation, effect.value);
                             }
                             character.recalculateStats(); // Recalculate after stat changes // Line ~1823
                         } else {
                             console.warn(`  - Invalid stat modification effect:`, effect);
                         }
                         break;

                    case 'modify_ability':
                        const abilityToModify = character.abilities.find(a => a.id === effect.abilityId);
                        if (abilityToModify) {
                            console.log(`  - Storing modifier for ability ${effect.abilityId}: { ${effect.property}: ${effect.value} }`);
                            // Store the modification details on the ability instance itself
                            abilityToModify.talentModifiers = abilityToModify.talentModifiers || {};
                            abilityToModify.talentModifiers[effect.property] = effect.value;
                            
                            // IMPORTANT: Also directly modify the ability property value
                            // This ensures the cooldown and other properties are updated immediately
                            abilityToModify[effect.property] = effect.value;
                            console.log(`  - DIRECT MODIFICATION: Set ${effect.abilityId} ${effect.property} to ${effect.value}`);

                            // --- NEW: Regenerate description HERE --- 
                            if (typeof abilityToModify.generateDescription === 'function') {
                                abilityToModify.generateDescription(); // Generate description right after direct modification
                                console.log(`  - Regenerated description for ${effect.abilityId} after direct talent application.`);
                            }
                            // --- END NEW ---
                        } else {
                            console.warn(`  - Ability ${effect.abilityId} not found on character.`);
                        }
                        break;

                    case 'modify_passive':
                        if (character.passive && character.passive.id === effect.passiveId) {
                            console.log(`  - Modifying passive ${effect.passiveId}.${effect.property} to ${effect.value}`);
                            // Store the modification details on the character's passive data object.
                            // The passive handler (if it exists) should read from this updated data.
                            character.passive[effect.property] = effect.value;
                            // Optionally, notify the handler if it's already initialized and needs to react immediately
                            if (character.passiveHandler && typeof character.passiveHandler.onTalentModified === 'function') {
                                character.passiveHandler.onTalentModified(effect.property, effect.value);
                            }
                        } else {
                            console.warn(`  - Passive ${effect.passiveId} not found or ID mismatch.`);
                        }
                        break;

                    case 'add_ability':
                        // ... existing add_ability logic ...
                        break;

                    case 'modify_character_property': // Add this case
                        if (effect.property && effect.value !== undefined) {
                            character[effect.property] = effect.value;
                            console.log(`[CharFactory]   - Applying Character Property: ${talent.name} set ${effect.property} to ${effect.value}`);

                            // Specific handling for Farmer Shoma's passive description update
                            if (character.id === 'farmer_shoma' && character.passive) {
                                if (effect.property === 'passiveCritBoostValue') {
                                    // Update description for crit value change
                                    const triggerTurn = character.passiveTriggerTurn || 20; // Get current trigger turn
                                    character.passive.description = `You start with 50% crit chance, increased to ${effect.value * 100}% after turn ${triggerTurn}.`;
                                    console.log(`[CharFactory]     - Updated ${character.name}'s passive description for crit boost value.`);
                                } else if (effect.property === 'passiveTriggerTurn') {
                                    // Update description for trigger turn change
                                    const critBoost = character.passiveCritBoostValue || 0.7; // Get current crit boost
                                    character.passive.description = `You start with 50% crit chance, increased to ${critBoost * 100}% after turn ${effect.value}.`;
                                    console.log(`[CharFactory]     - Updated ${character.name}'s passive description for trigger turn.`);
                                }
                            }
                        } else {
                            console.warn(`[CharFactory] Invalid modify_character_property effect for talent ${talentId}:`, effect);
                        }
                        break;

                    default:
                        console.warn(`[CharFactory] Unknown talent effect type: ${effect.type} for talent ${talentId}`);
                }
            }); // End of effects.forEach
        }); // End of selectedTalentIds.forEach

        // After applying all talents, maybe recalculate stats?
        // character.recalculateStats(); // Uncomment if necessary
    },

    // --- End Apply Talents Logic ---

    // Helper for handling hardcoded passive classes if PassiveFactory fails
    checkHardcodedPassives(passiveId) {
        if (passiveId === 'schoolboy_siegfried_passive' && typeof SchoolboySiegfriedPassive !== 'undefined') {
            return SchoolboySiegfriedPassive;
        } else if (passiveId === 'schoolgirl_julia_passive' && typeof SchoolgirlJuliaPassive !== 'undefined') {
            return SchoolgirlJuliaPassive;
        } else if (passiveId === 'schoolgirl_ayane_passive' && typeof SchoolgirlAyanePassive !== 'undefined') {
            return SchoolgirlAyanePassive;
        } else if (passiveId === 'schoolgirl_elphelt_passive' && typeof SchoolgirlElpheltPassive !== 'undefined') {
            return SchoolgirlElpheltPassive;
        } else if (passiveId === 'infernal_astaroth_passive' && typeof InfernalAstarothPassive !== 'undefined') {
            return InfernalAstarothPassive;
        } else if (passiveId === 'lifesteal_on_stun' && typeof InfernalBirdiePassive !== 'undefined') { // Assuming InfernalBirdiePassive handles this ID
            return InfernalBirdiePassive;
        } else if (passiveId === 'farmer_lifesteal' && typeof FarmerChamChamPassive !== 'undefined') { // Assuming FarmerChamChamPassive handles this ID
            return FarmerChamChamPassive;
        } else if (passiveId === 'farmer_raiden_zap' && typeof FarmerRaidenPassive !== 'undefined') { // Assuming FarmerRaidenPassive handles this ID
             return FarmerRaidenPassive;
        }
        // --- NEW: Add Bridget Passive Check ---
        else if (passiveId === 'bridget_passive' && typeof BridgetPassive !== 'undefined') {
            return BridgetPassive;
        }
        // --- ADD RENEE PASSIVE --- 
        else if (passiveId === 'renee_passive' && typeof ReneePassive !== 'undefined') {
            return ReneePassive;
        }
        // --- ADD FARMER FANG PASSIVE --- 
        else if (passiveId === 'fang_full_heal_ally' && typeof FarmerFangPassive !== 'undefined') {
            return FarmerFangPassive;
        }
        // --- END FARMER FANG PASSIVE ---
        // --- END RENEE PASSIVE ---
        // --- END NEW ---
        // Add other hardcoded checks here if necessary
        return null;
    },
    // --- END NEW HELPER ---

    // Load character data from file 
    async loadCharacterData(characterId) {
        // --- MODIFIED: Now primarily for charData, talent data loaded separately ---
        try {
            const response = await fetch(`js/raid-game/characters/${characterId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load character data for ${characterId}`);
            }
            const data = await response.json();
            return data; // Return only character data
        } catch (error) {
            console.error(`Error loading character: ${error.message}`);
            return null;
        }
    },

    // Get a list of available characters from the character registry
    async getAvailableCharacters() {
        try {
            const response = await fetch('js/raid-game/character-registry.json');
            if (!response.ok) {
                throw new Error('Failed to load character registry');
            }
            const data = await response.json();
            
            // Filter out locked characters
            const availableCharacters = (data.characters || []).filter(char => !char.locked);
            console.log(`[CharacterFactory] Found ${availableCharacters.length} available non-locked characters out of ${data.characters ? data.characters.length : 0} total`);
            return availableCharacters;
        } catch (error) {
            console.error(`Error loading character registry: ${error.message}`);
            return [];
        }
    }
};

// Ability factory for creating abilities
// Add a simple registry for pre-defined abilities
const predefinedAbilities = {};

const AbilityFactory = {
    // Add a registry for pre-defined abilities
    abilityRegistry: {},
    // Add a registry for custom ability effect functions
    registeredEffects: {}, // <<< ADDED THIS PROPERTY

    // <<< NEW: Method to register custom effect functions >>>
    registerAbilityEffect(effectName, effectFunction) {
        if (!effectName || typeof effectName !== 'string') {
            console.error('[AbilityFactory] Invalid effectName provided to registerAbilityEffect');
            return;
        }
        if (!effectFunction || typeof effectFunction !== 'function') {
            console.error(`[AbilityFactory] Invalid effectFunction provided for effectName '${effectName}'`);
            return;
        }
        if (this.registeredEffects[effectName]) {
            console.warn(`[AbilityFactory] Overwriting existing effect function for: '${effectName}'`);
        }
        this.registeredEffects[effectName] = effectFunction;
        console.log(`[AbilityFactory @ character.js] Registered custom effect: '${effectName}'`);
    },
    // <<< END NEW >>>

    // Helper to clear the registry if needed (e.g., for testing or reloading)
    clearRegistry() {
        this.abilityRegistry = {};
        console.log("Ability registry cleared.");
    },

    // Function to create a character object
    createCharacter(charData) {
        // Check if a custom class exists for this character type
        if (CharacterFactory.customCharacterClasses[charData.id]) {
            console.log(`Creating character ${charData.name || charData.id} using custom character class`);
            // --- FIXED: Pass individual arguments from charData --- 
            return new CharacterFactory.customCharacterClasses[charData.id](
                charData.id,
                charData.name,
                charData.image,
                { ...charData.stats }, // Pass a copy of stats
                charData.abilities || [], // Pass abilities array or empty
                charData.passives || []  // Pass passives array or empty
            );
            // --- END FIX ---
        }

        // Otherwise, use the base Character class
        console.log(`Creating character ${charData.name || charData.id} using base Character class`);
        const character = new Character(
            charData.id,
            charData.name,
            charData.image,
            { ...charData.stats }, // Pass a copy of stats
            charData.tags || []
        );

        // Add abilities
        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = this.createAbility(abilityData); // Use factory method
                character.addAbility(ability);
            });
        }

        // Add passive if it exists
        if (charData.passive) {
            character.passive = charData.passive; // Store passive definition

            // Attempt to dynamically load and initialize the passive handler
            try {
                const passiveClassName = this.getPassiveClassName(charData.id); // e.g., InfernalAstarothPassive
                const PassiveHandlerClass = window[passiveClassName]; // Access class from global scope
                if (PassiveHandlerClass && typeof PassiveHandlerClass === 'function') {
                    character.passiveHandler = new PassiveHandlerClass();
                    console.log(`Attached ${passiveClassName} handler to ${character.name}`);
                     // Initialize the passive handler (if it has an initialize method)
                     if (typeof character.passiveHandler.initialize === 'function') {
                         console.log(`Initializing passive handler for ${character.name}`);
                         character.passiveHandler.initialize(character); // Pass character instance
                     } else {
                          console.warn(`Passive handler ${passiveClassName} for ${character.name} does not have an initialize method.`);
                     }
                } else {
                     console.warn(`Passive handler class '${passiveClassName}' not found for ${character.name}`);
                }
            } catch (error) {
                console.error(`Error attaching passive handler for ${character.name}:`, error);
            }
        }

        // Assign base stats for reference
        character.baseStats = { ...charData.stats };

        // Initialize current HP/Mana
        character.stats.currentHp = character.stats.maxHp;
        character.stats.currentMana = character.stats.maxMana;

        return character;
    },

    // Helper to generate expected passive class name
    getPassiveClassName(characterId) {
        // Convert character ID to a pascal case class name
        const parts = characterId.split('_');
        const className = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + 'Passive';
        return className;
        
        // Examples:
        // infernal_astaroth -> InfernalAstarothPassive
        // schoolgirl_julia -> SchoolgirlJuliaPassive
        // farmer_raiden -> FarmerRaidenPassive
    },

    // Load character data from JSON
    async loadCharacterData(characterId) {
        try {
            const response = await fetch(`js/raid-game/characters/${characterId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not load character data for ${characterId}:`, error);
            return null;
        }
    },

    // --- NEW: Get available characters from registry ---
    async getAvailableCharacters() {
        try {
             const response = await fetch('js/raid-game/character-registry.json');
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             const registry = await response.json();
             
             // Filter out locked characters
             const availableCharacters = (registry.characters || []).filter(char => !char.locked);
             console.log(`[AbilityFactory] Found ${availableCharacters.length} available non-locked characters out of ${registry.characters ? registry.characters.length : 0} total`);
             return availableCharacters;
        } catch (error) {
             console.error('Could not load character registry:', error);
             return []; // Return empty array on error
        }
    },

    // New function to register pre-defined abilities
    registerAbilities(abilities) {
        if (!Array.isArray(abilities)) {
            console.error("registerAbilities expects an array.");
            return;
        }
        abilities.forEach(ability => {
            if (ability && ability.id && ability instanceof Ability) { // Check if it's an Ability instance
                // Use the new registry
                this.abilityRegistry[ability.id] = ability;
                console.log(`[AbilityFactory] Registered pre-defined ability: ${ability.id}`);
            } else {
                console.error("[AbilityFactory] Attempted to register an invalid or non-Ability object.", ability);
            }
        });
    },

    createAbility(abilityData) {
        // Check the registry first
        if (this.abilityRegistry[abilityData.id]) {
            console.log(`[AbilityFactory] Using pre-registered ability object for: ${abilityData.id}`);
            const registeredAbility = this.abilityRegistry[abilityData.id];
            
            console.log(`[AbilityFactory] ${abilityData.id} initial state - baseDescription: "${registeredAbility.baseDescription}", description: "${registeredAbility.description}"`);
            
            // Ensure baseDescription is set from original JSON description if not already present
            if (!registeredAbility.baseDescription && abilityData.description) {
                console.log(`[AbilityFactory] Setting baseDescription for registered ability ${abilityData.id} from JSON description.`);
                registeredAbility.baseDescription = abilityData.description;
            }
            // Ensure description is also initialized
            if (!registeredAbility.description && registeredAbility.baseDescription) {
                registeredAbility.description = registeredAbility.baseDescription;
            }
             // Try to attach character-specific generateDescription if available
            if (typeof window.getReneeAbilityGenerateDescription === 'function' && abilityData.id.startsWith('renee_')) {
                const customGenerateDescription = window.getReneeAbilityGenerateDescription(abilityData.id);
                if (customGenerateDescription) {
                    console.log(`[AbilityFactory] Attaching Renée-specific generateDescription to registered ${abilityData.id}`);
                    registeredAbility.generateDescription = customGenerateDescription;
                }
            }
            // Ensure description is generated if a custom method was attached or if it's missing
            if (typeof registeredAbility.generateDescription === 'function' && (!registeredAbility.description || registeredAbility.description === registeredAbility.baseDescription) ) {
                console.log(`[AbilityFactory] Calling generateDescription for ${abilityData.id}`);
                 registeredAbility.generateDescription();
            }

            console.log(`[AbilityFactory] ${abilityData.id} final state - description: "${registeredAbility.description}"`);
            return registeredAbility;
        }

        // If not pre-defined, create it using the generic method
        console.log(`[AbilityFactory] Creating generic ability for: ${abilityData.id} (Type: ${abilityData.type || 'N/A'})`);
        const ability = new Ability(
            abilityData.id,
            abilityData.name || 'Unnamed Ability', // Add default name
            abilityData.icon,
            abilityData.manaCost,
            abilityData.cooldown,
            this.getAbilityEffect(abilityData) // Generate effect based on type
        );

        // --- BEGIN MODIFICATION: Copy additional properties and robustly set baseDescription ---
        const propertiesToCopy = [
            // 'baseDescription', // We handle this explicitly below
            // 'description', // We handle this explicitly below
            'targetType', 'type', 'functionName',
            'baseDamage', 'damageScaling', 'healing', 'duration', 'buffValue',
            'debuffValue', 'chance', 'numProjectiles', 'aoeModifier', 'fixedDamage',
            'damageType', 'scalingStat', 'targetMaxHpMultiplier', 'effectFunctionName',
            'isPlaceholder', 'placeholderAbility', 'unlockLevel', 'tags',
            'numberOfBeamsMin', 'numberOfBeamsMax', 'doesNotEndTurn'
        ];

        // Debug logging for blazing_lightning_ball specifically
        if (abilityData.id === 'blazing_lightning_ball') {
            console.log(`[AbilityFactory Debug] Processing blazing_lightning_ball`);
            console.log(`[AbilityFactory Debug] abilityData keys:`, Object.keys(abilityData));
            console.log(`[AbilityFactory Debug] abilityData.doesNotEndTurn:`, abilityData.doesNotEndTurn);
            console.log(`[AbilityFactory Debug] hasOwnProperty('doesNotEndTurn'):`, abilityData.hasOwnProperty('doesNotEndTurn'));
            console.log(`[AbilityFactory Debug] typeof doesNotEndTurn:`, typeof abilityData.doesNotEndTurn);
        }

        for (const prop of propertiesToCopy) {
            if (abilityData.hasOwnProperty(prop)) {
                ability[prop] = abilityData[prop];
                // Debug logging for doesNotEndTurn specifically
                if (prop === 'doesNotEndTurn') {
                    console.log(`[AbilityFactory Debug] Copying ${prop} for ${abilityData.id}: ${abilityData[prop]} -> ${ability[prop]}`);
                }
            }
        }

        // Final check for blazing_lightning_ball
        if (abilityData.id === 'blazing_lightning_ball') {
            console.log(`[AbilityFactory Debug] Final ability.doesNotEndTurn:`, ability.doesNotEndTurn);
        }
        
        // Robustly set baseDescription and initial description
        if (abilityData.baseDescription) {
            ability.baseDescription = abilityData.baseDescription;
        } else if (abilityData.description) {
            console.log(`[AbilityFactory] Setting baseDescription for NEW ability ${abilityData.id} from JSON description.`);
            ability.baseDescription = abilityData.description;
        } else {
            console.warn(`[AbilityFactory] NEW ability ${abilityData.id} has no baseDescription or description in data. Defaulting.`);
            ability.baseDescription = `Default base for ${ability.name || ability.id}`;
        }
        
        // Set initial description to be the base description
        ability.description = ability.baseDescription;

        // --- END MODIFICATION ---

        // Ensure cooldown is properly initialized (can be after copying if not in propertiesToCopy)
        ability.currentCooldown = 0;

        // Call setDescription if abilityData.description exists and baseDescription was set from it,
        // OR if abilityData.baseDescription was used. This will trigger generateDescription.
        // The goal is to ensure generateDescription runs once AFTER baseDescription is solidly set.
        // However, the generic Ability.prototype.generateDescription is very basic.
        // Character-specific generateDescription methods are needed for talent text.

        // Try to attach character-specific generateDescription if available
        if (typeof window.getReneeAbilityGenerateDescription === 'function' && ability.id.startsWith('renee_')) {
            const customGenerateDescription = window.getReneeAbilityGenerateDescription(ability.id);
            if (customGenerateDescription) {
                console.log(`[AbilityFactory] Attaching Renée-specific generateDescription to NEW ${ability.id}`);
                ability.generateDescription = customGenerateDescription;
                 // Call it once to initialize the description with potential talent text structure
                ability.generateDescription();
            } else {
                console.warn(`[AbilityFactory] Could not get Renée-specific generateDescription for ${ability.id}`);
                // If no custom one, and if a description was in abilityData, ensure it's processed.
                 if (abilityData.description && typeof ability.setDescription === 'function') {
                    ability.setDescription(abilityData.description); //This will use the (potentially generic) generateDescription
                } else if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                }
            }
        } else if (abilityData.description && typeof ability.setDescription === 'function') {
            // For non-Renée abilities or if Renée's specific generator isn't found
             ability.setDescription(abilityData.description);
        } else if (typeof ability.generateDescription === 'function') {
            // Fallback if no description in data but generateDescription exists
            ability.generateDescription();
        }


        return ability;
    },

    getAbilityEffect(abilityData) {
        // Check for placeholder abilities which might not have a type
        if (abilityData.placeholderAbility || abilityData.isPlaceholder) { // Added isPlaceholder check for consistency
             console.log(`Ability ${abilityData.id} is a placeholder.`);
             return (caster, target) => {
                 const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                 log(`${abilityData.name} cannot be used directly (Placeholder).`);
            };
        }

        // --- NEW: Check for registered custom effect FIRST --- 
        if (this.registeredEffects[abilityData.id]) {
            console.log(`[AbilityFactory] Prioritizing registered custom effect function for ability ID: '${abilityData.id}'`);
            // Return the registered function directly. It already expects (caster, targetOrTargets)
            return this.registeredEffects[abilityData.id]; // Return the function, don't call it
        }
        // --- END NEW ---
        
        // Handle 'custom' type by looking up the registered effect function (LEGACY/ALTERNATIVE WAY?)
        // This might become redundant if we prioritize by ID above, but keep for now.
        if (abilityData.type === 'custom') {
            // --- FIXED: Use the correct property name from JSON --- 
            const customFunctionName = abilityData.functionName; // Use 'functionName' instead of 'effectFunctionName'
            // --- END FIX ---
            if (customFunctionName && this.registeredEffects[customFunctionName]) {
                console.log(`[AbilityFactory] Found registered custom effect function by name: '${customFunctionName}'`);
                const actualEffectFunction = this.registeredEffects[customFunctionName]; 
                // Ensure the function returned matches the expected signature (caster, targetOrTargets)
                return (caster, targetOrTargets) => {
                    // Call the custom function and return its result
                    return actualEffectFunction(caster, targetOrTargets, abilityData); 
                };
            } else {
                console.error(`Custom ability function name '${customFunctionName || 'UNKNOWN'}' not found or not registered via AbilityFactory.registerAbilityEffect for ability ${abilityData.id}.`);
                return (caster, target) => {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`Error: Configuration error for custom ability ${abilityData.name}. Missing or unregistered functionName: ${customFunctionName || 'Not specified'}.`);
                };
            }
        }

        // Map standard ability types to their implementation functions
        const effectImplementations = {
            'damage': this.createDamageEffect,
            'heal': this.createHealEffect,
            'healing': this.createHealingEffectFromData, // New specialized healing type
            'buff': this.createBuffEffect,
            'debuff': this.createDebuffEffect,
            'aoe_damage': this.createAoEDamageEffect,
            'aoe_heal': this.createAoEHealEffect,
            'lifesteal': this.createLifestealEffect,
            'summon': this.createSummonEffect, 
        };

        const effectCreator = effectImplementations[abilityData.type];
        if (!effectCreator) {
            console.error(`Unknown or missing ability type for non-placeholder ability: ${abilityData.id}, Type: ${abilityData.type}`);
            return (caster, target) => {
                 const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                 log(`${caster.name} used an ability (${abilityData.name}) with an unknown or missing type.`);
            };
        }

        // Call the appropriate createXEffect function, binding `this` context
        return effectCreator.call(this, abilityData);
    },

    createDamageEffect(abilityData) {
        const damageType = abilityData.damageType || 'physical';
        const baseDamage = abilityData.fixedDamage; // Fixed damage amount
        const damageMultiplier = abilityData.amount; // Multiplier of stats (e.g., 1.5 for 150%)
        const scalingStat = abilityData.scalingStat || (damageType === 'magical' ? 'magicalDamage' : 'physicalDamage'); // Stat to scale with
        const targetMaxHpMultiplier = abilityData.targetMaxHpMultiplier; // Multiplier based on target's max HP

        // --- Updated effect function to accept options --- 
        return (caster, target, options = {}) => { 
            if (!target || target.isDead()) return; // Basic validation
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            let calculatedDamage = 0;
            
            if (baseDamage !== undefined) {
                calculatedDamage = baseDamage;
            } else if (damageMultiplier !== undefined) {
                calculatedDamage = Math.floor((caster.stats[scalingStat] || 0) * damageMultiplier);
            } else {
                log(`Ability ${abilityData.name || abilityData.id} has invalid damage definition.`, 'error');
                return; // Exit if no valid damage source
            }
            
            // Add damage based on target's max HP if applicable
            if (targetMaxHpMultiplier !== undefined) {
                calculatedDamage += Math.floor((target.stats.maxHp || 0) * targetMaxHpMultiplier);
            }

            // --- Apply Talent Modifiers --- 
            let finalDamageAmount = calculatedDamage;
            const talentMods = options.talentModifiers || {};
            
            // Check for general damage mods or specific type mods
            const damageMod = talentMods.damage || talentMods[`${damageType}Damage`];
            if (damageMod) {
                // Apply multiplicative mods first
                finalDamageAmount *= (damageMod.multiply || 1);
                // Then apply additive mods
                finalDamageAmount += (damageMod.add || 0);
                finalDamageAmount = Math.floor(finalDamageAmount); // Round down after mods
                console.log(`[Ability ${abilityData.id}] Damage modified by talents: Base=${calculatedDamage}, Final=${finalDamageAmount}, Mods=`, damageMod);
            } else {
                console.log(`[Ability ${abilityData.id}] No talent damage modifiers found.`);
            }
            // --- End Talent Modifiers --- 

            // Apply the final calculated damage
            const result = target.applyDamage(finalDamageAmount, damageType, caster, options);

            let message = `${caster.name} used ${abilityData.name || abilityData.id} on ${target.name}, dealing ${result.damage} ${damageType} damage.`;
            if (result.isCritical) {
                message += " (Critical Hit!)";
            }
            log(message);
            
            // Handle debuffs if defined
            if (abilityData.debuffEffect) {
                 if (!abilityData.debuffEffect.chance || Math.random() < abilityData.debuffEffect.chance) {
                     // Clone the effect definition to avoid modifying the original
                     const debuffInstance = { ...abilityData.debuffEffect };
                     target.addDebuff(debuffInstance);
                     log(`${target.name} is affected by ${debuffInstance.name}!`);
                 } else {
                      log(`${abilityData.name || abilityData.id} failed to apply ${abilityData.debuffEffect.name} to ${target.name}.`);
                 }
            }
            
            // Handle specific character passive triggers (like Shoma's crit chance increase)
            // This should ideally be moved to a more structured passive system/event listener
            if (abilityData.id === 'boink' && caster.id === 'schoolboy_shoma') {
                if (Math.random() < 0.50) { // 50% chance
                    // Increase crit chance via talent stat modification structure
                    caster.applyStatModification('critChance', 'add', 0.05); 
                    caster.recalculateStats(); // Recalculate stats immediately
                    log(`${caster.name}'s focus sharpens! Crit Chance increased by 5%!`);
                    // Need to update UI if stats change mid-turn
                    if (window.updateCharacterUI) window.updateCharacterUI(caster);
                }
            }

            // Check death after applying effects
            if (target.isDead()) {
                log(`${target.name} has been defeated!`);
                if (window.gameManager) {
                    window.gameManager.handleCharacterDeath(target);
                }
            }
        };
        // --- End Update --- 
    },

    createHealEffect(abilityData) {
        return (caster, targetOrTargets, abilityObject, actualManaCost, options = {}) => {
            // This effect type expects a single target
            if (Array.isArray(targetOrTargets)) {
                console.warn(`[AbilityFactory] Heal effect (${abilityData.name}) received an array, expects single target. Using first.`);
                targetOrTargets = targetOrTargets[0];
            }
            const target = targetOrTargets;
            if (!target || typeof target.heal !== 'function') {
                 console.error(`[AbilityFactory] Invalid target for heal effect (${abilityData.name}):`, target);
                 return;
            }

            // --- MODIFIED: Read healAmount instead of amount ---
            const baseAmount = abilityData.healAmount || 1;
            // Healing power is now applied inside the Character.heal method
            // const healAmount = Math.floor(baseAmount * (1 + (caster.stats.healingPower || 0)));
            const healAmount = baseAmount; 
            // --- END MODIFICATION ---

            // --- MODIFIED: Pass caster and abilityId to heal method ---
            const healOptions = {
                ...options,
                abilityId: abilityData.id
            };
            const result = target.heal(healAmount, caster, healOptions);
            const actualHeal = result.healAmount;
            const isCritical = result.isCritical;
            // --- END MODIFICATION ---

            // Log message handled inside heal method if critical
            if (!isCritical) {
                addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, healing for ${actualHeal} HP.`, 'heal');
            }

            // Hook for passive handlers on dealing heal
            if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                caster.passiveHandler.onHealDealt(caster, target, actualHeal, isCritical); // Pass isCritical flag
            }
            // Update UI for the healed target
            updateCharacterUI(target);
        };
    },

    // Specialized healing effect for abilities with "type": "healing" and effects.healing config
    createHealingEffectFromData(abilityData) {
        return (caster, targetOrTargets, abilityObject, actualManaCost, options = {}) => {
            const healingConfig = abilityData.effects?.healing;
            if (!healingConfig) {
                console.error(`[AbilityFactory] Healing ability ${abilityData.name} missing healing config in effects`);
                return;
            }

            // Determine if this is AoE healing based on target type
            const isAoE = abilityData.targetType === 'self' && abilityData.name.toLowerCase().includes('circle');
            
            if (isAoE) {
                // Handle AoE healing (like Circle Heal)
                let targets = [];
                if (window.gameManager && window.gameManager.gameState) {
                    // Get all living allies for AoE heal
                    targets = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
                }
                
                if (targets.length === 0) {
                    addLogEntry(`${caster.name} used ${abilityData.name}, but there were no valid targets.`);
                    return;
                }

                let totalActualHeal = 0;
                let anyCritical = false;
                
                addLogEntry(`${caster.name} used ${abilityData.name}, healing all allies!`);
                
                targets.forEach(target => {
                    // Calculate heal amount: fixed + MD scaling
                    let healAmount = healingConfig.fixedAmount || 0;
                    if (healingConfig.magicalDamagePercent) {
                        healAmount += Math.floor((caster.stats.magicalDamage || 0) * healingConfig.magicalDamagePercent);
                    }
                    
                    // Apply the healing with abilityId for statistics
                    const healOptions = {
                        ...options,
                        abilityId: abilityData.id
                    };
                    const result = target.heal(healAmount, caster, healOptions);
                    const actualHeal = result.healAmount;
                    const isCritical = result.isCritical;
                    
                    if (actualHeal > 0) {
                        if (!isCritical) {
                            addLogEntry(`${target.name} is healed for ${actualHeal} HP.`, 'heal');
                        }
                        if (isCritical) anyCritical = true;
                        totalActualHeal += actualHeal;
                        updateCharacterUI(target);
                    }
                });

                // Hook for passive handlers
                if (totalActualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                    caster.passiveHandler.onHealDealt(caster, targets, totalActualHeal, anyCritical);
                }
            } else {
                // Handle single target healing (like Lesser Heal)
                let target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
                
                if (!target || typeof target.heal !== 'function') {
                    console.error(`[AbilityFactory] Invalid target for healing effect (${abilityData.name}):`, target);
                    return;
                }

                // Calculate heal amount: fixed + MD scaling
                let healAmount = healingConfig.fixedAmount || 0;
                if (healingConfig.magicalDamagePercent) {
                    healAmount += Math.floor((caster.stats.magicalDamage || 0) * healingConfig.magicalDamagePercent);
                }
                
                // Apply the healing with abilityId for statistics
                const healOptions = {
                    ...options,
                    abilityId: abilityData.id
                };
                const result = target.heal(healAmount, caster, healOptions);
                const actualHeal = result.healAmount;
                const isCritical = result.isCritical;

                // Log message handled inside heal method if critical
                if (!isCritical) {
                    addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, healing for ${actualHeal} HP.`, 'heal');
                }

                // Hook for passive handlers on dealing heal
                if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                    caster.passiveHandler.onHealDealt(caster, target, actualHeal, isCritical);
                }
                
                updateCharacterUI(target);
            }
        };
    },

    createBuffEffect(abilityData) {
        return (caster, targetOrTargets) => {
            // This effect type expects a single target
            if (Array.isArray(targetOrTargets)) {
                console.warn(`[AbilityFactory] Buff effect (${abilityData.name}) received an array, expects single target. Using first.`);
                targetOrTargets = targetOrTargets[0];
            }
            const target = targetOrTargets;
            if (!target || typeof target.addBuff !== 'function') {
                 console.error(`[AbilityFactory] Invalid target for buff effect (${abilityData.name}):`, target);
                 return;
            }

            // --- MODIFICATION START: Read from abilityData.buffEffect --- 
            const buffDetails = abilityData.buffEffect;
            if (!buffDetails) {
                console.error(`[AbilityFactory] Missing 'buffEffect' details in abilityData for ${abilityData.name}`);
                return; // Cannot create buff without details
            }

            // Create the buff effect using details from buffDetails
            const buff = new Effect(
                buffDetails.buffId || `buff_${abilityData.name}_${Date.now()}`, // Use buffId from details
                buffDetails.name || abilityData.name, // Prefer buff name, fallback to ability name
                abilityData.icon, // Icon usually comes from abilityData
                buffDetails.duration || 3,
                null, // Per-turn effect logic handled elsewhere
                false // isDebuff = false
            );

            // Add description (can come from ability or buff details)
            buff.setDescription(buffDetails.description || abilityData.description || `A positive effect from ${abilityData.name}.`);

            // Add stat modifiers if they exist in buffDetails
            if (buffDetails.statModifiers) {
                // Preserve array structure for statModifiers
                if (Array.isArray(buffDetails.statModifiers)) {
                    buff.statModifiers = [...buffDetails.statModifiers];
                } else {
                    // Handle legacy object format
                    buff.statModifiers = { ...buffDetails.statModifiers };
                }
            }
            
            // Add custom effects/flags if they exist in buffDetails
            if (buffDetails.effects) {
                buff.effects = { ...buffDetails.effects };
                
                // Convert certain effects to stat modifiers for proper processing
                if (!buff.statModifiers) {
                    buff.statModifiers = [];
                }
                
                // Ensure statModifiers is an array
                if (!Array.isArray(buff.statModifiers)) {
                    buff.statModifiers = [buff.statModifiers];
                }
                
                // Convert dodgeChance effect to stat modifier
                if (typeof buffDetails.effects.dodgeChance === 'number') {
                    buff.statModifiers.push({
                        stat: 'dodgeChance',
                        value: buffDetails.effects.dodgeChance,
                        operation: 'set' // Set to the exact value (100% = 1.0)
                    });
                    console.log(`[CreateBuffEffect] Converted dodgeChance effect (${buffDetails.effects.dodgeChance}) to stat modifier for ${buffDetails.name || abilityData.name}`);
                }
                
                // Can add more effect-to-statModifier conversions here if needed
                // e.g., if (buffDetails.effects.critChance) { ... }
            }
            // --- MODIFICATION END ---

            // Add the buff to the target
            // Set tracking properties for statistics
            buff.appliedBy = caster;
            buff.abilityId = abilityData.id;

            target.addBuff(buff);
            addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, applying ${buff.name} for ${buff.duration} turns.`);

            // Play sound for specific buff abilities
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            if (abilityData.id === 'catch') { // Shoma's E
                playSound('sounds/shomaa2.mp3');
            }
            // Update target UI
            updateCharacterUI(target);
        };
    },

    createDebuffEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects a single target
             if (Array.isArray(targetOrTargets)) {
                 console.warn(`[AbilityFactory] Debuff effect (${abilityData.name}) received an array, expects single target. Using first.`);
                 targetOrTargets = targetOrTargets[0];
             }
             const target = targetOrTargets;
             if (!target || typeof target.addDebuff !== 'function') {
                  console.error(`[AbilityFactory] Invalid target for debuff effect (${abilityData.name}):`, target);
                  return;
             }

            // --- MODIFICATION START: Read from abilityData.debuffEffect --- 
            const debuffDetails = abilityData.debuffEffect;
            if (!debuffDetails) {
                console.error(`[AbilityFactory] Missing 'debuffEffect' details in abilityData for ${abilityData.name}`);
                return; // Cannot create debuff without details
            }

            // Create the debuff effect using details from debuffDetails
            const debuff = new Effect(
                debuffDetails.debuffId || `debuff_${abilityData.name}_${Date.now()}`, // Use debuffId from details
                debuffDetails.name || abilityData.name, // Prefer debuff name, fallback to ability name
                abilityData.icon, // Icon usually comes from abilityData
                debuffDetails.duration || 3,
                null, // Per-turn effect logic handled elsewhere
                true // isDebuff = true
            );

            // Add description
            debuff.setDescription(debuffDetails.description || abilityData.description || `A negative effect from ${abilityData.name}.`);

             // Add stat modifiers if they exist in debuffDetails
             if (debuffDetails.statModifiers) {
                 debuff.statModifiers = { ...debuffDetails.statModifiers };
             }
             // Add custom effects/flags if they exist in debuffDetails
              if (debuffDetails.effects) {
                  debuff.effects = { ...debuffDetails.effects };
              }
              // Add DOT info if it exists in debuffDetails
               if (debuffDetails.damageOverTime) {
                   debuff.damageOverTime = debuffDetails.damageOverTime;
                   debuff.dotType = debuffDetails.dotType || 'magical';
               }
            // --- MODIFICATION END ---

            // Set tracking properties for statistics
            debuff.appliedBy = caster;
            debuff.abilityId = abilityData.id;

            // Apply the debuff to the target
            target.addDebuff(debuff);
            addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, applying ${debuff.name} for ${debuff.duration} turns.`);

             // Update target UI
             updateCharacterUI(target);
        };
    },

    createAoEDamageEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects an array of targets
             let targets = [];
             if (Array.isArray(targetOrTargets)) {
                 targets = targetOrTargets;
             } else if (targetOrTargets) {
                 console.warn(`[AbilityFactory] AoE Damage effect (${abilityData.name}) received single target, expected array. Wrapping.`);
                 targets = [targetOrTargets]; // Wrap single target in an array
             } 
 
             if (targets.length === 0) {
                 addLogEntry(`${caster.name} used ${abilityData.name}, but there were no valid targets.`);
                 return; // No targets to affect
             }
             
            // --- Corrected Damage Calculation ---
            const effectConfig = abilityData.effects.aoe_damage; // Access the nested config
            const damageType = effectConfig.damageType || 'magical'; // Read from effectConfig
            const statToUse = damageType === 'physical' ? 'physicalDamage' : 'magicalDamage';
            const statPercent = damageType === 'physical' ? effectConfig.physicalDamagePercent : effectConfig.magicalDamagePercent;
            
            let baseDamage = 0;
            // Add fixed amount if defined
            if (effectConfig.fixedAmount !== undefined) {
                baseDamage += Math.floor(effectConfig.fixedAmount);
            }
            // Add percentage amount if defined
            if (statPercent !== undefined) {
                const statValue = caster.stats[statToUse] || 0;
                baseDamage += Math.floor(statValue * statPercent);
            }
            // --- End Corrected Damage Calculation ---
            
            addLogEntry(`${caster.name} used ${abilityData.name}, targeting ${targets.length} enemies!`);
            
            let totalLifestealHeal = 0;
            let applyLifestealVFX = false;

            // Apply damage to all valid targets in the array
            targets.forEach(target => {
                if (!target || target.isDead() || typeof target.applyDamage !== 'function') return; 

                 // Apply critical hit check per target
                 let currentDamage = baseDamage; // Use the calculated baseDamage
                 let isCritical = false;
                 if (Math.random() < (caster.stats.critChance || 0)) {
                     currentDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
                     isCritical = true;
                 }
                
                 // Apply damage
                const result = target.applyDamage(currentDamage, damageType, caster);
                result.isCritical = isCritical || result.isCritical;
                
                 // Logging
                let message = `${target.name} takes ${result.damage} ${damageType} damage`;
                if (result.isCritical) message += " (Critical Hit!)";
                addLogEntry(message, result.isCritical ? 'critical' : '');

                // Accumulate lifesteal based on actual damage dealt to each target
                // Calculate lifesteal directly instead of calling a non-existent method
                const lifestealFromTarget = Math.floor((caster.stats.lifesteal || 0) * result.damage);
                 if (lifestealFromTarget > 0) {
                     totalLifestealHeal += lifestealFromTarget;
                     applyLifestealVFX = true; // Mark to apply VFX once after the loop
                 }
                
                // Apply Debuff from AoE effect (e.g., Infernal Birdie's stun)
                // Use the abilityData directly passed into createAoEDamageEffect
                if (!result.dodged && abilityData.stun && typeof abilityData.stun === 'object') {
                    const stunChance = abilityData.stun.chance || 0;
                    if (Math.random() < stunChance) {
                        const stunDuration = abilityData.stun.duration || 1;
                        const stunName = abilityData.stun.name || 'Stunned'; // Use provided name or fallback
                        const stunIcon = abilityData.stun.icon || 'Icons/effects/stun.png'; // Use provided icon or fallback

                        // --- MODIFICATION START: Use unique ID for Birdie's stun --- 
                        // Use a specific ID for Birdie's ability to identify it later
                        const isBirdieStun = (caster.id === 'infernal_birdie');
                        const stunDebuffId = isBirdieStun ? 'birdie_internal_stun' : (abilityData.stun.debuffId || 'generic_stun');
                        // --- MODIFICATION END ---

                        // Check if target is already stunned by this specific debuff
                        const existingStun = target.debuffs.find(d => d.id === stunDebuffId);
                        if (existingStun) {
                            // Refresh duration if needed, or just log that they are already stunned
                             // existingStun.duration = Math.max(existingStun.duration, stunDuration); // Option: Refresh to max duration
                             addLogEntry(`${target.name} is already stunned!`);
                        } else {
                            const debuff = new Effect(
                                stunDebuffId, // Use the potentially modified ID
                                stunName,
                                stunIcon,
                                stunDuration,
                                null, // Effects handled by processEffects or isStunned check
                                true  // isDebuff = true
                            );
                            // Add specific properties if needed for stun logic
                            // --- MODIFICATION: Ensure cantAct is set --- 
                            debuff.effects = { cantAct: true }; // Use cantAct for isStunned() check
                            // --- END MODIFICATION ---

                            target.addDebuff(debuff);
                            addLogEntry(`${caster.name}'s ${abilityData.name} stunned ${target.name} for ${stunDuration} turn!`, 'debuff');

                            // --- NEW: Trigger Caster's Lifesteal on Stun Passive ---
                            if (caster.passive && caster.passive.id === 'lifesteal_on_stun' && caster.passiveHandler && typeof caster.passiveHandler.onStunApplied === 'function') {
                                 caster.passiveHandler.onStunApplied(caster, target);
                            }
                            // --- END NEW ---
                        }
                    }
                }

                // Check if target died
                if (target.isDead()) {
                    addLogEntry(`${target.name} has been defeated!`);
                     // Optionally trigger caster's onKill passive
                     if (caster.passiveHandler && typeof caster.passiveHandler.onKill === 'function') {
                         caster.passiveHandler.onKill(caster, target);
                     }
                }
                 // Update target UI
                 updateCharacterUI(target);
            });
            
            // Apply accumulated lifesteal heal to caster once
             if (totalLifestealHeal > 0) {
                 const actualTotalHeal = caster.heal(totalLifestealHeal); // Apply the accumulated heal
                 addLogEntry(`${caster.name} healed for ${actualTotalHeal} from lifesteal.`);
                 // Apply VFX once if needed
                 if (applyLifestealVFX) {
                     const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                     if (casterElement && !casterElement.querySelector('.lifesteal-vfx')) { // Check if VFX isn't already there
                         const lifestealVfx = document.createElement('div');
                         lifestealVfx.className = 'lifesteal-vfx';
                         casterElement.appendChild(lifestealVfx);
                         const healNumber = document.createElement('div');
                         healNumber.className = 'lifesteal-heal-number';
                         healNumber.textContent = `+${actualTotalHeal}`; // Show the actual total heal
                         casterElement.appendChild(healNumber);
                         setTimeout(() => {
                             casterElement.querySelectorAll('.lifesteal-vfx, .lifesteal-heal-number').forEach(el => el.remove());
                         }, 1200);
                     }
                 }
             }
             // Update caster UI after potential lifesteal heal
             updateCharacterUI(caster);
        };
    },

    createAoEHealEffect(abilityData) {
        return (caster, targetOrTargets, abilityObject, actualManaCost, options = {}) => {
             // This effect type expects an array of targets
             let targets = [];
             if (Array.isArray(targetOrTargets)) {
                 targets = targetOrTargets;
             } else if (targetOrTargets) {
                 console.warn(`[AbilityFactory] AoE Heal effect (${abilityData.name}) received single target, expected array. Wrapping.`);
                 targets = [targetOrTargets]; 
             }
 
             if (targets.length === 0) {
                 addLogEntry(`${caster.name} used ${abilityData.name}, but there were no valid targets.`);
                 return; 
             }
            
            const baseAmount = abilityData.amount || 1;
            // Healing power is now applied inside Character.heal
            // const healAmount = Math.floor(baseAmount * (1 + (caster.stats.healingPower || 0)));
            const healAmount = baseAmount;
            let passiveTriggeredThisCast = false; 
            let totalActualHeal = 0;
            let healedTargetsList = [];
            let anyCritical = false;
            
            addLogEntry(`${caster.name} used ${abilityData.name}, healing ${targets.length} allies!`);
            
            // Apply healing to all valid targets
            targets.forEach(target => {
                if (!target || target.isDead() || typeof target.heal !== 'function') return;

                // --- MODIFIED: Pass caster and abilityId to heal method ---
                const healOptions = {
                    ...options,
                    abilityId: abilityData.id
                };
                const result = target.heal(healAmount, caster, healOptions);
                const actualHeal = result.healAmount;
                const isCritical = result.isCritical;
                // --- END MODIFICATION ---

                 if (actualHeal > 0) {
                     // Log message handled inside heal method if critical
                     if (!isCritical) {
                        addLogEntry(`${target.name} is healed for ${actualHeal} HP.`, 'heal');
                     }
                     if (isCritical) anyCritical = true;
                     totalActualHeal += actualHeal;
                     healedTargetsList.push(target);
                     updateCharacterUI(target);
                 }
            });

             // Hook for passive handlers on dealing heal (AoE) - pass list of actually healed targets
             if (totalActualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                 caster.passiveHandler.onHealDealt(caster, healedTargetsList, totalActualHeal, anyCritical); // Pass array, total heal, and if any crit occurred
             }
             // Update caster UI (in case passive affects caster)
             updateCharacterUI(caster);
        };
    },

    createLifestealEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects a single target
             if (Array.isArray(targetOrTargets)) {
                 console.warn(`[AbilityFactory] Lifesteal effect (${abilityData.name}) received an array, expects single target. Using first.`);
                 targetOrTargets = targetOrTargets[0];
             }
             const target = targetOrTargets;
             if (!target || typeof target.applyDamage !== 'function') {
                  console.error(`[AbilityFactory] Invalid target for lifesteal effect (${abilityData.name}):`, target);
                  return; // Return an object indicating failure? Or just return?
             }

            const damageType = abilityData.damageType || 'physical';
            const statToUse = damageType === 'physical' ? 'physicalDamage' : 'magicalDamage';
            
            // Determine damage amount
            let damageAmount;
            if (abilityData.fixedDamage !== undefined) {
                damageAmount = Math.floor(abilityData.fixedDamage);
            } else {
                const multiplier = abilityData.amount || 1;
                 const statValue = caster.stats[statToUse] || 0;
                damageAmount = Math.floor(multiplier * statValue);
            }
            
            // Apply crit
            let isCritical = false;
            if (Math.random() < (caster.stats.critChance || 0)) {
                 damageAmount = Math.floor(damageAmount * (caster.stats.critDamage || 1.5));
                 isCritical = true;
            }

            // Apply damage to target
            const result = target.applyDamage(damageAmount, damageType, caster);
            result.isCritical = isCritical || result.isCritical;

            // Logging damage
            let message = `${caster.name} used ${abilityData.name} on ${target.name} for ${result.damage} ${damageType} damage`;
            if (result.isCritical) message += " (Critical Hit!)";
            addLogEntry(message, result.isCritical ? 'critical' : '');
            
            // Calculate lifesteal amount based on damage dealt
            // Use caster.stats.lifesteal if abilityData doesn't specify a percentage
            const lifestealPercent = abilityData.lifestealPercent !== undefined ? abilityData.lifestealPercent : (caster.stats.lifesteal || 0);
            const lifestealAmount = Math.floor(result.damage * lifestealPercent);
            
            // Apply heal to caster
            if (lifestealAmount > 0) {
                // --- MODIFIED: Pass caster to heal method ---
                const result = caster.heal(lifestealAmount, caster); // Caster heals self, check crit based on own stats
                const actualHeal = result.healAmount;
                const isCritical = result.isCritical;
                // --- END MODIFICATION ---
                // Log handled by heal method if critical
                if (!isCritical) {
                    addLogEntry(`${caster.name} healed for ${actualHeal} from lifesteal.`);
                }
                
                // Add simple lifesteal VFX on the caster
                const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                if (casterElement) {
                    const lifestealVfx = document.createElement('div');
                    lifestealVfx.className = 'lifesteal-vfx'; // Use heal-vfx style?
                    if (isCritical) lifestealVfx.classList.add('critical');
                    casterElement.appendChild(lifestealVfx);
                    
                    const healNumber = document.createElement('div');
                    healNumber.className = 'lifesteal-heal-number'; // Style this specifically or reuse heal-vfx critical?
                    if (isCritical) healNumber.classList.add('critical');
                    healNumber.textContent = `+${actualHeal}`;
                    casterElement.appendChild(healNumber);
                    
                    setTimeout(() => {
                        casterElement.querySelectorAll('.lifesteal-vfx, .lifesteal-heal-number').forEach(el => el.remove());
                    }, 1200);
                }
            }
            
            // Check for Elphelt crit sound (This is for the DAMAGE crit, not the heal crit)
            if (result.isCritical && caster.id === 'schoolgirl_elphelt') {
                 const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                 playSound('sounds/elphelt_go.mp3');
            }

             // Check if target died
             if (target.isDead()) {
                 addLogEntry(`${target.name} has been defeated!`);
             }

             // Update UIs
             updateCharacterUI(caster);
             updateCharacterUI(target);
             
            // Return damage info if needed by specific abilities
            return {
                damage: result.damage,
                isCritical: result.isCritical
            };
        };
    },

    // <<< ADDED SUMMON EFFECT METHOD START >>>
    createSummonEffect(abilityData) {
        return (caster, target) => { // Target might be null or self depending on how it's called
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            const stageManager = window.gameManager ? window.gameManager.stageManager : null;
            
            if (!stageManager) {
                console.error(`[Summon Effect - ${abilityData.name}] Cannot summon: StageManager not found.`);
                log(`${caster.name} failed to summon: Game components not ready.`);
                return;
            }

            const summonDetails = abilityData.summonDetails;
            if (!summonDetails || !summonDetails.characterId) {
                console.error(`[Summon Effect - ${abilityData.name}] Invalid or missing 'summonDetails' in ability data.`);
                log(`${caster.name} failed to summon: Ability configuration error.`);
                return;
            }

            const characterIdToSummon = summonDetails.characterId;
            const count = summonDetails.count || 1;
            const duration = summonDetails.duration; // Optional: duration for the summoned unit
            const modifications = summonDetails.modifications; // Optional: modifications for the summoned unit

            log(`${caster.name} uses ${abilityData.name} to summon ${count} ${characterIdToSummon}(s)!`);

            // Asynchronously summon the character(s)
            (async () => {
                for (let i = 0; i < count; i++) {
                    try {
                        const charData = await CharacterFactory.loadCharacterData(characterIdToSummon);
                        if (!charData) {
                            log(`Failed to load data for summoned unit: ${characterIdToSummon}`);
                            continue;
                        }

                        // Apply modifications if any
                        if (modifications) {
                            stageManager.applyCharacterModifications(charData, modifications);
                        }

                        const summonedCharacter = CharacterFactory.createCharacter(charData);
                        if (!summonedCharacter) {
                             log(`Failed to create summoned unit instance: ${characterIdToSummon}`);
                             continue;
                        }

                        summonedCharacter.isAI = caster.isAI; // Summoned unit joins the caster's side
                        summonedCharacter.isSummoned = true; // Mark as summoned
                        summonedCharacter.summonerId = caster.instanceId || caster.id; // Link to summoner

                        // Assign a unique instance ID
                        const team = summonedCharacter.isAI ? stageManager.gameState.aiCharacters : stageManager.gameState.playerCharacters;
                        summonedCharacter.instanceId = `${summonedCharacter.id}-summon-${Date.now()}-${i}`;

                        // Optional: Set duration (requires handling expiration)
                        if (duration) {
                            summonedCharacter.summonDuration = duration; 
                            // TODO: Implement logic in GameManager or Character.processEffects to remove unit when duration expires.
                        }

                        // Add to the correct team in gameState
                        team.push(summonedCharacter);

                        // Render the new character immediately
                        if (window.gameManager && window.gameManager.uiManager) {
                            window.gameManager.uiManager.renderCharacters(stageManager.gameState.playerCharacters, stageManager.gameState.aiCharacters);
                        }
                        log(`${summonedCharacter.name} (Instance: ${summonedCharacter.instanceId}) was summoned!`);

                        // <<< Dispatch CharacterSummoned event >>>
                        const summonEvent = new CustomEvent('CharacterSummoned', {
                            detail: { character: summonedCharacter }
                        });
                        document.dispatchEvent(summonEvent);
                        // <<< End Dispatch >>>

                    } catch (error) {
                        console.error(`Error summoning unit ${characterIdToSummon}:`, error);
                        log(`An error occurred while summoning ${characterIdToSummon}.`);
                    }
                }
                 // Optionally re-render UI after all summons are done (if renderCharacters isn't called inside loop)
                 // if (window.gameManager && window.gameManager.uiManager) {
                 //    window.gameManager.uiManager.renderCharacters(stageManager.gameState.playerCharacters, stageManager.gameState.aiCharacters);
                 // }
            })();
        };
    }, // <<< ADDED COMMA HERE

    // <<< MOVED THIS METHOD INSIDE >>>
    // Method to register custom effect functions by name
    registerAbilityEffect(effectName, effectFunction) {
        if (typeof effectFunction !== 'function') {
           
            return;
        }
        if (this.registeredEffects[effectName]) {
            
        }
        this.registeredEffects[effectName] = effectFunction;
        
    }
    // <<< END MOVED METHOD >>>
}; // Closing brace for AbilityFactory
  
// <<< ADDED: Make AbilityFactory globally accessible >>>
window.AbilityFactory = AbilityFactory;
// <<< END ADDED >>>
  
window.CharacterFactory = CharacterFactory; // Expose CharacterFactory globally
window.AbilityFactory = AbilityFactory; // Expose AbilityFactory globally
window.Effect = Effect; // Make Effect class globally accessible

// Function to show Zoey-specific dodge VFX
function showZoeyDodgeVFX(character) {
    try {
        if (!character) return;
        
        const characterId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterId}`);
        
        if (!characterElement) {
            console.error(`[ZoeyDodgeVFX] Character element not found for ${characterId}`);
            return;
        }
        
        // Create a container for the dodge effect
        const dodgeContainer = document.createElement('div');
        dodgeContainer.className = 'zoey-dodge-vfx';
        characterElement.appendChild(dodgeContainer);
        
        // Create the DODGE text
        const dodgeText = document.createElement('div');
        dodgeText.className = 'zoey-dodge-text';
        dodgeText.textContent = 'DODGE!';
        dodgeContainer.appendChild(dodgeText);
        
        // Get the image for afterimage effect
        const imageContainer = characterElement.querySelector('.image-container');
        const characterImage = characterElement.querySelector('.character-image');
        
        if (characterImage && characterImage.src) {
            // Create blur effect
            const blurEffect = document.createElement('div');
            blurEffect.className = 'zoey-dodge-blur';
            blurEffect.style.backgroundImage = `url(${characterImage.src})`;
            dodgeContainer.appendChild(blurEffect);
            
            // Create afterimage effect
            const afterImage = document.createElement('div');
            afterImage.className = 'zoey-dodge-afterimage';
            afterImage.style.backgroundImage = `url(${characterImage.src})`;
            dodgeContainer.appendChild(afterImage);
        }
        
        // Play dodge sound
        if (window.gameManager && window.gameManager.playSound) {
            window.gameManager.playSound('sounds/dodge.mp3', 0.5);
        }
        
        // Log the dodge
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(`${character.name}'s feline reflexes allow her to dodge the attack!`, 'zoey talent-effect');
        }
        
        // Remove the dodge effect after animation completes
        setTimeout(() => {
            if (dodgeContainer.parentNode) {
                characterElement.removeChild(dodgeContainer);
            }
        }, 1000);
        
    } catch (error) {
        console.error('[ZoeyDodgeVFX] Error showing dodge VFX:', error);
    }
}

// Make the function available globally
window.showZoeyDodgeVFX = showZoeyDodgeVFX;
  