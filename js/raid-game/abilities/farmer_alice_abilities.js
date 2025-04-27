// Farmer Alice's abilities and passive implementation

// Override the applyDamage method for Farmer Alice to implement her passive
class FarmerAliceCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        
        // Initialize counter for magic shield gained from passive
        this.magicShieldFromPassive = 0;
        
        // Create the magic shield counter when the character is initialized
        this.createMagicShieldCounter();
    }
    
    // Method to create the Magic Shield counter
    createMagicShieldCounter() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initMagicShieldCounter());
        } else {
            this.initMagicShieldCounter();
        }
    }
    
    // Initialize the counter element
    initMagicShieldCounter() {
        // This will be called when the element is added to the DOM
        const checkForCharElement = setInterval(() => {
            const charElement = document.getElementById(`character-${this.id}`);
            if (charElement) {
                clearInterval(checkForCharElement);
                
                // Create counter if it doesn't exist
                if (!charElement.querySelector('.magic-shield-counter')) {
                    const counter = document.createElement('div');
                    counter.className = 'magic-shield-counter';
                    counter.innerHTML = `
                        <div class="shield-icon"></div>
                        <span>${this.magicShieldFromPassive}</span>
                    `;
                    charElement.appendChild(counter);
                }
            }
        }, 500);
    }
    
    // Update the Magic Shield counter value
    updateMagicShieldCounter() {
        const charElement = document.getElementById(`character-${this.id}`);
        if (charElement) {
            let counter = charElement.querySelector('.magic-shield-counter');
            
            // Create the counter if it doesn't exist
            if (!counter) {
                this.initMagicShieldCounter();
                return;
            }
            
            // Update counter value
            const valueSpan = counter.querySelector('span');
            if (valueSpan) {
                valueSpan.textContent = this.magicShieldFromPassive;
                
                // Add animation class
                counter.classList.add('updated');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    counter.classList.remove('updated');
                }, 500);
            }
        }
    }
    
    applyDamage(amount, type) {
        // Call the parent method to handle the normal damage application
        const result = super.applyDamage(amount, type);
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // --- Carrot Power Up Cooldown Reduction ---
        if (result.damage > 0) {
            const carrotPowerUpAbility = this.abilities.find(ability => ability.id === 'carrot_power_up');
            if (carrotPowerUpAbility && carrotPowerUpAbility.currentCooldown > 0) {
                carrotPowerUpAbility.currentCooldown -= 1;
                if (window.gameManager && typeof window.gameManager.updateAbilityCooldownDisplay === 'function') {
                    window.gameManager.updateAbilityCooldownDisplay(this.id, 'carrot_power_up');
                }
                log(`${this.name}'s Carrot Power Up cooldown reduced to ${carrotPowerUpAbility.currentCooldown} turns.`, 'ability-effect');

                // --- Cooldown Reduction VFX ---
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                if (charElement) {
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'vfx-container alice-cd-reduction-vfx-container';
                    charElement.appendChild(vfxContainer);

                    const cdReductionVfx = document.createElement('div');
                    cdReductionVfx.className = 'alice-cd-reduction-vfx';
                    cdReductionVfx.innerHTML = `<span>Carrot Power -1 CD</span>`;
                    vfxContainer.appendChild(cdReductionVfx);

                    playSound('sounds/cooldown_reduced.mp3', 0.5); // Example sound

                    setTimeout(() => vfxContainer.remove(), 1200);
                }
                // --- End Cooldown Reduction VFX ---
            }
        }
        // --- End Carrot Power Up Cooldown Reduction ---

        // --- Passive Magic Shield Gain ---
        if (type === 'magical' && result.damage > 0 && this.passive && this.passive.id === 'magical_resistance') {
            const magicShieldGain = 2;
            if (magicShieldGain > 0) {
                this.stats.magicalShield += magicShieldGain;
                this.magicShieldFromPassive += magicShieldGain;
                this.updateMagicShieldCounter();
                log(`${this.name}'s Magical Resistance activates, gaining ${magicShieldGain} permanent Magic Shield.`, 'passive-effect');

                // --- Shield Gain VFX ---
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                if (charElement) {
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'vfx-container alice-shield-gain-vfx-container';
                    charElement.appendChild(vfxContainer);

                    const shieldVfx = document.createElement('div');
                    shieldVfx.className = 'shield-gain-vfx';
                    shieldVfx.innerHTML = `<span>+${magicShieldGain} MS</span>`;
                    vfxContainer.appendChild(shieldVfx);

                    playSound('sounds/shield_gain.mp3', 0.6); // Example sound

                    setTimeout(() => vfxContainer.remove(), 1500);
                }
                 // --- End Shield Gain VFX ---
            }
        }
        // --- End Passive Magic Shield Gain ---

        return result;
    }
}

// Register Farmer Alice's character class with the character factory
CharacterFactory.registerCharacterClass('farmer_alice', FarmerAliceCharacter);

// Utility function to ensure Alice's magic shield counter is initialized when she's in the game
function initializeAliceMagicShieldCounters() {
    // This function will be called when the game loads
    // It ensures that all existing Alice characters have their counters initialized
    if (window.gameManager && window.gameManager.gameState) {
        const allCharacters = [
            ...window.gameManager.gameState.playerCharacters,
            ...window.gameManager.gameState.aiCharacters
        ];
        
        const aliceCharacters = allCharacters.filter(char => char.id === 'farmer_alice');
        
        // Initialize counter for all Alice characters
        aliceCharacters.forEach(alice => {
            if (alice.createMagicShieldCounter && typeof alice.createMagicShieldCounter === 'function') {
                alice.createMagicShieldCounter();
            }
        });
    }
}

// Initialize counters when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short delay for the game to initialize
    setTimeout(initializeAliceMagicShieldCounters, 1000);
});

// Create the Pounce ability effect function
const pounceAbilityEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container pounce-caster-vfx-container';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element
        casterElement.classList.add('pounce-animation');

        const pounceVfx = document.createElement('div');
        pounceVfx.className = 'pounce-vfx';
        vfxContainer.appendChild(pounceVfx);

        const pounceText = document.createElement('div');
        pounceText.className = 'pounce-text';
        pounceText.textContent = 'POUNCE!';
        vfxContainer.appendChild(pounceText);

        playSound('sounds/pounce_jump.mp3', 0.7); // Example sound

        setTimeout(() => {
            casterElement.classList.remove('pounce-animation');
            vfxContainer.remove();
        }, 1000);
    }
    // --- End Caster VFX ---

    // Calculate base damage (50% of physical damage)
    const damage = Math.floor(caster.stats.physicalDamage * 0.5);
    
    // --- Target Impact VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    let stunApplied = false; // Flag to check if stun VFX needs adding later

    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container pounce-impact-vfx-container';
        targetElement.appendChild(vfxContainer);

        // Add impact animation to target element
        targetElement.classList.add('pounce-impact');

        const impactVfx = document.createElement('div');
        impactVfx.className = 'pounce-impact-vfx';
        vfxContainer.appendChild(impactVfx);

        playSound('sounds/pounce_impact.mp3', 0.8); // Example sound

        setTimeout(() => {
            targetElement.classList.remove('pounce-impact');
            vfxContainer.remove();
            // If stun was applied, add its persistent VFX *after* impact finishes
            if (stunApplied) addStunVFX(targetElement);
        }, 800);
    }
    // --- End Target Impact VFX ---

    // Set damage source property correctly on target
    // This is used by the applyDamage method to determine critical hits
    target.isDamageSource = caster;
    
    // Apply damage - 50% of Alice's physical damage
    const result = target.applyDamage(damage, 'physical');
    
    // Reset damage source
    target.isDamageSource = null;
    
    let message = `${caster.name} used Pounce on ${target.name} for ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    
    addLogEntry(message);
    
    // Apply stun effect with 25% chance
    if (Math.random() < 0.25) {
        stunApplied = true; // Set flag for VFX addition
        const stunDebuff = new Effect(
            'stun_debuff',
            'Stunned',
            'Icons/debuffs/stun.png',
            4, // Duration of 4 turns
            null,
            true // Is a debuff
        );
        
        // Set stun effect properties
        stunDebuff.effects = {
            cantAct: true
        };
        
        stunDebuff.setDescription('Cannot perform any actions.');
        
        // Add a custom remove method to clean up the stun VFX when the debuff expires
        stunDebuff.remove = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                charElement.classList.remove('stunned');
                // Remove stun VFX container
                const stunEffects = charElement.querySelectorAll('.stun-effect-container');
                stunEffects.forEach(el => el.remove());
            }
        };
        
        // Add debuff to target
        target.addDebuff(stunDebuff.clone()); // Clone before adding
        addLogEntry(`${target.name} is stunned for 4 turns!`);

        // Stun VFX is added after impact animation finishes (see setTimeout above)
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Helper function to add Stun VFX
function addStunVFX(targetElement) {
     if (!targetElement) return;
     targetElement.classList.add('stunned'); // Apply grayscale

     const stunVfxContainer = document.createElement('div');
     stunVfxContainer.className = 'vfx-container stun-effect-container'; // Use specific container
     stunVfxContainer.dataset.debuffId = 'stun_debuff'; // Link to debuff if needed
     targetElement.appendChild(stunVfxContainer);

     const stunEffect = document.createElement('div');
     stunEffect.className = 'stun-effect'; // Re-use farmer_shoma/farmer_alice style
     stunVfxContainer.appendChild(stunEffect);
     // Removal is handled by stunDebuff.remove
}

// Create the Thick Fur ability effect function
const thickFurAbilityEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Set the flat boost amount
    const armorBoost = 20;
    const magicShieldBoost = 20;
    
    // --- Caster Buff VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container thick-fur-vfx-container';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element
        casterElement.classList.add('thick-fur-animation');

        const thickFurVfx = document.createElement('div');
        thickFurVfx.className = 'thick-fur-vfx';
        vfxContainer.appendChild(thickFurVfx);

        const buffText = document.createElement('div');
        buffText.className = 'thick-fur-text';
        buffText.textContent = 'THICK FUR!';
        vfxContainer.appendChild(buffText);

        playSound('sounds/buff_apply.mp3', 0.6); // Example sound

        setTimeout(() => {
            casterElement.classList.remove('thick-fur-animation');
            vfxContainer.remove();
        }, 1000);
    }
     // --- End Caster Buff VFX ---

    // Create the buff
    const thickFurBuff = new Effect(
        'thick_fur_buff',
        'Thick Fur',
        'Icons/abilities/thick_fur.webp',
        10, // Duration of 10 turns
        null,
        false // Is a buff
    );
    
    // Set stat modifiers for the buff
    thickFurBuff.statModifiers = {
        armor: armorBoost,
        magicalShield: magicShieldBoost
    };
    
    thickFurBuff.setDescription(`Increases Armor by ${armorBoost} and Magic Shield by ${magicShieldBoost} for 10 turns.`);
    
    // Add a custom remove method to display a message when the buff expires
    thickFurBuff.remove = function(character) {
        addLogEntry(`${character.name}'s Thick Fur has worn off. Armor and Magic Shield return to normal.`);
    };
    
    // Add buff to caster
    caster.addBuff(thickFurBuff.clone()); // Clone before adding
    
    log(`${caster.name} activates Thick Fur, increasing Armor by ${armorBoost} and Magic Shield by ${magicShieldBoost} for 10 turns!`);

    // Update UI
    updateCharacterUI(caster);
};

// Create the Bunny Bounce ability effect function
const bunnyBounceAbilityEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container bunny-bounce-caster-vfx';
        casterElement.appendChild(vfxContainer);

        casterElement.classList.add('bunny-bounce-animation');

        const bounceVfx = document.createElement('div');
        bounceVfx.className = 'bunny-bounce-vfx';
        vfxContainer.appendChild(bounceVfx);

        const bounceText = document.createElement('div');
        bounceText.className = 'bunny-bounce-text';
        bounceText.textContent = 'BUNNY BOUNCE!';
        vfxContainer.appendChild(bounceText);

        playSound('sounds/bunny_bounce_jump.mp3', 0.7); // Example sound

        setTimeout(() => {
            casterElement.classList.remove('bunny-bounce-animation');
            vfxContainer.remove();
        }, 1200); // Match animation duration
    }
    // --- End Caster VFX ---

    // Get current magic shield value
    const currentMagicShield = caster.stats.magicalShield;
    
    // Check if target is ally or enemy
    if (target.isAI === caster.isAI) {
        // Target is an ally
        
        // Calculate 50% of magic shield to transfer
        const shieldTransferAmount = Math.ceil(currentMagicShield * 0.5);
        
        // Create the buff
        const magicShieldBuff = new Effect(
            'bunny_bounce_shield_buff',
            'Bunny Shield',
            'Icons/abilities/bunny_bounce.webp',
            5, // Duration of 5 turns
            null,
            false // Is a buff
        );
        
        // Set stat modifiers for the buff
        magicShieldBuff.statModifiers = {
            magicalShield: shieldTransferAmount
        };
        
        magicShieldBuff.setDescription(`Receives ${shieldTransferAmount} Magic Shield from ${caster.name} for 5 turns.`);
        
        // Add a custom remove method to display a message when the buff expires
        magicShieldBuff.remove = function(character) {
            addLogEntry(`${character.name}'s Bunny Shield has faded away. Magic Shield returns to normal.`);
        };
        
        // Add buff to target ally
        target.addBuff(magicShieldBuff.clone()); // Clone before adding
        
        // --- Ally Target VFX ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'vfx-container bunny-bounce-ally-vfx';
            targetElement.appendChild(vfxContainer);

            const shieldVfx = document.createElement('div');
            shieldVfx.className = 'ally-shield-gain-vfx';
            shieldVfx.innerHTML = `<span>+${shieldTransferAmount} MS</span>`;
            vfxContainer.appendChild(shieldVfx);

            playSound('sounds/shield_gain_ally.mp3', 0.6); // Example sound

            setTimeout(() => vfxContainer.remove(), 1500);
        }
        // --- End Ally Target VFX ---

        log(`${caster.name} used Bunny Bounce on ${target.name}, granting ${shieldTransferAmount} Magic Shield for 5 turns!`);
    } else {
        // Target is an enemy
        
        // Calculate damage (600% of magic shield)
        const damage = Math.floor(currentMagicShield * 6);
        
        // --- Enemy Target VFX ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'vfx-container bunny-bounce-enemy-vfx';
            targetElement.appendChild(vfxContainer);

            targetElement.classList.add('bunny-bounce-impact');

            const impactVfx = document.createElement('div');
            impactVfx.className = 'bunny-bounce-impact-vfx';
            vfxContainer.appendChild(impactVfx);

            playSound('sounds/bunny_bounce_impact.mp3', 0.8); // Example sound

            setTimeout(() => {
                targetElement.classList.remove('bunny-bounce-impact');
                vfxContainer.remove();
            }, 800);
        }
        // --- End Enemy Target VFX ---

        // Set damage source property correctly on target for critical hit calculation
        target.isDamageSource = caster;
        
        // Apply damage - 600% of Alice's magic shield as physical damage
        const result = target.applyDamage(damage, 'physical');
        
        // Reset damage source
        target.isDamageSource = null;
        
        let message = `${caster.name} used Bunny Bounce on ${target.name} for ${result.damage} physical damage`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        
        addLogEntry(message);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Create the Carrot Power Up ability effect function
const carrotPowerUpAbilityEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container carrot-powerup-caster-vfx';
        casterElement.appendChild(vfxContainer);

        casterElement.classList.add('carrot-powerup-animation');

        const powerUpVfx = document.createElement('div');
        powerUpVfx.className = 'carrot-powerup-vfx';
        vfxContainer.appendChild(powerUpVfx);

        const powerUpText = document.createElement('div');
        powerUpText.className = 'carrot-powerup-text';
        powerUpText.textContent = 'CARROT POWER!';
        vfxContainer.appendChild(powerUpText);

        playSound('sounds/powerup.mp3', 0.7); // Example sound

        setTimeout(() => {
            casterElement.classList.remove('carrot-powerup-animation');
            vfxContainer.remove();
        }, 1000);
    }
    // --- End Caster VFX ---

    // Calculate the healing amount (21% of missing health)
    const missingHealth = target.stats.maxHp - target.stats.currentHp;
    // Calculate healing, with a minimum amount based on max HP (2% of max HP) even if at full health
    const healAmount = Math.max(Math.floor(missingHealth * 0.21), Math.floor(target.stats.maxHp * 0.02));
    
    // Apply healing
    target.heal(healAmount);
    
    // --- Target Heal VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const healVfxContainer = document.createElement('div');
        healVfxContainer.className = 'vfx-container carrot-heal-vfx-container';
        targetElement.appendChild(healVfxContainer);

        const healVfx = document.createElement('div');
        healVfx.className = 'healing-vfx'; // Use generic healing float text style
        healVfx.innerHTML = `<span>+${healAmount} HP</span>`;
        healVfxContainer.appendChild(healVfx);

        playSound('sounds/heal_positive.mp3', 0.6); // Example sound

        setTimeout(() => healVfxContainer.remove(), 1500);
    }
    // --- End Target Heal VFX ---

    log(`${caster.name} used Carrot Power Up on ${target.name}, healing for ${healAmount} HP.`);
    
    // Reduce active cooldowns by 5 turns
    let reducedAbilities = 0;
    
    // Iterate through all abilities and reduce their current cooldown if active
    if (target.abilities) {
        target.abilities.forEach(ability => {
            if (ability.currentCooldown > 0) {
                // Calculate how much to reduce (minimum to 0)
                const reduction = Math.min(ability.currentCooldown, 5);
                ability.currentCooldown -= reduction;
                reducedAbilities++;
                
                // Update ability cooldown display if it exists
                if (window.gameManager && typeof window.gameManager.updateAbilityCooldownDisplay === 'function') {
                    window.gameManager.updateAbilityCooldownDisplay(target.id, ability.id);
                }
            }
        });
    }
    
    if (reducedAbilities > 0) {
        log(`${target.name}'s ability cooldowns were reduced by 5 turns.`);
        
        // --- Target Cooldown Reduction VFX ---
        if (targetElement) {
            const cdVfxContainer = document.createElement('div');
            cdVfxContainer.className = 'vfx-container carrot-cd-vfx-container';
            targetElement.appendChild(cdVfxContainer);

            const cdVfx = document.createElement('div');
            cdVfx.className = 'cooldown-reduction-vfx'; // Use generic style
            cdVfx.innerHTML = `<span>-5 CD</span>`;
            cdVfxContainer.appendChild(cdVfx);

            playSound('sounds/cooldown_reduced.mp3', 0.5); // Example sound

            setTimeout(() => cdVfxContainer.remove(), 1500);
        }
        // --- End Target Cooldown Reduction VFX ---
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Create the actual Pounce ability
const pounceAbility = new Ability(
    'pounce',
    'Pounce',
    'Icons/abilities/pounce.webp',
    50, // Mana cost
    2,  // Cooldown in turns
    pounceAbilityEffect
).setDescription('Deals 50% AD damage and has a 65% chance to stun the target for 4 turns.')
 .setTargetType('enemy');

// Create the Thick Fur ability
const thickFurAbility = new Ability(
    'thick_fur',
    'Thick Fur',
    'Icons/abilities/thick_fur.webp',
    100, // Mana cost
    18,  // Cooldown in turns
    thickFurAbilityEffect
).setDescription('Increases Armor and Magic Shield by 20 for 10 turns.')
 .setTargetType('self');

// Create the Bunny Bounce ability
const bunnyBounceAbility = new Ability(
    'bunny_bounce',
    'Bunny Bounce',
    'Icons/abilities/bunny_bounce.webp',
    100, // Mana cost
    8,   // Cooldown in turns
    bunnyBounceAbilityEffect
).setDescription('If used on an ally: Gives 50% of Magic Shield to that target. If used on an enemy: Deals 600% of Magic Shield as physical damage.')
 .setTargetType('any_except_self'); // Custom target type to allow targeting allies and enemies but not self

// Create the Carrot Power Up ability
const carrotPowerUpAbility = new Ability(
    'carrot_power_up',
    'Carrot Power Up',
    'Icons/abilities/carrot_power_up.webp',
    155, // Mana cost
    15,  // Cooldown in turns
    carrotPowerUpAbilityEffect
).setDescription('Heals the target for 21% of missing health (minimum 2% of max HP) and reduces target\'s active cooldowns by 5 turns. Cooldown reduces by 1 turn when Alice takes damage.')
 .setTargetType('ally'); // Can target self or allies

// Register abilities with AbilityFactory
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            pounceAbility,
            thickFurAbility,
            bunnyBounceAbility,
            carrotPowerUpAbility
        ]);
    } else {
        console.warn("Farmer Alice abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback: assign to a global object
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.pounce = pounceAbility;
        window.definedAbilities.thick_fur = thickFurAbility;
        window.definedAbilities.bunny_bounce = bunnyBounceAbility;
        window.definedAbilities.carrot_power_up = carrotPowerUpAbility;
    }
    
    // Add ability targeting handlers
    setupAbilityTargeting();
});

// Add function to handle ability targeting indicators
function setupAbilityTargeting() {
    // Wait for game to be initialized
    const checkForGameManager = setInterval(() => {
        if (window.gameManager) {
            clearInterval(checkForGameManager);
            
            // Extend the showTargetableCharacters method to add specific ability targeting effects
            const originalShowTargetable = window.gameManager.showTargetableCharacters;
            if (originalShowTargetable && typeof originalShowTargetable === 'function') {
                window.gameManager.showTargetableCharacters = function(characterId, abilityId, targetType) {
                    // For the Carrot Power Up ability, ensure the caster is always included in targets
                    if (abilityId === 'carrot_power_up') {
                        // Make sure self-targeting is explicitly included for Carrot Power Up
                        // This ensures Farmer Alice can target herself with her R ability
                        const selfCharElement = document.getElementById(`character-${characterId}`);
                        if (selfCharElement) {
                            selfCharElement.classList.add('target-ally');
                        }
                    }
                    
                    // Call the original method
                    originalShowTargetable.call(this, characterId, abilityId, targetType);
                    
                    // Add specific targeting effects based on ability
                    if (abilityId === 'carrot_power_up') {
                        // Get all character elements that are targetable
                        const targetableElements = document.querySelectorAll('.character.target-ally');
                        
                        // Add carrot-powerup-target class to them
                        targetableElements.forEach(element => {
                            element.classList.add('carrot-powerup-target');
                        });
                    }
                };
                
                // Extend the hideTargetableCharacters method to remove specific ability targeting effects
                const originalHideTargetable = window.gameManager.hideTargetableCharacters;
                if (originalHideTargetable && typeof originalHideTargetable === 'function') {
                    window.gameManager.hideTargetableCharacters = function() {
                        // Remove carrot specific targeting class
                        const carrotTargets = document.querySelectorAll('.carrot-powerup-target');
                        carrotTargets.forEach(element => {
                            element.classList.remove('carrot-powerup-target');
                        });
                        
                        // Call the original method
                        originalHideTargetable.call(this);
                    };
                }
            }
        }
    }, 500);
} 