// --- Schoolgirl Julia Passive Handler ---
class SchoolgirlJuliaPassiveHandler {
    constructor() {
        this.id = 'schoolgirl_julia_passive';
        this.name = 'Healing Empowerment';
        this.character = null;
        this.passiveName = "Healing Empowerment"; // Store passive name for logging
        this.vfxClass = "julia-passive-gain-vfx"; // Reference CSS class for gain VFX
        this.damageGained = 0; // Track total damage gained from passive
        console.log("Schoolgirl Julia Passive Handler Initialized");
    }

    initialize(character) {
        this.character = character;
        // Initialize with base physical damage to track passive gains accurately
        this.initialPhysicalDamage = character.stats.physicalDamage || 0;
        this.damageGained = 0;
        console.log(`Julia passive initialized for ${character.name} with base physical damage: ${this.initialPhysicalDamage}`);
        
        // Create enhanced passive display similar to Siegfried's
        this.enhanceJuliaPassiveDisplay();
        
        // Hook into heal and applyDamage methods for Healing Surge talent
        this.hookIntoHealMethod();
        this.hookIntoApplyDamageMethod();
    }

    enhanceJuliaPassiveDisplay() {
        if (!this.character) return;
        
        const charElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!charElement) return;
        
        // Add Julia-specific passive indicator
        this.updatePassiveIndicator();
        
        // Hook into UI updates if possible
        if (window.gameManager && window.gameManager.uiManager) {
            const originalUpdateCharacterUI = window.gameManager.uiManager.updateCharacterUI;
            
            window.gameManager.uiManager.updateCharacterUI = function(character) {
                originalUpdateCharacterUI.call(this, character);
                
                if (character.id === 'schoolgirl_julia') {
                    const handler = character.passiveHandler;
                    if (handler && handler.updatePassiveIndicator) {
                        handler.updatePassiveIndicator();
                    }
                }
            };
        }
    }

    updatePassiveIndicator() {
        if (!this.character) return;
        
        const charElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!charElement) return;
        
        const imageContainer = charElement.querySelector('.image-container');
        if (!imageContainer) return;
        
        // Remove old passive display if it exists
        const oldPassive = charElement.querySelector('.julia-passive-counter');
        if (oldPassive) {
            oldPassive.remove();
        }
        
        // Create new subtle passive indicator
        if (this.damageGained > 0) {
            // Add glow effect to image container
            if (!imageContainer.classList.contains('julia-healing-glow')) {
                imageContainer.classList.add('julia-healing-glow');
            }
            
            // Create small passive indicator
            const passiveIndicator = document.createElement('div');
            passiveIndicator.className = 'julia-passive-indicator';
            
            const iconElement = document.createElement('div');
            iconElement.className = 'julia-passive-icon';
            iconElement.textContent = '⚡'; // Healing energy symbol
            
            const valueElement = document.createElement('div');
            valueElement.className = 'julia-passive-value';
            valueElement.textContent = `+${this.damageGained}`;
            
            passiveIndicator.appendChild(iconElement);
            passiveIndicator.appendChild(valueElement);
            charElement.appendChild(passiveIndicator);
            
            // Add tier styling based on damage gained
            if (this.damageGained >= 400) {
                passiveIndicator.classList.add('tier3');
            } else if (this.damageGained >= 200) {
                passiveIndicator.classList.add('tier2');
            } else {
                passiveIndicator.classList.add('tier1');
            }
        } else {
            // Remove glow if no damage gained
            imageContainer.classList.remove('julia-healing-glow');
        }
    }

    // Called when Julia heals someone (including herself)
    onHealDealt(caster, target, healAmount) {
        if (!caster || caster.id !== 'schoolgirl_julia') {
            return; // Only trigger for Julia
        }

        // Base damage gain is 5, but talents can grant additional bonus (e.g., Empowered Healing talent)
        const extraGain = caster && caster.juliaPassiveExtraDamage ? caster.juliaPassiveExtraDamage : 0;
        const damageGain = 5 + extraGain; // 5 (base) + any extra from talents
        if (damageGain > 0) {
            // Only track the damage gain - don't modify stats directly
            // The bonus will be applied automatically in recalculateStats()
            this.damageGained += damageGain;
            
            console.log(`Julia's Healing Empowerment triggered: +${damageGain} Physical Damage (Total: +${this.damageGained})`);
            
            // Trigger stat recalculation to apply the bonus
            if (caster.recalculateStats) {
                caster.recalculateStats('julia_passive_heal');
            }
            
            // Update passive indicator
            this.updatePassiveIndicator();
            
            // Show floating text VFX
            const charElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (charElement) {
                const vfxElement = document.createElement('div');
                vfxElement.className = 'julia-passive-gain-vfx';
                vfxElement.textContent = `+${damageGain} DMG`;
                charElement.appendChild(vfxElement);
                
                // Remove VFX after animation
                setTimeout(() => {
                    if (vfxElement.parentNode) {
                        vfxElement.remove();
                    }
                }, 1000);
            }
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(caster);
            } else if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(caster);
            }
            
            // Add log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${caster.name}'s Healing Empowerment grants +${damageGain} Physical Damage!`);
            }
        }
    }

    // Called when Julia receives healing (for Healing Surge talent)
    onHealReceived(target, healer, healAmount) {
        if (!target || target.id !== 'schoolgirl_julia') {
            return; // Only trigger for Julia
        }

        // Check if Julia has the Healing Surge talent
        if (target.healingSurgeBonus && target.healingSurgeBonus > 0) {
            const bonusAmount = Math.floor(healAmount * target.healingSurgeBonus);
            const totalHeal = healAmount + bonusAmount;
            
            console.log(`Julia's Healing Surge amplifies healing: ${healAmount} + ${bonusAmount} = ${totalHeal}`);
            
            // Apply the bonus healing directly
            if (bonusAmount > 0) {
                const oldHp = target.stats.currentHp !== undefined ? target.stats.currentHp : (target.stats.hp || 0);
                const maxHp = target.stats.maxHp !== undefined ? target.stats.maxHp : (target.stats.hp || 0);
                const newHp = Math.min(oldHp + bonusAmount, maxHp);
                const actualBonusHeal = newHp - oldHp;
                
                if (actualBonusHeal > 0) {
                    // Apply the bonus healing
                    if (target.stats.currentHp !== undefined) {
                        target.stats.currentHp = newHp;
                    } else if (target.stats.hp !== undefined) {
                        target.stats.hp = newHp;
                    }
                    
                    console.log(`Julia's Healing Surge applied ${actualBonusHeal} bonus healing`);
                    
                    // Show VFX for the bonus healing
                    if (typeof window.showHealingSurgeVFX === 'function') {
                        window.showHealingSurgeVFX(target, healAmount, actualBonusHeal, totalHeal);
                    }
                    
                    // Update UI
                    if (window.gameManager && window.gameManager.uiManager) {
                        window.gameManager.uiManager.triggerHPAnimation(target, 'heal', actualBonusHeal, false);
                        window.gameManager.uiManager.updateCharacterUI(target);
                    }
                }
            }
            
            // Add log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${target.name}'s Healing Surge amplifies the healing by ${bonusAmount}!`, 'talent-effect healing');
            }
        }
    }

    // Called when Julia takes damage (for Nature's Resilience talent)
    onDamageTaken(target, damageInfo, attacker) {
        if (!target || target.id !== 'schoolgirl_julia') {
            return; // Only trigger for Julia
        }

        // Check if Julia has the Nature's Resilience talent
        if (target.naturesResiliencePercent && target.naturesResiliencePercent > 0) {
            const maxHp = target.stats.maxHp || target.stats.hp || 0;
            const maxMana = target.stats.maxMana || target.stats.mana || 0;
            
            // Calculate restoration amounts (1% of max values)
            const healAmount = Math.floor(maxHp * target.naturesResiliencePercent);
            const manaAmount = Math.floor(maxMana * target.naturesResiliencePercent);
            
            if (healAmount > 0 || manaAmount > 0) {
                console.log(`Julia's Nature's Resilience triggered: +${healAmount} HP, +${manaAmount} Mana`);
                
                // Apply healing if there's HP to restore
                if (healAmount > 0) {
                    const healResult = target.heal(healAmount, target, { abilityId: 'natures_resilience' });
                    const actualHeal = healResult.healAmount;
                    
                    // Trigger passive if heal was successful
                    if (actualHeal > 0 && target.passiveHandler && typeof target.passiveHandler.onHealDealt === 'function') {
                        target.passiveHandler.onHealDealt(target, target, actualHeal);
                    }
                }
                
                // Apply mana restoration
                if (manaAmount > 0) {
                    const oldMana = target.stats.currentMana !== undefined ? target.stats.currentMana : (target.stats.mana || 0);
                    const maxMana = target.stats.maxMana !== undefined ? target.stats.maxMana : (target.stats.mana || 0);
                    const imprisonDebuff = target.debuffs?.find(d => d && d.effects && d.effects.cantRestoreMana);
                    
                    if (!imprisonDebuff && maxMana > 0) {
                        let newMana = oldMana;
                        if (target.stats.currentMana !== undefined) {
                            target.stats.currentMana = Math.min(oldMana + manaAmount, maxMana);
                            newMana = target.stats.currentMana;
                        } else if (target.stats.mana !== undefined) {
                            target.stats.mana = Math.min(oldMana + manaAmount, maxMana);
                            newMana = target.stats.mana;
                        }
                        const actualRestored = newMana - oldMana;
                        
                        if (actualRestored > 0) {
                            console.log(`Julia regains ${actualRestored} mana from Nature's Resilience.`);
                            if (window.gameManager && window.gameManager.uiManager) {
                                window.gameManager.uiManager.triggerManaAnimation(target, 'restore', actualRestored);
                            }
                        }
                    }
                }
                
                // Show VFX
                if (typeof window.showNaturesResilienceVFX === 'function') {
                    const damageAmount = damageInfo ? damageInfo.damage : 0;
                    window.showNaturesResilienceVFX(target, damageAmount, healAmount, manaAmount);
                }
                
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(target);
                } else if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(target);
                }
            }
        }
    }

    // Hook into Julia's heal method to apply Healing Surge bonus
    hookIntoHealMethod() {
        if (!this.character || this.character.id !== 'schoolgirl_julia') return;
        
        // Store original heal method
        const originalHeal = this.character.heal;
        
        // Override heal method
        this.character.heal = function(amount, caster = null, options = {}) {
            // Check if character is dead
            if (this.isDead()) {
                return { healAmount: 0, wasCritical: false, overheal: 0 };
            }

            // Apply Healing Surge bonus if Julia has the talent
            let finalHealAmount = amount;
            if (this.id === 'schoolgirl_julia' && this.healingSurgeBonus && this.healingSurgeBonus > 0) {
                const bonusAmount = Math.floor(amount * this.healingSurgeBonus);
                finalHealAmount = amount + bonusAmount;
                console.log(`Healing Surge applied: ${amount} + ${bonusAmount} = ${finalHealAmount}`);
            }

            // Calculate current and max HP
            const currentHp = this.stats.currentHp !== undefined ? this.stats.currentHp : (this.stats.hp || 0);
            const maxHp = this.stats.maxHp !== undefined ? this.stats.maxHp : (this.stats.hp || 0);

            // Check if healing is blocked
            const healingBlocked = this.debuffs?.some(debuff => 
                debuff && debuff.effects && debuff.effects.cantHeal
            );

            if (healingBlocked) {
                console.log(`${this.name} cannot heal due to healing block.`);
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${this.name} cannot heal due to healing block.`, 'system');
                }
                return { healAmount: 0, wasCritical: false, overheal: 0 };
            }

            // Calculate critical heal chance (base 5% + any bonuses)
            const critChance = (this.stats.critChance || 0) + (this.healingCritChance || 0);
            const isCritical = Math.random() < critChance;
            
            // Apply critical multiplier if it's a critical heal
            if (isCritical) {
                finalHealAmount = Math.floor(finalHealAmount * (this.stats.critMultiplier || 1.5));
            }

            // Calculate actual healing (don't exceed max HP)
            const oldHp = currentHp;
            const newHp = Math.min(oldHp + finalHealAmount, maxHp);
            const actualHeal = newHp - oldHp;
            const overheal = finalHealAmount - actualHeal;

            // Apply the healing
            if (this.stats.currentHp !== undefined) {
                this.stats.currentHp = newHp;
            } else if (this.stats.hp !== undefined) {
                this.stats.hp = newHp;
            }

            // Trigger passive if healing was successful
            if (actualHeal > 0 && this.passiveHandler && typeof this.passiveHandler.onHealReceived === 'function') {
                this.passiveHandler.onHealReceived(this, caster, actualHeal);
            }

            // Log the healing
            let message = `${this.name} is healed for ${actualHeal}`;
            if (isCritical) {
                message += " (Critical Heal!)";
            }
            if (overheal > 0) {
                message += ` (${overheal} overheal)`;
            }

            console.log(message);
            
            if (window.gameManager && window.gameManager.addLogEntry) {
                const logClass = isCritical ? 'critical-heal' : 'heal';
                window.gameManager.addLogEntry(message, logClass);
            }

            // Show healing VFX
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.triggerHPAnimation(this, 'heal', actualHeal, isCritical);
            }

            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(this);
            } else if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this);
            }

            return { healAmount: actualHeal, wasCritical: isCritical, overheal: overheal };
        };
    }

    // Hook into Julia's applyDamage method to apply Healing Surge damage penalty
    hookIntoApplyDamageMethod() {
        if (!this.character || this.character.id !== 'schoolgirl_julia') return;
        
        // Store original applyDamage method
        const originalApplyDamage = this.character.applyDamage;
        
        // Override applyDamage method
        this.character.applyDamage = function(amount, type, caster = null, options = {}) {
            // Check if character is dead
            if (this.isDead()) {
                return { damage: 0, isCritical: false, isDodged: false, damageType: type };
            }

            // Apply Healing Surge damage penalty if Julia has the talent
            let finalDamageAmount = amount;
            if (this.id === 'schoolgirl_julia' && this.healingSurgeDamagePenalty && this.healingSurgeDamagePenalty > 0) {
                const penaltyAmount = Math.floor(amount * this.healingSurgeDamagePenalty);
                finalDamageAmount = amount + penaltyAmount;
                console.log(`Healing Surge damage penalty applied: ${amount} + ${penaltyAmount} = ${finalDamageAmount}`);
            }

            // Calculate dodge chance
            const dodgeChance = this.stats.dodgeChance || 0;
            const isDodged = Math.random() < dodgeChance;

            if (isDodged) {
                console.log(`${this.name} dodged the attack!`);
                
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${this.name} dodged the attack!`, 'dodge');
                }
                
                return { damage: 0, isCritical: false, isDodged: true, damageType: type };
            }

            // Calculate critical hit chance
            const critChance = caster ? (caster.stats.critChance || 0) : 0;
            const isCritical = Math.random() < critChance;
            
            // Apply critical multiplier if it's a critical hit
            if (isCritical) {
                const critMultiplier = caster ? (caster.stats.critMultiplier || 1.5) : 1.5;
                finalDamageAmount = Math.floor(finalDamageAmount * critMultiplier);
            }

            // Calculate final damage with armor/shield reduction
            const finalDamage = this.calculateDamage(finalDamageAmount, type, caster);

            // Apply the damage
            const oldHp = this.stats.currentHp !== undefined ? this.stats.currentHp : (this.stats.hp || 0);
            const newHp = Math.max(0, oldHp - finalDamage);
            
            if (this.stats.currentHp !== undefined) {
                this.stats.currentHp = newHp;
            } else if (this.stats.hp !== undefined) {
                this.stats.hp = newHp;
            }

            // Trigger passive if damage was taken
            if (finalDamage > 0 && this.passiveHandler && typeof this.passiveHandler.onDamageTaken === 'function') {
                this.passiveHandler.onDamageTaken(this, { damage: finalDamage, type: type }, caster);
            }

            // Log the damage
            let message = `${this.name} takes ${finalDamage} ${type} damage`;
            if (isCritical) {
                message += " (Critical Hit!)";
            }

            console.log(message);
            
            if (window.gameManager && window.gameManager.addLogEntry) {
                const logClass = isCritical ? 'critical' : '';
                window.gameManager.addLogEntry(message, logClass);
            }

            // Show damage VFX
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.triggerHPAnimation(this, 'damage', finalDamage, isCritical);
            }

            // Check if character died
            if (newHp <= 0 && window.gameManager) {
                window.gameManager.handleCharacterDeath(this);
            }

            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(this);
            } else if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this);
            }

            return { damage: finalDamage, isCritical: isCritical, isDodged: false, damageType: type };
        };
    }
}

// CSS for enhanced Julia passive display
const juliaPassiveStyle = document.createElement('style');
juliaPassiveStyle.textContent = `
/* Julia Healing Glow - Similar to Siegfried's power glow */
.image-container.julia-healing-glow {
    box-shadow: 0 0 15px rgba(144, 238, 144, 0.6);
    transition: box-shadow 0.5s ease-in-out;
}

.image-container.julia-healing-glow img {
    filter: drop-shadow(0 0 5px rgba(144, 238, 144, 0.7));
    transition: filter 0.5s ease-in-out;
}

/* Julia Passive Indicator - Small, subtle overlay */
.julia-passive-indicator {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 12;
    border: 1px solid #90ee90;
    box-shadow: 0 0 5px rgba(144, 238, 144, 0.5);
    transition: all 0.3s ease;
    font-size: 12px;
}

.julia-passive-icon {
    font-size: 14px;
    color: #90ee90;
    animation: juliaPassiveGlow 2s infinite alternate;
}

.julia-passive-value {
    color: #ffffff;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

@keyframes juliaPassiveGlow {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
}

/* Tier styling for passive indicator */
.julia-passive-indicator.tier1 {
    border-color: #90ee90;
    background: rgba(0, 0, 0, 0.8);
}

.julia-passive-indicator.tier2 {
    border-color: #ffeb99;
    background: rgba(0, 0, 0, 0.85);
    box-shadow: 0 0 8px rgba(255, 235, 153, 0.6);
}

.julia-passive-indicator.tier2 .julia-passive-icon {
    color: #ffeb99;
}

.julia-passive-indicator.tier3 {
    border-color: #ff99cc;
    background: rgba(0, 0, 0, 0.9);
    box-shadow: 0 0 12px rgba(255, 153, 204, 0.7);
    animation: tier3Pulse 1.5s infinite alternate;
}

.julia-passive-indicator.tier3 .julia-passive-icon {
    color: #ff99cc;
}

@keyframes tier3Pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
}

/* Passive gain VFX - floating text */
.julia-passive-gain-vfx {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    color: #90ee90;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 0 3px black, 0 0 6px rgba(144, 238, 144, 0.8);
    animation: floatUpFade 1.2s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
    z-index: 15;
}

@keyframes floatUpFade {
    0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateX(-50%) translateY(-15px) scale(1.1);
    }
    100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-35px) scale(0.9);
    }
}
`;

// Add the styles to the document
if (!document.getElementById('julia-passive-styles')) {
    juliaPassiveStyle.id = 'julia-passive-styles';
    document.head.appendChild(juliaPassiveStyle);
}

// Make the handler available globally
window.PassiveHandlers = window.PassiveHandlers || {};
window.PassiveHandlers.schoolgirl_julia_passive = SchoolgirlJuliaPassiveHandler;

// Also register it in the global scope for direct access
window.SchoolgirlJuliaPassiveHandler = SchoolgirlJuliaPassiveHandler;

// Register with the expected naming convention from getPassiveClassName
window.SchoolgirlJuliaPassive = SchoolgirlJuliaPassiveHandler;

console.log("Registered SchoolgirlJuliaPassiveHandler.");

// Global VFX function for Healing Surge
window.showHealingSurgeVFX = function(character, baseHeal, bonusHeal, totalHeal) {
    if (!character || !character.element) return;
    
    const characterElement = character.element;
    
    // Create pulse effect
    const pulse = document.createElement('div');
    pulse.className = 'julia-healing-surge-pulse';
    characterElement.appendChild(pulse);
    
    // Create base heal floating text
    const baseFloat = document.createElement('div');
    baseFloat.className = 'julia-healing-surge-base-float';
    baseFloat.textContent = `+${baseHeal}`;
    characterElement.appendChild(baseFloat);
    
    // Create bonus heal floating text
    const bonusFloat = document.createElement('div');
    bonusFloat.className = 'julia-healing-surge-bonus-float';
    bonusFloat.textContent = `+${bonusHeal} SURGE!`;
    characterElement.appendChild(bonusFloat);
    
    // Create wave effect
    const wave = document.createElement('div');
    wave.className = 'julia-healing-surge-wave';
    characterElement.appendChild(wave);
    
    // Create sparkles
    const sparklesContainer = document.createElement('div');
    sparklesContainer.className = 'julia-healing-surge-sparkles';
    characterElement.appendChild(sparklesContainer);
    
    // Add multiple sparkles
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'julia-healing-surge-sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 0.5 + 's';
        sparklesContainer.appendChild(sparkle);
    }
    
    // Create aura effect
    const aura = document.createElement('div');
    aura.className = 'julia-healing-surge-aura';
    characterElement.appendChild(aura);
    
    // Cleanup after animations complete
    setTimeout(() => {
        if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
        if (baseFloat.parentNode) baseFloat.parentNode.removeChild(baseFloat);
        if (bonusFloat.parentNode) bonusFloat.parentNode.removeChild(bonusFloat);
        if (wave.parentNode) wave.parentNode.removeChild(wave);
        if (sparklesContainer.parentNode) sparklesContainer.parentNode.removeChild(sparklesContainer);
        if (aura.parentNode) aura.parentNode.removeChild(aura);
    }, 3500);
    
    console.log(`Healing Surge VFX shown: Base ${baseHeal} + Bonus ${bonusHeal} = Total ${totalHeal}`);
};
