/* Gargolyan Abilities - Armor Shredding
   This file defines Gargolyan's signature ability and registers it with the AbilityFactory.
   The user prefers particle-based VFX; therefore the implementation includes lightweight CSS-particle effects.
*/

// Ensure the required globals exist
window.AbilityFactory = window.AbilityFactory || {};

(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined') {
        console.error('[Gargolyan Abilities] Required classes are not loaded yet.');
        return;
    }

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    /**
     * Particle-based VFX helper – creates metal shard particles that radiate from the target.
     * @param {Character} target
     */
    function showArmorShreddingVFX(target) {
        const targetElementId = target.instanceId || target.id;
        const targetEl = document.getElementById(`character-${targetElementId}`);
        if (!targetEl) return;

        const PARTICLE_COUNT = 26;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particle = document.createElement('div');
            particle.className = 'armor-shredding-particle';

            // Random trajectory variables via CSS custom properties
            const angle = Math.random() * 360;
            const distance = 60 + Math.random() * 60; // 60-120px radius
            const rad = angle * (Math.PI / 180);
            const dx = Math.cos(rad) * distance;
            const dy = Math.sin(rad) * distance;
            particle.style.setProperty('--dx', `${dx.toFixed(1)}px`);
            particle.style.setProperty('--dy', `${dy.toFixed(1)}px`);
            particle.style.setProperty('--spin', `${Math.floor(Math.random()*360)}deg`);

            targetEl.appendChild(particle);

            particle.addEventListener('animationend', () => particle.remove());
        }

        // Optional subtle screen shake for impact feedback
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.addScreenShake();
        }
    }

    /**
     * Armor Shredding – deals 340 (+100% of dodge chance) physical damage to ALL enemies.
     */
    const armorShreddingEffect = (caster, targets) => {
        if (!Array.isArray(targets) || targets.length === 0) {
            // Fallback: determine opponents via GameManager
            if (window.gameManager) {
                targets = window.gameManager.getOpponents(caster) || [];
            }
        }

        if (!targets || targets.length === 0) {
            log(`${caster.name} tried to use Armor Shredding but there are no valid targets.`);
            return;
        }

        const baseDamage = 612;
        const dodgeScaling = caster.stats.dodgeChance || 0; // 0-1 range
        const totalDamage = Math.floor(baseDamage * (1 + dodgeScaling));

        log(`${caster.name} unleashes Armor Shredding, dealing ${totalDamage} damage to all enemies!`);

        // Sound effect (placeholder path – ensure file exists or skip gracefully)
        playSound && playSound('sounds/armor_shredding.mp3', 0.8);

        targets.forEach(target => {
            if (!target || target.isDead()) return;
            const damageResult = target.applyDamage(totalDamage, 'physical', caster, { abilityId: 'gargolyan_armor_shredding' });

            // Show particle VFX per target
            showArmorShreddingVFX(target);

            // Log individual hit (include crit/miss info if needed)
            if (damageResult.isDodged) {
                log(`${target.name} dodged the shards!`);
            } else {
                const msg = `${target.name} takes ${damageResult.damage} physical damage from Armor Shredding${damageResult.isCritical ? ' (Critical Hit!)' : ''}.`;
                log(msg);
            }
        });

        // UI refresh if available
        if (window.gameManager && window.gameManager.uiManager) {
            targets.forEach(t => window.gameManager.uiManager.updateCharacterUI(t));
        }
    };

    // Create Ability object
    const armorShreddingAbility = new Ability(
        'gargolyan_armor_shredding',
        'Armor Shredding',
        'Icons/abilities/armor_shredding.png',
        60,  // Mana cost
        2,   // Cooldown
        armorShreddingEffect
    ).setDescription('Deals 612 + (100% of Gargolyan\'s Dodge Chance scaling) Physical Damage to all enemies.')
     .setTargetType('all_enemies');

    // Register with AbilityFactory
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([armorShreddingAbility]);
        console.log('[Gargolyan Abilities] Registered Armor Shredding ability.');
    } else {
        console.warn('[Gargolyan Abilities] AbilityFactory not available – storing ability globally for later registration.');
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.gargolyan_armor_shredding = armorShreddingAbility;
    }
})();

/* ===== Gargolyan Taunt Ability ===== */
(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined' || typeof Effect === 'undefined') {
        return; // Core classes not loaded yet
    }

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    // Hook Character.applyDamage once to handle taunt redirection
    if (!Character.prototype._gargolyanTauntHooked) {
        const originalApplyDamage = Character.prototype.applyDamage;
        Character.prototype.applyDamage = function(amount, type, caster = null, options = {}) {
            const tauntHolder = window.gargolyanTauntCharacter;
            // Check if taunt active and conditions for redirection
            if (tauntHolder && !tauntHolder.isDead() && this !== tauntHolder && !options.isGargolyanTauntRedirection) {
                // Determine ally status using existing isEnemy helper
                if (!this.isEnemy(tauntHolder)) {
                    // Redirect damage to Gargolyan
                    log(`${tauntHolder.name} taunts the attack away from ${this.name}!`);
                    return originalApplyDamage.call(
                        tauntHolder,
                        amount,
                        type,
                        caster,
                        { ...options, isGargolyanTauntRedirection: true, abilityId: 'gargolyan_taunt' }
                    );
                }
            }
            return originalApplyDamage.call(this, amount, type, caster, options);
        };
        Character.prototype._gargolyanTauntHooked = true;
    }

    // Helper VFX for Taunt (simple pulsing aura)
    function showTauntVFX(character) {
        const charEl = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charEl) return;
        const aura = document.createElement('div');
        aura.className = 'gargolyan-taunt-aura';
        charEl.appendChild(aura);
        // Remove after animation (~2s) when buff expires handled separately too
        setTimeout(() => aura.remove(), 2200);
    }

    // Taunt ability effect – applies buff to self for 2 turns
    const gargolyanTauntEffect = (caster) => {
        const duration = 3;
        const buff = new Effect(
            'gargolyan_taunt_buff',
            'Taunt',
            'Icons/effects/taunt.png',
            duration,
            null,
            false
        ).setDescription(`Redirects all damage from allies to Gargolyan for ${duration} turns.`);

        buff.onApply = (character) => {
            window.gargolyanTauntCharacter = character;
            log(`${character.name} issues an intimidating Taunt! All damage will be redirected for ${duration} turns.`);
            showTauntVFX(character);
        };
        buff.onRemove = (character) => {
            if (window.gargolyanTauntCharacter === character) {
                window.gargolyanTauntCharacter = null;
                log(`${character.name}'s Taunt has ended.`);
            }
        };

        caster.addBuff(buff);
    };

    const tauntAbility = new Ability(
        'gargolyan_taunt',
        'Taunt',
        'Icons/abilities/gargolyan_taunt.png',
        45,
        4,
        gargolyanTauntEffect
    ).setDescription('For 3 turns, all damage intended for allies is redirected to Gargolyan. His dodge chance still applies.')
     .setTargetType('self');

    AbilityFactory.registerAbilities([tauntAbility]);
})();

/* ===== Gargolyan Magma Pulse Ability ===== */
(function () {
    if (typeof Ability === 'undefined' || typeof AbilityFactory === 'undefined') return;

    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // VFX helper: magma projectile and impact
    function launchMagmaProjectile(source, target, index) {
        const sourceEl = document.getElementById(`character-${source.instanceId || source.id}`);
        const targetEl = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!sourceEl || !targetEl) return;

        const projectile = document.createElement('div');
        projectile.className = 'gargolyan-magma-projectile';
        document.body.appendChild(projectile);

        // Start & end positions
        const sRect = sourceEl.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        const startX = sRect.left + sRect.width / 2;
        const startY = sRect.top + sRect.height / 2;
        const endX = tRect.left + tRect.width / 2;
        const endY = tRect.top + tRect.height / 2;

        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        projectile.style.transform = `rotate(${angle}deg)`;
        projectile.style.width = `${distance}px`;

        // Remove after animation
        setTimeout(() => projectile.remove(), 600);

        // Impact effect
        setTimeout(() => {
            const impact = document.createElement('div');
            impact.className = 'gargolyan-magma-impact';
            targetEl.appendChild(impact);

            // Generate sparks for richer VFX
            const SPARKS = 10;
            for (let s = 0; s < SPARKS; s++) {
                const spark = document.createElement('div');
                spark.className = 'gargolyan-magma-spark';

                // Random direction
                const angleSpark = Math.random() * 360;
                const distSpark = 30 + Math.random() * 40; // 30-70px
                const radSpark = angleSpark * (Math.PI / 180);
                const dxS = Math.cos(radSpark) * distSpark;
                const dyS = Math.sin(radSpark) * distSpark;
                spark.style.setProperty('--dx', `${dxS.toFixed(1)}px`);
                spark.style.setProperty('--dy', `${dyS.toFixed(1)}px`);

                impact.appendChild(spark);
            }

            setTimeout(() => impact.remove(), 900);
        }, 500);
    }

    const magmaPulseEffect = (caster) => {
        if (!window.gameManager) return;
        const opponents = window.gameManager.getOpponents(caster) || [];
        if (opponents.length === 0) {
            log(`${caster.name} tried to use Magma Pulse, but there are no enemies.`);
            return;
        }

        const shots = 5;
        const baseDamage = 155;
        const magicMultiplier = 2.15;
        const shotDelay = 300; // ms between shots

        log(`${caster.name} unleashes Magma Pulse!`);
        playSound && playSound('sounds/magma_pulse_cast.mp3', 0.8);

        for (let i = 0; i < shots; i++) {
            setTimeout(() => {
                const target = opponents[Math.floor(Math.random() * opponents.length)];
                if (!target || target.isDead()) return;

                // Damage calculation
                const damageAmount = baseDamage + Math.floor((caster.stats.magicalDamage || 0) * magicMultiplier);
                const result = target.applyDamage(damageAmount, 'magical', caster, { abilityId: 'gargolyan_magma_pulse' });

                // VFX
                launchMagmaProjectile(caster, target, i);

                if (result.isDodged) {
                    log(`${target.name} dodged a magma burst!`);
                } else {
                    log(`${target.name} is hit for ${result.damage} magical damage${result.isCritical ? ' (Critical)' : ''}.`);
                }

                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(target);
                }
            }, i * shotDelay);
        }
    };

    const magmaPulseAbility = new Ability(
        'gargolyan_magma_pulse',
        'Magma Pulse',
        'Icons/abilities/gargolyan_magma_pulse.png',
        80,
        5,
        magmaPulseEffect
    ).setDescription('Shoots 5 magma bursts at random enemies, each dealing 155 + (215% Magical Damage) as magical damage.')
     .setTargetType('all_enemies');

    AbilityFactory.registerAbilities([magmaPulseAbility]);
})(); 