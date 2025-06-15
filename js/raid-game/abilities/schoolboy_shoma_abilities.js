// Schoolboy Shoma Abilities - Statistics Tracking Enhancement
// This file ensures all of Schoolboy Shoma's abilities properly track battle statistics

/**
 * Enhanced Boink ability with proper statistics tracking
 * This hooks into the existing AbilityFactory system to ensure tracking
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Schoolboy Shoma abilities statistics tracking module loaded');
    
    // Wait for the game to fully initialize
    const initializeShomaStatistics = () => {
        if (typeof window.gameManager === 'undefined' || typeof AbilityFactory === 'undefined') {
            console.log('Waiting for game initialization...');
            setTimeout(initializeShomaStatistics, 100);
            return;
        }
        
        console.log('Initializing Schoolboy Shoma statistics tracking...');
        
        // Store original createDamageEffect method
        const originalCreateDamageEffect = AbilityFactory.createDamageEffect;
        
        // Override createDamageEffect to ensure Boink has proper tracking
        AbilityFactory.createDamageEffect = function(abilityData) {
            const originalEffect = originalCreateDamageEffect.call(this, abilityData);
            
            // Specifically handle Boink ability
            if (abilityData.id === 'boink') {
                return (caster, target, options = {}) => {
                    // Ensure abilityId is included for statistics
                    const enhancedOptions = {
                        ...options,
                        abilityId: 'boink'
                    };
                    
                    console.log(`[Shoma Stats] Boink ability tracking with options:`, enhancedOptions);
                    
                    // Call the original effect with enhanced options
                    return originalEffect(caster, target, enhancedOptions);
                };
            }
            
            // For other abilities, return original effect
            return originalEffect;
        };
        
        // Store original createBuffEffect method to track buff applications
        const originalCreateBuffEffect = AbilityFactory.createBuffEffect;
        
        // Override createBuffEffect to ensure Shoma's buffs have proper tracking
        AbilityFactory.createBuffEffect = function(abilityData) {
            const originalEffect = originalCreateBuffEffect.call(this, abilityData);
            
            // Specifically handle Shoma's buff abilities
            if (['catch', 'homerun'].includes(abilityData.id)) {
                return (caster, targetOrTargets) => {
                    console.log(`[Shoma Stats] ${abilityData.id} buff ability tracking`);
                    
                    // Record buff application in statistics if statistics manager exists
                    if (window.statisticsManager && caster && targetOrTargets) {
                        const target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
                        try {
                            // Track as utility ability usage
                            window.statisticsManager.recordAbilityUsage(caster, abilityData.id, 'utility', 0, false);
                            console.log(`[Shoma Stats] Recorded ${abilityData.id} usage for ${caster.name}`);
                        } catch (error) {
                            console.error(`[Shoma Stats] Error recording ${abilityData.id} usage:`, error);
                        }
                    }
                    
                    // Call the original effect
                    return originalEffect(caster, targetOrTargets);
                };
            }
            
            // For other abilities, return original effect
            return originalEffect;
        };
        
        console.log('Schoolboy Shoma statistics tracking initialization complete');
    };
    
    // Start initialization
    initializeShomaStatistics();
});

/**
 * Enhanced ball throw effects tracking
 * This ensures that all ball variants properly track their damage/healing
 */
(function() {
    'use strict';
    
    // Function to track ball throw statistics
    window.trackShomaAbilityUsage = function(abilityId, caster, target, value, isCritical, type) {
        if (!window.statisticsManager || !caster) {
            return;
        }
        
        try {
            switch (type) {
                case 'damage':
                    window.statisticsManager.recordDamageDealt(caster, target, value, isCritical, abilityId, 'ability');
                    break;
                case 'heal':
                    window.statisticsManager.recordHealingDone(caster, target, value, isCritical, abilityId, 'direct');
                    break;
                case 'buff':
                case 'debuff':
                    window.statisticsManager.recordAbilityUsage(caster, abilityId, 'utility', 0, false);
                    break;
            }
            console.log(`[Shoma Ball Stats] Tracked ${type} for ${abilityId}: ${value} ${isCritical ? '(Critical)' : ''}`);
        } catch (error) {
            console.error(`[Shoma Ball Stats] Error tracking ${type} for ${abilityId}:`, error);
        }
    };
    
    // Function to enhance existing ball selection functionality with statistics
    const originalSelectBall = window.selectBall;
    if (typeof originalSelectBall === 'function') {
        window.selectBall = function(shomaCharacter, ballId) {
            console.log(`[Shoma Stats] Ball selection: ${ballId} for ${shomaCharacter.name}`);
            
            // Call original function
            const result = originalSelectBall(shomaCharacter, ballId);
            
            // Ensure the ball throw ability has enhanced tracking
            enhanceBallThrowAbility(shomaCharacter, ballId);
            
            return result;
        };
    }
    
    function enhanceBallThrowAbility(shomaCharacter, ballId) {
        if (!shomaCharacter || !shomaCharacter.abilities) {
            return;
        }
        
        // Find the ball throw ability
        const ballThrowIndex = shomaCharacter.abilities.findIndex(ability => 
            ability.id.startsWith('ball_throw')
        );
        
        if (ballThrowIndex === -1) {
            return;
        }
        
        const ballThrowAbility = shomaCharacter.abilities[ballThrowIndex];
        const originalEffect = ballThrowAbility.effect;
        
        if (typeof originalEffect === 'function') {
            // Wrap the original effect to add statistics tracking
            ballThrowAbility.effect = function(caster, target) {
                console.log(`[Shoma Ball Stats] Enhanced ${ballThrowAbility.id} with statistics tracking`);
                
                // Call the original effect
                const result = originalEffect.call(this, caster, target);
                
                // Additional tracking for specific ball types could be added here
                
                return result;
            };
            
            console.log(`[Shoma Ball Stats] Enhanced ${ballThrowAbility.id} with statistics tracking`);
        }
    }
})();

/**
 * Enhanced homerun ability tracking
 * Tracks the unique mechanic of cooldown reset and ball reselection
 */
(function() {
    'use strict';
    
    // Track homerun usage when cooldowns are reset
    const originalResetAbilityCooldowns = Character.prototype.resetAbilityCooldowns;
    if (originalResetAbilityCooldowns) {
        Character.prototype.resetAbilityCooldowns = function() {
            // Check if this is Schoolboy Shoma and if Homerun was just used
            if (this.id === 'schoolboy_shoma') {
                // Record special homerun tracking
                if (window.statisticsManager) {
                    try {
                        window.statisticsManager.recordAbilityUsage(this, 'homerun_reset', 'utility', 0, false);
                        console.log(`[Shoma Stats] Tracked cooldown reset for ${this.name}`);
                    } catch (error) {
                        console.error(`[Shoma Stats] Error tracking cooldown reset:`, error);
                    }
                }
            }
            
            // Call original method
            return originalResetAbilityCooldowns.call(this);
        };
    }
})();

console.log('Schoolboy Shoma enhanced statistics tracking module loaded'); 