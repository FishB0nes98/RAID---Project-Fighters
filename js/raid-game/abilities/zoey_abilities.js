/**
 * Zoey's abilities file
 * Implements all abilities for the character Zoey
 */

/**
 * Zoey Statistics Enhancement
 * Enhanced statistics tracking for all of Zoey's abilities to match comprehensive tracking systems
 */

/**
 * Global helper function to track Zoey's ability usage for statistics
 */
function trackZoeyAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[ZoeyStats] StatisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[ZoeyStats] Tracked ${abilityId} usage: ${effectType}, amount: ${amount}, crit: ${isCritical}`);
    } catch (error) {
        console.error(`[ZoeyStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Track Strawberry Bell Burst statistics
 */
function trackStrawberryBellStats(caster, target, damageResult, isBellMastery = false, isRecast = false) {
    if (!window.statisticsManager) return;
    
    try {
        const abilityId = isBellMastery ? 'zoey_q_bell_mastery' : 'zoey_q';
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        
        // Track damage dealt
        if (damageAmount > 0) {
            window.statisticsManager.recordDamageDealt(caster, damageAmount, 'magical', false);
        }
        
        // Track ability usage with special flags
        const usageData = {
            effectType: 'damage',
            amount: damageAmount,
            isCritical: false, // Bell can't crit
            isBellMastery: isBellMastery,
            isRecast: isRecast
        };
        
        window.statisticsManager.recordAbilityUsage(caster, abilityId, usageData.effectType, usageData.amount, usageData.isCritical);
        
        console.log(`[ZoeyStats] Tracked Bell Burst: ${damageAmount} damage, mastery: ${isBellMastery}, recast: ${isRecast}`);
    } catch (error) {
        console.error('[ZoeyStats] Error tracking Bell Burst stats:', error);
    }
}

/**
 * Track Heart Pounce statistics
 */
function trackHeartPounceStats(caster, target, damageResult, isSuccessful, isEnhanced = false, comboActivated = false) {
    if (!window.statisticsManager) return;
    
    try {
        const abilityId = isEnhanced ? 'zoey_w_enhanced' : 'zoey_w';
        
        if (isSuccessful) {
            const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
            
            // Track damage dealt
            if (damageAmount > 0) {
                window.statisticsManager.recordDamageDealt(caster, damageAmount, 'magical', false);
            }
            
            // Track successful ability usage
            window.statisticsManager.recordAbilityUsage(caster, abilityId, 'damage', damageAmount, false);
            
            // Track combo activation if it occurred
            if (comboActivated) {
                window.statisticsManager.recordAbilityUsage(caster, 'zoey_w_feline_combo', 'utility', 0, false);
            }
        } else {
            // Track failed attempt
            window.statisticsManager.recordAbilityUsage(caster, abilityId + '_failed', 'debuff_self', 0, false);
        }
        
        console.log(`[ZoeyStats] Tracked Heart Pounce: success: ${isSuccessful}, enhanced: ${isEnhanced}, combo: ${comboActivated}`);
    } catch (error) {
        console.error('[ZoeyStats] Error tracking Heart Pounce stats:', error);
    }
}

/**
 * Track Sparkle Burst statistics
 */
function trackSparkleburstStats(caster, target, damageResult, isHit, isImproved = false, sparklePounceTriggered = false) {
    if (!window.statisticsManager) return;
    
    try {
        const abilityId = isImproved ? 'zoey_e_improved' : 'zoey_e';
        
        if (isHit) {
            const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
            
            // Track damage dealt
            if (damageAmount > 0) {
                window.statisticsManager.recordDamageDealt(caster, damageAmount, 'magical', false);
            }
            
            // Track hit
            window.statisticsManager.recordAbilityUsage(caster, abilityId, 'damage', damageAmount, false);
            
            // Track Sparkle Pounce talent activation
            if (sparklePounceTriggered) {
                window.statisticsManager.recordAbilityUsage(caster, 'zoey_e_sparkle_pounce', 'utility', 0, false);
            }
        } else {
            // Track miss
            window.statisticsManager.recordAbilityUsage(caster, abilityId + '_miss', 'miss', 0, false);
        }
        
        console.log(`[ZoeyStats] Tracked Sparkle Burst: hit: ${isHit}, improved: ${isImproved}, pounce: ${sparklePounceTriggered}`);
    } catch (error) {
        console.error('[ZoeyStats] Error tracking Sparkle Burst stats:', error);
    }
}

/**
 * Track Glowing Light Arc statistics
 */
function trackGlowingLightArcStats(caster, target, damageResult, isHit, abilityDisabled = false, isEnhanced = false) {
    if (!window.statisticsManager) return;
    
    try {
        const abilityId = isEnhanced ? 'zoey_r_enhanced' : 'zoey_r';
        
        if (isHit) {
            const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
            
            // Track damage dealt
            if (damageAmount > 0) {
                window.statisticsManager.recordDamageDealt(caster, damageAmount, 'magical', false);
            }
            
            // Track successful hit
            window.statisticsManager.recordAbilityUsage(caster, abilityId, 'damage', damageAmount, false);
            
            // Track ability disable effect
            if (abilityDisabled) {
                window.statisticsManager.recordAbilityUsage(caster, abilityId + '_disable', 'debuff', 0, false);
            }
        } else {
            // Track miss
            window.statisticsManager.recordAbilityUsage(caster, abilityId + '_miss', 'miss', 0, false);
        }
        
        console.log(`[ZoeyStats] Tracked Light Arc: hit: ${isHit}, disabled: ${abilityDisabled}, enhanced: ${isEnhanced}`);
    } catch (error) {
        console.error('[ZoeyStats] Error tracking Light Arc stats:', error);
    }
}

/**
 * Track Combat Reflexes passive statistics
 */
function trackCombatReflexesStats(character, dodgeAmount, damageBonus) {
    if (!window.statisticsManager) return;
    
    try {
        // Track dodge that triggered the passive
        window.statisticsManager.recordAbilityUsage(character, 'zoey_passive_dodge', 'utility', dodgeAmount, false);
        
        // Track damage bonus gained
        window.statisticsManager.recordAbilityUsage(character, 'zoey_passive_damage_bonus', 'buff', damageBonus, false);
        
        console.log(`[ZoeyStats] Tracked Combat Reflexes: dodge triggers, +${damageBonus} damage bonus`);
    } catch (error) {
        console.error('[ZoeyStats] Error tracking Combat Reflexes stats:', error);
    }
}

// Description update functions (defined early for talent manager access)
function updateHeartPounceDescription(ability, character = null) {
    console.log('[Zoey] updateHeartPounceDescription called', ability?.id, character?.name || 'no character');
    
    // Get the character that owns this ability if not provided
    if (!character) {
        character = window.gameManager?.gameState?.playerCharacters?.find(c => 
            c.abilities?.some(a => a.id === ability.id)
        );
    }
    
    console.log('[Zoey] Character found:', character?.name, 'Has improved talent:', character?.enableImprovedHeartPounce, 'Has combo talent:', character?.enableFelineCombo, 'Has enhanced talent:', character?.enableEnhancedHeartPounce);
    
    // Build description based on talents
    let description = 'Zoey jumps onto an enemy. It has ';
    
    // Hit chance based on Improved Heart Pounce talent
    if (character && character.enableImprovedHeartPounce) {
        description += '60% chance to be successful (improved from 50% by talent)';
    } else {
        description += '50% chance to be successful';
    }
    
    // Damage scaling based on Enhanced Heart Pounce talent
    if (character && character.enableEnhancedHeartPounce) {
        description += '. If successful, she deals 855 + (125% Magical damage + 50% Physical damage + 50% Magical damage) to the target';
    } else {
        description += '. If successful, she deals 855 + (125% Magical damage) to the target';
    }
    
    // Add Feline Combo description if character has it
    if (character && character.enableFelineCombo) {
        description += '. When successful, has 35% chance to reset its cooldown and allow another action without ending the turn';
    }
    
    description += '. If it fails, Zoey receives a debuff that reduces her armor and magic shield to 0 for ';
    
    // Duration based on Improved Heart Pounce talent
    if (character && character.enableImprovedHeartPounce) {
        description += '2 turns (reduced from 5 by talent)';
    } else {
        description += '5 turns';
    }
    
    description += '.';
    
    console.log('[Zoey] Returning description for Heart Pounce:', description);
    return description;
}

function updateSparkleburstDescription(ability, character = null) {
    console.log('[Zoey] updateSparkleburstDescription called', ability?.id, character?.name || 'no character');
    
    // Get the character that owns this ability if not provided
    if (!character) {
        character = window.gameManager?.gameState?.playerCharacters?.find(c => 
            c.abilities?.some(a => a.id === ability.id)
        );
    }
    
    console.log('[Zoey] Character found:', character?.name, 'Has improved talent:', character?.enableImprovedSparkleburst, 'Has sparkle pounce talent:', character?.enableSparklePounce);
    
    // Build description based on talents
    let description = 'Zoey unleashes a burst of sparkles with ';
    
    // Hit chance based on Improved Sparkle Burst talent
    if (character && character.enableImprovedSparkleburst) {
        description += '80% hit chance for each enemy (improved from 50% by talent)';
    } else {
        description += '50% hit chance for each enemy';
    }
    
    description += '. Deals 200% Magical Damage to all enemies hit. This ability\'s cooldown is reduced for each enemy hit';
    
    // Add Sparkle Pounce description if character has it
    if (character && character.enableSparklePounce) {
        description += '. When it successfully hits an enemy, has a 10% chance to automatically cast Heart Pounce on that target';
    }
    
    description += '.';
    
    console.log('[Zoey] Returning description for Sparkle Burst:', description);
    return description;
}

// Expose the functions globally for talent manager access
window.updateHeartPounceDescription = updateHeartPounceDescription;
window.updateSparkleburstDescription = updateSparkleburstDescription;
window.updateStrawberryBellDescription = updateStrawberryBellDescription;

// Immediately define the ability function globally so it's available
window.zoeyStrawberryBellBurstEffect = function(casterOrData, target, abilityInstance, actualManaCost, options = {}) {
    // Handle both initialization and execution modes
    if (typeof casterOrData === 'object' && casterOrData.constructor.name === 'Character') {
        // Execution mode - casting the ability
        const caster = casterOrData;
        executeStrawberryBellBurst(caster, target, abilityInstance);
        return true; // Return true to indicate successful ability execution
    } else {
        // Initialization mode - setting up description
        const ability = abilityInstance;
        return {
            canCrit: false,
            execute: (caster, target) => {
                executeStrawberryBellBurst(caster, target, ability);
            },
            generateDescription: () => {
                return updateStrawberryBellDescription(ability);
            }
        };
    }
};

// Heart Pounce (W) ability implementation
window.zoeyHeartPounceEffect = function(casterOrData, target, abilityInstance, actualManaCost, options = {}) {
    // Handle both initialization and execution modes
    if (typeof casterOrData === 'object' && casterOrData.constructor.name === 'Character') {
        // Execution mode - casting the ability
        const caster = casterOrData;
        executeHeartPounce(caster, target, abilityInstance);
        return true; // Return true to indicate successful ability execution
    } else {
        // Initialization mode - setting up description
        const ability = abilityInstance;
        return {
            execute: (caster, target) => {
                executeHeartPounce(caster, target, ability);
            },
            generateDescription: () => {
                return updateHeartPounceDescription(ability);
            }
        };
    }
};

// Sparkle Burst (E) ability implementation
window.zoeySparkleburstEffect = function(casterOrData, targets, abilityInstance, actualManaCost, options = {}) {
    // Handle both initialization and execution modes
    if (typeof casterOrData === 'object' && casterOrData.constructor.name === 'Character') {
        // Execution mode - casting the ability
        const caster = casterOrData;
        
        // For AoE ability, get all enemies instead of just the targeted one
        if (!Array.isArray(targets) || targets.length === 0) {
            if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                targets = window.gameManager.getOpponents(caster);
                console.log('[Zoey Abilities] Using all enemies for Sparkle Burst:', targets.length);
            }
        }
        
        return executeSparkleburst(caster, targets, abilityInstance);
    } else {
        // Initialization mode - setting up description
        const ability = abilityInstance;
        return {
            execute: (caster, targets) => {
                // For AoE ability, get all enemies instead of just the targeted one
                if (!Array.isArray(targets) || targets.length === 0) {
                    if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                        targets = window.gameManager.getOpponents(caster);
                        console.log('[Zoey Abilities] Using all enemies for Sparkle Burst:', targets.length);
                    }
                }
                
                return executeSparkleburst(caster, targets, ability);
            },
            generateDescription: () => {
                return updateSparkleburstDescription(ability);
            }
        };
    }
};

// Glowing Light Arc (R) ability implementation
window.zoeyGlowingLightArcEffect = function(casterOrData, targets, abilityInstance, actualManaCost, options = {}) {
    // Handle both initialization and execution modes
    if (typeof casterOrData === 'object' && casterOrData.constructor.name === 'Character') {
        // Execution mode - casting the ability
        const caster = casterOrData;
        
        // For AoE ability, get all enemies instead of just the targeted one
        if (!Array.isArray(targets) || targets.length === 0) {
            if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                targets = window.gameManager.getOpponents(caster);
                console.log('[Zoey Abilities] Using all enemies for Glowing Light Arc:', targets.length);
            }
        }
        
        return executeGlowingLightArc(caster, targets, abilityInstance);
    } else {
        // Initialization mode - setting up description
        const ability = abilityInstance;
        return {
            execute: (caster, targets) => {
                // For AoE ability, get all enemies instead of just the targeted one
                if (!Array.isArray(targets) || targets.length === 0) {
                    if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                        targets = window.gameManager.getOpponents(caster);
                        console.log('[Zoey Abilities] Using all enemies for Glowing Light Arc:', targets.length);
                    }
                }
                
                return executeGlowingLightArc(caster, targets, ability);
            },
            generateDescription: () => {
                return updateGlowingLightArcDescription(ability);
            }
        };
    }
};

// Immediately patch Ability.prototype.use to add debugging and a fallback mechanism
// This executes when the script loads
(function() {
    console.log('[Zoey Debug] Attempting to patch Ability.prototype.use');
    
    if (window.Ability && window.Ability.prototype && window.Ability.prototype.use) {
        const originalUse = window.Ability.prototype.use;
        
        window.Ability.prototype.use = function(caster, targetOrTargets, actualManaCost, options = {}) {
            // Check if the ability is one of Zoey's abilities
            if (this.id === 'zoey_q' || this.id === 'zoey_w' || this.id === 'zoey_e') {
                console.log(`[Zoey Debug] Intercepted use() call for ${this.id} ability`, this);
                
                // If effect is missing or not a function, attempt to fix it
                if (!this.effect || typeof this.effect !== 'function') {
                    console.log(`[Zoey Debug] Effect is not a function for ${this.id}, attempting to fix`, typeof this.effect);
                    
                    // Direct fix: Use the global function
                    if (this.id === 'zoey_q' && window.zoeyStrawberryBellBurstEffect) {
                        console.log('[Zoey Debug] Applying direct effect fix for Q ability using global reference');
                        executeStrawberryBellBurst(caster, targetOrTargets, this);
                        
                        // Update cooldown and add event dispatch
                        this.currentCooldown = this.cooldown;
                        
                        // Dispatch event
                        const abilityUsedEvent = new CustomEvent('ability:used', {
                            detail: {
                                caster: caster,
                                target: targetOrTargets,
                                ability: this
                            }
                        });
                        document.dispatchEvent(abilityUsedEvent);
                        
                        return true; // Indicate success
                    }
                    // Fix for Heart Pounce (W ability)
                    else if (this.id === 'zoey_w' && window.zoeyHeartPounceEffect) {
                        console.log('[Zoey Debug] Applying direct effect fix for W ability using global reference');
                        executeHeartPounce(caster, targetOrTargets, this);
                        
                        // Update cooldown and add event dispatch
                        this.currentCooldown = this.cooldown;
                        
                        // Dispatch event
                        const abilityUsedEvent = new CustomEvent('ability:used', {
                            detail: {
                                caster: caster,
                                target: targetOrTargets,
                                ability: this
                            }
                        });
                        document.dispatchEvent(abilityUsedEvent);
                        
                        return true; // Indicate success
                    }
                    // Fix for Sparkle Burst (E ability)
                    else if (this.id === 'zoey_e' && window.zoeySparkleburstEffect) {
                        console.log('[Zoey Debug] Applying direct effect fix for E ability using global reference');
                        executeSparkleburst(caster, targetOrTargets, this);
                        
                        // Update cooldown and add event dispatch
                        this.currentCooldown = this.cooldown;
                        
                        // Dispatch event
                        const abilityUsedEvent = new CustomEvent('ability:used', {
                            detail: {
                                caster: caster,
                                target: targetOrTargets,
                                ability: this
                            }
                        });
                        document.dispatchEvent(abilityUsedEvent);
                        
                        return true; // Indicate success
                    }
                    // Fix for Glowing Light Arc (R ability)
                    else if (this.id === 'zoey_r' && window.zoeyGlowingLightArcEffect) {
                        console.log('[Zoey Debug] Applying direct effect fix for R ability using global reference');
                        executeGlowingLightArc(caster, targetOrTargets, this);
                        
                        // Update cooldown and add event dispatch
                        this.currentCooldown = this.cooldown;
                        
                        // Dispatch event
                        const abilityUsedEvent = new CustomEvent('ability:used', {
                            detail: {
                                caster: caster,
                                target: targetOrTargets,
                                ability: this
                            }
                        });
                        document.dispatchEvent(abilityUsedEvent);
                        
                        return true; // Indicate success
                    }
                }
            }
            
            // Call the original method if we didn't handle it
            try {
                return originalUse.call(this, caster, targetOrTargets, actualManaCost, options);
            } catch (error) {
                console.error(`[Zoey Debug] Error in original use() method for ${this.id}:`, error);
                
                // If this is Zoey's ability, try to recover
                if (this.id === 'zoey_q') {
                    console.log('[Zoey Debug] Attempting recovery for Zoey Q ability');
                    executeStrawberryBellBurst(caster, targetOrTargets, this);
                    return true;
                }
                else if (this.id === 'zoey_w') {
                    console.log('[Zoey Debug] Attempting recovery for Zoey W ability');
                    executeHeartPounce(caster, targetOrTargets, this);
                    return true;
                }
                else if (this.id === 'zoey_e') {
                    console.log('[Zoey Debug] Attempting recovery for Zoey E ability');
                    executeSparkleburst(caster, targetOrTargets, this);
                    return true;
                }
                else if (this.id === 'zoey_r') {
                    console.log('[Zoey Debug] Attempting recovery for Zoey R ability');
                    executeGlowingLightArc(caster, targetOrTargets, this);
                    return true;
                }
                
                return false;
            }
        };
        
        console.log('[Zoey Debug] Successfully patched Ability.prototype.use');
    } else {
        console.error('[Zoey Debug] Failed to patch Ability.prototype.use - Ability class not found');
    }
})();

// Main execution function for Heart Pounce
function executeHeartPounce(caster, target, abilityInstance) {
    console.log('[Heart Pounce] executeHeartPounce called with:', {
        caster: caster.name,
        target: target.name,
        abilityId: abilityInstance.id
    });
    
    try {
        // Get reference to game manager
        const gameManager = window.gameManager || {
            addLogEntry: (msg, className) => { console.log(msg); }
        };
        
        // Determine hit chance based on talents
        let hitChance = 0.5; // Base 50% chance
        if (caster.enableImprovedHeartPounce) {
            hitChance = 0.6; // Improved to 60% with talent
        }
        
        // Roll for hit success
        const hitRoll = Math.random();
        const isSuccessful = hitRoll < hitChance;
        
        // Add log entry for the attempt
        gameManager.addLogEntry(`${caster.name} pounces at ${target.name}...`, 'zoey player-turn');
        
        // Show the VFX
        showHeartPounceVFX(caster, target, isSuccessful);
        
        // Wait for animation before applying effects
        setTimeout(() => {
            try {
                if (isSuccessful) {
                    // Successful pounce - deal damage
                    let baseDamage = 855;
                    let magicalScaling = 1.25; // Base 125% magical damage
                    let physicalScaling = 0; // Base 0% physical damage
                    
                    // Check for Enhanced Heart Pounce talent
                    if (caster.enableEnhancedHeartPounce) {
                        magicalScaling += 0.5; // +50% magical damage (125% -> 175%)
                        physicalScaling += 0.5; // +50% physical damage (0% -> 50%)
                    }
                    
                    // Calculate total damage
                    const magicalBonus = Math.round(caster.stats.magicalDamage * magicalScaling);
                    const physicalBonus = Math.round(caster.stats.physicalDamage * physicalScaling);
                    const totalDamage = baseDamage + magicalBonus + physicalBonus;
                    
                    // Create damage calculation event for passive integration
                    const attackCalculationEvent = new CustomEvent('attack:calculation', {
                        detail: {
                            caster: caster,
                            target: target,
                            damage: totalDamage,
                            type: 'magical',
                            source: "Heart Pounce"
                        }
                    });
                    
                    // Dispatch the event to allow passive to modify damage
                    document.dispatchEvent(attackCalculationEvent);
                    
                    // Get the potentially modified damage from the event
                    const modifiedDamage = attackCalculationEvent.detail.damage;
                    
                    // Apply damage to the target
                    const damageOptions = {
                        source: "Heart Pounce",
                        abilityId: 'zoey_w'
                    };
                    
                    const damageResult = target.applyDamage(modifiedDamage, 'magical', caster, damageOptions);
                    
                    // Extract the damage amount safely
                    const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                        ? damageResult.damage 
                        : (typeof damageResult === 'number' ? damageResult : modifiedDamage);
                    
                    // Track statistics for successful Heart Pounce
                    if (window.trackHeartPounceStats) {
                        window.trackHeartPounceStats(caster, target, damageResult, true, caster.enableEnhancedHeartPounce, false);
                    }
                    
                    // Add log entry for successful hit
                    if (caster.enableEnhancedHeartPounce) {
                        gameManager.addLogEntry(`${caster.name}'s Enhanced Heart Pounce connects, dealing ${damageAmount} damage to ${target.name}!`, 'zoey player-turn');
                    } else {
                        gameManager.addLogEntry(`${caster.name}'s Heart Pounce connects, dealing ${damageAmount} damage to ${target.name}!`, 'zoey player-turn');
                    }
                    
                    // Create damage taken event to notify passive
                    const damageTakenEvent = new CustomEvent('damage:taken', {
                        detail: {
                            caster: caster,
                            target: target,
                            damage: damageAmount,
                            type: 'magical',
                            source: "Heart Pounce"
                        }
                    });
                    
                    // Dispatch the damage taken event
                    document.dispatchEvent(damageTakenEvent);
                    
                    // Check for Feline Combo talent
                    if (caster.enableFelineCombo) {
                        const comboChance = 0.35; // 35% chance
                        if (Math.random() < comboChance) {
                            // Reset cooldown and allow another action
                            abilityInstance.currentCooldown = 0;
                            
                            // Track Feline Combo activation
                            if (window.trackHeartPounceStats) {
                                window.trackHeartPounceStats(caster, target, damageResult, true, caster.enableEnhancedHeartPounce, true);
                            }
                            
                            // Prevent turn from ending
                            if (window.gameManager && typeof window.gameManager.preventTurnEnd === 'function') {
                                window.gameManager.preventTurnEnd(caster);
                            }
                            
                            gameManager.addLogEntry(`${caster.name}'s Feline Combo activates! Heart Pounce is ready again!`, 'zoey combo');
                        }
                    }
                    
                } else {
                    // Failed pounce - apply vulnerability debuff to Zoey
                    gameManager.addLogEntry(`${caster.name}'s Heart Pounce misses! She becomes vulnerable...`, 'zoey player-turn');
                    
                    // Track failed Heart Pounce
                    if (window.trackHeartPounceStats) {
                        window.trackHeartPounceStats(caster, target, null, false, caster.enableEnhancedHeartPounce, false);
                    }
                    
                    // Determine debuff duration based on talents
                    let debuffDuration = 5; // Base 5 turns
                    if (caster.enableImprovedHeartPounce) {
                        debuffDuration = 2; // Reduced to 2 turns with talent
                    }
                    
                    // Apply vulnerability debuff to caster
                    applyHeartPounceVulnerability(caster, debuffDuration);
                }
                
                // Create explicit ability used event
                const abilityUsedEvent = new CustomEvent('ability:used', {
                    detail: {
                        caster: caster,
                        target: target,
                        ability: abilityInstance,
                        hit: isSuccessful
                    }
                });
                console.log('[Heart Pounce] Dispatching ability:used event with hit:', isSuccessful);
                document.dispatchEvent(abilityUsedEvent);
                
            } catch (innerError) {
                console.error('[Zoey Abilities] Error in delayed Heart Pounce execution:', innerError);
                gameManager.addLogEntry(`Error executing Heart Pounce: ${innerError.message}`, 'system');
            }
        }, 800); // Wait for animation
        
        return true; // Return true to indicate the ability was successfully used
    } catch (error) {
        console.error('[Zoey Abilities] Error executing Heart Pounce:', error);
        if (window.gameManager) {
            window.gameManager.addLogEntry(`Error executing Heart Pounce: ${error.message}`, 'system');
        }
        return false; // Return false to indicate the ability failed
    }
}

// Apply vulnerability debuff when Heart Pounce fails
function applyHeartPounceVulnerability(caster, duration) {
    try {
        // Access Effect class if available
        const Effect = window.Effect;
        
        if (Effect) {
            // Create the vulnerability debuff
            const debuffId = 'heart_pounce_vulnerability';
            const debuffName = 'Heart Pounce Vulnerability';
            const debuffIcon = "Icons/debuffs/vulnerability.png";
            
            // Create the Effect instance
            const vulnerabilityDebuff = new Effect(
                debuffId,
                debuffName,
                debuffIcon,
                duration,
                null, // No per-turn effect
                true  // isDebuff = true
            ).setDescription(`Armor and Magic Shield reduced to 0 for ${duration} turns due to failed Heart Pounce.`);
            
            // Store original values
            const originalArmor = caster.stats.armor;
            const originalMagicalShield = caster.stats.magicalShield;
            
            // Define the apply function to set armor/shield to 0
            vulnerabilityDebuff.apply = function(character) {
                // Store original values in the debuff for restoration
                this.originalArmor = character.stats.armor;
                this.originalMagicalShield = character.stats.magicalShield;
                
                // Set armor and magical shield to 0
                character.stats.armor = 0;
                character.stats.magicalShield = 0;
                
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`${character.name}'s armor and magical defenses are stripped away!`, 'zoey');
                }
                
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            };
            
            // Define the remove function to restore original values
            vulnerabilityDebuff.remove = function(character) {
                // Restore original armor and shield values
                if (this.originalArmor !== undefined) {
                    character.stats.armor = this.originalArmor;
                }
                if (this.originalMagicalShield !== undefined) {
                    character.stats.magicalShield = this.originalMagicalShield;
                }
                
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`${character.name}'s defenses are restored!`, 'zoey');
                }
                
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            };
            
            // Apply the debuff
            caster.addDebuff(vulnerabilityDebuff);
        } else {
            // Fallback approach if Effect class not available
            console.warn('[Heart Pounce] Effect class not available, using fallback debuff application');
            
            // Store original values on the character
            caster.heartPounceOriginalArmor = caster.stats.armor;
            caster.heartPounceOriginalMagicalShield = caster.stats.magicalShield;
            
            // Set to 0
            caster.stats.armor = 0;
            caster.stats.magicalShield = 0;
            
            // Set a timer to restore after duration
            setTimeout(() => {
                if (caster.heartPounceOriginalArmor !== undefined) {
                    caster.stats.armor = caster.heartPounceOriginalArmor;
                    delete caster.heartPounceOriginalArmor;
                }
                if (caster.heartPounceOriginalMagicalShield !== undefined) {
                    caster.stats.magicalShield = caster.heartPounceOriginalMagicalShield;
                    delete caster.heartPounceOriginalMagicalShield;
                }
                
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`${caster.name}'s defenses are restored!`, 'zoey');
                    
                    // Update UI
                    if (window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(caster);
                    }
                }
            }, duration * 1000); // Convert turns to milliseconds (assuming 1 turn = 1 second)
        }
        
    } catch (error) {
        console.error('[Heart Pounce] Error applying vulnerability debuff:', error);
    }
}

// Show visual effects for Heart Pounce
function showHeartPounceVFX(caster, target, isSuccessful) {
    try {
        // Create container for the VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'heart-pounce-vfx';
        document.body.appendChild(vfxContainer);
        
        // Find character elements
        let casterElement = document.getElementById(`character-${caster.id}`);
        let targetElement = document.getElementById(`character-${target.id}`);
        
        // Fallback element finding
        if (!casterElement && caster.instanceId) {
            casterElement = document.getElementById(`character-${caster.instanceId}`);
        }
        if (!targetElement && target.instanceId) {
            targetElement = document.getElementById(`character-${target.instanceId}`);
        }
        
        let casterX, casterY, targetX, targetY;
        
        // Get positions or use fallbacks
        if (!casterElement || !targetElement) {
            console.warn('[Heart Pounce VFX] Could not find character elements, using fallback positions');
            casterX = window.innerWidth * 0.25;
            casterY = window.innerHeight * 0.75;
            targetX = window.innerWidth * 0.75;
            targetY = window.innerHeight * 0.25;
        } else {
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            casterX = casterRect.left + casterRect.width / 2;
            casterY = casterRect.top + casterRect.height / 2;
            targetX = targetRect.left + targetRect.width / 2;
            targetY = targetRect.top + targetRect.height / 2;
        }
        
        // Create pounce trail effect
        const pounceTrail = document.createElement('div');
        pounceTrail.className = isSuccessful ? 'heart-pounce-trail-success' : 'heart-pounce-trail-miss';
        
        // Calculate trail properties
        const deltaX = targetX - casterX;
        const deltaY = targetY - casterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        pounceTrail.style.position = 'absolute';
        pounceTrail.style.left = `${casterX}px`;
        pounceTrail.style.top = `${casterY - 3}px`;
        pounceTrail.style.width = `${distance}px`;
        pounceTrail.style.height = '6px';
        pounceTrail.style.transform = `rotate(${angle}deg)`;
        pounceTrail.style.transformOrigin = '0 50%';
        
        vfxContainer.appendChild(pounceTrail);
        
        // Create heart particles along the trail
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-pounce-particle';
            heart.innerHTML = '💗';
            
            const progress = i / 7;
            const heartX = casterX + (deltaX * progress) + (Math.random() - 0.5) * 20;
            const heartY = casterY + (deltaY * progress) + (Math.random() - 0.5) * 20;
            
            heart.style.position = 'absolute';
            heart.style.left = `${heartX - 10}px`;
            heart.style.top = `${heartY - 10}px`;
            heart.style.animationDelay = `${i * 0.1}s`;
            
            vfxContainer.appendChild(heart);
        }
        
        // Create impact effect at target
        setTimeout(() => {
            if (isSuccessful) {
                // Success impact
                const successImpact = document.createElement('div');
                successImpact.className = 'heart-pounce-success-impact';
                successImpact.innerHTML = '💖✨';
                successImpact.style.position = 'absolute';
                successImpact.style.left = `${targetX - 30}px`;
                successImpact.style.top = `${targetY - 30}px`;
                vfxContainer.appendChild(successImpact);
                
                // Add screen shake for successful hit
                if (document.body) {
                    document.body.classList.add('screen-shake');
                    setTimeout(() => {
                        document.body.classList.remove('screen-shake');
                    }, 300);
                }
            } else {
                // Miss effect
                const missEffect = document.createElement('div');
                missEffect.className = 'heart-pounce-miss-effect';
                missEffect.innerHTML = '💔';
                missEffect.style.position = 'absolute';
                missEffect.style.left = `${targetX - 20}px`;
                missEffect.style.top = `${targetY - 20}px`;
                vfxContainer.appendChild(missEffect);
                
                // Add vulnerability effect to caster
                if (casterElement) {
                    const vulnerabilityEffect = document.createElement('div');
                    vulnerabilityEffect.className = 'heart-pounce-vulnerability-effect';
                    vulnerabilityEffect.innerHTML = '🛡️💥';
                    casterElement.appendChild(vulnerabilityEffect);
                    
                    setTimeout(() => {
                        if (vulnerabilityEffect.parentNode) {
                            vulnerabilityEffect.parentNode.removeChild(vulnerabilityEffect);
                        }
                    }, 2000);
                }
            }
        }, 500);
        
        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2000);
        
    } catch (error) {
        console.error('[Zoey VFX] Error in showHeartPounceVFX:', error);
    }
}

// Main execution function for Sparkle Burst  
function executeSparkleburst(caster, targets, abilityInstance) {
    console.log('[Sparkle Burst] executeSparkleburst called with:', {
        caster: caster.name,
        targets: targets.length,
        abilityId: abilityInstance.id
    });
    
    try {
        // Get reference to game manager
        const gameManager = window.gameManager || {
            addLogEntry: (msg, className) => { console.log(msg); }
        };
        
        // Ensure targets is an array
        if (!Array.isArray(targets)) {
            targets = [targets];
        }
        
        // Determine hit chance based on talents
        let hitChance = 0.5; // Base 50% chance
        if (caster.enableImprovedSparkleburst) {
            hitChance = 0.8; // Improved to 80% with talent
        }
        
        // Add log entry for the cast
        gameManager.addLogEntry(`${caster.name} unleashes a burst of sparkles at all enemies!`, 'zoey player-turn');
        
        // Show the VFX
        showSparkleburstVFX(caster, targets);
        
        // Track hits for cooldown reduction
        let hitCount = 0;
        
        // Wait for animation before applying effects
        setTimeout(() => {
            try {
                // Process each target
                const processNextTarget = (index) => {
                    if (index >= targets.length) {
                        // All targets processed, apply cooldown reduction
                        if (hitCount > 0) {
                            const cooldownReduction = hitCount;
                            abilityInstance.currentCooldown = Math.max(0, abilityInstance.currentCooldown - cooldownReduction);
                            gameManager.addLogEntry(`Sparkle Burst cooldown reduced by ${cooldownReduction} turn(s) for hitting ${hitCount} target(s)!`, 'zoey');
                        }
                        
                        // Create explicit ability used event
                        const abilityUsedEvent = new CustomEvent('ability:used', {
                            detail: {
                                caster: caster,
                                target: targets,
                                ability: abilityInstance,
                                hit: hitCount > 0,
                                hitCount: hitCount
                            }
                        });
                        console.log('[Sparkle Burst] Dispatching ability:used event with hitCount:', hitCount);
                        document.dispatchEvent(abilityUsedEvent);
                        
                        return;
                    }
                    
                    const target = targets[index];
                    
                    // Roll for hit success
                    const hitRoll = Math.random();
                    const isHit = hitRoll < hitChance;
                    
                    if (isHit) {
                        hitCount++;
                        
                        // Calculate damage (200% magical damage)
                        const baseDamage = Math.round(caster.stats.magicalDamage * 2.0);
                        
                        // Create damage calculation event for passive integration
                        const attackCalculationEvent = new CustomEvent('attack:calculation', {
                            detail: {
                                caster: caster,
                                target: target,
                                damage: baseDamage,
                                type: 'magical',
                                source: "Sparkle Burst"
                            }
                        });
                        
                        // Dispatch the event to allow passive to modify damage
                        document.dispatchEvent(attackCalculationEvent);
                        
                        // Get the potentially modified damage from the event
                        const modifiedDamage = attackCalculationEvent.detail.damage;
                        
                        // Apply damage to the target
                        const damageOptions = {
                            source: "Sparkle Burst",
                            abilityId: 'zoey_e'
                        };
                        
                        const damageResult = target.applyDamage(modifiedDamage, 'magical', caster, damageOptions);
                        
                        // Extract the damage amount safely
                        const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                            ? damageResult.damage 
                            : (typeof damageResult === 'number' ? damageResult : modifiedDamage);
                        
                        // Add log entry for hit
                        gameManager.addLogEntry(`${caster.name}'s sparkles hit ${target.name} for ${damageAmount} damage!`, 'zoey player-turn');
                        
                        // Track statistics for successful hit
                        if (window.trackSparkleburstStats) {
                            window.trackSparkleburstStats(caster, target, damageResult, true, caster.enableImprovedSparkleburst, false);
                        }
                        
                        // Show impact VFX
                        showSparkleImpactVFX(target);
                        
                        // Create damage taken event to notify passive
                        const damageTakenEvent = new CustomEvent('damage:taken', {
                            detail: {
                                caster: caster,
                                target: target,
                                damage: damageAmount,
                                type: 'magical',
                                source: "Sparkle Burst"
                            }
                        });
                        
                        // Dispatch the damage taken event
                        document.dispatchEvent(damageTakenEvent);
                        
                        // Check for Sparkle Pounce talent
                        if (caster.enableSparklePounce) {
                            const pounceChance = 0.1; // 10% chance
                            if (Math.random() < pounceChance) {
                                // Track Sparkle Pounce activation
                                if (window.trackSparkleburstStats) {
                                    window.trackSparkleburstStats(caster, target, damageResult, true, caster.enableImprovedSparkleburst, true);
                                }
                                
                                // Automatically cast Heart Pounce
                                setTimeout(() => {
                                    gameManager.addLogEntry(`${caster.name}'s Sparkle Pounce activates! Automatic Heart Pounce on ${target.name}!`, 'zoey combo');
                                    
                                    // Find Heart Pounce ability
                                    const heartPounceAbility = caster.abilities.find(a => a.id === 'zoey_w');
                                    if (heartPounceAbility) {
                                        // Execute Heart Pounce without mana cost or cooldown
                                        executeHeartPounce(caster, target, heartPounceAbility);
                                    }
                                }, 500);
                            }
                        }
                    } else {
                        // Miss
                        gameManager.addLogEntry(`${caster.name}'s sparkles miss ${target.name}!`, 'zoey player-turn');
                        
                        // Track miss statistics
                        if (window.trackSparkleburstStats) {
                            window.trackSparkleburstStats(caster, target, null, false, caster.enableImprovedSparkleburst, false);
                        }
                        
                        // Show miss VFX
                        showSparkleMissVFX(target);
                    }
                    
                    // Process next target after a delay
                    setTimeout(() => {
                        processNextTarget(index + 1);
                    }, 300);
                };
                
                // Start processing targets
                processNextTarget(0);
                
            } catch (innerError) {
                console.error('[Zoey Abilities] Error in delayed Sparkle Burst execution:', innerError);
                gameManager.addLogEntry(`Error executing Sparkle Burst: ${innerError.message}`, 'system');
            }
        }, 800); // Wait for animation
        
        return true; // Return true to indicate the ability was successfully used
    } catch (error) {
        console.error('[Zoey Abilities] Error executing Sparkle Burst:', error);
        if (window.gameManager) {
            window.gameManager.addLogEntry(`Error executing Sparkle Burst: ${error.message}`, 'system');
        }
        return false; // Return false to indicate the ability failed
    }
}

// Show visual effects for Sparkle Burst
function showSparkleburstVFX(caster, targets) {
    try {
        // Create container for the VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'sparkle-burst-vfx';
        document.body.appendChild(vfxContainer);
        
        // Find caster element
        let casterElement = document.getElementById(`character-${caster.id}`);
        if (!casterElement && caster.instanceId) {
            casterElement = document.getElementById(`character-${caster.instanceId}`);
        }
        
        let casterX, casterY;
        
        if (!casterElement) {
            // Fallback position
            casterX = window.innerWidth * 0.25;
            casterY = window.innerHeight * 0.75;
        } else {
            const casterRect = casterElement.getBoundingClientRect();
            casterX = casterRect.left + casterRect.width / 2;
            casterY = casterRect.top + casterRect.height / 2;
        }
        
        // Create burst source effect
        const burstSource = document.createElement('div');
        burstSource.className = 'sparkle-burst-source';
        burstSource.style.position = 'absolute';
        burstSource.style.left = `${casterX - 40}px`;
        burstSource.style.top = `${casterY - 40}px`;
        burstSource.style.width = '80px';
        burstSource.style.height = '80px';
        burstSource.style.borderRadius = '50%';
        burstSource.style.background = 'radial-gradient(circle, #ffeb3b 0%, #ff9800 50%, #e91e63 100%)';
        burstSource.style.boxShadow = '0 0 30px #ffeb3b, 0 0 50px #ff9800';
        burstSource.style.animation = 'sparkleSourcePulse 0.6s ease-out';
        vfxContainer.appendChild(burstSource);
        
        // Create sparkle particles spreading to all targets
        targets.forEach((target, targetIndex) => {
            let targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement && target.instanceId) {
                targetElement = document.getElementById(`character-${target.instanceId}`);
            }
            
            let targetX, targetY;
            
            if (!targetElement) {
                // Fallback positions
                targetX = window.innerWidth * (0.6 + (targetIndex * 0.1));
                targetY = window.innerHeight * (0.3 + ((targetIndex % 2) * 0.4));
            } else {
                const targetRect = targetElement.getBoundingClientRect();
                targetX = targetRect.left + targetRect.width / 2;
                targetY = targetRect.top + targetRect.height / 2;
            }
            
            // Create sparkle trail to each target
            for (let i = 0; i < 12; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle-burst-particle';
                sparkle.innerHTML = '✨';
                
                // Random spread pattern
                const angle = Math.random() * 360;
                const spread = 50 + Math.random() * 100;
                const finalX = targetX + Math.cos(angle * Math.PI / 180) * spread;
                const finalY = targetY + Math.sin(angle * Math.PI / 180) * spread;
                
                sparkle.style.position = 'absolute';
                sparkle.style.left = `${casterX}px`;
                sparkle.style.top = `${casterY}px`;
                sparkle.style.fontSize = '20px';
                sparkle.style.transition = 'all 0.8s ease-out';
                sparkle.style.animationDelay = `${targetIndex * 0.1 + i * 0.05}s`;
                sparkle.style.animation = 'sparkleFloat 1.2s ease-out forwards';
                
                vfxContainer.appendChild(sparkle);
                
                // Animate to target position
                setTimeout(() => {
                    sparkle.style.left = `${finalX}px`;
                    sparkle.style.top = `${finalY}px`;
                    sparkle.style.opacity = '0';
                }, 100 + targetIndex * 50);
            }
        });
        
        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2000);
        
    } catch (error) {
        console.error('[Zoey VFX] Error in showSparkleburstVFX:', error);
    }
}

// Show miss VFX for sparkle burst
function showSparkleMissVFX(target) {
    try {
        const targetElement = document.getElementById(`character-${target.id}`);
        if (!targetElement) return;
        
        const missEffect = document.createElement('div');
        missEffect.className = 'sparkle-miss-effect';
        missEffect.innerHTML = 'MISS';
        missEffect.style.position = 'absolute';
        missEffect.style.top = '-30px';
        missEffect.style.left = '50%';
        missEffect.style.transform = 'translateX(-50%)';
        missEffect.style.color = '#999';
        missEffect.style.fontSize = '16px';
        missEffect.style.fontWeight = 'bold';
        missEffect.style.animation = 'missBounce 1.5s ease-out forwards';
        targetElement.appendChild(missEffect);
        
        setTimeout(() => {
            if (missEffect.parentNode) {
                missEffect.parentNode.removeChild(missEffect);
            }
        }, 1500);
        
    } catch (error) {
        console.error('[Zoey VFX] Error in showSparkleMissVFX:', error);
    }
}

// Main execution function for Strawberry Bell Burst
function executeStrawberryBellBurst(caster, target, abilityInstance) {
    console.log('[Strawberry Bell] executeStrawberryBellBurst called with:', {
        caster: caster.name,
        target: target.name,
        abilityId: abilityInstance.id,
        isRecast: abilityInstance.isRecast
    });
    
    try {
        // Check if Bell Mastery talent is active to determine if we hit all enemies
        const hasBellMastery = caster.enableBellMastery;
        
        // Get reference to game manager
        const gameManager = window.gameManager || {
            addLogEntry: (msg, className) => { console.log(msg); }
        };
        
        // Get all enemies if Bell Mastery is active
        let targets;
        if (hasBellMastery) {
            // Get all living enemies
            targets = gameManager.getOpponents(caster).filter(enemy => !enemy.isDead());
            
            // Add log entry for the multi-target cast
            const castMessage = abilityInstance.isRecast ? 
                `${caster.name} unleashes her MASTERED Strawberry Bell, targeting ALL ENEMIES... (RECAST)` : 
                `${caster.name} unleashes her MASTERED Strawberry Bell, targeting ALL ENEMIES...`;
            gameManager.addLogEntry(castMessage, 'zoey player-turn');
        } else {
            // Single target mode
            targets = [target];
            
            // Add log entry for the single-target cast
            const castMessage = abilityInstance.isRecast ? 
                `${caster.name} channels her Strawberry Bell... (RECAST)` : 
                `${caster.name} channels her Strawberry Bell...`;
            gameManager.addLogEntry(castMessage, 'player-turn');
        }
        
        // Get base damage (200% of magical damage)
        const damageMultiplier = 2.0; // 200%
        const baseDamage = Math.round(caster.stats.magicalDamage * damageMultiplier);
        
        // Show the VFX - modify based on Bell Mastery
        if (hasBellMastery) {
            showStrawberryBellMasteryVFX(caster, targets);
        } else {
            showStrawberryBellVFX(caster, target);
        }
        
        // Wait for animation before applying damage
        setTimeout(() => {
            try {
                if (hasBellMastery) {
                    // Process all targets like Sparkle Burst does
                    const processNextTarget = async (index) => {
                        if (index >= targets.length) {
                            return; // All targets processed
                        }
                        
                        const currentTarget = targets[index];
                        
                        // Safety check
                        if (!currentTarget || typeof currentTarget !== 'object') {
                            console.log('[Bell Mastery] Invalid target at index', index, currentTarget);
                            setTimeout(() => processNextTarget(index + 1), 50);
                            return;
                        }
                        
                        // Apply shake effect to target
                        const targetElement = document.getElementById(`character-${currentTarget.id}`);
                        if (targetElement) {
                            targetElement.classList.add('target-shake');
                            setTimeout(() => {
                                targetElement.classList.remove('target-shake');
                            }, 500);
                        }
                        
                        // Force the ability to not crit regardless of caster's crit chance
                        const damageOptions = {
                            forceCrit: false,
                            preventCrit: true,
                            source: "Strawberry Bell Burst (Bell Mastery)",
                            abilityId: 'zoey_q'
                        };
                        
                        // Create damage calculation event for passive integration
                        const attackCalculationEvent = new CustomEvent('attack:calculation', {
                            detail: {
                                caster: caster,
                                target: currentTarget,
                                damage: baseDamage,
                                type: 'magical',
                                source: "Strawberry Bell Burst (Bell Mastery)"
                            }
                        });
                        
                        // Dispatch the event to allow passive to modify damage
                        document.dispatchEvent(attackCalculationEvent);
                        
                        // Get the potentially modified damage from the event
                        const modifiedDamage = attackCalculationEvent.detail.damage;
                        
                        // Apply damage to the target with the modified damage value
                        const damageResult = currentTarget.applyDamage(modifiedDamage, 'magical', caster, damageOptions);
                        
                        // Extract the damage amount safely
                        const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                            ? damageResult.damage 
                            : (typeof damageResult === 'number' ? damageResult : modifiedDamage);
                        
                        // Get target name safely
                        const targetName = currentTarget.name || `Enemy ${index + 1}`;
                        
                        // Add log entry for the damage with zoey class for styling
                        gameManager.addLogEntry(`${caster.name}'s Bell Mastery devastates ${targetName} for ${damageAmount} magical damage!`, 'zoey player-turn');
                        
                        // Track Bell Mastery statistics
                        if (window.trackStrawberryBellStats) {
                            window.trackStrawberryBellStats(caster, currentTarget, damageResult, true, abilityInstance.isRecast || false);
                        }
                        
                        // Create damage taken event to notify passive
                        const damageTakenEvent = new CustomEvent('damage:taken', {
                            detail: {
                                caster: caster,
                                target: currentTarget,
                                damage: damageAmount,
                                type: 'magical',
                                source: "Strawberry Bell Burst (Bell Mastery)"
                            }
                        });
                        
                        // Dispatch the damage taken event
                        document.dispatchEvent(damageTakenEvent);
                        
                        // Process the next target after a small delay
                        setTimeout(() => processNextTarget(index + 1), 200);
                    };
                    
                    // Start processing targets
                    processNextTarget(0);
                    
                    // Create explicit ability used event to notify passive (for Bell Mastery multi-hit)
                    const abilityUsedEvent = new CustomEvent('ability:used', {
                        detail: {
                            caster: caster,
                            target: targets, // Pass all targets for Bell Mastery
                            ability: abilityInstance,
                            hit: true,
                            isRecast: abilityInstance.isRecast || false,
                            isBellMastery: true
                        }
                    });
                    console.log('[Bell Mastery] Dispatching ability:used event for all targets');
                    document.dispatchEvent(abilityUsedEvent);
                    
                } else {
                    // Single target processing (original behavior)
                    // Apply shake effect to target
                    const targetElement = document.getElementById(`character-${target.id}`);
                    if (targetElement) {
                        targetElement.classList.add('target-shake');
                        setTimeout(() => {
                            targetElement.classList.remove('target-shake');
                        }, 500);
                    }
                    
                    // Force the ability to not crit regardless of caster's crit chance
                    const damageOptions = {
                        forceCrit: false,
                        preventCrit: true,
                        source: "Strawberry Bell Burst",
                        abilityId: 'zoey_q'
                    };
                    
                    // Create damage calculation event for passive integration
                    const attackCalculationEvent = new CustomEvent('attack:calculation', {
                        detail: {
                            caster: caster,
                            target: target,
                            damage: baseDamage,
                            type: 'magical',
                            source: "Strawberry Bell Burst"
                        }
                    });
                    
                    // Dispatch the event to allow passive to modify damage
                    document.dispatchEvent(attackCalculationEvent);
                    
                    // Get the potentially modified damage from the event
                    const modifiedDamage = attackCalculationEvent.detail.damage;
                    
                    // Apply damage to the target with the modified damage value
                    const damageResult = target.applyDamage(modifiedDamage, 'magical', caster, damageOptions);
                    
                    // Extract the damage amount safely
                    const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                        ? damageResult.damage 
                        : (typeof damageResult === 'number' ? damageResult : modifiedDamage);
                    
                    // Add log entry for the damage with zoey class for styling
                    gameManager.addLogEntry(`${caster.name}'s Strawberry Bell Burst hits ${target.name} for ${damageAmount} magical damage!`, 'zoey player-turn');
                    
                    // Track single-target Bell Burst statistics
                    if (window.trackStrawberryBellStats) {
                        window.trackStrawberryBellStats(caster, target, damageResult, false, abilityInstance.isRecast || false);
                    }
                    
                    // Create explicit ability used event to notify passive
                    const abilityUsedEvent = new CustomEvent('ability:used', {
                        detail: {
                            caster: caster,
                            target: target,
                            ability: abilityInstance,
                            hit: true, // Mark this ability as having successfully hit
                            isRecast: abilityInstance.isRecast || false // Pass through recast flag
                        }
                    });
                    console.log('[Strawberry Bell] Dispatching ability:used event with isRecast:', abilityInstance.isRecast || false);
                    document.dispatchEvent(abilityUsedEvent);
                    
                    // Create damage taken event to notify passive
                    const damageTakenEvent = new CustomEvent('damage:taken', {
                        detail: {
                            caster: caster,
                            target: target,
                            damage: damageAmount,
                            type: 'magical',
                            source: "Strawberry Bell Burst"
                        }
                    });
                    
                    // Dispatch the damage taken event
                    document.dispatchEvent(damageTakenEvent);
                }
            } catch (innerError) {
                console.error('[Zoey Abilities] Error in delayed Strawberry Bell Burst execution:', innerError);
                gameManager.addLogEntry(`Error executing Strawberry Bell Burst: ${innerError.message}`, 'system');
            }
        }, 1000); // Wait 1 second for animation
        
        return true; // Return true to indicate the ability was successfully used
    } catch (error) {
        console.error('[Zoey Abilities] Error executing Strawberry Bell Burst:', error);
        if (window.gameManager) {
            window.gameManager.addLogEntry(`Error executing Strawberry Bell Burst: ${error.message}`, 'system');
        }
        return false; // Return false to indicate the ability failed
    }
}

// Show the visual effects for Strawberry Bell Burst
function showStrawberryBellVFX(caster, target) {
    try {
        // Create container for the beam effect
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'strawberry-bell-vfx';
        document.body.appendChild(vfxContainer);
        
        // More robust character element finding
        let casterElement, targetElement;
        
        // Try multiple approaches to find character elements
        // First try by ID
        casterElement = document.getElementById(`character-${caster.id}`);
        targetElement = document.getElementById(`character-${target.id}`);
        
        // If not found, try by instanceId
        if (!casterElement && caster.instanceId) {
            casterElement = document.getElementById(`character-${caster.instanceId}`);
        }
        if (!targetElement && target.instanceId) {
            targetElement = document.getElementById(`character-${target.instanceId}`);
        }
        
        // If still not found, try to find by querying all character slots
        if (!casterElement) {
            const allCharSlots = document.querySelectorAll('.character-slot');
            for (const slot of allCharSlots) {
                if (slot.dataset.instanceId === caster.instanceId || slot.dataset.id === caster.id) {
                    casterElement = slot;
                    break;
                }
            }
        }
        if (!targetElement) {
            const allCharSlots = document.querySelectorAll('.character-slot');
            for (const slot of allCharSlots) {
                if (slot.dataset.instanceId === target.instanceId || slot.dataset.id === target.id) {
                    targetElement = slot;
                    break;
                }
            }
        }
        
        let casterX, casterY, targetX, targetY;
        
        // Final fallback: use fixed positions if elements not found
        if (!casterElement || !targetElement) {
            console.warn('[Zoey VFX] Could not find character elements, using fallback positions');
            
            // Create beam with fallback fixed positions
            casterX = window.innerWidth * 0.25; 
            casterY = window.innerHeight * 0.75;
            targetX = window.innerWidth * 0.75;
            targetY = window.innerHeight * 0.25;
            
            // If we found one element but not the other, at least use the one we found
            if (casterElement) {
                const casterRect = casterElement.getBoundingClientRect();
                casterX = casterRect.left + casterRect.width / 2;
                casterY = casterRect.top + casterRect.height / 2;
            }
            if (targetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                targetX = targetRect.left + targetRect.width / 2;
                targetY = targetRect.top + targetRect.height / 2;
            }
        } else {
            // Get positions if both elements were found
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            // Calculate the center points
            casterX = casterRect.left + casterRect.width / 2;
            casterY = casterRect.top + casterRect.height / 2;
            targetX = targetRect.left + targetRect.width / 2;
            targetY = targetRect.top + targetRect.height / 2;
        }
        
        // Create source bell glow on caster
        const sourceBell = document.createElement('div');
        sourceBell.className = 'strawberry-bell-source';
        sourceBell.style.position = 'absolute';
        sourceBell.style.left = `${casterX - 30}px`;
        sourceBell.style.top = `${casterY - 30}px`;
        vfxContainer.appendChild(sourceBell);
        
        // Create the beam between caster and target
        const beam = document.createElement('div');
        beam.className = 'strawberry-bell-beam';
        
        // Calculate beam properties
        const deltaX = targetX - casterX;
        const deltaY = targetY - casterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Set beam styles
        beam.style.position = 'absolute';
        beam.style.left = `${casterX}px`;
        beam.style.top = `${casterY - 2}px`;
        beam.style.width = `${distance}px`;
        beam.style.transform = `rotate(${angle}deg)`;
        beam.style.transformOrigin = '0 50%';
        
        vfxContainer.appendChild(beam);
        
        // Create particles along the beam
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'strawberry-bell-particle';
            
            // Position along the beam with slight randomness
            const progress = i / 9; // 0 to 1
            const particleX = casterX + (deltaX * progress) + (Math.random() - 0.5) * 20;
            const particleY = casterY + (deltaY * progress) + (Math.random() - 0.5) * 20;
            
            particle.style.position = 'absolute';
            particle.style.left = `${particleX - 5}px`;
            particle.style.top = `${particleY - 5}px`;
            particle.style.animationDelay = `${i * 0.1}s`;
            
            vfxContainer.appendChild(particle);
        }
        
        // Create impact effect at target
        setTimeout(() => {
            const impact = document.createElement('div');
            impact.className = 'strawberry-bell-impact';
            impact.style.position = 'absolute';
            impact.style.left = `${targetX - 40}px`;
            impact.style.top = `${targetY - 40}px`;
            vfxContainer.appendChild(impact);
            
            // Create impact particles
            for (let i = 0; i < 12; i++) {
                const impactParticle = document.createElement('div');
                impactParticle.className = 'strawberry-bell-impact-particle';
                
                const angle = (i / 12) * 360;
                const radius = 20 + Math.random() * 20;
                const particleX = targetX + Math.cos(angle * Math.PI / 180) * radius;
                const particleY = targetY + Math.sin(angle * Math.PI / 180) * radius;
                
                impactParticle.style.position = 'absolute';
                impactParticle.style.left = `${particleX - 3}px`;
                impactParticle.style.top = `${particleY - 3}px`;
                impactParticle.style.animationDelay = `${i * 0.05}s`;
                
                vfxContainer.appendChild(impactParticle);
            }
        }, 700);
        
        // Clean up after animation
        setTimeout(() => {
            vfxContainer.remove();
        }, 1500);
    } catch (error) {
        console.error('[Zoey VFX] Error in showStrawberryBellVFX:', error);
    }
}

// Show enhanced visual effects for Bell Mastery (multi-target Strawberry Bell Burst)
function showStrawberryBellMasteryVFX(caster, targets) {
    try {
        // Create container for the mastery effect
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'strawberry-bell-mastery-vfx';
        document.body.appendChild(vfxContainer);
        
        // Find caster element
        let casterElement = document.getElementById(`character-${caster.id}`);
        if (!casterElement && caster.instanceId) {
            casterElement = document.getElementById(`character-${caster.instanceId}`);
        }
        
        let casterX, casterY;
        
        if (!casterElement) {
            // Fallback position
            casterX = window.innerWidth * 0.25;
            casterY = window.innerHeight * 0.75;
        } else {
            const casterRect = casterElement.getBoundingClientRect();
            casterX = casterRect.left + casterRect.width / 2;
            casterY = casterRect.top + casterRect.height / 2;
        }
        
        // Create massive source bell with mastery effect
        const sourceBell = document.createElement('div');
        sourceBell.className = 'strawberry-bell-mastery-source';
        sourceBell.style.position = 'absolute';
        sourceBell.style.left = `${casterX - 50}px`;
        sourceBell.style.top = `${casterY - 50}px`;
        sourceBell.style.width = '100px';
        sourceBell.style.height = '100px';
        sourceBell.style.borderRadius = '50%';
        sourceBell.style.background = 'radial-gradient(circle, #ff69b4 0%, #ff1493 50%, #dc143c 100%)';
        sourceBell.style.boxShadow = '0 0 40px #ff69b4, 0 0 60px #ff1493, 0 0 80px #dc143c';
        sourceBell.style.animation = 'bellMasteryPulse 0.8s ease-in-out';
        vfxContainer.appendChild(sourceBell);
        
        // Create beams to all targets
        targets.forEach((target, index) => {
            let targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement && target.instanceId) {
                targetElement = document.getElementById(`character-${target.instanceId}`);
            }
            
            let targetX, targetY;
            
            if (!targetElement) {
                // Fallback positions in a spread pattern
                targetX = window.innerWidth * (0.6 + (index * 0.1));
                targetY = window.innerHeight * (0.3 + ((index % 2) * 0.4));
            } else {
                const targetRect = targetElement.getBoundingClientRect();
                targetX = targetRect.left + targetRect.width / 2;
                targetY = targetRect.top + targetRect.height / 2;
            }
            
            // Create beam to this target
            const beam = document.createElement('div');
            beam.className = 'strawberry-bell-mastery-beam';
            
            const deltaX = targetX - casterX;
            const deltaY = targetY - casterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            beam.style.position = 'absolute';
            beam.style.left = `${casterX}px`;
            beam.style.top = `${casterY - 5}px`;
            beam.style.width = `${distance}px`;
            beam.style.height = '10px';
            beam.style.background = 'linear-gradient(90deg, #ff69b4 0%, #ff1493 50%, #dc143c 100%)';
            beam.style.transform = `rotate(${angle}deg)`;
            beam.style.transformOrigin = '0 50%';
            beam.style.boxShadow = '0 0 20px #ff69b4';
            beam.style.animationDelay = `${index * 0.1}s`;
            beam.style.animation = 'beamMasteryPulse 0.6s ease-out forwards';
            
            vfxContainer.appendChild(beam);
            
            // Create particles along each beam
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'strawberry-bell-mastery-particle';
                
                const progress = i / 7;
                const particleX = casterX + (deltaX * progress) + (Math.random() - 0.5) * 30;
                const particleY = casterY + (deltaY * progress) + (Math.random() - 0.5) * 30;
                
                particle.style.position = 'absolute';
                particle.style.left = `${particleX - 8}px`;
                particle.style.top = `${particleY - 8}px`;
                particle.style.width = '16px';
                particle.style.height = '16px';
                particle.style.borderRadius = '50%';
                particle.style.background = '#ff69b4';
                particle.style.boxShadow = '0 0 15px #ff69b4';
                particle.style.animationDelay = `${(index * 0.1) + (i * 0.05)}s`;
                particle.style.animation = 'particleMasteryFloat 0.8s ease-out forwards';
                
                vfxContainer.appendChild(particle);
            }
            
            // Create impact at target
            setTimeout(() => {
                const impact = document.createElement('div');
                impact.className = 'strawberry-bell-mastery-impact';
                impact.style.position = 'absolute';
                impact.style.left = `${targetX - 60}px`;
                impact.style.top = `${targetY - 60}px`;
                impact.style.width = '120px';
                impact.style.height = '120px';
                impact.style.borderRadius = '50%';
                impact.style.background = 'radial-gradient(circle, rgba(255, 105, 180, 0.8) 0%, rgba(255, 20, 147, 0.6) 50%, rgba(220, 20, 60, 0.4) 100%)';
                impact.style.boxShadow = '0 0 50px #ff69b4';
                impact.style.animation = 'impactMasteryBurst 0.8s ease-out forwards';
                vfxContainer.appendChild(impact);
                
                // Create impact particles
                for (let i = 0; i < 16; i++) {
                    const impactParticle = document.createElement('div');
                    impactParticle.className = 'strawberry-bell-mastery-impact-particle';
                    
                    const particleAngle = (i / 16) * 360;
                    const radius = 30 + Math.random() * 40;
                    const impactParticleX = targetX + Math.cos(particleAngle * Math.PI / 180) * radius;
                    const impactParticleY = targetY + Math.sin(particleAngle * Math.PI / 180) * radius;
                    
                    impactParticle.style.position = 'absolute';
                    impactParticle.style.left = `${impactParticleX - 6}px`;
                    impactParticle.style.top = `${impactParticleY - 6}px`;
                    impactParticle.style.width = '12px';
                    impactParticle.style.height = '12px';
                    impactParticle.style.borderRadius = '50%';
                    impactParticle.style.background = '#ff1493';
                    impactParticle.style.boxShadow = '0 0 10px #ff1493';
                    impactParticle.style.animationDelay = `${i * 0.03}s`;
                    impactParticle.style.animation = 'impactParticleMastery 1.2s ease-out forwards';
                    
                    vfxContainer.appendChild(impactParticle);
                }
            }, 400 + (index * 100));
        });
        
        // Clean up after animation
        setTimeout(() => {
            vfxContainer.remove();
        }, 2500);
    } catch (error) {
        console.error('[Zoey VFX] Error in showStrawberryBellMasteryVFX:', error);
    }
}

// Show impact VFX on a specific target
function showSparkleImpactVFX(target) {
    try {
        // Create container for the impact effect
        const impactContainer = document.createElement('div');
        impactContainer.className = 'sparkle-impact-vfx';
        document.body.appendChild(impactContainer);
        
        // Find target element
        let targetElement = document.getElementById(`character-${target.id}`);
        
        if (!targetElement && target.instanceId) {
            targetElement = document.getElementById(`character-${target.instanceId}`);
        }
        
        if (!targetElement) {
            const allCharSlots = document.querySelectorAll('.character-slot');
            for (const slot of allCharSlots) {
                if (slot.dataset.id === target.id || slot.dataset.instanceId === target.instanceId) {
                    targetElement = slot;
                    break;
                }
            }
        }
        
        let targetX, targetY;
        
        // If target element not found, use fallback position
        if (!targetElement) {
            console.warn('[Zoey VFX] Target element not found for impact effect, using fallback position');
            targetX = window.innerWidth * 0.75;
            targetY = window.innerHeight * 0.25;
        } else {
            // Get target position
            const targetRect = targetElement.getBoundingClientRect();
            targetX = targetRect.left + targetRect.width / 2;
            targetY = targetRect.top + targetRect.height / 2;
        }
        
        // Create impact effect
        const impact = document.createElement('div');
        impact.className = 'sparkle-impact';
        impactContainer.appendChild(impact);
        
        // Position the impact
        impact.style.left = `${targetX}px`;
        impact.style.top = `${targetY}px`;
        
        // Create impact particles
        for (let i = 0; i < 8; i++) {
            const impactParticle = document.createElement('div');
            impactParticle.className = 'sparkle-impact-particle';
            impact.appendChild(impactParticle);
            
            // Set random angle for the particle
            const particleAngle = Math.random() * 360;
            impactParticle.style.transform = `rotate(${particleAngle}deg)`;
        }
        
        // Clean up after animation
        setTimeout(() => {
            impactContainer.remove();
        }, 1000);
    } catch (error) {
        console.error('[Zoey VFX] Error in showSparkleImpactVFX:', error);
    }
}

// Update the ability description with any talent modifications
function updateStrawberryBellDescription(ability, character = null) {
    // Get the character that owns this ability if not provided
    if (!character) {
        character = window.gameManager?.gameState?.playerCharacters?.find(c => 
            c.abilities?.some(a => a.id === ability.id)
        );
    }
    
    // Base description - check for Bell Mastery talent
    let description;
    if (character && character.enableBellMastery) {
        description = 'Zoey unleashes her MASTERED Strawberry Bell in a devastating area attack, dealing 200% magical damage to ALL ENEMIES. This ability cannot critically strike.';
    } else {
        description = 'Zoey channels her Strawberry Bell to unleash a magical beam, dealing 200% magical damage to an enemy. This ability cannot critically strike.';
    }
    
    // Add Bell Recast talent description if character has it
    if (character && character.enableBellRecast) {
        description += '\n<span class="talent-effect utility">Talent: 10% chance to immediately recast this ability without consuming mana or cooldown.</span>';
    }
    
    return description;
}



// Update the Glowing Light Arc description with any talent modifications
function updateGlowingLightArcDescription(ability, character = null) {
    // Base description
    let description = 'Zoey unleashes a glowing arc of light that deals 255 + ';
    
    // Check for Enhanced Light Arc talent
    if (character && character.enableEnhancedLightArc) {
        description += '175% Magical Damage';
    } else {
        description += '100% Magical Damage';
    }
    
    description += ' to all enemies with a 75% chance to hit each target. If it hits, it disables a random ability of the target for 2 turns.';
    
    return description;
}

// Register the abilities when the script loads
function registerAbilities() {
    console.log('[Zoey Abilities] Registering abilities...');
    
    // Method 1: Register using the AbilityFactory's registerAbilityEffect
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        // Register Strawberry Bell Burst by function name (how the JSON refers to it)
        window.AbilityFactory.registerAbilityEffect('zoeyStrawberryBellBurstEffect', window.zoeyStrawberryBellBurstEffect);
        
        // Also register by ability ID for redundancy
        window.AbilityFactory.registerAbilityEffect('zoey_q', window.zoeyStrawberryBellBurstEffect);
        
        // Register Heart Pounce
        window.AbilityFactory.registerAbilityEffect('zoeyHeartPounceEffect', window.zoeyHeartPounceEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_w', window.zoeyHeartPounceEffect);
        
        // Register Sparkle Burst
        window.AbilityFactory.registerAbilityEffect('zoeySparkleburstEffect', window.zoeySparkleburstEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_e', window.zoeySparkleburstEffect);
        
        // Register Glowing Light Arc (R)
        window.AbilityFactory.registerAbilityEffect('zoeyGlowingLightArcEffect', window.zoeyGlowingLightArcEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_r', window.zoeyGlowingLightArcEffect);
        
        console.log('[Zoey Abilities] Registered ability effect functions');
    } else {
        console.error('[Zoey Abilities] AbilityFactory or registerAbilityEffect not available');
    }
    
    // Method 2: Create ability objects directly and register them
    if (window.Ability && window.AbilityFactory) {
        try {
            // Strawberry Bell Burst (Q ability)
            const qDescription = 'Zoey channels her Strawberry Bell to unleash a magical beam, dealing 200% magical damage to an enemy. This ability cannot critically strike.';
            
            // Create Q ability manually with baseDescription
            const strawberryBellAbility = new window.Ability(
                'zoey_q',
                'Strawberry Bell Burst',
                'Icons/abilities/strawberry_bell_burst.png',
                90, // manaCost
                4,  // cooldown
                window.zoeyStrawberryBellBurstEffect // Use the global reference
            );
            
            // Set the baseDescription and description
            strawberryBellAbility.baseDescription = qDescription;
            strawberryBellAbility.description = qDescription;
            strawberryBellAbility.targetType = 'enemy';
            
            // Heart Pounce (W ability)
            const wDescription = 'Zoey jumps onto an enemy. It has 50% chance to be successful. If successful, she deals 855 + (125% Magical damage) to the target. If it fails, Zoey receives a debuff that reduces her armor and magic shield to 0 for 5 turns.';
            
            // Create W ability manually
            const heartPounceAbility = new window.Ability(
                'zoey_w',
                'Heart Pounce',
                'Icons/abilities/heart_pounce.png',
                55, // manaCost
                5,  // cooldown
                window.zoeyHeartPounceEffect // Use the global reference
            );
            
            // Set the baseDescription and description
            heartPounceAbility.baseDescription = wDescription;
            heartPounceAbility.description = wDescription;
            heartPounceAbility.updateDescription = updateHeartPounceDescription;
            heartPounceAbility.generateDescription = () => {
                console.log('[Zoey] Generating Heart Pounce description...');
                return updateHeartPounceDescription(heartPounceAbility);
            };
            heartPounceAbility.targetType = 'enemy';
            
            // Sparkle Burst (E ability)
            const eDescription = 'Zoey unleashes a burst of sparkles with 50% hit chance for each enemy. Deals 200% Magical Damage to all enemies hit. This ability\'s cooldown is reduced for each enemy hit.';
            
            // Create E ability manually
            const sparkleburstAbility = new window.Ability(
                'zoey_e',
                'Sparkle Burst',
                'Icons/abilities/sparkle_burst.png',
                100, // manaCost
                11,  // cooldown
                window.zoeySparkleburstEffect // Use the global reference
            );
            
            // Set the baseDescription and description
            sparkleburstAbility.baseDescription = eDescription;
            sparkleburstAbility.description = eDescription;
            sparkleburstAbility.updateDescription = updateSparkleburstDescription;
            sparkleburstAbility.generateDescription = () => {
                console.log('[Zoey] Generating Sparkle Burst description...');
                return updateSparkleburstDescription(sparkleburstAbility);
            };
            sparkleburstAbility.targetType = 'all_enemies';
            
            // Create Glowing Light Arc (R ability)
            const rDescription = 'Zoey unleashes a glowing arc of light that deals 255 + 100% Magical Damage to all enemies with a 75% chance to hit each target. If it hits, it disables a random ability of the target for 2 turns.';
            
            // Create R ability manually
            const glowingLightArcAbility = new window.Ability(
                'zoey_r',
                'Glowing Light Arc',
                'Icons/abilities/glowing_light_arc.png',
                120, // manaCost
                8,   // cooldown
                window.zoeyGlowingLightArcEffect // Use the global reference
            );
            
            // Set the baseDescription and description
            glowingLightArcAbility.baseDescription = rDescription;
            glowingLightArcAbility.description = rDescription;
            glowingLightArcAbility.updateDescription = updateGlowingLightArcDescription;
            glowingLightArcAbility.generateDescription = () => {
                console.log('[Zoey] Generating Glowing Light Arc description...');
                return updateGlowingLightArcDescription(glowingLightArcAbility);
            };
            glowingLightArcAbility.targetType = 'all_enemies';
            
            // Add to registry directly
            if (window.AbilityFactory.abilityRegistry) {
                window.AbilityFactory.abilityRegistry['zoey_q'] = strawberryBellAbility;
                window.AbilityFactory.abilityRegistry['zoey_w'] = heartPounceAbility;
                window.AbilityFactory.abilityRegistry['zoey_e'] = sparkleburstAbility;
                window.AbilityFactory.abilityRegistry['zoey_r'] = glowingLightArcAbility;
                console.log('[Zoey Abilities] Created and registered ability objects');
            }
            
            // Also directly add to registeredEffects
            if (window.AbilityFactory.registeredEffects) {
                window.AbilityFactory.registeredEffects['zoeyStrawberryBellBurstEffect'] = window.zoeyStrawberryBellBurstEffect;
                window.AbilityFactory.registeredEffects['zoey_q'] = window.zoeyStrawberryBellBurstEffect;
                window.AbilityFactory.registeredEffects['zoeyHeartPounceEffect'] = window.zoeyHeartPounceEffect;
                window.AbilityFactory.registeredEffects['zoey_w'] = window.zoeyHeartPounceEffect;
                window.AbilityFactory.registeredEffects['zoeySparkleburstEffect'] = window.zoeySparkleburstEffect;
                window.AbilityFactory.registeredEffects['zoey_e'] = window.zoeySparkleburstEffect;
                window.AbilityFactory.registeredEffects['zoeyGlowingLightArcEffect'] = window.zoeyGlowingLightArcEffect;
                window.AbilityFactory.registeredEffects['zoey_r'] = window.zoeyGlowingLightArcEffect;
            }
        } catch (error) {
            console.error('[Zoey Abilities] Failed to create ability objects:', error);
        }
    }
    
    // Log confirmation
    console.log('[Zoey Abilities] Registration complete. Effect functions available:',
                'Q:', !!window.zoeyStrawberryBellBurstEffect,
                'W:', !!window.zoeyHeartPounceEffect,
                'E:', !!window.zoeySparkleburstEffect,
                'R:', !!window.zoeyGlowingLightArcEffect);
}

// Set up a direct observer to reapply the ability effect if needed
document.addEventListener('DOMContentLoaded', () => {
    // Add a MutationObserver to watch for Zoey's character being added to the DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.id && node.id.startsWith('character-zoey')) {
                        console.log('[Zoey Debug] Zoey character added to DOM, checking abilities...');
                        
                        // Try to find the character in the game state
                        setTimeout(() => {
                            if (window.gameManager && window.gameManager.gameState) {
                                const zoey = [...window.gameManager.gameState.playerCharacters, 
                                             ...window.gameManager.gameState.aiCharacters]
                                            .find(c => c.id === 'zoey');
                                
                                if (zoey && zoey.abilities) {
                                    console.log('[Zoey Debug] Found Zoey character in game state, checking abilities');
                                    
                                    // Fix abilities if needed
                                    zoey.abilities.forEach(ability => {
                                        if (ability.id === 'zoey_q' && (!ability.effect || typeof ability.effect !== 'function')) {
                                            console.log('[Zoey Debug] Fixing Zoey Q ability effect');
                                            ability.effect = window.zoeyStrawberryBellBurstEffect;
                                        }
                                        else if (ability.id === 'zoey_w' && (!ability.effect || typeof ability.effect !== 'function')) {
                                            console.log('[Zoey Debug] Fixing Zoey W ability effect');
                                            ability.effect = window.zoeyHeartPounceEffect;
                                        }
                                        else if (ability.id === 'zoey_e' && (!ability.effect || typeof ability.effect !== 'function')) {
                                            console.log('[Zoey Debug] Fixing Zoey E ability effect');
                                            ability.effect = window.zoeySparkleburstEffect;
                                        }
                                        else if (ability.id === 'zoey_r' && (!ability.effect || typeof ability.effect !== 'function')) {
                                            console.log('[Zoey Debug] Fixing Zoey R ability effect');
                                            ability.effect = window.zoeyGlowingLightArcEffect;
                                        }
                                    });
                                }
                            }
                        }, 500); // Wait a bit for game state to be fully initialized
                    }
                });
            }
        }
    });
    
    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
});

// Register abilities when DOM is fully loaded to ensure all dependencies are available
document.addEventListener('DOMContentLoaded', registerAbilities);

// Also try registering immediately in case the script loads after DOM is ready
registerAbilities();

// Ensure abilities are properly registered when AbilityFactory is available
function ensureAbilitiesRegistered() {
    // Try to find the AbilityFactory
    if (!window.AbilityFactory) {
        console.log('[Zoey Debug] AbilityFactory not found, will retry in 500ms');
        setTimeout(ensureAbilitiesRegistered, 500);
        return;
    }
    
    // Register functions directly with AbilityFactory
    console.log('[Zoey Debug] Ensuring ability functions are properly registered');
    
    // Register ability effects by function name
    if (typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        // Register Strawberry Bell Burst
        window.AbilityFactory.registerAbilityEffect('zoeyStrawberryBellBurstEffect', window.zoeyStrawberryBellBurstEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_q', window.zoeyStrawberryBellBurstEffect);
        
        // Register Glowing Light Arc
        window.AbilityFactory.registerAbilityEffect('zoeyGlowingLightArcEffect', window.zoeyGlowingLightArcEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_r', window.zoeyGlowingLightArcEffect);
        
        // Register Heart Pounce
        window.AbilityFactory.registerAbilityEffect('zoeyHeartPounceEffect', window.zoeyHeartPounceEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_w', window.zoeyHeartPounceEffect);
        
        // Register Sparkle Burst
        window.AbilityFactory.registerAbilityEffect('zoeySparkleburstEffect', window.zoeySparkleburstEffect);
        window.AbilityFactory.registerAbilityEffect('zoey_e', window.zoeySparkleburstEffect);
        
        console.log('[Zoey Debug] Registered ability effect functions with AbilityFactory');
    }
    
    // Patch any existing abilities that might be loaded already
    if (window.AbilityFactory.abilityRegistry) {
        // Fix Q ability if it exists
        if (window.AbilityFactory.abilityRegistry['zoey_q']) {
            window.AbilityFactory.abilityRegistry['zoey_q'].effect = window.zoeyStrawberryBellBurstEffect;
            console.log('[Zoey Debug] Fixed zoey_q in abilityRegistry');
        }
        
        // Fix W ability if it exists
        if (window.AbilityFactory.abilityRegistry['zoey_w']) {
            window.AbilityFactory.abilityRegistry['zoey_w'].effect = window.zoeyHeartPounceEffect;
            console.log('[Zoey Debug] Fixed zoey_w in abilityRegistry');
        }
        
        // Fix E ability if it exists
        if (window.AbilityFactory.abilityRegistry['zoey_e']) {
            window.AbilityFactory.abilityRegistry['zoey_e'].effect = window.zoeySparkleburstEffect;
            console.log('[Zoey Debug] Fixed zoey_e in abilityRegistry');
        }
    }
    
    // Also patch the registeredEffects if they exist
    if (window.AbilityFactory.registeredEffects) {
        window.AbilityFactory.registeredEffects['zoeyStrawberryBellBurstEffect'] = window.zoeyStrawberryBellBurstEffect;
        window.AbilityFactory.registeredEffects['zoey_q'] = window.zoeyStrawberryBellBurstEffect;
        window.AbilityFactory.registeredEffects['zoeyHeartPounceEffect'] = window.zoeyHeartPounceEffect;
        window.AbilityFactory.registeredEffects['zoey_w'] = window.zoeyHeartPounceEffect;
        window.AbilityFactory.registeredEffects['zoeySparkleburstEffect'] = window.zoeySparkleburstEffect;
        window.AbilityFactory.registeredEffects['zoey_e'] = window.zoeySparkleburstEffect;
        console.log('[Zoey Debug] Added abilities to registeredEffects');
    }
}

// Run the registration check on page load
document.addEventListener('DOMContentLoaded', ensureAbilitiesRegistered);

// Also try running it immediately in case DOM is already loaded
ensureAbilitiesRegistered();

// Register abilities when DOM is fully loaded to ensure all dependencies are available
document.addEventListener('DOMContentLoaded', registerAbilities);

// Also try registering immediately in case the script loads after DOM is ready
registerAbilities();

// Direct initialization for Sparkle Burst
(function() {
    console.log('[Zoey Debug] Running immediate Sparkle Burst initialization');
    
    // Force-register the ability functions globally
    window.zoeySparkleburstEffect = window.zoeySparkleburstEffect || function(casterOrData, targets, abilityInstance, actualManaCost, options = {}) {
        // Handle both initialization and execution modes
        if (typeof casterOrData === 'object' && casterOrData.constructor.name === 'Character') {
            // Execution mode - casting the ability
            const caster = casterOrData;
            
            // For AoE ability, get all enemies instead of just the targeted one
            if (!Array.isArray(targets) || targets.length === 0) {
                if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                    targets = window.gameManager.getOpponents(caster);
                    console.log('[Zoey Abilities] Using all enemies for Sparkle Burst:', targets.length);
                }
            }
            
            return executeSparkleburst(caster, targets, abilityInstance);
        } else {
            // Initialization mode - setting up description
            const ability = abilityInstance;
            return {
                execute: (caster, targets) => {
                    // For AoE ability, get all enemies instead of just the targeted one
                    if (!Array.isArray(targets) || targets.length === 0) {
                        if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                            targets = window.gameManager.getOpponents(caster);
                            console.log('[Zoey Abilities] Using all enemies for Sparkle Burst:', targets.length);
                        }
                    }
                    
                    return executeSparkleburst(caster, targets, ability);
                },
                generateDescription: () => {
                    return updateSparkleburstDescription(ability);
                }
            };
        }
    };

    // Try different registration methods to ensure compatibility
    if (window.AbilityFactory) {
        if (typeof window.AbilityFactory.registerAbilityEffect === 'function') {
            window.AbilityFactory.registerAbilityEffect('zoeySparkleburstEffect', window.zoeySparkleburstEffect);
            window.AbilityFactory.registerAbilityEffect('zoey_e', window.zoeySparkleburstEffect);
            console.log('[Zoey Debug] IIFE registered Sparkle Burst via registerAbilityEffect');
        }
        
        if (window.AbilityFactory.registeredEffects) {
            window.AbilityFactory.registeredEffects['zoeySparkleburstEffect'] = window.zoeySparkleburstEffect;
            window.AbilityFactory.registeredEffects['zoey_e'] = window.zoeySparkleburstEffect;
            console.log('[Zoey Debug] IIFE added Sparkle Burst to registeredEffects');
        }
        
        if (window.AbilityFactory.abilityRegistry && window.Ability) {
            // Create a new ability instance if it doesn't exist
            if (!window.AbilityFactory.abilityRegistry['zoey_e']) {
                try {
                    const sparkleburstAbility = new window.Ability(
                        'zoey_e',
                        'Sparkle Burst',
                        'Icons/abilities/sparkle_burst.png',
                        100, // manaCost
                        11,  // cooldown
                        window.zoeySparkleburstEffect
                    );
                    
                    sparkleburstAbility.baseDescription = 'Zoey unleashes a burst of sparkles with 50% hit chance for each enemy. Deals 200% Magical Damage to all enemies hit. This ability\'s cooldown is reduced for each enemy hit.';
                    sparkleburstAbility.description = sparkleburstAbility.baseDescription;
                    sparkleburstAbility.targetType = 'all_enemies';
                    
                    window.AbilityFactory.abilityRegistry['zoey_e'] = sparkleburstAbility;
                    console.log('[Zoey Debug] IIFE created and added Sparkle Burst to abilityRegistry');
                } catch (e) {
                    console.error('[Zoey Debug] IIFE failed to create ability:', e);
                }
            } else {
                // Just update the existing ability effect
                window.AbilityFactory.abilityRegistry['zoey_e'].effect = window.zoeySparkleburstEffect;
                console.log('[Zoey Debug] IIFE updated existing Sparkle Burst in abilityRegistry');
            }
        }
    }
    
    // Check any existing Zoey characters in the game state
    if (window.gameManager && window.gameManager.gameState) {
        const allCharacters = [
            ...(window.gameManager.gameState.playerCharacters || []),
            ...(window.gameManager.gameState.aiCharacters || [])
        ];
        
        for (const character of allCharacters) {
            if (character.id === 'zoey' && character.abilities) {
                // Find the Sparkle Burst ability
                for (const ability of character.abilities) {
                    if (ability.id === 'zoey_e') {
                        console.log('[Zoey Debug] IIFE found Sparkle Burst ability in character, fixing effect');
                        ability.effect = window.zoeySparkleburstEffect;
                        
                        // Also ensure other properties are correct
                        ability.name = ability.name || 'Sparkle Burst';
                        ability.manaCost = ability.manaCost || 100;
                        ability.cooldown = ability.cooldown || 11;
                        ability.targetType = ability.targetType || 'all_enemies';
                        ability.type = ability.type || 'custom';
                        ability.functionName = ability.functionName || 'zoeySparkleburstEffect';
                        
                        console.log('[Zoey Debug] IIFE updated Sparkle Burst ability:', ability);
                    }
                }
            }
        }
    }
})();

function executeGlowingLightArc(caster, targets, abilityInstance) {
    return new Promise(async (resolve) => {
        const gameManager = window.gameManager;
        gameManager.addLogEntry(`${caster.name} uses Glowing Light Arc!`, 'zoey');
        
        // Show the ability VFX
        await showGlowingLightArcVFX(caster, targets);
        
        // Process each target
        const baseDamage = 255;
        // Check for Enhanced Light Arc talent
        const magicDamageMultiplier = caster.enableEnhancedLightArc ? 1.75 : 1.0; // 175% or 100% of magical damage
        
        // Initialize hit results to track which targets were hit
        const hitResults = [];
        
        // Ensure targets is iterable - convert to array if it's a single target
        let targetsArray = targets;
        if (!Array.isArray(targets)) {
            if (targets && typeof targets === 'object') {
                // Single target object
                targetsArray = [targets];
            } else {
                // No valid targets
                console.error('[Zoey Abilities] Invalid targets for Glowing Light Arc:', targets);
                gameManager.addLogEntry(`Glowing Light Arc failed to find valid targets!`, 'system');
                resolve();
                return;
            }
        }
        
        for (let target of targetsArray) {
            // 75% chance to hit
            const hitChance = 0.75;
            const isHit = Math.random() < hitChance;
            
            if (isHit) {
                // Calculate damage
                const magicDamageBonus = caster.stats.magicalDamage * magicDamageMultiplier;
                const totalDamage = baseDamage + magicDamageBonus;
                const finalDamage = caster.calculateDamage(totalDamage, 'magical', target);
                
                // Show enhanced indicator if talent is active
                if (caster.enableEnhancedLightArc) {
                    showEnhancedLightArcIndicator(target);
                }
                
                // Create damage calculation event for passive integration
                const attackCalculationEvent = new CustomEvent('attack:calculation', {
                    detail: {
                        caster: caster,
                        target: target,
                        damage: finalDamage,
                        type: 'magical',
                        source: abilityInstance
                    }
                });
                
                // Dispatch the event to allow passive to modify damage
                document.dispatchEvent(attackCalculationEvent);
                
                // Get the potentially modified damage from the event
                const modifiedDamage = attackCalculationEvent.detail.damage;
                
                // Apply damage
                const damageResult = await target.applyDamage(modifiedDamage, 'magical', caster, {
                    sourceAbility: abilityInstance,
                    isCritical: false, // This ability cannot crit as per design
                    abilityId: 'zoey_r'
                });
                
                // Extract the damage amount safely
                const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                    ? damageResult.damage 
                    : (typeof damageResult === 'number' ? damageResult : modifiedDamage);
                
                // Create damage taken event to notify passive for mark application
                const damageTakenEvent = new CustomEvent('damage:taken', {
                    detail: {
                        caster: caster,
                        target: target,
                        damage: damageAmount,
                        type: 'magical',
                        source: abilityInstance
                    }
                });
                
                // Dispatch the damage taken event
                document.dispatchEvent(damageTakenEvent);
                
                // If the damage was successful, disable a random ability
                let abilityDisabled = false;
                if (!damageResult.dodged && !damageResult.missed) {
                    hitResults.push(target);
                    await disableRandomAbility(target);
                    abilityDisabled = true;
                }
                
                // Track successful Light Arc hit
                if (window.trackGlowingLightArcStats) {
                    window.trackGlowingLightArcStats(caster, target, damageResult, true, abilityDisabled, caster.enableEnhancedLightArc);
                }
                
                // Show impact VFX on the target
                showGlowingLightArcImpactVFX(target);
                
                // Add a small delay between targets
                await delay(200);
            } else {
                // Target wasn't hit, show miss text in battle log instead of floating text
                // Create a miss element directly on the target
                const targetElement = document.getElementById(`character-${target.id}`);
                if (targetElement) {
                    const missText = document.createElement('div');
                    missText.className = 'floating-text miss';
                    missText.textContent = 'MISS';
                    missText.style.animation = 'missBounce 1.5s ease-out forwards';
                    targetElement.appendChild(missText);
                    
                    // Add a small shake effect to the target to show they dodged
                    targetElement.classList.add('dodge-animation');
                    setTimeout(() => {
                        targetElement.classList.remove('dodge-animation');
                    }, 500);
                    
                    // Remove after animation
                    setTimeout(() => {
                        if (missText && missText.parentNode) {
                            missText.parentNode.removeChild(missText);
                        }
                    }, 2000);
                }
                
                gameManager.addLogEntry(`${target.name} is not hit by Glowing Light Arc.`);
                
                // Track miss statistics
                if (window.trackGlowingLightArcStats) {
                    window.trackGlowingLightArcStats(caster, target, null, false, false, caster.enableEnhancedLightArc);
                }
                
                // Use the showFloatingText method if it exists
                if (gameManager.showFloatingText && target.id) {
                    gameManager.showFloatingText(`character-${target.id}`, "MISS", "miss");
                }
                await delay(200);
            }
        }
        
        // Add a log entry about ability disables
        if (hitResults.length > 0) {
            gameManager.addLogEntry(`Glowing Light Arc disabled abilities for ${hitResults.length} target(s)!`, 'zoey');
        }
        
        resolve();
    });
}

// Helper function to disable a random ability of the target
async function disableRandomAbility(target) {
    // Get all abilities of the target
    const abilities = target.abilities || [];
    
    // If the target has no abilities, return
    if (!abilities || abilities.length === 0) return;
    
    // Find abilities that are not passive and not already disabled
    const usableAbilities = abilities.filter(ability => 
        ability && !ability.passive && !ability.isDisabled
    );
    
    if (usableAbilities.length === 0) {
        window.gameManager.addLogEntry(`${target.name} has no abilities that can be disabled!`);
        return;
    }
    
    // Select a random ability
    const randomIndex = Math.floor(Math.random() * usableAbilities.length);
    const abilityToDisable = usableAbilities[randomIndex];
    
    // Duration for the disable effect
    const disableDuration = 2;
    
    // Access Effect class if available
    const Effect = window.Effect;
    
    if (Effect) {
        // Using Effect class like in angry_bull implementation
        const debuffId = `ability_disabled_${abilityToDisable.id}`;
        const debuffName = `Ability Disabled: ${abilityToDisable.name}`;
        const debuffIcon = "Icons/debuffs/ability_disabled.png";
        
        // Create the Effect instance
        const disableDebuff = new Effect(
            debuffId,
            debuffName,
            debuffIcon,
            disableDuration,
            null, // No per-turn effect
            true  // isDebuff = true
        ).setDescription(`${abilityToDisable.name} is disabled for ${disableDuration} turns.`);
        
        // Save reference to disabled ability
        disableDebuff.disabledAbilityId = abilityToDisable.id;
        
        // Apply the disable effect directly to the ability object
        abilityToDisable.isDisabled = true;
        abilityToDisable.disabledDuration = disableDuration;
        
        // Define the remove function for when debuff expires
        disableDebuff.remove = function(character) {
            const disabledAbility = character.abilities.find(a => a.id === this.disabledAbilityId);
            if (disabledAbility) {
                if (disabledAbility.isDisabled && disabledAbility.disabledDuration <= 0) {
                    disabledAbility.isDisabled = false;
                    window.gameManager.addLogEntry(`${character.name}'s ${disabledAbility.name} is no longer disabled!`);
                    
                    // Update UI to reflect the change
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(character);
                    }
                }
            }
        };
        
        // Apply the debuff
        await target.addDebuff(disableDebuff);
    } else {
        // Fallback to simple object approach if Effect class not available
        const debuff = {
            id: `ability_disabled_${abilityToDisable.id}`,
            name: `Ability Disabled (${abilityToDisable.name})`,
            description: `${abilityToDisable.name} is disabled for ${disableDuration} turns.`,
            icon: "Icons/debuffs/ability_disabled.png",
            duration: disableDuration,
            effect: {
                type: "disableAbility",
                abilityId: abilityToDisable.id
            },
            source: "Glowing Light Arc"
        };
        
        // Try to directly set the isDisabled property
        abilityToDisable.isDisabled = true;
        
        // Apply the debuff
        await target.addDebuff(debuff);
    }
    
    // Show visual effect for ability disable
    const targetElement = document.getElementById(`character-${target.id}`);
    if (targetElement) {
        // Add VFX for the ability disable
        const debuffVfx = document.createElement('div');
        debuffVfx.className = 'ability-disable-vfx';
        targetElement.appendChild(debuffVfx);
        
        // Remove the VFX after animation completes
        setTimeout(() => {
            if (debuffVfx && debuffVfx.parentNode) {
                debuffVfx.parentNode.removeChild(debuffVfx);
            }
        }, 800);
    }
    
    // Add log entry and update UI
    window.gameManager.addLogEntry(`${target.name}'s ${abilityToDisable.name} is disabled!`);
    
    // Update the UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
}

// Visual effect for Glowing Light Arc
function showGlowingLightArcVFX(caster, targets) {
    return new Promise(async (resolve) => {
        const battleContainer = document.querySelector('.battle-container');
        const casterElement = document.getElementById(`character-${caster.id}`);
        
        if (!casterElement || !battleContainer) {
            resolve();
            return;
        }
        
        // Ensure targets is an array for consistent handling
        if (!Array.isArray(targets) && targets && typeof targets === 'object') {
            targets = [targets];
        }
        
        // Create main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'glowing-arc-vfx';
        battleContainer.appendChild(vfxContainer);
        
        // Create source effect around the caster
        const sourceEffect = document.createElement('div');
        sourceEffect.className = 'glowing-arc-source';
        casterElement.querySelector('.image-container').appendChild(sourceEffect);
        
        // Create the arc beam
        const arcBeam = document.createElement('div');
        arcBeam.className = 'glowing-arc-beam';
        vfxContainer.appendChild(arcBeam);
        
        // Add particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'glowing-arc-particle';
            arcBeam.appendChild(particle);
        }
        
        // Wait for animation
        await delay(1000);
        
        // Clean up
        if (sourceEffect && sourceEffect.parentNode) {
            sourceEffect.parentNode.removeChild(sourceEffect);
        }
        
        if (vfxContainer && vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
        }
        
        resolve();
    });
}

// Impact VFX when a target is hit
function showGlowingLightArcImpactVFX(target) {
    const targetElement = document.getElementById(`character-${target.id}`);
    
    if (!targetElement) return;
    
    // Create impact effect
    const impactEffect = document.createElement('div');
    impactEffect.className = 'glowing-arc-impact';
    targetElement.querySelector('.image-container').appendChild(impactEffect);
    
    // Add impact particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'glowing-arc-impact-particle';
        impactEffect.appendChild(particle);
    }
    
    // Remove impact effect after animation completes
    setTimeout(() => {
        if (impactEffect && impactEffect.parentNode) {
            impactEffect.parentNode.removeChild(impactEffect);
        }
    }, 1500);
}

// Helper function for delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showEnhancedLightArcIndicator(target) {
    try {
        const targetElement = document.getElementById(`character-${target.id}`);
        if (!targetElement) return;
        
        // Create enhanced damage indicator
        const indicator = document.createElement('div');
        indicator.className = 'enhanced-light-arc-indicator';
        indicator.textContent = '+75% DAMAGE!';
        targetElement.appendChild(indicator);
        
        // Add log entry if game manager is available
        if (window.gameManager) {
            window.gameManager.addLogEntry(`Enhanced Light Arc deals increased damage to ${target.name}!`, 'zoey talent-effect');
        }
        
        // Remove after animation
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 2000);
        
    } catch (error) {
        console.error('[Zoey Abilities] Error in showEnhancedLightArcIndicator:', error);
    }
}

// Expose the functions globally
window.zoeyGlowingLightArcEffect = function(caster, targets, ability) {
    // For AoE ability, get all enemies instead of just the targeted one
    if (!Array.isArray(targets) || targets.length === 0) {
        if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
            targets = window.gameManager.getOpponents(caster);
            console.log('[Zoey Abilities] Using all enemies for Glowing Light Arc:', targets.length);
        }
    }
    
    return executeGlowingLightArc(caster, targets, ability);
};

// Expose description update functions globally for talent manager access
window.updateHeartPounceDescription = updateHeartPounceDescription;
window.updateSparkleburstDescription = updateSparkleburstDescription;
window.updateGlowingLightArcDescription = updateGlowingLightArcDescription; 