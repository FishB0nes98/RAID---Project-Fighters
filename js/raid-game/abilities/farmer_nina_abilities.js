/* =============================================================================
   FARMER NINA - SNIPER/STEALTH SPECIALIST - COMPLETE ABILITY REWORK
   Enhanced with detailed animations, VFX, and thematic consistency
============================================================================= */

// Core Farmer Nina abilities object
const FarmerNinaAbilities = {
    // Utility functions
    getCharacterElement: function(character) {
        const elementId = character.instanceId || character.id;
        return document.getElementById(`character-${elementId}`);
    },

    addLogEntry: function(message, type = '') {
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(message, type);
        } else {
            console.log(`[Nina] ${message}`);
        }
    },

    // Enhanced VFX system for Nina
    createVFXContainer: function(characterElement, className) {
        const container = document.createElement('div');
        container.className = `nina-vfx-container ${className}`;
        characterElement.appendChild(container);
        return container;
    },

    // =========================================================================
    // PASSIVE: EVASIVE ADAPTABILITY
    // =========================================================================
    updateEvasiveAdaptability: function(nina) {
        if (!nina || nina.id !== 'farmer_nina') return;

        const buffCount = nina.buffs ? nina.buffs.length : 0;
        const baseDodge = nina.baseStats ? nina.baseStats.dodgeChance : 0.03;
        const bonusDodge = buffCount * 0.05; // 5% per buff
        const newDodgeChance = baseDodge + bonusDodge;

        // Update stats
        nina.stats.dodgeChance = newDodgeChance;

        // Show visual indicator if dodge changed
        if (bonusDodge > 0) {
            this.showDodgeBoostVFX(nina, buffCount, Math.round(bonusDodge * 100));
        }

        console.log(`[Evasive Adaptability] ${nina.name} has ${buffCount} buffs, dodge chance: ${Math.round(newDodgeChance * 100)}%`);
    },

    showDodgeBoostVFX: function(nina, buffCount, dodgeBonus) {
        const charElement = this.getCharacterElement(nina);
        if (!charElement) return;

        // Remove existing indicators
        const existing = charElement.querySelector('.nina-passive-dodge-boost');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'nina-passive-dodge-boost';
        indicator.textContent = `+${dodgeBonus}% Dodge (${buffCount} buffs)`;
        charElement.appendChild(indicator);

        // Auto-remove after animation
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    },

    // =========================================================================
    // Q ABILITY: SNIPER SHOT
    // =========================================================================
    executeSniperShot: function(caster, target, abilityData) {
        this.addLogEntry(`${caster.name} aims carefully with Sniper Shot...`, 'ability-cast');

        // Phase 1: Scope and targeting
        this.showSniperScopeVFX(target, () => {
            // Phase 2: Shoot and apply damage
            this.executeSniperShotDamage(caster, target, abilityData);
        });
    },

    showSniperScopeVFX: function(target, callback) {
        const targetElement = this.getCharacterElement(target);
        if (!targetElement) {
            callback();
            return;
        }

        // Create scope overlay
        const scopeOverlay = document.createElement('div');
        scopeOverlay.className = 'sniper-scope-overlay';
        document.body.appendChild(scopeOverlay);

        // Position crosshair on target
        const targetRect = targetElement.getBoundingClientRect();
        const crosshair = document.createElement('div');
        crosshair.className = 'sniper-crosshair';
        crosshair.style.position = 'fixed';
        crosshair.style.left = `${targetRect.left + targetRect.width / 2}px`;
        crosshair.style.top = `${targetRect.top + targetRect.height / 2}px`;
        scopeOverlay.appendChild(crosshair);

        // Remove scope and continue after animation
        setTimeout(() => {
            scopeOverlay.remove();
            callback();
        }, 1200);
    },

    executeSniperShotDamage: function(caster, target, abilityData) {
        // Calculate damage
        const baseDamage = 400;
        const adScaling = Math.floor(caster.stats.physicalDamage * 0.5);
        const totalDamage = baseDamage + adScaling;

        // Show muzzle flash and bullet trail
        this.showSniperShotVFX(caster, target);

        // Apply damage after brief delay for VFX timing
        setTimeout(() => {
            const result = target.applyDamage(totalDamage, 'physical', caster, {
                abilityId: 'farmer_nina_q'
            });

            let message = `Sniper Shot deals ${result.damage} damage to ${target.name}`;
            if (result.isCritical) {
                message += ' (Critical Hit!)';
            }
            this.addLogEntry(message, result.isCritical ? 'critical' : 'damage');

            // Apply crit buff to Nina
            this.applySniperShotCritBuff(caster);

        }, 300);
    },

    showSniperShotVFX: function(caster, target) {
        const casterElement = this.getCharacterElement(caster);
        const targetElement = this.getCharacterElement(target);

        if (casterElement) {
            // Muzzle flash
            const muzzleFlash = document.createElement('div');
            muzzleFlash.className = 'sniper-muzzle-flash';
            casterElement.appendChild(muzzleFlash);

            setTimeout(() => muzzleFlash.remove(), 150);
        }

        if (casterElement && targetElement) {
            // Bullet trail
            const battleContainer = document.querySelector('.battle-container') || document.body;
            const bcRect = battleContainer.getBoundingClientRect();
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();

            const trail = document.createElement('div');
            trail.className = 'sniper-bullet-trail';

            // Calculate relative positions within battle container
            const startX = casterRect.left + casterRect.width / 2 - bcRect.left;
            const startY = casterRect.top + casterRect.height / 2 - bcRect.top;
            const endX = targetRect.left + targetRect.width / 2 - bcRect.left;
            const endY = targetRect.top + targetRect.height / 2 - bcRect.top;

            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

            trail.style.position = 'absolute';
            trail.style.left = `${startX}px`;
            trail.style.top = `${startY}px`;
            trail.style.width = `${distance}px`;
            trail.style.transformOrigin = 'left center';
            trail.style.transform = `rotate(${angle}deg)`;

            battleContainer.appendChild(trail);

            setTimeout(() => trail.remove(), 300);
        }
    },

    applySniperShotCritBuff: function(caster) {
        // Check for existing Sniper Focus buffs to determine stack count
        const existingBuffs = caster.buffs.filter(buff => buff.name === 'Sniper Focus');
        const stackCount = existingBuffs.length + 1;
        
        // Create unique ID for this stack
        const uniqueId = `sniper_shot_crit_boost_${Date.now()}_${Math.random()}`;
        
        // Create crit chance buff
        const critBuff = new Effect(
            uniqueId,
            'Sniper Focus',
            'Icons/abilities/sniper_shot.jpeg',
            3,
            null,
            false
        );

        critBuff.setDescription(`+20% crit chance for 3 turns (Stack ${stackCount})`);
        critBuff.statModifiers = [{
            stat: 'critChance',
            value: 0.20,
            operation: 'add'
        }];

        caster.addBuff(critBuff);

        // Show visual indicator
        this.showCritBuffIndicator(caster, stackCount);
        this.addLogEntry(`${caster.name} gains Sniper Focus (+20% crit chance, ${stackCount} stacks total)`, 'buff-effect');
    },

    showCritBuffIndicator: function(caster, stackCount) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) return;

        const indicator = document.createElement('div');
        indicator.className = 'sniper-crit-buff-indicator';
        indicator.textContent = stackCount > 1 ? `Sniper Focus x${stackCount}` : 'Sniper Focus';
        charElement.appendChild(indicator);

        setTimeout(() => indicator.remove(), 2000);
    },

    // =========================================================================
    // W ABILITY: HIDING (STEALTH)
    // =========================================================================
    executeHiding: function(caster, abilityData) {
        this.addLogEntry(`${caster.name} vanishes into the shadows...`, 'ability-cast');

        // Show stealth activation VFX
        this.showStealthActivationVFX(caster);

        // Apply stealth effects
        setTimeout(() => {
            this.applyStealthEffects(caster);
        }, 500);
    },

    showStealthActivationVFX: function(caster) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) return;

        // Stealth activation effect
        const activation = document.createElement('div');
        activation.className = 'nina-stealth-activation';
        charElement.appendChild(activation);

        // Create stealth particles
        const particleContainer = document.createElement('div');
        particleContainer.className = 'nina-stealth-particles';
        charElement.appendChild(particleContainer);

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'stealth-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 1}s`;
            particleContainer.appendChild(particle);
        }

        // Clean up after animation
        setTimeout(() => {
            activation.remove();
            particleContainer.remove();
        }, 1500);
    },

    applyStealthEffects: function(caster) {
        // Create untargetable buff
        const stealthBuff = new Effect(
            'nina_hiding_stealth',
            'Hiding',
            'Icons/abilities/hiding.jpeg',
            2,
            null,
            false
        );

        stealthBuff.setDescription('Untargetable by enemies for 2 turns. Regenerates 350 HP per turn.');
        stealthBuff.effects = {
            isUntargetableByEnemies: true
        };
        
        // Add healing as a stat modifier
        stealthBuff.statModifiers = [{
            stat: 'hpPerTurn',
            value: 350,
            operation: 'add'
        }];

        // Set stealth properties
        stealthBuff.onApply = (character) => {
            character._hidingActive = true;
            this.startStealthVisuals(character);
        };

        stealthBuff.onRemove = (character) => {
            delete character._hidingActive;
            this.endStealthVisuals(character);
        };

        // Add turn-based healing effect
        stealthBuff.onTurnStart = (character) => {
            if (character._hidingActive) {
                const healAmount = 350;
                character.heal(healAmount);
                this.addLogEntry(`${character.name} regenerates ${healAmount} HP while hidden`, 'heal');
            }
        };

        caster.addBuff(stealthBuff);
        this.addLogEntry(`${caster.name} becomes untargetable by enemies and starts regenerating`, 'buff-effect');
    },

    startStealthVisuals: function(caster) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) return;

        charElement.classList.add('nina-untargetable');

        // Add persistent shimmer effect
        const shimmer = document.createElement('div');
        shimmer.className = 'nina-stealth-shimmer';
        shimmer.id = `nina-shimmer-${caster.instanceId || caster.id}`;
        charElement.appendChild(shimmer);

        // Add regeneration pulses
        this.startRegenerationVFX(caster);
    },

    endStealthVisuals: function(caster) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) return;

        charElement.classList.remove('nina-untargetable');

        // Remove shimmer effect
        const shimmer = charElement.querySelector(`#nina-shimmer-${caster.instanceId || caster.id}`);
        if (shimmer) shimmer.remove();

        this.addLogEntry(`${caster.name} emerges from hiding`, 'system');
    },

    startRegenerationVFX: function(caster) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) return;

        const showRegenPulse = () => {
            if (!caster._hidingActive) return;

            const pulse = document.createElement('div');
            pulse.className = 'nina-regeneration-pulse';
            charElement.appendChild(pulse);

            setTimeout(() => pulse.remove(), 1500);

            // Schedule next pulse
            setTimeout(showRegenPulse, 1500);
        };

        showRegenPulse();
    },

    // =========================================================================
    // E ABILITY: TARGET LOCK
    // =========================================================================
    executeTargetLock: function(caster, target, abilityData) {
        this.addLogEntry(`${caster.name} locks onto ${target.name}...`, 'ability-cast');

        // Show targeting sequence
        this.showTargetLockVFX(caster, target, () => {
            this.applyTargetLockDebuff(caster, target);
        });
    },

    showTargetLockVFX: function(caster, target, callback) {
        const casterElement = this.getCharacterElement(caster);
        const targetElement = this.getCharacterElement(target);

        if (!targetElement) {
            callback();
            return;
        }

        // Target scanning effect
        const scanning = document.createElement('div');
        scanning.className = 'target-lock-scanning';
        targetElement.appendChild(scanning);

        // Add reticle
        const reticle = document.createElement('div');
        reticle.className = 'target-lock-reticle';
        targetElement.appendChild(reticle);

        // Optional targeting beam from caster to target
        if (casterElement) {
            this.createTargetingBeam(casterElement, targetElement);
        }

        // Complete targeting after animation
        setTimeout(() => {
            scanning.remove();
            reticle.remove();
            callback();
        }, 2000);
    },

    createTargetingBeam: function(casterElement, targetElement) {
        const battleContainer = document.querySelector('.battle-container') || document.body;
        const bcRect = battleContainer.getBoundingClientRect();
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const beam = document.createElement('div');
        beam.className = 'target-lock-beam';

        // Calculate relative positions within battle container
        const startX = casterRect.left + casterRect.width / 2 - bcRect.left;
        const startY = casterRect.top + casterRect.height / 2 - bcRect.top;
        const endX = targetRect.left + targetRect.width / 2 - bcRect.left;
        const endY = targetRect.top + targetRect.height / 2 - bcRect.top;

        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

        beam.style.position = 'absolute';
        beam.style.left = `${startX}px`;
        beam.style.top = `${startY}px`;
        beam.style.width = `${distance}px`;
        beam.style.height = '2px';
        beam.style.transformOrigin = 'left center';
        beam.style.transform = `rotate(${angle}deg)`;

        battleContainer.appendChild(beam);

        setTimeout(() => beam.remove(), 1000);
    },

    applyTargetLockDebuff: function(caster, target) {
        // Check for existing Target Lock stacks
        const existingLock = target.debuffs.find(d => d.id === 'farmer_nina_e_target_lock');
        let stackCount = 1;

        if (existingLock) {
            stackCount = (existingLock.stackCount || 1) + 1;
            // Remove existing to replace with new stacked version
            const index = target.debuffs.indexOf(existingLock);
            target.debuffs.splice(index, 1);
        }

        // Create new stacked debuff
        const targetLock = new Effect(
            'farmer_nina_e_target_lock',
            'Target Lock',
            'Icons/abilities/target_lock.jpeg',
            10,
            null,
            true
        );

        const damageBonus = 15 * stackCount;
        targetLock.setDescription(`Takes ${damageBonus}% more physical damage (${stackCount} stacks)`);
        targetLock.stackCount = stackCount;
        targetLock.isPermanent = true; // Prevent duration decay
        targetLock.effects = {
            damageAmpPercent: damageBonus
        };

        target.addDebuff(targetLock);

        // Show visual indicator
        this.showTargetLockIndicator(target, stackCount);

        this.addLogEntry(`${target.name} is marked with Target Lock (${stackCount} stacks, +${damageBonus}% damage)`, 'debuff-effect');
    },

    showTargetLockIndicator: function(target, stacks) {
        const charElement = this.getCharacterElement(target);
        if (!charElement) return;

        // Remove existing indicator
        const existing = charElement.querySelector('.target-lock-debuff-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'target-lock-debuff-indicator';
        indicator.textContent = stacks.toString();
        charElement.appendChild(indicator);
    },

    // =========================================================================
    // R ABILITY: PIERCING SHOT
    // =========================================================================
    executePiercingShot: function(caster, target, abilityData) {
        this.addLogEntry(`${caster.name} charges a devastating Piercing Shot...`, 'ability-cast');

        // Show charging sequence
        this.showPiercingShotCharge(caster, () => {
            this.executePiercingShotDamage(caster, target, abilityData);
        });
    },

    showPiercingShotCharge: function(caster, callback) {
        const charElement = this.getCharacterElement(caster);
        if (!charElement) {
            callback();
            return;
        }

        // Charging aura
        const charge = document.createElement('div');
        charge.className = 'piercing-shot-charge';
        charElement.appendChild(charge);

        // Energy buildup
        const energy = document.createElement('div');
        energy.className = 'piercing-shot-energy';
        charElement.appendChild(energy);

        setTimeout(() => {
            charge.remove();
            energy.remove();
            callback();
        }, 2000);
    },

    executePiercingShotDamage: function(caster, target, abilityData) {
        // Calculate armor-piercing damage
        const baseDamage = 750;
        const adScaling = Math.floor(caster.stats.physicalDamage * 2.5); // 250% AD
        const totalDamage = baseDamage + adScaling;

        // Show projectile
        this.showPiercingProjectile(caster, target);

        // Apply damage with armor bypass
        setTimeout(() => {
            const result = target.applyDamage(totalDamage, 'physical', caster, {
                bypassArmor: true,
                abilityId: 'farmer_nina_r'
            });

            // Show armor pierce effect
            this.showArmorPierceVFX(target);

            let message = `Piercing Shot pierces through armor, dealing ${result.damage} damage to ${target.name}`;
            if (result.isCritical) {
                message += ' (Critical Hit!)';
            }
            this.addLogEntry(message, result.isCritical ? 'critical' : 'damage');

        }, 400);
    },

    showPiercingProjectile: function(caster, target) {
        const casterElement = this.getCharacterElement(caster);
        const targetElement = this.getCharacterElement(target);

        if (!casterElement || !targetElement) return;

        const battleContainer = document.querySelector('.battle-container') || document.body;
        const bcRect = battleContainer.getBoundingClientRect();
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const projectile = document.createElement('div');
        projectile.className = 'piercing-shot-projectile';

        // Calculate relative positions within battle container
        const startX = casterRect.left + casterRect.width / 2 - bcRect.left;
        const startY = casterRect.top + casterRect.height / 2 - bcRect.top;
        const endX = targetRect.left + targetRect.width / 2 - bcRect.left;
        const endY = targetRect.top + targetRect.height / 2 - bcRect.top;

        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

        projectile.style.position = 'absolute';
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY - 40}px`; // Offset for projectile height
        projectile.style.transformOrigin = 'left center';
        projectile.style.transform = `rotate(${angle}deg)`;

        // Animate projectile travel
        let progress = 0;
        const animate = () => {
            progress += 0.05;
            if (progress <= 1) {
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                projectile.style.left = `${currentX}px`;
                projectile.style.top = `${currentY - 40}px`;
                requestAnimationFrame(animate);
            } else {
                projectile.remove();
            }
        };

        battleContainer.appendChild(projectile);
        animate();
    },

    showArmorPierceVFX: function(target) {
        const charElement = this.getCharacterElement(target);
        if (!charElement) return;

        const pierce = document.createElement('div');
        pierce.className = 'armor-pierce-effect';
        charElement.appendChild(pierce);

        setTimeout(() => pierce.remove(), 800);
    },

    // =========================================================================
    // TALENT: BULLET RAIN
    // =========================================================================
    executeBulletRain: function(nina) {
        if (!nina || !nina.enableBulletRain) return;

        this.addLogEntry(`${nina.name} unleashes Bullet Rain on all marked targets!`, 'talent-activation');

        // Find all enemies with Target Lock
        const enemies = nina.isAI ? 
            window.gameManager.gameState.playerCharacters : 
            window.gameManager.gameState.aiCharacters;

        const targetedEnemies = enemies.filter(enemy => 
            enemy && !enemy.isDead() && 
            enemy.debuffs.some(d => d.id === 'farmer_nina_e_target_lock')
        );

        if (targetedEnemies.length === 0) {
            this.addLogEntry('No targets with Target Lock found for Bullet Rain', 'system');
            return;
        }

        // Show bullet rain VFX
        this.showBulletRainVFX(targetedEnemies);

        // Apply damage after VFX delay
        setTimeout(() => {
            this.applyBulletRainDamage(nina, targetedEnemies);
        }, 800);
    },

    showBulletRainVFX: function(targets) {
        targets.forEach((target, index) => {
            const charElement = this.getCharacterElement(target);
            if (!charElement) return;

            // Stagger the effects slightly
            setTimeout(() => {
                // Storm effect
                const storm = document.createElement('div');
                storm.className = 'bullet-rain-storm';
                charElement.appendChild(storm);

                // Create multiple bullet tracers
                const container = document.createElement('div');
                container.className = 'bullet-rain-setup';
                charElement.appendChild(container);

                for (let i = 0; i < 12; i++) {
                    const tracer = document.createElement('div');
                    tracer.className = 'bullet-rain-tracer';
                    tracer.style.left = `${Math.random() * 120 - 10}%`;
                    tracer.style.top = `${-60 - Math.random() * 40}%`;
                    tracer.style.animationDelay = `${Math.random() * 0.6}s`;
                    container.appendChild(tracer);
                }

                // Clean up after animation
                setTimeout(() => {
                    storm.remove();
                    container.remove();
                }, 1500);

            }, index * 200);
        });
    },

    applyBulletRainDamage: function(nina, targets) {
        const baseDamage = Math.floor(nina.stats.physicalDamage * 0.25); // 25% AD per bullet

        targets.forEach(target => {
            const result = target.applyDamage(baseDamage, 'physical', nina, {
                abilityId: 'farmer_nina_bullet_rain'
            });

            let message = `Bullet Rain hits ${target.name} for ${result.damage} damage`;
            if (result.isCritical) {
                message += ' (Critical Hit!)';
            }
            this.addLogEntry(message, result.isCritical ? 'critical' : 'damage');
        });
    }
};

// ============================================================================= 
// GLOBAL FUNCTION EXPORTS (for compatibility with existing system)
// ============================================================================= 

// Sniper Shot (Q)
window.farmer_ninaSniperShotEffect = function(caster, target, abilityData) {
    FarmerNinaAbilities.executeSniperShot(caster, target, abilityData);
};

// Hiding (W) 
window.farmer_ninaHidingEffect = function(caster, abilityData) {
    FarmerNinaAbilities.executeHiding(caster, abilityData);
};

// Target Lock (E)
window.farmer_ninaTargetLockEffect = function(caster, target, abilityData) {
    FarmerNinaAbilities.executeTargetLock(caster, target, abilityData);
};

// Piercing Shot (R)
window.farmer_ninaPiercingShotEffect = function(caster, target, abilityData) {
    FarmerNinaAbilities.executePiercingShot(caster, target, abilityData);
};

// Passive: Evasive Adaptability
window.updateNinaDodgeFromBuffs = function(character) {
    FarmerNinaAbilities.updateEvasiveAdaptability(character);
};

// Legacy passive handler
window.applyfarmer_ninaPassive = function(caster, buff) {
    window.updateNinaDodgeFromBuffs(caster);
    return buff;
};

// Bullet Rain talent
window.executeBulletRain = function(nina) {
    FarmerNinaAbilities.executeBulletRain(nina);
};

// ============================================================================= 
// EVENT LISTENERS AND INITIALIZATION
// ============================================================================= 

// Initialize Nina-specific event handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Farmer Nina] Enhanced ability system loaded');

    // Hook into buff/debuff changes to update passive
    document.addEventListener('character:buff-added', function(event) {
        if (event.detail.character && event.detail.character.id === 'farmer_nina') {
            FarmerNinaAbilities.updateEvasiveAdaptability(event.detail.character);
        }
    });

    document.addEventListener('character:buff-removed', function(event) {
        if (event.detail.character && event.detail.character.id === 'farmer_nina') {
            FarmerNinaAbilities.updateEvasiveAdaptability(event.detail.character);
        }
    });

    // Hook into turn events for Bullet Rain talent
    document.addEventListener('turn:start', function(event) {
        if (window.gameManager && window.gameManager.gameState) {
            const nina = window.gameManager.gameState.playerCharacters.find(c => 
                c && c.id === 'farmer_nina' && c.appliedTalents && c.appliedTalents.includes('bullet_rain')
            );
            if (nina) {
                FarmerNinaAbilities.executeBulletRain(nina);
            }
        }
    });
});

// Expose the abilities object for external access
window.FarmerNinaAbilities = FarmerNinaAbilities;

// Register the abilities with AbilityFactory
if (window.AbilityFactory) {
    window.AbilityFactory.registerAbilityEffect('farmer_ninaSniperShotEffect', window.farmer_ninaSniperShotEffect);
    window.AbilityFactory.registerAbilityEffect('farmer_ninaHidingEffect', window.farmer_ninaHidingEffect);
    window.AbilityFactory.registerAbilityEffect('farmer_ninaTargetLockEffect', window.farmer_ninaTargetLockEffect);
    window.AbilityFactory.registerAbilityEffect('farmer_ninaPiercingShotEffect', window.farmer_ninaPiercingShotEffect);
}

console.log('[Farmer Nina] Complete ability rework loaded with enhanced VFX system');