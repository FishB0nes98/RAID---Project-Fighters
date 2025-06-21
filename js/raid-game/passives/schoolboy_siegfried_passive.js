// js/raid-game/passives/schoolboy_siegfried_passive.js

class SchoolboySiegfriedPassive {
    constructor() {
        this.id = 'schoolboy_siegfried_passive';
        this.name = 'Buff Connoisseur';
        this.description = 'Gain 125 Physical Damage for each active buff.';
        this.icon = 'Icons/passives/schoolboy_siegfried_passive.jfif';
        this.damagePerBuff = 125; // Base value, can be modified by talents
        this.buffDurationBonus = 0; // Enduring Mastery talent
        this.healOnBuffReceived = 0; // Restorative Buffs talent
        this.healOnAllyHealed = 0; // Guardian's Link talent
        this.healOnBuffReceivedFlat = 0; // Lionheart Regrowth talent fixed heal
        this.purifyingResolveChance = 0; // Purifying Resolve talent
        this.allyBuffDamageBonus = 0; // Ally's Strength talent
        this.blessedRestorationEnabled = false; // Blessed Restoration talent
    }

    // Called when the passive is first attached to the character
    initialize(character) {
        if (!character) {
            console.error('SchoolboySiegfriedPassive: No character provided for initialization');
            return;
        }

        this.character = character;
        this.damagePerBuff = 125; // Default value
        
        console.log(`[Siegfried Passive] Initializing for ${character.name}`);
        
        // Apply talent modifications if present
        if (character.appliedTalents) {
            console.log(`[Siegfried Passive] Applied talents found:`, character.appliedTalents);
            
            // Enhanced Connoisseur talent
            if (character.appliedTalents.includes('enhanced_connoisseur')) {
                console.log('[Siegfried Passive] Enhanced Connoisseur talent detected');
                this.applyTalentModification('damagePerBuff', 150);
            }
            
            // Enduring Mastery talent
            if (character.appliedTalents.includes('enduring_mastery')) {
                console.log('[Siegfried Passive] Enduring Mastery talent detected');
                character.buffDurationBonus = (character.buffDurationBonus || 0) + 1;
            }
            
            // Restorative Buffs talent
            if (character.appliedTalents.includes('restorative_buffs')) {
                console.log('[Siegfried Passive] Restorative Buffs talent detected');
                character.healOnBuffReceived = 0.02; // 2% of max HP
            }
            
            // Guardian's Link talent
            if (character.appliedTalents.includes('guardian_link')) {
                console.log('[Siegfried Passive] Guardian\'s Link talent detected');
                character.healOnAllyHealed = 0.35; // 35% of ally heals
                this.healOnAllyHealed = 0.35;
            }
            
            // Enhanced Lion Protection talent - affects ability cooldown
            if (character.appliedTalents.includes('enhanced_lion_protection')) {
                console.log('[Siegfried Passive] Enhanced Lion Protection talent detected');
                this.applyEnhancedLionProtection(character);
            }
            
            // Lionheart Regrowth talent
            if (character.appliedTalents.includes('lionheart_regrowth')) {
                console.log('[Siegfried Passive] Lionheart Regrowth talent detected');
                this.applyTalentModification('healOnBuffReceivedFlat', 300);
            }
            
            // Purifying Resolve talent
            if (character.appliedTalents.includes('purifying_resolve')) {
                console.log('[Siegfried Passive] Purifying Resolve talent detected');
                this.applyTalentModification('purifyingResolveChance', 0.18);
                // Set up turn start event listener for debuff removal
                this.setupPurifyingResolve(character);
            }
            
            // Tactical Patience talent
            if (character.appliedTalents.includes('tactical_patience')) {
                console.log('[Siegfried Passive] Tactical Patience talent detected');
                this.applyTalentModification('tacticalPatienceEnabled', true);
                this.setupTacticalPatience(character);
            }
            
            // Ally's Strength talent
            if (character.appliedTalents.includes('ally_strength')) {
                console.log('[Siegfried Passive] Ally\'s Strength talent detected');
                this.applyTalentModification('allyBuffDamageBonus', 25);
                console.log(`[Siegfried Passive] allyBuffDamageBonus set to: ${this.allyBuffDamageBonus}`);
            }
            
            // Blessed Restoration talent
            if (character.appliedTalents.includes('blessed_restoration')) {
                console.log('[Siegfried Passive] Blessed Restoration talent detected');
                this.applyTalentModification('blessedRestorationEnabled', true);
            }
        }
        
        // Update stats and display
        this.updateDescription();
        
        console.log(`[Siegfried Passive] Initialization complete. Damage per buff: ${this.damagePerBuff}`);
    }

    // Called after a buff has been successfully added to the character
    onBuffAdded(character) {
        if (character.id !== 'schoolboy_siegfried') return;

        // NEW: Lionheart Regrowth fixed heal
        if (this.healOnBuffReceivedFlat && this.healOnBuffReceivedFlat > 0) {
            const healResult = character.heal(this.healOnBuffReceivedFlat, character, { abilityId: 'lionheart_regrowth' });
            if (window.gameManager?.addLogEntry) {
                window.gameManager.addLogEntry(`🦁 ${character.name}'s Lionheart Regrowth restores ${healResult.healAmount} HP!`, 'talent-effect healing');
            }
        }

        console.log(`[Siegfried Passive] Buff added. Triggering recalculation...`);
        this.updateDescription();
        character.recalculateStats('siegfried_passive_buff_added');
    }

    // Called after a buff has been successfully removed from the character
    onBuffRemoved(character) {
        if (character.id !== 'schoolboy_siegfried') return;

        console.log(`[Siegfried Passive] Buff removed. Triggering recalculation...`);
        this.updateDescription();
        character.recalculateStats('siegfried_passive_buff_removed');
    }

    // Update the passive description when talents modify it
    updateDescription() {
        const buffCount = this.character ? this.character.buffs.length : 0;
        let totalDamage = buffCount * this.damagePerBuff;
        
        // Calculate ally buff damage bonus if Ally's Strength talent is active
        let allyBuffCount = 0;
        let allyBuffDamage = 0;
        if (this.allyBuffDamageBonus > 0 && window.gameManager) {
            const allies = window.gameManager.getAllies(this.character);
            allyBuffCount = allies.reduce((count, ally) => {
                if (ally.id !== this.character.id) { // Exclude Siegfried's own buffs
                    return count + ally.buffs.length;
                }
                return count;
            }, 0);
            allyBuffDamage = allyBuffCount * this.allyBuffDamageBonus;
            totalDamage += allyBuffDamage;
        }
        
        // Base description with colorful formatting
        let description = `<div class="siegfried-passive">Gain <span style="color: #ff6b6b; font-weight: bold;">${this.damagePerBuff} Physical Damage</span> for each active buff.`;
        
        // Check for Warrior's Foundation talent (+50 base damage)
        if (this.character && this.character.hasTalent && this.character.hasTalent('warrior_foundation')) {
            description += `<br><span class="talent-effect damage">💪 Warrior's Foundation: +50 base Physical Damage.</span>`;
        }
        
        // Add talent descriptions if applicable with proper styling
        if (this.buffDurationBonus > 0) {
            description += `<br><span class="talent-effect utility">⏳ Enduring Mastery: All buffs last ${this.buffDurationBonus} additional turn${this.buffDurationBonus > 1 ? 's' : ''}.</span>`;
        }
        
        if (this.healOnBuffReceived > 0) {
            const healPercent = (this.healOnBuffReceived * 100).toFixed(0);
            description += `<br><span class="talent-effect healing">💚 Restorative Buffs: Heal for ${healPercent}% of max HP when receiving buffs.</span>`;
        }
        
        if (this.healOnAllyHealed > 0) {
            const healPercent = (this.healOnAllyHealed * 100).toFixed(0);
            description += `<br><span class="talent-effect healing">🤝 Guardian's Link: Heal for ${healPercent}% of ally heals.</span>`;
        }
        
        // Enhanced Connoisseur talent indication
        if (this.damagePerBuff > 125) {
            description += `<br><span class="talent-effect damage">🦁 Enhanced Connoisseur: Increased damage per buff (${this.damagePerBuff} instead of 125).</span>`;
        }
        
        if (this.healOnBuffReceivedFlat > 0) {
            description += `<br><span class="talent-effect healing">🦁 Lionheart Regrowth: Heal ${this.healOnBuffReceivedFlat} HP when receiving buffs.</span>`;
        }
        
        if (this.purifyingResolveChance > 0) {
            const resolvePercent = (this.purifyingResolveChance * 100).toFixed(0);
            description += `<br><span class="talent-effect utility">✨ Purifying Resolve: ${resolvePercent}% chance to remove all debuffs at turn start.</span>`;
        }
        
        if (this.tacticalPatienceEnabled) {
            const hasPreparedStrike = this.character && this.character.hasBuff && this.character.hasBuff('prepared_strike');
            description += `<br><span class="talent-effect damage">⏰ Tactical Patience: +200 Physical Damage when W, E, R are on cooldown.</span>`;
            if (hasPreparedStrike) {
                description += ` <span style="color: #4CAF50; font-weight: bold;">[ACTIVE]</span>`;
            }
        }
        
        if (this.allyBuffDamageBonus > 0) {
            description += `<br><span class="talent-effect damage">💪 Ally's Strength: +${this.allyBuffDamageBonus} Physical Damage per ally buff (excluding own buffs).</span>`;
        }
        
        if (this.blessedRestorationEnabled) {
            description += `<br><span class="talent-effect healing">✨ Blessed Restoration: Heal 500 HP per active buff at turn end.</span>`;
        }
        
        // Current status with colorful formatting
        const ownBuffDamage = buffCount * this.damagePerBuff;
        let statusText = `<br><br><span style="color: #4CAF50; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Currently: +${totalDamage} Physical Damage</span>`;
        
        // Break down damage sources
        statusText += `<br><span style="color: #2196F3; font-weight: 600;">• ${buffCount} own buff${buffCount !== 1 ? 's' : ''}: +${ownBuffDamage} damage</span>`;
        
        if (this.allyBuffDamageBonus > 0) {
            if (allyBuffCount > 0) {
                statusText += `<br><span style="color: #FF9800; font-weight: 600;">• ${allyBuffCount} ally buff${allyBuffCount !== 1 ? 's' : ''}: +${allyBuffDamage} damage</span>`;
            } else {
                statusText += `<br><span style="color: #757575; font-weight: 600;">• 0 ally buffs: +0 damage</span>`;
            }
        }
        
        description += statusText + '.</div>';
        
        this.description = description;
        console.log(`[Siegfried Passive] Description updated: ${this.description}`);
        
        // Force update the character stats menu if it's open
        this.updatePassiveDescriptionInUI();
    }

    updatePassiveDescriptionInUI() {
        // Update any open character stats menu
        console.log('[Siegfried Passive] Looking for passive description elements...');
        
        // Try multiple selectors to find the element
        let passiveDescElements = document.querySelectorAll('.passive-description.siegfried-passive');
        console.log(`[Siegfried Passive] Found ${passiveDescElements.length} elements with .passive-description.siegfried-passive`);
        
        if (passiveDescElements.length === 0) {
            // Try just siegfried-passive
            passiveDescElements = document.querySelectorAll('.siegfried-passive');
            console.log(`[Siegfried Passive] Found ${passiveDescElements.length} elements with .siegfried-passive`);
        }
        
        if (passiveDescElements.length === 0) {
            // Try just passive-description
            passiveDescElements = document.querySelectorAll('.passive-description');
            console.log(`[Siegfried Passive] Found ${passiveDescElements.length} elements with .passive-description`);
        }
        
        if (passiveDescElements.length > 0) {
            passiveDescElements.forEach((element, index) => {
                console.log(`[Siegfried Passive] Updating element ${index}:`, element.className);
                element.innerHTML = this.description.replace(/\n/g, '<br>');
            });
            console.log('[Siegfried Passive] Updated passive description in UI');
        } else {
            console.log('[Siegfried Passive] No passive description elements found in DOM');
            
            // If no elements found, try to refresh the character stats menu if it's open
            if (window.gameManager && window.gameManager.uiManager && this.character) {
                const statsMenu = document.querySelector('.character-stats-menu');
                if (statsMenu && statsMenu.style.display !== 'none') {
                    console.log('[Siegfried Passive] Stats menu is open, attempting to refresh...');
                    // Close and reopen the menu to refresh the description
                    setTimeout(() => {
                        if (window.gameManager.selectedCharacter && window.gameManager.selectedCharacter.id === 'schoolboy_siegfried') {
                            const rect = statsMenu.getBoundingClientRect();
                            window.gameManager.uiManager.showCharacterStatsMenu(this.character, rect.left, rect.top);
                        }
                    }, 100);
                }
            }
        }
    }

    // Apply talent modifications to the passive
    applyTalentModification(property, value) {
        if (property === 'damagePerBuff') {
            this.damagePerBuff = value;
        } else if (property === 'buffDurationBonus') {
            this.buffDurationBonus = value;
        } else if (property === 'healOnBuffReceived') {
            this.healOnBuffReceived = value;
        } else if (property === 'healOnAllyHealed') {
            this.healOnAllyHealed = value;
            if (this.character) {
                this.character.healOnAllyHealed = value;
            }
        } else if (property === 'healOnBuffReceivedFlat') {
            this.healOnBuffReceivedFlat = value;
            if(this.character){
               this.character.healOnBuffReceivedFlat = value;
            }
        } else if (property === 'purifyingResolveChance') {
            this.purifyingResolveChance = value;
            if(this.character){
               this.character.purifyingResolveChance = value;
            }
        } else if (property === 'tacticalPatienceEnabled') {
            this.tacticalPatienceEnabled = value;
            if(this.character){
               this.character.tacticalPatienceEnabled = value;
            }
        } else if (property === 'allyBuffDamageBonus') {
            this.allyBuffDamageBonus = value;
            if(this.character){
               this.character.allyBuffDamageBonus = value;
            }
        } else if (property === 'blessedRestorationEnabled') {
            this.blessedRestorationEnabled = value;
            if(this.character){
               this.character.blessedRestorationEnabled = value;
            }
        }
        this.updateDescription();
        console.log(`[Siegfried Passive] Talent applied: ${property} changed from ${value}`);
        
        // Force UI update to reflect new values
        if (typeof updateCharacterUI === 'function' && this.character) {
            updateCharacterUI(this.character);
        }
    }

    applyEnhancedLionProtection(character) {
        // Find Lion Protection ability and modify it
        const lionProtectionAbility = character.abilities.find(ability => ability.id === 'schoolboy_siegfried_w');
        if (lionProtectionAbility) {
            // Update cooldown from 6 to 8
            if (lionProtectionAbility.cooldown === 6) {
                lionProtectionAbility.cooldown = 8;
                console.log('[Enhanced Lion Protection] Updated Lion Protection cooldown from 6 to 8');
            }
            
            // Add visual indicator class
            character.hasEnhancedLionProtection = true;
            
            // Update ability description will be handled by the ability system
        }
    }

    setupPurifyingResolve(character) {
        // Set up the character property to handle turn start debuff removal
        character.purifyingResolveChance = this.purifyingResolveChance;
        
        // This will be handled by the game's turn start processing
        console.log(`[Siegfried Passive] Purifying Resolve set up with ${(this.purifyingResolveChance * 100).toFixed(0)}% chance`);
    }
    
    setupTacticalPatience(character) {
        // Set up the character property
        character.tacticalPatienceEnabled = true;
        this.preparedStrikeBuff = null;
        
        console.log('[Siegfried Passive] Tactical Patience set up');
        
        // Initial check
        this.checkTacticalPatience(character);
    }
    
    checkTacticalPatience(character) {
        if (!this.tacticalPatienceEnabled) return;
        
        // Find W, E, R abilities
        const lionProtection = character.abilities.find(a => a.id === 'schoolboy_siegfried_w');
        const swordBlessing = character.abilities.find(a => a.id === 'schoolboy_siegfried_e');
        const judgement = character.abilities.find(a => a.id === 'schoolboy_siegfried_r');
        
        // Check if all three are on cooldown
        const allOnCooldown = lionProtection && swordBlessing && judgement &&
                             lionProtection.cooldownRemaining > 0 &&
                             swordBlessing.cooldownRemaining > 0 &&
                             judgement.cooldownRemaining > 0;
        
        const hasPreparedStrike = character.hasBuff('prepared_strike');
        
        if (allOnCooldown && !hasPreparedStrike) {
            // Apply Prepared Strike buff
            this.applyPreparedStrikeBuff(character);
        } else if (!allOnCooldown && hasPreparedStrike) {
            // Remove Prepared Strike buff
            this.removePreparedStrikeBuff(character);
        }
    }
    
    applyPreparedStrikeBuff(character) {
        const preparedStrikeBuff = {
            id: 'prepared_strike',
            name: 'Prepared Strike',
            icon: 'Icons/talents/tactical_patience.webp',
            duration: -1, // Permanent until conditions change
            description: '⏰ Tactical Patience: +200 Physical Damage while W, E, R are on cooldown.',
            effects: {
                physicalDamageBonus: 200
            },
            isPositive: true,
            stackable: false
        };
        
        character.addBuff(preparedStrikeBuff);
        
        // Show VFX
        this.showTacticalPatienceVFX(character, true);
        
        // Add log entry
        if (window.gameManager?.addLogEntry) {
            window.gameManager.addLogEntry(`⏰ ${character.name} gains Prepared Strike! (+200 Physical Damage)`, 'talent-effect damage');
        }
        
        console.log('[Siegfried Passive] Prepared Strike buff applied');
    }
    
    removePreparedStrikeBuff(character) {
        character.removeBuff('prepared_strike');
        
        // Show VFX
        this.showTacticalPatienceVFX(character, false);
        
        // Add log entry
        if (window.gameManager?.addLogEntry) {
            window.gameManager.addLogEntry(`⏰ ${character.name} loses Prepared Strike (ability off cooldown)`, 'talent-effect damage');
        }
        
        console.log('[Siegfried Passive] Prepared Strike buff removed');
    }
    
    showTacticalPatienceVFX(character, isActivating) {
        const characterElement = document.querySelector(`[data-character-id="${character.id}"]`);
        if (!characterElement) return;
        
        const imageContainer = characterElement.querySelector('.image-container');
        if (!imageContainer) return;
        
        if (isActivating) {
            // Add activation VFX
            const vfxElement = document.createElement('div');
            vfxElement.className = 'tactical-patience-activation-vfx';
            vfxElement.innerHTML = `
                <div class="patience-clock">⏰</div>
                <div class="patience-text">PREPARED STRIKE</div>
            `;
            
            imageContainer.appendChild(vfxElement);
            
            // Add glow effect to character
            imageContainer.classList.add('tactical-patience-ready');
            
            // Remove VFX after animation
            setTimeout(() => {
                if (vfxElement.parentNode) {
                    vfxElement.remove();
                }
            }, 3000);
        } else {
            // Remove glow effect
            imageContainer.classList.remove('tactical-patience-ready');
            
            // Show deactivation VFX
            const vfxElement = document.createElement('div');
            vfxElement.className = 'tactical-patience-deactivation-vfx';
            vfxElement.innerHTML = `
                <div class="patience-fade">⏰</div>
                <div class="patience-fade-text">Prepared Strike Fades</div>
            `;
            
            imageContainer.appendChild(vfxElement);
            
            setTimeout(() => {
                if (vfxElement.parentNode) {
                    vfxElement.remove();
                }
            }, 2000);
        }
    }
    
    // Apply Blessed Restoration healing at turn end
    applyBlessedRestoration(character) {
        if (!this.blessedRestorationEnabled) return;
        
        const activeBuffs = character.buffs.filter(buff => buff.duration !== 0);
        const buffCount = activeBuffs.length;
        
        if (buffCount > 0) {
            const healAmount = buffCount * 500;
            
            // Apply healing
            character.heal(healAmount, character, { abilityId: 'blessed_restoration' });
            
            // Show VFX
            this.showBlessedRestorationVFX(character, buffCount, healAmount);
            
            // Add log entry
            if (window.gameManager?.addLogEntry) {
                window.gameManager.addLogEntry(`✨ ${character.name}'s Blessed Restoration heals for ${healAmount} HP (${buffCount} buffs × 500)`, 'heal blessed-restoration');
            }
            
            console.log(`[Siegfried Passive] Blessed Restoration healed ${healAmount} HP from ${buffCount} buffs`);
        }
    }
    
    showBlessedRestorationVFX(character, buffCount, healAmount) {
        const characterElement = document.querySelector(`[data-character-id="${character.id}"]`);
        if (!characterElement) return;
        
        const imageContainer = characterElement.querySelector('.image-container');
        if (!imageContainer) return;
        
        // Create restoration VFX
        const vfxElement = document.createElement('div');
        vfxElement.className = 'blessed-restoration-vfx';
        vfxElement.innerHTML = `
            <div class="restoration-aura"></div>
            <div class="restoration-particles"></div>
            <div class="restoration-text">✨ BLESSED RESTORATION ✨</div>
            <div class="restoration-heal">+${healAmount} HP</div>
            <div class="restoration-buffs">${buffCount} Buffs</div>
        `;
        
        imageContainer.appendChild(vfxElement);
        
        // Add temporary glow effect
        imageContainer.classList.add('blessed-restoration-active');
        
        // Remove VFX after animation
        setTimeout(() => {
            if (vfxElement.parentNode) {
                vfxElement.remove();
            }
            imageContainer.classList.remove('blessed-restoration-active');
        }, 4000);
    }
}

// Make the passive available globally or register it if using a registry system
window.SchoolboySiegfriedPassive = SchoolboySiegfriedPassive; 