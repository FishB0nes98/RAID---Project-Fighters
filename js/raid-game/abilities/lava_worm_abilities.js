// Lava Worm Abilities File
// Contains custom ability implementations for the Lava Worm character

class LavaWormAbilities {
    static initialize() {
        if (window.AbilityFactory) {
            // Register the effect function directly using the ability's ID from lava_worm.json
            window.AbilityFactory.registerAbilityEffect('lava_worm_burrow_strike', this.burrowStrikeEffect);
            console.log('[Lava Worm] Burrow Strike ability registered.');
        } else {
            // Retry if the factory isn't ready
            console.warn('[Lava Worm] AbilityFactory not ready, retrying registration...');
            setTimeout(this.initialize.bind(this), 100);
        }
    }

    /**
     * This is the actual effect function for Burrow Strike.
     * It is called directly by the game engine when the ability is used.
     * @param {Character} caster - The character using the ability (Lava Worm).
     * @param {Character} target - The target of the ability (will be the caster, since targetType is 'self').
     * @param {Ability} abilityObject - The ability object instance containing properties from JSON.
     * @param {number} actualManaCost - The mana cost after modifiers.
     * @param {object} options - Additional options.
     */
    static burrowStrikeEffect(caster, target, abilityObject, actualManaCost, options = {}) {
        console.log('[Lava Worm] Executing Burrow Strike effect.', { caster: caster.name, ability: abilityObject.name });

        if (!window.gameManager) {
            console.error('GameManager not available for Burrow Strike');
            return;
        }

        // The ability data is in the abilityObject parameter
        const effectiveAbilityData = abilityObject;

        // Create the "Burrowed" buff
        const burrowedBuff = {
            id: 'burrowed_strike_buff',
            name: 'Burrowed',
            icon: 'Icons/abilities/burrow_strike.png', // Using the ability icon for the buff
            duration: effectiveAbilityData.bufferDuration || 1,
            description: 'Underground and untargetable. Will emerge next turn to strike.',
            type: 'buff',
            isTemporary: true,
            isUntargetable: true, // This makes the character untargetable
            onRemove: () => {
                // When the buff expires, perform the strike part of the ability
                LavaWormAbilities.performBurrowStrike(caster, effectiveAbilityData);
            }
        };

        // Apply the buff to the caster
        caster.addBuff(burrowedBuff);
        console.log(`[Lava Worm] Applied '${burrowedBuff.name}' buff to ${caster.name} for ${burrowedBuff.duration} turn(s).`);

        // Show VFX for burrowing
        LavaWormAbilities.showBurrowVFX(caster);

        // Log the action to the battle log
        window.gameManager.addLogEntry(`${caster.name} burrows underground, becoming untargetable!`, 'ability-use');

        // Statistics tracking (optional but good practice)
        if (window.StatisticsManager) {
            window.StatisticsManager.recordAbilityUsage(caster.id, effectiveAbilityData.id);
        }
    }

    static performBurrowStrike(caster, abilityData) {
        console.log(`[Lava Worm] ${caster.name} is emerging to perform Burrow Strike.`);
        if (!window.gameManager) {
            console.error('GameManager not available for Burrow Strike emergence');
            return;
        }

        const enemies = window.gameManager.getOpponents(caster);
        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());

        if (aliveEnemies.length === 0) {
            window.gameManager.addLogEntry(`${caster.name} emerges, but finds no enemies to strike!`, 'ability-use');
            return;
        }

        // Select a random enemy
        const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        console.log(`[Lava Worm] Target selected for strike: ${randomTarget.name}`);

        // Show emergence VFX
        LavaWormAbilities.showEmergeVFX(caster, randomTarget);

        // Apply damage after a delay for the VFX to play
        setTimeout(() => {
            const baseDamage = abilityData.baseDamage || 1255;
            const damage = caster.calculateDamage(baseDamage, 'physical', randomTarget);
            
            randomTarget.applyDamage(damage, 'physical', caster, { abilityId: abilityData.id });

            // Apply stun debuff
            const stunDebuff = {
                id: 'burrow_strike_stun',
                name: 'Stunned',
                icon: 'Icons/effects/stun.png',
                duration: abilityData.stunDuration || 1,
                description: 'Stunned by a devastating attack from underground.',
                type: 'debuff',
                isTemporary: true,
                effects: { cantAct: true }
            };
            randomTarget.addDebuff(stunDebuff);

            window.gameManager.addLogEntry(
                `${caster.name} erupts from the ground and strikes ${randomTarget.name} for ${damage} damage, stunning them!`, 
                'damage-dealt'
            );
        }, 800);
    }

    // --- Enhanced VFX Methods ---
    static showBurrowVFX(caster) {
        const characterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
        if (!characterElement) return;

        // Create enhanced burrow effect with multiple layers
        const burrowEffect = document.createElement('div');
        burrowEffect.className = 'enhanced-burrow-effect';
        burrowEffect.innerHTML = `
            <div class="ground-crack-pattern"></div>
            <div class="lava-eruption"></div>
            <div class="molten-particles"></div>
            <div class="heat-shimmer"></div>
            <div class="underground-glow"></div>
            <div class="magma-spray"></div>
            <div class="rock-debris"></div>
        `;

        characterElement.appendChild(burrowEffect);

        // Add enhanced CSS for the burrow effects
        if (!document.getElementById('enhanced-burrow-vfx-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-burrow-vfx-styles';
            style.textContent = `
                .enhanced-burrow-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10;
                    overflow: hidden;
                }

                .ground-crack-pattern {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 120px;
                    height: 60px;
                    transform: translateX(-50%);
                    background: 
                        linear-gradient(45deg, transparent 40%, #8B4513 42%, #8B4513 44%, transparent 46%),
                        linear-gradient(-45deg, transparent 40%, #654321 42%, #654321 44%, transparent 46%),
                        linear-gradient(90deg, transparent 45%, #A0522D 47%, #A0522D 49%, transparent 51%);
                    animation: crackFormation 1.2s ease-out;
                }

                .lava-eruption {
                    position: absolute;
                    bottom: 10%;
                    left: 50%;
                    width: 80px;
                    height: 80px;
                    transform: translateX(-50%);
                    background: radial-gradient(circle, 
                        #FF4500 0%, 
                        #FF6347 30%, 
                        #DC143C 60%, 
                        transparent 80%);
                    border-radius: 50%;
                    animation: lavaEruption 1.5s ease-out;
                }

                .molten-particles {
                    position: absolute;
                    bottom: 20%;
                    left: 50%;
                    width: 100px;
                    height: 100px;
                    transform: translateX(-50%);
                    animation: moltenSpark 1.8s ease-out;
                }

                .molten-particles::before,
                .molten-particles::after {
                    content: '';
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #FFD700, #FF4500);
                    border-radius: 50%;
                    animation: particleFly 1.5s ease-out infinite;
                }

                .molten-particles::before {
                    left: 20%;
                    animation-delay: 0.2s;
                }

                .molten-particles::after {
                    right: 20%;
                    animation-delay: 0.5s;
                }

                .heat-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 69, 0, 0.1) 25%,
                        rgba(255, 140, 0, 0.15) 50%,
                        rgba(255, 69, 0, 0.1) 75%,
                        transparent 100%
                    );
                    animation: heatShimmer 2s ease-in-out infinite;
                    filter: blur(1px);
                }

                .underground-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center bottom, 
                        rgba(255, 69, 0, 0.4) 0%, 
                        rgba(255, 140, 0, 0.3) 30%, 
                        rgba(220, 20, 60, 0.2) 60%,
                        transparent 80%);
                    animation: undergroundPulse 3s ease-in-out infinite alternate;
                }

                .magma-spray {
                    position: absolute;
                    bottom: 15%;
                    left: 50%;
                    width: 60px;
                    height: 60px;
                    transform: translateX(-50%);
                    background: conic-gradient(
                        from 0deg,
                        #FF4500 0deg,
                        #FFD700 90deg,
                        #DC143C 180deg,
                        #FF6347 270deg,
                        #FF4500 360deg
                    );
                    border-radius: 50%;
                    animation: magmaSpray 1.2s ease-out;
                    filter: blur(2px);
                }

                .rock-debris {
                    position: absolute;
                    bottom: 25%;
                    left: 50%;
                    width: 40px;
                    height: 40px;
                    transform: translateX(-50%);
                    background: 
                        radial-gradient(circle at 30% 30%, #8B4513 20%, transparent 21%),
                        radial-gradient(circle at 70% 20%, #654321 15%, transparent 16%),
                        radial-gradient(circle at 50% 70%, #A0522D 18%, transparent 19%);
                    animation: rockDebris 1.8s ease-out;
                }

                @keyframes crackFormation {
                    0% { 
                        opacity: 0; 
                        transform: translateX(-50%) scaleY(0);
                    }
                    50% { 
                        opacity: 1; 
                        transform: translateX(-50%) scaleY(0.7);
                    }
                    100% { 
                        opacity: 0.8; 
                        transform: translateX(-50%) scaleY(1);
                    }
                }

                @keyframes lavaEruption {
                    0% { 
                        transform: translateX(-50%) scale(0) translateY(50px);
                        opacity: 0;
                    }
                    30% { 
                        transform: translateX(-50%) scale(1.2) translateY(-10px);
                        opacity: 1;
                    }
                    70% { 
                        transform: translateX(-50%) scale(1.5) translateY(-20px);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.8) translateY(0px);
                        opacity: 0;
                    }
                }

                @keyframes moltenSpark {
                    0% { 
                        transform: translateX(-50%) scale(0);
                        opacity: 0;
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.5);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.5);
                        opacity: 0;
                    }
                }

                @keyframes particleFly {
                    0% { 
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    50% { 
                        transform: translateY(-30px) scale(1.2);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: translateY(-60px) scale(0.5);
                        opacity: 0;
                    }
                }

                @keyframes heatShimmer {
                    0%, 100% { 
                        transform: skew(0deg, 0deg);
                        opacity: 0.3;
                    }
                    50% { 
                        transform: skew(2deg, 1deg);
                        opacity: 0.6;
                    }
                }

                @keyframes undergroundPulse {
                    0% { 
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    100% { 
                        opacity: 0.6;
                        transform: scale(1.1);
                    }
                }

                @keyframes magmaSpray {
                    0% { 
                        transform: translateX(-50%) scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    40% { 
                        transform: translateX(-50%) scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scale(2) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes rockDebris {
                    0% { 
                        transform: translateX(-50%) translateY(0px) rotate(0deg);
                        opacity: 0;
                    }
                    30% { 
                        transform: translateX(-50%) translateY(-40px) rotate(90deg);
                        opacity: 1;
                    }
                    70% { 
                        transform: translateX(-50%) translateY(-60px) rotate(200deg);
                        opacity: 0.7;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(-80px) rotate(360deg);
                        opacity: 0;
                    }
                }

                .character[data-character-id="${caster.id}"] {
                    filter: brightness(0.6) sepia(0.4) hue-rotate(20deg);
                    transition: filter 1s ease;
                    transform: scale(0.95);
                    animation: sinkinMotion 2s ease-in-out;
                }

                @keyframes sinkinMotion {
                    0% { transform: scale(1) translateY(0px); }
                    50% { transform: scale(0.95) translateY(5px); }
                    100% { transform: scale(0.9) translateY(10px); }
                }
            `;
            document.head.appendChild(style);
        }

        // Enhanced character sinking effect
        characterElement.style.filter = 'brightness(0.6) sepia(0.4) hue-rotate(20deg)';
        characterElement.style.transform = 'scale(0.9) translateY(10px)';

        // Add screen rumble effect
        this.addScreenRumble();

        // Clean up effect after animation
        setTimeout(() => {
            if (burrowEffect.parentNode) {
                burrowEffect.remove();
            }
        }, 3000);
    }

    static showEmergeVFX(caster, target) {
        const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
        
        if (!casterElement || !targetElement) return;

        // Create spectacular emergence effect
        const emergeEffect = document.createElement('div');
        emergeEffect.className = 'spectacular-emerge-effect';
        emergeEffect.innerHTML = `
            <div class="ground-explosion"></div>
            <div class="lava-geyser"></div>
            <div class="shockwave-ring"></div>
            <div class="molten-projectiles"></div>
            <div class="flame-burst"></div>
            <div class="rock-explosion"></div>
            <div class="heat-distortion"></div>
            <div class="magma-trail"></div>
        `;

        casterElement.appendChild(emergeEffect);

        // Create impact effect on target
        const impactEffect = document.createElement('div');
        impactEffect.className = 'burrow-strike-impact';
        impactEffect.innerHTML = `
            <div class="impact-shockwave"></div>
            <div class="strike-particles"></div>
            <div class="damage-burst"></div>
            <div class="seismic-cracks"></div>
        `;

        targetElement.appendChild(impactEffect);

        // Add enhanced emergence CSS
        if (!document.getElementById('enhanced-emerge-vfx-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-emerge-vfx-styles';
            style.textContent = `
                .spectacular-emerge-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 15;
                    overflow: visible;
                }

                .ground-explosion {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 140px;
                    height: 140px;
                    transform: translateX(-50%);
                    background: radial-gradient(circle,
                        #FFD700 0%,
                        #FF4500 25%,
                        #DC143C 50%,
                        #8B0000 75%,
                        transparent 100%);
                    border-radius: 50%;
                    animation: groundExplosion 2s ease-out;
                    filter: blur(1px);
                }

                .lava-geyser {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 60px;
                    height: 200px;
                    transform: translateX(-50%);
                    background: linear-gradient(0deg,
                        #FF4500 0%,
                        #FFD700 30%,
                        #FF6347 60%,
                        #DC143C 80%,
                        transparent 100%);
                    border-radius: 30px 30px 0 0;
                    animation: lavaGeyser 2.2s ease-out;
                    filter: blur(2px);
                }

                .shockwave-ring {
                    position: absolute;
                    bottom: 20%;
                    left: 50%;
                    width: 80px;
                    height: 80px;
                    transform: translateX(-50%);
                    border: 8px solid #FF4500;
                    border-radius: 50%;
                    animation: shockwaveExpansion 1.8s ease-out;
                }

                .molten-projectiles {
                    position: absolute;
                    bottom: 30%;
                    left: 50%;
                    width: 120px;
                    height: 120px;
                    transform: translateX(-50%);
                    animation: moltenProjectiles 2.5s ease-out;
                }

                .molten-projectiles::before,
                .molten-projectiles::after {
                    content: '';
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: radial-gradient(circle, #FFD700, #FF4500, #DC143C);
                    border-radius: 50%;
                    animation: projectileFly 2s ease-out;
                }

                .molten-projectiles::before {
                    left: 10%;
                    top: 20%;
                    animation-delay: 0.1s;
                }

                .molten-projectiles::after {
                    right: 15%;
                    top: 30%;
                    animation-delay: 0.3s;
                }

                .flame-burst {
                    position: absolute;
                    bottom: 10%;
                    left: 50%;
                    width: 100px;
                    height: 100px;
                    transform: translateX(-50%);
                    background: conic-gradient(
                        from 0deg,
                        #FF4500 0deg,
                        #FFD700 60deg,
                        #FF6347 120deg,
                        #DC143C 180deg,
                        #FF4500 240deg,
                        #FFD700 300deg,
                        #FF4500 360deg
                    );
                    border-radius: 50%;
                    animation: flameBurst 1.5s ease-out;
                }

                .rock-explosion {
                    position: absolute;
                    bottom: 25%;
                    left: 50%;
                    width: 80px;
                    height: 80px;
                    transform: translateX(-50%);
                    background: 
                        radial-gradient(circle at 20% 20%, #8B4513 25%, transparent 26%),
                        radial-gradient(circle at 80% 30%, #654321 20%, transparent 21%),
                        radial-gradient(circle at 50% 80%, #A0522D 22%, transparent 23%),
                        radial-gradient(circle at 30% 60%, #8B4513 18%, transparent 19%);
                    animation: rockExplosion 2.3s ease-out;
                }

                .heat-distortion {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        45deg,
                        transparent 0%,
                        rgba(255, 69, 0, 0.2) 20%,
                        rgba(255, 140, 0, 0.3) 40%,
                        rgba(220, 20, 60, 0.2) 60%,
                        rgba(255, 69, 0, 0.1) 80%,
                        transparent 100%
                    );
                    animation: heatDistortion 2s ease-out;
                    filter: blur(3px);
                }

                .magma-trail {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 200px;
                    height: 40px;
                    transform: translateX(-50%);
                    background: linear-gradient(90deg,
                        transparent 0%,
                        #FF4500 20%,
                        #FFD700 40%,
                        #DC143C 60%,
                        #FF6347 80%,
                        transparent 100%);
                    border-radius: 20px;
                    animation: magmaTrail 2.8s ease-out;
                }

                .burrow-strike-impact {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 12;
                }

                .impact-shockwave {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 60px;
                    height: 60px;
                    transform: translate(-50%, -50%);
                    border: 6px solid #FFD700;
                    border-radius: 50%;
                    animation: impactShockwave 1.2s ease-out;
                }

                .strike-particles {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 80px;
                    height: 80px;
                    transform: translate(-50%, -50%);
                    background: 
                        radial-gradient(circle at 30% 30%, #FFD700 10%, transparent 11%),
                        radial-gradient(circle at 70% 20%, #FF4500 8%, transparent 9%),
                        radial-gradient(circle at 20% 70%, #DC143C 12%, transparent 13%),
                        radial-gradient(circle at 80% 80%, #FF6347 9%, transparent 10%);
                    animation: strikeParticles 1.8s ease-out;
                }

                .damage-burst {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100px;
                    height: 100px;
                    transform: translate(-50%, -50%);
                    background: radial-gradient(circle,
                        rgba(255, 215, 0, 0.8) 0%,
                        rgba(255, 69, 0, 0.6) 40%,
                        rgba(220, 20, 60, 0.4) 70%,
                        transparent 100%);
                    border-radius: 50%;
                    animation: damageBurst 1.5s ease-out;
                }

                .seismic-cracks {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 120px;
                    height: 60px;
                    transform: translateX(-50%);
                    background: 
                        linear-gradient(30deg, transparent 45%, #8B4513 47%, #8B4513 49%, transparent 51%),
                        linear-gradient(-30deg, transparent 45%, #654321 47%, #654321 49%, transparent 51%),
                        linear-gradient(80deg, transparent 47%, #A0522D 49%, #A0522D 51%, transparent 53%);
                    animation: seismicCracks 2s ease-out;
                }

                @keyframes groundExplosion {
                    0% { 
                        transform: translateX(-50%) scale(0);
                        opacity: 0;
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.5);
                        opacity: 1;
                    }
                    50% { 
                        transform: translateX(-50%) scale(2.2);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: translateX(-50%) scale(3);
                        opacity: 0;
                    }
                }

                @keyframes lavaGeyser {
                    0% { 
                        transform: translateX(-50%) scaleY(0);
                        opacity: 0;
                    }
                    30% { 
                        transform: translateX(-50%) scaleY(1.5);
                        opacity: 1;
                    }
                    70% { 
                        transform: translateX(-50%) scaleY(1.8);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: translateX(-50%) scaleY(0.5);
                        opacity: 0;
                    }
                }

                @keyframes shockwaveExpansion {
                    0% { 
                        transform: translateX(-50%) scale(0);
                        opacity: 1;
                        border-width: 8px;
                    }
                    70% { 
                        transform: translateX(-50%) scale(3);
                        opacity: 0.6;
                        border-width: 4px;
                    }
                    100% { 
                        transform: translateX(-50%) scale(5);
                        opacity: 0;
                        border-width: 1px;
                    }
                }

                @keyframes moltenProjectiles {
                    0% { 
                        transform: translateX(-50%) scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    30% { 
                        transform: translateX(-50%) scale(1.2) rotate(120deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scale(1.8) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes projectileFly {
                    0% { 
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                    50% { 
                        transform: scale(1.3) translateY(-80px);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: scale(0.7) translateY(-150px);
                        opacity: 0;
                    }
                }

                @keyframes flameBurst {
                    0% { 
                        transform: translateX(-50%) scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    40% { 
                        transform: translateX(-50%) scale(1.8) rotate(180deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scale(2.5) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes rockExplosion {
                    0% { 
                        transform: translateX(-50%) scale(0);
                        opacity: 0;
                    }
                    25% { 
                        transform: translateX(-50%) scale(1.5);
                        opacity: 1;
                    }
                    75% { 
                        transform: translateX(-50%) scale(2.2);
                        opacity: 0.7;
                    }
                    100% { 
                        transform: translateX(-50%) scale(3);
                        opacity: 0;
                    }
                }

                @keyframes heatDistortion {
                    0% { 
                        opacity: 0;
                        transform: skew(0deg);
                    }
                    30% { 
                        opacity: 0.6;
                        transform: skew(3deg);
                    }
                    70% { 
                        opacity: 0.4;
                        transform: skew(-2deg);
                    }
                    100% { 
                        opacity: 0;
                        transform: skew(0deg);
                    }
                }

                @keyframes magmaTrail {
                    0% { 
                        transform: translateX(-50%) scaleX(0);
                        opacity: 0;
                    }
                    40% { 
                        transform: translateX(-50%) scaleX(1.5);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scaleX(2);
                        opacity: 0;
                    }
                }

                @keyframes impactShockwave {
                    0% { 
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(4);
                        opacity: 0;
                    }
                }

                @keyframes strikeParticles {
                    0% { 
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2.5);
                        opacity: 0;
                    }
                }

                @keyframes damageBurst {
                    0% { 
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    40% { 
                        transform: translate(-50%, -50%) scale(1.8);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2.5);
                        opacity: 0;
                    }
                }

                @keyframes seismicCracks {
                    0% { 
                        transform: translateX(-50%) scaleY(0);
                        opacity: 0;
                    }
                    50% { 
                        transform: translateX(-50%) scaleY(1.2);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scaleY(1);
                        opacity: 0.7;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Restore caster appearance and add emergence effects
        casterElement.style.filter = 'brightness(1.2) saturate(1.5) hue-rotate(10deg)';
        casterElement.style.transform = 'scale(1.1)';
        casterElement.style.transition = 'all 0.5s ease';

        // Add intense screen shake for emergence
        this.addIntenseScreenShake();

        // Target impact effects
        targetElement.style.filter = 'brightness(1.5) saturate(2) contrast(1.3)';
        targetElement.style.transform = 'scale(1.05)';
        targetElement.style.transition = 'all 0.3s ease';

        // Clean up effects
        setTimeout(() => {
            if (emergeEffect.parentNode) emergeEffect.remove();
            if (impactEffect.parentNode) impactEffect.remove();
            
            // Restore character appearances
            casterElement.style.filter = '';
            casterElement.style.transform = '';
            targetElement.style.filter = '';
            targetElement.style.transform = '';
        }, 3500);
    }

    // --- Screen Shake Methods ---
    static addScreenRumble() {
        const gameContainer = document.querySelector('.raid-game-container') || document.body;
        
        // Add rumble CSS if not already present
        if (!document.getElementById('burrow-rumble-styles')) {
            const style = document.createElement('style');
            style.id = 'burrow-rumble-styles';
            style.textContent = `
                @keyframes groundRumble {
                    0%, 100% { transform: translateX(0); }
                    10% { transform: translateX(-2px) translateY(1px); }
                    20% { transform: translateX(2px) translateY(-1px); }
                    30% { transform: translateX(-1px) translateY(2px); }
                    40% { transform: translateX(1px) translateY(-2px); }
                    50% { transform: translateX(-2px) translateY(1px); }
                    60% { transform: translateX(2px) translateY(-1px); }
                    70% { transform: translateX(-1px) translateY(1px); }
                    80% { transform: translateX(1px) translateY(-1px); }
                    90% { transform: translateX(-1px) translateY(2px); }
                }
                
                .rumbling {
                    animation: groundRumble 1.5s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
        
        gameContainer.classList.add('rumbling');
        setTimeout(() => {
            gameContainer.classList.remove('rumbling');
        }, 1500);
    }

    static addIntenseScreenShake() {
        const gameContainer = document.querySelector('.raid-game-container') || document.body;
        
        // Add intense shake CSS if not already present
        if (!document.getElementById('emerge-shake-styles')) {
            const style = document.createElement('style');
            style.id = 'emerge-shake-styles';
            style.textContent = `
                @keyframes intenseEarthquake {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    5% { transform: translateX(-4px) translateY(2px); }
                    10% { transform: translateX(4px) translateY(-3px); }
                    15% { transform: translateX(-3px) translateY(4px); }
                    20% { transform: translateX(5px) translateY(-2px); }
                    25% { transform: translateX(-4px) translateY(3px); }
                    30% { transform: translateX(3px) translateY(-4px); }
                    35% { transform: translateX(-5px) translateY(2px); }
                    40% { transform: translateX(4px) translateY(-3px); }
                    45% { transform: translateX(-2px) translateY(5px); }
                    50% { transform: translateX(6px) translateY(-1px); }
                    55% { transform: translateX(-3px) translateY(3px); }
                    60% { transform: translateX(2px) translateY(-4px); }
                    65% { transform: translateX(-4px) translateY(1px); }
                    70% { transform: translateX(3px) translateY(-2px); }
                    75% { transform: translateX(-2px) translateY(3px); }
                    80% { transform: translateX(2px) translateY(-2px); }
                    85% { transform: translateX(-1px) translateY(2px); }
                    90% { transform: translateX(1px) translateY(-1px); }
                    95% { transform: translateX(-1px) translateY(1px); }
                }
                
                .intense-shaking {
                    animation: intenseEarthquake 2.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
        
        gameContainer.classList.add('intense-shaking');
        setTimeout(() => {
            gameContainer.classList.remove('intense-shaking');
        }, 2500);
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    LavaWormAbilities.initialize();
});

document.addEventListener('abilityFactoryReady', () => {
    LavaWormAbilities.initialize();
});