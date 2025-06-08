/**
 * Little Devil abilities implementation
 * Includes Mana Steal ability that steals 3% of target's mana and deals 7x that amount as damage
 */

/**
 * Little Devil Mana Steal ability effect
 * Steals 3% of target's current mana and deals 7x that amount as damage
 */
const littleDevilManaStealEffect = function(caster, target, abilityData) {
    console.log(`[ManaSteal] Ability used! Caster: ${caster?.name}, Target: ${target?.name}`);
    
    if (!target) {
        console.warn('[ManaSteal] No target provided!');
        return false;
    }
    
    if (!caster) {
        console.warn('[ManaSteal] No caster provided!');
        return false;
    }
    
    // Execute the mana steal effect directly
    return executeManaSteal(caster, target, abilityData);
};

/**
 * Actual implementation of Mana Steal ability
 */
function executeManaSteal(caster, target, abilityInstance) {
    // Get game manager for utility functions
    const gameManager = window.gameManager;
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : (typeof addLogEntry === 'function' ? addLogEntry : console.log);
    
    console.log('[ManaSteal] Starting executeManaSteal function');
    console.log('[ManaSteal] Caster:', caster?.name, 'Target:', target?.name);
    console.log('[ManaSteal] AbilityInstance:', abilityInstance?.id || abilityInstance?.name || 'Unknown');
    
    // Validate targets
    if (!caster || !target) {
        console.error(`[ManaSteal] Invalid parameters: caster=${!!caster}, target=${!!target}`);
        return false;
    }
    
    if (target.isDead()) {
        log(`${caster.name} tried to use Mana Steal, but the target is dead!`, "error");
        return false;
    }
    
    console.log('[ManaSteal] Target stats:', target.stats);
    console.log('[ManaSteal] Target current mana:', target.stats.currentMana);
    console.log('[ManaSteal] Caster stats:', caster.stats);
    console.log('[ManaSteal] Caster max mana:', caster.stats.maxMana);
    
    // Play mana steal sound effect
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/mana_drain.mp3', 0.7);
    }
    
    // Show mana steal VFX
    showManaStealVFX(caster, target);
    
    // Calculate mana steal amount (3% of target's current mana)
    const targetCurrentMana = target.stats.currentMana || 0;
    const manaStealPercent = 0.03; // 3%
    const manaToSteal = Math.floor(targetCurrentMana * manaStealPercent);
    
    // Calculate how much mana we can actually steal (don't go below 0)
    const actualManaStolen = Math.min(manaToSteal, targetCurrentMana);
    
    console.log(`[ManaSteal] Target has ${targetCurrentMana} mana, attempting to steal ${manaToSteal} (3%), actual stolen: ${actualManaStolen}`);
    
    if (actualManaStolen > 0) {
        // Reduce target's mana
        target.stats.currentMana -= actualManaStolen;
        
        // Increase caster's mana (capped at max mana)
        const originalCasterMana = caster.stats.currentMana;
        caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + actualManaStolen);
        const manaGainedByCaster = caster.stats.currentMana - originalCasterMana;
        
        // Calculate damage (7x the amount of mana stolen)
        const damageAmount = actualManaStolen * 7;
        
        console.log(`[ManaSteal] Calculated damage: ${damageAmount} (${actualManaStolen} * 7)`);
        console.log(`[ManaSteal] Applying damage to target...`);
        
        // Apply damage to the target (magical damage since it's mana-based)
        const damageResult = target.applyDamage(damageAmount, 'magical', caster);
        
        console.log(`[ManaSteal] Damage result:`, damageResult);
        console.log(`[ManaSteal] Actual damage dealt: ${damageResult.damage}`);
        
        // Log the effects
        log(`${caster.name} steals ${actualManaStolen} mana from ${target.name}!`);
        log(`${target.name} takes ${damageResult.damage} magical damage from the mana theft!`);
        
        // Update UI for both characters
        if (gameManager && gameManager.uiManager && typeof gameManager.uiManager.updateCharacterUI === 'function') {
            gameManager.uiManager.updateCharacterUI(caster);
            gameManager.uiManager.updateCharacterUI(target);
        } else if (typeof updateCharacterUI === 'function') {
            // Fallback to global function
            updateCharacterUI(caster);
            updateCharacterUI(target);
        }
        
        // Check if the target died from the damage
        if (target.isDead()) {
            log(`${target.name} has been defeated by the mana drain!`);
            if (gameManager) {
                gameManager.handleCharacterDeath(target);
            }
        }
        
        console.log('[ManaSteal] Mana steal completed successfully');
        return true;
    } else {
        // Target has no mana to steal
        log(`${target.name} has no mana to steal!`);
        console.log('[ManaSteal] No mana to steal, ability failed');
        return false;
    }
}

/**
 * Visual effects for mana steal ability
 */
function showManaStealVFX(caster, target) {
    // Add CSS styles for mana steal VFX if not already added
    if (!document.getElementById('mana-steal-styles')) {
        addManaStealStyles();
    }
    
    // Create mana steal visual effect
    const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
    
    if (casterElement && targetElement) {
        // Create energy drain effect from target to caster
        const drainEffect = document.createElement('div');
        drainEffect.className = 'mana-steal-effect';
        drainEffect.style.position = 'absolute';
        drainEffect.style.pointerEvents = 'none';
        drainEffect.style.zIndex = '1000';
        
        // Position the effect
        const targetRect = targetElement.getBoundingClientRect();
        const casterRect = casterElement.getBoundingClientRect();
        
        drainEffect.style.left = targetRect.left + targetRect.width / 2 + 'px';
        drainEffect.style.top = targetRect.top + targetRect.height / 2 + 'px';
        drainEffect.style.width = '4px';
        drainEffect.style.height = '4px';
        drainEffect.style.borderRadius = '50%';
        drainEffect.style.background = 'linear-gradient(45deg, #00ffff, #0080ff)';
        drainEffect.style.boxShadow = '0 0 10px #00ffff';
        
        document.body.appendChild(drainEffect);
        
        // Animate the drain effect
        const deltaX = casterRect.left + casterRect.width / 2 - (targetRect.left + targetRect.width / 2);
        const deltaY = casterRect.top + casterRect.height / 2 - (targetRect.top + targetRect.height / 2);
        
        drainEffect.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(2)`, opacity: 0.8 },
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            drainEffect.remove();
        };
        
        // Add glow effect to target (being drained)
        if (targetElement) {
            targetElement.style.filter = 'brightness(0.7) drop-shadow(0 0 10px #ff4444)';
            setTimeout(() => {
                targetElement.style.filter = '';
            }, 600);
        }
        
        // Add glow effect to caster (gaining mana)
        if (casterElement) {
            casterElement.style.filter = 'brightness(1.2) drop-shadow(0 0 10px #00ffff)';
            setTimeout(() => {
                casterElement.style.filter = '';
            }, 600);
        }
    }
}

/**
 * Add CSS styles for mana steal effects
 */
function addManaStealStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mana-steal-styles';
    styleSheet.textContent = `
        .mana-steal-effect {
            animation: manaPulse 0.8s ease-out forwards;
        }
        
        @keyframes manaPulse {
            0% {
                transform: scale(1);
                opacity: 1;
                box-shadow: 0 0 5px #00ffff;
            }
            50% {
                transform: scale(1.5);
                opacity: 0.9;
                box-shadow: 0 0 15px #00ffff, 0 0 25px #0080ff;
            }
            100% {
                transform: scale(0);
                opacity: 0;
                box-shadow: 0 0 30px #00ffff, 0 0 40px #0080ff;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

/**
 * Register all Little Devil abilities with the AbilityFactory
 */
function registerLittleDevilAbilities() {
    console.log('[LittleDevil] Registering Little Devil abilities...');
    
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        // Register the mana steal effect for both Little Devil characters
        window.AbilityFactory.registerAbilityEffect('littleDevilManaStealEffect', littleDevilManaStealEffect);
        
        // Also register by ability IDs
        window.AbilityFactory.registerAbilityEffect('little_devil_w', littleDevilManaStealEffect);
        window.AbilityFactory.registerAbilityEffect('little_devil_female_w', littleDevilManaStealEffect);
        
        console.log('[LittleDevil] Successfully registered Little Devil abilities');
    } else {
        console.warn('[LittleDevil] AbilityFactory not available, retrying in 1000ms...');
        setTimeout(registerLittleDevilAbilities, 1000);
    }
}

/**
 * Initialize the Little Devil abilities system
 */
function initializeLittleDevilAbilities() {
    console.log('[LittleDevil] Initializing Little Devil abilities...');
    
    // Wait for the DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerLittleDevilAbilities);
    } else {
        registerLittleDevilAbilities();
    }
}

// Auto-initialize when the script loads
initializeLittleDevilAbilities();

// Export functions for use by other modules
if (typeof window !== 'undefined') {
    window.littleDevilAbilities = {
        littleDevilManaStealEffect,
        executeManaSteal,
        showManaStealVFX,
        registerLittleDevilAbilities
    };
} 