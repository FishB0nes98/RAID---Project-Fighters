// Farmer FANG Abilities

// Register custom effect for Carrot Power-up ability
if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
    console.log("Registering Farmer FANG ability effects...");

    // Register the Carrot Power-up ability effect
    window.AbilityFactory.registerAbilityEffect('fang_carrot_powerup', function(abilityData) {
        return function(caster, targetOrTargets) {
            console.log(`[fang_carrot_powerup] Executing ability from ${caster.name}`);
            const gameManager = window.gameManager;
            
            if (!gameManager) {
                console.error("Game manager not found!");
                return false;
            }
            
            // Get all allies excluding self
            let targets = gameManager.getAllies(caster).filter(ally => 
                !ally.isDead() && ally.id !== caster.id
            );
            
            if (targets.length === 0) {
                gameManager.addLogEntry(`${caster.name} tried to use Carrot Power-up, but there are no valid allies!`, 'system');
                return false; // No valid targets
            }
            
            // Apply the buff to each ally
            let buffApplied = false;
            targets.forEach(target => {
                // Create the buff
                const buff = {
                    id: 'fang_carrot_powerup',
                    name: 'Carrot Power-up',
                    icon: abilityData.icon || 'Icons/abilities/carrot_powerup.png',
                    duration: abilityData.buffDuration || 3,
                    effects: {
                        // The damageMultiplier will increase all damage by 50%
                        onCalculateDamage: function(character, baseDamage, type) {
                            console.log(`[Carrot Power-up] Boosting damage for ${character.name}: ${baseDamage} * 1.5`);
                            return Math.floor(baseDamage * 1.5); // 50% more damage
                        }
                    },
                    description: `Increasing all damage dealt by 50% for ${abilityData.buffDuration || 3} turns.`
                };
                
                // Apply the buff
                target.addBuff(buff);
                
                // Add the "carrot-powered" class to the character for visual effect
                if (gameManager.uiManager) {
                    const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
                    if (characterElement) {
                        characterElement.classList.add('carrot-powered');
                        
                        // Create VFX container if it doesn't exist
                        let vfxContainer = characterElement.querySelector('.carrot-powerup-vfx');
                        if (!vfxContainer) {
                            vfxContainer = document.createElement('div');
                            vfxContainer.className = 'carrot-powerup-vfx';
                            characterElement.appendChild(vfxContainer);
                        }
                        
                        // Create the glow effect
                        const glow = document.createElement('div');
                        glow.className = 'carrot-powerup-glow';
                        vfxContainer.appendChild(glow);
                        
                        // Create carrot particles
                        for (let i = 0; i < 10; i++) {
                            const particle = document.createElement('div');
                            particle.className = 'carrot-particle';
                            
                            // Randomize position
                            const left = 20 + Math.random() * 60; // 20% to 80% of width
                            const delay = Math.random() * 0.5; // 0 to 0.5s delay
                            
                            particle.style.left = `${left}%`;
                            particle.style.animationDelay = `${delay}s`;
                            
                            vfxContainer.appendChild(particle);
                            
                            // Remove particles after animation completes
                            setTimeout(() => {
                                if (particle.parentNode === vfxContainer) {
                                    vfxContainer.removeChild(particle);
                                }
                            }, 3500); // Animation duration + buffer
                        }
                        
                        // Clean up the VFX container after animations
                        setTimeout(() => {
                            if (vfxContainer && vfxContainer.parentNode) {
                                vfxContainer.parentNode.removeChild(vfxContainer);
                            }
                        }, 4000);
                    }
                }
                
                // Show floating text
                gameManager.uiManager?.showFloatingText(
                    target.instanceId || target.id, 
                    "Carrot Power!", 
                    "buff carrot-powered"
                );
                
                buffApplied = true;
            });
            
            // Log the buff application
            if (buffApplied) {
                gameManager.addLogEntry(
                    `${caster.name} empowered ${targets.length} allies with Carrot Power-up, increasing their damage by 50% for ${abilityData.buffDuration || 3} turns!`,
                    'buff'
                );
                
                // Play a sound effect if available
                gameManager.playSound('sounds/abilities/powerup.mp3');
                
                return true;
            }
            
            return false;
        };
    });
    
    // Register the Corn Power Up ability effect
    window.AbilityFactory.registerAbilityEffect('fang_corn_powerup', function(abilityData) {
        return function(caster, targetOrTargets) {
            console.log(`[fang_corn_powerup] Executing ability from ${caster.name}`);
            const gameManager = window.gameManager;
            
            if (!gameManager) {
                console.error("Game manager not found!");
                return false;
            }
            
            // Get all allies including self
            let targets = gameManager.getAllies(caster).filter(ally => !ally.isDead());
            
            if (targets.length === 0) {
                gameManager.addLogEntry(`${caster.name} tried to use Corn Power Up, but there are no valid allies!`, 'system');
                return false; // No valid targets
            }
            
            let debuffsRemoved = false;
            let totalDebuffsRemoved = 0;
            
            // Remove all debuffs from each ally
            targets.forEach(target => {
                const initialDebuffCount = target.debuffs.length;
                
                if (initialDebuffCount > 0) {
                    // Clear all debuffs
                    target.debuffs = [];
                    totalDebuffsRemoved += initialDebuffCount;
                    
                    // Create corn cleanse VFX
                    if (gameManager.uiManager) {
                        const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
                        if (characterElement) {
                            // Create VFX container if it doesn't exist
                            let vfxContainer = document.createElement('div');
                            vfxContainer.className = 'corn-cleanse-vfx';
                            characterElement.appendChild(vfxContainer);
                            
                            // Create the cleanse effect
                            const cleanse = document.createElement('div');
                            cleanse.className = 'corn-cleanse-glow';
                            vfxContainer.appendChild(cleanse);
                            
                            // Create corn particles
                            for (let i = 0; i < 8; i++) {
                                const particle = document.createElement('div');
                                particle.className = 'corn-particle';
                                
                                // Randomize position and animation
                                const left = 20 + Math.random() * 60; // 20% to 80% of width
                                const delay = Math.random() * 0.5; // 0 to 0.5s delay
                                
                                particle.style.left = `${left}%`;
                                particle.style.animationDelay = `${delay}s`;
                                
                                vfxContainer.appendChild(particle);
                                
                                // Remove particles after animation completes
                                setTimeout(() => {
                                    if (particle.parentNode === vfxContainer) {
                                        vfxContainer.removeChild(particle);
                                    }
                                }, 2500);
                            }
                            
                            // Clean up the VFX container after animations
                            setTimeout(() => {
                                if (vfxContainer && vfxContainer.parentNode) {
                                    vfxContainer.parentNode.removeChild(vfxContainer);
                                }
                            }, 3000);
                        }
                    }
                    
                    // Show floating text
                    gameManager.uiManager?.showFloatingText(
                        target.instanceId || target.id, 
                        "Cleansed!", 
                        "cleanse corn-cleansed"
                    );
                    
                    debuffsRemoved = true;
                    
                    // Update UI for the target
                    if (gameManager.uiManager) {
                        gameManager.uiManager.updateCharacterUI(target);
                    }
                }
            });
            
            // Log the cleanse effect
            if (debuffsRemoved) {
                gameManager.addLogEntry(
                    `${caster.name} used Corn Power Up and removed ${totalDebuffsRemoved} debuff${totalDebuffsRemoved !== 1 ? 's' : ''} from allies!`,
                    'cleanse'
                );
                
                // Play a sound effect if available
                gameManager.playSound('sounds/abilities/cleanse.mp3');
                
                return true;
            } else {
                gameManager.addLogEntry(
                    `${caster.name} used Corn Power Up, but there were no debuffs to remove.`,
                    'info'
                );
                return true; // Still counts as successful cast even if no debuffs were removed
            }
        };
    });
    
    // Register the Plant Trick ability effect
    window.AbilityFactory.registerAbilityEffect('fang_plant_trick', function(abilityData) {
        return function(caster, targetOrTargets) {
            console.log(`[fang_plant_trick] Executing ability from ${caster.name}`);
            const gameManager = window.gameManager;
            
            if (!gameManager) {
                console.error("Game manager not found!");
                return false;
            }
            
            // Get all enemies
            const enemies = gameManager.getOpponents(caster).filter(enemy => 
                !enemy.isDead() && !enemy.isUntargetable()
            );
            
            if (enemies.length === 0) {
                gameManager.addLogEntry(`${caster.name} tried to use Plant Trick, but there are no valid targets!`, 'system');
                return false; // No valid targets
            }
            
            // Select a random enemy
            const target = enemies[Math.floor(Math.random() * enemies.length)];
            
            gameManager.addLogEntry(`${caster.name} uses Plant Trick on ${target.name}!`, 'ability');
            
            // Play sound effect if available
            gameManager.playSound('sounds/abilities/plant_trick.mp3');
            
            // Plant Trick VFX
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            if (targetElement) {
                // Create the plant VFX container
                const plantVfx = document.createElement('div');
                plantVfx.className = 'plant-trick-vfx';
                targetElement.appendChild(plantVfx);
                
                // Create plant growth
                const plant = document.createElement('div');
                plant.className = 'plant-growth';
                plantVfx.appendChild(plant);
                
                // Create leaf particles
                for (let i = 0; i < 12; i++) {
                    const leaf = document.createElement('div');
                    leaf.className = 'leaf-particle';
                    
                    // Randomize position and animation
                    const left = -20 + Math.random() * 140; // -20% to 120% of width
                    const delay = Math.random() * 0.8; // 0 to 0.8s delay
                    const duration = 1 + Math.random() * 1; // 1-2s duration
                    
                    leaf.style.left = `${left}%`;
                    leaf.style.animationDelay = `${delay}s`;
                    leaf.style.animationDuration = `${duration}s`;
                    
                    plantVfx.appendChild(leaf);
                }
                
                // Clean up the VFX container after animations
                setTimeout(() => {
                    if (plantVfx && plantVfx.parentNode) {
                        plantVfx.parentNode.removeChild(plantVfx);
                    }
                }, 3500);
            }
            
            // Apply the disable effect to ALL abilities
            if (target.abilities && target.abilities.length > 0) {
                const disableDuration = 3; // 3 turns
                
                // Create a debuff for tracking the disabled state
                const plantTrickDebuff = {
                    id: 'fang_plant_trick_disable',
                    name: 'Plant Trick: All Abilities Disabled',
                    icon: abilityData.icon || 'Icons/abilities/plant_trick.png',
                    duration: disableDuration,
                    effects: {}, // No direct effects needed as we handle disabling directly
                    description: `All abilities disabled for ${disableDuration} turns.`,
                    
                    // This runs when the debuff is applied
                    onApply: function(target) {
                        // Store the original ability IDs being disabled
                        this.disabledAbilityIds = target.abilities.map(ability => ability.id);
                        
                        // Disable all abilities
                        target.abilities.forEach(ability => {
                            ability.isDisabled = true;
                            ability.disabledDuration = disableDuration;
                        });
                        
                        // Show the effect
                        gameManager.uiManager?.showFloatingText(
                            target.instanceId || target.id, 
                            "All Abilities Disabled!", 
                            "debuff plant-disable"
                        );
                    },
                    
                    // This runs when the debuff is removed
                    remove: function(target) {
                        // Re-enable all abilities that were disabled by this debuff
                        if (this.disabledAbilityIds && target.abilities) {
                            target.abilities.forEach(ability => {
                                if (this.disabledAbilityIds.includes(ability.id)) {
                                    ability.isDisabled = false;
                                }
                            });
                            
                            gameManager.addLogEntry(`${target.name}'s abilities are no longer disabled by Plant Trick.`, 'info');
                            
                            // Update UI to reflect the change
                            if (gameManager.uiManager) {
                                gameManager.uiManager.updateCharacterUI(target);
                            }
                        }
                    }
                };
                
                // Apply the debuff to the target
                target.addDebuff(plantTrickDebuff);
                
                gameManager.addLogEntry(
                    `${target.name}'s abilities have been disabled for ${disableDuration} turns!`,
                    'debuff'
                );
                
                // Update UI
                if (gameManager.uiManager) {
                    gameManager.uiManager.updateCharacterUI(target);
                }
                
                return true;
            } else {
                gameManager.addLogEntry(
                    `${target.name} has no abilities to disable!`,
                    'info'
                );
                return false;
            }
        };
    });
    
    console.log("Farmer FANG ability effects registered successfully!");
} else {
    console.error("Failed to register Farmer FANG ability effects - AbilityFactory not found or method unavailable!");
} 