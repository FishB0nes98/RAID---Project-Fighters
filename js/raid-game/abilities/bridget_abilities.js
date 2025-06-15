// Bridget Abilities and Passive Implementation

/**
 * Bridget Statistics Enhancement
 * Enhanced statistics tracking for all of Bridget's abilities to match comprehensive tracking systems
 */

/**
 * Global helper function to track Bridget's ability usage for statistics
 */
function trackBridgetAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[BridgetStats] StatisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[BridgetStats] Tracked ${effectType} ability usage: ${abilityId} by ${character.name}`);
    } catch (error) {
        console.error(`[BridgetStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Enhanced Ribbon Wave Rush (Q) statistics tracking
 */
window.trackRibbonWaveRushStats = function(caster, target, damageResult) {
    if (!window.statisticsManager) return;
    
    try {
        // Track damage dealt with proper ability ID
        window.statisticsManager.recordDamageDealt(
            caster, 
            target, 
            damageResult.damage, 
            'magical', 
            damageResult.isCritical,
            'bridget_q'
        );
        
        console.log(`[BridgetStats] Ribbon Wave Rush damage tracked: ${damageResult.damage} to ${target.name}`);
    } catch (error) {
        console.error(`[BridgetStats] Error tracking Ribbon Wave Rush stats:`, error);
    }
};

/**
 * Enhanced Bubble Beam Barrage (W) statistics tracking
 */
window.trackBubbleBeamStats = function(caster, target, result, isHealing = false, beamType = 'standard') {
    if (!window.statisticsManager) return;
    
    try {
        let abilityId = 'bridget_w';
        if (beamType === 'enhanced') {
            abilityId = 'bridget_w_enhanced';
        }
        
        if (isHealing) {
            // Track healing done with healing beam suffix
            window.statisticsManager.recordHealingDone(
                caster,
                target,
                result.healAmount,
                result.isCritical,
                abilityId + '_heal'
            );
            console.log(`[BridgetStats] Bubble Beam healing tracked: ${result.healAmount} to ${target.name}`);
        } else {
            // Track damage dealt
            window.statisticsManager.recordDamageDealt(
                caster,
                target,
                result.damage,
                'magical',
                result.isCritical,
                abilityId
            );
            console.log(`[BridgetStats] Bubble Beam damage tracked: ${result.damage} to ${target.name}`);
        }
    } catch (error) {
        console.error(`[BridgetStats] Error tracking Bubble Beam stats:`, error);
    }
};

/**
 * Enhanced Arcane Bubble Shield (E) statistics tracking
 */
window.trackArcaneShieldStats = function(caster) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility ability usage for buff application
        trackBridgetAbilityUsage(caster, 'bridget_e', 'utility', 0, false);
        
        console.log(`[BridgetStats] Arcane Bubble Shield utility usage tracked for ${caster.name}`);
    } catch (error) {
        console.error(`[BridgetStats] Error tracking Arcane Shield stats:`, error);
    }
};

/**
 * Enhanced Bubble Arsenal projectile statistics tracking
 */
window.trackBubbleArsenalStats = function(caster, target, result, isHealing = false) {
    if (!window.statisticsManager) return;
    
    try {
        if (isHealing) {
            // Track healing done
            window.statisticsManager.recordHealingDone(
                caster,
                target,
                result.healAmount,
                result.isCritical,
                'bridget_e_arsenal_heal'
            );
            console.log(`[BridgetStats] Bubble Arsenal healing tracked: ${result.healAmount} to ${target.name}`);
        } else {
            // Track damage dealt
            window.statisticsManager.recordDamageDealt(
                caster,
                target,
                result.damage,
                'magical',
                result.isCritical,
                'bridget_e_arsenal_damage'
            );
            console.log(`[BridgetStats] Bubble Arsenal damage tracked: ${result.damage} to ${target.name}`);
        }
    } catch (error) {
        console.error(`[BridgetStats] Error tracking Bubble Arsenal stats:`, error);
    }
};

/**
 * Enhanced Wave Crush (R) statistics tracking
 */
window.trackWaveCrushStats = function(caster, target, result, isHealing = false) {
    if (!window.statisticsManager) return;
    
    try {
        if (isHealing) {
            // Track healing done
            window.statisticsManager.recordHealingDone(
                caster,
                target,
                result.healAmount,
                result.isCritical,
                'bridget_r_heal'
            );
            console.log(`[BridgetStats] Wave Crush healing tracked: ${result.healAmount} to ${target.name}`);
        } else {
            // Track damage dealt
            window.statisticsManager.recordDamageDealt(
                caster,
                target,
                result.damage,
                'magical',
                result.isCritical,
                'bridget_r'
            );
            console.log(`[BridgetStats] Wave Crush damage tracked: ${result.damage} to ${target.name}`);
        }
    } catch (error) {
        console.error(`[BridgetStats] Error tracking Wave Crush stats:`, error);
    }
};

/**
 * Enhanced Passive Healing statistics tracking
 */
window.trackBridgetPassiveStats = function(character, healAmount, triggeringDamage) {
    if (!window.statisticsManager) return;
    
    try {
        // Track healing done from passive
        window.statisticsManager.recordHealingDone(
            character,
            character, // Self-heal
            healAmount,
            false, // Not critical
            'bridget_passive_healing'
        );
        
        // Track passive ability usage
        trackBridgetAbilityUsage(character, 'bridget_passive', 'passive_trigger', triggeringDamage, false);
        
        // Record as a passive event
        window.statisticsManager.recordTurnEvent({
            type: 'passive_trigger',
            caster: character.name,
            casterId: character.instanceId || character.id,
            passiveName: 'Echoing Bubble',
            passiveId: 'bridget_passive',
            triggeringDamage: triggeringDamage,
            healAmount: healAmount,
            turn: window.statisticsManager.currentTurn || 0
        });
        
        console.log(`[BridgetStats] Passive healing tracked: ${healAmount} HP from ${triggeringDamage} damage for ${character.name}`);
    } catch (error) {
        console.error(`[BridgetStats] Error tracking passive stats:`, error);
    }
};

/**
 * Bridget's Ribbon Wave Rush (Q) ability
 * Summons a waterfall that hits two random enemies
 */
const ABILITY_EFFECT_REGISTRY = {};

// Helper function to get the correct game manager instance
const getGameManager = () => window.gameManager;

let bridgetRibbonWaveRushEffect = (caster, targets, abilityInstance) => {
    // Get game manager for utility functions
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // For all_enemies type, the game should pass all enemies as the targets parameter
    // But let's handle both cases to be safe
    let allEnemies = [];
    
    if (Array.isArray(targets) && targets.length > 0) {
        // If targets passed as array, use them directly
        allEnemies = targets.filter(enemy => enemy && !enemy.isDead());
        console.log("Using provided targets:", allEnemies.length);
    } else if (gameManager && typeof gameManager.getOpponents === 'function') {
        // Fallback: get enemies from game manager
        allEnemies = gameManager.getOpponents(caster).filter(enemy => !enemy.isDead());
        console.log("Getting targets from gameManager:", allEnemies.length);
    } else {
        // No valid targets and no way to get them
        log(`${caster.name} tried to use Ribbon Wave Rush, but couldn't find any targets!`, "error");
        return false;
    }
    
    // If no valid targets, end the ability
    if (allEnemies.length === 0) {
        log(`${caster.name} used Ribbon Wave Rush, but there were no valid targets!`);
        return false;
    }
    
    // Check for Chain Wave talent and set target count accordingly
    let baseTargetCount = 2; // Default target count
    if (caster.chainWaveActive) {
        baseTargetCount = 3; // Increased target count with Chain Wave talent
        console.log("[Chain Wave] Active! Targeting 3 enemies instead of 2");
    }
    
    // Select up to baseTargetCount random targets from all enemies
    const targetCount = Math.min(baseTargetCount, allEnemies.length);
    
    // Shuffle array to select random enemies
    const shuffledEnemies = [...allEnemies];
    for (let i = shuffledEnemies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledEnemies[i], shuffledEnemies[j]] = [shuffledEnemies[j], shuffledEnemies[i]];
    }
    
    // Take first N enemies after shuffling
    const selectedTargets = shuffledEnemies.slice(0, targetCount);
    
    log(`${caster.name} unleashes Ribbon Wave Rush on ${targetCount} enemies!`);
    
    // Track ability usage
    if (window.trackBridgetAbilityUsage) {
        trackBridgetAbilityUsage(caster, 'bridget_q', 'use', 0, false);
    }
    
    // Play water cascade sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/water_cascade.mp3', 0.7);
    }
    
    // Create source VFX for the caster
    showWaterSourceVFX(caster);
    
    // Track total damage for passive healing
    let totalDamage = 0;
    
    // Calculate damage per hit
    // Use baseDamage from the abilityInstance passed to the effect function
    const baseDamage = abilityInstance.baseDamage || 365; // Default if not found or undefined
    const magicalDamage = caster.stats.magicalDamage || 0;
    const damagePerHit = baseDamage + Math.floor(magicalDamage * 0.85);
    
    // Process each target with a small delay between them
    selectedTargets.forEach((target, index) => {
        setTimeout(() => {
            // Calculate damage
            let damage = damagePerHit;
            
            // Apply critical hit if applicable
            let isCritical = false;
            if (Math.random() < (caster.stats.critChance || 0)) {
                const critMultiplier = caster.stats.critDamage || 1.5;
                damage *= critMultiplier;
                isCritical = true;
            }
            
            // Round damage to integer
            damage = Math.floor(damage);
            
            // Apply damage to the target
            const damageResult = target.applyDamage(damage, 'magical', caster, { abilityId: 'bridget_q' });
            
            // Track damage statistics
            if (window.trackRibbonWaveRushStats) {
                window.trackRibbonWaveRushStats(caster, target, damageResult);
            }
            
            // Show water impact VFX
            showWaterImpactVFX(target, isCritical);
            
            // Log damage
            let message = `${target.name} takes ${damageResult.damage} magical damage from ${caster.name}'s Ribbon Wave Rush`;
            if (isCritical) {
                message += " (Critical Hit!)";
            }
            log(message);
            
            // Add to total damage for passive healing
            totalDamage += damageResult.damage;
            
            // Check if the target died
            if (target.isDead()) {
                log(`${target.name} has been defeated!`);
                if (gameManager) {
                    gameManager.handleCharacterDeath(target);
                }
            }
            
            // Apply Abyssal Mark debuff if the talent is active
            if (caster.abyssalMarkActive && !target.isDead()) {
                applyAbyssalMarkDebuff(caster, target);
                console.log(`[Abyssal Mark] Applied mark to ${target.name} from Ribbon Wave Rush`);
            }
            
            // Check if critical hit occurred and dispatch event
            if (damageResult.isCritical) {
                dispatchBridgetCriticalHit(caster, target, damageResult.damage);
                
                // Apply Fluid Evasion buff if the talent is active
                if (caster.fluidEvasionActive) {
                    applyFluidEvasionBuff(caster);
                }
            }
            
            // Check for Endless Cascade after the last target
            if (index === selectedTargets.length - 1) {
                // After a small delay to give time for visual effects to play out
                setTimeout(() => {
                    // Check if Endless Cascade talent is active
                    if (caster.endlessCascadeActive) {
                        // Normal gameplay chance of 10%
                        const cascadeChance = 0.1; // 10% for normal gameplay
                        
                        if (Math.random() < cascadeChance) {
                            console.log("[Endless Cascade] Triggered! Preventing turn end and resetting Ribbon Wave cooldown");
                            
                            // Find Ribbon Wave ability and reset its cooldown
                            const ribbonWaveAbility = caster.abilities.find(ability => ability.id === 'bridget_q');
                            if (ribbonWaveAbility) {
                                ribbonWaveAbility.currentCooldown = 0;
                                log(`${caster.name}'s Endless Cascade activates! Ribbon Wave Rush cooldown reset!`, 'system-update');
                            }
                            
                            // Prevent turn from ending - direct method
                            if (gameManager) {
                                // Set the flag directly
                                gameManager.preventTurnEndFlag = true;
                                
                                // Remove character from acted characters list if present
                                if (gameManager.actedCharacters && Array.isArray(gameManager.actedCharacters)) {
                                    const charIndex = gameManager.actedCharacters.indexOf(caster.id);
                                    if (charIndex > -1) {
                                        console.log(`[Endless Cascade] Removing ${caster.name} from actedCharacters list`);
                                        gameManager.actedCharacters.splice(charIndex, 1);
                                    }
                                }
                                
                                // Restore selected character (it may have been cleared already)
                                gameManager.gameState.selectedCharacter = caster;
                                
                                // Force UI to update character as active
                                if (gameManager.uiManager) {
                                    console.log(`[Endless Cascade] Marking ${caster.name} as active again`);
                                    gameManager.uiManager.markCharacterAsActive(caster);
                                    gameManager.uiManager.updateCharacterUI(caster);
                                    gameManager.uiManager.updateEndTurnButton();
                                }
                                
                                log(`${caster.name} can act again!`, 'system-update');
                            }
                            
                            // Show the visual effect
                            showEndlessCascadeVFX(caster);
                        }
                    }
                }, 500); // Half-second delay after the last target's effects
            }
        }, index * 400); // 400ms delay between hits
    });
    
    // Apply passive healing after all damage has been calculated
    setTimeout(() => {
        // --- DEBUG LOGS FOR PASSIVE ---
        console.log(`[Bridget Q Passive Trigger Attempt] Total Damage: ${totalDamage}`);
        console.log(`[Bridget Q Passive Trigger Attempt] Caster Passive Handler:`, caster.passiveHandler);
        if (caster.passiveHandler) {
            console.log(`[Bridget Q Passive Trigger Attempt] typeof applyPassiveHealing: ${typeof caster.passiveHandler.applyPassiveHealing}`);
        }
        // --- END DEBUG LOGS ---
        if (totalDamage > 0 && caster.passiveHandler && typeof caster.passiveHandler.applyPassiveHealing === 'function') {
            caster.passiveHandler.applyPassiveHealing(totalDamage);
        }
    }, (selectedTargets.length * 400) + 100); // Wait for all targets to be hit first
    
    // Return true to indicate successful use
    return {
        success: true,
        targets: selectedTargets,
        doesNotRequireTarget: true // Explicitly indicate this doesn't need manual targeting
    };
};

/**
 * Shows water source VFX on the caster when casting Ribbon Wave Rush
 */
function showWaterSourceVFX(caster) {
    const casterId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterId}`);
    
    if (!casterElement) return;
    
    // Create water source container
    const waterSourceVFX = document.createElement('div');
    waterSourceVFX.className = 'bridget-water-source-vfx';
    casterElement.appendChild(waterSourceVFX);
    
    // Create water circles/ripples
    for (let i = 0; i < 5; i++) {
        const waterCircle = document.createElement('div');
        waterCircle.className = 'bridget-water-circle';
        waterCircle.style.animationDelay = `${i * 0.1}s`;
        waterSourceVFX.appendChild(waterCircle);
    }
    
    // Create water particles
    for (let i = 0; i < 15; i++) {
        const waterParticle = document.createElement('div');
        waterParticle.className = 'bridget-water-particle';
        waterParticle.style.left = `${30 + Math.random() * 40}%`;
        waterParticle.style.animationDelay = `${Math.random() * 0.5}s`;
        waterSourceVFX.appendChild(waterParticle);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (waterSourceVFX.parentNode === casterElement) {
            casterElement.removeChild(waterSourceVFX);
        }
    }, 2000);
}

/**
 * Shows water impact VFX on the target when hit by Ribbon Wave Rush
 */
function showWaterImpactVFX(target, isCritical = false) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create impact container
    const waterImpactVFX = document.createElement('div');
    waterImpactVFX.className = 'bridget-water-impact-vfx';
    if (isCritical) {
        waterImpactVFX.classList.add('critical');
    }
    targetElement.appendChild(waterImpactVFX);
    
    // Create water splash
    const waterSplash = document.createElement('div');
    waterSplash.className = 'bridget-water-splash';
    waterImpactVFX.appendChild(waterSplash);
    
    // Create water droplets
    const dropletCount = isCritical ? 20 : 12;
    for (let i = 0; i < dropletCount; i++) {
        const droplet = document.createElement('div');
        droplet.className = 'bridget-water-droplet';
        droplet.style.left = `${Math.random() * 100}%`;
        droplet.style.animationDuration = `${0.5 + Math.random() * 0.7}s`;
        droplet.style.animationDelay = `${Math.random() * 0.3}s`;
        waterImpactVFX.appendChild(droplet);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (waterImpactVFX.parentNode === targetElement) {
            targetElement.removeChild(waterImpactVFX);
        }
    }, 1500);
}

/**
 * Applies passive healing based on damage dealt, considering talents.
 * @param {Character} caster The character dealing damage and healing.
 * @param {number} totalDamage The total damage dealt by the ability.
 */
function applyBridgetPassiveHealing(caster, totalDamage) {
    // Ensure caster and passive details are available
    if (!caster || !caster.passive || caster.isDead()) {
        console.warn("[Bridget Passive DEBUG] Caster, caster.passive, or caster is dead, skipping passive healing.");
        return;
    }

    const gameManager = getGameManager();
    if (!gameManager) {
        console.error("[Bridget Passive DEBUG] GameManager not available for passive healing.");
        return;
    }
    const log = gameManager.addLogEntry.bind(gameManager);

    const healPercent = caster.passive.healPercent || 0.10; // Default to 10% if not defined
    const healFromDamage = Math.floor(totalDamage * healPercent);

    if (healFromDamage <= 0) {
        console.log(`[Bridget Passive DEBUG] Passive heal amount from damage (${healFromDamage}) is too low.`);
        return;
    }

    console.log(`[Bridget Passive DEBUG] applyBridgetPassiveHealing called with damage=${totalDamage}, base heal from damage=${healFromDamage}`);

    const targetsToHeal = [];
    // Always heal Bridget (the caster)
    targetsToHeal.push(caster);

    // Oceanic Harmony Talent: Passive heals Bridget and TWO random allies instead of 1.
    const oceanicHarmonyActive = caster.oceanicHarmonyActive === true;
    console.log(`[Bridget Passive DEBUG] caster.oceanicHarmonyActive: ${oceanicHarmonyActive}`);

    // Get allies correctly using gameManager
    let allies = [];
    if (gameManager && typeof gameManager.getAllies === 'function') {
        allies = gameManager.getAllies(caster).filter(
            ally => ally && !ally.isDead() && ally.id !== caster.id && (ally.stats.currentHp < ally.stats.maxHp)
        );
    } else {
        console.warn("[Bridget Passive DEBUG] gameManager.getAllies is not available for filtering allies.");
    }
    console.log(`[Bridget Passive DEBUG] Found ${allies.length} potential allies to heal:`, allies.map(a => a.name));


    if (oceanicHarmonyActive) {
        // Shuffle allies to pick random ones
        for (let i = allies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allies[i], allies[j]] = [allies[j], allies[i]];
        }
        targetsToHeal.push(...allies.slice(0, 2)); // Add up to two random allies
        console.log(`[Bridget Passive DEBUG] Oceanic Harmony ACTIVE - Selected ${targetsToHeal.length -1} additional allies.`);
    } else {
        // Original passive: Heal one additional random living ally if available
        if (allies.length > 0) {
            targetsToHeal.push(allies[Math.floor(Math.random() * allies.length)]);
            console.log(`[Bridget Passive DEBUG] Oceanic Harmony INACTIVE - Selected 1 additional ally.`);
        } else {
             console.log(`[Bridget Passive DEBUG] Oceanic Harmony INACTIVE - No additional allies to select.`);
        }
    }

    targetsToHeal.forEach(target => {
        if (target && !target.isDead()) {
            // Apply the base passive heal (e.g., 42% of damage dealt)
            const healResult = target.heal(healFromDamage, caster, { abilityId: 'bridget_passive_healing' }); // Pass caster
            const actualHeal = healResult.healAmount;

            if (actualHeal > 0) {
                // Track passive healing statistics
                if (window.trackBridgetPassiveStats) {
                    window.trackBridgetPassiveStats(caster, target, healResult, totalDamage);
                }
                
                showPassiveHealingVFX(target, actualHeal); // Show VFX on the healed target
                const targetName = target.id === caster.id ? "herself" : target.name;
                log(`${caster.name}'s Flowing Essence passively heals ${targetName} for ${actualHeal} HP.`, 'heal');

                // Echoing Bubbles Talent
                if (caster.echoingBubblesActive === true) {
                    const procChance = 1.0; // TEMPORARILY SET TO 1.0 (100%) FOR TESTING
                    const randomRoll = Math.random();
                    console.log(`[Echoing Bubbles] Target: ${target.name}, Roll: ${randomRoll.toFixed(4)}, Chance: ${procChance} (FORCED FOR TEST)`);
                    if (randomRoll < procChance) {
                        triggerBridgetEchoingBubble(target, caster);
                    }
                }

                // Clam Protection Aura Talent
                if (caster.clamProtectionAuraActive === true && target.id !== caster.id) { // Don't apply to self if it's an aura for allies
                    applyClamProtectionBuff(target, caster); // Ensure this function is defined or accessible
                }
            }
        }
    });
    // Update UI for all affected characters if needed, or rely on individual heal/buff calls
    if (gameManager && typeof gameManager.uiManager !== 'undefined' && typeof gameManager.uiManager.updateCharacterUI === 'function') {
        targetsToHeal.forEach(t => gameManager.uiManager.updateCharacterUI(t));
    }
};

function triggerBridgetEchoingBubble(target, caster) {
    // ---- START VERY PROMINENT LOG ----
    console.warn("ENTERING triggerBridgetEchoingBubble FUNCTION NOW - Check for subsequent Calculation logs!");
    // ---- END VERY PROMINENT LOG ----

    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // ---- START DIAGNOSTIC LOGS (MOVED UP) ----
    const baseHeal = 50;
    const magicalDamageScaling = 2.00; // Set to 200% Magical Damage scaling
    const currentMagicalDamage = caster.stats.magicalDamage || 0;
    console.log(`[Echoing Bubbles Calculation] Caster: ${caster.name}, Current Magical Damage: ${currentMagicalDamage}`);
    const bonusHeal = Math.floor(currentMagicalDamage * magicalDamageScaling);
    console.log(`[Echoing Bubbles Calculation] Base Heal: ${baseHeal}, Bonus Heal from Magical Damage: ${bonusHeal} (Scaling: ${magicalDamageScaling*100}%)`);
    const totalHealAmount = baseHeal + bonusHeal;
    console.log(`[Echoing Bubbles Calculation] Total Calculated Initial Heal Amount for Bubble: ${totalHealAmount}`);
    // ---- END DIAGNOSTIC LOGS ----

    log(`[Echoing Bubbles] talent proc'd! ${caster.name} launches a healing bubble at ${target.name}.`, 'talent-effect');

    if (target && !target.isDead() && totalHealAmount > 0) {
        const healResult = target.heal(totalHealAmount, caster, { abilityId: 'bridget_echoing_bubble' });
         if (healResult.healAmount > 0) {
            // Track Echoing Bubble talent statistics
            if (window.trackEchoingBubbleStats) {
                window.trackEchoingBubbleStats(caster, target, healResult);
            }
            
            log(`${caster.name}'s Echoing Bubble heals ${target.name} for ${healResult.healAmount} HP.`, 'heal');
         }
         // Update UI for the target of the echoing bubble
        if (gameManager && typeof gameManager.uiManager !== 'undefined' && typeof gameManager.uiManager.updateCharacterUI === 'function') {
            gameManager.uiManager.updateCharacterUI(target);
        }
    }
    showBridgetEchoingBubbleVFX(caster, target);
}

function showBridgetEchoingBubbleVFX(caster, target) {
    console.log(`[Echoing Bubbles] Showing VFX from ${caster.name} to ${target.name}`);
    if (!caster || !target || !document.getElementById(`character-${caster.instanceId || caster.id}`)) return;

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (!casterElement || !targetElement) {
        console.warn("[Echoing Bubbles] Missing caster or target element for VFX.");
        return;
    }

    const vfxContainer = document.querySelector('.battle-container') || document.body;

    const bubble = document.createElement('div');
    bubble.className = 'echoing-bubble-projectile'; // CSS class defined in bridget.css
    vfxContainer.appendChild(bubble);

    const startRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    // Ensure containerRect is only calculated if vfxContainer is not document.body
    const containerRect = vfxContainer === document.body ? { left: 0, top: 0 } : vfxContainer.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - containerRect.left;
    const startY = startRect.top + startRect.height / 2 - containerRect.top;
    const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
    const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

    bubble.style.left = `${startX}px`;
    bubble.style.top = `${startY}px`;

    requestAnimationFrame(() => {
        bubble.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`;
        bubble.style.opacity = '0';
    });

    setTimeout(() => {
        bubble.remove();
        if (targetElement && !target.isDead()) {
            const impactVFX = document.createElement('div');
            impactVFX.className = 'echoing-bubble-impact'; // CSS class defined in bridget.css
            for(let i=0; i< 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'echoing-bubble-particle'; // CSS class defined in bridget.css
                particle.style.setProperty('--i', i);
                impactVFX.appendChild(particle);
            }
            targetElement.appendChild(impactVFX);
            setTimeout(() => impactVFX.remove(), 800); 
        }
    }, 600); 
}

/**
 * Applies the Aqueous Renewal talent effect to Bridget directly
 * Increases healing power by 5% permanently when triggered
 */
function applyAqueousRenewalBuff(character) {
    if (!character) {
        console.error('[Aqueous Renewal] No character provided!');
        return;
    }

    console.log(`[Aqueous Renewal] Applying permanent buff to ${character.name}`);
    
    // Default buff value from the talent (5% healing power increase)
    const buffValue = 0.05;

    // First approach: Use the character's applyStatModification method (preferred)
    if (typeof character.applyStatModification === 'function') {
        character.applyStatModification('healingPower', 'add', buffValue);
        console.log(`[Aqueous Renewal] Applied permanent +${buffValue * 100}% healing power via applyStatModification`);
    } 
    // Second approach: Direct stat modification
    else if (character.stats && typeof character.stats.healingPower !== 'undefined') {
        character.stats.healingPower += buffValue;
        console.log(`[Aqueous Renewal] Applied permanent +${buffValue * 100}% healing power via direct stat modification`);
    }
    // Third approach: Modify baseStats directly
    else if (character.baseStats && typeof character.baseStats.healingPower !== 'undefined') {
        character.baseStats.healingPower += buffValue;
        console.log(`[Aqueous Renewal] Applied permanent +${buffValue * 100}% healing power via baseStats modification`);
    }
    // Error case
    else {
        console.error(`[Aqueous Renewal] Could not find healingPower stat on ${character.name}!`);
        return;
    }
    
    // Recalculate stats
    if (typeof character.recalculateStats === 'function') {
        character.recalculateStats('aqueous_renewal_talent');
    }
    
    // Show visual effect
    showAqueousRenewalVFX(character, buffValue);
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(character);
    }
}

/**
 * Shows healing VFX from Bridget's passive
 */
function showPassiveHealingVFX(character, healAmount) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Create passive healing VFX container
    const passiveHealVFX = document.createElement('div');
    passiveHealVFX.className = 'bridget-passive-heal-vfx';
    charElement.appendChild(passiveHealVFX);
    
    // Create healing circle
    const healCircle = document.createElement('div');
    healCircle.className = 'bridget-heal-circle';
    passiveHealVFX.appendChild(healCircle);
    
    // Create healing text
    const healText = document.createElement('div');
    healText.className = 'bridget-heal-text';
    healText.textContent = `+${healAmount}`;
    passiveHealVFX.appendChild(healText);
    
    // Create healing bubbles
    for (let i = 0; i < 8; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bridget-heal-bubble';
        bubble.style.left = `${20 + Math.random() * 60}%`;
        bubble.style.animationDelay = `${Math.random() * 0.5}s`;
        bubble.style.width = `${5 + Math.random() * 8}px`;
        bubble.style.height = bubble.style.width;
        passiveHealVFX.appendChild(bubble);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (passiveHealVFX.parentNode === charElement) {
            charElement.removeChild(passiveHealVFX);
        }
    }, 2000);
}

/**
 * Creates and animates a bubble beam projectile from the caster to the target
 */
function createBubbleBeamProjectile(caster, target, index, isCritical = false, isHealingBeam = false) {
    const gameManager = getGameManager();
    const vfxContainer = document.querySelector('.battle-container') || document.body;

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (!casterElement || !targetElement) {
        console.warn("[Bubble Beam Projectile] Missing caster or target element.");
        return;
    }

    const beamContainer = document.createElement('div');
    beamContainer.className = 'bridget-bubble-beam-container';
    vfxContainer.appendChild(beamContainer);

    const projectile = document.createElement('div');
    projectile.className = 'bridget-bubble-projectile';
    if (isHealingBeam) {
        projectile.classList.add('healing-beam'); // Add a class for styling healing beams differently
    }
    if (isCritical) {
        projectile.classList.add('critical');
    }
    beamContainer.appendChild(projectile);
    
    // Get positions for caster and target for trajectory
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calculate start and end positions (center of elements)
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    // Apply slight random variation to projectile path
    const angleVariation = Math.random() * 0.2 - 0.1; // Small random angle
    const speedVariation = 0.8 + Math.random() * 0.4; // Random speed between 0.8-1.2
    
    // Position projectile at starting position
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;
    beamContainer.appendChild(projectile);
    
    // Create trail bubbles - more when Enhanced Barrage is active
    let trailCount;
    if (caster.enhancedBubbleBarrage) {
        // Enhanced Barrage: 7-10 trail bubbles for more visual impact
        trailCount = Math.floor(Math.random() * 4) + 7;
    } else {
        // Standard: 5-8 trail bubbles
        trailCount = Math.floor(Math.random() * 4) + 5;
    }
    
    const trails = [];
    
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = 'bridget-bubble-trail';
        trail.style.left = `${startX}px`;
        trail.style.top = `${startY}px`;
        trail.style.width = `${6 + Math.random() * 6}px`;
        trail.style.height = trail.style.width;
        trail.style.opacity = `${0.4 + Math.random() * 0.3}`;
        beamContainer.appendChild(trail);
        trails.push(trail);
    }
    
    // Calculate distance and angle
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) + angleVariation;
    
    // Animation duration based on distance (faster for further targets)
    const duration = distance / (300 * speedVariation); // pixels per second
    const startTime = performance.now();
    
    function animateProjectile(timestamp) {
        const elapsed = (timestamp - startTime) / 1000; // seconds
        
        // Calculate progress (0 to 1)
        const progress = Math.min(elapsed / duration, 1);
        
        // Quadratic ease-in-out for smoother motion
        let easedProgress;
        if (progress < 0.5) {
            easedProgress = 2 * progress * progress;
        } else {
            easedProgress = 1 - Math.pow(-2 * progress + 2, 2) / 2;
        }
        
        // Calculate current position with slight arc
        // Add a slight arc to the path for more natural movement
        const arcHeight = distance * 0.15;
        const arcOffset = Math.sin(easedProgress * Math.PI) * arcHeight;
        
        // Calculate position along the straight line
        const currentX = startX + (Math.cos(angle) * distance * easedProgress);
        const currentY = startY + (Math.sin(angle) * distance * easedProgress) - arcOffset;
        
        // Update projectile position
        projectile.style.left = `${currentX}px`;
        projectile.style.top = `${currentY}px`;
        
        // Scale size based on progress (bigger in the middle)
        const scale = 1 + Math.sin(easedProgress * Math.PI) * 0.3;
        projectile.style.transform = `scale(${scale})`;
        
        // Update trail positions with delay
        trails.forEach((trail, i) => {
            const trailDelay = 0.15 * (i + 1);
            const trailProgress = Math.max(0, Math.min(1, (progress - trailDelay * 0.5)));
            
            if (trailProgress > 0) {
                // Calculate trail position with variation
                const trailX = startX + (Math.cos(angle + (i * 0.05)) * distance * trailProgress);
                const trailY = startY + (Math.sin(angle + (i * 0.05)) * distance * trailProgress) - 
                              (Math.sin(trailProgress * Math.PI) * arcHeight * 0.7);
                
                trail.style.left = `${trailX}px`;
                trail.style.top = `${trailY}px`;
                
                // Fade out as they get closer to target
                trail.style.opacity = `${0.7 * (1 - trailProgress)}`;
                
                // Scale down as they get closer to target
                const trailScale = 1 - (trailProgress * 0.7);
                trail.style.transform = `scale(${trailScale})`;
            }
        });
        
        // Continue animation until done
        if (progress < 1) {
            requestAnimationFrame(animateProjectile);
        } else {
            // Clean up when animation is complete
            setTimeout(() => {
                if (beamContainer.parentNode) {
                    beamContainer.parentNode.removeChild(beamContainer);
                }
            }, 100);
            
            // Show impact effect
            showBubbleImpactVFX(target, isCritical);
        }
    }
    
    // Add a small delay based on index to stagger beam firing
    setTimeout(() => {
        requestAnimationFrame(animateProjectile);
    }, index * 150);
}

/**
 * Bridget's Bubble Beam Barrage (W) ability
 * Shoots 3-7 bubble beams at random enemies
 */
const bridgetBubbleBeamBarrageEffect = (caster, targets, abilityInstance) => {
    // Get game manager for utility functions
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Find the ability in the character's abilities
    const bubbleBeamAbility = caster.abilities.find(ability => ability.id === 'bridget_w');
    
    // Ensure the ability has the damageScaling property
    if (bubbleBeamAbility && bubbleBeamAbility.damageScaling === undefined) {
        bubbleBeamAbility.damageScaling = 1.25; // Set default 125% scaling
        console.log(`[Bubble Beam] Set default damageScaling to 1.25`);
    }
    
    // Update the description based on current ability state
    if (bubbleBeamAbility) {
        updateBubbleBeamDescription(bubbleBeamAbility);
    }
    
    // For all_enemies type, the game should pass all enemies as the targets parameter
    // But let's handle both cases to be safe
    let allEnemies = [];
    
    if (Array.isArray(targets) && targets.length > 0) {
        // If targets passed as array, use them directly
        allEnemies = targets.filter(enemy => enemy && !enemy.isDead());
        console.log("Using provided targets:", allEnemies.length);
    } else if (gameManager && typeof gameManager.getOpponents === 'function') {
        // Fallback: get enemies from game manager
        allEnemies = gameManager.getOpponents(caster).filter(enemy => !enemy.isDead());
        console.log("Getting targets from gameManager:", allEnemies.length);
    } else {
        // No valid targets and no way to get them
        log(`${caster.name} tried to use Bubble Beam Barrage, but couldn't find any targets!`, "error");
        return false;
    }
    
    // If no valid targets, end the ability
    if (allEnemies.length === 0) {
        log(`${caster.name} used Bubble Beam Barrage, but there were no valid targets!`);
        return false;
    }
    
    // Check if the Bubble Healing talent is active
    const hasBubbleHealingTalent = caster.appliedTalents && caster.appliedTalents.includes('bubble_healing');
    
    // If Bubble Healing talent is active, also get allies
    let allAllies = [];
    if (hasBubbleHealingTalent && gameManager && typeof gameManager.getAllies === 'function') {
        allAllies = gameManager.getAllies(caster)
            .filter(ally => ally !== caster && !ally.isDead()); // Exclude self and dead allies
        console.log(`[Bubble Healing] Found ${allAllies.length} viable allies to potentially heal`);
    }
    
    // Randomly determine number of bubble beams
    // Check if Enhanced Barrage talent is active
    let beamCount;
    if (caster.enhancedBubbleBarrage) {
        // Enhanced Barrage: 5-8 beams
        beamCount = Math.floor(Math.random() * 4) + 5; // 5 to 8
        log(`${caster.name} unleashes an Enhanced Bubble Beam Barrage, firing ${beamCount} beams!`);
    } else {
        // Standard: 3-7 beams
        beamCount = Math.floor(Math.random() * 5) + 3; // 3 to 7
        log(`${caster.name} unleashes Bubble Beam Barrage, firing ${beamCount} beams!`);
    }
    
    // Track ability usage
    if (window.trackBridgetAbilityUsage) {
        const beamType = caster.enhancedBubbleBarrage ? 'enhanced' : 'standard';
        trackBridgetAbilityUsage(caster, beamType === 'enhanced' ? 'bridget_w_enhanced' : 'bridget_w', 'use', beamCount, false);
    }
    
    // Play bubble beam sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/water_cascade.mp3', 0.7); // Reuse water sound or use a bubble sound if available
    }
    
    // Create source VFX for the caster
    showBubbleSourceVFX(caster);
    
    // Track total damage for passive healing
    let totalDamage = 0;
    
    // Generate beam targets
    const beamTargets = [];
    
    // If Bubble Healing talent is active and there are allies
    if (hasBubbleHealingTalent && allAllies.length > 0) {
        // For each beam, decide if it targets ally or enemy
        for (let i = 0; i < beamCount; i++) {
            // 40% chance to target an ally for healing if talent is active
            const shouldTargetAlly = (Math.random() < 0.4); // Check chance first
            
            if (shouldTargetAlly && allAllies.length > 0) {
                const selectedAlly = allAllies[Math.floor(Math.random() * allAllies.length)];
                beamTargets.push({type: 'ally', target: selectedAlly, index: i});
                console.log(`[Bubble Healing] Beam ${i+1} targeting ALLY: ${selectedAlly.name}`);
            } else if (allEnemies.length > 0) {
                const selectedEnemy = allEnemies[Math.floor(Math.random() * allEnemies.length)];
                beamTargets.push({type: 'enemy', target: selectedEnemy, index: i});
            } else {
                // No valid enemies left, and didn't target ally, try to target ally if possible
                if (allAllies.length > 0) {
                    const selectedAlly = allAllies[Math.floor(Math.random() * allAllies.length)];
                    beamTargets.push({type: 'ally', target: selectedAlly, index: i});
                    console.log(`[Bubble Healing] Beam ${i+1} (no enemies left) targeting ALLY: ${selectedAlly.name}`);
                } else {
                    // Should not happen if initial checks are correct, but as a fallback
                    log(`Bubble Beam ${i+1} had no valid target.`);
                    continue;
                }
            }
        }
    } else {
        // Original behavior: all beams target random enemies
        for (let i = 0; i < beamCount; i++) {
            if (allEnemies.length > 0) {
                const selectedEnemy = allEnemies[Math.floor(Math.random() * allEnemies.length)];
                beamTargets.push({type: 'enemy', target: selectedEnemy, index: i });
            } else {
                log(`Bubble Beam ${i+1} had no valid enemy target.`);
                continue;
            }
        }
    }

    // Process each beam
    beamTargets.forEach(beamInfo => {
        const currentTarget = beamInfo.target;
        const beamIndex = beamInfo.index;

        if (beamInfo.type === 'ally') {
            // ---- HEAL ALLY ----
            const initialHealAmount = Math.floor(caster.stats.magicalDamage * 2.00);
            
            console.log(`[Bubble Healing - Ally Heal Calc] Caster MD: ${caster.stats.magicalDamage}, Initial Heal: ${initialHealAmount}`);
            
            if (initialHealAmount > 0) {
                const healResult = currentTarget.heal(initialHealAmount, caster, { abilityId: 'bridget_w_heal' });
                log(`${caster.name}'s Bubble Beam heals ${currentTarget.name} for ${healResult.healAmount} HP.${healResult.isCritical ? " (Critical Heal!)" : ""}`, 'heal');
                console.log(`[Bubble Healing - Ally Heal Result] Target: ${currentTarget.name}, Healed for: ${healResult.healAmount}, Crit: ${healResult.isCritical}, Caster HealingPower for context: ${caster.stats.healingPower}`);
                
                // Track healing statistics
                if (window.trackBubbleBeamStats) {
                    const beamType = caster.enhancedBubbleBarrage ? 'enhanced' : 'standard';
                    window.trackBubbleBeamStats(caster, currentTarget, healResult, true, beamType);
                }
                
                // Create a healing projectile VFX for allies
                createBubbleBeamProjectile(caster, currentTarget, beamIndex, healResult.isCritical, true /* isHealingBeam */);
            } else {
                log(`${caster.name}'s Bubble Beam aimed to heal ${currentTarget.name}, but calculated heal was too low.`);
            }
        } else {
            // ---- DAMAGE ENEMY ----
            let damage = Math.floor(caster.stats.magicalDamage * (bubbleBeamAbility ? bubbleBeamAbility.damageScaling : 1.25));
            let isCritical = Math.random() < (caster.stats.critChance || 0);
    
            if (isCritical) {
                damage = Math.floor(damage * (caster.stats.critDamage || 1.5));
            }
    
            // Create projectile VFX towards the enemy
            createBubbleBeamProjectile(caster, currentTarget, beamIndex, isCritical, false /* isHealingBeam */);
    
            // Apply damage with a slight delay to sync with projectile animation
            setTimeout(() => {
                if (currentTarget && !currentTarget.isDead()) {
                    const damageResult = currentTarget.applyDamage(damage, 'magical', caster, { abilityId: 'bridget_w' });
                    log(`${caster.name}'s Bubble Beam hits ${currentTarget.name} for ${damageResult.damage} magical damage.${isCritical ? " (Critical Hit!)" : ""}`);
                    totalDamage += damageResult.damage; // Accumulate damage for passive
                    
                    // Track damage statistics
                    if (window.trackBubbleBeamStats) {
                        const beamType = caster.enhancedBubbleBarrage ? 'enhanced' : 'standard';
                        window.trackBubbleBeamStats(caster, currentTarget, damageResult, false, beamType);
                    }
    
                    // Check for death & passive after damage is applied
                    if (currentTarget.isDead()) {
                        log(`${currentTarget.name} has been defeated!`);
                        if (gameManager && typeof gameManager.handleCharacterDeath === 'function') {
                            gameManager.handleCharacterDeath(currentTarget);
                        }
                    }
                    // Call passive healing after each damaging hit or after all damage?
                    // For now, let's do it after all beams to represent total burst for passive.
                }
            }, 700); // Delay to match typical projectile travel time
        }
    });

    // After all beams have been processed and damage accumulated:
    setTimeout(() => {
        if (totalDamage > 0 && caster.passiveHandler && typeof caster.passiveHandler.applyPassiveHealing === 'function') {
            caster.passiveHandler.applyPassiveHealing(totalDamage);
        }
        // Update UI for caster (mana, cooldowns)
        if (gameManager && typeof gameManager.uiManager !== 'undefined' && typeof gameManager.uiManager.updateCharacterUI === 'function') {
            gameManager.uiManager.updateCharacterUI(caster);
        }
    }, beamCount * 150 + 800); // Ensure this runs after all projectiles might have landed and damage dealt

    return true;
};

/**
 * Shows bubble source VFX on the caster when casting Bubble Beam Barrage
 */
function showBubbleSourceVFX(caster) {
    const casterId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterId}`);
    
    if (!casterElement) return;
    
    // Create bubble source container
    const bubbleSourceVFX = document.createElement('div');
    bubbleSourceVFX.className = 'bridget-bubble-source-vfx';
    casterElement.appendChild(bubbleSourceVFX);
    
    // Create bubble glow
    const bubbleGlow = document.createElement('div');
    bubbleGlow.className = 'bridget-bubble-glow';
    bubbleSourceVFX.appendChild(bubbleGlow);
    
    // Create bubbles around caster
    for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bridget-bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.top = `${Math.random() * 100}%`;
        bubble.style.animationDelay = `${Math.random() * 0.5}s`;
        bubble.style.width = `${8 + Math.random() * 12}px`;
        bubble.style.height = bubble.style.width;
        bubbleSourceVFX.appendChild(bubble);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (bubbleSourceVFX.parentNode === casterElement) {
            casterElement.removeChild(bubbleSourceVFX);
        }
    }, 2500);
}

/**
 * Shows bubble impact VFX on the target when hit by Bubble Beam Barrage
 */
function showBubbleImpactVFX(target, isCritical = false) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create impact container
    const bubbleImpactVFX = document.createElement('div');
    bubbleImpactVFX.className = 'bridget-bubble-impact-vfx';
    if (isCritical) {
        bubbleImpactVFX.classList.add('critical');
    }
    targetElement.appendChild(bubbleImpactVFX);
    
    // Create bubble splash
    const bubbleSplash = document.createElement('div');
    bubbleSplash.className = 'bridget-bubble-splash';
    bubbleImpactVFX.appendChild(bubbleSplash);
    
    // Create bubbles
    const bubbleCount = isCritical ? 15 : 8;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bridget-impact-bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.top = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${0.5 + Math.random() * 0.7}s`;
        bubble.style.animationDelay = `${Math.random() * 0.3}s`;
        bubble.style.width = `${5 + Math.random() * 10}px`;
        bubble.style.height = bubble.style.width;
        bubbleImpactVFX.appendChild(bubble);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (bubbleImpactVFX.parentNode === targetElement) {
            targetElement.removeChild(bubbleImpactVFX);
        }
    }, 1500);
}

/**
 * Bridget's Arcane Bubble Shield (E) ability
 * Places two buffs on Bridget:
 * 1. Water Shield - Increases magic shield by 12% for 3 turns
 * 2. Bubble Arsenal - Creates 3 magical bubbles that shoot at allies/enemies each turn
 */
const bridgetArcaneBubbleShieldEffect = (caster) => {
    // Update the description based on current ability state
    const arcaneShieldAbility = caster.abilities.find(ability => ability.id === 'bridget_e');
    if (arcaneShieldAbility) {
        updateArcaneShieldDescription(arcaneShieldAbility);
    }
    
    // Get game manager for utility functions
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    log(`${caster.name} casts Arcane Bubble Shield, surrounding herself with protective water magic!`);
    
    // Track ability usage
    if (window.trackArcaneShieldStats) {
        window.trackArcaneShieldStats(caster);
    }
    
    // Play water shield sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/water_shield.mp3', 0.7);
    }
    
    // Apply Water Shield buff (magic shield +12 for 3 turns)
    const waterShieldBuff = new Effect(
        'bridget_water_shield',
        'Water Shield',
        'Icons/buffs/water_shield.webp',
        3, // Duration: 3 turns
        null, // No per-turn tick effect, stat modification handled by statModifiers
        false // Not a debuff
    );
    
    // Define the stat modification for the buff
    waterShieldBuff.statModifiers = [
        { stat: 'magicalShield', operation: 'add', value: 12 }
    ];
    
    waterShieldBuff.onRemove = (character) => {
        // Only clean up the water shield VFX, stat reversion is handled by recalculateStats
        cleanupWaterShieldVFX(character);
    };
    
    waterShieldBuff.setDescription('Increases Magic Shield stat by 12.');
    caster.addBuff(waterShieldBuff);
    
    // Show Water Shield VFX
    showWaterShieldVFX(caster);
    
    // Check for Enhanced Bubble Shield talent
    let bubbleCount = 3; // Default bubble count
    if (caster.enhancedBubbleShieldActive) {
        bubbleCount = 6; // Double the bubbles with the talent
        console.log("[Enhanced Bubble Shield] Active! Creating 6 bubbles instead of 3");
    }
    
    // Apply Bubble Arsenal buff (bubbles are determined by talent)
    const bubbleArsenalBuff = new Effect(
        'bridget_bubble_arsenal',
        'Bubble Arsenal',
        'Icons/buffs/bubble_arsenal.webp',
        3, // Duration: 3 turns
        (character) => {
            // Initialize bubble count if not set
            if (typeof bubbleArsenalBuff.bubbleCount === 'undefined') {
                bubbleArsenalBuff.bubbleCount = bubbleCount;
            }
            
            // Create VFX for the bubbles around Bridget
            updateBubbleArsenalVFX(character, bubbleArsenalBuff.bubbleCount);
        },
        false // Not a debuff
    );
    
    // Setup the onRemove handler to clean up VFX
    bubbleArsenalBuff.onRemove = (character) => {
        // Clean up the bubble arsenal VFX
        cleanupBubbleArsenalVFX(character);
    };
    
    // Setup the turn end handler to shoot bubbles
    bubbleArsenalBuff.bubbleCount = bubbleCount; // Initialize bubble count based on talent
    
    bubbleArsenalBuff.onTurnEnd = async (character) => {
        // Get game manager for utility functions and logging
        const gameManager = getGameManager();
        if (!gameManager) {
            console.error("Bubble Arsenal: GameManager not found!");
            return;
        }
        const log = gameManager.addLogEntry.bind(gameManager);

        // Only process if we have bubbles left
        if (bubbleArsenalBuff.bubbleCount <= 0) {
            return;
        }
        
        console.log(`Bubble Arsenal activating for ${character.name}. Bubbles left: ${bubbleArsenalBuff.bubbleCount}. Current Turn: ${gameManager.gameState.turn}`);

        // Get all possible targets (allies and enemies)
        const allies = gameManager.getAllies(character).filter(ally => !ally.isDead());
        const enemies = gameManager.getOpponents(character).filter(enemy => !enemy.isDead());
        
        // Remove self from allies for targeting
        const alliesExcludingSelf = allies.filter(ally => ally !== character);
        
        // Combine all valid targets
        let allTargets = [...alliesExcludingSelf, ...enemies];
        
        // If no valid targets, end early
        if (allTargets.length === 0) {
            log(`${character.name}'s Bubble Arsenal has no valid targets!`);
            return;
        }
        
        // Randomly select a target
        const randomIndex = Math.floor(Math.random() * allTargets.length);
        const target = allTargets[randomIndex];
        
        // Determine if target is ally or enemy
        const isAlly = allies.includes(target);
        
        // Reduce bubble count
        bubbleArsenalBuff.bubbleCount--;
        
        // Update the VFX to show one less bubble
        updateBubbleArsenalVFX(character, bubbleArsenalBuff.bubbleCount);
        
        // Create and animate the bubble projectile
        await createBubbleArsenalProjectile(character, target, isAlly);
        
        // Apply effect based on target type
        if (isAlly) {
            // Heal ally
            const baseheal = 655;
            const magicalDamage = character.stats.magicalDamage || 0;
            const healAmount = Math.floor(baseheal + (magicalDamage * 0.60));
            
            const healResult = target.heal(healAmount, character, { abilityId: 'bridget_e_arsenal_heal' });
            log(`A magic bubble from ${character.name}'s Bubble Arsenal heals ${target.name} for ${healResult.healAmount} HP!`);
            
            // Track healing statistics
            if (window.trackBubbleArsenalStats) {
                window.trackBubbleArsenalStats(character, target, healResult, true);
            }
            
            // Show heal VFX on target
            showBubbleHealVFX(target, healResult.healAmount);
            
            // Check if the heal was critical and if character has the Aqueous Renewal talent
            if (healResult.isCritical && character.appliedTalents && character.appliedTalents.includes('aqueous_renewal')) {
                // Apply the healing power buff directly
                applyAqueousRenewalBuff(character);
            }
            
            // Apply Fluid Evasion buff if the talent is active and heal was critical
            if (healResult.isCritical && character.fluidEvasionActive) {
                applyFluidEvasionBuff(character);
            }
        } else {
            // Damage enemy
            const baseDamage = 500;
            const magicalDamage = character.stats.magicalDamage || 0;
            let damage = Math.floor(baseDamage + magicalDamage);
            
            // Apply critical hit if applicable
            let isCritical = false;
            if (Math.random() < (character.stats.critChance || 0)) {
                const critMultiplier = character.stats.critDamage || 1.5;
                damage *= critMultiplier;
                isCritical = true;
            }
            
            // Apply damage
            const damageResult = target.applyDamage(damage, 'magical', character, { abilityId: 'bridget_e_arsenal_damage' });
            
            // Track damage statistics
            if (window.trackBubbleArsenalStats) {
                window.trackBubbleArsenalStats(character, target, damageResult, false);
            }
            
            // Check if critical hit occurred and dispatch event
            if (damageResult.isCritical) {
                dispatchBridgetCriticalHit(character, target, damageResult.damage);
                
                // Apply Fluid Evasion buff if the talent is active
                if (character.fluidEvasionActive) {
                    applyFluidEvasionBuff(character);
                }
            }
            
            // Log damage
            let message = `A magic bubble from ${character.name}'s Bubble Arsenal hits ${target.name} for ${damageResult.damage} magical damage`;
            if (isCritical) {
                message += " (Critical Hit!)";
            }
            log(message);
            
            // Show damage VFX on target
            showBubbleDamageVFX(target, isCritical);
            
            // Check if the target died
            if (target.isDead()) {
                log(`${target.name} has been defeated!`);
                if (gameManager) {
                    gameManager.handleCharacterDeath(target);
                }
            }
        }
        
        // If this was the last bubble, update description
        if (bubbleArsenalBuff.bubbleCount === 0) {
            bubbleArsenalBuff.setDescription(`All bubbles have been used.`);
        }
    };
    
    // Set description based on bubble count from talent
    bubbleArsenalBuff.setDescription(`${bubbleCount} magical bubbles remain. Each turn, a bubble will automatically target a random ally or enemy.`);
    caster.addBuff(bubbleArsenalBuff);
    
    // Show initial bubbles VFX
    updateBubbleArsenalVFX(caster, bubbleCount);
    
    // Return success
    return {
        success: true,
        targets: [caster]
    };
};

/**
 * Shows water shield VFX on the caster
 */
function showWaterShieldVFX(character) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Create water shield element if it doesn't exist
    let shieldElement = charElement.querySelector('.bridget-water-shield');
    if (!shieldElement) {
        shieldElement = document.createElement('div');
        shieldElement.className = 'bridget-water-shield';
        charElement.appendChild(shieldElement);
        
        // Create shield ripples
        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'bridget-shield-ripple';
            ripple.style.animationDelay = `${i * 0.5}s`;
            shieldElement.appendChild(ripple);
        }
        
        // Create shield particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'bridget-shield-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 2}s`;
            shieldElement.appendChild(particle);
        }
    }
}

/**
 * Updates the bubble arsenal VFX to show the correct number of bubbles
 */
function updateBubbleArsenalVFX(character, bubbleCount) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Remove existing bubble arsenal if present
    let arsenalElement = charElement.querySelector('.bridget-bubble-arsenal');
    if (arsenalElement) {
        charElement.removeChild(arsenalElement);
    }
    
    // If no bubbles left, don't create new element
    if (bubbleCount <= 0) return;
    
    // Create new bubble arsenal container
    arsenalElement = document.createElement('div');
    arsenalElement.className = 'bridget-bubble-arsenal';
    charElement.appendChild(arsenalElement);
    
    // Create orbit element
    const orbitElement = document.createElement('div');
    orbitElement.className = 'bridget-bubble-orbit';
    arsenalElement.appendChild(orbitElement);
    
    // Create the bubbles
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bridget-arsenal-bubble';
        
        // Position bubbles in orbit
        const angle = (i * (360 / bubbleCount)) * (Math.PI / 180);
        const orbitRadius = 50; // Adjust as needed
        
        bubble.style.left = `calc(50% + ${Math.cos(angle) * orbitRadius}px)`;
        bubble.style.top = `calc(50% + ${Math.sin(angle) * orbitRadius}px)`;
        bubble.style.animationDelay = `${i * 0.2}s`;
        
        orbitElement.appendChild(bubble);
    }
}

/**
 * Creates and animates a bubble projectile from Bridget to the target
 */
async function createBubbleArsenalProjectile(source, target, isHealingBubble) {
    return new Promise(resolve => {
        // Get DOM elements for source and target
        const sourceId = source.instanceId || source.id;
        const targetId = target.instanceId || target.id;
        const sourceElement = document.getElementById(`character-${sourceId}`);
        const targetElement = document.getElementById(`character-${targetId}`);
        
        if (!sourceElement || !targetElement) {
            resolve();
            return;
        }
        
        // Create container for the projectile
        const bubbleContainer = document.createElement('div');
        bubbleContainer.className = 'bridget-arsenal-projectile-container';
        document.body.appendChild(bubbleContainer);
        
        // Get positions for source and target for trajectory
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Calculate start and end positions (center of elements)
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // Create the projectile bubble
        const projectile = document.createElement('div');
        projectile.className = 'bridget-arsenal-projectile';
        if (isHealingBubble) {
            projectile.classList.add('healing');
        } else {
            projectile.classList.add('damage');
        }
        
        // Position projectile at starting position
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        bubbleContainer.appendChild(projectile);
        
        // Create trail elements
        for (let i = 0; i < 5; i++) {
            const trail = document.createElement('div');
            trail.className = 'bridget-arsenal-trail';
            if (isHealingBubble) {
                trail.classList.add('healing');
            } else {
                trail.classList.add('damage');
            }
            trail.style.left = `${startX}px`;
            trail.style.top = `${startY}px`;
            trail.style.opacity = (0.8 - (i * 0.15)).toFixed(2);
            trail.style.animationDelay = `${i * 0.05}s`;
            bubbleContainer.appendChild(trail);
        }
        
        // Calculate distance and angle
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Animation duration based on distance
        const duration = distance / 400; // 400 pixels per second
        const startTime = performance.now();
        
        // Function to animate the projectile
        function animateProjectile(timestamp) {
            const elapsed = (timestamp - startTime) / 1000; // seconds
            const progress = Math.min(elapsed / duration, 1);
            
            // Eased progress for smoother motion
            const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Add a slight arc to the path
            const arcHeight = distance * 0.2;
            const arcOffset = Math.sin(easedProgress * Math.PI) * arcHeight;
            
            // Calculate position along path with arc
            const currentX = startX + (Math.cos(angle) * distance * easedProgress);
            const currentY = startY + (Math.sin(angle) * distance * easedProgress) - arcOffset;
            
            // Update projectile position
            projectile.style.left = `${currentX}px`;
            projectile.style.top = `${currentY}px`;
            
            // Update trail positions with delay
            const trails = bubbleContainer.querySelectorAll('.bridget-arsenal-trail');
            trails.forEach((trail, i) => {
                const trailProgress = Math.max(0, progress - (i * 0.05));
                if (trailProgress > 0) {
                    const trailX = startX + (Math.cos(angle) * distance * trailProgress);
                    const trailY = startY + (Math.sin(angle) * distance * trailProgress) - (Math.sin(trailProgress * Math.PI) * arcHeight);
                    
                    trail.style.left = `${trailX}px`;
                    trail.style.top = `${trailY}px`;
                    trail.style.opacity = `${0.7 * (1 - trailProgress)}`;
                }
            });
            
            // Continue animation until done
            if (progress < 1) {
                requestAnimationFrame(animateProjectile);
            } else {
                // Clean up and resolve promise
                setTimeout(() => {
                    if (bubbleContainer.parentNode) {
                        bubbleContainer.parentNode.removeChild(bubbleContainer);
                    }
                    resolve();
                }, 100);
            }
        }
        
        // Start animation
        requestAnimationFrame(animateProjectile);
    });
}

/**
 * Shows healing VFX when a bubble heals an ally
 */
function showBubbleHealVFX(target, healAmount) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create heal container
    const bubbleHealVFX = document.createElement('div');
    bubbleHealVFX.className = 'bridget-bubble-heal-vfx';
    targetElement.appendChild(bubbleHealVFX);
    
    // Create heal text
    const healText = document.createElement('div');
    healText.className = 'bridget-bubble-heal-text';
    healText.textContent = `+${Math.round(healAmount)}`;
    bubbleHealVFX.appendChild(healText);
    
    // Create heal bubbles
    const bubbleCount = 8;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bridget-heal-bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.bottom = `${Math.random() * 30 + 20}%`;
        bubble.style.width = `${8 + Math.random() * 8}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.animationDelay = `${Math.random() * 0.5}s`;
        bubbleHealVFX.appendChild(bubble);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (bubbleHealVFX.parentNode === targetElement) {
            targetElement.removeChild(bubbleHealVFX);
        }
    }, 2000);
}

/**
 * Shows damage VFX when a bubble hits an enemy
 */
function showBubbleDamageVFX(target, isCritical = false) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create damage VFX container
    const damageVFX = document.createElement('div');
    damageVFX.className = 'bridget-bubble-damage-vfx';
    if (isCritical) {
        damageVFX.classList.add('critical');
    }
    targetElement.appendChild(damageVFX);
    
    // Create bubble burst
    const bubbleBurst = document.createElement('div');
    bubbleBurst.className = 'bridget-bubble-burst';
    damageVFX.appendChild(bubbleBurst);
    
    // Create splash particles
    const particleCount = isCritical ? 15 : 8;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'bridget-bubble-damage-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Calculate random angle for particle direction
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 20;
        particle.style.setProperty('--moveX', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--moveY', `${Math.sin(angle) * distance}px`);
        
        particle.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
        damageVFX.appendChild(particle);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (damageVFX.parentNode === targetElement) {
            targetElement.removeChild(damageVFX);
        }
    }, 1000);
}

/**
 * Cleans up the water shield VFX when the buff is removed
 */
function cleanupWaterShieldVFX(character) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Find water shield element
    const shieldElement = charElement.querySelector('.bridget-water-shield');
    if (shieldElement) {
        // Add removing class for fade-out animation
        shieldElement.classList.add('removing');
        
        // Remove after animation completes
        setTimeout(() => {
            if (shieldElement.parentNode === charElement) {
                charElement.removeChild(shieldElement);
            }
        }, 800); // Match duration with CSS animation
    }
}

/**
 * Cleans up the bubble arsenal VFX when the buff is removed
 */
function cleanupBubbleArsenalVFX(character) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Find bubble arsenal element
    const arsenalElement = charElement.querySelector('.bridget-bubble-arsenal');
    if (arsenalElement) {
        // Add removing class for fade-out animation
        arsenalElement.classList.add('removing');
        
        // Remove after animation completes
        setTimeout(() => {
            if (arsenalElement.parentNode === charElement) {
                charElement.removeChild(arsenalElement);
            }
        }, 800); // Match duration with CSS animation
    }
}

/**
 * Bridget's Wave Crush (R) ability
 * Deals 700 damage to all enemies and heals all allies by 500. Triggers passive.
 */
const bridgetWaveCrushEffect = (caster) => {
    // Update the description based on current ability state
    const waveCrushAbility = caster.abilities.find(ability => ability.id === 'bridget_r');
    if (waveCrushAbility) {
        updateWaveCrushDescription(waveCrushAbility);
    }
    
    // Get game manager for utility functions
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;

    log(`${caster.name} channels immense power and unleashes Wave Crush!`);
    
    // Track ability usage
    if (window.trackBridgetAbilityUsage) {
        trackBridgetAbilityUsage(caster, 'bridget_r', 'use', 0, false);
    }

    // Play ultimate sound effect
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/wave_crush_cast.mp3', 0.8); // Placeholder sound
    }

    // Show source VFX for Wave Crush
    showWaveCrushSourceVFX(caster);

    let totalDamageDealt = 0;

    // Target all enemies
    const allEnemies = gameManager.getOpponents(caster).filter(enemy => !enemy.isDead());
    if (allEnemies.length > 0) {
        log(`${caster.name}'s Wave Crush surges towards all enemies!`);
        allEnemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (enemy.isDead()) return;

                const damage = 700; // Fixed damage
                const damageResult = enemy.applyDamage(damage, 'magical', caster, { abilityId: 'bridget_r' });
                totalDamageDealt += damageResult.damage;

                // Track damage statistics
                if (window.trackWaveCrushStats) {
                    window.trackWaveCrushStats(caster, enemy, damageResult, false);
                }

                showWaveCrushImpactVFX(enemy, damageResult.isCritical); // Pass critical status
                log(`${enemy.name} takes ${damageResult.damage} magical damage from Wave Crush${damageResult.isCritical ? ' (Critical Hit!)' : ''}.`);

                // Check if critical hit occurred and dispatch event
                if (damageResult.isCritical) {
                    dispatchBridgetCriticalHit(caster, enemy, damageResult.damage);
                    
                    // Apply Fluid Evasion buff if the talent is active
                    if (caster.fluidEvasionActive) {
                        applyFluidEvasionBuff(caster);
                    }
                }

                if (enemy.isDead()) {
                    log(`${enemy.name} has been obliterated by the Wave Crush!`);
                    if (gameManager) {
                        gameManager.handleCharacterDeath(enemy);
                    }
                }
            }, index * 200); // Stagger impacts slightly
        });
    } else {
        log(`${caster.name}'s Wave Crush finds no enemies to hit.`);
    }

    // Target all allies for healing
    const allAllies = gameManager.getAllies(caster).filter(ally => !ally.isDead());
    if (allAllies.length > 0) {
        log(`${caster.name}'s Wave Crush bestows a powerful healing wave upon all allies!`);
        allAllies.forEach((ally, index) => {
            setTimeout(() => {
                if (ally.isDead()) return;

                const healAmount = 500; // Fixed heal
                const healResult = ally.heal(healAmount, caster, { abilityId: 'bridget_r_heal' }); // Bridget is the source of healing

                // Track healing statistics
                if (window.trackWaveCrushStats) {
                    window.trackWaveCrushStats(caster, ally, healResult, true);
                }

                showWaveCrushHealVFX(ally, healResult.isCritical); // Pass critical status
                log(`${ally.name} is healed for ${healResult.healAmount} HP by the Wave Crush${healResult.isCritical ? ' (Critical Heal!)' : ''}.`);
                
                // Check if the heal was critical and if Bridget has the Aqueous Renewal talent
                if (healResult.isCritical && caster.appliedTalents && caster.appliedTalents.includes('aqueous_renewal')) {
                    // Apply the healing power buff directly
                    applyAqueousRenewalBuff(caster);
                }
                
                // Apply Fluid Evasion buff if the talent is active and heal was critical
                if (healResult.isCritical && caster.fluidEvasionActive) {
                    applyFluidEvasionBuff(caster);
                }
            }, index * 150); // Stagger heals slightly
        });
    }

    // ADD PASSIVE TRIGGER FOR R ABILITY HERE
    // Apply passive healing based on total damage dealt after all effects
    const rAbilityTimeout = Math.max(allEnemies.length * 200, allAllies.length * 150) + 100;
    setTimeout(() => {
        if (totalDamageDealt > 0 && caster.passiveHandler && typeof caster.passiveHandler.applyPassiveHealing === 'function') {
            caster.passiveHandler.applyPassiveHealing(totalDamageDealt);
        }
    }, rAbilityTimeout);

    return {
        success: true,
        targets: [...allEnemies, ...allAllies], // For logging or potential future use
        doesNotRequireTarget: true // This ability doesn't need manual targeting
    };
};

/**
 * Shows source VFX for Wave Crush on Bridget
 */
function showWaveCrushSourceVFX(caster) {
    const casterId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterId}`);
    if (!casterElement) return;

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'bridget-wave-crush-source-vfx';
    casterElement.appendChild(vfxContainer);

    // Central green energy glow
    const energyGlow = document.createElement('div');
    energyGlow.className = 'wave-crush-energy-glow';
    vfxContainer.appendChild(energyGlow);

    // Surrounding swirling water particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'wave-crush-swirl-particle';
        particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
        particle.style.setProperty('--radius', `${30 + Math.random() * 40}px`);
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        vfxContainer.appendChild(particle);
    }

    // Upwards rising water jets
    for (let i = 0; i < 5; i++) {
        const jet = document.createElement('div');
        jet.className = 'wave-crush-water-jet';
        jet.style.transform = `rotate(${(i * 72) - 90}deg) translateX(40px)`;
        jet.style.animationDelay = `${i * 0.1}s`;
        vfxContainer.appendChild(jet);
    }

    setTimeout(() => {
        if (vfxContainer.parentNode === casterElement) {
            casterElement.removeChild(vfxContainer);
        }
    }, 3000); // Duration of the source VFX
}

/**
 * Shows impact VFX for Wave Crush on an enemy
 */
function showWaveCrushImpactVFX(target, isCritical = false) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    if (!targetElement) return;

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'bridget-wave-crush-impact-vfx';
    if (isCritical) {
        vfxContainer.classList.add('critical');
    }
    targetElement.appendChild(vfxContainer);

    // Large green water splash
    const splash = document.createElement('div');
    splash.className = 'wave-crush-main-splash';
    vfxContainer.appendChild(splash);

    // Smaller droplets and particles
    for (let i = 0; i < (isCritical ? 25 : 15); i++) {
        const droplet = document.createElement('div');
        droplet.className = 'wave-crush-impact-droplet';
        droplet.style.setProperty('--angle', `${Math.random() * 360}deg`);
        droplet.style.setProperty('--distance', `${20 + Math.random() * 50}px`);
        droplet.style.animationDelay = `${Math.random() * 0.3}s`;
        vfxContainer.appendChild(droplet);
    }
    
    // Ground shockwave effect
    const shockwave = document.createElement('div');
    shockwave.className = 'wave-crush-shockwave';
    vfxContainer.appendChild(shockwave);


    setTimeout(() => {
        if (vfxContainer.parentNode === targetElement) {
            targetElement.removeChild(vfxContainer);
        }
    }, 2000); // Duration of impact VFX
}

/**
 * Shows healing VFX for Wave Crush on an ally
 */
function showWaveCrushHealVFX(target, isCritical = false) {
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    if (!targetElement) return;

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'bridget-wave-crush-heal-vfx';
     if (isCritical) {
        vfxContainer.classList.add('critical');
    }
    targetElement.appendChild(vfxContainer);

    // Gentle green water aura
    const aura = document.createElement('div');
    aura.className = 'wave-crush-heal-aura';
    vfxContainer.appendChild(aura);

    // Rising green bubbles
    for (let i = 0; i < (isCritical ? 12 : 8); i++) {
        const bubble = document.createElement('div');
        bubble.className = 'wave-crush-heal-bubble';
        bubble.style.left = `${20 + Math.random() * 60}%`;
        bubble.style.animationDelay = `${Math.random() * 0.5}s`;
        bubble.style.width = `${6 + Math.random() * (isCritical ? 10 : 6)}px`;
        bubble.style.height = bubble.style.width;
        vfxContainer.appendChild(bubble);
    }
    
    // Healing text
    // const healText = document.createElement('div');
    // healText.className = 'wave-crush-heal-text'; // Reuse existing styles or make new
    // healText.textContent = `+500`; // Fixed heal amount
    // vfxContainer.appendChild(healText);


    setTimeout(() => {
        if (vfxContainer.parentNode === targetElement) {
            targetElement.removeChild(vfxContainer);
        }
    }, 2000); // Duration of heal VFX
}

/**
 * Shows VFX for Bridget's Aqueous Renewal talent activation.
 * @param {Character} character - Bridget, the character activating the talent.
 * @param {number} buffValue - The percentage value of the healing power buff (e.g., 0.05 for 5%).
 */
function showAqueousRenewalVFX(character, buffValue) {
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Create visual effect container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'aqueous-renewal-container';
    charElement.appendChild(vfxContainer);
    
    // Create buff text
    const buffText = document.createElement('div');
    buffText.className = 'aqueous-renewal-text';
    const buffPercentage = Math.round(buffValue * 100);
    buffText.textContent = `+${buffPercentage}% Heal Power!`;
    vfxContainer.appendChild(buffText);

    // Create water particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'aqueous-renewal-particle';
        particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
        particle.style.setProperty('--distance', `${30 + Math.random() * 40}px`);
        particle.style.animationDelay = `${Math.random() * 0.3}s`;
        vfxContainer.appendChild(particle);
    }

    // Play a sound effect if gameManager is available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/talent_buff_activate.mp3', 0.6);
    }

    // Add log entry
    if (gameManager && typeof gameManager.addLogEntry === 'function') {
        gameManager.addLogEntry(
            `${character.name}'s Aqueous Renewal activated! Healing Power permanently increased by ${buffPercentage}%.`,
            'talent-effect positive'
        );
    }

    // Remove VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode === charElement) {
            charElement.removeChild(vfxContainer);
        }
    }, 2000);
}

/**
 * Updates the description of Bubble Beam Barrage based on talent modifications
 * This function handles both Focused Barrage and Enhanced Barrage talents
 */
function updateBubbleBeamDescription(ability) {
    if (!ability) {
        console.error('[updateBubbleBeamDescription] No ability provided!');
        return;
    }
    
    // Try to get the character reference from the ability
    let caster = ability.character;
    
    // If caster isn't available directly from the ability, try to find the Bridget character from gameManager
    if (!caster) {
        console.log('[updateBubbleBeamDescription] Caster not available directly, trying to find Bridget from gameManager');
        const currentGameManager = getGameManager(); // Use the helper
        if (currentGameManager && currentGameManager.gameState) {
            // Try to find Bridget in player characters
            caster = currentGameManager.gameState.playerCharacters.find(c => c.id === 'bridget');
            
            if (caster) {
                console.log('[updateBubbleBeamDescription] Found Bridget character from gameManager');
                // Assign the character to the ability for future reference
                ability.character = caster;
            }
        }
    }
    
    // If we still don't have a caster reference, use default values
    if (!caster) {
        console.warn('[updateBubbleBeamDescription] Caster not available, using default values for description.');
        
        // Ensure damageScaling property exists
        if (ability.damageScaling === undefined) {
            ability.damageScaling = 1.25; // Set default 125% scaling
        }
        
        // Use isEnhanced flag if it exists, otherwise false
        const isEnhanced = ability.isEnhanced || false;
        const bubbleRange = isEnhanced ? "5-8" : "3-7";
        const cooldown = ability.cooldown || 5;
        const damageScaling = ability.damageScaling;
        
        ability.description = `Fires ${bubbleRange} bubble beams at random enemies, each dealing ${(damageScaling * 100).toFixed(0)}% Magical Damage. Cooldown: ${cooldown} turns.`;
        return ability.description;
    }
    
    console.log(`[Bubble Beam Description] Updating description for ${caster.name}'s ${ability.name}`);
    console.log(`[Debug] Current ability properties - damageScaling: ${ability.damageScaling}, cooldown: ${ability.cooldown}`);
    console.log(`[Debug] Character talents - enhancedBubbleBarrage: ${caster.enhancedBubbleBarrage}, appliedTalents: ${caster.appliedTalents}`);
    
    // --- Get current talent-modified properties ---
    // Read directly from the ability instance for properties modified by talents
    const damageScaling = ability.damageScaling !== undefined ? ability.damageScaling : 1.25; // Default 125%
    const cooldown = ability.cooldown !== undefined ? ability.cooldown : 5; // Default 5 turns
    
    // Read from the character instance for properties modified by talents
    const isEnhanced = caster.enhancedBubbleBarrage === true;
    const bubbleRange = isEnhanced ? "5-8" : "3-7"; // Enhanced Barrage talent check
    
    // --- Calculate estimated damage ---
    const magicalDamage = caster.stats.magicalDamage || 0;
    const estimatedDamage = Math.floor(magicalDamage * damageScaling);
    
    // --- Build base description ---
    let baseDesc = `Fires ${bubbleRange} bubble beams at random enemies, each dealing ${estimatedDamage} magical damage (${(damageScaling * 100).toFixed(0)}% MD). Cooldown: ${cooldown} turns.`;
    baseDesc += ` The passive healing effect from Aqua Life Essence applies to the total damage dealt.`;

    // --- Add talent notes section ---
    let talentEffectsHtml = '';
    
    // Detect active talents based on ability properties or character's appliedTalents array
    const focusedBarrageActive = cooldown !== 5 || damageScaling !== 1.25;
    const enhancedBarrageActive = isEnhanced;
    const hasFocusedBarrage = caster.appliedTalents && caster.appliedTalents.includes('focused_barrage');
    const hasEnhancedBarrage = caster.appliedTalents && caster.appliedTalents.includes('enhanced_barrage');

    // Check if any talents are active before building talent section
    if (focusedBarrageActive || enhancedBarrageActive || hasFocusedBarrage || hasEnhancedBarrage) {
        talentEffectsHtml += `\n<span class="talent-effect utility">`;
        let talentNotes = [];

        // Add Focused Barrage talent note
        if (focusedBarrageActive || hasFocusedBarrage) {
            talentNotes.push(`Focused Barrage: Only 85% scale but 2 turns cooldown`);
        }
        
        // Add Enhanced Barrage talent note
        if (enhancedBarrageActive || hasEnhancedBarrage) {
            talentNotes.push(`Enhanced Barrage: Fires 5-8 bubbles now`);
        }
        
        talentEffectsHtml += talentNotes.join('. ');
        talentEffectsHtml += `</span>`;
    }
    
    // Combine base description and talent effects
    const finalDescription = baseDesc + talentEffectsHtml;

    // Update the ability's description property
    ability.description = finalDescription;
    console.log(`[Bubble Beam Description] Updated description: ${finalDescription}`);
    
    // Return the updated description
    return finalDescription;
}

/**
 * Updates the description of Arcane Bubble Shield based on talent modifications
 */
function updateArcaneShieldDescription(ability) {
    if (!ability) {
        console.error('[updateArcaneShieldDescription] No ability provided!');
        return;
    }
    
    // Try to get the character reference from the ability
    let caster = ability.character;
    
    // If caster isn't available directly from the ability, try to find the Bridget character from gameManager
    if (!caster) {
        console.log('[updateArcaneShieldDescription] Caster not available directly, trying to find Bridget from gameManager');
        const currentGameManager = getGameManager(); // Use the helper
        if (currentGameManager && currentGameManager.gameState) {
            // Try to find Bridget in player characters
            caster = currentGameManager.gameState.playerCharacters.find(c => c.id === 'bridget');
            
            if (caster) {
                console.log('[updateArcaneShieldDescription] Found Bridget character from gameManager');
                // Assign the character to the ability for future reference
                ability.character = caster;
            }
        }
    }
    
    // If we still don't have a caster reference, use default values
    if (!caster) {
        console.warn('[updateArcaneShieldDescription] Caster not available, using default values for description.');
        return ability.description;
    }
    
    console.log(`[Arcane Shield Description] Updating description for ${caster.name}'s ${ability.name}`);
    
    // Get current ability properties
    const cooldown = ability.cooldown !== undefined ? ability.cooldown : 10; // Default 10 turns
    
    // Determine bubble count based on Enhanced Bubble Shield talent
    let bubbleCount = 3;
    if (caster.enhancedBubbleShieldActive) {
        bubbleCount = 6;
    }
    
    // Base description
    let baseDesc = `Creates a water shield that increases magic shield by 12% for 3 turns and summons ${bubbleCount} magical bubbles that automatically target allies or enemies at the end of each turn. Cooldown: ${cooldown} turns.`;
    
    // Add talent notes section
    let talentEffectsHtml = '';
    
    // Check for Enhanced Bubble Shield talent
    if (caster.enhancedBubbleShieldActive) {
        talentEffectsHtml += `\n<span class="talent-effect utility">Enhanced Bubble Shield: Creates twice as many bubbles (6 instead of 3).</span>`;
    }
    
    // Check for Critical Cooldown talent
    if (caster.critReducesCooldowns === true) {
        talentEffectsHtml += `\n<span class="talent-effect utility">Critical Cooldown: Critical hits and heals reduce cooldowns by 1 turn.</span>`;
    }
    
    // Combine base description and talent effects
    const finalDescription = baseDesc + talentEffectsHtml;
    
    // Update the ability's description property
    ability.description = finalDescription;
    console.log(`[Arcane Shield Description] Updated description: ${finalDescription}`);
    
    return finalDescription;
}

/**
 * Updates the description of Wave Crush based on talent modifications
 */
function updateWaveCrushDescription(ability) {
    if (!ability) {
        console.error('[updateWaveCrushDescription] No ability provided!');
        return;
    }
    
    // Try to get the character reference from the ability
    let caster = ability.character;
    
    // If caster isn't available directly from the ability, try to find the Bridget character from gameManager
    if (!caster) {
        console.log('[updateWaveCrushDescription] Caster not available directly, trying to find Bridget from gameManager');
        const currentGameManager = getGameManager(); // Use the helper
        if (currentGameManager && currentGameManager.gameState) {
            // Try to find Bridget in player characters
            caster = currentGameManager.gameState.playerCharacters.find(c => c.id === 'bridget');
            
            if (caster) {
                console.log('[updateWaveCrushDescription] Found Bridget character from gameManager');
                // Assign the character to the ability for future reference
                ability.character = caster;
            }
        }
    }
    
    // If we still don't have a caster reference, use default values
    if (!caster) {
        console.warn('[updateWaveCrushDescription] Caster not available, using default values for description.');
        return ability.description;
    }
    
    console.log(`[Wave Crush Description] Updating description for ${caster.name}'s ${ability.name}`);
    
    // Get current ability properties
    const cooldown = ability.cooldown !== undefined ? ability.cooldown : 18; // Default 18 turns
    const manaCost = ability.manaCost !== undefined ? ability.manaCost : 255; // Default 255 mana
    
    // Base description
    let baseDesc = `Unleash a devastating wave, dealing 700 magical damage to all enemies and healing all allies for 500 HP. Triggers Aqua Life Essence based on damage dealt. Cooldown: ${cooldown} turns.`;
    
    // Add talent notes section
    let talentEffectsHtml = '';
    
    // Check for Improved Wave Crush talent
    if (caster.appliedTalents && caster.appliedTalents.includes('improved_wave_crush')) {
        talentEffectsHtml += `\n<span class="talent-effect utility">Improved Wave Crush: Cooldown reduced to 10 turns and mana cost reduced to 100.</span>`;
    }
    
    // Check for Critical Cooldown talent
    if (caster.critReducesCooldowns === true) {
        talentEffectsHtml += `\n<span class="talent-effect utility">Critical Cooldown: Critical hits and heals reduce cooldowns by 1 turn.</span>`;
    }
    
    // Combine base description and talent effects
    const finalDescription = baseDesc + talentEffectsHtml;
    
    // Update the ability's description property
    ability.description = finalDescription;
    console.log(`[Wave Crush Description] Updated description: ${finalDescription}`);
    
    return finalDescription;
}

/**
 * Updates Bridget's passive description based on talent modifications
 */
function updatePassiveDescription(passive, character) {
    if (!passive) {
        console.error('[updatePassiveDescription] Missing passive reference');
        return;
    }
    
    // If character isn't provided, try to find Bridget from gameManager
    if (!character) {
        console.log('[updatePassiveDescription] Character not provided directly, trying to find Bridget from gameManager');
        const currentGameManager = getGameManager(); // Use the helper
        if (currentGameManager && currentGameManager.gameState) {
            // Try to find Bridget in player characters
            character = currentGameManager.gameState.playerCharacters.find(c => c.id === 'bridget');
            
            if (character) {
                console.log('[updatePassiveDescription] Found Bridget character from gameManager');
            }
        }
        
        if (!character) {
            console.error('[updatePassiveDescription] Failed to find Bridget character');
            return;
        }
    }
    
    console.log(`[Passive Description] Updating description for ${character.name}'s passive`);
    
    // Check for Oceanic Harmony talent
    const hasOceanicHarmony = character.oceanicHarmonyActive === true;
    const hasClampProtection = character.clamProtectionAuraActive === true;
    
    // Base passive description
    let description;
    if (hasOceanicHarmony) {
        description = `42% of damage you deal heals you and two random allies (prioritizing lowest HP) for the same amount.`;
    } else {
        description = `42% of damage you deal heals a random ally and yourself for the same amount.`;
    }
    
    // Add talent notes section for Oceanic Harmony
    if (hasOceanicHarmony) {
        description += `\n<span class="talent-effect healing">Oceanic Harmony: TWO random allies instead of 1</span>`;
    }
    
    // Add talent notes section for Clam Protection
    if (hasClampProtection) {
        description += `\n<span class="talent-effect utility">Clam Protection Aura: Healed allies receive a buff that increases armor by 5 for 3 turns.</span>`;
    }
    
    // Check for Fluid Evasion talent
    if (character.fluidEvasionActive === true) {
        description += `\n<span class="talent-effect utility">💧 Fluid Evasion: Critical hits grant 21% dodge chance for 2 turns. This effect can stack multiple times.</span>`;
    }
    
    // Check for Critical Cooldown talent
    if (character.critReducesCooldowns === true) {
        description += `\n<span class="talent-effect utility">Critical Cooldown: Critical hits and heals reduce cooldowns by 1 turn.</span>`;
    }
    
    // Update the passive's description property
    passive.description = description;
    console.log(`[Passive Description] Updated description: ${description}`);
    
    return description;
}

/**
 * Sets up Bridget's ability description updaters
 */
function setupBridgetDescriptionUpdater() {
    // Listen for talent application events
    document.addEventListener('talent_applied', (event) => {
        const character = event.detail?.character;
        const talentId = event.detail?.talent?.id;
        
        // Only process for Bridget
        if (!character || character.id !== 'bridget') return;
        
        console.log(`[Bridget] Talent applied: ${talentId}`);
        
        // Check if it's our new bubble healing talent
        if (talentId === 'bubble_healing') {
            console.log(`[Bridget] Bubble Healing talent applied - bubbles can now heal allies`);
            character.bubbleHealingActive = true;
        }
        
        // Check if it's our enhanced bubble shield talent
        if (talentId === 'enhanced_bubble_shield') {
            console.log(`[Bridget] Enhanced Bubble Shield talent applied - bubble shield now creates twice as many bubbles`);
            character.enhancedBubbleShieldActive = true;
        }
        
        // Check if it's our improved wave crush talent
        if (talentId === 'improved_wave_crush') {
            console.log(`[Bridget] Improved Wave Crush talent applied - reduced cooldown and mana cost`);
            
            // Find the Wave Crush ability and update its cooldown and mana cost
            const waveCrushAbility = character.abilities.find(ability => ability.id === 'bridget_r');
            if (waveCrushAbility) {
                waveCrushAbility.cooldown = 10;
                waveCrushAbility.manaCost = 100;
                console.log(`[Bridget] Updated Wave Crush - cooldown: ${waveCrushAbility.cooldown}, manaCost: ${waveCrushAbility.manaCost}`);
            }
        }
        
        // Update all ability descriptions
        character.abilities.forEach(ability => {
            if (ability.id === 'bridget_q') {
                if (typeof updateRibbonWaveRushDescription === 'function') {
                    updateRibbonWaveRushDescription(ability);
                } else if (typeof ability.generateDescription === 'function') {
                    ability.description = ability.generateDescription();
                }
            } else if (ability.id === 'bridget_w') {
                updateBubbleBeamDescription(ability);
            } else if (ability.id === 'bridget_e') {
                updateArcaneShieldDescription(ability);
            } else if (ability.id === 'bridget_r') {
                updateWaveCrushDescription(ability);
            }
        });
        
        // Update passive description if it exists
        if (character.passive && character.passive.id === 'bridget_passive') {
            updatePassiveDescription(character.passive, character);
        }
        
        // Update UI
        if (gameManager && gameManager.uiManager) {
            gameManager.uiManager.updateCharacterUI(character);
        } else if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
    });

    // Listen for special Bridget talents applied event (from talent-manager.js)
    document.addEventListener('bridget_talents_applied', (event) => {
        const detail = event.detail;
        if (!detail || !detail.character) return;
        
        console.log(`[Bridget] Received bridget_talents_applied event`);
        
        // Force update all ability descriptions
        detail.character.abilities.forEach(ability => {
            if (ability.id === 'bridget_q') {
                if (typeof updateRibbonWaveRushDescription === 'function') {
                    updateRibbonWaveRushDescription(ability);
                } else if (typeof ability.generateDescription === 'function') {
                    ability.description = ability.generateDescription();
                }
            } else if (ability.id === 'bridget_w') {
                updateBubbleBeamDescription(ability);
            } else if (ability.id === 'bridget_e') {
                updateArcaneShieldDescription(ability);
            } else if (ability.id === 'bridget_r') {
                updateWaveCrushDescription(ability);
            }
        });
        
        // Update passive description
        if (detail.character.passive && detail.character.passive.id === 'bridget_passive') {
            updatePassiveDescription(detail.character.passive, detail.character);
        }
        
        // Update UI
        if (gameManager && gameManager.uiManager) {
            gameManager.uiManager.updateCharacterUI(detail.character);
        } else if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(detail.character);
        }
    });
}

// Call the setup function to register the event listener
setupBridgetDescriptionUpdater();

// Dispatch an event to trigger the updater for any existing Bridget characters
document.dispatchEvent(new CustomEvent('updateBridgetDescriptions', {
    detail: { updated: true }
}));

// Register the abilities with AbilityFactory
if (window.AbilityFactory) {
    window.AbilityFactory.registerAbilityEffect('bridgetRibbonWaveRushEffect', bridgetRibbonWaveRushEffect);
    window.AbilityFactory.registerAbilityEffect('bridgetBubbleBeamBarrageEffect', bridgetBubbleBeamBarrageEffect);
    window.AbilityFactory.registerAbilityEffect('bridgetArcaneBubbleShieldEffect', bridgetArcaneBubbleShieldEffect);
    window.AbilityFactory.registerAbilityEffect('bridgetWaveCrushEffect', bridgetWaveCrushEffect); // Register new R ability effect
    
    // Register Q ability with correct target type
    const ribbonWaveRushAbility = new Ability(
        'bridget_q',
        'Ribbon Wave Rush',
        'Icons/abilities/water_cascade.webp',
        30, // mana cost
        2,  // cooldown
        bridgetRibbonWaveRushEffect
    );
    
    // Set the target type to 'all_enemies' which is more reliable than 'aoe_enemy'
    ribbonWaveRushAbility.setTargetType('all_enemies');
    ribbonWaveRushAbility.setDescription('Summons a waterfall that hits two random enemies for {baseDamage} + 85% Magical damage.');
    ribbonWaveRushAbility.baseDamage = 365;
    
    // Add generateDescription method to update description based on talents
    ribbonWaveRushAbility.generateDescription = function() {
        const caster = this.character;
        
        // Default target description
        let targetDescription = "two random enemies";
        
        // Check for Chain Wave talent
        if (caster && caster.chainWaveActive === true) {
            targetDescription = "three random enemies";
        }
        
        let description = `Summons a waterfall that hits ${targetDescription} for`;
        
        // Check if baseDamage was modified by Surging Tides talent
        const baseDamage = this.baseDamage || 365;
        description += ` ${baseDamage} + 85% Magical damage.`;
        
        // Add talent effects
        let talentEffectsHtml = '';
        
        // Check for Surging Tides talent
        if (baseDamage === 600) {
            talentEffectsHtml += `\n<span class="talent-effect damage">Surging Tides: Increased base damage to 600.</span>`;
        }
        
        // Check for Abyssal Mark talent
        if (caster && caster.abyssalMarkActive) {
            talentEffectsHtml += `\n<span class="talent-effect damage">🔱 Abyssal Mark: Marks enemies, causing them to take 50% increased damage from Bridget for 2 turns.</span>`;
        }
        
        // Check for Chain Wave talent
        if (caster && caster.chainWaveActive) {
            talentEffectsHtml += `\n<span class="talent-effect damage">⚡ Chain Wave: Hits one additional enemy for a total of three targets.</span>`;
        }
        
        return description + talentEffectsHtml;
    };
    
    // Add extra properties to ensure proper target handling
    ribbonWaveRushAbility.requiresTarget = false; // This ability doesn't require manual targeting
    ribbonWaveRushAbility.doesNotRequireTarget = true; // Explicitly indicate doesn't need targeting
    
    // Register the ability in the AbilityFactory registry
    window.AbilityFactory.abilityRegistry['bridget_q'] = ribbonWaveRushAbility;
    console.log('Registered complete Ribbon Wave Rush ability with proper target type');
    
    // Register W ability
    const bubbleBeamBarrageAbility = new Ability(
        'bridget_w',
        'Bubble Beam Barrage',
        'Icons/abilities/bubble_beam.webp',
        100, // mana cost
        5,   // cooldown
        bridgetBubbleBeamBarrageEffect
    );
    
    // Set the target type to 'all_enemies'
    bubbleBeamBarrageAbility.setTargetType('all_enemies');
    bubbleBeamBarrageAbility.baseDescription = 'Shoots between 3-7 bubble beams onto random enemies each dealing {damageScaling}% Magical Damage.';
    bubbleBeamBarrageAbility.setDescription(bubbleBeamBarrageAbility.baseDescription);
    bubbleBeamBarrageAbility.damageScaling = 1.25; // 125%
    
    // Add generateDescription method using the updateBubbleBeamDescription function
    bubbleBeamBarrageAbility.generateDescription = function() {
        return updateBubbleBeamDescription(this);
    };
    
    // Add extra properties to ensure proper target handling
    bubbleBeamBarrageAbility.requiresTarget = false; // This ability doesn't require manual targeting
    bubbleBeamBarrageAbility.doesNotRequireTarget = true; // Explicitly indicate doesn't need targeting
    
    // Register the ability in the AbilityFactory registry
    window.AbilityFactory.abilityRegistry['bridget_w'] = bubbleBeamBarrageAbility;
    console.log('Registered complete Bubble Beam Barrage ability with proper target type');
    
    // Register E ability
    const arcaneBubbleShieldAbility = new Ability(
        'bridget_e',
        'Arcane Bubble Shield',
        'Icons/abilities/bubble_shield.webp',
        200, // mana cost
        10,  // cooldown
        bridgetArcaneBubbleShieldEffect
    );
    
    // Set the target type to 'self' since it only affects Bridget
    arcaneBubbleShieldAbility.setTargetType('self');
    arcaneBubbleShieldAbility.setDescription('Creates a water shield that increases magic shield by 12% for 3 turns and summons 3 magical bubbles that automatically target allies or enemies at the end of each turn.');
    
    // Add generateDescription method for E
    arcaneBubbleShieldAbility.generateDescription = function() {
        let description = 'Creates a water shield that increases magic shield by 12% for 3 turns and summons 3 magical bubbles that automatically target allies or enemies at the end of each turn.';
        
        // Check for Oceanic Harmony talent
        const caster = this.character;
        if (caster && caster.oceanicHarmonyActive) {
            description += `\n<span class="talent-effect healing">Oceanic Harmony: Flowing Essence now heals Bridget and two random allies (prioritizing lowest HP) each time she uses an ability.</span>`;
        }
        
        return description;
    };
    
    // Register the ability in the AbilityFactory registry
    window.AbilityFactory.abilityRegistry['bridget_e'] = arcaneBubbleShieldAbility;
    console.log('Registered Arcane Bubble Shield ability');

    // Register R ability (Wave Crush)
    const waveCrushAbility = new Ability(
        'bridget_r',
        'Wave Crush',
        'Icons/abilities/wave_crush.webp', // Ensure this icon exists or use a placeholder
        255, // mana cost
        18,  // cooldown
        bridgetWaveCrushEffect
    );
    waveCrushAbility.setTargetType('all'); // Does not require a specific target, affects all enemies and allies
    waveCrushAbility.setDescription('Unleash a devastating wave, dealing 700 magical damage to all enemies and healing all allies for 500 HP. Triggers Aqua Life Essence based on damage dealt.');
    
    // Add generateDescription method for R
    waveCrushAbility.generateDescription = function() {
        // R ability doesn't have talent modifications directly, but we still implement
        // the method for consistency and future talent additions
        return 'Unleash a devastating wave, dealing 700 magical damage to all enemies and healing all allies for 500 HP. Triggers Aqua Life Essence based on damage dealt.';
    };
    
    waveCrushAbility.requiresTarget = false;
    waveCrushAbility.doesNotRequireTarget = true;
    window.AbilityFactory.abilityRegistry['bridget_r'] = waveCrushAbility;
    console.log('Registered Wave Crush ability');
}

// Passive registration check
if (window.PassiveFactory) {
    // The passive is already registered in bridget_passive.js
    console.log('Bridge passive should be registered in bridget_passive.js');
} else {
    // Passive should be exposed globally in bridget_passive.js
    console.log('PassiveFactory not found, Bridge passive should be exposed globally');
}

// Helper function to dispatch critical hit event for Bridget
function dispatchBridgetCriticalHit(caster, target, damage) {
    // Only dispatch event if this is Bridget
    if (caster.id !== 'bridget') {
        return;
    }
    
    // Critical Cooldown talent check
    if (caster.critReducesCooldowns) {
        // Create and dispatch the critical hit event
        const critHitEvent = new CustomEvent('CriticalHit', {
            detail: {
                source: caster,
                target: target,
                damage: damage,
                timestamp: Date.now()
            }
        });
        
        console.log(`[Bridget Ability] Dispatching critical hit event for ${caster.name}`);
        document.dispatchEvent(critHitEvent);
    }
    
    // Fluid Evasion talent check
    if (caster.fluidEvasionActive) {
        console.log(`[Fluid Evasion] Critical hit detected, applying dodge buff to ${caster.name}`);
        applyFluidEvasionBuff(caster);
    }
}

// Replace the DOMContentLoaded event at the end of the file with this improved initialization system:

// Create a deferrred initialization system for Bridget's ability descriptions
(function setupDeferredDescriptionUpdates() {
    // Keep track of initialization state
    const state = {
        initialized: false,
        pendingUpdates: [],
        retryCount: 0,
        maxRetries: 10
    };
    
    // Function to actually perform all updates when character is available
    function attemptDescriptionUpdates() {
        // Check if we can find the Bridget character
        const bridgetCharacter = 
            (gameManager?.gameState?.playerCharacters || []).find(c => c.id === 'bridget') ||
            (gameManager?.stageManager?.gameState?.playerCharacters || []).find(c => c.id === 'bridget');
        
        if (bridgetCharacter) {
            console.log('[Bridget Initialization] Found Bridget character in game state, updating all descriptions');
            
            // Update all ability descriptions
            bridgetCharacter.abilities.forEach(ability => {
                if (ability.id === 'bridget_q' && typeof ability.generateDescription === 'function') {
                    ability.description = ability.generateDescription();
                    console.log(`[Bridget Initialization] Updated Q description`);
                } else if (ability.id === 'bridget_w') {
                    // Set character reference directly to ensure it's available
                    ability.character = bridgetCharacter;
                    updateBubbleBeamDescription(ability);
                    console.log(`[Bridget Initialization] Updated W description`);
                } else if (ability.id === 'bridget_e') {
                    // Set character reference directly to ensure it's available
                    ability.character = bridgetCharacter;
                    updateArcaneShieldDescription(ability);
                    console.log(`[Bridget Initialization] Updated E description`);
                } else if (ability.id === 'bridget_r') {
                    // Set character reference directly to ensure it's available
                    ability.character = bridgetCharacter;
                    updateWaveCrushDescription(ability);
                    console.log(`[Bridget Initialization] Updated R description`);
                }
            });
            
            // Update passive description
            if (bridgetCharacter.passive && bridgetCharacter.passive.id === 'bridget_passive') {
                updatePassiveDescription(bridgetCharacter.passive, bridgetCharacter);
                console.log(`[Bridget Initialization] Updated passive description`);
            }
            
            // Mark as initialized
            state.initialized = true;
            
            // Process any pending updates
            while (state.pendingUpdates.length > 0) {
                const update = state.pendingUpdates.shift();
                if (typeof update === 'function') {
                    update(bridgetCharacter);
                }
            }
        }
    }
    
    // Set up event listeners for different game states
    document.addEventListener('gameReady', () => {
        console.log('[Bridget Initialization] Game ready event detected, attempting initialization');
        setTimeout(attemptDescriptionUpdates, 500);
    });
    
    document.addEventListener('characterInitialized', (event) => {
        if (event.detail?.character?.id === 'bridget') {
            console.log('[Bridget Initialization] Bridget character initialization detected');
            // Set timeout to ensure character is fully registered in game state
            setTimeout(attemptDescriptionUpdates, 300);
        }
    });
    
    document.addEventListener('stageLoaded', () => {
        console.log('[Bridget Initialization] Stage loaded event detected, attempting initialization');
        setTimeout(attemptDescriptionUpdates, 300);
    });
    
    // Also try on DOM content loaded with a longer delay
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Bridget Initialization] DOM loaded, scheduling delayed initialization');
        setTimeout(attemptDescriptionUpdates, 2000);
    });
    
    // Export the initialization function for manual triggering
    window.initializeBridgetDescriptions = function() {
        return attemptDescriptionUpdates();
    };
    
    // Replace the current updateBridgetDescriptions function with a better version
    window.updateBridgetDescriptions = function() {
        // If already initialized, update directly
        if (state.initialized) {
            const bridgetCharacter = 
                (gameManager?.gameState?.playerCharacters || []).find(c => c.id === 'bridget') ||
                (gameManager?.stageManager?.gameState?.playerCharacters || []).find(c => c.id === 'bridget');
            
            if (bridgetCharacter) {
                console.log('[Manual Update] Updating Bridget descriptions directly');
                
                // Update all abilities
                bridgetCharacter.abilities.forEach(ability => {
                    if (ability.id === 'bridget_q' && typeof ability.generateDescription === 'function') {
                        ability.description = ability.generateDescription();
                    } else if (ability.id === 'bridget_w') {
                        updateBubbleBeamDescription(ability);
                    } else if (ability.id === 'bridget_e') {
                        updateArcaneShieldDescription(ability);
                    } else if (ability.id === 'bridget_r') {
                        updateWaveCrushDescription(ability);
                    }
                });
                
                // Update passive
                if (bridgetCharacter.passive && bridgetCharacter.passive.id === 'bridget_passive') {
                    updatePassiveDescription(bridgetCharacter.passive, bridgetCharacter);
                }
                
                return 'Bridget descriptions updated successfully';
            } else {
                return 'Failed to find Bridget character';
            }
        } else {
            // Queue the update for when initialization completes
            console.log('[Manual Update] Queuing update for after initialization');
            state.pendingUpdates.push((character) => {
                console.log('[Manual Update] Processing deferred update');
                // Update all abilities
                character.abilities.forEach(ability => {
                    if (ability.id === 'bridget_q' && typeof ability.generateDescription === 'function') {
                        ability.description = ability.generateDescription();
                    } else if (ability.id === 'bridget_w') {
                        updateBubbleBeamDescription(ability);
                    } else if (ability.id === 'bridget_e') {
                        updateArcaneShieldDescription(ability);
                    } else if (ability.id === 'bridget_r') {
                        updateWaveCrushDescription(ability);
                    }
                });
                
                // Update passive
                if (character.passive && character.passive.id === 'bridget_passive') {
                    updatePassiveDescription(character.passive, character);
                }
            });
            return 'Update queued for after initialization completes';
        }
    };
})();

// Add this code right before the setupDeferredDescriptionUpdates function:

// Hook into CharacterFactory to ensure Bridget's descriptions are updated during creation
(function addCharacterFactoryHook() {
    // Wait for CharacterFactory to be available
    const checkInterval = setInterval(() => {
        if (window.CharacterFactory) {
            clearInterval(checkInterval);
            
            // Store the original createCharacter method
            const originalCreateCharacter = window.CharacterFactory.createCharacter;
            
            // Override the createCharacter method
            window.CharacterFactory.createCharacter = async function(charData, selectedTalentIds = []) {
                // Call the original method
                const character = await originalCreateCharacter.call(this, charData, selectedTalentIds);
                
                // Check if this is Bridget and has talents
                if (character && character.id === 'bridget' && selectedTalentIds.length > 0) {
                    console.log(`[CharFactory Hook] Bridget created with ${selectedTalentIds.length} talents, ensuring descriptions are updated`);
                    
                    // Directly assign character to abilities
                    character.abilities.forEach(ability => {
                        ability.character = character;
                        
                        // Update descriptions based on ability type
                        if (ability.id === 'bridget_q') {
                            if (typeof updateRibbonWaveRushDescription === 'function') {
                                updateRibbonWaveRushDescription(ability);
                                console.log(`[CharFactory Hook] Updated Q description using updateRibbonWaveRushDescription`);
                            } else if (typeof ability.generateDescription === 'function') {
                                ability.description = ability.generateDescription();
                                console.log(`[CharFactory Hook] Updated Q description using generateDescription`);
                            }
                        } else if (ability.id === 'bridget_w') {
                            updateBubbleBeamDescription(ability);
                            console.log(`[CharFactory Hook] Updated W description`);
                        } else if (ability.id === 'bridget_e') {
                            updateArcaneShieldDescription(ability);
                            console.log(`[CharFactory Hook] Updated E description`);
                        } else if (ability.id === 'bridget_r') {
                            updateWaveCrushDescription(ability);
                            console.log(`[CharFactory Hook] Updated R description`);
                        }
                    });
                    
                    // Update passive description
                    if (character.passive && character.passive.id === 'bridget_passive') {
                        updatePassiveDescription(character.passive, character);
                        console.log(`[CharFactory Hook] Updated passive description`);
                    }
                }
                
                return character;
            };
            
            console.log('[Bridget] Successfully hooked into CharacterFactory.createCharacter');
        }
    }, 100);
})();

// Create a deferrred initialization system for Bridget's ability descriptions

/**
 * Applies the Clam Protection buff to an ally
 * @param {Character} ally - The ally to receive the protection buff
 * @param {Character} caster - Bridget, who is casting the buff
 */
function applyClamProtectionBuff(ally, caster) {
    if (!ally || ally.isDead()) {
        console.warn('[Clam Protection] Cannot apply Clam Protection: ally is invalid or dead');
        return;
    }
    
    console.log(`[Clam Protection] Applying buff to ${ally.name}`);
    
    // Create a unique ID for each instance of the buff to ensure stacking
    const uniqueId = `bridget_clam_protection_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create the protection buff
    const protectionBuff = new Effect(
        uniqueId,  // Use unique ID instead of fixed ID to allow stacking
        'Clam Protection',
        'Icons/talents/clam_protection.webp',
        3, // Duration: 3 turns
        null, // No per-turn tick effect
        false // Not a debuff
    );
    
    // Define the stat modification - 5 armor increase (not 5% or 0.05)
    protectionBuff.statModifiers = [
        { stat: 'armor', operation: 'add', value: 5 }
    ];
    
    // Set description
    protectionBuff.setDescription('Increases armor by 5 for 3 turns.');
    
    // Mark this as a Clam Protection buff for visual styling
    protectionBuff.buffType = 'bridget_clam_protection';
    
    // Add visual effect when applied and set data attributes for CSS
    protectionBuff.onApply = (character) => {
        showClamProtectionVFX(character);
        
        // Add data attribute to buff icon for styling
        setTimeout(() => {
            try {
                // Allow time for the DOM to update
                const buffIcons = document.querySelectorAll(`#character-${character.instanceId || character.id} .buff-icon[data-buff-id="${protectionBuff.id}"]`);
                buffIcons.forEach(icon => {
                    icon.setAttribute('data-buff-type', 'bridget_clam_protection');
                });
                
                // Count total stacks for UI
                const clamProtectionBuffs = character.buffs ? character.buffs.filter(buff => buff.buffType === 'bridget_clam_protection') : [];
                if (clamProtectionBuffs.length > 1) {
                    // Update all clam protection buff icons with stack count
                    document.querySelectorAll(`#character-${character.instanceId || character.id} .buff-icon[data-buff-id^="bridget_clam_protection"]`)
                        .forEach(icon => {
                            const stackCounter = document.createElement('div');
                            stackCounter.className = 'buff-stack-counter';
                            stackCounter.textContent = clamProtectionBuffs.length;
                            
                            // Remove existing counter if present
                            const existingCounter = icon.querySelector('.buff-stack-counter');
                            if (existingCounter) {
                                icon.removeChild(existingCounter);
                            }
                            
                            icon.appendChild(stackCounter);
                        });
                }
            } catch (error) {
                console.error('[Clam Protection] Error setting buff data attributes:', error);
            }
        }, 50); // Small delay to ensure DOM is updated
    };
    
    // Add buff to ally
    ally.addBuff(protectionBuff);
    
    // Log the application
    if (gameManager) {
        gameManager.addLogEntry(`${caster.name}'s Clam Protection Aura provides ${ally.name} with +5 armor for 3 turns.`, 'talent-effect');
    }
    
    // Count total stacks for logging
    const clamProtectionBuffs = ally.buffs ? ally.buffs.filter(buff => buff.buffType === 'bridget_clam_protection') : [];
    if (clamProtectionBuffs.length > 1) {
        console.log(`[Clam Protection] ${ally.name} now has ${clamProtectionBuffs.length} stacks of Clam Protection.`);
        if (gameManager) {
            gameManager.addLogEntry(`${ally.name} now has ${clamProtectionBuffs.length} stacks of Clam Protection, for a total of +${clamProtectionBuffs.length * 5} armor!`, 'talent-effect');
        }
    }
}

/**
 * Shows the VFX for Clam Protection buff application
 * @param {Character} character - The character receiving the buff
 */
function showClamProtectionVFX(character) {
    if (!character) return;
    
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'clam-protection-vfx';
    charElement.appendChild(vfxContainer);
    
    // Create shell icon
    const shellElement = document.createElement('div');
    shellElement.className = 'clam-shell-icon';
    vfxContainer.appendChild(shellElement);
    
    // Create protection text
    const protectionText = document.createElement('div');
    protectionText.className = 'clam-protection-text';
    protectionText.textContent = '+5 ARMOR';
    vfxContainer.appendChild(protectionText);
    
    // Create protective shimmer particles
    for (let i = 0; i < 10; i++) {
        const shimmer = document.createElement('div');
        shimmer.className = 'clam-protection-shimmer';
        shimmer.style.left = `${Math.random() * 100}%`;
        shimmer.style.top = `${Math.random() * 100}%`;
        shimmer.style.animationDelay = `${Math.random() * 0.5}s`;
        
        // Add random movement direction using CSS variables
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 40;
        shimmer.style.setProperty('--moveX', `${Math.cos(angle) * distance}px`);
        shimmer.style.setProperty('--moveY', `${Math.sin(angle) * distance}px`);
        
        vfxContainer.appendChild(shimmer);
    }
    
    // Play sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/buff_applied.mp3', 0.6);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode === charElement) {
            charElement.removeChild(vfxContainer);
        }
    }, 2000);
}

/**
 * Applies the Abyssal Mark debuff to a target
 * Marked enemies take 50% increased damage from Bridget for 2 turns
 */
function applyAbyssalMarkDebuff(caster, target) {
    if (!target || target.isDead()) return;
    
    console.log(`[Abyssal Mark] Applying mark debuff to ${target.name}`);
    
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Create a unique ID for the debuff
    const debuffId = `abyssal_mark_${Date.now()}`;
    
    // Create the mark debuff
    const markDebuff = new Effect(
        debuffId,
        'Abyssal Mark',
        'Icons/talents/tidal_mark.webp',
        2, // Duration: 2 turns
        null, // No per-turn tick effect
        true  // Is a debuff
    );
    
    // Set the caster reference for increased damage calculation
    markDebuff.caster = caster;
    
    // Set the description
    markDebuff.setDescription(`Takes 50% increased damage from ${caster.name}.`);
    
    // Add custom property to identify this as an Abyssal Mark
    markDebuff.isAbyssalMark = true;
    
    // When the debuff is applied, show VFX
    markDebuff.onApply = (character) => {
        showAbyssalMarkVFX(character);
    };
    
    // Add the debuff to the target
    target.addDebuff(markDebuff);
    
    // Log the application
    log(`${caster.name}'s Abyssal Mark afflicts ${target.name}, increasing damage taken by 50% for 2 turns.`, 'talent-effect');
    
    // Modify the target's applyDamage function to handle the mark
    // Store the original applyDamage function if not already stored
    if (!target._originalApplyDamage) {
        target._originalApplyDamage = target.applyDamage;
        
        // Override the applyDamage function to check for the mark
        target.applyDamage = function(amount, type, damageSource, options = {}) {
            let modifiedAmount = amount;
            
            // Check if the damage source is the mark caster
            if (damageSource && this.debuffs) {
                const abyssalMarks = this.debuffs.filter(debuff => 
                    debuff.isAbyssalMark && debuff.caster && debuff.caster === damageSource
                );
                
                // If there's an Abyssal Mark and the source is the mark's caster, increase damage by 50%
                if (abyssalMarks.length > 0) {
                    modifiedAmount = Math.floor(amount * 1.5); // 50% increase
                    console.log(`[Abyssal Mark] Increasing damage from ${amount} to ${modifiedAmount}`);
                    
                    // Add a VFX to show the mark activating
                    showAbyssalMarkActivationVFX(this);
                }
            }
            
            // Call the original applyDamage with the modified amount
            return this._originalApplyDamage.call(this, modifiedAmount, type, damageSource, options);
        };
    }
    
    // Add removal logic to restore original function when all marks are gone
    markDebuff.onRemove = (character) => {
        // Check if this was the last Abyssal Mark
        if (character.debuffs) {
            const remainingMarks = character.debuffs.filter(debuff => debuff.isAbyssalMark);
            
            // If no more marks, restore the original function
            if (remainingMarks.length === 0 && character._originalApplyDamage) {
                character.applyDamage = character._originalApplyDamage;
                delete character._originalApplyDamage;
                console.log(`[Abyssal Mark] Restored original applyDamage function for ${character.name}`);
            }
        }
    };
}

/**
 * Shows the VFX for applying Abyssal Mark to a target
 */
function showAbyssalMarkVFX(target) {
    if (!target) return;
    
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'abyssal-mark-vfx';
    targetElement.appendChild(vfxContainer);
    
    // Create mark symbol
    const markSymbol = document.createElement('div');
    markSymbol.className = 'abyssal-mark-symbol';
    vfxContainer.appendChild(markSymbol);
    
    // Create water circle effects
    for (let i = 0; i < 3; i++) {
        const waterCircle = document.createElement('div');
        waterCircle.className = 'abyssal-mark-circle';
        waterCircle.style.animationDelay = `${i * 0.2}s`;
        vfxContainer.appendChild(waterCircle);
    }
    
    // Create water particles
    for (let i = 0; i < 10; i++) {
        const waterParticle = document.createElement('div');
        waterParticle.className = 'abyssal-mark-particle';
        waterParticle.style.left = `${Math.random() * 100}%`;
        waterParticle.style.top = `${Math.random() * 100}%`;
        waterParticle.style.animationDelay = `${Math.random() * 0.5}s`;
        vfxContainer.appendChild(waterParticle);
    }
    
    // Play sound effect if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/debuff_applied.mp3', 0.6);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode === targetElement) {
            targetElement.removeChild(vfxContainer);
        }
    }, 2500);
}

/**
 * Shows the VFX when Abyssal Mark activates (when taking increased damage)
 */
function showAbyssalMarkActivationVFX(target) {
    if (!target) return;
    
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'abyssal-mark-activation-vfx';
    targetElement.appendChild(vfxContainer);
    
    // Create mark activation symbol
    const activationSymbol = document.createElement('div');
    activationSymbol.className = 'abyssal-mark-activation-symbol';
    activationSymbol.textContent = '+50%';
    vfxContainer.appendChild(activationSymbol);
    
    // Create pulsing effect
    const pulseEffect = document.createElement('div');
    pulseEffect.className = 'abyssal-mark-pulse';
    vfxContainer.appendChild(pulseEffect);
    
    // Create water particles
    for (let i = 0; i < 6; i++) {
        const waterParticle = document.createElement('div');
        waterParticle.className = 'abyssal-mark-activation-particle';
        waterParticle.style.left = `${Math.random() * 100}%`;
        waterParticle.style.top = `${Math.random() * 100}%`;
        
        // Set random movement direction for each particle
        const xDirection = Math.random() > 0.5 ? 1 : -1;
        const yDirection = Math.random() > 0.5 ? 1 : -1;
        const xDistance = (10 + Math.random() * 30) * xDirection;
        const yDistance = (10 + Math.random() * 30) * yDirection;
        
        waterParticle.style.setProperty('--x', `${xDistance}px`);
        waterParticle.style.setProperty('--y', `${yDistance}px`);
        
        waterParticle.style.animationDelay = `${Math.random() * 0.3}s`;
        vfxContainer.appendChild(waterParticle);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode === targetElement) {
            targetElement.removeChild(vfxContainer);
        }
    }, 1500);
}

/**
 * Applies the Fluid Evasion buff when Bridget lands a critical hit
 * Increases dodge chance by 21% for 2 turns and can stack
 */
function applyFluidEvasionBuff(caster) {
    if (!caster || caster.isDead()) return;
    
    console.log(`[Fluid Evasion] Applying evasion buff to ${caster.name}`);
    
    const gameManager = getGameManager();
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Create a unique ID for each stack of the buff
    const buffId = `fluid_evasion_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create the evasion buff
    const evasionBuff = new Effect(
        buffId,
        'Fluid Evasion',
        'Icons/talents/evasive_insight.webp',
        2, // Duration: 2 turns
        null, // No per-turn tick effect
        false // Not a debuff
    );
    
    // Define the stat modification for the buff (21% dodge chance)
    evasionBuff.statModifiers = [
        { stat: 'dodgeChance', operation: 'add', value: 0.21 }
    ];
    
    // Add custom property to identify this as a Fluid Evasion buff
    evasionBuff.isFluidEvasion = true;
    
    // Count existing stacks for the description
    const existingBuffs = caster.buffs ? caster.buffs.filter(buff => buff.isFluidEvasion) : [];
    const stackCount = existingBuffs.length + 1;
    
    // Update the description to show stack information
    evasionBuff.setDescription(`Increases dodge chance by 21%. Currently ${stackCount} stack(s).`);
    
    // When the buff is applied, show VFX
    evasionBuff.onApply = (character) => {
        showFluidEvasionVFX(character, stackCount);
        
        // Update UI to show stack count
        setTimeout(() => {
            try {
                // Find all Fluid Evasion buff icons
                const buffIcons = document.querySelectorAll(`#character-${character.instanceId || character.id} .buff-icon[data-buff-id^="fluid_evasion_"]`);
                buffIcons.forEach(icon => {
                    // Add data attribute for styling
                    icon.setAttribute('data-buff-type', 'fluid_evasion');
                    
                    // Add stack counter
                    const stackCounter = document.createElement('div');
                    stackCounter.className = 'buff-stack-counter';
                    stackCounter.textContent = stackCount;
                    
                    // Remove existing counter if present
                    const existingCounter = icon.querySelector('.buff-stack-counter');
                    if (existingCounter) {
                        icon.removeChild(existingCounter);
                    }
                    
                    icon.appendChild(stackCounter);
                });
            } catch (error) {
                console.error('[Fluid Evasion] Error setting buff data attributes:', error);
            }
        }, 50);
    };
    
    // Add the buff to Bridget
    caster.addBuff(evasionBuff);
    
    // Log the application with stack information
    if (stackCount === 1) {
        log(`${caster.name}'s critical hit activates Fluid Evasion, increasing dodge chance by 21% for 2 turns.`, 'talent-effect');
    } else {
        log(`${caster.name}'s critical hit adds another stack of Fluid Evasion (${stackCount} stacks). Dodge chance increased by ${stackCount * 21}% for 2 turns.`, 'talent-effect');
    }
}

/**
 * Shows the VFX for Fluid Evasion buff application
 */
function showFluidEvasionVFX(character, stackCount) {
    if (!character) return;
    
    const charId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${charId}`);
    
    if (!charElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'fluid-evasion-vfx';
    charElement.appendChild(vfxContainer);
    
    // Create evasion symbol
    const evasionSymbol = document.createElement('div');
    evasionSymbol.className = 'fluid-evasion-symbol';
    vfxContainer.appendChild(evasionSymbol);
    
    // Create water swirl effect
    const waterSwirl = document.createElement('div');
    waterSwirl.className = 'fluid-evasion-swirl';
    vfxContainer.appendChild(waterSwirl);
    
    // Create evasion text with stack count
    const evasionText = document.createElement('div');
    evasionText.className = 'fluid-evasion-text';
    evasionText.textContent = `+21% DODGE${stackCount > 1 ? ` (x${stackCount})` : ''}`;
    vfxContainer.appendChild(evasionText);
    
    // Create water droplets for visual effect
    for (let i = 0; i < 10; i++) {
        const droplet = document.createElement('div');
        droplet.className = 'fluid-evasion-droplet';
        droplet.style.left = `${Math.random() * 100}%`;
        droplet.style.top = `${Math.random() * 100}%`;
        droplet.style.animationDelay = `${Math.random() * 0.5}s`;
        vfxContainer.appendChild(droplet);
    }
    
    // Play sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/buff_applied.mp3', 0.6);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode === charElement) {
            charElement.removeChild(vfxContainer);
        }
    }, 2000);
}

/**
 * Updates the description of Ribbon Wave Rush to include talent effects
 */
function updateRibbonWaveRushDescription(ability) {
    if (!ability) {
        console.error('[updateRibbonWaveRushDescription] No ability provided!');
        return;
    }
    
    // Try to get the character reference from the ability
    let caster = ability.character;
    
    // If caster isn't available directly from the ability, try to find the Bridget character from gameManager
    if (!caster) {
        console.log('[updateRibbonWaveRushDescription] Caster not available directly, trying to find Bridget from gameManager');
        const currentGameManager = getGameManager(); // Use the helper
        if (currentGameManager && currentGameManager.gameState) {
            // Try to find Bridget in player characters
            caster = currentGameManager.gameState.playerCharacters.find(c => c.id === 'bridget');
            
            if (caster) {
                console.log('[updateRibbonWaveRushDescription] Found Bridget character from gameManager');
                // Assign the character to the ability for future reference
                ability.character = caster;
            }
        }
    }
    
    // If we still don't have a caster reference, use default values
    if (!caster) {
        console.warn('[updateRibbonWaveRushDescription] Caster not available, using default values for description.');
        return ability.description;
    }
    
    console.log(`[Ribbon Wave Rush Description] Updating description for ${caster.name}'s ${ability.name}`);
    
    // Get base damage value
    const baseDamage = ability.baseDamage || 365;
    
    // Determine target count based on talents
    let targetCount = 2; // Default target count
    let targetDescription = "two random enemies";
    
    if (caster.chainWaveActive === true) {
        targetCount = 3;
        targetDescription = "three random enemies";
    }
    
    // Base description
    let baseDesc = `Summons a waterfall that hits ${targetDescription} for ${baseDamage} + 85% Magical damage.`;
    
    // Add talent notes section
    let talentEffectsHtml = '';
    
    // Check for Surging Tides talent (increased base damage)
    if (baseDamage === 600) {
        talentEffectsHtml += `\n<span class="talent-effect damage">Surging Tides: Increased base damage to 600.</span>`;
    }
    
    // Check for Abyssal Mark talent
    if (caster.abyssalMarkActive === true) {
        talentEffectsHtml += `\n<span class="talent-effect damage">🔱 Abyssal Mark: Marks enemies, causing them to take 50% increased damage from Bridget for 2 turns.</span>`;
    }
    
    // Check for Chain Wave talent
    if (caster.chainWaveActive === true) {
        talentEffectsHtml += `\n<span class="talent-effect damage">⚡ Chain Wave: Hits one additional enemy for a total of three targets.</span>`;
    }
    
    // Check for Endless Cascade talent
    if (caster.endlessCascadeActive === true) {
        talentEffectsHtml += `\n<span class="talent-effect utility">🌊 Endless Cascade: Has a 10% chance not to end turn and reset cooldown when used.</span>`;
    }
    
    // Combine base description and talent effects
    const finalDescription = baseDesc + talentEffectsHtml;
    
    // Update the ability's description property
    ability.description = finalDescription;
    console.log(`[Ribbon Wave Rush Description] Updated description: ${finalDescription}`);
    
    return finalDescription;
}

// Make functions globally accessible if needed (e.g., for passive hooks)
window.applyBridgetPassiveHealing = applyBridgetPassiveHealing;
window.applyClamProtectionBuff = applyClamProtectionBuff;
window.applyAbyssalMarkDebuff = applyAbyssalMarkDebuff;
window.applyFluidEvasionBuff = applyFluidEvasionBuff;
// Expose description updaters if called externally
window.updateRibbonWaveRushDescription = updateRibbonWaveRushDescription;
window.updateBubbleBeamDescription = updateBubbleBeamDescription;
window.updateArcaneShieldDescription = updateArcaneShieldDescription;
window.updateWaveCrushDescription = updateWaveCrushDescription;
window.updateBridgetPassiveDescription = updatePassiveDescription;


// --- NEW: Tidal Mastery Talent Logic ---

/**
 * Handles the check and application of the Tidal Mastery talent effect at the start of Bridget's turn.
 * @param {Character} character - The Bridget character instance.
 */
function handleBridgetTidalMastery(character) {
    console.log(`[TidalMastery DEBUG] handleBridgetTidalMastery called for ${character.name}`);
    if (!character || character.isDead() || !character.tidalMasteryActive) {
        console.log(`[TidalMastery DEBUG] Aborting: Character dead, null, or talent inactive.`);
        return;
    }

    // Clear any existing Tidal Mastery buff first
    const existingBuff = character.buffs.find(buff => buff.id === 'tidal_mastery_mp_doubled_buff');
    if (existingBuff) {
        console.log(`[TidalMastery DEBUG] Removing existing Tidal Mastery buff before check.`);
        character.removeBuff(existingBuff.id);
    }

    // 10% chance to trigger
    const randomRoll = Math.random();
    console.log(`[TidalMastery DEBUG] Random roll: ${randomRoll.toFixed(4)}`);
    if (randomRoll < 0.10) { // Correct 10% chance check
        console.log(`[TidalMastery DEBUG] SUCCESS! Applying Tidal Mastery buff.`);
        // Apply the buff
        const tidalMasteryBuff = new Effect(
            'tidal_mastery_mp_doubled_buff',
            'Tidal Mastery',
            'Icons/talents/tidal_mastery.webp', 
            1, // Duration: 1 turn
            null, // No turn-based effect needed
            false // isDebuff
        );

        tidalMasteryBuff.setDescription('Magical Damage is doubled for this turn.');
        
        // Store original MP before applying buff
        const originalMagicalDamage = character.stats.magicalDamage;
        tidalMasteryBuff.originalMagicalDamage = originalMagicalDamage; 

        // Define onApply to double MP
        tidalMasteryBuff.onApply = (target) => {
            console.log(`[TidalMastery DEBUG] onApply triggered. Original MD: ${originalMagicalDamage}`);
            target.stats.magicalDamage *= 2;
            console.log(`[TidalMastery DEBUG] MD doubled to: ${target.stats.magicalDamage}`);
            target.recalculateStats('tidal_mastery_apply'); 
            showTidalMasteryVFX(target);
            if(gameManager) gameManager.addLogEntry(`${target.name}'s Tidal Mastery doubles their Magical Damage this turn!`, 'talent-effect');
        };

        // Define onRemove to restore MP
        tidalMasteryBuff.onRemove = (target) => {
            // Restore original MP only if the stored value exists
            if (tidalMasteryBuff.originalMagicalDamage !== undefined) {
                 console.log(`[TidalMastery DEBUG] onRemove triggered. Restoring MD from ${target.stats.magicalDamage} to ${tidalMasteryBuff.originalMagicalDamage}`);
                 target.stats.magicalDamage = tidalMasteryBuff.originalMagicalDamage;
                 target.recalculateStats('tidal_mastery_remove');
            } else {
                 console.warn(`[TidalMastery DEBUG] onRemove: Original MD not found on buff, cannot restore.`);
            }
            if(gameManager) gameManager.addLogEntry(`${target.name}'s Tidal Mastery buff fades.`, 'system');
        };
        
        // Add the buff
        character.addBuff(tidalMasteryBuff);
        
    } else {
         console.log(`[TidalMastery DEBUG] FAILED! Roll ${randomRoll.toFixed(4)} >= 0.10`);
    }
}

/**
 * Displays the visual effect for Tidal Mastery activation.
 * @param {Character} character - The Bridget character instance.
 */
function showTidalMasteryVFX(character) {
    console.log(`[Tidal Mastery] Showing VFX for ${character.name}`);
    const elementId = character.instanceId || character.id;
    const charElement = document.getElementById(`character-${elementId}`);
    if (charElement) {
        // Remove any existing VFX first
        const existingVfx = charElement.querySelector('.tidal-mastery-vfx');
        if (existingVfx) {
            existingVfx.remove();
        }

        const vfxElement = document.createElement('div');
        vfxElement.className = 'tidal-mastery-vfx'; // Style this in bridget.css

        // Add aura effect
        const aura = document.createElement('div');
        aura.className = 'tidal-mastery-aura';
        vfxElement.appendChild(aura);

        // Add text effect
        const surgeText = document.createElement('div');
        surgeText.className = 'tidal-mastery-text';
        surgeText.textContent = 'POWER SURGE!';
        vfxElement.appendChild(surgeText);
        
        // Find the image container within the character element
        const imageContainer = charElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.appendChild(vfxElement); // Append VFX to image container
        } else {
            charElement.appendChild(vfxElement); // Fallback to character element
        }

        // Set timeout to remove the VFX element after animation
        setTimeout(() => {
            vfxElement.remove();
        }, 2500); // Duration of VFX (needs matching CSS animation duration)
    }
}

// Make the handler function globally accessible
window.handleBridgetTidalMastery = handleBridgetTidalMastery;

// --- End NEW: Tidal Mastery Talent Logic ---

// Bubble Pop Talent VFX Helpers
function updateBubblePopParticles() {
    const particles = document.querySelectorAll('.bubble-pop-particle');
    particles.forEach((particle, index) => {
        const angle = (index * 60) % 360; // 6 particles, spread evenly
        const angleRad = angle * Math.PI / 180;
        
        // Calculate the position using JavaScript instead of relying on CSS calc() with trig functions
        particle.style.setProperty('--x-offset', `${Math.cos(angleRad) * 30}px`);
        particle.style.setProperty('--y-offset', `${Math.sin(angleRad) * 30}px`);
    });
}

function updateBubblePopExplosion(element) {
    const droplets = element.querySelectorAll('.bubble-pop-droplet');
    const splashes = element.querySelectorAll('.bubble-pop-splash');
    
    // Position water droplets in a circle
    droplets.forEach((droplet, index) => {
        const angle = (index * 45) % 360; // 8 droplets at 45-degree intervals
        droplet.style.setProperty('--angle', `${angle}deg`);
        
        // Calculate initial position
        const dist = 10;
        const angleRad = angle * Math.PI / 180;
        const x = Math.cos(angleRad) * dist;
        const y = Math.sin(angleRad) * dist;
        
        // Set custom properties for the animation
        droplet.style.setProperty('--start-x', `${x}px`);
        droplet.style.setProperty('--start-y', `${y}px`);
        
        // Calculate end position (further out and up)
        const endDist = 60;
        const endX = Math.cos(angleRad) * endDist;
        const endY = Math.sin(angleRad) * endDist - 20; // Bias upward
        
        droplet.style.setProperty('--end-x', `${endX}px`);
        droplet.style.setProperty('--end-y', `${endY}px`);
    });
    
    // Position splash elements in a circle
    splashes.forEach((splash, index) => {
        const angle = (index * 30) % 360; // 12 splashes at 30-degree intervals
        splash.style.setProperty('--angle', `${angle}deg`);
        
        // Add random delay for more natural effect
        splash.style.setProperty('--delay', `${Math.random() * 0.3}s`);
    });
}

// Update all VFX for Bubble Pop when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add MutationObserver to watch for new Bubble Pop VFX elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    
                    // Check if the node is an element and matches our selectors
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('bridget-bubble-pop-application')) {
                            updateBubblePopParticles();
                        }
                        
                        if (node.classList && node.classList.contains('bridget-bubble-pop-vfx')) {
                            updateBubblePopExplosion(node);
                        }
                    }
                }
            }
        });
    });
    
    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
});

// Add support for Bubble Pop to the description updater
(function addBubblePopToDescriptionUpdater() {
    const originalSetupBridgetDescriptionUpdater = setupBridgetDescriptionUpdater;
    
    if (typeof originalSetupBridgetDescriptionUpdater === 'function') {
        window.setupBridgetDescriptionUpdater = function() {
            originalSetupBridgetDescriptionUpdater();
            
            // Add Bubble Pop to passive description updates
            const originalUpdatePassiveDescription = updatePassiveDescription;
            if (typeof originalUpdatePassiveDescription === 'function') {
                window.updatePassiveDescription = function(passive, character) {
                    originalUpdatePassiveDescription(passive, character);
                    
                    // Add Bubble Pop description if talent is active
                    if (passive && passive.bubblePopActive && character) {
                        const talentEffects = document.querySelectorAll('.passive-description .talent-effect');
                        let hasBubblePopEffect = false;
                        
                        talentEffects.forEach(effect => {
                            if (effect.textContent.includes('Bubble Pop')) {
                                hasBubblePopEffect = true;
                            }
                        });
                        
                        if (!hasBubblePopEffect) {
                            const passiveDesc = document.querySelector('.passive-description');
                            if (passiveDesc) {
                                const bubblePopEffect = document.createElement('span');
                                bubblePopEffect.className = 'talent-effect damage';
                                bubblePopEffect.textContent = `Bubble Pop: Every turn, places a bubble on a random enemy that pops after 2 turns, dealing ${character.stats.magicalDamage.value} magical damage.`;
                                passiveDesc.appendChild(bubblePopEffect);
                            }
                        }
                    }
                };
            }
        };
    }
})();

// Add this function after the other visual effect functions
/**
 * Shows visual effect when Endless Cascade talent triggers
 */
function showEndlessCascadeVFX(character) {
    // Get the character element
    const characterId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterId}`);
    if (!characterElement) return;
    
    // Create the main VFX container
    const cascadeVFX = document.createElement('div');
    cascadeVFX.className = 'endless-cascade-vfx';
    characterElement.appendChild(cascadeVFX);
    
    // Create the glow effect
    const glowElement = document.createElement('div');
    glowElement.className = 'endless-cascade-glow';
    cascadeVFX.appendChild(glowElement);
    
    // Create particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'endless-cascade-particle';
        
        // Position particles in a circle
        const angle = (i / 12) * Math.PI * 2;
        const radius = 30 + Math.random() * 30;
        particle.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        particle.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        
        // Set animation delay
        particle.style.animationDelay = `${i * 0.1}s`;
        particle.style.animation = `endless-cascade-particle 1.5s ease-out ${i * 0.1}s`;
        
        cascadeVFX.appendChild(particle);
    }
    
    // Find the ability element and add the cascade reset effect
    const abilityElement = characterElement.querySelector('.ability[data-ability-id="bridget_q"]');
    if (abilityElement) {
        abilityElement.classList.add('cooldown-reset-cascade');
        
        // Remove the class after animation completes
        setTimeout(() => {
            abilityElement.classList.remove('cooldown-reset-cascade');
        }, 1500);
    }
    
    // Show floating text for better visibility
    if (gameManager && gameManager.uiManager && 
        typeof gameManager.uiManager.showFloatingText === 'function') {
        gameManager.uiManager.showFloatingText(
            `character-${characterId}`,
            'Endless Cascade!',
            'buff'
        );
    } else {
        // Fallback if showFloatingText is not available
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text buff';
        floatingText.textContent = 'Endless Cascade!';
        floatingText.style.position = 'absolute';
        floatingText.style.top = '-30px';
        floatingText.style.left = '50%';
        floatingText.style.transform = 'translateX(-50%)';
        floatingText.style.animation = 'floatUpFade 2s ease-out forwards';
        floatingText.style.color = '#4AF0FF';
        floatingText.style.textShadow = '0 0 5px #0088FF';
        floatingText.style.fontSize = '20px';
        floatingText.style.fontWeight = 'bold';
        floatingText.style.zIndex = '100';
        characterElement.appendChild(floatingText);
        
        setTimeout(() => {
            if (floatingText.parentNode === characterElement) {
                characterElement.removeChild(floatingText);
            }
        }, 2000);
    }
    
    // Remove the VFX after animation completes
    setTimeout(() => {
        if (cascadeVFX.parentNode === characterElement) {
            characterElement.removeChild(cascadeVFX);
        }
    }, 2000);
}

// Water Dance Talent (Connected to Endless Cascade)
let isWaterDanceActive = false;
let waterDanceContainer = null;
let waterDanceCooldown = false;
let waterDanceLastCast = 0;
const WATER_DANCE_COOLDOWN_MS = 2000; // 2 second cooldown

// Make sure it gets initialized early - add immediate initialization
(function() {
    // Try to initialize once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWaterDance);
    } else {
        // DOM already ready, initialize now
        initializeWaterDance();
    }
})();

function initializeWaterDance() {
    console.log('[Water Dance] Initializing water dance container');
    
    if (!waterDanceContainer) {
        waterDanceContainer = document.createElement('div');
        waterDanceContainer.className = 'water-dance-vfx-container';
        waterDanceContainer.style.zIndex = '9999'; // Use very high z-index to ensure visibility
        waterDanceContainer.style.pointerEvents = 'none'; // Make sure it doesn't block interaction
        waterDanceContainer.style.position = 'fixed'; // Ensure it's fixed position
        waterDanceContainer.style.inset = '0'; // Cover the entire viewport
        document.body.appendChild(waterDanceContainer);
        console.log('[Water Dance] Created new container:', waterDanceContainer);
    } else {
        console.log('[Water Dance] Container already exists:', waterDanceContainer);
    }
}

function handleWaterDanceTalent(event) {
    const { character, damage, target } = event.detail;
    
    console.log('[Water Dance] Event received:', event.detail);
    
    // Check if character is Bridget and has the Water Dance talent
    if (character && character.id.includes('bridget')) {
        console.log('[Water Dance] Character is Bridget, checking for talent active status');
        console.log('[Water Dance] Talent active:', character.waterDanceActive === true);
        console.log('[Water Dance] Selected talents:', character.selectedTalents);
        
        if (hasWaterDanceTalent(character)) {
            console.log('[Water Dance] Talent is active! Checking cooldown...');
            
            // Check if the talent is on cooldown
            const now = Date.now();
            if (waterDanceCooldown || (now - waterDanceLastCast < WATER_DANCE_COOLDOWN_MS)) {
                console.log(`[Water Dance] Still on cooldown (${Math.round((now - waterDanceLastCast) / 100) / 10}s elapsed of ${WATER_DANCE_COOLDOWN_MS / 1000}s cooldown)`);
                return;
            }
            
            // Talent is not on cooldown, cast water lasso
            console.log('[Water Dance] Cooldown ready, casting water lasso');
            waterDanceCooldown = true;
            waterDanceLastCast = now;
            
            // Cast the water lasso
            castWaterLasso(character);
            
            // Reset cooldown after delay
            setTimeout(() => {
                waterDanceCooldown = false;
                console.log('[Water Dance] Cooldown reset, ready for next cast');
            }, WATER_DANCE_COOLDOWN_MS);
        }
    }
}

function hasWaterDanceTalent(character) {
    if (!character) return false;
    return character.waterDanceActive === true;
}

function castWaterLasso(caster) {
    console.log('[Water Dance] Starting castWaterLasso function');
    
    // Initialize the water dance container
    initializeWaterDance();
    console.log('[Water Dance] Container initialized:', waterDanceContainer);
    
    // Get a reference to the game manager
    const gameManager = getGameManager();
    console.log('[Water Dance] Game Manager reference:', gameManager);
    
    if (!gameManager) {
        console.error('[Water Dance] Game Manager not available!');
        return;
    }
    
    // Get all enemies
    const enemies = gameManager.getOpponents(caster);
    console.log('[Water Dance] Found enemies:', enemies?.length);
    
    if (!enemies || enemies.length === 0) {
        console.log('[Water Dance] No valid enemies found, aborting water lasso');
        return;
    }
    
    // Select random enemy
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    console.log('[Water Dance] Selected target:', target?.name);
    
    if (!target) {
        console.error('[Water Dance] Failed to select a valid target!');
        return;
    }
    
    // Debug the caster's stats object
    console.log('[Water Dance] Caster stats:', caster.stats);
    
    // Calculate 55% magical damage - properly access the magical damage value
    let magicalDamage = 0;
    if (caster.stats && typeof caster.stats.magicalDamage === 'object' && caster.stats.magicalDamage.value !== undefined) {
        // Access the value property if it exists
        magicalDamage = caster.stats.magicalDamage.value;
    } else if (caster.stats && typeof caster.stats.magicalDamage === 'number') {
        // Direct number value
        magicalDamage = caster.stats.magicalDamage;
    } else if (caster.magicalDamage) {
        // Direct property on character
        magicalDamage = caster.magicalDamage;
    } else {
        // Fallback to a default value
        console.warn('[Water Dance] Could not find magical damage stat, using default value');
        magicalDamage = 300; // Reasonable default magical damage
    }
    
    const baseDamage = magicalDamage * 0.55;
    console.log('[Water Dance] Magical damage value:', magicalDamage);
    console.log('[Water Dance] Base damage (55% of magic damage):', baseDamage);
    
    // Use a safe calculation method for damage
    let calculatedDamage = 0;
    try {
        calculatedDamage = caster.calculateDamage(baseDamage, 'magical', target);
    } catch (error) {
        console.error('[Water Dance] Error calculating damage:', error);
        // Fallback to a simple calculation
        calculatedDamage = Math.round(baseDamage * 1.2); // Simple approximation
    }
    
    console.log('[Water Dance] Calculated final damage after modifiers:', calculatedDamage);
    
    // Ensure we have a valid number for damage
    if (isNaN(calculatedDamage) || calculatedDamage <= 0) {
        console.warn('[Water Dance] Invalid damage value, using fallback');
        calculatedDamage = Math.round(baseDamage);
    }
    
    // Show source VFX on caster
    console.log('[Water Dance] Showing source VFX on caster');
    showWaterDanceSourceVFX(caster);
    
    // Show lasso animation with delay
    setTimeout(() => {
        console.log('[Water Dance] Starting lasso animation to target');
        showWaterLassoAnimation(caster, target, calculatedDamage);
    }, 300);
}

function showWaterDanceSourceVFX(character) {
    console.log('[Water Dance] Showing source VFX on character:', character.name);
    
    const characterId = character.instanceId || character.id;
    console.log('[Water Dance] Character ID:', characterId);
    
    // Try different selectors to find the character element
    let characterElement = document.getElementById(characterId);
    if (!characterElement) {
        characterElement = document.getElementById(`character-${characterId}`);
    }
    if (!characterElement) {
        // Try a more flexible selector
        characterElement = document.querySelector(`[id^="character-${characterId}"]`);
    }
    
    console.log('[Water Dance] Found character element:', characterElement?.id);
    
    if (!characterElement) {
        console.error('[Water Dance] Could not find character element!');
        // As a last resort, try querying all character elements
        const allCharElements = document.querySelectorAll('[id^="character-"]');
        console.log('[Water Dance] All character elements found:', Array.from(allCharElements).map(el => el.id));
        return;
    }
    
    const characterRect = characterElement.getBoundingClientRect();
    const sourceVfx = document.createElement('div');
    sourceVfx.className = 'water-dance-source-vfx';
    
    // Create water dance circle effect
    const circleEffect = document.createElement('div');
    circleEffect.className = 'water-dance-circle';
    sourceVfx.appendChild(circleEffect);
    
    // Create spinning effect
    const spinEffect = document.createElement('div');
    spinEffect.className = 'water-dance-spin';
    sourceVfx.appendChild(spinEffect);
    
    // Add particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'water-dance-particle';
        particle.style.left = `${50 + (Math.random() * 40 - 20)}%`;
        particle.style.top = `${50 + (Math.random() * 40 - 20)}%`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        sourceVfx.appendChild(particle);
    }
    
    // Add Tokyo Mew Mew style twinkles
    for (let i = 0; i < 12; i++) {
        const twinkle = document.createElement('div');
        twinkle.className = 'water-dance-twinkle';
        twinkle.style.width = `${3 + Math.random() * 5}px`;
        twinkle.style.height = twinkle.style.width;
        twinkle.style.left = `${50 + (Math.random() * 60 - 30)}%`;
        twinkle.style.top = `${50 + (Math.random() * 60 - 30)}%`;
        twinkle.style.animationDelay = `${Math.random() * 0.8}s`;
        sourceVfx.appendChild(twinkle);
    }
    
    // Add highlight to character
    characterElement.classList.add('water-dance-active');
    
    // Append to character element
    characterElement.appendChild(sourceVfx);
    console.log('[Water Dance] Added source VFX to character element');
    
    // Remove after animation
    setTimeout(() => {
        console.log('[Water Dance] Removing source VFX');
        if (characterElement.contains(sourceVfx)) {
            characterElement.removeChild(sourceVfx);
        }
        characterElement.classList.remove('water-dance-active');
    }, 1500);
}

function showWaterLassoAnimation(source, target, damage) {
    console.log('[Water Dance] showWaterLassoAnimation started');
    
    // Try different ways to get the elements
    const sourceId = source.instanceId || source.id;
    const targetId = target.instanceId || target.id;
    
    console.log('[Water Dance] Looking for source element with ID:', sourceId);
    console.log('[Water Dance] Looking for target element with ID:', targetId);
    
    // Try different ID formats and selector methods
    let sourceElement = document.getElementById(sourceId);
    if (!sourceElement) {
        sourceElement = document.getElementById(`character-${sourceId}`);
    }
    if (!sourceElement) {
        sourceElement = document.querySelector(`[id^="character-${sourceId}"]`);
    }
    
    let targetElement = document.getElementById(targetId);
    if (!targetElement) {
        targetElement = document.getElementById(`character-${targetId}`);
    }
    if (!targetElement) {
        targetElement = document.querySelector(`[id^="character-${targetId}"]`);
    }
    
    console.log('[Water Dance] Found source element:', sourceElement?.id);
    console.log('[Water Dance] Found target element:', targetElement?.id);
    console.log('[Water Dance] Container available:', !!waterDanceContainer);
    
    if (!sourceElement || !targetElement || !waterDanceContainer) {
        console.error('[Water Dance] Missing required elements for animation!');
        console.log('Source ID tried:', sourceId, `character-${sourceId}`);
        console.log('Target ID tried:', targetId, `character-${targetId}`);
        
        // As a last resort, try querying all character elements
        const allCharElements = document.querySelectorAll('[id^="character-"]');
        console.log('[Water Dance] All character elements found:', Array.from(allCharElements).map(el => el.id));
        
        // Still apply damage even if animation fails
        console.log('[Water Dance] Animation failed but still applying damage');
        setTimeout(() => {
            target.applyDamage(damage, 'magical', source, { 
                showFloatingText: true,
                isTalentEffect: true,
                talentName: 'Water Dance'
            });
        }, 500);
        return;
    }
    
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calculate positions
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    console.log('[Water Dance] Animation coordinates:');
    console.log(`  Source: (${startX}, ${startY})`);
    console.log(`  Target: (${endX}, ${endY})`);
    
    // Calculate distance and angle
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    console.log('[Water Dance] Distance:', distance, 'Angle:', angle);
    
    // Create lasso container
    const lassoContainer = document.createElement('div');
    lassoContainer.className = 'water-lasso-container';
    
    // Create the water lasso
    const lasso = document.createElement('div');
    lasso.className = 'water-lasso';
    lasso.style.top = `${startY}px`;
    lasso.style.left = `${startX}px`;
    lasso.style.width = '0px';
    lasso.style.transform = `rotate(${angle}deg)`;
    
    lassoContainer.appendChild(lasso);
    waterDanceContainer.appendChild(lassoContainer);
    
    console.log('[Water Dance] Lasso elements created and added to DOM');
    
    // Animate the lasso extending
    let progress = 0;
    const animationDuration = 600; // ms
    const startTime = performance.now();
    
    function animateLasso(timestamp) {
        const elapsed = timestamp - startTime;
        progress = Math.min(elapsed / animationDuration, 1);
        
        lasso.style.width = `${distance * progress}px`;
        lasso.style.opacity = progress > 0.1 ? 1 : progress * 10;
        
        if (progress < 1) {
            requestAnimationFrame(animateLasso);
        } else {
            console.log('[Water Dance] Lasso reached target, showing impact');
            
            // First show the impact visual effect
            showWaterLassoImpact(target, targetRect, damage);
            
            // Wait for the impact animation to start before applying damage
            setTimeout(() => {
                console.log('[Water Dance] Applying damage to target:', damage);
                
                // Apply damage to target
                const damageResult = target.applyDamage(damage, 'magical', source, { 
                    showFloatingText: true,
                    isTalentEffect: true,
                    talentName: 'Water Dance'
                });

                // --- ADDED: Trigger Bridget's passive from Water Dance damage --- 
                if (damageResult.damage > 0 && source.id === 'bridget' && window.bridgetPassiveInstance && typeof window.bridgetPassiveInstance.applyPassiveHealing === 'function') {
                    console.log(`[Water Dance] Triggering passive heal for ${damageResult.damage} damage.`);
                    window.bridgetPassiveInstance.applyPassiveHealing(damageResult.damage);
                }
                // --- END ADDED ---

            }, 100);
            
            // Fade out lasso
            setTimeout(() => {
                let fadeOutProgress = 1;
                function fadeLasso() {
                    fadeOutProgress -= 0.05;
                    lasso.style.opacity = fadeOutProgress;
                    
                    if (fadeOutProgress > 0) {
                        requestAnimationFrame(fadeLasso);
                    } else {
                        console.log('[Water Dance] Removing lasso from DOM');
                        if (waterDanceContainer.contains(lassoContainer)) {
                            waterDanceContainer.removeChild(lassoContainer);
                        }
                    }
                }
                
                requestAnimationFrame(fadeLasso);
            }, 200);
        }
    }
    
    console.log('[Water Dance] Starting lasso animation');
    requestAnimationFrame(animateLasso);
}

function showWaterLassoImpact(target, targetRect, damage) {
    console.log('[Water Dance] showWaterLassoImpact started');
    
    const impactVfx = document.createElement('div');
    impactVfx.className = 'water-lasso-impact-vfx';
    impactVfx.style.left = `${targetRect.left + targetRect.width / 2}px`;
    impactVfx.style.top = `${targetRect.top + targetRect.height / 2}px`;
    
    console.log('[Water Dance] Impact VFX created at position:', impactVfx.style.left, impactVfx.style.top);
    
    // Create splash effect
    const splash = document.createElement('div');
    splash.className = 'water-lasso-splash';
    impactVfx.appendChild(splash);
    
    // Create damage text
    const damageText = document.createElement('div');
    damageText.className = 'water-lasso-damage-text';
    damageText.textContent = Math.round(damage);
    impactVfx.appendChild(damageText);
    
    console.log('[Water Dance] Damage text created:', Math.round(damage));
    
    // Add water droplets
    for (let i = 0; i < 12; i++) {
        const droplet = document.createElement('div');
        droplet.className = 'water-lasso-droplet';
        
        // Randomize droplet position
        const angle = Math.random() * 360;
        const distance = 20 + Math.random() * 40;
        droplet.style.setProperty('--x', `${Math.cos(angle * Math.PI/180) * distance}px`);
        droplet.style.setProperty('--y', `${Math.sin(angle * Math.PI/180) * distance}px`);
        
        // Random delay
        droplet.style.animationDelay = `${Math.random() * 0.3}s`;
        
        impactVfx.appendChild(droplet);
    }
    
    console.log('[Water Dance] Created 12 water droplets for splash effect');
    
    if (!waterDanceContainer) {
        console.error('[Water Dance] Container missing when trying to add impact VFX!');
        return;
    }
    
    waterDanceContainer.appendChild(impactVfx);
    console.log('[Water Dance] Impact VFX added to container');
    
    // Remove after animation completes
    setTimeout(() => {
        console.log('[Water Dance] Removing impact VFX');
        if (waterDanceContainer && waterDanceContainer.contains(impactVfx)) {
            waterDanceContainer.removeChild(impactVfx);
        } else {
            console.warn('[Water Dance] Could not remove impact VFX - container or element missing');
        }
    }, 1500);
}

// Register damage event listener for Water Dance - ensure it's properly registered
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Water Dance] Registering event listener for character:damage-dealt');
    
    // Remove any existing listener to prevent duplicates
    document.removeEventListener('character:damage-dealt', handleWaterDanceTalent);
    
    // Add the listener
    document.addEventListener('character:damage-dealt', handleWaterDanceTalent);
    
    // Also ensure the container is created immediately
    initializeWaterDance();
});

// Make sure the talent effect is applied when a talent is applied
document.addEventListener('talent_applied', (event) => {
    const { character, talentId } = event.detail;
    console.log(`[Water Dance] Talent applied event: ${talentId}`);
    
    if (talentId === 'water_dance' && character) {
        console.log('[Water Dance] Water Dance talent was just applied to', character.name);
        character.waterDanceActive = true;
        
        // Force initialization of the container
        initializeWaterDance();
    }
});

// Add cleanup function for Water Dance talent
function cleanupWaterDance() {
    if (waterDanceContainer && waterDanceContainer.parentNode) {
        waterDanceContainer.parentNode.removeChild(waterDanceContainer);
        waterDanceContainer = null;
    }
    
    // Remove event listener
    document.removeEventListener('character:damage-dealt', handleWaterDanceTalent);
    
    // Remove any leftover elements
    const waterDanceElements = document.querySelectorAll('.water-dance-source-vfx, .water-lasso-container, .water-lasso-impact-vfx');
    waterDanceElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    
    // Remove active class from characters
    const activeCharacters = document.querySelectorAll('.character.water-dance-active');
    activeCharacters.forEach(element => {
        element.classList.remove('water-dance-active');
    });
}

// Detect when stage changes and clean up
window.addEventListener('stage:loaded', cleanupWaterDance);
window.addEventListener('beforeunload', cleanupWaterDance);

// Add to description updater
(function addWaterDanceToDescriptionUpdater() {
    if (typeof window.bridgetDescriptionUpdaters !== 'undefined') {
        window.bridgetDescriptionUpdaters.push(updateWaterDanceTalentDescription);
    }
})();

function updateWaterDanceTalentDescription(character) {
    console.log('[Water Dance] Updating talent description for', character?.name);
    
    if (!character) {
        console.log('[Water Dance] No character provided for description update');
        return;
    }
    
    console.log('[Water Dance] Character has talent active:', hasWaterDanceTalent(character));
    
    // Find the talent description element for Water Dance
    const talentDescriptionElements = document.querySelectorAll('.talent-description, .tooltip-description');
    console.log('[Water Dance] Found tooltip elements:', talentDescriptionElements.length);
    
    for (const element of talentDescriptionElements) {
        if (element.textContent.includes('Water Dance') || element.textContent.includes('Bridget Dances with the water')) {
            console.log('[Water Dance] Found matching element:', element.textContent);
            
            // Calculate the exact damage value based on character's magical damage
            const damageValue = Math.round(character.stats.magicalDamage.value * 0.55);
            console.log('[Water Dance] Calculated damage value:', damageValue);
            
            // Update the description with the actual damage value
            const newText = element.innerHTML.replace(
                /deals \(55% Magical damage\)/,
                `deals <span class="talent-effect damage">${damageValue} Magical damage</span>`
            );
            
            if (newText !== element.innerHTML) {
                console.log('[Water Dance] Updating description text');
                element.innerHTML = newText;
            }
        }
    }
}

// Add to description updater setup
(function addWaterDanceToDescriptionUpdater() {
    // Make sure the global array exists
    if (typeof window.bridgetDescriptionUpdaters === 'undefined') {
        window.bridgetDescriptionUpdaters = [];
    }
    
    // Add our updater function
    window.bridgetDescriptionUpdaters.push(updateWaterDanceTalentDescription);
})();

// Add as a new function near the end of the file

/**
 * Helper function to directly trigger Resonant Cascade effect
 * This can be called from ability effects to ensure the talent procs
 */
function triggerResonantCascade(caster, targets) {
    console.log('[triggerResonantCascade] Attempting to manually trigger Resonant Cascade');
    
    if (!caster || !caster.id || caster.id !== 'bridget') {
        console.log('[triggerResonantCascade] Not Bridget, ignoring');
        return;
    }
    
    // Check if the talent is enabled on the character
    if (!caster.resonantCascadeActive) {
        console.log('[triggerResonantCascade] Resonant Cascade not active on character');
        return;
    }
    
    console.log('[triggerResonantCascade] Character has talent, proceeding...');
    
    // Convert single target to array
    if (!Array.isArray(targets)) {
        targets = [targets];
    }
    
    // Find Bridget's passive instance
    let bridgetPassive = null;
    
    // Try via character's passive property
    if (caster.passive && caster.passive.resonantCascadeActive !== undefined) {
        bridgetPassive = caster.passive;
        console.log('[triggerResonantCascade] Found passive via character.passive');
    } 
    
    // Try via global reference
    else if (window.bridgetPassiveInstance) {
        bridgetPassive = window.bridgetPassiveInstance;
        console.log('[triggerResonantCascade] Found passive via global reference');
    }
    
    // If we found the passive instance
    if (bridgetPassive) {
        console.log('[triggerResonantCascade] Found passive instance, queueing bubbles for targets:', targets.map(t => t.name));
        
        // Queue bubbles for each target
        targets.forEach(target => {
            if (target.isDead() || target.isUntargetable()) return;
            
            const isEnemy = caster.isEnemy !== target.isEnemy;
            
            // Try to queue via the passive's method
            if (typeof bridgetPassive.queueResonantCascadeBubble === 'function') {
                bridgetPassive.queueResonantCascadeBubble(target);
                console.log(`[triggerResonantCascade] Queued bubble for ${target.name}`);
            }
        });
        
        // Start processing animations if needed
        if (!bridgetPassive.processingAnimations && typeof bridgetPassive.processNextAnimation === 'function') {
            bridgetPassive.processNextAnimation();
        }
        
        return true;
    } else {
        console.log('[triggerResonantCascade] Could not find Bridget passive instance');
        return false;
    }
}

// Add this hook to each ability effect to ensure Resonant Cascade triggers

// Add to Ribbon Wave Rush effect
let originalRibbonWaveRushEffect = bridgetRibbonWaveRushEffect;
bridgetRibbonWaveRushEffect = (caster, targets, abilityInstance) => {
    const result = originalRibbonWaveRushEffect(caster, targets, abilityInstance);
    
    // Manually trigger Resonant Cascade after the ability effect
    if (caster && caster.id === 'bridget') {
        setTimeout(() => {
            triggerResonantCascade(caster, targets);
        }, 100);
    }
    
    return result;
};

// Add to Bubble Beam Barrage effect
let originalBubbleBeamBarrageEffect = bridgetBubbleBeamBarrageEffect;
bridgetBubbleBeamBarrageEffect = (caster, targets, abilityInstance) => {
    const result = originalBubbleBeamBarrageEffect(caster, targets, abilityInstance);
    
    // Manually trigger Resonant Cascade after the ability effect
    if (caster && caster.id === 'bridget') {
        setTimeout(() => {
            triggerResonantCascade(caster, targets);
        }, 100);
    }
    
    return result;
};

// Add to Arcane Bubble Shield effect
let originalArcaneBubbleShieldEffect = bridgetArcaneBubbleShieldEffect;
bridgetArcaneBubbleShieldEffect = (caster) => {
    const result = originalArcaneBubbleShieldEffect(caster);
    
    // For self-targeting abilities, we need to create a targets array with the caster
    if (caster && caster.id === 'bridget') {
        setTimeout(() => {
            // For shield, we need to find allies since it affects allies
            const gameManager = getGameManager();
            if (gameManager) {
                const allies = gameManager.getAllies(caster);
                triggerResonantCascade(caster, allies);
            } else {
                // Fallback to just targeting self
                triggerResonantCascade(caster, [caster]);
            }
        }, 100);
    }
    
    return result;
};

// Add to Wave Crush effect 
let originalWaveCrushEffect = bridgetWaveCrushEffect;
bridgetWaveCrushEffect = (caster) => {
    const result = originalWaveCrushEffect(caster);
    
    // For AoE abilities, we need to create a targets array with all enemies
    if (caster && caster.id === 'bridget') {
        setTimeout(() => {
            const gameManager = getGameManager();
            if (gameManager) {
                const enemies = gameManager.getOpponents(caster);
                triggerResonantCascade(caster, enemies);
            }
        }, 100);
    }
    
    return result;
};

        