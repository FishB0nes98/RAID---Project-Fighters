// Ability definition for Target Dummy

// Do Nothing effect implementation
const doNothingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    log(`${caster.name} does absolutely nothing... menacingly.`, 'info');
    // Return true to indicate the ability was 'used' successfully
    return true; 
};

// Create the Ability object (optional if only using custom effect, but good practice)
const doNothingAbility = new Ability(
    'do_nothing',
    'Do Nothing',
    'images/icons/ability_placeholder.png', 
    0, // Mana cost
    1, // Cooldown
    doNothingEffect // Reference the effect function
).setDescription('The dummy sits there menacingly.')
 .setTargetType('self');

// Register the ability and its custom effect
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Target Dummy] Registering abilities and effects");
    if (typeof AbilityFactory !== 'undefined') {
        // Register the custom effect function
        if (typeof AbilityFactory.registerAbilityEffect === 'function') {
            AbilityFactory.registerAbilityEffect('doNothingEffect', doNothingEffect);
        } else {
            console.warn("AbilityFactory.registerAbilityEffect method missing.");
        }
        
        // Register the ability definition (optional if loaded from JSON, but ensures consistency)
        if (typeof AbilityFactory.registerAbilities === 'function') {
             AbilityFactory.registerAbilities([doNothingAbility]);
        } else {
             console.warn("AbilityFactory.registerAbilities method missing.");
        }
    } else {
        console.warn("Target Dummy abilities defined but AbilityFactory not found.");
        // Fallback registration if needed
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.do_nothing = doNothingAbility;
        window.definedAbilityEffects = window.definedAbilityEffects || {};
        window.definedAbilityEffects.doNothingEffect = doNothingEffect;
    }
}); 