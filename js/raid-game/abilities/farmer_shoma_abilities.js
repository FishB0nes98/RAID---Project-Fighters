// Farmer Shoma's abilities and passive implementation

// Create a subclass of Character for Farmer Shoma to implement his passive
class FarmerShomaCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        
        // Default values that can be overridden by talents
        this.stunChance = 0.35; // Default stun chance for Home Run Smash
        this.dodgeBoost = 0.5;  // Default dodge boost for Farmer's Catch
        this.critBoost = 0.7;   // Default crit boost from passive after turn 20
        this.passiveCritBoostValue = 0.7; // Default passive boost value
        this.passiveTriggerTurn = 20; // Default turn for passive trigger
        
        // Initialize passive tracking
        this.isPassiveCritBoosted = false;
        this.createPassiveIndicator();
        
        this.passiveCritBoostTriggered = false;
        
        // Track when critical hits occur
        this.critLifestealBoost = 0; // Default value for crit lifesteal boost
        this.critLifestealStacks = 0; // Track number of crit lifesteal stacks
        
        // Nurturing Aura talent property
        this.teamHealthAura = null; // Will be set by talent if activated
        
        // Listen for critical hit events
        const critHitListener = (event) => {
            if (event.detail && event.detail.source && event.detail.source.id === this.id) {
                this.onCriticalHit(event);
            }
        };
        
        // Listen for end of turn events to check passive
        const turnEndListener = (event) => {
            if (event.detail && event.detail.currentTurn) {
                this.checkPassiveCritBoost(event.detail.currentTurn);
            }
        };
        
        // Listen for critical healing events
        const critHealListener = (event) => {
            if (event.detail && event.detail.source && event.detail.source.id === this.id && event.detail.isCritical) {
                this.onCriticalHeal(event);
            }
        };
        
        // Add event listeners
        document.addEventListener('criticalHit', critHitListener);
        document.addEventListener('turnEnd', turnEndListener);
        document.addEventListener('criticalHeal', critHealListener);
        
        // NEW: Listen for stage loaded event to apply the team health aura after all characters are loaded
        const stageLoadedListener = () => {
            // Wait a short time to ensure all character initialization is complete
            setTimeout(() => {
                if (this.teamHealthAura) {
                    console.log(`[Farmer Shoma] Applying Nurturing Aura on stage loaded event`);
                    this.applyTeamHealthAura();
                }
            }, 100);
        };
        
        // Listen for the stageLoaded event
        document.addEventListener('stageLoaded', stageLoadedListener);
        
        // Also listen for gameStateReady event as a fallback
        document.addEventListener('gameStateReady', stageLoadedListener);
    }
    
    createPassiveIndicator() {
        // Create a visual indicator for the passive that will be updated when the passive triggers
        this.passiveIndicator = document.createElement('div');
        this.passiveIndicator.className = 'shoma-passive-indicator';
        this.passiveIndicator.title = 'Farming Experience: 50% crit chance';
        
        // Will be added to the DOM when the character is rendered
    }
    
    initPassiveIndicator() {
        // Add the passive indicator to the DOM
        if (!this.instanceId) return; // Can't add if we don't have an instance ID
        
        const characterElement = document.getElementById(`character-${this.instanceId}`);
        if (!characterElement) {
            console.warn(`Cannot find character element for ${this.name} with ID ${this.instanceId}`);
            return;
        }
        
        // Find the status effects container
        const statusEffects = characterElement.querySelector('.status-effects');
        if (!statusEffects) {
            console.warn(`Cannot find status effects container for ${this.name}`);
            return;
        }
        
        // Append the passive indicator
        statusEffects.appendChild(this.passiveIndicator);
        console.log(`Added passive indicator for ${this.name}`);
    }
    
    updatePassiveIndicator() {
        if (!this.passiveIndicator) return;
        
        const isPoweredUp = this.isPassiveCritBoosted;
        
        // Update the tooltip
        this.passiveIndicator.title = `Farming Experience: ${isPoweredUp ? (this.passiveCritBoostValue * 100) : 50}% crit chance`;
        
        // Add a visual update if it's powered up
        if (isPoweredUp && !this.passiveIndicator.classList.contains('updated')) {
            this.passiveIndicator.classList.add('updated');
            
            // Create a power-up visual effect 
            const powerupVfx = document.createElement('div');
            powerupVfx.className = 'shoma-passive-boost-vfx';
            
            // Add to the character element
            const characterElement = document.getElementById(`character-${this.instanceId}`);
            if (characterElement) {
                characterElement.appendChild(powerupVfx);
                
                // Add a highlight effect to the character
                characterElement.classList.add('shoma-passive-highlight');
                
                // Remove the VFX and highlight after animation
                setTimeout(() => {
                    powerupVfx.remove();
                    characterElement.classList.remove('shoma-passive-highlight');
                }, 2000);
            }
        }
    }
    
    // Apply the team health aura to Shoma and allies
    applyTeamHealthAura() {
        if (!this.teamHealthAura) { 
            return; // Don't apply if not activated
        }
        
        console.log(`[Farmer Shoma] Applying Nurturing Aura talent: Self HP +${this.teamHealthAura.selfBonus}, Allies HP +${this.teamHealthAura.allyBonus}`);
        
        // Apply bonus to self first
        this.applyStatModification('maxHp', 'add', this.teamHealthAura.selfBonus);
        
        // Also increase current HP by the self bonus, capped at the new maxHP
        const oldSelfHp = this.stats.currentHp;
        this.stats.currentHp = Math.min(this.stats.currentHp + this.teamHealthAura.selfBonus, this.stats.maxHp);
        console.log(`[Nurturing Aura] Increased ${this.name}'s current HP from ${oldSelfHp} to ${this.stats.currentHp}`);

        // Get reference to game manager
        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            console.warn("[Farmer Shoma] Cannot apply team health aura - game manager not available");
            return;
        }
        
        // Add log entry
        gameManager.addLogEntry(`${this.name}'s Nurturing Aura grants +${this.teamHealthAura.selfBonus} HP to himself and +${this.teamHealthAura.allyBonus} HP to all allies!`, 'special-effect');
        
        // Apply to all allies
        let alliesAffected = 0;
        if (gameManager.gameState.playerCharacters) {
            gameManager.gameState.playerCharacters.forEach(character => {
                if (character.id !== this.id && !character.isDead()) {
                    const bonus = this.teamHealthAura.allyBonus;
                    // Apply MAX HP bonus to ally
                    character.applyStatModification('maxHp', 'add', bonus);
                    
                    // --- NEW: Increase current HP as well, capped at new max --- 
                    const oldHp = character.stats.currentHp;
                    character.stats.currentHp = Math.min(character.stats.currentHp + bonus, character.stats.maxHp);
                    console.log(`[Nurturing Aura] Increased ${character.name}'s current HP from ${oldHp} to ${character.stats.currentHp}`);
                    // --- END NEW ---
                    
                    alliesAffected++;
                    
                    // Create visual effect on ally
                    this.showHealthAuraVFX(character);
                }
            });
        }
        
        // Create visual effect on self
        this.showHealthAuraVFX(this, true);
        
        console.log(`[Farmer Shoma] Nurturing Aura applied to ${alliesAffected} allies`);
    }
    
    // Show visual effect for health aura
    showHealthAuraVFX(character, isSelf = false) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create the aura VFX
        const auraVfx = document.createElement('div');
        auraVfx.className = 'nurturing-aura-vfx';
        if (isSelf) {
            auraVfx.classList.add('self');
        }
        
        // Add particle elements inside the VFX container
        auraVfx.innerHTML = `
            <div class="nurturing-aura-particles"></div>
            <div class="aura-text">+${isSelf ? this.teamHealthAura.selfBonus : this.teamHealthAura.allyBonus} HP</div>
        `;
        
        charElement.appendChild(auraVfx);
        
        // Show floating text with HP gain
        if (typeof window.gameManager?.uiManager?.showFloatingText === 'function') {
            window.gameManager.uiManager.showFloatingText(
                character.instanceId || character.id,
                `+${isSelf ? this.teamHealthAura.selfBonus : this.teamHealthAura.allyBonus} Max HP`,
                'buff'
            );
        }
        
        // Remove the VFX after animation completes
        setTimeout(() => {
            auraVfx.remove();
        }, 3000);
    }
    
    // Check and update crit boost on turn change
    checkPassiveCritBoost(currentTurn) {
        // Get actual turn from the game manager if available 
        const actualTurn = window.gameManager && window.gameManager.gameState ? 
            window.gameManager.gameState.turn : currentTurn;
        
        // Debug log to confirm turn checking is working
        const logFunction = window.gameManager ? 
            window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        
        // Only log once every 5 turns to avoid spam
        if (actualTurn % 5 === 0 || actualTurn === this.passiveTriggerTurn) { // Check against the actual trigger turn
            logFunction(`${this.name}'s Farming Experience: Turn ${actualTurn}/${this.passiveTriggerTurn}`, 'passive-check');
        }
        
        if (actualTurn >= this.passiveTriggerTurn && !this.isPassiveCritBoosted) {
            // Apply crit chance boost
            this.isPassiveCritBoosted = true;
            // Use applyStatModification to set the crit chance
            this.applyStatModification('critChance', 'set', this.passiveCritBoostValue);
            
            // Update UI
            this.updatePassiveIndicator();
            
            // Log the passive activation with prominent styling
            logFunction(`★★★ ${this.name}'s Farming Experience reaches full potential! Crit chance increased to ${this.passiveCritBoostValue * 100}%! ★★★`, 'passive-effect critical');
            
            // --- Update passive description --- 
            if (this.passive) { 
                 this.passive.description = `You start with 50% crit chance, increased to ${this.passiveCritBoostValue * 100}% after turn 20.`;
                 console.log(`Updated ${this.name}'s passive description upon activation.`);
            }
            // ------------------------------------

            // Create passive activation VFX
            const charElement = document.getElementById(`character-${this.id}`);
            if (charElement) {
                // Create a more prominent passive activation effect
                const passiveVfx = document.createElement('div');
                passiveVfx.className = 'shoma-passive-boost-vfx';
                passiveVfx.innerHTML = `<span>Crit Boost ${this.passiveCritBoostValue * 100}%!</span>`;
                charElement.appendChild(passiveVfx);
                
                // Add a full-character highlight effect
                const highlightEffect = document.createElement('div');
                highlightEffect.className = 'shoma-passive-highlight';
                charElement.appendChild(highlightEffect);
                
                // Remove VFX after animation
                setTimeout(() => {
                    passiveVfx.remove();
                    highlightEffect.remove();
                }, 2000);
            }
        }
    }
    
    // Modified to handle critical hits
    onCriticalHit(event) {
        // Only process if the character who scored the crit is Farmer Shoma
        if (event.detail && event.detail.source && event.detail.source.id === this.id) {
            console.log(`[Farmer Shoma] Critical hit detected from ${this.name}`);
            
            // Apply crit lifesteal boost if the talent is active
            if (this.critLifestealBoost > 0) {
                this.critLifestealStacks++;
                const lifestealGain = this.critLifestealBoost;
                
                // Use the proper stat modification method instead of directly modifying stats
                this.applyStatModification('lifesteal', 'add', lifestealGain);
                
                console.log(`[Farmer Shoma] Critical Leech talent active, gained ${lifestealGain * 100}% lifesteal (total now: ${this.stats.lifesteal * 100}%)`);
                
                // Get gameManager for proper functions and game state
                const gameManager = window.gameManager;
                if (gameManager) {
                    gameManager.addLogEntry(`${this.name}'s Critical Leech activated! Gained ${lifestealGain * 100}% lifesteal.`, 'special-effect');
                    this.showCriticalLeechVFX();
                }
                
                // Update character UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(this);
                }
            }
            
            // Process Critical Nourishment talent if active
            if (this.criticalHealProc && this.criticalHealProc > 0) {
                console.log(`[Farmer Shoma] Critical Nourishment talent active, will heal for ${this.criticalHealProc}`);
                
                // Get gameManager for proper functions and game state
                const gameManager = window.gameManager;
                if (!gameManager || !gameManager.gameState) {
                    console.warn("[Farmer Shoma] Cannot process Critical Nourishment - game manager not available");
                    return;
                }
                
                // First heal self
                this.heal(this.criticalHealProc, this);
                
                // Then find a random ally to heal
                const playerCharacters = gameManager.gameState.playerCharacters || [];
                const allies = playerCharacters.filter(char => char.id !== this.id && !char.isDead());
                
                if (allies.length > 0) {
                    // Select random ally
                    const randomAlly = allies[Math.floor(Math.random() * allies.length)];
                    randomAlly.heal(this.criticalHealProc, this);
                    
                    // Add log entry
                    gameManager.addLogEntry(`${this.name}'s Critical Nourishment heals ${this.name} and ${randomAlly.name} for ${this.criticalHealProc}!`, 'special-effect heal');
                    
                    // Show VFX on both characters
                    this.showCriticalNourishmentVFX(randomAlly);
                } else {
                    // If no allies, just add self-heal log
                    gameManager.addLogEntry(`${this.name}'s Critical Nourishment heals himself for ${this.criticalHealProc}!`, 'special-effect heal');
                }
            }
        }
    }
    
    // New method to handle critical heals
    onCriticalHeal(event) {
        console.log(`[Farmer Shoma] Critical heal detected from ${this.name}`);
        
        // Apply crit lifesteal boost if the talent is active
        if (this.critLifestealBoost > 0) {
            this.critLifestealStacks++;
            const lifestealGain = this.critLifestealBoost;
            
            // Use the proper stat modification method instead of directly modifying stats
            this.applyStatModification('lifesteal', 'add', lifestealGain);
            
            console.log(`[Farmer Shoma] Critical Leech talent active on heal, gained ${lifestealGain * 100}% lifesteal (total now: ${this.stats.lifesteal * 100}%)`);
            
            // Get gameManager for proper functions and game state
            const gameManager = window.gameManager;
            if (gameManager) {
                gameManager.addLogEntry(`${this.name}'s Critical Leech activated from heal! Gained ${lifestealGain * 100}% lifesteal.`, 'special-effect');
                this.showCriticalLeechVFX();
            }
            
            // Update character UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this);
            }
        }
    }
    
    // New method to show the Critical Leech VFX
    showCriticalLeechVFX() {
        const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (!charElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'critical-leech-vfx';
        charElement.appendChild(vfxContainer);
        
        // Create a stack counter that shows how many stacks of lifesteal
        const stackCounter = document.createElement('div');
        stackCounter.className = 'critical-leech-stacks';
        stackCounter.textContent = `+${this.critLifestealStacks * 2.5}%`;
        vfxContainer.appendChild(stackCounter);
        
        // Play effect sound
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/buff.mp3', 0.5);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            vfxContainer.remove();
        }, 2000);
    }
    
    // Method to show the Critical Nourishment VFX
    showCriticalNourishmentVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'critical-nourishment-vfx';
        charElement.appendChild(vfxContainer);
        
        // Create healing particles
        const healParticles = document.createElement('div');
        healParticles.className = 'critical-nourishment-particles';
        vfxContainer.appendChild(healParticles);
        
        // Play healing sound
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/heal.mp3', 0.6);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            vfxContainer.remove();
        }, 2000);
    }
}

// Register Farmer Shoma's character class with the character factory
CharacterFactory.registerCharacterClass('farmer_shoma', FarmerShomaCharacter);

// Add a debug function to print the current abilities state
function debugAbilities(character) {
    if (!character || !character.abilities) return;
    
    console.log(`=== Debug ${character.name}'s Abilities ===`);
    character.abilities.forEach(ability => {
        console.log(`Ability: ${ability.id} (${ability.name})`);
        console.log(`  Cooldown: ${ability.cooldown}`);
        console.log(`  Mana Cost: ${ability.manaCost}`);
        if (ability.baseDamage) console.log(`  Base Damage: ${ability.baseDamage}`);
        if (ability.healAmount) console.log(`  Heal Amount: ${ability.healAmount}`);
    });
    console.log('=== End Debug ===');
}

// Create the Home Run Smash ability effect function
const homeRunSmashEffect = (caster, target, ability, actualManaCost, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Determine Base Damage CHECKING TALENT MODIFIERS --- 
    let baseDamage = 315; // Updated from 235 to 315
    if (ability.talentModifiers && ability.talentModifiers.baseDamage !== undefined) {
        baseDamage = ability.talentModifiers.baseDamage;
        console.log(`[HomeRunSmash] Using talent-modified base damage: ${baseDamage}`);
    } else {
        console.log(`[HomeRunSmash] Using default base damage: ${baseDamage}`);
    }
    // --- End Base Damage ---
    // --- Scaling Bonus Damage ---
    const scalingPercent = ability.scalingPercent || 0;
    const scalingBonus = caster.stats.physicalDamage * scalingPercent;
    if (scalingBonus) {
        console.log(`[HomeRunSmash] Applying scaling bonus: ${scalingBonus}`);
    }
    const totalDamage = baseDamage + scalingBonus;

    // --- Caster VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container home-run-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself for transform
        casterElement.classList.add('home-run-animation');

        // Create bat swing VFX inside the container
        const batSwingVfx = document.createElement('div');
        batSwingVfx.className = 'bat-swing-vfx';
        vfxContainer.appendChild(batSwingVfx);

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('home-run-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster VFX ---

    // Play sound
    playSound('sounds/bat_swing.mp3', 0.7); // Example sound

    // Set damage source property correctly on target for critical hit calculation
    target.isDamageSource = caster;
    
    // Apply damage using the determined baseDamage
    const result = target.applyDamage(totalDamage, 'physical', caster, options); // Use baseDamage variable, pass caster and options
    
    // Reset damage source
    target.isDamageSource = null;
    
    let message = `${caster.name} used Home Run Smash on ${target.name} for ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    log(message); // Log the message
    
    // --- Target Impact VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container home-run-impact-container';
        targetElement.appendChild(vfxContainer);

        // Add impact animation to target element itself
        targetElement.classList.add('home-run-impact');

        // Create impact VFX inside the container
        const impactVfx = document.createElement('div');
        impactVfx.className = 'home-run-impact-vfx';
        vfxContainer.appendChild(impactVfx);

        // Play impact sound
        playSound('sounds/bat_hit.mp3', 0.8); // Example sound

        // Remove container and target animation class
        setTimeout(() => {
            targetElement.classList.remove('home-run-impact');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Target Impact VFX ---

    // Check if Quick Smash talent is active by seeing if cooldown is 1
    // If the cooldown is 1, we assume the talent is active and skip applying stun
    const hasQuickSmashTalent = ability.cooldown === 1;
    
    // Apply stun effect with 35% chance only if Quick Smash talent is not active
    if (!hasQuickSmashTalent && Math.random() < 0.35) {
        const stunDebuff = new Effect(
            'farmer_shoma_stun_debuff',
            'Stunned',
            'Icons/debuffs/stun.png',
            2, // Duration of 2 turns
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
                const stunEffects = charElement.querySelectorAll('.stun-effect-container');
                stunEffects.forEach(el => el.remove());
            }
        };
        
        // Add debuff to target
        target.addDebuff(stunDebuff.clone()); // Clone before adding
        log(`${target.name} is stunned for 2 turns!`);

        // Add stun VFX
        if (targetElement) {
            targetElement.classList.add('stunned'); // Apply grayscale

            // Create container for stun VFX
            const stunVfxContainer = document.createElement('div');
            stunVfxContainer.className = 'vfx-container stun-effect-container';
            targetElement.appendChild(stunVfxContainer);

            // Create stun stars effect inside container
            const stunEffect = document.createElement('div');
            stunEffect.className = 'stun-effect'; // From farmer_alice_abilities.css
            stunVfxContainer.appendChild(stunEffect);

            // Note: The removal is handled by stunDebuff.remove
        }
    } else if (hasQuickSmashTalent) {
        console.log(`[HomeRunSmash] Quick Smash talent is active, skipping stun effect`);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
    console.log(`[HomeRunSmash Effect Debug] HP of target (${target.name}) immediately after UI update: ${target.stats.currentHp}`); // <<< ADDED LOG
};

// Create the Home Run Smash ability object
const homeRunSmashAbility = new Ability(
    'farmer_shoma_q',
    'Home Run Smash',
    'Icons/abilities/homerun_smash.jpeg',
    35, // Mana cost
    1,  // Cooldown reduced from 2 to 1 turn
    homeRunSmashEffect
)
.setTargetType('enemy');

// Assign relevant properties for description generation
homeRunSmashAbility.baseDamage = 315; // Updated from 235 to 315
homeRunSmashAbility.stunChance = 0.35; // Set the stun chance value
homeRunSmashAbility.scalingPercent = 0; // Default no scaling until talent

// Custom description generation to support talent modifications
homeRunSmashAbility.generateDescription = function() {
    let description = `Deals ${this.baseDamage} damage`;
    
    // Add scaling info if talent is active
    if (this.scalingPercent > 0) {
        description += ` <span class="talent-effect damage">plus ${this.scalingPercent * 100}% of Physical Damage</span>`;
    }
    
    // Only show stun chance if Quick Smash talent is not active (cooldown > 1)
    if (this.cooldown > 1) {
        description += ` and has ${this.stunChance * 100}% chance to stun the target for 2 turns.`;
    } else {
        description += `. <span class="talent-effect damage">No longer stuns, but cooldown reduced to 1 turn.</span>`;
    }
    
    this.description = description;
    return description;
};

// Generate initial description
homeRunSmashAbility.generateDescription();

// Add listener for ability modifications to update description
document.addEventListener('abilityModified', function(event) {
    if (event.detail && event.detail.abilityId === 'farmer_shoma_q') {
        console.log('Home Run Smash ability modified, updating description');
        homeRunSmashAbility.generateDescription();
    }
});

// Create the Apple Throw ability effect function
const appleThrowEffect = (caster, target, ability) => {
    // Debug ability state at the start
    debugAbilities(caster);

    // Get direct reference to the ability from caster's abilities
    const abilityReference = caster.abilities.find(a => a.id === 'farmer_shoma_w');
    if (abilityReference) {
        console.log(`[AppleThrow Effect] Apple Throw ability found. Cooldown: ${abilityReference.cooldown}`);
        
        // If talent system applied a modifier, it should be stored in talentModifiers
        if (abilityReference.talentModifiers && abilityReference.talentModifiers.cooldown) {
            console.log(`[AppleThrow Effect] Talent modified cooldown: ${abilityReference.talentModifiers.cooldown} (actual: ${abilityReference.cooldown})`);
        }
    }
    
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Get debuff values early for conditional VFX/logic
    const debuffDuration = ability.debuffDuration || 4;
    const debuffPower = ability.debuffPower || 0.2;
    const isEnhancedSplatter = debuffPower > 0.2;
    
    // VFX container for all apple throw effects
    const vfxContainer = document.createElement('div');

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        vfxContainer.className = 'vfx-container apple-throw-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('apple-throw-animation');

        // Create apple throw projectile VFX inside the container
        const appleVfx = document.createElement('div');
        appleVfx.className = 'apple-throw-vfx';
        
        // Add magical effects if the talent is active
        if (ability && ability.magicalScaling > 0) {
            appleVfx.classList.add('magical');
            
            // Add magical sparkles
            const sparklesContainer = document.createElement('div');
            sparklesContainer.className = 'magical-apple-sparkles';
            vfxContainer.appendChild(sparklesContainer);
            
            // Create sparkles
            for (let i = 0; i < 10; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'magical-sparkle';
                sparkle.style.top = `${Math.random() * 100}%`;
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
                sparklesContainer.appendChild(sparkle);
            }
            
            // Add magical trail
            const trailContainer = document.createElement('div');
            trailContainer.className = 'magical-apple-trail';
            vfxContainer.appendChild(trailContainer);
            
            // Create trail particles dynamically
            const createTrailParticles = () => {
                if (!trailContainer.parentNode) return; // Stop if container removed
                
                const particle = document.createElement('div');
                particle.className = 'magical-trail-particle';
                particle.style.top = `${40 + Math.random() * 20}%`;
                particle.style.left = `${40 + Math.random() * 20}%`;
                trailContainer.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => particle.remove(), 1000);
                
                // Continue creating particles
                if (trailContainer.parentNode) {
                    setTimeout(createTrailParticles, 100);
                }
            };
            
            // Start creating trail particles
            createTrailParticles();
        }
        
        vfxContainer.appendChild(appleVfx);

        // Create apple throw trail effects inside the container
        createAppleTrail(vfxContainer); // Pass container as parent

        // Play throwing sound
        playSound('sounds/apple_throw.mp3', 0.6); // Example sound
        playSound('sounds/shoma_apple.mp3', 0.7); // Farmer Shoma W sound
        
        // Play additional magical sound if talent is active
        if (ability && ability.magicalScaling > 0) {
            playSound('sounds/magic_spell.mp3', 0.5); // Example magical sound
        }

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('apple-throw-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Check if target is an ally or enemy
    const isAlly = caster.isAI === target.isAI;
    
    // --- TALENT: Apply Nurturing Toss Stacking Buff --- 
    if (ability && ability.appliesHealingPowerBuff) {
        // Check if the buff already exists to determine stacks
        let currentStacks = 1;
        const existingBuff = caster.buffs.find(buff => buff.id === 'nurturing_toss_buff');
        if (existingBuff && existingBuff.currentStacks) {
            currentStacks = Math.min(existingBuff.currentStacks + 1, 5); // Increment but cap at 5
        }
        
        const nurturingBuff = new Effect(
            'nurturing_toss_buff', // Unique ID for the buff
            'Nurturing Toss', // Buff name
            'Icons/buffs/nurturing_toss.png', // Placeholder icon
            5, // Duration
            null, // No immediate effect function
            false // Is a buff
        );

        // --- Set properties directly on the Effect instance --- 
        nurturingBuff.stackable = true;
        nurturingBuff.maxStacks = 5;
        nurturingBuff.statModifiers = [
            { stat: 'healingPower', value: 0.05 * currentStacks, operation: 'add' } // 5% per stack
        ];
        nurturingBuff.currentStacks = currentStacks; // Set current stacks

        // Dynamically generate description based on stacks
        nurturingBuff.updateDescription = function() { // Method to update description
            const stacks = this.currentStacks || 1;
            const totalBonus = stacks * 5;
            this.description = `Increases Healing Power by ${totalBonus}% (${stacks}/${this.maxStacks} stacks).`;
            return this; // Allow chaining
        };
        nurturingBuff.updateDescription();

        // --- Buff Apply/Remove for Stack Indicator ---
        nurturingBuff.onApply = function(character) {
            const stackCount = this.currentStacks || 1;
            
            // Find and remove any existing indicator
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                const existingIndicators = charElement.querySelectorAll('.nurturing-toss-stack-indicator');
                existingIndicators.forEach(el => el.remove());
                
                // Find status container
                let statusContainer = charElement.querySelector(`.status-container[data-effect-id="nurturing_toss_buff"], 
                                                                .status-effect-container[data-effect-id="nurturing_toss_buff"]`);
                
                if (!statusContainer) {
                    // Create container if it doesn't exist
                    statusContainer = document.createElement('div');
                    statusContainer.className = 'status-container';
                    statusContainer.dataset.effectId = 'nurturing_toss_buff';
                    const buffIcon = document.createElement('img');
                    buffIcon.src = this.icon;
                    buffIcon.className = 'buff-icon';
                    buffIcon.alt = this.name;
                    statusContainer.appendChild(buffIcon);
                    charElement.querySelector('.buffs').appendChild(statusContainer);
                }
                
                // Add stack indicator
                const stackIndicator = document.createElement('div');
                stackIndicator.className = 'nurturing-toss-stack-indicator';
                stackIndicator.textContent = stackCount;
                stackIndicator.classList.add('stack-updated'); // Animation class
                statusContainer.appendChild(stackIndicator);
                
                // Add glow effect
                const glowEffect = document.createElement('div');
                glowEffect.className = 'nurturing-toss-glow';
                statusContainer.appendChild(glowEffect);
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    if (stackIndicator.parentNode) { // Check if still exists
                        stackIndicator.classList.remove('stack-updated');
                    }
                }, 600);
            }
            
            const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            logFunction(`${character.name} gains Nurturing Toss buff (${stackCount}/${this.maxStacks} stacks)`, 'buff-effect');
        };
        
        nurturingBuff.remove = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                const indicators = charElement.querySelectorAll('.nurturing-toss-stack-indicator, .nurturing-toss-glow');
                indicators.forEach(indicator => {
                    indicator.classList.add('effect-fading');
                    setTimeout(() => {
                        if (indicator.parentNode) { // Check if still exists
                            indicator.remove();
                        }
                    }, 500);
                });
                
                // Also fade out the container
                const container = charElement.querySelector(`.status-container[data-effect-id="nurturing_toss_buff"], 
                                                          .status-effect-container[data-effect-id="nurturing_toss_buff"]`);
                if (container) {
                    container.classList.add('effect-fading');
                    setTimeout(() => {
                        if (container.parentNode) { // Check if still exists
                            container.remove();
                        }
                    }, 500);
                }
            }
            
            const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            logFunction(`${character.name}'s Nurturing Toss buff has expired.`, 'effect-expired');
        };
        // --- End Buff Apply/Remove ---

        // Add buff to caster
        caster.addBuff(nurturingBuff);
        
        console.log(`[Nurturing Toss] Applied buff with ${currentStacks} stacks`);
    }
    // --- END TALENT --- 
    
    if (isAlly) {
        // Helper function to apply heal effect to a single ally target
        const applyHealToAlly = (healTarget) => {
            // HEAL ALLY
            // Calculate base heal amount
            let healAmount = 750;
            
            // Apply magical scaling if talent is active
            if (ability && ability.magicalScaling > 0) {
                const magicalBonus = Math.round(caster.stats.magicalDamage * ability.magicalScaling);
                healAmount += magicalBonus;
                console.log(`[AppleThrow Heal] Added ${magicalBonus} magical healing from talent (${ability.magicalScaling * 100}% scaling)`);
            }
            
            // Apply healing (pass potentially scaled amount and caster)
            const healResult = healTarget.heal(healAmount, caster); // Pass caster for crit check
            console.log('[AppleThrow Debug] healResult:', healResult); // <--- ADD THIS LINE
            const actualHeal = healResult.healAmount;
            const isCriticalHeal = healResult.isCritical;
            
            // Log the healing (Critical heal log is handled inside target.heal)
            let healMessage = `${caster.name} used Apple Throw to heal ${healTarget.name} for ${Math.round(actualHeal)} health`;
            if (ability && ability.magicalScaling > 0) {
                healMessage += " (Magical Apple talent active)";
            }
            if (!isCriticalHeal) { // Only log non-critical heals here
                logFunction(healMessage);
            }
            
            // --- Ally Heal VFX ---
            const targetElement = document.getElementById(`character-${healTarget.instanceId || healTarget.id}`);
            if (targetElement) {
                const healVfxContainer = document.createElement('div');
                healVfxContainer.className = 'vfx-container apple-heal-vfx-container';
                targetElement.appendChild(healVfxContainer);

                // Add heal animation class to target element
                targetElement.classList.add('apple-heal-effect');

                // Create heal VFX elements inside the container
                const healVfx = document.createElement('div');
                healVfx.className = 'apple-heal-vfx';
                healVfxContainer.appendChild(healVfx);

                const healSplash = document.createElement('div');
                healSplash.className = 'healing-apple-splash';
                healVfxContainer.appendChild(healSplash);

                // Create healing particles inside the container
                createHealingParticles(healVfxContainer); // Pass container as parent

                // Play heal sound
                playSound('sounds/heal_effect.mp3', 0.7); // Example sound

                // Remove container and target animation class
                setTimeout(() => {
                    targetElement.classList.remove('apple-heal-effect');
                    healVfxContainer.remove();
                }, 1200); // Match animation duration
            }
            
            return actualHeal; // Return the actual heal amount applied to the target
        };
        
        // Apply heal to the primary target first
        const primaryHeal = applyHealToAlly(target);
        
        // --- NEW: Check for AOE ally heal from talent ---
        let shouldApplyAoe = false;
        if (ability && ability.allyAoeChance) {
            // Roll for AOE chance
            const aoeRoll = Math.random();
            shouldApplyAoe = aoeRoll <= ability.allyAoeChance;
            
            if (shouldApplyAoe) {
                // Get game manager if available
                const gameManager = window.gameManager;
                
                if (gameManager) {
                    // Get all allies except the primary target
                    const allAllies = caster.isAI ? 
                                    gameManager.gameState.aiCharacters : 
                                    gameManager.gameState.playerCharacters;
                    
                    const otherAllies = allAllies.filter(ally => 
                        ally !== target && !ally.isDead());
                    
                    if (otherAllies.length > 0) {
                        // Log the AOE effect proc
                        logFunction(`${caster.name}'s Bountiful Harvest activates, healing all other allies!`, 'special-effect');
                        
                        // Apply VFX for the AOE proc
                        if (casterElement) {
                            const aoeVfx = document.createElement('div');
                            aoeVfx.className = 'bountiful-harvest-vfx';
                            casterElement.appendChild(aoeVfx);
                            
                            setTimeout(() => aoeVfx.remove(), 1500);
                        }
                        
                        // Apply healing to all other allies with a slight delay between each
                        otherAllies.forEach((ally, index) => {
                            setTimeout(() => {
                                applyHealToAlly(ally); // Call the same heal function
                            }, 200 * (index + 1)); // Stagger the heal effects
                        });
                    }
                }
            }
        }
        // --- END NEW AOE code ---
        
        // --- NEW: Handle Caster Heal from Talent --- 
        // This heal is based on the primary heal amount, which now includes magical scaling
        if (ability && ability.casterHealPercent) {
            const casterHealAmount = Math.round(primaryHeal * ability.casterHealPercent);
            if (casterHealAmount > 0) {
                const casterHealResult = caster.heal(casterHealAmount, caster); // Caster heals self
                if (!casterHealResult.isCritical) { // Don't double log criticals
                     logFunction(`${caster.name} healed themself for ${Math.round(casterHealResult.healAmount)} due to Refreshing Toss talent!`, 'heal talent-effect');
                }
                 // Optional: Add caster heal VFX
                 // showCasterHealVFX(caster, casterHealAmount);
            }
        }
        // --- END NEW ---
    } else {
        // DAMAGE ENEMY
        // Set damage source for crit calculation
        target.isDamageSource = caster;
        
        // Calculate base damage
        let damage = 400;
        
        // Apply magical scaling if talent is active
        if (ability && ability.magicalScaling > 0) {
            const magicalBonus = Math.round(caster.stats.magicalDamage * ability.magicalScaling);
            damage += magicalBonus;
            console.log(`[Apple Throw] Added ${magicalBonus} magical damage from talent (${ability.magicalScaling * 100}% scaling)`);
        }
        
        // Apply damage
        const result = target.applyDamage(damage, 'physical', caster); // Pass caster as the third parameter
        
        // Reset damage source
        target.isDamageSource = null;
        
        // Log the damage
        let message = `${caster.name} used Apple Throw on ${target.name} for ${result.damage} physical damage`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        if (ability && ability.magicalScaling > 0) {
            message += " (Magical Apple talent active)";
        }
        logFunction(message);
        
        // --- Enemy Impact VFX ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'vfx-container apple-impact-vfx-container';
            targetElement.appendChild(vfxContainer);

            // Add impact animation class to target element
            targetElement.classList.add('apple-impact');
            
            // Create impact VFX elements inside the container
            const impactVfx = document.createElement('div');
            impactVfx.className = 'apple-impact-vfx';
            
            // Add magical class if talent is active
            if (ability && ability.magicalScaling > 0) {
                impactVfx.classList.add('magical');
                
                // Add magical impact particles
                const magicalImpactParticles = document.createElement('div');
                magicalImpactParticles.className = 'magical-apple-sparkles';
                vfxContainer.appendChild(magicalImpactParticles);
                
                // Create sparkles
                for (let i = 0; i < 15; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'magical-sparkle';
                    sparkle.style.top = `${Math.random() * 100}%`;
                    sparkle.style.left = `${Math.random() * 100}%`;
                    sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
                    magicalImpactParticles.appendChild(sparkle);
                }
                
                // Play additional magical impact sound
                playSound('sounds/magic_impact.mp3', 0.6); // Example magical impact sound
            }
            
            // Add enhanced class if Apple Splatter talent is active
            if (isEnhancedSplatter) {
                impactVfx.classList.add('enhanced');
            }

            vfxContainer.appendChild(impactVfx);

            // Create apple splash fragments
            const splashFragments = document.createElement('div');
            splashFragments.className = 'apple-splash-fragments';
            vfxContainer.appendChild(splashFragments);
            
            // Create individual fragment particles
            for (let i = 0; i < (isEnhancedSplatter ? 12 : 8); i++) {
                const fragment = document.createElement('div');
                fragment.className = 'apple-fragment';
                
                // Add enhanced class if Apple Splatter talent is active
                if (isEnhancedSplatter) {
                    fragment.classList.add('enhanced');
                }
                
                // Random angle for fragment spread
                const angle = Math.random() * Math.PI * 2;
                const distance = 30 + Math.random() * (isEnhancedSplatter ? 70 : 50);
                
                // Set CSS variables for animation
                fragment.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
                fragment.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
                
                splashFragments.appendChild(fragment);
            }
            
            const damagePulse = document.createElement('div');
            damagePulse.className = isEnhancedSplatter ? 'apple-damage-pulse enhanced' : 'apple-damage-pulse';
            vfxContainer.appendChild(damagePulse);
            
            // Position VFX elements at target location
            const targetRect = targetElement.getBoundingClientRect();
            impactVfx.style.left = `${targetRect.left + targetRect.width/2}px`;
            impactVfx.style.top = `${targetRect.top + targetRect.height/2}px`;
            splashFragments.style.left = `${targetRect.left + targetRect.width/2}px`;
            splashFragments.style.top = `${targetRect.top + targetRect.height/2}px`;
            
            // Add screen shake effect - stronger if enhanced
            document.body.classList.add('shake-animation');
            if (isEnhancedSplatter) {
                document.body.classList.add('strong-shake');
            }
            setTimeout(() => {
                document.body.classList.remove('shake-animation');
                document.body.classList.remove('strong-shake');
            }, 500);
            
            // Play impact sound
            playSound('sounds/apple_impact.mp3', isEnhancedSplatter ? 1.0 : 0.8); // Louder if enhanced

            // Remove container and target animation class
            setTimeout(() => {
                targetElement.classList.remove('apple-impact');
                vfxContainer.remove();
            }, 900); // Match animation duration
        }
        // --- End Enemy Impact VFX ---
        
        // Apply damage reduction debuff
        // Note: debuffDuration and debuffPower are already defined above
        // Note: isEnhancedSplatter is already defined above
        
        const damageReductionDebuff = new Effect(
            'apple_throw_debuff',
            'Apple Splatter',
            'Icons/debuffs/apple_splash.jpeg',
            debuffDuration, // Use the pre-defined duration
            null,
            true // Is a debuff
        );

        // Set stat modifiers - reduce damage by debuffPower
        // ... (stat modifier setup using pre-defined debuffPower) ...
        
        // Generate description with actual values
        const reductionPercent = Math.round(debuffPower * 100);
        damageReductionDebuff.setDescription(`Reduces all damage dealt by ${reductionPercent}%.`);

        // Add visual indicator logic
        damageReductionDebuff.onApply = function(character) {
            // ... (indicator creation) ...
            
            // Add enhanced damage pulse effect if Apple Splatter talent is active
            if (isEnhancedSplatter) { // Now defined
                const damagePulse = document.createElement('div');
                damagePulse.className = 'apple-damage-pulse enhanced';
                damagePulse.dataset.debuffId = 'apple_throw_debuff';
                charElement.appendChild(damagePulse);
            }
            
            // ... (log message setup using pre-defined reductionPercent and debuffDuration) ...
            
            // Add emphasis to log message if enhanced
            if (isEnhancedSplatter) { // Now defined
                message += ' <span class="critical">Enhanced Splatter!</span>';
                logFunction(message, 'debuff-effect critical');
            } else {
                logFunction(message, 'debuff-effect');
            }
        };

        // ... (debuff remove function) ...

        // Apply debuff to target
        target.addDebuff(damageReductionDebuff);
    }
    
    // --- Update UI after ability is used ---
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
        updateCharacterUI(target);
    }
};

// Create Apple Throw ability object
const appleThrowAbility = new Ability(
    'farmer_shoma_w',
    'Apple Throw',
    'Icons/abilities/apple_throw.jpeg',
    60, // Mana cost increased from 45 to 60
    3,  // Cooldown in turns - THIS IS OVERRIDDEN BY TALENT LATER
    appleThrowEffect
)
.setDescription('If targets ally: Heals {healAmount} health. If targets enemy: Deals {baseDamage} damage and reduces their damage by 20% for 4 turns. Both effects can crit.')
.setTargetType('any');

// Assign relevant properties for description generation
appleThrowAbility.baseDamage = 400;
appleThrowAbility.healAmount = 750;
appleThrowAbility.baseCooldown = 3; // Store original for reference
appleThrowAbility.magicalScaling = 0; // Default no magical scaling
appleThrowAbility.debuffPower = 0.2; // Default 20% damage reduction
appleThrowAbility.debuffDuration = 4; // Default 4 turns

// Custom method to generate description based on available talents
appleThrowAbility.generateDescription = function() {
    let desc = 'If targets ally: Heals {healAmount} health. If targets enemy: Deals {baseDamage} damage';
    
    // Add magical scaling info
    if (this.magicalScaling > 0) {
        desc += ` plus ${this.magicalScaling * 100}% of Magical Damage`;
    }
    
    // Get debuff values based on talent modifications
    const debuffPower = this.debuffPower || 0.2; // Default 20%
    const debuffDuration = this.debuffDuration || 4; // Default 4 turns
    const reductionPercent = Math.round(debuffPower * 100);
    
    desc += ` and reduces their damage by ${reductionPercent}% for ${debuffDuration} turns. Both effects can crit.`;
    
    // Check if ability has magical scaling from talent
    if (this.magicalScaling > 0) {
        desc += ` <span class="talent-effect damage">Enhanced with magical power.</span>`;
    }
    
    // Check if Apple Splatter talent is active
    if (this.debuffPower > 0.2) {
        desc += ` <span class="talent-effect damage">Apple Splatter is more powerful but shorter.</span>`;
    }
    
    // Check if Nurturing Toss talent is active
    if (this.appliesHealingPowerBuff) {
        desc += ' <span class="talent-effect healing">Also grants 5% Healing Power for 5 turns (stacks up to 5 times).</span>';
    }
    
    // Check if Refreshing Toss talent is active
    if (this.casterHealPercent > 0) {
        desc += ` <span class="talent-effect healing">Additionally heals yourself for ${this.casterHealPercent * 100}% of the healing done.</span>`;
    }
    
    // Check if Bountiful Harvest talent is active
    if (this.allyAoeChance > 0) {
        desc += ` <span class="talent-effect aoe">Has a ${this.allyAoeChance * 100}% chance to affect all allies when used on an ally.</span>`;
    }
    
    this.description = desc
        .replace('{healAmount}', this.healAmount || 750)
        .replace('{baseDamage}', this.baseDamage || 400);
    
    // Log description change
    console.log(`[Ability Description] Apple Throw description updated: ${this.description}`);
        
    return this;
};

appleThrowAbility.generateDescription(); // Generate initial description

console.log(`[Abilities] Initialized Apple Throw with base cooldown of ${appleThrowAbility.cooldown}`);

// Helper function to create trail effect for apple throw
function createAppleTrail(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for trail elements *inside* the provided vfxContainer
    const trailContainer = document.createElement('div');
    trailContainer.className = 'apple-throw-trail';
    vfxContainer.appendChild(trailContainer);
    
    // Create 8 trail dots
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            if (!vfxContainer.contains(trailContainer)) return;
            
            const trailDot = document.createElement('div');
            trailDot.style.position = 'absolute';
            trailDot.style.width = '15px';
            trailDot.style.height = '15px';
            trailDot.style.borderRadius = '50%';
            trailDot.style.background = `radial-gradient(circle, rgba(255, ${20 + i * 10}, ${i * 10}, 0.7) 0%, rgba(255, 0, 0, 0.1) 70%)`;
            trailDot.style.left = `${25 + i * 20}%`;
            trailDot.style.top = `${40 - i * 5}%`;
            trailDot.style.zIndex = '4';
            trailDot.style.filter = 'blur(2px)';
            trailDot.style.animation = 'trailFade 0.6s forwards';
            
            trailContainer.appendChild(trailDot);
            
            // Auto-remove trail dot after animation
            setTimeout(() => {
                if (trailDot && trailDot.parentNode) { // Check if dot exists
                    trailDot.remove();
                }
            }, 600);
        }, i * 60);
    }
}

// Helper function to create healing particles
function createHealingParticles(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'apple-heal-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create 15 particles with different positions, sizes and delays
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'apple-heal-particle';
        
        // Randomize particle properties
        const size = 5 + Math.random() * 8;
        const left = 10 + Math.random() * 80;
        const bottom = 5 + Math.random() * 80;
        const delay = Math.random() * 0.5;
        const duration = 0.7 + Math.random() * 0.8;
        
        // Set particle styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.bottom = `${bottom}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Helper function to create apple splash fragments
function createAppleSplashFragments(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for fragments *inside* the provided vfxContainer
    const fragmentsContainer = document.createElement('div');
    fragmentsContainer.className = 'apple-splash-fragments';
    vfxContainer.appendChild(fragmentsContainer);
    
    // Create fragments with different trajectories and sizes
    for (let i = 0; i < 12; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'apple-fragment';
        
        // Randomize fragment properties
        const size = 4 + Math.random() * 8;
        const angle = (i / 12) * 360;
        const distance = 30 + Math.random() * 40;
        const duration = 0.5 + Math.random() * 0.5;
        
        // Set initial position at center
        fragment.style.left = '50%';
        fragment.style.top = '50%';
        fragment.style.width = `${size}px`;
        fragment.style.height = `${size}px`;
        fragment.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
        
        // Create keyframe animation for this fragment
        const keyframes = `
        @keyframes fragment${i} {
            0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
            100% { transform: translate(
                calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px), 
                calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)
            ) rotate(${Math.random() * 720 - 360}deg); opacity: 0; }
        }`;
        
        // Add keyframes to document
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
        
        // Apply animation
        fragment.style.animation = `fragment${i} ${duration}s forwards ease-out`;
        
        fragmentsContainer.appendChild(fragment);
    }
}

// Create the Farmer's Catch ability effect function
const farmersCatchEffect = (caster, target, ability) => {
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container farmers-catch-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('farmers-catch-animation');

        // Create VFX elements inside the container
        const catchVfx = document.createElement('div');
        catchVfx.className = 'farmers-catch-vfx';
        vfxContainer.appendChild(catchVfx);

        // Play catch sound
        playSound('sounds/catch.mp3', 0.6); // Example sound
        playSound('sounds/fshoma_e.mp3', 0.7); // Farmer Shoma E sound

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('farmers-catch-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Create dodge buff effect - Use ability.buffDuration if available or default to 5
    const duration = ability && ability.buffDuration ? ability.buffDuration : 5;
    const dodgeBuff = new Effect(
        'farmers_catch_buff',
        'Farmer\'s Catch',
        'Icons/buffs/farmers_catch.jpeg',
        duration, // Use dynamic duration value
        null,
        false // Is a buff, not a debuff
    );
    
    // Set dodge boost using statModifiers - this is the correct way
    // The stat has to match exactly the property name in the character's stats object
    dodgeBuff.statModifiers = [
        { stat: 'dodgeChance', value: 0.5, operation: 'add' } // +50% dodge chance
    ];
    
    dodgeBuff.setDescription(`Increases dodge chance by 50% for ${duration} turns.`);
    
    // --- Refactored Buff Apply/Remove for Indicator ---
    dodgeBuff.onApply = function(character) {
        const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (targetElement) {
            // Create container for the indicator
            const indicatorContainer = document.createElement('div');
            indicatorContainer.className = 'status-indicator-container dodge-buff-indicator-container';
            
            // Add extended-duration class if talent is active
            if (this.duration > 5) {
                indicatorContainer.classList.add('extended-duration');
            }

            indicatorContainer.dataset.buffId = 'farmers_catch_buff'; // Link to buff
            targetElement.appendChild(indicatorContainer);

            const buffIndicator = document.createElement('div');
            buffIndicator.className = 'dodge-buff-indicator'; // CSS for styling and animation
            buffIndicator.innerHTML = '💨';
            indicatorContainer.appendChild(buffIndicator);

            // Create initial buff application VFX (glow and particles)
            const buffVfxContainer = document.createElement('div');
            buffVfxContainer.className = 'vfx-container dodge-buff-apply-vfx';
            targetElement.appendChild(buffVfxContainer);

            const buffGlowVfx = document.createElement('div');
            buffGlowVfx.className = 'dodge-buff-vfx'; // The glow effect
            
            // Add extended class if talent is active
            if (this.duration > 5) {
                buffGlowVfx.classList.add('extended');
            }

            buffVfxContainer.appendChild(buffGlowVfx);

            createWindEffectParticles(buffVfxContainer, this.duration > 5); // Add container and duration check

            // Remove apply effect container after animation
            setTimeout(() => buffVfxContainer.remove(), 1200);
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s dodge chance increased by 50%!`, 'buff-effect');
    };

    dodgeBuff.remove = function(character) {
        const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (targetElement) {
            const indicators = targetElement.querySelectorAll('.dodge-buff-indicator-container[data-buff-id="farmers_catch_buff"]');
            indicators.forEach(container => {
                const indicator = container.querySelector('.dodge-buff-indicator');
                if (indicator) {
                    indicator.style.animation = 'fadeOut 0.5s forwards';
                }
                setTimeout(() => container.remove(), 500);
            });
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s dodge chance boost has expired.`, 'effect-expired');
    };
    // --- End Refactored Buff Apply/Remove ---

    // Add buff to target
    target.addBuff(dodgeBuff.clone()); // Clone before adding
    // Log the buff application
    logFunction(`${caster.name} used Farmer's Catch on ${target.name}, increasing their dodge chance by 50% for ${duration} turns!`);
    // If Shared Strength talent is active, also buff the caster
    if (ability.buffCaster) {
        caster.addBuff(dodgeBuff.clone());
        logFunction(`${caster.name} also gains the dodge buff from Shared Strength talent!`, 'buff-effect');
        updateCharacterUI(caster);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Helper function to create wind effect particles for dodge buff
function createWindEffectParticles(vfxContainer, isExtended = false) { // Add isExtended parameter
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'wind-effect-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create wind streaks with different positions and animations
    for (let i = 0; i < (isExtended ? 12 : 8); i++) {
        const streak = document.createElement('div');
        streak.className = 'wind-streak';
        
        // Add extended class if talent is active
        if (isExtended) {
            streak.classList.add('extended');
        }
        
        // Randomize properties
        const width = 50 + Math.random() * 30;
        const opacity = 0.6 + Math.random() * 0.3;
        const top = 10 + Math.random() * 80;
        const delay = Math.random() * 0.3;
        const duration = 0.6 + Math.random() * 0.4;
        
        // Set streak styles
        streak.style.width = `${width}px`;
        streak.style.height = `${isExtended ? 4 : 3}px`;
        streak.style.opacity = isExtended ? (opacity + 0.2) : opacity;
        streak.style.top = `${top}%`;
        streak.style.animationDelay = `${delay}s`;
        streak.style.animationDuration = `${isExtended ? (duration * 0.8) : duration}s`;
        
        particlesContainer.appendChild(streak);
    }
}

// Create Farmer's Catch ability object
const farmersCatchAbility = new Ability(
    'farmer_shoma_e',
    'Farmer\'s Catch',
    'Icons/abilities/farmers_catch.jpeg',
    95, // Mana cost
    10, // Cooldown in turns
    farmersCatchEffect
)
.setTargetType('ally');

// Assign relevant properties for description generation
farmersCatchAbility.dodgeBoost = 0.5; // Use a property name matching the placeholder
farmersCatchAbility.buffCaster = false; // Default no self-buff until talent
farmersCatchAbility.buffDuration = 5; // Default duration

// Custom description generation to support talent modifications
farmersCatchAbility.generateDescription = function() {
    let description = `Increase target's dodge chance by ${this.dodgeBoost * 100}% for ${this.buffDuration || 5} turns.`;
    
    // Add self-buff info if talent is active
    if (this.buffCaster) {
        description += ` <span class="talent-effect utility">Also applies the buff to Shoma.</span>`;
    }
    
    // Check if Enduring Catch talent is active
    if (this.buffDuration && this.buffDuration > 5) {
        description += ` <span class="talent-effect utility">Extended duration from 5 turns.</span>`;
    }
    
    this.description = description;
    return description;
};

// Generate initial description
farmersCatchAbility.generateDescription();

// Add listener for ability modifications to update description
document.addEventListener('abilityModified', function(event) {
    if (event.detail && event.detail.abilityId === 'farmer_shoma_e') {
        console.log('Farmer\'s Catch ability modified, updating description');
        farmersCatchAbility.generateDescription();
    }
});

// Create the Cottage Run ability effect function
const cottageRunEffect = (caster, target) => {
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container cottage-run-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('cottage-run-animation');

        // Create VFX elements inside the container
        const runVfx = document.createElement('div');
        runVfx.className = 'cottage-run-vfx';
        vfxContainer.appendChild(runVfx);

        createDashEffectParticles(vfxContainer); // Pass container as parent

        // Play dash sound
        playSound('sounds/dash.mp3', 0.6); // Example sound
        playSound('sounds/fshoma_r.mp3', 0.7); // Farmer Shoma R sound

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('cottage-run-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Calculate healing - 35% of missing health (reduced from 50%)
    const missingHealth = target.stats.maxHp - target.stats.currentHp;
    const healAmount = Math.round(missingHealth * 0.35);
    
    // Apply healing
    const healResult = target.heal(healAmount, caster); // Pass caster for crit check
    const actualHeal = healResult.healAmount;
    const isCriticalHeal = healResult.isCritical;
    
    // Log the healing (Critical heal log is handled inside target.heal)
    if (!isCriticalHeal) { // Only log non-critical heals here
        logFunction(`${caster.name} used Cottage Run to heal ${Math.round(actualHeal)} health (35% of missing health).`);
    }
    
    // --- NEW: Check for and apply mana restoration from talent ---
    const cottageRunAbility = caster.abilities.find(ability => ability.id === 'farmer_shoma_r');
    
    if (cottageRunAbility && cottageRunAbility.restoresManaPercent) {
        const manaRestorePercent = cottageRunAbility.restoresManaPercent;
        const manaRestoreAmount = Math.floor(target.stats.maxMana * manaRestorePercent);
        
        if (manaRestoreAmount > 0) {
            // Apply mana restoration
            const oldMana = target.stats.currentMana;
            target.stats.currentMana = Math.min(target.stats.maxMana, target.stats.currentMana + manaRestoreAmount);
            const actualManaRestored = target.stats.currentMana - oldMana;
            
            // Log the mana restoration
            logFunction(`${caster.name}'s Cottage Run also restored ${actualManaRestored} mana (${manaRestorePercent * 100}% of maximum mana).`, 'buff-effect');
            
            // Add mana restore VFX if target element exists
            if (casterElement) {
                const manaVfxContainer = document.createElement('div');
                manaVfxContainer.className = 'vfx-container cottage-run-mana-vfx-container';
                casterElement.appendChild(manaVfxContainer);
                
                // Add mana effect class to character element
                casterElement.classList.add('cottage-run-mana-effect');
                
                // Create mana VFX
                const manaVfx = document.createElement('div');
                manaVfx.className = 'cottage-run-mana-vfx';
                manaVfxContainer.appendChild(manaVfx);
                
                // Create mana particles
                createManaParticles(manaVfxContainer);
                
                // Play mana sound
                playSound('sounds/mana_restore.mp3', 0.6);
                
                // Remove container and effect class after animation
                setTimeout(() => {
                    casterElement.classList.remove('cottage-run-mana-effect');
                    manaVfxContainer.remove();
                }, 2000);
            }
        }
    }
    // --- END NEW mana restoration code ---

    // --- NEW: Check for "Unstoppable Farmer" talent effect ---
    if (cottageRunAbility && cottageRunAbility.resetsCooldownsAndContinues) {
        // Reset all cooldowns for caster's abilities EXCEPT Cottage Run itself
        const abilitiesOnCooldown = caster.abilities.filter(ability => 
            ability.currentCooldown > 0 && ability.id !== 'farmer_shoma_r'
        );
        
        if (abilitiesOnCooldown.length > 0) {
            // Create a cooldown reset VFX
            if (casterElement) {
                const resetVfxContainer = document.createElement('div');
                resetVfxContainer.className = 'vfx-container cooldown-reset-vfx-container';
                casterElement.appendChild(resetVfxContainer);
                
                const resetVfx = document.createElement('div');
                resetVfx.className = 'unstoppable-farmer-vfx';
                resetVfxContainer.appendChild(resetVfx);
                
                // Add clock reset indicator
                const resetIndicator = document.createElement('div');
                resetIndicator.className = 'cooldown-reset-indicator';
                resetVfxContainer.appendChild(resetIndicator);
                
                // Play a special sound for cooldown reset
                playSound('sounds/reset.mp3', 0.7);
                
                // Remove VFX after animation
                setTimeout(() => {
                    resetVfxContainer.remove();
                }, 1500);
            }
            
            // Reset all cooldowns except for Cottage Run itself
            abilitiesOnCooldown.forEach(ability => {
                const oldCooldown = ability.currentCooldown;
                ability.currentCooldown = 0;
                
                // Add reset visual effect to the ability in UI
                const abilityElements = document.querySelectorAll(`.ability[data-ability-id="${ability.id}"]`);
                abilityElements.forEach(abilityEl => {
                    abilityEl.classList.add('cooldown-reset');
                    setTimeout(() => abilityEl.classList.remove('cooldown-reset'), 700);
                });
                
                logFunction(`${caster.name}'s ${ability.name} cooldown reset from ${oldCooldown} to 0!`, 'special-effect');
            });
            
            logFunction(`${caster.name}'s Unstoppable Farmer talent resets all ability cooldowns!`, 'special-effect');
        }
        
        // Prevent turn end (similar to Ayane's Teleport Blade)
        if (window.gameManager) {
            try {
                if (typeof window.gameManager.preventTurnEnd === 'function') {
                    window.gameManager.preventTurnEnd();
                    logFunction(`${caster.name}'s Unstoppable Farmer talent allows another action!`, 'special-effect');
                } else {
                    // Fallback for backward compatibility
                    window.gameManager.preventTurnEndFlag = true;
                    logFunction(`${caster.name}'s Unstoppable Farmer talent allows another action! (fallback method)`, 'special-effect');
                }
            } catch (error) {
                console.error("Error in Unstoppable Farmer effect:", error);
            }
        }
    }
    // --- END NEW Unstoppable Farmer effect ---
    
    // --- Caster Heal VFX (target is caster) ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`); // target is caster
    if (targetElement) {
        const healVfxContainer = document.createElement('div');
        healVfxContainer.className = 'vfx-container cottage-run-heal-vfx-container';
        targetElement.appendChild(healVfxContainer);

        // Add heal animation class to target element
        targetElement.classList.add('cottage-run-heal-effect');

        // Create heal VFX elements inside the container
        const healVfx = document.createElement('div');
        healVfx.className = 'cottage-run-heal-vfx';
        healVfxContainer.appendChild(healVfx);

        createHealingParticles(healVfxContainer); // Pass container as parent

        // Play heal sound
        playSound('sounds/cottage_heal.mp3', 0.7); // Example sound

        // Remove container and target animation class
        setTimeout(() => {
            targetElement.classList.remove('cottage-run-heal-effect');
            healVfxContainer.remove();
        }, 1200); // Match animation duration
    }
    // --- End Caster Heal VFX ---

    // Create perfect dodge buff effect
    const perfectDodgeBuff = new Effect(
        'cottage_run_buff',
        'Perfect Dodge',
        'Icons/buffs/cottage_run.webp',
        3, // Duration reduced from 4 to 3 turns
        null,
        false // Is a buff, not a debuff
    );
    
    // Set dodge boost using statModifiers to 100%
    perfectDodgeBuff.statModifiers = [
        { stat: 'dodgeChance', value: 1.0, operation: 'set' } // Set to 100% dodge chance total
    ];
    
    perfectDodgeBuff.setDescription('Grants 100% dodge chance for 3 turns.');

    // --- Refactored Buff Apply/Remove for Indicator ---
    perfectDodgeBuff.onApply = function(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
             // Create container for the indicator
             const indicatorContainer = document.createElement('div');
             indicatorContainer.className = 'status-indicator-container perfect-dodge-indicator-container';
             indicatorContainer.dataset.buffId = 'cottage_run_buff'; // Link to buff
             charElement.appendChild(indicatorContainer);

            const buffIndicator = document.createElement('div');
            buffIndicator.className = 'perfect-dodge-indicator'; // CSS for styling and animation
            buffIndicator.innerHTML = '🏠';
            indicatorContainer.appendChild(buffIndicator);

            // Create initial buff application VFX
            const buffVfxContainer = document.createElement('div');
            buffVfxContainer.className = 'vfx-container perfect-dodge-apply-vfx';
            charElement.appendChild(buffVfxContainer);

            const buffGlowVfx = document.createElement('div');
            buffGlowVfx.className = 'perfect-dodge-vfx';
            buffVfxContainer.appendChild(buffGlowVfx);

            createWindEffectParticles(buffVfxContainer); // Add particles

            // Remove apply effect container after animation
            setTimeout(() => buffVfxContainer.remove(), 1200);
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name} gains Perfect Dodge! (100% dodge chance for 3 turns)`, 'buff-effect');
    };

    perfectDodgeBuff.remove = function(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const indicators = charElement.querySelectorAll('.perfect-dodge-indicator-container[data-buff-id="cottage_run_buff"]');
            indicators.forEach(container => {
                const indicator = container.querySelector('.perfect-dodge-indicator');
                if (indicator) {
                    indicator.style.animation = 'fadeOut 0.5s forwards';
                }
                setTimeout(() => container.remove(), 500);
            });
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s Perfect Dodge has expired.`, 'effect-expired');
    };
    // --- End Refactored Buff Apply/Remove ---

    // Add buff to target (caster)
    target.addBuff(perfectDodgeBuff.clone()); // Clone before adding

    // Log the buff application
    logFunction(`${caster.name} used Cottage Run, granting themselves Perfect Dodge for 3 turns!`);

    // Update UI
    updateCharacterUI(caster);
};

// Helper function to create dash effect particles
function createDashEffectParticles(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'dash-effect-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create dust particles with different positions and animations
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'dash-particle';
        
        // Randomize properties
        const size = 5 + Math.random() * 8;
        const opacity = 0.5 + Math.random() * 0.4;
        const xPos = 20 + Math.random() * 60;
        const yPos = 40 + Math.random() * 40;
        const delay = Math.random() * 0.3;
        const duration = 0.5 + Math.random() * 0.5;
        
        // Set particle styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = opacity;
        particle.style.left = `${xPos}%`;
        particle.style.top = `${yPos}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }
    
    // No need to remove particlesContainer separately
    // setTimeout(() => {
    //     if (particlesContainer.parentNode) {
    //         particlesContainer.remove();
    //     }
    // }, 1500);
}

// Create Cottage Run ability object
const cottageRunAbility = new Ability(
    'farmer_shoma_r',
    'Cottage Run',
    'Icons/abilities/cottage_run.webp',
    150, // Mana cost
    22,  // Cooldown in turns
    cottageRunEffect
)
.setTargetType('self'); // Self-targeting ability

// Update description generation to include talent effects
cottageRunAbility.generateDescription = function() {
    let description = 'Heals 35% of missing health to himself and gains 100% dodge chance for 3 turns.';
    
    // Add mana restoration to description if talent is active
    if (this.restoresManaPercent) {
        description += ` <span class="talent-effect resource">Also restores ${this.restoresManaPercent * 100}% of maximum mana.</span>`;
    }
    
    // Add Unstoppable Farmer talent effect to description
    if (this.resetsCooldownsAndContinues) {
        description += ` <span class="talent-effect powerful">Resets all other ability cooldowns and allows another action.</span>`;
    }
   
    this.description = description;
    return description;
};

// Generate initial description
cottageRunAbility.generateDescription();

// Ensure the description is updated after the talent is applied
document.addEventListener('abilityModified', function(event) {
    if (event.detail && event.detail.abilityId === 'farmer_shoma_r') {
        console.log('Cottage Run ability modified, updating description');
        cottageRunAbility.generateDescription();
    }
});

// Register abilities with AbilityFactory
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            homeRunSmashAbility,
            appleThrowAbility,
            farmersCatchAbility,
            cottageRunAbility
        ]);
    } else {
        console.warn("Farmer Shoma abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback: assign to a global object
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.farmer_shoma_q = homeRunSmashAbility;
        window.definedAbilities.farmer_shoma_w = appleThrowAbility;
        window.definedAbilities.farmer_shoma_e = farmersCatchAbility;
        window.definedAbilities.farmer_shoma_r = cottageRunAbility;
    }
    
    // Set up turn listener for passive turn-based effects
    setupTurnBasedPassives();
});

// Setup function for all turn-based passive effects
function setupTurnBasedPassives() {
    // Wait for game manager to be available
    const checkGameManager = setInterval(() => {
        if (window.gameManager) {
            clearInterval(checkGameManager);
            
            // Log that the turn-based passive system has been initialized
            console.log("Turn-based passive system initialized");
            
            // Check if the endAITurn method exists - this is where turns increment
            if (window.gameManager.endAITurn) {
                // Store the original endAITurn method
                const originalEndAITurn = window.gameManager.endAITurn;
                
                // Override endAITurn to run our passive checks after turn increment
                window.gameManager.endAITurn = function() {
                    // Call the original method first to increment turn counter
                    originalEndAITurn.apply(this, arguments);
                    
                    // After the turn counter has been incremented, check for turn-based passives
                    const currentTurn = this.gameState.turn;
                    
                    // Get all characters in play
                    const allCharacters = [
                        ...this.gameState.playerCharacters,
                        ...this.gameState.aiCharacters
                    ];
                    
                    // Process turn-based passives for all characters
                    allCharacters.forEach(character => {
                        // Handle Farmer Shoma's passive
                        if (character.id === 'farmer_shoma' && 
                            character.checkPassiveCritBoost && 
                            typeof character.checkPassiveCritBoost === 'function') {
                            character.checkPassiveCritBoost(currentTurn);
                        }
                        
                        // Future turn-based passives can be added here with similar structure
                    });
                    
                    // Log the turn number for debugging
                    console.log(`[Turn Passives] Processed passives for turn ${currentTurn}`);
                };
            } else {
                console.warn("Could not find endAITurn method to hook turn-based passives");
            }
            
            // Also hook into character addition for mid-game character spawns
            if (window.gameManager.addCharacter && typeof window.gameManager.addCharacter === 'function') {
                const originalAddCharacter = window.gameManager.addCharacter;
                window.gameManager.addCharacter = function(character, isAI) {
                    // Call original method to add character
                    originalAddCharacter.apply(this, arguments);
                    
                    // Check if the added character has turn-based passives
                    if (character.id === 'farmer_shoma' && 
                        character.checkPassiveCritBoost && 
                        typeof character.checkPassiveCritBoost === 'function') {
                        // Initialize with current turn count
                        character.checkPassiveCritBoost(this.gameState.turn);
                    }
                    
                    // Future character passive initializations can be added here
                };
            }
            
            // Initialize passives for existing characters
            if (window.gameManager.gameState) {
                const existingCharacters = [
                    ...window.gameManager.gameState.playerCharacters,
                    ...window.gameManager.gameState.aiCharacters
                ];
                
                const currentTurn = window.gameManager.gameState.turn || 1;
                
                // Initialize passives for existing characters
                existingCharacters.forEach(character => {
                    if (character.id === 'farmer_shoma' && 
                        character.checkPassiveCritBoost && 
                        typeof character.checkPassiveCritBoost === 'function') {
                        character.checkPassiveCritBoost(currentTurn);
                    }
                    
                    // Future character passive initializations can be added here
                });
            }
        }
    }, 500);
}

// Add CSS for VFX
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Farmer Shoma Passive Indicator */
        .shoma-passive-indicator {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8e4506, #d78b0d);
            border-radius: 8px;
            width: auto;
            height: 30px;
            padding: 0 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #ffd700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.3);
            transition: transform 0.3s, box-shadow 0.3s;
            z-index: 5;
        }
        
        .shoma-passive-indicator::before {
            content: "⚔️";
            margin-right: 5px;
            font-size: 14px;
        }
        
        .shoma-passive-indicator.updated {
            transform: translateX(-50%) scale(1.2);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 12px rgba(255, 215, 0, 0.5);
            animation: pulsate 1s ease-in-out;
        }
        
        @keyframes pulsate {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.3); }
            100% { transform: translateX(-50%) scale(1.2); }
        }
        
        /* Home Run Animations */
        .home-run-animation {
            animation: shomaSwing 0.5s forwards;
        }
        
        @keyframes shomaSwing {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            75% { transform: rotate(30deg); }
            100% { transform: rotate(0deg); }
        }
        
        .bat-swing-vfx {
            position: absolute;
            width: 100%;
            height: 50px;
            background: linear-gradient(transparent, rgba(255, 255, 255, 0.5), transparent);
            transform: rotate(-30deg);
            animation: batSwing 0.5s forwards;
            z-index: 2;
        }
        
        @keyframes batSwing {
            0% { opacity: 0; transform: rotate(-30deg) translateY(0); }
            50% { opacity: 1; transform: rotate(0deg) translateY(-10px); }
            100% { opacity: 0; transform: rotate(30deg) translateY(0); }
        }
        
        .home-run-impact {
            animation: homeRunImpact 0.5s forwards;
        }
        
        @keyframes homeRunImpact {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px) translateY(-5px); }
            50% { transform: translateX(8px) translateY(5px); }
            75% { transform: translateX(-5px) translateY(-3px); }
            100% { transform: translateX(0); }
        }
        
        .home-run-impact-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 200, 0, 0.5) 0%, transparent 70%);
            animation: impactFade 0.6s forwards;
            z-index: 2;
        }
        
        @keyframes impactFade {
            0% { opacity: 0; transform: scale(0.5); }
            40% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* Apple Throw Animations */
        .apple-throw-animation {
            animation: appleThrow 0.6s forwards;
        }
        
        @keyframes appleThrow {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg) translateY(-5px); }
            50% { transform: rotate(5deg) translateY(0); }
            75% { transform: rotate(-5deg) translateY(-3px); }
            100% { transform: rotate(0deg); }
        }
        
        .apple-throw-vfx {
            position: absolute;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0.3) 70%);
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            animation: appleThrowPath 0.6s forwards;
            z-index: 3;
        }
        
        @keyframes appleThrowPath {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-20%, -80%) scale(1); opacity: 1; }
            80% { transform: translate(150%, -20%) scale(1); opacity: 1; }
            100% { transform: translate(200%, 50%) scale(0.8); opacity: 0; }
        }
        
        /* Apple Heal Effect */
        .apple-heal-effect {
            animation: appleHeal 0.8s forwards;
        }
        
        @keyframes appleHeal {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
            100% { filter: brightness(1); }
        }
        
        .apple-heal-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(0, 255, 0, 0.5) 0%, rgba(0, 255, 0, 0) 70%);
            animation: healGlow 0.8s forwards;
            z-index: 2;
        }
        
        @keyframes healGlow {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* Apple Impact Effect */
        .apple-impact {
            animation: appleImpact 0.5s forwards;
        }
        
        @keyframes appleImpact {
            0% { transform: scale(1); }
            25% { transform: scale(1.05) rotate(2deg); }
            50% { transform: scale(0.97) rotate(-1deg); }
            75% { transform: scale(1.02) rotate(1deg); }
            100% { transform: scale(1); }
        }
        
        .apple-impact-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 50, 0, 0.6) 0%, transparent 70%);
            animation: appleSplash 0.6s forwards;
            z-index: 2;
        }
        
        @keyframes appleSplash {
            0% { opacity: 0; transform: scale(0.5); }
            40% { opacity: 0.8; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1.3); }
        }
        
        /* Apple Splash Debuff Indicator */
        .apple-splash-indicator {
            position: absolute;
            top: -15px;
            right: 5px;
            font-size: 20px;
            animation: bobbing 2s infinite ease-in-out;
            filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.7));
            z-index: 5;
        }
        
        @keyframes bobbing {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
        }
        
        /* Nurturing Toss Stack Indicator */
        .status-container[data-effect-id="nurturing_toss_buff"],
        .status-effect-container[data-effect-id="nurturing_toss_buff"] {
            position: relative;
        }
        
        .nurturing-toss-stack-indicator {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #2d882d, #55aa55);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            box-shadow: 0 0 5px rgba(0, 128, 0, 0.7);
            font-weight: bold;
            z-index: 6;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .nurturing-toss-glow {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0, 255, 0, 0.4) 0%, rgba(0, 255, 0, 0) 70%);
            animation: nurturingGlow 2s infinite;
            z-index: 2;
            top: 0;
            left: 0;
            pointer-events: none;
        }
        
        @keyframes nurturingGlow {
            0% { opacity: 0.4; transform: scale(0.9); }
            50% { opacity: 0.8; transform: scale(1.2); }
            100% { opacity: 0.4; transform: scale(0.9); }
        }
        
        /* Passive Boost VFX */
        .shoma-passive-boost-vfx {
            position: absolute;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f5a623, #ff7e00);
            color: #fff;
            padding: 8px 15px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 18px;
            animation: passiveBoost 2s forwards;
            z-index: 10;
            box-shadow: 0 0 15px #ffcc00, inset 0 0 8px rgba(255, 255, 255, 0.5);
            border: 2px solid #fff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .shoma-passive-boost-vfx::before,
        .shoma-passive-boost-vfx::after {
            content: "⚔️";
            margin: 0 5px;
        }
        
        @keyframes passiveBoost {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
        
        /* Stun Effect Styling */
        .stunned {
            filter: grayscale(50%);
        }
        
        .stun-effect {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background-image: radial-gradient(circle, transparent 30%, yellow 30%, yellow 40%, transparent 40%);
            animation: spin 2s linear infinite;
            z-index: 5;
        }
        
        @keyframes spin {
            0% { transform: translateX(-50%) rotate(0deg); }
            100% { transform: translateX(-50%) rotate(360deg); }
        }

        /* Cottage Run Animations */
        .cottage-run-animation {
            animation: cottageRun 0.8s forwards;
        }

        @keyframes cottageRun {
            0% { transform: translateX(0); }
            15% { transform: translateX(-10px) scale(0.95); }
            40% { transform: translateX(80px) scale(1.05); filter: blur(2px); }
            65% { transform: translateX(10px) scale(0.98); filter: blur(1px); }
            100% { transform: translateX(0) scale(1); filter: blur(0); }
        }

        .cottage-run-vfx {
            position: absolute;
            width: 150%;
            height: 100%;
            left: -25%;
            top: 0;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
            animation: cottageRunDash 0.8s forwards;
            z-index: 2;
        }

        @keyframes cottageRunDash {
            0% { transform: translateX(-80px) skewX(-20deg); opacity: 0; }
            30% { transform: translateX(0) skewX(-10deg); opacity: 0.8; }
            70% { transform: translateX(80px) skewX(5deg); opacity: 0.6; }
            100% { transform: translateX(150px) skewX(0deg); opacity: 0; }
        }

        .dash-effect-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 3;
            pointer-events: none;
        }

        .dash-particle {
            position: absolute;
            background: #ddd;
            border-radius: 50%;
            opacity: 0.7;
            filter: blur(1px);
            animation: dashParticle 0.6s forwards;
        }

        @keyframes dashParticle {
            0% { transform: translateX(30px); opacity: 0.7; }
            100% { transform: translateX(-50px); opacity: 0; }
        }

        /* Cottage Run Heal Effect */
        .cottage-run-heal-effect {
            animation: cottageHeal 1s forwards;
        }

        @keyframes cottageHeal {
            0% { filter: brightness(1); }
            30% { filter: brightness(1.3) hue-rotate(60deg); }
            70% { filter: brightness(1.2) hue-rotate(30deg); }
            100% { filter: brightness(1); }
        }

        .cottage-run-heal-vfx {
            position: absolute;
            width: 130%;
            height: 130%;
            top: -15%;
            left: -15%;
            background: radial-gradient(circle, rgba(255, 220, 120, 0.6) 0%, transparent 70%);
            animation: cottageHealGlow 1.2s forwards;
            z-index: 2;
            border-radius: 50%;
        }

        @keyframes cottageHealGlow {
            0% { opacity: 0; transform: scale(0.8); }
            40% { opacity: 0.8; transform: scale(1.1); }
            80% { opacity: 0.5; transform: scale(1.3); }
            100% { opacity: 0; transform: scale(1.5); }
        }

        /* Perfect Dodge Effect Styles */
        .perfect-dodge-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            border-radius: inherit;
            background: radial-gradient(circle, rgba(255, 220, 120, 0.7) 0%, rgba(255, 195, 40, 0.4) 40%, transparent 70%);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.5);
            animation: perfectDodgeGlow 1.2s forwards;
            z-index: 2;
        }

        @keyframes perfectDodgeGlow {
            0% { opacity: 0; transform: scale(0.8); }
            40% { opacity: 0.8; transform: scale(1.15); }
            80% { opacity: 0.6; transform: scale(1.3); }
            100% { opacity: 0; transform: scale(1.5); }
        }

        .perfect-dodge-indicator {
            position: absolute;
            top: -15px;
            right: 50px;
            font-size: 24px;
            animation: cottageFloat 3s infinite ease-in-out;
            filter: drop-shadow(0 0 5px rgba(255, 220, 120, 0.8));
            z-index: 5;
        }

        @keyframes cottageFloat {
            0% { transform: translateY(0) rotate(0deg); }
            33% { transform: translateY(-7px) rotate(5deg); }
            66% { transform: translateY(-3px) rotate(-3deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
        
        /* Nurturing Toss Stack Indicator Animation */
        .stack-updated {
            animation: stackPulse 0.6s ease-in-out;
        }
        
        @keyframes stackPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.8); }
            100% { transform: scale(1); }
        }
        
        /* Effect fading animation */
        .effect-fading {
            animation: effectFade 0.5s forwards;
        }
        
        @keyframes effectFade {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.5); }
        }
        
        /* Override Nurturing Toss stack indicator for better visibility */
        .nurturing-toss-stack-indicator {
            position: absolute !important;
            top: -10px !important;
            right: -10px !important;
            width: 25px !important;
            height: 25px !important;
            font-size: 14px !important;
            background: linear-gradient(135deg, #1e6b1e, #3aaa3a) !important;
            box-shadow: 0 0 8px #3aaa3a, 0 0 12px rgba(0, 255, 0, 0.5) !important;
            border: 2px solid white !important;
            z-index: 9999 !important;
            font-weight: bold !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
            text-shadow: 0 1px 2px black !important;
        }
    `;
    document.head.appendChild(style);
});

// Modify Character.prototype.applyDamage to check for outgoingDamageModifier in effects
document.addEventListener('DOMContentLoaded', () => {
    // Only modify if not already modified
    if (!Character.prototype._hasOutgoingDamageModifier) {
        // Store the original applyDamage method
        const originalApplyDamage = Character.prototype.applyDamage;
        
        // Override the applyDamage method to handle outgoing damage modifiers
        Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
            let modifiedAmount = amount;
            
            // Check if this character has outgoingDamageModifier from debuffs
            // This is for when the character is attacking others (reduces their outgoing damage)
            if (this.isDamageSource) {
                // Check all debuffs on the attacker for outgoingDamageModifier
                for (const debuff of this.isDamageSource.debuffs) {
                    if (debuff.effects && typeof debuff.effects.outgoingDamageModifier === 'number') {
                        // Apply the modifier to reduce damage
                        modifiedAmount *= debuff.effects.outgoingDamageModifier;
                    }
                }
            }
            
            // Call the original method with the modified amount, caster, and options
            return originalApplyDamage.call(this, modifiedAmount, type, caster, options);
        };
        
        // Mark the prototype as modified to avoid double patching
        Character.prototype._hasOutgoingDamageModifier = true;
        
        console.log("Added outgoingDamageModifier support to Character.prototype.applyDamage");
    }
});

// Modify Character.prototype to handle dodge animations when a dodge occurs
document.addEventListener('DOMContentLoaded', () => {
    // Only modify if not already modified for dodge animations
    if (!Character.prototype._hasDodgeAnimation) {
        // Store the original dodge check method if it exists
        const originalCheckDodge = Character.prototype.checkDodge || function() {
            // Default implementation if none exists
            return Math.random() < (this.stats.dodgeChance || 0);
        };
        
        // Override the dodge check method
        Character.prototype.checkDodge = function() {
            // Use the original method to check if dodge occurs
            // The statModifiers are already applied to stats.dodgeChance
            const dodged = originalCheckDodge.call(this);
            
            // If dodged, apply dodge animation effects
            if (dodged) {
                // Find character element and add dodge animation
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`); // Use instanceId or id
                if (charElement) {
                    // --- Dodge VFX Container ---
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'vfx-container dodge-vfx-container';
                    charElement.appendChild(vfxContainer);

                    // Add dodge animation class to character element itself
                    charElement.classList.add('dodge-animation');

                    // Create afterimage effect inside container
                    const afterimage = document.createElement('div');
                    afterimage.className = 'dodge-afterimage';
                    vfxContainer.appendChild(afterimage);

                    // Play dodge sound
                    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSound('sounds/dodge_whoosh.mp3', 0.5); // Example sound

                    // Remove class and VFX container after animation
                    setTimeout(() => {
                        charElement.classList.remove('dodge-animation');
                        vfxContainer.remove();
                    }, 500); // Match animation duration
                    // --- End Dodge VFX Container ---
                }
            }
            
            return dodged;
        };
        
        // Mark the prototype as modified to avoid double patching
        Character.prototype._hasDodgeAnimation = true;
        
        console.log("Added dodge animation to Character.prototype.checkDodge");
    }
}); 

// Override the property setter for appliesHealingPowerBuff to update description
// This ensures the description updates when the talent is applied
Object.defineProperty(appleThrowAbility, 'appliesHealingPowerBuff', {
    get: function() {
        return this._appliesHealingPowerBuff || false;
    },
    set: function(value) {
        this._appliesHealingPowerBuff = value;
        // Regenerate description when this property changes
        if (value) {
            console.log('[Talent Applied] Nurturing Toss talent activated');
            this.generateDescription();
        }
    }
});

// Create mana particles for Cottage Run
function createManaParticles(container) {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'mana-particles';
    container.appendChild(particlesContainer);
    
    // Create multiple particles with random positions
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'mana-particle';
        
        // Random size
        const size = 4 + Math.random() * 8;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        const rx = Math.random() * 2 - 1;
        const ry = Math.random() * 2 - 1;
        particle.style.setProperty('--rx', rx);
        particle.style.setProperty('--ry', ry);
        
        // Random start position
        particle.style.left = `${30 + Math.random() * 40}%`;
        particle.style.top = `${30 + Math.random() * 40}%`;
        
        // Random delay
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        
        particlesContainer.appendChild(particle);
    }
    
    // Remove particles after animation
    setTimeout(() => {
        particlesContainer.remove();
    }, 2000);
}

// Patch Character's applyDamage to dispatch critical hit events
const originalCharacterApplyDamage = Character.prototype.applyDamage;
Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
    // Call the original method and store its result
    const result = originalCharacterApplyDamage.call(this, amount, type, caster, options);
    
    // If it was a critical hit and we have a caster, dispatch event
    if (result.isCritical && caster) {
        const critEvent = new CustomEvent('criticalHit', {
            detail: {
                source: caster,
                target: this,
                damage: result.damage,
                type: type
            },
            bubbles: true
        });
        document.dispatchEvent(critEvent);
    }
    
    // Return the original result
    return result;
};

// Add initialization function to ensure all abilities get their descriptions regenerated
function initializeFarmerShomaAbilities() {
    console.log("[FarmerShoma] Initializing ability descriptions");
    
    // Generate initial descriptions for all abilities
    homeRunSmashAbility.generateDescription();
    appleThrowAbility.generateDescription();
    farmersCatchAbility.generateDescription();
    cottageRunAbility.generateDescription();
    
    // Set up global event listener for talent applications
    document.addEventListener('abilityModified', function(event) {
        const abilityId = event.detail?.abilityId;
        if (!abilityId || !abilityId.startsWith('farmer_shoma')) return;
        
        console.log(`[Farmer Shoma] Ability modified: ${abilityId}, regenerating description`);
        
        // Find the right ability and regenerate its description
        switch (abilityId) {
            case 'farmer_shoma_q':
                homeRunSmashAbility.generateDescription();
                break;
            case 'farmer_shoma_w':
                appleThrowAbility.generateDescription();
                break;
            case 'farmer_shoma_e':
                farmersCatchAbility.generateDescription();
                break;
            case 'farmer_shoma_r':
                cottageRunAbility.generateDescription();
                break;
        }
        
        // If we have access to UI manager, update the character UI
        if (window.gameManager && window.gameManager.uiManager && event.detail.character) {
            window.gameManager.uiManager.updateCharacterUI(event.detail.character);
        }
    });
    
    console.log("[FarmerShoma] Ability initialization complete");
}

// Call the initialization function when the document is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFarmerShomaAbilities);
} else {
    // Document already loaded, call directly
    initializeFarmerShomaAbilities();
}

// Add debug function to manually regenerate all descriptions
window.debugRegenerateDescriptions = function(characterId) {
    if (!characterId || characterId === 'farmer_shoma') {
        console.log("[Debug] Regenerating Farmer Shoma ability descriptions");
        homeRunSmashAbility.generateDescription();
        appleThrowAbility.generateDescription();
        farmersCatchAbility.generateDescription();
        cottageRunAbility.generateDescription();
    }
};