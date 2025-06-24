// Ability definitions for Schoolgirl Julia

// Assume Ability, Effect classes and addLogEntry function are available globally or imported

// --- Helper Function to get all alive enemies ---
function getAllAliveEnemies(caster) {
    if (!window.gameManager || !window.gameManager.gameState) {
        console.error("Game state not accessible for finding enemies.");
        return [];
    }
    const playerTeamIds = window.gameManager.gameState.playerCharacters.map(c => c.id);
    const allCharacters = [...window.gameManager.gameState.playerCharacters, ...window.gameManager.gameState.aiCharacters];

    if (playerTeamIds.includes(caster.id)) {
        // Caster is player, target AI
        return window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
    } else {
        // Caster is AI, target player
        return window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
    }
}

// --- Q: Healing Kick ---
const schoolgirlJuliaHealingKickEffect = (caster, target) => { // Target param is unused for AoE but part of signature
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const enemies = getAllAliveEnemies(caster); // Renamed variable for clarity

    if (enemies.length === 0) {
        log(`${caster.name} used Healing Kick, but there were no enemies!`);
        return;
    }

    log(`${caster.name} uses Healing Kick, striking all enemies!`);

    // --- NEW: Initialize / Increment strike counter for Healing Kick ---
    if (caster.__healingKickStrikesConducted == null) {
        caster.__healingKickStrikesConducted = 1;
    } else {
        caster.__healingKickStrikesConducted++;
    }
    // --- END NEW ---

    // Calculate damage based on 200% of Physical Damage
    const damageAmount = Math.floor(caster.stats.physicalDamage * 2.0);
    const damageType = 'physical';
    let totalDamageDealt = 0; // Track total damage for healing calculation

    // Play Healing Kick sound
    const playSoundKick = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSoundKick('sounds/juliaa1.mp3');

    // --- Healing Kick VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const gameArea = document.querySelector('.game-area'); // Adjust selector if needed

    if (casterElement && gameArea && enemies.length > 0) {
        const numParticles = 8; // Number of wind particles
        const animationDuration = 600; // Matches CSS animation duration

        // Get caster position (approximate center)
        const casterRect = casterElement.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect(); // Use game area for relative positioning

        // Calculate starting position relative to gameArea
        const startX = casterRect.left + casterRect.width / 2 - gameRect.left;
        const startY = casterRect.top + casterRect.height / 2 - gameRect.top;

        // Determine general direction towards enemies (simplistic: just move horizontally)
        const moveDirectionX = caster.isAI ? -1 : 1; // AI on right moves left, Player on left moves right

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-kick-wind-vfx';

            // Randomize starting offset slightly around the caster
            const offsetX = (Math.random() - 0.5) * casterRect.width * 0.8;
            const offsetY = (Math.random() - 0.5) * casterRect.height * 0.5;
            particle.style.left = `${startX + offsetX}px`;
            particle.style.top = `${startY + offsetY}px`;

            // Randomize movement direction and distance
            // Adjust multiplier for desired spread/distance
            const windX = moveDirectionX * (60 + Math.random() * 50);
            const windY = (Math.random() - 0.5) * 60; // Vertical spread
            particle.style.setProperty('--wind-x', `${windX}px`);
            particle.style.setProperty('--wind-y', `${windY}px`);

            // Random slight delay for staggering
            const delay = Math.random() * 150; // 0 to 150ms delay
            particle.style.animationDelay = `${delay}ms`;

            gameArea.appendChild(particle);

            // Remove particle after animation + delay
            setTimeout(() => {
                particle.remove();
            }, animationDuration + delay);
        }
    }
    // --- End VFX ---

    // Apply damage to all targets and calculate total damage
    enemies.forEach(enemy => {
        const result = enemy.applyDamage(damageAmount, damageType, caster, { abilityId: 'schoolgirl_julia_q' });
        totalDamageDealt += result.damage; // Accumulate damage dealt

        let message = `${enemy.name} takes ${result.damage} ${damageType} damage from Healing Kick`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        log(message);

        if (enemy.isDead()) {
            log(`${enemy.name} has been defeated!`);
        }
    });

    // Calculate heal amount (40% of total damage dealt)
    const healAmount = Math.floor(totalDamageDealt * 0.40);

    if (healAmount > 0) {
        // Determine which team to heal based on caster
        let alliesToHeal = [];
        if (window.gameManager && window.gameManager.gameState) {
            if (caster.isAI) {
                alliesToHeal = window.gameManager.gameState.aiCharacters.filter(c => !c.isDead());
            } else {
                alliesToHeal = window.gameManager.gameState.playerCharacters.filter(c => !c.isDead());
            }
        } else {
            log("Warning: Could not access game state to determine allies.", "error");
            // As a fallback, just heal the caster
            alliesToHeal.push(caster);
        }

        log(`${caster.name}'s Healing Kick generates ${healAmount} healing for the team!`);

        // Apply heal to all alive allies (including the caster)
        alliesToHeal.forEach(ally => {
            const healResult = ally.heal(healAmount, caster, { abilityId: 'schoolgirl_julia_q' });
            const actualHeal = healResult.healAmount; // Extract healAmount from result object
            log(`${ally.name} is healed for ${actualHeal}.`);

            // NEW: Healing Kick Mana Flow talent - restore mana equal to 5% of the healing
            const manaPercent = caster.healingKickRestoresManaPercent || 0;
            if (manaPercent > 0 && actualHeal > 0) {
                const manaRestore = Math.floor(actualHeal * manaPercent);
                if (manaRestore > 0) {
                    const oldMana = ally.stats.currentMana !== undefined ? ally.stats.currentMana : (ally.stats.mana || 0);
                    const maxMana = ally.stats.maxMana !== undefined ? ally.stats.maxMana : (ally.stats.mana || 0);
                    const imprisonDebuff = ally.debuffs?.find(d => d && d.effects && d.effects.cantRestoreMana);
                    if (!imprisonDebuff && maxMana > 0) {
                        let newMana = oldMana;
                        if (ally.stats.currentMana !== undefined) {
                            ally.stats.currentMana = Math.min(oldMana + manaRestore, maxMana);
                            newMana = ally.stats.currentMana;
                        } else if (ally.stats.mana !== undefined) {
                            ally.stats.mana = Math.min(oldMana + manaRestore, maxMana);
                            newMana = ally.stats.mana;
                        }
                        const actualRestored = newMana - oldMana;
                        if (actualRestored > 0) {
                            log(`${ally.name} regains ${actualRestored} mana from Healing Mana Flow.`);
                            if (window.gameManager && window.gameManager.uiManager) {
                                window.gameManager.uiManager.triggerManaAnimation(ally, 'restore', actualRestored);
                            }
                            // Optional VFX for mana restore
                            const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
                            if (allyElement) {
                                const manaVfx = document.createElement('div');
                                manaVfx.className = 'julia-mana-restore-vfx';
                                manaVfx.textContent = `+${actualRestored} MP`;
                                allyElement.appendChild(manaVfx);
                                setTimeout(() => manaVfx.remove(), 1000);
                            }
                        }
                    }
                }
            }

            // Trigger passive if heal was successful and caster has the handler
            if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                caster.passiveHandler.onHealDealt(caster, ally, actualHeal);
            }

            // Optionally add healing VFX to each ally
            const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
            if (allyElement) {
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx'; // Use existing heal VFX class
                healVfx.textContent = `+${actualHeal}`;
                allyElement.appendChild(healVfx);
                
                const healParticles = document.createElement('div');
                healParticles.className = 'heal-particles'; // Use existing particle class
                allyElement.appendChild(healParticles);
                
                setTimeout(() => {
                    allyElement.querySelectorAll('.heal-vfx, .heal-particles').forEach(el => el.remove());
                }, 1000);
            }
        });
    }

    // --- NEW TALENT: Healing Kick Double Strike ---
    // --- TALENT STRIKE CHAIN (Double / Triple) ---
    const requiredHits = caster.healingKickTripleStrike ? 3 : (caster.healingKickTriggersTwice ? 2 : 1);
    if (caster.__healingKickStrikesConducted < requiredHits) {
        const nextHitNumber = caster.__healingKickStrikesConducted + 1; // 2 for second, 3 for third
        setTimeout(() => {
            try {
                let boostedCrit = false;
                if (requiredHits === 3 && nextHitNumber === 3) {
                    // Guarantee critical for the third strike
                    boostedCrit = true;
                    caster.__originalCritChance = caster.stats.critChance;
                    caster.stats.critChance = 1;
                }
                schoolgirlJuliaHealingKickEffect(caster, target);
                if (boostedCrit) {
                    caster.stats.critChance = caster.__originalCritChance;
                    delete caster.__originalCritChance;
                }
            } finally {}
        }, 150);
    } else {
        // Reset counter after completing all required hits
        caster.__healingKickStrikesConducted = 0;
    }
    // --- END TALENT STRIKE CHAIN ---

    // Play sound for Julia Q (already played earlier)
    // const playSoundJuliaQ = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    // playSoundJuliaQ('sounds/juliaa1.mp3'); // Sound moved up
};

const schoolgirl_julia_q = new Ability(
    'schoolgirl_julia_q',
    'Healing Kick',
    'Icons/abilities/healing_kick.jfif', // Placeholder icon
    80, // Mana cost
    2,  // Cooldown
    schoolgirlJuliaHealingKickEffect
).setDescription('Deals 200% Physical Damage to ALL enemies. Heals all allies (including self) for 40% of the total damage dealt.');

// --- Ability Factory Integration ---
// Ensure AbilityFactory exists and has the registration method
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirl_julia_q
        // Register other Schoolgirl Julia abilities here when created
    ]);
} else {
    console.warn("Schoolgirl Julia abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: Assign to a global object if AbilityFactory is not available
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_julia_q = schoolgirl_julia_q;
}

// Removed redundant Q ability registration - already handled above

// Ability definition for Schoolgirl Julia's W: Sprout Planting

const schoolgirlJuliaSproutPlantingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;

    if (!target) {
        log("Schoolgirl Julia W: No target selected!", "error");
        return;
    }

    log(`${caster.name} plants a healing sprout on ${target.name}.`);

    // --- Sprout Planting VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create sprout visual effect
        const sproutVfx = document.createElement('div');
        sproutVfx.className = 'sprout-planting-vfx'; // Add CSS for this class
        targetElement.appendChild(sproutVfx);

        // Remove VFX after animation completes (e.g., 1 second)
        setTimeout(() => {
            sproutVfx.remove();
        }, 1000);
    }
    // --- End Sprout Planting VFX ---

    // --- Modify Sprout Planting duration based on talent ---
    const sproutDuration = caster.sproutBloomsAfterOneTurn ? 1 : 2;
    const sproutBuff = new Effect(
        'schoolgirl_julia_w_sprout',
        'Healing Sprout',
        'Icons/abilities/sprout_planting.jfif',
        sproutDuration,
        (character) => {
            // Optional: effect each turn
        },
        false
    ).setDescription('A healing sprout that will bloom after ' + sproutDuration + ' turns, restoring health.');

    // Define the onRemove function (called when buff expires or is removed)
    sproutBuff.onRemove = (buffedCharacter) => {
        log(`The Healing Sprout on ${buffedCharacter.name} blooms!`);

        // Calculate heal amount based on Julia's (caster's) healingPower
        const baseHeal = 1250;
        const healAmount = Math.floor(baseHeal * (1 + (caster.stats.healingPower || 0)));

        // --- NEW: Check for Healing Sprout Critical talent ---
        let isCriticalHeal = false;
        let finalHealAmount = healAmount;
        
        if (caster.healingSproutCriticalChance && Math.random() < caster.healingSproutCriticalChance) {
            // Apply critical heal with 1.5x multiplier (standard crit multiplier)
            finalHealAmount = Math.floor(healAmount * 1.5);
            isCriticalHeal = true;
            
            // Log the critical heal
            log(`🌱✨ ${caster.name}'s Healing Sprout blooms with critical healing!`, 'critical-heal');
            
            // Dispatch critical heal event for statistics tracking
            const critHealEvent = new CustomEvent('criticalHeal', {
                detail: {
                    source: caster,
                    target: buffedCharacter,
                    healAmount: finalHealAmount,
                    isCritical: true,
                    abilityId: 'schoolgirl_julia_w'
                }
            });
            document.dispatchEvent(critHealEvent);
        }
        // --- END NEW ---

        const healResult = buffedCharacter.heal(finalHealAmount, caster, { 
            abilityId: 'schoolgirl_julia_w',
            isCritical: isCriticalHeal // Pass critical flag to heal method
        });
        const actualHeal = healResult.healAmount; // Extract healAmount from result object
        
        // Log the heal with critical indicator if applicable
        if (isCriticalHeal) {
            log(`${buffedCharacter.name} is critically healed for ${actualHeal} HP!`, 'critical-heal');
        } else {
            log(`${buffedCharacter.name} is healed for ${actualHeal} HP.`);
        }

        // Trigger Julia's passive if applicable (heal dealt by Julia)
        if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
             // Pass the caster (Julia) and the target (buffedCharacter)
             caster.passiveHandler.onHealDealt(caster, buffedCharacter, actualHeal);
        }

        // --- Sprout Bloom VFX ---
        const healedElement = document.getElementById(`character-${buffedCharacter.instanceId || buffedCharacter.id}`);
        if (healedElement) {
             const bloomVfx = document.createElement('div');
             bloomVfx.className = 'sprout-bloom-vfx'; // Add CSS for this
             
             // Add critical class if it's a critical heal
             if (isCriticalHeal) {
                 bloomVfx.classList.add('critical');
             }
             
             healedElement.appendChild(bloomVfx);
             setTimeout(() => bloomVfx.remove(), 1500);
        }
        // --- End Sprout Bloom VFX ---

        // Play sound effect for sprout bloom
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/juliaa2.mp3');
    };

    // Apply the buff to the target ally
    target.addBuff(sproutBuff.clone()); // Use clone to ensure unique instances if needed

    log(`${target.name} receives the Healing Sprout buff.`);

    // Update UI for the target
    updateCharacterUI(target);
};

const schoolgirlJuliaW = new Ability(
    'schoolgirl_julia_w',
    'Sprout Planting',
    'Icons/abilities/sprout_planting.jfif', // Use a placeholder icon path
    75, // Mana cost
    6,  // Cooldown (Changed from 9)
    schoolgirlJuliaSproutPlantingEffect
);

// --- Dynamic End-Turn Text & doesNotEndTurn Support ---
// By default the ability ends the turn
schoolgirlJuliaW.doesNotEndTurn = false;

// --- Update generateDescription for W ---
schoolgirlJuliaW.generateDescription = function () {
    const base = Ability.prototype.generateDescription.call(this);
    const extras = [];
    if (this.doesNotEndTurn === true) extras.push('Does not end your turn.');
    
    // Check for dynamic duration based on talent
    let duration = 2; // Default duration
    if (window.gameManager && window.gameManager.stageManager && window.gameManager.stageManager.playerCharacters) {
        const julia = window.gameManager.stageManager.playerCharacters.find(char => char.id === 'schoolgirl_julia');
        if (julia && julia.sproutBloomsAfterOneTurn) {
            duration = 1;
            extras.push('Blooms after 1 turn.');
        }
        
        // Add critical heal talent effect to description
        if (julia && julia.healingSproutCriticalChance) {
            const critChance = Math.round(julia.healingSproutCriticalChance * 100);
            extras.push(`${critChance}% chance to crit heal.`);
        }
    }
    
    // Update the base description with correct duration
    let updatedBase = base.replace(/for \d+ turns/, `for ${duration} turns`);
    
    if (extras.length > 0) {
        return updatedBase + '\n<span class="talent-effect healing">Talent: ' + extras.join(' ') + '</span>';
    }
    return updatedBase;
};

// Ensure flag exists
schoolgirlJuliaW.bloomsAfterOneTurn = false;

schoolgirlJuliaW
    .setDescription('Plants a healing sprout on an ally for 2 turns. When the sprout expires, it heals the target for 1250 (+100% Healing Power) HP.')
    .setTargetType('ally');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Assuming Julia's other abilities (Q, E, R) might be defined elsewhere or added later
    AbilityFactory.registerAbilities([
        schoolgirlJuliaW
        // Add other Julia abilities here: schoolgirlJuliaQ, schoolgirlJuliaE, schoolgirlJuliaR
    ]);
} else {
    console.warn("Schoolgirl Julia W ability defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback registration
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_julia_w = schoolgirlJuliaW;
}

// Add basic CSS for VFX placeholders (ideally move to a dedicated CSS file)
const juliaWStyle = document.createElement('style');
juliaWStyle.textContent = `
/* Healing Kick Wind VFX */
.healing-kick-wind-vfx {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: rgba(200, 255, 255, 0.7);
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(150, 230, 230, 0.8);
    pointer-events: none;
    z-index: 14;
    animation: windyEffect 0.6s ease-out forwards;
}

@keyframes windyEffect {
    0% {
        opacity: 0.8;
        transform: translate(0, 0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(var(--wind-x, 50px), var(--wind-y, -30px)) scale(0.5);
    }
}

.sprout-planting-vfx {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 30px;
    background-color: #4CAF50; /* Green */
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    animation: growSprout 1s ease-out forwards;
    z-index: 10;
}

@keyframes growSprout {
    0% { height: 0; opacity: 0; }
    100% { height: 30px; opacity: 1; }
}

.sprout-bloom-vfx {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle, rgba(144, 238, 144, 0.8) 0%, rgba(144, 238, 144, 0) 70%); /* Light green bloom */
    border-radius: 50%;
    animation: bloomEffect 1.5s ease-out forwards;
    z-index: 10;
}

@keyframes bloomEffect {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

.spirits-strength-heal-vfx {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    color: #90EE90;
    font-weight: bold;
    font-size: 1.1em;
    text-shadow: 0 0 3px #228B22;
    animation: floatUpFade 1.5s ease-out forwards;
    pointer-events: none;
    z-index: 15;
}

.spirits-strength-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(144, 238, 144, 0.6) 0%, rgba(144, 238, 144, 0) 60%);
    border-radius: 50%;
    animation: spiritParticles 1.5s ease-out forwards;
    z-index: 12;
    pointer-events: none;
}

@keyframes spiritParticles {
    0% { transform: scale(0); opacity: 0; }
    30% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

/* Placeholder for buff icon in UI */
.status-icon[style*="sprout_planting.jfif"] {
    background-color: #90EE90; /* Light Green background for placeholder */
    border: 1px solid #3CB371; /* Medium Sea Green border */
}

/* Pushback Attack VFX */
.julia-push-caster-animation {
    animation: juliaPushCaster 0.5s ease-out;
}

@keyframes juliaPushCaster {
    0% { transform: translateX(0); }
    50% { transform: translateX(10px); filter: brightness(1.2); }
    100% { transform: translateX(0); }
}

.pushback-animation {
    animation: pushbackTarget 0.8s ease-out;
}

@keyframes pushbackTarget {
    0% { transform: translateX(0); }
    30% { transform: translateX(-15px); }
    60% { transform: translateX(-10px); }
    100% { transform: translateX(0); }
}

.julia-push-impact-vfx {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba(255, 255, 0, 0.8) 0%, rgba(255, 255, 0, 0) 70%);
    border-radius: 50%;
    animation: pushImpact 0.8s ease-out forwards;
    z-index: 12;
    pointer-events: none;
}

@keyframes pushImpact {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}
`;
document.head.appendChild(juliaWStyle);

// E: Pushback Attack
const schoolgirlJuliaPushbackEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;

    if (!target) {
        log("Schoolgirl Julia E: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Pushback Attack on ${target.name}.`);

    // Play sound effect
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/juliaa3.mp3');

    // --- Pushback Attack VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    // Caster animation (optional, e.g., a forward dash)
    if (casterElement) {
        casterElement.classList.add('julia-push-caster-animation');
        setTimeout(() => casterElement.classList.remove('julia-push-caster-animation'), 500);
    }

    // Target animation (pushback)
    if (targetElement) {
        targetElement.classList.add('pushback-animation');
        
        // Impact VFX
        const impactVfx = document.createElement('div');
        impactVfx.className = 'julia-push-impact-vfx'; // Use a specific class
        targetElement.appendChild(impactVfx);

        setTimeout(() => {
            targetElement.classList.remove('pushback-animation');
            impactVfx.remove();
        }, 800); // Duration should match CSS animation
    }
    // --- End Pushback Attack VFX ---

    // Calculate damage using dynamic multiplier (default 150%, can be increased by talents)
    const abilityInstance = caster.abilities.find(a => a.id === 'schoolgirl_julia_e') || {};
    const dmgMultiplier = abilityInstance.damageMultiplier || 1.5;
    const damageAmount = Math.floor(caster.stats.physicalDamage * dmgMultiplier);

    // Apply damage
    const result = target.applyDamage(damageAmount, 'physical', caster, { abilityId: 'schoolgirl_julia_e' });

    let message = `${target.name} takes ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    log(message);

    // Apply lifesteal if any (though Julia likely won't have base lifesteal)
    caster.applyLifesteal(result.damage);

    // Determine stun chance from ability instance (supports talent mods)
    const stunChance = (abilityInstance && typeof abilityInstance.stunChance === 'number') ? abilityInstance.stunChance : 0.40;

    // Apply stun effect based on current stun chance
    if (Math.random() < stunChance) {
        const stunDebuff = new Effect(
            'stun_debuff', // Use generic stun ID
            'Stunned',
            'Icons/debuffs/stun.png', // Use generic stun icon
            2, // Duration: 2 turns (Changed from 1)
            null, // No ongoing effect function needed
            true // isDebuff = true
        );

        // Set stun effect properties
        stunDebuff.effects = { cantAct: true };
        stunDebuff.setDescription('Cannot perform any actions.');

        // Add the remove function for cleanup (same as Alice's)
        stunDebuff.remove = function(character) {
            const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (targetElement) {
                targetElement.classList.remove('stunned');
                const stunEffects = targetElement.querySelectorAll('.stun-effect');
                stunEffects.forEach(el => el.remove());
            }
        };

        target.addDebuff(stunDebuff);
        log(`${target.name} is stunned for 2 turns!`);

        // Add stun VFX (using existing stun CSS)
        if (targetElement) {
            targetElement.classList.add('stunned');
            const stunEffect = document.createElement('div');
            stunEffect.className = 'stun-effect'; // Use existing class
            targetElement.appendChild(stunEffect);
        }
    }

    // Check if target died
    if (target.isDead()) {
        log(`${target.name} has been defeated!`);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolgirlJuliaE = new Ability(
    'schoolgirl_julia_e',
    'Pushback Attack',
    'Icons/abilities/pushback_attack.jfif', // Placeholder icon
    50, // Mana cost
    5, // Cooldown
    schoolgirlJuliaPushbackEffect
);

// After ability creation, set default damage multiplier property
schoolgirlJuliaE.damageMultiplier = 1.5; // 150% base scaling, moddable by talents
// Base stun chance (40%) before talents
schoolgirlJuliaE.stunChance = 0.40;

// Custom generateDescription that inserts the current stun chance and damage multiplier percentages
schoolgirlJuliaE.generateDescription = function () {
    this.stunChancePercent = Math.round((this.stunChance || 0) * 100);
    this.damageMultiplierPercent = Math.round((this.damageMultiplier || 1.5) * 100);
    let desc = `Deals ${this.damageMultiplierPercent}% physical damage to the target and has an ${this.stunChancePercent}% chance to stun it for 2 turns.`;
    // Only show the talent line if the 500% multiplier is active (Pushback Destruction talent)
    if (this.damageMultiplier && this.damageMultiplier >= 5) {
        desc += '\n<span class="talent-effect damage">Pushback Destruction: Pushback Attack now deals 500% Physical Damage.</span>';
    }
    return desc;
};

// Set base description with placeholder and target type
schoolgirlJuliaE
    .setDescription('Deals {damageMultiplierPercent}% physical damage to the target and has an {stunChancePercent}% chance to stun it for 2 turns.')
    .setTargetType('enemy');

// --- Ability Factory Integration ---
// Ensure this runs after the main game scripts have loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            schoolgirlJuliaE
            // Add other Julia abilities here if needed
        ]);
        console.log("Registered Schoolgirl Julia abilities.");
    } else {
        console.warn("Schoolgirl Julia abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
    }
});

// --- R: Spirits Strength ---

const schoolgirlJuliaSpiritsStrengthEffect = (caster, target) => { // Target param is unused for AoE but part of signature
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    let alliesToHeal = [];
    let totalHealed = 0;
    let passiveTriggeredThisCast = false;

    // Determine which team to heal based on caster
    if (window.gameManager && window.gameManager.gameState) {
        if (caster.isAI) {
            alliesToHeal = window.gameManager.gameState.aiCharacters.filter(c => !c.isDead());
        } else {
            alliesToHeal = window.gameManager.gameState.playerCharacters.filter(c => !c.isDead());
        }
    } else {
        log("Warning: Could not access game state to determine allies for Spirits Strength.", "error");
        // Fallback: Just target the caster if game state is unavailable
        if (!caster.isDead()) {
            alliesToHeal.push(caster);
        }
    }

    if (alliesToHeal.length === 0) {
        log(`${caster.name} used Spirits Strength, but there were no allies to heal!`);
        return;
    }

    log(`${caster.name} channels Spirits Strength, unleashing a wave of healing energy!`);

    // Calculate heal amount: 1200 base + 200% Magical Damage, modified by Healing Power
    const baseHeal = 1200 + ((caster.stats.magicalDamage || 0) * 2.0); // Changed from 100%
    const healAmount = Math.floor(baseHeal * (1 + (caster.stats.healingPower || 0))); // Apply healing power modifier

    log(`Spirits Strength base heal per ally: ${healAmount}`);

    // Play sound effect
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/juliaa4.mp3', 0.9); // Use Julia's R sound
    playSound('sounds/julia_spirits.mp3', 0.8); // Add the second sound

    // --- Doublecast logic ---
    let doublecastTriggered = false;
    const doublecastChance = caster.spiritStrengthDoublecastChance || 0;
    if (doublecastChance > 0 && Math.random() < doublecastChance) {
        doublecastTriggered = true;
    }

    // Helper to perform the full heal/VFX/log for one cast
    function performSpiritStrengthCast(isDoublecast = false) {
        let totalHealedThisCast = 0;
        alliesToHeal.forEach(ally => {
            const healResult = ally.heal(healAmount, caster, { abilityId: 'schoolgirl_julia_r' });
            const actualHeal = healResult.healAmount; // Extract healAmount from result object
            totalHealedThisCast += actualHeal;
            log(`${ally.name} is healed for ${actualHeal} by Spirits Strength${isDoublecast ? ' (Doublecast!)' : ''}.`);

            // Trigger passive if heal was successful and caster has the handler
            if (actualHeal > 0 && caster.passiveHandler && typeof caster.passiveHandler.onHealDealt === 'function') {
                caster.passiveHandler.onHealDealt(caster, ally, actualHeal);
            }

            // --- Add Spirits Strength VFX to each ally ---
            const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
            if (allyElement) {
                 // Use existing heal VFX classes or create new ones
                 const spiritsHealVfx = document.createElement('div');
                 spiritsHealVfx.className = 'spirits-strength-heal-vfx'; // Add CSS for this
                 spiritsHealVfx.textContent = `+${actualHeal}` + (isDoublecast ? ' ✦' : '');
                 allyElement.appendChild(spiritsHealVfx);

                 const spiritsParticles = document.createElement('div');
                 spiritsParticles.className = 'spirits-strength-particles'; // Add CSS for this
                 allyElement.appendChild(spiritsParticles);

                 // Add a special pulse/glow for doublecast
                 if (isDoublecast) {
                    spiritsHealVfx.style.filter = 'drop-shadow(0 0 8px #f2c94c)';
                    spiritsParticles.style.animation = 'spiritsStrengthPulse 1.5s ease-out 0s 2 alternate';
                 }

                 setTimeout(() => {
                     allyElement.querySelectorAll('.spirits-strength-heal-vfx, .spirits-strength-particles').forEach(el => el.remove());
                 }, 1500);
            }
             // --- End Spirits Strength VFX ---

            if (caster.spiritsStrengthCleansesDebuffs && ally.debuffs && ally.debuffs.length > 0) {
                // Remove all debuffs
                const debuffIds = ally.debuffs.map(d => d.id);
                debuffIds.forEach(id => ally.removeDebuff(id));
                if (typeof ally.showPurifyingResolveVFX === 'function') {
                    ally.showPurifyingResolveVFX();
                }
                log(`${ally.name}'s debuffs are cleansed by Spirits Strength!`, 'talent-effect positive');
            }
        });
        return totalHealedThisCast;
    }

    // First cast
    totalHealed += performSpiritStrengthCast(false);
    // If doublecast triggers, do a second cast (with VFX and log)
    if (doublecastTriggered) {
        setTimeout(() => {
            log(`<span class='talent-effect aoe'>Spirit Strength Doublecast triggers! Spirits Strength is cast again!</span>`);
            performSpiritStrengthCast(true);
        }, 400); // Delay for dramatic effect
    }

    log(`Spirits Strength healed the team for a total of ${totalHealed}.`);

    // Update UI for all healed characters
    alliesToHeal.forEach(ally => updateCharacterUI(ally));
};

const schoolgirlJuliaR = new Ability(
    'schoolgirl_julia_r',
    'Spirits Strength',
    'Icons/abilities/spirits_strength.jfif', // Placeholder icon
    200, // Mana cost
    16,  // Cooldown (Changed from 26)
    schoolgirlJuliaSpiritsStrengthEffect
).setDescription('Heals ALL allies for 1200 (+200% Magical Damage) HP. Cooldown reduced by 1 whenever Julia is healed.') // Updated description
 .setTargetType('all_allies'); // Target all allies

// --- Ability Factory Integration ---
// Ensure this runs after the main game scripts have loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            schoolgirlJuliaE,
            schoolgirlJuliaR // Register R ability here as well
        ]);
        console.log("Registered Schoolgirl Julia E and R abilities."); // Updated log
    } else {
        console.warn("Schoolgirl Julia E or R abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
        window.definedAbilities.schoolgirl_julia_r = schoolgirlJuliaR; // Add R to fallback
    }
});

// --- Ensure All Abilities Are Registered Initially ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirl_julia_q,
        schoolgirlJuliaW,
        schoolgirlJuliaE,
        schoolgirlJuliaR // Add R ability here
    ]);
} else {
     // Fallback registration (already handled above and in DOMContentLoaded, but good for clarity)
     window.definedAbilities = window.definedAbilities || {};
     window.definedAbilities.schoolgirl_julia_q = schoolgirl_julia_q;
     window.definedAbilities.schoolgirl_julia_w = schoolgirlJuliaW;
     window.definedAbilities.schoolgirl_julia_e = schoolgirlJuliaE;
     window.definedAbilities.schoolgirl_julia_r = schoolgirlJuliaR;
}

// === TurnStart Listener for Flourishing Spirits ===
if (typeof window !== 'undefined') {
    document.addEventListener('TurnStart', (e) => {
        const turn = e.detail?.turn || 0;
        if (turn >= 11 && window.gameManager) {
            const allChars = [...window.gameManager.gameState.playerCharacters, ...window.gameManager.gameState.aiCharacters];
            allChars.forEach(ch => {
                if (ch.id === 'schoolgirl_julia' && ch.lateHealBoostPercent && !ch.lateHealBoostApplied) {
                    ch.recalculateStats('FlourishingSpiritsTurnStart');
                    if (window.updateCharacterUI) {
                        window.updateCharacterUI(ch);
                    }
                }
            });
        }
    });
}

// --- GenerateDescription for R ---
schoolgirlJuliaR.generateDescription = function () {
    let desc = 'Heals ALL allies for 1200 (+200% Magical Damage) HP. Cooldown reduced by 1 whenever Julia is healed.';
    if (this.cleansesDebuffs) {
        desc += '\n<span class="talent-effect utility">Spirit Purification: Removes all debuffs from allies.</span>';
    }
    if (this.doublecastChance && this.doublecastChance > 0) {
        const percent = Math.round(this.doublecastChance * 100);
        desc += `\n<span class=\"talent-effect aoe\">Spirit Strength Doublecast: Spirits Strength has a ${percent}% chance to trigger twice when used.</span>`;
    }
    if (this.magicalDamageSynergy) {
        desc += '\n<span class="talent-effect damage">Magical Damage Synergy: Every turn, Julia gains Magical Damage equal to her Physical Damage.</span>';
    }
    
    // Add cooldown reduction info if talents are active
    const hasQuickenedSpirits = this.caster && this.caster.hasTalent && this.caster.hasTalent('spirits_strength_quickcast');
    const hasSpiritMastery = this.caster && this.caster.hasTalent && this.caster.hasTalent('spirit_mastery');
    
    if (hasQuickenedSpirits && hasSpiritMastery) {
        desc += '\n<span class="talent-effect utility">Quickened Spirits + Spirit Mastery: Cooldown reduced by 4 turns total.</span>';
    } else if (hasQuickenedSpirits) {
        desc += '\n<span class="talent-effect utility">Quickened Spirits: Cooldown reduced by 2 turns.</span>';
    } else if (hasSpiritMastery) {
        desc += '\n<span class="talent-effect utility">Spirit Mastery: Cooldown reduced by 2 turns.</span>';
    }
    
    return desc;
};

// flag
schoolgirlJuliaR.cleansesDebuffs = false;
schoolgirlJuliaR.doublecastChance = 0;
schoolgirlJuliaR.magicalDamageSynergy = false;

// --- Utility function to refresh Julia ability descriptions ---
window.updateJuliaAbilityDescriptions = function(character) {
    if (!character || character.id !== 'schoolgirl_julia') return;

    const greenifyNums = (str) => str.replace(/(\d+(?:\.\d+)?%?)/g, '<span style="color:#6fcf70;font-weight:bold;">$1</span>');

    const dedupeTalentLines = (desc) => {
        const lines = desc.split(/<br>|\n/);
        const seen = new Set();
        return lines.filter(l => {
            const key = l.trim();
            if (key.startsWith('<span') && key.includes('talent-effect')) {
                if (seen.has(key)) return false;
                seen.add(key);
            }
            return true;
        }).join('<br>');
    };

    character.abilities.forEach(ab => {
        if (ab.id === 'schoolgirl_julia_w') {
            ab.bloomsAfterOneTurn = !!character.sproutBloomsAfterOneTurn;
            ab.description = greenifyNums(dedupeTalentLines(ab.generateDescription()));
            ab.baseDescription = ab.description;
            
            // Add allied healing sprouts info if applicable
            if (character.hasTalent && character.hasTalent('allied_healing_sprouts')) {
                ab.description += ` <span class="talent-effect aoe">Allied Healing Sprouts: At game start, all allies gain a Healing Sprout buff that blooms after 10 turns.</span>`;
            }
            
            // Add critical heal talent info if applicable
            if (character.healingSproutCriticalChance) {
                const critChance = Math.round(character.healingSproutCriticalChance * 100);
                ab.description += ` <span class="talent-effect critical">Critical Healing: ${critChance}% chance to crit heal instead.</span>`;
            }
        } else if (ab.id === 'schoolgirl_julia_r') {
            ab.cleansesDebuffs = !!character.spiritsStrengthCleansesDebuffs;
            ab.doublecastChance = character.spiritStrengthDoublecastChance || 0;
            ab.magicalDamageSynergy = !!character.magicalDamageSynergy;
            ab.description = greenifyNums(ab.generateDescription());
            ab.baseDescription = ab.description;
            
            // Add Spirit Mastery info if applicable
            if (character.hasTalent && character.hasTalent('spirit_mastery')) {
                // The generateDescription method already handles this, but we can add additional info if needed
                const hasQuickenedSpirits = character.hasTalent('spirits_strength_quickcast');
                if (hasQuickenedSpirits) {
                    ab.description += ` <span class="talent-effect utility">Spirit Mastery: Additional -2 turns cooldown reduction.</span>`;
                }
            }
        } else if (ab.id === 'schoolgirl_julia_e') {
            ab.stunChancePercent = Math.round((ab.stunChance || 0) * 100);
            ab.damageMultiplierPercent = Math.round((ab.damageMultiplier || 1.5) * 100);
            ab.description = greenifyNums(ab.generateDescription());
            ab.baseDescription = ab.description;
        } else if (ab.id === 'schoolgirl_julia_q') {
            const colorize = (val) => `<span style=\"color:#6fcf70;font-weight:bold;\">${val}</span>`;
            const parts = [];
            const dmg = colorize('200%');
            const healPct = colorize('40%');
            if (character.healingKickTripleStrike) {
                parts.push(`Deals ${dmg} Physical Damage to ALL enemies <span style=\"color:#a3e47d;font-weight:bold;\">three times</span>. The third strike is a <span style=\"color:#f2c94c;font-weight:bold;\">Guaranteed Critical Hit</span>.`);
            } else if (character.healingKickTriggersTwice) {
                parts.push(`Deals ${dmg} Physical Damage to ALL enemies <span style=\"color:#a3e47d;font-weight:bold;\">twice</span>.`);
            } else {
                parts.push(`Deals ${dmg} Physical Damage to ALL enemies.`);
            }
            parts.push(`Heals all allies (including self) for ${healPct} of the total damage dealt.`);
            if (character.healingKickRestoresManaPercent) {
                const percent = Math.round(character.healingKickRestoresManaPercent * 100);
                parts.push(`Restores ${colorize(percent + '%')} of the healing as Mana to each healed ally.`);
            }
            ab.description = parts.join(' ');
            ab.baseDescription = ab.description;
        }
        
        // Add Nature's Fury effect to all abilities if the talent is active
        if (character.naturesFuryTurn10 && character.naturesFuryApplied) {
            ab.description += ` <span class="talent-effect damage">Nature's Fury: Physical Damage doubled at turn 10!</span>`;
        }
    });

    // --- Update Passive Description (Healing Empowerment) ---
    if (character.passive && character.passive.id === 'schoolgirl_julia_passive') {
        const baseGain = 5 + (character.juliaPassiveExtraDamage || 0);
        const colorize = (val) => `<span style=\"color:#6fcf70;font-weight:bold;\">${val}</span>`;
        character.passive.description = `Whenever Julia heals herself (including lifesteal) or heals an ally, she permanently gains +${colorize(baseGain)} Physical Damage.`;
        
        // Add enhanced mystic reserve info to passive description if applicable
        if (character.hasTalent && character.hasTalent('enhanced_mystic_reserve')) {
            character.passive.description += ` <span class="talent-effect resource">Enhanced Mystic Reserve: +1000 maximum Mana.</span>`;
        }
        
        // Add allied healing sprouts info to passive description if applicable
        if (character.hasTalent && character.hasTalent('allied_healing_sprouts')) {
            character.passive.description += ` <span class="talent-effect aoe">Allied Healing Sprouts: At game start, all allies gain a Healing Sprout buff that blooms after 10 turns.</span>`;
        }
        
        // Add critical strike mastery info to passive description if applicable
        if (character.hasTalent && character.hasTalent('critical_strike_mastery')) {
            character.passive.description += ` <span class="talent-effect damage">Critical Strike Mastery: +10% critical chance.</span>`;
        }

        // Add Healing Surge info to passive description if applicable
        if (character.hasTalent && character.hasTalent('healing_surge')) {
            character.passive.description += ` <span class="talent-effect healing">Healing Surge: Heals on Julia are 75% more powerful but she takes 35% more damage.</span>`;
        }
        
        // If stats menu is open, ensure it refreshes to show updated description
        if (window.gameManager && window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
            window.gameManager.uiManager.updateCharacterUI(character);
        }
    }
};

// --- Enhanced Mystic Reserve VFX Function ---
window.showEnhancedMysticReserveVFX = function(character) {
    if (!character || character.id !== 'schoolgirl_julia') return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;

    // Create main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'julia-enhanced-mystic-reserve-vfx';
    charElement.appendChild(vfxContainer);

    // Create floating text
    const floatText = document.createElement('div');
    floatText.className = 'julia-enhanced-mystic-reserve-float';
    floatText.textContent = '+1000 MP';
    charElement.appendChild(floatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-enhanced-mystic-reserve-particles';
    charElement.appendChild(particleContainer);

    // Create rotating aura
    const aura = document.createElement('div');
    aura.className = 'julia-enhanced-mystic-reserve-aura';
    charElement.appendChild(aura);

    // Create particles
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-enhanced-mystic-reserve-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 30 + Math.random() * 20;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        
        particleContainer.appendChild(particle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        vfxContainer.remove();
        floatText.remove();
        particleContainer.remove();
        aura.remove();
    }, 3000);

    // Add log entry
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`${character.name}'s Enhanced Mystic Reserve grants +1000 maximum Mana!`, 'talent-effect resource');
    }
};

// --- Allied Healing Sprouts VFX Functions ---
window.showAlliedHealingSproutsGameStartVFX = function() {
    // Create main game start VFX container
    const gameStartVfx = document.createElement('div');
    gameStartVfx.className = 'julia-allied-sprouts-game-start';
    document.body.appendChild(gameStartVfx);

    // Create floating text
    const floatText = document.createElement('div');
    floatText.className = 'julia-allied-sprouts-float';
    floatText.textContent = 'Allied Healing Sprouts';
    document.body.appendChild(floatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-allied-sprouts-particles';
    document.body.appendChild(particleContainer);

    // Create particles
    const numParticles = 20;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-allied-sprouts-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 50 + Math.random() * 30;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.8}s`;
        
        particleContainer.appendChild(particle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        gameStartVfx.remove();
        floatText.remove();
        particleContainer.remove();
    }, 3000);

    // Add log entry
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`Julia's Allied Healing Sprouts talent activates! All allies gain Healing Sprout buffs.`, 'talent-effect aoe');
    }
};

window.showAlliedHealingSproutsApplicationVFX = function(character) {
    if (!character) return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;

    // Create application VFX container
    const applicationVfx = document.createElement('div');
    applicationVfx.className = 'julia-allied-sprouts-application';
    charElement.appendChild(applicationVfx);

    // Create floating text
    const floatText = document.createElement('div');
    floatText.className = 'julia-allied-sprouts-application-float';
    floatText.textContent = 'Healing Sprout';
    charElement.appendChild(floatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-allied-sprouts-application-particles';
    charElement.appendChild(particleContainer);

    // Create particles
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-allied-sprouts-application-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 20 + Math.random() * 15;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.3}s`;
        
        particleContainer.appendChild(particle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        applicationVfx.remove();
        floatText.remove();
        particleContainer.remove();
    }, 2000);
};

// --- Game Start Logic for Allied Healing Sprouts ---
window.applyAlliedHealingSproutsAtGameStart = function() {
    if (!window.gameManager || !window.gameManager.gameState) return;
    
    // Find Julia in the player team
    const julia = window.gameManager.gameState.playerCharacters.find(char => char.id === 'schoolgirl_julia');
    if (!julia || !julia.alliedHealingSproutsAtStart) return;
    
    // Show game start VFX
    window.showAlliedHealingSproutsGameStartVFX();
    
    // Apply Healing Sprout to all player allies (including Julia herself)
    const allies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
    
    allies.forEach(ally => {
        // Create the Healing Sprout buff with 10-turn duration
        const alliedSproutBuff = new Effect(
            'julia_allied_healing_sprout',
            'Allied Healing Sprout',
            'Icons/abilities/sprout_planting.jfif',
            10, // 10-turn duration
            (character) => {
                // Optional: effect each turn
            },
            false
        ).setDescription('A healing sprout that will bloom after 10 turns, restoring health.');

        // Define the onRemove function (called when buff expires or is removed)
        alliedSproutBuff.onRemove = (buffedCharacter) => {
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`The Allied Healing Sprout on ${buffedCharacter.name} blooms!`);
            }

            // Calculate heal amount based on Julia's healingPower
            const baseHeal = 1250;
            const healAmount = Math.floor(baseHeal * (1 + (julia.stats.healingPower || 0)));

            const healResult = buffedCharacter.heal(healAmount, julia, { abilityId: 'julia_allied_healing_sprout' });
            const actualHeal = healResult.healAmount;
            
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${buffedCharacter.name} is healed for ${actualHeal} HP by Allied Healing Sprout.`);
            }

            // Trigger Julia's passive if applicable
            if (actualHeal > 0 && julia.passiveHandler && typeof julia.passiveHandler.onHealDealt === 'function') {
                julia.passiveHandler.onHealDealt(julia, buffedCharacter, actualHeal);
            }

            // Show sprout bloom VFX
            const healedElement = document.getElementById(`character-${buffedCharacter.instanceId || buffedCharacter.id}`);
            if (healedElement) {
                const bloomVfx = document.createElement('div');
                bloomVfx.className = 'sprout-bloom-vfx';
                healedElement.appendChild(bloomVfx);
                setTimeout(() => bloomVfx.remove(), 1500);
            }

            // Play sound effect
            if (window.gameManager && window.gameManager.playSound) {
                window.gameManager.playSound('sounds/juliaa2.mp3');
            }
        };

        // Apply the buff to the ally
        ally.addBuff(alliedSproutBuff.clone());
        
        // Show application VFX
        window.showAlliedHealingSproutsApplicationVFX(ally);
        
        // Update UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(ally);
        }
    });
    
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`Allied Healing Sprouts applied to ${allies.length} allies!`, 'talent-effect aoe');
    }
};

// --- GameStart Event Listener for Allied Healing Sprouts ---
document.addEventListener('GameStart', () => {
    // Delay slightly to ensure all characters are fully loaded
    setTimeout(() => {
        if (typeof window.applyAlliedHealingSproutsAtGameStart === 'function') {
            window.applyAlliedHealingSproutsAtGameStart();
        }
    }, 500);
});

// --- Critical Strike Mastery VFX Function ---
window.showCriticalStrikeMasteryVFX = function(character) {
    if (!character || character.id !== 'schoolgirl_julia') return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;

    // Create main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'julia-critical-mastery-pulse';
    charElement.appendChild(vfxContainer);

    // Create floating text
    const floatText = document.createElement('div');
    floatText.className = 'julia-critical-mastery-float';
    floatText.textContent = '+10% Crit';
    charElement.appendChild(floatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-critical-mastery-particles';
    charElement.appendChild(particleContainer);

    // Create rotating aura
    const aura = document.createElement('div');
    aura.className = 'julia-critical-mastery-aura';
    charElement.appendChild(aura);

    // Create particles
    const numParticles = 10;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-critical-mastery-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 25 + Math.random() * 20;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.4}s`;
        
        particleContainer.appendChild(particle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        vfxContainer.remove();
        floatText.remove();
        particleContainer.remove();
        aura.remove();
    }, 2000);

    // Add log entry
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`${character.name}'s Critical Strike Mastery grants +10% critical chance!`, 'talent-effect damage');
    }
};

// --- Spirit Mastery VFX Function ---
window.showSpiritMasteryVFX = function(character) {
    if (!character || character.id !== 'schoolgirl_julia') return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;

    // Create main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'julia-spirit-mastery-pulse';
    charElement.appendChild(vfxContainer);

    // Create floating text
    const floatText = document.createElement('div');
    floatText.className = 'julia-spirit-mastery-float';
    floatText.textContent = '-2 CD';
    charElement.appendChild(floatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-spirit-mastery-particles';
    charElement.appendChild(particleContainer);

    // Create rotating aura
    const aura = document.createElement('div');
    aura.className = 'julia-spirit-mastery-aura';
    charElement.appendChild(aura);

    // Create spirit energy particles
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-spirit-mastery-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 30 + Math.random() * 25;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        
        particleContainer.appendChild(particle);
    }

    // Create cooldown reduction sparkles
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'julia-spirit-mastery-sparkles';
    charElement.appendChild(sparkleContainer);

    // Create sparkles
    const numSparkles = 8;
    for (let i = 0; i < numSparkles; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'julia-spirit-mastery-sparkle';
        
        // Randomize sparkle position
        const angle = (i / numSparkles) * 360;
        const distance = 20 + Math.random() * 15;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        sparkle.style.setProperty('--sparkle-x', `${x}px`);
        sparkle.style.setProperty('--sparkle-y', `${y}px`);
        
        // Randomize animation delay
        sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
        
        sparkleContainer.appendChild(sparkle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        vfxContainer.remove();
        floatText.remove();
        particleContainer.remove();
        aura.remove();
        sparkleContainer.remove();
    }, 2500);

    // Add log entry
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`${character.name}'s Spirit Mastery reduces Spirits Strength cooldown by an additional 2 turns!`, 'talent-effect utility');
    }
};

// --- Nature's Resilience VFX Function ---
window.showNaturesResilienceVFX = function(character, damageAmount, healAmount, manaAmount) {
    if (!character || character.id !== 'schoolgirl_julia') return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;

    // Create main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'julia-natures-resilience-pulse';
    charElement.appendChild(vfxContainer);

    // Create floating text for HP restoration
    const hpFloatText = document.createElement('div');
    hpFloatText.className = 'julia-natures-resilience-hp-float';
    hpFloatText.textContent = `+${healAmount} HP`;
    charElement.appendChild(hpFloatText);

    // Create floating text for mana restoration
    const manaFloatText = document.createElement('div');
    manaFloatText.className = 'julia-natures-resilience-mana-float';
    manaFloatText.textContent = `+${manaAmount} MP`;
    charElement.appendChild(manaFloatText);

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'julia-natures-resilience-particles';
    charElement.appendChild(particleContainer);

    // Create rotating aura
    const aura = document.createElement('div');
    aura.className = 'julia-natures-resilience-aura';
    charElement.appendChild(aura);

    // Create nature energy particles
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'julia-natures-resilience-particle';
        
        // Randomize particle movement
        const angle = (i / numParticles) * 360;
        const distance = 35 + Math.random() * 30;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--particle-x', `${x}px`);
        particle.style.setProperty('--particle-y', `${y}px`);
        
        // Randomize animation delay
        particle.style.animationDelay = `${Math.random() * 0.6}s`;
        
        particleContainer.appendChild(particle);
    }

    // Create resilience sparkles
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'julia-natures-resilience-sparkles';
    charElement.appendChild(sparkleContainer);

    // Create sparkles
    const numSparkles = 10;
    for (let i = 0; i < numSparkles; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'julia-natures-resilience-sparkle';
        
        // Randomize sparkle position
        const angle = (i / numSparkles) * 360;
        const distance = 25 + Math.random() * 20;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        sparkle.style.setProperty('--sparkle-x', `${x}px`);
        sparkle.style.setProperty('--sparkle-y', `${y}px`);
        
        // Randomize animation delay
        sparkle.style.animationDelay = `${Math.random() * 0.4}s`;
        
        sparkleContainer.appendChild(sparkle);
    }

    // Cleanup after animations complete
    setTimeout(() => {
        vfxContainer.remove();
        hpFloatText.remove();
        manaFloatText.remove();
        particleContainer.remove();
        aura.remove();
        sparkleContainer.remove();
    }, 3000);

    // Add log entry
    if (window.gameManager && window.gameManager.addLogEntry) {
        window.gameManager.addLogEntry(`${character.name}'s Nature's Resilience restores ${healAmount} HP and ${manaAmount} mana after taking damage!`, 'talent-effect healing');
    }
};

// --- Global VFX function for Nature's Fury talent ---
window.showNaturesFuryVFX = function(julia, oldDamage, newDamage) {
    console.log(`[Nature's Fury VFX] Creating VFX for ${julia.name}: ${oldDamage} -> ${newDamage}`);
    
    const characterElement = document.getElementById(`character-${julia.instanceId || julia.id}`);
    if (!characterElement) {
        console.warn(`[Nature's Fury VFX] Character element not found for ${julia.name}`);
        return;
    }
    
    // Create main VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'natures-fury-vfx';
    characterElement.appendChild(vfxContainer);
    
    // Create expanding aura
    const aura = document.createElement('div');
    aura.className = 'natures-fury-aura';
    vfxContainer.appendChild(aura);
    
    // Create power surge effect
    const powerSurge = document.createElement('div');
    powerSurge.className = 'natures-fury-power-surge';
    vfxContainer.appendChild(powerSurge);
    
    // Create particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'natures-fury-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create floating particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'natures-fury-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 0.5 + 's';
        particlesContainer.appendChild(particle);
    }
    
    // Create sparkles
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'natures-fury-sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 1 + 's';
        vfxContainer.appendChild(sparkle);
    }
    
    // Create power text
    const powerText = document.createElement('div');
    powerText.className = 'natures-fury-text';
    powerText.textContent = 'NATURE\'S FURY!';
    vfxContainer.appendChild(powerText);
    
    // Create damage increase text
    setTimeout(() => {
        const damageText = document.createElement('div');
        damageText.className = 'natures-fury-text';
        damageText.style.top = '60%';
        damageText.style.fontSize = '14px';
        damageText.textContent = `+${newDamage - oldDamage} Physical Damage!`;
        vfxContainer.appendChild(damageText);
    }, 500);
    
    // Clean up VFX after animation completes
    setTimeout(() => {
        if (vfxContainer && vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
        }
    }, 3000);
    
    console.log(`[Nature's Fury VFX] VFX created successfully for ${julia.name}`);
}; 