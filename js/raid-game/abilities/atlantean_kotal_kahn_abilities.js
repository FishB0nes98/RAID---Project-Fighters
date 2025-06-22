const SUNBURST_ABILITY_ID = 'atlantean_kotal_kahn_q';
const BULWARK_ABILITY_ID = 'atlantean_kotal_kahn_w';
const SACRIFICE_ABILITY_ID = 'atlantean_kotal_kahn_e';
const DAGGER_ABILITY_ID = 'atlantean_kotal_kahn_r';

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
    const healAmount = 200 + 12 * sunlightStacks;
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
        caster.passiveHandler.addSunlight(5 * enemiesDamaged);
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
).setDescription('Heal all allies for 200 + 12 × Sunlight. 50% of the heal amount has a 30% chance to damage each enemy. Consumes all Sunlight.')
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

// === Atlantean Kotal Kahn – Dagger Throw (Ultimate) ===

/**
 * Creates and returns a Bleeding debuff that deals 100 damage per turn for 3 turns.
 * Each tick grants Kotal Kahn 10 Sunlight via his passive.
 * @param {Character} caster
 * @returns {Effect}
 */
function createBleedingDebuff(caster) {
    const debuff = new Effect(
        'atlantean_dagger_bleed',
        'Bleeding',
        'Icons/effects/bleeding.png',
        3,
        {
            type: 'damage_over_time',
            value: 100
        },
        true // isDebuff
    );

    debuff.setDescription('Takes 100 damage each turn. Kotal Kahn gains 10 Sunlight when damage is applied.');

    // Visual feedback when applied
    debuff.onApply = function (victim) {
        if (window.HoundPassive) {
            try {
                const hp = new window.HoundPassive();
                hp.showBleedingStackVFX(victim, 1);
            } catch (e) { console.warn('[DaggerThrow] Bleed VFX error (apply):', e); }
        }
    };

    // Every turn: give sunlight & show damage VFX using HoundPassive visuals
    debuff.onTurnEnd = function (victim) {
        if (caster && !caster.isDead() && caster.passiveHandler && typeof caster.passiveHandler.addSunlight === 'function') {
            caster.passiveHandler.addSunlight(5);
        }
        if (window.HoundPassive) {
            try {
                const hp = new window.HoundPassive();
                hp.showBleedDamageVFX(victim, 100);
            } catch (e) { console.warn('[DaggerThrow] Bleed VFX error (tick):', e); }
        }
    };

    return debuff;
}

/**
 * Simple 2-turn stun debuff helper.
 */
function createStunDebuff() {
    return {
        id: 'dagger_throw_stun',
        name: 'Stunned',
        icon: 'Icons/effects/stun.png',
        duration: 2,
        effects: { cantAct: true },
        description: 'Cannot act for 2 turns.'
    };
}

/**
 * Spawns a dagger projectile travelling from (x1,y1) → (x2,y2).
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {HTMLElement} container
 * @param {number} travelTime – ms
 * @param {function} onImpact – callback after impact
 */
function spawnDaggerProjectile(x1, y1, x2, y2, container, travelTime = 450, onImpact = () => {}) {
    const dagger = document.createElement('div');
    dagger.className = 'dagger-projectile';

    // Position at start
    dagger.style.left = `${x1}px`;
    dagger.style.top = `${y1}px`;

    // Angle so the dagger faces the target
    const angleRad = Math.atan2(y2 - y1, x2 - x1);
    const angleDeg = angleRad * 180 / Math.PI;
    dagger.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;

    container.appendChild(dagger);

    // Trail particle interval
    const trailInterval = setInterval(() => {
        const trail = document.createElement('div');
        trail.className = 'dagger-trail';
        trail.style.left = dagger.style.left;
        trail.style.top = dagger.style.top;
        container.appendChild(trail);
        setTimeout(() => trail.remove(), 400);
    }, 40);

    // Animate
    const anim = dagger.animate([
        { left: `${x1}px`, top: `${y1}px` },
        { left: `${x2}px`, top: `${y2}px` }
    ], {
        duration: travelTime,
        easing: 'linear'
    });

    anim.onfinish = () => {
        clearInterval(trailInterval);
        // Impact flash
        const impact = document.createElement('div');
        impact.className = 'dagger-impact';
        impact.style.left = `${x2}px`;
        impact.style.top = `${y2}px`;
        container.appendChild(impact);
        setTimeout(() => impact.remove(), 300);
        dagger.remove();
        onImpact();
    };
}

/**
 * Visual sequence for dagger throw (with optional bounce).
 */
function showDaggerThrowVFX(caster, firstTarget, secondTarget = null) {
    const bc = document.querySelector('.battle-container');
    if (!bc) return;

    const getCenter = el => {
        const r = el.getBoundingClientRect();
        const bcR = bc.getBoundingClientRect();
        return { x: r.left + r.width / 2 - bcR.left, y: r.top + r.height / 2 - bcR.top };
    };

    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const t1El = document.getElementById(`character-${firstTarget.instanceId || firstTarget.id}`);
    if (!casterEl || !t1El) return;

    const start = getCenter(casterEl);
    const end1 = getCenter(t1El);

    // First throw
    spawnDaggerProjectile(start.x, start.y, end1.x, end1.y, bc, 450, () => {
        if (secondTarget) {
            const t2El = document.getElementById(`character-${secondTarget.instanceId || secondTarget.id}`);
            if (!t2El) return;
            const end2 = getCenter(t2El);
            // Bounce after brief delay
            setTimeout(() => {
                spawnDaggerProjectile(end1.x, end1.y, end2.x, end2.y, bc, 400);
            }, 100);
        }
    });
}

const daggerThrowEffect = (caster, initialTarget) => {
    const gm = window.gameManager;
    if (!gm || !initialTarget) return false;

    // Helper to apply effects
    const applyToTarget = (target) => {
        if (!target || target.isDead()) return;
        const dmgResult = target.applyDamage(700, 'physical', caster, { abilityId: DAGGER_ABILITY_ID });
        gm.addLogEntry(`${target.name} is struck by a radiant dagger for ${Math.round(dmgResult.damage || dmgResult.amount || 700)} damage!`, 'damage');

        // Bleeding
        const bleed = createBleedingDebuff(caster);
        target.addDebuff(bleed);
        gm.addLogEntry(`${target.name} starts bleeding!`, 'debuff');

        // Stun
        const stun = createStunDebuff();
        target.addDebuff(stun);
        gm.addLogEntry(`${target.name} is stunned for 2 turns!`, 'debuff');

        // UI update
        if (typeof updateCharacterUI === 'function') updateCharacterUI(target);
    };

    // Hit first target
    applyToTarget(initialTarget);

    // Determine bounce
    const potential = gm.getOpponents(caster).filter(ch => ch !== initialTarget && !ch.isDead());
    let secondTarget = null;
    if (potential.length > 0 && Math.random() < 0.8) {
        secondTarget = potential[Math.floor(Math.random() * potential.length)];
        applyToTarget(secondTarget);
    }

    // Visuals
    showDaggerThrowVFX(caster, initialTarget, secondTarget);

    // Update caster UI (sunlight may change later via bleeds but refresh now)
    if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);

    return { success: true };
};

// Ability instance
const daggerThrowAbility = new Ability(
    DAGGER_ABILITY_ID,
    'Dagger Throw',
    'Icons/abilities/dagger_throw.png',
    0,
    8,
    daggerThrowEffect
).setDescription('Throws a dagger dealing 700 damage to an enemy and applies Bleeding & Stun. 80% chance to bounce to another enemy.')
 .setTargetType('enemy');

// Registration helper so Character class can load abilities dynamically
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities.atlantean_kotal_kahn = function () {
    return { q: sunburstAbility, w: bulwarkAbility, e: bloodSacrificeAbility, r: daggerThrowAbility };
};

// Direct AbilityFactory registration if available
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([sunburstAbility, bulwarkAbility, bloodSacrificeAbility, daggerThrowAbility]);
}

// Export to global for debugging
window.kotalKahnAbilities = { q: sunburstAbility, w: bulwarkAbility, e: bloodSacrificeAbility, r: daggerThrowAbility };

console.log('[KOTAL KAHN] Sunburst, Solar Bulwark, Blood Sacrifice, and Dagger Throw abilities loaded and registered'); 