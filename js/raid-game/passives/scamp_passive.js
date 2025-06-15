/**
 * Scamp Passive: Sacrificial Devotion
 * 65% chance to redirect damage from allies to Scamp instead
 */

console.log("[ScampPassive] *** SCRIPT LOADING *** Scamp passive file is being executed");
console.log("[ScampPassive] *** GLOBAL CHECK *** Window object:", typeof window);
console.log("[ScampPassive] *** CHARACTER CHECK *** Character class:", typeof Character);

class ScampPassive {
    constructor() {
        this.passiveName = "Sacrificial Devotion";
        this.passiveDescription = "65% chance to redirect damage and debuffs from allies to Scamp instead. Scamp's armor and magic shield reduce the redirected damage naturally.";
        this.redirectChance = 0.65; // 65% chance
        this.character = null;
        
        console.log(`[ScampPassive] *** CONSTRUCTOR CALLED *** Initialized Sacrificial Devotion passive`);
    }

    initialize(character) {
        this.character = character;
        console.log(`[ScampPassive] *** INITIALIZE CALLED *** Initializing Sacrificial Devotion for ${character.name}`);
        
        // Set global instance
        window.scampPassiveInstance = this;
        console.log(`[ScampPassive] *** GLOBAL SET *** Set window.scampPassiveInstance to:`, window.scampPassiveInstance);
        
        // Hook into the game's damage system to intercept ally damage
        this.setupDamageInterception();
        
        // Add visual indicator
        this.addSacrificialAuraVFX();
    }

    /**
     * Setup damage interception for all allies
     */
    setupDamageInterception() {
        console.log(`[ScampPassive] *** SETUP INTERCEPTION *** Setting up damage interception for ${this.character.name}`);
        
        // Monitor all damage applications globally
        this.setupGlobalDamageListener();
    }

    /**
     * Setup global damage monitoring
     */
    setupGlobalDamageListener() {
        // Listen for damage events before they're applied
        document.addEventListener('character:before-damage', (event) => {
            this.handlePotentialRedirection(event);
        });
        
        // Scamp passive now uses the Universal Damage Redirection Framework in character.js
        // The damage redirection is automatically handled by checkForDamageRedirection()
        // We still need to hook addDebuff for debuff redirection
        if (!Character.prototype._scampDebuffHooked) {
            const originalAddDebuff = Character.prototype.addDebuff;
            
            Character.prototype.addDebuff = function(debuff) {
                console.log(`[ScampPassive] *** HOOKED DEBUFF *** ${this.name} receiving debuff: ${debuff.name}`);
                
                // Check if Scamp should redirect this debuff
                const redirectResult = window.scampPassiveInstance?.checkAndRedirectDebuff(this, debuff);
                
                if (redirectResult?.redirected) {
                    console.log(`[ScampPassive] *** DEBUFF REDIRECTED *** Debuff sent to Scamp instead`);
                    // Apply debuff to Scamp instead
                    return redirectResult.scampDebuffResult;
                } else {
                    // Apply debuff normally
                    return originalAddDebuff.call(this, debuff);
                }
            };
            
            Character.prototype._scampDebuffHooked = true;
            console.log(`[ScampPassive] *** DEBUFF HOOKING SUCCESS *** Hooked into Character.addDebuff method (damage handled by Universal Framework)`);
        }
    }

    /**
     * Check if damage should be redirected and handle the redirection
     */
    checkAndRedirectDamage(target, amount, type, caster, options = {}) {
        console.log(`[ScampPassive] *** DAMAGE CHECK *** Target: ${target.name}, Amount: ${amount}, Type: ${type}`);
        
        // Skip if Scamp is dead or this is already a redirection
        if (!this.character || this.character.isDead() || options.isScampRedirection) {
            console.log(`[ScampPassive] *** SKIPPING *** No character, dead, or already redirected`);
            return null;
        }

        // Skip if target is Scamp himself
        if (target === this.character) {
            console.log(`[ScampPassive] *** SKIPPING *** Target is Scamp himself`);
            return null;
        }

        // Check if target is an ally of Scamp
        if (!this.isAlly(target)) {
            console.log(`[ScampPassive] *** SKIPPING *** Target ${target.name} is not an ally of Scamp`);
            return null;
        }

        // Roll for redirection chance
        const roll = Math.random();
        if (roll > this.redirectChance) {
            console.log(`[ScampPassive] Redirection roll failed: ${roll.toFixed(2)} > ${this.redirectChance}`);
            return null;
        }

        // Redirect FULL damage and let Scamp's defenses handle the reduction
        console.log(`[ScampPassive] Redirecting ${amount} ${type} damage from ${target.name} to ${this.character.name}! Scamp's defenses will naturally reduce this.`);
        
        // Log the sacrifice
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`💀 ${this.character.name} heroically intercepts the attack meant for ${target.name}!`, 'scamp-sacrifice');
        
        // Show redirection VFX
        this.showRedirectionVFX(target, this.character);
        
        // Apply FULL damage to Scamp with redirection flag - let his armor/magic shield handle the reduction
        const redirectOptions = { ...options, isScampRedirection: true };
        
        // Store reference to original applyDamage to prevent infinite loops
        const originalApplyDamage = Character.prototype.applyDamage;
        const scampDamageResult = originalApplyDamage.call(this.character, amount, type, caster, redirectOptions);
        
        // Show sacrifice VFX on Scamp with damage info
        this.showSacrificeVFX(this.character, scampDamageResult.damage, amount);
        
        // Update UI for both characters
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
            window.gameManager.uiManager.updateCharacterUI(this.character);
        }
        
        // Return a result indicating damage was redirected
        return {
            redirected: true,
            scampDamageResult: scampDamageResult,
            originalTarget: target,
            originalAmount: amount,
            finalDamageToScamp: scampDamageResult.damage, // Actual damage Scamp received after his defenses
            damageReductionFromDefenses: amount - scampDamageResult.damage // How much Scamp's defenses reduced
        };
    }

    /**
     * Check if debuff should be redirected and handle the redirection
     */
    checkAndRedirectDebuff(target, debuff) {
        console.log(`[ScampPassive] *** DEBUFF CHECK *** Target: ${target.name}, Debuff: ${debuff.name}`);
        
        // Skip if Scamp is dead or this is already a redirection
        if (!this.character || this.character.isDead() || debuff.isScampRedirection) {
            console.log(`[ScampPassive] *** DEBUFF SKIPPING *** No character, dead, or already redirected`);
            return null;
        }

        // Skip if target is Scamp himself
        if (target === this.character) {
            console.log(`[ScampPassive] *** DEBUFF SKIPPING *** Target is Scamp himself`);
            return null;
        }

        // Check if target is an ally of Scamp
        if (!this.isAlly(target)) {
            console.log(`[ScampPassive] *** DEBUFF SKIPPING *** Target ${target.name} is not an ally of Scamp`);
            return null;
        }

        // Roll for redirection chance
        const roll = Math.random();
        if (roll > this.redirectChance) {
            console.log(`[ScampPassive] Debuff redirection roll failed: ${roll.toFixed(2)} > ${this.redirectChance}`);
            return null;
        }

        console.log(`[ScampPassive] Redirecting debuff "${debuff.name}" from ${target.name} to ${this.character.name}!`);
        
        // Log the sacrifice
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`💀 ${this.character.name} heroically takes the curse meant for ${target.name}!`, 'scamp-sacrifice');
        
        // Show redirection VFX
        this.showDebuffRedirectionVFX(target, this.character, debuff);
        
        // Clone the debuff to avoid reference issues
        const redirectedDebuff = this.cloneDebuff(debuff);
        redirectedDebuff.isScampRedirection = true;
        
        // Apply debuff to Scamp with redirection flag
        const scampDebuffResult = Character.prototype.addDebuff.call(this.character, redirectedDebuff);
        
        // Show sacrifice VFX on Scamp
        this.showDebuffSacrificeVFX(this.character, redirectedDebuff);
        
        // Update UI for both characters
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
            window.gameManager.uiManager.updateCharacterUI(this.character);
        }
        
        // Return a result indicating debuff was redirected
        return {
            redirected: true,
            scampDebuffResult: scampDebuffResult,
            originalTarget: target,
            redirectedDebuff: redirectedDebuff
        };
    }

    /**
     * Check if a character is an ally of Scamp
     */
    isAlly(character) {
        if (!window.gameManager || !window.gameManager.gameState) {
            return false;
        }

        // Get Scamp's team
        const scampTeam = this.character.isAI ? 'ai' : 'player';
        const targetTeam = character.isAI ? 'ai' : 'player';
        
        return scampTeam === targetTeam;
    }

    /**
     * Show redirection VFX - energy transfer from target to Scamp
     */
    showRedirectionVFX(originalTarget, scamp) {
        const targetElement = document.getElementById(`character-${originalTarget.instanceId || originalTarget.id}`);
        const scampElement = document.getElementById(`character-${scamp.instanceId || scamp.id}`);
        
        if (!targetElement || !scampElement) return;

        // Create redirection beam/energy transfer
        const redirectionBeam = document.createElement('div');
        redirectionBeam.className = 'scamp-redirection-beam';
        document.body.appendChild(redirectionBeam);

        // Position beam from target to Scamp
        const targetRect = targetElement.getBoundingClientRect();
        const scampRect = scampElement.getBoundingClientRect();
        
        const startX = targetRect.left + targetRect.width / 2;
        const startY = targetRect.top + targetRect.height / 2;
        const endX = scampRect.left + scampRect.width / 2;
        const endY = scampRect.top + scampRect.height / 2;
        
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        redirectionBeam.style.left = startX + 'px';
        redirectionBeam.style.top = startY + 'px';
        redirectionBeam.style.width = distance + 'px';
        redirectionBeam.style.transform = `rotate(${angle}deg)`;
        redirectionBeam.style.transformOrigin = '0 50%';

        // Show protective glow on original target
        const protectionGlow = document.createElement('div');
        protectionGlow.className = 'scamp-protection-glow';
        targetElement.appendChild(protectionGlow);

        // Remove VFX after animation
        setTimeout(() => {
            if (redirectionBeam.parentNode) redirectionBeam.remove();
            if (protectionGlow.parentNode) protectionGlow.remove();
        }, 1500);
    }

    /**
     * Clone a debuff to avoid reference issues
     */
    cloneDebuff(debuff) {
        // Create a new debuff with the same properties
        const clonedDebuff = {
            id: debuff.id,
            name: debuff.name,
            icon: debuff.icon,
            duration: debuff.duration,
            description: debuff.description,
            isDebuff: debuff.isDebuff,
            effects: debuff.effects ? { ...debuff.effects } : undefined,
            statModifiers: debuff.statModifiers ? [...debuff.statModifiers] : undefined,
            onApply: debuff.onApply,
            onRemove: debuff.onRemove,
            onTurnStart: debuff.onTurnStart,
            onTurnEnd: debuff.onTurnEnd,
            effect: debuff.effect,
            remove: debuff.remove
        };
        
        // Copy any other properties
        Object.keys(debuff).forEach(key => {
            if (!clonedDebuff.hasOwnProperty(key)) {
                clonedDebuff[key] = debuff[key];
            }
        });
        
        return clonedDebuff;
    }

    /**
     * Show debuff redirection VFX - energy transfer from target to Scamp
     */
    showDebuffRedirectionVFX(originalTarget, scamp, debuff) {
        const targetElement = document.getElementById(`character-${originalTarget.instanceId || originalTarget.id}`);
        const scampElement = document.getElementById(`character-${scamp.instanceId || scamp.id}`);
        
        if (!targetElement || !scampElement) return;

        // Create debuff redirection beam (different color from damage redirection)
        const redirectionBeam = document.createElement('div');
        redirectionBeam.className = 'scamp-debuff-redirection-beam';
        redirectionBeam.style.background = 'linear-gradient(90deg, #8b00ff, #ff1493, #8b00ff)';
        redirectionBeam.style.position = 'fixed';
        redirectionBeam.style.height = '6px';
        redirectionBeam.style.zIndex = '9999';
        redirectionBeam.style.pointerEvents = 'none';
        redirectionBeam.style.borderRadius = '3px';
        redirectionBeam.style.boxShadow = '0 0 12px #8b00ff';
        redirectionBeam.style.animation = 'scamp-debuff-beam-pulse 1s ease-in-out';
        document.body.appendChild(redirectionBeam);

        // Position beam from target to Scamp
        const targetRect = targetElement.getBoundingClientRect();
        const scampRect = scampElement.getBoundingClientRect();
        
        const startX = targetRect.left + targetRect.width / 2;
        const startY = targetRect.top + targetRect.height / 2;
        const endX = scampRect.left + scampRect.width / 2;
        const endY = scampRect.top + scampRect.height / 2;
        
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        redirectionBeam.style.left = startX + 'px';
        redirectionBeam.style.top = startY + 'px';
        redirectionBeam.style.width = distance + 'px';
        redirectionBeam.style.transform = `rotate(${angle}deg)`;
        redirectionBeam.style.transformOrigin = '0 50%';

        // Show protection glow on original target (different color for debuff protection)
        const protectionGlow = document.createElement('div');
        protectionGlow.className = 'scamp-debuff-protection-glow';
        protectionGlow.style.position = 'absolute';
        protectionGlow.style.top = '-5px';
        protectionGlow.style.left = '-5px';
        protectionGlow.style.right = '-5px';
        protectionGlow.style.bottom = '-5px';
        protectionGlow.style.background = 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(138, 43, 226, 0.2) 50%, rgba(138, 43, 226, 0) 80%)';
        protectionGlow.style.borderRadius = '10px';
        protectionGlow.style.zIndex = '1';
        protectionGlow.style.pointerEvents = 'none';
        protectionGlow.style.animation = 'scamp-debuff-protection-pulse 1.5s ease-in-out';
        targetElement.appendChild(protectionGlow);

        // Add debuff symbol floating above
        const debuffSymbol = document.createElement('div');
        debuffSymbol.textContent = '🛡️💀';
        debuffSymbol.style.position = 'absolute';
        debuffSymbol.style.top = '-30px';
        debuffSymbol.style.left = '50%';
        debuffSymbol.style.transform = 'translateX(-50%)';
        debuffSymbol.style.fontSize = '20px';
        debuffSymbol.style.zIndex = '10000';
        debuffSymbol.style.pointerEvents = 'none';
        debuffSymbol.style.animation = 'scamp-float-up 1.5s ease-out';
        targetElement.appendChild(debuffSymbol);

        // Remove VFX after animation
        setTimeout(() => {
            if (redirectionBeam.parentNode) redirectionBeam.remove();
            if (protectionGlow.parentNode) protectionGlow.remove();
            if (debuffSymbol.parentNode) debuffSymbol.remove();
        }, 1500);
    }

    /**
     * Show debuff sacrifice VFX on Scamp when taking redirected debuff
     */
    showDebuffSacrificeVFX(scamp, debuff) {
        const scampElement = document.getElementById(`character-${scamp.instanceId || scamp.id}`);
        if (!scampElement) return;

        // Create curse absorption effect
        const curseEffect = document.createElement('div');
        curseEffect.className = 'scamp-curse-absorption';
        curseEffect.style.position = 'absolute';
        curseEffect.style.top = '0';
        curseEffect.style.left = '0';
        curseEffect.style.right = '0';
        curseEffect.style.bottom = '0';
        curseEffect.style.background = 'radial-gradient(circle, rgba(139, 0, 139, 0.6) 0%, rgba(75, 0, 130, 0.4) 50%, rgba(25, 25, 112, 0) 80%)';
        curseEffect.style.borderRadius = '10px';
        curseEffect.style.zIndex = '2';
        curseEffect.style.pointerEvents = 'none';
        curseEffect.style.animation = 'scamp-curse-absorb 2s ease-in-out';
        scampElement.appendChild(curseEffect);

        // Create floating curse text
        const curseText = document.createElement('div');
        curseText.className = 'scamp-curse-text';
        curseText.textContent = `💀 ${debuff.name}`;
        curseText.style.position = 'absolute';
        curseText.style.top = '-40px';
        curseText.style.left = '50%';
        curseText.style.transform = 'translateX(-50%)';
        curseText.style.color = '#8b008b';
        curseText.style.fontWeight = 'bold';
        curseText.style.fontSize = '14px';
        curseText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        curseText.style.zIndex = '10000';
        curseText.style.pointerEvents = 'none';
        curseText.style.animation = 'scamp-curse-float 2s ease-out';
        scampElement.appendChild(curseText);

        // Create curse symbols swirling around Scamp
        const curseSymbols = ['☠️', '💀', '🔮', '⚫'];
        curseSymbols.forEach((symbol, index) => {
            const symbolElement = document.createElement('div');
            symbolElement.textContent = symbol;
            symbolElement.style.position = 'absolute';
            symbolElement.style.fontSize = '16px';
            symbolElement.style.zIndex = '10001';
            symbolElement.style.pointerEvents = 'none';
            symbolElement.style.animation = `scamp-curse-orbit-${index} 2s ease-in-out`;
            scampElement.appendChild(symbolElement);
            
            setTimeout(() => {
                if (symbolElement.parentNode) symbolElement.remove();
            }, 2000);
        });

        // Remove VFX after animation
        setTimeout(() => {
            if (curseEffect.parentNode) curseEffect.remove();
            if (curseText.parentNode) curseText.remove();
        }, 2000);
    }

    /**
     * Show sacrifice VFX on Scamp when taking redirected damage
     */
    showSacrificeVFX(scamp, actualDamageReceived, originalAmount = null) {
        const scampElement = document.getElementById(`character-${scamp.instanceId || scamp.id}`);
        if (!scampElement) return;

        // Create sacrifice effect
        const sacrificeEffect = document.createElement('div');
        sacrificeEffect.className = 'scamp-sacrifice-effect';
        scampElement.appendChild(sacrificeEffect);

        // Create floating damage text with defense reduction info
        const damageText = document.createElement('div');
        damageText.className = 'scamp-sacrifice-damage';
        if (originalAmount && originalAmount !== actualDamageReceived) {
            const defenseReduction = originalAmount - actualDamageReceived;
            damageText.innerHTML = `<div>-${actualDamageReceived} (Sacrifice)</div><div style="font-size: 12px; color: #4A90E2;">Defense saved ${defenseReduction}!</div>`;
        } else {
            damageText.textContent = `-${actualDamageReceived} (Sacrifice)`;
        }
        scampElement.appendChild(damageText);

        // Create devotion aura pulse
        const devotionPulse = document.createElement('div');
        devotionPulse.className = 'scamp-devotion-pulse';
        scampElement.appendChild(devotionPulse);

        // Show defense effectiveness indicator if there was reduction
        if (originalAmount && originalAmount !== actualDamageReceived) {
            const defenseIndicator = document.createElement('div');
            defenseIndicator.className = 'scamp-defense-indicator';
            defenseIndicator.textContent = `${originalAmount} → ${actualDamageReceived}`;
            defenseIndicator.style.position = 'absolute';
            defenseIndicator.style.top = '-50px';
            defenseIndicator.style.left = '50%';
            defenseIndicator.style.transform = 'translateX(-50%)';
            defenseIndicator.style.fontSize = '12px';
            defenseIndicator.style.color = '#4A90E2';
            defenseIndicator.style.fontWeight = 'bold';
            defenseIndicator.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
            defenseIndicator.style.zIndex = '10002';
            defenseIndicator.style.pointerEvents = 'none';
            defenseIndicator.style.animation = 'scamp-float-up 2s ease-out';
            scampElement.appendChild(defenseIndicator);
            
            setTimeout(() => {
                if (defenseIndicator.parentNode) defenseIndicator.remove();
            }, 2000);
        }

        // Remove VFX after animation
        setTimeout(() => {
            if (sacrificeEffect.parentNode) sacrificeEffect.remove();
            if (damageText.parentNode) damageText.remove();
            if (devotionPulse.parentNode) devotionPulse.remove();
        }, 2000);
    }

    /**
     * Add sacrificial aura VFX to show passive is active
     */
    addSacrificialAuraVFX() {
        if (!this.character) return;
        
        const characterElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!characterElement) return;

        // Add subtle aura effect
        const auraEffect = document.createElement('div');
        auraEffect.className = 'scamp-sacrificial-aura';
        characterElement.appendChild(auraEffect);
        
        console.log(`[ScampPassive] Added sacrificial aura VFX to ${this.character.name}`);
    }

    /**
     * Get the description of the passive including current effects
     */
    getDescription() {
        return `${this.passiveDescription} (${Math.round(this.redirectChance * 100)}% chance)`;
    }

    /**
     * Clean up method (called when character is removed or game resets)
     */
    cleanup() {
        console.log(`[ScampPassive] Cleaning up passive for ${this.character?.name || 'unknown'}`);
        
        // Remove global instance reference
        if (window.scampPassiveInstance === this) {
            window.scampPassiveInstance = null;
        }
        
        // Clean up any remaining VFX
        document.querySelectorAll('.scamp-redirection-beam, .scamp-protection-glow, .scamp-sacrifice-effect, .scamp-sacrifice-damage, .scamp-devotion-pulse, .scamp-sacrificial-aura').forEach(el => {
            if (el.parentNode) el.remove();
        });
    }
}

// Global instance for damage interception
window.scampPassiveInstance = null;

// Initialize when character is loaded
if (typeof window.initializeScampPassive === 'undefined') {
    window.initializeScampPassive = function(character) {
        console.log(`[ScampPassive] Initializing global passive for ${character.name}`);
        
        // Clean up existing instance
        if (window.scampPassiveInstance) {
            window.scampPassiveInstance.cleanup();
        }
        
        // Create new instance
        window.scampPassiveInstance = new ScampPassive();
        window.scampPassiveInstance.initialize(character);
        
        return window.scampPassiveInstance;
    };
}

// Auto-initialize when Scamp character is created
document.addEventListener('DOMContentLoaded', function() {
    console.log(`[ScampPassive] *** DOM LOADED *** Setting up character creation listener`);
    
    // Listen for character creation events
    document.addEventListener('character:created', function(event) {
        console.log(`[ScampPassive] *** CHARACTER CREATED EVENT *** Character: ${event.detail.character?.name || 'unknown'}`);
        const character = event.detail.character;
        if (character && character.id === 'scamp' && character.passive && character.passive.id === 'scamp_damage_redirect') {
            console.log(`[ScampPassive] *** AUTO INIT *** Auto-initializing for ${character.name}`);
            window.initializeScampPassive(character);
        } else if (character && character.id === 'scamp') {
            console.log(`[ScampPassive] *** SCAMP FOUND *** but passive check failed. Passive:`, character.passive);
        }
    });
});

// Make sure the class is available globally for the character factory
window.ScampPassive = ScampPassive;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScampPassive;
} 