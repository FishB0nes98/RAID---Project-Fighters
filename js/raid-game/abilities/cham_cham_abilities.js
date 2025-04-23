// Ability definitions for Cham Cham

// Assume Ability, Effect classes and addLogEntry function are available globally or imported
// If not, ensure they are properly included in the execution context.

// --- Helper Functions for Passive ---

function initializeChamChamPassive(caster) {
    if (typeof caster.chamChamPassiveStacks === 'undefined') {
        caster.chamChamPassiveStacks = 0;
        
        // Create passive UI indicator for first time initialization
        const casterElement = document.getElementById(`character-${caster.id}`);
        if (casterElement) {
            const imageContainer = casterElement.querySelector('.image-container');
            if (imageContainer) {
                // Only create if it doesn't already exist
                if (!imageContainer.querySelector('.cham-cham-passive')) {
                    const passiveIndicator = document.createElement('div');
                    passiveIndicator.className = 'cham-cham-passive';
                    passiveIndicator.textContent = '0';
                    passiveIndicator.setAttribute('data-stacks', '0');
                    passiveIndicator.title = 'Passive Stacks: 0 (+0% damage)';
                    imageContainer.appendChild(passiveIndicator);
                }
            }
        }
    }
}

function getChamChamPassiveBonus(caster) {
    initializeChamChamPassive(caster);
    return 1 + (caster.chamChamPassiveStacks * 0.02);
}

function addChamChamPassiveStack(caster) {
    initializeChamChamPassive(caster);
    caster.chamChamPassiveStacks++;
    const bonusPercent = (getChamChamPassiveBonus(caster) - 1) * 100;
    // Use gameManager's log entry if available, otherwise fallback
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    log(`${caster.name}'s passive stacks: ${caster.chamChamPassiveStacks} (+${bonusPercent.toFixed(0)}% damage)`);
    
    // Update UI for passive stacks with modern display
    const casterElement = document.getElementById(`character-${caster.id}`);
    if (casterElement) {
        const imageContainer = casterElement.querySelector('.image-container');
        if (imageContainer) {
            // Check if passive indicator already exists
            let passiveIndicator = imageContainer.querySelector('.cham-cham-passive');
            
            if (!passiveIndicator) {
                // Create new passive indicator if it doesn't exist
                passiveIndicator = document.createElement('div');
                passiveIndicator.className = 'cham-cham-passive';
                imageContainer.appendChild(passiveIndicator);
            }
            
            // Update stack count in the indicator
            passiveIndicator.textContent = caster.chamChamPassiveStacks;
            
            // Set data attribute for CSS styling based on stack count
            passiveIndicator.setAttribute('data-stacks', Math.min(10, caster.chamChamPassiveStacks));
            
            // Add and remove the stack-added class for animation effect
            passiveIndicator.classList.add('stack-added');
            setTimeout(() => {
                passiveIndicator.classList.remove('stack-added');
            }, 500);
            
            // Add tooltip for clarity
            passiveIndicator.title = `Passive Stacks: ${caster.chamChamPassiveStacks} (+${bonusPercent.toFixed(0)}% damage)`;
        }
    }
    
    // Call the general updateCharacterUI function if it exists
    updateCharacterUI(caster);
}

// --- Ability Definitions ---

// Q: Scratch
const chamChamQEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Cham Cham Q: No target selected!", "error");
        return;
    }
    const damageMultiplier = getChamChamPassiveBonus(caster);
    const baseDamage = caster.stats.physicalDamage * 0.50;
    const finalDamage = Math.floor(baseDamage * damageMultiplier);

    log(`${caster.name} uses Scratch on ${target.name}.`);
    const result = target.applyDamage(finalDamage, 'physical');
    log(`${target.name} takes ${result.damage} physical damage.`);
    if (result.isCritical) {
       log("Critical Hit!");
    }

    // --- Scratch VFX Trigger ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container scratch-vfx-container';
        targetElement.appendChild(vfxContainer);

        // Check if imageContainer exists before appending to it
        const imageContainer = targetElement.querySelector('.image-container'); // Re-query within scope
        if (imageContainer) { // Make sure container exists
            const vfxDiv = document.createElement('div');
            vfxDiv.className = 'scratch-vfx';

            // Append VFX to the general vfxContainer, not imageContainer
            vfxContainer.appendChild(vfxDiv);

            // Play scratch sound
            playSound('sounds/scratch.mp3', 0.7); // Example sound

            // Remove VFX element after animation (adjust time based on CSS animation duration)
            setTimeout(() => {
                vfxContainer.remove(); // Remove the container
            }, 400); // Matches the 0.4s animation duration + small buffer
        }
    }
    // --- End VFX Trigger ---

    caster.applyLifesteal(result.damage); // Apply caster's lifesteal if any

    addChamChamPassiveStack(caster);
};

const chamChamQ = new Ability(
    'cham_cham_q',
    'Scratch',
    'Icons/abilities/scratch.webp',
    10, // Mana cost from JSON
    2,  // Cooldown from JSON
    chamChamQEffect
).setDescription('Deals 50% AD physical damage and grants a passive stack.')
 .setTargetType('enemy');

// W: Leap
const chamChamWEffect = (caster, target) => { // Target is unused here, could be null
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Jump Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container leap-vfx-container';
        casterElement.appendChild(vfxContainer);

        // Add jump animation to the character element
        casterElement.classList.add('jump-animation');
        
        // Add shadow effect inside the container
        // const imageContainer = casterElement.querySelector('.image-container');
        // if (imageContainer) {
            const shadowVfx = document.createElement('div');
            shadowVfx.className = 'jump-vfx';
            vfxContainer.appendChild(shadowVfx);
            
            playSound('sounds/jump.mp3', 0.6); // Example sound

            // Remove the animation class and VFX container after it completes
            setTimeout(() => {
                casterElement.classList.remove('jump-animation');
                vfxContainer.remove(); // Remove the container
            }, 800); // Slightly longer than the animation duration
        // }
    }
    // --- End Animation VFX ---

    const lifestealBuff = new Effect(
        'cham_cham_w_buff',
        'Primal Fury',
        'images/icons/buff_cham_cham_w.png', // Placeholder icon
        5, // Duration
        (character) => {
            // This effect function runs each turn the buff is active (optional)
            // We are using statModifiers, so likely no per-turn logic needed here.
        },
        false // isDebuff = false
    ).setDescription('Gains 8% lifesteal for 5 turns.');

    // Add stat modifiers directly to the buff object before applying
    // Assuming the framework automatically applies and removes these based on duration
    lifestealBuff.statModifiers = { lifesteal: 0.08 };

    // Define the remove function to ensure stats are reset if manual cleanup is needed
    // (Though the framework might handle statModifiers automatically)
    lifestealBuff.remove = (character) => {
        // The statModifiers are now handled automatically in the Character.removeBuff method
        log(`${character.name}'s Primal Fury fades.`);
    };

    caster.addBuff(lifestealBuff.clone()); // Clone the effect before adding
    log(`${caster.name} uses Primal Fury, gaining lifesteal!`);
    // updateCharacterUI(caster); // Update UI immediately if needed
};

const chamChamW = new Ability(
    'cham_cham_w',
    'Leap',
    'Icons/abilities/leap.webp',
    15, // Mana cost
    8,  // Cooldown
    chamChamWEffect
).setDescription('Gains 8% lifesteal for 5 turns.')
 .setTargetType('self');


// E: Boomerang
const chamChamEEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Cham Cham E: No target selected!", "error");
        return;
    }

    log(`${caster.name} throws a boomerang at ${target.name}.`);

    // --- Boomerang VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    
    if (casterElement && targetElement) {
        // Create VFX container on caster
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container boomerang-vfx-container';
        casterElement.appendChild(vfxContainer);

        // Check if imageContainer exists if needed, but boomerang can be in main container
        // const casterContainer = casterElement.querySelector('.image-container');

        const targetContainer = targetElement.querySelector('.image-container');

        if (vfxContainer && targetContainer) { // Check vfxContainer instead of casterContainer
            // Create boomerang element
            const boomerangVfx = document.createElement('div');
            boomerangVfx.className = 'boomerang-vfx';

            // Add to the caster's VFX container
            vfxContainer.appendChild(boomerangVfx);

            // Calculate direction for animation (adjust if needed based on layout)
            const isTargetOnRight = targetElement.getBoundingClientRect().left > casterElement.getBoundingClientRect().left;
            if (!isTargetOnRight) {
                // If target is on the left, flip the animation
                boomerangVfx.style.transform = 'scaleX(-1)';
            }
            
            // Start throw animation
            boomerangVfx.style.animation = 'boomerangThrow 0.6s forwards';
            playSound('sounds/boomerang_throw.mp3', 0.7); // Example sound

            // Will the boomerang return? (75% chance)
            const willReturn = Math.random() < 0.75;
            
            // First hit damage calculation (same as before)
            const damageMultiplier = getChamChamPassiveBonus(caster);
            const baseDamage = caster.stats.physicalDamage * 0.45;
            let finalDamage = Math.floor(baseDamage * damageMultiplier);

            // Schedule first hit and return animation
            setTimeout(() => {
                let result = target.applyDamage(finalDamage, 'physical');
                log(`${target.name} takes ${result.damage} physical damage from the boomerang.`);
                if (result.isCritical) {
                    log("Critical Hit!");
                } else {
                    playSound('sounds/boomerang_hit.mp3', 0.8); // Play hit sound only on non-crit?
                }
                caster.applyLifesteal(result.damage);
                addChamChamPassiveStack(caster);
                
                // Return animation or miss animation
                if (willReturn) {
                    log(`The boomerang returns!`);
                    boomerangVfx.style.animation = 'boomerangReturn 0.6s forwards';
                    playSound('sounds/boomerang_return.mp3', 0.7); // Example sound
                    
                    // Schedule second hit
                    setTimeout(() => {
                        // Recalculate damage
                        const returnDamageMultiplier = getChamChamPassiveBonus(caster);
                        finalDamage = Math.floor(baseDamage * returnDamageMultiplier);
                        
                        result = target.applyDamage(finalDamage, 'physical');
                        log(`${target.name} takes ${result.damage} additional physical damage from the returning boomerang.`);
                        if (result.isCritical) {
                            log("Critical Hit!");
                        } else {
                            playSound('sounds/boomerang_hit.mp3', 0.8); // Second hit sound
                        }
                        caster.applyLifesteal(result.damage);
                        addChamChamPassiveStack(caster);
                        
                        // Clean up VFX after return animation completes
                        setTimeout(() => {
                            vfxContainer.remove(); // Remove container
                        }, 100);
                    }, 550); // Time until second hit
                } else {
                    log(`The boomerang misses on the return.`);
                    boomerangVfx.style.animation = 'boomerangMiss 0.8s forwards';
                    
                    // Clean up VFX after miss animation completes
                    setTimeout(() => {
                        vfxContainer.remove(); // Remove container
                    }, 800);
                }
            }, 600); // Time until first hit
        }
    } else {
        // Fallback if DOM elements not found - still apply the damage without visuals
        // First Hit
        const damageMultiplier = getChamChamPassiveBonus(caster);
        const baseDamage = caster.stats.physicalDamage * 0.45;
        let finalDamage = Math.floor(baseDamage * damageMultiplier);

        let result = target.applyDamage(finalDamage, 'physical');
        log(`${target.name} takes ${result.damage} physical damage from the boomerang.`);
        if (result.isCritical) {
            log("Critical Hit!");
        }
        caster.applyLifesteal(result.damage);
        addChamChamPassiveStack(caster);

        // Return Hit (75% chance)
        if (Math.random() < 0.75) {
            log(`The boomerang returns!`);
            // Recalculate damage multiplier
            const returnDamageMultiplier = getChamChamPassiveBonus(caster);
            finalDamage = Math.floor(baseDamage * returnDamageMultiplier);

            result = target.applyDamage(finalDamage, 'physical');
            log(`${target.name} takes ${result.damage} additional physical damage from the returning boomerang.`);
            if (result.isCritical) {
                log("Critical Hit!");
            }
            caster.applyLifesteal(result.damage);
            addChamChamPassiveStack(caster);
        } else {
            log(`The boomerang misses on the return.`);
        }
    }
    // --- End Boomerang VFX ---
};

const chamChamE = new Ability(
    'cham_cham_e',
    'Boomerang',
    'Icons/abilities/boomerang.webp',
    12, // Mana cost
    4,  // Cooldown
    chamChamEEffect
).setDescription('Throws a boomerang dealing 45% AD physical damage and granting a passive stack. 75% chance to return, dealing damage and granting another stack.')
 .setTargetType('enemy');


// R: Feral Strike
const chamChamREffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Cham Cham R: No target selected!", "error");
        return;
    }

    log(`${caster.name} unleashes a flurry of scratches on ${target.name}!`);

    const hits = 8;
    for (let i = 0; i < hits; i++) {
        log(`Scratch #${i + 1}:`);
        // Call the core Q logic directly
        const damageMultiplier = getChamChamPassiveBonus(caster);
        const baseDamage = caster.stats.physicalDamage * 0.50;
        const finalDamage = Math.floor(baseDamage * damageMultiplier);

        const result = target.applyDamage(finalDamage, 'physical');
        log(`${target.name} takes ${result.damage} physical damage.`);
         if (result.isCritical) {
            log("Critical Hit!");
         }

        // --- Scratch VFX Trigger (New Container for each hit) ---
        const targetElementR = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElementR) {
            // Check if imageContainer exists before appending to it
            const imageContainerR = targetElementR.querySelector('.image-container'); // Re-query
            if (imageContainerR) {
                const vfxContainerR = document.createElement('div');
                vfxContainerR.className = 'vfx-container scratch-vfx-container';
                targetElementR.appendChild(vfxContainerR); // Append to target element

                const vfxDivR = document.createElement('div');
                vfxDivR.className = 'scratch-vfx';

                // Append VFX to its own container
                vfxContainerR.appendChild(vfxDivR);

                // Play sound for each scratch, maybe slightly varied?
                playSound('sounds/scratch.mp3', 0.6 + Math.random() * 0.2); // Example sound variation

                // Remove VFX element after animation
                // Add slight delay variation for multiple hits
                setTimeout(() => {
                    vfxContainerR.remove(); // Remove the container
                }, 300 + (i * 50)); // Adjust timing as needed
            }
        }
        // --- End VFX Trigger ---

        caster.applyLifesteal(result.damage);
        addChamChamPassiveStack(caster);

        // Check if target is dead after each hit to potentially stop early
        if (target.isDead()) {
            log(`${target.name} was defeated during the flurry!`);
            break; // Stop attacking if the target is dead
        }
    }
     log(`${caster.name}'s flurry ends.`);

    // Update UI after the loop
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const chamChamR = new Ability(
    'cham_cham_r',
    'Feral Strike',
    'Icons/abilities/feral_strike.webp',
    50, // Mana cost
    12, // Cooldown
    chamChamREffect
).setDescription('Unleashes Scratch 8 times on the target, gaining a passive stack for each hit.')
 .setTargetType('enemy');


// --- Ability Factory Integration ---
// We need to make these abilities available to the AbilityFactory or game initialization process.
// This usually involves adding them to a global registry or exporting them.
// Example (modify based on actual project structure):

if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        chamChamQ,
        chamChamW,
        chamChamE,
        chamChamR
    ]);
} else {
    console.warn("Cham Cham abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: maybe assign to a global object if that's the pattern
    // window.definedAbilities = window.definedAbilities || {};
    // window.definedAbilities.cham_cham_q = chamChamQ;
    // window.definedAbilities.cham_cham_w = chamChamW;
    // window.definedAbilities.cham_cham_e = chamChamE;
    // window.definedAbilities.cham_cham_r = chamChamR;
} 