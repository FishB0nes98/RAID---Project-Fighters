/**
 * Shadowfin Passive: Shadow Evasion
 * When healed, gains stacking 5% dodge chance for 4 turns
 */

class ShadowfinPassive {
    constructor() {
        this.passiveName = "Shadow Evasion";
        this.passiveDescription = "When healed, gains stacking 5% dodge chance for 4 turns.";
        this.dodgeBonus = 0.05; // 5% dodge chance per stack
        this.buffDuration = 4; // 4 turns
        this.buffId = 'shadowfin_shadow_evasion';
        this.character = null;
        
        console.log(`[ShadowfinPassive] Shadow Evasion passive initialized`);
    }

    initialize(character) {
        this.character = character;
        console.log(`[ShadowfinPassive] Initializing Shadow Evasion for ${character.name}`);
        
        // Set global instance
        window.shadowfinPassiveInstance = this;
        
        // Hook into the heal system
        this.setupHealInterception();
        
        // Add visual indicator
        this.addShadowEvasionAura();
    }

    /**
     * Setup heal interception to trigger on healing
     */
    setupHealInterception() {
        console.log(`[ShadowfinPassive] Setting up heal interception for ${this.character.name}`);
        
        // Hook into Character.heal method if not already hooked
        if (!Character.prototype._shadowfinPassiveHooked) {
            const originalHeal = Character.prototype.heal;
            
            Character.prototype.heal = function(amount, caster = null, options = {}) {
                // Call original heal method first
                const result = originalHeal.call(this, amount, caster, options);
                
                // Check if this character has shadowfin passive and actually received healing
                // Check both base ID and instance ID patterns
                const isShadowfin = this.id === 'shadowfin' || this.id.startsWith('shadowfin-') || this.id.includes('shadowfin');
                
                if (isShadowfin && result.healAmount > 0 && !options.isShadowfinPassive) {
                    console.log(`[ShadowfinPassive] Heal detected on Shadowfin (ID: ${this.id}): ${result.healAmount} HP healed`);
                    window.shadowfinPassiveInstance?.triggerShadowEvasion(this, result.healAmount);
                }
                
                return result;
            };
            
            Character.prototype._shadowfinPassiveHooked = true;
            console.log(`[ShadowfinPassive] Successfully hooked heal method`);
        }
    }

    /**
     * Trigger the shadow evasion effect when healed
     */
    triggerShadowEvasion(character, healAmount) {
        console.log(`[ShadowfinPassive] Triggering Shadow Evasion for ${character.name} (healed: ${healAmount})`);
        
        try {
            // Count existing Shadow Evasion stacks for description
            const existingStacks = character.buffs ? character.buffs.filter(b => b.name === "Shadow Evasion").length : 0;
            const newStackCount = existingStacks + 1;
            
            // Create dodge chance buff with UNIQUE ID for stacking using proper Effect class
            const buff = new window.Effect(
                `${this.buffId}_${Date.now()}_${Math.random()}`, // Unique ID for each stack
                "Shadow Evasion",
                "Icons/abilities/shadow_evasion.png", 
                this.buffDuration,
                null, // No per-turn effect
                false // Not a debuff
            );
            
            // Set description
            buff.setDescription(`+5% dodge chance (Stack ${newStackCount})`);
            
            // Use statModifiers for proper integration with recalculateStats
            buff.statModifiers = [{
                stat: 'dodgeChance',
                value: this.dodgeBonus,
                operation: 'add'
            }];
            
            // Add stacking properties
            buff.isStackable = true;
            buff.stackableGroup = this.buffId; // Group identifier for stacking display
            
            // Add the buff
            character.addBuff(buff);
            
            // Debug logging AFTER buff application
            console.log(`[ShadowfinPassive] AFTER buff application - ${character.name} dodge chance: ${(character.stats.dodgeChance * 100).toFixed(1)}%`);
            console.log(`[ShadowfinPassive] ${character.name} current buffs:`, character.buffs.map(b => ({ 
                id: b.id, 
                name: b.name, 
                statModifiers: b.statModifiers 
            })));
            
            // Show VFX
            this.showShadowEvasionVFX(character, healAmount);
            
            // Log the passive trigger
            if (window.gameManager) {
                const currentStacks = character.buffs.filter(b => b.name === "Shadow Evasion").length;
                window.gameManager.addLogEntry(
                    `🌫️ ${character.name}'s Shadow Evasion activates! Dodge chance increased by 5% (${currentStacks} stacks)`,
                    'passive-trigger'
                );
            }
            
        } catch (error) {
            console.error('[ShadowfinPassive] Error in triggerShadowEvasion:', error);
        }
    }

    /**
     * Show visual effects for shadow evasion activation
     */
    showShadowEvasionVFX(character, healAmount) {
        try {
            const characterElement = document.getElementById(`character-${character.id}`) || 
                                   document.querySelector(`[data-character-id="${character.id}"]`);
            
            if (!characterElement) {
                console.log('[ShadowfinPassive] Could not find character element for VFX');
                return;
            }
            
            // Create shadow swirl effect
            this.createShadowSwirlEffect(characterElement);
            
            // Add shadow glow to character
            this.createShadowGlow(characterElement);
            
            // Show floating text
            this.showFloatingDodgeText(characterElement);
            
        } catch (error) {
            console.error('[ShadowfinPassive] Error in showShadowEvasionVFX:', error);
        }
    }

    /**
     * Create shadow swirl particle effect
     */
    createShadowSwirlEffect(characterElement) {
        const container = document.createElement('div');
        container.className = 'shadowfin-shadow-swirl-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 15;
            border-radius: 10px;
            overflow: hidden;
        `;
        
        // Create multiple shadow particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'shadowfin-shadow-particle';
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #4a0e4e, #2a0831);
                border-radius: 50%;
                animation: shadowSwirlParticle 1.5s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                opacity: 0;
            `;
            
            // Random starting position around the character
            const angle = (i / 8) * 2 * Math.PI;
            const radius = 30;
            const startX = 50 + Math.cos(angle) * radius;
            const startY = 50 + Math.sin(angle) * radius;
            
            particle.style.left = `${startX}%`;
            particle.style.top = `${startY}%`;
            
            container.appendChild(particle);
        }
        
        characterElement.style.position = 'relative';
        characterElement.appendChild(container);
        
        // Remove after animation
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 2000);
    }

    /**
     * Create shadow glow effect on character
     */
    createShadowGlow(characterElement) {
        const glow = document.createElement('div');
        glow.className = 'shadowfin-shadow-glow';
        glow.style.cssText = `
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            background: radial-gradient(circle, transparent 60%, rgba(74,14,78,0.3) 70%, rgba(42,8,49,0.5) 80%, transparent 90%);
            border-radius: 15px;
            z-index: 5;
            pointer-events: none;
            animation: shadowGlowPulse 1.5s ease-out forwards;
        `;
        
        characterElement.appendChild(glow);
        
        // Remove after animation
        setTimeout(() => {
            if (glow.parentNode) {
                glow.parentNode.removeChild(glow);
            }
        }, 1500);
    }

    /**
     * Show floating dodge chance text
     */
    showFloatingDodgeText(characterElement) {
        const floatingText = document.createElement('div');
        floatingText.textContent = '+5% Dodge';
        floatingText.className = 'shadowfin-floating-dodge-text';
        floatingText.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            color: #9a4eff;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 0 0 4px #4a0e4e, 0 0 8px #2a0831;
            z-index: 20;
            pointer-events: none;
            animation: shadowfinFloatingText 2s ease-out forwards;
        `;
        
        characterElement.appendChild(floatingText);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }

    /**
     * Add passive visual aura around character
     */
    addShadowEvasionAura() {
        try {
            const characterElement = document.getElementById(`character-${this.character.id}`) || 
                                   document.querySelector(`[data-character-id="${this.character.id}"]`);
            
            if (!characterElement) {
                console.log('[ShadowfinPassive] Could not find character element for aura');
                return;
            }
            
            // Add subtle shadow aura
            const aura = document.createElement('div');
            aura.className = 'shadowfin-passive-aura';
            aura.style.cssText = `
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                background: radial-gradient(circle, transparent 70%, rgba(74,14,78,0.1) 80%, transparent 90%);
                border-radius: 13px;
                z-index: 1;
                pointer-events: none;
                animation: shadowPassiveAura 3s ease-in-out infinite;
            `;
            
            characterElement.style.position = 'relative';
            characterElement.appendChild(aura);
            
        } catch (error) {
            console.error('[ShadowfinPassive] Error in addShadowEvasionAura:', error);
        }
    }

    /**
     * Get the passive description
     */
    getDescription() {
        return this.passiveDescription;
    }

    /**
     * Cleanup if needed
     */
    cleanup() {
        // Remove global instance
        window.shadowfinPassiveInstance = null;
    }
}

// Register the passive globally
window.ShadowfinPassive = ShadowfinPassive;

// Register with PassiveFactory if available
if (window.PassiveFactory) {
    window.PassiveFactory.registerPassive('shadowfin_passive', ShadowfinPassive);
    console.log('[ShadowfinPassive] Registered with PassiveFactory');
} else {
    console.warn('[ShadowfinPassive] PassiveFactory not found');
} 