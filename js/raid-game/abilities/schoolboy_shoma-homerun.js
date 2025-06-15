// Schoolboy Shoma's Homerun Ability Implementation

/**
 * Implements the Homerun ability for Schoolboy Shoma
 * This ability:
 * 1. Gives 100% dodge chance for 3 turns
 * 2. Resets all ability cooldowns to 0
 * 3. Allows selecting a new ball type
 */

// Register a custom handler for the Homerun ability
document.addEventListener('DOMContentLoaded', function() {
    console.log('Schoolboy Shoma Homerun ability module loaded');
    
    try {
        // Check if AbilityFactory exists
        if (typeof AbilityFactory === 'undefined') {
            console.error('AbilityFactory not defined - Homerun ability cannot be initialized');
            return;
        }
        
        // Store the original createBuffEffect method
        const originalCreateBuffEffect = AbilityFactory.createBuffEffect;
        
        // Override the createBuffEffect method to handle the Homerun ability
        AbilityFactory.createBuffEffect = function(abilityData) {
            // Call the original method for most abilities
            const originalEffect = originalCreateBuffEffect.call(this, abilityData);
            
            // Check if this is the Homerun ability
            if (abilityData.id === 'homerun') {
                console.log('Creating Homerun ability effect');
                
                return function(caster, target) {
                    // Make sure this is used by Schoolboy Shoma
                    if (caster.id !== 'schoolboy_shoma') {
                        console.error('Homerun ability used by non-Schoolboy Shoma character');
                        originalEffect(caster, target);
                        return;
                    }
                    
                    console.log('Executing Homerun ability');
                    
                    // Debug: Check dodge chance before buff
                    console.log(`[Homerun Debug] ${caster.name} dodge chance BEFORE buff: ${caster.stats.dodgeChance}`);
                    
                    // 1. Apply the normal buff effect (100% dodge for 3 turns)
                    originalEffect(caster, target);
                    
                    // NEW: Attach an onRemove handler to ensure dodge chance is restored
                    const homerunBuff = caster.buffs.find(b => b.id === 'homerun_buff');
                    if (homerunBuff && !homerunBuff._enhancedOnRemove) {
                        // Preserve reference so we do not attach multiple times for stacked buffs
                        homerunBuff._enhancedOnRemove = true;
                        // Store caster's base dodge chance at the moment of application (may already include talents / stage mods)
                        homerunBuff._originalDodgeChance = caster.baseStats.dodgeChance;
                        homerunBuff.onRemove = function(character) {
                            try {
                                // Restore dodge chance to base value and recalculate stats to apply any other active effects
                                if (character && character.baseStats) {
                                    character.stats.dodgeChance = character.baseStats.dodgeChance;
                                }
                                character.recalculateStats('homerun-buff-removed');
                            } catch (e) {
                                console.error('[Homerun] Error restoring dodge chance on buff removal:', e);
                            }
                        };
                    }
                    
                    // Debug: Check dodge chance after buff and verify buff was applied
                    console.log(`[Homerun Debug] ${caster.name} dodge chance AFTER buff: ${caster.stats.dodgeChance}`);
                    console.log(`[Homerun Debug] ${caster.name} current buffs:`, caster.buffs.map(b => ({ 
                        id: b.id, 
                        name: b.name, 
                        effects: b.effects, 
                        statModifiers: b.statModifiers 
                    })));
                    
                    // Play Homerun sound
                    const playSoundHomerun = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundHomerun('sounds/shomaa4.mp3');
                    
                    // 2. Reset all ability cooldowns
                    caster.abilities.forEach(ability => {
                        ability.currentCooldown = 0;
                    });
                    
                    // Update UI to reflect cooldown changes
                    // Use the global function instead of accessing through gameManager
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(caster);
                    } else {
                        console.error('updateCharacterUI function not found');
                    }
                    
                    // Add a log entry about cooldown reset
                    const logFunction = typeof addLogEntry === 'function' ? 
                        addLogEntry : console.log;
                    logFunction(`${caster.name}'s ability cooldowns have been reset!`);
                    
                    // 3. Show ball selection dialog
                    // Use a small timeout to let the current ability complete first
                    setTimeout(() => {
                        try {
                            // Only try to show ball selection if the function exists
                            if (typeof showBallSelectionForShoma === 'function') {
                                logFunction(`${caster.name} can choose a new ball type!`);
                                
                                // Pass the character and callback function
                                showBallSelectionForShoma(caster, () => {
                                    console.log('New ball selection completed');
                                    
                                    // Ensure UI is updated with new ball icon
                                    setTimeout(() => {
                                        // Find the Ball Throw ability index - search for any ball_throw variant
                                        const ballThrowIndex = caster.abilities.findIndex(ability => 
                                            ability.id.startsWith('ball_throw'));
                                        
                                        if (ballThrowIndex !== -1) {
                                            try {
                                                // Force update the ability UI to show new ball
                                                const abilityElement = document.querySelector(
                                                    `#character-${caster.id} .ability[data-index="${ballThrowIndex}"] .ability-icon`
                                                );
                                                
                                                if (abilityElement && caster.abilities[ballThrowIndex].icon) {
                                                    abilityElement.src = caster.abilities[ballThrowIndex].icon;
                                                    console.log(`Updated Ball Throw icon after Homerun to: ${caster.abilities[ballThrowIndex].icon}`);
                                                } else {
                                                    console.error('Could not find ability icon element or icon property');
                                                }
                                                
                                                // Also update the full character UI to ensure everything is refreshed
                                                if (typeof updateCharacterUI === 'function') {
                                                    updateCharacterUI(caster);
                                                }
                                            } catch (uiError) {
                                                console.error('Error updating ability icon in UI after Homerun:', uiError);
                                            }
                                        }
                                    }, 100); // Small delay to ensure ball selection is fully processed
                                });
                            } else {
                                console.error('showBallSelectionForShoma function not found');
                                // Try to load the script if it's not already loaded
                                const script = document.createElement('script');
                                script.src = 'js/raid-game/characters/schoolboy_shoma-ball-selection.js';
                                script.onload = function() {
                                    console.log('Loaded ball selection script');
                                    if (typeof showBallSelectionForShoma === 'function') {
                                        showBallSelectionForShoma(caster, () => {
                                            console.log('New ball selection completed (delayed load)');
                                            
                                            // Ensure UI is updated with new ball icon
                                            setTimeout(() => {
                                                // Find the Ball Throw ability index
                                                const ballThrowIndex = caster.abilities.findIndex(ability => 
                                                    ability.id.startsWith('ball_throw'));
                                                
                                                if (ballThrowIndex !== -1) {
                                                    try {
                                                        // Force update the ability UI to show new ball
                                                        const abilityElement = document.querySelector(
                                                            `#character-${caster.id} .ability[data-index="${ballThrowIndex}"] .ability-icon`
                                                        );
                                                        
                                                        if (abilityElement && caster.abilities[ballThrowIndex].icon) {
                                                            abilityElement.src = caster.abilities[ballThrowIndex].icon;
                                                            console.log(`Updated Ball Throw icon after Homerun to: ${caster.abilities[ballThrowIndex].icon}`);
                                                        } else {
                                                            console.error('Could not find ability element or icon property');
                                                        }
                                                        
                                                        // Also update the full character UI to ensure everything is refreshed
                                                        if (typeof updateCharacterUI === 'function') {
                                                            updateCharacterUI(caster);
                                                        }
                                                    } catch (uiError) {
                                                        console.error('Error updating ability icon in UI after Homerun:', uiError);
                                                    }
                                                } else {
                                                    console.error('Ball Throw ability not found after selection');
                                                }
                                            }, 100); // Small delay to ensure ball selection is fully processed
                                        });
                                    } else {
                                        console.error('showBallSelectionForShoma still not found after loading script');
                                    }
                                };
                                script.onerror = function() {
                                    console.error('Failed to load ball selection script');
                                };
                                document.head.appendChild(script);
                            }
                        } catch (error) {
                            console.error('Error showing ball selection from Homerun ability:', error);
                        }
                    }, 500);
                };
            }
            
            // Return the original effect for other abilities
            return originalEffect;
        };
        
        console.log('Schoolboy Shoma Homerun ability module initialized');
    } catch (error) {
        console.error('Failed to initialize Schoolboy Shoma Homerun ability:', error);
    }
}); 