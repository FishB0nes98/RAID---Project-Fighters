// Ability definition for Infernal Ibuki (Playable Version)

class InfernalIbukiCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        this.kunaiStacks = 0; // Initialize passive stacks (max 15)
        // Initialize blade expertise bonus per stack, default to 0.10 (10%)
        this.bladeExpertiseBonusPerStack = 0.10; 
        this.createPassiveIndicator();

        // Expose a passiveHandler for talents that expect it (e.g., Critical Stack)
        this.passiveHandler = {
            addPassiveStack: (amount = 1) => {
                for (let i = 0; i < amount; i++) {
                    this.applyBladeExpertisePassive();
                }
            },
            // Add other passive-related methods here if needed by generic talent logic
};

// Function to apply Doubled Physical Damage VFX
window.applyDoubledPhysicalDamageVFX = function(character) {
    console.log(`[VFX DEBUG] applyDoubledPhysicalDamageVFX called for ${character.name}`);
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    if (characterElement) {
        console.log(`[VFX DEBUG] Found character element (character-slot) for ${character.name}.`);
        
        // Add the main active class to the character-slot for border/aura effect
        characterElement.classList.add('doubled-physical-damage-active');
        
        // Create a new div for the outer VFX
        let outerVfx = characterElement.querySelector('.doubled-physical-damage-outer-vfx');
        if (!outerVfx) {
            outerVfx = document.createElement('div');
            outerVfx.className = 'doubled-physical-damage-outer-vfx';
            document.body.appendChild(outerVfx); // Append to body to bypass overflow:hidden parents
        }

        // Position the fixed VFX element over the character slot
        const rect = characterElement.getBoundingClientRect();
        outerVfx.style.position = 'fixed';
        outerVfx.style.top = `${rect.top - 5}px`; // Adjust by -5px to allow for the -5px top/left/right/bottom in CSS
        outerVfx.style.left = `${rect.left - 5}px`; // Adjust by -5px
        outerVfx.style.width = `${rect.width + 10}px`; // Adjust by +10px
        outerVfx.style.height = `${rect.height + 10}px`; // Adjust by +10px

        console.log(`[VFX DEBUG] Applied Doubled Physical Damage outer VFX to ${character.name}'s character slot.`);
    } else {
        console.warn(`[VFX DEBUG] Character element (character-slot) not found for ${character.name} to apply VFX.`);
    }
};

// Function to remove Doubled Physical Damage VFX (if needed)
window.removeDoubledPhysicalDamageVFX = function(character) {
    console.log(`[VFX DEBUG] removeDoubledPhysicalDamageVFX called for ${character.name}`);
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    if (characterElement) {
        // Remove the main active class from the character-slot
        characterElement.classList.remove('doubled-physical-damage-active');
        
        // Remove the outer VFX div
        const outerVfx = characterElement.querySelector('.doubled-physical-damage-outer-vfx');
        if (outerVfx) {
            outerVfx.remove();
        }
        console.log(`[VFX DEBUG] Removed Doubled Physical Damage outer VFX from ${character.name}'s character slot.`);
    } else {
        console.warn(`[VFX DEBUG] Character element (character-slot) not found for ${character.name} to remove VFX.`);
    }
};

// Function to show smoke explosion VFX for Debilitating Strikes
window.showDebilitatingStrikesVFX = function(character) {
    console.log(`[VFX DEBUG] showDebilitatingStrikesVFX called for ${character.name}`);
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    if (characterElement) {
        console.log(`[VFX DEBUG] Found character element for ${character.name}.`);

        const smokeVfxContainer = document.createElement('div');
        smokeVfxContainer.className = 'debilitating-strikes-smoke-vfx';
        characterElement.appendChild(smokeVfxContainer);

        // Create multiple smoke particles
        for (let i = 0; i < 10; i++) {
            const smokeParticle = document.createElement('div');
            smokeParticle.className = 'smoke-particle';
            smokeParticle.style.setProperty('--delay', `${i * 0.05}s`);
            smokeParticle.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
            smokeParticle.style.setProperty('--y', `${(Math.random() - 0.5) * 200}px`);
            smokeVfxContainer.appendChild(smokeParticle);
        }

        // Play a sound effect
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/smoke_explosion.mp3', 0.6); // Placeholder sound

        setTimeout(() => {
            smokeVfxContainer.remove();
            console.log(`[VFX DEBUG] Removed Debilitating Strikes VFX for ${character.name}.`);
        }, 1500); // Duration of the animation
    } else {
        console.warn(`[VFX DEBUG] Character element not found for ${character.name} to apply Debilitating Strikes VFX.`);
    }
};

// Function to show Blazing damage VFX
window.showBlazingDamageVFX = function(character, damageAmount) {
    console.log(`[VFX DEBUG] showBlazingDamageVFX called for ${character.name}`);
    const characterElementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${characterElementId}`);
    if (characterElement) {
        console.log(`[VFX DEBUG] Found character element for ${character.name}.`);

        const blazingVfxContainer = document.createElement('div');
        blazingVfxContainer.className = 'blazing-debuff-vfx';
        characterElement.appendChild(blazingVfxContainer);

        // Create multiple flame particles
        for (let i = 0; i < 10; i++) {
            const flameParticle = document.createElement('div');
            flameParticle.className = 'blazing-flame-particle';
            flameParticle.style.setProperty('--delay', `${i * 0.05}s`);
            flameParticle.style.setProperty('--x', `${(Math.random() - 0.5) * 50}px`);
            flameParticle.style.setProperty('--y', `${(Math.random() - 0.5) * 50}px`);
            blazingVfxContainer.appendChild(flameParticle);
        }

        // Add a pulsing overlay
        const pulseOverlay = document.createElement('div');
        pulseOverlay.className = 'blazing-pulse-overlay';
        blazingVfxContainer.appendChild(pulseOverlay);

        // Add damage text
        const damageText = document.createElement('div');
        damageText.className = 'blazing-damage-text';
        damageText.textContent = `-${damageAmount}`;
        blazingVfxContainer.appendChild(damageText);

        // Play a sound effect (placeholder)
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/fire_damage.mp3', 0.6); 

        setTimeout(() => {
            blazingVfxContainer.remove();
            console.log(`[VFX DEBUG] Removed Blazing Damage VFX for ${character.name}.`);
        }, 2000); // Duration of the animation
    } else {
        console.warn(`[VFX DEBUG] Character element not found for ${character.name} to apply Blazing Damage VFX.`);
    }
};
    }

    // Override useAbility to implement the Blade Expertise passive
    useAbility(abilityIndex, target) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;

        const isKunaiThrow = ability.id === 'kunai_throw';

        // Call the original useAbility method
        const abilityUsed = super.useAbility(abilityIndex, target);

        // The passive is now applied within the kunaiThrowEffect for each kunai thrown.
        // So, no need to apply it here.
        // if (abilityUsed && isKunaiThrow) {
        //     this.applyBladeExpertisePassive();
        // }

        return abilityUsed;
    }

    applyBladeExpertisePassive() {
        if (this.kunaiStacks < 15) { // Max 15 stacks
            this.kunaiStacks++;
            // Use the dynamic bladeExpertiseBonusPerStack and round for display
            const damageBonus = Math.round(this.kunaiStacks * (this.bladeExpertiseBonusPerStack * 100)); 
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${this.name}'s Blade Expertise activates! Kunai damage permanently increased. (+${damageBonus}% total, ${this.kunaiStacks}/15 stacks)`, 'passive');

            // Update passive indicator visual
            this.updatePassiveIndicator();
        }
    }

    // Handle critical hit passive effect  
    onCriticalHit() {
        // Reduce all ability cooldowns by 1
        for (let i = 0; i < this.abilities.length; i++) {
            const ability = this.abilities[i];
            if (ability.currentCooldown > 0) {
                ability.currentCooldown = Math.max(0, ability.currentCooldown - 1);
            }
        }
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${this.name}'s Blade Expertise reduces all cooldowns by 1 turn!`, 'passive');
        
        // Update UI to show cooldown changes
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(this);
        }
    }

    // --- Passive Indicator ---
    createPassiveIndicator() {
        // Ensure this runs after DOM is ready
        if (document.readyState === 'loading') {
             document.addEventListener('DOMContentLoaded', () => this._createIndicatorElement());
        } else {
             this._createIndicatorElement();
        }
    }

    _createIndicatorElement() {
        const elementId = this.instanceId || this.id; // Use instanceId if available
        const characterElement = document.getElementById(`character-${elementId}`);
        if (characterElement) {
            let indicator = characterElement.querySelector('.kunai-mastery-indicator');
            if (!indicator) {
                const imageContainer = characterElement.querySelector('.image-container');
                 if (imageContainer) {
                    indicator = document.createElement('div');
                    indicator.className = 'kunai-mastery-indicator status-indicator'; // Add base class
                    indicator.dataset.effectId = 'kunai_mastery_passive'; // Unique ID for potential styling/removal
                    indicator.title = 'Kunai Mastery Stacks: 0';
                    imageContainer.appendChild(indicator);

                    const indicatorText = document.createElement('span');
                    indicatorText.className = 'indicator-text';
                    indicatorText.textContent = this.kunaiStacks;
                    indicator.appendChild(indicatorText);
                }
            }
        }
    }

    updatePassiveIndicator() {
        const elementId = this.instanceId || this.id;
        const characterElement = document.getElementById(`character-${elementId}`);
        if (characterElement) {
            const indicator = characterElement.querySelector('.kunai-mastery-indicator');
            if (indicator) {
                // Use the dynamic bladeExpertiseBonusPerStack for the tooltip and round for display
                const totalBonusPercentage = Math.round(this.kunaiStacks * (this.bladeExpertiseBonusPerStack * 100));
                indicator.title = `Blade Expertise Stacks: ${this.kunaiStacks}/15 (+${totalBonusPercentage}% damage)`;
                const indicatorText = indicator.querySelector('.indicator-text');
                 if (indicatorText) {
                     indicatorText.textContent = this.kunaiStacks;
                 }
                // Add animation/highlight
                indicator.classList.add('stack-added');
                setTimeout(() => indicator.classList.remove('stack-added'), 500);
                
                // Add max stacks visual if at 15 stacks
                if (this.kunaiStacks >= 15) {
                    indicator.classList.add('max-stacks');
                } else {
                    indicator.classList.remove('max-stacks');
                }
            } else {
                // If indicator wasn't created yet, try creating it now
                this._createIndicatorElement();
                this.updatePassiveIndicator(); // Call again to set text
            }
        }
    }
    // --- End Passive Indicator ---
}

// Enhance Kunai Throw Effect with better VFX
// NOTE: Do not use import here; handled by game flow for PLAYABLE version only
const kunaiThrowEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Base damage components - BALANCED: 100% Physical Damage scaling
    const baseFixedDamage = 250;
    const basePhysicalScaling = 1.0; // 100% Physical

    // Magical scaling from talent
    let magicalScaling = 0;
    if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t1')) {
        magicalScaling = 0.5;
    }

    // Apply Blade Expertise passive multiplier (using the dynamic bonus per stack)
    const passiveMultiplier = (caster.kunaiStacks !== undefined) ? (1 + (caster.kunaiStacks * (caster.bladeExpertiseBonusPerStack || 0.10))) : 1;

    // Calculate base damage for a single hit
    const calculateHitDamage = (targetCharacter) => {
        let calculatedDamage = baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling) + (caster.stats.magicalDamage * magicalScaling);
        calculatedDamage *= passiveMultiplier;

        // Shadow Strike Talent: Additional magical damage if target is Obscured
        if (caster.shadowStrikeBonusEnabled && targetCharacter.debuffs && targetCharacter.debuffs.some(d => d.id.startsWith('obscured_debuff'))) {
            const shadowStrikeBonus = caster.stats.magicalDamage * 2.0; // 200% Magical Damage
            calculatedDamage += shadowStrikeBonus;
            log(`${caster.name}'s Shadow Strike adds ${shadowStrikeBonus} magical damage to ${targetCharacter.name}!`, 'talent-enhanced');
        }
        
        return calculatedDamage;
    };

    // Determine if Kunai Barrage talent is active
    const kunaiAbilityInstance = caster.abilities.find(ab => ab.id === 'kunai_throw');
    const hitsAllEnemies = kunaiAbilityInstance && kunaiAbilityInstance.hitsAllEnemies;
    const multiTargetHitChance = (kunaiAbilityInstance && kunaiAbilityInstance.multiTargetHitChance) !== undefined ? kunaiAbilityInstance.multiTargetHitChance : 0.70;

    let targetsToHit = [];
    if (hitsAllEnemies && window.gameManager && window.gameManager.gameState) {
        const allEnemies = window.gameManager.gameState.aiCharacters.filter(enemy => !enemy.isDead());
        
        // Always hit the main target (the one selected by the user)
        targetsToHit.push(target);

        // For other enemies, check the multi-target hit chance
        allEnemies.forEach(enemy => {
            if (enemy.instanceId !== target.instanceId && Math.random() < multiTargetHitChance) {
                targetsToHit.push(enemy);
            }
        });
    } else {
        // If talent is not active, or no game state, only hit the main target
        targetsToHit.push(target);
    }

    // Determine how many kunais to throw
    const kunaiCount = (caster.canThrowTwoKunais && caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t15')) ? 2 : 1;

    for (let i = 0; i < kunaiCount; i++) {
        for (const currentTarget of targetsToHit) {
            const rawDamage = calculateHitDamage(currentTarget); // Pass currentTarget to calculateHitDamage
            const finalDamage = caster.calculateDamage(rawDamage, 'physical', currentTarget);
            const damageResult = currentTarget.applyDamage(finalDamage, 'physical', caster, { abilityId: 'kunai_throw' });

            // Debilitating Strikes VFX check
            if (caster.debilitatingStrikesEnabled && currentTarget.debuffs && currentTarget.debuffs.length > 0) {
                // Check if the target has at least one debuff
                const hasDebuff = currentTarget.debuffs.some(debuff => debuff.isDebuff === true);
                if (hasDebuff) {
                    console.log('[Debilitating Strikes] Triggering VFX on target:', currentTarget.name);
                    if (typeof window.showDebilitatingStrikesVFX === 'function') {
                        window.showDebilitatingStrikesVFX(currentTarget);
                    }
                }
            }

            if (damageResult.isCritical && typeof caster.onCriticalHit === 'function') {
                caster.onCriticalHit();
            }

            if (window.statisticsManager) {
                // Record damage dealt for each kunai
                window.statisticsManager.recordDamageDealt(caster, currentTarget, damageResult.damage, 'physical', damageResult.isCritical, 'kunai_throw');
            }

            const stackText = caster.kunaiStacks ? ` (Passive: +${Math.round(caster.kunaiStacks * (caster.bladeExpertiseBonusPerStack || 0.10) * 100)}%)` : '';
            const magicalText = magicalScaling > 0 ? ` + ${Math.round(caster.stats.magicalDamage * magicalScaling)} magic` : '';
            log(`${caster.name} throws a Kunai at ${currentTarget.name}, dealing ${damageResult.damage} physical damage${magicalText}${stackText}${damageResult.isCritical ? ' (Critical!)' : ''}`);

            playSound('sounds/kunai_throw.mp3', 0.7);
            showEnhancedKunaiTossVFX(caster, currentTarget);

            // Apply passive for each kunai
            if (typeof caster.applyBladeExpertisePassive === 'function') {
                caster.applyBladeExpertisePassive();
            }

            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(currentTarget);
            }
        }

        // For Infernal Kunais talent (infernal_ibuki_t20)
        if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t20')) {
            for (const currentTarget of targetsToHit) { // Apply debuff to all hit targets
                // Create the Blazing debuff
                const blazingDebuff = new Effect(
                    'blazing_debuff',
                    'Blazing',
                    'Icons/effects/fire.png', // Placeholder icon for the debuff
                    -1, // Permanent duration
                    null, // No direct per-turn effect function, use onTurnStart
                    true // isDebuff
                );
                blazingDebuff.setDescription(`${currentTarget.name} is burning, taking magical damage each turn.`);
                blazingDebuff.dotDamage = {
                    magicalDamagePercent: 1.0 // 100% of Ibuki's Magical Damage
                };
                // The onTurnStart function captures the 'caster' (Ibuki) from its creation scope
                blazingDebuff.onTurnStart = (characterUnderDebuff) => {
                    if (characterUnderDebuff.isDead()) return;

                    // Calculate damage based on Ibuki's current magical damage
                    const dotDamage = Math.floor(caster.stats.magicalDamage * blazingDebuff.dotDamage.magicalDamagePercent);

                    if (dotDamage > 0) {
                        characterUnderDebuff.applyDamage(dotDamage, 'magical', caster, {
                            isTalentEffect: true, // Custom flag for talent-based damage
                            abilityId: 'infernal_kunais_dot',
                            talentId: 'infernal_ibuki_t20'
                        });
                        window.gameManager.addLogEntry(
                            `${characterUnderDebuff.name} burns from Blazing for ${dotDamage} magical damage!`,
                            'debuff-effect'
                        );
                        // TODO: Add VFX for blazing damage (showBlazingDamageVFX)
                    }
                };
                // Add the debuff to the current target
                currentTarget.addDebuff(blazingDebuff);
                log(`${currentTarget.name} is now Blazing!`);
            }
        }
    }
    // Record ability usage once after all kunais are thrown
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'kunai_throw', 'use', 1);
    }

    // --- BEGIN: Ayane-style "does not end turn" logic for Kunai Mastery Awakening ---
    // If talent is active, always prevent turn end (does not call acted), matching Ayane's Q logic
    // This must work regardless of game state, and must not call acted or end the turn
    let kunaiMasteryActive = false;
    // Check for the correct talent ID only
    if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t2')) {
        kunaiMasteryActive = true;
    }

    if (kunaiMasteryActive) {
        // Set cooldown to 0 on the actual ability instance (for this use)
        if (caster.abilities && Array.isArray(caster.abilities)) {
            for (let i = 0; i < caster.abilities.length; i++) {
                const ab = caster.abilities[i];
                if (ab && (ab.id === 'kunai_throw' || ab.name === 'Kunai Throw')) {
                    ab.cooldown = 0;
                    ab.currentCooldown = 0;
                }
            }
        }
        // 17% chance NOT to end your turn (matches talent description)
        // Default to 0.17 if not set on ability
        let notEndTurnChance = 0.17;
        if (caster.abilities && Array.isArray(caster.abilities)) {
            const kunaiAbility = caster.abilities.find(ab => ab && (ab.id === 'kunai_throw' || ab.name === 'Kunai Throw'));
            if (kunaiAbility && typeof kunaiAbility.kunaiEndTurnChance === 'number') {
                notEndTurnChance = kunaiAbility.kunaiEndTurnChance;
            }
        }
        if (Math.random() < notEndTurnChance) {
            // You can act again!
            if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
                window.gameManager.addLogEntry(`${caster.name}'s Kunai Mastery Awakening: You can act again!`, 'special');
            } else {
                log(`%c${caster.name}'s Kunai Mastery Awakening: You can act again!`, 'color: #ff9900; font-weight: bold; text-shadow: 0 0 2px #fff, 0 0 8px #ff9900;');
            }
            if (window.gameManager && typeof window.gameManager.preventTurnEnd === 'function') {
                window.gameManager.preventTurnEnd();
            } else if (window.gameManager) {
                window.gameManager.preventTurnEndFlag = true;
                log(`${caster.name}'s Kunai Mastery Awakening: fallback preventTurnEndFlag`);
            }
            // Do NOT call acted or end the turn here
            // --- Fix for white screen: forcibly return here to prevent double turn logic ---
            return true;
        } else {
            // End turn as normal (do not prevent turn end)
            if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
                window.gameManager.addLogEntry(`${caster.name}'s Kunai Mastery Awakening: Your turn ends!`, 'special');
            } else {
                log(`%c${caster.name}'s Kunai Mastery Awakening: Your turn ends!`, 'color: #ff9900; font-weight: bold; text-shadow: 0 0 2px #fff, 0 0 8px #ff9900;');
            }
            // Allow normal turn end (do not set preventTurnEnd)
            return true;
        }
    }
    // --- END: Ayane-style logic ---

    return true; // Indicate successful execution
};

// Enhanced VFX for Kunai Toss
function showEnhancedKunaiTossVFX(caster, target) {
    const casterElementId = caster.instanceId || caster.id;
    const targetElementId = target.instanceId || target.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const battleContainer = document.querySelector('.battle-container');

    if (casterElement && targetElement && battleContainer) {
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = battleContainer.getBoundingClientRect();

        // Calculate start and end positions relative to the container
        const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
        const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
        const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

        const vfx = document.createElement('div');
        vfx.className = 'kunai-toss-vfx';
        vfx.style.setProperty('--start-x', `${startX}px`);
        vfx.style.setProperty('--start-y', `${startY}px`);
        vfx.style.setProperty('--end-x', `${endX}px`);
        vfx.style.setProperty('--end-y', `${endY}px`);

        // Create multiple kunai for effect
        const mainKunai = document.createElement('div');
        mainKunai.className = 'kunai-projectile';
        
        // Add shadow kunai effects
        for (let i = 0; i < 2; i++) {
            const shadowKunai = document.createElement('div');
            shadowKunai.className = 'kunai-shadow';
            shadowKunai.style.setProperty('--shadow-delay', `${i * 0.05}s`);
            vfx.appendChild(shadowKunai);
        }
        
        vfx.appendChild(mainKunai);
        battleContainer.appendChild(vfx);

        // Show impact effects on target with delay to match projectile arrival
        setTimeout(() => {
            // Create multilayered impact effect
            const impactVfx = document.createElement('div');
            impactVfx.className = 'kunai-impact-vfx';
            
            // Add particle burst on impact
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('div');
                particle.className = 'kunai-impact-particle';
                particle.style.setProperty('--particle-angle', `${i * 60}deg`);
                impactVfx.appendChild(particle);
            }
            
            targetElement.appendChild(impactVfx);
            
            // Show damage number animation
            const damageNumber = document.createElement('div');
            damageNumber.className = 'damage-number physical';
            damageNumber.textContent = target.lastDamageAmount || '?';
            damageNumber.style.setProperty('--offset-x', `${(Math.random() * 40) - 20}px`);
            targetElement.appendChild(damageNumber);
            
            // Clean up
            setTimeout(() => {
                impactVfx.remove();
                damageNumber.remove();
                vfx.remove();
            }, 1000);
        }, 450); // Slightly before projectile animation ends
    }
}


// Create Ability object
function getKunaiThrowDescription(character) {
    // Use the dynamic bladeExpertiseBonusPerStack for the description and round for display
    const expertiseBonus = character ? Math.round(character.bladeExpertiseBonusPerStack * 100) : 10;
    let desc = `Deals 250 + 100% Physical Damage to the target.\nEach use grants +${expertiseBonus}% damage permanently (max 15 stacks).`;
    let talents = [];
    if (character && Array.isArray(character.appliedTalents)) {
        talents = character.appliedTalents;
    }
    // Elemental Mastery
    if (talents.includes('infernal_ibuki_t1')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Also scales with +50% Magical Damage.</b>`;
    }
    // Kunai Mastery Awakening
    if (talents.includes('infernal_ibuki_t2')) {
        desc += `\n<b style='color:#ff9900;'>[Talent] Cooldown reduced to 0. <b>17% chance NOT to end your turn</b> (does not call acted).</b>`;
    }
    if (talents.includes('infernal_ibuki_t5')) {
        desc += `\n<b style='color:#90ee90;'>[Talent] Critical strikes heal you for 25% of the damage dealt.</b>`;
    }
    if (talents.includes('infernal_ibuki_t7')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Also benefits from +${expertiseBonus}% total damage per Blade Expertise stack.</b>`;
    }
    // Kunai Barrage
    if (talents.includes('infernal_ibuki_t11')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Now hits all enemies (100% main target, 70% other enemies).</b>`;
    }
    // Twin Shadow Strike
    if (talents.includes('infernal_ibuki_t15')) {
        desc += `\n<b style='color:#ff9900;'>[Talent] While Shadow Veil is active, throws two kunais instead of one.</b>`;
    }
    // Infernal Kunais
    if (talents.includes('infernal_ibuki_t20')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Applies a permanent Blazing debuff, dealing 100% Magical Damage per turn.</b>`;
    }
    return desc;
}

const kunaiThrowAbility = new Ability(
    'kunai_throw',
    'Kunai Throw',
    'Icons/abilities/kunai_toss.png',
    40, // Mana cost
    1,  // Cooldown (will be set to 0 by talent modifier if needed)
    kunaiThrowEffect
).setDescription(getKunaiThrowDescription())
 .setTargetType('enemy');

// Listen for talent changes and update description live
if (window.addEventListener) {
    window.addEventListener('talentsChanged', function() {
        if (kunaiThrowAbility && typeof kunaiThrowAbility.setDescription === 'function') {
            // Pass the character to getKunaiThrowDescription for dynamic updates
            const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.id === 'infernal_ibuki');
            kunaiThrowAbility.setDescription(getKunaiThrowDescription(character));
            console.log('[Kunai Q Desc] talentsChanged event: description updated');
        }
    });
    // Also update on DOMContentLoaded in case talents are set late
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (kunaiThrowAbility && typeof kunaiThrowAbility.setDescription === 'function') {
                // Pass the character to getKunaiThrowDescription for dynamic updates
                const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.id === 'infernal_ibuki');
                kunaiThrowAbility.setDescription(getKunaiThrowDescription(character));
                console.log('[Kunai Q Desc] DOMContentLoaded: description updated');
            }
        }, 100); // slight delay to allow talents to be set
    });
}

// --- Shadow Veil Ability ---

// Effect function for Shadow Veil (applies the buff)
const shadowVeilEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Untargetable buff for 3 turns
    const untargetableBuff = {
        id: 'shadow_veil_untargetable',
        name: 'Shadow Veil',
        icon: 'Icons/abilities/shadow_step.png',
        duration: 3,
        effect: (target) => {},
        onApply: (target) => {
            const targetElementId = target.instanceId || target.id;
            const targetElement = document.getElementById(`character-${targetElementId}`);
            if (targetElement) {
                targetElement.classList.add('shadow-step-active');
                const smokeContainer = document.createElement('div');
                smokeContainer.className = 'shadow-step-smoke-container';
                for (let i = 0; i < 5; i++) {
                    const smoke = document.createElement('div');
                    smoke.className = 'shadow-step-smoke';
                    smoke.style.setProperty('--i', i);
                    smokeContainer.appendChild(smoke);
                }
                targetElement.appendChild(smokeContainer);
            }
        },
        onRemove: (target) => {
             const targetElementId = target.instanceId || target.id;
             const targetElement = document.getElementById(`character-${targetElementId}`);
             if (targetElement) {
                targetElement.classList.remove('shadow-step-active');
                const smokeContainer = targetElement.querySelector('.shadow-step-smoke-container');
                if (smokeContainer) {
                    smokeContainer.remove();
                }
             }
        },
        isDebuff: false,
        isUntargetableByEnemies: true,
        description: "Untargetable by enemies only."
    };

    const talent18Active = caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t18');

    // Dodge bonus buff for 3 turns (modified by t18)
    const dodgeBuff = {
        id: talent18Active ? 'shadow_dance_mastery_dodge_t18' : 'shadow_veil_dodge',
        name: talent18Active ? 'Shadow Dance Mastery (Dodge)' : 'Shadow Reflexes',
        icon: 'Icons/abilities/shadow_step.png',
        duration: 3,
        statModifiers: [{ stat: 'dodgeChance', value: talent18Active ? 1.0 : 0.25, operation: 'set' }], // 100% dodge for t18
        isDebuff: false,
        description: talent18Active ? "100% dodge chance." : "+25% dodge chance."
    };

    // Shadow Dancer talent buff (20% crit chance)
    let shadowDancerBuff = null;
    if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t5')) {
        shadowDancerBuff = {
            id: 'shadow_dancer_crit_buff',
            name: 'Shadow Dancer',
            icon: 'Icons/abilities/shadow_step.png', // Use ability image
            duration: 3, // Same duration as Shadow Veil
            statModifiers: [{ stat: 'critChance', value: 0.20, operation: 'add' }], // +20% crit chance
            isDebuff: false,
            description: "Gain 20% crit chance while Shadow Veil is active."
        };
    }

    // Twin Shadow Strike talent: Allows Kunai Throw to throw two kunais
    let twinShadowStrikeBuff = null;
    if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t15')) {
        twinShadowStrikeBuff = {
            id: 'twin_shadow_strike_buff',
            name: 'Twin Shadow Strike',
            icon: 'Icons/talents/infernal_ibuki_t15.png',
            duration: 3, // Same duration as Shadow Veil
            onApply: (target) => {
                target.canThrowTwoKunais = true;
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`<span class="talent-enhanced">${target.name}'s Twin Shadow Strike activates! Kunai Throw now launches two kunais!</span>`);
            },
            onRemove: (target) => {
                target.canThrowTwoKunais = false;
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`<span class="talent-enhanced">${target.name}'s Twin Shadow Strike deactivates. Kunai Throw returns to single kunai.</span>`);
            },
            isDebuff: false,
            description: "Kunai Throw launches two kunais while Shadow Veil is active."
        };
    }

    // Apply buffs
    const untargetableEffect = new Effect(untargetableBuff.id, untargetableBuff.name, untargetableBuff.icon, untargetableBuff.duration, null, untargetableBuff.isDebuff);
    untargetableEffect.isUntargetableByEnemies = untargetableBuff.isUntargetableByEnemies;
    untargetableEffect.onApply = untargetableBuff.onApply;
    untargetableEffect.onRemove = untargetableBuff.onRemove;
    untargetableEffect.setDescription(untargetableBuff.description);

    const dodgeEffect = new Effect(dodgeBuff.id, dodgeBuff.name, dodgeBuff.icon, dodgeBuff.duration, null, dodgeBuff.isDebuff);
    dodgeEffect.statModifiers = dodgeBuff.statModifiers; // Assign stat modifiers directly
    dodgeEffect.setDescription(dodgeBuff.description);

    caster.addBuff(untargetableEffect);
    caster.addBuff(dodgeEffect);

    // Add Shadow Dancer buff if talent is active
    if (shadowDancerBuff) {
        const critBuffInstance = new Effect(shadowDancerBuff.id, shadowDancerBuff.name, shadowDancerBuff.icon, shadowDancerBuff.duration, null, shadowDancerBuff.isDebuff);
        critBuffInstance.statModifiers = shadowDancerBuff.statModifiers;
        critBuffInstance.setDescription(shadowDancerBuff.description);
        caster.addBuff(critBuffInstance);
    }

    // Add Twin Shadow Strike buff if talent is active
    if (twinShadowStrikeBuff) {
        const twinStrikeBuffInstance = new Effect(twinShadowStrikeBuff.id, twinShadowStrikeBuff.name, twinShadowStrikeBuff.icon, twinShadowStrikeBuff.duration, null, twinShadowStrikeBuff.isDebuff);
        twinStrikeBuffInstance.onApply = twinShadowStrikeBuff.onApply;
        twinStrikeBuffInstance.onRemove = twinShadowStrikeBuff.onRemove;
        twinStrikeBuffInstance.setDescription(twinShadowStrikeBuff.description);
        caster.addBuff(twinStrikeBuffInstance);
    }

    // Add Shadow Dance Mastery (t18) combined buff if talent is active
    if (talent18Active) {
        const shadowDanceMasteryBuff = new Effect(
            'shadow_dance_mastery_t18_buff',
            'Shadow Dance Mastery',
            'Icons/talents/infernal_ibuki_t18.png', // Using the talent icon for the combined buff
            3, // Same duration as Shadow Veil
            null, // No per-turn effect function needed for these stat mods
            false // isDebuff
        );
        shadowDanceMasteryBuff.statModifiers = [
            { stat: 'lifesteal', value: 0.30, operation: 'add' },
            { stat: 'critChance', value: 0.50, operation: 'add' },
            { stat: 'hpPerTurn', value: 50, operation: 'add' } // Corrected stat name
        ];
        shadowDanceMasteryBuff.setDescription("While in Shadow Dance, you have 100% dodge chance, gain 30% Lifesteal, 50% Crit Chance, and 50 HP Regen.");

        caster.addBuff(shadowDanceMasteryBuff);
        log(`${caster.name}'s Shadow Dance Mastery activates! She gains powerful combined buffs!`, 'talent');
    }

    // Track statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'shadow_veil', 'use', 1);
        let buffsAppliedCount = 2; // Untargetable and Dodge buffs (from base Shadow Veil)

        window.statisticsManager.recordStatusEffect(caster, caster, 'buff', untargetableBuff.id, false, 'shadow_veil');
        window.statisticsManager.recordStatusEffect(caster, caster, 'buff', dodgeBuff.id, false, 'shadow_veil');

        if (shadowDancerBuff) {
            buffsAppliedCount++;
            window.statisticsManager.recordStatusEffect(caster, caster, 'buff', shadowDancerBuff.id, false, 'shadow_veil');
        }
        if (twinShadowStrikeBuff) {
            buffsAppliedCount++;
            window.statisticsManager.recordStatusEffect(caster, caster, 'buff', twinShadowStrikeBuff.id, false, 'shadow_veil');
        }
        if (talent18Active) {
            buffsAppliedCount++; // Only one buff for Shadow Dance Mastery
            window.statisticsManager.recordStatusEffect(caster, caster, 'buff', 'shadow_dance_mastery_t18_buff', false, 'shadow_veil');
        }
        window.statisticsManager.recordAbilityUsage(caster, 'shadow_veil', 'buff', buffsAppliedCount); // Total buffs applied
    }

    log(`${caster.name} uses Shadow Veil and becomes untargetable while gaining enhanced reflexes!`, 'ability');
    playSound('sounds/shadow_step.mp3', 0.7);

    // Update UI for caster
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    return true;
};

// Create Ability object for Shadow Veil
function getShadowVeilDescription(character) {
    let desc = 'Become untargetable by enemies for 3 turns and gain +25% dodge chance for 3 turns.';
    let talents = [];
    if (character && Array.isArray(character.appliedTalents)) {
        talents = character.appliedTalents;
    }
    // Swift Shadow
    if (talents.includes('infernal_ibuki_t16')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Cooldown reduced by 2 turns.</b>`;
    }
    return desc;
}

const shadowVeilAbility = new Ability(
    'shadow_veil',
    'Shadow Veil',
    'Icons/abilities/shadow_step.png',
    90, // Mana cost
    11, // Cooldown
    shadowVeilEffect
).setDescription(getShadowVeilDescription())
 .setTargetType('self');

// Listen for talent changes and update description live
if (window.addEventListener) {
    window.addEventListener('talentsChanged', function() {
        if (shadowVeilAbility && typeof shadowVeilAbility.setDescription === 'function') {
            const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.id === 'infernal_ibuki');
            shadowVeilAbility.setDescription(getShadowVeilDescription(character));
            console.log('[Shadow Veil Desc] talentsChanged event: description updated');
        }
    });
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (shadowVeilAbility && typeof shadowVeilAbility.setDescription === 'function') {
                const character = window.gameManager?.gameState?.playerCharacters?.find(c => c.id === 'infernal_ibuki');
                shadowVeilAbility.setDescription(getShadowVeilDescription(character));
                console.log('[Shadow Veil Desc] DOMContentLoaded: description updated');
            }
        }, 100);
    });
}
// --- End Shadow Veil Ability ---

// --- Dashing Strike Ability ---

// Helper function for dash animation
async function performIbukiDash(caster, target, duration = 400) {
    const casterElementId = caster.instanceId || caster.id;
    const targetElementId = target.instanceId || target.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const battleContainer = document.querySelector('.battle-container'); // Or a more specific container

    if (!casterElement || !targetElement || !battleContainer) {
        console.error("Cannot perform dash: Missing elements.");
        return;
    }

    // Ensure the element has position: relative or absolute for transform to work as expected
    if (getComputedStyle(casterElement).position === 'static') {
        casterElement.style.position = 'relative';
    }
    casterElement.style.zIndex = '50'; // Bring caster element above others during dash

    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = battleContainer.getBoundingClientRect();

    // Calculate start and end positions relative to the container
    const startX = casterRect.left - containerRect.left; // Use left edge for origin
    const startY = casterRect.top - containerRect.top;   // Use top edge for origin
    const endX = targetRect.left - containerRect.left + targetRect.width / 2 - casterRect.width / 2; // Center on target horizontally
    const endY = targetRect.top - containerRect.top + targetRect.height / 2 - casterRect.height;   // Land slightly above the target center

    // Calculate translation distance relative to current position
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Apply animation class and transform using CSS variables
    casterElement.style.setProperty('--ibuki-dash-x', `${deltaX}px`);
    casterElement.style.setProperty('--ibuki-dash-y', `${deltaY}px`);
    casterElement.style.setProperty('--ibuki-dash-duration', `${duration}ms`);
    casterElement.classList.add('ibuki-dashing');

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration));

    // Remove animation class and reset styles
    casterElement.classList.remove('ibuki-dashing');
    casterElement.style.removeProperty('--ibuki-dash-x');
    casterElement.style.removeProperty('--ibuki-dash-y');
    casterElement.style.removeProperty('--ibuki-dash-duration');
    casterElement.style.zIndex = ''; // Reset z-index
    // casterElement.style.position = ''; // Reset position if it was changed
}


// Enhance Dashing Strike chain execution for better visuals
async function executeDashingStrikeChain(caster, currentTarget, hitTargets = [], chainCount = 0) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const delay = ms => new Promise(res => setTimeout(res, ms));

    if (!currentTarget || currentTarget.isDead()) {
        log("Dashing Strike chain stopped: Invalid target.", 'info');
        return; // Stop chain if target is invalid or dead
    }

    // Add current target to hit list
    hitTargets.push(currentTarget.instanceId || currentTarget.id);

    // --- Enhanced Animation ---
    try {
        // Add dash preparation effect
        const casterElementId = caster.instanceId || caster.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        if (casterElement) {
            // Add pre-dash effect
            const preDashEffect = document.createElement('div');
            preDashEffect.className = 'pre-dash-effect';
            casterElement.appendChild(preDashEffect);
            
            // Remove after brief animation
            setTimeout(() => preDashEffect.remove(), 300);
            
            // Play pre-dash sound
            playSound('sounds/dash_charge.mp3', 0.5);
            
            // Brief delay before actual dash
            await delay(200);
        }
        
        // Perform the dash with enhanced animation
        await performEnhancedIbukiDash(caster, currentTarget);
        
        // Optional: Add impact VFX on target after dash
        const targetElementId = currentTarget.instanceId || currentTarget.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (targetElement) {
            const impactVfx = document.createElement('div');
            impactVfx.className = 'dashing-strike-impact-vfx';
            
            // Add particle effects to the impact
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'dash-impact-particle';
                particle.style.setProperty('--particle-angle', `${i * 45}deg`);
                impactVfx.appendChild(particle);
            }
            
            targetElement.appendChild(impactVfx);
            
            // Add screen shake on impact
            document.body.classList.add('light-screen-shake');
            setTimeout(() => document.body.classList.remove('light-screen-shake'), 300);
            
            setTimeout(() => impactVfx.remove(), 800);
        }
    } catch (e) {
        console.error("Error during dash animation:", e);
    }
    // --- End Enhanced Animation ---

    // --- Damage Calculation ---
    const damageType = 'physical';
    const physicalDamagePercent = 1.8; // Updated scaling: 180%
    const baseDamage = Math.floor((caster.stats.physicalDamage || 0) * physicalDamagePercent);

    // Apply Blade Expertise passive multiplier if talent is active
    let passiveMultiplier = 1;
    if (caster.appliedTalents && caster.appliedTalents.includes('infernal_ibuki_t7') && caster.kunaiStacks !== undefined) {
        // Use the dynamic bladeExpertiseBonusPerStack
        passiveMultiplier = (1 + (caster.kunaiStacks * (caster.bladeExpertiseBonusPerStack || 0.10))); 
    }
    let actualDamage = baseDamage * passiveMultiplier;

    // Shadow Strike Talent: Additional magical damage if target is Obscured
    if (caster.shadowStrikeBonusEnabled && currentTarget.debuffs && currentTarget.debuffs.some(d => d.id.startsWith('obscured_debuff'))) {
        const shadowStrikeBonus = caster.stats.magicalDamage * 2.0; // 200% Magical Damage
        actualDamage += shadowStrikeBonus;
        log(`${caster.name}'s Shadow Strike adds ${shadowStrikeBonus} magical damage to ${currentTarget.name}!`, 'talent-enhanced');
    }

    // Apply critical hit check separately for each hit in the chain
    let isCritical = false;
    if (Math.random() < (caster.stats.critChance || 0)) {
        actualDamage = Math.floor(actualDamage * (caster.stats.critDamage || 1.5));
        isCritical = true;
    }

    // Apply damage (uses target's defenses)
    const damageResult = currentTarget.applyDamage(actualDamage, damageType, caster, { abilityId: 'swift_strike', isCritical: isCritical });
    damageResult.isCritical = isCritical; // Explicitly set the flag
    console.log(`[Urarenge Debug] damageResult.isCritical: ${damageResult.isCritical}`);

    // Debilitating Strikes VFX check
    if (caster.debilitatingStrikesEnabled && currentTarget.debuffs && currentTarget.debuffs.length > 0) {
        // Check if the target has at least one debuff
        const hasDebuff = currentTarget.debuffs.some(debuff => debuff.isDebuff === true);
        if (hasDebuff) {
            console.log('[Debilitating Strikes] Triggering VFX on target:', currentTarget.name);
            if (typeof window.showDebilitatingStrikesVFX === 'function') {
                window.showDebilitatingStrikesVFX(currentTarget);
            }
        }
    }

    // Urarenge Talent: If the attack is a critical hit, strike again
    const swiftStrikeAbility = caster.abilities.find(ability => ability.id === 'swift_strike');
    if (damageResult.isCritical && swiftStrikeAbility && swiftStrikeAbility.urarenge) {
        log(`${caster.name}'s Urarenge talent triggers, striking again!`, 'talent');
        playSound('sounds/unrelenting_assault.mp3', 0.8);

        // Apply the same damage again
        const extraDamageResult = currentTarget.applyDamage(actualDamage, damageType, caster, { abilityId: 'swift_strike_urarenge', isCritical: true });
        log(`${caster.name} strikes ${currentTarget.name} again for ${extraDamageResult.damage} physical damage!`, 'info');

        // Show floating damage number for the extra hit
        const targetElementId = currentTarget.instanceId || currentTarget.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (targetElement) {
            const extraDamageNumber = document.createElement('div');
            extraDamageNumber.className = `damage-number physical critical`;
            extraDamageNumber.textContent = extraDamageResult.damage;
            extraDamageNumber.style.setProperty('--offset-x', `${(Math.random() * 40) - 20}px`);
            extraDamageNumber.style.setProperty('--offset-y', `-30px`); // Position it slightly differently
            targetElement.appendChild(extraDamageNumber);
            setTimeout(() => extraDamageNumber.remove(), 1500);
        }
    }

    // Track statistics
    if (window.statisticsManager) {
        if (chainCount === 0) {
            // Only count as ability use on the initial hit
            window.statisticsManager.recordAbilityUsage(caster, 'swift_strike', 'use', 1);
        }
        window.statisticsManager.recordDamageDealt(caster, currentTarget, damageResult.damage, 'physical', damageResult.isCritical, chainCount === 0 ? 'swift_strike' : 'swift_strike_chain');
    }

    log(`${caster.name} dashes to ${currentTarget.name}, dealing ${damageResult.damage} physical damage${damageResult.isCritical ? ' (Critical!)' : ''}.`, 'info');
    playSound('sounds/dash_strike.mp3', 0.7);

    // Define targetElement after damage is applied (in case target was redirected)
    const targetElementId = currentTarget.instanceId || currentTarget.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);

    // Show floating damage number
    if (targetElement) {
        const damageNumber = document.createElement('div');
        damageNumber.className = `damage-number physical${damageResult.isCritical ? ' critical' : ''}`;
        damageNumber.textContent = damageResult.damage;
        damageNumber.style.setProperty('--offset-x', `${(Math.random() * 40) - 20}px`);
        targetElement.appendChild(damageNumber);
        
        // Remove after animation
        setTimeout(() => damageNumber.remove(), 1500);
    }

    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(currentTarget);
    }
    await delay(150);

    // --- Chaining Logic with enhanced visuals ---
    const chainChance = 0.55;
    const maxChains = 5;
    if (Math.random() < chainChance && chainCount < maxChains) {
        // Find next target from the caster's enemies (opposite team)
        const potentialTargets = caster.isAI 
            ? window.gameManager.gameState.playerCharacters.filter(
                enemy => enemy && !enemy.isDead() && !hitTargets.includes(enemy.instanceId || enemy.id)
            )
            : window.gameManager.gameState.aiCharacters.filter(
                enemy => enemy && !enemy.isDead() && !hitTargets.includes(enemy.instanceId || enemy.id)
            );

        if (potentialTargets.length > 0) {
            const nextTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            
            // Show chain effect
            const chainEffect = document.createElement('div');
            chainEffect.className = 'dash-chain-indicator';
            document.body.appendChild(chainEffect);
            
            // Position and animate chain indicator
            const nextTargetElement = document.getElementById(`character-${nextTarget.instanceId || nextTarget.id}`);
            if (targetElement && nextTargetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                const nextTargetRect = nextTargetElement.getBoundingClientRect();
                
                // Calculate direction vector
                const startX = targetRect.left + targetRect.width/2;
                const startY = targetRect.top + targetRect.height/2;
                const endX = nextTargetRect.left + nextTargetRect.width/2;
                const endY = nextTargetRect.top + nextTargetRect.height/2;
                
                // Position and rotate chain indicator
                const dx = endX - startX;
                const dy = endY - startY;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                chainEffect.style.width = `${distance}px`;
                chainEffect.style.left = `${startX}px`;
                chainEffect.style.top = `${startY}px`;
                chainEffect.style.transform = `rotate(${angle}deg)`;
                chainEffect.style.transformOrigin = 'left center';
                
                // Chain indicator animation
                chainEffect.classList.add('active');
                
                // Play chain sound
                playSound('sounds/ibuki_chain.mp3', 0.6);
            }
            
            log(`${caster.name}'s Dashing Strike chains to another target!`, 'info');
            await delay(400);
            
            // Remove chain indicator
            chainEffect.remove();
            
            // Recursively continue the chain
            await executeDashingStrikeChain(caster, nextTarget, hitTargets, chainCount + 1);
        } else {
            log("Dashing Strike chain stopped: No valid targets remaining.", 'info');
        }
    } else {
        log("Dashing Strike chain ended.", 'info');
    }
}

// Enhanced dash animation with better VFX
async function performEnhancedIbukiDash(caster, target, duration = 400) {
    const casterElementId = caster.instanceId || caster.id;
    const targetElementId = target.instanceId || target.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const battleContainer = document.querySelector('.battle-container');

    if (!casterElement || !targetElement || !battleContainer) {
        console.error("Cannot perform dash: Missing elements.");
        return;
    }

    // Ensure the element has position: relative or absolute for transform to work as expected
    if (getComputedStyle(casterElement).position === 'static') {
        casterElement.style.position = 'relative';
    }
    casterElement.style.zIndex = '50'; // Bring caster element above others during dash

    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = battleContainer.getBoundingClientRect();

    // Calculate start and end positions relative to the container
    const startX = casterRect.left - containerRect.left;
    const startY = casterRect.top - containerRect.top;
    const endX = targetRect.left - containerRect.left + targetRect.width / 2 - casterRect.width / 2;
    const endY = targetRect.top - containerRect.top + targetRect.height / 2 - casterRect.height;

    // Calculate translation distance relative to current position
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Create trail effect
    const trailContainer = document.createElement('div');
    trailContainer.className = 'ibuki-dash-trail-container';
    trailContainer.style.top = `${startY}px`;
    trailContainer.style.left = `${startX}px`;
    trailContainer.style.width = `${casterRect.width}px`;
    trailContainer.style.height = `${casterRect.height}px`;
    battleContainer.appendChild(trailContainer);

    // Add multiple trail elements
    for (let i = 0; i < 5; i++) {
        const trail = document.createElement('div');
        trail.className = 'ibuki-dash-trail';
        trail.style.setProperty('--trail-delay', `${i * 0.08}s`);
        trail.style.setProperty('--opacity-start', `${0.6 - (i * 0.1)}`);
        trailContainer.appendChild(trail);
    }

    // Apply animation class and transform using CSS variables
    casterElement.style.setProperty('--ibuki-dash-x', `${deltaX}px`);
    casterElement.style.setProperty('--ibuki-dash-y', `${deltaY}px`);
    casterElement.style.setProperty('--ibuki-dash-duration', `${duration}ms`);
    casterElement.classList.add('ibuki-dashing');

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration));

    // Remove animation class and reset styles
    casterElement.classList.remove('ibuki-dashing');
    casterElement.style.removeProperty('--ibuki-dash-x');
    casterElement.style.removeProperty('--ibuki-dash-y');
    casterElement.style.removeProperty('--ibuki-dash-duration');
    casterElement.style.zIndex = '';
    
    // Remove trail container
    trailContainer.remove();
}

// Main effect function called by the Ability system
const swiftStrikeEffect = async (caster, target) => {
    if (!target || target.isDead()) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${caster.name} tries Swift Strike, but the target is invalid or dead.`, 'warning');
        return false; // Indicate failure
    }

    // Start the chain with the initial target
    await executeDashingStrikeChain(caster, target, [], 0);

    return true; // Indicate successful execution (even if chain didn't continue)
};

// Create Ability object for Swift Strike
function getSwiftStrikeDescription(character) {
    // Use the dynamic bladeExpertiseBonusPerStack for the description and round for display
    const expertiseBonus = character ? Math.round(character.bladeExpertiseBonusPerStack * 100) : 10;
    let desc = `Deals 180% Physical Damage. 45% chance to dash to another enemy and repeat (max 2 chains).`;
    let talents = [];
    if (character && Array.isArray(character.appliedTalents)) {
        talents = character.appliedTalents;
    }
    if (talents.includes('infernal_ibuki_t4')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] If Swift Strike Crits, it deals damage to the same target again.</b>`;
    }
    if (talents.includes('infernal_ibuki_t5')) {
        desc += `\n<b style='color:#90ee90;'>[Talent] Critical strikes heal you for 25% of the damage dealt.</b>`;
    }
    if (talents.includes('infernal_ibuki_t7')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Also benefits from +${expertiseBonus}% total damage per Blade Expertise stack.</b>`;
    }
    if (talents.includes('infernal_ibuki_t12')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] Attacking an Obscured target deals additional 200% Magical Damage.</b>`;
    }
    if (talents.includes('infernal_ibuki_t21')) {
        desc += `\n<b style='color:#ff2222;'>[Talent] If Swift Strike Crits, it deals damage to the same target again.</b>`;
    }
    return desc;
}

const swiftStrikeAbility = new Ability(
    'swift_strike',
    'Swift Strike',
    'Icons/abilities/dashing_strike.webp',
    85, // Mana cost
    6,  // Cooldown - BALANCED: Reduced from 8 to 6
    swiftStrikeEffect
).setDescription(getSwiftStrikeDescription())
 .setTargetType('enemy');
// --- End Swift Strike Ability ---

// --- Smoke Bomb Ability ---

const smokeBombEffect = (caster, target) => {
    console.log(`[InfernalIbuki] ${caster.name} uses Smoke Bomb!`);
    
    const gameManager = window.gameManager;
    const gameState = gameManager ? gameManager.gameState : null;

    if (!gameState) {
        console.error("Smoke Bomb ability error: Cannot access game state!");
        return false;
    }

    // Get all enemy characters (proper targeting based on caster's team, like Farmer Raiden)
    const enemies = caster.isAI ? 
        (gameState.playerCharacters || []) : 
        (gameState.aiCharacters || []);
    
    if (!enemies || enemies.length === 0) {
        gameManager.addLogEntry(`${caster.name}'s Smoke Bomb has no targets!`, 'ability-use');
        return false;
    }

    // Filter out dead enemies
    const livingEnemies = enemies.filter(character => !character.isDead());
    
    if (livingEnemies.length === 0) {
        gameManager.addLogEntry(`${caster.name}'s Smoke Bomb has no living targets!`, 'ability-use');
        return false;
    }
    
    // Apply debuff to all enemies (create unique instance for each)
    livingEnemies.forEach((enemy, index) => {
        // Create unique obscured debuff for each enemy
        const obscuredDebuff = new Effect(
            `obscured_debuff_${enemy.instanceId || enemy.id}_${Date.now()}_${index}`, // Unique ID
            'Obscured',
            'Icons/effects/smoke_cloud.png',
            4,
            null,
            true // isDebuff
        );
        
        obscuredDebuff.setDescription('Obscured by smoke. 20% chance to miss abilities and takes damage each turn.');
        
        // Add custom properties for the miss chance and DOT damage
        obscuredDebuff.missChance = 0.20;
        // Find the specific smoke_bomb ability instance on the caster, which will have talent modifications
        const smokeBombAbilityInstance = caster.abilities.find(ab => ab.id === 'smoke_bomb');
        const dotFixedAmount = smokeBombAbilityInstance ? (smokeBombAbilityInstance.baseDamage || 55) : 55;
        const dotMagicalScaling = smokeBombAbilityInstance ? (smokeBombAbilityInstance.magicalScaling || 0.50) : 0.50;
        
        console.log(`[Smoke Bomb Effect Debug] Found smokeBombAbilityInstance on caster:`, smokeBombAbilityInstance);
        console.log(`[Smoke Bomb Effect Debug] Using dotFixedAmount: ${dotFixedAmount}`);
        console.log(`[Smoke Bomb Effect Debug] Using dotMagicalScaling: ${dotMagicalScaling}`);
        console.log(`[Smoke Bomb Effect Debug] caster.stats.magicalDamage: ${caster.stats.magicalDamage}`);

        obscuredDebuff.dotDamage = {
            fixedAmount: dotFixedAmount,
            magicalDamagePercent: dotMagicalScaling
        };
        
        // Add onTurnStart callback for DOT damage
        obscuredDebuff.onTurnStart = (character) => {
            if (character.isDead()) return;
            
            // Calculate DOT damage using the debuff's own properties
            const dotDamage = Math.floor(obscuredDebuff.dotDamage.fixedAmount + (caster.stats.magicalDamage * obscuredDebuff.dotDamage.magicalDamagePercent));
            
            // Apply DOT damage
            character.applyDamage(dotDamage, 'magical', caster, { 
                isStageEffect: true,
                abilityId: 'smoke_bomb_dot',
                stageModifierName: 'Obscured' 
            });
            
            // Track DOT damage in statistics
            if (window.statisticsManager) {
                window.statisticsManager.recordDamageDealt(caster, character, dotDamage, 'magical', false, 'smoke_bomb_dot');
            }
            
            gameManager.addLogEntry(
                `${character.name} takes ${dotDamage} damage from the obscuring smoke!`,
                'stage-effect damage'
            );
            
            // Create smoke damage VFX
            showSmokeDamageVFX(character, dotDamage);
        };
        
        // Add cleanup logic when debuff is removed
        obscuredDebuff.onRemove = function(character) {
            console.log(`[Smoke Bomb - ONREMOVE] Debuff for ${character.name} being removed. Initial obscuredDebuffCount: ${window.gameManager ? window.gameManager.obscuredDebuffCount : 'N/A'}`);

            // Decrement global counter for obscured debuffs
            if (window.gameManager && typeof window.gameManager.obscuredDebuffCount !== 'undefined') {
                window.gameManager.obscuredDebuffCount--;
                console.log(`[Smoke Bomb - ONREMOVE] Obscured debuff count after decrement: ${window.gameManager.obscuredDebuffCount}`);

                // If no characters are obscured AND the overlay exists, remove the VFX
                const shouldRemoveOverlay = window.gameManager.obscuredDebuffCount <= 0;
                const overlayExists = !!window.smokeBombOverlay;

                console.log(`[Smoke Bomb - ONREMOVE] Should remove overlay: ${shouldRemoveOverlay}, Overlay exists: ${overlayExists}`);

                if (shouldRemoveOverlay && overlayExists) {
                    gameManager.addLogEntry('The obscuring smoke begins to clear...', 'system');
                    window.smokeBombOverlay.style.transition = 'opacity 3s ease-out';
                    window.smokeBombOverlay.style.opacity = '0';
                    console.log('[Smoke Bomb - ONREMOVE] Initiating overlay removal with 3s fade-out.');
                    setTimeout(() => {
                        if (window.smokeBombOverlay && window.smokeBombOverlay.parentNode) {
                            window.smokeBombOverlay.remove();
                            window.smokeBombOverlay = null;
                            console.log('[Smoke Bomb - ONREMOVE] Overlay fully removed after timeout.');
                        } else {
                            console.log('[Smoke Bomb - ONREMOVE] Overlay already removed or not found during timeout.');
                        }
                    }, 3000);
                } else if (window.gameManager.obscuredDebuffCount > 0) {
                    console.log(`[Smoke Bomb - ONREMOVE] Not removing overlay: ${window.gameManager.obscuredDebuffCount} characters still obscured.`);
                } else if (!overlayExists) {
                    console.log('[Smoke Bomb - ONREMOVE] Not removing overlay: smokeBombOverlay does not exist.');
                }
            } else {
                console.warn('[Smoke Bomb - ONREMOVE] window.gameManager or obscuredDebuffCount is undefined. Cannot process removal logic.');
            }
        };
        
        // Apply the unique debuff to this enemy
        enemy.addDebuff(obscuredDebuff);

        // Initialize and increment global counter for obscured debuffs
        if (window.gameManager) {
            if (typeof window.gameManager.obscuredDebuffCount === 'undefined') {
                window.gameManager.obscuredDebuffCount = 0;
            }
            window.gameManager.obscuredDebuffCount++;
            console.log(`[Smoke Bomb] Obscured debuff applied to ${enemy.name}. Total obscured: ${window.gameManager.obscuredDebuffCount}`);
        }
        
        // Track statistics for debuff application
        if (window.statisticsManager) {
            window.statisticsManager.recordStatusEffect(caster, enemy, 'debuff', 'obscured_debuff', true, 'smoke_bomb');
        }
        
        // Calculate the actual damage once the debuff properties are set
        const actualLogDamage = Math.floor(dotFixedAmount + (caster.stats.magicalDamage * dotMagicalScaling));
        gameManager.addLogEntry(
            `${enemy.name} is obscured by smoke! (20% miss chance, ${actualLogDamage} damage/turn)`,
            'debuff-applied'
        );
    });
    
    // Track ability usage statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'smoke_bomb', 'use', 1);
        window.statisticsManager.recordAbilityUsage(caster, 'smoke_bomb', 'debuff', livingEnemies.length);
    }

    // Track quest progress for debuff applications
    if (window.questManager && window.questManager.initialized) {
        window.questManager.trackDebuffApplications(caster, 'smoke_bomb', livingEnemies.length);
    }

    // Create battlefield smoke VFX on enemy side
    createBattlefieldSmokeVFX(livingEnemies);

    return true;
};

function createBattlefieldSmokeVFX(enemies) {
    // Create smoke overlay on the enemy area (top part of the battlefield)
    const battleContainer = document.querySelector('.battle-container') || document.querySelector('.raid-game-container');
    if (!battleContainer) return;
    
    const smokeOverlay = document.createElement('div');
    smokeOverlay.className = 'battlefield-smoke-overlay';
    smokeOverlay.id = 'smoke-bomb-overlay'; // Add ID for tracking
    smokeOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 50%;
        pointer-events: none;
        z-index: 5;
        animation: battlefieldSmokeExpansion 3s ease-out;
    `;
    
    // Create dense smoke effect similar to stage modifiers
    for (let i = 0; i < 30; i++) {
            const smoke = document.createElement('div');
        smoke.className = 'battlefield-smoke-cloud';
        const size = 40 + Math.random() * 80;
        smoke.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(40, 40, 40, 0.8) 0%, rgba(60, 60, 60, 0.6) 40%, rgba(80, 80, 80, 0.3) 70%, transparent 100%);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: battlefieldSmokeSwirl ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            filter: blur(2px);
            opacity: ${0.6 + Math.random() * 0.3};
        `;
        smokeOverlay.appendChild(smoke);
    }
    
    // Add floating smoke particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'battlefield-smoke-particle';
        const size = 8 + Math.random() * 16;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(50, 50, 50, ${0.4 + Math.random() * 0.4});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: battlefieldSmokeParticleFloat ${4 + Math.random() * 3}s linear infinite;
            animation-delay: ${Math.random() * 3}s;
            filter: blur(1px);
        `;
        smokeOverlay.appendChild(particle);
    }
    
    // Add enhanced CSS animations
    if (!document.getElementById('battlefield-smoke-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'battlefield-smoke-styles';
        styleSheet.textContent = `
            @keyframes battlefieldSmokeExpansion {
                0% { 
                    transform: scale(0.3) translateY(-100%); 
                    opacity: 0; 
                }
                30% { 
                    transform: scale(1.2) translateY(0%); 
                    opacity: 0.8; 
                }
                100% { 
                    transform: scale(1) translateY(0%); 
                    opacity: 0.7; 
                }
            }
            
            @keyframes battlefieldSmokeSwirl {
                0% { 
                    transform: scale(0.8) rotate(0deg) translateY(0px); 
                    opacity: 0.5; 
                }
                25% { 
                    transform: scale(1.2) rotate(90deg) translateY(-20px); 
                    opacity: 0.8; 
                }
                50% { 
                    transform: scale(1) rotate(180deg) translateY(-10px); 
                    opacity: 0.6; 
                }
                75% { 
                    transform: scale(1.3) rotate(270deg) translateY(-30px); 
                    opacity: 0.9; 
                }
                100% { 
                    transform: scale(0.8) rotate(360deg) translateY(0px); 
                    opacity: 0.5; 
                }
            }
            
            @keyframes battlefieldSmokeParticleFloat {
                0% { 
                    transform: translateY(0px) translateX(0px) scale(0.5); 
                    opacity: 0.3; 
                }
                20% { 
                    opacity: 0.8; 
                }
                80% { 
                    opacity: 0.6; 
                }
                100% { 
                    transform: translateY(-80px) translateX(${Math.random() * 40 - 20}px) scale(0.2); 
                    opacity: 0; 
                }
            }
            
            @keyframes smokeDamageBurst {
                0% { 
                    transform: translate(-50%, -50%) scale(0.3); 
                    opacity: 0; 
                }
                30% { 
                    transform: translate(-50%, -50%) scale(1.1); 
                    opacity: 0.9; 
                }
                100% { 
                    transform: translate(-50%, -50%) scale(1.5); 
                    opacity: 0; 
                }
            }
            
            @keyframes smokeDamageText {
                0% { 
                    transform: translateX(-50%) scale(0.8); 
                    opacity: 0; 
                }
                20% { 
                    transform: translateX(-50%) scale(1.2); 
                    opacity: 1; 
                }
                100% { 
                    transform: translateX(-50%) translateY(-30px) scale(0.9); 
                    opacity: 0; 
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    battleContainer.appendChild(smokeOverlay);
    
    // Store reference for cleanup when debuffs expire
    window.smokeBombOverlay = smokeOverlay;
}

function showSmokeDamageVFX(character, damageAmount) {
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;
    
    // Create smoke damage VFX
    const smokeDamageVFX = document.createElement('div');
    smokeDamageVFX.className = 'smoke-damage-vfx';
    smokeDamageVFX.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
    `;
    
    // Create damage text
    const damageText = document.createElement('div');
    damageText.className = 'smoke-damage-text';
    damageText.textContent = `-${damageAmount}`;
    damageText.style.cssText = `
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        font-weight: bold;
        color: #ff6b6b;
        text-shadow: 
            0 0 8px rgba(80, 80, 80, 0.8),
            2px 2px 4px rgba(0, 0, 0, 0.9);
        animation: smokeDamageText 2s ease-out;
        z-index: 51;
    `;
    
    // Create smoke burst effect
    const smokeBurst = document.createElement('div');
    smokeBurst.className = 'smoke-damage-burst';
    smokeBurst.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(80, 80, 80, 0.8) 0%, rgba(60, 60, 60, 0.5) 40%, transparent 70%);
        border-radius: 50%;
        animation: smokeDamageBurst 1.5s ease-out;
        z-index: 49;
    `;
    
    smokeDamageVFX.appendChild(damageText);
    smokeDamageVFX.appendChild(smokeBurst);
    charElement.appendChild(smokeDamageVFX);
        
        // Remove VFX after animation
    setTimeout(() => {
        if (smokeDamageVFX.parentNode) {
            smokeDamageVFX.remove();
    }
    }, 2500);
}

function getSmokeBombDescription(character) {
    let baseFixedDamage = 55;
    let baseMagicalScaling = 0.50;

    let talents = [];
    if (character && Array.isArray(character.appliedTalents)) {
        talents = character.appliedTalents;
    }

    if (talents.includes('infernal_ibuki_t13')) {
        baseFixedDamage += 50;
        baseMagicalScaling += 0.20;
    }

    return `Creates obscuring smoke on the battlefield. All enemies gain Obscured for 4 turns: 20% chance to miss abilities and take ${baseFixedDamage} + ${Math.round(baseMagicalScaling * 100)}% Magical Damage each turn.`;
}

const smokeBombAbility = new Ability(
    'smoke_bomb',
    'Smoke Bomb',
    'Icons/abilities/smoke_bomb.png',
    60, // Mana cost
    15, // Cooldown - BALANCED: Increased from 12 to 15
    smokeBombEffect
).setDescription(getSmokeBombDescription())
 .setTargetType('all_enemies');
smokeBombAbility.baseDamage = 55; // Initialize baseDamage
smokeBombAbility.magicalScaling = 0.50; // Initialize magicalScaling
// --- End Smoke Bomb Ability ---


// Register the custom character class and abilities
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CharacterFactory !== 'undefined' && CharacterFactory.registerCharacterClass) {
        CharacterFactory.registerCharacterClass('infernal_ibuki', InfernalIbukiCharacter);
    } else {
        console.warn("InfernalIbukiCharacter defined but CharacterFactory not found or registerCharacterClass method missing.");
    }

    if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilities) {
        // Register all Ibuki abilities
        AbilityFactory.registerAbilities([
            kunaiThrowAbility,
            shadowVeilAbility,
            swiftStrikeAbility,
            smokeBombAbility
        ]);
    } else {
        console.warn("Ibuki abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.kunai_throw = kunaiThrowAbility;
        window.definedAbilities.shadow_veil = shadowAbilities;
        window.definedAbilities.swift_strike = swiftStrikeAbility;
        window.definedAbilities.smoke_bomb = smokeBombAbility;
    }
});

// --- Ability Description Update Hook for TalentManager ---
// This function will be called by TalentManager after talents are applied
window.updateIbukiAbilityDescriptionsForTalents = function(character) {
    if (!character) {
        // Try to find the player character instance if not provided
        if (window.gameManager && window.gameManager.gameState && window.gameManager.gameState.playerCharacters) {
            character = window.gameManager.gameState.playerCharacters.find(c => c && c.id === 'infernal_ibuki');
        }
    }
    if (!character) {
        console.warn('[Ibuki Desc Update] updateIbukiAbilityDescriptionsForTalents: No character provided or found');
        return;
    }
    // Update all abilities for this character
    if (Array.isArray(character.abilities)) {
        character.abilities.forEach(function(ability) {
            if (ability && typeof ability.setDescription === 'function') {
                if (ability.id === 'kunai_throw') {
                    ability.setDescription(getKunaiThrowDescription(character));
                } else if (ability.id === 'swift_strike') {
                    ability.setDescription(getSwiftStrikeDescription(character));
                } else if (ability.id === 'shadow_veil') {
                    ability.setDescription(getShadowVeilDescription(character));
                } else if (ability.id === 'smoke_bomb') {
                    ability.setDescription(getSmokeBombDescription(character));
                }
            }
        });
    }
    // Also update the global ability objects if they exist
    if (typeof kunaiThrowAbility !== 'undefined' && kunaiThrowAbility && typeof kunaiThrowAbility.setDescription === 'function') {
        kunaiThrowAbility.setDescription(getKunaiThrowDescription(character));
    }
    if (typeof swiftStrikeAbility !== 'undefined' && swiftStrikeAbility && typeof swiftStrikeAbility.setDescription === 'function') {
        swiftStrikeAbility.setDescription(getSwiftStrikeDescription(character));
    }
    if (typeof shadowVeilAbility !== 'undefined' && shadowVeilAbility && typeof shadowVeilAbility.setDescription === 'function') {
        shadowVeilAbility.setDescription(getShadowVeilDescription(character));
    }
    if (typeof smokeBombAbility !== 'undefined' && smokeBombAbility && typeof smokeBombAbility.setDescription === 'function') {
        smokeBombAbility.setDescription(getSmokeBombDescription(character));
    }
};
