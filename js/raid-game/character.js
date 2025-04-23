// Character class definition for Roguelike Raid Game
class Character {
    constructor(id, name, image, stats) {
        this.id = id;
        this.name = name;
        this.image = image;
        
        // Store base stats separately
        this.baseStats = {
            physicalDamage: stats.physicalDamage || 0,
            magicalDamage: stats.magicalDamage || 0,
            armor: stats.armor || 0,
            magicalShield: stats.magicalShield || 0,
            lifesteal: stats.lifesteal || 0,
            dodgeChance: stats.dodgeChance || 0,
            critChance: stats.critChance || 0,
            critDamage: stats.critDamage || 1.5,
            healingPower: stats.healingPower || 0,
            maxHp: stats.hp || 100,
            hpPerTurn: stats.hpPerTurn || 0,
            maxMana: stats.mana || 100,
            manaPerTurn: stats.manaPerTurn || 0
        };

        // Current stats including modifications
        this.stats = {
            ...this.baseStats, // Start with base stats
            currentHp: stats.hp || 100, // Keep current HP/Mana separate
            currentMana: stats.mana || 100,
            // Remove specific current HP/Mana from baseStats if they existed there
        };
        // Ensure currentHp/Mana are not in baseStats if they were copied
        delete this.baseStats.currentHp;
        delete this.baseStats.currentMana;

        this.abilities = [];
        this.buffs = [];
        this.debuffs = []; // Keep track of debuffs separately might be useful
        this.isAI = false;
        this.passive = null; // Initialize passive property
        this.passiveHandler = null; // Initialize passive handler
    }

    // Helper function to recalculate all stats based on base stats and active buffs/debuffs
    recalculateStats() {
        // --- REMOVED: Resetting to baseStats ---
        // We need to preserve stats loaded from story progress.
        // Buffs/debuffs will modify the existing this.stats object.

        // --- NEW: Ensure current stats exist, initialize from base if needed (first-time calc) ---
        if (!this.stats) {
             console.warn(`[${this.name}] Initializing stats from baseStats.`);
             this.stats = { ...this.baseStats };
        } else {
            // Make sure maxHp/maxMana are updated from baseStats before applying buffs/debuffs
            // This allows buffs to modify the *current* base max value for the run.
            this.stats.maxHp = this.baseStats.maxHp;
            this.stats.maxMana = this.baseStats.maxMana;

             // Reset non-maxHP/Mana stats to their *current* base values before applying buffs
             // This prevents double-applying permanent boosts if recalculate is called multiple times.
            for (const stat in this.baseStats) {
                if (stat !== 'maxHp' && stat !== 'maxMana' && this.stats[stat] !== undefined) {
                    // Use the baseStat value as the starting point for this recalculation cycle
                    this.stats[stat] = this.baseStats[stat];
                }
            }
        }
        // --- END NEW ---

        // --- APPLY BUFF EFFECTS (BEFORE STAT MODIFIERS) ---
        // Reset temporary stats potentially affected by buff.effects (like dodge)
        // Use baseStats as the absolute floor for these before applying buff effects.
        this.stats.dodgeChance = this.baseStats.dodgeChance || 0;
        // this.stats.critChance = this.baseStats.critChance || 0; // Add if needed for crit buffs

        // Apply temporary effects from buffs (e.g., dodge chance override)
        this.buffs.forEach(buff => {
            if (buff.effects && typeof buff.effects.dodgeChance === 'number') {
                // Use Math.max to take the highest dodge chance buff active
                this.stats.dodgeChance = Math.max(this.stats.dodgeChance, buff.effects.dodgeChance);
            }
            // Add similar logic for other stats potentially in buff.effects if needed
        });
        // --- END APPLY BUFF EFFECTS ---


        // Apply stat modifiers from buffs
        this.buffs.forEach(buff => {
            if (buff.statModifiers) {
                for (const [stat, value] of Object.entries(buff.statModifiers)) {
                    // Avoid double-applying dodge if it's also in statModifiers (though unlikely)
                    if (stat === 'dodgeChance' && buff.effects && typeof buff.effects.dodgeChance === 'number') {
                        continue; // Skip if already handled by buff.effects above
                    }

                    if (typeof this.stats[stat] !== 'undefined') {
                        // Apply additive modifiers
                        this.stats[stat] += value;
                    }
                    // Handle Max HP/Mana increases specially
                    if (stat === 'maxHp') this.stats.maxHp += value;
                    if (stat === 'maxMana') this.stats.maxMana += value;
                }
            }
        });

        // Apply stat modifiers from debuffs (assuming they also use statModifiers)
        this.debuffs.forEach(debuff => {
             if (debuff.statModifiers) {
                for (const [stat, value] of Object.entries(debuff.statModifiers)) {
                    // Assuming debuff values are negative for stats like damage/armor
                    // or positive for things like increased damage taken (needs careful design)
                    if (typeof this.stats[stat] !== 'undefined') {
                        this.stats[stat] += value; // Apply modifier (e.g., adding a negative value)
                    }
                     // Handle Max HP/Mana decreases specially if needed
                    if (stat === 'maxHp') this.stats.maxHp += value; // Usually debuffs decrease max HP
                    if (stat === 'maxMana') this.stats.maxMana += value;
                }
            }
        });

        // Clamp stats if necessary (e.g., dodge/crit chance between 0 and 1)
        this.stats.dodgeChance = Math.max(0, Math.min(1, this.stats.dodgeChance)); // Clamp after all modifications
        this.stats.critChance = Math.max(0, Math.min(1, this.stats.critChance));
        this.stats.armor = Math.max(0, this.stats.armor); // Armor cannot be negative
        this.stats.magicalShield = Math.max(0, this.stats.magicalShield); // Shield cannot be negative

        // Ensure current HP/Mana don't exceed the potentially changed max values
        this.stats.currentHp = Math.min(this.stats.currentHp, this.stats.maxHp);
        this.stats.currentMana = Math.min(this.stats.currentMana, this.stats.maxMana);

        // Optional: Log recalculated stats for debugging
        // console.log(`[${this.name}] Stats recalculated: `, this.stats);
    }

    // Apply damage, now accepts caster as an argument
    applyDamage(amount, type, caster = null, options = {}) { // Added options object
        const { isChainReaction = false, isRetaliation = false } = options; // Destructure options
        // --- MODIFIED: Use the recalculated stats directly ---
        const totalDodgeChance = this.stats.dodgeChance || 0; // Use the stat calculated in recalculateStats

        // Check if attack is dodged
        if (Math.random() < totalDodgeChance) {
        // --- END MODIFICATION ---
            const logFunction = window.gameManager ?
                window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            logFunction(`${this.name} dodged the attack!`);

            // --- Trigger passive handler on dodge ---
            if (this.passiveHandler && typeof this.passiveHandler.onDodge === 'function') {
                this.passiveHandler.onDodge(this);
            }
            // --- End Trigger ---
            
            // Play dodge animation
            // Use instanceId if available, otherwise fallback to id
            const elementId = this.instanceId || this.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                // Add dodge animation class
                charElement.classList.add('dodge-animation');
                
                // Create dodge text VFX
                const dodgeVfx = document.createElement('div');
                dodgeVfx.className = 'dodge-vfx';
                dodgeVfx.textContent = 'DODGE!';
                charElement.appendChild(dodgeVfx);
                
                // Remove the animation class and VFX element after animation completes
                setTimeout(() => {
                    charElement.classList.remove('dodge-animation');
                    const vfxElements = charElement.querySelectorAll('.dodge-vfx');
                    vfxElements.forEach(el => el.remove());
                }, 1000);
                
                // Also clear any hiding flags
                delete this._hidingActive;
                delete this.isUntargetable;
            }
            
            return { damage: 0, isCritical: false, dodged: true }; // Add dodged flag
        }

        // --- NEW: Affection Damage Reduction Check ---
        let damage = amount; // Use a local variable for damage calculation
        if (caster) { // Only apply if there is a caster
            const affectionBuff = this.buffs.find(b => 
                b.id.startsWith('affection_buff_') && 
                b.targetId === caster.id
            );
            if (affectionBuff) {
                const reduction = 0.5; // 50% reduction
                const originalDamage = damage;
                damage *= (1 - reduction);
                damage = Math.max(1, Math.floor(damage)); // Ensure damage is at least 1
                const logFunction = window.gameManager ? 
                    window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                logFunction(`${this.name}'s Affection reduces incoming damage from ${caster.name} by 50% (from ${Math.round(originalDamage)} to ${Math.round(damage)})!`, 'buff-effect');
            }
        }
        // --- END NEW ---

        // Check for critical hit
        let isCritical = false;
        
        if (this.isDamageSource && Math.random() < this.isDamageSource.stats.critChance) {
            // Get the attacker's critical damage multiplier
            let critDamageMultiplier = 1.5; // Default fallback if no valid source
            
            // Use the attacker's crit damage multiplier
            if (this.isDamageSource.stats && this.isDamageSource.stats.critDamage) {
                critDamageMultiplier = this.isDamageSource.stats.critDamage;
            }
            
            damage = Math.floor(damage * critDamageMultiplier);
            isCritical = true;
            
            // Log the critical hit multiplier for debug purposes
            // Use caster parameter if available, otherwise fallback to isDamageSource
            const critSource = caster || this.isDamageSource;
            if (isCritical && window.gameManager && window.gameManager.debug) {
                console.log(`Critical hit! ${critSource ? critSource.name : 'Unknown Source'} crits for ${critDamageMultiplier.toFixed(2)}x damage`);
            }
        }
        
        // Apply damage modifiers from debuffs like Silencing Ring
        if (caster) { // Check if caster exists before accessing its methods
            // Apply the calculateDamage method from the attacker (source of damage)
            // This is where the Silencing Ring debuff will reduce damage by 30%
            damage = caster.calculateDamage(damage, type);
        }
        
        let damageAfterMods = damage; // Store damage before armor/shield

        // Apply armor/magical shield reduction as percentage-based
        if (type === 'physical') {
            // Convert armor to percentage-based reduction (capped at 80%)
            const damageReduction = Math.min(0.8, this.stats.armor / 100);
            damageAfterMods = Math.max(1, Math.floor(damageAfterMods * (1 - damageReduction)));
        } else if (type === 'magical') {
            // Convert magical shield to percentage-based reduction (capped at 80%)
            const damageReduction = Math.min(0.8, this.stats.magicalShield / 100);
            damageAfterMods = Math.max(1, Math.floor(damageAfterMods * (1 - damageReduction)));
        }

        // --- NEW: Check for Hooked debuff --- 
        const hookedDebuff = this.debuffs.find(d => d.id === 'hooked_debuff');
        if (hookedDebuff && hookedDebuff.increasesDamageTaken) {
            const originalDamage = damageAfterMods;
            damageAfterMods = Math.floor(damageAfterMods * hookedDebuff.increasesDamageTaken);
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} is Hooked and takes ${Math.round((hookedDebuff.increasesDamageTaken - 1) * 100)}% increased damage! (${Math.round(originalDamage)} -> ${Math.round(damageAfterMods)})`, 'debuff-effect');
        }
        // --- END NEW ---

        // --- NEW: Fire Shield Check ---
        const fireShieldBuff = this.buffs.find(b => b.id === 'fire_shield_buff');
        let finalDamage = damageAfterMods; // Initialize final damage with damage after armor/hooked
        let retaliationDamage = 0;
        let didRetaliate = false; // Flag to ensure retaliation happens only once per hit

        if (fireShieldBuff && caster && !caster.isDead() && !isRetaliation && !didRetaliate) { // Check buff, attacker, not already retaliation, and hasn't retaliated yet
            const reductionPercent = fireShieldBuff.effects?.damageReductionPercent || 0.25; // Default 25%
            const retaliationPercent = fireShieldBuff.effects?.retaliationPercent || 0.50; // Default 50%

            // 1. Calculate Retaliation Damage (based on damage *before* Fire Shield reduction)
            retaliationDamage = Math.floor(damageAfterMods * retaliationPercent);

            // 2. Apply Fire Shield Damage Reduction to the final damage amount
            finalDamage = Math.max(1, Math.floor(finalDamage * (1 - reductionPercent)));

            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Fire Shield reduces incoming damage by ${reductionPercent * 100}% (from ${Math.round(damageAfterMods)} to ${Math.round(finalDamage)})!`, 'buff-effect');

            // 3. Trigger Retaliation (moved below HP update)
            didRetaliate = true; // Mark that retaliation is planned for this hit
        }
        // --- END Fire Shield Check ---

        const originalHp = this.stats.currentHp; // Store HP before damage
        this.stats.currentHp = Math.max(0, this.stats.currentHp - finalDamage);
        const actualDamageTaken = originalHp - this.stats.currentHp; // Calculate actual HP lost
        updateCharacterUI(this);
        
        // --- NEW: Apply Fire Shield Retaliation (after HP update) ---
        if (retaliationDamage > 0 && caster && !caster.isDead() && didRetaliate) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Fire Shield retaliates against ${caster.name}!`, 'buff-effect');
            // Apply as magical damage, originating from 'this' (the shielded character)
            // Pass isRetaliation: true to prevent infinite loops
            caster.applyDamage(retaliationDamage, 'magical', this, { isRetaliation: true });

            // --- Add Retaliation VFX ---
            const casterElementId = caster.instanceId || caster.id;
            const casterElement = document.getElementById(`character-${casterElementId}`);
            if (casterElement) {
                const retaliateVfx = document.createElement('div');
                retaliateVfx.className = 'fire-shield-retaliate-vfx'; // Needs CSS definition
                casterElement.appendChild(retaliateVfx);
                setTimeout(() => retaliateVfx.remove(), 1000); // Matches damage VFX duration
            }
            // --- End Retaliation VFX ---
        }
        // --- END Retaliation ---
        
        // --- LOGGING BEFORE DEATH PROCESSING ---
        if (this.stats.currentHp <= 0) {
             console.log(`[Character applyDamage] ${this.name} HP reached 0 or below. Current gameState.playerCharacters:`, JSON.stringify(window.gameManager?.gameState?.playerCharacters.map(c => c.id)));
             console.log(`[Character applyDamage] ${this.name} HP reached 0 or below. Current gameState.aiCharacters:`, JSON.stringify(window.gameManager?.gameState?.aiCharacters.map(c => c.id)));
        }
        // --- END LOGGING ---
        
        // --- NEW: Trigger passive handler on taking damage --- 
        // Pass the actual damage taken and the attacker (caster)
        if (actualDamageTaken > 0 && this.passiveHandler && typeof this.passiveHandler.onDamageTaken === 'function') {
            // Prepare damageInfo object
            const damageInfo = {
                damage: actualDamageTaken,
                type: type,
                isCritical: isCritical
            };
            this.passiveHandler.onDamageTaken(this, damageInfo, caster);
        }
        // --- END NEW ---

        // Remove Farmer Nina's hiding buff if she takes damage
        if (damage > 0 && this.id === 'farmer_nina') {
            // Find the hiding buff if it exists
            const hidingBuff = this.buffs.find(buff => buff && buff.id === 'farmer_nina_w_hiding_buff');
            if (hidingBuff && !hidingBuff.wasHidingBroken) {
                // Log message
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                log(`${this.name}'s hiding is broken after taking damage!`);
                
                // Mark hiding as broken
                hidingBuff.wasHidingBroken = true;
                
                // Remove the hiding buff
                if (typeof this.removeBuff === 'function') {
                    this.removeBuff(hidingBuff.id);
                } else {
                    // Fallback removal
                    const index = this.buffs.indexOf(hidingBuff);
                    if (index !== -1) {
                        this.buffs.splice(index, 1);
                    }
                }
                
                // Restore opacity immediately
                const charElement = document.getElementById(`character-${this.id}`);
                if (charElement) {
                    charElement.style.opacity = '1';
                    charElement.dataset.isHiding = "false";
                }
                
                // Also clear any hiding flags
                delete this._hidingActive;
                delete this.isUntargetable;
            }
        }
        
        // Play damage animation and VFX
        // Use instanceId if available, otherwise fallback to id
        const elementIdForDamage = this.instanceId || this.id;
        // --- DEBUG --- 
        console.log(`[VFX DEBUG] applyDamage trying to get element for target: ID=${this.id}, InstanceID=${this.instanceId}, ElementIDToFind=character-${elementIdForDamage}`);
        // --- END DEBUG ---
        const damageCharElement = document.getElementById(`character-${elementIdForDamage}`);
        if (damageCharElement) {
            // Add shake animation
            damageCharElement.classList.add('shake-animation');
            
            // Create damage number VFX
            const damageVfx = document.createElement('div');
            damageVfx.className = 'damage-vfx';
            if (isCritical) {
                damageVfx.classList.add('critical');
                // Play sound if the character being hit is Schoolgirl Ayane
                if (this.id === 'schoolgirl_ayane') {
                    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSound('sounds/ayane_ohshit.mp3');
                }
            }
            damageVfx.textContent = `-${Math.round(damage)}`;
            damageCharElement.appendChild(damageVfx);
            
            // Add blood splatter VFX for physical damage
            if (type === 'physical') {
                const bloodVfx = document.createElement('div');
                bloodVfx.className = 'blood-vfx';
                damageCharElement.appendChild(bloodVfx);
            }
            
            // Add magical effect for magical damage
            if (type === 'magical') {
                const magicVfx = document.createElement('div');
                magicVfx.className = 'magic-vfx';
                damageCharElement.appendChild(magicVfx);
            }
            
            // Remove the animation classes and VFX elements after animation completes
            setTimeout(() => {
                damageCharElement.classList.remove('shake-animation');
                // Remove lifesteal classes from this querySelectorAll
                const vfxElements = damageCharElement.querySelectorAll('.damage-vfx, .blood-vfx, .magic-vfx'); 
                vfxElements.forEach(el => el.remove());
            }, 1000);
        }
        
        // Play sound if Schoolgirl Elphelt takes 500+ damage
        if (this.id === 'schoolgirl_elphelt' && damage >= 500) {
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/elphelt_help.mp3');
        }
        
        // Check for Elphelt crit sound condition *here*
        console.log(`[APPLY_DAMAGE_DEBUG] Caster: ${caster ? caster.id : 'NULL/UNDEFINED'}, isCritical: ${isCritical}`); // More specific debug
        if (caster && isCritical && caster.id === 'schoolgirl_elphelt') {
            console.log(`[SOUND DEBUG] Elphelt crit detected inside applyDamage! Playing sound.`);
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/elphelt_go.mp3');
        }
        
        // --- NEW: Trigger Caster's Chain Reaction Passive (if applicable) --- 
        if (caster && caster.passive && caster.passive.id === 'infernal_chain_reaction' && !isChainReaction) {
            // Check if the global passive function exists (based on the ID/convention)
            if (typeof window.infernalScorpionChainReactionPassive === 'function') {
                // Pass necessary info to the passive function
                const damageResultForPassive = {
                    damage: actualDamageTaken, // Use actual HP lost 
                    type: type, // Original damage type
                    isCritical: isCritical // Original crit status
                };
                // Call the global passive function directly
                // 'this' refers to the target receiving the damage
                // Pass options, including isChainReaction flag
                window.infernalScorpionChainReactionPassive(caster, this, null, damageResultForPassive, { isChainReaction: true });
            } else {
                console.warn(`Global passive function 'infernalScorpionChainReactionPassive' not found for passive ${caster.passive.id}. Ensure the script (${caster.passive.script}) is loaded correctly.`);
            }
        }
        // --- END NEW ---

        // Check if character is dead
        if (this.isDead()) {
            // Play death animation, sound, remove character, etc.
            // Use instanceId if available, otherwise fallback to id
            const elementIdForDeath = this.instanceId || this.id;
            // --- DEBUG ---
            console.log(`[DEATH DEBUG] applyDamage trying to get element for dying target: ID=${this.id}, InstanceID=${this.instanceId}, ElementIDToFind=character-${elementIdForDeath}`);
            // --- END DEBUG ---
            const deadCharElement = document.getElementById(`character-${elementIdForDeath}`);
            if (deadCharElement) {
                deadCharElement.classList.add('death-animation');
                deadCharElement.classList.add('character-dead'); // Add class for greyed-out state
                // Optional: Play death sound
                // Remove element after animation - REMOVED
                // setTimeout(() => {
                //     deadCharElement.remove();
                // }, 1000);
            }

            // Remove character from the game state in GameManager (handle this there)
            if (window.gameManager) {
                window.gameManager.handleCharacterDeath(this);
            }
        }
        
        return { damage: actualDamageTaken, isCritical: isCritical, dodged: false }; // Return actual damage dealt
    }

    // Calculate the final damage after applying modifiers
    calculateDamage(baseDamage, type) {
        // Base implementation - just return the original damage
        // This will be overridden by Silencing Ring debuff when applied
        return baseDamage;
    }

    // --- MODIFIED: Added options parameter ---
    heal(amount, options = {}) {
    // --- END MODIFICATION ---
        const baseHealAmount = amount * (1 + this.stats.healingPower);
        const actualHealAmount = Math.min(this.stats.maxHp - this.stats.currentHp, baseHealAmount);
        this.stats.currentHp += actualHealAmount;

        // Hook for passive handlers on receiving heal
        if (actualHealAmount > 0 && this.passiveHandler && typeof this.passiveHandler.onHealReceived === 'function') {
            this.passiveHandler.onHealReceived(this, actualHealAmount);
        }

        // --- NEW: Infernal Birdie Drink Up! Cooldown Reduction ---
        if (actualHealAmount > 0 && this.id === 'infernal_birdie') {
            const drinkUpAbility = this.abilities.find(ability => ability.id === 'infernal_birdie_drink_up');
            if (drinkUpAbility) {
                // reduceCooldown internally checks if currentCooldown > 0 and logs
                drinkUpAbility.reduceCooldown(); 
            }
        }
        // --- END NEW ---
        
        updateCharacterUI(this);
        
        // --- MODIFIED: Check options before playing VFX ---
        if (!options.suppressDefaultVFX) {
            // Play healing VFX
            // Use instanceId if available, otherwise fallback to id
            const elementId = this.instanceId || this.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                // Removed heal-animation class
                
                // Create healing number VFX
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx';
                healVfx.textContent = `+${Math.round(actualHealAmount)}`;
                charElement.appendChild(healVfx);
                
                // Add healing particles
                const healParticles = document.createElement('div');
                healParticles.className = 'heal-particles';
                charElement.appendChild(healParticles);
                
                // Remove the VFX elements after animation completes
                setTimeout(() => {
                    // Removed heal-animation class removal
                    const vfxElements = charElement.querySelectorAll('.heal-vfx, .heal-particles');
                    vfxElements.forEach(el => el.remove());
                }, 1000);
            }
        }
        // --- END MODIFICATION ---
        
        return Math.floor(actualHealAmount);
    }

    applyLifesteal(damage) {
        if (!this.stats.lifesteal || this.stats.lifesteal <= 0 || damage <= 0) {
            return 0;
        }

        const healAmount = Math.floor(damage * this.stats.lifesteal);
        this.heal(healAmount);
        
        // Return the heal amount for VFX and logging
        return healAmount;
    }

    regenerateResources() {
        // Regenerate HP and Mana per turn
        this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + this.stats.hpPerTurn);
        
        // Apply Atlantean Kagome passive: heals HP equal to missing mana
        if (this.id === 'atlantean_kagome' && this.passive && this.passive.id === 'atlantean_kagome_passive') {
            const missingMana = this.stats.maxMana - this.stats.currentMana;
            if (missingMana > 0) {
                // Calculate heal amount with healing power modifier
                const healAmount = missingMana * (1 + this.stats.healingPower);
                
                // Apply the healing
                const previousHp = this.stats.currentHp;
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
                const actualHealAmount = this.stats.currentHp - previousHp;
                
                // Log the passive effect
                const logFunction = window.gameManager ? 
                    window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                logFunction(`${this.name}'s Atlantean Blessing healed for ${Math.round(actualHealAmount)} HP from missing mana!`);
                
                // Add a visual effect for healing from missing mana
                const charElement = document.getElementById(`character-${this.id}`);
                if (charElement) {
                    // Create healing VFX
                    const healVfx = document.createElement('div');
                    healVfx.className = 'heal-vfx';
                    healVfx.textContent = `+${Math.round(actualHealAmount)} HP`;
                    charElement.appendChild(healVfx);
                    
                    // Removed glow effect
                    
                    // Create heal particles
                    const healParticles = document.createElement('div');
                    healParticles.className = 'heal-particles';
                    charElement.appendChild(healParticles);
                    
                    // Remove the VFX elements after animation completes
                    setTimeout(() => {
                        // Removed heal-animation class removal
                        const vfxElements = charElement.querySelectorAll('.heal-vfx, .heal-particles');
                        vfxElements.forEach(el => el.remove());
                    }, 1000);
                }
            }
        }
        
        // Normal mana regeneration for all characters
        this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + this.stats.manaPerTurn);
        
        updateCharacterUI(this);
    }

    addBuff(buff) {
        // Check if buff already exists and refresh duration if it does
        const existingBuffIndex = this.buffs.findIndex(b => b.id === buff.id);
        if (existingBuffIndex !== -1) {
            this.buffs[existingBuffIndex].duration = Math.max(this.buffs[existingBuffIndex].duration, buff.duration);
            console.log(`Refreshed duration for buff: ${buff.name} on ${this.name}`);
        } else {
            this.buffs.push(buff);
            buff.character = this; // Assign character reference to the buff

            // --- NEW: Call onApply if it exists --- 
            if (typeof buff.onApply === 'function') {
                try {
                    buff.onApply(this); // Pass the character instance
                } catch (e) {
                     console.error(`Error executing onApply for buff ${buff.id} on ${this.name}:`, e);
                }
            }
            // --- END NEW ---

            console.log(`Added buff: ${buff.name} to ${this.name}`);

            // Recalculate stats after adding the buff
            this.recalculateStats(); 

            // Call passive handler's onBuffAdded method if it exists
            if (this.passiveHandler && typeof this.passiveHandler.onBuffAdded === 'function') {
                this.passiveHandler.onBuffAdded(this);
            }
        }
        updateCharacterUI(this);
    }

    addDebuff(debuff) {
        // Similar logic for debuffs if needed, check for existing and refresh/add
        const existingDebuffIndex = this.debuffs.findIndex(d => d.id === debuff.id);
        if (existingDebuffIndex !== -1) {
             this.debuffs[existingDebuffIndex].duration = Math.max(this.debuffs[existingDebuffIndex].duration, debuff.duration);
             console.log(`Refreshed duration for debuff: ${debuff.name} on ${this.name}`);
        } else {
            this.debuffs.push(debuff);
            console.log(`Added debuff: ${debuff.name} to ${this.name}`);
            
            // Recalculate stats after adding the debuff
            this.recalculateStats();
        }
        updateCharacterUI(this);
    }

    removeBuff(buffId) {
        const index = this.buffs.findIndex(buff => buff.id === buffId);
        if (index !== -1) {
            const buffToRemove = this.buffs[index]; // Get the buff object first

            // --- MODIFIED: Check for and call .remove() --- 
            if (typeof buffToRemove.remove === 'function') {
                try {
                    buffToRemove.remove(this); // Call the buff's specific remove logic
                } catch (e) {
                    console.error(`Error executing remove() for buff ${buffToRemove.id} on ${this.name}:`, e);
                }
            }
            // --- END MODIFIED ---

            this.buffs.splice(index, 1);
            console.log(`Removed buff: ${buffId} from ${this.name}`);
            
            // Recalculate stats AFTER removing the buff
            this.recalculateStats(); 

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this); // Update UI after removing the buff
            }
        } else {
             console.log(`Attempted to remove non-existent buff ID: ${buffId} from ${this.name}`);
        }
    }

    removeDebuff(debuffId) {
        const index = this.debuffs.findIndex(debuff => debuff.id === debuffId);
        if (index !== -1) {
            const debuff = this.debuffs[index];
             console.log(`Removing debuff: ${debuff.name} from ${this.name}`);

            // Call the debuff's specific remove function *before* removing it
            if (typeof debuff.remove === 'function') {
                 try {
                    debuff.remove(this);
                } catch (error) {
                    console.error(`Error executing remove function for debuff ${debuff.name}:`, error);
                }
            }

            this.debuffs.splice(index, 1);

            // Recalculate stats after removing the debuff
            this.recalculateStats();

            // Call passive handler's onDebuffRemoved method if it exists
            if (this.passiveHandler && typeof this.passiveHandler.onDebuffRemoved === 'function') {
                this.passiveHandler.onDebuffRemoved(this);
            }

            updateCharacterUI(this); // Update UI after recalculating stats
        } else {
            console.log(`Attempted to remove non-existent debuff ID: ${debuffId} from ${this.name}`);
        }
    }

    processEffects(shouldReduceDuration = false) {
        // Process buffs
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            
            // Apply buff effect (per-turn effects, not stat mods which are handled by recalculateStats)
            if (typeof buff.effect === 'function') {
                try {
                    buff.effect(this);
                } catch (error) {
                    console.error("Error applying buff effect:", error);
                }
            }
            
            // Reduce duration only if shouldReduceDuration is true
            if (shouldReduceDuration) {
                buff.duration--;
            }
            
            // Remove if expired
            if (buff.duration <= 0) {
                // Store buff details before removing for logging
                const buffId = buff.id;
                const buffName = buff.name || 'buff';
                const characterName = this.name || 'character';

                // Call removeBuff which handles recalculation and removal logic
                this.removeBuff(buffId); 
                
                // Logging moved inside removeBuff or handled separately if needed
                try {
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`${characterName}'s ${buffName} effect has expired.`);
                    } else {
                        addLogEntry(`${characterName}'s ${buffName} effect has expired.`);
                    }
                } catch (error) {
                    console.error("Error logging buff expiration:", error);
                }
            }
        }

        // Process debuffs (similar loop)
        for (let i = this.debuffs.length - 1; i >= 0; i--) {
            const debuff = this.debuffs[i];

             // Apply debuff effect (per-turn effects)
            if (typeof debuff.effect === 'function') {
                try {
                    debuff.effect(this);
                } catch (error) {
                    console.error("Error applying debuff effect:", error);
                }
            }

            // NEW: Apply onTurnEnd effect if it exists
            if (typeof debuff.onTurnEnd === 'function') {
                try {
                    debuff.onTurnEnd(this); 
                } catch (error) {
                    console.error(`Error applying onTurnEnd for debuff ${debuff.name || debuff.id}:`, error);
                }
            }

            if (shouldReduceDuration) {
                debuff.duration--;
            }

            if (debuff.duration <= 0) {
                 // Store details for logging
                const debuffId = debuff.id;
                const debuffName = debuff.name || 'debuff';
                const characterName = this.name || 'character';

                // Call removeDebuff which handles recalculation and removal logic
                this.removeDebuff(debuffId);

                try {
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`${characterName}'s ${debuffName} effect has expired.`);
                    } else {
                        addLogEntry(`${characterName}'s ${debuffName} effect has expired.`);
                    }
                } catch (error) {
                    console.error("Error logging debuff expiration:", error);
                }
            }
        }

        // NEW: Process ability disable durations
        this.abilities.forEach(ability => {
            if (ability.isDisabled && shouldReduceDuration) {
                ability.disabledDuration--;
                if (ability.disabledDuration <= 0) {
                    ability.isDisabled = false;
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`${this.name}'s ${ability.name} is no longer disabled.`);
                    // No need to call remove here, the debuff removal handles the main cleanup
                }
            }
        });
        // --- END NEW ---

        // Regenerate resources like HP/Mana per turn after processing effects
        this.regenerateResources();

        // Update UI after processing all effects for the turn
        updateCharacterUI(this);
    }

    addAbility(ability) {
        this.abilities.push(ability);
    }

    // Use an ability with the given index on a target or targets
    useAbility(abilityIndex, targetOrTargets) {
        if (abilityIndex < 0 || abilityIndex >= this.abilities.length) {
            console.error(`Invalid ability index: ${abilityIndex} for ${this.name}`);
            return false;
        }
        
        const ability = this.abilities[abilityIndex];

        // --- PRE-CHECKS ---
        if (ability.isDisabled) {
             const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
             log(`${this.name}'s ${ability.name} is disabled.`);
             return false;
        }
        if (ability.currentCooldown > 0) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${ability.name} is on cooldown: ${ability.currentCooldown} turns remaining`);
            return false;
        }
        if (this.stats.currentMana < ability.manaCost) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} has not enough mana to use ${ability.name}`);
            return false;
        }
         if (this.isStunned()) {
             const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
             log(`${this.name} is stunned and cannot use ${ability.name}.`);
             return false;
         }
        // --- END PRE-CHECKS ---

        // --- NEW: Shoma -> Julia Interaction Sound ---
        let targetIsJulia = false;
        if (Array.isArray(targetOrTargets)) {
            targetIsJulia = targetOrTargets.some(t => t && t.id === 'schoolgirl_julia');
        } else if (targetOrTargets) {
            targetIsJulia = targetOrTargets.id === 'schoolgirl_julia';
        }

        // Play interaction sound if Shoma targets Julia with ANY ability
        if (this.id === 'schoolboy_shoma' && targetIsJulia) { 
            // <<< ADD DEBUG LOGS HERE >>>
            console.log(`[DEBUG Interaction Sound] Condition met! Caster: ${this.name}, Target is Julia: ${targetIsJulia}, Ability: ${ability.name}`);
            const interactionSounds = ['sounds/julia_shoma.mp3', 'sounds/julia_shoma2.mp3'];
            const randomSound = interactionSounds[Math.floor(Math.random() * interactionSounds.length)];
            console.log(`[DEBUG Interaction Sound] Chosen sound: ${randomSound}`);
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            if (typeof playSound === 'function') {
                 console.log(`[DEBUG Interaction Sound] Calling playSound function.`);
                 playSound(randomSound);
            } else {
                 console.error(`[DEBUG Interaction Sound] playSound function not found or not a function!`);
            }
            // Optional: Keep or remove the specific log message
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
            log(`${this.name} used ${ability.name} on Julia! (Interaction sound played)`); 
        } else {
             // <<< ADD DEBUG LOG HERE >>>
             if (this.id === 'schoolboy_shoma') {
                 console.log(`[DEBUG Interaction Sound] Condition NOT met. Caster: ${this.name}, Target is Julia: ${targetIsJulia}, Ability: ${ability.name}`);
             }
        }
        // --- END NEW ---

        // Use the ability and apply its effect
        // Pass the target(s) directly to the ability's use method
        const success = ability.use(this, targetOrTargets);
        
        // Dispatch a custom event for VFX only if successful
        if (success) {
            const abilityUsedEvent = new CustomEvent('AbilityUsed', {
                detail: {
                    caster: this,
                    target: targetOrTargets, // Pass original target info
                    ability: ability
                }
            });
            document.dispatchEvent(abilityUsedEvent);
        } else {
            // Log if ability.use returned false for some internal reason
            console.warn(`${this.name}'s attempt to use ${ability.name} returned false.`);
        }
        
        return success;
    }

    resetAbilityCooldowns() {
        console.log(`Resetting cooldowns for ${this.name}`);
        this.abilities.forEach(ability => {
            console.log(`  Before: ${ability.name} cooldown: ${ability.currentCooldown}`);
            ability.currentCooldown = 0;
            console.log(`  After: ${ability.name} cooldown: ${ability.currentCooldown}`);
        });
    }

    isDead() {
        return this.stats.currentHp <= 0;
    }

    isStunned() {
        return this.debuffs.some(debuff => 
            debuff.id === 'stun' || 
            (debuff.effects && debuff.effects.cantAct === true)
        );
    }

    // Check if character has a specific buff
    hasBuff(buffId) {
        return this.buffs.some(buff => buff.id === buffId);
    }

    // --- NEW: Check if character is untargetable by abilities due to buffs ---
    isUntargetable() {
        // Check both buffs and debuffs arrays
        const allEffects = [...this.buffs, ...this.debuffs];
        return allEffects.some(effect => effect.isUntargetable === true);
    }
    // --- END NEW ---
}

// Ability class definition
class Ability {
    constructor(id, name, icon, manaCost, cooldown, effect) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.manaCost = manaCost;
        this.cooldown = cooldown;
        this.currentCooldown = 0;
        // Store the effect function that can be called directly for AOE abilities
        this.effect = effect;
        this.description = "";
        this.targetType = "enemy"; // "enemy", "ally", "self", "all_enemies", "all_allies", "all"
        this.isDisabled = false; // NEW: Flag to indicate if ability is disabled
        this.disabledDuration = 0; // NEW: Duration for which the ability is disabled
    }

    use(caster, targetOrTargets) {
        // --- > Check 2: Does it get here? <---
        // Log received target type for debugging
        console.log(`[DEBUG] Ability.use called for: ${this.name} by ${caster?.name}. Received target type: ${Array.isArray(targetOrTargets) ? 'Array' : typeof targetOrTargets}`);

        // Perform checks using caster only (mana, cooldown, disabled, stun)
        // These checks are already done in Character.useAbility, but double-checking is safe.
        if (this.isDisabled || this.currentCooldown > 0 || caster.stats.currentMana < this.manaCost || caster.isStunned()) {
             console.warn(`[DEBUG] Ability.use pre-check failed for ${this.name}`);
             // No need for log messages here, Character.useAbility handles them.
             return false; // Exit if any pre-check fails
        }
        
        // Set damage source marker (less critical now, but keep for potential use)
         if (Array.isArray(targetOrTargets)) {
             targetOrTargets.forEach(t => { if (t) t.isDamageSource = caster; });
         } else if (targetOrTargets) {
             targetOrTargets.isDamageSource = caster;
         }
        
        // Execute the ability's effect, passing caster and targets
        // --- > Check 3: Is this.effect valid? <---
        console.log(`[DEBUG] Ability.use about to call effect for: ${this.name}. Is effect a function?`, typeof this.effect === 'function');
        if (typeof this.effect !== 'function') {
            console.error(`[DEBUG] ERROR: Effect for ability ${this.name} is not a function!`);
            return false; // Cannot execute if effect is invalid
        }
        console.log(`[DEBUG] Function Body:`, this.effect.toString());

        try {
             this.effect(caster, targetOrTargets); // Call the effect function
        } catch (error) {
            console.error(`[DEBUG] ERROR executing effect for ability ${this.name}:`, error);
             // Optionally, reset damage source marker on error
             if (Array.isArray(targetOrTargets)) {
                 targetOrTargets.forEach(t => { if (t) t.isDamageSource = null; });
             } else if (targetOrTargets) {
                 targetOrTargets.isDamageSource = null;
             }
            return false; // Indicate failure
        }
        
        // Consume mana
        caster.stats.currentMana -= this.manaCost;
        
        // Set cooldown
        this.currentCooldown = this.cooldown;
        
        // Update caster UI (target UI updated within effect)
        updateCharacterUI(caster);
        
        // Remove damage source reference after a delay
        setTimeout(() => {
            if (Array.isArray(targetOrTargets)) {
                targetOrTargets.forEach(t => { if (t) t.isDamageSource = null; });
            } else if (targetOrTargets) {
                targetOrTargets.isDamageSource = null;
            }
        }, 500);
        
        // Trigger caster's passive handler after successful cast
        if (caster.passiveHandler && typeof caster.passiveHandler.onAbilityCast === 'function') {
            caster.passiveHandler.onAbilityCast(caster, this);
        }
        
        // Check for specific character passives (like Kokoro)
        if (caster.constructor.name === "SchoolgirlKokoroCharacter" && typeof caster.applyPassiveHealingFeedback === "function") {
            caster.applyPassiveHealingFeedback();
        }
        
        return true; // Indicate success
    }

    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
            console.log(`Reduced cooldown for ${this.name} to ${this.currentCooldown}`);
        }
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    setTargetType(targetType) {
        this.targetType = targetType;
        return this;
    }
}

// Effect class definition
class Effect {
    constructor(id, name, icon, duration, effect, isDebuff = false) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.duration = duration;
        this.effect = effect;
        this.isDebuff = isDebuff;
        this.description = "";
        this.statModifiers = {}; // Store stat modifications
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    // Clone method to create a deep copy of an Effect
    clone() {
        const cloned = new Effect(
            this.id,
            this.name,
            this.icon,
            this.duration,
            this.effect,
            this.isDebuff
        );
        
        // Copy description
        cloned.description = this.description;
        
        // Deep copy stat modifiers
        cloned.statModifiers = {};
        for (const key in this.statModifiers) {
            cloned.statModifiers[key] = this.statModifiers[key];
        }
        
        // Copy any other custom properties
        if (this.originalStats) {
            cloned.originalStats = {...this.originalStats};
        }
        
        // Copy custom methods if they exist
        if (typeof this.remove === 'function' && this.remove !== Effect.prototype.remove) {
            cloned.remove = this.remove;
        }
        
        if (typeof this.onApply === 'function') {
            cloned.onApply = this.onApply;
        }
        
        if (this.effects) {
            cloned.effects = {...this.effects};
        }
        
        return cloned;
    }

    // Called when an effect is removed
    remove(character) {
        // Default removal implementation with enhanced error handling
        try {
            if (character && character.name) {
                console.log(`Effect ${this.name || 'unnamed'} removed from ${character.name}`);
            } else {
                console.log(`Effect ${this.name || 'unnamed'} removed`);
            }
        } catch (error) {
            console.error("Error in Effect.remove:", error);
        }
    }
}

window.Effect = Effect; // Make Effect class globally accessible

// Character data utility factory
const CharacterFactory = {
    // Creates a character from a character definition
    createCharacter(charData) {
        const character = new Character(
            charData.id,
            charData.name,
            charData.image,
            charData.stats
        );

        // Add abilities
        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = AbilityFactory.createAbility(abilityData);
                character.addAbility(ability);
            });
        }
        
        // Add passive and instantiate handler if applicable
        if (charData.passive) {
            character.passive = charData.passive; // Store passive info (name, desc)

            // Instantiate specific passive handlers based on ID
            if (charData.passive.id === 'schoolboy_siegfried_passive' && typeof SchoolboySiegfriedPassive !== 'undefined') {
                character.passiveHandler = new SchoolboySiegfriedPassive();
                console.log(`Attached SchoolboySiegfriedPassive handler to ${character.name}`);
            } else if (charData.passive.id === 'schoolgirl_julia_passive' && typeof SchoolgirlJuliaPassive !== 'undefined') {
                character.passiveHandler = new SchoolgirlJuliaPassive();
                console.log(`Attached SchoolgirlJuliaPassive handler to ${character.name}`);
            } else if (charData.passive.id === 'schoolgirl_ayane_passive' && typeof SchoolgirlAyanePassive !== 'undefined') {
                character.passiveHandler = new SchoolgirlAyanePassive();
                console.log(`Attached SchoolgirlAyanePassive handler to ${character.name}`);
            } else if (charData.passive.id === 'schoolgirl_elphelt_passive' && typeof SchoolgirlElpheltPassive !== 'undefined') {
                character.passiveHandler = new SchoolgirlElpheltPassive();
                console.log(`Attached SchoolgirlElpheltPassive handler to ${character.name}`);
            } else if (charData.passive.id === 'infernal_astaroth_passive' && typeof InfernalAstarothPassive !== 'undefined') {
                character.passiveHandler = new InfernalAstarothPassive();
                console.log(`Attached InfernalAstarothPassive handler to ${character.name}`);
            } else if (charData.passive.id === 'lifesteal_on_stun' && typeof InfernalBirdiePassive !== 'undefined') {
                character.passiveHandler = new InfernalBirdiePassive();
                console.log(`Attached InfernalBirdiePassive handler to ${character.name}`);
            }
            // Add other passive handlers here using else if (charData.passive.id === ...)
        }

        if (charData.isAI) {
            character.isAI = true;
        }

        // Initialize the passive handler *after* the character object is fully constructed
        if (character.passiveHandler && typeof character.passiveHandler.initialize === 'function') {
             console.log(`Initializing passive handler for ${character.name}`);
             character.passiveHandler.initialize(character);
        }

        return character;
    },

    // Load character data from file 
    async loadCharacterData(characterId) {
        try {
            const response = await fetch(`js/raid-game/characters/${characterId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load character data for ${characterId}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading character: ${error.message}`);
            return null;
        }
    },

    // Get a list of available characters from the character registry
    async getAvailableCharacters() {
        try {
            const response = await fetch('js/raid-game/character-registry.json');
            if (!response.ok) {
                throw new Error('Failed to load character registry');
            }
            const data = await response.json();
            return data.characters || [];
        } catch (error) {
            console.error(`Error loading character registry: ${error.message}`);
            return [];
        }
    }
};

// Ability factory for creating abilities
// Add a simple registry for pre-defined abilities
const predefinedAbilities = {};

const AbilityFactory = {
    // Add a registry for pre-defined abilities
    abilityRegistry: {},

    // Helper to clear the registry if needed (e.g., for testing or reloading)
    clearRegistry() {
        this.abilityRegistry = {};
        console.log("Ability registry cleared.");
    },

    // Function to create a character object
    createCharacter(charData) {
        // Check if a custom class exists for this character type
        if (CharacterFactory.customCharacterClasses[charData.id]) {
            console.log(`Creating character ${charData.name || charData.id} using custom character class`);
            return new CharacterFactory.customCharacterClasses[charData.id](charData);
        }

        // Otherwise, use the base Character class
        console.log(`Creating character ${charData.name || charData.id} using base Character class`);
        const character = new Character(
            charData.id,
            charData.name,
            charData.image,
            { ...charData.stats }, // Pass a copy of stats
            charData.tags || []
        );

        // Add abilities
        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = this.createAbility(abilityData); // Use factory method
                character.addAbility(ability);
            });
        }

        // Add passive if it exists
        if (charData.passive) {
            character.passive = charData.passive; // Store passive definition

            // Attempt to dynamically load and initialize the passive handler
            try {
                const passiveClassName = this.getPassiveClassName(charData.id); // e.g., InfernalAstarothPassive
                const PassiveHandlerClass = window[passiveClassName]; // Access class from global scope
                if (PassiveHandlerClass && typeof PassiveHandlerClass === 'function') {
                    character.passiveHandler = new PassiveHandlerClass();
                    console.log(`Attached ${passiveClassName} handler to ${character.name}`);
                     // Initialize the passive handler (if it has an initialize method)
                     if (typeof character.passiveHandler.initialize === 'function') {
                         console.log(`Initializing passive handler for ${character.name}`);
                         character.passiveHandler.initialize(character); // Pass character instance
                     } else {
                          console.warn(`Passive handler ${passiveClassName} for ${character.name} does not have an initialize method.`);
                     }
                } else {
                     console.warn(`Passive handler class '${passiveClassName}' not found for ${character.name}`);
                }
            } catch (error) {
                console.error(`Error attaching passive handler for ${character.name}:`, error);
            }
        }

        // Assign base stats for reference
        character.baseStats = { ...charData.stats };

        // Initialize current HP/Mana
        character.stats.currentHp = character.stats.maxHp;
        character.stats.currentMana = character.stats.maxMana;

        return character;
    },

    // Helper to generate expected passive class name
    getPassiveClassName(characterId) {
        // Example: infernal_astaroth -> InfernalAstarothPassive
        const parts = characterId.split('_');
        const capitalized = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
        return capitalized.join('') + 'Passive';
    },

    // Load character data from JSON
    async loadCharacterData(characterId) {
        try {
            const response = await fetch(`js/raid-game/characters/${characterId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not load character data for ${characterId}:`, error);
            return null;
        }
    },

    // --- NEW: Get available characters from registry ---
    async getAvailableCharacters() {
        try {
             const response = await fetch('js/raid-game/character-registry.json');
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             const registry = await response.json();
             return registry.characters || [];
        } catch (error) {
             console.error('Could not load character registry:', error);
             return []; // Return empty array on error
        }
    },

    // New function to register pre-defined abilities
    registerAbilities(abilities) {
        if (!Array.isArray(abilities)) {
            console.error("registerAbilities expects an array.");
            return;
        }
        abilities.forEach(ability => {
            if (ability && ability.id && ability instanceof Ability) { // Check if it's an Ability instance
                // Use the new registry
                this.abilityRegistry[ability.id] = ability;
                console.log(`[AbilityFactory] Registered pre-defined ability: ${ability.id}`);
            } else {
                console.error("[AbilityFactory] Attempted to register an invalid or non-Ability object.", ability);
            }
        });
    },

    createAbility(abilityData) {
        // --- MODIFIED: Check the registry first ---
        if (this.abilityRegistry[abilityData.id]) {
            console.log(`[AbilityFactory] Using pre-registered ability object for: ${abilityData.id}`);
            // Return the registered instance directly.
            // If multiple characters use the same ability ID, they will share the instance (and cooldown state).
            // This is usually the desired behavior for unique boss abilities.
            // If unique instances per character are needed, cloning would be required here.
            return this.abilityRegistry[abilityData.id];
        }
        // --- END MODIFICATION ---

        // If not pre-defined, create it using the generic method
        console.log(`[AbilityFactory] Creating generic ability for: ${abilityData.id} (Type: ${abilityData.type || 'N/A'})`);
        const ability = new Ability(
            abilityData.id,
            abilityData.name || 'Unnamed Ability', // Add default name
            abilityData.icon,
            abilityData.manaCost,
            abilityData.cooldown,
            this.getAbilityEffect(abilityData) // Generate effect based on type
        );

        // Ensure cooldown is properly initialized
        ability.currentCooldown = 0;

        if (abilityData.description) {
            ability.setDescription(abilityData.description);
        }

        if (abilityData.targetType) {
            ability.setTargetType(abilityData.targetType);
        }

        return ability;
    },

    getAbilityEffect(abilityData) {
        // Check for placeholder abilities which might not have a type
        if (abilityData.placeholderAbility || abilityData.isPlaceholder) { // Added isPlaceholder check for consistency
             console.log(`Ability ${abilityData.id} is a placeholder.`);
             return (caster, target) => {
                 const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                 log(`${abilityData.name} cannot be used directly (Placeholder).`);
            };
        }
        
        // --- NEW: Handle 'custom' type --- 
        if (abilityData.type === 'custom') {
            if (abilityData.effect && abilityData.effect.functionName) {
                const customFunctionName = abilityData.effect.functionName;
                // Check if the function exists globally (or on a designated object like window)
                if (typeof window[customFunctionName] === 'function') {
                    // Return the actual custom function
                    // The custom function is expected to handle caster/target logic
                    return window[customFunctionName];
                } else {
                    console.error(`Custom ability function not found: ${customFunctionName} for ability ${abilityData.id}. Ensure the script (${abilityData.effect.script}) is loaded and the function is defined globally.`);
                    // Return an error function that logs the issue when used
                    return (caster, target) => {
                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                        log(`Error: Custom function ${customFunctionName} for ${abilityData.name} not found.`);
                    };
                }
            } else {
                console.error(`Custom ability ${abilityData.id} is missing required effect details (functionName).`);
                // Return an error function that logs the issue when used
                return (caster, target) => {
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                    log(`Error: Configuration error for custom ability ${abilityData.name}. Missing functionName.`);
                };
            }
        }
        // --- END NEW --- 

        // This maps ability types to their implementation functions
        const effectImplementations = {
            'damage': this.createDamageEffect,
            'heal': this.createHealEffect,
            'buff': this.createBuffEffect,
            'debuff': this.createDebuffEffect,
            'aoe_damage': this.createAoEDamageEffect,
            'aoe_heal': this.createAoEHealEffect,
            'lifesteal': this.createLifestealEffect,
            // More ability types can be added here
        };

        const effectCreator = effectImplementations[abilityData.type];
        if (!effectCreator) {
            // Log error only if it's not a placeholder
            console.error(`Unknown or missing ability type for non-placeholder ability: ${abilityData.id}, Type: ${abilityData.type}`);
            return (caster, target) => {
                 const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                 log(`${caster.name} used an ability (${abilityData.name}) with an unknown or missing type.`);
            };
        }

        return effectCreator.call(this, abilityData);
    },

    createDamageEffect(abilityData) {
        return (caster, targetOrTargets) => {
            // This effect type expects a single target
            if (Array.isArray(targetOrTargets)) {
                console.warn(`[AbilityFactory] Damage effect (${abilityData.name}) received an array, but expects a single target. Using first.`);
                targetOrTargets = targetOrTargets[0];
            }
            const target = targetOrTargets;
            if (!target || typeof target.applyDamage !== 'function') {
                 console.error(`[AbilityFactory] Invalid target for damage effect (${abilityData.name}):`, target);
                 return;
            }

            const damageType = abilityData.damageType || 'physical';
            const statToUse = damageType === 'physical' ? 'physicalDamage' : 'magicalDamage';
            
            // Determine damage amount
            let damageAmount;
            if (abilityData.fixedDamage !== undefined) {
                damageAmount = Math.floor(abilityData.fixedDamage);
            } else {
                const multiplier = abilityData.amount || 1;
                const statValue = caster.stats[statToUse] || 0;
                damageAmount = Math.floor(multiplier * statValue);
            }
            
            // --- NEW: Check for Caster's Heavy Ball Debuff --- 
            const heavyBallDebuff = caster.debuffs.find(d => d.id === 'heavy_ball_debuff');
            if (heavyBallDebuff && heavyBallDebuff.effects && heavyBallDebuff.effects.damageReductionPercent) {
                const reduction = heavyBallDebuff.effects.damageReductionPercent;
                const originalDamage = damageAmount;
                damageAmount = Math.floor(damageAmount * (1 - reduction));
                // Log the reduction
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
                log(`${caster.name} is affected by Heavy Ball, reducing outgoing damage by ${reduction * 100}% (from ${originalDamage} to ${damageAmount}).`, 'debuff-effect');
            }
            // --- END NEW ---

            // Apply critical hit if applicable (using caster's crit stats)
            let isCritical = false;
            if (Math.random() < (caster.stats.critChance || 0)) {
                damageAmount = Math.floor(damageAmount * (caster.stats.critDamage || 1.5));
                isCritical = true;
            }
            
            // Apply damage
            const result = target.applyDamage(damageAmount, damageType, caster);
            result.isCritical = isCritical || result.isCritical; // Preserve crit status
            
            // Logging
            let message = `${caster.name} used ${abilityData.name} on ${target.name} for ${result.damage} ${damageType} damage`;
            if (result.isCritical) message += " (Critical Hit!)";
            addLogEntry(message, result.isCritical ? 'critical' : '');
            
             // Sound Effects (Example)
             const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
             if (result.isCritical && caster.id === 'schoolgirl_elphelt') {
                 playSound('sounds/elphelt_go.mp3');
             }
             if (abilityData.id === 'schoolboy_siegfried_q') {
                 playSound('sounds/siegfrieda1.mp3', 0.8);
                 playSound('sounds/siegfrieda1sfx.mp3', 0.6);
             }
             if (abilityData.id === 'boink') {
                 playSound('sounds/shomaa1.mp3');

                 // --- NEW: Boink specific permanent crit chance increase ---
                 if (Math.random() < 0.50) { // 50% chance
                     const critIncrease = 0.05; // 5%
                     // Increase BASE crit chance
                     caster.baseStats.critChance = (caster.baseStats.critChance || 0) + critIncrease;
                     // Optionally clamp base crit chance (e.g., to 1.0 or less)
                     caster.baseStats.critChance = Math.min(1.0, caster.baseStats.critChance);

                     addLogEntry(`${caster.name}'s Boink permanently increased their critical hit chance by ${critIncrease * 100}%!`, 'buff-effect');

                     // --- Add Crit Increase VFX ---
                     const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                     if (casterElement) {
                         // Glow effect
                         const glowVfx = document.createElement('div');
                         glowVfx.className = 'crit-chance-increase-glow-vfx';
                         casterElement.appendChild(glowVfx);
                         // Text effect
                         const textVfx = document.createElement('div');
                         textVfx.className = 'crit-chance-increase-text-vfx';
                         textVfx.textContent = `+${critIncrease * 100}% Crit!`;
                         casterElement.appendChild(textVfx);

                         // Remove VFX after animation (adjust timing if needed)
                         setTimeout(() => {
                             glowVfx.remove();
                             textVfx.remove();
                         }, 800); // Matches animation duration
                     }
                     // --- End VFX ---

                     // Recalculate stats to reflect the change
                     caster.recalculateStats();
                     // Update UI immediately
                     updateCharacterUI(caster);
                 }
                 // --- END NEW ---
             }

            // --- VFX --- 
             const targetElementId = target.instanceId || target.id;
             const targetElement = document.getElementById(`character-${targetElementId}`);
             if (targetElement) {
                 if (abilityData.id === 'schoolboy_siegfried_q') {
                     // Siegfried's Q VFX
                     const impactVfx = document.createElement('div');
                     impactVfx.className = 'physical-impact-vfx';
                     targetElement.appendChild(impactVfx);
                     setTimeout(() => impactVfx.remove(), 600);
                     const slashVfx = document.createElement('div');
                     slashVfx.className = 'siegfried-sword-slash';
                     targetElement.appendChild(slashVfx);
                     setTimeout(() => slashVfx.remove(), 350);
                 }
                 // Add other specific ability VFX here
             }
            // --- End VFX --- 
            
            // Apply lifesteal (caster heals based on damage dealt)
            const lifestealHealAmount = caster.applyLifesteal(result.damage);
            if (lifestealHealAmount > 0) {
                addLogEntry(`${caster.name} healed for ${lifestealHealAmount} from lifesteal.`);
                // Add lifesteal VFX to caster (implementation needed)
                const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                if (casterElement) {
                    const lifestealVfx = document.createElement('div');
                    lifestealVfx.className = 'lifesteal-vfx';
                    casterElement.appendChild(lifestealVfx);
                    const healNumber = document.createElement('div');
                    healNumber.className = 'lifesteal-heal-number';
                    healNumber.textContent = `+${lifestealHealAmount}`;
                    casterElement.appendChild(healNumber);
                    setTimeout(() => {
                        casterElement.querySelectorAll('.lifesteal-vfx, .lifesteal-heal-number').forEach(el => el.remove());
                    }, 1200);
                }
            }
            
            // Apply debuff if specified in abilityData and not dodged
            if (!result.dodged && abilityData.debuffEffect && typeof abilityData.debuffEffect === 'object') {
                const chance = abilityData.debuffEffect.chance || 1;
                if (Math.random() < chance) {
                    const debuffData = abilityData.debuffEffect;
                    const debuff = new Effect(
                        debuffData.debuffId,
                        debuffData.name,
                        debuffData.icon,
                        debuffData.duration,
                        null, // Debuff effects are handled by processEffects
                        true
                    );
                    // Copy custom properties like stat modifiers or special flags
                     if (debuffData.effects) debuff.effects = { ...debuffData.effects };
                     if (debuffData.statModifiers) debuff.statModifiers = { ...debuffData.statModifiers };
                     
                    target.addDebuff(debuff);
                    addLogEntry(`${target.name} is afflicted with ${debuff.name} for ${debuff.duration} turns!`);
                }
            }
            
            // Check if target died
            if (target.isDead()) {
                addLogEntry(`${target.name} has been defeated!`);
                 // Optionally trigger caster's onKill passive
                 if (caster.passiveHandler && typeof caster.passiveHandler.onKill === 'function') {
                     caster.passiveHandler.onKill(caster, target);
                 }
            }

             // Always update target UI after applying damage/debuff
             updateCharacterUI(target);
        };
    },

    createHealEffect(abilityData) {
        return (caster, targetOrTargets) => {
            // This effect type expects a single target
            if (Array.isArray(targetOrTargets)) {
                console.warn(`[AbilityFactory] Heal effect (${abilityData.name}) received an array, expects single target. Using first.`);
                targetOrTargets = targetOrTargets[0];
            }
            const target = targetOrTargets;
            if (!target || typeof target.heal !== 'function') {
                 console.error(`[AbilityFactory] Invalid target for heal effect (${abilityData.name}):`, target);
                 return;
            }

            const baseAmount = abilityData.amount || 1;
            const healAmount = Math.floor(baseAmount * (1 + (caster.stats.healingPower || 0)));
            
            const actualHeal = target.heal(healAmount);
            addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, healing for ${actualHeal} HP.`, 'heal');

            // Hook for passive handlers on dealing heal
            if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                caster.passiveHandler.onHealDealt(caster, target, actualHeal);
            }
            // Update UI for the healed target
            updateCharacterUI(target);
        };
    },

    createBuffEffect(abilityData) {
        return (caster, targetOrTargets) => {
            // This effect type expects a single target
            if (Array.isArray(targetOrTargets)) {
                console.warn(`[AbilityFactory] Buff effect (${abilityData.name}) received an array, expects single target. Using first.`);
                targetOrTargets = targetOrTargets[0];
            }
            const target = targetOrTargets;
            if (!target || typeof target.addBuff !== 'function') {
                 console.error(`[AbilityFactory] Invalid target for buff effect (${abilityData.name}):`, target);
                 return;
            }

            // --- MODIFICATION START: Read from abilityData.buffEffect --- 
            const buffDetails = abilityData.buffEffect;
            if (!buffDetails) {
                console.error(`[AbilityFactory] Missing 'buffEffect' details in abilityData for ${abilityData.name}`);
                return; // Cannot create buff without details
            }

            // Create the buff effect using details from buffDetails
            const buff = new Effect(
                buffDetails.buffId || `buff_${abilityData.name}_${Date.now()}`, // Use buffId from details
                buffDetails.name || abilityData.name, // Prefer buff name, fallback to ability name
                abilityData.icon, // Icon usually comes from abilityData
                buffDetails.duration || 3,
                null, // Per-turn effect logic handled elsewhere
                false // isDebuff = false
            );

            // Add description (can come from ability or buff details)
            buff.setDescription(buffDetails.description || abilityData.description || `A positive effect from ${abilityData.name}.`);

            // Add stat modifiers if they exist in buffDetails
            if (buffDetails.statModifiers) {
                buff.statModifiers = { ...buffDetails.statModifiers };
            }
            // Add custom effects/flags if they exist in buffDetails
             if (buffDetails.effects) {
                 buff.effects = { ...buffDetails.effects };
             }
            // --- MODIFICATION END ---

            // Add the buff to the target
            target.addBuff(buff);
            addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, applying ${buff.name} for ${buff.duration} turns.`);

            // Play sound for specific buff abilities
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            if (abilityData.id === 'catch') { // Shoma's E
                playSound('sounds/shomaa2.mp3');
            }
            // Update target UI
            updateCharacterUI(target);
        };
    },

    createDebuffEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects a single target
             if (Array.isArray(targetOrTargets)) {
                 console.warn(`[AbilityFactory] Debuff effect (${abilityData.name}) received an array, expects single target. Using first.`);
                 targetOrTargets = targetOrTargets[0];
             }
             const target = targetOrTargets;
             if (!target || typeof target.addDebuff !== 'function') {
                  console.error(`[AbilityFactory] Invalid target for debuff effect (${abilityData.name}):`, target);
                  return;
             }

            // --- MODIFICATION START: Read from abilityData.debuffEffect --- 
            const debuffDetails = abilityData.debuffEffect;
            if (!debuffDetails) {
                console.error(`[AbilityFactory] Missing 'debuffEffect' details in abilityData for ${abilityData.name}`);
                return; // Cannot create debuff without details
            }

            // Create the debuff effect using details from debuffDetails
            const debuff = new Effect(
                debuffDetails.debuffId || `debuff_${abilityData.name}_${Date.now()}`, // Use debuffId from details
                debuffDetails.name || abilityData.name, // Prefer debuff name, fallback to ability name
                abilityData.icon, // Icon usually comes from abilityData
                debuffDetails.duration || 3,
                null, // Per-turn effect logic handled elsewhere
                true // isDebuff = true
            );

            // Add description
            debuff.setDescription(debuffDetails.description || abilityData.description || `A negative effect from ${abilityData.name}.`);

             // Add stat modifiers if they exist in debuffDetails
             if (debuffDetails.statModifiers) {
                 debuff.statModifiers = { ...debuffDetails.statModifiers };
             }
             // Add custom effects/flags if they exist in debuffDetails
              if (debuffDetails.effects) {
                  debuff.effects = { ...debuffDetails.effects };
              }
              // Add DOT info if it exists in debuffDetails
               if (debuffDetails.damageOverTime) {
                   debuff.damageOverTime = debuffDetails.damageOverTime;
                   debuff.dotType = debuffDetails.dotType || 'magical';
               }
            // --- MODIFICATION END ---

            // Apply the debuff to the target
            target.addDebuff(debuff);
            addLogEntry(`${caster.name} used ${abilityData.name} on ${target.name}, applying ${debuff.name} for ${debuff.duration} turns.`);

             // Update target UI
             updateCharacterUI(target);
        };
    },

    createAoEDamageEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects an array of targets
             let targets = [];
             if (Array.isArray(targetOrTargets)) {
                 targets = targetOrTargets;
             } else if (targetOrTargets) {
                 console.warn(`[AbilityFactory] AoE Damage effect (${abilityData.name}) received single target, expected array. Wrapping.`);
                 targets = [targetOrTargets]; // Wrap single target in an array
             } 
 
             if (targets.length === 0) {
                 addLogEntry(`${caster.name} used ${abilityData.name}, but there were no valid targets.`);
                 return; // No targets to affect
             }
             
            // --- Corrected Damage Calculation ---
            const effectConfig = abilityData.effects.aoe_damage; // Access the nested config
            const damageType = effectConfig.damageType || 'magical'; // Read from effectConfig
            const statToUse = damageType === 'physical' ? 'physicalDamage' : 'magicalDamage';
            const statPercent = damageType === 'physical' ? effectConfig.physicalDamagePercent : effectConfig.magicalDamagePercent;
            
            let baseDamage = 0;
            // Add fixed amount if defined
            if (effectConfig.fixedAmount !== undefined) {
                baseDamage += Math.floor(effectConfig.fixedAmount);
            }
            // Add percentage amount if defined
            if (statPercent !== undefined) {
                const statValue = caster.stats[statToUse] || 0;
                baseDamage += Math.floor(statValue * statPercent);
            }
            // --- End Corrected Damage Calculation ---
            
            addLogEntry(`${caster.name} used ${abilityData.name}, targeting ${targets.length} enemies!`);
            
            let totalLifestealHeal = 0;
            let applyLifestealVFX = false;

            // Apply damage to all valid targets in the array
            targets.forEach(target => {
                if (!target || target.isDead() || typeof target.applyDamage !== 'function') return; 

                 // Apply critical hit check per target
                 let currentDamage = baseDamage; // Use the calculated baseDamage
                 let isCritical = false;
                 if (Math.random() < (caster.stats.critChance || 0)) {
                     currentDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
                     isCritical = true;
                 }
                
                 // Apply damage
                const result = target.applyDamage(currentDamage, damageType, caster);
                result.isCritical = isCritical || result.isCritical;
                
                 // Logging
                let message = `${target.name} takes ${result.damage} ${damageType} damage`;
                if (result.isCritical) message += " (Critical Hit!)";
                addLogEntry(message, result.isCritical ? 'critical' : '');

                // Accumulate lifesteal based on actual damage dealt to each target
                // Calculate lifesteal directly instead of calling a non-existent method
                const lifestealFromTarget = Math.floor((caster.stats.lifesteal || 0) * result.damage);
                 if (lifestealFromTarget > 0) {
                     totalLifestealHeal += lifestealFromTarget;
                     applyLifestealVFX = true; // Mark to apply VFX once after the loop
                 }
                
                // Apply Debuff from AoE effect (e.g., Infernal Birdie's stun)
                // Use the abilityData directly passed into createAoEDamageEffect
                if (!result.dodged && abilityData.stun && typeof abilityData.stun === 'object') {
                    const stunChance = abilityData.stun.chance || 0;
                    if (Math.random() < stunChance) {
                        const stunDuration = abilityData.stun.duration || 1;
                        const stunName = abilityData.stun.name || 'Stunned'; // Use provided name or fallback
                        const stunIcon = abilityData.stun.icon || 'Icons/effects/stun.png'; // Use provided icon or fallback

                        // --- MODIFICATION START: Use unique ID for Birdie's stun --- 
                        // Use a specific ID for Birdie's ability to identify it later
                        const isBirdieStun = (caster.id === 'infernal_birdie');
                        const stunDebuffId = isBirdieStun ? 'birdie_internal_stun' : (abilityData.stun.debuffId || 'generic_stun');
                        // --- MODIFICATION END ---

                        // Check if target is already stunned by this specific debuff
                        const existingStun = target.debuffs.find(d => d.id === stunDebuffId);
                        if (existingStun) {
                            // Refresh duration if needed, or just log that they are already stunned
                             // existingStun.duration = Math.max(existingStun.duration, stunDuration); // Option: Refresh to max duration
                             addLogEntry(`${target.name} is already stunned!`);
                        } else {
                            const debuff = new Effect(
                                stunDebuffId, // Use the potentially modified ID
                                stunName,
                                stunIcon,
                                stunDuration,
                                null, // Effects handled by processEffects or isStunned check
                                true  // isDebuff = true
                            );
                            // Add specific properties if needed for stun logic
                            // --- MODIFICATION: Ensure cantAct is set --- 
                            debuff.effects = { cantAct: true }; // Use cantAct for isStunned() check
                            // --- END MODIFICATION ---

                            target.addDebuff(debuff);
                            addLogEntry(`${caster.name}'s ${abilityData.name} stunned ${target.name} for ${stunDuration} turn!`, 'debuff');

                            // --- NEW: Trigger Caster's Lifesteal on Stun Passive ---
                            if (caster.passive && caster.passive.id === 'lifesteal_on_stun' && caster.passiveHandler && typeof caster.passiveHandler.onStunApplied === 'function') {
                                 caster.passiveHandler.onStunApplied(caster, target);
                            }
                            // --- END NEW ---
                        }
                    }
                }

                // Check if target died
                if (target.isDead()) {
                    addLogEntry(`${target.name} has been defeated!`);
                     // Optionally trigger caster's onKill passive
                     if (caster.passiveHandler && typeof caster.passiveHandler.onKill === 'function') {
                         caster.passiveHandler.onKill(caster, target);
                     }
                }
                 // Update target UI
                 updateCharacterUI(target);
            });
            
            // Apply accumulated lifesteal heal to caster once
             if (totalLifestealHeal > 0) {
                 const actualTotalHeal = caster.heal(totalLifestealHeal); // Apply the accumulated heal
                 addLogEntry(`${caster.name} healed for ${actualTotalHeal} from lifesteal.`);
                 // Apply VFX once if needed
                 if (applyLifestealVFX) {
                     const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                     if (casterElement && !casterElement.querySelector('.lifesteal-vfx')) { // Check if VFX isn't already there
                         const lifestealVfx = document.createElement('div');
                         lifestealVfx.className = 'lifesteal-vfx';
                         casterElement.appendChild(lifestealVfx);
                         const healNumber = document.createElement('div');
                         healNumber.className = 'lifesteal-heal-number';
                         healNumber.textContent = `+${actualTotalHeal}`; // Show the actual total heal
                         casterElement.appendChild(healNumber);
                         setTimeout(() => {
                             casterElement.querySelectorAll('.lifesteal-vfx, .lifesteal-heal-number').forEach(el => el.remove());
                         }, 1200);
                     }
                 }
             }
             // Update caster UI after potential lifesteal heal
             updateCharacterUI(caster);
        };
    },

    createAoEHealEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects an array of targets
             let targets = [];
             if (Array.isArray(targetOrTargets)) {
                 targets = targetOrTargets;
             } else if (targetOrTargets) {
                 console.warn(`[AbilityFactory] AoE Heal effect (${abilityData.name}) received single target, expected array. Wrapping.`);
                 targets = [targetOrTargets]; 
             }
 
             if (targets.length === 0) {
                 addLogEntry(`${caster.name} used ${abilityData.name}, but there were no valid targets.`);
                 return; 
             }
            
            const baseAmount = abilityData.amount || 1;
            const healAmount = Math.floor(baseAmount * (1 + (caster.stats.healingPower || 0)));
            let passiveTriggeredThisCast = false; 
            let totalActualHeal = 0;
            let healedTargetsList = [];
            
            addLogEntry(`${caster.name} used ${abilityData.name}, healing ${targets.length} allies!`);
            
            // Apply healing to all valid targets
            targets.forEach(target => {
                if (!target || target.isDead() || typeof target.heal !== 'function') return;

                const actualHeal = target.heal(healAmount);
                 if (actualHeal > 0) {
                     addLogEntry(`${target.name} is healed for ${actualHeal} HP.`, 'heal');
                     totalActualHeal += actualHeal;
                     healedTargetsList.push(target);
                     updateCharacterUI(target);
                 }
            });

             // Hook for passive handlers on dealing heal (AoE) - pass list of actually healed targets
             if (totalActualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                 caster.passiveHandler.onHealDealt(caster, healedTargetsList, totalActualHeal); // Pass array & total heal
             }
             // Update caster UI (in case passive affects caster)
             updateCharacterUI(caster);
        };
    },

    createLifestealEffect(abilityData) {
        return (caster, targetOrTargets) => {
             // This effect type expects a single target
             if (Array.isArray(targetOrTargets)) {
                 console.warn(`[AbilityFactory] Lifesteal effect (${abilityData.name}) received an array, expects single target. Using first.`);
                 targetOrTargets = targetOrTargets[0];
             }
             const target = targetOrTargets;
             if (!target || typeof target.applyDamage !== 'function') {
                  console.error(`[AbilityFactory] Invalid target for lifesteal effect (${abilityData.name}):`, target);
                  return; // Return an object indicating failure? Or just return?
             }

            const damageType = abilityData.damageType || 'physical';
            const statToUse = damageType === 'physical' ? 'physicalDamage' : 'magicalDamage';
            
            // Determine damage amount
            let damageAmount;
            if (abilityData.fixedDamage !== undefined) {
                damageAmount = Math.floor(abilityData.fixedDamage);
            } else {
                const multiplier = abilityData.amount || 1;
                 const statValue = caster.stats[statToUse] || 0;
                damageAmount = Math.floor(multiplier * statValue);
            }
            
            // Apply crit
            let isCritical = false;
            if (Math.random() < (caster.stats.critChance || 0)) {
                 damageAmount = Math.floor(damageAmount * (caster.stats.critDamage || 1.5));
                 isCritical = true;
            }

            // Apply damage to target
            const result = target.applyDamage(damageAmount, damageType, caster);
            result.isCritical = isCritical || result.isCritical;

            // Logging damage
            let message = `${caster.name} used ${abilityData.name} on ${target.name} for ${result.damage} ${damageType} damage`;
            if (result.isCritical) message += " (Critical Hit!)";
            addLogEntry(message, result.isCritical ? 'critical' : '');
            
            // Calculate lifesteal amount based on damage dealt
            // Use caster.stats.lifesteal if abilityData doesn't specify a percentage
            const lifestealPercent = abilityData.lifestealPercent !== undefined ? abilityData.lifestealPercent : (caster.stats.lifesteal || 0);
            const lifestealAmount = Math.floor(result.damage * lifestealPercent);
            
            // Apply heal to caster
            if (lifestealAmount > 0) {
                const actualHeal = caster.heal(lifestealAmount);
                addLogEntry(`${caster.name} healed for ${actualHeal} from lifesteal.`);
                
                // Add simple lifesteal VFX on the caster
                const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
                if (casterElement) {
                    const lifestealVfx = document.createElement('div');
                    lifestealVfx.className = 'lifesteal-vfx';
                    casterElement.appendChild(lifestealVfx);
                    const healNumber = document.createElement('div');
                    healNumber.className = 'lifesteal-heal-number';
                    healNumber.textContent = `+${actualHeal}`;
                    casterElement.appendChild(healNumber);
                    setTimeout(() => {
                        casterElement.querySelectorAll('.lifesteal-vfx, .lifesteal-heal-number').forEach(el => el.remove());
                    }, 1200);
                }
            }
            
            // Check for Elphelt crit sound
            if (result.isCritical && caster.id === 'schoolgirl_elphelt') {
                 const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                 playSound('sounds/elphelt_go.mp3');
            }

             // Check if target died
             if (target.isDead()) {
                 addLogEntry(`${target.name} has been defeated!`);
             }

             // Update UIs
             updateCharacterUI(caster);
             updateCharacterUI(target);
             
            // Return damage info if needed by specific abilities
            return {
                damage: result.damage,
                isCritical: result.isCritical
            };
        };
    }
}; 