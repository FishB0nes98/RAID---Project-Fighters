// Ability effects for Hound

const biteEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Fixed damage for Bite ability
    const damage = 350;
    
    // Apply damage to target
    const damageResult = target.applyDamage(damage, 'physical', caster);
    const actualDamage = damageResult.amount;
    
    // Show bite VFX
    showBiteVFX(caster, target, actualDamage, damageResult.isCritical);
    
    // Apply bleeding debuff via passive
    if (window.HoundPassive) {
        const passiveHandler = new window.HoundPassive();
        passiveHandler.applyBleedingStack(caster, target);
    }
    
    // Play sound effect
    playSound('sounds/hound_bite.mp3');
    
    return {
        success: true,
        damage: actualDamage
    };
};

const rushRunEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Create dodge buff - Adjusted structure to match recalculateStats expectation
    const dodgeBuff = {
        id: 'rush_run_dodge',
        name: 'Rush Run',
        icon: 'Icons/abilities/rush_run.webp',
        duration: 3, // Lasts for 3 turns
        statModifiers: { // Modifiers are now directly on the buff object
            dodgeChance: 0.5 // Add 0.5 directly to dodgeChance
        },
        // Note: The 'effect' object with type/stat/value/operation is removed 
        // as recalculateStats uses the statModifiers structure.
        description: 'Increases dodge chance by 50% for 3 turns.'
    };
    
    // Apply buff to caster
    caster.addBuff(dodgeBuff);
    
    // Show Rush Run VFX
    showRushRunVFX(caster);
    
    // Play sound effect
    playSound('sounds/hound_rush.mp3');
    
    // Log the ability use
    log(`${caster.name} uses Rush Run and gains 50% dodge chance for 3 turns!`, 'buff');
    
    return {
        success: true
    };
};

const bloodthirstEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Create lifesteal buff using the structure expected by recalculateStats
    const lifestealBuff = {
        id: 'bloodthirst_buff',
        name: 'Bloodthirst',
        icon: 'Icons/abilities/bloodthirst.webp',
        duration: 5, // Lasts for 5 turns
        statModifiers: {
            lifesteal: 1.0 // 100% lifesteal
        },
        description: 'Increases lifesteal by 100% for 5 turns.'
    };
    
    // Apply buff to caster
    caster.addBuff(lifestealBuff);
    
    // Show Bloodthirst VFX
    showBloodthirstVFX(caster);
    
    // Play sound effect
    playSound('sounds/hound_bloodthirst.mp3');
    
    // Log the ability use
    log(`${caster.name} activates Bloodthirst and gains 100% lifesteal for 5 turns!`, 'buff');
    
    return {
        success: true
    };
};

// Function to show VFX for Bite ability
function showBiteVFX(caster, target, damage, isCritical) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create the bite VFX container
    const biteVfx = document.createElement('div');
    biteVfx.className = 'bite-vfx';
    targetElement.appendChild(biteVfx);
    
    // Create bite chomp effect
    const biteEffect = document.createElement('div');
    biteEffect.className = 'bite-chomp-effect';
    biteVfx.appendChild(biteEffect);
    
    // Create blood splatters
    for (let i = 0; i < 5; i++) {
        const bloodSplatter = document.createElement('div');
        bloodSplatter.className = 'blood-splatter';
        bloodSplatter.style.left = `${Math.random() * 80 + 10}%`;
        bloodSplatter.style.top = `${Math.random() * 80 + 10}%`;
        bloodSplatter.style.animationDelay = `${Math.random() * 0.3}s`;
        biteVfx.appendChild(bloodSplatter);
    }
    
    // Create damage number
    const damageNumber = document.createElement('div');
    damageNumber.className = isCritical ? 'damage-number critical' : 'damage-number';
    damageNumber.textContent = isCritical ? `${damage} CRITICAL!` : damage;
    biteVfx.appendChild(damageNumber);
    
    // Create bleeding indicator if the passive exists
    if (window.HoundPassive) {
        const bleedIndicator = document.createElement('div');
        bleedIndicator.className = 'bleed-indicator';
        bleedIndicator.textContent = '+BLEED';
        biteVfx.appendChild(bleedIndicator);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        biteVfx.remove();
    }, 2000);
}

// Function to show VFX for Rush Run ability
function showRushRunVFX(character) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;
    
    // Create the rush run VFX container
    const rushVfx = document.createElement('div');
    rushVfx.className = 'rush-run-vfx';
    characterElement.appendChild(rushVfx);
    
    // Create speed lines
    for (let i = 0; i < 12; i++) {
        const speedLine = document.createElement('div');
        speedLine.className = 'speed-line';
        speedLine.style.top = `${Math.random() * 90 + 5}%`;
        speedLine.style.left = `${Math.random() * 20 + 5}%`;
        speedLine.style.width = `${Math.random() * 30 + 20}%`;
        speedLine.style.animationDelay = `${Math.random() * 0.5}s`;
        rushVfx.appendChild(speedLine);
    }
    
    // Create buff indicator
    const buffIndicator = document.createElement('div');
    buffIndicator.className = 'rush-buff-indicator';
    buffIndicator.textContent = '+50% DODGE';
    rushVfx.appendChild(buffIndicator);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        rushVfx.remove();
    }, 2500);
}

// Function to show VFX for Bloodthirst ability
function showBloodthirstVFX(character) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!characterElement) return;
    
    // Create the bloodthirst VFX container
    const bloodthirstVfx = document.createElement('div');
    bloodthirstVfx.className = 'bloodthirst-vfx';
    characterElement.appendChild(bloodthirstVfx);
    
    // Create blood aura effect
    const auraEffect = document.createElement('div');
    auraEffect.className = 'bloodthirst-aura';
    bloodthirstVfx.appendChild(auraEffect);
    
    // Create blood drops that float upward
    for (let i = 0; i < 15; i++) {
        const bloodDrop = document.createElement('div');
        bloodDrop.className = 'bloodthirst-drop';
        bloodDrop.style.left = `${Math.random() * 80 + 10}%`;
        bloodDrop.style.bottom = `${Math.random() * 30}%`;
        bloodDrop.style.animationDelay = `${Math.random() * 0.8}s`;
        bloodDrop.style.width = `${Math.random() * 6 + 3}px`;
        bloodDrop.style.height = `${Math.random() * 10 + 5}px`;
        bloodthirstVfx.appendChild(bloodDrop);
    }
    
    // Create buff indicator
    const buffIndicator = document.createElement('div');
    buffIndicator.className = 'bloodthirst-buff-indicator';
    buffIndicator.textContent = '+100% LIFESTEAL';
    bloodthirstVfx.appendChild(buffIndicator);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        bloodthirstVfx.remove();
    }, 3000);
}

// Register the custom effect functions with the AbilityFactory
if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
    window.AbilityFactory.registerAbilityEffect('biteEffect', biteEffect);
    window.AbilityFactory.registerAbilityEffect('rushRunEffect', rushRunEffect);
    window.AbilityFactory.registerAbilityEffect('bloodthirstEffect', bloodthirstEffect);
    console.log("Hound ability effects registered with AbilityFactory.");
} else {
    console.error("ERROR: AbilityFactory or registerAbilityEffect not available for Hound abilities registration.");
} 