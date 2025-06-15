// Hotshot Dual Shot Ability Implementation
// Deals 614 damage to two random targets (can be the same). If any shot crits, 50% chance to fire again infinitely.

/**
 * Execute a dual shot with potential infinite chaining
 * @param {Character} caster - The character using the ability
 * @param {Character|Array} targetOrTargets - The target(s) (for custom abilities, this might be ignored)
 * @param {Ability} abilityInstance - The ability instance with properties
 * @param {number} chainCount - Current chain count (for VFX variety)
 */
async function executeDualShot(caster, targetOrTargets, abilityInstance, chainCount = 0) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Get game manager instance
    const gameManager = window.gameManager;
    if (!gameManager || !gameManager.gameState) {
        console.error('[Dual Shot] Game manager not found');
        return false;
    }

    // Get all possible targets (enemies of the caster)
    const allTargets = gameManager.getOpponents(caster).filter(target => !target.isDead());
    
    if (allTargets.length === 0) {
        log(`${caster.name} fires Dual Shot into empty air - no targets available!`, 'system');
        return false;
    }

    // Determine chain prefix for logging
    const chainPrefix = chainCount > 0 ? ` (Chain ${chainCount + 1})` : '';
    const baseDamage = abilityInstance?.baseDamage || 614;
    
    log(`${caster.name} fires a Dual Shot${chainPrefix}!`, 'ability');
    
    // Play gunshot sound
    playSound('sounds/gunshot.mp3', 0.8);
    
    // Select two random targets (can be the same)
    const target1 = allTargets[Math.floor(Math.random() * allTargets.length)];
    const target2 = allTargets[Math.floor(Math.random() * allTargets.length)];
    
    const targets = [target1, target2];
    const shotResults = [];
    let anyShotCrit = false;
    
    // Fire both shots
    for (let i = 0; i < 2; i++) {
        const currentTarget = targets[i];
        const shotNumber = i + 1;
        
        // Apply damage with crit check
        const damageResult = currentTarget.applyDamage(baseDamage, 'physical', caster, {
            abilityId: caster.id.includes('diablo') ? 'hotshot_diablo_dual_shot' : 'hotshot_diabla_dual_shot'
        });
        
        shotResults.push(damageResult);
        
        // Track if any shot crit
        if (damageResult.isCritical) {
            anyShotCrit = true;
        }
        
        // Log individual shot
        const targetName = currentTarget.name;
        const sameTarget = target1 === target2 ? ' (same target)' : '';
        log(`Shot ${shotNumber} hits ${targetName}${sameTarget} for ${damageResult.damage} damage${damageResult.isCritical ? ' (Critical!)' : ''}`, 
            damageResult.isCritical ? 'critical' : 'damage');
        
        // Show VFX for each shot
        showDualShotVFX(caster, currentTarget, shotNumber, chainCount);
        
        // Small delay between shots for visual clarity
        if (i === 0) {
            await delay(300);
        }
    }
    
    // Apply lifesteal for total damage if caster has it
    const totalDamage = shotResults.reduce((sum, result) => sum + result.damage, 0);
    if (caster.stats.lifesteal > 0 && totalDamage > 0) {
        caster.applyLifesteal(totalDamage);
    }
    
    // Check for chain reaction if any shot crit
    if (anyShotCrit && abilityInstance?.chainOnCrit) {
        const chainChance = abilityInstance.chainChance || 0.5;
        
        if (Math.random() < chainChance) {
            log(`${caster.name}'s critical shots trigger another Dual Shot!`, 'chain-effect');
            
            // Add slight delay before chaining
            await delay(600);
            
            // Check if targets are still available
            const remainingTargets = gameManager.getOpponents(caster).filter(target => !target.isDead());
            if (remainingTargets.length > 0) {
                // Recursively chain the ability
                await executeDualShot(caster, null, abilityInstance, chainCount + 1);
            } else {
                log(`${caster.name}'s Dual Shot chain ends - no targets remaining!`, 'system');
            }
        } else {
            log(`${caster.name}'s critical shots fail to trigger another shot.`, 'system');
        }
    }
    
    return true;
}

/**
 * Create VFX for dual shot
 */
function showDualShotVFX(caster, target, shotNumber, chainCount) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!casterElement || !targetElement) return;
        
        // Create muzzle flash on caster
        const muzzleFlash = document.createElement('div');
        muzzleFlash.className = `dual-shot-muzzle-flash shot-${shotNumber}`;
        if (chainCount > 0) muzzleFlash.classList.add('chain-shot');
        casterElement.appendChild(muzzleFlash);
        
        // Create bullet trail
        const bulletTrail = document.createElement('div');
        bulletTrail.className = `dual-shot-bullet-trail shot-${shotNumber}`;
        if (chainCount > 0) bulletTrail.classList.add('chain-shot');
        
        // Calculate trajectory
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        // Position bullet trail
        bulletTrail.style.left = `${startX}px`;
        bulletTrail.style.top = `${startY}px`;
        bulletTrail.style.width = `${distance}px`;
        bulletTrail.style.transform = `rotate(${angle}deg)`;
        
        document.body.appendChild(bulletTrail);
        
        // Create impact effect on target
        const impactEffect = document.createElement('div');
        impactEffect.className = `dual-shot-impact shot-${shotNumber}`;
        if (chainCount > 0) impactEffect.classList.add('chain-shot');
        targetElement.appendChild(impactEffect);
        
        // Cleanup VFX after animation
        setTimeout(() => {
            if (muzzleFlash.parentNode) muzzleFlash.remove();
            if (bulletTrail.parentNode) bulletTrail.remove();
            if (impactEffect.parentNode) impactEffect.remove();
        }, 1000);
        
    } catch (error) {
        console.error('[Dual Shot VFX] Error creating visual effects:', error);
    }
}

/**
 * Delay utility function
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main effect function that gets called by the ability system
const hotshotDualShotEffect = async (caster, targetOrTargets, abilityInstance) => {
    try {
        return await executeDualShot(caster, targetOrTargets, abilityInstance);
    } catch (error) {
        console.error('[Dual Shot] Error executing ability:', error);
        return false;
    }
};

/**
 * Armor Piercer ability effect - applies a buff that makes critical strikes reduce target armor
 */
const hotshotArmorPiercerEffect = (caster, target, abilityInstance) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    log(`${caster.name} activates Armor Piercer!`, 'ability');
    
    // Check if caster already has the buff
    const existingBuff = caster.buffs?.find(b => b.id === 'armor_piercer_buff');
    
    if (existingBuff) {
        // Refresh duration instead of stacking
        existingBuff.duration = abilityInstance?.buffDuration || 3;
        log(`${caster.name}'s Armor Piercer duration refreshed for ${existingBuff.duration} turns!`, 'buff-applied');
    } else {
        // Create new armor piercer buff
        const armorPiercerBuff = new Effect(
            'armor_piercer_buff',
            'Armor Piercer',
            'Icons/abilities/armor_piercer.png',
            abilityInstance?.buffDuration || 3,
            null, // No per-turn effect
            false // Not a debuff
        );
        
        armorPiercerBuff.setDescription('Critical strikes permanently reduce target armor by 2% (stacking).');
        
        // Visual effect handlers
        armorPiercerBuff.onApply = (character) => {
            // Add visual indicator
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (characterElement) {
                characterElement.classList.add('armor-piercer-active');
                
                // Create floating buff indicator
                const buffIndicator = document.createElement('div');
                buffIndicator.className = 'armor-piercer-indicator';
                buffIndicator.innerHTML = '🎯';
                characterElement.appendChild(buffIndicator);
                
                setTimeout(() => {
                    if (buffIndicator.parentNode) buffIndicator.remove();
                }, 2000);
            }
            return true;
        };
        
        armorPiercerBuff.onRemove = (character) => {
            // Remove visual indicator
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (characterElement) {
                characterElement.classList.remove('armor-piercer-active');
            }
            return true;
        };
        
        // Apply the buff to the caster
        caster.addBuff(armorPiercerBuff);
        log(`${caster.name} gains Armor Piercer for ${armorPiercerBuff.duration} turns!`, 'buff-applied');
    }
    
    return true;
};

/**
 * Set up critical strike hook for armor piercer effect
 */
function setupArmorPiercerHook() {
    // Remove this function as we'll use the event system instead
}

/**
 * Apply armor reduction debuff to a target
 */
function applyArmorReductionDebuff(target, caster) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // Check if target already has armor reduction stacks
    let existingDebuff = target.debuffs?.find(d => d.id === 'armor_reduction_debuff');
    
    if (existingDebuff) {
        // Increase stack count
        existingDebuff.stacks = (existingDebuff.stacks || 1) + 1;
        existingDebuff.armorReduction = existingDebuff.stacks * 0.02; // 2% per stack
        
        // Update description to show current stacks
        existingDebuff.description = `Armor reduced by ${Math.round(existingDebuff.armorReduction * 100)}% (${existingDebuff.stacks} stacks). This effect is permanent.`;
        
        // Update the stat modifier to reflect new stack count
        existingDebuff.statModifiers = [
            { stat: 'armor', operation: 'multiply', value: 1 - existingDebuff.armorReduction }
        ];
        
        // Force stat recalculation
        if (typeof target.recalculateStats === 'function') {
            target.recalculateStats('armor_reduction_debuff_stack');
        }
        
        log(`${target.name}'s armor is further weakened! (${existingDebuff.stacks} stacks, -${Math.round(existingDebuff.armorReduction * 100)}% armor)`, 'debuff-applied');
    } else {
        // Create new armor reduction debuff
        const armorReductionDebuff = new Effect(
            'armor_reduction_debuff',
            'Armor Weakness',
            'Icons/abilities/armor_piercer.png',
            -1, // Permanent
            null, // No per-turn effect
            true // Is a debuff
        );
        
        // Set up stacking properties
        armorReductionDebuff.stacks = 1;
        armorReductionDebuff.armorReduction = 0.02; // 2% reduction
        armorReductionDebuff.setDescription('Armor reduced by 2% (1 stack). This effect is permanent.');
        
        // Apply the armor reduction
        armorReductionDebuff.statModifiers = [
            { stat: 'armor', operation: 'multiply', value: 0.98 } // 2% reduction
        ];
        
        armorReductionDebuff.onApply = (character) => {
            // Visual effect
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (characterElement) {
                characterElement.classList.add('armor-weakened');
                
                // Create floating debuff indicator
                const debuffIndicator = document.createElement('div');
                debuffIndicator.className = 'armor-reduction-indicator';
                debuffIndicator.innerHTML = '🛡️💥';
                characterElement.appendChild(debuffIndicator);
                
                setTimeout(() => {
                    if (debuffIndicator.parentNode) debuffIndicator.remove();
                }, 2000);
            }
            return true;
        };
        
        target.addDebuff(armorReductionDebuff);
        log(`${target.name}'s armor is weakened by ${caster.name}'s critical strike! (-2% armor permanently)`, 'debuff-applied');
    }
    
    // Show VFX
    showArmorReductionVFX(target);
}

/**
 * Show armor reduction VFX
 */
function showArmorReductionVFX(target) {
    try {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create armor break effect
        const armorBreakVFX = document.createElement('div');
        armorBreakVFX.className = 'armor-break-vfx';
        targetElement.appendChild(armorBreakVFX);
        
        // Create particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'armor-break-particle';
            particle.style.setProperty('--particle-angle', `${i * 45}deg`);
            armorBreakVFX.appendChild(particle);
        }
        
        // Cleanup after animation
        setTimeout(() => {
            if (armorBreakVFX.parentNode) armorBreakVFX.remove();
        }, 1500);
        
    } catch (error) {
        console.error('[Armor Piercer VFX] Error creating visual effects:', error);
    }
}

// Register the ability effect when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Hotshot Abilities] Registering ability effects...');
    
    const registerEffects = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
            // Register dual shot abilities
            AbilityFactory.registerAbilityEffect('hotshot_diablo_dual_shot', hotshotDualShotEffect);
            AbilityFactory.registerAbilityEffect('hotshot_diabla_dual_shot', hotshotDualShotEffect);
            AbilityFactory.registerAbilityEffect('dual_shot', hotshotDualShotEffect);
            
            // Register armor piercer abilities
            AbilityFactory.registerAbilityEffect('hotshot_diablo_armor_piercer', hotshotArmorPiercerEffect);
            AbilityFactory.registerAbilityEffect('hotshot_diabla_armor_piercer', hotshotArmorPiercerEffect);
            AbilityFactory.registerAbilityEffect('armor_piercer', hotshotArmorPiercerEffect);
            
            console.log('[Hotshot Abilities] Successfully registered dual shot and armor piercer effects');
        } else {
            console.warn('[Hotshot Abilities] AbilityFactory not available, retrying in 100ms...');
            setTimeout(registerEffects, 100);
        }
    };
    
    // Set up critical hit event listener for armor piercer
    const setupCriticalHitListener = () => {
        // Listen for critical hit events
        document.addEventListener('criticalHit', (event) => {
            const { source: caster, target, damage, type } = event.detail;
            
            // Check if the caster has armor piercer buff active
            if (caster && caster.hasBuff && caster.hasBuff('armor_piercer_buff')) {
                try {
                    console.log(`[Armor Piercer] Critical hit event detected from ${caster.name} to ${target.name}, applying armor reduction`);
                    applyArmorReductionDebuff(target, caster);
                } catch (error) {
                    console.error('[Armor Piercer] Error applying armor reduction:', error);
                }
            }
        });
        
        console.log('[Hotshot Abilities] Critical hit event listener installed successfully');
    };
    
    registerEffects();
    setupCriticalHitListener();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hotshotDualShotEffect, executeDualShot, showDualShotVFX };
} 