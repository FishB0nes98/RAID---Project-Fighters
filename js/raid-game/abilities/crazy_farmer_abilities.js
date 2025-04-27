// Ability effects for Crazy Farmer

const farmerReapEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Calculate base damage
    const baseDamage = 500;
    const physicalDamageModifier = caster.stats.physicalDamage * 0.5;
    let totalDamage = baseDamage + physicalDamageModifier;
    
    // Apply damage to target
    const damageResult = target.applyDamage(totalDamage, 'physical', caster);
    const actualDamageDealt = damageResult.damage;
    
    // Create damage VFX
    showReapVFX(caster, target, actualDamageDealt, damageResult.isCritical);
    
    // Apply armor reduction debuff - 5% flat reduction
    const armorReductionDebuff = new Effect(
        'armor_reduction_reap',
        'Armor Weakened',
        'Icons/effects/armor_reduction.png',
        3,
        null,
        true
    ).setDescription('Armor reduced by 5%.');

    armorReductionDebuff.statModifiers = { armor_percent: -5 };

    target.addDebuff(armorReductionDebuff);
    log(`${target.name}'s armor has been weakened by ${caster.name}'s Farmer Reap!`, 'debuff');
    
    // Play sound effect
    playSound('sounds/reap_slash.mp3');
    
    // Get allies for healing via passive
    const allies = window.gameManager ? window.gameManager.getAllies(caster) : [];
    if (allies.length > 0 && typeof window.CrazyFarmerPassive !== 'undefined') {
        if (caster.passiveHandler && typeof caster.passiveHandler.onDamageDealt === 'function') {
            caster.passiveHandler.onDamageDealt(caster, allies, actualDamageDealt);
        } else {
            console.warn(`CrazyFarmerPassive handler or onDamageDealt method not found for ${caster.name}`);
        }
    }
    
    return {
        success: true,
        damage: actualDamageDealt
    };
};

// Drink Alcohol ability effect
const drinkAlcoholEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Heal amount
    const healAmount = 3000;
    
    // Apply healing to caster (self)
    const actualHealing = caster.heal(healAmount);
    
    // Create healing VFX
    showDrinkAlcoholVFX(caster, actualHealing);
    
    // Apply the armor and magic shield reduction debuff
    const alcoholDebuff = new Effect(
        'alcohol_debuff',
        'Drunk',
        'Icons/abilities/drink_alcohol.webp',
        5,
        null,
        true
    ).setDescription('Armor and Magic Shield reduced to 0.');

    // Custom onApply method to set stats immediately
    alcoholDebuff.onApply = function(character) {
        // Store original BASE values before modifying STATS
        // We need to store the base values so recalculateStats doesn't undo our change
        // We might need a more robust way to handle temporary forced stat changes later
        this.originalBaseArmor = character.baseStats.armor;
        this.originalBaseMagicShield = character.baseStats.magicalShield;
        
        // Set BASE stats to 0 temporarily - recalculateStats will use these
        character.baseStats.armor = 0;
        character.baseStats.magicalShield = 0;
        
        log(`${character.name} is drunk! Armor and Magic Shield reduced to 0.`, 'debuff');
        // recalculateStats will be called by addDebuff after this
    };
    
    // Custom remove method to restore original BASE values when the effect expires
    alcoholDebuff.remove = function(character) {
        // Restore original BASE values
        if (this.originalBaseArmor !== undefined) {
            character.baseStats.armor = this.originalBaseArmor;
        }
        
        if (this.originalBaseMagicShield !== undefined) {
            character.baseStats.magicalShield = this.originalBaseMagicShield;
        }
        
        log(`${character.name} is no longer drunk. Armor and Magic Shield restored.`, 'system');
        // recalculateStats will be called by removeDebuff after this
    };
    
    // Add the debuff to the caster
    caster.addDebuff(alcoholDebuff);
    
    // Play sound effect
    playSound('sounds/drink_gulp.mp3');
    
    // Log the ability use
    log(`${caster.name} drinks alcohol, healing for ${actualHealing} HP but becomes drunk!`, 'heal');
    
    return {
        success: true,
        healing: actualHealing
    };
};

// Med Pet ability effect
const medPetEffect = (caster, targetOrTargets) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Heal amount
    const healAmount = 1350;
    let finalTarget = null;

    // Check if Hound is present and alive among allies
    const allies = window.gameManager ? window.gameManager.getAllies(caster) : [];
    const houndAlly = allies.find(ally => ally.id === 'hound' && !ally.isDead());

    if (houndAlly) {
        finalTarget = houndAlly;
        log(`${caster.name} prioritizes petting the Hound!`);
    } else {
        // If Hound is not present or dead, use the selected target (must be an ally)
        // Ensure targetOrTargets is a single valid ally
        if (Array.isArray(targetOrTargets)) {
            console.warn('[Med Pet] Received array, expected single ally target. Using first.');
            finalTarget = targetOrTargets[0];
        } else {
            finalTarget = targetOrTargets;
        }

        // Validate the target is an ally and alive
        if (!finalTarget || finalTarget.isAI === caster.isAI || finalTarget.isDead()) {
            log(`${caster.name} tried to Med Pet, but couldn't find a valid ally target.`, 'system');
            return { success: false }; // Indicate failure
        }
    }

    // Apply healing to the final target
    const actualHealing = finalTarget.heal(healAmount);
    
    // Create healing VFX
    showMedPetVFX(caster, finalTarget, actualHealing);
    
    // Play sound effect
    playSound('sounds/med_pet_heal.mp3'); // Make sure this sound exists
    
    // Log the ability use
    log(`${caster.name} uses Med Pet on ${finalTarget.name}, healing for ${actualHealing} HP.`, 'heal');
    
    return {
        success: true,
        healing: actualHealing
    };
};

// Function to show VFX for Farmer Reap ability
function showReapVFX(caster, target, damage, isCritical) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create the reap VFX container
    const reapVfx = document.createElement('div');
    reapVfx.className = 'reap-vfx';
    targetElement.appendChild(reapVfx);
    
    // Create the reap slash effect
    const slashEffect = document.createElement('div');
    slashEffect.className = 'reap-slash-effect';
    reapVfx.appendChild(slashEffect);
    
    // Create damage number
    const damageNumber = document.createElement('div');
    damageNumber.className = isCritical ? 'damage-number critical' : 'damage-number';
    damageNumber.textContent = isCritical ? `${damage} CRITICAL!` : damage;
    reapVfx.appendChild(damageNumber);
    
    // Create armor reduction indicator
    const armorReduction = document.createElement('div');
    armorReduction.className = 'armor-reduction-indicator';
    armorReduction.textContent = '-5% ARMOR';
    reapVfx.appendChild(armorReduction);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        reapVfx.remove();
    }, 2000);
}

// Function to show VFX for Drink Alcohol ability
function showDrinkAlcoholVFX(character, healAmount) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;
    
    // Create the drink alcohol VFX container
    const alcoholVfx = document.createElement('div');
    alcoholVfx.className = 'drink-alcohol-vfx';
    characterElement.appendChild(alcoholVfx);
    
    // Create the bottle element
    const bottle = document.createElement('div');
    bottle.className = 'alcohol-bottle';
    alcoholVfx.appendChild(bottle);
    
    // Create drinking animation elements
    const drinkAction = document.createElement('div');
    drinkAction.className = 'drink-action';
    alcoholVfx.appendChild(drinkAction);
    
    // Create heal number display
    const healNumber = document.createElement('div');
    healNumber.className = 'heal-number';
    healNumber.textContent = `+${healAmount}`;
    alcoholVfx.appendChild(healNumber);
    
    // Create drunk effect indicators
    const drunkEffect = document.createElement('div');
    drunkEffect.className = 'drunk-effect';
    alcoholVfx.appendChild(drunkEffect);
    
    // Create armor/shield reduction indicator
    const reductionIndicator = document.createElement('div');
    reductionIndicator.className = 'stat-reduction-indicator';
    reductionIndicator.textContent = 'ARMOR & SHIELD: 0';
    alcoholVfx.appendChild(reductionIndicator);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        alcoholVfx.remove();
    }, 3000);
}

// Function to show VFX for Med Pet ability
function showMedPetVFX(caster, target, healAmount) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create the Med Pet VFX container
    const medPetVfx = document.createElement('div');
    medPetVfx.className = 'med-pet-vfx';
    targetElement.appendChild(medPetVfx);
    
    // Create the petting hand element
    const pettingHand = document.createElement('div');
    pettingHand.className = 'petting-hand';
    medPetVfx.appendChild(pettingHand);
    
    // Create heart particles
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'healing-heart';
        heart.style.left = `${Math.random() * 60 + 20}%`;
        heart.style.animationDelay = `${Math.random() * 0.5}s`;
        medPetVfx.appendChild(heart);
    }
    
    // Create heal number display
    const healNumber = document.createElement('div');
    healNumber.className = 'heal-number'; // Reuse existing style
    healNumber.textContent = `+${healAmount}`;
    medPetVfx.appendChild(healNumber);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        medPetVfx.remove();
    }, 2000);
}

// Register the custom effect functions with the AbilityFactory
if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
    window.AbilityFactory.registerAbilityEffect('farmerReapEffect', farmerReapEffect);
    window.AbilityFactory.registerAbilityEffect('drinkAlcoholEffect', drinkAlcoholEffect);
    window.AbilityFactory.registerAbilityEffect('medPetEffect', medPetEffect);
    console.log("Crazy Farmer ability effects registered with AbilityFactory.");
} else {
    console.error("ERROR: AbilityFactory or registerAbilityEffect not available for Crazy Farmer abilities registration.");
} 