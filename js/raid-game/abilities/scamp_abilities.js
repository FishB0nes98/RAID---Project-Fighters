// Scamp Abilities - Little Devil Theme

// Scamp Q Ability: Sack of Blood
const sackOfBloodEffect = (caster, target) => {
    if (!target || target.isDead() || target === caster) {
        return { success: false };
    }

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Play healing sound
    playSound('sounds/heal.mp3', 0.7);

    // Heal amount - fixed at 666 HP for allies only
    const healAmount = 666;

    // Apply healing
    const healResult = target.heal(healAmount, caster);

    // Show VFX
    showSackOfBloodVFX(target, healAmount);

    // Log the result
    log(`🩸 ${caster.name} offers a bloody sacrifice to heal ${target.name} for ${healAmount} HP!`, 'sack-of-blood');

    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }

    return { 
        success: true, 
        healAmount: healResult.actualHealAmount
    };
};

// VFX function for Sack of Blood
function showSackOfBloodVFX(character, healAmount) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    // Create main healing effect
    const bloodEffect = document.createElement('div');
    bloodEffect.className = 'scamp-blood-ally-effect';
    characterElement.appendChild(bloodEffect);

    // Create floating blood symbols for ally healing
    const symbols = ['🩸', '💖', '✨', '🌟', '💚'];
    symbols.forEach((symbol, index) => {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'scamp-blood-symbol';
        symbolElement.textContent = symbol;
        symbolElement.style.animationDelay = `${index * 0.12}s`;
        bloodEffect.appendChild(symbolElement);
    });

    // Create healing text
    const healText = document.createElement('div');
    healText.className = 'scamp-blood-text';
    healText.textContent = 'BLOODY OFFERING!';
    bloodEffect.appendChild(healText);

    // Create heal amount display
    const amountText = document.createElement('div');
    amountText.className = 'scamp-heal-amount';
    amountText.textContent = `+${healAmount} HP`;
    bloodEffect.appendChild(amountText);

    // Remove VFX after animation
    setTimeout(() => {
        if (bloodEffect.parentNode) {
            bloodEffect.remove();
        }
    }, 2500);
}

// Scamp W Ability: Succubus's Infernal Pact
const scampInfernalPactEffect = (caster, target) => {
    if (!target || target.isDead() || target === caster) {
        return { success: false };
    }

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const updateCharacterUI = window.gameManager && window.gameManager.uiManager ? window.gameManager.uiManager.updateCharacterUI.bind(window.gameManager.uiManager) : () => {};
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Play demonic empowerment sound
    playSound('sounds/buff_applied.mp3', 0.8);

    // Create the powerful buff that doubles ALL stats
    const infernalPactBuff = new Effect(
        'scamp_infernal_pact_buff',
        'Succubus\'s Infernal Pact',
        'Icons/abilities/scamp_infernal_pact.png',
        3, // Duration: 3 turns
        null, // No per-turn effect
        false // Not a debuff
    ).setDescription('Combat stats are doubled by demonic power! Physical Damage, Magical Damage, Armor, Magic Shield, Lifesteal, Dodge Chance, Critical Chance, Critical Damage, and Healing Power are all doubled for 3 turns.');

    // Add stat modifiers that double combat stats (excluding HP and Mana)
    infernalPactBuff.statModifiers = [
        { stat: 'physicalDamage', value: 1.0, operation: 'add_base_percentage' },    // +100% = double
        { stat: 'magicalDamage', value: 1.0, operation: 'add_base_percentage' },     // +100% = double
        { stat: 'armor', value: 1.0, operation: 'add_base_percentage' },             // +100% = double
        { stat: 'magicalShield', value: 1.0, operation: 'add_base_percentage' },     // +100% = double
        { stat: 'lifesteal', value: 1.0, operation: 'add_base_percentage' },         // +100% = double
        { stat: 'dodgeChance', value: 1.0, operation: 'add_base_percentage' },       // +100% = double
        { stat: 'critChance', value: 1.0, operation: 'add_base_percentage' },        // +100% = double
        { stat: 'critDamage', value: 1.0, operation: 'add_base_percentage' },        // +100% = double
        { stat: 'healingPower', value: 1.0, operation: 'add_base_percentage' },      // +100% = double
        { stat: 'hpPerTurn', value: 1.0, operation: 'add_base_percentage' },         // +100% = double
        { stat: 'manaPerTurn', value: 1.0, operation: 'add_base_percentage' }        // +100% = double
    ];

    // Custom onApply function for dramatic effects
    infernalPactBuff.onApply = (character) => {
        // Show dramatic VFX
        showInfernalPactVFX(character);
        
        log(`🔥 ${character.name} is empowered by the Succubus's Infernal Pact - COMBAT STATS DOUBLED!`, 'infernal-pact');
        return true;
    };

    // Custom onRemove function
    infernalPactBuff.onRemove = (character) => {
        log(`${character.name}'s Infernal Pact expires, returning to normal power.`, 'system');
        return true;
    };

    // Apply the buff to the target
    const success = target.addBuff(infernalPactBuff.clone());
    
    if (success) {
        log(`💀 ${caster.name} forms an infernal pact with ${target.name}!`, 'infernal-pact');
        updateCharacterUI(target);
        return { success: true };
    } else {
        log(`${target.name} resists the infernal pact.`, 'system');
        return { success: false };
    }
};

// VFX function for Infernal Pact
function showInfernalPactVFX(character) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    // Create main infernal energy effect
    const infernalEffect = document.createElement('div');
    infernalEffect.className = 'scamp-infernal-pact-effect';
    characterElement.appendChild(infernalEffect);

    // Create floating demonic symbols
    const symbols = ['👹', '🔥', '⚡', '💀', '😈'];
    symbols.forEach((symbol, index) => {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'scamp-infernal-symbol';
        symbolElement.textContent = symbol;
        symbolElement.style.animationDelay = `${index * 0.2}s`;
        infernalEffect.appendChild(symbolElement);
    });

    // Create empowerment text
    const empowerText = document.createElement('div');
    empowerText.className = 'scamp-infernal-text';
    empowerText.textContent = 'INFERNAL PACT!';
    infernalEffect.appendChild(empowerText);

    // Create stat doubling indicators
    const statsText = document.createElement('div');
    statsText.className = 'scamp-stats-doubled';
    statsText.textContent = 'COMBAT STATS x2!';
    infernalEffect.appendChild(statsText);

    // Remove VFX after animation
    setTimeout(() => {
        if (infernalEffect.parentNode) {
            infernalEffect.remove();
        }
    }, 3000);
}

// Scamp E Ability: Demonic Powder
const demonicPowderEffect = (caster, target) => {
    if (!target || target.isDead() || target === caster) {
        return { success: false };
    }

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const updateCharacterUI = window.gameManager ? window.gameManager.uiManager.updateCharacterUI.bind(window.gameManager) : () => {};
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Play mystical powder sound
    playSound('sounds/buff_applied.mp3', 0.6);

    // Count abilities that are on cooldown
    let abilitiesOnCooldown = 0;
    let reducedAbilities = [];

    // Reduce all active cooldowns by 1
    target.abilities.forEach((ability, index) => {
        if (ability.currentCooldown > 0) {
            abilitiesOnCooldown++;
            const oldCooldown = ability.currentCooldown;
            ability.currentCooldown = Math.max(0, ability.currentCooldown - 1);
            reducedAbilities.push({
                name: ability.name,
                oldCooldown: oldCooldown,
                newCooldown: ability.currentCooldown
            });
        }
    });

    // Show demonic powder VFX
    showDemonicPowderVFX(target, abilitiesOnCooldown);

    // Log the result
    if (abilitiesOnCooldown > 0) {
        log(`✨ ${caster.name} sprinkles demonic powder on ${target.name}, reducing ${abilitiesOnCooldown} ability cooldown${abilitiesOnCooldown > 1 ? 's' : ''} by 1 turn!`, 'demonic-powder');
        
        // Log individual ability cooldown reductions
        reducedAbilities.forEach(ability => {
            if (ability.newCooldown === 0) {
                log(`🔥 ${target.name}'s ${ability.name} is now ready to use!`, 'demonic-powder');
            } else {
                log(`⏱️ ${target.name}'s ${ability.name} cooldown: ${ability.oldCooldown} → ${ability.newCooldown} turns`, 'system');
            }
        });
    } else {
        log(`✨ ${caster.name} sprinkles demonic powder on ${target.name}, but all abilities are already ready!`, 'demonic-powder');
    }

    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
    
    return { 
        success: true, 
        abilitiesAffected: abilitiesOnCooldown,
        reducedAbilities: reducedAbilities
    };
};

// VFX function for Demonic Powder
function showDemonicPowderVFX(character, abilitiesAffected) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;

    // Create main demonic powder effect
    const powderEffect = document.createElement('div');
    powderEffect.className = 'scamp-demonic-powder-effect';
    characterElement.appendChild(powderEffect);

    // Create floating magical symbols
    const symbols = ['✨', '🔮', '⚡', '💫', '🌟'];
    symbols.forEach((symbol, index) => {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'scamp-powder-symbol';
        symbolElement.textContent = symbol;
        symbolElement.style.animationDelay = `${index * 0.15}s`;
        powderEffect.appendChild(symbolElement);
    });

    // Create empowerment text
    const powderText = document.createElement('div');
    powderText.className = 'scamp-powder-text';
    powderText.textContent = 'DEMONIC POWDER!';
    powderEffect.appendChild(powderText);

    // Create cooldown reduction indicators
    if (abilitiesAffected > 0) {
        const reductionText = document.createElement('div');
        reductionText.className = 'scamp-cooldown-reduction';
        reductionText.textContent = `${abilitiesAffected} Cooldown${abilitiesAffected > 1 ? 's' : ''} -1!`;
        powderEffect.appendChild(reductionText);
    }

    // Remove VFX after animation
    setTimeout(() => {
        if (powderEffect.parentNode) {
            powderEffect.remove();
        }
    }, 3000);
}

// Create the Infernal Pact ability object
const scampInfernalPactAbility = new Ability(
    'scamp_infernal_pact',
    'Succubus\'s Infernal Pact',
    'Icons/abilities/scamp_infernal_pact.png',
    150, // High mana cost for such a powerful effect
    7,   // 7 turn cooldown
    scampInfernalPactEffect
).setDescription('Forms an infernal pact with an ally, doubling their combat stats (Physical Damage, Magical Damage, Armor, Magic Shield, Lifesteal, Dodge Chance, Critical Chance, Critical Damage, and Healing Power) for 3 turns. The little devil\'s greatest offering to his demonic mistress\'s allies.')
 .setTargetType('ally');

// Create the Sack of Blood ability object
const sackOfBloodAbility = new Ability(
    'sack_of_blood',
    'Sack of Blood',
    'Icons/abilities/scamp_sack_of_blood.png',
    66,  // Mana cost
    3,   // 3 turn cooldown
    sackOfBloodEffect
).setDescription('Offers a bloody sacrifice to heal an ally for 666 HP.')
 .setTargetType('ally');

// Create the Demonic Powder ability object
const demonicPowderAbility = new Ability(
    'demonic_powder',
    'Demonic Powder',
    'Icons/abilities/scamp_demonic_powder.png',
    85,  // Mana cost
    6,   // 6 turn cooldown
    demonicPowderEffect
).setDescription('Sprinkles mystical demonic powder on an ally, reducing ALL of their active ability cooldowns by 1 turn. The little devil\'s mischievous way of helping allies act faster.')
 .setTargetType('ally');

// Register the abilities
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([sackOfBloodAbility, scampInfernalPactAbility, demonicPowderAbility]);
        console.log("Scamp - All abilities (Sack of Blood, Succubus's Infernal Pact, and Demonic Powder) registered.");
    } else {
        console.warn("Scamp abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.sack_of_blood = sackOfBloodAbility;
        window.definedAbilities.scamp_infernal_pact = scampInfernalPactAbility;
        window.definedAbilities.demonic_powder = demonicPowderAbility;
    }
}); 