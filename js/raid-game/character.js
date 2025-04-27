// Character class definition for Roguelike Raid Game
class Character {
    constructor(id, name, image, stats) {
        this.id = id;
        this.name = name;
        this.image = image;
        
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
        console.log(`[Recalc ${this.name}] Called from: ${callerContext}`);
        // <<< END NEW LOG >>>

        // Preserve current resource values
        const preservedCurrentHp = this.stats.currentHp;
        const preservedCurrentMana = this.stats.currentMana;

        // Start with a fresh copy of base stats for recalculation
        this.stats = { ...this.baseStats };

        // --- Apply Buffs/Debuffs --- 
        const activeEffects = [...this.buffs, ...this.debuffs];
        // <<< NEW: Log active effects being processed >>>
        console.log(`[Recalc ${this.name}] Processing ${activeEffects.length} effects:`, activeEffects.map(e => ({ id: e.id, name: e.name, stacks: e.currentStacks })) );
        // <<< END NEW LOG >>>

        activeEffects.forEach(effect => {
            // --- ADDED DEBUG LOG ---
            if (effect.id === 'nurturing_toss_buff') {
                console.log(`[Recalc DEBUG - Nurturing Toss] Inspecting effect: ID=${effect.id}, Stacks=${effect.currentStacks}, StatModifiers=`, JSON.stringify(effect.statModifiers));
            }
            // --- END DEBUG LOG ---

            if (effect.statModifiers) {
                Object.keys(effect.statModifiers).forEach(stat => {
                    if (this.stats[stat] !== undefined) {
                        const modifierValue = effect.statModifiers[stat];
                        if (typeof modifierValue === 'number') {
                            // --- Explicitly get the LATEST buff object from the list ---
                            const latestEffectInstance = this.buffs.find(b => b.id === effect.id) || this.debuffs.find(d => d.id === effect.id);
                            const stacks = (latestEffectInstance && latestEffectInstance.stackable && latestEffectInstance.currentStacks) ? latestEffectInstance.currentStacks : 1;
                            // --- END Explicit fetch ---

                            const totalModifier = modifierValue * stacks; // Calculate total bonus

                            // Log before applying per stack
                            if (stacks > 1) {
                                console.log(`[Recalc Per Stack] ${this.name}: Effect ${effect.name || effect.id} applying stat ${stat} (Stacks: ${stacks}, Value per stack: ${modifierValue}, Total: ${totalModifier})`);
                            }

                            // <<< NEW: Log Healing Power BEFORE modification >>>
                            const healingPowerBefore = this.stats.healingPower;
                            // <<< END NEW LOG >>>

                            // Add the total calculated modifier
                            this.stats[stat] += totalModifier;

                            // --- ADDED HEALING POWER LOG ---
                            if (stat === 'healingPower') {
                                // <<< MODIFIED: Show change >>>
                                console.log(`[Recalc HEAL final] Stat ${stat} changed from ${healingPowerBefore} to ${this.stats[stat]} after applying ${effect.name || effect.id} (Stacks: ${stacks}, Total Bonus: ${totalModifier})`);
                            }
                            // --- END LOG ---
                        } else {
                            console.warn(`Invalid stat modifier value for ${stat} in effect ${effect.id}:`, modifierValue);
                        }
                    }
                });
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

        console.log(`${this.name} stats recalculated:`, this.stats);

        // Trigger UI update
        if (typeof updateCharacterUI === 'function') {
            setTimeout(() => updateCharacterUI(this), 0); 
        }
    }

    // Add an ability to the character
    addAbility(ability) {
        // Assign this character as the owner of the ability instance
        ability.character = this;
        this.abilities.push(ability);
    }

    // Use an ability by its index
    useAbility(index, target) {
        const ability = this.abilities[index];
        if (!ability) {
            console.error(`Ability at index ${index} not found for ${this.name}`);
            return false;
        }

        // --- Check talent modifications for mana cost and cooldown ---
        const abilityMods = this.talentModifiers.abilities[ability.id] || {};
        
        // Calculate final mana cost
        let finalManaCost = ability.manaCost;
        if(abilityMods.manaCost) {
            finalManaCost = Math.max(0, Math.round((finalManaCost * (abilityMods.manaCost.multiply || 1)) + (abilityMods.manaCost.add || 0)));
        }
        
        // Check mana
        if (this.stats.currentMana < finalManaCost) {
            console.log(`${this.name} does not have enough mana for ${ability.name} (needs ${finalManaCost}, has ${this.stats.currentMana})`);
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${this.name} needs ${finalManaCost} mana for ${ability.name}!`);
            }
            return false;
        }
        
        // Calculate final cooldown
        let finalCooldown = ability.cooldown;
        // --- Corrected Cooldown Calculation --- 
        const baseCooldown = ability.baseCooldown !== undefined ? ability.baseCooldown : ability.cooldown; // Get base cooldown if available
        if(abilityMods.cooldown) {
             // Apply modifiers to base cooldown
             finalCooldown = Math.max(0, Math.round((baseCooldown * (abilityMods.cooldown.multiply || 1)) + (abilityMods.cooldown.add || 0)));
        }
        // --- End Correction ---

        // Check current cooldown
        if (ability.currentCooldown > 0) {
            console.log(`${ability.name} is on cooldown for ${ability.currentCooldown} turns.`);
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${ability.name} is on cooldown (${ability.currentCooldown} turns)`);
            }
            return false;
        }
        
        // Consume mana
        this.stats.currentMana -= finalManaCost;
        
        // Set cooldown (use calculated final cooldown)
        ability.currentCooldown = finalCooldown;
        
        // --- Execute ability effect --- 
        // Pass talent modifiers to the effect function for things like damage mods
        const effectOptions = {
            talentModifiers: abilityMods 
        };
        
        console.log(`[Character ${this.name}] Using ability ${ability.name} with options:`, effectOptions);
        // --- Pass options to ability.use --- 
        const success = ability.use(this, target, finalManaCost, effectOptions); // Added options here

        // Update UI
        if (window.updateCharacterUI) {
            window.updateCharacterUI(this);
        }

        return success;
    }

    // Apply damage, now accepts caster as an argument
    applyDamage(amount, type, caster = null, options = {}) { // Added options object
        const { isChainReaction = false, isRetaliation = false, bypassMagicalShield = false, bypassArmor = false } = options; // <<< Added bypassArmor
        // --- MODIFIED: Use the recalculated stats directly ---
        const totalDodgeChance = this.stats.dodgeChance || 0; // Use the stat calculated in recalculateStats

        // Check if attack is dodged
        if (Math.random() < totalDodgeChance) {
        // --- END MODIFICATION ---
            console.log(`[ApplyDamage Debug - ${this.name}] instanceId: ${this.instanceId || this.id} - DODGED`); // <<< ADDED INSTANCE ID LOG
            const logFunction = window.gameManager ?
                window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            logFunction(`${this.name} dodged the attack!`);

            // --- Trigger passive handler on dodge ---
            if (this.passiveHandler && typeof this.passiveHandler.onDodge === 'function') {
                this.passiveHandler.onDodge(this);
            }
            // --- End Trigger ---
            
            // Play dodge animation
            // Use instanceId if available, otherwise fallback to id
            const elementId = this.instanceId || this.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                // Add dodge animation class
                charElement.classList.add('dodge-animation');
                
                // Create dodge VFX container
                const dodgeVfx = document.createElement('div');
                dodgeVfx.className = 'dodge-vfx';
                
                // Create the DODGE! text
                const dodgeText = document.createElement('div');
                dodgeText.className = 'dodge-text';
                dodgeText.textContent = 'DODGE!';
                dodgeVfx.appendChild(dodgeText);
                
                // Create image container for afterimage effect
                const imageContainer = document.createElement('div');
                imageContainer.className = 'dodge-image-container';
                dodgeVfx.appendChild(imageContainer);
                
                // Add to character element
                charElement.appendChild(dodgeVfx);
                
                // Remove the animation class and VFX element after animation completes
                setTimeout(() => {
                    charElement.classList.remove('dodge-animation');
                    if (dodgeVfx.parentNode === charElement) {
                        charElement.removeChild(dodgeVfx);
                    }
                }, 700); // Slightly longer than animation duration to ensure it completes
                
                // Also clear any hiding flags
                delete this._hidingActive;
                delete this.isUntargetable;
            }
            
            return { damage: 0, isCritical: false, dodged: true }; // Add dodged flag
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
            }
        }
        // --- End caster check --- 
        
        // Apply damage modifiers (like Silencing Ring) FROM THE CASTER
        if (caster && typeof caster.calculateDamage === 'function') {
            damage = caster.calculateDamage(damage, type); 
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

        console.log(`[ApplyDamage Debug - ${this.name}] Final damage before HP reduction: ${finalDamage}`); // <<< ADDED LOG
        const originalHp = this.stats.currentHp; // Store HP before damage
        console.log(`[ApplyDamage Debug - ${this.name}] HP before reduction: ${originalHp}`); // <<< ADDED LOG
        
        this.stats.currentHp = Math.max(0, this.stats.currentHp - finalDamage);
        
        console.log(`[ApplyDamage Debug - ${this.name}] HP after reduction: ${this.stats.currentHp}`); // <<< ADDED LOG
        const actualDamageTaken = originalHp - this.stats.currentHp; // Calculate actual HP lost
        console.log(`[ApplyDamage Debug - ${this.name}] Actual damage taken: ${actualDamageTaken}`); // <<< ADDED LOG

        // --- Apply Lifesteal to the caster --- 
        if (caster && actualDamageTaken > 0) { // Only apply if there is a caster and damage was dealt
            caster.applyLifesteal(actualDamageTaken);
        }
        // --- End Lifesteal Application ---

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
            console.log(`[VFX Debug - ${this.name}] Setting damage VFX text. Damage value: ${damage}, isCritical: ${isCritical}`);
            // --- END DEBUG ---
            damageVfx.textContent = `-${Math.round(damage)}`;
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
        
        return { damage: actualDamageTaken, isCritical: isCritical, dodged: false }; // Return actual damage dealt
    }

    // Calculate the final damage after applying modifiers
    calculateDamage(baseDamage, type) {
        let finalDamage = baseDamage;

        // Apply buffs/debuffs that modify outgoing damage (if any)
        // Example: buffs could increase finalDamage, debuffs could decrease it
        // Note: This logic should be implemented based on specific buff/debuff effects.

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
        }
        // --- END NEW ---

        // --- MODIFIED: Use caster's healingPower ---
        const casterHealingPower = (caster && caster.stats && typeof caster.stats.healingPower === 'number') ? caster.stats.healingPower : 0;
        const finalHealAmount = Math.floor(baseHealAmount * (1 + casterHealingPower));
        // --- END MODIFICATION ---

        const actualHealAmount = Math.min(this.stats.maxHp - this.stats.currentHp, finalHealAmount);
        this.stats.currentHp += actualHealAmount;

        // Hook for passive handlers on receiving heal
        if (actualHealAmount > 0 && this.passiveHandler && typeof this.passiveHandler.onHealReceived === 'function') {
            this.passiveHandler.onHealReceived(this, actualHealAmount, isCritical); // Pass isCritical flag
        }

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
        
        updateCharacterUI(this); // Add UI update call here
        
        return { healAmount: Math.floor(actualHealAmount), isCritical: isCritical }; // Return object
    }

    applyLifesteal(damage) {
        if (!this.stats.lifesteal || this.stats.lifesteal <= 0 || damage <= 0) {
            return 0;
        }

        const healAmount = Math.floor(damage * this.stats.lifesteal);
        this.heal(healAmount);
        
        // Return the heal amount for VFX and logging
        return healAmount;
    }

    regenerateResources() {
        // Regenerate HP and Mana per turn
        this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + this.stats.hpPerTurn);
        
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

    addBuff(buff) {
        const existingBuffIndex = this.buffs.findIndex(b => b.id === buff.id);
        let buffToApply = buff; // Reference to the buff being processed (new or existing)
        
        if (existingBuffIndex !== -1) {
            const existingBuff = this.buffs[existingBuffIndex];
            buffToApply = existingBuff; // Work with the existing buff instance
            
            // --- MODIFIED: Handle Stacking Buffs --- 
            console.log(`[AddBuff DEBUG - Existing] Found existing buff: ID=${existingBuff.id}, Name=${existingBuff.name}, Stackable=${existingBuff.stackable}, Stacks=${existingBuff.currentStacks}`);

            if (existingBuff.stackable) { 
                const oldStacks = existingBuff.currentStacks || 1;
                existingBuff.currentStacks = Math.min(
                    oldStacks + 1,
                    existingBuff.maxStacks || Infinity
                );
                const newStacks = existingBuff.currentStacks;

                console.log(`Incremented stack for buff: ${existingBuff.name} on ${this.name} from ${oldStacks} to ${newStacks}`);

                // Directly apply stat change for the added stack
                if (existingBuff.statModifiers && newStacks > oldStacks) {
                    Object.keys(existingBuff.statModifiers).forEach(stat => {
                        if (this.stats[stat] !== undefined) {
                            const valuePerStack = existingBuff.statModifiers[stat];
                            if (typeof valuePerStack === 'number') {
                                const addedValue = valuePerStack * (newStacks - oldStacks);
                                const oldValue = this.stats[stat];
                                this.stats[stat] += addedValue;
                                console.log(`[AddBuff Direct Apply - ${this.name}] Applied +${addedValue} to ${stat} from ${existingBuff.name} (New Stack). Old: ${oldValue}, New: ${this.stats[stat]}`);
                            }
                        }
                    });
                }
                
                // Refresh duration to the new buff's duration
                existingBuff.duration = buff.duration; 
                
                // Update description if method exists
                if (typeof existingBuff.updateDescription === 'function') {
                    existingBuff.updateDescription();
                }
                
            } else {
                // Non-stackable: Just refresh duration (keep longest)
                existingBuff.duration = Math.max(existingBuff.duration, buff.duration);
                console.log(`Refreshed duration for non-stackable buff: ${existingBuff.name} on ${this.name}`);
            }
            
        } else {
            // Buff doesn't exist, add it
            buffToApply = buff.clone(); // Clone the new buff before adding
            buffToApply.character = this; // Assign character reference
            this.buffs.push(buffToApply);

            // Initialize stacks if stackable
            if (buffToApply.stackable) {
                buffToApply.currentStacks = 1;
            }

             // Initial application of stats for the first stack
             if (buffToApply.statModifiers) {
                 Object.keys(buffToApply.statModifiers).forEach(stat => {
                     if (this.stats[stat] !== undefined) {
                         const valuePerStack = buffToApply.statModifiers[stat];
                         if (typeof valuePerStack === 'number') {
                             const oldValue = this.stats[stat];
                             this.stats[stat] += valuePerStack; // Apply for the first stack
                              console.log(`[AddBuff Direct Apply - ${this.name}] Applied initial +${valuePerStack} to ${stat} from new buff ${buffToApply.name}. Old: ${oldValue}, New: ${this.stats[stat]}`);
                         }
                     }
                 });
             }

            console.log(`Added buff: ${buffToApply.name} to ${this.name}`);

            // Call passive handler's onBuffAdded method if it exists
            if (this.passiveHandler && typeof this.passiveHandler.onBuffAdded === 'function') {
                this.passiveHandler.onBuffAdded(this);
            }
        }
        
        // --- ADD DEBUG LOG --- 
        const finalBuffCheck = this.buffs.find(b => b.id === buff.id);
        if (finalBuffCheck) {
            console.log(`[AddBuff DEBUG] Before final recalculate. Buff ${finalBuffCheck.name} stacks: ${finalBuffCheck.currentStacks || 'undefined'}, duration: ${finalBuffCheck.duration}`);
        } else {
            console.log(`[AddBuff DEBUG] Before final recalculate. Buff ${buff.name} was just added or not found.`);
        }
        // --- END DEBUG LOG --- 

        // <<< NEW: Log before specific recalculate call >>>
        console.log(`[AddBuff ${this.name}] Calling recalculateStats after modifying ${buff.name} (ID: ${buff.id}, Stacks: ${finalBuffCheck?.currentStacks})`);
        
        // Recalculate stats AFTER adding or modifying the buff (mainly for clamping/other effects now)
        this.recalculateStats('addBuff'); // Pass context

        // <<< NEW: Log AFTER specific recalculate call >>>
        console.log(`[AddBuff ${this.name}] Stats AFTER recalculate called from addBuff: `, JSON.parse(JSON.stringify(this.stats))); // Log a deep copy

        updateCharacterUI(this); // Update UI at the end
    }

    addDebuff(debuff) {
        // Similar logic for debuffs if needed, check for existing and refresh/add
        const existingDebuffIndex = this.debuffs.findIndex(d => d.id === debuff.id);
        if (existingDebuffIndex !== -1) {
             this.debuffs[existingDebuffIndex].duration = Math.max(this.debuffs[existingDebuffIndex].duration, debuff.duration);
             console.log(`Refreshed duration for debuff: ${debuff.name} on ${this.name}`);
        } else {
            this.debuffs.push(debuff);
            debuff.character = this; // Assign character reference

            // --- NEW: Call onApply if it exists --- 
            if (typeof debuff.onApply === 'function') {
                try {
                    debuff.onApply(this); // Pass the character instance
                } catch (e) {
                     console.error(`Error executing onApply for debuff ${debuff.id} on ${this.name}:`, e);
                }
            }
            // --- END NEW ---

            console.log(`Added debuff: ${debuff.name} to ${this.name}`);
            
            // Recalculate stats after adding the debuff
            this.recalculateStats();
        }
        updateCharacterUI(this);
    }

    removeBuff(buffId) {
        const index = this.buffs.findIndex(buff => buff.id === buffId);
        if (index !== -1) {
            const buffToRemove = this.buffs[index]; // Get the buff object first

            // --- MODIFIED: Check for and call .remove() --- 
            if (typeof buffToRemove.remove === 'function') {
                try {
                    buffToRemove.remove(this); // Call the buff's specific remove logic
                } catch (e) {
                    console.error(`Error executing remove() for buff ${buffToRemove.id} on ${this.name}:`, e);
                }
            }
            // --- END MODIFIED ---

            this.buffs.splice(index, 1);
            console.log(`Removed buff: ${buffId} from ${this.name}`);
            
            // Recalculate stats AFTER removing the buff
            this.recalculateStats(); 

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this); // Update UI after removing the buff
            }
        } else {
             console.log(`Attempted to remove non-existent buff ID: ${buffId} from ${this.name}`);
        }
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
        if (shouldReduceDuration) {
            console.log(`[DEBUG] Processing effects for ${this.name} WITH duration reduction`);
        }
        
        // Process buffs
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            
            // Apply buff effect (per-turn effects, not stat mods which are handled by recalculateStats)
            if (typeof buff.effect === 'function') {
                try {
                    buff.effect(this);
                } catch (error) {
                    console.error("Error applying buff effect:", error);
                }
            }
            
            // Reduce duration only if shouldReduceDuration is true
            if (shouldReduceDuration) {
                buff.duration--;
                console.log(`[DEBUG] ${this.name}'s buff ${buff.name || buff.id} reduced to ${buff.duration} turns remaining`);
            }
            
            // Remove if expired
            if (buff.duration <= 0) {
                // Store buff details before removing for logging
                const buffId = buff.id;
                const buffName = buff.name || 'buff';
                const characterName = this.name || 'character';

                // Call removeBuff which handles recalculation and removal logic
                this.removeBuff(buffId); 
                
                // Logging moved inside removeBuff or handled separately if needed
                try {
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`${characterName}'s ${buffName} effect has expired.`);
                    } else {
                        addLogEntry(`${characterName}'s ${buffName} effect has expired.`);
                    }
                } catch (error) {
                    console.error("Error logging buff expiration:", error);
                }
            }
        }

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

            // NEW: Apply onTurnEnd effect if it exists
            if (typeof debuff.onTurnEnd === 'function') {
                try {
                    debuff.onTurnEnd(this); 
                } catch (error) {
                    console.error(`Error applying onTurnEnd for debuff ${debuff.name || debuff.id}:`, error);
                }
            }

            // Reduce duration only if shouldReduceDuration is true AND duration is not permanent (-1)
            if (shouldReduceDuration && debuff.duration !== -1) {
                debuff.duration--;
                console.log(`[DEBUG] ${this.name}'s debuff ${debuff.name || debuff.id} reduced to ${debuff.duration} turns remaining`);
            }

            // Remove if expired (duration > 0 and reaches 0)
            if (debuff.duration === 0) { // Check for exactly 0, ignoring permanent -1
                 // Store details for logging
                const debuffId = debuff.id;
                const debuffName = debuff.name || 'debuff';
                const characterName = this.name || 'character';

                // Call removeDebuff which handles recalculation and removal logic
                this.removeDebuff(debuffId);

                try {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${characterName}'s ${debuffName} effect has expired.`);
                } catch (error) {
                    console.error("Error logging debuff expiration:", error);
                }
            }
        }

        // --- Passive Hook: onTurnStart ---
        // This hook is called BEFORE duration reduction and resource regen for the turn
        if (this.passiveHandler && typeof this.passiveHandler.onTurnStart === 'function') {
            try {
                this.passiveHandler.onTurnStart(this);
            } catch (error) {
                console.error(`Error executing onTurnStart passive for ${this.name}:`, error);
            }
        }
        // --- END Passive Hook ---

        // NEW: Process ability disable durations
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

        // Update UI after processing all effects for the turn
        updateCharacterUI(this);
    }

    addAbility(ability) {
        this.abilities.push(ability);
    }

    // Use an ability with the given index on a target or targets
    useAbility(abilityIndex, target) {
        if (abilityIndex < 0 || abilityIndex >= this.abilities.length) {
            console.error(`Invalid ability index: ${abilityIndex} for ${this.name}`);
            return false;
        }
        
        const ability = this.abilities[abilityIndex];

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
            d.effects.disabledAbilityIndex === abilityIndex
        );
        if (disableDebuff) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} cannot use ${ability.name} because it is disabled by ${disableDebuff.name}.`);
            return false;
        }
        // --- END Ability Disable Check ---

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

        // Use the ability and apply its effect
        // Pass the target(s) directly to the ability's use method
        // --- MODIFIED: Pass actualManaCost to ability.use --- 
        const success = ability.use(this, target, actualManaCost);
        // --- END MODIFIED --- 
        
        // Dispatch a custom event for VFX only if successful
        if (success) {
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
        }
        
        return success;
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
        this.baseDescription = ''; // Template for description
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
                this.effect(caster, targetOrTargets, this, actualManaCost, options); // Pass the ability instance itself
                this.currentCooldown = this.cooldown; // Set cooldown after successful use
                return true; // <-- ADD THIS LINE
            } catch (error) {
                console.error(`Error executing ability ${this.name} (${this.id}):`, error);
                return false; // <-- ADD THIS LINE
            }
        }
        return false; // <-- ADD THIS LINE (if no effect exists)
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
        this.baseDescription = description;
        this.description = this.generateDescription(); // Generate initial description
        return this;
    }

    /**
     * Generates the ability description by replacing placeholders with current values.
     * @returns {string} The generated description string.
     */
    generateDescription() {
        if (!this.baseDescription) {
            return '';
        }

        let generatedDesc = this.baseDescription;

        // Find all placeholders like {propertyName}
        const placeholders = generatedDesc.match(/\{[a-zA-Z0-9_]+\}/g) || [];

        placeholders.forEach(placeholder => {
            const propertyName = placeholder.slice(1, -1); // Remove {}
            let value = this[propertyName]; // Get value from the ability instance

            // --- MODIFIED DEBUG LOG ---
            console.log(`[generateDescription DEBUG] Ability: ${this.id}, Property: '${propertyName}', Value: ${value}`);
            // --- END MODIFIED DEBUG LOG ---

            // Handle potential nested properties if needed in the future (e.g., {stats.critChance})
            // For now, assume direct properties of the ability object

            if (value === undefined) {
                console.warn(`[Ability.generateDescription] Property "${propertyName}" not found on ability "${this.id}" for description generation.`);
                value = `[${propertyName}]`; // Indicate missing value
            }

            // Format percentages nicely (handle chance, modifier, and percent properties)
            if (typeof value === 'number' && (
                propertyName.toLowerCase().includes('chance') ||
                propertyName.toLowerCase().includes('modifier') ||
                propertyName.toLowerCase().includes('percent')
            )) {
                // Check if it's likely a fraction (0-1) and convert to percent
                if (value >= 0 && value <= 1) {
                    value = `${Math.round(value * 100)}%`;
                }
            }

            // Replace placeholder with the actual value
            generatedDesc = generatedDesc.replace(placeholder, value);
        });

        // --- NEW: Append conditional talent descriptions ---
        // Check for Farmer Shoma's Apple Throw self-heal talent
        if (this.id === 'farmer_shoma_w' && this.casterHealPercent && this.casterHealPercent > 0) {
            const selfHealText = `\n<span class="talent-bonus">Additionally heals you for ${this.casterHealPercent * 100}% of the healing dealt.</span>`;
            // Check if the bonus text isn't already there to prevent duplication
            if (!generatedDesc.includes('talent-bonus')) { 
                generatedDesc += selfHealText;
            }
        }
        // Add more checks for other talent-modified descriptions here if needed
        // --- END NEW ---

        this.description = generatedDesc; // Update the description property
        return generatedDesc;
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
        this.statModifiers = {}; // Store stat modifications
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
            this.effect,
            this.isDebuff
        );
        
        // Copy description
        cloned.description = this.description;
        
        // Deep copy stat modifiers
        cloned.statModifiers = {};
        for (const key in this.statModifiers) {
            cloned.statModifiers[key] = this.statModifiers[key];
        }
        
        // --- ADDED: Copy stackable properties --- 
        if (this.stackable !== undefined) {
            cloned.stackable = this.stackable;
        }
        if (this.maxStacks !== undefined) {
            cloned.maxStacks = this.maxStacks;
        }
        if (this.currentStacks !== undefined) {
            cloned.currentStacks = this.currentStacks;
        }
        // --- END ADDED ---

        // Copy any other custom properties
        if (this.originalStats) {
            cloned.originalStats = {...this.originalStats};
        }
        
        // Copy custom methods if they exist
        if (typeof this.remove === 'function' && this.remove !== Effect.prototype.remove) {
            cloned.remove = this.remove;
        }
        
        if (typeof this.onApply === 'function') {
            cloned.onApply = this.onApply;
        }
        
        if (this.effects) {
            cloned.effects = {...this.effects};
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
    async createCharacter(charData, selectedTalentIds = []) { // Added selectedTalentIds
        console.log(`[CharFactory] createCharacter called for ID: ${charData ? charData.id : 'UNKNOWN'} with talents:`, selectedTalentIds);

        if (!charData || !charData.id || !charData.stats) {
            console.error("[CharFactory] Invalid or incomplete charData received:", charData);
            return null;
        }

        let character; // Declare character variable here

        // <<< MODIFIED: Check for custom class first >>>
        if (charData.id && this.customCharacterClasses[charData.id]) {
            console.log(`[CharFactory] Creating character ${charData.id} using custom class ${this.customCharacterClasses[charData.id].name}`);
            const CustomClass = this.customCharacterClasses[charData.id];
            try {
                character = new CustomClass(
                    charData.id,
                    charData.name,
                    charData.image,
                    { ...charData.stats } // Pass a copy of stats
                );
            } catch (error) {
                console.error(`[CharFactory] Error instantiating custom class ${CustomClass.name} for ${charData.id}:`, error);
                // Fallback to base class if custom instantiation fails?
                character = new Character(
                    charData.id,
                    charData.name,
                    charData.image,
                    charData.stats
                );
            }
        } else {
            // <<< MOVED: Base class creation inside else block >>>
            console.log(`[CharFactory] Creating character ${charData.id} using base Character class`);
            character = new Character(
                charData.id,
                charData.name,
                charData.image,
                charData.stats
            );
        }
        // <<< END MODIFICATION >>>

        // --- Common logic for both base and custom characters --- 
        if (!character) {
            console.error(`[CharFactory] Failed to instantiate character object for ${charData.id}`);
            return null; // Stop if character couldn't be created
        }

        // Assign base stats AFTER potential modifications in custom constructor/init
        // but BEFORE abilities/passives/talents if they rely on base stats
        if (!character.baseStats) { // Set base stats only if not already set by a custom constructor
             character.baseStats = { ...character.stats };
             console.log(`[CharFactory] Set base stats for ${character.name} from initial stats.`);
        } else {
             console.log(`[CharFactory] Base stats for ${character.name} were already set by constructor.`);
        }

        // Add abilities (BEFORE applying talents that might modify them)
        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = AbilityFactory.createAbility(abilityData);
                if (ability) { // Ensure ability creation was successful
                    character.addAbility(ability);
                } else {
                    console.warn(`[CharFactory] Failed to create ability from data for ${character.name}:`, abilityData);
                }
            });
        }

        // Add passive (BEFORE applying talents that might modify it)
        if (charData.passive) {
            character.passive = { ...charData.passive }; // Store a copy of the passive data
            // Passive handler instantiation logic (remains complex, keep as is for now)
             const passiveId = charData.passive.id;
             console.log(`[CharFactory] Character ${character.name} has passive: ${passiveId}`);
            // ... (rest of the passive handler logic remains the same) ...
            const isCustomCharacter = character.constructor !== Character;
            if (!isCustomCharacter) { // Only lookup for base Character class
                let PassiveHandlerClass = null;
                 if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.getHandlerClass === 'function') {
                     PassiveHandlerClass = window.PassiveFactory.getHandlerClass(passiveId);
                     if (!PassiveHandlerClass) { // Check hardcoded if not found
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
                    } catch (error) {
                        console.error(`[CharFactory] Error instantiating passive handler ${PassiveHandlerClass.name}:`, error);
                    }
                } else {
                    console.warn(`[CharFactory] No passive handler class found for ${passiveId}`);
                }
            }
        }

        // --- >>> NEW: Apply Talents <<< ---
        if (selectedTalentIds && selectedTalentIds.length > 0) {
            console.log(`[CharFactory] Applying ${selectedTalentIds.length} talents to ${character.name}...`);
            const talentDefinitions = await this.loadTalentDefinitions(character.id);
            if (talentDefinitions) {
                this.applyTalents(character, talentDefinitions, selectedTalentIds);
            } else {
                console.warn(`[CharFactory] Could not load talent definitions for ${character.id} to apply selected talents.`);
            }
        }
        // --- >>> END NEW <<< ---


        // Initialize passive handler AFTER talents are applied (if handler exists)
        if (character.passiveHandler && typeof character.passiveHandler.initialize === 'function') {
            console.log(`[CharFactory] Initializing passive handler ${character.passiveHandler.constructor.name} for ${character.name} AFTER talents.`);
            character.passiveHandler.initialize(character);
        } else {
            // console.log(`[CharFactory] No passive handler or initialize method found for ${character.name} after talents.`);
        }

        // Final check/recalculation if needed (optional, depends on stat complexity)
        // character.recalculateStats();

        console.log(`[CharFactory] Finished creating character ${character.name}`, character);
        return character;
    },

    // --- NEW: Load Talent Definitions (with caching) ---
    async loadTalentDefinitions(characterId) {
        if (this.talentDefinitionsCache[characterId]) {
            return this.talentDefinitionsCache[characterId];
        }
        try {
            const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.talentDefinitionsCache[characterId] = data.talentTree; // Assuming structure { characterId: ..., talentTree: { ... } }
            return data.talentTree;
        } catch (error) {
            console.error(`Error loading talent definitions for ${characterId}:`, error);
            return null;
        }
    },

    // --- NEW: Apply Talents Logic ---
    applyTalents(character, talentDefinitions, selectedTalentIds) {
        selectedTalentIds.forEach(talentId => {
            const talent = talentDefinitions[talentId];
            if (!talent || !talent.effect) {
                console.warn(`[CharFactory] Talent ${talentId} not found or has no effect.`);
                return;
            }

            console.log(`[CharFactory] Applying talent: ${talent.name}`);
            const effect = talent.effect;

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
        });

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
            return data.characters || [];
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
             return registry.characters || [];
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
        // --- MODIFIED: Check the registry first ---
        if (this.abilityRegistry[abilityData.id]) {
            console.log(`[AbilityFactory] Using pre-registered ability object for: ${abilityData.id}`);
            // Return the registered instance directly.
            // If multiple characters use the same ability ID, they will share the instance (and cooldown state).
            // This is usually the desired behavior for unique boss abilities.
            // If unique instances per character are needed, cloning would be required here.
            return this.abilityRegistry[abilityData.id];
        }
        // --- END MODIFICATION ---

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

        // Ensure cooldown is properly initialized
        ability.currentCooldown = 0;

        if (abilityData.description) {
            ability.setDescription(abilityData.description);
        }

        if (abilityData.targetType) {
            ability.setTargetType(abilityData.targetType);
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
            return this.registeredEffects[abilityData.id](abilityData); // Pass abilityData so the custom effect can access icon, duration etc.
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
                    // Pass abilityData to the custom function
                    actualEffectFunction(caster, targetOrTargets, abilityData); 
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
        return (caster, targetOrTargets) => {
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

            // --- MODIFIED: Pass caster to heal method ---
            const result = target.heal(healAmount, caster);
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
                buff.statModifiers = { ...buffDetails.statModifiers };
            }
            // Add custom effects/flags if they exist in buffDetails
             if (buffDetails.effects) {
                 buff.effects = { ...buffDetails.effects };
             }
            // --- MODIFICATION END ---

            // Add the buff to the target
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
        return (caster, targetOrTargets) => {
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

                // --- MODIFIED: Pass caster to heal method ---
                const result = target.heal(healAmount, caster);
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
            console.error(`[AbilityFactory] Attempted to register non-function for effect: ${effectName}`);
            return;
        }
        if (this.registeredEffects[effectName]) {
            console.warn(`[AbilityFactory] Overwriting existing registered effect: ${effectName}`);
        }
        this.registeredEffects[effectName] = effectFunction;
        console.log(`[AbilityFactory] Registered custom effect function: ${effectName}`);
    }
    // <<< END MOVED METHOD >>>
}; // Closing brace for AbilityFactory
  
// <<< ADDED: Make AbilityFactory globally accessible >>>
window.AbilityFactory = AbilityFactory;
// <<< END ADDED >>>
  
window.CharacterFactory = CharacterFactory; // Expose CharacterFactory globally
window.AbilityFactory = AbilityFactory; // Expose AbilityFactory globally
window.Effect = Effect; // Make Effect class globally accessible
  