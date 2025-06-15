// Farmer Alice's abilities and passive implementation

// Override the applyDamage method for Farmer Alice to implement her passive
class FarmerAliceCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        
        // Initialize counter for magic shield gained from passive
        this.magicShieldFromPassive = 0;
        
        // --- ADDED: Store base passive description --- 
        this.basePassiveDescription = this.passive ? this.passive.description : 'When hit by magical damage, permanently gains 2 Magic Shield.'; 
        // --- END ADDED ---
        
        // Create the magic shield counter when the character is initialized
        this.createMagicShieldCounter();
        
        // --- ADDED: Generate initial passive description --- 
        if (typeof this.generatePassiveDescription === 'function') {
            this.generatePassiveDescription(); 
        }
        // --- END ADDED ---

        // --- NEW: Listen for stage loaded to apply bonusHpPerEnemy effect ---
        this.setupBonusHpPerEnemyHandling();
        // --- END NEW ---

        // --- MODIFIED: Move Mana Conversion to be applied after game state is ready ---
        // We'll apply it in response to an event rather than in the constructor
        this.setupManaConversionHandling();
        // --- END MODIFIED ---

        // Setup Natural Regeneration buff handling
        this.setupNaturalRegenerationHandling();
        
        // Setup to show Defensive Fortitude VFX when applicable
        this.setupDefensiveFortitudeHandler();
        
        // Setup Protective Aura talent
        this.setupProtectiveAuraHandling();
        
        // Update ability descriptions to fix NaN issue
        setTimeout(() => {
            if (typeof updateAliceAbilityDescriptions === 'function') {
                updateAliceAbilityDescriptions(this);
            }
        }, 100);
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
    
    // --- MODIFIED: Setup method for Mana Conversion instead of direct application ---
    setupManaConversionHandling() {
        // Use a custom event handler to apply mana conversion when game state is ready
        this._manaConversionHandler = (event) => {
            this.applyManaConversion();
        };
        
        // Add the event listener for the gameStateReady event
        document.addEventListener('gameStateReady', this._manaConversionHandler);
        
        // Also apply it after a short delay to catch cases where the event might have already fired
        setTimeout(() => this.applyManaConversion(), 1000);
    }
    
    // Method to apply Mana Conversion talent
    applyManaConversion() {
        // Log the talent check to debug
        console.log(`[Mana Conversion Debug] Checking talent for ${this.name}: manaConversionToHp = ${this.manaConversionToHp}, maxMana = ${this.stats.maxMana}`);
        
        if (this.manaConversionToHp && this.manaConversionToHp > 0) {
            const bonusHp = Math.floor(this.stats.maxMana * this.manaConversionToHp);
            // Set a flag to avoid applying multiple times
            if (bonusHp > 0 && !this._manaConversionApplied) {
                // Apply bonus HP
                this.stats.maxHp += bonusHp;
                this.stats.currentHp += bonusHp;
                this._manaConversionApplied = true;
                
                console.log(`Applied Mana Conversion talent: +${bonusHp} HP (${Math.round(this.manaConversionToHp * 100)}% of ${this.stats.maxMana} Mana)`);
                
                // Log the bonus if game manager is available
                if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
                    window.gameManager.addLogEntry(`${this.name}'s Mana Conversion provides +${bonusHp} HP.`, 'talent-effect');
                }
                
                // Show VFX
                setTimeout(() => {
                    const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                    if (charElement) {
                        const vfxContainer = document.createElement('div');
                        vfxContainer.className = 'mana-conversion-vfx';
                        vfxContainer.innerHTML = `<span class="talent-effect">+${bonusHp} HP from Mana</span>`;
                        charElement.appendChild(vfxContainer);
                        
                        // Remove the VFX after animation
                        setTimeout(() => {
                            vfxContainer.remove();
                        }, 3000);
                    }
                    
                    // Play a sound if available
                    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                        window.gameManager.playSound('sounds/mana_conversion.mp3', 0.6);
                    }
                    
                    // Update UI if the gameManager is available
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(this);
                    }
                }, 500); // Small delay to ensure it shows after other initialization effects
            }
        }
    }
    // --- END MODIFIED ---
    
    // Override useAbility to implement the Revitalizing Magic talent
    useAbility(index, target) {
        // Call the original method to use the ability
        const result = super.useAbility(index, target);
        
        // Check if the ability was successfully used and if the character has the healOnAbilityUse property
        if (result !== false && this.healOnAbilityUse) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            
            // Calculate healing amount: base amount + (magicalShield * multiplier)
            const baseAmount = this.healOnAbilityUse.baseAmount || 155;
            const msMultiplier = this.healOnAbilityUse.magicalShieldMultiplier || 2.5;
            const msBonus = Math.floor(this.stats.magicalShield * msMultiplier);
            const healAmount = baseAmount + msBonus;
            
            // Apply the healing
            this.heal(healAmount, this);
            
            // Log the healing
            log(`${this.name}'s Revitalizing Magic heals for ${healAmount} HP.`, 'talent-effect');
            
            // Display VFX
            const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
            if (charElement) {
                const vfxContainer = document.createElement('div');
                vfxContainer.className = 'vfx-container revitalizing-magic-vfx-container';
                charElement.appendChild(vfxContainer);
                
                const healVfx = document.createElement('div');
                healVfx.className = 'revitalizing-magic-heal';
                healVfx.innerHTML = `<span class="talent-effect">+${healAmount} HP</span><span class="talent-detail">(Revitalizing Magic)</span>`;
                vfxContainer.appendChild(healVfx);
                
                // Play healing sound
                playSound('sounds/talent_healing.mp3', 0.6);
                
                // Remove the VFX after animation completes
                setTimeout(() => {
                    vfxContainer.remove();
                }, 1800);
            }
        }

        // --- NEW: Arcane Infusion talent implementation ---
        if (result !== false && this.arcaneInfusionChance) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            
            // Check if Arcane Infusion procs (10% chance)
            if (Math.random() < this.arcaneInfusionChance) {
                // Decide whether to buff self or ally (if target is an ally)
                let buffTarget = this;
                
                // If the ability target is a valid ally, 50% chance to buff them instead
                if (target && target !== this && !target.isAI && !target.isDead() && Math.random() < 0.5) {
                    buffTarget = target;
                }
                
                // Calculate magic shield buff (10% increase)
                const shieldBuff = Math.ceil(buffTarget.stats.magicalShield * 0.1);
                
                // Create arcane infusion buff
                const arcaneInfusionBuff = new Effect(
                    'arcane_infusion_buff',
                    'Arcane Infusion',
                    'Icons/talents/arcane_infusion.webp',
                    3, // Duration of 3 turns
                    null,
                    false // Is a buff
                );
                
                // Set stat modifiers for the buff
                arcaneInfusionBuff.statModifiers = [
                    { stat: 'magicalShield', value: shieldBuff, operation: 'add' }
                ];
                
                arcaneInfusionBuff.setDescription(`Increases Magic Shield by ${shieldBuff} for 3 turns.`);
                
                // Add a custom remove method to display a message when the buff expires
                arcaneInfusionBuff.remove = function(character) {
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`${character.name}'s Arcane Infusion has worn off.`);
                    }
                };
                
                // Add buff to target
                buffTarget.addBuff(arcaneInfusionBuff.clone());
                
                // Show VFX for the buff
                const targetElement = document.getElementById(`character-${buffTarget.instanceId || buffTarget.id}`);
                if (targetElement) {
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'arcane-infusion-vfx';
                    vfxContainer.innerHTML = `
                        <div class="arcane-infusion-glow"></div>
                        <div class="arcane-infusion-text">Arcane Infusion!</div>
                        <div class="arcane-infusion-value">+${shieldBuff} MS</div>
                    `;
                    targetElement.appendChild(vfxContainer);
                    
                    // Play sound
                    playSound('sounds/arcane_infusion.mp3', 0.7);
                    
                    // Remove VFX after animation
                    setTimeout(() => vfxContainer.remove(), 2000);
                }
                
                // Log the proc
                log(`${this.name}'s Arcane Infusion activates, giving ${buffTarget.name} +${shieldBuff} Magic Shield for 3 turns!`, 'talent-effect');
            }
        }
        // --- END NEW ---
        
        return result;
    }
    
    // --- MODIFIED: Override heal method to implement Shield Transfer talent ---
    heal(amount, caster = null, options = {}) {
        // Log the talent check to debug
        if (caster && caster !== this) {
            console.log(`[Shield Transfer Debug] ${this.name} being healed by ${caster.name} for ${amount} HP. shieldTransferOnHeal = ${this.shieldTransferOnHeal}`);
        }
        
        // Call the parent heal method to perform normal healing
        const result = super.heal(amount, caster, options);
        
        // Debug the result
        if (caster && caster !== this) {
            console.log(`[Shield Transfer Debug] Healing result:`, result);
        }
        
        // Check if Shield Transfer talent is active and if healing was done by someone else
        if (this.shieldTransferOnHeal && caster && caster !== this && result && result.healAmount > 0) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            
            console.log(`[Shield Transfer Debug] Valid healing from other: amount = ${result.healAmount}, MS = ${this.stats.magicalShield}, transfer = ${this.shieldTransferOnHeal}`);
            
            // Calculate shield amount to transfer (50% of Alice's magic shield)
            const shieldAmount = Math.ceil(this.stats.magicalShield * this.shieldTransferOnHeal);
            
            if (shieldAmount > 0) {
                console.log(`[Shield Transfer Debug] Applying shield buff of ${shieldAmount} to ${caster.name}`);
                
                // Create shield transfer buff
                const shieldTransferBuff = new Effect(
                    'shield_transfer_buff_' + Date.now(), // Add timestamp to make it unique for stacking
                    'Shield Transfer',
                    'Icons/talents/shield_transfer.webp',
                    5, // Duration of 5 turns
                    null,
                    false // Is a buff
                );
                
                // Set stat modifiers for the buff
                shieldTransferBuff.statModifiers = [
                    { stat: 'magicalShield', value: shieldAmount, operation: 'add' }
                ];
                
                shieldTransferBuff.setDescription(`Gains ${shieldAmount} Magic Shield from healing ${this.name} for 5 turns.`);
                
                // Add a custom remove method to display a message when the buff expires
                shieldTransferBuff.remove = function(character) {
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`${character.name}'s Shield Transfer buff has worn off.`);
                    }
                };
                
                // Add buff to caster (stacking allowed)
                caster.addBuff(shieldTransferBuff);
                
                // Show VFX for the buff
                const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                if (casterElement) {
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'shield-transfer-vfx';
                    vfxContainer.innerHTML = `
                        <div class="shield-transfer-glow"></div>
                        <div class="shield-transfer-text">Shield Transfer!</div>
                        <div class="shield-transfer-value">+${shieldAmount} MS</div>
                    `;
                    casterElement.appendChild(vfxContainer);
                    
                    // Play sound
                    playSound('sounds/shield_transfer.mp3', 0.7);
                    
                    // Remove VFX after animation
                    setTimeout(() => vfxContainer.remove(), 2000);
                }
                
                // Log the shield transfer
                log(`${this.name}'s Shield Transfer activates, giving ${caster.name} +${shieldAmount} Magic Shield for 5 turns!`, 'talent-effect');
                
                // Update UI if the gameManager is available
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(caster);
                }
            }
        }
        
        return result;
    }
    // --- END MODIFIED ---
    
    applyDamage(amount, type, caster = null, options = {}) {
        // Call the parent method to handle the normal damage application
        const result = super.applyDamage(amount, type, caster, options);
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        // --- DEBUG: Check healAlliesOnDamage property ---
        console.log(`[Healing Aura Debug - ${this.name}] Checking condition: result.damage=${result.damage}, this.healAlliesOnDamage=${this.healAlliesOnDamage}, window.gameManager=${!!window.gameManager}`);
        // --- END DEBUG ---

        // --- NEW: Damage Reflection Talent ---
        if (result.damage > 0 && this.damageReflectionPercent > 0 && caster && !caster.isDead() && !options.isRetaliation) {
            // Calculate damage to reflect
            const reflectDamage = Math.ceil(result.damage * this.damageReflectionPercent);
            
            if (reflectDamage > 0) {
                log(`${this.name}'s Damage Reflection talent activates!`, 'talent-effect');
                
                // Apply reflected damage to the caster
                caster.applyDamage(reflectDamage, type, this, { isRetaliation: true });
                log(`${this.name} reflects ${reflectDamage} damage back to ${caster.name}!`, 'talent-effect');
                
                // Add damage reflection VFX
                const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                if (casterElement) {
                    // Add reflection active class for glow effect
                    casterElement.classList.add('reflection-active');
                    
                    const reflectVfx = document.createElement('div');
                    reflectVfx.className = 'damage-reflection-vfx';
                    reflectVfx.innerHTML = `<span>Reflected: ${reflectDamage}</span>`;
                    casterElement.appendChild(reflectVfx);
                    
                    // Remove VFX and class after animation
                    setTimeout(() => {
                        reflectVfx.remove();
                        casterElement.classList.remove('reflection-active');
                    }, 1500);
                    
                    // Play reflection sound
                    playSound('sounds/damage_reflection.mp3', 0.6);
                }
            }
        }
        // --- END NEW ---

        // --- NEW: Healing Aura Talent ---
        if (result.damage > 0 && this.healAlliesOnDamage && window.gameManager) {
            // Get all allies
            const allies = window.gameManager.getAllies(this);
            
            // Exclude self from healing
            const otherAllies = allies.filter(ally => ally.instanceId !== this.instanceId);
            
            if (otherAllies.length > 0) {
                log(`${this.name}'s Healing Aura activates!`, 'talent-effect');
                
                // Heal each ally for 1% of their missing HP
                otherAllies.forEach(ally => {
                    if (!ally.isDead()) {
                        const missingHealth = ally.stats.maxHp - ally.stats.currentHp;
                        // Use Math.ceil to ensure at least 1 HP is healed if missingHealth > 0
                        const healAmount = Math.ceil(missingHealth * this.healAlliesOnDamage); 
                        
                        // --- DEBUG: Log calculation values ---
                        console.log(`[Healing Aura Debug - ${this.name}] Ally: ${ally.name}, MaxHP: ${ally.stats.maxHp}, CurrentHP: ${ally.stats.currentHp}, Missing: ${missingHealth}, Calculated Heal: ${healAmount}`);
                        // --- END DEBUG ---

                        if (healAmount > 0 && missingHealth > 0) { // Also check missingHealth to avoid healing full HP allies
                            ally.heal(healAmount);
                            log(`${ally.name} is healed for ${healAmount} HP by ${this.name}'s Healing Aura.`, 'talent-effect');
                            
                            // --- Healing Aura VFX ---
                            const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
                            if (allyElement) {
                                const auraHealVfxContainer = document.createElement('div');
                                auraHealVfxContainer.className = 'vfx-container healing-aura-vfx-container';
                                allyElement.appendChild(auraHealVfxContainer);
                                
                                const auraHealVfx = document.createElement('div');
                                auraHealVfx.className = 'healing-vfx'; // Reuse existing healing style
                                auraHealVfx.innerHTML = `<span class="talent-effect">+${healAmount} HP</span>`;
                                auraHealVfxContainer.appendChild(auraHealVfx);
                                
                                setTimeout(() => auraHealVfxContainer.remove(), 1500);
                            }
                            // --- End Healing Aura VFX ---
                        }
                    }
                });
                
                // Play a healing sound once for the aura effect
                playSound('sounds/aura_heal.mp3', 0.5);
            }
        }
        // --- END NEW ---

        // --- NEW: Quick Reflexes Talent Cooldown Reduction ---
        if (result.damage > 0 && this.chanceToReduceCooldownsOnHit && Math.random() < this.chanceToReduceCooldownsOnHit) {
            let reducedCount = 0;
            log(`${this.name}'s Quick Reflexes talent activates!`, 'talent-effect');
            this.abilities.forEach(ability => {
                // Optionally exclude Carrot Power Up if we don't want double-dipping, but let's include it for now
                if (ability.currentCooldown > 0) {
                    ability.currentCooldown -= 1;
                    reducedCount++;
                    // Update UI for this specific ability
                    if (window.gameManager && typeof window.gameManager.updateAbilityCooldownDisplay === 'function') {
                        window.gameManager.updateAbilityCooldownDisplay(this.instanceId || this.id, ability.id);
                    }
                }
            });

            if (reducedCount > 0) {
                log(`Reduced cooldowns for ${reducedCount} abilities by 1 turn.`, 'talent-effect');
                // --- Talent Cooldown Reduction VFX (similar to Carrot Power) ---
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                if (charElement) {
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'vfx-container alice-talent-cd-reduction-vfx-container';
                    charElement.appendChild(vfxContainer);

                    const cdReductionVfx = document.createElement('div');
                    cdReductionVfx.className = 'alice-talent-cd-reduction-vfx'; // Use a specific class for styling if needed
                    cdReductionVfx.innerHTML = `<span>Quick Reflexes! -1 CD</span>`;
                    vfxContainer.appendChild(cdReductionVfx);

                    playSound('sounds/cooldown_reduced_talent.mp3', 0.5); // Maybe a slightly different sound

                    setTimeout(() => vfxContainer.remove(), 1300);
                }
                // --- End Talent Cooldown Reduction VFX ---
            }
        }
        // --- END NEW ---

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
    
    // --- ADDED: Method to generate passive description --- 
    generatePassiveDescription() {
        if (!this.passive || !this.basePassiveDescription) return;

        let desc = this.basePassiveDescription;

        // Check for Reinforced Fur
        if (this.hasReinforcedFurTalent) { 
            desc += ` <span class="talent-effect">(Reinforced Fur: +8 Armor)</span>`;
        }

        // Check for Quick Reflexes
        if (this.chanceToReduceCooldownsOnHit) {
            const chancePercent = this.chanceToReduceCooldownsOnHit * 100;
            desc += ` <span class="talent-effect">(Quick Reflexes: ${chancePercent}% chance on taking damage to reduce all cooldowns by 1)</span>`;
        }
        
        // Check for Healing Aura
        if (this.healAlliesOnDamage) {
            const healPercent = this.healAlliesOnDamage * 100;
            desc += ` <span class="talent-effect">(Healing Aura: When taking damage, heal all allies for ${healPercent}% of their missing HP)</span>`;
        }
        
        // Check for Enhanced Recovery
        if (this.healingReceivedMultiplier && this.healingReceivedMultiplier !== 1.0) {
            const healBoostPercent = (this.healingReceivedMultiplier - 1) * 100;
            desc += ` <span class="talent-effect healing">(Enhanced Recovery: Healing received increased by ${healBoostPercent}%)</span>`;
        }

        // Check for Lasting Protection
        if (this.buffDurationBonus && this.buffDurationBonus > 0) {
            desc += ` <span class="talent-effect utility">(Lasting Protection: Buffs last ${this.buffDurationBonus} turns longer)</span>`;
        }
        
        // Check for Revitalizing Magic
        if (this.healOnAbilityUse) {
            const baseHeal = this.healOnAbilityUse.baseAmount || 155;
            const msMultiplier = this.healOnAbilityUse.magicalShieldMultiplier || 2.5;
            desc += ` <span class="talent-effect healing">(Revitalizing Magic: Heal for ${baseHeal} (+${msMultiplier * 100}% MS) when using abilities)</span>`;
        }

        // Check for Adaptive Defense talent
        if (this.bonusHpPerEnemy) {
            desc += ` <span class="talent-effect utility">(Adaptive Defense: Start with +${this.bonusHpPerEnemy} HP per enemy)</span>`;
        }
        
        // Check for Natural Healer talent
        if (this.stats.healingPower > 0) {
            const healingPowerPercent = this.stats.healingPower * 100;
            desc += ` <span class="talent-effect healing">(Natural Healer: +${healingPowerPercent}% Healing Power)</span>`;
        }

        // Check for Mana Conversion talent
        if (this.manaConversionToHp) {
            const manaConversionPercent = this.manaConversionToHp * 100;
            desc += ` <span class="talent-effect utility">(Mana Conversion: Gain ${manaConversionPercent}% of Max Mana as HP)</span>`;
        }
        
        // Check for Arcane Infusion talent
        if (this.arcaneInfusionChance) {
            const arcaneInfusionPercent = this.arcaneInfusionChance * 100;
            desc += ` <span class="talent-effect utility">(Arcane Infusion: ${arcaneInfusionPercent}% chance on ability use to grant Magic Shield buff)</span>`;
        }
        
        // Check for Shield Transfer talent
        if (this.shieldTransferOnHeal) {
            const shieldTransferPercent = this.shieldTransferOnHeal * 100;
            desc += ` <span class="talent-effect utility">(Shield Transfer: Allies healing Alice gain ${shieldTransferPercent}% of her MS as a buff)</span>`;
        }
        
        // Check for Nimble Movements talent
        if (this.stats && this.stats.dodgeChance && this.stats.dodgeChance > 0.05) {
            // Base dodge chance is 0.05 (5%), so we only show the talent if it's higher
            const dodgePercent = Math.round(this.stats.dodgeChance * 100);
            desc += ` <span class="talent-effect utility">(Nimble Movements: ${dodgePercent}% chance to dodge attacks)</span>`;
        }
        
        // Check for Damage Reflection talent
        if (this.damageReflectionPercent && this.damageReflectionPercent > 0) {
            const reflectPercent = this.damageReflectionPercent * 100;
            desc += ` <span class="talent-effect utility">(Damage Reflection: Reflects ${reflectPercent}% of damage taken back to attacker)</span>`;
        }
        
        // Check for Protective Aura talent
        if (this.protectiveAuraShield && this.protectiveAuraShield > 0) {
            const auraPercent = this.protectiveAuraShield * 100;
            desc += ` <span class="talent-effect utility">(Protective Aura: Grants all allies ${auraPercent}% of Alice's Magic Shield)</span>`;
        }

        this.passive.description = desc;
        console.log(`[FarmerAliceCharacter] Updated passive description for ${this.name}: ${this.passive.description}`);

        // Update UI immediately if possible (stats menu, etc.)
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(this);
        }
        
        return desc;
    }
    // --- END ADDED ---

    // --- NEW: Method to handle bonus HP per enemy when stage loads ---
    setupBonusHpPerEnemyHandling() {
        // Use a custom event handler to avoid adding multiple listeners
        this._bonusHpHandler = (event) => {
            if (this.bonusHpPerEnemy && event.detail && event.detail.gameState) {
                const { gameState } = event.detail;
                
                // Count the number of enemy characters
                if (gameState.aiCharacters && gameState.aiCharacters.length > 0) {
                    const enemyCount = gameState.aiCharacters.length;
                    const bonusHp = this.bonusHpPerEnemy * enemyCount;
                    
                    // Apply the bonus HP
                    const oldMaxHp = this.stats.maxHp;
                    this.stats.maxHp += bonusHp;
                    this.stats.currentHp += bonusHp; // Also increase current HP
                    
                    // Log the bonus
                    const logMessage = `${this.name}'s Adaptive Defense provides +${bonusHp} HP (${this.bonusHpPerEnemy} × ${enemyCount} enemies).`;
                    if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
                        window.gameManager.addLogEntry(logMessage, 'talent-effect');
                    } else {
                        console.log(logMessage);
                    }
                    
                    // Show visual effect
                    const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                    if (charElement) {
                        const vfxContainer = document.createElement('div');
                        vfxContainer.className = 'adaptive-defense-vfx';
                        vfxContainer.innerHTML = `<span class="talent-effect">+${bonusHp} Max HP</span>`;
                        charElement.appendChild(vfxContainer);
                        
                        // Remove the VFX after animation
                        setTimeout(() => {
                            vfxContainer.remove();
                        }, 3000);
                    }
                    
                    // Update UI if the gameManager is available
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.updateCharacterUI(this);
                    }
                    
                    console.log(`Applied Adaptive Defense talent: ${oldMaxHp} HP → ${this.stats.maxHp} HP (+${bonusHp} HP from ${enemyCount} enemies)`);
                }
            }
        };
        
        // Add the event listener for the stageLoaded event
        document.addEventListener('gameStateReady', this._bonusHpHandler);
    }
    // --- END NEW ---

    // Add new method for Natural Regeneration talent
    setupNaturalRegenerationHandling() {
        console.log(`[FarmerAlice] Setting up Natural Regeneration handling for ${this.name}`);
        
        const applyInitialBuff = () => {
            // Check if talent is active (naturalRegenBuff property exists)
            if (this.naturalRegenBuff) {
                console.log(`[FarmerAlice] Natural Regeneration talent active, applying buff`);
                
                // Create permanent buff that will handle regeneration
                const regenBuff = new Effect(
                    'natural_regeneration_buff',
                    'Natural Regeneration',
                    'Icons/talents/natural_regeneration.webp',
                    999, // Nearly permanent buff
                    null,
                    false // Not a debuff
                );
                
                // Add regeneration values to the buff
                regenBuff.hpPercent = this.naturalRegenBuff.hpPercent || 0.02;
                regenBuff.manaPercent = this.naturalRegenBuff.manaPercent || 0.02;
                
                // Set buff description
                regenBuff.setDescription(`Restores ${Math.round(regenBuff.hpPercent * 100)}% max HP and ${Math.round(regenBuff.manaPercent * 100)}% max mana at the start of each turn.`);
                
                // Add buff effects
                regenBuff.effects = {
                    naturalRegen: true
                };
                
                // IMPORTANT: Set these properties on character for the Character.regenerateResources method
                this.hpRegenPercent = regenBuff.hpPercent;
                this.manaRegenPercent = regenBuff.manaPercent;
                console.log(`[FarmerAlice] Set regeneration properties: hpRegenPercent=${this.hpRegenPercent}, manaRegenPercent=${this.manaRegenPercent}`);
                
                // Custom process method for the buff
                regenBuff.process = (character, shouldReduceDuration) => {
                    // Apply regeneration effect at the beginning of each turn
                    const hpToRegen = Math.floor(character.stats.maxHp * regenBuff.hpPercent);
                    const manaToRegen = Math.floor(character.stats.maxMana * regenBuff.manaPercent);
                    
                    let regenMessage = '';
                    
                    if (hpToRegen > 0) {
                        const oldHp = character.stats.currentHp;
                        character.stats.currentHp = Math.min(character.stats.maxHp, character.stats.currentHp + hpToRegen);
                        const actualHeal = character.stats.currentHp - oldHp;
                        
                        if (actualHeal > 0) {
                            regenMessage += `${actualHeal} HP`;
                            
                            // Create heal VFX
                            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
                            if (charElement) {
                                const healVfx = document.createElement('div');
                                healVfx.className = 'heal-vfx';
                                healVfx.textContent = `+${actualHeal} HP`;
                                charElement.appendChild(healVfx);
                                
                                setTimeout(() => {
                                    healVfx.remove();
                                }, 1500);
                            }
                        }
                    }
                    
                    if (manaToRegen > 0) {
                        const oldMana = character.stats.currentMana;
                        character.stats.currentMana = Math.min(character.stats.maxMana, character.stats.currentMana + manaToRegen);
                        const actualMana = character.stats.currentMana - oldMana;
                        
                        if (actualMana > 0) {
                            regenMessage += regenMessage ? ` and ${actualMana} Mana` : `${actualMana} Mana`;
                            
                            // Create mana VFX
                            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
                            if (charElement) {
                                const manaVfx = document.createElement('div');
                                manaVfx.className = 'heal-vfx';
                                manaVfx.style.color = '#3a97d4'; // Blue for mana
                                manaVfx.textContent = `+${actualMana} Mana`;
                                charElement.appendChild(manaVfx);
                                
                                setTimeout(() => {
                                    manaVfx.remove();
                                }, 1500);
                            }
                        }
                    }
                    
                    if (regenMessage) {
                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                        log(`${character.name}'s Natural Regeneration restores ${regenMessage}.`, 'heal');
                    }
                    
                    // Update UI
                    updateCharacterUI(character);
                    
                    // Don't actually reduce duration since this is a permanent buff
                    return true;
                };
                
                // Add the buff to the character
                this.addBuff(regenBuff);
                
                // Log application
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${this.name} gains Natural Regeneration!`, 'buff-effect');
                
                // Visual effect for buff application
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
                if (charElement) {
                    const buffVfx = document.createElement('div');
                    buffVfx.className = 'vfx-container natural-regen-buff-vfx';
                    buffVfx.innerHTML = '<div class="buff-glow"></div><div class="buff-text">Natural Regeneration</div>';
                    charElement.appendChild(buffVfx);
                    
                    setTimeout(() => {
                        buffVfx.remove();
                    }, 2000);
                }
            } else {
                console.log(`[FarmerAlice] Natural Regeneration talent not active for ${this.name}`);
            }
        };
        
        // Try to apply regen buff immediately if game is already started
        setTimeout(applyInitialBuff, 500);
        
        // Also listen for game start events
        document.addEventListener('battleStarted', applyInitialBuff, { once: true });
    }

    // Add this new method after setupNaturalRegenerationHandling
    setupDefensiveFortitudeHandler() {
        // Only apply once when the game state is ready
        const handleGameStateReady = () => {
            // Check if the character has the Defensive Fortitude talent
            if (this.appliedTalents && this.appliedTalents.includes('talent_alice_25')) {
                // Show VFX with a slight delay to ensure character elements are ready
                setTimeout(() => this.showDefensiveFortitudeVFX(), 1500);
            }
        };
        
        // Listen for game state ready event
        document.addEventListener('gameStateReady', handleGameStateReady, { once: true });
        
        // Also try after a short delay in case event already fired
        setTimeout(() => {
            if (this.appliedTalents && this.appliedTalents.includes('talent_alice_25')) {
                this.showDefensiveFortitudeVFX();
            }
        }, 2000);
    }

    // Method to show the Defensive Fortitude VFX
    showDefensiveFortitudeVFX() {
        const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (!charElement) return;
        
        // Check if VFX was already shown
        if (charElement.querySelector('.defensive-fortitude-vfx')) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'defensive-fortitude-vfx';
        charElement.appendChild(vfxContainer);
        
        // Create text element
        const textElement = document.createElement('div');
        textElement.className = 'defensive-fortitude-text';
        textElement.textContent = `Defensive Fortitude: +8 Armor, +8 Shield`;
        charElement.appendChild(textElement);
        
        // Play a sound if gameManager is available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/shield_up.mp3', 0.5);
        }
        
        // Remove elements after animation completes
        setTimeout(() => {
            vfxContainer.remove();
            textElement.remove();
        }, 3000);
    }

    // Add new method for Protective Aura talent
    setupProtectiveAuraHandling() {
        console.log(`[FarmerAlice] Setting up Protective Aura handling for ${this.name}`);
        
        // Flag to prevent recursive calls
        this._isApplyingProtectiveAura = false;
        
        // Apply the aura when game state is ready and at the beginning of each turn
        const applyProtectiveAura = () => {
            // Prevent recursive calls
            if (this._isApplyingProtectiveAura) {
                console.log(`[FarmerAlice] Preventing recursive Protective Aura application`);
                return;
            }
            
            // Set flag to indicate we're in the process of applying the aura
            this._isApplyingProtectiveAura = true;
            
            try {
                // Check if talent is active
                if (this.protectiveAuraShield && this.protectiveAuraShield > 0) {
                    console.log(`[FarmerAlice] Protective Aura talent active, applying shield buff to allies`);
                    
                    // Calculate shield amount based on Alice's current magical shield
                    const shieldAmount = Math.floor(this.stats.magicalShield * this.protectiveAuraShield);
                    
                    if (shieldAmount <= 0) {
                        console.log(`[FarmerAlice] No shield to share (Alice's MS: ${this.stats.magicalShield})`);
                        return;
                    }
                    
                    // Get all allies including self
                    const allies = window.gameManager ? window.gameManager.getAllies(this) : [this];
                    
                    // Create or update aura buff for each ally
                    allies.forEach(ally => {
                        if (ally.isDead()) return;
                        
                        // Remove existing aura buff if present
                        const existingBuff = ally.buffs.find(b => b.id === 'alice_protective_aura');
                        if (existingBuff) {
                            // If the shield amount hasn't changed significantly, don't reapply
                            if (existingBuff.statModifiers && 
                                existingBuff.statModifiers.magicalShield && 
                                Math.abs(existingBuff.statModifiers.magicalShield - shieldAmount) < 2) {
                                return;
                            }
                            ally.removeBuff('alice_protective_aura');
                        }
                        
                        // Create new aura buff
                        const auraBuff = new Effect(
                            'alice_protective_aura',
                            'Protective Aura',
                            'Icons/talents/protective_aura.webp',
                            999, // Nearly permanent, will be removed and reapplied each turn
                            null,
                            false // Not a debuff
                        );
                        
                        // Set stat modifiers for the buff
                        auraBuff.statModifiers = [
                            { stat: 'magicalShield', value: shieldAmount, operation: 'add' }
                        ];
                        
                        // Set description
                        auraBuff.setDescription(`Gains ${shieldAmount} Magic Shield from ${this.name}'s Protective Aura (${Math.round(this.protectiveAuraShield * 100)}% of her Magic Shield).`);
                        
                        // Add buff to ally
                        ally.addBuff(auraBuff);
                        
                        // Show VFX for the buff (only for initial application, not updates)
                        if (!existingBuff) {
                            this.showProtectiveAuraVFX(ally, shieldAmount);
                        }
                        
                        // Update UI
                        if (window.gameManager && window.gameManager.uiManager) {
                            window.gameManager.uiManager.updateCharacterUI(ally);
                        }
                    });
                    
                    // Add visual indicator on Alice to show Protective Aura is active
                    const aliceElement = document.getElementById(`character-${this.instanceId || this.id}`);
                    if (aliceElement) {
                        const imageContainer = aliceElement.querySelector('.image-container');
                        if (imageContainer) {
                            imageContainer.classList.add('protective-aura-active');
                        }
                    }
                    
                    // Log application only on first application or significant changes
                    if (!this._lastShieldAmount || Math.abs(this._lastShieldAmount - shieldAmount) >= 5) {
                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                        log(`${this.name}'s Protective Aura grants ${Math.round(this.protectiveAuraShield * 100)}% Magic Shield to all allies.`, 'buff-effect');
                        this._lastShieldAmount = shieldAmount;
                    }
                } else {
                    // Remove visual indicator if aura is not active
                    const aliceElement = document.getElementById(`character-${this.instanceId || this.id}`);
                    if (aliceElement) {
                        const imageContainer = aliceElement.querySelector('.image-container');
                        if (imageContainer) {
                            imageContainer.classList.remove('protective-aura-active');
                        }
                    }
                }
            } finally {
                // Reset flag when done
                this._isApplyingProtectiveAura = false;
            }
        };
        
        // Store reference to function for cleanup
        this._applyProtectiveAuraHandler = applyProtectiveAura;
        
        // Apply initial buff with a delay to ensure the character is fully initialized
        setTimeout(applyProtectiveAura, 1000);
        
        // Only add event listener once
        // Apply at the beginning of each turn using the turnStarted event
        document.addEventListener('turnStarted', (event) => {
            // Only update at the start of player turns
            if (event.detail && event.detail.isPlayerTurn) {
                applyProtectiveAura();
            }
        });
        
        // Also listen for game start events
        document.addEventListener('battleStarted', applyProtectiveAura, {once: true});
        document.addEventListener('gameStateReady', applyProtectiveAura, {once: true});
        
        // When Alice's stats change (e.g., gaining more Magic Shield), update the aura
        this._originalRecalculateStats = this.recalculateStats;
        this.recalculateStats = (callerContext) => {
            const oldMagicalShield = this.stats.magicalShield;
            
            // Call original method
            this._originalRecalculateStats(callerContext);
            
            // If magical shield changed significantly, update the aura
            // Use flag to prevent loops
            if (!this._isApplyingProtectiveAura && 
                oldMagicalShield !== this.stats.magicalShield && 
                this.protectiveAuraShield && 
                Math.abs(oldMagicalShield - this.stats.magicalShield) >= 2) {
                
                // Use small delay to avoid potential recursion
                setTimeout(() => applyProtectiveAura(), 100);
            }
        };
    }
    
    // Show VFX for Protective Aura application
    showProtectiveAuraVFX(target, shieldAmount) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;
        
        // Create VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'protective-aura-vfx';
        targetElement.appendChild(vfxContainer);
        
        // Create shield effect
        const shieldText = document.createElement('div');
        shieldText.className = 'protective-aura-text';
        shieldText.innerHTML = `<span class="talent-effect">+${shieldAmount} MS</span><br><span>Protective Aura</span>`;
        vfxContainer.appendChild(shieldText);
        
        // Play a sound if gameManager is available
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/shield_aura.mp3', 0.5);
        }
        
        // Remove elements after animation completes
        setTimeout(() => {
            vfxContainer.remove();
        }, 2000);
    }
}

// Register Farmer Alice's character class with the character factory
CharacterFactory.registerCharacterClass('farmer_alice', FarmerAliceCharacter);

// Utility function to ensure Alice's magic shield counter is initialized when she's in the game
function initializeAliceMagicShieldCounters() {
    // This function will be called when the game loads
    // It ensures that all existing Alice characters have their counters initialized
    if (window.gameManager && window.gameManager.gameState) {
        // Add null/undefined checks to prevent "not iterable" errors
        const playerCharacters = window.gameManager.gameState.playerCharacters || [];
        const aiCharacters = window.gameManager.gameState.aiCharacters || [];
        
        const allCharacters = [
            ...playerCharacters,
            ...aiCharacters
        ];
        
        // Find all Alice characters in the game
        const aliceCharacters = allCharacters.filter(c => c && c.id === 'farmer_alice');
        
        // Initialize magic shield counter for each Alice
        aliceCharacters.forEach(alice => {
            if (typeof alice.initMagicShieldCounter === 'function') {
                alice.initMagicShieldCounter();
                console.log('Initialized magic shield counter for', alice.name);
            }
            
            // Update ability descriptions for Alice
            updateAliceAbilityDescriptions(alice);
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
    // Add debug logging
    console.log(`[Pounce Debug] Character stats check for ${caster.name}:`, {
        attackDamage: caster.stats.attackDamage,
        physicalDamage: caster.stats.physicalDamage,
        maxHp: caster.stats.maxHp,
        hp: caster.stats.hp,
        currentHp: caster.stats.currentHp
    });
    
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

    // Get ability object to check for modifications
    const ability = caster.abilities.find(a => a.id === 'pounce');
    
    // Calculate base damage (using the ability's amount property instead of hardcoded value)
    // FIX: Check if amount exists and is a valid number, fallback to 0.5 if not
    const damageMultiplier = ability && ability.amount !== undefined && !isNaN(ability.amount) ? ability.amount : 0.5;
    
    // FIX: In Farmer Alice's JSON, HP is defined as "hp", but is available as "maxHp" in stats
    // Properly access the stats
    const attackDamage = caster.stats.attackDamage || caster.stats.physicalDamage || 0;
    let baseDamage = Math.floor(attackDamage * damageMultiplier);
    
    console.log(`[Pounce Debug] Base damage calculation: ${attackDamage} * ${damageMultiplier} = ${baseDamage}`);
    
    // --- Apply Primal Strength (Max HP Scaling) --- 
    if (ability && ability.maxHpScaling && ability.maxHpScaling > 0) {
        // FIX: Properly access maxHp from stats - could be either maxHp or hp depending on how it's stored
        const maxHp = caster.stats.maxHp || caster.stats.hp || 0;
        const maxHpDamage = Math.floor(maxHp * ability.maxHpScaling);
        baseDamage += maxHpDamage;
        console.log(`[Pounce] Added ${maxHpDamage} damage from Primal Strength (${ability.maxHpScaling * 100}% of ${maxHp} MaxHP). New base: ${baseDamage}`);
    }
    // --- END NEW ---
    
    // --- Target Impact VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    let stunApplied = false;

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

    // Apply damage with statistics tracking
    const damageResult = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'pounce' });
    
    let message = `${caster.name} used Pounce on ${target.name} for ${damageResult.damage} physical damage`;
    if (damageResult.isCritical) {
        message += " (Critical Hit!)";
    }
    
    log(message);
    
    // Check for stun effect (only if debuffEffect exists on the ability)
    // This will be removed by the Hunter's Instinct talent
    console.log(`[Pounce Stun Debug] Ability debuffEffect:`, ability?.debuffEffect);
    if (ability && ability.debuffEffect && Math.random() < ability.debuffEffect.chance) {
        console.log(`[Pounce Stun Debug] Stun roll successful! Applying stun.`);
        stunApplied = true; // Set flag for VFX addition
        const stunDebuff = new Effect(
            'stun_debuff',
            'Stunned',
            'Icons/debuffs/stun.png',
            ability.debuffEffect.duration || 1, // Duration of 1 turn if not specified
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
        log(`${target.name} is stunned for ${ability.debuffEffect.duration || 1} turns!`);

        // Stun VFX is added after impact animation finishes (see setTimeout above)
    }
    
    // Check for cooldown reduction effect from talent (Hunter's Instinct)
    if (ability && ability.cooldownReductionEffect) {
        const reductionChance = ability.cooldownReductionEffect.chance || 0;
        const reductionAmount = ability.cooldownReductionEffect.amount || 1;
        
        if (Math.random() < reductionChance) {
            // Get a random ability from the caster (Alice) instead of the target
            const casterAbilities = caster.abilities;
            if (casterAbilities && casterAbilities.length > 0) {
                // Filter abilities with cooldown > 0, excluding the Pounce ability itself
                const abilitiesOnCooldown = casterAbilities.filter(a => a.currentCooldown > 0 && a.id !== 'pounce');
                
                if (abilitiesOnCooldown.length > 0) {
                    // Select a random ability on cooldown
                    const randomIndex = Math.floor(Math.random() * abilitiesOnCooldown.length);
                    const randomAbility = abilitiesOnCooldown[randomIndex];
                    
                    // Reduce cooldown
                    const oldCooldown = randomAbility.currentCooldown;
                    randomAbility.currentCooldown = Math.max(0, randomAbility.currentCooldown - reductionAmount);
                    
                    log(`${caster.name}'s Pounce reduced her ${randomAbility.name} cooldown by ${reductionAmount} (${oldCooldown} → ${randomAbility.currentCooldown})`);
                    
                    // Add visual feedback on the caster
                    if (casterElement) {
                        const cdReductionVfx = document.createElement('div');
                        cdReductionVfx.className = 'vfx-container alice-talent-cd-reduction-vfx-container';
                        casterElement.appendChild(cdReductionVfx);
                        
                        const cdReductionEffect = document.createElement('div');
                        cdReductionEffect.className = 'alice-talent-cd-reduction-vfx';
                        cdReductionEffect.innerHTML = `<span>-${reductionAmount} CD</span>`;
                        cdReductionVfx.appendChild(cdReductionEffect);
                        
                        setTimeout(() => {
                            cdReductionVfx.remove();
                        }, 2000);
                    }
                }
            }
        }
    }

    // Create the result object for return
    const effectResult = {};
    
    // Check for Agile Hunter talent (chance not to end turn)
    if (ability && ability.chanceToNotEndTurn) {
        const notEndTurnChance = ability.chanceToNotEndTurn;
        if (Math.random() < notEndTurnChance) {
            // Successful roll, trigger the effect
            // Add visual effect for Agile Hunter
            if (casterElement) {
                const agileHunterVfxContainer = document.createElement('div');
                agileHunterVfxContainer.className = 'vfx-container agile-hunter-vfx';
                casterElement.appendChild(agileHunterVfxContainer);
                
                const agileHunterText = document.createElement('div');
                agileHunterText.className = 'agile-hunter-text';
                agileHunterText.textContent = 'AGILE HUNTER!';
                agileHunterVfxContainer.appendChild(agileHunterText);
                
                playSound('sounds/ability_reset.mp3', 0.7);
                
                setTimeout(() => {
                    agileHunterVfxContainer.remove();
                }, 1200);
            }
            
            log(`${caster.name}'s Agile Hunter talent allows for an additional action and resets Pounce cooldown!`);
            
            // Set doesNotEndTurn flag in result
            effectResult.doesNotEndTurn = true;
            
            // Set flag to reset cooldown directly in Ability.use
            effectResult.resetCooldown = true;
        }
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
    
    return effectResult;
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
const thickFurAbilityEffect = (caster, target, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Set the flat boost amount
    const armorBoost = 20;
    const magicShieldBoost = 20;
    
    // --- Check for the Restorative Fur talent (healing) ---
    const ability = caster.abilities.find(a => a.id === 'thick_fur');
    // --- DEBUGGING START ---
    console.log(`[Thick Fur Effect] Checking for healing. Caster: ${caster.name}, Ability Object:`, ability);
    console.log(`[Thick Fur Effect] Ability healingPercent property: ${ability ? ability.healingPercent : 'N/A'}`);
    // --- DEBUGGING END ---
    if (ability && ability.healingPercent) {
        const healingPercent = ability.healingPercent;
        // --- DEBUGGING START ---
        console.log(`[Thick Fur Effect] healingPercent found: ${healingPercent}`);
        console.log(`[Thick Fur Effect] Caster HP: ${caster.stats.currentHp} / ${caster.stats.maxHp}`);
        // --- DEBUGGING END ---
        const missingHP = caster.stats.maxHp - caster.stats.currentHp;
        const healAmount = Math.round(missingHP * healingPercent);
        // --- DEBUGGING START ---
        console.log(`[Thick Fur Effect] Calculated missingHP: ${missingHP}, healAmount: ${healAmount}`);
        // --- DEBUGGING END ---
        
        if (healAmount > 0) {
            // --- DEBUGGING START ---
            console.log(`[Thick Fur Effect] Attempting to heal for ${healAmount}`);
            // --- DEBUGGING END ---
            // Call heal method and handle the healing logic
            caster.heal(healAmount, caster, { abilityId: 'thick_fur_healing' });
            
            // Add healing visual effect
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                // Create a container for the Restorative Fur healing effect
                const healingVfxContainer = document.createElement('div');
                healingVfxContainer.className = 'vfx-container restorative-fur-heal-vfx';
                casterElement.appendChild(healingVfxContainer);
                
                // Add the healing amount text
                const healingText = document.createElement('div');
                healingText.className = 'restorative-fur-heal-amount';
                healingText.innerHTML = `+${healAmount} HP`;
                healingVfxContainer.appendChild(healingText);
                
                // Add healing particles effect
                const particlesContainer = document.createElement('div');
                particlesContainer.className = 'restorative-fur-particles';
                healingVfxContainer.appendChild(particlesContainer);
                
                // Play healing sound
                playSound('sounds/healing.mp3', 0.6);
                
                // Remove the VFX after animation completes
                setTimeout(() => {
                    healingVfxContainer.remove();
                }, 2000);
            }
            
            log(`${caster.name}'s Restorative Fur heals for ${healAmount} HP (35% of missing HP)!`, 'heal');
        }
    }
    
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

    // Check for Purifying Fur talent (removes all debuffs)
    if (ability && ability.removeAllDebuffs) {
        // Get all active debuffs
        const debuffs = [...caster.debuffs]; // Create a copy of the debuffs array
        
        if (debuffs.length > 0) {
            // Remove each debuff
            debuffs.forEach(debuff => {
                caster.removeDebuff(debuff.id);
            });
            
            log(`${caster.name}'s Purifying Fur removes all debuffs!`);
            
            // Add purifying effect VFX
            if (casterElement) {
                casterElement.classList.add('purifying-effect');
                
                // Create purifying particles effect
                const purifyVfxContainer = document.createElement('div');
                purifyVfxContainer.className = 'purify-vfx-container';
                casterElement.appendChild(purifyVfxContainer);
                
                setTimeout(() => {
                    casterElement.classList.remove('purifying-effect');
                    purifyVfxContainer.remove();
                }, 1200);
                
                playSound('sounds/purify.mp3', 0.7);
            }
        }
    }

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
    thickFurBuff.statModifiers = [
        { stat: 'armor', value: armorBoost, operation: 'add' },
        { stat: 'magicalShield', value: magicShieldBoost, operation: 'add' }
    ];
    
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
    
    // Check for Fur Coat Endurance talent (doesn't end turn)
    const result = {};
    if (ability && ability.doesNotEndTurn) {
        // Add visual effect for Fur Coat Endurance
        if (casterElement) {
            const enduranceVfxContainer = document.createElement('div');
            enduranceVfxContainer.className = 'vfx-container fur-coat-endurance-vfx';
            casterElement.appendChild(enduranceVfxContainer);
            
            const enduranceText = document.createElement('div');
            enduranceText.className = 'fur-coat-endurance-text';
            enduranceText.textContent = 'ADDITIONAL ACTION!';
            enduranceVfxContainer.appendChild(enduranceText);
            
            playSound('sounds/ability_reset.mp3', 0.7);
            
            setTimeout(() => {
                enduranceVfxContainer.remove();
            }, 1200);
        }
        
        log(`${caster.name}'s Fur Coat Endurance allows for an additional action!`);
        
        // Set doesNotEndTurn flag in result
        result.doesNotEndTurn = true;
    }
    
    return result;
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
        
        // Apply redirection buff instead of shield
        const redirectBuff = new Effect(
            'bunny_bounce_redirect_buff',
            'Bunny Bounce',
            'Icons/abilities/bunny_bounce.webp',
            5, // Duration: 5 turns
            null,
            false
        ).setDescription(`All damage received is redirected to ${caster.name}.`);

        // When buff is applied, flag the target for redirection
        target.bunnyBounceRedirectToAliceId = caster.instanceId || caster.id;

        // Clean up on removal
        redirectBuff.remove = function(character) {
            if (character.bunnyBounceRedirectToAliceId) delete character.bunnyBounceRedirectToAliceId;
            addLogEntry(`${character.name}'s Bunny Bounce protection has faded.`);
        };

        // Add buff to target
        target.addBuff(redirectBuff.clone());

        // Ally VFX showing link
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        const casterElement2 = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (targetElement && casterElement2) {
            const beam = document.createElement('div');
            beam.className = 'bunny-bounce-redirect-beam';
            document.body.appendChild(beam);

            const startRect = targetElement.getBoundingClientRect();
            const endRect = casterElement2.getBoundingClientRect();
            const sx = startRect.left + startRect.width/2;
            const sy = startRect.top + startRect.height/2;
            const ex = endRect.left + endRect.width/2;
            const ey = endRect.top + endRect.height/2;
            const dist = Math.hypot(ex - sx, ey - sy);
            const angle = Math.atan2(ey - sy, ex - sx) * 180/Math.PI;
            beam.style.left = sx + 'px';
            beam.style.top = sy + 'px';
            beam.style.width = dist + 'px';
            beam.style.transform = `rotate(${angle}deg)`;
            beam.style.transformOrigin = '0 50%';

            playSound('sounds/shield_gain_ally.mp3', 0.6);
            setTimeout(()=> beam.remove(), 1200);
        }

        log(`${caster.name} protects ${target.name} with Bunny Bounce! All incoming damage will be redirected to ${caster.name}.`);
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
        // Apply damage - 600% of Alice's magic shield as physical damage
        const result = target.applyDamage(damage, 'physical', caster, { abilityId: 'bunny_bounce' });
        
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

    // Check for Bunny Brigade talent (affects all allies)
    const carrotAbility = caster.abilities.find(a => a.id === 'carrot_power_up');
    const affectAllAllies = carrotAbility?.affectAllAllies || false;
    
    // Get targets based on whether we're affecting all allies or just the target
    const targets = [];
    if (affectAllAllies) {
        // Get all allies including self
        if (window.gameManager) {
            targets.push(...window.gameManager.getAllies(caster));
            // Make sure the caster is included
            if (!targets.includes(caster)) {
                targets.push(caster);
            }
        } else {
            // Fallback if gameManager is not available
            targets.push(target);
        }
        log(`${caster.name}'s Bunny Brigade talent activates, affecting all allies!`, 'talent-effect');
        
        // Show Bunny Brigade VFX
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            const brigadeVfxContainer = document.createElement('div');
            brigadeVfxContainer.className = 'bunny-brigade-vfx-container';
            battleContainer.appendChild(brigadeVfxContainer);
            
            const brigadeVfx = document.createElement('div');
            brigadeVfx.className = 'bunny-brigade-vfx';
            brigadeVfxContainer.appendChild(brigadeVfx);
            
            const brigadeText = document.createElement('div');
            brigadeText.className = 'bunny-brigade-text';
            brigadeText.textContent = 'BUNNY BRIGADE!';
            brigadeVfxContainer.appendChild(brigadeText);
            
            // Play a special sound for Bunny Brigade
            playSound('sounds/special_powerup.mp3', 0.8);
            
            setTimeout(() => {
                brigadeVfxContainer.remove();
            }, 2000);
        }
    } else {
        // Just affect the single target
        targets.push(target);
    }
    
    // Process each target
    targets.forEach(currentTarget => {
        // Check if Power Carrots talent is active
        const useMaxHpInstead = carrotAbility?.useMaxHpInstead || false;
        let healAmount;
        
        if (useMaxHpInstead) {
            // Power Carrots talent: Use 21% of max HP
            healAmount = Math.floor(currentTarget.stats.maxHp * 0.21);
            if (currentTarget === target) { // Only log once for the main target
                log(`${caster.name}'s Power Carrots talent enhances the healing!`, 'talent-effect');
            }
        } else {
            // Default behavior: 21% of missing health
            const missingHealth = currentTarget.stats.maxHp - currentTarget.stats.currentHp;
            // Calculate healing, with a minimum amount based on max HP (2% of max HP) even if at full health
            healAmount = Math.max(Math.floor(missingHealth * 0.21), Math.floor(currentTarget.stats.maxHp * 0.02));
        }
        
        // Apply healing with statistics tracking
        currentTarget.heal(healAmount, caster, { abilityId: 'carrot_power_up' });
        
        // --- Target Heal VFX ---
        const targetElement = document.getElementById(`character-${currentTarget.instanceId || currentTarget.id}`);
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

        log(`${caster.name} used Carrot Power Up on ${currentTarget.name}, healing for ${healAmount} HP.`);
        
        // Reduce active cooldowns by 5 turns
        let reducedAbilities = 0;
        
        // Iterate through all abilities and reduce their current cooldown if active
        if (currentTarget.abilities) {
            currentTarget.abilities.forEach(ability => {
                if (ability.currentCooldown > 0) {
                    // Calculate how much to reduce (minimum to 0)
                    const reduction = Math.min(ability.currentCooldown, 5);
                    ability.currentCooldown -= reduction;
                    reducedAbilities++;
                    
                    // Update ability cooldown display if it exists
                    if (window.gameManager && typeof window.gameManager.updateAbilityCooldownDisplay === 'function') {
                        window.gameManager.updateAbilityCooldownDisplay(currentTarget.id, ability.id);
                    }
                }
            });
        }
        
        if (reducedAbilities > 0) {
            log(`${currentTarget.name}'s ability cooldowns were reduced by 5 turns.`);
            
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
        updateCharacterUI(currentTarget);
    });

    // Always update caster UI
    updateCharacterUI(caster);
};

// Create the actual Pounce ability
const pounceAbility = new Ability(
    'pounce',
    'Pounce',
    'Icons/abilities/pounce.webp',
    50, // Mana cost
    2,  // Cooldown in turns
    pounceAbilityEffect
);
// --- CORRECTED: Set baseDescription and assign generateDescription --- 
pounceAbility.baseDescription = 'Deals 50% AD damage and has a 85% chance to stun the target for 1 turn.';
// Set default amount property to prevent NaN issues
pounceAbility.amount = 0.5;
pounceAbility.generateDescription = function() {
    console.log(`[Alice] Generating description for pounce. Base: "${this.baseDescription}"`);
    
    // Ensure amount is set with fallback to default
    const damageAmount = this.amount !== undefined ? this.amount : 0.5;
    
    // Check if Hunter's Instinct talent is active
    if (this.cooldownReductionEffect && damageAmount === 2.0 && !this.debuffEffect) {
        // Using the Hunter's Instinct talent version
        let description = `Deals <span class="talent-effect damage">${Math.round(damageAmount * 100)}% AD damage</span> and has a <span class="talent-effect utility">${Math.round(this.cooldownReductionEffect.chance * 100)}% chance to reduce a random Alice ability cooldown by ${this.cooldownReductionEffect.amount} turn</span>.`;
        
        // Add Agile Hunter information if applicable
        if (this.chanceToNotEndTurn) {
            description += ` <span class="talent-effect utility">Has a ${Math.round(this.chanceToNotEndTurn * 100)}% chance not to end turn and reset Pounce's cooldown when used.</span>`;
        }
        
        this.description = description;
    } else {
        // Using the base version or a different talent modification
        this.description = this.baseDescription;
        
        // If only the amount was modified but it's not the Hunter's Instinct talent
        if (damageAmount !== 0.5) {
            this.description = this.description.replace('50%', `${Math.round(damageAmount * 100)}%`);
        }
        
        // Add Agile Hunter information if applicable even in base version
        if (this.chanceToNotEndTurn) {
            this.description += ` <span class="talent-effect utility">Has a ${Math.round(this.chanceToNotEndTurn * 100)}% chance not to end turn and reset Pounce's cooldown when used.</span>`;
        }
    }
    console.log(`[Alice] Final pounce description: "${this.description}"`);
};
pounceAbility.generateDescription(); // Generate initial description
pounceAbility.setTargetType('enemy');

// Create the Thick Fur ability
const thickFurAbility = new Ability(
    'thick_fur',
    'Thick Fur',
    'Icons/abilities/thick_fur.webp',
    100, // Mana cost
    18,  // Cooldown in turns
    thickFurAbilityEffect
);
// --- CORRECTED: Set baseDescription and assign generateDescription --- 
thickFurAbility.baseDescription = 'Increases Armor and Magic Shield by 20 for 10 turns.';
thickFurAbility.generateDescription = function() {
    console.log(`[Alice] Generating description for thick_fur. Base: "${this.baseDescription}"`);
    let desc = this.baseDescription;
    
    // Add removeAllDebuffs talent text
    if (this.removeAllDebuffs) {
        desc += ` <span class="talent-effect">Removes all debuffs when activated.</span>`;
    }
    
    // Add healingPercent talent text
    if (this.healingPercent) {
        desc += ` <span class="talent-effect healing">Heals for ${Math.round(this.healingPercent * 100)}% of missing HP when activated.</span>`;
    }
    
    // Add doesNotEndTurn talent text
    if (this.doesNotEndTurn) {
        desc += ` <span class="talent-effect utility">Doesn't end Alice's turn when used.</span>`;
    }
    
    this.description = desc;
    console.log(`[Alice] Final thick_fur description: "${this.description}"`);
};
thickFurAbility.generateDescription(); // Generate initial description
thickFurAbility.setTargetType('self');

// Create the Bunny Bounce ability
const bunnyBounceAbility = new Ability(
    'bunny_bounce',
    'Bunny Bounce',
    'Icons/abilities/bunny_bounce.webp',
    100, // Mana cost
    8,   // Cooldown in turns
    bunnyBounceAbilityEffect
);
// --- CORRECTED: Set baseDescription and assign generateDescription --- 
bunnyBounceAbility.baseDescription = 'If used on an ally: Redirect every damage from that target to yourself. If used on an enemy: Deals 600% of Magic Shield as physical damage.';
bunnyBounceAbility.generateDescription = function() {
    console.log(`[Alice] Generating description for bunny_bounce. Base: "${this.baseDescription}"`);
    this.description = this.baseDescription;
    console.log(`[Alice] Final bunny_bounce description: "${this.description}"`);
    // Add talent modifications here if Bunny Bounce gets talents later
};
bunnyBounceAbility.generateDescription(); // Generate initial description
bunnyBounceAbility.setTargetType('any_except_self'); // Custom target type to allow targeting allies and enemies but not self

// Create the Carrot Power Up ability
const carrotPowerUpAbility = new Ability(
    'carrot_power_up',
    'Carrot Power Up',
    'Icons/abilities/carrot_power_up.webp',
    155, // Mana cost
    15,  // Cooldown in turns
    carrotPowerUpAbilityEffect
);
// --- CORRECTED: Set baseDescription and assign generateDescription --- 
carrotPowerUpAbility.baseDescription = 'Heals the target for 21% of missing health (minimum 2% of max HP) and reduces target\'s active cooldowns by 5 turns. Cooldown reduces by 1 turn when Alice takes damage.';
carrotPowerUpAbility.generateDescription = function() {
    console.log(`[Alice] Generating description for carrot_power_up. Base: "${this.baseDescription}"`);
    let desc = this.baseDescription;
    
    // Add talent modifications here
    if (this.useMaxHpInstead) {
        desc = desc.replace('21% of missing health', '<span class="talent-effect">21% of maximum health</span>');
    }
    
    // Add Bunny Brigade talent text
    if (this.affectAllAllies) {
        desc = desc.replace('Heals the target', '<span class="talent-effect aoe">Heals ALL allies</span>');
        
        // Also mention the reduced cooldown (should be 12 turns instead of 15)
        if (this.cooldown === 12) {
            desc += ' <span class="talent-effect">Cooldown reduced to 12 turns.</span>';
        }
    }
    
    this.description = desc;
    console.log(`[Alice] Final carrot_power_up description: "${this.description}"`);
};
carrotPowerUpAbility.generateDescription(); // Generate initial description
carrotPowerUpAbility.setTargetType('ally'); // Can target self or allies

// Register abilities with AbilityFactory
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            pounceAbility,
            thickFurAbility,
            bunnyBounceAbility,
            carrotPowerUpAbility
        ]);
        
        console.log('[Farmer Alice] Registered Alice abilities with descriptions and custom logic');
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

// Add new utility functions for Enhanced Recovery and Lasting Protection VFX

// Function to show Enhanced Recovery visual effects
function showEnhancedRecoveryVFX(character, originalHealAmount, boostedHealAmount) {
    if (!character) return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'vfx-container enhanced-recovery-vfx-container';
    charElement.appendChild(vfxContainer);
    
    // Create glow effect
    const enhancedRecoveryVfx = document.createElement('div');
    enhancedRecoveryVfx.className = 'enhanced-recovery-vfx';
    vfxContainer.appendChild(enhancedRecoveryVfx);
    
    // Create text effect
    const enhancedRecoveryText = document.createElement('div');
    enhancedRecoveryText.className = 'enhanced-recovery-text';
    enhancedRecoveryText.textContent = `+${Math.round((boostedHealAmount - originalHealAmount))} BONUS HEAL`;
    vfxContainer.appendChild(enhancedRecoveryText);
    
    // Play sound effect if available
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/talent_proc.mp3', 0.5);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        vfxContainer.remove();
    }, 1500);
}

// Function to show Lasting Protection visual effects
function showLastingProtectionVFX(character, buffName, originalDuration, extendedDuration) {
    if (!character) return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'vfx-container lasting-protection-vfx-container';
    charElement.appendChild(vfxContainer);
    
    // Create glow effect
    const lastingProtectionVfx = document.createElement('div');
    lastingProtectionVfx.className = 'lasting-protection-vfx';
    vfxContainer.appendChild(lastingProtectionVfx);
    
    // Create text effect
    const lastingProtectionText = document.createElement('div');
    lastingProtectionText.className = 'lasting-protection-text';
    lastingProtectionText.textContent = `+${(extendedDuration - originalDuration)} TURNS`;
    vfxContainer.appendChild(lastingProtectionText);
    
    // Play sound effect if available
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/buff_extended.mp3', 0.5);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        vfxContainer.remove();
    }, 1500);
}

// Register these functions globally
window.showEnhancedRecoveryVFX = showEnhancedRecoveryVFX;
window.showLastingProtectionVFX = showLastingProtectionVFX; 

// After Pounce ability effect is updated, let's add a function to update ability descriptions

// Update Alice's abilities to show correct damage in descriptions
function updateAliceAbilityDescriptions(character) {
    console.log(`[Alice] Updating ability descriptions for ${character.name}`);
    
    // Find the pounce ability
    const pounceAbility = character.abilities.find(a => a.id === 'pounce');
    if (pounceAbility) {
        // Make sure we have the amount property correctly set
        if (pounceAbility.amount === undefined || isNaN(pounceAbility.amount)) {
            console.log(`[Alice] Fixing invalid pounce.amount: ${pounceAbility.amount}`);
            pounceAbility.amount = 0.5; // Default to 50% AD
        }
        
        // Calculate the actual damage percentage for display
        const damagePercent = Math.round(pounceAbility.amount * 100);
        
        // Update the description with the correct damage value
        let description = `Deals ${damagePercent}% AD damage`;
        
        // Add stun effect if present
        if (pounceAbility.debuffEffect && pounceAbility.debuffEffect.chance) {
            const stunChance = Math.round(pounceAbility.debuffEffect.chance * 100);
            const stunDuration = pounceAbility.debuffEffect.duration || 1;
            description += ` and has a ${stunChance}% chance to stun the target for ${stunDuration} turns.`;
        } else {
            // For Hunter's Instinct talent (no stun, but has cooldown reduction)
            if (pounceAbility.cooldownReductionEffect) {
                const cdChance = Math.round(pounceAbility.cooldownReductionEffect.chance * 100);
                const cdAmount = pounceAbility.cooldownReductionEffect.amount || 1;
                description += ` and has a ${cdChance}% chance to reduce a random Alice ability cooldown by ${cdAmount} turn${cdAmount > 1 ? 's' : ''}.`;
            } else {
                description += '.';
            }
        }
        
        // Add maxHp scaling if present (from Primal Strength talent)
        if (pounceAbility.maxHpScaling && pounceAbility.maxHpScaling > 0) {
            const hpPercent = Math.round(pounceAbility.maxHpScaling * 100);
            // Calculate current damage value to show in tooltip
            const maxHp = character.stats.maxHp || character.stats.hp || 0;
            const maxHpDamage = Math.floor(maxHp * pounceAbility.maxHpScaling);
            
            description += ` <span class="talent-effect">Also deals ${hpPercent}% of your max HP as additional damage (currently +${maxHpDamage}).</span>`;
        }
        
        // Set the description
        pounceAbility.description = description;
        console.log(`[Alice] Updated Pounce description: ${description}`);
    }
    
    // Add similar updates for other abilities if needed
}

// Register Alice's character class with the character factory
CharacterFactory.registerCharacterClass('farmer_alice', FarmerAliceCharacter);

// Utility function to ensure Alice's magic shield counter is initialized when she's in the game
function initializeAliceMagicShieldCounters() {
    // This function will be called when the game loads
    // It ensures that all existing Alice characters have their counters initialized
    if (window.gameManager && window.gameManager.gameState) {
        // Add null/undefined checks to prevent "not iterable" errors
        const playerCharacters = window.gameManager.gameState.playerCharacters || [];
        const aiCharacters = window.gameManager.gameState.aiCharacters || [];
        
        const allCharacters = [
            ...playerCharacters,
            ...aiCharacters
        ];
        
        // Find all Alice characters in the game
        const aliceCharacters = allCharacters.filter(c => c && c.id === 'farmer_alice');
        
        // Initialize magic shield counter for each Alice
        aliceCharacters.forEach(alice => {
            if (typeof alice.initMagicShieldCounter === 'function') {
                alice.initMagicShieldCounter();
                console.log('Initialized magic shield counter for', alice.name);
            }
            
            // Update ability descriptions for Alice
            updateAliceAbilityDescriptions(alice);
        });
    }
}

// At the end of the file, add an event listener for talent application
document.addEventListener('talentsApplied', (event) => {
    // Check if the event contains a character with ID 'farmer_alice'
    if (event.detail && event.detail.character && event.detail.character.id === 'farmer_alice') {
        console.log('[Alice] Talents applied, updating ability descriptions');
        setTimeout(() => {
            updateAliceAbilityDescriptions(event.detail.character);
        }, 100);
    }
});

/**
 * Shows the VFX when Alice redirects an enemy ability with Furry Guardian talent
 * @param {Object} alice - The Alice character instance
 * @param {Object} originalTarget - The original target of the ability
 * @param {Object} caster - The caster of the ability
 * @param {Object} ability - The ability being redirected
 */
function showFurryGuardianVFX(alice, originalTarget, caster, ability) {
    const aliceElement = document.getElementById(`character-${alice.instanceId || alice.id}`);
    const originalTargetElement = document.getElementById(`character-${originalTarget.instanceId || originalTarget.id}`);
    
    if (!aliceElement || !originalTargetElement) return;

    // Play sound effect
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/ability_redirect.mp3', 0.7);
    }

    // Add guardian glow to Alice
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'furry-guardian-vfx-container';
    aliceElement.appendChild(vfxContainer);

    const guardianVfx = document.createElement('div');
    guardianVfx.className = 'furry-guardian-vfx';
    vfxContainer.appendChild(guardianVfx);

    const guardianText = document.createElement('div');
    guardianText.className = 'furry-guardian-text';
    guardianText.textContent = 'Furry Guardian!';
    vfxContainer.appendChild(guardianText);

    // Create redirect arrow
    const arrowContainer = document.createElement('div');
    arrowContainer.className = 'ability-redirect-arrow';
    document.body.appendChild(arrowContainer);

    // Calculate positions for arrow animation
    const originalRect = originalTargetElement.getBoundingClientRect();
    const aliceRect = aliceElement.getBoundingClientRect();
    
    const startX = originalRect.left + originalRect.width / 2;
    const startY = originalRect.top + originalRect.height / 2;
    const endX = aliceRect.left + aliceRect.width / 2;
    const endY = aliceRect.top + aliceRect.height / 2;
    
    // Position the arrow
    arrowContainer.style.top = `${startY - 20}px`;
    arrowContainer.style.left = `${startX}px`;
    
    // Calculate angle between points
    const angleRad = Math.atan2(endY - startY, endX - startX);
    const angleDeg = angleRad * (180 / Math.PI);
    
    // Set transformation
    arrowContainer.style.transform = `rotate(${angleDeg}deg) translateX(${Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2}px)`;

    // Add log message
    if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
        window.gameManager.addLogEntry(`${alice.name}'s Furry Guardian redirects ${caster.name}'s ${ability.name} from ${originalTarget.name}!`, 'talent-effect');
    }

    // Remove VFX elements after animation completes
    setTimeout(() => {
        vfxContainer.remove();
        arrowContainer.remove();
    }, 2000);
}

// Make the function globally available
window.showFurryGuardianVFX = showFurryGuardianVFX;

// Initialize when document loads to ensure the function is available
document.addEventListener('DOMContentLoaded', () => {
    // Make sure showFurryGuardianVFX is available in the global scope
    if (!window.showFurryGuardianVFX) {
        window.showFurryGuardianVFX = showFurryGuardianVFX;
        console.log('Registered showFurryGuardianVFX function globally');
    }
});

// --- Bunny Bounce now uses the Universal Damage Redirection Framework in character.js ---
// The bunnyBounceRedirectToAliceId property is automatically checked by checkForDamageRedirection()
// No need for a separate hook - the universal system handles it with proper armor/magic shield calculations

console.log('[BunnyBounce] Using Universal Damage Redirection Framework');