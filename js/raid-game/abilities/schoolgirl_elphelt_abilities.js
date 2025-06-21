// Ability definitions for Schoolgirl Elphelt

// === TALENT DESCRIPTION UPDATES ===

// Track if we've already updated descriptions for this character to prevent spam
let descriptionUpdateFlags = new Map();

// Clear old entries periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of descriptionUpdateFlags.entries()) {
        if (now - timestamp > 5000) { // Clear entries older than 5 seconds
            descriptionUpdateFlags.delete(key);
        }
    }
}, 10000); // Run cleanup every 10 seconds

/**
 * Update Elphelt's ability descriptions based on active talents
 */
function updateElpheltAbilityDescriptionsForTalents(character) {
    if (!character) return;
    
    const hasExtendedDisruption = character.appliedTalents && character.appliedTalents.includes('extended_disruption');
    const hasEnhancedDisruption = character.appliedTalents && character.appliedTalents.includes('enhanced_disruption');
    const hasRapidDisruption = character.appliedTalents && character.appliedTalents.includes('rapid_disruption');
    const hasUltimateDisruption = character.appliedTalents && character.appliedTalents.includes('ultimate_disruption');
    const hasStunningPrecision = character.appliedTalents && character.appliedTalents.includes('stunning_precision');
    const hasChainShot = character.appliedTalents && character.appliedTalents.includes('chain_shot');
    const hasHealingShot = character.appliedTalents && character.appliedTalents.includes('healing_shot');
    const hasHeartbreakShot = character.appliedTalents && character.appliedTalents.includes('heartbreak_shot');
    const hasHeartbreakingMark = character.appliedTalents && character.appliedTalents.includes('heartbreaking_mark');
    const hasEmpoweredShot = character.appliedTalents && character.appliedTalents.includes('empowered_shot');
    const hasSwiftAffection = character.appliedTalents && character.appliedTalents.includes('swift_affection');
    const hasDevastatingStorm = character.appliedTalents && character.appliedTalents.includes('devastating_storm');
    const hasStormMastery = character.appliedTalents && character.appliedTalents.includes('storm_mastery');
    const hasStormRebound = character.appliedTalents && character.appliedTalents.includes('storm_rebound');
    const hasSwiftRomance = character.appliedTalents && character.appliedTalents.includes('swift_romance');
    const hasArcaneMastery = character.appliedTalents && character.appliedTalents.includes('arcane_mastery');
    const hasHeartDestroyer = character.appliedTalents && character.appliedTalents.includes('heart_destroyer');
    
    // Update Love Bullet (Q) description
    const loveBulletAbility = character.abilities.find(a => a.id === 'schoolgirl_elphelt_q');
    if (loveBulletAbility) {
        let baseDescription = 'Deals <span class="damage-value">260</span> physical damage to target enemy.';
        let talents = [];
        
        if (hasStunningPrecision) {
            talents.push('<span class="talent-effect utility">5% chance to stun for 1 turn</span>');
        }
        if (hasChainShot) {
            talents.push('<span class="talent-effect damage">30% chance for chain shot</span>');
        }
        if (hasHealingShot) {
            talents.push('<span class="talent-effect healing">Can target allies for healing</span>');
        }
        if (hasHeartbreakShot) {
            talents.push('<span class="talent-effect damage">+395 damage vs Heart Debuffed enemies</span>');
        }
        if (hasEmpoweredShot) {
            talents.push('<span class="talent-effect damage">+205 base damage</span>');
        }
        if (hasHeartbreakingMark) {
            talents.push('<span class="talent-effect debuff">Applies Heart Debuff for 2 turns</span>');
        }
        if (hasArcaneMastery) {
            talents.push('<span class="talent-effect scaling">+50% magical damage scaling</span>');
        }
        if (hasHeartDestroyer) {
            talents.push('<span class="talent-effect damage">+100% Magical Damage vs Heart Debuffed enemies</span>');
        }
        
        if (talents.length > 0) {
            baseDescription += '\n' + talents.join('\n');
        }
        
        loveBulletAbility.setDescription(baseDescription);
    }
    
    // Update Flower Bomb (W) description  
    const flowerBombAbility = character.abilities.find(a => a.id === 'schoolgirl_elphelt_w');
    if (flowerBombAbility) {
        let baseDescription = 'Disables one random enemy ability for <span class="duration-value">2 turns</span>.';
        let talents = [];
        
        if (hasExtendedDisruption) {
            baseDescription = 'Disables one random enemy ability for <span class="duration-value">3 turns</span>.';
        }
        if (hasEnhancedDisruption) {
            talents.push('<span class="talent-effect utility">Affects second random enemy</span>');
        }
        if (hasRapidDisruption && !hasUltimateDisruption) {
            talents.push('<span class="talent-effect utility">Cooldown reduced by 2 turns</span>');
        }
        if (hasUltimateDisruption) {
            baseDescription = 'Disables one random enemy ability for <span class="duration-value">3 turns</span>. <span class="talent-effect utility">Cooldown: 1 turn</span>.';
            talents.push('<span class="talent-effect utility">Can stack up to 4 ability disables on same target</span>');
            talents.push('<span class="talent-effect utility">Ultimate battlefield control mastery</span>');
        }
        
        if (talents.length > 0) {
            baseDescription += '\n' + talents.join('\n');
        }
        
        flowerBombAbility.setDescription(baseDescription);
    }
    
    // Update Affection (E) description
    const affectionAbility = character.abilities.find(a => a.id === 'schoolgirl_elphelt_e');
    if (affectionAbility) {
        let baseDescription = 'Charms target enemy, forcing them to target only Elphelt for <span class="duration-value">3 turns</span>.';
        let talents = [];
        
        if (hasSwiftAffection) {
            talents.push('<span class="talent-effect utility">Does not end turn</span>');
        }
        if (hasSwiftRomance) {
            talents.push('<span class="talent-effect utility">Cooldown reduced by 2 turns</span>');
        }
        
        if (talents.length > 0) {
            baseDescription += '\n' + talents.join('\n');
        }
        
        affectionAbility.setDescription(baseDescription);
    }
    
    // Update Heart Storm (R) description
    const heartStormAbility = character.abilities.find(a => a.id === 'schoolgirl_elphelt_r');
    if (heartStormAbility) {
        let baseDescription = 'Deals <span class="damage-value">350</span> magical damage with <span class="utility-value">35% bounce chance</span>. Self-heals for <span class="healing-value">10%</span> of damage dealt.';
        let talents = [];
        
        if (hasDevastatingStorm) {
            baseDescription = 'Deals <span class="damage-value">350</span> magical damage with <span class="utility-value">35% bounce chance</span>. Self-heals for <span class="healing-value">55%</span> of damage dealt.';
        }
        if (hasStormMastery) {
            talents.push('<span class="talent-effect utility">+22% bounce chance</span>');
        }
        if (hasStormRebound) {
            talents.push('<span class="talent-effect utility">Cooldown reduced to 5 turns</span>');
        }
        if (hasArcaneMastery) {
            talents.push('<span class="talent-effect scaling">+50% magical damage scaling</span>');
        }
        if (hasHeartDestroyer) {
            talents.push('<span class="talent-effect damage">+100% Magical Damage vs Heart Debuffed enemies</span>');
        }
        
        if (talents.length > 0) {
            baseDescription += '\n' + talents.join('\n');
        }
        
        heartStormAbility.setDescription(baseDescription);
    }
    
    console.log('[ElpheltAbilities] Updated all ability descriptions for talents');
}

// === PASSIVE TRIGGERING HELPER ===

/**
 * Helper function to trigger the passive for any Elphelt ability
 */
function triggerElpheltPassive(caster, ability) {
    // No need to dispatch an event - the character system already dispatches AbilityUsed events
    // The passive handler will respond to the automatically dispatched event
    console.log(`[ElpheltAbilities] Passive will be triggered automatically by character system for ${ability.name}`);
}

// === STATISTICS TRACKING FUNCTIONS ===

/**
 * Global tracking function for Schoolgirl Elphelt's abilities
 */
function trackElpheltAbilityUsage(caster, abilityId, effectType, amount, isCritical) {
    if (!window.statisticsManager) return;
    
    try {
        window.statisticsManager.recordAbilityUsage(caster, abilityId, effectType, amount, isCritical);
        console.log(`[ElpheltStats] Tracked ${abilityId}: ${effectType} for ${amount} ${isCritical ? '(Critical)' : ''}`);
    } catch (error) {
        console.error(`[ElpheltStats] Error tracking ${abilityId}:`, error);
    }
}

/**
 * Track Love Bullet statistics
 */
function trackLoveBulletStats(caster, target, damageResult, wasStun = false, wasCharm = false, wasHeartbroken = false, heartbreakDamage = 0, wasMarked = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt
        window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, 'love_bullet');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'love_bullet', 'damage', damageAmount, isCritical);
        
        // Track heartbreak bonus damage if it occurred
        if (wasHeartbroken && heartbreakDamage > 0) {
            window.statisticsManager.recordDamageDealt(caster, target, heartbreakDamage, 'magical', false, 'love_bullet_heartbreak');
            trackElpheltAbilityUsage(caster, 'heartbreak_shot', 'damage', heartbreakDamage, false);
        }
        
        // Track stun application if it occurred (from Stunning Precision talent)
        if (wasStun) {
            window.statisticsManager.recordStatusEffect(caster, target, 'stun', 'stunning_precision_stun', true, 'love_bullet');
            trackElpheltAbilityUsage(caster, 'stunning_precision_stun', 'debuff', 1, false);
        }
        
        // Track charm application if it occurred
        if (wasCharm) {
            window.statisticsManager.recordStatusEffect(caster, target, 'charm', 'love_bullet_charm', true, 'love_bullet');
            trackElpheltAbilityUsage(caster, 'love_bullet_charm', 'debuff', 1, false);
        }
        
        // Track Heart Debuff application if it occurred (from Heartbreaking Mark talent)
        if (wasMarked) {
            window.statisticsManager.recordStatusEffect(caster, target, 'heart_debuff', 'heartbreaking_mark_debuff', true, 'love_bullet');
            trackElpheltAbilityUsage(caster, 'heartbreaking_mark', 'debuff', 1, false);
        }
        
        console.log(`[ElpheltStats] Tracked Love Bullet: ${damageAmount} damage to ${target.name}, stun: ${wasStun}, charm: ${wasCharm}, heartbreak: ${wasHeartbroken} (${heartbreakDamage}), marked: ${wasMarked}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Love Bullet stats:', error);
    }
}

/**
 * Track Flower Bomb statistics
 */
function trackFlowerBombStats(caster, target, abilityDisabled) {
    if (!window.statisticsManager) return;
    
    try {
        // Track debuff application
        window.statisticsManager.recordStatusEffect(caster, target, 'ability_disable', 'flower_bomb_disable', true, 'schoolgirl_elphelt_w');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_w', 'debuff', 1, false);
        
        console.log(`[ElpheltStats] Tracked Flower Bomb: disabled ability on ${target.name}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Flower Bomb stats:', error);
    }
}

/**
 * Track Affection statistics
 */
function trackAffectionStats(caster, target) {
    if (!window.statisticsManager) return;
    
    try {
        // Track buff application to caster (damage reduction)
        window.statisticsManager.recordStatusEffect(caster, caster, 'damage_reduction', 'affection_buff', false, 'schoolgirl_elphelt_e');
        
        // Track debuff application to target (infatuation)
        window.statisticsManager.recordStatusEffect(caster, target, 'infatuation', 'affection_debuff', true, 'schoolgirl_elphelt_e');
        
        // Track ability usage
        trackElpheltAbilityUsage(caster, 'schoolgirl_elphelt_e', 'buff', 1, false);
        
        console.log(`[ElpheltStats] Tracked Affection: applied to ${target.name}`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Affection stats:', error);
    }
}

/**
 * Track Heart Storm statistics
 */
function trackHeartStormStats(caster, targets, damageAmounts, healAmount = 0, stunCount = 0, charmCount = 0) {
    if (!window.statisticsManager) return;
    
    try {
        // Track damage for each target
        targets.forEach((target, index) => {
            const damageAmount = damageAmounts[index] || 0;
            if (damageAmount > 0) {
                const isCritical = false; // Heart Storm doesn't crit typically
                window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'magical', isCritical, 'heart_storm');
            }
        });
        
        // Track healing for self
        if (healAmount > 0) {
            window.statisticsManager.recordHealingDone(caster, caster, healAmount, false, 'heart_storm_heal');
            trackElpheltAbilityUsage(caster, 'heart_storm_heal', 'healing', healAmount, false);
        }
        
        // Track ability usage
        const totalDamage = damageAmounts.reduce((sum, amount) => sum + amount, 0);
        trackElpheltAbilityUsage(caster, 'heart_storm', 'damage', totalDamage, false);
        
        // Track status effects
        if (stunCount > 0) {
            trackElpheltAbilityUsage(caster, 'heart_storm_stun', 'debuff', stunCount, false);
        }
        
        if (charmCount > 0) {
            trackElpheltAbilityUsage(caster, 'heart_storm_charm', 'debuff', charmCount, false);
        }
        
        console.log(`[ElpheltStats] Tracked Heart Storm: ${targets.length} targets, ${totalDamage} total damage, ${healAmount} self heal, ${stunCount} stuns, ${charmCount} charms`);
    } catch (error) {
        console.error('[ElpheltStats] Error tracking Heart Storm stats:', error);
    }
}

/**
 * Track Defensive Maneuvers passive statistics
 */
function trackDefensiveManeuversStats(character, armorGain, shieldGain) {
    if (!window.statisticsManager) {
        console.warn('[ElpheltAbilityStats] Statistics manager not available');
        return;
    }
    
    try {
        // Track buff application
        window.statisticsManager.recordStatusEffect(character, character, 'defensive_buff', 'defensive_maneuvers', false, 'schoolgirl_elphelt_passive');
        
        // Track defensive stats gained (use total defensive value as amount)
        const totalDefensiveValue = armorGain + shieldGain;
        window.statisticsManager.recordAbilityUsage(character, 'schoolgirl_elphelt_passive', 'buff', totalDefensiveValue, false);
        
        console.log(`[ElpheltAbilityStats] Tracked Defensive Maneuvers: +${armorGain} Armor, +${shieldGain} Magical Shield`);
    } catch (error) {
        console.error('[ElpheltAbilityStats] Error tracking Defensive Maneuvers stats:', error);
    }
}

/**
 * Track Defensive Recovery statistics
 */
function trackDefensiveRecoveryStats(character, healAmount, originalDamage) {
    if (!window.statisticsManager) {
        console.warn('[ElpheltAbilityStats] Statistics manager not available');
        return;
    }
    
    try {
        // Track defensive recovery healing
        window.statisticsManager.recordHealingDone(character, healAmount, 'defensive_recovery_healing');
        
        // Track passive trigger with healing amount
        window.statisticsManager.recordAbilityUsage(character, 'defensive_recovery', 'healing', healAmount, false);
        
        console.log(`[ElpheltAbilityStats] Tracked Defensive Recovery: ${healAmount} HP healed from ${originalDamage} damage taken`);
    } catch (error) {
        console.error('[ElpheltAbilityStats] Error tracking Defensive Recovery stats:', error);
    }
}

/**
 * Show enhanced VFX for Extended Disruption talent
 */
function showExtendedDisruptionVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create enhanced disruption container
    const disruptionVfx = document.createElement('div');
    disruptionVfx.className = 'extended-disruption-vfx';
    disruptionVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 105;
    `;
    
    // Create enhanced disruption waves
    const disruptionWaves = document.createElement('div');
    disruptionWaves.className = 'disruption-waves';
    disruptionVfx.appendChild(disruptionWaves);
    
    // Create enhanced disruption core
    const disruptionCore = document.createElement('div');
    disruptionCore.className = 'disruption-core';
    disruptionVfx.appendChild(disruptionCore);
    
    // Create enhanced disruption particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'disruption-particles';
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'disruption-particle';
        particle.style.setProperty('--angle', `${i * 30}deg`);
        particle.style.setProperty('--delay', `${i * 0.1}s`);
        particleContainer.appendChild(particle);
    }
    disruptionVfx.appendChild(particleContainer);
    
    targetElement.appendChild(disruptionVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (disruptionVfx.parentNode) {
            disruptionVfx.remove();
        }
    }, 2500);
    
    console.log(`[ElpheltVFX] Showed Extended Disruption VFX for ${target.name}`);
}

/**
 * Show VFX for Enhanced Disruption talent - spreads from primary to secondary target
 */
function showEnhancedDisruptionVFX(caster, primaryTarget, secondTarget) {
    const primaryElement = document.getElementById(`character-${primaryTarget.instanceId || primaryTarget.id}`);
    const secondElement = document.getElementById(`character-${secondTarget.instanceId || secondTarget.id}`);
    
    if (!primaryElement || !secondElement) return;
    
    // Create spread beam from primary to secondary target
    const beamContainer = document.createElement('div');
    beamContainer.className = 'enhanced-disruption-beam-container';
    beamContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 95;
    `;
    
    // Calculate positions
    const primaryRect = primaryElement.getBoundingClientRect();
    const secondRect = secondElement.getBoundingClientRect();
    
    const primaryX = primaryRect.left + primaryRect.width / 2;
    const primaryY = primaryRect.top + primaryRect.height / 2;
    const secondX = secondRect.left + secondRect.width / 2;
    const secondY = secondRect.top + secondRect.height / 2;
    
    const distance = Math.sqrt(Math.pow(secondX - primaryX, 2) + Math.pow(secondY - primaryY, 2));
    const angle = Math.atan2(secondY - primaryY, secondX - primaryX) * 180 / Math.PI;
    
    // Create beam
    const beam = document.createElement('div');
    beam.className = 'enhanced-disruption-beam';
    beam.style.cssText = `
        position: absolute;
        left: ${primaryX}px;
        top: ${primaryY}px;
        width: ${distance}px;
        height: 4px;
        background: linear-gradient(90deg, rgba(255, 105, 180, 0.8) 0%, rgba(255, 20, 147, 0.9) 50%, rgba(199, 21, 133, 0.8) 100%);
        transform-origin: 0 50%;
        transform: rotate(${angle}deg);
        box-shadow: 0 0 10px rgba(255, 105, 180, 0.6), 0 0 20px rgba(255, 20, 147, 0.4);
        animation: enhancedDisruptionBeam 1s ease-out forwards;
    `;
    
    // Create traveling particles
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'enhanced-disruption-particle';
        particle.style.cssText = `
            position: absolute;
            left: ${primaryX}px;
            top: ${primaryY}px;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, rgba(255, 105, 180, 1) 0%, rgba(255, 20, 147, 0.8) 70%, transparent 100%);
            border-radius: 50%;
            animation: enhancedDisruptionParticle 1s ease-out forwards;
            animation-delay: ${i * 0.1}s;
            --target-x: ${secondX - primaryX}px;
            --target-y: ${secondY - primaryY}px;
        `;
        beamContainer.appendChild(particle);
    }
    
    beamContainer.appendChild(beam);
    document.body.appendChild(beamContainer);
    
    // Secondary target enhancement VFX
    setTimeout(() => {
        const secondaryVfx = document.createElement('div');
        secondaryVfx.className = 'enhanced-disruption-secondary-vfx';
        secondaryVfx.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(255, 105, 180, 0.4) 0%, rgba(255, 20, 147, 0.2) 50%, transparent 70%);
            border-radius: 8px;
            animation: enhancedDisruptionSecondary 2s ease-out forwards;
            z-index: 88;
            pointer-events: none;
        `;
        
        // Secondary target text
        const secondaryText = document.createElement('div');
        secondaryText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff1493;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(255, 20, 147, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: enhancedDisruptionText 2s ease-out forwards;
            z-index: 89;
            pointer-events: none;
        `;
        secondaryText.innerHTML = `Enhanced Disruption!`;
        
        secondElement.appendChild(secondaryVfx);
        secondElement.appendChild(secondaryText);
        
        setTimeout(() => {
            if (secondaryVfx.parentNode) secondaryVfx.remove();
            if (secondaryText.parentNode) secondaryText.remove();
        }, 2000);
    }, 500);
    
    // Remove beam container
    setTimeout(() => {
        if (beamContainer.parentNode) {
            beamContainer.remove();
        }
    }, 1500);
    
    console.log(`[ElpheltVFX] Showed Enhanced Disruption spread VFX from ${primaryTarget.name} to ${secondTarget.name}`);
}

/**
 * Show enhanced healing VFX for Devastating Storm talent
 */
function showDevastatingStormHealVFX(caster, healAmount) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create devastating storm heal container
    const stormHealVfx = document.createElement('div');
    stormHealVfx.className = 'devastating-storm-heal-vfx';
    stormHealVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 105;
    `;
    
    // Create healing surge effect
    const healingSurge = document.createElement('div');
    healingSurge.className = 'healing-surge';
    stormHealVfx.appendChild(healingSurge);
    
    // Create enhanced healing aura
    const healingAura = document.createElement('div');
    healingAura.className = 'enhanced-healing-aura';
    stormHealVfx.appendChild(healingAura);
    
    // Create healing energy particles
    const energyContainer = document.createElement('div');
    energyContainer.className = 'healing-energy-particles';
    for (let i = 0; i < 16; i++) {
        const energy = document.createElement('div');
        energy.className = 'healing-energy';
        energy.style.setProperty('--angle', `${i * 22.5}deg`);
        energy.style.setProperty('--delay', `${i * 0.05}s`);
        energyContainer.appendChild(energy);
    }
    stormHealVfx.appendChild(energyContainer);
    
    // Create floating heal number
    const healText = document.createElement('div');
    healText.className = 'devastating-heal-text';
    healText.textContent = `+${healAmount}`;
    healText.style.cssText = `
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 20px;
        font-weight: bold;
        color: #ff69b4;
        text-shadow: 
            0 0 10px rgba(255, 105, 180, 1),
            0 0 20px rgba(255, 20, 147, 0.8);
        animation: devastatingHealFloat 2s ease-out forwards;
        z-index: 110;
    `;
    stormHealVfx.appendChild(healText);
    
    casterElement.appendChild(stormHealVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (stormHealVfx.parentNode) {
            stormHealVfx.remove();
        }
    }, 2500);
    
    console.log(`[ElpheltVFX] Showed Devastating Storm heal VFX for ${caster.name} (${healAmount} HP)`);
}

/**
 * Show VFX for Debuff Exploitation talent
 */
function showDebuffExploitationVFX(target, multiplier) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create debuff exploitation container
    const exploitVfx = document.createElement('div');
    exploitVfx.className = 'debuff-exploitation-vfx';
    exploitVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 106;
    `;
    
    // Create exploitation aura
    const exploitAura = document.createElement('div');
    exploitAura.className = 'exploitation-aura';
    exploitVfx.appendChild(exploitAura);
    
    // Create weakness particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'weakness-particles';
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'weakness-particle';
        particle.style.setProperty('--angle', `${i * 45}deg`);
        particle.style.setProperty('--delay', `${i * 0.1}s`);
        particleContainer.appendChild(particle);
    }
    exploitVfx.appendChild(particleContainer);
    
    // Create damage multiplier text
    const multiplierText = document.createElement('div');
    multiplierText.className = 'exploitation-multiplier-text';
    multiplierText.textContent = `${multiplier.toFixed(1)}x DMG!`;
    multiplierText.style.cssText = `
        position: absolute;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        font-weight: bold;
        color: #ff4757;
        text-shadow: 
            0 0 8px rgba(255, 71, 87, 1),
            0 0 16px rgba(255, 71, 87, 0.8);
        animation: exploitationTextFloat 1.8s ease-out forwards;
        z-index: 110;
    `;
    exploitVfx.appendChild(multiplierText);
    
    targetElement.appendChild(exploitVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (exploitVfx.parentNode) {
            exploitVfx.remove();
        }
    }, 1800);
    
    console.log(`[ElpheltVFX] Showed Debuff Exploitation VFX for ${target.name} (${multiplier.toFixed(1)}x damage)`);
}

/**
 * Show VFX for Heartbreak Shot talent
 */
function showHeartbreakShotVFX(target, heartbreakDamage) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create heartbreak shot container
    const heartbreakVfx = document.createElement('div');
    heartbreakVfx.className = 'heartbreak-shot-vfx';
    heartbreakVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 108;
    `;
    
    // Create heartbreak energy explosion
    const heartbreakExplosion = document.createElement('div');
    heartbreakExplosion.className = 'heartbreak-explosion';
    heartbreakVfx.appendChild(heartbreakExplosion);
    
    // Create broken heart particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'heartbreak-particles';
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'heartbreak-particle';
        particle.style.setProperty('--angle', `${i * 30}deg`);
        particle.style.setProperty('--delay', `${i * 0.08}s`);
        particleContainer.appendChild(particle);
    }
    heartbreakVfx.appendChild(particleContainer);
    
    // Create heartbreak damage text
    const heartbreakText = document.createElement('div');
    heartbreakText.className = 'heartbreak-damage-text';
    heartbreakText.textContent = `HEARTBREAK! +${heartbreakDamage}`;
    heartbreakText.style.cssText = `
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        font-weight: bold;
        color: #ff1493;
        text-shadow: 
            0 0 10px rgba(255, 20, 147, 1),
            0 0 20px rgba(255, 20, 147, 0.8);
        animation: heartbreakTextFloat 2.2s ease-out forwards;
        z-index: 110;
    `;
    heartbreakVfx.appendChild(heartbreakText);
    
    // Create heartbreak wave effect
    const heartbreakWave = document.createElement('div');
    heartbreakWave.className = 'heartbreak-wave';
    heartbreakVfx.appendChild(heartbreakWave);
    
    targetElement.appendChild(heartbreakVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (heartbreakVfx.parentNode) {
            heartbreakVfx.remove();
        }
    }, 2200);
    
    console.log(`[ElpheltVFX] Showed Heartbreak Shot VFX for ${target.name} (${heartbreakDamage} damage)`);
}

/**
 * Show VFX for Stunning Precision talent
 */
function showStunningPrecisionVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create stunning precision container
    const stunVfx = document.createElement('div');
    stunVfx.className = 'stunning-precision-vfx';
    stunVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 107;
    `;
    
    // Create precision impact burst
    const impactBurst = document.createElement('div');
    impactBurst.className = 'precision-impact-burst';
    stunVfx.appendChild(impactBurst);
    
    // Create lightning effect
    const lightningEffect = document.createElement('div');
    lightningEffect.className = 'precision-lightning';
    stunVfx.appendChild(lightningEffect);
    
    // Create shock waves
    const shockContainer = document.createElement('div');
    shockContainer.className = 'precision-shock-waves';
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'precision-shock-wave';
        wave.style.setProperty('--delay', `${i * 0.2}s`);
        shockContainer.appendChild(wave);
    }
    stunVfx.appendChild(shockContainer);
    
    // Create stunning text
    const stunText = document.createElement('div');
    stunText.className = 'precision-stun-text';
    stunText.textContent = 'STUNNED!';
    stunText.style.cssText = `
        position: absolute;
        top: 25%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        font-weight: bold;
        color: #ffa502;
        text-shadow: 
            0 0 10px rgba(255, 165, 2, 1),
            0 0 20px rgba(255, 165, 2, 0.8);
        animation: precisionStunTextFloat 2s ease-out forwards;
        z-index: 110;
    `;
    stunVfx.appendChild(stunText);
    
    targetElement.appendChild(stunVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (stunVfx.parentNode) {
            stunVfx.remove();
        }
    }, 2000);
    
    console.log(`[ElpheltVFX] Showed Stunning Precision VFX for ${target.name}`);
}

/**
 * Show simple VFX for Arcane Mastery talent
 */
function showArcaneMasteryVFX(caster, target, abilityType) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create simple arcane glow around caster
    const arcaneGlow = document.createElement('div');
    arcaneGlow.className = 'arcane-mastery-glow';
    arcaneGlow.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid #9966ff;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(153, 102, 255, 0.6);
        animation: arcaneMasterySimpleGlow 1s ease-out;
        pointer-events: none;
        z-index: 99;
    `;
    casterElement.appendChild(arcaneGlow);

    // Simple enhancement text
    const enhancementText = document.createElement('div');
    enhancementText.className = 'arcane-enhancement-text';
    enhancementText.style.cssText = `
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        color: #cc99ff;
        font-weight: bold;
        font-size: 11px;
        text-shadow: 0 0 4px rgba(204, 153, 255, 0.8);
        animation: arcaneTextFloat 1.5s ease-out forwards;
        z-index: 101;
        pointer-events: none;
    `;
    enhancementText.textContent = 'Arcane Enhanced';
    casterElement.appendChild(enhancementText);

    // Cleanup effects
    setTimeout(() => {
        if (arcaneGlow.parentNode) arcaneGlow.parentNode.removeChild(arcaneGlow);
        if (enhancementText.parentNode) enhancementText.parentNode.removeChild(enhancementText);
    }, 1500);
    
    console.log(`[ElpheltVFX] Showed simple Arcane Mastery VFX for ${abilityType}`);
}

/**
 * Show beautiful VFX for Empowered Shot talent
 */
function showEmpoweredShotVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create empowered energy container
    const empoweredContainer = document.createElement('div');
    empoweredContainer.className = 'empowered-shot-container';
    empoweredContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 95;
    `;
    casterElement.appendChild(empoweredContainer);

    // Create powerful energy aura
    const energyAura = document.createElement('div');
    energyAura.className = 'empowered-shot-aura';
    energyAura.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border: 3px solid #ff6b35;
        border-radius: 50%;
        box-shadow: 
            0 0 20px rgba(255, 107, 53, 0.8),
            inset 0 0 20px rgba(247, 147, 30, 0.4);
        animation: empoweredAuraPulse 1.2s ease-in-out;
        z-index: 96;
    `;
    empoweredContainer.appendChild(energyAura);

    // Create multiple energy orbs circling the character
    for (let i = 0; i < 8; i++) {
        const energyOrb = document.createElement('div');
        energyOrb.className = 'empowered-energy-orb';
        energyOrb.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: radial-gradient(circle, #ff6b35, #f7931e);
            box-shadow: 0 0 8px #ff6b35, 0 0 16px rgba(255, 107, 53, 0.6);
            animation: empoweredOrbFloat 2s linear infinite;
            animation-delay: ${i * 0.25}s;
            z-index: 97;
        `;
        
        // Position orbs in a circle
        const angle = (i / 8) * 2 * Math.PI;
        const radius = 35;
        const centerX = 50;
        const centerY = 50;
        const orbX = centerX + Math.cos(angle) * radius;
        const orbY = centerY + Math.sin(angle) * radius;
        
        energyOrb.style.left = `${orbX}%`;
        energyOrb.style.top = `${orbY}%`;
        energyOrb.style.transform = 'translate(-50%, -50%)';
        
        empoweredContainer.appendChild(energyOrb);
    }

    // Create power text
    const powerText = document.createElement('div');
    powerText.className = 'empowered-shot-text';
    powerText.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: #ff6b35;
        font-weight: bold;
        font-size: 12px;
        text-shadow: 
            0 0 4px #f7931e,
            0 0 8px rgba(255, 107, 53, 0.8);
        animation: empoweredTextFloat 1.8s ease-out forwards;
        z-index: 100;
        pointer-events: none;
    `;
    powerText.textContent = '+205 Power!';
    casterElement.appendChild(powerText);

    // Cleanup effects
    setTimeout(() => {
        if (empoweredContainer.parentNode) empoweredContainer.parentNode.removeChild(empoweredContainer);
        if (powerText.parentNode) powerText.parentNode.removeChild(powerText);
    }, 1800);
    
    console.log(`[ElpheltVFX] Showed Empowered Shot VFX for ${caster.name}`);
}

/**
 * Show beautiful VFX for Heartbreaking Mark talent
 */
function showHeartbreakingMarkVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create heartbreaking mark container
    const markContainer = document.createElement('div');
    markContainer.className = 'heartbreaking-mark-container';
    markContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 98;
    `;
    targetElement.appendChild(markContainer);

    // Create pulsing heart curse aura
    const curseAura = document.createElement('div');
    curseAura.className = 'heartbreaking-curse-aura';
    curseAura.style.cssText = `
        position: absolute;
        top: -15px;
        left: -15px;
        right: -15px;
        bottom: -15px;
        border: 3px solid #cc2955;
        border-radius: 50%;
        box-shadow: 
            0 0 25px rgba(204, 41, 85, 0.8),
            inset 0 0 25px rgba(139, 0, 139, 0.4);
        animation: heartbreakingAuraPulse 1.5s ease-in-out;
        z-index: 99;
    `;
    markContainer.appendChild(curseAura);

    // Create floating broken heart particles
    for (let i = 0; i < 6; i++) {
        const heartParticle = document.createElement('div');
        heartParticle.className = 'heartbreaking-particle';
        heartParticle.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            background: linear-gradient(45deg, #cc2955, #8b008b);
            clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 50% 85%, 18% 100%, 0% 38%);
            box-shadow: 0 0 10px rgba(204, 41, 85, 0.8);
            animation: heartbreakingParticleFloat 2.5s ease-out infinite;
            animation-delay: ${i * 0.3}s;
            z-index: 100;
        `;
        
        // Position particles in a circle
        const angle = (i / 6) * 2 * Math.PI;
        const radius = 40;
        const centerX = 50;
        const centerY = 50;
        const particleX = centerX + Math.cos(angle) * radius;
        const particleY = centerY + Math.sin(angle) * radius;
        
        heartParticle.style.left = `${particleX}%`;
        heartParticle.style.top = `${particleY}%`;
        heartParticle.style.transform = 'translate(-50%, -50%)';
        
        markContainer.appendChild(heartParticle);
    }

    // Create cursed energy waves
    const energyWaves = document.createElement('div');
    energyWaves.className = 'heartbreaking-energy-waves';
    energyWaves.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 80px;
        height: 80px;
        border: 2px solid rgba(204, 41, 85, 0.6);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: heartbreakingWaveExpand 2s ease-out;
        z-index: 97;
    `;
    markContainer.appendChild(energyWaves);

    // Create mark text
    const markText = document.createElement('div');
    markText.className = 'heartbreaking-mark-text';
    markText.style.cssText = `
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        color: #cc2955;
        font-weight: bold;
        font-size: 11px;
        text-shadow: 
            0 0 4px #8b008b,
            0 0 8px rgba(204, 41, 85, 0.8);
        animation: heartbreakingTextFloat 2.2s ease-out forwards;
        z-index: 101;
        pointer-events: none;
    `;
    markText.textContent = 'Marked!';
    targetElement.appendChild(markText);

    // Cleanup effects
    setTimeout(() => {
        if (markContainer.parentNode) markContainer.parentNode.removeChild(markContainer);
        if (markText.parentNode) markText.parentNode.removeChild(markText);
    }, 2200);
    
    console.log(`[ElpheltVFX] Showed Heartbreaking Mark VFX for ${target.name}`);
}

/**
 * Show Storm Mastery VFX - Enhanced bouncing chains with particle effects
 */
function showStormMasteryVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!casterElement || !targetElement) return;

    // Create enhanced chain lightning effect
    const chainLightning = document.createElement('div');
    chainLightning.className = 'storm-mastery-chain';
    chainLightning.style.cssText = `
        position: fixed;
        width: 4px;
        background: linear-gradient(90deg, #00ffff, #ffffff, #00ffff);
        box-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff;
        z-index: 15;
        animation: stormMasteryPulse 0.5s ease-out;
        pointer-events: none;
    `;

    // Calculate position between caster and target
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const angle = Math.atan2(endY - startY, endX - startX);
    
    chainLightning.style.left = `${startX}px`;
    chainLightning.style.top = `${startY}px`;
    chainLightning.style.height = `${distance}px`;
    chainLightning.style.transformOrigin = '0 0';
    chainLightning.style.transform = `rotate(${angle + Math.PI/2}rad)`;
    
    document.body.appendChild(chainLightning);

    // Create energy particles at target
    const energyBurst = document.createElement('div');
    energyBurst.className = 'storm-mastery-burst';
    energyBurst.style.cssText = `
        position: absolute;
        top: 20%; left: 20%;
        width: 60%; height: 60%;
        background: radial-gradient(circle, rgba(0, 255, 255, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        animation: stormMasteryBurst 0.8s ease-out;
        z-index: 14;
        pointer-events: none;
    `;
    targetElement.appendChild(energyBurst);

    // Create multiple energy orbs around target
    for (let i = 0; i < 6; i++) {
        const orb = document.createElement('div');
        orb.className = 'storm-mastery-orb';
        orb.style.cssText = `
            position: absolute;
            width: 8px; height: 8px;
            background: radial-gradient(circle, #00ffff, #ffffff);
            border-radius: 50%;
            box-shadow: 0 0 6px #00ffff;
            animation: stormMasteryOrb 1s ease-out;
            animation-delay: ${i * 0.1}s;
            z-index: 15;
            pointer-events: none;
        `;
        
        const angle = (i / 6) * 2 * Math.PI;
        const radius = 40;
        orb.style.left = `${50 + Math.cos(angle) * radius}%`;
        orb.style.top = `${50 + Math.sin(angle) * radius}%`;
        
        targetElement.appendChild(orb);
        
        // Remove orb after animation
        setTimeout(() => {
            if (orb.parentNode) orb.remove();
        }, 1100);
    }

    // Create floating text for talent effect
    const talentText = document.createElement('div');
    talentText.className = 'storm-mastery-text';
    talentText.textContent = 'STORM MASTERY';
    talentText.style.cssText = `
        position: absolute;
        top: -20px; left: 50%;
        transform: translateX(-50%);
        color: #00ffff;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 0 4px #00ffff, 1px 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        animation: stormMasteryTextFloat 2s ease-out;
        z-index: 16;
        pointer-events: none;
    `;
    targetElement.appendChild(talentText);

    // Clean up VFX elements
    setTimeout(() => {
        if (chainLightning.parentNode) chainLightning.remove();
        if (energyBurst.parentNode) energyBurst.remove();
        if (talentText.parentNode) talentText.remove();
    }, 2000);

    console.log(`[ElpheltVFX] Displayed Storm Mastery VFX for enhanced bounce from ${caster.name} to ${target.name}`);
}

/**
 * Show Swift Romance VFX - Heart particles and charm effects
 */
function showSwiftRomanceVFX(caster) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;

    // Create romantic aura around caster
    const romanticAura = document.createElement('div');
    romanticAura.className = 'swift-romance-aura';
    romanticAura.style.cssText = `
        position: absolute;
        top: -10px; left: -10px; right: -10px; bottom: -10px;
        background: radial-gradient(circle, rgba(255, 192, 203, 0.4) 0%, transparent 70%);
        border-radius: 50%;
        animation: swiftRomancePulse 1.5s ease-out;
        z-index: 12;
        pointer-events: none;
    `;
    casterElement.appendChild(romanticAura);

    // Create floating heart particles
    for (let i = 0; i < 8; i++) {
        const heart = document.createElement('div');
        heart.className = 'swift-romance-heart';
        heart.style.cssText = `
            position: absolute;
            width: 12px; height: 12px;
            background: radial-gradient(circle, #ff69b4, #ffb6c1);
            transform: rotate(45deg);
            animation: swiftRomanceHeartFloat 2s ease-out;
            animation-delay: ${i * 0.2}s;
            z-index: 14;
            pointer-events: none;
        `;
        
        // Create heart shape with pseudo-elements styling
        heart.style.borderRadius = '0 50% 50% 50%';
        heart.style.boxShadow = '0 0 6px #ff69b4';
        
        const angle = (i / 8) * 2 * Math.PI;
        const radius = 30;
        heart.style.left = `${50 + Math.cos(angle) * radius}%`;
        heart.style.top = `${50 + Math.sin(angle) * radius}%`;
        
        casterElement.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            if (heart.parentNode) heart.remove();
        }, 2200);
    }

    // Create floating talent text
    const talentText = document.createElement('div');
    talentText.className = 'swift-romance-text';
    talentText.textContent = 'SWIFT ROMANCE';
    talentText.style.cssText = `
        position: absolute;
        top: -30px; left: 50%;
        transform: translateX(-50%);
        color: #ff69b4;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 0 4px #ff69b4, 1px 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        animation: swiftRomanceTextFloat 2.5s ease-out;
        z-index: 15;
        pointer-events: none;
    `;
    casterElement.appendChild(talentText);

    // Clean up VFX elements
    setTimeout(() => {
        if (romanticAura.parentNode) romanticAura.remove();
        if (talentText.parentNode) talentText.remove();
    }, 2500);

    console.log(`[ElpheltVFX] Displayed Swift Romance VFX for ${caster.name}`);
}

// === TALENT HELPER FUNCTIONS ===

/**
 * Calculate debuff exploitation damage multiplier
 */
function calculateDebuffExploitationMultiplier(caster, target) {
    // Check if caster has debuff exploitation talent
    if (!caster.appliedTalents || !caster.appliedTalents.includes('debuff_exploitation')) {
        return 1.0; // No bonus
    }
    
    // Count debuffs on target
    const debuffCount = target.debuffs ? target.debuffs.length : 0;
    if (debuffCount === 0) {
        return 1.0; // No debuffs, no bonus
    }
    
    // 15% increased damage per debuff
    const multiplier = 1.0 + (debuffCount * 0.15);
    
    console.log(`[DebuffExploitation] ${target.name} has ${debuffCount} debuffs, damage multiplier: ${multiplier.toFixed(2)}x`);
    return multiplier;
}

/**
 * Apply stunning precision chance to Love Bullet
 */
function tryApplyStunningPrecision(caster, target) {
    // Check if caster has stunning precision talent
    if (!caster.appliedTalents || !caster.appliedTalents.includes('stunning_precision')) {
        return false;
    }
    
    // 5% chance to stun
    const stunChance = 0.05;
    const roll = Math.random();
    
    if (roll <= stunChance) {
        console.log(`[StunningPrecision] ${caster.name} triggers stunning precision! (${(roll * 100).toFixed(1)}% <= ${(stunChance * 100)}%)`);
        
        // Apply stun debuff using proper stun logic
        const stunDebuff = new Effect(
            `stunning_precision_stun_${Date.now()}`,
            'Stunned (Stunning Precision)',
            'Icons/abilities/stun.png',
            1, // 1 turn duration
            null,
            true // isDebuff
        );
        
        // Set proper stun effects
        stunDebuff.effects = { cantAct: true };
        stunDebuff.setDescription('Stunned by Elphelt\'s precise shot. Cannot act for 1 turn.');
        
        // Add visual effect for stun debuff
        stunDebuff.onApply = (character) => {
            console.log(`Showing stun VFX for ${character.name} (Stunning Precision)`);
            showStunningPrecisionVFX(character);
        };
        
        target.addDebuff(stunDebuff);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`${target.name} is stunned by ${caster.name}'s Stunning Precision!`);
        
        return true;
    }
    
    return false;
}

/**
 * Apply Heartbreaking Mark (Heart Debuff) to Love Bullet targets
 */
function tryApplyHeartbreakingMark(caster, target) {
    // Check if caster has heartbreaking mark talent
    if (!caster.appliedTalents || !caster.appliedTalents.includes('heartbreaking_mark')) {
        return false;
    }
    
    console.log(`[HeartbreakingMark] ${caster.name} triggers Heartbreaking Mark on ${target.name}!`);
    
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // Create unique debuff ID
    const debuffId = `heart_debuff_${caster.instanceId || caster.id}_${Date.now()}`;
    const duration = 2; // 2 turn duration
    
    log(`${caster.name}'s Love Bullet marks ${target.name} with a Heart Debuff!`);
    
    // Show Heart Debuff VFX
    showHeartbreakingMarkVFX(target);
    
    // Create the Heart Debuff for the target
    const heartDebuff = new Effect(
        debuffId,
        'Heart Debuff (Heartbreaking Mark)',
        'Icons/abilities/affection.jfif',
        duration,
        null,
        true // This is a debuff
    );
    
    // Set description for the debuff
    heartDebuff.setDescription(`Marked by ${caster.name}'s devastating shot. Can only target ${caster.name} or their allies. Deals 50% less damage.`);
    
    // Store the caster reference for targeting logic
    heartDebuff.forcedTargetCaster = caster;
    heartDebuff.forcedTargetCasterId = caster.instanceId || caster.id;
    
    // Set up damage reduction using the existing system
    heartDebuff.effects = {
        damageReductionPercent: 0.5 // 50% damage reduction
    };
    
    // Remove behavior
    heartDebuff.remove = (character) => {
        log(`${character.name}'s Heart Debuff from Heartbreaking Mark fades. They can now target anyone.`);
        console.log(`[HeartbreakingMark] Removing Heart Debuff from ${character.name}, clearing forced targeting...`);
        
        // Clear any forced targeting references
        if (character.forcedTargeting) {
            console.log(`[HeartbreakingMark] Clearing forced targeting for ${character.name}:`, character.forcedTargeting);
            delete character.forcedTargeting;
        }
        
        // Remove visual indicator
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (characterElement) {
            characterElement.classList.remove('heart-debuffed');
        }
    };
    
    // Apply the debuff to the target
    target.addDebuff(heartDebuff);
    
    // Set forced targeting on the target
    target.forcedTargeting = {
        type: 'heart_debuff',
        casterId: caster.instanceId || caster.id,
        casterName: caster.name,
        debuffId: debuffId
    };
    
    console.log(`[HeartbreakingMark] Applied forced targeting to ${target.name}:`, target.forcedTargeting);
    
    // Add visual indicator to the target
    const heartDebuffTargetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (heartDebuffTargetElement) {
        heartDebuffTargetElement.classList.add('heart-debuffed');
        
        // Remove the visual indicator when the debuff ends
        setTimeout(() => {
            if (heartDebuffTargetElement) {
                heartDebuffTargetElement.classList.remove('heart-debuffed');
            }
        }, duration * 1000); // Convert turns to milliseconds (assuming 1 turn = 1 second)
    }
    
    return true;
}

// === NEW LOVE BULLET VFX FUNCTIONS ===

/**
 * Show healing love bullet VFX with beautiful particle effects
 */
function showHealingLoveBulletVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (!casterElement || !targetElement) return;

    // Create healing projectile
    const healingProjectile = document.createElement('div');
    healingProjectile.className = 'healing-love-bullet-projectile';
    healingProjectile.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #00ff88, #88ffaa);
        border-radius: 50%;
        box-shadow: 0 0 15px #00ff88, 0 0 30px #00ff88, inset 0 0 10px rgba(255,255,255,0.3);
        z-index: 100;
        pointer-events: none;
    `;
    document.body.appendChild(healingProjectile);

    // Calculate positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    healingProjectile.style.left = `${startX}px`;
    healingProjectile.style.top = `${startY}px`;

    // Create trailing particles
    let particleCount = 0;
    const trailInterval = setInterval(() => {
        if (particleCount >= 8) {
            clearInterval(trailInterval);
            return;
        }
        
        const trailParticle = document.createElement('div');
        trailParticle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #88ffaa, transparent);
            border-radius: 50%;
            left: ${healingProjectile.offsetLeft}px;
            top: ${healingProjectile.offsetTop}px;
            z-index: 99;
            pointer-events: none;
            animation: healingTrailFade 1s ease-out forwards;
        `;
        document.body.appendChild(trailParticle);
        
        setTimeout(() => trailParticle.remove(), 1000);
        particleCount++;
    }, 60);

    // Animate projectile
    const animation = healingProjectile.animate([
        { transform: 'translate(0, 0) scale(0.8)', opacity: 0.9 },
        { opacity: 1, offset: 0.3 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.2)`, opacity: 1 }
    ], {
        duration: 700,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.onfinish = () => {
        clearInterval(trailInterval);
        
        // Create healing impact burst
        const healingBurst = document.createElement('div');
        healingBurst.className = 'healing-love-bullet-burst';
        healingBurst.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(0,255,136,0.8), transparent);
            border-radius: 50%;
            z-index: 100;
            animation: healingBurstExpand 1.2s ease-out forwards;
        `;
        targetElement.appendChild(healingBurst);
        
        // Create healing particles around target
        for (let i = 0; i < 12; i++) {
            const healParticle = document.createElement('div');
            healParticle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #00ff88, transparent);
                border-radius: 50%;
                top: ${30 + Math.random() * 40}%;
                left: ${30 + Math.random() * 40}%;
                z-index: 101;
                animation: healingParticleFloat ${0.8 + Math.random() * 0.6}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
            `;
            targetElement.appendChild(healParticle);
            
            setTimeout(() => healParticle.remove(), 1500);
        }
        
        // Add gentle glow to target
        targetElement.style.filter = 'drop-shadow(0 0 20px #00ff88)';
        setTimeout(() => targetElement.style.filter = '', 1000);
        
        healingProjectile.remove();
        setTimeout(() => healingBurst.remove(), 1200);
    };
}

/**
 * Show damage love bullet VFX with particle effects (no emojis)
 */
function showDamageLoveBulletVFX(caster, target) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (!casterElement || !targetElement) return;

    // Create damage projectile
    const damageProjectile = document.createElement('div');
    damageProjectile.className = 'damage-love-bullet-projectile';
    damageProjectile.style.cssText = `
        position: absolute;
        width: 18px;
        height: 18px;
        background: radial-gradient(circle, #ff1493, #ff69b4);
        border-radius: 50%;
        box-shadow: 0 0 12px #ff1493, 0 0 24px #ff1493, inset 0 0 8px rgba(255,255,255,0.4);
        z-index: 100;
        pointer-events: none;
    `;
    document.body.appendChild(damageProjectile);

    // Calculate positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    damageProjectile.style.left = `${startX}px`;
    damageProjectile.style.top = `${startY}px`;

    // Create energy trail
    let trailCount = 0;
    const energyTrail = setInterval(() => {
        if (trailCount >= 10) {
            clearInterval(energyTrail);
            return;
        }
        
        const trailParticle = document.createElement('div');
        trailParticle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #ff69b4, transparent);
            border-radius: 50%;
            left: ${damageProjectile.offsetLeft}px;
            top: ${damageProjectile.offsetTop}px;
            z-index: 99;
            pointer-events: none;
            animation: damageTrailFade 0.8s ease-out forwards;
        `;
        document.body.appendChild(trailParticle);
        
        setTimeout(() => trailParticle.remove(), 800);
        trailCount++;
    }, 50);

    // Animate projectile
    const animation = damageProjectile.animate([
        { transform: 'translate(0, 0) scale(0.7)', opacity: 0.8 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.3)`, opacity: 1 }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.onfinish = () => {
        clearInterval(energyTrail);
        
        // Create damage impact explosion
        const damageExplosion = document.createElement('div');
        damageExplosion.className = 'damage-love-bullet-explosion';
        damageExplosion.style.cssText = `
            position: absolute;
            top: 25%;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, rgba(255,20,147,0.9), rgba(255,105,180,0.4), transparent);
            border-radius: 50%;
            z-index: 100;
            animation: damageExplosionBurst 1s ease-out forwards;
        `;
        targetElement.appendChild(damageExplosion);
        
        // Create impact particles
        for (let i = 0; i < 8; i++) {
            const impactParticle = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            const distance = 25 + Math.random() * 15;
            impactParticle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #ff1493, transparent);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                z-index: 101;
                animation: damageImpactParticle 0.9s ease-out forwards;
            `;
            targetElement.appendChild(impactParticle);
            
            impactParticle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance - 50}px, ${Math.sin(angle) * distance - 50}px) scale(0.3)`, opacity: 0 }
            ], { duration: 900, easing: 'ease-out' });
            
            setTimeout(() => impactParticle.remove(), 900);
        }
        
        // Add shake effect to target
        targetElement.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => targetElement.style.animation = '', 400);
        
        damageProjectile.remove();
        setTimeout(() => damageExplosion.remove(), 1000);
    };
}

/**
 * Execute chain shot - fires at another random enemy
 */
function executeChainShot(caster, originalTarget, baseDamage, debuffMultiplier) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    console.log(`[Chain Shot] executeChainShot called. Caster: ${caster.name}, Original Target: ${originalTarget.name}`);
    
    // Find all valid enemy targets (excluding the original target)
    const gameManager = window.gameManager;
    if (!gameManager || !gameManager.gameState) {
        console.error(`[Chain Shot] GameManager or gameState not available!`);
        return null;
    }
    
    const allCharacters = [...gameManager.gameState.playerCharacters, ...gameManager.gameState.aiCharacters];
    console.log(`[Chain Shot] All characters: ${allCharacters.map(c => c.name).join(', ')}`);
    
    const validTargets = allCharacters.filter(char => 
        !char.isDead() && 
        char.isAI !== caster.isAI && 
        (char.instanceId || char.id) !== (originalTarget.instanceId || originalTarget.id)
    );
    
    console.log(`[Chain Shot] Valid targets: ${validTargets.map(c => c.name).join(', ')}`);
    
    if (validTargets.length === 0) {
        log(`${caster.name}'s Chain Shot has no valid targets!`);
        console.log(`[Chain Shot] No valid targets found.`);
        return null;
    }
    
    // Select random target
    const chainTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
    
    log(`${caster.name}'s Love Bullet chains to ${chainTarget.name}!`);
    
    // Show chain shot VFX
    showChainShotVFX(caster, originalTarget, chainTarget);
    
    // Apply same damage calculation
    let chainDamage = baseDamage;
    
    // Apply debuff exploitation to chain target too
    const chainDebuffMultiplier = calculateDebuffExploitationMultiplier(caster, chainTarget);
    if (chainDebuffMultiplier > 1.0) {
        chainDamage *= chainDebuffMultiplier;
        log(`Chain Shot benefits from Debuff Exploitation on ${chainTarget.name} (+${((chainDebuffMultiplier - 1) * 100).toFixed(0)}%)`);
        showDebuffExploitationVFX(chainTarget, chainDebuffMultiplier);
    }
    
    // Apply damage
    const chainResult = chainTarget.applyDamage(chainDamage, 'physical', caster, { abilityId: 'love_bullet_chain' });
    
    log(`Chain Shot deals ${chainResult.damage} physical damage to ${chainTarget.name}.`);
    if (chainResult.isCritical) {
        log("Chain Shot: Critical Hit!");
    }
    
    // Try to apply stunning precision to chain target too
    const chainWasStunned = tryApplyStunningPrecision(caster, chainTarget);
    
    // Try to apply Heartbreaking Mark to chain target too
    const chainWasMarked = tryApplyHeartbreakingMark(caster, chainTarget);
    
    // Apply lifesteal
    caster.applyLifesteal(chainResult.damage);
    
    return {
        target: chainTarget,
        damage: chainResult.damage,
        isCritical: chainResult.isCritical,
        wasStunned: chainWasStunned,
        wasMarked: chainWasMarked
    };
}

/**
 * Show chain shot VFX - energy jumps from original target to chain target
 */
function showChainShotVFX(caster, originalTarget, chainTarget) {
    const originalElement = document.getElementById(`character-${originalTarget.instanceId || originalTarget.id}`);
    const chainElement = document.getElementById(`character-${chainTarget.instanceId || chainTarget.id}`);

    if (!originalElement || !chainElement) return;

    // Create chain lightning effect
    const chainLightning = document.createElement('div');
    chainLightning.className = 'chain-shot-lightning';
    chainLightning.style.cssText = `
        position: absolute;
        height: 4px;
        background: linear-gradient(to right, #ff1493, #ff69b4, #ff1493);
        box-shadow: 0 0 8px #ff1493, 0 0 16px #ff1493;
        z-index: 102;
        pointer-events: none;
        border-radius: 2px;
    `;
    document.body.appendChild(chainLightning);

    // Calculate positions
    const originalRect = originalElement.getBoundingClientRect();
    const chainRect = chainElement.getBoundingClientRect();
    const startX = originalRect.left + originalRect.width / 2;
    const startY = originalRect.top + originalRect.height / 2;
    const endX = chainRect.left + chainRect.width / 2;
    const endY = chainRect.top + chainRect.height / 2;

    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

    chainLightning.style.left = `${startX}px`;
    chainLightning.style.top = `${startY}px`;
    chainLightning.style.width = `${distance}px`;
    chainLightning.style.transform = `rotate(${angle}deg)`;
    chainLightning.style.transformOrigin = '0 50%';

    // Animate chain lightning
    chainLightning.animate([
        { opacity: 0, transform: `rotate(${angle}deg) scaleX(0)` },
        { opacity: 1, transform: `rotate(${angle}deg) scaleX(1)`, offset: 0.1 },
        { opacity: 1, transform: `rotate(${angle}deg) scaleX(1)`, offset: 0.7 },
        { opacity: 0, transform: `rotate(${angle}deg) scaleX(1)` }
    ], { duration: 800, easing: 'ease-out' });

    // Create sparks along the chain
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            const spark = document.createElement('div');
            spark.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #ff1493, transparent);
                border-radius: 50%;
                left: ${startX + (endX - startX) * (i / 4)}px;
                top: ${startY + (endY - startY) * (i / 4)}px;
                z-index: 103;
                animation: chainSparkFlash 0.4s ease-out forwards;
            `;
            document.body.appendChild(spark);
            
            setTimeout(() => spark.remove(), 400);
        }
    }, 100);

    setTimeout(() => chainLightning.remove(), 800);
}

// === STATISTICS TRACKING FOR NEW FEATURES ===

/**
 * Track healing love bullet statistics
 */
function trackLoveBulletHealingStats(caster, target, healResult) {
    if (!window.statisticsManager) return;
    
    try {
        const healingAmount = typeof healResult === 'object' ? healResult.healingDone : healResult;
        const isCritical = typeof healResult === 'object' ? healResult.isCritical : false;
        
        window.statisticsManager.recordHealingDone(caster, healingAmount, 'love_bullet_heal', isCritical);
        window.statisticsManager.recordAbilityUsage(caster, 'love_bullet_heal', 'healing', healingAmount, {
            target: target.name,
            isCritical: isCritical,
            healingPower: caster.stats.healingPower || 0
        });
        
        console.log(`[ElpheltStats] Tracked Love Bullet healing: ${healingAmount} HP to ${target.name} ${isCritical ? '(Critical)' : ''}`);
    } catch (error) {
        console.error(`[ElpheltStats] Error tracking Love Bullet healing:`, error);
    }
}

/**
 * Track chain shot statistics
 */
function trackChainShotStats(caster, target, damageAmount, wasMarked = false) {
    if (!window.statisticsManager) return;
    
    try {
        window.statisticsManager.recordDamageDealt(caster, damageAmount, 'love_bullet_chain', false); // Chain shots don't inherit crit
        window.statisticsManager.recordAbilityUsage(caster, 'love_bullet_chain', 'damage', damageAmount, {
            target: target.name,
            chainShot: true,
            physicalDamage: caster.stats.physicalDamage || 0,
            magicalDamage: caster.stats.magicalDamage || 0
        });
        
        // Track Heart Debuff application to chain target if it occurred
        if (wasMarked) {
            window.statisticsManager.recordStatusEffect(caster, target, 'heart_debuff', 'heartbreaking_mark_chain', true, 'love_bullet_chain');
            trackElpheltAbilityUsage(caster, 'heartbreaking_mark_chain', 'debuff', 1, false);
        }
        
        console.log(`[ElpheltStats] Tracked Chain Shot: ${damageAmount} damage to ${target.name}, marked: ${wasMarked}`);
    } catch (error) {
        console.error(`[ElpheltStats] Error tracking Chain Shot:`, error);
    }
}

// === ABILITY IMPLEMENTATIONS ===

// --- Q: Love Bullet ---
const schoolgirlElpheltLoveBulletEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;

    if (!target) {
        log("Schoolgirl Elphelt Q: No target selected!", "error");
        return false;
    }

    // Check if target is ally or enemy
    const isTargetAlly = (caster.isAI === target.isAI);
    const hasHealingShot = caster.appliedTalents && caster.appliedTalents.includes('healing_shot');
    const hasChainShot = caster.appliedTalents && caster.appliedTalents.includes('chain_shot');

    // Play sound effect
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/elphelta1.mp3');

    if (isTargetAlly && hasHealingShot) {
        // === HEALING MODE ===
        log(`${caster.name} uses Healing Shot on ally ${target.name}.`);
        
        // Calculate healing: 215% of Magical Damage
        const healingAmount = Math.floor(caster.stats.magicalDamage * 2.15);
        
        // Create healing projectile VFX
        showHealingLoveBulletVFX(caster, target);
        
        // Apply healing
        const healResult = target.heal(healingAmount, caster, { abilityId: 'love_bullet_heal' });
        
        log(`${target.name} is healed for ${healResult.healingDone} HP by Love Bullet.`);
        if (healResult.isCritical) {
            log("Critical Heal!");
        }
        
        // Track statistics
        trackLoveBulletHealingStats(caster, target, healResult);
        
        // Trigger passive
        triggerElpheltPassive(caster, { name: 'Love Bullet' });
        
        // Check for Tactical Reload talent
        const hasTacticalReload = caster.appliedTalents && caster.appliedTalents.includes('tactical_reload');
        if (hasTacticalReload) {
            triggerTacticalReload(caster);
        }
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(caster);
            updateCharacterUI(target);
        }
        
        return { success: true, target: target, isHealing: true };
        
    } else if (!isTargetAlly) {
        // === DAMAGE MODE ===
        log(`${caster.name} uses Love Bullet on ${target.name}.`);
        
        // Create damage projectile VFX
        showDamageLoveBulletVFX(caster, target);
        
        // Calculate damage: 300 base + 50% Physical Damage + 50% Magical Damage
        let baseScalingDamage = (caster.stats.physicalDamage * 0.5) + (caster.stats.magicalDamage * 0.5);
        
        // Check for Empowered Shot talent - increases base damage
        const hasEmpoweredShot = caster.appliedTalents && caster.appliedTalents.includes('empowered_shot');
        let baseDamage = 300;
        if (hasEmpoweredShot) {
            baseDamage += 205; // Empowered Shot increases base damage by 205
            showEmpoweredShotVFX(caster, target);
        }
        
        // Check for Arcane Mastery talent - adds additional magical damage scaling
        const hasArcaneMastery = caster.appliedTalents && caster.appliedTalents.includes('arcane_mastery');
        let additionalMagicalScaling = 0;
        if (hasArcaneMastery) {
            additionalMagicalScaling = caster.stats.magicalDamage * 0.5; // Additional 50% magical damage scaling
            showArcaneMasteryVFX(caster, target, 'love_bullet');
        }
        
        let totalDamage = baseDamage + baseScalingDamage + additionalMagicalScaling;
        
        // Apply debuff exploitation multiplier
        const debuffMultiplier = calculateDebuffExploitationMultiplier(caster, target);
        if (debuffMultiplier > 1.0) {
            totalDamage *= debuffMultiplier;
            log(`${caster.name}'s Debuff Exploitation increases damage by ${((debuffMultiplier - 1) * 100).toFixed(0)}%!`);
            showDebuffExploitationVFX(target, debuffMultiplier);
        }

        const result = target.applyDamage(totalDamage, 'physical', caster, { abilityId: 'love_bullet' });

        // Check for Heartbreak Shot talent bonus damage
        const hasHeartbreakShot = caster.appliedTalents && caster.appliedTalents.includes('heartbreak_shot');
        const hasHeartDestroyer = caster.appliedTalents && caster.appliedTalents.includes('heart_destroyer');
        let heartbreakResult = null;
        let heartDestroyerResult = null;
        
        if (hasHeartbreakShot || hasHeartDestroyer) {
            // Check if target has any heart debuff
            const hasHeartDebuff = target.debuffs && target.debuffs.some(debuff => 
                debuff.id.includes('heart_debuff') || debuff.name.includes('Heart Debuff')
            );
            
            if (hasHeartDebuff) {
                // Apply Heartbreak Shot bonus damage
                if (hasHeartbreakShot) {
                    const heartbreakDamage = 395;
                    heartbreakResult = target.applyDamage(heartbreakDamage, 'magical', caster, { abilityId: 'love_bullet_heartbreak' });
                    log(`${caster.name}'s Heartbreak Shot devastates the heartbroken ${target.name} for an additional ${heartbreakResult.damage} magical damage!`);
                    showHeartbreakShotVFX(target, heartbreakResult.damage);
                }
                
                // Apply Heart Destroyer bonus damage
                if (hasHeartDestroyer) {
                    const heartDestroyerDamage = Math.floor(caster.stats.magicalDamage * 1.0); // 100% of magical damage
                    heartDestroyerResult = target.applyDamage(heartDestroyerDamage, 'magical', caster, { abilityId: 'love_bullet_heart_destroyer' });
                    log(`${caster.name}'s Heart Destroyer ability obliterates the heart-debuffed ${target.name} for an additional ${heartDestroyerResult.damage} magical damage!`);
                    showHeartDestroyerVFX(target, heartDestroyerResult.damage);
                }
            }
        }

        log(`${target.name} takes ${result.damage} physical damage from Love Bullet.`);
        if (result.isCritical) {
            log("Critical Hit!");
        }
        
        // Try to apply stunning precision
        const wasStunned = tryApplyStunningPrecision(caster, target);
        
        // Try to apply Heartbreaking Mark (Heart Debuff)
        const wasMarked = tryApplyHeartbreakingMark(caster, target);

        // Chain Shot functionality
        let chainShotResult = null;
        if (hasChainShot) {
            const chainRoll = Math.random();
            console.log(`[Chain Shot] Talent detected! Roll: ${chainRoll.toFixed(3)} (needs < 0.3)`);
            if (chainRoll < 0.3) {
                console.log(`[Chain Shot] Triggering chain shot!`);
                chainShotResult = executeChainShot(caster, target, totalDamage, debuffMultiplier);
                if (chainShotResult) {
                    log(`${caster.name}'s Love Bullet chains to ${chainShotResult.target.name} for ${chainShotResult.damage} damage!`);
                }
            } else {
                console.log(`[Chain Shot] Chain shot did not trigger this time.`);
            }
        } else {
            console.log(`[Chain Shot] Chain Shot talent not detected. Applied talents: ${caster.appliedTalents ? caster.appliedTalents.join(', ') : 'none'}`);
        }

        // Track statistics (include heartbreak damage and heart destroyer damage)
        const totalDamageDealt = result.damage + (heartbreakResult ? heartbreakResult.damage : 0) + (heartDestroyerResult ? heartDestroyerResult.damage : 0);
        const wasHeartbroken = heartbreakResult !== null || heartDestroyerResult !== null;
        trackLoveBulletStats(caster, target, result, wasStunned, false, wasHeartbroken, heartbreakResult ? heartbreakResult.damage : 0, wasMarked);
        
        // Track Heart Destroyer damage separately if it occurred
        if (heartDestroyerResult) {
            trackElpheltAbilityUsage(caster, 'heart_destroyer', 'damage', heartDestroyerResult.damage, false);
        }
        
        // Track chain shot if it occurred
        if (chainShotResult) {
            trackChainShotStats(caster, chainShotResult.target, chainShotResult.damage, chainShotResult.wasMarked || false);
        }

        // Apply lifesteal if any
        caster.applyLifesteal(result.damage);

        // Trigger passive
        triggerElpheltPassive(caster, { name: 'Love Bullet' });
        
        // Check for Tactical Reload talent
        const hasTacticalReload = caster.appliedTalents && caster.appliedTalents.includes('tactical_reload');
        if (hasTacticalReload) {
            triggerTacticalReload(caster);
        }

        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(caster);
            updateCharacterUI(target);
            if (chainShotResult) {
                updateCharacterUI(chainShotResult.target);
            }
        }

        return { success: true, target: target, chainTarget: chainShotResult ? chainShotResult.target : null };
    } else {
        // Invalid target combination
        log(`${caster.name} cannot use Love Bullet on ${target.name}. ${isTargetAlly ? 'Healing Shot talent required to target allies.' : 'Cannot target enemies without proper setup.'}`, "error");
        return { success: false };
    }
};

const schoolgirlElpheltQ = new Ability(
    'schoolgirl_elphelt_q',
    'Love Bullet',
    'Icons/abilities/love_bullet.jfif',
    50, // Mana cost
    1,  // Cooldown
    (caster, target, ability) => {
        const result = schoolgirlElpheltLoveBulletEffect(caster, target);
        // Trigger passive after successful ability use
        if (result && result.success) {
            triggerElpheltPassive(caster, ability);
        }
        return result;
    }
).setDescription('Deals 300 + (50% AD + 50% MD) physical damage to enemies. Can target allies with Healing Shot talent. <span class="talent-effect utility">With Tactical Reload: reduces a random ability cooldown by 1 turn.</span>')
    .setTargetType('enemy'); // Default to enemy targeting

// Add dynamic target type function
schoolgirlElpheltQ.getTargetType = function() {
    // Get the currently selected character to check their talents
    const gameManager = window.gameManager;
    if (gameManager && gameManager.gameState && gameManager.gameState.selectedCharacter) {
        const caster = gameManager.gameState.selectedCharacter;
        const hasHealingShot = caster.appliedTalents && caster.appliedTalents.includes('healing_shot');
        
        if (hasHealingShot) {
            return 'enemy_or_ally_except_self'; // Can target both enemies and allies but not self if has healing shot talent
        }
    }
    return 'enemy'; // Default to enemy targeting only
};

// --- W: Flower Bomb ---
const flowerBombEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    if (!target || !target.abilities || target.abilities.length === 0) {
        log("Flower Bomb: Invalid target or target has no abilities.", "error");
        return false;
    }
    
    log(`${caster.name} throws a Flower Bomb at ${target.name}!`);
    
    // Play sound effect for Flower Bomb
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    playSound('sounds/elphelt_a2.mp3');
    
    // Apply flower bomb effect to primary target
    const primaryResult = applyFlowerBombToTarget(caster, target);
    
    // Check for Enhanced Disruption talent (affects second target)
    const hasEnhancedDisruption = caster.appliedTalents && caster.appliedTalents.includes('enhanced_disruption');
    
    console.log(`[Enhanced Disruption Debug] Caster: ${caster.name}`);
    console.log(`[Enhanced Disruption Debug] AppliedTalents:`, caster.appliedTalents);
    console.log(`[Enhanced Disruption Debug] Talent active: ${hasEnhancedDisruption}`);
    
    if (hasEnhancedDisruption) {
        // Find a second random enemy target (excluding the primary target)
        const allEnemies = window.gameManager ? window.gameManager.getOpponents(caster).filter(char => !char.isDead() && char !== target) : [];
        
        console.log(`[Enhanced Disruption Debug] Found ${allEnemies.length} potential second targets:`, allEnemies.map(e => e.name));
        
        if (allEnemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * allEnemies.length);
            const secondTarget = allEnemies[randomIndex];
            
            log(`Enhanced Disruption: Flower Bomb spreads to ${secondTarget.name}!`);
            
            // Show enhanced disruption VFX
            showEnhancedDisruptionVFX(caster, target, secondTarget);
            
            // Apply flower bomb effect to second target with a delay
            setTimeout(() => {
                applyFlowerBombToTarget(caster, secondTarget);
            }, 500);
            
            return { success: true, target: target, secondTarget: secondTarget };
        } else {
            log(`Enhanced Disruption: No other enemies found to spread Flower Bomb to.`);
        }
    }

    return primaryResult;
};

// Helper function to apply flower bomb effect to a single target
const applyFlowerBombToTarget = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // --- Flower Bomb VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create main explosion container
        const bombVfx = document.createElement('div');
        bombVfx.className = 'flower-bomb-container';
        bombVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        
        // Create explosion core
        const explosionCore = document.createElement('div');
        explosionCore.className = 'flower-bomb-explosion';
        
        // Create flying rose petals
        const petalOffsets = [
            {x: '60px', y: '-60px'},   // NE
            {x: '80px', y: '0px'},     // E
            {x: '60px', y: '60px'},    // SE
            {x: '0px', y: '80px'},     // S
            {x: '-60px', y: '60px'},   // SW
            {x: '-80px', y: '0px'},    // W
            {x: '-60px', y: '-60px'},  // NW
            {x: '0px', y: '-80px'}     // N
        ];
        
        for (let i = 0; i < 8; i++) {
            const petal = document.createElement('div');
            petal.className = 'rose-petal';
            petal.style.setProperty('--delay', `${i * 0.1}s`);
            petal.style.setProperty('--direction', `${(i * 45)}deg`);
            petal.style.setProperty('--x-offset', petalOffsets[i].x);
            petal.style.setProperty('--y-offset', petalOffsets[i].y);
            bombVfx.appendChild(petal);
        }
        
        bombVfx.appendChild(explosionCore);
        targetElement.appendChild(bombVfx);

        setTimeout(() => bombVfx.remove(), 1500);
    }
    // --- End VFX ---

    // Check for Ultimate Disruption talent
    const hasUltimateDisruption = caster.appliedTalents && caster.appliedTalents.includes('ultimate_disruption');
    const hasExtendedDisruption = caster.appliedTalents && caster.appliedTalents.includes('extended_disruption');
    const disableDuration = hasExtendedDisruption || hasUltimateDisruption ? 3 : 2;
    
    if (hasUltimateDisruption) {
        // Ultimate Disruption: can stack multiple ability disables
        const maxStackedDisables = 4;
        const currentlyDisabledCount = target.abilities.filter(ability => ability && ability.isDisabled).length;
        
        if (currentlyDisabledCount >= maxStackedDisables) {
            log(`${target.name} already has the maximum number of disabled abilities (${maxStackedDisables}).`, "info");
            // Show Ultimate Disruption VFX even if at max
            showUltimateDisruptionVFX(target, 'max_disabled');
            return { success: true, target: target };
        }
        
        // Select abilities that are not disabled yet for stacking
        const availableAbilities = target.abilities.filter(ability => 
            ability && !ability.isDisabled
        );

        if (availableAbilities.length === 0) {
            log(`${target.name} has no abilities available to disable.`, "info");
            return { success: true, target: target };
        }

        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const abilityToDisable = availableAbilities[randomIndex];
        
        log(`${target.name}'s ${abilityToDisable.name} is disabled for ${disableDuration} turns! (Ultimate Disruption Stack #${currentlyDisabledCount + 1})`);
        log(`Ultimate Disruption demonstrates unparalleled battlefield control!`);
        
        // Show Ultimate Disruption VFX
        showUltimateDisruptionVFX(target, 'stacking_disable');
        
        // Create the disable debuff with special Ultimate Disruption styling
        const disableDebuff = new Effect(
            `elphelt_ultimate_disruption_disable_${Date.now()}`,
            `Ultimate Disable (${abilityToDisable.name})`,
            'Icons/talents/ultimate_disruption.webp',
            disableDuration,
            null,
            true // isDebuff = true
        ).setDescription(`${abilityToDisable.name} is disabled for ${disableDuration} turns by Ultimate Disruption (Stack #${currentlyDisabledCount + 1}).`);

        // Store which ability was disabled for cleanup
        disableDebuff.disabledAbilityId = abilityToDisable.id;

        // Apply the disable effect 
        abilityToDisable.isDisabled = true;
        abilityToDisable.disabledDuration = disableDuration;
        
        // Define the remove function for the debuff
        disableDebuff.remove = (character) => {
            const originallyDisabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
            if (originallyDisabledAbility) {
                if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                    originallyDisabledAbility.isDisabled = false;
                    log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Ultimate Disruption.`);
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(character);
                    }
                }
            }
        };

        // Apply the debuff to the target
        target.addDebuff(disableDebuff);
        
        // Track statistics
        trackFlowerBombStats(caster, target, abilityToDisable.name);
        
    } else {
        // Standard Flower Bomb behavior (non-stacking)
        const availableAbilities = target.abilities.filter(ability => 
            ability && !ability.isDisabled
        );

        if (availableAbilities.length === 0) {
            log(`${target.name} has no abilities available to disable.`, "info");
            return { success: true, target: target };
        }

        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const abilityToDisable = availableAbilities[randomIndex];
        
        log(`${target.name}'s ${abilityToDisable.name} is disabled for ${disableDuration} turns!`);
        
        if (hasExtendedDisruption) {
            log(`Extended Disruption enhances the flower bomb's disabling effect!`);
            // Show enhanced VFX for Extended Disruption
            showExtendedDisruptionVFX(target);
        }

        // Create the disable debuff
        const disableDebuff = new Effect(
            `elphelt_flower_bomb_disable_${Date.now()}`,
            'Ability Disabled (Flower Bomb)',
            'Icons/abilities/flower_bomb.jfif',
            disableDuration, // Duration: 2 or 3 turns based on talent
            null,
            true // isDebuff = true
        ).setDescription(`${abilityToDisable.name} is disabled for ${disableDuration} turns.`);

        // Store which ability was disabled for cleanup
        disableDebuff.disabledAbilityId = abilityToDisable.id;

        // Apply the disable effect 
        abilityToDisable.isDisabled = true;
        abilityToDisable.disabledDuration = disableDuration;
        
        // Define the remove function for the debuff
        disableDebuff.remove = (character) => {
            const originallyDisabledAbility = character.abilities.find(a => a.id === disableDebuff.disabledAbilityId);
            if (originallyDisabledAbility) {
                if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                    originallyDisabledAbility.isDisabled = false;
                    log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Flower Bomb.`);
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(character);
                    }
                }
            }
        };

        // Apply the debuff to the target
        target.addDebuff(disableDebuff);
        
        // Track statistics
        trackFlowerBombStats(caster, target, abilityToDisable.name);
    }
    
    // Update UI for both characters
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
        updateCharacterUI(target);
    }

    return { success: true, target: target };
};

const elpheltFlowerBomb = new Ability(
    'schoolgirl_elphelt_w',
    'Flower Bomb',
    'Icons/abilities/flower_bomb.jfif',
    75, // Mana cost
    8,  // Cooldown
    (caster, target, ability) => {
        const result = flowerBombEffect(caster, target);
        // Trigger passive after successful ability use
        if (result && result.success) {
            triggerElpheltPassive(caster, ability);
        }
        return result;
    }
).setDescription('Throws a flower bomb, disabling one of the target\'s abilities for 2 turns.')
 .setTargetType('enemy');

// --- E: Affection ---
const schoolgirlElpheltAffectionEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Affection: No target selected!", "error");
        return false;
    }

    const debuffId = `heart_debuff_${Date.now()}_${Math.random()}`;
    const duration = 4;

    log(`${caster.name} places a Heart Debuff on ${target.name}!`);
    playSound('sounds/elphelt_charm.mp3');

    // --- New Heart Debuff VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create heart energy effect
        const heartVfx = document.createElement('div');
        heartVfx.className = 'heart-debuff-vfx';
        heartVfx.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 95;
        `;
        
        // Heart energy waves
        heartVfx.innerHTML = `
            <div class="heart-debuff-pulse"></div>
            <div class="heart-debuff-ring"></div>
            <div class="heart-debuff-particles"></div>
        `;
        
        targetElement.appendChild(heartVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            if (heartVfx.parentNode) {
                heartVfx.remove();
            }
        }, 3000);
    }
    // --- End VFX ---

    // Create the Heart Debuff for the target
    const heartDebuff = new Effect(
        debuffId,
        'Heart Debuff',
        'Icons/abilities/affection.jfif',
        duration,
        null,
        true // This is a debuff
    );

    // Set description for the debuff
    heartDebuff.setDescription(`Enchanted by ${caster.name}. Can only target ${caster.name} or their allies. Deals 50% less damage.`);
    
    // Store the caster reference for targeting logic
    heartDebuff.forcedTargetCaster = caster;
    heartDebuff.forcedTargetCasterId = caster.instanceId || caster.id;
    
    // Set up damage reduction using the existing system
    heartDebuff.effects = {
        damageReductionPercent: 0.5 // 50% damage reduction
    };

    // Remove behavior
    heartDebuff.remove = (character) => {
        log(`${character.name}'s Heart Debuff fades. They can now target anyone.`);
        console.log(`[Heart Debuff] Removing Heart Debuff from ${character.name}, clearing forced targeting...`);
        
        // Clear any forced targeting references
        if (character.forcedTargeting) {
            console.log(`[Heart Debuff] Clearing forced targeting for ${character.name}:`, character.forcedTargeting);
            delete character.forcedTargeting;
        }
        
        // Remove visual indicator
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (characterElement) {
            characterElement.classList.remove('heart-debuffed');
        }
    };

    // Apply the debuff to the target
    target.addDebuff(heartDebuff);
    
    // Set forced targeting on the target
    target.forcedTargeting = {
        type: 'heart_debuff',
        casterId: caster.instanceId || caster.id,
        casterName: caster.name,
        debuffId: debuffId
    };
    
    console.log(`[Heart Debuff] Applied forced targeting to ${target.name}:`, target.forcedTargeting);
    
    // Add visual indicator to the target
    const heartDebuffTargetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (heartDebuffTargetElement) {
        heartDebuffTargetElement.classList.add('heart-debuffed');
        
        // Remove the visual indicator when the debuff ends
        setTimeout(() => {
            if (heartDebuffTargetElement) {
                heartDebuffTargetElement.classList.remove('heart-debuffed');
            }
        }, duration * 1000); // Convert turns to milliseconds (assuming 1 turn = 1 second)
    }

    // Track statistics
    trackAffectionStats(caster, target);

    // Update UI for both characters
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
        updateCharacterUI(target);
    }
    
    // Show Swift Romance VFX if talent is active
    const hasSwiftRomance = caster.appliedTalents && caster.appliedTalents.includes('swift_romance');
    if (hasSwiftRomance) {
        setTimeout(() => showSwiftRomanceVFX(caster), 500);
    }

    // If Swift Affection talent is active, prevent turn end
    const hasSwiftAffectionTalent = caster.appliedTalents && caster.appliedTalents.includes('swift_affection');

    return hasSwiftAffectionTalent
        ? { success: true, target: target, doesNotEndTurn: true }
        : { success: true, target: target };
};

const schoolgirlElpheltE = new Ability(
    'schoolgirl_elphelt_e',
    'Affection',
    'Icons/abilities/affection.jfif',
    100, // Mana cost
    9,  // Cooldown
    (caster, target, ability) => {
        const result = schoolgirlElpheltAffectionEffect(caster, target);
        // Trigger passive after successful ability use
        if (result && result.success) {
            triggerElpheltPassive(caster, ability);
        }
        return result;
    }
).setDescription('Places a Heart Debuff on the target enemy. The target can only target Elphelt or her allies, and deals 50% less damage for 4 turns.')
 .setTargetType('enemy');

// --- R: Heart Storm ---
const schoolgirlElpheltHeartStormEffect = async (caster, primaryTarget, ability) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    const gameManager = window.gameManager;
    if (!gameManager) {
        log("Heart Storm: Game manager not found!", "error");
        return false;
    }

    // Choose a primary target if none supplied (should not happen via UI)
    if (!primaryTarget) {
        const potential = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;
        const alive = potential.filter(c => !c.isDead());
        primaryTarget = alive[Math.floor(Math.random() * alive.length)] || null;
    }

    if (!primaryTarget) {
        log("Heart Storm: No valid target found!");
        return { success: false };
    }

    playSound('sounds/elphelta4.mp3');

    // Prepare target pools
    const allEnemies = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;
    const availableTargets = allEnemies.filter(c => !c.isDead());

    const hitTargets = [];
    let damageAmounts = [];
    let totalDamage = 0;

    let baseDamage = Math.floor(caster.stats.magicalDamage * 3.5);
    
    // Check for Arcane Mastery talent - adds additional magical damage scaling
    const hasArcaneMastery = caster.appliedTalents && caster.appliedTalents.includes('arcane_mastery');
    if (hasArcaneMastery) {
        const additionalMagicalScaling = Math.floor(caster.stats.magicalDamage * 0.5); // Additional 50% magical damage scaling
        baseDamage += additionalMagicalScaling;
        // Show arcane mastery VFX for first target
        if (primaryTarget) {
            setTimeout(() => showArcaneMasteryVFX(caster, primaryTarget, 'heart_storm'), 100);
        }
    }

    // Helper to create projectile VFX (CSS-based)
    const createProjectileVFX = (fromChar, toChar, delayMs = 0) => {
        const fromEl = document.getElementById(`character-${fromChar.instanceId || fromChar.id}`);
        const toEl = document.getElementById(`character-${toChar.instanceId || toChar.id}`);
        if (!fromEl || !toEl) return;

        const proj = document.createElement('div');
        proj.className = 'heart-storm-projectile';
        document.body.appendChild(proj);

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const startX = fromRect.left + fromRect.width / 2;
        const startY = fromRect.top + fromRect.height / 2;
        const endX = toRect.left + toRect.width / 2;
        const endY = toRect.top + toRect.height / 2;

        proj.style.left = `${startX}px`;
        proj.style.top = `${startY}px`;

        setTimeout(() => {
            proj.animate([
                { transform: 'scale(0.3)', offset: 0 },
                { transform: 'scale(1)', offset: 0.3 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.6)`, offset: 1 }
            ], {
                duration: 400,
                easing: 'linear'
            }).onfinish = () => proj.remove();
        }, delayMs);
    };

    const applyDamageTo = (target, delayIdx) => {
        setTimeout(() => {
            if (target.isDead()) return;

            createProjectileVFX(hitTargets.length === 0 ? caster : hitTargets[hitTargets.length - 1], target, 0);

            let finalDamage = baseDamage;
            const debuffMultiplier = calculateDebuffExploitationMultiplier(caster, target);
            if (debuffMultiplier > 1) {
                finalDamage *= debuffMultiplier;
            }

            const result = target.applyDamage(finalDamage, 'magical', caster, { abilityId: 'heart_storm' });
            damageAmounts.push(result.damage);
            totalDamage += result.damage;

            // Check for Heart Destroyer talent bonus damage
            const hasHeartDestroyer = caster.appliedTalents && caster.appliedTalents.includes('heart_destroyer');
            let heartDestroyerResult = null;
            
            if (hasHeartDestroyer) {
                // Check if target has any heart debuff
                const hasHeartDebuff = target.debuffs && target.debuffs.some(debuff => 
                    debuff.id.includes('heart_debuff') || debuff.name.includes('Heart Debuff')
                );
                
                if (hasHeartDebuff) {
                    const heartDestroyerDamage = Math.floor(caster.stats.magicalDamage * 1.0); // 100% of magical damage
                    heartDestroyerResult = target.applyDamage(heartDestroyerDamage, 'magical', caster, { abilityId: 'heart_storm_heart_destroyer' });
                    totalDamage += heartDestroyerResult.damage;
                    log(`${caster.name}'s Heart Destroyer ability obliterates the heart-debuffed ${target.name} for an additional ${heartDestroyerResult.damage} magical damage!`);
                    showHeartDestroyerVFX(target, heartDestroyerResult.damage);
                }
            }

            if (typeof updateCharacterUI === 'function') updateCharacterUI(target);

        }, delayIdx * 450);
    };

    // Start with primary target
    hitTargets.push(primaryTarget);
    applyDamageTo(primaryTarget, 0);

    let bounceCount = 0;
    let currentTarget = primaryTarget;

    while (bounceCount < 5) {
        const remaining = availableTargets.filter(t => !hitTargets.includes(t) && !t.isDead());
        if (remaining.length === 0) break;

        // Calculate bounce chance - base 50% + 22% from Storm Mastery talent
        const hasStormMastery = caster.appliedTalents && caster.appliedTalents.includes('storm_mastery');
        const bounceChance = hasStormMastery ? 0.72 : 0.5;
        
        if (Math.random() <= bounceChance) {
            const nextTarget = remaining[Math.floor(Math.random() * remaining.length)];
            bounceCount++;
            hitTargets.push(nextTarget);
            currentTarget = nextTarget;
            applyDamageTo(nextTarget, bounceCount);
            
            // Show Storm Mastery VFX if talent is active
            if (hasStormMastery && bounceCount === 1) {
                setTimeout(() => showStormMasteryVFX(caster, nextTarget), 200);
            }
        } else {
            break; // Bounce chain ended
        }
    }

    // Healing and cooldown reduce after all bounces concluded
    const hasDevastatingStorm = caster.appliedTalents && caster.appliedTalents.includes('devastating_storm');
    const hasStormRebound = caster.appliedTalents && caster.appliedTalents.includes('storm_rebound');

    const healPercent = hasDevastatingStorm ? 0.55 : 0.1;

    setTimeout(() => {
        if (totalDamage > 0) {
            const healAmount = Math.floor(totalDamage * healPercent);
            if (healAmount > 0) {
                caster.heal(healAmount, caster, { abilityId: 'heart_storm_heal' });
                if (hasDevastatingStorm) {
                    showDevastatingStormHealVFX(caster, healAmount);
                }
            }
        }

        // Storm Rebound cooldown reduction
        if (hasStormRebound && bounceCount > 0) {
            ability.currentCooldown = 5;
            log(`${ability.name} cooldown rebounds to 5 turns due to Storm Rebound!`, 'system-update');
        }

        // Stats tracking
        trackHeartStormStats(caster, hitTargets, damageAmounts, totalDamage * healPercent);

        if (typeof updateCharacterUI === 'function') updateCharacterUI(caster);

    }, (bounceCount + 1) * 450 + 50);

    return { success: true, targets: hitTargets };
};

const schoolgirlElpheltR = new Ability(
    'schoolgirl_elphelt_r',
    'Heart Storm',
    'Icons/abilities/heart_storm.jfif',
    100, // Mana cost
    14,  // Cooldown
    (caster, target, ability) => {
        const result = schoolgirlElpheltHeartStormEffect(caster, target, ability);
        // Trigger passive after successful ability use
        if (result && result.success) {
            triggerElpheltPassive(caster, ability);
        }
        return result;
    }
).setDescription('Fires a powerful shot that deals <span class="damage-value">350% Magical Damage</span> to an enemy. The shot has a 50% chance to bounce to a new enemy (up to 5 bounces). Heals self for <span class="healing-value">10%</span> of total damage dealt.')
 .setTargetType('enemy');

// --- Register with AbilityFactory ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirlElpheltQ,
        elpheltFlowerBomb,
        schoolgirlElpheltE,
        schoolgirlElpheltR
    ]);
    console.log('[SchoolgirlElpheltAbilities] Registered all abilities with AbilityFactory');
} else {
    console.warn("Schoolgirl Elphelt abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_elphelt_q = schoolgirlElpheltQ;
    window.definedAbilities.schoolgirl_elphelt_w = elpheltFlowerBomb;
    window.definedAbilities.schoolgirl_elphelt_e = schoolgirlElpheltE;
    window.definedAbilities.schoolgirl_elphelt_r = schoolgirlElpheltR;
}

// === GLOBAL TALENT FUNCTION REGISTRATION ===

// Register the talent description update function globally
if (typeof window !== 'undefined') {
    window.updateElpheltAbilityDescriptionsForTalents = updateElpheltAbilityDescriptionsForTalents;
    window.showExtendedDisruptionVFX = showExtendedDisruptionVFX;
    window.showDevastatingStormHealVFX = showDevastatingStormHealVFX;
    window.showDebuffExploitationVFX = showDebuffExploitationVFX;
    window.showStunningPrecisionVFX = showStunningPrecisionVFX;
    window.showHeartbreakShotVFX = showHeartbreakShotVFX;
    window.showArcaneMasteryVFX = showArcaneMasteryVFX;

    window.calculateDebuffExploitationMultiplier = calculateDebuffExploitationMultiplier;
    window.tryApplyStunningPrecision = tryApplyStunningPrecision;
    console.log('[SchoolgirlElpheltAbilities] Registered talent description update function and VFX functions globally');
}

function showRapidDisruptionVFX(caster) {
    const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!characterElement) return;

    // Create rapid disruption container
    const rapidContainer = document.createElement('div');
    rapidContainer.className = 'rapid-disruption-container';
    characterElement.appendChild(rapidContainer);

    // Create acceleration aura
    const accelerationAura = document.createElement('div');
    accelerationAura.className = 'rapid-disruption-acceleration';
    rapidContainer.appendChild(accelerationAura);

    // Create speed rings
    const speedRings = document.createElement('div');
    speedRings.className = 'rapid-disruption-speed-rings';
    rapidContainer.appendChild(speedRings);

    // Create velocity trails
    const velocityTrails = document.createElement('div');
    velocityTrails.className = 'rapid-disruption-velocity-trails';
    rapidContainer.appendChild(velocityTrails);

    // Create floating text
    const rapidText = document.createElement('div');
    rapidText.className = 'rapid-disruption-text';
    rapidText.innerHTML = `Rapid Disruption!`;
    rapidContainer.appendChild(rapidText);

    // Remove VFX after animation completes
    setTimeout(() => {
        if (rapidContainer.parentNode) {
            rapidContainer.remove();
        }
    }, 2500);

    // Add character glow effect
    characterElement.classList.add('rapid-disruption-glow');
    setTimeout(() => {
        characterElement.classList.remove('rapid-disruption-glow');
    }, 2000);
}

// === ULTIMATE DISRUPTION VFX ===

/**
 * Show Ultimate Disruption VFX - spectacular effects for the tier 8 talent
 */
function showUltimateDisruptionVFX(target, vfxType = 'stacking_disable') {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;

    // Create Ultimate Disruption VFX container
    const ultimateContainer = document.createElement('div');
    ultimateContainer.className = 'ultimate-disruption-vfx-container';
    ultimateContainer.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 100;
        pointer-events: none;
    `;
    targetElement.appendChild(ultimateContainer);

    if (vfxType === 'stacking_disable') {
        // Stacking disable VFX - mastery of battlefield control
        
        // Create ultimate energy explosion
        const energyExplosion = document.createElement('div');
        energyExplosion.className = 'ultimate-disruption-explosion';
        energyExplosion.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #ff6b6b 0%, #4ecdc4 30%, #45b7d1 60%, #9b59b6 100%);
            border-radius: 50%;
            animation: ultimateDisruptionExplosion 2s ease-out forwards;
            z-index: 101;
        `;
        ultimateContainer.appendChild(energyExplosion);

        // Create energy rings expanding outward
        for (let i = 0; i < 4; i++) {
            const ring = document.createElement('div');
            ring.className = 'ultimate-disruption-ring';
            ring.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                border: 3px solid rgba(255, 107, 107, 0.8);
                border-radius: 50%;
                animation: ultimateDisruptionRingExpand 2.5s ease-out forwards;
                animation-delay: ${i * 0.2}s;
                z-index: 100;
            `;
            ultimateContainer.appendChild(ring);
        }

        // Create control matrix overlay
        const controlMatrix = document.createElement('div');
        controlMatrix.className = 'ultimate-disruption-matrix';
        controlMatrix.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, 
                rgba(255, 107, 107, 0.1) 0%,
                rgba(78, 205, 196, 0.1) 25%,
                rgba(69, 183, 209, 0.1) 50%,
                rgba(155, 89, 182, 0.1) 75%,
                rgba(255, 107, 107, 0.1) 100%);
            animation: ultimateDisruptionMatrix 3s ease-out forwards;
            z-index: 99;
        `;
        ultimateContainer.appendChild(controlMatrix);

        // Create floating disruption particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'ultimate-disruption-particle';
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
                border-radius: 50%;
                top: ${20 + Math.random() * 60}%;
                left: ${20 + Math.random() * 60}%;
                animation: ultimateDisruptionParticleFloat 3s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                z-index: 102;
            `;
            ultimateContainer.appendChild(particle);
        }

        // Create ultimate mastery text
        const masteryText = document.createElement('div');
        masteryText.className = 'ultimate-disruption-text';
        masteryText.style.cssText = `
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff6b6b;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255, 107, 107, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: ultimateDisruptionTextFloat 3s ease-out forwards;
            z-index: 103;
        `;
        masteryText.innerHTML = `⚡ Ultimate Control!`;
        ultimateContainer.appendChild(masteryText);

        // Create energy spiral
        const energySpiral = document.createElement('div');
        energySpiral.className = 'ultimate-disruption-spiral';
        energySpiral.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border: 2px solid transparent;
            border-top: 2px solid #ff6b6b;
            border-right: 2px solid #4ecdc4;
            border-radius: 50%;
            animation: ultimateDisruptionSpiral 2s linear infinite;
            z-index: 98;
        `;
        ultimateContainer.appendChild(energySpiral);

    } else if (vfxType === 'max_disabled') {
        // Max disabled VFX - power demonstration even at maximum
        
        // Create power demonstration aura
        const maxPowerAura = document.createElement('div');
        maxPowerAura.className = 'ultimate-disruption-max-aura';
        maxPowerAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(155, 89, 182, 0.3) 0%, rgba(255, 107, 107, 0.2) 50%, transparent 70%);
            animation: ultimateDisruptionMaxPulse 2s ease-out forwards;
            z-index: 100;
        `;
        ultimateContainer.appendChild(maxPowerAura);

        // Create max power text
        const maxText = document.createElement('div');
        maxText.className = 'ultimate-disruption-max-text';
        maxText.style.cssText = `
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            color: #9b59b6;
            font-size: 11px;
            font-weight: bold;
            text-shadow: 0 0 8px rgba(155, 89, 182, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: ultimateDisruptionMaxTextFloat 2s ease-out forwards;
            z-index: 101;
        `;
        maxText.innerHTML = `🔒 Maximum Control!`;
        ultimateContainer.appendChild(maxText);
    }

    // Remove VFX after animation completes
    setTimeout(() => {
        if (ultimateContainer.parentNode) {
            ultimateContainer.remove();
        }
    }, 3500);
    
    // Add character glow effect
    targetElement.classList.add('ultimate-disruption-character-glow');
    setTimeout(() => {
        targetElement.classList.remove('ultimate-disruption-character-glow');
    }, 3000);
}

function triggerTacticalReload(caster) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // Get all abilities that are currently on cooldown, excluding Love Bullet (Q ability)
    const abilitiesOnCooldown = caster.abilities.filter(ability => {
        // Exclude Love Bullet (Q ability) from tactical reload
        const isLoveBullet = ability.id === 'schoolgirl_elphelt_q' || ability.name === 'Love Bullet';
        return ability.currentCooldown > 0 && !isLoveBullet;
    });
    
    if (abilitiesOnCooldown.length === 0) {
        console.log(`[Tactical Reload] No eligible abilities (W/E/R) on cooldown for ${caster.name}`);
        return;
    }
    
    // Select a random ability on cooldown (excluding Love Bullet)
    const randomAbility = abilitiesOnCooldown[Math.floor(Math.random() * abilitiesOnCooldown.length)];
    
    // Reduce its cooldown by 1
    const oldCooldown = randomAbility.currentCooldown;
    randomAbility.currentCooldown = Math.max(0, randomAbility.currentCooldown - 1);
    const newCooldown = randomAbility.currentCooldown;
    
    log(`${caster.name}'s Tactical Reload reduces ${randomAbility.name}'s cooldown by 1 turn! (${oldCooldown} → ${newCooldown})`);
    
    // Show VFX for tactical reload
    showTacticalReloadVFX(caster, randomAbility);
    
    // Update UI to reflect cooldown change
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster);
    }
    
    // Update ability cooldown display specifically 
    if (window.gameManager && typeof window.gameManager.updateAbilityCooldownDisplay === 'function') {
        window.gameManager.updateAbilityCooldownDisplay(caster.instanceId || caster.id, randomAbility.id);
    }
    
    // Trigger UI refresh event for ability updates
    const abilityUpdateEvent = new CustomEvent('AbilityUpdated', {
        detail: {
            character: caster,
            ability: randomAbility,
            type: 'cooldown_reduced'
        }
    });
    document.dispatchEvent(abilityUpdateEvent);
    
    // Track statistics
    trackElpheltAbilityUsage(caster, 'tactical_reload', 'utility', 1, false);
    
    console.log(`[Tactical Reload] ${caster.name} reduced ${randomAbility.name} cooldown from ${oldCooldown} to ${newCooldown}`);
}

function showTacticalReloadVFX(caster, affectedAbility) {
    const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!characterElement) return;

    // Create tactical reload container
    const reloadContainer = document.createElement('div');
    reloadContainer.className = 'tactical-reload-vfx-container';
    reloadContainer.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10;
        pointer-events: none;
    `;
    characterElement.appendChild(reloadContainer);

    // Create reload aura with tactical energy
    const reloadAura = document.createElement('div');
    reloadAura.className = 'tactical-reload-aura';
    reloadAura.style.cssText = `
        position: absolute;
        top: -20px; left: -20px; right: -20px; bottom: -20px;
        background: radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, rgba(0, 150, 255, 0.3) 40%, transparent 70%);
        border-radius: 50%;
        animation: tacticalReloadAuraPulse 2.5s ease-out forwards;
        z-index: 8;
    `;
    reloadContainer.appendChild(reloadAura);

    // Create tactical reload energy particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'tactical-reload-particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, #00ffff 0%, #0096ff 100%);
            border-radius: 50%;
            top: ${30 + Math.random() * 40}%;
            left: ${30 + Math.random() * 40}%;
            animation: tacticalReloadParticleFloat 2s ease-out forwards;
            animation-delay: ${i * 0.1}s;
            z-index: 9;
        `;
        reloadContainer.appendChild(particle);
    }

    // Create clockwork spinning effect
    const clockworkRing = document.createElement('div');
    clockworkRing.className = 'tactical-reload-clockwork';
    clockworkRing.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border: 3px solid rgba(0, 255, 255, 0.7);
        border-radius: 50%;
        border-left-color: transparent;
        border-right-color: transparent;
        animation: tacticalReloadClockwork 2s ease-out forwards;
        z-index: 9;
    `;
    reloadContainer.appendChild(clockworkRing);

    // Create reload success text
    const reloadText = document.createElement('div');
    reloadText.className = 'tactical-reload-text';
    reloadText.style.cssText = `
        position: absolute;
        top: 5%;
        left: 50%;
        transform: translateX(-50%);
        color: #00ffff;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 0 6px rgba(0, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        animation: tacticalReloadTextFloat 2.5s ease-out forwards;
        z-index: 11;
    `;
    reloadText.innerHTML = `Tactical Reload!`;
    reloadContainer.appendChild(reloadText);

    // Create ability name text
    const abilityText = document.createElement('div');
    abilityText.className = 'tactical-reload-ability-text';
    abilityText.style.cssText = `
        position: absolute;
        top: 85%;
        left: 50%;
        transform: translateX(-50%);
        color: #0096ff;
        font-size: 10px;
        font-weight: bold;
        text-shadow: 0 0 4px rgba(0, 150, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        animation: tacticalReloadTextFloat 2.5s ease-out forwards;
        animation-delay: 0.3s;
        opacity: 0;
        z-index: 11;
    `;
    abilityText.innerHTML = `${affectedAbility.name} -1 CD`;
    reloadContainer.appendChild(abilityText);

    // Remove VFX after animation completes
    setTimeout(() => {
        if (reloadContainer.parentNode) {
            reloadContainer.remove();
        }
    }, 2500);
    
    // Add character glow effect
    characterElement.classList.add('tactical-reload-glow');
    setTimeout(() => {
        characterElement.classList.remove('tactical-reload-glow');
    }, 2000);
}

function showHeartDestroyerVFX(target, heartDestroyerDamage) {
    const characterElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!characterElement) return;

    console.log(`[HeartDestroyer VFX] Creating destruction effects for ${target.name}`);

    // Create heart destroyer container
    const heartDestroyerVfx = document.createElement('div');
    heartDestroyerVfx.className = 'heart-destroyer-vfx';
    heartDestroyerVfx.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 109;
    `;
    
    // Create destruction energy explosion
    const destructionExplosion = document.createElement('div');
    destructionExplosion.className = 'heart-destroyer-explosion';
    heartDestroyerVfx.appendChild(destructionExplosion);
    
    // Create shattered heart particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'heart-destroyer-particles';
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'heart-destroyer-particle';
        particle.style.setProperty('--angle', `${i * 24}deg`);
        particle.style.setProperty('--delay', `${i * 0.06}s`);
        particle.style.setProperty('--distance', `${60 + Math.random() * 40}px`);
        particleContainer.appendChild(particle);
    }
    heartDestroyerVfx.appendChild(particleContainer);
    
    // Create dark energy waves
    const waveContainer = document.createElement('div');
    waveContainer.className = 'heart-destroyer-waves';
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'heart-destroyer-wave';
        wave.style.setProperty('--delay', `${i * 0.15}s`);
        wave.style.setProperty('--scale', `${1.2 + i * 0.3}`);
        waveContainer.appendChild(wave);
    }
    heartDestroyerVfx.appendChild(waveContainer);
    
    // Create heart destroyer damage text
    const destructionText = document.createElement('div');
    destructionText.className = 'heart-destroyer-damage-text';
    destructionText.textContent = `HEART DESTROYED! +${heartDestroyerDamage}`;
    destructionText.style.cssText = `
        position: absolute;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        font-weight: bold;
        color: #ff1744;
        text-shadow: 0 0 8px #ff1744, 0 0 12px #ff1744;
        z-index: 110;
        animation: heartDestroyerTextFloat 2s ease-out forwards;
        pointer-events: none;
    `;
    heartDestroyerVfx.appendChild(destructionText);

    // Create screen flash effect
    const screenFlash = document.createElement('div');
    screenFlash.className = 'heart-destroyer-screen-flash';
    screenFlash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, rgba(255, 23, 68, 0.3) 0%, transparent 70%);
        pointer-events: none;
        z-index: 105;
        animation: heartDestroyerFlash 0.4s ease-out forwards;
    `;
    document.body.appendChild(screenFlash);

    // Add to character element
    characterElement.appendChild(heartDestroyerVfx);
    
    // Add enhanced character glow
    characterElement.classList.add('heart-destroyer-target');
    
    // Screen shake effect
    const battleContainer = document.querySelector('.battle-container');
    if (battleContainer) {
        battleContainer.classList.add('heart-destroyer-shake');
        setTimeout(() => {
            battleContainer.classList.remove('heart-destroyer-shake');
        }, 600);
    }

    // Cleanup
    setTimeout(() => {
        if (heartDestroyerVfx && heartDestroyerVfx.parentNode) {
            heartDestroyerVfx.remove();
        }
        if (screenFlash && screenFlash.parentNode) {
            screenFlash.remove();
        }
        characterElement.classList.remove('heart-destroyer-target');
    }, 2500);

    console.log(`[HeartDestroyer VFX] Heart Destroyer effects created for ${target.name} with ${heartDestroyerDamage} damage`);
} 