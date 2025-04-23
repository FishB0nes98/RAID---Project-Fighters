// Ability definitions for Farmer farmer_nina

// Assume Ability, Effect classes and addLogEntry function are available globally or imported
// If not, ensure they are properly included in the execution context.

// --- Helper Functions for Passive ---

function applyfarmer_ninaPassive(caster, buff) {
    // Check if this is actually Farmer farmer_nina
    if (caster.id !== 'farmer_nina') return buff;
    
    // Clone the buff so we don't modify the original
    const amplifiedBuff = buff.clone();
    
    // Log pre-amplification values for debugging
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Double the strength of any numeric stat modifiers
    if (amplifiedBuff.statModifiers) {
        for (const stat in amplifiedBuff.statModifiers) {
            // Only double numeric values
            if (typeof amplifiedBuff.statModifiers[stat] === 'number') {
                // Store original value for logging
                const originalValue = amplifiedBuff.statModifiers[stat];
                // Double the value
                amplifiedBuff.statModifiers[stat] *= 2;
                
                // Add detailed log entry
                let displayValue = originalValue;
                let displayNewValue = amplifiedBuff.statModifiers[stat];
                
                // Format percentage stats nicely
                if (['critChance', 'dodgeChance', 'critDamage', 'lifesteal'].includes(stat)) {
                    displayValue = `${(originalValue * 100).toFixed(1)}%`;
                    displayNewValue = `${(amplifiedBuff.statModifiers[stat] * 100).toFixed(1)}%`;
                }
                
                log(`${caster.name}'s passive doubles ${stat} from ${displayValue} to ${displayNewValue}!`);
            }
        }
    }
    
    // Add visual effect to show the amplification
    const casterElement = document.getElementById(`character-${caster.id}`);
    if (casterElement) {
        const amplifyVfx = document.createElement('div');
        amplifyVfx.className = 'farmer_nina-passive-vfx';
        amplifyVfx.innerHTML = '<div class="farmer_nina-passive-symbol">×2</div>';
        casterElement.appendChild(amplifyVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            amplifyVfx.remove();
        }, 1000);
    }
    
    return amplifiedBuff;
}

// Override the addBuff method to implement the passive
if (typeof Character !== 'undefined') {
    // Store the original addBuff method
    const originalAddBuff = Character.prototype.addBuff;
    
    // Override with our version
    Character.prototype.addBuff = function(buff) {
        // If this is Farmer farmer_nina, apply the passive amplification
        if (this.id === 'farmer_nina') {
            buff = applyfarmer_ninaPassive(this, buff);
        }
        
        // Call the original method with our modified buff
        return originalAddBuff.call(this, buff);
    };
}

// When checking if Farmer farmer_nina has the Hiding buff, add a utility function to make it consistent
function hasActiveHidingBuff(character) {
    if (!character || character.id !== 'farmer_nina') return false;
    
    const hidingBuff = character.buffs && character.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
    return hidingBuff && !hidingBuff.wasHidingBroken;
}

// --- Ability Definitions ---

// Q: Sniper Shot
const farmer_ninaSniperShotEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Farmer farmer_nina Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Sniper Shot on ${target.name}.`);

    // --- Sniper Shot VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        // 1. Sniper Shot Tracer (Fixed Position)
        const tracerVfx = document.createElement('div');
        tracerVfx.className = 'sniper-shot-tracer';
        document.body.appendChild(tracerVfx); // Append to body for fixed positioning

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        tracerVfx.style.left = `${startX}px`;
        tracerVfx.style.top = `${startY}px`;
        tracerVfx.style.width = `${distance}px`;
        tracerVfx.style.transform = `rotate(${angle}deg)`;

        // Remove tracer after animation
        setTimeout(() => tracerVfx.remove(), 300);

        // 2. Sniper Shot Impact (On Target)
        setTimeout(() => {
            if (!targetElement) return; // Check if target still exists

            const impactContainer = document.createElement('div');
            impactContainer.className = 'vfx-container'; // Generic container
            targetElement.appendChild(impactContainer);

            const impactVfx = document.createElement('div');
            impactVfx.className = 'sniper-shot-impact';
            impactContainer.appendChild(impactVfx);

            // Remove impact container after animation
            setTimeout(() => impactContainer.remove(), 600);
        }, 200); // Delay impact slightly after tracer
    }
    // --- End Sniper Shot VFX ---

    // Play sound effect
    playSound('sounds/sniper_shot.mp3', 0.7); // Example sound path

    // Calculate and apply damage
    const baseDamage = 400 + (caster.stats.physicalDamage * 0.5);
    
    // Set damage source on target to track critical hit
    target.isDamageSource = caster;
    
    const result = target.applyDamage(baseDamage, 'physical');
    
    // Clear damage source
    target.isDamageSource = null;
    
    log(`${target.name} takes ${result.damage} physical damage.`);
    if (result.isCritical) {
        log("Critical Hit!");
    }
    
    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);
    
    // Apply crit chance buff
    const critBuff = new Effect(
        'farmer_nina_q_crit_buff',
        'Focused Aim',
        'Icons/abilities/sniper_shot.jpeg',
        3, // Duration: 3 turns
        (character) => {
            // This effect function runs each turn the buff is active (optional)
            // We are using statModifiers, so likely no per-turn logic needed here.
        },
        false // isDebuff = false
    ).setDescription('Increases critical strike chance by 20%.');
    
    // Add stat modifiers directly to the buff object before applying
    critBuff.statModifiers = { critChance: 0.2 };
    
    // Define the remove function to ensure stats are reset when buff expires
    critBuff.remove = (character) => {
        log(`${character.name}'s Focused Aim fades.`);
    };
    
    // Apply the buff to the caster (will be automatically amplified by Farmer farmer_nina's passive)
    caster.addBuff(critBuff.clone());
    log(`${caster.name} gains Focused Aim, increasing critical strike chance!`);
    
    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target); // Update target UI as well
};

// Store the original effect function for wrapping
const originalfarmer_ninaQEffect = farmer_ninaSniperShotEffect;

// Create wrapper function to break hiding
const wrappedfarmer_ninaSniperShotEffect = function(caster, target) {
    // Break hiding if Farmer farmer_nina is using this ability
    if (caster && caster.id === 'farmer_nina') {
        const hidingBuff = caster.buffs && caster.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
        if (hidingBuff && !hidingBuff.wasHidingBroken) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${caster.name}'s hiding is broken after using Sniper Shot!`);
            log(`${caster.name} reveals her position as she fires!`);
            
            // Use the complete removal function
            completelyRemoveHidingBuff(caster);
        }
    }
    
    // Call the original effect function
    return originalfarmer_ninaQEffect(caster, target);
};

const farmer_ninaQ = new Ability(
    'farmer_nina_q',
    'Sniper Shot',
    'Icons/abilities/sniper_shot.jpeg',
    40, // Mana cost
    1,  // Cooldown
    wrappedfarmer_ninaSniperShotEffect
).setDescription('Deals 400 (+50% AD) physical damage. After use, gain 20% crit chance for 3 turns.')
 .setTargetType('enemy');

// W: Hiding
const farmer_ninaHidingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Hiding, becoming concealed and untargetable!`);
    log(`${caster.name} vanishes into the shadows, becoming almost invisible to enemies.`);

    // --- Hiding VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);

    if (casterElement) {
        // Apply transparency style directly
        casterElement.style.opacity = '0.3';
        casterElement.dataset.isHiding = "true";
        log(`${caster.name}'s visibility is reduced as she enters hiding.`);

        // Add cloak/fade VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container hiding-vfx-container'; // Specific container
        casterElement.appendChild(vfxContainer);

        const hidingVfx = document.createElement('div');
        hidingVfx.className = 'hiding-vfx'; // CSS handles cloak/fade animation
        vfxContainer.appendChild(hidingVfx);

        const hidingCloak = document.createElement('div');
        hidingCloak.className = 'hiding-cloak';
        hidingVfx.appendChild(hidingCloak);

        // Add untargetable indicator directly via CSS using [data-is-hiding="true"]

        // Remove VFX container after animation completes
        setTimeout(() => {
            vfxContainer.remove();
            log(`${caster.name} is now fully concealed.`);
        }, 1000); // Match CSS animation duration
    }
    // --- End Hiding VFX ---

    // Play sound effect
    playSound('sounds/hiding.mp3', 0.6); // Example sound path

    // Create the stealth buff
    const hidingBuff = new Effect(
        'farmer_nina_w_hiding_buff',
        'Hiding',
        'Icons/abilities/hiding.jpeg',
        2, // Duration: Changed from 5 to 2 turns
        (character) => {
            // This effect function runs at the start of each turn the buff is active
            // Heal Farmer farmer_nina at the start of her turn
            const healAmount = 350;
            const previousHealth = character.stats.currentHealth || 0;
            character.heal(healAmount);
            const currentHealth = character.stats.currentHealth || 0;
            const actualHealAmount = currentHealth - previousHealth;
            
            log(`${character.name} regenerates ${actualHealAmount} HP while hiding (turn ${3 - hidingBuff.duration} of 2).`); // Updated turn count
            log(`${character.name} remains concealed and continues to evade detection.`);
        },
        false // isDebuff = false
    ).setDescription('Cannot be directly targeted by enemies. Heals 350 HP each turn. Farmer farmer_nina is completely protected from direct damage. Breaks when damaged or when using other abilities.');

    // Define special properties for the buff
    hidingBuff.isUntargetable = true; // Flag to make character untargetable
    hidingBuff.wasHidingBroken = false; // Track if hiding was broken

    // Make sure this property is always set
    Object.defineProperty(hidingBuff, 'wasHidingBroken', {
        get: function() {
            return this._wasHidingBroken || false;
        },
        set: function(value) {
            this._wasHidingBroken = value;
            // When hiding is broken, immediately update opacity and remove data attribute
            if (value === true) {
                const charElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                 if (charElement) {
                     charElement.style.opacity = '1';
                     charElement.dataset.isHiding = "false";
                     // Also remove any lingering cloak effects immediately
                     const cloakVfx = charElement.querySelector('.hiding-vfx-container');
                     if(cloakVfx) cloakVfx.remove();
                 }
                 // Remove the untargetable flag
                 delete caster.isUntargetable;
            }
        }
    });

    // Define the remove function (called when buff expires or is removed)
    hidingBuff.remove = (character) => {
        const reason = hidingBuff.wasHidingBroken ?
            "hiding was broken" :
            "the effect has expired";

        log(`${character.name} is no longer hiding - ${reason}.`);
        log(`${character.name} becomes visible to enemies once again.`);

        // Remove visual stealth effect and restore opacity (double check in case setter didn't run)
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            charElement.style.opacity = '1';
            charElement.dataset.isHiding = "false";
             // Also remove any lingering cloak effects immediately
             const cloakVfx = charElement.querySelector('.hiding-vfx-container');
             if(cloakVfx) cloakVfx.remove();
        }
         // Remove the untargetable flag
         delete character.isUntargetable;
    };
    
    // Apply the buff to farmer_nina
    caster.addBuff(hidingBuff);
    log(`${caster.name} hides, becoming untargetable for 2 turns!`); // Updated duration
    log(`${caster.name} will heal 350 HP at the start of each of her turns while hiding.`);
    
    // DIRECT OVERRIDE: Immediately modify the Character's use method to catch ability usage
    // This is more reliable than overriding useAbility which isn't always called
    if (typeof caster.use === 'function' && !caster._originalUse) {
        caster._originalUse = caster.use;
        
        caster.use = function(abilityId, target) {
            console.log(`%c[farmer_nina HIDING DEBUG] farmer_nina using ability: ${abilityId || 'unknown'}`, 'background: #330000; color: white');
            
            // If using any ability other than Hiding itself, break stealth
            if (abilityId && abilityId !== 'farmer_nina_w') {
                const hidingBuff = this.buffs && this.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                if (hidingBuff && !hidingBuff.wasHidingBroken) {
                    const ability = this.abilities && this.abilities.find(a => a && a.id === abilityId);
                    const abilityName = ability ? ability.name : 'an ability';
                    log(`${this.name}'s hiding is broken after using ${abilityName}!`);
                    log(`${this.name} reveals her position as she prepares to attack!`);
                    
                    // Mark hiding as broken
                    hidingBuff.wasHidingBroken = true;
                    
                    // Remove the hiding buff
                    if (typeof this.removeBuff === 'function') {
                        this.removeBuff(hidingBuff);
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
            
            // Log that we're about to call the original method
            console.log(`%c[farmer_nina HIDING DEBUG] Calling original use method for ${abilityId}`, 'background: #330000; color: white');
            
            // Call the original method (with safety check)
            if (typeof this._originalUse === 'function') {
                return this._originalUse.call(this, abilityId, target);
            }
            return false;
        };
    }
    
    // Setup error handling wrapper
    const safeCall = (fn, fallback) => {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                console.error(`[farmer_nina HIDING ERROR] ${error.message}`);
                return fallback;
            }
        };
    };
    
    // COMPREHENSIVE TARGETING PROTECTION
    if (window.gameManager) {
        const gameManager = window.gameManager;
        
        // 1. Override isValidTarget
        if (!gameManager._originalIsValidTarget && typeof gameManager.isValidTarget === 'function') {
            gameManager._originalIsValidTarget = gameManager.isValidTarget;
            
            gameManager.isValidTarget = safeCall(function(attacker, target, ability) {
                // If target is farmer_nina and she has hiding buff, prevent targeting
                if (target && target.id === caster.id) {
                    console.log(`[farmer_nina HIDING DEBUG] Checking if ${attacker && attacker.name ? attacker.name : 'someone'} can target farmer_nina`);
                    
                    // Primary check: farmer_nina has hiding buff
                    const hidingBuff = target.buffs && target.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                    
                    // Secondary check: farmer_nina has hiding active flag
                    const hidingActive = target._hidingActive === true;
                    
                    // Tertiary check: farmer_nina has untargetable flag
                    const isUntargetable = target.isUntargetable === true;
                    
                    if ((hidingBuff && !hidingBuff.wasHidingBroken) || hidingActive || isUntargetable) {
                        console.log(`%c[farmer_nina HIDING] Blocked targeting of farmer_nina by ${attacker && attacker.name ? attacker.name : 'someone'}`, 'color: red; font-weight: bold');
                        log(`${attacker && attacker.name ? attacker.name : 'Enemy'} cannot target ${target.name} while she is hiding.`);
                        return false;
                    }
                }
                
                return gameManager._originalIsValidTarget.call(this, attacker, target, ability);
            }, true);
        }
        
        // 2. Override selectAITarget method
        if (!gameManager._originalSelectAITarget && typeof gameManager.selectAITarget === 'function') {
            gameManager._originalSelectAITarget = gameManager.selectAITarget;
            
            gameManager.selectAITarget = safeCall(function(aiCharacter, targetType) {
                console.log(`[farmer_nina HIDING DEBUG] AI selecting targets of type: ${targetType || 'unknown'}`);
                
                // Get original targets (with safety check)
                let possibleTargets = [];
                try {
                    possibleTargets = gameManager._originalSelectAITarget.call(this, aiCharacter, targetType) || [];
                } catch (error) {
                    console.error(`[farmer_nina HIDING ERROR] Error in original selectAITarget: ${error.message}`);
                }
                
                // Filter out farmer_nina if she's hiding
                const filteredTargets = possibleTargets.filter(target => {
                    if (target && target.id === caster.id) {
                        // Check all hiding indicators
                        const hidingBuff = target.buffs && target.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                        const hidingActive = target._hidingActive === true;
                        const isUntargetable = target.isUntargetable === true;
                        
                        if ((hidingBuff && !hidingBuff.wasHidingBroken) || hidingActive || isUntargetable) {
                            console.log(`%c[farmer_nina HIDING] AI filtered out farmer_nina (hiding) from targets!`, 'color: red; font-weight: bold');
                            return false;
                        }
                    }
                    return true;
                });
                
                console.log(`[farmer_nina HIDING DEBUG] AI targets before/after filtering: ${possibleTargets.length}/${filteredTargets.length}`);
                return filteredTargets;
            }, []);
        }
        
        // 3. Directly override executeAITurn to ensure farmer_nina is never targeted
        if (!gameManager._originalExecuteAITurn && typeof gameManager.executeAITurn === 'function') {
            gameManager._originalExecuteAITurn = gameManager.executeAITurn;
            
            gameManager.executeAITurn = safeCall(async function(aiCharacter) {
                // Safely log AI character info (avoiding the undefined error)
                console.log(`[farmer_nina HIDING DEBUG] AI character executing turn: ${aiCharacter ? aiCharacter.id : 'unknown'}`);
                
                // Check if farmer_nina is hiding before AI acts
                const characters = this.characters || [];
                const farmer_nina = characters.find(char => char && char.id === caster.id);
                if (farmer_nina) {
                    const hidingBuff = farmer_nina.buffs && farmer_nina.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                    if (hidingBuff && !hidingBuff.wasHidingBroken) {
                        console.log(`%c[farmer_nina HIDING] farmer_nina is hidden and cannot be targeted by AI!`, 'background: #660000; color: white; font-weight: bold');
                        
                        // Force farmer_nina to be untargetable
                        farmer_nina.isUntargetable = true;
                        
                        // Also set a higher-level flag to ensure AI targeting is completely blocked
                        farmer_nina._hidingActive = true;
                        
                        try {
                            // Execute AI turn with this knowledge
                            const result = await gameManager._originalExecuteAITurn.call(this, aiCharacter);
                            
                            // Remove temporary flags
                            delete farmer_nina.isUntargetable;
                            delete farmer_nina._hidingActive;
                            
                            return result;
                        } catch (error) {
                            console.error(`[farmer_nina HIDING ERROR] Error in AI turn execution: ${error.message}`);
                            // Remove temporary flags even if error occurs
                            delete farmer_nina.isUntargetable;
                            delete farmer_nina._hidingActive;
                            throw error; // Re-throw to maintain original error handling
                        }
                    }
                }
                
                // No hiding active, proceed normally
                return gameManager._originalExecuteAITurn.call(this, aiCharacter);
            }, null);
        }
        
        // 4. Special override for targetCharacter function which is directly called
        if (!gameManager._originalTargetCharacter && typeof gameManager.targetCharacter === 'function') {
            gameManager._originalTargetCharacter = gameManager.targetCharacter;
            
            gameManager.targetCharacter = safeCall(function(attacker, character, ability) {
                // Block targeting farmer_nina if hiding
                if (character && character.id === caster.id) {
                    const isHiding = hasActiveHidingBuff(character) || character._hidingActive === true || character.isUntargetable === true;
                    
                    if (isHiding) {
                        console.log(`%c[farmer_nina HIDING] Blocked direct targeting of farmer_nina by ${attacker && attacker.name ? attacker.name : 'unknown'}`, 'color: red; font-weight: bold');
                        log(`${attacker && attacker.name ? attacker.name : 'Enemy'} cannot target ${character.name} while she is hiding.`);
                        
                        // Display visual feedback when someone tries to target farmer_nina while hiding
                        const farmer_ninaElement = document.getElementById(`character-${character.id}`);
                        if (farmer_ninaElement) {
                            // Create a brief visual indicator
                            const protectionVfx = document.createElement('div');
                            protectionVfx.className = 'hiding-protection-vfx';
                            protectionVfx.innerHTML = '<div class="protection-shield">Untargetable</div>';
                            farmer_ninaElement.appendChild(protectionVfx);
                            
                            // Remove after animation
                            setTimeout(() => {
                                protectionVfx.remove();
                            }, 1000);
                        }
                        
                        return false;
                    }
                }
                
                // Call original method
                return gameManager._originalTargetCharacter.call(this, attacker, character, ability);
            }, false);
        }
        
        // Add specific protection against AoE abilities
        if (!gameManager._originalGetValidTargets && typeof gameManager.getValidTargets === 'function') {
            gameManager._originalGetValidTargets = gameManager.getValidTargets;
            
            gameManager.getValidTargets = safeCall(function(attacker, ability, targetType) {
                // Get the original targets
                const originalTargets = gameManager._originalGetValidTargets.call(this, attacker, ability, targetType) || [];
                
                // Filter out farmer_nina if she's hiding
                return originalTargets.filter(target => {
                    if (target && target.id === caster.id) {
                        const isHiding = hasActiveHidingBuff(target) || target._hidingActive === true || target.isUntargetable === true;
                        
                        if (isHiding) {
                            console.log(`%c[farmer_nina HIDING] Removed farmer_nina from AoE targets while hiding!`, 'background: #660000; color: white; font-weight: bold');
                            return false;
                        }
                    }
                    return true;
                });
            }, []);
        }
        
        // Block damage application to farmer_nina while hiding
        if (!caster._originalApplyDamage && typeof caster.applyDamage === 'function') {
            caster._originalApplyDamage = caster.applyDamage;
            
            caster.applyDamage = safeCall(function(amount, type, caster) {
                // If hiding is active, completely block the damage
                const isHiding = hasActiveHidingBuff(this) || this._hidingActive === true || this.isUntargetable === true;
                
                if (isHiding) {
                    console.log(`%c[farmer_nina HIDING] Completely blocked damage to farmer_nina while hiding!`, 'background: #660000; color: white; font-weight: bold');
                    log(`${this.name} completely evades damage while hiding!`);
                    
                    // Return a mock damage result object
                    return {
                        damage: 0,
                        isCritical: false,
                        isDodged: true,
                        type: type
                    };
                }
                
                // Otherwise, use original damage application
                return this._originalApplyDamage.call(this, amount, type, caster);
            }, { damage: 0, isCritical: false, isDodged: true });
        }
        
        // 5. Add a marker class to farmer_nina in the UI
        const farmer_ninaElement = document.getElementById(`character-${caster.id}`);
        if (farmer_ninaElement) {
            farmer_ninaElement.classList.add('farmer_nina-hiding-active');
        }
        
        // Add a hook into the useAbility method to ensure hiding breaks
        if (!gameManager._originalUseAbility && typeof gameManager.useAbility === 'function') {
            gameManager._originalUseAbility = gameManager.useAbility;
            
            gameManager.useAbility = safeCall(function(character, abilityId, target) {
                // If farmer_nina is using an ability other than Hiding, break stealth
                if (character && character.id === 'farmer_nina' && abilityId !== 'farmer_nina_w') {
                    const hidingBuff = character.buffs && character.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                    if (hidingBuff && !hidingBuff.wasHidingBroken) {
                        console.log(`%c[farmer_nina HIDING] farmer_nina's hiding will be broken by using ${abilityId}`, 'background: red; color: white; font-weight: bold');
                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                        
                        // Get ability name for better logging
                        const ability = character.abilities && character.abilities.find(a => a && a.id === abilityId);
                        const abilityName = ability ? ability.name : 'an ability';
                        
                        log(`${character.name}'s hiding is broken after using ${abilityName}!`);
                        log(`${character.name} reveals her position as she prepares to attack!`);
                        
                        // Use the complete removal function
                        completelyRemoveHidingBuff(character);
                    }
                }
                
                // Call original method
                return gameManager._originalUseAbility.call(this, character, abilityId, target);
            }, false);
        }
        
        // Register cleanup for when the game ends
        if (typeof gameManager.registerCleanupTask === 'function') {
            gameManager.registerCleanupTask(() => {
                // Restore original methods
                if (caster._originalUse) {
                    caster.use = caster._originalUse;
                    caster._originalUse = null;
                }
                
                if (caster._originalApplyDamage) {
                    caster.applyDamage = caster._originalApplyDamage;
                    caster._originalApplyDamage = null;
                }
                
                if (gameManager._originalIsValidTarget) {
                    gameManager.isValidTarget = gameManager._originalIsValidTarget;
                    gameManager._originalIsValidTarget = null;
                }
                
                if (gameManager._originalSelectAITarget) {
                    gameManager.selectAITarget = gameManager._originalSelectAITarget;
                    gameManager._originalSelectAITarget = null;
                }
                
                if (gameManager._originalExecuteAITurn) {
                    gameManager.executeAITurn = gameManager._originalExecuteAITurn;
                    gameManager._originalExecuteAITurn = null;
                }
                
                if (gameManager._originalTargetCharacter) {
                    gameManager.targetCharacter = gameManager._originalTargetCharacter;
                    gameManager._originalTargetCharacter = null;
                }
                
                if (gameManager._originalGetValidTargets) {
                    gameManager.getValidTargets = gameManager._originalGetValidTargets;
                    gameManager._originalGetValidTargets = null;
                }
                
                if (gameManager._originalUseAbility) {
                    gameManager.useAbility = gameManager._originalUseAbility;
                    gameManager._originalUseAbility = null;
                }
                
                // Remove marker class
                const farmer_ninaElement = document.getElementById(`character-${caster.id}`);
                if (farmer_ninaElement) {
                    farmer_ninaElement.classList.remove('farmer_nina-hiding-active');
                }
                
                // Remove any lingering hiding visual effects
                document.querySelectorAll('.hiding-vfx, .hiding-cloak, .hiding-protection-vfx').forEach(el => el.remove());
                
                // Remove the CSS style
                const styleEl = document.getElementById('farmer_nina-hiding-css');
                if (styleEl) styleEl.remove();
                
                // Log cleanup completion
                console.log(`[farmer_nina HIDING] All method overrides cleaned up`);
            });
        }
    } else {
        console.error("Game manager not found, farmer_nina's hiding ability may not work correctly");
    }
    
    // Update UI
    updateCharacterUI(caster);
};

const farmer_ninaW = new Ability(
    'farmer_nina_w',
    'Hiding',
    'Icons/abilities/hiding.jpeg',
    30, // Mana cost
    5,  // Cooldown
    farmer_ninaHidingEffect
).setDescription('Become untargetable for 2 turns and regenerate 350 HP each turn. Farmer farmer_nina can still be damaged by AOE and DOT effects. Stealth breaks if damaged or when using other abilities.') // Updated duration
 .setTargetType('self');

// E: Target Lock
const farmer_ninaTargetLockEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Farmer farmer_nina E: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Target Lock on ${target.name}.`);

    // --- Target Lock VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container target-lock-vfx-container'; // Specific container
        targetElement.appendChild(vfxContainer);

        // Create target lock visual effect (reticle animation)
        const lockVfx = document.createElement('div');
        lockVfx.className = 'target-lock-vfx'; // CSS handles reticle animation
        vfxContainer.appendChild(lockVfx);

        const lockReticle = document.createElement('div');
        lockReticle.className = 'target-lock-reticle';
        lockVfx.appendChild(lockReticle);

        // Create the persistent icon (added by CSS using .target-lock-icon on the debuff)
        // But we trigger the initial appearance animation here

        // Remove VFX container after animation completes
        setTimeout(() => {
            vfxContainer.remove();
        }, 800); // Match CSS animation duration
    }
    // --- End Target Lock VFX ---

    // Play sound effect
    playSound('sounds/target_lock.mp3', 0.7); // Example sound path

    // Create the damage amplification debuff
    const targetLockDebuff = new Effect(
        'farmer_nina_e_target_lock',
        'Target Lock',
        'Icons/abilities/target_lock.jpeg',
        10, // Duration: 10 turns
        null, // No per-turn effect needed
        true // isDebuff = true
    ).setDescription('Takes 15% more physical damage.');

    // Define the remove function
    targetLockDebuff.remove = (character) => {
        log(`${character.name} is no longer locked on.`);
        // Remove the visual effect if it exists
        const targetElement = document.getElementById(`character-${character.id}`);
        if (targetElement) {
            const lockIcon = targetElement.querySelector('.target-lock-icon');
            if (lockIcon) lockIcon.remove();
        }
    };
    
    // Apply the debuff to the target
    // This will go through the proper debuff channel
    target.addDebuff(targetLockDebuff.clone()); // Clone before adding

    log(`${target.name} is now locked on and will take 15% more physical damage!`);
    
    // Update UI
    updateCharacterUI(target);
};

// Store the original effect function for wrapping
const originalfarmer_ninaEEffect = farmer_ninaTargetLockEffect;

// Create wrapper function to break hiding
const wrappedfarmer_ninaTargetLockEffect = function(caster, target) {
    // Break hiding if Farmer farmer_nina is using this ability
    if (caster && caster.id === 'farmer_nina') {
        const hidingBuff = caster.buffs && caster.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
        if (hidingBuff && !hidingBuff.wasHidingBroken) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${caster.name}'s hiding is broken after using Target Lock!`);
            log(`${caster.name} reveals her position as she marks her target!`);
            
            // Use the complete removal function
            completelyRemoveHidingBuff(caster);
        }
    }
    
    // Call the original effect function
    return originalfarmer_ninaEEffect(caster, target);
};

const farmer_ninaE = new Ability(
    'farmer_nina_e',
    'Target Lock',
    'Icons/abilities/target_lock.jpeg',
    0, // No mana cost
    20, // 20 turn cooldown
    wrappedfarmer_ninaTargetLockEffect
).setDescription('Marks a target, causing them to take 15% more physical damage for 10 turns.')
 .setTargetType('enemy');

// R: Piercing Shot
const farmer_ninaPiercingShotEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Farmer farmer_nina R: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Piercing Shot on ${target.name}.`);
    log(`${caster.name} takes aim with a specialized armor-piercing round.`);

    // --- Piercing Shot VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        // 1. Piercing Shot Tracer (Fixed Position)
        const tracerVfx = document.createElement('div');
        tracerVfx.className = 'piercing-shot-tracer';
        document.body.appendChild(tracerVfx); // Append to body

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        tracerVfx.style.left = `${startX}px`;
        tracerVfx.style.top = `${startY}px`;
        tracerVfx.style.width = `${distance}px`;
        tracerVfx.style.transform = `rotate(${angle}deg)`;

        // Remove tracer after animation
        setTimeout(() => tracerVfx.remove(), 400); // Matches CSS animation

        // 2. Piercing Shot Impact (On Target)
        setTimeout(() => {
             if (!targetElement) return; // Check if target still exists

            const impactContainer = document.createElement('div');
            impactContainer.className = 'vfx-container piercing-shot-impact-container'; // Specific container
            targetElement.appendChild(impactContainer);

            const impactVfx = document.createElement('div');
            impactVfx.className = 'piercing-shot-impact';
            impactContainer.appendChild(impactVfx);

            // Add armor break text effect
            const armorBreakText = document.createElement('div');
            armorBreakText.className = 'armor-break-text';
            armorBreakText.textContent = 'ARMOR PIERCED!';
            impactContainer.appendChild(armorBreakText); // Append text to container

            // Remove impact container after animation (includes impact and text)
            setTimeout(() => impactContainer.remove(), 1000); // Match longest animation (armor-break-text)
        }, 300); // Delay impact slightly after tracer
    }
    // --- End Piercing Shot VFX ---

    // Play sound effect
    playSound('sounds/piercing_shot.mp3', 0.8); // Example sound path

    // Calculate base damage - 750 + 250% AD
    const baseDamage = 750 + (caster.stats.physicalDamage * 2.5);
    
    // Set damage source on target to track critical hit
    target.isDamageSource = caster;
    
    // Store original armor value to restore later
    const originalArmor = target.stats.armor;
    
    // Temporarily set target's armor to 0 to bypass it completely
    target.stats.armor = 0;
    
    // Apply damage (armor is already bypassed by setting it to 0)
    const result = target.applyDamage(baseDamage, 'physical');
    
    // Restore original armor value
    target.stats.armor = originalArmor;
    
    // Clear damage source
    target.isDamageSource = null;
    
    // Log damage dealt with detailed information
    log(`${target.name} takes ${result.damage} piercing physical damage that ignores armor!`);
    
    if (result.isCritical) {
        log("Critical Hit with Piercing Shot!");
    }
    
    // Add explanation about armor piercing
    log(`${caster.name}'s Piercing Shot completely bypassed ${target.name}'s ${originalArmor} armor.`);
    
    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);
    
    // Update UI
    updateCharacterUI(target);

    // Return the damage result for potential further processing
    return result;
};

// Store the original effect function for wrapping
const originalfarmer_ninaREffect = farmer_ninaPiercingShotEffect;

// Create wrapper function to break hiding
const wrappedfarmer_ninaPiercingShotEffect = function(caster, target) {
    // Break hiding if Farmer farmer_nina is using this ability
    if (caster && caster.id === 'farmer_nina') {
        const hidingBuff = caster.buffs && caster.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
        if (hidingBuff && !hidingBuff.wasHidingBroken) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${caster.name}'s hiding is broken after using Piercing Shot!`);
            log(`${caster.name} reveals her position as she fires her ultimate attack!`);
            
            // Use the complete removal function
            completelyRemoveHidingBuff(caster);
        }
    }
    
    // Call the original effect function
    return originalfarmer_ninaREffect(caster, target);
};

const farmer_ninaR = new Ability(
    'farmer_nina_r',
    'Piercing Shot',
    'Icons/abilities/piercing_shot.jpeg',
    100, // Mana cost: 100
    15,  // Cooldown: 15 turns
    wrappedfarmer_ninaPiercingShotEffect
).setDescription('Fires a specialized round that deals 750 (+250% AD) physical damage and completely ignores the target\'s armor.')
 .setTargetType('enemy');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        farmer_ninaQ,
        farmer_ninaW,
        farmer_ninaE,
        farmer_ninaR
        // Add other farmer_nina abilities as they are implemented
    ]);
} else {
    console.warn("farmer_nina abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.farmer_nina_q = farmer_ninaQ;
    window.definedAbilities.farmer_nina_w = farmer_ninaW;
    window.definedAbilities.farmer_nina_e = farmer_ninaE;
    window.definedAbilities.farmer_nina_r = farmer_ninaR;
}

// --- Target Lock Implementation ---
// Store the original applyDamage method
const originalApplyDamage = Character.prototype.applyDamage;

// Override with our version to implement Target Lock damage amplification
Character.prototype.applyDamage = function(amount, type, caster) {
    let finalAmount = amount; // Use let for mutable amount

    // Check if this character has the Target Lock debuff
    const hasTargetLock = this.debuffs && this.debuffs.some(d => d && d.id === 'farmer_nina_e_target_lock');

    // If Target Lock debuff is present and damage is physical, amplify the damage
    if (hasTargetLock && type === 'physical') {
        // Increase damage by 15%
        finalAmount = amount * 1.15; // Modify the amount passed to original method

        // Add log entry for the damage amplification
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        log(`Target Lock amplifies damage to ${this.name}!`);
    }

    // --- Hiding Damage Break Logic ---
    // Check if THIS character is Farmer Nina and is hiding
    if (this.id === 'farmer_nina') {
        const hidingBuff = this.buffs && this.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
        // Break hiding ONLY IF damage is actually taken (amount > 0) and hiding isn't already broken
        if (hidingBuff && !hidingBuff.wasHidingBroken && finalAmount > 0) {
             // Check if damage is direct (not AoE or DoT - needs refinement)
             // For now, assume any damage breaks it as per description.
             // We might need more context from the 'caster' or 'options' in applyDamage if available.
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name}'s hiding is broken after taking ${type} damage!`);

            // Use the complete removal function
            completelyRemoveHidingBuff(this);
        }
    }
    // --- End Hiding Damage Break Logic ---

    // Call the original method with our potentially modified damage amount
    // IMPORTANT: Pass 'finalAmount' instead of 'amount'
    return originalApplyDamage.call(this, finalAmount, type, caster);
};

// --- Debug/Testing Function ---
// This function can be called from the browser console to test farmer_nina's passive
window.testfarmer_ninaPassive = function() {
    try {
        console.log("Testing Farmer farmer_nina's Amplified Buffs passive...");
        
        // Check if Farmer farmer_nina is in the game
        const farmer_nina = Array.from(document.querySelectorAll('.character-info')).find(el => 
            el.querySelector('.character-name').textContent.includes('farmer_nina')
        );
        
        if (!farmer_nina) {
            console.error("Farmer farmer_nina not found in the current game! Add her to your team to test the passive.");
            return;
        }
        
        const farmer_ninaId = farmer_nina.closest('.character').id.replace('character-', '');
        const farmer_ninaCharacter = window.gameManager.characters.find(c => c.id === farmer_ninaId);
        
        if (!farmer_ninaCharacter) {
            console.error("Farmer farmer_nina character object not found!");
            return;
        }
        
        console.log("Creating test buffs to apply to Farmer farmer_nina...");
        
        // Test with various stat types
        const testBuffs = [
            {
                name: "Test AD Buff",
                stat: "physicalDamage",
                value: 20,
                expectedDoubled: 40
            },
            {
                name: "Test Crit Chance Buff",
                stat: "critChance",
                value: 0.05,
                expectedDoubled: 0.1
            },
            {
                name: "Test Dodge Chance Buff",
                stat: "dodgeChance",
                value: 0.03,
                expectedDoubled: 0.06
            }
        ];
        
        // Apply each test buff
        testBuffs.forEach(testBuff => {
            console.log(`Testing buff: ${testBuff.name} (${testBuff.stat} +${testBuff.value})`);
            
            // Record original stat value
            const originalStat = farmer_ninaCharacter.stats[testBuff.stat];
            console.log(`Original ${testBuff.stat}: ${originalStat}`);
            
            // Create and apply buff
            const buff = new Effect(
                `test_${testBuff.stat}_buff`,
                testBuff.name,
                'Icons/abilities/buff_icon.jpeg',
                3,
                () => {},
                false
            );
            
            // Set stat modifier
            buff.statModifiers = {};
            buff.statModifiers[testBuff.stat] = testBuff.value;
            
            // Apply the buff (this should trigger farmer_nina's passive)
            farmer_ninaCharacter.addBuff(buff);
            
            // Check if the stat was correctly doubled
            const newStat = farmer_ninaCharacter.stats[testBuff.stat];
            const actualIncrease = newStat - originalStat;
            
            console.log(`New ${testBuff.stat}: ${newStat}`);
            console.log(`Actual increase: ${actualIncrease}`);
            console.log(`Expected increase: ${testBuff.expectedDoubled}`);
            
            if (Math.abs(actualIncrease - testBuff.expectedDoubled) < 0.0001) {
                console.log(`✅ PASS: ${testBuff.name} correctly doubled!`);
            } else {
                console.error(`❌ FAIL: ${testBuff.name} not doubled correctly. Got ${actualIncrease}, expected ${testBuff.expectedDoubled}`);
            }
            
            // Clean up by removing the buff
            const buffIndex = farmer_ninaCharacter.buffs.findIndex(b => b.id === buff.id);
            if (buffIndex !== -1) {
                farmer_ninaCharacter.buffs.splice(buffIndex, 1);
                
                // Reset the stat manually since we're bypassing the normal removal
                farmer_ninaCharacter.stats[testBuff.stat] = originalStat;
                console.log(`Cleaned up test buff, reset ${testBuff.stat} to ${originalStat}`);
            }
        });
        
        console.log("Farmer farmer_nina passive test complete!");
        
    } catch (error) {
        console.error("Error testing Farmer farmer_nina's passive:", error);
    }
};

// Add a debugging hook to monitor all ability uses
if (typeof window !== 'undefined') {
    // Create a debugging event handler
    window.addEventListener('DOMContentLoaded', () => {
        console.log('%c[farmer_nina HIDING] Setting up global ability monitoring', 'background: blue; color: white');
        
        // Create a global event listener for clicks on ability buttons
        document.addEventListener('click', (event) => {
            // Find if the click was on an ability button
            const abilityButton = event.target.closest('.ability-button');
            if (abilityButton) {
                const abilityId = abilityButton.dataset.abilityId;
                
                // Find if this is one of farmer_nina's abilities
                if (abilityId && (abilityId === 'farmer_nina_q' || abilityId === 'farmer_nina_e')) {
                    console.log(`%c[farmer_nina HIDING DEBUG] Clicked ability: ${abilityId}`, 'background: #660066; color: white; font-weight: bold');
                    
                    // Find farmer_nina
                    const farmer_ninaElement = document.querySelector('[data-character-id="farmer_nina"]');
                    if (farmer_ninaElement) {
                        // Check if farmer_nina has hiding
                        const farmer_ninaChar = window.gameManager && window.gameManager.characters.find(c => c.id === 'farmer_nina');
                        if (farmer_ninaChar) {
                            const hidingBuff = farmer_ninaChar.buffs && farmer_ninaChar.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                            if (hidingBuff) {
                                console.log(`%c[farmer_nina HIDING] farmer_nina has hiding buff when using ${abilityId}`, 'background: red; color: white; font-weight: bold');
                                
                                // Force a double-check for hiding to be broken
                                setTimeout(() => {
                                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                    log(`[SYSTEM] Forcibly checking if hiding should be broken by ${abilityId}`);
                                    
                                    // Force hiding to break if it wasn't already
                                    if (!hidingBuff.wasHidingBroken) {
                                        log(`[SYSTEM] Forcibly breaking hiding that wasn't removed by ${abilityId}`);
                                        
                                        // Use the complete removal function
                                        completelyRemoveHidingBuff(farmer_ninaChar);
                                    }
                                }, 500);
                            }
                        }
                    }
                }
            }
        });
    });
}

// Helper function to completely remove Nina's hiding buff and reset all states
function completelyRemoveHidingBuff(character) {
    if (!character || character.id !== 'farmer_nina') return;

    // Find the hiding buff
    const hidingBuffIndex = character.buffs ? character.buffs.findIndex(b => b && b.id === 'farmer_nina_w_hiding_buff') : -1;

    if (hidingBuffIndex !== -1) {
        const hidingBuff = character.buffs[hidingBuffIndex];
        // Mark hiding as broken first (so setter logic runs if defined)
        if (hidingBuff) hidingBuff.wasHidingBroken = true;

        // Remove the hiding buff using the Character's method if possible
        if (typeof character.removeBuff === 'function') {
            character.removeBuff('farmer_nina_w_hiding_buff');
        } else {
            // Fallback removal
            character.buffs.splice(hidingBuffIndex, 1);
        }
    }

    // Restore opacity immediately
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (charElement) {
        charElement.style.opacity = '1';
        charElement.dataset.isHiding = "false";
        // Remove any lingering cloak effects
        const cloakVfx = charElement.querySelector('.hiding-vfx-container');
        if(cloakVfx) cloakVfx.remove();
    }

    // Clear any hiding flags
    delete character._hidingActive;
    delete character.isUntargetable;

    // Update UI immediately after state change
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(character);
    }

    console.log(`[farmer_nina HIDING] Completely removed hiding buff and reset all states for ${character.name}`);
}

// Utility function to test Farmer Nina's hiding breaking mechanics
function testFarmerNinaHidingBreakMechanics() {
    try {
        console.log('%c[TESTING] Farmer Nina Hiding Break Mechanics', 'background: #4a0; color: white; font-weight: bold');
        
        // Find Farmer Nina if she exists in the game
        const gameManager = window.gameManager;
        if (!gameManager) {
            console.error('[TESTING] Game manager not found');
            return;
        }
        
        const ninaCharacter = gameManager.characters.find(char => char && char.id === 'farmer_nina');
        if (!ninaCharacter) {
            console.error('[TESTING] Farmer Nina character not found in current game');
            return;
        }
        
        console.log('[TESTING] Found Farmer Nina character:', ninaCharacter.name);
        
        // Apply hiding buff manually for testing
        const hidingBuff = new Effect(
            'farmer_nina_w_hiding_buff',
            'Hiding',
            'Icons/abilities/hiding.jpeg',
            2, // Duration: 2 turns
            (character) => {
                // Heal 350 HP per turn
                const healAmount = character.heal(350);
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                log(`${character.name} regenerates ${healAmount} HP while hiding.`);
            },
            false // isDebuff = false
        ).setDescription('Farmer Nina is untargetable while hiding. Hiding breaks if damaged or when using other abilities.');
        
        // Remove existing hiding buff if any
        completelyRemoveHidingBuff(ninaCharacter);
        
        // Add test buff
        ninaCharacter.buffs.push(hidingBuff);
        console.log('[TESTING] Applied hiding buff to Farmer Nina');
        
        // Set the character element opacity to simulate hiding
        const charElement = document.getElementById(`character-${ninaCharacter.id}`);
        if (charElement) {
            charElement.style.opacity = '0.6';
            charElement.dataset.isHiding = "true";
        }
        
        // Set hiding flags
        ninaCharacter._hidingActive = true;
        ninaCharacter.isUntargetable = true;
        
        // TEST 1: Check if hiding breaks when using abilities
        console.log('[TESTING] Test 1: Checking if hiding breaks when using abilities');
        if (ninaCharacter.abilities && ninaCharacter.abilities.length > 0) {
            const testAbility = ninaCharacter.abilities.find(a => a.id === 'farmer_nina_q');
            if (testAbility) {
                console.log('[TESTING] Using test ability:', testAbility.name);
                // The use method should handle breaking hiding
                ninaCharacter.use(testAbility.id, ninaCharacter);
                
                // Check if hiding was broken
                const hidingBuffAfterAbility = ninaCharacter.buffs.find(b => b.id === 'farmer_nina_w_hiding_buff');
                console.log('[TESTING] Hiding buff after ability use:', hidingBuffAfterAbility ? 'Still active' : 'Removed as expected');
            } else {
                console.error('[TESTING] Test ability not found');
            }
        }
        
        // Reapply the buff for the second test
        completelyRemoveHidingBuff(ninaCharacter);
        ninaCharacter.buffs.push(hidingBuff);
        ninaCharacter._hidingActive = true;
        ninaCharacter.isUntargetable = true;
        
        if (charElement) {
            charElement.style.opacity = '0.6';
            charElement.dataset.isHiding = "true";
        }
        
        console.log('[TESTING] Reapplied hiding buff for second test');
        
        // TEST 2: Check if hiding breaks when taking damage
        console.log('[TESTING] Test 2: Checking if hiding breaks when taking damage');
        const damageResult = ninaCharacter.applyDamage(100, 'physical');
        console.log('[TESTING] Applied test damage:', damageResult.damage);
        
        // Check if hiding was broken
        const hidingBuffAfterDamage = ninaCharacter.buffs.find(b => b.id === 'farmer_nina_w_hiding_buff');
        console.log('[TESTING] Hiding buff after taking damage:', hidingBuffAfterDamage ? 'Still active' : 'Removed as expected');
        
        // Cleanup after testing
        updateCharacterUI(ninaCharacter);
        console.log('%c[TESTING] Completed Farmer Nina hiding break mechanics tests', 'background: #4a0; color: white; font-weight: bold');
    } catch (error) {
        console.error('[TESTING] Error during Farmer Nina hiding tests:', error);
    }
}

// Expose the test function to the global scope
if (typeof window !== 'undefined') {
    window.testFarmerNinaHidingBreakMechanics = testFarmerNinaHidingBreakMechanics;
}

// Check for testing trigger in URL
if (typeof window !== 'undefined' && window.location.href.includes('test_nina_mechanics')) {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            testFarmerNinaHidingBreakMechanics();
        }, 2000); // Give game time to load
    });
}