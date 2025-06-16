class PiranhaPassive {
    constructor() {
        this.id = 'piranha_passive';
        this.name = 'Bloodthirsty Healing';
        this.description = 'Your attacks heal the highest Max HP target for 50% of your damage dealt.';
        this.isActive = true;
    }

    initialize() {
        // Hook into the damage application system
        this.hookDamageApplication();
    }

    hookDamageApplication() {
        // Store original applyDamage method if not already hooked
        if (!Character.prototype._piranhaPassiveHooked) {
            const originalApplyDamage = Character.prototype.applyDamage;
            
            Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
                // Call original damage application first
                const result = originalApplyDamage.call(this, amount, type, caster, options);
                
                // Check if damage was dealt by a piranha and if it wasn't redirected
                if (caster && caster.id === 'piranha' && !options.isPiranhaHealing && result.damageDealt > 0) {
                    window.piranhaPassiveInstance?.triggerBloodthirstyHealing(caster, result.damageDealt);
                }
                
                return result;
            };
            
            Character.prototype._piranhaPassiveHooked = true;
        }
    }

    triggerBloodthirstyHealing(piranha, damageDealt) {
        try {
            // Find the character with the highest Max HP
            const allCharacters = [...(window.gameManager?.playerCharacters || []), ...(window.gameManager?.aiCharacters || [])];
            
            if (allCharacters.length === 0) return;
            
            // Find character with highest max HP
            const highestHpTarget = allCharacters.reduce((prev, current) => {
                const prevMaxHp = prev.stats.maxHp || prev.stats.hp;
                const currentMaxHp = current.stats.maxHp || current.stats.hp;
                return currentMaxHp > prevMaxHp ? current : prev;
            });
            
            // Calculate healing amount (50% of damage dealt)
            const healAmount = Math.ceil(damageDealt * 0.5);
            
            // Apply healing with special options to prevent infinite loops
            highestHpTarget.heal(healAmount, piranha, { 
                abilityId: 'piranha_passive_healing',
                isPiranhaHealing: true 
            });
            
            // Log the passive trigger
            if (window.gameManager) {
                window.gameManager.addLogEntry(
                    `🩸 ${piranha.name}'s Bloodthirsty Healing restores ${healAmount} HP to ${highestHpTarget.name} (highest Max HP target)!`,
                    'passive-trigger'
                );
            }
            
            // Show VFX
            this.showBloodthirstyHealingVFX(piranha, highestHpTarget, healAmount);
            
        } catch (error) {
            console.error('[Piranha Passive] Error in triggerBloodthirstyHealing:', error);
        }
    }

    showBloodthirstyHealingVFX(piranha, target, healAmount) {
        try {
            const piranhaElement = document.querySelector(`[data-character-id="${piranha.id}"]`);
            const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
            
            if (!piranhaElement || !targetElement) return;
            
            // Create blood energy beam from piranha to target
            this.createBloodEnergyBeam(piranhaElement, targetElement);
            
            // Show healing glow on target
            this.createHealingGlow(targetElement, healAmount);
            
            // Add floating text
            this.showFloatingHealText(targetElement, healAmount);
            
        } catch (error) {
            console.error('[Piranha Passive] Error in showBloodthirstyHealingVFX:', error);
        }
    }

    createBloodEnergyBeam(sourceElement, targetElement) {
        const beam = document.createElement('div');
        beam.className = 'piranha-blood-beam';
        
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI;
        
        beam.style.cssText = `
            position: fixed;
            left: ${sourceX}px;
            top: ${sourceY}px;
            width: ${distance}px;
            height: 4px;
            background: linear-gradient(90deg, #ff4444, #ff6666, #ff8888);
            transform-origin: 0 50%;
            transform: rotate(${angle}deg);
            box-shadow: 0 0 10px #ff4444, 0 0 20px #ff6666;
            z-index: 1000;
            opacity: 0;
            animation: piranhaBloodBeam 1s ease-out forwards;
        `;
        
        document.body.appendChild(beam);
        
        // Remove after animation
        setTimeout(() => {
            if (beam.parentNode) {
                beam.parentNode.removeChild(beam);
            }
        }, 1000);
    }

    createHealingGlow(targetElement, healAmount) {
        const glow = document.createElement('div');
        glow.className = 'piranha-healing-glow';
        glow.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,68,68,0.3), rgba(255,102,102,0.1), transparent);
            border-radius: 10px;
            z-index: 10;
            pointer-events: none;
            animation: piranhaHealingGlow 1.5s ease-out forwards;
        `;
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(glow);
        
        // Remove after animation
        setTimeout(() => {
            if (glow.parentNode) {
                glow.parentNode.removeChild(glow);
            }
        }, 1500);
    }

    showFloatingHealText(targetElement, healAmount) {
        const floatingText = document.createElement('div');
        floatingText.textContent = `+${healAmount} HP`;
        floatingText.className = 'piranha-floating-heal-text';
        floatingText.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff6666;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 1001;
            pointer-events: none;
            animation: piranhaFloatingHeal 2s ease-out forwards;
        `;
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(floatingText);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }
}

// Create global instance
window.piranhaPassiveInstance = new PiranhaPassive();

// CSS for VFX
if (!document.getElementById('piranha-passive-styles')) {
    const style = document.createElement('style');
    style.id = 'piranha-passive-styles';
    style.textContent = `
        @keyframes piranhaBloodBeam {
            0% { opacity: 0; transform: rotate(var(--beam-angle)) scaleX(0); }
            50% { opacity: 1; transform: rotate(var(--beam-angle)) scaleX(1); }
            100% { opacity: 0; transform: rotate(var(--beam-angle)) scaleX(1); }
        }
        
        @keyframes piranhaHealingGlow {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1); }
        }
        
        @keyframes piranhaFloatingHeal {
            0% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
        }
    `;
    document.head.appendChild(style);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.piranhaPassiveInstance.initialize());
} else {
    window.piranhaPassiveInstance.initialize();
} 