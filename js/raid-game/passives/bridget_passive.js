/**
 * Bridget Passive Handler - Aqua Life Essence
 * 42% of damage dealt heals a random ally and the caster
 */
class BridgetPassiveHandler {
    constructor() {
        this.character = null;
        this.eventListeners = [];
        this.id = 'bridget_passive';
        this.name = 'Aqua Life Essence';
        this.description = '16% of damage you deal heals a random ally and yourself for the same amount.';
        this.passiveHealingPercent = 0.16; // Default value of 16%
        
        // Track talent effects (these will be set by talents when they're applied)
        this.oceanicHarmonyActive = false; // Set by Oceanic Harmony talent
        this.critReducesCooldowns = false; // Set by Critical Cooldown talent
        this.clamProtectionAuraActive = false; // Set by Clam Protection Aura talent
        this.abyssalMarkActive = false; // Set by Abyssal Mark talent
        this.fluidEvasionActive = false; // Set by Fluid Evasion talent
        this.lowTidePowerActive = false; // Set by Low Tide Power talent
        this.aquaticResonanceActive = false; // Set by Aquatic Resonance talent
        this.tidalMasteryActive = false; // Set by Tidal Mastery talent
        this.bubblePopActive = false; // Set by Bubble Pop talent
        this.endlessCascadeActive = false; // Set by Endless Cascade talent
        this.bubblePopDebuffId = 'bridget_bubble_pop_debuff'; // Constant ID for the debuff
        this.resonantCascadeActive = false;
        this.bubbleAnimationQueue = [];
        this.processingAnimations = false;
        this.healingTsunamiActive = false;
        this.healingTsunamiTriggered = false;
        this.healingTsunamiBuffId = null;
        
        console.log('[BridgetPassiveHandler CONSTRUCTOR] Initialized');

        this.initialize = this.initialize.bind(this);
        this.applyPassiveHealing = this.applyPassiveHealing.bind(this);
        this.onCriticalHit = this.onCriticalHit.bind(this);
        this.onCriticalHeal = this.onCriticalHeal.bind(this);
        this.updateDescription = this.updateDescription.bind(this);
        this.initialized = false;
        this.critHealListener = null;
        this.critHitListener = null;
        this.damageDealtListener = null;
        this.lowTideCheckInterval = null; // Add interval for checking mana levels
        this.buffChangeListener = null; // Add listener for buff changes
        this.bubblePopListenerAdded = false; // Add this new property

        // Store bound method references
        this._boundOnAbilityUsed = this.onAbilityUsed.bind(this);
        this._boundOnTalentApplied = this.onTalentApplied.bind(this);
        // Remove binding for checkHealingTsunamiTrigger as it will become onTurnStart
        // this._boundCheckHealingTsunamiTrigger = this.checkHealingTsunamiTrigger.bind(this);
        
        // Event listeners for Resonant Cascade - FIX: use correct event name
        document.addEventListener('AbilityUsed', this._boundOnAbilityUsed);
        
        // Listen for talent application events
        document.addEventListener('talent_applied', this._boundOnTalentApplied);
        document.addEventListener('bridget_talents_applied', this._boundOnTalentApplied);
        
        // Store a global reference to this passive instance for direct access
        window.bridgetPassiveInstance = this;
        
        console.log('[BridgetPassiveHandler CONSTRUCTOR] Added resonant cascade listeners and stored global reference');

        // Bind methods for event listeners to ensure proper removal
        this.checkHealingTsunamiTrigger = this.checkHealingTsunamiTrigger.bind(this);
    }

    initialize(character) {
        this.character = character;
        console.log('[BridgetPassiveHandler] Initialize for', character.name);
        
        // Bind event handlers first to ensure consistent references
        this._boundOnCriticalHit = this.onCriticalHit.bind(this);
        this._boundOnCriticalHeal = this.onCriticalHeal.bind(this);
        this._boundOnAbilityUsed = this.onAbilityUsed.bind(this);
        this._boundOnTalentApplied = this.onTalentApplied.bind(this);
        // No longer need to bind _boundCheckHealingTsunamiTrigger here
        
        // Create an event listener for damage dealt to process passive healing
        document.addEventListener('criticalHit', this._boundOnCriticalHit);
        document.addEventListener('criticalHeal', this._boundOnCriticalHeal);
        document.addEventListener('abilityUsed', this._boundOnAbilityUsed);
        document.addEventListener('talentApplied', this._boundOnTalentApplied);
        // --- ADD EVENT LISTENER FOR DAMAGE DEALT ---
        // document.addEventListener('damageDealt', this._boundOnDamageDealt); 
        // --- END ADD EVENT LISTENER ---
        
        // Store passive instance globally
        window.bridgetPassiveInstance = this;
        
        const hasTalent = (talentId) => {
            // Corrected to check appliedTalents
            return character.appliedTalents && character.appliedTalents.includes(talentId);
        };
        
        // Check all talents and apply effects as needed
        this.hasEchoingBubbles = hasTalent('echoing_bubbles');
        this.hasCritCooldownReduction = hasTalent('critical_cooldown');
        this.hasOceanicHarmony = hasTalent('oceanic_harmony');
        this.hasClamProtectionAura = hasTalent('clam_protection_aura');
        this.hasLowTidePower = hasTalent('low_tide_power');
        this.hasAquaticResonance = hasTalent('aquatic_resonance');
        this.hasTidalMastery = hasTalent('tidal_mastery');
        this.hasBubblePop = hasTalent('bubble_pop');
        this.hasEndlessCascade = hasTalent('endless_cascade');
        this.hasWaterDance = hasTalent('water_dance');
        this.hasResonantCascade = hasTalent('resonant_cascade');
        this.healingTsunamiActive = hasTalent('healing_tsunami');
        
        // Set up event listeners for various talents
        if (this.hasClamProtectionAura) {
            this._boundClamProtectionHandler = (event) => {
                if (event.detail.caster === this.character && 
                    event.detail.target !== this.character &&
                    event.detail.target.isAlly(this.character)) {
                    this.applyClamProtectionBuff(event.detail.target);
                }
            };
            document.addEventListener('healingApplied', this._boundClamProtectionHandler);
        }
        
        if (this.hasLowTidePower) {
            this.setupLowTidePowerCheck();
        }
        
        if (this.hasAquaticResonance) {
            this.setupAquaticResonance();
        }
        
        if (this.hasBubblePop) {
            this.setupBubblePop();
        }
        
        if (this.healingTsunamiActive) {
            // Ensure the handler is properly bound
            if (!this._boundCheckHealingTsunamiTrigger) {
                this._boundCheckHealingTsunamiTrigger = this.checkHealingTsunamiTrigger.bind(this);
            }
            document.addEventListener('TurnStart', this._boundCheckHealingTsunamiTrigger);
            console.log("Healing Tsunami talent activated - listening for TurnStart event");
        }
        
        if (this.hasWaterDance) {
            initializeWaterDance();
        }
        
        this.updateDescription(); // Update description after reading talents
    }

    updateDescription() {
        let description = `Bridget's attacks cause her passive to heal herself for 16% of the damage dealt, and heal a random ally for 16% of the damage dealt.`;

        // Add Oceanic Harmony talent info if active
        if (this.hasOceanicHarmony) {
            description += `\n\n<span class="talent-effect healing">Oceanic Harmony: Heals TWO random allies instead of one.</span>`;
        }

        // Add Clam Protection Aura talent info if active
        if (this.hasClamProtectionAura) {
            description += `\n\n<span class="talent-effect utility">Clam Protection Aura: When Bridget heals an ally, they gain a shield that blocks 5% of damage for 4 turns. Stacks up to 3 times.</span>`;
        }

        // Add Low Tide Power talent info if active
        if (this.hasLowTidePower) {
            description += `\n\n<span class="talent-effect damage">Low Tide Power: When Bridget's mana is below 50%, she gains an additional 150 Magical Damage.</span>`;
        }

        // Add Aquatic Resonance talent info if active
        if (this.hasAquaticResonance) {
            description += `\n\n<span class="talent-effect utility">Aquatic Resonance: Bridget's buffs resonate with her water magic, granting 10% critical damage and 20 Magical Damage for each active buff she has.</span>`;
        }

        // Add Echoing Bubbles talent info if active
        if (this.hasEchoingBubbles) {
            description += `\n\n<span class="talent-effect healing">Echoing Bubbles: Bridget's passive healing has a 15% chance to launch an additional healing bubble at the target, healing for 50 + 200% of her Magical Damage.</span>`;
        }

        // Add Resonant Cascade talent info if active
        if (this.hasResonantCascade) {
            description += `\n\n<span class="talent-effect aoe">Resonant Cascade: All of Bridget's abilities have a 100% chance to cast an additional bubble. Enemies receive 100% of Magical Damage as damage, while allies receive 100% of Magical Damage as healing.</span>`;
        }
        
        // Add Healing Tsunami talent info if active
        if (this.healingTsunamiActive) {
            description += `\n\n<span class="talent-effect healing">Healing Tsunami: Every turn, there is a 50% chance that Bridget's Healing Power is tripled until the start of her next turn.</span>`;
        }

        // Set description on character
        if (this.character) {
            const passive = this.character.passive; // MODIFIED: Access passive directly
            if (passive) {
                passive.description = description;

                // Update any UI elements that might be displaying the passive
                const passiveDescriptionElements = document.querySelectorAll('.passive-description');
                passiveDescriptionElements.forEach(element => {
                    if (element.dataset.characterId === this.character.id) {
                        element.innerHTML = description;
                    }
                });
            }
        }
    }

    /**
     * Triggers Bridget's passive healing. Should be called ONCE per ability use, with total damage dealt.
     * @param {number} damageAmount - The total damage dealt by the ability.
     */
    applyPassiveHealing(damageAmount) {
        console.log(`[BridgetPassiveHandler applyPassiveHealing] Called with damageAmount: ${damageAmount}`);
        console.log(`[BridgetPassiveHandler applyPassiveHealing] this.character:`, this.character);
        if (this.character) {
            console.log(`[BridgetPassiveHandler applyPassiveHealing] this.character.isDead(): ${this.character.isDead()}`);
            console.log(`[BridgetPassiveHandler applyPassiveHealing] this.character.passive:`, this.character.passive);
        }

        if (!this.character || this.character.isDead() || !this.character.passive) {
            console.warn("[BridgetPassiveHandler applyPassiveHealing] Exiting early due to invalid character, dead status, or no passive data.");
            return;
        }
        console.log(`[BridgetPassiveHandler applyPassiveHealing] Passive Healing Percent: ${this.passiveHealingPercent}`);
        const healPercent = this.passiveHealingPercent; 
        let healAmount = Math.floor(damageAmount * healPercent);
        console.log(`[BridgetPassiveHandler applyPassiveHealing] Calculated healAmount (before target processing): ${healAmount}`);

        if (healAmount <= 0) {
            console.log(`[BridgetPassiveHandler applyPassiveHealing] Calculated healAmount is 0 or less, no healing applied.`);
            return;
        }

        // Oceanic Harmony Talent: Passive heals Bridget and TWO random allies instead of 1.
        const oceanicHarmonyActive = this.hasOceanicHarmony; // Use the talent flag set in initialize/talent update
        const targetsToHeal = [];

        // Always heal Bridget (the caster of the passive)
        targetsToHeal.push(this.character);

        if (oceanicHarmonyActive) {
            // Heal up to two additional random living allies
            const allies = window.gameManager.getAllies(this.character).filter(
                ally => ally && !ally.isDead() && ally.id !== this.character.id // Exclude self
            );
            // Shuffle allies to pick random ones
            for (let i = allies.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allies[i], allies[j]] = [allies[j], allies[i]];
            }
            targetsToHeal.push(...allies.slice(0, 2));
        } else {
            // Original passive: Heal one additional random living ally
            const allies = window.gameManager.getAllies(this.character).filter(
                ally => ally && !ally.isDead() && ally.id !== this.character.id
            );
            if (allies.length > 0) {
                targetsToHeal.push(allies[Math.floor(Math.random() * allies.length)]);
            }
        }

        // Call passive healing for each target
        targetsToHeal.forEach(target => {
            if (target && !target.isDead()) {
                console.log(`[BridgetPassiveHandler applyPassiveHealing] Applying heal to ${target.name}`);
                // Pass caster (Bridget) to the heal method for correct healing power application and critical heal check
                const healResult = target.heal(healAmount, this.character, { allowOverheal: true }); // allowOverheal for passive
                const actualHealAmount = healResult.healAmount;

                if (actualHealAmount > 0) {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    // Log message for critical heal is handled within target.heal if it's a crit
                    if (!healResult.isCritical) {
                        log(`${this.character.name}'s Aqua Life Essence heals ${target.name} for ${actualHealAmount} HP.`, 'heal');
                    }
                    this.showHealingVFX(target, actualHealAmount);

                    // Trigger Echoing Bubbles talent if active
                    if (this.hasEchoingBubbles && Math.random() < 0.15) { // 15% chance
                        this.triggerEchoingBubble(target, this.character);
                    }
                    // Apply Clam Protection Aura if the talent is active and the target is an ally (not self)
                    if (this.hasClamProtectionAura && target.id !== this.character.id) {
                        this.applyClamProtectionBuff(target);
                    }

                    /* --- Statistics Tracking for Bridget Passive --- */
                    if (window.statisticsManager) {
                        try {
                            // Record the healing done under a dedicated passive ability ID
                            window.statisticsManager.recordHealingDone(
                                this.character,
                                target,
                                actualHealAmount,
                                healResult.isCritical || false,
                                'bridget_passive_heal'
                            );

                            // Also register a passive trigger usage for aggregate stats
                            window.statisticsManager.recordAbilityUsage(
                                this.character,
                                'bridget_passive',
                                'passive_trigger',
                                actualHealAmount,
                                false
                            );
                        } catch (err) {
                            console.error('[BridgetPassive Stats] Error while recording passive heal:', err);
                        }
                    }
                    /* --- End Statistics Tracking --- */
                }
            }
        });

        // Update UI for all healed targets
        targetsToHeal.forEach(target => {
            if (target && window.updateCharacterUI) {
                window.updateCharacterUI(target);
            }
        });
    }
    
    triggerEchoingBubble(target, caster) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`[Echoing Bubbles] talent proc'd! ${caster.name} launches a healing bubble at ${target.name}.`, 'talent-effect');

        const baseHeal = 50;
        const healingPowerScaling = 0.25;
        const bonusHeal = Math.floor((caster.stats.healingPower || 0) * healingPowerScaling);
        const totalHealAmount = baseHeal + bonusHeal;

        if (target && !target.isDead() && totalHealAmount > 0) {
            const healResult = target.heal(totalHealAmount, caster);
             if (healResult.healAmount > 0) {
                log(`${caster.name}'s Echoing Bubble heals ${target.name} for ${healResult.healAmount} HP.`, 'heal');
             }
        }
        this.showEchoingBubbleVFX(caster, target);
    }

    showEchoingBubbleVFX(caster, target) {
        console.log(`[Echoing Bubbles] Showing VFX from ${caster.name} to ${target.name}`);
        if (!caster || !target || !document.getElementById(`character-${caster.instanceId || caster.id}`)) return;

        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

        if (!casterElement || !targetElement) {
            console.warn("[Echoing Bubbles] Missing caster or target element for VFX.");
            return;
        }

        const vfxContainer = document.querySelector('.battle-container') || document.body;

        const bubble = document.createElement('div');
        bubble.className = 'echoing-bubble-projectile';
        vfxContainer.appendChild(bubble);

        const startRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = vfxContainer.getBoundingClientRect();

        // Adjust for container offset if not body
        const startX = startRect.left + startRect.width / 2 - (vfxContainer === document.body ? 0 : containerRect.left);
        const startY = startRect.top + startRect.height / 2 - (vfxContainer === document.body ? 0 : containerRect.top);
        const endX = targetRect.left + targetRect.width / 2 - (vfxContainer === document.body ? 0 : containerRect.left);
        const endY = targetRect.top + targetRect.height / 2 - (vfxContainer === document.body ? 0 : containerRect.top);

        bubble.style.left = `${startX}px`;
        bubble.style.top = `${startY}px`;

        // Animate the bubble
        requestAnimationFrame(() => {
            bubble.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`;
            bubble.style.opacity = '0';
        });

        // After animation, show impact and remove projectile
        setTimeout(() => {
            bubble.remove();
            if (targetElement && !target.isDead()) {
                const impactVFX = document.createElement('div');
                impactVFX.className = 'echoing-bubble-impact';
                // Add some particles or a small splash
                for(let i=0; i< 5; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'echoing-bubble-particle';
                    particle.style.setProperty('--i', i);
                    impactVFX.appendChild(particle);
                }
                targetElement.appendChild(impactVFX);
                setTimeout(() => impactVFX.remove(), 800); // Duration of impact VFX
            }
        }, 600); // Duration of projectile travel
    }
    
    showHealingVFX(character, healAmount) {
        if (typeof showPassiveHealingVFX === 'function') {
            showPassiveHealingVFX(character, healAmount);
        } else {
            console.warn('[BridgetPassiveHandler] showPassiveHealingVFX function not found.');
        }
    }

    onCriticalHit(event) {
        if (!this.character || this.character.isDead() || !this.critReducesCooldowns) return;

        // Check if the critical hit was by this character
        if (event.detail.source && 
           (event.detail.source.id === this.character.id || 
            event.detail.source.instanceId === this.character.instanceId)) {
            console.log(`[BridgetPassiveHandler] ${this.character.name} landed a critical hit. Reducing cooldowns.`);
            this.applyCriticalCooldownReduction('hit');
        }
    }

    onCriticalHeal(event) {
        if (!this.character || this.character.isDead() || !this.critReducesCooldowns) return;

        // Check if the critical heal was sourced by this character
        if (event.detail.source && 
           (event.detail.source.id === this.character.id || 
            event.detail.source.instanceId === this.character.instanceId)) {
            console.log(`[BridgetPassiveHandler] ${this.character.name} landed a critical heal. Reducing cooldowns.`);
            this.applyCriticalCooldownReduction('heal');
        }
    }

    applyCriticalCooldownReduction(sourceType) {
        if (!this.character || !this.character.abilities) {
            console.warn('[BridgetPassiveHandler] Cannot reduce cooldowns: character or abilities not available');
            return;
        }
        
        // Check if any abilities are on cooldown
        const abilitiesOnCooldown = this.character.abilities.filter(ability => ability.currentCooldown > 0);
        if (abilitiesOnCooldown.length === 0) {
            console.log('[BridgetPassiveHandler] No abilities on cooldown to reduce');
            return;
        }
        
        // Log the event
        const sourceText = sourceType === 'hit' ? 'critical hit' : 'critical heal';
        console.log(`[BridgetPassiveHandler] ${this.character.name}'s Critical Cooldown talent triggered by ${sourceText}`);
        
        // Add log entry
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `${this.character.name}'s Critical Cooldown talent reduces ability cooldowns by 1 turn!`, 
                'talent-effect'
            );
        }

        // Create a visual effect on the character
        const charElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (charElement) {
            const cooldownVFX = document.createElement('div');
            cooldownVFX.className = 'critical-cooldown-vfx';
            charElement.appendChild(cooldownVFX);
            
            // Create a "CD -1" indicator
            const cdText = document.createElement('div');
            cdText.className = 'cooldown-reduction-text';
            cdText.textContent = 'CD -1';
            cooldownVFX.appendChild(cdText);
            
            // Remove the VFX after animation
            setTimeout(() => {
                if (cooldownVFX.parentNode === charElement) {
                    charElement.removeChild(cooldownVFX);
                }
            }, 1500);
        }
        
        // Reduce cooldowns for all abilities
        abilitiesOnCooldown.forEach(ability => {
            const oldCooldown = ability.currentCooldown;
            ability.currentCooldown = Math.max(0, ability.currentCooldown - 1);
            console.log(`[BridgetPassiveHandler] Reduced ${ability.name} cooldown: ${oldCooldown} → ${ability.currentCooldown}`);
            
            // Add visual indicator to ability (if possible)
            setTimeout(() => {
                const abilityElements = document.querySelectorAll(`#character-${this.character.instanceId || this.character.id} .ability`);
                Array.from(abilityElements).forEach((abilityEl, index) => {
                    if (index < this.character.abilities.length && this.character.abilities[index].id === ability.id) {
                        abilityEl.classList.add('cooldown-reduced');
                        setTimeout(() => abilityEl.classList.remove('cooldown-reduced'), 1000);
                    }
                });
            }, 0);
        });
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(this.character);
        }
    }

    onTalentModified(property, value) {
        // Handle other talents property changes
        switch (property) {
            case 'oceanicHarmonyActive':
                this.oceanicHarmonyActive = value;
                this.updateOceanicHarmonyVisuals();
                break;
            case 'critReducesCooldowns':
                this.critReducesCooldowns = value;
                break;
            case 'clamProtectionAuraActive':
                this.clamProtectionAuraActive = value;
                break;
            case 'abyssalMarkActive':
                this.abyssalMarkActive = value;
                break;
            case 'fluidEvasionActive':
                this.fluidEvasionActive = value;
                break;
            case 'lowTidePowerActive':
                this.lowTidePowerActive = value;
                if (value) {
                    this.setupLowTidePowerCheck();
                }
                break;
            case 'aquaticResonanceActive':
                this.aquaticResonanceActive = value;
                console.log(`[BridgetPassiveHandler] Aquatic Resonance set to ${value}`);
                this.setupAquaticResonance();
                break;
            case 'bubblePopActive':
                this.bubblePopActive = value;
                if (value && this.character) {
                    this.setupBubblePop();
                }
                break;
            case 'resonantCascadeActive':
                this.resonantCascadeActive = value;
                break;
        }
        
        this.updateDescription();
    }
    
    /**
     * Updates visual indicators for Oceanic Harmony talent
     */
    updateOceanicHarmonyVisuals() {
        if (!this.character) return;
        
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Add or remove the oceanic-harmony-active class based on talent state
        if (this.oceanicHarmonyActive) {
            charElement.classList.add('oceanic-harmony-active');
            console.log(`[BridgetPassiveHandler] Added oceanic-harmony-active class to ${elementId}`);
            
            // Add floating notification to show talent activation
            if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
                window.gameManager.showFloatingText(
                    `character-${elementId}`, 
                    'Oceanic Harmony Active', 
                    'buff'
                );
            }
        } else {
            charElement.classList.remove('oceanic-harmony-active');
            console.log(`[BridgetPassiveHandler] Removed oceanic-harmony-active class from ${elementId}`);
        }
    }

    destroy() {
        // Remove event listeners for damage and critical hit/heal using bound references
        if (this._boundOnCriticalHit) document.removeEventListener('criticalHit', this._boundOnCriticalHit);
        if (this._boundOnCriticalHeal) document.removeEventListener('criticalHeal', this._boundOnCriticalHeal);
        if (this._boundOnAbilityUsed) document.removeEventListener('abilityUsed', this._boundOnAbilityUsed);
        if (this._boundOnTalentApplied) document.removeEventListener('talentApplied', this._boundOnTalentApplied);
        
        // Remove Resonant Cascade event listeners
        if (this._boundOnAbilityUsed) {
            document.removeEventListener('AbilityUsed', this._boundOnAbilityUsed);
        }
        if (this._boundOnTalentApplied) {
            document.removeEventListener('talent_applied', this._boundOnTalentApplied);
            document.removeEventListener('bridget_talents_applied', this._boundOnTalentApplied);
        }
        
        // Remove Clam Protection handler
        if (this._boundClamProtectionHandler) {
            document.removeEventListener('healingApplied', this._boundClamProtectionHandler);
        }
        
        // Rest of existing cleanup code
        if (this.critHealStatBuffListener) {
            document.removeEventListener('critical_heal', this.critHealStatBuffListener);
        }
        
        if (this.critReducesCooldownsListener) {
            document.removeEventListener('critical_hit', this.critReducesCooldownsListener);
            document.removeEventListener('critical_heal', this.critReducesCooldownsListener);
        }
        
        if (this.buffChangeListener) {
            document.removeEventListener('buff_added', this.buffChangeListener);
            document.removeEventListener('buff_removed', this.buffChangeListener);
        }
        
        if (this.lowTideInterval) {
            clearInterval(this.lowTideInterval);
        }
        
        if (this.bubblePopListener) {
            document.removeEventListener('turn_start', this.bubblePopListener);
        }
        
        // Remove Healing Tsunami event listeners
        if (this.healingTsunamiActive) {
            if (this._boundCheckHealingTsunamiTrigger) {
                document.removeEventListener('TurnStart', this._boundCheckHealingTsunamiTrigger);
            } else {
                document.removeEventListener('TurnStart', this.checkHealingTsunamiTrigger);
            }
            
            if (this.healingTsunamiBuffId) {
                // Try to remove the buff if it still exists
                this.character.removeBuff(this.healingTsunamiBuffId);
            }
            
            // Remove the class if it's still there
            const characterElement = document.getElementById(`character-${this.character.id}`);
            if (characterElement) {
                characterElement.classList.remove('healing-tsunami-active');
            }
        }
        
        // Clean up any active VFX elements
        this.cleanupAnimations();

        console.log(`[BridgetPassiveHandler] Destroyed passive for ${this.character ? this.character.name : 'unknown'}`);
        
        // Clear global reference
        if (window.bridgetPassiveInstance === this) {
            delete window.bridgetPassiveInstance;
        }
    }
    
    // Helper method to clean up any active animations
    cleanupAnimations() {
        // Clear animation queue
        this.bubbleAnimationQueue = [];
        this.processingAnimations = false;
        
        // Remove any VFX containers from the DOM
        const cascadeContainers = document.querySelectorAll('.resonant-cascade-projectile-container');
        cascadeContainers.forEach(container => container.remove());
        
        const impactVFX = document.querySelectorAll('.resonant-cascade-impact-vfx, .resonant-cascade-heal-vfx');
        impactVFX.forEach(element => element.remove());
    }

    /**
     * Applies the Clam Protection buff to an ally
     * @param {Character} ally - The ally to receive the protection buff
     */
    applyClamProtectionBuff(ally) {
        if (!ally || ally.isDead()) {
            console.warn('[BridgetPassiveHandler] Cannot apply Clam Protection: ally is invalid or dead');
            return;
        }
        
        console.log(`[BridgetPassiveHandler] Applying Clam Protection buff to ${ally.name}`);
        
        // Create the protection buff
        const protectionBuff = new Effect(
            'bridget_clam_protection',
            'Clam Protection',
            'Icons/buffs/clam_protection.webp',
            3, // Duration: 3 turns
            null, // No per-turn tick effect
            false // Not a debuff
        );
        
        // Define the stat modification - 5% armor increase
        protectionBuff.statModifiers = [
            { stat: 'armor', operation: 'add', value: 0.05 }
        ];
        
        // Set description
        protectionBuff.setDescription('Increases armor by 5% for 3 turns.');
        
        // Add visual effect when applied
        protectionBuff.onApply = (character) => {
            this.showClamProtectionVFX(character);
        };
        
        // Add buff to ally
        ally.addBuff(protectionBuff);
        
        // Log the application
        if (window.gameManager) {
            window.gameManager.addLogEntry(`${this.character.name}'s Clam Protection Aura provides ${ally.name} with +5% armor for 3 turns.`, 'talent-effect');
        }
    }
    
    /**
     * Shows the VFX for Clam Protection buff application
     * @param {Character} character - The character receiving the buff
     */
    showClamProtectionVFX(character) {
        if (!character) return;
        
        const charId = character.instanceId || character.id;
        const charElement = document.getElementById(`character-${charId}`);
        
        if (!charElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'clam-protection-vfx';
        charElement.appendChild(vfxContainer);
        
        // Create shell icon
        const shellElement = document.createElement('div');
        shellElement.className = 'clam-shell-icon';
        vfxContainer.appendChild(shellElement);
        
        // Create protection text
        const protectionText = document.createElement('div');
        protectionText.className = 'clam-protection-text';
        protectionText.textContent = '+5% ARMOR';
        vfxContainer.appendChild(protectionText);
        
        // Create protective shimmer particles
        for (let i = 0; i < 10; i++) {
            const shimmer = document.createElement('div');
            shimmer.className = 'clam-protection-shimmer';
            shimmer.style.left = `${Math.random() * 100}%`;
            shimmer.style.top = `${Math.random() * 100}%`;
            shimmer.style.animationDelay = `${Math.random() * 0.5}s`;
            
            // Add random movement direction using CSS variables
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            shimmer.style.setProperty('--moveX', `${Math.cos(angle) * distance}px`);
            shimmer.style.setProperty('--moveY', `${Math.sin(angle) * distance}px`);
            
            vfxContainer.appendChild(shimmer);
        }
        
        // Play sound if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/buff_applied.mp3', 0.6);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode === charElement) {
                charElement.removeChild(vfxContainer);
            }
        }, 2000);
    }

    // Add method to setup Low Tide Power check
    setupLowTidePowerCheck() {
        console.log('[BridgetPassiveHandler] Setting up Low Tide Power check for', this.character?.name);
        if (!this.character || !this.character.lowTidePowerActive) {
            console.log('[BridgetPassiveHandler] Setup aborted: Character missing or talent inactive.');
            return;
        }
        
        // Initial check immediately
        setTimeout(() => this.checkLowTidePower(), 100);

        // Clear any existing interval first
        if (this.lowTideCheckInterval) {
            clearInterval(this.lowTideCheckInterval);
        }

        // Add event listeners to catch different ways mana can change
        document.removeEventListener('ManaChanged', this.handleManaChanged);
        this.handleManaChanged = (event) => {
            const detail = event.detail || {};
            console.log('[BridgetPassiveHandler] ManaChanged event received:', detail);
            
            // Check if this event is for our character
            if (detail.characterId === this.character.id || 
                detail.characterInstanceId === this.character.instanceId || 
                (detail.character && (detail.character.id === this.character.id || detail.character.instanceId === this.character.instanceId))) {
                    
                console.log('[BridgetPassiveHandler] ManaChanged event is for Bridget, checking Low Tide Power');
                this.checkLowTidePower();
            }
        };
        document.addEventListener('ManaChanged', this.handleManaChanged);
        
        // Add a regular interval check as a fallback (every 2 seconds)
        this.lowTideCheckInterval = setInterval(() => {
            this.checkLowTidePower();
        }, 2000);
        
        console.log('[BridgetPassiveHandler] Low Tide Power check setup completed');
    }

    // Add method to check for Low Tide Power condition
    checkLowTidePower() {
        if (!this.character || !this.lowTidePowerActive) {
            return false;
        }

        // Get current mana information
        const currentMana = this.character.stats.currentMana || 0;
        const maxMana = this.character.stats.maxMana || 100;
        const manaPercentage = maxMana > 0 ? currentMana / maxMana : 0;
        
        console.log(`[BridgetPassiveHandler] Low Tide Power check - Mana: ${currentMana}/${maxMana} (${(manaPercentage*100).toFixed(1)}%)`);
        
        // Check if we're below 50% mana
        const isBelowThreshold = manaPercentage < 0.5;
        console.log(`[BridgetPassiveHandler] Is below 50% threshold: ${isBelowThreshold}`);
        
        // Check if buff is already active
        const hasLowTideBuff = this.character.buffs && this.character.buffs.some(buff => buff.id === 'low_tide_power_buff');
        console.log(`[BridgetPassiveHandler] Currently has Low Tide Power buff: ${hasLowTideBuff}`);
        
        // Determine if we need to apply or remove the buff
        if (isBelowThreshold && !hasLowTideBuff) {
            console.log(`[BridgetPassiveHandler] Applying Low Tide Power buff (Mana: ${(manaPercentage*100).toFixed(1)}%)`);
            this.applyLowTidePowerBuff();
            return true;
        } else if (!isBelowThreshold && hasLowTideBuff) {
            console.log(`[BridgetPassiveHandler] Removing Low Tide Power buff (Mana: ${(manaPercentage*100).toFixed(1)}%)`);
            this.removeLowTidePowerBuff();
            return true;
        }
        
        return false;
    }

    // New methods to apply and remove the Low Tide Power buff
    applyLowTidePowerBuff() {
        if (!this.character) return;
        
        // Create the buff
        const lowTideBuff = new Effect(
            'low_tide_power_buff',
            'Low Tide Power',
            'Icons/talents/low_tide_power.webp',
            -1, // Permanent until mana goes above threshold
            null, // No per-turn effect
            false // Not a debuff
        );
        
        // Set description
        lowTideBuff.description = 'Magical damage increased by 150 when mana is below 50%.';
        
        // Add stat modifier
        lowTideBuff.statModifiers = [{
            stat: 'magicalDamage',
            value: 150,
            operation: 'add'
        }];
        
        // Apply the buff to the character
        this.character.addBuff(lowTideBuff);
        
        // Set flag for buff active
        this.character.lowTideBonusActive = true;
        
        // Add visual effects
        const elementId = this.character.instanceId || this.character.id; 
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            charElement.classList.add('low-tide-active');
            
            // Create an animation element for the activation
            const vfxElement = document.createElement('div');
            vfxElement.className = 'low-tide-power-vfx';
            vfxElement.innerHTML = '<div class="low-tide-power-text">Low Tide Power Activated!</div>';
            charElement.appendChild(vfxElement);
            
            // Remove the animation after it plays
            setTimeout(() => {
                if (charElement.contains(vfxElement)) {
                    charElement.removeChild(vfxElement);
                }
            }, 3000);
        }
        
        // Add log entry for the buff
        if (window.gameManager?.addLogEntry) {
            window.gameManager.addLogEntry(`${this.character.name}'s Low Tide Power activated! (+150 Magical Damage)`, 'talent-effect');
        }
        
        // Recalculate stats
        this.character.recalculateStats('low_tide_power');
        
        // Update UI
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(this.character);
        }
    }
    
    removeLowTidePowerBuff() {
        if (!this.character) return;
        
        // Remove the buff
        this.character.removeBuff('low_tide_power_buff');
        
        // Clear flag
        this.character.lowTideBonusActive = false;
        
        // Remove visual effects
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            charElement.classList.remove('low-tide-active');
        }
        
        // Add log entry
        if (window.gameManager?.addLogEntry) {
            window.gameManager.addLogEntry(`${this.character.name}'s Low Tide Power deactivated as mana rose above 50%.`, 'talent-effect');
        }
        
        // Recalculate stats
        this.character.recalculateStats('low_tide_power');
        
        // Update UI
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(this.character);
        }
    }

    // New method to update stat menu styling when Low Tide Power changes
    updateStatMenuForLowTide(isActive) {
        const statsMenu = document.querySelector('.character-stats-menu');
        if (!statsMenu) return;
        
        // Only proceed if this is Bridget's stats menu
        const menuTitle = statsMenu.querySelector('.stats-menu-header h2');
        if (!menuTitle || !menuTitle.textContent.includes(this.character.name)) return;
        
        // Find the magical damage stat value element
        const magicalDamageStat = statsMenu.querySelector('.stat-item[data-stat-key="magicalDamage"] .stat-value');
        if (magicalDamageStat) {
            if (isActive) {
                magicalDamageStat.classList.add('buffed', 'low-tide-active');
            } else {
                magicalDamageStat.classList.remove('low-tide-active');
                // Don't remove 'buffed' class as it might be needed for other buffs
            }
        }
    }

    // Add visual effect for Low Tide Power
    showLowTidePowerVFX(isActivating) {
        if (!this.character) return;
        
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Remove any existing effect first
        const existingVFX = charElement.querySelector('.low-tide-power-vfx');
        if (existingVFX) {
            existingVFX.remove();
        }
        
        if (isActivating) {
            // Create new effect for activation
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'low-tide-power-vfx';
            
            // Add effect elements
            const powerText = document.createElement('div');
            powerText.className = 'low-tide-power-text';
            powerText.textContent = '+150 MAGIC DMG';
            vfxContainer.appendChild(powerText);
            
            const manaAura = document.createElement('div');
            manaAura.className = 'low-tide-power-aura';
            vfxContainer.appendChild(manaAura);
            
            // Add to character
            charElement.appendChild(vfxContainer);
            
            // Remove after animation
            setTimeout(() => {
                if (vfxContainer.parentNode === charElement) {
                    vfxContainer.remove();
                }
            }, 3000);
        }
    }

    // Add a manual test function to force low tide power to activate
    forceActivateLowTide() {
        console.log('[DEBUG-LOWTIDE] Manually forcing Low Tide Power activation');
        
        if (!this.character) {
            console.log('[DEBUG-LOWTIDE] No character reference available');
            return;
        }
        
        if (!this.character.lowTidePowerActive) {
            console.log('[DEBUG-LOWTIDE] Setting lowTidePowerActive to true');
            this.character.lowTidePowerActive = true;
            this.lowTidePowerActive = true;
        }
        
        // Simulate being at low mana
        this.character.lowTideBonusActive = false; // Reset active state
        
        // Apply buff directly
        this.applyLowTidePowerBuff();
        
        // Add visual effects
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        
        if (charElement) {
            charElement.classList.add('low-tide-active');
            console.log('[DEBUG-LOWTIDE] Added low-tide-active class');
        }
        
        // Show visual effect
        this.showLowTidePowerVFX(true);
        
        // Add game log
        if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
            window.gameManager.addLogEntry(`${this.character.name}'s Low Tide Power forcibly activated! (+150 Magical Damage)`, 'talent-effect');
        }
        
        // Update stat menu
        this.updateStatMenuForLowTide(true);
        
        // Force UI update
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(this.character);
        }
        
        console.log('[DEBUG-LOWTIDE] Manual activation complete - check if buff is visible and stat is increased');
    }

    // Debug function - can be called from console via 'window.bridgetPassiveInstance.debugLowTidePower()'
    debugLowTidePower() {
        console.log('[DEBUG] Manually testing Low Tide Power talent');
        
        if (!this.character) {
            console.error('[DEBUG] No character reference available');
            return 'ERROR: No character reference';
        }
        
        if (!this.character.lowTidePowerActive) {
            console.log('[DEBUG] Setting lowTidePowerActive to true for testing');
            this.character.lowTidePowerActive = true;
            this.lowTidePowerActive = true;
        }
        
        console.log('[DEBUG] Current mana:', this.character.stats.currentMana, 
                    'Max mana:', this.character.stats.maxMana,
                    'Ratio:', this.character.stats.currentMana / this.character.stats.maxMana);
        
        // Force a check
        this.checkLowTidePower();
        
        // Check if it's working
        const hasBuff = this.character.buffs.some(b => b.id === 'low_tide_power_buff');
        console.log('[DEBUG] Low Tide Power buff active after check:', hasBuff);
        
        // Return status for console output
        return {
            character: this.character.name,
            manaRatio: this.character.stats.currentMana / this.character.stats.maxMana,
            buffActive: hasBuff,
            lowTideBonusActive: this.character.lowTideBonusActive
        };
    }

    // Add methods for Aquatic Resonance talent
    setupAquaticResonance() {
        // RE-VALIDATE TALENT PRESENCE AT THE START OF SETUP
        if (!this.character || !this.character.appliedTalents || !this.character.appliedTalents.includes('aquatic_resonance')) {
            console.log('[BridgetPassiveHandler setupAquaticResonance] Aborted: Character missing or Aquatic Resonance talent NOT in appliedTalents.');
            // Ensure internal flags are also false if talent is somehow missing here
            this.aquaticResonanceActive = false;
            if (this.character) this.character.aquaticResonanceActive = false;
            return;
        }
        // If we reach here, talent is confirmed active
        this.aquaticResonanceActive = true;
        this.character.aquaticResonanceActive = true;

        console.log('[BridgetPassiveHandler setupAquaticResonance] Setting up Aquatic Resonance for', this.character.name, '(Talent confirmed in appliedTalents)');

        // Remove existing listeners first to prevent duplicates
        if (this.buffChangeListener) {
            document.removeEventListener('BuffApplied', this.buffChangeListener);
            document.removeEventListener('BuffRemoved', this.buffChangeListener);
            // document.removeEventListener('turnEnded', this.buffChangeListener); // REMOVE turnEnded listener
            this.buffChangeListener = null;
        }
        // if (this.aquaticResonanceInterval) { // REMOVE interval logic
        //     clearInterval(this.aquaticResonanceInterval);
        //     this.aquaticResonanceInterval = null;
        // }

        // Define the listener function
        this.buffChangeListener = (event) => {
            // Check if the event is relevant to this character
            const characterInEvent = event?.detail?.character || event?.detail?.target;
            if (characterInEvent && (characterInEvent.id === this.character.id || characterInEvent.instanceId === this.character.instanceId)) {
                console.log(`[BridgetPassiveHandler] Buff change event (${event.type}) detected for Bridget. Updating Aquatic Resonance...`);
                // Use requestAnimationFrame or setTimeout to delay the update slightly,
                // ensuring the buff list is fully updated before recalculating.
                requestAnimationFrame(() => this.updateAquaticResonance());
            }
        };

        // Setup specific buff change listeners
        console.log("[BridgetPassiveHandler] Adding BuffApplied and BuffRemoved listeners for Aquatic Resonance.");
        document.addEventListener('BuffApplied', this.buffChangeListener);
        document.addEventListener('BuffRemoved', this.buffChangeListener);
        // document.addEventListener('turnEnded', this.buffChangeListener); // REMOVE turnEnded listener

        // Keep interval check as a safety net, but maybe less frequent
        // this.aquaticResonanceInterval = setInterval(() => { // REMOVE interval logic
        //     // Optional: Only run interval check if buff listeners haven't triggered recently?
        //     // For now, keep it simple.
        //     console.log("[BridgetPassiveHandler] Interval check for Aquatic Resonance.");
        //     this.updateAquaticResonance();
        // }, 5000); // Check every 5 seconds as a fallback

        console.log('[BridgetPassiveHandler] Aquatic Resonance setup completed with specific listeners.');

        // Ensure initial update
        this.updateAquaticResonance();

        // Add this to the character class for manual triggering
        if (this.character) {
            this.character.updateAquaticResonance = () => this.updateAquaticResonance();
        }
    }

    updateAquaticResonance() {
        if (!this.character || this.character.isDead()) return; // Add isDead check

        // Explicitly check the appliedTalents array *every time* as the source of truth
        const isTalentActuallyActive = this.character.appliedTalents && this.character.appliedTalents.includes('aquatic_resonance');
        
        // Update the boolean flags based on the direct check
        this.aquaticResonanceActive = isTalentActuallyActive; 
        this.character.aquaticResonanceActive = isTalentActuallyActive; 

        if (!isTalentActuallyActive) { // Use the directly checked variable
            console.log('[BridgetPassiveHandler update] Aquatic Resonance talent is NOT active (checked appliedTalents). Removing buff if present.');
            this.removeAquaticResonanceBuff(); 
            return;
        }

        console.log('[BridgetPassiveHandler update] Updating Aquatic Resonance (Talent confirmed active via appliedTalents)');

        // Calculate buffs excluding the Aquatic Resonance buff itself
        const buffs = this.character.buffs.filter(buff => buff && buff.id !== 'aquatic_resonance_buff');
        const buffCount = buffs.length;

        console.log(`[BridgetPassiveHandler update] Found ${buffCount} active buffs (excluding self):`, buffs.map(b => b.id || b.name));

        const existingBuff = this.character.buffs.find(buff => buff && buff.id === 'aquatic_resonance_buff');

        // If there are no buffs and no existing buff, nothing to do
        if (buffCount === 0 && !existingBuff) {
            console.log('[BridgetPassiveHandler update] No buffs and no existing resonance buff, nothing to do');
            return;
        }

        // If there are no buffs but there is an existing buff, remove it
        if (buffCount === 0 && existingBuff) {
            console.log('[BridgetPassiveHandler update] No buffs but resonance buff exists, removing it');
            this.removeAquaticResonanceBuff();
            return;
        }

        // If buffCount > 0, proceed to apply or update
        if (buffCount > 0) {
            const critDamageBonus = buffCount * 0.10; // 10% per buff
            const magicalDamageBonus = buffCount * 20; // 20 per buff
            console.log(`[BridgetPassiveHandler update] Calculated bonuses: +${(critDamageBonus * 100).toFixed(0)}% Crit Damage, +${magicalDamageBonus} Magic Damage`);

            if (existingBuff) {
                console.log('[BridgetPassiveHandler update] Updating existing resonance buff');
                let needsUpdate = false;

                // Ensure statModifiers is an array
                if (!Array.isArray(existingBuff.statModifiers)) {
                    existingBuff.statModifiers = [];
                }

                let critModifier = existingBuff.statModifiers.find(mod => mod.stat === 'critDamage');
                let magicalModifier = existingBuff.statModifiers.find(mod => mod.stat === 'magicalDamage');

                if (!critModifier) {
                    critModifier = { stat: 'critDamage', value: 0, operation: 'add' };
                    existingBuff.statModifiers.push(critModifier);
                    needsUpdate = true;
                } else if (critModifier.value !== critDamageBonus) {
                    needsUpdate = true;
                }

                if (!magicalModifier) {
                    magicalModifier = { stat: 'magicalDamage', value: 0, operation: 'add' };
                    existingBuff.statModifiers.push(magicalModifier);
                    needsUpdate = true;
                } else if (magicalModifier.value !== magicalDamageBonus) {
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log("[BridgetPassiveHandler update] Resonance buff needs update.");
                    // --- Force remove previous effect before updating --- 
                    if (typeof existingBuff.onRemove === 'function') {
                        try {
                             console.log("[BridgetPassiveHandler update] Calling existingBuff.onRemove before update");
                             existingBuff.onRemove(this.character);
                        } catch(e) { console.error("Error in existing onRemove:", e); }
                    }
                    // --- End force remove --- 

                    // Update values
                    critModifier.value = critDamageBonus;
                    magicalModifier.value = magicalDamageBonus;
                    existingBuff.description = `Increases Critical Damage by ${(critDamageBonus * 100).toFixed(0)}% and Magical Damage by ${magicalDamageBonus} based on ${buffCount} active buffs.`;

                    // --- Force apply new effect --- 
                     if (typeof existingBuff.onApply === 'function') {
                        try {
                            console.log("[BridgetPassiveHandler update] Calling existingBuff.onApply after update");
                            existingBuff.onApply(this.character);
                        } catch(e) { console.error("Error in existing onApply:", e); }
                    }
                    // --- End force apply --- 

                    console.log(`[BridgetPassiveHandler update] Updated Aquatic Resonance: ${buffCount} buffs, CritBonus=${critDamageBonus}, MagBonus=${magicalDamageBonus}`);
                    this.showAquaticResonanceUpdateVFX(buffCount, critDamageBonus, magicalDamageBonus);
                     // Recalculate stats AFTER potentially applying effects directly
                    this.character.recalculateStats('aquatic_resonance_updated');
                    this.debugResonanceStatus(); // Log status after update
                } else {
                    console.log('[BridgetPassiveHandler update] No update needed for Aquatic Resonance buff values.');
                    console.log('[BridgetPassive update] No update needed for Aquatic Resonance buff values.');
                     // Even if values didn't change, force a recalculate to be safe?
                    // this.character.recalculateStats('aquatic_resonance_no_change');
                }
            } else {
                console.log('[BridgetPassive update] Creating new Aquatic Resonance buff');
                this.applyAquaticResonanceBuff(buffCount, critDamageBonus, magicalDamageBonus);
            }
        }

        // Final UI update
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(this.character);
        }
    }

    applyAquaticResonanceBuff(buffCount, critDamageBonus, magicalDamageBonus) {
        // ... (rest of applyAquaticResonanceBuff remains the same, ensure onApply/onRemove directly modify stats)
         console.log(`[BridgetPassive apply] Applying new Aquatic Resonance buff: ${buffCount} buffs, +${(critDamageBonus * 100).toFixed(0)}% Crit Damage, +${magicalDamageBonus} Magic Damage`);
         
         // Log original stats for debugging
         console.log('[BridgetPassive apply] Original stats before buff:',
                     'critDamage:', this.character.stats.critDamage,
                     'magicalDamage:', this.character.stats.magicalDamage);
         
         // Create the buff using the Effect class
         const resonanceBuff = new Effect(
             'aquatic_resonance_buff',
             'Aquatic Resonance',
             'Icons/talents/water_amplify.webp',
             -1, // Permanent (updated when buffs change)
             null, // No per-turn effect
             false // Not a debuff
         );
         
         resonanceBuff.description = `Increases Critical Damage by ${(critDamageBonus * 100).toFixed(0)}% and Magical Damage by ${magicalDamageBonus} based on ${buffCount} active buffs.`;
         
         resonanceBuff.statModifiers = [
             {
                 stat: 'critDamage',
                 value: critDamageBonus,
                 operation: 'add'
             },
             {
                 stat: 'magicalDamage',
                 value: magicalDamageBonus,
                 operation: 'add'
             }
         ];
         
         console.log('[BridgetPassive DEBUG] Created resonance buff with statModifiers:', JSON.stringify(resonanceBuff.statModifiers));
         
         // Define DIRECT stat modification logic within onApply/onRemove
         resonanceBuff.onApply = (target) => {
             console.log(`[BridgetPassive apply] ResonanceBuff.onApply: Applying buff visuals/state.`);
             // REMOVED direct stat modification
             // target.stats.critDamage = (target.stats.critDamage || 1.5) + critDamageBonus;
             // target.stats.magicalDamage = (target.stats.magicalDamage || 0) + magicalDamageBonus;
             
             // Optional: Report change intent (stats will be updated by recalculate)
             // if (target.reportStatChange) {
             //     target.reportStatChange('critDamage', critDamageBonus, 'add', 'Aquatic Resonance');
             //     target.reportStatChange('magicalDamage', magicalDamageBonus, 'add', 'Aquatic Resonance');
             // }
             return true;
         };
         
         resonanceBuff.onRemove = (target) => {
             console.log(`[BridgetPassive apply] ResonanceBuff.onRemove: Removing buff visuals/state.`);
             // REMOVED direct stat modification
             // const currentCritBonus = resonanceBuff.statModifiers.find(m => m.stat === 'critDamage')?.value || 0;
             // const currentMagBonus = resonanceBuff.statModifiers.find(m => m.stat === 'magicalDamage')?.value || 0;
             // if (target.stats.critDamage) target.stats.critDamage -= currentCritBonus;
             // if (target.stats.magicalDamage) target.stats.magicalDamage -= currentMagBonus;
             
             // Optional: Report change intent
             // if (target.reportStatChange) {
             //     target.reportStatChange('critDamage', -currentCritBonus, 'add', 'Aquatic Resonance removed');
             //     target.reportStatChange('magicalDamage', -currentMagBonus, 'add', 'Aquatic Resonance removed');
             // }
             return true;
         };
         
         // Apply the buff to the character
         const success = this.character.addBuff(resonanceBuff);
         console.log(`[BridgetPassive apply] Buff application success: ${success}`);
         
         // Verify buff was added and check its statModifiers
         const addedBuff = this.character.buffs.find(buff => buff.id === 'aquatic_resonance_buff');
         if (addedBuff) {
             console.log('[BridgetPassive DEBUG] Buff found in character.buffs:', addedBuff.id);
             console.log('[BridgetPassive DEBUG] Buff statModifiers after adding:', JSON.stringify(addedBuff.statModifiers));
         } else {
             console.error('[BridgetPassive DEBUG] Buff NOT found in character.buffs after adding!');
         }
         
         // Force apply the effect regardless of addBuff success (important!)
         try {
             console.log("[BridgetPassive apply] Directly calling onApply for the new buff.");
             resonanceBuff.onApply(this.character);
         } catch (e) {
             console.error('[BridgetPassive apply] Error during direct effect application:', e);
         }
         
         this.character.aquaticResonanceBuff = true;
         
         if (window.gameManager?.addLogEntry) {
             window.gameManager.addLogEntry(
                 `${this.character.name}'s Aquatic Resonance activates! +${(critDamageBonus * 100).toFixed(0)}% Crit Damage and +${magicalDamageBonus} Magic Damage from ${buffCount} buffs.`, 
                 'talent-effect'
             );
         }
         
         this.showAquaticResonanceActivateVFX(buffCount, critDamageBonus, magicalDamageBonus);
         
         // Recalculate stats AFTER applying effects directly
         this.character.recalculateStats('aquatic_resonance_applied');
         
         const elementId = this.character.instanceId || this.character.id;
         const charElement = document.getElementById(`character-${elementId}`);
         if (charElement) {
             charElement.classList.add('aquatic-resonance-active');
         }
         
         console.log('[BridgetPassive apply] Final stats after buff application:',
                      'critDamage:', this.character.stats.critDamage,
                      'magicalDamage:', this.character.stats.magicalDamage);
         
         if (typeof window.updateCharacterUI === 'function') {
             window.updateCharacterUI(this.character);
         }
         
         // this.debugResonanceStatus();
    }

    removeAquaticResonanceBuff() {
        if (!this.character) return;

        const existingBuff = this.character.buffs.find(buff => buff && buff.id === 'aquatic_resonance_buff');

        if (existingBuff) {
            console.log('[BridgetPassive remove] Removing Aquatic Resonance buff');
            // --- Call onRemove BEFORE removing from array --- 
            if (typeof existingBuff.onRemove === 'function') {
                try {
                     console.log("[BridgetPassive remove] Calling existingBuff.onRemove.");
                    existingBuff.onRemove(this.character); // This now only handles potential side-effects, not stats
                } catch (e) {
                     console.error('[BridgetPassive remove] Error during onRemove:', e);
                }
            }
            // --- End call onRemove --- 

            // Remove the buff from the array
            this.character.removeBuff('aquatic_resonance_buff');

            this.character.aquaticResonanceBuff = false;

            if (window.gameManager?.addLogEntry) {
                window.gameManager.addLogEntry(`${this.character.name}'s Aquatic Resonance deactivated.`, 'talent-effect');
            }

            const elementId = this.character.instanceId || this.character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                charElement.classList.remove('aquatic-resonance-active');
            }

            // Recalculate stats AFTER removing the buff and its effects
            this.character.recalculateStats('aquatic_resonance_removed');

            if (typeof window.updateCharacterUI === 'function') {
                window.updateCharacterUI(this.character);
            }
             console.log('[BridgetPassive remove] Finished removing resonance buff and updating stats.');
             // this.debugResonanceStatus(); // REMOVED
        } else {
             // console.log('[BridgetPassive remove] No Aquatic Resonance buff found to remove.');
        }
    }

    // ... (rest of the methods: debugResonanceStatus, forceApplyAquaticResonance, etc.) ...

    calculateAquaticResonanceBonus() {
        if (!this.character || !this.aquaticResonanceActive) return { buffCount: 0, critDamageBonus: 0, magicalDamageBonus: 0 };
        
        // Count buffs excluding the Aquatic Resonance buff itself
        const buffs = this.character.buffs.filter(buff => buff.id !== 'aquatic_resonance_buff');
        const buffCount = buffs.length;
        
        // Calculate bonuses
        const critDamageBonus = buffCount * 0.10; // 10% per buff
        const magicalDamageBonus = buffCount * 20; // 20 per buff
        
        return {
            buffCount,
            critDamageBonus,
            magicalDamageBonus
        };
    }

    showAquaticResonanceActivateVFX(buffCount, critDamageBonus, magicalDamageBonus) {
        if (!this.character) return;
        
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create the main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'aquatic-resonance-activate-vfx';
        charElement.appendChild(vfxContainer);
        
        // Add glowing aura
        const auraElement = document.createElement('div');
        auraElement.className = 'aquatic-resonance-aura';
        vfxContainer.appendChild(auraElement);
        
        // Add text showing the bonuses
        const bonusText = document.createElement('div');
        bonusText.className = 'aquatic-resonance-text';
        bonusText.innerHTML = `
            <span class="crit-bonus">+${(critDamageBonus * 100).toFixed(0)}% CRIT DMG</span>
            <span class="mag-bonus">+${magicalDamageBonus} MAG DMG</span>
            <span class="buff-count">${buffCount} BUFFS</span>
        `;
        vfxContainer.appendChild(bonusText);
        
        // Add water particles swirling around
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'aquatic-resonance-particle';
            
            // Set random position
            const angle = (i / 12) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            particle.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
            particle.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
            
            // Set animation delay
            particle.style.animationDelay = `${i * 0.1}s`;
            
            vfxContainer.appendChild(particle);
        }
        
        // Play sound if available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/buff_applied.mp3', 0.6);
        }
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode === charElement) {
                charElement.removeChild(vfxContainer);
            }
        }, 3000);
    }

    showAquaticResonanceUpdateVFX(buffCount, critDamageBonus, magicalDamageBonus) {
        if (!this.character) return;
        
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (!charElement) return;
        
        // Create a smaller update VFX
        const updateVfx = document.createElement('div');
        updateVfx.className = 'aquatic-resonance-update-vfx';
        charElement.appendChild(updateVfx);
        
        // Add the updated text
        const updateText = document.createElement('div');
        updateText.className = 'aquatic-resonance-update-text';
        updateText.innerHTML = `
            <span class="buff-count">${buffCount} BUFFS</span>
            <span class="crit-bonus">+${(critDamageBonus * 100).toFixed(0)}% CRIT DMG</span>
            <span class="mag-bonus">+${magicalDamageBonus} MAG DMG</span>
        `;
        updateVfx.appendChild(updateText);
        
        // Play a subtle sound
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/buff_refresh.mp3', 0.4);
        }
        
        // Show floating text
        if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
            window.gameManager.showFloatingText(
                `character-${elementId}`,
                `Resonance: ${buffCount} Buffs`,
                'buff'
            );
        }
        
        // Remove after animation
        setTimeout(() => {
            if (updateVfx.parentNode === charElement) {
                charElement.removeChild(updateVfx);
            }
        }, 2000);
    }

    // Add method to force refresh all talents and their effects
    forceRefreshTalents() {
        if (!this.character || !this.character.appliedTalents) return;
        
        console.log('[BridgetPassive] Force refreshing talents and their effects');
        
        // Re-check applied talents
        const hasTalent = (talentId) => {
            return this.character.appliedTalents.includes(talentId);
        };
        
        // Update talent properties
        this.oceanicHarmonyActive = this.character.oceanicHarmonyActive = hasTalent('oceanic_harmony');
        this.critReducesCooldowns = this.character.critReducesCooldowns = hasTalent('critical_cooldown');
        this.clamProtectionAuraActive = this.character.clamProtectionAuraActive = hasTalent('clam_protection_aura');
        this.abyssalMarkActive = this.character.abyssalMarkActive = hasTalent('tidal_mark');
        this.fluidEvasionActive = this.character.fluidEvasionActive = hasTalent('evasive_insight');
        this.lowTidePowerActive = this.character.lowTidePowerActive = hasTalent('low_tide_power');
        this.aquaticResonanceActive = this.character.aquaticResonanceActive = hasTalent('aquatic_resonance');
        this.endlessCascadeActive = this.character.endlessCascadeActive = hasTalent('endless_cascade');
        
        console.log('[BridgetPassive] Updated talent states:', {
            oceanicHarmony: this.oceanicHarmonyActive,
            criticalCooldown: this.critReducesCooldowns,
            clamProtection: this.clamProtectionAuraActive,
            abyssalMark: this.abyssalMarkActive,
            fluidEvasion: this.fluidEvasionActive,
            lowTidePower: this.lowTidePowerActive,
            aquaticResonance: this.aquaticResonanceActive,
            endlessCascade: this.endlessCascadeActive
        });
        
        // Re-initialize effects for active talents
        if (this.lowTidePowerActive) {
            this.setupLowTidePowerCheck();
            this.checkLowTidePower();
        }
        
        if (this.aquaticResonanceActive) {
            this.setupAquaticResonance();
            this.updateAquaticResonance();
        }
        
        // Force stat recalculation
        if (this.character.recalculateStats) {
            console.log('[BridgetPassive] Forcing stat recalculation');
            this.character.recalculateStats('talent_refresh');
        }
        
        // Update UI
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(this.character);
        }
        
        // Update description
        this.updateDescription();
        
        return true;
    }

    // Add a function to force apply Aquatic Resonance
    forceApplyAquaticResonance() {
        if (!this.character) {
            console.error('[BridgetPassive] Cannot force apply Aquatic Resonance: no character reference');
            return false;
        }
        
        console.log('[BridgetPassive] Force applying Aquatic Resonance talent effect');
        
        // Make sure the talent is marked as active
        if (!this.character.appliedTalents.includes('aquatic_resonance')) {
            console.log('[BridgetPassive] Adding aquatic_resonance to appliedTalents');
            this.character.appliedTalents.push('aquatic_resonance');
        }
        
        this.character.aquaticResonanceActive = true;
        this.aquaticResonanceActive = true;
        
        // Remove any existing resonance buff to ensure clean slate
        this.removeAquaticResonanceBuff();
        
        // Calculate buffs and bonuses
        const buffs = this.character.buffs.filter(buff => buff.id !== 'aquatic_resonance_buff');
        const buffCount = buffs.length;
        
        // Add at least one dummy buff if no buffs exist, for testing
        let addedDummyBuff = false;
        if (buffCount === 0) {
            console.log('[BridgetPassive] No buffs found, adding a dummy buff for testing');
            const dummyBuff = new Effect(
                'dummy_test_buff',
                'Test Buff',
                'Icons/buffs/test.webp',
                3,  // 3 turn duration
                null,
                false
            );
            dummyBuff.description = 'Test buff for Aquatic Resonance';
            this.character.addBuff(dummyBuff);
            addedDummyBuff = true;
        }
        
        // Force update Aquatic Resonance
        this.updateAquaticResonance();
        
        // Print status after applying
        this.debugResonanceStatus();
        
        // Add to global for easy access from console
        window.forceAquaticResonance = () => this.forceApplyAquaticResonance();
        
        console.log('[BridgetPassive] Force apply complete. Check character stats to verify effect.');
        if (addedDummyBuff) {
            console.log('[BridgetPassive] Added temporary test buff. It will expire in 3 turns.');
        }
        
        return true;
    }

    setupBubblePop() {
        console.log(`[BridgetPassive setupBubblePop] Setting up Bubble Pop debuff application...`);
        
        // Set a flag to prevent adding multiple listeners
        if (this.bubblePopListenerAdded) {
            console.log(`[BridgetPassive setupBubblePop] Bubble Pop listener already added, skipping.`);
            return;
        }
        
        // Listen to the global TurnStart event dispatched on the document
        const bubblePopListener = (event) => {
            console.log(`[BridgetPassive bubblePopListener] TurnStart event received:`, event);
            
            // Check if it's the player's phase and this character is active
            const gameManager = window.gameManager;
            if (gameManager && gameManager.gameState && gameManager.gameState.phase === 'player' && event.detail && event.detail.turn) {
                console.log(`[BridgetPassive bubblePopListener] TurnStart in player phase for turn ${event.detail.turn}`);
                
                // We don't need event.character, just check if this instance's character is alive
                if (this.character && !this.character.isDead()) {
                    console.log(`[BridgetPassive bubblePopListener] Applying Bubble Pop for ${this.character.name} (talent active: ${this.bubblePopActive})`);
                    this.applyBubblePopDebuff();
                } else {
                    console.log(`[BridgetPassive bubblePopListener] Character ${this.character?.name} is dead or null, skipping.`);
                }
            } else {
                console.log(`[BridgetPassive bubblePopListener] TurnStart ignored. Phase: ${gameManager?.gameState?.phase}, Detail Turn: ${event?.detail?.turn}`);
            }
        };
        
        // Use the correct event name and attach to document
        const eventName = 'TurnStart'; 
        document.addEventListener(eventName, bubblePopListener);
        this.eventListeners.push({ type: eventName, listener: bubblePopListener });
        this.bubblePopListenerAdded = true;
        console.log(`[BridgetPassive setupBubblePop] Added TurnStart listener to document for Bubble Pop.`);
        
        // Add another listener for debugging
        console.log(`[BridgetPassive] Adding manual test trigger for debugging`);
        const testTriggerListener = (event) => {
            if (event.key === '9') {
                console.log(`[BridgetPassive DEBUG] Manually triggering Bubble Pop!`);
                this.applyBubblePopDebuff();
            }
        };
        document.addEventListener('keydown', testTriggerListener);
        this.eventListeners.push({ type: 'keydown', listener: testTriggerListener });
    }
    
    applyBubblePopDebuff() {
        console.log(`[BridgetPassive applyBubblePopDebuff] Attempting to apply debuff for ${this.character?.name}`);
        if (!this.character || this.character.isDead() || !this.bubblePopActive) {
            console.log(`[BridgetPassive applyBubblePopDebuff] Aborting: Character dead, null, or talent inactive (${this.bubblePopActive}).`);
            return;
        }
        
        const gameManager = window.gameManager;
        if (!gameManager) {
            console.error('[BridgetPassive applyBubblePopDebuff] GameManager not found!');
            return;
        }
        
        const enemies = gameManager.getOpponents(this.character);
        const validEnemies = enemies.filter(enemy => enemy && !enemy.isDead());
        
        console.log(`[BridgetPassive applyBubblePopDebuff] Found ${validEnemies.length} valid enemies.`);
        if (validEnemies.length === 0) return;
        
        // Select a random enemy
        const randomEnemy = validEnemies[Math.floor(Math.random() * validEnemies.length)];
        console.log(`[BridgetPassive applyBubblePopDebuff] Selected target: ${randomEnemy.name}`);
        
        // Create bubble pop debuff
        const debuffId = `${this.bubblePopDebuffId}_${Date.now()}`; // Unique ID per application
        const currentMagicalDamage = this.character.stats.magicalDamage || 0; // Get current damage
        
        const bubblePopDebuff = new Effect(
            debuffId,
            "Bubble Pop",
            "Icons/abilities/bridget/bubble_pop.webp",
            2, // 2 turn duration
            null, // Effect logic is handled by onRemove
            true // isDebuff
        );

        // Store damage value at the time of application
        bubblePopDebuff.popDamage = currentMagicalDamage; 
        bubblePopDebuff.casterId = this.character.instanceId || this.character.id;

        // Define the onRemove function which triggers the pop
        bubblePopDebuff.onRemove = (target) => {
            console.log(`[BridgetPassive BubblePop onRemove] Triggered for ${target.name}.`);
            const caster = gameManager.gameState.playerCharacters.find(c => (c.instanceId || c.id) === bubblePopDebuff.casterId);
            
            if (!target.isDead() && caster && !caster.isDead()) {
                const damageToDeal = bubblePopDebuff.popDamage || 0; // Use stored damage
                console.log(`[BridgetPassive BubblePop onRemove] Popping bubble on ${target.name} for ${damageToDeal} damage.`);
                
                // Apply damage
                const damageOptions = { isBubblePop: true, bypassMagicalShield: false }; // Ensure it doesn't bypass shield unless specified
                const result = target.applyDamage(damageToDeal, 'magical', caster, damageOptions);
                
                // Show VFX
                this.showBubblePopVFX(target, result.damage); // Show VFX with actual damage dealt
                
                // Log the effect
                gameManager.addLogEntry(`${caster.name}'s Bubble Pop burst on ${target.name}, dealing ${result.damage} magical damage!`, 'critical');
                if (result.isCritical) { // Log if the damage critically hit
                    gameManager.addLogEntry(`(Bubble Pop Critical Hit!)`, 'critical');
                }

                // --- ADDED: Trigger Bridget's passive healing from Bubble Pop damage ---
                if (result.damage > 0 && caster.id === 'bridget' && caster.passiveHandler && typeof caster.passiveHandler.applyPassiveHealing === 'function') {
                    console.log(`[BridgetPassive BubblePop] Triggering passive heal for ${result.damage} damage.`);
                    caster.passiveHandler.applyPassiveHealing(result.damage);
                }
                // --- END ADDED ---

            } else {
                console.log(`[BridgetPassive BubblePop onRemove] Pop skipped: Target dead (${target.isDead()}) or Caster dead/not found (${!caster || caster.isDead()}).`);
            }
        };
        
        // Set description including the stored damage
        bubblePopDebuff.setDescription(`A magical bubble that will pop after 2 turns, dealing ${bubblePopDebuff.popDamage} magical damage.`);
        
        // Apply the debuff to the enemy
        randomEnemy.addDebuff(bubblePopDebuff);
        console.log(`[BridgetPassive applyBubblePopDebuff] Applied debuff ${debuffId} to ${randomEnemy.name}`);
        
        // Show application VFX
        this.showBubblePopApplicationVFX(randomEnemy);
        
        // Log the effect
        gameManager.addLogEntry(`${this.character.name} placed a Bubble Pop on ${randomEnemy.name}!`, 'system');
    }
    
    showBubblePopApplicationVFX(target) {
        const targetElement = document.getElementById(`character-${target.id}`);
        if (!targetElement) return;
        
        // Create bubble application VFX
        const bubbleAppVFX = document.createElement('div');
        bubbleAppVFX.className = 'bridget-bubble-pop-application';
        targetElement.appendChild(bubbleAppVFX);
        
        // Create bubble element
        const bubble = document.createElement('div');
        bubble.className = 'bubble-pop-bubble';
        bubbleAppVFX.appendChild(bubble);
        
        // Create text element
        const bubbleText = document.createElement('div');
        bubbleText.className = 'bubble-pop-text';
        bubbleText.textContent = 'Bubble Pop';
        bubbleAppVFX.appendChild(bubbleText);
        
        // Create particles
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'bubble-pop-particle';
            bubble.appendChild(particle);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (bubbleAppVFX && bubbleAppVFX.parentNode) {
                bubbleAppVFX.parentNode.removeChild(bubbleAppVFX);
            }
        }, 2500);
    }
    
    showBubblePopVFX(target, damage) {
        const targetElement = document.getElementById(`character-${target.id}`);
        if (!targetElement) return;
        
        // Create pop VFX container
        const popVFX = document.createElement('div');
        popVFX.className = 'bridget-bubble-pop-vfx';
        targetElement.appendChild(popVFX);
        
        // Create burst element
        const burst = document.createElement('div');
        burst.className = 'bubble-pop-burst';
        popVFX.appendChild(burst);
        
        // Create damage text
        const damageText = document.createElement('div');
        damageText.className = 'bubble-pop-damage';
        damageText.textContent = damage;
        popVFX.appendChild(damageText);
        
        // Create water droplets
        for (let i = 0; i < 8; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'bubble-pop-droplet';
            droplet.style.setProperty('--angle', `${i * 45}deg`);
            popVFX.appendChild(droplet);
        }
        
        // Create splash particles
        for (let i = 0; i < 12; i++) {
            const splash = document.createElement('div');
            splash.className = 'bubble-pop-splash';
            splash.style.setProperty('--angle', `${i * 30}deg`);
            splash.style.setProperty('--delay', `${Math.random() * 0.3}s`);
            popVFX.appendChild(splash);
        }
        
        // Add a blue flash to the target
        targetElement.classList.add('bubble-pop-flash');
        
        // Remove flash class and cleanup VFX after animation completes
        setTimeout(() => {
            targetElement.classList.remove('bubble-pop-flash');
            if (popVFX && popVFX.parentNode) {
                popVFX.parentNode.removeChild(popVFX);
            }
        }, 2500);
    }

    // Add this new method to directly read from appliedTalents
    forceRefreshTalentsFromApplied() {
        if (!this.character || !this.character.appliedTalents) {
            console.log('[BridgetPassive] forceRefreshTalentsFromApplied: No character or appliedTalents array');
            return;
        }
        
        const character = this.character;
        const hasTalent = (talentId) => {
            return character.appliedTalents && character.appliedTalents.includes(talentId);
        };
        
        // Update all talent flags based on appliedTalents array
        character.oceanicHarmonyActive = hasTalent('oceanic_harmony');
        character.critReducesCooldowns = hasTalent('critical_cooldown');
        character.clamProtectionAuraActive = hasTalent('clam_protection_aura');
        character.bubbleHealingActive = hasTalent('bubble_healing');
        character.abyssalMarkActive = hasTalent('tidal_mark');
        character.fluidEvasionActive = hasTalent('evasive_insight');
        character.endlessCascadeActive = hasTalent('endless_cascade');
        character.lowTidePowerActive = hasTalent('low_tide_power');
        character.chainWaveActive = hasTalent('chain_wave');
        character.enhancedBubbleBarrage = hasTalent('enhanced_barrage');
        character.aquaticResonanceActive = hasTalent('aquatic_resonance');
        character.tidalMasteryActive = hasTalent('tidal_mastery');
        character.bubblePopActive = hasTalent('bubble_pop');
        character.waterDanceActive = hasTalent('water_dance');
        character.enhancedBubbleShieldActive = hasTalent('enhanced_bubble_shield'); // New talent
        
        // Duplicate these values to the passive instance for consistency
        this.oceanicHarmonyActive = character.oceanicHarmonyActive;
        this.critReducesCooldowns = character.critReducesCooldowns;
        this.clamProtectionAuraActive = character.clamProtectionAuraActive;
        this.bubbleHealingActive = character.bubbleHealingActive;
        this.abyssalMarkActive = character.abyssalMarkActive;
        this.fluidEvasionActive = character.fluidEvasionActive;
        this.endlessCascadeActive = character.endlessCascadeActive;
        this.lowTidePowerActive = character.lowTidePowerActive;
        this.chainWaveActive = character.chainWaveActive;
        this.enhancedBubbleBarrage = character.enhancedBubbleBarrage;
        this.aquaticResonanceActive = character.aquaticResonanceActive;
        this.tidalMasteryActive = character.tidalMasteryActive;
        this.bubblePopActive = character.bubblePopActive;
        this.waterDanceActive = character.waterDanceActive;
        this.enhancedBubbleShieldActive = character.enhancedBubbleShieldActive; // New talent
        
        console.log(`[BridgetPassive] Talent refresh complete:
            Oceanic Harmony: ${this.oceanicHarmonyActive}
            Critical Cooldown: ${this.critReducesCooldowns}
            Clam Protection: ${this.clamProtectionAuraActive}
            Bubble Healing: ${this.bubbleHealingActive}
            Abyssal Mark: ${this.abyssalMarkActive}
            Fluid Evasion: ${this.fluidEvasionActive}
            Endless Cascade: ${this.endlessCascadeActive}
            Low Tide Power: ${this.lowTidePowerActive}
            Chain Wave: ${this.chainWaveActive}
            Enhanced Barrage: ${this.enhancedBubbleBarrage}
            Aquatic Resonance: ${this.aquaticResonanceActive}
            Tidal Mastery: ${this.tidalMasteryActive}
            Bubble Pop: ${this.bubblePopActive}
            Water Dance: ${this.waterDanceActive}
            Enhanced Bubble Shield: ${this.enhancedBubbleShieldActive}
        `);
        
        // Re-check for Low Tide Power
        if (this.lowTidePowerActive && !this.lowTideCheckInterval) {
            this.setupLowTidePowerCheck();
        }
        
        // Re-check for Aquatic Resonance
        if (this.aquaticResonanceActive) {
            this.updateAquaticResonance();
        }
        
        // Refresh description
        this.updateDescription();
    }

    // Handler for ability used event for Resonant Cascade talent
    onAbilityUsed(event) {
        console.log('[BridgetPassive] Ability used event received', event.detail);
        
        if (!this.resonantCascadeActive || !this.character) {
            console.log('[BridgetPassive] Resonant Cascade not active or character not set', {
                active: this.resonantCascadeActive,
                character: this.character?.id
            });
            return;
        }
        
        // Get the caster from the event using correct structure
        const caster = event.detail.caster;
        if (!caster || caster.id !== this.character.id) {
            console.log('[BridgetPassive] Not this character casting', {
                casterId: caster?.id,
                characterId: this.character?.id
            });
            return;
        }
        
        // Get the ability that was used
        const ability = event.detail.ability;
        if (!ability) {
            console.log('[BridgetPassive] No ability in event');
            return;
        }
        
        console.log('[BridgetPassive] Processing Resonant Cascade for ability', ability.name);
        
        // Get the target(s) from the event
        let targets = event.detail.target;
        if (!targets) {
            console.log('[BridgetPassive] No targets in event');
            return;
        }
        
        // If targets is not an array, convert it to an array
        if (!Array.isArray(targets)) {
            targets = [targets];
        }
        
        console.log('[BridgetPassive] Processing targets:', targets.map(t => t.name));
        
        // Process each target
        targets.forEach(target => {
            // Skip if target is dead or untargetable
            if (target.isDead() || target.isUntargetable()) return;
            
            // Queue up the cascade bubble for this target
            this.queueResonantCascadeBubble(target);
        });
        
        // Start processing animations if not already doing so
        if (!this.processingAnimations) {
            this.processNextAnimation();
        }
    }
    
    // Queue up a cascade bubble animation and effect
    queueResonantCascadeBubble(target) {
        const isEnemy = this.character.isEnemy !== target.isEnemy;
        
        this.bubbleAnimationQueue.push({
            target: target,
            isEnemy: isEnemy
        });
    }
    
    // Process the next animation in the queue
    processNextAnimation() {
        if (this.bubbleAnimationQueue.length === 0) {
            this.processingAnimations = false;
            return;
        }
        
        this.processingAnimations = true;
        const animation = this.bubbleAnimationQueue.shift();
        
        // Apply the effect based on whether the target is an enemy or ally
        this.applyCascadeBubbleEffect(animation.target, animation.isEnemy);
    }
    
    // Apply the resonant cascade bubble effect to the target
    applyCascadeBubbleEffect(target, isEnemy) {
        if (!this.character || !target) return;
        
        // Get the character's magical damage for scaling
        const magicalDamage = this.character.getStat('magicalDamage');
        let isCritical = false;
        
        // Check for critical hit/heal based on crit chance
        const critChance = this.character.getStat('critChance');
        if (Math.random() < critChance) {
            isCritical = true;
        }
        
        if (isEnemy) {
            // Apply damage to enemy
            let damage = magicalDamage; // This is the base damage for the cascade bubble
            
            // Apply critical modifier if applicable
            if (isCritical) {
                const critDamage = this.character.getStat('critDamage');
                damage *= critDamage; // Damage is now potentially crit-modified base damage
            }
            
            // Create projectile animation
            this.showResonantCascadeVFX(this.character, target, isEnemy, isCritical, () => {
                // Apply damage after animation completes
                setTimeout(() => {
                    // 'damage' here is the pre-calculated, potentially critical, damage for the bubble.
                    // target.applyDamage will handle further reductions (armor/shield)
                    const damageResult = target.applyDamage(damage, 'magical', this.character, { isCritical }); 
                    
                    // Add battle log entry (uses pre-mitigation damage for the log as per original)
                    const logMessage = `${this.character.name}'s Resonant Cascade deals ${damage.toFixed(0)} magical damage to ${target.name}${isCritical ? ' (Critical Hit!)' : ''}`;
                    gameManager.addLogEntry(logMessage, isCritical ? 'critical' : '');

                    // --- ADDED: Trigger Bridget's passive healing from Resonant Cascade damage ---
                    if (damageResult.damage > 0 && this.character.id === 'bridget') { // Ensure it's Bridget and damage was dealt
                        console.log(`[BridgetPassive ResonantCascade] Triggering passive heal for ${damageResult.damage} damage.`);
                        this.applyPassiveHealing(damageResult.damage); // Use actual damage dealt
                    }
                    // --- END ADDED ---
                    
                    // Process next animation
                    this.processNextAnimation();
                }, 300); // Small delay before damage applies
            });
        } else {
            // Apply healing to ally
            let healing = magicalDamage;
            
            // Apply critical modifier if applicable
            if (isCritical) {
                const critDamage = this.character.getStat('critDamage');
                healing *= critDamage;
            }
            
            // Create projectile animation
            this.showResonantCascadeVFX(this.character, target, isEnemy, isCritical, () => {
                // Apply healing after animation completes
                setTimeout(() => {
                    target.heal(healing, this.character, { isCritical });
                    
                    // Add battle log entry
                    const logMessage = `${this.character.name}'s Resonant Cascade heals ${target.name} for ${healing.toFixed(0)}${isCritical ? ' (Critical Heal!)' : ''}`;
                    gameManager.addLogEntry(logMessage, isCritical ? 'critical-heal' : 'heal');
                    
                    // Process next animation
                    this.processNextAnimation();
                }, 300); // Small delay before healing applies
            });
        }
    }
    
    // Show the visual effects for the cascade bubble
    showResonantCascadeVFX(source, target, isEnemy, isCritical, onComplete) {
        // Create the container for the animation
        const container = document.createElement('div');
        container.className = 'resonant-cascade-projectile-container';
        document.body.appendChild(container);
        
        // Get source and target positions
        const sourceElement = document.getElementById(source.domId);
        const targetElement = document.getElementById(target.domId);
        
        if (!sourceElement || !targetElement) {
            if (onComplete) onComplete();
            return;
        }
        
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Calculate start and end positions
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // Create bubble projectile
        const bubble = document.createElement('div');
        bubble.className = `resonant-cascade-bubble ${isEnemy ? 'damage' : 'healing'} ${isCritical ? 'critical' : ''}`;
        container.appendChild(bubble);
        
        // Create trail element
        const trail = document.createElement('div');
        trail.className = `resonant-cascade-trail ${isEnemy ? 'damage' : 'healing'}`;
        container.appendChild(trail);
        
        // Set initial position
        container.style.position = 'absolute';
        container.style.left = `${startX}px`;
        container.style.top = `${startY}px`;
        container.style.zIndex = '9999';
        
        // Calculate angle for trail rotation
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        trail.style.transform = `rotate(${angle}deg)`;
        
        // Calculate distance
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        // Animate the projectile
        const duration = Math.min(distance / 1.5, 800); // Speed adjusts with distance, but max 800ms
        const startTime = performance.now();
        
        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth motion
            const easedProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Calculate current position
            const currentX = startX + (endX - startX) * easedProgress;
            const currentY = startY + (endY - startY) * easedProgress;
            
            // Update position
            container.style.left = `${currentX}px`;
            container.style.top = `${currentY}px`;
            
            // Update trail length based on progress
            trail.style.width = `${distance * progress}px`;
            
            // If animation is still going
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete, show impact VFX
                if (isEnemy) {
                    this.showResonantCascadeImpactVFX(target, isCritical);
                } else {
                    this.showResonantCascadeHealVFX(target, isCritical);
                }
                
                // Remove the projectile
                setTimeout(() => {
                    container.remove();
                    if (onComplete) onComplete();
                }, 300);
            }
        }
        
        requestAnimationFrame(animate.bind(this));
    }
    
    // Show impact VFX for damage to enemies
    showResonantCascadeImpactVFX(target, isCritical) {
        const targetElement = document.getElementById(target.domId);
        if (!targetElement) return;
        
        const impactVFX = document.createElement('div');
        impactVFX.className = `resonant-cascade-impact-vfx ${isCritical ? 'critical' : ''}`;
        
        // Burst effect
        const burst = document.createElement('div');
        burst.className = 'cascade-burst';
        impactVFX.appendChild(burst);
        
        // Splash particles
        for (let i = 0; i < (isCritical ? 8 : 5); i++) {
            const particle = document.createElement('div');
            particle.className = 'cascade-particle';
            // Random directions for particles
            particle.style.setProperty('--random-x', Math.random() * 2 - 1);
            particle.style.setProperty('--random-y', Math.random() * 2 - 1);
            particle.style.animationDelay = `${i * 0.05}s`;
            impactVFX.appendChild(particle);
        }
        
        // Add to DOM
        targetElement.appendChild(impactVFX);
        
        // Remove after animation
        setTimeout(() => {
            impactVFX.remove();
        }, 1000);
    }
    
    // Show healing VFX for allies
    showResonantCascadeHealVFX(target, isCritical) {
        const targetElement = document.getElementById(target.domId);
        if (!targetElement) return;
        
        const healVFX = document.createElement('div');
        healVFX.className = `resonant-cascade-heal-vfx ${isCritical ? 'critical' : ''}`;
        
        // Healing glow
        const healGlow = document.createElement('div');
        healGlow.className = 'cascade-heal-glow';
        healVFX.appendChild(healGlow);
        
        // Rising bubbles
        for (let i = 0; i < (isCritical ? 8 : 5); i++) {
            const bubble = document.createElement('div');
            bubble.className = 'cascade-heal-bubble';
            bubble.style.animationDelay = `${i * 0.1}s`;
            bubble.style.left = `${20 + Math.random() * 60}%`;
            healVFX.appendChild(bubble);
        }
        
        // Add to DOM
        targetElement.appendChild(healVFX);
        
        // Remove after animation
        setTimeout(() => {
            healVFX.remove();
        }, 1500);
    }

    // Handler for talent applied event
    onTalentApplied(event) {
        console.log(`[BridgetPassive onTalentApplied] Event received for character ${event.detail.character?.id}, talent ${event.detail.talentId}. My character: ${this.character?.id}`);

        if (!this.character || !event.detail.character || event.detail.character.id !== this.character.id) {
            console.log('[BridgetPassive onTalentApplied] Event not for this character instance or character not set.');
            return;
        }

        const talentId = event.detail.talentId; // Specific talent ID from the event
        const talent = event.detail.talent;   // Talent object from the event (if present)

        // --- Robust handling for Healing Tsunami listener ---
        // Check the character's current selectedTalents array as the source of truth.
        const characterActuallyHasHealingTsunami = this.character.selectedTalents && this.character.selectedTalents.includes('healing_tsunami');

        if (characterActuallyHasHealingTsunami) {
            // Character has the talent. Ensure our listener is active.
            // this.healingTsunamiActive is the passive's internal flag for its listener state.
            if (!this.healingTsunamiActive) {
                console.log('[BridgetPassive onTalentApplied] Detected Healing Tsunami on character; current listener state is INACTIVE. Activating listener.');
                this.healingTsunamiActive = true; // Update internal state for listener management

                // Ensure the handler is bound (it should be from the constructor)
                if (!this._boundCheckHealingTsunamiTrigger) {
                    this._boundCheckHealingTsunamiTrigger = this.checkHealingTsunamiTrigger.bind(this);
                    console.warn('[BridgetPassive onTalentApplied] _boundCheckHealingTsunamiTrigger was not bound. Re-binding.');
                }
                // Remove listener first to prevent duplicates, then add.
                document.removeEventListener('TurnStart', this._boundCheckHealingTsunamiTrigger);
                document.addEventListener('TurnStart', this._boundCheckHealingTsunamiTrigger);
                console.log("[BridgetPassive onTalentApplied] Healing Tsunami 'TurnStart' listener ADDED or RE-ADDED.");
            } else {
                console.log('[BridgetPassive onTalentApplied] Healing Tsunami talent is present, and listener state is already ACTIVE.');
            }
        } else {
            // Character does NOT have the Healing Tsunami talent. Ensure our listener is INACTIVE.
            if (this.healingTsunamiActive) { // If our internal flag says it was active
                console.log('[BridgetPassive onTalentApplied] Healing Tsunami talent NOT on character (or removed); current listener state is ACTIVE. Deactivating listener.');
                this.healingTsunamiActive = false; // Update internal state
                if (this._boundCheckHealingTsunamiTrigger) {
                    document.removeEventListener('TurnStart', this._boundCheckHealingTsunamiTrigger);
                    console.log("[BridgetPassive onTalentApplied] Healing Tsunami 'TurnStart' listener REMOVED.");
                }
            } else {
                 // console.log('[BridgetPassive onTalentApplied] Healing Tsunami talent NOT on character, and listener state is already INACTIVE.');
            }
        }
        // --- End Healing Tsunami handling ---

        // Handle Resonant Cascade (existing logic from original file)
        if (talentId === 'resonant_cascade' || (talent && talent.id === 'resonant_cascade')) {
            console.log('[BridgetPassive onTalentApplied] Resonant Cascade talent applied/detected via specific talentId.');
            this.resonantCascadeActive = true;
        }

        // For the general bridget_talents_applied event (existing logic from original file)
        if (event.type === 'bridget_talents_applied') {
            console.log('[BridgetPassive onTalentApplied] Processing bulk "bridget_talents_applied" event.');
            const talentIdsFromBulkEvent = event.detail.talentIds || [];
            if (talentIdsFromBulkEvent.includes('resonant_cascade')) {
                console.log('[BridgetPassive onTalentApplied] Resonant Cascade talent detected in bulk application.');
                this.resonantCascadeActive = true;
            }
            // The Healing Tsunami logic above will handle it if 'healing_tsunami' is in talentIdsFromBulkEvent
            // because characterActuallyHasHealingTsunami would be true.
        }

        this.updateDescription(); // Update description as talent states might affect it
    }

    checkHealingTsunamiTrigger(event) {
        console.log("[BridgetPassive] TurnStart event received:", event.detail);
        
        if (!this.healingTsunamiActive || !this.character || this.character.isDead()) {
            console.log("[BridgetPassive] Healing Tsunami not active or character dead, skipping check");
            return;
        }
        
        // Check if this is our character's turn
        const playerCharacters = event.detail.playerCharacters;
        const isCharacterInTurn = playerCharacters.some(char => 
            char.id === this.character.id || char.instanceId === this.character.instanceId
        );
        
        if (!isCharacterInTurn) {
            console.log("[BridgetPassive] Character not in turn's player characters, skipping");
            return;
        }
        
        console.log(`[BridgetPassive] Processing Healing Tsunami for ${this.character.name} at turn start`);
        
        // 50% chance to trigger
        const roll = Math.random();
        console.log(`[BridgetPassive] Healing Tsunami roll: ${roll.toFixed(2)}, Threshold: 0.5`);
        
        if (roll < 0.5) {
            console.log("[BridgetPassive] Healing Tsunami triggered!");
            this.triggerHealingTsunami();
        } else {
            console.log("[BridgetPassive] Healing Tsunami not triggered this turn");
        }
    }
    
    triggerHealingTsunami() {
        if (this.healingTsunamiBuffId && this.character.hasBuff(this.healingTsunamiBuffId)) {
            // Remove previous buff if it exists to ensure a fresh application and duration
            console.log(`[BridgetPassive triggerHealingTsunami] Removing existing buff ${this.healingTsunamiBuffId} before reapplying.`);
            this.character.removeBuff(this.healingTsunamiBuffId);
        }
        
        // Create a healing power buff that triples the healing power
        const currentHealingPower = this.character.stats.healingPower || 0;
        // The buff should add 200% of the current healing power to effectively triple it.
        const healingPowerToAdd = currentHealingPower * 2;

        const healingBuff = {
            id: "healing_tsunami_buff_" + Date.now(), // Unique ID for each application
            name: "Healing Tsunami",
            icon: "Icons/buffs/healing_tsunami_buff.webp", // Ensure this icon path is correct
            duration: 1, // Lasts for this turn. GameManager's processEffects(true) will remove it at player's turn end.
            statModifiers: [{ // Changed to array as per Character.js
                type: "modifyStat", // This type is not directly used by recalculateStats, statModifiers is an array
                stat: "healingPower",
                value: healingPowerToAdd, // Adding 2x more to triple the original
                operation: "add" // This operation is used by recalculateStats
            }],
            description: "Healing Power is tripled (+200%) for this turn."
        };
        
        this.healingTsunamiBuffId = healingBuff.id;
        this.character.addBuff(healingBuff); // addBuff calls recalculateStats
        this.healingTsunamiTriggered = true;
        
        // Add class to character element for visual effect
        const characterElement = document.getElementById(`character-${this.character.id}`);
        if (characterElement) {
            characterElement.classList.add('healing-tsunami-active');
            
            // Set a timeout to remove the class after a reasonable time
            setTimeout(() => {
                if (characterElement) {
                    characterElement.classList.remove('healing-tsunami-active');
                }
            }, 10000); // 10 seconds should be enough to cover a full turn
        }
        
        // Show VFX
        this.showHealingTsunamiVFX();
        
        // Log the effect
        window.gameManager.addLogEntry(`${this.character.name}'s Healing Tsunami activates, tripling healing power!`, 'heal');
    }
    
    showHealingTsunamiVFX() {
        const characterElement = document.getElementById(`character-${this.character.id}`);
        if (!characterElement) return;
        
        // Create the VFX container
        const tsunamiVFX = document.createElement('div');
        tsunamiVFX.className = 'healing-tsunami-vfx';
        characterElement.appendChild(tsunamiVFX);
        
        // Create the pulsing aura
        const tsunamiAura = document.createElement('div');
        tsunamiAura.className = 'healing-tsunami-aura';
        tsunamiVFX.appendChild(tsunamiAura);
        
        // Create the text element
        const tsunamiText = document.createElement('div');
        tsunamiText.className = 'healing-tsunami-text';
        tsunamiText.textContent = 'Healing Tripled!';
        tsunamiVFX.appendChild(tsunamiText);
        
        // Add particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-tsunami-particle';
            tsunamiVFX.appendChild(particle);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (tsunamiVFX && tsunamiVFX.parentNode) {
                tsunamiVFX.parentNode.removeChild(tsunamiVFX);
            }
        }, 3000);
    }

    // Renamed from checkHealingTsunamiTrigger and signature changed
    onTurnStart(character, currentTurn) { // character here is this.character, passed by GameManager
        console.log(`[BridgetPassive onTurnStart] Called for ${character.name} at turn ${currentTurn}`);
        
        if (!this.healingTsunamiActive) {
            console.log("[BridgetPassive onTurnStart] Skipping: Healing Tsunami talent is not marked as active on this passive instance.");
            return;
        }
        if (!this.character) {
            console.log("[BridgetPassive onTurnStart] Skipping: Passive's internal character reference is null.");
            return;
        }
        if (this.character.isDead()) {
            console.log(`[BridgetPassive onTurnStart] Skipping: Character ${this.character.name} is dead.`);
            return;
        }
        if (this.character !== character) {
            console.log(`[BridgetPassive onTurnStart] Skipping: Mismatch between passive's character (${this.character.name}) and GameManager's current character (${character.name}).`);
            return;
        }
        
        // GameManager already ensures this is called for the correct character at the start of their turn phase.
        console.log(`[BridgetPassive onTurnStart] Processing Healing Tsunami for ${this.character.name}`);
        
        // 50% chance to trigger
        const roll = Math.random();
        console.log(`[BridgetPassive onTurnStart] Healing Tsunami roll: ${roll.toFixed(2)}, Threshold: 0.5`);
        
        if (roll < 0.5) {
            console.log("[BridgetPassive onTurnStart] Healing Tsunami triggered!");
            this.triggerHealingTsunami();
        } else {
            console.log("[BridgetPassive onTurnStart] Healing Tsunami not triggered this turn");
            // Ensure any previous Tsunami buff is removed if it didn't re-trigger
            if (this.healingTsunamiBuffId && this.character.hasBuff(this.healingTsunamiBuffId)) {
                console.log(`[BridgetPassive onTurnStart] Removing previous Healing Tsunami buff (${this.healingTsunamiBuffId}) as it did not re-trigger.`);
                this.character.removeBuff(this.healingTsunamiBuffId);
                this.healingTsunamiBuffId = null; // Clear the stored buff ID
                 const characterElement = document.getElementById(`character-${this.character.id}`);
                if (characterElement) {
                    characterElement.classList.remove('healing-tsunami-active');
                }
            }
            this.healingTsunamiTriggered = false; // Ensure flag is reset
        }
    }
}

// Register the passive globally
window.BridgetPassiveHandler = BridgetPassiveHandler;

// CRITICAL: Register with PassiveFactory
if (window.PassiveFactory) {
    window.PassiveFactory.registerPassive('bridget_passive', BridgetPassiveHandler);
    console.log('[BridgetPassiveHandler] Registered with PassiveFactory.');
} else {
    console.warn('[BridgetPassiveHandler] PassiveFactory not found. Bridget passive might not be loaded correctly by characters.');
}

// Manually trigger a damageDealt event to test the passive system
function testBridgetPassive(damage = 500) {
    console.log(`[DEBUG] Testing Bridget passive with damage: ${damage}`);
    
    if (typeof window.bridgetPassiveInstance === 'undefined') {
        console.warn("[DEBUG] No bridgetPassiveInstance found. Is Bridget in your team?");
        return;
    }
    
    const passiveInstance = window.bridgetPassiveInstance;
    const caster = passiveInstance.character;
    
    if (!caster) {
        console.warn("[DEBUG] Bridget passive has no associated character!");
        return;
    }
    
    console.log(`[DEBUG] Testing passive for ${caster.name} (ID: ${caster.id}). Oceanic Harmony active: ${passiveInstance.oceanicHarmonyActive}`);
    
    // Create and dispatch a synthetic damageDealt event
    const testEvent = new CustomEvent('damageDealt', {
        detail: {
            source: caster,
            target: { name: "Test Target" },
            damage: damage,
            isCritical: false
        }
    });
    
    document.dispatchEvent(testEvent);
    console.log(`[DEBUG] Dispatched test damageDealt event for ${damage} damage`);
}

// Add a global debugging function
window.testBridgetPassive = testBridgetPassive;

// Update the global test function to use the new debug method
window.testBridgetLowTidePower = function() {
    if (!window.bridgetPassiveInstance) {
        console.error('[DEBUG] No Bridget passive instance found. Make sure Bridget is in your team.');
        return;
    }
    
    return window.bridgetPassiveInstance.debugLowTidePower();
};

// Add this function to the end of the file - outside the class
// This will be a global helper function to fix the Low Tide Power talent immediately
window.fixBridgetLowTidePower = function() {
    console.log("[DEBUG FIX] Running direct fix for Bridget's Low Tide Power talent");
    
    // Find Bridget in the player characters
    const bridget = window.gameManager?.gameState?.playerCharacters.find(char => char.id === 'bridget');
    if (!bridget) {
        console.error("[DEBUG FIX] Could not find Bridget in the player characters");
        return false;
    }
    
    console.log("[DEBUG FIX] Found Bridget: ", bridget);
    
    // Check if the talent is selected
    const hasLowTideTalent = bridget.appliedTalents && bridget.appliedTalents.includes('low_tide_power');
    if (!hasLowTideTalent) {
        console.log("[DEBUG FIX] Adding Low Tide Power to Bridget's applied talents");
        if (!bridget.appliedTalents) bridget.appliedTalents = [];
        bridget.appliedTalents.push('low_tide_power');
    }
    
    // Ensure the flag is set
    bridget.lowTidePowerActive = true;
    
    // Check mana percentage
    const currentMana = bridget.stats.currentMana || 0;
    const maxMana = bridget.stats.maxMana || 100;
    const manaPercentage = currentMana / maxMana;
    
    console.log(`[DEBUG FIX] Bridget's mana: ${currentMana}/${maxMana} (${(manaPercentage*100).toFixed(1)}%)`);
    
    // If mana is below 50% and the buff isn't active, apply it
    if (manaPercentage < 0.5) {
        console.log("[DEBUG FIX] Mana below 50%, applying Low Tide Power buff");
        
        // Remove existing buff if any
        const existingBuff = bridget.buffs.find(b => b.id === 'low_tide_power_buff');
        if (existingBuff) {
            bridget.removeBuff('low_tide_power_buff');
        }
        
        // Create and apply the buff
        const lowTideBuff = new Effect(
            'low_tide_power_buff',
            'Low Tide Power',
            'Icons/talents/low_tide_power.webp',
            -1, // Permanent until removed
            null, // No per-turn effect
            false // Not a debuff
        );
        
        // Set description
        lowTideBuff.description = 'Magical damage increased by 150 when mana is below 50%.';
        
        // Set stat modifier
        lowTideBuff.statModifiers = [{
            stat: 'magicalDamage',
            value: 150,
            operation: 'add'
        }];
        
        // Apply the buff
        bridget.addBuff(lowTideBuff);
        bridget.lowTideBonusActive = true;
        
        // Add visual indicator
        const elementId = bridget.instanceId || bridget.id;
        const charElement = document.getElementById(`character-${elementId}`);
        if (charElement) {
            charElement.classList.add('low-tide-active');
        }
        
        // Force recalculate stats
        if (typeof bridget.recalculateStats === 'function') {
            bridget.recalculateStats('direct_fix');
        }
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(bridget);
        }
        
        // Add log entry
        if (window.gameManager?.addLogEntry) {
            window.gameManager.addLogEntry(`${bridget.name}'s Low Tide Power manually activated! (+150 Magical Damage)`, 'talent-effect');
        }
        
        console.log("[DEBUG FIX] Low Tide Power buff applied successfully");
        return true;
    } else {
        console.log("[DEBUG FIX] Mana not below 50%, no action taken");
        return false;
    }
}; 