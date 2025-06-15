// Smith Lord Abilities
class SmithLordAbilities {
    static createGearUpAbility() {
        return {
            id: 'gear_up',
            name: 'Gear Up',
            description: 'Enhances all allies\' armor by 10 for 4 turns. Does not affect self.',
            icon: 'Icons/abilities/gear_up.png',
            manaCost: 50,
            cooldown: 4,
            targetType: 'all_allies_except_self',
            damageType: 'support',
            
            execute: async function(caster, target, gameManager) {
                try {
                    // Get the actual game manager instance
                    const actualGameManager = window.gameManager;
                    if (!actualGameManager) {
                        console.error('[Gear Up] GameManager not available');
                        return;
                    }
                    
                    // Get all allies (not including self) - use the AI characters if this is an AI character
                    const allAllies = caster.isAI ? 
                        actualGameManager.gameState.aiCharacters : 
                        actualGameManager.gameState.playerCharacters;
                        
                    const allies = allAllies.filter(ally => ally.id !== caster.id && !ally.isDead());
                    
                    if (allies.length === 0) {
                        actualGameManager.addLogEntry(`${caster.name} uses Gear Up, but has no allies to enhance!`, 'ability-cast');
                        return;
                    }

                    actualGameManager.addLogEntry(`${caster.name} uses Gear Up to enhance all allies' armor!`, 'ability-cast');
                    
                    // Play casting sound (use existing sound)
                    await actualGameManager.playSound('sounds/buff_applied.mp3', actualGameManager.sfxVolume);
                    
                    // Create casting VFX on Smith Lord
                    createGearUpCastingVFX(caster);
                    
                    // Apply armor buff to each ally
                    for (const ally of allies) {
                        // Create armor buff using the proper Effect class structure
                        const armorBuff = new Effect(
                            'gear_up_armor',
                            'Gear Up',
                            'Icons/abilities/gear_up.png',
                            4, // Duration: 4 turns
                            null, // No per-turn effect
                            false // Not a debuff
                        ).setDescription('+10 Armor enhancement from Smith Lord\'s forge mastery.');

                        // Add stat modifiers for armor
                        armorBuff.statModifiers = [
                            { stat: 'armor', value: 10, operation: 'add' } // Add 10 flat armor
                        ];

                        // Custom onApply function
                        armorBuff.onApply = (character) => {
                            actualGameManager.addLogEntry(`${character.name} gains +10 armor from Gear Up!`, 'buff-applied');
                            return true;
                        };

                        // Custom onRemove function
                        armorBuff.onRemove = (character) => {
                            actualGameManager.addLogEntry(`${character.name}'s Gear Up armor enhancement expires.`, 'buff-removed');
                            return true;
                        };
                        
                        ally.addBuff(armorBuff.clone());
                        
                        // Create enhancement VFX on ally
                        await createGearUpEnhancementVFX(ally);
                        
                        // Update UI
                        if (actualGameManager.uiManager) {
                            actualGameManager.uiManager.updateCharacterUI(ally);
                        }
                        
                        // Small delay between each ally enhancement
                        await actualGameManager.delay(300);
                    }
                    
                    // Play enhancement completion sound (use existing sound)
                    await actualGameManager.playSound('sounds/buff_applied.mp3', actualGameManager.sfxVolume);
                    
                } catch (error) {
                    console.error('Error executing Gear Up ability:', error);
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(`${caster.name}'s Gear Up failed!`, 'error');
                    }
                }
            }
        };
    }

    static createMoltenBreathAbility() {
        return {
            id: 'molten_breath',
            name: 'Molten Breath',
            description: 'Unleashes a devastating molten breath that deals 400 magical damage to all enemies.',
            icon: 'Icons/abilities/molten_breath.png',
            manaCost: 120,
            cooldown: 6,
            targetType: 'all_enemies',
            damageType: 'magical',
            
            execute: async function(caster, target, gameManager) {
                try {
                    // Get the actual game manager instance
                    const actualGameManager = window.gameManager;
                    if (!actualGameManager) {
                        console.error('[Molten Breath] GameManager not available');
                        return;
                    }

                    // Get all enemies
                    const allEnemies = caster.isAI ? 
                        actualGameManager.gameState.playerCharacters : 
                        actualGameManager.gameState.aiCharacters;
                    
                    const aliveEnemies = allEnemies.filter(enemy => !enemy.isDead());
                    
                    if (aliveEnemies.length === 0) {
                        actualGameManager.addLogEntry(`${caster.name} breathes molten fire, but finds no enemies to burn!`, 'ability-cast');
                        return;
                    }

                    actualGameManager.addLogEntry(`${caster.name} unleashes a devastating Molten Breath!`, 'ability-cast');
                    
                    // Play casting sound
                    await actualGameManager.playSound('sounds/fire_spell.mp3', actualGameManager.sfxVolume);
                    
                    // Create massive fire breath VFX
                    await createMoltenBreathVFX(caster, aliveEnemies);
                    
                    // Apply damage to each enemy
                    for (let i = 0; i < aliveEnemies.length; i++) {
                        const enemy = aliveEnemies[i];
                        
                        // Add delay for dramatic effect
                        await actualGameManager.delay(400 + (i * 200));
                        
                        // Deal 400 magical damage
                        const damageResult = enemy.applyDamage(400, 'magical', caster, { abilityId: 'molten_breath' });
                        actualGameManager.addLogEntry(`${enemy.name} is burned by molten breath for ${damageResult.damage} magical damage!`, 'damage-dealt');
                        
                        // Create individual fire damage VFX
                        createMoltenBreathDamageVFX(enemy);
                        
                        // Update UI
                        if (actualGameManager.uiManager) {
                            actualGameManager.uiManager.updateCharacterUI(enemy);
                        }
                    }
                    
                    // Play completion sound
                    await actualGameManager.playSound('sounds/fire_explosion.mp3', actualGameManager.sfxVolume);
                    
                } catch (error) {
                    console.error('Error executing Molten Breath ability:', error);
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(`${caster.name}'s Molten Breath failed!`, 'error');
                    }
                }
            }
        };
    }

    static createWeaponSmithingAbility() {
        return {
            id: 'weapon_smithing',
            name: 'Weapon Smithing',
            description: 'Forges enhanced equipment for an ally, boosting one of their random non-zero stats by 65% for 3 turns.',
            icon: 'Icons/abilities/weapon_smithing.png',
            manaCost: 50,
            cooldown: 2,
            targetType: 'ally',
            damageType: 'support',
            
            execute: async function(caster, target, gameManager) {
                try {
                    // Get the actual game manager instance
                    const actualGameManager = window.gameManager;
                    if (!actualGameManager) {
                        console.error('[Weapon Smithing] GameManager not available');
                        return;
                    }
                    
                    if (!target) {
                        actualGameManager.addLogEntry(`${caster.name} attempts to forge equipment, but has no target!`, 'ability-cast');
                        return;
                    }

                    if (target.isDead()) {
                        actualGameManager.addLogEntry(`${caster.name} cannot forge equipment for ${target.name} - they are defeated!`, 'ability-cast');
                        return;
                    }

                    actualGameManager.addLogEntry(`${caster.name} begins forging enhanced equipment for ${target.name}!`, 'ability-cast');
                    
                    // Play casting sound
                    await actualGameManager.playSound('sounds/buff_applied.mp3', actualGameManager.sfxVolume);
                    
                    // Create forging VFX on Smith Lord
                    createWeaponSmithingCastingVFX(caster);
                    
                    // Get all eligible stats (non-zero values)
                    const eligibleStats = getEligibleStatsForBoost(target);
                    
                    if (eligibleStats.length === 0) {
                        actualGameManager.addLogEntry(`${target.name} has no stats that can be enhanced!`, 'system');
                        return;
                    }
                    
                    // Randomly select a stat to boost
                    const randomIndex = Math.floor(Math.random() * eligibleStats.length);
                    const selectedStat = eligibleStats[randomIndex];
                    
                    // Calculate the boost amount (65% of current value)
                    const currentValue = target.stats[selectedStat.key];
                    
                    // Determine if this is a percentage stat or flat stat
                    const percentageStats = ['lifesteal', 'dodgeChance', 'critChance', 'critDamage', 'healingPower'];
                    const isPercentageStat = percentageStats.includes(selectedStat.key);
                    
                    let boostAmount, operation, displayText;
                    
                    if (isPercentageStat) {
                        // For percentage stats, use multiplicative boost (65% increase)
                        boostAmount = Math.round((currentValue * 0.65) * 10000) / 10000; // Round to 4 decimal places
                        operation = 'add';
                        const newPercentage = Math.round((currentValue + boostAmount) * 100 * 100) / 100; // Convert to percentage for display
                        displayText = `+${Math.round(boostAmount * 100 * 100) / 100}% ${selectedStat.displayName}`;
                    } else {
                        // For flat stats, use additive boost (65% of current value added)
                        boostAmount = Math.ceil(currentValue * 0.65);
                        operation = 'add';
                        displayText = `+${boostAmount} ${selectedStat.displayName}`;
                    }
                    
                    // Create the weapon smithing buff
                    const weaponBuff = new Effect(
                        `weapon_smithing_${selectedStat.key}`,
                        `Forged ${selectedStat.displayName}`,
                        'Icons/abilities/weapon_smithing.png',
                        3, // Duration: 3 turns
                        null, // No per-turn effect
                        false // Not a debuff
                    ).setDescription(`${displayText} from Smith Lord's masterwork forging (+65%).`);

                    // Add stat modifier for the selected stat
                    weaponBuff.statModifiers = [
                        { stat: selectedStat.key, value: boostAmount, operation: operation }
                    ];

                    // Custom onApply function
                    weaponBuff.onApply = (character) => {
                        actualGameManager.addLogEntry(`${character.name}'s ${selectedStat.displayName} is enhanced by masterwork forging (${displayText})!`, 'buff-applied');
                        return true;
                    };

                    // Custom onRemove function
                    weaponBuff.onRemove = (character) => {
                        actualGameManager.addLogEntry(`${character.name}'s forged equipment enhancement expires.`, 'buff-removed');
                        return true;
                    };
                    
                    // Apply the buff
                    target.addBuff(weaponBuff.clone());
                    
                    // Create enhancement VFX on target
                    await createWeaponSmithingEnhancementVFX(target, selectedStat, displayText);
                    
                    // Update UI
                    if (actualGameManager.uiManager) {
                        actualGameManager.uiManager.updateCharacterUI(target);
                    }
                    
                    // Play completion sound
                    await actualGameManager.playSound('sounds/buff_applied.mp3', actualGameManager.sfxVolume);
                    
                } catch (error) {
                    console.error('Error executing Weapon Smithing ability:', error);
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(`${caster.name}'s Weapon Smithing failed!`, 'error');
                    }
                }
            }
        };
    }
}



// VFX Functions (moved outside so they can be called properly)
function createGearUpCastingVFX(caster) {
    const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!characterElement) return;
    
    // Create hammer glow effect
    const hammerGlow = document.createElement('div');
    hammerGlow.className = 'gear-up-casting-vfx';
    hammerGlow.innerHTML = '🔨';
    characterElement.appendChild(hammerGlow);
    
    // Create forge sparks
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'gear-up-spark';
        spark.innerHTML = '✨';
        spark.style.left = Math.random() * 100 + '%';
        spark.style.top = Math.random() * 100 + '%';
        spark.style.animationDelay = (Math.random() * 0.5) + 's';
        characterElement.appendChild(spark);
        
        setTimeout(() => spark.remove(), 1500);
    }
    
    setTimeout(() => hammerGlow.remove(), 1500);
}

// Create enhancement VFX for allies
async function createGearUpEnhancementVFX(ally) {
    const characterElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
    if (!characterElement) return;
    
    // Create main enhancement effect
    const enhancementGlow = document.createElement('div');
    enhancementGlow.className = 'gear-up-enhancement-vfx';
    enhancementGlow.innerHTML = '🛡️';
    characterElement.appendChild(enhancementGlow);
    
    // Create armor particles
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'gear-up-armor-particle';
        particle.innerHTML = '⚙️';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = (Math.random() * 0.8) + 's';
        characterElement.appendChild(particle);
        
        setTimeout(() => particle.remove(), 2000);
    }
    
    setTimeout(() => enhancementGlow.remove(), 2000);
    
    // Small delay for the effect
    await new Promise(resolve => setTimeout(resolve, 300));
}

// Molten Breath VFX Functions
async function createMoltenBreathVFX(caster, targets) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;
    
    // Create massive fire breath emanating from Smith Lord
    const breathContainer = document.createElement('div');
    breathContainer.className = 'molten-breath-container';
    casterElement.appendChild(breathContainer);
    
    // Create the fire breath beam
    const fireBreath = document.createElement('div');
    fireBreath.className = 'molten-breath-beam';
    breathContainer.appendChild(fireBreath);
    
    // Create molten particles
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'molten-breath-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = (Math.random() * 1.5) + 's';
        particle.style.animationDuration = (1.5 + Math.random() * 1) + 's';
        breathContainer.appendChild(particle);
    }
    
    // Create screen-wide fire overlay
    const screenOverlay = document.createElement('div');
    screenOverlay.className = 'molten-breath-screen-overlay';
    document.body.appendChild(screenOverlay);
    
    // Create heat waves
    const heatWave = document.createElement('div');
    heatWave.className = 'molten-breath-heat-wave';
    document.body.appendChild(heatWave);
    
    // Add screen shake effect
    document.body.classList.add('molten-breath-shake');
    
    // Wait for the breath animation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clean up VFX
    setTimeout(() => {
        breathContainer.remove();
        screenOverlay.remove();
        heatWave.remove();
        document.body.classList.remove('molten-breath-shake');
    }, 500);
}

function createMoltenBreathDamageVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create fire damage effect
    const fireImpact = document.createElement('div');
    fireImpact.className = 'molten-breath-damage-vfx';
    targetElement.appendChild(fireImpact);
    
    // Create burning particles
    for (let i = 0; i < 8; i++) {
        const burnParticle = document.createElement('div');
        burnParticle.className = 'molten-breath-burn-particle';
        burnParticle.style.left = Math.random() * 100 + '%';
        burnParticle.style.top = Math.random() * 100 + '%';
        burnParticle.style.animationDelay = (Math.random() * 0.5) + 's';
        targetElement.appendChild(burnParticle);
        
        setTimeout(() => burnParticle.remove(), 1500);
    }
    
    setTimeout(() => fireImpact.remove(), 1500);
}



// Helper function to get eligible stats for weapon smithing boost
function getEligibleStatsForBoost(character) {
    const eligibleStats = [];
    
    // Define stats that can be boosted with their display names
    const statDefinitions = [
        { key: 'physicalDamage', displayName: 'Physical Damage', minValue: 1 },
        { key: 'magicalDamage', displayName: 'Magical Damage', minValue: 1 },
        { key: 'armor', displayName: 'Armor', minValue: 1 },
        { key: 'magicalShield', displayName: 'Magical Shield', minValue: 1 },
        { key: 'lifesteal', displayName: 'Lifesteal', minValue: 0.01 },
        { key: 'dodgeChance', displayName: 'Dodge Chance', minValue: 0.01 },
        { key: 'critChance', displayName: 'Critical Chance', minValue: 0.01 },
        { key: 'critDamage', displayName: 'Critical Damage', minValue: 0.01 },
        { key: 'healingPower', displayName: 'Healing Power', minValue: 1 }
    ];
    
    // Check each stat to see if it's eligible (above minimum value)
    for (const statDef of statDefinitions) {
        const currentValue = character.stats[statDef.key] || 0;
        if (currentValue >= statDef.minValue) {
            eligibleStats.push({
                key: statDef.key,
                displayName: statDef.displayName,
                currentValue: currentValue
            });
        }
    }
    
    return eligibleStats;
}

// Weapon Smithing VFX Functions
function createWeaponSmithingCastingVFX(caster) {
    const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!characterElement) return;
    
    // Create anvil and hammer effect
    const forgingEffect = document.createElement('div');
    forgingEffect.className = 'weapon-smithing-casting-vfx';
    characterElement.appendChild(forgingEffect);
    
    // Create forge fire
    const forgeFlame = document.createElement('div');
    forgeFlame.className = 'weapon-smithing-forge-flame';
    forgingEffect.appendChild(forgeFlame);
    
    // Create sparks from hammering
    for (let i = 0; i < 12; i++) {
        const spark = document.createElement('div');
        spark.className = 'weapon-smithing-spark';
        spark.style.left = Math.random() * 100 + '%';
        spark.style.top = Math.random() * 100 + '%';
        spark.style.animationDelay = (Math.random() * 1.2) + 's';
        spark.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
        forgingEffect.appendChild(spark);
    }
    
    // Create metal glow effects
    for (let i = 0; i < 6; i++) {
        const metalGlow = document.createElement('div');
        metalGlow.className = 'weapon-smithing-metal-glow';
        metalGlow.style.left = (20 + Math.random() * 60) + '%';
        metalGlow.style.top = (20 + Math.random() * 60) + '%';
        metalGlow.style.animationDelay = (Math.random() * 0.8) + 's';
        forgingEffect.appendChild(metalGlow);
    }
    
    setTimeout(() => forgingEffect.remove(), 2000);
}

async function createWeaponSmithingEnhancementVFX(target, selectedStat, displayText) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create main enhancement effect
    const enhancementEffect = document.createElement('div');
    enhancementEffect.className = 'weapon-smithing-enhancement-vfx';
    targetElement.appendChild(enhancementEffect);
    
    // Create weapon glow based on stat type
    const weaponGlow = document.createElement('div');
    weaponGlow.className = 'weapon-smithing-weapon-glow';
    
    // Different colors/effects based on the enhanced stat
    if (selectedStat.key.includes('Damage')) {
        weaponGlow.classList.add('damage-enhancement');
    } else if (selectedStat.key.includes('armor') || selectedStat.key.includes('Shield')) {
        weaponGlow.classList.add('defense-enhancement');
    } else if (selectedStat.key.includes('crit') || selectedStat.key.includes('dodge')) {
        weaponGlow.classList.add('precision-enhancement');
    } else {
        weaponGlow.classList.add('general-enhancement');
    }
    
    enhancementEffect.appendChild(weaponGlow);
    
    // Create enhancement particles
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'weapon-smithing-enhancement-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = (Math.random() * 1.0) + 's';
        enhancementEffect.appendChild(particle);
    }
    
    // Create floating stat boost indicator
    const statIndicator = document.createElement('div');
    statIndicator.className = 'weapon-smithing-stat-indicator';
    statIndicator.textContent = displayText || `+65% ${selectedStat.displayName}`;
    enhancementEffect.appendChild(statIndicator);
    
    setTimeout(() => enhancementEffect.remove(), 2500);
    
    // Small delay for the effect
    await new Promise(resolve => setTimeout(resolve, 400));
}

// Register abilities using the effect registration method (same as Lava Chimp)
function registerSmithLordAbilities() {
    console.log('[Smith Lord Abilities] Registering abilities...');
    
    if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
        // Create the gear up ability object and extract the execute function
        const gearUpAbility = SmithLordAbilities.createGearUpAbility();
        
        // Register the execute function 
        window.AbilityFactory.registerAbilityEffect('gear_up', gearUpAbility.execute);
        window.AbilityFactory.registerAbilityEffect('smith_lord_gear_up', gearUpAbility.execute);
        
        // Create the molten breath ability object and extract the execute function
        const moltenBreathAbility = SmithLordAbilities.createMoltenBreathAbility();
        
        // Register the molten breath execute function
        window.AbilityFactory.registerAbilityEffect('molten_breath', moltenBreathAbility.execute);
        window.AbilityFactory.registerAbilityEffect('smith_lord_molten_breath', moltenBreathAbility.execute);
        
        // Create the weapon smithing ability object and extract the execute function
        const weaponSmithingAbility = SmithLordAbilities.createWeaponSmithingAbility();
        
        // Register the weapon smithing execute function
        window.AbilityFactory.registerAbilityEffect('weapon_smithing', weaponSmithingAbility.execute);
        window.AbilityFactory.registerAbilityEffect('smith_lord_weapon_smithing', weaponSmithingAbility.execute);
        
        console.log('[Smith Lord Abilities] Successfully registered Gear Up, Molten Breath, and Weapon Smithing abilities');
    } else {
        console.warn('[Smith Lord Abilities] AbilityFactory not available, retrying in 1000ms...');
        setTimeout(registerSmithLordAbilities, 1000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerSmithLordAbilities);
} else {
    registerSmithLordAbilities();
}

// Also try immediate registration if AbilityFactory is already available
if (window.AbilityFactory) {
    registerSmithLordAbilities();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SmithLordAbilities,
        gearUpAbility
    };
}