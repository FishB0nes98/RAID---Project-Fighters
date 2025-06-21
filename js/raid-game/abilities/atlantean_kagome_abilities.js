// Ability definitions for Atlantean Kagome

// Add immediate debug output
console.log("[KAGOME ABILITIES] Loading atlantean_kagome_abilities.js");

// --- Helper Functions for Kagome ---

// Helper to calculate AP (Ability Power)
function getAbilityPower(character) {
    return character.stats.magicalDamage;
}

// === ✨ UNIVERSAL VFX HELPERS FOR ATLANTEAN KAGOME ===
// Lightweight helper to spawn short-lived particle elements anywhere in the battle-container.
function kagomeSpawnParticle(className, x, y, parent = document.querySelector('.battle-container'), lifeTime = 800) {
    if (!parent) return;
    const p = document.createElement('div');
    p.className = className;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    parent.appendChild(p);
    setTimeout(() => p.remove(), lifeTime);
}

// --- Q: Golden Arrow ---
const goldenArrowEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] Q ABILITY CALLED", caster, target);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    log(`${caster.name} fires a Golden Arrow at ${target.name}!`);
    
    // VFX for Golden Arrow
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    
    if (casterElement && targetElement) {
        // Create arrow projectile FIRST
        const arrowVfx = document.createElement('div');
        arrowVfx.className = 'golden-arrow-projectile';
        document.querySelector('.battle-container').appendChild(arrowVfx);

        // === NEW: create small spark trail while arrow is in flight ===
        let sparkInterval = setInterval(() => {
            const rect = arrowVfx.getBoundingClientRect();
            const parentRect = document.querySelector('.battle-container').getBoundingClientRect();
            kagomeSpawnParticle('golden-arrow-spark', rect.left + rect.width/2 - parentRect.left, rect.top + rect.height/2 - parentRect.top);
        }, 60);
        
        // Get positions for animation
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const battleContainerRect = document.querySelector('.battle-container').getBoundingClientRect();
        
        // Calculate relative positions
        const startX = (casterRect.left + casterRect.width/2) - battleContainerRect.left;
        const startY = (casterRect.top + casterRect.height/2) - battleContainerRect.top;
        const endX = (targetRect.left + targetRect.width/2) - battleContainerRect.left;
        const endY = (targetRect.top + targetRect.height/2) - battleContainerRect.top;
        
        // Set starting position
        arrowVfx.style.left = `${startX}px`;
        arrowVfx.style.top = `${startY}px`;
        
        // Calculate angle for rotation
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        arrowVfx.style.transform = `rotate(${angle}deg)`;
        
        // Animate arrow
        setTimeout(() => {
            arrowVfx.style.left = `${endX}px`;
            arrowVfx.style.top = `${endY}px`;
        }, 50);
        
        // Create hit effect on target after arrow arrives
        setTimeout(() => {
            // Remove arrow
            arrowVfx.remove();
            clearInterval(sparkInterval);
            
            // === NEW: impact burst sparks ===
            for (let i = 0; i < 14; i++) {
                const angleDeg = (360 / 14) * i + Math.random() * 10;
                const radius = 5 + Math.random() * 10;
                const rad = angleDeg * (Math.PI / 180);
                const offsetX = Math.cos(rad) * radius;
                const offsetY = Math.sin(rad) * radius;
                kagomeSpawnParticle('golden-arrow-impact-spark', (targetRect.left + targetRect.width/2) - battleContainerRect.left + offsetX, (targetRect.top + targetRect.height/2) - battleContainerRect.top + offsetY);
            }
            
            // Create hit effect
            const hitVfx = document.createElement('div');
            hitVfx.className = 'golden-arrow-hit';
            targetElement.appendChild(hitVfx);
            
            // Add screen shake for impact
            const battleContainer = document.querySelector('.battle-container');
            if (battleContainer) {
                battleContainer.style.animation = 'kagomeScreenShake 0.5s ease-out';
                setTimeout(() => {
                    battleContainer.style.animation = '';
                }, 500);
            }
            
            // Create floating damage text
            const floatingText = document.createElement('div');
            floatingText.className = 'kagome-floating-text';
            floatingText.textContent = `${Math.round(result.damage)}${result.isCritical ? ' CRIT!' : ''}`;
            floatingText.style.top = '-30px';
            floatingText.style.left = '50%';
            floatingText.style.transform = 'translateX(-50%)';
            if (result.isCritical) {
                floatingText.style.color = '#ff6b35';
                floatingText.style.fontSize = '22px';
                floatingText.style.textShadow = '0 0 10px #ff6b35';
            }
            targetElement.appendChild(floatingText);
            
            // Remove effects after animation
            setTimeout(() => {
                hitVfx.remove();
                floatingText.remove();
            }, 2000);
        }, 400);
    }
    
    // Calculate damage
    const abilityPower = getAbilityPower(caster);
    const baseDamage = 400 + abilityPower; // 400 + 100% Magical Damage
    
    console.log("[KAGOME Q] Base damage calculated:", baseDamage, "Magical Damage:", abilityPower);
    
    // Apply damage to target
    const result = target.applyDamage(baseDamage, 'magical', caster, { abilityId: 'atlantean_kagome_q' });
    
    // Log the damage
    log(`${target.name} takes ${Math.round(result.damage)} magical damage from the golden arrow.`);
    if (result.isCritical) {
        log("Critical Hit!");
    }
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        updateCharacterUI(caster);
    }
    
    console.log("[KAGOME Q] Ability complete");
};

// --- W: Scatter Golden Arrows ---
const scatterGoldenArrowsEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] W ABILITY CALLED", caster, target);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;
    
    log(`${caster.name} uses Scatter Golden Arrows!`);
    
    // --- Particles/VFX for Scatter Golden Arrows ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    
    console.log("[KAGOME W VFX] Caster element found:", casterElement, "for ID:", `character-${caster.instanceId || caster.id}`);
    
    if (casterElement) {
        console.log("[KAGOME W VFX] Creating bow animation and arrow rain VFX");
        
        // Create the arrow rain VFX
        const arrowRainVfx = document.createElement('div');
        arrowRainVfx.className = 'kagome-arrow-rain';
        
        // === NEW: generate individual arrow particles ===
        const ARROWS_IN_RAIN = 24;
        for (let i = 0; i < ARROWS_IN_RAIN; i++) {
            const arrow = document.createElement('div');
            arrow.className = 'kagome-arrow-rain-arrow';
            // Random horizontal starting position (in % to fill container width)
            arrow.style.left = `${Math.random() * 100}%`;
            // Stagger each arrow slightly
            arrow.style.animationDelay = `${(Math.random() * 0.5).toFixed(2)}s`;
            arrowRainVfx.appendChild(arrow);
        }
        
        console.log("[KAGOME W VFX] Created arrow rain element:", arrowRainVfx);
        
        // Position the effect at the top where enemies are
        arrowRainVfx.style.top = '0';
        arrowRainVfx.style.position = 'absolute';
        
        // Add to battle-container instead of battle-area
        const battleContainer = document.querySelector('.battle-container');
        console.log("[KAGOME W VFX] Battle container found:", battleContainer);
        
        if (battleContainer) {
            battleContainer.appendChild(arrowRainVfx);
            console.log("[KAGOME W VFX] Arrow rain VFX added to battle container");
            
            // Get the enemy area height (typically the top half of the battleContainer)
            const containerHeight = battleContainer.offsetHeight;
            const enemyAreaHeight = Math.min(containerHeight * 0.5, 300); // 50% of container or max 300px
            
            // Set a more precise height based on where enemies actually are
            arrowRainVfx.style.height = `${enemyAreaHeight}px`;
            
            // Add screen shake for the arrow rain
            setTimeout(() => {
                console.log("[KAGOME W VFX] Applying screen shake");
                battleContainer.style.animation = 'kagomeScreenShake 0.8s ease-out';
                setTimeout(() => {
                    battleContainer.style.animation = '';
                }, 800);
            }, 300);
        } else {
            // Fallback to body if container not found
            console.log("[KAGOME W VFX] Fallback: adding to body");
            document.body.appendChild(arrowRainVfx);
        }
        
        // Remove VFX elements after animation completes
        setTimeout(() => {
            console.log("[KAGOME W VFX] Cleaning up VFX elements");
            arrowRainVfx.remove();
        }, 1500);
    } else {
        console.error("[KAGOME W VFX] ERROR: Caster element not found for ID:", `character-${caster.instanceId || caster.id}`);
    }
    
    // Get all enemy characters
    const enemies = gameManager ? 
        (caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters) : 
        [];
    
    console.log("[KAGOME W] Enemies found:", enemies);
    
    if (enemies.length === 0) {
        console.log("[KAGOME W] ERROR: No enemies found to target");
        log("No enemies available to target!", "error");
        return;
    }
    
    // Calculate base damage 
    const abilityPower = getAbilityPower(caster);
    const baseDamage = 200 + (abilityPower * 0.5); // 200 + 50% Magical Damage
    
    console.log("[KAGOME W] Base damage calculated:", baseDamage, "Magical Damage:", abilityPower);
    
    // Track how many enemies actually took damage for the buff (excluding dodges)
    let enemiesDamaged = 0;
    
    // Deal damage to all enemy characters
    enemies.forEach(enemy => {
        console.log("[KAGOME W] Processing enemy:", enemy.name);
        if (!enemy.isDead()) {
            // Apply damage
            const result = enemy.applyDamage(baseDamage, 'magical', caster, { abilityId: 'atlantean_kagome_w' });
            
            // Check if the attack was dodged
            if (result.isDodged) {
                log(`${enemy.name} dodged the golden arrows!`);
            } else {
                // Log the damage only if not dodged
                log(`${enemy.name} takes ${Math.round(result.damage)} magical damage from the golden arrows.`);
                if (result.isCritical) {
                    log("Critical Hit!");
                }
                
                // Only increment counter if damage was actually dealt (not dodged)
                enemiesDamaged++;
            }
            
            // Create individual arrow hit VFX on each enemy
            const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
            console.log(`[KAGOME W VFX] Enemy element found for ${enemy.name}:`, enemyElement, "for ID:", `character-${enemy.instanceId || enemy.id}`);
            
            if (enemyElement) {
                console.log(`[KAGOME W VFX] Creating arrow hit VFX for ${enemy.name}`);
                
                // Only create hit VFX if the attack wasn't dodged
                if (!result.isDodged) {
                    const arrowHitVfx = document.createElement('div');
                    arrowHitVfx.className = 'kagome-arrow-hit';
                    enemyElement.appendChild(arrowHitVfx);
                    
                    // Remove VFX after animation
                    setTimeout(() => {
                        arrowHitVfx.remove();
                        console.log(`[KAGOME W VFX] Cleaned up hit VFX for ${enemy.name}`);
                    }, 2000);
                }
                
                // Create floating damage text for each enemy (including dodges)
                const floatingText = document.createElement('div');
                floatingText.className = 'kagome-floating-text';
                if (result.isDodged) {
                    floatingText.textContent = 'DODGED!';
                    floatingText.style.color = '#87ceeb';
                    floatingText.style.textShadow = '0 0 10px #87ceeb';
                } else {
                    floatingText.textContent = `${Math.round(result.damage)}${result.isCritical ? ' CRIT!' : ''}`;
                    if (result.isCritical) {
                        floatingText.style.color = '#ff6b35';
                        floatingText.style.fontSize = '22px';
                        floatingText.style.textShadow = '0 0 10px #ff6b35';
                    }
                }
                floatingText.style.top = '-30px';
                floatingText.style.left = '50%';
                floatingText.style.transform = 'translateX(-50%)';
                enemyElement.appendChild(floatingText);
                
                console.log(`[KAGOME W VFX] Added floating text to ${enemy.name}`);
                
                // Remove floating text after animation
                setTimeout(() => {
                    floatingText.remove();
                    console.log(`[KAGOME W VFX] Cleaned up floating text for ${enemy.name}`);
                }, 2000);
            } else {
                console.error(`[KAGOME W VFX] ERROR: Enemy element not found for ${enemy.name} with ID: character-${enemy.id}`);
            }
        }
    });
    
    console.log("[KAGOME W] Enemies damaged:", enemiesDamaged);
    
    // Apply Magical Damage buff to Kagome based on number of enemies that actually took damage
    if (enemiesDamaged > 0) {
        // Save original magical damage for verification
        const originalMagicalDamage = caster.stats.magicalDamage;
        console.log("[KAGOME W] Original magical damage before buff:", originalMagicalDamage);
        
        // Calculate buff based on number of enemies damaged (25% * number of enemies damaged)
        const magicalDamageBuff = 0.25 * enemiesDamaged * abilityPower;
        
        console.log("[KAGOME W] Magical damage buff to apply:", magicalDamageBuff);
        
        // Create or update the magical damage buff
        const buffId = 'kagome_w_magical_damage_buff';
        const existingBuff = caster.buffs.find(buff => buff.id === buffId);
        
        console.log("[KAGOME W] Existing buff found:", existingBuff);
        
        // If buff already exists, just refresh its duration without stacking the effect
        if (existingBuff) {
            // Just reset duration without stacking the effect
            existingBuff.duration = 6; // Reset duration to 6 turns
            console.log("[KAGOME W] Refreshed existing buff duration without stacking");
            log(`${caster.name}'s Golden Power refreshed for 6 more turns.`, 'kagome-buff');
            
            // Do NOT reapply the buff stats as they're already applied
        } else {
            console.log("[KAGOME W] Creating new buff");
            
            // Create a new buff effect using proper statModifiers system
            const magicalDamageBuffEffect = new Effect(
                buffId,
                'Golden Power',
                'Icons/abilities/golden_arrow.png', // Use existing golden arrow image
                6, // Duration of 6 turns
                null // Setting effect to null as we'll use statModifiers
            );
            
            // Add description for tooltip based on enemies damaged
            magicalDamageBuffEffect.setDescription(`Increases Magical Damage by ${Math.round(magicalDamageBuff)} (${25 * enemiesDamaged}%).`);
            
            // Use proper statModifiers system for automatic application/removal
            magicalDamageBuffEffect.statModifiers = [
                { stat: 'magicalDamage', value: magicalDamageBuff, operation: 'add' }
            ];
            
            // Apply the buff - this will automatically apply statModifiers
            caster.addBuff(magicalDamageBuffEffect);
            console.log("[KAGOME W] New buff applied:", caster.buffs);
            log(`${caster.name} gains +${Math.round(magicalDamageBuff)} Magical Damage (${25 * enemiesDamaged}%) for 6 turns.`, 'kagome-buff');
        }
        
        // Verify the buff was applied
        console.log("[KAGOME W] Magical damage after all buff logic:", caster.stats.magicalDamage);
        
        // Create magical damage buff VFX
        if (casterElement) {
            const buffVfx = document.createElement('div');
            buffVfx.className = 'magical-damage-buff-vfx';
            buffVfx.innerHTML = `<span>+${25 * enemiesDamaged}% Magical Damage</span>`;
            casterElement.appendChild(buffVfx);
            
            // Remove VFX after animation
            setTimeout(() => {
                buffVfx.remove();
            }, 1500);
        }
    }
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
    
    console.log("[KAGOME W] Ability complete, final Magical Damage:", caster.stats.magicalDamage);
};

// --- E: Spiritwalk ---
const spiritwalkEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] E ABILITY CALLED - SPIRITWALK", caster);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    log(`${caster.name} uses Spiritwalk!`);
    
    // Create VFX for Spiritwalk
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    
    if (casterElement) {
        // Create spiritwalk VFX overlay
        const spiritwalkVfx = document.createElement('div');
        spiritwalkVfx.className = 'kagome-spiritwalk-vfx';
        casterElement.appendChild(spiritwalkVfx);
        
        // Create portal effect around the battlefield
        const battlefieldPortal = document.createElement('div');
        battlefieldPortal.className = 'kagome-spirit-portal';
        battlefieldPortal.style.position = 'fixed';
        battlefieldPortal.style.top = '0';
        battlefieldPortal.style.left = '0';
        battlefieldPortal.style.width = '100vw';
        battlefieldPortal.style.height = '100vh';
        battlefieldPortal.style.background = 'radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.2) 50%, rgba(25, 25, 112, 0.3) 100%)';
        battlefieldPortal.style.pointerEvents = 'none';
        battlefieldPortal.style.zIndex = '500';
        battlefieldPortal.style.animation = 'spiritPortalPulse 4s ease-in-out';
        document.body.appendChild(battlefieldPortal);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            spiritwalkVfx.remove();
            battlefieldPortal.remove();
        }, 4000);
    }
    
    // 1. Heal for 1000 HP
    const healAmount = 1000;
    const actualHealAmount = caster.heal(healAmount, caster, { abilityId: 'atlantean_kagome_e' });
    log(`${caster.name} heals for ${actualHealAmount} HP through Spiritwalk.`);
    
    // Create floating heal text
    if (casterElement) {
        const floatingHealText = document.createElement('div');
        floatingHealText.className = 'kagome-floating-text';
        floatingHealText.textContent = `+${actualHealAmount} HP`;
        floatingHealText.style.top = '-30px';
        floatingHealText.style.left = '50%';
        floatingHealText.style.transform = 'translateX(-50%)';
        floatingHealText.style.color = '#90EE90';
        floatingHealText.style.textShadow = '0 0 10px #90EE90';
        casterElement.appendChild(floatingHealText);
        
        setTimeout(() => {
            floatingHealText.remove();
        }, 2000);
    }
    
    // 2. Apply stun to self for 4 turns
    const stunDebuffId = 'kagome_e_stun_debuff';
    
    // Create stun debuff effect
    const stunDebuff = new Effect(
        stunDebuffId,
        'Spiritwalk Stun',
        'Icons/debuffs/stun.png', // Use existing stun icon or create a new one
        4, // Duration of 4 turns
        null, // Set effect to null as we handle it directly
        true // This is a debuff
    );
    
    // Set description
    stunDebuff.setDescription('Stunned while in Spiritwalk. Cannot act but gains 200% armor and magic shield.');
    
    // Apply stun effect - use cantAct property (matching Shoma and Shao Kahn) instead of isStun
    stunDebuff.effects = {
        cantAct: true
    };
    
    // Add debuff to character
    caster.addDebuff(stunDebuff);
    log(`${caster.name} is stunned for 4 turns while in Spiritwalk state.`);
    
    // 3. Apply 200% armor and magic shield buff for the duration
    const shieldBuffId = 'kagome_e_shield_buff';
    
    // Save original armor and magic shield values
    const originalArmor = caster.stats.armor;
    const originalMagicShield = caster.stats.magicalShield;
    
    // Calculate new values (200% increase)
    const armorBuff = originalArmor * 2;
    const magicShieldBuff = originalMagicShield * 2;
    
    // Create shield buff effect with the effect function and ensure it stays when applied
    const shieldBuffEffect = (character) => {
        console.log("[KAGOME E] Shield buff effect active", character.name);
    };
    
    // Create shield buff effect
    const shieldBuff = new Effect(
        shieldBuffId,
        'Spiritwalk Shield',
        'Icons/buffs/shield.png', // Use existing shield icon or create a new one
        4, // Duration of 4 turns
        shieldBuffEffect, // Set the effect function
        false // This is a buff
    );
    
    // Set description
    shieldBuff.setDescription(`Grants 200% increased armor and magic shield while in Spiritwalk state.`);
    
    // Store original values for restoration later
    shieldBuff._originalArmor = originalArmor;
    shieldBuff._originalMagicShield = originalMagicShield;
    
    // Set up stat modifiers directly - this is how the Character class expects them
    shieldBuff.statModifiers = [
        { stat: 'armor', value: armorBuff, operation: 'add' },
        { stat: 'magicalShield', value: magicShieldBuff, operation: 'add' }
    ];
    
    // Set up custom remove function that will be called when the buff expires
    shieldBuff.remove = (character) => {
        console.log("[KAGOME E] Removing shield buff", character.name);
        log(`${character.name}'s Spiritwalk shield has faded.`);
    };
    
    // Add buff to character - this will apply the stat modifiers automatically
    caster.addBuff(shieldBuff);
    log(`${caster.name} gains ${armorBuff} armor and ${magicShieldBuff} magic shield from Spiritwalk.`);
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
    
    console.log("[KAGOME E] Spiritwalk ability complete");
};

// --- R: Spirit Scream ---
const spiritScreamEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] R ABILITY CALLED - SPIRIT SCREAM", caster);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;
    
    log(`${caster.name} unleashes a Spirit Scream!`, 'kagome-buff');
    
    // Create VFX for Spirit Scream
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    
    if (casterElement) {
        // Create spirit scream shockwave animation
        const screamVfx = document.createElement('div');
        screamVfx.className = 'kagome-spirit-scream';
        document.querySelector('.battle-container').appendChild(screamVfx);
        
        // Create spirit glow effect on caster
        casterElement.classList.add('kagome-spirit-glow');
        
        // Add dramatic screen shake for spirit scream
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            setTimeout(() => {
                battleContainer.style.animation = 'kagomeScreenShake 1.2s ease-out';
                setTimeout(() => {
                    battleContainer.style.animation = '';
                }, 1200);
            }, 500);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            screamVfx.remove();
            casterElement.classList.remove('kagome-spirit-glow');
        }, 2000);
    }
    
    // Get all enemy characters
    const enemies = gameManager ? 
        (caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters) : 
        [];
    
    console.log("[KAGOME R] Enemies found:", enemies);
    
    if (enemies.length === 0) {
        console.log("[KAGOME R] ERROR: No enemies found to target");
        log("No enemies available to target!", "error");
        return;
    }
    
    // Calculate damage (200% of Kagome's magical damage)
    const abilityPower = getAbilityPower(caster);
    const baseDamage = abilityPower * 2; // 200% Magical Damage
    
    console.log("[KAGOME R] Base damage calculated:", baseDamage, "Magical Damage:", abilityPower);
    
    // Process each enemy
    enemies.forEach(enemy => {
        console.log("[KAGOME R] Processing enemy:", enemy.name);
        if (!enemy.isDead()) {
            // 1. Apply damage
            const result = enemy.applyDamage(baseDamage, 'magical', caster, { abilityId: 'atlantean_kagome_r' });
            
            // Log the damage
            log(`${enemy.name} takes ${Math.round(result.damage)} magical damage from the Spirit Scream.`);
            if (result.isCritical) {
                log("Critical Hit!");
            }
            
            // 2. Remove all active buffs
            if (enemy.buffs && enemy.buffs.length > 0) {
                const buffCount = enemy.buffs.length;
                
                // Log that buffs are being removed
                log(`${enemy.name}'s ${buffCount} buffs are purged by Spirit Scream!`);
                
                // Create a copy of the buffs array to avoid modification issues during iteration
                const buffsToRemove = [...enemy.buffs];
                
                // Remove each buff individually
                buffsToRemove.forEach(buff => {
                    console.log("[KAGOME R] Removing buff:", buff.name, "from", enemy.name);
                    
                    // Call the buff's remove function if it exists
                    if (typeof buff.remove === 'function') {
                        buff.remove(enemy);
                    }
                    
                    // Remove the buff from the character's buff list
                    const buffIndex = enemy.buffs.findIndex(b => b.id === buff.id);
                    if (buffIndex !== -1) {
                        enemy.buffs.splice(buffIndex, 1);
                    }
                    
                    // If the buff has stat modifiers, remove them
                    if (buff.statModifiers) {
                        if (Array.isArray(buff.statModifiers)) {
                            // New format: array of modifier objects
                            buff.statModifiers.forEach(modifier => {
                                if (modifier.value > 0) { // Only decrease if it's a positive modifier (buff)
                                    enemy.stats[modifier.stat] -= modifier.value;
                                }
                            });
                        } else {
                            // Old format: key-value object (backward compatibility)
                            Object.keys(buff.statModifiers).forEach(statKey => {
                                // Only decrease if it's a positive modifier (buff)
                                if (buff.statModifiers[statKey] > 0) {
                                    enemy.stats[statKey] -= buff.statModifiers[statKey];
                                }
                            });
                        }
                    }
                });
                
                console.log("[KAGOME R] After buff removal, enemy buffs:", enemy.buffs);
            } else {
                console.log("[KAGOME R] No buffs to remove from", enemy.name);
            }
            
            // Create VFX for the buff removal on each enemy
            const enemyElement = document.getElementById(`character-${enemy.instanceId || enemy.id}`);
            if (enemyElement) {
                // Create dispel VFX
                const dispelVfx = document.createElement('div');
                dispelVfx.className = 'kagome-buff-dispel';
                enemyElement.appendChild(dispelVfx);
                
                // Create scream impact VFX
                const impactVfx = document.createElement('div');
                impactVfx.className = 'kagome-scream-impact';
                enemyElement.appendChild(impactVfx);
                
                // Create floating damage text for each enemy
                const floatingText = document.createElement('div');
                floatingText.className = 'kagome-floating-text';
                floatingText.textContent = `${Math.round(result.damage)}${result.isCritical ? ' CRIT!' : ''}`;
                floatingText.style.top = '-30px';
                floatingText.style.left = '50%';
                floatingText.style.transform = 'translateX(-50%)';
                floatingText.style.color = '#8a2be2';
                floatingText.style.textShadow = '0 0 15px #8a2be2, 0 0 30px rgba(138, 43, 226, 0.5)';
                if (result.isCritical) {
                    floatingText.style.color = '#ff6b35';
                    floatingText.style.fontSize = '22px';
                    floatingText.style.textShadow = '0 0 10px #ff6b35';
                }
                enemyElement.appendChild(floatingText);
                
                // Add buff dispel notification if buffs were removed
                if (enemy.buffs && enemy.buffs.length > 0) {
                    const buffDispelText = document.createElement('div');
                    buffDispelText.className = 'kagome-floating-text';
                    buffDispelText.textContent = `Buffs Purged!`;
                    buffDispelText.style.top = '-60px';
                    buffDispelText.style.left = '50%';
                    buffDispelText.style.transform = 'translateX(-50%)';
                    buffDispelText.style.color = '#ff69b4';
                    buffDispelText.style.fontSize = '16px';
                    buffDispelText.style.textShadow = '0 0 10px #ff69b4';
                    enemyElement.appendChild(buffDispelText);
                    
                    setTimeout(() => {
                        buffDispelText.remove();
                    }, 2000);
                }
                
                // Remove VFX after animation
                setTimeout(() => {
                    dispelVfx.remove();
                    impactVfx.remove();
                    floatingText.remove();
                }, 2000);
            }
        }
    });
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        enemies.forEach(enemy => {
            updateCharacterUI(enemy);
        });
        updateCharacterUI(caster);
    }
    
    console.log("[KAGOME R] Spirit Scream ability complete");
};

// Create the ability objects
const kagomeQ = new Ability(
    'atlantean_kagome_q',
    'Golden Arrow',
    'Icons/abilities/golden_arrow.png',
    70, // Mana cost
    1,   // Cooldown
    goldenArrowEffect
).setDescription('Deals 400 + 100% Magical Damage to an enemy.')
 .setTargetType('enemy');

const kagomeW = new Ability(
    'atlantean_kagome_w',
    'Scatter Golden Arrows',
    'Icons/abilities/golden_arrow_storm.png', // Use existing golden arrow storm image
    100, // Mana cost
    4,   // Cooldown
    scatterGoldenArrowsEffect
).setDescription('Deals 200 + 50% Magical Damage to ALL enemies. When used, Kagome gains 25% Magical Damage for 6 turns based on the number of enemies hit (25% for 1 enemy, 50% for 2 enemies, 75% for 3 enemies, etc). If the buff is already active, using this ability resets the buff duration but does not increase the Magical Damage bonus.')
 .setTargetType('all_enemies'); // Auto-targeting all enemies

const kagomeE = new Ability(
    'atlantean_kagome_e',
    'Spiritwalk',
    'Icons/abilities/spiritwalk.png',
    60, // Mana cost
    5,  // Cooldown in turns
    spiritwalkEffect
).setDescription("Kagome stuns herself for 4 turns, gains 200% magic shield and armor (for the duration as buff) and heals herself when ability is used by 1000HP.")
 .setTargetType('self');

const kagomeR = new Ability(
    'atlantean_kagome_r',
    'Spirit Scream',
    'Icons/abilities/spirit_scream.png',
    150, // Mana cost
    8,   // Cooldown
    spiritScreamEffect
).setDescription("Deals 200% of Kagome's magical damage to ALL enemies and removes all their active buffs.")
 .setTargetType('all_enemies');

// Export abilities for registration
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities.atlantean_kagome = function() {
    console.log("[KAGOME ABILITIES] Registering atlantean_kagome abilities");
    // Debug directly what is being returned
    const abilities = {
        q: kagomeQ,
        w: kagomeW,
        e: kagomeE,
        r: kagomeR
    };
    console.log("[KAGOME ABILITIES] Returning abilities:", abilities);
    return abilities;
};

// Add direct registration for debugging
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    console.log("[KAGOME ABILITIES] Directly registering with AbilityFactory");
    AbilityFactory.registerAbilities([kagomeQ, kagomeW, kagomeE, kagomeR]);
}

// Also assign to window for emergency access
window.kagomeAbilities = {
    q: kagomeQ,
    w: kagomeW,
    e: kagomeE,
    r: kagomeR
};

console.log("[KAGOME ABILITIES] Finished loading atlantean_kagome_abilities.js"); 