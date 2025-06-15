// Cursed Lion Abilities - Infernal Beast Powers

// Global effect functions for registration
window.cursedLionInfernalRoarEffect = function(caster, target, options = {}) {
    // Validate the target
    if (!target || target.isDead() || !target.isEnemy(caster) || target.isUntargetable()) {
        if (window.gameManager) {
            window.gameManager.addLogEntry(`${caster.name}'s Infernal Roar echoes uselessly - no valid target!`, 'ability-use');
        }
        return;
    }

    // Use the provided target directly
    const randomTarget = target;

    // Show VFX
    CursedLionAbilities.showInfernalRoarVFX(caster, randomTarget);

    // Store which abilities were disabled for cleanup
    const disabledAbilities = [];
    
    // Disable all available abilities
    randomTarget.abilities.forEach((ability, index) => {
        if (ability && !ability.isDisabled) {
            ability.isDisabled = true;
            ability.disabledDuration = 1;
            disabledAbilities.push(ability.id);
        }
    });

    // Create silence debuff using Effect class (like Flower Bomb)
    const silenceDebuff = new Effect(
        'infernal_silence',
        'Infernal Silence',
        'Icons/debuffs/stun.png',
        1, // Duration: 1 turn
        (character) => {
            // This runs each turn the debuff is active (optional)
        },
        true // isDebuff = true
    );

    // Store which abilities were disabled for cleanup
    silenceDebuff.disabledAbilities = disabledAbilities;
    silenceDebuff.setDescription('All abilities are disabled by the cursed lion\'s roar.');

    // Define the remove function for the debuff
    silenceDebuff.remove = (character) => {
        // Re-enable all abilities that were disabled by this debuff
        silenceDebuff.disabledAbilities.forEach(abilityId => {
            const ability = character.abilities.find(a => a.id === abilityId);
            if (ability && ability.isDisabled && ability.disabledDuration <= 0) {
                ability.isDisabled = false;
                if (window.gameManager) {
                    window.gameManager.addLogEntry(
                        `${character.name}'s ${ability.name} is no longer silenced.`, 
                        'buff-expire'
                    );
                }
            }
        });
        
        // Update UI to reflect the changes
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character);
        }
        
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `${character.name} can use abilities again - the infernal silence fades.`, 
                'buff-expire'
            );
        }
    };

    // Apply the debuff to the target
    randomTarget.addDebuff(silenceDebuff.clone());

    // Battle log
    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `🦁 ${caster.name} unleashes an Infernal Roar! ${randomTarget.name} is silenced and cannot use abilities!`, 
            'ability-use'
        );
    }

    // Track ability usage for statistics
    if (window.StatisticsManager) {
        window.StatisticsManager.recordAbilityUsage(caster.id, 'infernal_roar', 'utility');
    }
};

window.cursedLionStompingEruptionEffect = function(caster, target, options = {}) {
    // Get all enemies from game manager for random targeting
    const gameManager = window.gameManager;
    if (!gameManager || !gameManager.gameState) {
        if (window.gameManager) {
            window.gameManager.addLogEntry(`${caster.name}'s Stomping Eruption finds no targets!`, 'ability-use');
        }
        return;
    }

    // Get all valid enemy targets from the opponent list
    const opponentList = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;
    const validTargets = opponentList.filter(char => 
        char && !char.isDead() && !char.isUntargetable()
    );

    if (validTargets.length === 0) {
        if (window.gameManager) {
            window.gameManager.addLogEntry(`${caster.name}'s Stomping Eruption finds no valid targets!`, 'ability-use');
        }
        return;
    }

    // Determine number of eruptions (3-6)
    const eruptionCount = Math.floor(Math.random() * 4) + 3; // 3-6

    // Show initial stomp VFX
    CursedLionAbilities.showStompInitiationVFX(caster);

    // Battle log
    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `🦁 ${caster.name} stomps the ground! ${eruptionCount} hellish eruptions emerge!`, 
            'ability-use'
        );
    }

    // Execute eruptions one by one with delays
    let eruptionIndex = 0;
    const executeNextEruption = () => {
        if (eruptionIndex >= eruptionCount) return;

        // Select random target from valid targets
        const availableTargets = validTargets.filter(char => !char.isDead());
        if (availableTargets.length === 0) return;

        const randomTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];

        // Show eruption VFX
        CursedLionAbilities.showEruptionVFX(randomTarget, eruptionIndex + 1);

        // Apply damage after VFX delay
        setTimeout(() => {
            if (!randomTarget.isDead()) {
                const damage = caster.calculateDamage(450, 'magical', randomTarget);
                const damageDealt = randomTarget.applyDamage(damage, 'magical', caster, { 
                    abilityId: 'stomping_eruption' 
                });

                // Track damage for statistics
                if (window.StatisticsManager && damageDealt > 0) {
                    window.StatisticsManager.recordDamageDealt(caster.id, 'stomping_eruption', damageDealt, 'magical');
                }

                // Battle log for each eruption
                if (window.gameManager) {
                    window.gameManager.addLogEntry(
                        `🌋 Eruption ${eruptionIndex + 1} hits ${randomTarget.name} for ${damageDealt} damage!`, 
                        'damage'
                    );
                }
            }

            eruptionIndex++;
            // Schedule next eruption
            if (eruptionIndex < eruptionCount) {
                setTimeout(executeNextEruption, 800);
            }
        }, 600);
    };

    // Track ability usage for statistics
    if (window.StatisticsManager) {
        window.StatisticsManager.recordAbilityUsage(caster.id, 'stomping_eruption', 'damage');
    }

    // Start the eruption sequence
    executeNextEruption();
};

class CursedLionAbilities {
    static initialize() {
        // Register effect functions first
        if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
            window.AbilityFactory.registerAbilityEffect('cursedLionInfernalRoarEffect', window.cursedLionInfernalRoarEffect);
            window.AbilityFactory.registerAbilityEffect('infernal_roar', window.cursedLionInfernalRoarEffect);
            
            window.AbilityFactory.registerAbilityEffect('cursedLionStompingEruptionEffect', window.cursedLionStompingEruptionEffect);
            window.AbilityFactory.registerAbilityEffect('stomping_eruption', window.cursedLionStompingEruptionEffect);
            
            console.log('[Cursed Lion Abilities] Registered effect functions');
        }

        // Register Cursed Lion abilities
        if (window.AbilityFactory) {
            const abilities = this.getAbilities();
            window.AbilityFactory.registerAbilities(abilities);
        }
    }

    static getAbilities() {
        return [
            this.createInfernalRoar(),
            this.createStompingEruption()
        ];
    }

    // Ability 1: Infernal Roar - Disables all abilities of 1 random enemy for 1 turn
    static createInfernalRoar() {
        return {
            id: 'infernal_roar',
            name: 'Infernal Roar',
            icon: 'Icons/abilities/infernal_roar.png',
            type: 'custom',
            manaCost: 50,
            cooldown: 2,
            targetType: 'enemy',
            functionName: 'cursedLionInfernalRoarEffect',
            description: 'Unleashes a terrifying roar that silences 1 random enemy, disabling all their abilities for 1 turn.'
        };
    }

    // Ability 2: Stomping Eruption - Creates 3-6 eruptions dealing 450 damage each
    static createStompingEruption() {
        return {
            id: 'stomping_eruption',
            name: 'Stomping Eruption',
            icon: 'Icons/abilities/stomping_eruption.png',
            type: 'custom',
            manaCost: 100,
            cooldown: 7,
            targetType: 'enemy',
            functionName: 'cursedLionStompingEruptionEffect',
            description: 'Stomps the ground creating 3-6 hellish eruptions under random enemies, each dealing 450 physical damage.'
        };
    }

    // VFX Methods
    static showInfernalRoarVFX(caster, target) {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!casterElement || !targetElement) return;

        // Create roar energy burst
        const roarBurst = document.createElement('div');
        roarBurst.className = 'infernal-roar-burst';
        casterElement.appendChild(roarBurst);

        // Create fire particles around caster
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'roar-fire-particle';
                particle.style.animationDelay = `${i * 0.1}s`;
                particle.style.transform = `rotate(${i * 30}deg)`;
                casterElement.appendChild(particle);

                setTimeout(() => particle.remove(), 2000);
            }, i * 50);
        }

        // Create sound wave ripples
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const soundWave = document.createElement('div');
                soundWave.className = 'roar-sound-wave';
                soundWave.style.animationDelay = `${i * 0.3}s`;
                casterElement.appendChild(soundWave);

                setTimeout(() => soundWave.remove(), 3000);
            }, i * 300);
        }

        // Create silence effect on target with energy disruption
        const silenceField = document.createElement('div');
        silenceField.className = 'silence-energy-field';
        targetElement.appendChild(silenceField);

        // Create disruption particles around target
        for (let i = 0; i < 8; i++) {
            const disruptionParticle = document.createElement('div');
            disruptionParticle.className = 'silence-disruption-particle';
            disruptionParticle.style.animationDelay = `${i * 0.2}s`;
            disruptionParticle.style.transform = `rotate(${i * 45}deg)`;
            targetElement.appendChild(disruptionParticle);

            setTimeout(() => disruptionParticle.remove(), 2500);
        }

        // Screen shake effect
        this.addRoarScreenShake();

        // Cleanup
        setTimeout(() => {
            roarBurst.remove();
            silenceField.remove();
        }, 3000);
    }

    static showStompInitiationVFX(caster) {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (!casterElement) return;

        // Create ground impact shockwave
        const shockwave = document.createElement('div');
        shockwave.className = 'stomp-shockwave';
        casterElement.appendChild(shockwave);

        // Create debris particles
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const debris = document.createElement('div');
                debris.className = 'stomp-debris-particle';
                debris.style.animationDelay = `${i * 0.1}s`;
                debris.style.left = `${Math.random() * 100}%`;
                debris.style.animationDuration = `${1.5 + Math.random() * 1}s`;
                casterElement.appendChild(debris);

                setTimeout(() => debris.remove(), 2500);
            }, i * 80);
        }

        // Create ground crack lines spreading outward
        for (let i = 0; i < 6; i++) {
            const crack = document.createElement('div');
            crack.className = 'ground-crack-line';
            crack.style.transform = `rotate(${i * 60}deg)`;
            crack.style.animationDelay = `${i * 0.2}s`;
            casterElement.appendChild(crack);

            setTimeout(() => crack.remove(), 2000);
        }

        // Create dust cloud
        const dustCloud = document.createElement('div');
        dustCloud.className = 'stomp-dust-cloud';
        casterElement.appendChild(dustCloud);

        // Screen shake for stomp
        this.addStompScreenShake();

        // Cleanup
        setTimeout(() => {
            shockwave.remove();
            dustCloud.remove();
        }, 2000);
    }

    static showEruptionVFX(target, eruptionNumber) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        // Create eruption warning effect
        const warningPulse = document.createElement('div');
        warningPulse.className = 'eruption-warning-pulse';
        targetElement.appendChild(warningPulse);

        // Create warning crack lines
        for (let i = 0; i < 4; i++) {
            const warningCrack = document.createElement('div');
            warningCrack.className = 'eruption-warning-crack';
            warningCrack.style.transform = `rotate(${i * 90}deg)`;
            targetElement.appendChild(warningCrack);
            
            setTimeout(() => warningCrack.remove(), 1200);
        }

        setTimeout(() => {
            warningPulse.remove();

            // Create eruption blast core
            const eruptionCore = document.createElement('div');
            eruptionCore.className = 'eruption-blast-core';
            eruptionCore.style.animationDelay = `${eruptionNumber * 0.1}s`;
            targetElement.appendChild(eruptionCore);

            // Create eruption pillar
            const eruptionPillar = document.createElement('div');
            eruptionPillar.className = 'eruption-pillar';
            eruptionPillar.style.animationDelay = `${eruptionNumber * 0.1}s`;
            targetElement.appendChild(eruptionPillar);

            // Create lava fountain particles
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const lavaParticle = document.createElement('div');
                    lavaParticle.className = 'lava-fountain-particle';
                    lavaParticle.style.animationDelay = `${i * 0.05}s`;
                    lavaParticle.style.left = `${45 + Math.random() * 10}%`;
                    lavaParticle.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
                    targetElement.appendChild(lavaParticle);

                    setTimeout(() => lavaParticle.remove(), 1200);
                }, i * 50);
            }

            // Create heat distortion waves
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const heatWave = document.createElement('div');
                    heatWave.className = 'eruption-heat-wave';
                    heatWave.style.animationDelay = `${i * 0.3}s`;
                    targetElement.appendChild(heatWave);

                    setTimeout(() => heatWave.remove(), 1800);
                }, i * 200);
            }

            // Create ground fissure with glowing cracks
            const fissure = document.createElement('div');
            fissure.className = 'ground-fissure-glow';
            targetElement.appendChild(fissure);

            // Create ember particles
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const ember = document.createElement('div');
                    ember.className = 'eruption-ember-particle';
                    ember.style.left = `${40 + Math.random() * 20}%`;
                    ember.style.animationDelay = `${i * 0.1}s`;
                    targetElement.appendChild(ember);

                    setTimeout(() => ember.remove(), 2000);
                }, i * 100);
            }

            // Create eruption shockwave
            const shockwave = document.createElement('div');
            shockwave.className = 'eruption-blast-shockwave';
            targetElement.appendChild(shockwave);

            // Add screen shake for each eruption
            this.addEruptionScreenShake();

            // Cleanup main eruption
            setTimeout(() => {
                eruptionCore.remove();
                eruptionPillar.remove();
                fissure.remove();
                shockwave.remove();
            }, 2500);

        }, 1000); // Warning delay
    }

    static addRoarScreenShake() {
        const gameBoard = document.querySelector('.game-board') || document.body;
        gameBoard.classList.add('roar-screen-shake');
        setTimeout(() => {
            gameBoard.classList.remove('roar-screen-shake');
        }, 800);
    }

    static addStompScreenShake() {
        const gameBoard = document.querySelector('.game-board') || document.body;
        gameBoard.classList.add('stomp-screen-shake');
        setTimeout(() => {
            gameBoard.classList.remove('stomp-screen-shake');
        }, 1200);
    }

    static addEruptionScreenShake() {
        const gameBoard = document.querySelector('.game-board') || document.body;
        gameBoard.classList.add('eruption-screen-shake');
        setTimeout(() => {
            gameBoard.classList.remove('eruption-screen-shake');
        }, 600);
    }
}

// Auto-initialize when the script loads
if (typeof window !== 'undefined') {
    // Wait for other systems to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => CursedLionAbilities.initialize(), 100);
        });
    } else {
        setTimeout(() => CursedLionAbilities.initialize(), 100);
    }

    // Also initialize when AbilityFactory becomes available
    const checkAndInitialize = () => {
        if (window.AbilityFactory) {
            CursedLionAbilities.initialize();
        } else {
            setTimeout(checkAndInitialize, 100);
        }
    };
    checkAndInitialize();
}

// Export for manual initialization if needed
window.CursedLionAbilities = CursedLionAbilities; 