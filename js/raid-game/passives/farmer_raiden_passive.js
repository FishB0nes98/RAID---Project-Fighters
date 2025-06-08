// Passive definition for Farmer Raiden: Zap

class FarmerRaidenPassive {
    constructor() {
        this.zapDamageMultiplier = 1.0; // 100% magical damage
        this.totalZapsDone = 0; // Track how many zaps have been triggered
        this.lastPowerGrowthTurn = 0; // Track when we last gained magical damage
        this.magicalDamageGrowthAmount = 100; // Amount to increase magical damage by
        this.lowHealthDodgeBonus = 0.15; // 15% dodge chance when under 50% HP
        this.critOnBuffAmount = 0.10; // 10% crit chance for Thunder Perception talent
        this.critOnBuffDuration = 3; // Duration of the crit buff in turns
        this.stunZapChance = 0.04;
        this.stunZapDuration = 2; // Stun duration in turns
        this.zapLifestealPercentage = 0.15; // 15% lifesteal from Zap damage
        this.initialMagicalShieldBonus = 0.15; // 15% magical shield at game start
        this.stormEmpowermentAmount = 300; // Magical damage bonus from Storm Empowerment talent
        this.stormEmpowermentDuration = 3; // Duration of the Storm Empowerment buff in turns
        this.basePassiveDescription = "Using an ability zaps a random enemy target, dealing 100% magical damage ignoring magical shield.";
        this.passiveTalentEffects = [];
        // New talent properties
        this.disabledAbilityDuration = 0; // Will be set by the shocked debuff duration
        console.log("FarmerRaidenPassive constructor called");
    }

    // Called when Raiden uses any ability
    onAbilityUsed(caster) {
        console.log(`FarmerRaidenPassive.onAbilityUsed called for ${caster ? caster.name : 'unknown'}`);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        const gameState = window.gameManager ? window.gameManager.gameState : null;

        if (!gameState) {
            console.error("Zap passive error: Cannot access game state!");
            return;
        }

        // Get all enemy characters (opposite team from caster)
        const enemies = caster.isAI ? 
            (gameState.playerCharacters || []) : 
            (gameState.aiCharacters || []);
        if (!enemies || enemies.length === 0) {
            log(`${caster.name}'s Zap passive has no targets!`, 'passive');
            return;
        }

        // Filter out dead enemies
        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
        if (aliveEnemies.length === 0) {
            log(`${caster.name}'s Zap passive has no living targets!`, 'passive');
            return;
        }

        // Select a random enemy
        const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
        const targetEnemy = aliveEnemies[randomIndex];

        // Check if Lightning Mastery talent is active and update multiplier
        if (caster.zapDamageMultiplier) {
            this.zapDamageMultiplier = caster.zapDamageMultiplier;
        }

        // Calculate zap damage (bypassing magical shield)
        const zapDamage = Math.floor((caster.stats.magicalDamage || 0) * this.zapDamageMultiplier);

        // Log the passive trigger
        log(`${caster.name}'s Zap passive triggers, targeting ${targetEnemy.name}!`, 'passive');
        
        // Play zap sound
        playSound('sounds/lightning_zap.mp3', 0.6);

        // Apply zap damage and get the result
        const damageResult = this.applyZapDamage(caster, targetEnemy, zapDamage);
        
        // Check for stun effect if the talent is selected
        if (caster.stunningZap && Math.random() < this.stunZapChance) {
            this.applyStunEffect(caster, targetEnemy);
        }
        
        // Check for lifesteal if the talent is selected
        if (caster.zapLifesteal && damageResult && damageResult.damage > 0) {
            const healAmount = Math.floor(damageResult.damage * this.zapLifestealPercentage);
            if (healAmount > 0) {
                // Apply healing
                caster.heal(healAmount, caster, { isZapLifesteal: true });
                log(`${caster.name}'s Lightning Lifesteal heals for ${healAmount} HP!`, 'heal');
                
                // Show healing VFX
                this.showZapLifestealVFX(caster, healAmount);
            }
        }
        
        // Chain Zap talent: hit a second target with the same zap
        if (caster.zapMultiTarget && aliveEnemies.length > 1) {
            // Filter out the first target to select a different one
            const remainingEnemies = aliveEnemies.filter(enemy => enemy !== targetEnemy);
            
            if (remainingEnemies.length > 0) {
                // Select a second random enemy
                const secondIndex = Math.floor(Math.random() * remainingEnemies.length);
                const secondTarget = remainingEnemies[secondIndex];
                
                // Log the chain zap
                log(`${caster.name}'s Chain Zap hits a second target: ${secondTarget.name}!`, 'passive');
                
                // Slight delay for the second zap
                setTimeout(() => {
                    // Apply zap damage to second target
                    const secondDamageResult = this.applyZapDamage(caster, secondTarget, zapDamage);
                    
                    // Show VFX for second target
                    this.showZapVFX(caster, secondTarget);
                    
                    // Check for stun on second target too
                    if (caster.stunningZap && Math.random() < this.stunZapChance) {
                        this.applyStunEffect(caster, secondTarget);
                    }
                    
                    // Apply lifesteal from second target also
                    if (caster.zapLifesteal && secondDamageResult && secondDamageResult.damage > 0) {
                        const secondHealAmount = Math.floor(secondDamageResult.damage * this.zapLifestealPercentage);
                        if (secondHealAmount > 0) {
                            // Apply healing
                            caster.heal(secondHealAmount, caster, { isZapLifesteal: true });
                            log(`${caster.name}'s Lightning Lifesteal heals for an additional ${secondHealAmount} HP!`, 'heal');
                            
                            // Show healing VFX
                            this.showZapLifestealVFX(caster, secondHealAmount);
                        }
                    }
                    
                    // Play a second zap sound
                    playSound('sounds/lightning_zap.mp3', 0.5);
                }, 400); // 400ms delay for the second zap
            }
        }
        
        // Lightning Fusion talent: Chance to trigger Lightning Orb
        if (caster.zapTriggerLightningOrb && Math.random() < caster.zapTriggerLightningOrb) {
            log(`${caster.name}'s Lightning Fusion procs, triggering Lightning Orb on ${targetEnemy.name}!`, 'system-update');
            
            // Find the Lightning Orb ability
            const lightningOrbAbility = caster.abilities.find(a => a.id === 'farmer_raiden_lightning_orb');
            if (lightningOrbAbility) {
                // Play special sound effect
                playSound('sounds/lightning_fusion.mp3', 0.8);
                
                // Show special VFX indicating the proc
                const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                if (casterElement) {
                    // Create a flash effect on the caster
                    const flashEffect = document.createElement('div');
                    flashEffect.className = 'lightning-fusion-flash';
                    casterElement.appendChild(flashEffect);
                    
                    // Remove after animation completes
                    setTimeout(() => flashEffect.remove(), 1000);
                }
                
                // We don't want to use mana or trigger cooldown, so we'll call the effect directly
                // but first we need to get the actual ability effect function
                const getAbilityEffect = () => {
                    // Try to reference the effect directly if it exists in global scope
                    if (typeof lightningOrbEffect === 'function') {
                        return lightningOrbEffect;
                    }
                    
                    // Otherwise, use the function stored in the ability
                    return lightningOrbAbility.effect;
                };
                
                const abilityEffect = getAbilityEffect();
                if (typeof abilityEffect === 'function') {
                    // Execute the Lightning Orb effect without spending mana or triggering cooldown
                    try {
                        abilityEffect(caster, targetEnemy, lightningOrbAbility);
                        log(`${caster.name}'s Lightning Orb triggers from Lightning Fusion!`, 'system-update');
                    } catch (error) {
                        console.error("Error triggering Lightning Orb from passive:", error);
                    }
                } else {
                    console.error("Could not find Lightning Orb effect function");
                }
            } else {
                console.warn("Lightning Orb ability not found for Lightning Fusion talent");
            }
        }
        
        // Increment zap counter
        this.totalZapsDone++;
        // Store on character for UI display
        caster.zapCounter = this.totalZapsDone;

        // Show VFX
        this.showZapVFX(caster, targetEnemy);

        // Growing Power - gain 1% Magical Damage per ability use
        if (caster.growingPower) {
            const increaseFactor = 0.01; // 1%
            const currentMagicalDamage = caster.stats.magicalDamage;
            const increase = Math.round(currentMagicalDamage * increaseFactor);
            
            if (increase > 0) {
                // Apply the increase
                caster.stats.magicalDamage += increase;
                
                // Visual feedback
                this.showGrowingPowerVFX(caster, increase);
                
                // Log the effect
                log(`${caster.name}'s Growing Power increases Magical Damage by ${increase}.`, 'system-update');
            }
        }

        // --- NEW: Relentless Storm Talent ---
        if (caster.reduceShockOnAbilityUse) {
            const electricShockAbility = caster.abilities.find(a => a.id === 'farmer_raiden_electric_shock');
            if (electricShockAbility && electricShockAbility.currentCooldown > 0) {
                const oldCooldown = electricShockAbility.currentCooldown;
                electricShockAbility.reduceCooldown(1); // Use the standard method
                const newCooldown = electricShockAbility.currentCooldown;
                log(`${caster.name}'s Relentless Storm reduces Electric Shock cooldown from ${oldCooldown} to ${newCooldown}!`, 'system-update');

                // Trigger UI update for the specific ability
                const abilityElement = document.querySelector(`#character-${caster.instanceId || caster.id} .ability[data-id="farmer_raiden_electric_shock"] .ability-cooldown`);
                if (abilityElement) {
                    abilityElement.textContent = newCooldown > 0 ? newCooldown : '';
                    abilityElement.style.display = newCooldown > 0 ? 'flex' : 'none';
                    // Flash the cooldown number briefly
                    abilityElement.classList.add('cooldown-reduced');
                    setTimeout(() => abilityElement.classList.remove('cooldown-reduced'), 500);
                }
            }
        }
        // --- END NEW ---
    }

    // Apply stun effect from the Stunning Zap talent
    applyStunEffect(caster, target) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        
        // Create stun debuff using Effect class (like Farmer Shoma's implementation)
        const stunDebuff = new Effect(
            `zap-stun-${Date.now()}`,
            "Stunned (Zap)",
            "Icons/statuses/stunned.webp",
            this.stunZapDuration,
            null,
            true // Is a debuff
        );
        
        // Set stun effect properties
        stunDebuff.effects = {
            cantAct: true
        };
        
        stunDebuff.setDescription('Cannot perform any actions for the duration.');
        
        // Add a custom remove method to clean up the stun VFX when the debuff expires
        stunDebuff.remove = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                charElement.classList.remove('stunned');
                const stunEffects = charElement.querySelectorAll('.stun-effect-container');
                stunEffects.forEach(el => el.remove());
            }
            
            // Reset stun state
            // character.isStunned = false; // REMOVED - rely on Character.isStunned() method
        };
        
        // Add onApply hook for visual effects
        stunDebuff.onApply = function(character) {
            // character.isStunned = true; // REMOVED - rely on Character.isStunned() method
        };
        
        // Log the stun effect
        log(`${caster.name}'s Zap stuns ${target.name} for ${this.stunZapDuration} turns!`, 'system-update');
        
        // Play stun sound
        playSound('sounds/stun.mp3', 0.7);
        
        // Add debuff to target
        target.addDebuff(stunDebuff.clone()); // Clone before adding
        
        // Add stun VFX
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            targetElement.classList.add('stunned'); // Apply grayscale
            
            // Create container for stun VFX
            const stunVfxContainer = document.createElement('div');
            stunVfxContainer.className = 'vfx-container stun-effect-container';
            targetElement.appendChild(stunVfxContainer);
            
            // Create stun effect
            const stunEffect = document.createElement('div');
            stunEffect.className = 'zap-stun-effect';
            stunVfxContainer.appendChild(stunEffect);
            
            // Add spinning stars
            for (let i = 0; i < 3; i++) {
                const star = document.createElement('div');
                star.className = 'stun-star';
                star.style.animationDelay = `${i * 0.2}s`;
                stunEffect.appendChild(star);
            }
            
            // Add stun text
            const stunText = document.createElement('div');
            stunText.className = 'stun-text';
            stunText.textContent = 'STUNNED';
            stunEffect.appendChild(stunText);
        }
        
        // Apply Storm Empowerment talent if active
        if (caster.stormEmpowerment) {
            this.applyStormEmpowermentBuff(caster);
        }
    }
    
    // Apply the Storm Empowerment buff when stunning an enemy
    applyStormEmpowermentBuff(character) {
        if (!character || !character.stormEmpowerment) return;
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        
        // Create buff using Effect class
        const empowermentBuff = new Effect(
            `storm-empowerment-${Date.now()}`,
            "Storm Empowerment",
            "Icons/abilities/storm_circle.webp",
            this.stormEmpowermentDuration,
            null, // No per-turn effect needed here
            false // Is not a debuff
        );
        
        // CORRECTED: Use statModifiers for Character.addBuff
        empowermentBuff.statModifiers = {
            magicalDamage: this.stormEmpowermentAmount // Apply flat bonus
        };
        
        empowermentBuff.setDescription(`Increases Magical Damage by ${this.stormEmpowermentAmount} for ${this.stormEmpowermentDuration} turns.`);
        
        // REMOVED: onApply and remove are not needed for simple stat buffs handled by core addBuff/removeBuff
        /*
        // Add onApply hook for visual effects and stat changes
        empowermentBuff.onApply = function(char) {
            // char.stats.magicalDamage += empowermentBuff.statModifiers.magicalDamage; // Handled by addBuff
            // char.recalculateStats('storm-empowerment-applied'); // Handled by addBuff
        };
        
        // Add custom remove method
        empowermentBuff.remove = function(char) {
            // char.stats.magicalDamage -= empowermentBuff.statModifiers.magicalDamage; // Handled by removeBuff
            // char.recalculateStats('storm-empowerment-removed'); // Handled by removeBuff
            
            // Remove visual effect if any
            const charElement = document.getElementById(`character-${char.instanceId || char.id}`);
            if (charElement) {
                const empowermentEffects = charElement.querySelectorAll('.storm-empowerment-effect');
                empowermentEffects.forEach(el => el.remove());
            }
        };
        */
        
        // Log the buff
        log(`${character.name} gains Storm Empowerment: +${this.stormEmpowermentAmount} Magical Damage for ${this.stormEmpowermentDuration} turns!`, 'system-update');
        
        // Play buff sound
        playSound('sounds/power_up.mp3', 0.7);
        
        // Add buff to character (this will automatically apply statModifiers)
        character.addBuff(empowermentBuff);
        
        // Show buff VFX
        this.showStormEmpowermentVFX(character);
    }
    
    // Visual effect for Storm Empowerment
    showStormEmpowermentVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create effect container
        const effectContainer = document.createElement('div');
        effectContainer.className = 'vfx-container storm-empowerment-effect';
        characterElement.appendChild(effectContainer);
        
        // Create power-up effect
        const powerUpEffect = document.createElement('div');
        powerUpEffect.className = 'thunder-perception-effect'; // Reuse existing effect style
        effectContainer.appendChild(powerUpEffect);
        
        // Add text
        const empowermentText = document.createElement('div');
        empowermentText.className = 'thunder-perception-text'; // Reuse existing text style
        empowermentText.textContent = `+${this.stormEmpowermentAmount} M.DMG`;
        effectContainer.appendChild(empowermentText);
        
        // Remove effect after animation
        setTimeout(() => {
            effectContainer.remove();
        }, 2500);
    }
    
    // Fallback stun VFX if character doesn't have its own
    showStunVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create stun effect container
        const stunEffect = document.createElement('div');
        stunEffect.className = 'stun-vfx zap-stun-effect';
        characterElement.appendChild(stunEffect);
        
        // Add spinning stars
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('div');
            star.className = 'stun-star';
            star.style.animationDelay = `${i * 0.2}s`;
            stunEffect.appendChild(star);
        }
        
        // Add stun text
        const stunText = document.createElement('div');
        stunText.className = 'stun-text';
        stunText.textContent = 'STUNNED';
        stunEffect.appendChild(stunText);
        
        // Remove effect after animation
        setTimeout(() => {
            stunEffect.remove();
        }, 2000);
    }

    // Called at the start of each turn for checking power growth
    onTurnStart(character, turn) {
        if (!character) return;
        
        // Check if character has the powerGrowth talent enabled
        if (character.powerGrowth) {
            const currentTurn = turn || 1;
            
            // Increase magical damage every 10 turns
            if (currentTurn % 10 === 0 && currentTurn !== this.lastPowerGrowthTurn) {
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                
                // Store the current turn to prevent multiple triggers
                this.lastPowerGrowthTurn = currentTurn;
                
                // Increase magical damage
                character.baseStats.magicalDamage += this.magicalDamageGrowthAmount;
                character.recalculateStats('raiden-power-growth');
                
                // Log the effect
                log(`${character.name}'s Empowering Thunder activates! Magical Damage increased by ${this.magicalDamageGrowthAmount}!`, 'system-update');
                
                // Show a visual effect if possible
                this.showPowerGrowthVFX(character);
                
                // Update character UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(character);
                }
            }
        }

        // Check for Storm Harbinger talent (random Storm Circle activation)
        if (character.randomStormActivation) {
            const randomChance = 0.1; // 10% chance
            if (Math.random() < randomChance) {
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                const gameState = window.gameManager ? window.gameManager.gameState : null;

                if (!gameState) {
                    console.error("Storm Harbinger talent error: Cannot access game state!");
                    return;
                }

                log(`${character.name}'s Storm Harbinger talent activates! Storm Circle is cast randomly!`, 'system');
                
                // Show Storm Harbinger visual effect
                const stormHarbingerVfx = document.createElement('div');
                stormHarbingerVfx.className = 'double-storm-effect';
                document.body.appendChild(stormHarbingerVfx);
                
                // Add text effect
                const stormHarbingerText = document.createElement('div');
                stormHarbingerText.className = 'double-storm-text';
                stormHarbingerText.textContent = 'STORM HARBINGER';
                stormHarbingerVfx.appendChild(stormHarbingerText);
                
                // Play sound effect
                playSound('sounds/thunder_strike.mp3', 0.8);
                
                // Find the Storm Circle ability
                const stormCircleAbility = character.abilities.find(a => a.id === 'farmer_raiden_storm_circle');
                if (stormCircleAbility) {
                    // We'll execute a modified version that doesn't stun
                    setTimeout(() => {
                        // Get all enemy characters
                        const enemies = gameState.aiCharacters || [];
                        if (!enemies || enemies.length === 0) {
                            log(`${character.name}'s Storm Harbinger has no targets!`, 'system');
                            return;
                        }

                        // Filter out dead enemies
                        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
                        if (aliveEnemies.length === 0) {
                            log(`${character.name}'s Storm Harbinger has no living targets!`, 'system');
                            return;
                        }

                        // Create storm circle wave effect
                        const stormCircleWave = document.createElement('div');
                        stormCircleWave.className = 'storm-circle-wave';
                        document.body.appendChild(stormCircleWave);
                        
                        // Add lightning effect to character
                        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
                        const stormLightning = document.createElement('div');
                        stormLightning.className = 'storm-circle-lightning';
                        characterElement.appendChild(stormLightning);
                        
                        // Remove effects after animation completes
                        setTimeout(() => {
                            stormCircleWave.remove();
                            stormLightning.remove();
                            stormHarbingerVfx.remove();
                        }, 1500);

                        // Fixed damage amount (same as Storm Circle)
                        const fixedDamage = 1000;
                        
                        // Apply damage to all enemies (without stun)
                        setTimeout(() => {
                            aliveEnemies.forEach((enemy, index) => {
                                setTimeout(() => {
                                    if (!enemy.isDead()) {
                                        // Apply damage
                                        const damageResult = enemy.applyDamage(fixedDamage, 'magical', character);
                                        log(`${enemy.name} takes ${damageResult.damage} magical damage from Storm Harbinger!`, damageResult.isCritical ? 'critical' : 'system');
                                        
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
                        
                        // Trigger passive after ability execution (just like Storm Circle would)
                        setTimeout(() => {
                            if (character.passiveHandler && typeof character.passiveHandler.onAbilityUsed === 'function') {
                                character.passiveHandler.onAbilityUsed(character);
                            }
                        }, 1500);
                    }, 300); // Small delay before executing the effect
                } else {
                    console.warn("Storm Circle ability not found for Storm Harbinger talent activation");
                }
            }
        }

        // Always check for low health dodge condition
        this.applyLowHealthDodge(character);
    }

    // Called whenever the character takes damage or heals
    applyLowHealthDodge(character) {
        if (!character || !character.lowHealthDodge) return;

        // Get current HP percentage
        const currentHpPercent = character.stats.currentHp / character.stats.maxHp;
        
        // Previous dodge buff status
        const hadDodgeBuff = character.hasLowHealthDodgeActive;
        
        // Check if below 50% HP
        if (currentHpPercent < 0.5) {
            // Apply dodge bonus if not already active
            if (!hadDodgeBuff) {
                // Log the activation
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${character.name}'s Lightning Evasion activates! +15% dodge chance when low health.`, 'system-update');
                
                // Show visual effect
                this.showLowHealthDodgeVFX(character);
                
                // Set the flag
                character.hasLowHealthDodgeActive = true;
                
                // Apply the stat change
                character.bonusDodgeChance = (character.bonusDodgeChance || 0) + this.lowHealthDodgeBonus;
                character.recalculateStats('low-health-dodge-activated');
                
                // Add visual indicator to the character
                this.updateLowHealthDodgeVisual(character, true);
            }
        } else if (hadDodgeBuff) {
            // Remove the bonus if no longer valid
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${character.name}'s Lightning Evasion deactivates as health recovers.`, 'system-update');
            
            // Clear the flag
            character.hasLowHealthDodgeActive = false;
            
            // Remove the stat bonus
            character.bonusDodgeChance = (character.bonusDodgeChance || 0) - this.lowHealthDodgeBonus;
            character.recalculateStats('low-health-dodge-deactivated');
            
            // Remove visual indicator
            this.updateLowHealthDodgeVisual(character, false);
        }
        
        // Update UI if needed
        if (typeof updateCharacterUI === 'function' && (hadDodgeBuff !== character.hasLowHealthDodgeActive)) {
            updateCharacterUI(character);
        }
    }
    
    // Update the visual indicator for low health dodge
    updateLowHealthDodgeVisual(character, isActive) {
        const elementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${elementId}`);
        if (!characterElement) return;
        
        const imageContainer = characterElement.querySelector('.image-container');
        if (!imageContainer) return;
        
        if (isActive) {
            // Add the visual class
            imageContainer.classList.add('low-health-dodge-active');
        } else {
            // Remove the visual class
            imageContainer.classList.remove('low-health-dodge-active');
        }
    }

    // Hook into character's damage application
    onDamageTaken(character, amount, type) {
        if (!character) return;
        
        // Check dodge status after taking damage
        setTimeout(() => {
            this.applyLowHealthDodge(character);
        }, 100);
    }

    // Hook into character's healing
    onHealReceived(character, amount) {
        if (!character) return;
        
        // Check dodge status after healing
        setTimeout(() => {
            this.applyLowHealthDodge(character);
        }, 100);
    }

    // Visual effect for low health dodge activation
    showLowHealthDodgeVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create dodge effect container
        const dodgeEffect = document.createElement('div');
        dodgeEffect.className = 'lightning-evasion-effect';
        characterElement.appendChild(dodgeEffect);
        
        // Create dodge text
        const dodgeText = document.createElement('div');
        dodgeText.className = 'lightning-evasion-text';
        dodgeText.textContent = '+15% DODGE';
        dodgeEffect.appendChild(dodgeText);
        
        // Play thunder sound if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/lightning_zap.mp3', 0.5);
        }
        
        // Remove effect after animation completes
        setTimeout(() => {
            dodgeEffect.remove();
        }, 2000);
    }

    // Visual effect for power growth
    showPowerGrowthVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create power growth effect container
        const powerEffect = document.createElement('div');
        powerEffect.className = 'raiden-power-growth-effect';
        characterElement.appendChild(powerEffect);
        
        // Add lightning particles
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'power-growth-particle';
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            // Set random positions via CSS variables
            const randomX = (Math.random() * 200 - 100) + 'px';
            const randomY = (Math.random() * 200 - 100) + 'px';
            particle.style.setProperty('--random-x', randomX);
            particle.style.setProperty('--random-y', randomY);
            
            powerEffect.appendChild(particle);
        }
        
        // Add floating text
        const powerText = document.createElement('div');
        powerText.className = 'power-growth-text';
        powerText.textContent = `+${this.magicalDamageGrowthAmount} MAG DMG`;
        powerEffect.appendChild(powerText);
        
        // Play thunder sound if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/thunder.mp3', 0.7);
        }
        
        // Remove effect after animation completes
        setTimeout(() => {
            powerEffect.remove();
        }, 2000);
    }

    // Custom damage application that bypasses magical shield
    applyZapDamage(caster, target, amount) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Check for dodge
        if (Math.random() < (target.stats.dodgeChance || 0)) {
            log(`${target.name} dodges ${caster.name}'s Zap!`, 'system');
            // Show dodge VFX if available
            if (typeof target.showDodgeVFX === 'function') {
                target.showDodgeVFX();
            }
            return { damage: 0, isDodged: true };
        }

        // Calculate damage (bypassing magical shield)
        let finalDamage = amount;
        
        // Check for critical hit
        const isCritical = Math.random() < (caster.stats.critChance || 0);
        if (isCritical) {
            finalDamage = Math.floor(finalDamage * (caster.stats.critDamage || 1.5));
            log(`${caster.name}'s Zap critically strikes ${target.name}!`, 'critical');
        }

        // Log the damage attempt (applyDamage will log the final result)
        log(`${caster.name}'s Zap targets ${target.name} for ${finalDamage} magical damage (ignoring shield)${isCritical ? ' (Critical)' : ''}!`, isCritical ? 'critical' : 'passive');

        // Apply damage with bypass option
        const damageResult = target.applyDamage(finalDamage, 'magical', caster, { bypassMagicalShield: true });

        // Return the result from applyDamage, which includes actual damage dealt
        return { damage: damageResult.damage, isCritical: isCritical, dodged: false }; // Pass crit status
    }

    // Show visual effects for Zap passive
    showZapVFX(caster, target) {
        // Get elements
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!casterElement || !targetElement) {
            console.warn("Cannot show zap VFX: Elements not found");
            return;
        }
        
        // Create a zap effect on caster
        const zapEffect = document.createElement('div');
        zapEffect.className = 'raiden-zap-effect';
        casterElement.appendChild(zapEffect);
        
        // Add lightning particles to the zap effect
        const numParticles = 6 + Math.floor(Math.random() * 4); // 6-9 particles
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'zap-particle';
            
            // Random position
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.left = `${Math.random() * 100}%`;
            
            // Random duration
            particle.style.animationDuration = `${0.3 + Math.random() * 0.4}s`;
            
            // Random delay
            particle.style.animationDelay = `${Math.random() * 0.2}s`;
            
            zapEffect.appendChild(particle);
        }
        
        // Activate the zap effect
        setTimeout(() => {
            zapEffect.classList.add('active');
        }, 50);
        
        // Create impact effect on target
        setTimeout(() => {
            const impactEffect = document.createElement('div');
            impactEffect.className = 'zap-impact-effect';
            targetElement.appendChild(impactEffect);
            
            // Remove zap effects after animations complete
            setTimeout(() => {
                zapEffect.remove();
                impactEffect.remove();
            }, 1000);
        }, 400); // Delay the impact effect
        
        // Check if this is a Chain Zap and add a connecting line effect
        if (caster.zapMultiTarget) {
            // Create container for the chain effect
            const chainContainer = document.createElement('div');
            chainContainer.className = 'zap-chain-effect';
            document.querySelector('.battle-container').appendChild(chainContainer);
            
            // Get positions of the elements for drawing the connecting line
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            // Calculate center points
            const casterCenterX = casterRect.left + casterRect.width / 2;
            const casterCenterY = casterRect.top + casterRect.height / 2;
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;
            
            // Calculate distance and angle
            const dx = targetCenterX - casterCenterX;
            const dy = targetCenterY - casterCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Create the chain line
            const chainLine = document.createElement('div');
            chainLine.className = 'zap-chain-line';
            chainLine.style.width = `${distance}px`;
            chainLine.style.left = `${casterCenterX}px`;
            chainLine.style.top = `${casterCenterY}px`;
            chainLine.style.transform = `rotate(${angle}deg)`;
            
            // Add to container
            chainContainer.appendChild(chainLine);
            
            // Remove the chain effect after animation
            setTimeout(() => {
                chainContainer.remove();
            }, 1000);
        }
    }
    
    // Visual effect for Zap lifesteal healing
    showZapLifestealVFX(character, healAmount) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create lightning healing effect container
        const healEffect = document.createElement('div');
        healEffect.className = 'lightning-heal-effect';
        characterElement.appendChild(healEffect);
        
        // Create healing particles
        const healParticles = document.createElement('div');
        healParticles.className = 'lightning-heal-particles';
        healEffect.appendChild(healParticles);
        
        // Create heal amount text
        const healText = document.createElement('div');
        healText.className = 'lightning-heal-text';
        healText.textContent = `+${healAmount}`;
        healEffect.appendChild(healText);
        
        // Add dynamic lightning sparks
        const numSparks = 8 + Math.floor(Math.random() * 5); // 8-12 sparks
        for (let i = 0; i < numSparks; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            
            // Set random rotation angle
            const rotation = Math.random() * 360;
            // Set random distance
            const distance = 30 + Math.random() * 70; // 30-100px
            
            // Apply custom properties for the animation
            spark.style.setProperty('--rotation', `${rotation}deg`);
            spark.style.setProperty('--distance', `${distance}px`);
            
            // Random position
            spark.style.top = `${Math.random() * 100}%`;
            spark.style.left = `${Math.random() * 100}%`;
            
            // Random delay
            spark.style.animationDelay = `${Math.random() * 0.5}s`;
            
            healEffect.appendChild(spark);
        }
        
        // Play heal sound if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/heal.mp3', 0.5);
        }
        
        // Remove effect after animation completes
        setTimeout(() => {
            healEffect.remove();
        }, 2000);
    }

    // Called when the character is created
    initialize(character) {
        console.log(`FarmerRaidenPassive initialized for ${character.name}`);
        
        // Initialize tracking stat
        this.totalZapsDone = 0;
        character.zapCounter = 0;
        character.hasLowHealthDodgeActive = false;
        
        // Apply initial magical shield if talent is active
        if (character.initialMagicalShield) {
            const shieldAmount = character.stats.magicalShield * this.initialMagicalShieldBonus;
            if (shieldAmount > 0) {
                // Apply the magical shield bonus
                const newShieldValue = character.stats.magicalShield * (1 + this.initialMagicalShieldBonus);
                character.baseStats.magicalShield = newShieldValue;
                character.recalculateStats('initial-magical-shield');
                
                // Log the effect
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${character.name}'s Magical Defense provides +${Math.round(shieldAmount)} initial Magical Shield!`, 'system-update');
                
                // Update character UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(character);
                }
            }
        }
        
        // Update the passive description based on talents
        this.updatePassiveDescription(character);
        
        // Add passive indicator to character UI
        this.createPassiveIndicator(character);
        
        // Apply low health dodge if it should be active initially
        if (character.lowHealthDodge) {
            this.applyLowHealthDodge(character);
        }
        
        // Add debug info
        console.log(`Character passiveHandler:`, character.passiveHandler);
        console.log(`onAbilityUsed function:`, character.passiveHandler.onAbilityUsed);

        // Add a delayed update to ensure talents are applied
        setTimeout(() => {
            console.log(`[FarmerRaidenPassive] Delayed call to updatePassiveDescription for ${character.name}`);
            this.updatePassiveDescription(character);
        }, 500); // Delay of 500ms
    }

    // Update the passive description based on talents
    updatePassiveDescription(character) {
        let description = this.basePassiveDescription;
        this.passiveTalentEffects = [];
        
        // Check for Lightning Mastery talent (200% damage)
        if (character.zapDamageMultiplier && character.zapDamageMultiplier > 1.0) {
            const dmgPercent = Math.floor(character.zapDamageMultiplier * 100);
            this.passiveTalentEffects.push(`<span class="talent-effect damage">Talent (Lightning Mastery): Zap now deals ${dmgPercent}% Magical Damage.</span>`);
        }
        
        // Check for Stunning Zap talent
        if (character.stunningZap) {
            const chancePercent = Math.floor(this.stunZapChance * 100);
            this.passiveTalentEffects.push(`<span class="talent-effect utility">Talent (Stunning Zap): ${chancePercent}% chance to stun the target for ${this.stunZapDuration} turns.</span>`);
        }
        
        // Check for Lightning Lifesteal talent
        if (character.zapLifesteal) {
            const lifestealPercent = Math.floor(this.zapLifestealPercentage * 100);
            this.passiveTalentEffects.push(`<span class="talent-effect healing">Talent (Lightning Lifesteal): Heal for ${lifestealPercent}% of Zap damage dealt.</span>`);
        }
        
        // Check for Lightning Fusion talent
        if (character.zapTriggerLightningOrb) {
            const chancePercent = Math.floor(character.zapTriggerLightningOrb * 100);
            this.passiveTalentEffects.push(`<span class="talent-effect damage">Talent (Lightning Fusion): ${chancePercent}% chance to trigger Lightning Orb on the same target.</span>`);
        }
        
        // Check for Chain Zap talent
        if (character.zapMultiTarget) {
            this.passiveTalentEffects.push(`<span class="talent-effect damage">Talent (Chain Zap): Zap hits an additional random enemy target.</span>`);
        }
        
        // Check for Storm Harbinger talent
        if (character.randomStormActivation) {
            this.passiveTalentEffects.push(`<span class="talent-effect damage">Talent (Storm Harbinger): 10% chance at turn start to randomly cast Storm Circle (without stun).</span>`);
        }
        
        // Check for Shocking Storm talent
        if (character.electricShockCastsStorm) {
            this.passiveTalentEffects.push(`<span class="talent-effect damage">Talent (Shocking Storm): Electric Shock now casts Storm Circle (without stun) after dealing damage.</span>`);
        }
        
        // Check for Disabling Shock talent
        if (character.shockedDisablesAbility) {
            this.passiveTalentEffects.push(`<span class="talent-effect utility">Talent (Disabling Shock): Enemies with the Shocked debuff have one random ability disabled.</span>`);
        }
        
        // Add talent effects to description if they exist
        if (this.passiveTalentEffects.length > 0) {
            description += "\n\n" + this.passiveTalentEffects.join("\n");
        }
        
        // Update passive description on character if possible
        if (character.passive) {
            character.passive.description = description;
        }
        
        return description;
    }

    // Show custom tooltip with HTML content
    showPassiveTooltip(event) {
        // Remove any existing tooltips
        const existingTooltip = document.querySelector('.passive-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        const target = event.currentTarget;
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'passive-tooltip';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'passive-tooltip-title';
        title.textContent = 'Zap (Passive)';
        tooltip.appendChild(title);
        
        // Add description content
        const content = document.createElement('div');
        content.className = 'passive-tooltip-description';
        
        // Create base description
        const baseDesc = document.createElement('div');
        baseDesc.className = 'passive-base-description';
        baseDesc.textContent = this.basePassiveDescription;
        content.appendChild(baseDesc);
        
        // Add talent effects
        if (this.passiveTalentEffects.length > 0) {
            this.passiveTalentEffects.forEach(effect => {
                const effectDiv = document.createElement('div');
                effectDiv.innerHTML = effect;
                content.appendChild(effectDiv);
            });
        }
        
        tooltip.appendChild(content);
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = target.getBoundingClientRect();
        tooltip.style.left = rect.left + window.scrollX + 'px';
        tooltip.style.top = rect.bottom + window.scrollY + 5 + 'px';
        
        // Make tooltip visible
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }
    
    // Hide tooltip
    hidePassiveTooltip() {
        const tooltip = document.querySelector('.passive-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                tooltip.remove();
            }, 200);
        }
    }

    // Creates the visual indicator on the character portrait
    createPassiveIndicator(character) {
        const tryCreate = () => {
            try {
                const elementId = character.instanceId || character.id;
                // Try multiple selectors to find the character element
                let characterElement = document.getElementById(`character-${elementId}`);
                
                if (!characterElement) {
                    // Try finding any element containing the character ID
                    const elements = document.querySelectorAll(`.character-slot`);
                    for (const el of elements) {
                        if (el.id.includes(elementId) || el.id.includes('farmer_raiden')) {
                            characterElement = el;
                            break;
                        }
                    }
                }
                
                if (characterElement) {
                    const imageContainer = characterElement.querySelector('.image-container');
                    // Check if indicator already exists
                    if (imageContainer && !imageContainer.querySelector(`.raiden-passive-indicator[data-character-id="${elementId}"]`)) {
                        const passiveIndicator = document.createElement('div');
                        passiveIndicator.className = 'raiden-passive-indicator';
                        passiveIndicator.dataset.characterId = elementId; // Add dataset for selection
                        
                        // Add the has-talents class if any passive-affecting talents are active
                        if (character.stunningZap === true || character.lowHealthDodge === true || 
                            character.powerGrowth === true || character.critOnBuff === true || 
                            character.zapLifesteal === true || character.initialMagicalShield === true ||
                            character.stormEmpowerment === true || character.zapDamageMultiplier) {
                            passiveIndicator.classList.add('has-talents');
                        }
                        
                        // Set initial description data
                        const initialDescription = this.basePassiveDescription + (this.passiveTalentEffects.length > 0 ? '\n' + this.passiveTalentEffects.join('\n') : '');
                        passiveIndicator.setAttribute('data-passive-description', initialDescription);
                        passiveIndicator.setAttribute('data-tooltip-html', 'true');
                        
                        imageContainer.appendChild(passiveIndicator);
                        console.log(`Passive indicator added for ${character.name} to element:`, characterElement.id);
                        
                        // Attach event listeners immediately after creation
                        passiveIndicator.addEventListener('mouseenter', this.showPassiveTooltip.bind(this));
                        passiveIndicator.addEventListener('mouseleave', this.hidePassiveTooltip.bind(this));
                    } else if (imageContainer && imageContainer.querySelector('.raiden-passive-indicator')) {
                        console.log(`Passive indicator already exists for ${character.name}`);
                    } else {
                        console.warn(`Found character element but no image container for ${character.name}`);
                    }
                } else {
                    console.warn(`Could not find character element for ${character.name} (${elementId})`);
                }
            } catch (error) {
                console.error(`Error creating passive indicator for ${character.name}:`, error);
            }
        };

        // Try immediately, but also set up a delayed attempt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryCreate);
        } else {
            tryCreate();
            // Try again in a moment if the UI is still being built
            setTimeout(tryCreate, 500);
        }
    }

    // Add the Growing Power VFX method
    showGrowingPowerVFX(character, amount) {
        if (!character || !character.element) return;
        
        // Create growing power effect container
        const effectContainer = document.createElement('div');
        effectContainer.className = 'raiden-power-growth-effect';
        character.element.querySelector('.image-container').appendChild(effectContainer);
        
        // Create power increase text
        const powerText = document.createElement('div');
        powerText.className = 'power-growth-text';
        powerText.textContent = `+${amount} M.DMG`;
        powerText.style.color = '#ffb700'; // Golden color for growing power
        effectContainer.appendChild(powerText);
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'power-growth-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            effectContainer.appendChild(particle);
        }
        
        // Show floating text above character
        window.gameManager.uiManager.showFloatingText(
            character.instanceId,
            `+${amount} M.DMG`,
            'buff'
        );
        
        // Remove effect after animation completes
        setTimeout(() => {
            if (effectContainer && effectContainer.parentNode) {
                effectContainer.parentNode.removeChild(effectContainer);
            }
        }, 2000);
    }
}

// Make the class globally available
window.FarmerRaidenPassive = FarmerRaidenPassive; 