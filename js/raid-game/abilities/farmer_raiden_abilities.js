// Ability definition for Farmer Raiden: Lightning Orb

// --- STATISTICS TRACKING FUNCTIONS ---

// Global helper function for tracking Farmer Raiden ability usage
function trackRaidenAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (window.gameManager && window.gameManager.statisticsManager) {
        try {
            if (effectType === 'damage') {
                window.gameManager.statisticsManager.recordDamageDealt(character, amount, isCritical, abilityId);
            } else if (effectType === 'healing') {
                window.gameManager.statisticsManager.recordHealingDone(character, amount, abilityId);
            } else if (effectType === 'utility') {
                window.gameManager.statisticsManager.recordAbilityUsage(character, abilityId, { type: 'utility', amount: amount });
            } else if (effectType === 'passive') {
                window.gameManager.statisticsManager.recordAbilityUsage(character, abilityId, { type: 'passive', amount: amount });
            }
        } catch (error) {
            console.error('[trackRaidenAbilityUsage] Error:', error);
        }
    }
}

// Track Lightning Orb stats
function trackLightningOrbStats(caster, target, damageResult, isChain = false, isStun = false) {
    try {
        if (window.trackRaidenAbilityUsage) {
            const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                ? damageResult.damage 
                : (typeof damageResult === 'number' ? damageResult : 0);
            const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
            
            if (isChain) {
                window.trackRaidenAbilityUsage(caster, 'lightning_orb_chain', 'damage', damageAmount, isCritical);
            } else {
                window.trackRaidenAbilityUsage(caster, 'lightning_orb', 'damage', damageAmount, isCritical);
            }
            
            if (isStun) {
                window.trackRaidenAbilityUsage(caster, 'lightning_orb_stun', 'utility', 1);
            }
        }
    } catch (error) {
        console.error('[trackLightningOrbStats] Error:', error);
    }
}

// Track Thunder Shield stats
function trackThunderShieldStats(caster, isPermanent = false) {
    try {
        if (window.trackRaidenAbilityUsage) {
            const abilityId = isPermanent ? 'thunder_shield_permanent' : 'thunder_shield';
            window.trackRaidenAbilityUsage(caster, abilityId, 'utility', 1);
        }
    } catch (error) {
        console.error('[trackThunderShieldStats] Error:', error);
    }
}

// Track Electric Shock stats  
function trackElectricShockStats(caster, target, damageResult, isHit, isForked = false, isDebuff = false) {
    try {
        if (window.trackRaidenAbilityUsage) {
            if (isHit) {
                const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                    ? damageResult.damage 
                    : (typeof damageResult === 'number' ? damageResult : 0);
                const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
                
                const abilityId = isForked ? 'electric_shock_forked' : 'electric_shock';
                window.trackRaidenAbilityUsage(caster, abilityId, 'damage', damageAmount, isCritical);
            } else {
                // Track miss
                const abilityId = isForked ? 'electric_shock_forked_miss' : 'electric_shock_miss';
                window.trackRaidenAbilityUsage(caster, abilityId, 'utility', 0);
            }
            
            if (isDebuff) {
                window.trackRaidenAbilityUsage(caster, 'electric_shock_debuff', 'utility', 1);
            }
        }
    } catch (error) {
        console.error('[trackElectricShockStats] Error:', error);
    }
}

// Track Storm Circle stats
function trackStormCircleStats(caster, target, damageResult, isHit, isRecast = false, isStun = false) {
    try {
        if (window.trackRaidenAbilityUsage) {
            if (isHit) {
                const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                    ? damageResult.damage 
                    : (typeof damageResult === 'number' ? damageResult : 0);
                const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
                
                const abilityId = isRecast ? 'storm_circle_recast' : 'storm_circle';
                window.trackRaidenAbilityUsage(caster, abilityId, 'damage', damageAmount, isCritical);
            } else {
                // Track miss
                const abilityId = isRecast ? 'storm_circle_recast_miss' : 'storm_circle_miss';
                window.trackRaidenAbilityUsage(caster, abilityId, 'utility', 0);
            }
            
            if (isStun) {
                window.trackRaidenAbilityUsage(caster, 'storm_circle_stun', 'utility', 1);
            }
        }
    } catch (error) {
        console.error('[trackStormCircleStats] Error:', error);
    }
}

// Track Passive Zap stats
function trackZapPassiveStats(caster, target, damageResult, zapType = 'normal') {
    try {
        if (window.trackRaidenAbilityUsage) {
            const damageAmount = typeof damageResult === 'object' && damageResult.damage !== undefined 
                ? damageResult.damage 
                : (typeof damageResult === 'number' ? damageResult : 0);
            const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
            
            let abilityId = 'zap_passive';
            if (zapType === 'lifesteal') {
                abilityId = 'zap_passive_lifesteal';
            } else if (zapType === 'thunder_shield') {
                abilityId = 'zap_passive_thunder_shield';
            }
            
            window.trackRaidenAbilityUsage(caster, abilityId, 'passive', damageAmount, isCritical);
        }
    } catch (error) {
        console.error('[trackZapPassiveStats] Error:', error);
    }
}

// Make tracking functions globally available
if (typeof window !== 'undefined') {
    window.trackRaidenAbilityUsage = trackRaidenAbilityUsage;
    window.trackLightningOrbStats = trackLightningOrbStats;
    window.trackThunderShieldStats = trackThunderShieldStats;
    window.trackElectricShockStats = trackElectricShockStats;  
    window.trackStormCircleStats = trackStormCircleStats;
    window.trackZapPassiveStats = trackZapPassiveStats;
}

// --- END STATISTICS TRACKING FUNCTIONS ---

// Lightning Orb ability effect implementation
const lightningOrbEffect = (caster, target, ability) => {
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
    // Get base damage amount from ability or use default of 455
    const fixedDamage = ability && ability.baseDamage !== undefined ? ability.baseDamage : 455;
    // Use the scaling percentage from the ability object, defaulting to 1.0 if not set
    const magicalScalingPercent = ability && ability.magicalScalingPercent !== undefined ? ability.magicalScalingPercent : 1.0;
    const scaledMagicalDamage = Math.floor((caster.stats.magicalDamage || 0) * magicalScalingPercent);
    const totalDamage = fixedDamage + scaledMagicalDamage;

    // Apply damage to target with statistics tracking
    const damageResult = target.applyDamage(totalDamage, 'magical', caster, { abilityId: 'lightning_orb' });
    log(`${target.name} takes ${damageResult.damage} magical damage from Lightning Orb!`);

    // Track Lightning Orb statistics
    if (window.trackLightningOrbStats) {
        window.trackLightningOrbStats(caster, target, damageResult, false, false);
    }

    // --- Apply Stun Chance (Talent Effect) ---
    // Check if the ability has a stun chance from talent
    const stunChance = ability && ability.stunChance !== undefined ? ability.stunChance : 0;
    if (stunChance > 0 && !target.isDead() && Math.random() < stunChance) {
        // Create the stun debuff
        const stunDebuff = new Effect(
            `lightning_orb_stun_${target.instanceId || target.id}_${Date.now()}`, // Unique ID
            'Stunned',
            'Icons/debuffs/stun.png',
            1, // Duration: 1 turn
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
        
        // Add debuff to target
        target.addDebuff(stunDebuff);
        log(`${target.name} is stunned for 1 turn by Lightning Orb!`, 'system');
        
        // Track stun statistics
        if (window.trackLightningOrbStats) {
            window.trackLightningOrbStats(caster, target, damageResult, false, true);
        }
        
        // Apply Storm Empowerment talent if active
        if (caster.stormEmpowerment && caster.passiveHandler) {
            if (typeof caster.passiveHandler.applyStormEmpowermentBuff === 'function') {
                caster.passiveHandler.applyStormEmpowermentBuff(caster);
            }
        }
        
        // Add stun VFX
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            targetElement.classList.add('stunned'); // Apply grayscale effect
            
            // Create container for stun VFX
            const stunVfxContainer = document.createElement('div');
            stunVfxContainer.className = 'vfx-container stun-effect-container';
            targetElement.appendChild(stunVfxContainer);
            
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
        }
    }

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
    
    // --- Chain Lightning (Talent Effect) ---
    // Check if the ability has chain lightning from talent
    const chainChance = ability && ability.chainChance !== undefined ? ability.chainChance : 0;
    if (chainChance > 0 && Math.random() < chainChance) {
        // Find a random secondary target
        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            console.error('Game manager not found for chain lightning effect');
            return;
        }
        
        // Get opponents excluding the primary target
        const opponents = gameManager.getOpponents(caster).filter(opponent => 
            opponent !== target && !opponent.isDead() && !opponent.isUntargetable());
        
        if (opponents.length > 0) {
            // Select a random opponent
            const secondaryTarget = opponents[Math.floor(Math.random() * opponents.length)];
            
            log(`Chain Lightning jumps from ${target.name} to ${secondaryTarget.name}!`, 'system');
            
            // Calculate damage for the secondary target (same formula as primary)
            const secondaryDamage = fixedDamage + scaledMagicalDamage;
            
            // Apply damage to secondary target with statistics tracking
            const secondaryDamageResult = secondaryTarget.applyDamage(secondaryDamage, 'magical', caster, { abilityId: 'lightning_orb_chain' });
            log(`${secondaryTarget.name} takes ${secondaryDamageResult.damage} magical damage from Chain Lightning!`);
            
            // Track Chain Lightning statistics
            if (window.trackLightningOrbStats) {
                window.trackLightningOrbStats(caster, secondaryTarget, secondaryDamageResult, true, false);
            }
            
            // Apply chain lightning VFX
            const secondaryTargetElement = document.getElementById(`character-${secondaryTarget.instanceId || secondaryTarget.id}`);
            if (targetElement && secondaryTargetElement) {
                // Create chain lightning effect
                setTimeout(() => {
                    // Add chain lightning projectile
                    const chainProjectile = document.createElement('div');
                    chainProjectile.className = 'lightning-orb-projectile';
                    document.body.appendChild(chainProjectile);
                    
                    // Get positions for animation
                    const primaryRect = targetElement.getBoundingClientRect();
                    const secondaryRect = secondaryTargetElement.getBoundingClientRect();
                    
                    // Start position (primary target)
                    const startX = primaryRect.left + primaryRect.width/2;
                    const startY = primaryRect.top + primaryRect.height/2;
                    
                    // End position (secondary target)
                    const endX = secondaryRect.left + secondaryRect.width/2;
                    const endY = secondaryRect.top + secondaryRect.height/2;
                    
                    // Initial position
                    chainProjectile.style.left = `${startX}px`;
                    chainProjectile.style.top = `${startY}px`;
                    
                    // Animate the projectile
                    setTimeout(() => {
                        chainProjectile.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                        chainProjectile.style.left = `${endX}px`;
                        chainProjectile.style.top = `${endY}px`;
                    }, 50);
                    
                    // Create impact effect when projectile hits
                    setTimeout(() => {
                        // Remove projectile
                        chainProjectile.remove();
                        
                        // Create impact effect on secondary target
                        const secondaryImpactEffect = document.createElement('div');
                        secondaryImpactEffect.className = 'lightning-impact-effect';
                        secondaryTargetElement.appendChild(secondaryImpactEffect);
                        
                        // Remove impact effect after animation completes
                        setTimeout(() => secondaryImpactEffect.remove(), 800);
                        
                        // Update secondary target UI
                        if (typeof updateCharacterUI === 'function') {
                            updateCharacterUI(secondaryTarget);
                        }
                    }, 350);
                }, 600); // Delay chain lightning after primary hit
            }
        } else {
            log(`Chain Lightning has no additional targets to hit!`, 'system');
        }
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
);

// Add additional properties needed for talents
lightningOrbAbility.magicalScalingPercent = 1.0;
lightningOrbAbility.stunChance = 0; // Default stun chance of 0%
lightningOrbAbility.chainChance = 0; // Default chain chance of 0%
lightningOrbAbility.baseDamage = 455; // Default base damage

// Add custom description generator
lightningOrbAbility.generateDescription = function() {
    // Base description with dynamic base damage value
    let desc = `Deals <span class="damage">${this.baseDamage} + ${this.magicalScalingPercent * 100}% Magical damage</span> to the target.`;
    
    // Add base damage talent callout if modified
    if (this.baseDamage > 455) {
        desc += `\n<span class="talent-effect damage">Talent: Increased base damage from 455 to ${this.baseDamage}.</span>`;
    }
    
    // Add scaling talent callout if modified
    if (this.magicalScalingPercent > 1.0) {
        desc += `\n<span class="talent-effect damage">Talent: Increased to ${this.magicalScalingPercent * 100}% Magical damage scaling.</span>`;
    }
    
    // Add chain lightning chance if talent is applied
    if (this.chainChance > 0) {
        desc += `\n<span class="talent-effect aoe">Talent: ${this.chainChance * 100}% chance to hit an additional random target.</span>`;
    }
    
    // Add stun chance if talent is applied
    if (this.stunChance > 0) {
        desc += `\n<span class="talent-effect utility">Talent: ${this.stunChance * 100}% chance to stun the target for 1 turn.</span>`;
    }
    
    this.description = desc;
    return this.description;
};

// Generate initial description
lightningOrbAbility.generateDescription();
lightningOrbAbility.setTargetType('enemy');

// Thunder Shield ability effect implementation
const thunderShieldEffect = (caster, target, ability) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} casts Thunder Shield!`, 'system');

    // Play sound effect
    playSound('sounds/shield_activate.mp3', 0.7);

    // Effect duration - get from ability or default to 5
    const duration = ability && ability.buffDuration !== undefined ? ability.buffDuration : 5;

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
    shieldBuff.statModifiers = [
        { stat: 'magicalShield_percent', value: magicalShieldBoostValue, operation: 'add' } // Corrected key to indicate percentage
    ];

    // Add description
    shieldBuff.setDescription(`Increases Magical Shield by ${magicalShieldBoostValue}% and triggers Zap passive twice at the end of each turn for ${duration} turns.`);

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
    
    // Track Thunder Shield statistics
    if (window.trackThunderShieldStats) {
        window.trackThunderShieldStats(caster, false);
    }

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
    9,   // Cooldown
    thunderShieldEffect // The function implementing the logic
);

// Add additional properties needed for talents
thunderShieldAbility.buffDuration = 5;
thunderShieldAbility.disabled = false;

// Add custom description generator
thunderShieldAbility.generateDescription = function() {
    let desc = `Places a <span class="utility">shield</span> on Raiden for <span class="duration">${this.buffDuration} turns</span>. At end of turn, it <span class="passive">activates Raiden's passive twice</span> and gives <span class="buff">15% Magical Shield</span>.`;
    
    // Add talent callout if modified
    if (this.buffDuration > 5) {
        desc += `\n<span class="talent-effect utility">Talent: Shield duration increased to ${this.buffDuration} turns.</span>`;
    }
    
    // Add permanent shield note if disabled
    if (this.disabled) {
        desc += `\n<span class="talent-effect utility">Talent: This ability is disabled by Permanent Thunder talent.</span>`;
    }
    
    this.description = desc;
    return this.description;
};

// Generate initial description
thunderShieldAbility.generateDescription();
thunderShieldAbility.setTargetType('self');

// Electric Shock ability effect implementation
const electricShockEffect = (caster, target, ability) => {
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
    
    // Get debuff properties from ability or use defaults
    const debuffChance = ability && ability.debuffChance !== undefined ? ability.debuffChance : 0.15;
    const debuffDuration = ability && ability.debuffDuration !== undefined ? ability.debuffDuration : 4;
    
    // Function to execute a single Electric Shock cast
    const executeShock = (castNumber) => {
            // Create a delay between each enemy being hit
    aliveEnemies.forEach((enemy, index) => {
        setTimeout(() => {
            if (!enemy.isDead()) {
                // Roll for hit success (80% chance)
                const hitRoll = Math.random();
                const isHit = hitRoll < 0.8; // 80% hit chance
                
                if (isHit) {
                    // Apply damage to each enemy with statistics tracking
                    const damageResult = enemy.applyDamage(baseDamage, 'magical', caster, { abilityId: 'electric_shock' });
                    
                    // Use different message for second cast
                    if (castNumber > 1) {
                        log(`${enemy.name} takes ${damageResult.damage} magical damage from Forked Shock!`, damageResult.isCritical ? 'critical' : 'system');
                    } else {
                        log(`${enemy.name} takes ${damageResult.damage} magical damage from Electric Shock!`, damageResult.isCritical ? 'critical' : 'system');
                    }
                    
                    // Track hit statistics
                    if (window.trackElectricShockStats) {
                        window.trackElectricShockStats(caster, enemy, damageResult, true, castNumber > 1, false);
                    }
                } else {
                    // Miss
                    if (castNumber > 1) {
                        log(`${caster.name}'s Forked Shock misses ${enemy.name}!`, 'system');
                    } else {
                        log(`${caster.name}'s Electric Shock misses ${enemy.name}!`, 'system');
                    }
                    
                    // Track miss statistics
                    if (window.trackElectricShockStats) {
                        window.trackElectricShockStats(caster, enemy, null, false, castNumber > 1, false);
                    }
                    
                    // Show miss VFX for electric shock
                    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                    if (enemyElement) {
                        // Create miss effect (different from hit effect)
                        const missEffect = document.createElement('div');
                        missEffect.className = 'electric-shock-miss';
                        missEffect.textContent = 'MISS!';
                        enemyElement.appendChild(missEffect);
                        
                        // Remove after animation completes
                        setTimeout(() => missEffect.remove(), 1200);
                    }
                }
                
                // Only apply visual effects and debuffs if the attack hit
                if (isHit) {
                    // Show electric shock impact effect (only on hit)
                    const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                    if (enemyElement) {
                        // Create impact effect
                        const impactEffect = document.createElement('div');
                        impactEffect.className = 'electric-shock-impact';
                        enemyElement.appendChild(impactEffect);
                        
                        // Remove after animation completes
                        setTimeout(() => impactEffect.remove(), 800);
                    }
                    
                    // Check for debuff chance (only on hit)
                    if (Math.random() < debuffChance) {
                        // Create debuff effect
                        const debuffEffect = new Effect(
                            `electric_shock_debuff_${enemy.instanceId || enemy.id}_${Date.now()}`, // Unique ID
                            'Shocked',
                            'Icons/abilities/electric_shock.webp',
                            debuffDuration, // Use the dynamic duration
                            (target) => {
                                // This function is called each turn
                                log(`${target.name} suffers from electric interference!`, 'system');
                            },
                            true // isDebuff = true
                        );
                        
                        // Set stat modifiers (reduce magical shield by 15%)
                        debuffEffect.statModifiers = [
                            { stat: 'magicalShield', value: -15, operation: 'add' } // -15% to magical shield
                        ];
                        
                        // Check if the caster has the Disabling Shock talent and implement ability disabling
                        if (caster.shockedDisablesAbility) {
                            // Get enemy abilities that are not on cooldown and aren't already disabled
                            const availableAbilities = enemy.abilities.filter(a => 
                                !a.isDisabled && 
                                (a.currentCooldown === 0 || a.currentCooldown === undefined)
                            );
                            
                            // If there are abilities that can be disabled
                            if (availableAbilities.length > 0) {
                                // Select a random ability to disable
                                const randomIndex = Math.floor(Math.random() * availableAbilities.length);
                                const abilityToDisable = availableAbilities[randomIndex];
                                
                                // Store the original ability state
                                const originalIsDisabled = abilityToDisable.isDisabled;
                                
                                // Add onApply to set the ability as disabled
                                const originalOnApply = debuffEffect.onApply || (() => {});
                                debuffEffect.onApply = (target) => {
                                    // Call the original onApply first
                                    originalOnApply(target);
                                    
                                    // Disable the ability
                                    abilityToDisable.isDisabled = true;
                                    
                                    // Log the effect
                                    log(`${caster.name}'s Disabling Shock prevents ${target.name} from using ${abilityToDisable.name}!`, 'system-update');
                                    
                                    // Add visual effects to show disabled ability
                                    if (enemyElement) {
                                        const abilitiesDiv = enemyElement.querySelector('.abilities');
                                        if (abilitiesDiv) {
                                            const abilityElements = abilitiesDiv.querySelectorAll('.ability');
                                            abilityElements.forEach((abilityEl, i) => {
                                                if (i === enemy.abilities.indexOf(abilityToDisable)) {
                                                    abilityEl.classList.add('disabled');
                                                    
                                                    // Add a special icon to show it's disabled by shock
                                                    const disabledIcon = document.createElement('div');
                                                    disabledIcon.className = 'shocked-disabled-ability-icon';
                                                    abilityEl.appendChild(disabledIcon);
                                                }
                                            });
                                        }
                                    }
                                    
                                    // Update UI
                                    if (window.gameManager && window.gameManager.uiManager) {
                                        window.gameManager.uiManager.updateCharacterUI(target);
                                    }
                                };
                                
                                // Add onRemove to restore the ability
                                const originalOnRemove = debuffEffect.remove || (() => {});
                                debuffEffect.remove = function(character) {
                                    // Call the original remove first
                                    if (typeof originalOnRemove === 'function') {
                                        originalOnRemove(character);
                                    }
                                    
                                    // Re-enable the ability if it exists
                                    const abilityIndex = character.abilities.indexOf(abilityToDisable);
                                    if (abilityIndex !== -1) {
                                        character.abilities[abilityIndex].isDisabled = originalIsDisabled;
                                        
                                        // Log the ability being restored
                                        log(`${character.name}'s ${abilityToDisable.name} ability is no longer disabled.`, 'system-update');
                                        
                                        // Remove visual effects
                                        if (enemyElement) {
                                            const abilitiesDiv = enemyElement.querySelector('.abilities');
                                            if (abilitiesDiv) {
                                                const abilityElements = abilitiesDiv.querySelectorAll('.ability');
                                                abilityElements.forEach((abilityEl, i) => {
                                                    if (i === abilityIndex) {
                                                        abilityEl.classList.remove('disabled');
                                                        const disabledIcon = abilityEl.querySelector('.shocked-disabled-ability-icon');
                                                        if (disabledIcon) disabledIcon.remove();
                                                    }
                                                });
                                            }
                                        }
                                        
                                        // Update UI
                                        if (window.gameManager && window.gameManager.uiManager) {
                                            window.gameManager.uiManager.updateCharacterUI(character);
                                        }
                                    }
                                };
                                
                                // Update description to include ability disabling
                                debuffEffect.setDescription(`Reduces Magical Shield by 15% and disables ${abilityToDisable.name} for ${debuffDuration} turns.`);
                            } else {
                                debuffEffect.setDescription(`Reduces Magical Shield by 15% for ${debuffDuration} turns.`);
                            }
                        } else {
                            debuffEffect.setDescription(`Reduces Magical Shield by 15% for ${debuffDuration} turns.`);
                        }
                        
                        // Add visual effects for the debuff
                        const originalOnApply = debuffEffect.onApply || (() => {});
                        debuffEffect.onApply = (target) => {
                            // Call any existing onApply function
                            if (typeof originalOnApply === 'function') {
                                originalOnApply(target);
                            }
                            
                            log(`${target.name} is shocked, reducing their Magical Shield by 15% for ${debuffDuration} turns!`, 'system');
                            
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
                        
                        // Apply the debuff to the enemy
                        enemy.addDebuff(debuffEffect);
                        
                        // Track debuff application
                        if (window.trackElectricShockStats) {
                            window.trackElectricShockStats(caster, enemy, null, true, castNumber > 1, true);
                        }
                    }
                    
                    // Update enemy UI (only if hit)
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(enemy);
                    }
                } // End of "if (isHit)" block
            }
            }, index * 200); // Slight delay between each enemy
        });
    };
    
    // Execute the first cast
    executeShock(1);
    
    // Check for double cast chance
    const doubleCastChance = ability && ability.doubleCastChance !== undefined ? ability.doubleCastChance : 0;
    
    // If Forked Shock talent is active, try to trigger a second cast
    if (doubleCastChance > 0 && Math.random() < doubleCastChance) {
        const delay = aliveEnemies.length * 200 + 300; // Wait for first cast to complete
        
        setTimeout(() => {
            log(`${caster.name}'s Electric Shock forks into a second wave!`, 'system-update');
            
            // Play sound effect again for second cast
            playSound('sounds/lightning_strike.mp3', 0.6);
            
            // Add second casting visual effect
            if (casterElement) {
                // Create another shock wave effect for the second cast
                const shockWaveEffect = document.createElement('div');
                shockWaveEffect.className = 'electric-shock-wave';
                casterElement.appendChild(shockWaveEffect);
                
                // Remove after animation
                setTimeout(() => {
                    shockWaveEffect.remove();
                }, 1000);
            }
            
            // Execute second cast
            executeShock(2);
        }, delay);
    }
    
    // Handle Storm Circle talent if present (electric shock casts storm)
    if (caster.electricShockCastsStorm) {
        const stormDelay = aliveEnemies.length * 200 + (doubleCastChance > 0 ? 1500 : 800);
        
        setTimeout(() => {
            log(`${caster.name}'s Electric Shock summons a Storm Circle!`, 'system-update');
            
            // Play sound effect
            playSound('sounds/thunder_clap.mp3', 0.8);
            
            // Add visual effects
            if (casterElement) {
                // Create wave effect
                const stormCircleWave = document.createElement('div');
                stormCircleWave.className = 'storm-circle-wave';
                casterElement.appendChild(stormCircleWave);
                
                // Add lightning effect
                const stormLightning = document.createElement('div');
                stormLightning.className = 'storm-circle-lightning';
                casterElement.appendChild(stormLightning);
                
                // Remove effects after animation completes
                setTimeout(() => {
                    stormCircleWave.remove();
                    stormLightning.remove();
                }, 1500);
            }
            
            // Fixed damage amount
            const fixedDamage = 1000;
            
            // Get current alive enemies again (some may have died from Electric Shock)
            const enemies = caster.isAI ? 
                (gameState.playerCharacters || []) : 
                (gameState.aiCharacters || []);
            const currentAliveEnemies = enemies.filter(enemy => !enemy.isDead());
            
            // Apply Storm Circle damage to all enemies (without stun)
            setTimeout(() => {
                currentAliveEnemies.forEach((enemy, index) => {
                    setTimeout(() => {
                        if (!enemy.isDead()) {
                            // Apply damage with statistics tracking
                            const damageResult = enemy.applyDamage(fixedDamage, 'magical', caster, { abilityId: 'storm_circle' });
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
                            
                            // Update enemy UI
                            if (typeof updateCharacterUI === 'function') {
                                updateCharacterUI(enemy);
                            }
                        }
                    }, index * 150); // Slight delay between each enemy
                });
            }, 500);
        }, stormDelay);
    }
    
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
);

// Add additional properties needed for talents
electricShockAbility.debuffChance = 0.15;
electricShockAbility.debuffDuration = 4;
electricShockAbility.doubleCastChance = 0;

// Add custom description generator
electricShockAbility.generateDescription = function() {
    let desc = `<span class="hit-chance">80% chance</span> to deal <span class="damage">100% Magical damage</span> to each enemy. Has <span class="utility">${Math.round(this.debuffChance * 100)}% chance</span> to reduce <span class="debuff">Magical Shield by 15%</span> for <span class="duration">${this.debuffDuration} turns</span> on each hit.`;
    
    // Add talent callout if modified
    if (this.debuffChance === 1.0) {
        desc += `\n<span class="talent-effect utility">Talent: Always reduces Magical Shield.</span>`;
    }
    
    if (this.debuffDuration < 4) {
        desc += `\n<span class="talent-effect utility">Talent: Reduced to ${this.debuffDuration} turns duration.</span>`;
    }
    
    // Add Forked Shock talent description if enabled
    if (this.doubleCastChance > 0) {
        desc += `\n<span class="talent-effect damage">Talent (Forked Shock): ${Math.round(this.doubleCastChance * 100)}% chance to strike twice.</span>`;
    }
    
    // Add Shocking Storm talent description if enabled on the caster
    // We need to check the current game manager to see if the ability owner has the talent
    if (window.gameManager && 
        window.gameManager.gameState && 
        window.gameManager.gameState.playerCharacters) {
        
        const raidenChar = window.gameManager.gameState.playerCharacters.find(char => 
            char.id === 'farmer_raiden' || 
            (char.characterData && char.characterData.id === 'farmer_raiden')
        );
        
        if (raidenChar && raidenChar.electricShockCastsStorm) {
            desc += `\n<span class="talent-effect damage">Talent (Shocking Storm): Casts Storm Circle (without stun) after dealing damage.</span>`;
        }
    }
    
    this.description = desc;
    return this.description;
};

// Generate initial description
electricShockAbility.generateDescription();
electricShockAbility.setTargetType('all_enemies');

// Storm Circle ability effect implementation
const stormCircleEffect = (caster, target, ability) => {
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

    // Get all enemy characters (proper targeting based on caster's team)
    const enemies = caster.isAI ? 
        (gameState.playerCharacters || []) : 
        (gameState.aiCharacters || []);
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
    
    // Flag to track if we've applied Storm Empowerment
    let stormEmpowermentApplied = false;
    
    // Create a delay before applying damage to all enemies
    setTimeout(() => {
        // Apply damage and stun to each enemy
        aliveEnemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (!enemy.isDead()) {
                    // Roll for hit success (80% chance)
                    const hitRoll = Math.random();
                    const isHit = hitRoll < 0.8; // 80% hit chance
                    
                    if (isHit) {
                        // Apply damage with statistics tracking
                        const damageResult = enemy.applyDamage(fixedDamage, 'magical', caster, { abilityId: 'storm_circle' });
                        log(`${enemy.name} takes ${damageResult.damage} magical damage from Storm Circle!`, damageResult.isCritical ? 'critical' : 'system');
                        
                        // Track hit statistics
                        if (window.trackStormCircleStats) {
                            window.trackStormCircleStats(caster, enemy, damageResult, true, false, false);
                        }
                    } else {
                        // Miss
                        log(`${caster.name}'s Storm Circle misses ${enemy.name}!`, 'system');
                        
                        // Track miss statistics
                        if (window.trackStormCircleStats) {
                            window.trackStormCircleStats(caster, enemy, null, false, false, false);
                        }
                        
                        // Show miss VFX
                        const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                        if (enemyElement) {
                            // Create miss effect
                            const missEffect = document.createElement('div');
                            missEffect.className = 'storm-circle-miss';
                            missEffect.textContent = 'MISS!';
                            enemyElement.appendChild(missEffect);
                            
                            // Remove after animation completes
                            setTimeout(() => missEffect.remove(), 1200);
                        }
                    }
                    
                    // Only apply effects if the attack hit
                    if (isHit) {
                        // Show impact effect (only on hit)
                        const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
                        if (enemyElement) {
                            // Create impact effect
                            const impactEffect = document.createElement('div');
                            impactEffect.className = 'storm-circle-impact';
                            enemyElement.appendChild(impactEffect);
                            
                            // Remove after animation completes
                            setTimeout(() => impactEffect.remove(), 800);
                        }
                        
                        // Apply stun effect (if enemy is still alive after damage and hit)
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
                        
                        // Apply Storm Empowerment talent if active and not yet applied
                        if (caster.stormEmpowerment && !stormEmpowermentApplied && caster.passiveHandler) {
                            if (typeof caster.passiveHandler.applyStormEmpowermentBuff === 'function') {
                                caster.passiveHandler.applyStormEmpowermentBuff(caster);
                                stormEmpowermentApplied = true;
                            }
                        }
                        
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
                        
                        // Track stun application
                        if (window.trackStormCircleStats) {
                            window.trackStormCircleStats(caster, enemy, null, true, false, true);
                        }
                    }
                    
                    // Update enemy UI (only if hit)
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(enemy);
                    }
                } // End of "if (isHit)" block
            }
            }, index * 150); // Slight delay between each enemy for visual effect
        });
    }, 500);
    
    // Trigger passive after ability execution
    setTimeout(() => {
        if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityUsed === 'function') {
            caster.passiveHandler.onAbilityUsed(caster);
        }
        
        // Check for Double Storm talent (recast chance)
        const recastChance = ability && ability.recastChance !== undefined ? ability.recastChance : 0;
        if (recastChance > 0 && Math.random() < recastChance) {
            log(`${caster.name}'s Double Storm talent activates! Storm Circle is cast again without stun!`, 'system');
            
            // Show Double Storm visual effect
            const doubleStormVfx = document.createElement('div');
            doubleStormVfx.className = 'double-storm-effect';
            document.body.appendChild(doubleStormVfx);
            
            // Add text effect
            const doubleStormText = document.createElement('div');
            doubleStormText.className = 'double-storm-text';
            doubleStormText.textContent = 'DOUBLE STORM';
            doubleStormVfx.appendChild(doubleStormText);
            
            // Remove effect after animation
            setTimeout(() => {
                doubleStormVfx.remove();
            }, 2000);
            
            // Small delay before recasting
            setTimeout(() => {
                // Create a modified version of Storm Circle without stun
                const recastStormCircle = () => {
                    log(`${caster.name} unleashes Storm Circle again!`, 'system');
                    
                    // Play sound effect
                    playSound('sounds/thunder_strike.mp3', 0.8);
                    
                    // Get latest alive enemies (could have changed since first cast)
                    const currentEnemies = gameState.aiCharacters || [];
                    const currentAliveEnemies = currentEnemies.filter(enemy => !enemy.isDead());
                    
                    if (currentAliveEnemies.length === 0) {
                        log(`${caster.name}'s second Storm Circle has no living targets!`, 'system');
                        return;
                    }
                    
                    // Add casting visual effect to caster again
                    if (casterElement) {
                        casterElement.classList.add('storm-circle-cast');
                        
                        // Create storm circle wave effect
                        const secondWave = document.createElement('div');
                        secondWave.className = 'storm-circle-wave';
                        document.body.appendChild(secondWave);
                        
                        // Add lightning effect
                        const secondLightning = document.createElement('div');
                        secondLightning.className = 'storm-circle-lightning';
                        casterElement.appendChild(secondLightning);
                        
                        // Remove effects after animation completes
                        setTimeout(() => {
                            secondWave.remove();
                            secondLightning.remove();
                            casterElement.classList.remove('storm-circle-cast');
                        }, 1500);
                    }
                    
                    // Apply damage to all enemies again (without stun)
                    setTimeout(() => {
                        currentAliveEnemies.forEach((enemy, index) => {
                            setTimeout(() => {
                                if (!enemy.isDead()) {
                                    // Apply damage with statistics tracking  
                                    const damageResult = enemy.applyDamage(fixedDamage, 'magical', caster, { abilityId: 'storm_circle_recast' });
                                    log(`${enemy.name} takes ${damageResult.damage} magical damage from the second Storm Circle!`, damageResult.isCritical ? 'critical' : 'system');
                                    
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
                                    
                                    // Update enemy UI
                                    if (typeof updateCharacterUI === 'function') {
                                        updateCharacterUI(enemy);
                                    }
                                }
                            }, index * 150); // Slight delay between each enemy
                        });
                    }, 500);
                    
                    // Don't trigger passive again for the recast
                };
                
                // Execute the recast
                recastStormCircle();
            }, 2000); // Delay between original cast and recast
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
);

// Add recastChance property for talent
stormCircleAbility.recastChance = 0;

// Add custom description generator
stormCircleAbility.generateDescription = function() {
    // Get the current cooldown, which might be modified by talents
    const cooldown = this.cooldown || 10;
    
    let desc = `<span class="hit-chance">80% chance</span> to deal <span class="damage">1000 damage</span> to each enemy and <span class="debuff">stun them for 2 turns</span>.`;
    
    // Add talent indicator if cooldown is reduced
    if (cooldown < 10) {
        desc += `\n<span class="talent-effect utility">Talent: Cooldown reduced to ${cooldown} turns.</span>`;
    }
    
    // Add recast chance if talent is applied
    if (this.recastChance > 0) {
        desc += `\n<span class="talent-effect damage">Talent: ${this.recastChance * 100}% chance to cast Storm Circle again (without stun).</span>`;
    }
    
    this.description = desc;
    return this.description;
};

// Generate initial description
stormCircleAbility.generateDescription();
stormCircleAbility.setTargetType('all_enemies');

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

// Add handler for permanent Thunder Shield talent (from Raiden's talents)
document.addEventListener('gameStateReady', function(event) {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    const gameState = window.gameManager.gameState;
    const playerCharacters = gameState.playerCharacters || [];
    
    // Find Raiden character
    const raidenCharacter = playerCharacters.find(char => 
        char.id === 'farmer_raiden' || 
        (char.characterData && char.characterData.id === 'farmer_raiden')
    );
    
    if (raidenCharacter && raidenCharacter.permanentThunderShield === true) {
        console.log("[Permanent Thunder] Talent active - applying permanent Thunder Shield to Raiden");
        
        // Find Thunder Shield ability
        const thunderShieldAbility = raidenCharacter.abilities.find(ability => 
            ability.id === 'farmer_raiden_thunder_shield'
        );
        
        if (thunderShieldAbility) {
            // Set ability to permanent cooldown
            thunderShieldAbility.currentCooldown = Infinity;
            thunderShieldAbility.maxCooldown = Infinity; // Prevent reset
            
            // Force description update
            thunderShieldAbility.description = "Thunder Shield is permanently active (Talent: Permanent Thunder)";
            
            // Apply Thunder Shield effect with infinite duration
            setTimeout(() => {
                applyPermanentThunderShield(raidenCharacter);
            }, 500); // Small delay to ensure everything is initialized
        }
    }
});

// Add handler for stage loaded event as well for fallback
document.addEventListener('stageLoaded', function(event) {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    const gameState = window.gameManager.gameState;
    const playerCharacters = gameState.playerCharacters || [];
    
    // Find Raiden character
    const raidenCharacter = playerCharacters.find(char => 
        char.id === 'farmer_raiden' || 
        (char.characterData && char.characterData.id === 'farmer_raiden')
    );
    
    if (raidenCharacter && raidenCharacter.permanentThunderShield === true) {
        console.log("[Permanent Thunder] Talent active - applying permanent Thunder Shield on stage load");
        
        // Find Thunder Shield ability
        const thunderShieldAbility = raidenCharacter.abilities.find(ability => 
            ability.id === 'farmer_raiden_thunder_shield'
        );
        
        if (thunderShieldAbility && thunderShieldAbility.currentCooldown !== Infinity) {
            // Set ability to permanent cooldown
            thunderShieldAbility.currentCooldown = Infinity;
            thunderShieldAbility.maxCooldown = Infinity; // Prevent reset
            
            // Force description update
            thunderShieldAbility.description = "Thunder Shield is permanently active (Talent: Permanent Thunder)";
            
            // Apply Thunder Shield effect with infinite duration
            setTimeout(() => {
                applyPermanentThunderShield(raidenCharacter);
            }, 500); // Small delay to ensure everything is initialized
        }
    }
});

// Function to apply permanent Thunder Shield
function applyPermanentThunderShield(character) {
    if (!character) return;
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${character.name}'s Permanent Thunder talent activates!`, 'system');
    playSound('sounds/shield_activate.mp3', 0.7);

    // Create permanent Thunder Shield buff
    const shieldBuff = new Effect(
        'permanent_thunder_shield_buff',
        'Permanent Thunder Shield',
        'Icons/abilities/thunder_shield.webp',
        Infinity, // Infinite duration
        // Effect function: Called each turn by processEffects
        (target) => {
            // This function handles the END OF TURN logic
            log(`${target.name}'s Permanent Thunder Shield crackles with energy!`, 'system');

            // Trigger passive twice
            if (target.passiveHandler && typeof target.passiveHandler.onAbilityUsed === 'function') {
                log(`Permanent Thunder Shield activates ${target.name}'s Zap passive twice!`, 'passive');

                // Play sound
                playSound('sounds/lightning_zap.mp3', 0.8);

                // Trigger passive twice
                target.passiveHandler.onAbilityUsed(target);
                setTimeout(() => {
                    if (!target.isDead()) { // Check if target is still alive
                         target.passiveHandler.onAbilityUsed(target);
                    }
                }, 300); // Small delay between zaps for visual clarity
            }
        },
        false // isDebuff = false
    );

    // Add stat modifier for magical shield
    shieldBuff.statModifiers = [
        { stat: 'magicalShield_percent', value: 15, operation: 'add' } // 15% magical shield boost
    ];

    // Add description
    shieldBuff.setDescription(`Permanently increases Magical Shield by 15% and triggers Zap passive twice at the end of each turn.`);

    // Add custom hooks for VFX
    shieldBuff.onApply = (target) => {
        log(`${target.name} is surrounded by a permanent lightning barrier!`, 'system');
        // Add visual effect for the shield
        const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (characterElement) {
            // Add shield VFX container if it doesn't exist
            if (!characterElement.querySelector('.thunder-shield-effect')) {
                const shieldElement = document.createElement('div');
                shieldElement.className = 'thunder-shield-effect permanent-shield';
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
    };

    // Add the permanent shield buff
    character.addBuff(shieldBuff);
    
    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(character);
    }
    
    // Make the ability visually show as permanently on cooldown
    if (window.gameManager && window.gameManager.uiManager) {
        setTimeout(() => {
            const abilityElements = document.querySelectorAll(`.ability[data-ability-id="farmer_raiden_thunder_shield"]`);
            abilityElements.forEach(element => {
                // Add permanent cooldown visual
                if (!element.querySelector('.permanent-cooldown')) {
                    const permanentCooldown = document.createElement('div');
                    permanentCooldown.className = 'ability-cooldown permanent-cooldown';
                    permanentCooldown.innerText = '∞';
                    element.appendChild(permanentCooldown);
                    
                    // Add tooltip
                    element.title = "Thunder Shield is permanently active";
                }
            });
        }, 200);
    }
} 