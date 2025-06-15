// Ability definitions for Schoolgirl Elphelt

// === STATISTICS TRACKING FUNCTIONS ===

/**
 * Global tracking function for Schoolgirl Elphelt's abilities
 */
function trackElpheltAbilityUsage(caster, abilityId, effectType, amount, isCritical) {
    if (!window.statisticsManager) return;
    
    try {
        window.statisticsManager.recordAbilityUsage(caster, abilityId, effectType, amount, isCritical);
        console.log(`[ElpheltStats] Tracked ${abilityId}: ${effectType} for ${amount} ${isCritical ? '(Critical)' : ''}`);
    } catch (error) {
        console.error(`[ElpheltStats] Error tracking ${abilityId}:`, error);
    }
}

/**
 * Track Love Bullet statistics
 */
function trackLoveBulletStats(caster, target, damageResult, wasStun = false, wasCharm = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt
        window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, 'love_bullet');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'love_bullet', 'damage', damageAmount, isCritical);
        
        // Track stun application if it occurred
        if (wasStun) {
            window.statisticsManager.recordStatusEffect(caster, target, 'stun', 'love_bullet_stun', true, 'love_bullet');
            trackElpheltAbilityUsage(caster, 'love_bullet_stun', 'debuff', 1, false);
        }
        
        // Track charm application if it occurred
        if (wasCharm) {
            window.statisticsManager.recordStatusEffect(caster, target, 'charm', 'love_bullet_charm', true, 'love_bullet');
            trackElpheltAbilityUsage(caster, 'love_bullet_charm', 'debuff', 1, false);
        }
        
        console.log(`[ElpheltStats] Tracked Love Bullet: ${damageAmount} damage to ${target.name}, stun: ${wasStun}, charm: ${wasCharm}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Love Bullet stats:', error);
    }
}

/**
 * Track Flower Bomb statistics
 */
function trackFlowerBombStats(caster, target, abilityDisabled) {
    if (!window.statisticsManager) return;
    
    try {
        // Track debuff application
        window.statisticsManager.recordStatusEffect(caster, target, 'ability_disable', 'flower_bomb_disable', true, 'schoolgirl_elphelt_w');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_w', 'debuff', 1, false);
        
        console.log(`[ElpheltStats] Tracked Flower Bomb: disabled ability on ${target.name}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Flower Bomb stats:', error);
    }
}

/**
 * Track Affection statistics
 */
function trackAffectionStats(caster, target) {
    if (!window.statisticsManager) return;
    
    try {
        // Track buff application to caster (damage reduction)
        window.statisticsManager.recordStatusEffect(caster, caster, 'damage_reduction', 'affection_buff', false, 'schoolgirl_elphelt_e');
        
        // Track debuff application to target (infatuation)
        window.statisticsManager.recordStatusEffect(caster, target, 'infatuation', 'affection_debuff', true, 'schoolgirl_elphelt_e');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_e', 'buff', 1, false);
        
        console.log(`[ElpheltStats] Tracked Affection: applied to ${target.name}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Affection stats:', error);
    }
}

/**
 * Track Piercing Bullet statistics
 */
function trackPiercingBulletStats(caster, target, damageResult, isInitialHit = true, chainCount = 0) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Determine ability ID based on whether it's initial hit or chain
        const abilityId = isInitialHit ? 'schoolgirl_elphelt_r' : 'schoolgirl_elphelt_r_chain';
        
        // Track damage dealt
        window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, abilityId);
        
        // Track ability usage (only for initial hit to avoid double counting)
        if (isInitialHit) {
            trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_r', 'damage', damageAmount, isCritical);
        } else {
            // Track chain hit separately
            trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_r_chain', 'damage', damageAmount, isCritical);
        }
        
        console.log(`[ElpheltStats] Tracked Piercing Bullet: ${damageAmount} damage to ${target.name} (${isInitialHit ? 'initial' : 'chain'} hit)`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Piercing Bullet stats:', error);
    }
}

/**
 * Track Defensive Maneuvers passive statistics
 */
function trackDefensiveManeuversStats(character, armorGain, shieldGain) {
    if (!window.statisticsManager) return;
    
    try {
        // Track passive buff application
        window.statisticsManager.recordStatusEffect(character, character, 'defensive_buff', 'defensive_maneuvers', false, 'schoolgirl_elphelt_passive');
        
        // Track passive usage
        trackElpheltAbilityUsage(character, 'schoolgirl_elphelt_passive', 'buff', armorGain + shieldGain, false);
        
        console.log(`[ElpheltStats] Tracked Defensive Maneuvers: +${armorGain} Armor, +${shieldGain} Magic Shield`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Defensive Maneuvers stats:', error);
    }
}

/**
 * Track Cute Pose statistics
 */
function trackCutePoseStats(caster, targetCount, buffValue) {
    if (!window.statisticsManager) return;
    
    try {
        // Track buff application
        window.statisticsManager.recordStatusEffect(caster, caster, 'dodge_buff', 'cute_pose_buff', false, 'cute_pose');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'cute_pose', 'buff', buffValue, false);
        
        console.log(`[ElpheltStats] Tracked Cute Pose: +${buffValue} dodge chance`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Cute Pose stats:', error);
    }
}

/**
 * Track Sweet Serenade statistics
 */
function trackSweetSerenadeStats(caster, targets, healAmounts, charmCount = 0) {
    if (!window.statisticsManager) return;
    
    try {
        // Track healing for each target
        targets.forEach((target, index) => {
            const healAmount = healAmounts[index] || 0;
            if (healAmount > 0) {
                window.statisticsManager.recordHealingDone(caster, target, healAmount, false, 'sweet_serenade');
            }
        });
        
        // Track ability usage
        const totalHealing = healAmounts.reduce((sum, amount) => sum + amount, 0);
        trackElpheltAbilityUsage(caster, 'sweet_serenade', 'healing', totalHealing, false);
        
        // Track charm effects
        if (charmCount > 0) {
            trackElpheltAbilityUsage(caster, 'sweet_serenade_charm', 'debuff', charmCount, false);
        }
        
        console.log(`[ElpheltStats] Tracked Sweet Serenade: ${targets.length} targets, ${totalHealing} total healing, ${charmCount} charms`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Sweet Serenade stats:', error);
    }
}

/**
 * Track Heart Storm statistics
 */
function trackHeartStormStats(caster, targets, damageAmounts, healAmount = 0, stunCount = 0, charmCount = 0) {
    if (!window.statisticsManager) return;
    
    try {
        // Track damage for each target
        targets.forEach((target, index) => {
            const damageAmount = damageAmounts[index] || 0;
            if (damageAmount > 0) {
                const isCritical = false; // Heart Storm doesn't crit typically
                window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'magical', isCritical, 'heart_storm');
            }
        });
        
        // Track healing for self
        if (healAmount > 0) {
            window.statisticsManager.recordHealingDone(caster, caster, healAmount, false, 'heart_storm_heal');
            trackElpheltAbilityUsage(caster, 'heart_storm_heal', 'healing', healAmount, false);
        }
        
        // Track ability usage
        const totalDamage = damageAmounts.reduce((sum, amount) => sum + amount, 0);
        trackElpheltAbilityUsage(caster, 'heart_storm', 'damage', totalDamage, false);
        
        // Track status effects
        if (stunCount > 0) {
            trackElpheltAbilityUsage(caster, 'heart_storm_stun', 'debuff', stunCount, false);
        }
        
        if (charmCount > 0) {
            trackElpheltAbilityUsage(caster, 'heart_storm_charm', 'debuff', charmCount, false);
        }
        
        console.log(`[ElpheltStats] Tracked Heart Storm: ${targets.length} targets, ${totalDamage} total damage, ${healAmount} self heal, ${stunCount} stuns, ${charmCount} charms`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Heart Storm stats:', error);
    }
}

/**
 * Track Elphelt's passive abilities statistics
 */
function trackElpheltPassiveStats(character, passiveType, amount, details = {}) {
    if (!window.statisticsManager) return;
    
    try {
        switch (passiveType) {
            case 'defensive_stance':
                trackElpheltAbilityUsage(character, 'elphelt_passive_defensive_stance', 'buff', amount, false);
                break;
            case 'dodge_bonus':
                trackElpheltAbilityUsage(character, 'elphelt_passive_dodge_bonus', 'utility', amount, false);
                break;
        }
        
        console.log(`[ElpheltStats] Tracked Elphelt passive (${passiveType}): ${amount}`);
    } catch (error) {
        console.error(`[ElpheltStats] Error tracking Elphelt passive (${passiveType}):`, error);
    }
}

// === ABILITY IMPLEMENTATIONS ===

// --- Q: Love Bullet ---
const schoolgirlElpheltLoveBulletEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;

    if (!target) {
        log("Schoolgirl Elphelt Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Love Bullet on ${target.name}.`);

    // Play sound effect for Q
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/elphelta1.mp3');

    // --- Love Bullet VFX ---
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${target.id}`);

    if (casterElement && targetElement) {
        // Create a heart projectile effect
        const heartVfx = document.createElement('div');
        heartVfx.className = 'love-bullet-vfx';
        document.body.appendChild(heartVfx);

        // Calculate position and animate
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        heartVfx.style.left = `${startX}px`;
        heartVfx.style.top = `${startY}px`;

        // Create a trail effect generator
        let trailInterval;
        const createTrail = () => {
            const trail = document.createElement('div');
            trail.className = 'love-bullet-trail';
            
            // Position at current heart location
            const heartRect = heartVfx.getBoundingClientRect();
            trail.style.left = `${heartRect.left + heartRect.width/2}px`;
            trail.style.top = `${heartRect.top + heartRect.height/2}px`;
            
            document.body.appendChild(trail);
            
            // Remove after animation completes
            setTimeout(() => trail.remove(), 500);
        };
        
        // Start generating trails
        trailInterval = setInterval(createTrail, 50);

        // Animate the heart towards the target
        const animation = heartVfx.animate([
            { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
            { opacity: 1, offset: 0.1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`, opacity: 1 }
        ], {
            duration: 800, // Longer duration for more visible effect
            easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' // Bounce-like easing
        });
        
        animation.onfinish = () => {
            // Stop trail generation
            clearInterval(trailInterval);
            
            // Create impact VFX on the target
            const impactVfx = document.createElement('div');
            impactVfx.className = 'love-bullet-impact';
            targetElement.appendChild(impactVfx);
            
            // Create flying heart particles
            createHeartParticles(targetElement);
            
            // Add a shake effect to the target
            targetElement.classList.add('shake-animation');
            setTimeout(() => targetElement.classList.remove('shake-animation'), 500);
            
            // Remove the heart projectile
            heartVfx.remove();
            
            // Remove impact VFX after animation
            setTimeout(() => impactVfx.remove(), 600);
        };
    }
    // --- End Love Bullet VFX ---

    // Function to create heart particle explosion
    function createHeartParticles(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create multiple heart particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'heart-particle';
            
            // Random position around target center
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // Random direction with CSS variables
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70; // 30-100px
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const rotation = Math.random() * 360;
            
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            particle.style.setProperty('--r', `${rotation}deg`);
            
            document.body.appendChild(particle);
            
            // Remove after animation completes
            setTimeout(() => particle.remove(), 800);
        }
    }

    // Calculate damage: 300 base + 50% Physical Damage + 50% Magical Damage
    const scalingDamage = (caster.stats.physicalDamage * 0.5) + (caster.stats.magicalDamage * 0.5);
    const totalDamage = 300 + scalingDamage;

    target.isDamageSource = caster;
    const result = target.applyDamage(totalDamage, 'physical', caster, { abilityId: 'love_bullet' });
    target.isDamageSource = null;

    log(`${target.name} takes ${result.damage} physical damage from Love Bullet.`);
    if (result.isCritical) {
        log("Critical Hit!");
    }

    // Track statistics
    trackLoveBulletStats(caster, target, result);

    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);

    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolgirlElpheltQ = new Ability(
    'schoolgirl_elphelt_q',
    'Love Bullet',
    'Icons/abilities/love_bullet.jfif',
    50, // Mana cost
    1,  // Cooldown
    schoolgirlElpheltLoveBulletEffect
).setDescription('Deals 300 + (50% AD + 50% MD) physical damage.')
 .setTargetType('enemy');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirlElpheltQ
        // Add other Elphelt abilities here
    ]);
} else {
    console.warn("Schoolgirl Elphelt abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_elphelt_q = schoolgirlElpheltQ;
}

const flowerBombEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    
    if (!target || !target.abilities || target.abilities.length === 0) {
        log("Flower Bomb: Invalid target or target has no abilities.", "error");
        return;
    }
    
    log(`${caster.name} throws a Flower Bomb at ${target.name}!`);
    
    // Play sound effect for Flower Bomb
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/elphelt_a2.mp3');
    
    // --- Flower Bomb VFX ---
    const targetElement = document.getElementById(`character-${target.id}`);
    if (targetElement) {
        const bombVfx = document.createElement('div');
        bombVfx.className = 'flower-bomb-vfx'; // Add specific class
        bombVfx.innerHTML = '🌸'; // Simple flower emoji
        targetElement.appendChild(bombVfx);

        // Animate the bomb (e.g., scale and fade)
        bombVfx.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });

        setTimeout(() => bombVfx.remove(), 800);
    }
    // --- End VFX ---

    // Select a random ability to disable (excluding passives, potentially other criteria)
    const availableAbilities = target.abilities.filter(ability => 
        ability && !ability.isDisabled // Exclude already disabled abilities
        // Add other exclusions if needed, e.g., ability.isPassive?
    );

    if (availableAbilities.length === 0) {
        log(`${target.name} has no abilities available to disable.`, "info");
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableAbilities.length);
    const abilityToDisable = availableAbilities[randomIndex];

    log(`${target.name}'s ${abilityToDisable.name} is disabled!`);

    // Create the disable debuff
    const disableDebuff = new Effect(
        'elphelt_flower_bomb_disable',
        'Ability Disabled (Flower Bomb)',
        'Icons/abilities/ability_disabled.jfif', // Placeholder icon for the debuff
        2, // Duration: 2 turns
        (character) => {
            // This runs each turn the debuff is active (optional)
        },
        true // isDebuff = true
    ).setDescription(`Disables one random ability for 2 turns.`);

    // Store which ability was disabled for cleanup
    disableDebuff.disabledAbilityId = abilityToDisable.id;

    // --- Apply the disable effect --- 
    abilityToDisable.isDisabled = true;
    abilityToDisable.disabledDuration = 2; // Set initial duration
    // --- End Apply --- 
    
    // Define the remove function for the debuff
    disableDebuff.remove = (character) => {
        // Find the specific ability that was disabled by *this* debuff instance
        const originallyDisabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
        if (originallyDisabledAbility) {
            // Only re-enable if the current disabled duration is from this debuff
            // (Handles cases where it might be disabled again before this expires)
            if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                 originallyDisabledAbility.isDisabled = false;
                 log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Flower Bomb.`);
                 // Update UI to reflect the change immediately
                 if (window.gameManager && window.gameManager.uiManager) {
                     window.gameManager.uiManager.updateCharacterUI(character);
                 }
            }
        } else {
            log(`Could not find ability ${disableDebuff.disabledAbilityId} on ${character.name} to re-enable.`);
        }
    };

    // Apply the debuff to the target
    target.addDebuff(disableDebuff.clone()); // Clone to ensure unique instances
    
    // Track statistics
    trackFlowerBombStats(caster, target, abilityToDisable.name);
    
    // Update UI for both characters
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const elpheltFlowerBomb = new Ability(
    'schoolgirl_elphelt_w',
    'Flower Bomb',
    'Icons/abilities/flower_bomb.jfif', // Placeholder icon path
    75, // Mana cost
    8,  // Cooldown
    flowerBombEffect
).setDescription('Throws a flower bomb, disabling one of the target\'s abilities for 2 turns.')
 .setTargetType('enemy');

// Register abilities with the AbilityFactory
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        elpheltFlowerBomb
        // Add other Elphelt abilities here if they have custom logic
    ]);
} else {
    console.warn("Schoolgirl Elphelt abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_elphelt_w = elpheltFlowerBomb;
}

// --- E: Affection ---
const schoolgirlElpheltAffectionEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Affection: No target selected!", "error");
        return;
    }

    const buffId = `affection_buff_${target.id}`; // Unique ID for the buff linking to the target
    const debuffId = `affection_debuff_${caster.id}`; // Unique ID for the debuff linking to the caster
    const duration = 4;
    const manaCost = 100; // Defined in ability object, but good to have here for reference

    log(`${caster.name} uses Affection on ${target.name}. A special bond is formed!`);
    // Optional: Add sound effect
    playSound('sounds/elphelt_charm.mp3'); // Needs a sound file

    // --- VFX ---
    const targetElement = document.getElementById(`character-${target.id}`);
    const casterElement = document.getElementById(`character-${caster.id}`);

    // Simple heart VFX over target
    if (targetElement) {
        const heartVfx = document.createElement('div');
        heartVfx.className = 'affection-vfx target-heart';
        heartVfx.innerHTML = '❤️'; // Simple heart
        targetElement.appendChild(heartVfx);
        setTimeout(() => heartVfx.remove(), 1500); // Fade out after 1.5s
    }
    // Linked heart VFX over caster
    if (casterElement) {
        const heartVfx = document.createElement('div');
        heartVfx.className = 'affection-vfx caster-heart';
        heartVfx.innerHTML = '❤️'; // Simple heart
        casterElement.appendChild(heartVfx);
        setTimeout(() => heartVfx.remove(), 1500); // Fade out after 1.5s
    }
    // --- End VFX ---

    // Create the buff for Elphelt (caster)
    const affectionBuff = new Effect(
        buffId,
        `Affection (${target.name})`,
        'Icons/abilities/affection.jfif', // Placeholder icon
        duration,
        null, // No per-turn effect, logic is in applyDamage
        false // isDebuff = false
    ).setDescription(`Receives 50% less damage from ${target.name}.`);

    // Store the target's ID in the buff object for damage reduction checks
    affectionBuff.targetId = target.id;

    // Define remove logic for the buff
    affectionBuff.remove = (character) => {
        log(`${character.name}'s Affection buff for ${target.name} fades.`);
        // Damage reduction logic implicitly stops when buff is removed.
    };

    // Create the debuff for the target (mostly visual)
    const affectionDebuff = new Effect(
        debuffId,
        `Affected by Affection (${caster.name})`,
        'Icons/abilities/affection.jfif', // Placeholder icon
        duration,
        null, // No direct effect
        true // isDebuff = true
    ).setDescription(`Infatuated with ${caster.name}.`);

    // Apply the buff to the caster (Elphelt) and debuff to the target
    caster.addBuff(affectionBuff.clone()); // Use clone for unique instances
    target.addDebuff(affectionDebuff.clone());

    // Track statistics
    trackAffectionStats(caster, target);

    // Update UI for both characters
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolgirlElpheltE = new Ability(
    'schoolgirl_elphelt_e',
    'Affection',
    'Icons/abilities/affection.jfif', // Use buff icon for ability?
    100, // Mana cost
    9,  // Cooldown
    schoolgirlElpheltAffectionEffect
).setDescription('Places a heart onto the target enemy, causing them to deal 50% less damage to Elphelt for 4 turns.')
 .setTargetType('enemy');


// Register abilities with the AbilityFactory
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        elpheltFlowerBomb, // Keep existing registrations
        schoolgirlElpheltE // Add the new E ability
    ]);
} else {
    console.warn("Schoolgirl Elphelt abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_elphelt_w = elpheltFlowerBomb;
    window.definedAbilities.schoolgirl_elphelt_e = schoolgirlElpheltE; // Add E ability to fallback
}

// Helper function to get valid pierce targets
function getValidPierceTargets(caster, currentTarget, hitTargets) {
    const gameManager = window.gameManager;
    if (!gameManager) return [];

    // Determine opponent list (usually AI characters if caster is player, and vice-versa)
    const opponentList = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;

    return opponentList.filter(char => 
        char && 
        !char.isDead() && 
        char !== currentTarget && // Don't hit the target we just hit
        !hitTargets.includes(char.id) // Don't hit a target already hit in this chain
    );
}

// Piercing Bullet (R) Effect
const schoolgirlElpheltPiercingBulletEffect = async (caster, initialTarget) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!initialTarget || initialTarget.isDead()) {
        log(`${caster.name} tries to use Piercing Bullet, but the target is invalid.`);
        return;
    }

    log(`${caster.name} fires Piercing Bullet at ${initialTarget.name}!`);
    playSound('sounds/elphelta4.mp3'); // Assuming a sound exists

    // --- Piercing Bullet Initial Hit VFX ---
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${initialTarget.id}`);

    if (casterElement && targetElement) {
        const tracerVfx = document.createElement('div');
        tracerVfx.className = 'elphelt-piercing-bullet-tracer initial-hit'; // Specific class
        document.body.appendChild(tracerVfx);

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        let endX = targetRect.left + targetRect.width / 2;
        let endY = targetRect.top + targetRect.height / 2;
        
        let angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        let distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        tracerVfx.style.left = `${startX}px`;
        tracerVfx.style.top = `${startY}px`;
        tracerVfx.style.width = `${distance}px`;
        tracerVfx.style.transform = `rotate(${angle}deg)`;

        // Remove tracer after animation
        setTimeout(() => tracerVfx.remove(), 500); 
    }
     // --- End Initial Hit VFX ---

    // Calculate initial damage: 350% Physical Damage
    const initialDamage = Math.floor(caster.stats.physicalDamage * 3.5);
    initialTarget.isDamageSource = caster; // For crit/lifesteal calculation
    const initialResult = initialTarget.applyDamage(initialDamage, 'physical', caster, { abilityId: 'heart_storm' });
    initialTarget.isDamageSource = null;

    log(`${initialTarget.name} takes ${initialResult.damage} physical damage.`);
    if (initialResult.isCritical) log("Critical Hit!");
    caster.applyLifesteal(initialResult.damage); // Apply lifesteal for the initial hit
     if (initialTarget.isDead()) log(`${initialTarget.name} was defeated by the initial hit!`);

    // Track initial hit statistics
    trackPiercingBulletStats(caster, initialTarget, initialResult, true, 0);

    // --- Piercing Chain Logic ---
    let currentDamage = initialDamage;
    let currentTarget = initialTarget;
    const hitTargets = [initialTarget.id]; // Keep track of targets hit in this chain
    let chainCount = 0;

    while (Math.random() < 0.5) { // 50% chance to pierce
        if (currentTarget.isDead()) {
             log(`Piercing Bullet stops chaining as the last target (${currentTarget.name}) was defeated.`);
             break; // Stop if the last target died
        }
        
        const validTargets = getValidPierceTargets(caster, currentTarget, hitTargets);
        if (validTargets.length === 0) {
            log("Piercing Bullet has no more valid targets to chain to.");
            break; // No more valid targets
        }

        // Select a random target from the valid ones
        const nextTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
        hitTargets.push(nextTarget.id);
        chainCount++;

        // Reduce damage by 50% for the pierce
        currentDamage = Math.floor(currentDamage * 0.5);
        if (currentDamage < 1) currentDamage = 1; // Ensure minimum damage

        log(`Piercing Bullet chains to ${nextTarget.name}!`);
        playSound('sounds/elphelt_r_pierce.mp3'); // Assuming a pierce sound exists

        // --- Piercing Chain VFX ---
        const prevTargetElement = document.getElementById(`character-${currentTarget.id}`);
        const nextTargetElement = document.getElementById(`character-${nextTarget.id}`);
        if (prevTargetElement && nextTargetElement) {
             const tracerVfx = document.createElement('div');
             tracerVfx.className = 'elphelt-piercing-bullet-tracer chain-hit'; // Specific class
             document.body.appendChild(tracerVfx);

             const prevRect = prevTargetElement.getBoundingClientRect();
             const nextRect = nextTargetElement.getBoundingClientRect();
             const startXChain = prevRect.left + prevRect.width / 2;
             const startYChain = prevRect.top + prevRect.height / 2;
             const endXChain = nextRect.left + nextRect.width / 2;
             const endYChain = nextRect.top + nextRect.height / 2;
             
             const angleChain = Math.atan2(endYChain - startYChain, endXChain - startXChain) * 180 / Math.PI;
             const distanceChain = Math.sqrt(Math.pow(endXChain - startXChain, 2) + Math.pow(endYChain - startYChain, 2));

             tracerVfx.style.left = `${startXChain}px`;
             tracerVfx.style.top = `${startYChain}px`;
             tracerVfx.style.width = `${distanceChain}px`;
             tracerVfx.style.transform = `rotate(${angleChain}deg)`;

             // Remove tracer after animation
             setTimeout(() => tracerVfx.remove(), 500);
        }
        // --- End Chain VFX ---
        
        // Apply pierce damage
        nextTarget.isDamageSource = caster;
        const pierceResult = nextTarget.applyDamage(currentDamage, 'physical', caster, { abilityId: 'heart_storm_pierce' });
        nextTarget.isDamageSource = null;

        log(`${nextTarget.name} takes ${pierceResult.damage} piercing damage.`);
         if (pierceResult.isCritical) log("Critical Hit on pierce!"); // Note: Crit check happens in applyDamage
        caster.applyLifesteal(pierceResult.damage); // Apply lifesteal for the pierce hit
        if (nextTarget.isDead()) log(`${nextTarget.name} was defeated by the pierce!`);

        // Track chain hit statistics
        trackPiercingBulletStats(caster, nextTarget, pierceResult, false, chainCount);

        // Update current target for the next potential pierce
        currentTarget = nextTarget;

        // Add a small delay between pierces for visual clarity
        if (window.gameManager && typeof window.gameManager.delay === 'function') {
            await window.gameManager.delay(300); 
        } else {
             await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    log("Piercing Bullet chain ends.");
    updateCharacterUI(caster); // Update caster UI once at the end
};

// Define the Ability object
const schoolgirlElpheltR = new Ability(
    'schoolgirl_elphelt_r',
    'Piercing Bullet',
    'Icons/abilities/piercing_bullet.jfif',
    100, // Mana cost
    14,  // Cooldown
    schoolgirlElpheltPiercingBulletEffect // Use the custom effect function
).setDescription('Deals 350% Physical Damage to the target. Has a 50% chance to pierce to another random enemy for 50% of the original damage, potentially chaining multiple times.')
 .setTargetType('enemy');

// --- Register with AbilityFactory ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        // Add other Elphelt abilities here if they have custom logic
        schoolgirlElpheltR
    ]);
} else {
    console.warn("Schoolgirl Elphelt R ability defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object if needed
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_elphelt_r = schoolgirlElpheltR;
} 