/**
 * Octopus Assassin Abilities Implementation
 * Contains custom ability effects for the Octopus Assassin character
 */

/**
 * Drain Life Effect - Steals 2% of enemy's current HP and restores it to the caster
 * @param {Character} caster - The character using the ability
 * @param {Character} target - The target character
 * @param {Object} abilityData - The ability data from JSON
 */
const drainLifeEffect = (caster, target, abilityData) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name}'s Drain Life has no valid target!`, 'error');
        return false;
    }

    const drainPercent = 0.02; // 2%
    const targetCurrentHp = target.stats.currentHp || 0;

    log(`${caster.name} extends dark tentacles toward ${target.name}, draining their life force!`, 'ability');

    // Show drain life VFX
    showDrainLifeVFX(caster, target);

    // Calculate HP to drain (2% of target's current HP)
    const hpToDrain = Math.floor(targetCurrentHp * drainPercent);
    
    if (hpToDrain <= 0) {
        log(`${target.name} has no life force left to drain!`, 'system');
        return false;
    }

    // Apply drain damage to target (as magical damage)
    const damageResult = target.applyDamage(hpToDrain, 'magical', caster, {
        abilityId: abilityData.id,
        isDrainLife: true
    });

    // Log the drain damage
    log(`${target.name} loses ${damageResult.damage} HP to the life drain${damageResult.isCritical ? ' (Critical!)' : ''}!`, 
        damageResult.isCritical ? 'critical' : 'damage');

    // Only apply healing if the drain wasn't dodged
    if (!damageResult.isDodged && damageResult.damage > 0) {
        // Heal the caster for the amount of HP drained
        const casterCurrentHp = caster.stats.currentHp || 0;
        const casterMaxHp = caster.stats.maxHp || caster.stats.hp || 0;
        const healAmount = damageResult.damage; // Use actual damage dealt
        
        // Apply healing (capped at max HP)
        const newHp = Math.min(casterCurrentHp + healAmount, casterMaxHp);
        const actualHealAmount = newHp - casterCurrentHp;
        
        if (actualHealAmount > 0) {
            caster.stats.currentHp = newHp;
            log(`${caster.name} absorbs ${actualHealAmount} HP from the drained life force!`, 'heal');
            
            // Show absorption VFX
            showLifeAbsorptionVFX(caster, actualHealAmount);
        } else {
            log(`${caster.name} is already at full health and cannot absorb more life force.`, 'system');
        }
    } else if (damageResult.isDodged) {
        log(`${target.name} evaded the life drain completely!`);
    }

    // Play sound effect
    playSound('sounds/drain_life.mp3', 0.8);

    // Update UI for both characters
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
 * Show VFX for the drain life attack
 */
function showDrainLifeVFX(caster, target) {
    // Try multiple ways to find the target element
    const targetElementId = target.instanceId || target.id;
    let targetElement = document.getElementById(`character-${targetElementId}`);
    
    // If not found, try alternative selectors
    if (!targetElement) {
        targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
    }
    if (!targetElement) {
        targetElement = document.querySelector(`[data-character-id="${targetElementId}"]`);
    }
    
    // Try multiple ways to find the caster element
    const casterElementId = caster.instanceId || caster.id;
    let casterElement = document.getElementById(`character-${casterElementId}`);
    
    // If not found, try alternative selectors
    if (!casterElement) {
        casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
    }
    if (!casterElement) {
        casterElement = document.querySelector(`[data-character-id="${casterElementId}"]`);
    }
    
    console.log(`[Drain Life VFX] Caster: ${caster.name} (${casterElementId})`, casterElement);
    console.log(`[Drain Life VFX] Target: ${target.name} (${targetElementId})`, targetElement);
    
    if (!targetElement || !casterElement) {
        console.error(`[Drain Life VFX] Could not find elements - Caster: ${!!casterElement}, Target: ${!!targetElement}`);
        return;
    }

    // Create drain beam VFX from target to caster
    const drainBeam = document.createElement('div');
    drainBeam.className = 'drain-life-beam-vfx';
    
    // Position the beam from caster to target
    const targetRect = targetElement.getBoundingClientRect();
    const casterRect = casterElement.getBoundingClientRect();
    
    console.log(`[Drain Life VFX] Caster rect:`, casterRect);
    console.log(`[Drain Life VFX] Target rect:`, targetRect);
    
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    // Safety check for invalid positions
    if (distance < 10 || !isFinite(distance) || !isFinite(angle)) {
        console.error(`[Drain Life VFX] Invalid beam calculation - distance: ${distance}, angle: ${angle}`);
        console.error(`[Drain Life VFX] Start: (${startX}, ${startY}), End: (${endX}, ${endY})`);
        
        // Fallback: Just show the aura effects without the beam
        const drainAura = document.createElement('div');
        drainAura.className = 'drain-life-aura-vfx';
        targetElement.appendChild(drainAura);

        const casterGlow = document.createElement('div');
        casterGlow.className = 'drain-life-caster-glow';
        casterElement.appendChild(casterGlow);

        setTimeout(() => {
            if (drainAura.parentNode) drainAura.remove();
            if (casterGlow.parentNode) casterGlow.remove();
        }, 2500);
        
        return;
    }
    
    drainBeam.style.position = 'fixed';
    drainBeam.style.left = startX + 'px';
    drainBeam.style.top = (startY - 4) + 'px'; // Center the beam vertically
    drainBeam.style.width = distance + 'px';
    drainBeam.style.height = '8px';
    drainBeam.style.transformOrigin = '0 50%';
    drainBeam.style.transform = `rotate(${angle}deg)`;
    drainBeam.style.pointerEvents = 'none';
    drainBeam.style.zIndex = '1000';
    
    console.log(`[Drain Life VFX] Beam from (${startX}, ${startY}) to (${endX}, ${endY}), distance: ${distance}px, angle: ${angle}deg`);
    
    document.body.appendChild(drainBeam);

    // Create drain aura on target
    const drainAura = document.createElement('div');
    drainAura.className = 'drain-life-aura-vfx';
    targetElement.appendChild(drainAura);

    // Create caster glow effect
    const casterGlow = document.createElement('div');
    casterGlow.className = 'drain-life-caster-glow';
    casterElement.appendChild(casterGlow);

    // Apply drain effect to target
    const originalFilter = targetElement.style.filter || '';
    targetElement.style.filter = 'brightness(0.6) contrast(0.9) saturate(0.5) hue-rotate(20deg)';

    // Apply absorption effect to caster
    const originalCasterFilter = casterElement.style.filter || '';
    casterElement.style.filter = 'brightness(1.3) contrast(1.1) saturate(1.2) drop-shadow(0 0 15px #ff4444)';

    // Clean up VFX after animation
    setTimeout(() => {
        if (drainBeam.parentNode) drainBeam.remove();
        if (drainAura.parentNode) drainAura.remove();
        if (casterGlow.parentNode) casterGlow.remove();
        
        // Restore original filters
        targetElement.style.filter = originalFilter;
        casterElement.style.filter = originalCasterFilter;
    }, 2500);
}

/**
 * Show VFX for life absorption by the caster
 */
function showLifeAbsorptionVFX(caster, healAmount) {
    const casterElementId = caster.instanceId || caster.id;
    let casterElement = document.getElementById(`character-${casterElementId}`);
    
    // Try alternative selectors if not found
    if (!casterElement) {
        casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
    }
    if (!casterElement) {
        casterElement = document.querySelector(`[data-character-id="${casterElementId}"]`);
    }
    
    if (!casterElement) {
        console.error(`[Life Absorption VFX] Could not find caster element for ${caster.name}`);
        return;
    }

    // Create absorption particles
    const absorptionVfx = document.createElement('div');
    absorptionVfx.className = 'life-absorption-vfx';
    absorptionVfx.innerHTML = `
        <div class="absorption-particles"></div>
        <div class="heal-amount">+${healAmount}</div>
    `;
    casterElement.appendChild(absorptionVfx);

    // Add healing glow to caster
    casterElement.classList.add('life-absorption-glow');
    setTimeout(() => {
        casterElement.classList.remove('life-absorption-glow');
    }, 1500);

    // Clean up VFX
    setTimeout(() => {
        if (absorptionVfx.parentNode) absorptionVfx.remove();
    }, 2500);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.drainLifeEffect = drainLifeEffect;
    window.showDrainLifeVFX = showDrainLifeVFX;
    window.showLifeAbsorptionVFX = showLifeAbsorptionVFX;
}

// Register the ability effect with AbilityFactory when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Octopus Assassin] Registering abilities...');
    
    const registerEffects = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
            // Register with function name (used by JSON)
            AbilityFactory.registerAbilityEffect('drainLifeEffect', drainLifeEffect);
            
            // Also register with ability ID
            AbilityFactory.registerAbilityEffect('drain_life', drainLifeEffect);
            
            console.log('[Octopus Assassin] Successfully registered Drain Life effect');
        } else {
            console.warn('[Octopus Assassin] AbilityFactory not available, retrying in 100ms...');
            setTimeout(registerEffects, 100);
        }
    };
    
    registerEffects();
});

console.log('[Octopus Assassin] Abilities loaded successfully'); 