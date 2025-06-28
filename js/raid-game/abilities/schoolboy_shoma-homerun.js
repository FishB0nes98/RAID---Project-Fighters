// Schoolboy Shoma's Homerun Ability Implementation

/**
 * Implements the Homerun ability for Schoolboy Shoma
 * This ability:
 * 1. Gives 100% dodge chance for 3 turns
 * 2. Resets all ability cooldowns to 0
 * 3. Allows selecting a new ball type
 * 4. Devastating Power talent affects all damage dealt during buff duration
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
                    
                    // Check for Devastating Power talent
                    const hasDevastatingPower = caster.hasTalent && caster.hasTalent('devastating_power');
                    if (hasDevastatingPower) {
                        console.log(`[Devastating Power] Homerun buff applied - all damage during buff duration will be doubled!`);
                        
                        // Add battle log entry about devastating power
                        if (window.gameManager && window.gameManager.addLogEntry) {
                            window.gameManager.addLogEntry(
                                `${caster.name}'s Devastating Power talent is active! All damage during Homerun buff will be doubled!`,
                                'system-update'
                            );
                        }
                        
                        // Add console output for debugging
                        console.log(`[Devastating Power + Homerun] ${caster.name} has both Devastating Power and Homerun active!`);
                        console.log(`[Devastating Power + Homerun] All damage dealt during Homerun buff duration will be doubled!`);
                    }
                    
                    // Debug: Check dodge chance before buff
                    console.log(`[Homerun Debug] ${caster.name} dodge chance BEFORE buff: ${caster.stats.dodgeChance}`);
                    console.log(`[Homerun Debug] ${caster.name} base dodge chance: ${caster.baseStats.dodgeChance}`);
                    console.log(`[Homerun Debug] ${caster.name} current buffs:`, caster.buffs.map(b => ({ 
                        id: b.id, 
                        name: b.name, 
                        effects: b.effects, 
                        statModifiers: b.statModifiers 
                    })));
                    
                    // 1. Create a custom Homerun buff that forces 100% dodge chance
                    const homerunBuff = new Effect(
                        'homerun_buff',
                        'Homerun',
                        'Icons/abilities/homerun.jfif',
                        3,
                        null,
                        false
                    );
                    
                    // Set custom onApply to force dodge chance to 1.0
                    homerunBuff.onApply = function(character) {
                        console.log(`[Homerun onApply] ${character.name} dodge chance BEFORE forcing to 1.0: ${character.stats.dodgeChance}`);
                        character.stats.dodgeChance = 1.0;
                        console.log(`[Homerun onApply] ${character.name} dodge chance AFTER forcing to 1.0: ${character.stats.dodgeChance}`);
                        
                        // Update UI immediately
                        if (typeof updateCharacterUI === 'function') {
                            updateCharacterUI(character);
                        }
                        return true;
                    };
                    
                    // Set custom onRemove to restore dodge chance
                    homerunBuff.onRemove = function(character) {
                        try {
                            console.log(`[Homerun onRemove] ${character.name} dodge chance BEFORE restoration: ${character.stats.dodgeChance}`);
                            console.log(`[Homerun onRemove] ${character.name} base dodge chance: ${character.baseStats.dodgeChance}`);
                            
                            // Restore dodge chance to base value and recalculate stats to apply any other active effects
                            if (character && character.baseStats) {
                                character.stats.dodgeChance = character.baseStats.dodgeChance;
                            }
                            character.recalculateStats('homerun-buff-removed');
                            
                            console.log(`[Homerun onRemove] ${character.name} dodge chance AFTER restoration: ${character.stats.dodgeChance}`);
                        } catch (e) {
                            console.error('[Homerun] Error restoring dodge chance on buff removal:', e);
                        }
                    };
                    
                    // Add the custom buff directly (bypassing the normal buff system)
                    caster.buffs.push(homerunBuff);
                    
                    // Call onApply manually to force dodge chance
                    homerunBuff.onApply(caster);
                    
                    // Debug: Check dodge chance after buff and verify buff was applied
                    console.log(`[Homerun Debug] ${caster.name} dodge chance AFTER custom buff: ${caster.stats.dodgeChance}`);
                    console.log(`[Homerun Debug] ${caster.name} current buffs:`, caster.buffs.map(b => ({ 
                        id: b.id, 
                        name: b.name, 
                        effects: b.effects, 
                        statModifiers: b.statModifiers 
                    })));
                    
                    // Play Homerun sound
                    const playSoundHomerun = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundHomerun('sounds/shomaa4.mp3');
                    
                    // Show Homerun VFX
                    showHomerunVFX(caster);
                    
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
                                showBallSelectionForShoma(caster, (selectedBall) => {
                                    console.log(`[Shoma Homerun] New ball selected: ${selectedBall}`);
                                    
                                    // Log the ball change
                                    if (window.gameManager && window.gameManager.addLogEntry && selectedBall) {
                                        window.gameManager.addLogEntry(
                                            `${caster.name} switched to ${selectedBall.replace('_', ' ')} for enhanced tactics!`,
                                            'system'
                                        );
                                    } else if (window.gameManager && window.gameManager.addLogEntry) {
                                        window.gameManager.addLogEntry(
                                            `${caster.name} selected a new ball type for enhanced tactics!`,
                                            'system'
                                        );
                                    }
                                    
                                    // Update ball ability descriptions based on talents
                                    if (window.updateShomaAbilityDescriptions) {
                                        window.updateShomaAbilityDescriptions(caster);
                                    }
                                    
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
                                        showBallSelectionForShoma(caster, (selectedBall) => {
                                            console.log(`[Shoma Homerun] New ball selected: ${selectedBall}`);
                                            
                                            // Log the ball change
                                            if (window.gameManager && window.gameManager.addLogEntry && selectedBall) {
                                                window.gameManager.addLogEntry(
                                                    `${caster.name} switched to ${selectedBall.replace('_', ' ')} for enhanced tactics!`,
                                                    'system'
                                                );
                                            } else if (window.gameManager && window.gameManager.addLogEntry) {
                                                window.gameManager.addLogEntry(
                                                    `${caster.name} selected a new ball type for enhanced tactics!`,
                                                    'system'
                                                );
                                            }
                                            
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
                            console.error('Error showing ball selection after Homerun:', error);
                        }
                    }, 500); // Increased timeout to ensure ability completes
                };
            }
            
            // For other abilities, return original effect
            return originalEffect;
        };
        
        console.log('Homerun ability successfully registered with AbilityFactory');
        
    } catch (error) {
        console.error('Error initializing Homerun ability:', error);
    }
});

// Schoolboy Shoma Homerun Ability Enhancement
// This file handles the special mechanics of the Homerun ability including talent enhancements

(function() {
    'use strict';
    
    console.log('Schoolboy Shoma Homerun ability enhancement loaded');
    
    /**
     * Enhanced Homerun ability with talent support
     * This function extends the base homerun ability to include talent enhancements
     */
    window.enhancedHomerunAbility = function(caster, target) {
        console.log(`[Shoma Homerun] Enhanced homerun triggered for ${caster.name}`);
        
        // Base homerun effects
        const baseBuffData = {
            buffId: 'homerun_buff',
            name: 'Homerun',
            duration: 3,
            effects: {
                dodgeChance: 1.0,
                resetCooldowns: true,
                selectNewBall: true
            }
        };
        
        // Check for homerun mastery talent
        if (caster.hasTalent && caster.hasTalent('homerun_mastery')) {
            console.log(`[Shoma Homerun] Homerun Mastery talent active for ${caster.name}`);
            
            // Add combat enhancements from talent
            baseBuffData.effects.critChance = (caster.stats.critChance || 0) + 0.5; // +50% crit
            baseBuffData.effects.damageBonus = 0.25; // +25% damage
            baseBuffData.name = 'Homerun Mastery';
            baseBuffData.description = 'Perfect dodge chance, +50% critical strike chance, +25% damage, and ability to select new ball type.';
            
            // Add special VFX for mastery
            showHomerunMasteryVFX(caster);
            
            // Log the enhancement
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(
                    `${caster.name}'s Homerun Mastery grants enhanced combat prowess! (+50% crit, +25% damage)`,
                    'system-update'
                );
            }
        } else {
            baseBuffData.description = 'Perfect dodge chance, resets all cooldowns, and allows selection of new ball type.';
        }
        
        // Apply the homerun buff
        const homerunBuff = new Effect(
            baseBuffData.buffId,
            baseBuffData.name,
            'Icons/abilities/homerun.jfif',
            baseBuffData.duration,
            null,
            false
        );
        
        // Set custom onApply to force dodge chance to 1.0
        homerunBuff.onApply = function(character) {
            console.log(`[Enhanced Homerun onApply] ${character.name} dodge chance BEFORE forcing to 1.0: ${character.stats.dodgeChance}`);
            character.stats.dodgeChance = 1.0;
            console.log(`[Enhanced Homerun onApply] ${character.name} dodge chance AFTER forcing to 1.0: ${character.stats.dodgeChance}`);
            
            // Apply other effects if Homerun Mastery is active
            if (character.hasTalent && character.hasTalent('homerun_mastery')) {
                console.log(`[Enhanced Homerun] Applying mastery effects to ${character.name}`);
                // The crit and damage bonuses will be handled by the talent system
            }
            
            // Update UI immediately
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }
            return true;
        };
        
        // Set custom onRemove to restore dodge chance
        homerunBuff.onRemove = function(character) {
            try {
                console.log(`[Enhanced Homerun onRemove] ${character.name} dodge chance BEFORE restoration: ${character.stats.dodgeChance}`);
                console.log(`[Enhanced Homerun onRemove] ${character.name} base dodge chance: ${character.baseStats.dodgeChance}`);
                
                // Restore dodge chance to base value and recalculate stats to apply any other active effects
                if (character && character.baseStats) {
                    character.stats.dodgeChance = character.baseStats.dodgeChance;
                }
                character.recalculateStats('enhanced-homerun-buff-removed');
                
                console.log(`[Enhanced Homerun onRemove] ${character.name} dodge chance AFTER restoration: ${character.stats.dodgeChance}`);
            } catch (e) {
                console.error('[Enhanced Homerun] Error restoring dodge chance on buff removal:', e);
            }
        };
        
        // Set the buff description
        homerunBuff.description = baseBuffData.description;
        
        // Add the custom buff directly (bypassing the normal buff system)
        caster.buffs.push(homerunBuff);
        
        // Call onApply manually to force dodge chance
        homerunBuff.onApply(caster);
        
        // Reset cooldowns immediately
        caster.resetAbilityCooldowns();
        
        // Show ball selection modal if the character is Schoolboy Shoma
        if (caster.id === 'schoolboy_shoma' && typeof showBallSelectionForShoma === 'function') {
            setTimeout(() => {
                showBallSelectionForShoma(caster, (selectedBall) => {
                    console.log(`[Shoma Homerun] New ball selected: ${selectedBall}`);
                    
                    // Log the ball change
                    if (window.gameManager && window.gameManager.addLogEntry && selectedBall) {
                        window.gameManager.addLogEntry(
                            `${caster.name} switched to ${selectedBall.replace('_', ' ')} for enhanced tactics!`,
                            'system'
                        );
                    } else if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(
                            `${caster.name} selected a new ball type for enhanced tactics!`,
                            'system'
                        );
                    }
                });
            }, 500);
        }
        
        // Show standard homerun VFX
        showHomerunVFX(caster);
        
        // Track ability usage
        if (window.statisticsManager) {
            try {
                window.statisticsManager.recordAbilityUsage(caster, 'homerun', 'utility', 0, false);
                console.log(`[Shoma Stats] Recorded homerun usage for ${caster.name}`);
            } catch (error) {
                console.error(`[Shoma Stats] Error recording homerun usage:`, error);
            }
        }
        
        return true;
    };
    
    /**
     * Standard Homerun VFX
     */
    function showHomerunVFX(caster) {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        if (!casterElement) return;
        
        // Create homerun energy burst
        const energyBurst = document.createElement('div');
        energyBurst.className = 'homerun-energy-burst';
        casterElement.appendChild(energyBurst);
        
        // Create speed lines
        const speedLines = document.createElement('div');
        speedLines.className = 'homerun-speed-lines';
        casterElement.appendChild(speedLines);
        
        // Create dodge enhancement glow
        const dodgeGlow = document.createElement('div');
        dodgeGlow.className = 'homerun-dodge-glow';
        casterElement.appendChild(dodgeGlow);
        
        // Clean up after animation
        setTimeout(() => {
            if (energyBurst.parentNode) energyBurst.remove();
            if (speedLines.parentNode) speedLines.remove();
            if (dodgeGlow.parentNode) dodgeGlow.remove();
        }, 2000);
    }
    
    /**
     * Enhanced Homerun Mastery VFX
     */
    function showHomerunMasteryVFX(caster) {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        if (!casterElement) return;
        
        // Create mastery aura
        const masteryAura = document.createElement('div');
        masteryAura.className = 'homerun-mastery-aura';
        casterElement.appendChild(masteryAura);
        
        // Create power surge effect
        const powerSurge = document.createElement('div');
        powerSurge.className = 'homerun-power-surge';
        casterElement.appendChild(powerSurge);
        
        // Create floating mastery text
        const masteryText = document.createElement('div');
        masteryText.className = 'homerun-mastery-text';
        masteryText.textContent = 'MASTERY!';
        casterElement.appendChild(masteryText);
        
        // Clean up after animation
        setTimeout(() => {
            if (masteryAura.parentNode) masteryAura.remove();
            if (powerSurge.parentNode) powerSurge.remove();
            if (masteryText.parentNode) masteryText.remove();
        }, 2500);
    }
    
    /**
     * Hook into the ability factory to enhance homerun when created
     */
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof AbilityFactory !== 'undefined') {
            const originalCreateBuffEffect = AbilityFactory.createBuffEffect;
            
            AbilityFactory.createBuffEffect = function(abilityData) {
                // Check if this is the homerun ability
                if (abilityData.id === 'homerun') {
                    return function(caster, target) {
                        console.log(`[Shoma Homerun] Intercepted homerun ability for enhancement`);
                        return window.enhancedHomerunAbility(caster, target || caster);
                    };
                }
                
                // For other abilities, use the original method
                return originalCreateBuffEffect.call(this, abilityData);
            };
            
            console.log('Homerun ability enhancement hook installed');
        }
    });
    
})(); 