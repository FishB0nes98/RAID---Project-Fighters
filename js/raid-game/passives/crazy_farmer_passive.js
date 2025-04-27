// Passive definition for Crazy Farmer: Healing Pact

class CrazyFarmerPassive {
    constructor() {
        this.healingPercent = 0.7; // 70% of damage dealt heals allies
        this.totalHealingDone = 0; // Track total healing done through passive
        this.passiveName = "Healing Pact"; // Name for passive display
    }

    // Called when the character deals damage to an enemy
    onDamageDealt(caster, allies, damageAmount) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // --- MODIFIED: Filter out the caster from the allies list --- 
        const actualAllies = allies.filter(ally => ally.instanceId !== caster.instanceId); 

        if (!actualAllies || actualAllies.length === 0) {
            // console.log("Healing Pact: No other allies to heal.");
            return; // No other allies to heal
        }

        // Ensure damageAmount is a valid number
        if (isNaN(damageAmount) || damageAmount <= 0) {
            console.warn(`Healing Pact: Invalid damage amount (${damageAmount}) received.`);
            return;
        }

        // Calculate healing amount
        const healAmount = Math.round(damageAmount * this.healingPercent);
        if (isNaN(healAmount) || healAmount <= 0) {
            // console.log("Healing Pact: Calculated heal amount is zero or invalid.");
            return; // No healing needed
        }
        
        // --- MODIFIED: Iterate over the filtered list --- 
        let totalActualHealing = 0;
        actualAllies.forEach(ally => {
            if (!ally.isDead()) {
                const actualHealing = ally.heal(healAmount);
                if (actualHealing > 0) {
                    this.totalHealingDone += actualHealing;
                    totalActualHealing += actualHealing;
                    
                    // Show healing VFX
                    this.showHealingPactVFX(caster, ally, actualHealing);
                    
                    // Update ally UI (moved inside check?)
                    // if (window.gameManager && window.gameManager.uiManager) { 
                    //     window.gameManager.uiManager.updateCharacterUI(ally);
                    // }
                }
            }
        });
        
        // Log the healing only if actual healing occurred
        if (totalActualHealing > 0) {
             if (actualAllies.length === 1) {
                 log(`${caster.name}'s Healing Pact heals ${actualAllies[0].name} for ${totalActualHealing} HP!`, 'heal');
             } else {
                 log(`${caster.name}'s Healing Pact heals allies for a total of ${totalActualHealing} HP!`, 'heal');
             }
             // Play healing sound only if healing happened
             playSound('sounds/healing_pact.mp3', 0.7); // Ensure this sound file exists
        }
        
        // Attach tracking stat to character for UI display
        caster.healingFromPassive = this.totalHealingDone;
    }

    // Shows healing VFX when the passive activates
    showHealingPactVFX(caster, target, healAmount) {
        // Get the target DOM element
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create healing VFX container
        const healVfx = document.createElement('div');
        healVfx.className = 'healing-pact-vfx';
        targetElement.appendChild(healVfx);
        
        // Create healing particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-pact-particle';
            particle.style.left = `${Math.random() * 80 + 10}%`;
            particle.style.top = `${Math.random() * 80 + 10}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            healVfx.appendChild(particle);
        }
        
        // Create link between caster and target
        this.createHealingLink(caster, target);
        
        // Create healing number display
        const healNumber = document.createElement('div');
        healNumber.className = 'heal-number';
        healNumber.textContent = `+${healAmount}`;
        healVfx.appendChild(healNumber);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            healVfx.remove();
        }, 2000);
    }
    
    // Creates a visual link between caster and healed ally
    createHealingLink(caster, target) {
        // Get character elements
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!casterElement || !targetElement) return;
        
        // Get game container
        const gameContainer = document.querySelector('.battle-container');
        if (!gameContainer) return;
        
        // Create healing link element
        const healingLink = document.createElement('div');
        healingLink.className = 'healing-pact-link';
        gameContainer.appendChild(healingLink);
        
        // Get positions
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Calculate positions relative to container
        const casterX = casterRect.left + (casterRect.width / 2) - containerRect.left;
        const casterY = casterRect.top + (casterRect.height / 2) - containerRect.top;
        const targetX = targetRect.left + (targetRect.width / 2) - containerRect.left;
        const targetY = targetRect.top + (targetRect.height / 2) - containerRect.top;
        
        // Set link styles
        healingLink.style.position = 'absolute';
        healingLink.style.width = '100%';
        healingLink.style.height = '100%';
        healingLink.style.top = '0';
        healingLink.style.left = '0';
        healingLink.style.pointerEvents = 'none';
        healingLink.style.zIndex = '50';
        
        // Create healing energy particles traveling from caster to ally
        for (let i = 0; i < 10; i++) {
            const energyParticle = document.createElement('div');
            energyParticle.className = 'healing-energy-particle';
            
            // Randomize starting position slightly
            const randOffsetX = (Math.random() - 0.5) * 30;
            const randOffsetY = (Math.random() - 0.5) * 30;
            const startX = casterX + randOffsetX;
            const startY = casterY + randOffsetY;
            
            // Set particle styles
            energyParticle.style.position = 'absolute';
            energyParticle.style.width = '10px';
            energyParticle.style.height = '10px';
            energyParticle.style.borderRadius = '50%';
            energyParticle.style.backgroundColor = '#4CAF50';
            energyParticle.style.boxShadow = '0 0 10px #69F0AE, 0 0 15px rgba(105, 240, 174, 0.8)';
            energyParticle.style.left = `${startX}px`;
            energyParticle.style.top = `${startY}px`;
            
            healingLink.appendChild(energyParticle);
            
            // Animate the particle from caster to target
            const delay = i * 60; // Stagger the particles
            setTimeout(() => {
                energyParticle.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
                energyParticle.style.left = `${targetX}px`;
                energyParticle.style.top = `${targetY}px`;
                energyParticle.style.opacity = '0.9';
                
                // Expand the particle as it approaches the target
                setTimeout(() => {
                    energyParticle.style.transform = 'scale(1.5)';
                    energyParticle.style.opacity = '0.5';
                }, 400);
            }, delay);
        }
        
        // Remove the healing link after all particles are done
        setTimeout(() => {
            healingLink.remove();
        }, 1500);
    }

    /**
     * Triggered when the Crazy Farmer dies.
     * Doubles all stats of Hound if it's on the same team.
     * @param {Character} dyingCharacter - The Crazy Farmer character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const allies = gameManager.getAllies(dyingCharacter);
        
        // Show death VFX for the Crazy Farmer
        this.showDeathVFX(dyingCharacter);
        
        // Find the Hound in the team
        const hound = allies.find(ally => ally.id === 'hound' && !ally.isDead());
        
        if (!hound) {
            console.log("Crazy Farmer died, but no living Hound found in the team to buff.");
            return; // No Hound to apply the buff to
        }
        
        log(`${dyingCharacter.name}'s death sends the Hound into a frenzy!`, 'passive');
        
        // Create the buff that doubles all stats
        const buff = {
            id: 'farmer_died_buff',
            name: 'Farmer Died',
            icon: 'Icons/passives/farmer_died.png', // Replace with actual icon path when available
            duration: Infinity, // Permanent buff
            isPermanent: true,
            description: 'All stats are doubled after the death of the Crazy Farmer.',
            
            // Apply the stat doubling effect
            onApply: function(character) {
                // Save original base stats for reference
                this.originalStats = { ...character.baseStats };
                
                // Double all base stats
                for (const statKey in character.baseStats) {
                    if (typeof character.baseStats[statKey] === 'number') {
                        character.baseStats[statKey] *= 2;
                    }
                }
                
                // Stats will be recalculated after buff is applied
            },
            
            // Define statModifiers for UI display and recalculation
            statModifiers: {
                physicalDamage_percent: 100, // +100% means double
                magicalDamage_percent: 100,
                armor_percent: 100,
                magicalShield_percent: 100,
                maxHp_percent: 100,
                maxMana_percent: 100,
                lifesteal_percent: 100,
                critChance_percent: 100,
                critDamage_percent: 100,
                dodgeChance_percent: 100,
                healingPower_percent: 100
            }
        };
        
        // Show special VFX for the hound going into frenzy
        this.showHoundFrenzyVFX(hound);
        
        // Apply the buff to Hound
        hound.addBuff(buff);
        
        log(`${hound.name}'s stats are doubled in frenzy!`, 'buff');
        
        // Update UI for Hound
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(hound);
        }
    }
    
    // Shows death VFX for the Crazy Farmer
    showDeathVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create death VFX container
        const deathVfx = document.createElement('div');
        deathVfx.className = 'crazy-farmer-death-vfx';
        characterElement.appendChild(deathVfx);
        
        // Create energy burst
        const energyBurst = document.createElement('div');
        energyBurst.className = 'death-energy-burst';
        deathVfx.appendChild(energyBurst);
        
        // Create energy particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'death-energy-particle';
            particle.style.left = `${Math.random() * 80 + 10}%`;
            particle.style.top = `${Math.random() * 80 + 10}%`;
            particle.style.animationDelay = `${Math.random() * 0.4}s`;
            deathVfx.appendChild(particle);
        }
        
        // Create death message
        const deathMessage = document.createElement('div');
        deathMessage.className = 'death-message';
        deathMessage.textContent = 'UNLEASHED!';
        deathVfx.appendChild(deathMessage);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            deathVfx.remove();
        }, 3000);
    }
    
    // Shows VFX when Hound enters frenzy from Crazy Farmer's death
    showHoundFrenzyVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create frenzy VFX container
        const frenzyVfx = document.createElement('div');
        frenzyVfx.className = 'hound-frenzy-vfx';
        characterElement.appendChild(frenzyVfx);
        
        // Create power surge effect
        const powerSurge = document.createElement('div');
        powerSurge.className = 'power-surge';
        frenzyVfx.appendChild(powerSurge);
        
        // Create energy particles
        for (let i = 0; i < 15; i++) {
            const energyParticle = document.createElement('div');
            energyParticle.className = 'frenzy-particle';
            energyParticle.style.left = `${Math.random() * 80 + 10}%`;
            energyParticle.style.top = `${Math.random() * 80 + 10}%`;
            energyParticle.style.animationDelay = `${Math.random() * 0.7}s`;
            frenzyVfx.appendChild(energyParticle);
        }
        
        // Create buff indicator
        const buffIndicator = document.createElement('div');
        buffIndicator.className = 'farmer-died-buff-indicator';
        buffIndicator.textContent = 'ALL STATS x2';
        frenzyVfx.appendChild(buffIndicator);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            frenzyVfx.remove();
        }, 3500);
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`CrazyFarmerPassive initialized for ${character.name}`);
        
        // Initialize tracking stat
        this.totalHealingDone = 0;
        character.healingFromPassive = 0;
        
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
                if (imageContainer && !imageContainer.querySelector('.farmer-passive-indicator')) {
                    const passiveIndicator = document.createElement('div');
                    passiveIndicator.className = 'farmer-passive-indicator';
                    passiveIndicator.title = character.passive.description;
                    
                    imageContainer.appendChild(passiveIndicator);
                    console.log(`Passive indicator added for ${character.name}`);
                } else if (!imageContainer) {
                    console.warn(`Could not find .image-container for ${character.name} to add passive indicator.`);
                }
            } else {
                // Element might not be rendered yet, retry shortly
                setTimeout(tryCreate, 300);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryCreate);
        } else {
            tryCreate();
        }
    }
}

// Make the class globally available
window.CrazyFarmerPassive = CrazyFarmerPassive;

// Register with the PassiveFactory if it exists
if (typeof window.PassiveFactory !== 'undefined') {
    window.PassiveFactory.registerPassive('healing_pact', CrazyFarmerPassive);
} 