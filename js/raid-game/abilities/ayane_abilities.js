// Ability definitions for Ayane

// Assume Ability, Effect classes and addLogEntry function are available globally or imported
// If not, ensure they are properly included in the execution context.

// --- Helper Functions for Passive ---

function checkAyanePassive(caster) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Roll for 50% chance to trigger passive
    const rollValue = Math.random();
    const triggerChance = 0.5; // 50% chance
    
    // Force to true for testing
    const shouldTrigger = rollValue < triggerChance;
    
    // 50% chance to trigger the passive
    if (shouldTrigger) {
        log(`${caster.name}'s Combat Reflexes activates!`);
        
        // Find all abilities on cooldown
        const abilitiesOnCooldown = caster.abilities.filter(ability => ability.currentCooldown > 0);
        
        if (abilitiesOnCooldown.length > 0) {
            // Reduce cooldown of all abilities on cooldown by 1
            abilitiesOnCooldown.forEach(ability => {
                ability.currentCooldown = Math.max(0, ability.currentCooldown - 1);
                log(`${ability.name}'s cooldown reduced to ${ability.currentCooldown} turns.`);
            });
            
            // Add a passive activation VFX
            const casterElement = document.getElementById(`character-${caster.id}`);
            if (casterElement) {
                const passiveVfx = document.createElement('div');
                passiveVfx.className = 'ayane-passive-vfx';
                passiveVfx.innerHTML = '<div class="ayane-passive-symbol">⚡</div>';
                casterElement.appendChild(passiveVfx);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    passiveVfx.remove();
                }, 1000);
            }
            
            // Update UI
            updateCharacterUI(caster);
        } else {
            log(`No abilities on cooldown to reduce.`);
        }
    }
}

// --- Base wrapper for all of Ayane's abilities to handle passive ---
function wrapAyaneAbility(abilityEffect) {
    return function(caster, target) {
        // First execute the original ability effect
        abilityEffect(caster, target);
        
        // Then check for passive trigger (unless already handled in the ability)
        if (!caster.skipPassiveCheck) {
            checkAyanePassive(caster);
        }
        
        // Reset flag if it was set
        if (caster.skipPassiveCheck) {
            caster.skipPassiveCheck = false;
        }
    };
}

// --- Ability Definitions ---

// Q: Teleport Blade - Original effect without passive handling
const teleportBladeBaseEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const gameManager = window.gameManager;
    
    if (!target) {
        log("Ayane Q: No target selected!", "error");
        return;
    }
    
    log(`${caster.name} uses Teleport Blade on ${target.name}.`);
    
    // --- Teleport VFX Start ---
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${target.id}`);
    
    if (casterElement && targetElement) {
        // Add teleport-out effect to caster
        casterElement.classList.add('teleport-out');
        
        // Create afterimage effect
        const afterimage = document.createElement('div');
        afterimage.className = 'teleport-afterimage';
        afterimage.style.backgroundImage = `url('${caster.image}')`;
        casterElement.appendChild(afterimage);
        
        // Schedule the target-appearance animation
        setTimeout(() => {
            // Add teleport-in effect to target location
            const teleportInVfx = document.createElement('div');
            teleportInVfx.className = 'teleport-in-vfx';
            targetElement.appendChild(teleportInVfx);
            
            // Remove caster's teleport-out class
            casterElement.classList.remove('teleport-out');
            
            // Add slash effect
            const slashVfx = document.createElement('div');
            slashVfx.className = 'teleport-blade-slash';
            targetElement.appendChild(slashVfx);
            
            // Clean up VFX elements
            setTimeout(() => {
                afterimage.remove();
                teleportInVfx.remove();
                slashVfx.remove();
            }, 600);
        }, 400);
    }
    // --- Teleport VFX End ---
    
    // Calculate and apply damage
    const baseDamage = caster.stats.physicalDamage * 1.0; // 100% AD (fixed from 5.0)
    const result = target.applyDamage(baseDamage, 'physical');
    
    log(`${target.name} takes ${result.damage} physical damage.`);
    if (result.isCritical) {
        log("Critical Hit!");
    }
    
    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);
    
    // Roll for chance to trigger combo (45% chance)
    const rollValue = Math.random();
    const triggerChance = 0.45; // 45% chance
    const isComboTriggered = rollValue < triggerChance;
    
    if (isComboTriggered) {
        // Create a combo VFX
        if (casterElement) {
            const comboVfx = document.createElement('div');
            comboVfx.className = 'combo-trigger-vfx';
            comboVfx.textContent = 'COMBO!';
            casterElement.appendChild(comboVfx);
            
            // Remove the VFX after animation
            setTimeout(() => {
                comboVfx.remove();
            }, 1200);
        }
        
        // Get reference to the ability
        const teleportBladeAbility = caster.abilities.find(ability => ability.id === 'ayane_q');
        
        // Call the preventTurnEnd method in the gameManager
        if (gameManager) {
            try {
                if (typeof gameManager.preventTurnEnd === 'function') {
                    gameManager.preventTurnEnd();
                    log(`${caster.name}'s combo allows another action!`);
                } else {
                    // Fallback for backward compatibility
                    gameManager.preventTurnEndFlag = true;
                    log(`${caster.name}'s combo allows another action! (fallback method)`);
                }
            } catch (error) {
                console.error("Error in Teleport Blade combo effect:", error);
            }
        } else {
            log(`${caster.name}'s combo would allow another action, but gameManager not available.`);
        }
    }
    
    // Update UI
    updateCharacterUI(caster);
};

// Wrap the Teleport Blade ability with passive handler
const ayaneQEffect = wrapAyaneAbility(teleportBladeBaseEffect);

const ayaneQ = new Ability(
    'ayane_q',
    'Teleport Blade',
    'Icons/abilities/teleport_blade.png',
    20, // Mana cost
    1,  // Cooldown
    ayaneQEffect
).setDescription('Deals 100% AD physical damage. 45% chance to allow another action without ending turn.')
 .setTargetType('enemy');

// W: Butterfly Trail
const ayaneButterflayTrailBaseEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    log(`${caster.name} uses Butterfly Trail, reducing all allies' cooldowns!`);
    
    // Get all alive player team characters
    const playerTeam = window.gameManager ? 
        window.gameManager.gameState.playerCharacters.filter(char => !char.isDead()) : 
        [caster]; // Fallback if game manager isn't available
    
    // Determine if we get lucky with the 20% chance for 2-turn reduction
    const isLucky = Math.random() < 0.2; // 20% chance
    const reductionAmount = isLucky ? 2 : 1;
    
    log(`${caster.name}'s Butterfly Trail ${isLucky ? 'shines brightly' : 'flows'} and reduces cooldowns by ${reductionAmount} turn${reductionAmount > 1 ? 's' : ''}!`);
    
    // Reduce cooldowns for all team members
    playerTeam.forEach(character => {
        // Find all abilities on cooldown
        const abilitiesOnCooldown = character.abilities.filter(ability => ability.currentCooldown > 0);
        
        if (abilitiesOnCooldown.length > 0) {
            // Reduce cooldown of all abilities on cooldown
            abilitiesOnCooldown.forEach(ability => {
                const oldCooldown = ability.currentCooldown;
                ability.currentCooldown = Math.max(0, ability.currentCooldown - reductionAmount);
                
                log(`${character.name}'s ${ability.name} cooldown reduced from ${oldCooldown} to ${ability.currentCooldown} turns.`);
                
                // Add visual effect to cooldown indicators in the UI
                const characterElement = document.getElementById(`character-${character.id}`);
                if (characterElement) {
                    // Find all ability elements for this character
                    const abilityElements = characterElement.querySelectorAll('.ability');
                    
                    abilityElements.forEach((abilityEl, index) => {
                        // Match the ability index with our current ability
                        if (character.abilities[index] && character.abilities[index].id === ability.id) {
                            // Find the cooldown indicator
                            const cooldownEl = abilityEl.querySelector('.ability-cooldown');
                            if (cooldownEl) {
                                // Add animation class
                                cooldownEl.classList.add('cooldown-reduced');
                                
                                // Remove class after animation completes
                                setTimeout(() => {
                                    cooldownEl.classList.remove('cooldown-reduced');
                                }, 1000);
                            }
                        }
                    });
                }
            });
            
            // Update UI for the character
            updateCharacterUI(character);
        }
    });
    
    // Add butterfly trail VFX to all affected characters
    playerTeam.forEach(character => {
        const characterElement = document.getElementById(`character-${character.id}`);
        if (characterElement) {
            // Create butterfly trail effect
            const butterflyTrailVfx = document.createElement('div');
            butterflyTrailVfx.className = 'butterfly-trail-vfx';
            characterElement.appendChild(butterflyTrailVfx);
            
            // Create butterfly particles
            for (let i = 0; i < 5; i++) {
                const butterflyParticle = document.createElement('div');
                butterflyParticle.className = 'butterfly-particle';
                butterflyParticle.style.animationDelay = `${i * 0.2}s`;
                butterflyTrailVfx.appendChild(butterflyParticle);
            }
            
            // Remove VFX after animation completes
            setTimeout(() => {
                butterflyTrailVfx.remove();
            }, 2000);
        }
    });
};

// Wrap with passive handler
const ayaneWEffect = wrapAyaneAbility(ayaneButterflayTrailBaseEffect);

const ayaneW = new Ability(
    'ayane_w',
    'Butterfly Trail',
    'Icons/abilities/butterfly_trail.png',
    25, // Mana cost
    4,  // Cooldown
    ayaneWEffect
).setDescription('Reduces all teammates\' and Ayane\'s active cooldowns by 1 turn. Has 20% chance to reduce by 2 turns instead.')
 .setTargetType('self');

// E: Ready to Slice
const ayaneReadyToSliceBaseEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    log(`${caster.name} uses Ready to Slice, entering a focused combat stance!`);
    
    // Create and apply the buff effect
    const buffDuration = 5; // 5 turns
    
    // Create effect for damage boost and dodge
    const readyToSliceEffect = new Effect(
        'ready_to_slice',
        'Ready to Slice',
        'Icons/abilities/ready_to_slice.jfif',
        buffDuration,
        // We're passing an empty function for the effect since we handle stat change in onApply
        () => {},
        false // not a debuff
    );
    
    // Use statModifiers to be compatible with the standard buff system
    readyToSliceEffect.statModifiers = {
        physicalDamage: Math.round(caster.stats.physicalDamage * 0.5), // 50% increase as actual value
        dodgeChance: 0.2 // 20% dodge chance increase as actual value
    };
    
    // Still keep onApply for backward compatibility and visual effects
    readyToSliceEffect.onApply = (character) => {
        // Add visual effect
        const characterElement = document.getElementById(`character-${character.id}`);
        if (characterElement) {
            const readyToSliceVfx = document.createElement('div');
            readyToSliceVfx.className = 'ready-to-slice-vfx';
            characterElement.appendChild(readyToSliceVfx);
        }
        
        // Log the application
        log(`${character.name}'s physical damage is increased by 50% and dodge chance by 20%!`);
    };
    
    // Keep remove method for visual cleanup
    readyToSliceEffect.remove = (character) => {
        // Remove visual effect
        const characterElement = document.getElementById(`character-${character.id}`);
        if (characterElement) {
            const readyToSliceVfx = characterElement.querySelector('.ready-to-slice-vfx');
            if (readyToSliceVfx) {
                readyToSliceVfx.remove();
            }
        }
        
        log(`${character.name}'s Ready to Slice effect has worn off.`);
    };
    
    // Set description to ensure it matches the actual effect
    readyToSliceEffect.setDescription('Increases physical damage by 50% and dodge chance by 20%.');
    
    // Apply the effect to the caster
    caster.addBuff(readyToSliceEffect);
    
    // Add additional visual effects for the ability activation
    const casterElement = document.getElementById(`character-${caster.id}`);
    if (casterElement) {
        // Create activation effect
        const activationVfx = document.createElement('div');
        activationVfx.className = 'ready-to-slice-activation';
        casterElement.appendChild(activationVfx);
        
        // Remove activation effect after animation completes
        setTimeout(() => {
            activationVfx.remove();
        }, 1500);
    }
    
    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(caster);
    } else {
        updateCharacterUI(caster);
    }
};

// Wrap with passive handler
const ayaneEEffect = wrapAyaneAbility(ayaneReadyToSliceBaseEffect);

const ayaneE = new Ability(
    'ayane_e',
    'Ready to Slice',
    'Icons/abilities/ready_to_slice.jfif',
    100, // Mana cost
    11,  // Cooldown
    ayaneEEffect
).setDescription('Gains 50% bonus physical damage (AD) and 20% dodge chance for 5 turns.')
 .setTargetType('self');

// R: Execute Attack
const ayaneExecuteAttackBaseEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const gameManager = window.gameManager;
    
    if (!target) {
        log("Ayane R: No target selected!", "error");
        return;
    }
    
    // Calculate target's health percentage - fix to use the correct property names
    const healthPercentage = target.stats.currentHp / target.stats.maxHp;
    
    // Check if target is below 25% health
    if (healthPercentage > 0.25) {
        log(`${caster.name} tries to use Execute Attack, but ${target.name} has too much health!`);
        log(`Target must be below 25% health to use this ability.`);
        
        // Don't consume cooldown or mana if the ability can't be used
        const executeAttackAbility = caster.abilities.find(ability => ability.id === 'ayane_r');
        if (executeAttackAbility) {
            executeAttackAbility.currentCooldown = 0;
        }
        
        // Prevent turn end, just like in the teleport blade ability
        if (gameManager) {
            try {
                if (typeof gameManager.preventTurnEnd === 'function') {
                    console.log("[DEBUG] Calling gameManager.preventTurnEnd() in Execute Attack");
                    gameManager.preventTurnEnd();
                } else {
                    // Fallback for backward compatibility
                    console.log("[DEBUG] Using fallback preventTurnEndFlag in Execute Attack");
                    gameManager.preventTurnEndFlag = true;
                }
                
                // Force direct access to turn control
                gameManager.preventTurnEndFlag = true;
                
                // Try to directly manipulate the actedCharacters list
                if (gameManager.actedCharacters && Array.isArray(gameManager.actedCharacters)) {
                    const charIndex = gameManager.actedCharacters.indexOf(caster.id);
                    if (charIndex > -1) {
                        gameManager.actedCharacters.splice(charIndex, 1);
                    }
                }
            } catch (error) {
                console.error("[DEBUG] Error in preventTurnEnd for Execute Attack:", error);
            }
        }
        
        return false; // Return false to indicate the ability wasn't used
    }
    
    log(`${caster.name} uses Execute Attack on ${target.name}!`);
    
    // --- Execute VFX Start ---
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${target.id}`);
    
    if (casterElement && targetElement) {
        // Create execute animation
        const executeVfx = document.createElement('div');
        executeVfx.className = 'execute-attack-vfx';
        targetElement.appendChild(executeVfx);
        
        // Add a dramatic flash effect
        const flashVfx = document.createElement('div');
        flashVfx.className = 'execute-flash-vfx';
        targetElement.appendChild(flashVfx);
        
        // Clean up VFX elements
        setTimeout(() => {
            executeVfx.remove();
            flashVfx.remove();
        }, 800);
    }
    // --- Execute VFX End ---
    
    // Calculate and apply damage
    const baseDamage = caster.stats.physicalDamage * 5.0; // 500% AD (increased from 3.5)
    const result = target.applyDamage(baseDamage, 'physical');
    
    log(`${target.name} takes ${result.damage} physical damage!`);
    if (result.isCritical) {
        log("Critical Hit!");
    }
    
    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);
    
    // Check if target died from the attack
    if (target.isDead()) {
        log(`${caster.name}'s Execute Attack has killed ${target.name}!`);
        
        // Reset cooldown
        const executeAttackAbility = caster.abilities.find(ability => ability.id === 'ayane_r');
        if (executeAttackAbility) {
            executeAttackAbility.currentCooldown = 0;
            log(`${caster.name}'s Execute Attack cooldown has been reset!`);
            
            // Add reset VFX
            if (casterElement) {
                const resetVfx = document.createElement('div');
                resetVfx.className = 'cooldown-reset-vfx';
                resetVfx.textContent = 'RESET!';
                casterElement.appendChild(resetVfx);
                
                // Remove the VFX after animation
                setTimeout(() => {
                    resetVfx.remove();
                }, 1200);
            }
        }
    }
    
    // Update UI after all changes
    updateCharacterUI(caster);
    
    return true; // Return true to indicate the ability was used successfully
};

// Wrap with passive handler
const ayaneREffect = wrapAyaneAbility(ayaneExecuteAttackBaseEffect);

const ayaneR = new Ability(
    'ayane_r',
    'Execute Attack',
    'Icons/abilities/execute_attack.jfif',
    35, // Mana cost
    2,  // Cooldown - Changed from 3 to 2 turns
    ayaneREffect
).setDescription('Deals 500% AD physical damage to targets below 25% health. Cooldown resets if it kills the target.')
 .setTargetType('enemy');

// Register abilities in the AbilityFactory
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        ayaneQ,
        ayaneW,
        ayaneE,
        ayaneR,
        // Add other Ayane abilities here when implemented
    ]);
} else {
    console.warn("Ayane abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.ayane_q = ayaneQ;
    window.definedAbilities.ayane_w = ayaneW;
    window.definedAbilities.ayane_e = ayaneE;
    window.definedAbilities.ayane_r = ayaneR;
} 