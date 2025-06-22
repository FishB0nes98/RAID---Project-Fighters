// Abyssal Smash ability effect function
const abyssalSmashEffect = (caster, target, ability, actualManaCost, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    // Get all enemy targets
    const enemies = window.gameManager.getOpponents(caster);
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Abyssal Smash finds no valid targets!`, 'enemy-turn');
        return { doesNotEndTurn: false };
    }

    log(`${caster.name} channels the power of the abyss for a devastating smash!`, 'enemy-turn');

    // Show initial preparation VFX
    DarkLeviathanAbilities.showAbyssalSmashPrepVFX(caster);

    // Delay for preparation animation
    setTimeout(() => {
        // Show the massive smash wave VFX
        DarkLeviathanAbilities.showAbyssalSmashWaveVFX(caster);

        // Process each enemy with staggered timing
        enemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (enemy.isDead()) return;

                // Fixed 1000 damage to all enemies
                const damage = 1000;

                // Show impact VFX on each enemy
                DarkLeviathanAbilities.showAbyssalSmashImpactVFX(enemy, index);

                // Apply damage
                const damageResult = enemy.applyDamage(damage, 'physical', caster, { 
                    abilityId: 'dark_leviathan_abyssal_smash' 
                });

                if (damageResult.isDodged) {
                    log(`${enemy.name} dodges the abyssal smash!`, 'enemy-turn');
                } else {
                    const actualDamage = damageResult.damage || damageResult.actualDamage || damage;
                    const damageText = damageResult.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
                    log(`${caster.name}'s Abyssal Smash deals ${damageText} to ${enemy.name}!`, 'enemy-turn');
                }
            }, 800 + index * 150); // Stagger impacts
        });
    }, 1200); // Wait for preparation

    return { doesNotEndTurn: false };
};

// Tidal Splash ability effect function
const abyssalRegenEffect = (caster, target, ability, actualManaCost, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    log(`${caster.name} channels the regenerative power of the abyss!`, 'player-turn');

    // Show initial casting VFX
    DarkLeviathanAbilities.showAbyssalRegenCastVFX(caster);

    // Create the Abyssal Regen buff
    const abyssalRegenBuff = {
        id: 'abyssal_regen_buff',
        name: 'Abyssal Regen',
        icon: 'Icons/abilities/abyssal_regen.png',
        duration: 5,
        isDebuff: false,
        source: caster.id,
        description: 'HP regeneration increased to 425 per turn. The dark waters restore vitality.',
        statModifiers: [{
            stat: 'hpPerTurn',
            operation: 'set', // Set the HP regen to exactly 425
            value: 425
        }],
        onApply: function(character) {
            // Show ongoing regen VFX when buff is applied
            DarkLeviathanAbilities.showAbyssalRegenOngoingVFX(character);
        },
        onRemove: function(character) {
            // Clean up VFX when buff expires
            DarkLeviathanAbilities.removeAbyssalRegenVFX(character);
        }
    };

    // Apply the buff to the caster
    caster.addBuff(abyssalRegenBuff);

    log(`${caster.name} is surrounded by regenerative abyssal energy! HP regeneration set to 425 per turn for 5 turns.`, 'buff-effect');

    // Show buff application VFX
    setTimeout(() => {
        DarkLeviathanAbilities.showAbyssalRegenBuffVFX(caster);
    }, 800);

    return { doesNotEndTurn: true };
};

const tidalSplashEffect = (caster, target, ability, actualManaCost, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    // Get all enemy targets
    const enemies = window.gameManager.getOpponents(caster);
    if (!enemies || enemies.length === 0) {
        log(`${caster.name}'s Tidal Splash finds no valid targets!`, 'enemy-turn');
        return { doesNotEndTurn: false };
    }

    log(`${caster.name} moves the water in the cave, creating a massive tidal splash!`, 'enemy-turn');

    // Show initial water gathering VFX
    DarkLeviathanAbilities.showTidalSplashPrepVFX(caster);

    // Delay for preparation animation
    setTimeout(() => {
        // Show the tidal wave spreading across the battlefield
        DarkLeviathanAbilities.showTidalSplashWaveVFX(caster);

        let totalDamageDealt = 0;

        // Process each enemy with staggered timing
        enemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (enemy.isDead()) return;

                // 50-50 chance for either 755 damage or 400 damage (ignoring magical shield)
                const roll = Math.random();
                const isHighDamage = roll < 0.5;
                const damage = isHighDamage ? 755 : 400;
                const damageType = isHighDamage ? 'magical' : 'physical'; // Use physical for shield-ignoring damage

                log(`Tidal splash ${isHighDamage ? 'crashes powerfully' : 'splashes moderately'} into ${enemy.name}!`, 'enemy-turn');

                // Show splash impact VFX on each enemy
                DarkLeviathanAbilities.showTidalSplashImpactVFX(enemy, index, isHighDamage);

                // Apply damage - for shield-ignoring damage, we'll use a special option
                const damageOptions = { 
                    abilityId: 'dark_leviathan_tidal_splash',
                    ignoreShield: !isHighDamage // Ignore shield for the 400 damage variant
                };

                const damageResult = enemy.applyDamage(damage, damageType, caster, damageOptions);

                if (damageResult.isDodged) {
                    log(`${enemy.name} dodges the tidal splash!`, 'enemy-turn');
                } else {
                    const actualDamage = damageResult.damage || damageResult.actualDamage || damage;
                    totalDamageDealt += actualDamage;
                    
                    const damageText = damageResult.isCritical ? `${actualDamage} critical damage` : `${actualDamage} damage`;
                    const shieldText = damageOptions.ignoreShield ? ' (ignoring shield)' : '';
                    log(`${caster.name}'s Tidal Splash deals ${damageText}${shieldText} to ${enemy.name}!`, 'enemy-turn');
                }

                // If this is the last enemy, heal the Leviathan after a short delay
                if (index === enemies.length - 1) {
                    setTimeout(() => {
                        if (totalDamageDealt > 0) {
                            // Heal the Dark Leviathan for all damage dealt
                            const healResult = caster.heal(totalDamageDealt, caster, { 
                                abilityId: 'dark_leviathan_tidal_splash_heal' 
                            });
                            
                            log(`${caster.name} absorbs the displaced water, healing for ${totalDamageDealt} HP!`, 'enemy-turn');
                            
                            // Show healing VFX on the Leviathan
                            DarkLeviathanAbilities.showTidalSplashHealVFX(caster, totalDamageDealt);
                        }
                    }, 400);
                }
            }, 600 + index * 200); // Stagger splash impacts
        });
    }, 1000); // Wait for preparation

    return { doesNotEndTurn: false };
};

// Dark Leviathan Abilities VFX Class
class DarkLeviathanAbilities {

    static showAbyssalSmashPrepVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create dark energy buildup around the Leviathan
        const darkAura = document.createElement('div');
        darkAura.className = 'abyssal-smash-dark-aura';
        casterElement.appendChild(darkAura);

        // Create abyssal energy tendrils
        const tendrils = document.createElement('div');
        tendrils.className = 'abyssal-energy-tendrils';
        casterElement.appendChild(tendrils);

        // Add multiple energy tendrils
        for (let i = 0; i < 12; i++) {
            const tendril = document.createElement('div');
            tendril.className = 'abyssal-tendril';
            tendril.style.transform = `rotate(${i * 30}deg)`;
            tendril.style.animationDelay = `${i * 0.1}s`;
            tendrils.appendChild(tendril);
        }

        // Create power concentration effect
        const powerCore = document.createElement('div');
        powerCore.className = 'abyssal-power-core';
        casterElement.appendChild(powerCore);

        // Create dark particles swirling around
        const particleSwarm = document.createElement('div');
        particleSwarm.className = 'abyssal-particle-swarm';
        casterElement.appendChild(particleSwarm);

        // Add swirling dark particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'abyssal-particle';
            particle.style.animationDelay = `${Math.random() * 2}s`;
            particle.style.animationDuration = `${2 + Math.random() * 2}s`;
            particleSwarm.appendChild(particle);
        }

        // Cleanup after animation
        setTimeout(() => {
            darkAura.remove();
            tendrils.remove();
            powerCore.remove();
            particleSwarm.remove();
        }, 1200);
    }

    static showAbyssalSmashWaveVFX(caster) {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;

        // Create massive shockwave that spreads across the battlefield
        const shockwave = document.createElement('div');
        shockwave.className = 'abyssal-smash-shockwave';
        battleContainer.appendChild(shockwave);

        // Create dark energy wave
        const energyWave = document.createElement('div');
        energyWave.className = 'abyssal-energy-wave';
        battleContainer.appendChild(energyWave);

        // Create multiple expanding rings
        const waveRings = document.createElement('div');
        waveRings.className = 'abyssal-wave-rings';
        battleContainer.appendChild(waveRings);

        // Add multiple wave rings with staggered timing
        for (let i = 0; i < 6; i++) {
            const ring = document.createElement('div');
            ring.className = 'abyssal-wave-ring';
            ring.style.animationDelay = `${i * 0.1}s`;
            waveRings.appendChild(ring);
        }

        // Create battlefield darkening effect
        const darknessOverlay = document.createElement('div');
        darknessOverlay.className = 'abyssal-darkness-overlay';
        battleContainer.appendChild(darknessOverlay);

        // Screen shake for massive impact
        battleContainer.classList.add('abyssal-smash-shake');
        setTimeout(() => {
            battleContainer.classList.remove('abyssal-smash-shake');
        }, 1000);

        // Cleanup wave effects
        setTimeout(() => {
            shockwave.remove();
            energyWave.remove();
            waveRings.remove();
            darknessOverlay.remove();
        }, 2500);
    }

    static showAbyssalSmashImpactVFX(target, index) {
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!targetElement) return;

        // Create impact explosion on target
        const impactExplosion = document.createElement('div');
        impactExplosion.className = 'abyssal-impact-explosion';
        impactExplosion.style.animationDelay = `${index * 0.05}s`;
        targetElement.appendChild(impactExplosion);

        // Create dark energy burst
        const energyBurst = document.createElement('div');
        energyBurst.className = 'abyssal-energy-burst';
        targetElement.appendChild(energyBurst);

        // Add burst particles
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('div');
            particle.className = 'abyssal-burst-particle';
            particle.style.transform = `rotate(${i * 22.5}deg)`;
            particle.style.animationDelay = `${i * 0.02}s`;
            energyBurst.appendChild(particle);
        }

        // Create crushing force effect
        const crushingForce = document.createElement('div');
        crushingForce.className = 'abyssal-crushing-force';
        targetElement.appendChild(crushingForce);

        // Add force impact lines
        for (let i = 0; i < 8; i++) {
            const forceLine = document.createElement('div');
            forceLine.className = 'abyssal-force-line';
            forceLine.style.transform = `rotate(${i * 45}deg)`;
            forceLine.style.animationDelay = `${i * 0.03}s`;
            crushingForce.appendChild(forceLine);
        }

        // Create dark void effect
        const voidEffect = document.createElement('div');
        voidEffect.className = 'abyssal-void-effect';
        targetElement.appendChild(voidEffect);

        // Cleanup impact effects
        setTimeout(() => {
            impactExplosion.remove();
            energyBurst.remove();
            crushingForce.remove();
            voidEffect.remove();
        }, 1500);
    }

    // Tidal Splash VFX Methods
    static showTidalSplashPrepVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create water gathering aura around the Leviathan
        const waterAura = document.createElement('div');
        waterAura.className = 'tidal-splash-water-aura';
        casterElement.appendChild(waterAura);

        // Create water tendrils gathering energy
        const waterTendrils = document.createElement('div');
        waterTendrils.className = 'tidal-splash-water-tendrils';
        casterElement.appendChild(waterTendrils);

        // Add multiple water tendrils
        for (let i = 0; i < 16; i++) {
            const tendril = document.createElement('div');
            tendril.className = 'tidal-water-tendril';
            tendril.style.transform = `rotate(${i * 22.5}deg)`;
            tendril.style.animationDelay = `${i * 0.06}s`;
            waterTendrils.appendChild(tendril);
        }

        // Create water vortex effect
        const waterVortex = document.createElement('div');
        waterVortex.className = 'tidal-splash-vortex';
        casterElement.appendChild(waterVortex);

        // Create water particles swirling
        const waterParticles = document.createElement('div');
        waterParticles.className = 'tidal-splash-particles';
        casterElement.appendChild(waterParticles);

        // Add swirling water particles
        for (let i = 0; i < 24; i++) {
            const particle = document.createElement('div');
            particle.className = 'tidal-water-particle';
            particle.style.animationDelay = `${Math.random() * 1.5}s`;
            particle.style.animationDuration = `${1.5 + Math.random() * 1}s`;
            waterParticles.appendChild(particle);
        }

        // Create water surge preparation
        const surgePrepare = document.createElement('div');
        surgePrepare.className = 'tidal-surge-prepare';
        casterElement.appendChild(surgePrepare);

        // Cleanup after animation
        setTimeout(() => {
            waterAura.remove();
            waterTendrils.remove();
            waterVortex.remove();
            waterParticles.remove();
            surgePrepare.remove();
        }, 1000);
    }

    static showTidalSplashWaveVFX(caster) {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;

        // Create massive tidal wave that spreads across the battlefield
        const tidalWave = document.createElement('div');
        tidalWave.className = 'tidal-splash-wave';
        battleContainer.appendChild(tidalWave);

        // Create water energy wave
        const waterWave = document.createElement('div');
        waterWave.className = 'tidal-water-wave';
        battleContainer.appendChild(waterWave);

        // Create multiple expanding water rings
        const waveRings = document.createElement('div');
        waveRings.className = 'tidal-wave-rings';
        battleContainer.appendChild(waveRings);

        // Add multiple wave rings with staggered timing
        for (let i = 0; i < 8; i++) {
            const ring = document.createElement('div');
            ring.className = 'tidal-wave-ring';
            ring.style.animationDelay = `${i * 0.08}s`;
            waveRings.appendChild(ring);
        }

        // Create water splash overlay
        const splashOverlay = document.createElement('div');
        splashOverlay.className = 'tidal-splash-overlay';
        battleContainer.appendChild(splashOverlay);

        // Create water droplets falling
        const waterDroplets = document.createElement('div');
        waterDroplets.className = 'tidal-water-droplets';
        battleContainer.appendChild(waterDroplets);

        // Add water droplets
        for (let i = 0; i < 40; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'tidal-droplet';
            droplet.style.left = `${Math.random() * 100}%`;
            droplet.style.animationDelay = `${Math.random() * 2}s`;
            droplet.style.animationDuration = `${2 + Math.random() * 2}s`;
            waterDroplets.appendChild(droplet);
        }

        // Screen shake for tidal impact
        battleContainer.classList.add('tidal-splash-shake');
        setTimeout(() => {
            battleContainer.classList.remove('tidal-splash-shake');
        }, 800);

        // Cleanup wave effects
        setTimeout(() => {
            tidalWave.remove();
            waterWave.remove();
            waveRings.remove();
            splashOverlay.remove();
            waterDroplets.remove();
        }, 3000);
    }

    static showTidalSplashImpactVFX(target, index, isHighDamage) {
        const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);
        if (!targetElement) return;

        // Create splash impact based on damage type
        const splashType = isHighDamage ? 'powerful' : 'moderate';
        const impactSplash = document.createElement('div');
        impactSplash.className = `tidal-splash-impact ${splashType}`;
        impactSplash.style.animationDelay = `${index * 0.04}s`;
        targetElement.appendChild(impactSplash);

        // Create water burst
        const waterBurst = document.createElement('div');
        waterBurst.className = `tidal-water-burst ${splashType}`;
        targetElement.appendChild(waterBurst);

        // Add burst particles (more for high damage)
        const particleCount = isHighDamage ? 20 : 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `tidal-burst-particle ${splashType}`;
            particle.style.transform = `rotate(${i * (360 / particleCount)}deg)`;
            particle.style.animationDelay = `${i * 0.02}s`;
            waterBurst.appendChild(particle);
        }

        // Create water splash effect
        const splashEffect = document.createElement('div');
        splashEffect.className = `tidal-splash-effect ${splashType}`;
        targetElement.appendChild(splashEffect);

        // Add splash lines
        const splashLines = isHighDamage ? 12 : 8;
        for (let i = 0; i < splashLines; i++) {
            const splashLine = document.createElement('div');
            splashLine.className = `tidal-splash-line ${splashType}`;
            splashLine.style.transform = `rotate(${i * (360 / splashLines)}deg)`;
            splashLine.style.animationDelay = `${i * 0.03}s`;
            splashEffect.appendChild(splashLine);
        }

        // Create water impact ripples
        const rippleEffect = document.createElement('div');
        rippleEffect.className = `tidal-impact-ripples ${splashType}`;
        targetElement.appendChild(rippleEffect);

        // Add ripple rings
        for (let i = 0; i < 5; i++) {
            const ripple = document.createElement('div');
            ripple.className = `tidal-ripple-ring ${splashType}`;
            ripple.style.animationDelay = `${i * 0.1}s`;
            rippleEffect.appendChild(ripple);
        }

        // Cleanup impact effects
        setTimeout(() => {
            impactSplash.remove();
            waterBurst.remove();
            splashEffect.remove();
            rippleEffect.remove();
        }, 1800);
    }

    static showTidalSplashHealVFX(caster, healAmount) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create healing water absorption aura
        const healingAura = document.createElement('div');
        healingAura.className = 'tidal-healing-aura';
        casterElement.appendChild(healingAura);

        // Create water absorption streams
        const absorptionStreams = document.createElement('div');
        absorptionStreams.className = 'tidal-absorption-streams';
        casterElement.appendChild(absorptionStreams);

        // Add multiple absorption streams
        for (let i = 0; i < 12; i++) {
            const stream = document.createElement('div');
            stream.className = 'tidal-absorption-stream';
            stream.style.transform = `rotate(${i * 30}deg)`;
            stream.style.animationDelay = `${i * 0.05}s`;
            absorptionStreams.appendChild(stream);
        }

        // Create healing water particles
        const healingParticles = document.createElement('div');
        healingParticles.className = 'tidal-healing-particles';
        casterElement.appendChild(healingParticles);

        // Add healing particles
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('div');
            particle.className = 'tidal-healing-particle';
            particle.style.animationDelay = `${Math.random() * 1}s`;
            particle.style.animationDuration = `${1.5 + Math.random() * 1}s`;
            healingParticles.appendChild(particle);
        }

        // Create healing text indicator
        const healingText = document.createElement('div');
        healingText.className = 'tidal-healing-text';
        healingText.textContent = `+${healAmount} HP`;
        casterElement.appendChild(healingText);

        // Create rejuvenation glow
        const rejuvenationGlow = document.createElement('div');
        rejuvenationGlow.className = 'tidal-rejuvenation-glow';
        casterElement.appendChild(rejuvenationGlow);

        // Cleanup healing effects
        setTimeout(() => {
            healingAura.remove();
            absorptionStreams.remove();
            healingParticles.remove();
            healingText.remove();
            rejuvenationGlow.remove();
        }, 2000);
    }

    // Abyssal Regen VFX methods
    static showAbyssalRegenCastVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create dark energy gathering aura
        const darkEnergyAura = document.createElement('div');
        darkEnergyAura.className = 'abyssal-regen-cast-aura';
        casterElement.appendChild(darkEnergyAura);

        // Create abyssal energy tendrils
        const abyssalTendrils = document.createElement('div');
        abyssalTendrils.className = 'abyssal-regen-tendrils';
        casterElement.appendChild(abyssalTendrils);

        // Add energy tendrils
        for (let i = 0; i < 8; i++) {
            const tendril = document.createElement('div');
            tendril.className = 'abyssal-tendril';
            tendril.style.transform = `rotate(${i * 45}deg)`;
            tendril.style.animationDelay = `${i * 0.1}s`;
            abyssalTendrils.appendChild(tendril);
        }

        // Create dark water vortex
        const darkVortex = document.createElement('div');
        darkVortex.className = 'abyssal-regen-vortex';
        casterElement.appendChild(darkVortex);

        // Create swirling dark particles
        const darkParticles = document.createElement('div');
        darkParticles.className = 'abyssal-regen-particles';
        casterElement.appendChild(darkParticles);

        // Add swirling particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'abyssal-particle';
            particle.style.animationDelay = `${Math.random() * 2}s`;
            particle.style.animationDuration = `${2 + Math.random() * 2}s`;
            darkParticles.appendChild(particle);
        }

        // Cleanup cast effects
        setTimeout(() => {
            darkEnergyAura.remove();
            abyssalTendrils.remove();
            darkVortex.remove();
            darkParticles.remove();
        }, 800);
    }

    static showAbyssalRegenBuffVFX(caster) {
        const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
        if (!casterElement) return;

        // Create regenerative buff aura
        const buffAura = document.createElement('div');
        buffAura.className = 'abyssal-regen-buff-aura';
        buffAura.setAttribute('data-character-id', caster.id);
        casterElement.appendChild(buffAura);

        // Create energy absorption effect
        const energyAbsorption = document.createElement('div');
        energyAbsorption.className = 'abyssal-regen-absorption';
        buffAura.appendChild(energyAbsorption);

        // Add absorption streams
        for (let i = 0; i < 12; i++) {
            const stream = document.createElement('div');
            stream.className = 'abyssal-absorption-stream';
            stream.style.transform = `rotate(${i * 30}deg)`;
            stream.style.animationDelay = `${i * 0.08}s`;
            energyAbsorption.appendChild(stream);
        }
    }

    static showAbyssalRegenOngoingVFX(character) {
        const characterElement = document.querySelector(`.character-slot[data-character-id="${character.id}"]`);
        if (!characterElement) return;

        // Create persistent regeneration effect
        const ongoingRegen = document.createElement('div');
        ongoingRegen.className = 'abyssal-regen-ongoing';
        ongoingRegen.setAttribute('data-character-id', character.id);
        characterElement.appendChild(ongoingRegen);

        // Create pulsing regenerative aura
        const regenAura = document.createElement('div');
        regenAura.className = 'abyssal-regen-pulse-aura';
        ongoingRegen.appendChild(regenAura);

        // Create floating dark healing particles
        const healingParticles = document.createElement('div');
        healingParticles.className = 'abyssal-regen-heal-particles';
        ongoingRegen.appendChild(healingParticles);

        // Add continuously spawning healing particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'abyssal-heal-particle';
            particle.style.animationDelay = `${i * 0.3}s`;
            healingParticles.appendChild(particle);
        }

        // Create dark energy swirls
        const energySwirls = document.createElement('div');
        energySwirls.className = 'abyssal-regen-swirls';
        ongoingRegen.appendChild(energySwirls);

        // Add energy swirl effects
        for (let i = 0; i < 6; i++) {
            const swirl = document.createElement('div');
            swirl.className = 'abyssal-energy-swirl';
            swirl.style.animationDelay = `${i * 0.5}s`;
            energySwirls.appendChild(swirl);
        }
    }

    static removeAbyssalRegenVFX(character) {
        // Remove ongoing regen VFX
        const ongoingVFX = document.querySelector(`.abyssal-regen-ongoing[data-character-id="${character.id}"]`);
        if (ongoingVFX) {
            // Add fade out effect
            ongoingVFX.style.opacity = '0';
            ongoingVFX.style.transform = 'scale(0.8)';
            setTimeout(() => ongoingVFX.remove(), 500);
        }

        // Remove buff aura VFX
        const buffAura = document.querySelector(`.abyssal-regen-buff-aura[data-character-id="${character.id}"]`);
        if (buffAura) {
            // Add fade out effect
            buffAura.style.opacity = '0';
            buffAura.style.transform = 'scale(0.8)';
            setTimeout(() => buffAura.remove(), 500);
        }

        // Show buff expiration effect
        const characterElement = document.querySelector(`.character-slot[data-character-id="${character.id}"]`);
        if (characterElement) {
            const expirationEffect = document.createElement('div');
            expirationEffect.className = 'abyssal-regen-expiration';
            characterElement.appendChild(expirationEffect);

            // Add dispersing particles
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.className = 'abyssal-dispersion-particle';
                particle.style.transform = `rotate(${i * 24}deg)`;
                particle.style.animationDelay = `${i * 0.03}s`;
                expirationEffect.appendChild(particle);
            }

            setTimeout(() => expirationEffect.remove(), 1000);
        }
    }
}

// Create the Abyssal Smash ability
const darkLeviathanAbyssalSmash = new Ability(
    'dark_leviathan_abyssal_smash',
    'Abyssal Smash',
    'Icons/abilities/abyssal_slam.png',
    100, // No mana cost for boss abilities
    3, // 3 turn cooldown
    abyssalSmashEffect
).setDescription('Channels the power of the abyss to unleash a devastating smash that deals 1000 damage to ALL enemies. The sheer force of this attack cannot be dodged or reduced.')
 .setTargetType('all_enemies');

// Create the Tidal Splash ability
const darkLeviathanTidalSplash = new Ability(
    'dark_leviathan_tidal_splash',
    'Tidal Splash',
    'Icons/abilities/tidal_splash.png',
    100, // 100 mana cost
    1, // 1 turn cooldown
    tidalSplashEffect
).setDescription('Moves the water in the cave, splashing water to everyone. Each enemy has a 50% chance to take either 755 damage or 400 damage (ignoring magical shield). Dark Leviathan heals for all damage dealt.')
 .setTargetType('all_enemies');

// Create the Abyssal Regen ability
const darkLeviathanAbyssalRegen = new Ability(
    'dark_leviathan_abyssal_regen',
    'Abyssal Regen',
    'Icons/abilities/abyssal_regen.png',
    75, // 75 mana cost
    6, // 6 turn cooldown
    abyssalRegenEffect
).setDescription('Channels the regenerative power of the abyss, increasing HP regeneration to 425 per turn for 5 turns. The dark waters restore the leviathan\'s vitality.')
 .setTargetType('self');

// Set the doesNotEndTurn property for all abilities
darkLeviathanAbyssalRegen.doesNotEndTurn = true;

// Register abilities
if (typeof window !== 'undefined' && window.AbilityFactory) {
    window.AbilityFactory.registerAbilities([darkLeviathanAbyssalSmash, darkLeviathanTidalSplash, darkLeviathanAbyssalRegen]);
    console.log("[DARK LEVIATHAN ABILITIES] Registered abilities:", darkLeviathanAbyssalSmash, darkLeviathanTidalSplash, darkLeviathanAbyssalRegen);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkLeviathanAbilities;
}
