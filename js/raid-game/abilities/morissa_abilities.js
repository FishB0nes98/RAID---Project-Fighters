/**
 * Morissa (Succubus) Abilities
 * Implementation of Soul Siphon ability and related VFX
 */

// Soul Siphon Effect
const soulSiphonEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name}'s Soul Siphon failed: No valid target!`, 'error');
        return { success: false };
    }

    log(`${caster.name} begins to siphon ${target.name}'s soul essence...`);

    // Play soul siphon sound effect
    playSound('sounds/soul_siphon.mp3', 0.8);

    // Show Soul Siphon VFX
    showSoulSiphonVFX(caster, target);

    // Calculate damage: 355 + 100% Magical Damage
    const fixedDamage = 355;
    const magicalDamageBonus = caster.stats.magicalDamage || 0;
    const totalDamage = fixedDamage + magicalDamageBonus;

    // Apply damage to target
    const damageResult = target.applyDamage(totalDamage, 'magical', caster);
    
    log(`${target.name} takes ${damageResult.damage} magical damage from Soul Siphon!`, damageResult.isCritical ? 'critical' : '');

    // Heal caster for the same amount as damage dealt
    if (damageResult.damage > 0) {
        const healResult = caster.heal(damageResult.damage, caster, { healType: 'soul_siphon' });
        log(`${caster.name} is healed for ${healResult.healAmount} HP from siphoned life force!`, 'heal');

        // Show healing VFX on caster
        showSoulSiphonHealVFX(caster, healResult.healAmount);
    }

    // Check if target died
    if (target.isDead()) {
        log(`${target.name} has been drained of their life force!`);
    }

    // Update UI for both characters
    if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
        window.gameManager.uiManager.updateCharacterUI(caster);
        window.gameManager.uiManager.updateCharacterUI(target);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
        updateCharacterUI(target);
    }

    return { 
        success: true, 
        damage: damageResult.damage,
        healing: damageResult.damage
    };
};

/**
 * Soul Siphon VFX - Creates a green energy drain effect from target to caster
 */
function showSoulSiphonVFX(caster, target) {
    // Add CSS styles if not already added
    if (!document.getElementById('soul-siphon-styles')) {
        addSoulSiphonStyles();
    }

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (!casterElement || !targetElement) return;

    // Create soul drain effect on target
    const drainEffect = document.createElement('div');
    drainEffect.className = 'soul-siphon-drain-effect';
    targetElement.appendChild(drainEffect);

    // Create multiple soul particles flowing from target to caster
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            createSoulParticle(targetElement, casterElement, i);
        }, i * 150); // Stagger particle creation
    }

    // Add target weakening effect
    targetElement.style.filter = 'brightness(0.6) contrast(1.2) hue-rotate(120deg)';
    setTimeout(() => {
        targetElement.style.filter = '';
    }, 2000);

    // Remove drain effect after animation
    setTimeout(() => {
        if (drainEffect.parentNode) {
            drainEffect.remove();
        }
    }, 2500);
}

/**
 * Creates individual soul particles that flow from target to caster
 */
function createSoulParticle(targetElement, casterElement, index) {
    const particle = document.createElement('div');
    particle.className = 'soul-particle';
    
    // Get positions
    const targetRect = targetElement.getBoundingClientRect();
    const casterRect = casterElement.getBoundingClientRect();
    
    // Set initial position (from target)
    particle.style.position = 'fixed';
    particle.style.left = (targetRect.left + targetRect.width / 2) + 'px';
    particle.style.top = (targetRect.top + targetRect.height / 2) + 'px';
    particle.style.zIndex = '1000';
    
    // Add random offset for more natural look
    const randomOffsetX = (Math.random() - 0.5) * 40;
    const randomOffsetY = (Math.random() - 0.5) * 40;
    
    document.body.appendChild(particle);
    
    // Calculate movement to caster
    const deltaX = (casterRect.left + casterRect.width / 2) - (targetRect.left + targetRect.width / 2);
    const deltaY = (casterRect.top + casterRect.height / 2) - (targetRect.top + targetRect.height / 2);
    
    // Animate the particle
    particle.animate([
        { 
            transform: `translate(${randomOffsetX}px, ${randomOffsetY}px) scale(0.5)`, 
            opacity: 0.8,
            filter: 'blur(0px)'
        },
        { 
            transform: `translate(${deltaX * 0.3 + randomOffsetX}px, ${deltaY * 0.3 + randomOffsetY}px) scale(1)`, 
            opacity: 1,
            filter: 'blur(1px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(1.5)`, 
            opacity: 0.9,
            filter: 'blur(2px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`, 
            opacity: 0,
            filter: 'blur(3px)'
        }
    ], {
        duration: 1200 + (index * 100), // Vary duration slightly
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
        particle.remove();
    };
}

/**
 * Soul Siphon Healing VFX - Shows green healing energy on the caster
 */
function showSoulSiphonHealVFX(caster, healAmount) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create healing aura effect
    const healAura = document.createElement('div');
    healAura.className = 'soul-siphon-heal-aura';
    casterElement.appendChild(healAura);

    // Create healing amount text
    const healText = document.createElement('div');
    healText.className = 'soul-siphon-heal-text';
    healText.textContent = `+${healAmount}`;
    casterElement.appendChild(healText);

    // Add temporary glow to caster
    casterElement.style.filter = 'brightness(1.3) drop-shadow(0 0 15px #00ff88)';
    setTimeout(() => {
        casterElement.style.filter = '';
    }, 1500);

    // Remove effects after animation
    setTimeout(() => {
        if (healAura.parentNode) healAura.remove();
        if (healText.parentNode) healText.remove();
    }, 2000);
}

/**
 * Add CSS styles for Soul Siphon effects
 */
function addSoulSiphonStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'soul-siphon-styles';
    styleSheet.textContent = `
        /* Soul Siphon Drain Effect on Target */
        .soul-siphon-drain-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, 
                rgba(0, 255, 136, 0.3) 0%, 
                rgba(0, 200, 100, 0.2) 30%, 
                rgba(0, 150, 80, 0.1) 60%, 
                transparent 100%);
            border-radius: 50%;
            animation: soul-drain-pulse 2.5s ease-in-out;
            pointer-events: none;
            z-index: 10;
        }

        @keyframes soul-drain-pulse {
            0% { 
                transform: scale(0.8);
                opacity: 0;
                box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.5);
            }
            20% { 
                transform: scale(1.1);
                opacity: 0.8;
                box-shadow: inset 0 0 30px rgba(0, 255, 136, 0.7);
            }
            50% { 
                transform: scale(1);
                opacity: 1;
                box-shadow: inset 0 0 40px rgba(0, 255, 136, 0.8);
            }
            100% { 
                transform: scale(0.9);
                opacity: 0;
                box-shadow: inset 0 0 60px rgba(0, 255, 136, 0.3);
            }
        }

        /* Soul Particles */
        .soul-particle {
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, 
                rgba(0, 255, 136, 1) 0%, 
                rgba(0, 200, 100, 0.8) 50%, 
                rgba(0, 150, 80, 0.4) 100%);
            border-radius: 50%;
            box-shadow: 
                0 0 8px rgba(0, 255, 136, 0.8),
                0 0 16px rgba(0, 200, 100, 0.6),
                0 0 24px rgba(0, 150, 80, 0.4);
            pointer-events: none;
        }

        /* Soul Siphon Healing Aura on Caster */
        .soul-siphon-heal-aura {
            position: absolute;
            top: -10%;
            left: -10%;
            width: 120%;
            height: 120%;
            background: radial-gradient(circle, 
                rgba(0, 255, 136, 0.4) 0%, 
                rgba(0, 200, 100, 0.3) 30%, 
                rgba(0, 150, 80, 0.2) 60%, 
                transparent 100%);
            border-radius: 50%;
            animation: soul-heal-aura 2s ease-out;
            pointer-events: none;
            z-index: 8;
        }

        @keyframes soul-heal-aura {
            0% { 
                transform: scale(0.5) rotate(0deg);
                opacity: 0;
            }
            30% { 
                transform: scale(1.2) rotate(90deg);
                opacity: 0.8;
            }
            70% { 
                transform: scale(1) rotate(180deg);
                opacity: 1;
            }
            100% { 
                transform: scale(1.1) rotate(270deg);
                opacity: 0;
            }
        }

        /* Soul Siphon Heal Text */
        .soul-siphon-heal-text {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            color: #00ff88;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 
                0 0 4px rgba(0, 0, 0, 0.8),
                0 0 8px rgba(0, 255, 136, 0.6),
                0 0 12px rgba(0, 200, 100, 0.4);
            background-color: rgba(0, 0, 0, 0.3);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(0, 255, 136, 0.5);
            white-space: nowrap;
            animation: soul-heal-text-float 2s ease-out;
            z-index: 12;
            pointer-events: none;
        }

        @keyframes soul-heal-text-float {
            0% { 
                opacity: 0; 
                transform: translateX(-50%) translateY(20px) scale(0.8); 
            }
            20% { 
                opacity: 1; 
                transform: translateX(-50%) translateY(0px) scale(1.1); 
            }
            80% { 
                opacity: 1; 
                transform: translateX(-50%) translateY(-10px) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translateX(-50%) translateY(-30px) scale(0.9); 
            }
        }

        /* Additional glow effects for enhanced visual appeal */
        .soul-siphon-drain-effect::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background: rgba(0, 255, 136, 1);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
            animation: soul-core-pulse 1.5s ease-in-out infinite;
        }

        @keyframes soul-core-pulse {
            0%, 100% { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            50% { 
                transform: translate(-50%, -50%) scale(2);
                opacity: 0.6;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

/**
 * Shadow Wings Effect - Grants 100% dodge for 2 turns, then AOE damage on landing
 */
const shadowWingsEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} spreads her shadow wings and takes flight!`);

    // Play wing sound effect
    playSound('sounds/shadow_wings.mp3', 0.8);

    // Create the Shadow Wings buff
    const shadowWingsBuff = {
        id: 'shadow_wings_buff',
        name: 'Shadow Wings',
        icon: 'Icons/abilities/shadow_wings.png',
        duration: 2,
        description: 'Flying with demonic wings. 100% dodge chance. Forces all enemies to target only her. Will deal AOE damage when landing.',
        statModifiers: [
            { stat: 'dodgeChance', value: 1.0, operation: 'set' } // 100% dodge chance
        ],
        forcesTargeting: true, // Special property to make this character the only valid target
        onApply: (target) => {
            log(`${target.name} takes flight! All attacks will miss for 2 turns.`, 'buff');
            log(`${target.name}'s commanding presence forces all enemies to focus only on her!`, 'buff');
            showShadowWingsVFX(target);
            
            // Update targeting for all characters
            updateTargetingForShadowWings();
        },
        onRemove: (target) => {
            log(`${target.name} descends from the sky with devastating force!`, 'buff');
            executeWingSlam(target);
            
            // Clean up all Shadow Wings VFX and restore normal targeting
            cleanupShadowWingsEffects();
            updateTargetingForShadowWings();
        }
    };

    // Apply the buff to the caster
    caster.addBuff(shadowWingsBuff);

    // Update UI
    if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
        window.gameManager.uiManager.updateCharacterUI(caster);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    return { success: true };
};

/**
 * Execute the wing slam damage when the buff expires
 */
function executeWingSlam(caster) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    console.log(`[Shadow Wings] Executing wing slam for ${caster.name}`);

    // Play landing sound
    playSound('sounds/wing_slam.mp3', 1.0);

    // Show wing slam VFX (this also cleans up flying effects)
    showWingSlamVFX(caster);

    // Get all enemy characters
    let enemies = [];
    if (window.gameManager && window.gameManager.gameState) {
        if (caster.isAI) {
            // If caster is AI, target player characters
            enemies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
        } else {
            // If caster is player, target AI characters
            enemies = window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
        }
    }

    if (enemies.length === 0) {
        log(`${caster.name} lands gracefully, but there are no enemies to damage.`);
        return;
    }

    // Calculate damage: 666 + 66% Physical Damage
    const fixedDamage = 666;
    const physicalDamageBonus = Math.floor((caster.stats.physicalDamage || 0) * 0.66);
    const totalDamage = fixedDamage + physicalDamageBonus;

    log(`${caster.name}'s Shadow Wings slam deals devastating damage to all enemies!`);

    // Apply damage to all enemies
    enemies.forEach((enemy, index) => {
        setTimeout(() => {
            if (!enemy.isDead()) {
                const damageResult = enemy.applyDamage(totalDamage, 'physical', caster);
                log(`${enemy.name} takes ${damageResult.damage} physical damage from the wing slam!`, damageResult.isCritical ? 'critical' : '');
                
                // Show individual impact VFX
                showWingSlamImpactVFX(enemy);

                // Check if enemy died
                if (enemy.isDead()) {
                    log(`${enemy.name} has been crushed by the devastating landing!`);
                }

                // Update UI
                if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
                    window.gameManager.uiManager.updateCharacterUI(enemy);
                } else if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(enemy);
                }
            }
        }, index * 150); // Stagger damage for dramatic effect
    });
}

/**
 * Shadow Wings VFX - Shows flying wing effects on the character
 */
function showShadowWingsVFX(character) {
    // Add CSS styles if not already added
    if (!document.getElementById('shadow-wings-styles')) {
        addShadowWingsStyles();
    }

    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    // Create wing container
    const wingsContainer = document.createElement('div');
    wingsContainer.className = 'shadow-wings-container';
    wingsContainer.id = `shadow-wings-${character.instanceId || character.id}`;
    characterElement.appendChild(wingsContainer);

    // Create left wing
    const leftWing = document.createElement('div');
    leftWing.className = 'shadow-wing left-wing';
    wingsContainer.appendChild(leftWing);

    // Create right wing
    const rightWing = document.createElement('div');
    rightWing.className = 'shadow-wing right-wing';
    wingsContainer.appendChild(rightWing);

    // Create floating particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'wing-particles';
    wingsContainer.appendChild(particleContainer);

    // Generate floating particles
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            createWingParticle(particleContainer);
        }, i * 200);
    }

    // Add dramatic flying effect to character
    characterElement.classList.add('character-shadow-wings-flying');
    characterElement.style.transition = 'all 0.8s ease-in-out';
}

/**
 * Creates individual wing particles
 */
function createWingParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'wing-particle';
    
    // Random positioning
    particle.style.left = (Math.random() * 100) + '%';
    particle.style.animationDelay = (Math.random() * 2) + 's';
    
    container.appendChild(particle);
    
    // Remove after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
        }
    }, 4000);
}

/**
 * Wing Slam VFX - Shows the devastating landing impact
 */
function showWingSlamVFX(character) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    // Remove flying effects and reset character appearance
    const wingsContainer = document.getElementById(`shadow-wings-${character.instanceId || character.id}`);
    if (wingsContainer) {
        wingsContainer.remove();
    }
    
    if (characterElement) {
        characterElement.classList.remove('character-shadow-wings-flying');
        characterElement.style.transform = '';
        characterElement.style.filter = '';
        characterElement.style.animation = '';
        characterElement.style.boxShadow = ''; // Clear the golden aura
    }

    // Reset character appearance completely
    characterElement.style.filter = '';
    characterElement.style.transform = '';
    characterElement.style.boxShadow = '';

    console.log(`[Shadow Wings] Wing slam VFX - cleared flying effects for ${character.name}`);

    // Create slam effect
    const slamEffect = document.createElement('div');
    slamEffect.className = 'wing-slam-effect';
    characterElement.appendChild(slamEffect);

    // Create shockwave
    const shockwave = document.createElement('div');
    shockwave.className = 'wing-slam-shockwave';
    document.body.appendChild(shockwave);

    // Position shockwave at character
    const rect = characterElement.getBoundingClientRect();
    shockwave.style.left = (rect.left + rect.width / 2) + 'px';
    shockwave.style.top = (rect.top + rect.height / 2) + 'px';

    // Remove effects after animation
    setTimeout(() => {
        if (slamEffect.parentNode) slamEffect.remove();
        if (shockwave.parentNode) shockwave.remove();
    }, 2000);
}

/**
 * Wing Slam Impact VFX - Individual enemy impact effects
 */
function showWingSlamImpactVFX(enemy) {
    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
    if (!enemyElement) return;

    // Create impact effect
    const impactEffect = document.createElement('div');
    impactEffect.className = 'wing-slam-impact';
    enemyElement.appendChild(impactEffect);

    // Screen shake for dramatic effect
    document.body.style.animation = 'wing-slam-shake 0.5s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);

    // Remove impact effect
    setTimeout(() => {
        if (impactEffect.parentNode) {
            impactEffect.remove();
        }
    }, 1500);
}

/**
 * Clean up all Shadow Wings visual effects
 */
function cleanupShadowWingsEffects() {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    const allCharacters = [
        ...window.gameManager.gameState.playerCharacters,
        ...window.gameManager.gameState.aiCharacters
    ];
    
    allCharacters.forEach(char => {
        const charElement = document.getElementById(`character-${char.instanceId || char.id}`);
        if (!charElement) return;
        
        // Remove all Shadow Wings related visual effects
        charElement.classList.remove('character-shadow-wings-flying');
        
        // Remove any Shadow Wings VFX containers
        const wingsContainer = document.getElementById(`shadow-wings-${char.instanceId || char.id}`);
        if (wingsContainer) {
            wingsContainer.remove();
        }
        
        // Reset any style modifications from Shadow Wings
        charElement.style.filter = '';
        charElement.style.transform = '';
        charElement.style.animation = '';
        charElement.style.boxShadow = '';
        
        console.log(`[Shadow Wings] Cleaned up VFX for ${char.name}`);
    });
}

/**
 * Update targeting logic when Shadow Wings is applied or removed
 */
function updateTargetingForShadowWings() {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    const allCharacters = [
        ...window.gameManager.gameState.playerCharacters,
        ...window.gameManager.gameState.aiCharacters
    ];
    
    // Find character with Shadow Wings (forcing targeting)
    const shadowWingsChar = allCharacters.find(char => 
        !char.isDead() && 
        char.buffs.some(buff => buff.forcesTargeting === true)
    );
    
    console.log(`[Shadow Wings] Updating targeting - Shadow Wings active: ${shadowWingsChar ? shadowWingsChar.name : 'none'}`);
    
    // Update character UIs to reflect targeting status
    allCharacters.forEach(char => {
        // Update character UI to reflect targeting status
        if (window.gameManager.uiManager && window.gameManager.uiManager.updateCharacterUI) {
            window.gameManager.uiManager.updateCharacterUI(char);
        }
    });
    
    // Clear any current target selections to force re-selection under new rules
    if (window.gameManager.uiManager && window.gameManager.uiManager.clearSelection) {
        window.gameManager.uiManager.clearSelection();
    }
}

/**
 * Add CSS styles for Shadow Wings effects
 */
function addShadowWingsStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'shadow-wings-styles';
    styleSheet.textContent = `
        /* Shadow Wings Container */
        .shadow-wings-container {
            position: absolute;
            top: -30%;
            left: -50%;
            width: 200%;
            height: 160%;
            pointer-events: none;
            z-index: 15;
            overflow: visible;
        }

        /* Individual Wing Styling */
        .shadow-wing {
            position: absolute;
            width: 120px;
            height: 180px;
            background: 
                radial-gradient(ellipse 60% 40% at 30% 20%, rgba(180, 60, 60, 0.6) 0%, transparent 50%),
                radial-gradient(ellipse 40% 60% at 70% 30%, rgba(120, 40, 40, 0.4) 0%, transparent 60%),
                linear-gradient(135deg, 
                    rgba(80, 20, 20, 0.95) 0%,
                    rgba(120, 30, 30, 0.9) 15%,
                    rgba(160, 50, 50, 0.85) 30%,
                    rgba(100, 25, 25, 0.8) 50%,
                    rgba(60, 15, 15, 0.75) 70%,
                    rgba(40, 10, 10, 0.7) 85%,
                    rgba(20, 5, 5, 0.6) 100%);
            border-radius: 60% 5% 80% 90%;
            box-shadow: 
                0 0 30px rgba(80, 20, 20, 0.9),
                0 0 60px rgba(120, 30, 30, 0.6),
                inset 0 0 40px rgba(0, 0, 0, 0.6),
                inset 20px 10px 30px rgba(180, 60, 60, 0.3),
                inset -20px -10px 30px rgba(0, 0, 0, 0.8);
            transform-origin: bottom center;
            filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.7));
        }

        /* Wing membrane details */
        .shadow-wing::before {
            content: '';
            position: absolute;
            top: 15%;
            left: 20%;
            width: 60%;
            height: 70%;
            background: 
                radial-gradient(ellipse at 30% 40%, rgba(200, 80, 80, 0.4) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 60%, rgba(150, 50, 50, 0.3) 0%, transparent 50%),
                linear-gradient(45deg, transparent 30%, rgba(180, 60, 60, 0.2) 50%, transparent 70%);
            border-radius: 50% 20% 70% 80%;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
        }

        /* Wing veins/structure */
        .shadow-wing::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                linear-gradient(120deg, transparent 20%, rgba(200, 100, 100, 0.6) 21%, rgba(200, 100, 100, 0.6) 23%, transparent 24%),
                linear-gradient(150deg, transparent 35%, rgba(180, 80, 80, 0.5) 36%, rgba(180, 80, 80, 0.5) 38%, transparent 39%),
                linear-gradient(100deg, transparent 50%, rgba(160, 60, 60, 0.4) 51%, rgba(160, 60, 60, 0.4) 53%, transparent 54%),
                linear-gradient(140deg, transparent 65%, rgba(140, 40, 40, 0.3) 66%, rgba(140, 40, 40, 0.3) 68%, transparent 69%);
            border-radius: 60% 5% 80% 90%;
            pointer-events: none;
        }

        .left-wing {
            left: -15%;
            top: 10%;
            transform: rotate(-25deg) scaleX(-1);
            animation: wing-flap-left 1.8s ease-in-out infinite;
        }

        .right-wing {
            right: -15%;
            top: 10%;
            transform: rotate(25deg);
            animation: wing-flap-right 1.8s ease-in-out infinite;
        }

        @keyframes wing-flap-left {
            0% { transform: rotate(-25deg) scaleX(-1) translateY(0px) scale(1); }
            25% { transform: rotate(-35deg) scaleX(-1) translateY(-12px) scale(1.05); }
            50% { transform: rotate(-40deg) scaleX(-1) translateY(-18px) scale(1.1); }
            75% { transform: rotate(-30deg) scaleX(-1) translateY(-8px) scale(1.02); }
            100% { transform: rotate(-25deg) scaleX(-1) translateY(0px) scale(1); }
        }

        @keyframes wing-flap-right {
            0% { transform: rotate(25deg) translateY(0px) scale(1); }
            25% { transform: rotate(35deg) translateY(-12px) scale(1.05); }
            50% { transform: rotate(40deg) translateY(-18px) scale(1.1); }
            75% { transform: rotate(30deg) translateY(-8px) scale(1.02); }
            100% { transform: rotate(25deg) translateY(0px) scale(1); }
        }

        /* Wing Particles */
        .wing-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .wing-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            background: 
                radial-gradient(circle at 30% 30%, rgba(255, 150, 150, 1) 0%, rgba(200, 80, 80, 0.8) 40%, transparent 70%),
                radial-gradient(circle at 70% 70%, rgba(180, 60, 60, 0.9) 0%, rgba(120, 30, 30, 0.6) 50%, transparent 80%);
            border-radius: 50%;
            box-shadow: 
                0 0 8px rgba(200, 80, 80, 0.8),
                0 0 16px rgba(120, 30, 30, 0.4),
                inset 0 0 4px rgba(255, 180, 180, 0.6);
            animation: wing-particle-float 5s ease-out infinite;
        }

        .wing-particle:nth-child(2n) {
            width: 8px;
            height: 8px;
            background: 
                radial-gradient(circle at 40% 20%, rgba(255, 120, 120, 0.9) 0%, rgba(180, 50, 50, 0.7) 50%, transparent 80%),
                radial-gradient(circle at 60% 80%, rgba(160, 40, 40, 0.8) 0%, rgba(100, 20, 20, 0.5) 60%, transparent 90%);
            animation-duration: 4.5s;
            animation-delay: 0.5s;
        }

        .wing-particle:nth-child(3n) {
            width: 5px;
            height: 5px;
            background: 
                radial-gradient(circle, rgba(220, 100, 100, 1) 0%, rgba(140, 40, 40, 0.8) 40%, transparent 75%);
            animation-duration: 5.5s;
            animation-delay: 1s;
        }

        @keyframes wing-particle-float {
            0% {
                transform: translateY(120px) translateX(0px) scale(0) rotate(0deg);
                opacity: 0;
                filter: blur(2px);
            }
            15% {
                transform: translateY(90px) translateX(5px) scale(1) rotate(45deg);
                opacity: 1;
                filter: blur(0px);
            }
            50% {
                transform: translateY(20px) translateX(-8px) scale(1.2) rotate(180deg);
                opacity: 0.9;
                filter: blur(0px);
            }
            85% {
                transform: translateY(-80px) translateX(12px) scale(0.6) rotate(270deg);
                opacity: 0.6;
                filter: blur(1px);
            }
            100% {
                transform: translateY(-140px) translateX(-15px) scale(0) rotate(360deg);
                opacity: 0;
                filter: blur(3px);
            }
        }

        /* Character Flying Effect */
        .character-shadow-wings-flying {
            transform: translateY(-25px) scale(1.08) !important;
            filter: 
                drop-shadow(0 0 30px rgba(200, 80, 80, 1))
                drop-shadow(0 0 60px rgba(120, 30, 30, 0.8))
                drop-shadow(0 20px 50px rgba(0, 0, 0, 0.9))
                brightness(1.25)
                contrast(1.2)
                saturate(1.3) !important;
            animation: character-shadow-wings-hover 2.8s ease-in-out infinite !important;
            z-index: 12 !important;
            /* Add a commanding aura effect */
            box-shadow: 
                0 0 40px rgba(255, 215, 0, 0.8),
                0 0 80px rgba(255, 215, 0, 0.4),
                inset 0 0 30px rgba(255, 215, 0, 0.2) !important;
        }

        @keyframes character-shadow-wings-hover {
            0% { 
                transform: translateY(-25px) scale(1.08) rotate(0deg); 
                filter: 
                    drop-shadow(0 0 30px rgba(200, 80, 80, 1))
                    drop-shadow(0 0 60px rgba(120, 30, 30, 0.8))
                    drop-shadow(0 20px 50px rgba(0, 0, 0, 0.9))
                    brightness(1.25)
                    contrast(1.2)
                    saturate(1.3);
            }
            20% { 
                transform: translateY(-32px) scale(1.12) rotate(0.5deg); 
                filter: 
                    drop-shadow(0 0 35px rgba(255, 120, 120, 1))
                    drop-shadow(0 0 70px rgba(160, 50, 50, 0.9))
                    drop-shadow(0 25px 60px rgba(0, 0, 0, 1))
                    brightness(1.3)
                    contrast(1.25)
                    saturate(1.4);
            }
            40% { 
                transform: translateY(-38px) scale(1.15) rotate(0deg); 
                filter: 
                    drop-shadow(0 0 40px rgba(255, 150, 150, 1))
                    drop-shadow(0 0 80px rgba(180, 60, 60, 1))
                    drop-shadow(0 30px 70px rgba(0, 0, 0, 1.1))
                    brightness(1.35)
                    contrast(1.3)
                    saturate(1.5);
            }
            60% { 
                transform: translateY(-32px) scale(1.12) rotate(-0.5deg); 
                filter: 
                    drop-shadow(0 0 35px rgba(255, 120, 120, 1))
                    drop-shadow(0 0 70px rgba(160, 50, 50, 0.9))
                    drop-shadow(0 25px 60px rgba(0, 0, 0, 1))
                    brightness(1.3)
                    contrast(1.25)
                    saturate(1.4);
            }
            80% { 
                transform: translateY(-28px) scale(1.1) rotate(0deg); 
                filter: 
                    drop-shadow(0 0 32px rgba(220, 100, 100, 1))
                    drop-shadow(0 0 65px rgba(140, 40, 40, 0.85))
                    drop-shadow(0 22px 55px rgba(0, 0, 0, 0.95))
                    brightness(1.28)
                    contrast(1.22)
                    saturate(1.35);
            }
            100% { 
                transform: translateY(-25px) scale(1.08) rotate(0deg); 
                filter: 
                    drop-shadow(0 0 30px rgba(200, 80, 80, 1))
                    drop-shadow(0 0 60px rgba(120, 30, 30, 0.8))
                    drop-shadow(0 20px 50px rgba(0, 0, 0, 0.9))
                    brightness(1.25)
                    contrast(1.2)
                    saturate(1.3);
            }
        }

        /* Wing Slam Effects */
        .wing-slam-effect {
            position: absolute;
            top: -20%;
            left: -20%;
            width: 140%;
            height: 140%;
            background: radial-gradient(circle, 
                rgba(139, 69, 19, 0.6) 0%,
                rgba(101, 67, 33, 0.4) 30%,
                rgba(62, 39, 35, 0.2) 60%,
                transparent 100%);
            border-radius: 50%;
            animation: wing-slam-burst 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 20;
        }

        @keyframes wing-slam-burst {
            0% {
                transform: scale(0) rotate(0deg);
                opacity: 0;
            }
            30% {
                transform: scale(1.5) rotate(45deg);
                opacity: 1;
            }
            70% {
                transform: scale(2) rotate(90deg);
                opacity: 0.6;
            }
            100% {
                transform: scale(3) rotate(135deg);
                opacity: 0;
            }
        }

        /* Shockwave Effect */
        .wing-slam-shockwave {
            position: fixed;
            width: 50px;
            height: 50px;
            border: 3px solid rgba(139, 69, 19, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: shockwave-expand 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 999;
        }

        @keyframes shockwave-expand {
            0% {
                width: 50px;
                height: 50px;
                opacity: 1;
                border-width: 3px;
            }
            50% {
                width: 300px;
                height: 300px;
                opacity: 0.6;
                border-width: 2px;
            }
            100% {
                width: 600px;
                height: 600px;
                opacity: 0;
                border-width: 1px;
            }
        }

        /* Individual Impact Effects */
        .wing-slam-impact {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, 
                rgba(139, 69, 19, 0.8) 0%,
                rgba(160, 82, 45, 0.6) 30%,
                transparent 70%);
            border-radius: 50%;
            animation: impact-flash 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 18;
        }

        @keyframes impact-flash {
            0% {
                transform: scale(0.5);
                opacity: 0;
            }
            20% {
                transform: scale(1.2);
                opacity: 1;
            }
            60% {
                transform: scale(1);
                opacity: 0.8;
            }
            100% {
                transform: scale(0.8);
                opacity: 0;
            }
        }

        /* Screen Shake Effect */
        @keyframes wing-slam-shake {
            0%, 100% { transform: translateX(0); }
            10% { transform: translateX(-2px); }
            20% { transform: translateX(2px); }
            30% { transform: translateX(-3px); }
            40% { transform: translateX(3px); }
            50% { transform: translateX(-2px); }
            60% { transform: translateX(2px); }
            70% { transform: translateX(-1px); }
            80% { transform: translateX(1px); }
            90% { transform: translateX(-1px); }
        }


    `;
    document.head.appendChild(styleSheet);
}

/**
 * Kiss of Death Effect - Applies a deadly curse with escalating damage over 4 turns
 */
const kissOfDeathEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name}'s Kiss of Death failed: No valid target!`, 'error');
        return { success: false };
    }

    log(`${caster.name} blows a deadly kiss toward ${target.name}...`);

    // Play kiss sound effect
    playSound('sounds/kiss_of_death.mp3', 0.9);

    // Show Kiss of Death VFX
    showKissOfDeathVFX(caster, target);

    // Create the Kiss of Death curse debuff
    const kissOfDeathCurse = {
        id: 'kiss_of_death_curse',
        name: 'Kiss of Death',
        icon: 'Icons/abilities/kiss_of_death.png',
        duration: 4,
        description: 'Cursed by a deadly kiss. Takes escalating damage each turn: 100 → 200 → 400 → 800.',
        isDebuff: true,
        stackable: false,
        effect: {
            type: 'damage_over_time',
            value: 100 // Base damage, will be modified dynamically
        },
        customDoTHandler: true, // Flag to identify this needs special handling
        onTurnStart: (target) => {
            // This will handle the VFX and logging, actual damage is handled by the DoT system
            const debuff = target.debuffs.find(d => d.id === 'kiss_of_death_curse');
            if (!debuff) return;
            
            // Get current global turn number
            const currentTurn = window.gameManager ? window.gameManager.gameState.turn : 1;
            
            // Check if we've already processed this turn
            if (debuff.lastProcessedTurn === currentTurn) {
                return; // Skip - already processed this turn
            }
            
            // Mark this turn as processed
            debuff.lastProcessedTurn = currentTurn;
            
            // Calculate current curse turn and damage
            const curseTurn = 5 - debuff.duration;
            const baseDamage = 100;
            const damage = baseDamage * Math.pow(2, curseTurn - 1);
            
            // Update the effect value for the DoT system
            debuff.effect.value = damage;
            
            // Show VFX
            showKissOfDeathDamageVFX(target, damage, curseTurn);
            
            // Log message
            log(`${target.name} suffers from the Kiss of Death curse! (Turn ${curseTurn}/4)`, 'debuff');
        },
        onApply: (target) => {
            log(`${target.name} is marked by the Kiss of Death! The curse will grow stronger each turn.`, 'debuff');
        },
        onRemove: (target) => {
            log(`The Kiss of Death curse fades from ${target.name}.`, 'debuff');
            
            // Remove any lingering VFX
            const kissMarks = document.querySelectorAll(`.kiss-of-death-mark-${target.instanceId || target.id}`);
            kissMarks.forEach(mark => mark.remove());
        }
    };

    // Apply the curse to the target
    target.addDebuff(kissOfDeathCurse);

    // Update UI
    if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
        window.gameManager.uiManager.updateCharacterUI(target);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

    return { success: true };
};

/**
 * Kiss of Death VFX - Shows seductive kiss animation from caster to target
 */
function showKissOfDeathVFX(caster, target) {
    // Add CSS styles if not already added
    if (!document.getElementById('kiss-of-death-styles')) {
        addKissOfDeathStyles();
    }

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    
    if (!casterElement || !targetElement) return;

    // Create kiss projectile
    const kissProjectile = document.createElement('div');
    kissProjectile.className = 'kiss-projectile';
    document.body.appendChild(kissProjectile);

    // Position at caster
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    kissProjectile.style.left = (casterRect.left + casterRect.width / 2) + 'px';
    kissProjectile.style.top = (casterRect.top + casterRect.height / 2) + 'px';

    // Calculate trajectory to target
    const deltaX = (targetRect.left + targetRect.width / 2) - (casterRect.left + casterRect.width / 2);
    const deltaY = (targetRect.top + targetRect.height / 2) - (casterRect.top + casterRect.height / 2);

    // Animate kiss to target
    kissProjectile.style.setProperty('--target-x', deltaX + 'px');
    kissProjectile.style.setProperty('--target-y', deltaY + 'px');
    kissProjectile.classList.add('kiss-flying');

    // When kiss reaches target, apply curse mark
    setTimeout(() => {
        // Remove kiss projectile
        kissProjectile.remove();
        
        // Apply curse mark to target
        applyKissOfDeathMark(target);
        
        // Show initial curse application VFX
        showKissOfDeathApplicationVFX(target);
    }, 1200);
}

/**
 * Apply the visual kiss mark to the target
 */
function applyKissOfDeathMark(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create kiss mark overlay
    const kissMark = document.createElement('div');
    kissMark.className = `kiss-of-death-mark kiss-of-death-mark-${target.instanceId || target.id}`;
    targetElement.appendChild(kissMark);

    // Create withering aura
    const witheringAura = document.createElement('div');
    witheringAura.className = `withering-aura kiss-of-death-mark-${target.instanceId || target.id}`;
    targetElement.appendChild(witheringAura);
}

/**
 * Show the initial curse application effects
 */
function showKissOfDeathApplicationVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create curse application burst
    const curseBurst = document.createElement('div');
    curseBurst.className = 'kiss-curse-application';
    targetElement.appendChild(curseBurst);

    // Remove after animation
    setTimeout(() => {
        curseBurst.remove();
    }, 2000);
}

/**
 * Show damage VFX when the curse deals damage each turn
 */
function showKissOfDeathDamageVFX(target, damage, turn) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create damage effect based on turn intensity
    const damageEffect = document.createElement('div');
    damageEffect.className = `kiss-damage-effect kiss-damage-turn-${turn}`;
    targetElement.appendChild(damageEffect);

    // Create floating damage text
    const damageText = document.createElement('div');
    damageText.className = 'kiss-damage-text';
    damageText.textContent = `-${damage}`;
    damageText.style.setProperty('--turn', turn);
    targetElement.appendChild(damageText);

    // Intensify the withering effect each turn
    const witheringAura = targetElement.querySelector('.withering-aura');
    if (witheringAura) {
        witheringAura.style.setProperty('--intensity', turn / 4);
    }

    // Remove effects after animation
    setTimeout(() => {
        damageEffect.remove();
        damageText.remove();
    }, 2500);
}

/**
 * Add CSS styles for Kiss of Death effects
 */
function addKissOfDeathStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'kiss-of-death-styles';
    styleSheet.textContent = `
        /* Kiss Projectile */
        .kiss-projectile {
            position: fixed;
            width: 30px;
            height: 30px;
            background: linear-gradient(45deg, 
                rgba(255, 20, 147, 1) 0%,
                rgba(199, 21, 133, 0.9) 30%,
                rgba(147, 112, 219, 0.8) 60%,
                rgba(138, 43, 226, 0.7) 100%);
            border-radius: 50%;
            box-shadow: 
                0 0 20px rgba(255, 20, 147, 0.8),
                0 0 40px rgba(199, 21, 133, 0.6),
                inset 0 0 15px rgba(255, 255, 255, 0.3);
            z-index: 1000;
            pointer-events: none;
        }

        .kiss-projectile::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 10px;
            background: linear-gradient(180deg, 
                rgba(139, 0, 139, 1) 0%,
                rgba(75, 0, 130, 0.9) 50%,
                rgba(25, 25, 112, 0.7) 100%);
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            box-shadow: 
                0 0 8px rgba(139, 0, 139, 0.8),
                inset 0 1px 2px rgba(255, 255, 255, 0.3);
            animation: kiss-pulse 0.5s ease-in-out infinite alternate;
        }

        .kiss-projectile::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 6px;
            background: linear-gradient(180deg, 
                rgba(75, 0, 130, 0.8) 0%,
                rgba(25, 25, 112, 0.6) 100%);
            border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
            animation: kiss-pulse 0.5s ease-in-out infinite alternate reverse;
        }

        .kiss-flying {
            animation: kiss-flight 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes kiss-flight {
            0% {
                transform: translate(0, 0) scale(1) rotate(0deg);
                opacity: 1;
            }
            50% {
                transform: translate(calc(var(--target-x) * 0.6), calc(var(--target-y) * 0.4)) scale(1.2) rotate(180deg);
                opacity: 0.9;
            }
            100% {
                transform: translate(var(--target-x), var(--target-y)) scale(0.8) rotate(360deg);
                opacity: 0.7;
            }
        }

        @keyframes kiss-pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            100% { transform: translate(-50%, -50%) scale(1.1); }
        }

        /* Kiss Mark on Target */
        .kiss-of-death-mark {
            position: absolute;
            top: 15%;
            right: 10%;
            width: 22px;
            height: 14px;
            z-index: 10;
            animation: kiss-mark-glow 2s ease-in-out infinite;
            filter: drop-shadow(0 0 8px rgba(139, 0, 139, 0.9));
        }

        .kiss-of-death-mark::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, 
                rgba(75, 0, 130, 1) 0%,
                rgba(25, 25, 112, 0.9) 50%,
                rgba(0, 0, 0, 0.8) 100%);
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            box-shadow: 
                0 0 6px rgba(75, 0, 130, 0.8),
                inset 0 1px 2px rgba(255, 255, 255, 0.2),
                inset 0 -1px 2px rgba(0, 0, 0, 0.5);
        }

        .kiss-of-death-mark::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 3px;
            width: 16px;
            height: 8px;
            background: linear-gradient(180deg, 
                rgba(25, 25, 112, 0.7) 0%,
                rgba(0, 0, 0, 0.5) 100%);
            border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
        }

        @keyframes kiss-mark-glow {
            0%, 100% { 
                transform: scale(1);
                filter: drop-shadow(0 0 8px rgba(139, 0, 139, 0.9));
            }
            50% { 
                transform: scale(1.1);
                filter: drop-shadow(0 0 15px rgba(139, 0, 139, 1));
            }
        }

        /* Withering Aura */
        .withering-aura {
            position: absolute;
            top: -20%;
            left: -20%;
            width: 140%;
            height: 140%;
            background: radial-gradient(circle,
                rgba(75, 0, 130, calc(0.3 * var(--intensity, 0.5))) 0%,
                rgba(128, 0, 128, calc(0.2 * var(--intensity, 0.5))) 40%,
                rgba(25, 25, 112, calc(0.1 * var(--intensity, 0.5))) 70%,
                transparent 100%);
            border-radius: 50%;
            animation: withering-pulse calc(3s - var(--intensity, 0.5) * 1s) ease-in-out infinite;
            pointer-events: none;
            z-index: 5;
        }

        @keyframes withering-pulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 0.6;
            }
            50% { 
                transform: scale(1.15);
                opacity: 0.9;
            }
        }

        /* Curse Application Burst */
        .kiss-curse-application {
            position: absolute;
            top: -30%;
            left: -30%;
            width: 160%;
            height: 160%;
            background: radial-gradient(circle,
                rgba(255, 20, 147, 0.8) 0%,
                rgba(199, 21, 133, 0.6) 30%,
                rgba(147, 112, 219, 0.4) 60%,
                transparent 100%);
            border-radius: 50%;
            animation: curse-application-burst 2s ease-out forwards;
            pointer-events: none;
            z-index: 15;
        }

        @keyframes curse-application-burst {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.8;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }

        /* Damage Effects Per Turn */
        .kiss-damage-effect {
            position: absolute;
            top: -10%;
            left: -10%;
            width: 120%;
            height: 120%;
            border-radius: 50%;
            animation: kiss-damage-pulse 2.5s ease-out forwards;
            pointer-events: none;
            z-index: 12;
        }

        .kiss-damage-turn-1 {
            background: radial-gradient(circle, rgba(128, 0, 128, 0.6) 0%, transparent 70%);
        }

        .kiss-damage-turn-2 {
            background: radial-gradient(circle, rgba(138, 43, 226, 0.7) 0%, transparent 70%);
        }

        .kiss-damage-turn-3 {
            background: radial-gradient(circle, rgba(148, 0, 211, 0.8) 0%, transparent 70%);
        }

        .kiss-damage-turn-4 {
            background: radial-gradient(circle, rgba(75, 0, 130, 0.9) 0%, transparent 70%);
        }

        @keyframes kiss-damage-pulse {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            30% {
                transform: scale(1.3);
                opacity: 0.8;
            }
            100% {
                transform: scale(2.5);
                opacity: 0;
            }
        }

        /* Floating Damage Text */
        .kiss-damage-text {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: calc(16px + var(--turn, 1) * 4px);
            font-weight: bold;
            color: #ff1493;
            text-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.8),
                0 0 10px rgba(255, 20, 147, 0.8);
            animation: kiss-damage-float 2.5s ease-out forwards;
            pointer-events: none;
            z-index: 20;
        }

        @keyframes kiss-damage-float {
            0% {
                transform: translateX(-50%) translateY(0) scale(0.5);
                opacity: 1;
            }
            20% {
                transform: translateX(-50%) translateY(-10px) scale(1);
                opacity: 1;
            }
            100% {
                transform: translateX(-50%) translateY(-50px) scale(1.2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

/**
 * Temptation's Embrace Effect - Steals 1% HP and Mana from all enemies
 */
const temptationsEmbraceEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // For all_enemies target type, the target parameter contains all enemies
    // Handle both array (all_enemies) and single target cases
    let enemies = [];
    if (Array.isArray(target)) {
        enemies = target;
    } else if (target) {
        enemies = [target];
    } else {
        // Fallback to getting opponents manually
        enemies = window.gameManager ? window.gameManager.getOpponents(caster) : [];
    }
    
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Temptation's Embrace failed: No enemies to drain!`, 'error');
        return { success: false };
    }

    log(`${caster.name} unleashes her ultimate seduction, draining the essence from all enemies...`);
    console.log(`[Temptation's Embrace Debug] Found ${enemies.length} enemies to drain:`, enemies.map(e => `${e.name} (HP: ${e.stats?.currentHp}, Mana: ${e.stats?.currentMana})`));

    // Play temptation sound effect
    playSound('sounds/temptation_embrace.mp3', 0.9);

    // Show main VFX
    showTemptationsEmbraceVFX(caster, enemies);

    let totalHPDrained = 0;
    let totalManaDrained = 0;

    // Process each enemy
    enemies.forEach((enemy, index) => {
        if (enemy.isDead()) {
            console.log(`[Temptation's Embrace Debug] Skipping ${enemy.name} - already dead`);
            return;
        }

        // Calculate 8% of current HP and Mana
        const currentHp = enemy.stats?.currentHp || 0;
        const currentMana = enemy.stats?.currentMana || 0;
        const hpToDrain = Math.floor(currentHp * 0.08);
        const manaToDrain = Math.floor(currentMana * 0.08);
        console.log(`[Temptation's Embrace Debug] Processing ${enemy.name}: HP to drain: ${hpToDrain}, Mana to drain: ${manaToDrain}`);

        let actualHPDrained = 0;
        let actualManaDrained = 0;

        // Drain HP (as true damage to bypass shields)
        if (hpToDrain > 0) {
            actualHPDrained = Math.min(hpToDrain, currentHp);
            console.log(`[Temptation's Embrace Debug] Draining ${actualHPDrained} HP from ${enemy.name} (${currentHp} -> ${currentHp - actualHPDrained})`);
            
            // Update HP using the correct property
            enemy.stats.currentHp -= actualHPDrained;
            enemy.stats.currentHp = Math.max(0, enemy.stats.currentHp); // Ensure it doesn't go negative
            
            totalHPDrained += actualHPDrained;
        }

        // Drain Mana
        if (manaToDrain > 0) {
            actualManaDrained = Math.min(manaToDrain, currentMana);
            console.log(`[Temptation's Embrace Debug] Draining ${actualManaDrained} Mana from ${enemy.name} (${currentMana} -> ${currentMana - actualManaDrained})`);
            
            // Update Mana using the correct property
            enemy.stats.currentMana -= actualManaDrained;
            enemy.stats.currentMana = Math.max(0, enemy.stats.currentMana); // Ensure it doesn't go negative
            
            totalManaDrained += actualManaDrained;
        }

        // Show combined drain VFX for both HP and Mana (only one call per enemy)
        if (actualHPDrained > 0 || actualManaDrained > 0) {
            setTimeout(() => {
                showCombinedDrainVFX(enemy, actualHPDrained, actualManaDrained);
            }, index * 200);
        }

        // Update enemy UI
        if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
            window.gameManager.uiManager.updateCharacterUI(enemy);
        }

        // Check if enemy died from HP drain
        if (enemy.stats.currentHp <= 0 && !enemy.isDead()) {
            enemy.stats.currentHp = 0;
            
            if (typeof enemy.die === 'function') {
                enemy.die();
            }
            log(`${enemy.name} has been drained of their life essence!`);
        }
    });

    // Apply drained resources to caster
    if (totalHPDrained > 0) {
        const casterCurrentHp = caster.stats?.currentHp || 0;
        const casterMaxHp = caster.stats?.maxHp || caster.stats?.currentHp || 0;
        const newHp = Math.min(casterCurrentHp + totalHPDrained, casterMaxHp);
        
        caster.stats.currentHp = newHp;
        
        setTimeout(() => {
            showCasterAbsorptionVFX(caster, totalHPDrained, 'HP');
        }, 800);
    }

    if (totalManaDrained > 0) {
        const casterCurrentMana = caster.stats?.currentMana || 0;
        const casterMaxMana = caster.stats?.maxMana || caster.stats?.currentMana || 0;
        const newMana = Math.min(casterCurrentMana + totalManaDrained, casterMaxMana);
        
        caster.stats.currentMana = newMana;
        
        setTimeout(() => {
            showCasterAbsorptionVFX(caster, totalManaDrained, 'MANA');
        }, 900);
    }

    // Update caster UI
    setTimeout(() => {
        if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
            window.gameManager.uiManager.updateCharacterUI(caster);
        }
    }, 1000);

    // Log results
    console.log(`[Temptation's Embrace Debug] Final totals - HP drained: ${totalHPDrained}, Mana drained: ${totalManaDrained}`);
    if (totalHPDrained > 0 || totalManaDrained > 0) {
        log(`${caster.name} absorbs ${totalHPDrained} HP and ${totalManaDrained} Mana from her victims!`, 'heal');
    } else {
        console.log(`[Temptation's Embrace Debug] No resources were drained - ability had no effect`);
    }

    return { 
        success: true, 
        hpDrained: totalHPDrained,
        manaDrained: totalManaDrained,
        enemiesAffected: enemies.filter(e => !e.isDead()).length
    };
};

/**
 * Main VFX for Temptation's Embrace - creates seductive aura around Morissa
 */
function showTemptationsEmbraceVFX(caster, enemies) {
    // Add CSS styles if not already added
    if (!document.getElementById('temptations-embrace-styles')) {
        addTemptationsEmbraceStyles();
    }

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create main seductive aura around caster
    const mainAura = document.createElement('div');
    mainAura.className = 'temptation-main-aura';
    casterElement.appendChild(mainAura);

    // Create pulsing energy rings
    const energyRings = document.createElement('div');
    energyRings.className = 'temptation-energy-rings';
    casterElement.appendChild(energyRings);

    // Create seductive particles emanating from caster
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            createSeductionParticle(casterElement, i);
        }, i * 100);
    }

    // Add temporary enhancement to caster
    const originalCasterFilter = casterElement.style.filter || '';
    casterElement.style.filter = 'brightness(1.4) contrast(1.3) saturate(1.5) drop-shadow(0 0 25px #ff69b4)';
    
    // Remove main effects after animation
    setTimeout(() => {
        if (mainAura.parentNode) mainAura.remove();
        if (energyRings.parentNode) energyRings.remove();
        // Explicitly restore original filter or clear it
        casterElement.style.filter = originalCasterFilter || '';
        // Force a style recalculation
        casterElement.offsetHeight;
    }, 3000);
}

/**
 * Creates seductive particles emanating from the caster
 */
function createSeductionParticle(casterElement, index) {
    const particle = document.createElement('div');
    particle.className = 'seduction-particle';
    
    // Random direction for particle
    const angle = (index * 30) + (Math.random() * 30 - 15); // Spread particles in all directions
    const distance = 150 + Math.random() * 100;
    
    casterElement.appendChild(particle);
    
    const radians = angle * Math.PI / 180;
    const deltaX = Math.cos(radians) * distance;
    const deltaY = Math.sin(radians) * distance;
    
    // Animate the particle
    particle.animate([
        { 
            transform: 'translate(0, 0) scale(0.3)', 
            opacity: 0.9,
            filter: 'blur(0px)'
        },
        { 
            transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5}px) scale(1)`, 
            opacity: 1,
            filter: 'blur(1px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0.5)`, 
            opacity: 0.7,
            filter: 'blur(2px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`, 
            opacity: 0,
            filter: 'blur(3px)'
        }
    ], {
        duration: 2000 + (index * 50),
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
        particle.remove();
    };
}

/**
 * Shows combined drain VFX for both HP and Mana on individual enemies
 */
function showCombinedDrainVFX(enemy, hpAmount, manaAmount) {
    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
    if (!enemyElement) return;

    // Create combined drain effects
    if (hpAmount > 0) {
        const hpDrainEffect = document.createElement('div');
        hpDrainEffect.className = 'temptation-drain-effect hp-drain';
        enemyElement.appendChild(hpDrainEffect);

        const hpDrainText = document.createElement('div');
        hpDrainText.className = 'temptation-drain-text hp-drain-text';
        hpDrainText.textContent = `-${hpAmount} HP`;
        hpDrainText.style.top = '-30px';
        enemyElement.appendChild(hpDrainText);

        // Remove HP effects after animation
        setTimeout(() => {
            if (hpDrainEffect.parentNode) hpDrainEffect.remove();
            if (hpDrainText.parentNode) hpDrainText.remove();
        }, 2000);
    }

    if (manaAmount > 0) {
        const manaDrainEffect = document.createElement('div');
        manaDrainEffect.className = 'temptation-drain-effect mana-drain';
        enemyElement.appendChild(manaDrainEffect);

        const manaDrainText = document.createElement('div');
        manaDrainText.className = 'temptation-drain-text mana-drain-text';
        manaDrainText.textContent = `-${manaAmount} MANA`;
        manaDrainText.style.top = '-50px'; // Position above HP text
        enemyElement.appendChild(manaDrainText);

        // Remove Mana effects after animation
        setTimeout(() => {
            if (manaDrainEffect.parentNode) manaDrainEffect.remove();
            if (manaDrainText.parentNode) manaDrainText.remove();
        }, 2000);
    }

    // Apply gray filter effect ONLY ONCE per enemy
    const originalFilter = enemyElement.style.filter || '';
    enemyElement.style.filter = 'brightness(0.7) contrast(0.8) saturate(0.6)';
    
    // Clear the filter effect after 1.5 seconds
    setTimeout(() => {
        enemyElement.style.filter = originalFilter || '';
        // Force a style recalculation
        enemyElement.offsetHeight;
    }, 1500);
}

/**
 * Shows drain VFX on individual enemies (LEGACY - kept for compatibility)
 */
function showEnemyDrainVFX(enemy, amount, type) {
    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
    if (!enemyElement) return;

    // Create drain effect
    const drainEffect = document.createElement('div');
    drainEffect.className = `temptation-drain-effect ${type.toLowerCase()}-drain`;
    enemyElement.appendChild(drainEffect);

    // Create drain amount text
    const drainText = document.createElement('div');
    drainText.className = 'temptation-drain-text';
    drainText.textContent = `-${amount} ${type}`;
    enemyElement.appendChild(drainText);

    // Add temporary weakening effect to enemy
    const originalFilter = enemyElement.style.filter || '';
    enemyElement.style.filter = 'brightness(0.7) contrast(0.8) saturate(0.6)';
    
    setTimeout(() => {
        // Explicitly clear the filter to ensure gray effect is removed
        enemyElement.style.filter = originalFilter || '';
        // Force a style recalculation
        enemyElement.offsetHeight;
    }, 1500);

    // Remove effects after animation
    setTimeout(() => {
        if (drainEffect.parentNode) drainEffect.remove();
        if (drainText.parentNode) drainText.remove();
    }, 2000);
}

/**
 * Shows absorption VFX on the caster
 */
function showCasterAbsorptionVFX(caster, amount, type) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create absorption effect
    const absorptionEffect = document.createElement('div');
    absorptionEffect.className = `temptation-absorption-effect ${type.toLowerCase()}-absorption`;
    casterElement.appendChild(absorptionEffect);

    // Create absorption amount text
    const absorptionText = document.createElement('div');
    absorptionText.className = 'temptation-absorption-text';
    absorptionText.textContent = `+${amount} ${type}`;
    casterElement.appendChild(absorptionText);

    // Add temporary enhancement to caster
    const enhancementColor = type === 'HP' ? '#ff4757' : '#3742fa';
    const originalCasterFilter = casterElement.style.filter || '';
    casterElement.style.filter = `brightness(1.3) drop-shadow(0 0 20px ${enhancementColor})`;
    
    setTimeout(() => {
        // Explicitly restore original filter or clear it
        casterElement.style.filter = originalCasterFilter || '';
        // Force a style recalculation
        casterElement.offsetHeight;
    }, 1500);

    // Remove effects after animation
    setTimeout(() => {
        if (absorptionEffect.parentNode) absorptionEffect.remove();
        if (absorptionText.parentNode) absorptionText.remove();
    }, 2500);
}

/**
 * Add CSS styles for Temptation's Embrace effects
 */
function addTemptationsEmbraceStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'temptations-embrace-styles';
    styleSheet.textContent = `
        /* Main seductive aura around caster */
        .temptation-main-aura {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(255, 105, 180, 0.3) 0%, rgba(138, 43, 226, 0.2) 50%, transparent 70%);
            border-radius: 50%;
            animation: temptationPulse 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 5;
        }

        @keyframes temptationPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }

        /* Energy rings around caster */
        .temptation-energy-rings {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150px;
            height: 150px;
            transform: translate(-50%, -50%);
            border: 3px solid rgba(255, 105, 180, 0.6);
            border-radius: 50%;
            animation: temptationRingExpand 3s ease-out forwards;
            pointer-events: none;
            z-index: 4;
        }

        .temptation-energy-rings::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            transform: translate(-50%, -50%);
            border: 2px solid rgba(138, 43, 226, 0.8);
            border-radius: 50%;
            animation: temptationRingExpandInner 2.5s ease-out 0.3s forwards;
        }

        @keyframes temptationRingExpand {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }

        @keyframes temptationRingExpandInner {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }

        /* Seductive particles */
        .seduction-particle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, rgba(255, 105, 180, 1) 0%, rgba(138, 43, 226, 0.8) 100%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(255, 105, 180, 0.8);
            pointer-events: none;
            z-index: 6;
        }

        /* Drain effects on enemies */
        .temptation-drain-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 3;
            animation: temptationDrainPulse 2s ease-in-out;
        }

        .hp-drain {
            background: radial-gradient(circle, rgba(255, 71, 87, 0.4) 0%, transparent 70%);
        }

        .mana-drain {
            background: radial-gradient(circle, rgba(55, 66, 250, 0.4) 0%, transparent 70%);
        }

        @keyframes temptationDrainPulse {
            0%, 100% { opacity: 0; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        /* Drain text on enemies */
        .temptation-drain-text {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff4757;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: temptationDrainTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 10;
        }

        @keyframes temptationDrainTextFloat {
            0% { transform: translateX(-50%) translateY(0); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-40px); opacity: 0; }
        }

        /* Absorption effects on caster */
        .temptation-absorption-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 3;
            animation: temptationAbsorptionGlow 2.5s ease-in-out;
        }

        .hp-absorption {
            background: radial-gradient(circle, rgba(255, 71, 87, 0.3) 0%, transparent 70%);
        }

        .mana-absorption {
            background: radial-gradient(circle, rgba(55, 66, 250, 0.3) 0%, transparent 70%);
        }

        @keyframes temptationAbsorptionGlow {
            0%, 100% { opacity: 0; transform: scale(1); }
            30% { opacity: 0.8; transform: scale(1.2); }
            70% { opacity: 0.6; transform: scale(1.1); }
        }

        /* Absorption text on caster */
        .temptation-absorption-text {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: #2ed573;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: temptationAbsorptionTextFloat 2.5s ease-out forwards;
            pointer-events: none;
            z-index: 10;
        }

        @keyframes temptationAbsorptionTextFloat {
            0% { transform: translateX(-50%) translateY(0); opacity: 0; }
            20% { transform: translateX(-50%) translateY(-10px); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
        }
    `;
    
    document.head.appendChild(styleSheet);
}

// Register the ability function globally
if (typeof window !== 'undefined') {
    window.soulSiphonEffect = soulSiphonEffect;
    window.shadowWingsEffect = shadowWingsEffect;
    window.kissOfDeathEffect = kissOfDeathEffect;
    window.temptationsEmbraceEffect = temptationsEmbraceEffect;
}

// Register abilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register with AbilityFactory if available
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        window.AbilityFactory.registerAbilityEffect('soulSiphonEffect', soulSiphonEffect);
        window.AbilityFactory.registerAbilityEffect('shadowWingsEffect', shadowWingsEffect);
        window.AbilityFactory.registerAbilityEffect('kissOfDeathEffect', kissOfDeathEffect);
        window.AbilityFactory.registerAbilityEffect('temptationsEmbraceEffect', temptationsEmbraceEffect);
        console.log('[Morissa Abilities] Registered Morissa abilities with AbilityFactory');
    }
    
    // Also ensure they're globally available
    window.soulSiphonEffect = soulSiphonEffect;
    window.shadowWingsEffect = shadowWingsEffect;
    window.kissOfDeathEffect = kissOfDeathEffect;
    window.temptationsEmbraceEffect = temptationsEmbraceEffect;
    console.log('[Morissa Abilities] Morissa abilities registered globally');
});

// Also try registering immediately in case DOM is already loaded
if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
    window.AbilityFactory.registerAbilityEffect('soulSiphonEffect', soulSiphonEffect);
    window.AbilityFactory.registerAbilityEffect('shadowWingsEffect', shadowWingsEffect);
    window.AbilityFactory.registerAbilityEffect('kissOfDeathEffect', kissOfDeathEffect);
    window.AbilityFactory.registerAbilityEffect('temptationsEmbraceEffect', temptationsEmbraceEffect);
    console.log('[Morissa Abilities] Morissa abilities registered immediately');
}

/**
 * Morissa (Succubus) Abilities
 * Implementation of Soul Siphon ability and related VFX
 */

// ... existing code ...

/**
 * Demonic Empathy Passive - Heals a random ally for 150% of healing received
 */
const morissaDemonicEmpathyPassive = {
    id: 'demonic_empathy',
    name: 'Demonic Empathy',
    description: 'Whenever Morissa heals, she shares 150% of that healing with a random ally (excluding herself). Her demonic nature amplifies the healing power for others.',
    icon: 'Icons/passives/demonic_empathy.png',
    
    // Hook into the character's heal method
    onApply: (character) => {
        console.log(`[Demonic Empathy] Applying passive to ${character.name}`);
        
        // Store original heal method if not already stored
        if (!character._originalHeal) {
            character._originalHeal = character.heal.bind(character);
            
            // Override the heal method
            character.heal = function(amount, caster = null, options = {}) {
                console.log(`[DemonicEmpathy] ${this.name} (${this.id}) received healing: ${amount}`);
                
                // Call original heal method first
                const healResult = character._originalHeal(amount, caster, options);
                
                console.log(`[DemonicEmpathy] Heal result for ${this.name}: ${healResult.healAmount} HP healed from ${amount} intended`);
                
                // If healing was attempted on Morissa (even if some was wasted due to overheal)
                if (amount > 0 && this.id === 'morissa') {
                    console.log(`[DemonicEmpathy] Morissa received healing, triggering passive effect`);
                    // Trigger the passive effect with both original amount and actual healed amount
                    setTimeout(() => {
                        triggerDemonicEmpathy(this, amount, healResult.healAmount);
                    }, 200); // Small delay for visual sequencing
                } else {
                    console.log(`[DemonicEmpathy] Not triggering passive - amount: ${amount}, character id: ${this.id}`);
                }
                
                return healResult;
            };
        }
    },
    
    onRemove: (character) => {
        console.log(`[Demonic Empathy] Removing passive from ${character.name}`);
        
        // Restore original heal method
        if (character._originalHeal) {
            character.heal = character._originalHeal;
            delete character._originalHeal;
        }
    }
};

/**
 * Trigger the Demonic Empathy passive effect
 */
function triggerDemonicEmpathy(morissa, originalHealAmount, actualHealAmount) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // Get all allies (excluding Morissa herself)
    let allies = [];
    if (window.gameManager && window.gameManager.gameState) {
        if (morissa.isAI) {
            // If Morissa is AI, heal other AI characters
            allies = window.gameManager.gameState.aiCharacters.filter(char => 
                !char.isDead() && char.instanceId !== morissa.instanceId
            );
        } else {
            // If Morissa is player, heal other player characters
            allies = window.gameManager.gameState.playerCharacters.filter(char => 
                !char.isDead() && char.instanceId !== morissa.instanceId
            );
        }
    }
    
    if (allies.length === 0) {
        console.log(`[Demonic Empathy] No valid allies found for Morissa to heal`);
        return;
    }
    
    // Select a random ally
    const randomAlly = allies[Math.floor(Math.random() * allies.length)];
    
    // Calculate 150% of the full intended heal amount (including any overheal)
    // This ensures that even if Morissa was overhealed, the ally gets the full benefit
    const empathyHealAmount = Math.floor(originalHealAmount * 1.5);
    
    console.log(`[Demonic Empathy] ${morissa.name} intended heal: ${originalHealAmount}, actual heal: ${actualHealAmount}, sharing ${empathyHealAmount} with ${randomAlly.name}`);
    log(`💜 ${morissa.name}'s Demonic Empathy shares ${empathyHealAmount} healing with ${randomAlly.name}!`, 'heal');
    
    // Show VFX for the empathy transfer
    showDemonicEmpathyVFX(morissa, randomAlly);
    
    // Heal the ally (using original heal to avoid infinite recursion)
    const allyHealResult = randomAlly._originalHeal ? 
        randomAlly._originalHeal(empathyHealAmount, morissa, { healType: 'demonic_empathy' }) :
        randomAlly.heal(empathyHealAmount, morissa, { healType: 'demonic_empathy' });
    
    console.log(`[Demonic Empathy] ${randomAlly.name} healed for ${allyHealResult.healAmount} HP`);
    
    // Update ally UI
    if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
        window.gameManager.uiManager.updateCharacterUI(randomAlly);
    }
}

/**
 * Show VFX for Demonic Empathy passive
 */
function showDemonicEmpathyVFX(morissa, targetAlly) {
    // Add CSS styles if not already added
    if (!document.getElementById('demonic-empathy-styles')) {
        addDemonicEmpathyStyles();
    }
    
    const morissaElement = document.getElementById(`character-${morissa.instanceId || morissa.id}`);
    const allyElement = document.getElementById(`character-${targetAlly.instanceId || targetAlly.id}`);
    
    if (!morissaElement || !allyElement) return;
    
    // Create empathy aura on Morissa
    const empathyAura = document.createElement('div');
    empathyAura.className = 'demonic-empathy-aura';
    morissaElement.appendChild(empathyAura);
    
    // Create heart particles flowing from Morissa to ally
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            createEmpathyParticle(morissaElement, allyElement, i);
        }, i * 100);
    }
    
    // Remove aura after animation
    setTimeout(() => {
        if (empathyAura.parentNode) {
            empathyAura.remove();
        }
    }, 2000);
}

/**
 * Create empathy heart particles that flow from Morissa to the ally
 */
function createEmpathyParticle(morissaElement, allyElement, index) {
    const particle = document.createElement('div');
    particle.className = 'empathy-heart-particle';
    
    // Get positions
    const morissaRect = morissaElement.getBoundingClientRect();
    const allyRect = allyElement.getBoundingClientRect();
    
    // Set initial position (from Morissa)
    particle.style.position = 'fixed';
    particle.style.left = (morissaRect.left + morissaRect.width / 2) + 'px';
    particle.style.top = (morissaRect.top + morissaRect.height / 2) + 'px';
    particle.style.zIndex = '1000';
    
    document.body.appendChild(particle);
    
    // Calculate movement to ally
    const deltaX = (allyRect.left + allyRect.width / 2) - (morissaRect.left + morissaRect.width / 2);
    const deltaY = (allyRect.top + allyRect.height / 2) - (morissaRect.top + morissaRect.height / 2);
    
    // Animate the particle in a gentle arc
    particle.animate([
        { 
            transform: 'translate(0, 0) scale(0.5) rotate(0deg)', 
            opacity: 0.8,
            filter: 'blur(0px)'
        },
        { 
            transform: `translate(${deltaX * 0.3}px, ${deltaY * 0.3 - 30}px) scale(1) rotate(45deg)`, 
            opacity: 1,
            filter: 'blur(0px)'
        },
        { 
            transform: `translate(${deltaX * 0.7}px, ${deltaY * 0.7 - 20}px) scale(1.1) rotate(90deg)`, 
            opacity: 1,
            filter: 'blur(1px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(1.3) rotate(135deg)`, 
            opacity: 0.9,
            filter: 'blur(2px)'
        },
        { 
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0) rotate(180deg)`, 
            opacity: 0,
            filter: 'blur(3px)'
        }
    ], {
        duration: 1500 + (index * 50),
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
        particle.remove();
        
        // Show healing effect on ally when particle arrives
        if (index === 0) { // Only show on first particle
            showEmpathyHealingEffect(allyElement);
        }
    };
}

/**
 * Show healing effect on the ally when empathy healing is received
 */
function showEmpathyHealingEffect(allyElement) {
    // Create healing burst effect
    const healingBurst = document.createElement('div');
    healingBurst.className = 'empathy-healing-burst';
    allyElement.appendChild(healingBurst);
    
    // Add temporary glow to ally
    const originalFilter = allyElement.style.filter;
    allyElement.style.filter = 'brightness(1.3) drop-shadow(0 0 20px #ff69b4)';
    
    setTimeout(() => {
        allyElement.style.filter = originalFilter;
        if (healingBurst.parentNode) {
            healingBurst.remove();
        }
    }, 1500);
}

/**
 * Add CSS styles for Demonic Empathy effects
 */
function addDemonicEmpathyStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'demonic-empathy-styles';
    styleSheet.textContent = `
        /* Demonic Empathy Aura on Morissa */
        .demonic-empathy-aura {
            position: absolute;
            top: -20%;
            left: -20%;
            width: 140%;
            height: 140%;
            background: radial-gradient(circle,
                rgba(255, 105, 180, 0.4) 0%,
                rgba(199, 21, 133, 0.3) 40%,
                rgba(147, 112, 219, 0.2) 70%,
                transparent 100%);
            border-radius: 50%;
            animation: empathy-aura-pulse 2s ease-in-out;
            pointer-events: none;
            z-index: 8;
        }

        @keyframes empathy-aura-pulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 0.6;
            }
            50% { 
                transform: scale(1.2);
                opacity: 1;
            }
        }

        /* Heart-shaped particles */
        .empathy-heart-particle {
            width: 12px;
            height: 12px;
            position: relative;
            pointer-events: none;
        }

        .empathy-heart-particle::before,
        .empathy-heart-particle::after {
            content: '';
            width: 8px;
            height: 12px;
            position: absolute;
            left: 2px;
            transform: rotate(-45deg);
            transform-origin: 0 100%;
            background: linear-gradient(135deg, #ff69b4, #ff1493);
            border-radius: 4px 4px 0 0;
            box-shadow: 0 0 8px rgba(255, 105, 180, 0.8);
        }

        .empathy-heart-particle::after {
            left: 0;
            transform: rotate(45deg);
            transform-origin: 100% 100%;
        }

        /* Healing burst effect on ally */
        .empathy-healing-burst {
            position: absolute;
            top: -30%;
            left: -30%;
            width: 160%;
            height: 160%;
            background: radial-gradient(circle,
                rgba(255, 105, 180, 0.6) 0%,
                rgba(255, 182, 193, 0.4) 30%,
                rgba(255, 20, 147, 0.2) 60%,
                transparent 100%);
            border-radius: 50%;
            animation: empathy-healing-burst 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 12;
        }

        @keyframes empathy-healing-burst {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.8;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }

        /* Additional sparkle effects */
        .empathy-healing-burst::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6px;
            height: 6px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
                0 0 10px rgba(255, 105, 180, 0.8),
                0 0 20px rgba(255, 20, 147, 0.6);
            animation: empathy-sparkle 1.5s ease-out;
        }

        @keyframes empathy-sparkle {
            0%, 100% { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            50% { 
                transform: translate(-50%, -50%) scale(2);
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Register the passive globally
if (typeof window !== 'undefined') {
    window.morissaDemonicEmpathyPassive = morissaDemonicEmpathyPassive;
    window.triggerDemonicEmpathy = triggerDemonicEmpathy;
}

// Register the passive when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register with PassiveFactory if available
    if (window.PassiveFactory && typeof window.PassiveFactory.registerPassive === 'function') {
        window.PassiveFactory.registerPassive('demonic_empathy', morissaDemonicEmpathyPassive);
        console.log('[Morissa Abilities] Registered Demonic Empathy passive with PassiveFactory');
    }
    
    // Ensure it's globally available
    window.morissaDemonicEmpathyPassive = morissaDemonicEmpathyPassive;
    console.log('[Morissa Abilities] Demonic Empathy passive registered globally');
});

// Also try registering immediately in case DOM is already loaded
if (window.PassiveFactory && typeof window.PassiveFactory.registerPassive === 'function') {
    window.PassiveFactory.registerPassive('demonic_empathy', morissaDemonicEmpathyPassive);
    console.log('[Morissa Abilities] Demonic Empathy passive registered immediately');
} 