// Farmer FANG Abilities

// Ability Definition: Use Potion
const fangUsePotionEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    if (!caster || caster.isDead()) {
        return { success: false };
    }
    
    const healAmount = 1550;
    const healResult = caster.heal(healAmount, caster, { abilityId: 'fang_use_potion' });
    
    log(`${caster.name} drinks a potion and heals for ${healResult.healing} HP!`, 'healing');
    
    return { success: true, healing: healResult.healing };
};

const fangUsePotionAbility = new Ability(
    'fang_use_potion',
    'Use Potion',
    'Icons/abilities/use_potion.jpeg',
    0, // mana cost
    4, // cooldown
    fangUsePotionEffect
);
fangUsePotionAbility.setTargetType('self');
fangUsePotionAbility.description = 'Farmer FANG drinks a potent potion, healing himself for 1550 HP.';

// Ability Definition: Carrot Power-up
const fangCarrotPowerupEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;
    
    if (!gameManager) {
        console.error("Game manager not found!");
        return { success: false };
    }
    
    // Get all allies excluding self
    let targets = gameManager.getAllies(caster).filter(ally => 
        !ally.isDead() && ally.id !== caster.id
    );
    
    if (targets.length === 0) {
        log(`${caster.name} tried to use Carrot Power-up, but there are no valid allies!`, 'system');
        return { success: false };
    }
    
    // Apply the buff to each ally
    let buffApplied = false;
    const buffDuration = 3;
    
    targets.forEach(ally => {
        // Create the damage multiplier buff
        const carrotBuff = new Effect(
            'fang_carrot_powerup',
            'Carrot Power-up',
            'Icons/abilities/carrot_power_up_fang.webp',
            buffDuration,
            null,
            false
        );
        
        carrotBuff.description = 'Increasing all damage dealt by 50% for 3 turns.';
        carrotBuff.statModifiers = [{ 
            stat: 'damageMultiplier', 
            value: 1.5, 
            operation: 'multiply' 
        }];
        
        ally.addBuff(carrotBuff);
        buffApplied = true;
        
        // Create VFX
        const characterElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
        if (characterElement) {
            // Add visual effect class
            characterElement.classList.add('carrot-powered');
            
            // Create VFX container
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'carrot-powerup-vfx';
            characterElement.appendChild(vfxContainer);
            
            // Create carrot particles
            for (let i = 0; i < 10; i++) {
                const particle = document.createElement('div');
                particle.className = 'carrot-particle';
                particle.style.left = `${20 + Math.random() * 60}%`;
                particle.style.animationDelay = `${Math.random() * 0.5}s`;
                vfxContainer.appendChild(particle);
            }
            
            // Clean up VFX
            setTimeout(() => {
                if (vfxContainer.parentNode) {
                    vfxContainer.remove();
                }
                characterElement.classList.remove('carrot-powered');
            }, 4000);
        }
        
        // Show floating text
        if (gameManager.uiManager) {
            gameManager.uiManager.showFloatingText(
                ally.instanceId || ally.id, 
                "Carrot Power!", 
                "buff"
            );
        }
    });
    
    if (buffApplied) {
        log(`${caster.name} empowered ${targets.length} allies with Carrot Power-up, increasing their damage by 50% for ${buffDuration} turns!`, 'buff');
        return { success: true };
    }
    
    return { success: false };
};

const fangCarrotPowerupAbility = new Ability(
    'fang_carrot_powerup',
    'Carrot Power-up',
    'Icons/abilities/carrot_power_up_fang.webp',
    0, // mana cost
    5, // cooldown
    fangCarrotPowerupEffect
);
fangCarrotPowerupAbility.setTargetType('all_allies_except_self');
fangCarrotPowerupAbility.description = 'Farmer FANG empowers all allies with magical carrots, increasing their overall damage by 50% for 3 turns.';

// Ability Definition: Corn Power Up
const fangCornPowerupEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;
    
    if (!gameManager) {
        console.error("Game manager not found!");
        return { success: false };
    }
    
    // Get all allies including self
    let targets = gameManager.getAllies(caster).filter(ally => !ally.isDead());
    
    if (targets.length === 0) {
        log(`${caster.name} tried to use Corn Power Up, but there are no valid allies!`, 'system');
        return { success: false };
    }
    
    let debuffsRemoved = false;
    let totalDebuffsRemoved = 0;
    
    // Remove all debuffs from each ally
    targets.forEach(ally => {
        const initialDebuffCount = ally.debuffs.length;
        
        if (initialDebuffCount > 0) {
            // Clear all debuffs
            ally.debuffs = [];
            totalDebuffsRemoved += initialDebuffCount;
            debuffsRemoved = true;
            
            // Create corn cleanse VFX
            const characterElement = document.getElementById(`character-${ally.instanceId || ally.id}`);
            if (characterElement) {
                const vfxContainer = document.createElement('div');
                vfxContainer.className = 'corn-cleanse-vfx';
                characterElement.appendChild(vfxContainer);
                
                // Create corn particles
                for (let i = 0; i < 8; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'corn-particle';
                    particle.style.left = `${20 + Math.random() * 60}%`;
                    particle.style.animationDelay = `${Math.random() * 0.5}s`;
                    vfxContainer.appendChild(particle);
                }
                
                // Clean up VFX
                setTimeout(() => {
                    if (vfxContainer.parentNode) {
                        vfxContainer.remove();
                    }
                }, 3000);
            }
            
            // Show floating text
            if (gameManager.uiManager) {
                gameManager.uiManager.showFloatingText(
                    ally.instanceId || ally.id, 
                    "Cleansed!", 
                    "cleanse"
                );
                
                // Update UI
                gameManager.uiManager.updateCharacterUI(ally);
            }
        }
    });
    
    if (debuffsRemoved) {
        log(`${caster.name} used Corn Power Up and removed ${totalDebuffsRemoved} debuff${totalDebuffsRemoved !== 1 ? 's' : ''} from allies!`, 'cleanse');
    } else {
        log(`${caster.name} used Corn Power Up, but there were no debuffs to remove.`, 'info');
    }
    
    return { success: true };
};

const fangCornPowerupAbility = new Ability(
    'fang_corn_powerup',
    'Corn Power Up',
    'Icons/abilities/corn_power_up.webp',
    0, // mana cost
    4, // cooldown
    fangCornPowerupEffect
);
fangCornPowerupAbility.setTargetType('all_allies');
fangCornPowerupAbility.description = 'Removes all debuffs from all allies.';

// Ability Definition: Plant Trick
const fangPlantTrickEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const gameManager = window.gameManager;
    
    if (!gameManager) {
        console.error("Game manager not found!");
        return { success: false };
    }
    
    // Get all enemies
    const enemies = gameManager.getOpponents(caster).filter(enemy => 
        !enemy.isDead() && !enemy.isUntargetable()
    );
    
    if (enemies.length === 0) {
        log(`${caster.name} tried to use Plant Trick, but there are no valid targets!`, 'system');
        return { success: false };
    }
    
    // Select a random enemy
    const randomTarget = enemies[Math.floor(Math.random() * enemies.length)];
    
    log(`${caster.name} uses Plant Trick on ${randomTarget.name}!`, 'ability');
    
    // Create Plant Trick VFX
    const targetElement = document.getElementById(`character-${randomTarget.instanceId || randomTarget.id}`);
    if (targetElement) {
        const plantVfx = document.createElement('div');
        plantVfx.className = 'plant-trick-vfx';
        targetElement.appendChild(plantVfx);
        
        // Create leaf particles
        for (let i = 0; i < 12; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.style.left = `${-20 + Math.random() * 140}%`;
            leaf.style.animationDelay = `${Math.random() * 0.8}s`;
            plantVfx.appendChild(leaf);
        }
        
        // Clean up VFX
        setTimeout(() => {
            if (plantVfx.parentNode) {
                plantVfx.remove();
            }
        }, 3500);
    }
    
    // Disable all abilities for 3 turns
    if (randomTarget.abilities && randomTarget.abilities.length > 0) {
        const disableDuration = 3;
        
        // Create a debuff for the disable effect
        const plantTrickDebuff = new Effect(
            'fang_plant_trick_disable',
            'Plant Trick: All Abilities Disabled',
            'Icons/abilities/plant_trick.webp',
            disableDuration,
            null,
            true // is debuff
        );
        
        plantTrickDebuff.description = `All abilities disabled for ${disableDuration} turns.`;
        
        // Store which abilities to disable and enable them when effect expires
        plantTrickDebuff.disabledAbilityIds = randomTarget.abilities.map(ability => ability.id);
        
        // Disable abilities when applied
        plantTrickDebuff.onApply = function(target) {
            target.abilities.forEach(ability => {
                ability.isDisabled = true;
            });
            
            if (gameManager.uiManager) {
                gameManager.uiManager.showFloatingText(
                    target.instanceId || target.id, 
                    "All Abilities Disabled!", 
                    "debuff"
                );
                gameManager.uiManager.updateCharacterUI(target);
            }
        };
        
        // Re-enable abilities when removed
        plantTrickDebuff.onRemove = function(target) {
            if (this.disabledAbilityIds && target.abilities) {
                target.abilities.forEach(ability => {
                    if (this.disabledAbilityIds.includes(ability.id)) {
                        ability.isDisabled = false;
                    }
                });
                
                log(`${target.name}'s abilities are no longer disabled by Plant Trick.`, 'info');
                
                if (gameManager.uiManager) {
                    gameManager.uiManager.updateCharacterUI(target);
                }
            }
        };
        
        randomTarget.addDebuff(plantTrickDebuff);
        
        log(`${randomTarget.name}'s abilities have been disabled for ${disableDuration} turns!`, 'debuff');
        
        if (gameManager.uiManager) {
            gameManager.uiManager.updateCharacterUI(randomTarget);
        }
        
        return { success: true };
    } else {
        log(`${randomTarget.name} has no abilities to disable!`, 'info');
        return { success: false };
    }
};

const fangPlantTrickAbility = new Ability(
    'fang_plant_trick',
    'Plant Trick',
    'Icons/abilities/plant_trick.webp',
    0, // mana cost
    4, // cooldown
    fangPlantTrickEffect
);
fangPlantTrickAbility.setTargetType('enemy');
fangPlantTrickAbility.description = 'Disables all abilities of a random enemy for 3 turns.';

// Register all abilities
if (window.AbilityFactory) {
    window.AbilityFactory.registerAbilities([
        fangUsePotionAbility,
        fangCarrotPowerupAbility, 
        fangCornPowerupAbility,
        fangPlantTrickAbility
    ]);
    console.log("[AbilityFactory] Registered Farmer FANG abilities.");
} else {
    console.error("AbilityFactory not found, cannot register Farmer FANG abilities");
} 