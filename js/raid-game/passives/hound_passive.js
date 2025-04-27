// Passive definition for Hound: Bleeding Wounds

class HoundPassive {
    constructor() {
        this.bleedDamagePerStack = 5; // Damage per stack of bleeding
        this.totalBleedDamageDealt = 0; // Track total bleed damage done
        this.passiveName = "Bleeding Wounds"; // Name for passive display
    }

    // Apply a stack of bleeding to the target
    applyBleedingStack(caster, target) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        
        // Check if target already has bleeding debuff
        let currentBleeding = target.debuffs.find(d => d.id === 'bleeding_wounds');
        let currentStacks = 0;
        
        if (currentBleeding) {
            // Get current stacks from existing debuff
            currentStacks = currentBleeding.stacks || 1;
            
            // Remove the old debuff first
            target.removeDebuff('bleeding_wounds');
        }
        
        // Create new bleeding debuff with increased stacks
        const newStacks = currentStacks + 1;
        const bleedingDebuff = {
            id: 'bleeding_wounds',
            name: 'Bleeding',
            icon: 'Icons/effects/bleeding.png',
            duration: -1, // Permanent (-1 means won't expire)
            stacks: newStacks, // Track stacks in the debuff object
            effect: {
                type: 'damage_over_time',
                value: this.bleedDamagePerStack * newStacks // Damage scales with stacks
            },
            description: `Taking ${this.bleedDamagePerStack * newStacks} damage at the end of each turn. (${newStacks} stacks)`
        };
        
        // Apply the debuff
        target.addDebuff(bleedingDebuff);
        
        // Show VFX for the new bleed stack
        this.showBleedingStackVFX(target, newStacks);
        
        // Log the bleeding application
        if (currentStacks > 0) {
            log(`${target.name}'s bleeding worsens! Now at ${newStacks} stacks.`, 'debuff');
        } else {
            log(`${caster.name} inflicts a bleeding wound on ${target.name}!`, 'debuff');
        }
        
        // Play sound effect
        playSound('sounds/bleeding_apply.mp3', 0.6);
        
        // Update caster tracking stats
        if (!caster.bleedingStacksApplied) {
            caster.bleedingStacksApplied = 0;
        }
        caster.bleedingStacksApplied += 1;
    }

    // Called when bleeding damage is dealt to a target
    onBleedingDamage(target, damageAmount) {
        this.totalBleedDamageDealt += damageAmount;
        
        // Update the visual effect of the bleeding
        this.showBleedDamageVFX(target, damageAmount);
    }

    // Shows VFX when a new bleeding stack is applied
    showBleedingStackVFX(target, stacks) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create bleeding stack VFX container
        const bleedVfx = document.createElement('div');
        bleedVfx.className = 'bleeding-stack-vfx';
        targetElement.appendChild(bleedVfx);
        
        // Create blood drips
        for (let i = 0; i < 8; i++) {
            const bloodDrip = document.createElement('div');
            bloodDrip.className = 'blood-drip';
            bloodDrip.style.left = `${Math.random() * 80 + 10}%`;
            bloodDrip.style.top = `${Math.random() * 80 + 10}%`;
            bloodDrip.style.animationDelay = `${Math.random() * 0.6}s`;
            bleedVfx.appendChild(bloodDrip);
        }
        
        // Create stack indicator
        const stackIndicator = document.createElement('div');
        stackIndicator.className = 'bleeding-stack-indicator';
        stackIndicator.textContent = `${stacks} STACK${stacks > 1 ? 'S' : ''}`;
        bleedVfx.appendChild(stackIndicator);
        
        // Create damage preview
        const damagePreview = document.createElement('div');
        damagePreview.className = 'bleeding-damage-preview';
        damagePreview.textContent = `${this.bleedDamagePerStack * stacks}/turn`;
        bleedVfx.appendChild(damagePreview);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            bleedVfx.remove();
        }, 2200);
    }

    // Shows VFX when bleeding damage is dealt
    showBleedDamageVFX(target, damageAmount) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create bleeding damage VFX container
        const bleedDamageVfx = document.createElement('div');
        bleedDamageVfx.className = 'bleeding-damage-vfx';
        targetElement.appendChild(bleedDamageVfx);
        
        // Create blood droplets that fall down
        for (let i = 0; i < 6; i++) {
            const bloodDrop = document.createElement('div');
            bloodDrop.className = 'blood-drop';
            bloodDrop.style.left = `${Math.random() * 80 + 10}%`;
            bloodDrop.style.animationDelay = `${Math.random() * 0.3}s`;
            bleedDamageVfx.appendChild(bloodDrop);
        }
        
        // Create damage number
        const damageNumber = document.createElement('div');
        damageNumber.className = 'damage-number bleeding';
        damageNumber.textContent = damageAmount;
        bleedDamageVfx.appendChild(damageNumber);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            bleedDamageVfx.remove();
        }, 1800);
    }

    /**
     * Triggered when the Hound dies.
     * Gives Crazy Farmer a buff that increases physical damage by 500.
     * @param {Character} dyingCharacter - The Hound character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const allies = gameManager.getAllies(dyingCharacter);
        
        // Show death VFX for the Hound
        this.showDeathVFX(dyingCharacter);
        
        // Find the Crazy Farmer in the team
        const crazyFarmer = allies.find(ally => ally.id === 'crazy_farmer' && !ally.isDead());
        
        if (!crazyFarmer) {
            console.log("Hound died, but no living Crazy Farmer found in the team to buff.");
            return; // No Crazy Farmer to apply the buff to
        }
        
        log(`${dyingCharacter.name}'s death enrages the Crazy Farmer!`, 'passive');
        
        // Create the buff
        const buff = {
            id: 'hound_dead_buff',
            name: 'Hound Dead',
            icon: 'Icons/passives/hound_dead.png', // Replace with actual icon path when available
            duration: Infinity, // Permanent buff
            isPermanent: true,
            statModifiers: {
                physicalDamage: 500 // Add flat 500 physical damage
            },
            description: 'Gains 500 Physical Damage from the death of the Hound.'
        };
        
        // Show special VFX for the farmer getting enraged
        this.showFarmerEnrageVFX(crazyFarmer);
        
        // Apply the buff to Crazy Farmer
        crazyFarmer.addBuff(buff);
        
        log(`${crazyFarmer.name} gains 500 Physical Damage in rage!`, 'buff');
        
        // Update UI for Crazy Farmer
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(crazyFarmer);
        }
    }
    
    // Shows death VFX for the Hound
    showDeathVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create death VFX container
        const deathVfx = document.createElement('div');
        deathVfx.className = 'hound-death-vfx';
        characterElement.appendChild(deathVfx);
        
        // Create energy burst
        const energyBurst = document.createElement('div');
        energyBurst.className = 'rage-energy-burst';
        deathVfx.appendChild(energyBurst);
        
        // Create energy particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'rage-death-particle';
            particle.style.left = `${Math.random() * 80 + 10}%`;
            particle.style.top = `${Math.random() * 80 + 10}%`;
            particle.style.animationDelay = `${Math.random() * 0.4}s`;
            deathVfx.appendChild(particle);
        }
        
        // Create death message
        const deathMessage = document.createElement('div');
        deathMessage.className = 'rage-death-message';
        deathMessage.textContent = 'VENGEANCE!';
        deathVfx.appendChild(deathMessage);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            deathVfx.remove();
        }, 3000);
    }

    // Shows VFX when Crazy Farmer gets enraged from Hound's death
    showFarmerEnrageVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create enrage VFX container
        const enrageVfx = document.createElement('div');
        enrageVfx.className = 'farmer-enrage-vfx';
        characterElement.appendChild(enrageVfx);
        
        // Create rage aura effect
        const rageAura = document.createElement('div');
        rageAura.className = 'rage-aura';
        enrageVfx.appendChild(rageAura);
        
        // Create rage particles
        for (let i = 0; i < 10; i++) {
            const rageParticle = document.createElement('div');
            rageParticle.className = 'rage-particle';
            rageParticle.style.left = `${Math.random() * 80 + 10}%`;
            rageParticle.style.animationDelay = `${Math.random() * 0.5}s`;
            enrageVfx.appendChild(rageParticle);
        }
        
        // Create buff indicator
        const buffIndicator = document.createElement('div');
        buffIndicator.className = 'hound-dead-buff-indicator';
        buffIndicator.textContent = '+500 ATTACK';
        enrageVfx.appendChild(buffIndicator);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            enrageVfx.remove();
        }, 3000);
    }

    // Called by CharacterFactory when the character is created
    initialize(character) {
        console.log(`HoundPassive initialized for ${character.name}`);
        
        // Initialize tracking stats
        this.totalBleedDamageDealt = 0;
        character.bleedingStacksApplied = 0;
        
        // Add passive indicator to character UI
        this.createPassiveIndicator(character);
        
        // Hook into the end of turn processing to handle bleeding damage
        this.setupBleedingDamageHook();
    }

    // Creates the visual indicator on the character portrait
    createPassiveIndicator(character) {
        // Use a slight delay or wait for DOM ready if elements aren't guaranteed yet
        const tryCreate = () => {
            const elementId = character.instanceId || character.id;
            const characterElement = document.getElementById(`character-${elementId}`);
            if (characterElement) {
                const imageContainer = characterElement.querySelector('.image-container');
                if (imageContainer && !imageContainer.querySelector('.hound-passive-indicator')) {
                    const passiveIndicator = document.createElement('div');
                    passiveIndicator.className = 'hound-passive-indicator';
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
    
    // Set up hook to handle bleeding damage at the end of turn
    setupBleedingDamageHook() {
        // This should override or extend the game's effect processing for bleeding damage
        // Typically, this would be done by modifying the game's effect processing logic
        // For this example, we're assuming there's a method to hook into
        
        // If there's a specific hook in your game system, use it here
        // Example:
        // window.gameManager.registerEffectHandler('damage_over_time', this.handleBleedingDamage.bind(this));
        
        // Note: The actual implementation depends on your game's architecture
        // This is a placeholder to show the concept
    }
    
    // Process bleeding damage at end of turn (game system should call this)
    processBleedingDamage(character) {
        if (!character || character.isDead()) return;
        
        const bleedingDebuff = character.debuffs.find(d => d.id === 'bleeding_wounds');
        if (bleedingDebuff && bleedingDebuff.stacks > 0) {
            const damageAmount = this.bleedDamagePerStack * bleedingDebuff.stacks;
            
            // Apply the bleeding damage
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${character.name} takes ${damageAmount} bleeding damage! (${bleedingDebuff.stacks} stacks)`, 'debuff');
            
            // Deal the damage directly to avoid triggering other effects
            character.hp -= damageAmount;
            character.hp = Math.max(0, character.hp); // Ensure HP doesn't go negative
            
            // Check if character died from bleeding
            if (character.hp <= 0) {
                character.hp = 0;
                log(`${character.name} has bled out!`, 'death');
                
                // Trigger death handling if available
                if (window.gameManager) {
                    window.gameManager.handleCharacterDeath(character);
                }
            }
            
            // Show bleeding damage VFX
            this.onBleedingDamage(character, damageAmount);
            
            // Update UI
            if (window.gameManager && window.gameManager.ui) {
                window.gameManager.ui.updateCharacterUI(character);
            }
            
            return damageAmount;
        }
        
        return 0;
    }
}

// Make the class globally available
window.HoundPassive = HoundPassive;

// Register with the PassiveFactory if it exists
if (typeof window.PassiveFactory !== 'undefined') {
    window.PassiveFactory.registerPassive('bleeding_wounds', HoundPassive);
} 