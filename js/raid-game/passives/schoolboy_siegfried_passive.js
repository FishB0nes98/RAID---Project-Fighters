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
        character.recalculateStats('siegfried_passive_initialize');
    }

    // Called after a buff has been successfully added to the character
    onBuffAdded(character) {
        if (character.id !== 'schoolboy_siegfried') return;

        console.log(`[Siegfried Passive] Buff added. Triggering recalculation...`);
        // The bonus is now calculated automatically in character.recalculateStats()
        character.recalculateStats('siegfried_passive_buff_added');
    }

    // Called after a buff has been successfully removed from the character
    onBuffRemoved(character) {
        if (character.id !== 'schoolboy_siegfried') return;

        console.log(`[Siegfried Passive] Buff removed. Triggering recalculation...`);
        // The bonus is now calculated automatically in character.recalculateStats()
        character.recalculateStats('siegfried_passive_buff_removed');
    }
}

// Make the passive available globally or register it if using a registry system
window.SchoolboySiegfriedPassive = SchoolboySiegfriedPassive; 