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

        // Healing Farm Wind Modifier (similar to healing wind but farm-themed)
        this.registerModifier({
            id: 'healing_farm_wind',
            name: 'Healing Farm Wind',
            description: 'A gentle breeze carries healing energy across the battlefield.',
            icon: '🌾',
            vfx: {
                type: 'healing_wind', // Reuse the same VFX as healing_wind
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

        // Atlantean Purification Modifier
        this.registerModifier({
            id: 'atlantean_purification',
            name: 'Atlantean Purification',
            description: 'The pure waters of Atlantis instantly cleanse all debuffs from characters at the start of each turn.',
            icon: '💧✨',
            vfx: {
                type: 'atlantean_purification',
                particles: true,
                animation: 'purifying_waters'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const allCharacters = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
                let totalDebuffsRemoved = 0;
                const affectedCharacters = [];
                
                allCharacters.forEach(character => {
                    if (!character.isDead() && character.debuffs.length > 0) {
                        const debuffCount = character.debuffs.length;
                        const debuffNames = character.debuffs.map(d => d.name || d.id).join(', ');
                        
                        // Remove all debuffs
                        character.debuffs.forEach(debuff => {
                            if (debuff.remove && typeof debuff.remove === 'function') {
                                debuff.remove(character);
                            }
                        });
                        character.debuffs = [];
                        
                        totalDebuffsRemoved += debuffCount;
                        affectedCharacters.push({ character, debuffCount, debuffNames });
                        
                        // Create purification VFX
                        this.createAtlanteanPurificationVFX(character);
                        
                        // Update UI
                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(character);
                        }
                    }
                });
                
                if (totalDebuffsRemoved > 0) {
                    gameManager.addLogEntry(
                        `💧✨ The pure waters of Atlantis cleanse all debuffs from the battlefield!`, 
                        'stage-effect positive'
                    );
                    
                    affectedCharacters.forEach(({ character, debuffCount, debuffNames }) => {
                        gameManager.addLogEntry(
                            `${character.name} is purified of ${debuffCount} debuff${debuffCount > 1 ? 's' : ''}: ${debuffNames}`, 
                            'stage-effect heal'
                        );
                    });
                    
                    // Create screen-wide purification effect
                    this.createAtlanteanPurificationScreenVFX();
                }
            }
        });

        // Tidal Wave Chaos Modifier
        this.registerModifier({
            id: 'tidal_wave_chaos',
            name: 'Tidal Wave Chaos',
            description: 'Every 6th turn, a massive tidal wave crashes across the battlefield! Each character has a 50% chance to either take 1000 damage or heal 1000 HP.',
            icon: '🌊💥',
            vfx: {
                type: 'tidal_wave_chaos',
                particles: true,
                animation: 'massive_wave'
            },
            turnCounter: 0,
            onTurnStart: (gameManager, stageManager, modifier) => {
                modifier.turnCounter = (modifier.turnCounter || 0) + 1;
                
                if (modifier.turnCounter % 6 === 0) {
                    const allCharacters = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
                    const livingCharacters = allCharacters.filter(char => !char.isDead());
                    
                    if (livingCharacters.length === 0) return;
                    
                    gameManager.addLogEntry(
                        `🌊💥 A massive tidal wave rises from the depths and crashes across the battlefield!`, 
                        'stage-effect dramatic'
                    );
                    
                    // Create massive wave VFX
                    this.createTidalWaveChaosBattlefieldVFX();
                    
                    // Clear all debuff VFX from the battlefield (wave washes them away)
                    this.clearAllDebuffVFX();
                    
                    // Add log entry about VFX being washed away
                    setTimeout(() => {
                        gameManager.addLogEntry(
                            `🌊 The powerful wave washes away all lingering effects from the battlefield!`, 
                            'stage-effect positive'
                        );
                    }, 800);
                    
                    // Process each character with a delay for dramatic effect
                    livingCharacters.forEach((character, index) => {
                        setTimeout(() => {
                            const isHeal = Math.random() < 0.5; // 50% chance
                            const amount = 1000;
                            
                            if (isHeal) {
                                character.heal(amount, null, { 
                                    isStageEffect: true,
                                    stageModifierName: modifier.name 
                                });
                                gameManager.addLogEntry(
                                    `🌊 The healing tide restores ${amount} HP to ${character.name}!`, 
                                    'stage-effect heal'
                                );
                                this.createTidalWaveHealVFX(character);
                            } else {
                                character.applyDamage(amount, 'water', null, { 
                                    isStageEffect: true,
                                    stageModifierName: modifier.name 
                                });
                                gameManager.addLogEntry(
                                    `💥 The crushing wave deals ${amount} damage to ${character.name}!`, 
                                    'stage-effect damage'
                                );
                                this.createTidalWaveDamageVFX(character);
                            }
                            
                            // Update UI
                            if (gameManager.uiManager) {
                                gameManager.uiManager.updateCharacterUI(character);
                            }
                        }, index * 200); // Stagger effects for dramatic impact
                    });
                }
            }
        });

        // Double Damage Modifier
        this.registerModifier({
            id: 'double_damage',
            name: 'Double Damage',
            description: 'The battlefield pulses with raw power! All physical and magical damage is doubled for all characters.',
            icon: '⚔️💥',
            vfx: {
                type: 'double_damage',
                particles: true,
                animation: 'power_surge'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    // Store original values
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.originalPhysicalDamage = character.stats.physicalDamage;
                    character.stageModifiers.originalMagicalDamage = character.stats.magicalDamage;
                    
                    // Double the damage
                    character.stats.physicalDamage *= 2;
                    character.stats.magicalDamage *= 2;
                    
                    // Also update base stats to ensure persistence
                    if (character.baseStats) {
                        character.baseStats.physicalDamage = character.baseStats.physicalDamage || character.stats.physicalDamage / 2;
                        character.baseStats.magicalDamage = character.baseStats.magicalDamage || character.stats.magicalDamage / 2;
                        character.baseStats.physicalDamage *= 2;
                        character.baseStats.magicalDamage *= 2;
                    }
                    
                    // Create power surge VFX
                    this.createDoubleDamageVFX(character);
                });

                gameManager.addLogEntry(
                    `⚔️💥 Raw power surges through the battlefield! All damage is doubled!`, 
                    'stage-effect dramatic'
                );
                
                // Create screen-wide VFX
                this.createDoubleDamageScreenVFX();
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.stageModifiers) {
                        // Restore original values
                        if (character.stageModifiers.originalPhysicalDamage !== undefined) {
                            character.stats.physicalDamage = character.stageModifiers.originalPhysicalDamage;
                        }
                        if (character.stageModifiers.originalMagicalDamage !== undefined) {
                            character.stats.magicalDamage = character.stageModifiers.originalMagicalDamage;
                        }
                        
                        // Also restore base stats
                        if (character.baseStats) {
                            character.baseStats.physicalDamage = character.stageModifiers.originalPhysicalDamage;
                            character.baseStats.magicalDamage = character.stageModifiers.originalMagicalDamage;
                        }
                        
                        // Clean up stored values
                        delete character.stageModifiers.originalPhysicalDamage;
                        delete character.stageModifiers.originalMagicalDamage;
                    }
                });
            }
        });

        // Cleansing Winds Modifier
        this.registerModifier({
            id: 'cleansing_winds',
            name: 'Cleansing Winds',
            description: 'Mystical winds sweep across the battlefield every 3rd turn, removing all buffs and debuffs from all characters.',
            icon: '🌪️✨',
            vfx: {
                type: 'cleansing_winds',
                particles: true,
                animation: 'swirling_winds'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                // Debug logging for turn counter
                console.log(`[CleansingWinds] Turn check: gameManager.turnCounter=${gameManager.turnCounter}, gameManager.gameState.turn=${gameManager.gameState.turn}`);
                
                // Use gameState.turn instead of turnCounter, and check if it's every 3rd turn (3, 6, 9, 12, etc.)
                const currentTurn = gameManager.gameState.turn || gameManager.turnCounter || 1;
                if (currentTurn % 3 === 0) {
                    const allCharacters = [
                        ...gameManager.gameState.playerCharacters,
                        ...gameManager.gameState.aiCharacters
                    ];

                    // Log the cleansing event
                    gameManager.addLogEntry(
                        `🌪️✨ Cleansing winds sweep across the battlefield on turn ${currentTurn}, purging all magical effects!`, 
                        'stage-effect dramatic'
                    );

                    // Remove all buffs and debuffs from all characters
                    allCharacters.forEach(character => {
                        if (!character.isDead()) {
                            const buffCount = character.buffs.length;
                            const debuffCount = character.debuffs.length;
                            
                            // Clear all buffs and debuffs
                            character.buffs = [];
                            character.debuffs = [];
                            
                            // Update character stats after clearing effects
                            character.recalculateStats('cleansing_winds');
                            
                            // Log individual cleansing effects
                            if (buffCount > 0 || debuffCount > 0) {
                                gameManager.addLogEntry(
                                    `${character.name} has ${buffCount} buffs and ${debuffCount} debuffs cleansed!`, 
                                    'stage-effect'
                                );
                            }

                            // Create VFX for the cleansing effect
                            this.createCleansingWindsVFX(character);
                        }
                    });

                    // Create screen-wide VFX
                    this.createCleansingWindsScreenVFX();
                }
            }
        });

        // Healing Disabled Modifier
        this.registerModifier({
            id: 'healing_disabled',
            name: 'Healing Disabled',
            description: 'A malevolent curse prevents all healing! No character can recover HP through any means.',
            icon: '🚫💚',
            vfx: {
                type: 'healing_disabled',
                particles: true,
                animation: 'dark_aura'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                // Mark all characters with healing disabled effect
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.healingDisabled = true;
                });
                
                gameManager.addLogEntry(
                    `🚫💚 A dark curse descends upon the battlefield! All healing is now impossible...`, 
                    'stage-effect dramatic'
                );

                // Create visual effect
                this.createHealingDisabledVFX(modifier);
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Remove healing disabled effect when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.stageModifiers && character.stageModifiers.healingDisabled) {
                        delete character.stageModifiers.healingDisabled;
                    }
                });
                
                gameManager.addLogEntry(
                    `💚 The healing curse lifts... healing is restored!`, 
                    'stage-effect'
                );

                // Clear VFX
                this.clearHealingDisabledVFX();
            }
        });

        // Icy Preservation Modifier
        this.registerModifier({
            id: 'icy_preservation',
            name: 'Icy Preservation',
            description: 'The ancient ice magic slows all combat. All characters have their speed reduced by 25%, but gain 15% magical shield to resist the harsh cold.',
            icon: '❄️',
            vfx: {
                type: 'icy_preservation',
                particles: true,
                animation: 'ice_crystals'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                const speedReduction = 0.25; // 25% speed reduction
                const magicalShieldBonus = 0.15; // 15% magical shield bonus
                
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    // Store original values for restoration
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.originalSpeed = character.stats.speed;
                    character.stageModifiers.originalMagicalShield = character.stats.magicalShield;
                    
                    // Apply speed reduction
                    character.stats.speed = Math.floor(character.stats.speed * (1 - speedReduction));
                    
                    // Apply magical shield bonus
                    const shieldBonus = Math.floor(character.stats.magicalShield * magicalShieldBonus);
                    character.stats.magicalShield = character.stats.magicalShield + shieldBonus;
                    
                    // Also update baseStats to preserve through recalculation
                    if (character.baseStats) {
                        character.baseStats.speed = character.stats.speed;
                        character.baseStats.magicalShield = character.stats.magicalShield;
                    }
                });
                
                gameManager.addLogEntry(
                    `❄️ The ancient ice magic preserves all combatants! Speed reduced, magical resistance increased.`, 
                    'stage-effect dramatic'
                );

                // Create visual effect
                this.createIcyPreservationVFX(modifier);
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Restore original values when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.stageModifiers) {
                        if (character.stageModifiers.originalSpeed !== undefined) {
                            character.stats.speed = character.stageModifiers.originalSpeed;
                            if (character.baseStats) {
                                character.baseStats.speed = character.stageModifiers.originalSpeed;
                            }
                            delete character.stageModifiers.originalSpeed;
                        }
                        
                        if (character.stageModifiers.originalMagicalShield !== undefined) {
                            character.stats.magicalShield = character.stageModifiers.originalMagicalShield;
                            if (character.baseStats) {
                                character.baseStats.magicalShield = character.stageModifiers.originalMagicalShield;
                            }
                            delete character.stageModifiers.originalMagicalShield;
                        }
                    }
                });
                
                gameManager.addLogEntry(
                    `❄️ The icy preservation fades as the battle ends.`, 
                    'stage-effect'
                );

                // Clear VFX
                this.clearIcyPreservationVFX();
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

        // Enchanted Weapon Modifier
        this.registerModifier({
            id: 'enchanted_weapon',
            name: 'Enchanted Weapon',
            description: 'The demonic forge\'s magic empowers enemy weapons. Every 5th turn, enemy physical damage increases by 15%.',
            icon: '⚔️',
            onStageStart: (gameManager, stageManager, modifier) => {
                // Initialize tracking for enchanted weapon bonuses
                gameManager.enchantedWeaponBonuses = 0;
                gameManager.addLogEntry(
                    `⚔️ The forge's magic begins to empower enemy weapons...`, 
                    'stage-effect dramatic'
                );
                
                // Create initial VFX to show the forge is active
                this.createEnchantedWeaponVFX(modifier);
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const currentTurn = gameManager.gameState.currentTurn || gameManager.gameState.turn;
                
                // Check if this is a 5th turn milestone
                if (currentTurn % 5 === 0 && currentTurn > 0) {
                    this.applyEnchantedWeaponEffect(gameManager, currentTurn);
                }
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Remove enchanted weapon buffs and clean up tracking
                if (gameManager.enchantedWeaponBonuses > 0) {
                    gameManager.gameState.aiCharacters.forEach(character => {
                        // Remove the enchanted weapon buff
                        character.removeBuff('enchanted_weapon_buff');
                        
                        // Update UI to reflect buff removal
                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(character);
                        }
                    });
                }
                delete gameManager.enchantedWeaponBonuses;
                gameManager.addLogEntry(
                    `⚔️ The forge's enchantment fades as the battle ends.`, 
                    'stage-effect'
                );
            }
        });

        // Desert Heat Modifier - Sets all characters' crit chance to 50% and regeneration to 50
        this.registerModifier({
            id: 'desert_heat',
            name: 'Desert Heat',
            description: 'The scorching desert heat heightens reflexes and vitality! All characters have their critical strike chance set to 50%, HP regeneration set to 50, and mana regeneration set to 50.',
            icon: '🌵',
            vfx: {
                type: 'desert_heat',
                particles: true,
                animation: 'heat_shimmer'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                console.log(`[DesertHeat] onStageStart triggered for modifier:`, modifier);
                // Apply desert heat effect immediately when stage loads
                this.applyDesertHeatEffect(gameManager, modifier, true);
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                console.log(`[DesertHeat] onTurnStart triggered for modifier:`, modifier);
                // Reapply desert heat effect at the start of every turn to ensure crit chance stays at 50%
                this.applyDesertHeatEffect(gameManager, modifier, false);
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                console.log(`[DesertHeat] onStageEnd triggered for modifier:`, modifier);
                // Restore original values when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    // Restore original crit chance
                    if (character.originalCritChance !== undefined) {
                        character.stats.critChance = character.originalCritChance;
                        delete character.originalCritChance;
                        console.log(`[DesertHeat] Restored ${character.name}'s crit chance to ${character.stats.critChance}`);
                    }
                    
                    // Restore original HP regeneration
                    if (character.originalHpPerTurn !== undefined) {
                        character.stats.hpPerTurn = character.originalHpPerTurn;
                        delete character.originalHpPerTurn;
                        console.log(`[DesertHeat] Restored ${character.name}'s HP regen to ${character.stats.hpPerTurn}`);
                    }
                    
                    // Restore original mana regeneration
                    if (character.originalManaPerTurn !== undefined) {
                        character.stats.manaPerTurn = character.originalManaPerTurn;
                        delete character.originalManaPerTurn;
                        console.log(`[DesertHeat] Restored ${character.name}'s mana regen to ${character.stats.manaPerTurn}`);
                    }
                });

                gameManager.addLogEntry(
                    `🌵 The desert heat fades, returning everyone's reflexes and vitality to normal.`, 
                    'stage-effect'
                );

                // Update character UIs to reflect the stat changes
                allCharacters.forEach(character => {
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(character);
                    }
                });
            }
        });
        
        console.log(`[StageModifiers] Registered desert_heat modifier successfully`);

        // ==== PACK HEALING MODIFIER ====
        this.registerModifier({
            id: 'pack_healing',
            name: 'Pack Healing',
            description: 'When an enemy dies, all remaining enemies heal to full HP. The bond between these beasts runs deep.',
            icon: '🩺',
            vfx: {
                type: 'pack_healing'
            },
            onCharacterDeath: (gameManager, stageManager, modifier, diedCharacter) => {
                console.log(`[PackHealing] Character ${diedCharacter?.name} died, checking if we should trigger pack healing`);
                
                if (!diedCharacter || !diedCharacter.isAI) {
                    console.log(`[PackHealing] Died character was not an enemy, no pack healing triggered`);
                    return;
                }
                
                // Get all living enemy allies of the died character
                const livingEnemies = gameManager.gameState.aiCharacters.filter(char => 
                    !char.isDead() && char.instanceId !== diedCharacter.instanceId
                );
                
                console.log(`[PackHealing] Found ${livingEnemies.length} living enemies to heal`);
                
                if (livingEnemies.length === 0) {
                    console.log(`[PackHealing] No living enemies to heal`);
                    return;
                }
                
                // Heal all living enemies to full HP
                let healedCharacters = [];
                livingEnemies.forEach(character => {
                    // Try different HP property locations
                    const currentHp = character.stats.currentHp || character.hp || character.stats.hp || 0;
                    const maxHp = character.stats.maxHp || character.maxHp || 0;
                    
                    console.log(`[PackHealing] Checking ${character.name}: Current HP ${currentHp}/${maxHp}`);
                    console.log(`[PackHealing] HP properties check: stats.currentHp=${character.stats.currentHp}, hp=${character.hp}, stats.hp=${character.stats.hp}, maxHp=${character.stats.maxHp}`);
                    
                    if (currentHp < maxHp) {
                        const healAmount = maxHp - currentHp;
                        const oldHp = currentHp;
                        
                        // Set HP in all possible locations to ensure it works
                        if (character.stats.currentHp !== undefined) {
                            character.stats.currentHp = maxHp;
                        }
                        if (character.hp !== undefined) {
                            character.hp = maxHp;
                        }
                        if (character.stats.hp !== undefined) {
                            character.stats.hp = maxHp;
                        }
                        
                        console.log(`[PackHealing] Healed ${character.name} from ${oldHp} to ${maxHp} (${healAmount} HP)`);
                        
                        // Show healing VFX using the global registry
                        if (window.stageModifiersRegistry) {
                            window.stageModifiersRegistry.createPackHealingVFX(character, healAmount);
                        }
                        
                        // Update UI
                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(character);
                            gameManager.uiManager.triggerHPAnimation(character, 'heal', healAmount);
                        }
                        
                        healedCharacters.push(character.name);
                    } else {
                        console.log(`[PackHealing] ${character.name} already at full health, skipping`);
                    }
                });
                
                console.log(`[PackHealing] Healed characters: ${healedCharacters.join(', ')}`);
                
                if (healedCharacters.length > 0) {
                    gameManager.addLogEntry(
                        `🩺 The death of ${diedCharacter.name} strengthens the pack! ${healedCharacters.join(', ')} heal${healedCharacters.length === 1 ? 's' : ''} to full HP!`, 
                        'stage-effect dramatic'
                    );
                } else {
                    gameManager.addLogEntry(
                        `🩺 The pack mourns ${diedCharacter.name}, but all allies were already at full health.`, 
                        'stage-effect'
                    );
                }
            }
        });
        
        console.log(`[StageModifiers] Registered pack_healing modifier successfully`);

        // Aggressive Protection Modifier
        this.registerModifier({
            id: 'aggressive_protection',
            name: 'Aggressive Protection',
            description: 'The castle guardians inspire fierce combat! When a character dodges, they gain +30% dodge chance for 3 turns. When someone deals damage, they gain +100 magical damage and +80 physical damage for 3 turns (stacking).',
            icon: '🛡️',
            vfx: {
                type: 'aggressive_protection',
                particles: true,
                animation: 'protective_aura'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                console.log(`[AggressiveProtection] Setting up event listeners for stage modifier`);
                
                // Store event listeners for cleanup
                if (!gameManager._aggressiveProtectionListeners) {
                    gameManager._aggressiveProtectionListeners = {};
                }

                // Dodge event listener
                gameManager._aggressiveProtectionListeners.onDodge = (event) => {
                    console.log(`[AggressiveProtection] DODGE EVENT TRIGGERED:`, event.detail);
                    const { character, attacker } = event.detail;
                    
                    console.log(`[AggressiveProtection] ${character.name} dodged an attack, applying dodge bonus buff`);
                    
                    // Check if character already has the dodge buff
                    let existingDodgeBuff = character.buffs.find(buff => buff.id === 'aggressive_protection_dodge_bonus');
                    if (character._aggressiveProtectionDodgeBuffAddedThisTurn) {
                        console.log(`[AggressiveProtection] Dodge buff already added this turn for ${character.name}, skipping.`);
                        return;
                    }
                    if (existingDodgeBuff && existingDodgeBuff.duration > 0) {
                        // Reset the duration and clear _isApplied flags
                        existingDodgeBuff.duration = 3;
                        if (existingDodgeBuff.statModifiers) {
                            existingDodgeBuff.statModifiers.forEach(modifier => {
                                modifier._isApplied = false;
                            });
                        }
                        console.log(`[AggressiveProtection] Refreshed Battle Instincts duration for ${character.name} and reset modifier flags`);
                        character.recalculateStats('aggressive_protection_dodge_refresh');
                        gameManager.addLogEntry(
                            `⚡ ${character.name}'s Battle Instincts refreshed!`, 
                            'stage-effect buff'
                        );
                        this.createAggressiveProtectionDodgeVFX(character);
                        character._aggressiveProtectionDodgeBuffAddedThisTurn = true;
                        return;
                    } else if (existingDodgeBuff && existingDodgeBuff.duration <= 0) {
                        character.removeBuff('aggressive_protection_dodge_bonus');
                    }
                    // Create new dodge bonus buff using proper Effect class
                    const dodgeBuff = new Effect(
                        'aggressive_protection_dodge_bonus',
                        'Battle Instincts',
                        '',  // No icon to avoid 404 errors
                        3,
                        null,
                        false
                    );
                    dodgeBuff.description = '+30% dodge chance from aggressive protection';
                    
                    // Use statModifiers - this is the correct format the game expects
                    dodgeBuff.statModifiers = [
                        {
                            stat: 'dodgeChance',
                            value: 0.30, // +30% dodge chance (0.30 = 30%)
                            operation: 'add',
                            _isApplied: false // Track if this modifier has been applied
                        }
                    ];
                    
                    // Add special flag for recalculate stats debugging
                    dodgeBuff._isAggressiveProtectionBuff = true;
                    
                    // Debug logging for dodge buff
                    console.log(`[AggressiveProtection] DEBUG: Creating Battle Instincts buff with statModifiers:`, dodgeBuff.statModifiers);
                    console.log(`[AggressiveProtection] DEBUG: ${character.name} dodge chance BEFORE buff: ${character.stats.dodgeChance}`);
                    
                    character.addBuff(dodgeBuff);
                    character._aggressiveProtectionDodgeBuffAddedThisTurn = true;
                    
                    // Debug logging AFTER buff is applied (addBuff already calls recalculateStats)
                    setTimeout(() => {
                        console.log(`[AggressiveProtection] DEBUG: ${character.name} dodge chance AFTER NEW buff: ${character.stats.dodgeChance}`);
                    }, 50);
                    
                    gameManager.addLogEntry(
                        `⚡ ${character.name} gains Battle Instincts, increasing dodge chance by 30% for 3 turns!`, 
                        'stage-effect buff'
                    );

                    // Visual effect for dodge bonus
                    this.createAggressiveProtectionDodgeVFX(character);
                };

                // Damage dealt event listener 
                gameManager._aggressiveProtectionListeners.onDamage = (event) => {
                    console.log(`[AggressiveProtection] DAMAGE EVENT TRIGGERED:`, event.detail);
                    const { character, target, damage, damageType, isCritical } = event.detail;
                    
                    console.log(`[AggressiveProtection] Event detail breakdown:`, {
                        caster: character?.name || 'undefined',
                        target: target?.name || 'undefined', 
                        damage: damage,
                        type: damageType,
                        isCritical: isCritical
                    });
                    
                    if (character && damage > 0) {
                        console.log(`[AggressiveProtection] ${character.name} dealt ${damage} damage, applying damage bonus buff`);
                        
                        // Check if character already has the damage buff
                        let existingBuff = character.buffs.find(buff => buff.id === 'aggressive_protection_damage_bonus');
                        if (character._aggressiveProtectionDamageBuffAddedThisTurn) {
                            console.log(`[AggressiveProtection] Damage buff already added this turn for ${character.name}, skipping.`);
                            return;
                        }
                        if (existingBuff && existingBuff.duration > 0) {
                            // Reset the duration and clear _isApplied flags
                            existingBuff.duration = 3;
                            if (existingBuff.statModifiers) {
                                existingBuff.statModifiers.forEach(modifier => {
                                    modifier._isApplied = false;
                                });
                            }
                            console.log(`[AggressiveProtection] Refreshed Combat Fury duration for ${character.name} and reset modifier flags`);
                            character.recalculateStats('aggressive_protection_refresh');
                            gameManager.addLogEntry(
                                `🔥 ${character.name}'s Combat Fury refreshed!`, 
                                'stage-effect buff'
                            );
                            this.createAggressiveProtectionDamageVFX(character);
                            character._aggressiveProtectionDamageBuffAddedThisTurn = true;
                            return;
                        } else if (existingBuff && existingBuff.duration <= 0) {
                            character.removeBuff('aggressive_protection_damage_bonus');
                        }
                        // Create new damage bonus buff using proper Effect class
                        const damageBuff = new Effect(
                            'aggressive_protection_damage_bonus',
                            'Combat Fury',
                            '',  // No icon to avoid 404 errors
                            3,
                            null,
                            false
                        );
                        damageBuff.description = '+100 magical damage and +80 physical damage from aggressive protection';
                        
                        // Use statModifiers - this is the correct format the game expects
                        damageBuff.statModifiers = [
                            {
                                stat: 'magicalDamage',
                                value: 100, // Flat +100 magical damage
                                operation: 'add',
                                _isApplied: false // Track if this modifier has been applied
                            },
                            {
                                stat: 'physicalDamage', 
                                value: 80, // Flat +80 physical damage
                                operation: 'add',
                                _isApplied: false // Track if this modifier has been applied
                            }
                        ];
                        
                        // Add debug logging specific to aggressive protection
                        console.log(`[AggressiveProtection] DEBUG: Creating Combat Fury buff with statModifiers:`, damageBuff.statModifiers);
                        console.log(`[AggressiveProtection] DEBUG: ${character.name} stats BEFORE buff - Physical: ${character.stats.physicalDamage}, Magical: ${character.stats.magicalDamage}`);
                        
                        // Add special flag for recalculate stats debugging
                        damageBuff._isAggressiveProtectionBuff = true;
                        
                        console.log(`[AggressiveProtection] Creating new damage buff for ${character.name}`);
                        character.addBuff(damageBuff);
                        character._aggressiveProtectionDamageBuffAddedThisTurn = true;
                        
                        gameManager.addLogEntry(
                            `🔥 ${character.name} gains Combat Fury, increasing damage output for 3 turns!`, 
                            'stage-effect buff'
                        );
                        
                        // Debug logging AFTER buff is applied (addBuff already calls recalculateStats)
                        setTimeout(() => {
                            console.log(`[AggressiveProtection] DEBUG: ${character.name} stats AFTER NEW buff - Physical: ${character.stats.physicalDamage}, Magical: ${character.stats.magicalDamage}`);
                        }, 50);

                        // Visual effect for damage bonus
                        this.createAggressiveProtectionDamageVFX(character);
                    } else {
                        console.log(`[AggressiveProtection] Damage event ignored - caster: ${character?.name || 'null'}, damage: ${damage}`);
                    }
                };

                // Add event listeners
                document.addEventListener('character:dodged', gameManager._aggressiveProtectionListeners.onDodge);
                document.addEventListener('character:damage-dealt', gameManager._aggressiveProtectionListeners.onDamage);
                
                gameManager.addLogEntry(
                    `🛡️ Aggressive Protection is active! Dodging grants dodge bonuses, dealing damage grants damage bonuses!`, 
                    'stage-effect dramatic'
                );
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                console.log(`[AggressiveProtection] Cleaning up event listeners`);
                
                // Remove event listeners
                if (gameManager._aggressiveProtectionListeners) {
                    if (gameManager._aggressiveProtectionListeners.onDodge) {
                        document.removeEventListener('character:dodged', gameManager._aggressiveProtectionListeners.onDodge);
                    }
                    if (gameManager._aggressiveProtectionListeners.onDamage) {
                        document.removeEventListener('character:damage-dealt', gameManager._aggressiveProtectionListeners.onDamage);
                    }
                    delete gameManager._aggressiveProtectionListeners;
                }
                
                // Remove all related buffs from characters
                const allCharacters = [
                    ...(gameManager.gameState?.playerCharacters || []),
                    ...(gameManager.gameState?.aiCharacters || [])
                ];
                
                allCharacters.forEach(character => {
                    character.removeBuff('aggressive_protection_dodge_bonus');
                    character.removeBuff('aggressive_protection_damage_bonus');
                });
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                // Reset Aggressive Protection buff flags for all characters
                const allCharacters = [...gameManager.playerCharacters, ...gameManager.aiCharacters];
                allCharacters.forEach(character => {
                    character._aggressiveProtectionDodgeBuffAddedThisTurn = false;
                    character._aggressiveProtectionDamageBuffAddedThisTurn = false;
                });
            }
        });
        
        console.log(`[StageModifiers] Registered aggressive_protection modifier successfully`);

        // ==== ESSENCE TRANSFER MODIFIER ====
        this.registerModifier({
            id: 'essence_transfer',
            name: 'Essence Transfer',
            description: 'When a character dies, their remaining power is transferred to a random survivor, adding each of their stats to the recipient. The transfer is additive and can stack indefinitely.',
            icon: '💀',
            onCharacterDeath: (gameManager, stageManager, modifier, diedCharacter) => {
                console.log(`[EssenceTransfer] Character ${diedCharacter?.name} has died – initiating essence transfer.`);

                // Build an array of all living characters excluding the one who just died
                const livingCharacters = [
                    ...(gameManager.gameState?.playerCharacters || []),
                    ...(gameManager.gameState?.aiCharacters || [])
                ].filter(c => !c.isDead() && c.instanceId !== diedCharacter?.instanceId);

                if (livingCharacters.length === 0) {
                    console.log('[EssenceTransfer] No valid living characters found – essence dissipates into the void.');
                    return;
                }

                // Pick a random recipient to receive the stats
                const recipient = livingCharacters[Math.floor(Math.random() * livingCharacters.length)];

                console.log(`[EssenceTransfer] ${recipient.name} has been chosen to receive the essence of ${diedCharacter.name}.`);

                // Stats we want to transfer (only additive numerical stats)
                const transferableStats = [
                    'physicalDamage', 'magicalDamage', 'armor', 'magicalShield', 'hp', 'maxHp', 'hpPerTurn', 'mana', 'maxMana',
                    'manaPerTurn', 'lifesteal', 'dodgeChance', 'critChance', 'critDamage', 'speed', 'healingPower'
                ];

                transferableStats.forEach(statKey => {
                    const gainedValue = diedCharacter.stats?.[statKey];
                    if (typeof gainedValue === 'number' && !isNaN(gainedValue)) {
                        // Ensure the recipient has this stat key
                        if (recipient.stats[statKey] === undefined) {
                            // If the recipient is missing the key, initialise it to 0 so addition works safely
                            recipient.stats[statKey] = 0;
                        }
                        recipient.stats[statKey] += gainedValue;
                    }
                });

                // If we modified maxHp or maxMana we should ensure current hp/mana is not above new max – or simply set equal so players feel the power-up.
                if (recipient.stats.maxHp && recipient.stats.hp !== undefined) {
                    recipient.stats.hp = Math.min(recipient.stats.hp + (diedCharacter.stats?.hp || 0), recipient.stats.maxHp);
                }
                if (recipient.stats.maxMana && recipient.stats.mana !== undefined) {
                    recipient.stats.mana = Math.min(recipient.stats.mana + (diedCharacter.stats?.mana || 0), recipient.stats.maxMana);
                }

                // Recalculate stats & update UI
                if (typeof recipient.recalculateStats === 'function') {
                    recipient.recalculateStats('essence_transfer_modifier');
                }
                if (gameManager.uiManager) {
                    gameManager.uiManager.updateCharacterUI(recipient);
                }

                // Log entry for dramatic effect
                if (gameManager.addLogEntry) {
                    gameManager.addLogEntry(`💀 ${recipient.name} absorbs the essence of ${diedCharacter.name}, gaining their stats!`, 'stage-effect dramatic');
                }

                // OPTIONAL: quick burst VFX on recipient (re-using healing or pack healing style for now)
                if (window.stageModifiersRegistry && typeof window.stageModifiersRegistry.createPackHealingVFX === 'function') {
                    window.stageModifiersRegistry.createPackHealingVFX(recipient, 0); // 0 heal amount – just reuse animation framework
                }
            }
        });

        console.log(`[StageModifiers] Registered essence_transfer modifier successfully`);

        // ==== HEALING MANA FLOW MODIFIER ====
        this.registerModifier({
            id: 'healing_mana_flow',
            name: 'Healing Mana Flow',
            description: 'Healing energy is supercharged: whenever a character is healed, they also restore 20% of the heal amount as mana.',
            icon: '💧',
            onStageStart: (gameManager, stageManager, modifier) => {
                // Flag all characters so Character.heal knows to grant mana
                const allChars = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
                allChars.forEach(c => {
                    c.stageModifiers = c.stageModifiers || {};
                    c.stageModifiers.healManaBonus = 0.20; // 20% of heal amount restored as mana
                });
                gameManager.addLogEntry('💧 Healing Mana Flow is active! Healing now restores mana as well.', 'stage-effect dramatic');
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Remove flag
                const allChars = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
                allChars.forEach(c => {
                    if (c.stageModifiers && c.stageModifiers.healManaBonus) {
                        delete c.stageModifiers.healManaBonus;
                    }
                });
            }
        });
        console.log('[StageModifiers] Registered healing_mana_flow modifier successfully');

        // ==== AQUATIC HOME PROTECTOR MODIFIER ====
        this.registerModifier({
            id: 'aquatic_home_protector',
            name: 'Aquatic Home Protector',
            description: 'The protective waters of the Atlantean realm heal player characters by 245 HP at the start of each turn.',
            icon: '🌊',
            vfx: {
                type: 'aquatic_home_protector',
                particles: true,
                animation: 'healing_waters'
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                const healAmount = modifier.effect?.value || 245;
                
                // Only heal player characters
                const targets = gameManager.gameState.playerCharacters;

                if (targets.length > 0) {
                    gameManager.addLogEntry(
                        `🌊 The protective waters of Atlantis surge with healing energy!`, 
                        'stage-effect dramatic'
                    );
                }

                targets.forEach(character => {
                    if (!character.isDead()) {
                        character.heal(healAmount, null, { 
                            isStageEffect: true,
                            stageModifierName: modifier.name,
                            abilityId: 'aquatic_home_protector_healing'
                        });
                        
                        gameManager.addLogEntry(
                            `${character.name} is healed by the protective waters for ${healAmount} HP!`, 
                            'stage-effect heal'
                        );

                        // Create aquatic healing VFX on the character
                        this.createAquaticHealingVFX(character, healAmount);
                    }
                });
            }
        });
        console.log('[StageModifiers] Registered aquatic_home_protector modifier successfully');

        // ==== ATLANTEAN AMBUSH DEFENSE MODIFIER ====
        this.registerModifier({
            id: 'atlantean_ambush_defense',
            name: 'Atlantean Ambush Defense',
            description: 'Ancient Atlantean wards protect their champions from ambushers, granting them +25 Armor and +25 Magical Shield.',
            icon: '🛡️',
            onStageStart: (gameManager, stageManager, modifier) => {
                // Apply flat +25 armor & magical shield to player characters
                const players = gameManager.gameState.playerCharacters || [];
                players.forEach(character => {
                    character.stageModifiers = character.stageModifiers || {};
                    if (character.stageModifiers._ambushDefenseApplied) return;

                    // Store originals
                    character.stageModifiers.ambushOriginalArmor = character.stats.armor;
                    character.stageModifiers.ambushOriginalMagicalShield = character.stats.magicalShield;

                    // Apply bonuses
                    character.stats.armor += 25;
                    character.stats.magicalShield += 25;

                    // Update baseStats so recalculations preserve the bonus
                    if (character.baseStats) {
                        character.baseStats.armor = (character.baseStats.armor || 0) + 25;
                        character.baseStats.magicalShield = (character.baseStats.magicalShield || 0) + 25;
                    }

                    // Mark applied
                    character.stageModifiers._ambushDefenseApplied = true;

                    // Force stat recalculation/UI update if needed
                    if (typeof character.recalculateStats === 'function') {
                        character.recalculateStats('atlantean_ambush_defense');
                    }
                    if (gameManager.uiManager) {
                        gameManager.uiManager.updateCharacterUI(character);
                    }
                });

                if (players.length) {
                    gameManager.addLogEntry('🛡️ Atlantean wards empower your champions with +25 Armor and +25 Magical Shield!', 'stage-effect dramatic');
                }
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Restore stats
                const players = gameManager.gameState.playerCharacters || [];
                players.forEach(character => {
                    if (character.stageModifiers && character.stageModifiers._ambushDefenseApplied) {
                        const origArmor = character.stageModifiers.ambushOriginalArmor;
                        const origShield = character.stageModifiers.ambushOriginalMagicalShield;
                        if (origArmor !== undefined) character.stats.armor = origArmor;
                        if (origShield !== undefined) character.stats.magicalShield = origShield;
                        // Revert baseStats changes as well
                        if (character.baseStats) {
                            if (origArmor !== undefined) character.baseStats.armor = origArmor;
                            if (origShield !== undefined) character.baseStats.magicalShield = origShield;
                        }
                        delete character.stageModifiers._ambushDefenseApplied;
                        delete character.stageModifiers.ambushOriginalArmor;
                        delete character.stageModifiers.ambushOriginalMagicalShield;
                        if (typeof character.recalculateStats === 'function') {
                            character.recalculateStats('atlantean_ambush_defense_end');
                        }
                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(character);
                        }
                    }
                });
                gameManager.addLogEntry('🛡️ The Atlantean wards fade as the battle ends.', 'stage-effect');
            }
        });

        console.log('[StageModifiers] Registered atlantean_ambush_defense modifier successfully');

        // ==== FREEZING WATERS MODIFIER ====
        this.registerModifier({
            id: 'freezing_waters',
            name: 'Freezing Waters',
            description: 'All player abilities that target enemies have a 38% chance to freeze the target for 2 turns. Frozen enemies have only 42% chance for their abilities to succeed.',
            icon: '❄️',
            vfx: {
                type: 'freezing_waters',
                particles: true,
                animation: 'ice_crystals'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                console.log(`[FreezingWaters] Setting up ability usage event listeners`);
                
                // Store event listeners for cleanup
                if (!gameManager._freezingWatersListeners) {
                    gameManager._freezingWatersListeners = {};
                }

                // Ability usage event listener for freeze chance
                gameManager._freezingWatersListeners.onAbilityUsed = (event) => {
                    console.log(`[FreezingWaters] ABILITY USED EVENT TRIGGERED:`, event.detail);
                    const { caster, target, ability } = event.detail;
                    
                    // Only apply to player characters using abilities that target enemies
                    if (caster && target && ability && !caster.isAI && target.isAI) {
                        // Check if ability targets enemies
                        const targetsEnemies = ability.targetType === 'enemy' || 
                                             ability.targetType === 'aoe_enemy' ||
                                             (ability.targetType === 'any' && target.isAI);
                        
                        if (targetsEnemies) {
                            console.log(`[FreezingWaters] ${caster.name} used ${ability.name} on enemy ${target.name}, rolling for freeze...`);
                            
                            // 38% chance to freeze
                            if (Math.random() < 0.38) {
                                const freezeDebuff = {
                                    id: 'freeze',
                                    name: 'Freeze',
                                    icon: '❄️',
                                    duration: 2,
                                    maxDuration: 2,
                                    isDebuff: true,
                                    source: 'Freezing Waters',
                                    description: 'Frozen by the icy waters! Abilities have only 42% chance to succeed.',
                                    effect: function(character) {
                                        // Freeze effect is handled in the ability usage logic
                                    },
                                    onRemove: function(character) {
                                        // Remove freeze VFX when debuff expires
                                        if (window.stageModifiersRegistry) {
                                            window.stageModifiersRegistry.removeFreezingWatersVFX(character);
                                        }
                                    }
                                };
                                
                                target.addDebuff(freezeDebuff);
                                
                                // Show freeze VFX
                                this.showFreezingWatersApplicationVFX(target);
                                
                                gameManager.addLogEntry(
                                    `❄️ ${target.name} is frozen by the icy waters for 2 turns!`, 
                                    'stage-effect debuff'
                                );
                            }
                        }
                    }
                };

                // Add event listener
                document.addEventListener('AbilityUsed', gameManager._freezingWatersListeners.onAbilityUsed);
                
                gameManager.addLogEntry(
                    `❄️ The waters around you turn ice-cold! Player abilities now have a chance to freeze enemies!`, 
                    'stage-effect dramatic'
                );
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                console.log(`[FreezingWaters] Cleaning up event listeners`);
                
                // Remove event listeners
                if (gameManager._freezingWatersListeners) {
                    if (gameManager._freezingWatersListeners.onAbilityUsed) {
                        document.removeEventListener('AbilityUsed', gameManager._freezingWatersListeners.onAbilityUsed);
                    }
                    delete gameManager._freezingWatersListeners;
                }
                
                // Clear any remaining freeze VFX
                this.clearFreezingWatersVFX();
            }
        });
        console.log('[StageModifiers] Registered freezing_waters modifier successfully');

        // Draft Mode Modifier
        this.registerModifier({
            id: 'draft_mode',
            name: 'Draft Mode',
            description: 'Enhanced combat conditions for draft battles! All characters gain 40% more HP and mana, plus 30 HP regen and 25 mana regen per turn.',
            icon: '⚔️✨',
            vfx: {
                type: 'draft_mode',
                particles: true,
                animation: 'draft_enhancement'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                this.applyDraftModeEffect(gameManager, modifier, true);
            },
            onTurnStart: (gameManager, stageManager, modifier) => {
                // Reapply draft mode effect at the start of every turn to ensure it persists
                this.applyDraftModeEffect(gameManager, modifier, false);
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                // Restore original values when stage ends
                const allCharacters = [
                    ...gameManager.gameState.playerCharacters,
                    ...gameManager.gameState.aiCharacters
                ];

                allCharacters.forEach(character => {
                    if (character.stageModifiers) {
                        // Restore original HP values
                        if (character.stageModifiers.originalMaxHp !== undefined) {
                            character.stats.hp = character.stageModifiers.originalMaxHp;
                            character.stats.maxHp = character.stageModifiers.originalMaxHp;
                            character.stats.currentHp = Math.min(character.stats.currentHp, character.stats.maxHp);
                            if (character.baseStats) {
                                character.baseStats.hp = character.stageModifiers.originalMaxHp;
                                character.baseStats.maxHp = character.stageModifiers.originalMaxHp;
                            }
                            delete character.stageModifiers.originalMaxHp;
                        }
                        
                        // Restore original mana values
                        if (character.stageModifiers.originalMaxMana !== undefined) {
                            character.stats.mana = character.stageModifiers.originalMaxMana;
                            character.stats.maxMana = character.stageModifiers.originalMaxMana;
                            character.stats.currentMana = Math.min(character.stats.currentMana, character.stats.maxMana);
                            if (character.baseStats) {
                                character.baseStats.mana = character.stageModifiers.originalMaxMana;
                                character.baseStats.maxMana = character.stageModifiers.originalMaxMana;
                            }
                            delete character.stageModifiers.originalMaxMana;
                        }
                        
                        // Restore original HP regen
                        if (character.stageModifiers.originalHpPerTurn !== undefined) {
                            character.stats.hpPerTurn = character.stageModifiers.originalHpPerTurn;
                            if (character.baseStats) {
                                character.baseStats.hpPerTurn = character.stageModifiers.originalHpPerTurn;
                            }
                            delete character.stageModifiers.originalHpPerTurn;
                        }
                        
                        // Restore original mana regen
                        if (character.stageModifiers.originalManaPerTurn !== undefined) {
                            character.stats.manaPerTurn = character.stageModifiers.originalManaPerTurn;
                            if (character.baseStats) {
                                character.baseStats.manaPerTurn = character.stageModifiers.originalManaPerTurn;
                            }
                            delete character.stageModifiers.originalManaPerTurn;
                        }
                    }
                });
                
                gameManager.addLogEntry('⚔️✨ The draft mode enhancements fade as the battle ends.', 'stage-effect');
                
                // Clear VFX
                this.clearDraftModeVFX();
            }
        });

        console.log('[StageModifiers] Registered draft_mode modifier successfully');

        // ==== DARK CURRENT MODIFIER ====
        this.registerModifier({
            id: 'dark_current',
            name: 'Dark Current',
            description: 'The dark waters drain the strength from all abilities. Using an ability costs an additional 20 mana.',
            icon: '🌊⚡',
            vfx: {
                type: 'dark_current',
                particles: true,
                animation: 'dark_energy_swirl'
            },
            onAbilityUse: (gameManager, stageManager, modifier, character, ability) => {
                // Apply additional mana cost to any character using an ability
                const additionalManaCost = 20;
                
                // Check if character has enough current mana to pay the additional cost
                if (character.stats.currentMana >= additionalManaCost) {
                    character.stats.currentMana -= additionalManaCost;
                    
                    // Create dark energy drain VFX
                    this.createDarkCurrentDrainVFX(character, additionalManaCost);
                    
                    gameManager.addLogEntry(
                        `🌊⚡ The Dark Current drains ${additionalManaCost} additional mana from ${character.name}!`, 
                        'stage-effect damage'
                    );
                } else {
                    // If not enough mana, take what's available
                    const drainedMana = character.stats.currentMana;
                    character.stats.currentMana = 0;
                    
                    if (drainedMana > 0) {
                        // Create dark energy drain VFX
                        this.createDarkCurrentDrainVFX(character, drainedMana);
                        
                        gameManager.addLogEntry(
                            `🌊⚡ The Dark Current drains ${drainedMana} mana from ${character.name}, leaving them completely drained!`, 
                            'stage-effect damage'
                        );
                    }
                }
                
                // Force UI update to show mana change
                if (gameManager.uiManager) {
                    gameManager.uiManager.updateCharacterUI(character);
                }
            }
        });

        console.log('[StageModifiers] Registered dark_current modifier successfully');

        // ==== POWER OF LOVE MODIFIER ====
        this.registerModifier({
            id: 'power_of_love',
            name: 'Power of Love',
            description: 'When there are only two player characters, their stats are combined, amplifying their strength through their bond.',
            icon: '💖',
            vfx: {
                type: 'power_of_love',
                particles: true,
                animation: 'heart_aura'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                const playerCharacters = gameManager.gameState.playerCharacters;

                if (playerCharacters.length === 2) {
                    const [char1, char2] = playerCharacters;

                    if (char1.isDead() || char2.isDead()) {
                        return; // Don't apply if one is already dead.
                    }

                    // Prevent applying the buff multiple times
                    if (char1.stageModifiers?.powerOfLoveApplied) {
                        return;
                    }

                    gameManager.addLogEntry(
                        `💖 The Power of Love binds ${char1.name} and ${char2.name}! Their stats are combined!`,
                        'stage-effect dramatic'
                    );

                    const statsToCombine = [
                        'maxHp', 'maxMana', 'physicalDamage', 'magicalDamage', 'armor', 'magicalShield',
                        'speed', 'critChance', 'critDamage', 'lifesteal', 'hpPerTurn', 'manaPerTurn'
                    ];

                    // Store original stats to revert on stage end
                    char1.stageModifiers = char1.stageModifiers || {};
                    char2.stageModifiers = char2.stageModifiers || {};
                    char1.stageModifiers.powerOfLoveOriginalStats = { ...char1.stats };
                    char2.stageModifiers.powerOfLoveOriginalStats = { ...char2.stats };

                    const combinedStats = {};
                    statsToCombine.forEach(stat => {
                        const val1 = char1.stats[stat] || 0;
                        const val2 = char2.stats[stat] || 0;
                        combinedStats[stat] = val1 + val2;
                    });

                    const combinedCurrentHp = (char1.stats.currentHp || 0) + (char2.stats.currentHp || 0);
                    const combinedCurrentMana = (char1.stats.currentMana || 0) + (char2.stats.currentMana || 0);

                    // Apply combined stats to both characters
                    [char1, char2].forEach(char => {
                        Object.assign(char.stats, combinedStats);
                        char.stats.currentHp = combinedCurrentHp;
                        char.stats.currentMana = combinedCurrentMana;

                        char.stats.currentHp = Math.min(char.stats.currentHp, char.stats.maxHp);
                        char.stats.currentMana = Math.min(char.stats.currentMana, char.stats.maxMana);

                        if (char.baseStats) {
                            Object.assign(char.baseStats, combinedStats);
                        }
                        
                        char.stageModifiers.powerOfLoveApplied = true;

                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(char);
                        }
                    });

                    this.createPowerOfLoveVFX(char1);
                    this.createPowerOfLoveVFX(char2);
                }
            },
            onStageEnd: (gameManager, stageManager, modifier) => {
                const playerCharacters = gameManager.gameState.playerCharacters;
                playerCharacters.forEach(char => {
                    if (char.stageModifiers && char.stageModifiers.powerOfLoveOriginalStats) {
                        Object.assign(char.stats, char.stageModifiers.powerOfLoveOriginalStats);
                        if (char.baseStats) {
                            Object.assign(char.baseStats, char.stageModifiers.powerOfLoveOriginalStats);
                        }
                        delete char.stageModifiers.powerOfLoveOriginalStats;
                        delete char.stageModifiers.powerOfLoveApplied;
                        if (gameManager.uiManager) {
                            gameManager.uiManager.updateCharacterUI(char);
                        }
                    }
                });
            }
        });

        console.log('[StageModifiers] Registered power_of_love modifier successfully');

        // ==== WEBBED MODIFIER ====
        this.registerModifier({
            id: 'webbed',
            name: 'Webbed',
            description: 'A random ability for all player characters are disabled permanently (cant be cleansed).',
            icon: '🕸️',
            vfx: {
                type: 'webbed',
                particles: false,
                animation: 'spiderweb_disable'
            },
            onStageStart: (gameManager, stageManager, modifier) => {
                const playerCharacters = gameManager.gameState.playerCharacters;

                if (playerCharacters.length > 0) {
                    gameManager.addLogEntry(
                        `🕸️ The battlefield is covered in sticky webs! A random ability for each player is disabled!`,
                        'stage-effect dramatic'
                    );
                }

                playerCharacters.forEach(character => {
                    if (!character.isDead() && character.abilities.length > 0) {
                        // Filter out abilities that are already disabled or passives
                        const usableAbilities = character.abilities.filter(ability => 
                            !ability.isDisabled && !ability.isPassive && ability.id !== 'basic_attack'
                        );

                        if (usableAbilities.length > 0) {
                            const randomIndex = Math.floor(Math.random() * usableAbilities.length);
                            const abilityToDisable = usableAbilities[randomIndex];

                            if (abilityToDisable) {
                                abilityToDisable.isDisabled = true;
                                abilityToDisable.isWebbed = true; // Mark as webbed for permanent disable
                                
                                gameManager.addLogEntry(
                                    `🕸️ ${character.name}'s ${abilityToDisable.name} is now webbed and disabled!`,
                                    'stage-effect debuff'
                                );

                                // Apply VFX to the ability icon
                                this.createWebbedAbilityVFX(character, abilityToDisable.id);

                                // Update character UI to reflect disabled ability
                                if (gameManager.uiManager && typeof gameManager.uiManager.updateCharacterAbilityUI === 'function') {
                                    gameManager.uiManager.updateCharacterAbilityUI(character, abilityToDisable.id);
                                }
                            }
                        }
                    }
                });
            }
        });
        console.log('[StageModifiers] Registered webbed modifier successfully');
    }

    createPowerOfLoveVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'power-of-love-vfx';
        
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.textContent = '💖';
            heart.style.left = (Math.random() * 80 + 10) + '%';
            heart.style.top = (Math.random() * 80 + 10) + '%';
            heart.style.animationDelay = (Math.random() * 1.5) + 's';
            heart.style.animationDuration = (1 + Math.random()) + 's';
            vfxContainer.appendChild(heart);
        }

        const artContainer = charElement.querySelector('.character-art-container') || charElement;
        artContainer.appendChild(vfxContainer);

        setTimeout(() => vfxContainer.remove(), 2500);
    }

    createWebbedAbilityVFX(character, abilityId) {
        const abilityElement = document.querySelector(`#character-${character.instanceId || character.id} .ability-icon[data-ability-id="${abilityId}"]`);
        if (!abilityElement) {
            console.warn(`[WebbedVFX] Could not find ability element for ${character.name}'s ability ${abilityId}`);
            return;
        }

        let webOverlay = abilityElement.querySelector('.webbed-overlay');
        if (!webOverlay) {
            webOverlay = document.createElement('div');
            webOverlay.className = 'webbed-overlay';
            webOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6); /* Dark overlay */
                border-radius: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 2em;
                color: #fff;
                opacity: 0;
                animation: webbedAppear 0.5s forwards;
                z-index: 10;
                overflow: hidden;
            `;
            
            const webIcon = document.createElement('div');
            webIcon.textContent = '🕸️';
            webIcon.style.cssText = `
                animation: webbedIconPulse 1.5s infinite alternate;
            `;
            webOverlay.appendChild(webIcon);

            // Add web lines effect
            for (let i = 0; i < 4; i++) {
                const webLine = document.createElement('div');
                webLine.className = 'web-line';
                webLine.style.cssText = `
                    position: absolute;
                    background: #ccc;
                    width: 2px;
                    height: 100%;
                    transform-origin: center;
                    animation: webLineSpin 1s ease-out forwards;
                    animation-delay: ${i * 0.1}s;
                `;
                if (i % 2 === 0) {
                    webLine.style.transform = `rotate(${i * 45}deg)`;
                } else {
                    webLine.style.height = '2px';
                    webLine.style.width = '100%';
                    webLine.style.transform = `rotate(${i * 45}deg)`;
                }
                webOverlay.appendChild(webLine);
            }
            
            abilityElement.appendChild(webOverlay);

            // Add CSS animations to the head if not already present
            if (!document.getElementById('webbed-ability-vfx-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'webbed-ability-vfx-styles';
                styleSheet.textContent = `
                    @keyframes webbedAppear {
                        from { opacity: 0; transform: scale(0.8); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes webbedIconPulse {
                        from { transform: scale(0.9); }
                        to { transform: scale(1.1); }
                    }
                    @keyframes webLineSpin {
                        from { transform: rotate(0deg) scale(0); opacity: 0; }
                        to { transform: rotate(360deg) scale(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(styleSheet);
            }
        }
    }

    // Helper method to apply draft mode effect to all characters
    applyDraftModeEffect(gameManager, modifier, isStageStart) {
        console.log(`[DraftMode] applyDraftModeEffect called - isStageStart: ${isStageStart}`);
        
        // Add a delay to ensure characters are fully loaded
        const applyEffect = () => {
            const allCharacters = [
                ...(gameManager.gameState?.playerCharacters || []),
                ...(gameManager.gameState?.aiCharacters || [])
            ];

            console.log(`[DraftMode] Found ${allCharacters.length} characters to process for Draft Mode`);
            
            if (allCharacters.length === 0) {
                console.warn(`[DraftMode] No characters found! Retrying in 500ms...`);
                setTimeout(applyEffect, 500);
                return;
            }
            
            let affectedCharacters = [];
            
            allCharacters.forEach(character => {
                if (!character.isDead()) {
                    // Store original values if not already stored
                    if (character.stageModifiers?.originalMaxHp === undefined) {
                        character.stageModifiers = character.stageModifiers || {};
                        character.stageModifiers.originalMaxHp = character.stats.maxHp || character.stats.hp;
                        console.log(`[DraftMode] Stored original max HP for ${character.name}: ${character.stageModifiers.originalMaxHp}`);
                    }
                    
                    if (character.stageModifiers?.originalMaxMana === undefined) {
                        character.stageModifiers = character.stageModifiers || {};
                        character.stageModifiers.originalMaxMana = character.stats.maxMana || character.stats.mana;
                        console.log(`[DraftMode] Stored original max mana for ${character.name}: ${character.stageModifiers.originalMaxMana}`);
                    }
                    
                    if (character.stageModifiers?.originalHpPerTurn === undefined) {
                        character.stageModifiers = character.stageModifiers || {};
                        character.stageModifiers.originalHpPerTurn = character.stats.hpPerTurn || 0;
                        console.log(`[DraftMode] Stored original HP regen for ${character.name}: ${character.stageModifiers.originalHpPerTurn}`);
                    }
                    
                    if (character.stageModifiers?.originalManaPerTurn === undefined) {
                        character.stageModifiers = character.stageModifiers || {};
                        character.stageModifiers.originalManaPerTurn = character.stats.manaPerTurn || 0;
                        console.log(`[DraftMode] Stored original mana regen for ${character.name}: ${character.stageModifiers.originalManaPerTurn}`);
                    }
                    
                    // Apply 40% HP and mana increase
                    const originalMaxHp = character.stageModifiers.originalMaxHp;
                    const originalMaxMana = character.stageModifiers.originalMaxMana;
                    
                    const newMaxHp = Math.floor(originalMaxHp * 1.4);
                    const newMaxMana = Math.floor(originalMaxMana * 1.4);
                    
                    console.log(`[DraftMode] Increasing ${character.name}'s HP from ${originalMaxHp} to ${newMaxHp} (40% increase)`);
                    console.log(`[DraftMode] Increasing ${character.name}'s mana from ${originalMaxMana} to ${newMaxMana} (40% increase)`);
                    
                    // Update max HP/Mana stats without forcibly healing the character.
                    character.stats.hp = newMaxHp;
                    character.stats.maxHp = newMaxHp;

                    // Only adjust current HP ONCE at stage start so players start with the same percent HP.
                    if (isStageStart && !character.stageModifiers._draftModeCurrentHpAdjusted) {
                        const hpRatio = originalMaxHp > 0 ? (character.stats.currentHp / originalMaxHp) : 1;
                        character.stats.currentHp = Math.min(Math.ceil(newMaxHp * hpRatio), newMaxHp);
                        character.stageModifiers._draftModeCurrentHpAdjusted = true;
                    } else if (character.stats.currentHp > newMaxHp) {
                        // Clamp if something later puts currentHp higher than new max
                        character.stats.currentHp = newMaxHp;
                    }

                    // Update max Mana and clamp current Mana similarly.
                    character.stats.mana = newMaxMana;
                    character.stats.maxMana = newMaxMana;
                    if (isStageStart && !character.stageModifiers._draftModeCurrentManaAdjusted) {
                        const manaRatio = originalMaxMana > 0 ? (character.stats.currentMana / originalMaxMana) : 1;
                        character.stats.currentMana = Math.min(Math.ceil(newMaxMana * manaRatio), newMaxMana);
                        character.stageModifiers._draftModeCurrentManaAdjusted = true;
                    } else if (character.stats.currentMana > newMaxMana) {
                        character.stats.currentMana = newMaxMana;
                    }
                    
                    // Update base stats to preserve through recalculation
                    if (character.baseStats) {
                        character.baseStats.hp = newMaxHp;
                        character.baseStats.maxHp = newMaxHp;
                        character.baseStats.mana = newMaxMana;
                        character.baseStats.maxMana = newMaxMana;
                    }
                    
                    // Apply regeneration bonuses
                    const targetHpRegen = character.stageModifiers.originalHpPerTurn + 30;
                    const targetManaRegen = character.stageModifiers.originalManaPerTurn + 25;
                    
                    console.log(`[DraftMode] Setting ${character.name}'s HP regen from ${character.stats.hpPerTurn} to ${targetHpRegen} (+30)`);
                    console.log(`[DraftMode] Setting ${character.name}'s mana regen from ${character.stats.manaPerTurn} to ${targetManaRegen} (+25)`);
                    
                    character.stats.hpPerTurn = targetHpRegen;
                    character.stats.manaPerTurn = targetManaRegen;
                    
                    // Update base stats for regeneration
                    if (character.baseStats) {
                        character.baseStats.hpPerTurn = targetHpRegen;
                        character.baseStats.manaPerTurn = targetManaRegen;
                    }
                    
                    affectedCharacters.push(character.name);
                    
                    // Force recalculate stats to ensure the changes are properly applied
                    if (character.recalculateStats) {
                        character.recalculateStats('draft_mode_modifier');
                    }
                    
                    // Force UI update
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(character);
                    }
                }
            });

            console.log(`[DraftMode] Affected characters: ${affectedCharacters.join(', ')}`);

            // Add log entry
            if (isStageStart && affectedCharacters.length > 0) {
                gameManager.addLogEntry(
                    `⚔️✨ Draft Mode enhances all combatants! Everyone gains 40% more HP and mana, plus 30 HP regen and 25 mana regen per turn.`, 
                    'stage-effect dramatic'
                );
            } else if (!isStageStart && affectedCharacters.length > 0) {
                gameManager.addLogEntry(
                    `⚔️✨ Draft Mode enhancements continue to empower all fighters.`, 
                    'stage-effect'
                );
            }
            
            // Create VFX if it's the stage start
            if (isStageStart) {
                this.createDraftModeVFX(modifier);
            }
        };
        
        // Apply immediately if characters exist, otherwise wait for them
        if (isStageStart) {
            setTimeout(() => applyEffect.call(this), 100); // Small delay for stage start
        } else {
            applyEffect.call(this); // Apply immediately for turn start
        }
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

    processModifiers(gameManager, stageManager, phase = 'turnStart', options = {}) {
        const activeModifiers = stageManager.getStageModifiers() || [];
        
        console.log(`[StageModifiers] Processing ${activeModifiers.length} modifiers for phase: ${phase}`);
        console.log(`[StageModifiers] Available registered modifiers:`, Array.from(this.modifiers.keys()));
        console.log(`[StageModifiers] Stage modifiers to process:`, activeModifiers.map(m => ({ id: m.id, name: m.name })));
        
        // Special debug for aggressive protection
        if (phase === 'stageStart') {
            const aggressiveProtectionModifier = activeModifiers.find(m => m.id === 'aggressive_protection');
            if (aggressiveProtectionModifier) {
                console.log(`[StageModifiers] FOUND AGGRESSIVE PROTECTION MODIFIER for stage start!`, aggressiveProtectionModifier);
            }
        }
        
        activeModifiers.forEach(modifier => {
            const registeredModifier = this.getModifier(modifier.id);
            
            if (registeredModifier) {
                try {
                    console.log(`[StageModifiers] Executing ${registeredModifier.name} (${modifier.id}) for ${phase}`);
                    
                    if (phase === 'turnStart' && registeredModifier.onTurnStart) {
                        registeredModifier.onTurnStart(gameManager, stageManager, modifier);
                    } else if (phase === 'stageStart' && registeredModifier.onStageStart) {
                        console.log(`[StageModifiers] About to call onStageStart for ${modifier.id}`);
                        registeredModifier.onStageStart(gameManager, stageManager, modifier);
                        console.log(`[StageModifiers] Completed onStageStart for ${modifier.id}`);
                    } else if (phase === 'turnEnd' && registeredModifier.onTurnEnd) {
                        registeredModifier.onTurnEnd(gameManager, stageManager, modifier);
                    } else if (phase === 'stageEnd' && registeredModifier.onStageEnd) {
                        registeredModifier.onStageEnd(gameManager, stageManager, modifier);
                    } else if (phase === 'characterDeath' && registeredModifier.onCharacterDeath) {
                        registeredModifier.onCharacterDeath(gameManager, stageManager, modifier, options?.character);
                    } else if (phase === 'abilityUse' && registeredModifier.onAbilityUse) {
                        registeredModifier.onAbilityUse(gameManager, stageManager, modifier, options?.character, options?.ability);
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
            case 'desert_heat':
                this.createDesertHeatVFX(modifier);
                break;
            case 'pack_healing':
                this.createPackHealingEnvironmentVFX(modifier);
                break;
            case 'aggressive_protection':
                // VFX disabled per user request
                // this.createAggressiveProtectionVFX(modifier);
                break;
            case 'aquatic_home_protector':
                this.createAquaticHomeProtectorVFX(modifier);
                break;
            case 'cleansing_winds':
                this.createCleansingWindsScreenVFX();
                break;
            case 'draft_mode':
                this.createDraftModeVFX(modifier);
                break;
            case 'freezing_waters':
                this.createFreezingWatersVFX(modifier);
                break;
            case 'dark_current':
                this.createDarkCurrentVFX(modifier);
                break;
            case 'power_of_love':
                // VFX is handled directly onStageStart, so no separate environment VFX needed here.
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

    createDesertHeatVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx desert-heat-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create heat shimmer overlay
        const heatShimmer = document.createElement('div');
        heatShimmer.className = 'heat-shimmer-overlay';
        heatShimmer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                45deg,
                rgba(255, 140, 0, 0.1) 0%,
                rgba(255, 69, 0, 0.15) 25%,
                rgba(255, 215, 0, 0.1) 50%,
                rgba(255, 140, 0, 0.15) 75%,
                rgba(255, 69, 0, 0.1) 100%
            );
            animation: desertHeatShimmer 4s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(heatShimmer);
        
        // Create sand particles
        for (let i = 0; i < 30; i++) {
            const sandParticle = document.createElement('div');
            sandParticle.className = 'sand-particle';
            sandParticle.style.cssText = `
                position: absolute;
                width: ${2 + Math.random() * 4}px;
                height: ${2 + Math.random() * 4}px;
                background: rgba(222, 184, 135, ${0.6 + Math.random() * 0.4});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: sandDrift ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
                filter: blur(0.5px);
                z-index: 3;
            `;
            vfxContainer.appendChild(sandParticle);
        }
        
        // Create heat waves
        for (let i = 0; i < 8; i++) {
            const heatWave = document.createElement('div');
            heatWave.className = 'desert-heat-wave';
            heatWave.style.cssText = `
                position: absolute;
                width: 100%;
                height: ${20 + Math.random() * 30}px;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 140, 0, 0.2) 20%,
                    rgba(255, 69, 0, 0.3) 50%,
                    rgba(255, 140, 0, 0.2) 80%,
                    transparent 100%
                );
                left: 0;
                top: ${Math.random() * 100}%;
                animation: heatWaveFlow ${2 + Math.random() * 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                filter: blur(1px);
                opacity: ${0.4 + Math.random() * 0.3};
                z-index: 1;
            `;
            vfxContainer.appendChild(heatWave);
        }
        
        // Create floating cactus emojis for desert theme
        for (let i = 0; i < 5; i++) {
            const cactus = document.createElement('div');
            cactus.className = 'desert-cactus';
            cactus.textContent = '🌵';
            cactus.style.cssText = `
                position: absolute;
                font-size: ${12 + Math.random() * 8}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatingCactus ${6 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                opacity: ${0.3 + Math.random() * 0.4};
                z-index: 4;
                pointer-events: none;
            `;
            vfxContainer.appendChild(cactus);
        }

        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created desert heat VFX with heat shimmer and sand particles for ${modifier.name}`);
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

    applyEnchantedWeaponEffect(gameManager, currentTurn) {
        // Increment the bonus counter
        gameManager.enchantedWeaponBonuses++;
        const bonusAmount = 0.15; // 15% bonus per milestone
        const totalBonusPercent = gameManager.enchantedWeaponBonuses * bonusAmount * 100;
        
        gameManager.addLogEntry(
            `⚔️ Turn ${currentTurn}: The forge's magic surges! Enemy weapons gain another +15% physical damage!`, 
            'stage-effect dramatic'
        );
        
        gameManager.addLogEntry(
            `🔥 Enemy weapons now deal +${totalBonusPercent}% physical damage!`, 
            'stage-effect warning'
        );
        
        // Apply the bonus to all AI characters using proper buff effects
        gameManager.gameState.aiCharacters.forEach(character => {
            if (!character.isDead()) {
                // Remove existing enchanted weapon buff if it exists
                character.removeBuff('enchanted_weapon_buff');
                
                // Calculate total damage bonus (cumulative)
                const totalDamageMultiplier = 1 + (gameManager.enchantedWeaponBonuses * bonusAmount);
                
                // Create new enchanted weapon buff with cumulative bonus
                const enchantmentBuff = new Effect(
                    'enchanted_weapon_buff',
                    'Enchanted Weapon',
                    'Icons/abilities/enchanted_weapon.png',
                    999, // Very long duration (essentially permanent for the stage)
                    null,
                    false // Not a debuff
                );
                
                enchantmentBuff.setDescription(`Weapon enhanced by forge magic. +${totalBonusPercent}% physical damage.`);
                
                // Use stat modifiers to properly apply the bonus
                enchantmentBuff.statModifiers = [
                    { 
                        stat: 'physicalDamage', 
                        value: totalDamageMultiplier, 
                        operation: 'multiply' 
                    }
                ];
                
                // Add custom properties for tracking
                enchantmentBuff.enchantmentLevel = gameManager.enchantedWeaponBonuses;
                enchantmentBuff.totalBonusPercent = totalBonusPercent;
                
                // Apply the buff
                character.addBuff(enchantmentBuff);
                
                // Create enchantment VFX on the character
                this.createEnchantedWeaponBuffVFX(character, totalBonusPercent);
                
                gameManager.addLogEntry(
                    `${character.name}'s weapon glows with infernal power! (+${totalBonusPercent}% physical damage)`, 
                    'stage-effect enemy-buff'
                );
                
                // Force UI update to reflect the new buff
                if (gameManager.uiManager) {
                    gameManager.uiManager.updateCharacterUI(character);
                }
            }
        });
        
        // Create screen-wide enchantment VFX
        this.createEnchantmentSurgeVFX(currentTurn, totalBonusPercent);
    }

    createEnchantedWeaponVFX(modifier) {
        // Create ambient forge glow VFX in the background
        const stageBackground = document.getElementById('stage-background');
        if (!stageBackground) return;
        
        const forgeGlow = document.createElement('div');
        forgeGlow.className = 'enchanted-weapon-forge-glow stage-modifier-vfx';
        forgeGlow.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, rgba(255, 100, 0, 0.1) 0%, rgba(255, 50, 0, 0.05) 50%, transparent 100%);
            animation: forgeGlowPulse 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
        `;
        
        // Add forge glow animation
        if (!document.getElementById('enchanted-weapon-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'enchanted-weapon-styles';
            styleSheet.textContent = `
                @keyframes forgeGlowPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                
                @keyframes weaponEnchantmentPulse {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1); 
                        opacity: 0.8; 
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.2); 
                        opacity: 1; 
                    }
                }
                
                @keyframes enchantmentSpark {
                    0% { 
                        transform: translate(-50%, -50%) scale(0) rotate(0deg); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1) rotate(180deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(0.3) rotate(360deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes enchantmentSurge {
                    0% { 
                        background: linear-gradient(45deg, rgba(255, 100, 0, 0.1), rgba(255, 50, 0, 0.1));
                        transform: scale(1);
                    }
                    50% { 
                        background: linear-gradient(45deg, rgba(255, 150, 0, 0.3), rgba(255, 100, 0, 0.2));
                        transform: scale(1.05);
                    }
                    100% { 
                        background: linear-gradient(45deg, rgba(255, 100, 0, 0.1), rgba(255, 50, 0, 0.1));
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        stageBackground.appendChild(forgeGlow);
        console.log('[StageModifiers] Created enchanted weapon forge glow VFX');
    }

    createEnchantedWeaponBuffVFX(character, totalBonusPercent) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create weapon glow effect
        const weaponGlow = document.createElement('div');
        weaponGlow.className = 'enchanted-weapon-character-buff';
        weaponGlow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(255, 100, 0, 0.4) 0%, rgba(255, 50, 0, 0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: weaponEnchantmentPulse 2s ease-in-out;
            pointer-events: none;
            z-index: 95;
        `;
        
        // Create enchantment sparks
        const sparksContainer = document.createElement('div');
        sparksContainer.className = 'enchantment-sparks';
        sparksContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 96;
        `;
        
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            const angle = (i / 8) * 360;
            spark.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #ffaa00, #ff6600);
                border-radius: 50%;
                animation: enchantmentSpark 1.5s ease-out;
                animation-delay: ${i * 0.1}s;
                transform-origin: 0 0;
            `;
            spark.style.setProperty('--angle', `${angle}deg`);
            sparksContainer.appendChild(spark);
        }
        
        // Create floating damage bonus text
        const bonusText = document.createElement('div');
        bonusText.className = 'enchantment-bonus-text';
        bonusText.textContent = `+${totalBonusPercent}% DMG`;
        bonusText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: bold;
            color: #ffaa00;
            text-shadow: 
                0 0 8px rgba(255, 170, 0, 0.8),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: floatUpFadeOut 2s ease-out;
            pointer-events: none;
            z-index: 97;
        `;
        
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'enchanted-weapon-vfx-container';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        vfxContainer.appendChild(weaponGlow);
        vfxContainer.appendChild(sparksContainer);
        vfxContainer.appendChild(bonusText);
        charElement.appendChild(vfxContainer);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.remove();
            }
        }, 2500);
        
        console.log(`[StageModifiers] Created enchanted weapon buff VFX for ${character.name} (+${totalBonusPercent}% damage)`);
    }

    createEnchantmentSurgeVFX(currentTurn, totalBonusPercent) {
        // Create screen-wide surge effect
        const battleContainer = document.querySelector('.battle-container') || document.body;
        
        const surgeOverlay = document.createElement('div');
        surgeOverlay.className = 'enchantment-surge-overlay';
        surgeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(255, 100, 0, 0.1), rgba(255, 50, 0, 0.1));
            animation: enchantmentSurge 3s ease-out;
            pointer-events: none;
            z-index: 150;
        `;
        
        // Create large surge text
        const surgeText = document.createElement('div');
        surgeText.className = 'enchantment-surge-text';
        surgeText.textContent = `FORGE SURGE! Turn ${currentTurn}`;
        surgeText.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 32px;
            font-weight: bold;
            color: #ffaa00;
            text-shadow: 
                0 0 20px rgba(255, 170, 0, 0.9),
                0 0 40px rgba(255, 100, 0, 0.6),
                4px 4px 8px rgba(0, 0, 0, 0.8);
            animation: surgePulse 3s ease-out;
            pointer-events: none;
            z-index: 151;
        `;
        
        // Add surge animation
        if (!document.getElementById('enchantment-surge-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'enchantment-surge-styles';
            styleSheet.textContent = `
                @keyframes surgePulse {
                    0% { 
                        transform: translateX(-50%) scale(0.5); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.2); 
                        opacity: 1; 
                    }
                    40% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 1; 
                    }
                    80% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.8); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        battleContainer.appendChild(surgeOverlay);
        battleContainer.appendChild(surgeText);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (surgeOverlay.parentNode) {
                surgeOverlay.remove();
            }
            if (surgeText.parentNode) {
                surgeText.remove();
            }
        }, 3500);
        
        console.log(`[StageModifiers] Created enchantment surge VFX for turn ${currentTurn}`);
    }

    createPackHealingEnvironmentVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx pack-healing-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create healing aura overlay
        const healingAura = document.createElement('div');
        healingAura.className = 'pack-healing-aura';
        healingAura.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at center,
                rgba(0, 255, 100, 0.1) 0%,
                rgba(100, 255, 150, 0.15) 30%,
                rgba(50, 200, 100, 0.1) 60%,
                transparent 100%
            );
            animation: packHealingPulse 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(healingAura);
        
        // Create floating healing orbs
        for (let i = 0; i < 15; i++) {
            const healingOrb = document.createElement('div');
            healingOrb.className = 'pack-healing-orb';
            healingOrb.style.cssText = `
                position: absolute;
                width: ${4 + Math.random() * 8}px;
                height: ${4 + Math.random() * 8}px;
                background: radial-gradient(circle, rgba(100, 255, 150, 0.8), rgba(50, 200, 100, 0.4));
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: packHealingOrb ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
                filter: blur(0.5px);
                z-index: 3;
            `;
            vfxContainer.appendChild(healingOrb);
        }
        
        // Create healing energy particles
        for (let i = 0; i < 8; i++) {
            const energyParticle = document.createElement('div');
            energyParticle.className = 'pack-healing-energy-particle';
            energyParticle.style.cssText = `
                position: absolute;
                width: ${6 + Math.random() * 8}px;
                height: ${6 + Math.random() * 8}px;
                background: radial-gradient(circle, rgba(100, 255, 150, 0.9), rgba(50, 200, 100, 0.6), transparent);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: packHealingEnergyFloat ${5 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                opacity: ${0.6 + Math.random() * 0.4};
                z-index: 4;
                pointer-events: none;
                filter: blur(0.5px);
                box-shadow: 0 0 8px rgba(100, 255, 150, 0.4);
            `;
            vfxContainer.appendChild(energyParticle);
        }
        
        // Create healing wave particles
        for (let i = 0; i < 12; i++) {
            const waveParticle = document.createElement('div');
            waveParticle.className = 'pack-healing-wave-particle';
            waveParticle.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 6}px;
                height: ${3 + Math.random() * 6}px;
                background: linear-gradient(45deg, rgba(150, 255, 180, 0.8), rgba(100, 255, 150, 0.4));
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: packHealingWaveFloat ${4 + Math.random() * 2}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
                opacity: ${0.5 + Math.random() * 0.3};
                z-index: 3;
                pointer-events: none;
                filter: blur(0.3px);
            `;
            vfxContainer.appendChild(waveParticle);
        }
        
        // Add CSS animations if not already present
        if (!document.getElementById('pack-healing-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'pack-healing-animations';
            styleSheet.textContent = `
                @keyframes packHealingPulse {
                    0%, 100% { 
                        opacity: 0.3; 
                        transform: scale(1); 
                    }
                    50% { 
                        opacity: 0.6; 
                        transform: scale(1.05); 
                    }
                }
                
                @keyframes packHealingOrb {
                    0% {
                        transform: translateY(0px) translateX(0px) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-60px) translateX(${Math.random() * 40 - 20}px) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes packHealingEnergyFloat {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px) scale(1);
                    }
                    25% {
                        transform: translateY(-15px) translateX(5px) scale(1.2);
                    }
                    50% {
                        transform: translateY(-8px) translateX(-3px) scale(0.8);
                    }
                    75% {
                        transform: translateY(-18px) translateX(8px) scale(1.1);
                    }
                }
                
                @keyframes packHealingWaveFloat {
                    0% {
                        transform: translateY(0px) translateX(0px) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-40px) translateX(${Math.random() * 30 - 15}px) scale(0.3);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created pack healing environment VFX for ${modifier.name}`);
    }

    createPackHealingVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create healing burst effect
        const healingBurst = document.createElement('div');
        healingBurst.className = 'pack-healing-burst';
        healingBurst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(100, 255, 150, 0.6) 0%, rgba(50, 200, 100, 0.3) 50%, transparent 100%);
            border-radius: 50%;
            animation: packHealingBurst 1.5s ease-out;
            pointer-events: none;
            z-index: 95;
        `;
        
        // Create healing particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'pack-healing-particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 96;
        `;
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * 360;
            particle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #64ff96, #32c864);
                border-radius: 50%;
                animation: packHealingParticle 1.2s ease-out;
                animation-delay: ${i * 0.05}s;
                transform-origin: 0 0;
            `;
            particle.style.setProperty('--angle', `${angle}deg`);
            particlesContainer.appendChild(particle);
        }
        
        // Create floating heal amount text
        const healText = document.createElement('div');
        healText.className = 'pack-healing-text';
        healText.textContent = `+${healAmount} HP`;
        healText.style.cssText = `
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #64ff96;
            text-shadow: 
                0 0 10px rgba(100, 255, 150, 0.8),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: floatUpFadeOut 1.5s ease-out;
            pointer-events: none;
            z-index: 97;
        `;
        
        // Create pack bond energy ring
        const bondRing = document.createElement('div');
        bondRing.className = 'pack-bond-ring';
        bondRing.style.cssText = `
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 24px;
            border: 2px solid rgba(100, 255, 150, 0.8);
            border-radius: 50%;
            background: radial-gradient(circle, rgba(100, 255, 150, 0.3), transparent 70%);
            animation: packBondPulse 1.5s ease-out;
            pointer-events: none;
            z-index: 97;
            box-shadow: 
                0 0 8px rgba(100, 255, 150, 0.6),
                inset 0 0 8px rgba(100, 255, 150, 0.4);
        `;
        
        // Add animations if not already present
        if (!document.getElementById('pack-healing-character-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'pack-healing-character-animations';
            styleSheet.textContent = `
                @keyframes packHealingBurst {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.3); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.2); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(1.8); 
                        opacity: 0; 
                    }
                }
                
                @keyframes packHealingParticle {
                    0% {
                        transform: rotate(var(--angle)) translateX(0px) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: rotate(var(--angle)) translateX(40px) scale(0);
                        opacity: 0;
                    }
                }
                
                @keyframes packBondPulse {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 0.8; 
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.3); 
                        opacity: 1; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'pack-healing-character-vfx';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        vfxContainer.appendChild(healingBurst);
        vfxContainer.appendChild(particlesContainer);
        vfxContainer.appendChild(healText);
        vfxContainer.appendChild(bondRing);
        charElement.appendChild(vfxContainer);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.remove();
            }
        }, 2000);
        
        console.log(`[StageModifiers] Created pack healing VFX for ${character.name} (+${healAmount} HP)`);
    }



    createHealingDisabledVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx healing-disabled-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create dark curse overlay
        const darkCurse = document.createElement('div');
        darkCurse.className = 'dark-curse-overlay';
        darkCurse.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at center,
                rgba(64, 0, 64, 0.3) 0%,
                rgba(32, 0, 32, 0.2) 40%,
                rgba(0, 0, 0, 0.1) 100%
            );
            animation: darkCursePulse 3s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 1;
        `;
        vfxContainer.appendChild(darkCurse);
        
        // Create floating dark particles
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'dark-particle';
            const size = 2 + Math.random() * 4;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(64, 0, 64, ${0.6 + Math.random() * 0.4});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: darkParticleFloat ${4 + Math.random() * 6}s linear infinite;
                animation-delay: ${Math.random() * 8}s;
                z-index: 2;
                box-shadow: 0 0 4px rgba(64, 0, 64, 0.8);
            `;
            vfxContainer.appendChild(particle);
        }
        
        // Add CSS animations for healing disabled
        if (!document.getElementById('healing-disabled-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'healing-disabled-styles';
            styleSheet.textContent = `
                @keyframes darkCursePulse {
                    0% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.02); }
                    100% { opacity: 0.4; transform: scale(1); }
                }
                @keyframes darkParticleFloat {
                    0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created healing disabled VFX with dark curse overlay for ${modifier.name}`);
    }

    clearHealingDisabledVFX() {
        const vfxElements = document.querySelectorAll('.healing-disabled-vfx');
        vfxElements.forEach(vfx => vfx.remove());
        console.log(`[StageModifiers] Cleared healing disabled VFX`);
    }

    clearAllVFX() {
        const allModifierVFX = document.querySelectorAll('.stage-modifier-vfx');
        allModifierVFX.forEach(vfx => vfx.remove());
    }

    createAggressiveProtectionVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx aggressive-protection-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create protective aura overlay
        const protectiveAura = document.createElement('div');
        protectiveAura.className = 'protective-aura-overlay';
        protectiveAura.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                ellipse at center,
                rgba(100, 150, 255, 0.08) 0%,
                rgba(150, 100, 255, 0.12) 30%,
                rgba(200, 150, 255, 0.08) 60%,
                rgba(100, 150, 255, 0.05) 100%
            );
            animation: protectiveAuraPulse 3s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(protectiveAura);
        
        // Create floating shield particles
        for (let i = 0; i < 15; i++) {
            const shieldParticle = document.createElement('div');
            shieldParticle.className = 'shield-particle';
            shieldParticle.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 5}px;
                height: ${3 + Math.random() * 5}px;
                background: rgba(150, 180, 255, ${0.7 + Math.random() * 0.3});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: shieldFloat ${4 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                filter: blur(0.5px);
                box-shadow: 0 0 6px rgba(150, 180, 255, 0.8);
                z-index: 3;
            `;
            vfxContainer.appendChild(shieldParticle);
        }
        
        // Create energy rings
        for (let i = 0; i < 4; i++) {
            const energyRing = document.createElement('div');
            energyRing.className = 'energy-ring';
            energyRing.style.cssText = `
                position: absolute;
                width: ${80 + i * 40}px;
                height: ${80 + i * 40}px;
                border: 2px solid rgba(150, 180, 255, ${0.4 - i * 0.1});
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: energyRingPulse ${3 + i * 0.5}s ease-in-out infinite;
                animation-delay: ${i * 0.3}s;
                pointer-events: none;
                z-index: 1;
            `;
            vfxContainer.appendChild(energyRing);
        }
        
        // Create aggressive symbols floating around
        const symbols = ['⚔️', '🛡️', '⚡', '💥'];
        for (let i = 0; i < 8; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'aggressive-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.cssText = `
                position: absolute;
                font-size: ${14 + Math.random() * 6}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: aggressiveFloat ${5 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 4}s;
                opacity: ${0.4 + Math.random() * 0.4};
                z-index: 4;
                pointer-events: none;
                filter: drop-shadow(0 0 4px rgba(150, 180, 255, 0.8));
            `;
            vfxContainer.appendChild(symbol);
        }

        // Add CSS animations
        if (!document.getElementById('aggressive-protection-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aggressive-protection-animations';
            styleSheet.textContent = `
                @keyframes protectiveAuraPulse {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                    100% { opacity: 0.6; transform: scale(1); }
                }
                
                @keyframes shieldFloat {
                    0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
                    100% { transform: translateY(0px) rotate(360deg); opacity: 0.7; }
                }
                
                @keyframes energyRingPulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
                }
                
                @keyframes aggressiveFloat {
                    0% { transform: translateY(0px) rotate(0deg) scale(1); }
                    25% { transform: translateY(-15px) rotate(90deg) scale(1.1); }
                    50% { transform: translateY(-10px) rotate(180deg) scale(0.9); }
                    75% { transform: translateY(-20px) rotate(270deg) scale(1.05); }
                    100% { transform: translateY(0px) rotate(360deg) scale(1); }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created aggressive protection VFX with protective aura and combat symbols for ${modifier.name}`);
    }

    createAggressiveProtectionDodgeVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create dodge enhancement effect
        const dodgeVFX = document.createElement('div');
        dodgeVFX.className = 'aggressive-protection-dodge-vfx';
        dodgeVFX.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 90;
        `;
        
        // Create speed lines effect
        for (let i = 0; i < 8; i++) {
            const speedLine = document.createElement('div');
            speedLine.style.cssText = `
                position: absolute;
                width: 40px;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.8), transparent);
                left: ${Math.random() * 60 + 20}%;
                top: ${Math.random() * 80 + 10}%;
                animation: speedLineFlash 0.6s ease-out;
                animation-delay: ${i * 0.1}s;
                transform: rotate(${Math.random() * 360}deg);
            `;
            dodgeVFX.appendChild(speedLine);
        }
        
        // Create instinct glow
        const instinctGlow = document.createElement('div');
        instinctGlow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120%;
            height: 120%;
            background: radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, transparent 70%);
            animation: instinctPulse 1s ease-out;
            border-radius: 50%;
        `;
        dodgeVFX.appendChild(instinctGlow);
        
        // Create floating text
        const floatingText = document.createElement('div');
        floatingText.textContent = '+30% Dodge';
        floatingText.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: bold;
            color: #64c8ff;
            text-shadow: 0 0 8px rgba(100, 200, 255, 0.8);
            animation: floatUpFadeOut 1.5s ease-out;
            pointer-events: none;
        `;
        dodgeVFX.appendChild(floatingText);
        
        // Add animations if not present
        if (!document.getElementById('aggressive-protection-dodge-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aggressive-protection-dodge-animations';
            styleSheet.textContent = `
                @keyframes speedLineFlash {
                    0% { opacity: 0; transform: translateX(-20px) rotate(var(--rotation, 0deg)); }
                    50% { opacity: 1; transform: translateX(0px) rotate(var(--rotation, 0deg)); }
                    100% { opacity: 0; transform: translateX(20px) rotate(var(--rotation, 0deg)); }
                }
                
                @keyframes instinctPulse {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        charElement.appendChild(dodgeVFX);
        
        // Remove after animation
        setTimeout(() => {
            if (dodgeVFX.parentNode) {
                dodgeVFX.remove();
            }
        }, 1500);
        
        console.log(`[AggressiveProtection] Created dodge bonus VFX for ${character.name}`);
    }

    createAggressiveProtectionDamageVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create damage enhancement effect
        const damageVFX = document.createElement('div');
        damageVFX.className = 'aggressive-protection-damage-vfx';
        damageVFX.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 90;
        `;
        
        // Create combat aura
        const combatAura = document.createElement('div');
        combatAura.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 130%;
            height: 130%;
            background: radial-gradient(circle, rgba(255, 100, 100, 0.2) 0%, rgba(255, 150, 50, 0.1) 50%, transparent 70%);
            animation: combatAuraPulse 1.2s ease-out;
            border-radius: 50%;
        `;
        damageVFX.appendChild(combatAura);
        
        // Create power sparks
        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div');
            spark.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #ff6464, #ff9632);
                border-radius: 50%;
                left: ${45 + Math.random() * 10}%;
                top: ${45 + Math.random() * 10}%;
                animation: powerSpark 0.8s ease-out;
                animation-delay: ${i * 0.05}s;
                box-shadow: 0 0 6px rgba(255, 100, 100, 0.8);
            `;
            damageVFX.appendChild(spark);
        }
        
        // Create floating damage text
        const damageText = document.createElement('div');
        damageText.textContent = '+Damage';
        damageText.style.cssText = `
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: bold;
            color: #ff6464;
            text-shadow: 0 0 8px rgba(255, 100, 100, 0.8);
            animation: floatUpFadeOut 1.5s ease-out;
            pointer-events: none;
        `;
        damageVFX.appendChild(damageText);
        
        // Add animations if not present
        if (!document.getElementById('aggressive-protection-damage-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aggressive-protection-damage-animations';
            styleSheet.textContent = `
                @keyframes combatAuraPulse {
                    0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
                    40% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
                
                @keyframes powerSpark {
                    0% { 
                        transform: scale(0) rotate(0deg); 
                        opacity: 0; 
                    }
                    50% { 
                        transform: scale(1.5) rotate(180deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: scale(0.5) rotate(360deg) translateY(-30px); 
                        opacity: 0; 
                    }
                }
                
                @keyframes floatUpFadeOut {
                    0% { transform: translateX(-50%) translateY(0px); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        charElement.appendChild(damageVFX);
        
        // Remove after animation
        setTimeout(() => {
            if (damageVFX.parentNode) {
                damageVFX.remove();
            }
        }, 1500);
        
        console.log(`[AggressiveProtection] Created damage bonus VFX for ${character.name}`);
    }

    createAquaticHomeProtectorVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx aquatic-home-protector-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create aquatic healing overlay with flowing water effect
        const aquaticOverlay = document.createElement('div');
        aquaticOverlay.className = 'aquatic-healing-overlay';
        aquaticOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 30% 20%, rgba(0, 150, 255, 0.15) 0%, rgba(100, 200, 255, 0.1) 25%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(100, 200, 255, 0.12) 0%, rgba(0, 180, 255, 0.08) 30%, transparent 60%),
                linear-gradient(45deg, rgba(0, 150, 255, 0.08) 0%, rgba(100, 200, 255, 0.12) 50%, rgba(0, 150, 255, 0.08) 100%);
            animation: aquaticFlow 6s ease-in-out infinite alternate, aquaticPulse 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
            filter: blur(1px);
        `;
        vfxContainer.appendChild(aquaticOverlay);
        
        // Create floating water bubbles
        for (let i = 0; i < 25; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'aquatic-bubble';
            const size = 4 + Math.random() * 12;
            bubble.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, rgba(0, 150, 255, 0.4) 50%, rgba(100, 200, 255, 0.2) 100%);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: aquaticBubbleFloat ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 4}s;
                filter: blur(0.5px);
                box-shadow: 0 0 8px rgba(100, 200, 255, 0.6);
                z-index: 3;
            `;
            vfxContainer.appendChild(bubble);
        }
        
        // Create healing water streams
        for (let i = 0; i < 15; i++) {
            const stream = document.createElement('div');
            stream.className = 'aquatic-healing-stream';
            const width = 2 + Math.random() * 4;
            const height = 30 + Math.random() * 50;
            stream.style.cssText = `
                position: absolute;
                width: ${width}px;
                height: ${height}px;
                background: linear-gradient(180deg, rgba(100, 200, 255, 0.8) 0%, rgba(0, 150, 255, 0.6) 50%, transparent 100%);
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: aquaticStreamFlow ${2 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                filter: blur(0.5px);
                z-index: 4;
                border-radius: 50%;
            `;
            vfxContainer.appendChild(stream);
        }
        
        // Create floating water droplets
        for (let i = 0; i < 20; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'aquatic-droplet';
            const size = 3 + Math.random() * 6;
            droplet.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(150, 220, 255, 0.9) 0%, rgba(100, 200, 255, 0.6) 70%, transparent 100%);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: aquaticDropletFloat ${4 + Math.random() * 3}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                opacity: ${0.6 + Math.random() * 0.4};
                z-index: 5;
                box-shadow: 0 0 4px rgba(150, 220, 255, 0.8);
            `;
            vfxContainer.appendChild(droplet);
        }
        
        // Add CSS animations for aquatic home protector
        if (!document.getElementById('aquatic-home-protector-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aquatic-home-protector-styles';
            styleSheet.textContent = `
                @keyframes aquaticFlow {
                    0% { 
                        transform: translateX(0px) scale(1); 
                        opacity: 0.6; 
                    }
                    50% { 
                        transform: translateX(20px) scale(1.05); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translateX(-10px) scale(0.95); 
                        opacity: 0.7; 
                    }
                }
                
                @keyframes aquaticPulse {
                    0%, 100% { 
                        opacity: 0.6; 
                        transform: scale(1); 
                    }
                    50% { 
                        opacity: 0.9; 
                        transform: scale(1.02); 
                    }
                }
                
                @keyframes aquaticBubbleFloat {
                    0% {
                        transform: translateY(0px) translateX(0px) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-80px) translateX(${Math.random() * 40 - 20}px) scale(0.3);
                        opacity: 0;
                    }
                }
                
                @keyframes aquaticStreamFlow {
                    0%, 100% {
                        transform: translateY(0px) scaleY(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: translateY(-20px) scaleY(1.3);
                        opacity: 1;
                    }
                }
                
                @keyframes aquaticDropletFloat {
                    0% {
                        transform: translateY(0px) translateX(0px) scale(0.8);
                        opacity: 0;
                    }
                    25% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                    75% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-60px) translateX(${Math.random() * 30 - 15}px) scale(0.4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created aquatic home protector VFX with healing waters for ${modifier.name}`);
    }

    createAquaticHealingVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create aquatic healing burst effect
        const aquaticVfx = document.createElement('div');
        aquaticVfx.className = 'aquatic-healing-character-vfx';
        aquaticVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 95;
        `;
        
        // Create healing water burst
        const waterBurst = document.createElement('div');
        waterBurst.className = 'aquatic-healing-burst';
        waterBurst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(100, 200, 255, 0.6) 0%, rgba(0, 150, 255, 0.4) 40%, rgba(100, 200, 255, 0.2) 70%, transparent 100%);
            border-radius: 50%;
            animation: aquaticHealingBurst 1.8s ease-out;
            z-index: 94;
        `;
        
        // Create floating heal amount text
        const healText = document.createElement('div');
        healText.className = 'aquatic-healing-text';
        healText.textContent = `+${healAmount} HP`;
        healText.style.cssText = `
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 16px;
            font-weight: bold;
            color: #64c8ff;
            text-shadow: 
                0 0 10px rgba(100, 200, 255, 0.8),
                0 0 20px rgba(0, 150, 255, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: aquaticFloatingText 2s ease-out;
            pointer-events: none;
            z-index: 96;
        `;
        
        // Create water healing particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'aquatic-healing-particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 95;
        `;
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'aquatic-healing-particle';
            const size = 6 + Math.random() * 10;
            const angle = (i / 15) * 360;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(150, 220, 255, 0.9) 0%, rgba(100, 200, 255, 0.6) 50%, transparent 100%);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: aquaticHealingParticle 1.5s ease-out;
                animation-delay: ${i * 0.08}s;
                box-shadow: 0 0 6px rgba(150, 220, 255, 0.8);
                z-index: 93;
            `;
            particle.style.setProperty('--angle', `${angle}deg`);
            particle.style.setProperty('--distance', `${50 + Math.random() * 30}px`);
            particlesContainer.appendChild(particle);
        }
        
        // Create protective water ring
        const protectiveRing = document.createElement('div');
        protectiveRing.className = 'aquatic-protective-ring';
        protectiveRing.style.cssText = `
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            border: 3px solid rgba(100, 200, 255, 0.8);
            border-radius: 50%;
            background: radial-gradient(circle, rgba(100, 200, 255, 0.3), transparent 70%);
            animation: aquaticProtectiveRing 1.8s ease-out;
            pointer-events: none;
            z-index: 96;
            box-shadow: 
                0 0 12px rgba(100, 200, 255, 0.6),
                inset 0 0 12px rgba(100, 200, 255, 0.4);
        `;
        
        // Add character-specific animations if not already present
        if (!document.getElementById('aquatic-healing-character-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aquatic-healing-character-animations';
            styleSheet.textContent = `
                @keyframes aquaticHealingBurst {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.3); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.3); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2); 
                        opacity: 0; 
                    }
                }
                
                @keyframes aquaticFloatingText {
                    0% { 
                        transform: translateX(-50%) scale(0.8) rotate(0deg); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.2) rotate(2deg); 
                        opacity: 1; 
                    }
                    40% { 
                        transform: translateX(-50%) scale(1) rotate(-1deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.9) rotate(0deg) translateY(-25px); 
                        opacity: 0; 
                    }
                }
                
                @keyframes aquaticHealingParticle {
                    0% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0px) scale(0.5);
                        opacity: 0;
                    }
                    30% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(var(--distance) * 0.6)) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0.2);
                        opacity: 0;
                    }
                }
                
                @keyframes aquaticProtectiveRing {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 0.8; 
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.4); 
                        opacity: 1; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        aquaticVfx.appendChild(waterBurst);
        aquaticVfx.appendChild(healText);
        aquaticVfx.appendChild(particlesContainer);
        aquaticVfx.appendChild(protectiveRing);
        charElement.appendChild(aquaticVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (aquaticVfx.parentNode) {
                aquaticVfx.remove();
            }
        }, 2500);
        
        console.log(`[StageModifiers] Created aquatic healing VFX for ${character.name} (+${healAmount} HP)`);
    }

    createAquaticLifestealVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create aquatic lifesteal effect with a different style than regular healing
        const lifestealVfx = document.createElement('div');
        lifestealVfx.className = 'aquatic-lifesteal-character-vfx';
        lifestealVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 92;
        `;
        
        // Create lifesteal water swirl
        const waterSwirl = document.createElement('div');
        waterSwirl.className = 'aquatic-lifesteal-swirl';
        waterSwirl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(0, 200, 255, 0.7) 0%, rgba(100, 255, 200, 0.5) 40%, rgba(0, 150, 255, 0.3) 70%, transparent 100%);
            border-radius: 50%;
            animation: aquaticLifestealSwirl 1.5s ease-out;
            z-index: 91;
        `;
        
        // Create floating lifesteal text with different color
        const lifestealText = document.createElement('div');
        lifestealText.className = 'aquatic-lifesteal-text';
        lifestealText.textContent = `+${healAmount} HP`;
        lifestealText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #00ff80;
            text-shadow: 
                0 0 8px rgba(0, 255, 128, 0.8),
                0 0 16px rgba(100, 255, 200, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: aquaticLifestealText 1.8s ease-out;
            pointer-events: none;
            z-index: 93;
        `;
        
        // Create lifesteal energy streams
        const streamsContainer = document.createElement('div');
        streamsContainer.className = 'aquatic-lifesteal-streams';
        streamsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 90;
        `;
        
        for (let i = 0; i < 8; i++) {
            const stream = document.createElement('div');
            stream.className = 'aquatic-lifesteal-stream';
            const angle = (i / 8) * 360;
            stream.style.cssText = `
                position: absolute;
                width: 3px;
                height: 40px;
                background: linear-gradient(180deg, rgba(0, 255, 128, 0.8) 0%, rgba(100, 255, 200, 0.6) 50%, transparent 100%);
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(${angle}deg);
                animation: aquaticLifestealStream 1.2s ease-out;
                animation-delay: ${i * 0.1}s;
                border-radius: 50%;
                z-index: 89;
            `;
            streamsContainer.appendChild(stream);
        }
        
        // Create combat energy indicator
        const combatIndicator = document.createElement('div');
        combatIndicator.className = 'aquatic-combat-indicator';
        combatIndicator.textContent = '⚔️';
        combatIndicator.style.cssText = `
            position: absolute;
            top: 75%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 16px;
            animation: aquaticCombatPulse 1.5s ease-out;
            pointer-events: none;
            z-index: 94;
            filter: drop-shadow(0 0 6px rgba(0, 255, 128, 0.8));
        `;
        
        // Add lifesteal-specific animations if not already present
        if (!document.getElementById('aquatic-lifesteal-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'aquatic-lifesteal-animations';
            styleSheet.textContent = `
                @keyframes aquaticLifestealSwirl {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.5) rotate(0deg); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.2) rotate(120deg); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(1.5) rotate(360deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes aquaticLifestealText {
                    0% { 
                        transform: translateX(-50%) scale(0.7) rotate(-3deg); 
                        opacity: 0; 
                    }
                    25% { 
                        transform: translateX(-50%) scale(1.2) rotate(2deg); 
                        opacity: 1; 
                    }
                    50% { 
                        transform: translateX(-50%) scale(1) rotate(-1deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.8) rotate(0deg) translateY(-20px); 
                        opacity: 0; 
                    }
                }
                
                @keyframes aquaticLifestealStream {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scaleY(0); 
                    }
                    40% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scaleY(1.3); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scaleY(0.5) translateY(-20px); 
                    }
                }
                
                @keyframes aquaticCombatPulse {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 0.7; 
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.3); 
                        opacity: 1; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        lifestealVfx.appendChild(waterSwirl);
        lifestealVfx.appendChild(lifestealText);
        lifestealVfx.appendChild(streamsContainer);
        lifestealVfx.appendChild(combatIndicator);
        charElement.appendChild(lifestealVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (lifestealVfx.parentNode) {
                lifestealVfx.remove();
            }
        }, 2000);
        
        console.log(`[StageModifiers] Created aquatic lifesteal VFX for ${character.name} (+${healAmount} HP from damage)`);
    }

    createIcyPreservationVFX(modifier) {
        const gameContainer = document.querySelector('.game-container') || document.body;
        
        // Create ice preservation overlay
        const icyOverlay = document.createElement('div');
        icyOverlay.id = 'icy-preservation-vfx';
        icyOverlay.className = 'icy-preservation-environment-vfx';
        icyOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10;
            background: linear-gradient(
                135deg, 
                rgba(173, 216, 230, 0.15) 0%, 
                rgba(135, 206, 235, 0.12) 25%,
                rgba(176, 224, 230, 0.18) 50%,
                rgba(173, 216, 230, 0.15) 75%,
                rgba(135, 206, 235, 0.12) 100%
            );
            animation: icyPreservationPulse 4s ease-in-out infinite;
        `;
        
        // Create ice crystals container
        const crystalsContainer = document.createElement('div');
        crystalsContainer.className = 'icy-crystals-container';
        crystalsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 11;
        `;
        
        // Create multiple ice crystals
        for (let i = 0; i < 15; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'ice-crystal';
            crystal.textContent = '❄️';
            const randomX = Math.random() * 100;
            const randomY = Math.random() * 100;
            const randomDelay = Math.random() * 3;
            const randomDuration = 6 + Math.random() * 4;
            
            crystal.style.cssText = `
                position: absolute;
                left: ${randomX}%;
                top: ${randomY}%;
                font-size: ${12 + Math.random() * 8}px;
                opacity: 0.6;
                animation: iceCrystalFloat ${randomDuration}s ease-in-out infinite;
                animation-delay: ${randomDelay}s;
                filter: drop-shadow(0 0 4px rgba(173, 216, 230, 0.8));
                z-index: 12;
            `;
            crystalsContainer.appendChild(crystal);
        }
        
        // Create frost border effect
        const frostBorder = document.createElement('div');
        frostBorder.className = 'frost-border';
        frostBorder.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid rgba(173, 216, 230, 0.4);
            box-shadow: 
                inset 0 0 20px rgba(173, 216, 230, 0.3),
                0 0 30px rgba(135, 206, 235, 0.2);
            pointer-events: none;
            z-index: 13;
            animation: frostBorderGlow 3s ease-in-out infinite alternate;
        `;
        
        // Add ice preservation animations if not already present
        if (!document.getElementById('icy-preservation-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'icy-preservation-animations';
            styleSheet.textContent = `
                @keyframes icyPreservationPulse {
                    0%, 100% { 
                        opacity: 0.8; 
                        transform: scale(1); 
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.02); 
                    }
                }
                
                @keyframes iceCrystalFloat {
                    0%, 100% { 
                        transform: translateY(0px) rotate(0deg); 
                        opacity: 0.6; 
                    }
                    25% { 
                        transform: translateY(-10px) rotate(90deg); 
                        opacity: 0.8; 
                    }
                    50% { 
                        transform: translateY(-5px) rotate(180deg); 
                        opacity: 1; 
                    }
                    75% { 
                        transform: translateY(-15px) rotate(270deg); 
                        opacity: 0.8; 
                    }
                }
                
                @keyframes frostBorderGlow {
                    0% { 
                        box-shadow: 
                            inset 0 0 20px rgba(173, 216, 230, 0.3),
                            0 0 30px rgba(135, 206, 235, 0.2);
                    }
                    100% { 
                        box-shadow: 
                            inset 0 0 40px rgba(173, 216, 230, 0.6),
                            0 0 50px rgba(135, 206, 235, 0.4);
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        icyOverlay.appendChild(crystalsContainer);
        icyOverlay.appendChild(frostBorder);
        gameContainer.appendChild(icyOverlay);
        
        console.log('[StageModifiers] Created Icy Preservation environment VFX');
    }

    clearIcyPreservationVFX() {
        const icyVfx = document.getElementById('icy-preservation-vfx');
        if (icyVfx) {
            icyVfx.remove();
        }
        console.log('[StageModifiers] Cleared Icy Preservation VFX');
    }

    createCleansingWindsVFX(character) {
        const characterElement = document.querySelector(`[data-character-id="${character.id}"]`);
        if (!characterElement) return;
        
        // Create cleansing winds VFX container
        const cleansingVfx = document.createElement('div');
        cleansingVfx.className = 'cleansing-winds-vfx';
        cleansingVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            border-radius: 10px;
            overflow: hidden;
        `;
        
        // Create swirling wind effect
        const windSwirl = document.createElement('div');
        windSwirl.className = 'wind-swirl';
        windSwirl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            transform: translate(-50%, -50%);
            background: conic-gradient(
                from 0deg,
                rgba(135, 206, 250, 0.8) 0deg,
                rgba(175, 238, 238, 0.6) 90deg,
                rgba(240, 248, 255, 0.4) 180deg,
                rgba(175, 238, 238, 0.6) 270deg,
                rgba(135, 206, 250, 0.8) 360deg
            );
            border-radius: 50%;
            animation: windSwirlRotate 1.5s ease-out;
            filter: blur(2px) drop-shadow(0 0 10px rgba(135, 206, 250, 0.6));
        `;
        
        // Create cleansing particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'cleansing-particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        // Create multiple cleansing particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'cleansing-particle';
            particle.textContent = '✨';
            const angle = (i / 8) * 360;
            const delay = i * 0.1;
            
            particle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                font-size: 16px;
                color: rgba(135, 206, 250, 0.9);
                transform: translate(-50%, -50%) rotate(${angle}deg) translateX(40px);
                animation: cleansingParticleFloat 1.5s ease-out;
                animation-delay: ${delay}s;
                filter: drop-shadow(0 0 4px rgba(135, 206, 250, 0.8));
            `;
            particlesContainer.appendChild(particle);
        }
        
        // Create cleansing text
        const cleansingText = document.createElement('div');
        cleansingText.className = 'cleansing-text';
        cleansingText.textContent = 'CLEANSED';
        cleansingText.style.cssText = `
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: bold;
            color: rgba(135, 206, 250, 1);
            text-shadow: 0 0 6px rgba(135, 206, 250, 0.8);
            animation: cleansingTextFloat 1.5s ease-out;
            z-index: 101;
        `;
        
        // Add animations if not already present
        if (!document.getElementById('cleansing-winds-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'cleansing-winds-animations';
            styleSheet.textContent = `
                @keyframes windSwirlRotate {
                    0% { 
                        transform: translate(-50%, -50%) rotate(0deg) scale(0.2);
                        opacity: 0;
                    }
                    50% { 
                        transform: translate(-50%, -50%) rotate(180deg) scale(1.2);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) rotate(360deg) scale(0.8);
                        opacity: 0;
                    }
                }
                
                @keyframes cleansingParticleFloat {
                    0% { 
                        transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(20px) scale(0);
                        opacity: 0;
                    }
                    30% { 
                        transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(50px) scale(1.2);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(80px) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes cleansingTextFloat {
                    0% { 
                        transform: translateX(-50%) translateY(20px) scale(0.5);
                        opacity: 0;
                    }
                    30% { 
                        transform: translateX(-50%) translateY(0px) scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(-20px) scale(0.8);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        cleansingVfx.appendChild(windSwirl);
        cleansingVfx.appendChild(particlesContainer);
        cleansingVfx.appendChild(cleansingText);
        characterElement.appendChild(cleansingVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (cleansingVfx.parentNode) {
                cleansingVfx.remove();
            }
        }, 2000);
        
        console.log(`[StageModifiers] Created cleansing winds VFX for ${character.name}`);
    }

    createCleansingWindsScreenVFX() {
        // Create full-screen cleansing effect
        const screenVFX = document.createElement('div');
        screenVFX.className = 'cleansing-winds-screen-vfx';
        screenVFX.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(173, 216, 230, 0.3) 0%, rgba(135, 206, 235, 0.2) 50%, rgba(30, 144, 255, 0.1) 100%);
            animation: cleansingWindsScreen 3s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(screenVFX);
        
        // Remove after animation
        setTimeout(() => {
            screenVFX.remove();
        }, 3000);
        
        console.log('[StageModifiers] Created cleansing winds screen VFX');
    }

    createAtlanteanPurificationVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;

        // Create purifying water aura around character
        const purificationAura = document.createElement('div');
        purificationAura.className = 'atlantean-purification-aura';
        purificationAura.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(100, 200, 255, 0.4) 0%, rgba(50, 150, 255, 0.2) 50%, transparent 70%);
            border-radius: 50%;
            animation: atlanteanPurificationAura 2.5s ease-in-out;
            pointer-events: none;
            z-index: 100;
        `;
        characterElement.appendChild(purificationAura);

        // Create water droplets floating around character
        const dropletsContainer = document.createElement('div');
        dropletsContainer.className = 'atlantean-purification-droplets';
        dropletsContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            pointer-events: none;
            z-index: 101;
        `;
        characterElement.appendChild(dropletsContainer);

        // Add multiple water droplets
        for (let i = 0; i < 12; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'atlantean-droplet';
            droplet.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #64C8FF, #3296FF);
                border-radius: 50% 50% 50% 0;
                transform-origin: center;
                animation: atlanteanDropletFloat 2s ease-in-out infinite;
                animation-delay: ${i * 0.1}s;
                left: 50%;
                top: 10px;
                transform: translate(-50%, 0) rotate(${i * 30}deg);
            `;
            dropletsContainer.appendChild(droplet);
        }

        // Create cleansing sparkles
        const sparklesContainer = document.createElement('div');
        sparklesContainer.className = 'atlantean-purification-sparkles';
        sparklesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 102;
        `;
        characterElement.appendChild(sparklesContainer);

        // Add sparkle particles
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'atlantean-sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #FFFFFF, #64C8FF);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(100, 200, 255, 0.8);
                left: ${20 + Math.random() * 60}%;
                top: ${20 + Math.random() * 60}%;
                animation: atlanteanSparkle 1.5s ease-in-out infinite;
                animation-delay: ${Math.random() * 1}s;
            `;
            sparklesContainer.appendChild(sparkle);
        }

        // Create purification ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'atlantean-purification-ripple';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border: 2px solid rgba(100, 200, 255, 0.6);
            border-radius: 50%;
            animation: atlanteanPurificationRipple 2.5s ease-out;
            pointer-events: none;
            z-index: 99;
        `;
        characterElement.appendChild(ripple);

        // Cleanup after animation
        setTimeout(() => {
            purificationAura.remove();
            dropletsContainer.remove();
            sparklesContainer.remove();
            ripple.remove();
        }, 2500);

        console.log(`[StageModifiers] Created Atlantean purification VFX for ${character.name}`);
    }

    createAtlanteanPurificationScreenVFX() {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;

        // Create screen-wide water wave effect
        const waterWave = document.createElement('div');
        waterWave.className = 'atlantean-purification-screen-wave';
        waterWave.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, rgba(100, 200, 255, 0.3) 0%, rgba(50, 150, 255, 0.15) 50%, transparent 70%);
            animation: atlanteanScreenWave 3s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(waterWave);

        // Create floating water particles across screen
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'atlantean-purification-screen-particles';
        particlesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1001;
        `;
        document.body.appendChild(particlesContainer);

        // Add floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'atlantean-screen-particle';
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(100, 200, 255, 0.6));
                border-radius: 50% 50% 50% 0;
                box-shadow: 0 0 6px rgba(100, 200, 255, 0.6);
                left: ${Math.random() * 100}%;
                top: 100vh;
                animation: atlanteanScreenParticleFloat ${2 + Math.random() * 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            particlesContainer.appendChild(particle);
        }

        // Create purification light flash
        const lightFlash = document.createElement('div');
        lightFlash.className = 'atlantean-purification-flash';
        lightFlash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, rgba(100, 200, 255, 0.2) 30%, transparent 60%);
            animation: atlanteanPurificationFlash 1s ease-out;
            pointer-events: none;
            z-index: 1002;
        `;
        document.body.appendChild(lightFlash);

        // Cleanup after animation
        setTimeout(() => {
            waterWave.remove();
            particlesContainer.remove();
            lightFlash.remove();
        }, 3000);

        console.log('[StageModifiers] Created Atlantean purification screen VFX');
    }

    createDraftModeVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx draft-mode-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create enhancement aura overlay
        const enhancementAura = document.createElement('div');
        enhancementAura.className = 'draft-enhancement-aura';
        enhancementAura.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at center,
                rgba(255, 215, 0, 0.15) 0%,
                rgba(255, 140, 0, 0.1) 30%,
                rgba(138, 43, 226, 0.08) 60%,
                rgba(75, 0, 130, 0.05) 100%
            );
            animation: draftModeAura 6s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(enhancementAura);
        
        // Create floating enhancement particles
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'draft-enhancement-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #ffd700, #ff8c00);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: draftParticleFloat ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
                pointer-events: none;
                z-index: 3;
            `;
            vfxContainer.appendChild(particle);
        }
        
        // Create power surge lines
        for (let i = 0; i < 8; i++) {
            const surgeLine = document.createElement('div');
            surgeLine.className = 'draft-power-surge';
            surgeLine.style.cssText = `
                position: absolute;
                width: 2px;
                height: 60px;
                background: linear-gradient(to bottom, rgba(255, 215, 0, 0.8), rgba(138, 43, 226, 0.4));
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                transform: rotate(${Math.random() * 360}deg);
                animation: draftPowerSurge ${2 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 1.5}s;
                pointer-events: none;
                z-index: 1;
            `;
            vfxContainer.appendChild(surgeLine);
        }

        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        } else {
            // Fallback to battle container
            const battleContainer = document.querySelector('.battle-container');
            if (battleContainer) {
                battleContainer.appendChild(vfxContainer);
            }
        }

        console.log(`[StageModifiers] Created draft mode VFX with enhancement aura and particles for ${modifier.name}`);
    }

    clearDraftModeVFX() {
        const existingVFX = document.querySelectorAll('.draft-mode-vfx');
        existingVFX.forEach(vfx => vfx.remove());
        console.log('[StageModifiers] Cleared draft mode VFX');
    }

    // Helper method to apply desert heat effect to all characters
    applyDesertHeatEffect(gameManager, modifier, isStageStart) {
        console.log(`[DesertHeat] applyDesertHeatEffect called - isStageStart: ${isStageStart}`);
        
        // Add a delay to ensure characters are fully loaded
        const applyEffect = () => {
            const allCharacters = [
                ...(gameManager.gameState?.playerCharacters || []),
                ...(gameManager.gameState?.aiCharacters || [])
            ];

            console.log(`[DesertHeat] Found ${allCharacters.length} characters to process for Desert Heat`);
            
            if (allCharacters.length === 0) {
                console.warn(`[DesertHeat] No characters found! Retrying in 500ms...`);
                setTimeout(applyEffect, 500);
                return;
            }
            
            let affectedCharacters = [];
            
            allCharacters.forEach(character => {
                if (!character.isDead()) {
                    // Store original values if not already stored
                    if (character.originalCritChance === undefined) {
                        character.originalCritChance = character.stats.critChance || 0;
                        console.log(`[DesertHeat] Stored original crit chance for ${character.name}: ${character.originalCritChance}`);
                    }
                    
                    if (character.originalHpPerTurn === undefined) {
                        character.originalHpPerTurn = character.stats.hpPerTurn || 0;
                        console.log(`[DesertHeat] Stored original HP regen for ${character.name}: ${character.originalHpPerTurn}`);
                    }
                    
                    if (character.originalManaPerTurn === undefined) {
                        character.originalManaPerTurn = character.stats.manaPerTurn || 0;
                        console.log(`[DesertHeat] Stored original mana regen for ${character.name}: ${character.originalManaPerTurn}`);
                    }
                    
                    // Set crit chance to 50%
                    const targetCritChance = 0.5;
                    console.log(`[DesertHeat] Setting ${character.name}'s crit chance from ${character.stats.critChance} to ${targetCritChance}`);
                    character.stats.critChance = targetCritChance;
                    
                    // Set HP regeneration to 50
                    const targetHpRegen = 50;
                    console.log(`[DesertHeat] Setting ${character.name}'s HP regen from ${character.stats.hpPerTurn} to ${targetHpRegen}`);
                    character.stats.hpPerTurn = targetHpRegen;
                    
                    // Set mana regeneration to 50
                    const targetManaRegen = 50;
                    console.log(`[DesertHeat] Setting ${character.name}'s mana regen from ${character.stats.manaPerTurn} to ${targetManaRegen}`);
                    character.stats.manaPerTurn = targetManaRegen;
                    
                    affectedCharacters.push(character.name);
                    
                    // Force recalculate stats to ensure the change is properly applied
                    if (character.recalculateStats) {
                        character.recalculateStats('desert_heat_modifier');
                    }
                    
                    // Force UI update
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(character);
                    }
                }
            });

            console.log(`[DesertHeat] Affected characters: ${affectedCharacters.join(', ')}`);

            // Add log entry
            if (isStageStart && affectedCharacters.length > 0) {
                gameManager.addLogEntry(
                    `🌵 The desert heat intensifies everyone's focus! All characters gain 50% critical strike chance, 50 HP regen, and 50 mana regen.`, 
                    'stage-effect dramatic'
                );
            } else if (!isStageStart && affectedCharacters.length > 0) {
                gameManager.addLogEntry(
                    `🌵 The desert heat continues to sharpen everyone's reflexes and vitality.`, 
                    'stage-effect'
                );
            }
        };
        
        // Apply immediately if characters exist, otherwise wait for them
        if (isStageStart) {
            setTimeout(applyEffect, 100); // Small delay for stage start
        } else {
            applyEffect(); // Apply immediately for turn start
        }
    }
    // ==== FREEZING WATERS VFX METHODS ====
    createFreezingWatersVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx freezing-waters-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create ice crystal overlay
        const iceCrystalOverlay = document.createElement('div');
        iceCrystalOverlay.className = 'ice-crystal-overlay';
        iceCrystalOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at center,
                rgba(173, 216, 230, 0.2) 0%,
                rgba(135, 206, 235, 0.15) 30%,
                rgba(30, 144, 255, 0.1) 60%,
                rgba(0, 191, 255, 0.05) 100%
            );
            animation: freezingWatersAura 8s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(iceCrystalOverlay);
        
        // Create floating ice crystals
        for (let i = 0; i < 30; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'freezing-waters-crystal';
            crystal.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 5}px;
                height: ${3 + Math.random() * 5}px;
                background: radial-gradient(circle, #87ceeb, #4169e1);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: freezingCrystalFloat ${4 + Math.random() * 6}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                box-shadow: 0 0 8px rgba(135, 206, 235, 0.8);
                pointer-events: none;
                z-index: 3;
            `;
            vfxContainer.appendChild(crystal);
        }
        
        // Create frost waves
        for (let i = 0; i < 12; i++) {
            const frostWave = document.createElement('div');
            frostWave.className = 'freezing-frost-wave';
            frostWave.style.cssText = `
                position: absolute;
                width: 1px;
                height: 40px;
                background: linear-gradient(to bottom, rgba(173, 216, 230, 0.9), rgba(30, 144, 255, 0.3));
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                transform: rotate(${Math.random() * 360}deg);
                animation: freezingFrostWave ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                pointer-events: none;
                z-index: 1;
            `;
            vfxContainer.appendChild(frostWave);
        }

        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        } else {
            // Fallback to battle container
            const battleContainer = document.querySelector('.battle-container');
            if (battleContainer) {
                battleContainer.appendChild(vfxContainer);
            }
        }

        console.log(`[StageModifiers] Created freezing waters VFX with ice crystals and frost waves for ${modifier.name}`);
    }

    showFreezingWatersApplicationVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;
        
        // Add freeze overlay if not already present
        let freezeOverlay = characterElement.querySelector('.freeze-overlay');
        if (!freezeOverlay) {
            freezeOverlay = document.createElement('div');
            freezeOverlay.className = 'freeze-overlay freezing-waters-freeze';
            freezeOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(173, 216, 230, 0.4), rgba(30, 144, 255, 0.2));
                border: 2px solid rgba(135, 206, 235, 0.6);
                border-radius: 8px;
                animation: freezingWatersFreeze 2s ease-in-out;
                pointer-events: none;
                z-index: 10;
            `;
            characterElement.appendChild(freezeOverlay);
        }
        
        // Create ice crystal burst
        for (let i = 0; i < 12; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'freeze-crystal-burst';
            crystal.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #87ceeb, #4169e1);
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: freezeCrystalBurst 1.5s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                box-shadow: 0 0 6px rgba(135, 206, 235, 0.8);
                pointer-events: none;
                z-index: 11;
            `;
            
            const angle = (i / 12) * 360;
            const distance = 30 + Math.random() * 20;
            crystal.style.setProperty('--angle', angle + 'deg');
            crystal.style.setProperty('--distance', distance + 'px');
            
            characterElement.appendChild(crystal);
            
            setTimeout(() => crystal.remove(), 1500);
        }
        
        // Show freeze indicator on character
        this.showFreezingWatersIndicator(character);
    }

    showFreezingWatersIndicator(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;
        
        let freezeIndicator = characterElement.querySelector('.freeze-indicator');
        if (!freezeIndicator) {
            freezeIndicator = document.createElement('div');
            freezeIndicator.className = 'freeze-indicator freezing-waters-indicator';
            freezeIndicator.innerHTML = '❄️';
            freezeIndicator.style.cssText = `
                position: absolute;
                top: -10px;
                right: -10px;
                font-size: 20px;
                animation: freezingWatersIndicator 2s ease-in-out infinite;
                text-shadow: 0 0 6px rgba(135, 206, 235, 0.8);
                pointer-events: none;
                z-index: 12;
            `;
            characterElement.appendChild(freezeIndicator);
        }
    }

    removeFreezingWatersVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;

        // Create melt effect
        const overlays = characterElement.querySelectorAll('.freeze-overlay');
        overlays.forEach(overlay => {
            overlay.style.transition = 'opacity 1s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 1000);
        });
        
        // Fade indicators
        const indicators = characterElement.querySelectorAll('.freeze-indicator');
        indicators.forEach(indicator => {
            indicator.style.transition = 'opacity 0.8s ease-out';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 800);
        });
    }

    clearFreezingWatersVFX() {
        const existingVFX = document.querySelectorAll('.freezing-waters-vfx');
        existingVFX.forEach(vfx => vfx.remove());
        
        // Also clear any character freeze overlays
        const freezeOverlays = document.querySelectorAll('.freezing-waters-freeze');
        freezeOverlays.forEach(overlay => overlay.remove());
        
        const freezeIndicators = document.querySelectorAll('.freezing-waters-indicator');
        freezeIndicators.forEach(indicator => indicator.remove());
        
        console.log('[StageModifiers] Cleared freezing waters VFX');
    }

    createTidalWaveChaosBattlefieldVFX() {
        // Clear any existing tidal wave VFX
        this.clearTidalWaveVFX();
        
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;
        
        // Create main wave container
        const waveContainer = document.createElement('div');
        waveContainer.className = 'tidal-wave-chaos-container';
        waveContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        // Create massive wave that sweeps across the screen
        const massiveWave = document.createElement('div');
        massiveWave.className = 'tidal-massive-wave';
        massiveWave.style.cssText = `
            position: absolute;
            width: 200%;
            height: 150%;
            background: linear-gradient(
                45deg,
                rgba(0, 100, 200, 0.9) 0%,
                rgba(0, 150, 255, 0.8) 25%,
                rgba(30, 144, 255, 0.7) 50%,
                rgba(135, 206, 235, 0.6) 75%,
                rgba(173, 216, 230, 0.4) 100%
            );
            border-radius: 50% 50% 0 0;
            bottom: -100%;
            left: -50%;
            animation: tidalMassiveWave 3s ease-in-out;
            transform: rotate(-5deg);
            box-shadow: 
                0 -20px 40px rgba(0, 100, 200, 0.5),
                0 -40px 80px rgba(30, 144, 255, 0.3),
                inset 0 20px 40px rgba(255, 255, 255, 0.2);
        `;
        waveContainer.appendChild(massiveWave);
        
        // Create wave particles and foam
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'tidal-wave-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${8 + Math.random() * 15}px;
                height: ${8 + Math.random() * 15}px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(173, 216, 230, 0.6));
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 50}%;
                animation: tidalWaveParticleFloat ${2 + Math.random() * 3}s ease-out;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            `;
            waveContainer.appendChild(particle);
        }
        
        // Create foam spray effects
        for (let i = 0; i < 20; i++) {
            const foam = document.createElement('div');
            foam.className = 'tidal-wave-foam';
            foam.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 6}px;
                height: ${3 + Math.random() * 6}px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 30}%;
                animation: tidalWaveFoam ${1.5 + Math.random() * 2}s ease-out;
                animation-delay: ${0.5 + Math.random() * 1.5}s;
            `;
            waveContainer.appendChild(foam);
        }
        
        // Create water droplets
        for (let i = 0; i < 50; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'tidal-wave-droplet';
            droplet.style.cssText = `
                position: absolute;
                width: ${2 + Math.random() * 4}px;
                height: ${2 + Math.random() * 4}px;
                background: rgba(30, 144, 255, 0.8);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: tidalWaveDroplet ${2 + Math.random() * 2}s ease-out;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 4px rgba(30, 144, 255, 0.6);
            `;
            waveContainer.appendChild(droplet);
        }
        
        // Add to battle container
        battleContainer.appendChild(waveContainer);
        
        // Create screen shake effect
        battleContainer.classList.add('tidal-wave-shake');
        setTimeout(() => {
            battleContainer.classList.remove('tidal-wave-shake');
        }, 2000);
        
        // Remove wave after animation
        setTimeout(() => {
            waveContainer.remove();
        }, 5000);
        
        console.log('[StageModifiers] Created massive tidal wave battlefield VFX');
    }
    
    createTidalWaveHealVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;
        
        // Create healing water aura
        const healingAura = document.createElement('div');
        healingAura.className = 'tidal-healing-aura';
        healingAura.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(0, 255, 255, 0.6), rgba(135, 206, 235, 0.3), transparent);
            border-radius: 50%;
            animation: tidalHealingAura 2s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        characterElement.appendChild(healingAura);
        
        // Create healing sparkles
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'tidal-healing-sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(0, 255, 255, 0.9);
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: tidalHealingSparkle 2s ease-out;
                animation-delay: ${i * 0.1}s;
                box-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
                pointer-events: none;
                z-index: 11;
            `;
            
            const angle = (i / 12) * 360;
            const distance = 40 + Math.random() * 20;
            sparkle.style.setProperty('--angle', angle + 'deg');
            sparkle.style.setProperty('--distance', distance + 'px');
            
            characterElement.appendChild(sparkle);
        }
        
        // Create floating heal text
        const healText = document.createElement('div');
        healText.className = 'tidal-heal-text';
        healText.textContent = '+1000 HP';
        healText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            color: #00ffff;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 255, 255, 0.8);
            animation: tidalHealText 2.5s ease-out;
            pointer-events: none;
            z-index: 12;
        `;
        characterElement.appendChild(healText);
        
        // Cleanup
        setTimeout(() => {
            healingAura.remove();
            healText.remove();
            const sparkles = characterElement.querySelectorAll('.tidal-healing-sparkle');
            sparkles.forEach(s => s.remove());
        }, 2500);
    }
    
    createTidalWaveDamageVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;
        
        // Create damage splash effect
        const damageEffect = document.createElement('div');
        damageEffect.className = 'tidal-damage-effect';
        damageEffect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120px;
            height: 120px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(255, 0, 0, 0.6), rgba(255, 100, 100, 0.4), transparent);
            border-radius: 50%;
            animation: tidalDamageImpact 1.5s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        characterElement.appendChild(damageEffect);
        
        // Create water impact particles
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('div');
            particle.className = 'tidal-damage-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(255, 50, 50, 0.8);
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: tidalDamageParticle 1.5s ease-out;
                animation-delay: ${i * 0.05}s;
                box-shadow: 0 0 6px rgba(255, 50, 50, 0.6);
                pointer-events: none;
                z-index: 11;
            `;
            
            const angle = (i / 16) * 360;
            const distance = 30 + Math.random() * 30;
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--distance', distance + 'px');
            
            characterElement.appendChild(particle);
        }
        
        // Create damage text
        const damageText = document.createElement('div');
        damageText.className = 'tidal-damage-text';
        damageText.textContent = '-1000 HP';
        damageText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff3333;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 51, 51, 0.8);
            animation: tidalDamageText 2s ease-out;
            pointer-events: none;
            z-index: 12;
        `;
        characterElement.appendChild(damageText);
        
        // Cleanup
        setTimeout(() => {
            damageEffect.remove();
            damageText.remove();
            const particles = characterElement.querySelectorAll('.tidal-damage-particle');
            particles.forEach(p => p.remove());
        }, 2000);
    }
    
    clearTidalWaveVFX() {
        const existingVFX = document.querySelectorAll('.tidal-wave-chaos-container');
        existingVFX.forEach(vfx => vfx.remove());
        
        const healingEffects = document.querySelectorAll('.tidal-healing-aura, .tidal-heal-text, .tidal-healing-sparkle');
        healingEffects.forEach(effect => effect.remove());
        
        const damageEffects = document.querySelectorAll('.tidal-damage-effect, .tidal-damage-text, .tidal-damage-particle');
        damageEffects.forEach(effect => effect.remove());
        
        console.log('[StageModifiers] Cleared tidal wave VFX');
    }
    
    clearAllDebuffVFX() {
        // Clear common debuff VFX elements
        const debuffVFXSelectors = [
            // Stun effects
            '.stun-effect-container', '.stun-effect', '.stun-stars', '.stun-circle', '.stunned',
            '.samba-stun-swirl', '.samba-stun-particle', '.samba-dizzy-indicator',
            
            // Freeze effects
            '.freeze-overlay', '.freeze-indicator', '.freezing-waters-freeze', '.freezing-waters-indicator',
            '.freeze-crystal-burst', '.frost-shard',
            
            // Charm effects
            '.aquatic-charm-indicator', '.charm-effect',
            
            // Poison/Toxic effects
            '.poison-effect', '.toxic-effect', '.poison-indicator',
            
            // Burn effects
            '.burn-effect', '.burning-indicator', '.fire-effect',
            
            // General debuff VFX
            '.debuff-vfx', '.debuff-overlay', '.debuff-indicator', '.debuff-effect',
            '.status-effect-overlay', '.debuff-particles',
            
            // Ability-specific debuff VFX
            '.flower-bomb-vfx', '.ability-disabled-vfx',
            
            // Shadow/Dark effects
            '.shadow-effect', '.dark-effect', '.corruption-effect',
            
            // Miscellaneous debuff effects
            '.weakness-effect', '.slow-effect', '.blind-effect', '.silence-effect'
        ];
        
        let removedCount = 0;
        debuffVFXSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Add fade-out effect before removal
                element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                element.style.opacity = '0';
                element.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (element.parentNode) {
                        element.remove();
                    }
                }, 500);
                
                removedCount++;
            });
        });
        
        // Also remove stunned class from character elements
        const stunnedCharacters = document.querySelectorAll('.character-slot.stunned');
        stunnedCharacters.forEach(char => {
            char.classList.remove('stunned');
        });
        
        // Clear any character-specific debuff overlays
        const characterSlots = document.querySelectorAll('.character-slot');
        characterSlots.forEach(slot => {
            // Remove debuff-related classes
            const debuffClasses = ['stunned', 'frozen', 'poisoned', 'burning', 'charmed', 'weakened', 'slowed'];
            debuffClasses.forEach(debuffClass => {
                slot.classList.remove(debuffClass);
            });
        });
        
        if (removedCount > 0) {
            console.log(`[StageModifiers] Tidal wave cleared ${removedCount} debuff VFX elements from the battlefield`);
        }
    }

    getCharacterElement(character) {
        // Try different possible element ID patterns
        const possibleIds = [
            `character-${character.instanceId || character.id}`,
            `character-${character.id}`,
            character.instanceId || character.id
        ];
        
        for (const id of possibleIds) {
            const element = document.getElementById(id);
            if (element) {
                return element;
            }
        }
        
        // Fallback: search by character name or other attributes
        const allCharacterElements = document.querySelectorAll('.character-slot');
        for (const element of allCharacterElements) {
            const nameElement = element.querySelector('.character-name');
            if (nameElement && nameElement.textContent.trim() === character.name) {
                return element;
            }
        }
        
        console.warn(`[StageModifiers] Could not find character element for ${character.name} (${character.id})`);
        return null;
    }

    createDarkCurrentVFX(modifier) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'stage-modifier-vfx dark-current-vfx';
        vfxContainer.setAttribute('data-modifier', modifier.id);
        
        // Create dark water overlay with swirling energy
        const darkOverlay = document.createElement('div');
        darkOverlay.className = 'dark-current-overlay';
        darkOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 25% 30%, rgba(20, 5, 40, 0.25) 0%, rgba(60, 20, 80, 0.15) 30%, transparent 60%),
                radial-gradient(circle at 75% 70%, rgba(40, 5, 60, 0.2) 0%, rgba(80, 20, 100, 0.12) 40%, transparent 70%),
                linear-gradient(120deg, rgba(30, 5, 50, 0.15) 0%, rgba(70, 20, 90, 0.2) 50%, rgba(30, 5, 50, 0.15) 100%);
            animation: darkCurrentFlow 8s ease-in-out infinite alternate, darkCurrentPulse 6s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
        `;
        vfxContainer.appendChild(darkOverlay);
        
        // Create dark energy particles floating around
        for (let i = 0; i < 35; i++) {
            const energyParticle = document.createElement('div');
            energyParticle.className = 'dark-energy-particle';
            const size = 3 + Math.random() * 8;
            energyParticle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(120, 50, 150, 0.9) 0%, rgba(60, 20, 100, 0.6) 50%, rgba(30, 10, 60, 0.3) 100%);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: darkEnergyFloat ${4 + Math.random() * 6}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                filter: blur(0.8px);
                box-shadow: 0 0 12px rgba(120, 50, 150, 0.7);
                z-index: 3;
            `;
            vfxContainer.appendChild(energyParticle);
        }
        
        // Create dark current streams
        for (let i = 0; i < 20; i++) {
            const stream = document.createElement('div');
            stream.className = 'dark-current-stream';
            const width = 2 + Math.random() * 3;
            const height = 25 + Math.random() * 40;
            stream.style.cssText = `
                position: absolute;
                width: ${width}px;
                height: ${height}px;
                background: linear-gradient(180deg, rgba(100, 40, 120, 0.8) 0%, rgba(60, 20, 80, 0.6) 50%, transparent 100%);
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: darkCurrentStreamFlow ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 4}s;
                filter: blur(0.5px);
                z-index: 4;
                border-radius: 50%;
            `;
            vfxContainer.appendChild(stream);
        }
        
        // Create lightning-like energy bolts
        for (let i = 0; i < 15; i++) {
            const bolt = document.createElement('div');
            bolt.className = 'dark-energy-bolt';
            const size = 4 + Math.random() * 6;
            bolt.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size * 2}px;
                background: linear-gradient(180deg, rgba(150, 80, 200, 0.9) 0%, rgba(100, 50, 150, 0.7) 70%, transparent 100%);
                border-radius: 20%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: darkEnergyBoltFloat ${5 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 6}s;
                opacity: ${0.7 + Math.random() * 0.3};
                z-index: 5;
                box-shadow: 0 0 8px rgba(150, 80, 200, 0.8);
            `;
            vfxContainer.appendChild(bolt);
        }
        
        // Add CSS animations for dark current
        if (!document.getElementById('dark-current-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dark-current-styles';
            styleSheet.textContent = `
                @keyframes darkCurrentFlow {
                    0% { 
                        transform: translateX(0px) scale(1); 
                        opacity: 0.7; 
                    }
                    50% { 
                        transform: translateX(-15px) scale(1.1); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translateX(10px) scale(0.95); 
                        opacity: 0.8; 
                    }
                }
                
                @keyframes darkCurrentPulse {
                    0%, 100% { 
                        opacity: 0.7; 
                        transform: scale(1); 
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.05); 
                    }
                }
                
                @keyframes darkEnergyFloat {
                    0% {
                        transform: translateY(0px) translateX(0px) scale(0.8);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100px) translateX(${Math.random() * 60 - 30}px) scale(0.3);
                        opacity: 0;
                    }
                }
                
                @keyframes darkCurrentStreamFlow {
                    0%, 100% {
                        transform: translateY(0px) scaleY(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: translateY(-25px) scaleY(1.4);
                        opacity: 1;
                    }
                }
                
                @keyframes darkEnergyBoltFloat {
                    0% {
                        transform: translateY(0px) translateX(0px) rotate(0deg) scale(0.6);
                        opacity: 0;
                    }
                    25% {
                        opacity: 1;
                        transform: scale(1.3) rotate(15deg);
                    }
                    75% {
                        opacity: 1;
                        transform: rotate(-10deg);
                    }
                    100% {
                        transform: translateY(-80px) translateX(${Math.random() * 40 - 20}px) rotate(${Math.random() * 60 - 30}deg) scale(0.2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add to stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(vfxContainer);
        }

        console.log(`[StageModifiers] Created dark current VFX with swirling dark energy for ${modifier.name}`);
    }

    createDarkCurrentDrainVFX(character, manaDrained) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;

        // Create dark energy drain effect around character
        const drainEffect = document.createElement('div');
        drainEffect.className = 'dark-current-drain-effect';
        drainEffect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(100, 40, 120, 0.6) 0%, rgba(60, 20, 80, 0.4) 50%, transparent 70%);
            border-radius: 50%;
            animation: darkCurrentDrain 2s ease-out;
            pointer-events: none;
            z-index: 100;
        `;
        characterElement.appendChild(drainEffect);

        // Create energy drain text
        const drainText = document.createElement('div');
        drainText.className = 'dark-current-drain-text';
        drainText.textContent = `-${manaDrained} Mana`;
        drainText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #a050c8;
            text-shadow: 
                0 0 8px rgba(160, 80, 200, 0.8),
                0 0 16px rgba(100, 50, 150, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: darkCurrentDrainText 2s ease-out;
            pointer-events: none;
            z-index: 101;
        `;
        characterElement.appendChild(drainText);

        // Create dark energy particles being drained away
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'dark-drain-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #a050c8, #6020a0);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: darkDrainParticle 1.8s ease-out;
                animation-delay: ${i * 0.1}s;
                box-shadow: 0 0 6px rgba(160, 80, 200, 0.8);
                pointer-events: none;
                z-index: 99;
            `;
            
            const angle = (i / 12) * 360;
            const distance = 40 + Math.random() * 30;
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--distance', distance + 'px');
            
            characterElement.appendChild(particle);
        }

        // Add CSS animations for drain effects
        if (!document.getElementById('dark-current-drain-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dark-current-drain-styles';
            styleSheet.textContent = `
                @keyframes darkCurrentDrain {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.5); 
                        opacity: 0; 
                    }
                    30% { 
                        transform: translate(-50%, -50%) scale(1.3); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2); 
                        opacity: 0; 
                    }
                }
                
                @keyframes darkCurrentDrainText {
                    0% { 
                        transform: translateX(-50%) scale(0.8); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.2); 
                        opacity: 1; 
                    }
                    40% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.9) translateY(-30px); 
                        opacity: 0; 
                    }
                }
                
                @keyframes darkDrainParticle {
                    0% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0px) scale(0.5);
                        opacity: 0;
                    }
                    30% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(var(--distance) * 0.6)) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0.2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        // Cleanup
        setTimeout(() => {
            drainEffect.remove();
            drainText.remove();
            const particles = characterElement.querySelectorAll('.dark-drain-particle');
            particles.forEach(p => p.remove());
        }, 2500);

        console.log(`[StageModifiers] Created dark current drain VFX for ${character.name} (-${manaDrained} mana)`);
    }

    createDoubleDamageVFX(character) {
        const characterElement = this.getCharacterElement(character);
        if (!characterElement) return;

        // Create power surge particles around character
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'double-damage-character-vfx';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        
        // Create power particles
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'power-particle';
            const symbols = ['⚔️', '💥', '⚡', '💪'];
            particle.textContent = symbols[i % symbols.length];
            particle.style.cssText = `
                position: absolute;
                font-size: 20px;
                animation: doubleDamageParticle 3s ease-out;
                animation-delay: ${i * 0.2}s;
            `;
            
            const angle = (i / 6) * 360;
            particle.style.setProperty('--angle', angle + 'deg');
            vfxContainer.appendChild(particle);
        }

        // Create power glow
        const powerGlow = document.createElement('div');
        powerGlow.className = 'power-glow';
        powerGlow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(255, 100, 100, 0.3) 0%, rgba(255, 255, 100, 0.2) 50%, transparent 70%);
            border-radius: 50%;
            animation: doubleDamagePowerGlow 3s ease-out;
        `;
        vfxContainer.appendChild(powerGlow);

        // Create damage multiplier text
        const multiplierText = document.createElement('div');
        multiplierText.className = 'damage-multiplier';
        multiplierText.textContent = '×2 DAMAGE';
        multiplierText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #ff6666;
            text-shadow: 
                0 0 8px rgba(255, 100, 100, 0.8),
                0 0 16px rgba(255, 50, 50, 0.6),
                2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: doubleDamageText 3s ease-out;
        `;
        vfxContainer.appendChild(multiplierText);
        
        characterElement.appendChild(vfxContainer);

        // Add CSS animations if not already added
        if (!document.getElementById('double-damage-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'double-damage-styles';
            styleSheet.textContent = `
                @keyframes doubleDamageParticle {
                    0% {
                        transform: rotate(var(--angle)) translateX(20px) scale(0.5);
                        opacity: 0;
                    }
                    30% {
                        transform: rotate(var(--angle)) translateX(40px) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: rotate(var(--angle)) translateX(80px) scale(0.3);
                        opacity: 0;
                    }
                }
                
                @keyframes doubleDamagePowerGlow {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.5); 
                        opacity: 0; 
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.5); 
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(2); 
                        opacity: 0; 
                    }
                }
                
                @keyframes doubleDamageText {
                    0% { 
                        transform: translateX(-50%) scale(0.8); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translateX(-50%) scale(1.3); 
                        opacity: 1; 
                    }
                    80% { 
                        transform: translateX(-50%) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(-50%) scale(0.9) translateY(-20px); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        // Remove after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 4000);
    }

    createDoubleDamageScreenVFX() {
        // Create screen-wide power surge effect
        const screenVFX = document.createElement('div');
        screenVFX.className = 'double-damage-screen-vfx';
        screenVFX.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        `;

        // Create power waves
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'power-wave';
            wave.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 200px;
                height: 200px;
                border: 3px solid rgba(255, 100, 100, 0.6);
                border-radius: 50%;
                animation: doubleDamagePowerWave 2s ease-out;
                animation-delay: ${i * 0.3}s;
            `;
            screenVFX.appendChild(wave);
        }

        // Create power text
        const powerText = document.createElement('div');
        powerText.className = 'power-text';
        powerText.textContent = 'DOUBLE DAMAGE ACTIVATED';
        powerText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            font-weight: bold;
            color: #ff6666;
            text-shadow: 
                0 0 20px rgba(255, 100, 100, 0.8),
                0 0 40px rgba(255, 50, 50, 0.6),
                4px 4px 8px rgba(0, 0, 0, 0.8);
            animation: doubleDamagePowerText 3s ease-out;
            text-align: center;
        `;
        screenVFX.appendChild(powerText);

        // Create floating particles
        const particleContainer = document.createElement('div');
        particleContainer.className = 'power-particles';
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'screen-particle';
            const symbols = ['⚔️', '💥', '⚡', '💪'];
            particle.textContent = symbols[i % symbols.length];
            particle.style.cssText = `
                position: absolute;
                font-size: 24px;
                left: ${10 + (i * 10)}%;
                top: ${20 + Math.random() * 60}%;
                animation: doubleDamageScreenParticle 4s ease-out;
                animation-delay: ${i * 0.2}s;
            `;
            particleContainer.appendChild(particle);
        }
        screenVFX.appendChild(particleContainer);

        // Add CSS animations for screen effects
        if (!document.getElementById('double-damage-screen-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'double-damage-screen-styles';
            styleSheet.textContent = `
                @keyframes doubleDamagePowerWave {
                    0% {
                        transform: translate(-50%, -50%) scale(0.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(3);
                        opacity: 0;
                    }
                }
                
                @keyframes doubleDamagePowerText {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.5); 
                        opacity: 0; 
                    }
                    20% { 
                        transform: translate(-50%, -50%) scale(1.2); 
                        opacity: 1; 
                    }
                    80% { 
                        transform: translate(-50%, -50%) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(0.8); 
                        opacity: 0; 
                    }
                }
                
                @keyframes doubleDamageScreenParticle {
                    0% {
                        transform: scale(0.5) rotate(0deg);
                        opacity: 0;
                    }
                    30% {
                        transform: scale(1.3) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0.3) rotate(360deg) translateY(-100px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(screenVFX);

        // Remove after animation
        setTimeout(() => {
            if (screenVFX.parentNode) {
                screenVFX.parentNode.removeChild(screenVFX);
            }
        }, 4000);
    }
}

// Create global instance
window.stageModifiersRegistry = new StageModifiersRegistry();
