// Passive logic for Leafy Apple's Leafy Inheritance

class LeafyApplePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'leafy_apple_inheritance';
        this.passiveName = 'Leafy Inheritance';
    }

    /**
     * Triggered when the character holding this passive dies.
     * Applies a permanent 25% healing power buff to all enemies.
     * @param {Character} dyingCharacter - The character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const opponents = gameManager.getOpponents(dyingCharacter);

        log(`${dyingCharacter.name}'s ${this.passiveName} triggers upon death!`, 'passive');

        // Add VFX to the dying character
        this.applyDeathVFX(dyingCharacter);

        opponents.forEach(opponent => {
            if (!opponent.isDead()) {
                log(`${opponent.name} inherits leafy essence, permanently gaining 25% Healing Power!`, 'buff'); // Log as buff for opponent

                // Apply VFX to the receiving character
                this.applyReceiverVFX(opponent);

                // Apply permanent buff (using a permanent buff object)
                const buff = new Effect(
                    'leafy_inheritance_buff',
                    'Leafy Inheritance (Permanent)',
                    'Icons/passives/leafy_apple_inheritance.png', // Use passive icon or a dedicated buff icon
                    Infinity, // Duration
                    null, // No per-turn effect needed for the stat mod
                    false // isDebuff
                );
                
                buff.isPermanent = true; // Mark as permanent
                buff.setDescription('Permanently gains 25% increased Healing Power.');

                // Use statModifiers for the permanent increase
                buff.statModifiers = {
                    healingPower_percent: 25 // 25% increase
                };

                // onApply and remove can be simplified or removed if only used for stat manipulation
                // Keep if needed for VFX or other side effects
                buff.onApply = function(character) {
                    // Log or apply specific VFX on first application if needed
                     log(`${character.name} gained permanent Leafy Inheritance (+25% Healing Power).`, 'buff');
                };

                buff.remove = function(character) {
                     // Permanent buffs shouldn't normally be removed, but good to have a warning
                     console.warn("Attempted to remove permanent Leafy Inheritance buff");
                };

                opponent.addBuff(buff); // Add as a buff to the opponent
                // addBuff calls recalculateStats, which should now handle the stat modifier
                // The updateCharacterUI call is handled within recalculateStats now
            }
        });
    }

    /**
     * Apply VFX to the character that died with Leafy Inheritance
     * @param {Character} character - The character to apply VFX to
     */
    applyDeathVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'leafy-inheritance-vfx';
        character.domElement.appendChild(vfxElement);

        // Create the circle effect
        const circleElement = document.createElement('div');
        circleElement.className = 'leafy-circle';
        vfxElement.appendChild(circleElement);

        // Create floating leaves (8 leaves in different directions)
        for (let i = 0; i < 8; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leafy-leaf';
            
            // Random position and animation path
            const randomAngle = (i * 45) + (Math.random() * 30 - 15); // Distribute around circle with slight randomness
            const distance = 100 + Math.random() * 50;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            const rotation = Math.random() * 360;
            
            leaf.style.setProperty('--end-x', `${endX}px`);
            leaf.style.setProperty('--end-y', `${endY}px`);
            leaf.style.setProperty('--rotation', `${rotation}deg`);
            
            leaf.style.top = '50%';
            leaf.style.left = '50%';
            leaf.style.transform = 'translate(-50%, -50%)';
            
            vfxElement.appendChild(leaf);
        }

        // Add sparkles
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'leafy-sparkle';
            
            // Random position and animation path
            const randomAngle = Math.random() * 360;
            const distance = 50 + Math.random() * 100;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            sparkle.style.top = '50%';
            sparkle.style.left = '50%';
            sparkle.style.transform = 'translate(-50%, -50%)';
            
            vfxElement.appendChild(sparkle);
        }

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 3100); // Slightly longer than animation duration
    }

    /**
     * Apply VFX to the character receiving the Leafy Inheritance buff
     * @param {Character} character - The character to apply VFX to
     */
    applyReceiverVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'leafy-inheritance-vfx';
        character.domElement.appendChild(vfxElement);

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 3100); // Slightly longer than animation duration
    }
}

// Register the passive handler
// Ensure the global factory and its method exist before calling
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') { 
    console.log("[Passive Registration] Attempting to register: leafy_apple_inheritance with class:", LeafyApplePassive);
    window.PassiveFactory.registerPassive('leafy_apple_inheritance', LeafyApplePassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, LeafyApplePassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
} 