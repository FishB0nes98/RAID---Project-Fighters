// infernal_astaroth_abilities.js - Handles Infernal Astaroth's ability effects

/**
 * Infernal Astaroth Ability Effects
 * Compatible with the current game engine
 */

// Helper function for logging
const logAstaroth = (message, type = '') => {
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(message, type);
    } else {
        console.log(message);
    }
};

// Helper function to update character UI
const updateAstarothCharacterUI = (character) => {
    if (window.gameManager && window.gameManager.uiManager && window.gameManager.uiManager.updateCharacterUI) {
        window.gameManager.uiManager.updateCharacterUI(character);
    }
};

// --- Q: Blazing Ball Effect ---
window.infernalAstarothBlazingBallEffect = function(caster, targetOrTargets, abilityObject, actualManaCost, options = {}) {
    // Handle single target (extract from array if needed)
    const target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
    
    console.log(`[Astaroth] Blazing Ball effect called. Caster: ${caster?.name}, Target: ${target?.name}`);
    
    if (!target || target.isDead()) {
        logAstaroth("Blazing Ball failed: No valid target!", "error");
        return { success: false };
    }

    logAstaroth(`${caster.name} hurls a massive Blazing Ball at ${target.name}!`);

    // Create blazing ball VFX
    createBlazingBallVFX(caster, target);

    // Fixed damage of 1200 magical
    const fixedDamage = 1200;
    const result = target.applyDamage(fixedDamage, 'magical', caster, options);
    
    logAstaroth(`${target.name} takes ${result.damage} magical damage from Blazing Ball!`, result.isCritical ? 'critical' : '');

    // Apply lifesteal if any
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(result.damage);
    }

    // Update UI
    updateAstarothCharacterUI(target);
    updateAstarothCharacterUI(caster);

    return { success: true, damage: result.damage };
};

// --- W: Explosion Effect ---
window.infernalAstarothExplosionEffect = function(caster, targetOrTargets, abilityObject, actualManaCost, options = {}) {
    console.log(`[Astaroth] Explosion effect called. Caster: ${caster?.name}, Targets:`, targetOrTargets);
    
    logAstaroth(`${caster.name} unleashes a devastating Explosion!`);

    // Get valid targets - use passed targets if available, otherwise get all opponents
    let validTargets = [];
    
    if (targetOrTargets && Array.isArray(targetOrTargets)) {
        // Use the targets passed by the system (for AI)
        validTargets = targetOrTargets.filter(target => target && !target.isDead());
        console.log(`[Astaroth] Using passed targets: ${validTargets.length} targets`);
    } else if (targetOrTargets && !Array.isArray(targetOrTargets)) {
        // Single target passed
        validTargets = [targetOrTargets].filter(target => target && !target.isDead());
        console.log(`[Astaroth] Using single passed target`);
    } else {
        // Fallback: get all opponents (for manual cast)
        if (window.gameManager && window.gameManager.getOpponents) {
            validTargets = window.gameManager.getOpponents(caster).filter(target => !target.isDead());
        } else if (window.gameManager && window.gameManager.gameState && window.gameManager.gameState.playerCharacters) {
            validTargets = window.gameManager.gameState.playerCharacters.filter(target => !target.isDead());
        }
        console.log(`[Astaroth] Using fallback opponent detection: ${validTargets.length} targets`);
    }

    console.log(`[Astaroth] Found ${validTargets.length} valid targets for Explosion`);

    if (validTargets.length === 0) {
        logAstaroth(`${caster.name}'s Explosion hits nothing!`);
        updateAstarothCharacterUI(caster);
        return { success: false };
    }

    // Create explosion VFX
    createExplosionVFX(caster);

    // Calculate damage: 600 + 100% MD
    const baseDamage = 600;
    const magicalDamageBonus = caster.stats.magicalDamage || 0;
    const totalDamage = baseDamage + magicalDamageBonus;

    let totalDamageDealt = 0;

    validTargets.forEach(target => {
        // Create impact VFX for each target
        createExplosionImpactVFX(target);

        const result = target.applyDamage(totalDamage, 'magical', caster, options);
        logAstaroth(`${target.name} takes ${result.damage} magical damage from the Explosion!`, result.isCritical ? 'critical' : '');
        
        totalDamageDealt += result.damage;
        updateAstarothCharacterUI(target);
    });

    // Apply lifesteal based on total damage dealt
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(totalDamageDealt);
    }

    updateAstarothCharacterUI(caster);

    return { success: true, totalDamage: totalDamageDealt, targetsHit: validTargets.length };
};

// --- E: Molten Armor Effect ---
window.infernalAstarothMoltenArmorEffect = function(caster, targetOrTargets, abilityObject, actualManaCost, options = {}) {
    console.log(`[Astaroth] Molten Armor effect called. Caster: ${caster?.name}`);
    
    logAstaroth(`${caster.name} engulfs itself in Molten Armor!`);

    // Create molten armor VFX
    createMoltenArmorVFX(caster);

    // Calculate bonuses based on base stats (50% bonus)
    const baseArmor = caster.baseStats?.armor || caster.stats.armor;
    const baseMagicalShield = caster.baseStats?.magicalShield || caster.stats.magicalShield;
    
    const bonusArmor = Math.floor(baseArmor * 0.5);
    const bonusMagicalShield = Math.floor(baseMagicalShield * 0.5);

    logAstaroth(`${caster.name} gains ${bonusArmor} Armor and ${bonusMagicalShield} Magic Shield!`);

    // Create the Molten Armor buff using the Effect class
    const moltenArmorBuff = new Effect(
        'infernal_astaroth_molten_armor_buff',
        'Molten Armor',
        'Icons/abilities/molten_armor.webp',
        5, // Duration: 5 turns
        null, // No per-turn effect
        false // isDebuff = false
    ).setDescription(`Gains ${bonusArmor} Armor and ${bonusMagicalShield} Magic Shield. Explodes when removed.`);

    // Store the bonuses and caster's MD for explosion
    moltenArmorBuff.customData = {
        appliedArmor: bonusArmor,
        appliedMagicalShield: bonusMagicalShield,
        casterMD: caster.stats.magicalDamage // Store MD for explosion
    };

    // Apply stat modifiers
    moltenArmorBuff.statModifiers = [
        { stat: 'armor', value: bonusArmor, operation: 'add' },
        { stat: 'magicalShield', value: bonusMagicalShield, operation: 'add' }
    ];

    // Define the remove function (called when buff expires or is removed)
    moltenArmorBuff.remove = function(character) {
        console.log(`[Astaroth] Molten Armor remove() called for ${character?.name}`);
        logAstaroth(`${character.name}'s Molten Armor shatters and explodes!`);

        // Remove VFX
        removeMoltenArmorVFX(character);

        // Get explosion damage (50% of stored MD)
        const explosionMD = this.customData?.casterMD || character.stats.magicalDamage;
        const explosionDamage = Math.floor(explosionMD * 0.5);

        if (explosionDamage > 0) {
            logAstaroth(`The shattering armor explodes, dealing ${explosionDamage} magical damage to all enemies!`);

            // Get all valid enemy targets
            let validTargets = [];
            if (window.gameManager && window.gameManager.getOpponents) {
                validTargets = window.gameManager.getOpponents(character).filter(target => !target.isDead());
            } else if (window.gameManager && window.gameManager.gameState && window.gameManager.gameState.playerCharacters) {
                validTargets = window.gameManager.gameState.playerCharacters.filter(target => !target.isDead());
            }

            validTargets.forEach(enemyTarget => {
                // Create explosion impact VFX
                createMoltenArmorExplosionVFX(enemyTarget);

                const result = enemyTarget.applyDamage(explosionDamage, 'magical', character);
                logAstaroth(`${enemyTarget.name} takes ${result.damage} magical damage from the explosion!`, result.isCritical ? 'critical' : '');
                updateAstarothCharacterUI(enemyTarget);
            });
        }
    };

    // Apply the buff
    caster.addBuff(moltenArmorBuff);

    // Update UI
    updateAstarothCharacterUI(caster);

    return { success: true, armorBonus: bonusArmor, magicalShieldBonus: bonusMagicalShield };
};

// --- VFX Functions ---

function createBlazingBallVFX(caster, target) {
    if (!caster || !target) return;
    
    // Find the DOM elements
    const casterElementId = caster.instanceId || caster.id;
    const targetElementId = target.instanceId || target.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    const targetElement = document.getElementById(`character-${targetElementId}`);
    
    if (!casterElement || !targetElement) return;
    
    // Create the blazing ball element
    const blazingBall = document.createElement('div');
    blazingBall.className = 'blazing-ball-vfx';
    blazingBall.style.cssText = `
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle, #ff6600, #ff0000);
        border-radius: 50%;
        box-shadow: 0 0 20px #ff6600;
        z-index: 20;
        animation: blazing-ball-travel 0.8s ease-out forwards;
    `;
    
    // Get positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const battleContainer = document.querySelector('.battle-container');
    const battleRect = battleContainer.getBoundingClientRect();
    
    // Position at caster's center
    const startX = casterRect.left + (casterRect.width / 2) - battleRect.left;
    const startY = casterRect.top + (casterRect.height / 2) - battleRect.top;
    
    blazingBall.style.left = `${startX}px`;
    blazingBall.style.top = `${startY}px`;
    
    // Calculate travel distance
    const travelX = targetRect.left - casterRect.left;
    const travelY = targetRect.top - casterRect.top;
    blazingBall.style.setProperty('--travel-x', `${travelX}px`);
    blazingBall.style.setProperty('--travel-y', `${travelY}px`);
    
    // Add CSS animation if not exists
    if (!document.querySelector('#blazing-ball-style')) {
        const style = document.createElement('style');
        style.id = 'blazing-ball-style';
        style.textContent = `
            @keyframes blazing-ball-travel {
                0% { transform: translate(0, 0) scale(1); }
                100% { transform: translate(var(--travel-x), var(--travel-y)) scale(1.5); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    battleContainer.appendChild(blazingBall);
    
    // Play sound
    if (window.gameManager && window.gameManager.playSound) {
        window.gameManager.playSound('sounds/fire_blast.mp3', 0.7);
    }
    
    // Remove after animation
    setTimeout(() => {
        blazingBall.remove();
        
        // Add impact effect
        const impactEffect = document.createElement('div');
        impactEffect.className = 'blazing-ball-impact';
        impactEffect.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle, rgba(255,165,0,0.8) 0%, rgba(255,60,0,0.4) 50%, rgba(255,0,0,0) 100%);
            box-shadow: 0 0 30px 20px rgba(255, 60, 0, 0.6);
            border-radius: 50%;
            animation: impact-pulse 0.5s ease-out forwards;
            z-index: 15;
            pointer-events: none;
        `;
        
        targetElement.appendChild(impactEffect);
        setTimeout(() => impactEffect.remove(), 500);
    }, 800);
}

function createExplosionVFX(caster) {
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (!casterElement) return;
    
    const vfx = document.createElement('div');
    vfx.className = 'astaroth-explosion-vfx';
    vfx.style.cssText = `
        position: absolute;
        top: -50%; left: -50%; width: 200%; height: 200%;
        background: radial-gradient(circle, rgba(255,100,0,0.9) 0%, rgba(255,0,0,0.6) 30%, rgba(0,0,0,0) 70%);
        border-radius: 50%;
        animation: explosion-expand 1.5s ease-out forwards;
        z-index: 15;
        pointer-events: none;
    `;
    
    // Add CSS animation if not exists
    if (!document.querySelector('#explosion-style')) {
        const style = document.createElement('style');
        style.id = 'explosion-style';
        style.textContent = `
            @keyframes explosion-expand {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    casterElement.appendChild(vfx);
    setTimeout(() => vfx.remove(), 1500);
}

function createExplosionImpactVFX(target) {
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (!targetElement) return;
    
    const impactVfx = document.createElement('div');
    impactVfx.className = 'astaroth-explosion-impact-vfx';
    impactVfx.style.cssText = `
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(circle, rgba(255,80,0,0.7) 0%, rgba(255,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
        border-radius: 50%;
        animation: impact-pulse 1s ease-out forwards;
        z-index: 15;
        pointer-events: none;
    `;
    
    targetElement.appendChild(impactVfx);
    setTimeout(() => impactVfx.remove(), 1000);
}

function createMoltenArmorVFX(caster) {
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (!casterElement) return;
    
    const vfx = document.createElement('div');
    vfx.className = 'astaroth-molten-armor-vfx';
    vfx.style.cssText = `
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(45deg, rgba(255,100,0,0.3), rgba(255,0,0,0.3));
        border: 2px solid #ff6600;
        border-radius: 10px;
        box-shadow: 0 0 15px #ff6600;
        animation: molten-armor-glow 2s ease-in-out infinite alternate;
        z-index: 10;
        pointer-events: none;
    `;
    
    // Add CSS animation if not exists
    if (!document.querySelector('#molten-armor-style')) {
        const style = document.createElement('style');
        style.id = 'molten-armor-style';
        style.textContent = `
            @keyframes molten-armor-glow {
                0% { box-shadow: 0 0 15px #ff6600; }
                100% { box-shadow: 0 0 25px #ff3300; }
            }
            @keyframes impact-pulse {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    casterElement.appendChild(vfx);
    casterElement.classList.add('molten-armor-active');
}

function removeMoltenArmorVFX(character) {
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    if (!characterElement) return;
    
    characterElement.classList.remove('molten-armor-active');
    const vfxElement = characterElement.querySelector('.astaroth-molten-armor-vfx');
    if (vfxElement) {
        vfxElement.remove();
    }
}

function createMoltenArmorExplosionVFX(target) {
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (!targetElement) return;
    
    const impactVfx = document.createElement('div');
    impactVfx.className = 'astaroth-molten-armor-impact-vfx';
    impactVfx.style.cssText = `
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(circle, rgba(255,165,0,0.8) 0%, rgba(255,60,0,0.4) 50%, rgba(255,0,0,0) 100%);
        border-radius: 50%;
        animation: impact-pulse 1s ease-out forwards;
        z-index: 15;
        pointer-events: none;
    `;
    
    targetElement.appendChild(impactVfx);
    setTimeout(() => impactVfx.remove(), 1000);
}

// Initialize burning ground effect for the burning_school_gym stage
window.initializeBurningGroundEffect = function() {
    if (document.querySelector('.burning-ground-container')) {
        console.log("Burning ground effect already initialized.");
        return;
    }

    const bottomSection = document.querySelector('.bottom-section');
    if (!bottomSection) return;
    
    const burningGroundContainer = document.createElement('div');
    burningGroundContainer.className = 'burning-ground-container';
    burningGroundContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50px;
        background: linear-gradient(to top, rgba(255,100,0,0.6), rgba(255,0,0,0.3), transparent);
        z-index: 5;
        pointer-events: none;
    `;
    
    const burningGroundVFX = document.createElement('div');
    burningGroundVFX.className = 'burning-ground-vfx';
    burningGroundVFX.style.cssText = `
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            90deg,
            rgba(255,100,0,0.3) 0px,
            rgba(255,0,0,0.3) 10px,
            rgba(255,100,0,0.3) 20px
        );
        animation: burning-ground-flicker 1s ease-in-out infinite alternate;
    `;
    
    // Add CSS animation if not exists
    if (!document.querySelector('#burning-ground-style')) {
        const style = document.createElement('style');
        style.id = 'burning-ground-style';
        style.textContent = `
            @keyframes burning-ground-flicker {
                0% { opacity: 0.6; }
                100% { opacity: 1; }
            }
            .ember {
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #ff6600, #ff0000);
                border-radius: 50%;
                animation: ember-rise linear;
                pointer-events: none;
            }
            @keyframes ember-rise {
                0% { bottom: 0; opacity: 1; }
                100% { bottom: 100px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    burningGroundContainer.appendChild(burningGroundVFX);
    bottomSection.appendChild(burningGroundContainer);
    
    // Add random floating embers
    setInterval(() => {
        if (!document.contains(burningGroundContainer)) return;
        
        const ember = document.createElement('div');
        ember.className = 'ember';
        ember.style.left = `${Math.random() * 100}%`;
        ember.style.opacity = 0.3 + Math.random() * 0.7;
        
        const size = 3 + Math.random() * 4;
        ember.style.width = `${size}px`;
        ember.style.height = `${size}px`;
        
        const duration = 1 + Math.random() * 2;
        ember.style.animationDuration = `${duration}s`;
        
        burningGroundContainer.appendChild(ember);
        
        setTimeout(() => {
            if (ember.parentNode === burningGroundContainer) {
                ember.remove();
            }
        }, duration * 1000);
    }, 200);
};

// Register the ability effects with AbilityFactory
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilityEffect === 'function') {
    AbilityFactory.registerAbilityEffect('infernalAstarothBlazingBallEffect', window.infernalAstarothBlazingBallEffect);
    AbilityFactory.registerAbilityEffect('infernalAstarothExplosionEffect', window.infernalAstarothExplosionEffect);
    AbilityFactory.registerAbilityEffect('infernalAstarothMoltenArmorEffect', window.infernalAstarothMoltenArmorEffect);
    console.log('[Infernal Astaroth] Abilities registered with AbilityFactory');
} else {
    console.warn('[Infernal Astaroth] AbilityFactory not found or registerAbilityEffect method missing');
}

console.log('[Infernal Astaroth] Abilities loaded successfully'); 