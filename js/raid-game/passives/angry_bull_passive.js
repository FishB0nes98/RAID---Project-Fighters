// Passive definition for Angry Bull: Armor Gain

class AngryBullPassive {
    constructor() {
        this.armorIncreasePercent = 0.01; // 1% armor increase (relative to base)
        this.totalArmorGained = 0; // Track total % gain
    }

    // Called when the character owning this passive takes damage
    // This hook needs to be added in the Character.applyDamage method
    onDamageTaken(character, damageInfo, attacker) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        console.log(`[Passive Debug - ${this.constructor.name}] onDamageTaken triggered for ${character.name}. DamageInfo:`, damageInfo);

        // Get base armor (requires baseStats to be stored on character)
        const baseArmor = character.baseStats ? character.baseStats.armor : character.stats.armor; // Fallback to current if base not found
        console.log(`[Passive Debug - ${this.constructor.name}] Base armor for calculation: ${baseArmor}`);
        if (baseArmor === undefined || baseArmor === null) {
            log(`Warning: Could not get base armor for ${character.name} to calculate passive gain.`, "warning");
            return; // Cannot calculate gain without base
        }

        // Calculate the flat armor increase amount based on the percentage of base armor
        const flatArmorIncrease = Math.max(1, Math.floor(baseArmor * this.armorIncreasePercent)); // Ensure at least 1 armor is gained
        console.log(`[Passive Debug - ${this.constructor.name}] Calculated flat armor increase: ${flatArmorIncrease}`);

        // Increase base armor stat (permanently for the battle)
        // This modifies the character.baseStats object so recalculateStats() preserves the change
        character.baseStats.armor = (character.baseStats.armor || 0) + flatArmorIncrease;

        // Update tracking stat (track the total flat amount gained)
        this.totalArmorGained = (this.totalArmorGained || 0) + flatArmorIncrease;
        // Attach this tracking stat to the character for UI display/tooltip
        character.armorFromPassive = this.totalArmorGained;

        // Recalculate stats to apply the base stat change to current stats
        character.recalculateStats();

        log(`${character.name}'s passive activates! Permanently gained +${flatArmorIncrease} Armor from taking damage. Current Armor: ${character.stats.armor}`, 'passive');

        // Play sound effect
        // playSound('sounds/armor_increase.mp3', 0.7);

        // Add VFX for stat gain
        this.showArmorGainVFX(character, flatArmorIncrease);

        // Update caster UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
    }

    showArmorGainVFX(character, amountGained) {
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        if (characterElement) {
            // Rock/Stone hardening effect
            const stoneVfx = document.createElement('div');
            stoneVfx.className = 'armor-gain-stone-vfx'; // Needs CSS
            characterElement.appendChild(stoneVfx);

            // Floating text
            const textVfx = document.createElement('div');
            textVfx.className = 'armor-gain-text-vfx'; // Needs CSS
            textVfx.textContent = `+${amountGained} Armor`;
            characterElement.appendChild(textVfx);

            setTimeout(() => {
                stoneVfx.remove();
                textVfx.remove();
            }, 1300);
        }
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`AngryBullPassive initialized for ${character.name}`);
        this.totalArmorGained = 0; // Reset tracking
        character.armorFromPassive = 0;
        // Hooking into onDamageTaken happens in Character.applyDamage
    }
}

// Make the class globally available
window.AngryBullPassive = AngryBullPassive; 