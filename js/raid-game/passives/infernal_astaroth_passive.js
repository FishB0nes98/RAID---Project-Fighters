// js/raid-game/passives/infernal_astaroth_passive.js

class InfernalAstarothPassive {
    initialize(character) {
        this.character = character;
        console.log(`${this.character.name}'s Molten Aura passive initialized.`);
    }

    // Hook called when the character takes damage
    onDamageTaken(character, damageInfo, attacker) {
        if (!attacker || attacker.isDead() || !character || !character.stats || damageInfo.damage <= 0) {
            return; // No attacker or no damage taken
        }

        // Calculate passive damage (20% of Astaroth's current Magical Damage)
        const passiveDamage = Math.floor(character.stats.magicalDamage * 0.20);

        if (passiveDamage <= 0) {
            return;
        }

        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

        log(`${character.name}'s Molten Aura reflects damage back to ${attacker.name}!`);

        // Apply magical damage to the attacker
        // Note: We pass 'character' as the caster here for the applyDamage context,
        // indicating the source of the passive damage.
        const result = attacker.applyDamage(passiveDamage, 'magical', character);

        log(`${attacker.name} takes ${result.damage} magical damage from Molten Aura.`);

        // Add visual effect for the passive proc on Astaroth
        const characterElement = document.getElementById(`character-${character.id}`);
        if (characterElement) {
            const auraVfx = document.createElement('div');
            auraVfx.className = 'molten-aura-vfx'; // Needs CSS definition
            characterElement.appendChild(auraVfx);
            setTimeout(() => auraVfx.remove(), 800); // Remove after animation
        }
    }

    // Add other relevant passive methods if needed (e.g., onTurnStart, onAbilityCast)
} 