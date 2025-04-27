// Passive definition for Angry Chicken: Dodge Gain

class AngryChickenPassive {
    constructor() {
        this.dodgeIncreasePerTurn = 0.01; // 1% dodge increase per turn
        this.totalDodgeGained = 0; // Track total dodge gained
    }

    // Called at the start of the character's turn
    // This hook needs to be added in the Character.processEffects or GameManager turn logic
    onTurnStart(character) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // Increase base dodge chance permanently
        character.baseStats.dodgeChance = (character.baseStats.dodgeChance || 0) + this.dodgeIncreasePerTurn;
        // Optional: Clamp dodge chance (e.g., to a max of 0.75 or 75%)
        // character.baseStats.dodgeChance = Math.min(0.75, character.baseStats.dodgeChance);

        // Update tracking stat
        this.totalDodgeGained = (this.totalDodgeGained || 0) + this.dodgeIncreasePerTurn;
        // Attach this tracking stat to the character for UI display/tooltip
        character.dodgeFromPassive = this.totalDodgeGained;

        // Recalculate stats to apply the change immediately
        character.recalculateStats();

        log(`${character.name}'s passive activates! Permanently gained ${this.dodgeIncreasePerTurn * 100}% Dodge Chance. Current Dodge: ${(character.stats.dodgeChance * 100).toFixed(1)}%`, 'passive');

        // Play sound effect
        // playSound('sounds/stat_increase.mp3', 0.6);

        // Add VFX for stat gain
        this.showDodgeGainVFX(character);

        // Update caster UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
    }

    showDodgeGainVFX(character) {
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        if (characterElement) {
            // Swirling wind/feather effect
            const swirlVfx = document.createElement('div');
            swirlVfx.className = 'dodge-gain-swirl-vfx'; // Needs CSS
            characterElement.appendChild(swirlVfx);

            // Floating text
            const textVfx = document.createElement('div');
            textVfx.className = 'dodge-gain-text-vfx'; // Needs CSS
            textVfx.textContent = `+${this.dodgeIncreasePerTurn * 100}% Dodge`;
            characterElement.appendChild(textVfx);

            setTimeout(() => {
                swirlVfx.remove();
                textVfx.remove();
            }, 1300);
        }
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`AngryChickenPassive initialized for ${character.name}`);
        this.totalDodgeGained = 0; // Reset tracking on initialization
        character.dodgeFromPassive = 0;
        // Hooking into onTurnStart needs to be implemented elsewhere
        // (e.g., in Character.processEffects or GameManager.executeAITurn)
    }
}

// Make the class globally available
window.AngryChickenPassive = AngryChickenPassive; 