// js/raid-game/passives/schoolboy_siegfried_passive.js

class SchoolboySiegfriedPassive {
    constructor() {
        this.id = 'schoolboy_siegfried_passive';
        this.name = 'Buff Connoisseur';
        this.description = 'Gains +125 Physical Damage for each active buff.';
        this.bonusPerBuff = 125;
        this.basePhysicalDamage = null; // Store the character's base PD
    }

    // Called when the passive is first attached to the character
    initialize(character) {
        if (character.id !== 'schoolboy_siegfried') return;

        // Store the initial physical damage as the base
        // Use baseStats now after the Character class refactor
        this.basePhysicalDamage = character.baseStats.physicalDamage; 
        console.log(`[Siegfried Passive] Initialized. Base PD stored as: ${this.basePhysicalDamage}`);
        // Initial calculation based on any starting buffs (if applicable)
        this.recalculateDamage(character);
    }

    // Called after a buff has been successfully added to the character
    onBuffAdded(character) {
        if (character.id !== 'schoolboy_siegfried' || this.basePhysicalDamage === null) return;

        console.log(`[Siegfried Passive] Buff added. Recalculating damage...`);
        this.recalculateDamage(character);
    }

    // Called after a buff has been successfully removed from the character
    onBuffRemoved(character) {
        if (character.id !== 'schoolboy_siegfried' || this.basePhysicalDamage === null) return;

        console.log(`[Siegfried Passive] Buff removed. Recalculating damage...`);
        this.recalculateDamage(character);
    }

    // Recalculates Siegfried's physical damage based on current buffs
    recalculateDamage(character) {
        if (this.basePhysicalDamage === null) {
            console.warn("[Siegfried Passive] Base physical damage not initialized. Cannot recalculate.");
            return;
        }

        // Ensure character.recalculateStats() is called *before* applying passive bonus
        // so that other buff effects are calculated first.
        character.recalculateStats(); 

        // Calculate the passive bonus based on the current buff count
        const currentBuffCount = character.buffs.length; // Count all buffs
        const passiveBonus = currentBuffCount * this.bonusPerBuff;

        // Apply the passive bonus on top of the recalculated stats
        // Start from the recalculated stat value (which includes other buffs)
        const damageBeforePassive = character.stats.physicalDamage; 
        const expectedDamage = damageBeforePassive + passiveBonus; // Add passive bonus to current value
        const oldDamage = character.stats.physicalDamage; // Re-read in case recalculateStats changed it? (Unlikely needed)

        // Enhanced logging specifically for debugging removal
        console.log(`[Siegfried Passive Recalc] BasePD: ${this.basePhysicalDamage}, Buffs: ${currentBuffCount}, DamageBeforePassive: ${damageBeforePassive}, PassiveBonus: ${passiveBonus}, ExpectedPD: ${expectedDamage}`);

        if (oldDamage !== expectedDamage) {
            character.stats.physicalDamage = expectedDamage;
            console.log(`[Siegfried Passive] PD updated from ${oldDamage} to ${expectedDamage} (${currentBuffCount} buffs adding ${passiveBonus})`);
            
            // Add log entry only if damage changed significantly
            if (Math.abs(oldDamage - expectedDamage) > 0) {
                 const change = expectedDamage - oldDamage;
                 const changeText = change > 0 ? `+${change}` : change;
                 // Modify log message slightly for clarity on decrease
                 const logMessage = `${character.name}'s ${this.name} provides ${changeText} Physical Damage (${currentBuffCount} buffs).`;
                 addLogEntry(logMessage, 'passive');
            }
            
            // Ensure UI is updated after stat change
             if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(character);
            }
        } else {
             console.log(`[Siegfried Passive] PD already correct (${expectedDamage}) after considering ${currentBuffCount} buffs.`);
        }
    }
}

// Make the passive available globally or register it if using a registry system
window.SchoolboySiegfriedPassive = SchoolboySiegfriedPassive; 