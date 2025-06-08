// Ability definitions for Schoolgirl Julia

// Assume Ability, Effect classes and addLogEntry function are available globally or imported

// --- Helper Function to get all alive enemies ---
function getAllAliveEnemies(caster) {
    if (!window.gameManager || !window.gameManager.gameState) {
        console.error("Game state not accessible for finding enemies.");
        return [];
    }
    const playerTeamIds = window.gameManager.gameState.playerCharacters.map(c => c.id);
    const allCharacters = [...window.gameManager.gameState.playerCharacters, ...window.gameManager.gameState.aiCharacters];

    if (playerTeamIds.includes(caster.id)) {
        // Caster is player, target AI
        return window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
    } else {
        // Caster is AI, target player
        return window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
    }
}

// --- Q: Healing Kick ---
const schoolgirlJuliaHealingKickEffect = (caster, target) => { // Target param is unused for AoE but part of signature
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const enemies = getAllAliveEnemies(caster); // Renamed variable for clarity

    if (enemies.length === 0) {
        log(`${caster.name} used Healing Kick, but there were no enemies!`);
        return;
    }

    log(`${caster.name} uses Healing Kick, striking all enemies!`);

    // Calculate damage based on 200% of Physical Damage
    const damageAmount = Math.floor(caster.stats.physicalDamage * 2.0);
    const damageType = 'physical';
    let totalDamageDealt = 0; // Track total damage for healing calculation

    // Play Healing Kick sound
    const playSoundKick = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSoundKick('sounds/juliaa1.mp3');

    // --- Healing Kick VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const gameArea = document.querySelector('.game-area'); // Adjust selector if needed

    if (casterElement && gameArea && enemies.length > 0) {
        const numParticles = 8; // Number of wind particles
        const animationDuration = 600; // Matches CSS animation duration

        // Get caster position (approximate center)
        const casterRect = casterElement.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect(); // Use game area for relative positioning

        // Calculate starting position relative to gameArea
        const startX = casterRect.left + casterRect.width / 2 - gameRect.left;
        const startY = casterRect.top + casterRect.height / 2 - gameRect.top;

        // Determine general direction towards enemies (simplistic: just move horizontally)
        const moveDirectionX = caster.isAI ? -1 : 1; // AI on right moves left, Player on left moves right

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-kick-wind-vfx';

            // Randomize starting offset slightly around the caster
            const offsetX = (Math.random() - 0.5) * casterRect.width * 0.8;
            const offsetY = (Math.random() - 0.5) * casterRect.height * 0.5;
            particle.style.left = `${startX + offsetX}px`;
            particle.style.top = `${startY + offsetY}px`;

            // Randomize movement direction and distance
            // Adjust multiplier for desired spread/distance
            const windX = moveDirectionX * (60 + Math.random() * 50);
            const windY = (Math.random() - 0.5) * 60; // Vertical spread
            particle.style.setProperty('--wind-x', `${windX}px`);
            particle.style.setProperty('--wind-y', `${windY}px`);

            // Random slight delay for staggering
            const delay = Math.random() * 150; // 0 to 150ms delay
            particle.style.animationDelay = `${delay}ms`;

            gameArea.appendChild(particle);

            // Remove particle after animation + delay
            setTimeout(() => {
                particle.remove();
            }, animationDuration + delay);
        }
    }
    // --- End VFX ---

    // Apply damage to all targets and calculate total damage
    enemies.forEach(enemy => {
        const result = enemy.applyDamage(damageAmount, damageType, caster);
        totalDamageDealt += result.damage; // Accumulate damage dealt

        let message = `${enemy.name} takes ${result.damage} ${damageType} damage from Healing Kick`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        log(message);

        if (enemy.isDead()) {
            log(`${enemy.name} has been defeated!`);
        }
    });

    // Calculate heal amount (65% of total damage dealt)
    const healAmount = Math.floor(totalDamageDealt * 0.65);

    if (healAmount > 0) {
        // Determine which team to heal based on caster
        let alliesToHeal = [];
        if (window.gameManager && window.gameManager.gameState) {
            if (caster.isAI) {
                alliesToHeal = window.gameManager.gameState.aiCharacters.filter(c => !c.isDead());
            } else {
                alliesToHeal = window.gameManager.gameState.playerCharacters.filter(c => !c.isDead());
            }
        } else {
            log("Warning: Could not access game state to determine allies.", "error");
            // As a fallback, just heal the caster
            alliesToHeal.push(caster);
        }

        log(`${caster.name}'s Healing Kick generates ${healAmount} healing for the team!`);

        // Apply heal to all alive allies (including the caster)
        alliesToHeal.forEach(ally => {
            const healResult = ally.heal(healAmount, caster);
            const actualHeal = healResult.healAmount; // Extract healAmount from result object
            log(`${ally.name} is healed for ${actualHeal}.`);
            
            // Trigger passive if heal was successful and caster has the handler
            if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                caster.passiveHandler.onHealDealt(caster, ally, actualHeal);
            }

            // Optionally add healing VFX to each ally
            const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
            if (allyElement) {
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx'; // Use existing heal VFX class
                healVfx.textContent = `+${actualHeal}`;
                allyElement.appendChild(healVfx);
                
                const healParticles = document.createElement('div');
                healParticles.className = 'heal-particles'; // Use existing particle class
                allyElement.appendChild(healParticles);
                
                setTimeout(() => {
                    allyElement.querySelectorAll('.heal-vfx, .heal-particles').forEach(el => el.remove());
                }, 1000);
            }
        });
    }

    // Play sound for Julia Q (already played earlier)
    // const playSoundJuliaQ = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    // playSoundJuliaQ('sounds/juliaa1.mp3'); // Sound moved up
};

const schoolgirl_julia_q = new Ability(
    'schoolgirl_julia_q',
    'Healing Kick',
    'Icons/abilities/healing_kick.jfif', // Placeholder icon
    60, // Mana cost
    1,  // Cooldown (Changed from 2)
    schoolgirlJuliaHealingKickEffect
).setDescription('Deals 200% Physical Damage to ALL enemies. Heals all allies (including self) for 65% of the total damage dealt.');

// --- Ability Factory Integration ---
// Ensure AbilityFactory exists and has the registration method
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirl_julia_q
        // Register other Schoolgirl Julia abilities here when created
    ]);
} else {
    console.warn("Schoolgirl Julia abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: Assign to a global object if AbilityFactory is not available
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_julia_q = schoolgirl_julia_q;
}

// Removed redundant Q ability registration - already handled above

// Ability definition for Schoolgirl Julia's W: Sprout Planting

const schoolgirlJuliaSproutPlantingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;

    if (!target) {
        log("Schoolgirl Julia W: No target selected!", "error");
        return;
    }

    log(`${caster.name} plants a healing sprout on ${target.name}.`);

    // --- Sprout Planting VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create sprout visual effect
        const sproutVfx = document.createElement('div');
        sproutVfx.className = 'sprout-planting-vfx'; // Add CSS for this class
        targetElement.appendChild(sproutVfx);

        // Remove VFX after animation completes (e.g., 1 second)
        setTimeout(() => {
            sproutVfx.remove();
        }, 1000);
    }
    // --- End Sprout Planting VFX ---

    // Create the Sprout buff
    const sproutBuff = new Effect(
        'schoolgirl_julia_w_sprout', // Unique ID for the buff
        'Healing Sprout',
        'Icons/abilities/sprout_planting.jfif', // Use a placeholder icon path
        2, // Duration: 2 turns (Changed from 3)
        (character) => {
            // Optional: Effect that runs each turn while the buff is active
            // log(`${character.name}'s Healing Sprout is growing...`);
        },
        false // isDebuff = false
    ).setDescription('A healing sprout that will bloom after 2 turns, restoring health.');

    // Define the onRemove function (called when buff expires or is removed)
    sproutBuff.onRemove = (buffedCharacter) => {
        log(`The Healing Sprout on ${buffedCharacter.name} blooms!`);

        // Calculate heal amount based on Julia's (caster's) healingPower
        const baseHeal = 1250;
        const healAmount = Math.floor(baseHeal * (1 + (caster.stats.healingPower || 0)));

        const healResult = buffedCharacter.heal(healAmount, caster);
        const actualHeal = healResult.healAmount; // Extract healAmount from result object
        log(`${buffedCharacter.name} is healed for ${actualHeal} HP.`);

        // Trigger Julia's passive if applicable (heal dealt by Julia)
        if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
             // Pass the caster (Julia) and the target (buffedCharacter)
             caster.passiveHandler.onHealDealt(caster, buffedCharacter, actualHeal);
        }

        // --- Sprout Bloom VFX ---
        const healedElement = document.getElementById(`character-${buffedCharacter.instanceId || buffedCharacter.id}`);
        if (healedElement) {
             const bloomVfx = document.createElement('div');
             bloomVfx.className = 'sprout-bloom-vfx'; // Add CSS for this
             healedElement.appendChild(bloomVfx);
             setTimeout(() => bloomVfx.remove(), 1500);
        }
        // --- End Sprout Bloom VFX ---

        // Play sound effect for sprout bloom
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/juliaa2.mp3');
    };

    // Apply the buff to the target ally
    target.addBuff(sproutBuff.clone()); // Use clone to ensure unique instances if needed

    log(`${target.name} receives the Healing Sprout buff.`);

    // Update UI for the target
    updateCharacterUI(target);
};

const schoolgirlJuliaW = new Ability(
    'schoolgirl_julia_w',
    'Sprout Planting',
    'Icons/abilities/sprout_planting.jfif', // Use a placeholder icon path
    75, // Mana cost
    6,  // Cooldown (Changed from 9)
    schoolgirlJuliaSproutPlantingEffect
).setDescription('Plants a healing sprout on an ally for 2 turns. When the sprout expires, it heals the target for 500 (+100% Healing Power) HP.')
 .setTargetType('ally'); // Target allies

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Assuming Julia's other abilities (Q, E, R) might be defined elsewhere or added later
    AbilityFactory.registerAbilities([
        schoolgirlJuliaW
        // Add other Julia abilities here: schoolgirlJuliaQ, schoolgirlJuliaE, schoolgirlJuliaR
    ]);
} else {
    console.warn("Schoolgirl Julia W ability defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback registration
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_julia_w = schoolgirlJuliaW;
}

// Add basic CSS for VFX placeholders (ideally move to a dedicated CSS file)
const juliaWStyle = document.createElement('style');
juliaWStyle.textContent = `
/* Healing Kick Wind VFX */
.healing-kick-wind-vfx {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: rgba(200, 255, 255, 0.7);
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(150, 230, 230, 0.8);
    pointer-events: none;
    z-index: 14;
    animation: windyEffect 0.6s ease-out forwards;
}

@keyframes windyEffect {
    0% {
        opacity: 0.8;
        transform: translate(0, 0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(var(--wind-x, 50px), var(--wind-y, -30px)) scale(0.5);
    }
}

.sprout-planting-vfx {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 30px;
    background-color: #4CAF50; /* Green */
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    animation: growSprout 1s ease-out forwards;
    z-index: 10;
}

@keyframes growSprout {
    0% { height: 0; opacity: 0; }
    100% { height: 30px; opacity: 1; }
}

.sprout-bloom-vfx {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle, rgba(144, 238, 144, 0.8) 0%, rgba(144, 238, 144, 0) 70%); /* Light green bloom */
    border-radius: 50%;
    animation: bloomEffect 1.5s ease-out forwards;
    z-index: 10;
}

@keyframes bloomEffect {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

.spirits-strength-heal-vfx {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    color: #90EE90;
    font-weight: bold;
    font-size: 1.1em;
    text-shadow: 0 0 3px #228B22;
    animation: floatUpFade 1.5s ease-out forwards;
    pointer-events: none;
    z-index: 15;
}

.spirits-strength-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(144, 238, 144, 0.6) 0%, rgba(144, 238, 144, 0) 60%);
    border-radius: 50%;
    animation: spiritParticles 1.5s ease-out forwards;
    z-index: 12;
    pointer-events: none;
}

@keyframes spiritParticles {
    0% { transform: scale(0); opacity: 0; }
    30% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

/* Placeholder for buff icon in UI */
.status-icon[style*="sprout_planting.jfif"] {
    background-color: #90EE90; /* Light Green background for placeholder */
    border: 1px solid #3CB371; /* Medium Sea Green border */
}

/* Pushback Attack VFX */
.julia-push-caster-animation {
    animation: juliaPushCaster 0.5s ease-out;
}

@keyframes juliaPushCaster {
    0% { transform: translateX(0); }
    50% { transform: translateX(10px); filter: brightness(1.2); }
    100% { transform: translateX(0); }
}

.pushback-animation {
    animation: pushbackTarget 0.8s ease-out;
}

@keyframes pushbackTarget {
    0% { transform: translateX(0); }
    30% { transform: translateX(-15px); }
    60% { transform: translateX(-10px); }
    100% { transform: translateX(0); }
}

.julia-push-impact-vfx {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba(255, 255, 0, 0.8) 0%, rgba(255, 255, 0, 0) 70%);
    border-radius: 50%;
    animation: pushImpact 0.8s ease-out forwards;
    z-index: 12;
    pointer-events: none;
}

@keyframes pushImpact {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}
`;
document.head.appendChild(juliaWStyle);

// E: Pushback Attack
const schoolgirlJuliaPushbackEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;

    if (!target) {
        log("Schoolgirl Julia E: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Pushback Attack on ${target.name}.`);

    // Play sound effect
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/juliaa3.mp3');

    // --- Pushback Attack VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    // Caster animation (optional, e.g., a forward dash)
    if (casterElement) {
        casterElement.classList.add('julia-push-caster-animation');
        setTimeout(() => casterElement.classList.remove('julia-push-caster-animation'), 500);
    }

    // Target animation (pushback)
    if (targetElement) {
        targetElement.classList.add('pushback-animation');
        
        // Impact VFX
        const impactVfx = document.createElement('div');
        impactVfx.className = 'julia-push-impact-vfx'; // Use a specific class
        targetElement.appendChild(impactVfx);

        setTimeout(() => {
            targetElement.classList.remove('pushback-animation');
            impactVfx.remove();
        }, 800); // Duration should match CSS animation
    }
    // --- End Pushback Attack VFX ---

    // Calculate damage (150% of Physical Damage)
    const damageAmount = Math.floor(caster.stats.physicalDamage * 1.5);

    // Apply damage
    const result = target.applyDamage(damageAmount, 'physical', caster);

    let message = `${target.name} takes ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    log(message);

    // Apply lifesteal if any (though Julia likely won't have base lifesteal)
    caster.applyLifesteal(result.damage);

    // Apply stun effect (40% chance, 2 turn duration)
    if (Math.random() < 0.40) {
        const stunDebuff = new Effect(
            'stun_debuff', // Use generic stun ID
            'Stunned',
            'Icons/debuffs/stun.png', // Use generic stun icon
            2, // Duration: 2 turns (Changed from 1)
            null, // No ongoing effect function needed
            true // isDebuff = true
        );

        // Set stun effect properties
        stunDebuff.effects = { cantAct: true };
        stunDebuff.setDescription('Cannot perform any actions.');

        // Add the remove function for cleanup (same as Alice's)
        stunDebuff.remove = function(character) {
            const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (targetElement) {
                targetElement.classList.remove('stunned');
                const stunEffects = targetElement.querySelectorAll('.stun-effect');
                stunEffects.forEach(el => el.remove());
            }
        };

        target.addDebuff(stunDebuff);
        log(`${target.name} is stunned for 2 turns!`);

        // Add stun VFX (using existing stun CSS)
        if (targetElement) {
            targetElement.classList.add('stunned');
            const stunEffect = document.createElement('div');
            stunEffect.className = 'stun-effect'; // Use existing class
            targetElement.appendChild(stunEffect);
        }
    }

    // Check if target died
    if (target.isDead()) {
        log(`${target.name} has been defeated!`);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolgirlJuliaE = new Ability(
    'schoolgirl_julia_e',
    'Pushback Attack',
    'Icons/abilities/pushback_attack.jfif', // Placeholder icon
    50, // Mana cost
    5, // Cooldown (Changed from 10)
    schoolgirlJuliaPushbackEffect
).setDescription('Deals 150% physical damage to the target and has an 40% chance to stun it for 2 turns.') // Updated description
 .setTargetType('enemy');

// --- Ability Factory Integration ---
// Ensure this runs after the main game scripts have loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            schoolgirlJuliaE
            // Add other Julia abilities here if needed
        ]);
        console.log("Registered Schoolgirl Julia abilities.");
    } else {
        console.warn("Schoolgirl Julia abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
    }
});

// --- R: Spirits Strength ---

const schoolgirlJuliaSpiritsStrengthEffect = (caster, target) => { // Target param is unused for AoE but part of signature
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    let alliesToHeal = [];
    let totalHealed = 0;
    let passiveTriggeredThisCast = false;

    // Determine which team to heal based on caster
    if (window.gameManager && window.gameManager.gameState) {
        if (caster.isAI) {
            alliesToHeal = window.gameManager.gameState.aiCharacters.filter(c => !c.isDead());
        } else {
            alliesToHeal = window.gameManager.gameState.playerCharacters.filter(c => !c.isDead());
        }
    } else {
        log("Warning: Could not access game state to determine allies for Spirits Strength.", "error");
        // Fallback: Just target the caster if game state is unavailable
        if (!caster.isDead()) {
            alliesToHeal.push(caster);
        }
    }

    if (alliesToHeal.length === 0) {
        log(`${caster.name} used Spirits Strength, but there were no allies to heal!`);
        return;
    }

    log(`${caster.name} channels Spirits Strength, unleashing a wave of healing energy!`);

    // Calculate heal amount: 1200 base + 200% Magical Damage, modified by Healing Power
    const baseHeal = 1200 + ((caster.stats.magicalDamage || 0) * 2.0); // Changed from 100%
    const healAmount = Math.floor(baseHeal * (1 + (caster.stats.healingPower || 0))); // Apply healing power modifier

    log(`Spirits Strength base heal per ally: ${healAmount}`);

    // Play sound effect
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/juliaa4.mp3', 0.9); // Use Julia's R sound
    playSound('sounds/julia_spirits.mp3', 0.8); // Add the second sound

    // Apply heal to all alive allies (including the caster if they are alive)
    alliesToHeal.forEach(ally => {
        const healResult = ally.heal(healAmount, caster);
        const actualHeal = healResult.healAmount; // Extract healAmount from result object
        totalHealed += actualHeal;
        log(`${ally.name} is healed for ${actualHeal} by Spirits Strength.`);

        // Trigger passive if heal was successful and caster has the handler
        if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
            caster.passiveHandler.onHealDealt(caster, ally, actualHeal);
        }

        // --- Add Spirits Strength VFX to each ally ---
        const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
        if (allyElement) {
             // Use existing heal VFX classes or create new ones
             const spiritsHealVfx = document.createElement('div');
             spiritsHealVfx.className = 'spirits-strength-heal-vfx'; // Add CSS for this
             spiritsHealVfx.textContent = `+${actualHeal}`;
             allyElement.appendChild(spiritsHealVfx);

             const spiritsParticles = document.createElement('div');
             spiritsParticles.className = 'spirits-strength-particles'; // Add CSS for this
             allyElement.appendChild(spiritsParticles);

             setTimeout(() => {
                 allyElement.querySelectorAll('.spirits-strength-heal-vfx, .spirits-strength-particles').forEach(el => el.remove());
             }, 1500); // Duration of VFX
        }
         // --- End Spirits Strength VFX ---
    });

    log(`Spirits Strength healed the team for a total of ${totalHealed}.`);

    // Update UI for all healed characters
    alliesToHeal.forEach(ally => updateCharacterUI(ally));
};

const schoolgirlJuliaR = new Ability(
    'schoolgirl_julia_r',
    'Spirits Strength',
    'Icons/abilities/spirits_strength.jfif', // Placeholder icon
    200, // Mana cost
    16,  // Cooldown (Changed from 26)
    schoolgirlJuliaSpiritsStrengthEffect
).setDescription('Heals ALL allies for 1200 (+200% Magical Damage) HP. Cooldown reduced by 1 whenever Julia is healed.') // Updated description
 .setTargetType('all_allies'); // Target all allies

// --- Ability Factory Integration ---
// Ensure this runs after the main game scripts have loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            schoolgirlJuliaE,
            schoolgirlJuliaR // Register R ability here as well
        ]);
        console.log("Registered Schoolgirl Julia E and R abilities."); // Updated log
    } else {
        console.warn("Schoolgirl Julia E or R abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
        window.definedAbilities.schoolgirl_julia_r = schoolgirlJuliaR; // Add R to fallback
    }
});

// --- Ensure All Abilities Are Registered Initially ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirl_julia_q,
        schoolgirlJuliaW,
        schoolgirlJuliaE,
        schoolgirlJuliaR // Add R ability here
    ]);
} else {
     // Fallback registration (already handled above and in DOMContentLoaded, but good for clarity)
     window.definedAbilities = window.definedAbilities || {};
     window.definedAbilities.schoolgirl_julia_q = schoolgirl_julia_q;
     window.definedAbilities.schoolgirl_julia_w = schoolgirlJuliaW;
     window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
     window.definedAbilities.schoolgirl_julia_r = schoolgirlJuliaR;
} 