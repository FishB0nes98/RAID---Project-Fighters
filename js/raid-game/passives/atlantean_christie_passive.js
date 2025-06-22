/**
 * Atlantean Christie's Passive: Aquatic Meditation
 * When Christie doesn't act during a turn, she restores 1 additional Ability Point at the end of the turn
 */

class AtlanteanChristiePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'atlantean_christie_passive';
        this.name = 'Aquatic Meditation';
        this.description = 'When Christie doesn\'t act during a turn, she restores 1 additional Ability Point at the end of the turn through aquatic meditation.';
        this.actedThisTurn = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        
        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Initializing Aquatic Meditation for ${this.character.name}`);
        
        // Ensure Christie's mana system is properly initialized
        this.initializeManaSystem();
        
        // Track when Christie acts during a turn
        this.setupActionTracking();
        
        // Setup turn end listener
        this.setupTurnEndListener();
        
        this.initialized = true;
    }

    initializeManaSystem() {
        if (!this.character.stats) {
            console.error(`[ATLANTEAN CHRISTIE PASSIVE] Character stats not found during initialization`);
            return;
        }

        // Ensure mana properties are properly initialized
        if (typeof this.character.stats.mana !== 'number' || isNaN(this.character.stats.mana)) {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Initializing mana to 6`);
            this.character.stats.mana = 6;
        }

        if (typeof this.character.stats.currentMana !== 'number' || isNaN(this.character.stats.currentMana)) {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Initializing currentMana to base mana value: 6`);
            this.character.stats.currentMana = Math.min(this.character.stats.mana || 6, 6);
        }

        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Mana system initialized - Current: ${this.character.stats.currentMana}, Max: ${this.character.stats.mana}`);
    }

    setupActionTracking() {
        // Listen for when Christie is marked as acted in the game manager
        document.addEventListener('characterActed', (event) => {
            if (event.detail && event.detail.character && 
                event.detail.character.id === this.character.id) {
                console.log(`[ATLANTEAN CHRISTIE PASSIVE] Christie acted this turn via characterActed event`);
                this.actedThisTurn = true;
            }
        });

        // Also hook into ability usage as backup
        const originalUseAbility = this.character.useAbility.bind(this.character);
        this.character.useAbility = (index, target) => {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Christie acted this turn via useAbility`);
            this.actedThisTurn = true;
            return originalUseAbility(index, target);
        };
    }

    setupTurnEndListener() {
        // Listen for turn end events
        document.addEventListener('turnEnd', (event) => {
            if (event.detail && event.detail.phase === 'player') {
                this.onPlayerTurnEnd();
            }
        });

        // Also listen for phase changes
        document.addEventListener('phaseChange', (event) => {
            if (event.detail && event.detail.newPhase === 'ai') {
                this.onPlayerTurnEnd();
            } else if (event.detail && event.detail.newPhase === 'player') {
                // Reset action flag when player turn starts
                console.log(`[ATLANTEAN CHRISTIE PASSIVE] New player turn started, resetting action flag`);
                this.actedThisTurn = false;
            }
        });
    }

    onPlayerTurnEnd() {
        if (!this.character || this.character.isDead()) return;

        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Turn ended. Christie acted: ${this.actedThisTurn}`);

        // If Christie didn't act this turn, restore 1 additional ability point
        if (!this.actedThisTurn) {
            this.triggerAquaticMeditation();
        }

        // Reset for next turn
        this.actedThisTurn = false;
    }

    triggerAquaticMeditation() {
        if (!this.character || this.character.isDead()) return;

        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Triggering Aquatic Meditation`);

        // Safety checks and initialization
        if (!this.character.stats) {
            console.error(`[ATLANTEAN CHRISTIE PASSIVE] Character stats not found`);
            return;
        }

        // Initialize currentMana if it's undefined or NaN
        if (typeof this.character.stats.currentMana !== 'number' || isNaN(this.character.stats.currentMana)) {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Initializing currentMana to base value: 6`);
            this.character.stats.currentMana = Math.min(this.character.stats.mana || 6, 6);
        }

        // Initialize mana if it's undefined or NaN
        if (typeof this.character.stats.mana !== 'number' || isNaN(this.character.stats.mana)) {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Initializing mana to default value`);
            this.character.stats.mana = 6;
        }

        // Restore 1 ability point with proper number handling
        const oldMana = Number(this.character.stats.currentMana) || 0;
        // Use base max mana of 6 for Christie, not modified mana which could be buffed
        const maxMana = 6; // Christie's base maximum is always 6
        const newMana = Math.min(oldMana + 1, maxMana);
        
        this.character.stats.currentMana = newMana;

        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Mana calculation: ${oldMana} + 1 = ${newMana} (max: ${maxMana})`);

        // Only show effects if mana was actually restored
        if (newMana > oldMana) {
            // Show VFX
            this.showAquaticMeditationVFX();

            // Add battle log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(
                    `💧 ${this.character.name} restores 1 Ability Point through Aquatic Meditation`,
                    'heal passive'
                );
            }

            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(this.character);
                window.gameManager.uiManager.triggerManaAnimation(this.character, 'restore', 1);
            }

            console.log(`[ATLANTEAN CHRISTIE PASSIVE] Restored 1 AP: ${oldMana} -> ${newMana}`);
        } else {
            console.log(`[ATLANTEAN CHRISTIE PASSIVE] No AP restored - already at maximum (${newMana}/${maxMana})`);
        }
    }

    showAquaticMeditationVFX() {
        const characterElement = document.querySelector(`[data-character-id="${this.character.id}"]`);
        if (!characterElement) return;

        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Showing Aquatic Meditation VFX`);

        // Create meditation aura
        const meditationAura = document.createElement('div');
        meditationAura.className = 'aquatic-meditation-aura';
        characterElement.appendChild(meditationAura);

        // Create water ripples
        const ripplesContainer = document.createElement('div');
        ripplesContainer.className = 'meditation-ripples-container';
        characterElement.appendChild(ripplesContainer);

        // Create multiple ripples
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'meditation-ripple';
                ripplesContainer.appendChild(ripple);

                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 2000);
            }, i * 300);
        }

        // Create floating water droplets
        const dropletsContainer = document.createElement('div');
        dropletsContainer.className = 'meditation-droplets-container';
        characterElement.appendChild(dropletsContainer);

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const droplet = document.createElement('div');
                droplet.className = 'meditation-droplet';
                droplet.style.left = `${20 + Math.random() * 60}%`;
                droplet.style.animationDelay = `${Math.random() * 0.5}s`;
                dropletsContainer.appendChild(droplet);

                setTimeout(() => {
                    if (droplet.parentNode) {
                        droplet.parentNode.removeChild(droplet);
                    }
                }, 2500);
            }, i * 100);
        }

        // Create ability point restoration indicator
        const apIndicator = document.createElement('div');
        apIndicator.className = 'ap-restoration-indicator';
        apIndicator.textContent = '+1 AP';
        characterElement.appendChild(apIndicator);

        // Cleanup all VFX after animation
        setTimeout(() => {
            [meditationAura, ripplesContainer, dropletsContainer, apIndicator].forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }, 3000);
    }

    cleanup() {
        this.initialized = false;
        this.actedThisTurn = false;
        console.log(`[ATLANTEAN CHRISTIE PASSIVE] Cleaned up Aquatic Meditation passive`);
    }
}

// Global instance management
window.atlanteanChristiePassiveInstance = null;

// Auto-initialize when character is created
document.addEventListener('characterCreated', (event) => {
    if (event.detail && event.detail.character && event.detail.character.id === 'atlantean_christie') {
        console.log('[ATLANTEAN CHRISTIE PASSIVE] Character created event detected');
        
        // Clean up any existing instance
        if (window.atlanteanChristiePassiveInstance) {
            window.atlanteanChristiePassiveInstance.cleanup();
        }
        
        // Create new instance
        window.atlanteanChristiePassiveInstance = new AtlanteanChristiePassive(event.detail.character);
        window.atlanteanChristiePassiveInstance.initialize();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AtlanteanChristiePassive;
} 