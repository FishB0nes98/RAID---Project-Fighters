// Passive definition for Angry Pig: Damage Heal

class AngryPigPassive {
    constructor() {
        this.healPercent = 0.50; // 50% of damage taken
    }

    // Called when the character owning this passive takes damage
    // This hook needs to be added in the Character.applyDamage method
    onDamageTaken(character, damageInfo, attacker) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        console.log(`[Passive Debug - ${this.constructor.name}] onDamageTaken triggered for ${character.name}. DamageInfo:`, damageInfo);

        // Calculate heal amount from the actual damage taken
        const damageAmount = damageInfo.damage;
        const healAmount = Math.floor(damageAmount * this.healPercent);

        if (healAmount > 0) {
            log(`${character.name}'s passive activates! Healing for ${healAmount} HP (${this.healPercent * 100}% of damage taken).`, 'passive');

            // Apply the heal
            const actualHeal = character.heal(healAmount, { source: 'passive' }); // Pass source option
            log(`${character.name} healed for ${actualHeal} HP via passive.`);
            console.log(`[Passive Heal Debug - ${character.name}] HP after heal call: ${character.stats.currentHp}`);

            // Play sound effect
            // playSound('sounds/passive_heal.mp3', 0.7);

            // Add VFX for healing
            this.showHealVFX(character, actualHeal);

            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }
        }
    }

    showHealVFX(character, healAmount) {
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        if (characterElement) {
            // Simple Green Glow
            const glowVfx = document.createElement('div');
            glowVfx.className = 'passive-heal-glow-vfx'; // Needs CSS
            characterElement.appendChild(glowVfx);

            // Floating Heal Text
            const textVfx = document.createElement('div');
            textVfx.className = 'passive-heal-text-vfx'; // Needs CSS
            textVfx.textContent = `+${healAmount}`;
            characterElement.appendChild(textVfx);

            setTimeout(() => {
                glowVfx.remove();
                textVfx.remove();
            }, 1200);
        }
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`AngryPigPassive initialized for ${character.name}`);
        // No specific initialization needed beyond the constructor here
        // Hooking into onDamageTaken happens in Character.applyDamage
    }
}

// Make the class globally available
window.AngryPigPassive = AngryPigPassive; 