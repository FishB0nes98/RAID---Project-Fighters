class FarmerChamChamPassive {
    constructor() {
        this.lifestealIncrease = 0.05; // 5% lifesteal increase
        this.basePassiveDescription = "Every 5 turns, permanently gain 5% Lifesteal.";
        this.passiveTalentEffects = []; // To store formatted talent descriptions
        this.lastActivatedTurn = 0; 
        this.desperateStrengthActive = false; // Track if the desperate strength buff is active
        this.passiveTextElements = {};
        this.lifestealGainValue = 0;
        this.physicalDamageBoostValue = 0;
        this.critChanceBoostValue = 0;
        this.hasDisplayedDesperateStrength = false;
        this.hasArcaneLeapBuff = false;
        this.hasVampiricLeapBuff = false;
        this.arcaneMasteryTriggered = false; // Track if Arcane Mastery has been triggered
        this.initialized = false;
        this.lastHitWasCritical = false;
        this.lastAbilityMana = 0;
        this.desperateStrengthThreshold = 0.3; // 30% HP threshold for Desperate Strength
        
        // Buff boosted critical damage
        this.critDamagePerBuff = 0;
        this.currentBuffCount = 0;
        this.previousBuffCount = 0;
        
        // Mimicry Master tracking
        this.lastMimicryActivatedTurn = 0;
        this.availableBuffs = [];
        
        // Debuff Healing tracking
        this.lastDebuffHealTime = 0; // Timestamp to prevent multiple heals in quick succession
    }

    // Called at the start of the character's turn (needs to be triggered by GameManager)
    onTurnStart(character, turnNumber) {
        console.log(`[Passive ${character.name} (Instance: ${character.instanceId || character.id})] onTurnStart received. Turn: ${turnNumber}. Current this.lastActivatedTurn: ${this.lastActivatedTurn}`);
        console.log(`[Passive Debug - ${character.name}] onTurnStart called for turn ${turnNumber}. Last activated: ${this.lastActivatedTurn}`);

        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // Check Mimicry Master talent
        if (character.mimicryMasterEnabled) {
            const effectText = `Every 6th turn, gain a random buff from other characters' abilities.`;
            this.passiveTalentEffects.push(`<span class="talent-effect buff powerful">Mimicry Master: ${effectText}</span>`);
        }

        // Check for Debuff Healing
        if (character.healOnDebuffedDamage) {
            const effectText = `Talent: When dealing damage to a debuffed enemy, heal for ${character.healOnDebuffedDamage} HP.`;
            this.passiveTalentEffects.push(`<span class="talent-effect debuff-healing">${effectText}</span>`);
        }

        // Check for Desperate Strength talent
        if (character.desperateStrengthEnabled) {
            this.checkDesperateStrength(character);
        }

        // Check for Arcane Mastery talent on turn 17
        if (character.arcaneMasteryEnabled && turnNumber === 17 && !this.arcaneMasteryTriggered) {
            this.arcaneMasteryTriggered = true; // Mark as triggered to prevent it from happening again
            
            // Get current Physical and Magical Damage
            const currentPhysicalDamage = character.stats.physicalDamage;
            const currentMagicalDamage = character.stats.magicalDamage;
            
            // Double both stats
            character.applyStatModification('physicalDamage', 'add', currentPhysicalDamage, 'passive', 'Arcane Mastery');
            character.applyStatModification('magicalDamage', 'add', currentMagicalDamage, 'passive', 'Arcane Mastery');
            
            // Show VFX
            this.showArcaneMasteryVFX(character, currentPhysicalDamage, currentMagicalDamage);
            
            // Log the activation
            log(`${character.name}'s Arcane Mastery activates! Physical Damage doubled to ${character.stats.physicalDamage} and Magical Damage doubled to ${character.stats.magicalDamage}!`, 'talent-effect powerful');
            
            // Play sound effect if available
            playSound('sounds/power_up_major.mp3', 0.8);
        }

        if (turnNumber === 1 || (turnNumber - this.lastActivatedTurn >= 5)) {
            console.log(`[Passive Debug - ${character.name}] Activating passive on turn ${turnNumber}.`);
            this.lastActivatedTurn = turnNumber; // Update the last activated turn

            let physicalDamageBoostAmount = 0; // Store the amount of damage boost for logging/VFX
            let critChanceBoostAmount = 0; // Store the crit chance boost for logging/VFX

            // --- MODIFIED: Apply Lifesteal via applyStatModification ---
            const baseLifestealPercent = 0.05; // 5% base lifesteal gain
            character.applyStatModification('lifesteal', 'add', baseLifestealPercent, 'passive', 'Farmer Resilience');
            console.log(`[Passive: ${character.name}] Applied permanent ${baseLifestealPercent * 100}% Lifesteal. New Lifesteal: ${character.stats.lifesteal * 100}%`);

            // Store the lifesteal gained from the passive if not already tracked
            if (character.lifestealFromPassive === undefined) {
                character.lifestealFromPassive = 0;
            }
            character.lifestealFromPassive += baseLifestealPercent;
            // --- END MODIFICATION ---
            
            // --- MODIFIED: Apply Physical Damage from Talent via applyStatModification ---
            console.log(`[Passive Check ${character.name}] Before talent check: character.appliedTalents = ${JSON.stringify(character.appliedTalents)}, farmerResiliencePhysicalDamageBoost = ${character.farmerResiliencePhysicalDamageBoost}`);
            
            if (character.appliedTalents && character.appliedTalents.includes('talent_cham_cham_1') && character.farmerResiliencePhysicalDamageBoost > 0) {
                // Calculate damage boost based on *current* physical damage
                const currentPhysDamage = character.stats.physicalDamage;
                const boostAmount = Math.floor(currentPhysDamage * character.farmerResiliencePhysicalDamageBoost);
                physicalDamageBoostAmount = boostAmount; // Store for logging/VFX

                // Apply permanent physical damage boost
                character.applyStatModification('physicalDamage', 'add', boostAmount, 'passive', "Farmer's Resilience");
                console.log(`[Passive Talent: Farmer's Resilience] Applied permanent +${boostAmount} Physical Damage.`);
                
                // REMOVED: Temporary buff logic
                /*
                const resilienceBuff = new Effect( ... );
                resilienceBuff.statModifiers = [...];
                resilienceBuff.description = ...;
                character.addBuff(resilienceBuff);
                */
                 
            } 
            // Ensure the old temporary buff is removed if it somehow still exists
            character.removeBuff('farmers_resilience_talent_buff'); 
            // --- END MODIFICATION ---
            
            // --- NEW: Apply Critical Chance from new Talent (Critical Focus) ---
            if (character.appliedTalents && character.appliedTalents.includes('talent_cham_cham_13') && character.passiveIncreasesCritChance > 0) {
                // Apply permanent crit chance boost
                const critBoostAmount = character.passiveIncreasesCritChance;
                critChanceBoostAmount = critBoostAmount; // Store for logging/VFX
                
                character.applyStatModification('critChance', 'add', critBoostAmount, 'passive', 'Critical Focus');
                console.log(`[Passive Talent: Critical Focus] Applied permanent +${critBoostAmount * 100}% Critical Chance.`);
            }
            // --- END NEW ---

            // Show VFX for the passive activation
            this.showLifestealGainVFX(character, physicalDamageBoostAmount, critChanceBoostAmount);

            // Log the activation
            let logMessage = `${character.name}'s Farmer Resilience activates, permanently gaining ${baseLifestealPercent * 100}% Lifesteal`;
            if (physicalDamageBoostAmount > 0) {
                logMessage += `, permanently gaining ${physicalDamageBoostAmount} Physical Damage`;
            }
            if (critChanceBoostAmount > 0) {
                logMessage += `, and permanently gaining ${critChanceBoostAmount * 100}% Critical Chance`;
            }
            logMessage += `!`;
            log(logMessage, 'passive positive');

            // Update UI (recalculateStats called within applyStatModification should handle this)
            // if (typeof updateCharacterUI === 'function') {
            //     updateCharacterUI(character);
            // }

            // Update description potentially affected by talents
            this.updatePassiveTalentDescription(character);

        } else {
            console.log(`[Passive Debug - ${character.name}] Skipping passive activation on turn ${turnNumber}.`);
            // Ensure the old temporary buff is removed if it somehow still exists
             character.removeBuff('farmers_resilience_talent_buff'); 
             
            // Check for Desperate Strength even when passive doesn't trigger
            if (character.desperateStrengthEnabled) {
                this.checkDesperateStrength(character);
            }
        }

        // Update buff-based critical damage
        if (character.critDamagePerBuff) {
            this.updateBuffCriticalDamage(character);
        }
    }
    
    // New method to implement the Adaptive Awakening talent
    onDamageTaken(character, damageInfo, attacker) {
        if (!character.adaptiveAwakening || !damageInfo || damageInfo.damage <= 0) {
            return; // Not the right talent or no damage taken
        }

        console.log(`[Adaptive Awakening] ${character.name} received ${damageInfo.damage} ${damageInfo.type} damage`);
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Calculate 1% of damage received
        const adaptiveBoost = Math.max(1, Math.floor(damageInfo.damage * 0.01));
        
        // Determine which stat to boost based on damage type
        let statToBoost, statDisplayName;
        if (damageInfo.type === 'physical') {
            statToBoost = 'physicalDamage';
            statDisplayName = 'Physical Damage';
        } else if (damageInfo.type === 'magical') {
            statToBoost = 'magicalDamage';
            statDisplayName = 'Magical Damage';
        } else {
            return; // Unknown damage type
        }
        
        // Apply the stat boost
        character.applyStatModification(statToBoost, 'add', adaptiveBoost, 'talent', 'Adaptive Awakening');
        log(`${character.name}'s Adaptive Awakening converts pain into power! +${adaptiveBoost} ${statDisplayName}!`, 'talent-effect');
        
        // Add VFX
        this.showAdaptiveAwakeningVFX(character, statToBoost, adaptiveBoost);
        
        // Update character UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
        
        // Check for Desperate Strength talent after taking damage (HP may have changed)
        if (character.desperateStrengthEnabled) {
            this.checkDesperateStrength(character);
        }
    }

    // Method to handle dodge events for Nimble Strikes talent
    onDodge(character, attacker) {
        if (!character.dodgeGrantsCritBuff) {
            return; // Not the right talent
        }

        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

        // Create a buff that increases crit chance by 5% for 5 turns
        const Effect = window.Effect || function(id, name, icon, duration, effect, isDebuff) {
            return {
                id: id,
                name: name,
                icon: icon,
                duration: duration,
                effect: effect,
                isDebuff: isDebuff
            };
        };
        
        const nimbleStrikesBuff = new Effect(
            'nimble_strikes_buff',
            'Nimble Strikes',
            'Icons/talents/nimble_strikes.webp',
            5,
            null,
            false
        );
        
        // Set up stat modifiers for the buff (5% crit chance)
        nimbleStrikesBuff.statModifiers = [{
            stat: 'critChance',
            operation: 'add',
            value: 0.05
        }];
        
        nimbleStrikesBuff.description = 'Increases Critical Chance by 5% for 5 turns after dodging an attack.';
        
        // Add the buff
        character.addBuff(nimbleStrikesBuff);
        
        // Log the effect
        log(`${character.name}'s Nimble Strikes activates, increasing Critical Chance by 5% for 5 turns!`, 'talent-effect');
        
        // Show VFX
        this.showNimbleStrikesVFX(character);
    }
    
    // --- NEW: Method to check and apply Desperate Strength buff ---
    checkDesperateStrength(character) {
        if (!character.desperateStrengthEnabled) {
            return; // Talent not selected
        }
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Check if HP is below 30%
        const hpPercentage = character.stats.currentHp / character.stats.maxHp;
        const isLowHealth = hpPercentage < 0.3;
        
        // Find existing buff
        const existingBuff = character.buffs.find(buff => buff.id === 'desperate_strength_buff');
        
        if (isLowHealth && !existingBuff) {
            // HP is low and buff not active - apply buff
            this.desperateStrengthActive = true;
            
            const Effect = window.Effect || function(id, name, icon, duration, effect, isDebuff) {
                return {
                    id: id,
                    name: name,
                    icon: icon,
                    duration: duration,
                    effect: effect,
                    isDebuff: isDebuff
                };
            };
            
            // Create buff that increases damage by 15%
            const desperateStrengthBuff = new Effect(
                'desperate_strength_buff',
                'Desperate Strength',
                'Icons/talents/desperate_strength.webp',
                -1, // Permanent until HP goes above threshold
                null,
                false
            );
            
            // Set up stat modifiers (using generic array format for compatibility)
            desperateStrengthBuff.statModifiers = [{
                stat: 'physicalDamage',
                operation: 'multiply',
                value: 1.15
            }, {
                stat: 'magicalDamage',
                operation: 'multiply',
                value: 1.15
            }];
            
            desperateStrengthBuff.description = 'Increases all damage by 15% when below 30% HP.';
            
            // Add the buff
            character.addBuff(desperateStrengthBuff);
            
            // Log the effect
            log(`${character.name}'s Desperate Strength activates, increasing damage by 15%!`, 'talent-effect');
            
            // Show VFX
            this.showDesperateStrengthVFX(character);
            
        } else if (!isLowHealth && existingBuff) {
            // HP is above threshold and buff is active - remove buff
            this.desperateStrengthActive = false;
            character.removeBuff('desperate_strength_buff');
            log(`${character.name}'s Desperate Strength fades as health recovers.`, 'system');
        }
    }
    
    // VFX for Desperate Strength activation
    showDesperateStrengthVFX(character) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create a container for the VFX
        const desperateVfx = document.createElement('div');
        desperateVfx.className = 'desperate-strength-vfx';
        
        // Create the text element
        const desperateText = document.createElement('div');
        desperateText.className = 'desperate-strength-text';
        desperateText.textContent = 'DESPERATE STRENGTH +15% DMG';
        desperateVfx.appendChild(desperateText);
        
        // Create a red glow effect
        const desperateGlow = document.createElement('div');
        desperateGlow.className = 'desperate-strength-glow';
        desperateVfx.appendChild(desperateGlow);
        
        // Add to character
        charElement.appendChild(desperateVfx);
        
        // Play sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/buff_applied.mp3', 0.7);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (desperateVfx.parentNode === charElement) {
                desperateVfx.remove();
            }
        }, 2500);
    }
    // --- END NEW ---

    // VFX for Nimble Strikes
    showNimbleStrikesVFX(character) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create a container for the VFX
        const nimbleVfx = document.createElement('div');
        nimbleVfx.className = 'nimble-strikes-vfx';
        
        // Create the text element
        const nimbleText = document.createElement('div');
        nimbleText.className = 'nimble-strikes-text';
        nimbleText.textContent = '+5% CRIT';
        nimbleVfx.appendChild(nimbleText);
        
        // Add to character
        charElement.appendChild(nimbleVfx);
        
        // Remove after animation
        setTimeout(() => {
            if (nimbleVfx.parentNode === charElement) {
                nimbleVfx.remove();
            }
        }, 2000);
    }
    
    // VFX for Adaptive Awakening
    showAdaptiveAwakeningVFX(character, statType, amount) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create effect container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'adaptive-awakening-vfx';
        
        // Add special class based on the type of damage
        if (statType === 'physicalDamage') {
            vfxContainer.classList.add('physical');
        } else {
            vfxContainer.classList.add('magical');
        }
        
        // Create the floating text
        const floatingText = document.createElement('div');
        floatingText.className = 'adaptive-awakening-text';
        floatingText.textContent = `+${amount} ${statType === 'physicalDamage' ? 'PHYS' : 'MAG'}`;
        vfxContainer.appendChild(floatingText);
        
        // Add to character
        charElement.appendChild(vfxContainer);
        
        // Remove after animation
        setTimeout(() => {
            if (vfxContainer.parentNode === charElement) {
                vfxContainer.remove();
            }
        }, 2000);
    }
    
    // Method to update descriptions for Frenzied Assault talent
    updateFrenziedAssaultDescriptions(character) {
        if (!character) return;
        
        const scratchAbility = character.abilities.find(a => a.id === 'farmer_scratch');
        const boomerangAbility = character.abilities.find(a => a.id === 'farmer_boomerang');
        const feralStrikeAbility = character.abilities.find(a => a.id === 'farmer_feral_strike');
        
        if (scratchAbility && scratchAbility.frenziedAssaultChance) {
            // Check if description already contains Frenzied Assault info
            if (!scratchAbility.description.includes('Frenzied Assault')) {
                scratchAbility.description += `\n<span class="talent-effect frenzied-assault">Frenzied Assault: ${Math.round(scratchAbility.frenziedAssaultChance * 100)}% chance to trigger a second time.</span>`;
            }
        }
        
        if (boomerangAbility && boomerangAbility.frenziedAssaultChance) {
            if (!boomerangAbility.description.includes('Frenzied Assault')) {
                boomerangAbility.description += `\n<span class="talent-effect frenzied-assault">Frenzied Assault: ${Math.round(boomerangAbility.frenziedAssaultChance * 100)}% chance to trigger a second time.</span>`;
            }
        }
        
        if (feralStrikeAbility && feralStrikeAbility.frenziedAssaultChance) {
            if (!feralStrikeAbility.description.includes('Frenzied Assault')) {
                feralStrikeAbility.description += `\n<span class="talent-effect frenzied-assault">Frenzied Assault: ${Math.round(feralStrikeAbility.frenziedAssaultChance * 100)}% chance to trigger a second time.</span>`;
            }
        }
    }

    // Update the existing updatePassiveTalentDescription method to check for Frenzied Assault talent
    updatePassiveTalentDescription(character) {
        console.log(`[Passive - ${character.name}] Updating passive description with talents`);
        
        // Reset the talent effects array
        this.passiveTalentEffects = [];
        
        // Check for Physical Damage Boost from Farmer's Resilience
        if (character.farmerResiliencePhysicalDamageBoost) {
            const boostPercent = character.farmerResiliencePhysicalDamageBoost * 100;
            const effectText = `Talent: Also permanently increases Physical Damage by ${boostPercent}% each activation.`;
            this.passiveTalentEffects.push(`<span class="talent-effect damage">${effectText}</span>`);
        }
        
        // Check for Critical Chance Boost from Critical Focus
        if (character.passiveIncreasesCritChance) {
            const critPercent = character.passiveIncreasesCritChance * 100;
            const effectText = `Talent: Also permanently increases Critical Chance by ${critPercent}% each activation.`;
            this.passiveTalentEffects.push(`<span class="talent-effect damage">${effectText}</span>`);
        }
        
        // Check for Desperate Strength
        if (character.desperateStrengthEnabled) {
            const effectText = `Talent: When HP falls below 30%, gain a buff increasing damage by 15%.`;
            this.passiveTalentEffects.push(`<span class="talent-effect damage">${effectText}</span>`);
        }
        
        // Check for Arcane Mastery talent
        if (character.arcaneMasteryEnabled) {
            const effectText = `Talent: At turn 17, doubles your current Physical and Magical Damage permanently.`;
            this.passiveTalentEffects.push(`<span class="talent-effect powerful">${effectText}</span>`);
        }
        
        // Check for Mimicry Master talent
        if (character.mimicryMasterEnabled) {
            const effectText = `Every 6th turn, gain a random buff from other characters' abilities.`;
            this.passiveTalentEffects.push(`<span class="talent-effect buff powerful">Mimicry Master: ${effectText}</span>`);
        }

        // Check for Debuff Healing
        if (character.healOnDebuffedDamage) {
            const effectText = `Talent: When dealing damage to a debuffed enemy, heal for ${character.healOnDebuffedDamage} HP.`;
            this.passiveTalentEffects.push(`<span class="talent-effect debuff-healing">${effectText}</span>`);
        }

        // Update ability descriptions for talents
        this.updateFrenziedAssaultDescriptions(character);
        
        // Build the final description text
        let descriptionText = this.basePassiveDescription;
        
        // Add talent effects if any
        if (this.passiveTalentEffects.length > 0) {
            descriptionText += `<br><br>${this.passiveTalentEffects.join('<br>')}`;
        }
        
        // Update the passive description
        if (character.passive) {
            character.passive.description = descriptionText;
            console.log(`[Passive - ${character.name}] Updated passive description with ${this.passiveTalentEffects.length} talent effects`);
        } else {
            console.warn(`[Passive - ${character.name}] Cannot update passive description: character.passive is undefined`);
        }
    }

    showLifestealGainVFX(character, physicalDamageBoost = 0, critChanceBoost = 0) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            // Simple glow effect
            const glowVfx = document.createElement('div');
            glowVfx.className = 'passive-lifesteal-gain-glow-vfx'; // Needs CSS
            charElement.appendChild(glowVfx);

            // Text indicator for lifesteal
            const textVfx = document.createElement('div');
            textVfx.className = 'passive-lifesteal-gain-text-vfx'; // Needs CSS
            textVfx.textContent = `+${this.lifestealIncrease * 100}% LS`;
            charElement.appendChild(textVfx);

            // Add physical damage boost VFX if talent is active
            if (physicalDamageBoost > 0) {
                // Red glow effect for physical damage
                const damageGlowVfx = document.createElement('div');
                damageGlowVfx.className = 'farmer-resilience-damage-buff';
                charElement.appendChild(damageGlowVfx);

                // Text indicator for physical damage boost
                const damageTextVfx = document.createElement('div');
                damageTextVfx.className = 'farmer-resilience-phys-text';
                damageTextVfx.textContent = `+${physicalDamageBoost} PHYS DMG`;
                charElement.appendChild(damageTextVfx);

                // Remove physical damage VFX after animation
                setTimeout(() => {
                    damageGlowVfx.remove();
                    damageTextVfx.remove();
                }, 1800);
            }
            
            // --- NEW: Add crit chance boost VFX if talent is active ---
            if (critChanceBoost > 0) {
                // Gold glow effect for crit chance
                const critGlowVfx = document.createElement('div');
                critGlowVfx.className = 'critical-focus-crit-buff';
                charElement.appendChild(critGlowVfx);

                // Text indicator for crit chance boost
                const critTextVfx = document.createElement('div');
                critTextVfx.className = 'critical-focus-crit-text';
                critTextVfx.textContent = `+${critChanceBoost * 100}% CRIT`;
                charElement.appendChild(critTextVfx);

                // Remove crit chance VFX after animation
                setTimeout(() => {
                    critGlowVfx.remove();
                    critTextVfx.remove();
                }, 2000);
            }
            // --- END NEW ---

            // Remove lifesteal VFX after animation
            setTimeout(() => {
                glowVfx.remove();
                textVfx.remove();
            }, 1500);
        }
    }

    // Create visual effect for Sharp Focus crit buff
    showSharpFocusVFX(character) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create a container for the VFX
        const focusVfx = document.createElement('div');
        focusVfx.className = 'sharp-focus-vfx';
        
        // Create the text element
        const focusText = document.createElement('div');
        focusText.className = 'sharp-focus-text';
        focusText.textContent = '+20% CRIT';
        focusVfx.appendChild(focusText);
        
        // Add focus particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'focus-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            
            // Add random direction for each particle
            const randomX = Math.random() * 2 - 1; // Value between -1 and 1
            const randomY = Math.random() * 2 - 1; // Value between -1 and 1
            
            // Set custom properties for the CSS animation
            particle.style.setProperty('--random-x', randomX);
            particle.style.setProperty('--random-y', randomY);
            
            focusVfx.appendChild(particle);
        }
        
        // Add to character
        charElement.appendChild(focusVfx);
        
        // Add sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/buff_applied.mp3', 0.6);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (focusVfx.parentNode === charElement) {
                focusVfx.remove();
            }
        }, 2000);
    }

    // Called by Character when a critical hit occurs
    onCriticalHit(character, target, damage) {
        console.log(`[Passive Debug - ${character.name}] onCriticalHit called`);
        
        // Handle Sharp Focus talent (crit grants crit chance)
        if (character.critGainsFocusBuff) {
            // Create the Sharp Focus buff
            const sharpFocusBuff = {
                id: 'sharp_focus_buff',
                name: 'Sharp Focus',
                icon: 'Icons/abilities/sharp_focus.webp',
                duration: 4, // 4 turns
                description: 'After landing a critical hit, Critical Chance is increased by 20%.',
                statModifiers: [
                    {
                        stat: 'critChance',
                        value: 0.2,
                        operation: 'add'
                    }
                ]
            };
            
            // Add the buff to the character
            character.addBuff(sharpFocusBuff);
            
            // Show VFX
            this.showSharpFocusVFX(character);
            
            // Log the effect
            const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            logFunction(`${character.name}'s Sharp Focus activates! +20% Critical Chance for 4 turns.`, 'buff-effect');
        }
        
        // Handle Arcane Recovery talent (crit restores mana)
        if (character.critRestoresMana) {
            // Calculate missing mana
            const missingMana = character.stats.maxMana - character.stats.currentMana;
            if (missingMana > 0) {
                // Calculate mana to restore (10% of missing mana)
                const manaToRestore = Math.floor(missingMana * character.critRestoresMana);
                if (manaToRestore > 0) {
                    // Restore mana
                    character.stats.currentMana = Math.min(character.stats.maxMana, character.stats.currentMana + manaToRestore);
                    
                    // Show VFX
                    const characterElement = document.getElementById(`character-${character.id}`);
                    if (characterElement) {
                        // Create mana restore VFX
                        const manaRestoreVFX = document.createElement('div');
                        manaRestoreVFX.className = 'mana-restore-vfx';
                        manaRestoreVFX.textContent = `+${manaToRestore} MANA`;
                        characterElement.appendChild(manaRestoreVFX);
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            if (manaRestoreVFX.parentNode === characterElement) {
                                characterElement.removeChild(manaRestoreVFX);
                            }
                        }, 2000);
                    }
                    
                    // Log the effect
                    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    logFunction(`${character.name}'s Arcane Recovery restores ${manaToRestore} Mana!`, 'buff-effect');
                    
                    // Update UI
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(character);
                    }
                }
            }
        }
        
        // Show Amplified Criticals VFX if the talent is active
        if (character.critDamagePerBuff && this.currentBuffCount > 0) {
            this.showAmplifiedCriticalHitVFX(target, damage);
        }
        
        // Check for debuff healing after dealing damage
        this.onDamageDealt(character, target, { damage: damage, isCritical: true });
    }
    
    // Create the red pulsing VFX for Amplified Criticals critical hits
    showAmplifiedCriticalHitVFX(target, damage) {
        // Get the target element
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (!targetElement) return;
        
        // Create main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'amplified-criticals-hit-vfx';
        targetElement.appendChild(vfxContainer);
        
        // Create rays container
        const raysContainer = document.createElement('div');
        raysContainer.className = 'amplified-criticals-hit-rays';
        vfxContainer.appendChild(raysContainer);
        
        // Create rays at different angles
        const numRays = 12;
        for (let i = 0; i < numRays; i++) {
            const ray = document.createElement('div');
            ray.className = 'amplified-criticals-hit-ray';
            
            // Calculate angle for this ray
            const angle = (i * (360 / numRays));
            ray.style.transform = `rotate(${angle}deg)`;
            
            // Random delay for staggered effect
            ray.style.animationDelay = `${Math.random() * 0.2}s`;
            
            raysContainer.appendChild(ray);
        }
        
        // Create particles
        const numParticles = 15;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'amplified-crit-particle';
            
            // Random position within container
            particle.style.left = `${50 + (Math.random() * 20 - 10)}%`;
            particle.style.top = `${50 + (Math.random() * 20 - 10)}%`;
            
            // Random direction for particle movement
            const xDir = Math.random() * 2 - 1; // -1 to 1
            const yDir = Math.random() * 2 - 1; // -1 to 1
            
            // Set custom properties for direction
            particle.style.setProperty('--x-direction', xDir);
            particle.style.setProperty('--y-direction', yDir);
            
            // Random delay and scale
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            particle.style.transform = `scale(${0.7 + Math.random() * 0.6})`;
            
            vfxContainer.appendChild(particle);
        }
        
        // Add damage amount text with special styling
        if (damage > 0) {
            // Create special critical text
            const critText = document.createElement('div');
            critText.className = 'damage-vfx critical amplified-critical-text';
            critText.textContent = `-${Math.round(damage)}`;
            critText.style.fontSize = '28px';
            critText.style.fontWeight = 'bold';
            critText.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff6600';
            critText.style.animation = 'floatUpFade 1.5s ease-out forwards, amplified-crit-text-pulse 0.8s ease-in-out infinite';
            targetElement.appendChild(critText);
            
            // Add keyframe animation dynamically
            const style = document.createElement('style');
            style.textContent = `
                @keyframes amplified-crit-text-pulse {
                    0% { transform: translateY(-20px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.1); }
                    100% { transform: translateY(-20px) scale(1); }
                }
            `;
            document.head.appendChild(style);
            
            // Remove after animation completes
            setTimeout(() => {
                if (critText.parentNode === targetElement) {
                    targetElement.removeChild(critText);
                }
                if (style.parentNode === document.head) {
                    document.head.removeChild(style);
                }
            }, 1500);
        }
        
        // Add screen flash
        const screenFlash = document.createElement('div');
        screenFlash.style.position = 'fixed';
        screenFlash.style.top = '0';
        screenFlash.style.left = '0';
        screenFlash.style.width = '100%';
        screenFlash.style.height = '100%';
        screenFlash.style.backgroundColor = 'rgba(255, 0, 0, 0.15)';
        screenFlash.style.pointerEvents = 'none';
        screenFlash.style.zIndex = '9999';
        screenFlash.style.animation = 'amplified-screen-flash 0.3s ease-out forwards';
        document.body.appendChild(screenFlash);
        
        // Add keyframe animation dynamically
        const flashStyle = document.createElement('style');
        flashStyle.textContent = `
            @keyframes amplified-screen-flash {
                0% { opacity: 0.15; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(flashStyle);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode === targetElement) {
                targetElement.removeChild(vfxContainer);
            }
            if (screenFlash.parentNode === document.body) {
                document.body.removeChild(screenFlash);
            }
            if (flashStyle.parentNode === document.head) {
                document.head.removeChild(flashStyle);
            }
        }, 1000);
        
        // Play sound effect if gameManager is available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/critical_amplified.mp3', 0.6);
        }
    }

    // Add this new method near the other VFX methods
    showManaClawsVFX(character) {
        // Get the character element
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return; // Exit if element not found
        
        // Create the main VFX container
        const manaClawsVfx = document.createElement('div');
        manaClawsVfx.className = 'mana-claws-vfx';
        charElement.appendChild(manaClawsVfx);
        
        // Create text elements for showing the mana boost details
        const textElement1 = document.createElement('div');
        textElement1.className = 'mana-claws-text';
        textElement1.textContent = '+400 MAX MANA';
        textElement1.style.top = '30%';
        manaClawsVfx.appendChild(textElement1);
        
        const textElement2 = document.createElement('div');
        textElement2.className = 'mana-claws-text';
        textElement2.textContent = '+30 MANA REGEN';
        textElement2.style.top = '50%';
        textElement2.style.animationDelay = '0.3s';
        manaClawsVfx.appendChild(textElement2);
        
        // Play a sound if available
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/mana_boost.mp3', 0.7);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (manaClawsVfx.parentNode) {
                manaClawsVfx.remove();
            }
        }, 2500);
        
        // Add a log message
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${character.name}'s Mana-claws talent increases maximum mana by 400 and mana regeneration by 30 per turn!`, 'talent-effect');
    }

    // Modify the initialize method to detect and show effects for our new talents
    initialize(character) {
        console.log(`[Passive Initialize] Initializing passive for ${character.name} (Instance: ${character.instanceId || character.id})`);
        
        if (this.initialized) {
            console.log(`[Passive Initialize] Passive already initialized for ${character.name}. Skipping.`);
            return;
        }
        
        // Update buff-related methods and descriptions
        if (character.critDamagePerBuff) {
            this.critDamagePerBuff = character.critDamagePerBuff;
            this.updateBuffCriticalDamage(character);
        }
        
        // Listen for critical hit events
        document.addEventListener('criticalHit', (event) => {
            const detail = event.detail || {};
            if (detail.source && (detail.source.id === character.id || detail.source.instanceId === character.instanceId)) {
                this.onCriticalHit(character, detail.target, detail.damage);
            }
        });
        
        // Set up event listener for damage events to handle Debuff Healing
        if (character.healOnDebuffedDamage) {
            document.addEventListener('AbilityUsed', (event) => {
                const detail = event.detail || {};
                if (detail.caster && detail.caster.id === character.id && detail.target) {
                    // For single-target abilities
                    if (!Array.isArray(detail.target)) {
                        setTimeout(() => this.onDamageDealt(character, detail.target, {}), 100);
                    } 
                    // For multi-target abilities
                    else if (Array.isArray(detail.target)) {
                        detail.target.forEach(t => {
                            setTimeout(() => this.onDamageDealt(character, t, {}), 100);
                        });
                    }
                }
            });
            
            // Add styles for Debuff Healing VFX
            this.addDebuffHealingStyles();
            
            console.log(`[Passive Initialize] Set up Debuff Healing event listener for ${character.name}`);
        }
        
        this.initialized = true;
        
        // Updating passive description based on talents
        this.updateFrenziedAssaultDescriptions(character);
        
        this.updatePassiveTalentDescription(character);
        
        // After waiting a short delay (for UI to render)
        setTimeout(() => {
            // If character has Mimicry Master talent, load available buffs
            if (character.mimicryMasterEnabled) {
                this.loadAvailableBuffs();
                console.log(`[Passive Initialize] Loaded available buffs for Mimicry Master: ${this.availableBuffs.length} buffs found`);
            }
        }, 3000);
    }

    // Add a new method for Arcane Mastery VFX
    showArcaneMasteryVFX(character, physAmount, magAmount) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create container for the VFX
        const masteryVfx = document.createElement('div');
        masteryVfx.className = 'arcane-mastery-vfx';
        charElement.appendChild(masteryVfx);
        
        // Create physical damage text
        const physText = document.createElement('div');
        physText.className = 'arcane-mastery-phys-text';
        physText.textContent = `PHYSICAL DAMAGE x2 (+${physAmount})`;
        masteryVfx.appendChild(physText);
        
        // Create magical damage text
        const magText = document.createElement('div');
        magText.className = 'arcane-mastery-mag-text';
        magText.textContent = `MAGICAL DAMAGE x2 (+${magAmount})`;
        masteryVfx.appendChild(magText);
        
        // Create powerful glow effect
        const powerGlow = document.createElement('div');
        powerGlow.className = 'arcane-mastery-glow';
        masteryVfx.appendChild(powerGlow);
        
        // Add power-up particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'arcane-mastery-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            masteryVfx.appendChild(particle);
        }
        
        // Add to character element
        charElement.appendChild(masteryVfx);
        
        // Remove after animation completes
        setTimeout(() => {
            if (masteryVfx.parentNode === charElement) {
                masteryVfx.remove();
            }
        }, 3000);
    }

    // Add new method to show VFX for Lasting Buffs talent
    showLastingBuffsVFX(character, buffName, originalDuration, newDuration) {
        try {
            const elementId = character.instanceId || character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (!charElement) return;
            
            // Create container for the effect
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'lasting-buffs-vfx';
            charElement.appendChild(vfxContainer);
            
            // Create the text element showing the duration increase
            const durationText = document.createElement('div');
            durationText.className = 'lasting-buffs-text';
            durationText.textContent = `${buffName}: +${newDuration - originalDuration} TURN`;
            vfxContainer.appendChild(durationText);
            
            // Create a pulsing glow effect
            const glowEffect = document.createElement('div');
            glowEffect.className = 'lasting-buffs-glow';
            vfxContainer.appendChild(glowEffect);
            
            // Remove the effect after animation completes
            setTimeout(() => {
                if (vfxContainer.parentNode === charElement) {
                    vfxContainer.remove();
                }
            }, 2500);
            
            // Play sound if possible
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                window.gameManager.playSound('sounds/buff_applied.mp3', 0.5);
            }
        } catch (error) {
            console.error('Error showing Lasting Buffs VFX:', error);
        }
    }

    // Add a method to show visual effect for Debuff Exploitation
    showDebuffExploitationVFX(character, target, debuffCount, damageIncrease) {
        try {
            const elementId = character.instanceId || character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (!charElement) return;
            
            // Create container for the effect
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'debuff-exploitation-vfx';
            charElement.appendChild(vfxContainer);
            
            // Create the text element showing the damage bonus
            const bonusText = document.createElement('div');
            bonusText.className = 'debuff-exploitation-text';
            bonusText.textContent = `+${Math.round(damageIncrease * 100)}% DMG (${debuffCount} DEBUFFS)`;
            vfxContainer.appendChild(bonusText);
            
            // Create a pulsing glow effect
            const glowEffect = document.createElement('div');
            glowEffect.className = 'debuff-exploitation-glow';
            vfxContainer.appendChild(glowEffect);
            
            // Remove the effect after animation completes
            setTimeout(() => {
                if (vfxContainer.parentNode === charElement) {
                    vfxContainer.remove();
                }
            }, 2000);
            
            // Play sound if possible
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                window.gameManager.playSound('sounds/damage_up.mp3', 0.5);
            }
        } catch (error) {
            console.error('Error showing Debuff Exploitation VFX:', error);
        }
    }

    // NEW: Method to update critical damage based on active buffs
    updateBuffCriticalDamage(character) {
        // Return early if not enabled
        if (!character.critDamagePerBuff) {
            return;
        }
        
        // Count active buffs
        this.currentBuffCount = character.buffs.length;
        
        // Calculate bonus crit damage
        const bonusCritDamage = character.critDamagePerBuff * this.currentBuffCount;
        
        // Store original base crit damage if not already stored
        if (!this.originalCritDamage) {
            this.originalCritDamage = character.baseStats.critDamage || 1.6; // Default is 1.6 for Cham Cham
        }
        
        // Update the base stat with original + bonus
        character.baseStats.critDamage = this.originalCritDamage + bonusCritDamage;
        
        // Recalculate stats
        character.recalculateStats();
        
        // Only show VFX if buff count has changed
        if (this.currentBuffCount !== this.previousBuffCount) {
            this.showAmplifiedCriticalsVFX(character, this.currentBuffCount, bonusCritDamage);
            this.previousBuffCount = this.currentBuffCount;
            
            // Log the change
            const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            logFunction(`${character.name}'s Amplified Criticals: +${Math.round(bonusCritDamage * 100)}% Critical Damage from ${this.currentBuffCount} active buffs.`, 'buff-effect');
        }
    }
    
    // NEW: VFX for Amplified Criticals
    showAmplifiedCriticalsVFX(character, buffCount, bonusCritDamage) {
        const characterElement = document.getElementById(`character-${character.id}`);
        if (!characterElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'amplified-criticals-vfx';
        characterElement.appendChild(vfxContainer);
        
        // Add buff count indicator
        const buffCountIndicator = document.createElement('div');
        buffCountIndicator.className = 'amplified-criticals-buff-count';
        buffCountIndicator.textContent = `${buffCount} BUFFS`;
        vfxContainer.appendChild(buffCountIndicator);
        
        // Add crit damage text
        const critDamageText = document.createElement('div');
        critDamageText.className = 'amplified-criticals-text';
        critDamageText.textContent = `+${Math.round(bonusCritDamage * 100)}% CRIT DMG`;
        vfxContainer.appendChild(critDamageText);
        
        // Remove after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode === characterElement) {
                characterElement.removeChild(vfxContainer);
            }
        }, 2500);
    }

    // Optional: Add a method to show a visual effect when Frenzied Assault triggers
    showFrenziedAssaultVFX(character, target, abilityName) {
        if (!character || !target) return;
        
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create text indicator
        const textElement = document.createElement('div');
        textElement.className = 'frenzied-assault-text';
        textElement.textContent = 'FRENZIED!';
        targetElement.appendChild(textElement);
        
        // Remove the text element after animation completes
        setTimeout(() => {
            if (textElement.parentNode === targetElement) {
                textElement.remove();
            }
        }, 1000);
        
        // Notify with game log
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${character.name}'s Frenzied Assault triggered ${abilityName} a second time!`, 'talent-effect');
        
        // Play sound effect if available
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/ability_enhanced.mp3', 0.7);
    }

    // Method to activate Mimicry Master talent
    activateMimicryMaster(character) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        
        // Load available buffs if not already loaded
        if (this.availableBuffs.length === 0) {
            this.loadAvailableBuffs();
        }
        
        // If no buffs found, log an error and return
        if (this.availableBuffs.length === 0) {
            log(`${character.name}'s Mimicry Master failed to find any buffs to copy!`, 'system');
            return;
        }
        
        // Select a random buff from the list
        const randomIndex = Math.floor(Math.random() * this.availableBuffs.length);
        const selectedBuff = this.availableBuffs[randomIndex];
        
        // Create a new buff based on the selected one
        const Effect = window.Effect || function(id, name, icon, duration, effect, isDebuff) {
            return {
                id: id,
                name: name,
                icon: icon,
                duration: duration,
                effect: effect,
                isDebuff: isDebuff
            };
        };
        
        // Generate unique ID with timestamp to avoid conflicts
        const buffId = `mimicry_${selectedBuff.id}_${Date.now()}`;
        const buffName = `Mimic: ${selectedBuff.name}`;
        
        // Create the buff with a standard 4 turn duration
        const mimicryBuff = new Effect(
            buffId,
            buffName,
            selectedBuff.icon || 'Icons/talents/mimicry_master.webp',
            4, // 4 turn duration for all mimicked buffs
            null, // No per-turn effect
            false // Not a debuff
        );
        
        // Copy stat modifiers from the original buff
        if (selectedBuff.statModifiers) {
            mimicryBuff.statModifiers = JSON.parse(JSON.stringify(selectedBuff.statModifiers));
        }
        
        // Set description
        mimicryBuff.description = `Mimicked ${selectedBuff.name} effect: ${selectedBuff.description}`;
        
        // Apply the buff
        character.addBuff(mimicryBuff);
        
        // Show VFX
        this.showMimicryMasterVFX(character, selectedBuff.name);
        
        // Log the activation
        log(`${character.name}'s Mimicry Master activates, gaining the "${selectedBuff.name}" buff for 4 turns!`, 'talent-effect powerful');
        
        // Play sound effect
        playSound('sounds/power_up.mp3', 0.8);
    }
    
    // Load available buffs from predefined list
    loadAvailableBuffs() {
        // Define all potential buffs that can be selected from
        this.availableBuffs = [
            // Dodge Buffs
            {
                id: 'dodge_boost',
                name: 'Dodge Boost',
                description: 'Increases dodge chance by 85%',
                icon: 'Icons/abilities/dodge_boost.webp',
                statModifiers: [{
                    stat: 'dodgeChance',
                    operation: 'add',
                    value: 0.85
                }]
            },
            {
                id: 'rush_run_dodge',
                name: 'Rush Run',
                description: 'Increases dodge chance by 50%',
                icon: 'Icons/abilities/rush_run.webp',
                statModifiers: [{
                    stat: 'dodgeChance',
                    operation: 'add',
                    value: 0.5
                }]
            },
            
            // Damage Buffs
            {
                id: 'anger_damage_buff',
                name: 'Enraged',
                description: 'Increases Physical Damage by 100%',
                icon: 'Icons/abilities/enraged.webp',
                statModifiers: [{
                    stat: 'physicalDamage',
                    operation: 'multiply',
                    value: 2.0
                }]
            },
            {
                id: 'siegfried_e_damage_buff',
                name: 'Blessed Strength',
                description: 'Increases Physical Damage by 200',
                icon: 'Icons/abilities/blessed_strength.webp',
                statModifiers: [{
                    stat: 'physicalDamage',
                    operation: 'add',
                    value: 200
                }]
            },
            {
                id: 'schoolgirl_ayane_w_buff',
                name: 'Butterfly Trail',
                description: 'Increases Physical and Magical Damage by 20%',
                icon: 'Icons/abilities/butterfly_trail.webp',
                statModifiers: [{
                    stat: 'physicalDamage',
                    operation: 'multiply',
                    value: 1.2
                }, {
                    stat: 'magicalDamage',
                    operation: 'multiply',
                    value: 1.2
                }]
            },
            {
                id: 'storm_empowerment',
                name: 'Storm Empowerment',
                description: 'Increases Magical Damage by 300',
                icon: 'Icons/abilities/storm_empowerment.webp',
                statModifiers: [{
                    stat: 'magicalDamage',
                    operation: 'add',
                    value: 300
                }]
            },
            
            // Shield & Defensive Buffs
            {
                id: 'fire_shield_buff',
                name: 'Fire Shield',
                description: 'Reduces incoming damage by 25%',
                icon: 'Icons/abilities/fire_shield.webp',
                statModifiers: [{
                    stat: 'damageReduction',
                    operation: 'add',
                    value: 0.25
                }]
            },
            {
                id: 'kagome_e_shield_buff',
                name: 'Spiritwalk Shield',
                description: 'Increases Armor and Magic Shield by 100%',
                icon: 'Icons/abilities/spiritwalk.webp',
                statModifiers: [{
                    stat: 'armor',
                    operation: 'multiply',
                    value: 2.0
                }, {
                    stat: 'magicShield',
                    operation: 'multiply',
                    value: 2.0
                }]
            },
            {
                id: 'defensive_stance',
                name: 'Defensive Stance',
                description: 'Increases Armor and Magic Shield by 10',
                icon: 'Icons/abilities/defensive_stance.webp',
                statModifiers: [{
                    stat: 'armor',
                    operation: 'add',
                    value: 10
                }, {
                    stat: 'magicShield',
                    operation: 'add',
                    value: 10
                }]
            },
            
            // Healing & Support Buffs
            {
                id: 'healing_power_buff',
                name: 'Healing Boost',
                description: 'Increases Healing Power by 20%',
                icon: 'Icons/abilities/healing_boost.webp',
                statModifiers: [{
                    stat: 'healingPower',
                    operation: 'multiply',
                    value: 1.2
                }]
            },
            
            // Special Effect Buffs
            {
                id: 'thunder_perception_crit',
                name: 'Thunder Perception',
                description: 'Increases Critical Chance by 10%',
                icon: 'Icons/abilities/thunder_perception.webp',
                statModifiers: [{
                    stat: 'critChance',
                    operation: 'add',
                    value: 0.1
                }]
            }
        ];
    }
    
    // Show VFX for Mimicry Master activation
    showMimicryMasterVFX(character, buffName) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create container for the effect
        const mimicryVfx = document.createElement('div');
        mimicryVfx.className = 'mimicry-master-vfx';
        charElement.appendChild(mimicryVfx);
        
        // Create title text
        const titleText = document.createElement('div');
        titleText.className = 'mimicry-master-title';
        titleText.textContent = 'MIMICRY MASTER';
        mimicryVfx.appendChild(titleText);
        
        // Create buff name text
        const buffText = document.createElement('div');
        buffText.className = 'mimicry-master-buff';
        buffText.textContent = `COPIED: ${buffName}`;
        mimicryVfx.appendChild(buffText);
        
        // Create shimmer effect
        const shimmerEffect = document.createElement('div');
        shimmerEffect.className = 'mimicry-master-shimmer';
        mimicryVfx.appendChild(shimmerEffect);
        
        // Create particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'mimicry-particle';
            particle.style.animationDelay = `${Math.random() * 1.0}s`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            mimicryVfx.appendChild(particle);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (mimicryVfx.parentNode === charElement) {
                mimicryVfx.remove();
            }
        }, 3000);
    }

    // New method for handling damage dealt to debuffed enemies
    onDamageDealt(character, target, damageInfo) {
        // Check if the target has any debuffs and Cham Cham has the Debuff Healing talent
        if (character.healOnDebuffedDamage && target && target.debuffs && target.debuffs.length > 0) {
            console.log(`[Debuff Healing] ${character.name} dealt damage to ${target.name} with ${target.debuffs.length} debuffs`);
            
            // Prevent multiple healing triggers in quick succession (within 300ms)
            const now = Date.now();
            if (now - this.lastDebuffHealTime < 300) {
                console.log(`[Debuff Healing] Skipping heal due to recent activation (${now - this.lastDebuffHealTime}ms ago)`);
                return;
            }
            this.lastDebuffHealTime = now;
            
            // Apply the healing
            const healAmount = character.healOnDebuffedDamage;
            const result = character.heal(healAmount, character, { suppressDefaultVFX: true });
            
            // Show custom VFX
            this.showDebuffHealingVFX(character, healAmount, result.healAmount);
            
            // Log the healing
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${character.name}'s Debuff Healing activates, healing for ${result.healAmount} HP!`, 'talent-effect healing');
            
            // Play a sound effect
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/heal_major.mp3', 0.7);
        }
    }
    
    // New method for custom VFX for Debuff Healing talent
    showDebuffHealingVFX(character, intendedHealAmount, actualHealAmount) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create healing VFX container
        const healVfx = document.createElement('div');
        healVfx.className = 'debuff-healing-vfx';
        characterElement.appendChild(healVfx);
        
        // Create healing number
        const healNumber = document.createElement('div');
        healNumber.className = 'debuff-healing-number';
        healNumber.textContent = `+${actualHealAmount}`;
        healVfx.appendChild(healNumber);
        
        // Create healing text
        const healText = document.createElement('div');
        healText.className = 'debuff-healing-text';
        healText.textContent = 'DEBUFF HEALING';
        healVfx.appendChild(healText);
        
        // Create healing particles
        const particles = document.createElement('div');
        particles.className = 'debuff-healing-particles';
        healVfx.appendChild(particles);
        
        // Add some sparkle particles
        for (let i = 0; i < 10; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'debuff-healing-sparkle';
            sparkle.style.left = `${Math.random() * 90 + 5}%`;
            sparkle.style.top = `${Math.random() * 90 + 5}%`;
            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
            particles.appendChild(sparkle);
        }
        
        // Remove the VFX after animation completes
        setTimeout(() => {
            if (healVfx.parentNode === characterElement) {
                characterElement.removeChild(healVfx);
            }
        }, 2000);
    }

    // Add CSS for Debuff Healing VFX to the document if not already present
    addDebuffHealingStyles() {
        if (!document.getElementById('debuff-healing-styles')) {
            const style = document.createElement('style');
            style.id = 'debuff-healing-styles';
            style.textContent = `
                .debuff-healing-vfx {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .debuff-healing-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #2ce62c;
                    text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
                    animation: debuff-healing-number 2s ease-out forwards;
                    opacity: 0;
                }
                
                .debuff-healing-text {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #ffffff;
                    text-shadow: 0 0 10px #00ff00, 0 0 15px #00ff00;
                    margin-top: 10px;
                    animation: debuff-healing-text 2s ease-out forwards;
                    opacity: 0;
                }
                
                .debuff-healing-particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                .debuff-healing-sparkle {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: #00ff00;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
                    animation: debuff-healing-sparkle 1.5s ease-out forwards;
                    opacity: 0;
                }
                
                @keyframes debuff-healing-number {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { transform: translateY(-20px); opacity: 1; }
                    80% { transform: translateY(-40px); opacity: 1; }
                    100% { transform: translateY(-50px); opacity: 0; }
                }
                
                @keyframes debuff-healing-text {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { transform: translateY(10px); opacity: 1; }
                    80% { transform: translateY(20px); opacity: 1; }
                    100% { transform: translateY(30px); opacity: 0; }
                }
                
                @keyframes debuff-healing-sparkle {
                    0% { transform: scale(0); opacity: 0; }
                    20% { transform: scale(1); opacity: 1; }
                    80% { transform: scale(1.5); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            console.log('[Passive Styles] Added Debuff Healing VFX styles');
        }
    }
}

// Make the class globally available
window.FarmerChamChamPassive = FarmerChamChamPassive;

// <<< ADDED: Register with the PassiveFactory >>>
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') { 
    console.log("[Passive Registration] Attempting to register: farmer_cham_cham_passive with class:", FarmerChamChamPassive);
    window.PassiveFactory.registerPassive('farmer_cham_cham_passive', FarmerChamChamPassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, FarmerChamChamPassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
} 

// Register the VFX handler in the global scope
window.showLastingProtectionVFX = function(character, buffName, originalDuration, newDuration) {
    // Check if character has a passive handler with the showLastingBuffsVFX method
    if (character.passiveHandler && typeof character.passiveHandler.showLastingBuffsVFX === 'function') {
        character.passiveHandler.showLastingBuffsVFX(character, buffName, originalDuration, newDuration);
    }
    // If no passive handler, fallback to a basic floating text
    else if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
        const elementId = character.instanceId || character.id;
        window.gameManager.showFloatingText(`character-${elementId}`, `+${newDuration - originalDuration} Turn`, 'buff');
    }
}; 

// Register VFX handler for Debuff Exploitation in the global scope
window.showDebuffExploitationVFX = function(character, target, debuffCount, damageIncrease) {
    // Check if character has a passive handler with the showDebuffExploitationVFX method
    if (character.passiveHandler && typeof character.passiveHandler.showDebuffExploitationVFX === 'function') {
        character.passiveHandler.showDebuffExploitationVFX(character, target, debuffCount, damageIncrease);
    }
    // If no passive handler, fallback to a basic floating text
    else if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
        const elementId = character.instanceId || character.id;
        window.gameManager.showFloatingText(`character-${elementId}`, `+${Math.round(damageIncrease * 100)}% DMG (${debuffCount} debuffs)`, 'buff');
    }
}; 
