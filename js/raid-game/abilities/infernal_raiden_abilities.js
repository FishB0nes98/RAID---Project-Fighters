// Ability definition for Infernal Raiden

class InfernalRaidenCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        // Potential initialization if needed, e.g., tracking passive stacks visually
        // this.magicalDamageBoost = 0; // Track boost amount if needed for display
    }

    // Override useAbility to implement the Storm Conduit passive
    useAbility(abilityIndex, target) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;

        // Call the original useAbility method
        const abilityUsed = super.useAbility(abilityIndex, target);

        // If the ability was successfully used, apply the passive
        if (abilityUsed) {
            this.applyStormConduitPassive();
        }

        return abilityUsed;
    }

    applyStormConduitPassive() {
        const boostAmount = 45;
        this.stats.magicalDamage += boostAmount;
        // this.magicalDamageBoost += boostAmount; // Update tracked boost if needed

        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${this.name}'s Storm Conduit activates, gaining ${boostAmount} Magic Damage permanently. (Current Base: ${this.stats.magicalDamage})`, 'passive');

        // Optional: Add VFX for passive activation
        this.showPassiveActivationVFX();

        // Update UI to reflect potentially changed stats (though magicalDamage isn't directly displayed)
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(this);
        }
    }

    showPassiveActivationVFX() {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            const vfx = document.createElement('div');
            vfx.className = 'storm-conduit-vfx'; // Use a class defined in CSS
            // Add some visual elements like lightning sparks
            for (let i = 0; i < 5; i++) {
                const spark = document.createElement('div');
                spark.className = 'storm-spark';
                spark.style.setProperty('--angle', `${Math.random() * 360}deg`);
                spark.style.setProperty('--delay', `${Math.random() * 0.5}s`);
                vfx.appendChild(spark);
            }
            characterElement.appendChild(vfx);
            setTimeout(() => vfx.remove(), 1500); // Remove after animation
        }
    }
}

// --- MODIFIED: Blazing Lightning Ball Debuff Application ---
const blazingLightningBallEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    const debuffId = 'blazing_lightning_ball_debuff';
    const duration = 10;

    // Create and add the new debuff instance (always add for stacking)
    const debuff = new Effect(
        debuffId,
        'Blazing Lightning Ball', // Name remains the same
        'Icons/abilities/blazing_lightning_ball.png',
        duration,
        null, // No per-turn effect function anymore
        true // isDebuff = true
    );

    // Count existing stacks *before* adding the new one for logging
    const existingStacks = target.debuffs.filter(d => d.id === debuffId).length;

    debuff.setDescription(`A mark of storm energy. Increases damage taken from Raiden's abilities. Stacks: ${existingStacks + 1}.`);

    // --- NEW: Add stack property for potential UI display ---
    debuff.stacks = existingStacks + 1;
    // --- END NEW ---

    // Add cleanup function (optional, but good practice)
    debuff.remove = function(character) {
        log(`Blazing Lightning Ball mark fades from ${character.name}.`, 'status');
        // Optional: Trigger UI update if stacks are displayed visually
        if (typeof updateCharacterUI === 'function') {
             updateCharacterUI(character);
        }
    };

    target.addDebuff(debuff);
    log(`${caster.name} places a Blazing Lightning Ball mark on ${target.name}. (Stack ${existingStacks + 1})`, 'debuff');

    // Show placement VFX (reuse existing function)
    showBlazingBallPlacementVFX(target);

    // Play sounds
    playSound('sounds/raiden_lightning_cast.mp3', 0.7); // Placeholder sound

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

    return true;
};

// --- NEW: Thunder From The Sky Ability Effect ---
const thunderFromTheSkyEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const abilityName = "Thunder From The Sky"; // For logging

    if (!target || target.isDead()) {
        log(`${caster.name} tries to use ${abilityName}, but the target is invalid.`);
        return false; // Indicate failure if target is invalid
    }

    // 1. Calculate Stacks
    const debuffId = 'blazing_lightning_ball_debuff';
    const stacks = target.debuffs.filter(d => d.id === debuffId).length;
    log(`Found ${stacks} Blazing Lightning Ball stacks on ${target.name}.`, 'info');

    // 2. Calculate Base Damage
    let baseDamage = Math.floor(caster.stats.magicalDamage * 1.0); // 100% Magic Damage

    // 3. Calculate Multiplier
    const multiplier = Math.pow(2, stacks);
    if (multiplier > 1) {
        log(`${abilityName} damage multiplied by ${multiplier}x due to stacks!`, 'buff-effect');
    }

    // 4. Calculate Final Damage
    let finalDamage = Math.floor(baseDamage * multiplier);

    // --- Crit Check (Optional but standard for damage abilities) ---
    let isCritical = false;
    if (Math.random() < (caster.stats.critChance || 0)) {
        finalDamage = Math.floor(finalDamage * (caster.stats.critDamage || 1.5));
        isCritical = true;
    }
    // --- End Crit Check ---

    // 5. Apply Damage
    const damageResult = target.applyDamage(finalDamage, 'magical', caster);
    damageResult.isCritical = isCritical || damageResult.isCritical; // Preserve crit status

    let damageLog = `${caster.name} strikes ${target.name} with ${abilityName} for ${damageResult.damage} magic damage`;
    if (damageResult.isCritical) damageLog += " (Critical Hit!)";
    log(damageLog, damageResult.isCritical ? 'critical' : '');


    // 6. Apply Stun (if target survived and wasn't dodged)
    if (!target.isDead() && !damageResult.dodged) {
        const stunId = 'stun';
        const stunDuration = 2;
        const existingStun = target.debuffs.find(d => d.id === stunId || (d.effects && d.effects.cantAct));
        if (existingStun) {
            // Optionally refresh duration or just log
             existingStun.duration = Math.max(existingStun.duration, stunDuration); // Refresh
             log(`${target.name} is already stunned. Refreshed duration.`);
        } else {
            const stunDebuff = new Effect(
                stunId,
                'Stunned',
                'Icons/effects/stun.png', // Standard stun icon
                stunDuration,
                null, // No per-turn effect
                true // isDebuff = true
            );
            stunDebuff.effects = { cantAct: true }; // Mark as unable to act
            stunDebuff.setDescription('Cannot act for 2 turns.');

            target.addDebuff(stunDebuff);
            log(`${target.name} is stunned by ${abilityName} for ${stunDuration} turns!`, 'debuff');
        }
    }

    // 7. Play Sounds & VFX
    playSound('sounds/raiden_thunder_strike.mp3', 0.8); // Placeholder sound
    showThunderStrikeVFX(target);

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        // Caster UI update happens automatically via Ability.use -> Character.useAbility
    }

    // Trigger passive AFTER the ability effect resolves
    // Note: The passive trigger is already handled in the overridden Character.useAbility

    return true; // Indicate success
};
// Make the function globally accessible for the AbilityFactory
window.thunderFromTheSkyEffect = thunderFromTheSkyEffect;


// --- NEW: Thunderstruck (Infernal Version) Ability Effect ---
const thunderstruckInfernalEffect = (caster, targets) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const abilityName = "Thunderstruck (Infernal Version)";

    if (!Array.isArray(targets) || targets.length === 0) {
        log(`${caster.name} used ${abilityName}, but there were no valid targets.`);
        return false;
    }

    log(`${caster.name} unleashes ${abilityName} on ${targets.length} enemies!`);
    playSound('sounds/raiden_aoe_thunder.mp3', 0.9); // Placeholder sound

    targets.forEach(target => {
        if (!target || target.isDead()) return;

        // 1. Calculate Damage
        let damageAmount = Math.floor(caster.stats.magicalDamage * 1.50); // 150% Magic Damage

        // 2. Crit Check (Standard)
        let isCritical = false;
        if (Math.random() < (caster.stats.critChance || 0)) {
            damageAmount = Math.floor(damageAmount * (caster.stats.critDamage || 1.5));
            isCritical = true;
        }

        // 3. Apply Damage
        const damageResult = target.applyDamage(damageAmount, 'magical', caster);
        damageResult.isCritical = isCritical || damageResult.isCritical; // Preserve crit status

        // 4. Log Damage
        let damageLog = `${target.name} is struck by ${abilityName} for ${damageResult.damage} magic damage`;
        if (damageResult.isCritical) damageLog += " (Critical Hit!)";
        log(damageLog, damageResult.isCritical ? 'critical' : '');

        // 5. Apply VFX to each target
        showThunderstruckVFX(target);

        // 6. Update Target UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
        }
    });

    // Trigger passive AFTER the ability effect resolves (Handled by Character override)
    return true; // Indicate success
};
// Make the function globally accessible for the AbilityFactory
window.thunderstruckInfernalEffect = thunderstruckInfernalEffect;

// Enhanced VFX for Thunder From The Sky
function showThunderStrikeVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        // Create the container for the VFX
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'thunder-strike-vfx-container';
        
        // Create main lightning bolt
        const bolt = document.createElement('div');
        bolt.className = 'thunder-strike-bolt';
        vfxContainer.appendChild(bolt);
        
        // Create impact
        const impact = document.createElement('div');
        impact.className = 'thunder-strike-impact';
        vfxContainer.appendChild(impact);
        
        // Add screen flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'thunder-screen-flash';
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.zIndex = '1000';
        flashOverlay.style.opacity = '0';
        document.body.appendChild(flashOverlay);
        
        // Animate flash
        setTimeout(() => { flashOverlay.style.opacity = '0.7'; }, 100);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 200);
        setTimeout(() => { flashOverlay.style.opacity = '0.4'; }, 300);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 400);
        setTimeout(() => { flashOverlay.remove(); }, 500);
        
        // Add shake effect to target
        targetElement.style.animation = 'thunder-target-shake 0.5s ease-in-out';
        
        // Add stun indicators if target is stunned
        setTimeout(() => {
            // Check if target is still valid (not removed)
            if (document.body.contains(targetElement)) {
                const stunIndicator = document.createElement('div');
                stunIndicator.className = 'stun-indicator';
                stunIndicator.innerHTML = `
                    <div class="stun-star" style="--delay: 0s; --rotate: 0deg;"></div>
                    <div class="stun-star" style="--delay: 0.2s; --rotate: 45deg;"></div>
                    <div class="stun-star" style="--delay: 0.4s; --rotate: 90deg;"></div>
                `;
                targetElement.appendChild(stunIndicator);
                
                // Remove stun indicator after animation
                setTimeout(() => stunIndicator.remove(), 2000);
                
                // Reset shake animation
                targetElement.style.animation = '';
            }
        }, 500);
        
        // Append the VFX container to the target element
        targetElement.appendChild(vfxContainer);
        
        // Remove the container after animation completes
        setTimeout(() => vfxContainer.remove(), 1500);
    }
}

// Enhanced VFX for Thunderstruck
function showThunderstruckVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'thunderstruck-vfx-container';

        // Create multiple lightning bolts with different positions and timings
        for (let i = 0; i < 4; i++) {
            const bolt = document.createElement('div');
            bolt.className = 'thunderstruck-bolt-small';
            bolt.style.setProperty('--delay', `${i * 0.15}s`);
            bolt.style.setProperty('--offset-x', `${(Math.random() * 2 - 1) * 50}%`);
            bolt.style.setProperty('--rotate-y', `${(Math.random() * 30 - 15)}deg`);
            vfxContainer.appendChild(bolt);
        }
        
        // Add an impact flash
        const impactFlash = document.createElement('div');
        impactFlash.className = 'thunderstruck-impact-flash';
        vfxContainer.appendChild(impactFlash);

        // Add small particle effects
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'thunderstruck-particle';
            particle.style.setProperty('--particle-delay', `${i * 0.08}s`);
            particle.style.setProperty('--particle-angle', `${i * 45}deg`);
            particle.style.setProperty('--particle-distance', `${40 + Math.random() * 20}px`);
            vfxContainer.appendChild(particle);
        }
        
        // Add screen flash effect for AoE
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'thunder-screen-flash';
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(180, 180, 255, 0.3)';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.zIndex = '1000';
        flashOverlay.style.opacity = '0';
        document.body.appendChild(flashOverlay);
        
        // Animate flash with a blue tint for AoE
        setTimeout(() => { flashOverlay.style.opacity = '0.5'; }, 100);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 200);
        setTimeout(() => { flashOverlay.style.opacity = '0.3'; }, 350);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 500);
        setTimeout(() => { flashOverlay.remove(); }, 600);
        
        // Add gentle shake animation to target
        targetElement.style.animation = 'thunderstruck-target-shake 0.7s ease-in-out';
        setTimeout(() => { targetElement.style.animation = ''; }, 700);
        
        targetElement.appendChild(vfxContainer);
        setTimeout(() => vfxContainer.remove(), 1500);
    }
}

// VFX for placing the ball (keep this)
function showBlazingBallPlacementVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        const vfx = document.createElement('div');
        vfx.className = 'blazing-ball-placement-vfx'; // Defined in CSS

        const ball = document.createElement('div');
        ball.className = 'blazing-ball-core';
        vfx.appendChild(ball);

        targetElement.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1500);
    }
}

// Enhanced VFX for Teleportation
function showTeleportationVFX(caster) {
    const elementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${elementId}`);
    if (casterElement) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        log(`${caster.name} uses Teleportation!`, 'buff');
        playSound('sounds/teleport_whoosh.mp3', 0.7);

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'teleportation-vfx-container';

        // Create teleportation ring effect
        const teleRing = document.createElement('div');
        teleRing.className = 'teleportation-ring';
        vfxContainer.appendChild(teleRing);

        // Apply fade-out animation to the character image/sprite
        const imgElement = casterElement.querySelector('img');
        if (imgElement) {
            imgElement.classList.add('teleportation-fade-out');
        } else {
            casterElement.classList.add('teleportation-fade-out');
        }

        // Add more varied sparkles during the fade-out/in
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'teleportation-sparkle';
            sparkle.style.setProperty('--sparkle-x', `${Math.random() * 80 + 10}%`);
            sparkle.style.setProperty('--sparkle-y', `${Math.random() * 80 + 10}%`);
            sparkle.style.setProperty('--sparkle-delay', `${Math.random() * 0.5}s`);
            sparkle.style.setProperty('--sparkle-size', `${Math.random() * 5 + 3}px`);
            
            // Add random colors to sparkles
            const hue = 180 + Math.random() * 30;
            const lightness = 70 + Math.random() * 30;
            sparkle.style.setProperty('--sparkle-color', `hsl(${hue}, 100%, ${lightness}%)`);
            
            vfxContainer.appendChild(sparkle);
        }

        casterElement.appendChild(vfxContainer);

        // Apply fade-in after a delay and remove VFX container
        setTimeout(() => {
            if (imgElement) {
                imgElement.classList.remove('teleportation-fade-out');
                imgElement.classList.add('teleportation-fade-in');
            } else {
                casterElement.classList.remove('teleportation-fade-out');
                casterElement.classList.add('teleportation-fade-in');
            }

            // Add post-teleport sparkles
            for (let i = 0; i < 8; i++) {
                const postSparkle = document.createElement('div');
                postSparkle.className = 'teleportation-post-sparkle';
                postSparkle.style.setProperty('--sparkle-x', `${Math.random() * 80 + 10}%`);
                postSparkle.style.setProperty('--sparkle-y', `${Math.random() * 80 + 10}%`);
                postSparkle.style.setProperty('--sparkle-angle', `${i * 45}deg`);
                vfxContainer.appendChild(postSparkle);
            }

            // Remove fade-in class after animation completes
            setTimeout(() => {
                if (imgElement) {
                    imgElement.classList.remove('teleportation-fade-in');
                } else {
                    casterElement.classList.remove('teleportation-fade-in');
                }
                
                // Add buff indicator effect
                const buffIndicator = document.createElement('div');
                buffIndicator.className = 'teleportation-buff-indicator';
                casterElement.appendChild(buffIndicator);
                
                setTimeout(() => {
                    vfxContainer.remove(); // Clean up sparkles container
                    setTimeout(() => buffIndicator.remove(), 2000); // Remove buff indicator after 2s
                }, 500);
            }, 400); // Corresponds to fade-in duration

        }, 300); // Corresponds to fade-out duration
    }
}

// Create Ability object for Blazing Lightning Ball (using the modified effect)
const blazingLightningBallAbility = new Ability(
    'blazing_lightning_ball',
    'Blazing Lightning Ball',
    'Icons/abilities/blazing_lightning_ball.png',
    50, // Mana cost
    2,  // Cooldown
    blazingLightningBallEffect // Use the modified effect function
).setDescription("Places a stackable Blazing Lightning Ball mark on the target for 4 turns. Raiden's damaging abilities deal doubled damage per stack.")
 .setTargetType('enemy');

// Register the custom character class and abilities
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CharacterFactory !== 'undefined' && CharacterFactory.registerCharacterClass) {
        CharacterFactory.registerCharacterClass('infernal_raiden', InfernalRaidenCharacter);
    } else {
        console.warn("InfernalRaidenCharacter defined but CharacterFactory not found or registerCharacterClass method missing.");
    }

    // Register Blazing Lightning Ball (using the updated Ability object)
    // Thunder From The Sky will be handled by the AbilityFactory using the 'custom' type and window.thunderFromTheSkyEffect
    if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilities) {
        AbilityFactory.registerAbilities([blazingLightningBallAbility]); // Only register BLB explicitly
    } else {
        console.warn("Infernal Raiden abilities defined but AbilityFactory not found or registerAbilities method missing.");
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.blazing_lightning_ball = blazingLightningBallAbility;
        // No need to register thunder_from_the_sky here if using custom type
    }

    // --- MODIFIED: Added listener for Teleportation VFX ---
    document.addEventListener('AbilityUsed', (event) => {
        const { caster, ability } = event.detail;
        if (ability.id === 'teleportation' && caster.id === 'infernal_raiden') {
            showTeleportationVFX(caster);
        }
        // Add listeners for other Raiden ability VFX if needed
        // Example:
        // if (ability.id === 'blazing_lightning_ball' && caster.id === 'infernal_raiden') {
        //     showBlazingBallPlacementVFX(event.detail.target);
        // }
    });
    // --- END MODIFICATION ---
}); 