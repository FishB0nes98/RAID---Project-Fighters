class AtlanteanShinnokPassive {
  constructor() {
    this.character = null;
    this.id = 'shinnok_shadow_protection';
    this.name = 'Shadow Protection';
    this.description = 'Takes 50% less damage while at least one ally is alive.';
  }

  initialize(character) {
    this.character = character;
    // Apply visible shadow protection buff for UI tracking
    this.buffId = 'shadow_protection_buff';

    const createOrRefreshBuff = () => {
      const gm = window.gameManager;
      const alliesAlive = gm ? gm.getAllies(character).filter(ch => !ch.isDead() && ch !== character) : [];

      const hasBuff = character.hasBuff(this.buffId);

      if (alliesAlive.length > 0) {
        // Ensure buff exists
        if (!hasBuff) {
          const buff = {
            id: this.buffId,
            name: 'Shadow Protection',
            icon: 'Icons/abilities/shadow_protection.png',
            duration: -1, // permanent
            // Optional description used in tooltips / stats UI
            description: '50% damage reduction while at least one ally is alive.',
            // Keep reference for custom per-turn logic (not strictly necessary)
            onTurnStart: () => { /* handled globally by listener below */ }
          };
          character.addBuff(buff);
        }
      } else if (hasBuff) {
        // Remove buff when no allies remain
        character.removeBuff(this.buffId);
      }
    };

    // Initial check (after tiny delay so allies are registered)
    setTimeout(createOrRefreshBuff, 50);

    // Listen for global TurnStart to re-evaluate the buff each turn
    this._turnStartListener = () => createOrRefreshBuff();
    document.addEventListener('TurnStart', this._turnStartListener);

    // Override applyDamage for this character only
    if (!character._shinnokApplyHooked) {
      const original = character.applyDamage.bind(character);
      const passiveRef = this;
      character.applyDamage = function(amount, type, caster = null, options = {}) {
        let finalAmount = amount;
        const gm = window.gameManager;
        if (gm) {
          const alliesAlive = gm.getAllies(passiveRef.character).filter(ch => !ch.isDead() && ch !== passiveRef.character);
          if (alliesAlive.length > 0) {
            finalAmount = amount * 0.5; // 50% reduction
          }
        }
        return original(finalAmount, type, caster, options);
      };
      character._shinnokApplyHooked = true;
    }
  }

  // Clean-up to avoid memory leaks
  destroy() {
    if (this._turnStartListener) {
      document.removeEventListener('TurnStart', this._turnStartListener);
    }
    if (this.character && this.character.hasBuff && this.character.hasBuff(this.buffId)) {
      this.character.removeBuff(this.buffId);
    }
  }

  // Handle character death - required by GameManager.handleCharacterDeath
  onDeath(character, gameManager) {
    console.log(`[AtlanteanShinnokPassive] onDeath called for ${character.name}`);
    
    // Clean up any buffs and event listeners
    this.destroy();
    
    // Optional: Add any death-specific logic here if needed
    // For example, could trigger special effects or buff allies
  }
}

// Register with PassiveFactory if available
if (window.PassiveFactory) {
  window.PassiveFactory.registerPassive('shinnok_shadow_protection', AtlanteanShinnokPassive);
}

// Expose globally
window.AtlanteanShinnokPassive = AtlanteanShinnokPassive; 