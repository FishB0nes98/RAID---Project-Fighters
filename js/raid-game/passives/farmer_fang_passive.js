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

    onTurnStart(gameManager) {
        if (!this.character || this.character.isDead()) {
            return; // Don't trigger if character is dead
        }

        console.log(`${this.character.name} passive 'Full Heal Ally' triggered at turn start.`);
        const log = gameManager.addLogEntry.bind(gameManager);

        // Get allies, filter out dead ones AND self
        const allies = gameManager.getAllies(this.character).filter(ally => 
            !ally.isDead() && ally.id !== this.character.id 
        );

        if (allies.length > 0) {
            // --- Heal a random other ally --- 
            const targetAlly = allies[Math.floor(Math.random() * allies.length)];
            
            const healAmount = targetAlly.stats.maxHp; // Heal to full
            targetAlly.heal(healAmount, this.character, { passiveSource: this.id });
            log(`${this.character.name}'s passive fully healed ${targetAlly.name}!`, 'passive heal'); // Added a specific class for styling

            // Optional: Add VFX/SFX for the heal
            if (gameManager.uiManager) {
                gameManager.uiManager.showFloatingText(targetAlly.instanceId || targetAlly.id, 'Full Heal!', 'heal');
                // Potentially add a specific heal VFX from Fang to the ally
                // gameManager.uiManager.playHealEffect(this.character, targetAlly); 
            }
        } else {
             console.log(`${this.character.name} passive tried to heal, but no valid living allies (excluding self) found.`);
             log(`${this.character.name}'s passive couldn't find an ally to heal.`, 'passive info');
        }
    }

    // Other potential passive triggers (onTurnEnd, onTakeDamage, etc.) can be added if needed
}

// Register the passive class with the PassiveFactory
if (window.PassiveFactory && typeof window.PassiveFactory.registerPassive === 'function') {
    window.PassiveFactory.registerPassive('fang_full_heal_ally', FarmerFangPassive);
    console.log('[farmer_fang_passive.js] Registered FarmerFangPassive.');
} else {
    console.error('ERROR: PassiveFactory registration failed in farmer_fang_passive.js.');
    console.error('Ensure PassiveFactory.js is loaded before this script.');
} 