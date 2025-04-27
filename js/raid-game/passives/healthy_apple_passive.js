// Passive logic for Healthy Apple's Final Gift

class HealthyApplePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'healthy_apple_final_gift';
        this.passiveName = 'Final Gift';
    }

    /**
     * Triggered when the character holding this passive dies.
     * Heals all enemies for 50% of their MAX HP.
     * @param {Character} dyingCharacter - The character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const opponents = gameManager.getOpponents(dyingCharacter);

        log(`${dyingCharacter.name}'s ${this.passiveName} triggers upon death!`, 'passive');
        
        // Apply gift VFX to the dying character
        this.applyGiftVFX(dyingCharacter);

        opponents.forEach(opponent => {
            if (!opponent.isDead()) {
                const healAmount = Math.floor(opponent.stats.maxHp * 0.50); // 50% of Max HP
                const actualHeal = opponent.heal(healAmount);
                log(`${opponent.name} receives a Final Gift, healing for ${actualHeal} HP!`, 'heal');
                
                // Add a slight delay before applying healing VFX to each target
                setTimeout(() => {
                    this.applyHealingVFX(opponent);
                }, 200 + Math.random() * 300); // Random delay between 200-500ms
            }
        });
    }

    /**
     * Apply gift VFX to the character that died
     * @param {Character} character - The character to apply VFX to
     */
    applyGiftVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'healthy-gift-vfx';
        character.domElement.appendChild(vfxElement);

        // Create healing circle
        const circleElement = document.createElement('div');
        circleElement.className = 'healthy-healing-circle';
        vfxElement.appendChild(circleElement);

        // Create hearts that float outward
        for (let i = 0; i < 12; i++) {
            const heart = document.createElement('div');
            heart.className = 'healthy-heart';
            
            // Create heart effect with random movement
            const randomAngle = Math.random() * 360;
            const distance = 80 + Math.random() * 100;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            heart.style.setProperty('--end-x', `${endX}px`);
            heart.style.setProperty('--end-y', `${endY}px`);
            
            // Random positioning and size
            heart.style.top = '50%';
            heart.style.left = '50%';
            heart.style.transform = 'translate(-50%, -50%)';
            
            // Vary the size slightly
            const size = 15 + Math.random() * 12;
            heart.style.width = `${size}px`;
            heart.style.height = `${size}px`;
            
            // Use an actual heart emoji as content
            heart.innerHTML = '❤️';
            heart.style.fontSize = `${size}px`;
            heart.style.display = 'flex';
            heart.style.alignItems = 'center';
            heart.style.justifyContent = 'center';
            heart.style.backgroundColor = 'transparent';
            
            vfxElement.appendChild(heart);
        }

        // Add sparkles
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'healthy-sparkle';
            
            // Random position and animation path
            const randomAngle = Math.random() * 360;
            const distance = 30 + Math.random() * 150;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            // Random size
            const size = 4 + Math.random() * 6;
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;
            
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
     * Apply healing VFX to characters receiving the healing
     * @param {Character} character - The character to apply VFX to
     */
    applyHealingVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'healthy-gift-vfx';
        character.domElement.appendChild(vfxElement);

        // Add a smaller healing circle for the receiver
        const circleElement = document.createElement('div');
        circleElement.className = 'healthy-healing-circle';
        circleElement.style.width = '150px';
        circleElement.style.height = '150px';
        vfxElement.appendChild(circleElement);

        // Add fewer hearts for receiver effect
        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('div');
            heart.className = 'healthy-heart';
            
            // Create heart with random upward movement
            const randomAngle = -90 + (Math.random() * 180 - 90); // -180 to 0 degrees (upward)
            const distance = 40 + Math.random() * 60;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            heart.style.setProperty('--end-x', `${endX}px`);
            heart.style.setProperty('--end-y', `${endY}px`);
            
            // Position and style
            heart.style.top = '50%';
            heart.style.left = '50%';
            heart.style.transform = 'translate(-50%, -50%)';
            
            // Vary the size slightly
            const size = 12 + Math.random() * 8;
            heart.style.width = `${size}px`;
            heart.style.height = `${size}px`;
            
            // Use an actual heart emoji as content
            heart.innerHTML = '❤️';
            heart.style.fontSize = `${size}px`;
            heart.style.display = 'flex';
            heart.style.alignItems = 'center';
            heart.style.justifyContent = 'center';
            heart.style.backgroundColor = 'transparent';
            
            vfxElement.appendChild(heart);
        }

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
    console.log("[Passive Registration] Attempting to register: healthy_apple_final_gift with class:", HealthyApplePassive);
    window.PassiveFactory.registerPassive('healthy_apple_final_gift', HealthyApplePassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, HealthyApplePassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
} 