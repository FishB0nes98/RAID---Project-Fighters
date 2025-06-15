// Grok Hell Lord Abilities

// --- Chaos Ball Effect ---
window.grokChaosBallEffect = function(caster, targetOrTargets, abilityObject, actualManaCost, options = {}) {
    // Handle single target (extract from array if needed)
    const target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    if (!target || target.isDead()) {
        log(`${caster.name}'s Chaos Ball has no valid target!`, 'error');
        return { success: false };
    }

    log(`${caster.name} hurls a chaotic orb of demonic energy at ${target.name}!`);

    // Create chaos ball VFX
    createChaosBallVFX(caster, target);

    // Calculate damage: 500 + 200% Magical Damage
    const fixedDamage = 500;
    const magicalDamageBonus = Math.floor((caster.stats.magicalDamage || 0) * 2.0);
    const totalDamage = fixedDamage + magicalDamageBonus;
    
    // Apply damage with ignoresMagicalShield option
    const damageOptions = {
        ...options,
        abilityId: 'chaos_ball',
        ignoresMagicalShield: true
    };
    const result = target.applyDamage(totalDamage, 'magical', caster, damageOptions);
    
    log(`${target.name} takes ${result.damage} chaotic damage from Chaos Ball!${result.isCritical ? ' (Critical Hit!)' : ''}`, 
        result.isCritical ? 'critical' : 'damage');

    // Apply lifesteal if any
    if (caster.stats.lifesteal > 0) {
        caster.applyLifesteal(result.damage);
    }

    // Update UI
    if (window.updateCharacterUI) {
        window.updateCharacterUI(target);
        window.updateCharacterUI(caster);
    }

    return { success: true, damage: result.damage };
};

// --- VFX Functions ---

function createChaosBallVFX(caster, target) {
    if (!caster || !target) return;
    
    // Find the DOM elements
    const casterElementId = caster.instanceId || caster.id;
    const targetElementId = target.instanceId || target.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    const targetElement = document.getElementById(`character-${targetElementId}`);
    
    if (!casterElement || !targetElement) return;
    
    // Create the chaos ball element
    const chaosBall = document.createElement('div');
    chaosBall.className = 'chaos-ball-projectile';
    chaosBall.style.cssText = `
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, #ff00ff 0%, #8b00ff 30%, #4b0082 70%, #000 100%);
        border-radius: 50%;
        box-shadow: 
            0 0 20px #ff00ff,
            0 0 40px #8b00ff,
            inset 0 0 20px rgba(255, 0, 255, 0.3);
        z-index: 1000;
        pointer-events: none;
        animation: chaosOrb 0.1s infinite alternate;
    `;
    
    // Add chaos particles around the orb
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff00ff;
            border-radius: 50%;
            top: ${18 + Math.sin(i * Math.PI / 4) * 25}px;
            left: ${18 + Math.cos(i * Math.PI / 4) * 25}px;
            animation: chaosParticle 0.3s infinite;
            animation-delay: ${i * 0.05}s;
        `;
        chaosBall.appendChild(particle);
    }
    
    // Get positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Set initial position
    chaosBall.style.left = (casterRect.left + casterRect.width / 2 - 20) + 'px';
    chaosBall.style.top = (casterRect.top + casterRect.height / 2 - 20) + 'px';
    
    document.body.appendChild(chaosBall);
    
    // Animate to target
    const deltaX = targetRect.left + targetRect.width / 2 - casterRect.left - casterRect.width / 2;
    const deltaY = targetRect.top + targetRect.height / 2 - casterRect.top - casterRect.height / 2;
    
    chaosBall.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    chaosBall.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.5)`;
    
    // Impact effect
    setTimeout(() => {
        createChaosBallImpactVFX(target);
        chaosBall.remove();
    }, 800);
}

function createChaosBallImpactVFX(target) {
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    
    if (!targetElement) return;
    
    // Create impact explosion
    const impact = document.createElement('div');
    impact.className = 'chaos-ball-impact';
    impact.style.cssText = `
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255, 0, 255, 0.8) 0%, rgba(139, 0, 255, 0.6) 30%, rgba(75, 0, 130, 0.4) 70%, transparent 100%);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        z-index: 999;
        pointer-events: none;
        animation: chaosImpact 0.6s ease-out forwards;
    `;
    
    targetElement.style.position = 'relative';
    targetElement.appendChild(impact);
    
    // Add screen shake
    document.body.style.animation = 'chaosScreenShake 0.3s ease-in-out';
    
    // Create chaos particles burst
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: ${i % 2 === 0 ? '#ff00ff' : '#8b00ff'};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 998;
            pointer-events: none;
            animation: chaosBurst 0.8s ease-out forwards;
            animation-delay: ${i * 0.02}s;
        `;
        
        const angle = (i / 12) * Math.PI * 2;
        particle.style.setProperty('--burst-x', Math.cos(angle) * 80 + 'px');
        particle.style.setProperty('--burst-y', Math.sin(angle) * 80 + 'px');
        
        targetElement.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
    
    // Add chaos effect to target
    targetElement.style.filter = 'hue-rotate(270deg) saturate(1.5)';
    
    // Cleanup
    setTimeout(() => {
        impact.remove();
        document.body.style.animation = '';
        targetElement.style.filter = '';
    }, 600);
}

// Register the ability effect
if (typeof AbilityFactory !== 'undefined') {
    AbilityFactory.registerAbilityEffect('grokChaosBallEffect', window.grokChaosBallEffect);
}

// Add CSS animations if not already present
if (!document.getElementById('chaos-ball-styles')) {
    const style = document.createElement('style');
    style.id = 'chaos-ball-styles';
    style.textContent = `
        @keyframes chaosOrb {
            0% { box-shadow: 0 0 20px #ff00ff, 0 0 40px #8b00ff, inset 0 0 20px rgba(255, 0, 255, 0.3); }
            100% { box-shadow: 0 0 30px #8b00ff, 0 0 60px #ff00ff, inset 0 0 30px rgba(139, 0, 255, 0.5); }
        }
        
        @keyframes chaosParticle {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes chaosImpact {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        
        @keyframes chaosBurst {
            0% { 
                transform: translate(-50%, -50%) scale(1); 
                opacity: 1; 
            }
            100% { 
                transform: translate(-50%, -50%) translate(var(--burst-x), var(--burst-y)) scale(0); 
                opacity: 0; 
            }
        }
        
        @keyframes chaosScreenShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }
    `;
    document.head.appendChild(style);
} 