class AssassinStealthAbilities {
    static showStealthVFX(caster) {
        const casterElementId = caster.instanceId || caster.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        
        if (!casterElement) {
            console.warn('Assassin Stealth VFX: Could not find caster element');
            return;
        }
        
        // Add stealth visual effect
        casterElement.classList.add('stealth-active');
        
        // Create smoke container for stealth effect
        const smokeContainer = document.createElement('div');
        smokeContainer.className = 'stealth-smoke-container';
        
        // Add multiple smoke particles
        for (let i = 0; i < 8; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'stealth-smoke';
            smoke.style.setProperty('--i', i);
            smoke.style.setProperty('--delay', `${i * 0.1}s`);
            smokeContainer.appendChild(smoke);
        }
        
        casterElement.appendChild(smokeContainer);
        
        // Add stealth shimmer effect
        const shimmer = document.createElement('div');
        shimmer.className = 'stealth-shimmer';
        casterElement.appendChild(shimmer);
        
        // Store references for cleanup
        casterElement.stealthSmokeContainer = smokeContainer;
        casterElement.stealthShimmer = shimmer;
        
        console.log(`Applied stealth VFX to ${caster.name}`);
    }
    
    static removeStealthVFX(character) {
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        
        if (!characterElement) {
            console.warn('Assassin Stealth VFX: Could not find character element for removal');
            return;
        }
        
        // Remove stealth visual effect
        characterElement.classList.remove('stealth-active');
        
        // Remove smoke container
        if (characterElement.stealthSmokeContainer) {
            characterElement.stealthSmokeContainer.remove();
            characterElement.stealthSmokeContainer = null;
        }
        
        // Remove shimmer effect
        if (characterElement.stealthShimmer) {
            characterElement.stealthShimmer.remove();
            characterElement.stealthShimmer = null;
        }
        
        console.log(`Removed stealth VFX from ${character.name}`);
    }
}

// Effect function for Stealth (simplified version of Shadow Veil)
const stealthEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Untargetable buff for 2 turns
    const untargetableBuff = {
        id: 'stealth_untargetable',
        name: 'Stealth',
        icon: 'Icons/abilities/shadow_step.png',
        duration: 2,
        effect: (target) => {},
        onApply: (target) => {
            // Apply visual effects when stealth is activated
            AssassinStealthAbilities.showStealthVFX(target);
        },
        onRemove: (target) => {
            // Remove visual effects when stealth ends
            AssassinStealthAbilities.removeStealthVFX(target);
        },
        isDebuff: false,
        isUntargetableByEnemies: true,
        description: "Untargetable by enemies only."
    };

    // Create and apply the untargetable effect
    const untargetableEffect = new Effect(
        untargetableBuff.id, 
        untargetableBuff.name, 
        untargetableBuff.icon, 
        untargetableBuff.duration, 
        untargetableBuff.effect, 
        untargetableBuff.isDebuff
    );
    
    untargetableEffect.isUntargetableByEnemies = untargetableBuff.isUntargetableByEnemies;
    untargetableEffect.onApply = untargetableBuff.onApply;
    untargetableEffect.onRemove = untargetableBuff.onRemove;
    untargetableEffect.setDescription(untargetableBuff.description);

    caster.addBuff(untargetableEffect);

    // Track statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'stealth', 'use', 1);
        window.statisticsManager.recordAbilityUsage(caster, 'stealth', 'buff', 1);
        window.statisticsManager.recordStatusEffect(caster, caster, 'buff', 'stealth_untargetable', false, 'stealth');
    }

    log(`${caster.name} uses Stealth and becomes untargetable!`, 'ability');
    playSound('sounds/shadow_step.mp3', 0.7);

    // Update UI for caster
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    return true;
};

// Create Ability object for Stealth
const stealthAbility = new Ability(
    'stealth',
    'Stealth',
    'Icons/abilities/shadow_step.png',
    60, // Mana cost
    5,  // Cooldown
    stealthEffect
).setDescription('Become untargetable by enemies for 2 turns.')
 .setTargetType('self');

// Register the stealth ability
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilities) {
        // Register stealth ability
        AbilityFactory.registerAbilities([stealthAbility]);
    } else {
        console.warn("Stealth ability defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.stealth = stealthAbility;
    }
    
    // Make the class globally available
    window.AssassinStealthAbilities = AssassinStealthAbilities;
}); 