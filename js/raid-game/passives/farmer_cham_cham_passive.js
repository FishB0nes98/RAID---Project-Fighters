class FarmerChamChamPassive {
    constructor() {
        this.lifestealIncrease = 0.05; // 5% lifesteal increase
    }

    // Called at the start of the character's turn (needs to be triggered by GameManager)
    onTurnStart(character, turnNumber) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        if (turnNumber > 0 && turnNumber % 5 === 0) {
            // Increase base lifesteal permanently
            character.baseStats.lifesteal = (character.baseStats.lifesteal || 0) + this.lifestealIncrease;
            
            // Recalculate stats to apply the change immediately
            character.recalculateStats();

            log(`${character.name}'s Farmer's Resilience activates! Permanently gained ${this.lifestealIncrease * 100}% Lifesteal. Current Lifesteal: ${(character.stats.lifesteal * 100).toFixed(1)}%`, 'passive-buff');

            // Play sound effect
            playSound('sounds/heal_placeholder.mp3', 0.6); // Placeholder sound

            // Add VFX
            this.showLifestealGainVFX(character);

            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }
        }
    }

    showLifestealGainVFX(character) {
        const elementId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            // Simple glow effect
            const glowVfx = document.createElement('div');
            glowVfx.className = 'passive-lifesteal-gain-glow-vfx'; // Needs CSS
            charElement.appendChild(glowVfx);

            // Text indicator
            const textVfx = document.createElement('div');
            textVfx.className = 'passive-lifesteal-gain-text-vfx'; // Needs CSS
            textVfx.textContent = `+${this.lifestealIncrease * 100}% LS`;
            charElement.appendChild(textVfx);

            // Remove VFX after animation
            setTimeout(() => {
                glowVfx.remove();
                textVfx.remove();
            }, 1500);
        }
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`FarmerChamChamPassive initialized for ${character.name}`);
        // No initial setup needed beyond instantiation
    }
}

// Make the class globally available
window.FarmerChamChamPassive = FarmerChamChamPassive; 