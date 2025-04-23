// Passive definition for Infernal Birdie: Lifesteal on Stun

class InfernalBirdiePassive {
    constructor() {
        this.lifestealIncrease = 0.01; // 1% lifesteal increase
        this.totalLifestealGained = 0; // Track total lifesteal gained
    }

    // Called when the character owning this passive successfully applies a stun
    // This method is called from chainSlashEffect
    onStunApplied(caster, target) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // Increase base lifesteal permanently
        caster.baseStats.lifesteal = (caster.baseStats.lifesteal || 0) + this.lifestealIncrease;
        // Optional: Clamp lifesteal (e.g., to a max of 1.0 or 100%)
        // caster.baseStats.lifesteal = Math.min(1.0, caster.baseStats.lifesteal);

        // Update tracking stat
        this.totalLifestealGained = (this.totalLifestealGained || 0) + this.lifestealIncrease;
        // Attach this tracking stat to the character for UI display
        caster.lifestealFromPassive = this.totalLifestealGained;

        // Recalculate stats to apply the change immediately
        caster.recalculateStats();

        log(`${caster.name}'s passive activates! Permanently gained ${this.lifestealIncrease * 100}% Lifesteal from stunning ${target.name}. Current Lifesteal: ${(caster.stats.lifesteal * 100).toFixed(1)}%`, 'passive');

        // Play sound effect for lifesteal gain
        playSound('sounds/lifesteal_gain.mp3', 0.7);

        // Add VFX for lifesteal gain
        this.showLifestealGainVFX(caster, target);

        // Update caster UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(caster);
        }
    }

    showLifestealGainVFX(caster, target) {
        // Base VFX on caster
        const casterElementId = caster.instanceId || caster.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        
        // Target VFX (victim of the stun)
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);

        if (casterElement) {
            // Create red glow effect around caster
            const glowVfx = document.createElement('div');
            glowVfx.className = 'lifesteal-gain-glow-vfx';
            casterElement.appendChild(glowVfx);
            
            // Create text effect showing gained lifesteal
            const textVfx = document.createElement('div');
            textVfx.className = 'lifesteal-gain-text-vfx';
            textVfx.textContent = `+${this.lifestealIncrease * 100}% LS`;
            casterElement.appendChild(textVfx);

            // Remove VFX after animation
            setTimeout(() => {
                glowVfx.remove();
                textVfx.remove();
            }, 1500);
        }

        // Create connection VFX between target and caster
        if (targetElement && casterElement) {
            this.createBloodLinkVFX(targetElement, casterElement);
        }
    }

    // New method to create a blood link visual between target and caster
    createBloodLinkVFX(fromElement, toElement) {
        // Create a container for the blood link that spans the entire screen
        const gameContainer = document.querySelector('.battle-container');
        if (!gameContainer) return;
        
        // Create blood link element
        const bloodLink = document.createElement('div');
        bloodLink.className = 'blood-link-vfx';
        gameContainer.appendChild(bloodLink);
        
        // Get positions for start and end points
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Calculate center points relative to the container
        const fromX = fromRect.left + (fromRect.width / 2) - containerRect.left;
        const fromY = fromRect.top + (fromRect.height / 2) - containerRect.top;
        const toX = toRect.left + (toRect.width / 2) - containerRect.left;
        const toY = toRect.top + (toRect.height / 2) - containerRect.top;
        
        // Set the element styles
        bloodLink.style.position = 'absolute';
        bloodLink.style.width = '100%';
        bloodLink.style.height = '100%';
        bloodLink.style.top = '0';
        bloodLink.style.left = '0';
        bloodLink.style.pointerEvents = 'none';
        bloodLink.style.zIndex = '100';
        
        // Create the blood particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'blood-particle';
            
            // Randomize the starting position slightly around the target
            const randOffsetX = (Math.random() - 0.5) * 20; 
            const randOffsetY = (Math.random() - 0.5) * 20;
            const startX = fromX + randOffsetX;
            const startY = fromY + randOffsetY;
            
            // Set particle styles
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = '#cc0000';
            particle.style.boxShadow = '0 0 5px #ff0000, 0 0 10px rgba(255,0,0,0.5)';
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            // Add to the link container
            bloodLink.appendChild(particle);
            
            // Animate the particle from target to caster
            const delay = i * 50; // Stagger the particles
            setTimeout(() => {
                particle.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)';
                particle.style.left = `${toX}px`;
                particle.style.top = `${toY}px`;
                particle.style.opacity = '0.9';
                
                // Shrink the particle as it approaches the caster
                setTimeout(() => {
                    particle.style.transform = 'scale(0.5)';
                    particle.style.opacity = '0.7';
                }, 300);
            }, delay);
        }
        
        // Remove the blood link after all particles are done
        setTimeout(() => {
            bloodLink.remove();
        }, 1000);
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`InfernalBirdiePassive initialized for ${character.name}`);
        
        // Initialize tracking stat
        this.totalLifestealGained = 0;
        character.lifestealFromPassive = 0;
        
        // Add passive indicator to character UI
        this.createPassiveIndicator(character);
    }

    // Creates the visual indicator on the character portrait
    createPassiveIndicator(character) {
        // Use a slight delay or wait for DOM ready if elements aren't guaranteed yet
        const tryCreate = () => {
            const elementId = character.instanceId || character.id;
            const characterElement = document.getElementById(`character-${elementId}`);
            if (characterElement) {
                const imageContainer = characterElement.querySelector('.image-container');
                if (imageContainer && !imageContainer.querySelector('.birdie-passive-indicator')) {
                    const passiveIndicator = document.createElement('div');
                    passiveIndicator.className = 'birdie-passive-indicator'; // Needs CSS definition
                    passiveIndicator.title = character.passive.description;
                    // Passive icon is now handled in CSS with ::before pseudo-element
                    
                    imageContainer.appendChild(passiveIndicator);
                    console.log(`Passive indicator added for ${character.name}`);
                } else if (!imageContainer) {
                    console.warn(`Could not find .image-container for ${character.name} to add passive indicator.`);
                }
            } else {
                 // Element might not be rendered yet, retry shortly
                 // console.log(`Character element ${elementId} not found, retrying indicator creation...`);
                 // setTimeout(tryCreate, 200); // Retry after a short delay
                 // Be careful with recursive setTimeout, add a max retry counter if needed
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryCreate);
        } else {
            tryCreate(); // Or use requestAnimationFrame(tryCreate);
        }
    }
}

// Make the class globally available
window.InfernalBirdiePassive = InfernalBirdiePassive;

// REMOVED InfernalBirdieCharacter class definition 