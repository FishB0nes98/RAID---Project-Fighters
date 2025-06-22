// ================= Atlantean Zasalamel Abilities =================
// Author: AI generated

console.log('[ZASALAMEL] Loading atlantean_zasalamel_abilities.js');

const ZAS_SLASH_ABILITY_ID = 'zasalamel_slash';
const ZAS_TIME_ABILITY_ID  = 'zasalamel_time_manipulation';
const ZAS_EXPLOSION_ABILITY_ID = 'zasalamel_time_explosion';
const ZAS_BOMB_ABILITY_ID = 'zasalamel_dark_time_bomb';

//--------------------------------------------------
// Helper – get battle container and element center
//--------------------------------------------------
function getBattleContainer() {
    return document.querySelector('.battle-container');
}
function getCenterPoint(el, container) {
    const cRect = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
        x: r.left + r.width / 2 - cRect.left,
        y: r.top + r.height / 2 - cRect.top
    };
}

//--------------------------------------------------
// Time Manipulation VFX – swirling clock + particles
//--------------------------------------------------
function showTimeManipulationVFX(caster, targets = []) {
    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterEl) return;

    // Central swirl on caster
    const swirl = document.createElement('div');
    swirl.className = 'time-manipulation-vfx';
    casterEl.appendChild(swirl);
    setTimeout(() => swirl.remove(), 1500);

    // Clock overlay on each target affected
    targets.forEach(t => {
        const tEl = document.getElementById(`character-${t.instanceId || t.id}`);
        if (!tEl) return;
        const overlay = document.createElement('div');
        overlay.className = 'time-freeze-overlay';
        tEl.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1500);
    });
}

//--------------------------------------------------
// Scythe Slash VFX – fast arc travelling to each enemy
//--------------------------------------------------
function showScytheSlashVFX(caster, targets = []) {
    const bc = getBattleContainer();
    if (!bc) return;

    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterEl) return;

    const casterCenter = getCenterPoint(casterEl, bc);

    targets.forEach((target, idx) => {
        const tEl = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!tEl) return;
        const targetCenter = getCenterPoint(tEl, bc);

        const arc = document.createElement('div');
        arc.className = 'scythe-slash-arc';
        bc.appendChild(arc);

        // Set CSS variables for animation path
        arc.style.setProperty('--x0', `${casterCenter.x}px`);
        arc.style.setProperty('--y0', `${casterCenter.y}px`);
        arc.style.setProperty('--x1', `${targetCenter.x}px`);
        arc.style.setProperty('--y1', `${targetCenter.y}px`);
        // Slight stagger for multiple targets
        arc.style.animationDelay = `${idx * 70}ms`;

        // Remove after animation
        setTimeout(() => arc.remove(), 600 + idx * 70);
    });

    // Optional screen shake
    bc.classList.add('shake-animation');
    setTimeout(() => bc.classList.remove('shake-animation'), 350);
}

//--------------------------------------------------
// Time Explosion VFX – shockwave burst
//--------------------------------------------------
function showTimeExplosionVFX(caster) {
    const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterEl) return;
    const burst = document.createElement('div');
    burst.className = 'time-explosion-vfx';
    casterEl.appendChild(burst);
    setTimeout(() => burst.remove(), 1200);
}

//--------------------------------------------------
// Dark Time Bomb VFX – ticking aura + explosion
//--------------------------------------------------
function attachTimeBombOverlay(target) {
    const tEl = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!tEl) return null;
    const overlay = document.createElement('div');
    overlay.className = 'time-bomb-overlay';
    tEl.appendChild(overlay);
    return overlay;
}
function detachTimeBombOverlay(overlay) { if (overlay && overlay.parentNode) overlay.remove(); }

function showTimeBombExplosionVFX(target) {
    const tEl = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!tEl) return;
    const explosion = document.createElement('div');
    explosion.className = 'time-bomb-explosion';
    tEl.appendChild(explosion);
    setTimeout(() => explosion.remove(), 1000);
}

//--------------------------------------------------
// Ability Effects
//--------------------------------------------------
const timeManipulationEffect = (caster) => {
    const gm = window.gameManager;
    if (!gm) return false;

    const enemies = gm.getOpponents(caster);
    enemies.forEach(enemy => {
        if (enemy.isDead()) return;
        const abilitiesPool = enemy.abilities.filter(ab => ab); // all abilities
        if (abilitiesPool.length === 0) return;
        const randomAbility = abilitiesPool[Math.floor(Math.random() * abilitiesPool.length)];
        const oldCd = randomAbility.currentCooldown || 0;
        randomAbility.currentCooldown = 5;
        gm.addLogEntry(`${caster.name}'s Time Manipulation sets ${enemy.name}'s ${randomAbility.name} cooldown to 5 turns! (${oldCd} → 5)`, 'debuff');
    });

    // Visuals
    showTimeManipulationVFX(caster, enemies);

    // UI refresh
    enemies.forEach(ch => { if (typeof updateCharacterUI === 'function') updateCharacterUI(ch); });
    if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);

    return { success: true };
};

const slashEffect = (caster) => {
    const gm = window.gameManager;
    if (!gm) return false;

    const enemies = gm.getOpponents(caster);
    const fixed = 300;
    const percent = 1.5;

    enemies.forEach(enemy => {
        if (enemy.isDead()) return;
        const dmg = fixed + caster.stats.physicalDamage * percent;
        const res = enemy.applyDamage(dmg, 'physical', caster, { abilityId: ZAS_SLASH_ABILITY_ID });
        gm.addLogEntry(`${enemy.name} takes ${Math.round(res.damage || dmg)} damage from ${caster.name}'s Slash!`, 'damage');
    });

    // Visuals
    showScytheSlashVFX(caster, enemies);

    enemies.forEach(ch => { if (typeof updateCharacterUI === 'function') updateCharacterUI(ch); });
    if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);

    return { success: true };
};

//--------------------------------------------------
// Time Explosion Effect
//--------------------------------------------------
const timeExplosionEffect = (caster) => {
    const gm = window.gameManager;
    if (!gm) return false;

    const enemies = gm.getOpponents(caster);
    enemies.forEach(enemy => {
        if (enemy.isDead()) return;
        const activeCooldowns = enemy.abilities.filter(ab => ab.currentCooldown && ab.currentCooldown > 0).length;
        const dmg = 490 + 100 * activeCooldowns;
        const res = enemy.applyDamage(dmg, 'magical', caster, { abilityId: ZAS_EXPLOSION_ABILITY_ID });
        gm.addLogEntry(`${enemy.name} suffers ${Math.round(res.damage || dmg)} damage from Time Explosion! (CDs: ${activeCooldowns})`, 'damage');
    });

    showTimeExplosionVFX(caster);
    enemies.forEach(ch => { if (typeof updateCharacterUI === 'function') updateCharacterUI(ch); });
    if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);

    return { success: true };
};

//--------------------------------------------------
// Dark Time Bomb Effect (Debuff creator)
//--------------------------------------------------
const darkTimeBombEffect = (caster, target) => {
    const gm = window.gameManager;
    if (!gm || !target) return false;

    // Debuff definition
    const bombDebuff = new Effect(
        'zas_time_bomb',
        'Dark Time Bomb',
        'Icons/abilities/dark_time_bomb.png',
        3, // duration in turns
        null,
        true
    );

    let overlayRef = null;

    bombDebuff.onApply = function(victim) {
        overlayRef = attachTimeBombOverlay(victim);
        gm.addLogEntry(`${victim.name} is afflicted with Dark Time Bomb!`, 'debuff');
    };

    bombDebuff.onTurnStart = function(victim) {
        // Tick animation emphasised via CSS keyframes
    };

    bombDebuff.onRemove = function(victim) {
        // Explosion damage when duration expires (provided target still alive)
        detachTimeBombOverlay(overlayRef);
        if (victim.isDead()) return;
        const dmg = 1985 + 0.5 * caster.stats.magicalDamage;
        const res = victim.applyDamage(dmg, 'magical', caster, { abilityId: ZAS_BOMB_ABILITY_ID });
        gm.addLogEntry(`${victim.name} suffers ${Math.round(res.damage || dmg)} damage from Dark Time Bomb explosion!`, 'damage');
        showTimeBombExplosionVFX(victim);
        if (typeof updateCharacterUI === 'function') updateCharacterUI(victim);
    };

    bombDebuff.setDescription('After 3 turns, explodes for 1985 + 50% Magical Damage.');

    target.addDebuff(bombDebuff);
    if (typeof updateCharacterUI === 'function') updateCharacterUI(target);

    return { success: true };
};

//--------------------------------------------------
// Ability Instances
//--------------------------------------------------
const zasalamelSlashAbility = new Ability(
    ZAS_SLASH_ABILITY_ID,
    'Slash',
    'Icons/abilities/slash.png',
    40,
    1,
    slashEffect
).setDescription('Deals 300 + 150% Physical Damage to ALL enemies.')
 .setTargetType('all_enemies');

const zasalamelTimeAbility = new Ability(
    ZAS_TIME_ABILITY_ID,
    'Time Manipulation',
    'Icons/abilities/time_manipulation.png',
    100,
    5,
    timeManipulationEffect
).setDescription('Sets a random ability of each enemy to a 5-turn cooldown.')
 .setTargetType('self');

const zasalamelExplosionAbility = new Ability(
    ZAS_EXPLOSION_ABILITY_ID,
    'Time Explosion',
    'Icons/abilities/time_explosion.png',
    100,
    3,
    timeExplosionEffect
).setDescription('Deals 490 + 100 × number of active cooldowns on each enemy to ALL enemies.')
 .setTargetType('all_enemies');

const zasalamelBombAbility = new Ability(
    ZAS_BOMB_ABILITY_ID,
    'Dark Time Bomb',
    'Icons/abilities/dark_time_bomb.png',
    80,
    6,
    darkTimeBombEffect
).setDescription('Places a Dark Time Bomb on an enemy. After 3 turns it explodes for 1985 + 50% Magical Damage.')
 .setTargetType('enemy');

//--------------------------------------------------
// Registration
//--------------------------------------------------
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities.atlantean_zasalamel = function () {
    return { q: zasalamelSlashAbility, w: zasalamelTimeAbility, e: zasalamelExplosionAbility, r: zasalamelBombAbility };
};

if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([zasalamelSlashAbility, zasalamelTimeAbility, zasalamelExplosionAbility, zasalamelBombAbility]);
}

// Export for debugging
window.zasalamelAbilities = {
    q: zasalamelSlashAbility,
    w: zasalamelTimeAbility,
    e: zasalamelExplosionAbility,
    r: zasalamelBombAbility
};

console.log('[ZASALAMEL] Abilities registered.'); 