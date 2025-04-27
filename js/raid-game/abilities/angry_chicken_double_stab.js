// Angry Chicken - Double Stab Ability

// Assume Ability, Effect, Character classes and necessary game manager access are available

const doubleStabEffect = async (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect; // Assuming Effect class is globally available

    if (!target || target.isDead()) {
        log(`${caster.name} tries Double Stab, but the target is invalid or defeated.`);
        return;
    }
    if (!Effect) {
        log("Double Stab Error: Cannot access Effect class!", "error");
        return;
    }

    log(`${caster.name} uses Double Stab on ${target.name}!`);
    playSound('sounds/double_stab.mp3', 0.8); // Play the sound

    // --- Damage Calculation ---
    const baseDamagePerHit = 500;

    // --- Debuff Details ---
    const debuffDuration = 2;
    const armorReductionPercent = 0.15;
    const debuffId = 'double_stab_armor_reduction';
    const debuffName = 'Armor Reduced';
    const debuffIcon = 'Icons/effects/armor_down.webp'; // Corrected icon path

    // --- VFX ---
    // Caster Animation (Quick pecks)
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        casterElement.classList.add('double-stab-cast-animation'); // Needs CSS
        setTimeout(() => casterElement.classList.remove('double-stab-cast-animation'), 600);
    }

    // Target Element
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);

    // --- Apply First Hit ---
    log(`${caster.name}'s first stab hits ${target.name}!`);
    const firstHitResult = target.applyDamage(baseDamagePerHit, 'physical', caster);
    log(`${target.name} takes ${firstHitResult.damage} physical damage.`);
    if (caster.stats.lifesteal > 0) caster.applyLifesteal(firstHitResult.damage);

    // First Impact VFX
    if (targetElement) {
        const impactVfx1 = document.createElement('div');
        impactVfx1.className = 'double-stab-impact-vfx'; // Needs CSS
        targetElement.appendChild(impactVfx1);
        setTimeout(() => impactVfx1.remove(), 500);
    }
    if (typeof updateCharacterUI === 'function') updateCharacterUI(target);

    // Short delay between hits
    await new Promise(resolve => setTimeout(resolve, 200));

    // --- Apply Second Hit (if target still alive) ---
    if (!target.isDead()) {
        log(`${caster.name}'s second stab hits ${target.name}!`);
        const secondHitResult = target.applyDamage(baseDamagePerHit, 'physical', caster);
        log(`${target.name} takes ${secondHitResult.damage} physical damage.`);
        if (caster.stats.lifesteal > 0) caster.applyLifesteal(secondHitResult.damage);

        // Second Impact VFX
        if (targetElement) {
            const impactVfx2 = document.createElement('div');
            impactVfx2.className = 'double-stab-impact-vfx emphasis'; // Add class for variation
            targetElement.appendChild(impactVfx2);
            setTimeout(() => impactVfx2.remove(), 500);
        }
        if (typeof updateCharacterUI === 'function') updateCharacterUI(target);

        // --- Apply Debuff ---
        const armorReductionDebuff = new Effect(
            debuffId,
            debuffName,
            debuffIcon,
            debuffDuration,
            null, // No per-turn effect function needed
            true // isDebuff = true
        ).setDescription(`Reduces Armor by ${armorReductionPercent * 100}% for ${debuffDuration} turns.`);

        // Add the stat modifier
        armorReductionDebuff.statModifiers = {
            armor: -armorReductionPercent // Negative value for reduction percentage
        };
        // Specify modifier type as percentage
        armorReductionDebuff.modifierType = 'percentage'; 

        target.addDebuff(armorReductionDebuff);
        log(`${target.name}'s armor is reduced!`);

        // Debuff apply VFX
        if (targetElement) {
            const debuffVfx = document.createElement('div');
            debuffVfx.className = 'armor-down-vfx'; // Needs CSS
            targetElement.appendChild(debuffVfx);
            setTimeout(() => debuffVfx.remove(), 800);
        }

        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target); // Update UI again after debuff
        }
    } else {
        log(`${target.name} was defeated before the second stab or debuff could be applied.`);
    }

    // Update caster UI if lifesteal occurred
    if (caster.stats.lifesteal > 0 && typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
};

// --- Ability Definition ---
const doubleStabAbility = new Ability(
    'angry_chicken_double_stab',
    'Double Stab',
    'Icons/abilities/double_stab.webp', // Corrected icon path
    20, // Mana cost
    1,  // Cooldown
    doubleStabEffect // The async function implementing the logic
).setDescription("Deals 500 physical damage twice, reducing the target's armor by 15% for 2 turns.")
 .setTargetType('enemy');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([doubleStabAbility]);
    console.log("[AbilityFactory] Registered Angry Chicken abilities.");
} else {
    console.warn("Angry Chicken abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.angry_chicken_double_stab = doubleStabAbility;
} 