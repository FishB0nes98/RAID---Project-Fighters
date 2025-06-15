class GrokHellLordPassive {
    constructor() {
        this.character = null;
    }

    /**
     * Called automatically after Grok is created by CharacterFactory
     * @param {Character} character - The Grok instance this passive belongs to
     */
    initialize(character) {
        this.character = character;
        console.log(`[GrokHellLordPassive] Initialised for ${character?.name}`);
        this.setupDamageRedirection();
        // Optionally add a subtle VFX aura here in future
    }

    /**
     * Hooks into Character.applyDamage once (global) to intercept damage that
     * would be applied to Grok and redirect it to a random living ally.
     */
    setupDamageRedirection() {
        if (Character.prototype._grokPassiveHooked) return; // Already hooked

        const originalApplyDamage = Character.prototype.applyDamage;
        const originalAddDebuff = Character.prototype.addDebuff;
        const passiveInstance = this; // Store reference to the passive instance

        Character.prototype.applyDamage = function (amount, type, caster = null, options = {}) {
            // If target is Grok and the call is not already a redirection
            if (this?.id === 'grok_hell_lord' && !options.isGrokRedirection && amount > 0 && !this.isDead()) {
                try {
                    const gm = window.gameManager;
                    if (gm && typeof gm.getAllies === 'function') {
                        // Fetch living allies excluding Grok himself
                        const allies = gm.getAllies(this).filter(ch => ch !== this && !ch.isDead());
                        if (allies.length > 0) {
                            const recipient = allies[Math.floor(Math.random() * allies.length)];

                            // Log the redirection
                            if (gm.addLogEntry) {
                                gm.addLogEntry(`💢 ${this.name} commands the blow be borne by ${recipient.name}!`, 'grok-redirect');
                            }

                            // Redirect damage to the chosen ally, flagging to prevent loops
                            const redirectOpts = { ...options, isGrokRedirection: true };
                            const result = originalApplyDamage.call(recipient, amount, type, caster, redirectOpts);

                            // Update UI for both characters (if available)
                            if (gm && gm.uiManager) {
                                gm.uiManager.updateCharacterUI(recipient);
                                gm.uiManager.updateCharacterUI(this);
                            }

                            return result;
                        }
                    }
                } catch (err) {
                    console.error('[GrokHellLordPassive] Error during damage redirection', err);
                }
            }

            // Default behaviour (including cases with no allies)
            return originalApplyDamage.call(this, amount, type, caster, options);
        };

        Character.prototype.addDebuff = function (debuff) {
            // If target is Grok and the debuff is not already a redirection
            if (this?.id === 'grok_hell_lord' && !debuff.isGrokRedirection && !this.isDead()) {
                try {
                    const gm = window.gameManager;
                    if (gm && typeof gm.getAllies === 'function') {
                        // Fetch living allies excluding Grok himself
                        const allies = gm.getAllies(this).filter(ch => ch !== this && !ch.isDead());
                        if (allies.length > 0) {
                            const recipient = allies[Math.floor(Math.random() * allies.length)];

                            // Log the redirection
                            if (gm.addLogEntry) {
                                gm.addLogEntry(`💢 ${this.name} commands the curse be borne by ${recipient.name}!`, 'grok-redirect');
                            }

                            // Clone the debuff and mark it as redirected to prevent loops
                            const redirectedDebuff = passiveInstance.cloneDebuff(debuff);
                            redirectedDebuff.isGrokRedirection = true;

                            // Apply debuff to the chosen ally
                            const result = originalAddDebuff.call(recipient, redirectedDebuff);

                            // Update UI for both characters (if available)
                            if (gm && gm.uiManager) {
                                gm.uiManager.updateCharacterUI(recipient);
                                gm.uiManager.updateCharacterUI(this);
                            }

                            return result;
                        }
                    }
                } catch (err) {
                    console.error('[GrokHellLordPassive] Error during debuff redirection', err);
                }
            }

            // Default behaviour (including cases with no allies)
            return originalAddDebuff.call(this, debuff);
        };

        // Mark as hooked to avoid double-wrapping
        Character.prototype._grokPassiveHooked = true;
        console.log('[GrokHellLordPassive] Damage and debuff redirection hooks installed');
    }

    /**
     * Passive description helper
     */
    getDescription() {
        return 'All damage and debuffs Grok would receive are redirected to a random living ally.';
    }

    /**
     * Helper method to clone a debuff for redirection
     */
    cloneDebuff(debuff) {
        // Create a copy of the debuff object
        const cloned = {
            id: debuff.id,
            name: debuff.name,
            icon: debuff.icon,
            duration: debuff.duration,
            effect: debuff.effect,
            isDebuff: debuff.isDebuff,
            description: debuff.description,
            source: debuff.source,
            stacks: debuff.stacks || 1
        };

        // Copy any additional properties
        Object.keys(debuff).forEach(key => {
            if (!cloned.hasOwnProperty(key)) {
                cloned[key] = debuff[key];
            }
        });

        return cloned;
    }

    /**
     * Cleanup if ever needed (e.g., on game end)
     */
    cleanup() {
        // No specific cleanup for now
    }
}

// Expose globally so CharacterFactory can find it by name
window.GrokHellLordPassive = GrokHellLordPassive; 