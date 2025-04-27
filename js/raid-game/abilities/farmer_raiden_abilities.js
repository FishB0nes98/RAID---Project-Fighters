// Ability definition for Farmer Raiden: Lightning Orb

// Lightning Orb ability effect implementation
const lightningOrbEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name} tries to cast Lightning Orb, but the target is invalid or defeated.`);
        return;
    }

    log(`${caster.name} casts Lightning Orb at ${target.name}!`);
    
    // Play sound effect if available
    playSound('sounds/lightning_strike.mp3', 0.8);

    // --- Damage Calculation ---
    const fixedDamage = 455;
    const scaledMagicalDamage = Math.floor((caster.stats.magicalDamage || 0) * 1.0);
    const totalDamage = fixedDamage + scaledMagicalDamage;

    // Apply damage to target
    const damageResult = target.applyDamage(totalDamage, 'magical', caster);
    log(`${target.name} takes ${damageResult.damage} magical damage from Lightning Orb!`);

    // --- VFX ---
    // Add visual effects for Lightning Orb
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);

    if (casterElement && targetElement) {
        // Add casting animation to caster
        casterElement.classList.add('lightning-orb-cast-animation');
        setTimeout(() => casterElement.classList.remove('lightning-orb-cast-animation'), 800);

        // Add lightning orb projectile
        const orbProjectile = document.createElement('div');
        orbProjectile.className = 'lightning-orb-projectile';
        document.body.appendChild(orbProjectile);

        // Get positions for animation
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Start position (near caster's hands)
        const startX = casterRect.left + casterRect.width/2;
        const startY = casterRect.top + casterRect.height/2;
        
        // End position (target's center)
        const endX = targetRect.left + targetRect.width/2;
        const endY = targetRect.top + targetRect.height/2;
        
        // Initial position
        orbProjectile.style.left = `${startX}px`;
        orbProjectile.style.top = `${startY}px`;
        
        // Animate the projectile
        setTimeout(() => {
            orbProjectile.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            orbProjectile.style.left = `${endX}px`;
            orbProjectile.style.top = `${endY}px`;
        }, 50);
        
        // Create impact effect when projectile hits
        setTimeout(() => {
            // Remove projectile
            orbProjectile.remove();
            
            // Create impact effect on target
            const impactEffect = document.createElement('div');
            impactEffect.className = 'lightning-impact-effect';
            targetElement.appendChild(impactEffect);
            
            // Remove impact effect after animation completes
            setTimeout(() => impactEffect.remove(), 800);
        }, 450);
    }

    // Update target UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }
    
    // Debug passive handler
    console.log('Caster object:', caster);
    console.log('Caster passiveHandler:', caster.passiveHandler);
    
    // Trigger passive after ability execution
    if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityUsed === 'function') {
        console.log('Calling onAbilityUsed on passiveHandler');
        caster.passiveHandler.onAbilityUsed(caster);
    } else {
        console.error('Cannot call passive handler: passiveHandler is', 
                      caster.passiveHandler, 
                      'onAbilityUsed function is', 
                      caster.passiveHandler ? caster.passiveHandler.onAbilityUsed : 'N/A');
    }
};

// Create the Lightning Orb ability
const lightningOrbAbility = new Ability(
    'farmer_raiden_lightning_orb',
    'Lightning Orb',
    'Icons/abilities/lightning_orb.webp',
    25, // Mana cost
    1,  // Cooldown
    lightningOrbEffect // The function implementing the logic
).setDescription('Deals 455 + 100% Magical damage to the target.')
 .setTargetType('enemy');

// Thunder Shield ability effect implementation
const thunderShieldEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} casts Thunder Shield!`, 'system');

    // Play sound effect
    playSound('sounds/shield_activate.mp3', 0.7);

    // Effect duration
    const duration = 5;

    // Magical shield percentage boost - USE STAT MODIFIERS
    const magicalShieldBoostValue = 15; // Representing 15%

    // --- REFACTORED Buff Definition ---
    const shieldBuff = new Effect(
        'thunder_shield_buff', // Unique ID for the buff instance
        'Thunder Shield',
        'Icons/abilities/thunder_shield.webp',
        duration,
        // Effect function: Called each turn by processEffects
        (target) => {
            // This function now handles the END OF TURN logic
            log(`${target.name}'s Thunder Shield crackles with energy!`, 'system');

            // Trigger passive twice
            if (target.passiveHandler && typeof target.passiveHandler.onAbilityUsed === 'function') {
                log(`Thunder Shield activates ${target.name}'s Zap passive twice!`, 'passive');

                // Play sound
                playSound('sounds/lightning_zap.mp3', 0.8);

                // Trigger passive twice
                target.passiveHandler.onAbilityUsed(target);
                setTimeout(() => {
                    if (!target.isDead()) { // Check if target is still alive
                         target.passiveHandler.onAbilityUsed(target);
                    }
                }, 300); // Small delay between zaps for visual clarity
            } else {
                console.error(`[Thunder Shield Tick] Failed to trigger passive for ${target.name}. passiveHandler:`, target.passiveHandler, `onAbilityUsed type:`, typeof target.passiveHandler?.onAbilityUsed);
            }
        },
        false // isDebuff = false
    );

    // Add stat modifier for magical shield
    shieldBuff.statModifiers = {
        magicalShield_percent: magicalShieldBoostValue // Corrected key to indicate percentage
    };

    // Add description
    shieldBuff.setDescription(`Increases Magical Shield by ${magicalShieldBoostValue}% and triggers Zap passive twice at the end of each turn.`);

    // --- Custom Hooks for VFX --- 
    shieldBuff.onApply = (target) => {
        log(`${target.name} is surrounded by a protective lightning barrier!`, 'system');
        // Add visual effect for the shield
        const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (characterElement) {
            // Add shield VFX container if it doesn't exist
            if (!characterElement.querySelector('.thunder-shield-effect')) {
                const shieldElement = document.createElement('div');
                shieldElement.className = 'thunder-shield-effect';
                characterElement.appendChild(shieldElement);

                // Add 3D shield effect
                const shield3D = document.createElement('div');
                shield3D.className = 'thunder-shield-3d';
                shieldElement.appendChild(shield3D);

                // Add lightning arcs
                for (let i = 0; i < 5; i++) {
                    const arc = document.createElement('div');
                    arc.className = 'thunder-shield-arc';
                    shieldElement.appendChild(arc);
                }
            }
        }
        // Note: recalculateStats is called automatically by addBuff AFTER onApply
    };

    shieldBuff.remove = (target) => {
        log(`${target.name}'s Thunder Shield fades away.`, 'system');
        // Remove visual effect
        const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (characterElement) {
            const shieldElement = characterElement.querySelector('.thunder-shield-effect');
            if (shieldElement) {
                // Add fadeout animation
                shieldElement.classList.add('fading');

                // Remove after animation
                setTimeout(() => {
                    shieldElement.remove();
                }, 500);
            }
        }
        // Note: recalculateStats is called automatically by removeBuff AFTER this remove method
    };
    // --- End Custom Hooks ---


    // Add the shield buff to caster
    // addBuff handles calling onApply and recalculateStats
    caster.addBuff(shieldBuff);

    // Create immediate visual effect of shield activation (burst)
    const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (characterElement) {
        // Add activation effect
        characterElement.classList.add('thunder-shield-cast');

        // Create burst effect
        const burstEffect = document.createElement('div');
        burstEffect.className = 'thunder-shield-burst';
        characterElement.appendChild(burstEffect);

        // Remove burst effect after animation
        setTimeout(() => {
            burstEffect.remove();
            characterElement.classList.remove('thunder-shield-cast');
        }, 1000);
    }

    // Update caster UI (might be redundant as addBuff updates UI, but safe to keep)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    // Trigger passive immediately on cast
    if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityUsed === 'function') {
        caster.passiveHandler.onAbilityUsed(caster);
    }
};

// Create the Thunder Shield ability
const thunderShieldAbility = new Ability(
    'farmer_raiden_thunder_shield',
    'Thunder Shield',
    'Icons/abilities/thunder_shield.webp',
    100, // Mana cost
    9,  // Cooldown
    thunderShieldEffect // The function implementing the logic
).setDescription('Places a shield on Raiden for 5 turns. At end of turn, it activates Raiden\'s passive twice and gives 15% Magical Shield.')
 .setTargetType('self');

// Electric Shock ability effect implementation
const electricShockEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const gameState = window.gameManager ? window.gameManager.gameState : null;

    if (!gameState) {
        console.error("Electric Shock ability error: Cannot access game state!");
        return;
    }

    log(`${caster.name} casts Electric Shock!`, 'system');
    
    // Play sound effect
    playSound('sounds/lightning_strike.mp3', 0.7);

    // Get all enemy characters
    const enemies = gameState.aiCharacters || [];
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Electric Shock has no targets!`, 'system');
        return;
    }

    // Filter out dead enemies
    const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
    if (aliveEnemies.length === 0) {
        log(`${caster.name}'s Electric Shock has no living targets!`, 'system');
        return;
    }

    // Add casting visual effect to caster
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        casterElement.classList.add('electric-shock-cast');
        
        // Create shock wave effect
        const shockWaveEffect = document.createElement('div');
        shockWaveEffect.className = 'electric-shock-wave';
        casterElement.appendChild(shockWaveEffect);
        
        // Remove after animation completes
        setTimeout(() => {
            shockWaveEffect.remove();
            casterElement.classList.remove('electric-shock-cast');
        }, 1000);
    }

    // Calculate base damage (100% of magical damage)
    const baseDamage = Math.floor(caster.stats.magicalDamage);
    
    // Create a delay between each enemy being hit
    aliveEnemies.forEach((enemy, index) => {
        setTimeout(() => {
            if (!enemy.isDead()) {
                // Apply damage to each enemy
                const damageResult = enemy.applyDamage(baseDamage, 'magical', caster);
                log(`${enemy.name} takes ${damageResult.damage} magical damage from Electric Shock!`, damageResult.isCritical ? 'critical' : 'system');
                
                // Show electric shock impact effect
                const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                if (enemyElement) {
                    // Create impact effect
                    const impactEffect = document.createElement('div');
                    impactEffect.className = 'electric-shock-impact';
                    enemyElement.appendChild(impactEffect);
                    
                    // Remove after animation completes
                    setTimeout(() => impactEffect.remove(), 800);
                }
                
                // 15% chance to apply debuff reducing magical shield
                if (Math.random() < 0.15) {
                    // Create debuff effect
                    const debuffEffect = new Effect(
                        `electric_shock_debuff_${enemy.instanceId || enemy.id}_${Date.now()}`, // Unique ID
                        'Shocked',
                        'Icons/abilities/electric_shock.webp',
                        4, // Duration: 4 turns
                        (target) => {
                            // This function is called each turn
                            log(`${target.name} suffers from electric interference!`, 'system');
                        },
                        true // isDebuff = true
                    );
                    
                    // Set stat modifiers (reduce magical shield by 15%)
                    debuffEffect.statModifiers = {
                        magicalShield: -15 // -15% to magical shield
                    };
                    
                    debuffEffect.setDescription('Reduces Magical Shield by 15%.');
                    
                    // Add visual effects for the debuff
                    debuffEffect.onApply = (target) => {
                        log(`${target.name} is shocked, reducing their Magical Shield by 15%!`, 'system');
                        
                        // Visual effect for debuff application
                        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
                        if (targetElement) {
                            const debuffVfx = document.createElement('div');
                            debuffVfx.className = 'shocked-debuff-apply';
                            targetElement.appendChild(debuffVfx);
                            
                            // Remove VFX after animation
                            setTimeout(() => debuffVfx.remove(), 1000);
                        }
                    };
                    
                    debuffEffect.remove = (target) => {
                        log(`${target.name} is no longer shocked.`, 'system');
                    };
                    
                    // Apply the debuff to the enemy
                    enemy.addDebuff(debuffEffect);
                }
                
                // Update enemy UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(enemy);
                }
            }
        }, index * 200); // Stagger damage application
    });
    
    // Trigger passive after ability execution
    if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityUsed === 'function') {
        setTimeout(() => {
            caster.passiveHandler.onAbilityUsed(caster);
        }, aliveEnemies.length * 200 + 100); // Trigger after all enemies have been hit
    }
};

// Create the Electric Shock ability
const electricShockAbility = new Ability(
    'farmer_raiden_electric_shock',
    'Electric Shock',
    'Icons/abilities/electric_shock.webp',
    100, // Mana cost
    8,   // Cooldown
    electricShockEffect // The function implementing the logic
).setDescription('Deals 100% Magical damage to all enemies. Has 15% chance to reduce Magical Shield by 15% for 4 turns on each target.')
 .setTargetType('all_enemies');

// Storm Circle ability effect implementation
const stormCircleEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const gameState = window.gameManager ? window.gameManager.gameState : null;

    if (!gameState) {
        console.error("Storm Circle ability error: Cannot access game state!");
        return;
    }

    log(`${caster.name} unleashes Storm Circle!`, 'system');
    
    // Play sound effect
    playSound('sounds/thunder_strike.mp3', 0.8);

    // Get all enemy characters
    const enemies = gameState.aiCharacters || [];
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Storm Circle has no targets!`, 'system');
        return;
    }

    // Filter out dead enemies
    const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
    if (aliveEnemies.length === 0) {
        log(`${caster.name}'s Storm Circle has no living targets!`, 'system');
        return;
    }

    // Add casting visual effect to caster
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        casterElement.classList.add('storm-circle-cast');
        
        // Create storm circle wave effect
        const stormCircleWave = document.createElement('div');
        stormCircleWave.className = 'storm-circle-wave';
        document.body.appendChild(stormCircleWave);
        
        // Add lightning effect
        const stormLightning = document.createElement('div');
        stormLightning.className = 'storm-circle-lightning';
        casterElement.appendChild(stormLightning);
        
        // Remove effects after animation completes
        setTimeout(() => {
            stormCircleWave.remove();
            stormLightning.remove();
            casterElement.classList.remove('storm-circle-cast');
        }, 1500);
    }

    // Fixed damage amount
    const fixedDamage = 1000;
    
    // Create a delay before applying damage to all enemies
    setTimeout(() => {
        // Apply damage and stun to each enemy
        aliveEnemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (!enemy.isDead()) {
                    // Apply damage
                    const damageResult = enemy.applyDamage(fixedDamage, 'magical', caster);
                    log(`${enemy.name} takes ${damageResult.damage} magical damage from Storm Circle!`, damageResult.isCritical ? 'critical' : 'system');
                    
                    // Show impact effect
                    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                    if (enemyElement) {
                        // Create impact effect
                        const impactEffect = document.createElement('div');
                        impactEffect.className = 'storm-circle-impact';
                        enemyElement.appendChild(impactEffect);
                        
                        // Remove after animation completes
                        setTimeout(() => impactEffect.remove(), 800);
                    }
                    
                    // Apply stun effect (if enemy is still alive after damage)
                    if (!enemy.isDead()) {
                        // Create the stun debuff
                        const stunDebuff = new Effect(
                            `storm_circle_stun_${enemy.instanceId || enemy.id}_${Date.now()}`, // Unique ID
                            'Stunned',
                            'Icons/debuffs/stun.png',
                            2, // Duration: Changed from 1 to 2 turns
                            null, // No per-turn effect
                            true // isDebuff = true
                        );
                        
                        // Set stun effect properties
                        stunDebuff.effects = {
                            cantAct: true
                        };
                        
                        stunDebuff.setDescription('Cannot perform any actions.');
                        
                        // Add a custom remove method to clean up the stun VFX when the debuff expires
                        stunDebuff.remove = function(character) {
                            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
                            if (charElement) {
                                charElement.classList.remove('stunned');
                                const stunEffects = charElement.querySelectorAll('.stun-effect-container');
                                stunEffects.forEach(el => el.remove());
                            }
                        };
                        
                        // Add debuff to enemy
                        enemy.addDebuff(stunDebuff);
                        log(`${enemy.name} is stunned for 2 turns!`, 'system');
                        
                        // Add stun VFX
                        if (enemyElement) {
                            enemyElement.classList.add('stunned'); // Apply grayscale effect
                            
                            // Create container for stun VFX
                            const stunVfxContainer = document.createElement('div');
                            stunVfxContainer.className = 'vfx-container stun-effect-container';
                            enemyElement.appendChild(stunVfxContainer);
                            
                            // Create stun stars effect inside container
                            const stunEffect = document.createElement('div');
                            stunEffect.className = 'stun-effect'; // From raid-game.css
                            stunVfxContainer.appendChild(stunEffect);
                            
                            // Create stun stars
                            const stunStars = document.createElement('div');
                            stunStars.className = 'stun-stars';
                            stunEffect.appendChild(stunStars);
                            
                            // Create stun circle
                            const stunCircle = document.createElement('div');
                            stunCircle.className = 'stun-circle';
                            stunEffect.appendChild(stunCircle);
                            
                            // Removal is handled by stunDebuff.remove
                        }
                    }
                    
                    // Update enemy UI
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(enemy);
                    }
                }
            }, index * 150); // Slight delay between each enemy for visual effect
        });
    }, 500); // Delay before damage starts
    
    // Trigger passive after ability execution
    setTimeout(() => {
        if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityUsed === 'function') {
            caster.passiveHandler.onAbilityUsed(caster);
        }
    }, 1500); // Trigger after all effects have played
};

// Create the Storm Circle ability
const stormCircleAbility = new Ability(
    'farmer_raiden_storm_circle',
    'Storm Circle',
    'Icons/abilities/storm_circle.webp',
    100, // Mana cost
    10,   // Cooldown
    stormCircleEffect // The function implementing the logic
).setDescription('Deals 1000 damage to all enemies and stuns them for 2 turns.')
 .setTargetType('all_enemies');

// Register the ability with AbilityFactory
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        lightningOrbAbility,
        thunderShieldAbility,
        electricShockAbility,
        stormCircleAbility
    ]);
    console.log("[AbilityFactory] Registered Farmer Raiden abilities.");
} else {
    console.warn("Farmer Raiden abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.farmer_raiden_lightning_orb = lightningOrbAbility;
    window.definedAbilities.farmer_raiden_thunder_shield = thunderShieldAbility;
    window.definedAbilities.farmer_raiden_electric_shock = electricShockAbility;
    window.definedAbilities.farmer_raiden_storm_circle = stormCircleAbility;
} 