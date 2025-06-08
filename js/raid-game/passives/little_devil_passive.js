/**
 * Little Devil Passive: Devilish Resilience
 * Takes 25% less damage from all sources
 */

class LittleDevilPassive {
    constructor(character) {
        this.character = character;
        this.passiveName = "Devilish Resilience";
        this.passiveDescription = "Takes 25% less damage from all sources.";
        this.damageReduction = 0.25; // 25% damage reduction
        
        console.log(`[LittleDevilPassive] Initialized for ${character.name}`);
        
        // Apply the damage reduction stat modifier
        this.applyDamageReduction();
    }

    /**
     * Apply the damage reduction to the character
     */
    applyDamageReduction() {
        // Initialize stageModifiers if it doesn't exist
        if (!this.character.stageModifiers) {
            this.character.stageModifiers = {};
        }
        
        // Add damage reduction
        const currentReduction = this.character.stageModifiers.damageReduction || 0;
        this.character.stageModifiers.damageReduction = currentReduction + this.damageReduction;
        
        console.log(`[LittleDevilPassive] Applied ${this.damageReduction * 100}% damage reduction to ${this.character.name}. Total reduction: ${this.character.stageModifiers.damageReduction * 100}%`);
        
        // Log the passive activation
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(`${this.character.name}'s ${this.passiveName} grants ${this.damageReduction * 100}% damage reduction!`, 'passive');
        }
    }

    /**
     * Called when the character takes damage (optional hook for additional effects)
     */
    onDamageTaken(character, damageInfo, caster) {
        // This is called automatically by the character system, but we don't need
        // to do anything here since the damage reduction is already applied via stageModifiers
        console.log(`[LittleDevilPassive] ${character.name} took damage (already reduced by passive)`);
    }

    /**
     * Get the description of the passive including current effects
     */
    getDescription() {
        return `${this.passiveDescription} (Active: ${this.damageReduction * 100}% damage reduction)`;
    }

    /**
     * Clean up method (called when character is removed or game resets)
     */
    cleanup() {
        console.log(`[LittleDevilPassive] Cleaning up passive for ${this.character.name}`);
        // Remove the damage reduction if needed
        if (this.character.stageModifiers && this.character.stageModifiers.damageReduction) {
            this.character.stageModifiers.damageReduction -= this.damageReduction;
            if (this.character.stageModifiers.damageReduction <= 0) {
                delete this.character.stageModifiers.damageReduction;
            }
        }
    }
}

/**
 * Register the Little Devil passive with the character system
 */
function registerLittleDevilPassive() {
    console.log('[LittleDevilPassive] Registering Little Devil passive...');
    
    // Register for both Little Devil characters
    if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') {
        // Register the passive for both character IDs
        window.PassiveFactory.registerPassive('little_devil_resilience', LittleDevilPassive);
        window.PassiveFactory.registerPassive('little_devil_female_resilience', LittleDevilPassive);
        
        console.log('[LittleDevilPassive] Successfully registered Little Devil passives');
    } else {
        console.warn('[LittleDevilPassive] PassiveFactory not available, retrying in 1000ms...');
        setTimeout(registerLittleDevilPassive, 1000);
    }
}

/**
 * Initialize the Little Devil passive system
 */
function initializeLittleDevilPassive() {
    console.log('[LittleDevilPassive] Initializing Little Devil passive...');
    
    // Wait for the DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerLittleDevilPassive);
    } else {
        registerLittleDevilPassive();
    }
}

// Auto-initialize when the script loads
initializeLittleDevilPassive();

// Export for use by other modules
if (typeof window !== 'undefined') {
    window.LittleDevilPassive = LittleDevilPassive;
    window.registerLittleDevilPassive = registerLittleDevilPassive;
} 