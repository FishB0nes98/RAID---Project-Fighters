/* Atlantean Sub Zero Passive: Frozen Aura
   Attackers have an 8% chance to be frozen for 2 turns whenever they damage Atlantean Sub Zero. */

class AtlanteanSubZeroPassive {
    constructor() {
        this.id = 'atlantean_sub_zero_passive';
        this.name = 'Frozen Aura';
        this.description = 'Attackers have an 8% chance to be frozen for 2 turns.';
    }

    initialize(character) {
        // Only attach once per game session
        if (AtlanteanSubZeroPassive._initialized) return;
        AtlanteanSubZeroPassive._initialized = true;

        // Ensure the global freeze aura listener is active
        if (window.AtlanteanSubZeroAbilities && typeof AtlanteanSubZeroAbilities.initializeFrozenAura === 'function') {
            AtlanteanSubZeroAbilities.initializeFrozenAura();
        }

        // Optional: add subtle icy aura VFX or indicator here
    }

    // No additional hooks required because the effect is handled globally by AtlanteanSubZeroAbilities
}

// Expose globally so CharacterFactory can detect it
window.AtlanteanSubZeroPassive = AtlanteanSubZeroPassive; 