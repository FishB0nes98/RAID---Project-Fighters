class AtlanteanZasalamelPassive {
  constructor() {
    this.id = 'zasalamel_cooldown_lifesteal';
    this.name = 'Temporal Hunger';
    this.description = 'Gains 5% lifesteal per active ability cooldown across all characters.';
    this.character = null;
    this.baseLifeSteal = 0;
    this.updateBonus = this.updateBonus.bind(this);
  }

  initialize(character) {
    this.character = character;
    this.baseLifeSteal = character.stats.lifesteal || character.stats.lifeSteal || 0;

    // ID used for the on-screen indicator
    this.buffId = 'temporal_hunger_buff';

    // Helper to create/update the visible buff so players can track the bonus
    this.syncBuff = () => {
      if (!this.character) return;

      const currentLS = (this.character.stats.lifesteal || 0) * 100; // convert to %
      const description = `Current Lifesteal: ${currentLS.toFixed(0)}%`;

      const hasBuff = this.character.hasBuff && this.character.hasBuff(this.buffId);

      if (!hasBuff) {
        const buff = {
          id: this.buffId,
          name: 'Temporal Hunger',
          icon: 'Icons/Profile/Zasalamel.png',
          duration: -1,
          description
        };
        this.character.addBuff(buff);
      } else {
        // Update existing buff description so tooltip shows new value
        const buffObj = this.character.buffs.find(b => b.id === this.buffId);
        if (buffObj) buffObj.description = description;
      }
    };

    // Update immediately (after slight delay to allow UI) and every TurnStart
    setTimeout(this.updateBonus, 50);
    document.addEventListener('TurnStart', this.updateBonus);
  }

  updateBonus() {
    const gm = window.gameManager;
    if (!gm || !this.character) return;

    const allChars = [...gm.gameState.playerCharacters, ...gm.gameState.aiCharacters];
    let cooldowns = 0;
    allChars.forEach(ch => {
      if (!ch || !ch.abilities) return;
      ch.abilities.forEach(ab => {
        if (ab.currentCooldown && ab.currentCooldown > 0) cooldowns++;
      });
    });

    const bonusLS = 0.05 * cooldowns; // 5% per cooldown
    this.character.stats.lifesteal = this.baseLifeSteal + bonusLS;

    // Keep UI indicator in sync
    this.syncBuff();

    if (typeof updateCharacterUI === 'function') updateCharacterUI(this.character);
  }

  destroy() {
    document.removeEventListener('TurnStart', this.updateBonus);
    if (this.character && this.character.hasBuff && this.character.hasBuff(this.buffId)) {
      this.character.removeBuff(this.buffId);
    }
  }

  // Handle character death - required by GameManager.handleCharacterDeath
  onDeath(character, gameManager) {
    console.log(`[AtlanteanZasalamelPassive] onDeath called for ${character.name}`);
    
    // Clean up any buffs and event listeners
    this.destroy();
    
    // Optional: Add any death-specific logic here if needed
  }
}

if (window.PassiveFactory) {
  window.PassiveFactory.registerPassive('zasalamel_cooldown_lifesteal', AtlanteanZasalamelPassive);
}

window.AtlanteanZasalamelPassive = AtlanteanZasalamelPassive; 