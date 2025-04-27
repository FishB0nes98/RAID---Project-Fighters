// Ability definition for Scarecrow: Fear ability and healing passive

// Fear ability implementation
const scarecrowFearEffect = (caster, targets, abilityData = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const uiManager = window.gameManager ? window.gameManager.uiManager : null;
    const gameState = window.gameManager ? window.gameManager.gameState : null;

    if (!uiManager || !gameState) {
        log(`${caster.name} tries to use Fear, but the game manager is not available.`);
        return;
    }

    playSound('sounds/scarecrow_fear.mp3', 0.8);
    log(`${caster.name} uses ${abilityData.name || 'Fear'} across the battlefield!`, 'ability');

    // Ensure we have a proper targets array
    let enemyTargets = targets;
    
    // If targets is not an array or is empty, get all enemies
    if (!Array.isArray(targets) || targets.length === 0) {
        // Determine which team is the enemy based on caster's team
        enemyTargets = caster.isAI ? 
            gameState.playerCharacters.filter(p => !p.isDead()) : 
            gameState.aiCharacters.filter(a => !a.isDead());
            
        log(`${caster.name}'s Fear targets ${enemyTargets.length} enemies`);
    }
    
    // If still no targets, exit early
    if (!enemyTargets || enemyTargets.length === 0) {
        log(`${caster.name}'s Fear found no valid targets!`, 'system');
        return;
    }

    // Process each target
    enemyTargets.forEach(target => {
        if (!target || target.isDead() || !target.abilities || target.abilities.length === 0) {
            return; // Skip invalid targets
        }

        log(`${target.name} is struck with Fear!`);
        showFearVFX(target);

        const availableAbilities = target.abilities.filter(ability =>
            ability && !ability.isDisabled
        );

        if (availableAbilities.length === 0) {
            log(`${target.name} has no abilities available to disable.`, "info");
            return;
        }

        const numToDisable = Math.min(2, availableAbilities.length);
        const abilitiesToDisable = [];
        for (let i = 0; i < numToDisable; i++) {
            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            abilitiesToDisable.push(availableAbilities[randomIndex]);
            availableAbilities.splice(randomIndex, 1);
        }

        abilitiesToDisable.forEach(ability => {
            log(`${target.name}'s ${ability.name} is disabled by Fear!`);

            const disableDebuff = new Effect(
                `scarecrow_fear_disable_${ability.id}_${Date.now()}`,
                'Ability Disabled (Fear)',
                abilityData.icon || 'Icons/abilities/scarecrow_fear.webp',
                2, // Duration: 2 turns
                null,
                true // isDebuff = true
            ).setDescription(`Disabled by Scarecrow's Fear for 2 turns.`);

            disableDebuff.disabledAbilityId = ability.id;

            ability.isDisabled = true;
            ability.disabledDuration = 2;

            disableDebuff.remove = (character) => {
                const disabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
                if (disabledAbility) {
                    // Only re-enable if the current disable is specifically from this debuff instance
                    // and the duration has naturally ticked down to 0 (or less) via processEffects
                    if (disabledAbility.isDisabled && disabledAbility.disabledDuration <= 0) {
                        disabledAbility.isDisabled = false;
                        log(`${character.name}'s ${disabledAbility.name} is no longer disabled by Fear.`);
                        if (uiManager) {
                            uiManager.updateCharacterUI(character);
                        }
                    }
                }
            };

            target.addDebuff(disableDebuff);
        });

        uiManager.updateCharacterUI(target); // Update UI for the target
    });

    uiManager.updateCharacterUI(caster); // Update UI for caster
};

// Show visual effect for Fear ability
function showFearVFX(target) {
    if (!target || !target.instanceId) return;
    const targetElement = document.querySelector(`.character-slot[data-instance-id="${target.instanceId}"]`);
    if (!targetElement) return;

    const vfxElement = document.createElement('div');
    vfxElement.className = 'fear-vfx';
    targetElement.appendChild(vfxElement);

    const fearSkull = document.createElement('div');
    fearSkull.className = 'fear-skull';
    vfxElement.appendChild(fearSkull);

    for (let i = 0; i < 5; i++) {
        const shadowElement = document.createElement('div');
        shadowElement.className = 'fear-shadow';
        shadowElement.style.setProperty('--delay', `${i * 0.1}s`);
        vfxElement.appendChild(shadowElement);
    }

    setTimeout(() => vfxElement.remove(), 2000);
}

// --- Scarecrow Character Class & Healing Passive Logic ---

class ScarecrowCharacter extends Character {
    constructor(id, name, image, stats, abilities, passive) {
        super(id, name, image, stats, abilities, passive);
        this.healingPassiveId = 'scarecrow_healing'; // ID from the JSON
        this.healAmount = 700; // Amount to heal allies
        
        // Setup turn start listener for passive healing
        document.addEventListener('TurnStart', this.handleTurnStart.bind(this));
    }
    
    // Handler for turn start events
    handleTurnStart(event) {
        // Check if it's this scarecrow's turn or a turn start in general (depending on game design)
        if (this.isDead() || !this.passive || this.passive.id !== this.healingPassiveId) {
            return; // Don't apply healing if dead or passive not active
        }
        
        // Apply healing to all allies
        this.healAllAllies();
    }
    
    // Heal all allied characters
    healAllAllies() {
        if (!window.gameManager || !window.gameManager.gameState) return;
        
        const log = window.gameManager.addLogEntry.bind(window.gameManager);
        const playSound = window.gameManager.playSound.bind(window.gameManager);
        const uiManager = window.gameManager.uiManager;
        
        // Get the team (AI or Player team depending on this character's affiliation)
        const team = this.isAI ? window.gameManager.gameState.aiCharacters : window.gameManager.gameState.playerCharacters;
        
        // Heal each team member except self
        team.forEach(ally => {
            if (ally === this || ally.isDead()) {
                return; // Skip self or dead allies
            }
            
            // Apply healing
            const healingAmount = this.healAmount;
            const healingDone = ally.heal(healingAmount, this);
            
            // Log and show VFX only if healing was actually applied
            if (healingDone > 0) {
                log(`${this.name}'s Crow Caretaker heals ${ally.name} for ${healingDone} HP!`, 'heal passive');
                this.showHealingVFX(ally, healingDone);
                
                // Play healing sound
                playSound('sounds/healing.mp3', 0.6);
            }
            
            // Update UI
            if (uiManager) {
                uiManager.updateCharacterUI(ally);
            }
        });
    }
    
    // VFX for healing effect
    showHealingVFX(target, amount) {
        if (!target || !target.instanceId) return;
        const targetElement = document.querySelector(`.character-slot[data-instance-id="${target.instanceId}"]`);
        if (!targetElement) return;
        
        // Create healing VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'healing-vfx-container';
        targetElement.appendChild(vfxContainer);
        
        // Create healing number display
        const healingNumber = document.createElement('div');
        healingNumber.className = 'healing-number';
        healingNumber.textContent = `+${amount}`;
        vfxContainer.appendChild(healingNumber);
        
        // Create healing particles
        for (let i = 0; i < 8; i++) {
            const healParticle = document.createElement('div');
            healParticle.className = 'healing-particle';
            healParticle.style.setProperty('--angle', `${(i * 45) + Math.random() * 20}deg`);
            healParticle.style.setProperty('--delay', `${i * 0.05}s`);
            vfxContainer.appendChild(healParticle);
        }
        
        // Remove after animation completes
        setTimeout(() => vfxContainer.remove(), 2000);
    }
}

// Register the ScarecrowCharacter class
if (typeof CharacterFactory !== 'undefined') {
    CharacterFactory.registerCharacterClass('scarecrow', ScarecrowCharacter);
    console.log('[Character Registration] Registered ScarecrowCharacter class for ID: scarecrow');
} else {
    console.error("CharacterFactory not found, cannot register ScarecrowCharacter class.");
}

// --- Ability Registration ---

if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilityEffect === 'function') {
    AbilityFactory.registerAbilityEffect('scarecrowFearEffect', scarecrowFearEffect);
    console.log("[Ability Registration] Registered Scarecrow custom ability effect: scarecrowFearEffect");
} else {
    console.error("AbilityFactory not found or registerAbilityEffect method missing. Scarecrow abilities may not function correctly.");
}

// --- CSS for VFX ---
document.addEventListener('DOMContentLoaded', () => {
    const styleId = 'scarecrow-vfx-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Fear VFX CSS */
            .fear-vfx {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 50; overflow: hidden;
            }
            .fear-skull {
                position: absolute; top: 20%; left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 50px; height: 50px;
                background-image: url('../Icons/effects/fear_skull.png'); /* Add a skull icon */
                background-size: contain;
                background-repeat: no-repeat;
                opacity: 0;
                animation: fearSkullAppear 1s ease-out forwards;
            }
            @keyframes fearSkullAppear {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
            .fear-shadow {
                position: absolute; bottom: 0; left: 50%;
                width: 8px; height: 30px;
                background-color: rgba(50, 0, 80, 0.7);
                border-radius: 50% 50% 0 0;
                transform-origin: bottom center;
                opacity: 0;
                animation: fearShadowRise 1.5s ease-in-out forwards var(--delay, 0s);
            }
            @keyframes fearShadowRise {
                0% { transform: translate(-50%, 0) scaleY(0.1); opacity: 0; }
                50% { transform: translate(-50%, -20px) scaleY(1); opacity: 0.6; }
                100% { transform: translate(-50%, -40px) scaleY(0.5); opacity: 0; }
            }
            
            /* Healing VFX CSS */
            .healing-vfx-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 50; overflow: hidden;
                display: flex; justify-content: center; align-items: center;
            }
            .healing-number {
                position: absolute; top: 30%;
                font-size: 1.5em; font-weight: bold; color: #4CAF50;
                text-shadow: 0px 0px 5px rgba(255, 255, 255, 0.8);
                animation: healNumberAnim 1.5s forwards ease-out;
            }
            @keyframes healNumberAnim {
                0% { opacity: 0; transform: translateY(10px); }
                20% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(-15px); }
                100% { opacity: 0; transform: translateY(-25px); }
            }
            .healing-particle {
                position: absolute; 
                width: 8px; height: 8px;
                background-color: #4CAF50;
                border-radius: 50%;
                opacity: 0.8;
                transform-origin: center;
                animation: healParticleAnim 1.5s forwards ease-out var(--delay, 0s);
            }
            @keyframes healParticleAnim {
                0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
                20% { transform: translateY(-10px) scale(1); opacity: 0.8; }
                100% { 
                    transform: 
                        translateY(-40px) 
                        translateX(calc(cos(var(--angle)) * 40px)) 
                        scale(0); 
                    opacity: 0; 
                }
            }
        `;
        document.head.appendChild(style);
    }
});