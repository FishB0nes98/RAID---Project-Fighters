// Angry Pig - Pitchfork Pierce Ability

// Assume Ability, Effect, Character classes and necessary game manager access are available

const pitchforkPierceEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name} tries Pitchfork Pierce, but the target is invalid or defeated.`);
        return;
    }

    log(`${caster.name} uses Pitchfork Pierce on ${target.name}!`);
    playSound('sounds/pitchfork_pierce.mp3', 0.8); // Play the sound

    // --- Damage Calculation ---
    const baseDamage = 600;

    // --- Apply Damage ---
    const damageResult = target.applyDamage(baseDamage, 'physical', caster);
    log(`${target.name} takes ${damageResult.damage} physical damage from Pitchfork Pierce.`);

    // Trigger caster's lifesteal if applicable (unlikely for this char)
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(damageResult.damage);
    }

    // --- VFX ---
    // Caster Animation (Simple lunge)
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        casterElement.classList.add('pitchfork-cast-animation'); // Needs CSS
        setTimeout(() => casterElement.classList.remove('pitchfork-cast-animation'), 500);
    }

    // Target Impact VFX (Stab effect)
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const impactVfx = document.createElement('div');
        impactVfx.className = 'pitchfork-impact-vfx'; // Needs CSS
        targetElement.appendChild(impactVfx);
        setTimeout(() => impactVfx.remove(), 600);
    }

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        if (caster.stats.lifesteal > 0) {
            updateCharacterUI(caster);
        }
    }
};

// --- Ability Definition ---
const pitchforkPierceAbility = new Ability(
    'angry_pig_pitchfork_pierce',
    'Pitchfork Pierce',
    'Icons/abilities/pitchfork_pierce.webp', // Corrected icon path
    20, // Mana cost
    1,  // Cooldown
    pitchforkPierceEffect // The function implementing the logic
).setDescription('Deals 600 physical damage to the target.')
 .setTargetType('enemy');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([pitchforkPierceAbility]);
    console.log("[AbilityFactory] Registered Angry Pig abilities.");
} else {
    console.warn("Angry Pig abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.angry_pig_pitchfork_pierce = pitchforkPierceAbility;
} 