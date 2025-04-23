// Ability definition for Angry Carrot: Go Dormant

// Assume Ability, Effect, Character classes and necessary game manager/UI access are available

const goDormantEffect = (caster, target) => { // target will be the caster due to "targetType": "self"
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect; // Assuming Effect class is globally available

    if (!Effect) {
        log("Go Dormant Error: Cannot access Effect class!", "error");
        return;
    }
    if (caster !== target) {
         log("Go Dormant Error: Target must be self!", "error");
         return; // Should not happen with targetType: "self"
    }

    const healAmount = 2500;
    const stunDuration = 2;
    const stunDebuffId = 'go_dormant_stun_debuff'; // Unique ID for this stun
    const stunName = 'Dormant';
    const stunIcon = 'Icons/effects/stun.png'; // Re-use generic stun icon for now

    log(`${caster.name} uses Go Dormant!`);
    // playSound('sounds/go_dormant.mp3', 0.7); // Optional: Add a sound

    // --- 1. Heal the caster ---
    const actualHeal = caster.heal(healAmount);
    log(`${caster.name} healed for ${actualHeal} HP.`);

    // --- 2. Apply Stun Debuff to caster ---
    log(`${caster.name} becomes Dormant (Stunned) for ${stunDuration} turns.`);
    const stunDebuff = new Effect(
        stunDebuffId,
        stunName,
        stunIcon,
        stunDuration,
        null, // No per-turn effect function needed for basic stun
        true // isDebuff = true
    ).setDescription(`Cannot act for ${stunDuration} turns.`);

    // Add the 'cantAct' effect property for isStunned() check
    stunDebuff.effects = { cantAct: true };
    // --- IMPORTANT: Add sourceAbilityId for specific UI styling ---
    stunDebuff.sourceAbilityId = 'self_heal_stun'; // Match the ability ID in JSON

    caster.addDebuff(stunDebuff); // Apply debuff to self

    // --- 3. VFX ---
    // The 'zzz' VFX is handled by CSS triggered by the 'go-dormant-stun' class added in UIManager
    // We could add an initial cast VFX here if desired
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Example: Add a temporary green glow for the heal part
        const healGlow = document.createElement('div');
        healGlow.style.position = 'absolute';
        healGlow.style.inset = '0';
        healGlow.style.borderRadius = '50%';
        healGlow.style.background = 'radial-gradient(circle, rgba(46, 204, 113, 0.6) 0%, rgba(46, 204, 113, 0) 70%)';
        healGlow.style.animation = 'fadeOut 1s ease-out forwards';
        healGlow.style.zIndex = '5';
        healGlow.style.pointerEvents = 'none';
        casterElement.appendChild(healGlow);
        setTimeout(() => healGlow.remove(), 1000);
    }

    // Update caster UI (to show heal and stun)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
};

// --- Anger Ability Definition ---
const angerEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect;

    if (!Effect) {
        log("Anger Error: Cannot access Effect class!", "error");
        return;
    }
    if (caster !== target) {
        log("Anger Error: Target must be self!", "error");
        return;
    }

    const buffDuration = 3;
    const damageIncrease = 5.00; // 500% increase
    const buffId = 'anger_damage_buff';
    const buffName = 'Enraged';
    const buffIcon = 'Icons/abilities/anger.jpeg'; // Use the same icon as the ability

    log(`${caster.name} uses Anger!`);
    // playSound('sounds/anger.mp3', 0.8); // Optional: Add a sound

    // --- Create and Apply Buff ---
    const damageBuff = new Effect(
        buffId,
        buffName,
        buffIcon,
        buffDuration,
        null, // No per-turn effect needed, handled by statModifiers
        false // isDebuff = false
    ).setDescription(`Physical Damage increased by ${damageIncrease * 100}% for ${buffDuration} turns.`);

    // Add statModifiers to increase physical damage
    damageBuff.statModifiers = {
        physicalDamage: caster.baseStats.physicalDamage * damageIncrease // Increase by 500% of base damage
    };
    // Store the base damage value at the time of application for removal
    damageBuff.originalBaseDamage = caster.baseStats.physicalDamage;

    // Define a custom remove function to revert the damage increase
    damageBuff.remove = (character) => {
        // Recalculate stats after removing the buff's direct modifier effect.
        // The Character.recalculateStats() handles applying other buffs/debuffs correctly.
        console.log(`Anger buff expiring, removing stat modifier for ${character.name}.`);
        // No direct stat manipulation needed here, recalculateStats handles it.
    };


    caster.addBuff(damageBuff); // Apply buff to self

    // --- VFX ---
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Add a red pulse/glow effect
        casterElement.classList.add('anger-cast-vfx'); // Trigger CSS animation
        setTimeout(() => {
            casterElement.classList.remove('anger-cast-vfx');
        }, 1000); // Duration matches CSS animation

        // Add persistent visual indicator for the buff duration
        const buffIndicator = document.createElement('div');
        buffIndicator.className = 'anger-active-vfx'; // Style this in CSS
        buffIndicator.dataset.buffId = buffId; // Link indicator to the buff
        casterElement.appendChild(buffIndicator);
    }

    // Update caster UI (to show buff)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
};

// --- Carrot Cannon Ability Definition ---
const carrotCannonEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} fires Carrot Cannon at ${target.name}!`);
    // playSound('sounds/carrot_cannon.mp3', 0.8); // Optional: Add a sound

    // Calculate damage (110% of physical damage)
    const damageMultiplier = 1.1; // 110%
    const baseDamage = caster.stats.physicalDamage * damageMultiplier;
    
    // Apply damage to target
    // The applyDamage function returns an object: { damage: number, isCritical: boolean, dodged: boolean }
    const damageResult = target.applyDamage(baseDamage, 'physical', caster, {
        isCritical: Math.random() < caster.stats.critChance,
        abilityId: 'carrot_cannon'
    });

    // Log the actual damage taken from the result object
    log(`${target.name} takes ${damageResult.damage} physical damage!${damageResult.isCritical ? ' (Critical Hit!)' : ''}${damageResult.dodged ? ' (Dodged!)' : ''}`);

    // --- VFX ---
    // Add visual effects for the ability
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    
    if (casterElement && targetElement) {
        // Create projectile element
        const projectile = document.createElement('div');
        projectile.className = 'carrot-cannon-projectile';
        document.body.appendChild(projectile);
        
        // Get positions for animation
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Position at caster
        projectile.style.left = `${casterRect.left + casterRect.width/2}px`;
        projectile.style.top = `${casterRect.top + casterRect.height/2}px`;
        
        // Animate to target
        projectile.style.transition = 'left 0.4s ease-out, top 0.4s ease-out';
        setTimeout(() => {
            projectile.style.left = `${targetRect.left + targetRect.width/2}px`;
            projectile.style.top = `${targetRect.top + targetRect.height/2}px`;
        }, 50);
        
        // Impact effect
        setTimeout(() => {
            projectile.remove();
            
            // Create impact effect
            const impact = document.createElement('div');
            impact.className = 'carrot-cannon-impact';
            targetElement.appendChild(impact);
            
            // Remove impact effect after animation
            setTimeout(() => impact.remove(), 600);
        }, 450);
    }
    
    // Update target UI (to show damage)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }
};

// --- Ability Instance ---
const goDormantAbility = new Ability(
    'self_heal_stun', // ID must match the one in angry_carrot.json
    'Go Dormant',
    'Icons/abilities/rooted_rage.jpeg', // Keeping original icon as requested
    50,  // Mana cost
    12,   // Cooldown
    goDormantEffect // The function implementing the logic
).setDescription('The carrot goes dormant, healing for 2500 HP but becoming stunned for the next 2 turns.')
 .setTargetType('self');

// --- Ability Instance ---
const angerAbility = new Ability(
    'anger',
    'Anger',
    'Icons/abilities/anger.jpeg',
    75, // Mana cost
    6,  // Cooldown
    angerEffect // The function implementing the logic
).setDescription('Places a buff on itself gaining 500% Physical damage for 3 turns.')
 .setTargetType('self');

// --- Ability Instance ---
const carrotCannonAbility = new Ability(
    'carrot_cannon',
    'Carrot Cannon',
    'Icons/abilities/carrot_cannon.png',
    50,  // Mana cost
    1,   // Cooldown
    carrotCannonEffect // The function implementing the logic
).setDescription('Deals 110% Physical Damage as physical damage to the target.')
 .setTargetType('enemy');

// --- Ability Factory Integration ---
// Make sure AbilityFactory is available globally or imported correctly
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([goDormantAbility, angerAbility, carrotCannonAbility]);
    console.log("[AbilityFactory] Registered Angry Carrot abilities.");
} else {
    console.warn("Angry Carrot abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: Assign to a global object if necessary for testing/alternative setups
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.self_heal_stun = goDormantAbility;
    window.definedAbilities.anger = angerAbility; // Add angerAbility fallback
    window.definedAbilities.carrot_cannon = carrotCannonAbility; // Add carrotCannonAbility fallback
} 