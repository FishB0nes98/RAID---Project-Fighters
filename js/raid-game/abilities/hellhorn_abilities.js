/* HellHorn Abilities */
(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined' || typeof Effect === 'undefined') return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Simple impact VFX
    function showTackleImpact(target) {
        const el = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!el) return;
        el.classList.add('hellhorn-tackle-impact');
        setTimeout(() => el.classList.remove('hellhorn-tackle-impact'), 400);
    }

    const tackleEffect = (caster, target) => {
        if (!target || target.isDead()) {
            log(`${caster.name} tried to Tackle, but no valid target.`);
            return;
        }

        const damageAmount = 500 + Math.floor((caster.stats.physicalDamage || 0) * 1.4);
        const result = target.applyDamage(damageAmount, 'physical', caster, { abilityId: 'hellhorn_tackle' });
        showTackleImpact(target);
        playSound && playSound('sounds/tackle_impact.mp3', 0.9);

        if (result.isDodged) {
            log(`${target.name} dodged HellHorn's Tackle!`);
        } else {
            log(`${target.name} takes ${result.damage} physical damage from HellHorn's Tackle.${result.isCritical ? ' (Critical Hit!)' : ''}`);
        }

        // 50% chance to stun
        if (!result.isDodged && Math.random() < 0.5) {
            const stunDebuff = new Effect(
                'stun',
                'Stunned',
                'Icons/debuffs/stun.png',
                1,
                null,
                true
            ).setDescription('Cannot act for 1 turn.');
            stunDebuff.effects = { cantAct: true };
            target.addDebuff(stunDebuff);
            log(`${target.name} is stunned!`);
        }

        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
        }
    };

    const tackleAbility = new Ability(
        'hellhorn_tackle',
        'Tackle',
        'Icons/abilities/hellhorn_tackle.png',
        35,
        1,
        tackleEffect
    ).setDescription('Deals 500 + (140% Physical Damage) damage to the target and has 50% chance to stun it for 1 turn.')
     .setTargetType('enemy');

    AbilityFactory.registerAbilities([tackleAbility]);
})();

/* ===== HellHorn Stomp Ability ===== */
(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined' || typeof Effect === 'undefined') return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Knock-up animation helper
    function knockUpTarget(target) {
        const el = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!el) return;
        el.classList.add('hellhorn-knockup');
        setTimeout(() => el.classList.remove('hellhorn-knockup'), 600);
    }

    // Shockwave on caster
    function showShockwave(caster) {
        const el = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (!el) return;
        const wave = document.createElement('div');
        wave.className = 'hellhorn-stomp-shockwave';
        el.appendChild(wave);
        setTimeout(() => wave.remove(), 800);
    }

    const stompEffect = (caster) => {
        if (!window.gameManager) return;
        const targets = window.gameManager.getOpponents(caster) || [];
        if (targets.length === 0) {
            log(`${caster.name} tried to Stomp, but no enemies.`);
            return;
        }

        const damageAmount = Math.floor((caster.stats.physicalDamage || 0) * 2.5);
        log(`${caster.name} stomps the ground with immense force!`);
        playSound && playSound('sounds/stomp_impact.mp3', 1.0);
        showShockwave(caster);

        targets.forEach(target => {
            if (!target || target.isDead()) return;
            const result = target.applyDamage(damageAmount, 'physical', caster, { abilityId: 'hellhorn_stomp' });
            knockUpTarget(target);

            if (result.isDodged) {
                log(`${target.name} evades the shockwave!`);
            } else {
                log(`${target.name} is hit for ${result.damage} physical damage by Stomp.${result.isCritical ? ' (Critical)' : ''}`);
            }

            if (!result.isDodged && Math.random() < 0.5) {
                const stun = new Effect('stun', 'Stunned', 'Icons/debuffs/stun.png', 1, null, true)
                    .setDescription('Cannot act for 1 turn.');
                stun.effects = { cantAct: true };
                target.addDebuff(stun);
                log(`${target.name} is stunned by the impact!`);
            }

            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(target);
            }
        });
    };

    const stompAbility = new Ability(
        'hellhorn_stomp',
        'Stomp',
        'Icons/abilities/hellhorn_stomp.png',
        100,
        5,
        stompEffect
    ).setDescription('Stomps the ground, dealing 250% Physical Damage to all enemies, knocking them up and with 50% chance to stun each.')
     .setTargetType('all_enemies');

    AbilityFactory.registerAbilities([stompAbility]);
})(); 