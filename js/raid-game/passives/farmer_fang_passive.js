class FarmerFangPassive {
    constructor(character) {
        this.character = character;
        this.id = 'fang_full_heal_ally';
        this.name = 'Full Heal Ally';
        this.description = 'At the start of the turn, Farmer FANG fully heals a random ally (excluding himself).';
        this.icon = 'Icons/passives/fang_full_heal_ally.png'; // TODO: Create or find an appropriate icon
    }

    initialize(character) {
        // Nothing specific needed on initialization
        console.log(`${character.name}'s Full Heal Ally passive initialized.`);
    }

    onTurnStart(character, currentTurn) {
        // The character.js calls onTurnStart with (character, currentTurn) parameters
        if (!this.character || this.character.isDead()) {
            return; // Don't trigger if character is dead
        }

        console.log(`${this.character.name} passive 'Full Heal Ally' triggered at turn start.`);
        
        // Get gameManager from window
        const gameManager = window.gameManager;
        const log = gameManager && gameManager.addLogEntry ? 
            gameManager.addLogEntry.bind(gameManager) : 
            (message, type) => console.log(`[${type}] ${message}`);

        // Get allies, filter out dead ones AND self
        const allies = gameManager.getAllies(this.character).filter(ally => 
            !ally.isDead() && ally.id !== this.character.id 
        );

        if (allies.length > 0) {
            // --- Heal a random other ally --- 
            const targetAlly = allies[Math.floor(Math.random() * allies.length)];
            
                        // Calculate how much healing is needed to fully heal the ally
            const maxHp = targetAlly.stats.maxHp || targetAlly.stats.hp;
            const currentHp = targetAlly.stats.currentHp;
            const healAmount = maxHp - currentHp; // Only heal what's needed
            
            if (healAmount > 0) {
                const healResult = targetAlly.heal(healAmount, this.character, { 
                    passiveSource: this.id,
                    abilityId: 'fang_full_heal_ally' 
                });
                
                log(`${this.character.name}'s passive fully healed ${targetAlly.name} for ${healResult.healing} HP!`, 'passive');
                
                // Add VFX for the heal
                if (gameManager.uiManager) {
                    gameManager.uiManager.showFloatingText(targetAlly.instanceId || targetAlly.id, 'Full Heal!', 'heal');
                    
                    // Create healing VFX
                    const targetElement = document.getElementById(`character-${targetAlly.instanceId || targetAlly.id}`);
                    if (targetElement) {
                        const healVfx = document.createElement('div');
                        healVfx.className = 'fang-heal-vfx';
                        healVfx.innerHTML = '💚';
                        healVfx.style.cssText = `
                            position: absolute;
                            top: 10%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 2em;
                            animation: float-up 2s ease-out forwards;
                            pointer-events: none;
                            z-index: 1000;
                        `;
                        targetElement.appendChild(healVfx);
                        
                        setTimeout(() => {
                            if (healVfx.parentNode) {
                                healVfx.remove();
                            }
                        }, 2000);
                    }
                }
            } else {
                log(`${this.character.name}'s passive tried to heal ${targetAlly.name}, but they are already at full HP.`, 'info');
            }
        } else {
             console.log(`${this.character.name} passive tried to heal, but no valid living allies (excluding self) found.`);
             log(`${this.character.name}'s passive couldn't find an ally to heal.`, 'info');
        }
    }

    // Other potential passive triggers (onTurnEnd, onTakeDamage, etc.) can be added if needed
}

// Make the class globally accessible for hardcoded passive checks
window.FarmerFangPassive = FarmerFangPassive;

// Register the passive class with the PassiveFactory
if (window.PassiveFactory && typeof window.PassiveFactory.registerPassive === 'function') {
    window.PassiveFactory.registerPassive('fang_full_heal_ally', FarmerFangPassive);
    console.log('[farmer_fang_passive.js] Registered FarmerFangPassive.');
} else {
    console.error('ERROR: PassiveFactory registration failed in farmer_fang_passive.js.');
    console.error('Ensure PassiveFactory.js is loaded before this script.');
} 