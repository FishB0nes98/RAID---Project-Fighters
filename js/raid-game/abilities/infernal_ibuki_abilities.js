// Ability definition for Infernal Ibuki (Playable Version)

class InfernalIbukiCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        this.kunaiStacks = 0; // Initialize passive stacks (max 15)
        this.createPassiveIndicator();
    }

    // Override useAbility to implement the Blade Expertise passive
    useAbility(abilityIndex, target) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;

        const isKunaiThrow = ability.id === 'kunai_throw';

        // Call the original useAbility method
        const abilityUsed = super.useAbility(abilityIndex, target);

        // If Kunai Throw was successfully used, apply the passive
        if (abilityUsed && isKunaiThrow) {
            this.applyBladeExpertisePassive();
        }

        return abilityUsed;
    }

    applyBladeExpertisePassive() {
        if (this.kunaiStacks < 15) { // Max 15 stacks
            this.kunaiStacks++;
            const damageBonus = this.kunaiStacks * 10; // 10% per stack
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
                indicator.title = `Blade Expertise Stacks: ${this.kunaiStacks}/15 (+${this.kunaiStacks * 10}% damage)`;
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
const kunaiThrowEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Base damage components - BALANCED: 100% Physical Damage scaling
    const baseFixedDamage = 250;
    const basePhysicalScaling = 1.0; // Changed from 1.5 to 1.0 (100%)

    // Calculate base damage before passive
    let calculatedDamage = baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling);

    // Apply Blade Expertise passive multiplier (10% per stack, max 15 stacks = 150%)
    const passiveMultiplier = (caster.kunaiStacks !== undefined) ? (1 + (caster.kunaiStacks * 0.10)) : 1; // Use 0.10 for 10%
    calculatedDamage *= passiveMultiplier;

    // Recalculate final damage, applying the passive multiplier to the total base damage
    const finalBaseDamage = (baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling)) * passiveMultiplier;

    // Use the character's calculateDamage to factor in crit/defense AFTER the passive boost
    const finalDamage = caster.calculateDamage(finalBaseDamage, 'physical', target);

    // Check for critical hit to trigger passive
    const damageResult = target.applyDamage(finalDamage, 'physical', caster, { abilityId: 'kunai_throw' });
    
    // Trigger critical hit passive if it was a crit
    if (damageResult.isCritical && typeof caster.onCriticalHit === 'function') {
        caster.onCriticalHit();
    }

    // Track statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'kunai_throw', 'use', 1);
        window.statisticsManager.recordDamageDealt(caster, target, damageResult.damage, 'physical', damageResult.isCritical, 'kunai_throw');
    }

    const stackText = caster.kunaiStacks ? ` (Passive: +${(caster.kunaiStacks * 10)}%)` : '';
    log(`${caster.name} throws a Kunai at ${target.name}, dealing ${damageResult.damage} physical damage${stackText}${damageResult.isCritical ? ' (Critical!)' : ''}`);

    // Play sounds
    playSound('sounds/kunai_throw.mp3', 0.7);

    // Show enhanced VFX
    showEnhancedKunaiTossVFX(caster, target);

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

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
const kunaiThrowAbility = new Ability(
    'kunai_throw',
    'Kunai Throw',
    'Icons/abilities/kunai_toss.png',
    40, // Mana cost
    1,  // Cooldown
    kunaiThrowEffect
).setDescription('Deals 250 + 100% Physical Damage to the target. Each use grants +10% damage permanently (max 15 stacks).')
 .setTargetType('enemy');

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
        isUntargetable: true,
        description: "Untargetable by abilities."
    };

    // Dodge bonus buff for 3 turns
    const dodgeBuff = {
        id: 'shadow_veil_dodge',
        name: 'Shadow Reflexes',
        icon: 'Icons/abilities/shadow_step.png',
        duration: 3,
        effect: (target) => {
            target.stats.dodgeChance += 0.25; // +25% dodge
        },
        onApply: (target) => {
            target.stats.dodgeChance = Math.min(0.95, target.stats.dodgeChance + 0.25); // Cap at 95%
        },
        onRemove: (target) => {
            target.stats.dodgeChance = Math.max(0, target.stats.dodgeChance - 0.25);
        },
        isDebuff: false,
        description: "+25% dodge chance."
    };

    // Apply both buffs
    const untargetableEffect = new Effect(untargetableBuff.id, untargetableBuff.name, untargetableBuff.icon, untargetableBuff.duration, untargetableBuff.effect, untargetableBuff.isDebuff);
    untargetableEffect.isUntargetable = untargetableBuff.isUntargetable;
    untargetableEffect.onApply = untargetableBuff.onApply;
    untargetableEffect.onRemove = untargetableBuff.onRemove;
    untargetableEffect.setDescription(untargetableBuff.description);

    const dodgeEffect = new Effect(dodgeBuff.id, dodgeBuff.name, dodgeBuff.icon, dodgeBuff.duration, dodgeBuff.effect, dodgeBuff.isDebuff);
    dodgeEffect.onApply = dodgeBuff.onApply;
    dodgeEffect.onRemove = dodgeBuff.onRemove;
    dodgeEffect.setDescription(dodgeBuff.description);

    caster.addBuff(untargetableEffect);
    caster.addBuff(dodgeEffect);

    // Track statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'shadow_veil', 'use', 1);
        window.statisticsManager.recordAbilityUsage(caster, 'shadow_veil', 'buff', 2); // 2 buffs applied
        window.statisticsManager.recordStatusEffect(caster, caster, 'buff', 'shadow_veil_untargetable', false, 'shadow_veil');
        window.statisticsManager.recordStatusEffect(caster, caster, 'buff', 'shadow_veil_dodge', false, 'shadow_veil');
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
const shadowVeilAbility = new Ability(
    'shadow_veil',
    'Shadow Veil',
    'Icons/abilities/shadow_step.png',
    90, // Mana cost
    11, // Cooldown
    shadowVeilEffect
).setDescription('Become untargetable by enemies for 3 turns and gain +25% dodge chance for 3 turns.')
 .setTargetType('self');
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

    // Apply critical hit check separately for each hit in the chain
    let actualDamage = baseDamage;
    let isCritical = false;
    if (Math.random() < (caster.stats.critChance || 0)) {
        actualDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
        isCritical = true;
    }

    // Apply damage (uses target's defenses)
    const damageResult = currentTarget.applyDamage(actualDamage, damageType, caster, { abilityId: 'swift_strike' });
    if (isCritical) {
        damageResult.isCritical = true;
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
    const chainChance = 0.45;
    const maxChains = 2;
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
const swiftStrikeAbility = new Ability(
    'swift_strike',
    'Swift Strike',
    'Icons/abilities/dashing_strike.webp',
    85, // Mana cost
    6,  // Cooldown - BALANCED: Reduced from 8 to 6
    swiftStrikeEffect
).setDescription('Deals 180% Physical Damage. 45% chance to dash to another enemy and repeat (max 2 chains).')
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
        obscuredDebuff.dotDamage = {
            fixedAmount: 55,
            magicalDamagePercent: 0.50
        };
        
        // Add onTurnStart callback for DOT damage
        obscuredDebuff.onTurnStart = (character) => {
            if (character.isDead()) return;
            
            // Calculate DOT damage: 55 + 50% of Ibuki's magical damage
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
        obscuredDebuff.remove = function(character) {
            // Check if any other characters still have the obscured debuff
            const allCharacters = [...(gameState.playerCharacters || []), ...(gameState.aiCharacters || [])];
            const stillObscured = allCharacters.some(char => 
                !char.isDead() && 
                char !== character && 
                char.debuffs && 
                char.debuffs.some(debuff => debuff.id.startsWith('obscured_debuff'))
            );
            
            // If no one else is obscured, remove the smoke VFX
            if (!stillObscured && window.smokeBombOverlay) {
                gameManager.addLogEntry('The obscuring smoke begins to clear...', 'system');
                
                // Add fade out animation
                window.smokeBombOverlay.style.transition = 'opacity 3s ease-out';
                window.smokeBombOverlay.style.opacity = '0';
                
                // Remove after fade out
                setTimeout(() => {
                    if (window.smokeBombOverlay && window.smokeBombOverlay.parentNode) {
                        window.smokeBombOverlay.remove();
                        window.smokeBombOverlay = null;
                    }
                }, 3000);
            }
        };
        
        // Apply the unique debuff to this enemy
        enemy.addDebuff(obscuredDebuff);
        
        // Track statistics for debuff application
        if (window.statisticsManager) {
            window.statisticsManager.recordStatusEffect(caster, enemy, 'debuff', 'obscured_debuff', true, 'smoke_bomb');
        }
        
        gameManager.addLogEntry(
            `${enemy.name} is obscured by smoke! (20% miss chance, ${Math.floor(55 + (caster.stats.magicalDamage * 0.5))} damage/turn)`,
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

const smokeBombAbility = new Ability(
    'smoke_bomb',
    'Smoke Bomb',
    'Icons/abilities/smoke_bomb.png',
    60, // Mana cost
    15, // Cooldown - BALANCED: Increased from 12 to 15
    smokeBombEffect
).setDescription('Creates obscuring smoke on the battlefield. All enemies gain Obscured for 4 turns: 20% chance to miss abilities and take 55 + 50% Magical Damage each turn.')
 .setTargetType('all_enemies');
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
        window.definedAbilities.shadow_veil = shadowVeilAbility;
        window.definedAbilities.swift_strike = swiftStrikeAbility;
        window.definedAbilities.smoke_bomb = smokeBombAbility;
    }
}); 