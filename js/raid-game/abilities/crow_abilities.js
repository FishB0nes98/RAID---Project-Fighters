// Ability definition for Crow: Crow Peck

// Crow Peck ability implementation
const crowPeckEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to peck, but the target is invalid or defeated.`);
        return;
    }
    
    log(`${caster.name} pecks at ${target.name}!`);
    
    // Play sound effect if available
    playSound('sounds/crow_peck.mp3', 0.6);
    
    // --- Damage Calculation ---
    const fixedDamage = 555; // Fixed damage amount - NERFED from 1400
    
    // Deal fixed damage that ignores armor
    const options = {
        ignoreArmor: true, // This makes the attack ignore armor
        ignoreShield: false // Still affected by magical shield
    };
    
    // Apply damage
    const damageDealt = target.applyDamage(fixedDamage, 'physical', caster, options);
    
    // Show attack visual effect
    showCrowPeckVFX(caster, target, damageDealt);
    
    if (damageDealt > 0) {
        log(`${target.name} takes ${damageDealt} armor-piercing damage from the peck!`);
    } else {
        log(`${target.name} resists the crow's peck!`);
    }
    
    return {
        damageDealt: damageDealt
    };
};

// Visual effect for crow peck
function showCrowPeckVFX(caster, target, damage) {
    if (!caster || !target || !caster.instanceId || !target.instanceId) return;
    
    // Find the caster and target elements
    const casterElement = document.querySelector(`.character-slot[data-instance-id="${caster.instanceId}"]`);
    const targetElement = document.querySelector(`.character-slot[data-instance-id="${target.instanceId}"]`);
    
    if (!casterElement || !targetElement) return;
    
    // Calculate positions for the VFX
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Create the peck VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'crow-peck-container';
    document.body.appendChild(vfxContainer);
    
    // Position the container
    vfxContainer.style.position = 'absolute';
    vfxContainer.style.left = `${targetRect.left + targetRect.width/2}px`;
    vfxContainer.style.top = `${targetRect.top + targetRect.height/2}px`;
    vfxContainer.style.zIndex = '1000';
    
    // Create the peck VFX
    const vfxElement = document.createElement('div');
    vfxElement.className = 'crow-peck-vfx';
    vfxContainer.appendChild(vfxElement);
    
    // Create the slash lines
    for (let i = 0; i < 3; i++) {
        const slash = document.createElement('div');
        slash.className = 'crow-peck-slash';
        slash.style.setProperty('--rotation', `${-15 + i * 15}deg`);
        slash.style.setProperty('--delay', `${i * 0.1}s`);
        vfxElement.appendChild(slash);
    }
    
    // Create the damage number
    if (damage > 0) {
        const damageElement = document.createElement('div');
        damageElement.className = 'crow-peck-damage';
        damageElement.textContent = damage;
        vfxContainer.appendChild(damageElement);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (document.body.contains(vfxContainer)) {
            document.body.removeChild(vfxContainer);
        }
    }, 1500);
}

// Register the ability with the game
if (typeof window !== 'undefined') {
    if (!window.gameAbilities) {
        window.gameAbilities = {};
    }
    
    // Register crow peck ability
    window.gameAbilities.crow_peck = {
        name: "Crow Peck",
        description: "Deals 1000 damage to the target, ignoring armor.",
        icon: "Icons/abilities/crow_peck.png",
        effect: crowPeckEffect,
        manaCost: 0,
        cooldown: 0,
        targetType: "enemy"
    };
} 