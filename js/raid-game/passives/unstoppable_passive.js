/* Unstoppable Passive - Characters cannot be stunned */

console.log('[UnstoppablePassive] script loading...');

// === GLOBAL HOOK (runs immediately) ===
if (!Character.prototype._unstoppableHooked) {
    const originalAddDebuff = Character.prototype.addDebuff;
    Character.prototype.addDebuff = function (debuff) {
        if (this.passive && this.passive.id === 'unstoppable_passive') {
            const isStun = debuff.id === 'stun' ||
                (debuff.name && debuff.name.toLowerCase().includes('stun')) ||
                (debuff.effects && debuff.effects.cantAct === true);
            if (isStun) {
                const logFn = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                logFn(`${this.name} is Unstoppable and ignores the stun!`, 'unstoppable-passive');
                this.showStunImmuneVFX && this.showStunImmuneVFX();
                return this.debuffs;
            }
        }
        return originalAddDebuff.call(this, debuff);
    };
    Character.prototype._unstoppableHooked = true;
}

class UnstoppablePassive {
    initialize(character) {
        this.character = character;
        console.log(`[UnstoppablePassive] Initialized handler for ${character.name}`);
    }
}

// Add simple immune text VFX if not present
if (!Character.prototype.showStunImmuneVFX) {
    Character.prototype.showStunImmuneVFX = function() {
        const el = document.getElementById(`character-${this.instanceId || this.id}`);
        if (!el) return;
        const text = document.createElement('div');
        text.className = 'unstoppable-immune-text';
        text.textContent = 'IMMUNE';
        el.appendChild(text);
        setTimeout(() => text.remove(), 800);
    };
}

// Attach to already created characters if game started before script load
function attachToExisting() {
    if (!window.gameManager || !window.gameManager.gameState) return;
    const allChars = [...window.gameManager.gameState.playerCharacters, ...window.gameManager.gameState.aiCharacters];
    allChars.forEach(ch => {
        if (ch.passive && ch.passive.id === 'unstoppable_passive' && !ch.passiveHandler) {
            ch.passiveHandler = new UnstoppablePassive();
            ch.passiveHandler.initialize(ch);
        }
    });
}

document.addEventListener('DOMContentLoaded', attachToExisting);
if (window.gameManager) {
    // after game init may call
    if (window.gameManager.initialized) attachToExisting();
    else {
        window.addEventListener('gameManager:initialized', attachToExisting);
    }
}

// Character creation event as before
document.addEventListener('character:created', (e) => {
    const ch = e.detail.character;
    if (ch && ch.passive && ch.passive.id === 'unstoppable_passive') {
        ch.passiveHandler = new UnstoppablePassive();
        ch.passiveHandler.initialize(ch);
    }
}); 