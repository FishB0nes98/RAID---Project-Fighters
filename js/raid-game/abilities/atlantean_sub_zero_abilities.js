// Atlantean Sub Zero Abilities
class AtlanteanSubZeroAbilities {
    static createIceBallEffect(abilityData) {
        return function(caster, target) {
            console.log(`${caster.name} casts Ice Ball on ${target.name}!`);
            
            // Show ice ball projectile VFX
            AtlanteanSubZeroAbilities.showIceBallVFX(caster, target);
            
            setTimeout(() => {
                // Calculate damage: 395 + 125% Magical Damage
                const baseDamage = 395;
                const magicalDamageBonus = Math.floor(caster.stats.magicalDamage * 1.25);
                const totalDamage = baseDamage + magicalDamageBonus;
                
                // Apply damage
                const result = target.applyDamage(totalDamage, 'magical', caster, { abilityId: 'ice_ball' });
                
                // Only apply freeze if damage wasn't dodged
                if (!result.isDodged) {
                    // 33% chance to freeze for 3 turns
                    if (Math.random() < 0.33) {
                        const freezeDebuff = {
                            id: 'freeze',
                            name: 'Freeze',
                            icon: '❄️',
                            duration: 3,
                            maxDuration: 3, // Always max duration
                            isDebuff: true,
                            source: caster.name,
                            description: 'Frozen solid! Abilities have only 40% chance to succeed.',
                            effect: function(character) {
                                // Freeze effect is handled in the ability usage logic
                            },
                            onRemove: function(character) {
                                if (window.AtlanteanSubZeroAbilities) {
                                    // Natural expiry melt
                                    window.AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                                }
                            }
                        };
                        
                        target.addDebuff(freezeDebuff);
                        
                        // Show freeze VFX
                        AtlanteanSubZeroAbilities.showFreezeApplicationVFX(target);
                        
                        if (window.gameManager) {
                            window.gameManager.addLogEntry(`💧 ${target.name} is frozen solid!`, 'debuff');
                        }
                    }
                }
            }, 800); // Delay for projectile travel time
        };
    }
    
    static showIceBallVFX(caster, target) {
        const casterElement = AtlanteanSubZeroAbilities.getCharacterElement(caster);
        const targetElement = AtlanteanSubZeroAbilities.getCharacterElement(target);
        
        if (!casterElement || !targetElement) return;
        
        // Create ice ball projectile
        const projectile = document.createElement('div');
        projectile.className = 'ice-ball-projectile';
        
        // Position at caster
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        projectile.style.left = (casterRect.left + casterRect.width / 2) + 'px';
        projectile.style.top = (casterRect.top + casterRect.height / 2) + 'px';
        
        document.body.appendChild(projectile);
        
        // Animate to target
        setTimeout(() => {
            projectile.style.left = (targetRect.left + targetRect.width / 2) + 'px';
            projectile.style.top = (targetRect.top + targetRect.height / 2) + 'px';
        }, 10);
        
        // Impact effect
        setTimeout(() => {
            AtlanteanSubZeroAbilities.createIceImpactVFX(targetElement);
            projectile.remove();
        }, 800);
    }
    
    static createIceImpactVFX(targetElement) {
        // Create ice impact particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'ice-impact-particle';
            
            const angle = (i / 12) * 360;
            const distance = 30 + Math.random() * 20;
            
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--distance', distance + 'px');
            
            targetElement.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
        
        // Screen shake
        document.querySelector('.battle-container')?.classList.add('ice-impact-shake');
        setTimeout(() => {
            document.querySelector('.battle-container')?.classList.remove('ice-impact-shake');
        }, 300);
    }
    
    static showFreezeApplicationVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        // Add freeze overlay if not already present
        let freezeOverlay = characterElement.querySelector('.freeze-overlay');
        if (!freezeOverlay) {
            freezeOverlay = document.createElement('div');
            freezeOverlay.className = 'freeze-overlay';
            characterElement.appendChild(freezeOverlay);
        }
        
        // Create ice crystals
        for (let i = 0; i < 8; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'ice-crystal';
            crystal.style.animationDelay = (i * 0.1) + 's';
            freezeOverlay.appendChild(crystal);
        }
        
        // Show freeze indicator on character
        AtlanteanSubZeroAbilities.showFreezeIndicator(character);
    }
    
    static showFreezeIndicator(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        let freezeIndicator = characterElement.querySelector('.freeze-indicator');
        if (!freezeIndicator) {
            freezeIndicator = document.createElement('div');
            freezeIndicator.className = 'freeze-indicator';
            freezeIndicator.innerHTML = '❄️';
            characterElement.appendChild(freezeIndicator);
        }
    }
    
    static removeFreezeIndicator(character, broken = false) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;

        // Scatter shards when broken, otherwise melt.
        if (broken) {
            AtlanteanSubZeroAbilities.scatterFreezeVFX(character);
        } else {
            AtlanteanSubZeroAbilities.meltFreezeVFX(character);
        }
    }
    
    // Scatter shards outward when freeze is broken early
    static scatterFreezeVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;

        // Create shard particles
        for (let i = 0; i < 14; i++) {
            const shard = document.createElement('div');
            shard.className = 'freeze-scatter-particle';
            const angle = Math.random() * 360;
            const distance = 40 + Math.random() * 25;
            const dx = Math.cos(angle * Math.PI / 180) * distance;
            const dy = Math.sin(angle * Math.PI / 180) * distance;
            shard.style.left = '50%';
            shard.style.top = '50%';
            shard.style.setProperty('--dx', dx.toFixed(1));
            shard.style.setProperty('--dy', dy.toFixed(1));
            characterElement.appendChild(shard);
            setTimeout(() => shard.remove(), 800);
        }

        // Remove all freeze indicators / overlays if present
        characterElement.querySelectorAll('.freeze-indicator').forEach(el=>el.remove());
        characterElement.querySelectorAll('.freeze-overlay').forEach(el=>el.remove());
    }
    
    // Melt/fade when freeze naturally expires
    static meltFreezeVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        // Melt all overlays
        const overlays = characterElement.querySelectorAll('.freeze-overlay');
        overlays.forEach(ov => {
            ov.classList.add('freeze-melt');
            setTimeout(() => ov.remove(), 1200);
        });
        
        // Fade all indicators
        characterElement.querySelectorAll('.freeze-indicator').forEach(ind => {
            ind.style.transition = 'opacity 0.8s';
            ind.style.opacity = '0';
            setTimeout(() => ind.remove(), 800);
        });
    }
    
    static showFreezeFailVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        // Add flash overlay
        const flash = document.createElement('div');
        flash.className = 'freeze-fail-vfx';
        characterElement.appendChild(flash);
        
        // Slight shake on character element
        characterElement.classList.add('freeze-fail-shake');
        setTimeout(() => {
            flash.remove();
            characterElement.classList.remove('freeze-fail-shake');
        }, 600);
    }
    
    // Helper to get character DOM element reliably
    static getCharacterElement(character) {
        const instanceId = character.instanceId || character.id;
        // Try by element ID first (used by UIManager)
        let el = document.getElementById(`character-${instanceId}`);
        if (!el) {
            // Fallback to data-character-id selector (used by some older code)
            el = document.querySelector(`[data-character-id="${instanceId}"]`);
        }
        return el;
    }

    static createIceWallEffect() {
        // Returns the effect function which the Ability system will call
        return function(caster, _targets) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

            // Ensure freeze listener is active
            AtlanteanSubZeroAbilities.initializeIceWallFreezeListener();

            // Determine all allies (includes caster)
            let allies = [];
            if (window.gameManager && typeof window.gameManager.getAllies === 'function') {
                allies = window.gameManager.getAllies(caster);
            }
            if (!Array.isArray(allies) || allies.length === 0) {
                allies = [caster]; // Fallback just in case
            }

            log(`${caster.name} summons an Ice Wall, shielding allies!`, 'buff');

            // Apply shield buff to each ally
            allies.forEach(ally => {
                if (!ally || ally.isDead()) return;

                const extraShieldStat = Math.floor((ally.stats.magicalShield || 0) * 3); // 300% stat increase

                // Define buff
                const iceWallBuff = {
                    id: 'ice_wall_shield',
                    name: 'Ice Wall',
                    icon: 'Icons/abilities/ice_wall.png',
                    duration: 2,
                    maxDuration: 2,
                    isDebuff: false,
                    source: caster.name,
                    statBonus: extraShieldStat,
                    description: `+${extraShieldStat} Magical Shield (300%) and may freeze attackers (20%)`,
                    onApply: function(character) {
                        // Save original base stat once per buff application
                        if (this._originalBaseShield == null) {
                            this._originalBaseShield = character.baseStats.magicalShield || 0;
                        }
                        character.stats.magicalShield += extraShieldStat;
                        character.baseStats.magicalShield += extraShieldStat;
                        character.recalculateStats('ice-wall-apply');
                        if (typeof updateCharacterUI === 'function') updateCharacterUI(character);

                        // Track active buffs for barrier persistence
                        AtlanteanSubZeroAbilities._activeIceWallBuffs = (AtlanteanSubZeroAbilities._activeIceWallBuffs || 0) + 1;
                    },
                    onRemove: function(character) {
                        // Revert stat bonus
                        character.stats.magicalShield -= extraShieldStat;
                        character.baseStats.magicalShield -= extraShieldStat;
                        character.recalculateStats('ice-wall-remove');
                        if (typeof updateCharacterUI === 'function') updateCharacterUI(character);

                        // Decrement active counter and possibly remove barrier VFX
                        AtlanteanSubZeroAbilities._activeIceWallBuffs = (AtlanteanSubZeroAbilities._activeIceWallBuffs || 1) - 1;
                        if (AtlanteanSubZeroAbilities._activeIceWallBuffs <= 0) {
                            AtlanteanSubZeroAbilities._activeIceWallBuffs = 0;
                            AtlanteanSubZeroAbilities.removeIceWallVFX();
                        }
                    }
                };

                ally.addBuff(iceWallBuff);
                log(`${ally.name} gains ${extraShieldStat} Ice Wall shield!`, 'buff-effect');
            });

            // Show barrier VFX across battlefield
            AtlanteanSubZeroAbilities.showIceWallVFX();
        };
    }

    // Listener to freeze attackers when they damage an Ice Wall–buffed ally
    static initializeIceWallFreezeListener() {
        if (AtlanteanSubZeroAbilities._iceWallListenerAdded) return;
        AtlanteanSubZeroAbilities._iceWallListenerAdded = true;
        document.addEventListener('damageDealt', AtlanteanSubZeroAbilities.iceWallFreezeListener);
    }

    static iceWallFreezeListener(event) {
        const { source, target } = event.detail || {};
        if (!source || !target) return;
        if (source.isDead() || target.isDead()) return;

        // Check if target currently has Ice Wall buff active
        const hasIceWall = target.buffs && target.buffs.some(b => b.id === 'ice_wall_shield');
        if (!hasIceWall) return;

        // 20% chance to freeze attacker
        if (Math.random() < 0.20) {
            // Avoid double-freeze stacking
            if (source.debuffs && source.debuffs.some(d => d.id === 'freeze')) return;

            const freezeDebuff = {
                id: 'freeze',
                name: 'Freeze',
                icon: '❄️',
                duration: 2,
                maxDuration: 2,
                isDebuff: true,
                source: target.name,
                description: 'Frozen solid! Abilities have only 40% chance to succeed.',
                onRemove: function(character) {
                    if (window.AtlanteanSubZeroAbilities) {
                        AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                    }
                }
            };

            source.addDebuff(freezeDebuff);
            AtlanteanSubZeroAbilities.showFreezeApplicationVFX(source);
            if (window.gameManager) {
                window.gameManager.addLogEntry(`❄️ ${source.name} is frozen by Ice Wall!`, 'debuff');
            }
        }
    }

    static showIceWallVFX() {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;

        // Remove existing if present to avoid stacking visuals
        const existing = battleContainer.querySelector('.ice-wall-barrier');
        if (existing) existing.remove();

        const barrier = document.createElement('div');
        barrier.className = 'ice-wall-barrier';
        battleContainer.appendChild(barrier);

        // Auto-remove after animation completes (2.5s)
        setTimeout(() => barrier.remove(), 2500);
    }

    static removeIceWallVFX() {
        const barrier = AtlanteanSubZeroAbilities._barrierElement;
        if (!barrier) return;

        barrier.style.transition = 'opacity 0.6s';
        barrier.style.opacity = '0';
        setTimeout(() => {
            if (barrier.parentElement) barrier.parentElement.removeChild(barrier);
            AtlanteanSubZeroAbilities._barrierElement = null;
        }, 650);
    }

    static createIceBlastEffect() {
        return function(caster) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

            // Always fetch the current list of opponents to guarantee AoE hit regardless of manual target selection
            let targets = [];
            if (window.gameManager && typeof window.gameManager.getOpponents === 'function') {
                targets = window.gameManager.getOpponents(caster) || [];
            }

            if (!Array.isArray(targets) || targets.length === 0) {
                log(`${caster.name} attempted to cast Ice Blast, but there were no targets!`, 'system');
                return;
            }

            log(`${caster.name} unleashes Ice Blast, freezing winds hit ${targets.length} enemies!`, 'ability');

            // Simple battlefield VFX (optional – only if .battle-container exists)
            AtlanteanSubZeroAbilities.showIceBlastVFX?.();

            targets.forEach(target => {
                if (!target || target.isDead()) return;

                const debuffCount = (target.debuffs && Array.isArray(target.debuffs)) ? target.debuffs.length : 0;
                const bonusDamage = caster.stats.magicalDamage * debuffCount; // 100% magical damage per debuff
                const baseDamage = 325;
                const totalDamage = baseDamage + Math.floor(bonusDamage);

                const result = target.applyDamage(totalDamage, 'magical', caster, { abilityId: 'ice_blast' });

                let message = `${target.name} takes ${result.damage} magical damage`;
                if (debuffCount > 0) {
                    message += ` (+${debuffCount * 100}% from debuffs)`;
                }
                log(message, result.isCritical ? 'critical' : '');

                // Update UI immediately
                if (typeof updateCharacterUI === 'function') updateCharacterUI(target);
            });
        };
    }

    // Optional: battlefield VFX helper
    static showIceBlastVFX() {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;

        // Prevent stacking
        const existing = battleContainer.querySelector('.ice-blast-flash');
        if (existing) existing.remove();

        const flash = document.createElement('div');
        flash.className = 'ice-blast-flash';
        battleContainer.appendChild(flash);
        setTimeout(() => flash.remove(), 600);
    }

    static createIceSwordStrikeEffect() {
        return function(casterOrData, target, abilityInstance, actualManaCost, options = {}) {
            // Detect execution vs initialization by checking first parameter
            if (casterOrData && casterOrData.constructor && casterOrData.constructor.name === 'Character') {
                // --- Execution Mode ---
                const caster = casterOrData;
                // Reuse previous combat implementation
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

                if (!target || target.isDead()) {
                    log(`${caster.name} tried to use Ice Sword Strike, but target was invalid!`, 'system');
                    return { success: false };
                }

                log(`${caster.name} slashes ${target.name} with an Ice Sword!`, 'ability');

                // VFX
                if (window.AtlanteanSubZeroAbilities && typeof AtlanteanSubZeroAbilities.createIceImpactVFX === 'function') {
                    const targetElement = AtlanteanSubZeroAbilities.getCharacterElement(target);
                    if (targetElement) {
                        AtlanteanSubZeroAbilities.createIceImpactVFX(targetElement);
                    }
                }

                // Damage calc
                const totalDamage = Math.floor(caster.stats.physicalDamage);
                const result = target.applyDamage(totalDamage, 'physical', caster, { abilityId: 'ice_sword_strike' });

                // Freeze application
                if (!result.isDodged) {
                    const existingFreeze = target.debuffs && target.debuffs.find(d => d.id === 'freeze');
                    if (!existingFreeze || existingFreeze.duration < 5) {
                        const freezeDebuff = {
                            id: 'freeze',
                            name: 'Freeze',
                            icon: '❄️',
                            duration: 5,
                            maxDuration: 5,
                            isDebuff: true,
                            source: caster.name,
                            description: 'Frozen solid! Abilities have only 40% chance to succeed.',
                            onRemove(character) {
                                if (window.AtlanteanSubZeroAbilities) {
                                    AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                                }
                            }
                        };
                        target.addDebuff(freezeDebuff);
                        AtlanteanSubZeroAbilities.showFreezeApplicationVFX(target);
                        if (window.gameManager) {
                            window.gameManager.addLogEntry(`❄️ ${target.name} is frozen solid for 5 turns!`, 'debuff');
                        }
                    }
                }

                // Talent follow-up logic
                const hasFollowUp = caster.enableIceSwordFollowUp || (typeof caster.hasTalent === 'function' && caster.hasTalent('frozen_opportunity'));
                if (hasFollowUp && Math.random() < 0.25) {
                    if (window.AtlanteanSubZeroAbilities && typeof AtlanteanSubZeroAbilities.showIceSwordFollowUpVFX === 'function') {
                        AtlanteanSubZeroAbilities.showIceSwordFollowUpVFX(caster);
                    }
                    if (window.gameManager) {
                        window.gameManager.addLogEntry(`⚔️ ${caster.name}'s Frozen Opportunity triggers, allowing an immediate follow-up!`, 'talent-effect');
                        window.gameManager.showFloatingText?.(caster.id, 'Follow-Up!', 'buff');
                    }
                    return { success: true, doesNotEndTurn: true };
                }

                return { success: true };
            }
            // --- Initialization Mode ---
            const ability = abilityInstance; // abilityInstance provided by AbilityFactory
            return {
                execute: (caster, target) => {
                    return AtlanteanSubZeroAbilities.createIceSwordStrikeEffect()(caster, target, ability);
                },
                generateDescription: function() {
                    if (typeof window.updateIceSwordStrikeDescription === 'function') {
                        const desc = window.updateIceSwordStrikeDescription(this);
                        console.debug('[FrozenOpportunity] generateDescription executed for Ice Sword Strike');
                        return desc;
                    }
                    // Fallback (should not happen)
                    this.description = this.baseDescription || this.description || 'Strikes an enemy with an ice sword dealing 100% Physical Damage. Guaranteed to FREEZE the target for 5 turns.';
                    return this.description;
                }
            };
        };
    }

    // NEW: Follow-up VFX when Frozen Opportunity triggers
    static showIceSwordFollowUpVFX(caster) {
        const element = AtlanteanSubZeroAbilities.getCharacterElement(caster);
        if (!element) return;
        const vfx = document.createElement('div');
        vfx.className = 'ice-sword-followup-vfx';
        vfx.textContent = '⚔️';
        element.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1000);
    }

    static initializeFrozenAura() {
        if (AtlanteanSubZeroAbilities._frozenAuraListenerAdded) return;
        AtlanteanSubZeroAbilities._frozenAuraListenerAdded = true;
        document.addEventListener('damageDealt', AtlanteanSubZeroAbilities.frozenAuraListener);
    }

    static frozenAuraListener(event) {
        const { source, target } = event.detail || {};
        if (!source || !target) return;
        if (source.isDead() || target.isDead()) return;

        // Check that the target is an Atlantean Sub Zero variant
        const isSubZero = (target.id === 'atlantean_sub_zero' || target.id === 'atlantean_sub_zero_playable');
        if (!isSubZero) return;

        // Avoid self-damage cases
        if (source === target) return;

        // 8% chance to freeze attacker
        if (Math.random() < 0.08) {
            // Already frozen?
            if (source.debuffs && source.debuffs.some(d => d.id === 'freeze')) return;

            const freezeDebuff = {
                id: 'freeze',
                name: 'Freeze',
                icon: '❄️',
                duration: 2,
                maxDuration: 2,
                isDebuff: true,
                source: target.name,
                description: 'Frozen solid! Abilities have only 40% chance to succeed.',
                onRemove: function(character) {
                    if (window.AtlanteanSubZeroAbilities) {
                        AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                    }
                }
            };

            source.addDebuff(freezeDebuff);
            AtlanteanSubZeroAbilities.showFreezeApplicationVFX(source);
            if (window.gameManager) {
                window.gameManager.addLogEntry(`❄️ ${source.name} is frozen by ${target.name}\'s chilling aura!`, 'debuff');
            }
        }
    }
}

// Register abilities
if (typeof window !== 'undefined') {
    window.AtlanteanSubZeroAbilities = AtlanteanSubZeroAbilities;
}

// Register Ice Wall ability effect with the central AbilityFactory (if available)
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilityEffect === 'function') {
    AbilityFactory.registerAbilityEffect('ice_wall', AtlanteanSubZeroAbilities.createIceWallEffect());
    AbilityFactory.registerAbilityEffect('ice_blast', AtlanteanSubZeroAbilities.createIceBlastEffect());
    AbilityFactory.registerAbilityEffect('ice_sword_strike', AtlanteanSubZeroAbilities.createIceSwordStrikeEffect());
}

// Call initializeFrozenAura immediately when script loads
AtlanteanSubZeroAbilities.initializeFrozenAura();

// === Description update helper ===
function updateIceSwordStrikeDescription(ability, character = null) {
    // Find owning character if not supplied
    if (!character) {
        character = window.gameManager?.gameState?.playerCharacters?.find(c => c.abilities?.some(a => a.id === ability.id)) || null;
    }
    // Base description
    let description = ability.baseDescription || ability.description || 'Strikes an enemy with an ice sword dealing 100% Physical Damage. Guaranteed to FREEZE the target for 5 turns.';
    if (character && character.enableIceSwordFollowUp) {
        description += '\n<span class="talent-effect utility">⚔️ Frozen Opportunity: 25% chance for Ice Sword Strike to not end the turn.</span>';
        console.debug('[FrozenOpportunity] Description updated with follow-up text for', character.name);
    }
    // Mutate ability.description so callers that rely on the field (e.g., UI tooltips)
    // always display the latest generated text.
    ability.description = description;
    return description;
}

// Expose globally for TalentManager
if (typeof window !== 'undefined') {
    window.updateIceSwordStrikeDescription = updateIceSwordStrikeDescription;
} 