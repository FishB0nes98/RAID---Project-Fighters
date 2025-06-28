// Schoolboy Shoma Abilities - Statistics Tracking Enhancement
// This file ensures all of Schoolboy Shoma's abilities properly track battle statistics

/**
 * Enhanced Boink ability with proper statistics tracking
 * This hooks into the existing AbilityFactory system to ensure tracking
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Schoolboy Shoma abilities statistics tracking module loaded');
    
    // Wait for the game to fully initialize
    const initializeShomaStatistics = () => {
        if (typeof window.gameManager === 'undefined' || typeof AbilityFactory === 'undefined') {
            console.log('Waiting for game initialization...');
            setTimeout(initializeShomaStatistics, 100);
            return;
        }
        
        console.log('Initializing Schoolboy Shoma statistics tracking...');
        
        // Store original createDamageEffect method
        const originalCreateDamageEffect = AbilityFactory.createDamageEffect;
        
        // Override createDamageEffect to ensure Boink has proper tracking
        AbilityFactory.createDamageEffect = function(abilityData) {
            const originalEffect = originalCreateDamageEffect.call(this, abilityData);
            
            // Specifically handle Boink ability
            if (abilityData.id === 'boink') {
                return (caster, target, options = {}) => {
                    console.log(`[Boink Enhanced] Starting enhanced Boink logic for ${caster.name} targeting ${target.name}`);
                    
                    try {
                        // Check for talent bonuses
                        const hasDebuffHunter = caster.hasTalent && caster.hasTalent('debuff_hunter');
                        const hasPowerBoink = caster.hasTalent && caster.hasTalent('power_boink');
                        const hasEfficientBoink = caster.hasTalent && caster.hasTalent('efficient_boink');
                        const hasBoinkBurn = caster.hasTalent && caster.hasTalent('boink_burn');
                        const hasDevastatingPower = caster.hasTalent && caster.hasTalent('devastating_power');
                        const hasElementalJuggling = caster.hasTalent && caster.hasTalent('elemental_juggling');
                        
                        console.log(`[Boink Enhanced] Talents: PowerBoink=${hasPowerBoink}, DebuffHunter=${hasDebuffHunter}, EfficientBoink=${hasEfficientBoink}, BoinkBurn=${hasBoinkBurn}, DevastatingPower=${hasDevastatingPower}, ElementalJuggling=${hasElementalJuggling}`);
                    
                    // Calculate base damage (125% physical damage)
                    let damage = caster.stats.physicalDamage * 1.25;
                    
                    // Apply Power Boink talent (85% additional Physical Damage scaling)
                    if (hasPowerBoink) {
                        const powerBoinkDamage = caster.stats.physicalDamage * 0.85;
                        damage += powerBoinkDamage;
                        console.log(`[Power Boink] Added ${powerBoinkDamage} damage (85% of ${caster.stats.physicalDamage})`);
                        
                        // Show Power Boink VFX
                        showPowerBoinkVFX(caster, target);
                    }
                    
                    // Apply Debuff Hunter bonus if target has debuffs
                    if (hasDebuffHunter && target.statusEffects && Object.keys(target.statusEffects).length > 0) {
                        damage *= 1.25;
                        console.log(`[Debuff Hunter] Applied 25% damage bonus to ${target.name} with debuffs`);
                        
                        // Show Debuff Hunter VFX
                        showDebuffHunterVFX(caster, target);
                    }
                    
                    // Apply Devastating Power talent (double damage from all sources)
                    if (hasDevastatingPower) {
                        const originalDamage = damage;
                        damage *= 2;
                        console.log(`[Devastating Power] Doubled damage: ${originalDamage} → ${damage}`);
                        
                        // Show Devastating Power VFX
                        showDevastatingPowerVFX(caster, target, originalDamage, damage);
                        
                        // Add battle log entry
                        if (window.gameManager && window.gameManager.addLogEntry) {
                            window.gameManager.addLogEntry(
                                `${caster.name}'s Devastating Power talent activates! Damage doubled!`,
                                'system-update'
                            );
                        }
                    }
                    
                    // Apply damage with ability tracking
                    const result = target.applyDamage(damage, 'physical', caster, { abilityId: 'boink' });
                    
                    // Apply Boink Burn effect
                    if (hasBoinkBurn) {
                        const burnDebuff = {
                            id: 'boink_burn',
                            name: 'Boink Burn',
                            duration: 3,
                            damagePerTurn: 100,
                            source: 'boink_burn',
                            description: 'Burning damage from Boink attack',
                            onTurnStart: function(character) {
                                console.log(`[Boink Burn] onTurnStart triggered for ${character.name}, dealing ${this.damagePerTurn} damage`);
                                
                                let burnDamage = this.damagePerTurn;
                                
                                // Apply Devastating Power to burn damage if active
                                if (caster.hasTalent && caster.hasTalent('devastating_power')) {
                                    burnDamage *= 2;
                                    console.log(`[Devastating Power] Burn damage doubled: ${this.damagePerTurn} → ${burnDamage}`);
                                }
                                
                                const damageResult = character.applyDamage(burnDamage, 'magical', null, { abilityId: 'boink_burn_dot' });
                                
                                // Add battle log entry
                                if (window.gameManager && window.gameManager.addLogEntry) {
                                    window.gameManager.addLogEntry(`${character.name} takes ${damageResult.damage} burn damage from Boink!`, 'debuff');
                                }
                                
                                // Show burn damage VFX
                                if (window.showFireBallBurnVFX) {
                                    window.showFireBallBurnVFX(character, burnDamage);
                                }
                            }
                        };
                        
                        target.addDebuff(burnDebuff);
                        console.log(`[Boink Burn] Applied burn to ${target.name} for 3 turns (100 damage/turn)`);
                        console.log(`[Boink Burn] Target debuffs after application:`, target.debuffs.map(d => ({ id: d.id, name: d.name, duration: d.duration })));
                        
                        // Show Boink Burn VFX
                        showBoinkBurnVFX(caster, target);
                        
                        // Add battle log entry
                        if (window.gameManager && window.gameManager.addLogEntry) {
                            window.gameManager.addLogEntry(
                                `${caster.name}'s Boink sets ${target.name} on fire! (100 damage/turn for 3 turns)`,
                                'system-update'
                            );
                        }
                    }
                    
                    // Apply Boink Taunt effect
                    const hasBoinkTaunt = caster.hasTalent && caster.hasTalent('boink_taunt');
                    if (hasBoinkTaunt) {
                        const boinkTauntDebuff = {
                            id: 'boink_taunt',
                            name: 'Boink',
                            duration: 2,
                            icon: 'Icons/abilities/boink.jfif',
                            description: `Must attack ${caster.name} instead of other targets`,
                            isDebuff: true,
                            effects: {
                                forcedTargeting: caster.id,
                                forcedTargetingCharacter: caster
                            }
                        };
                        
                        target.addDebuff(boinkTauntDebuff);
                        console.log(`[Boink Taunt] Applied taunt to ${target.name} for 2 turns (must attack ${caster.name})`);
                        
                        // Show Boink Taunt VFX
                        showBoinkTauntVFX(caster, target);
                        
                        // Add battle log entry
                        if (window.gameManager && window.gameManager.addLogEntry) {
                            window.gameManager.addLogEntry(
                                `${target.name} is taunted by ${caster.name}'s Boink and must attack him!`,
                                'system'
                            );
                        }
                    }
                    
                    // Handle Compassionate Resonance talent
                    if (caster.hasTalent && caster.hasTalent('compassionate_resonance')) {
                        const healAmount = Math.floor(result.damage * 0.5);
                        if (healAmount > 0) {
                            healRandomAlly(caster, healAmount, 'compassionate_resonance');
                        }
                    }
                    
                    console.log(`[Boink Enhanced] About to check stun chance (40%)`);
                    
                    // Handle stun chance (40%)
                    const stunRoll = Math.random();
                    console.log(`[Boink Enhanced] Stun roll: ${stunRoll} (need < 0.4 for stun)`);
                    
                    if (stunRoll < 0.4) {
                        console.log(`[Boink Enhanced] Stun triggered! Creating stun debuff...`);
                        
                        // Create stun debuff properly
                        const stunDebuff = new Effect(
                            'stun',
                            'Stunned',
                            'Icons/effects/stun.png',
                            2,
                            null,
                            false
                        );
                        stunDebuff.effects = { cantAct: true };
                        stunDebuff.description = 'Cannot act for 2 turns.';
                        
                        target.addDebuff(stunDebuff);
                        console.log(`[Boink Enhanced] Successfully stunned ${target.name} for 2 turns`);
                    } else {
                        console.log(`[Boink Enhanced] No stun this time (roll was ${stunRoll})`);
                    }
                    
                    console.log('[Boink Enhanced] About to handle turn ending logic');
                    if (window.gameManager) {
                        window.gameManager.preventTurnEndFlag = false;
                        console.log('[Boink Enhanced] FORCING turn to end for', caster.name, '- preventTurnEndFlag set to FALSE');
                        console.log('[Boink Enhanced] Elemental Juggling only applies to Ball abilities, not Boink');
                    }
                    console.log('[Boink Enhanced] End of Boink ability - preventTurnEndFlag:', window.gameManager ? window.gameManager.preventTurnEndFlag : 'no gameManager');
                    
                    console.log(`[Boink Enhanced] About to track ability usage and return result`);
                    
                    // Track ability usage
                    if (window.StatisticsManager) {
                        window.StatisticsManager.recordAbilityUsage(caster, 'boink');
                        console.log(`[Boink Enhanced] Successfully tracked ability usage`);
                    } else {
                        console.warn(`[Boink Enhanced] StatisticsManager not found - cannot track usage`);
                    }
                    
                    console.log(`[Boink Enhanced] Enhanced Boink logic completed successfully! Returning result:`, result);
                    
                    return result;
                    
                    } catch (error) {
                        console.error(`[Boink Enhanced] Error in enhanced Boink logic:`, error);
                        console.error(`[Boink Enhanced] Falling back to original effect`);
                        
                        // If there's an error, fall back to the original effect
                        return originalEffect(caster, target, options);
                    }
                };
            }
            
            return originalEffect;
        };
        
        // Store original createBuffEffect method to track buff applications
        const originalCreateBuffEffect = AbilityFactory.createBuffEffect;
        
        // Override createBuffEffect to ensure Shoma's buffs have proper tracking
        AbilityFactory.createBuffEffect = function(abilityData) {
            const originalEffect = originalCreateBuffEffect.call(this, abilityData);
            
            // Specifically handle Shoma's buff abilities
            if (['catch', 'homerun'].includes(abilityData.id)) {
                return (caster, targetOrTargets) => {
                    console.log(`[Shoma Stats] ${abilityData.id} buff ability tracking`);
                    
                    // Record buff application in statistics if statistics manager exists
                    if (window.statisticsManager && caster && targetOrTargets) {
                        const target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
                        try {
                            // Track as utility ability usage
                            window.statisticsManager.recordAbilityUsage(caster, abilityData.id, 'utility', 0, false);
                            console.log(`[Shoma Stats] Recorded ${abilityData.id} usage for ${caster.name}`);
                        } catch (error) {
                            console.error(`[Shoma Stats] Error recording ${abilityData.id} usage:`, error);
                        }
                    }
                    
                    // Handle turn ending logic for buff abilities
                    if (abilityData.id === 'homerun') {
                        // Check for Homerun Mastery talent
                        const hasHomerunMastery = caster.hasTalent && caster.hasTalent('homerun_mastery');
                        if (hasHomerunMastery) {
                            // Homerun Mastery prevents turn ending
                            if (window.gameManager) {
                                window.gameManager.preventTurnEndFlag = true;
                                console.log(`[Homerun Mastery] ${caster.name}'s turn continues after Homerun!`);
                                
                                // Add battle log entry
                                if (window.gameManager.addLogEntry) {
                                    window.gameManager.addLogEntry(
                                        `${caster.name}'s Homerun Mastery allows continued action!`,
                                        'system-update'
                                    );
                                }
                            }
                        } else {
                            // Normal Homerun ends turn
                            if (window.gameManager) {
                                window.gameManager.preventTurnEndFlag = false;
                                console.log(`[Homerun] Normal turn ending for ${caster.name} (no Homerun Mastery)`);
                            }
                        }
                    } else {
                        // Other buff abilities (like Catch) always end turn normally
                        if (window.gameManager) {
                            window.gameManager.preventTurnEndFlag = false;
                            console.log(`[${abilityData.id}] Normal turn ending for ${caster.name} (Elemental Juggling only applies to Ball abilities)`);
                        }
                    }
                    
                    // Call the original effect
                    return originalEffect(caster, targetOrTargets);
                };
            }
            
            // For other abilities, return original effect
            return originalEffect;
        };
        
        // Initialize talent properties for any existing Shoma characters
        if (window.gameManager && window.gameManager.gameState) {
            const allCharacters = [
                ...(window.gameManager.gameState.playerCharacters || []),
                ...(window.gameManager.gameState.aiCharacters || [])
            ];
            
            allCharacters.forEach(character => {
                if (character.id === 'schoolboy_shoma') {
                    window.initializeShomasTalentProperties(character);
                }
            });
        }
        
        console.log('Schoolboy Shoma statistics tracking initialization complete');
    };
    
    // Start initialization
    initializeShomaStatistics();
    
    // Hook into debuff system to trigger Debuff Resonance recalculation
    if (typeof Character !== 'undefined') {
        const originalAddDebuff = Character.prototype.addDebuff;
        const originalRemoveDebuff = Character.prototype.removeDebuff;
        
        Character.prototype.addDebuff = function(debuff) {
            const result = originalAddDebuff.call(this, debuff);
            
            // Trigger Debuff Resonance recalculation for Shoma characters
            if (typeof window.triggerDebuffResonanceRecalculation === 'function') {
                window.triggerDebuffResonanceRecalculation();
            }
            
            return result;
        };
        
        Character.prototype.removeDebuff = function(debuffId) {
            const result = originalRemoveDebuff.call(this, debuffId);
            
            // Trigger Debuff Resonance recalculation for Shoma characters
            if (typeof window.triggerDebuffResonanceRecalculation === 'function') {
                window.triggerDebuffResonanceRecalculation();
            }
            
            return result;
        };
        
        console.log('[Debuff Resonance] Hooked into debuff system for dynamic recalculation');
    }
});

/**
 * Generate dynamic description for Boink ability
 * This function is attached to the Boink ability object
 */
function generateBoinkDescription() {
    const character = this.character || this.caster;
    if (!character) {
        return "Deals 125% physical damage to the target. Has a 40% chance to stun the target for 2 turns.";
    }
    
    // Check for talents
    const hasPowerBoink = character.hasTalent && character.hasTalent('power_boink');
    const hasEfficientBoink = character.hasTalent && character.hasTalent('efficient_boink');
    const hasDebuffHunter = character.hasTalent && character.hasTalent('debuff_hunter');
    const hasCompassionateResonance = character.hasTalent && character.hasTalent('compassionate_resonance');
    const hasBoinkBurn = character.hasTalent && character.hasTalent('boink_burn');
    const hasDevastatingPower = character.hasTalent && character.hasTalent('devastating_power');
    const hasElementalJuggling = character.hasTalent && character.hasTalent('elemental_juggling');
    
    // Base description with colorful damage value
    let description = `Deals <span class="damage-value">125%</span> physical damage to the target.`;
    
    // Add Power Boink effect
    if (hasPowerBoink) {
        description += ` <span class="talent-effect damage">Enhanced by Power Boink: +85% additional Physical Damage scaling</span>.`;
    }
    
    // Add stun chance
    description += ` Has a <span class="utility-value">40%</span> chance to stun the target for <span class="duration-value">2 turns</span>.`;
    
    // Add Debuff Hunter effect
    if (hasDebuffHunter) {
        description += ` <span class="talent-effect damage">Debuff Hunter: +25% damage vs targets with debuffs</span>.`;
    }
    
    // Add Boink Burn effect
    if (hasBoinkBurn) {
        description += ` <span class="talent-effect damage">Burning Boink: Applies Burn (100 dmg/turn for 3 turns, stacks with other burns)</span>.`;
    }
    
    // Add Devastating Power effect
    if (hasDevastatingPower) {
        description += ` <span class="talent-effect damage">Devastating Power: ALL damage doubled!</span>.`;
    }
    
    // Add Elemental Juggling effect
    if (hasElementalJuggling) {
        description += ` <span class="talent-effect utility">Elemental Juggling: Using Ball abilities does NOT end your turn.</span>.`;
    }
    
    // Add Compassionate Resonance effect
    if (hasCompassionateResonance) {
        description += ` <span class="talent-effect healing">Compassionate Resonance: Heals random ally for 50% of damage dealt</span>.`;
    }
    
    // Add mana cost information
    const manaCost = hasEfficientBoink ? 0 : 45;
    if (hasEfficientBoink) {
        description += ` <span class="talent-effect utility">Efficient Boink: Costs no mana</span>.`;
    }
    
    return description;
}

/**
 * Update Shoma's ability descriptions when talents are active
 */
function updateShomaAbilityDescriptions(character) {
    if (!character || character.id !== 'schoolboy_shoma') return;
    
    console.log(`[Shoma Talents] Updating ability descriptions for ${character.name}`);
    
    // Find the Boink ability
    const boinkAbility = character.abilities.find(ability => ability.id === 'boink');
    if (boinkAbility) {
        // Attach the generateDescription function to the ability
        boinkAbility.generateDescription = generateBoinkDescription;
        boinkAbility.character = character; // Ensure character reference
        
        // Generate the new description
        const oldDescription = boinkAbility.description;
        boinkAbility.description = boinkAbility.generateDescription();
        
        console.log(`[Shoma Talents] Updated Boink description:`);
        console.log(`  Old: ${oldDescription}`);
        console.log(`  New: ${boinkAbility.description}`);
    }
    
    // Find the Homerun ability
    const homerunAbility = character.abilities.find(ability => ability.id === 'homerun');
    if (homerunAbility) {
        // Attach the generateDescription function to the ability
        homerunAbility.generateDescription = generateHomerunDescription;
        homerunAbility.character = character; // Ensure character reference
        
        // Generate the new description
        const oldDescription = homerunAbility.description;
        homerunAbility.description = homerunAbility.generateDescription();
        
        console.log(`[Shoma Talents] Updated Homerun description:`);
        console.log(`  Old: ${oldDescription}`);
        console.log(`  New: ${homerunAbility.description}`);
    }
    
    // Update ball abilities descriptions
    updateBallAbilityDescriptions(character);
    
    // Check for talents and show VFX
    const hasPowerBoink = character.hasTalent && character.hasTalent('power_boink');
    const hasEfficientBoink = character.hasTalent && character.hasTalent('efficient_boink');
    const hasDebuffHunter = character.hasTalent && character.hasTalent('debuff_hunter');
    const hasCompassionateResonance = character.hasTalent && character.hasTalent('compassionate_resonance');
    const hasBoinkBurn = character.hasTalent && character.hasTalent('boink_burn');
    const hasWaterBallDoubleCast = character.hasTalent && character.hasTalent('water_ball_double_cast');
    const hasDevastatingPower = character.hasTalent && character.hasTalent('devastating_power');
    const hasHealingMastery = character.hasTalent && character.hasTalent('healing_mastery');
    const hasGrassGrowth = character.hasTalent && character.hasTalent('grass_growth');
    const hasMagicalEmpowerment = character.hasTalent && character.hasTalent('magical_empowerment');
    const hasElementalJuggling = character.hasTalent && character.hasTalent('elemental_juggling');
    const hasHomerunMastery = character.hasTalent && character.hasTalent('homerun_mastery');
    const hasDebuffResonance = character.hasTalent && character.hasTalent('debuff_resonance');
    const hasGrassBallFlow = character.hasTalent && character.hasTalent('grass_ball_flow');
    const hasGrassBallBounce = character.hasTalent && character.hasTalent('grass_ball_bounce');
    
    if (hasPowerBoink || hasEfficientBoink || hasDebuffHunter || hasCompassionateResonance || hasBoinkBurn || hasWaterBallDoubleCast || hasDevastatingPower || hasHealingMastery || hasGrassGrowth || hasMagicalEmpowerment || hasElementalJuggling || hasHomerunMastery || hasDebuffResonance || hasGrassBallFlow || hasGrassBallBounce) {
        console.log(`[Shoma Talents] Active talents: Power Boink=${hasPowerBoink}, Efficient Boink=${hasEfficientBoink}, Debuff Hunter=${hasDebuffHunter}, Compassionate Resonance=${hasCompassionateResonance}, Boink Burn=${hasBoinkBurn}, Water Ball Double Cast=${hasWaterBallDoubleCast}, Devastating Power=${hasDevastatingPower}, Healing Mastery=${hasHealingMastery}, Grass Growth=${hasGrassGrowth}, Magical Empowerment=${hasMagicalEmpowerment}, Elemental Juggling=${hasElementalJuggling}, Homerun Mastery=${hasHomerunMastery}, Debuff Resonance=${hasDebuffResonance}, Grass Ball Flow=${hasGrassBallFlow}, Grass Ball Bounce=${hasGrassBallBounce}`);
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('abilityDescriptionUpdated', {
            detail: { 
                character: character,
                abilityId: 'homerun',
                talents: { hasPowerBoink, hasEfficientBoink, hasDebuffHunter, hasCompassionateResonance, hasBoinkBurn, hasWaterBallDoubleCast, hasDevastatingPower, hasHealingMastery, hasGrassGrowth, hasMagicalEmpowerment, hasElementalJuggling, hasHomerunMastery, hasDebuffResonance, hasGrassBallFlow, hasGrassBallBounce }
            }
        }));
    }
}

/**
 * Update ball abilities descriptions based on talents
 */
function updateBallAbilityDescriptions(character) {
    if (!character || character.id !== 'schoolboy_shoma') return;
    
    // Find ball throw abilities
    const ballAbilities = character.abilities.filter(ability => 
        ability.id.startsWith('ball_throw_') && ability.id !== 'ball_throw'
    );
    
    ballAbilities.forEach(ability => {
        const originalDescription = ability.originalDescription || ability.description;
        ability.originalDescription = originalDescription;
        
        let newDescription = originalDescription;
        
        // Check for Compassionate Resonance talent (applies to all ball abilities)
        const hasCompassionateResonance = character.hasTalent && character.hasTalent('compassionate_resonance');
        if (hasCompassionateResonance) {
            newDescription += ` <span class="talent-effect healing">Compassionate Resonance: Heals random ally for 50% of damage dealt</span>.`;
        }
        
        // Check for Devastating Power talent (applies to all ball abilities)
        const hasDevastatingPower = character.hasTalent && character.hasTalent('devastating_power');
        if (hasDevastatingPower) {
            newDescription += ` <span class="talent-effect damage">Devastating Power: ALL damage doubled!</span>.`;
        }
        
        // Elemental Juggling talent (applies to all ball abilities)
        const hasElementalJuggling = character.hasTalent && character.hasTalent('elemental_juggling');
        if (hasElementalJuggling) {
            newDescription += ` <span class="talent-effect utility">Elemental Juggling: Using this Ball does NOT end your turn.</span>.`;
        }
        
        // Check for specific ball talents
        switch (ability.id) {
            case 'ball_throw_grass':
                const hasEnhancedGrassBall = character.hasTalent && character.hasTalent('enhanced_grass_ball');
                const hasHealingMastery = character.hasTalent && character.hasTalent('healing_mastery');
                const hasGrassGrowth = character.hasTalent && character.hasTalent('grass_growth');
                const hasMagicalEmpowerment = character.hasTalent && character.hasTalent('magical_empowerment');
                const hasGrassBallFlow = character.hasTalent && character.hasTalent('grass_ball_flow');
                const hasGrassBallBounce = character.hasTalent && character.hasTalent('grass_ball_bounce');
                
                if (hasEnhancedGrassBall) {
                    newDescription += ` <span class="talent-effect healing">Verdant Recovery: +250% healing on buffed targets</span>.`;
                }
                if (hasHealingMastery) {
                    newDescription += ` <span class="talent-effect healing">Healing Mastery: +20% healing power</span>.`;
                }
                if (hasGrassGrowth) {
                    newDescription += ` <span class="talent-effect healing">Grass Growth: Applies delayed healing buff (2% max HP after 2 turns)</span>.`;
                }
                if (hasMagicalEmpowerment) {
                    newDescription += ` <span class="talent-effect damage">Magical Empowerment: Grants +30% Magical Damage for 3 turns</span>.`;
                }
                if (hasGrassBallFlow) {
                    newDescription += ` <span class="talent-effect utility">Grass Ball Flow: Using this Ball does NOT end your turn.</span>.`;
                }
                if (hasGrassBallBounce) {
                    newDescription += ` <span class="talent-effect healing">Healing Cascade: 75% chance to heal each other ally</span>.`;
                }
                break;
                
            case 'ball_throw_heavy':
                const hasHeavyBallMastery = character.hasTalent && character.hasTalent('heavy_ball_cooldown_mastery');
                const hasHeavyBallBounce = character.hasTalent && character.hasTalent('heavy_ball_bounce');
                // Update base description wording for debuff and duration
                newDescription = newDescription.replace('physical damage reduced by 20% for 3 turns', 'damage output reduced by 20% for 2 turns');
                // Optionally fix outdated 450 -> 400
                newDescription = newDescription.replace('450', '400');
                if (hasHeavyBallMastery) {
                    newDescription += ` <span class="talent-effect utility">Heavy Ball Mastery: Cooldown reduced to 1</span>.`;
                }
                if (hasHeavyBallBounce) {
                    newDescription += ` <span class="talent-effect damage">Rebounding Impact: Bounces to an additional enemy</span>.`;
                }
                break;
                
            case 'ball_throw_fire':
                const hasFireBallBurn = character.hasTalent && character.hasTalent('fire_ball_burn');
                const hasFireBallMagicalScaling = character.hasTalent && character.hasTalent('fire_ball_magical_scaling');
                
                if (hasFireBallMagicalScaling) {
                    newDescription = newDescription.replace('600 + 2% target max HP as magic damage', '600 + 2% target max HP + <span class="talent-effect damage">100% Magical Damage</span> as magic damage');
                    newDescription += ` <span class="talent-effect damage">Infernal Magic: Enhanced with magical power</span>.`;
                }
                if (hasFireBallBurn) {
                    newDescription += ` <span class="talent-effect damage">Scorching Flames: Applies Burn (20 dmg/turn for 3 turns, stacks infinitely)</span>.`;
                }
                break;
                
            case 'ball_throw_water':
                const hasWaterBallSplashPower = character.hasTalent && character.hasTalent('water_ball_splash_power');
                const hasWaterBallMagicalScaling = character.hasTalent && character.hasTalent('water_ball_magical_scaling');
                const hasWaterBallDoubleCast = character.hasTalent && character.hasTalent('water_ball_double_cast');
                
                if (hasWaterBallMagicalScaling) {
                    newDescription = newDescription.replace('550 damage to main target', '550 + <span class="talent-effect damage">100% Magical Damage</span> to main target');
                    if (hasWaterBallSplashPower) {
                        newDescription = newDescription.replace('480', '<span class="damage-value">480 + Magic</span>');
                    } else {
                        newDescription = newDescription.replace('180 to all other enemies', '180 + <span class="talent-effect damage">Magical Damage</span> to all other enemies');
                    }
                    newDescription += ` <span class="talent-effect damage">Tsunami Force: Enhanced with magical tsunamis</span>.`;
                }
                if (hasWaterBallSplashPower) {
                    if (!hasWaterBallMagicalScaling) {
                        newDescription = newDescription.replace('180', '<span class="damage-value">480</span>');
                    }
                    newDescription += ` <span class="talent-effect damage">Tidal Devastation: +300 splash damage</span>.`;
                }
                if (hasWaterBallDoubleCast) {
                    newDescription += ` <span class="talent-effect damage">Tidal Echo: 50% chance to trigger twice</span>.`;
                }
                break;
        }
        
        ability.description = newDescription;
    });
}

/**
 * Debuff Hunter VFX System
 * Creates visual effects when the debuff hunter talent triggers
 */
function showDebuffHunterVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
    
    if (casterElement && targetElement) {
        // Create hunter focus effect on caster
        const hunterFocus = document.createElement('div');
        hunterFocus.className = 'debuff-hunter-focus';
        casterElement.appendChild(hunterFocus);
        
        // Create targeting laser between caster and target
        const hunterLaser = document.createElement('div');
        hunterLaser.className = 'debuff-hunter-laser';
        document.body.appendChild(hunterLaser);
        
        // Position laser
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const angle = Math.atan2(targetRect.top - casterRect.top, targetRect.left - casterRect.left);
        const distance = Math.hypot(targetRect.left - casterRect.left, targetRect.top - casterRect.top);
        
        hunterLaser.style.left = `${casterRect.left + casterRect.width/2}px`;
        hunterLaser.style.top = `${casterRect.top + casterRect.height/2}px`;
        hunterLaser.style.width = `${distance}px`;
        hunterLaser.style.transform = `rotate(${angle}rad)`;
        hunterLaser.style.transformOrigin = '0 50%';
        
        // Create weakness highlight on target
        const weaknessHighlight = document.createElement('div');
        weaknessHighlight.className = 'debuff-hunter-weakness';
        targetElement.appendChild(weaknessHighlight);
        
        // Cleanup
        setTimeout(() => {
            if (hunterFocus.parentNode) hunterFocus.parentNode.removeChild(hunterFocus);
            if (hunterLaser.parentNode) hunterLaser.parentNode.removeChild(hunterLaser);
            if (weaknessHighlight.parentNode) weaknessHighlight.parentNode.removeChild(weaknessHighlight);
        }, 2000);
    }
}

/**
 * Power Boink VFX System
 * Creates enhanced visual effects when the Power Boink talent is active
 */
function showPowerBoinkVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
    
    if (casterElement) {
        // Create power aura around caster
        const powerAura = document.createElement('div');
        powerAura.className = 'power-boink-aura';
        casterElement.appendChild(powerAura);
        
        // Create energy burst
        const energyBurst = document.createElement('div');
        energyBurst.className = 'power-boink-energy-burst';
        casterElement.appendChild(energyBurst);
        
        // Create floating "POWER BOINK!" text
        const powerText = document.createElement('div');
        powerText.className = 'power-boink-text';
        powerText.textContent = 'POWER BOINK!';
        casterElement.appendChild(powerText);
        
        // Create strength particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'power-boink-strength-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            casterElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2000);
        }
        
        // Cleanup main elements
        setTimeout(() => {
            if (powerAura.parentNode) powerAura.parentNode.removeChild(powerAura);
            if (energyBurst.parentNode) energyBurst.parentNode.removeChild(energyBurst);
            if (powerText.parentNode) powerText.parentNode.removeChild(powerText);
        }, 1500);
    }
    
    // Add impact effect on target
    if (targetElement) {
        const impactEffect = document.createElement('div');
        impactEffect.className = 'power-boink-impact';
        targetElement.appendChild(impactEffect);
        
        setTimeout(() => {
            if (impactEffect.parentNode) impactEffect.parentNode.removeChild(impactEffect);
        }, 1000);
    }
}

/**
 * Boink Burn VFX System
 * Creates visual effects when the Boink Burn talent triggers
 */
function showBoinkBurnVFX(caster, target) {
    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
    if (!targetElement) return;
    
    // Create burn aura
    const burnAura = document.createElement('div');
    burnAura.className = 'boink-burn-aura';
    burnAura.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(255,100,0,0.4) 0%, rgba(255,50,0,0.2) 50%, transparent 100%);
        border-radius: 50%;
        animation: boinkBurnPulse 1.5s ease-in-out;
        pointer-events: none;
        z-index: 1000;
    `;
    targetElement.appendChild(burnAura);
    
    // Create floating burn text
    const burnText = document.createElement('div');
    burnText.className = 'boink-burn-text';
    burnText.textContent = 'BOINK BURN!';
    burnText.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: #ff4500;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: boinkBurnTextFloat 2s ease-out forwards;
        pointer-events: none;
        z-index: 1001;
    `;
    targetElement.appendChild(burnText);
    
    // Create fire particles
    for (let i = 0; i < 10; i++) {
        const fireParticle = document.createElement('div');
        fireParticle.className = 'boink-burn-particle';
        fireParticle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #ff4500, #ff6500);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: boinkBurnParticleFloat ${1.5 + Math.random() * 0.5}s ease-out forwards;
            animation-delay: ${Math.random() * 0.3}s;
            pointer-events: none;
        `;
        targetElement.appendChild(fireParticle);
        
        setTimeout(() => {
            if (fireParticle.parentNode) fireParticle.parentNode.removeChild(fireParticle);
        }, 2000);
    }
    
    // Create burning impact effect
    const impactEffect = document.createElement('div');
    impactEffect.className = 'boink-burn-impact';
    impactEffect.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(255,100,0,0.6) 0%, transparent 70%);
        border-radius: 50%;
        animation: boinkBurnImpact 0.8s ease-out;
        pointer-events: none;
        z-index: 999;
    `;
    targetElement.appendChild(impactEffect);
    
    // Cleanup
    setTimeout(() => {
        if (burnAura.parentNode) burnAura.parentNode.removeChild(burnAura);
        if (burnText.parentNode) burnText.parentNode.removeChild(burnText);
        if (impactEffect.parentNode) impactEffect.parentNode.removeChild(impactEffect);
    }, 2000);
}

/**
 * Shows Devastating Power VFX with dramatic MOBA-style effects
 * @param {Character} caster - The character using the ability
 * @param {Character} target - The target character
 * @param {number} originalDamage - Original damage amount
 * @param {number} doubledDamage - Doubled damage amount
 */
function showDevastatingPowerVFX(caster, target, originalDamage, doubledDamage) {
    try {
        console.log(`[Devastating Power VFX] Showing VFX for ${caster.name} on ${target.name}`);
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'devastating-power-vfx-container';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // Add to target's character element
        const targetElement = document.querySelector(`#character-${target.id}`);
        if (!targetElement) {
            console.error(`[Devastating Power VFX] Target element not found for ${target.id}`);
            return;
        }
        
        targetElement.appendChild(vfxContainer);
        
        // Create aura effect
        const aura = document.createElement('div');
        aura.className = 'devastating-power-aura';
        vfxContainer.appendChild(aura);
        
        // Create power surge effect
        const surge = document.createElement('div');
        surge.className = 'devastating-power-surge';
        vfxContainer.appendChild(surge);
        
        // Create floating text
        const text = document.createElement('div');
        text.className = 'devastating-power-text';
        text.textContent = 'DEVASTATING POWER!';
        vfxContainer.appendChild(text);
        
        // Create multiplier text
        const multiplier = document.createElement('div');
        multiplier.className = 'devastating-power-multiplier';
        multiplier.textContent = `2x DAMAGE!`;
        vfxContainer.appendChild(multiplier);
        
        // Create particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'devastating-power-particle';
            particle.style.setProperty('--particle-index', i);
            vfxContainer.appendChild(particle);
        }
        
        // Create shockwave effect
        const shockwave = document.createElement('div');
        shockwave.className = 'devastating-power-shockwave';
        vfxContainer.appendChild(shockwave);
        
        // Create impact effect
        const impact = document.createElement('div');
        impact.className = 'devastating-power-impact';
        vfxContainer.appendChild(impact);
        
        // Create damage text
        const damageText = document.createElement('div');
        damageText.className = 'devastating-power-damage-text';
        damageText.textContent = `${originalDamage} → ${doubledDamage}`;
        vfxContainer.appendChild(damageText);
        
        // Cleanup after animations complete
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 3000);
        
        console.log(`[Devastating Power VFX] VFX elements created and animations started`);
        
    } catch (error) {
        console.error('[Devastating Power VFX] Error creating VFX:', error);
    }
}

/**
 * Enhanced ball throw effects tracking
 * This ensures that all ball variants properly track their damage/healing
 */
(function() {
    'use strict';
    
    // Function to track ball throw statistics
    window.trackShomaAbilityUsage = function(abilityId, caster, target, value, isCritical, type) {
        if (!window.statisticsManager || !caster) {
            return;
        }
        
        try {
            switch (type) {
                case 'damage':
                    window.statisticsManager.recordDamageDealt(caster, target, value, isCritical, abilityId, 'ability');
                    break;
                case 'heal':
                    window.statisticsManager.recordHealingDone(caster, target, value, isCritical, abilityId, 'direct');
                    break;
                case 'buff':
                case 'debuff':
                    window.statisticsManager.recordAbilityUsage(caster, abilityId, 'utility', 0, false);
                    break;
            }
            console.log(`[Shoma Ball Stats] Tracked ${type} for ${abilityId}: ${value} ${isCritical ? '(Critical)' : ''}`);
        } catch (error) {
            console.error(`[Shoma Ball Stats] Error tracking ${type} for ${abilityId}:`, error);
        }
    };
    
    // Enhanced damage calculation for ball abilities with debuff hunter support
    window.calculateShomaDebuffHunterDamage = function(caster, target, baseDamage) {
        let finalDamage = baseDamage;
        
        // Check for debuff hunter talent
        const hasDebuffHunter = caster.hasTalent && caster.hasTalent('debuff_hunter');
        
        if (hasDebuffHunter && target.debuffs && target.debuffs.length > 0) {
            const bonusMultiplier = caster.debuffHunterDamageBonus || 0.25;
            finalDamage = Math.floor(baseDamage * (1 + bonusMultiplier));
            
            console.log(`[Shoma Debuff Hunter] Enhanced ball damage: ${baseDamage} → ${finalDamage} (+${(bonusMultiplier * 100).toFixed(0)}%)`);
            
            // Show debuff hunter VFX
            showDebuffHunterVFX(caster, target);
            
            // Add to battle log
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(
                    `${caster.name}'s Debuff Hunter talent triggers! (+${(bonusMultiplier * 100).toFixed(0)}% damage vs debuffed target)`,
                    'system-update'
                );
            }
        }
        
        return finalDamage;
    };
    
    // Function to enhance existing ball selection functionality with statistics
    const originalSelectBall = window.selectBall;
    if (typeof originalSelectBall === 'function') {
        window.selectBall = function(shomaCharacter, ballId) {
            console.log(`[Shoma Stats] Ball selection: ${ballId} for ${shomaCharacter.name}`);
            
            // Call original function
            const result = originalSelectBall(shomaCharacter, ballId);
            
            // Ensure the ball throw ability has enhanced tracking
            enhanceBallThrowAbility(shomaCharacter, ballId);
            
            return result;
        };
    }
    
    function enhanceBallThrowAbility(shomaCharacter, ballId) {
        if (!shomaCharacter || !shomaCharacter.abilities) {
            return;
        }
        
        // Find the ball throw ability
        const ballThrowIndex = shomaCharacter.abilities.findIndex(ability => 
            ability.id.startsWith('ball_throw')
        );
        
        if (ballThrowIndex === -1) {
            return;
        }
        
        const ballThrowAbility = shomaCharacter.abilities[ballThrowIndex];
        const originalEffect = ballThrowAbility.effect;
        
        if (typeof originalEffect === 'function') {
            // Wrap the original effect to add statistics tracking
            ballThrowAbility.effect = function(caster, target) {
                console.log(`[Shoma Ball Stats] Enhanced ${ballThrowAbility.id} with statistics tracking`);
                
                // Call the original effect
                const result = originalEffect.call(this, caster, target);
                
                // Additional tracking for specific ball types could be added here
                
                return result;
            };
            
            console.log(`[Shoma Ball Stats] Enhanced ${ballThrowAbility.id} with statistics tracking`);
        }
    }
})();

/**
 * Enhanced homerun ability tracking
 * Tracks the unique mechanic of cooldown reset and ball reselection
 */
(function() {
    'use strict';
    
    // Track homerun usage when cooldowns are reset
    const originalResetAbilityCooldowns = Character.prototype.resetAbilityCooldowns;
    if (originalResetAbilityCooldowns) {
        Character.prototype.resetAbilityCooldowns = function() {
            // Check if this is Schoolboy Shoma and if Homerun was just used
            if (this.id === 'schoolboy_shoma') {
                // Record special homerun tracking
                if (window.statisticsManager) {
                    try {
                        window.statisticsManager.recordAbilityUsage(this, 'homerun_reset', 'utility', 0, false);
                        console.log(`[Shoma Stats] Tracked cooldown reset for ${this.name}`);
                    } catch (error) {
                        console.error(`[Shoma Stats] Error tracking cooldown reset:`, error);
                    }
                }
            }
            
            // Call original method
            return originalResetAbilityCooldowns.call(this);
        };
    }
})();

/**
 * Initialize talent properties for Shoma characters
 * This ensures the character has the necessary talent properties
 */
window.initializeShomasTalentProperties = function(character) {
    if (character.id !== 'schoolboy_shoma') return;
    
    // Initialize talentProperties object if it doesn't exist
    if (!character.talentProperties) {
        character.talentProperties = {};
    }
    
    // Initialize talent properties if they don't exist
    if (!character.powerBoinkEnabled) character.powerBoinkEnabled = false;
    if (!character.efficientBoinkEnabled) character.efficientBoinkEnabled = false;
    if (!character.debuffHunterDamageBonus) character.debuffHunterDamageBonus = 0;
    if (!character.compassionateResonanceEnabled) character.compassionateResonanceEnabled = false;
    if (!character.waterBallDoubleCastEnabled) character.waterBallDoubleCastEnabled = false;
    if (!character.boinkBurnEnabled) character.boinkBurnEnabled = false;
    if (!character.devastatingPowerEnabled) character.devastatingPowerEnabled = false;
    if (!character.healingMasteryEnabled) character.healingMasteryEnabled = false;
    if (!character.grassGrowthEnabled) character.grassGrowthEnabled = false;
    if (!character.magicalEmpowermentEnabled) character.magicalEmpowermentEnabled = false;
    if (!character.ballFollowupEnabled) character.ballFollowupEnabled = false;
    if (!character.ballFollowupRemaining) character.ballFollowupRemaining = 0;
    if (!character.heavyBallBounceEnabled) character.heavyBallBounceEnabled = false;
    if (!character.debuffResonanceEnabled) character.debuffResonanceEnabled = false;
    if (!character.homerunMasteryEnabled) character.homerunMasteryEnabled = false;
    if (!character.grassBallFlowEnabled) character.grassBallFlowEnabled = false;
    if (!character.grassBallBounceEnabled) character.grassBallBounceEnabled = false;
    
    // Initialize talentProperties-specific properties
    if (typeof character.talentProperties.debuffCleansingTurnCounter === 'undefined') {
        character.talentProperties.debuffCleansingTurnCounter = 0;
    }
    
    // Ensure ballFollowupRemaining is 0 if Elemental Juggling talent is not active
    const hasElementalJuggling = character.hasTalent && character.hasTalent('elemental_juggling');
    if (!hasElementalJuggling) {
        character.ballFollowupEnabled = false;
        character.ballFollowupRemaining = 0;
        console.log(`[Shoma Talents] Reset Elemental Juggling properties for ${character.name} (talent not active)`);
    }
    
    console.log(`[Shoma Talents] Initialized talent properties for ${character.name}`);
};

/**
 * Initialize Shoma's enhanced ability system when a character is created
 */
document.addEventListener('character:created', function(event) {
    const character = event.detail.character;
    if (character && character.id === 'schoolboy_shoma') {
        // Initialize talent properties
        window.initializeShomasTalentProperties(character);
        
        // Set up the Boink ability with proper description generation
        const boinkAbility = character.abilities.find(a => a.id === 'boink');
        if (boinkAbility) {
            boinkAbility.generateDescription = generateBoinkDescription;
            boinkAbility.character = character;
            console.log(`[Shoma Abilities] Set up enhanced Boink ability for ${character.name}`);
        }
        
        // Set up the Homerun ability with proper description generation
        const homerunAbility = character.abilities.find(a => a.id === 'homerun');
        if (homerunAbility) {
            homerunAbility.generateDescription = generateHomerunDescription;
            homerunAbility.character = character;
            console.log(`[Shoma Abilities] Set up enhanced Homerun ability for ${character.name}`);
        }
    }
});

// Backup event listener for compatibility with old event name
document.addEventListener('characterCreated', function(event) {
    const character = event.detail.character;
    if (character && character.id === 'schoolboy_shoma') {
        // Initialize talent properties
        window.initializeShomasTalentProperties(character);
        
        // Set up the Boink ability with proper description generation
        const boinkAbility = character.abilities.find(a => a.id === 'boink');
        if (boinkAbility) {
            boinkAbility.generateDescription = generateBoinkDescription;
            boinkAbility.character = character;
            console.log(`[Shoma Abilities] Set up enhanced Boink ability for ${character.name} (legacy event)`);
        }
        
        // Set up the Homerun ability with proper description generation
        const homerunAbility = character.abilities.find(a => a.id === 'homerun');
        if (homerunAbility) {
            homerunAbility.generateDescription = generateHomerunDescription;
            homerunAbility.character = character;
            console.log(`[Shoma Abilities] Set up enhanced Homerun ability for ${character.name} (legacy event)`);
        }
    }
});

/**
 * Global function to update Schoolboy Shoma's ability descriptions
 * This can be called by the talent system when talents are applied
 */
window.updateShomaAbilityDescriptions = updateShomaAbilityDescriptions;
window.generateBoinkDescription = generateBoinkDescription;
window.generateHomerunDescription = generateHomerunDescription;
window.showBoinkBurnVFX = showBoinkBurnVFX;
window.showDevastatingPowerVFX = showDevastatingPowerVFX;
window.showHealingMasteryVFX = showHealingMasteryVFX;
window.showGrassGrowthInitialVFX = showGrassGrowthInitialVFX;
window.showGrassGrowthVFX = showGrassGrowthVFX;
window.showMagicalEmpowermentVFX = showMagicalEmpowermentVFX;

console.log('Schoolboy Shoma enhanced statistics tracking module loaded');

/**
 * Enhanced Grass Ball VFX for buffed targets
 */
window.showEnhancedGrassballVFX = function(caster, target) {
    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
    if (!targetElement) return;
    
    // Create enhanced healing aura
    const enhancedAura = document.createElement('div');
    enhancedAura.className = 'enhanced-grass-ball-aura';
    enhancedAura.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(0,255,0,0.3) 0%, rgba(50,255,50,0.1) 50%, transparent 100%);
        border-radius: 50%;
        animation: enhancedGrassAuraPulse 1.5s ease-in-out;
        pointer-events: none;
    `;
    targetElement.appendChild(enhancedAura);
    
    // Create floating enhancement text
    const enhancementText = document.createElement('div');
    enhancementText.className = 'enhancement-text';
    enhancementText.textContent = '+250% HEAL!';
    enhancementText.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: #00ff00;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: enhancementTextFloat 2s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
    `;
    targetElement.appendChild(enhancementText);
    
    // Create enhanced particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'enhanced-grass-particle';
        particle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #00ff00, #20ff20);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: enhancedGrassParticleFloat ${1.5 + Math.random() * 0.5}s ease-out forwards;
            animation-delay: ${Math.random() * 0.3}s;
            pointer-events: none;
        `;
        targetElement.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
        }, 2000);
    }
    
    // Cleanup
    setTimeout(() => {
        if (enhancedAura.parentNode) enhancedAura.parentNode.removeChild(enhancedAura);
        if (enhancementText.parentNode) enhancementText.parentNode.removeChild(enhancementText);
    }, 2000);
};

/**
 * Fire Ball Burn VFX for burn damage
 */
window.showFireBallBurnVFX = function(character, damage) {
    const characterElement = document.getElementById(`character-${character.id || character.instanceId}`);
    if (!characterElement) return;
    
    // Create burn aura
    const burnAura = document.createElement('div');
    burnAura.className = 'fire-ball-burn-aura';
    burnAura.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(255,100,0,0.4) 0%, rgba(255,50,0,0.2) 50%, transparent 100%);
        border-radius: 50%;
        animation: fireBallBurnPulse 1s ease-in-out;
        pointer-events: none;
    `;
    characterElement.appendChild(burnAura);
    
    // Create floating burn damage text
    const burnDamageText = document.createElement('div');
    burnDamageText.className = 'burn-damage-text';
    burnDamageText.textContent = `-${damage} BURN`;
    burnDamageText.style.cssText = `
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        color: #ff4500;
        font-weight: bold;
        font-size: 12px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: burnDamageTextFloat 1.5s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
    `;
    characterElement.appendChild(burnDamageText);
    
    // Create fire particles
    for (let i = 0; i < 8; i++) {
        const fireParticle = document.createElement('div');
        fireParticle.className = 'fire-burn-particle';
        fireParticle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #ff4500, #ff6500);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: fireBurnParticleFloat ${1 + Math.random() * 0.5}s ease-out forwards;
            animation-delay: ${Math.random() * 0.2}s;
            pointer-events: none;
        `;
        characterElement.appendChild(fireParticle);
        
        setTimeout(() => {
            if (fireParticle.parentNode) fireParticle.parentNode.removeChild(fireParticle);
        }, 1500);
    }
    
    // Cleanup
    setTimeout(() => {
        if (burnAura.parentNode) burnAura.parentNode.removeChild(burnAura);
        if (burnDamageText.parentNode) burnDamageText.parentNode.removeChild(burnDamageText);
    }, 1500);
};

/**
 * Heal a random ally when Compassionate Resonance talent is active
 * @param {Character} caster - The character with the talent
 * @param {number} healAmount - Amount to heal (50% of damage dealt)
 * @param {string} source - Source of the healing
 */
function healRandomAlly(caster, healAmount, source = 'compassionate_resonance') {
    try {
        // Get all allies (excluding the caster)
        const allies = [];
        
        if (window.gameManager && window.gameManager.gameState) {
            // If caster is AI, allies are other AI characters
            if (caster.isAI) {
                allies.push(...window.gameManager.gameState.aiCharacters.filter(char => 
                    char !== caster && !char.isDead()
                ));
            } else {
                // If caster is player, allies are other player characters
                allies.push(...window.gameManager.gameState.playerCharacters.filter(char => 
                    char !== caster && !char.isDead()
                ));
            }
        }
        
        if (allies.length === 0) {
            console.log(`[Compassionate Resonance] No valid allies found for ${caster.name}`);
            return;
        }
        
        // Select a random ally
        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
        
        // Apply healing
        const healResult = randomAlly.heal(healAmount, caster, { abilityId: source });
        
        // Add battle log entry
        if (window.gameManager && window.gameManager.addLogEntry) {
            let logMessage = `✨ Compassionate Resonance! ${caster.name}'s damage resonates with ${randomAlly.name}, healing for ${healResult.healAmount} HP`;
            if (healResult.isCritical) {
                logMessage += " (Critical Heal!)";
            }
            window.gameManager.addLogEntry(logMessage, healResult.isCritical ? 'critical heal' : 'heal');
        }
        
        // Show Compassionate Resonance VFX
        showCompassionateResonanceVFX(caster, randomAlly, healAmount);
        
        console.log(`[Compassionate Resonance] ${caster.name} healed ${randomAlly.name} for ${healResult.healAmount} HP`);
        
    } catch (error) {
        console.error('[Compassionate Resonance] Error healing random ally:', error);
    }
}

/**
 * Show Compassionate Resonance VFX
 * @param {Character} caster - The character with the talent
 * @param {Character} target - The ally being healed
 * @param {number} healAmount - Amount being healed
 */
function showCompassionateResonanceVFX(caster, target, healAmount) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        
        if (!casterElement || !targetElement) {
            console.error('[Compassionate Resonance VFX] Could not find character elements');
            return;
        }
        
        // Create resonance beam between caster and target
        const resonanceBeam = document.createElement('div');
        resonanceBeam.className = 'compassionate-resonance-beam';
        document.body.appendChild(resonanceBeam);
        
        // Position beam
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const angle = Math.atan2(targetRect.top - casterRect.top, targetRect.left - casterRect.left);
        const distance = Math.hypot(targetRect.left - casterRect.left, targetRect.top - casterRect.top);
        
        resonanceBeam.style.left = `${casterRect.left + casterRect.width/2}px`;
        resonanceBeam.style.top = `${casterRect.top + casterRect.height/2}px`;
        resonanceBeam.style.width = `${distance}px`;
        resonanceBeam.style.transform = `rotate(${angle}rad)`;
        resonanceBeam.style.transformOrigin = '0 50%';
        
        // Create healing aura on target
        const healingAura = document.createElement('div');
        healingAura.className = 'compassionate-resonance-healing-aura';
        targetElement.appendChild(healingAura);
        
        // Create floating heal text
        const healText = document.createElement('div');
        healText.className = 'compassionate-resonance-heal-text';
        healText.textContent = `+${healAmount} RESONANCE`;
        targetElement.appendChild(healText);
        
        // Create resonance particles
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'compassionate-resonance-particle';
            particle.style.animationDelay = `${i * 0.2}s`;
            targetElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 3000);
        }
        
        // Cleanup
        setTimeout(() => {
            if (resonanceBeam.parentNode) resonanceBeam.parentNode.removeChild(resonanceBeam);
            if (healingAura.parentNode) healingAura.parentNode.removeChild(healingAura);
            if (healText.parentNode) healText.parentNode.removeChild(healText);
        }, 2500);
        
    } catch (error) {
        console.error('[Compassionate Resonance VFX] Error showing VFX:', error);
    }
}

/**
 * Show Healing Mastery VFX
 * @param {Character} caster - The character with the talent
 * @param {Character} target - The target being healed
 */
function showHealingMasteryVFX(caster, target) {
    try {
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        if (!targetElement) return;
        
        // Create healing mastery aura
        const masteryAura = document.createElement('div');
        masteryAura.className = 'healing-mastery-aura';
        masteryAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(0,255,100,0.4) 0%, rgba(0,200,80,0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: healingMasteryPulse 1.5s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(masteryAura);
        
        // Create floating mastery text
        const masteryText = document.createElement('div');
        masteryText.className = 'healing-mastery-text';
        masteryText.textContent = '+20% HEALING';
        masteryText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #00ff64;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: healingMasteryTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        targetElement.appendChild(masteryText);
        
        // Create mastery particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-mastery-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #00ff64, #00cc50);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: healingMasteryParticleFloat ${1.5 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                pointer-events: none;
            `;
            targetElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2000);
        }
        
        // Cleanup
        setTimeout(() => {
            if (masteryAura.parentNode) masteryAura.parentNode.removeChild(masteryAura);
            if (masteryText.parentNode) masteryText.parentNode.removeChild(masteryText);
        }, 2000);
        
    } catch (error) {
        console.error('[Healing Mastery VFX] Error showing VFX:', error);
    }
}

/**
 * Show initial Grass Growth VFX when buff is applied
 * @param {Character} caster - The character applying the buff
 * @param {Character} target - The target receiving the buff
 */
function showGrassGrowthInitialVFX(caster, target) {
    try {
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        if (!targetElement) return;
        
        // Create grass growth aura
        const growthAura = document.createElement('div');
        growthAura.className = 'grass-growth-initial-aura';
        growthAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(34,139,34,0.3) 0%, rgba(50,205,50,0.1) 50%, transparent 100%);
            border-radius: 50%;
            animation: grassGrowthInitialPulse 2s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(growthAura);
        
        // Create floating growth text
        const growthText = document.createElement('div');
        growthText.className = 'grass-growth-initial-text';
        growthText.textContent = 'GRASS GROWING';
        growthText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #228b22;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: grassGrowthInitialTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        targetElement.appendChild(growthText);
        
        // Create growing grass particles
        for (let i = 0; i < 12; i++) {
            const grassParticle = document.createElement('div');
            grassParticle.className = 'grass-growth-particle';
            grassParticle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #228b22, #32cd32);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: grassGrowthParticleGrow ${2 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.5}s;
                pointer-events: none;
            `;
            targetElement.appendChild(grassParticle);
            
            setTimeout(() => {
                if (grassParticle.parentNode) grassParticle.parentNode.removeChild(grassParticle);
            }, 2500);
        }
        
        // Cleanup
        setTimeout(() => {
            if (growthAura.parentNode) growthAura.parentNode.removeChild(growthAura);
            if (growthText.parentNode) growthText.parentNode.removeChild(growthText);
        }, 2500);
        
    } catch (error) {
        console.error('[Grass Growth Initial VFX] Error showing VFX:', error);
    }
}

/**
 * Show Grass Growth VFX when the delayed healing triggers
 * @param {Character} target - The target being healed
 * @param {number} healAmount - Amount being healed
 */
function showGrassGrowthVFX(target, healAmount) {
    try {
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        if (!targetElement) return;
        
        // Create blooming grass aura
        const bloomAura = document.createElement('div');
        bloomAura.className = 'grass-growth-bloom-aura';
        bloomAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(34,139,34,0.5) 0%, rgba(50,205,50,0.3) 50%, transparent 100%);
            border-radius: 50%;
            animation: grassGrowthBloomPulse 1.5s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(bloomAura);
        
        // Create floating bloom text
        const bloomText = document.createElement('div');
        bloomText.className = 'grass-growth-bloom-text';
        bloomText.textContent = `+${healAmount} BLOOM`;
        bloomText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #228b22;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: grassGrowthBloomTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        targetElement.appendChild(bloomText);
        
        // Create blooming grass particles
        for (let i = 0; i < 15; i++) {
            const bloomParticle = document.createElement('div');
            bloomParticle.className = 'grass-growth-bloom-particle';
            bloomParticle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(circle, #228b22, #32cd32, #90ee90);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: grassGrowthBloomParticleFloat ${1.5 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                pointer-events: none;
            `;
            targetElement.appendChild(bloomParticle);
            
            setTimeout(() => {
                if (bloomParticle.parentNode) bloomParticle.parentNode.removeChild(bloomParticle);
            }, 2000);
        }
        
        // Create grass sprout effects
        for (let i = 0; i < 8; i++) {
            const sprout = document.createElement('div');
            sprout.className = 'grass-sprout';
            sprout.style.cssText = `
                position: absolute;
                width: 4px;
                height: 20px;
                background: linear-gradient(to top, #228b22, #32cd32);
                border-radius: 2px;
                left: ${Math.random() * 100}%;
                bottom: 0;
                animation: grassSproutGrow 1.5s ease-out forwards;
                animation-delay: ${Math.random() * 0.5}s;
                pointer-events: none;
                z-index: 999;
            `;
            targetElement.appendChild(sprout);
            
            setTimeout(() => {
                if (sprout.parentNode) sprout.parentNode.removeChild(sprout);
            }, 2000);
        }
        
        // Cleanup
        setTimeout(() => {
            if (bloomAura.parentNode) bloomAura.parentNode.removeChild(bloomAura);
            if (bloomText.parentNode) bloomText.parentNode.removeChild(bloomText);
        }, 2000);
        
    } catch (error) {
        console.error('[Grass Growth VFX] Error showing VFX:', error);
    }
}

/**
 * Show Magical Empowerment VFX when the buff is applied
 * @param {Character} caster - The character applying the buff
 * @param {Character} target - The target receiving the buff
 */
function showMagicalEmpowermentVFX(caster, target) {
    try {
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        if (!targetElement) return;
        
        // Create magical empowerment aura
        const empowermentAura = document.createElement('div');
        empowermentAura.className = 'magical-empowerment-aura';
        empowermentAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(138,43,226,0.4) 0%, rgba(75,0,130,0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: magicalEmpowermentPulse 2s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(empowermentAura);
        
        // Create floating empowerment text
        const empowermentText = document.createElement('div');
        empowermentText.className = 'magical-empowerment-text';
        empowermentText.textContent = '+30% MAGIC!';
        empowermentText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #8a2be2;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: magicalEmpowermentTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        targetElement.appendChild(empowermentText);
        
        // Create magical energy particles
        for (let i = 0; i < 12; i++) {
            const magicParticle = document.createElement('div');
            magicParticle.className = 'magical-empowerment-particle';
            magicParticle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #8a2be2, #4b0082);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: magicalEmpowermentParticleFloat ${2 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.5}s;
                pointer-events: none;
            `;
            targetElement.appendChild(magicParticle);
            
            setTimeout(() => {
                if (magicParticle.parentNode) magicParticle.parentNode.removeChild(magicParticle);
            }, 2500);
        }
        
        // Create magical energy swirls
        for (let i = 0; i < 6; i++) {
            const energySwirl = document.createElement('div');
            energySwirl.className = 'magical-energy-swirl';
            energySwirl.style.cssText = `
                position: absolute;
                width: 20px;
                height: 20px;
                border: 2px solid #8a2be2;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: magicalEnergySwirl ${2 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                pointer-events: none;
                z-index: 999;
            `;
            targetElement.appendChild(energySwirl);
            
            setTimeout(() => {
                if (energySwirl.parentNode) energySwirl.parentNode.removeChild(energySwirl);
            }, 2500);
        }
        
        // Create magical runes
        for (let i = 0; i < 4; i++) {
            const magicalRune = document.createElement('div');
            magicalRune.className = 'magical-rune';
            magicalRune.textContent = '✨';
            magicalRune.style.cssText = `
                position: absolute;
                font-size: 16px;
                color: #8a2be2;
                left: ${20 + i * 20}%;
                top: ${20 + i * 10}%;
                animation: magicalRuneFloat ${2 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${i * 0.2}s;
                pointer-events: none;
                z-index: 1002;
            `;
            targetElement.appendChild(magicalRune);
            
            setTimeout(() => {
                if (magicalRune.parentNode) magicalRune.parentNode.removeChild(magicalRune);
            }, 2500);
        }
        
        // Cleanup
        setTimeout(() => {
            if (empowermentAura.parentNode) empowermentAura.parentNode.removeChild(empowermentAura);
            if (empowermentText.parentNode) empowermentText.parentNode.removeChild(empowermentText);
        }, 2500);
        
    } catch (error) {
        console.error('[Magical Empowerment VFX] Error showing VFX:', error);
    }
}

/**
 * Show Elemental Juggling VFX when a Ball ability allows follow-up
 * Gives a MOBA-style swirling elemental aura around Shoma
 * @param {Character} caster
 */
function showElementalJugglingVFX(caster) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        if (!casterElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'elemental-juggling-vfx';
        casterElement.appendChild(vfxContainer);

        // Create 4 elemental orbs (grass, fire, water, heavy)
        const colors = ['#32cd32', '#ff4500', '#1e90ff', '#a9a9a9'];
        colors.forEach((color, index) => {
            const orb = document.createElement('div');
            orb.className = 'elemental-orb';
            orb.style.background = `radial-gradient(circle, ${color} 0%, ${color} 60%, transparent 80%)`;
            orb.style.setProperty('--orb-index', index);
            vfxContainer.appendChild(orb);
        });

        // Cleanup after 2s
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.parentNode.removeChild(vfxContainer);
        }, 2000);
    } catch (e) {
        console.error('[Elemental Juggling VFX] Error:', e);
    }
}

// Expose globally
window.showElementalJugglingVFX = showElementalJugglingVFX;

/**
 * Test function to manually verify Debuff Resonance is working
 * Call this in the browser console to test: window.testDebuffResonance()
 */
window.testDebuffResonance = function() {
    console.log('=== DEBUFF RESONANCE TEST ===');
    
    if (!window.gameManager || !window.gameManager.gameState) {
        console.log('Game manager not available');
        return;
    }
    
    // Find all Shoma characters
    const allCharacters = [
        ...(window.gameManager.gameState.playerCharacters || []),
        ...(window.gameManager.gameState.aiCharacters || [])
    ];
    
    const shomaCharacters = allCharacters.filter(char => char.id === 'schoolboy_shoma');
    console.log(`Found ${shomaCharacters.length} Shoma characters`);
    
    shomaCharacters.forEach((shoma, index) => {
        console.log(`\n--- Testing Shoma ${index + 1}: ${shoma.name} ---`);
        console.log(`Is AI: ${shoma.isAI}`);
        console.log(`Has talent function: ${!!shoma.hasTalent}`);
        console.log(`Has Debuff Resonance talent: ${shoma.hasTalent && shoma.hasTalent('debuff_resonance')}`);
        
        // Test calculation
        const resonance = window.calculateDebuffResonance(shoma);
        console.log(`Calculation result:`, resonance);
        
        // Test application
        console.log(`Before application - Armor: ${shoma.stats.armor}, Magic Shield: ${shoma.stats.magicalShield}`);
        window.applyDebuffResonance(shoma);
        console.log(`After application - Armor: ${shoma.stats.armor}, Magic Shield: ${shoma.stats.magicalShield}`);
    });
    
    console.log('=== END TEST ===');
};

/**
 * Trigger Debuff Resonance recalculation for all Shoma characters
 * This should be called whenever debuffs are added or removed from enemies
 */
window.triggerDebuffResonanceRecalculation = function() {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    // Get all Shoma characters (both player and AI)
    const allCharacters = [
        ...(window.gameManager.gameState.playerCharacters || []),
        ...(window.gameManager.gameState.aiCharacters || [])
    ];
    
    allCharacters.forEach(character => {
        if (character.id === 'schoolboy_shoma' && character.hasTalent && character.hasTalent('debuff_resonance')) {
            console.log(`[Debuff Resonance] Triggering recalculation for ${character.name} due to debuff change`);
            character.recalculateStats('debuff_resonance_update');
        }
    });
};

/**
 * Calculate Debuff Resonance bonuses for Schoolboy Shoma
 * This function counts all debuffs on enemies and applies armor/magic shield bonuses
 */
window.calculateDebuffResonance = function(character) {
    if (!character || character.id !== 'schoolboy_shoma') return { armorBonus: 0, magicShieldBonus: 0 };
    
    console.log(`[Debuff Resonance] Calculating for ${character.name} (ID: ${character.id})`);
    
    // Check if Debuff Resonance talent is active
    const hasDebuffResonance = character.hasTalent && character.hasTalent('debuff_resonance');
    console.log(`[Debuff Resonance] Talent check: hasTalent=${!!character.hasTalent}, hasDebuffResonance=${hasDebuffResonance}`);
    
    if (!hasDebuffResonance) {
        console.log(`[Debuff Resonance] Talent not active for ${character.name}`);
        return { armorBonus: 0, magicShieldBonus: 0 };
    }
    
    try {
        // Get all enemies
        let enemies = [];
        if (window.gameManager && window.gameManager.gameState) {
            if (character.isAI) {
                // If Shoma is AI, enemies are player characters
                enemies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
            } else {
                // If Shoma is player, enemies are AI characters
                enemies = window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
            }
        }
        
        console.log(`[Debuff Resonance] Found ${enemies.length} enemies for ${character.name} (isAI: ${character.isAI})`);
        
        // Count total debuffs across all enemies
        let totalDebuffs = 0;
        enemies.forEach(enemy => {
            if (enemy.debuffs && Array.isArray(enemy.debuffs)) {
                const enemyDebuffCount = enemy.debuffs.length;
                totalDebuffs += enemyDebuffCount;
                console.log(`[Debuff Resonance] ${enemy.name} has ${enemyDebuffCount} debuffs: ${enemy.debuffs.map(d => d.name || d.id).join(', ')}`);
            } else {
                console.log(`[Debuff Resonance] ${enemy.name} has no debuffs array or is not an array`);
            }
        });
        
        // Calculate bonuses (5 flat points per debuff)
        const armorBonus = totalDebuffs * 5;
        const magicShieldBonus = totalDebuffs * 5;
        
        console.log(`[Debuff Resonance] ${character.name} - ${totalDebuffs} total enemy debuffs = +${armorBonus} Armor, +${magicShieldBonus} Magic Shield`);
        
        return { armorBonus, magicShieldBonus, totalDebuffs };
        
    } catch (error) {
        console.error('[Debuff Resonance] Error calculating bonuses:', error);
        return { armorBonus: 0, magicShieldBonus: 0, totalDebuffs: 0 };
    }
};

/**
 * Apply Debuff Resonance bonuses to character stats
 * This should be called during stat recalculation
 */
window.applyDebuffResonance = function(character) {
    if (!character || character.id !== 'schoolboy_shoma') return;
    
    const resonance = window.calculateDebuffResonance(character);
    
    if (resonance.armorBonus > 0 || resonance.magicShieldBonus > 0) {
        // Store original stats for debugging
        const originalArmor = character.stats.armor || 0;
        const originalMagicShield = character.stats.magicalShield || 0;
        
        // Apply bonuses to stats
        character.stats.armor = originalArmor + resonance.armorBonus;
        character.stats.magicalShield = originalMagicShield + resonance.magicShieldBonus;
        
        console.log(`[Debuff Resonance] Applied bonuses to ${character.name}:`);
        console.log(`  Original Armor: ${originalArmor} → New Armor: ${character.stats.armor} (+${resonance.armorBonus})`);
        console.log(`  Original Magic Shield: ${originalMagicShield} → New Magic Shield: ${character.stats.magicalShield} (+${resonance.magicShieldBonus})`);
        console.log(`  Total debuffs on enemies: ${resonance.totalDebuffs}`);
        
        // Show VFX if bonuses are significant
        if (resonance.totalDebuffs >= 3) {
            showDebuffResonanceVFX(character, resonance.totalDebuffs);
        }
        
        // Add battle log entry for significant bonuses
        if (resonance.totalDebuffs >= 5 && window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(
                `${character.name}'s Debuff Resonance grants +${resonance.armorBonus} Armor and +${resonance.magicShieldBonus} Magic Shield from ${resonance.totalDebuffs} enemy debuffs!`,
                'system-update'
            );
        }
        
        // Update UI if available
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character);
        }
    } else {
        console.log(`[Debuff Resonance] No bonuses applied to ${character.name} - no debuffs on enemies or talent not active`);
    }
};

/**
 * Show Debuff Resonance VFX when significant bonuses are applied
 */
function showDebuffResonanceVFX(character, totalDebuffs) {
    try {
        const characterElement = document.getElementById(`character-${character.id || character.instanceId}`);
        if (!characterElement) return;
        
        // Create resonance aura
        const resonanceAura = document.createElement('div');
        resonanceAura.className = 'debuff-resonance-aura';
        resonanceAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: debuffResonancePulse 2s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        characterElement.appendChild(resonanceAura);
        
        // Create floating resonance text
        const resonanceText = document.createElement('div');
        resonanceText.className = 'debuff-resonance-text';
        resonanceText.textContent = `RESONANCE x${totalDebuffs}`;
        resonanceText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: debuffResonanceTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        characterElement.appendChild(resonanceText);
        
        // Create resonance particles
        for (let i = 0; i < totalDebuffs; i++) {
            const particle = document.createElement('div');
            particle.className = 'debuff-resonance-particle';
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #ffd700, #ffa500);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: debuffResonanceParticleFloat ${1.5 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                pointer-events: none;
            `;
            characterElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2000);
        }
        
        // Create defensive shield effect
        const shieldEffect = document.createElement('div');
        shieldEffect.className = 'debuff-resonance-shield';
        shieldEffect.style.cssText = `
            position: absolute;
            top: -5px; left: -5px; right: -5px; bottom: -5px;
            border: 2px solid #ffd700;
            border-radius: 50%;
            animation: debuffResonanceShield 2s ease-out;
            pointer-events: none;
            z-index: 999;
        `;
        characterElement.appendChild(shieldEffect);
        
        // Cleanup
        setTimeout(() => {
            if (resonanceAura.parentNode) resonanceAura.parentNode.removeChild(resonanceAura);
            if (resonanceText.parentNode) resonanceText.parentNode.removeChild(resonanceText);
            if (shieldEffect.parentNode) shieldEffect.parentNode.removeChild(shieldEffect);
        }, 2000);
        
    } catch (error) {
        console.error('[Debuff Resonance VFX] Error showing VFX:', error);
    }
}

/**
 * Show Boink Taunt VFX when taunt is applied
 */
function showBoinkTauntVFX(caster, target) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        if (!casterElement || !targetElement) return;
        
        // Create taunt beam from caster to target
        const tauntBeam = document.createElement('div');
        tauntBeam.className = 'boink-taunt-beam';
        tauntBeam.style.cssText = `
            position: fixed;
            height: 4px;
            background: linear-gradient(90deg, #ff6b35, #f7931e, #ff6b35);
            border-radius: 2px;
            z-index: 9999;
            pointer-events: none;
            animation: boinkTauntBeamPulse 1.5s ease-in-out;
            box-shadow: 0 0 10px #ff6b35;
        `;
        
        // Position beam from caster to target
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        tauntBeam.style.left = startX + 'px';
        tauntBeam.style.top = startY + 'px';
        tauntBeam.style.width = distance + 'px';
        tauntBeam.style.transform = `rotate(${angle}deg)`;
        tauntBeam.style.transformOrigin = '0 50%';
        
        document.body.appendChild(tauntBeam);
        
        // Create taunt aura on target
        const tauntAura = document.createElement('div');
        tauntAura.className = 'boink-taunt-aura';
        tauntAura.style.cssText = `
            position: absolute;
            top: -5px; left: -5px; right: -5px; bottom: -5px;
            background: radial-gradient(circle, rgba(255,107,53,0.4) 0%, rgba(247,147,30,0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: boinkTauntAuraPulse 2s ease-in-out;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(tauntAura);
        
        // Create floating taunt text
        const tauntText = document.createElement('div');
        tauntText.className = 'boink-taunt-text';
        tauntText.textContent = 'TAUNTED!';
        tauntText.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff6b35;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: boinkTauntTextFloat 2s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        targetElement.appendChild(tauntText);
        
        // Cleanup
        setTimeout(() => {
            if (tauntBeam.parentNode) tauntBeam.parentNode.removeChild(tauntBeam);
            if (tauntAura.parentNode) tauntAura.parentNode.removeChild(tauntAura);
            if (tauntText.parentNode) tauntText.parentNode.removeChild(tauntText);
        }, 2000);
        
    } catch (error) {
        console.error('[Boink Taunt VFX] Error showing VFX:', error);
    }
}

/**
 * Show Enhanced MOBA-style Debuff Cleansing VFX when Shoma purifies himself
 */
function showDebuffCleansingVFX(character, cleansedDebuffs) {
    try {
        console.log(`[Debuff Cleansing VFX] Starting VFX for character:`, character);
        console.log(`[Debuff Cleansing VFX] Character ID: ${character.id}, Instance ID: ${character.instanceId}`);
        
        // Try multiple selectors to find the correct character element
        let characterElement = null;
        
        // First try: character-{instanceId} (most common in game)
        if (character.instanceId) {
            characterElement = document.getElementById(`character-${character.instanceId}`);
            console.log(`[Debuff Cleansing VFX] Tried character-${character.instanceId}:`, characterElement);
        }
        
        // Second try: character-{id} (fallback)
        if (!characterElement && character.id) {
            characterElement = document.getElementById(`character-${character.id}`);
            console.log(`[Debuff Cleansing VFX] Tried character-${character.id}:`, characterElement);
        }
        
        // Third try: find by data attributes
        if (!characterElement) {
            characterElement = document.querySelector(`[data-instance-id="${character.instanceId}"]`) || 
                             document.querySelector(`[data-character-id="${character.id}"]`);
            console.log(`[Debuff Cleansing VFX] Tried data attributes:`, characterElement);
        }
        
        // Fourth try: find by class and character name
        if (!characterElement) {
            const allCharacterElements = document.querySelectorAll('.character');
            for (const element of allCharacterElements) {
                const img = element.querySelector('img');
                if (img && img.alt === character.name) {
                    characterElement = element;
                    console.log(`[Debuff Cleansing VFX] Found by character name:`, characterElement);
                    break;
                }
            }
        }
        
        console.log(`[Debuff Cleansing VFX] Final character element:`, characterElement);
        
        if (!characterElement) {
            console.error(`[Debuff Cleansing VFX] Character element not found for ${character.name} (ID: ${character.id}, Instance: ${character.instanceId})`);
            console.log(`[Debuff Cleansing VFX] Available character elements:`, document.querySelectorAll('.character'));
            
            // Debug: List all character elements and their IDs
            const allCharacterElements = document.querySelectorAll('.character');
            console.log(`[Debuff Cleansing VFX] All character elements (${allCharacterElements.length}):`);
            allCharacterElements.forEach((el, index) => {
                console.log(`  ${index}: ID="${el.id}", class="${el.className}", data-instance-id="${el.dataset.instanceId}", data-character-id="${el.dataset.characterId}"`);
                const img = el.querySelector('img');
                if (img) {
                    console.log(`    Image alt: "${img.alt}"`);
                }
            });
            
            return;
        }
        
        console.log(`[Debuff Cleansing VFX] Creating MOBA-style cleanse effect for ${character.name} with ${cleansedDebuffs.length} debuffs`);
        
        // Create enhanced purification aura with glow effects
        const purificationAura = document.createElement('div');
        purificationAura.className = 'debuff-cleansing-aura';
        characterElement.appendChild(purificationAura);
        console.log(`[Debuff Cleansing VFX] Created purification aura`);
        
        // Create dramatic floating purification text
        const purificationText = document.createElement('div');
        purificationText.className = 'debuff-cleansing-text';
        purificationText.textContent = 'PURIFIED!';
        characterElement.appendChild(purificationText);
        console.log(`[Debuff Cleansing VFX] Created purification text`);
        
        // Create expanding burst effect
        const cleansingBurst = document.createElement('div');
        cleansingBurst.className = 'debuff-cleansing-burst';
        characterElement.appendChild(cleansingBurst);
        console.log(`[Debuff Cleansing VFX] Created cleansing burst`);
        
        // Create expanding rings effect
        const cleansingRings = document.createElement('div');
        cleansingRings.className = 'debuff-cleansing-rings';
        characterElement.appendChild(cleansingRings);
        console.log(`[Debuff Cleansing VFX] Created cleansing rings`);
        
        // Create expanding wave effect
        const cleansingWave = document.createElement('div');
        cleansingWave.className = 'debuff-cleansing-wave';
        characterElement.appendChild(cleansingWave);
        console.log(`[Debuff Cleansing VFX] Created cleansing wave`);
        
        // Create sparkles container
        const sparklesContainer = document.createElement('div');
        sparklesContainer.className = 'debuff-cleansing-sparkles';
        characterElement.appendChild(sparklesContainer);
        console.log(`[Debuff Cleansing VFX] Created sparkles container`);
        
        // Create multiple sparkles for dramatic effect
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'debuff-cleansing-sparkle';
            sparkle.style.cssText = `
                left: ${20 + Math.random() * 60}%;
                top: ${20 + Math.random() * 60}%;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            sparklesContainer.appendChild(sparkle);
        }
        console.log(`[Debuff Cleansing VFX] Created 15 sparkles`);
        
        // Create enhanced particles for each cleansed debuff
        for (let i = 0; i < cleansedDebuffs.length; i++) {
            const particle = document.createElement('div');
            particle.className = 'debuff-cleansing-particle';
            particle.style.cssText = `
                left: ${30 + (Math.random() - 0.5) * 40}%;
                top: ${30 + (Math.random() - 0.5) * 40}%;
                animation-delay: ${i * 0.1}s;
            `;
            characterElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 3000);
        }
        console.log(`[Debuff Cleansing VFX] Created ${cleansedDebuffs.length} particles`);
        
        // Add screen shake for dramatic effect
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.addScreenShake();
            console.log(`[Debuff Cleansing VFX] Added screen shake`);
        }
        
        // Play cleanse sound effect if available
        if (window.gameManager && window.gameManager.playSound) {
            try {
                window.gameManager.playSound('sounds/cleanse.mp3', 0.7);
                console.log(`[Debuff Cleansing VFX] Played cleanse sound`);
            } catch (e) {
                console.log('[Debuff Cleansing VFX] No cleanse sound available');
            }
        }
        
        // Cleanup all elements after animation completes
        setTimeout(() => {
            if (purificationAura.parentNode) purificationAura.parentNode.removeChild(purificationAura);
            if (purificationText.parentNode) purificationText.parentNode.removeChild(purificationText);
            if (cleansingBurst.parentNode) cleansingBurst.parentNode.removeChild(cleansingBurst);
            if (cleansingRings.parentNode) cleansingRings.parentNode.removeChild(cleansingRings);
            if (cleansingWave.parentNode) cleansingWave.parentNode.removeChild(cleansingWave);
            if (sparklesContainer.parentNode) sparklesContainer.parentNode.removeChild(sparklesContainer);
            console.log(`[Debuff Cleansing VFX] Cleaned up all VFX elements`);
        }, 3000);
        
        console.log(`[Debuff Cleansing VFX] MOBA-style cleanse effect created successfully for ${character.name}`);
        
    } catch (error) {
        console.error('[Debuff Cleansing VFX] Error showing enhanced MOBA-style VFX:', error);
    }
}

/**
 * Process debuff cleansing for Shoma (every 3 turns)
 */
window.processShomaDebuffCleansing = function(character) {
    console.log(`[Debuff Cleansing] Function called for character:`, character);
    
    if (!character || character.id !== 'schoolboy_shoma') {
        console.log(`[Debuff Cleansing] Early return - character is ${character ? character.id : 'null'}`);
        return;
    }
    
    const hasDebuffCleansing = character.hasTalent && character.hasTalent('debuff_cleansing');
    console.log(`[Debuff Cleansing] Has debuff_cleansing talent:`, hasDebuffCleansing);
    
    if (!hasDebuffCleansing) {
        console.log(`[Debuff Cleansing] Early return - no debuff_cleansing talent`);
        return;
    }
    
    // Initialize talentProperties if not set
    if (!character.talentProperties) {
        character.talentProperties = {};
        console.log(`[Debuff Cleansing] Initialized talentProperties`);
    }
    
    // Initialize counter if not set
    if (typeof character.talentProperties.debuffCleansingTurnCounter === 'undefined') {
        character.talentProperties.debuffCleansingTurnCounter = 0;
        console.log(`[Debuff Cleansing] Initialized debuffCleansingTurnCounter to 0`);
    }
    
    // Increment turn counter
    character.talentProperties.debuffCleansingTurnCounter++;
    console.log(`[Debuff Cleansing] Turn counter for ${character.name}: ${character.talentProperties.debuffCleansingTurnCounter}`);
    
    // Every 3 turns, cleanse all debuffs
    if (character.talentProperties.debuffCleansingTurnCounter >= 3) {
        console.log(`[Debuff Cleansing] Triggering cleanse! Counter reached 3`);
        character.talentProperties.debuffCleansingTurnCounter = 0; // Reset counter
        
        // Check if character has any debuffs to cleanse
        console.log(`[Debuff Cleansing] Character debuffs:`, character.debuffs);
        
        if (character.debuffs && character.debuffs.length > 0) {
            const cleansedDebuffs = [...character.debuffs]; // Copy for VFX
            console.log(`[Debuff Cleansing] About to cleanse ${cleansedDebuffs.length} debuffs:`, cleansedDebuffs.map(d => d.name || d.id));
            
            // Remove all debuffs
            character.debuffs.forEach(debuff => {
                character.removeDebuff(debuff.id);
            });
            
            console.log(`[Debuff Cleansing] Cleansed ${cleansedDebuffs.length} debuffs from ${character.name}: ${cleansedDebuffs.map(d => d.name || d.id).join(', ')}`);
            
            // Show VFX
            console.log(`[Debuff Cleansing] Calling showDebuffCleansingVFX...`);
            showDebuffCleansingVFX(character, cleansedDebuffs);
            console.log(`[Debuff Cleansing] VFX function called successfully`);
            
            // Add battle log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(
                    `${character.name}'s Self-Purification removes all debuffs! (${cleansedDebuffs.map(d => d.name || d.id).join(', ')})`,
                    'system-update'
                );
            }
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(character);
            }
        } else {
            console.log(`[Debuff Cleansing] ${character.name} has no debuffs to cleanse on turn ${character.talentProperties.debuffCleansingTurnCounter + 1}`);
        }
    } else {
        console.log(`[Debuff Cleansing] Counter not reached yet: ${character.talentProperties.debuffCleansingTurnCounter}/3`);
    }
};

/**
 * Generate dynamic description for Homerun ability
 * This function is attached to the Homerun ability object
 */
function generateHomerunDescription() {
    const character = this.character || this.caster;
    if (!character) {
        return "Gives himself 100% dodge chance for 3 turns, resets all his cooldowns to 0, and allows him to choose a different ball type.";
    }
    
    // Check for talents
    const hasHomerunMastery = character.hasTalent && character.hasTalent('homerun_mastery');
    const hasDevastatingPower = character.hasTalent && character.hasTalent('devastating_power');
    
    // Base description
    let description = `Gives himself <span class="utility-value">100% dodge chance</span> for <span class="duration-value">3 turns</span>, resets all his cooldowns to 0, and allows him to choose a different ball type.`;
    
    // Add Homerun Mastery effect
    if (hasHomerunMastery) {
        description += ` <span class="talent-effect utility">Homerun Mastery: Does NOT end your turn!</span>`;
    }
    
    // Add Devastating Power effect
    if (hasDevastatingPower) {
        description += ` <span class="talent-effect damage">Devastating Power: ALL damage doubled during buff!</span>`;
    }
    
    return description;
}

/**
 * Test function to manually trigger debuff cleansing VFX for debugging
 */
window.testDebuffCleansingVFX = function() {
    console.log('[Test] Manually triggering debuff cleansing VFX...');
    
    // Find any schoolboy_shoma character in the game
    const allCharacters = [...(window.gameManager?.playerCharacters || []), ...(window.gameManager?.aiCharacters || [])];
    const shomaCharacter = allCharacters.find(char => char.id === 'schoolboy_shoma');
    
    if (shomaCharacter) {
        console.log('[Test] Found Shoma character:', shomaCharacter);
        showDebuffCleansingVFX(shomaCharacter, [{id: 'test_debuff', name: 'Test Debuff'}]);
    } else {
        console.log('[Test] No Shoma character found in game');
    }
};

/**
 * Simple test function to check if CSS animations work by creating elements on body
 */
window.testDebuffCleansingCSS = function() {
    console.log('[Test] Testing CSS animations directly on body...');
    
    // Create a test container
    const testContainer = document.createElement('div');
    testContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: rgba(255, 0, 0, 0.3);
        border: 2px solid red;
        z-index: 9999;
    `;
    document.body.appendChild(testContainer);
    
    // Create purification aura
    const purificationAura = document.createElement('div');
    purificationAura.className = 'debuff-cleansing-aura';
    testContainer.appendChild(purificationAura);
    
    // Create purification text
    const purificationText = document.createElement('div');
    purificationText.className = 'debuff-cleansing-text';
    purificationText.textContent = 'PURIFIED!';
    testContainer.appendChild(purificationText);
    
    // Create burst effect
    const cleansingBurst = document.createElement('div');
    cleansingBurst.className = 'debuff-cleansing-burst';
    testContainer.appendChild(cleansingBurst);
    
    // Create sparkles
    const sparklesContainer = document.createElement('div');
    sparklesContainer.className = 'debuff-cleansing-sparkles';
    testContainer.appendChild(sparklesContainer);
    
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'debuff-cleansing-sparkle';
        sparkle.style.cssText = `
            left: ${20 + Math.random() * 60}%;
            top: ${20 + Math.random() * 60}%;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        sparklesContainer.appendChild(sparkle);
    }
    
    console.log('[Test] Created test VFX elements on body');
    
    // Cleanup after 4 seconds
    setTimeout(() => {
        if (testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
            console.log('[Test] Cleaned up test VFX elements');
        }
    }, 4000);
};

/**
 * Resilient Spirit Talent - Reduces Catch! and Homerun cooldowns by 1 when Shoma takes damage
 */
function handleResilientSpiritTalent(character, damageAmount) {
    if (!character.hasTalent || !character.hasTalent('resilient_spirit')) {
        return;
    }
    
    console.log(`[Resilient Spirit] ${character.name} took ${damageAmount} damage, checking for cooldown reduction`);
    
    let cooldownsReduced = 0;
    
    // Find Catch! and Homerun abilities
    const catchAbility = character.abilities.find(ability => ability.id === 'catch');
    const homerunAbility = character.abilities.find(ability => ability.id === 'homerun');
    
    // Reduce Catch! cooldown if it has one
    if (catchAbility && catchAbility.currentCooldown > 0) {
        const oldCooldown = catchAbility.currentCooldown;
        catchAbility.currentCooldown = Math.max(0, catchAbility.currentCooldown - 1);
        cooldownsReduced++;
        console.log(`[Resilient Spirit] Catch! cooldown reduced from ${oldCooldown} to ${catchAbility.currentCooldown}`);
    }
    
    // Reduce Homerun cooldown if it has one
    if (homerunAbility && homerunAbility.currentCooldown > 0) {
        const oldCooldown = homerunAbility.currentCooldown;
        homerunAbility.currentCooldown = Math.max(0, homerunAbility.currentCooldown - 1);
        cooldownsReduced++;
        console.log(`[Resilient Spirit] Homerun cooldown reduced from ${oldCooldown} to ${homerunAbility.currentCooldown}`);
    }
    
    if (cooldownsReduced > 0) {
        // Show VFX
        showResilientSpiritVFX(character, cooldownsReduced);
        
        // Track statistics
        if (window.statisticsManager) {
            try {
                window.statisticsManager.recordAbilityUsage(character, 'resilient_spirit', 'utility', cooldownsReduced, false);
                console.log(`[Shoma Stats] Recorded resilient spirit activation for ${character.name} with ${cooldownsReduced} cooldowns reduced`);
            } catch (error) {
                console.error(`[Shoma Stats] Error recording resilient spirit usage:`, error);
            }
        }
        
        // Add battle log entry
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(
                `${character.name}'s Resilient Spirit reduces ${cooldownsReduced} ability cooldown${cooldownsReduced > 1 ? 's' : ''}!`,
                'system-update'
            );
        }
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
    }
}

/**
 * VFX for Resilient Spirit talent activation
 */
function showResilientSpiritVFX(character, cooldownsReduced) {
    const characterElement = document.getElementById(`character-${character.id || character.instanceId}`);
    if (!characterElement) {
        console.error(`[Resilient Spirit VFX] Character element not found for ${character.name}`);
        return;
    }
    
    // Create resilient spirit aura
    const resilientAura = document.createElement('div');
    resilientAura.className = 'resilient-spirit-aura';
    characterElement.appendChild(resilientAura);
    
    // Create cooldown reduction particles
    const cooldownParticles = document.createElement('div');
    cooldownParticles.className = 'resilient-spirit-particles';
    characterElement.appendChild(cooldownParticles);
    
    // Create floating text
    const floatingText = document.createElement('div');
    floatingText.className = 'resilient-spirit-text';
    floatingText.textContent = `-${cooldownsReduced} CD`;
    characterElement.appendChild(floatingText);
    
    // Create spirit energy burst
    const spiritBurst = document.createElement('div');
    spiritBurst.className = 'resilient-spirit-burst';
    characterElement.appendChild(spiritBurst);
    
    // Clean up after animation
    setTimeout(() => {
        if (resilientAura.parentNode) resilientAura.remove();
        if (cooldownParticles.parentNode) cooldownParticles.remove();
        if (floatingText.parentNode) floatingText.remove();
        if (spiritBurst.parentNode) spiritBurst.remove();
    }, 2000);
}

/**
 * Hook into character damage to trigger Resilient Spirit
 */
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game initialization
    const initializeResilientSpirit = () => {
        if (typeof window.gameManager === 'undefined') {
            setTimeout(initializeResilientSpirit, 100);
            return;
        }
        
        console.log('Initializing Resilient Spirit talent hook...');
        
        // Hook into character damage application
        const originalApplyDamage = Character.prototype.applyDamage;
        Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
            // Call original method
            const result = originalApplyDamage.call(this, amount, type, caster, options);
            
            // Check if this is Schoolboy Shoma and he has the talent
            if (this.id === 'schoolboy_shoma' && this.hasTalent && this.hasTalent('resilient_spirit')) {
                // Only trigger if damage was actually taken (not dodged, not 0 damage)
                if (result && !result.isDodged && amount > 0) {
                    handleResilientSpiritTalent(this, amount);
                }
            }
            
            return result;
        };
        
        console.log('Resilient Spirit talent hook installed');
    };
    
    initializeResilientSpirit();
});

/**
 * Show Grass Ball Flow VFX when the talent prevents turn ending
 * Gives a healing-focused aura around Shoma
 * @param {Character} caster
 */
function showGrassBallFlowVFX(caster) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        if (!casterElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'grass-ball-flow-vfx';
        casterElement.appendChild(vfxContainer);

        // Create healing rhythm aura
        const healingAura = document.createElement('div');
        healingAura.className = 'grass-ball-flow-aura';
        vfxContainer.appendChild(healingAura);

        // Create flowing grass particles
        for (let i = 0; i < 6; i++) {
            const grassParticle = document.createElement('div');
            grassParticle.className = 'grass-ball-flow-particle';
            grassParticle.style.setProperty('--particle-index', i);
            vfxContainer.appendChild(grassParticle);
        }

        // Create rhythm text
        const rhythmText = document.createElement('div');
        rhythmText.className = 'grass-ball-flow-text';
        rhythmText.textContent = 'HEALING FLOW!';
        vfxContainer.appendChild(rhythmText);

        // Cleanup after 2s
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.parentNode.removeChild(vfxContainer);
        }, 2000);
    } catch (e) {
        console.error('[Grass Ball Flow VFX] Error:', e);
    }
}

// Expose globally
window.showGrassBallFlowVFX = showGrassBallFlowVFX;

/**
 * Show Grass Ball Bounce VFX when Healing Cascade bounces to other allies
 * Creates a cascading healing effect with bounce particles
 * @param {Character} caster - The character using Grass Ball
 * @param {Character} bounceTarget - The target being bounced to
 * @param {number} bounceNumber - The bounce number (1, 2, 3, etc.)
 * @param {number} healAmount - Amount being healed
 */
function showGrassBallBounceVFX(caster, bounceTarget, bounceNumber, healAmount) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        const targetElement = document.getElementById(`character-${bounceTarget.id || bounceTarget.instanceId}`);
        
        if (!casterElement || !targetElement) {
            console.error('[Grass Ball Bounce VFX] Could not find character elements');
            return;
        }
        
        // Create bounce beam from caster to target
        const bounceBeam = document.createElement('div');
        bounceBeam.className = 'grass-ball-bounce-beam';
        document.body.appendChild(bounceBeam);
        
        // Position beam
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const angle = Math.atan2(targetRect.top - casterRect.top, targetRect.left - casterRect.left);
        const distance = Math.hypot(targetRect.left - casterRect.left, targetRect.top - casterRect.top);
        
        bounceBeam.style.left = `${casterRect.left + casterRect.width/2}px`;
        bounceBeam.style.top = `${casterRect.top + casterRect.height/2}px`;
        bounceBeam.style.width = `${distance}px`;
        bounceBeam.style.transform = `rotate(${angle}rad)`;
        bounceBeam.style.transformOrigin = '0 50%';
        
        // Create healing aura on bounce target
        const healingAura = document.createElement('div');
        healingAura.className = 'grass-ball-bounce-healing-aura';
        targetElement.appendChild(healingAura);
        
        // Create floating bounce text
        const bounceText = document.createElement('div');
        bounceText.className = 'grass-ball-bounce-text';
        bounceText.textContent = `BOUNCE #${bounceNumber}`;
        targetElement.appendChild(bounceText);
        
        // Create floating heal text
        const healText = document.createElement('div');
        healText.className = 'grass-ball-bounce-heal-text';
        healText.textContent = `+${healAmount} CASCADE`;
        targetElement.appendChild(healText);
        
        // Create cascade particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'grass-ball-bounce-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            targetElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2500);
        }
        
        // Create bounce number indicator
        const bounceIndicator = document.createElement('div');
        bounceIndicator.className = 'grass-ball-bounce-indicator';
        bounceIndicator.textContent = `#${bounceNumber}`;
        targetElement.appendChild(bounceIndicator);
        
        // Cleanup
        setTimeout(() => {
            if (bounceBeam.parentNode) bounceBeam.parentNode.removeChild(bounceBeam);
            if (healingAura.parentNode) healingAura.parentNode.removeChild(healingAura);
            if (bounceText.parentNode) bounceText.parentNode.removeChild(bounceText);
            if (healText.parentNode) healText.parentNode.removeChild(healText);
            if (bounceIndicator.parentNode) bounceIndicator.parentNode.removeChild(bounceIndicator);
        }, 2500);
        
    } catch (error) {
        console.error('[Grass Ball Bounce VFX] Error showing VFX:', error);
    }
}

// Expose globally
window.showGrassBallBounceVFX = showGrassBallBounceVFX;