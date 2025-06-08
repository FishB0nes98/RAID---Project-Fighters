// Ability definitions for Infernal Raiden

// Storm Conduit Passive Implementation
const stormConduitPassive = (character) => {
    const boostAmount = 45;
    character.stats.magicalDamage += boostAmount;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    log(`${character.name}'s Storm Conduit activates, gaining ${boostAmount} Magic Damage permanently. (Current: ${character.stats.magicalDamage})`, 'passive');

    // Show passive VFX
    showStormConduitVFX(character);

    // Update UI to reflect stat changes
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(character);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(character);
    }

    return true;
};

// Make passive globally accessible
window.stormConduitPassive = stormConduitPassive;

class InfernalRaidenCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
    }

    // Override useAbility to implement the Storm Conduit passive
    useAbility(abilityIndex, target) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;

        // Call the original useAbility method
        const abilityUsed = super.useAbility(abilityIndex, target);

        // If the ability was successfully used, apply the passive
        if (abilityUsed && this.passive && this.passive.functionName === 'stormConduitPassive') {
            stormConduitPassive(this);
        }

        return abilityUsed;
    }
}

// --- Blazing Lightning Ball Debuff Application ---
const blazingLightningBallEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    const debuffId = 'blazing_lightning_ball_debuff';
    const duration = 10;

    // Create and add the new debuff instance (always add for stacking)
    const debuff = new Effect(
        debuffId,
        'Blazing Lightning Ball',
        'Icons/abilities/blazing_lightning_ball.png',
        duration,
        null,
        true // isDebuff = true
    );

    // Count existing stacks *before* adding the new one for logging
    const existingStacks = target.debuffs.filter(d => d.id === debuffId).length;

    debuff.setDescription(`A mark of storm energy. Increases damage taken from Raiden's abilities. Stacks: ${existingStacks + 1}.`);
    debuff.stacks = existingStacks + 1;

    // Add cleanup function
    debuff.remove = function(character) {
        log(`Blazing Lightning Ball mark fades from ${character.name}.`, 'status');
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character);
        } else if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(character);
        }
    };

    target.addDebuff(debuff);
    log(`${caster.name} places a Blazing Lightning Ball mark on ${target.name}. (Stack ${existingStacks + 1})`, 'debuff');

    // Show placement VFX
    showBlazingBallPlacementVFX(target);

    // Play sounds
    playSound('sounds/raiden_lightning_cast.mp3', 0.7);

    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

    return true;
};

// --- Thunder From The Sky Ability Effect ---
const thunderFromTheSkyEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const abilityName = "Thunder From The Sky";

    if (!target || target.isDead()) {
        log(`${caster.name} tries to use ${abilityName}, but the target is invalid.`);
        return false;
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

    // 5. Crit Check
    let isCritical = false;
    if (Math.random() < (caster.stats.critChance || 0)) {
        finalDamage = Math.floor(finalDamage * (caster.stats.critDamage || 1.5));
        isCritical = true;
    }

    // 6. Apply Damage
    const damageResult = target.applyDamage(finalDamage, 'magical', caster);
    damageResult.isCritical = isCritical || damageResult.isCritical;

    let damageLog = `${caster.name} strikes ${target.name} with ${abilityName} for ${damageResult.damage} magic damage`;
    if (damageResult.isCritical) damageLog += " (Critical Hit!)";
    log(damageLog, damageResult.isCritical ? 'critical' : '');

    // 7. Apply Stun (if target survived and wasn't dodged)
    if (!target.isDead() && !damageResult.dodged) {
        const stunId = 'stun';
        const stunDuration = 2;
        const existingStun = target.debuffs.find(d => d.id === stunId || (d.effects && d.effects.cantAct));
        if (existingStun) {
            existingStun.duration = Math.max(existingStun.duration, stunDuration);
            log(`${target.name} is already stunned. Refreshed duration.`);
        } else {
            const stunDebuff = new Effect(
                stunId,
                'Stunned',
                'Icons/effects/stun.png',
                stunDuration,
                null,
                true
            );
            stunDebuff.effects = { cantAct: true };
            stunDebuff.setDescription('Cannot act for 2 turns.');

            target.addDebuff(stunDebuff);
            log(`${target.name} is stunned by ${abilityName} for ${stunDuration} turns!`, 'debuff');
        }
    }

    // 8. Play Sounds & VFX
    playSound('sounds/raiden_thunder_strike.mp3', 0.8);
    showThunderStrikeVFX(target);

    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    } else if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

    return true;
};

// --- Thunderstruck (Infernal Version) Ability Effect ---
const thunderstruckInfernalEffect = (caster, targets) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const abilityName = "Thunderstruck (Infernal Version)";

    if (!Array.isArray(targets) || targets.length === 0) {
        log(`${caster.name} used ${abilityName}, but there were no valid targets.`);
        return false;
    }

    log(`${caster.name} unleashes ${abilityName} on ${targets.length} enemies!`);
    playSound('sounds/raiden_aoe_thunder.mp3', 0.9);

    targets.forEach(target => {
        if (!target || target.isDead()) return;

        // 1. Calculate Damage
        let damageAmount = Math.floor(caster.stats.magicalDamage * 1.50); // 150% Magic Damage

        // 2. Crit Check
        let isCritical = false;
        if (Math.random() < (caster.stats.critChance || 0)) {
            damageAmount = Math.floor(damageAmount * (caster.stats.critDamage || 1.5));
            isCritical = true;
        }

        // 3. Apply Damage
        const damageResult = target.applyDamage(damageAmount, 'magical', caster);
        damageResult.isCritical = isCritical || damageResult.isCritical;

        // 4. Log Damage
        let damageLog = `${target.name} is struck by ${abilityName} for ${damageResult.damage} magic damage`;
        if (damageResult.isCritical) damageLog += " (Critical Hit!)";
        log(damageLog, damageResult.isCritical ? 'critical' : '');

        // 5. Apply VFX to each target
        showThunderstruckVFX(target);

        // 6. Update Target UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
        } else if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
        }
    });

    return true;
};

// Make functions globally accessible
window.blazingLightningBallEffect = blazingLightningBallEffect;
window.thunderFromTheSkyEffect = thunderFromTheSkyEffect;
window.thunderstruckInfernalEffect = thunderstruckInfernalEffect;

// Register immediately if AbilityFactory is already available
if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
    console.log('[InfernalRaiden] AbilityFactory found, registering effects immediately');
    AbilityFactory.registerAbilityEffect('blazingLightningBallEffect', blazingLightningBallEffect);
    AbilityFactory.registerAbilityEffect('thunderFromTheSkyEffect', thunderFromTheSkyEffect);
    AbilityFactory.registerAbilityEffect('thunderstruckInfernalEffect', thunderstruckInfernalEffect);
    AbilityFactory.registerAbilityEffect('stormConduitPassive', stormConduitPassive);
}

// VFX Functions
function showStormConduitVFX(character) {
    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (characterElement) {
        const vfx = document.createElement('div');
        vfx.className = 'storm-conduit-vfx';
        
        // Add lightning sparks
        for (let i = 0; i < 5; i++) {
            const spark = document.createElement('div');
            spark.className = 'storm-spark';
            spark.style.setProperty('--angle', `${Math.random() * 360}deg`);
            spark.style.setProperty('--delay', `${Math.random() * 0.5}s`);
            vfx.appendChild(spark);
        }
        
        characterElement.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1500);
    }
}

function showThunderStrikeVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'thunder-strike-vfx-container';
        
        const bolt = document.createElement('div');
        bolt.className = 'thunder-strike-bolt';
        vfxContainer.appendChild(bolt);
        
        const impact = document.createElement('div');
        impact.className = 'thunder-strike-impact';
        vfxContainer.appendChild(impact);
        
        // Screen flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'thunder-screen-flash';
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
        `;
        document.body.appendChild(flashOverlay);
        
        // Animate flash
        setTimeout(() => { flashOverlay.style.opacity = '0.7'; }, 100);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 200);
        setTimeout(() => { flashOverlay.style.opacity = '0.4'; }, 300);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 400);
        setTimeout(() => { flashOverlay.remove(); }, 500);
        
        // Target shake
        targetElement.style.animation = 'thunder-target-shake 0.5s ease-in-out';
        
        // Add stun indicators
        setTimeout(() => {
            if (document.body.contains(targetElement)) {
                const stunIndicator = document.createElement('div');
                stunIndicator.className = 'stun-indicator';
                stunIndicator.innerHTML = `
                    <div class="stun-star" style="--delay: 0s; --rotate: 0deg;"></div>
                    <div class="stun-star" style="--delay: 0.2s; --rotate: 45deg;"></div>
                    <div class="stun-star" style="--delay: 0.4s; --rotate: 90deg;"></div>
                `;
                targetElement.appendChild(stunIndicator);
                
                setTimeout(() => stunIndicator.remove(), 2000);
                targetElement.style.animation = '';
            }
        }, 500);
        
        targetElement.appendChild(vfxContainer);
        setTimeout(() => vfxContainer.remove(), 1500);
    }
}

function showThunderstruckVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'thunderstruck-vfx-container';

        // Create multiple lightning bolts
        for (let i = 0; i < 4; i++) {
            const bolt = document.createElement('div');
            bolt.className = 'thunderstruck-bolt-small';
            bolt.style.setProperty('--delay', `${i * 0.15}s`);
            bolt.style.setProperty('--offset-x', `${(Math.random() * 2 - 1) * 50}%`);
            bolt.style.setProperty('--rotate-y', `${(Math.random() * 30 - 15)}deg`);
            vfxContainer.appendChild(bolt);
        }
        
        const impactFlash = document.createElement('div');
        impactFlash.className = 'thunderstruck-impact-flash';
        vfxContainer.appendChild(impactFlash);

        // Add particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'thunderstruck-particle';
            particle.style.setProperty('--particle-delay', `${i * 0.08}s`);
            particle.style.setProperty('--particle-angle', `${i * 45}deg`);
            particle.style.setProperty('--particle-distance', `${40 + Math.random() * 20}px`);
            vfxContainer.appendChild(particle);
        }
        
        // Screen flash
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'thunder-screen-flash';
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(180, 180, 255, 0.3);
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
        `;
        document.body.appendChild(flashOverlay);
        
        setTimeout(() => { flashOverlay.style.opacity = '0.5'; }, 100);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 200);
        setTimeout(() => { flashOverlay.style.opacity = '0.3'; }, 350);
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 500);
        setTimeout(() => { flashOverlay.remove(); }, 600);
        
        targetElement.style.animation = 'thunderstruck-target-shake 0.7s ease-in-out';
        setTimeout(() => { targetElement.style.animation = ''; }, 700);
        
        targetElement.appendChild(vfxContainer);
        setTimeout(() => vfxContainer.remove(), 1500);
    }
}

function showBlazingBallPlacementVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        const vfx = document.createElement('div');
        vfx.className = 'blazing-ball-placement-vfx';

        const ball = document.createElement('div');
        ball.className = 'blazing-ball-core';
        vfx.appendChild(ball);

        targetElement.appendChild(vfx);
        setTimeout(() => vfx.remove(), 1500);
    }
}

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

        const teleRing = document.createElement('div');
        teleRing.className = 'teleportation-ring';
        vfxContainer.appendChild(teleRing);

        const imgElement = casterElement.querySelector('img');
        if (imgElement) {
            imgElement.classList.add('teleportation-fade-out');
        } else {
            casterElement.classList.add('teleportation-fade-out');
        }

        // Add sparkles
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'teleportation-sparkle';
            sparkle.style.setProperty('--sparkle-x', `${Math.random() * 80 + 10}%`);
            sparkle.style.setProperty('--sparkle-y', `${Math.random() * 80 + 10}%`);
            sparkle.style.setProperty('--sparkle-delay', `${Math.random() * 0.5}s`);
            sparkle.style.setProperty('--sparkle-size', `${Math.random() * 5 + 3}px`);
            
            const hue = 180 + Math.random() * 30;
            const lightness = 70 + Math.random() * 30;
            sparkle.style.setProperty('--sparkle-color', `hsl(${hue}, 100%, ${lightness}%)`);
            
            vfxContainer.appendChild(sparkle);
        }

        casterElement.appendChild(vfxContainer);

        setTimeout(() => {
            if (imgElement) {
                imgElement.classList.remove('teleportation-fade-out');
                imgElement.classList.add('teleportation-fade-in');
            } else {
                casterElement.classList.remove('teleportation-fade-out');
                casterElement.classList.add('teleportation-fade-in');
            }

            // Post sparkles
            for (let i = 0; i < 8; i++) {
                const postSparkle = document.createElement('div');
                postSparkle.className = 'teleportation-post-sparkle';
                postSparkle.style.setProperty('--sparkle-x', `${Math.random() * 80 + 10}%`);
                postSparkle.style.setProperty('--sparkle-y', `${Math.random() * 80 + 10}%`);
                postSparkle.style.setProperty('--sparkle-angle', `${i * 45}deg`);
                vfxContainer.appendChild(postSparkle);
            }

            setTimeout(() => {
                if (imgElement) {
                    imgElement.classList.remove('teleportation-fade-in');
                } else {
                    casterElement.classList.remove('teleportation-fade-in');
                }
                
                const buffIndicator = document.createElement('div');
                buffIndicator.className = 'teleportation-buff-indicator';
                casterElement.appendChild(buffIndicator);
                
                setTimeout(() => {
                    vfxContainer.remove();
                    setTimeout(() => buffIndicator.remove(), 2000);
                }, 500);
            }, 400);

        }, 300);
    }
}

// Create Ability object for Blazing Lightning Ball
const blazingLightningBallAbility = new Ability(
    'blazing_lightning_ball',
    'Blazing Lightning Ball',
    'Icons/abilities/blazing_lightning_ball.png',
    50,
    2,
    blazingLightningBallEffect
).setDescription("Places a stackable Blazing Lightning Ball mark on the target for 10 turns. Raiden's damaging abilities deal doubled damage per stack.")
 .setTargetType('enemy');

// Add the doesNotEndTurn property
blazingLightningBallAbility.doesNotEndTurn = true;

// Register everything when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Register character class with retry mechanism
    const registerCharacterClass = () => {
        if (typeof CharacterFactory !== 'undefined' && CharacterFactory.registerCharacterClass) {
            CharacterFactory.registerCharacterClass('infernal_raiden', InfernalRaidenCharacter);
            console.log('[InfernalRaiden] Character class registered successfully');
        } else {
            console.warn('[InfernalRaiden] CharacterFactory not found, retrying in 100ms...');
            setTimeout(registerCharacterClass, 100);
        }
    };

    // Register abilities with retry mechanism
    const registerAbilities = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilities) {
            AbilityFactory.registerAbilities([blazingLightningBallAbility]);
            console.log('[InfernalRaiden] Abilities registered successfully');
        } else {
            console.warn('[InfernalRaiden] AbilityFactory not found, retrying in 100ms...');
            setTimeout(registerAbilities, 100);
        }
    };

    // Register custom ability effects
    const registerCustomEffects = () => {
        if (typeof AbilityFactory !== 'undefined' && AbilityFactory.registerAbilityEffect) {
            // Register all custom effect functions
            AbilityFactory.registerAbilityEffect('blazingLightningBallEffect', blazingLightningBallEffect);
            AbilityFactory.registerAbilityEffect('thunderFromTheSkyEffect', thunderFromTheSkyEffect);
            AbilityFactory.registerAbilityEffect('thunderstruckInfernalEffect', thunderstruckInfernalEffect);
            AbilityFactory.registerAbilityEffect('stormConduitPassive', stormConduitPassive);
            console.log('[InfernalRaiden] Custom ability effects registered successfully');
        } else {
            console.warn('[InfernalRaiden] AbilityFactory.registerAbilityEffect not found, retrying in 100ms...');
            setTimeout(registerCustomEffects, 100);
        }
    };

    registerCharacterClass();
    registerAbilities();
    registerCustomEffects();

    // VFX event listener
    document.addEventListener('AbilityUsed', (event) => {
        const { caster, ability } = event.detail;
        if (caster.id === 'infernal_raiden' || caster.name === 'Infernal Raiden') {
            if (ability.id === 'teleportation') {
                showTeleportationVFX(caster);
            }
        }
    });
}); 