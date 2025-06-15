/* Kroudin Abilities */
(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined' || typeof Effect === 'undefined') return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Punishment Ability Effect
    const punishmentEffect = async (caster, target) => {
        if (!target || target.isDead()) {
            log(`${caster.name} tried to use Punishment, but no valid target.`);
            return;
        }

        log(`💀 ${caster.name} raises his rusted chains to deliver divine punishment!`, 'ability-cast');
        
        // Play punishment sound
        playSound('sounds/chain_punishment.mp3', 0.9);
        
        // Show punishment VFX
        await showPunishmentVFX(caster, target);
        
        // Apply damage (490 physical damage)
        const damageAmount = 490;
        const damageResult = target.applyDamage(damageAmount, 'physical', caster, {
            abilityId: 'kroudin_punishment'
        });

        // Log damage
        let damageMessage = `⚔️ ${target.name} is struck by divine punishment for ${damageResult.damage} physical damage`;
        if (damageResult.isCritical) damageMessage += " (Critical Judgment!)";
        log(damageMessage, damageResult.isCritical ? 'critical' : 'damage');

        // Apply lifesteal if any
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(damageResult.damage);
        }

        // Only apply debuffs if attack wasn't dodged
        if (!damageResult.isDodged) {
            // Apply stun debuff (1 turn)
            const stunDebuff = new Effect(
                'kroudin_punishment_stun',
                'Divine Punishment Stun',
                'Icons/effects/stun.png',
                1, // 1 turn duration
                null,
                true // Is a debuff
            );
            
            stunDebuff.effects = {
                cantAct: true
            };
            
            stunDebuff.setDescription('Paralyzed by divine judgment - cannot perform any actions.');
            
            // Apply stun
            target.addDebuff(stunDebuff);
            log(`💀 ${target.name} is stunned by divine punishment for 1 turn!`, 'debuff');

            // Disable 2 random abilities for 3 turns
            await disableRandomAbilities(target, 2, 3);
        } else {
            log(`${target.name} dodged the divine punishment completely!`);
        }

        // Update UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
            window.gameManager.uiManager.updateCharacterUI(caster);
        }

        return true;
    };

    // Helper function to disable multiple random abilities
    async function disableRandomAbilities(target, count, duration) {
        // Get all abilities of the target
        const abilities = target.abilities || [];
        
        // If the target has no abilities, return
        if (!abilities || abilities.length === 0) {
            log(`${target.name} has no abilities to disable!`);
            return;
        }
        
        // Find abilities that are not passive and not already disabled
        const usableAbilities = abilities.filter(ability => 
            ability && !ability.passive && !ability.isDisabled
        );
        
        if (usableAbilities.length === 0) {
            log(`${target.name} has no abilities that can be disabled!`);
            return;
        }

        // Determine how many abilities to actually disable (min of count and available abilities)
        const abilitiesToDisable = Math.min(count, usableAbilities.length);
        
        // Shuffle and select random abilities
        const shuffledAbilities = [...usableAbilities].sort(() => Math.random() - 0.5);
        const selectedAbilities = shuffledAbilities.slice(0, abilitiesToDisable);

        // Disable each selected ability
        for (const abilityToDisable of selectedAbilities) {
            const debuffId = `kroudin_punishment_disable_${abilityToDisable.id}_${Date.now()}`;
            const debuffName = `Ability Disabled: ${abilityToDisable.name}`;
            const debuffIcon = "Icons/debuffs/ability_disabled.png";
            
            // Create the Effect instance
            const disableDebuff = new Effect(
                debuffId,
                debuffName,
                debuffIcon,
                duration,
                null, // No per-turn effect
                true  // isDebuff = true
            ).setDescription(`${abilityToDisable.name} is disabled by divine punishment for ${duration} turns.`);
            
            // Save reference to disabled ability
            disableDebuff.disabledAbilityId = abilityToDisable.id;
            
            // Apply the disable effect directly to the ability object
            abilityToDisable.isDisabled = true;
            abilityToDisable.disabledDuration = duration;
            
            // Define the remove function for when debuff expires
            disableDebuff.remove = function(character) {
                const disabledAbility = character.abilities.find(a => a.id === this.disabledAbilityId);
                if (disabledAbility) {
                    if (disabledAbility.isDisabled && disabledAbility.disabledDuration <= 0) {
                        disabledAbility.isDisabled = false;
                        log(`${character.name}'s ${disabledAbility.name} is no longer disabled!`);
                        
                        // Update UI to reflect the change
                        if (window.gameManager && window.gameManager.uiManager) {
                            window.gameManager.uiManager.updateCharacterUI(character);
                        }
                    }
                }
            };
            
            // Apply the debuff
            target.addDebuff(disableDebuff);
            
            // Show ability disable VFX
            showAbilityDisableVFX(target, abilityToDisable.name);
            
            log(`💀 ${target.name}'s ${abilityToDisable.name} is disabled by divine punishment for ${duration} turns!`, 'debuff');
        }
    }

    // VFX for Punishment ability
    async function showPunishmentVFX(caster, target) {
        return new Promise(async (resolve) => {
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            const battleContainer = document.querySelector('.battle-container');
            
            if (!casterElement || !targetElement || !battleContainer) {
                resolve();
                return;
            }

            // Phase 1: Caster raises chains and glows with dark energy
            const casterGlow = document.createElement('div');
            casterGlow.className = 'kroudin-punishment-caster-glow';
            casterElement.appendChild(casterGlow);

            // Create floating chains around caster
            for (let i = 0; i < 6; i++) {
                const chain = document.createElement('div');
                chain.className = 'kroudin-punishment-chain';
                chain.style.setProperty('--chain-index', i);
                casterElement.appendChild(chain);
            }

            // Phase 2: Dark energy beam travels to target
            await delay(800);
            
            const energyBeam = document.createElement('div');
            energyBeam.className = 'kroudin-punishment-beam';
            battleContainer.appendChild(energyBeam);

            // Calculate beam position
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            const containerRect = battleContainer.getBoundingClientRect();
            
            const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
            const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
            const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
            const endY = targetRect.top + targetRect.height / 2 - containerRect.top;
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            
            energyBeam.style.left = `${startX}px`;
            energyBeam.style.top = `${startY}px`;
            energyBeam.style.width = `${distance}px`;
            energyBeam.style.transform = `rotate(${angle}rad)`;

            // Phase 3: Impact on target with chains and dark energy
            await delay(600);
            
            const impactEffect = document.createElement('div');
            impactEffect.className = 'kroudin-punishment-impact';
            targetElement.appendChild(impactEffect);

            // Create punishment chains around target
            for (let i = 0; i < 8; i++) {
                const impactChain = document.createElement('div');
                impactChain.className = 'kroudin-punishment-impact-chain';
                impactChain.style.setProperty('--impact-chain-index', i);
                targetElement.appendChild(impactChain);
            }

            // Create dark energy explosion
            const explosion = document.createElement('div');
            explosion.className = 'kroudin-punishment-explosion';
            targetElement.appendChild(explosion);

            // Add screen shake for impact
            battleContainer.classList.add('punishment-screen-shake');

            // Phase 4: Cleanup after animations
            await delay(1500);
            
            // Remove all VFX elements
            [casterGlow, energyBeam, impactEffect, explosion].forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });

            // Remove chains
            casterElement.querySelectorAll('.kroudin-punishment-chain').forEach(chain => chain.remove());
            targetElement.querySelectorAll('.kroudin-punishment-impact-chain').forEach(chain => chain.remove());
            
            // Remove screen shake
            battleContainer.classList.remove('punishment-screen-shake');
            
            resolve();
        });
    }

    // VFX for ability disable effect
    function showAbilityDisableVFX(target, abilityName) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!targetElement) return;
        
        // Create disable effect
        const disableEffect = document.createElement('div');
        disableEffect.className = 'kroudin-ability-disable-vfx';
        targetElement.appendChild(disableEffect);
        
        // Add floating text showing which ability was disabled
        const disableText = document.createElement('div');
        disableText.className = 'kroudin-disable-text';
        disableText.textContent = `${abilityName} DISABLED`;
        disableEffect.appendChild(disableText);
        
        // Add dark energy particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'kroudin-disable-particle';
            particle.style.setProperty('--particle-index', i);
            disableEffect.appendChild(particle);
        }
        
        // Remove effect after animation completes
        setTimeout(() => {
            if (disableEffect && disableEffect.parentNode) {
                disableEffect.parentNode.removeChild(disableEffect);
            }
        }, 2000);
    }

    // Utility delay function
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Imprison Ability Effect
    const imprisonEffect = async (caster, target) => {
        if (!target || target.isDead()) {
            log(`${caster.name} tried to use Imprison, but no valid target.`);
            return;
        }

        log(`💀 ${caster.name} raises his chains to imprison ${target.name}!`, 'ability-cast');
        
        // Play imprison sound
        playSound('sounds/chain_imprison.mp3', 0.9);
        
        // Show imprison VFX
        await showImprisonVFX(caster, target);
        
        // Create the Imprison debuff (4 turns duration)
        const imprisonDebuff = new Effect(
            'kroudin_imprison',
            'Imprisoned',
            'Icons/effects/imprison.png',
            4, // 4 turn duration
            null,
            true // Is a debuff
        );
        
        // Set comprehensive imprison effects
        imprisonDebuff.effects = {
            cantAct: true,              // Cannot use abilities
            isUntargetable: true,       // Cannot be targeted by any abilities
            cantHeal: true,             // Cannot receive healing
            cantRestoreMana: true,      // Cannot restore mana
            cantReceiveShields: true    // Cannot receive shields
        };
        
        imprisonDebuff.setDescription('Imprisoned by spectral chains - cannot act, be targeted, healed, or receive mana/shields for 4 turns.');
        
        // NEW: Clean up VFX when debuff is removed/expired
        imprisonDebuff.onRemove = function(character) {
            try {
                const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
                if (targetElement) {
                    targetElement.querySelectorAll('.kroudin-imprison-prison, .kroudin-imprison-prison-chain, .kroudin-imprison-cage').forEach(el => el.remove());
                }
            } catch (e) {
                console.error('[Kroudin Imprison] Error cleaning VFX on debuff removal:', e);
            }
            // Recalculate stats to ensure any status flags are cleared
            if (character && typeof character.recalculateStats === 'function') {
                character.recalculateStats('imprison-debuff-removed');
            }
        };

        // Apply the debuff
        target.addDebuff(imprisonDebuff);
        log(`💀 ${target.name} is imprisoned for 4 turns!`, 'debuff');

        // Update UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
            window.gameManager.uiManager.updateCharacterUI(caster);
        }

        return true;
    };

    // VFX for Imprison ability
    async function showImprisonVFX(caster, target) {
        return new Promise(async (resolve) => {
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            const battleContainer = document.querySelector('.battle-container');
            
            if (!casterElement || !targetElement || !battleContainer) {
                resolve();
                return;
            }

            // Phase 1: Caster channels dark energy
            const casterGlow = document.createElement('div');
            casterGlow.className = 'kroudin-imprison-caster-glow';
            casterElement.appendChild(casterGlow);

            // Create floating spectral chains around caster
            for (let i = 0; i < 8; i++) {
                const chain = document.createElement('div');
                chain.className = 'kroudin-imprison-chain';
                chain.style.setProperty('--chain-index', i);
                casterElement.appendChild(chain);
            }

            // Phase 2: Dark energy travels to target
            await delay(1000);
            
            const energyBeam = document.createElement('div');
            energyBeam.className = 'kroudin-imprison-beam';
            battleContainer.appendChild(energyBeam);

            // Calculate beam position
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            const containerRect = battleContainer.getBoundingClientRect();
            
            const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
            const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
            const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
            const endY = targetRect.top + targetRect.height / 2 - containerRect.top;
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            
            energyBeam.style.left = `${startX}px`;
            energyBeam.style.top = `${startY}px`;
            energyBeam.style.width = `${distance}px`;
            energyBeam.style.transform = `rotate(${angle}rad)`;

            // Phase 3: Spectral prison forms around target
            await delay(800);
            
            const prisonEffect = document.createElement('div');
            prisonEffect.className = 'kroudin-imprison-prison';
            targetElement.appendChild(prisonEffect);

            // Create spectral chains around target
            for (let i = 0; i < 12; i++) {
                const prisonChain = document.createElement('div');
                prisonChain.className = 'kroudin-imprison-prison-chain';
                prisonChain.style.setProperty('--prison-chain-index', i);
                targetElement.appendChild(prisonChain);
            }

            // Create dark energy cage
            const cage = document.createElement('div');
            cage.className = 'kroudin-imprison-cage';
            targetElement.appendChild(cage);

            // Add screen shake for imprisonment
            battleContainer.classList.add('imprison-screen-shake');

            // Phase 4: Cleanup after animations
            await delay(2000);
            
            // Remove temporary VFX elements
            [casterGlow, energyBeam].forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });

            // Remove caster chains
            casterElement.querySelectorAll('.kroudin-imprison-chain').forEach(chain => chain.remove());
            
            // Remove screen shake
            battleContainer.classList.remove('imprison-screen-shake');
            
            // Keep prison effects on target (they will be removed when debuff expires)
            
            resolve();
        });
    }

    // Create and register the Punishment ability
    const punishmentAbility = new Ability(
        'kroudin_punishment',
        'Punishment',
        'Icons/abilities/kroudin_punishment.png',
        0, // No mana cost
        3, // 3 turn cooldown
        punishmentEffect
    ).setDescription('Deals 490 physical damage to a single target, stuns it for 1 turn and disables 2 random abilities for 3 turns.')
     .setTargetType('single_enemy');

    // Create and register the Imprison ability
    const imprisonAbility = new Ability(
        'kroudin_imprison',
        'Imprison',
        'Icons/abilities/kroudin_imprison.png',
        100, // 100 mana cost
        8,   // 8 turn cooldown
        imprisonEffect
    ).setDescription('Imprisons a target for 4 turns, preventing them from acting, being targeted, healed, or receiving mana/shields.')
     .setTargetType('single_enemy');

    // Register abilities
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilities === 'function') {
        window.AbilityFactory.registerAbilities([punishmentAbility, imprisonAbility]);
    }

    // Make abilities globally accessible immediately
    window.KroudinAbilities = {
        punishmentAbility,
        imprisonAbility,
        punishmentEffect,
        imprisonEffect,
        showPunishmentVFX,
        showImprisonVFX,
        showAbilityDisableVFX
    };

    // Make the effect functions globally accessible for AbilityFactory
    window.punishmentEffect = punishmentEffect;
    window.imprisonEffect = imprisonEffect;

    // Register the custom effect functions with AbilityFactory
    function registerKroudinEffects() {
        if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
            // Register with multiple names for compatibility
            window.AbilityFactory.registerAbilityEffect('punishmentEffect', punishmentEffect);
            window.AbilityFactory.registerAbilityEffect('kroudin_punishment', punishmentEffect);
            window.AbilityFactory.registerAbilityEffect('imprisonEffect', imprisonEffect);
            window.AbilityFactory.registerAbilityEffect('kroudin_imprison', imprisonEffect);
            console.log('[Kroudin Abilities] Registered punishmentEffect and imprisonEffect with AbilityFactory');
            return true;
        }
        return false;
    }

    // Try to register immediately
    if (!registerKroudinEffects()) {
        // If AbilityFactory isn't ready, retry after a short delay
        console.log('[Kroudin Abilities] AbilityFactory not ready, retrying in 100ms...');
        setTimeout(() => {
            if (!registerKroudinEffects()) {
                console.warn('[Kroudin Abilities] Failed to register effects after retry');
                // Try one more time after a longer delay
                setTimeout(() => {
                    registerKroudinEffects();
                }, 500);
            }
        }, 100);
    }

    // Also register on DOMContentLoaded as a final fallback
    document.addEventListener('DOMContentLoaded', () => {
        registerKroudinEffects();
    });

})();
