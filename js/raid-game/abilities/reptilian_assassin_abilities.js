/**
 * Reptilian Assassin Abilities Implementation
 * Contains custom ability effects for the Reptilian Assassin character
 */

/**
 * Venomous Blade Effect - Deals damage and applies stacking poison debuff
 * @param {Character} caster - The character using the ability
 * @param {Character} target - The target character
 * @param {Object} abilityData - The ability data from JSON
 */
const venomousBladEffect = (caster, target, abilityData) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name}'s Venomous Blade has no valid target!`, 'error');
        return false;
    }

    const baseDamage = 420;
    const poisonDamage = 420;
    const poisonDuration = 3;

    log(`${caster.name} strikes ${target.name} with a venomous blade!`, 'ability');

    // Show venomous blade VFX
    showVenomousBladeVFX(caster, target);

    // Apply initial physical damage
    const damageResult = target.applyDamage(baseDamage, 'physical', caster, {
        abilityId: abilityData.id
    });

    // Log initial damage
    log(`${target.name} takes ${damageResult.damage} physical damage from the venomous strike${damageResult.isCritical ? ' (Critical!)' : ''}!`, 
        damageResult.isCritical ? 'critical' : 'damage');

    // Only apply poison if the attack wasn't dodged
    if (!damageResult.isDodged) {
        // Create poison debuff - each instance is separate for stacking
        const poisonDebuff = new Effect(
            `venomous_blade_poison_${target.instanceId || target.id}_${Date.now()}`, // Unique ID for each stack
            'Venomous Poison',
            'Icons/abilities/venomous_blade.png', // Same icon as the ability
            poisonDuration,
            {
                type: 'damage_over_time',
                value: poisonDamage
            },
            true // isDebuff
        );

        // Count existing poison stacks for display
        const existingStacks = target.debuffs.filter(d => d.name === 'Venomous Poison').length;
        const newStackCount = existingStacks + 1;

        poisonDebuff.setDescription(`Takes ${poisonDamage} poison damage per turn. (Stack ${newStackCount})`);
        poisonDebuff.stackNumber = newStackCount;

        // Add enhanced DOT tracking for statistics
        poisonDebuff.onTurnStart = (character) => {
            if (character.isDead()) return;
            
            // Apply poison damage with proper damage tracking
            const dotResult = character.applyDamage(poisonDamage, 'magical', caster, {
                abilityId: 'venomous_blade_poison',
                isDOT: true
            });
            
            log(`${character.name} suffers ${dotResult.damage} poison damage! (Venomous Poison)`, 'debuff');
            
            // Show poison damage VFX
            showPoisonDamageVFX(character, dotResult.damage);
            
            // Check if character died from poison
            if (character.isDead()) {
                log(`${character.name} succumbed to venomous poison!`, 'death');
                if (window.gameManager) {
                    window.gameManager.handleCharacterDeath(character);
                }
            }
        };

        // Add visual effect when poison is applied
        poisonDebuff.onApply = (character) => {
            showPoisonApplicationVFX(character, newStackCount);
        };

        // Clean up poison VFX when debuff is removed
        poisonDebuff.remove = function(character) {
            const remainingStacks = character.debuffs.filter(d => d.name === 'Venomous Poison' && d.id !== this.id).length;
            log(`Venomous poison fades from ${character.name}. (${remainingStacks} stacks remaining)`, 'debuff');
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(character);
            } else if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }
        };

        // Apply the poison debuff
        target.addDebuff(poisonDebuff);
        log(`${target.name} is poisoned! (${newStackCount} stack${newStackCount > 1 ? 's' : ''} total)`, 'debuff');
    } else {
        log(`${target.name} dodged the venomous blade completely!`);
    }

    // Play sound effect
    playSound('sounds/venomous_blade.mp3', 0.8);

    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
        window.gameManager.uiManager.updateCharacterUI(caster);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        updateCharacterUI(caster);
    }

    return true;
};

/**
 * Show VFX for the venomous blade attack
 */
function showVenomousBladeVFX(caster, target) {
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    
    if (!targetElement || !casterElement) return;

    // Create blade strike VFX
    const bladeVfx = document.createElement('div');
    bladeVfx.className = 'venomous-blade-strike-vfx';
    targetElement.appendChild(bladeVfx);

    // Create poison trail VFX
    const poisonTrail = document.createElement('div');
    poisonTrail.className = 'venomous-blade-trail-vfx';
    targetElement.appendChild(poisonTrail);

    // Screen shake effect
    if (document.body) {
        document.body.classList.add('venomous-blade-shake');
        setTimeout(() => {
            document.body.classList.remove('venomous-blade-shake');
        }, 300);
    }

    // Clean up VFX
    setTimeout(() => {
        if (bladeVfx.parentNode) bladeVfx.remove();
        if (poisonTrail.parentNode) poisonTrail.remove();
    }, 2000);
}

/**
 * Show VFX when poison is applied
 */
function showPoisonApplicationVFX(character, stackCount) {
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    
    if (!characterElement) return;

    // Create poison application VFX
    const poisonVfx = document.createElement('div');
    poisonVfx.className = 'poison-application-vfx';
    poisonVfx.innerHTML = '☠️';
    characterElement.appendChild(poisonVfx);

    // Stack indicator
    if (stackCount > 1) {
        const stackIndicator = document.createElement('div');
        stackIndicator.className = 'poison-stack-indicator';
        stackIndicator.textContent = `${stackCount}x`;
        characterElement.appendChild(stackIndicator);
        
        setTimeout(() => {
            if (stackIndicator.parentNode) stackIndicator.remove();
        }, 2000);
    }

    // Clean up VFX
    setTimeout(() => {
        if (poisonVfx.parentNode) poisonVfx.remove();
    }, 2000);
}

/**
 * Show VFX for poison damage over time
 */
function showPoisonDamageVFX(character, damage) {
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    
    if (!characterElement) return;

    // Create poison damage VFX
    const poisonDamageVfx = document.createElement('div');
    poisonDamageVfx.className = 'poison-damage-vfx';
    poisonDamageVfx.innerHTML = `
        <div class="poison-damage-text">-${damage}</div>
        <div class="poison-particles">💀☠️💀</div>
    `;
    characterElement.appendChild(poisonDamageVfx);

    // Add poison glow to character
    characterElement.classList.add('poisoned-glow');
    setTimeout(() => {
        characterElement.classList.remove('poisoned-glow');
    }, 1000);

    // Clean up VFX
    setTimeout(() => {
        if (poisonDamageVfx.parentNode) poisonDamageVfx.remove();
    }, 2000);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.venomousBladEffect = venomousBladEffect;
    window.showVenomousBladeVFX = showVenomousBladeVFX;
    window.showPoisonApplicationVFX = showPoisonApplicationVFX;
    window.showPoisonDamageVFX = showPoisonDamageVFX;
}

// Register the ability effect with AbilityFactory when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Reptilian Assassin] Registering abilities...');
    
    const registerEffects = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
            // Register with function name (used by JSON)
            AbilityFactory.registerAbilityEffect('venomousBladEffect', venomousBladEffect);
            
            // Also register with ability ID
            AbilityFactory.registerAbilityEffect('venomous_blade', venomousBladEffect);
            
            console.log('[Reptilian Assassin] Successfully registered Venomous Blade effect');
        } else {
            console.warn('[Reptilian Assassin] AbilityFactory not available, retrying in 100ms...');
            setTimeout(registerEffects, 100);
        }
    };
    
    registerEffects();
});

console.log('[Reptilian Assassin] Abilities loaded successfully'); 