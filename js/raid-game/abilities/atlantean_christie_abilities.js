// Kick ability effect function
const kickEffect = (caster, target, ability, actualManaCost, options = {}) => {
    if (!target || target.isDead()) {
        window.gameManager.addLogEntry(`${caster.name}'s Kick finds no valid target!`, 'player-turn');
        return { doesNotEndTurn: true };
    }

    // The ability system already consumed the mana, so we don't need to do it again
    // Just check if we had enough (this should have been validated already)
    console.log(`[Atlantean Christie] Kick used, actualManaCost: ${actualManaCost}, current AP: ${caster.stats.currentMana}`);

    window.gameManager.addLogEntry(`${caster.name} unleashes a devastating Kick combo!`, 'player-turn');

    // Perform 3 strikes
    AtlanteanChristieAbilities.performKickStrikes(caster, target);
    
    // Return doesNotEndTurn flag so the ability doesn't end the turn
    return { doesNotEndTurn: true };
};

// Charming Kiss ability effect function
const charmingKissEffect = (caster, target, ability, actualManaCost, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    // Since this targets all enemies, get all opponents
    const enemies = window.gameManager.getOpponents(caster);
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Charming Kiss finds no valid targets!`, 'player-turn');
        return { doesNotEndTurn: true };
    }

    log(`${caster.name} blows an aquatic kiss at all enemies!`, 'player-turn');

    // Show initial cast VFX with a slight delay to ensure it's visible
    setTimeout(() => {
        AtlanteanChristieAbilities.showCharmingKissCastVFX(caster);
    }, 100);

    // Process each enemy with 58% hit chance
    enemies.forEach((enemy, index) => {
        setTimeout(() => {
            if (enemy.isDead()) return;

            // 58% chance to hit
            const hitRoll = Math.random();
            if (hitRoll > 0.58) {
                log(`${enemy.name} resists the charming kiss!`, 'player-turn');
                AtlanteanChristieAbilities.showCharmingKissMissVFX(enemy);
                return;
            }

            // Show hit VFX
            AtlanteanChristieAbilities.showCharmingKissHitVFX(caster, enemy);

            // Apply the charm debuff
            const charmDebuff = {
                id: 'charming_kiss_debuff',
                name: 'Charming Kiss',
                icon: 'Icons/abilities/charming_kiss.png',
                duration: 5,
                isDebuff: true,
                source: caster.id,
                description: `Taking 75% more damage from ${caster.name}.`,
                onRemove: function(character) {
                    AtlanteanChristieAbilities.removeCharmVFX(character);
                }
            };

            enemy.addDebuff(charmDebuff);
            log(`${enemy.name} is charmed by the kiss!`, 'player-turn');
        }, 200 + index * 200); // Start after initial cast VFX and stagger timing for each enemy
    });

    // Return doesNotEndTurn flag so the ability doesn't end the turn
    return { doesNotEndTurn: true };
};

// Samba Slam ability effect function
const sambaSlamEffect = (caster, target, ability, actualManaCost, options = {}) => {
    if (!target || target.isDead()) {
        window.gameManager.addLogEntry(`${caster.name}'s Samba Slam finds no valid target!`, 'player-turn');
        return { doesNotEndTurn: true };
    }

    console.log(`[Atlantean Christie] Samba Slam used, actualManaCost: ${actualManaCost}, current AP: ${caster.stats.currentMana}`);

    window.gameManager.addLogEntry(`${caster.name} performs a devastating Samba Slam!`, 'player-turn');

    // Show slam preparation VFX
    AtlanteanChristieAbilities.showSambaSlamPrepVFX(caster);

    // Delay for preparation animation
    setTimeout(() => {
        if (target.isDead()) {
            window.gameManager.addLogEntry(`${target.name} is already defeated!`, 'player-turn');
            return;
        }

        // Calculate damage: 300 + 100% Physical Damage
        const baseDamage = 300;
        const physicalDamageBonus = caster.stats.physicalDamage;
        const totalDamage = baseDamage + physicalDamageBonus;

        // Show slam impact VFX
        AtlanteanChristieAbilities.showSambaSlamImpactVFX(caster, target);

        // Apply damage
        const damageResult = target.applyDamage(totalDamage, 'physical', caster, { 
            abilityId: 'atlantean_christie_samba_slam' 
        });

        if (damageResult.isDodged) {
            window.gameManager.addLogEntry(`${target.name} dodges ${caster.name}'s Samba Slam!`, 'player-turn');
        } else {
            const actualDamage = damageResult.damage || damageResult.actualDamage || totalDamage;
            const damageText = damageResult.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
            window.gameManager.addLogEntry(`${caster.name}'s Samba Slam deals ${damageText} to ${target.name}!`, 'player-turn');

            // Apply stun if not dodged (100% chance)
            // Create the stun debuff using the global stun pattern
            const stunDebuff = new Effect(
                `samba_slam_stun_${target.instanceId || target.id}_${Date.now()}`, // Unique ID
                'Stunned',
                'Icons/debuffs/stun.png',
                2, // Duration: 2 turns
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
            
            // Add stun VFX using the global pattern
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
            window.gameManager.addLogEntry(`${target.name} is stunned by the powerful slam!`, 'player-turn');
        }
    }, 800); // Wait for preparation animation

    // Return doesNotEndTurn flag so the ability doesn't end the turn
    return { doesNotEndTurn: true };
};

// Throwkick ability effect function
const throwkickEffect = (caster, target, ability, actualManaCost, options = {}) => {
    if (!target || target.isDead()) {
        window.gameManager.addLogEntry(`${caster.name}'s Throwkick finds no valid target!`, 'player-turn');
        return { doesNotEndTurn: true };
    }

    console.log(`[Atlantean Christie] Throwkick used, actualManaCost: ${actualManaCost}, current AP: ${caster.stats.currentMana}`);

    window.gameManager.addLogEntry(`${caster.name} prepares for a devastating Throwkick!`, 'player-turn');

    // Apply temporary buffs for this turn only (1 turn duration)
    // Calculate the exact physical damage bonus (50% of current base physical damage)
    const baseDamage = caster.baseStats.physicalDamage || caster.stats.physicalDamage || 0;
    const damageBonus = Math.round(baseDamage * 0.5);
    
    const physicalDamageBuff = {
        id: 'throwkick_physical_damage_buff',
        name: 'Throwkick Power',
        icon: 'Icons/abilities/throwkick.png',
        duration: 1,
        isDebuff: false,
        source: caster.id,
        description: `Physical damage increased by 50% (+${damageBonus} damage).`,
        statModifiers: [{
            stat: 'physicalDamage',
            operation: 'add',
            value: damageBonus // Direct addition of the calculated bonus
        }]
    };

    const lifestealBuff = {
        id: 'throwkick_lifesteal_buff',
        name: 'Throwkick Lifesteal',
        icon: 'Icons/abilities/throwkick.png',
        duration: 1,
        isDebuff: false,
        source: caster.id,
        description: 'Lifesteal increased by 30%.',
        statModifiers: [{
            stat: 'lifesteal',
            operation: 'add',
            value: 0.30 // 30% lifesteal
        }]
    };

    // Debug: Log stats before buff
    console.log(`[Throwkick DEBUG] Before buff - Physical Damage: ${caster.stats.physicalDamage}, Base Physical Damage: ${caster.baseStats.physicalDamage}, Calculated Bonus: +${damageBonus}`);

    // Add buffs to Christie
    caster.addBuff(physicalDamageBuff);
    caster.addBuff(lifestealBuff);

    // Recalculate stats to apply the buffs immediately
    caster.recalculateStats('throwkick_buffs');

    // Debug: Log stats after buff
    console.log(`[Throwkick DEBUG] After buff - Physical Damage: ${caster.stats.physicalDamage}, Base Physical Damage: ${caster.baseStats.physicalDamage}, Expected: ${(caster.baseStats.physicalDamage || caster.stats.physicalDamage) + damageBonus}`);

    // Show buff application VFX
    AtlanteanChristieAbilities.showThrowkickBuffVFX(caster);

    window.gameManager.addLogEntry(`${caster.name} is empowered with enhanced strength and lifesteal!`, 'player-turn');

    // Delay for buff animation
    setTimeout(() => {
        if (target.isDead()) {
            window.gameManager.addLogEntry(`${target.name} is already defeated!`, 'player-turn');
            return;
        }

        // Show preparation VFX and kick animation
        AtlanteanChristieAbilities.showThrowkickPrepVFX(caster);
        AtlanteanChristieAbilities.showChristieKickAnimation(caster);

        // Delay for preparation animation
        setTimeout(() => {
            if (target.isDead()) {
                window.gameManager.addLogEntry(`${target.name} is already defeated!`, 'player-turn');
                return;
            }

            // Calculate damage: 315% of Physical Damage
            // Note: The buff is already applied, so stats.physicalDamage should include the 50% boost
            const totalDamage = Math.round(caster.stats.physicalDamage * 3.15);

            // Show kick impact VFX
            AtlanteanChristieAbilities.showThrowkickImpactVFX(caster, target);

            // Apply damage
            const damageResult = target.applyDamage(totalDamage, 'physical', caster, { 
                abilityId: 'atlantean_christie_throwkick' 
            });

            if (damageResult.isDodged) {
                window.gameManager.addLogEntry(`${target.name} dodges ${caster.name}'s Throwkick!`, 'player-turn');
            } else {
                const actualDamage = damageResult.damage || damageResult.actualDamage || totalDamage;
                const damageText = damageResult.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
                window.gameManager.addLogEntry(`${caster.name}'s Throwkick deals ${damageText} to ${target.name}!`, 'player-turn');

                // If the kick was successful (dealt damage), Christie gains 3 ability points
                const manaGain = 3;
                const maxMana = caster.stats.maxMana || caster.stats.mana || 0;
                const newMana = Math.min(maxMana, (caster.stats.currentMana || 0) + manaGain);
                caster.stats.currentMana = newMana;
                
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(caster);
                    window.gameManager.uiManager.triggerManaAnimation(caster, 'restore', manaGain);
                }

                window.gameManager.addLogEntry(`${caster.name} gains ${manaGain} ability points from the successful kick!`, 'player-turn');

                // Show mana gain VFX
                AtlanteanChristieAbilities.showThrowkickManaGainVFX(caster);
            }
        }, 800); // Wait for preparation animation
    }, 600); // Wait for buff animation

    // Return doesNotEndTurn flag so the ability doesn't end the turn
    return { doesNotEndTurn: true };
};

// Atlantean Christie Abilities
class AtlanteanChristieAbilities {

    static performKickStrikes(caster, primaryTarget) {
        let strikeDelay = 0;
        
        for (let strike = 1; strike <= 3; strike++) {
            setTimeout(() => {
                if (primaryTarget.isDead()) {
                    window.gameManager.addLogEntry(`${primaryTarget.name} is already defeated!`, 'player-turn');
                    return;
                }

                // Calculate primary damage (112% physical damage)
                const primaryDamage = Math.round(caster.stats.physicalDamage * 1.12);
                
                // Show strike VFX
                AtlanteanChristieAbilities.showKickStrikeVFX(caster, primaryTarget, strike);
                
                // Apply damage to primary target
                const primaryResult = primaryTarget.applyDamage(primaryDamage, 'physical', caster, { 
                    abilityId: 'atlantean_christie_kick' 
                });
                
                if (primaryResult.isDodged) {
                    window.gameManager.addLogEntry(`${primaryTarget.name} dodges ${caster.name}'s Kick strike ${strike}!`, 'player-turn');
                } else {
                    const actualDamage = primaryResult.damage || primaryResult.actualDamage || primaryDamage;
                    const damageText = primaryResult.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
                    window.gameManager.addLogEntry(`${caster.name}'s Kick strike ${strike} deals ${damageText} to ${primaryTarget.name}!`, 'player-turn');
                }

                // Check for chain hits (25% chance each)
                AtlanteanChristieAbilities.checkForChainHits(caster, primaryTarget, strike);
                
            }, strikeDelay);
            
            strikeDelay += 600; // 600ms between strikes
        }
    }

    static checkForChainHits(caster, primaryTarget, strikeNumber) {
        // Get enemies using the game manager's getOpponents method
        let enemies = [];
        
        if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
            enemies = window.gameManager.getOpponents(caster).filter(char => 
                !char.isDead() && char !== primaryTarget
            );
        } else {
            console.warn(`[Atlantean Christie] GameManager or getOpponents method not available`);
            return;
        }
        
        console.log(`[Atlantean Christie] Found ${enemies.length} potential chain targets for strike ${strikeNumber}`);
        
        if (enemies.length === 0) {
            console.log(`[Atlantean Christie] No valid chain targets available for strike ${strikeNumber}`);
            return;
        }

        // 25% chance for chain hits
        const chainRoll = Math.random();
        console.log(`[Atlantean Christie] Chain hit roll for strike ${strikeNumber}: ${Math.round(chainRoll * 100)}% (need ≤25%)`);
        
        if (chainRoll > 0.25) {
            console.log(`[Atlantean Christie] Chain hit failed for strike ${strikeNumber}`);
            return;
        }
        
        console.log(`[Atlantean Christie] Chain hit triggered for strike ${strikeNumber}!`);

        // Determine how many additional enemies to hit (1-4)
        const maxChainTargets = Math.min(4, enemies.length);
        const chainTargets = Math.floor(Math.random() * maxChainTargets) + 1;
        
        // Shuffle and select targets
        const shuffledEnemies = [...enemies].sort(() => 0.5 - Math.random());
        const selectedTargets = shuffledEnemies.slice(0, chainTargets);

        window.gameManager.addLogEntry(`${caster.name}'s Kick strike ${strikeNumber} chains to ${chainTargets} additional enemies!`, 'player-turn');

        // Apply chain damage (60% physical damage)
        selectedTargets.forEach((target, index) => {
            setTimeout(() => {
                const chainDamage = Math.round(caster.stats.physicalDamage * 0.60);
                
                AtlanteanChristieAbilities.showChainKickVFX(caster, target);
                
                const result = target.applyDamage(chainDamage, 'physical', caster, { 
                    abilityId: 'atlantean_christie_kick_chain' 
                });
                
                if (result.isDodged) {
                    window.gameManager.addLogEntry(`${target.name} dodges the chain kick!`, 'player-turn');
                } else {
                    const actualDamage = result.damage || result.actualDamage || chainDamage;
                    const damageText = result.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
                    window.gameManager.addLogEntry(`Chain kick deals ${damageText} to ${target.name}!`, 'player-turn');
                }
            }, index * 200); // Stagger chain hits
        });
    }

    static showKickStrikeVFX(caster, target, strikeNumber) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        
        if (!casterElement || !targetElement) return;

        // Create kick strike effect
        const kickEffect = document.createElement('div');
        kickEffect.className = 'kick-strike-vfx';
        kickEffect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, #00ffff 0%, #0080ff 50%, transparent 70%);
            border-radius: 50%;
            animation: kickStrike${strikeNumber} 0.5s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;

        targetElement.appendChild(kickEffect);

        // Add strike-specific animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes kickStrike${strikeNumber} {
                0% { 
                    transform: translate(-50%, -50%) scale(0.3) rotate(${strikeNumber * 120}deg);
                    opacity: 0;
                }
                50% { 
                    transform: translate(-50%, -50%) scale(1.2) rotate(${strikeNumber * 120 + 180}deg);
                    opacity: 1;
                }
                100% { 
                    transform: translate(-50%, -50%) scale(0.8) rotate(${strikeNumber * 120 + 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Clean up
        setTimeout(() => {
            kickEffect.remove();
            style.remove();
        }, 500);

        // Screen shake for impact
        document.querySelector('.battle-container').classList.add('screen-shake');
        setTimeout(() => {
            document.querySelector('.battle-container').classList.remove('screen-shake');
        }, 200);
    }

    static showChainKickVFX(caster, target) {
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        
        if (!targetElement) return;

        // Create chain kick effect
        const chainEffect = document.createElement('div');
        chainEffect.className = 'chain-kick-vfx';
        chainEffect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, #80ffff 0%, #4080ff 60%, transparent 80%);
            border-radius: 50%;
            animation: chainKickStrike 0.4s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;

        targetElement.appendChild(chainEffect);

        // Add chain kick animation
        if (!document.getElementById('chainKickAnimation')) {
            const style = document.createElement('style');
            style.id = 'chainKickAnimation';
            style.textContent = `
                @keyframes chainKickStrike {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.2);
                        opacity: 0;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.0);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(0.6);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Clean up
        setTimeout(() => {
            chainEffect.remove();
        }, 400);
    }

    static showCharmingKissCastVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create main aquatic aura effect around Christie
        const auraEffect = document.createElement('div');
        auraEffect.className = 'charming-kiss-cast-aura';
        casterElement.appendChild(auraEffect);

        // Create water ripples emanating from Christie
        const ripplesContainer = document.createElement('div');
        ripplesContainer.className = 'aquatic-ripples-container';
        casterElement.appendChild(ripplesContainer);

        // Add multiple ripple waves
        for (let i = 0; i < 5; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'aquatic-ripple';
            ripple.style.animationDelay = `${i * 0.2}s`;
            ripplesContainer.appendChild(ripple);
        }

        // Create bubbles floating around Christie
        const bubblesContainer = document.createElement('div');
        bubblesContainer.className = 'aquatic-bubbles-container';
        casterElement.appendChild(bubblesContainer);

        // Add floating bubbles
        for (let i = 0; i < 15; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'aquatic-bubble';
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.animationDelay = `${Math.random() * 2}s`;
            bubble.style.animationDuration = `${2 + Math.random() * 2}s`;
            bubblesContainer.appendChild(bubble);
        }

        // Create lip/kiss indicator on Christie
        const kissIndicator = document.createElement('div');
        kissIndicator.className = 'kiss-indicator';
        casterElement.appendChild(kissIndicator);

        // Cleanup
        setTimeout(() => {
            auraEffect.remove();
            ripplesContainer.remove();
            bubblesContainer.remove();
            kissIndicator.remove();
        }, 2000);
    }

    static showCharmingKissHitVFX(caster, target) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!casterElement || !targetElement) return;

        // Create kiss projectile that travels from Christie to target
        const battleContainer = document.querySelector('.battle-container');
        const kissProjectile = document.createElement('div');
        kissProjectile.className = 'aquatic-kiss-projectile';
        battleContainer.appendChild(kissProjectile);

        // Calculate positions
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = battleContainer.getBoundingClientRect();

        const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
        const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
        const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

        // Position projectile at start
        kissProjectile.style.left = `${startX}px`;
        kissProjectile.style.top = `${startY}px`;

        // Create water trail particles behind the projectile
        const trailContainer = document.createElement('div');
        trailContainer.className = 'aquatic-trail-container';
        battleContainer.appendChild(trailContainer);

        // Animate projectile to target
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const duration = Math.max(800, distance * 2); // Minimum 800ms, scale with distance

        kissProjectile.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        kissProjectile.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;

        // Create trailing water particles during flight
        let trailInterval = setInterval(() => {
            if (!kissProjectile.parentNode) {
                clearInterval(trailInterval);
                return;
            }

            const trail = document.createElement('div');
            trail.className = 'aquatic-trail-particle';
            const currentRect = kissProjectile.getBoundingClientRect();
            trail.style.left = `${currentRect.left - containerRect.left}px`;
            trail.style.top = `${currentRect.top - containerRect.top}px`;
            trailContainer.appendChild(trail);

            setTimeout(() => trail.remove(), 800);
        }, 50);

        // When projectile reaches target
        setTimeout(() => {
            clearInterval(trailInterval);
            
            // Create impact effect on target
            const impactEffect = document.createElement('div');
            impactEffect.className = 'aquatic-kiss-impact';
            targetElement.appendChild(impactEffect);

            // Create water splash particles
            const splashContainer = document.createElement('div');
            splashContainer.className = 'aquatic-splash-container';
            targetElement.appendChild(splashContainer);

            for (let i = 0; i < 12; i++) {
                const splash = document.createElement('div');
                splash.className = 'aquatic-splash-particle';
                splash.style.transform = `rotate(${i * 30}deg)`;
                splash.style.animationDelay = `${i * 0.05}s`;
                splashContainer.appendChild(splash);
            }

            // Create charm effect with water particles
            const charmEffect = document.createElement('div');
            charmEffect.className = 'aquatic-charm-effect';
            targetElement.appendChild(charmEffect);

            // Add floating water droplets around target
            for (let i = 0; i < 8; i++) {
                const droplet = document.createElement('div');
                droplet.className = 'water-droplet';
                droplet.style.left = `${20 + Math.random() * 60}%`;
                droplet.style.animationDelay = `${Math.random() * 1}s`;
                charmEffect.appendChild(droplet);
            }

            // Add charm indicator with aquatic theme
            const charmIndicator = document.createElement('div');
            charmIndicator.className = 'aquatic-charm-indicator';
            charmIndicator.setAttribute('data-character-id', target.id);
            targetElement.appendChild(charmIndicator);

            // Cleanup projectile and trail
            kissProjectile.remove();
            trailContainer.remove();

            // Cleanup impact effects
            setTimeout(() => {
                impactEffect.remove();
                splashContainer.remove();
                charmEffect.remove();
            }, 2000);

        }, duration);
    }

    static showCharmingKissMissVFX(target) {
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!targetElement) return;

        // Create water shield effect to show resistance
        const shieldEffect = document.createElement('div');
        shieldEffect.className = 'aquatic-resist-shield';
        targetElement.appendChild(shieldEffect);

        // Create resist text with water theme
        const resistText = document.createElement('div');
        resistText.className = 'aquatic-resist-text';
        resistText.textContent = 'RESIST';
        targetElement.appendChild(resistText);

        // Create water droplets falling off the shield
        for (let i = 0; i < 6; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'resist-water-droplet';
            droplet.style.left = `${20 + Math.random() * 60}%`;
            droplet.style.animationDelay = `${Math.random() * 0.5}s`;
            targetElement.appendChild(droplet);

            setTimeout(() => droplet.remove(), 1500);
        }

        // Cleanup
        setTimeout(() => {
            shieldEffect.remove();
            resistText.remove();
        }, 1500);
    }

    static removeCharmVFX(target) {
        const indicator = document.querySelector(`.aquatic-charm-indicator[data-character-id="${target.id}"]`);
        if (indicator) {
            // Add fade out effect
            indicator.style.opacity = '0';
            indicator.style.transform = 'scale(0)';
            setTimeout(() => indicator.remove(), 500);
        }
    }

    static showSambaSlamPrepVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create rhythmic energy buildup around Christie
        const energyAura = document.createElement('div');
        energyAura.className = 'samba-slam-energy-aura';
        casterElement.appendChild(energyAura);

        // Create dancing water particles
        const dancingWaters = document.createElement('div');
        dancingWaters.className = 'samba-dancing-waters';
        casterElement.appendChild(dancingWaters);

        // Add multiple water dance particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'samba-water-particle';
            particle.style.transform = `rotate(${i * 30}deg)`;
            particle.style.animationDelay = `${i * 0.1}s`;
            dancingWaters.appendChild(particle);
        }

        // Create rhythm pulse effect
        const rhythmPulse = document.createElement('div');
        rhythmPulse.className = 'samba-rhythm-pulse';
        casterElement.appendChild(rhythmPulse);

        // Cleanup
        setTimeout(() => {
            energyAura.remove();
            dancingWaters.remove();
            rhythmPulse.remove();
        }, 800);
    }

    static showSambaSlamImpactVFX(caster, target) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!casterElement || !targetElement) return;

        // Create slam wave that travels from caster to target
        const battleContainer = document.querySelector('.battle-container');
        const slamWave = document.createElement('div');
        slamWave.className = 'samba-slam-wave';
        battleContainer.appendChild(slamWave);

        // Calculate positions
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = battleContainer.getBoundingClientRect();

        const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
        const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
        const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

        // Position wave at start
        slamWave.style.left = `${startX}px`;
        slamWave.style.top = `${startY}px`;

        // Animate wave to target
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const duration = Math.max(400, distance * 1.5);

        slamWave.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        slamWave.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(2)`;

        // When wave reaches target
        setTimeout(() => {
            // Create massive impact explosion
            const impactExplosion = document.createElement('div');
            impactExplosion.className = 'samba-slam-impact-explosion';
            targetElement.appendChild(impactExplosion);

            // Create shockwave ripples
            const shockwaveContainer = document.createElement('div');
            shockwaveContainer.className = 'samba-shockwave-container';
            targetElement.appendChild(shockwaveContainer);

            // Add multiple shockwave rings
            for (let i = 0; i < 5; i++) {
                const shockwave = document.createElement('div');
                shockwave.className = 'samba-shockwave-ring';
                shockwave.style.animationDelay = `${i * 0.1}s`;
                shockwaveContainer.appendChild(shockwave);
            }

            // Create water splash explosion
            const splashExplosion = document.createElement('div');
            splashExplosion.className = 'samba-water-explosion';
            targetElement.appendChild(splashExplosion);

            // Add water explosion particles
            for (let i = 0; i < 20; i++) {
                const splash = document.createElement('div');
                splash.className = 'samba-explosion-particle';
                splash.style.transform = `rotate(${i * 18}deg)`;
                splash.style.animationDelay = `${i * 0.02}s`;
                splashExplosion.appendChild(splash);
            }

            // Screen shake for impact
            document.querySelector('.battle-container').classList.add('samba-slam-shake');
            setTimeout(() => {
                document.querySelector('.battle-container').classList.remove('samba-slam-shake');
            }, 600);

            // Cleanup wave
            slamWave.remove();

            // Cleanup impact effects
            setTimeout(() => {
                impactExplosion.remove();
                shockwaveContainer.remove();
                splashExplosion.remove();
            }, 2000);

        }, duration);
    }

    static showSambaStunVFX(target) {
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!targetElement) return;

        // Create swirling stun effect with aquatic theme
        const stunSwirl = document.createElement('div');
        stunSwirl.className = 'samba-stun-swirl';
        stunSwirl.setAttribute('data-character-id', target.id);
        targetElement.appendChild(stunSwirl);

        // Add swirling water particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'samba-stun-particle';
            particle.style.transform = `rotate(${i * 45}deg)`;
            particle.style.animationDelay = `${i * 0.2}s`;
            stunSwirl.appendChild(particle);
        }

        // Create dizziness indicators
        const dizzyIndicator = document.createElement('div');
        dizzyIndicator.className = 'samba-dizzy-indicator';
        stunSwirl.appendChild(dizzyIndicator);

        // The stun effect will be removed when the debuff expires
        // No need for manual cleanup as it's handled by the debuff system
    }

    // Throwkick VFX methods
    static showThrowkickBuffVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create power aura
        const powerAura = document.createElement('div');
        powerAura.className = 'throwkick-power-aura';
        casterElement.appendChild(powerAura);

        // Create energy rings
        const energyRings = document.createElement('div');
        energyRings.className = 'throwkick-energy-rings';
        casterElement.appendChild(energyRings);

        // Add multiple energy rings
        for (let i = 0; i < 4; i++) {
            const ring = document.createElement('div');
            ring.className = 'throwkick-energy-ring';
            ring.style.animationDelay = `${i * 0.15}s`;
            energyRings.appendChild(ring);
        }

        // Create lifesteal sparkles
        const lifestealSparkles = document.createElement('div');
        lifestealSparkles.className = 'throwkick-lifesteal-sparkles';
        casterElement.appendChild(lifestealSparkles);

        // Add sparkle particles
        for (let i = 0; i < 16; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'throwkick-sparkle';
            sparkle.style.transform = `rotate(${i * 22.5}deg)`;
            sparkle.style.animationDelay = `${i * 0.05}s`;
            lifestealSparkles.appendChild(sparkle);
        }

        // Cleanup after animation
        setTimeout(() => {
            powerAura.remove();
            energyRings.remove();
            lifestealSparkles.remove();
        }, 600);
    }

    static showThrowkickPrepVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create charging energy field
        const chargingField = document.createElement('div');
        chargingField.className = 'throwkick-charging-field';
        casterElement.appendChild(chargingField);

        // Create stance preparation effect
        const stancePrep = document.createElement('div');
        stancePrep.className = 'throwkick-stance-prep';
        casterElement.appendChild(stancePrep);

        // Add energy waves
        const energyWaves = document.createElement('div');
        energyWaves.className = 'throwkick-energy-waves';
        casterElement.appendChild(energyWaves);

        // Create wave particles
        for (let i = 0; i < 6; i++) {
            const wave = document.createElement('div');
            wave.className = 'throwkick-energy-wave';
            wave.style.animationDelay = `${i * 0.1}s`;
            energyWaves.appendChild(wave);
        }

        // Create focus lines
        const focusLines = document.createElement('div');
        focusLines.className = 'throwkick-focus-lines';
        casterElement.appendChild(focusLines);

        // Add focus line particles
        for (let i = 0; i < 8; i++) {
            const line = document.createElement('div');
            line.className = 'throwkick-focus-line';
            line.style.transform = `rotate(${i * 45}deg)`;
            line.style.animationDelay = `${i * 0.08}s`;
            focusLines.appendChild(line);
        }

        // Cleanup after animation
        setTimeout(() => {
            chargingField.remove();
            stancePrep.remove();
            energyWaves.remove();
            focusLines.remove();
        }, 800);
    }

    static showThrowkickImpactVFX(caster, target) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!casterElement || !targetElement) return;

        // Create kick projectile that travels from caster to target
        const battleContainer = document.querySelector('.battle-container');
        const kickProjectile = document.createElement('div');
        kickProjectile.className = 'throwkick-projectile';
        battleContainer.appendChild(kickProjectile);

        // Calculate positions
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = battleContainer.getBoundingClientRect();

        const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
        const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
        const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

        // Position projectile at start
        kickProjectile.style.left = `${startX}px`;
        kickProjectile.style.top = `${startY}px`;

        // Create projectile trail
        const projectileTrail = document.createElement('div');
        projectileTrail.className = 'throwkick-projectile-trail';
        kickProjectile.appendChild(projectileTrail);

        // Animate projectile to target
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const duration = Math.max(300, distance * 1.2);

        kickProjectile.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        kickProjectile.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;

        // When projectile reaches target
        setTimeout(() => {
            // Create massive impact burst
            const impactBurst = document.createElement('div');
            impactBurst.className = 'throwkick-impact-burst';
            targetElement.appendChild(impactBurst);

            // Create shockwave explosion
            const shockwaveExplosion = document.createElement('div');
            shockwaveExplosion.className = 'throwkick-shockwave-explosion';
            targetElement.appendChild(shockwaveExplosion);

            // Add multiple shockwave rings
            for (let i = 0; i < 6; i++) {
                const shockwave = document.createElement('div');
                shockwave.className = 'throwkick-shockwave-ring';
                shockwave.style.animationDelay = `${i * 0.08}s`;
                shockwaveExplosion.appendChild(shockwave);
            }

            // Create energy explosion particles
            const energyExplosion = document.createElement('div');
            energyExplosion.className = 'throwkick-energy-explosion';
            targetElement.appendChild(energyExplosion);

            // Add explosion particles
            for (let i = 0; i < 24; i++) {
                const particle = document.createElement('div');
                particle.className = 'throwkick-explosion-particle';
                particle.style.transform = `rotate(${i * 15}deg)`;
                particle.style.animationDelay = `${i * 0.02}s`;
                energyExplosion.appendChild(particle);
            }

            // Screen shake for impact
            document.querySelector('.battle-container').classList.add('throwkick-impact-shake');
            setTimeout(() => {
                document.querySelector('.battle-container').classList.remove('throwkick-impact-shake');
            }, 500);

            // Cleanup projectile
            kickProjectile.remove();

            // Cleanup impact effects
            setTimeout(() => {
                impactBurst.remove();
                shockwaveExplosion.remove();
                energyExplosion.remove();
            }, 1500);

        }, duration);
    }

    static showThrowkickManaGainVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create mana restoration aura
        const manaAura = document.createElement('div');
        manaAura.className = 'throwkick-mana-aura';
        casterElement.appendChild(manaAura);

        // Create energy return particles
        const energyReturn = document.createElement('div');
        energyReturn.className = 'throwkick-energy-return';
        casterElement.appendChild(energyReturn);

        // Add energy return particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'throwkick-return-particle';
            particle.style.transform = `rotate(${i * 30}deg)`;
            particle.style.animationDelay = `${i * 0.05}s`;
            energyReturn.appendChild(particle);
        }

        // Create floating mana gain text
        const manaGainText = document.createElement('div');
        manaGainText.className = 'throwkick-mana-gain-text';
        manaGainText.textContent = '+3 AP';
        casterElement.appendChild(manaGainText);

        // Cleanup after animation
        setTimeout(() => {
            manaAura.remove();
            energyReturn.remove();
            manaGainText.remove();
        }, 1200);
    }

    static showChristieKickAnimation(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Add kick animation class to Christie
        casterElement.classList.add('christie-kick-animation');

        // Create power buildup effect around Christie
        const powerBuildup = document.createElement('div');
        powerBuildup.className = 'christie-kick-power-buildup';
        casterElement.appendChild(powerBuildup);

        // Create stance change effect
        const stanceEffect = document.createElement('div');
        stanceEffect.className = 'christie-kick-stance';
        casterElement.appendChild(stanceEffect);

        // Create energy focus lines
        const focusLines = document.createElement('div');
        focusLines.className = 'christie-kick-focus';
        casterElement.appendChild(focusLines);

        // Add focus line particles
        for (let i = 0; i < 8; i++) {
            const line = document.createElement('div');
            line.className = 'christie-kick-focus-line';
            line.style.transform = `rotate(${i * 45}deg)`;
            line.style.animationDelay = `${i * 0.05}s`;
            focusLines.appendChild(line);
        }

        // Create wind-up effect
        const windupEffect = document.createElement('div');
        windupEffect.className = 'christie-kick-windup';
        casterElement.appendChild(windupEffect);

        // Cleanup after animation
        setTimeout(() => {
            casterElement.classList.remove('christie-kick-animation');
            powerBuildup.remove();
            stanceEffect.remove();
            focusLines.remove();
            windupEffect.remove();
        }, 800);
    }
}

// Create the Kick ability using the Ability class
const atlanteanChristieKick = new Ability(
    'atlantean_christie_kick',
    'Kick',
    'Icons/abilities/kick.png',
    3, // Mana cost (ability points)
    1, // Cooldown
    kickEffect
).setDescription('Strike the target 3 times with devastating kicks, each dealing 112% Physical Damage. Each strike has a 25% chance to hit 1-4 additional enemies for 60% Physical Damage. Costs 3 ability points.')
 .setTargetType('enemy');

// Set the doesNotEndTurn property
atlanteanChristieKick.doesNotEndTurn = true;

// Create the Charming Kiss ability
const atlanteanChristieCharmingKiss = new Ability(
    'atlantean_christie_charming_kiss',
    'Charming Kiss',
    'Icons/abilities/charming_kiss.png',
    3, // Ability points cost
    8, // Cooldown
    charmingKissEffect
).setDescription('Blows an aquatic kiss at all enemies. Has 58% chance to hit each. Enemies hit get a debuff for 3 turns, making them take 75% more damage from Christie. When Christie hits enemies with this debuff, she gains back one Ability point.')
 .setTargetType('all_enemies');

// Set the doesNotEndTurn property
atlanteanChristieCharmingKiss.doesNotEndTurn = true;

// Create the Samba Slam ability
const atlanteanChristieSambaSlam = new Ability(
    'atlantean_christie_samba_slam',
    'Samba Slam',
    'Icons/abilities/samba_slam.png',
    1, // Ability points cost
    5, // Cooldown
    sambaSlamEffect
).setDescription('Performs a powerful samba-inspired slam attack that deals 300 + 100% Physical Damage. Has 100% stun chance for 2 turns if not dodged. Costs 1 ability point.')
 .setTargetType('enemy');

// Set the doesNotEndTurn property
atlanteanChristieSambaSlam.doesNotEndTurn = true;

// Create the Throwkick ability
const atlanteanChristieThrowkick = new Ability(
    'atlantean_christie_throwkick',
    'Throwkick',
    'Icons/abilities/throwkick.png',
    6, // Ability points cost
    1, // Cooldown
    throwkickEffect
).setDescription('Christie gains 50% physical damage and 30% lifesteal for this turn, then deals 315% of Physical Damage. If successful, Christie gains 3 ability points. Costs 6 ability points.')
 .setTargetType('enemy');

// Set the doesNotEndTurn property
atlanteanChristieThrowkick.doesNotEndTurn = true;

// Register abilities
if (typeof window !== 'undefined' && window.AbilityFactory) {
    window.AbilityFactory.registerAbilities([atlanteanChristieKick, atlanteanChristieCharmingKiss, atlanteanChristieSambaSlam, atlanteanChristieThrowkick]);
    console.log("[ATLANTEAN CHRISTIE ABILITIES] Registered abilities:", atlanteanChristieKick, atlanteanChristieCharmingKiss, atlanteanChristieSambaSlam, atlanteanChristieThrowkick);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AtlanteanChristieAbilities;
}

// Register the ability with the AbilityFactory
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities['atlantean_christie'] = {
    // ... existing abilities ...
    atlantean_christie_charming_kiss: charmingKissEffect
}; 