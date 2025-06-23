/**
 * Zoey's passive: Sparkle Bell Mark
 * When Zoey deals damage to an enemy with damage spells, she places a sparkle bell mark on them for 2 turns.
 * Zoey deals 125% damage to marked enemies. The mark disappears when the enemy takes damage.
 */

class ZoeyPassive {
    constructor(character) {
        this.name = "Sparkle Bell Mark";
        this.description = "When Zoey deals damage to an enemy with damage spells, she places a sparkle bell mark on them for 2 turns. Zoey deals 125% damage to marked enemies. The mark disappears when the enemy takes damage.";
        this.icon = "Icons/abilities/sparkle_bell_mark.png";
        
        // Store character if provided in constructor
        if (character) {
            this.character = character;
            this.updateDescription();
        }
        
        // Track marked enemies
        this.markedEnemies = new Map();
        
        // Track pending marks to apply after damage
        this.pendingMarkTargets = new Set();
        
        // Map to track which targets we're currently processing to prevent duplicate events
        this.processingMarkTargets = new Map();
        
        // Initialize cooldown flag for Agile Counterforce to prevent spam
        this.agileCounterforceCooldown = false;
    }
    
    initialize(character) {
        console.log(`[Zoey Passive] 🚀 Initializing Sparkle Bell Mark passive for ${character.name}`);
        console.log(`[Zoey Passive] Character ID: ${character.id}, Character object:`, character);
        this.character = character;
        this.updateDescription();
        
        // Directly set Agile Counterforce talent flag for more reliable detection
        if (character && character.id === 'zoey') {
            console.log(`[Zoey Passive] Directly enabling Agile Counterforce talent detection`);
            character._hasAgileCounterforce = true;
        }
        
        // Store bound functions for proper cleanup
        this.boundOnGameStart = this.onGameStart.bind(this);
        this.boundOnAbilityUsed = this.onAbilityUsed.bind(this);
        this.boundOnDamageTaken = this.onDamageTaken.bind(this);
        this.boundOnDamageDealt = this.onDamageDealt.bind(this);
        this.boundOnAttackCalculation = this.onAttackCalculation.bind(this);
        this.boundOnCharacterDodged = this.onCharacterDodged.bind(this);
        this.boundOnTurnEnd = this.onTurnEnd.bind(this);
        
        // Register event listeners
        document.addEventListener('game:start', this.boundOnGameStart);
        document.addEventListener('GameStart', this.boundOnGameStart); // Add GameStart event
        document.addEventListener('gameStateReady', this.boundOnGameStart); // Add gameStateReady event
        document.addEventListener('ability:used', this.boundOnAbilityUsed);
        document.addEventListener('damage:taken', this.boundOnDamageTaken);
        document.addEventListener('character:damage-dealt', this.boundOnDamageDealt);
        document.addEventListener('attack:calculation', this.boundOnAttackCalculation);
        document.addEventListener('character:dodged', this.boundOnCharacterDodged); // Add dodge event listener
        
        // Add debug listener for dodge events
        document.addEventListener('character:dodged', (event) => {
            console.log(`[Zoey Debug] Dodge event triggered:`, event.detail);
            if (event.detail && event.detail.character === this.character) {
                console.log(`[Zoey Debug] Dodge event is for Zoey!`);
                
                // Force apply the buff directly when we detect a dodge event
                this.applyAgileCounterforceBuff();
            }
        });
        
        // Register for turn end to manage mark durations
        document.addEventListener('turn:end', this.boundOnTurnEnd);
        
        // NEW: Add event listeners for shield updates
        this.boundOnBuffApplied = this.onBuffApplied.bind(this);
        this.boundOnBuffRemoved = this.onBuffRemoved.bind(this);
        document.addEventListener('BuffApplied', this.boundOnBuffApplied);
        document.addEventListener('BuffRemoved', this.boundOnBuffRemoved);
        
        // Add CSS for mana steal if not already added
        this.addManaStealStyles();
    }
    
    updateDescription() {
        // Base description
        let description = "When Zoey deals damage to an enemy with damage spells, she places a sparkle bell mark on them for 2 turns. Zoey deals 125% damage to marked enemies. The mark disappears when the enemy takes damage.";
        
        // Add talent descriptions if applicable
        let talentEffects = '';
        
        // Add mana steal description if talent is active
        if (this.character && this.character.enableManaSteal) {
            talentEffects += '\n<span class="talent-effect resource">Essence Theft: Zoey steals 10% of her damage dealt as mana from the target.</span>';
        }
        
        // Add Pounce Momentum description if talent is active
        if (this.character && this.character.hasTalent && this.character.hasTalent('pounce_momentum')) {
            talentEffects += '\n<span class="talent-effect utility">Pounce Momentum: Heart Pounce has a 20% chance to grant 10% dodge for 3 turns.</span>';
        }
        
        // Add Agile Counterforce description if talent is active
        if (this.character && this.character.hasTalent && this.character.hasTalent('agile_counterforce')) {
            talentEffects += '\n<span class="talent-effect damage">Agile Counterforce: When Zoey dodges, she gains 10% of her current Magical Damage for 4 turns. This effect can stack.</span>';
        }
        
        // Add Allied Bond description if talent is active
        if (this.character && this.character.enableAlliedBond) {
            talentEffects += '\n<span class="talent-effect utility">Allied Bond: At combat start, Zoey gains 20% of her strongest ally\'s highest stat.</span>';
        }
        
        // Add Purifying Magic description if talent is active
        if (this.character && this.character.enablePurifyingMagic) {
            talentEffects += '\n<span class="talent-effect utility">Purifying Magic: 10% chance to cleanse a random debuff when using abilities.</span>';
        }
        
        // Add Mystic Barrier description if talent is active
        if (this.character && this.character.enableMysticBarrier) {
            talentEffects += '\n<span class="talent-effect utility">Mystic Barrier: Zoey gains 400 shield for each active non-permanent buff. Shield absorbs damage before health.</span>';
        }
        
        // Add Weakening Strike description if talent is active
        if (this.character && this.character.enableWeakeningStrike) {
            talentEffects += '\n<span class="talent-effect debuff">Weakening Strike: Zoey\'s damaging abilities have a 10% chance to reduce enemy damage by 20% for 2 turns.</span>';
        }
        
        // Add Improved Sparkle Burst description if talent is active
        if (this.character && this.character.enableImprovedSparkleburst) {
            talentEffects += '\n<span class="talent-effect damage">Improved Sparkle Burst: Sparkle Burst hit chance increased from 50% to 80%.</span>';
        }
        
        // Add Improved Heart Pounce description if talent is active
        if (this.character && this.character.enableImprovedHeartPounce) {
            talentEffects += '\n<span class="talent-effect damage">Improved Heart Pounce: Heart Pounce hit chance increased by 10%, but Vulnerable debuff duration reduced to 2 turns.</span>';
        }
        
        // Add Enhanced Heart Pounce description if talent is active
        if (this.character && this.character.enableEnhancedHeartPounce) {
            talentEffects += '\n<span class="talent-effect damage">Enhanced Heart Pounce: Heart Pounce scales with additional 50% Physical and 50% Magical damage.</span>';
        }
        
        // Add Sparkle Pounce description if talent is active
        if (this.character && this.character.enableSparklePounce) {
            talentEffects += '\n<span class="talent-effect damage">Sparkle Pounce: Sparkle Burst has a 10% chance to cast Heart Pounce on successful hits.</span>';
        }
        
        // Add Predatory Instinct description if talent is active
        if (this.character && this.character.enablePredatoryInstinct) {
            talentEffects += '\n<span class="talent-effect powerful">Predatory Instinct: Heart Pounce is disabled but automatically targets the lowest health enemy at turn start.</span>';
        }
        
        // Update the description
        this.description = description + talentEffects;
        
        // Update character passive description
        if (this.character && this.character.passive) {
            this.character.passive.description = this.description;
        }
    }
    
    onGameStart(event) {
        console.log(`Zoey's Sparkle Bell Mark passive activated for ${this.character.name}`);
        console.log(`[Zoey Passive] Game start event received:`, event.type);
        this.markedEnemies.clear();
        this.pendingMarkTargets.clear();
        this.processingMarkTargets.clear();
        
        // Handle Pack Leadership talent - Apply Zoey's stats to allies
        if (this.character && this.character.enablePackLeadership) {
            console.log(`[Zoey Passive] Pack Leadership talent detected, attempting to apply...`);
            setTimeout(() => {
                try {
                    this.applyPackLeadership();
                } catch (error) {
                    console.error(`[Zoey Passive] Error applying Pack Leadership:`, error);
                }
            }, 500);
        }
        
        // Handle Feline Vitality talent - Enhance healing received
        if (this.character && this.character.enableFelineVitality) {
            console.log(`[Zoey Passive] Feline Vitality talent detected, applying healing enhancement...`);
            this.applyFelineVitality();
        }
        
        // Handle Enduring Magic talent - Extend buff duration
        if (this.character && this.character.enableEnduringMagic) {
            console.log(`[Zoey Passive] Enduring Magic talent detected, applying buff duration extension...`);
            this.applyEnduringMagic();
        }
        
        // NEW: Handle Mystic Barrier talent - Initialize shield
        if (this.character && this.character.enableMysticBarrier) {
            console.log(`[Zoey Passive] Mystic Barrier talent detected, initializing shield system...`);
            this.character.updateShield();
        }
        
        // NEW: Handle Predatory Instinct talent - Disable Heart Pounce and set up auto-cast
        if (this.character && this.character.enablePredatoryInstinct) {
            console.log(`[Zoey Passive] Predatory Instinct talent detected, disabling Heart Pounce and setting up auto-cast...`);
            this.applyPredatoryInstinct();
        }
        
        // Handle Allied Bond talent with improved logging and safety checks
        if (this.character && this.character.enableAlliedBond) {
            console.log(`[Zoey Passive] Allied Bond talent detected, attempting to apply...`);
            setTimeout(() => {
                try {
                    this.applyAlliedBond();
                } catch (error) {
                    console.error(`[Zoey Passive] Error applying Allied Bond:`, error);
                    // Retry once after a longer delay
                    setTimeout(() => {
                        try {
                            this.applyAlliedBond();
                        } catch (retryError) {
                            console.error(`[Zoey Passive] Retry failed for Allied Bond:`, retryError);
                        }
                    }, 2000);
                }
            }, 500); // Small delay to ensure game state is fully ready
        } else {
            console.log(`[Zoey Passive] Allied Bond talent not enabled for ${this.character.name}`);
        }
    }
    
    onTurnEnd(event) {
        // Reduce duration of all marks when turn ends
        if (event.detail && event.detail.phase === 'enemy') {
            this.reduceDuration();
        }
    }
    
    onAbilityUsed(event) {
        console.log('[Zoey Passive] onAbilityUsed called with event:', event.detail);
        
        // Check if Zoey used an ability that deals damage
        if (event.detail && event.detail.caster === this.character && event.detail.ability) {
            console.log('[Zoey Passive] Ability used by Zoey:', event.detail.ability.id);
            console.log('[Zoey Passive] enableBellRecast:', this.character.enableBellRecast);
            console.log('[Zoey Passive] Character properties (talent-related):', {
                enableBellRecast: this.character.enableBellRecast,
                enableSparkleBellHealing: this.character.enableSparkleBellHealing,
                enableDoubleBellMark: this.character.enableDoubleBellMark,
                enableEnhancedLightArc: this.character.enableEnhancedLightArc
            });
            
            // Store the ability for reference in damage calculation
            this.lastUsedAbility = event.detail.ability;
            
            // Handle Bell Recast talent: 100% chance to recast Strawberry Bell Burst (for testing)
            // Only trigger if this is NOT a recast (prevent infinite loop)
            if (event.detail.ability.id === 'zoey_q' && this.character.enableBellRecast && !event.detail.isRecast) {
                console.log('[Zoey Passive] Bell Recast conditions met, triggering recast!');
                if (Math.random() < 1.0) { // 100% chance for testing
                    setTimeout(() => {
                        console.log('[Zoey Passive] Executing Bell Recast now...');
                        this.recastStrawberryBellBurst(event.detail.target);
                    }, 1500); // Delay after original ability completes
                } else {
                    console.log('[Zoey Passive] Bell Recast failed random check');
                }
            } else {
                console.log('[Zoey Passive] Bell Recast conditions not met. Ability ID:', event.detail.ability.id, 'enableBellRecast:', this.character.enableBellRecast, 'isRecast:', event.detail.isRecast);
            }
            
            // Handle Pounce Momentum talent when Heart Pounce is used and hits a target
            if (this.character.hasTalent && 
                this.character.hasTalent('pounce_momentum') && 
                event.detail.ability.id === 'zoey_w' && 
                event.detail.target && 
                event.detail.hit) {
                
                // 20% chance to trigger the dodge buff
                if (Math.random() < 0.2) {
                    this.applyPounceMomentumBuff();
                }
            }
            
            // Handle Purifying Magic talent
            if (this.character.enablePurifyingMagic) {
                // 10% chance to cleanse a debuff
                if (Math.random() < 0.1) {
                    this.applyPurifyingMagic();
                }
            }
            
            // NOTE: Do NOT clear pending marks here; they are needed for upcoming damage:taken events.
        }
    }
    
    onAttackCalculation(event) {
        if (!event.detail) {
            console.log(`[Zoey Passive] onAttackCalculation - No event detail`);
            return;
        }
        
        const { caster, target, damage, type, source } = event.detail;
        
        console.log(`[Zoey Passive] onAttackCalculation - caster: ${caster?.name}, target: ${target?.name}, damage: ${damage}, source: "${source}"`);
        console.log(`[Zoey Passive] Character comparison: caster === this.character? ${caster === this.character}`);
        console.log(`[Zoey Passive] Character IDs: caster.id=${caster?.id}, this.character.id=${this.character?.id}`);
        
        // If Zoey is dealing damage to a target
        if (caster === this.character && damage > 0 && target) {
            console.log(`[Zoey Passive] ✅ Zoey is dealing ${damage} damage to ${target.name} with source: "${source}"`);
            
            // Check if ability was a damage spell
            const isDamageSpellResult = this.isDamageSpell(source);
            console.log(`[Zoey Passive] isDamageSpell("${source}") = ${isDamageSpellResult}`);
            
            if (isDamageSpellResult) {
                console.log(`[Zoey Passive] ✅ Adding ${target.name} to pending mark targets for source: "${source}"`);
                console.log(`[Zoey Passive] Pending targets before add:`, Array.from(this.pendingMarkTargets).map(t => t.name));
                // Add target to pending mark list instead of applying immediately
                this.pendingMarkTargets.add(target);
                console.log(`[Zoey Passive] Pending targets after add:`, Array.from(this.pendingMarkTargets).map(t => t.name));
            } else {
                console.log(`[Zoey Passive] ❌ Source "${source}" not recognized as damage spell, no mark will be applied`);
            }
            
            // Check if target is marked - if so, multiply the damage based on stacks
            if (this.isMarked(target)) {
                const markData = this.markedEnemies.get(target.id);
                const stacks = markData?.stacks || 1;
                // Updated: 1 stack = 1.25x damage (125%), 2 stacks = 1.5x damage (150%)
                const damageMultiplier = 1 + (stacks * 0.25);
                
                const originalDamage = damage;
                event.detail.damage = Math.round(damage * damageMultiplier);
                const boostedDamage = event.detail.damage - originalDamage; // The extra damage from the mark
                
                // Add log entry if game manager is available
                if (window.gameManager) {
                    const multiplierText = stacks > 1 ? `${damageMultiplier}x` : '125%';
                    window.gameManager.addLogEntry(`Zoey's Sparkle Bell Mark amplifies damage to ${target.name} (${multiplierText})!`, 'zoey player-turn');
                }
                
                // Handle Sparkle Bell Healing talent - heal Zoey for 35% of boosted damage
                if (this.character.enableSparkleBellHealing && boostedDamage > 0) {
                    const healAmount = Math.round(boostedDamage * 0.35);
                    if (healAmount > 0) {
                        setTimeout(() => {
                            this.applySparkleBellHealing(healAmount);
                        }, 500); // Small delay for visual clarity
                    }
                }
                
                // Show trigger VFX
                this.showMarkTriggerVFX(target);
            }
        }
    }
    
    onCharacterDodged(event) {
        console.log(`[Zoey Passive] Received character:dodged event:`, event.detail);
        
        // First check if event has proper details
        if (!event.detail) {
            console.log(`[Zoey Passive] Dodge event missing detail property`);
            return;
        }
        
        // Check if the dodging character is our character
        const dodgingCharacter = event.detail.character;
        if (!dodgingCharacter || dodgingCharacter !== this.character) {
            console.log(`[Zoey Passive] Dodge event is for a different character: ${dodgingCharacter?.name || 'unknown'}`);
            return;
        }
        
        console.log(`[Zoey Passive] Confirmed dodge event for ${this.character.name}`);
        
        // FIXED: Only apply if Agile Counterforce talent is enabled and not on cooldown
        if (this.character.enableAgileCounterforce && !this.agileCounterforceCooldown) {
            this.applyAgileCounterforceBuff();
        }
    }
    
    onDamageDealt(event) {
        if (!event.detail) return;
        const { character, target, damage } = event.detail;
        
        // Check if this is Zoey dealing damage
        if (character === this.character && damage > 0 && target) {
            console.log(`[Zoey Passive] onDamageDealt - Zoey dealt ${damage} damage to ${target?.name || 'unknown'}`);
            
            // NEW: Handle Weakening Strike talent - chance to apply damage reduction debuff
            if (this.character.enableWeakeningStrike && !target.isDead()) {
                console.log(`[Zoey Passive] Weakening Strike check triggered`);
                // 10% chance to apply weakening debuff
                const roll = Math.random();
                console.log(`[Zoey Passive] Weakening Strike roll: ${roll} (need < 0.1)`);
                if (roll < 0.1) {
                    console.log(`[Zoey Passive] Weakening Strike triggered!`);
                    // Apply debuff after a small delay
                    setTimeout(() => {
                        if (!target.isDead()) {
                            this.applyWeakeningStrike(target);
                        }
                    }, 100);
                }
            }
        }
    }

    onDamageTaken(event) {
        if (!event.detail) {
            console.log(`[Zoey Passive] onDamageTaken - No event detail`);
            return;
        }
        const { caster, target, damage } = event.detail;
        
        console.log(`[Zoey Passive] onDamageTaken - caster: ${caster?.name}, target: ${target?.name}, damage: ${damage}`);
        console.log(`[Zoey Passive] onDamageTaken - caster === this.character? ${caster === this.character}`);
        
        // First check if this is a damage event caused by Zoey
        if (caster === this.character && damage > 0) {            
            // Handle Symbiotic Healing talent - heal self and allies for 1% of damage dealt
            if (this.character && this.character.enableSymbioticHealing) {
                const healingAmount = Math.round(damage * 0.01);
                if (healingAmount > 0) {
                    this.applySymbioticHealing(healingAmount);
                }
            }
            
            // Handle mana steal if talent is enabled
            if (this.character && this.character.enableManaSteal && target.stats && target.stats.currentMana !== undefined) {
                // Calculate mana steal amount (2% of damage dealt)
                const manaStealAmount = Math.round(damage * 0.02);
                
                // Only proceed if there's mana to steal
                if (manaStealAmount > 0 && target.stats.currentMana > 0) {
                    // Calculate how much mana we can actually steal (don't go below 0)
                    const actualStealAmount = Math.min(manaStealAmount, target.stats.currentMana);
                    
                    if (actualStealAmount > 0) {
                        // Reduce target's mana
                        target.stats.currentMana -= actualStealAmount;
                        
                        // Increase caster's mana (capped at max mana)
                        const originalMana = caster.stats.currentMana;
                        caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + actualStealAmount);
                        const manaGained = caster.stats.currentMana - originalMana;
                        
                        // Show mana steal VFX
                        this.showManaStealVFX(caster, target, actualStealAmount);
                        
                        // Log the mana steal effect
                        if (window.gameManager) {
                            window.gameManager.addLogEntry(`Zoey's Essence Theft steals ${actualStealAmount} mana from ${target.name}!`, 'zoey talent-effect');
                        }
                        
                        // Update UI for both characters
                        if (typeof updateCharacterUI === 'function') {
                            updateCharacterUI(caster);
                            updateCharacterUI(target);
                        }
                    }
                }
            }
            

            
            // Apply mark if this target is pending a mark
            console.log(`[Zoey Passive] Checking if ${target.name} is in pending mark list...`);
            console.log(`[Zoey Passive] Pending targets:`, Array.from(this.pendingMarkTargets).map(t => t.name));
            console.log(`[Zoey Passive] Has target?`, this.pendingMarkTargets.has(target));
            
            if (this.pendingMarkTargets.has(target)) {
                console.log(`[Zoey Passive] ✅ Target ${target.name} is in pending mark list, checking if already processing...`);
                
                // Check if we're already processing this target to prevent duplicate events
                const processingKey = `${target.id}-${Date.now()}`;
                const currentTime = Date.now();
                
                // Clean up old processing entries (older than 1 second)
                for (const [key, timestamp] of this.processingMarkTargets.entries()) {
                    if (currentTime - timestamp > 1000) {
                        this.processingMarkTargets.delete(key);
                    }
                }
                
                // Check if target is already being processed (within last 100ms)
                let isAlreadyProcessing = false;
                for (const [key, timestamp] of this.processingMarkTargets.entries()) {
                    if (key.startsWith(target.id + '-') && (currentTime - timestamp) < 100) {
                        isAlreadyProcessing = true;
                        console.log(`[Zoey Passive] ⚠️ Target ${target.name} is already being processed, skipping duplicate event`);
                        break;
                    }
                }
                
                if (!isAlreadyProcessing) {
                    // Mark as processing
                    this.processingMarkTargets.set(processingKey, currentTime);
                    console.log(`[Zoey Passive] 🎯 Processing mark application for ${target.name}`);
                    
                    // Remove from pending list
                    this.pendingMarkTargets.delete(target);
                    console.log(`[Zoey Passive] Removed ${target.name} from pending list. New size: ${this.pendingMarkTargets.size}`);
                    
                    // Apply mark AFTER damage is dealt
                    setTimeout(() => {
                        // Apply the mark (but only if target is still alive)
                        if (!target.isDead()) {
                            console.log(`[Zoey Passive] ✅ Applying Sparkle Bell Mark to ${target.name}`);
                            this.applyMark(target);
                        } else {
                            console.log(`[Zoey Passive] ❌ Target ${target.name} is dead, not applying mark`);
                        }
                        
                        // Clean up processing entry
                        this.processingMarkTargets.delete(processingKey);
                    }, 50);
                }
                
                // IMPORTANT: Return early to prevent processing this event again
                return;
            } else {
                console.log(`[Zoey Passive] ❌ Target ${target.name} not in pending mark list (size: ${this.pendingMarkTargets.size})`);
                if (this.pendingMarkTargets.size > 0) {
                    console.log(`[Zoey Passive] Available pending targets:`, Array.from(this.pendingMarkTargets).map(t => `${t.name} (id: ${t.id})`));
                }
            }
        }
        // Then, if a marked enemy takes damage from any source, remove the mark
        else if (damage > 0 && this.isMarked(target)) {
            // Show mark trigger VFX when mark is consumed
            if (caster !== this.character) { // Only show if not already shown by Zoey's attack
                this.showMarkTriggerVFX(target);
            }
            
            this.removeMark(target);
            
            // Add log entry if game manager is available
            if (window.gameManager) {
                window.gameManager.addLogEntry(`The Sparkle Bell Mark fades from ${target.name}!`, 'zoey player-turn');
            }
        }
    }
    
    // Apply the Pounce Momentum buff (from talent)
    applyPounceMomentumBuff() {
        // Create the dodge buff
        const pounceMomentumBuff = {
            id: 'pounce_momentum_buff',
            name: 'Pounce Momentum',
            description: 'Grants 10% dodge chance for 3 turns.',
            icon: 'Icons/talents/pounce_momentum.webp',
            duration: 3,
            statModifiers: [{
                stat: 'dodgeChance',
                value: 0.1,
                operation: 'add'
            }]
        };
        
        // Apply the buff to Zoey
        this.character.addBuff(pounceMomentumBuff);
        
        // Show VFX
        this.showPounceMomentumVFX();
        
        // Add log entry
        if (window.gameManager) {
            window.gameManager.addLogEntry(`Zoey gains Pounce Momentum, increasing her dodge chance!`, 'zoey talent-effect');
        }
    }
    
    // Show Pounce Momentum VFX
    showPounceMomentumVFX() {
        try {
            // Get the character element
            const characterElement = document.getElementById(`character-${this.character.id}`);
            if (!characterElement) return;
            
            const imageContainer = characterElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create the effect
            const effect = document.createElement('div');
            effect.className = 'pounce-momentum-vfx';
            imageContainer.appendChild(effect);
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/buff_apply.mp3', 0.4);
            }
            
            // Remove after animation
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 1000);
        } catch (error) {
            console.error('[Zoey Passive] Error in showPounceMomentumVFX:', error);
        }
    }
    
    // Apply the Agile Counterforce buff (from talent)
    applyAgileCounterforceBuff() {
        try {
            // Set cooldown to prevent multiple triggers for the same dodge
            this.agileCounterforceCooldown = true;
            setTimeout(() => {
                this.agileCounterforceCooldown = false;
            }, 500); // 500ms cooldown
            
            // FIXED: Calculate 10% of Zoey's BASE magical damage, not current
            const baseMagicalDamage = this.character.baseStats?.magicalDamage || this.character.stats.magicalDamage || 0;
            const buffValue = Math.round(baseMagicalDamage * 0.1);
            
            console.log(`[Zoey Passive] Applying Agile Counterforce buff: +${buffValue} magical damage from base ${baseMagicalDamage}`);
            
            // FIXED: Use consistent buff ID so they stack properly instead of creating infinite unique IDs
            const buffId = 'agile_counterforce_buff';
            
            // Check if buff already exists
            const existingBuff = this.character.buffs.find(b => b.id === buffId);
            if (existingBuff) {
                // Refresh duration and potentially stack effect
                existingBuff.duration = 4;
                
                // Increase stack count (cap at 10 stacks for balance)
                const currentStacks = existingBuff.stacks || 1;
                const newStacks = Math.min(currentStacks + 1, 10);
                existingBuff.stacks = newStacks;
                
                // Update the stat modifier value
                existingBuff.statModifiers[0].value = buffValue * newStacks;
                existingBuff.description = `Increases Magical Damage by ${buffValue * newStacks} (${newStacks} stacks) for 4 turns.`;
                
                // Force recalculation
                this.character.recalculateStats('agile-counterforce-refresh');
                
                console.log(`[Zoey Passive] Refreshed Agile Counterforce buff - now ${newStacks} stacks`);
                
                // Add log entry for stack increase
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Zoey's Agile Counterforce grows stronger! (${newStacks} stacks)`, 'zoey talent-effect');
                }
            } else {
                // Create new buff
                const buff = {
                    id: buffId,
                    name: 'Agile Counterforce',
                    description: `Increases Magical Damage by ${buffValue} for 4 turns. This effect can stack.`,
                    icon: 'Icons/talents/agile_counterforce.webp',
                    duration: 4,
                    stacks: 1,
                    statModifiers: [{
                        stat: 'magicalDamage',
                        value: buffValue,
                        operation: 'add'
                    }]
                };
                
                // Apply the buff to the character
                if (this.character && this.character.addBuff) {
                    console.log(`[Zoey Passive] Adding new Agile Counterforce buff to ${this.character.name}`);
                    this.character.addBuff(buff);
                    
                    // Add log entry
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`Zoey's dodge grants her Agile Counterforce, increasing her Magical Damage by ${buffValue}!`, 'zoey talent-effect');
                    }
                } else {
                    console.error(`[Zoey Passive] Failed to add Agile Counterforce buff: character or addBuff method not available`);
                }
            }
            
            // Show VFX
            this.showAgileCounterforceVFX();
            
        } catch (error) {
            console.error(`[Zoey Passive] Error in applyAgileCounterforceBuff:`, error);
        }
    }
    
    // Show Agile Counterforce VFX
    showAgileCounterforceVFX() {
        try {
            // Get the character element
            const characterElement = document.getElementById(`character-${this.character.id}`);
            if (!characterElement) return;
            
            const imageContainer = characterElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create the effect container
            const effect = document.createElement('div');
            effect.className = 'agile-counterforce-vfx';
            imageContainer.appendChild(effect);
            
            // Add glow effect
            const glow = document.createElement('div');
            glow.className = 'agile-counterforce-glow';
            effect.appendChild(glow);
            
            // Add particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'agile-counterforce-particle';
                effect.appendChild(particle);
                
                // Set random direction for each particle
                const angle = Math.random() * Math.PI * 2;
                particle.style.setProperty('--cf-x', Math.cos(angle));
                particle.style.setProperty('--cf-y', Math.sin(angle));
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/magic_buff.mp3', 0.4);
            }
            
            // Remove after animation
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 1500);
        } catch (error) {
            console.error('[Zoey Passive] Error in showAgileCounterforceVFX:', error);
        }
    }
    
    isDamageSpell(source) {
        // Consider abilities as damage spells if they match known spell names or ability IDs
        if (!source) return false;
        
        console.log(`[Zoey Passive] isDamageSpell check for source: "${source}" (type: ${typeof source})`);
        
        // Check for Zoey's specific abilities
        if (typeof source === 'string') {
            const isZoeyAbility = (
                source.includes('Burst') || 
                source.includes('Beam') || 
                source.includes('Heart Pounce') ||
                source.includes('Strawberry') ||
                source.includes('Sparkle') ||
                source.includes('Glowing') ||
                source.includes('Light Arc') ||
                source === 'zoey_q' ||
                source === 'zoey_w' ||
                source === 'zoey_e' ||
                source === 'zoey_r' ||
                source === this.lastUsedAbility?.name ||
                // Additional specific checks for Bell abilities
                source.includes('Bell') ||
                source.includes('Strawberry Bell Burst') ||
                source.includes('Bell Mastery')
            );
            console.log(`[Zoey Passive] isDamageSpell result: ${isZoeyAbility} for source: "${source}"`);
            return isZoeyAbility;
        }
        
        // Check if source is an ability object
        if (typeof source === 'object' && source.id) {
            const isZoeyAbility = (
                source.id === 'zoey_q' ||
                source.id === 'zoey_w' ||
                source.id === 'zoey_e' ||
                source.id === 'zoey_r'
            );
            console.log(`[Zoey Passive] isDamageSpell result (object): ${isZoeyAbility}`);
            return isZoeyAbility;
        }
        
        return false;
    }
    
    applyMark(target) {
        if (!target) return;
        
        // Check for Double Bell Mark talent
        let markCount = 1;
        if (this.character.enableDoubleBellMark) {
            // 15% chance to apply mark twice
            if (Math.random() < 0.15) {
                markCount = 2;
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Double Bell Mark triggers! ${target.name} is marked twice!`, 'zoey talent-effect');
                }
            }
        }
        
        // Add the mark(s) to the target for 2 turns
        this.markedEnemies.set(target.id, {
            target: target,
            duration: 2,
            stacks: markCount
        });
        
        // Add a visual effect to the target
        this.showMarkVFX(target);
        
        // Add a debuff icon to represent the mark
        this.addMarkDebuff(target, markCount);
        
        // Add log entry if game manager is available
        if (window.gameManager) {
            const markText = markCount > 1 ? `${markCount} Sparkle Bell Marks` : 'a Sparkle Bell Mark';
            window.gameManager.addLogEntry(`Zoey marks ${target.name} with ${markText}!`, 'zoey player-turn');
        }
        
        // Show special VFX for double mark
        if (markCount > 1) {
            this.showDoubleBellMarkVFX(target);
        }
    }
    
    removeMark(target) {
        if (!target) return;
        
        // Remove the mark
        this.markedEnemies.delete(target.id);
        
        // Remove the debuff icon
        this.removeMarkDebuff(target);
    }
    
    isMarked(target) {
        return target && this.markedEnemies.has(target.id);
    }
    
    showMarkVFX(target) {
        try {
            console.log('[Zoey Passive] Showing mark VFX for target:', target.id);
            
            // Get the target element
            const targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement) {
                console.warn('[Zoey Passive] Target element not found for mark VFX');
                return;
            }
            
            const imageContainer = targetElement.querySelector('.image-container');
            if (!imageContainer) {
                console.warn('[Zoey Passive] Image container not found for mark VFX');
                return;
            }
            
            // Create the apply effect container
            const applyEffect = document.createElement('div');
            applyEffect.className = 'sparkle-bell-apply-vfx';
            imageContainer.appendChild(applyEffect);
            
            // Create the apply ring effect
            const ringEffect = document.createElement('div');
            ringEffect.className = 'sparkle-bell-apply-ring';
            applyEffect.appendChild(ringEffect);
            
            // Create the bell icon
            const bellIcon = document.createElement('div');
            bellIcon.className = 'sparkle-bell-icon';
            applyEffect.appendChild(bellIcon);
            
            // Create sparkle particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'sparkle-bell-particle';
                applyEffect.appendChild(particle);
                
                // Set random direction for each particle
                const angle = Math.random() * Math.PI * 2;
                particle.style.setProperty('--particle-x', Math.cos(angle));
                particle.style.setProperty('--particle-y', Math.sin(angle));
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/sparkle_mark.mp3', 0.4);
            }
            
            // Remove the effect container after animation
            setTimeout(() => {
                if (applyEffect.parentNode) {
                    applyEffect.parentNode.removeChild(applyEffect);
                }
            }, 2000);
            
            // Also add the original mark effect for compatibility
            const sparkleEffect = document.createElement('div');
            sparkleEffect.className = 'sparkle-bell-mark';
            imageContainer.appendChild(sparkleEffect);
            
            // Remove after animation
            setTimeout(() => {
                if (sparkleEffect.parentNode) {
                    sparkleEffect.parentNode.removeChild(sparkleEffect);
                }
            }, 1000);
        } catch (error) {
            console.error('[Zoey Passive] Error in showMarkVFX:', error);
        }
    }
    
    addMarkDebuff(target, stacks = 1) {
        // Create a visual debuff to represent the mark
        const markDebuff = {
            id: 'sparkle-bell-mark',
            name: `Sparkle Bell Mark${stacks > 1 ? ` (${stacks}x)` : ''}`,
            description: `Marked by Zoey. Takes ${stacks > 1 ? ((1 + stacks * 0.25) * 100).toFixed(0) + '%' : '125%'} damage from Zoey's attacks. Removed when taking damage.`,
            icon: 'Icons/abilities/sparkle_bell_mark.png',
            duration: 2,
            stacks: stacks,
            effect: () => {}  // No additional effect needed as the logic is handled by the passive
        };
        
        // Add the debuff to the target
        if (target.addDebuff) {
            target.addDebuff(markDebuff);
        }
    }
    
    removeMarkDebuff(target) {
        // Remove the debuff from the target
        if (target.removeDebuff) {
            target.removeDebuff('sparkle-bell-mark');
        }
    }
    
    reduceDuration() {
        // Reduce duration of all marks by 1
        for (const [id, mark] of this.markedEnemies) {
            mark.duration -= 1;
            
            // If duration is up, remove the mark
            if (mark.duration <= 0) {
                this.removeMark(mark.target);
                
                // Add log entry if game manager is available
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`The Sparkle Bell Mark fades from ${mark.target.name}!`, 'zoey player-turn');
                }
            }
        }
    }

    // NEW: Handle buff applied events for shield updates
    onBuffApplied(event) {
        if (event.detail && event.detail.character === this.character && this.character.enableMysticBarrier) {
            console.log(`[Zoey Passive] Buff applied to ${this.character.name}, updating shield...`);
            this.character.updateShield();
        }
    }

    // NEW: Handle buff removed events for shield updates
    onBuffRemoved(event) {
        if (event.detail && event.detail.character === this.character && this.character.enableMysticBarrier) {
            console.log(`[Zoey Passive] Buff removed from ${this.character.name}, updating shield...`);
            this.character.updateShield();
        }
    }

    // NEW: Apply Weakening Strike debuff to target
    applyWeakeningStrike(target) {
        try {
            console.log(`[Zoey Passive] Applying Weakening Strike to ${target.name}`);
            
            // Create the weakening debuff
            const weakeningDebuff = {
                id: 'weakening_strike_debuff',
                name: 'Weakened',
                description: 'This unit deals 20% less damage for 2 turns.',
                icon: 'Icons/talents/weakening_strike.webp',
                duration: 2,
                statModifiers: [{
                    stat: 'physicalDamage',
                    value: -0.2,
                    operation: 'multiply'
                }, {
                    stat: 'magicalDamage',
                    value: -0.2,
                    operation: 'multiply'
                }]
            };
            
            // Apply the debuff to the target
            if (target && target.addDebuff) {
                target.addDebuff(weakeningDebuff);
                
                // Show VFX
                this.showWeakeningStrikeVFX(target);
                
                // Add log entry
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Zoey's Weakening Strike reduces ${target.name}'s damage by 20%!`, 'zoey talent-effect');
                }
            }
        } catch (error) {
            console.error('[Zoey Passive] Error in applyWeakeningStrike:', error);
        }
    }

    // NEW: Show Weakening Strike VFX
    showWeakeningStrikeVFX(target) {
        try {
            // Get the target element
            const targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement) return;
            
            const imageContainer = targetElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create the weakening effect
            const effect = document.createElement('div');
            effect.className = 'weakening-strike-vfx';
            effect.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(128, 0, 128, 0.6) 0%, rgba(64, 0, 64, 0.4) 50%, transparent 70%);
                border-radius: 50%;
                animation: weakeningStrikePulse 1.5s ease-in-out;
                pointer-events: none;
                z-index: 50;
            `;
            
            imageContainer.appendChild(effect);
            
            // Add CSS animation if not already added
            if (!document.getElementById('weakening-strike-styles')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'weakening-strike-styles';
                styleElement.textContent = `
                    @keyframes weakeningStrikePulse {
                        0% {
                            transform: scale(0.8);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 0.8;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(styleElement);
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/debuff_apply.mp3', 0.5);
            }
            
            // Remove after animation
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 1500);
        } catch (error) {
            console.error('[Zoey Passive] Error in showWeakeningStrikeVFX:', error);
        }
    }
    
    destroy() {
        // Clean up event listeners
        document.removeEventListener('game:start', this.boundOnGameStart);
        document.removeEventListener('GameStart', this.boundOnGameStart);
        document.removeEventListener('gameStateReady', this.boundOnGameStart);
        document.removeEventListener('ability:used', this.boundOnAbilityUsed);
        document.removeEventListener('damage:taken', this.boundOnDamageTaken);
        document.removeEventListener('character:damage-dealt', this.boundOnDamageDealt);
        document.removeEventListener('attack:calculation', this.boundOnAttackCalculation);
        document.removeEventListener('turn:end', this.boundOnTurnEnd);
        document.removeEventListener('character:dodged', this.boundOnCharacterDodged); // Clean up dodge listener
        
        // NEW: Clean up buff event listeners
        if (this.boundOnBuffApplied) {
            document.removeEventListener('BuffApplied', this.boundOnBuffApplied);
        }
        if (this.boundOnBuffRemoved) {
            document.removeEventListener('BuffRemoved', this.boundOnBuffRemoved);
        }
        
        // Clean up marks
        this.markedEnemies.clear();
        this.pendingMarkTargets.clear();
    }

    // Show VFX when the mark is triggered
    showMarkTriggerVFX(target) {
        try {
            console.log('[Zoey Passive] Showing mark trigger VFX for target:', target.id);
            
            // Get the target element
            const targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement) {
                console.warn('[Zoey Passive] Target element not found for trigger VFX');
                return;
            }
            
            const imageContainer = targetElement.querySelector('.image-container');
            if (!imageContainer) {
                console.warn('[Zoey Passive] Image container not found for trigger VFX');
                return;
            }
            
            // Create trigger effect container
            const triggerEffect = document.createElement('div');
            triggerEffect.className = 'sparkle-bell-trigger-vfx';
            imageContainer.appendChild(triggerEffect);
            
            // Create flash effect
            const flashEffect = document.createElement('div');
            flashEffect.className = 'sparkle-bell-flash';
            triggerEffect.appendChild(flashEffect);
            
            // Create shatter ring effect
            const shatterEffect = document.createElement('div');
            shatterEffect.className = 'sparkle-bell-shatter';
            triggerEffect.appendChild(shatterEffect);
            
            // Create flying shards
            for (let i = 0; i < 8; i++) {
                const shard = document.createElement('div');
                shard.className = 'sparkle-bell-shard';
                triggerEffect.appendChild(shard);
                
                // Set angle for each shard
                const angle = (i * 45) + (Math.random() * 20 - 10);
                shard.style.setProperty('--angle', `${angle}deg`);
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/sparkle_trigger.mp3', 0.4);
            }
            
            // Remove the effect container after animation
            setTimeout(() => {
                if (triggerEffect.parentNode) {
                    triggerEffect.parentNode.removeChild(triggerEffect);
                }
            }, 1000);
        } catch (error) {
            console.error('[Zoey Passive] Error in showMarkTriggerVFX:', error);
        }
    }
    
    // Show mana steal visual effect between two characters
    showManaStealVFX(caster, target, stealAmount) {
        try {
            // Get DOM elements
            const casterId = caster.instanceId || caster.id;
            const targetId = target.instanceId || target.id;
            
            const casterElement = document.getElementById(`character-${casterId}`);
            const targetElement = document.getElementById(`character-${targetId}`);
            
            if (!casterElement || !targetElement) {
                console.error(`[ManaStealVFX] Cannot find elements. Caster: ${!!casterElement}, Target: ${!!targetElement}`);
                return;
            }
            
            // Create floating text indicators
            if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
                // Show mana loss on target
                window.gameManager.showFloatingText(`character-${targetId}`, `-${stealAmount} Mana`, 'debuff');
                
                // Show mana gain on caster
                window.gameManager.showFloatingText(`character-${casterId}`, `+${stealAmount} Mana`, 'buff');
            }
            
            // Create mana steal beam effect connecting the characters
            const manaStealBeam = document.createElement('div');
            manaStealBeam.className = 'mana-steal-beam';
            document.body.appendChild(manaStealBeam);
            
            // Position the beam between target and caster
            const targetRect = targetElement.getBoundingClientRect();
            const casterRect = casterElement.getBoundingClientRect();
            
            // Calculate center points
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const casterCenterX = casterRect.left + casterRect.width / 2;
            const casterCenterY = casterRect.top + casterRect.height / 2;
            
            // Calculate beam angle and length
            const angle = Math.atan2(casterCenterY - targetCenterY, casterCenterX - targetCenterX);
            const length = Math.sqrt(
                Math.pow(casterCenterX - targetCenterX, 2) + 
                Math.pow(casterCenterY - targetCenterY, 2)
            );
            
            // Apply styles to position and rotate the beam
            manaStealBeam.style.width = `${length}px`;
            manaStealBeam.style.left = `${targetCenterX}px`;
            manaStealBeam.style.top = `${targetCenterY}px`;
            manaStealBeam.style.transform = `rotate(${angle}rad)`;
            manaStealBeam.style.transformOrigin = '0 50%';
            
            // Add mana particles flowing along the beam
            for (let i = 0; i < 10; i++) {
                const particle = document.createElement('div');
                particle.className = 'mana-steal-particle';
                particle.style.animationDelay = `${i * 0.1}s`;
                manaStealBeam.appendChild(particle);
            }
            
            // Play mana steal sound effect
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                window.gameManager.playSound('sounds/mana_drain.mp3', 0.6);
            }
            
            // Remove beam after animation completes
            setTimeout(() => {
                if (manaStealBeam.parentNode) {
                    manaStealBeam.remove();
                }
            }, 1000);
        } catch (error) {
            console.error('[Zoey Passive] Error in showManaStealVFX:', error);
        }
    }
    
    // Add CSS for mana steal effect
    addManaStealStyles() {
        // Check if styles are already added
        if (document.getElementById('mana-steal-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'mana-steal-styles';
        styleElement.textContent = `
            .mana-steal-beam {
                position: fixed;
                height: 5px;
                background: linear-gradient(to right, rgba(255, 100, 255, 0.7), rgba(200, 50, 255, 0.5));
                z-index: 100;
                border-radius: 2px;
                overflow: hidden;
                pointer-events: none;
            }
            
            .mana-steal-particle {
                position: absolute;
                width: 10px;
                height: 10px;
                background: rgba(255, 100, 255, 0.8);
                border-radius: 50%;
                top: -2.5px;
                left: 0;
                animation: mana-steal-flow 1s linear forwards;
            }
            
            @keyframes mana-steal-flow {
                0% {
                    left: 0;
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    left: 100%;
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    // Apply Allied Bond talent effect at game start
    applyAlliedBond() {
        try {
            console.log('[Zoey Passive] Applying Allied Bond talent');
            
            // Get all allies (teammates)
            let allies = [];
            if (window.gameManager && window.gameManager.gameState) {
                // Find all characters that are on the same team as Zoey
                const allCharacters = [
                    ...(window.gameManager.gameState.playerCharacters || []),
                    ...(window.gameManager.gameState.aiCharacters || [])
                ];
                
                // Filter to get allies (same team, but not Zoey herself)
                allies = allCharacters.filter(char => 
                    char && 
                    char !== this.character && 
                    char.team === this.character.team && 
                    !char.isDead()
                );
            }
            
            if (!allies.length) {
                console.log('[Zoey Passive] No allies found for Allied Bond');
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Zoey has no allies to bond with!`, 'zoey talent-effect');
                }
                return;
            }
            
            console.log('[Zoey Passive] Found allies:', allies.map(a => a.name));
            
            // Find the ally with the highest single stat value
            let bestAlly = null;
            let bestStatName = '';
            let bestStatValue = 0;
            
            const statsToCheck = ['hp', 'mana', 'physicalDamage', 'magicalDamage', 'armor', 'magicalShield'];
            
            for (const ally of allies) {
                for (const statName of statsToCheck) {
                    const statValue = ally.stats[statName] || 0;
                    if (statValue > bestStatValue) {
                        bestStatValue = statValue;
                        bestStatName = statName;
                        bestAlly = ally;
                    }
                }
            }
            
            if (!bestAlly || bestStatValue <= 0) {
                console.log('[Zoey Passive] No suitable ally stat found for Allied Bond');
                return;
            }
            
            // Calculate 20% of the best stat
            const bondValue = Math.round(bestStatValue * 0.2);
            
            console.log(`[Zoey Passive] Allied Bond: Taking 20% of ${bestAlly.name}'s ${bestStatName} (${bestStatValue}) = ${bondValue}`);
            
            // Create and apply the Allied Bond buff
            const alliedBondBuff = {
                id: 'allied_bond_buff',
                name: `Allied Bond: ${bestAlly.name}`,
                description: `Bonded with ${bestAlly.name}, gaining +${bondValue} ${bestStatName} for the battle.`,
                icon: 'Icons/talents/allied_bond.webp',
                duration: -1, // Permanent for the battle
                statModifiers: [{
                    stat: bestStatName,
                    value: bondValue,
                    operation: 'add'
                }]
            };
            
            // Apply the buff
            this.character.addBuff(alliedBondBuff);
            
            // Show VFX
            this.showAlliedBondVFX(bestAlly);
            
            // Add log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(`Zoey forms an Allied Bond with ${bestAlly.name}, gaining ${bondValue} ${bestStatName}!`, 'zoey talent-effect');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applyAlliedBond:', error);
        }
    }
    
    // Apply Purifying Magic talent effect
    applyPurifyingMagic() {
        try {
            console.log('[Zoey Passive] Attempting to apply Purifying Magic');
            
            // Get all debuffs on Zoey
            const debuffs = this.character.debuffs || [];
            const activeDebuffs = debuffs.filter(debuff => debuff && debuff.duration > 0);
            
            if (activeDebuffs.length === 0) {
                console.log('[Zoey Passive] No debuffs to cleanse with Purifying Magic');
                return;
            }
            
            // Select a random debuff to cleanse
            const randomIndex = Math.floor(Math.random() * activeDebuffs.length);
            const debuffToCleanse = activeDebuffs[randomIndex];
            
            console.log(`[Zoey Passive] Purifying Magic cleanses: ${debuffToCleanse.name}`);
            
            // Remove the debuff
            if (this.character.removeDebuff) {
                this.character.removeDebuff(debuffToCleanse.id);
            } else {
                // Fallback: manually remove from debuffs array
                const debuffIndex = this.character.debuffs.indexOf(debuffToCleanse);
                if (debuffIndex > -1) {
                    this.character.debuffs.splice(debuffIndex, 1);
                }
            }
            
            // Show VFX
            this.showPurifyingMagicVFX();
            
            // Add log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(`Zoey's Purifying Magic cleanses ${debuffToCleanse.name}!`, 'zoey talent-effect');
            }
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(this.character);
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applyPurifyingMagic:', error);
        }
    }
    
    // Show Allied Bond VFX
    showAlliedBondVFX(ally) {
        try {
            // Get character elements
            const zoeyElement = document.getElementById(`character-${this.character.id}`);
            const allyElement = document.getElementById(`character-${ally.id}`);
            
            if (!zoeyElement || !allyElement) {
                console.warn('[Zoey Passive] Could not find character elements for Allied Bond VFX');
                return;
            }
            
            // Create connection beam between Zoey and ally
            const beam = document.createElement('div');
            beam.className = 'allied-bond-beam';
            document.body.appendChild(beam);
            
            // Get positions
            const zoeyRect = zoeyElement.getBoundingClientRect();
            const allyRect = allyElement.getBoundingClientRect();
            
            const zoeyX = zoeyRect.left + zoeyRect.width / 2;
            const zoeyY = zoeyRect.top + zoeyRect.height / 2;
            const allyX = allyRect.left + allyRect.width / 2;
            const allyY = allyRect.top + allyRect.height / 2;
            
            // Calculate beam properties
            const dx = allyX - zoeyX;
            const dy = allyY - zoeyY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Position and style the beam
            beam.style.left = `${zoeyX}px`;
            beam.style.top = `${zoeyY}px`;
            beam.style.width = `${length}px`;
            beam.style.transform = `rotate(${angle}deg)`;
            beam.style.transformOrigin = '0 50%';
            
            // Add glow effects to both characters
            const zoeyGlow = document.createElement('div');
            zoeyGlow.className = 'allied-bond-glow';
            zoeyElement.querySelector('.image-container').appendChild(zoeyGlow);
            
            const allyGlow = document.createElement('div');
            allyGlow.className = 'allied-bond-glow';
            allyElement.querySelector('.image-container').appendChild(allyGlow);
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/buff_apply.mp3', 0.6);
            }
            
            // Clean up after animation
            setTimeout(() => {
                if (beam.parentNode) beam.parentNode.removeChild(beam);
                if (zoeyGlow.parentNode) zoeyGlow.parentNode.removeChild(zoeyGlow);
                if (allyGlow.parentNode) allyGlow.parentNode.removeChild(allyGlow);
            }, 2000);
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showAlliedBondVFX:', error);
        }
    }
    
    // Show Purifying Magic VFX
    showPurifyingMagicVFX() {
        try {
            // Get Zoey's character element
            const characterElement = document.getElementById(`character-${this.character.id}`);
            if (!characterElement) return;
            
            const imageContainer = characterElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create purifying effect
            const purifyEffect = document.createElement('div');
            purifyEffect.className = 'purifying-magic-vfx';
            imageContainer.appendChild(purifyEffect);
            
            // Add cleansing particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'purifying-magic-particle';
                purifyEffect.appendChild(particle);
                
                // Set random direction for each particle
                const angle = Math.random() * Math.PI * 2;
                particle.style.setProperty('--pm-x', Math.cos(angle));
                particle.style.setProperty('--pm-y', Math.sin(angle));
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/cleanse.mp3', 0.5);
            }
            
            // Remove after animation
            setTimeout(() => {
                if (purifyEffect.parentNode) {
                    purifyEffect.parentNode.removeChild(purifyEffect);
                }
            }, 1500);
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showPurifyingMagicVFX:', error);
        }
    }

    /**
     * Handle dodge events for Zoey's talents
     */
    onDodge(dodgingCharacter, attacker) {
        // Only apply when Zoey dodges
        if (dodgingCharacter === this.character) {
            console.log(`[Zoey Passive] onDodge detected for ${this.character.name}`);
            
            // FIXED: Only apply if Agile Counterforce talent is enabled and not on cooldown
            if (this.character.enableAgileCounterforce && !this.agileCounterforceCooldown) {
                this.applyAgileCounterforceBuff();
            }
        }
    }

    // Apply Pack Leadership talent effect - Give allies 5% of Zoey's stats
    applyPackLeadership() {
        try {
            console.log('[Zoey Passive] Applying Pack Leadership talent');
            
            // Get all allies (teammates)
            let allies = [];
            if (window.gameManager && window.gameManager.gameState) {
                // Find all characters that are on the same team as Zoey
                const allCharacters = [
                    ...(window.gameManager.gameState.playerCharacters || []),
                    ...(window.gameManager.gameState.aiCharacters || [])
                ];
                
                // Filter to get allies (same team, but not Zoey herself)
                allies = allCharacters.filter(char => 
                    char && 
                    char !== this.character && 
                    char.team === this.character.team && 
                    !char.isDead()
                );
            }
            
            if (!allies.length) {
                console.log('[Zoey Passive] No allies found for Pack Leadership');
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Zoey has no allies to lead!`, 'zoey talent-effect');
                }
                return;
            }
            
            console.log('[Zoey Passive] Found allies for Pack Leadership:', allies.map(a => a.name));
            
            // Get 5% of all Zoey's stats
            const statsToShare = ['hp', 'mana', 'physicalDamage', 'magicalDamage', 'armor', 'magicalShield'];
            const statBonuses = {};
            
            for (const stat of statsToShare) {
                const zoeyStatValue = this.character.stats[stat] || 0;
                statBonuses[stat] = Math.round(zoeyStatValue * 0.05);
            }
            
            console.log('[Zoey Passive] Pack Leadership stat bonuses:', statBonuses);
            
            // Apply bonuses to each ally
            allies.forEach(ally => {
                // Create Pack Leadership buff for this ally
                const packLeadershipBuff = {
                    id: `pack_leadership_buff_${ally.id}`,
                    name: `Pack Leadership: ${this.character.name}`,
                    description: `Inspired by Zoey's leadership, gaining 5% of her stats for the battle.`,
                    icon: 'Icons/talents/pack_leadership.webp',
                    duration: -1, // Permanent for the battle
                    statModifiers: []
                };
                
                // Add stat modifiers for each stat with a bonus > 0
                for (const [stat, bonus] of Object.entries(statBonuses)) {
                    if (bonus > 0) {
                        packLeadershipBuff.statModifiers.push({
                            stat: stat,
                            value: bonus,
                            operation: 'add'
                        });
                    }
                }
                
                // Apply the buff if there are any bonuses
                if (packLeadershipBuff.statModifiers.length > 0) {
                    ally.addBuff(packLeadershipBuff);
                    console.log(`[Zoey Passive] Applied Pack Leadership buff to ${ally.name}`);
                }
            });
            
            // Show VFX and log
            this.showPackLeadershipVFX();
            
            if (window.gameManager) {
                const statSummary = Object.entries(statBonuses)
                    .filter(([stat, bonus]) => bonus > 0)
                    .map(([stat, bonus]) => `+${bonus} ${stat}`)
                    .join(', ');
                    
                window.gameManager.addLogEntry(`Zoey's Pack Leadership inspires her allies, granting them ${statSummary}!`, 'zoey talent-effect');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applyPackLeadership:', error);
        }
    }
    
    // Apply Symbiotic Healing talent effect - Heal self and allies for a portion of damage dealt
    applySymbioticHealing(healingAmount) {
        try {
            console.log(`[Zoey Passive] Applying Symbiotic Healing for ${healingAmount} HP`);
            
            // Get all team members (including Zoey herself)
            let teamMembers = [];
            if (window.gameManager && window.gameManager.gameState) {
                // Find all characters that are on the same team as Zoey
                const allCharacters = [
                    ...(window.gameManager.gameState.playerCharacters || []),
                    ...(window.gameManager.gameState.aiCharacters || [])
                ];
                
                // Filter to get team members (same team, including Zoey)
                teamMembers = allCharacters.filter(char => 
                    char && 
                    char.team === this.character.team && 
                    !char.isDead()
                );
            }
            
            if (!teamMembers.length) {
                console.log('[Zoey Passive] No team members found for Symbiotic Healing');
                return;
            }
            
            console.log('[Zoey Passive] Applying Symbiotic Healing to:', teamMembers.map(c => c.name));
            
            // Heal each team member
            let totalHealingDone = 0;
            teamMembers.forEach(member => {
                if (member.stats.currentHp < member.stats.maxHp) {
                    const actualHealing = member.heal(healingAmount, this.character, { 
                        showFloatingText: true,
                        type: 'symbiotic'
                    });
                    totalHealingDone += actualHealing;
                }
            });
            
            // Show VFX
            this.showSymbioticHealingVFX(teamMembers);
            
            // Add log entry
            if (window.gameManager && totalHealingDone > 0) {
                window.gameManager.addLogEntry(`Zoey's Symbiotic Healing restores ${healingAmount} HP to her team!`, 'zoey talent-effect');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applySymbioticHealing:', error);
        }
    }
    
    // Show Pack Leadership VFX
    showPackLeadershipVFX() {
        try {
            // Get Zoey's character element
            const zoeyElement = document.getElementById(`character-${this.character.id}`);
            if (!zoeyElement) return;
            
            // Create leadership aura effect
            const aura = document.createElement('div');
            aura.className = 'pack-leadership-aura';
            aura.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 200px;
                height: 200px;
                margin: -100px 0 0 -100px;
                border: 3px solid #FFD700;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 50%, transparent 70%);
                animation: packLeadershipPulse 2s ease-in-out;
                pointer-events: none;
                z-index: 100;
            `;
            
            zoeyElement.querySelector('.image-container').appendChild(aura);
            
            // Remove after animation
            setTimeout(() => {
                if (aura.parentNode) {
                    aura.parentNode.removeChild(aura);
                }
            }, 2000);
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/buff_apply.mp3', 0.6);
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showPackLeadershipVFX:', error);
        }
    }
    
    // Show Symbiotic Healing VFX
    showSymbioticHealingVFX(healedMembers) {
        try {
            healedMembers.forEach(member => {
                const memberElement = document.getElementById(`character-${member.id}`);
                if (!memberElement) return;
                
                // Create healing effect
                const healEffect = document.createElement('div');
                healEffect.className = 'symbiotic-healing-effect';
                healEffect.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(144, 238, 144, 0.6) 0%, rgba(144, 238, 144, 0.3) 40%, transparent 70%);
                    border-radius: 50%;
                    animation: symbioticHealPulse 1.5s ease-out;
                    pointer-events: none;
                    z-index: 50;
                `;
                
                memberElement.querySelector('.image-container').appendChild(healEffect);
                
                // Add floating particles
                for (let i = 0; i < 8; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'symbiotic-heal-particle';
                    particle.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 6px;
                        height: 6px;
                        background: #90EE90;
                        border-radius: 50%;
                        margin: -3px;
                        animation: healParticleFloat ${1 + Math.random()}s ease-out forwards;
                        animation-delay: ${Math.random() * 0.5}s;
                        pointer-events: none;
                        z-index: 60;
                    `;
                    
                    const angle = (360 / 8) * i;
                    particle.style.transform = `rotate(${angle}deg) translate(40px, 0)`;
                    
                    memberElement.querySelector('.image-container').appendChild(particle);
                    
                    // Remove particle after animation
                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
                    }, 1500);
                }
                
                // Remove main effect after animation
                setTimeout(() => {
                    if (healEffect.parentNode) {
                        healEffect.parentNode.removeChild(healEffect);
                    }
                }, 1500);
            });
            
            // Play healing sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/heal.mp3', 0.5);
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showSymbioticHealingVFX:', error);
        }
    }

    // Apply Feline Vitality talent effect - Enhance healing received by 35%
    applyFelineVitality() {
        try {
            console.log('[Zoey Passive] Applying Feline Vitality talent');
            
            // Set the healing received multiplier to 1.35 (35% more powerful)
            this.character.healingReceivedMultiplier = 1.35;
            
            console.log(`[Zoey Passive] Feline Vitality: Set ${this.character.name}'s healing multiplier to ${this.character.healingReceivedMultiplier}`);
            
            // Show VFX
            this.showFelineVitalityVFX();
            
            // Add log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(`Zoey's Feline Vitality enhances all healing she receives by 35%!`, 'zoey talent-effect');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applyFelineVitality:', error);
        }
    }
    
    // Show Feline Vitality VFX
    showFelineVitalityVFX() {
        try {
            // Get Zoey's character element
            const zoeyElement = document.getElementById(`character-${this.character.id}`);
            if (!zoeyElement) return;
            
            // Create vitality aura effect
            const aura = document.createElement('div');
            aura.className = 'feline-vitality-aura';
            aura.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 180px;
                height: 180px;
                margin: -90px 0 0 -90px;
                border: 3px solid #00FF7F;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(0, 255, 127, 0.4) 0%, rgba(0, 255, 127, 0.2) 50%, transparent 70%);
                animation: felineVitalityPulse 3s ease-in-out;
                pointer-events: none;
                z-index: 100;
            `;
            
            zoeyElement.querySelector('.image-container').appendChild(aura);
            
            // Add healing particles around Zoey
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'feline-vitality-particle';
                particle.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(45deg, #00FF7F, #32CD32);
                    border-radius: 50%;
                    margin: -4px;
                    animation: vitalityParticleOrbit ${2 + Math.random()}s linear infinite;
                    animation-delay: ${(i / 12) * 2}s;
                    pointer-events: none;
                    z-index: 80;
                `;
                
                const angle = (360 / 12) * i;
                particle.style.transform = `rotate(${angle}deg) translate(70px, 0)`;
                
                zoeyElement.querySelector('.image-container').appendChild(particle);
                
                // Remove particle after initial animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }
            
            // Remove main aura after animation
            setTimeout(() => {
                if (aura.parentNode) {
                    aura.parentNode.removeChild(aura);
                }
            }, 3000);
            
            // Play enhancement sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/buff_apply.mp3', 0.7);
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showFelineVitalityVFX:', error);
        }
    }

    // Apply Enduring Magic talent effect - Extend buff duration
    applyEnduringMagic() {
        try {
            console.log('[Zoey Passive] Applying Enduring Magic talent');
            
            // Set the buff duration bonus to +1 turn for all future buffs
            this.character.buffDurationBonus = 1;
            
            console.log(`[Zoey Passive] Enduring Magic: Set ${this.character.name}'s buff duration bonus to +${this.character.buffDurationBonus} turn`);
            
            // Show VFX
            this.showEnduringMagicVFX();
            
            // Add log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(`Zoey's Enduring Magic enhances all buffs she receives to last 1 additional turn!`, 'zoey talent-effect');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applyEnduringMagic:', error);
        }
    }
    
    // Show Enduring Magic VFX
    showEnduringMagicVFX() {
        try {
            // Get Zoey's character element
            const characterElement = document.getElementById(`character-${this.character.id}`);
            if (!characterElement) return;
            
            const imageContainer = characterElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create extending effect
            const extendEffect = document.createElement('div');
            extendEffect.className = 'enduring-magic-vfx';
            imageContainer.appendChild(extendEffect);
            
            // Add extending particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'enduring-magic-particle';
                extendEffect.appendChild(particle);
                
                // Set random direction for each particle
                const angle = Math.random() * Math.PI * 2;
                particle.style.setProperty('--em-x', Math.cos(angle));
                particle.style.setProperty('--em-y', Math.sin(angle));
            }
            
            // Play sound if available
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/abilities/buff_extend.mp3', 0.5);
            }
            
            // Remove after animation
            setTimeout(() => {
                if (extendEffect.parentNode) {
                    extendEffect.parentNode.removeChild(extendEffect);
                }
            }, 1500);
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showEnduringMagicVFX:', error);
        }
    }
    
    applyPredatoryInstinct() {
        console.log(`[Zoey Passive] Applying Predatory Instinct talent effects...`);
        
        // Find Heart Pounce ability (zoey_w)
        const heartPounceAbility = this.character.abilities.find(ability => ability.id === 'zoey_w');
        if (heartPounceAbility) {
            // Disable the ability by marking it as disabled
            heartPounceAbility.isDisabled = true;
            heartPounceAbility.disabledByTalent = true;
            console.log(`[Zoey Passive] Heart Pounce ability disabled`);
            
            // Update UI if available
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(this.character);
            }
        }
        
        // Add turn start listener for auto-cast
        if (!this.predatoryInstinctListener) {
            this.predatoryInstinctListener = this.onTurnStart.bind(this);
            document.addEventListener('turn:start', this.predatoryInstinctListener);
            console.log(`[Zoey Passive] Turn start listener added for Predatory Instinct`);
        }
    }
    
    onTurnStart(event) {
        // Only trigger for Zoey when the player phase starts and Predatory Instinct is enabled
        if (event.detail && 
            event.detail.phase === 'player' && 
            event.detail.character === this.character &&
            this.character.enablePredatoryInstinct) {
            
            console.log(`[Zoey Passive] Predatory Instinct triggered at turn start - auto-casting Heart Pounce`);
            // Add small delay to make the auto-cast more noticeable
            setTimeout(() => {
                this.autoCastHeartPounce();
            }, 500);
        }
    }
    
    async autoCastHeartPounce() {
        try {
            // Find the lowest health enemy
            const enemies = window.gameManager?.gameState?.aiCharacters?.filter(enemy => !enemy.isDead()) || [];
            if (enemies.length === 0) {
                console.log(`[Zoey Passive] No valid enemies for Predatory Instinct auto-cast`);
                return;
            }
            
            let lowestHealthEnemy = enemies[0];
            for (const enemy of enemies) {
                if (enemy.stats.currentHealth < lowestHealthEnemy.stats.currentHealth) {
                    lowestHealthEnemy = enemy;
                }
            }
            
            console.log(`[Zoey Passive] Predatory Instinct targeting ${lowestHealthEnemy.name} with ${lowestHealthEnemy.stats.currentHealth} HP`);
            
            // Find Heart Pounce ability
            const heartPounceAbility = this.character.abilities.find(ability => ability.id === 'zoey_w');
            if (!heartPounceAbility) {
                console.error(`[Zoey Passive] Heart Pounce ability not found for auto-cast`);
                return;
            }
            
            // Store original ability state for restoration
            
            // Add log entry
            if (window.gameManager) {
                window.gameManager.addLogEntry(`Predatory Instinct triggers! Zoey automatically pounces on ${lowestHealthEnemy.name}!`, 'zoey talent-effect');
            }
            
            // Show VFX for the talent activation
            this.showPredatoryInstinctVFX();
            
            // Auto-cast the ability using the character's useAbility method
            const abilityIndex = this.character.abilities.findIndex(a => a.id === 'zoey_w');
            if (abilityIndex !== -1) {
                // Temporarily enable the ability for auto-cast
                const originalDisabled = heartPounceAbility.isDisabled;
                const originalCooldown = heartPounceAbility.currentCooldown;
                
                heartPounceAbility.isDisabled = false;
                heartPounceAbility.currentCooldown = 0;
                
                // Use the ability
                const success = this.character.useAbility(abilityIndex, lowestHealthEnemy);
                
                // Restore original state
                heartPounceAbility.isDisabled = originalDisabled;
                heartPounceAbility.currentCooldown = originalCooldown;
                
                if (success) {
                    console.log(`[Zoey Passive] Predatory Instinct auto-cast successful`);
                } else {
                    console.log(`[Zoey Passive] Predatory Instinct auto-cast failed`);
                }
            }
            
            console.log(`[Zoey Passive] Predatory Instinct auto-cast completed`);
            
        } catch (error) {
            console.error(`[Zoey Passive] Error during Predatory Instinct auto-cast:`, error);
        }
    }
    
    showPredatoryInstinctVFX() {
        // Get character element by ID if direct reference not available
        const characterElement = this.character.element || document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!characterElement) {
            console.warn(`[Zoey Passive] Could not find character element for Predatory Instinct VFX`);
            return;
        }
        
        // Create predatory instinct effect
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'predatory-instinct-vfx';
        characterElement.appendChild(vfxContainer);
        
        // Add predatory aura effect
        const aura = document.createElement('div');
        aura.className = 'predatory-aura';
        vfxContainer.appendChild(aura);
        
        // Add eye glow effect
        const eyeGlow = document.createElement('div');
        eyeGlow.className = 'predatory-eyes';
        vfxContainer.appendChild(eyeGlow);
        
        // Add floating text
        const floatingText = document.createElement('div');
        floatingText.className = 'predatory-text';
        floatingText.textContent = 'PREDATORY INSTINCT';
        vfxContainer.appendChild(floatingText);
        
        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer && vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2000);
    }
    
    // Recast Strawberry Bell Burst for Bell Recast talent
    recastStrawberryBellBurst(originalTarget) {
        console.log('[Zoey Passive] recastStrawberryBellBurst called with target:', originalTarget);
        try {
            if (!originalTarget || originalTarget.isDead()) {
                console.log('[Zoey Passive] Bell Recast: Original target is dead, cancelling recast');
                return;
            }
            
            console.log('[Zoey Passive] Bell Recast talent triggered!');
            
            // Get game manager reference
            const gameManager = window.gameManager;
            if (!gameManager) {
                console.error('[Zoey Passive] Game manager not available for Bell Recast');
                return;
            }
            
            // Add log entry
            gameManager.addLogEntry(`Bell Recast triggers! Zoey recasts Strawberry Bell Burst!`, 'zoey talent-effect');
            
            // Get the Strawberry Bell Burst ability
            const originalAbility = this.character.abilities.find(a => a.id === 'zoey_q');
            if (!originalAbility) {
                console.error('[Zoey Passive] Strawberry Bell Burst ability not found for recast');
                return;
            }
            
            // Create a modified ability object that marks itself as a recast
            const recastAbility = {
                ...originalAbility,
                isRecast: true // Flag to prevent infinite loop
            };
            
            console.log('[Zoey Passive] About to execute recast with ability:', recastAbility);
            
            // Execute the ability directly without consuming mana or triggering cooldown
            if (window.executeStrawberryBellBurst) {
                console.log('[Zoey Passive] Calling executeStrawberryBellBurst for recast');
                window.executeStrawberryBellBurst(this.character, originalTarget, recastAbility);
            } else {
                console.error('[Zoey Passive] executeStrawberryBellBurst function not found');
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in recastStrawberryBellBurst:', error);
        }
    }
    
    // Apply healing from Sparkle Bell Healing talent
    applySparkleBellHealing(healAmount) {
        try {
            if (!this.character || this.character.isDead()) {
                return;
            }
            
            // Apply healing to Zoey
            const actualHealing = this.character.heal(healAmount);
            
            if (actualHealing > 0) {
                // Add log entry
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`Sparkle Bell Healing restores ${actualHealing} HP to ${this.character.name}!`, 'zoey talent-effect');
                }
                
                // Show healing VFX
                this.showSparkleBellHealingVFX(actualHealing);
                
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(this.character);
                }
            }
            
        } catch (error) {
            console.error('[Zoey Passive] Error in applySparkleBellHealing:', error);
        }
    }
    
    // Show VFX for Sparkle Bell Healing
    showSparkleBellHealingVFX(healAmount) {
        try {
            const characterElement = this.character.element || document.getElementById(`character-${this.character.instanceId || this.character.id}`);
            if (!characterElement) return;
            
            // Create healing VFX container
            const healVfx = document.createElement('div');
            healVfx.className = 'sparkle-bell-healing-vfx';
            characterElement.appendChild(healVfx);
            
            // Create healing particles with sparkle theme
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'sparkle-bell-heal-particle';
                particle.style.left = `${Math.random() * 80 + 10}%`;
                particle.style.top = `${Math.random() * 80 + 10}%`;
                particle.style.animationDelay = `${Math.random() * 0.5}s`;
                healVfx.appendChild(particle);
            }
            
            // Create healing number display
            const healNumber = document.createElement('div');
            healNumber.className = 'heal-number sparkle-bell-heal';
            healNumber.textContent = `+${healAmount}`;
            healVfx.appendChild(healNumber);
            
            // Create bell sparkle effect
            const bellSparkle = document.createElement('div');
            bellSparkle.className = 'bell-heal-sparkle';
            healVfx.appendChild(bellSparkle);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                healVfx.remove();
            }, 2000);
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showSparkleBellHealingVFX:', error);
        }
    }
    
    showDoubleBellMarkVFX(target) {
        try {
            const targetElement = document.getElementById(`character-${target.id}`);
            if (!targetElement) return;
            
            const imageContainer = targetElement.querySelector('.image-container');
            if (!imageContainer) return;
            
            // Create the double mark VFX
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'double-bell-mark-vfx';
            imageContainer.appendChild(vfxContainer);
            
            // Add text indicator
            const text = document.createElement('div');
            text.textContent = 'DOUBLE MARKED!';
            text.style.cssText = `
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                color: #FFD700;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px #FFD700;
                animation: doubleBellMarkAppear 2s ease-out forwards;
                z-index: 20;
                pointer-events: none;
            `;
            vfxContainer.appendChild(text);
            
            // Remove effect after animation
            setTimeout(() => {
                if (vfxContainer.parentNode) {
                    vfxContainer.parentNode.removeChild(vfxContainer);
                }
            }, 2000);
            
        } catch (error) {
            console.error('[Zoey Passive] Error in showDoubleBellMarkVFX:', error);
        }
    }
}

// Register the passive with PassiveFactory
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') {
    console.log("[Passive Registration] Attempting to register: zoey_passive with class:", ZoeyPassive);
    window.PassiveFactory.registerPassive('zoey_passive', ZoeyPassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, ZoeyPassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
    
    // Fallback: Add to window object so it can be found by other registration methods
    window.ZoeyPassive = ZoeyPassive;
} 