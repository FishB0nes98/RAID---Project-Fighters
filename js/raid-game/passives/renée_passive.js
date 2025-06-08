/**
 * Renée Passive Handler - Wolf Spirit Aura
 * Creates an aura that grants -1 cooldown on a random ability for Renée and allies at game start
 */
class ReneePassive {
    constructor() {
        this.character = null;
        this.eventListeners = [];
        this.id = 'renee_passive';
        this.name = 'Wolf Spirit Aura';
        this.description = 'Renée channels a mystical wolf spirit, creating an aura around her that grants her and allies -1 cooldown on a random ability on game start.';
        
        console.log('[ReneePassive CONSTRUCTOR] Initialized');

        // Bind methods to ensure proper 'this' context
        this.initialize = this.initialize.bind(this);
        this.onGameStart = this.onGameStart.bind(this);
        this.applyCooldownReduction = this.applyCooldownReduction.bind(this);
        this.updateDescription = this.updateDescription.bind(this);
        this.destroy = this.destroy.bind(this);
        this.onDamageTaken = this.onDamageTaken.bind(this);
        this.processLunarResonance = this.processLunarResonance.bind(this);
        this.processLunarCascade = this.processLunarCascade.bind(this);
        
        // Store references to bound methods for cleanup
        this._boundOnGameStart = this.onGameStart.bind(this);
        
        // Initialize flags
        this.initialized = false;
        this.alreadyApplied = false;
        this.loneWolfApplied = false;
        this.dualSpiritAwakened = false;
        this.corneredPredatorActive = false;
        this.processingMoonlitReflexes = false;
        this.mysticalConvergenceProcessed = false;
        
        // Global reference for debugging
        window.reneePassiveInstance = this;

        this.cooldownReduction = 1; // Default cooldown reduction amount
        this.cooldownReductionTarget = null; // Track which ability gets cooldown reduction
        this.secondCooldownReductionTarget = null; // Second ability for dual spirit
        this.loneWolfActive = false;
        
        // Opportunistic Spirit talent procs
        this.resetCooldownChance = 0.05; // 5% chance for ability cooldown reset
        this.noTurnEndChance = 0.05; // 5% chance not to end turn
        
        // Lunar Resonance talent proc
        this.lunarResonanceChance = 0.10; // 10% chance to reduce cooldown
        
        // Lunar Cascade talent proc
        this.lunarCascadeChance = 0.15; // 15% chance to cast another ability
    }

    initialize(character) {
        if (!character) return;
        
        this.character = character;
        
        // Initialize properties for Opportunistic Spirit talent
        this.resetCooldownChance = 0.05; // 5% chance to reset cooldown
        this.noTurnEndChance = 0.05; // 5% chance to not end turn
        
        // Property for Dual Spirit Awakening is set directly on character
        
        // Initialize property for Cornered Predator talent
        this.corneredPredatorActive = false;
        
        // Initialize property for Moonlit Reflexes talent
        this.character.enableMoonlitReflexes = this.character.enableMoonlitReflexes || false;
        
        // Initialize property for Lunar Resonance talent
        this.character.enableLunarResonance = this.character.enableLunarResonance || false;
        
        // Initialize property for Lunar Empowerment talent
        this.character.enableLunarEmpowerment = this.character.enableLunarEmpowerment || false;
        
        // Capture reference to bound listener methods for proper removal later
        this.boundGameStartListener = this.onGameStart.bind(this);
        const abilityUsedListener = this.onAbilityUsed.bind(this);
        this.boundAbilityUsedListener = abilityUsedListener;
        this.boundDamageTakenListener = this.onDamageTaken.bind(this);
        this.boundBuffAppliedListener = this.onBuffApplied.bind(this);
        
        // Register event listeners
        document.addEventListener('GameStart', this.boundGameStartListener);
        document.addEventListener('AbilityUsed', this.boundAbilityUsedListener);
        document.addEventListener('damageDealt', this.boundDamageTakenListener);
        document.addEventListener('BuffApplied', this.boundBuffAppliedListener);
        
        // Listen for talent application events
        this.talentListener = (event) => {
            const { talentId, character: talentCharacter } = event.detail || {};
            if (!talentCharacter || talentCharacter.id !== character.id) return;
            
            // Handle specific talents
            if (talentId === 'primal_healing') {
                this.initializePrimalHealing(character);
            }
        };
        document.addEventListener('TalentApplied', this.talentListener);
        
        // Update passive description
        this.updateDescription();
        
        console.log(`[ReneePassive] Initialized for ${character.name}. Opportunistic Spirit: ${character.enableOpportunisticSpirit}, Dual Spirit: ${character.dualSpiritAwakening}, Cornered Predator: ${character.enableCorneredPredator}, Moonlit Reflexes: ${character.enableMoonlitReflexes}, Lunar Resonance: ${character.enableLunarResonance}, Lunar Empowerment: ${character.enableLunarEmpowerment}`);
    }

    updateDescription() {
        if (!this.character || !this.character.passive) return;
        
        // Start with base description
        let baseDesc = "Wolf Spirit: Your abilities reduce cooldowns when used.";
        
        // Add dual spirit description if talent is enabled
        if (this.character.dualSpiritAwakening) {
            baseDesc += " (Talent: Two Wolf Spirits active)";
        }
        
        // Add description parts for talents
        const talentParts = [];
        
        // Mystical Convergence talent - check if Mystical Whip is magical damage type
        const whipAbility = this.character.abilities ? this.character.abilities.find(ability => ability.id === 'renee_e') : null;
        if (whipAbility && whipAbility.damageType === 'magical') {
            talentParts.push("Gain +100 Physical Damage and Mystical Whip deals magical damage instead of physical");
        }
        
        // Opportunistic Spirit talent
        if (this.character.enableOpportunisticSpirit) {
            talentParts.push("5% chance for abilities to not end turn and 5% chance to reset their cooldown");
        }
        
        // Cornered Predator talent
        if (this.character.enableCorneredPredator) {
            talentParts.push("Gain 25% Critical Chance when below 50% HP");
        }
        
        // Moonlit Reflexes talent
        if (this.character.enableMoonlitReflexes) {
            talentParts.push("Using an ability grants 10% dodge chance for 5 turns, stacking up to 3 times (max 30% dodge)");
        }
        
        // Lunar Resonance talent
        if (this.character.enableLunarResonance) {
            talentParts.push("10% chance when casting an ability to reduce a random ability on cooldown by 1 turn");
        }
        
        // Lunar Cascade talent
        if (this.character.abilities && this.character.abilities.some(ability => ability.id === 'renee_r' && ability.enableLunarCascade)) {
            talentParts.push("Lunar Curse has a 15% chance to cast Wolf Claw Strike or Mystical Whip on a random enemy");
        }
        
        // Lunar Empowerment talent
        if (this.character.enableLunarEmpowerment) {
            talentParts.push("Lunar Curse grants +15% Critical Chance and +25% Critical Damage");
        }
        
        // Lone Wolf talent
        if (this.character.enableLoneWolfTalent) {
            talentParts.push("Gain 3000 HP and 3% Armor & Magic Shield when alone");
        }
        
        // Combine all parts
        let fullDescription = baseDesc;
        
        if (talentParts.length > 0) {
            fullDescription += "\n\nTalents:";
            talentParts.forEach(part => {
                fullDescription += `\n• ${part}`;
            });
        }
        
        // Update the passive description
        this.character.passive.description = fullDescription;
        
        console.log(`[ReneePassive] Updated description for ${this.character.name}`);
    }

    onGameStart(event) {
        console.log('[ReneePassive] Game start detected.');
        
        // Prevent multiple applications of the entire onGameStart logic for this character instance
        if (this.alreadyApplied) {
            console.log('[ReneePassive] onGameStart already run for this instance, skipping.');
            return;
        }
        
        const gameManager = window.gameManager;
        if (!gameManager) {
            console.error('[ReneePassive] Game manager not found');
            return;
        }
        
        const allies = gameManager.getAllies(this.character);
        if (!allies.includes(this.character)) {
            allies.push(this.character);
        }
        
        // Lone Wolf Talent
        if (this.character.enableLoneWolfTalent && allies.length === 1 && !this.loneWolfApplied) {
            console.log('[ReneePassive] Lone Wolf talent applying.');
            this.character.applyStatModification('maxHp', 'add', 3000); // Changed from maxHealth for consistency with Character.js
            this.character.applyStatModification('currentHp', 'add', 3000); // Changed from currentHealth
            this.character.applyStatModification('armor', 'add', 0.03); // Assuming this means +3% to a 0-1 scale, or +3 if it's points
            this.character.applyStatModification('magicalShield', 'add', 0.03);
            setTimeout(() => { this.showLoneWolfVFX(); }, 500);
            this.loneWolfApplied = true;
            if (gameManager.addLogEntry) {
                gameManager.addLogEntry(`${this.character.name}'s Lone Wolf activates! +3000 HP and +3% defenses.`, 'talent-effect renee');
            }
        }
        
        // Mystical Convergence Talent (VFX and Logging only; stats are handled by talent system)
        const whipAbility = this.character.abilities.find(ability => ability.id === 'renee_e');
        if (whipAbility && whipAbility.damageType === 'magical' && !this.mysticalConvergenceProcessed) {
            console.log('[ReneePassive] Mystical Convergence talent active. Playing VFX and logging.');
            if (gameManager.addLogEntry) {
                gameManager.addLogEntry(`${this.character.name}'s Mystical Convergence is active! (+100 Physical Damage, Whip is Magical)`, 'talent-effect renee');
            }
            setTimeout(() => { this.showMysticalConvergenceVFX(); }, 700);
            if (whipAbility.generateDescription) {
                whipAbility.generateDescription(); // Ensure description updates with talent info
            }
            this.mysticalConvergenceProcessed = true;
        }
        
        // Wolf Spirit Cooldown Reductions
        if (!this.dualSpiritAwakened) { // Check if not already awakened to prevent multiple applications from multiple calls
            this.applyCooldownReduction(this.character);
            if (this.character.dualSpiritAwakening) {
                console.log('[ReneePassive] Dual Spirit Awakening applying second cooldown reduction.');
                this.applyCooldownReduction(this.character, true);
                this.dualSpiritAwakened = true; // Mark that dual spirit has been processed
            }
        }
        
        // Show Predator's Vitality VFX if the character received the HP bonus
        if (this.character.hasTalent && this.character.hasTalent("predators_vitality")) {
            this.showPredatorsVitalityVFX(this.character);
            gameManager.addLogEntry(`${this.character.name}'s Predator's Vitality increases maximum health by 2500!`, "talent-effect renee");
        }
        
        this.alreadyApplied = true; // Mark that onGameStart has run for this instance
        console.log('[ReneePassive] onGameStart processing finished.');
    }

    applyCooldownReduction(character, isSecondApplication = false) {
        if (!character || !character.abilities || !character.abilities.length) {
            console.error('[ReneePassive] Invalid character or no abilities for cooldown reduction');
            return;
        }
        
        // Filter abilities that have a cooldown greater than 0
        const eligibleAbilities = character.abilities.filter(ability => 
            ability.cooldown > 0 && ability.currentCooldown === 0
        );
        
        if (eligibleAbilities.length === 0) {
            console.log(`[ReneePassive] ${character.name} has no eligible abilities for cooldown reduction`);
            return;
        }
        
        // Select a random ability
        const randomIndex = Math.floor(Math.random() * eligibleAbilities.length);
        const selectedAbility = eligibleAbilities[randomIndex];
        
        // Apply cooldown reduction buff
        const wolfSpiritBuff = {
            id: `renee_wolf_spirit_${character.id}_${Date.now()}${isSecondApplication ? '_second' : ''}`,
            name: 'Wolf Spirit',
            icon: 'Icons/abilities/wolf_spirit.png',
            description: `The ability ${selectedAbility.name} starts with -1 cooldown from Renée's Wolf Spirit Aura.${isSecondApplication ? ' (Second spirit from Dual Spirit Awakening)' : ''}`,
            duration: -1, // Permanent
            effect: {
                type: 'cooldown_reduction',
                value: 1,
                abilityId: selectedAbility.id
            }
        };
        
        character.addBuff(wolfSpiritBuff);
        
        // Apply immediate effect (reduce starting cooldown of the ability)
        if (selectedAbility.cooldown > 0) {
            // Reduce the base cooldown by 1 (minimum of 1)
            const newCooldown = Math.max(1, selectedAbility.cooldown - 1);
            selectedAbility.cooldown = newCooldown;
            
            // Update the ability description if it contains cooldown information
            if (selectedAbility.description && selectedAbility.description.includes('Cooldown:')) {
                selectedAbility.description = selectedAbility.description.replace(
                    /Cooldown: \d+/,
                    `Cooldown: ${newCooldown}`
                );
            }
            
            console.log(`[ReneePassive] Applied cooldown reduction to ${character.name}'s ${selectedAbility.name}, new cooldown: ${newCooldown}${isSecondApplication ? ' (second spirit)' : ''}`);
            
            // Highlight the ability (no VFX, just UI highlight)
            this.highlightAbility(character, selectedAbility);
            
            // Log the effect
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`Renée's ${isSecondApplication ? 'Second ' : ''}Wolf Spirit Aura reduces ${character.name}'s ${selectedAbility.name} cooldown by 1 turn.`, 'renee');
            }
        }
    }

    // Update to a simpler UI highlight instead of VFX
    highlightAbility(character, ability) {
        // Get character DOM element, try instanceId first, then id
        const elementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${elementId}`);
        if (!characterElement) {
            console.error(`Cannot find DOM element for character with resolved ID: ${elementId}`);
            return;
        }
        
        // Find the ability element to highlight
        const abilityElement = characterElement.querySelector(`.ability[data-ability-id="${ability.id}"]`);
        if (abilityElement) {
            // Add highlighting class
            abilityElement.classList.add('wolf-spirit-enhanced');
            
            // Create cooldown reduction indicator
            const reductionIndicator = document.createElement('div');
            reductionIndicator.className = 'cooldown-reduction-indicator';
            reductionIndicator.textContent = '-1';
            abilityElement.appendChild(reductionIndicator);
            
            // Remove indicator and highlighting after animation
            setTimeout(() => {
                if (abilityElement.contains(reductionIndicator)) {
                    abilityElement.removeChild(reductionIndicator);
                }
                abilityElement.classList.remove('wolf-spirit-enhanced');
            }, 3000);
        }
    }

    showLoneWolfVFX() {
        if (!this.character) return;

        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;

        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'lone-wolf-vfx';
        charElement.appendChild(vfxContainer);

        // Add floating text
        if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
            window.gameManager.showFloatingText(`character-${elementId}`, 'Lone Wolf Active!', 'buff');
        }

        // Remove VFX after animation
        setTimeout(() => {
            if (vfxContainer.parentNode === charElement) {
                charElement.removeChild(vfxContainer);
            }
        }, 2000);
    }

    // Add a method to show Mystical Convergence VFX (if not already present from previous step)
    showMysticalConvergenceVFX() {
        if (!this.character) return;

        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;

        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'mystical-convergence-vfx';
        charElement.appendChild(vfxContainer);

        // Create magical energy effect
        const energyEffect = document.createElement('div');
        energyEffect.className = 'magical-energy-effect';
        vfxContainer.appendChild(energyEffect);

        // Create magical particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'magical-particle';
            energyEffect.appendChild(particle);
        }

        // Add floating text
        if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
            window.gameManager.showFloatingText(`character-${elementId}`, '+100 Physical Damage', 'buff');
            setTimeout(() => {
                window.gameManager.showFloatingText(`character-${elementId}`, 'Mystical Convergence!', 'talent-effect');
            }, 400);
        }

        // Remove VFX after animation
        setTimeout(() => {
            if (vfxContainer.parentNode === charElement) {
                charElement.removeChild(vfxContainer);
            }
        }, 3000);
    }

    showPredatorsVitalityVFX(character) {
        // Create the main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'predators-vitality-vfx';
        
        // Add the glow effect
        const glow = document.createElement('div');
        glow.className = 'vitality-glow';
        vfxContainer.appendChild(glow);
        
        // Add the hearts container
        const heartsContainer = document.createElement('div');
        heartsContainer.className = 'vitality-hearts';
        
        // Add individual hearts
        for (let i = 0; i < 6; i++) {
            const heart = document.createElement('div');
            heart.className = 'vitality-heart';
            heartsContainer.appendChild(heart);
        }
        
        vfxContainer.appendChild(heartsContainer);
        
        // Add the VFX to the character's element
        const characterElement = document.getElementById(`character-${character.id}`);
        if (characterElement) {
            characterElement.appendChild(vfxContainer);
            
            // Remove the VFX after animation completes
            setTimeout(() => {
                if (vfxContainer && vfxContainer.parentNode) {
                    vfxContainer.parentNode.removeChild(vfxContainer);
                }
            }, 2500);
        }
    }

    // New method to handle Opportunistic Spirit talent
    onAbilityUsed(event) {
        // Only process if the caster is our character
        if (!event.detail || !event.detail.caster || 
            event.detail.caster.id !== this.character.id) {
            return;
        }
        
        const caster = event.detail.caster;
        const ability = event.detail.ability;
        const gameManager = window.gameManager;
        
        // Check for Opportunistic Spirit talent
        if (this.character.enableOpportunisticSpirit) {
            // Process reset cooldown chance
            if (Math.random() < this.resetCooldownChance) {
                ability.currentCooldown = 0;
                this.showResetCooldownVFX(caster, ability);
                const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
                log(`${caster.name}'s Opportunistic Spirit resets ${ability.name}'s cooldown!`, 'renee');
                if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);
            }
            
            // Process no turn end chance
            if (Math.random() < this.noTurnEndChance) {
                if (gameManager) {
                    gameManager.setPreventTurnEnd(true);
                    this.showNoTurnEndVFX(caster);
                    const log = gameManager.addLogEntry.bind(gameManager);
                    log(`${caster.name}'s Opportunistic Spirit grants another action!`, 'renee');
                }
            }
        }
        
        // Veil of the Moon talent: Lupine Veil reduces all cooldowns by 2
        if (ability.id === 'renee_w' && this.character.enableVeilOfTheMoon) {
            let reducedAny = false;
            caster.abilities.forEach(ab => {
                if (ab.currentCooldown > 0) {
                    const oldCd = ab.currentCooldown;
                    ab.currentCooldown = Math.max(0, ab.currentCooldown - 2);
                    reducedAny = true;
                    // VFX for each ability
                    this.showResetCooldownVFX(caster, ab);
                    if (gameManager && gameManager.addLogEntry) {
                        gameManager.addLogEntry(`${caster.name}'s Veil of the Moon reduces ${ab.name}'s cooldown by 2! (${oldCd} → ${ab.currentCooldown})`, 'talent-effect renee');
                    }
                }
            });
            if (reducedAny && typeof updateCharacterUI === 'function') updateCharacterUI(caster);
        }
        
        // Check for Moonlit Reflexes talent
        if (this.character.enableMoonlitReflexes && !this.processingMoonlitReflexes) {
            this.processingMoonlitReflexes = true;
            this.applyMoonlitReflexesBuff(caster);
            // Reset the flag shortly after, allowing it to be processed for the next distinct ability use
            setTimeout(() => { this.processingMoonlitReflexes = false; }, 0);
        }
        
        // Check for Lunar Resonance talent (reduce random ability cooldown)
        if (this.character.enableLunarResonance) {
            this.processLunarResonance(caster, ability);
        }
        
        // Check for Lunar Cascade talent (chance to cast another ability from Lunar Curse)
        if (ability.id === 'renee_r' && ability.enableLunarCascade) {
            this.processLunarCascade(caster);
        }
    }
    
    // VFX for cooldown reset
    showResetCooldownVFX(character, ability) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Find the ability element
        const abilities = characterElement.querySelectorAll('.ability');
        let abilityElement = null;
        
        for (let i = 0; i < abilities.length; i++) {
            if (abilities[i].dataset.abilityId === ability.id) {
                abilityElement = abilities[i];
                break;
            }
        }
        
        if (!abilityElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'renee-cooldown-reset-vfx';
        abilityElement.appendChild(vfxContainer);
        
        // Add reset animation elements
        const sparkles = document.createElement('div');
        sparkles.className = 'reset-sparkles';
        vfxContainer.appendChild(sparkles);
        
        // Create multiple sparkle elements
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'reset-sparkle';
            sparkles.appendChild(sparkle);
        }
        
        // Text indicator
        const resetText = document.createElement('div');
        resetText.className = 'reset-text';
        resetText.textContent = 'RESET!';
        vfxContainer.appendChild(resetText);
        
        // Add class to ability for glow effect
        abilityElement.classList.add('cooldown-reset');
        
        // Play sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/ability_reset.mp3', 0.7);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.remove();
            abilityElement.classList.remove('cooldown-reset');
        }, 2000);
    }
    
    // VFX for no turn end proc
    showNoTurnEndVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'renee-extra-turn-vfx';
        characterElement.appendChild(vfxContainer);
        
        // Add energy burst effect
        const energyBurst = document.createElement('div');
        energyBurst.className = 'energy-burst';
        vfxContainer.appendChild(energyBurst);
        
        // Text indicator
        const extraTurnText = document.createElement('div');
        extraTurnText.className = 'extra-turn-text';
        extraTurnText.textContent = 'EXTRA TURN!';
        vfxContainer.appendChild(extraTurnText);
        
        // Play sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/extra_turn.mp3', 0.7);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.remove();
        }, 2500);
    }

    // New method to handle the Cornered Predator talent
    onDamageTaken(event) {
        // Get the character from the passive instance
        const character = this.character;
        if (!character) return;

        // Get damage details from the event
        const isCritical = event.detail?.isCritical || event.detail?.critical || false;
        const amount = event.detail?.amount || event.detail?.damage || 0;
        const source = event.detail?.source || event.detail?.caster || null;

        // Handle Bloodthirsty Resilience talent
        if (isCritical && character.appliedTalents && character.appliedTalents.includes('bloodthirsty_resilience')) {
            this.applyBloodthirstyResilienceBuff(character);
        }

        // Handle Cornered Predator talent
        if (character.appliedTalents && character.appliedTalents.includes('cornered_predator')) {
            this.checkCorneredPredatorActivation();
        }
    }
    
    // Helper method to check HP percentage and apply/remove crit buff
    checkCorneredPredatorActivation() {
        if (!this.character || !this.character.enableCorneredPredator) return;
        
        // Calculate HP percentage
        const currentHp = this.character.stats.currentHp;
        const maxHp = this.character.stats.maxHp;
        const hpPercentage = currentHp / maxHp;
        
        // Log HP status
        console.log(`[CorneredPredator] ${this.character.name} HP: ${currentHp}/${maxHp} (${hpPercentage * 100}%)`);
        
        // Check if below threshold (50%)
        if (hpPercentage <= 0.5 && !this.corneredPredatorActive) {
            // Apply the buff
            this.applyCorneredPredatorBuff();
        } else if (hpPercentage > 0.5 && this.corneredPredatorActive) {
            // Remove the buff
            this.removeCorneredPredatorBuff();
        }
    }
    
    // Apply the crit chance buff
    applyCorneredPredatorBuff() {
        if (!this.character || this.corneredPredatorActive) return;
        
        // Create buff for the critical chance bonus
        const critBuff = {
            id: 'cornered_predator_buff',
            name: 'Cornered Predator',
            icon: 'Icons/talents/predator_focus.webp',
            description: 'Below 50% HP: +25% Critical Chance.',
            duration: -1, // Permanent until HP > 50%
            statModifiers: [{ stat: 'critChance', value: 0.25, operation: 'add' }]
        };
        
        // Apply buff to character
        this.character.addBuff(critBuff);
        this.corneredPredatorActive = true;
        
        // Log the effect
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${this.character.name}'s Cornered Predator activates! (+25% Critical Chance)`, 'talent-effect renee');
        
        // Show floating text
        if (window.gameManager?.showFloatingText) {
            const elementId = this.character.instanceId || this.character.id;
            window.gameManager.showFloatingText(`character-${elementId}`, '+25% Crit Chance', 'buff');
        }
        
        // Play sound if available
        if (window.gameManager?.playSound) {
            window.gameManager.playSound('sounds/wolf_growl.mp3', 0.6);
        }
    }
    
    // Remove the crit chance buff
    removeCorneredPredatorBuff() {
        if (!this.character || !this.corneredPredatorActive) return;
        
        // Remove the buff
        this.character.removeBuff('cornered_predator_buff');
        this.corneredPredatorActive = false;
        
        // Log the effect
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${this.character.name}'s Cornered Predator deactivates as health rises above 50%.`, 'renee');
    }

    // Apply the Moonlit Reflexes dodge buff
    applyMoonlitReflexesBuff(character) {
        if (!character) return;
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

        let existingBuff = character.buffs.find(buff => buff.id === 'moonlit_reflexes_buff');

        if (existingBuff) {
            // If buff exists, increment stacks up to max
            if (existingBuff.currentStacks < existingBuff.maxStacks) {
                existingBuff.currentStacks++;
                log(`${character.name}'s Moonlit Reflexes stacks increased! (${existingBuff.currentStacks}/${existingBuff.maxStacks} stacks)`, 'renee');
            } else {
                log(`${character.name}'s Moonlit Reflexes already at max stacks (${existingBuff.maxStacks}). Refreshing duration.`, 'renee');
            }
            // Always refresh duration
            existingBuff.duration = 5;
            
            // Update the character stats for the new stack count or refreshed duration
            character.recalculateStats('moonlit_reflexes_stack_update');
            
            // Show VFX for stack increase/refresh
            this.showMoonlitReflexesVFX(character, existingBuff.currentStacks);
            
        } else {
            // Create NEW buff instance for the dodge chance
            const dodgeBuff = {
                id: 'moonlit_reflexes_buff',
                name: 'Moonlit Reflexes',
                icon: 'Icons/talents/moonlit_reflexes.webp',
                description: 'Enhanced reflexes grant 10% dodge chance per stack.',
                duration: 5, // 5 turns as specified
                stackable: true, // Make it stackable
                maxStacks: 3, // Maximum of 3 stacks
                currentStacks: 1, // Start with 1 stack
                statModifiers: [{ 
                    stat: 'dodgeChance', 
                    value: 0.10, 
                    operation: 'add',
                    // The perStack logic should be handled by recalculateStats based on currentStacks
                }],
                onApply: (target) => {
                    // This onApply is for the initial application of the buff object by Character.addBuff
                    // It does not need to handle stacking logic itself here.
                    console.log(`[Moonlit Reflexes] Initial application to ${target.name}: +10% dodge chance (1 stack)`);
                    return true;
                },
                onRemove: (target) => {
                    console.log(`[Moonlit Reflexes] Removed from ${target.name}`);
                    // Character.recalculateStats will be called by Character.removeBuff
                    return true;
                }
            };
            
            // Apply the new buff to the character
            // Character.addBuff will handle the initial stat application via its own recalculateStats call
            character.addBuff(dodgeBuff);
            
            // Show VFX for the first stack
            this.showMoonlitReflexesVFX(character, 1);
            
            log(`${character.name}'s Moonlit Reflexes activate, granting 10% dodge chance (1 stack) for 5 turns!`, 'renee');
        }
    }
    
    // VFX for Moonlit Reflexes activation - modified to show stack count
    showMoonlitReflexesVFX(character, stackCount) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'moonlit-reflexes-vfx';
        characterElement.appendChild(vfxContainer);
        
        // Add moon glow effect
        const moonGlow = document.createElement('div');
        moonGlow.className = 'moon-glow';
        vfxContainer.appendChild(moonGlow);
        
        // Add dodge silhouette effect
        const dodgeSilhouette = document.createElement('div');
        dodgeSilhouette.className = 'dodge-silhouette';
        vfxContainer.appendChild(dodgeSilhouette);
        
        // Add sparkle effects
        const sparkles = document.createElement('div');
        sparkles.className = 'reflexes-sparkles';
        vfxContainer.appendChild(sparkles);
        
        // Create multiple sparkle elements
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'reflexes-sparkle';
            sparkles.appendChild(sparkle);
        }
        
        // Add stack counter
        const stackCounter = document.createElement('div');
        stackCounter.className = 'reflexes-stack-counter';
        stackCounter.textContent = `+${stackCount}`;
        vfxContainer.appendChild(stackCounter);
        
        // Play sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/dodge_buff.mp3', 0.7);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.remove();
        }, 2000);
    }

    // Process Lunar Resonance talent (10% chance to reduce a random ability cooldown by 1)
    processLunarResonance(caster, triggeredAbility) {
        const gameManager = window.gameManager;
        
        // Check if we should trigger the effect (10% chance)
        if (Math.random() >= this.lunarResonanceChance) {
            return;
        }
        
        // Find abilities that are currently on cooldown
        const abilitiesOnCooldown = caster.abilities.filter(ability => 
            ability.currentCooldown > 0 && ability.id !== triggeredAbility.id
        );
        
        if (abilitiesOnCooldown.length === 0) {
            console.log(`[LunarResonance] No abilities on cooldown for ${caster.name}`);
            return;
        }
        
        // Select a random ability on cooldown
        const randomIndex = Math.floor(Math.random() * abilitiesOnCooldown.length);
        const selectedAbility = abilitiesOnCooldown[randomIndex];
        
        // Reduce cooldown by 1 (minimum 0)
        const oldCooldown = selectedAbility.currentCooldown;
        selectedAbility.currentCooldown = Math.max(0, selectedAbility.currentCooldown - 1);
        
        console.log(`[LunarResonance] Reduced ${selectedAbility.name}'s cooldown from ${oldCooldown} to ${selectedAbility.currentCooldown}`);
        
        // Show VFX for the cooldown reduction
        this.showLunarResonanceVFX(caster, selectedAbility);
        
        // Log the effect
        if (gameManager && gameManager.addLogEntry) {
            gameManager.addLogEntry(`${caster.name}'s Lunar Resonance reduces ${selectedAbility.name}'s cooldown by 1 turn!`, 'talent-effect renee');
        }
        
        // Update UI
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(caster);
        }
    }
    
    // Process Lunar Cascade talent (15% chance for Lunar Curse to cast another ability)
    processLunarCascade(caster) {
        const gameManager = window.gameManager;
        
        // Check if we should trigger the effect (15% chance)
        if (Math.random() >= this.lunarCascadeChance) {
            return;
        }
        
        // Get all enemy targets
        if (!gameManager) {
            console.error('[LunarCascade] Game manager not found');
            return;
        }
        
        const enemies = gameManager.getOpponents(caster);
        if (!enemies || enemies.length === 0) {
            console.log('[LunarCascade] No enemies found for Lunar Cascade');
            return;
        }
        
        // Select a random enemy
        const randomEnemyIndex = Math.floor(Math.random() * enemies.length);
        const target = enemies[randomEnemyIndex];
        
        // Choose which ability to cast (50/50 chance for Q or E)
        const abilityToUse = Math.random() < 0.5 ? 
            caster.abilities.find(ability => ability.id === 'renee_q') : // Wolf Claw Strike 
            caster.abilities.find(ability => ability.id === 'renee_e');  // Mystical Whip
        
        if (!abilityToUse) {
            console.error('[LunarCascade] Could not find ability to cascade');
            return;
        }
        
        // Log the effect
        if (gameManager.addLogEntry) {
            gameManager.addLogEntry(`${caster.name}'s Lunar Cascade triggers ${abilityToUse.name} on ${target.name}!`, 'talent-effect renee');
        }
        
        // Show a special VFX for the cascade effect
        this.showLunarCascadeVFX(caster, target);
        
        // Play a sound effect
        if (gameManager.playSound) {
            gameManager.playSound('sounds/cascade_trigger.mp3', 0.6);
        }
        
        // Execute the ability effect
        setTimeout(() => {
            // We need to manually execute the ability effect
            if (abilityToUse.id === 'renee_q') {
                window.executeWolfClawStrike(caster, target, abilityToUse);
            } else if (abilityToUse.id === 'renee_e') {
                window.executeMysticalWhip(caster, target, abilityToUse);
            }
        }, 500); // Slight delay to allow VFX to start
    }
    
    // VFX for Lunar Resonance cooldown reduction
    showLunarResonanceVFX(character, ability) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Find the ability element
        const abilities = characterElement.querySelectorAll('.ability');
        let abilityElement = null;
        
        for (let i = 0; i < abilities.length; i++) {
            if (abilities[i].dataset.abilityId === ability.id) {
                abilityElement = abilities[i];
                break;
            }
        }
        
        if (!abilityElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'lunar-resonance-vfx';
        abilityElement.appendChild(vfxContainer);
        
        // Add sparkle elements
        const sparkles = document.createElement('div');
        sparkles.className = 'resonance-sparkles';
        vfxContainer.appendChild(sparkles);
        
        // Create multiple sparkle elements
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'resonance-sparkle';
            sparkles.appendChild(sparkle);
        }
        
        // Text indicator
        const cooldownText = document.createElement('div');
        cooldownText.className = 'resonance-text';
        cooldownText.textContent = '-1';
        vfxContainer.appendChild(cooldownText);
        
        // Add class to ability for glow effect
        abilityElement.classList.add('lunar-resonance-glow');
        
        // Play sound effect if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/cooldown_reduce.mp3', 0.6);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.remove();
            abilityElement.classList.remove('lunar-resonance-glow');
        }, 2000);
    }
    
    // VFX for Lunar Cascade ability trigger
    showLunarCascadeVFX(caster, target) {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!casterElement || !targetElement) return;
        
        // Create the main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'lunar-cascade-vfx';
        document.body.appendChild(vfxContainer);
        
        // Get the positions of the caster and target for the trajectory
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // Create moon projectile
        const moonProjectile = document.createElement('div');
        moonProjectile.className = 'cascade-moon-projectile';
        vfxContainer.appendChild(moonProjectile);
        
        // Position the projectile at the caster
        moonProjectile.style.left = `${startX}px`;
        moonProjectile.style.top = `${startY}px`;
        
        // Create trail effect
        const moonTrail = document.createElement('div');
        moonTrail.className = 'cascade-moon-trail';
        vfxContainer.appendChild(moonTrail);
        
        // Animate the projectile
        const duration = 1000; // 1 second
        const startTime = performance.now();
        
        function animateProjectile(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use ease-in-out for a smooth trajectory
            const easedProgress = progress < 0.5 ? 
                2 * progress * progress : 
                1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentX = startX + (endX - startX) * easedProgress;
            const currentY = startY + (endY - startY) * easedProgress;
            
            // Update projectile position
            moonProjectile.style.left = `${currentX}px`;
            moonProjectile.style.top = `${currentY}px`;
            
            // Update trail
            moonTrail.style.left = `${startX}px`;
            moonTrail.style.top = `${startY}px`;
            moonTrail.style.width = `${Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2))}px`;
            moonTrail.style.transform = `rotate(${Math.atan2(currentY - startY, currentX - startX) * 180 / Math.PI}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animateProjectile);
            } else {
                // Create impact effect at the target
                const impactEffect = document.createElement('div');
                impactEffect.className = 'cascade-impact-effect';
                impactEffect.style.left = `${endX}px`;
                impactEffect.style.top = `${endY}px`;
                vfxContainer.appendChild(impactEffect);
                
                // Remove the VFX after impact animation
                setTimeout(() => {
                    if (vfxContainer.parentNode) vfxContainer.remove();
                }, 1000);
            }
        }
        
        requestAnimationFrame(animateProjectile);
    }

    applyBloodthirstyResilienceBuff(character) {
        // Create the lifesteal buff
        const buff = {
            id: 'bloodthirsty_resilience_buff',
            name: 'Bloodthirsty Resilience',
            description: 'Grants 10% lifesteal.',
            icon: 'Icons/talents/bloodthirsty_resilience.webp',
            duration: 4,
            effect: {
                type: 'modify_stat',
                stat: 'lifesteal',
                value: 0.10,
                operation: 'add'
            },
            onApply: (target) => {
                // Apply the stat modification directly
                target.applyStatModification('lifesteal', 'add', 0.10);
                // Recalculate stats to ensure the change is reflected
                target.recalculateStats('bloodthirsty_resilience_buff');
                
                addLogEntry(`${target.name} gains Bloodthirsty Resilience, increasing lifesteal by 10%!`, 'talent-effect renee');
                // Show VFX
                this.showBloodthirstyResilienceVFX(target);
            },
            onRemove: (target) => {
                // Remove the stat modification
                target.applyStatModification('lifesteal', 'subtract', 0.10);
                // Recalculate stats to ensure the change is reflected
                target.recalculateStats('bloodthirsty_resilience_buff_remove');
                
                addLogEntry(`${target.name}'s Bloodthirsty Resilience fades.`, 'talent-effect renee');
            }
        };

        // Apply the buff
        character.addBuff(buff);
    }

    showBloodthirstyResilienceVFX(character) {
        const characterElement = document.querySelector(`#character-${character.id}`);
        if (!characterElement) return;

        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'bloodthirsty-resilience-vfx';
        characterElement.appendChild(vfxContainer);

        // Add blood particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'blood-particle';
            vfxContainer.appendChild(particle);
        }

        // Remove VFX after animation
        setTimeout(() => {
            vfxContainer.remove();
        }, 2000);
    }

    // Initialize Primal Healing functionality
    initializePrimalHealing(character) {
        console.log(`[ReneePassive] Initializing Primal Healing talent for ${character.name}`);
        
        // Update Wolf Claw Strike ability description if needed
        const wolfClawAbility = character.abilities.find(a => a.id === 'renee_q');
        if (wolfClawAbility && typeof window.updateWolfClawDescription === 'function') {
            const description = window.updateWolfClawDescription(wolfClawAbility, character);
            wolfClawAbility.setDescription(description);
        }
        
        // Add event listener for damage dealt by Wolf Claw Strike to show enhanced VFX
        this.primalHealingDamageListener = (event) => {
            const { caster, target, ability, damage, isCritical } = event.detail || {};
            if (!caster || caster.id !== character.id) return;
            if (!ability || ability.id !== 'renee_q') return;
            
            // VFX will be handled in the ability function
            console.log(`[ReneePassive] Primal Healing tracking damage: ${damage} from Wolf Claw Strike`);
        };
        document.addEventListener('DamageDealt', this.primalHealingDamageListener);
    }

    // New method to handle the Lunar Empowerment talent when buffs are applied
    onBuffApplied(event) {
        console.log('[ReneePassive DEBUG] onBuffApplied triggered.');
        if (!this.character) {
            console.log('[ReneePassive DEBUG] onBuffApplied: No this.character.');
            return;
        }
        console.log(`[ReneePassive DEBUG] onBuffApplied: this.character.id = ${this.character.id}, enableLunarEmpowerment = ${this.character.enableLunarEmpowerment}`);

        if (!this.character.enableLunarEmpowerment) {
            console.log('[ReneePassive DEBUG] onBuffApplied: enableLunarEmpowerment is false. Exiting.');
            return;
        }

        const { character: buffCharacter, buff } = event.detail || {};
        console.log(`[ReneePassive DEBUG] onBuffApplied: Event detail - buffCharacter.id = ${buffCharacter ? buffCharacter.id : 'N/A'}, buff.id = ${buff ? buff.id : 'N/A'}`);

        if (!buffCharacter || buffCharacter.id !== this.character.id || !buff || buff.id !== 'renee_lunar_curse_buff') {
            console.log('[ReneePassive DEBUG] onBuffApplied: Conditions not met for empowerment. Exiting.');
            return;
        }

        console.log('[ReneePassive DEBUG] Lunar Curse buff detected, calling applyLunarEmpowermentBuff.');
        this.applyLunarEmpowermentBuff(this.character);
    }
    
    // Method to apply the Lunar Empowerment stat buffs
    applyLunarEmpowermentBuff(character) {
        console.log(`[ReneePassive DEBUG] applyLunarEmpowermentBuff called for ${character.name}.`);
        // Create the buff for stat modifications
        const empowermentBuff = {
            id: 'lunar_empowerment_buff',
            name: 'Lunar Empowerment',
            icon: 'Icons/talents/lunar_empowerment.webp',
            duration: -1, // This will be removed when the Lunar Curse buff is removed
            description: 'The power of the moon enhances your critical prowess: +15% Critical Chance, +25% Critical Damage.',
            statModifiers: [
                { stat: 'critChance', value: 0.15, operation: 'add' },
                { stat: 'critDamage', value: 0.25, operation: 'add' }
            ],
            
            // Track the Lunar Curse buff to remove this when it's removed
            _buffListener: null,
            
            onApply(target) {
                console.log(`[LunarEmpowerment] Buff applied to ${target.name}`);
                
                // Set up listener to remove this buff when Lunar Curse is removed
                this._buffListener = (event) => {
                    const { character: buffCharacter, buff: removedBuff } = event.detail || {};
                    if (buffCharacter && buffCharacter.id === target.id && 
                        removedBuff && removedBuff.id === 'renee_lunar_curse_buff') {
                        console.log('[LunarEmpowerment] Lunar Curse removed, removing empowerment buff');
                        target.removeBuff('lunar_empowerment_buff');
                    }
                };
                
                document.addEventListener('BuffRemoved', this._buffListener);
                
                // Show floating text
                if (window.gameManager?.showFloatingText) {
                    const elementId = target.instanceId || target.id;
                    window.gameManager.showFloatingText(`character-${elementId}`, '+15% Crit Chance, +25% Crit Dmg', 'buff');
                }
                
                // Log the effect
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${target.name}'s Lunar Empowerment activates, granting +15% Critical Chance and +25% Critical Damage!`, 'talent-effect renee');
            },
            
            onRemove(target) {
                console.log(`[LunarEmpowerment] Buff removed from ${target.name}`);
                
                // Clean up listener
                if (this._buffListener) {
                    document.removeEventListener('BuffRemoved', this._buffListener);
                    this._buffListener = null;
                }
                
                // Log the effect
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${target.name}'s Lunar Empowerment fades as the moon's blessing recedes.`, 'renee');
            }
        };
        
        console.log('[ReneePassive DEBUG] empowermentBuff created:', JSON.stringify(empowermentBuff));
        // Apply the buff
        character.addBuff(empowermentBuff);
        
        // Show VFX
        this.showLunarEmpowermentVFX(character);
    }
    
    // Method to show VFX for Lunar Empowerment
    showLunarEmpowermentVFX(character) {
        // Get character element
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'lunar-empowerment-vfx';
        characterElement.appendChild(vfxContainer);
        
        // Add lunar glow element
        const lunarGlow = document.createElement('div');
        lunarGlow.className = 'lunar-empowerment-glow';
        vfxContainer.appendChild(lunarGlow);
        
        // Add moon symbol
        const moonSymbol = document.createElement('div');
        moonSymbol.className = 'lunar-empowerment-symbol';
        vfxContainer.appendChild(moonSymbol);
        
        // Play sound if available
        if (window.gameManager?.playSound) {
            window.gameManager.playSound('sounds/lunar_empower.mp3', 0.6);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) vfxContainer.remove();
        }, 2500);
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener('GameStart', this.boundGameStartListener);
        document.removeEventListener('AbilityUsed', this.boundAbilityUsedListener);
        document.removeEventListener('damageDealt', this.boundDamageTakenListener);
        document.removeEventListener('BuffApplied', this.boundBuffAppliedListener);
        document.removeEventListener('TalentApplied', this.talentListener);
        
        console.log(`[ReneePassive] Destroyed for ${this.character ? this.character.name : 'unknown character'}`);
        
        // Clear character reference
        this.character = null;
    }
}

// Register the passive handler
if (typeof window !== 'undefined') {
    window.ReneePassive = ReneePassive;
    // Also expose the functions needed for Lunar Cascade
    window.executeWolfClawStrike = window.executeWolfClawStrike || function() { console.warn('[Window Export] executeWolfClawStrike not available'); };
    window.executeMysticalWhip = window.executeMysticalWhip || function() { console.warn('[Window Export] executeMysticalWhip not available'); };
} 