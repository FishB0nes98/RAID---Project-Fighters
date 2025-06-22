// ================= Atlantean Shinnok Abilities =================
console.log('[SHINNOK] Loading atlantean_shinnok_abilities.js');

const SHIN_BARRIER_ABILITY_ID = 'shinnok_skeletal_barrier';
const SHIN_SPHERES_ABILITY_ID = 'shinnok_magical_spheres';

//-----------------------------------------------
// VFX helper for Skeletal Barrier
//-----------------------------------------------
function showSkeletalBarrierVFX(target) {
    const targetEl = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetEl) return;

    const aura = document.createElement('div');
    aura.className = 'skeletal-barrier-aura';
    targetEl.appendChild(aura);
    setTimeout(() => aura.remove(), 2500);
}

//-----------------------------------------------
// VFX for Magical Spheres
//-----------------------------------------------
function spawnMagicalSphereProjectile(casterEl, targetEl, delay = 0) {
  const bc = document.querySelector('.battle-container');
  if (!bc || !casterEl || !targetEl) return;
  const sphere = document.createElement('div');
  sphere.className = 'magical-sphere-projectile';
  bc.appendChild(sphere);

  const bcRect = bc.getBoundingClientRect();
  const cRect = casterEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  const startX = cRect.left + cRect.width/2 - bcRect.left;
  const startY = cRect.top + cRect.height/2 - bcRect.top;
  const endX = tRect.left + tRect.width/2 - bcRect.left;
  const endY = tRect.top + tRect.height/2 - bcRect.top;

  sphere.style.left = `${startX}px`;
  sphere.style.top = `${startY}px`;

  sphere.animate([
    { transform: 'translate(-50%, -50%) scale(0.6)', offset: 0 },
    { transform: `translate(${endX-startX}px, ${endY-startY}px) scale(1.1)`, offset: 1 }
  ],{ duration: 500, easing: 'ease-out', delay });

  setTimeout(() => sphere.remove(), 500 + delay);
}

//-----------------------------------------------
// Ability Effect
//-----------------------------------------------
const skeletalBarrierEffect = (caster, target) => {
    const gm = window.gameManager;
    if (!gm || !target) return false;

    // Apply shield immediately
    target.addShield(1800);
    gm.addLogEntry(`${target.name} gains a 1800 HP Skeletal Barrier for 3 turns!`, 'buff');

    // Buff to track duration & remove leftover shield
    const barrierBuff = new Effect(
        'skeletal_barrier_buff',
        'Skeletal Barrier',
        'Icons/abilities/skeletal_barrier.png',
        3,
        null,
        false
    );

    barrierBuff.onApply = function(victim) {
        showSkeletalBarrierVFX(victim);
    };

    const removeShieldLeft = function(victim) {
        const shieldLeft = Math.min(victim.shield || 0, 1800);
        if (shieldLeft > 0) {
            victim.removeShield(shieldLeft);
            gm.addLogEntry(`${victim.name}'s Skeletal Barrier fades, removing ${shieldLeft} shield.`, 'debuff');
            if (typeof updateCharacterUI === 'function') updateCharacterUI(victim);
        }
    };

    barrierBuff.onRemove = removeShieldLeft;
    barrierBuff.remove = removeShieldLeft;

    target.addBuff(barrierBuff);
    if (typeof updateCharacterUI === 'function') updateCharacterUI(target);

    return { success: true };
};

//-----------------------------------------------
// Magical Spheres effect
//-----------------------------------------------
const magicalSpheresEffect = (caster) => {
  const gm = window.gameManager;
  if (!gm) return false;
  const enemiesAlive = gm.getOpponents(caster).filter(ch=>!ch.isDead());
  if (enemiesAlive.length === 0) return false;
  const casterEl = document.getElementById(`character-${caster.instanceId || caster.id}`);

  for (let i=0; i<5; i++) {
    const target = enemiesAlive[Math.floor(Math.random()*enemiesAlive.length)];
    if (!target) continue;
    const dmg = caster.stats.magicalDamage * 2.0;
    const res = target.applyDamage(dmg, 'magical', caster, { abilityId: SHIN_SPHERES_ABILITY_ID });
    gm.addLogEntry(`${target.name} is hit by a Magical Sphere for ${Math.round(res.damage||dmg)} damage!`, 'damage');

    // VFX
    const targetEl = document.getElementById(`character-${target.instanceId || target.id}`);
    spawnMagicalSphereProjectile(casterEl, targetEl, i*100);
  }

  enemiesAlive.forEach(t=>{ if(typeof updateCharacterUI==='function') updateCharacterUI(t); });
  return { success: true };
};

//-----------------------------------------------
// Ability instance
//-----------------------------------------------
const shinnokBarrierAbility = new Ability(
    SHIN_BARRIER_ABILITY_ID,
    'Skeletal Barrier',
    'Icons/abilities/skeletal_barrier.png',
    75,
    9,
    skeletalBarrierEffect
).setDescription('Grants an ally (or self) a 1800 HP shield for 3 turns.')
 .setTargetType('ally');

const shinnokSpheresAbility = new Ability(
  SHIN_SPHERES_ABILITY_ID,
  'Magical Spheres',
  'Icons/abilities/magical_spheres.png',
  70,
  2,
  magicalSpheresEffect
).setDescription('Launches 5 spheres, each dealing 200% Magical Damage to random enemies.')
 .setTargetType('enemy');

//-----------------------------------------------
// Registration
//-----------------------------------------------
window.registerCharacterAbilities = window.registerCharacterAbilities || {};
window.registerCharacterAbilities.atlantean_shinnok = function() {
    return { w: shinnokBarrierAbility, e: shinnokSpheresAbility };
};

if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([shinnokBarrierAbility, shinnokSpheresAbility]);
}

window.shinnokAbilities = { w: shinnokBarrierAbility, e: shinnokSpheresAbility }; 