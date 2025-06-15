// Vulgrim Abilities Implementation

/**
 * Scythe Swing - Multi-target physical damage ability
 * Deals 125% physical damage to main target and 85% physical damage to all other enemies
 */

const vulgrimScytheSwingEffect = function(caster, mainTarget) {
    console.log('[Vulgrim Scythe Swing] Effect starting...', { caster: caster.name, target: mainTarget?.name });
    
    // Check if we have a valid main target
    if (!mainTarget) {
        console.error('No valid main target for Scythe Swing effect');
        return;
    }
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Play Scythe Swing sound (with fallback)
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/sword_slash.mp3', 0.8).catch(() => {
        console.log('[Vulgrim] Sound file not found, continuing without sound');
    });
    
    // Create scythe swing VFX for main target
    showScytheSwingVFX(mainTarget, true); // true for main target
    
    // Apply primary damage to main target (170% physical damage)
    const primaryDamageMultiplier = 1.70;
    const primaryDamage = caster.stats.physicalDamage * primaryDamageMultiplier;
    const primaryResult = mainTarget.applyDamage(primaryDamage, 'physical', caster);
    log(`${caster.name} used Scythe Swing on ${mainTarget.name}, dealing ${primaryResult.damage} physical damage.`);
    
    // Apply cleave damage to all other enemies (105% physical damage)
    const cleaveDamageMultiplier = 1.05;
    const cleaveDamage = caster.stats.physicalDamage * cleaveDamageMultiplier;
    const gameManager = window.gameManager;
    
    if (gameManager && gameManager.gameState) {
        let cleaveCount = 0;
        const enemyCharacters = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;
        
        console.log('[Vulgrim Scythe Swing] Looking for cleave targets...', {
            casterIsAI: caster.isAI,
            totalEnemies: enemyCharacters.length,
            mainTargetId: mainTarget.id || mainTarget.instanceId
        });
        
        enemyCharacters.forEach(enemy => {
            if (enemy !== mainTarget && !enemy.isDead()) {
                // Create cleave VFX for secondary targets with delay
                setTimeout(() => {
                    showScytheSwingVFX(enemy, false); // false for cleave targets
                }, 300 + (cleaveCount * 100)); // Stagger the VFX
                
                const cleaveResult = enemy.applyDamage(cleaveDamage, 'physical', caster);
                log(`Scythe cleave hits ${enemy.name} for ${cleaveResult.damage} physical damage.`);
                cleaveCount++;
                
                // Check if enemy died from cleave damage
                if (enemy.isDead()) {
                    log(`${enemy.name} has been defeated by the scythe's cleave!`);
                }
            }
        });
        
        if (cleaveCount === 0) {
            log(`No additional enemies for scythe cleave.`);
        } else {
            log(`Scythe Swing cleaved through ${cleaveCount} additional enemies!`);
        }
    }
    
    // Check if main target died from primary damage
    if (mainTarget.isDead()) {
        log(`${mainTarget.name} has been defeated by Vulgrim's scythe!`);
    }
    
    // Apply lifesteal from primary damage only (cleave damage will apply lifesteal automatically)
    caster.applyLifesteal(primaryResult.damage);
    
    console.log('[Vulgrim Scythe Swing] Effect completed');
};

/**
 * Fearful Howl - AoE debuff ability
 * Reduces damage dealt by all enemies by 15% for 3 turns
 */
const vulgrimFearfulHowlEffect = function(caster, target) {
    console.log('[Vulgrim Fearful Howl] Effect starting...', { caster: caster.name });
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Play Fearful Howl sound 
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/demon_roar.mp3', 0.9).catch(() => {
        console.log('[Vulgrim] Sound file not found, continuing without sound');
    });
    
    // Show screen-wide VFX for the howl
    showFearfulHowlScreenVFX();
    
    log(`${caster.name} lets out a terrifying howl!`);
    
    const gameManager = window.gameManager;
    if (gameManager && gameManager.gameState) {
        // Determine enemy targets (opposite of caster's team)
        const enemyCharacters = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;
        
        console.log('[Vulgrim Fearful Howl] Targeting enemies...', {
            casterIsAI: caster.isAI,
            totalEnemies: enemyCharacters.length
        });
        
        let affectedCount = 0;
        
        enemyCharacters.forEach((enemy, index) => {
            if (!enemy.isDead()) {
                // Create the fear debuff
                const fearDebuff = new Effect(
                    'fearful_howl_debuff',
                    'Fearful Howl',
                    'Icons/abilities/fearful_howl.png',
                    3, // 3 turns duration
                    null,
                    true // Is a debuff
                );
                
                // Set damage reduction effect (15% reduction in damage dealt)
                fearDebuff.effects = {
                    damageReductionPercent: 0.15 // 15% damage reduction
                };
                
                fearDebuff.setDescription('Reduces all damage dealt by 15%.');
                
                // Add visual effects when applied
                fearDebuff.onApply = function(character) {
                    const elementId = character.instanceId || character.id;
                    const charElement = document.getElementById(`character-${elementId}`);
                    if (charElement) {
                        // Create fear indicator
                        const fearIndicator = document.createElement('div');
                        fearIndicator.className = 'fearful-howl-indicator';
                        fearIndicator.dataset.debuffId = 'fearful_howl_debuff';
                        charElement.appendChild(fearIndicator);
                    }
                };
                
                // Remove visual effects when debuff ends
                fearDebuff.onRemove = function(character) {
                    const elementId = character.instanceId || character.id;
                    const charElement = document.getElementById(`character-${elementId}`);
                    if (charElement) {
                        const indicators = charElement.querySelectorAll('.fearful-howl-indicator[data-debuff-id="fearful_howl_debuff"]');
                        indicators.forEach(indicator => indicator.remove());
                    }
                };
                
                // Apply debuff with delay for visual effect
                setTimeout(() => {
                    enemy.addDebuff(fearDebuff);
                    showFearfulHowlTargetVFX(enemy);
                    log(`${enemy.name} is intimidated by the fearful howl!`);
                }, 400 + (index * 150)); // Stagger the applications
                
                affectedCount++;
            }
        });
        
        if (affectedCount > 0) {
            log(`${affectedCount} enemies are affected by Fearful Howl!`);
        } else {
            log('No enemies to intimidate.');
        }
    }
    
    console.log('[Vulgrim Fearful Howl] Effect completed');
};

/**
 * Death Dash - Single target physical damage with Death Mark debuff
 * Deals 150% Physical Damage + 290 to the target and places Death Mark for 4 turns
 * If marked target takes 1000+ damage, Death Mark detonates for 2000 additional damage
 */
const vulgrimDeathDashEffect = function(caster, target) {
    console.log('[Vulgrim Death Dash] Effect starting...', { caster: caster.name, target: target?.name });
    
    // Check if we have a valid target
    if (!target) {
        console.error('No valid target for Death Dash effect');
        return;
    }
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    // Play Death Dash sound
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/dark_dash.mp3', 0.9).catch(() => {
        console.log('[Vulgrim] Death Dash sound file not found, continuing without sound');
    });
    
    // Create Death Dash VFX
    showDeathDashVFX(target);
    
    // Calculate damage: 220% physical damage + 320 flat damage
    const physicalDamageMultiplier = 2.2;
    const flatDamage = 320;
    const totalDamage = (caster.stats.physicalDamage * physicalDamageMultiplier) + flatDamage;
    
    // Apply primary damage
    const damageResult = target.applyDamage(totalDamage, 'physical', caster);
    log(`${caster.name} uses Death Dash on ${target.name}, dealing ${damageResult.damage} physical damage!`);
    
    // Create Death Mark debuff
    const deathMarkDebuff = new Effect(
        'death_mark',
        'Death Mark',
        'Icons/abilities/death_dash.png', // Use same icon as the ability
        4, // 4 turns duration
        null,
        true // Is a debuff
    );
    
    deathMarkDebuff.setDescription('Marked for death. If you take 1000+ damage, Death Mark detonates for 2000 additional damage.');
    
    // Set up Death Mark logic
    deathMarkDebuff.onApply = function(character) {
        console.log(`[Death Mark] Applied to ${character.name}`);
        
        // Create visual indicator
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            const deathMarkIndicator = document.createElement('div');
            deathMarkIndicator.className = 'death-mark-indicator';
            deathMarkIndicator.dataset.debuffId = 'death_mark';
            deathMarkIndicator.innerHTML = '💀';
            charElement.appendChild(deathMarkIndicator);
        }
        
        // Hook into the character's applyDamage method to detect 1000+ damage
        if (!character._deathMarkHooked) {
            character._originalApplyDamage = character.applyDamage.bind(character);
            character.applyDamage = function(amount, type, caster, options = {}) {
                // Apply the damage first
                const result = character._originalApplyDamage(amount, type, caster, options);
                
                // Check if character still has Death Mark and took 1000+ damage
                if (result.damage >= 1000 && character.hasDebuff('death_mark') && !options.isDeathMarkDetonation) {
                    console.log(`[Death Mark] Detonating! ${character.name} took ${result.damage} damage (>=1000)`);
                    
                    // Remove the Death Mark debuff first to prevent infinite loops
                    character.removeDebuff('death_mark');
                    
                    // Apply detonation damage after a short delay for dramatic effect
                    setTimeout(() => {
                        showDeathMarkDetonationVFX(character);
                        const detonationResult = character._originalApplyDamage(2000, 'magical', caster, { 
                            isDeathMarkDetonation: true 
                        });
                        
                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                        log(`💀 Death Mark detonates on ${character.name} for ${detonationResult.damage} magical damage!`);
                        
                        if (character.isDead()) {
                            log(`${character.name} is obliterated by the Death Mark's power!`);
                        }
                    }, 500);
                }
                
                return result;
            };
            character._deathMarkHooked = true;
        }
    };
    
    deathMarkDebuff.onRemove = function(character) {
        console.log(`[Death Mark] Removed from ${character.name}`);
        
        // Remove visual indicator
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            const indicators = charElement.querySelectorAll('.death-mark-indicator[data-debuff-id="death_mark"]');
            indicators.forEach(indicator => indicator.remove());
        }
        
        // Restore original applyDamage method
        if (character._deathMarkHooked && character._originalApplyDamage) {
            character.applyDamage = character._originalApplyDamage;
            character._deathMarkHooked = false;
            delete character._originalApplyDamage;
        }
    };
    
    // Apply Death Mark with a slight delay for dramatic effect
    setTimeout(() => {
        target.addDebuff(deathMarkDebuff);
        showDeathMarkApplicationVFX(target);
        log(`${target.name} is marked for death!`);
    }, 800);
    
    // Check if target died from initial damage
    if (target.isDead()) {
        log(`${target.name} has been slain by Death Dash!`);
    }
    
    // Apply lifesteal from the damage
    caster.applyLifesteal(damageResult.damage);
    
    console.log('[Vulgrim Death Dash] Effect completed');
};

/**
 * Creates visual effects for Scythe Swing ability
 * @param {Character} target - The target character
 * @param {boolean} isMainTarget - Whether this is the main target or a cleave target
 */
function showScytheSwingVFX(target, isMainTarget = false) {
    try {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!targetElement) {
            console.error(`Could not find target element for Scythe Swing VFX: ${targetElementId}`);
            return;
        }
        
        console.log(`[Vulgrim VFX] Creating ${isMainTarget ? 'primary' : 'cleave'} effects for ${target.name}`);
        
        // Main scythe slash effect
        const scytheSlash = document.createElement('div');
        scytheSlash.className = isMainTarget ? 'scythe-swing-primary' : 'scythe-swing-cleave';
        targetElement.appendChild(scytheSlash);
        
        // Dark energy effect
        const darkEnergy = document.createElement('div');
        darkEnergy.className = 'scythe-dark-energy';
        targetElement.appendChild(darkEnergy);
        
        // Blood splatter effect for main target
        if (isMainTarget) {
            const bloodSplatter = document.createElement('div');
            bloodSplatter.className = 'scythe-blood-splatter';
            targetElement.appendChild(bloodSplatter);
        }
        
        // Demonic aura pulse
        const demonicAura = document.createElement('div');
        demonicAura.className = 'scythe-demonic-aura';
        targetElement.appendChild(demonicAura);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            const vfxElements = targetElement.querySelectorAll(
                '.scythe-swing-primary, .scythe-swing-cleave, .scythe-dark-energy, .scythe-blood-splatter, .scythe-demonic-aura'
            );
            vfxElements.forEach(el => el.remove());
        }, 1200);
        
    } catch (error) {
        console.error('Error creating Scythe Swing VFX:', error);
    }
}

/**
 * Creates screen-wide VFX for Fearful Howl
 */
function showFearfulHowlScreenVFX() {
    try {
        console.log('[Vulgrim VFX] Creating Fearful Howl screen effects');
        
        // Create screen overlay
        const screenOverlay = document.createElement('div');
        screenOverlay.className = 'fearful-howl-screen-overlay';
        document.body.appendChild(screenOverlay);
        
        // Create sound waves emanating from center
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const soundWave = document.createElement('div');
                soundWave.className = 'fearful-howl-sound-wave';
                soundWave.style.animationDelay = `${i * 0.2}s`;
                document.body.appendChild(soundWave);
                
                setTimeout(() => soundWave.remove(), 2000);
            }, i * 200);
        }
        
        // Create dark energy particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'fearful-howl-dark-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 3000);
            }, i * 50);
        }
        
        // Remove screen overlay
        setTimeout(() => {
            screenOverlay.remove();
        }, 2500);
        
    } catch (error) {
        console.error('Error creating Fearful Howl screen VFX:', error);
    }
}

/**
 * Creates individual target VFX for Fearful Howl
 * @param {Character} target - The target character
 */
function showFearfulHowlTargetVFX(target) {
    try {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!targetElement) {
            console.error(`Could not find target element for Fearful Howl VFX: ${targetElementId}`);
            return;
        }
        
        console.log(`[Vulgrim VFX] Creating fear effects for ${target.name}`);
        
        // Fear shudder effect
        const fearShudder = document.createElement('div');
        fearShudder.className = 'fearful-howl-target-shudder';
        targetElement.appendChild(fearShudder);
        
        // Dark aura around target
        const darkAura = document.createElement('div');
        darkAura.className = 'fearful-howl-target-aura';
        targetElement.appendChild(darkAura);
        
        // Fear symbol above target
        const fearSymbol = document.createElement('div');
        fearSymbol.className = 'fearful-howl-fear-symbol';
        fearSymbol.textContent = '😨';
        targetElement.appendChild(fearSymbol);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            const vfxElements = targetElement.querySelectorAll(
                '.fearful-howl-target-shudder, .fearful-howl-target-aura, .fearful-howl-fear-symbol'
            );
            vfxElements.forEach(el => el.remove());
        }, 2000);
        
    } catch (error) {
        console.error('Error creating Fearful Howl target VFX:', error);
    }
}

/**
 * Creates visual effects for Death Dash ability
 * @param {Character} target - The target character
 */
function showDeathDashVFX(target) {
    try {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!targetElement) {
            console.error(`Could not find target element for Death Dash VFX: ${targetElementId}`);
            return;
        }
        
        console.log(`[Vulgrim VFX] Creating Death Dash effects for ${target.name}`);
        
        // Dark dash trail effect
        const dashTrail = document.createElement('div');
        dashTrail.className = 'death-dash-trail';
        targetElement.appendChild(dashTrail);
        
        // Shadow strike effect
        const shadowStrike = document.createElement('div');
        shadowStrike.className = 'death-dash-strike';
        targetElement.appendChild(shadowStrike);
        
        // Dark energy explosion
        const darkExplosion = document.createElement('div');
        darkExplosion.className = 'death-dash-explosion';
        targetElement.appendChild(darkExplosion);
        
        // Necrotic energy particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'death-dash-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            particle.style.transform = `rotate(${i * 45}deg)`;
            targetElement.appendChild(particle);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            const vfxElements = targetElement.querySelectorAll(
                '.death-dash-trail, .death-dash-strike, .death-dash-explosion, .death-dash-particle'
            );
            vfxElements.forEach(el => el.remove());
        }, 1500);
        
    } catch (error) {
        console.error('Error creating Death Dash VFX:', error);
    }
}

/**
 * Creates visual effects for Death Mark application
 * @param {Character} target - The target character receiving the Death Mark
 */
function showDeathMarkApplicationVFX(target) {
    try {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!targetElement) {
            console.error(`Could not find target element for Death Mark application VFX: ${targetElementId}`);
            return;
        }
        
        console.log(`[Vulgrim VFX] Creating Death Mark application effects for ${target.name}`);
        
        // Death mark symbol appearing
        const markSymbol = document.createElement('div');
        markSymbol.className = 'death-mark-symbol';
        markSymbol.innerHTML = '💀';
        targetElement.appendChild(markSymbol);
        
        // Dark binding effect
        const darkBinding = document.createElement('div');
        darkBinding.className = 'death-mark-binding';
        targetElement.appendChild(darkBinding);
        
        // Cursed aura
        const cursedAura = document.createElement('div');
        cursedAura.className = 'death-mark-aura';
        targetElement.appendChild(cursedAura);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            const vfxElements = targetElement.querySelectorAll(
                '.death-mark-symbol, .death-mark-binding, .death-mark-aura'
            );
            vfxElements.forEach(el => el.remove());
        }, 2000);
        
    } catch (error) {
        console.error('Error creating Death Mark application VFX:', error);
    }
}

/**
 * Creates visual effects for Death Mark detonation
 * @param {Character} target - The target character whose Death Mark is detonating
 */
function showDeathMarkDetonationVFX(target) {
    try {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!targetElement) {
            console.error(`Could not find target element for Death Mark detonation VFX: ${targetElementId}`);
            return;
        }
        
        console.log(`[Vulgrim VFX] Creating Death Mark detonation effects for ${target.name}`);
        
        // Massive dark explosion
        const detonation = document.createElement('div');
        detonation.className = 'death-mark-detonation';
        targetElement.appendChild(detonation);
        
        // Skull explosion effect
        const skullExplosion = document.createElement('div');
        skullExplosion.className = 'death-mark-skull-explosion';
        skullExplosion.innerHTML = '💀';
        targetElement.appendChild(skullExplosion);
        
        // Soul shards flying outward
        for (let i = 0; i < 12; i++) {
            const shard = document.createElement('div');
            shard.className = 'death-mark-soul-shard';
            shard.style.animationDelay = `${i * 0.05}s`;
            shard.style.transform = `rotate(${i * 30}deg)`;
            targetElement.appendChild(shard);
        }
        
        // Screen shake effect
        document.body.style.animation = 'deathMarkScreenShake 0.6s ease-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 600);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            const vfxElements = targetElement.querySelectorAll(
                '.death-mark-detonation, .death-mark-skull-explosion, .death-mark-soul-shard'
            );
            vfxElements.forEach(el => el.remove());
        }, 2000);
        
    } catch (error) {
        console.error('Error creating Death Mark detonation VFX:', error);
    }
}

// Register the abilities when the module loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vulgrim abilities module loaded');
    
    // Register custom effects with retry mechanism
    const registerCustomEffects = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
            // Register with the actual ability ID from JSON
            AbilityFactory.registerAbilityEffect('scythe_swing', vulgrimScytheSwingEffect);
            AbilityFactory.registerAbilityEffect('fearful_howl', vulgrimFearfulHowlEffect);
            AbilityFactory.registerAbilityEffect('death_dash', vulgrimDeathDashEffect);
            // Also register with the custom effect name as backup
            AbilityFactory.registerAbilityEffect('vulgrim_scythe_swing', vulgrimScytheSwingEffect);
            AbilityFactory.registerAbilityEffect('vulgrim_fearful_howl', vulgrimFearfulHowlEffect);
            AbilityFactory.registerAbilityEffect('vulgrim_death_dash', vulgrimDeathDashEffect);
            console.log('Vulgrim abilities registered successfully');
        } else {
            console.warn('AbilityFactory not available for Vulgrim abilities registration, retrying in 100ms...');
            setTimeout(registerCustomEffects, 100);
        }
    };
    
    registerCustomEffects();
});

// Export for potential external usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        vulgrimScytheSwingEffect,
        vulgrimFearfulHowlEffect,
        vulgrimDeathDashEffect,
        showScytheSwingVFX,
        showFearfulHowlScreenVFX,
        showFearfulHowlTargetVFX,
        showDeathDashVFX,
        showDeathMarkApplicationVFX,
        showDeathMarkDetonationVFX
    };
} 