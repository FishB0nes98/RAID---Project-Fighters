// Passive logic for Rotten Apple's Rotten Explosion

class RottenApplePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'rotten_apple_explosion';
        this.passiveName = 'Rotten Explosion';
    }

    /**
     * Triggered when the character holding this passive dies.
     * Deals 3500 magic damage (ignores defenses) to all enemies.
     * @param {Character} dyingCharacter - The character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const opponents = gameManager.getOpponents(dyingCharacter);
        const damageAmount = 3500;

        log(`${dyingCharacter.name}'s ${this.passiveName} triggers upon death!`, 'passive danger');

        // Apply explosion VFX on the dying character
        this.applyExplosionVFX(dyingCharacter);

        opponents.forEach(opponent => {
            if (!opponent.isDead()) {
                log(`${opponent.name} is hit by the Rotten Explosion for ${damageAmount} damage!`, 'damage');
                opponent.applyDamage(damageAmount, 'magic', dyingCharacter, { ignoreArmor: true, ignoreMagicalShield: true });
                
                // Add a slight delay before applying VFX to targets for a cascading effect
                setTimeout(() => {
                    this.applyDamageVFX(opponent);
                }, 200 + Math.random() * 300); // Random delay between 200-500ms
            }
        });
    }

    /**
     * Apply main explosion VFX to the character that died
     * @param {Character} character - The character to apply VFX to
     */
    applyExplosionVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'rotten-explosion-vfx';
        character.domElement.appendChild(vfxElement);

        // Add the explosion blast effect
        const blastElement = document.createElement('div');
        blastElement.className = 'rotten-explosion-blast';
        vfxElement.appendChild(blastElement);

        // Create particles bursting outward
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'rotten-particles';
            
            // Random position and animation path
            const randomAngle = Math.random() * 360;
            const distance = 80 + Math.random() * 120;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            particle.style.setProperty('--end-x', `${endX}px`);
            particle.style.setProperty('--end-y', `${endY}px`);
            
            // Randomize particle appearance
            particle.style.width = `${5 + Math.random() * 8}px`;
            particle.style.height = `${5 + Math.random() * 8}px`;
            particle.style.backgroundColor = `rgb(${121 + Math.random() * 30}, ${85 + Math.random() * 20}, ${72 + Math.random() * 20})`;
            
            particle.style.top = '50%';
            particle.style.left = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            
            vfxElement.appendChild(particle);
        }

        // Add spores floating around
        for (let i = 0; i < 15; i++) {
            const spore = document.createElement('div');
            spore.className = 'rotten-spore';
            
            // Random position and animation path
            const randomAngle = Math.random() * 360;
            const distance = 50 + Math.random() * 150;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            spore.style.setProperty('--end-x', `${endX}px`);
            spore.style.setProperty('--end-y', `${endY}px`);
            
            spore.style.top = '50%';
            spore.style.left = '50%';
            spore.style.transform = 'translate(-50%, -50%)';
            
            vfxElement.appendChild(spore);
        }

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 2600); // Slightly longer than animation duration
    }

    /**
     * Apply damage VFX to characters hit by the explosion
     * @param {Character} character - The character to apply VFX to
     */
    applyDamageVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'rotten-explosion-vfx';
        
        // Make the target VFX smaller than the source explosion
        vfxElement.style.transform = 'scale(0.7)';
        character.domElement.appendChild(vfxElement);

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 2600); // Slightly longer than animation duration
    }
}

// Register the passive handler
// Ensure the global factory and its method exist before calling
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') { 
    console.log("[Passive Registration] Attempting to register: rotten_apple_explosion with class:", RottenApplePassive);
    window.PassiveFactory.registerPassive('rotten_apple_explosion', RottenApplePassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, RottenApplePassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
} 