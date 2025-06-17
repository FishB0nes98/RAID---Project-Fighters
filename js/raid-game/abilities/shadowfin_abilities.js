/**
 * Shadowfin Abilities
 * Custom abilities for Shadowfin with proper damage calculations
 */

// --- Trident Stab Effect ---
const tridentStabEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to use Trident Stab, but the target is invalid or defeated.`);
        return { success: false };
    }
    
    // Calculate damage: 420 + 80% physical damage
    const fixedDamage = 420;
    const physicalDamageBonus = Math.floor((caster.stats.physicalDamage || 0) * 0.80);
    const totalDamage = fixedDamage + physicalDamageBonus;
    
    console.log(`[Trident Stab] Damage calculation: ${fixedDamage} + ${physicalDamageBonus} (80% of ${caster.stats.physicalDamage}) = ${totalDamage}`);
    
    // Apply damage with statistics tracking
    const damageOptions = {
        abilityId: 'trident_stab'
    };
    const result = target.applyDamage(totalDamage, 'physical', caster, damageOptions);
    
    // Log the attack
    let message = `${caster.name} strikes ${target.name} with Trident Stab for ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    log(message, result.isCritical ? 'critical' : '');
    
    // Apply lifesteal if character has it
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(result.damage);
    }
    
    // Show VFX
    showTridentStabVFX(caster, target, result);
    
    // Update UI
    if (window.updateCharacterUI) {
        window.updateCharacterUI(target);
        window.updateCharacterUI(caster);
    }
    
    return { 
        success: true, 
        damage: result.damage,
        isCritical: result.isCritical
    };
};

/**
 * Show visual effects for Trident Stab
 */
function showTridentStabVFX(caster, target, damageResult) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!casterElement || !targetElement) {
            console.log('[Trident Stab VFX] Could not find character elements');
            return;
        }
        
        // Caster thrust animation
        casterElement.classList.add('trident-attack');
        
        // Create trident projectile effect
        createTridentProjectile(casterElement, targetElement);
        
        // Target impact effect
        setTimeout(() => {
            createTridentImpact(targetElement, damageResult);
            
            // Screen shake
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.addScreenShake();
            }
        }, 300);
        
        // Remove caster animation
        setTimeout(() => {
            casterElement.classList.remove('trident-attack');
        }, 800);
        
    } catch (error) {
        console.error('[Trident Stab VFX] Error in showTridentStabVFX:', error);
    }
}

/**
 * Create trident projectile effect
 */
function createTridentProjectile(casterElement, targetElement) {
    const projectile = document.createElement('div');
    projectile.className = 'trident-projectile';
    
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    projectile.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        width: ${Math.min(distance, 60)}px;
        height: 6px;
        background: linear-gradient(90deg, #4a90e2, #7bb3f0, #4a90e2);
        border-radius: 3px;
        box-shadow: 0 0 10px #4a90e2, 0 0 20px #7bb3f0;
        transform-origin: 0 50%;
        transform: rotate(${angle}deg);
        z-index: 1000;
        animation: tridentProjectileFly 0.3s ease-out forwards;
    `;
    
    document.body.appendChild(projectile);
    
    // Remove after animation
    setTimeout(() => {
        if (projectile.parentNode) {
            projectile.parentNode.removeChild(projectile);
        }
    }, 300);
}

/**
 * Create impact effect on target
 */
function createTridentImpact(targetElement, damageResult) {
    // Impact flash
    const impact = document.createElement('div');
    impact.className = 'trident-impact';
    impact.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle, rgba(74,144,226,0.8), rgba(123,179,240,0.4), transparent);
        border-radius: 10px;
        z-index: 15;
        pointer-events: none;
        animation: tridentImpactFlash 0.6s ease-out forwards;
    `;
    
    targetElement.style.position = 'relative';
    targetElement.appendChild(impact);
    
    // Floating damage number
    const damageNumber = document.createElement('div');
    damageNumber.className = 'trident-damage-number';
    damageNumber.textContent = damageResult.damage;
    damageNumber.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        color: ${damageResult.isCritical ? '#ff6b6b' : '#4a90e2'};
        font-weight: bold;
        font-size: ${damageResult.isCritical ? '18px' : '16px'};
        text-shadow: 0 0 4px rgba(0,0,0,0.8);
        z-index: 20;
        pointer-events: none;
        animation: tridentDamageFloat 1.5s ease-out forwards;
    `;
    
    targetElement.appendChild(damageNumber);
    
    // Remove effects after animation
    setTimeout(() => {
        if (impact.parentNode) {
            impact.parentNode.removeChild(impact);
        }
        if (damageNumber.parentNode) {
            damageNumber.parentNode.removeChild(damageNumber);
        }
    }, 1500);
}

// --- Swift Swim Effect ---
const swiftSwimEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to use Swift Swim, but the target is invalid or defeated.`);
        return { success: false };
    }
    
    // Create untargetable buff for 2 turns
    const untargetableBuff = new Effect(
        'untargetable',
        'Swift Swim - Untargetable',
        'Icons/buffs/untargetable.png',
        2, // 2 turns duration
        null, // no effect function needed
        false // not a debuff
    );
    
    untargetableBuff.setDescription('Cannot be targeted by abilities, but can still take damage or effects.');
    
    // Set the untargetable property so isUntargetable() recognizes it
    untargetableBuff.isUntargetable = true;
    
    // Apply the buff
    target.addBuff(untargetableBuff);
    
    // Log the action
    log(`${caster.name} uses Swift Swim and becomes untargetable for 2 turns!`);
    
    // Show VFX
    showSwiftSwimVFX(caster);
    
    // Update UI and add untargetable data attribute
    if (window.updateCharacterUI) {
        window.updateCharacterUI(target);
    }
    
    // Add visual indicator by setting data attribute
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        targetElement.setAttribute('data-untargetable', 'true');
        
        // Remove the attribute after the buff duration (2 turns)
        // This is a backup - the proper removal should happen when the buff expires
        setTimeout(() => {
            if (targetElement && !target.isUntargetable()) {
                targetElement.removeAttribute('data-untargetable');
            }
        }, 120000); // 2 minutes backup cleanup
    }
    
    return { success: true };
};

/**
 * Show visual effects for Swift Swim
 */
function showSwiftSwimVFX(caster) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        
        if (!casterElement) {
            console.log('[Swift Swim VFX] Could not find caster element');
            return;
        }
        
        // Add swimming animation
        casterElement.classList.add('swift-swim-active');
        
        // Create water ripple effect
        createWaterRipples(casterElement);
        
        // Create swimming particles
        createSwimmingParticles(casterElement);
        
        // Remove animation class after a delay
        setTimeout(() => {
            casterElement.classList.remove('swift-swim-active');
        }, 2000);
        
    } catch (error) {
        console.error('[Swift Swim VFX] Error in showSwiftSwimVFX:', error);
    }
}

/**
 * Create water ripple effects
 */
function createWaterRipples(casterElement) {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const ripple = document.createElement('div');
            ripple.className = 'water-ripple';
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(74, 144, 226, 0.6);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
                pointer-events: none;
                animation: waterRippleExpand 1.5s ease-out forwards;
            `;
            
            casterElement.style.position = 'relative';
            casterElement.appendChild(ripple);
            
            // Remove after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 1500);
        }, i * 200);
    }
}

/**
 * Create swimming particle effects
 */
function createSwimmingParticles(casterElement) {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'swimming-particle';
            particle.style.cssText = `
                position: absolute;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #7bb3f0, #4a90e2);
                border-radius: 50%;
                z-index: 12;
                pointer-events: none;
                animation: swimmingParticleFloat 2s ease-out forwards;
            `;
            
            casterElement.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }, i * 100);
    }
}

// Register the ability effects
if (window.AbilityFactory && window.AbilityFactory.registerAbilityEffect) {
    window.AbilityFactory.registerAbilityEffect('trident_stab', tridentStabEffect);
    window.AbilityFactory.registerAbilityEffect('swift_swim', swiftSwimEffect);
    console.log('[Shadowfin Abilities] Registered Trident Stab and Swift Swim effects');
} else {
    console.warn('[Shadowfin Abilities] AbilityFactory not found, cannot register effects');
} 