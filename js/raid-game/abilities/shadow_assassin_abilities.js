class ShadowAssassinAbilities {
    static showAssassinStrikeVFX(caster, target, isCritical) {
        const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
        const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
        
        if (!casterElement || !targetElement) {
            console.warn('Shadow Assassin VFX: Could not find character elements');
            return;
        }
        
        // Create shadow dash effect
        ShadowAssassinAbilities.createShadowDashVFX(casterElement, targetElement);
        
        // Create strike impact effect
        setTimeout(() => {
            ShadowAssassinAbilities.createStrikeImpactVFX(targetElement, isCritical);
        }, 300);
        
        // Create shadow afterimage effect
        setTimeout(() => {
            ShadowAssassinAbilities.createShadowAfterimageVFX(casterElement);
        }, 200);
    }
    
    static createShadowDashVFX(casterElement, targetElement) {
        const container = document.querySelector('.battle-container');
        if (!container) return;
        
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Create shadow trail
        const shadowTrail = document.createElement('div');
        shadowTrail.className = 'assassin-shadow-trail';
        shadowTrail.style.left = (casterRect.left - containerRect.left) + 'px';
        shadowTrail.style.top = (casterRect.top - containerRect.top) + 'px';
        shadowTrail.style.width = Math.abs(targetRect.left - casterRect.left) + 'px';
        shadowTrail.style.height = '4px';
        shadowTrail.style.transform = `rotate(${Math.atan2(targetRect.top - casterRect.top, targetRect.left - casterRect.left)}rad)`;
        shadowTrail.style.transformOrigin = '0 50%';
        
        container.appendChild(shadowTrail);
        
        // Animate caster briefly
        casterElement.style.transition = 'all 0.3s ease-out';
        casterElement.style.opacity = '0.3';
        casterElement.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            casterElement.style.opacity = '1';
            casterElement.style.transform = 'scale(1)';
            shadowTrail.remove();
        }, 400);
    }
    
    static createStrikeImpactVFX(targetElement, isCritical) {
        // Create impact burst
        const impactBurst = document.createElement('div');
        impactBurst.className = `assassin-strike-impact ${isCritical ? 'critical' : ''}`;
        targetElement.appendChild(impactBurst);
        
        // Create shadow particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'assassin-shadow-particle';
            particle.style.animationDelay = (i * 0.05) + 's';
            impactBurst.appendChild(particle);
        }
        
        // Screen shake for impact
        ShadowAssassinAbilities.addAssassinStrikeScreenShake();
        
        // Cleanup
        setTimeout(() => {
            impactBurst.remove();
        }, 1000);
    }
    
    static createShadowAfterimageVFX(casterElement) {
        const afterimage = document.createElement('div');
        afterimage.className = 'assassin-afterimage';
        afterimage.innerHTML = casterElement.innerHTML;
        
        const casterRect = casterElement.getBoundingClientRect();
        const container = document.querySelector('.battle-container');
        const containerRect = container.getBoundingClientRect();
        
        afterimage.style.left = (casterRect.left - containerRect.left) + 'px';
        afterimage.style.top = (casterRect.top - containerRect.top) + 'px';
        afterimage.style.width = casterRect.width + 'px';
        afterimage.style.height = casterRect.height + 'px';
        
        container.appendChild(afterimage);
        
        setTimeout(() => {
            afterimage.remove();
        }, 600);
    }
    
    static addAssassinStrikeScreenShake() {
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            battleContainer.classList.add('assassin-strike-shake');
            setTimeout(() => {
                battleContainer.classList.remove('assassin-strike-shake');
            }, 400);
        }
    }
}

// Register VFX functions globally so they can be called by the game engine
if (typeof window !== 'undefined') {
    window.ShadowAssassinAbilities = ShadowAssassinAbilities;
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShadowAssassinAbilities;
} 