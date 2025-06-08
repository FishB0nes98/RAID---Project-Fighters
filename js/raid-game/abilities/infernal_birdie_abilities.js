// Ability definition for Infernal Birdie: Chain Slash

// Assume Ability, Effect, Character classes and necessary game manager access are available

const chainSlashEffect = (caster, targets) => { // targetOrTargets is automatically resolved to enemy array by game logic for 'all_enemies'
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const gameState = window.gameManager ? window.gameManager.gameState : null;

    if (!gameState) {
        log("Chain Slash Error: Cannot access game state!", "error");
        return;
    }

    // Target all enemy characters (passed as targets array)
    const enemies = targets; // Use the provided targets array

    if (!Array.isArray(enemies) || enemies.length === 0) {
        log(`${caster.name} uses Chain Slash, but finds no targets!`);
        return; // No enemies to hit
    }

    log(`${caster.name} unleashes Chain Slash!`);

    // --- VFX ---
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Add caster animation (e.g., swinging animation)
        casterElement.classList.add('chain-slash-cast-animation');
        setTimeout(() => casterElement.classList.remove('chain-slash-cast-animation'), 1000);
        
        // Add dramatic slash effect behind caster
        const slashEffect = document.createElement('div');
        slashEffect.className = 'chain-slash-effect';
        casterElement.appendChild(slashEffect);
        setTimeout(() => slashEffect.remove(), 1000);
        
        // Play sound effect
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/chain_slash.mp3', 0.8);
        }
    }

    // --- Damage Calculation ---
    const fixedPhysicalDamage = 800;
    const scaledPhysicalDamage = Math.floor((caster.stats.physicalDamage || 0) * 1.0);
    const scaledMagicalDamage = Math.floor((caster.stats.magicalDamage || 0) * 1.0);
    const totalPhysicalDamage = fixedPhysicalDamage + scaledPhysicalDamage;

    // --- Stun Details ---
    const stunChance = 0.40;
    const stunDuration = 2;
    const stunDebuffId = 'chain_slash_stun';
    const stunName = 'Stunned (Chain Slash)';
    const stunIcon = 'Icons/effects/stun.png'; // Placeholder stun icon

    enemies.forEach(enemy => {
        if (enemy && !enemy.isDead()) {
            log(`${caster.name}'s Chain Slash strikes ${enemy.name}!`);

            const enemyElementId = enemy.instanceId || enemy.id;
            const enemyElement = document.getElementById(`character-${enemyElementId}`);
            if (enemyElement) {
                // Add chain impact VFX to each enemy
                const impactVfx = document.createElement('div');
                impactVfx.className = 'chain-slash-impact-vfx';
                enemyElement.appendChild(impactVfx);
                // Add chain graphic
                const chainGfx = document.createElement('div');
                chainGfx.className = 'chain-slash-chain-gfx';
                enemyElement.appendChild(chainGfx);

                setTimeout(() => {
                    impactVfx.remove();
                    chainGfx.remove();
                }, 800);
            }

            // Apply Physical Damage
            if (totalPhysicalDamage > 0) {
                const physResult = enemy.applyDamage(totalPhysicalDamage, 'physical', caster);
                log(`${enemy.name} takes ${physResult.damage} physical damage.`);
                 // Trigger caster's lifesteal if applicable
                 if (caster.stats.lifesteal > 0) {
                     caster.applyLifesteal(physResult.damage);
                 }
            }

            // Apply Magical Damage
            if (scaledMagicalDamage > 0) {
                const magicResult = enemy.applyDamage(scaledMagicalDamage, 'magical', caster);
                log(`${enemy.name} takes ${magicResult.damage} magical damage.`);
                 // Trigger caster's lifesteal if applicable
                 if (caster.stats.lifesteal > 0) {
                     caster.applyLifesteal(magicResult.damage);
                 }
            }

            // Check for Stun
            if (Math.random() < stunChance) {
                log(`${enemy.name} is stunned by Chain Slash!`);
                const stunDebuff = {
                    id: stunDebuffId,
                    name: stunName,
                    icon: stunIcon,
                    duration: stunDuration,
                    description: `Cannot act for ${stunDuration} turns.`,
                    isDebuff: true,
                    effects: { cantAct: true }, // Add flag for isStunned() check
                    remove: function(character) {
                        log(`${character.name} is no longer stunned by Chain Slash.`, 'status');
                        // Additional cleanup if needed
                    }
                };
                enemy.addDebuff(stunDebuff);

                // --- NEW: Trigger Caster's Passive on Stun ---
                if (caster.passiveHandler && typeof caster.passiveHandler.onStunApplied === 'function') {
                    caster.passiveHandler.onStunApplied(caster, enemy);
                }
                // --- END NEW ---

                // Optional: Add stun visual indicator directly here or via CSS rules
                if (enemyElement) {
                    const stunIndicator = document.createElement('div');
                    stunIndicator.className = 'status-effect-stunned'; // Generic stun indicator class
                    stunIndicator.title = `Stunned (${stunDuration} turns)`;
                    // Append to a dedicated status container if available, else fallback
                    const statusContainer = enemyElement.querySelector('.status-effects-container') || enemyElement;
                    statusContainer.appendChild(stunIndicator);
                    // Removal should be handled by the general debuff removal logic or the debuff's remove function
                }
            }

            // Update UI after damage and potential stun
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(enemy);
            }
             // Update caster UI after potential lifesteal
             if (typeof updateCharacterUI === 'function') {
                 updateCharacterUI(caster);
             }
        }
    });

    // Play Sound
    // playSound('sounds/infernal_birdie_q.mp3', 0.8); // Placeholder sound
};

// --- NEW: Drink Up! Ability Logic ---
const drinkUpEffect = (caster, target) => { // target will be the caster for 'self' targetType
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    const healAmount = 800;
    const buffDuration = 4;
    const healingPowerIncrease = 0.20;
    const buffId = 'drink_up_healing_power_buff';
    const buffName = 'Healing Boost';
    const buffIcon = 'Icons/abilities/drink_up.webp'; // Placeholder buff icon

    log(`${caster.name} uses Drink Up!`);
    playSound('sounds/drink_potion.mp3', 0.7); // Placeholder sound

    // 1. Heal the caster
    const actualHeal = caster.heal(healAmount);
    log(`${caster.name} healed for ${actualHeal} HP.`);

    // 2. Apply Healing Power Buff
    const healingPowerBuff = new Effect(
        buffId,
        buffName,
        buffIcon,
        buffDuration,
        null, // No per-turn effect needed, handled by statModifiers
        false // isDebuff = false
    ).setDescription(`Increases Healing Power by ${healingPowerIncrease * 100}% for ${buffDuration} turns.`);

    // Add stat modifier
    healingPowerBuff.statModifiers = [
        { stat: 'healingPower', value: healingPowerIncrease, operation: 'add' }
    ];

    caster.addBuff(healingPowerBuff);
    log(`${caster.name} gained ${buffName} for ${buffDuration} turns.`);

    // 3. Add VFX
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Heal/Drink VFX
        const drinkVfx = document.createElement('div');
        drinkVfx.className = 'drink-up-vfx'; // Defined in CSS
        casterElement.appendChild(drinkVfx);
        setTimeout(() => drinkVfx.remove(), 1200);

        // Buff Apply VFX
        const buffVfx = document.createElement('div');
        buffVfx.className = 'drink-up-buff-vfx'; // Defined in CSS
        casterElement.appendChild(buffVfx);
        setTimeout(() => buffVfx.remove(), 1200);
    }

    // Update caster UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
};
// --- END Drink Up! Ability Logic ---

// --- NEW: Headbutt Ability Logic ---
const headbuttEffect = (caster, target) => { // target is already resolved to the single enemy target
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect; // Assuming Effect class is globally available

    if (!target || target.isDead()) {
        log(`${caster.name} tries to Headbutt, but the target is invalid or defeated.`);
        return;
    }
    if (!Effect) {
        log("Headbutt Error: Cannot access Effect class!", "error");
        return;
    }

    log(`${caster.name} uses Headbutt on ${target.name}!`);
    // playSound('sounds/headbutt_impact.mp3', 0.8); // TODO: Add a sound later

    // --- Damage Calculation ---
    const physicalDamageMultiplier = 0.65;
    const physicalDamage = Math.floor((caster.stats.physicalDamage || 0) * physicalDamageMultiplier);

    // --- Stun Details ---
    const stunDuration = 2;
    const stunDebuffId = 'headbutt_stun'; // Specific ID for this stun
    const stunName = 'Stunned (Headbutt)';
    const stunIcon = 'Icons/effects/stun.png'; // Re-use generic stun icon

    // --- Apply Damage ---
    if (physicalDamage > 0) {
        const physResult = target.applyDamage(physicalDamage, 'physical', caster);
        log(`${target.name} takes ${physResult.damage} physical damage from Headbutt.`);
        // Trigger lifesteal if applicable (although Birdie's passive adds lifesteal, base might be 0)
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(physResult.damage);
        }
    }

    // --- Apply Stun ---
    log(`${target.name} is stunned by Headbutt!`);
    const stunDebuff = new Effect(
        stunDebuffId,
        stunName,
        stunIcon,
        stunDuration,
        null, // No per-turn effect function needed
        true // isDebuff = true
    ).setDescription(`Cannot act for ${stunDuration} turns due to Headbutt.`);

    // Add the 'cantAct' effect property for isStunned() check
    stunDebuff.effects = { cantAct: true };

    target.addDebuff(stunDebuff);

    // --- Trigger Caster's Passive on Stun ---
    if (caster.passiveHandler && typeof caster.passiveHandler.onStunApplied === 'function') {
        caster.passiveHandler.onStunApplied(caster, target);
    }

    // --- VFX ---
    // Caster Animation
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        casterElement.classList.add('headbutt-cast-animation'); // Add CSS class
        setTimeout(() => casterElement.classList.remove('headbutt-cast-animation'), 800);
    }

    // Target Impact VFX
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const impactVfx = document.createElement('div');
        impactVfx.className = 'headbutt-impact-vfx'; // Add CSS class
        targetElement.appendChild(impactVfx);
        setTimeout(() => impactVfx.remove(), 800);
    }

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        // Update caster only if lifesteal might have triggered or passive modified stats
        if (caster.stats.lifesteal > 0 || (caster.passiveHandler && typeof caster.passiveHandler.onStunApplied === 'function')) {
             updateCharacterUI(caster);
        }
    }
};
// --- END Headbutt Ability Logic ---

// --- NEW: Fire Shield Ability Logic ---
const fireShieldEffect = (caster, target) => { // target will be caster for 'self' type
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const Effect = window.Effect; // Assuming Effect class is globally available

    if (!Effect) {
        log("Fire Shield Error: Cannot access Effect class!", "error");
        return;
    }

    const buffDuration = 5;
    const damageReductionPercent = 0.25;
    const retaliationPercent = 0.50;
    const buffId = 'fire_shield_buff';
    const buffName = 'Fire Shield';
    const buffIcon = 'Icons/abilities/fire_shield.jfif'; // Placeholder icon

    log(`${caster.name} activates Fire Shield!`);
    // playSound('sounds/fire_shield_activate.mp3', 0.8); // TODO: Add sound

    // Define the buff
    const fireShieldBuff = new Effect(
        buffId,
        buffName,
        buffIcon,
        buffDuration,
        null, // No per-turn effect function needed here
        false // isDebuff = false
    ).setDescription(`Reduces incoming damage by ${damageReductionPercent * 100}% and retaliates for ${retaliationPercent * 100}% of damage taken before reduction (as magic damage) for ${buffDuration} turns.`);

    // Add the custom properties for damage reduction and retaliation
    fireShieldBuff.effects = {
        damageReductionPercent: damageReductionPercent,
        retaliationPercent: retaliationPercent
    };

    // Apply the buff to the caster
    caster.addBuff(fireShieldBuff);
    log(`${caster.name} gained ${buffName} for ${buffDuration} turns.`);

    // Hook into the character's damage handler to implement retaliation
    // This hook will be checked when the character takes damage
    fireShieldBuff.onDamageTaken = function(character, damageAmount, damageType, attacker) {
        if (!attacker || attacker.isDead()) return;

        // Calculate retaliation damage
        const retaliationDamage = Math.floor(damageAmount * this.effects.retaliationPercent);
        log(`${character.name}'s Fire Shield retaliates against ${attacker.name} for ${retaliationDamage} magical damage!`);
        
        // Apply retaliation damage to attacker
        attacker.applyDamage(retaliationDamage, 'magical', character);
        
        // Add VFX to the attacker
        const attackerElementId = attacker.instanceId || attacker.id;
        const attackerElement = document.getElementById(`character-${attackerElementId}`);
        if (attackerElement) {
            const retaliationVfx = document.createElement('div');
            retaliationVfx.className = 'fire-shield-retaliate-vfx';
            attackerElement.appendChild(retaliationVfx);
            setTimeout(() => retaliationVfx.remove(), 600);
        }
        
        // Play retaliation sound
        if (window.gameManager && typeof window.gameManager.playSound === 'function') {
            window.gameManager.playSound('sounds/fire_impact.mp3', 0.7);
        }
        
        // Update attacker UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(attacker);
        }
    };

    // --- VFX --- 
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Add a fiery aura VFX
        const auraVfx = document.createElement('div');
        auraVfx.className = 'fire-shield-aura-vfx'; // Needs CSS definition
        // Add to a container *within* the character element if possible, or directly
        const imageContainer = casterElement.querySelector('.image-container') || casterElement;
        imageContainer.appendChild(auraVfx);

        // Store the aura element on the buff object to remove it later
        fireShieldBuff.auraElement = auraVfx;

        // Optional: Add a one-shot activation VFX
        const activationVfx = document.createElement('div');
        activationVfx.className = 'fire-shield-activation-vfx'; // Needs CSS definition
        casterElement.appendChild(activationVfx);
        setTimeout(() => activationVfx.remove(), 1000);
    }

    // Add a remove function to the buff to clean up the aura VFX
    fireShieldBuff.remove = function(character) {
        if (this.auraElement) {
            this.auraElement.remove();
            log(`${character.name}'s Fire Shield aura fades.`);
        }
        // Call the default Effect remove if needed (it currently just logs)
        // Effect.prototype.remove.call(this, character);
    };

    // Update caster UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
};
// --- END Fire Shield Ability Logic ---

const chainSlashAbility = new Ability(
    'infernal_birdie_chain_slash',
    'Chain Slash',
    'Icons/abilities/chain_slash.webp', // Make sure this icon exists
    50,  // Mana cost
    2,   // Cooldown
    chainSlashEffect // The function implementing the logic
).setDescription('Deals 800 + 100% Physical Damage and 100% Magical Damage to all enemies. Has a 40% chance to stun each target for 2 turns.')
 .setTargetType('all_enemies'); // Explicitly set target type

// --- NEW: Drink Up! Ability Instance ---
const drinkUpAbility = new Ability(
    'infernal_birdie_drink_up',
    'Drink Up!',
    'Icons/abilities/drink_up.webp',
    100, // Mana cost
    14,  // Cooldown
    drinkUpEffect // The function implementing the logic
).setDescription('Heals self for 800 HP and increases Healing Power by 20% for 4 turns. Cooldown reduced by 1 when healed.')
 .setTargetType('self');

// --- NEW: Headbutt Ability Instance ---
const headbuttAbility = new Ability(
    'infernal_birdie_headbutt',
    'Headbutt',
    'Icons/abilities/headbutt.webp', // Make sure this icon exists
    20,  // Mana cost
    5,   // Cooldown
    headbuttEffect // The function implementing the logic
).setDescription('Deals 65% Physical Damage and stuns the target for 2 turns.')
 .setTargetType('enemy');

// --- NEW: Fire Shield Ability Instance ---
const fireShieldAbility = new Ability(
    'infernal_birdie_fire_shield',
    'Fire Shield',
    'Icons/abilities/fire_shield.jfif', // Placeholder icon
    150, // Mana cost (adjust as needed)
    10,  // Cooldown (adjust as needed)
    fireShieldEffect // The function implementing the logic
).setDescription('Grants 25% damage reduction for 5 turns. Attackers take 50% of the damage they deal (before reduction) back as magic damage.')
 .setTargetType('self');

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        chainSlashAbility,
        drinkUpAbility,
        headbuttAbility,
        fireShieldAbility // Add the ultimate ability here
    ]);
    console.log("[AbilityFactory] Registered Infernal Birdie abilities.");
} else {
    console.warn("Infernal Birdie abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.infernal_birdie_chain_slash = chainSlashAbility;
    window.definedAbilities.infernal_birdie_drink_up = drinkUpAbility;
    window.definedAbilities.infernal_birdie_headbutt = headbuttAbility;
    window.definedAbilities.infernal_birdie_fire_shield = fireShieldAbility; // Add here too
} 