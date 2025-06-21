// Passive handler for Schoolgirl Elphelt: Defensive Maneuvers

class SchoolgirlElpheltPassive {
    constructor() {
        this.character = null;
        this.buffId = 'schoolgirl_elphelt_passive_buff';
        this.buffName = 'Defensive Maneuvers';
        this.buffIcon = 'Icons/abilities/defensive_stance.webp';
        this.duration = 3;
        this.armorBonus = 5;
        this.shieldBonus = 5;
        this.baseDescription = 'After using any ability, gain +5 Armor and +5 Magical Shield for 3 turns. Stacks with multiple uses.';
        
        // Stalwart Defense properties
        this.stalwartDefense = false; // Will be enabled by talent
        this.stalwartDefenseThreshold = 0.55; // 55% HP threshold
        this.stalwartDefenseBuffId = 'stalwart_defense_buff';
        this.stalwartDefenseActive = false;
        
        // Defensive Recovery properties
        this.defensiveRecovery = false; // Will be enabled by talent
        this.defensiveRecoveryAmount = 248;
        
        // Protective Bond properties
        this.protectiveBond = false; // Will be enabled by talent
        this.protectiveBondApplied = false; // Tracks if it's already been applied
        
        // Ultimate Sacrifice properties
        this.ultimateSacrifice = false; // Will be enabled by talent
        this.ultimateSacrificeHealAmount = 3000;
        this.ultimateSacrificeUsed = false; // Tracks if it's already been used this battle
        
        console.log('[SchoolgirlElpheltPassive] Constructor called');
        
        // Bind the event handlers to maintain proper context
        this._boundOnAbilityUsed = this.onAbilityUsed.bind(this);
        this._boundOnDamageTaken = this.onDamageTaken.bind(this);
    }

    initialize(character) {
        this.character = character;
        console.log(`[SchoolgirlElpheltPassive] Initialized for ${character.name}`);
        
        // Store instance globally for description updates
        if (typeof window !== 'undefined') {
            window.schoolgirlElpheltPassiveInstance = this;
        }
        
        // Add event listener for ability usage
        document.addEventListener('AbilityUsed', this._boundOnAbilityUsed);
        console.log('[SchoolgirlElpheltPassive] Added AbilityUsed event listener');
        
        // Add HP monitoring for Stalwart Defense and Defensive Recovery
        this._boundOnHPChange = this.onHPChange.bind(this);
        document.addEventListener('CharacterDamaged', this._boundOnHPChange);
        document.addEventListener('CharacterHealed', this._boundOnHPChange);
        console.log('[SchoolgirlElpheltPassive] Added HP monitoring event listeners');
        
        // Add damage taken listener for Defensive Recovery
        document.addEventListener('CharacterDamaged', this._boundOnDamageTaken);
        console.log('[SchoolgirlElpheltPassive] Added Defensive Recovery damage listener');
        
        // Add GameStart listener for Protective Bond
        this._boundOnGameStart = this.onGameStart.bind(this);
        document.addEventListener('GameStart', this._boundOnGameStart);
        console.log('[SchoolgirlElpheltPassive] Added GameStart event listener for Protective Bond');
        
        // Add Ultimate Sacrifice damage interception
        this._boundOnDamageInterception = this.onDamageInterception.bind(this);
        document.addEventListener('CharacterWouldDie', this._boundOnDamageInterception);
        console.log('[SchoolgirlElpheltPassive] Added CharacterWouldDie event listener for Ultimate Sacrifice');
        
        // Also check for Protective Bond immediately in case GameStart already fired
        setTimeout(() => {
            this.checkAndApplyProtectiveBond();
        }, 100);
        
        // Add additional delayed checks to ensure it catches the event
        setTimeout(() => {
            this.checkAndApplyProtectiveBond();
        }, 500);
        
        setTimeout(() => {
            this.checkAndApplyProtectiveBond();
        }, 1500);
        
        // Check for Stalwart Defense talent and initialize it
        this.checkStalwartDefense();
    }

    cleanup() {
        // Remove event listeners when passive is cleaned up
        if (this._boundOnAbilityUsed) {
            document.removeEventListener('AbilityUsed', this._boundOnAbilityUsed);
            console.log('[SchoolgirlElpheltPassive] Removed AbilityUsed event listener');
        }
        
        // Remove HP monitoring event listeners
        if (this._boundOnHPChange) {
            document.removeEventListener('CharacterDamaged', this._boundOnHPChange);
            document.removeEventListener('CharacterHealed', this._boundOnHPChange);
            console.log('[SchoolgirlElpheltPassive] Removed HP monitoring event listeners');
        }
        
        // Remove damage taken listener
        if (this._boundOnDamageTaken) {
            document.removeEventListener('CharacterDamaged', this._boundOnDamageTaken);
            console.log('[SchoolgirlElpheltPassive] Removed Defensive Recovery damage listener');
        }
        
        // Remove GameStart listener
        if (this._boundOnGameStart) {
            document.removeEventListener('GameStart', this._boundOnGameStart);
            console.log('[SchoolgirlElpheltPassive] Removed GameStart event listener');
        }
        
        // Remove Ultimate Sacrifice listener
        if (this._boundOnDamageInterception) {
            document.removeEventListener('CharacterWouldDie', this._boundOnDamageInterception);
            console.log('[SchoolgirlElpheltPassive] Removed CharacterWouldDie event listener');
        }
        
        // Remove stalwart defense buff if active
        if (this.stalwartDefenseActive && this.character) {
            this.character.removeBuff(this.stalwartDefenseBuffId);
        }
    }

    // Helper method to check and apply Protective Bond
    checkAndApplyProtectiveBond() {
        if (!this.character) {
            console.log('[SchoolgirlElpheltPassive] checkAndApplyProtectiveBond: No character, skipping');
            return;
        }
        
        console.log(`[SchoolgirlElpheltPassive] Checking Protective Bond for ${this.character.name}`);
        console.log(`[SchoolgirlElpheltPassive] Character applied talents:`, this.character.appliedTalents);
        console.log(`[SchoolgirlElpheltPassive] Protective Bond already applied:`, this.protectiveBondApplied);
        
        // Check for Protective Bond talent and apply it
        const hasProtectiveBond = this.character.appliedTalents && this.character.appliedTalents.includes('protective_bond');
        
        console.log(`[SchoolgirlElpheltPassive] Has Protective Bond talent:`, hasProtectiveBond);
        
        if (hasProtectiveBond && !this.protectiveBondApplied) {
            console.log(`[SchoolgirlElpheltPassive] Protective Bond talent detected for ${this.character.name} - applying now`);
            this.applyProtectiveBond();
        } else if (hasProtectiveBond && this.protectiveBondApplied) {
            console.log(`[SchoolgirlElpheltPassive] Protective Bond already applied for ${this.character.name}, skipping`);
        } else if (!hasProtectiveBond) {
            console.log(`[SchoolgirlElpheltPassive] ${this.character.name} does not have Protective Bond talent`);
        }
    }

    // Event handler for GameStart (Protective Bond)
    onGameStart(event) {
        console.log(`[SchoolgirlElpheltPassive] GameStart event received`);
        this.checkAndApplyProtectiveBond();
    }

    // Event handler for Ultimate Sacrifice damage interception
    onDamageInterception(event) {
        if (!event.detail || !this.character) {
            return;
        }
        
        const { character, finalDamage, originalDamage, damageType, caster } = event.detail;
        
        // Check if Ultimate Sacrifice talent is active and not yet used
        const hasUltimateSacrifice = (this.character.appliedTalents && this.character.appliedTalents.includes('ultimate_sacrifice')) || this.ultimateSacrifice;
        
        console.log(`[UltimateSacrifice] Event received for ${character.name}. Has talent: ${hasUltimateSacrifice}, Used: ${this.ultimateSacrificeUsed}`);
        
        if (!hasUltimateSacrifice || this.ultimateSacrificeUsed) {
            return;
        }
        
        // Check if the dying character is an ally (same team as Elphelt)
        const isAlly = !this.character.isEnemy(character);
        
        // Check if the dying character is not Elphelt herself
        if (character === this.character || !isAlly) {
            console.log(`[UltimateSacrifice] Not triggering - character is self or enemy. Character: ${character.name}, Is self: ${character === this.character}, Is ally: ${isAlly}`);
            return;
        }
        
        console.log(`[UltimateSacrifice] Ultimate Sacrifice triggered! ${this.character.name} will save ${character.name}`);
        
        // Prevent the death
        event.detail.prevented = true;
        event.preventDefault();
        
        // Trigger Ultimate Sacrifice
        this.triggerUltimateSacrifice(character, finalDamage, damageType, caster, event);
    }

    // Event handler for damage taken (Defensive Recovery)
    onDamageTaken(event) {
        if (!event.detail || !this.character) {
            return;
        }
        
        const { character, damage, damageType } = event.detail;
        
        // Check if this is our character taking damage
        if (character !== this.character) {
            return;
        }
        
        console.log(`[SchoolgirlElpheltPassive] ${character.name} took ${damage} damage, checking Defensive Recovery`);
        
        // Check if Defensive Recovery talent is active (either via appliedTalents or property)
        const hasDefensiveRecovery = (this.character.appliedTalents && this.character.appliedTalents.includes('defensive_recovery')) || this.defensiveRecovery;
        
        if (hasDefensiveRecovery && damage > 0) {
            console.log(`[SchoolgirlElpheltPassive] ${this.character.name} Defensive Recovery triggered!`);
            this.triggerDefensiveRecovery(character, damage);
        } else {
            console.log(`[SchoolgirlElpheltPassive] Defensive Recovery not triggered. HasTalent: ${hasDefensiveRecovery}, Damage: ${damage}, DefensiveRecovery property: ${this.defensiveRecovery}`);
        }
    }

    // Trigger Defensive Recovery healing
    triggerDefensiveRecovery(character, damageTaken) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        log(`${character.name}'s Defensive Recovery activates! Training kicks in to heal wounds.`);
        
        // Heal the character
        const healResult = character.heal(this.defensiveRecoveryAmount, character, { abilityId: 'defensive_recovery_healing' });
        
        if (healResult.actualAmount > 0) {
            log(`${character.name} recovers ${healResult.actualAmount} HP from Defensive Recovery.`);
            
            // Show VFX for defensive recovery
            this.showDefensiveRecoveryVFX(character, healResult.actualAmount);
            
            // === STATISTICS TRACKING ===
            if (typeof trackDefensiveRecoveryStats === 'function') {
                trackDefensiveRecoveryStats(character, healResult.actualAmount, damageTaken);
            } else if (window.statisticsManager) {
                // Fallback tracking if global function not available
                try {
                    // Track defensive recovery healing
                    window.statisticsManager.recordHealingDone(character, healResult.actualAmount, 'defensive_recovery_healing');
                    
                    // Track passive usage
                    window.statisticsManager.recordAbilityUsage(character, 'defensive_recovery', 'healing', healResult.actualAmount, false);
                    
                    console.log(`[ElpheltPassiveStats] Tracked Defensive Recovery: ${healResult.actualAmount} HP healed`);
                } catch (error) {
                    console.error('[ElpheltPassiveStats] Error tracking Defensive Recovery stats:', error);
                }
            }
            // === END STATISTICS TRACKING ===
        }
    }

    // Trigger Ultimate Sacrifice
    triggerUltimateSacrifice(allyCharacter, fatalDamage, damageType, originalCaster, originalEvent) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Mark Ultimate Sacrifice as used
        this.ultimateSacrificeUsed = true;
        
        // Calculate double damage for Elphelt
        const sacrificeDamage = fatalDamage * 2;
        
        log(`💔 ${this.character.name}'s Ultimate Sacrifice activates! Love conquers death itself!`);
        log(`⚡ ${this.character.name} intercepts the fatal blow meant for ${allyCharacter.name}!`);
        
        // Set ally to 1 HP to prevent death (since death was already prevented by event handler)
        allyCharacter.stats.currentHp = Math.max(1, allyCharacter.stats.currentHp);
        
        // Force UI update to show they're alive
        if (window.gameManager && typeof window.gameManager.updateCharacterDisplay === 'function') {
            window.gameManager.updateCharacterDisplay(allyCharacter);
        }
        
        // Heal the ally immediately
        const healResult = allyCharacter.heal(this.ultimateSacrificeHealAmount, this.character, { abilityId: 'ultimate_sacrifice_healing' });
        
        if (healResult.actualAmount > 0) {
            log(`💚 ${allyCharacter.name} is saved and healed for ${healResult.actualAmount} HP by Elphelt's ultimate love!`);
        }
        
        // Show VFX for the sacrifice
        this.showUltimateSacrificeVFX(this.character, allyCharacter, sacrificeDamage, healResult.actualAmount);
        
        // Elphelt takes double damage after a brief delay to show the sacrifice VFX
        setTimeout(() => {
            const damageResult = this.character.applyDamage(sacrificeDamage, damageType, originalCaster, { 
                abilityId: 'ultimate_sacrifice_damage',
                isUltimateSacrifice: true,
                bypassDodge: true // Cannot dodge this sacrifice damage
            });
            
            if (damageResult.actualAmount > 0) {
                log(`💔 ${this.character.name} sacrifices herself, taking ${damageResult.actualAmount} damage for love!`);
            }
            
            // === STATISTICS TRACKING ===
            if (typeof trackUltimateSacrificeStats === 'function') {
                trackUltimateSacrificeStats(this.character, allyCharacter, sacrificeDamage, healResult.actualAmount);
            } else if (window.statisticsManager) {
                // Fallback tracking
                try {
                    // Track the healing done to ally
                    window.statisticsManager.recordHealingDone(this.character, healResult.actualAmount, 'ultimate_sacrifice_healing');
                    
                    // Track the damage taken by Elphelt
                    window.statisticsManager.recordDamageTaken(this.character, damageResult.actualAmount, 'ultimate_sacrifice_damage');
                    
                    // Track passive usage
                    window.statisticsManager.recordAbilityUsage(this.character, 'ultimate_sacrifice', 'sacrifice', sacrificeDamage + healResult.actualAmount, false);
                    
                    console.log(`[ElpheltPassiveStats] Tracked Ultimate Sacrifice: ${healResult.actualAmount} HP healed, ${damageResult.actualAmount} damage taken`);
                } catch (error) {
                    console.error('[ElpheltPassiveStats] Error tracking Ultimate Sacrifice stats:', error);
                }
            }
            // === END STATISTICS TRACKING ===
            
        }, 1500); // Delay the damage to show the sacrifice sequence
    }

    // Visual effects for Defensive Recovery
    showDefensiveRecoveryVFX(character, healAmount) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        // Create defensive recovery container
        const recoveryContainer = document.createElement('div');
        recoveryContainer.className = 'defensive-recovery-vfx-container';
        recoveryContainer.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 10;
            pointer-events: none;
        `;
        characterElement.appendChild(recoveryContainer);

        // Create healing aura
        const healingAura = document.createElement('div');
        healingAura.className = 'defensive-recovery-aura';
        healingAura.style.cssText = `
            position: absolute;
            top: -20px; left: -20px; right: -20px; bottom: -20px;
            background: radial-gradient(circle, rgba(0, 255, 127, 0.4) 0%, rgba(50, 205, 50, 0.3) 40%, transparent 70%);
            border-radius: 50%;
            animation: defensiveRecoveryAuraPulse 3s ease-out forwards;
            z-index: 8;
        `;
        recoveryContainer.appendChild(healingAura);

        // Create healing particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'defensive-recovery-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #00ff7f 0%, #32cd32 100%);
                border-radius: 50%;
                top: ${20 + Math.random() * 60}%;
                left: ${20 + Math.random() * 60}%;
                animation: defensiveRecoveryParticleFloat 2.5s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                z-index: 9;
            `;
            recoveryContainer.appendChild(particle);
        }

        // Create healing waves
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'defensive-recovery-wave';
            wave.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border: 2px solid rgba(0, 255, 127, 0.6);
                border-radius: 50%;
                animation: defensiveRecoveryWaveExpand 2s ease-out forwards;
                animation-delay: ${i * 0.3}s;
                z-index: 8;
            `;
            recoveryContainer.appendChild(wave);
        }

        // Create floating healing text
        const healingText = document.createElement('div');
        healingText.className = 'defensive-recovery-text';
        healingText.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            color: #00ff7f;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 8px rgba(0, 255, 127, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.6);
            white-space: nowrap;
            animation: defensiveRecoveryTextFloat 3s ease-out forwards;
            z-index: 11;
        `;
        healingText.innerHTML = `⚕️ +${healAmount} Recovery!`;
        recoveryContainer.appendChild(healingText);

        // Create energy restoration effect
        const energyRestoration = document.createElement('div');
        energyRestoration.className = 'defensive-recovery-energy';
        energyRestoration.style.cssText = `
            position: absolute;
            top: 30%; left: 30%; right: 30%; bottom: 30%;
            background: linear-gradient(45deg, rgba(0, 255, 127, 0.3), rgba(50, 205, 50, 0.2), rgba(0, 255, 127, 0.3));
            border-radius: 50%;
            animation: defensiveRecoveryEnergyPulse 2s ease-out forwards;
            z-index: 7;
        `;
        recoveryContainer.appendChild(energyRestoration);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (recoveryContainer.parentNode) {
                recoveryContainer.remove();
            }
        }, 3000);
        
        // Add character glow effect
        characterElement.classList.add('defensive-recovery-glow');
        setTimeout(() => {
            characterElement.classList.remove('defensive-recovery-glow');
        }, 2500);
    }

    // Visual effects for Ultimate Sacrifice
    showUltimateSacrificeVFX(sacrificer, savedAlly, damageAmount, healAmount) {
        const sacrificerElement = document.getElementById(`character-${sacrificer.instanceId || sacrificer.id}`);
        const allyElement = document.getElementById(`character-${savedAlly.instanceId || savedAlly.id}`);
        if (!sacrificerElement || !allyElement) return;

        // Create the ultimate sacrifice container
        const sacrificeContainer = document.createElement('div');
        sacrificeContainer.className = 'ultimate-sacrifice-vfx-container';
        sacrificeContainer.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 20;
            pointer-events: none;
        `;
        document.body.appendChild(sacrificeContainer);

        // Create dramatic screen flash
        const screenFlash = document.createElement('div');
        screenFlash.className = 'ultimate-sacrifice-screen-flash';
        screenFlash.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(255, 20, 147, 0.4) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
            animation: ultimateSacrificeFlash 2s ease-out forwards;
            z-index: 19;
        `;
        sacrificeContainer.appendChild(screenFlash);

        // Calculate beam path
        const sacrificerRect = sacrificerElement.getBoundingClientRect();
        const allyRect = allyElement.getBoundingClientRect();
        const sacrificerX = sacrificerRect.left + sacrificerRect.width / 2;
        const sacrificerY = sacrificerRect.top + sacrificerRect.height / 2;
        const allyX = allyRect.left + allyRect.width / 2;
        const allyY = allyRect.top + allyRect.height / 2;

        // Create love beam from sacrificer to ally
        const loveBeam = document.createElement('div');
        loveBeam.className = 'ultimate-sacrifice-love-beam';
        loveBeam.style.cssText = `
            position: absolute;
            left: ${sacrificerX}px;
            top: ${sacrificerY}px;
            width: 8px;
            height: ${Math.sqrt((allyX - sacrificerX) ** 2 + (allyY - sacrificerY) ** 2)}px;
            background: linear-gradient(to bottom, 
                rgba(255, 20, 147, 0.9) 0%, 
                rgba(255, 255, 255, 0.8) 50%, 
                rgba(255, 20, 147, 0.9) 100%);
            transform-origin: top center;
            transform: rotate(${Math.atan2(allyY - sacrificerY, allyX - sacrificerX) * 180 / Math.PI + 90}deg);
            box-shadow: 0 0 20px rgba(255, 20, 147, 0.8), 0 0 40px rgba(255, 20, 147, 0.6);
            animation: ultimateSacrificeLoveBeam 3s ease-out forwards;
            z-index: 16;
        `;
        sacrificeContainer.appendChild(loveBeam);

        // Create sacrifice aura on Elphelt
        const sacrificeAura = document.createElement('div');
        sacrificeAura.className = 'ultimate-sacrifice-aura';
        sacrificeAura.style.cssText = `
            position: absolute;
            top: -30px; left: -30px; right: -30px; bottom: -30px;
            background: radial-gradient(circle, rgba(255, 20, 147, 0.6) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%);
            border-radius: 50%;
            animation: ultimateSacrificeAura 4s ease-out forwards;
            z-index: 8;
        `;
        sacrificerElement.appendChild(sacrificeAura);

        // Create salvation light on ally
        const salvationLight = document.createElement('div');
        salvationLight.className = 'ultimate-sacrifice-salvation';
        salvationLight.style.cssText = `
            position: absolute;
            top: -25px; left: -25px; right: -25px; bottom: -25px;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.7) 0%, rgba(255, 255, 255, 0.5) 30%, transparent 60%);
            border-radius: 50%;
            animation: ultimateSacrificeSalvation 4s ease-out forwards;
            z-index: 8;
        `;
        allyElement.appendChild(salvationLight);

        // Create love particles flowing from sacrificer to ally
        for (let i = 0; i < 12; i++) {
            const loveParticle = document.createElement('div');
            loveParticle.className = 'ultimate-sacrifice-love-particle';
            loveParticle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #ff1493 0%, #ffffff 100%);
                border-radius: 50%;
                left: ${sacrificerX}px;
                top: ${sacrificerY}px;
                animation: ultimateSacrificeLoveParticle 3s ease-out forwards;
                animation-delay: ${i * 0.15}s;
                z-index: 17;
            `;
            loveParticle.style.setProperty('--target-x', `${allyX}px`);
            loveParticle.style.setProperty('--target-y', `${allyY}px`);
            sacrificeContainer.appendChild(loveParticle);
        }

        // Create sacrifice text on Elphelt
        const sacrificeText = document.createElement('div');
        sacrificeText.className = 'ultimate-sacrifice-text';
        sacrificeText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff1493;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 0 8px rgba(255, 20, 147, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: ultimateSacrificeTextFloat 4s ease-out forwards;
            z-index: 10;
        `;
        sacrificeText.innerHTML = `💔 Ultimate Sacrifice!`;
        sacrificerElement.appendChild(sacrificeText);

        // Create salvation text on ally
        const salvationText = document.createElement('div');
        salvationText.className = 'ultimate-sacrifice-salvation-text';
        salvationText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 6px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: ultimateSacrificeSalvationText 4s ease-out forwards;
            z-index: 10;
        `;
        salvationText.innerHTML = `✨ Saved! +${healAmount} HP`;
        allyElement.appendChild(salvationText);

        // Create energy explosion around both characters
        const energyExplosion = document.createElement('div');
        energyExplosion.className = 'ultimate-sacrifice-energy-explosion';
        energyExplosion.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(255, 20, 147, 0.8) 0%, rgba(255, 255, 255, 0.6) 30%, transparent 70%);
            border-radius: 50%;
            animation: ultimateSacrificeEnergyExplosion 2.5s ease-out forwards;
            z-index: 15;
        `;
        
        // Position explosion between sacrificer and ally
        const midX = (sacrificerX + allyX) / 2;
        const midY = (sacrificerY + allyY) / 2;
        energyExplosion.style.left = `${midX}px`;
        energyExplosion.style.top = `${midY}px`;
        sacrificeContainer.appendChild(energyExplosion);

        // Create spiral energy waves
        for (let i = 0; i < 6; i++) {
            const energyWave = document.createElement('div');
            energyWave.className = 'ultimate-sacrifice-energy-wave';
            energyWave.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                border: 3px solid rgba(255, 20, 147, 0.6);
                border-radius: 50%;
                animation: ultimateSacrificeEnergyWave 3s ease-out forwards;
                animation-delay: ${i * 0.2}s;
                z-index: 14;
            `;
            energyExplosion.appendChild(energyWave);
        }

        // Remove all VFX after animation completes
        setTimeout(() => {
            if (sacrificeContainer.parentNode) sacrificeContainer.remove();
            if (sacrificeAura.parentNode) sacrificeAura.remove();
            if (salvationLight.parentNode) salvationLight.remove();
            if (sacrificeText.parentNode) sacrificeText.remove();
            if (salvationText.parentNode) salvationText.remove();
        }, 4500);

        // Add character glow effects
        sacrificerElement.classList.add('ultimate-sacrifice-sacrificer-glow');
        allyElement.classList.add('ultimate-sacrifice-ally-glow');
        setTimeout(() => {
            sacrificerElement.classList.remove('ultimate-sacrifice-sacrificer-glow');
            allyElement.classList.remove('ultimate-sacrifice-ally-glow');
        }, 4000);

        // Add screen shake effect
        if (document.querySelector('.battle-container')) {
            document.querySelector('.battle-container').classList.add('ultimate-sacrifice-shake');
            setTimeout(() => {
                document.querySelector('.battle-container').classList.remove('ultimate-sacrifice-shake');
            }, 3000);
        }
    }

    // Visual effects for Protective Bond
    showProtectiveBondVFX(caster, target) {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!casterElement || !targetElement) return;

        // Create protective bond beam from caster to target
        const bondBeam = document.createElement('div');
        bondBeam.className = 'protective-bond-beam';
        bondBeam.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 15;
            pointer-events: none;
        `;
        document.body.appendChild(bondBeam);

        // Calculate beam path
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const casterX = casterRect.left + casterRect.width / 2;
        const casterY = casterRect.top + casterRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const beam = document.createElement('div');
        beam.className = 'bond-connection-beam';
        beam.style.cssText = `
            position: absolute;
            left: ${casterX}px;
            top: ${casterY}px;
            width: 4px;
            height: ${Math.sqrt((targetX - casterX) ** 2 + (targetY - casterY) ** 2)}px;
            background: linear-gradient(to bottom, 
                rgba(255, 215, 0, 0.9) 0%, 
                rgba(255, 255, 255, 0.7) 50%, 
                rgba(255, 215, 0, 0.9) 100%);
            transform-origin: top center;
            transform: rotate(${Math.atan2(targetY - casterY, targetX - casterX) * 180 / Math.PI + 90}deg);
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
            animation: protectiveBondBeamFlow 2s ease-out forwards;
        `;
        bondBeam.appendChild(beam);

        // Create bond particles flowing from caster to target
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'protective-bond-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #ffd700 0%, #ffffff 100%);
                border-radius: 50%;
                left: ${casterX}px;
                top: ${casterY}px;
                animation: protectiveBondParticleFlow 2s ease-out forwards;
                animation-delay: ${i * 0.2}s;
                z-index: 16;
            `;
            particle.style.setProperty('--target-x', `${targetX}px`);
            particle.style.setProperty('--target-y', `${targetY}px`);
            bondBeam.appendChild(particle);
        }

        // Create protective aura on caster
        const casterAura = document.createElement('div');
        casterAura.className = 'protective-bond-caster-aura';
        casterAura.style.cssText = `
            position: absolute;
            top: -20px; left: -20px; right: -20px; bottom: -20px;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
            border-radius: 50%;
            animation: protectiveBondCasterAura 3s ease-out forwards;
            z-index: 8;
        `;
        casterElement.appendChild(casterAura);

        // Create protective enhancement on target
        const targetAura = document.createElement('div');
        targetAura.className = 'protective-bond-target-aura';
        targetAura.style.cssText = `
            position: absolute;
            top: -15px; left: -15px; right: -15px; bottom: -15px;
            background: radial-gradient(circle, rgba(65, 105, 225, 0.5) 0%, rgba(0, 191, 255, 0.3) 50%, transparent 70%);
            border-radius: 50%;
            animation: protectiveBondTargetAura 3s ease-out forwards;
            z-index: 8;
        `;
        targetElement.appendChild(targetAura);

        // Create floating text for caster
        const casterText = document.createElement('div');
        casterText.className = 'protective-bond-caster-text';
        casterText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(255, 215, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: protectiveBondTextFloat 3s ease-out forwards;
            z-index: 9;
        `;
        casterText.innerHTML = `Protective Bond`;
        casterElement.appendChild(casterText);

        // Create floating text for target
        const targetText = document.createElement('div');
        targetText.className = 'protective-bond-target-text';
        targetText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #4169e1;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(65, 105, 225, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: protectiveBondTextFloat 3s ease-out forwards;
            z-index: 9;
        `;
        targetText.innerHTML = `+${this.armorBonus} ARM +${this.shieldBonus} MS`;
        targetElement.appendChild(targetText);

        // Remove all VFX after animation completes
        setTimeout(() => {
            if (bondBeam.parentNode) bondBeam.remove();
            if (casterAura.parentNode) casterAura.remove();
            if (targetAura.parentNode) targetAura.remove();
            if (casterText.parentNode) casterText.remove();
            if (targetText.parentNode) targetText.remove();
        }, 3000);

        // Add glow effects to both characters
        casterElement.classList.add('protective-bond-caster-glow');
        targetElement.classList.add('protective-bond-target-glow');
        setTimeout(() => {
            casterElement.classList.remove('protective-bond-caster-glow');
            targetElement.classList.remove('protective-bond-target-glow');
        }, 2500);
    }

    // Event handler for AbilityUsed events
    onAbilityUsed(event) {
        if (!event.detail || !this.character) {
            return;
        }
        
        const { caster, ability } = event.detail;
        
        // Check if this is our character casting an ability
        if (caster !== this.character) {
            return;
        }
        
        console.log(`[SchoolgirlElpheltPassive] ${this.character.name} used ${ability.name}, triggering passive`);
        
        // Trigger the defensive maneuvers effect
        this.triggerDefensiveManeuvers(caster, ability);
    }

    // Event handler for HP changes (for Stalwart Defense monitoring)
    onHPChange(event) {
        if (!event.detail || !this.character) {
            return;
        }
        
        const { character } = event.detail;
        
        // Check if this is our character
        if (character !== this.character) {
            return;
        }
        
        console.log(`[SchoolgirlElpheltPassive] ${this.character.name} HP changed, checking Stalwart Defense`);
        
        // Update Stalwart Defense based on new HP
        this.updateStalwartDefense();
    }

    // Check for Stalwart Defense talent
    checkStalwartDefense() {
        if (!this.character) return;
        
        const hasStalwartDefense = this.character.appliedTalents && this.character.appliedTalents.includes('stalwart_defense');
        
        if (hasStalwartDefense) {
            console.log(`[SchoolgirlElpheltPassive] Stalwart Defense talent detected for ${this.character.name}`);
            this.updateStalwartDefense();
        }
    }

    // Update Stalwart Defense based on current HP
    updateStalwartDefense() {
        if (!this.character) return;
        
        const hasStalwartDefense = this.character.appliedTalents && this.character.appliedTalents.includes('stalwart_defense');
        if (!hasStalwartDefense) return;
        
        const hpPercentage = this.character.stats.currentHp / this.character.stats.maxHp;
        const threshold = 0.55; // 55% HP threshold
        
        const shouldHaveBuff = hpPercentage > threshold;
        
        if (shouldHaveBuff && !this.stalwartDefenseActive) {
            // Apply Stalwart Defense buff
            this.applyStalwartDefense();
        } else if (!shouldHaveBuff && this.stalwartDefenseActive) {
            // Remove Stalwart Defense buff
            this.removeStalwartDefense();
        }
    }



    // Apply Protective Bond to a random ally
    applyProtectiveBond() {
        if (!this.character || this.protectiveBondApplied) {
            console.log(`[SchoolgirlElpheltPassive] applyProtectiveBond: Character missing (${!this.character}) or already applied (${this.protectiveBondApplied})`);
            return;
        }
        
        console.log(`[SchoolgirlElpheltPassive] Starting Protective Bond application for ${this.character.name}`);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Get all allies (team members excluding self)
        const allAllies = [];
        
        console.log(`[SchoolgirlElpheltPassive] Character isAI:`, this.character.isAI);
        
        // Try multiple methods to get characters
        let playerCharacters = [];
        let aiCharacters = [];
        
        // Method 1: From gameManager
        if (window.gameManager) {
            if (window.gameManager.playerCharacters) {
                playerCharacters = window.gameManager.playerCharacters;
                console.log(`[SchoolgirlElpheltPassive] Found ${playerCharacters.length} player characters via gameManager.playerCharacters`);
            }
            if (window.gameManager.aiCharacters) {
                aiCharacters = window.gameManager.aiCharacters;
                console.log(`[SchoolgirlElpheltPassive] Found ${aiCharacters.length} AI characters via gameManager.aiCharacters`);
            }
            
            // Method 2: From gameState
            if (window.gameManager.gameState) {
                if (window.gameManager.gameState.playerCharacters && playerCharacters.length === 0) {
                    playerCharacters = window.gameManager.gameState.playerCharacters;
                    console.log(`[SchoolgirlElpheltPassive] Found ${playerCharacters.length} player characters via gameState`);
                }
                if (window.gameManager.gameState.aiCharacters && aiCharacters.length === 0) {
                    aiCharacters = window.gameManager.gameState.aiCharacters;
                    console.log(`[SchoolgirlElpheltPassive] Found ${aiCharacters.length} AI characters via gameState`);
                }
            }
        }
        
        // Build allies list based on character type
        if (this.character.isAI) {
            // If Elphelt is AI, allies are other AI characters
            const aiAllies = aiCharacters.filter(char => char !== this.character && !char.isDead());
            allAllies.push(...aiAllies);
            console.log(`[SchoolgirlElpheltPassive] AI Elphelt found ${aiAllies.length} AI allies:`, aiAllies.map(c => c.name));
        } else {
            // If Elphelt is player, allies are other player characters
            const playerAllies = playerCharacters.filter(char => char !== this.character && !char.isDead());
            allAllies.push(...playerAllies);
            console.log(`[SchoolgirlElpheltPassive] Player Elphelt found ${playerAllies.length} player allies:`, playerAllies.map(c => c.name));
        }
        
        console.log(`[SchoolgirlElpheltPassive] Total allies found:`, allAllies.length, allAllies.map(c => c.name));
        
        if (allAllies.length === 0) {
            console.log('[SchoolgirlElpheltPassive] No allies found for Protective Bond - retrying in 1 second');
            // Try again after a delay in case characters aren't loaded yet
            setTimeout(() => {
                if (!this.protectiveBondApplied) {
                    console.log('[SchoolgirlElpheltPassive] Retrying Protective Bond application...');
                    this.applyProtectiveBond();
                }
            }, 1000);
            return;
        }
        
        // Select random ally
        const randomAlly = allAllies[Math.floor(Math.random() * allAllies.length)];
        
        log(`${this.character.name}'s Protective Bond activates! ${randomAlly.name} gains permanent Defensive Maneuvers.`);
        
        // Create permanent Defensive Maneuvers buff
        const protectiveBuff = new Effect(
            'protective_bond_defensive_maneuvers',
            'Protective Bond (Defensive Maneuvers)',
            'Icons/abilities/defensive_stance.webp',
            999, // Permanent until removed
            null,
            false
        );
        
        // Set stat modifiers for the buff
        protectiveBuff.statModifiers = [
            { stat: 'armor', value: this.armorBonus, operation: 'add' },
            { stat: 'magicalShield', value: this.shieldBonus, operation: 'add' }
        ];
        
        protectiveBuff.setDescription(`Protective Bond: +${this.armorBonus} Armor, +${this.shieldBonus} Magical Shield (permanent).`);
        
        // Define remove behavior
        protectiveBuff.remove = (character) => {
            log(`${character.name}'s Protective Bond fades.`);
        };
        
        randomAlly.addBuff(protectiveBuff);
        this.protectiveBondApplied = true;
        
        console.log(`[SchoolgirlElpheltPassive] Protective Bond applied to ${randomAlly.name}`);
    }

    // Apply Stalwart Defense buff
    applyStalwartDefense() {
        if (!this.character) return;
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        log(`${this.character.name}'s Stalwart Defense activates!`);
        
        // Create permanent buff (999 duration represents permanent)
        const stalwartBuff = new Effect(
            this.stalwartDefenseBuffId,
            'Stalwart Defense',
            'Icons/talents/stalwart_defense.webp',
            999, // Permanent until removed
            null,
            false
        );
        
        // Set stat modifiers for the buff
        stalwartBuff.statModifiers = [
            { stat: 'armor', value: this.armorBonus, operation: 'add' },
            { stat: 'magicalShield', value: this.shieldBonus, operation: 'add' }
        ];
        
        stalwartBuff.setDescription(`Stalwart Defense: +${this.armorBonus} Armor, +${this.shieldBonus} Magical Shield while above 55% HP.`);
        
        // Define remove behavior
        stalwartBuff.remove = (character) => {
            log(`${character.name}'s Stalwart Defense fades.`);
        };
        
        this.character.addBuff(stalwartBuff);
        this.stalwartDefenseActive = true;
        
        // Show VFX for Stalwart Defense activation
        this.showStalwartDefenseVFX(this.character, true);
        
        console.log(`[SchoolgirlElpheltPassive] Stalwart Defense buff applied to ${this.character.name}`);
    }

    // Remove Stalwart Defense buff
    removeStalwartDefense() {
        if (!this.character) return;
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        log(`${this.character.name}'s Stalwart Defense fades as HP drops below 55%.`);
        
        this.character.removeBuff(this.stalwartDefenseBuffId);
        this.stalwartDefenseActive = false;
        
        // Show VFX for Stalwart Defense deactivation
        this.showStalwartDefenseVFX(this.character, false);
        
        console.log(`[SchoolgirlElpheltPassive] Stalwart Defense buff removed from ${this.character.name}`);
    }

    // Visual effects for Stalwart Defense
    showStalwartDefenseVFX(character, isActivating) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        if (isActivating) {
            // Activation VFX - Golden fortress-like effect
            const fortressVfx = document.createElement('div');
            fortressVfx.className = 'stalwart-defense-activation-vfx';
            fortressVfx.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 140, 0, 0.2) 50%, transparent 70%);
                border-radius: 8px;
                animation: stalwartDefenseActivation 2s ease-out forwards;
                z-index: 8;
                pointer-events: none;
            `;
            characterElement.appendChild(fortressVfx);

            // Floating text for activation
            const activationText = document.createElement('div');
            activationText.className = 'stalwart-defense-text-vfx';
            activationText.style.cssText = `
                position: absolute;
                top: 5%;
                left: 50%;
                transform: translateX(-50%);
                color: #ffd700;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 0 0 4px rgba(255, 215, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
                white-space: nowrap;
                animation: stalwartDefenseTextFloat 2s ease-out forwards;
                z-index: 9;
                pointer-events: none;
            `;
            activationText.innerHTML = `⚔️ Stalwart Defense!`;
            characterElement.appendChild(activationText);
            
            // Create fortress walls effect
            const wallsVfx = document.createElement('div');
            wallsVfx.className = 'stalwart-defense-walls';
            wallsVfx.style.cssText = `
                position: absolute;
                top: -10px; left: -10px; right: -10px; bottom: -10px;
                border: 3px solid rgba(255, 215, 0, 0.6);
                border-radius: 8px;
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.2);
                animation: stalwartDefenseWalls 2s ease-out forwards;
                z-index: 7;
                pointer-events: none;
            `;
            characterElement.appendChild(wallsVfx);
            
            // Remove VFX after animation
            setTimeout(() => {
                if (fortressVfx.parentNode) fortressVfx.remove();
                if (activationText.parentNode) activationText.remove();
                if (wallsVfx.parentNode) wallsVfx.remove();
            }, 2000);
        } else {
            // Deactivation VFX - Fading fortress
            const fadeVfx = document.createElement('div');
            fadeVfx.className = 'stalwart-defense-fade-vfx';
            fadeVfx.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
                border-radius: 8px;
                animation: stalwartDefenseFade 1.5s ease-out forwards;
                z-index: 8;
                pointer-events: none;
            `;
            characterElement.appendChild(fadeVfx);

            // Floating text for deactivation
            const fadeText = document.createElement('div');
            fadeText.className = 'stalwart-defense-fade-text';
            fadeText.style.cssText = `
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                color: #ff6b6b;
                font-size: 11px;
                font-weight: bold;
                text-shadow: 0 0 4px rgba(255, 107, 107, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
                white-space: nowrap;
                animation: stalwartDefenseFadeText 1.5s ease-out forwards;
                z-index: 9;
                pointer-events: none;
            `;
            fadeText.innerHTML = `Defense Lost`;
            characterElement.appendChild(fadeText);
            
            // Remove VFX after animation
            setTimeout(() => {
                if (fadeVfx.parentNode) fadeVfx.remove();
                if (fadeText.parentNode) fadeText.remove();
            }, 1500);
        }
    }

    // Main passive effect method
    triggerDefensiveManeuvers(caster, abilityUsed) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        log(`${caster.name}'s Defensive Maneuvers activates from using ${abilityUsed.name}!`);

        // Create a unique stackable buff instance
        const uniqueId = `${this.buffId}_${Date.now()}_${Math.random()}`;
        const buff = new Effect(
            uniqueId,
            this.buffName,
            this.buffIcon,
            this.duration,
            null, // No per-turn effect needed
            false // Not a debuff
        );

        // Set stat modifiers for the buff
        buff.statModifiers = [
            { stat: 'armor', value: this.armorBonus, operation: 'add' },
            { stat: 'magicalShield', value: this.shieldBonus, operation: 'add' }
        ];

        buff.setDescription(`+${this.armorBonus} Armor, +${this.shieldBonus} Magical Shield for ${this.duration} turns.`);
        
        // Define remove behavior for when the buff expires
        buff.remove = (character) => {
            log(`${character.name}'s Defensive Maneuvers stack fades.`);
            // Stat recalculation happens automatically in Character.removeBuff
        };

        // Add the buff to the character (this will stack with existing instances)
        caster.addBuff(buff);
        
        log(`${caster.name} gains a stack of Defensive Maneuvers (+${this.armorBonus} Armor, +${this.shieldBonus} Magical Shield).`);
        
        // === STATISTICS TRACKING ===
        if (typeof trackDefensiveManeuversStats === 'function') {
            trackDefensiveManeuversStats(caster, this.armorBonus, this.shieldBonus);
        } else if (window.statisticsManager) {
            // Fallback tracking if global function not available
            try {
                // Track passive buff application
                window.statisticsManager.recordStatusEffect(caster, caster, 'defensive_buff', 'defensive_maneuvers', false, 'schoolgirl_elphelt_passive');
                
                // Track passive usage
                window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_elphelt_passive', 'buff', this.armorBonus + this.shieldBonus, false);
                
                console.log(`[ElpheltPassiveStats] Tracked Defensive Maneuvers: +${this.armorBonus} Armor, +${this.shieldBonus} Magic Shield`);
            } catch (error) {
                console.error('[ElpheltPassiveStats] Error tracking Defensive Maneuvers stats:', error);
            }
        }
        // === END STATISTICS TRACKING ===
        
        // Show visual effects for passive activation
        this.showPassiveVFX(caster);
        
        // Update Stalwart Defense after ability use (in case HP changed)
        this.updateStalwartDefense();
    }

    // Visual effects for passive activation
    showPassiveVFX(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        // Create defensive aura (background glow like Angry Pig)
        const glowVfx = document.createElement('div');
        glowVfx.className = 'elphelt-passive-glow-vfx';
        glowVfx.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(65, 105, 225, 0.6) 0%, rgba(0, 191, 255, 0) 70%);
            border-radius: 8px;
            animation: defensiveGlowPulse 2s ease-out forwards;
            z-index: 8;
            pointer-events: none;
        `;
        characterElement.appendChild(glowVfx);

        // Create floating text effect
        const textVfx = document.createElement('div');
        textVfx.className = 'elphelt-passive-text-vfx';
        textVfx.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            color: #00bfff;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(65, 105, 225, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: defensiveTextFloat 2s ease-out forwards;
            z-index: 9;
            pointer-events: none;
        `;
        textVfx.innerHTML = `🛡️ +${this.armorBonus} ARM +${this.shieldBonus} MS`;
        characterElement.appendChild(textVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            if (glowVfx.parentNode) glowVfx.remove();
            if (textVfx.parentNode) textVfx.remove();
        }, 2000);
        
        // Add a brief glow effect to the character
        characterElement.classList.add('defensive-maneuvers-glow');
        setTimeout(() => {
            characterElement.classList.remove('defensive-maneuvers-glow');
        }, 1500);
    }

    // Alternative trigger method for direct calls (compatibility with some ability systems)
    onAbilityCast(caster, abilityUsed) {
        if (this.character && this.character === caster) {
            this.triggerDefensiveManeuvers(caster, abilityUsed);
        }
    }

    /**
     * Update passive description based on active talents
     */
    updateDescriptionForTalents(character) {
        if (!character) return this.baseDescription;
        
        let description = this.baseDescription;
        let talentEffects = '';
        
        // Check active talents
        const hasPrecisionMastery = character.appliedTalents && character.appliedTalents.includes('precision_mastery');
        const hasDebuffExploitation = character.appliedTalents && character.appliedTalents.includes('debuff_exploitation');
        const hasStunningPrecision = character.appliedTalents && character.appliedTalents.includes('stunning_precision');
        const hasCombatTraining = character.appliedTalents && character.appliedTalents.includes('combat_training');
        const hasHeartbreakShot = character.appliedTalents && character.appliedTalents.includes('heartbreak_shot');
        const hasStalwartDefense = character.appliedTalents && character.appliedTalents.includes('stalwart_defense');
        const hasDefensiveRecovery = character.appliedTalents && character.appliedTalents.includes('defensive_recovery');
        const hasEnhancedDisruption = character.appliedTalents && character.appliedTalents.includes('enhanced_disruption');
        const hasBattleHardened = character.appliedTalents && character.appliedTalents.includes('battle_hardened');
        const hasRapidDisruption = character.appliedTalents && character.appliedTalents.includes('rapid_disruption');
        const hasUltimateDisruption = character.appliedTalents && character.appliedTalents.includes('ultimate_disruption');
        const hasTacticalReload = character && character.appliedTalents && character.appliedTalents.includes('tactical_reload');
        const hasProtectiveBond = character && character.appliedTalents && character.appliedTalents.includes('protective_bond');
        const hasUltimateSacrifice = character && character.appliedTalents && character.appliedTalents.includes('ultimate_sacrifice');
        
        if (hasPrecisionMastery) {
            talentEffects += '\n<span class="talent-effect damage">Precision Mastery: +8% Critical Strike Chance.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Precision Mastery talent`);
        }
        
        if (hasDebuffExploitation) {
            talentEffects += '\n<span class="talent-effect damage">Debuff Exploitation: All abilities deal 15% increased damage for each debuff on the target.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Debuff Exploitation talent`);
        }
        
        if (hasStunningPrecision) {
            talentEffects += '\n<span class="talent-effect utility">Stunning Precision: Love Bullet has a 5% chance to stun targets for 1 turn.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Stunning Precision talent`);
        }
        
        if (hasCombatTraining) {
            talentEffects += '\n<span class="talent-effect damage">Combat Training: Intensive training provides +100 Physical Damage for devastating attacks.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Combat Training talent`);
        }
        
        if (hasHeartbreakShot) {
            talentEffects += '\n<span class="talent-effect damage">Heartbreak Shot: Love Bullet devastates heartbroken enemies with +395 Magical Damage.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Heartbreak Shot talent`);
        }
        
        if (hasStalwartDefense) {
            talentEffects += '\n<span class="talent-effect utility">Stalwart Defense: Permanent Defensive Maneuvers buff while above 55% HP (+5 Armor, +5 Magical Shield).</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Stalwart Defense talent`);
        }
        
        if (hasDefensiveRecovery) {
            talentEffects += '\n<span class="talent-effect healing">Defensive Recovery: Battle-hardened training heals 248 HP whenever damage is taken.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Defensive Recovery talent`);
        }
        
        if (hasEnhancedDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Enhanced Disruption: Flower Bomb affects a second random enemy with the same disabling effect.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Enhanced Disruption talent`);
        }
        
        if (hasBattleHardened) {
            talentEffects += '\n<span class="talent-effect healing">Battle Hardened: Extensive battle experience grants +1875 Maximum HP for superior survivability.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Battle Hardened talent`);
        }
        
        if (hasRapidDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Rapid Disruption: Flower Bomb cooldown reduced by 2 turns for frequent battlefield control.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Rapid Disruption talent`);
        }
        
        if (hasUltimateDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Ultimate Disruption: Flower Bomb cooldown reduced to 1 turn with stackable multi-ability disables!</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Ultimate Disruption talent`);
        }
        
        if (hasTacticalReload) {
            talentEffects += '\n<span class="talent-effect utility">Tactical Reload: Love Bullet reduces a random ability cooldown by 1 turn.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Tactical Reload talent`);
        }
        
        if (hasProtectiveBond) {
            talentEffects += '\n<span class="talent-effect utility">Protective Bond: At battle start, a random ally gains permanent Defensive Maneuvers.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Protective Bond talent`);
        }
        
        if (hasUltimateSacrifice) {
            talentEffects += '\n<span class="talent-effect healing">Ultimate Sacrifice: When an ally would die, Elphelt takes double damage instead and the ally is healed for 3000 HP (once per battle).</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Ultimate Sacrifice talent`);
        }
        
        return description + talentEffects;
    }

    /**
     * Get the current description of the passive
     */
    getDescription() {
        return this.updateDescriptionForTalents(this.character);
    }

    /**
     * Apply talent modifications to this passive
     */
    applyTalentModification(property, value) {
        console.log(`[Elphelt Passive] Applying talent modification: ${property} = ${value}`);
        
        if (property === 'defensiveRecovery') {
            this.defensiveRecovery = value;
            console.log(`[Elphelt Passive] Defensive Recovery enabled: ${value}`);
        } else if (property === 'defensiveRecoveryAmount') {
            this.defensiveRecoveryAmount = value;
            console.log(`[Elphelt Passive] Defensive Recovery amount set: ${value} HP`);
        } else if (property === 'stalwartDefense') {
            this.stalwartDefense = value;
            console.log(`[Elphelt Passive] Stalwart Defense enabled: ${value}`);
        } else if (property === 'stalwartDefenseThreshold') {
            this.stalwartDefenseThreshold = value;
            console.log(`[Elphelt Passive] Stalwart Defense threshold set: ${Math.round(value * 100)}%`);
        } else if (property === 'protectiveBond') {
            this.protectiveBond = value;
            console.log(`[Elphelt Passive] Protective Bond enabled: ${value}`);
            // Check and apply Protective Bond when talent is applied
            if (value) {
                setTimeout(() => {
                    this.checkAndApplyProtectiveBond();
                }, 50);
            }
        } else if (property === 'ultimateSacrifice') {
            this.ultimateSacrifice = value;
            console.log(`[Elphelt Passive] Ultimate Sacrifice enabled: ${value}`);
        } else if (property === 'ultimateSacrificeHealAmount') {
            this.ultimateSacrificeHealAmount = value;
            console.log(`[Elphelt Passive] Ultimate Sacrifice heal amount set: ${value} HP`);
        } else if (property === 'ultimateSacrificeUsed') {
            this.ultimateSacrificeUsed = value;
            console.log(`[Elphelt Passive] Ultimate Sacrifice used status set: ${value}`);
        } else {
            console.warn(`[Elphelt Passive] Unknown talent property: ${property}`);
        }
    }
}

// Make the class available globally
if (typeof window !== 'undefined') {
    window.SchoolgirlElpheltPassive = SchoolgirlElpheltPassive;
    
    // Register passive description update function globally
    window.updateElpheltPassiveDescriptionForTalents = function(character) {
        if (window.schoolgirlElpheltPassiveInstance) {
            return window.schoolgirlElpheltPassiveInstance.updateDescriptionForTalents(character);
        }
        
        // Fallback if no instance exists
        const baseDescription = 'After using any ability, gain +5 Armor and +5 Magical Shield for 3 turns. Stacks with multiple uses.';
        let description = baseDescription;
        let talentEffects = '';
        
        const hasPrecisionMastery = character && character.appliedTalents && character.appliedTalents.includes('precision_mastery');
        const hasDebuffExploitation = character && character.appliedTalents && character.appliedTalents.includes('debuff_exploitation');
        const hasStunningPrecision = character && character.appliedTalents && character.appliedTalents.includes('stunning_precision');
        const hasCombatTraining = character && character.appliedTalents && character.appliedTalents.includes('combat_training');
        const hasHeartbreakShot = character && character.appliedTalents && character.appliedTalents.includes('heartbreak_shot');
        const hasStalwartDefense = character && character.appliedTalents && character.appliedTalents.includes('stalwart_defense');
        const hasDefensiveRecovery = character && character.appliedTalents && character.appliedTalents.includes('defensive_recovery');
        const hasEnhancedDisruption = character && character.appliedTalents && character.appliedTalents.includes('enhanced_disruption');
        const hasBattleHardened = character && character.appliedTalents && character.appliedTalents.includes('battle_hardened');
        const hasRapidDisruption = character && character.appliedTalents && character.appliedTalents.includes('rapid_disruption');
        const hasUltimateDisruption = character && character.appliedTalents && character.appliedTalents.includes('ultimate_disruption');
        const hasTacticalReload = character && character.appliedTalents && character.appliedTalents.includes('tactical_reload');
        const hasProtectiveBond = character && character.appliedTalents && character.appliedTalents.includes('protective_bond');
        const hasUltimateSacrifice = character && character.appliedTalents && character.appliedTalents.includes('ultimate_sacrifice');
        
        if (hasPrecisionMastery) {
            talentEffects += '\n<span class="talent-effect damage">Precision Mastery: +8% Critical Strike Chance.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Precision Mastery talent`);
        }
        
        if (hasDebuffExploitation) {
            talentEffects += '\n<span class="talent-effect damage">Debuff Exploitation: All abilities deal 15% increased damage for each debuff on the target.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Debuff Exploitation talent`);
        }
        
        if (hasStunningPrecision) {
            talentEffects += '\n<span class="talent-effect utility">Stunning Precision: Love Bullet has a 5% chance to stun targets for 1 turn.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Stunning Precision talent`);
        }
        
        if (hasCombatTraining) {
            talentEffects += '\n<span class="talent-effect damage">Combat Training: Intensive training provides +100 Physical Damage for devastating attacks.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Combat Training talent`);
        }
        
        if (hasHeartbreakShot) {
            talentEffects += '\n<span class="talent-effect damage">Heartbreak Shot: Love Bullet devastates heartbroken enemies with +395 Magical Damage.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Heartbreak Shot talent`);
        }
        
        if (hasStalwartDefense) {
            talentEffects += '\n<span class="talent-effect utility">Stalwart Defense: Permanent Defensive Maneuvers buff while above 55% HP (+5 Armor, +5 Magical Shield).</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Stalwart Defense talent`);
        }
        
        if (hasDefensiveRecovery) {
            talentEffects += '\n<span class="talent-effect healing">Defensive Recovery: Battle-hardened training heals 248 HP whenever damage is taken.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Defensive Recovery talent`);
        }
        
        if (hasEnhancedDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Enhanced Disruption: Flower Bomb affects a second random enemy with the same disabling effect.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Enhanced Disruption talent`);
        }
        
        if (hasBattleHardened) {
            talentEffects += '\n<span class="talent-effect healing">Battle Hardened: Extensive battle experience grants +1875 Maximum HP for superior survivability.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Battle Hardened talent`);
        }
        
        if (hasRapidDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Rapid Disruption: Flower Bomb cooldown reduced by 2 turns for frequent battlefield control.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Rapid Disruption talent`);
        }
        
        if (hasUltimateDisruption) {
            talentEffects += '\n<span class="talent-effect utility">Ultimate Disruption: Flower Bomb cooldown reduced to 1 turn with stackable multi-ability disables!</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Ultimate Disruption talent`);
        }
        
        if (hasTacticalReload) {
            talentEffects += '\n<span class="talent-effect utility">Tactical Reload: Love Bullet reduces a random ability cooldown by 1 turn.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Tactical Reload talent`);
        }
        
        if (hasProtectiveBond) {
            talentEffects += '\n<span class="talent-effect utility">Protective Bond: At battle start, a random ally gains permanent Defensive Maneuvers.</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Protective Bond talent`);
        }
        
        if (hasUltimateSacrifice) {
            talentEffects += '\n<span class="talent-effect healing">Ultimate Sacrifice: When an ally would die, Elphelt takes double damage instead and the ally is healed for 3000 HP (once per battle).</span>';
            console.log(`[ElpheltPassiveTalents] Updated passive description for Ultimate Sacrifice talent`);
        }
        
        return description + talentEffects;
    };
    
    console.log('[SchoolgirlElpheltPassive] Registered passive description update function globally');
} 