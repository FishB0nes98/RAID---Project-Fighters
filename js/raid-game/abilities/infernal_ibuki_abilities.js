// Ability definition for Infernal Ibuki

class InfernalIbukiCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        this.kunaiStacks = 0; // Initialize passive stacks
        this.createPassiveIndicator();
    }

    // Override useAbility to implement the Kunai Mastery passive
    useAbility(abilityIndex, target) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;

        const isKunaiToss = ability.id === 'kunai_toss';

        // Call the original useAbility method
        const abilityUsed = super.useAbility(abilityIndex, target);

        // If Kunai Toss was successfully used, apply the passive
        if (abilityUsed && isKunaiToss) {
            this.applyKunaiMasteryPassive();
        }

        return abilityUsed;
    }

    applyKunaiMasteryPassive() {
        this.kunaiStacks++;
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${this.name}'s Kunai Mastery activates! Kunai Toss damage permanently increased. (Stacks: ${this.kunaiStacks})`, 'passive');

        // Update passive indicator visual
        this.updatePassiveIndicator();

        // Update UI (optional, passive stack isn't usually displayed)
        // if (typeof updateCharacterUI === 'function') {
        //     updateCharacterUI(this);
        // }
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
                indicator.title = `Kunai Mastery Stacks: ${this.kunaiStacks}`;
                const indicatorText = indicator.querySelector('.indicator-text');
                 if (indicatorText) {
                     indicatorText.textContent = this.kunaiStacks;
                 }
                // Add animation/highlight
                indicator.classList.add('stack-added');
                setTimeout(() => indicator.classList.remove('stack-added'), 500);
            } else {
                // If indicator wasn't created yet, try creating it now
                this._createIndicatorElement();
                this.updatePassiveIndicator(); // Call again to set text
            }
        }
    }
    // --- End Passive Indicator ---
}

// Enhance Kunai Toss Effect with better VFX
const kunaiTossEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Base damage components
    const baseFixedDamage = 500;
    const basePhysicalScaling = 2.0; // 200%

    // Calculate base damage before passive
    let calculatedDamage = baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling);

    // Apply Kunai Mastery passive multiplier
    // Ensure caster has kunaiStacks (check if it's an InfernalIbukiCharacter instance)
    const passiveMultiplier = (caster.kunaiStacks !== undefined) ? (1 + (caster.kunaiStacks * 0.05)) : 1; // Use 0.05 for 5%
    calculatedDamage *= passiveMultiplier;

    // Recalculate final damage, applying the passive multiplier to the total base damage
    const finalBaseDamage = (baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling)) * passiveMultiplier;

    // Use the character's calculateDamage to factor in crit/defense AFTER the passive boost
    const finalDamage = caster.calculateDamage(finalBaseDamage, 'physical');

    // Apply the damage
    target.applyDamage(finalDamage, 'physical', caster);

    log(`${caster.name} throws a Kunai at ${target.name}, dealing ${finalDamage} physical damage. (Passive Multiplier: ${passiveMultiplier.toFixed(2)}x)`);

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
const kunaiTossAbility = new Ability(
    'kunai_toss',
    'Kunai Toss',
    'Icons/abilities/kunai_toss.png',
    50, // Mana cost
    1,  // Cooldown
    kunaiTossEffect
).setDescription('Deals 500 + 200% Physical Damage to the target. Damage increases permanently each time this is used.')
 .setTargetType('enemy');

// --- Shadow Step Ability ---

// Effect function for Shadow Step (applies the buff)
const shadowStepEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    const buffData = {
        id: 'shadow_step_buff',
        name: 'Shadow Step',
        icon: 'Icons/abilities/shadow_step.png', // Use ability icon or a specific buff icon
        duration: 4,
        effect: (target) => {
            // The main effect is handled by the buff properties (isUntargetable)
            // and the CSS class applied in addBuff
        },
        onApply: (target) => {
            const targetElementId = target.instanceId || target.id;
            console.log(`[Shadow Step onApply] Trying to find element for ID: character-${targetElementId}`); // DEBUG LOG
            const targetElement = document.getElementById(`character-${targetElementId}`);
            if (targetElement) {
                console.log(`[Shadow Step onApply] Element found! Adding class and smoke.`); // DEBUG LOG
                targetElement.classList.add('shadow-step-active');
                // Create smoke effect elements
                const smokeContainer = document.createElement('div');
                smokeContainer.className = 'shadow-step-smoke-container';
                for (let i = 0; i < 5; i++) {
                    const smoke = document.createElement('div');
                    smoke.className = 'shadow-step-smoke';
                    smoke.style.setProperty('--i', i);
                    smokeContainer.appendChild(smoke);
                }
                targetElement.appendChild(smokeContainer);
            } else {
                // ---> Add a log if the element is NOT found <--- 
                console.error(`[Shadow Step onApply] Could not find element with ID: character-${targetElementId} for target ${target.name}`);
            }
        },
        onRemove: (target) => { // This also needs the element
             const targetElementId = target.instanceId || target.id;
             console.log(`[Shadow Step onRemove] Trying to find element for ID: character-${targetElementId}`); // DEBUG LOG
             const targetElement = document.getElementById(`character-${targetElementId}`);
             if (targetElement) {
                 console.log(`[Shadow Step onRemove] Element found! Removing class and smoke.`); // DEBUG LOG
                targetElement.classList.remove('shadow-step-active');
                const smokeContainer = targetElement.querySelector('.shadow-step-smoke-container');
                if (smokeContainer) {
                    smokeContainer.remove();
                }
             } else {
                 console.error(`[Shadow Step onRemove] Could not find element with ID: character-${targetElementId} for target ${target.name}`);
             }
        },
        isDebuff: false,
        // --- Key property for untargetability ---
        isUntargetable: true,
        description: "Untargetable by abilities."
    };

    const buff = new Effect(buffData.id, buffData.name, buffData.icon, buffData.duration, buffData.effect, buffData.isDebuff);
    buff.isUntargetable = buffData.isUntargetable; // Add the custom property
    buff.onApply = buffData.onApply;
    buff.onRemove = buffData.onRemove;
    buff.setDescription(buffData.description);

    caster.addBuff(buff);

    log(`${caster.name} uses Shadow Step and vanishes into the shadows!`, 'ability');
    playSound('sounds/shadow_step.mp3', 0.7); // Placeholder sound

    // Update UI for caster (to show buff icon and visual effect)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    return true; // Indicate successful execution
};

// Create Ability object for Shadow Step
const shadowStepAbility = new Ability(
    'shadow_step',
    'Shadow Step',
    'Icons/abilities/shadow_step.png',
    80, // Mana cost
    13, // Cooldown
    shadowStepEffect
).setDescription('Turns invisible and untargetable by abilities for 4 turns.')
 .setTargetType('self');
// --- End Shadow Step Ability ---

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
    const physicalDamagePercent = 3.5; // Updated scaling: 350%
    const baseDamage = Math.floor((caster.stats.physicalDamage || 0) * physicalDamagePercent);

    // Apply critical hit check separately for each hit in the chain
    let actualDamage = baseDamage;
    let isCritical = false;
    if (Math.random() < (caster.stats.critChance || 0)) {
        actualDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
        isCritical = true;
    }

    // Apply damage (uses target's defenses)
    const damageResult = currentTarget.applyDamage(actualDamage, damageType, caster);
    damageResult.isCritical = isCritical || damageResult.isCritical;

    log(`${caster.name} dashes to ${currentTarget.name}, dealing ${damageResult.damage} physical damage${damageResult.isCritical ? ' (Critical!)' : ''}.`, 'info');
    playSound('sounds/dash_strike.mp3', 0.7);

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
    const chainChance = 0.60;
    if (Math.random() < chainChance) {
        // Find next target from the caster's enemies (player characters if caster is AI)
        const potentialTargets = window.gameManager.gameState.playerCharacters.filter(
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
const dashingStrikeEffect = async (caster, target) => {
    if (!target || target.isDead()) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${caster.name} tries Dashing Strike, but the target is invalid or dead.`, 'warning');
        return false; // Indicate failure
    }

    // Start the chain with the initial target
    await executeDashingStrikeChain(caster, target, [], 0);

    return true; // Indicate successful execution (even if chain didn't continue)
};


// Create Ability object for Dashing Strike
const dashingStrikeAbility = new Ability(
    'dashing_strike',
    'Dashing Strike',
    'Icons/abilities/dashing_strike.webp', // Placeholder icon
    70, // Mana cost
    5,  // Cooldown
    dashingStrikeEffect // Use the async wrapper
).setDescription('Deals 200% Physical Damage to the target. 60% chance to dash to another enemy and repeat.')
 .setTargetType('enemy');
// --- End Dashing Strike Ability ---


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
            kunaiTossAbility,
            shadowStepAbility,
            dashingStrikeAbility // Add the new ability here
        ]);
    } else {
        console.warn("Ibuki abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.kunai_toss = kunaiTossAbility;
        window.definedAbilities.shadow_step = shadowStepAbility;
        window.definedAbilities.dashing_strike = dashingStrikeAbility;
    }
}); 