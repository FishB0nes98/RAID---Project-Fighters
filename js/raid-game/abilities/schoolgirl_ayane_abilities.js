// Ability definitions for Schoolgirl Ayane

// Assume Ability, Effect classes and addLogEntry function are available globally or imported

/**
 * Schoolgirl Ayane Statistics Enhancement
 * Enhanced statistics tracking for all of Schoolgirl Ayane's abilities to match comprehensive tracking systems
 */

/**
 * Global helper function to track Schoolgirl Ayane's ability usage for statistics
 */
function trackAyaneAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[AyaneStats] StatisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[AyaneStats] Tracked ${abilityId} usage: ${effectType}, amount: ${amount}, crit: ${isCritical}`);
    } catch (error) {
        console.error(`[AyaneStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Track Butterfly Dagger statistics
 */
function trackButterflyDaggerStats(caster, target, damageResult, dodgeBuffApplied = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt
        if (damageAmount > 0) {
            window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, 'ayane_q');
        }
        
        // Track ability usage
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_q', 'damage', damageAmount, isCritical);
        
        // Track dodge buff application if it occurred
        if (dodgeBuffApplied) {
            window.statisticsManager.recordAbilityUsage(caster, 'ayane_q_dodge_buff', 'buff', 50, false);
        }
        
        console.log(`[AyaneStats] Tracked Butterfly Dagger: ${damageAmount} damage, crit: ${isCritical}, dodge buff: ${dodgeBuffApplied}`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Butterfly Dagger stats:', error);
    }
}

/**
 * Track Butterfly Trail statistics
 */
function trackButterflyTrailStats(caster, alliesBuffed, avgDamageBonus) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility usage for buff application
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_w', 'buff', alliesBuffed.length, false);
        
        // Track total damage bonus granted
        const totalDamageBonus = alliesBuffed.length * avgDamageBonus;
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_w_damage_bonus', 'buff', totalDamageBonus, false);
        
        console.log(`[AyaneStats] Tracked Butterfly Trail: ${alliesBuffed.length} allies buffed, ${totalDamageBonus} total damage bonus`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Butterfly Trail stats:', error);
    }
}

/**
 * Track Quick Reflexes statistics
 */
function trackQuickReflexesStats(caster, dodgeBuffAmount, damageBuffAmount) {
    if (!window.statisticsManager) return;
    
    try {
        // Track dodge buff
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_e_dodge', 'buff', dodgeBuffAmount, false);
        
        // Track damage buff
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_e_damage', 'buff', damageBuffAmount, false);
        
        // Track combined utility usage
        window.statisticsManager.recordAbilityUsage(caster, 'ayane_e', 'buff', dodgeBuffAmount + damageBuffAmount, false);
        
        console.log(`[AyaneStats] Tracked Quick Reflexes: ${dodgeBuffAmount}% dodge, ${damageBuffAmount} damage bonus`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Quick Reflexes stats:', error);
    }
}

/**
 * Track Execute Attack statistics
 */
function trackExecuteAttackStats(caster, target, damageResult, wasExecute = false, cooldownReset = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        const abilityId = wasExecute ? 'ayane_r_execute' : 'ayane_r';
        
        // Track damage dealt
        if (damageAmount > 0) {
            window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, abilityId);
        }
        
        // Track ability usage
        window.statisticsManager.recordAbilityUsage(caster, abilityId, 'damage', damageAmount, isCritical);
        
        // Track execute threshold hit
        if (wasExecute) {
            window.statisticsManager.recordAbilityUsage(caster, 'ayane_r_execute_threshold', 'utility', 0, false);
        }
        
        // Track cooldown reset
        if (cooldownReset) {
            window.statisticsManager.recordAbilityUsage(caster, 'ayane_r_reset', 'utility', 0, false);
        }
        
        console.log(`[AyaneStats] Tracked Execute Attack: ${damageAmount} damage, execute: ${wasExecute}, reset: ${cooldownReset}`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Execute Attack stats:', error);
    }
}

/**
 * Track Combat Reflexes passive statistics
 */
function trackCombatReflexesPassiveStats(character, damageBonus) {
    if (!window.statisticsManager) return;
    
    try {
        // Track dodge that triggered the passive
        window.statisticsManager.recordAbilityUsage(character, 'ayane_passive_dodge', 'utility', 1, false);
        
        // Track damage bonus gained
        window.statisticsManager.recordAbilityUsage(character, 'ayane_passive_damage_bonus', 'buff', damageBonus, false);
        
        console.log(`[AyaneStats] Tracked Combat Reflexes passive: +${damageBonus} damage bonus from dodge`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Combat Reflexes passive stats:', error);
    }
}

// --- Q: Butterfly Dagger --- 

const schoolgirlAyaneButterflyDaggerEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Schoolgirl Ayane Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} throws a Butterfly Dagger at ${target.name}.`);
    playSound('sounds/dagger_throw.mp3'); // Placeholder sound

    // --- Butterfly Dagger VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        const daggerVfx = document.createElement('div');
        daggerVfx.className = 'schoolgirl-ayane-dagger-vfx'; // Add specific class
        document.body.appendChild(daggerVfx);

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 3; // Adjust start position
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        daggerVfx.style.left = `${startX}px`;
        daggerVfx.style.top = `${startY}px`;
        daggerVfx.style.width = `${distance}px`; // Use width for line-like effect
        // Rotate the dagger itself, not just the line
        daggerVfx.style.setProperty('--dagger-angle', `${angle}deg`); 

        // Animate the dagger throw
        daggerVfx.style.animation = 'dagger-throw 0.3s linear forwards';

        setTimeout(() => {
            // Impact VFX on target
            const impactVfx = document.createElement('div');
            impactVfx.className = 'schoolgirl-ayane-dagger-impact';
            targetElement.appendChild(impactVfx);
            playSound('sounds/dagger_impact.mp3'); // Placeholder sound

            setTimeout(() => impactVfx.remove(), 500);
            daggerVfx.remove(); // Remove the dagger line
        }, 300); 
    }
    // --- End VFX ---

    // Calculate damage: 425 + 55% Physical Damage
    const baseDamage = 425 + (caster.stats.physicalDamage * 0.55);
    
    // Apply damage with statistics tracking
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'ayane_q' });

    log(`${target.name} takes ${result.damage} physical damage.` + (result.isCritical ? ' (Critical Hit!)' : ''));

    // Apply lifesteal if caster has any
    caster.applyLifesteal(result.damage);

    // 60% chance to gain dodge chance buff
    let dodgeBuffApplied = false;
    if (Math.random() < 0.60) {
        dodgeBuffApplied = true;
        log(`${caster.name} gains Evasive Maneuver!`);
        const dodgeBuff = new Effect(
            'schoolgirl_ayane_q_dodge_buff',
            'Evasive Maneuver',
            'Icons/abilities/butterfly_dagger.webp', // Use Q icon for buff
            1, // Duration: 1 turn
            null, // No per-turn effect
            false // Not a debuff
        ).setDescription('Increases dodge chance by 50%.');

        dodgeBuff.statModifiers = [
            { stat: 'dodgeChance', value: 0.50, operation: 'add' }
        ];

        // Define remove function for cleanup if needed (optional for short buffs)
        dodgeBuff.remove = (character) => {
             log(`${character.name}'s Evasive Maneuver fades.`);
        };

        caster.addBuff(dodgeBuff.clone());
    }
    
    // Track statistics
    trackButterflyDaggerStats(caster, target, result, dodgeBuffApplied);

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'ayane_q',
            abilityName: 'Butterfly Dagger'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    if (target.isDead()) {
        log(`${target.name} has been defeated!`);
    }

    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolgirlAyaneQ = new Ability(
    'schoolgirl_ayane_q',
    'Butterfly Dagger',
    'Icons/abilities/butterfly_dagger.webp',
    50, // Mana cost
    1,  // Cooldown (Changed from 2)
    schoolgirlAyaneButterflyDaggerEffect
).setDescription('Deals 425 (+55% Physical Damage). 60% chance to gain 50% dodge chance for 1 turn.')
 .setTargetType('enemy');

// --- W: Butterfly Trail --- 
const schoolgirlAyaneWEffect = (caster, targets) => { // Target type is all_allies, so 'targets' isn't used directly here
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const gameManager = window.gameManager;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!gameManager) {
        log("Game Manager not found! Cannot apply Butterfly Trail buff.", "error");
        return;
    }

    log(`${caster.name} uses Butterfly Trail, empowering allies!`);
    // Play W sound effect
    playSound('sounds/ayanea2spell.mp3'); // Updated sound

    // Determine the allied team
    const allies = caster.isAI ? gameManager.gameState.aiCharacters : gameManager.gameState.playerCharacters;

    // --- Butterfly Trail VFX --- 
    allies.forEach(ally => {
        if (!ally || ally.isDead()) return;
        const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
        if (allyElement) {
            const trailVfx = document.createElement('div');
            trailVfx.className = 'butterfly-trail-vfx';
            // Add particle elements or styles here
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'butterfly-particle';
                trailVfx.appendChild(particle);
            }
            allyElement.appendChild(trailVfx);

            setTimeout(() => {
                trailVfx.remove();
            }, 1500); // Duration of the VFX
        }
    });
    // --- End VFX --- 

    const alliesBuffed = [];
    let totalDamageBonus = 0;
    
    allies.forEach(ally => {
        if (!ally || ally.isDead()) return;

        // Calculate flat increase based on 20% of ally's current stats
        const physicalDamageIncrease = Math.floor(ally.stats.physicalDamage * 0.20);
        const magicalDamageIncrease = Math.floor(ally.stats.magicalDamage * 0.20);

        // Create the buff effect instance for this ally
        const buff = new Effect(
            'schoolgirl_ayane_w_buff', // Unique ID for the buff type
            'Butterfly Trail Buff',
            'Icons/abilities/butterfly_trail_schoolgirl.webp', // Use W ability icon or a specific buff icon
            4, // Duration: 4 turns
            () => {}, // No per-turn effect needed as stats are modified on application/removal
            false // Not a debuff
        ).setDescription(`Increases Physical Damage by ${physicalDamageIncrease} and Magical Damage by ${magicalDamageIncrease} (20% boost).`);

        // Add the calculated flat stat modifiers
        buff.statModifiers = [
            { stat: 'physicalDamage', value: physicalDamageIncrease, operation: 'add' },
            { stat: 'magicalDamage', value: magicalDamageIncrease, operation: 'add' }
        ];
        
        // The existing addBuff in character.js should handle storing original values 
        // and applying the flat modifier.
        ally.addBuff(buff.clone()); // Use clone to ensure each ally gets a separate buff instance if needed

        log(`${ally.name} is empowered by Butterfly Trail (+${physicalDamageIncrease} Phys Dmg, +${magicalDamageIncrease} Mag Dmg)!`);
        updateCharacterUI(ally);
        
        // Track for statistics
        alliesBuffed.push(ally);
        totalDamageBonus += physicalDamageIncrease + magicalDamageIncrease;
    });
    
    // Track statistics
    const avgDamageBonus = alliesBuffed.length > 0 ? totalDamageBonus / alliesBuffed.length : 0;
    trackButterflyTrailStats(caster, alliesBuffed, avgDamageBonus);

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'ayane_w',
            abilityName: 'Butterfly Trail'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    updateCharacterUI(caster);
};

const schoolgirlAyaneW = new Ability(
    'schoolgirl_ayane_w',
    'Butterfly Trail (Schoolgirl Version)',
    'Icons/abilities/butterfly_trail_schoolgirl.webp',
    85, // Mana cost
    7, // Cooldown
    schoolgirlAyaneWEffect
).setDescription('Gives ALL allies a buff increasing Physical Damage and Magical Damage by 20% for 4 turns.')
 .setTargetType('all_allies'); // Important: Set target type for UI/targeting logic

// --- E: Quick Reflexes ---
const schoolgirlAyaneEEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Quick Reflexes, becoming incredibly agile!`);
    playSound('sounds/quick_reflexes.mp3'); // Placeholder sound

    // --- Quick Reflexes VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfx = document.createElement('div');
        vfx.className = 'quick-reflexes-vfx'; // Add specific class
        casterElement.appendChild(vfx);

        // Add particle elements or use ::before/::after in CSS
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'quick-reflexes-particle';
            vfx.appendChild(particle);
        }

        // Remove VFX after a duration (e.g., 1.5 seconds)
        setTimeout(() => vfx.remove(), 1500);
    }
    // --- End VFX ---

    // Calculate flat AD increase based on 250% of total AD
    const physicalDamageIncrease = Math.floor(caster.stats.physicalDamage * 2.5); // Use stats.physicalDamage which is recalculated
    const dodgeChanceIncrease = 100; // 100% dodge chance

    // Create the buff effect instance
    const buff = new Effect(
        'schoolgirl_ayane_e_buff', // Unique ID for the buff type
        'Quick Reflexes',
        'Icons/abilities/quick_reflexes.webp', // Placeholder icon
        2, // Duration: 2 turns
        () => {}, // No per-turn effect needed
        false // Not a debuff
    ).setDescription(`Gains 100% dodge chance and increases Physical Damage by 250% of current total Physical Damage (+${physicalDamageIncrease} AD) for 2 turns.`);

    // Add the stat modifiers
    buff.statModifiers = [
        { stat: 'dodgeChance', value: 1.0, operation: 'add' }, // 100% dodge chance
        { stat: 'physicalDamage', value: physicalDamageIncrease, operation: 'add' } // Flat AD increase
    ];

    // Define remove function for cleanup
    buff.remove = (character) => {
        log(`${character.name}'s Quick Reflexes wears off.`);
    };

    // Apply the buff
    caster.addBuff(buff.clone());

    log(`${caster.name} gains 100% dodge and +${physicalDamageIncrease} AD!`);
    
    // Track statistics
    trackQuickReflexesStats(caster, dodgeChanceIncrease, physicalDamageIncrease);
    
    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'ayane_e',
            abilityName: 'Quick Reflexes'
        }
    });
    document.dispatchEvent(abilityUsedEvent);
    
    updateCharacterUI(caster);
};

const schoolgirlAyaneE = new Ability(
    'schoolgirl_ayane_e',
    'Quick Reflexes',
    'Icons/abilities/quick_reflexes.webp', // Placeholder icon
    100, // Mana cost
    11, // Cooldown
    schoolgirlAyaneEEffect
).setDescription('Gains 100% dodge chance and increases Physical Damage by 250% of total Physical Damage for 2 turns.') // Update description
 .setTargetType('self');

// --- R: Execute Attack ---
const schoolgirlAyaneREffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Schoolgirl Ayane R: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Execute Attack on ${target.name}!`);
    playSound('sounds/ayanea4.mp3'); // Updated sound

    // --- Execute Attack VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        // Example VFX: Caster dashes towards target, slash effect, impact
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'schoolgirl-ayane-execute-vfx';
        document.body.appendChild(vfxContainer); // Add to body for positioning

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // 1. Dash/Teleport Effect (optional)
        // Could add a blur/shadow trail effect from caster to target

        // 2. Powerful Slash/Impact on Target
        const impactVfx = document.createElement('div');
        impactVfx.className = 'schoolgirl-ayane-execute-impact';
        targetElement.appendChild(impactVfx);

        setTimeout(() => {
            impactVfx.remove();
            vfxContainer.remove(); // Clean up container
        }, 1000); // Duration of impact VFX
    }
    // --- End VFX ---

    // Determine damage multiplier based on target HP
    const targetHpPercent = target.stats.currentHp / target.stats.maxHp;
    const isExecute = targetHpPercent < 0.25;
    const damageMultiplier = isExecute ? 6.0 : 2.5; // Updated multipliers: 600% and 250%

    log(`${target.name} is at ${(targetHpPercent * 100).toFixed(1)}% HP.` + (isExecute ? ' Execute threshold met!' : ''));

    // Calculate damage: 250% or 600% Physical Damage
    const baseDamage = caster.stats.physicalDamage * damageMultiplier;
    
    // Apply damage with statistics tracking
    const abilityId = isExecute ? 'ayane_r_execute' : 'ayane_r';
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: abilityId });

    log(`${target.name} takes ${result.damage} physical damage from Execute Attack!` + (isExecute ? ' (EXECUTED!)' : ''));

    // Apply lifesteal if caster has any
    caster.applyLifesteal(result.damage);

    // Check if target died and track cooldown reset
    let cooldownReset = false;
    if (target.isDead()) {
        log(`${target.name} has been defeated by Execute Attack!`);
        
        // Reset cooldown - simplified approach based on working ayane_abilities.js
        const executeAttackAbility = caster.abilities.find(ability => ability.id === 'schoolgirl_ayane_r');
        if (executeAttackAbility) {
            executeAttackAbility.currentCooldown = 0;
            cooldownReset = true;
            log(`${caster.name}'s Execute Attack cooldown has been reset!`);
            
            // Add reset VFX similar to working example
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                const resetVfx = document.createElement('div');
                resetVfx.className = 'cooldown-reset-vfx';
                resetVfx.textContent = 'RESET!';
                casterElement.appendChild(resetVfx);
                
                // Remove the VFX after animation
                setTimeout(() => {
                    resetVfx.remove();
                }, 1200);
            }
            
            updateCharacterUI(caster); // Update UI to show reset cooldown
        } else {
            // Debug logging to see what abilities exist
            console.warn('Could not find Execute Attack ability to reset cooldown. Available abilities:', 
                caster.abilities.map(ab => ({ id: ab.id, name: ab.name })));
        }
    }
    
    // Track statistics
    trackExecuteAttackStats(caster, target, result, isExecute, cooldownReset);

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'ayane_r',
            abilityName: 'Execute Attack'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    updateCharacterUI(caster);
    updateCharacterUI(target);
    
    // Return result object for the ability system
    return {
        resetCooldown: cooldownReset  // This tells the Ability.use method whether to reset cooldown
    };
};

const schoolgirlAyaneR = new Ability(
    'schoolgirl_ayane_r',
    'Execute Attack',
    'Icons/abilities/execute_attack_schoolgirl.webp', // Placeholder icon
    100, // Mana cost
    12, // Cooldown
    schoolgirlAyaneREffect
).setDescription('Deals 250% Physical Damage. If the target is below 25% HP, deals 600% Physical Damage instead. Cooldown resets if this ability defeats the target.') // Update description
 .setTargetType('enemy');

// --- Register Abilities --- 
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirlAyaneQ,
        schoolgirlAyaneW,
        schoolgirlAyaneE,
        schoolgirlAyaneR // Add the new R ability
    ]);
} else {
    console.warn("Schoolgirl Ayane abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback registration
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_ayane_q = schoolgirlAyaneQ;
    window.definedAbilities.schoolgirl_ayane_w = schoolgirlAyaneW;
    window.definedAbilities.schoolgirl_ayane_e = schoolgirlAyaneE;
    window.definedAbilities.schoolgirl_ayane_r = schoolgirlAyaneR; // Add the new R ability
} 