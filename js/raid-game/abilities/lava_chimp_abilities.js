/**
 * Lava Chimp Abilities
 * Custom ability effects for Lava Chimp
 */

// Rampage Chain Effect - Deals damage with chance to jump to another target
const lavaChimpRampageEffect = async (caster, initialTarget) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!initialTarget || initialTarget.isDead()) {
        log(`🌋 ${caster.name}'s volcanic fury has no target to unleash upon!`, 'warning');
        return false;
    }

    log(`🌋 ${caster.name} erupts with molten fury, beginning a volcanic Rampage!`, 'ability-cast');
    
    // Play initial cast sound
    playSound('sounds/rampage_cast.mp3', 0.8);
    
    await executeRampageHit(caster, initialTarget, [], 1);
    return true;
};

// Execute a single rampage hit with potential chaining
async function executeRampageHit(caster, target, hitTargets = [], hitNumber = 1) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`🌋 The volcanic rampage cools down - no more targets to incinerate.`, 'info');
        return;
    }

    // Add visual effects for the rampage hit
    await createRampageHitVFX(caster, target, hitNumber);
    
    // Calculate damage - 555 + 80% physical damage
    const damage = 555 + (caster.stats.physicalDamage * 0.8);
    
    // Apply damage
    const damageResult = target.applyDamage(damage, 'physical', caster, {
        isRampageHit: true,
        skipDodge: false // Allow dodging
    });

    // Log the hit
    let hitMessage = `🔥 ${target.name} is scorched by molten claws for ${damageResult.damage} volcanic damage`;
    if (hitNumber > 1) hitMessage += ` (Magma Chain #${hitNumber})`;
    if (damageResult.isCritical) hitMessage += " (Eruption Critical!)";
    log(hitMessage, damageResult.isCritical ? 'critical' : 'damage');

    // Apply lifesteal
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(damageResult.damage);
    }

    // Add target to hit list
    const targetId = target.instanceId || target.id;
    hitTargets.push(targetId);

    // Chain chance - 55%
    const chainChance = 0.55;
    if (Math.random() < chainChance) {
        // Find valid targets for chaining
        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            log('Cannot access game state for rampage chaining.', 'error');
            return;
        }

        // Get all enemies (can chain back to previously hit targets)
        const enemies = caster.isAI ? 
            gameManager.gameState.playerCharacters : 
            gameManager.gameState.aiCharacters;

        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
        
        if (aliveEnemies.length === 0) {
            log(`🌋 The molten fury subsides - all enemies have been consumed by lava!`, 'info');
            return;
        }

        // Select random target (can be the same target as before)
        const nextTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        
        log(`🌋 Molten fury flows like lava to ${nextTarget.name}!`, 'chain-effect');
        
        // Create chain VFX
        await createRampageChainVFX(target, nextTarget);
        
        // Delay before next hit
        await delay(600);
        
        // Continue the chain
        await executeRampageHit(caster, nextTarget, hitTargets, hitNumber + 1);
    } else {
        log(`🌋 The volcanic rampage finally cools after ${hitNumber} molten strike${hitNumber > 1 ? 's' : ''}.`, 'info');
    }
}

// Create visual effects for a rampage hit
async function createRampageHitVFX(caster, target, hitNumber) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

        if (!casterElement || !targetElement) {
            console.warn('[Rampage VFX] Could not find character elements');
            return;
        }

        // Add rampage animation to caster
        casterElement.classList.add('rampage-cast-animation');
        
        // Create rampage leap effect
        const leapEffect = document.createElement('div');
        leapEffect.className = 'rampage-leap-effect';
        
        // Position from caster to target
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // Calculate angle and distance
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        leapEffect.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${distance}px;
            height: 8px;
            background: linear-gradient(90deg, #ff4400, #ff8800, #ffcc00);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            box-shadow: 0 0 20px #ff6600, 0 0 40px #ff4400;
            animation: rampage-leap 0.5s ease-out forwards;
            z-index: 1000;
        `;
        
        document.body.appendChild(leapEffect);
        
        // Create impact effect on target after delay
        setTimeout(() => {
            createRampageImpactVFX(target, hitNumber);
            
            // Clean up leap effect
            if (leapEffect.parentNode) {
                leapEffect.remove();
            }
            
            // Remove caster animation
            casterElement.classList.remove('rampage-cast-animation');
        }, 500);
        
    } catch (error) {
        console.error('[Rampage VFX] Error creating hit VFX:', error);
    }
}

// Create impact effects on target
function createRampageImpactVFX(target, hitNumber) {
    try {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        // Add impact shake to target
        targetElement.classList.add('rampage-impact-shake');
        
        // Create impact explosion
        const impactVfx = document.createElement('div');
        impactVfx.className = 'rampage-impact-explosion';
        impactVfx.style.setProperty('--hit-number', hitNumber);
        targetElement.appendChild(impactVfx);
        
        // Create impact particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'rampage-impact-particle';
            particle.style.setProperty('--particle-angle', `${i * 30}deg`);
            particle.style.setProperty('--particle-delay', `${Math.random() * 0.2}s`);
            impactVfx.appendChild(particle);
        }
        
        // Show floating damage number
        showRampageDamageText(target, damage, hitNumber > 1);
        
        // Screen shake effect
        if (hitNumber <= 3) { // Limit screen shake for long chains
            document.body.classList.add('light-screen-shake');
            setTimeout(() => document.body.classList.remove('light-screen-shake'), 300);
        }
        
        // Clean up effects
        setTimeout(() => {
            targetElement.classList.remove('rampage-impact-shake');
            if (impactVfx.parentNode) {
                impactVfx.remove();
            }
        }, 800);
        
    } catch (error) {
        console.error('[Rampage VFX] Error creating impact VFX:', error);
    }
}

// Create chain visual effect between targets
async function createRampageChainVFX(fromTarget, toTarget) {
    try {
        const fromElement = document.getElementById(`character-${fromTarget.instanceId || fromTarget.id}`);
        const toElement = document.getElementById(`character-${toTarget.instanceId || toTarget.id}`);
        
        if (!fromElement || !toElement) return;
        
        // Create chain connector
        const chainVfx = document.createElement('div');
        chainVfx.className = 'rampage-chain-connector';
        
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        const startX = fromRect.left + fromRect.width / 2;
        const startY = fromRect.top + fromRect.height / 2;
        const endX = toRect.left + toRect.width / 2;
        const endY = toRect.top + toRect.height / 2;
        
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        chainVfx.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${distance}px;
            height: 6px;
            background: linear-gradient(90deg, #ffaa00, #ffdd00, #ffaa00);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            box-shadow: 0 0 15px #ffcc00, 0 0 30px #ff8800;
            animation: rampage-chain 0.4s ease-out forwards;
            z-index: 999;
        `;
        
        document.body.appendChild(chainVfx);
        
        // Create chain particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'rampage-chain-particle';
            particle.style.cssText = `
                position: fixed;
                left: ${startX + (endX - startX) * (i / 8)}px;
                top: ${startY + (endY - startY) * (i / 8)}px;
                width: 6px;
                height: 6px;
                background: #ffdd00;
                border-radius: 50%;
                animation: rampage-chain-particle 0.4s ease-out forwards;
                animation-delay: ${i * 0.05}s;
                z-index: 1001;
            `;
            document.body.appendChild(particle);
            
            // Clean up particles
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 800);
        }
        
        // Clean up chain connector
        setTimeout(() => {
            if (chainVfx.parentNode) {
                chainVfx.remove();
            }
        }, 400);
        
    } catch (error) {
        console.error('[Rampage VFX] Error creating chain VFX:', error);
    }
}

// Show floating damage text for rampage
function showRampageDamageText(target, damage, isChainHit = false) {
    try {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        const damageText = document.createElement('div');
        damageText.className = `rampage-damage-text ${isChainHit ? 'chain-hit' : 'initial-hit'}`;
        damageText.textContent = damage;
        
        // Position with some randomization
        damageText.style.cssText = `
            position: absolute;
            left: ${40 + (Math.random() * 20)}%;
            top: ${20 + (Math.random() * 20)}%;
            z-index: 1002;
            pointer-events: none;
            font-weight: bold;
            font-size: ${isChainHit ? '1.4em' : '1.6em'};
            color: ${isChainHit ? '#ffaa00' : '#ff4400'};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: rampage-damage-float 1.5s ease-out forwards;
        `;
        
        targetElement.appendChild(damageText);
        
        // Clean up after animation
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.remove();
            }
        }, 1500);
        
    } catch (error) {
        console.error('[Rampage VFX] Error showing damage text:', error);
    }
}

// Utility delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Burning Spear Stab Effect - Deals damage, stuns, and nullifies armor
const lavaChimpBurningSpearStabEffect = async (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`🌋 ${caster.name}'s molten spear cannot find a target to pierce!`, 'warning');
        return false;
    }

    log(`🌋 ${caster.name} forges a molten spear from the depths of volcanic fury!`, 'ability-cast');
    
    // Play spear stab sound
    playSound('sounds/spear_stab.mp3', 0.9);
    
    // Create leap and stab VFX
    await createBurningSpearStabVFX(caster, target);
    
    // Calculate damage - 200% Physical Damage
    const damage = Math.floor(caster.stats.physicalDamage * 2.0);
    
    // Apply damage
    const damageResult = target.applyDamage(damage, 'physical', caster, {
        isBurningSpearStab: true,
        skipDodge: false // Allow dodging
    });

    // Log the damage
    let damageMessage = `🌋 ${target.name} is impaled by the molten spear, taking ${damageResult.damage} volcanic damage`;
    if (damageResult.isCritical) damageMessage += " (Magma Core Critical!)";
    log(damageMessage, damageResult.isCritical ? 'critical' : 'damage');

    // Apply lifesteal
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(damageResult.damage);
    }

    // Create stun debuff
    const stunDebuff = new Effect(
        'burning_spear_stun',
        'Stunned (Burning Spear)',
        'Icons/effects/stun.png',
        3, // 3 turns duration
        null,
        true // Is a debuff
    );
    
    stunDebuff.effects = {
        cantAct: true
    };
    
    stunDebuff.setDescription('Paralyzed by molten shock - cannot perform any actions while volcanic energy courses through their body.');
    
    // Create armor nullification debuff
    const armorNullifyDebuff = new Effect(
        'armor_nullified',
        'Armor Nullified',
        'Icons/abilities/spear_stab.png',
        3, // Same duration as stun
        null,
        true // Is a debuff
    );
    
    // Store original armor value for logging purposes
    armorNullifyDebuff.originalArmor = target.stats.armor;
    
    armorNullifyDebuff.setDescription('Armor has been melted away by volcanic heat - completely defenseless against attacks.');
    
    // Use proper statModifiers array structure to set armor to 0
    armorNullifyDebuff.statModifiers = [
        { stat: 'armor', value: 0, operation: 'set' } // Set armor to 0 directly
    ];
    
    // Custom remove function for logging when debuff expires
    armorNullifyDebuff.onRemove = function(character) {
        log(`🛡️ ${character.name}'s armor cools and hardens back from molten nullification!`, 'buff-removed');
    };

    // Apply both debuffs
    target.addDebuff(stunDebuff);
    target.addDebuff(armorNullifyDebuff);
    
    // Force UI update
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
    
    log(`🌋 ${target.name} is paralyzed by molten shock and their armor melts away completely!`, 'debuff');
    log(`🛡️ ${target.name}'s armor reduced from ${armorNullifyDebuff.originalArmor} to 0!`, 'debuff');
    
    // Create impact effects
    createBurningSpearImpactVFX(target);
    
    return true;
};

// Create visual effects for burning spear stab
async function createBurningSpearStabVFX(caster, target) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

        if (!casterElement || !targetElement) {
            console.warn('[Burning Spear VFX] Could not find character elements');
            return;
        }

        // Add leap animation to caster
        casterElement.classList.add('burning-spear-leap-animation');
        
        // Create spear trajectory effect
        const spearTrajectory = document.createElement('div');
        spearTrajectory.className = 'burning-spear-trajectory';
        
        // Position from caster to target
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // Calculate angle and distance
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        spearTrajectory.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${distance}px;
            height: 12px;
            background: linear-gradient(90deg, #ff2200, #ff6600, #ffaa00, #ff2200);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            box-shadow: 0 0 25px #ff4400, 0 0 50px #ff2200;
            animation: burning-spear-trajectory 0.7s ease-in forwards;
            z-index: 1000;
            border-radius: 6px;
        `;
        
        // Add spear tip
        const spearTip = document.createElement('div');
        spearTip.className = 'burning-spear-tip';
        spearTip.style.cssText = `
            position: absolute;
            right: -8px;
            top: -4px;
            width: 0;
            height: 0;
            border-left: 20px solid #ff4400;
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;
            filter: drop-shadow(0 0 10px #ff2200);
        `;
        spearTrajectory.appendChild(spearTip);
        
        document.body.appendChild(spearTrajectory);
        
        // Create fire trail particles
        createBurningSpearTrailParticles(startX, startY, endX, endY);
        
        // Clean up after animation
        setTimeout(() => {
            casterElement.classList.remove('burning-spear-leap-animation');
            if (spearTrajectory.parentNode) {
                spearTrajectory.remove();
            }
        }, 700);
        
    } catch (error) {
        console.error('[Burning Spear VFX] Error creating stab VFX:', error);
    }
}

// Create trail particles for the burning spear
function createBurningSpearTrailParticles(startX, startY, endX, endY) {
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'burning-spear-trail-particle';
            
            // Interpolate position along the spear path
            const progress = i / particleCount;
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #ff4400, #ff2200);
                border-radius: 50%;
                box-shadow: 0 0 12px #ff6600;
                animation: burning-spear-trail-particle 0.8s ease-out forwards;
                z-index: 999;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 800);
            
        }, i * 60);
    }
}

// Create impact effects on target
function createBurningSpearImpactVFX(target) {
    try {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        // Add impact shake to target
        targetElement.classList.add('burning-spear-impact-shake');
        
        // Create burning explosion effect
        const burningExplosion = document.createElement('div');
        burningExplosion.className = 'burning-spear-explosion';
        targetElement.appendChild(burningExplosion);
        
        // Create impact particles with fire theme
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('div');
            particle.className = 'burning-spear-impact-particle';
            particle.style.setProperty('--particle-angle', `${i * 22.5}deg`);
            particle.style.setProperty('--particle-delay', `${Math.random() * 0.3}s`);
            burningExplosion.appendChild(particle);
        }
        
        // Create stun effect indicators
        const stunIndicator = document.createElement('div');
        stunIndicator.className = 'burning-spear-stun-indicator';
        stunIndicator.innerHTML = '⭐⭐⭐'; // Stars to indicate stunning
        targetElement.appendChild(stunIndicator);
        
        // Create armor break effect
        const armorBreakIndicator = document.createElement('div');
        armorBreakIndicator.className = 'burning-spear-armor-break';
        armorBreakIndicator.innerHTML = '🛡️💥'; // Shield breaking
        targetElement.appendChild(armorBreakIndicator);
        
        // Show floating damage number
        showBurningSpearDamageText(target, Math.floor(target.lastDamageAmount || 0));
        
        // Screen shake effect
        document.body.classList.add('medium-screen-shake');
        setTimeout(() => document.body.classList.remove('medium-screen-shake'), 400);
        
        // Clean up effects
        setTimeout(() => {
            targetElement.classList.remove('burning-spear-impact-shake');
            if (burningExplosion.parentNode) {
                burningExplosion.remove();
            }
            if (stunIndicator.parentNode) {
                stunIndicator.remove();
            }
            if (armorBreakIndicator.parentNode) {
                armorBreakIndicator.remove();
            }
        }, 1200);
        
    } catch (error) {
        console.error('[Burning Spear VFX] Error creating impact VFX:', error);
    }
}

// Show floating damage text for burning spear stab
function showBurningSpearDamageText(target, damage) {
    try {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        const damageText = document.createElement('div');
        damageText.className = 'burning-spear-damage-text';
        damageText.textContent = damage;
        
        // Position with some randomization
        damageText.style.cssText = `
            position: absolute;
            left: ${45 + (Math.random() * 10)}%;
            top: ${15 + (Math.random() * 10)}%;
            z-index: 1002;
            pointer-events: none;
            font-weight: 900;
            font-size: 1.8em;
            color: #ff2200;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 20px #ff4400;
            animation: burning-spear-damage-float 2s ease-out forwards;
        `;
        
        targetElement.appendChild(damageText);
        
        // Clean up after animation
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.remove();
            }
        }, 2000);
        
    } catch (error) {
        console.error('[Burning Spear VFX] Error showing damage text:', error);
    }
}

// Register both abilities with AbilityFactory
function registerLavaChimpAbilities() {
    console.log('[Lava Chimp Abilities] Registering abilities...');
    
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        // Register rampage effect
        window.AbilityFactory.registerAbilityEffect('rampage_chain', lavaChimpRampageEffect);
        window.AbilityFactory.registerAbilityEffect('lava_chimp_rampage', lavaChimpRampageEffect);
        window.AbilityFactory.registerAbilityEffect('lavaChimpRampageEffect', lavaChimpRampageEffect);
        
        // Register burning spear stab effect
        window.AbilityFactory.registerAbilityEffect('lava_chimp_burning_spear_stab', lavaChimpBurningSpearStabEffect);
        window.AbilityFactory.registerAbilityEffect('lavaChimpBurningSpearStabEffect', lavaChimpBurningSpearStabEffect);
        
        console.log('[Lava Chimp Abilities] Successfully registered all abilities');
    } else {
        console.warn('[Lava Chimp Abilities] AbilityFactory not available, retrying in 1000ms...');
        setTimeout(registerLavaChimpAbilities, 1000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerLavaChimpAbilities);
} else {
    registerLavaChimpAbilities();
}

// Also try immediate registration if AbilityFactory is already available
if (window.AbilityFactory) {
    registerLavaChimpAbilities();
}

// Make functions globally available for debugging
window.lavaChimpRampageEffect = lavaChimpRampageEffect;
window.lavaChimpBurningSpearStabEffect = lavaChimpBurningSpearStabEffect;
window.executeRampageHit = executeRampageHit; 