// Ability definitions for Atlantean Kagome

// Add immediate debug output
console.log("[KAGOME ABILITIES] Loading atlantean_kagome_abilities.js");

// --- Helper Functions for Kagome ---

// Helper to calculate AP (Ability Power)
function getAbilityPower(character) {
    return character.stats.magicalDamage;
}

// --- Q: Golden Arrow ---
const goldenArrowEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] Q ABILITY CALLED", caster, target);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    log(`${caster.name} fires a Golden Arrow at ${target.name}!`);
    
    // VFX for Golden Arrow
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${target.id}`);
    
    if (casterElement && targetElement) {
        // Bow pull-back animation
        casterElement.classList.add('kagome-bow-animation');
        
        // Create arrow projectile
        const arrowVfx = document.createElement('div');
        arrowVfx.className = 'golden-arrow-projectile';
        document.querySelector('.battle-container').appendChild(arrowVfx);
        
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
            
            // Create hit effect
            const hitVfx = document.createElement('div');
            hitVfx.className = 'golden-arrow-hit';
            targetElement.appendChild(hitVfx);
            
            // Remove hit effect after animation
            setTimeout(() => {
                hitVfx.remove();
                casterElement.classList.remove('kagome-bow-animation');
            }, 800);
        }, 400);
    }
    
    // Calculate damage
    const abilityPower = getAbilityPower(caster);
    const baseDamage = 400 + abilityPower; // 400 + 100% AP
    
    console.log("[KAGOME Q] Base damage calculated:", baseDamage, "AP:", abilityPower);
    
    // Apply damage to target
    caster.isDamageSource = caster; // Ensure proper crit chance calculation
    const result = target.applyDamage(baseDamage, 'magical');
    
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
    const casterElement = document.getElementById(`character-${caster.id}`);
    
    if (casterElement) {
        // Create a bow pull-back animation
        casterElement.classList.add('kagome-bow-animation');
        
        // Create the arrow rain VFX
        const arrowRainVfx = document.createElement('div');
        arrowRainVfx.className = 'kagome-arrow-rain';
        
        // Position the effect at the top where enemies are
        arrowRainVfx.style.top = '0';
        arrowRainVfx.style.position = 'absolute';
        
        // Add to battle-container instead of battle-area
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            battleContainer.appendChild(arrowRainVfx);
            
            // Get the enemy area height (typically the top half of the battleContainer)
            const containerHeight = battleContainer.offsetHeight;
            const enemyAreaHeight = Math.min(containerHeight * 0.5, 300); // 50% of container or max 300px
            
            // Set a more precise height based on where enemies actually are
            arrowRainVfx.style.height = `${enemyAreaHeight}px`;
        } else {
            // Fallback to body if container not found
            document.body.appendChild(arrowRainVfx);
        }
        
        // Remove VFX elements after animation completes
        setTimeout(() => {
            casterElement.classList.remove('kagome-bow-animation');
            arrowRainVfx.remove();
        }, 1500);
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
    const baseDamage = 200 + (abilityPower * 0.5); // 200 + 50% AP
    
    console.log("[KAGOME W] Base damage calculated:", baseDamage, "AP:", abilityPower);
    
    // Track how many enemies were hit for the buff
    let enemiesHit = 0;
    
    // Deal damage to all enemy characters
    enemies.forEach(enemy => {
        console.log("[KAGOME W] Processing enemy:", enemy.name);
        if (!enemy.isDead()) {
            // Apply damage
            caster.isDamageSource = caster; // Ensure proper crit chance calculation
            const result = enemy.applyDamage(baseDamage, 'magical');
            
            // Log the damage
            log(`${enemy.name} takes ${Math.round(result.damage)} magical damage from the golden arrows.`);
            if (result.isCritical) {
                log("Critical Hit!");
            }
            
            // Increment enemies hit counter
            enemiesHit++;
            
            // Create individual arrow hit VFX on each enemy
            const enemyElement = document.getElementById(`character-${enemy.id}`);
            if (enemyElement) {
                const arrowHitVfx = document.createElement('div');
                arrowHitVfx.className = 'kagome-arrow-hit';
                enemyElement.appendChild(arrowHitVfx);
                
                // Remove VFX after animation
                setTimeout(() => {
                    arrowHitVfx.remove();
                }, 800);
            }
        }
    });
    
    console.log("[KAGOME W] Enemies hit:", enemiesHit);
    
    // Apply AP buff to Kagome based on number of enemies hit
    if (enemiesHit > 0) {
        // Save original AP for verification
        const originalAP = caster.stats.magicalDamage;
        console.log("[KAGOME W] Original AP before buff:", originalAP);
        
        // Calculate buff based on number of enemies hit (25% * number of enemies)
        const apBuff = 0.25 * enemiesHit * abilityPower;
        
        console.log("[KAGOME W] AP buff to apply:", apBuff);
        
        // Create or update the AP buff
        const buffId = 'kagome_w_ap_buff';
        const existingBuff = caster.buffs.find(buff => buff.id === buffId);
        
        console.log("[KAGOME W] Existing buff found:", existingBuff);
        
        // Ensure magicalDamageBuffs exists
        if (!caster.stats.magicalDamageBuffs) {
            caster.stats.magicalDamageBuffs = {};
        }
        
        // If buff already exists, just refresh its duration without stacking the effect
        if (existingBuff) {
            // Just reset duration without stacking the effect
            existingBuff.duration = 6; // Reset duration to 6 turns
            console.log("[KAGOME W] Refreshed existing buff duration without stacking");
            log(`${caster.name}'s Golden Power refreshed for 6 more turns.`, 'kagome-buff');
            
            // Do NOT reapply the buff stats as they're already applied
        } else {
            // Remove any existing magic damage from previous buffs (just in case)
            if (caster.stats.magicalDamageBuffs && caster.stats.magicalDamageBuffs[buffId]) {
                caster.stats.magicalDamage -= caster.stats.magicalDamageBuffs[buffId];
                delete caster.stats.magicalDamageBuffs[buffId];
            }
            
            console.log("[KAGOME W] Creating new buff");
            
            // Create a new buff effect
            const apBuffEffect = new Effect(
                buffId,
                'Golden Power',
                'Icons/abilities/golden_arrow.png', // Use existing golden arrow image
                6, // Duration of 6 turns
                null // Setting effect to null as we'll handle the application directly
            );
            
            // Store the AP boost amount in the effect for display in UI
            apBuffEffect.effects = {
                apBoost: apBuff
            };
            
            // Add description for tooltip based on enemies hit
            apBuffEffect.setDescription(`Increases Ability Power by ${Math.round(apBuff)} (${25 * enemiesHit}%).`);
            
            // Custom apply method that runs once when the buff is first added
            // Apply the buff directly here before adding it
            caster.stats.magicalDamageBuffs[buffId] = apBuff;
            caster.stats.magicalDamage += apBuff;
            
            // Custom remove method that will run when the buff expires
            apBuffEffect.remove = (character) => {
                console.log("[KAGOME W] Removing AP buff from character");
                if (character.stats.magicalDamageBuffs && character.stats.magicalDamageBuffs[buffId]) {
                    const buffToRemove = character.stats.magicalDamageBuffs[buffId];
                    character.stats.magicalDamage -= buffToRemove;
                    delete character.stats.magicalDamageBuffs[buffId];
                    console.log("[KAGOME W] Removed buff value:", buffToRemove);
                    console.log("[KAGOME W] Character AP after buff removal:", character.stats.magicalDamage);
                }
            };
            
            // Apply the buff
            caster.addBuff(apBuffEffect);
            console.log("[KAGOME W] New buff applied:", caster.buffs);
            log(`${caster.name} gains +${Math.round(apBuff)} Ability Power (${25 * enemiesHit}%) for 6 turns.`, 'kagome-buff');
        }
        
        // Verify the buff was applied
        console.log("[KAGOME W] AP after all buff logic:", caster.stats.magicalDamage);
        
        // Create AP buff VFX
        if (casterElement) {
            const buffVfx = document.createElement('div');
            buffVfx.className = 'ap-buff-vfx';
            buffVfx.innerHTML = `<span>+${25 * enemiesHit}% AP</span>`;
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
    
    console.log("[KAGOME W] Ability complete, final AP:", caster.stats.magicalDamage);
};

// --- E: Spiritwalk ---
const spiritwalkEffect = (caster, target) => {
    console.log("[KAGOME DEBUG] E ABILITY CALLED - SPIRITWALK", caster);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    log(`${caster.name} uses Spiritwalk!`);
    
    // Create VFX for Spiritwalk
    const casterElement = document.getElementById(`character-${caster.id}`);
    
    if (casterElement) {
        // Add spiritwalk animation class
        casterElement.classList.add('kagome-spiritwalk-animation');
        
        // Create spiritwalk VFX overlay
        const spiritwalkVfx = document.createElement('div');
        spiritwalkVfx.className = 'kagome-spiritwalk-vfx';
        casterElement.appendChild(spiritwalkVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            spiritwalkVfx.remove();
            casterElement.classList.remove('kagome-spiritwalk-animation');
        }, 1500);
    }
    
    // 1. Heal for 1000 HP
    const healAmount = 1000;
    const actualHealAmount = caster.heal(healAmount);
    log(`${caster.name} heals for ${actualHealAmount} HP through Spiritwalk.`);
    
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
    shieldBuff.statModifiers = {
        armor: armorBuff,
        magicalShield: magicShieldBuff
    };
    
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
    const casterElement = document.getElementById(`character-${caster.id}`);
    
    if (casterElement) {
        // Create spirit scream shockwave animation
        const screamVfx = document.createElement('div');
        screamVfx.className = 'kagome-spirit-scream';
        document.querySelector('.battle-container').appendChild(screamVfx);
        
        // Create spirit glow effect on caster
        casterElement.classList.add('kagome-spirit-glow');
        
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
    const baseDamage = abilityPower * 2; // 200% AP
    
    console.log("[KAGOME R] Base damage calculated:", baseDamage, "AP:", abilityPower);
    
    // Process each enemy
    enemies.forEach(enemy => {
        console.log("[KAGOME R] Processing enemy:", enemy.name);
        if (!enemy.isDead()) {
            // 1. Apply damage
            caster.isDamageSource = caster; // Ensure proper crit chance calculation
            const result = enemy.applyDamage(baseDamage, 'magical');
            
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
                        Object.keys(buff.statModifiers).forEach(statKey => {
                            // Only decrease if it's a positive modifier (buff)
                            if (buff.statModifiers[statKey] > 0) {
                                enemy.stats[statKey] -= buff.statModifiers[statKey];
                            }
                        });
                    }
                });
                
                console.log("[KAGOME R] After buff removal, enemy buffs:", enemy.buffs);
            } else {
                console.log("[KAGOME R] No buffs to remove from", enemy.name);
            }
            
            // Create VFX for the buff removal on each enemy
            const enemyElement = document.getElementById(`character-${enemy.id}`);
            if (enemyElement) {
                // Create dispel VFX
                const dispelVfx = document.createElement('div');
                dispelVfx.className = 'kagome-buff-dispel';
                enemyElement.appendChild(dispelVfx);
                
                // Create scream impact VFX
                const impactVfx = document.createElement('div');
                impactVfx.className = 'kagome-scream-impact';
                enemyElement.appendChild(impactVfx);
                
                // Remove VFX after animation
                setTimeout(() => {
                    dispelVfx.remove();
                    impactVfx.remove();
                }, 1500);
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
    2,   // Cooldown
    goldenArrowEffect
).setDescription('Deals 400 + 100% AP magical damage to an enemy.')
 .setTargetType('enemy');

const kagomeW = new Ability(
    'atlantean_kagome_w',
    'Scatter Golden Arrows',
    'Icons/abilities/golden_arrow_storm.png', // Use existing golden arrow storm image
    100, // Mana cost
    4,   // Cooldown
    scatterGoldenArrowsEffect
).setDescription('Deals 200 + 50% AP to ALL enemies. When used, Kagome gains 25% AP for 6 turns based on the number of enemies hit (25% for 1 enemy, 50% for 2 enemies, 75% for 3 enemies, etc). If the buff is already active, using this ability resets the buff duration but does not increase the AP bonus.')
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