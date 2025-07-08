// Ability definitions for Schoolgirl Ayane

// Assume Ability, Effect classes and addLogEntry function are available globally or imported

/**
 * Schoolgirl Ayane Statistics Enhancement
 * Enhanced statist    // Calculate damage: 425 + 55% Physical Damage
    let baseDamage = 425 + ((caster.stats.physicalDamage || 0) * 0.55);
    
    // Safety check to prevent NaN damage
    if (isNaN(baseDamage) || !isFinite(baseDamage)) {
        console.error(`[Butterfly Dagger Error] Invalid base damage: ${baseDamage}, using fallback value 425`);
        baseDamage = 425;
    }
    
    console.log(`[Butterfly Dagger Debug] Caster: ${caster.    // Apply damage with statistics tracking for all of Schoolgirl Ayane's abilities to match comprehensive tracking systems
 */

/**
 * Global helper function to track Schoolgirl Ayane's ability usage for statistics
 */
function trackAyaneAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[AyaneStats] StatisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[AyaneStats] Tracked ${abilityId} usage: ${effectType}, amount: ${amount}, crit: ${isCritical}`);
    } catch (error) {
        console.error(`[AyaneStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Track Butterfly Dagger statistics
 */
function trackButterflyDaggerStats(caster, target, damageResult, dodgeBuffApplied = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt
        if (damageAmount > 0) {
            window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, 'schoolgirl_ayane_q');
        }
        
        // Track ability usage
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_q', 'damage', damageAmount, isCritical);
        
        // Track dodge buff application if it occurred
        if (dodgeBuffApplied) {
            window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_q_dodge_buff', 'buff', 50, false);
        }
        
        console.log(`[AyaneStats] Tracked Butterfly Dagger: ${damageAmount} damage, crit: ${isCritical}, dodge buff: ${dodgeBuffApplied}`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Butterfly Dagger stats:', error);
    }
}

/**
 * Track Butterfly Trail statistics
 */
function trackButterflyTrailStats(caster, alliesBuffed, avgDamageBonus) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility usage for buff application
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_w', 'buff', alliesBuffed.length, false);
        
        // Track total damage bonus granted
        const totalDamageBonus = alliesBuffed.length * avgDamageBonus;
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_w_damage_bonus', 'buff', totalDamageBonus, false);
        
        console.log(`[AyaneStats] Tracked Butterfly Trail: ${alliesBuffed.length} allies buffed, ${totalDamageBonus} total damage bonus`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Butterfly Trail stats:', error);
    }
}

/**
 * Track Quick Reflexes statistics
 */
function trackQuickReflexesStats(caster, dodgeBuffAmount, damageBuffAmount) {
    if (!window.statisticsManager) return;
    
    try {
        // Track dodge buff
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_e_dodge', 'buff', dodgeBuffAmount, false);
        
        // Track damage buff
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_e_damage', 'buff', damageBuffAmount, false);
        
        // Track combined utility usage
        window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_e', 'buff', dodgeBuffAmount + damageBuffAmount, false);
        
        console.log(`[AyaneStats] Tracked Quick Reflexes: ${dodgeBuffAmount}% dodge, ${damageBuffAmount} damage bonus`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Quick Reflexes stats:', error);
    }
}

/**
 * Track Execute Attack statistics
 */
function trackExecuteAttackStats(caster, target, damageResult, wasExecute = false, cooldownReset = false) {
    if (!window.statisticsManager) return;
    
    try {
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        const abilityId = wasExecute ? 'schoolgirl_ayane_r_execute' : 'schoolgirl_ayane_r';
        
        // Track damage dealt
        if (damageAmount > 0) {
            window.statisticsManager.recordDamageDealt(caster, target, damageAmount, 'physical', isCritical, abilityId);
        }
        
        // Track ability usage
        window.statisticsManager.recordAbilityUsage(caster, abilityId, 'damage', damageAmount, isCritical);
        
        // Track execute threshold hit
        if (wasExecute) {
            window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_r_execute_threshold', 'utility', 0, false);
        }
        
        // Track cooldown reset
        if (cooldownReset) {
            window.statisticsManager.recordAbilityUsage(caster, 'schoolgirl_ayane_r_reset', 'utility', 0, false);
        }
        
        console.log(`[AyaneStats] Tracked Execute Attack: ${damageAmount} damage, execute: ${wasExecute}, reset: ${cooldownReset}`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Execute Attack stats:', error);
    }
}

/**
 * Track Combat Reflexes passive statistics
 */
function trackCombatReflexesPassiveStats(character, damageBonus) {
    if (!window.statisticsManager) return;
    
    try {
        // Track dodge that triggered the passive
        window.statisticsManager.recordAbilityUsage(character, 'schoolgirl_ayane_passive_dodge', 'utility', 1, false);
        
        // Track damage bonus gained
        window.statisticsManager.recordAbilityUsage(character, 'schoolgirl_ayane_passive_damage_bonus', 'buff', damageBonus, false);
        
        console.log(`[AyaneStats] Tracked Combat Reflexes passive: +${damageBonus} damage bonus from dodge`);
    } catch (error) {
        console.error('[AyaneStats] Error tracking Combat Reflexes passive stats:', error);
    }
}

// --- Q: Butterfly Dagger --- 

const schoolgirlAyaneButterflyDaggerEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Schoolgirl Ayane Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} throws a Butterfly Dagger at ${target.name}.`);
    playSound('sounds/dagger_throw.mp3'); // Placeholder sound

    // --- Butterfly Dagger VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        // Create the butterfly dagger container
        const daggerVfx = document.createElement('div');
        daggerVfx.className = 'schoolgirl-ayane-dagger-vfx';
        document.body.appendChild(daggerVfx);

        // Create dagger blade (main cutting edge)
        const daggerBlade = document.createElement('div');
        daggerBlade.className = 'schoolgirl-ayane-dagger-blade';
        daggerVfx.appendChild(daggerBlade);

        // Create dagger handle
        const daggerBody = document.createElement('div');
        daggerBody.className = 'schoolgirl-ayane-dagger-body';
        daggerVfx.appendChild(daggerBody);

        // Create dagger pommel
        const daggerTip = document.createElement('div');
        daggerTip.className = 'schoolgirl-ayane-dagger-tip';
        daggerVfx.appendChild(daggerTip);

        // Calculate positions and animation
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 3;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Position and orient the butterfly dagger
        daggerVfx.style.left = `${startX}px`;
        daggerVfx.style.top = `${startY}px`;
        daggerVfx.style.setProperty('--dagger-angle', `${angle}deg`);
        daggerVfx.style.setProperty('--dagger-distance', `${distance}px`);

        // Create sparkle trail effect
        const createSparkleTrail = () => {
            const numSparkles = 15; // Increased from 8
            const trailDelay = 40; // Slightly faster spawn rate
            
            for (let i = 0; i < numSparkles; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'schoolgirl-ayane-dagger-trail';
                    
                    // Position sparkles along the path
                    const progress = (i / numSparkles) * 0.85; // Trail behind the dagger
                    const sparkleX = startX + (endX - startX) * progress;
                    const sparkleY = startY + (endY - startY) * progress;
                    
                    // Add slight random offset for more natural look
                    const randomOffsetX = (Math.random() - 0.5) * 20;
                    const randomOffsetY = (Math.random() - 0.5) * 20;
                    
                    sparkle.style.left = `${sparkleX + randomOffsetX}px`;
                    sparkle.style.top = `${sparkleY + randomOffsetY}px`;
                    
                    document.body.appendChild(sparkle);
                    
                    // Remove sparkle after animation
                    setTimeout(() => sparkle.remove(), 1000);
                }, i * trailDelay);
            }
        };

        // Start the trail effect slightly after the dagger starts moving
        setTimeout(createSparkleTrail, 100);

        // Animate the butterfly dagger throw
        daggerVfx.style.animation = 'dagger-throw 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';

        setTimeout(() => {
            // Enhanced impact VFX on target
            const impactVfx = document.createElement('div');
            impactVfx.className = 'schoolgirl-ayane-dagger-impact';
            targetElement.appendChild(impactVfx);
            
            // Create additional butterfly sparkles on impact
            for (let i = 0; i < 12; i++) { // Increased from 5 to 12
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'schoolgirl-ayane-dagger-trail';
                    
                    // Random positions around the impact point
                    const offsetX = (Math.random() - 0.5) * 100; // Increased spread
                    const offsetY = (Math.random() - 0.5) * 100;
                    
                    sparkle.style.left = `${50 + offsetX}%`;
                    sparkle.style.top = `${50 + offsetY}%`;
                    sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
                    
                    targetElement.appendChild(sparkle);
                    
                    setTimeout(() => sparkle.remove(), 1000);
                }, i * 40); // Slightly faster spawn
            }
            
            playSound('sounds/dagger_impact.mp3');
            
            setTimeout(() => impactVfx.remove(), 800); // Increased from 600ms
            daggerVfx.remove();
        }, 600); // Increased from 400ms to match longer animation
    }
    // --- End VFX ---

    // Calculate damage: 425 + 55% Physical Damage (enhanced by Spectral Mastery talent)
    let physicalScaling = 0.55; // Base 55% scaling
    
    // Try to find the ability in the caster's abilities array for talent modifications
    const ability = caster.abilities.find(a => a.id === 'schoolgirl_ayane_q');
    if (ability && ability.additionalPhysicalScaling !== undefined) {
        physicalScaling += ability.additionalPhysicalScaling;
        console.log(`[Butterfly Dagger] Spectral Mastery talent active! Base scaling: 55%, Additional: ${ability.additionalPhysicalScaling * 100}%, Total: ${physicalScaling * 100}%`);
    }
    
    // Use the ability's fixedDamage property (modified by talents like Razor Edge) instead of hardcoded 425
    const fixedDamage = ability?.fixedDamage ?? 425; // Fallback to 425 if not found
    const baseDamage = fixedDamage + ((caster.stats.physicalDamage || 0) * physicalScaling);
    
    // Safety check to prevent NaN damage
    if (isNaN(baseDamage) || !isFinite(baseDamage)) {
        console.error(`[Butterfly Dagger Error] Invalid base damage: ${baseDamage}, using fallback value ${fixedDamage}`);
        baseDamage = fixedDamage;
    }
    
    console.log(`[Butterfly Dagger Debug] Caster: ${caster.name}, Fixed Damage: ${fixedDamage}, Physical Damage: ${caster.stats.physicalDamage}, Scaling: ${physicalScaling * 100}%, Base Damage: ${baseDamage}`);
    
    // Apply damage with statistics tracking
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'schoolgirl_ayane_q' });

    log(`${target.name} takes ${result.damage} physical damage.` + (result.isCritical ? ' (Critical Hit!)' : ''));

    // Apply lifesteal if caster has any
    caster.applyLifesteal(result.damage);

    // 60% chance to gain dodge chance buff
    let dodgeBuffApplied = false;
    
    // If ability not found, try to get it from the global schoolgirlAyaneQ
    let dodgeChance = 0.60; // Default fallback
    if (ability && ability.dodgeProcChance !== undefined) {
        dodgeChance = ability.dodgeProcChance;
    } else if (typeof schoolgirlAyaneQ !== 'undefined' && schoolgirlAyaneQ.dodgeProcChance !== undefined) {
        dodgeChance = schoolgirlAyaneQ.dodgeProcChance;
    }
    
    console.log(`[Ayane Q] Ability lookup: ${ability ? 'found' : 'not found'}, dodgeProcChance: ${ability ? ability.dodgeProcChance : 'N/A'}, using: ${dodgeChance}`);
    
    const rollResult = Math.random();
    console.log(`[Ayane Q] Rolling for dodge buff: ${rollResult} < ${dodgeChance}? Result: ${rollResult < dodgeChance}`);

    if (rollResult < dodgeChance) {
        dodgeBuffApplied = true;
        console.log(`[Ayane Q] Dodge buff should be applied!`);
        log(`${caster.name} gains Evasive Maneuver!`);
        
        console.log(`[Ayane Q] Creating dodge buff effect...`);
        const dodgeBuff = new Effect(
            'schoolgirl_ayane_q_dodge_buff',
            'Evasive Maneuver',
            'Icons/abilities/butterfly_dagger.webp', // Use Q icon for buff
            2, // Duration: 2 turns
            null, // No per-turn effect
            false // Not a debuff
        ).setDescription('Increases dodge chance by <span class="talent-enhanced">50%</span> for 2 turns.');

        console.log(`[Ayane Q] Setting dodge buff stat modifiers...`);
        dodgeBuff.statModifiers = [
            { stat: 'dodgeChance', value: 0.50, operation: 'add' }
        ];
        
        console.log(`[Ayane Q] Dodge buff created:`, dodgeBuff);

        // Define remove function for cleanup if needed (optional for short buffs)
        dodgeBuff.onRemove = (character) => {
             log(`${character.name}'s Evasive Maneuver fades.`);
             
             // Remove looping buff VFX
             const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
             if (charElement) {
                 const buffVfx = charElement.querySelector('.evasive-maneuver-buff-active');
                 if (buffVfx) {
                     buffVfx.remove();
                     console.log(`[Evasive Maneuver] Removed looping buff VFX for ${character.name}`);
                 }
                 
                 // Also remove shimmer effect
                 const shimmerVfx = charElement.querySelector('.evasive-maneuver-shimmer');
                 if (shimmerVfx) {
                     shimmerVfx.remove();
                     console.log(`[Evasive Maneuver] Removed shimmer VFX for ${character.name}`);
                 }
             }
        };

        // Check if the buff already exists to refresh its duration
        const existingBuff = caster.buffs.find(b => b.id === dodgeBuff.id);
        console.log(`[Ayane Q] Checking for existing buff: ${existingBuff ? 'found' : 'not found'}`);
        
        if (existingBuff) {
            existingBuff.duration = dodgeBuff.duration;
            log(`${caster.name}'s Evasive Maneuver has been refreshed to ${dodgeBuff.duration} turns.`);
            
            // VFX are already active, no need to add them again
            console.log(`[Evasive Maneuver] Buff refreshed, VFX already active for ${caster.name}`);
        } else {
            console.log(`[Ayane Q] Adding new dodge buff to ${caster.name}`);
            caster.addBuff(dodgeBuff.clone());
            console.log(`[Ayane Q] Buff added! Current buffs count: ${caster.buffs.length}`);
            
            // --- Add Looping Buff VFX ---
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                // Create the main aura effect
                const buffAura = document.createElement('div');
                buffAura.className = 'evasive-maneuver-buff-active';
                casterElement.appendChild(buffAura);

                // Add dodge wisps
                for (let i = 0; i < 4; i++) {
                    const wisp = document.createElement('div');
                    wisp.className = 'evasive-maneuver-wisp';
                    buffAura.appendChild(wisp);
                }

                // Add shimmer effect
                const shimmer = document.createElement('div');
                shimmer.className = 'evasive-maneuver-shimmer';
                casterElement.appendChild(shimmer);

                console.log(`[Evasive Maneuver] Added looping buff VFX for ${caster.name}`);
            }
            // --- End Looping Buff VFX ---
        }

        // --- Evasive Maneuver VFX ---
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const vfx = document.createElement('div');
            vfx.className = 'evasive-maneuver-vfx';
            casterElement.appendChild(vfx);

            const vfxText = document.createElement('div');
            vfxText.className = 'evasive-maneuver-text talent-enhanced-glow';
            vfxText.textContent = 'Dodge+';
            casterElement.appendChild(vfxText);

            setTimeout(() => {
                vfx.remove();
                vfxText.remove();
            }, 800);
        }
        // --- End VFX ---
    }
    
    // Track statistics
    trackButterflyDaggerStats(caster, target, result, dodgeBuffApplied);

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'schoolgirl_ayane_q',
            abilityName: 'Butterfly Dagger'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    if (target.isDead()) {
        log(`${target.name} has been defeated!`);
    }

    updateCharacterUI(caster);
    updateCharacterUI(target);
    
    // Check for Relentless Daggers talent (chance to not end turn)
    let shouldNotEndTurn = false;
    if (ability && ability.chanceToNotEndTurn) {
        const chanceToNotEndTurn = ability.chanceToNotEndTurn;
        if (Math.random() < chanceToNotEndTurn) {
            shouldNotEndTurn = true;
            
            // Show VFX for Relentless Daggers
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                const relentlessVfx = document.createElement('div');
                relentlessVfx.className = 'relentless-daggers-vfx';
                relentlessVfx.textContent = 'RELENTLESS!';
                casterElement.appendChild(relentlessVfx);
                
                setTimeout(() => {
                    relentlessVfx.remove();
                }, 1200);
            }
            
            log(`${caster.name}'s Relentless Daggers talent allows for another action!`);
        }
    }
    
    // Return appropriate result based on talent activation
    return shouldNotEndTurn ? { success: true, doesNotEndTurn: true } : { success: true };
};

const schoolgirlAyaneQ = new Ability(
    'schoolgirl_ayane_q',
    'Butterfly Dagger',
    'Icons/abilities/butterfly_dagger.webp',
    50, // Mana cost
    1,  // Cooldown (Changed from 2)
    schoolgirlAyaneButterflyDaggerEffect
).setTargetType('enemy');

// Set base damage for the ability (used for talent modifications)
schoolgirlAyaneQ.fixedDamage = 425;

// Initialize the dodge proc chance property and talent modifiers
schoolgirlAyaneQ.dodgeProcChance = 0.60;
schoolgirlAyaneQ.additionalPhysicalScaling = 0; // Base additional scaling (enhanced by Spectral Mastery talent)
schoolgirlAyaneQ.talentModifiers = schoolgirlAyaneQ.talentModifiers || {};

schoolgirlAyaneQ.generateDescription = function() {
    const safeDodgeChance = (isNaN(this.dodgeProcChance) || !isFinite(this.dodgeProcChance)) ? 0.60 : (this.dodgeProcChance || 0.60);
    const dodgeChancePercent = (safeDodgeChance * 100).toFixed(0);
    console.log(`[Ayane Q] Generating description with dodgeProcChance: ${this.dodgeProcChance} -> safe: ${safeDodgeChance} (${dodgeChancePercent}%)`);
    
    // Check if the dodge chance has been enhanced by talents (above base 60%)
    const isEnhanced = safeDodgeChance > 0.60;
    const dodgeChanceText = isEnhanced 
        ? `<span class="talent-enhanced">${dodgeChancePercent}%</span>` 
        : `${dodgeChancePercent}%`;
    
    // Check for Spectral Mastery talent
    let physicalScaling = 0.55; // Base 55% scaling
    let scalingText = "55%";
    let talentEffects = "";
    
    if (this.additionalPhysicalScaling !== undefined) {
        physicalScaling += this.additionalPhysicalScaling;
        scalingText = `<span class="talent-enhanced">${(physicalScaling * 100).toFixed(0)}%</span>`;
        talentEffects += `\n<span class="talent-effect damage">⚡ Spectral Mastery: Enhanced physical damage scaling from 55% to ${(physicalScaling * 100).toFixed(0)}%.</span>`;
        console.log(`[Ayane Q] Spectral Mastery talent active! Total scaling: ${physicalScaling * 100}%`);
    }
    
    // Check for base damage modifications (like Razor Edge talent)
    const baseDamage = this.fixedDamage || 425; // Use dynamic value or fallback to original
    let damageText = `${baseDamage}`;
    
    // Check if base damage has been enhanced by talents (above base 425)
    if (baseDamage > 425) {
        damageText = `<span class="talent-enhanced">${baseDamage}</span>`;
        const damageIncrease = baseDamage - 425;
        talentEffects += `\n<span class="talent-effect damage">⚡ Razor Edge: Base damage increased by ${damageIncrease} (${baseDamage} total).</span>`;
        console.log(`[Ayane Q] Razor Edge talent active! Base damage: ${baseDamage} (+${damageIncrease})`);
    }
    
    // Check for Relentless Daggers or Endless Assault talent effects
    let cooldownText = "";
    let chanceToNotEndTurnText = "";
    
    // Check if cooldown has been modified by talents
    if (this.cooldown === 0) {
        cooldownText = ` <span class="talent-enhanced">No cooldown</span>.`;
        talentEffects += `\n<span class="talent-effect utility">⚡ Relentless Assault: Removes cooldown on Butterfly Dagger.</span>`;
    } else {
        cooldownText = ` ${this.cooldown} turn cooldown.`;
    }
    
    // Check for chance to not end turn
    if (this.chanceToNotEndTurn && this.chanceToNotEndTurn > 0) {
        const chancePercent = (this.chanceToNotEndTurn * 100).toFixed(0);
        chanceToNotEndTurnText = ` <span class="talent-enhanced">${chancePercent}% chance to not end turn</span>.`;
        talentEffects += `\n<span class="talent-effect utility">⚡ Relentless Assault: ${chancePercent}% chance to not end turn when using Butterfly Dagger.</span>`;
    }
    
    this.description = `Deals ${damageText} (+${scalingText} Physical Damage). ${dodgeChanceText} chance to gain 50% dodge chance for 2 turns.${cooldownText}${chanceToNotEndTurnText}${talentEffects}`;
    
    if (isEnhanced) {
        console.log(`[Ayane Q] Description enhanced with talent styling: ${dodgeChancePercent}%`);
    }
    
    return this.description;
};

schoolgirlAyaneQ.generateDescription(); // Set initial description

// --- W: Butterfly Trail --- 
const schoolgirlAyaneWEffect = (caster, targets) => { // Target type is all_allies, so 'targets' isn't used directly here
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const gameManager = window.gameManager;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!gameManager) {
        log("Game Manager not found! Cannot apply Butterfly Trail buff.", "error");
        return;
    }

    log(`${caster.name} uses Butterfly Trail, empowering allies!`);
    // Play W sound effect
    playSound('sounds/ayanea2spell.mp3'); // Updated sound

    // Determine the allied team
    const allies = caster.isAI ? gameManager.gameState.aiCharacters : gameManager.gameState.playerCharacters;

    // --- Butterfly Trail VFX --- 
    allies.forEach(ally => {
        if (!ally || ally.isDead()) return;
        const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
        if (allyElement) {
            const trailVfx = document.createElement('div');
            trailVfx.className = 'butterfly-trail-vfx';
            // Add particle elements or styles here
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'butterfly-particle';
                trailVfx.appendChild(particle);
            }
            allyElement.appendChild(trailVfx);

            setTimeout(() => {
                trailVfx.remove();
            }, 1500); // Duration of the VFX
        }
    });
    // --- End VFX --- 

    const alliesBuffed = [];
    let totalDamageBonus = 0;
    
    allies.forEach(ally => {
        if (!ally || ally.isDead()) return;

        // Get the ability to check for talent bonuses
        const ability = caster.abilities.find(a => a.id === 'schoolgirl_ayane_w');
        const bonusMultiplier = ability && ability.bonusMultiplier ? ability.bonusMultiplier : 0.20;
        
        // Debug logging
        console.log(`[Butterfly Trail Debug] Ally: ${ally.name}, Physical Damage: ${ally.stats.physicalDamage}, Bonus Multiplier: ${bonusMultiplier}`);

        // Calculate flat increase based on the current bonus multiplier (20% base + 10% from talent if active)
        let physicalDamageIncrease = Math.floor((ally.stats.physicalDamage || 0) * (bonusMultiplier || 0.20));
        let magicalDamageIncrease = Math.floor((ally.stats.magicalDamage || 0) * (bonusMultiplier || 0.20));
        
        // Safety check to prevent NaN values
        if (isNaN(physicalDamageIncrease) || !isFinite(physicalDamageIncrease)) {
            console.error(`[Butterfly Trail Error] Invalid physical damage increase: ${physicalDamageIncrease}, resetting to 0`);
            physicalDamageIncrease = 0;
        }
        if (isNaN(magicalDamageIncrease) || !isFinite(magicalDamageIncrease)) {
            console.error(`[Butterfly Trail Error] Invalid magical damage increase: ${magicalDamageIncrease}, resetting to 0`);
            magicalDamageIncrease = 0;
        }
        
        // Debug logging for calculated values
        console.log(`[Butterfly Trail Debug] Physical Increase: ${physicalDamageIncrease}, Magical Increase: ${magicalDamageIncrease}`);

        // Check if bonus is enhanced by talent
        const isBonusEnhanced = bonusMultiplier > 0.20;
        const bonusPercent = Math.round(bonusMultiplier * 100);
        const bonusText = isBonusEnhanced ? `${bonusPercent}% boost` : `${bonusPercent}% boost`;

        // Create the buff effect instance for this ally
        const buff = new Effect(
            'schoolgirl_ayane_w_buff', // Unique ID for the buff type
            'Butterfly Trail Buff',
            'Icons/abilities/butterfly_trail_schoolgirl.webp', // Use W ability icon or a specific buff icon
            4, // Duration: 4 turns
            () => {}, // No per-turn effect needed as stats are modified on application/removal
            false // Not a debuff
        ).setDescription(`Increases Physical and Magical Damage by ${bonusPercent}% of current stats for 4 turns.`);

        // Add the calculated flat stat modifiers
        buff.statModifiers = [
            { stat: 'physicalDamage', value: physicalDamageIncrease, operation: 'add' },
            { stat: 'magicalDamage', value: magicalDamageIncrease, operation: 'add' }
        ];

        // Define remove function for cleanup and VFX removal
        buff.onRemove = (character) => {
            log(`${character.name}'s Butterfly Trail buff fades.`);
            
            // Remove looping buff VFX
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                const buffVfx = charElement.querySelector('.butterfly-trail-buff-active');
                if (buffVfx) {
                    buffVfx.remove();
                    console.log(`[Butterfly Trail] Removed looping buff VFX for ${character.name}`);
                }
            }
        };
        
        // The existing addBuff in character.js should handle storing original values 
        // and applying the flat modifier.
        ally.addBuff(buff.clone()); // Use clone to ensure each ally gets a separate buff instance if needed

        // --- Add Looping Buff VFX ---
        const allyElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
        if (allyElement) {
            // Create the main aura effect
            const buffAura = document.createElement('div');
            buffAura.className = 'butterfly-trail-buff-active';
            allyElement.appendChild(buffAura);

            // Add empowerment sparkles
            for (let i = 0; i < 6; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'butterfly-trail-sparkle';
                buffAura.appendChild(sparkle);
            }

            console.log(`[Butterfly Trail] Added looping buff VFX for ${ally.name}`);
        }
        // --- End Looping Buff VFX ---

        // Enhanced message if talent is active
        const damageText = isBonusEnhanced 
            ? `<span class="talent-enhanced">(+${physicalDamageIncrease} Phys Dmg, +${magicalDamageIncrease} Mag Dmg)</span>`
            : `(+${physicalDamageIncrease} Phys Dmg, +${magicalDamageIncrease} Mag Dmg)`;
        log(`${ally.name} is empowered by Butterfly Trail ${damageText}!`);
        updateCharacterUI(ally);
        
        // Track for statistics
        alliesBuffed.push(ally);
        totalDamageBonus += physicalDamageIncrease + magicalDamageIncrease;
    });
    
    // Track statistics
    const avgDamageBonus = alliesBuffed.length > 0 ? totalDamageBonus / alliesBuffed.length : 0;
    trackButterflyTrailStats(caster, alliesBuffed, avgDamageBonus);

    // Check if Graceful Trail talent is active and show enhanced message
    const ability = caster.abilities.find(a => a.id === 'schoolgirl_ayane_w');
    if (ability && ability.doesNotEndTurn === true) {
        log(`<span class="talent-enhanced">Graceful Trail: This ability does not end your turn!</span>`);
    }

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'schoolgirl_ayane_w',
            abilityName: 'Butterfly Trail'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    updateCharacterUI(caster);
};

const schoolgirlAyaneW = new Ability(
    'schoolgirl_ayane_w',
    'Butterfly Trail (Schoolgirl Version)',
    'Icons/abilities/butterfly_trail_schoolgirl.webp',
    85, // Mana cost
    7, // Cooldown
    schoolgirlAyaneWEffect
).setDescription('Gives ALL allies a buff increasing Physical Damage and Magical Damage by 20% for 4 turns.')
 .setTargetType('all_allies'); // Important: Set target type for UI/targeting logic

// Initialize properties for talent modification
schoolgirlAyaneW.bonusMultiplier = 0.20; // Base 20% bonus
schoolgirlAyaneW.doesNotEndTurn = false;
schoolgirlAyaneW.talentModifiers = schoolgirlAyaneW.talentModifiers || {};

schoolgirlAyaneW.generateDescription = function() {
    const totalBonus = this.bonusMultiplier || 0.20; // Fallback to base value
    
    // Safety check to prevent NaN in description
    const safeTotalBonus = (isNaN(totalBonus) || !isFinite(totalBonus)) ? 0.20 : totalBonus;
    const totalBonusPercent = Math.round(safeTotalBonus * 100);
    
    console.log(`[Ayane W] Generating description with bonusMultiplier: ${this.bonusMultiplier} -> safe: ${safeTotalBonus} (${totalBonusPercent}%)`);
    
    // Check if the bonus has been enhanced by talents (above base 20%)
    const isBonusEnhanced = safeTotalBonus > 0.20;
    const bonusText = isBonusEnhanced 
        ? `<span class="talent-enhanced">${totalBonusPercent}%</span>` 
        : `${totalBonusPercent}%`;
    
    // Check if the ability has been enhanced by the Graceful Trail talent
    const isGracefulTrailActive = this.doesNotEndTurn === true;
    const gracefulTrailText = isGracefulTrailActive 
        ? ' <span class="talent-enhanced">Does not end your turn.</span>' 
        : '';
    
    this.description = `Gives ALL allies a buff increasing Physical Damage and Magical Damage by ${bonusText} for 4 turns.${gracefulTrailText}`;
    
    if (isBonusEnhanced || isGracefulTrailActive) {
        console.log(`[Ayane W] Description enhanced with talent styling - Bonus: ${isBonusEnhanced}, Graceful: ${isGracefulTrailActive}`);
    }
    
    return this.description;
};

schoolgirlAyaneW.generateDescription(); // Set initial description

// --- E: Quick Reflexes ---
const schoolgirlAyaneEEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Quick Reflexes, becoming incredibly agile!`);
    playSound('sounds/quick_reflexes.mp3'); // Placeholder sound

    // --- Quick Reflexes VFX - Powerful Butterfly Burst ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        // Main activation VFX container
        const activationVfx = document.createElement('div');
        activationVfx.className = 'quick-reflexes-vfx';
        casterElement.appendChild(activationVfx);

        // Add butterfly burst particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'quick-reflexes-particle';
            activationVfx.appendChild(particle);
        }

        // Add speed lines for assassin feel
        const speedLines = document.createElement('div');
        speedLines.className = 'quick-reflexes-speed-lines';
        for (let i = 0; i < 5; i++) {
            const speedLine = document.createElement('div');
            speedLine.className = 'speed-line';
            speedLines.appendChild(speedLine);
        }
        casterElement.appendChild(speedLines);

        // Remove activation VFX after animation completes
        setTimeout(() => {
            activationVfx.remove();
            speedLines.remove();
        }, 1500);
    }
    // --- End Activation VFX ---

    // Calculate flat AD increase based on 250% of total AD
    const physicalDamageIncrease = Math.floor(caster.stats.physicalDamage * 2.5); // Use stats.physicalDamage which is recalculated
    const dodgeChanceIncrease = 100; // 100% dodge chance

    // Create the buff effect instance
    const buff = new Effect(
        'schoolgirl_ayane_e_buff', // Unique ID for the buff type
        'Quick Reflexes',
        'Icons/abilities/quick_reflexes.webp', // Placeholder icon
        2, // Duration: 2 turns
        () => {}, // No per-turn effect needed
        false // Not a debuff
    ).setDescription(`Gains 100% dodge chance and increases Physical Damage by 250% of current total Physical Damage (+${physicalDamageIncrease} AD) for 2 turns.`);

    // Add the stat modifiers
    buff.statModifiers = [
        { stat: 'dodgeChance', value: 1.0, operation: 'add' }, // 100% dodge chance
        { stat: 'physicalDamage', value: physicalDamageIncrease, operation: 'add' } // Flat AD increase
    ];

    // Define remove function for cleanup and VFX removal
    buff.onRemove = (character) => {
        log(`${character.name}'s Quick Reflexes wears off.`);
        
        // Remove looping buff VFX
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const buffVfx = charElement.querySelector('.quick-reflexes-buff-active');
            if (buffVfx) {
                buffVfx.remove();
                console.log(`[Quick Reflexes] Removed looping buff VFX for ${character.name}`);
            }
        }
    };

    // Apply the buff
    caster.addBuff(buff.clone());

    // --- Add Looping Buff VFX ---
    if (casterElement) {
        // Create the main aura effect
        const buffAura = document.createElement('div');
        buffAura.className = 'quick-reflexes-buff-active';
        casterElement.appendChild(buffAura);

        // Add floating butterfly particles
        for (let i = 0; i < 4; i++) {
            const floatingButterfly = document.createElement('div');
            floatingButterfly.className = 'quick-reflexes-floating-butterfly';
            buffAura.appendChild(floatingButterfly);
        }

        console.log(`[Quick Reflexes] Added looping buff VFX for ${caster.name}`);
    }
    // --- End Looping Buff VFX ---

    log(`${caster.name} gains 100% dodge and +${physicalDamageIncrease} AD!`);
    
    // Check if Fluid Combat talent is active and show enhanced message
    const ability = caster.abilities.find(a => a.id === 'schoolgirl_ayane_e');
    if (ability && ability.doesNotEndTurn === true) {
        log(`<span class="talent-enhanced">Fluid Combat: This ability does not end your turn!</span>`);
    }
    
    // Track statistics
    trackQuickReflexesStats(caster, dodgeChanceIncrease, physicalDamageIncrease);
    
    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'schoolgirl_ayane_e',
            abilityName: 'Quick Reflexes'
        }
    });
    document.dispatchEvent(abilityUsedEvent);
    
    updateCharacterUI(caster);
};

const schoolgirlAyaneE = new Ability(
    'schoolgirl_ayane_e',
    'Quick Reflexes',
    'Icons/abilities/quick_reflexes.webp', // Placeholder icon
    100, // Mana cost
    11, // Cooldown
    schoolgirlAyaneEEffect
).setDescription('Gains 100% dodge chance and increases Physical Damage by 250% of total Physical Damage for 2 turns.') // Update description
 .setTargetType('self');

// Initialize the doesNotEndTurn property for talent modification
schoolgirlAyaneE.doesNotEndTurn = false;
schoolgirlAyaneE.talentModifiers = schoolgirlAyaneE.talentModifiers || {};

schoolgirlAyaneE.generateDescription = function() {
    console.log(`[Ayane E] Generating description with doesNotEndTurn: ${this.doesNotEndTurn}`);
    
    // Check if the ability has been enhanced by the Fluid Combat talent
    const isFluidCombatActive = this.doesNotEndTurn === true;
    const fluidCombatText = isFluidCombatActive 
        ? ' <span class="talent-enhanced">Does not end your turn.</span>' 
        : '';
    
    this.description = `Gains 100% dodge chance and increases Physical Damage by 250% of total Physical Damage for 2 turns.${fluidCombatText}`;
    
    if (isFluidCombatActive) {
        console.log(`[Ayane E] Description enhanced with Fluid Combat talent styling`);
    }
    
    return this.description;
};

schoolgirlAyaneE.generateDescription(); // Set initial description

// --- R: Execute Attack ---
const schoolgirlAyaneREffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Schoolgirl Ayane R: No target selected!", "error");
        return;
    }

    log(`${caster.name} uses Execute Attack on ${target.name}!`);
    playSound('sounds/ayanea4.mp3'); // Updated sound

    // --- Execute Attack VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

    if (casterElement && targetElement) {
        // Example VFX: Caster dashes towards target, slash effect, impact
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'schoolgirl-ayane-execute-vfx';
        document.body.appendChild(vfxContainer); // Add to body for positioning

        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // 1. Dash/Teleport Effect (optional)
        // Could add a blur/shadow trail effect from caster to target

        // 2. Powerful Slash/Impact on Target
        const impactVfx = document.createElement('div');
        impactVfx.className = 'schoolgirl-ayane-execute-impact';
        targetElement.appendChild(impactVfx);

        setTimeout(() => {
            impactVfx.remove();
            vfxContainer.remove(); // Clean up container
        }, 1000); // Duration of impact VFX
    }
    // --- End VFX ---

    // Determine damage multiplier based on target HP
    const targetHpPercent = target.stats.currentHp / target.stats.maxHp;
    const isExecute = targetHpPercent < 0.25;
    const damageMultiplier = isExecute ? 6.0 : 2.5; // Updated multipliers: 600% and 250%

    log(`${target.name} is at ${(targetHpPercent * 100).toFixed(1)}% HP.` + (isExecute ? ' Execute threshold met!' : ''));

    // Calculate damage: 250% or 600% Physical Damage
    const baseDamage = caster.stats.physicalDamage * damageMultiplier;
    
    // Apply damage with statistics tracking
    const abilityId = isExecute ? 'ayane_r_execute' : 'ayane_r';
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: abilityId });

    log(`${target.name} takes ${result.damage} physical damage from Execute Attack!` + (isExecute ? ' (EXECUTED!)' : ''));

    // Apply lifesteal if caster has any
    caster.applyLifesteal(result.damage);

    // Check if target died and track cooldown reset
    let cooldownReset = false;
    if (target.isDead()) {
        log(`${target.name} has been defeated by Execute Attack!`);
        
        // Reset cooldown - simplified approach based on working ayane_abilities.js
        const executeAttackAbility = caster.abilities.find(ability => ability.id === 'schoolgirl_ayane_r');
        if (executeAttackAbility) {
            executeAttackAbility.currentCooldown = 0;
            cooldownReset = true;
            log(`${caster.name}'s Execute Attack cooldown has been reset!`);
            
            // Add reset VFX similar to working example
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                const resetVfx = document.createElement('div');
                resetVfx.className = 'cooldown-reset-vfx';
                resetVfx.textContent = 'RESET!';
                casterElement.appendChild(resetVfx);
                
                // Remove the VFX after animation
                setTimeout(() => {
                    resetVfx.remove();
                }, 1200);
            }
            
            updateCharacterUI(caster); // Update UI to show reset cooldown
        } else {
            // Debug logging to see what abilities exist
            console.warn('Could not find Execute Attack ability to reset cooldown. Available abilities:', 
                caster.abilities.map(ab => ({ id: ab.id, name: ab.name })));
        }
    }
    
    // Track statistics
    trackExecuteAttackStats(caster, target, result, isExecute, cooldownReset);

    // Dispatch ability used event for quest tracking
    const abilityUsedEvent = new CustomEvent('abilityUsed', {
        detail: {
            character: caster,
            abilityId: 'schoolgirl_ayane_r',
            abilityName: 'Execute Attack'
        }
    });
    document.dispatchEvent(abilityUsedEvent);

    updateCharacterUI(caster);
    updateCharacterUI(target);
    
    // Return result object for the ability system
    return {
        resetCooldown: cooldownReset  // This tells the Ability.use method whether to reset cooldown
    };
};

const schoolgirlAyaneR = new Ability(
    'schoolgirl_ayane_r',
    'Execute Attack',
    'Icons/abilities/execute_attack_schoolgirl.webp', // Placeholder icon
    100, // Mana cost
    12, // Cooldown
    schoolgirlAyaneREffect
).setDescription('Deals 250% Physical Damage. If the target is below 25% HP, deals 600% Physical Damage instead. Cooldown resets if this ability defeats the target.') // Update description
 .setTargetType('enemy');

// --- Register Abilities --- 
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolgirlAyaneQ,
        schoolgirlAyaneW,
        schoolgirlAyaneE,
        schoolgirlAyaneR // Add the new R ability
    ]);
} else {
    console.warn("Schoolgirl Ayane abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback registration
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolgirl_ayane_q = schoolgirlAyaneQ;
    window.definedAbilities.schoolgirl_ayane_w = schoolgirlAyaneW;
    window.definedAbilities.schoolgirl_ayane_e = schoolgirlAyaneE;
    window.definedAbilities.schoolgirl_ayane_r = schoolgirlAyaneR; // Add the new R ability
}

/**
 * Deadly Power Talent Functions
 */

/**
 * Initialize deadly power talent for Ayane
 */
function initializeDeadlyPower(character) {
    if (!character || character.id !== 'schoolgirl_ayane') return;
    
    console.log(`[DeadlyPower] Initializing deadly power for ${character.name}`);
    
    // Initialize config if not present
    if (!character.deadlyPowerConfig) {
        character.deadlyPowerConfig = {
            thresholdDamage: 750,
            critChanceBonus: 1.0,
            isActive: false,
            originalCritChance: character.stats.critChance || 0,
            buffId: 'deadly_power_crit_buff'
        };
    }
    
    // Check initial state
    checkDeadlyPowerState(character);
}

/**
 * Check deadly power state and activate/deactivate as needed
 */
function checkDeadlyPowerState(character) {
    if (!character || !character.deadlyPowerConfig) return;
    
    const config = character.deadlyPowerConfig;
    const currentPhysicalDamage = character.stats.physicalDamage || 0;
    const shouldBeActive = currentPhysicalDamage > config.thresholdDamage;
    
    if (shouldBeActive && !config.isActive) {
        activateDeadlyPower(character);
    } else if (!shouldBeActive && config.isActive) {
        deactivateDeadlyPower(character);
    }
}

/**
 * Activate deadly power - grant 100% crit chance
 */
function activateDeadlyPower(character) {
    if (!character || !character.deadlyPowerConfig) return;
    
    const config = character.deadlyPowerConfig;
    config.isActive = true;
    
    console.log(`[DeadlyPower] Activating deadly power for ${character.name}`);
    
    // Apply a permanent buff that sets crit chance to 100%
    const deadlyPowerBuff = new Effect(
        'deadly_power_crit_buff',
        'Deadly Power',
        'Icons/abilities/deadly_power.webp',
        999, // Permanent duration
        null, // No per-turn effect
        false // Not a debuff
    );
    
    // Set description
    deadlyPowerBuff.setDescription(`<span class="talent-enhanced">100% Critical Hit Chance</span> - Deadly Power is active!`);
    
    // Make the buff permanent and non-removable
    deadlyPowerBuff.isPermanent = true;
    deadlyPowerBuff.isRemovable = false;
    
    // Add stat modifier to the buff in the correct format
    deadlyPowerBuff.statModifiers = [
        { stat: 'critChance', value: 1.0, operation: 'set' }
    ];
    
    // Apply the buff to the character
    character.addBuff(deadlyPowerBuff);
    
    // Also directly set crit chance as backup
    character.stats.critChance = 1.0;
    
    // Create visual indicator
    createDeadlyPowerVisuals(character);
    
    // Show activation VFX
    showDeadlyPowerActivationVFX(character);
    
    // Log the activation
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    log(`<span class="talent-enhanced">${character.name}'s Deadly Power activates! 100% Critical Hit Chance!</span>`);
}

/**
 * Deactivate deadly power - remove crit chance buff
 */
function deactivateDeadlyPower(character) {
    if (!character || !character.deadlyPowerConfig) return;
    
    const config = character.deadlyPowerConfig;
    config.isActive = false;
    
    console.log(`[DeadlyPower] Deactivating deadly power for ${character.name}`);
    
    // Remove the deadly power buff
    character.removeBuff('deadly_power_crit_buff');
    
    // Restore original crit chance
    character.stats.critChance = config.originalCritChance;
    
    // Recalculate stats to ensure proper restoration
    if (character.recalculateStats) {
        character.recalculateStats('deadly_power_deactivation');
    }
    
    // Remove visual effects
    removeDeadlyPowerVisuals(character);
    
    // Log the deactivation
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    log(`${character.name}'s Deadly Power deactivates as Physical Damage drops below ${config.thresholdDamage}.`);
}

/**
 * Create visual effects for deadly power
 */
function createDeadlyPowerVisuals(character) {
    const possibleIds = [
        `character-${character.instanceId}`,
        `character-${character.id}`,
        `character-${character.instanceId || character.id}`,
        `player-character-${character.id}`,
        `ally-character-${character.id}`
    ];
    
    let charElement = null;
    for (const id of possibleIds) {
        charElement = document.getElementById(id);
        if (charElement) break;
    }
    
    if (!charElement) return;
    
    // Ensure parent has relative positioning
    const computedStyle = window.getComputedStyle(charElement);
    if (computedStyle.position === 'static') {
        charElement.style.position = 'relative';
    }
    
    // Remove existing visuals
    removeDeadlyPowerVisuals(character);
    
    // Create main indicator
    const indicator = document.createElement('div');
    indicator.className = 'deadly-power-indicator';
    indicator.textContent = '🦋 DEADLY POWER';
    indicator.title = 'Deadly Power: 100% Critical Hit Chance while above 750 Physical Damage';
    charElement.appendChild(indicator);
    
    // Create floating butterfly particles
    const particles = document.createElement('div');
    particles.className = 'deadly-power-particles';
    
    // Create individual butterfly particles
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'deadly-power-particle';
        particle.textContent = '🦋';
        particles.appendChild(particle);
    }
    
    charElement.appendChild(particles);
    
    console.log(`[DeadlyPower] Created visual effects for ${character.name}`);
}

/**
 * Remove visual effects for deadly power
 */
function removeDeadlyPowerVisuals(character) {
    const possibleIds = [
        `character-${character.instanceId}`,
        `character-${character.id}`,
        `character-${character.instanceId || character.id}`,
        `player-character-${character.id}`,
        `ally-character-${character.id}`
    ];
    
    let charElement = null;
    for (const id of possibleIds) {
        charElement = document.getElementById(id);
        if (charElement) break;
    }
    
    if (!charElement) return;
    
    // Remove indicator
    const indicator = charElement.querySelector('.deadly-power-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    // Remove particles
    const particles = charElement.querySelector('.deadly-power-particles');
    if (particles) {
        particles.remove();
    }
    
    console.log(`[DeadlyPower] Removed visual effects for ${character.name}`);
}

/**
 * Show activation VFX
 */
function showDeadlyPowerActivationVFX(character) {
    const possibleIds = [
        `character-${character.instanceId}`,
        `character-${character.id}`,
        `character-${character.instanceId || character.id}`,
        `player-character-${character.id}`,
        `ally-character-${character.id}`
    ];
    
    let charElement = null;
    for (const id of possibleIds) {
        charElement = document.getElementById(id);
        if (charElement) break;
    }
    
    if (!charElement) return;
    
    const vfx = document.createElement('div');
    vfx.className = 'deadly-power-activation-vfx';
    vfx.textContent = '🦋 DEADLY POWER ACTIVATED! 🦋';
    charElement.appendChild(vfx);
    
    // Create butterfly particles
    for (let i = 0; i < 5; i++) {
        const butterfly = document.createElement('div');
        butterfly.className = 'deadly-power-butterfly';
        butterfly.textContent = '🦋';
        butterfly.style.left = `${Math.random() * 100}%`;
        butterfly.style.animationDelay = `${i * 0.2}s`;
        charElement.appendChild(butterfly);
        
        // Remove butterfly after animation
        setTimeout(() => {
            butterfly.remove();
        }, 3000);
    }
    
    // Remove VFX after animation
    setTimeout(() => {
        vfx.remove();
    }, 2000);
}

// Export functions to global scope
window.initializeDeadlyPower = initializeDeadlyPower;
window.checkDeadlyPowerState = checkDeadlyPowerState;
window.activateDeadlyPower = activateDeadlyPower;
window.deactivateDeadlyPower = deactivateDeadlyPower;
window.createDeadlyPowerVisuals = createDeadlyPowerVisuals;
window.removeDeadlyPowerVisuals = removeDeadlyPowerVisuals;
window.showDeadlyPowerActivationVFX = showDeadlyPowerActivationVFX;