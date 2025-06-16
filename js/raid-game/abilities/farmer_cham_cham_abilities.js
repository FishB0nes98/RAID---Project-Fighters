// Farmer Cham Cham Abilities - Anime Cat Farmer Theme

// Assume Ability, Effect, Character classes and necessary game manager access are available

// Ability Definition: Scratch (Farmer)
const farmerScratchEffect = (caster, target) => {
    if (!target || target.isDead() || (target.isUntargetable && target.isUntargetable())) {
        return { damage: 0, success: false };
    }

    // Get the scratch ability for enhanced properties
    const scratchAbility = caster.abilities.find(a => a.id === 'farmer_scratch');
    
    const damageType = 'physical';
    let physicalDamage = Math.floor(caster.stats.physicalDamage * 1.25);
    let magicalDamage = 0;
    
    // --- Arcane Scratch Talent Enhancement ---
    if (scratchAbility?.enhancedDamage) {
        physicalDamage = Math.floor(caster.stats.physicalDamage * 1.8); // 180% physical damage
        magicalDamage = caster.stats.magicalDamage; // 100% magical damage
    }

    // --- Mana Empowerment Talent ---
    if (caster.manaEmpowerment && scratchAbility) {
        const manaCost = scratchAbility.manaCost || 0;
        const manaBonus = Math.floor(manaCost);
        physicalDamage += manaBonus;
    }
    
    // Total damage for base calculation
    let calculatedDamage = physicalDamage;
    if (magicalDamage > 0) {
        calculatedDamage += magicalDamage;
    }

    // --- NEW: Check for Hunting Mark debuff to double damage ---
    let huntingMarkConsumed = false;
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    if (scratchAbility?.consumesHuntingMark) {
        const huntingMarkDebuff = target.debuffs.find(d => 
            d.id === 'hunting_mark_debuff' && 
            (!d.sourceId || d.sourceId === (caster.instanceId || caster.id))
        );
        
        if (huntingMarkDebuff) {
            // Double the calculated damage
            calculatedDamage *= 2;
            huntingMarkConsumed = true;
            
            // Create hunting mark consume VFX
            const targetElementId = target.instanceId || target.id;
            const targetElement = document.getElementById(`character-${targetElementId}`);
            
            if (targetElement) {
                const markConsumeVfx = document.createElement('div');
                markConsumeVfx.className = 'hunting-mark-consume-vfx';
                targetElement.appendChild(markConsumeVfx);
                
                // Create hunting mark consume text
                const consumeText = document.createElement('div');
                consumeText.className = 'hunting-mark-consume-text';
                consumeText.textContent = 'MARK CONSUMED';
                markConsumeVfx.appendChild(consumeText);
                
                // Create damage multiplier indicator
                const multiplierText = document.createElement('div');
                multiplierText.className = 'hunting-mark-multiplier';
                multiplierText.textContent = 'x2 DAMAGE';
                markConsumeVfx.appendChild(multiplierText);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (markConsumeVfx.parentNode) {
                        markConsumeVfx.remove();
                    }
                }, 1500);
            }
            
            // Remove the debuff
            target.removeDebuff('hunting_mark_debuff');
            
            log(`${caster.name}'s Scratch consumes Hunting Mark on ${target.name}, dealing double damage!`, 'talent-effect');
            
            // --- NEW: Apply Predator's Focus effects ---
            if (caster.huntingMarkDodgeBuff || caster.huntingMarkCooldownReduction) {
                // Create a container for VFX
                const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
                
                // Apply dodge chance buff if talent is active
                if (caster.huntingMarkDodgeBuff) {
                    // Create a dodge chance buff
                    const predatorsDodgeBuff = new Effect(
                        'predators_focus_dodge_buff',
                        'Predator\'s Focus',
                        'Icons/talents/predators_focus.webp',
                        3, // 3 turns duration
                        null,
                        false // Not a debuff
                    );
                    
                    // Set description and stat modifiers
                    predatorsDodgeBuff.description = 'Increases dodge chance by 50% after consuming a Hunting Mark.';
                    predatorsDodgeBuff.statModifiers = [{
                        stat: 'dodgeChance',
                        value: 0.5,
                        operation: 'add'
                    }];
                    
                    // Apply the buff
                    caster.addBuff(predatorsDodgeBuff);
                    
                    log(`${caster.name}'s Predator's Focus increases dodge chance by 50% for 3 turns!`, 'talent-effect');
                    
                    // Show VFX
                    if (casterElement) {
                        const dodgeVfx = document.createElement('div');
                        dodgeVfx.className = 'predators-focus-dodge-vfx';
                        dodgeVfx.innerHTML = '<span>+50% DODGE</span>';
                        casterElement.appendChild(dodgeVfx);
                        
                        setTimeout(() => {
                            if (dodgeVfx.parentNode) {
                                dodgeVfx.remove();
                            }
                        }, 2000);
                    }
                }
                
                // Apply cooldown reduction if talent is active
                if (caster.huntingMarkCooldownReduction) {
                    // Reduce all ability cooldowns by 1
                    let abilitiesReduced = 0;
                    
                    caster.abilities.forEach(ability => {
                        if (ability.currentCooldown > 0) {
                            console.log(`[PredatorFocus DEBUG] Before reduce: ${ability.name} cooldown is ${ability.currentCooldown}`); // Log before
                            ability.reduceCooldown();
                            console.log(`[PredatorFocus DEBUG] After reduce: ${ability.name} cooldown is ${ability.currentCooldown}`); // Log after
                            abilitiesReduced++;
                            
                            // Add visual feedback
                            if (casterElement) {
                                const abilityElements = casterElement.querySelectorAll('.ability');
                                abilityElements.forEach((abilityEl, index) => {
                                    if (index < caster.abilities.length && 
                                        caster.abilities[index].id === ability.id) {
                                        // Add cooldown reduced effect
                                        abilityEl.classList.add('cooldown-reduced');
                                        
                                        // Remove class after animation
                                        setTimeout(() => {
                                            abilityEl.classList.remove('cooldown-reduced');
                                        }, 1000);
                                    }
                                });
                            }
                        }
                    });
                    
                    if (abilitiesReduced > 0) {
                        log(`${caster.name}'s Predator's Focus reduced the cooldown of ${abilitiesReduced} abilities by 1 turn!`, 'talent-effect');
                        
                        // Show cooldown reduction VFX
                        if (casterElement) {
                            const cooldownVfx = document.createElement('div');
                            cooldownVfx.className = 'predators-focus-cooldown-vfx';
                            cooldownVfx.innerHTML = '<span>COOLDOWNS -1</span>';
                            casterElement.appendChild(cooldownVfx);
                            
                            setTimeout(() => {
                                if (cooldownVfx.parentNode) {
                                    cooldownVfx.remove();
                                }
                            }, 2000);
                        }
                    }
                }
            }
            // --- END NEW ---
        }
    }
    // --- END NEW ---

    // --- Check for Armor Piercing Claws talent ---
    const bypassArmor = scratchAbility?.bypassesArmor || false;
    const options = {
        bypassArmor: bypassArmor,
        abilityId: 'farmer_scratch' // Add ability ID for statistics tracking
    };

    // If we're bypassing armor, show a VFX to indicate this
    if (bypassArmor) {
        // Log the armor bypass effect
        log(`${caster.name}'s Armor Piercing Claws bypass ${target.name}'s armor!`, 'talent-effect');
        
        // Add visual effect for armor piercing if desired
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (targetElement) {
            // Create a simple armor break VFX
            const armorBreakVfx = document.createElement('div');
            armorBreakVfx.className = 'armor-pierce-vfx';
            armorBreakVfx.textContent = 'ARMOR BYPASSED';
            armorBreakVfx.style.position = 'absolute';
            armorBreakVfx.style.top = '50%';
            armorBreakVfx.style.left = '50%';
            armorBreakVfx.style.transform = 'translate(-50%, -50%)';
            armorBreakVfx.style.color = '#ff9d00';
            armorBreakVfx.style.fontWeight = 'bold';
            armorBreakVfx.style.fontSize = '18px';
            armorBreakVfx.style.textShadow = '0 0 5px #ff0000';
            armorBreakVfx.style.zIndex = '10';
            armorBreakVfx.style.animation = 'floatUpFade 1.5s ease-out forwards';
            targetElement.appendChild(armorBreakVfx);
            
            setTimeout(() => {
                if (armorBreakVfx.parentNode) {
                    armorBreakVfx.remove();
                }
            }, 1500);
        }
    }
    // --- End Armor Piercing logic ---

    // Apply damage to target with options
    const damageDealt = target.applyDamage(calculatedDamage, damageType, caster, options);
    
    // Create result object to return (this is needed for the acted flag)
    const physResult = {
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        success: true, // This flag indicates the ability was used successfully
        predatorFocusCooldownReduced: huntingMarkConsumed && caster.huntingMarkCooldownReduction // Indicate if we reduced cooldowns
    };
    
    // Log the ability use
    if (damageDealt.isCritical) {
        log(`${caster.name}'s Scratch critically hits ${target.name} for ${damageDealt.damage} damage!`, 'critical');
    } else {
        log(`${caster.name} scratches ${target.name} for ${damageDealt.damage} damage!`);
    }

    // --- Cat Claws Talent: Apply Bleeding Debuff ---
    if (scratchAbility?.appliesBleedingDebuff && !target.isDead()) {
        // Check for existing bleeding debuff
        const existingBleedingDebuff = target.debuffs.find(debuff => debuff.id === 'cat_claws_bleeding');
        
        if (existingBleedingDebuff) {
            // Increment stacks if debuff already exists
            existingBleedingDebuff.currentStacks = (existingBleedingDebuff.currentStacks || 1) + 1;
            
            // Update description with new stack count
            updateBleedingDescription(existingBleedingDebuff);
            
            log(`${caster.name}'s Cat Claws increases bleeding on ${target.name} to ${existingBleedingDebuff.currentStacks} stacks!`, 'talent-effect');
            
            // Update stack counter badge if it exists
            updateBleedingStackBadge(target, existingBleedingDebuff.currentStacks);
        } else {
            // Create and apply a new bleeding debuff
            const bleedingDebuff = new Effect(
                'cat_claws_bleeding',
                'Bleeding',
                'Icons/effects/bleeding.webp',
                -1, // Permanent (-1)
                null, // No per-turn effect function (handled by processEffects)
                true // Is a debuff
            );
            
            // Set debuff properties
            bleedingDebuff.description = `Deals 20 damage per stack at the end of each turn.`;
            bleedingDebuff.stackable = true;
            bleedingDebuff.currentStacks = 1;
            bleedingDebuff.maxStacks = 99; // Very high max stacks
            
            // Add damage over time effect
            bleedingDebuff.effect = {
                type: 'damage_over_time',
                value: 20 // Base damage per stack
            };
            
            // Add custom onApply to create the stack counter
            bleedingDebuff.onApply = function(character) {
                // Set description with stack information
                const stacks = this.currentStacks || 1;
                const damagePerStack = 20;
                const totalDamage = stacks * damagePerStack;
                this.description = `Deals ${damagePerStack} damage per stack (${totalDamage} total) at the end of each turn.`;
                
                // Create the stack badge
                createBleedingStackBadge(character, stacks);
                return true; // Return true to allow the buff to be applied
            };
            
            // Add special onTurnEnd handler to apply damage based on stacks
            bleedingDebuff.onTurnEnd = function(character) {
                const stacks = this.currentStacks || 1;
                const bleedDamage = stacks * 20; // 20 damage per stack
                
                // Apply damage directly to HP
                const originalHp = character.stats.currentHp;
                character.stats.currentHp = Math.max(0, character.stats.currentHp - bleedDamage);
                const actualDamage = originalHp - character.stats.currentHp;
                
                // Log the effect
                const logFn = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                logFn(`${character.name} bleeds for ${actualDamage} damage from Cat Claws (${stacks} stacks)!`, 'debuff-effect');
                
                // Show bleeding VFX with stack counter
                showBleedingVFX(character, stacks, actualDamage);
                
                // Update UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(character);
                }
                
                // Check if target died from bleeding
                if (character.stats.currentHp <= 0) {
                    logFn(`${character.name} has succumbed to bleeding!`, 'death');
                    if (window.gameManager) {
                        window.gameManager.handleCharacterDeath(character);
                    }
                }
            };
            
            // Apply the debuff
            target.addDebuff(bleedingDebuff);
            log(`${caster.name}'s Cat Claws inflicts Bleeding on ${target.name}!`, 'talent-effect');
        }
    }
    // --- End Cat Claws Talent ---

    // Frenzied Assault talent check
    if (scratchAbility && scratchAbility.frenziedAssaultChance) {
        const frenziedChance = scratchAbility.frenziedAssaultChance;
        if (Math.random() < frenziedChance) {
            log(`${caster.name}'s Frenzied Assault triggers Scratch a second time!`, 'talent-effect');
            
            // Create frenzied effect VFX
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            if (targetElement) {
                const frenziedVFX = document.createElement('div');
                frenziedVFX.className = 'frenzied-assault-vfx';
                targetElement.appendChild(frenziedVFX);
                
                // Remove VFX after animation
                setTimeout(() => {
                    if (frenziedVFX.parentNode === targetElement) {
                        frenziedVFX.remove();
                    }
                }, 1000);
            }
            
            // Trigger a second damage instance with the same options
            const secondDamage = target.applyDamage(calculatedDamage, damageType, caster, options);
            if (secondDamage.isCritical) {
                log(`${caster.name}'s second Scratch critically hits ${target.name} for ${secondDamage.damage} damage!`, 'critical');
            } else {
                log(`${caster.name}'s second Scratch hits ${target.name} for ${secondDamage.damage} damage!`);
            }
            
            // Update the result with combined damage info
            physResult.damage += secondDamage.damage;
            physResult.isCritical = physResult.isCritical || secondDamage.isCritical;
            
            // --- Cat Claws: Apply second stack of bleeding if talent is active ---
            if (scratchAbility?.appliesBleedingDebuff && !target.isDead()) {
                const existingBleedingDebuff = target.debuffs.find(debuff => debuff.id === 'cat_claws_bleeding');
                
                if (existingBleedingDebuff) {
                    // Increment stacks for the second hit
                    existingBleedingDebuff.currentStacks = (existingBleedingDebuff.currentStacks || 1) + 1;
                    
                    // Update description with new stack count
                    updateBleedingDescription(existingBleedingDebuff);
                    
                    log(`${caster.name}'s second hit increases bleeding on ${target.name} to ${existingBleedingDebuff.currentStacks} stacks!`, 'talent-effect');
                    
                    // Update stack counter badge
                    updateBleedingStackBadge(target, existingBleedingDebuff.currentStacks);
                }
                // No need to create a new debuff since it would have been created by the first hit
            }
            // --- End Cat Claws second application ---
        }
    }

    return physResult;
};

// Helper function to create bleeding stack badge on the status icon
function createBleedingStackBadge(character, stacks) {
    setTimeout(() => {
        // Find the bleeding status icon in the character's UI
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        const statusIcons = characterElement.querySelectorAll('.status-icon[title*="Bleeding"]');
        statusIcons.forEach(icon => {
            // Check if badge already exists
            if (!icon.querySelector('.bleeding-stack-badge')) {
                const badge = document.createElement('div');
                badge.className = 'bleeding-stack-badge';
                badge.textContent = stacks;
                icon.appendChild(badge);
            }
        });
    }, 100); // Small delay to ensure the icon is rendered
}

// Helper function to update the bleeding stack badge
function updateBleedingStackBadge(character, stacks) {
    setTimeout(() => {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;
        
        const statusIcons = characterElement.querySelectorAll('.status-icon[title*="Bleeding"]');
        statusIcons.forEach(icon => {
            let badge = icon.querySelector('.bleeding-stack-badge');
            if (badge) {
                badge.textContent = stacks;
                // Add a quick animation to highlight the change
                badge.classList.remove('update-stack');
                void badge.offsetWidth; // Trigger reflow
                badge.classList.add('update-stack');
            } else {
                // Create badge if it doesn't exist
                createBleedingStackBadge(character, stacks);
            }
            
            // Update the tooltip title to include stack count
            const debuff = character.debuffs.find(d => d.id === 'cat_claws_bleeding');
            if (debuff) {
                updateBleedingDescription(debuff);
                icon.setAttribute('title', `${debuff.name} (${stacks} stacks): ${debuff.description}`);
            }
        });
    }, 100);
}

// Helper function to update the bleeding description
function updateBleedingDescription(debuff) {
    const stacks = debuff.currentStacks || 1;
    const damagePerStack = 20;
    const totalDamage = stacks * damagePerStack;
    debuff.description = `Deals ${damagePerStack} damage per stack (${totalDamage} total) at the end of each turn.`;
    return debuff.description;
}

// Helper function to show the bleeding VFX with stack counter
function showBleedingVFX(character, stacks, damage) {
    const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!targetElement) return;
    
    // Create bleeding VFX container
    const bleedVFX = document.createElement('div');
    bleedVFX.className = 'cat-claws-bleed-vfx';
    
    // Add intensity class based on stack count
    if (stacks >= 10) {
        bleedVFX.classList.add('very-high-stacks');
    } else if (stacks >= 5) {
        bleedVFX.classList.add('high-stacks');
    }
    
    targetElement.appendChild(bleedVFX);
    
    // Add stack counter
    const stackCounter = document.createElement('div');
    stackCounter.className = 'bleeding-stack-counter';
    stackCounter.textContent = `x${stacks}`;
    bleedVFX.appendChild(stackCounter);
    
    // Add dynamic blood drops based on stack count
    const numDrops = Math.min(Math.floor(stacks / 2) + 2, 10); // Scale drops with stacks, cap at 10
    
    for (let i = 0; i < numDrops; i++) {
        const bloodDrop = document.createElement('div');
        bloodDrop.className = 'blood-drop';
        
        // Random size based on stacks
        const size = 5 + Math.random() * 3 * Math.min(stacks / 3, 3);
        bloodDrop.style.width = `${size}px`;
        bloodDrop.style.height = `${size * 1.3}px`; // Make drops slightly elongated
        
        // Random position
        const left = 20 + Math.random() * 60; // 20-80% horizontal position
        const top = 20 + Math.random() * 40; // 20-60% vertical start position
        bloodDrop.style.left = `${left}%`;
        bloodDrop.style.top = `${top}%`;
        
        // Random animation delay
        bloodDrop.style.animationDelay = `${Math.random() * 0.5}s`;
        
        bleedVFX.appendChild(bloodDrop);
    }
    
    // Add floating damage number
    const damageText = document.createElement('div');
    damageText.className = 'bleed-damage-text';
    
    // Make text larger for higher damage
    if (damage > 100) {
        damageText.style.fontSize = '32px';
        damageText.style.fontWeight = '900';
    } else if (damage > 50) {
        damageText.style.fontSize = '28px';
        damageText.style.fontWeight = '800';
    }
    
    damageText.textContent = `-${damage}`;
    targetElement.appendChild(damageText);
    
    // Remove VFX after animation
    setTimeout(() => {
        if (bleedVFX.parentNode === targetElement) {
            bleedVFX.remove();
        }
        if (damageText.parentNode === targetElement) {
            damageText.remove();
        }
    }, 1500);
}

// Create the Scratch ability
const farmerScratchAbility = new Ability(
    'farmer_scratch',              // id
    'Scratch (Farmer Version)',    // name
    'Icons/abilities/scratch_farmer.jpeg', // icon
    30,                            // mana cost
    2,                             // cooldown
    farmerScratchEffect            // effect function
);

// Set base description
farmerScratchAbility.baseDescription = 'Scratches the target with your cat claws, dealing 125% Physical Damage.';

// Add custom generateDescription method
farmerScratchAbility.generateDescription = function() {
    let description = this.baseDescription;
    
    // Add Arcane Scratch talent info if present
    if (this.enhancedDamage) {
        description += `\n<span class="talent-effect damage">Arcane Scratch: Deals 180% Physical + 100% Magical Damage instead.</span>`;
    }
    
    // Add Cat Claws talent info if present
    if (this.appliesBleedingDebuff) {
        description += `\n<span class="talent-effect damage">Cat Claws: Applies a permanent bleeding debuff that deals 20 damage per stack at the end of each turn.</span>`;
    }
    
    // Add Hunting Mark consumption info if present
    if (this.consumesHuntingMark) {
        description += `\n<span class="talent-effect damage">Hunting Mark: Deals double damage to marked targets and consumes the mark.</span>`;
        
        // Add Predator's Focus talent info if character has this property
        if (this.character && (this.character.huntingMarkDodgeBuff || this.character.huntingMarkCooldownReduction)) {
            description += `\n<span class="talent-effect utility">Predator's Focus: Consuming Hunting Mark grants 50% dodge chance for 3 turns and reduces all ability cooldowns by 1.</span>`;
        }
    }
    
    // Add Mana Empowerment info if the character has that talent
    if (this.character && this.character.manaEmpowerment) {
        description += `\n<span class="talent-effect damage">Mana Empowerment: Also deals bonus damage equal to the ability's mana cost (${this.manaCost}).</span>`;
    }
    
    // Add Frenzied Assault talent info if present
    if (this.frenziedAssaultChance) {
        description += `\n<span class="talent-effect damage">Frenzied Assault: ${this.frenziedAssaultChance * 100}% chance to trigger this ability a second time.</span>`;
    }
    
    return description;
};

farmerScratchAbility.description = farmerScratchAbility.generateDescription(); // Generate initial description
farmerScratchAbility.setTargetType('enemy');

// Register the ability with the factory
if (window.AbilityFactory) {
    window.AbilityFactory.registerAbilities([farmerScratchAbility]);
} else {
    console.error("AbilityFactory not found, cannot register farmerScratchAbility");
}

// Ability Definition: Leap (Farmer Version)
const farmerLeapEffect = (caster, target) => { // Target is not used but kept for consistency
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Leap (Farmer Version)!`);
    // playSound('sounds/cat_jump.mp3', 0.7); // TODO: Add sound

    const buffDuration = 4;

    // 1. Dodge Buff
    const dodgeBuff = new Effect(
        'farmer_leap_dodge_buff',
        'Leap Dodge',
        'Icons/abilities/leap_farmer.jpeg', // Use ability icon
        buffDuration,
        null, // Effect logic handled by Character.recalculateStats
        false // Is not a debuff
    ).setDescription('Increased agility grants 50% dodge chance.');
    // Use statModifiers for proper stat modification
    dodgeBuff.statModifiers = [{ stat: 'dodgeChance', value: 0.5, operation: 'add' }];
    caster.addBuff(dodgeBuff.clone()); // Apply a clone to avoid mutation issues
    log(`${caster.name} gains 50% Dodge Chance for ${buffDuration} turns.`);

    // 2. Physical Damage Buff
    // Calculate bonus damage based on BASE physical damage
    const bonusPhysDamage = Math.floor((caster.baseStats.physicalDamage || 0) * 0.50);
    const physDamageBuff = new Effect(
        'farmer_leap_phys_buff',
        'Leap Power',
        'Icons/abilities/leap_farmer.jpeg', // Use ability icon
        buffDuration,
        null, // Effect logic handled by Character.recalculateStats
        false // Is not a debuff
    ).setDescription(`Empowered stance increases Physical Damage by ${bonusPhysDamage} (50% base).`);
    physDamageBuff.statModifiers = [{ stat: 'physicalDamage', value: bonusPhysDamage, operation: 'add' }];
    caster.addBuff(physDamageBuff.clone()); // Apply a clone
    log(`${caster.name} gains +${bonusPhysDamage} Physical Damage for ${buffDuration} turns.`);
    
    // 3. Lifesteal Buff (Added by Vampiric Leap talent)
    const leapAbility = caster.abilities.find(a => a.id === "farmer_leap");
    if (leapAbility?.additionalLifestealBuff) {
        const additionalLifesteal = leapAbility.additionalLifestealBuff;
        const lifestealBuff = new Effect(
            'farmer_leap_lifesteal_buff',
            'Vampiric Leap',
            'Icons/talents/vampiric_leap.webp',
            buffDuration,
            null,
            false
        ).setDescription(`Grants an additional ${additionalLifesteal * 100}% lifesteal from damage dealt.`);
        lifestealBuff.statModifiers = [{ stat: 'lifesteal', value: additionalLifesteal, operation: 'add' }];
        caster.addBuff(lifestealBuff.clone());
        log(`${caster.name} gains ${additionalLifesteal * 100}% Lifesteal for ${buffDuration} turns from Vampiric Leap!`, 'talent-effect');
    }

    // 4. Magical Damage Buff (Added by Arcane Leap talent)
    if (leapAbility?.arcaneLeapMagicalBuff) {
        // Calculate bonus based on CURRENT magical damage
        const bonusMagicalDamage = Math.floor((caster.stats.magicalDamage || 0) * 0.50);
        
        if (bonusMagicalDamage > 0) {
            const magicDamageBuff = new Effect(
                'farmer_leap_magic_buff',
                'Arcane Leap',
                'Icons/talents/arcane_leap.webp',
                buffDuration,
                null,
                false
            ).setDescription(`Arcane energy grants +${bonusMagicalDamage} Magical Damage (50% current).`);
            
            magicDamageBuff.statModifiers = [{ stat: 'magicalDamage', value: bonusMagicalDamage, operation: 'add' }];
            caster.addBuff(magicDamageBuff.clone());
            log(`${caster.name} gains +${bonusMagicalDamage} Magical Damage for ${buffDuration} turns from Arcane Leap!`, 'talent-effect');
            
            // Add an arcane glow effect when both buffs are applied
            setTimeout(() => {
                const casterElementId = caster.instanceId || caster.id;
                const casterElement = document.getElementById(`character-${casterElementId}`);
                
                if (casterElement) {
                    const arcaneGlow = document.createElement('div');
                    arcaneGlow.className = 'arcane-leap-glow';
                    casterElement.appendChild(arcaneGlow);
                    
                    setTimeout(() => {
                        arcaneGlow.remove();
                    }, 1500);
                }
            }, 300); // Add after the main leap effect starts
        }
    }

    // Add VFX
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    if (casterElement) {
        // Leap animation with anime style
        casterElement.classList.add('farmer-leap-animation');
        
        // Add cat ears (anime style)
        const catEars = document.createElement('div');
        catEars.className = 'cat-ears';
        casterElement.appendChild(catEars);
        
        // Add cat tail (anime style)
        const catTail = document.createElement('div');
        catTail.className = 'cat-tail';
        casterElement.appendChild(catTail);
        
        // Add dust clouds for anime-style jump
        const leapDust = document.createElement('div');
        leapDust.className = 'farmer-leap-dust';
        casterElement.appendChild(leapDust);
        
        // Add veggie particles container
        const veggieContainer = document.createElement('div');
        veggieContainer.className = 'farmer-leap-veggies';
        casterElement.appendChild(veggieContainer);
        
        // Create veggie particles (bouncing vegetables)
        const veggieTypes = ['carrot', 'tomato', 'lettuce'];
        for (let i = 0; i < 8; i++) {
            const veggie = document.createElement('div');
            veggie.className = `veggie-particle ${veggieTypes[i % veggieTypes.length]}`;
            
            // Set random positions and rotations
            const x = (Math.random() * 200 - 100); // -100 to 100px
            const y = (Math.random() * -150) - 50; // -50 to -200px (upward)
            const r = Math.random() * 720 - 360; // -360 to 360 degrees
            
            veggie.style.setProperty('--x', `${x}px`);
            veggie.style.setProperty('--y', `${y}px`);
            veggie.style.setProperty('--r', `${r}deg`);
            
            // Position randomly
            veggie.style.top = '50%';
            veggie.style.left = `${30 + Math.random() * 40}%`; // 30% to 70%
            
            // Add animation with delay
            veggie.style.animation = `veggie-bounce 1s ease-out ${i * 0.1}s forwards`;
            
            veggieContainer.appendChild(veggie);
        }

        // Buff glow VFX with anime theme
        const buffGlow = document.createElement('div');
        buffGlow.className = 'farmer-leap-buff-glow-vfx';
        const imageContainer = casterElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.appendChild(buffGlow);
        }

        // Clean up elements after animation
        setTimeout(() => {
            if (catEars.parentNode) catEars.remove();
            if (catTail.parentNode) catTail.remove();
            if (leapDust.parentNode) leapDust.remove();
            if (veggieContainer.parentNode) veggieContainer.remove();
            casterElement.classList.remove('farmer-leap-animation');
        }, 1200);
    }
};

const farmerLeapAbility = new Ability(
    'farmer_leap',                  // id
    'Leap (Farmer Version)',        // name
    'Icons/abilities/leap_farmer.jpeg', // icon (Placeholder)
    70,                             // manaCost
    10,                             // cooldown
    farmerLeapEffect                // effect function
);
// Set base description separately for clarity
farmerLeapAbility.baseDescription = 'Leaps into an agile stance, gaining 50% Dodge Chance and 50% bonus Physical Damage for 4 turns.';
farmerLeapAbility.description = farmerLeapAbility.generateDescription(); // Generate initial description
farmerLeapAbility.setTargetType('self'); // This ability targets the caster

// Add custom generateDescription method to handle the talent changes
farmerLeapAbility.generateDescription = function() {
    let description = this.baseDescription;
    
    // Add Vampiric Leap talent description
    if (this.additionalLifestealBuff) {
        description += `\n<span class="talent-effect healing">Vampiric Leap: Grants ${this.additionalLifestealBuff * 100}% additional Lifesteal for 4 turns.</span>`;
    }
    
    // Add Arcane Leap talent description
    if (this.arcaneLeapMagicalBuff) {
        description += `\n<span class="talent-effect damage">Arcane Leap: Also increases Magical Damage by 50% of current value for 4 turns.</span>`;
    }
    
    return description;
};

// Ability Definition: Boomerang (Farmer Version)
const farmerBoomerangEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name} tries to throw a Boomerang, but the target is invalid.`);
        return;
    }

    log(`${caster.name} throws a Boomerang (Farmer Version) at ${target.name}!`);
    // playSound('sounds/cat_boomerang.mp3', 0.7); // TODO: Add sound

    // Damage Calculation (250% Physical Damage)
    const damageMultiplier = 2.5;
    let physicalDamage = Math.floor((caster.stats.physicalDamage || 0) * damageMultiplier);
    
    // Check for Arcane Awakening talent (magical damage scaling)
    const boomerangAbility = caster.abilities.find(a => a.id === "farmer_boomerang");
    const magicalDamageScaling = boomerangAbility?.magicalDamageScaling;
    let magicalDamage = 0;
    
    if (magicalDamageScaling && caster.stats.magicalDamage > 0) {
        magicalDamage = Math.floor((caster.stats.magicalDamage || 0) * magicalDamageScaling);
        log(`${caster.name}'s Arcane Awakening adds magical power to the Boomerang!`, 'talent-effect');
    }

    // Apply Mana Empowerment talent bonus damage if active
    if (caster.manaEmpowerment && boomerangAbility) {
        const manaCost = boomerangAbility.manaCost || 50;
        physicalDamage += manaCost;
        
        // Create mana empowerment VFX
        const casterElementId = caster.instanceId || caster.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        if (casterElement) {
            const manaEmpowermentVfx = document.createElement('div');
            manaEmpowermentVfx.className = 'mana-empowerment-vfx';
            manaEmpowermentVfx.textContent = `+${manaCost} DMG`;
            manaEmpowermentVfx.style.left = `${40 + Math.random() * 20}%`;
            manaEmpowermentVfx.style.top = `${40 + Math.random() * 20}%`;
            casterElement.appendChild(manaEmpowermentVfx);
            
            setTimeout(() => {
                if (manaEmpowermentVfx.parentNode) {
                    manaEmpowermentVfx.remove();
                }
            }, 1500);
        }
        
        log(`${caster.name}'s Mana Empowerment adds ${manaCost} damage!`, 'talent-effect');
    }
    
    const totalDamagePerHit = physicalDamage + magicalDamage;

    // Check for Multi-Boomerang talent
    const extraHitsChance = boomerangAbility?.extraHitsChance;
    const willPerformExtraHits = extraHitsChance && Math.random() <= extraHitsChance;
    const totalHits = willPerformExtraHits ? 4 : 2;
    
    if (willPerformExtraHits) {
        log(`${caster.name}'s Multi-Boomerang activates for ${totalHits} total hits!`, 'talent-effect');
    }

    // Apply VFX
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    
    if (targetElement && casterElement) {
        // Create cat-themed boomerang VFX
        const boomerangVfx = document.createElement('div');
        boomerangVfx.className = 'farmer-boomerang-vfx';
        
        // Add magical effect class if magical damage is added
        if (magicalDamage > 0) {
            boomerangVfx.classList.add('arcane-boomerang');
        }
        
        document.body.appendChild(boomerangVfx);
        
        // Position and animate the boomerang
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Set initial position at caster
        boomerangVfx.style.left = `${casterRect.left + casterRect.width/2 - 25}px`; // Center horizontally
        boomerangVfx.style.top = `${casterRect.top + casterRect.height/2 - 25}px`; // Center vertically
        
        // Helper function to create paw print trails
        const createPawPrint = (x, y, delay) => {
            const pawPrint = document.createElement('div');
            pawPrint.className = 'paw-print';
            
            // Add magical effect if magical damage is added
            if (magicalDamage > 0) {
                pawPrint.classList.add('arcane-paw-print');
            }
            
            pawPrint.style.left = `${x}px`;
            pawPrint.style.top = `${y}px`;
            pawPrint.style.opacity = '0';
            document.body.appendChild(pawPrint);
            
            // Fade in and out with delay
            setTimeout(() => {
                pawPrint.style.opacity = '0.7';
                setTimeout(() => {
                    pawPrint.style.opacity = '0';
                    setTimeout(() => {
                        if (pawPrint.parentNode) {
                            pawPrint.remove();
                        }
                    }, 300);
                }, 300);
            }, delay);
        };
        
        // Helper function to create sparkles
        const createSparkle = (x, y) => {
            const sparkle = document.createElement('div');
            sparkle.className = 'boomerang-sparkle';
            
            // Add magical effect if magical damage is added
            if (magicalDamage > 0) {
                sparkle.classList.add('arcane-sparkle');
            }
            
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            document.body.appendChild(sparkle);
            
            // Remove after animation completes
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 500);
        };
        
        // Begin the animation sequence
        setTimeout(() => {
            // Add animation class for throw
            boomerangVfx.classList.add('throw');
            
            // Calculate target position
            const targetX = targetRect.left + targetRect.width/2 - 25; // Center horizontally
            const targetY = targetRect.top + targetRect.height/2 - 25; // Center vertically
            
            // Set transform for animation
            boomerangVfx.style.transform = `translate(${targetX - casterRect.left - casterRect.width/2 + 25}px, ${targetY - casterRect.top - casterRect.height/2 + 25}px) rotate(1080deg)`;
            
            // Create paw prints along the path
            const pathPoints = 5;
            for (let i = 0; i < pathPoints; i++) {
                // Calculate position along the path
                const ratio = i / (pathPoints - 1);
                const x = casterRect.left + casterRect.width/2 + (targetX - casterRect.left - casterRect.width/2 + 25) * ratio;
                const y = casterRect.top + casterRect.height/2 + (targetY - casterRect.top - casterRect.height/2 + 25) * ratio;
                
                // Create paw print with delay
                createPawPrint(x, y, ratio * 400);
                
                // Create sparkle randomly along the path
                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        createSparkle(x + (Math.random() * 30 - 15), y + (Math.random() * 30 - 15));
                    }, ratio * 400 + Math.random() * 200);
                }
            }
            
            // Register hit after delay (timed to match animation)
            setTimeout(() => {
                // First hit
                if (!target.isDead()) {
                    // Apply damage
                    const damageResult = target.applyDamage(totalDamagePerHit, 'physical', caster, { abilityId: 'farmer_boomerang' });
                    
                    // Log hit
                    if (damageResult.isCritical) {
                        log(`${caster.name}'s Boomerang critically hits ${target.name} for ${damageResult.damage} damage!`, 'critical');
                    } else {
                        log(`${caster.name}'s Boomerang hits ${target.name} for ${damageResult.damage} damage!`);
                    }
                    
                    // Create impact effect
                    const impactVfx = document.createElement('div');
                    impactVfx.className = 'boomerang-impact';
                    
                    // Add magical effect if magical damage is added
                    if (magicalDamage > 0) {
                        impactVfx.classList.add('arcane-impact');
                    }
                    
                    targetElement.appendChild(impactVfx);
                    
                    // Remove impact after animation completes
                    setTimeout(() => {
                        if (impactVfx.parentNode) {
                            impactVfx.remove();
                        }
                    }, 500);
                    
                    // Return animation after hit
                boomerangVfx.classList.remove('throw');
                boomerangVfx.classList.add('return');
                    
                    // Reset transform for return animation
                    boomerangVfx.style.transform = `translate(0, 0) rotate(-1080deg)`;
                    
                    // Second hit
                setTimeout(() => {
                    if (!target.isDead()) {
                            // Apply second hit damage
                            const secondDamageResult = target.applyDamage(totalDamagePerHit, 'physical', caster, { abilityId: 'farmer_boomerang' });
                            
                            // Log second hit
                            if (secondDamageResult.isCritical) {
                                log(`${caster.name}'s Boomerang critically hits ${target.name} again for ${secondDamageResult.damage} damage!`, 'critical');
                        } else {
                                log(`${caster.name}'s Boomerang hits ${target.name} again for ${secondDamageResult.damage} damage!`);
                        }
                        
                        // Create second impact effect
                            const secondImpactVfx = document.createElement('div');
                            secondImpactVfx.className = 'boomerang-impact';
                        
                        // Add magical effect if magical damage is added
                        if (magicalDamage > 0) {
                                secondImpactVfx.classList.add('arcane-impact');
                            }
                            
                            targetElement.appendChild(secondImpactVfx);
                            
                            // Remove second impact after animation completes
                        setTimeout(() => {
                                if (secondImpactVfx.parentNode) {
                                    secondImpactVfx.remove();
                                }
                            }, 500);
                            
                            // Check for Multi-Boomerang bonus hits (talent ability)
                            if (willPerformExtraHits) {
                                let hitCount = 2; // Already did 2 hits
                                
                                // Function to execute remaining hits
                                const executeExtraHit = () => {
                                    if (hitCount < totalHits && !target.isDead()) {
                                        // Apply damage for extra hit
                                        const extraHitResult = target.applyDamage(totalDamagePerHit, 'physical', caster, { abilityId: 'farmer_boomerang' });
                                        
                                        // Log extra hit
                                        if (extraHitResult.isCritical) {
                                            log(`${caster.name}'s Multi-Boomerang critically hits ${target.name} for ${extraHitResult.damage} additional damage!`, 'critical');
                                } else {
                                            log(`${caster.name}'s Multi-Boomerang hits ${target.name} for ${extraHitResult.damage} additional damage!`);
                                        }
                                        
                                        // Create impact for extra hit
                                        const extraImpactVfx = document.createElement('div');
                                        extraImpactVfx.className = 'boomerang-impact';
                                        extraImpactVfx.style.transform = `translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px)`;
                                        
                                if (magicalDamage > 0) {
                                            extraImpactVfx.classList.add('arcane-impact');
                                        }
                                        
                                        targetElement.appendChild(extraImpactVfx);
                                        
                                        // Remove extra impact after animation
                                setTimeout(() => {
                                            if (extraImpactVfx.parentNode) {
                                                extraImpactVfx.remove();
                                            }
                                        }, 500);
                                        
                                        // Increment hit counter
                                        hitCount++;
                                        
                                        // Schedule next hit if needed
                                        if (hitCount < totalHits) {
                                            setTimeout(executeExtraHit, 300);
                                        } else {
                                            // Final hit completed, apply Hunting Mark after all damage
                                            applyHuntingMarkIfActive();
                                        }
                                    } else {
                                        // No more hits needed, apply Hunting Mark
                                        applyHuntingMarkIfActive();
                                    }
                                };
                                
                                // Start executing extra hits
                                setTimeout(executeExtraHit, 300);
                                        } else {
                                // No extra hits, apply Hunting Mark after the two standard hits
                                applyHuntingMarkIfActive();
                            }
                        }
                    }, 700); // Timing for second hit
                }
                
                // Clean up the VFX after animation completes
                    setTimeout(() => {
                        if (boomerangVfx.parentNode) {
                            boomerangVfx.remove();
                        }
                }, 1400);
            }, 500); // Timing for first hit
        }, 100);
    }
    
    // --- NEW: Apply Hunting Mark debuff if talent is active ---
    function applyHuntingMarkIfActive() {
        if (!target.isDead() && boomerangAbility?.appliesHuntingMark) {
            // Check for existing Hunting Mark to refresh it
            const existingMark = target.debuffs.find(d => d.id === 'hunting_mark_debuff');
            
            if (existingMark) {
                // Refresh the existing mark duration
                existingMark.duration = 3;
                log(`${caster.name}'s Boomerang refreshes the Hunting Mark on ${target.name}!`, 'talent-effect');
    } else {
                // Create new Hunting Mark debuff
                const huntingMark = new window.Effect(
                    'hunting_mark_debuff',
                    'Hunting Mark',
                    'Icons/effects/hunting_mark.webp',
                    3, // 3 turns duration
                    null, // No per-turn effect function
                    true // Is a debuff
                );
                
                // Add description
                huntingMark.description = `The next Scratch from Cham Cham deals double damage to this target and consumes the mark.`;
                
                // Store the source caster ID to ensure only the right Cham Cham can consume it
                huntingMark.sourceId = caster.instanceId || caster.id;
                
                // Apply visual styling for this debuff through CSS classes
                target.addDebuff(huntingMark);
                
                // Create the Hunting Mark VFX
                const markVfx = document.createElement('div');
                markVfx.className = 'hunting-mark-vfx';
                targetElement.appendChild(markVfx);
                
                // Create floating text indicator
                const markText = document.createElement('div');
                markText.className = 'hunting-mark-text';
                markText.textContent = 'MARKED';
                markVfx.appendChild(markText);
                
                // Remove VFX after animation
                            setTimeout(() => {
                    if (markVfx.parentNode) {
                        markVfx.remove();
                    }
                }, 2000);
                
                log(`${caster.name}'s Hunting Mark talent marks ${target.name} for extra damage!`, 'talent-effect');
            }
        }
    }
    // --- END NEW ---
    
    // Return structure with damage info
    return {
        damage: totalDamagePerHit * totalHits, // Report total damage done
        success: true
    };
};

const farmerBoomerangAbility = new Ability(
    'farmer_boomerang',             // id
    'Boomerang (Farmer Version)',   // name
    'Icons/abilities/boomerang_farmer.jpeg', // icon (Placeholder)
    50,                             // manaCost
    6,                              // cooldown
    farmerBoomerangEffect           // effect function
);
// Set base description separately
farmerBoomerangAbility.baseDescription = 'Throws a cat-themed boomerang, dealing 250% Physical Damage twice.';

// Add custom generateDescription method to handle the talent changes
farmerBoomerangAbility.generateDescription = function() {
    let description = this.baseDescription;
    
    // Add Multi-Boomerang talent info if present
    if (this.extraHitsChance) {
        description += `\n<span class="talent-effect damage">Multi-Boomerang: Has a ${this.extraHitsChance * 100}% chance to hit 4 times instead of 2.</span>`;
    }
    
    // Add Arcane Awakening talent info if present
    if (this.magicalDamageScaling) {
        description += `\n<span class="talent-effect damage">Arcane Awakening: Also deals ${this.magicalDamageScaling * 100}% Magical Damage on each hit.</span>`;
    }
    
    // Add Mana Empowerment info if the character has that talent
    if (this.caster && this.caster.manaEmpowerment) {
        description += `\n<span class="talent-effect damage">Mana Empowerment: Also deals bonus damage equal to the ability's mana cost (${this.manaCost}).</span>`;
    }
    
    // Add Hunting Mark talent info if present
    if (this.appliesHuntingMark) {
        description += `\n<span class="talent-effect damage">Hunting Mark: Applies a mark to the target. The next Scratch will deal double damage to the marked target and consume the mark. The mark lasts for 3 turns.</span>`;
    }
    
    return description;
};

farmerBoomerangAbility.description = farmerBoomerangAbility.generateDescription(); // Generate initial description
farmerBoomerangAbility.setTargetType('enemy');

// Ability Definition: Feral Strike (Farmer Version)
const farmerFeralStrikeEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name} tries to use Feral Strike, but the target is invalid.`);
        return;
    }

    log(`${caster.name} unleashes Feral Strike (Farmer Version) on ${target.name}!`);
    // playSound('sounds/cat_feral_strike.mp3', 0.7); // TODO: Add sound

    // Get DOM elements for VFX
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);

    // Check for Mana Empowerment talent
    const feralStrikeAbility = caster.abilities.find(a => a.id === "farmer_feral_strike");
    let manaEmpowermentBonus = 0;
    
    if (caster.manaEmpowerment && feralStrikeAbility) {
        const manaCost = feralStrikeAbility.manaCost || 100;
        manaEmpowermentBonus = manaCost;
        
        // Create mana empowerment VFX
        if (casterElement) {
            const manaEmpowermentVfx = document.createElement('div');
            manaEmpowermentVfx.className = 'mana-empowerment-vfx';
            manaEmpowermentVfx.textContent = `+${manaCost} DMG`;
            manaEmpowermentVfx.style.left = `${40 + Math.random() * 20}%`;
            manaEmpowermentVfx.style.top = `${40 + Math.random() * 20}%`;
            casterElement.appendChild(manaEmpowermentVfx);
            
            setTimeout(() => {
                if (manaEmpowermentVfx.parentNode) {
                    manaEmpowermentVfx.remove();
                }
            }, 1500);
        }
        
        log(`${caster.name}'s Mana Empowerment adds ${manaCost} damage!`, 'talent-effect');
    }

    // Create main container for all VFX
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'farmer-feral-strike-vfx';
    targetElement.appendChild(vfxContainer);

    // Create cat silhouette with afterimages
    const catSilhouette = document.createElement('div');
    catSilhouette.className = 'cat-silhouette';
    vfxContainer.appendChild(catSilhouette);

    // Create afterimages
    for (let i = 0; i < 3; i++) {
        const afterimage = document.createElement('div');
        afterimage.className = 'cat-afterimage';
        afterimage.style.animationDelay = `${i * 0.1}s`;
        vfxContainer.appendChild(afterimage);
    }

    // Create slash marks container
    const slashContainer = document.createElement('div');
    slashContainer.className = 'feral-slash-container';
    vfxContainer.appendChild(slashContainer);

    // Schedule the 6 strikes with delays
    const strikeDelays = [100, 300, 500, 700, 900, 1200]; // ms
    const totalDuration = 2000; // Total duration of the animation sequence

    // Execute all 6 strikes with delays and animations
    strikeDelays.forEach((delay, index) => {
        setTimeout(() => {
            // Skip if target died during sequence
            if (target.isDead()) return;

            // Create visual elements for each strike
            const slashMark = document.createElement('div');
            slashMark.className = 'feral-slash';
            // Alternate slash angles for visual variety
            slashMark.style.transform = `rotate(${index % 2 === 0 ? 45 : -45}deg)`;
            slashContainer.appendChild(slashMark);

            // Execute damage calculation and application
            executeSingleStrike(index + 1);

            // Create small particles
            for (let i = 0; i < 4; i++) {
                const particle = document.createElement('div');
                particle.className = 'feral-particle';
                particle.style.left = `${40 + Math.random() * 20}%`;
                particle.style.top = `${40 + Math.random() * 20}%`;
                
                // Random size, color, and animation path
                const size = 5 + Math.random() * 5;
                const hue = 30 + Math.random() * 30; // Orange/yellow variations
                
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
                
                // Set custom properties for animation
                const angle = Math.random() * Math.PI * 2;
                const distance = 30 + Math.random() * 40;
                particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
                particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
                
                // Add to container with random delay
                particle.style.animationDelay = `${Math.random() * 0.2}s`;
                vfxContainer.appendChild(particle);
            }

            // Add impact effect for critical hits
            if (lastStrikeWasCritical) {
                const critImpact = document.createElement('div');
                critImpact.className = 'feral-crit-impact';
                critImpact.textContent = 'CRIT!';
                critImpact.style.left = `${30 + Math.random() * 40}%`;
                critImpact.style.top = `${30 + Math.random() * 40}%`;
                vfxContainer.appendChild(critImpact);
                
                // Remove after animation completes
                setTimeout(() => {
                    if (critImpact.parentNode) critImpact.remove();
                }, 800);
            }
        }, delay);
    });

    // Clean up VFX after animation completes
    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.remove();
        }
        
        // Final update
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
            updateCharacterUI(caster);
        }
    }, totalDuration);

    // Flag to pass critical hit information to the view
    let lastStrikeWasCritical = false;

    // Function to execute a single strike with damage calculation
    function executeSingleStrike(strikeNumber) {
        // Regular damage calculation - 100% of physical damage
        let baseDamage = caster.stats.physicalDamage || 0;
        
        // Add mana empowerment bonus to each strike (divided by 6 for balance)
        if (manaEmpowermentBonus > 0) {
            // We divide by number of strikes for balance
            const bonusPerStrike = Math.floor(manaEmpowermentBonus / 6);
            baseDamage += bonusPerStrike;
        }
        
        // Each strike has 50% crit chance regardless of character's crit stat
        const critRoll = Math.random();
        const isCritical = critRoll < 0.5; // 50% chance
        
        // Calculate final damage, applying critical hit if applicable
        let finalDamage = baseDamage;
        if (isCritical) {
            // Use character's critDamage multiplier for critical hits
            finalDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
            lastStrikeWasCritical = true;
        } else {
            lastStrikeWasCritical = false;
        }
        
        // Apply damage to target
        const damageResult = target.applyDamage(finalDamage, 'physical', caster, { abilityId: 'farmer_feral_strike' });
        
        // Log the strike
        log(`Strike ${strikeNumber}: ${target.name} takes ${damageResult.damage} ${isCritical ? 'CRITICAL ' : ''}physical damage!`);
        
        // Create damage number VFX
        if (targetElement) {
            const damageVfx = document.createElement('div');
            damageVfx.className = isCritical ? 'damage-vfx critical' : 'damage-vfx';
            damageVfx.textContent = damageResult.damage;
            
            // Position with slight randomization
            damageVfx.style.left = `${40 + (Math.random() * 20)}%`;
            damageVfx.style.top = `${20 + (strikeNumber * 10)}%`;
            
            targetElement.appendChild(damageVfx);
            
            // Remove after animation
            setTimeout(() => {
                if (damageVfx.parentNode) {
                    damageVfx.remove();
                }
            }, 1500);
        }
        
        // Apply lifesteal if character has it
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(damageResult.damage);
        }
        
        // IMPORTANT: Call the passive handler's onCriticalHit method
        if (isCritical && caster.passiveHandler && typeof caster.passiveHandler.onCriticalHit === 'function') {
            caster.passiveHandler.onCriticalHit(caster, target, damageResult.damage);
        }
        
        // Check for crit mana restoration
        if (isCritical && caster.critRestoresMana) {
            const missingMana = caster.stats.maxMana - caster.stats.currentMana;
            const manaRestored = Math.floor(missingMana * caster.critRestoresMana);
            if (manaRestored > 0) {
                caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + manaRestored);
                log(`${caster.name}'s Arcane Recovery restores ${manaRestored} mana from critical hit!`, 'talent-effect');
                
                // Add mana restoration VFX
                const casterElementId = caster.instanceId || caster.id;
                const casterElement = document.getElementById(`character-${casterElementId}`);
                if (casterElement) {
                    const manaVfx = document.createElement('div');
                    manaVfx.className = 'mana-restore-vfx';
                    manaVfx.textContent = `+${manaRestored} MP`;
                    casterElement.appendChild(manaVfx);
                    
                    setTimeout(() => {
                        if (manaVfx.parentNode) {
                            manaVfx.remove();
                        }
                    }, 1500);
                }
            }
        }
        
        // Update UI after each strike
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
            // Update caster UI too if mana was restored
            if (isCritical && caster.critRestoresMana) {
                updateCharacterUI(caster);
            }
        }
    }

    // Function to execute all strikes without animation
    function executeAllStrikes() {
        let totalDamage = 0;
        let criticalHits = 0;
        
        // Execute 6 strikes
        for (let i = 1; i <= 6; i++) {
            // Skip if target already died
            if (target.isDead()) break;
            
            // Regular damage calculation - 100% of physical damage
            let baseDamage = caster.stats.physicalDamage || 0;
            
            // Add mana empowerment bonus to each strike (divided by 6 for balance)
            if (manaEmpowermentBonus > 0) {
                // We divide by number of strikes for balance
                const bonusPerStrike = Math.floor(manaEmpowermentBonus / 6);
                baseDamage += bonusPerStrike;
            }
            
            // Each strike has 50% crit chance
            const critRoll = Math.random();
            const isCritical = critRoll < 0.5; // 50% chance
            
            // Calculate damage
            let finalDamage = baseDamage;
            if (isCritical) {
                finalDamage = Math.floor(baseDamage * (caster.stats.critDamage || 1.5));
                criticalHits++;
            }
            
            // Apply damage
            const damageResult = target.applyDamage(finalDamage, 'physical', caster, { abilityId: 'farmer_feral_strike' });
            totalDamage += damageResult.damage;
            
            // Apply lifesteal if character has it
            if (caster.stats.lifesteal > 0) {
                caster.applyLifesteal(damageResult.damage);
            }
        }
        
        // Log the result
        log(`${caster.name} strikes ${target.name} 6 times for a total of ${totalDamage} damage (${criticalHits} critical hits)!`);
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
            updateCharacterUI(caster);
        }
    }

    // After the executeAllStrikes function is called and animations complete
    
    // Add Frenzied Assault check after all the strikes have been executed
    setTimeout(() => {
        // Frenzied Assault talent check
        const feralStrikeAbility = caster.abilities.find(a => a.id === 'farmer_feral_strike');
        if (feralStrikeAbility && feralStrikeAbility.frenziedAssaultChance && !options?.isFromFrenziedAssault) {
            const frenziedChance = feralStrikeAbility.frenziedAssaultChance;
            if (Math.random() < frenziedChance) {
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`${caster.name}'s Frenzied Assault triggers Feral Strike a second time!`, 'talent-effect');
                
                // Create frenzied effect VFX
                const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
                if (targetElement) {
                    const frenziedVFX = document.createElement('div');
                    frenziedVFX.className = 'frenzied-assault-vfx feral';
                    targetElement.appendChild(frenziedVFX);
                    
                    // Remove VFX after animation
                    setTimeout(() => {
                        if (frenziedVFX.parentNode === targetElement) {
                            frenziedVFX.remove();
                        }
                    }, 1000);
                }
                
                // Trigger the Feral Strike effect again with a slight delay
                setTimeout(() => {
                    // We're calling the same effect but setting a flag to avoid infinite recursion
                    farmerFeralStrikeEffect(caster, target, { isFromFrenziedAssault: true });
                }, 500);
            }
        }
    }, 2500); // Wait for all the original strikes to finish
    
    // Return a basic success indicator since this is an animated ability
    return {
        damage: 0, // Damage is applied per strike, not returned
        isCritical: false
    };
};

const farmerFeralStrikeAbility = new Ability(
    'farmer_feral_strike',          // id
    'Feral Strike (Farmer Version)', // name
    'Icons/abilities/feral_strike_farmer.jpeg', // icon (Placeholder)
    100,                            // manaCost
    16,                             // cooldown
    farmerFeralStrikeEffect         // effect function
).setDescription('Unleashes a flurry of 6 strikes, each dealing 100% Physical Damage with 50% chance to critically hit.')
 .setTargetType('enemy');

// Add custom generateDescription method to handle the talent changes
farmerFeralStrikeAbility.generateDescription = function() {
    let description = 'Unleashes a flurry of 6 strikes, each dealing 100% Physical Damage with 50% chance to critically hit.';
    
    // Add Mana Empowerment info if the character has that talent
    if (this.caster && this.caster.manaEmpowerment) {
        description += `\n<span class="talent-effect damage">Mana Empowerment: Also deals bonus damage equal to the ability's mana cost (${this.manaCost}), distributed across all strikes.</span>`;
    }
    
    return description;
};

// Update descriptions
farmerFeralStrikeAbility.description = farmerFeralStrikeAbility.generateDescription();

// Register the ability
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        farmerScratchAbility, 
        farmerLeapAbility, 
        farmerBoomerangAbility,
        farmerFeralStrikeAbility
    ]);
    console.log("[AbilityFactory] Registered Farmer Cham Cham abilities.");
} else {
    console.warn("Farmer Cham Cham abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.farmer_scratch = farmerScratchAbility;
    window.definedAbilities.farmer_leap = farmerLeapAbility;
    window.definedAbilities.farmer_boomerang = farmerBoomerangAbility;
    window.definedAbilities.farmer_feral_strike = farmerFeralStrikeAbility;
} 