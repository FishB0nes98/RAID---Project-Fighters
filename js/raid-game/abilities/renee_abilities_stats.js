// Renée Abilities Statistics Enhancement
// Enhanced statistics tracking for all of Renée's abilities to match comprehensive tracking systems

/**
 * Global helper function to track Renée's ability usage for statistics
 */
function trackReneeAbilityUsage(character, abilityId, effectType, amount = 0, isCritical = false) {
    if (!window.statisticsManager || !character) {
        console.warn(`[ReneeStats] statisticsManager or character not available for tracking ${abilityId}`);
        return;
    }
    
    try {
        window.statisticsManager.recordAbilityUsage(character, abilityId, effectType, amount, isCritical);
        console.log(`[ReneeStats] Tracked ${effectType} ability usage: ${abilityId} by ${character.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking ability usage for ${abilityId}:`, error);
    }
}

/**
 * Enhanced Wolf Claw Strike statistics tracking
 * Handles both primary attack and Double Claw talent triggers
 */
window.trackWolfClawStrikeStats = function(caster, target, damageResult, isSecondHit = false) {
    if (!window.statisticsManager) return;
    
    try {
        const abilityId = isSecondHit ? 'renee_q_double' : 'renee_q';
        const damageType = 'physical';
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt with proper parameter order: (caster, target, damage, damageType, isCritical, abilityId)
        window.statisticsManager.recordDamageDealt(
            caster, 
            target, 
            damageAmount, 
            damageType, 
            isCritical,
            abilityId
        );
        
        // Track ability usage for primary hit only
        if (!isSecondHit) {
            trackReneeAbilityUsage(caster, 'renee_q', 'use', 0, isCritical);
        }
        
        console.log(`[ReneeStats] Wolf Claw Strike damage tracked: ${damageAmount} to ${target.name}, crit: ${isCritical}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Wolf Claw Strike stats:`, error);
    }
};

/**
 * Enhanced Primal Healing statistics tracking
 */
window.trackPrimalHealingStats = function(caster, healAmount) {
    if (!window.statisticsManager) return;
    
    try {
        // Track healing done with proper parameter order: (healer, target, healing, isCritical, abilityId, healType)
        window.statisticsManager.recordHealingDone(
            caster,
            caster, // Self-heal
            healAmount,
            false, // isCritical
            'renee_q_primal_healing',
            'talent' // healType
        );
        
        console.log(`[ReneeStats] Primal Healing tracked: ${healAmount} HP restored to ${caster.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Primal Healing stats:`, error);
    }
};

/**
 * Enhanced Lupine Veil statistics tracking
 */
window.trackLupineVeilStats = function(caster) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility ability usage
        trackReneeAbilityUsage(caster, 'renee_w', 'use', 0, false);
        
        console.log(`[ReneeStats] Lupine Veil utility usage tracked for ${caster.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Lupine Veil stats:`, error);
    }
};

/**
 * Enhanced Mystical Whip statistics tracking
 * Handles primary target, chain targets, and various talent effects
 */
window.trackMysticalWhipStats = function(caster, target, damageResult, options = {}) {
    if (!window.statisticsManager) return;
    
    const {
        isChainTarget = false,
        isSecondHit = false,
        damageType = 'physical'
    } = options;
    
    try {
        // Determine ability ID based on context
        let abilityId = 'renee_e';
        if (isChainTarget) {
            abilityId = 'renee_e_chain';
        } else if (isSecondHit) {
            abilityId = 'renee_e_relentless';
        }
        
        const damageAmount = typeof damageResult === 'object' ? damageResult.damage : damageResult;
        const isCritical = typeof damageResult === 'object' ? damageResult.isCritical : false;
        
        // Track damage dealt with proper parameter order: (caster, target, damage, damageType, isCritical, abilityId)
        window.statisticsManager.recordDamageDealt(
            caster,
            target,
            damageAmount,
            damageType,
            isCritical,
            abilityId
        );
        
        // Track primary ability usage (not for chain or second hits)
        if (!isChainTarget && !isSecondHit) {
            trackReneeAbilityUsage(caster, 'renee_e', 'use', 0, isCritical);
        }
        
        console.log(`[ReneeStats] Mystical Whip damage tracked: ${damageAmount} to ${target.name} (${abilityId}), crit: ${isCritical}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Mystical Whip stats:`, error);
    }
};

/**
 * Enhanced Lunar Curse statistics tracking
 */
window.trackLunarCurseStats = function(caster) {
    if (!window.statisticsManager) return;
    
    try {
        // Track utility ability usage
        trackReneeAbilityUsage(caster, 'renee_r', 'use', 0, false);
        
        console.log(`[ReneeStats] Lunar Curse utility usage tracked for ${caster.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Lunar Curse stats:`, error);
    }
};

/**
 * Track Instinctive Veil talent usage (stealth from Wolf Claw Strike)
 */
window.trackInstinctiveVeilStats = function(caster) {
    if (!window.statisticsManager) return;
    
    try {
        trackReneeAbilityUsage(caster, 'instinctive_veil', 'use', 0, false);
        
        console.log(`[ReneeStats] Instinctive Veil talent usage tracked for ${caster.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Instinctive Veil stats:`, error);
    }
};

/**
 * Track Essence Drain talent mana steal
 */
window.trackEssenceDrainStats = function(caster, target, manaAmount) {
    if (!window.statisticsManager) return;
    
    try {
        // Track as a resource manipulation ability
        trackReneeAbilityUsage(caster, 'essence_drain', 'use', manaAmount, false);
        
        console.log(`[ReneeStats] Essence Drain tracked: ${manaAmount} mana stolen from ${target.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Essence Drain stats:`, error);
    }
};

/**
 * Track Disruptive Lash talent ability disable
 */
window.trackDisruptiveLashStats = function(caster, target, disabledAbility) {
    if (!window.statisticsManager) return;
    
    try {
        trackReneeAbilityUsage(caster, 'disruptive_lash', 'use', 0, false);
        
        console.log(`[ReneeStats] Disruptive Lash tracked: ${disabledAbility.name} disabled on ${target.name}`);
    } catch (error) {
        console.error(`[ReneeStats] Error tracking Disruptive Lash stats:`, error);
    }
};

/**
 * Initialize enhanced statistics tracking for Renée
 * This function should be called when Renée is created or when the game initializes
 */
window.initializeReneeStatsTracking = function() {
    console.log('[ReneeStats] Initializing enhanced statistics tracking for Renée abilities');
    
    // Verify statisticsManager is available
    if (!window.statisticsManager) {
        console.warn('[ReneeStats] statisticsManager not available during initialization');
        return false;
    }
    
    console.log('[ReneeStats] Enhanced statistics tracking initialized successfully');
    return true;
};

// Auto-initialize when the script loads
(function() {
    // Wait for the game to be ready before initializing
    const initWhenReady = () => {
        if (window.statisticsManager) {
            window.initializeReneeStatsTracking();
        } else {
            // Retry after a short delay
            setTimeout(initWhenReady, 500);
        }
    };
    
    // Start initialization
    setTimeout(initWhenReady, 100);
})();

console.log('[ReneeStats] Renée abilities statistics enhancement module loaded'); 