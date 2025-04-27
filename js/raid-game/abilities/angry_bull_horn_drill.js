// Angry Bull - Horn Drill Ability

// Assume Ability, Effect, Character classes and necessary game manager access are available

const hornDrillEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect; // Assuming Effect class is globally available

    if (!target || target.isDead()) {
        log(`${caster.name} tries Horn Drill, but the target is invalid or defeated.`);
        return;
    }
    if (!Effect) {
        log("Horn Drill Error: Cannot access Effect class!", "error");
        return;
    }

    log(`${caster.name} uses Horn Drill on ${target.name}!`);
    playSound('sounds/horn_drill.mp3', 0.9); // Play the sound

    // --- Damage Calculation ---
    const baseDamage = 400;

    // --- Debuff Details ---
    const disableDuration = 1;
    const debuffId = 'horn_drill_ability_disable';
    const debuffName = 'Ability Disabled (Horn Drill)'; // More specific name
    const debuffIcon = 'Icons/effects/ability_disabled.webp'; // Corrected icon path

    // --- Apply Damage ---
    const damageResult = target.applyDamage(baseDamage, 'physical', caster);
    log(`${target.name} takes ${damageResult.damage} physical damage from Horn Drill.`);
    if (caster.stats.lifesteal > 0) caster.applyLifesteal(damageResult.damage);

    // --- Apply Ability Disable Debuff (Adapted from Elphelt) ---
    const targetAbilities = target.abilities || [];
    // Find abilities that are not passive and not currently disabled by *this specific* debuff type
    // We check ability.isDisabled because another source might have disabled it
    const usableAbilities = targetAbilities.filter((ability, index) =>
        ability && !ability.passive && !ability.isDisabled 
    );

    if (usableAbilities.length > 0) {
        const randomIndex = Math.floor(Math.random() * usableAbilities.length);
        const abilityToDisable = usableAbilities[randomIndex];
        const abilityIndexToDisable = targetAbilities.indexOf(abilityToDisable);

        log(`${target.name}'s ${abilityToDisable.name} is disabled by Horn Drill!`);

        // Create the disable debuff
        const disableDebuff = new Effect(
            `${debuffId}_${abilityToDisable.id}`, // Unique ID per ability instance
            `${debuffName}: ${abilityToDisable.name}`, // Display which ability is disabled
            debuffIcon,
            disableDuration,
            null, // No per-turn effect needed for the debuff itself
            true // isDebuff = true
        ).setDescription(`Cannot use ${abilityToDisable.name} for ${disableDuration} turn.`);

        // Store which ability index was disabled
        disableDebuff.disabledAbilityIndex = abilityIndexToDisable; 
        disableDebuff.disabledAbilityId = abilityToDisable.id; // Also store ID for safety

        // --- Apply the disable effect directly to the ability object --- 
        // The debuff acts as a tracker and timed remover
        abilityToDisable.isDisabled = true;
        abilityToDisable.disabledDuration = disableDuration; // Set initial duration
        // --- End Apply --- 

        // Define the remove function for the debuff
        disableDebuff.remove = function(character) {
            // Find the specific ability that was disabled by *this* debuff instance
            const originallyDisabledAbility = character.abilities.find(a => a.id === this.disabledAbilityId);
            if (originallyDisabledAbility) {
                // Only re-enable if the ability's disable duration has run out
                if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                     originallyDisabledAbility.isDisabled = false;
                     log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Horn Drill.`);
                     // Update UI to reflect the change immediately
                     if (window.gameManager && window.gameManager.uiManager) {
                         window.gameManager.uiManager.updateCharacterUI(character);
                     }
                }
            } else {
                log(`Horn Drill Debuff Remove: Could not find ability ${this.disabledAbilityId} on ${character.name} to potentially re-enable.`);
            }
        };

        // Apply the debuff to the target (cloned for uniqueness)
        target.addDebuff(disableDebuff.clone());

        // VFX for Debuff Apply
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (targetElement) {
            const debuffVfx = document.createElement('div');
            debuffVfx.className = 'ability-disable-vfx'; // Use the existing class name
            targetElement.appendChild(debuffVfx);
            setTimeout(() => debuffVfx.remove(), 800);
        }

    } else {
        log(`${target.name} has no usable non-passive abilities to disable.`);
    }

    // --- VFX ---
    // Caster Animation (Charge/Drill)
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        casterElement.classList.add('horn-drill-cast-animation'); // Needs CSS
        setTimeout(() => casterElement.classList.remove('horn-drill-cast-animation'), 700);
    }

    // Target Impact VFX
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const impactVfx = document.createElement('div');
        impactVfx.className = 'horn-drill-impact-vfx'; // Needs CSS
        targetElement.appendChild(impactVfx);
        setTimeout(() => impactVfx.remove(), 600);
    }

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target); // Update after damage and potential debuff
        if (caster.stats.lifesteal > 0) {
            updateCharacterUI(caster);
        }
    }
};

// --- Ability Definition ---
const hornDrillAbility = new Ability(
    'angry_bull_horn_drill',
    'Horn Drill',
    'Icons/abilities/horn_drill.webp', // Corrected icon path
    20, // Mana cost
    1,  // Cooldown
    hornDrillEffect // The function implementing the logic
).setDescription('Deals 400 physical damage and disables a random ability of the target for 1 turn.')
 .setTargetType('enemy');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([hornDrillAbility]);
    console.log("[AbilityFactory] Registered Angry Bull abilities.");
} else {
    console.warn("Angry Bull abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.angry_bull_horn_drill = hornDrillAbility;
} 