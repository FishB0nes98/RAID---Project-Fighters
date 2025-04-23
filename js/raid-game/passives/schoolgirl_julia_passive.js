// --- Schoolgirl Julia Passive Handler ---
class SchoolgirlJuliaPassive {
    constructor() {
        this.character = null;
        this.passiveName = "Healing Empowerment"; // Store passive name for logging
        this.vfxClass = "julia-passive-gain-vfx"; // Reference CSS class for gain VFX
        this.damageGained = 0; // Track total damage gained from passive
    }

    initialize(character) {
        this.character = character;
        // Initialize with base physical damage to track passive gains accurately
        this.initialPhysicalDamage = character.stats.physicalDamage;
        console.log(`${this.character.name}'s passive '${this.passiveName}' initialized.`);
        
        // Create the passive display element
        this.createPassiveDisplay(character);
    }

    // Called when the character this handler is attached to receives healing
    onHealReceived(character, healAmount) {
        if (!character || healAmount <= 0) return;

        // Passive logic: Gain +50 Physical Damage
        character.stats.physicalDamage += 50;
        this.damageGained += 50;
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        log(`${character.name}'s ${this.passiveName} increases Physical Damage by 50! (Now ${character.stats.physicalDamage})`);

        // Trigger VFX
        this.triggerPassiveGainVFX(character);

        // Update passive display
        this.updatePassiveDisplay(character);
        
        // Update UI
        updateCharacterUI(character);

        // Cooldown Reduction for R Ability
        const rAbility = character.abilities.find(ability => ability && ability.id === 'schoolgirl_julia_r');
        if (rAbility && rAbility.currentCooldown > 0) {
            rAbility.currentCooldown--;
            log(`${character.name}'s Spirits Strength cooldown reduced by 1 due to healing! (New cooldown: ${rAbility.currentCooldown})`);
        }
    }

    // Called when the character this handler is attached to deals healing to a target (or targets)
    onHealDealt(caster, targetOrTargets, healAmount) {
        if (!caster || healAmount <= 0) return;

        // Check if the target is different from the caster.
        // Passive should only trigger in onHealDealt if healing someone *else*.
        // Self-healing triggers are handled by onHealReceived.
        const isHealingOthers = Array.isArray(targetOrTargets)
            ? targetOrTargets.some(t => t.id !== caster.id)
            : targetOrTargets.id !== caster.id;

        // Trigger only if healing others.
        if (isHealingOthers) {
            // Passive logic: Gain +50 Physical Damage
            caster.stats.physicalDamage += 50;
            this.damageGained += 50;

            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${caster.name}'s ${this.passiveName} increases Physical Damage by 50! (Now ${caster.stats.physicalDamage})`);

            // Trigger VFX
            this.triggerPassiveGainVFX(caster);

            // Update passive display
            this.updatePassiveDisplay(caster);

            // Update UI
            updateCharacterUI(caster);
        }
    }

    // Helper to trigger visual effect
    triggerPassiveGainVFX(character) {
        const charElement = document.getElementById(`character-${character.id}`);
        if (charElement) {
            const vfx = document.createElement('div');
            vfx.className = this.vfxClass;
            vfx.textContent = '+50 PD';
            charElement.appendChild(vfx);
            // Automatically remove after animation (defined in CSS)
            setTimeout(() => vfx.remove(), 1000);
        }
    }
    
    // Create the passive display
    createPassiveDisplay(character) {
        const charElement = document.getElementById(`character-${character.id}`);
        if (!charElement) return;
        
        // Find the image container within the character slot
        const imageContainer = charElement.querySelector('.image-container');
        if (!imageContainer) {
            console.error(`Image container not found for ${character.name}`);
            return; // Don't create if container is missing
        }

        // Check if display already exists within the image container
        if (imageContainer.querySelector('.julia-passive-counter')) return;
        
        // Create container
        const counterContainer = document.createElement('div');
        counterContainer.className = 'julia-passive-counter';
        
        // Create icon
        const icon = document.createElement('div');
        icon.className = 'julia-passive-icon';
        
        // Create counter value
        const counter = document.createElement('div');
        counter.className = 'julia-passive-value';
        counter.textContent = `+${this.damageGained}`;
        
        // Assemble display
        counterContainer.appendChild(icon);
        counterContainer.appendChild(counter);
        
        // Add to the image container element
        imageContainer.appendChild(counterContainer);
    }
    
    // Update the passive display value
    updatePassiveDisplay(character) {
        const charElement = document.getElementById(`character-${character.id}`);
        if (!charElement) return;
        
        const counterValue = charElement.querySelector('.julia-passive-value');
        if (counterValue) {
            counterValue.textContent = `+${this.damageGained}`;
            
            // Add pulse animation class and remove it after animation completes
            counterValue.classList.add('pulse');
            setTimeout(() => counterValue.classList.remove('pulse'), 600);
            
            // Update counter container with "upgraded" class for milestone visual enhancement
            const counterContainer = charElement.querySelector('.julia-passive-counter');
            if (counterContainer) {
                // Set different visual tiers based on amount gained
                counterContainer.classList.remove('tier1', 'tier2', 'tier3');
                
                if (this.damageGained >= 500) {
                    counterContainer.classList.add('tier3');
                } else if (this.damageGained >= 250) {
                    counterContainer.classList.add('tier2');
                } else if (this.damageGained >= 100) {
                    counterContainer.classList.add('tier1');
                }
            }
        } else {
            // If display doesn't exist yet, create it
            this.createPassiveDisplay(character);
        }
    }
}

// Add basic CSS for the passive proc VFX (ideally move to a dedicated CSS file like schoolgirl_julia_abilities.css)
const juliaPassiveStyle = document.createElement('style');
juliaPassiveStyle.textContent = `
.julia-passive-proc-vfx {
    position: absolute;
    top: -15px; /* Adjust position as needed */
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 5px;
    background-color: rgba(255, 105, 180, 0.8); /* Pinkish color */
    color: white;
    font-size: 0.8em;
    font-weight: bold;
    border-radius: 4px;
    z-index: 10;
    animation: floatUpFade 1s ease-out forwards;
}

/* Reuse existing floatUpFade animation if available, otherwise define it */
@keyframes floatUpFade {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}
`;
document.head.appendChild(juliaPassiveStyle);

// Passive Handler for Schoolgirl Julia: Healing Empowerment

class SchoolgirlJuliaPassiveHandler {
    constructor() {
        this.id = 'schoolgirl_julia_passive';
        this.name = 'Healing Empowerment';
        // Optional: Store the description if needed elsewhere
        // this.description = "Whenever Julia heals herself (including lifesteal) or heals an ally, she permanently gains +50 Physical Damage.";
        console.log("Schoolgirl Julia Passive Handler Initialized");
    }

    /**
     * Creates a floating text effect above the caster.
     * @param {Character} caster - The character triggering the passive (Julia).
     * @param {string} text - The text to display (e.g., "+50 PD").
     */
    _showPassiveIndicator(caster, text) {
        const casterElement = document.getElementById(`character-${caster.id}`);
        if (!casterElement) return;

        const indicator = document.createElement('div');
        indicator.className = 'passive-indicator julia-passive-empowerment'; // Use specific class for styling
        indicator.textContent = text;

        // Append to the game area or character element, adjust styling as needed
        casterElement.appendChild(indicator);

        // Remove the indicator after animation (e.g., 1.5 seconds)
        setTimeout(() => {
            indicator.remove();
        }, 1500);
    }

    /**
     * Called whenever Julia potentially deals healing.
     * @param {Character} caster - The character who dealt the heal (should be Julia).
     * @param {Character} target - The character who received the heal.
     * @param {number} healAmount - The amount of health restored.
     */
    onHealDealt(caster, target, healAmount) {
        // Ensure the trigger is actually Julia and a heal occurred
        if (!caster || caster.id !== 'schoolgirl_julia' || healAmount <= 0) {
            // console.log("Passive condition not met:", caster ? caster.id : 'no caster', healAmount); // Debug logging
            return;
        }

        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const damageIncrease = 50;

        // Increase physical damage permanently
        caster.stats.physicalDamage += damageIncrease;

        log(`${caster.name}'s Healing Empowerment passive triggers! Permanently gained +${damageIncrease} Physical Damage.`);
        console.log(`Julia (${caster.id}) PD increased to: ${caster.stats.physicalDamage}`);

        // Show visual indicator
        this._showPassiveIndicator(caster, `+${damageIncrease} PD`);

        // Update Julia's UI to reflect the stat change (if necessary, depends on UI implementation)
        // This might involve calling a global update function or an update method on the caster
        if (typeof updateCharacterUI === 'function') {
             updateCharacterUI(caster);
        } else {
             console.warn("updateCharacterUI function not found for passive update.");
        }
    }

     /**
      * Called when the character associated with this passive is healed.
      * This handles the "heals herself" part of the description.
      * @param {Character} character - The character being healed (Julia).
      * @param {number} healAmount - The amount of health restored.
      * @param {Character} healer - The source of the heal (can be anyone, including Julia herself).
      */
     onHealed(character, healAmount, healer) {
         // Check if Julia healed herself
         if (character.id === 'schoolgirl_julia' && healAmount > 0) {
             // We call onHealDealt here to consolidate the logic
             // The caster is Julia (character), the target is also Julia (character)
             this.onHealDealt(character, character, healAmount);
         }
     }

    // Add other potential passive hooks if needed (e.g., onTurnStart, onDamageDealt)
}

// Make the handler available globally or through a factory/registry
window.PassiveHandlers = window.PassiveHandlers || {};
window.PassiveHandlers.schoolgirl_julia_passive = SchoolgirlJuliaPassiveHandler;
console.log("Registered SchoolgirlJuliaPassiveHandler."); 