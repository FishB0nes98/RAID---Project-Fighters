// Apple Abilities Implementation
// This file contains all ability implementations for apple characters

// --- Angry Apple: Vine Whip ---
const vineWhipEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to use Vine Whip, but the target is invalid or defeated.`);
        return;
    }
    
    log(`${caster.name} lashes ${target.name} with Vine Whip!`);
    
    // --- VFX ---
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const whipVfx = document.createElement('div');
        whipVfx.className = 'vine-whip-vfx';
        targetElement.appendChild(whipVfx);
        
        setTimeout(() => whipVfx.remove(), 800);
    }
    
    // --- Damage Calculation ---
    const baseDamage = 300;
    const physicalDamageMultiplier = 1.25;
    const physicalDamage = baseDamage + Math.floor((caster.stats.physicalDamage || 0) * physicalDamageMultiplier);
    
    // --- Apply Damage ---
    const damageResult = target.applyDamage(physicalDamage, 'physical', caster);
    log(`${target.name} takes ${damageResult.damage} physical damage.`);
    
    // --- Disable Ability ---
    if (!target.abilities || target.abilities.length === 0) {
        log(`${target.name} has no abilities to disable.`);
        return;
    }
    
    // Select a random ability to disable (excluding already disabled ones)
    const availableAbilities = target.abilities.filter(ability => 
        ability && !ability.isDisabled
    );
    
    if (availableAbilities.length === 0) {
        log(`${target.name} has no abilities available to disable.`);
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableAbilities.length);
    const abilityToDisable = availableAbilities[randomIndex];
    
    log(`${target.name}'s ${abilityToDisable.name} is disabled!`);
    
    // Create the disable debuff
    const disableDebuff = new Effect(
        'vine_whip_disable',
        'Ability Disabled (Vine Whip)',
        'Icons/abilities/ability_disabled.jfif',
        2, // Duration: 2 turns
        null,
        true // isDebuff = true
    ).setDescription(`Disables one random ability for 2 turns.`);
    
    // Store which ability was disabled for cleanup
    disableDebuff.disabledAbilityId = abilityToDisable.id;
    
    // Apply the disable effect
    abilityToDisable.isDisabled = true;
    abilityToDisable.disabledDuration = 2;
    
    // Define the remove function for the debuff
    disableDebuff.remove = (character) => {
        const originallyDisabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
        if (originallyDisabledAbility) {
            if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                originallyDisabledAbility.isDisabled = false;
                log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Vine Whip.`);
                // Update UI
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            }
        } else {
            log(`Could not find ability ${disableDebuff.disabledAbilityId} on ${character.name} to re-enable.`);
        }
    };
    
    // Apply the debuff to the target
    target.addDebuff(disableDebuff);
    
    // Play sound
    playSound('sounds/vine_whip.mp3', 0.7);
    
    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
};

// --- Healthy Apple: Knock ---
const knockEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to Knock, but the target is invalid or defeated.`);
        return;
    }
    
    log(`${caster.name} Knocks ${target.name}!`);
    
    // --- VFX ---
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const knockVfx = document.createElement('div');
        knockVfx.className = 'knock-vfx';
        targetElement.appendChild(knockVfx);
        
        // Add shake animation to target
        targetElement.classList.add('shake-animation');
        
        setTimeout(() => {
            knockVfx.remove();
            targetElement.classList.remove('shake-animation');
        }, 800);
    }
    
    // --- Damage Calculation ---
    const baseDamage = 100;
    const physicalDamageMultiplier = 1.0;
    const physicalDamage = baseDamage + Math.floor((caster.stats.physicalDamage || 0) * physicalDamageMultiplier);
    
    // --- Apply Damage ---
    const damageResult = target.applyDamage(physicalDamage, 'physical', caster);
    log(`${target.name} takes ${damageResult.damage} physical damage.`);
    
    // Play sound
    playSound('sounds/knock.mp3', 0.7);
    
    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
};

// --- Monster Apple: Scythe Slash ---
const scytheSlashEffect = (caster, targets) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!Array.isArray(targets) || targets.length === 0) {
        log(`${caster.name} swings Scythe Slash, but there are no targets!`);
        return;
    }
    
    log(`${caster.name} performs a devastating Scythe Slash!`);
    
    // --- VFX on caster ---
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        const slashEffectCaster = document.createElement('div');
        slashEffectCaster.className = 'scythe-slash-cast-vfx';
        casterElement.appendChild(slashEffectCaster);
        
        setTimeout(() => slashEffectCaster.remove(), 1000);
    }
    
    // --- Damage Calculation ---
    const physicalDamageMultiplier = 1.50;
    const physicalDamage = Math.floor((caster.stats.physicalDamage || 0) * physicalDamageMultiplier);
    
    // --- Apply Damage to All Targets ---
    targets.forEach(target => {
        if (target && !target.isDead()) {
            // Add VFX to each target
            const targetElementId = target.instanceId || target.id;
            const targetElement = document.getElementById(`character-${targetElementId}`);
            if (targetElement) {
                const slashEffect = document.createElement('div');
                slashEffect.className = 'scythe-slash-impact-vfx';
                targetElement.appendChild(slashEffect);
                
                setTimeout(() => slashEffect.remove(), 800);
            }
            
            // Apply damage
            const damageResult = target.applyDamage(physicalDamage, 'physical', caster);
            log(`${target.name} takes ${damageResult.damage} physical damage.`);
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(target);
            }
        }
    });
    
    // Play sound
    playSound('sounds/scythe_slash.mp3', 0.8);
};

// --- Leafy Apple: Heal Up ---
const healUpEffect = (caster, targets) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!Array.isArray(targets) || targets.length === 0) {
        log(`${caster.name} uses Heal Up, but there are no allies to heal!`);
        return;
    }
    
    log(`${caster.name} casts Heal Up on all allies!`);
    
    // --- VFX on caster ---
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        const healEffectCaster = document.createElement('div');
        healEffectCaster.className = 'heal-up-cast-vfx';
        casterElement.appendChild(healEffectCaster);
        
        setTimeout(() => healEffectCaster.remove(), 1000);
    }
    
    // --- Heal Amount ---
    const healAmount = 310;
    
    // --- Apply Healing to All Targets ---
    targets.forEach(target => {
        if (target && !target.isDead()) {
            // Add VFX to each target
            const targetElementId = target.instanceId || target.id;
            const targetElement = document.getElementById(`character-${targetElementId}`);
            if (targetElement) {
                const healEffect = document.createElement('div');
                healEffect.className = 'heal-up-target-vfx';
                targetElement.appendChild(healEffect);
                
                // Create heal number indicator
                const healNumber = document.createElement('div');
                healNumber.className = 'heal-vfx';
                healNumber.textContent = `+${healAmount}`;
                targetElement.appendChild(healNumber);
                
                setTimeout(() => {
                    healEffect.remove();
                    healNumber.remove();
                }, 1500);
            }
            
            // Apply healing
            const actualHeal = target.heal(healAmount);
            log(`${target.name} is healed for ${actualHeal} HP.`);
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(target);
            }
        }
    });
    
    // Play sound
    playSound('sounds/heal_up.mp3', 0.7);
};

// --- Rotten Apple: Rot Spit ---
const rotSpitEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`${caster.name} tries to use Rot Spit, but the target is invalid or defeated.`);
        return;
    }
    
    log(`${caster.name} sprays Rot Spit at ${target.name}!`);
    
    // --- VFX ---
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const spitVfx = document.createElement('div');
        spitVfx.className = 'rot-spit-vfx';
        targetElement.appendChild(spitVfx);
        
        setTimeout(() => spitVfx.remove(), 800);
    }
    
    // --- Damage Calculation ---
    const baseDamage = 0;
    const magicalDamageMultiplier = 0.65;
    const magicalDamage = baseDamage + Math.floor((caster.stats.magicalDamage || 0) * magicalDamageMultiplier);
    
    // --- Apply Damage ---
    const damageResult = target.applyDamage(magicalDamage, 'magical', caster);
    log(`${target.name} takes ${damageResult.damage} magical damage.`);
    
    // --- Apply Armor Reduction Debuff ---
    const armorReductionPercent = 0.05; // 5%
    const debuffDuration = 3;
    const debuffId = 'rot_spit_armor_reduction';
    const debuffName = 'Rotted Armor';
    const debuffIcon = 'Icons/effects/armor_reduction.png';
    
    // Create the debuff
    const armorReductionDebuff = new Effect(
        debuffId,
        debuffName,
        debuffIcon,
        debuffDuration,
        null,
        true // isDebuff = true
    ).setDescription(`Reduces armor by ${armorReductionPercent * 100}% for ${debuffDuration} turns. Stacks additively.`);
    
    // Set the stat modifier
    armorReductionDebuff.statModifiers = [
        { stat: 'armor_percent', value: -(armorReductionPercent * 100), operation: 'add' } // Use armor_percent and provide the percentage value (e.g., -5)
    ];
    
    // Apply the debuff
    target.addDebuff(armorReductionDebuff);
    log(`${target.name}'s armor is reduced by ${armorReductionPercent * 100}% for ${debuffDuration} turns.`);
    
    // Play sound
    playSound('sounds/rot_spit.mp3', 0.7);
    
    // Update UI
    if (window.gameManager && window.gameManager.uiManager) {
        window.gameManager.uiManager.updateCharacterUI(target);
    }
};

// --- Create Ability Objects ---

// Angry Apple - Vine Whip
const angryAppleVineWhip = new Ability(
    'angry_apple_vine_whip',
    'Vine Whip',
    'Icons/abilities/vine_whip.png',
    40, // Mana cost
    1,  // Cooldown
    vineWhipEffect
).setDescription('Deals 300 + (125% Physical damage) to the target and disables one of their abilities for two turns.')
 .setTargetType('enemy');

// Healthy Apple - Knock
const healthyAppleKnock = new Ability(
    'healthy_apple_knock',
    'Knock',
    'Icons/abilities/knock.png',
    30, // Mana cost
    1,  // Cooldown
    knockEffect
).setDescription('Deals 100 + (100% Physical Damage) as physical damage to the target.')
 .setTargetType('enemy');

// Monster Apple - Scythe Slash
const monsterAppleScytheSlash = new Ability(
    'monster_apple_scythe_slash',
    'Scythe Slash',
    'Icons/abilities/scythe_slash.png',
    60, // Mana cost
    1,  // Cooldown
    scytheSlashEffect
).setDescription('Deals 150% Physical Damage to all enemies.')
 .setTargetType('all_enemies');

// Leafy Apple - Heal Up
const leafyAppleHealUp = new Ability(
    'leafy_apple_heal_up',
    'Heal Up',
    'Icons/abilities/heal_up.png',
    50, // Mana cost
    1,  // Cooldown
    healUpEffect
).setDescription('Heals all allies by 310HP.')
 .setTargetType('all_allies');

// Rotten Apple - Rot Spit
const rottenAppleRotSpit = new Ability(
    'rotten_apple_rot_spit',
    'Rot Spit',
    'Icons/abilities/rot_spit.png',
    35, // Mana cost
    1,  // Cooldown
    rotSpitEffect
).setDescription('Deals 65% Magical damage to the target and reduces their armor by 5% for 3 turns (can stack).')
 .setTargetType('enemy');

// --- Register Abilities with AbilityFactory ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        angryAppleVineWhip,
        healthyAppleKnock,
        monsterAppleScytheSlash,
        leafyAppleHealUp,
        rottenAppleRotSpit
    ]);
    console.log("[AbilityFactory] Registered Apple abilities.");
} else {
    console.warn("Apple abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.angry_apple_vine_whip = angryAppleVineWhip;
    window.definedAbilities.healthy_apple_knock = healthyAppleKnock;
    window.definedAbilities.monster_apple_scythe_slash = monsterAppleScytheSlash;
    window.definedAbilities.leafy_apple_heal_up = leafyAppleHealUp;
    window.definedAbilities.rotten_apple_rot_spit = rottenAppleRotSpit;
} 