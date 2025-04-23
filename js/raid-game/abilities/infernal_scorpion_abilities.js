// Infernal Scorpion Ability: GET OVER HERE

function infernalScorpionGetOverHereEffect(caster, target) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("GET OVER HERE: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses GET OVER HERE on ${target.name}!`);
    playSound('sounds/getoverhere.mp3'); // Add appropriate sound

    // --- Enhanced VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    
    if (casterElement && targetElement) {
        // Create the main chain
        const chainVfx = document.createElement('div');
        chainVfx.className = 'scorpion-chain-vfx';
        document.body.appendChild(chainVfx);

        // Get positions for chain animation
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Position the chain
        chainVfx.style.left = `${startX}px`;
        chainVfx.style.top = `${startY}px`;
        chainVfx.style.width = `${distance}px`;
        chainVfx.style.transform = `rotate(${angle}deg)`;

        // Add spikes to chain (decorative elements)
        const spikeCount = Math.floor(distance / 30); // One spike every 30px
        for (let i = 0; i < spikeCount; i++) {
            const spike = document.createElement('div');
            spike.className = 'chain-spike';
            document.body.appendChild(spike);
            
            // Position spike along chain
            const positionPercent = (i + 1) / (spikeCount + 1);
            const spikeX = startX + (endX - startX) * positionPercent;
            const spikeY = startY + (endY - startY) * positionPercent;
            
            spike.style.left = `${spikeX}px`;
            spike.style.top = `${spikeY}px`;
            
            // Remove spike with chain
            setTimeout(() => spike.remove(), 250);
        }

        // Animate chain extending quickly
        chainVfx.animate([
            { width: '0px' },
            { width: `${distance}px` }
        ], { duration: 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });

        // Remove VFX after a short delay + add impact effects
        setTimeout(() => {
            // Chain retract animation
            chainVfx.animate([
                { width: `${distance}px` },
                { width: '0px' }
            ], { duration: 100, easing: 'cubic-bezier(0.64, 0, 0.78, 0)' }).onfinish = () => chainVfx.remove();

            // Impact VFX at target
            const impactVfx = document.createElement('div');
            impactVfx.className = 'hook-impact-vfx';
            targetElement.appendChild(impactVfx);
            setTimeout(() => impactVfx.remove(), 500);

            // Target pull/shake animation
            targetElement.classList.add('hook-shake-animation');
            setTimeout(() => targetElement.classList.remove('hook-shake-animation'), 500);

            // --- REMOVED: Hooked Debuff Visual Indicator --- 
            /*
            const hookedIndicator = document.createElement('div');
            hookedIndicator.className = 'hooked-debuff-indicator';
            targetElement.appendChild(hookedIndicator);
            // This will be removed when the debuff is removed or expires
            hookedIndicator.id = `hooked-indicator-${target.instanceId || target.id}`;
            */
            // --- END REMOVED --- 
        }, 150); 
    }
    // --- End Enhanced VFX ---

    // Calculate Damage: 250% Physical Damage
    const damage = Math.floor(caster.stats.physicalDamage * 2.5);
    const damageResult = target.applyDamage(damage, 'physical', caster);

    log(`${target.name} takes ${damageResult.damage} physical damage from GET OVER HERE.`);
    if (damageResult.isCritical) {
        log("Critical Hit!");
    }

    // Apply Hooked Debuff
    const hookedDebuff = new Effect(
        'hooked_debuff',
        'Hooked',
        'Icons/abilities/get_over_here.png', // Add an appropriate icon
        6, // Duration: 6 turns
        (character) => {
            // Per-turn effect (optional, none needed here)
        },
        true // isDebuff = true
    ).setDescription('Taking 125% more damage from all sources.');

    // Add a flag to the debuff so we can easily check for it in calculateDamage
    hookedDebuff.increasesDamageTaken = 1.25; // 125% increase
    
    // --- REMOVED: onRemove handler for the visual indicator ---
    /*
    hookedDebuff.onRemove = () => {
        const hookedIndicator = document.getElementById(`hooked-indicator-${target.instanceId || target.id}`);
        if (hookedIndicator) {
            hookedIndicator.remove();
        }
    };
    */
    // --- END REMOVED ---

    target.addDebuff(hookedDebuff);
    log(`${target.name} is Hooked!`);

    // Lifesteal
    caster.applyLifesteal(damageResult.damage);

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
}

// -- Removed incorrect registration call --
/*
// Register the ability effect with AbilityFactory
// This allows the JSON definition's "custom" effect type to find this function
if (typeof AbilityFactory !== 'undefined') {
    AbilityFactory.registerAbilityEffect('infernalScorpionGetOverHereEffect', infernalScorpionGetOverHereEffect);
} else {
    console.warn("Infernal Scorpion ability effect defined but AbilityFactory not found.");
}
*/

// --- CSS for VFX (Add to a relevant CSS file, e.g., raid-game.css or a new infernal_scorpion.css) ---
/*
.scorpion-chain-vfx {
    position: absolute;
    height: 5px;
    background: linear-gradient(to right, #ff8c00, #ffeb3b);
    box-shadow: 0 0 5px #ffeb3b;
    transform-origin: left center;
    z-index: 10;
    pointer-events: none;
}

.hook-impact-vfx {
    position: absolute;
    top: 40%;
    left: 40%;
    width: 20%;
    height: 20%;
    background-image: url('../icons/effects/impact_spark.png'); 
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
    animation: fadeOut 0.5s ease-out forwards;
    z-index: 15;
    pointer-events: none;
}

@keyframes fadeOut {
    from { opacity: 0.8; transform: scale(1); }
    to { opacity: 0; transform: scale(1.5); }
}

.shake-animation {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
*/

// Infernal Scorpion Ability: Fire Breath
function infernalScorpionFireBreathEffect(caster, target) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Fire Breath: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Fire Breath on ${target.name}!`);
    playSound('sounds/fire_breath.wav'); // Add appropriate sound

    // --- VFX --- 
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const fireVfx = document.createElement('div');
        fireVfx.className = 'fire-breath-vfx';
        targetElement.appendChild(fireVfx);
        setTimeout(() => fireVfx.remove(), 1000); // Duration of the effect
    }
    // --- End VFX ---

    // Calculate Damage: 980 + 100% Magical Damage
    const baseDamage = 980;
    const scalingDamage = caster.stats.magicalDamage * 1.0;
    const totalDamage = Math.floor(baseDamage + scalingDamage);
    const damageResult = target.applyDamage(totalDamage, 'magical', caster);

    log(`${target.name} takes ${damageResult.damage} magical damage from Fire Breath.`);
    if (damageResult.isCritical) {
        log("Critical Hit!");
    }

    // Apply Burn Debuff (75% chance)
    const burnChance = 0.75;
    if (Math.random() < burnChance) {
        const burnDamage = 455;
        const burnDuration = 10;
        const burnDebuff = new Effect(
            'burn_debuff',
            'Burn',
            'images/effects/burn.jfif', // Add an appropriate icon
            burnDuration, // Duration
            null, // No instant effect
            true // isDebuff = true
        ).setDescription(`Taking ${burnDamage} damage at the end of each turn.`);

        // Add turn-end effect
        burnDebuff.onTurnEnd = (character) => {
            log(`${character.name} takes ${burnDamage} damage from Burn.`);
            character.applyDamage(burnDamage, 'magical', caster, true); // Apply as magical damage, caster is source, isDot = true
            
            // --- NEW: Play burning sound on tick ---
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/burning.wav'); 
            // --- END NEW ---

            // Add simple burn VFX on turn end
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if(charElement){
                const turnBurnVfx = document.createElement('div');
                turnBurnVfx.className = 'burn-tick-vfx';
                charElement.appendChild(turnBurnVfx);
                setTimeout(() => turnBurnVfx.remove(), 500);
            }
        };

        // --- NEW: Apply persistent burning VFX to the character when debuff is added ---
        // Create wrapper function to handle both applying and removing VFX
        const applyBurnVFX = (character) => {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (!characterElement) return;
            
            // Check if the burn VFX is already applied
            if (characterElement.querySelector('.character-burn-vfx')) return;
            
            // Create the burning VFX container
            const burnVfx = document.createElement('div');
            burnVfx.className = 'character-burn-vfx';
            burnVfx.id = `burn-vfx-${character.instanceId || character.id}`;
            
            // Add 5-7 ember particles that rise up from random positions
            const emberCount = 5 + Math.floor(Math.random() * 3);
            for (let i = 0; i < emberCount; i++) {
                const ember = document.createElement('div');
                ember.className = 'burn-ember';
                ember.style.left = `${10 + Math.random() * 80}%`;
                ember.style.setProperty('--duration', `${1.5 + Math.random() * 1.5}s`);
                ember.style.animationDelay = `${Math.random() * 2}s`;
                burnVfx.appendChild(ember);
            }
            
            // Add the VFX to the character element
            characterElement.appendChild(burnVfx);
            
            log(`${character.name} is burning!`, "effect");
        };
        
        // Add onApply handler to apply the VFX when debuff is added
        burnDebuff.onApply = (character) => {
            applyBurnVFX(character);
        };
        
        // Add onRemove handler to clean up the VFX when debuff is removed
        burnDebuff.onRemove = (character) => {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (!characterElement) return;
            
            const burnVfx = characterElement.querySelector(`#burn-vfx-${character.instanceId || character.id}`);
            if (burnVfx) {
                // Fade out animation before removal
                burnVfx.style.animation = "fadeOut 0.5s forwards";
                setTimeout(() => {
                    if (burnVfx.parentNode === characterElement) {
                        characterElement.removeChild(burnVfx);
                    }
                }, 500);
            }
            
            log(`${character.name} is no longer burning.`, "effect");
        };
        // --- END NEW ---

        target.addDebuff(burnDebuff);
        log(`${target.name} is Burned!`);
        
        // --- NEW: Apply the VFX immediately after adding the debuff ---
        applyBurnVFX(target);
        // --- END NEW ---
    }

    // Lifesteal (unlikely for magical DOT ability, but include if needed)
    // caster.applyLifesteal(damageResult.damage);

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
}

// --- CSS for VFX (Add to a relevant CSS file, e.g., infernal_scorpion.css) --- 
/*
.fire-breath-vfx {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20%;
    height: 20%;
    background-image: url('../icons/effects/fire_breath.png'); 
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
    animation: fadeOut 0.5s ease-out forwards;
    z-index: 15;
    pointer-events: none;
}

@keyframes fadeOut {
    from { opacity: 0.8; transform: scale(1); }
    to { opacity: 0; transform: scale(1.5); }
}

.burn-tick-vfx {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20%;
    height: 20%;
    background-image: url('../icons/effects/burn_tick.png'); 
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
    animation: fadeOut 0.5s ease-out forwards;
    z-index: 15;
    pointer-events: none;
}

@keyframes fadeOut {
    from { opacity: 0.8; transform: scale(1); }
    to { opacity: 0; transform: scale(1.5); }
}
*/ 

// Helper function to show Dual Blade Strike VFX
function showDualBladeStrikeVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!casterElement || !targetElement) return;

    // Create main container for the effect over the target
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'infernal-scorpion-dual-strike-vfx';

    // Add two fiery slashes
    for (let i = 0; i < 2; i++) {
        const slash = document.createElement('div');
        slash.className = `fiery-slash slash-${i + 1}`;
        slash.style.animationDelay = `${i * 0.15}s`; // Stagger the slashes
        vfxContainer.appendChild(slash);
    }

    // Add impact sparks
    const sparks = document.createElement('div');
    sparks.className = 'impact-sparks';
    vfxContainer.appendChild(sparks);

    targetElement.appendChild(vfxContainer);

    // --- Caster Animation ---
    casterElement.classList.add('caster-strike-animation');


    // Remove VFX and caster animation after duration
    setTimeout(() => {
        vfxContainer.remove();
        casterElement.classList.remove('caster-strike-animation');
    }, 1200); // Match CSS animation duration
}

// Dual Blade Strike effect logic
const dualBladeStrikeEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Calculate base damage per hit: 250% Physical + 100% Magical
    const baseDamagePerHit = Math.floor((caster.stats.physicalDamage * 2.5) + (caster.stats.magicalDamage * 1.0));

    log(`${caster.name} uses Dual Blade Strike on ${target.name}!`);
    // --- NEW: Play Dual Blade sound ---
    playSound('sounds/dual_blade.mp3');
    // --- END NEW ---

    // Apply damage twice
    let totalDamageDealt = 0;
    for (let i = 0; i < 2; i++) {
        // Apply damage as physical, allow passive procs (isChainReaction = false)
        const damageResult = target.applyDamage(baseDamagePerHit, 'physical', caster, false);
        totalDamageDealt += damageResult.damage; // Access the damage property
        log(`Strike ${i + 1} hits ${target.name} for ${damageResult.damage} physical damage.`); // Log damageResult.damage
    }

    // Show VFX
    showDualBladeStrikeVFX(caster, target);

    // Update UI (applyDamage should handle target UI update)
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster); // Update caster UI (e.g., mana)
    }

    return totalDamageDealt > 0; // Return true if damage was dealt
};

// Create Ability object
const dualBladeStrikeAbility = new Ability(
    'infernal_scorpion_dual_strike', // Unique ID
    'Dual Blade Strike',
    'Icons/abilities/dual_blade_strike.png', // Placeholder icon path
    30, // Mana cost
    3,  // Cooldown
    dualBladeStrikeEffect
).setDescription('Deals (250% Physical Damage + 100% Magical Damage) as physical damage to the target twice. Each hit can trigger passives.')
 .setTargetType('enemy');

// Register the ability
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([dualBladeStrikeAbility]);
        console.log("Infernal Scorpion - Dual Blade Strike ability registered.");
    } else {
        console.warn("Infernal Scorpion ability defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.infernal_scorpion_dual_strike = dualBladeStrikeAbility;
    }
});

// --- NEW: Infernal Scorpion Ability: Open Portal ---

// Helper function for Open Portal VFX
function showOpenPortalVFX(caster, targets) {
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/open_portal.mp3'); // Add appropriate sound

    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        // Caster animation (e.g., raising hand)
        const portalCastVfx = document.createElement('div');
        portalCastVfx.className = 'infernal-portal-cast-vfx';
        casterElement.appendChild(portalCastVfx);
        setTimeout(() => portalCastVfx.remove(), 1500);
    }

    targets.forEach((target, index) => {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            // Portal effect over each target
            const portalVfx = document.createElement('div');
            portalVfx.className = 'infernal-portal-target-vfx';
            portalVfx.style.animationDelay = `${index * 0.15}s`; // Stagger appearance

            // Add swirling particles inside the portal
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'portal-particle';
                particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
                particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
                portalVfx.appendChild(particle);
            }

            targetElement.appendChild(portalVfx);

            // Disable effect indicator (visual cue)
            const disableIndicator = document.createElement('div');
            disableIndicator.className = 'portal-disable-indicator';
            disableIndicator.innerHTML = '🚫'; // Simple symbol
            disableIndicator.title = 'Ability Disabled';
            targetElement.appendChild(disableIndicator);

            // Remove portal and indicator after duration
            setTimeout(() => {
                portalVfx.remove();
                // Keep the indicator until the debuff is removed naturally
            }, 1800); // Slightly longer than disable animation
        }
    });
}

// Open Portal effect logic
const infernalScorpionOpenPortalEffect = (caster, target) => { // Target is caster ('self')
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;

    if (!gameManager) {
        log("Open Portal: GameManager not found!", "error");
        return;
    }

    log(`${caster.name} uses Open Portal!`);

    // --- CORRECTED TARGET ACQUISITION ---
    // Determine the opponent list based on the caster
    const opponentList = caster.isAI
        ? gameManager.gameState.playerCharacters // If caster is AI, opponents are players
        : gameManager.gameState.aiCharacters;    // If caster is player, opponents are AI

    // Get all living opponents
    const enemies = opponentList.filter(char => !char.isDead());
    // --- END CORRECTION ---

    if (enemies.length === 0) {
        log("Open Portal: No enemies to target.", "info");
        // Still reduce own cooldowns even if no enemies
    } else {
        log("Disabling abilities on enemies...");
        // Apply disable debuff to each enemy
        enemies.forEach(enemy => {
            const availableAbilities = enemy.abilities.filter(ability =>
                ability && !ability.isDisabled && !ability.isPassive // Exclude already disabled and passives
            );

            if (availableAbilities.length === 0) {
                log(`${enemy.name} has no active abilities available to disable.`, "info");
                return; // Skip this enemy
            }

            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            const abilityToDisable = availableAbilities[randomIndex];
            const duration = 5;

            log(`${enemy.name}'s ${abilityToDisable.name} is disabled by the portal!`);

            // Create the disable debuff
            const disableDebuff = new Effect(
                `portal_disable_${enemy.instanceId || enemy.id}_${abilityToDisable.id}`, // Unique ID
                'Ability Disabled (Portal)',
                'Icons/abilities/open_portal.jfif', // Generic disable icon
                duration,
                null, // No per-turn effect
                true // isDebuff = true
            ).setDescription(`Disables ${abilityToDisable.name} for ${duration} turns.`);

            // Store which ability was disabled
            disableDebuff.disabledAbilityId = abilityToDisable.id;

            // Apply the disable state directly to the ability
            abilityToDisable.isDisabled = true;
            abilityToDisable.disabledDuration = duration; // Set initial duration

            // Define the remove logic for the debuff
            disableDebuff.remove = (character) => {
                const originallyDisabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
                if (originallyDisabledAbility) {
                    // Only re-enable if it's still disabled *by this duration*
                    // Prevents issues if re-disabled by another source
                    if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                         originallyDisabledAbility.isDisabled = false;
                         log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Open Portal.`);
                         // Remove visual indicator
                         const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
                         if (targetElement) {
                             const indicator = targetElement.querySelector('.portal-disable-indicator');
                             if (indicator) indicator.remove();
                         }
                         // Update UI
                         if (window.gameManager && window.gameManager.uiManager) {
                             window.gameManager.uiManager.updateCharacterUI(character);
                         }
                    }
                } else {
                    log(`Could not find ability ${disableDebuff.disabledAbilityId} on ${character.name} to re-enable from Portal.`);
                }
            };

            // Add the debuff to the enemy
            enemy.addDebuff(disableDebuff.clone()); // Clone for unique instance

            // Update enemy UI
            updateCharacterUI(enemy);
        });

        // Show VFX after processing all enemies
        showOpenPortalVFX(caster, enemies);
    }


    // Reduce caster's ability cooldowns
    log(`${caster.name}'s ability cooldowns are reduced by 2 turns.`);
    caster.abilities.forEach(ability => {
        // Don't reduce the cooldown of Open Portal itself
        if (ability.id !== 'infernal_scorpion_open_portal' && ability.currentCooldown > 0) {
            ability.reduceCooldown(2);
            log(`Reduced cooldown for ${ability.name} by 2.`);
        }
    });

    // Update caster UI
    updateCharacterUI(caster);

    return true; // Ability used successfully
};

// Create Ability object for Open Portal
const openPortalAbility = new Ability(
    'infernal_scorpion_open_portal', // Unique ID
    'Open Portal',
    'Icons/abilities/open_portal.jfif', // Placeholder icon path - NEED AN ICON
    100, // Mana cost
    6,  // Cooldown
    infernalScorpionOpenPortalEffect
).setDescription('Opens a chaotic portal, disabling one random non-passive ability on each enemy for 5 turns. Reduces own ability cooldowns by 2 turns.')
 .setTargetType('self'); // Affects enemies globally, triggered by self-cast

// Register the new ability along with existing ones
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            dualBladeStrikeAbility, // Keep existing
            openPortalAbility       // Add new R ability
        ]);
        console.log("Infernal Scorpion - Dual Blade Strike & Open Portal abilities registered.");
    } else {
        console.warn("Infernal Scorpion abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback registration
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.infernal_scorpion_dual_strike = dualBladeStrikeAbility;
        window.definedAbilities.infernal_scorpion_open_portal = openPortalAbility; // Add R to fallback
    }
}); 