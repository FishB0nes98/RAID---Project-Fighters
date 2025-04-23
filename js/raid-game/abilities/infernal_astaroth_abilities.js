// infernal_astaroth_abilities.js - Handles Infernal Astaroth's ability effects

// Add event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Listen for ability usage
    document.addEventListener('AbilityUsed', function(event) {
        const { caster, target, ability } = event.detail;
        
        // Blazing Ball ability
        if (ability.id === 'infernal_astaroth_q_blazing_ball') {
            createBlazingBallVFX(caster, target);
        }
    });
});

// Create the Blazing Ball visual effect
function createBlazingBallVFX(caster, target) {
    if (!caster || !target) return;
    
    // Find the DOM elements
    const casterElement = document.getElementById(`character-${caster.id}`);
    const targetElement = document.getElementById(`character-${target.id}`);
    
    if (!casterElement || !targetElement) return;
    
    // Get positions for start and end points
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Create the blazing ball element
    const blazingBall = document.createElement('div');
    blazingBall.className = 'blazing-ball-vfx';
    
    // Position at caster's center
    const startX = casterRect.left + (casterRect.width / 2);
    const startY = casterRect.top + (casterRect.height / 2);
    
    // Position relative to the battle container
    const battleContainer = document.querySelector('.battle-container');
    const battleRect = battleContainer.getBoundingClientRect();
    
    blazingBall.style.left = `${startX - battleRect.left}px`;
    blazingBall.style.top = `${startY - battleRect.top}px`;
    
    // Calculate travel distance for the animation
    const travelDistanceY = targetRect.top - casterRect.top;
    blazingBall.style.setProperty('--travel-distance', `${travelDistanceY}px`);
    
    // Add to battle container
    battleContainer.appendChild(blazingBall);
    
    // Play sound if available
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/fire_blast.mp3', 0.7);
    }
    
    // Remove after animation completes
    setTimeout(() => {
        blazingBall.remove();
        
        // Add impact effect on target
        const impactEffect = document.createElement('div');
        impactEffect.className = 'blazing-ball-impact';
        impactEffect.style.position = 'absolute';
        impactEffect.style.top = '0';
        impactEffect.style.left = '0';
        impactEffect.style.width = '100%';
        impactEffect.style.height = '100%';
        impactEffect.style.background = 'radial-gradient(circle, rgba(255,165,0,0.8) 0%, rgba(255,60,0,0.4) 50%, rgba(255,0,0,0) 100%)';
        impactEffect.style.boxShadow = '0 0 30px 20px rgba(255, 60, 0, 0.6)';
        impactEffect.style.borderRadius = '50%';
        impactEffect.style.animation = 'impact-pulse 0.5s ease-out forwards';
        impactEffect.style.zIndex = '15';
        impactEffect.style.pointerEvents = 'none';
        
        targetElement.appendChild(impactEffect);
        
        // Add impact effect style if it doesn't exist
        if (!document.querySelector('#blazing-ball-impact-style')) {
            const style = document.createElement('style');
            style.id = 'blazing-ball-impact-style';
            style.textContent = `
                @keyframes impact-pulse {
                    0% {
                        transform: scale(0.5);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove impact effect after animation
        setTimeout(() => {
            impactEffect.remove();
        }, 500);
    }, 500); // Match with the animation duration
}

// Initialize the burning ground effect for the burning_school_gym stage
// Make this function globally accessible so GameManager can call it
window.initializeBurningGroundEffect = function() {
    // Check if the effect already exists
    if (document.querySelector('.burning-ground-container')) {
        console.log("Burning ground effect already initialized.");
        return;
    }

    // Create the burning ground container
    const bottomSection = document.querySelector('.bottom-section');
    if (!bottomSection) return;
    
    const burningGroundContainer = document.createElement('div');
    burningGroundContainer.className = 'burning-ground-container';
    
    const burningGroundVFX = document.createElement('div');
    burningGroundVFX.className = 'burning-ground-vfx';
    
    burningGroundContainer.appendChild(burningGroundVFX);
    bottomSection.appendChild(burningGroundContainer);
    
    // Add random floating embers
    setInterval(() => {
        if (!document.contains(burningGroundContainer)) return;
        
        const ember = document.createElement('div');
        ember.className = 'ember';
        ember.style.left = `${Math.random() * 100}%`;
        
        // Randomize ember properties
        ember.style.opacity = 0.3 + Math.random() * 0.7;
        const size = 3 + Math.random() * 4;
        ember.style.width = `${size}px`;
        ember.style.height = `${size}px`;
        
        // Randomize animation duration
        const duration = 1 + Math.random() * 2;
        ember.style.animationDuration = `${duration}s`;
        
        burningGroundContainer.appendChild(ember);
        
        // Remove ember after animation
        setTimeout(() => {
            if (ember.parentNode === burningGroundContainer) {
                ember.remove();
            }
        }, duration * 1000);
    }, 200);
}

/**
 * Ability definitions for Infernal Astaroth
 */

// Assume Ability, Effect, Character classes and gameManager/addLogEntry are available globally

// Helper function for logging
const logAstaroth = (message, type = '') => {
    if (window.gameManager) {
        window.gameManager.addLogEntry(message, type);
    } else {
        console.log(message);
    }
};

// --- Q: Blazing Ball --- //
const astarothBlazingBallEffect = (caster, target) => {
    // ---> DEBUG LOG <---
    console.log(`%c[ASTAROTH ABILITY DEBUG] Entering astarothBlazingBallEffect. Caster: ${caster?.name}, Target: ${target?.name}`, 'color: orange; font-weight: bold;');
    // ---> END DEBUG LOG <---

    if (!target) {
        logAstaroth("Astaroth Q: No target selected!", "error");
        return;
    }
    logAstaroth(`${caster.name} hurls a Blazing Ball at ${target.name}.`);

    // --- Blazing Ball VFX --- (Placeholder - Add specific VFX later)
    const targetElement = document.getElementById(`character-${target.id}`);
    if (targetElement) {
        const vfx = document.createElement('div');
        vfx.className = 'astaroth-blazing-ball-vfx'; // Use a specific class
        targetElement.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1000);
    }
    // --- End VFX ---

    const fixedDamage = 1200;
    const result = target.applyDamage(fixedDamage, 'magical', caster);
    logAstaroth(`${target.name} takes ${result.damage} magical damage from Blazing Ball.`, result.isCritical ? 'critical' : '');

    // Apply lifesteal if any
    caster.applyLifesteal(result.damage);

    // Update UI
    updateCharacterUI(target);
    updateCharacterUI(caster);
};

const astarothQ = new Ability(
    'infernal_astaroth_q_blazing_ball',
    'Blazing Ball',
    'Icons/abilities/blazing_ball.webp',
    50, // Mana cost
    5,  // Cooldown
    astarothBlazingBallEffect
).setDescription('Hurls a massive ball of fire at a single target, dealing 1200 magical damage.')
 .setTargetType('enemy');

// --- W: Explosion --- //
const astarothExplosionEffect = (caster, targets) => {
    // ---> Add Debug Log <---
    console.log(`%c[ASTAROTH ABILITY DEBUG] Entering astarothExplosionEffect. Caster: ${caster?.name}, Received targets param type: ${typeof targets}`, 'color: orange; font-weight: bold;');

    const logAstaroth = (message, type = '') => {
        if (window.gameManager) {
            window.gameManager.addLogEntry(message, type);
        } else {
            console.log(message);
        }
    };
    // ---> END Add Debug Log <---

    logAstaroth(`${caster.name} unleashes a massive Explosion!`);

    const baseDamage = 600 + (caster.stats.magicalDamage * 1.0); // 600 + 100% MD

    // --- Explosion VFX ---
    const casterElementId = caster.instanceId || caster.id; // Use instance ID if available
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        const vfx = document.createElement('div');
        vfx.className = 'astaroth-explosion-vfx';
        casterElement.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1500);
    }
    // --- End VFX ---

    // --- MODIFICATION: Fetch targets directly like Blaze Bomb --- 
    const validTargets = window.gameManager?.gameState?.playerCharacters?.filter(p => p && !p.isDead()) || [];
    console.log(`[ASTAROTH ABILITY DEBUG] Fetched ${validTargets.length} valid player targets from gameState.`);
    // --- END MODIFICATION ---

    if (validTargets.length === 0) {
        logAstaroth(`${caster.name}'s Explosion hits nothing!`);
        updateCharacterUI(caster); // Still update caster UI (e.g., mana change)
        return; // Exit if no valid targets
    }

    validTargets.forEach(target => {
        // --- Target Impact VFX ---
        const targetElementId = target.instanceId || target.id; // Use instance ID
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (targetElement) {
            const impactVfx = document.createElement('div');
            impactVfx.className = 'astaroth-explosion-impact-vfx'; 
            targetElement.appendChild(impactVfx);
            setTimeout(() => impactVfx.remove(), 1000);
        }
        // --- End VFX ---

        const result = target.applyDamage(baseDamage, 'magical', caster);
        logAstaroth(`${target.name} takes ${result.damage} magical damage from the Explosion.`, result.isCritical ? 'critical' : '');

        // Update UI for each target
        updateCharacterUI(target);
    });

    // Apply lifesteal once based on total damage dealt 
    const totalDamageDealt = validTargets.reduce((sum, target) => {
        // Re-simulate damage application for lifesteal calculation
        const simResult = target.calculateDamage(baseDamage, 'magical', caster);
        return sum + simResult.damage;
    }, 0);
    caster.applyLifesteal(totalDamageDealt);

    // Update caster UI
    updateCharacterUI(caster);
};

const astarothW = new Ability(
    'infernal_astaroth_w_explosion',
    'Explosion',
    'Icons/abilities/explosion.webp',
    75, // Mana cost
    3,  // Cooldown
    astarothExplosionEffect
).setDescription('Deals 600 (+100% MD) magical damage to all enemies.')
 .setTargetType('aoe_enemy');

// --- E: Molten Armor --- //
const astarothMoltenArmorEffect = (caster, target) => {
    logAstaroth(`${caster.name} engulfs itself in Molten Armor!`);

    // --- Molten Armor VFX --- (Placeholder)
    const casterElement = document.getElementById(`character-${caster.id}`);
    if (casterElement) {
        const vfx = document.createElement('div');
        vfx.className = 'astaroth-molten-armor-vfx'; // Use a specific class
        casterElement.appendChild(vfx);
        // Add class to element for persistent visual state?
        casterElement.classList.add('molten-armor-active');
    }
    // --- End VFX ---

    // Calculate flat bonus based on *base* stats to avoid recursive loops
    const baseArmor = caster.baseStats?.armor || caster.stats.armor; // Fallback if baseStats isn't populated yet
    const baseMS = caster.baseStats?.magicalShield || caster.stats.magicalShield;

    const bonusArmor = Math.floor(baseArmor * 0.5);
    const bonusMS = Math.floor(baseMS * 0.5);

    logAstaroth(`${caster.name} gains ${bonusArmor} Armor and ${bonusMS} Magic Shield.`);

    const moltenArmorBuff = new Effect(
        'infernal_astaroth_e_molten_armor_buff',
        'Molten Armor',
        'Icons/abilities/molten_armor.webp',
        5, // Duration: 5 turns
        null, // No per-turn effect needed
        false // isDebuff = false
    ).setDescription(`Gains ${bonusArmor} Armor and ${bonusMS} Magic Shield. Explodes on expiration.`);

    // Store the bonuses and caster's MD at the time of application
    moltenArmorBuff.customData = {
        appliedArmor: bonusArmor,
        appliedMS: bonusMS,
        casterMD: caster.stats.magicalDamage // Store MD for explosion
    };

    // Apply the flat stat bonuses
    moltenArmorBuff.statModifiers = {
        armor: bonusArmor,
        magicalShield: bonusMS
    };

    // Define the remove function (called when buff expires or is removed)
    moltenArmorBuff.remove = (character) => {
        console.log(`%c[ASTAROTH ABILITY DEBUG] Molten Armor remove() called for ${character?.name}`, 'color: red; font-weight: bold;');
        logAstaroth(`${character.name}'s Molten Armor shatters!`);

        // Find character element
        const charElement = document.getElementById(`character-${character.id}`);

        // Remove active class and VFX element
        if (charElement) {
            charElement.classList.remove('molten-armor-active');
            const vfxElement = charElement.querySelector('.astaroth-molten-armor-vfx');
            if (vfxElement) {
                vfxElement.remove();
            }
        }

        // Check if gameManager and necessary state exist
        if (!window.gameManager || !window.gameManager.gameState || !window.gameManager.gameState.playerCharacters) {
            console.error("Cannot trigger Molten Armor explosion: GameManager or player characters not found.");
            return;
        }

        // Use MD stored when the buff was applied, or current MD as fallback
        const explosionMD = moltenArmorBuff.customData?.casterMD || character.stats.magicalDamage;
        const explosionDamage = Math.floor(explosionMD * 0.5);

        logAstaroth(`The shattering armor explodes, dealing ${explosionDamage} magical damage to all enemies!`);

        const validTargets = window.gameManager.gameState.playerCharacters.filter(p => !p.isDead());

        validTargets.forEach(enemyTarget => {
            // --- Target Impact VFX --- (Placeholder)
            const targetElement = document.getElementById(`character-${enemyTarget.id}`);
            if (targetElement) {
                const impactVfx = document.createElement('div');
                impactVfx.className = 'astaroth-molten-armor-impact-vfx'; // Specific class
                targetElement.appendChild(impactVfx);
                setTimeout(() => impactVfx.remove(), 1000);
            }
            // --- End VFX ---

            const result = enemyTarget.applyDamage(explosionDamage, 'magical', character);
            logAstaroth(`${enemyTarget.name} takes ${result.damage} magical damage from the explosion.`, result.isCritical ? 'critical' : '');
            updateCharacterUI(enemyTarget);
        });
    };

    // Apply the buff
    console.log(`[ASTAROTH ABILITY DEBUG] Attempting to add buff ${moltenArmorBuff.id} to ${caster.name}`);
    caster.addBuff(moltenArmorBuff);
    console.log(`[ASTAROTH ABILITY DEBUG] Finished addBuff call.`);

    // Update UI
    updateCharacterUI(caster);
};

const astarothE = new Ability(
    'infernal_astaroth_e_molten_armor',
    'Molten Armor',
    'Icons/abilities/molten_armor.webp',
    60, // Mana cost
    8,  // Cooldown
    astarothMoltenArmorEffect
).setDescription('Grants 50% bonus Armor and Magic Shield for 5 turns. When the effect expires or is removed, deals 50% MD magical damage to all enemies.')
 .setTargetType('self');

// --- Register Abilities --- //
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        astarothQ,
        astarothW,
        astarothE
    ]);
} else {
    console.warn("Infernal Astaroth abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback registration
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.infernal_astaroth_q_blazing_ball = astarothQ;
    window.definedAbilities.infernal_astaroth_w_explosion = astarothW;
    window.definedAbilities.infernal_astaroth_e_molten_armor = astarothE;
} 