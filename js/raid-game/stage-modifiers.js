class StageModifiersRegistry {
    constructor() {
        this.modifiers = new Map();
        this.initializeDefaultModifiers();
    }

    initializeDefaultModifiers() {
        // Burning Ground Modifier
        this.registerModifier({
            id: 'burning_ground',
            name: 'Burning Ground',
            description: 'The ground is ablaze with hellish flames! Player characters take fire damage at the start of each turn.',
            icon: '🔥',
            vfx: {
                type: 'burning_ground',
                particles: true,
                animation: 'hellish_inferno'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const damageAmount = modifier.effect?.value || 150;
                const damageType = modifier.effect?.damageType || 'fire';
                
                // Only target player characters for burning ground
                const targets = gameManager.gameState.playerCharacters;

                if (targets.length > 0) {
                    gameManager.addLogEntry(
                        `🔥 The burning ground erupts with flames!`, 
                        'stage-effect dramatic'
                    );
                }

                targets.forEach(character => {
                    if (!character.isDead()) {
                        character.applyDamage(damageAmount, damageType, null, { 
                            isStageEffect: true,
                            stageModifierName: modifier.name 
                        });
                        
                        gameManager.addLogEntry(
                            `${character.name} is scorched by the infernal flames for ${damageAmount} damage!`, 
                            'stage-effect damage'
                        );

                        // Create dramatic screen shake effect
                        this.createScreenShakeEffect();
                        
                        // Create fire eruption VFX on the character
                        this.createFireEruptionVFX(character);
                    }
                });
            }
        });

        // Healing Wind Modifier  
        this.registerModifier({
            id: 'healing_wind',
            name: 'Healing Wind',
            description: 'A gentle breeze carries healing energy across the battlefield.',
            icon: '🌬️',
            vfx: {
                type: 'healing_wind',
                particles: true,
                animation: 'floating_particles'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const healPercent = modifier.effect?.value || 0.01; // 1% by default
                const target = modifier.effect?.target || 'all';
                
                let targets = [];
                if (target === 'all') {
                    targets = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
                } else if (target === 'players') {
                    targets = gameManager.gameState.playerCharacters;
                } else if (target === 'enemies') {
                    targets = gameManager.gameState.aiCharacters;
                }

                targets.forEach(character => {
                    if (!character.isDead()) {
                        const healAmount = Math.floor(character.stats.maxHp * healPercent);
                        if (healAmount > 0) {
                            character.heal(healAmount, null, { 
                                isStageEffect: true,
                                stageModifierName: modifier.name 
                            });
                            gameManager.addLogEntry(
                                `${character.name} heals ${healAmount} HP from ${modifier.name}.`, 
                                'stage-effect heal'
                            );
                        }
                    }
                });
            }
        });

        // Heavy Rain Modifier
        this.registerModifier({
            id: 'its_raining_man',
            name: "It's raining man!",
            description: 'Heavy rain falls from the burning sky! All player characters heal HP each turn.',
            icon: '🌧️',
            vfx: {
                type: 'heavy_rain',
                particles: true,
                animation: 'falling_rain'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const healAmount = modifier.effect?.value || 100;
                
                gameManager.gameState.playerCharacters.forEach(character => {
                    if (!character.isDead()) {
                        character.heal(healAmount, null, { 
                            isStageEffect: true,
                            stageModifierName: modifier.name 
                        });
                        gameManager.addLogEntry(
                            `${character.name} heals ${healAmount} HP from the rain.`, 
                            'stage-effect heal'
                        );
                    }
                });
            }
        });

        // Frozen Ground Modifier
        this.registerModifier({
            id: 'frozen_ground',
            name: 'Frozen Ground',
            description: 'The ground is frozen solid! All characters move 25% slower.',
            icon: '❄️',
            vfx: {
                type: 'frozen_ground',
                particles: true,
                animation: 'ice_crystals'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                const speedReduction = modifier.effect?.value || 0.25;
                
                [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters].forEach(character => {
                    character.stats.speed *= (1 - speedReduction);
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.speedReduction = speedReduction;
                });
                
                gameManager.addLogEntry(
                    `All characters are slowed by the frozen ground.`, 
                    'stage-effect'
                );
            }
        });

        // Toxic Miasma Modifier
        this.registerModifier({
            id: 'toxic_miasma',
            name: 'Toxic Miasma',
            description: 'Poisonous gas fills the air! All characters take poison damage each turn.',
            icon: '☠️',
            vfx: {
                type: 'toxic_miasma',
                particles: true,
                animation: 'swirling_gas'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const poisonDamage = modifier.effect?.value || 75;
                
                [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters].forEach(character => {
                    if (!character.isDead()) {
                        character.applyDamage(poisonDamage, 'poison', null, { 
                            isStageEffect: true,
                            stageModifierName: modifier.name 
                        });
                        gameManager.addLogEntry(
                            `${character.name} takes ${poisonDamage} poison damage from ${modifier.name}.`, 
                            'stage-effect damage'
                        );
                    }
                });
            }
        });

        // Small Space Modifier
        this.registerModifier({
            id: 'small_space',
            name: 'Small Space',
            description: 'The confined space makes dodging impossible! All characters have their dodge chance reduced to 0.',
            icon: '🚪',
            onStageStart: (gameManager, stageManager, modifier) => {
                // Apply small space effect immediately when stage loads
                this.applySmallSpaceEffect(gameManager, modifier, true);
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                // Reapply small space effect at the start of every turn (in case something restored dodge chance)
                this.applySmallSpaceEffect(gameManager, modifier, false);
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Restore original dodge chance when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.originalDodgeChance !== undefined) {
                        character.stats.dodgeChance = character.originalDodgeChance;
                        delete character.originalDodgeChance;
                    }
                });
                
                gameManager.addLogEntry(
                    `Characters regain their ability to dodge outside the confined space.`, 
                    'stage-effect'
                );
            }
        });

        // Carried Medicines Modifier
        this.registerModifier({
            id: 'carried_medicines',
            name: 'Carried medicines',
            description: 'Medical supplies scattered around provide periodic mana recovery. Every fifth turn, restores 10% of maximum mana for player characters.',
            icon: '💊',
            onTurnStart: (gameManager, stageManager, modifier) => {
                // Initialize internal turn counter if it doesn't exist
                if (!modifier._internalTurnCounter) {
                    modifier._internalTurnCounter = 0;
                }
                
                // Increment our internal turn counter
                modifier._internalTurnCounter++;
                
                // Get game turn for comparison
                let currentTurn = gameManager.gameState?.currentTurn || gameManager.gameState?.turn || modifier._internalTurnCounter;
                
                // Debug logging
                console.log(`[Carried Medicines] Game turn: ${currentTurn}, Internal turn: ${modifier._internalTurnCounter}`);
                
                // Only trigger on multiples of 5 using our internal counter (5, 10, 15, 20...)
                if (modifier._internalTurnCounter % 5 === 0) {
                    const manaRestorePercent = 0.10; // Always 10% of max mana
                    
                    gameManager.addLogEntry(
                        `💊 The scattered medicines provide their healing energy!`, 
                        'stage-effect medicines'
                    );
                    
                    gameManager.gameState.playerCharacters.forEach(character => {
                        if (!character.isDead()) {
                            const manaRestoreAmount = Math.floor(character.stats.maxMana * manaRestorePercent);
                            
                            if (manaRestoreAmount > 0) {
                                const oldMana = character.stats.currentMana;
                                character.stats.currentMana = Math.min(character.stats.maxMana, character.stats.currentMana + manaRestoreAmount);
                                const actualManaRestored = character.stats.currentMana - oldMana;
                                
                                gameManager.addLogEntry(
                                    `${character.name} recovers ${actualManaRestored} mana from the medical supplies.`, 
                                    'stage-effect mana-restore'
                                );
                                
                                // Create medicine VFX on the character
                                this.createMedicineVFX(character, actualManaRestored);
                                
                                // Update character UI
                                if (typeof updateCharacterUI === 'function') {
                                    updateCharacterUI(character);
                                }
                            }
                        }
                    });
                }
            }
        });

        // Smoke Cloud Modifier
        this.registerModifier({
            id: 'smoke_cloud',
            name: 'Smoke Cloud',
            description: 'Dense smoke clouds the battlefield. Player abilities have a 21% chance to miss completely and go on cooldown.',
            icon: '☁️',
            vfx: {
                type: 'smoke_cloud',
                particles: true,
                animation: 'swirling_smoke'
            }
        });

        // Healing Fire Modifier
        this.registerModifier({
            id: 'healing_fire',
            name: 'Healing Fire',
            description: 'The infernal flames corrupt all healing! Whenever a player character heals, they take 22% of the heal amount as fire damage.',
            icon: '🔥💚',
            onStageStart: (gameManager, stageManager, modifier) => {
                // Mark all player characters with healing fire effect
                gameManager.gameState.playerCharacters.forEach(character => {
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.healingFire = true;
                });
                
                gameManager.addLogEntry(
                    `🔥💚 The infernal flames corrupt all healing energy! Healing will now burn...`, 
                    'stage-effect dramatic'
                );
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Remove healing fire effect when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.stageModifiers && character.stageModifiers.healingFire) {
                        delete character.stageModifiers.healingFire;
                    }
                });
                
                gameManager.addLogEntry(
                    `💚 The healing corruption fades away...`, 
                    'stage-effect'
                );
            }
        });
    }

    registerModifier(modifierData) {
        this.modifiers.set(modifierData.id, modifierData);
    }

    getModifier(id) {
        return this.modifiers.get(id);
    }

    getAllModifiers() {
        return this.modifiers;
    }

    processModifiers(gameManager, stageManager, phase = 'turnStart') {
        const activeModifiers = stageManager.getStageModifiers() || [];
        
        console.log(`[StageModifiers] Processing ${activeModifiers.length} modifiers for phase: ${phase}`);
        console.log(`[StageModifiers] Available registered modifiers:`, Array.from(this.modifiers.keys()));
        console.log(`[StageModifiers] Stage modifiers to process:`, activeModifiers.map(m => ({ id: m.id, name: m.name })));
        
        activeModifiers.forEach(modifier => {
            const registeredModifier = this.getModifier(modifier.id);
            
            if (registeredModifier) {
                try {
                    console.log(`[StageModifiers] Executing ${registeredModifier.name} (${modifier.id}) for ${phase}`);
                    
                    if (phase === 'turnStart' && registeredModifier.onTurnStart) {
                        registeredModifier.onTurnStart(gameManager, stageManager, modifier);
                    } else if (phase === 'stageStart' && registeredModifier.onStageStart) {
                        registeredModifier.onStageStart(gameManager, stageManager, modifier);
                    } else if (phase === 'turnEnd' && registeredModifier.onTurnEnd) {
                        registeredModifier.onTurnEnd(gameManager, stageManager, modifier);
                    } else if (phase === 'stageEnd' && registeredModifier.onStageEnd) {
                        registeredModifier.onStageEnd(gameManager, stageManager, modifier);
                    } else {
                        console.log(`[StageModifiers] No ${phase} handler for ${modifier.id}`);
                    }
                } catch (error) {
                    console.error(`[StageModifiers] Error processing modifier ${modifier.id}:`, error);
                }
            } else {
                console.warn(`[StageModifiers] Unknown modifier: ${modifier.id}. Available: ${Array.from(this.modifiers.keys()).join(', ')}`);
            }
        });
    }

    initializeVFX(stageManager) {
        const activeModifiers = stageManager.getStageModifiers() || [];
        
        activeModifiers.forEach(modifier => {
            const registeredModifier = this.getModifier(modifier.id);
            
            if (registeredModifier && registeredModifier.vfx) {
                this.createVFX(registeredModifier.vfx, modifier);
            }
        });
    }

    createVFX(vfxConfig, modifier) {
        const existingVFX = document.querySelector(`.stage-modifier-vfx[data-modifier="${modifier.id}"]`);
        if (existingVFX) {
            return; // VFX already exists
        }

        switch (vfxConfig.type) {
            case 'burning_ground':
                this.createBurningGroundVFX(modifier);
                break;
            case 'healing_wind':
                this.createHealingWindVFX(modifier);
                break;
            case 'heavy_rain':
                this.createHeavyRainVFX(modifier);
                break;
            case 'frozen_ground':
                this.createFrozenGroundVFX(modifier);
                break;
            case 'toxic_miasma':
                this.createToxicMiasmaVFX(modifier);
                break;
            case 'smoke_cloud':
                this.createSmokeCloudVFX(modifier);
                break;


            default:
                console.warn(`[StageModifiers] Unknown VFX type: ${vfxConfig.type}`);
        }
    }

    createBurningGroundVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx burning-ground-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create heat wave overlay
        const heatWave = document.createElement('div');
        heatWave.className = 'heat-wave-overlay';
        vfxContainer.appendChild(heatWave);
        
        // Create fire sparks/embers
        for (let i = 0; i < 80; i++) {
            const ember = document.createElement('div');
            ember.className = 'fire-ember';
            ember.style.left = Math.random() * 100 + '%';
            ember.style.animationDelay = Math.random() * 4 + 's';
            ember.style.animationDuration = (2 + Math.random() * 2) + 's';
            vfxContainer.appendChild(ember);
        }

        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created simplified burning ground VFX with heat wave and embers for ${modifier.name}`);
    }

    createScreenShakeEffect() {
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            battleContainer.classList.add('screen-shake');
            setTimeout(() => {
                battleContainer.classList.remove('screen-shake');
            }, 500);
        }
    }

    createFireEruptionVFX(character) {
        const charElement = document.getElementById(`character-${character.id}`);
        if (!charElement) return;

        const eruption = document.createElement('div');
        eruption.className = 'fire-eruption-vfx';
        
        // Create multiple fire bursts
        for (let i = 0; i < 12; i++) {
            const burst = document.createElement('div');
            burst.className = 'fire-burst';
            burst.style.left = (Math.random() * 100) + '%';
            burst.style.animationDelay = (Math.random() * 0.3) + 's';
            eruption.appendChild(burst);
        }

        charElement.appendChild(eruption);
        
        // Remove after animation
        setTimeout(() => {
            if (eruption.parentNode) {
                eruption.remove();
            }
        }, 1500);
    }

    createHealingWindVFX(modifier) {
        // Implementation for healing wind VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx healing-wind-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create wind particle effect
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'wind-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            vfxContainer.appendChild(particle);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }
    }

    createHeavyRainVFX(modifier) {
        // Implementation for heavy rain VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx rain-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create rain drops
        for (let i = 0; i < 100; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
            vfxContainer.appendChild(drop);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }
    }

    createFrozenGroundVFX(modifier) {
        // Implementation for frozen ground VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx frozen-ground-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create ice crystal effect
        for (let i = 0; i < 15; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'ice-crystal';
            crystal.style.left = Math.random() * 100 + '%';
            crystal.style.top = Math.random() * 100 + '%';
            crystal.style.animationDelay = Math.random() * 4 + 's';
            vfxContainer.appendChild(crystal);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }
    }

    createToxicMiasmaVFX(modifier) {
        // Implementation for toxic miasma VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx toxic-miasma-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create gas swirl effect
        for (let i = 0; i < 25; i++) {
            const gas = document.createElement('div');
            gas.className = 'toxic-gas';
            gas.style.left = Math.random() * 100 + '%';
            gas.style.top = Math.random() * 100 + '%';
            gas.style.animationDelay = Math.random() * 3 + 's';
            gas.style.animationDuration = (3 + Math.random() * 2) + 's';
            vfxContainer.appendChild(gas);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }
    }

    createCarriedMedicinesVFX(modifier) {
        // Implementation for carried medicines VFX - floating medical supplies
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx carried-medicines-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create floating medicine bottles and pills
        for (let i = 0; i < 15; i++) {
            const medicine = document.createElement('div');
            medicine.className = 'floating-medicine';
            medicine.style.left = Math.random() * 100 + '%';
            medicine.style.top = Math.random() * 100 + '%';
            medicine.style.animationDelay = Math.random() * 4 + 's';
            medicine.style.animationDuration = (4 + Math.random() * 2) + 's';
            
            // Add medicine icons randomly
            const icons = ['💊', '🧪', '💉', '🩹'];
            medicine.textContent = icons[Math.floor(Math.random() * icons.length)];
            
            vfxContainer.appendChild(medicine);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }
    }

    // Helper method to apply small space effect to all characters
    applySmallSpaceEffect(gameManager, modifier, isStageStart) {
        console.log(`[StageModifiers] applySmallSpaceEffect called - isStageStart: ${isStageStart}`);
        
        const allCharacters = [
            ...gameManager.gameState.playerCharacters,
            ...gameManager.gameState.aiCharacters
        ];

        console.log(`[StageModifiers] Found ${allCharacters.length} characters to process for Small Space`);
        
        let affectedCharacters = [];
        
        allCharacters.forEach(character => {
            if (!character.isDead()) {
                // Store original dodge chance if not already stored
                if (character.originalDodgeChance === undefined) {
                    character.originalDodgeChance = character.stats.dodgeChance || 0;
                    console.log(`[StageModifiers] Stored original dodge chance for ${character.name}: ${character.originalDodgeChance}`);
                }
                
                // Set dodge chance to 0
                if (character.stats.dodgeChance > 0) {
                    console.log(`[StageModifiers] Setting ${character.name}'s dodge chance from ${character.stats.dodgeChance} to 0`);
                    character.stats.dodgeChance = 0;
                    affectedCharacters.push(character.name);
                } else {
                    console.log(`[StageModifiers] ${character.name} already has 0 dodge chance`);
                }
            }
        });

        console.log(`[StageModifiers] Affected characters: ${affectedCharacters.join(', ')}`);

        // Add log entry
        if (isStageStart && affectedCharacters.length > 0) {
            gameManager.addLogEntry(
                `🚪 The cramped bathroom space prevents all dodging! All characters lose their ability to dodge.`, 
                'stage-effect'
            );
        } else if (!isStageStart && affectedCharacters.length > 0) {
            gameManager.addLogEntry(
                `🚪 The tight space continues to prevent dodging.`, 
                'stage-effect'
            );
        }
        
        // Update character UIs to reflect the stat change
        allCharacters.forEach(character => {
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(character);
            }
        });
    }

    createMedicineVFX(character, manaRestored) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;

        // Create mana restoration VFX on the character
        const medicineVfx = document.createElement('div');
        medicineVfx.className = 'medicine-restore-vfx';
        
        // Create mana restoration text
        const manaText = document.createElement('div');
        manaText.className = 'mana-restore-text';
        manaText.textContent = `+${manaRestored} MP`;
        manaText.style.color = '#4169E1'; // Royal blue for mana
        
        // Create floating medicine particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'medicine-particles';
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'medicine-particle';
            particle.textContent = '💊';
            particle.style.left = (40 + Math.random() * 20) + '%';
            particle.style.top = (40 + Math.random() * 20) + '%';
            particle.style.animationDelay = (Math.random() * 0.5) + 's';
            particlesContainer.appendChild(particle);
        }
        
        medicineVfx.appendChild(manaText);
        medicineVfx.appendChild(particlesContainer);
        charElement.appendChild(medicineVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (medicineVfx.parentNode) {
                medicineVfx.remove();
            }
        }, 2000);
    }

    createSmokeCloudVFX(modifier) {
        // Implementation for ULTRA HEAVY smoke cloud VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx smoke-cloud-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create DRAMATIC screen-covering smoke overlay with pulsing effect
        const smokeOverlay = document.createElement('div');
        smokeOverlay.className = 'heavy-smoke-overlay';
        smokeOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 30% 20%, rgba(40, 40, 40, 0.8) 0%, rgba(60, 60, 60, 0.6) 25%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(50, 50, 50, 0.7) 0%, rgba(70, 70, 70, 0.5) 30%, transparent 60%),
                radial-gradient(circle at 50% 50%, rgba(30, 30, 30, 0.9) 0%, rgba(45, 45, 45, 0.7) 40%, rgba(60, 60, 60, 0.4) 80%, transparent 100%);
            animation: dramaticSmokeSwirl 6s ease-in-out infinite alternate, smokePulse 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 8;
            filter: blur(1px);
        `;
        vfxContainer.appendChild(smokeOverlay);
        
        // Create MASSIVE billowing smoke clouds
        for (let i = 0; i < 25; i++) {
            const bigSmoke = document.createElement('div');
            bigSmoke.className = 'big-smoke-cloud';
            const size = 120 + Math.random() * 200; // 120-320px (much larger!)
            bigSmoke.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.7) 30%, rgba(60, 60, 60, 0.5) 60%, rgba(80, 80, 80, 0.3) 80%, transparent 100%);
                border-radius: 50%;
                left: ${Math.random() * 120 - 10}%;
                top: ${Math.random() * 120 - 10}%;
                animation: massiveSmokeSwirl ${2 + Math.random() * 3}s ease-in-out infinite alternate;
                animation-delay: ${Math.random() * 3}s;
                filter: blur(3px);
                opacity: ${0.6 + Math.random() * 0.4};
                z-index: 6;
            `;
            vfxContainer.appendChild(bigSmoke);
        }

        // Create THICK medium smoke wisps
        for (let i = 0; i < 40; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'smoke-wisp';
            const size = 50 + Math.random() * 100; // 50-150px (larger)
            smoke.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(25, 25, 25, 0.8) 0%, rgba(45, 45, 45, 0.6) 40%, rgba(65, 65, 65, 0.4) 70%, transparent 100%);
                border-radius: 50%;
                left: ${Math.random() * 130 - 15}%;
                top: ${Math.random() * 130 - 15}%;
                animation: thickSmokeFloat ${1.5 + Math.random() * 2.5}s linear infinite;
                animation-delay: ${Math.random() * 4}s;
                filter: blur(2px);
                opacity: ${0.5 + Math.random() * 0.4};
                z-index: 7;
            `;
            vfxContainer.appendChild(smoke);
        }

        // Create DENSE floating smoke particles
        for (let i = 0; i < 80; i++) {
            const particle = document.createElement('div');
            particle.className = 'smoke-particle';
            const size = 12 + Math.random() * 24; // 12-36px (larger particles)
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(35, 35, 35, ${0.4 + Math.random() * 0.5});
                border-radius: 50%;
                left: ${Math.random() * 110 - 5}%;
                top: ${Math.random() * 110 - 5}%;
                animation: denseSmokeParticleFloat ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                filter: blur(1px);
                z-index: 5;
            `;
            vfxContainer.appendChild(particle);
        }
        
        // Add LIGHTNING FLASHES through the smoke for extra drama
        for (let i = 0; i < 3; i++) {
            const lightning = document.createElement('div');
            lightning.className = 'smoke-lightning';
            lightning.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.1) 40%, rgba(200, 200, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
                animation: smokeLightning ${6 + Math.random() * 8}s ease-in-out infinite;
                animation-delay: ${Math.random() * 10}s;
                opacity: 0;
                z-index: 9;
                pointer-events: none;
            `;
            vfxContainer.appendChild(lightning);
        }

        // Add ENHANCED CSS animations
        if (!document.getElementById('smoke-cloud-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'smoke-cloud-styles';
            styleSheet.textContent = `
                @keyframes dramaticSmokeSwirl {
                    0% { transform: rotate(0deg) scale(1) translateX(0px); filter: blur(2px); opacity: 0.8; }
                    25% { transform: rotate(3deg) scale(1.15) translateX(20px); filter: blur(3px); opacity: 0.9; }
                    50% { transform: rotate(-2deg) scale(1.1) translateX(-15px); filter: blur(4px); opacity: 1; }
                    75% { transform: rotate(4deg) scale(0.95) translateX(10px); filter: blur(3px); opacity: 0.85; }
                    100% { transform: rotate(-1deg) scale(0.9) translateX(-5px); filter: blur(2px); opacity: 0.8; }
                }
                
                @keyframes smokePulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 0.8; transform: scale(1); }
                }
                
                @keyframes massiveSmokeSwirl {
                    0% { transform: scale(0.6) translateY(10px) rotate(0deg); opacity: 0.5; }
                    25% { transform: scale(1.3) translateY(-30px) rotate(8deg); opacity: 0.8; }
                    50% { transform: scale(1.1) translateY(-50px) rotate(-5deg); opacity: 0.9; }
                    75% { transform: scale(1.4) translateY(-20px) rotate(12deg); opacity: 0.7; }
                    100% { transform: scale(0.8) translateY(0px) rotate(-3deg); opacity: 0.6; }
                }
                
                @keyframes thickSmokeFloat {
                    0% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(0.8); opacity: 0.5; }
                    20% { transform: translateY(-40px) translateX(30px) rotate(72deg) scale(1.2); opacity: 0.8; }
                    40% { transform: translateY(-80px) translateX(-20px) rotate(144deg) scale(1); opacity: 0.6; }
                    60% { transform: translateY(-60px) translateX(40px) rotate(216deg) scale(1.3); opacity: 0.9; }
                    80% { transform: translateY(-100px) translateX(-10px) rotate(288deg) scale(0.9); opacity: 0.4; }
                    100% { transform: translateY(-140px) translateX(15px) rotate(360deg) scale(0.6); opacity: 0.2; }
                }
                
                @keyframes denseSmokeParticleFloat {
                    0% { transform: translateY(0px) translateX(0px) scale(1) rotate(0deg); opacity: 0.4; }
                    25% { transform: translateY(-50px) translateX(25px) scale(1.4) rotate(90deg); opacity: 0.7; }
                    50% { transform: translateY(-100px) translateX(-35px) scale(0.8) rotate(180deg); opacity: 0.5; }
                    75% { transform: translateY(-80px) translateX(45px) scale(1.2) rotate(270deg); opacity: 0.8; }
                    100% { transform: translateY(-160px) translateX(20px) scale(0.4) rotate(360deg); opacity: 0; }
                }
                
                @keyframes smokeLightning {
                    0% { opacity: 0; transform: scaleX(0); }
                    5% { opacity: 0.8; transform: scaleX(1); }
                    10% { opacity: 0; transform: scaleX(1); }
                    15% { opacity: 1; transform: scaleX(1); }
                    20% { opacity: 0; transform: scaleX(0); }
                    100% { opacity: 0; transform: scaleX(0); }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created ULTRA DRAMATIC smoke cloud VFX with ${145} particles + lightning for ${modifier.name}`);
    }

    createHealingFireVFX(modifier) {
        // Implementation for healing fire VFX - corrupted healing flames
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx healing-fire-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create corrupted healing overlay with pulsing effect
        const healingFireOverlay = document.createElement('div');
        healingFireOverlay.className = 'healing-fire-overlay';
        healingFireOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 25% 30%, rgba(255, 100, 100, 0.3) 0%, rgba(0, 255, 100, 0.2) 25%, transparent 50%),
                radial-gradient(circle at 75% 70%, rgba(0, 255, 100, 0.3) 0%, rgba(255, 100, 100, 0.2) 30%, transparent 60%),
                radial-gradient(circle at 50% 50%, rgba(255, 150, 0, 0.2) 0%, rgba(100, 255, 100, 0.3) 40%, rgba(255, 50, 50, 0.2) 80%, transparent 100%);
            animation: healingFirePulse 3s ease-in-out infinite alternate, healingFireSwirl 8s linear infinite;
            pointer-events: none;
            z-index: 3;
            filter: blur(2px);
        `;
        vfxContainer.appendChild(healingFireOverlay);
        
        // Create corrupted healing flames
        for (let i = 0; i < 20; i++) {
            const flame = document.createElement('div');
            flame.className = 'healing-fire-flame';
            const size = 30 + Math.random() * 60;
            flame.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(255, ${100 + Math.random() * 100}, 100, 0.8) 0%, rgba(100, 255, ${100 + Math.random() * 100}, 0.6) 40%, rgba(255, 150, 50, 0.4) 70%, transparent 100%);
                border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: healingFlameFloat ${2 + Math.random() * 3}s ease-in-out infinite alternate;
                animation-delay: ${Math.random() * 4}s;
                filter: blur(1px);
                z-index: 4;
            `;
            vfxContainer.appendChild(flame);
        }

        // Create healing/fire particles
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-fire-particle';
            const size = 8 + Math.random() * 16;
            const isHealing = Math.random() > 0.5;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${isHealing ? 
                    `rgba(100, 255, 150, ${0.6 + Math.random() * 0.4})` : 
                    `rgba(255, 100, 50, ${0.6 + Math.random() * 0.4})`};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: healingFireParticleFloat ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 6}s;
                z-index: 2;
            `;
            vfxContainer.appendChild(particle);
        }
        
        // Add CSS animations for healing fire
        if (!document.getElementById('healing-fire-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'healing-fire-styles';
            styleSheet.textContent = `
                @keyframes healingFirePulse {
                    0% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                    100% { opacity: 0.4; transform: scale(0.95); }
                }
                
                @keyframes healingFireSwirl {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes healingFlameFloat {
                    0% { 
                        transform: translateY(0px) scale(0.8) rotate(0deg); 
                        opacity: 0.6; 
                    }
                    50% { 
                        transform: translateY(-30px) scale(1.2) rotate(180deg); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translateY(-60px) scale(0.6) rotate(360deg); 
                        opacity: 0.3; 
                    }
                }
                
                @keyframes healingFireParticleFloat {
                    0% { 
                        transform: translateY(0px) translateX(0px) scale(1); 
                        opacity: 0.8; 
                    }
                    25% { 
                        transform: translateY(-40px) translateX(20px) scale(1.3); 
                        opacity: 1; 
                    }
                    50% { 
                        transform: translateY(-80px) translateX(-15px) scale(0.8); 
                        opacity: 0.6; 
                    }
                    75% { 
                        transform: translateY(-60px) translateX(30px) scale(1.1); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translateY(-120px) translateX(10px) scale(0.4); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created healing fire VFX with corrupted healing flames for ${modifier.name}`);
    }

    createHealingFireDamageVFX(character, damageAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;

        // Create healing fire damage VFX on the character
        const healingFireVfx = document.createElement('div');
        healingFireVfx.className = 'healing-fire-damage-vfx';
        healingFireVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
        `;
        
        // Create damage text with healing fire theme
        const damageText = document.createElement('div');
        damageText.className = 'healing-fire-damage-text';
        damageText.textContent = `-${damageAmount}`;
        damageText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24px;
            font-weight: bold;
            color: #ff6b6b;
            text-shadow: 
                0 0 10px rgba(100, 255, 100, 0.8),
                0 0 20px rgba(255, 100, 100, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.9);
            animation: healingFireDamageText 2.5s ease-out;
            z-index: 51;
        `;
        
        // Create corrupted healing burst around character
        const healingBurst = document.createElement('div');
        healingBurst.className = 'healing-fire-burst';
        healingBurst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(100, 255, 100, 0.8) 0%, rgba(255, 100, 100, 0.6) 30%, rgba(255, 150, 0, 0.4) 60%, transparent 100%);
            border-radius: 50%;
            animation: healingFireBurst 1.8s ease-out;
            z-index: 49;
        `;
        
        // Create swirling corruption particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'healing-fire-particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 48;
        `;
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-fire-corruption-particle';
            const size = 8 + Math.random() * 16;
            const startAngle = (i / 15) * 360;
            const isHealing = i % 3 === 0; // Mix of healing and fire particles
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${isHealing ? 
                    `radial-gradient(circle, rgba(100, 255, 150, 0.9) 0%, rgba(150, 255, 100, 0.6) 50%, transparent 100%)` : 
                    `radial-gradient(circle, rgba(255, 100, 50, 0.9) 0%, rgba(255, 150, 100, 0.6) 50%, transparent 100%)`};
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: healingFireCorruptionParticle ${1.5 + Math.random()}s ease-out;
                animation-delay: ${Math.random() * 0.8}s;
                z-index: 47;
            `;
            particle.style.setProperty('--start-angle', `${startAngle}deg`);
            particle.style.setProperty('--distance', `${60 + Math.random() * 40}px`);
            particlesContainer.appendChild(particle);
        }
        
        // Add CSS animations for healing fire damage VFX
        if (!document.getElementById('healing-fire-damage-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'healing-fire-damage-styles';
            styleSheet.textContent = `
                @keyframes healingFireDamageText {
                    0% { 
                        transform: translateX(-50%) scale(0.8) rotate(0deg); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.3) rotate(5deg); 
                        opacity: 1; 
                    }
                    40% { 
                        transform: translateX(-50%) scale(1.1) rotate(-2deg); 
                        opacity: 1; 
                    }
                    60% { 
                        transform: translateX(-50%) scale(1) rotate(0deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.9) rotate(0deg) translateY(-20px); 
                        opacity: 0; 
                    }
                }
                
                @keyframes healingFireBurst {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.3); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.1); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2); 
                        opacity: 0; 
                    }
                }
                
                @keyframes healingFireCorruptionParticle {
                    0% { 
                        transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(0px) scale(0.5); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 60deg)) translateX(calc(var(--distance) * 0.6)) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 180deg)) translateX(var(--distance)) scale(0.2); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        healingFireVfx.appendChild(damageText);
        healingFireVfx.appendChild(healingBurst);
        healingFireVfx.appendChild(particlesContainer);
        charElement.appendChild(healingFireVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (healingFireVfx.parentNode) {
                healingFireVfx.remove();
            }
        }, 3000);
        
        console.log(`[StageModifiers] Created healing fire damage VFX for ${character.name} with ${damageAmount} damage`);
    }

    createSmokeCloudMissVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;

        // Create dramatic smoke miss VFX on the character
        const smokeVfx = document.createElement('div');
        smokeVfx.className = 'smoke-miss-vfx';
        smokeVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        
        // Create dramatic screen flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'smoke-miss-flash';
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(80, 80, 80, 0.6) 0%, rgba(60, 60, 60, 0.4) 30%, transparent 70%);
            animation: smokeMissFlash 0.8s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(flashOverlay);
        
        // Create large miss text with dramatic styling
        const missText = document.createElement('div');
        missText.className = 'dramatic-miss-text';
        missText.textContent = 'OBSCURED!';
        missText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 28px;
            font-weight: bold;
            color: #ff6b6b;
            text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px rgba(80, 80, 80, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.9);
            animation: dramaticMissText 2s ease-out;
            z-index: 101;
        `;
        
        // Create intense smoke burst
        const smokeBurst = document.createElement('div');
        smokeBurst.className = 'smoke-burst-container';
        smokeBurst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            z-index: 99;
        `;
        
        // Create multiple layers of smoke burst
        for (let layer = 0; layer < 3; layer++) {
            const smokeBurstLayer = document.createElement('div');
            smokeBurstLayer.className = 'smoke-burst-layer';
            const layerSize = 150 + layer * 50;
            smokeBurstLayer.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${layerSize}px;
                height: ${layerSize}px;
                background: radial-gradient(circle, rgba(100, 100, 100, ${0.8 - layer * 0.2}) 0%, rgba(80, 80, 80, ${0.6 - layer * 0.15}) 30%, rgba(60, 60, 60, ${0.4 - layer * 0.1}) 60%, transparent 100%);
                border-radius: 50%;
                animation: smokeBurstExplosion ${1.5 + layer * 0.3}s ease-out;
                animation-delay: ${layer * 0.1}s;
                filter: blur(${2 + layer}px);
            `;
            smokeBurst.appendChild(smokeBurstLayer);
        }
        
        // Create swirling smoke particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'dramatic-smoke-particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 98;
        `;
        
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'dramatic-smoke-particle';
            const size = 15 + Math.random() * 30;
            const startAngle = (i / 25) * 360;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(120, 120, 120, 0.8) 0%, rgba(80, 80, 80, 0.6) 50%, transparent 100%);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: dramaticSmokeParticle ${2 + Math.random()}s ease-out;
                animation-delay: ${Math.random() * 0.5}s;
                filter: blur(1px);
                z-index: 97;
            `;
            particle.style.setProperty('--start-angle', `${startAngle}deg`);
            particle.style.setProperty('--distance', `${80 + Math.random() * 60}px`);
            particlesContainer.appendChild(particle);
        }
        
        // Add enhanced CSS animations for miss VFX
        if (!document.getElementById('smoke-miss-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'smoke-miss-styles';
            styleSheet.textContent = `
                @keyframes smokeMissFlash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                @keyframes dramaticMissText {
                    0% { 
                        transform: translateX(-50%) scale(0.5) rotate(0deg); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.3) rotate(5deg); 
                        opacity: 1; 
                    }
                    40% { 
                        transform: translateX(-50%) scale(1.1) rotate(-2deg); 
                        opacity: 1; 
                    }
                    60% { 
                        transform: translateX(-50%) scale(1) rotate(0deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.8) rotate(0deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes smokeBurstExplosion {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.2); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.2); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2.5); 
                        opacity: 0; 
                    }
                }
                
                @keyframes dramaticSmokeParticle {
                    0% { 
                        transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(0px) scale(0.3); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(calc(var(--distance) * 0.5)) scale(1); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 180deg)) translateX(var(--distance)) scale(0.1); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        smokeVfx.appendChild(missText);
        smokeVfx.appendChild(smokeBurst);
        smokeVfx.appendChild(particlesContainer);
        charElement.appendChild(smokeVfx);
        
        // Screen shake effect
        const battleContainer = document.querySelector('.battle-container') || document.body;
        battleContainer.style.animation = 'smokeScreenShake 0.6s ease-out';
        
        // Add screen shake animation if not exists
        if (!document.getElementById('smoke-screen-shake-styles')) {
            const shakeSheet = document.createElement('style');
            shakeSheet.id = 'smoke-screen-shake-styles';
            shakeSheet.textContent = `
                @keyframes smokeScreenShake {
                    0%, 100% { transform: translateX(0px) translateY(0px); }
                    10% { transform: translateX(-2px) translateY(-1px); }
                    20% { transform: translateX(2px) translateY(1px); }
                    30% { transform: translateX(-1px) translateY(2px); }
                    40% { transform: translateX(1px) translateY(-2px); }
                    50% { transform: translateX(-2px) translateY(1px); }
                    60% { transform: translateX(2px) translateY(-1px); }
                    70% { transform: translateX(-1px) translateY(-2px); }
                    80% { transform: translateX(1px) translateY(2px); }
                    90% { transform: translateX(-1px) translateY(-1px); }
                }
            `;
            document.head.appendChild(shakeSheet);
        }
        
        // Remove VFX after animation
        setTimeout(() => {
            if (smokeVfx.parentNode) {
                smokeVfx.remove();
            }
            if (flashOverlay.parentNode) {
                flashOverlay.remove();
            }
            battleContainer.style.animation = '';
        }, 3000);
        
        console.log(`[StageModifiers] Created dramatic smoke miss VFX for ${character.name}`);
    }

    clearAllVFX() {
        const allModifierVFX = document.querySelectorAll('.stage-modifier-vfx');
        allModifierVFX.forEach(vfx => vfx.remove());
    }
}

// Create global instance
window.stageModifiersRegistry = new StageModifiersRegistry(); 