const SUNBURST_ABILITY_ID = 'atlantean_kotal_kahn_q';
const BULWARK_ABILITY_ID = 'atlantean_kotal_kahn_w';
const SACRIFICE_ABILITY_ID = 'atlantean_kotal_kahn_e';

// === Atlantean Kotal Kahn – Sunburst Ability ===
console.log('[KOTAL KAHN] Loading atlantean_kotal_kahn_abilities.js');

/**
 * Returns the current sunlight stacks for the caster.
 * @param {Character} caster
 * @returns {number}
 */
function getSunlightStacks(caster) {
    return typeof caster.stats.currentSunlight === 'number' ? caster.stats.currentSunlight : 0;
}

/**
 * Spawns a short-lived sunlight particle at the given coordinates (battle-container space).
 */
function spawnSunParticle(x, y, lifeTime = 900) {
    const bc = document.querySelector('.battle-container');
    if (!bc) return;
    const p = document.createElement('div');
    p.className = 'sunburst-particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    // Random direction for particle travel
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    p.style.setProperty('--dy', `${(Math.random() - 0.5) * 120}px`);
    bc.appendChild(p);
    setTimeout(() => p.remove(), lifeTime);
}

/**
 * Visual effect for Sunburst – golden radial flare from caster.
 */
function showSunburstVFX(caster) {
    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterEl) return;

    // Central flare overlay
    const flare = document.createElement('div');
    flare.className = 'sunburst-vfx';
    casterEl.appendChild(flare);

    // Spawn outward particles in battle container
    const bcRect = document.querySelector('.battle-container').getBoundingClientRect();
    const cRect = casterEl.getBoundingClientRect();
    const originX = cRect.left + cRect.width / 2 - bcRect.left;
    const originY = cRect.top + cRect.height / 2 - bcRect.top;

    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2) * (i / 20);
        const distance = 40 + Math.random() * 60;
        const x = originX + Math.cos(angle) * distance;
        const y = originY + Math.sin(angle) * distance;
        setTimeout(() => spawnSunParticle(x, y), i * 30);
    }

    // Remove central flare
    setTimeout(() => flare.remove(), 1000);

    // Screen shake for emphasis
    const bc = document.querySelector('.battle-container');
    if (bc) {
        bc.classList.add('shake-animation');
        setTimeout(() => bc.classList.remove('shake-animation'), 450);
    }
}

/**
 * Main effect logic for Sunburst ability.
 */
const sunburstEffect = (caster) => {
    const gm = window.gameManager;
    if (!gm) {
        console.warn('[KOTAL KAHN] GameManager not found – Sunburst aborted');
        return;
    }

    const sunlightStacks = getSunlightStacks(caster);
    const healAmount = 200 + 22 * sunlightStacks;
    const damageAmount = healAmount * 0.5;

    // Consume all current Sunlight stacks upon cast
    caster.stats.currentSunlight = 0;

    // Heal self & allies
    const allies = gm.getAllies(caster);
    allies.forEach(ally => {
        if (!ally.isDead()) {
            ally.heal(healAmount, caster, { abilityId: SUNBURST_ABILITY_ID });
            gm.addLogEntry(`${ally.name} is bathed in Sunburst, healing ${healAmount} HP.`, 'heal');
        }
    });

    // 30% chance to damage each enemy
    const enemies = gm.getOpponents(caster);
    let enemiesDamaged = 0;
    enemies.forEach(enemy => {
        if (!enemy.isDead() && Math.random() < 0.30) {
            const result = enemy.applyDamage(damageAmount, 'magical', caster, { abilityId: SUNBURST_ABILITY_ID });
            gm.addLogEntry(`${enemy.name} is scorched by Sunburst for ${Math.round(result.damage)} damage!`, 'damage');
            enemiesDamaged++;
        }
    });

    // Ensure Sunlight gain for each enemy damaged (passive fallback safety)
    if (enemiesDamaged > 0 && caster.passiveHandler && typeof caster.passiveHandler.addSunlight === 'function') {
        caster.passiveHandler.addSunlight(10 * enemiesDamaged);
    }

    // Visuals
    showSunburstVFX(caster);

    // Update UI for all involved characters
    const updateList = [...allies, ...enemies, caster];
    updateList.forEach(ch => {
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(ch);
        }
    });
};

// Create Ability instance
const sunburstAbility = new Ability(
    SUNBURST_ABILITY_ID,
    'Sunburst',
    'Icons/abilities/sunburst.png',
    0,   // Mana cost – uses sunlight resource instead
    1,   // Cooldown in turns
    sunburstEffect
).setDescription('Heal all allies for 200 + 22 × Sunlight. 50% of the heal amount has a 30% chance to damage each enemy. Consumes all Sunlight.')
 .setTargetType('self'); // Casted on self but affects everyone

/**
 * Solar Bulwark – Fortify Kotal Kahn for 2 turns and protect allies.
 *  • Sets caster's armor and magic shield to 80 (flat) for 2 turns.
 *  • Applies a redirect buff to all allies for 2 turns that funnels *all* damage they would take to Kotal Kahn.
 *  • 0 mana cost, 8-turn cooldown.
 */
const bulwarkEffect = (caster) => {
    const gm = window.gameManager;
    const log = gm?.addLogEntry.bind(gm) || console.log;

    // === 1. Self-buff: flat 80 armor / magic shield for 2 turns ===
    const selfBuff = new Effect(
        'solar_bulwark_self',
        'Solar Bulwark',
        'Icons/abilities/sun_protection.png',
        2, // duration (turns)
        null,
        false
    );

    const NEW_DEF_VALUE = 80;

    selfBuff.statModifiers = [
        { stat: 'armor', operation: 'set', value: NEW_DEF_VALUE },
        { stat: 'magicalShield', operation: 'set', value: NEW_DEF_VALUE }
    ];

    selfBuff.onApply = function (character) {
        // Add persistent aura VFX on character element
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const imgContainer = charElement.querySelector('.image-container') || charElement;
            imgContainer.style.position = imgContainer.style.position || 'relative';
            const aura = document.createElement('div');
            aura.className = 'solar-bulwark-aura';
            aura.style.zIndex = '3';
            imgContainer.appendChild(aura);
            selfBuff._auraEl = aura;
            console.log('[Solar Bulwark] Aura VFX attached to', imgContainer);
        } else {
            console.warn('[Solar Bulwark] Character element not found for aura');
        }

        // Recalculate stats so the set modifiers take effect immediately
        if (typeof character.recalculateStats === 'function') {
            character.recalculateStats('solar_bulwark_apply');
        }
    };

    // Simplified onRemove: just clean up VFX and let recalc handle stat reset
    selfBuff.onRemove = function (character) {
        if (selfBuff._auraEl && selfBuff._auraEl.parentNode) {
            selfBuff._auraEl.remove();
            selfBuff._auraEl = null;
        }
        if (typeof character.recalculateStats === 'function') {
            character.recalculateStats('solar_bulwark_remove');
        }
    };

    selfBuff.remove = selfBuff.onRemove;

    selfBuff.setDescription('Sets armor & magic shield to 80 for 2 turns.');
    caster.addBuff(selfBuff);

    // === 2. Redirect-buff for every ally except caster ===
    if (gm) {
        const allies = gm.getAllies(caster);
        allies.forEach(ally => {
            if (ally === caster || ally.isDead()) return;

            const redirectBuff = new Effect(
                'solar_bulwark_redirect',
                'Solar Protection',
                'Icons/abilities/sun_protection.png',
                2,
                null,
                false
            ).setDescription(`All incoming damage is redirected to ${caster.name}.`);

            // When applied, set the existing Bunny-Bounce redirect flag so the universal redirection framework picks it up.
            redirectBuff.onApply = function (character) {
                character.bunnyBounceRedirectToAliceId = caster.instanceId || caster.id;
            };

            // Clean up on removal.
            redirectBuff.remove = redirectBuff.onRemove = function (character) {
                if (character.bunnyBounceRedirectToAliceId) {
                    delete character.bunnyBounceRedirectToAliceId;
                }
            };

            ally.addBuff(redirectBuff);
        });
    }

    // === 3. VFX (simple golden barrier flash) ===
    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterEl) {
        casterEl.classList.add('solar-bulwark-activate');
        setTimeout(() => casterEl.classList.remove('solar-bulwark-activate'), 1000);
    }

    log(`${caster.name} invokes Solar Bulwark, shielding allies behind his radiant might!`, 'buff');

    // Update UI for caster and allies
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
        if (gm) {
            gm.getAllies(caster).forEach(ch => updateCharacterUI(ch));
        }
    }
};

// Create Ability instance for Solar Bulwark
const bulwarkAbility = new Ability(
    BULWARK_ABILITY_ID,
    'Solar Bulwark',
    'Icons/abilities/sun_protection.png',
    0, // Mana cost
    8, // Cooldown
    bulwarkEffect
).setDescription('For 2 turns: Kotal Kahn\'s armor & magic shield are set to 80 and all ally damage is redirected to him.')
 .setTargetType('self');

/**
 * Blood Sacrifice – Instantly sets Sunlight to 100 and damages Kotal Kahn for 50% of his current HP.
 * Does NOT end the caster's turn.
 */
const bloodSacrificeEffect = (caster, _target, _ability, _actualManaCost, options = {}) => {
    const gm = window.gameManager;
    const log = gm?.addLogEntry.bind(gm) || console.log;

    // Calculate HP loss (50% of current HP, rounded down)
    const currentHp = caster.stats.currentHp || 0;
    const hpLoss = Math.floor(currentHp * 0.5);

    // Apply self-damage (bypass armor & shield)
    if (hpLoss > 0) {
        caster.applyDamage(hpLoss, 'physical', caster, {
            abilityId: SACRIFICE_ABILITY_ID,
            bypassArmor: true,
            bypassMagicalShield: true,
            selfInflicted: true,
            ignoreShield: true // for abilities that look at this flag
        });
    }

    // Set Sunlight stacks to maximum (default 100)
    const maxSunlight = caster.stats.maxSunlight || 100;
    caster.stats.currentSunlight = maxSunlight;

    // Update UI immediately so the player sees new Sunlight & HP values
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }

    // Battle log entry
    log(`${caster.name} performs a Blood Sacrifice – Sunlight surges to ${maxSunlight}, losing ${hpLoss} HP!`, 'ability');

    // Return flag so GameManager keeps the turn active
    return { success: true, doesNotEndTurn: true };
};

// Create Ability instance for Blood Sacrifice
const bloodSacrificeAbility = new Ability(
    SACRIFICE_ABILITY_ID,
    'Blood Sacrifice',
    'Icons/abilities/blood_sacrifice.png',
    0, // Mana cost (uses HP instead)
    5, // Cooldown
    bloodSacrificeEffect
).setDescription('Sets Sunlight to 100 and Kotal Kahn loses 50% of his current HP. Does not end the turn.')
 .setTargetType('self');

// Important: mark ability so AI / turn system recognises it instantly
bloodSacrificeAbility.doesNotEndTurn = true;

// Registration helper so Character class can load abilities dynamically
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities.atlantean_kotal_kahn = function () {
    return { q: sunburstAbility, w: bulwarkAbility, e: bloodSacrificeAbility };
};

// Direct AbilityFactory registration if available
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([sunburstAbility, bulwarkAbility, bloodSacrificeAbility]);
}

// Export to global for debugging
window.kotalKahnAbilities = { q: sunburstAbility, w: bulwarkAbility, e: bloodSacrificeAbility };

console.log('[KOTAL KAHN] Sunburst and Solar Bulwark abilities loaded and registered'); 