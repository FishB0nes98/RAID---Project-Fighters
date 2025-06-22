class AtlanteanKotalKahnPassive {
    constructor() {
        this.character = null;
        this.maxSunlight = 100;

        // Bind event listeners once so we can remove them later
        this.onDamageTaken = this.onDamageTaken.bind(this);
        this.onDamageDealt = this.onDamageDealt.bind(this);
    }

    /**
     * Called by CharacterFactory after the passive instance is created.
     * @param {Character} character
     */
    initialize(character) {
        this.character = character;
        this.maxSunlight = this.character.stats.maxSunlight || 100;

        // Ensure sunlight stats exist
        if (typeof this.character.stats.currentSunlight !== 'number') {
            this.character.stats.currentSunlight = 0;
        }

        // Remove mana usage for Kotal Kahn (he relies on Sunlight instead)
        this.character.stats.currentMana = 0;
        this.character.stats.maxMana = 0;

        // Listen for combat events
        document.addEventListener('CharacterDamaged', this.onDamageTaken);
        document.addEventListener('character:damage-dealt', this.onDamageDealt);
    }

    addSunlight(amount) {
        if (amount <= 0) return;
        const prevValue = Number.isFinite(this.character.stats.currentSunlight) ? this.character.stats.currentSunlight : 0;
        const newValue = prevValue + (Number.isFinite(amount) ? amount : 0);
        this.character.stats.currentSunlight = Math.min(this.maxSunlight, newValue);
        const prev = prevValue;
        if (this.character.stats.currentSunlight !== prev) {
            if (window.updateCharacterUI) {
                window.updateCharacterUI(this.character);
            }
        }
    }

    onDamageTaken(event) {
        // Ensure the event has a detail payload before attempting to access it
        if (!event || !event.detail) {
            return; // Malformed event – ignore
        }

        const { character } = event.detail;
        if (character === this.character) {
            this.addSunlight(15);
        }
    }

    onDamageDealt(event) {
        // Guard against events without a detail object
        if (!event || !event.detail) {
            return;
        }

        const { character: attacker } = event.detail;
        if (attacker === this.character) {
            this.addSunlight(10);
        }
    }

    // Clean up listeners when character dies or game ends
    destroy() {
        document.removeEventListener('CharacterDamaged', this.onDamageTaken);
        document.removeEventListener('character:damage-dealt', this.onDamageDealt);
    }

    // Handle character death - required by GameManager.handleCharacterDeath
    onDeath(character, gameManager) {
        console.log(`[AtlanteanKotalKahnPassive] onDeath called for ${character.name}`);
        
        // Clean up event listeners
        this.destroy();
        
        // Optional: Add any death-specific logic here if needed
    }
}

// Register the passive with the global PassiveFactory
if (window.PassiveFactory) {
    window.PassiveFactory.registerPassive('kotal_sunlight_collector', AtlanteanKotalKahnPassive);
} 