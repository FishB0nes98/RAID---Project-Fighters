// Ability definitions for Schoolboy Siegfried

// This file is now primarily for registering the ability ID so the factory can find it.
// The actual effect logic is handled by the AbilityFactory based on the type defined in the JSON.

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // We no longer need to define the full Ability object here.
    // The AbilityFactory will create it based on the 'schoolboy_siegfried.json' data.
    // We might register pre-defined *data* here in the future if needed,
    // but for simple abilities defined in JSON, this file can be minimal or even removed
    // if the factory automatically loads all character JSONs.
    
    // For now, let's keep this structure but acknowledge it's less critical for JSON-defined abilities.
    console.log("Schoolboy Siegfried abilities script loaded - relying on AbilityFactory and JSON data.");

} else {
    console.warn("AbilityFactory not found. Schoolboy Siegfried abilities might not load correctly.");
}

/**
 * Schoolboy Siegfried Statistics Enhancement
 * Enhanced statistics tracking for all of Siegfried's abilities to match comprehensive tracking systems
 */

/**
 * Global helper function to track Siegfried's ability usage for statistics
 */
function trackSiegfriedAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[SiegfriedStats] StatisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[SiegfriedStats] Tracked ${effectType} ability usage: ${abilityId} by ${character.name}`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Enhanced Sword Slash (Q) statistics tracking
 */
window.trackSwordSlashStats = function(caster, target, damageResult, type = 'primary') {
    if (!window.statisticsManager) return;
    
    try {
        // Determine ability ID based on attack type
        const abilityId = type === 'cleave' ? 'schoolboy_siegfried_q_cleave' : 'schoolboy_siegfried_q';
        
        // Track damage dealt with proper ability ID
        window.statisticsManager.recordDamageDealt(
            caster, 
            target, 
            damageResult.damage, 
            'physical', 
            damageResult.isCritical,
            abilityId
        );
        
        // Track ability usage
        trackSiegfriedAbilityUsage(caster, abilityId, 'damage', damageResult.damage, damageResult.isCritical);
        
        const attackType = type === 'cleave' ? 'cleave' : 'primary';
        console.log(`[SiegfriedStats] Sword Slash ${attackType} damage tracked: ${damageResult.damage} to ${target.name}`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking Sword Slash stats:`, error);
    }
};

/**
 * Enhanced Lion Protection (W) statistics tracking
 */
window.trackLionProtectionStats = function(caster, healAmount) {
    if (!window.statisticsManager) return;
    
    try {
        // Track healing done if any healing occurred
        if (healAmount > 0) {
            window.statisticsManager.recordHealingDone(
                caster,
                caster, // Self-heal
                healAmount,
                false, // Not critical
                'schoolboy_siegfried_w'
            );
        }
        
        // Track utility ability usage for the buff application
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_w', 'utility', 0, false);
        
        console.log(`[SiegfriedStats] Lion Protection tracked: ${healAmount} HP restored + defensive buff applied to ${caster.name}`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking Lion Protection stats:`, error);
    }
};

/**
 * Enhanced Sword Blessing (E) statistics tracking
 */
window.trackSwordBlessingStats = function(caster) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility ability usage for buff application
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_e', 'utility', 0, false);
        
        console.log(`[SiegfriedStats] Sword Blessing utility usage tracked for ${caster.name}`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking Sword Blessing stats:`, error);
    }
};

/**
 * Enhanced Judgement (R) statistics tracking
 */
window.trackJudgementStats = function(caster, target, damageResult, casterHealAmount, allyHealAmount = 0, ally = null) {
    if (!window.statisticsManager) return;
    
    try {
        // Track damage dealt
        window.statisticsManager.recordDamageDealt(
            caster,
            target,
            damageResult.damage,
            'physical',
            damageResult.isCritical,
            'schoolboy_siegfried_r'
        );
        
        // Track healing done to caster
        if (casterHealAmount > 0) {
            window.statisticsManager.recordHealingDone(
                caster,
                caster,
                casterHealAmount,
                false, // Not critical
                'schoolboy_siegfried_r_self_heal'
            );
        }
        
        // Track healing done to ally
        if (allyHealAmount > 0 && ally) {
            window.statisticsManager.recordHealingDone(
                caster,
                ally,
                allyHealAmount,
                false, // Not critical
                'schoolboy_siegfried_r_ally_heal'
            );
        }
        
        // Track primary ability usage
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_r', 'damage', damageResult.damage, damageResult.isCritical);
        
        console.log(`[SiegfriedStats] Judgement tracked: ${damageResult.damage} damage to ${target.name}, ${casterHealAmount} self-heal, ${allyHealAmount} ally heal`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking Judgement stats:`, error);
    }
};

/**
 * Enhanced Buff Connoisseur Passive statistics tracking
 */
window.trackBuffConnoisseurStats = function(character, buffCount, bonusDamage) {
    if (!window.statisticsManager) return;
    
    try {
        // Track passive ability usage when it triggers (provides bonus damage)
        if (bonusDamage > 0) {
            trackSiegfriedAbilityUsage(character, 'buff_connoisseur_passive', 'passive_trigger', bonusDamage, false);
            
            // Record as a passive event
            window.statisticsManager.recordTurnEvent({
                type: 'passive_trigger',
                caster: character.name,
                casterId: character.instanceId || character.id,
                passiveName: 'Buff Connoisseur',
                passiveId: 'buff_connoisseur_passive',
                buffCount: buffCount,
                bonusDamage: bonusDamage,
                turn: window.statisticsManager.currentTurn || 0
            });
        }
        
        console.log(`[SiegfriedStats] Buff Connoisseur passive tracked: ${buffCount} buffs providing ${bonusDamage} bonus damage`);
    } catch (error) {
        console.error(`[SiegfriedStats] Error tracking Buff Connoisseur stats:`, error);
    }
};

// --- Enhanced Passive Display ---
// Function to enhance and animate Siegfried's passive display
// Global function to check and update Tactical Patience
const checkTacticalPatience = (character) => {
    if (!character || character.id !== 'schoolboy_siegfried') return;
    
    // Get the passive instance
    const passiveInstance = character.passiveInstance || window.schoolboySiegfriedPassive;
    if (!passiveInstance || !passiveInstance.tacticalPatienceEnabled) return;
    
    console.log('[Tactical Patience] Checking cooldown status for', character.name);
    passiveInstance.checkTacticalPatience(character);
};

// Make it globally available
window.checkTacticalPatience = checkTacticalPatience;

const enhanceSiegfriedPassiveDisplay = (character) => {
    if (!character || !character.passive) return;
    
    const characterElement = document.querySelector(`[data-instance-id="${character.instanceId}"]`);
    if (!characterElement) return;
    
    // Remove existing indicator
    const existingIndicator = characterElement.querySelector('.passive-stack-indicator.siegfried-passive');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const buffCount = character.buffs.length;
    const damagePerBuff = character.passive.damagePerBuff || 125;
    const totalDamage = buffCount * damagePerBuff;
    
    if (buffCount > 0) {
        const indicator = document.createElement('div');
        indicator.className = 'passive-stack-indicator siegfried-passive';
        indicator.setAttribute('data-stacks', buffCount);
        
        const stackCount = document.createElement('div');
        stackCount.className = 'stack-count';
        stackCount.textContent = buffCount;
        
        const value = document.createElement('div');
        value.className = 'value';
        value.textContent = totalDamage;
        
        const suffix = document.createElement('div');
        suffix.className = 'suffix';
        suffix.textContent = 'DMG';
        
        indicator.appendChild(stackCount);
        indicator.appendChild(value);
        indicator.appendChild(suffix);
        
        // Enhanced tooltip with talent information
        let tooltipText = `Buff Connoisseur: +${damagePerBuff} Physical Damage per buff (${buffCount} active)`;
        
        // Add talent descriptions if applicable
        if (character.passive.buffDurationBonus > 0) {
            tooltipText += `\n⏳ Enduring Mastery: Buffs last ${character.passive.buffDurationBonus} additional turn${character.passive.buffDurationBonus > 1 ? 's' : ''}`;
        }
        
        if (character.passive.healOnBuffReceived > 0) {
            const healPercent = (character.passive.healOnBuffReceived * 100).toFixed(0);
            tooltipText += `\n💚 Restorative Buffs: Heal for ${healPercent}% max HP when receiving buffs`;
        }
        
        indicator.title = tooltipText;
        
        const imageContainer = characterElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.appendChild(indicator);
            
            // Add glow effect
            imageContainer.classList.add('siegfried-power-glow');
            
            // Add stack animation
            indicator.classList.add('stack-added');
            setTimeout(() => {
                indicator.classList.remove('stack-added');
            }, 1000);
        }
    } else {
        // Remove glow when no buffs
        const imageContainer = characterElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.classList.remove('siegfried-power-glow');
        }
    }
};

// Hook into the game manager's updateCharacterUI if possible to run our enhancement
if (window.gameManager && window.gameManager.uiManager) {
    // Store the original updateCharacterUI function
    const originalUpdateCharacterUI = window.gameManager.uiManager.updateCharacterUI;
    
    // Override with our enhanced version
    window.gameManager.uiManager.updateCharacterUI = function(character) {
        // Call the original function first
        originalUpdateCharacterUI.call(this, character);
        
        // Then apply our enhancements
        if (character.id === 'schoolboy_siegfried') {
            enhanceSiegfriedPassiveDisplay(character);
        }
    };
    
    console.log("Enhanced Siegfried passive display enabled");
}

// --- Passive Implementation Note ---
// The passive effect (Gain 125 Physical Damage per buff) is implemented by modifying
// the AbilityFactory.createDamageEffect method in character.js to check for 
// caster.id === 'schoolboy_siegfried' and add bonus damage based on caster.buffs.length. 

// --- CSS Injection for Dynamic Effects ---
// This ensures we have the necessary CSS for the character image glow
const injectSiegfriedCSS = () => {
    const styleId = 'siegfried-dynamic-styles';
    if (document.getElementById(styleId)) return; // Already exists
    
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
        /* Siegfried Power Glow - Added dynamically when buff count is high */
        .image-container.siegfried-power-glow {
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
            transition: box-shadow 0.5s ease-in-out;
        }
        
        .image-container.siegfried-power-glow img {
            filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
            transition: filter 0.5s ease-in-out;
        }

        /* Sword Slash VFX - Q ability */
        .siegfried-sword-slash-vfx {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            z-index: 1002;
            pointer-events: none;
            animation: siegfried-slash-container 0.6s ease-out forwards;
        }

        .siegfried-sword-slash-vfx::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            width: 0;
            height: 4px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.3) 10%, 
                rgba(255, 255, 255, 0.9) 30%, 
                #ffffff 50%, 
                rgba(255, 255, 255, 0.9) 70%, 
                rgba(255, 255, 255, 0.3) 90%, 
                transparent 100%
            );
            border-radius: 2px;
            box-shadow: 
                0 0 4px rgba(255, 255, 255, 0.8),
                0 0 8px rgba(192, 192, 192, 0.6),
                0 0 12px rgba(255, 255, 255, 0.4);
            animation: siegfried-slash-blade 0.6s ease-out forwards;
        }

        .siegfried-sword-slash-vfx::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(135deg);
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 215, 0, 0.3) 10%, 
                rgba(255, 215, 0, 0.8) 30%, 
                #ffd700 50%, 
                rgba(255, 215, 0, 0.8) 70%, 
                rgba(255, 215, 0, 0.3) 90%, 
                transparent 100%
            );
            border-radius: 1.5px;
            box-shadow: 
                0 0 3px rgba(255, 215, 0, 0.8),
                0 0 6px rgba(255, 215, 0, 0.5);
            animation: siegfried-slash-trail 0.6s ease-out 0.1s forwards;
        }

        /* Container animation */
        @keyframes siegfried-slash-container {
            0% {
                transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
                opacity: 0;
            }
            20% {
                transform: translate(-50%, -50%) scale(1) rotate(10deg);
                opacity: 1;
            }
            80% {
                transform: translate(-50%, -50%) scale(1.1) rotate(-5deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
                opacity: 0;
            }
        }

        /* Main blade slash animation */
        @keyframes siegfried-slash-blade {
            0% {
                opacity: 0;
                width: 0;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(0);
            }
            15% {
                opacity: 1;
                width: 80px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1);
            }
            40% {
                opacity: 1;
                width: 140px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.1);
            }
            70% {
                opacity: 0.8;
                width: 160px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.2);
            }
            100% {
                opacity: 0;
                width: 180px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.3);
            }
        }

        /* Secondary trail animation */
        @keyframes siegfried-slash-trail {
            0% {
                opacity: 0;
                width: 0;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(0);
            }
            20% {
                opacity: 0.8;
                width: 60px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1);
            }
            50% {
                opacity: 0.6;
                width: 100px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1.1);
            }
            100% {
                opacity: 0;
                width: 120px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1.2);
            }
        }
    `;
    
    document.head.appendChild(styleSheet);
};

// Run the CSS injector
injectSiegfriedCSS();

/**
 * Lion's Resonance – passive talent support
 * If Siegfried has the talent 'lion_protection_resonance', any ability (except Lion Protection itself)
 * has a 20% chance to automatically grant a stack of Lion Protection.
 */
window.tryAutoLionProtection = function(caster, triggeringAbilityId = '') {
    if (!caster || caster.id !== 'schoolboy_siegfried') return;
    if (!(caster.hasTalent && caster.hasTalent('lion_protection_resonance'))) return;
    // Avoid recursion when Lion Protection triggers itself
    if (triggeringAbilityId === 'schoolboy_siegfried_w') return;

    const chance = caster.lionProtectionExtraChance || 0.20;
    if (Math.random() < chance) {
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(`🦁 Lion's Resonance activates – gaining an extra stack of Lion Protection!`, 'talent-effect utility');
        }
        // Activate Lion Protection without consuming mana or cooldown
        schoolboySiegfriedLionProtectionEffect(caster, /*isAuto*/ true);
    }
};

// W: Lion Protection
const schoolboySiegfriedLionProtectionEffect = (caster, isAuto = false) => {
    console.log(`[Lion Protection] ${caster.name} casts Lion Protection`);
    
    // Check for Enhanced Lion Protection talent
    const hasEnhancedLionProtection = caster.hasTalent && caster.hasTalent('enhanced_lion_protection');
    const healingPercentage = hasEnhancedLionProtection ? 0.25 : 0.10; // 25% vs 10%
    
    // Calculate missing health
    const maxHp = caster.stats.maxHp || caster.stats.hp;
    const currentHp = caster.stats.currentHp;
    const missingHp = maxHp - currentHp;
    
    // Calculate healing amount (percentage of missing health)
    let healAmount = Math.floor(missingHp * healingPercentage);
    
    // Apply healing power scaling
    if (caster.stats.healingPower > 0) {
        healAmount = Math.floor(healAmount * (1 + caster.stats.healingPower));
        console.log(`[Lion Protection] Healing scaled by healing power: ${healAmount}`);
    }
    
    // Apply healing
    if (healAmount > 0) {
        caster.heal(healAmount, caster, { abilityId: 'schoolboy_siegfried_w' });
        console.log(`[Lion Protection] ${caster.name} healed for ${healAmount} HP`);
        
        // Track healing statistics
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_w', 'healing', healAmount);
    }
    
    // Apply Lion Protection buff (defensive bonuses)
    const lionProtectionBuff = {
        id: 'lion_protection_buff',
        name: 'Lion Protection',
        duration: 3,
        icon: 'Icons/abilities/lion_protection.jfif',
        description: 'Protected by the lion\'s strength. +50% Armor and Magical Shield.',
        statModifiers: [
            { stat: 'armor', value: 0.5, operation: 'add_base_percentage' },
            { stat: 'magicalShield', value: 0.5, operation: 'add_base_percentage' }
        ],
        onApply: (character) => {
            character.recalculateStats('lion_protection_apply');
            console.log(`[Lion Protection Buff] Applied to ${character.name}`);
        },
        onRemove: (character) => {
            character.recalculateStats('lion_protection_remove');
            console.log(`[Lion Protection Buff] Removed from ${character.name}`);
        }
    };
    
    // Determine if the talent enables stacking
    const abilityData = caster.abilities ? caster.abilities.find(ab => ab.id === 'schoolboy_siegfried_w') : null;
    const isStackable = abilityData && abilityData.stackable && abilityData.stackable.enabled;
    const maxStacks = isStackable && abilityData.stackable.max_stacks ? abilityData.stackable.max_stacks : 1;

    if (isStackable) {
        const existingBuff = caster.buffs.find(b => b.id === 'lion_protection_buff');
        if (existingBuff) {
            // Increment stack count (up to max) and refresh duration, then exit – no duplicate VFX
            existingBuff.currentStacks = (existingBuff.currentStacks || 1);
            if (existingBuff.currentStacks < maxStacks) {
                existingBuff.currentStacks += 1;
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🦁 Lion Protection stacks increased to ${existingBuff.currentStacks}/${maxStacks}.`, 'talent-effect utility');
                }
            }
            // Refresh duration each time
            existingBuff.duration = 3;
            if (typeof existingBuff.remainingTurns === 'number') existingBuff.remainingTurns = 3;

            caster.recalculateStats('lion_protection_stack_inc');
            return; // Skip creating a new buff / VFX
        }
    }
    
    if (isAuto) {
        // Track utility usage for the buff application
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_w', 'utility');
        
        // Show VFX
        showLionProtectionVFX(caster);
        
        // Log the action with talent enhancement info
        const talentText = hasEnhancedLionProtection ? ' (Enhanced)' : '';
        const healPercentText = hasEnhancedLionProtection ? '25%' : '10%';
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `🦁 ${caster.name} uses Lion Protection${talentText}, healing for ${healAmount} HP (${healPercentText} of missing health) and gaining defensive bonuses for 3 turns`
            );
        }
    }
    
    caster.addBuff(lionProtectionBuff);
    
    if (isAuto) {
        // Track utility usage for the buff application
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_w', 'utility');
        
        // Show VFX
        showLionProtectionVFX(caster);
    }
};

const schoolboySiegfriedW = new Ability(
    'schoolboy_siegfried_w',
    'Lion Protection',
    'Icons/abilities/lion_protection.jfif',
    65, // Mana cost
    6,  // Cooldown
    schoolboySiegfriedLionProtectionEffect
).setDescription('Heals for 10% of missing health (scales with Healing Power). Gains 50% bonus Armor and Magical Shield for 3 turns.')
 .setTargetType('self');

// Q: Sword Slash with VFX
const schoolboySiegfriedSwordSlashEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Siegfried Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} performs a Sword Slash against ${target.name}!`);

    // --- Sword Slash VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const slashVfx = document.createElement('div');
        slashVfx.className = 'siegfried-sword-slash-vfx';
        targetElement.appendChild(slashVfx);

        // Remove VFX after animation completes
        setTimeout(() => {
            slashVfx.remove();
        }, 600); // Match animation duration
    }
    // --- End Sword Slash VFX ---

    // Calculate base damage: 100% Physical Damage
    let baseDamage = caster.stats.physicalDamage;
    
    // Check for Empowered Blade talent (40% additional damage scaling)
    const ability = caster.abilities.find(ab => ab.id === 'schoolboy_siegfried_q');
    if (ability && ability.damage_scaling_bonus) {
        const bonusMultiplier = ability.damage_scaling_bonus;
        const bonusDamage = Math.floor(caster.stats.physicalDamage * bonusMultiplier);
        baseDamage += bonusDamage;
        
        if (window.gameManager) {
            window.gameManager.addLogEntry(`⚔️ Empowered Blade increases damage by ${bonusDamage}!`, 'talent-effect damage');
        }
        
        console.log(`[Empowered Blade] Base damage: ${caster.stats.physicalDamage}, Bonus: ${bonusDamage}, Total: ${baseDamage}`);
    }

    // Apply damage to primary target
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'schoolboy_siegfried_q' });
    
    // Track damage statistics
    if (window.trackSwordSlashStats) {
        window.trackSwordSlashStats(caster, target, result);
    }
    
    // NEW: Track total damage for Cleansing Slash heal (includes primary + cleaves)
    let totalDamage = result.damage;

    // Log the damage
    log(`${target.name} takes ${result.damage} physical damage from Sword Slash!${result.isCritical ? ' (Critical Hit!)' : ''}`);

    // After ability is determined, define the healing helper
    const performCleansingSlashHeal = () => {
        if (!ability || !ability.heal_random_ally || !ability.heal_random_ally.enabled) return;
        const healMultiplier = ability.heal_random_ally.heal_multiplier || 0.35;
        const healAmount = Math.floor(totalDamage * healMultiplier);
        if (healAmount <= 0 || !window.gameManager) return;

        const allies = window.gameManager.gameState?.playerCharacters?.filter(ch => !ch.isDead() && ch.id !== caster.id) || [];
        if (allies.length === 0) return;

        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
        const healRes = randomAlly.heal(healAmount, caster, { abilityId: 'cleansing_slash_heal' });
        window.gameManager.addLogEntry(`✨ Cleansing Slash heals ${randomAlly.name} for ${healRes.healAmount} HP!`, 'talent-effect healing');
        updateCharacterUI(randomAlly);
        if (window.statisticsManager) {
            window.statisticsManager.recordHealingDone(caster, randomAlly, healRes.healAmount, false, 'cleansing_slash_heal');
        }
    };

    // Check for Cleaving Blade talent
    console.log(`[Siegfried Q] Checking for cleaving strikes talent on ${caster.name}:`, ability?.cleaving_strikes);
    if (ability && ability.cleaving_strikes && ability.cleaving_strikes.enabled) {
        // Get all enemies except the primary target
        const allEnemies = window.gameManager ? window.gameManager.getAllies(target).filter(enemy => 
            enemy.id !== target.id && 
            enemy.instanceId !== target.instanceId && 
            !enemy.isDead()
        ) : [];

        if (allEnemies.length > 0) {
            // Select random additional targets
            const additionalTargetsCount = Math.min(ability.cleaving_strikes.additional_targets, allEnemies.length);
            const shuffled = [...allEnemies].sort(() => 0.5 - Math.random());
            const additionalTargets = shuffled.slice(0, additionalTargetsCount);

            // Apply cleave damage to additional targets (uses enhanced base damage if Empowered Blade is active)
            const cleaveDamage = Math.floor(baseDamage * ability.cleaving_strikes.damage_multiplier);
            
            additionalTargets.forEach((cleaveTarget, index) => {
                // Add delay for visual effect
                setTimeout(() => {
                    // Cleave VFX
                    const cleaveTargetElement = document.getElementById(`character-${cleaveTarget.instanceId || cleaveTarget.id}`);
                    if (cleaveTargetElement) {
                        const cleaveVfx = document.createElement('div');
                        cleaveVfx.className = 'siegfried-sword-slash-vfx cleave-strike';
                        cleaveTargetElement.appendChild(cleaveVfx);

                        setTimeout(() => {
                            cleaveVfx.remove();
                        }, 600);
                    }

                    // Apply cleave damage
                    const cleaveResult = cleaveTarget.applyDamage(cleaveDamage, 'physical', caster, { 
                        abilityId: 'schoolboy_siegfried_q_cleave' 
                    });

                    // Track cleave damage statistics
                    if (window.trackSwordSlashStats) {
                        window.trackSwordSlashStats(caster, cleaveTarget, cleaveResult, 'cleave');
                    }

                    // Accumulate total damage for Cleansing Slash heal
                    totalDamage += cleaveResult.damage;

                    // Log cleave damage
                    log(`⚔️ ${cleaveTarget.name} takes ${cleaveResult.damage} cleave damage!${cleaveResult.isCritical ? ' (Critical Hit!)' : ''}`);

                    // If this is the final cleave hit, trigger the healing
                    if (index === additionalTargetsCount - 1) {
                        performCleansingSlashHeal();
                    }

                    // Update UI
                    updateCharacterUI(cleaveTarget);
                }, (index + 1) * 200); // Stagger the cleave attacks
            });

            log(`🗡️ Cleaving Blade strikes ${additionalTargets.length} additional ${additionalTargets.length === 1 ? 'enemy' : 'enemies'}!`);

            // Edge-case: If no additional targets were actually hit, still attempt to heal
            if (additionalTargets.length === 0) {
                performCleansingSlashHeal();
            }
        }
    }

    // If Cleaving Blade talent handled healing inside its block, we still need to heal when Cleaving Blade is inactive
    if (!ability.cleaving_strikes || !ability.cleaving_strikes.enabled) {
        performCleansingSlashHeal();
    }

    // Check for Relentless Strikes talent (chance not to end turn)
    if (ability && ability.relentless_chance && Math.random() < ability.relentless_chance) {
        // Prevent turn from ending
        if (window.gameManager && typeof window.gameManager.preventTurnEnd === 'function') {
            window.gameManager.preventTurnEnd(caster);
            log(`⚡ Relentless Strikes! ${caster.name} can act again!`);
            
            // Add visual effect for relentless strike
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                const relentlessVfx = document.createElement('div');
                relentlessVfx.className = 'relentless-strikes-vfx';
                relentlessVfx.textContent = 'RELENTLESS!';
                casterElement.appendChild(relentlessVfx);

                setTimeout(() => {
                    relentlessVfx.remove();
                }, 2000);
            }
        }
    }

    // --- Protective Slash Talent: Extend Lion Protection ---
    if (ability && ability.extend_lion_protection && ability.extend_lion_protection.enabled) {
        const procChance = ability.extend_lion_protection.chance || 0.16;
        if (Math.random() < procChance) {
            const lionBuff = caster.buffs?.find(b => b.id === 'lion_protection_buff');
            if (lionBuff) {
                const extraTurns = ability.extend_lion_protection.duration_increase || 1;
                lionBuff.duration += extraTurns;
                if (typeof lionBuff.remainingTurns === 'number') {
                    lionBuff.remainingTurns += extraTurns;
                }

                log(`🛡️ Protective Slash extends Lion Protection by ${extraTurns} turn!`);
                if (window.gameManager) {
                    window.gameManager.addLogEntry(`🛡️ ${caster.name}'s Sword Slash extends Lion Protection by ${extraTurns} turn!`, 'talent-effect utility');
                }
                // Update UI for buff duration changes
                updateCharacterUI(caster);
            }
        }
    }
    // --- End Protective Slash ---

    // Play sound
    playSound('sounds/siegfrieda1.mp3', 0.8); // Siegfried's voice line for Q

    // --- Relentless Justice Talent: Reduce Judgement cooldown ---
    if (ability && ability.reduce_judgment_cooldown && ability.reduce_judgment_cooldown.enabled) {
        const judgementAbility = caster.abilities.find(a => a.id === 'schoolboy_siegfried_r');
        if (judgementAbility && judgementAbility.currentCooldown > 0) {
            const reductionAmount = ability.reduce_judgment_cooldown.reduction_amount || 1;
            judgementAbility.currentCooldown = Math.max(0, judgementAbility.currentCooldown - reductionAmount);
            
            log(`⚔️ Relentless Justice reduces Judgement cooldown by ${reductionAmount} turn!`);
            if (window.gameManager) {
                window.gameManager.addLogEntry(`⚔️ ${caster.name}'s Sword Slash reduces Judgement cooldown by ${reductionAmount} turn!`, 'talent-effect utility');
            }
            
            // Add visual effect for cooldown reduction
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (casterElement) {
                const cooldownVfx = document.createElement('div');
                cooldownVfx.className = 'relentless-justice-vfx';
                cooldownVfx.textContent = `COOLDOWN -${reductionAmount}`;
                casterElement.appendChild(cooldownVfx);

                setTimeout(() => {
                    cooldownVfx.remove();
                }, 2000);
            }
        }
    }
    // --- End Relentless Justice ---

    // Lion's Resonance auto trigger
    if (window.tryAutoLionProtection) {
        window.tryAutoLionProtection(caster, 'schoolboy_siegfried_q');
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolboySiegfriedQ = new Ability(
    'schoolboy_siegfried_q',
    'Sword Slash',
    'Icons/abilities/sword_slash.jfif',
    15, // Mana cost
    0,  // Cooldown
    schoolboySiegfriedSwordSlashEffect
).setDescription('Deals 100% Physical Damage.')
 .setTargetType('enemy');

// Override generateDescription to include talent effects
schoolboySiegfriedQ.generateDescription = function() {
    // Base damage - check for Empowered Blade talent to override base scaling
    let baseDesc;
    if (this.damage_scaling_bonus && this.damage_scaling_bonus > 0) {
        const bonusPercent = Math.round(this.damage_scaling_bonus * 100);
        const totalPercent = 100 + bonusPercent;
        baseDesc = `Deals <span style="color: #ff6b6b;">${totalPercent}% Physical Damage</span>.`;
        baseDesc += `<br><span class="talent-effect damage">⚔️ Empowered Blade: +${bonusPercent}% additional damage.</span>`;
        console.log(`[Siegfried Q] Added empowered blade with total scaling: ${totalPercent}%`);
    } else {
        baseDesc = 'Deals <span style="color: #ff6b6b;">100% Physical Damage</span>.';
    }
    
    console.log(`[Siegfried Q] Generating description, cleaving_strikes:`, this.cleaving_strikes, 'relentless_chance:', this.relentless_chance);
    if (this.cleaving_strikes && this.cleaving_strikes.enabled) {
        const damagePercent = Math.round(this.cleaving_strikes.damage_multiplier * 100);
        baseDesc += `<br><span class="talent-effect damage">🗡️ Cleaving Blade: Also deals ${damagePercent}% damage to ${this.cleaving_strikes.additional_targets} additional random enemies.</span>`;
        console.log(`[Siegfried Q] Added cleaving blade description`);
    }
    
    if (this.relentless_chance && this.relentless_chance > 0) {
        const chancePercent = Math.round(this.relentless_chance * 100);
        baseDesc += `<br><span class="talent-effect utility">⚡ Relentless Strikes: ${chancePercent}% chance not to end your turn.</span>`;
        console.log(`[Siegfried Q] Added relentless strikes description`);
    }
    
    // Within ability.description update for 'schoolboy_siegfried_q'
    if (this.heal_random_ally && this.heal_random_ally.enabled) {
        const healPercent = Math.round((this.heal_random_ally.heal_multiplier || 0.35) * 100);
        baseDesc += `<br><span class="talent-effect healing">✨ Cleansing Slash: Heals a random ally for ${healPercent}% of damage dealt.</span>`;
    }
    
    // Protective Slash talent description
    if (this.extend_lion_protection && this.extend_lion_protection.enabled) {
        const chancePercent = Math.round((this.extend_lion_protection.chance || 0.16) * 100);
        baseDesc += `<br><span class="talent-effect utility">🛡️ Protective Slash: ${chancePercent}% chance to extend Lion Protection duration by 1 turn.</span>`;
    }
    
    // Relentless Justice talent description
    if (this.reduce_judgment_cooldown && this.reduce_judgment_cooldown.enabled) {
        const reductionAmount = this.reduce_judgment_cooldown.reduction_amount || 1;
        baseDesc += `<br><span class="talent-effect utility">⚔️ Relentless Justice: Each hit reduces Judgement cooldown by ${reductionAmount} turn.</span>`;
    }
    
    // Update the description property immediately
    this.description = baseDesc;
    console.log(`[Siegfried Q] Updated description property: ${this.description}`);
    
    return baseDesc;
};

// Re-register abilities including Q and W abilities
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolboySiegfriedQ,
        schoolboySiegfriedW
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_q = schoolboySiegfriedQ;
    window.definedAbilities.schoolboy_siegfried_w = schoolboySiegfriedW;
}

// E: Sword Blessing
const siegfriedSwordBlessingEffect = (caster, target) => {
    console.log(`[Siegfried] Sword Blessing cast by ${caster.name}`);
    
    try {
        // Check for Enduring Mastery talent
        let duration = 6;
        
        if (caster.passive && caster.passive.buffDurationBonus > 0) {
            duration += caster.passive.buffDurationBonus;
        }
        
        // Create first buff: Blessed Lifesteal
        const blessedLifestealBuff = {
            id: 'blessed_lifesteal_buff',
            name: 'Blessed Lifesteal',
            description: `Grants 15% Lifesteal for ${duration} turns.`,
            icon: 'Icons/abilities/sword_blessing.jfif',
            duration: duration,
            effects: {
                lifesteal: 0.15
            },
            onApply: (character) => {
                character.recalculateStats('blessed_lifesteal_applied');
                console.log(`[Siegfried] Blessed Lifesteal buff applied to ${character.name} for ${duration} turns`);
            },
            onRemove: (character) => {
                character.recalculateStats('blessed_lifesteal_removed');
                console.log(`[Siegfried] Blessed Lifesteal buff removed from ${character.name}`);
            }
        };
        
        // Create second buff: Blessed Damage
        const blessedDamageBuff = {
            id: 'blessed_damage_buff',
            name: 'Blessed Damage',
            description: `Grants 200 Physical Damage for ${duration} turns.`,
            icon: 'Icons/abilities/sword_blessing.jfif',
            duration: duration,
            effects: {
                physicalDamage: 200
            },
            onApply: (character) => {
                character.recalculateStats('blessed_damage_applied');
                console.log(`[Siegfried] Blessed Damage buff applied to ${character.name} for ${duration} turns`);
            },
            onRemove: (character) => {
                character.recalculateStats('blessed_damage_removed');
                console.log(`[Siegfried] Blessed Damage buff removed from ${character.name}`);
            }
        };
        
        // Apply both buffs (this will trigger talent effects for each buff)
        caster.addBuff(blessedLifestealBuff);
        caster.addBuff(blessedDamageBuff);
        
        // Check for Critical Blessing talent
        const ability = caster.abilities.find(ab => ab.id === 'schoolboy_siegfried_e');
        if (ability && ability.critical_blessing && ability.critical_blessing.enabled) {
            const critChanceBonus = ability.critical_blessing.crit_chance_bonus || 0.20;
            const critDuration = ability.critical_blessing.duration || 6;
            
            // Apply Enduring Mastery to the crit buff as well
            let finalCritDuration = critDuration;
            if (caster.passive && caster.passive.buffDurationBonus > 0) {
                finalCritDuration += caster.passive.buffDurationBonus;
            }
            
            // Create third buff: Blessed Focus (Crit Chance)
            const blessedFocusBuff = {
                id: 'blessed_focus_buff',
                name: 'Blessed Focus',
                description: `Grants ${Math.round(critChanceBonus * 100)}% Critical Strike Chance for ${finalCritDuration} turns.`,
                icon: 'Icons/talents/critical.png',
                duration: finalCritDuration,
                statModifiers: [
                    { stat: 'critChance', value: critChanceBonus, operation: 'add' }
                ],
                onApply: (character) => {
                    character.recalculateStats('blessed_focus_applied');
                    console.log(`[Siegfried] Blessed Focus buff applied to ${character.name} for ${finalCritDuration} turns - Crit Chance +${Math.round(critChanceBonus * 100)}%`);
                },
                onRemove: (character) => {
                    character.recalculateStats('blessed_focus_removed');
                    console.log(`[Siegfried] Blessed Focus buff removed from ${character.name}`);
                }
            };
            
            caster.addBuff(blessedFocusBuff);
            
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`✨ Critical Blessing grants Blessed Focus (+${Math.round(critChanceBonus * 100)}% Crit Chance)!`, 'talent-effect utility');
            }
        }

        // Check for Shared Blessing talent
        if (ability && ability.shared_blessing && ability.shared_blessing.enabled) {
            performSharedBlessing(caster, blessedLifestealBuff, blessedDamageBuff, duration);
        }
        
        // Track utility usage
        trackSiegfriedAbilityUsage(caster, 'schoolboy_siegfried_e', 'utility');
        
        // Show VFX
        showSwordBlessingVFX(caster);
        
        // Add battle log entry
        if (window.gameManager && window.gameManager.addLogEntry) {
            let logMessage = `⚔️ ${caster.name} blesses his sword, gaining lifesteal and damage bonuses`;
            if (duration > 6) {
                logMessage += ` (extended duration)`;
            }
            if (ability && ability.critical_blessing && ability.critical_blessing.enabled) {
                logMessage += ` and critical focus`;
            }
            window.gameManager.addLogEntry(logMessage, 'system');
        }
        
    } catch (error) {
        console.error('[Siegfried] Error in Sword Blessing effect:', error);
    }

    // Lion's Resonance auto trigger
    if (window.tryAutoLionProtection) {
        window.tryAutoLionProtection(caster, 'schoolboy_siegfried_e');
    }

    // Update UI
    updateCharacterUI(caster);
};

// Shared Blessing talent function
const performSharedBlessing = (caster, lifestealBuff, damageBuff, duration) => {
    try {
        // Get all allies (excluding caster)
        const allies = window.gameManager ? window.gameManager.getAllies(caster).filter(ally => ally.id !== caster.id) : [];
        
        if (allies.length === 0) {
            console.log(`[Siegfried] Shared Blessing: No allies available to share blessing with`);
            return;
        }
        
        // Pick a random ally
        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
        
        // Pick a random buff (lifesteal or damage)
        const availableBuffs = [
            {
                type: 'lifesteal',
                buff: {
                    id: 'shared_blessed_lifesteal_buff',
                    name: 'Shared Blessed Lifesteal',
                    description: `Grants 15% Lifesteal for ${duration} turns (shared from ${caster.name}).`,
                    icon: 'Icons/abilities/sword_blessing.jfif',
                    duration: duration,
                    statModifiers: [
                        { stat: 'lifesteal', value: 0.15, operation: 'add' }
                    ],
                    onApply: (character) => {
                        character.recalculateStats('shared_blessed_lifesteal_applied');
                        console.log(`[Siegfried] Shared Blessed Lifesteal buff applied to ${character.name} for ${duration} turns`);
                    },
                    onRemove: (character) => {
                        character.recalculateStats('shared_blessed_lifesteal_removed');
                        console.log(`[Siegfried] Shared Blessed Lifesteal buff removed from ${character.name}`);
                    }
                }
            },
            {
                type: 'damage',
                buff: {
                    id: 'shared_blessed_damage_buff',
                    name: 'Shared Blessed Damage',
                    description: `Grants 200 Physical Damage for ${duration} turns (shared from ${caster.name}).`,
                    icon: 'Icons/abilities/sword_blessing.jfif',
                    duration: duration,
                    statModifiers: [
                        { stat: 'physicalDamage', value: 200, operation: 'add' }
                    ],
                    onApply: (character) => {
                        character.recalculateStats('shared_blessed_damage_applied');
                        console.log(`[Siegfried] Shared Blessed Damage buff applied to ${character.name} for ${duration} turns`);
                    },
                    onRemove: (character) => {
                        character.recalculateStats('shared_blessed_damage_removed');
                        console.log(`[Siegfried] Shared Blessed Damage buff removed from ${character.name}`);
                    }
                }
            }
        ];
        
        const randomBuffChoice = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
        
        // Apply the random buff to the random ally
        randomAlly.addBuff(randomBuffChoice.buff);
        
        // Show VFX for shared blessing
        showSharedBlessingVFX(caster, randomAlly);
        
        // Add battle log entry
        if (window.gameManager && window.gameManager.addLogEntry) {
            const buffName = randomBuffChoice.type === 'lifesteal' ? 'Lifesteal' : 'Damage';
            window.gameManager.addLogEntry(`🤝 Shared Blessing: ${randomAlly.name} receives Blessed ${buffName} from ${caster.name}!`, 'talent-effect utility');
        }
        
        // Track shared blessing usage
        trackSiegfriedAbilityUsage(caster, 'shared_blessing', 'utility');
        
    } catch (error) {
        console.error('[Siegfried] Error in Shared Blessing:', error);
    }
};

const siegfriedE = new Ability(
    'schoolboy_siegfried_e', // Ability ID
    'Sword Blessing',        // Ability Name
    'Icons/abilities/sword_blessing.jfif', // Placeholder icon
    100, // Mana cost
    9,  // Cooldown
    siegfriedSwordBlessingEffect
).setDescription('Siegfried blesses his sword, applying two separate buffs: Blessed Lifesteal (15% Lifesteal) and Blessed Damage (200 Physical Damage) for 6 turns each.')
 .setTargetType('self'); // Target is self

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Assuming Siegfried's Q ability might be defined elsewhere or needs to be added here too.
    // For now, just registering the E ability.
    AbilityFactory.registerAbilities([
        siegfriedE
        // Add other Siegfried abilities here if defined in this file
    ]);
} else {
    console.warn("Siegfried E ability defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_e = siegfriedE;
}

// R: Judgement
const schoolboySiegfriedJudgementEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const gameManager = window.gameManager; // Get reference for finding allies

    if (!target) {
        log("Siegfried R: No target selected!", "error");
        return;
    }

    // --- NEW: Use instanceId for target logging if available ---
    const targetName = target.name || (target.instanceId || target.id);
    log(`${caster.name} calls upon Judgement against ${targetName}!`);
    // --- END NEW ---

    // --- Judgement VFX Start ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    // --- NEW: Use instanceId for target element ---
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    // --- END NEW ---
    const battleContainer = document.querySelector('.battle-container');

    // 1. Earthquake effect
    if (battleContainer) {
        battleContainer.classList.add('earthquake-animation');
        setTimeout(() => battleContainer.classList.remove('earthquake-animation'), 1200); // Duration of earthquake
    }

    // 2. Caster Animation (Optional: Add if a specific casting pose is desired)
    if (casterElement) {
        casterElement.classList.add('siegfried-judgement-cast');
        setTimeout(() => casterElement.classList.remove('siegfried-judgement-cast'), 1000);
    }

    // 3. Impact VFX on Target
    if (targetElement) {
        // Delay impact slightly to sync with potential caster animation/sound
        setTimeout(() => {
            const impactVfx = document.createElement('div');
            impactVfx.className = 'judgement-impact-vfx';
            // You can add inner elements for more complex visuals
            impactVfx.innerHTML = `
                <div class="judgement-light-beam"></div>
                <div class="judgement-shatter-effect"></div>
            `;
            targetElement.appendChild(impactVfx);

            // Play impact sound
            playSound('sounds/judgement_impact.mp3', 0.9); // Placeholder sound

            // Remove armor piercing text
            /*
            const armorBreakText = document.createElement('div');
            armorBreakText.className = 'armor-break-text siegfried-judgement-pierce'; // Specific class
            armorBreakText.textContent = 'ARMOR IGNORED!';
            targetElement.appendChild(armorBreakText);
            */

            setTimeout(() => {
                 impactVfx.remove();
                 // armorBreakText.remove(); // Removed text element
            }, 1500); // Duration of impact VFX
        }, 500); // Delay before impact hits
    }
    // --- Judgement VFX End ---

    // Calculate base damage: 285% AD with potential Divine Judgment talent bonus
    let damageMultiplier = 2.85; // Base multiplier
    
    // Check for Divine Judgment talent (75% additional damage scaling)
    const ability = caster.abilities.find(ab => ab.id === 'schoolboy_siegfried_r');
    if (ability && ability.damage_scaling_bonus) {
        damageMultiplier += ability.damage_scaling_bonus;
        
        if (window.gameManager) {
            const bonusPercent = Math.round(ability.damage_scaling_bonus * 100);
            window.gameManager.addLogEntry(`⚡ Divine Judgment enhances damage by ${bonusPercent}%!`, 'talent-effect damage');
        }
        
        console.log(`[Divine Judgment] Base multiplier: ${2.85}, Bonus: ${ability.damage_scaling_bonus}, Total: ${damageMultiplier}`);
    }
    
    const baseDamage = Math.floor(caster.stats.physicalDamage * damageMultiplier);

    // Remove armor ignore logic
    // const originalArmor = target.stats.armor;
    // target.stats.armor = 0;
    // log(`${caster.name}'s Judgement ignores armor! (Original: ${originalArmor})`);

    // --- REFACTORED: Use applyDamage ---
    // Pass caster as the third argument to correctly handle crits/lifesteal source
    // applyDamage now handles the actual damage calculation (incl. crit) and standard VFX
    const result = target.applyDamage(baseDamage, 'physical', caster, { abilityId: 'schoolboy_siegfried_r' });
    // --- END REFACTOR ---

    // Remove armor restore logic
    // target.stats.armor = originalArmor;

    // --- Adjusted Logging: Use result.damage and check isCritical ---
    log(`${targetName} takes ${result.damage} physical damage from Judgement!${result.isCritical ? ' (Critical Hit!)' : ''}`);
    // --- END Adjusted Logging ---


    // Apply lifesteal from caster's stats first (applyLifesteal likely needs the damage dealt)
    const lifestealHeal = caster.applyLifesteal(result.damage);
    if (lifestealHeal > 0) {
         log(`${caster.name} healed for ${lifestealHeal} from innate lifesteal.`);
    }

    // Apply Judgement's heal if damage was dealt
    if (result.damage > 0) {
        const healAmount = result.damage; // Heal based on actual damage dealt

        // Heal caster
        const casterHealResult = caster.heal(healAmount, caster, { abilityId: 'schoolboy_siegfried_r_self_heal' });
        log(`${caster.name} is healed by Judgement for ${casterHealResult.healAmount} HP.`);
        // Add caster heal VFX
        if (casterElement) {
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx judgement-heal-vfx';
            healVfx.textContent = `+${casterHealResult.healAmount}`;
            casterElement.appendChild(healVfx);
            setTimeout(() => healVfx.remove(), 1200);
        }

        // Find a random living ally (player character, not the caster)
        let randomAlly = null;
        if (gameManager && gameManager.gameState && gameManager.gameState.playerCharacters) {
            const potentialAllies = gameManager.gameState.playerCharacters.filter(ally =>
                ally.id !== caster.id && !ally.isDead()
            );

            if (potentialAllies.length > 0) {
                const randomIndex = Math.floor(Math.random() * potentialAllies.length);
                randomAlly = potentialAllies[randomIndex];
            }
        }

        // Heal random ally if found
        if (randomAlly) {
            const allyHealResult = randomAlly.heal(healAmount, caster, { abilityId: 'schoolboy_siegfried_r_ally_heal' });
            // --- NEW: Use ally instanceId if available ---
            const allyName = randomAlly.name || (randomAlly.instanceId || randomAlly.id);
            log(`${allyName} is healed by Judgement for ${allyHealResult.healAmount} HP.`);
            // Add ally heal VFX
            const allyElementId = randomAlly.instanceId || randomAlly.id;
            const allyElement = document.getElementById(`character-${allyElementId}`);
            // --- END NEW ---
            if (allyElement) {
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx judgement-heal-vfx'; // Use same style
                healVfx.textContent = `+${allyHealResult.healAmount}`;
                allyElement.appendChild(healVfx);
                setTimeout(() => healVfx.remove(), 1200);
                updateCharacterUI(randomAlly); // Update ally UI
            }
        } else {
            log("No other living allies found to receive Judgement's heal.");
        }

        // Track comprehensive statistics for Judgement ability
        if (window.trackJudgementStats) {
            const allyHealAmount = randomAlly ? allyHealResult.healAmount : 0;
            window.trackJudgementStats(caster, target, result, casterHealResult.healAmount, allyHealAmount, randomAlly);
        }
    }

    // Play sound
    playSound('sounds/siegfrieda4.mp3', 0.8); // Siegfried's voice line for R (placeholder)

    // Lion's Resonance auto trigger
    if (window.tryAutoLionProtection) {
        window.tryAutoLionProtection(caster, 'schoolboy_siegfried_r');
    }

    // Update UI for caster and target
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolboySiegfriedR = new Ability(
    'schoolboy_siegfried_r', // Ability ID
    'Judgement',             // Ability Name
    'Icons/abilities/judgement.jfif', // Placeholder icon
    100, // Mana cost
    15,  // Cooldown
    schoolboySiegfriedJudgementEffect
).setDescription('Deals 285% AD physical damage. If damage is dealt, Siegfried and a random ally are healed for the damage amount (scales with Healing Power).') // Updated description
 .setTargetType('enemy'); // Target is enemy

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Registering Q, W, E, and R abilities.
    AbilityFactory.registerAbilities([
        schoolboySiegfriedQ,  // Add Q ability here
        schoolboySiegfriedW,
        siegfriedE,
        schoolboySiegfriedR
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_q = schoolboySiegfriedQ; // Add Q ability here
    window.definedAbilities.schoolboy_siegfried_w = schoolboySiegfriedW;
    window.definedAbilities.schoolboy_siegfried_e = siegfriedE;
    window.definedAbilities.schoolboy_siegfried_r = schoolboySiegfriedR;
}

// VFX function for Lion Protection (prevents duplicate shields)
const showLionProtectionVFX = (caster) => {
    const casterElement = document.querySelector(`[data-instance-id="${caster.instanceId}"]`);
    if (!casterElement) return;

    // If a shield already exists, just pulse it
    const existing = document.getElementById(`lion-shield-${caster.instanceId || caster.id}`);
    if (existing) {
        existing.classList.remove('lion-shield-pulse');
        void existing.offsetWidth; // restart animation
        existing.classList.add('lion-shield-pulse');
        return;
    }

    // Create main shield container
    const shieldVfx = document.createElement('div');
    shieldVfx.className = 'lion-protection-shield-vfx';
    shieldVfx.id = `lion-shield-${caster.instanceId || caster.id}`;

    // Layers for visual effect
    const shieldCore = document.createElement('div');
    shieldCore.className = 'lion-shield-core';

    const shieldRings = document.createElement('div');
    shieldRings.className = 'lion-shield-rings';

    const lionSymbol = document.createElement('div');
    lionSymbol.className = 'lion-shield-symbol';

    const shieldParticles = document.createElement('div');
    shieldParticles.className = 'lion-shield-particles';

    // Assemble
    shieldVfx.appendChild(shieldCore);
    shieldVfx.appendChild(shieldRings);
    shieldVfx.appendChild(lionSymbol);
    shieldVfx.appendChild(shieldParticles);

    casterElement.appendChild(shieldVfx);

    // Play sound if available
    if (window.gameManager && window.gameManager.playSound) {
        window.gameManager.playSound('sounds/lion_protection_activate.mp3', 0.7);
    }
};

// VFX function for Sword Blessing
const showSwordBlessingVFX = (caster) => {
    const casterElement = document.querySelector(`[data-instance-id="${caster.instanceId}"]`);
    if (!casterElement) return;
    
    const swordBlessingVfx = document.createElement('div');
    swordBlessingVfx.className = 'sword-blessing-vfx';
    
    // Add inner elements for more complex visuals
    const swordGlow = document.createElement('div');
    swordGlow.className = 'sword-glow';
    
    const powerAura = document.createElement('div');
    powerAura.className = 'power-aura';
    
    swordBlessingVfx.appendChild(swordGlow);
    swordBlessingVfx.appendChild(powerAura);
    
    casterElement.appendChild(swordBlessingVfx);
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (swordBlessingVfx.parentNode) {
            swordBlessingVfx.remove();
        }
    }, 1500);
    
    // Play sound if available
    if (window.gameManager && window.gameManager.playSound) {
        window.gameManager.playSound('sounds/siegfrieda3.mp3', 0.8);
    }
};

// VFX function for Shared Blessing
const showSharedBlessingVFX = (caster, ally) => {
    const casterElement = document.querySelector(`[data-instance-id="${caster.instanceId}"]`);
    const allyElement = document.querySelector(`[data-instance-id="${ally.instanceId}"]`);
    
    if (!casterElement || !allyElement) return;

    // Create energy beam from caster to ally
    const battleContainer = document.querySelector('.battle-container');
    if (!battleContainer) return;

    const beam = document.createElement('div');
    beam.className = 'shared-blessing-beam';
    
    // Calculate positions
    const casterRect = casterElement.getBoundingClientRect();
    const allyRect = allyElement.getBoundingClientRect();
    const containerRect = battleContainer.getBoundingClientRect();
    
    const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
    const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
    const endX = allyRect.left + allyRect.width / 2 - containerRect.left;
    const endY = allyRect.top + allyRect.height / 2 - containerRect.top;
    
    const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    beam.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${length}px;
        height: 4px;
        background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
        transform: rotate(${angle}deg);
        transform-origin: 0 50%;
        box-shadow: 0 0 10px #FFD700, 0 0 20px #FFA500;
        animation: shared-blessing-beam 1s ease-out forwards;
        z-index: 100;
    `;
    
    battleContainer.appendChild(beam);
    
    // Create blessing particles on ally
    const allyVFX = document.createElement('div');
    allyVFX.className = 'shared-blessing-impact';
    allyVFX.innerHTML = `
        <div class="blessing-particles"></div>
        <div class="blessing-glow"></div>
    `;
    allyElement.appendChild(allyVFX);
    
    // Remove VFX after animation
    setTimeout(() => {
        if (beam && beam.parentNode) {
            beam.parentNode.removeChild(beam);
        }
        if (allyVFX && allyVFX.parentNode) {
            allyVFX.parentNode.removeChild(allyVFX);
        }
    }, 1500);
};

// Function to update ability descriptions based on talents
const updateSiegfriedAbilityDescriptions = (character) => {
    // Helper to highlight numeric values consistently
    const highlight = (value, color = '#FFD700') => `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
    if (!character || !character.abilities) {
        console.log('[Siegfried] updateSiegfriedAbilityDescriptions: No character or abilities');
        return;
    }
    
    // Prevent infinite loops by checking if we're already updating
    if (character._updatingDescriptions) {
        console.log('[Siegfried] Already updating descriptions, skipping to prevent infinite loop');
        return;
    }
    
    character._updatingDescriptions = true;
    
    console.log(`[Siegfried] Updating ability descriptions for ${character.name}`);
    console.log(`[Siegfried] Passive state:`, character.passive);
    
    let descriptionsChanged = false;
    
            character.abilities.forEach((ability, index) => {
        if (!ability) return;
        
        // Store original description if not already stored
        if (!ability.baseDescription) {
            ability.baseDescription = ability.description;
        }
        
        let updatedDescription = ability.baseDescription;
        let hasModifications = false;
        
        // Check for Mana Efficiency talent (applies to all abilities)
        const hasManaCostReduction = character.manaCostReduction > 0;
        if (hasManaCostReduction) {
            const reductionPercent = Math.round(character.manaCostReduction * 100);
            // Show actual mana cost reduction in description
            if (!updatedDescription.includes('Mana Efficiency')) {
                const originalCost = ability.baseManaCost || ability.manaCost;
                const reducedCost = ability.manaCost;
                updatedDescription += `<br><span class="talent-effect resource">🔮 Mana Efficiency: ${reductionPercent}% reduced mana cost (${originalCost} → ${reducedCost})</span>`;
                hasModifications = true;
            }
        }
        
        // Check for Purifying Resolve talent (global passive effect)
        const hasPurifyingResolve = character.purifyingResolveChance > 0;
        if (hasPurifyingResolve && ability.id === 'schoolboy_siegfried_q') { // Only show on first ability to avoid clutter
            const resolvePercent = Math.round(character.purifyingResolveChance * 100);
            if (!updatedDescription.includes('Purifying Resolve')) {
                updatedDescription += `<br><span class="talent-effect purifying-resolve">✨ Purifying Resolve: ${highlight(resolvePercent + '%', '#FFD700')} chance to remove all debuffs at turn start</span>`;
                hasModifications = true;
            }
        }
        
        console.log(`[Siegfried] Processing ability: ${ability.id} - ${ability.name}`);
        
        // Update Sword Slash description (Q)
        if (ability.id === 'schoolboy_siegfried_q') {
            // Base description with proper scaling
            let baseScaling = '100%';
            
            // Check for Empowered Blade talent - this should override the base description
            if (character.hasTalent && character.hasTalent('empowered_blade')) {
                const bonusPercent = ability.damage_scaling_bonus ? Math.round(ability.damage_scaling_bonus * 100) : 40;
                const totalScaling = 100 + bonusPercent;
                updatedDescription = `Deals <span style="color: #ff6b6b;">${highlight(totalScaling + '%', '#FFD700')} Physical Damage</span>.`;
                updatedDescription += ` <span class="talent-effect damage">⚔️ Empowered Blade: +${highlight(bonusPercent + '%', '#FFD700')} additional damage</span>`;
                hasModifications = true;
            }
            
            // Check for Cleaving Blade talent
            if (character.hasTalent && character.hasTalent('cleaving_blade')) {
                updatedDescription += ` <span class="talent-effect damage">⚔️ Cleaving Blade: Hits 2 additional enemies for ${highlight('25%', '#FFD700')} damage</span>`;
                hasModifications = true;
            }
            
            // Check for Relentless Strikes talent
            if (character.hasTalent && character.hasTalent('relentless_strikes')) {
                updatedDescription += ` <span class="talent-effect utility">🔄 Relentless Strikes: ${highlight('12%', '#FFD700')} chance to not end turn</span>`;
                hasModifications = true;
            }
        }
        
        // Update Lion Protection description (W)
        if (ability.id === 'schoolboy_siegfried_w') {
            // Check for Enhanced Lion Protection talent using multiple methods
            let hasEnhancedLionProtection = false;
            
            // Method 1: Check hasTalent function
            if (character.hasTalent && character.hasTalent('enhanced_lion_protection')) {
                hasEnhancedLionProtection = true;
                console.log(`[Siegfried] Enhanced Lion Protection detected via hasTalent()`);
            }
            
            // Method 2: Check appliedTalents array
            if (character.appliedTalents && character.appliedTalents.includes('enhanced_lion_protection')) {
                hasEnhancedLionProtection = true;
                console.log(`[Siegfried] Enhanced Lion Protection detected via appliedTalents array`);
            }
            
            // Method 3: Check if cooldown is already 8 (indicating talent was applied)
            if (ability.cooldown === 8) {
                hasEnhancedLionProtection = true;
                console.log(`[Siegfried] Enhanced Lion Protection detected via cooldown value (8)`);
            }
            
            console.log(`[Siegfried] Enhanced Lion Protection status: ${hasEnhancedLionProtection}`);
            console.log(`[Siegfried] Character appliedTalents:`, character.appliedTalents);
            console.log(`[Siegfried] Current ability cooldown:`, ability.cooldown);
            
            const healingPercentage = hasEnhancedLionProtection ? '25%' : '10%';
            
            const healingPctText = highlight(healingPercentage, '#FFD700');
            const armorBonusText = highlight('50%', '#FFD700');

            let description = `Heals for ${healingPctText} of missing health (scales with Healing Power). Gains ${armorBonusText} bonus Armor and Magical Shield for 3 turns.`;
            
            // NEW TALENT: Swift Protection (doesNotEndTurn)
            const hasSwiftProtection = (character.hasTalent && character.hasTalent('swift_protection')) || ability.doesNotEndTurn === true;
            if (hasSwiftProtection) {
                description += ' <span class="talent-effect utility">⚡ Swift Protection: Does not end your turn</span>';
                hasModifications = true;
            }
            
            if (hasEnhancedLionProtection) {
                description += ' <span class="talent-effect healing">🌟 Enhanced healing (+15% missing health)</span>';
                description += ' <span class="talent-effect cooldown-increase">⏰ Increased cooldown (+2 turns)</span>';
                
                // Update the actual cooldown value
                if (ability.cooldown !== 8) {
                    ability.cooldown = 8;
                    console.log(`[Enhanced Lion Protection] Updated cooldown to 8 turns`);
                }
                
                hasModifications = true;
            } else {
                // Reset cooldown if talent is not present
                if (ability.cooldown !== 6) {
                    ability.cooldown = 6;
                    console.log(`[Lion Protection] Reset cooldown to 6 turns`);
                }
            }
            
            // NEW TALENT: Lion's Resonance (stackable Lion Protection)
            const hasLionResonance = character.hasTalent && character.hasTalent('lion_protection_resonance');
            if (hasLionResonance) {
                description += ` <span class="talent-effect utility">🦁 Lion's Resonance: Can stack up to 3 times and each ability has 20% chance to grant a stack.</span>`;
                hasModifications = true;
            }
            
            updatedDescription = description;
            console.log(`[Siegfried] Lion Protection final description: ${updatedDescription}`);
        }
        
        // Update Sword Blessing description (E)
        if (ability.id === 'schoolboy_siegfried_e') {
            let description = 'Siegfried blesses his sword, applying two separate buffs: Blessed Lifesteal (15% Lifesteal) and Blessed Damage (200 Physical Damage) for 6 turns each.';
            
            // Check for Critical Blessing talent
            if (character.hasTalent && character.hasTalent('critical_blessing')) {
                const critPercent = ability.critical_blessing?.crit_chance_bonus ? Math.round(ability.critical_blessing.crit_chance_bonus * 100) : 20;
                description += ` <span class="talent-effect utility">✨ Critical Blessing: Also applies Blessed Focus (+${highlight(critPercent + '%', '#FFD700')} Crit Chance) for 6 turns</span>`;
                hasModifications = true;
            }
            
            // NEW TALENT: Swift Protection
            const hasSwiftProtection = (character.hasTalent && character.hasTalent('swift_protection')) || ability.doesNotEndTurn === true;
            if (hasSwiftProtection) {
                description += ' <span class="talent-effect utility">⚡ Swift Protection: Does not end your turn</span>';
                hasModifications = true;
            }
            updatedDescription = description;
        }
        
        // Update Judgement description (R) 
        if (ability.id === 'schoolboy_siegfried_r') {
            // Base damage scaling with potential Divine Judgment enhancement
            let damagePercent = '285%';
            let baseDescription = `Deals ${highlight(damagePercent, '#FFD700')} AD physical damage. If damage is dealt, Siegfried and a random ally are healed for the damage amount (scales with Healing Power).`;
            
            // Check for Divine Judgment talent (75% additional damage scaling)
            if (character.hasTalent && character.hasTalent('judgment_enhancement')) {
                const bonusPercent = ability.damage_scaling_bonus ? Math.round(ability.damage_scaling_bonus * 100) : 75;
                const totalPercent = 285 + bonusPercent;
                baseDescription = `Deals ${highlight(totalPercent + '%', '#FFD700')} AD physical damage. If damage is dealt, Siegfried and a random ally are healed for the damage amount (scales with Healing Power).`;
                baseDescription += ` <span class="talent-effect damage">⚡ Divine Judgment: +${highlight(bonusPercent + '%', '#FFD700')} additional damage scaling</span>`;
                hasModifications = true;
            }
            
            updatedDescription = baseDescription;
            
            // Check for Judgement Mastery (cooldown reduction)
            const hasJudgementMastery = (character.hasTalent && character.hasTalent('judgement_mastery')) || ability.cooldown <= 10;
            if (hasJudgementMastery) {
                updatedDescription += ' <span class="talent-effect utility">⏱️ Judgement Mastery: Cooldown reduced by 5 turns</span>';
                hasModifications = true;
            }
        }
        
        // NEW TALENT: Cleansing Slash
        if (character.hasTalent && character.hasTalent('cleansing_slash')) {
            const pct = Math.round((ability.heal_random_ally?.heal_multiplier || 0.35) * 100);
            updatedDescription += ` <span class="talent-effect healing">✨ Cleansing Slash: Heals a random ally for ${pct}% of damage dealt</span>`;
            hasModifications = true;
        }
        
        // Protective Slash talent
        if (character.hasTalent && character.hasTalent('protective_slash')) {
            updatedDescription += ` <span class="talent-effect utility">🛡️ Protective Slash: ${highlight('16%', '#FFD700')} chance to extend Lion Protection duration by 1 turn</span>`;
            hasModifications = true;
        }
        
        // Add mana cost reduction to final description if talent is active
        if (hasManaCostReduction) {
            const reductionPercent = Math.round(character.manaCostReduction * 100);
            const originalCost = ability.baseManaCost || ability.manaCost;
            const reducedCost = ability.manaCost;
            if (!updatedDescription.includes('Mana Efficiency')) {
                updatedDescription += `<br><span class="talent-effect resource">🔮 Mana Efficiency: ${reductionPercent}% reduced mana cost (${originalCost} → ${reducedCost})</span>`;
                hasModifications = true;
            }
        }
        
        // Apply the updated description only if it's different
        const oldDescription = ability.description;
        if (oldDescription !== updatedDescription) {
            // Persist the modified description both as the current and base description so
            // later generic generateDescription() calls do NOT overwrite the talent text.
            ability.baseDescription = updatedDescription;
            ability.description = updatedDescription;
            descriptionsChanged = true;

            if (hasModifications) {
                console.log(`[Siegfried] Updated ${ability.name} description:`);
                console.log(`Old: ${oldDescription}`);
                console.log(`New: ${updatedDescription}`);
            }
        }
    });
    
    // Only update UI if descriptions actually changed
    if (descriptionsChanged) {
        console.log(`[Siegfried] Descriptions changed, scheduling UI update`);
        
        // Use setTimeout to break the call stack and prevent infinite loops
        setTimeout(() => {
            if (window.gameManager && window.gameManager.uiManager) {
                try {
                    window.gameManager.uiManager.updateCharacterUI(character);
                    console.log(`[Siegfried] UI updated after description changes`);
                } catch (error) {
                    console.error(`[Siegfried] Error updating UI:`, error);
                }
            }
        }, 10);
    } else {
        console.log(`[Siegfried] No description changes detected`);
    }
    
    // Clear the flag after a short delay
    setTimeout(() => {
        character._updatingDescriptions = false;
    }, 100);
};

// Export the update function for external use
if (typeof window !== 'undefined') {
    window.updateSiegfriedAbilityDescriptions = updateSiegfriedAbilityDescriptions;
    
    // Listen for talent application events
    document.addEventListener('talentsApplied', (event) => {
        const character = event.detail?.character;
        if (character && character.id === 'schoolboy_siegfried') {
            console.log('[Siegfried] Talents applied event detected, updating ability descriptions');
            setTimeout(() => {
                updateSiegfriedAbilityDescriptions(character);
                // Check and update mana costs
                if (window.updateSiegfriedManaCosts) {
                    window.updateSiegfriedManaCosts(character);
                }
                // Check talents status
                if (window.checkSiegfriedTalents) {
                    window.checkSiegfriedTalents(character);
                }
            }, 100);
        }
    });
    
    // Listen for character creation events
    document.addEventListener('characterCreated', (event) => {
        const character = event.detail?.character;
        if (character && character.id === 'schoolboy_siegfried') {
            console.log('[Siegfried] Character created event detected, updating ability descriptions');
            setTimeout(() => {
                updateSiegfriedAbilityDescriptions(character);
            }, 200);
        }
    });
    
    // Test function specifically for passive description
    window.testSiegfriedPassiveDescription = function() {
        if (!window.gameManager || !window.gameManager.gameState) {
            console.log('[PASSIVE TEST] Game manager or game state not available');
            return;
        }
        
        const siegfried = window.gameManager.gameState.playerCharacters.find(c => c.id === 'schoolboy_siegfried');
        if (!siegfried) {
            console.log('[PASSIVE TEST] Siegfried not found in player characters');
            return;
        }
        
        console.log('[PASSIVE TEST] === TESTING PASSIVE DESCRIPTION ===');
        
        // Apply Enhanced Connoisseur talent first
        if (siegfried.passive && typeof siegfried.passive.applyTalentModification === 'function') {
            siegfried.passive.applyTalentModification('damagePerBuff', 150);
            console.log('[PASSIVE TEST] Applied Enhanced Connoisseur (150 damage per buff)');
        } else if (siegfried.passiveHandler && typeof siegfried.passiveHandler.applyTalentModification === 'function') {
            siegfried.passiveHandler.applyTalentModification('damagePerBuff', 150);
            console.log('[PASSIVE TEST] Applied Enhanced Connoisseur via passiveHandler (150 damage per buff)');
        }
        
        // Apply Enduring Mastery
        if (siegfried.passive && typeof siegfried.passive.applyTalentModification === 'function') {
            siegfried.passive.applyTalentModification('buffDurationBonus', 1);
            console.log('[PASSIVE TEST] Applied Enduring Mastery (1 turn duration bonus)');
        } else if (siegfried.passiveHandler && typeof siegfried.passiveHandler.applyTalentModification === 'function') {
            siegfried.passiveHandler.applyTalentModification('buffDurationBonus', 1);
            console.log('[PASSIVE TEST] Applied Enduring Mastery via passiveHandler (1 turn duration bonus)');
        }
        
        // Apply Restorative Buffs
        if (siegfried.passive && typeof siegfried.passive.applyTalentModification === 'function') {
            siegfried.passive.applyTalentModification('healOnBuffReceived', 0.02);
            console.log('[PASSIVE TEST] Applied Restorative Buffs (2% heal on buff received)');
        } else if (siegfried.passiveHandler && typeof siegfried.passiveHandler.applyTalentModification === 'function') {
            siegfried.passiveHandler.applyTalentModification('healOnBuffReceived', 0.02);
            console.log('[PASSIVE TEST] Applied Restorative Buffs via passiveHandler (2% heal on buff received)');
        }
        
        // Add some test buffs to show the current status
        const testBuff1 = {
            id: 'test_buff_1',
            name: 'Test Buff 1',
            description: 'A test buff',
            duration: 3,
            effects: { physicalDamage: 50 }
        };
        
        const testBuff2 = {
            id: 'test_buff_2',
            name: 'Test Buff 2',
            description: 'Another test buff',
            duration: 5,
            effects: { speed: 10 }
        };
        
        siegfried.addBuff(testBuff1);
        siegfried.addBuff(testBuff2);
        
        console.log('[PASSIVE TEST] Added 2 test buffs');
        console.log('[PASSIVE TEST] Current passive description:');
        console.log(siegfried.passive ? siegfried.passive.description : 'No passive object');
        console.log('[PASSIVE TEST] === END TEST ===');
        
        // Update UI
        if (window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(siegfried);
        }
    };
    
    // Global function to force update Siegfried's ability descriptions
    window.forceSiegfriedDescriptionUpdate = function() {
        if (!window.gameManager || !window.gameManager.gameState) {
            console.log('[FORCE UPDATE] Game manager or game state not available');
            return;
        }
        
        const siegfried = window.gameManager.gameState.playerCharacters.find(c => c.id === 'schoolboy_siegfried');
        if (!siegfried) {
            console.log('[FORCE UPDATE] Siegfried not found in player characters');
            return;
        }
        
        console.log('[FORCE UPDATE] === FORCING SIEGFRIED DESCRIPTION UPDATE ===');
        console.log('[FORCE UPDATE] Applied talents:', siegfried.appliedTalents);
        
        // Force add Enhanced Lion Protection talent for testing
        if (!siegfried.appliedTalents) {
            siegfried.appliedTalents = [];
        }
        
        if (!siegfried.appliedTalents.includes('enhanced_lion_protection')) {
            siegfried.appliedTalents.push('enhanced_lion_protection');
            console.log('[FORCE UPDATE] Added Enhanced Lion Protection talent');
        }
        
        // Force update Lion Protection ability cooldown
        const lionProtectionAbility = siegfried.abilities.find(a => a.id === 'schoolboy_siegfried_w');
        if (lionProtectionAbility) {
            lionProtectionAbility.cooldown = 8;
            console.log('[FORCE UPDATE] Set Lion Protection cooldown to 8');
        }
        
        // Call update function
        updateSiegfriedAbilityDescriptions(siegfried);
        
        // Update UI
        if (window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(siegfried);
        }
        
        console.log('[FORCE UPDATE] === UPDATE COMPLETE ===');
        
        // Show final state
        if (lionProtectionAbility) {
            console.log('[FORCE UPDATE] Final Lion Protection description:', lionProtectionAbility.description);
            console.log('[FORCE UPDATE] Final Lion Protection cooldown:', lionProtectionAbility.cooldown);
        }
    };
    
    // Global function to test Enhanced Lion Protection specifically
    window.testEnhancedLionProtection = function() {
        if (!window.gameManager || !window.gameManager.gameState) {
            console.log('[ELP TEST] Game manager or game state not available');
            return;
        }
        
        const siegfried = window.gameManager.gameState.playerCharacters.find(c => c.id === 'schoolboy_siegfried');
        if (!siegfried) {
            console.log('[ELP TEST] Siegfried not found in player characters');
            return;
        }
        
        console.log('[ELP TEST] === TESTING ENHANCED LION PROTECTION ===');
        
        // Apply the talent effect directly
        const enhancedLionProtectionEffect = {
            type: "modify_ability",
            abilityId: "schoolboy_siegfried_w",
            property: "cooldown",
            operation: "set",
            value: 8
        };
        
        if (window.talentManager && typeof window.talentManager.applySingleTalentEffect === 'function') {
            window.talentManager.applySingleTalentEffect(siegfried, enhancedLionProtectionEffect);
            console.log('[ELP TEST] Applied Enhanced Lion Protection effect via talent manager');
        }
        
        // Ensure appliedTalents includes the talent
        if (!siegfried.appliedTalents) {
            siegfried.appliedTalents = [];
        }
        
        if (!siegfried.appliedTalents.includes('enhanced_lion_protection')) {
            siegfried.appliedTalents.push('enhanced_lion_protection');
            console.log('[ELP TEST] Added enhanced_lion_protection to appliedTalents');
        }
        
        // Update descriptions
        updateSiegfriedAbilityDescriptions(siegfried);
        
        // Update UI
        if (window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(siegfried);
        }
        
        // Show results
        const lionProtectionAbility = siegfried.abilities.find(a => a.id === 'schoolboy_siegfried_w');
        if (lionProtectionAbility) {
            console.log('[ELP TEST] Lion Protection cooldown:', lionProtectionAbility.cooldown);
            console.log('[ELP TEST] Lion Protection description:', lionProtectionAbility.description);
        }
        
        console.log('[ELP TEST] === TEST COMPLETE ===');
    };
}

// Helper function to check for Siegfried talents
window.checkSiegfriedTalents = function(character) {
    if (!character || character.id !== 'schoolboy_siegfried') return;
    
    // Log current talent status
    console.log(`[Siegfried Talents] Checking talents for ${character.name}`);
    console.log(`[Siegfried Talents] Has mana cost reduction:`, character.manaCostReduction || 0);
    console.log(`[Siegfried Talents] Applied talents:`, character.appliedTalents || []);
    
    // Check for mana efficiency talent
    const hasManaEfficiency = character.hasTalent && character.hasTalent('mana_efficiency');
    if (hasManaEfficiency && character.manaCostReduction > 0) {
        console.log(`[Siegfried Talents] Mana Efficiency active: ${Math.round(character.manaCostReduction * 100)}% reduction`);
    }
    
    // Check for relentless justice talent
    const hasRelentlessJustice = character.hasTalent && character.hasTalent('relentless_justice');
    if (hasRelentlessJustice) {
        const swordSlashAbility = character.abilities.find(a => a.id === 'schoolboy_siegfried_q');
        if (swordSlashAbility && swordSlashAbility.reduce_judgment_cooldown) {
            console.log(`[Siegfried Talents] Relentless Justice active on Sword Slash`);
        }
    }
};

// Update ability to show reduced mana costs
window.updateSiegfriedManaCosts = function(character) {
    if (!character || character.id !== 'schoolboy_siegfried') return;
    if (!character.manaCostReduction || character.manaCostReduction <= 0) return;
    
    console.log(`[Siegfried Mana] Updating mana cost displays with ${Math.round(character.manaCostReduction * 100)}% reduction`);
    
    // Update UI elements to show reduced mana costs
    character.abilities.forEach(ability => {
        const abilityElement = document.querySelector(`[data-ability-id="${ability.id}"] .ability-cost`);
        if (abilityElement && ability.baseManaCost !== undefined) {
            const originalCost = ability.baseManaCost;
            const reducedCost = ability.manaCost;
            abilityElement.innerHTML = `<span style="text-decoration: line-through; color: #888;">${originalCost}</span> <span style="color: #40E0FF; font-weight: bold;">${reducedCost}</span>`;
            console.log(`[Siegfried Mana] Updated ${ability.name} display: ${originalCost} -> ${reducedCost}`);
        }
    });
};

// Test function for Mana Efficiency talent
window.testSiegfriedManaEfficiency = function() {
    console.log('[Mana Efficiency Test] === STARTING TEST ===');
    
    // Find Siegfried in the current game
    let siegfried = null;
    if (window.gameManager && window.gameManager.gameState) {
        siegfried = window.gameManager.gameState.playerCharacters.find(c => c.id === 'schoolboy_siegfried');
    }
    
    if (!siegfried) {
        console.error('[Mana Efficiency Test] Siegfried not found in game');
        return;
    }
    
    console.log('[Mana Efficiency Test] Found Siegfried:', siegfried.name);
    console.log('[Mana Efficiency Test] Current manaCostReduction:', siegfried.manaCostReduction);
    console.log('[Mana Efficiency Test] Applied talents:', siegfried.appliedTalents);
    console.log('[Mana Efficiency Test] Has talent function:', typeof siegfried.hasTalent);
    
    // Check if talent is applied
    const hasManaEfficiency = siegfried.hasTalent && siegfried.hasTalent('mana_efficiency');
    console.log('[Mana Efficiency Test] Has mana_efficiency talent:', hasManaEfficiency);
    
    // Show ability mana costs
    console.log('[Mana Efficiency Test] Ability mana costs:');
    siegfried.abilities.forEach(ability => {
        console.log(`  ${ability.name}: baseManaCost=${ability.baseManaCost}, manaCost=${ability.manaCost}`);
    });
    
    // If talent isn't applied, try to apply it manually for testing
    if (!hasManaEfficiency) {
        console.log('[Mana Efficiency Test] Talent not applied, attempting manual application...');
        
        // Manually set the talent
        if (!siegfried.appliedTalents) siegfried.appliedTalents = [];
        if (!siegfried.appliedTalents.includes('mana_efficiency')) {
            siegfried.appliedTalents.push('mana_efficiency');
        }
        
        // Set the property
        siegfried.manaCostReduction = 0.35;
        
        // Apply mana cost reduction manually
        siegfried.abilities.forEach(ability => {
            if (ability.baseManaCost === undefined) {
                ability.baseManaCost = ability.manaCost;
            }
            const reducedCost = Math.ceil(ability.baseManaCost * (1 - 0.35));
            ability.manaCost = Math.max(1, reducedCost);
            console.log(`[Mana Efficiency Test] ${ability.name}: ${ability.baseManaCost} -> ${ability.manaCost}`);
        });
        
        // Update descriptions
        updateSiegfriedAbilityDescriptions(siegfried);
        
        // Update UI
        if (window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(siegfried);
        }
        
        console.log('[Mana Efficiency Test] Manual application complete');
    }
    
    console.log('[Mana Efficiency Test] === TEST COMPLETE ===');
};