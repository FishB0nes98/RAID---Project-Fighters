// IMMEDIATE FIX FOR BULLET RAIN
(function() {
    console.log("[BULLET RAIN FIX] Initializing immediate fix for Bullet Rain talent");
    
    // Define global test function immediately
    window.testBulletRainNow = function() {
        console.log("[BULLET RAIN FIX] Manual test function called");
        
        // Find game manager
        if (!window.gameManager) {
            alert("Game manager not found! Cannot test Bullet Rain.");
            return "Error: Game manager not available";
        }
        
        // Find Nina
        let nina = null;
        if (window.gameManager.gameState) {
            // Check player characters
            if (window.gameManager.gameState.playerCharacters) {
                nina = window.gameManager.gameState.playerCharacters.find(c => c && c.id === 'farmer_nina');
            }
            
            // Check AI characters
            if (!nina && window.gameManager.gameState.aiCharacters) {
                nina = window.gameManager.gameState.aiCharacters.find(c => c && c.id === 'farmer_nina');
            }
        }
        
        if (!nina) {
            alert("Nina not found in the current game!");
            return "Error: Nina not found";
        }
        
        alert("Found Nina! Preparing to test Bullet Rain...");
        
        // Force enable Bullet Rain talent
        nina.appliedTalents = nina.appliedTalents || [];
        if (!nina.appliedTalents.includes('bullet_rain')) {
            nina.appliedTalents.push('bullet_rain');
        }
        nina.enableBulletRain = true;
        
        // Get enemies
        const enemies = nina.isAI ? 
            window.gameManager.gameState.playerCharacters : 
            window.gameManager.gameState.aiCharacters;
            
        // Force apply Target Lock to all enemies
        let lockedCount = 0;
        enemies.forEach(enemy => {
            if (enemy && !enemy.isDead()) {
                // Create Target Lock debuff
                const targetLock = {
                    id: 'farmer_nina_e_target_lock',
                    name: 'Target Lock',
                    icon: 'Icons/abilities/target_lock.webp',
                    duration: 3,
                    isDebuff: true,
                    effects: {
                        damageAmpPercent: 15
                    }
                };
                
                // Add using addDebuff method
                if (typeof enemy.addDebuff === 'function') {
                    enemy.addDebuff(targetLock);
                    lockedCount++;
                } 
                // If addDebuff doesn't exist, try pushing directly
                else if (enemy.debuffs && Array.isArray(enemy.debuffs)) {
                    enemy.debuffs.push(targetLock);
                    lockedCount++;
                }
            }
        });
        
        alert(`Applied Target Lock to ${lockedCount} enemies. Running Bullet Rain...`);
        
        // Create a simple version of Bullet Rain effect
        const physDamage = nina.stats.physicalDamage || 100;
        const damagePerTarget = Math.floor(physDamage * 0.25);
        
        let totalDamage = 0;
        enemies.forEach(enemy => {
            if (enemy && !enemy.isDead() && enemy.debuffs && 
                enemy.debuffs.some(d => d.id === 'farmer_nina_e_target_lock')) {
                
                // Apply damage
                if (typeof enemy.applyDamage === 'function') {
                    const isCrit = Math.random() < (nina.stats.critChance || 0);
                    const critMulti = nina.stats.critDamage || 1.5;
                    const finalDamage = isCrit ? Math.floor(damagePerTarget * critMulti) : damagePerTarget;
                    
                    const result = enemy.applyDamage(finalDamage, 'physical', nina, { abilityId: 'farmer_nina_bullet_rain' });
                    totalDamage += result.damage;
                    
                    // Log damage
                    const log = window.gameManager.addLogEntry.bind(window.gameManager);
                    log(`${enemy.name} takes ${result.damage} damage from Bullet Rain${isCrit ? " (Critical Hit!)" : ""}`);
                }
            }
        });
        
        // Create visual effect
        enemies.forEach(enemy => {
            if (enemy && !enemy.isDead() && enemy.debuffs && 
                enemy.debuffs.some(d => d.id === 'farmer_nina_e_target_lock')) {
                
                const targetElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                if (targetElement) {
                    // Create VFX container
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'bullet-rain-vfx';
                    targetElement.appendChild(vfxContainer);
                    
                    // Create bullet tracers
                    for (let i = 0; i < 10; i++) {
                        const tracer = document.createElement('div');
                        tracer.className = 'bullet-rain-tracer';
                        tracer.style.left = `${-10 + Math.random() * 120}%`;
                        tracer.style.top = `${-30 - Math.random() * 20}%`;
                        tracer.style.animationDelay = `${Math.random() * 0.5}s`;
                        vfxContainer.appendChild(tracer);
                    }
                    
                    // Remove after animation
                    setTimeout(() => vfxContainer.remove(), 1500);
                }
            }
        });
        
        alert(`Bullet Rain complete! Applied ${totalDamage} total damage.`);
        return `Bullet Rain test complete: ${totalDamage} damage to ${lockedCount} enemies`;
    };
    
    // Hook into turn start
    const setupBulletRainTurnHook = function() {
        if (!window.gameManager) {
            console.log("[BULLET RAIN FIX] Game manager not found, waiting...");
            setTimeout(setupBulletRainTurnHook, 500);
            return;
        }
        
        console.log("[BULLET RAIN FIX] Adding turn hooks for Bullet Rain");
        
        // Hook into endTurn and startTurn methods
        const originalEndTurn = window.gameManager.endPlayerTurn;
        if (originalEndTurn && typeof originalEndTurn === 'function') {
            window.gameManager.endPlayerTurn = function() {
                const result = originalEndTurn.apply(this, arguments);
                
                // Schedule check for Nina on next tick
                setTimeout(() => {
                    if (this.gameState && this.gameState.playerCharacters) {
                        const nina = this.gameState.playerCharacters.find(c => c && c.id === 'farmer_nina');
                        if (nina && nina.appliedTalents && nina.appliedTalents.includes('bullet_rain')) {
                            console.log("[BULLET RAIN FIX] Detected Nina at turn start - automatic check");
                            window.testBulletRainNow();
                        }
                    }
                }, 100);
                
                return result;
            };
        }
        
        console.log("[BULLET RAIN FIX] Turn hooks installed successfully");
    };
    
    // Start setup when document is loaded
    if (document.readyState === 'complete') {
        setupBulletRainTurnHook();
    } else {
        window.addEventListener('load', setupBulletRainTurnHook);
    }
    
    console.log("[BULLET RAIN FIX] Initialization complete - test function available at window.testBulletRainNow()");
})();

// Ability definitions for Farmer farmer_nina

// Assume Ability, Effect classes and addLogEntry function are available globally or imported
// If not, ensure they are properly included in the execution context.

// --- Helper Functions for Passive ---

function applyfarmer_ninaPassive(caster, buff) {
    // This function is now a legacy handler for backward compatibility
    // The new passive is handled by updateNinaDodgeFromBuffs
    return buff;
}

// New passive implementation: Evasive Adaptability
function updateNinaDodgeFromBuffs(character) {
    // Only apply to Farmer Nina
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[EVASIVE ADAPTABILITY] Updating dodge chance for ${character.name}`);
    
    // Count active buffs
    const activeBuffs = character.buffs ? character.buffs.length : 0;
    
    // Calculate bonus dodge chance (5% per buff)
    const bonusDodgeChance = activeBuffs * 0.05;
    
    // Store base dodge chance if not already stored
    if (character._baseDodgeChance === undefined) {
        character._baseDodgeChance = character.baseStats.dodgeChance || 0.03;
        console.log(`[EVASIVE ADAPTABILITY] Stored base dodge chance: ${character._baseDodgeChance}`);
    }
    
    // Update character's dodge chance
    character.baseStats.dodgeChance = character._baseDodgeChance + bonusDodgeChance;
    
    // Get log function from game manager
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Log the update
    log(`${character.name}'s Evasive Adaptability grants ${(bonusDodgeChance * 100).toFixed(0)}% dodge chance from ${activeBuffs} active buffs.`);
    console.log(`[EVASIVE ADAPTABILITY] Base: ${character._baseDodgeChance * 100}% + Bonus: ${bonusDodgeChance * 100}% = Total: ${character.baseStats.dodgeChance * 100}%`);
    
    // Add visual effect to show dodge bonus
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (characterElement) {
        // Remove any existing dodge indicator
        const existingIndicator = characterElement.querySelector('.evasive-adaptability-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (activeBuffs > 0) {
            // Create dodge bonus indicator
            const indicator = document.createElement('div');
            indicator.className = 'evasive-adaptability-indicator';
            indicator.innerHTML = `<span>+${(bonusDodgeChance * 100).toFixed(0)}% DODGE</span>`;
            characterElement.appendChild(indicator);
            
            // Add glow effect
            characterElement.classList.add('evasive-adaptability-active');
            
            // Add animation
            const dodgeVfx = document.createElement('div');
            dodgeVfx.className = 'evasive-adaptability-vfx';
            characterElement.appendChild(dodgeVfx);
            
            // Remove VFX after animation
            setTimeout(() => {
                dodgeVfx.remove();
            }, 1000);
        } else {
            // Remove glow effect if no buffs
            characterElement.classList.remove('evasive-adaptability-active');
        }
    }
    
    // Recalculate stats to apply the changes
    character.recalculateStats('evasive-adaptability-passive');
}

// Hook into buff add/remove events to update passive
function initializeEvasiveAdaptabilityPassive() {
    console.log('[EVASIVE ADAPTABILITY] Initializing passive hooks');
    
    // Override Character.addBuff to trigger passive
    const originalAddBuff = Character.prototype.addBuff;
    Character.prototype.addBuff = function(buff) {
        // Call original method
        const result = originalAddBuff.call(this, buff);
        
        // If this is Nina, update dodge chance
        if (this.id === 'farmer_nina') {
            setTimeout(() => updateNinaDodgeFromBuffs(this), 0);
        }
        
        return result;
    };
    
    // Override Character.removeBuff to trigger passive
    const originalRemoveBuff = Character.prototype.removeBuff;
    Character.prototype.removeBuff = function(buffId) {
        // Call original method
        originalRemoveBuff.call(this, buffId);
        
        // If this is Nina, update dodge chance
        if (this.id === 'farmer_nina') {
            setTimeout(() => updateNinaDodgeFromBuffs(this), 0);
        }
    };
    
    // Hook into turn start/end to ensure passive is applied
    const originalProcessEffects = Character.prototype.processEffects;
    Character.prototype.processEffects = function(shouldReduceDuration, shouldRegenerateResources) {
        // Call original method
        originalProcessEffects.call(this, shouldReduceDuration, shouldRegenerateResources);
        
        // If this is Nina, update dodge chance after processing buffs
        if (this.id === 'farmer_nina') {
            setTimeout(() => updateNinaDodgeFromBuffs(this), 0);
        }
    };
    
    console.log('[EVASIVE ADAPTABILITY] Passive hooks initialized');
}

// Initialize the passive as soon as the script loads
(function() {
    // Check if document is ready, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEvasiveAdaptabilityPassive);
    } else {
        initializeEvasiveAdaptabilityPassive();
    }
    
    // Also hook into game manager initialization
    document.addEventListener('GameManagerInitialized', function() {
        console.log('[EVASIVE ADAPTABILITY] Game manager initialized, setting up passive for Nina');
        
        // Look for Nina in player characters
        if (window.gameManager && window.gameManager.gameState) {
            const nina = window.gameManager.gameState.playerCharacters.find(c => c.id === 'farmer_nina');
            if (nina) {
                updateNinaDodgeFromBuffs(nina);
                console.log('[EVASIVE ADAPTABILITY] Applied passive to Nina on initialization');
            }
        }
    });
})();

// --- Combat Reflexes Talent: Apply Critical Chance after Dodge ---
function applyDodgeCriticalBuff(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    // Check if character has the Combat Reflexes talent
    if (!character.appliedTalents || !character.appliedTalents.includes('critical_dodge')) {
        console.log(`[COMBAT REFLEXES] ${character.name} doesn't have the Combat Reflexes talent`);
        return;
    }
    
    // Check if the buff is already applied to prevent double-application
    if (character.buffs && character.buffs.some(b => b && b.id === 'farmer_nina_dodge_critical_buff')) {
        console.log(`[COMBAT REFLEXES] ${character.name} already has the critical buff active, refreshing duration`);
        // Find the existing buff and refresh its duration
        const existingBuff = character.buffs.find(b => b && b.id === 'farmer_nina_dodge_critical_buff');
        if (existingBuff) {
            existingBuff.duration = 2; // Reset to 2 turns
            console.log(`[COMBAT REFLEXES] Refreshed buff duration to ${existingBuff.duration} turns`);
            return;
        }
    }
    
    console.log(`[COMBAT REFLEXES] Applying critical chance buff to ${character.name}`);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Create the critical chance buff
    const criticalBuff = new Effect(
        'farmer_nina_dodge_critical_buff',
        'Combat Reflexes',
        'Icons/talents/dodge_critical.webp',
        2, // Duration: 2 turns
        null, // No per-turn effect
        false // Not a debuff
    );
    
    // Set the stat modifier to 100% crit chance
    criticalBuff.statModifiers = [{
        stat: 'critChance',
        operation: 'set', // Override the current value
        value: 1.0 // 100% crit chance
    }];
    
    // Set description
    criticalBuff.setDescription(`Ensures 100% critical strike chance for 2 turns after dodging an attack.`);
    
    // Set remove function
    criticalBuff.remove = (char) => {
        log(`${char.name}'s Combat Reflexes critical buff fades.`);
        console.log(`[COMBAT REFLEXES] Buff expired for ${char.name}`);
        // Ensure stats are recalculated on removal
        char.recalculateStats('combat-reflexes-removed');
    };
    
    // Apply the buff - it will be automatically affected by Nina's passive
    character.addBuff(criticalBuff.clone()); // Clone before applying
    
    // Add log entry
    log(`${character.name}'s Combat Reflexes activates, granting 100% critical chance for 2 turns!`, 'talent-effect');
    
    // Add visual effect
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (characterElement) {
        const criticalVfx = document.createElement('div');
        criticalVfx.className = 'combat-reflexes-vfx';
        criticalVfx.innerHTML = '<div class="combat-reflexes-text">100% CRIT</div>';
        characterElement.appendChild(criticalVfx);
        
        // Add glow effect to character
        const glowEffect = document.createElement('div');
        glowEffect.className = 'combat-reflexes-glow';
        characterElement.appendChild(glowEffect);
        
        // Remove VFX after animation
        setTimeout(() => {
            criticalVfx.remove();
            
            // Keep glow effect longer, but eventually remove it
            setTimeout(() => {
                glowEffect.remove();
            }, 3000);
        }, 2000);
    }
}

// --- Survivalist Instinct Talent: Process Physical Growth ---
function processPhysicalGrowthTalent(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    // Check if character has the Survivalist Instinct talent
    if (!character.appliedTalents || !character.appliedTalents.includes('physical_growth')) {
        console.log(`[SURVIVALIST INSTINCT] ${character.name} doesn't have the Survivalist Instinct talent`);
        return;
    }
    
    console.log(`[SURVIVALIST INSTINCT] Processing physical growth for ${character.name}`);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Get current physical damage
    const currentPhysicalDamage = character.stats.physicalDamage || 0;
    
    // Calculate growth amount (1% of current physical damage)
    const growthAmount = currentPhysicalDamage * 0.01;
    
    // Round to 2 decimal places for cleaner display
    const roundedGrowthAmount = Math.round(growthAmount * 100) / 100;
    
    if (roundedGrowthAmount <= 0) {
        console.log(`[SURVIVALIST INSTINCT] No growth to apply (current physical damage: ${currentPhysicalDamage})`);
        return;
    }
    
    console.log(`[SURVIVALIST INSTINCT] Current physical damage: ${currentPhysicalDamage}, Growth amount: ${roundedGrowthAmount}`);
    
    // Initialize or get existing stack count for the buff
    let currentStacks = 0;
    
    // Find any existing Survivalist Instinct buff
    const existingBuff = character.buffs.find(buff => buff.id === 'survivalist_instinct_buff');
    
    if (existingBuff) {
        // Get current stacks and accumulated bonus
        currentStacks = existingBuff.currentStacks || 0;
        
        // Remove the existing buff so we can create a new one with updated stacks
        character.removeBuff('survivalist_instinct_buff');
    }
    
    // Create a new visible buff that shows the stacks
    const instinctBuff = new Effect(
        'survivalist_instinct_buff',
        'Survivalist Instinct',
        'Icons/talents/physical_growth.webp',
        -1, // Permanent buff
        null, // No per-turn effect
        false // Not a debuff
    );
    
    // Setup as a stacking buff
    instinctBuff.stackable = true;
    instinctBuff.maxStacks = 999; // No reasonable limit
    instinctBuff.currentStacks = currentStacks + 1; // Increment stacks
    
    // Keep track of total growth amount
    character.totalPhysicalGrowth = (character.totalPhysicalGrowth || 0) + roundedGrowthAmount;
    const totalGrowth = Math.round(character.totalPhysicalGrowth * 100) / 100;
    instinctBuff.totalGrowth = totalGrowth; // Store in the buff for reference
    
    // The buff description should show both individual growth and total growth
    instinctBuff.description = `Gained +${roundedGrowthAmount} Physical Damage this turn.\nTotal bonus: +${totalGrowth} Physical Damage from Survivalist Instinct.`;
    
    // Set the stat modifier to add the total accumulated physical damage
    instinctBuff.statModifiers = [{
        stat: 'physicalDamage',
        operation: 'add',
        value: totalGrowth
    }];
    
    // Create a nice remove method (for cleanup if needed)
    instinctBuff.remove = function(target) {
        console.log(`[SURVIVALIST INSTINCT] Removing buff from ${target.name} (this should not normally happen)`);
    };
    
    // Apply the buff
    character.addBuff(instinctBuff);
    
    // Add log entry
    log(`${character.name}'s Survivalist Instinct adds +${roundedGrowthAmount} Physical Damage (Total: +${totalGrowth})`, 'talent-effect');
    
    // Add visual effect
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (characterElement) {
        const growthVfx = document.createElement('div');
        growthVfx.className = 'survivalist-instinct-vfx';
        growthVfx.innerHTML = `<div class="survivalist-instinct-text">+${roundedGrowthAmount} AD</div>`;
        characterElement.appendChild(growthVfx);
        
        // Create a stack indicator on the buff
        const buffIcon = characterElement.querySelector('.buff-icon[data-buff-id="survivalist_instinct_buff"]');
        if (buffIcon) {
            // Update stack count display
            let stackCount = buffIcon.querySelector('.stack-count');
            if (!stackCount) {
                stackCount = document.createElement('div');
                stackCount.className = 'stack-count';
                buffIcon.appendChild(stackCount);
            }
            stackCount.textContent = instinctBuff.currentStacks;
            stackCount.classList.add('stack-update');
            setTimeout(() => stackCount.classList.remove('stack-update'), 1000);
        }
        
        // Remove VFX after animation
        setTimeout(() => {
            growthVfx.remove();
        }, 2000);
    }
}

// Override the addBuff method to implement the passive
if (typeof Character !== 'undefined') {
    // Store the original addBuff method
    const originalAddBuff = Character.prototype.addBuff;
    
    // Override with our version
    Character.prototype.addBuff = function(buff) {
        // Apply Extended Protection talent if this is Farmer Nina - only if not already handled by passive
        if (this.id === 'farmer_nina' && this.appliedTalents && this.appliedTalents.includes('extended_protection') && 
            !(buff.id.startsWith('farmer_nina') && buff.id !== 'farmer_nina_post_hiding_damage')) {
            
            // Add 2 turns to buff duration for non-Nina buffs (those are handled by passive)
            const originalDuration = buff.duration;
            buff.duration += 2;
            
            // Log the extension
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name}'s Extended Protection increases ${buff.name} duration from ${originalDuration} to ${buff.duration} turns!`, 'talent-effect');
        }
        
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

// Helper function to apply the Deadly Retreat damage buff
function applyDeadlyRetreatBuff(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    // Check if character has the Deadly Retreat talent
    if (!character.appliedTalents || !character.appliedTalents.includes('deadly_retreat')) {
        console.log(`[DEADLY RETREAT] ${character.name} doesn't have the Deadly Retreat talent`);
        return;
    }
    
    // Check if the buff is already applied to prevent double-application
    if (character.buffs && character.buffs.some(b => b && b.id === 'farmer_nina_post_hiding_damage')) {
        console.log(`[DEADLY RETREAT] ${character.name} already has the damage buff active, skipping`);
        return;
    }
    
    console.log(`[DEADLY RETREAT] Applying damage buff to ${character.name}`);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Create the physical damage buff
    const damageBuffValue = 0.12; // 12% increase in physical damage
    const damageBuffDuration = 2; // 2 turns
    
    // Log character's current physicalDamage before buff
    const currentPhysicalDamage = character.stats.physicalDamage;
    console.log(`[DEADLY RETREAT] Current physical damage BEFORE BUFF: ${currentPhysicalDamage}`); // Added log
    
    const damageBuff = new Effect(
        'farmer_nina_post_hiding_damage',
        'Deadly Retreat',
        'Icons/talents/post_hiding_damage.webp',
        damageBuffDuration,
        null, // No per-turn effect
        false // Not a debuff
    );
    
    // Set the stat modifier using array format
    damageBuff.statModifiers = [{
        stat: 'physicalDamage',
        operation: 'add_base_percentage', // Use the new percentage operation
        value: damageBuffValue // The value is the percentage (0.12)
    }];
    
    // Set description
    damageBuff.setDescription(`Increases Physical Damage by ${damageBuffValue * 100}% of base for ${damageBuffDuration} turns after Hiding expires.`); // Update description slightly
    
    // Set remove function
    damageBuff.remove = (char) => {
        log(`${char.name}'s Deadly Retreat damage boost fades.`);
        console.log(`[DEADLY RETREAT] Buff expired for ${char.name}`);
        // Ensure stats are recalculated on removal
        char.recalculateStats('deadly-retreat-removed');
    };
    
    // Add onRemove function to ensure it's properly handled
    damageBuff.onRemove = function(char) {
        console.log(`[DEADLY RETREAT] onRemove called for ${char.name}`);
        log(`${char.name}'s Deadly Retreat damage boost has expired.`);
        // Ensure stats are recalculated on removal (redundant but safe)
        char.recalculateStats('deadly-retreat-onRemove');
    };
    
    // Apply the buff - it will be automatically affected by Nina's passive
    character.addBuff(damageBuff.clone()); // Clone before applying
    
    // Log the new physical damage after buff application (addBuff triggers recalculateStats)
    // Use setTimeout to allow the recalculation triggered by addBuff to complete
    setTimeout(() => {
        const newPhysicalDamage = character.stats.physicalDamage;
        // Expected increase includes Nina's passive doubling the 12% bonus OF BASE
        const basePhysicalDamage = character.baseStats.physicalDamage || 0;
        const expectedIncrease = basePhysicalDamage * damageBuffValue * 2; // Passive doubles the 12% of BASE
        const actualIncrease = newPhysicalDamage - currentPhysicalDamage; // Compare to damage BEFORE this buff
        const percentIncreaseOfBase = actualIncrease > 0 ? (actualIncrease / basePhysicalDamage) * 100 : 0;

        console.log(`[DEADLY RETREAT] Base physical damage: ${basePhysicalDamage.toFixed(2)}`);
        console.log(`[DEADLY RETREAT] Physical damage AFTER BUFF application: ${newPhysicalDamage.toFixed(2)}`);
        console.log(`[DEADLY RETREAT] Expected increase (passive x2 of base): ~${expectedIncrease.toFixed(2)}`);
        console.log(`[DEADLY RETREAT] Actual increase: ${actualIncrease.toFixed(2)} (${percentIncreaseOfBase.toFixed(1)}% of base)`);

        // Compare actual increase with expected increase (allowing for floating point inaccuracies)
        if (Math.abs(actualIncrease - expectedIncrease) < 0.01) {
             console.log(`[DEADLY RETREAT] Damage boost seems correctly applied (including passive).`);
        } else {
             console.error(`[DEADLY RETREAT] DISCREPANCY DETECTED in damage boost application! Expected ~${expectedIncrease.toFixed(2)}, Got ${actualIncrease.toFixed(2)}`);
        }
    }, 50); // Short delay to ensure recalculateStats has finished
    
    // Add log entry
    // Text still shows 12%, passive doubling is internal calculation
    log(`${character.name}'s Deadly Retreat activates, boosting her Physical Damage by ${damageBuffValue * 100}%!`, 'talent-effect');
    
    // Add visual effect
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (characterElement) {
        const damageBoostVfx = document.createElement('div');
        damageBoostVfx.className = 'deadly-retreat-vfx';
        damageBoostVfx.innerHTML = '<div class="deadly-retreat-text">+12% DMG</div>'; // Text still shows 12%, passive doubling is internal
        characterElement.appendChild(damageBoostVfx);
        
        // Add glow effect to character
        const glowEffect = document.createElement('div');
        glowEffect.className = 'deadly-retreat-glow';
        characterElement.appendChild(glowEffect);
        
        // Remove VFX after animation
        setTimeout(() => {
            damageBoostVfx.remove();
            
            // Keep glow effect longer, but eventually remove it
            setTimeout(() => {
                glowEffect.remove();
            }, 3000);
        }, 2000);
    }
}

// --- Ability Definitions ---

// Q: Sniper Shot
const farmer_ninaSniperShotEffect = (caster, target, abilityObj, actualManaCost, options = {}) => {
    const ability = abilityObj || caster.abilities.find(a => a.id === 'farmer_nina_q');
    if (!ability) return; // Should not happen

    const baseDamage = ability.baseDamage || 400;
    const scalingStat = 'physicalDamage';
    const damageScalingPercent = ability.damageScalingPercent !== undefined ? ability.damageScalingPercent : 0.5; // Default 50%
    const piercingChance = ability.piercingChance || 0; // Talent: Piercing Rounds
    const armorIgnoreChance = ability.armorIgnoreChance || 0; // Talent: Armor Ignore

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    let calculatedDamage = baseDamage + Math.floor((caster.stats[scalingStat] || 0) * damageScalingPercent);

    // Determine if armor should be bypassed for this shot
    let bypassArmor = false;
    if (armorIgnoreChance > 0 && Math.random() < armorIgnoreChance) {
        bypassArmor = true;
        log(`${caster.name}'s Sniper Shot ignores ${target.name}'s armor!`, 'talent-effect');
        // Optional: Add VFX for armor ignore activation
        if (typeof showArmorIgnoreVFX === 'function') {
            showArmorIgnoreVFX(caster, target);
        } else if (window.gameManager?.showFloatingText) {
            window.gameManager.showFloatingText(`character-${target.instanceId || target.id}`, 'Armor Ignored!', 'debuff'); // Using debuff color for now
        }
    }

    // Create options object for applyDamage
    const damageOptions = {
        bypassArmor: bypassArmor, // Pass the bypass flag
        abilityId: 'farmer_nina_q' // Add ability ID for statistics tracking
    };
    
    // Play sniper sound
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/sniper_shot.mp3', 0.8);
    }

    // Apply damage to primary target
    const primaryResult = target.applyDamage(calculatedDamage, 'physical', caster, damageOptions);

    log(`${caster.name} shoots ${target.name} with Sniper Shot for ${primaryResult.damage} physical damage${primaryResult.isCritical ? " (Critical!)" : ""}.`);

    // Apply crit chance buff to caster after successful shot
    const critBuff = {
        id: `sniper_shot_crit_buff_${Date.now()}`,
        name: 'Sniper Focus',
        description: 'Increases Critical Chance by 20% for 3 turns.',
        icon: 'Icons/abilities/sniper_shot.jpeg',
        duration: 3,
        statModifiers: [
            { stat: 'critChance', value: 0.20, operation: 'add' }
        ]
    };
    
    caster.addBuff(critBuff);
    log(`${caster.name} gains Sniper Focus (+20% Crit Chance) for 3 turns!`, 'buff-applied');
    
    // Force stat recalculation to ensure buff takes effect immediately
    if (typeof caster.recalculateStats === 'function') {
        caster.recalculateStats('sniper_shot_buff');
    }

    // Handle Piercing Rounds talent
    if (!primaryResult.dodged && piercingChance > 0 && Math.random() < piercingChance) {
        // Find other living enemies excluding the primary target
        const enemies = caster.isAI ? 
            (window.gameManager.gameState.playerCharacters || []) : 
            (window.gameManager.gameState.aiCharacters || []);
        const potentialPierceTargets = enemies.filter(enemy =>
            !enemy.isDead() && enemy !== target
        );

        if (potentialPierceTargets.length > 0) {
            // Select a random secondary target
            const pierceTarget = potentialPierceTargets[Math.floor(Math.random() * potentialPierceTargets.length)];
            const pierceDamage = Math.floor(calculatedDamage * 0.5); // 50% damage

            // Determine if pierce shot bypasses armor (independent roll)
            let pierceBypassArmor = false;
            if (armorIgnoreChance > 0 && Math.random() < armorIgnoreChance) {
                pierceBypassArmor = true;
                 log(`Sniper Shot pierce ignores ${pierceTarget.name}'s armor!`, 'talent-effect');
                 if (window.gameManager?.showFloatingText) {
                    window.gameManager.showFloatingText(`character-${pierceTarget.instanceId || pierceTarget.id}`, 'Armor Ignored!', 'debuff');
                }
            }
            const pierceDamageOptions = { 
                bypassArmor: pierceBypassArmor,
                abilityId: 'farmer_nina_q' // Add ability ID for statistics tracking
            };


            log(`${caster.name}'s shot pierces to ${pierceTarget.name}!`, 'talent-effect');

            // Apply pierce damage
            const pierceResult = pierceTarget.applyDamage(pierceDamage, 'physical', caster, pierceDamageOptions);

            log(`${pierceTarget.name} takes ${pierceResult.damage} piercing damage${pierceResult.isCritical ? " (Critical!)" : ""}.`);

            // Optional: Add piercing shot VFX
            if (typeof showPiercingShotVFX === 'function') {
                showPiercingShotVFX(target, pierceTarget);
            }
        }
    }
};

// Store the original effect function for wrapping
const originalfarmer_ninaQEffect = farmer_ninaSniperShotEffect;

// Create wrapper function to break hiding
const wrappedfarmer_ninaSniperShotEffect = function(caster, target, abilityObj, actualManaCost, options = {}) {
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
    
    // Call the original effect function with all parameters
    return originalfarmer_ninaQEffect(caster, target, abilityObj, actualManaCost, options);
};

const farmer_ninaQ = new Ability(
    'farmer_nina_q',
    'Sniper Shot',
    'Icons/abilities/sniper_shot.jpeg',
    40, // Mana cost
    1,  // Cooldown
    wrappedfarmer_ninaSniperShotEffect
);
farmer_ninaQ.baseDescription = 'Deals {baseDamage} (+{scalingPercent}% AD) physical damage. After use, gain {critChanceBonus}% crit chance for {critBuffDuration} turns.';
farmer_ninaQ.baseDamage = 400;
farmer_ninaQ.scalingPercent = 50;
farmer_ninaQ.critChanceBonus = 20;
farmer_ninaQ.critBuffDuration = 3;
farmer_ninaQ.piercingChance = 0; // Added for talent tracking
farmer_ninaQ.generateDescription = function() {
    let desc = this.baseDescription
        .replace('{baseDamage}', this.baseDamage)
        .replace('{scalingPercent}', this.scalingPercent)
        .replace('{critChanceBonus}', this.critChanceBonus)
        .replace('{critBuffDuration}', this.critBuffDuration);

    let talentEffects = '';
    // Check for Enhanced Ammunition talent (reflected by changed baseDamage)
    if (this.baseDamage > 400) {
        talentEffects += '\n<span class="talent-effect damage">⚡ Enhanced Ammunition: Increased base damage to 600.</span>';
    }
    // Check for Piercing Rounds talent
    if (this.piercingChance && this.piercingChance > 0) {
        const pierceChancePercent = this.piercingChance * 100;
        talentEffects += `\n<span class="talent-effect damage">⚡ Piercing Rounds: ${pierceChancePercent}% chance to pierce to a second enemy for 50% damage.</span>`;
    }
    this.description = desc + talentEffects;
    return this.description;
};
farmer_ninaQ.setTargetType('enemy');
farmer_ninaQ.generateDescription(); // Initial generation

// W: Hiding
const farmer_ninaHidingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Hiding, becoming concealed and untargetable!`);
    log(`${caster.name} vanishes into the shadows, becoming almost invisible to enemies.`);

    // --- Shadow Purge Talent: Clean all debuffs from Nina ---
    if (caster && caster.abilities) {
        const hidingAbility = caster.abilities.find(a => a.id === 'farmer_nina_w');
        if (hidingAbility && hidingAbility.cleanseDebuffsOnActivation) {
            const debuffCount = caster.debuffs ? caster.debuffs.length : 0;
            if (debuffCount > 0) {
                // Clone the debuffs array to avoid modification issues during iteration
                const debuffsToRemove = [...caster.debuffs];
                debuffsToRemove.forEach(debuff => {
                    caster.removeDebuff(debuff.id);
                });
                
                log(`${caster.name}'s Shadow Purge cleanses ${debuffCount} debuff${debuffCount !== 1 ? 's' : ''}!`, 'system-update');
                
                // Add visual effect for debuff cleansing
                const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                if (casterElement) {
                    const cleanseVfx = document.createElement('div');
                    cleanseVfx.className = 'cleanse-debuff-vfx';
                    cleanseVfx.innerHTML = '<div class="cleanse-text">Debuffs Cleansed</div>';
                    casterElement.appendChild(cleanseVfx);
                    
                    // Remove after animation
                    setTimeout(() => {
                        cleanseVfx.remove();
                    }, 2000);
                }
            }
        }
    }

    // --- Rural Resourcefulness Talent: Find farm resources ---
    if (caster && caster.abilities) {
        const hidingAbility = caster.abilities.find(a => a.id === 'farmer_nina_w');
        if (hidingAbility && hidingAbility.enableFarmResources) {
            // 50% chance to find a resource
            if (Math.random() < 0.5) {
                // Find a random farm resource
                const resources = [
                    {
                        name: "Corn",
                        effect: () => {
                            // Add armor buff
                            const armorBuff = new Effect(
                                'rural_resourcefulness_corn',
                                'Corn Armor',
                                'Icons/buffs/corn_armor.webp',
                                3, // Duration: 3 turns
                                null, // No per-turn effect needed
                                false // isDebuff = false
                            );
                            
                            // Define the stat modification directly on the buff
                            const armorBoost = 0.05; // 5%
                            armorBuff.statModifiers = [
                                { stat: 'armor', operation: 'add', value: armorBoost }
                            ];
                            
                            // Remove the custom onApply/onRemove logic
                            /*
                            armorBuff.onApply = function(character) {
                                character.stats.armor = (character.stats.armor || 0) + armorBoost;
                                character.recalculateStats('corn_armor_buff');
                            };
                            
                            armorBuff.onRemove = function(character) {
                                character.stats.armor = (character.stats.armor || 0) - armorBoost;
                                character.recalculateStats('corn_armor_buff_remove');
                            };
                            */
                            
                            armorBuff.description = `Increases armor by 5%.`; // Updated description to reflect percentage
                            caster.addBuff(armorBuff);
                            
                            log(`${caster.name} found Corn while hiding! Armor increased by 5% for 3 turns.`, 'system-update');
                            showFarmResourceVFX(caster, 'corn');
                        }
                    },
                    {
                        name: "Apple",
                        effect: () => {
                            // Heal Nina instantly
                            const healAmount = 560;
                            caster.heal(healAmount, caster, { abilityId: 'farmer_nina_w' });
                            
                            log(`${caster.name} found an Apple while hiding! Healed for ${healAmount} HP.`, 'heal');
                            showFarmResourceVFX(caster, 'apple');
                        }
                    },
                    {
                        name: "Pumpkin",
                        effect: () => {
                            // Add physical damage buff
                            const damageBuff = new Effect(
                                'rural_resourcefulness_pumpkin',
                                'Pumpkin Power',
                                'Icons/buffs/pumpkin_power.webp',
                                3, // Duration: 3 turns
                                (character) => {
                                    // This is called each turn the buff is active
                                },
                                false // isDebuff = false
                            );
                            
                            damageBuff.onApply = function(character) {
                                character.stats.physicalDamage = (character.stats.physicalDamage || 0) + 50;
                                character.recalculateStats('pumpkin_power_buff');
                            };
                            
                            damageBuff.onRemove = function(character) {
                                character.stats.physicalDamage = (character.stats.physicalDamage || 0) - 50;
                                character.recalculateStats('pumpkin_power_buff_remove');
                            };
                            
                            damageBuff.description = `Increases physical damage by 50 for 3 turns.`;
                            caster.addBuff(damageBuff);
                            
                            log(`${caster.name} found a Pumpkin while hiding! Physical damage increased by 50 for 3 turns.`, 'system-update');
                            showFarmResourceVFX(caster, 'pumpkin');
                        }
                    },
                    {
                        name: "Cucumber",
                        effect: () => {
                            // Add dodge chance buff
                            const dodgeBuff = new Effect(
                                'rural_resourcefulness_cucumber',
                                'Cucumber Agility',
                                'Icons/buffs/cucumber_agility.webp',
                                3, // Duration: 3 turns
                                (character) => {
                                    // This is called each turn the buff is active
                                },
                                false // isDebuff = false
                            );
                            
                            const dodgeBoost = 0.05; // 5%
                            dodgeBuff.onApply = function(character) {
                                character.stats.dodgeChance = (character.stats.dodgeChance || 0) + dodgeBoost;
                                character.recalculateStats('cucumber_agility_buff');
                            };
                            
                            dodgeBuff.onRemove = function(character) {
                                character.stats.dodgeChance = (character.stats.dodgeChance || 0) - dodgeBoost;
                                character.recalculateStats('cucumber_agility_buff_remove');
                            };
                            
                            dodgeBuff.description = `Increases dodge chance by 5% for 3 turns.`;
                            caster.addBuff(dodgeBuff);
                            
                            log(`${caster.name} found a Cucumber while hiding! Dodge chance increased by 5% for 3 turns.`, 'system-update');
                            showFarmResourceVFX(caster, 'cucumber');
                        }
                    },
                    {
                        name: "Water Bottle",
                        effect: () => {
                            // Restore mana instantly
                            const manaAmount = 500;
                            caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + manaAmount);
                            
                            // Update UI if needed
                            if (window.gameManager && window.gameManager.uiManager) {
                                window.gameManager.uiManager.updateCharacterUI(caster);
                            }
                            
                            log(`${caster.name} found a Water Bottle while hiding! Restored ${manaAmount} mana.`, 'system-update');
                            showFarmResourceVFX(caster, 'water');
                        }
                    },
                    {
                        name: "Egg",
                        effect: () => {
                            // Add egg damage buff
                            const eggBuff = new Effect(
                                'rural_resourcefulness_egg',
                                'Explosive Egg',
                                'Icons/buffs/explosive_egg.webp',
                                3, // Duration: 3 turns
                                (character) => {
                                    // This effect runs at the end of each turn
                                    if (window.gameManager) {
                                        const enemies = window.gameManager.getOpponents(character);
                                        if (enemies && enemies.length > 0) {
                                            // Select a random enemy
                                            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                                            if (randomEnemy && !randomEnemy.isDead()) {
                                                const damageAmount = 400;
                                                randomEnemy.applyDamage(damageAmount, 'physical', character, { abilityId: 'farmer_nina_w' });
                                                
                                                // Visual effect on the target
                                                showEggExplosionVFX(randomEnemy);
                                                
                                                log(`${character.name}'s Explosive Egg deals ${damageAmount} damage to ${randomEnemy.name}!`, 'system-update');
                                            }
                                        }
                                    }
                                },
                                false // isDebuff = false
                            );
                            
                            eggBuff.description = `At the end of each turn, deal 400 damage to a random enemy for 3 turns.`;
                            caster.addBuff(eggBuff);
                            
                            log(`${caster.name} found an Egg while hiding! It will explode on a random enemy at the end of each turn for 3 turns.`, 'system-update');
                            showFarmResourceVFX(caster, 'egg');
                        }
                    }
                ];
                
                // Choose a random resource
                const randomResource = resources[Math.floor(Math.random() * resources.length)];
                
                // Apply the effect
                randomResource.effect();
            }
        }
    }

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
            character.heal(healAmount, character, { abilityId: 'farmer_nina_w' });
            const currentHealth = character.stats.currentHealth || 0;
            const actualHealAmount = currentHealth - previousHealth;

            log(`${character.name} regenerates ${actualHealAmount} HP while hiding (turn ${3 - hidingBuff.duration} of 2).`); // Updated turn count
            log(`${character.name} remains concealed and continues to evade detection.`);
        },
        false // isDebuff = false
    )
    // Override the per-turn effect function AFTER creating the base Effect object
    hidingBuff.effect = function(character) { // Use a named function or standard function expression
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        // Heal Farmer Nina at the start of her turn while hiding
        const healPercentage = 0.10; // 10% of Max HP
        let healAmount = Math.floor(character.stats.maxHp * healPercentage);
        const previousHealth = character.stats.currentHp || 0;

        // --- NEW: Check for Critical Recuperation Talent ---
        let isCriticalHeal = false;
        // Check the ability property on the *instance* of the W ability on the character
        const hidingAbilityInstance = character.abilities.find(a => a.id === 'farmer_nina_w');
        if (hidingAbilityInstance && hidingAbilityInstance.enableCriticalHidingHeal && character.stats.critChance !== undefined && Math.random() < character.stats.critChance) {
            const critDamageMultiplier = character.stats.critDamage || 1.5; // Use character's crit damage, default 1.5
            healAmount = Math.floor(healAmount * critDamageMultiplier);
            isCriticalHeal = true;
            log(`${character.name}'s Hiding critically heals! (x${critDamageMultiplier.toFixed(2)})`, 'critical-heal');
        }
        // --- END NEW ---

        // --- MODIFIED: Pass caster as source (character) and critical flag --- 
        character.heal(healAmount, character, { isCritical: isCriticalHeal, abilityId: 'farmer_nina_w' });
        // --- END MODIFIED ---
        
        const currentHealth = character.stats.currentHp || 0;
        const actualHealAmount = currentHealth - previousHealth;
        log(`${character.name} regenerates ${actualHealAmount} HP while hiding (turn ${3 - this.duration} of 2).`); // Use 'this.duration' inside the function
    };

    // Use the new generateDescription method
    hidingBuff.generateDescription = function() {
        let baseDesc = 'Cannot be directly targeted by enemies. Heals 350 HP each turn. Farmer farmer_nina is completely protected from direct damage. Breaks when damaged or when using other abilities.';
        let talentEffects = '';
        if (this.grantsDodgeChance && this.grantsDodgeChance > 0) {
             const dodgePercent = this.grantsDodgeChance * 100;
             talentEffects += `\n<span class="talent-effect utility">⚡ Shadow Stance: Gain ${dodgePercent}% dodge chance for 2 turns.</span>`;
        }
        this.description = baseDesc + talentEffects;
        return this.description;
    }
    hidingBuff.generateDescription(); // Generate initial description

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
        const wasNaturalExpiry = !hidingBuff.wasHidingBroken;
        const reason = hidingBuff.wasHidingBroken ? 
            "hiding was broken" : 
            "the effect has expired";

        log(`${character.name} is no longer hiding - ${reason}.`);
        log(`${character.name} becomes visible to enemies once again.`);

        // Remove visual stealth effect and restore opacity
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            charElement.style.opacity = '1';
            charElement.dataset.isHiding = "false";
            // Also remove any lingering cloak effects immediately
            const cloakVfx = charElement.querySelector('.hiding-vfx-container');
            if(cloakVfx) cloakVfx.remove();
        }
        
        // IMPORTANT: Remove the untargetable flag directly on character
        delete character.isUntargetable;
        delete character._hidingActive;
        
        // Log additional debug info
        console.log(`[HIDING] Buff removed with wasHidingBroken=${hidingBuff.wasHidingBroken}, natural expiry=${wasNaturalExpiry}`);
        
        // TALENT: Apply Deadly Retreat if the buff expired naturally (was not broken)
        if (wasNaturalExpiry) {
            console.log(`[HIDING] Natural expiry detected, checking for Deadly Retreat talent`);
            
            // Check if character has the Deadly Retreat talent
            if (character.appliedTalents && character.appliedTalents.includes('deadly_retreat')) {
                console.log(`[HIDING] Character has Deadly Retreat talent, applying buff`);
                
                // Apply with a slight delay to ensure all other effects are processed
                setTimeout(() => {
                    applyDeadlyRetreatBuff(character);
                }, 100);
                
                // Create and apply a visual indicator 
                const deadlyRetreatIndicator = document.createElement('div');
                deadlyRetreatIndicator.className = 'deadly-retreat-activation';
                deadlyRetreatIndicator.innerHTML = '<div class="retreat-text">DEADLY RETREAT ACTIVATED</div>';
                if (charElement) charElement.appendChild(deadlyRetreatIndicator);
                
                // Remove indicator after animation
                setTimeout(() => {
                    if (deadlyRetreatIndicator.parentNode === charElement) {
                        deadlyRetreatIndicator.remove();
                    }
                }, 2000);
            } else {
                console.log(`[HIDING] Character does not have Deadly Retreat talent`);
            }
        } else {
            console.log(`[HIDING] Hiding was broken, not applying Deadly Retreat`);
        }
    };

    // Add a more robust onRemove handler to ensure Deadly Retreat is triggered when buff expires naturally
    hidingBuff.onRemove = function(character) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const wasNaturalExpiry = !this.wasHidingBroken; // Use 'this' inside the function
        const reason = this.wasHidingBroken ? 
            "hiding was broken" : 
            "the effect has expired";

        console.log(`[HIDING] onRemove called for ${character.name}'s hiding buff. Reason: ${reason}. Natural Expiry: ${wasNaturalExpiry}`);
        log(`${character.name} is no longer hiding - ${reason}.`);
        log(`${character.name} becomes visible to enemies once again.`);
        
        // Ensure character is not untargetable (manually reset flags for extra safety)
        delete character.isUntargetable;
        delete character._hidingActive;
        
        // Reset visual appearance if needed
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            // Restore opacity
            charElement.style.opacity = '1';
            // Reset hiding flag
            charElement.dataset.isHiding = "false";
            // Remove any lingering VFX
            const cloakVfx = charElement.querySelector('.hiding-vfx-container');
            if (cloakVfx) {
                cloakVfx.remove();
                console.log('[HIDING] Removed lingering VFX in onRemove');
            }
            console.log('[HIDING] Reset opacity, data-is-hiding, and removed VFX in onRemove');
        } else {
            console.log('[HIDING] Character element not found in onRemove, cannot reset visuals.');
        }
        
        // Check if wasHidingBroken is false (meaning it expired naturally)
        if (wasNaturalExpiry) { 
            console.log(`[HIDING] Hiding expired naturally in onRemove - checking for Deadly Retreat talent`);
            
            // Check if character has the Deadly Retreat talent
            if (character.appliedTalents && character.appliedTalents.includes('deadly_retreat')) {
                console.log(`[HIDING] Deadly Retreat talent found in onRemove - applying damage buff`);
                
                // Create and apply a visual indicator 
                if (charElement) {
                    const deadlyRetreatIndicator = document.createElement('div');
                    deadlyRetreatIndicator.className = 'deadly-retreat-activation';
                    deadlyRetreatIndicator.innerHTML = '<div class="retreat-text">DEADLY RETREAT ACTIVATED</div>';
                    charElement.appendChild(deadlyRetreatIndicator);
                    
                    // Remove indicator after animation
                    setTimeout(() => {
                        if (deadlyRetreatIndicator && deadlyRetreatIndicator.parentNode === charElement) {
                            deadlyRetreatIndicator.remove();
                        }
                    }, 2000);
                }
                
                // Apply the damage buff (with delay)
                setTimeout(() => {
                    applyDeadlyRetreatBuff(character);
                }, 100);
            }
        } else {
            console.log('[HIDING] Hiding was broken, not applying Deadly Retreat from onRemove.');
        }
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

                    // Use the complete removal function
                    completelyRemoveHidingBuff(this);
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

                    // Use the helper function
                    if (hasActiveHidingBuff(target)) {
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
                    return possibleTargets;
                }

                // Filter out farmer_nina if she's hiding
                const filteredTargets = possibleTargets.filter(target => {
                    if (target && target.id === caster.id) {
                        // Use the helper function
                        if (hasActiveHidingBuff(target)) {
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
                if (farmer_nina && hasActiveHidingBuff(farmer_nina)) {
                    console.log(`%c[farmer_nina HIDING] farmer_nina is hidden and cannot be targeted by AI!`, 'background: #660000; color: white; font-weight: bold');

                    // Force farmer_nina to be untargetable
                    farmer_nina.isUntargetable = true;

                    try {
                        // Execute AI turn with this knowledge
                        const result = await gameManager._originalExecuteAITurn.call(this, aiCharacter);

                        // Remove temporary flags
                        delete farmer_nina.isUntargetable;

                        return result;
                    } catch (error) {
                        console.error(`[farmer_nina HIDING ERROR] Error in AI turn execution: ${error.message}`);
                        // Remove temporary flags even if error occurs
                        delete farmer_nina.isUntargetable;
                        throw error; // Re-throw to maintain original error handling
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
                    if (hasActiveHidingBuff(character)) {
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
                        if (hasActiveHidingBuff(target)) {
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

            caster.applyDamage = safeCall(function(amount, type, damageCaster) {
                // If hiding is active, completely block the damage
                if (hasActiveHidingBuff(this)) {
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
                return this._originalApplyDamage.call(this, amount, type, damageCaster);
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
                    if (hasActiveHidingBuff(character)) {
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

                if (gameManager._originalSelectAITurn) {
                    gameManager.selectAITurn = gameManager._originalSelectAITurn;
                    gameManager._originalSelectAITurn = null;
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

    // --- TALENT: Shadow Stance (Evasive Hiding) ---
    // Check if the talent property exists on the ability
    const hidingAbility = caster.abilities.find(a => a.id === 'farmer_nina_w');
    const grantsDodgeChance = hidingAbility?.grantsDodgeChance;

    if (grantsDodgeChance && grantsDodgeChance > 0) {
        // Create a separate buff for the dodge chance
        const shadowStanceBuff = new Effect(
            'shadow_stance_buff',
            'Shadow Stance',
            'Icons/talents/evasive_hiding.webp',
            2, // Duration: 2 turns as specified in the talent
            null, // No per-turn effect
            false // isDebuff = false
        );

        // Set description
        shadowStanceBuff.setDescription(`Increases dodge chance by ${grantsDodgeChance * 100}% for 2 turns.`);

        // Create stat modifier for dodge chance
        shadowStanceBuff.statModifiers = [{
            stat: 'dodgeChance',
            value: grantsDodgeChance,
            operation: 'add'
        }];

        // Apply the buff to the caster
        caster.addBuff(shadowStanceBuff);

        log(`${caster.name}'s Shadow Stance activates, granting ${grantsDodgeChance * 100}% dodge chance for 2 turns!`);

        // Add a visual effect for Shadow Stance
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const shadowStanceVfx = document.createElement('div');
            shadowStanceVfx.className = 'shadow-stance-vfx';
            shadowStanceVfx.innerHTML = '<div class="shadow-stance-text">+50% DODGE</div>';
            casterElement.appendChild(shadowStanceVfx);

            // Remove VFX after animation
            setTimeout(() => {
                if (shadowStanceVfx.parentNode === casterElement) {
                    shadowStanceVfx.remove();
                }
            }, 2000);
        }
    }
    // --- END TALENT ---

    // Add direct monitoring of Nina's buff list to detect hiding buff removal
    document.addEventListener('DOMContentLoaded', () => {
        // Function to set up the MutationObserver to watch for buff removal
        function setupHidingBuffObserver() {
            // Only proceed if gameManager exists
            if (!window.gameManager) {
                console.log("[HIDING OBSERVER] Game manager not found, trying again later");
                setTimeout(setupHidingBuffObserver, 1000);
                return;
            }
            
            console.log("[HIDING OBSERVER] Setting up observer for hiding buff removal");
            
            // Watch for character selection to find Nina
            const originalSelectCharacter = window.gameManager.selectCharacter;
            window.gameManager.selectCharacter = function(character) {
                // Call original method
                const result = originalSelectCharacter.call(this, character);
                
                // Check if this is Farmer Nina
                if (character && character.id === 'farmer_nina') {
                    // Set up the buff observer if it's not already set
                    if (!character._hidingBuffObserverSetup) {
                        setupBuffMonitoringForCharacter(character);
                        character._hidingBuffObserverSetup = true;
                        console.log("[HIDING OBSERVER] Set up buff monitoring for Nina");
                    }
                }
                
                return result;
            };
            
            // Set up monitoring for all existing Ninas
            if (window.gameManager.gameState && window.gameManager.gameState.playerCharacters) {
                window.gameManager.gameState.playerCharacters.forEach(char => {
                    if (char && char.id === 'farmer_nina' && !char._hidingBuffObserverSetup) {
                        setupBuffMonitoringForCharacter(char);
                        char._hidingBuffObserverSetup = true;
                        console.log("[HIDING OBSERVER] Set up buff monitoring for existing Nina");
                    }
                });
            }
        }
        
        // Function to set up monitoring for a specific character
        function setupBuffMonitoringForCharacter(character) {
            // Store original methods
            const originalAddBuff = character.addBuff;
            const originalRemoveBuff = character.removeBuff;
            
            // Track if hiding buff was active
            let hadHidingBuff = false;
            let hidingBuffWasBroken = false;
            
            // Override addBuff
            character.addBuff = function(buff) {
                // Check if this is the hiding buff
                if (buff && buff.id === 'farmer_nina_w_hiding_buff') {
                    console.log("[HIDING OBSERVER] Hiding buff added to Nina");
                    hadHidingBuff = true;
                    hidingBuffWasBroken = false;
                    
                    // Store the original wasHidingBroken state
                    if (buff.wasHidingBroken !== undefined) {
                        hidingBuffWasBroken = buff.wasHidingBroken;
                    }
                }
                
                // Call original method
                return originalAddBuff.call(this, buff);
            };
            
            // Override removeBuff
            character.removeBuff = function(buffId) {
                // Check if this is the hiding buff being removed
                if (buffId === 'farmer_nina_w_hiding_buff' && hadHidingBuff) {
                    console.log("[HIDING OBSERVER] Hiding buff is being removed");
                    
                    // Find the buff to check if it was broken
                    const hidingBuff = this.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                    if (hidingBuff) {
                        hidingBuffWasBroken = hidingBuff.wasHidingBroken || false;
                    }
                    
                    // Check if the buff expired naturally (not broken and had buff)
                    if (hadHidingBuff && !hidingBuffWasBroken) {
                        console.log("[HIDING OBSERVER] Hiding buff expired naturally!");
                        
                        // Check for Deadly Retreat talent
                        if (this.appliedTalents && this.appliedTalents.includes('deadly_retreat')) {
                            console.log("[HIDING OBSERVER] Deadly Retreat talent found - triggering damage buff");
                            
                            // Add visual notice
                            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                            log(`${this.name}'s Hiding expired naturally, activating Deadly Retreat!`, 'talent-effect');
                            
                            // Apply the damage buff
                            setTimeout(() => {
                                applyDeadlyRetreatBuff(this);
                            }, 100); // Small delay to ensure removeBuff completes first
                        }
                    } else {
                        console.log(`[HIDING OBSERVER] Hiding buff removed but was broken: ${hidingBuffWasBroken}`);
                    }
                    
                    // Reset tracking
                    hadHidingBuff = false;
                }
                
                // Call original method
                return originalRemoveBuff.call(this, buffId);
            };
            
            // Also monitor processEffects to catch when buff duration reaches 0
            const originalProcessEffects = character.processEffects;
            character.processEffects = function(shouldReduceDuration, shouldRegenerateResources) {
                // Check for hiding buff before processing
                const hidingBuff = this.buffs.find(b => b && b.id === 'farmer_nina_w_hiding_buff');
                let hidingBuffWillExpire = false;
                
                if (hidingBuff && !hidingBuff.wasHidingBroken && shouldReduceDuration) {
                    // Check if the hiding buff will expire this turn
                    hidingBuffWillExpire = hidingBuff.duration === 1;
                    
                    if (hidingBuffWillExpire) {
                        console.log("[HIDING OBSERVER] Hiding buff will expire this turn, duration:", hidingBuff.duration);
                    }
                }
                
                // Call original method
                const result = originalProcessEffects.call(this, shouldReduceDuration, shouldRegenerateResources);
                
                // Check if hiding buff expired and has Deadly Retreat
                if (hidingBuffWillExpire) {
                    // Re-check if the buff is gone
                    const stillHasHidingBuff = this.buffs.some(b => b && b.id === 'farmer_nina_w_hiding_buff');
                    
                    if (!stillHasHidingBuff) {
                        console.log("[HIDING OBSERVER] Hiding buff expired after processEffects");
                        
                        // Check for Deadly Retreat talent
                        if (this.appliedTalents && this.appliedTalents.includes('deadly_retreat')) {
                            console.log("[HIDING OBSERVER] Deadly Retreat talent found after process - triggering damage buff");
                            
                            // Apply the damage buff (with delay to ensure all processes complete)
                            setTimeout(() => {
                                applyDeadlyRetreatBuff(this);
                            }, 150);
                        }
                    }
                }
                
                return result;
            };
        }
        
        // Start the observer setup
        setupHidingBuffObserver();
    });
}

const farmer_ninaW = new Ability(
    'farmer_nina_w',
    'Hiding',
    'Icons/abilities/hiding.jpeg',
    30, // Mana cost
    5,  // Cooldown
    farmer_ninaHidingEffect
);
farmer_ninaW.baseDescription = 'Become untargetable for 2 turns and regenerate 350 HP each turn. Farmer Nina can still be damaged by AOE and DOT effects. Stealth breaks if damaged or when using other abilities.';
farmer_ninaW.grantsDodgeChance = 0; // For talent tracking
farmer_ninaW.generateDescription = function() {
    let desc = this.baseDescription;
    let talentEffects = '';
    if (this.grantsDodgeChance && this.grantsDodgeChance > 0) {
        const dodgePercent = this.grantsDodgeChance * 100;
        talentEffects += `\n<span class="talent-effect utility">⚡ Shadow Stance: Gain ${dodgePercent}% dodge chance for 2 turns.</span>`;
    }
    this.description = desc + talentEffects;
    return this.description;
};
farmer_ninaW.setTargetType('self');
farmer_ninaW.generateDescription(); // Initial generation

// E: Target Lock
const farmer_ninaTargetLockEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- TALENT: Mass Targeting Check ---
    const shouldAffectAllEnemies = caster && caster.abilities && 
        caster.abilities.find(a => a.id === 'farmer_nina_e')?.affectAllEnemies === true;
    
    if (shouldAffectAllEnemies) {
        // Get all enemies if the talent is active
        const gameManager = window.gameManager;
        if (!gameManager) {
            log("Game manager not found, AOE Target Lock cannot be applied.", "error");
            return;
        }

        const enemies = caster.isAI ? 
            gameManager.gameState.playerCharacters : 
            gameManager.gameState.aiCharacters;

        if (enemies.length === 0) {
            log(`${caster.name} uses Mass Target Lock, but there are no valid targets!`);
            return;
        }

        log(`${caster.name} uses Mass Target Lock on all enemies!`);
        playSound('sounds/target_lock_aoe.mp3', 0.8); // Optional AOE sound

        // Apply Target Lock to all enemies
        enemies.forEach(enemy => {
            if (!enemy.isDead()) {
                // Apply the visual effect and debuff to each enemy
                applyTargetLockToSingleTarget(caster, enemy);
            }
        });

        return; // Exit after applying AOE version
    }
    // --- END TALENT CHECK ---

    // Original single-target functionality
    if (!target) {
        log("Farmer Nina E: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Target Lock on ${target.name}.`);
    applyTargetLockToSingleTarget(caster, target);
};

// Helper function to apply Target Lock to a single target
function applyTargetLockToSingleTarget(caster, target) {
    if (!caster || !target || target.isDead()) return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    // Find the Target Lock ability instance on the caster to check for talent modifications
    const targetLockAbility = caster.abilities.find(a => a.id === 'farmer_nina_e');

    // Check for talent modifications
    const isPermanent = targetLockAbility?.permanentAndStackingTargetLock === true;
    const damageAmpPercent = targetLockAbility?.damageAmpPercent || 15;
    const reducesArmorBy = targetLockAbility?.reducesArmorBy || 0; // From Armor Breach talent
    const appliesDodgeReduction = targetLockAbility?.appliesDodgeReduction === true; // From Pinpointing Weakness talent

    let existingDebuff = target.debuffs.find(d => d.id === 'farmer_nina_e_target_lock');
    let currentStacks = existingDebuff ? (existingDebuff.stackCount || 1) : 0;

    // If permanent and stacking, remove old before adding new
    if (isPermanent && existingDebuff) {
        console.log(`[Target Lock - Stacking] Removing existing stack ${existingDebuff.id} from ${target.name}`);
        target.removeDebuff(existingDebuff.id);
        existingDebuff = null; // Ensure we create a new one
    }

    currentStacks++;
    const duration = isPermanent ? -1 : 10; // Fixed to match JSON: 10 turns

    console.log(`[Target Lock Apply] Caster: ${caster.name}, Target: ${target.name}, Permanent: ${isPermanent}, Stacks: ${currentStacks}, DMG Amp: ${damageAmpPercent}%, Armor Red: ${reducesArmorBy*100}%, Dodge Red: ${appliesDodgeReduction ? '8%' : 'No'}`);

    // Define base stat modifiers - using correct property name
    let statModifiers = [];

    // Add armor reduction if Armor Breach talent is active
    if (reducesArmorBy > 0) {
        statModifiers.push({ stat: 'armor', operation: 'multiply', value: 1 - reducesArmorBy }); // Reduces armor by percentage
        console.log(`  - Armor Breach active: Adding armor reduction modifier.`);
    }

    // Add dodge reduction if Pinpointing Weakness talent is active
    if (appliesDodgeReduction) {
        statModifiers.push({ stat: 'dodgeChance', operation: 'add', value: -0.08 }); // Reduce dodge chance by 8%
        console.log(`  - Pinpointing Weakness active: Adding dodge chance reduction modifier.`);
    }

    const debuffDescription = `Takes ${damageAmpPercent}% increased physical damage.${reducesArmorBy > 0 ? ` Armor reduced by ${reducesArmorBy*100}%.` : ''}${appliesDodgeReduction ? ` Dodge chance reduced by 8%.` : ''}${isPermanent ? ` (Permanent, Stacks: ${currentStacks})` : ''}`;

    const debuff = new Effect(
        'farmer_nina_e_target_lock',
        `Target Lock${isPermanent ? ` (x${currentStacks})` : ''}`,
        'Icons/abilities/target_lock.jpeg',
        duration,
        {
            type: 'vulnerability',
            damageType: 'physical',
            multiplier: 1 + (damageAmpPercent / 100)
        },
        true // isDebuff
    );

    debuff.setDescription(debuffDescription);
    debuff.statModifiers = statModifiers; // Assign the array of modifiers

    // Add specific properties for stacking logic
    if (isPermanent) {
        debuff.stackCount = currentStacks;
        debuff.isPermanent = true;
        debuff.hasArmorBreach = reducesArmorBy > 0; // Track if armor breach is active on this stack
    }

    // Apply the debuff
    target.addDebuff(debuff);

    // Play VFX
    showTargetLockVFX(target, caster);

    log(`${caster.name} applied Target Lock to ${target.name}.`);

    // Update UI immediately
    if (window.updateCharacterUI) {
        window.updateCharacterUI(target);
        window.updateCharacterUI(caster); // Update caster too (e.g., mana)
    }
}

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
);
farmer_ninaE.baseDescription = 'Marks a target, causing them to take {damageAmpPercent}% more physical damage for {duration} turns.';
farmer_ninaE.damageAmpPercent = 15;
farmer_ninaE.duration = 10;
farmer_ninaE.affectAllEnemies = false; // For talent tracking
farmer_ninaE.generateDescription = function() {
    let desc = this.baseDescription
        .replace('{damageAmpPercent}', this.damageAmpPercent)
        .replace('{duration}', this.duration);

    let talentEffects = '';
    if (this.affectAllEnemies) {
        desc = desc.replace('Marks a target', 'Marks ALL enemies'); // Adjust base description
        talentEffects += '\n<span class="talent-effect damage">⚡ Mass Targeting: Affects ALL enemies instead of a single target.</span>';
    }
    
    // Add Enhanced Targeting talent effect to description if active
    if (this.damageAmpPercent > 15) {
        talentEffects += `\n<span class="talent-effect damage">⚡ Enhanced Targeting: Increases damage amplification to ${this.damageAmpPercent}%.</span>`;
    }
    
    // Add Armor Breach talent effect to description if active
    if (this.reducesArmorBy) {
        talentEffects += `\n<span class="talent-effect damage">⚡ Armor Breach: Reduces target's armor by ${this.reducesArmorBy * 100}%.</span>`;
    }
    
    // Add Pinpointing Weakness talent effect to description if active
    if (this.appliesDodgeReduction) {
        talentEffects += `\n<span class="talent-effect debuff">⚡ Pinpointing Weakness: Reduces target's dodge chance by 8%.</span>`;
    }
    
    this.description = desc + talentEffects;
    return this.description;
};
farmer_ninaE.setTargetType('enemy');
farmer_ninaE.generateDescription(); // Initial generation

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
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'farmer_nina_r' });
    
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
);
farmer_ninaR.baseDescription = 'Fires a specialized round that deals {baseDamage} (+{scalingPercent}% AD) physical damage and completely ignores the target\'s armor.';
farmer_ninaR.baseDamage = 750;
farmer_ninaR.scalingPercent = 250;
farmer_ninaR.generateDescription = function() {
    let desc = this.baseDescription
        .replace('{baseDamage}', this.baseDamage)
        .replace('{scalingPercent}', this.scalingPercent);

    let talentEffects = '';
    // Deadly Precision talent is a character property, check caster if available
    // This is imperfect here, as the caster isn't directly available during generation
    // We might need to pass the character reference to generateDescription
    // Or, rely on the external update function to append this part
    // For now, let's assume the external function handles Deadly Precision text
    /*
    if (this.character && this.character.appliedTalents && this.character.appliedTalents.includes('deadly_precision')) {
        talentEffects += '\n<span class="talent-effect damage">⚡ Deadly Precision: Doubled Physical Damage increases scaling effectiveness.</span>';
    }
    */
    this.description = desc + talentEffects;
    return this.description;
};
farmer_ninaR.setTargetType('enemy');
farmer_ninaR.generateDescription(); // Initial generation

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

    // Register ability effects with AbilityFactory if available
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        window.AbilityFactory.registerAbilityEffect('farmer_ninaTargetLockEffect', farmer_ninaTargetLockEffect);
        console.log('[Farmer Nina] Registered Target Lock effect with AbilityFactory');
    }

    // Make functions globally available
    window.farmer_ninaTargetLockEffect = farmer_ninaTargetLockEffect;
    window.showTargetLockVFX = showTargetLockVFX;
}

// --- Target Lock Implementation ---
// Store the original applyDamage method
const originalApplyDamage = Character.prototype.applyDamage;

// Override with our version to implement Target Lock damage amplification
Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
    let finalAmount = amount; // Use let for mutable amount

    // Check if this character has the Target Lock debuff
    const hasTargetLock = this.debuffs && this.debuffs.some(d => d && d.id === 'farmer_nina_e_target_lock');

    // If Target Lock debuff is present and damage is physical, amplify the damage
    if (hasTargetLock && type === 'physical') {
        // Check if the caster has the enhanced_target_lock talent
        let damageAmpPercent = 15; // Default value
        
        // Get all characters to find Nina (who might not be the current caster)
        const allCharacters = window.gameManager ? 
            [...(window.gameManager.gameState.playerCharacters || []), 
             ...(window.gameManager.gameState.aiCharacters || [])] : [];
             
        // Find Nina character to check for the enhanced_target_lock talent
        const nina = allCharacters.find(char => char && char.id === 'farmer_nina');
        if (nina && nina.abilities) {
            const targetLockAbility = nina.abilities.find(a => a.id === 'farmer_nina_e');
            if (targetLockAbility && targetLockAbility.damageAmpPercent) {
                damageAmpPercent = targetLockAbility.damageAmpPercent;
                console.log(`[Enhanced Targeting] Using increased damage amp: ${damageAmpPercent}%`);
            }
        }
        
        // Increase damage by the effective percentage
        finalAmount = amount * (1 + (damageAmpPercent / 100));

        // Add log entry for the damage amplification
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        log(`Target Lock amplifies damage to ${this.name} by ${damageAmpPercent}%!`);
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

    // --- NEW: Combat Reflexes Dodge Detection ---
    // Apply dodge chance check before calling the original method
    const dodgeChance = this.stats.dodgeChance || 0;
    if (dodgeChance > 0) {
        const dodgeRoll = Math.random();
        
        // If dodge successful
        if (dodgeRoll < dodgeChance) {
            console.log(`[DODGE] ${this.name} dodged an attack! Roll: ${dodgeRoll.toFixed(3)}, Needed: <${dodgeChance.toFixed(3)}`);
            
            // If this is Farmer Nina and she has the Combat Reflexes talent, apply the critical buff
            if (this.id === 'farmer_nina' && this.appliedTalents && this.appliedTalents.includes('critical_dodge')) {
                console.log(`[COMBAT REFLEXES] ${this.name} triggered Combat Reflexes talent from dodge`);
                
                // Apply critical chance buff
                setTimeout(() => {
                    applyDodgeCriticalBuff(this);
                }, 100); // Short delay to ensure dodge VFX completes first
            }
            
            // Call the character's showEnhancedDodgeVFX method to trigger passive hooks
            if (typeof this.showEnhancedDodgeVFX === 'function') {
                this.showEnhancedDodgeVFX();
            } else if (window.gameManager && typeof window.gameManager.showDodgeVFX === 'function') {
                // Fallback to GameManager method if character method doesn't exist
                window.gameManager.showDodgeVFX(this);
            }
            
            // Add log entry
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} dodged the attack!`, 'system');
            
            // Zoey Agile Counterforce: apply buff when Zoey dodges
            if (this.id === 'zoey' && this.passiveHandler && typeof this.passiveHandler.applyAgileCounterforceBuff === 'function') {
                this.passiveHandler.applyAgileCounterforceBuff();
            }
            
            // Check for Parry buff - redirect damage back to attacker
            const parryBuff = this.buffs.find(buff => buff.isParryBuff);
            console.log(`[PARRY DEBUG] ${this.name} dodged. Checking for parry buff...`);
            console.log(`[PARRY DEBUG] Found parry buff:`, parryBuff);
            console.log(`[PARRY DEBUG] Caster:`, caster?.name);
            console.log(`[PARRY DEBUG] isParryRetaliation:`, options.isParryRetaliation);
            console.log(`[PARRY DEBUG] All buffs:`, this.buffs.map(b => ({ id: b.id, isParryBuff: b.isParryBuff })));
            
            if (parryBuff && caster && !options.isParryRetaliation) {
                log(`${this.name} parries the attack and redirects ${amount} damage back to ${caster.name}!`, 'system');
                console.log(`[PARRY DEBUG] Executing parry redirection!`);
                
                // Show parry redirection VFX
                if (typeof this.showParryRedirectionVFX === 'function') {
                    this.showParryRedirectionVFX(caster);
                }
                
                // Apply the original damage to the attacker (prevent infinite loops with isParryRetaliation flag)
                setTimeout(() => {
                    console.log(`[PARRY DEBUG] Applying redirected damage to ${caster.name}`);
                    caster.applyDamage(amount, type, this, { 
                        ...options, 
                        isParryRetaliation: true,
                        abilityId: 'parry_redirection'
                    });
                }, 300);
            } else {
                console.log(`[PARRY DEBUG] Parry redirection conditions not met:`, {
                    hasParryBuff: !!parryBuff,
                    hasCaster: !!caster,
                    notRetaliation: !options.isParryRetaliation
                });
            }
            
            // Return the result object without going through the original method
            return { damage: 0, isCritical: false, isDodged: true };
        }
    }
    // --- End Combat Reflexes Dodge Detection ---

    // Call the original method with our potentially modified damage amount
    // IMPORTANT: Pass 'finalAmount' instead of 'amount' AND forward options parameter
    const damageResult = originalApplyDamage.call(this, finalAmount, type, caster, options || {});
    
    // --- Implement damage to mana talent ---
    if (caster && caster.id === 'farmer_nina' && damageResult.damage > 0 && type === 'physical') {
        // Check if Nina has the damage_to_mana talent
        if (caster.damageToManaPercent) {
            const manaRestored = Math.floor(damageResult.damage * caster.damageToManaPercent);
            if (manaRestored > 0) {
                // Restore mana
                const oldMana = caster.stats.currentMana || 0;
                caster.stats.currentMana = Math.min(caster.stats.currentMana + manaRestored, caster.stats.maxMana);
                
                // Calculate actual mana restored (in case of hitting max)
                const actualManaRestored = caster.stats.currentMana - oldMana;
                
                if (actualManaRestored > 0) {
                    // Log and show VFX
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${caster.name}'s Tactical Recovery restores ${actualManaRestored} mana!`, 'talent-effect');
                    
                    // Show mana recovery VFX if significant
                    if (actualManaRestored >= 5) {
                        showManaRecoveryVFX(caster, actualManaRestored);
                    }
                    
                    // Update character UI
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(caster);
                    }
                }
            }
        }
    }
    // --- End damage to mana talent ---
    
    return damageResult;
};

// --- Add Physical Growth Talent Hook to Character.processEffects ---
// Store the original processEffects method
const originalProcessEffects = Character.prototype.processEffects;

// Override with our version to implement Survivalist Instinct talent
Character.prototype.processEffects = function(shouldReduceDuration = false, shouldRegenerateResources = true) {
    // Call the original method first
    const result = originalProcessEffects.call(this, shouldReduceDuration, shouldRegenerateResources);
    
    // Process Survivalist Instinct talent at end of turn
    if (this.id === 'farmer_nina' && shouldReduceDuration) {
        // Check if this is the end of Nina's turn (shouldReduceDuration is true at end of turn)
        if (this.appliedTalents && this.appliedTalents.includes('physical_growth')) {
            console.log(`[SURVIVALIST INSTINCT] End of turn detected for ${this.name}, processing physical growth`);
            
            // Process the physical growth talent
            setTimeout(() => {
                processPhysicalGrowthTalent(this);
            }, 100); // Short delay to ensure processEffects completes first
        }
    }
    
    return result;
};
// --- End Physical Growth Talent Hook ---

// Function to show mana recovery VFX
function showManaRecoveryVFX(character, amount) {
    if (!character) return;
    
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;
    
    // Create floating text for mana recovery
    if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
        window.gameManager.showFloatingText(`character-${character.instanceId || character.id}`, `+${amount} MP`, 'buff');
    }
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'mana-recovery-vfx';
    characterElement.appendChild(vfxContainer);
    
    // Add particles
    const particles = document.createElement('div');
    particles.className = 'mana-recovery-particles';
    vfxContainer.appendChild(particles);
    
    // Remove VFX after animation
    setTimeout(() => {
        vfxContainer.remove();
    }, 1200);
}

// Add CSS style for mana recovery VFX
document.addEventListener('DOMContentLoaded', () => {
    // Create style element
    const styleEl = document.getElementById('farmer-nina-abilities-css') || document.createElement('style');
    if (!styleEl.id) {
        styleEl.id = 'farmer-nina-abilities-css';
        document.head.appendChild(styleEl);
    }
    
    // Add CSS for mana recovery
    styleEl.textContent += `
        .mana-recovery-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10;
        }
        
        .mana-recovery-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            overflow: visible;
        }
        
        .mana-recovery-particles::before,
        .mana-recovery-particles::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: rgba(64, 144, 255, 0.8);
            box-shadow: 0 0 10px rgba(64, 144, 255, 0.6);
            animation: mana-recovery-particle-flow 1.2s ease-out;
        }
        
        .mana-recovery-particles::before {
            left: 30%;
            top: 50%;
        }
        
        .mana-recovery-particles::after {
            left: 70%;
            top: 40%;
        }
        
        @keyframes mana-recovery-particle-flow {
            0% {
                transform: translateY(20px) scale(0.3);
                opacity: 0;
            }
            20% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            80% {
                transform: translateY(-60px) scale(0.8);
                opacity: 0.8;
            }
            100% {
                transform: translateY(-80px) scale(0.3);
                opacity: 0;
            }
        }
    `;
});

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
            buff.statModifiers = [
                { stat: testBuff.stat, value: testBuff.value, operation: 'add' }
            ];
            
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
        
        // Mark hiding as broken only if it's not a natural expiration
        // This is useful when debugging or force-removing the buff outside of normal gameplay
        // Check if duration exists and is greater than 0. If duration is exactly 0, it's expiring naturally.
        const isForceRemoval = hidingBuff.duration && hidingBuff.duration > 0;
        
        if (isForceRemoval) {
            // Mark hiding as broken only for forced removal (duration > 0)
            if (hidingBuff) hidingBuff.wasHidingBroken = true; 
            console.log(`[HIDING] Force-removing hiding buff with ${hidingBuff ? hidingBuff.duration : 'unknown'} duration remaining - marking as broken`);
        } else {
            console.log(`[HIDING] Removing expired hiding buff - not marking as broken`);
        }

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

// Add CSS for the Deadly Retreat activation animation
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for Deadly Retreat activation
    const styleEl = document.getElementById('farmer-nina-talents-css') || document.createElement('style');
    if (!styleEl.id) {
        styleEl.id = 'farmer-nina-talents-css';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent += `
        .deadly-retreat-activation {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
            pointer-events: none;
            animation: deadly-retreat-activate 2s forwards;
        }
        
        .retreat-text {
            background-color: rgba(220, 50, 50, 0.9);
            color: white;
            padding: 8px 15px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            box-shadow: 0 0 20px rgba(255, 100, 100, 0.8);
            transform: scale(0);
            animation: retreat-text-scale 1.5s forwards;
        }
        
        @keyframes deadly-retreat-activate {
            0% { background-color: rgba(220, 50, 50, 0.3); }
            30% { background-color: rgba(220, 50, 50, 0.6); }
            70% { background-color: rgba(220, 50, 50, 0.6); }
            100% { background-color: rgba(220, 50, 50, 0); }
        }
        
        @keyframes retreat-text-scale {
            0% { transform: scale(0) rotate(-5deg); }
            20% { transform: scale(1.2) rotate(5deg); }
            30% { transform: scale(1) rotate(0deg); }
            70% { transform: scale(1) rotate(0deg); }
            90% { transform: scale(1.1) rotate(3deg); }
            100% { transform: scale(0) rotate(-5deg); }
        }
    `;
});

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
                const healAmount = character.heal(350, character, { abilityId: 'farmer_nina_w' });
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
        const damageResult = ninaCharacter.applyDamage(100, 'physical', null, { abilityId: 'test_damage' });
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

// Add function to initialize Nina with Deadly Precision talent effects
function initializeNinaDeadlyPrecision(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    // Check if character has the talent applied by checking appliedTalents array
    const hasDeadlyPrecision = character.appliedTalents && 
                               character.appliedTalents.includes('deadly_precision');
    
    if (hasDeadlyPrecision) {
        console.log(`[Deadly Precision] Applied to ${character.name} - Physical damage doubled!`);
        
        // Add visual indicator for doubled damage
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (characterElement) {
            // Add data attribute for CSS targeting
            characterElement.setAttribute('data-has-deadly-precision', 'true');
            
            setTimeout(() => {
                const deadlyPrecisionVfx = document.createElement('div');
                deadlyPrecisionVfx.className = 'deadly-precision-vfx';
                
                const damageText = document.createElement('div');
                damageText.className = 'deadly-precision-text';
                damageText.textContent = '2× DMG';
                deadlyPrecisionVfx.appendChild(damageText);
                
                characterElement.appendChild(deadlyPrecisionVfx);
                
                // Add log entry
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${character.name}'s Deadly Precision talent doubles her Physical Damage!`, 'talent-effect');
                }
            }, 500); // Add after character is rendered
        }
        
        // Update ability descriptions to reflect doubled damage
        updateNinaAbilityDescriptions(character);
    }
}

// Function to update ability descriptions to reflect talent effects
function updateNinaAbilityDescriptions(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    // Check if character has the Deadly Precision talent
    const hasDeadlyPrecision = character.appliedTalents && 
                               character.appliedTalents.includes('deadly_precision');
    
    if (!hasDeadlyPrecision) return;
    
    // Update descriptions for abilities that deal physical damage
    character.abilities.forEach(ability => {
        if (ability.id === 'farmer_nina_q') { // Sniper Shot
            let baseDesc = ability.baseDescription || ability.description;
            if (!ability.originalDescription) {
                ability.originalDescription = baseDesc; // Store original
            }
            
            // Add talent info to description
            if (!baseDesc.includes('Deadly Precision')) {
                ability.description = `${baseDesc}\n<span class="talent-effect damage">Deadly Precision: Deals double damage from doubled Physical Damage.</span>`;
            }
        }
        
        if (ability.id === 'farmer_nina_e') { // Piercing Shot
            let baseDesc = ability.baseDescription || ability.description;
            if (!ability.originalDescription) {
                ability.originalDescription = baseDesc; // Store original
            }
            
            // Add talent info to description
            if (!baseDesc.includes('Deadly Precision')) {
                ability.description = `${baseDesc}\n<span class="talent-effect damage">Deadly Precision: Deals double damage from doubled Physical Damage.</span>`;
            }
        }
    });
}

// Add CSS for the Deadly Precision VFX
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .deadly-precision-vfx {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
            pointer-events: none;
        }
        
        .deadly-precision-text {
            background-color: rgba(255, 50, 50, 0.8);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
            animation: deadly-precision-pulse 2s infinite;
        }
        
        @keyframes deadly-precision-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
});

// Add event listener to initialize Nina with Deadly Precision when character is loaded
document.addEventListener('CharacterLoaded', function(event) {
    const character = event.detail.character;
    if (character && character.id === 'farmer_nina') {
        initializeNinaDeadlyPrecision(character);
    }
});

// Hook into game initialization to ensure the talent is applied
if (typeof window !== 'undefined' && window.GameManager && window.GameManager.prototype && window.GameManager.prototype.initialize) {
    const originalGameManagerInitialize = window.GameManager.prototype.initialize;
    if (originalGameManagerInitialize) {
        window.GameManager.prototype.initialize = async function() {
            await originalGameManagerInitialize.call(this);
            
            // After initialization, check for Nina in the player characters
            if (this.gameState && this.gameState.playerCharacters) {
                const nina = this.gameState.playerCharacters.find(char => char.id === 'farmer_nina');
                if (nina) {
                    initializeNinaDeadlyPrecision(nina);
                }
            }
        };
    }
}

// Modify wrapped Sniper Shot and Piercing Shot effects to show doubled damage feedback

// Original wrapper
const originalSniperShotWrapper = wrappedfarmer_ninaSniperShotEffect;
wrappedfarmer_ninaSniperShotEffect = function(caster, target) {
    // Add VFX for Deadly Precision before the shot if talent is active
    if (caster && caster.id === 'farmer_nina' && 
        caster.appliedTalents && caster.appliedTalents.includes('deadly_precision')) {
        
        // Create doubled damage flash effect
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const doubleEffectVfx = document.createElement('div');
            doubleEffectVfx.className = 'doubled-damage-flash';
            doubleEffectVfx.textContent = '2× DMG';
            casterElement.appendChild(doubleEffectVfx);
            
            setTimeout(() => {
                if (doubleEffectVfx.parentNode) {
                    doubleEffectVfx.remove();
                }
            }, 1000);
        }
    }
    
    // Call original wrapper
    return originalSniperShotWrapper.call(this, caster, target);
};

// Original wrapper
const originalPiercingShotWrapper = wrappedfarmer_ninaPiercingShotEffect;
wrappedfarmer_ninaPiercingShotEffect = function(caster, target) {
    // Add VFX for Deadly Precision before the shot if talent is active
    if (caster && caster.id === 'farmer_nina' && 
        caster.appliedTalents && caster.appliedTalents.includes('deadly_precision')) {
        
        // Create doubled damage flash effect
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const doubleEffectVfx = document.createElement('div');
            doubleEffectVfx.className = 'doubled-damage-flash';
            doubleEffectVfx.textContent = '2× DMG';
            casterElement.appendChild(doubleEffectVfx);
            
            setTimeout(() => {
                if (doubleEffectVfx.parentNode) {
                    doubleEffectVfx.remove();
                }
            }, 1000);
        }
    }
    
    // Call original wrapper
    return originalPiercingShotWrapper.call(this, caster, target);
};

// Add CSS for doubled damage flash
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .doubled-damage-flash {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 50, 50, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 18px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
            z-index: 100;
            animation: doubled-damage-flash 1s forwards;
            pointer-events: none;
        }
        
        @keyframes doubled-damage-flash {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Add this function to update ability descriptions based on talents
function updateNinaAbilityDescriptionsForTalents(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[NinaTalents] Updating ability descriptions for talents...`);
    
    // Update Target Lock description if Mass Targeting talent is applied
    const targetLockAbility = character.abilities.find(a => a.id === 'farmer_nina_e');
    if (targetLockAbility) {
        let damageAmpPercent = targetLockAbility.damageAmpPercent || 15;
        let description = `Marks a target, causing them to take ${damageAmpPercent}% more physical damage for 10 turns.`;
        let talentEffects = '';
        
        if (targetLockAbility.affectAllEnemies) {
            description = `Marks ALL enemies, causing them to take ${damageAmpPercent}% more physical damage for 10 turns.`;
            talentEffects += '\n<span class="talent-effect damage">⚡ Mass Targeting: Affects ALL enemies instead of a single target.</span>';
            
            console.log(`[NinaTalents] Updated Target Lock description for Mass Targeting talent`);
        }
        
        // Check for Enhanced Targeting talent
        if (damageAmpPercent > 15) {
            talentEffects += `\n<span class="talent-effect damage">⚡ Enhanced Targeting: Increases damage amplification to ${damageAmpPercent}%.</span>`;
            console.log(`[NinaTalents] Updated Target Lock description for Enhanced Targeting talent`);
        }
        
        // Add Pinpointing Weakness talent effect to description if active
        if (targetLockAbility.appliesDodgeReduction) {
            talentEffects += `\n<span class="talent-effect debuff">⚡ Pinpointing Weakness: Reduces target's dodge chance by 8%.</span>`;
        }
        
        // Apply the updated description with talent effects
        const finalDescription = description + talentEffects;
        
        // Update UI if generated
        if (typeof targetLockAbility.setDescription === 'function') {
            targetLockAbility.setDescription(finalDescription);
            if (typeof targetLockAbility.generateDescription === 'function') {
                targetLockAbility.generateDescription();
            }
        } else {
            targetLockAbility.description = finalDescription;
        }
    }
    
    // Add passive description update for the Tactical Recovery talent
    if (character.passive) {
        let passiveDescription = 'All buffs applied to Farmer Nina are twice as powerful.';
        let talentEffects = '';
        
        // Extended Protection talent
        if (character.appliedTalents && character.appliedTalents.includes('extended_protection')) {
            talentEffects += '\n<span class="talent-effect utility">⚡ Extended Protection: All buffs last 2 turns longer.</span>';
        }
        
        // Tactical Recovery talent
        if (character.damageToManaPercent && character.damageToManaPercent > 0) {
            const manaPercent = character.damageToManaPercent * 100;
            talentEffects += `\n<span class="talent-effect resource">⚡ Tactical Recovery: Restore ${manaPercent}% of physical damage dealt as mana.</span>`;
            console.log(`[NinaTalents] Updated Passive description for Tactical Recovery talent`);
        }
        
        // Apply the updated description with talent effects
        character.passive.description = passiveDescription + talentEffects;
    }
    
    // Update Hiding description if Shadow Stance or Deadly Retreat talent is applied
    const hidingAbility = character.abilities.find(a => a.id === 'farmer_nina_w');
    if (hidingAbility) {
        let description = 'Become untargetable for 2 turns and regenerate 350 HP each turn. Farmer Nina can still be damaged by AOE and DOT effects. Stealth breaks if damaged or when using other abilities.';
        let talentEffects = '';
        
        // Shadow Stance talent
        if (hidingAbility.grantsDodgeChance) {
            const dodgePercent = hidingAbility.grantsDodgeChance * 100;
            talentEffects += `\n<span class="talent-effect utility">⚡ Shadow Stance: Gain ${dodgePercent}% dodge chance for 2 turns.</span>`;
            
            console.log(`[NinaTalents] Updated Hiding description for Shadow Stance talent`);
        }
        
        // Deadly Retreat talent
        if (character.appliedTalents && character.appliedTalents.includes('deadly_retreat')) {
            talentEffects += `\n<span class="talent-effect damage">⚡ Deadly Retreat: When hiding expires naturally, gain 12% Physical Damage for 2 turns.</span>`;
            
            console.log(`[NinaTalents] Updated Hiding description for Deadly Retreat talent`);
        }
        
        // Apply the updated description with talent effects
        const finalDescription = description + talentEffects;
        
        // Update UI if generated
        if (typeof hidingAbility.generateDescription === 'function') {
            hidingAbility.setDescription(finalDescription);
            hidingAbility.generateDescription();
        } else {
            hidingAbility.description = finalDescription;
        }
    }
    
    // Update Sniper Shot description for Enhanced Ammunition and Piercing Rounds talents
    const sniperShotAbility = character.abilities.find(a => a.id === 'farmer_nina_q');
    if (sniperShotAbility) {
        // Start with base description
        let baseDamage = 400;
        let scalingPercent = 50; // Default scaling percent
        let description = `Deals ${baseDamage} (+${scalingPercent}% AD) physical damage. After use, gain 20% crit chance for 3 turns.`;
        let talentEffects = '';
        
        // Check for Enhanced Ammunition talent
        if (sniperShotAbility.baseDamage && sniperShotAbility.baseDamage > 400) {
            baseDamage = sniperShotAbility.baseDamage;
            description = `Deals ${baseDamage} (+${scalingPercent}% AD) physical damage. After use, gain 20% crit chance for 3 turns.`;
            talentEffects += '\n<span class="talent-effect damage">⚡ Enhanced Ammunition: Increased base damage to 600.</span>';
            console.log(`[NinaTalents] Updated Sniper Shot description for Enhanced Ammunition talent`);
        }
        
        // Check for Focused Precision talent
        if (sniperShotAbility.damageScalingPercent && sniperShotAbility.damageScalingPercent > 0.5) {
            scalingPercent = Math.floor(sniperShotAbility.damageScalingPercent * 100);
            description = `Deals ${baseDamage} (+${scalingPercent}% AD) physical damage. After use, gain 20% crit chance for 3 turns.`;
            talentEffects += '\n<span class="talent-effect damage">⚡ Focused Precision: Increased damage scaling from 50% to 75% of Physical Damage.</span>';
            console.log(`[NinaTalents] Updated Sniper Shot description for Focused Precision talent`);
        }
        
        // Check for Piercing Rounds talent
        if (sniperShotAbility.piercingChance && sniperShotAbility.piercingChance > 0) {
            const pierceChance = sniperShotAbility.piercingChance * 100;
            talentEffects += `\n<span class="talent-effect damage">⚡ Piercing Rounds: ${pierceChance}% chance to hit an additional enemy for 50% damage.</span>`;
            console.log(`[NinaTalents] Updated Sniper Shot description for Piercing Rounds talent`);
        }
        
        // Add Deadeye info if present
        if (character.appliedTalents && character.appliedTalents.includes('deadeye')) {
            talentEffects += '\n<span class="talent-effect damage">⚡ Deadeye: +10% critical strike chance for all attacks.</span>';
            console.log(`[NinaTalents] Updated Sniper Shot description for Deadeye talent`);
        }
        
        // Apply the updated description with talent effects
        const finalDescription = description + talentEffects;
        
        // Update UI if generated
        if (typeof sniperShotAbility.generateDescription === 'function') {
            sniperShotAbility.setDescription(finalDescription);
            sniperShotAbility.generateDescription();
        } else {
            sniperShotAbility.description = finalDescription;
        }
    }
    
    // Update Piercing Shot description if any relevant talents are applied
    const piercingShotAbility = character.abilities.find(a => a.id === 'farmer_nina_r');
    if (piercingShotAbility) {
        let description = 'Fires a specialized round that deals 750 (+250% AD) physical damage and completely ignores the target\'s armor.';
        let talentEffects = '';
        
        // Deadly Precision doubles Physical Damage, which affects the scaling
        if (character.appliedTalents && character.appliedTalents.includes('deadly_precision')) {
            talentEffects += '\n<span class="talent-effect damage">⚡ Deadly Precision: Doubled Physical Damage increases scaling effectiveness.</span>';
        }
        
        // Add Bloodthirst info if present
        if (character.appliedTalents && character.appliedTalents.includes('bloodthirst')) {
            talentEffects += '\n<span class="talent-effect utility">⚡ Bloodthirst: 15% lifesteal converts damage to healing.</span>';
            console.log(`[NinaTalents] Updated Piercing Shot description for Bloodthirst talent`);
        }
        
        // Apply the updated description with talent effects
        const finalDescription = description + talentEffects;
        
        // Update UI if generated
        if (typeof piercingShotAbility.generateDescription === 'function') {
            piercingShotAbility.setDescription(finalDescription);
            piercingShotAbility.generateDescription();
        } else {
            piercingShotAbility.description = finalDescription;
        }
    }
    
    // Update Passive description for Extended Protection talent
    if (character.passive) {
        let passiveDescription = 'All buffs applied to Farmer Nina are twice as powerful.';
        let talentEffects = '';
        
        // Extended Protection talent
        if (character.appliedTalents && character.appliedTalents.includes('extended_protection')) {
            talentEffects += '\n<span class="talent-effect utility">⚡ Extended Protection: All buffs last 2 turns longer.</span>';
            console.log(`[NinaTalents] Updated Passive description for Extended Protection talent`);
        }
        
        // Apply the updated description with talent effects
        character.passive.description = passiveDescription + talentEffects;
    }
    
    // Force UI update
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(character);
    }
}

// Make sure talent effects are updated when abilities are shown or used
// Add this to ensure talent effects are visible
function ensureTalentDescriptionsAreUpdated(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log("[NinaTalents] Ensuring talent descriptions are updated");
    
    // Update descriptions for all abilities to reflect talents
    updateNinaAbilityDescriptionsForTalents(character);
    
    // Update visual effects
    applyTalentVisualEffects(character);
}

// Register callbacks
document.addEventListener('AbilityUsed', function(event) {
    const caster = event.detail.caster;
    if (caster && caster.id === 'farmer_nina') {
        setTimeout(() => ensureTalentDescriptionsAreUpdated(caster), 100);
    }
});

document.addEventListener('AbilitySelected', function(event) {
    const character = event.detail.character;
    if (character && character.id === 'farmer_nina') {
        setTimeout(() => ensureTalentDescriptionsAreUpdated(character), 100);
    }
});

// Track applied talents and apply visual indicators
function applyTalentVisualEffects(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[NinaTalents] Applying visual effects for talents...`);
    
    // Get character element
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) {
        console.warn(`[NinaTalents] Character element not found for visual effects.`);
        return;
    }
    
    // Reset and update all data attributes
    // Deadly Precision
    characterElement.dataset.hasDeadlyPrecision = (character.appliedTalents && character.appliedTalents.includes('deadly_precision')).toString();
    
    // Shadow Stance 
    characterElement.dataset.hasShadowStance = (character.appliedTalents && character.appliedTalents.includes('evasive_hiding')).toString();
    
    // Bloodthirst
    characterElement.dataset.hasBloodthirst = (character.appliedTalents && character.appliedTalents.includes('bloodthirst')).toString();
    
    // Deadeye
    characterElement.dataset.hasDeadeye = (character.appliedTalents && character.appliedTalents.includes('deadeye')).toString();
    
    // Combat Reflexes (critical_dodge)
    characterElement.dataset.hasCombatReflexes = (character.appliedTalents && character.appliedTalents.includes('critical_dodge')).toString();
    
    // Critical Power
    characterElement.dataset.hasCriticalPower = (character.appliedTalents && character.appliedTalents.includes('critical_power')).toString();
    
    // Survivalist Instinct (physical_growth)
    characterElement.dataset.hasSurvivalistInstinct = (character.appliedTalents && character.appliedTalents.includes('physical_growth')).toString();
    
    // Tactical Recovery (damage_to_mana)
    characterElement.dataset.hasTacticalRecovery = (character.appliedTalents && character.appliedTalents.includes('damage_to_mana')).toString();
    
    // Armor Breach
    characterElement.dataset.hasArmorBreach = (character.appliedTalents && character.appliedTalents.includes('armor_breach')).toString();
    
    // Bullet Rain
    characterElement.dataset.hasBulletRain = (character.appliedTalents && character.appliedTalents.includes('bullet_rain')).toString();
    
    // Enhanced Ammunition
    characterElement.dataset.hasEnhancedAmmo = character.abilities.some(a => a.id === 'farmer_nina_q' && a.baseDamage > 400).toString();
    
    // Focused Precision - new talent
    characterElement.dataset.hasFocusedPrecision = (character.appliedTalents && character.appliedTalents.includes('focused_precision')).toString();
    
    // Rural Resourcefulness - new talent
    characterElement.dataset.hasRuralResourcefulness = (character.appliedTalents && character.appliedTalents.includes('rural_resourcefulness')).toString();
    
    // Add talent indicators div if not already present
    let talentIndicatorsDiv = characterElement.querySelector('.talent-indicators');
    if (!talentIndicatorsDiv) {
        talentIndicatorsDiv = document.createElement('div');
        talentIndicatorsDiv.className = 'talent-indicators';
        characterElement.appendChild(talentIndicatorsDiv);
    } else {
        // Clear existing indicators
        talentIndicatorsDiv.innerHTML = '';
    }
    
    // Update talent indicators
    updateTalentIndicators(character, characterElement);
}

// Update talent indicators
function updateTalentIndicators(character, characterElement) {
    if (!character || !characterElement) return;
    
    // Create talent indicators container if it doesn't exist
    let indicatorsContainer = characterElement.querySelector('.talent-indicators');
    if (!indicatorsContainer) {
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'talent-indicators';
        characterElement.appendChild(indicatorsContainer);
    }
    
    // Clear existing indicators
    indicatorsContainer.innerHTML = '';
    
    const addIndicator = (className, text, condition) => {
        if (condition) {
            const indicator = document.createElement('div');
            indicator.className = `talent-indicator ${className}`;
            indicator.textContent = text;
            indicator.title = text;
            indicatorsContainer.appendChild(indicator);
        }
    };
    
    // Add indicators for existing talents
    addIndicator('bloodthirst', 'L', character.stats.lifesteal > 0);
    addIndicator('deadeye', 'C', character.appliedTalents && character.appliedTalents.includes('deadeye'));
    addIndicator('damage-to-mana', 'M', character.damageToManaPercent > 0);
    addIndicator('enhanced-target-lock', 'T', character.abilities.some(a => a.id === 'farmer_nina_e' && a.damageAmpPercent >= 30));
    addIndicator('critical-power', 'P', character.enableCriticalPowerBuff);
    addIndicator('focused-precision', 'F', character.abilities.some(a => a.id === 'farmer_nina_q' && a.damageScalingPercent >= 0.75));
    
    // Add indicators for new talents
    addIndicator('debuff-exploitation', 'D', character.damagePerDebuff > 0);
    addIndicator('shadow-purge', 'S', character.abilities.some(a => a.id === 'farmer_nina_w' && a.cleanseDebuffsOnActivation));
    addIndicator('rural-resourcefulness', 'R', character.abilities.some(a => a.id === 'farmer_nina_w' && a.enableFarmResources));
    
    // Update data attributes for CSS targeting
    characterElement.dataset.hasDebuffExploitation = character.damagePerDebuff > 0 ? "true" : "false";
    characterElement.dataset.hasRuralResourcefulness = character.abilities.some(a => a.id === 'farmer_nina_w' && a.enableFarmResources) ? "true" : "false";
    
    // Also update data attributes for other talents for CSS targeting
    characterElement.dataset.hasDeadlyPrecision = character.appliedTalents && character.appliedTalents.includes('deadly_precision') ? "true" : "false";
    characterElement.dataset.hasShadowStance = character.abilities.some(a => a.id === 'farmer_nina_w' && a.grantsDodgeChance > 0) ? "true" : "false";
    characterElement.dataset.hasDeadeye = character.appliedTalents && character.appliedTalents.includes('deadeye') ? "true" : "false";
}

function initializeBulletRainEvent(character) {
    if (!character || !character.enableBulletRain) return;
    
    console.log(`[BULLET RAIN] Setting up event listeners for ${character.name}`);
    
    // Listen for multiple possible turn start events
    const events = ['turnStart', 'TurnStart', 'playerTurnStart', 'characterTurnStart'];
    events.forEach(eventName => {
        document.addEventListener(eventName, function(event) {
            const currentCharacter = event.detail && event.detail.character;
            if (currentCharacter && currentCharacter.id === character.id) {
                console.log(`[BULLET RAIN] Turn start detected for ${character.name} via ${eventName} event`);
                processBulletRainTalent(character);
            }
        });
    });
    
    // Alternative: also check at phase change to ensure we don't miss the turn
    document.addEventListener('phaseChange', function(event) {
        const currentPhase = event.detail && event.detail.phase;
        const currentCharacter = event.detail && event.detail.character;
        
        if (currentPhase === 'player' && currentCharacter && currentCharacter.id === character.id) {
            console.log(`[BULLET RAIN] Player phase start detected for ${character.name}`);
            processBulletRainTalent(character);
        }
    });
    
    // Setup manual trigger for testing
    if (window.gameManager) {
        // Add a method to the character to manually trigger bullet rain
        character.triggerBulletRain = function() {
            console.log(`[BULLET RAIN] Manually triggering Bullet Rain for ${character.name}`);
            processBulletRainTalent(character);
        };
        
        // Add a custom event handler for turn detection
        const originalStartTurn = window.gameManager.startTurn;
        if (originalStartTurn && typeof originalStartTurn === 'function') {
            window.gameManager.startTurn = function(character) {
                const result = originalStartTurn.apply(this, arguments);
                
                // Check if it's Nina's turn and she has the talent
                if (character && character.id === 'farmer_nina' && 
                    character.appliedTalents && 
                    character.appliedTalents.includes('bullet_rain')) {
                    console.log(`[BULLET RAIN] Turn start detected via startTurn hook`);
                    processBulletRainTalent(character);
                }
                
                return result;
            };
        }
    }
    
    // For testing - add global function to trigger bullet rain manually
    window.testBulletRain = function() {
        if (character) {
            console.log(`[BULLET RAIN] Test function called for ${character.name}`);
            processBulletRainTalent(character);
            return "Bullet Rain test executed";
        }
        return "Character not found";
    };
}

// Add to existing initialization functions
function initializeNewTalents(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[TALENT INIT] Initializing talents for ${character.name}`);
    
    // Initialize existing talents
    initializeDodgeCriticalEvent(character);
    initializePhysicalGrowthEvent(character);
    initializeCriticalPowerTalent(character);
    initializeArmorBreachTalent(character);
    
    // Initialize new Bullet Rain talent
    initializeBulletRainTalent(character);
}

(function initializeFarmerNinaTalents() {
    console.log('[NinaTalents] Self-executing function to initialize Farmer Nina talents');
    
    function checkAndSetupNina() {
        // Look for Nina in the game
        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            console.log('[NinaTalents] Game manager not ready, trying again in 1s...');
            setTimeout(checkAndSetupNina, 1000);
            return;
        }
        
        let ninaFound = false;
        
        // Check player characters
        if (gameManager.gameState.playerCharacters) {
            const nina = gameManager.gameState.playerCharacters.find(char => char && char.id === 'farmer_nina');
            if (nina) {
                console.log('[NinaTalents] Found Nina in player characters');
                
                // Apply Evasive Adaptability passive
                updateNinaDodgeFromBuffs(nina);
                
                initializeNinaDeadlyPrecision(nina);
                setupHidingVisualEffects(nina);
                updateNinaAbilityDescriptions(nina);
                applyTalentVisualEffects(nina);
                
                // Initialize new talents
                initializeCombatReflexesTalent(nina);
                initializeSurvivalistInstinctTalent(nina);
                initializeCriticalPowerTalent(nina);
                initializeArmorBreachTalent(nina);
                initializeBulletRainTalent(nina); // Added initializer for Bullet Rain
                
                // Set flag to prevent duplicate initialization
                nina._talentsInitialized = true;
                ninaFound = true;
            }
        }
        
        // Check AI characters
        if (gameManager.gameState.aiCharacters) {
            const nina = gameManager.gameState.aiCharacters.find(char => char && char.id === 'farmer_nina');
            if (nina) {
                console.log('[NinaTalents] Found Nina in AI characters');
                
                // Apply Evasive Adaptability passive
                updateNinaDodgeFromBuffs(nina);
                
                initializeNinaDeadlyPrecision(nina);
                setupHidingVisualEffects(nina);
                updateNinaAbilityDescriptions(nina);
                applyTalentVisualEffects(nina);
                
                // Initialize new talents
                initializeCombatReflexesTalent(nina);
                initializeSurvivalistInstinctTalent(nina);
                initializeCriticalPowerTalent(nina);
                initializeArmorBreachTalent(nina);
                initializeBulletRainTalent(nina); // Added initializer for Bullet Rain
                
                // Set flag to prevent duplicate initialization
                nina._talentsInitialized = true;
                ninaFound = true;
            }
        }
        
        // If not found at all, try again later
        if (!ninaFound) {
            console.log('[NinaTalents] Nina not found in game state, trying again in 1s...');
            setTimeout(checkAndSetupNina, 1000);
        }
    }
    
    // Start checking once the game is loaded
    if (document.readyState === 'complete') {
        checkAndSetupNina();
    } else {
        window.addEventListener('load', checkAndSetupNina);
    }
})();

// Add a direct hook into character.js processEffects method
function addProcessEffectsHook() {
    // Wait for Character class to be available
    if (typeof window.Character !== 'function') {
        console.log('[BULLET RAIN] Character class not found, waiting...');
        setTimeout(addProcessEffectsHook, 500);
        return;
    }
    
    console.log('[BULLET RAIN] Adding processEffects hook for Bullet Rain talent');
    
    // Store original processEffects method
    const originalProcessEffects = window.Character.prototype.processEffects;
    
    // Replace with our enhanced version
    window.Character.prototype.processEffects = function(shouldReduceDuration, shouldRegenerateResources) {
        // First, check if this is Nina and she has the Bullet Rain talent
        if (this.id === 'farmer_nina' && 
            this.appliedTalents && 
            this.appliedTalents.includes('bullet_rain') && 
            shouldReduceDuration) { // Only trigger on actual turn start
            
            console.log(`[BULLET RAIN] Character.processEffects hook triggered for ${this.name}`);
            
            // Trigger Bullet Rain at the start of turn
            if (typeof processBulletRainTalent === 'function') {
                console.log(`[BULLET RAIN] Triggering Bullet Rain from processEffects hook`);
                processBulletRainTalent(this);
            } else {
                console.warn(`[BULLET RAIN] processBulletRainTalent function not found`);
            }
        }
        
        // Call original method
        return originalProcessEffects.apply(this, arguments);
    };
    
    console.log('[BULLET RAIN] Successfully added processEffects hook');
}

// Execute to add hook
setTimeout(addProcessEffectsHook, 1000);

// For debugging: Add global function to register with GameManager's onTurnStart
function registerBulletRainWithGameManager() {
    if (!window.gameManager) {
        console.log('[BULLET RAIN] GameManager not found, waiting...');
        setTimeout(registerBulletRainWithGameManager, 500);
        return;
    }
    
    if (typeof window.gameManager.onTurnStart === 'function') {
        // This is already a function, hook into it
        const originalOnTurnStart = window.gameManager.onTurnStart;
        window.gameManager.onTurnStart = function(character) {
            // Call original function
            const result = originalOnTurnStart.apply(this, arguments);
            
            // Check for Nina with Bullet Rain
            if (character && character.id === 'farmer_nina' && 
                character.appliedTalents && 
                character.appliedTalents.includes('bullet_rain')) {
                
                console.log(`[BULLET RAIN] GameManager.onTurnStart hook triggered for ${character.name}`);
                if (typeof processBulletRainTalent === 'function') {
                    processBulletRainTalent(character);
                }
            }
            
            return result;
        };
        console.log('[BULLET RAIN] Successfully hooked into GameManager.onTurnStart');
    } else {
        // Create the function
        window.gameManager.onTurnStart = function(character) {
            // Check for Nina with Bullet Rain
            if (character && character.id === 'farmer_nina' && 
                character.appliedTalents && 
                character.appliedTalents.includes('bullet_rain')) {
                
                console.log(`[BULLET RAIN] GameManager.onTurnStart called for ${character.name}`);
                if (typeof processBulletRainTalent === 'function') {
                    processBulletRainTalent(character);
                }
            }
        };
        console.log('[BULLET RAIN] Successfully added GameManager.onTurnStart');
    }
}

// Execute to register with GameManager
setTimeout(registerBulletRainWithGameManager, 1500);

// Global test function to manually trigger Bullet Rain from console
window.testBulletRainNow = function() {
    console.log('[BULLET RAIN] Manual test function called');
    
    if (!window.gameManager || !window.gameManager.gameState) {
        console.error('[BULLET RAIN] GameManager or game state not available');
        return "Error: Game not properly initialized";
    }
    
    // Find Nina in player characters
    let nina = null;
    
    if (window.gameManager.gameState.playerCharacters) {
        nina = window.gameManager.gameState.playerCharacters.find(char => 
            char && char.id === 'farmer_nina');
        
        if (nina) {
            console.log('[BULLET RAIN] Found Nina in player characters');
        }
    }
    
    // If not found in player characters, check AI characters
    if (!nina && window.gameManager.gameState.aiCharacters) {
        nina = window.gameManager.gameState.aiCharacters.find(char => 
            char && char.id === 'farmer_nina');
            
        if (nina) {
            console.log('[BULLET RAIN] Found Nina in AI characters');
        }
    }
    
    if (!nina) {
        console.error('[BULLET RAIN] Nina not found in game state');
        return "Error: Nina not found in game";
    }
    
    // Ensure Nina has the Bullet Rain talent
    if (!nina.appliedTalents || !nina.appliedTalents.includes('bullet_rain')) {
        console.warn('[BULLET RAIN] Nina does not have the Bullet Rain talent');
        
        // For testing, proceed anyway
        console.log('[BULLET RAIN] Forcing talent for testing purposes');
        nina.appliedTalents = nina.appliedTalents || [];
        if (!nina.appliedTalents.includes('bullet_rain')) {
            nina.appliedTalents.push('bullet_rain');
        }
        nina.enableBulletRain = true;
    }
    
    // Log current enemy state
    const enemies = nina.isAI ? 
        window.gameManager.gameState.playerCharacters : 
        window.gameManager.gameState.aiCharacters;
        
    console.log(`[BULLET RAIN] Available enemies: ${enemies.length}`);
    enemies.forEach(enemy => {
        if (enemy && enemy.debuffs) {
            console.log(`[BULLET RAIN] Enemy ${enemy.name} has ${enemy.debuffs.length} debuffs:`, 
                enemy.debuffs.map(d => d.id).join(', '));
        }
    });
    
    // For testing - apply Target Lock to all enemies if none have it
    const hasLockedEnemies = enemies.some(enemy => 
        enemy && !enemy.isDead() && enemy.debuffs && 
        enemy.debuffs.some(d => d.id === 'farmer_nina_e_target_lock' || d.id.includes('target_lock'))
    );
    
    if (!hasLockedEnemies) {
        console.log('[BULLET RAIN] No locked enemies found, applying Target Lock to all enemies for testing');
        
        // Apply Target Lock to all enemies
        enemies.forEach(enemy => {
            if (enemy && !enemy.isDead()) {
                // Create Target Lock debuff
                const targetLock = new window.Effect(
                    'farmer_nina_e_target_lock',
                    'Target Lock',
                    'Icons/abilities/target_lock.webp',
                    3, // Duration
                    null, // No per-turn effect
                    true // Is debuff
                );
                
                // Add effect details
                targetLock.effects = {
                    damageAmpPercent: 15
                };
                
                // Add debuff to enemy
                if (typeof enemy.addDebuff === 'function') {
                    enemy.addDebuff(targetLock);
                    console.log(`[BULLET RAIN] Applied test Target Lock to ${enemy.name}`);
                }
            }
        });
    }
    
    // Execute Bullet Rain
    console.log('[BULLET RAIN] Executing Bullet Rain effect');
    processBulletRainTalent(nina);
    
    return "Bullet Rain test executed - check console for details";
};

// Add this to the existing applyTalentVisualEffects function
function applyTalentVisualEffects(character) {
    if (!character || character.id !== 'farmer_nina') return;
    console.log(`[NinaTalents] Applying visual effects for Nina's talents`);
    
    // Get character element
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) {
        console.warn(`[NinaTalents] Character element not found for ${character.name}`);
        return;
    }
    
    // Reset and update all data attributes
    // Deadly Precision
    characterElement.dataset.hasDeadlyPrecision = (character.appliedTalents && character.appliedTalents.includes('deadly_precision')).toString();
    
    // Shadow Stance 
    characterElement.dataset.hasShadowStance = (character.appliedTalents && character.appliedTalents.includes('evasive_hiding')).toString();
    
    // Bloodthirst
    characterElement.dataset.hasBloodthirst = (character.appliedTalents && character.appliedTalents.includes('bloodthirst')).toString();
    
    // Deadeye
    characterElement.dataset.hasDeadeye = (character.appliedTalents && character.appliedTalents.includes('deadeye')).toString();
    
    // Combat Reflexes (critical_dodge)
    characterElement.dataset.hasCombatReflexes = (character.appliedTalents && character.appliedTalents.includes('critical_dodge')).toString();
    
    // Critical Power
    characterElement.dataset.hasCriticalPower = (character.appliedTalents && character.appliedTalents.includes('critical_power')).toString();
    
    // Survivalist Instinct (physical_growth)
    characterElement.dataset.hasSurvivalistInstinct = (character.appliedTalents && character.appliedTalents.includes('physical_growth')).toString();
    
    // Tactical Recovery (damage_to_mana)
    characterElement.dataset.hasTacticalRecovery = (character.appliedTalents && character.appliedTalents.includes('damage_to_mana')).toString();
    
    // Armor Breach
    characterElement.dataset.hasArmorBreach = (character.appliedTalents && character.appliedTalents.includes('armor_breach')).toString();
    
    // Bullet Rain
    characterElement.dataset.hasBulletRain = (character.appliedTalents && character.appliedTalents.includes('bullet_rain')).toString();
    
    // Enhanced Ammunition
    characterElement.dataset.hasEnhancedAmmo = character.abilities.some(a => a.id === 'farmer_nina_q' && a.baseDamage > 400).toString();
    
    // Focused Precision - new talent
    characterElement.dataset.hasFocusedPrecision = (character.appliedTalents && character.appliedTalents.includes('focused_precision')).toString();
    
    // Rural Resourcefulness - new talent
    characterElement.dataset.hasRuralResourcefulness = (character.appliedTalents && character.appliedTalents.includes('rural_resourcefulness')).toString();
    
    // Add talent indicators div if not already present
    let talentIndicatorsDiv = characterElement.querySelector('.talent-indicators');
    if (!talentIndicatorsDiv) {
        talentIndicatorsDiv = document.createElement('div');
        talentIndicatorsDiv.className = 'talent-indicators';
        characterElement.appendChild(talentIndicatorsDiv);
    } else {
        // Clear existing indicators
        talentIndicatorsDiv.innerHTML = '';
    }
    
    // Update talent indicators
    updateTalentIndicators(character, characterElement);
}

// Add to existing initialization functions
function initializeNewTalents(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[TALENT INIT] Initializing talents for ${character.name}`);
    
    // Apply Evasive Adaptability passive immediately
    updateNinaDodgeFromBuffs(character);
    
    // Initialize existing talents
    initializeDodgeCriticalEvent(character);
    initializePhysicalGrowthEvent(character);
    initializeCriticalPowerTalent(character);
    initializeArmorBreachTalent(character);
    
    // Initialize new Bullet Rain talent
    initializeBulletRainTalent(character);
}

// Patch the Character.prototype.calculateDamage method to consider the debuff count
if (!window._originalCharacterCalculateDamage && Character.prototype.calculateDamage) {
    window._originalCharacterCalculateDamage = Character.prototype.calculateDamage;
    
    Character.prototype.calculateDamage = function(baseDamage, type, target = null) {
        let finalDamage = window._originalCharacterCalculateDamage.call(this, baseDamage, type, target);
        
        // Apply Debuff Exploitation talent (damage increase per debuff)
        if (this.id === 'farmer_nina' && this.damagePerDebuff && this.damagePerDebuff > 0 && target) {
            if (target.debuffs && target.debuffs.length > 0) {
                const debuffCount = target.debuffs.length;
                const damageIncrease = this.damagePerDebuff * debuffCount;
                const originalDamage = finalDamage;
                
                // Apply percentage increase for each debuff
                finalDamage = Math.floor(finalDamage * (1 + damageIncrease));
                
                // Log the damage increase
                console.log(`[Debuff Exploitation] ${this.name} dealing ${Math.round(damageIncrease * 100)}% bonus damage (${debuffCount} debuffs) - ${originalDamage} → ${finalDamage}`);
                
                // Show VFX for Debuff Exploitation if possible
                if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
                    const elementId = this.instanceId || this.id;
                    window.gameManager.showFloatingText(`character-${elementId}`, `+${Math.round(damageIncrease * 100)}% DMG (${debuffCount} debuffs)`, 'buff');
                }
                
                // Add log entry
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${this.name}'s Debuff Exploitation increases damage by ${Math.round(damageIncrease * 100)}% (${debuffCount} debuffs on target)!`, 'talent-effect');
                }
            }
        }
        
        return finalDamage;
    };
    
    console.log('[Nina Talents] Successfully patched Character.calculateDamage method for Debuff Exploitation');
}

// Update Hiding ability description for Shadow Purge talent
function updateHidingDescriptionForShadowPurge(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    const hidingAbility = character.abilities.find(a => a.id === 'farmer_nina_w');
    if (hidingAbility) {
        const originalGenerateDescription = hidingAbility.generateDescription;
        
        hidingAbility.generateDescription = function() {
            let description = "";
            
            // Call original if it exists
            if (typeof originalGenerateDescription === 'function') {
                description = originalGenerateDescription.call(this);
            } else {
                description = this.baseDescription || '';
                
                // Add Shadow Stance talent effect if active
                if (this.grantsDodgeChance && this.grantsDodgeChance > 0) {
                    const dodgePercent = this.grantsDodgeChance * 100;
                    description += `\n<span class="talent-effect utility">⚡ Shadow Stance: Gain ${dodgePercent}% dodge chance for 2 turns.</span>`;
                }
                
                // Add Critical Recuperation talent effect if active
                if (this.enableCriticalHidingHeal) {
                    description += `\n<span class="talent-effect healing">⚡ Critical Recuperation: Healing can critically hit based on Critical Strike chance.</span>`;
                }
                
                // Add Deadly Retreat talent effect if active  
                if (this.enablePostHidingDamageBuff) {
                    description += `\n<span class="talent-effect damage">⚡ Deadly Retreat: Gain 12% Physical Damage for 2 turns when Hiding expires naturally.</span>`;
                }
            }
            
            // Add Shadow Purge talent effect if active
            if (this.cleanseDebuffsOnActivation && !description.includes("Shadow Purge")) {
                description += `\n<span class="talent-effect utility">⚡ Shadow Purge: Cleanses all debuffs when activated.</span>`;
            }
            
            this.description = description;
            return description;
        };
        
        // Generate updated description
        hidingAbility.description = hidingAbility.generateDescription();
    }
}

// Initialize the new talents for Nina
function initializeNinaNewTalents(character) {
    if (!character || character.id !== 'farmer_nina') return;
    
    console.log(`[NinaTalents] Initializing new talents for ${character.name}...`);
    
    // Initialize Debuff Exploitation talent if selected
    if (character.appliedTalents && character.appliedTalents.includes('debuff_exploitation')) {
        character.damagePerDebuff = 0.1; // 10% damage per debuff
        console.log(`[NinaTalents] Initialized Debuff Exploitation (10% damage per debuff)`);
    }
    
    // Initialize Shadow Purge talent if selected
    if (character.appliedTalents && character.appliedTalents.includes('cleanse_on_hiding')) {
        const hidingAbility = character.abilities.find(a => a.id === 'farmer_nina_w');
        if (hidingAbility) {
            hidingAbility.cleanseDebuffsOnActivation = true;
            updateHidingDescriptionForShadowPurge(character);
            console.log(`[NinaTalents] Initialized Shadow Purge (cleanses debuffs on hiding)`);
        }
    }
    
    // Initialize Rural Resourcefulness talent if selected
    if (character.appliedTalents && character.appliedTalents.includes('rural_resourcefulness')) {
        const hidingAbility = character.abilities.find(a => a.id === 'farmer_nina_w');
        if (hidingAbility) {
            hidingAbility.enableFarmResources = true;
            initializeRuralResourcefulness(character);
            console.log(`[NinaTalents] Initialized Rural Resourcefulness (farm resources on hiding)`);
        }
    }
}

// Modify initializeNewTalents to include our new talents
const originalInitializeNewTalents = initializeNewTalents;
initializeNewTalents = function(character) {
    // Call the original function first
    if (typeof originalInitializeNewTalents === 'function') {
        originalInitializeNewTalents(character);
    }
    
    // Then initialize our new talents
    initializeNinaNewTalents(character);
};

// Add CSS for the cleanse effect
(function addCssForDebuffCleanse() {
    const style = document.createElement('style');
    style.textContent = `
        .cleanse-debuff-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            animation: cleanse-pulse 1s ease-out forwards;
        }
        
        .cleanse-text {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(100, 200, 255, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            animation: cleanse-text-float 1.5s ease-out forwards;
        }
        
        @keyframes cleanse-pulse {
            0% { background-color: rgba(100, 200, 255, 0.1); box-shadow: 0 0 10px 5px rgba(100, 200, 255, 0.3) inset; }
            50% { background-color: rgba(100, 200, 255, 0.2); box-shadow: 0 0 15px 8px rgba(100, 200, 255, 0.5) inset; }
            100% { background-color: rgba(100, 200, 255, 0); box-shadow: 0 0 0 0 rgba(100, 200, 255, 0) inset; }
        }
        
        @keyframes cleanse-text-float {
            0% { transform: translateX(-50%) translateY(0); opacity: 0; }
            20% { transform: translateX(-50%) translateY(-10px); opacity: 1; }
            80% { transform: translateX(-50%) translateY(-30px); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-40px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// Initialize our talents when the game loads
(function initializeNewNinaTalents() {
    // Wait for the document to be ready
    document.addEventListener('DOMContentLoaded', () => {
        // Function to check for Nina and set up talents
        function checkAndSetupNina() {
            if (window.gameManager && window.gameManager.gameState) {
                const playerChars = window.gameManager.gameState.playerCharacters || [];
                const ninaChar = playerChars.find(char => char && char.id === 'farmer_nina');
                
                if (ninaChar) {
                    console.log('[Nina New Talents] Found Nina, initializing talents...');
                    
                    // Initialize new talents
                    initializeNinaNewTalents(ninaChar);
                    
                    return true; // Setup complete
                }
            }
            
            // If we get here, Nina wasn't found or talents weren't initialized
            console.log('[Nina New Talents] Nina not found yet, trying again later...');
            setTimeout(checkAndSetupNina, 1000); // Try again in 1 second
            return false;
        }
        
        // Start checking
        checkAndSetupNina();
    });
})();

// Helper function to show farm resource visual effects
function showFarmResourceVFX(character, resourceType) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    const vfxContainer = document.createElement('div');
    vfxContainer.className = `farm-resource-vfx ${resourceType}-vfx`;
    characterElement.appendChild(vfxContainer);

    const resourceIcon = document.createElement('div');
    resourceIcon.className = `resource-icon ${resourceType}-icon`;
    vfxContainer.appendChild(resourceIcon);

    const resourceText = document.createElement('div');
    resourceText.className = 'resource-text';
    resourceText.textContent = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    vfxContainer.appendChild(resourceText);

    // Remove VFX after animation completes
    setTimeout(() => {
        vfxContainer.remove();
    }, 2500);
}

// Helper function to show egg explosion visual effects
function showEggExplosionVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'egg-explosion-vfx';
    targetElement.appendChild(vfxContainer);

    const explosionIcon = document.createElement('div');
    explosionIcon.className = 'explosion-icon';
    vfxContainer.appendChild(explosionIcon);

    // Remove VFX after animation completes
    setTimeout(() => {
        vfxContainer.remove();
    }, 1500);
}

// Function to initialize the Rural Resourcefulness talent
function initializeRuralResourcefulness(character) {
    console.log("[NINA TALENTS] Initializing Rural Resourcefulness for", character.name);
    
    // Update Hiding ability description to include farm resources
    const hidingAbility = character.abilities.find(a => a.id === 'farmer_nina_w');
    if (hidingAbility && hidingAbility.enableFarmResources) {
        const originalGenerateDescription = hidingAbility.generateDescription;
        
        hidingAbility.generateDescription = function() {
            // Call the original function to get the base description
            let description = originalGenerateDescription.call(this);
            
            // Add the Rural Resourcefulness talent effect
            description += `\n<span class="talent-effect utility">⚡ Rural Resourcefulness: 50% chance to find farm resources that grant additional effects.</span>`;
            
            return description;
        };
        
        // Update the description immediately
        hidingAbility.description = hidingAbility.generateDescription();
    }
}

/**
 * Show Target Lock VFX - Creates reticle and targeting effects
 */
function showTargetLockVFX(target, caster) {
    if (!target) return;
    
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Play target lock sound
    playSound('sounds/target_lock.mp3', 0.8);

    // Create the main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'target-lock-vfx';
    targetElement.appendChild(vfxContainer);

    // Create the targeting reticle
    const reticle = document.createElement('div');
    reticle.className = 'target-lock-reticle';
    vfxContainer.appendChild(reticle);

    // Create the lock icon
    const lockIcon = document.createElement('div');
    lockIcon.className = 'target-lock-icon';
    lockIcon.innerHTML = '🎯';
    vfxContainer.appendChild(lockIcon);

    // Create floating "LOCKED" text
    const lockText = document.createElement('div');
    lockText.className = 'target-lock-text';
    lockText.textContent = 'LOCKED';
    vfxContainer.appendChild(lockText);

    // Show targeting beam from caster to target (if caster is available)
    if (caster) {
        showTargetingBeam(caster, target);
    }

    // Apply visual indicator to target
    targetElement.classList.add('target-locked');
    
    // Add data attribute for stacking/permanent effects
    const debuff = target.debuffs?.find(d => d.id === 'farmer_nina_e_target_lock');
    if (debuff?.stackCount) {
        targetElement.setAttribute('data-target-lock-stacks', debuff.stackCount);
    }
    if (debuff?.isPermanent) {
        targetElement.setAttribute('data-target-lock-permanent', 'true');
    }

    // Remove initial VFX after animation (but keep the indicator)
    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.remove();
        }
    }, 3000);

    log(`🎯 ${target.name} is marked with Target Lock!`, 'debuff');
}

/**
 * Show targeting beam from caster to target
 */
function showTargetingBeam(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    
    if (!casterElement || !targetElement) return;

    // Create beam element
    const beam = document.createElement('div');
    beam.className = 'targeting-beam';
    document.body.appendChild(beam);

    // Get positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    // Calculate beam properties
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Position and style the beam
    beam.style.position = 'fixed';
    beam.style.left = startX + 'px';
    beam.style.top = startY + 'px';
    beam.style.width = distance + 'px';
    beam.style.height = '3px';
    beam.style.background = 'linear-gradient(to right, rgba(255, 0, 0, 0.8), rgba(255, 100, 100, 0.6), rgba(255, 0, 0, 0.8))';
    beam.style.transformOrigin = '0 50%';
    beam.style.transform = `rotate(${angle}deg)`;
    beam.style.boxShadow = '0 0 8px rgba(255, 0, 0, 0.8), 0 0 16px rgba(255, 0, 0, 0.4)';
    beam.style.zIndex = '999';
    beam.style.pointerEvents = 'none';
    beam.style.animation = 'targeting-beam-fade 2s ease-out forwards';

    // Remove beam after animation
    setTimeout(() => {
        if (beam.parentNode) {
            beam.remove();
        }
    }, 2000);
}

// Add CSS styles for Target Lock VFX if not already present
(function addTargetLockStyles() {
    if (document.getElementById('target-lock-vfx-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'target-lock-vfx-styles';
    styleSheet.textContent = `
        /* Target Lock VFX Container */
        .target-lock-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 20;
        }

        /* Targeting Reticle */
        .target-lock-reticle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            transform: translate(-50%, -50%);
            border: 2px solid #ff0000;
            border-radius: 50%;
            animation: reticle-lock 2s ease-out forwards;
        }

        .target-lock-reticle::before,
        .target-lock-reticle::after {
            content: '';
            position: absolute;
        }

        .target-lock-reticle::before {
            top: -2px;
            left: 50%;
            width: 2px;
            height: 20px;
            background: #ff0000;
            transform: translateX(-50%);
        }

        .target-lock-reticle::after {
            top: 50%;
            left: -2px;
            width: 20px;
            height: 2px;
            background: #ff0000;
            transform: translateY(-50%);
        }

        @keyframes reticle-lock {
            0% {
                transform: translate(-50%, -50%) scale(2) rotate(0deg);
                opacity: 0;
                border-color: rgba(255, 0, 0, 0.3);
            }
            30% {
                transform: translate(-50%, -50%) scale(1.5) rotate(90deg);
                opacity: 0.7;
                border-color: rgba(255, 0, 0, 0.8);
            }
            70% {
                transform: translate(-50%, -50%) scale(1) rotate(180deg);
                opacity: 1;
                border-color: #ff0000;
            }
            100% {
                transform: translate(-50%, -50%) scale(1) rotate(270deg);
                opacity: 0.8;
                border-color: #ff0000;
            }
        }

        /* Target Lock Icon */
        .target-lock-icon {
            position: absolute;
            top: 10%;
            right: 10%;
            font-size: 20px;
            text-shadow: 0 0 8px rgba(255, 0, 0, 0.8);
            animation: target-lock-pulse 2s ease-in-out infinite;
        }

        @keyframes target-lock-pulse {
            0%, 100% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.2);
                filter: brightness(1.5);
            }
        }

        /* Target Lock Text */
        .target-lock-text {
            position: absolute;
            top: 25%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff0000;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 
                0 0 4px rgba(0, 0, 0, 0.8),
                0 0 8px rgba(255, 0, 0, 0.6);
            background-color: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255, 0, 0, 0.5);
            animation: target-lock-text-fade 3s ease-out forwards;
        }

        @keyframes target-lock-text-fade {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(10px);
            }
            20% {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            80% {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            100% {
                opacity: 0;
                transform: translateX(-50%) translateY(-10px);
            }
        }

        /* Targeting Beam */
        @keyframes targeting-beam-fade {
            0% {
                opacity: 0;
                transform: scaleY(0) rotate(var(--beam-angle, 0deg));
            }
            20% {
                opacity: 1;
                transform: scaleY(1) rotate(var(--beam-angle, 0deg));
            }
            80% {
                opacity: 0.8;
                transform: scaleY(1) rotate(var(--beam-angle, 0deg));
            }
            100% {
                opacity: 0;
                transform: scaleY(1) rotate(var(--beam-angle, 0deg));
            }
        }

        /* Target Locked State */
        .character.target-locked {
            position: relative;
        }

        .character.target-locked::after {
            content: '🎯';
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 16px;
            text-shadow: 0 0 6px rgba(255, 0, 0, 0.8);
            animation: target-locked-indicator 2s ease-in-out infinite;
            z-index: 10;
        }

        @keyframes target-locked-indicator {
            0%, 100% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
        }

        /* Stack indicators for permanent stacking Target Lock */
        .character[data-target-lock-stacks]::after {
            content: '🎯 x' attr(data-target-lock-stacks);
        }

        .character[data-target-lock-permanent="true"]::after {
            color: #ff6666;
            font-weight: bold;
            animation: permanent-target-lock 1.5s ease-in-out infinite;
        }

        @keyframes permanent-target-lock {
            0%, 100% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.15);
                filter: brightness(1.3);
            }
        }
    `;
    document.head.appendChild(styleSheet);
})();