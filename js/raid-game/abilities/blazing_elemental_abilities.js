// Ability definition for Blazing Elemental

// Assume Ability, Effect, Character classes and necessary game manager access are available

const blazeBombEffect = (caster, targets) => { // Target parameter is not used for 'all' type, but kept for signature consistency
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameState = window.gameManager ? window.gameManager.gameState : null;

    if (!gameState) {
        log("Blaze Bomb Error: Cannot access game state!", "error");
        return;
    }

    log(`${caster.name} uses Blaze Bomb!`);

    // --- Blaze Bomb VFX ---
    // Caster VFX (usually unique ID, but use fallback just in case)
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Add caster animation (e.g., glowing or pulsing)
        casterElement.classList.add('blaze-bomb-cast-animation');
        setTimeout(() => casterElement.classList.remove('blaze-bomb-cast-animation'), 1000);
    }

    // Target all enemies (player characters)
    const enemies = gameState.playerCharacters || [];
    const damageAmount = 220;
    const damageType = 'magical';

    log(`${caster.name} unleashes a wave of fire towards enemies!`);
    enemies.forEach(enemy => {
        if (enemy && !enemy.isDead()) {
            log(`${enemy.name} is hit by the Blaze Bomb!`);
            // Use instanceId for enemy element lookup
            const enemyElementId = enemy.instanceId || enemy.id;
            const enemyElement = document.getElementById(`character-${enemyElementId}`);
            if (enemyElement) {
                // Add impact VFX to each enemy
                const impactVfx = document.createElement('div');
                impactVfx.className = 'blaze-bomb-impact-vfx';
                enemyElement.appendChild(impactVfx);
                setTimeout(() => impactVfx.remove(), 800);
            }
            
            enemy.applyDamage(damageAmount, damageType, caster);
        }
    });

    // Add new VFX for Blaze Bomb
    const newBlazeBombVfx = document.createElement('div');
    newBlazeBombVfx.className = 'new-blaze-bomb-vfx';
    if (casterElement) {
        casterElement.appendChild(newBlazeBombVfx);
        setTimeout(() => newBlazeBombVfx.remove(), 1200);
    }

    // Update UI for all affected characters
    [...enemies].forEach(char => {
        if (char) updateCharacterUI(char);
    });
};

const blazeBomb = new Ability(
    'blazing_elemental_blaze_bomb',
    'Blaze Bomb',
    'Icons/abilities/blaze_bomb.png', // Make sure this icon exists
    100, // Mana cost
    0,   // Cooldown
    blazeBombEffect
).setDescription('Deals 220 magical damage to all enemies.')
 .setTargetType('all'); // Affects everyone, logic differentiates allies/enemies

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        blazeBomb
    ]);
} else {
    console.warn("Blazing Elemental abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.blazing_elemental_blaze_bomb = blazeBomb;
}

// --- Add CSS for VFX (can be moved to a dedicated CSS file) ---
const blazeBombStyles = `
.blaze-bomb-cast-animation {
    animation: blaze-bomb-pulse 0.8s ease-in-out;
}

@keyframes blaze-bomb-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 100, 0, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 150, 50, 1); }
}

.blaze-bomb-impact-vfx {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle, rgba(255, 80, 0, 0.8) 20%, rgba(255, 150, 0, 0) 70%);
    border-radius: 50%;
    animation: blaze-bomb-explode 0.8s ease-out forwards;
    z-index: 10;
}

@keyframes blaze-bomb-explode {
    0% { transform: scale(0.2); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

.demon-fireball-vfx {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle, rgba(255, 200, 100, 0.7) 20%, rgba(255, 255, 150, 0) 70%);
    border-radius: 50%;
    animation: demon-fireball-pulse 0.8s ease-out forwards;
    z-index: 10;
}

@keyframes demon-fireball-pulse {
    0% { transform: scale(0.2); opacity: 0; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1.3); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = blazeBombStyles;
    document.head.appendChild(styleSheet);
} 