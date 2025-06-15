// Renée Abilities Implementation

/**
 * Renée's Wolf Claw Strike (Q) ability
 * Deals 700 + 1% of target's max HP as physical damage with double critical chance
 */
const reneeWolfClawStrikeEffect = function(caster, targetOrTargets, abilityInstance, actualManaCost, options = {}) {
    console.log('[WolfClawStrike] Effect called with parameters:', { caster: caster?.name, targets: Array.isArray(targetOrTargets) ? targetOrTargets.map(t => t?.name) : targetOrTargets?.name });
    
    // Handle target selection - Wolf Claw Strike targets a single enemy
    let target = targetOrTargets;
    if (Array.isArray(targetOrTargets)) {
        target = targetOrTargets[0];
    }
    
    if (!target) {
        console.error('[WolfClawStrike] No target provided');
        return { success: false };
    }
    
    return executeWolfClawStrike(caster, target, abilityInstance);
};

/**
 * Actual implementation of Wolf Claw Strike
 */
function executeWolfClawStrike(caster, target, abilityInstance, isDoubleClawSecondHit = false) {
    console.log('[WolfClawStrike] executeWolfClawStrike called with:', {
        caster: caster?.name,
        target: target?.name,
        abilityInstance: abilityInstance?.id,
        isDoubleClawSecondHit
    });
    
    const gameManager = window.gameManager;
    const logFunction = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    if (!caster || !target) {
        logFunction('Wolf Claw Strike failed: caster or target missing.', 'error');
        console.error('[WolfClawStrike] Missing parameters:', { caster: !!caster, target: !!target });
        return { success: false };
    }
    
    if (target.isDead()) {
        logFunction(`${caster.name} tried to use Wolf Claw Strike, but ${target.name} is already dead!`, 'error');
        return { success: false };
    }
    
    console.log('[WolfClawStrike] Starting ability execution...');
    
    // Base damage calculation: 700 + 1% of target's max HP
    const baseDamage = abilityInstance.baseDamage || 700;
    const maxHpPercent = 0.01;
    const targetMaxHpDamage = target.stats.maxHp * maxHpPercent;
    let totalDamage = baseDamage + targetMaxHpDamage;
    
    console.log('[WolfClawStrike] Damage calculation:', {
        baseDamage,
        targetMaxHpDamage,
        totalDamage
    });
    
    // Double crit chance for this ability
    const originalCritChance = caster.stats.critChance || 0;
    const doubleCritChance = Math.min(1.0, originalCritChance * 2);
    
    // Apply crit roll with doubled chance
    let isCritical = false;
    const critRoll = Math.random();
    if (critRoll < doubleCritChance) {
        const critMultiplier = caster.stats.critDamage || 1.5;
        totalDamage = Math.floor(totalDamage * critMultiplier);
        isCritical = true;
    }
    
    console.log('[WolfClawStrike] Critical calculation:', {
        originalCritChance,
        doubleCritChance,
        critRoll,
        isCritical,
        finalDamage: totalDamage
    });
    
    // Apply damage to target with statistics tracking
    const damageResult = target.applyDamage(totalDamage, 'physical', caster, {
        abilityId: 'renee_q'
    });
    
    console.log('[WolfClawStrike] Damage applied:', damageResult);
    
    // Track statistics for Wolf Claw Strike
    if (window.trackWolfClawStrikeStats) {
        window.trackWolfClawStrikeStats(caster, target, damageResult, isDoubleClawSecondHit);
    }
    
    // Apply Primal Healing if talent is enabled
    if (abilityInstance.enablePrimalHealing && !isDoubleClawSecondHit) {
        const healAmount = Math.round(damageResult.damage * 0.77);
        if (healAmount > 0) {
            // Add a small delay to make the healing more noticeable after the damage
            setTimeout(() => {
                caster.heal(healAmount, caster, {
                    source: "Primal Healing",
                    showVFX: true,
                    primalHealing: true,
                    abilityId: 'renee_q_primal_healing'
                });
                
                // Track Primal Healing statistics
                if (window.trackPrimalHealingStats) {
                    window.trackPrimalHealingStats(caster, healAmount);
                }
                
                showPrimalHealingVFX(caster, healAmount);
                logFunction(`${caster.name}'s Primal Healing restores ${healAmount} HP!`, 'heal talent-effect renee');
            }, 300);
        }
    }
    
    // Show VFX
    showWolfClawVFX(caster, target);
    
    // Log the result
    let actionMessage = `${caster.name} strikes ${target.name} with Wolf Claw Strike for ${damageResult.damage} physical damage`;
    if (damageResult.isCritical) {
        actionMessage += " (Critical Strike!)";
    }
    if (isDoubleClawSecondHit) {
        actionMessage += " (Double Claw)";
    }
    logFunction(actionMessage, damageResult.isCritical ? 'critical' : 'renee');
    
    // Predator's Momentum: On crit, apply 3-turn +20% crit chance buff
    if (caster.enablePredatorsMomentum && (isCritical || damageResult.isCritical)) {
        // Remove existing buff if present
        if (caster.hasBuff('predators_momentum_buff')) {
            caster.removeBuff('predators_momentum_buff');
        }
        const critBuff = {
            id: 'predators_momentum_buff',
            name: "Predator's Momentum",
            icon: 'Icons/talents/predators_momentum.webp',
            duration: 3,
            statModifiers: [{ stat: 'critChance', value: 0.2, operation: 'add' }],
            description: "Predator's Momentum: +20% crit chance.",
        };
        caster.addBuff(critBuff);
        if (logFunction) logFunction(`${caster.name} gains Predator's Momentum! +20% crit chance for 3 turns.`, 'talent-effect renee');
    }
    
    // Double Claw: 30% chance to trigger a second full attack (but only if not already a second hit)
    if (!isDoubleClawSecondHit && abilityInstance.triggerTwiceChance && Math.random() < abilityInstance.triggerTwiceChance) {
        logFunction(`${caster.name}'s Double Claw talent activates! Wolf Claw Strike strikes again!`, 'talent-effect renee');
        showWolfClawVFX(caster, target);
        executeWolfClawStrike(caster, target, abilityInstance, true);
    }
    
    // Check for Instinctive Veil talent
    if (caster && abilityInstance && abilityInstance.chanceToTriggerStealth) {
        const stealthChance = abilityInstance.chanceToTriggerStealth;
        const stealthRoll = Math.random();
        
        if (stealthRoll < stealthChance) {
            logFunction(`${caster.name}'s Instinctive Veil talent activates!`, 'talent-effect renee');
            
            // Create a stealth buff (same as Lupine Veil but for 1 turn only)
            const stealthBuff = {
                id: 'renee_instinctive_veil_buff',
                name: 'Instinctive Veil',
                icon: 'Icons/abilities/lupine_veil.webp',
                duration: 2, // Two turns for the talent
                isUntargetable: true,
                statModifiers: [{ stat: 'critChance', value: 1, operation: 'set' }],
                description: 'Instinctive Veil: Untargetable, 100% crit chance for 2 turns. Using any other ability breaks stealth.',
                _abilityListener: null,
                onApply(target) {
                    // Add stealth VFX
                    const el = document.getElementById(`character-${target.instanceId || target.id}`);
                    if (el && !el.querySelector('.renee-stealth-vfx')) {
                        const vfx = document.createElement('div');
                        vfx.className = 'wolf-spirit-vfx renee-stealth-vfx';
                        el.appendChild(vfx);
                    }
                    // Add stealth-active class for opacity
                    if (el) {
                        el.classList.add('renee-stealth-active');
                    }
                    // Listen for ability use to break stealth
                    this._abilityListener = (event) => {
                        const { caster, ability } = event.detail || {};
                        if (!caster || caster.id !== target.id) return;
                        if (!ability || ability.id === 'renee_q') return; // Don't break on Q itself
                        // Remove the VFX and class immediately before removing the buff
                        const el = document.getElementById(`character-${target.instanceId || target.id}`);
                        if (el) {
                            const vfx = el.querySelector('.renee-stealth-vfx');
                            if (vfx) vfx.remove();
                            el.classList.remove('renee-stealth-active');
                        }
                        // Remove the buff (break stealth)
                        target.removeBuff('renee_instinctive_veil_buff');
                        if (logFunction) logFunction(`${target.name}'s Instinctive Veil breaks as she uses another ability!`, 'renee');
                    };
                    document.addEventListener('AbilityUsed', this._abilityListener);
                    document.addEventListener('abilityUsed', this._abilityListener);
                },
                onRemove(target) {
                    // Remove VFX
                    const el = document.getElementById(`character-${target.instanceId || target.id}`);
                    if (el) {
                        const vfx = el.querySelector('.renee-stealth-vfx');
                        if (vfx) vfx.remove();
                        el.classList.remove('renee-stealth-active');
                    }
                    // Remove event listener
                    if (this._abilityListener) {
                        document.removeEventListener('AbilityUsed', this._abilityListener);
                        document.removeEventListener('abilityUsed', this._abilityListener);
                        this._abilityListener = null;
                    }
                    if (logFunction) logFunction(`${target.name}'s Instinctive Veil fades.`, 'renee');
                }
            };
            
            // Apply the stealth buff to the caster
            caster.addBuff(stealthBuff);
            
            // Play stealth sound
            if (gameManager && typeof gameManager.playSound === 'function') {
                gameManager.playSound('sounds/wolf_howl.mp3', 0.5);
            }
        }
    }
    
    // Check if target died
    if (target.isDead()) {
        logFunction(`${target.name} has been defeated!`);
    }
    
    // Return the damage result for other systems
    return {
        success: true,
        damage: damageResult.damage,
        isCritical: damageResult.isCritical,
        target: target
    };
}

/**
 * Visual Effect for Wolf Claw Strike
 */
function showWolfClawVFX(caster, target) {
    // Validate input parameters
    if (!caster || !target) {
        console.error(`[WolfClawVFX] Invalid parameters: caster=${!!caster}, target=${!!target}`);
        return;
    }
    
    // Get DOM elements - use instanceId if available, otherwise fall back to id
    const casterId = caster.instanceId || caster.id;
    const targetId = target.instanceId || target.id;
    
    if (!casterId || !targetId) {
        console.error(`[WolfClawVFX] Missing IDs: casterId=${casterId}, targetId=${targetId}`);
        return;
    }
    
    console.log(`[WolfClawVFX] Showing VFX from caster ${caster.name} (DOM ID: character-${casterId}) to target ${target.name} (DOM ID: character-${targetId})`);
    
    const casterElement = document.getElementById(`character-${casterId}`);
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!casterElement || !targetElement) {
        console.error(`Cannot find character elements for VFX. Caster element exists: ${!!casterElement}, Target element exists: ${!!targetElement}`);
        // Dump more debugging information
        console.log(`All character elements in DOM:`, document.querySelectorAll('[id^="character-"]'));
        return;
    }
    
    // Debug log that we found the elements
    console.log(`[WolfClawVFX] Found DOM elements for caster and target, applying VFX`);
    
    // Create VFX with a tiny delay to ensure DOM is ready
    setTimeout(() => {
        try {
            // Play wolf howl sound if available
            if (window.gameManager && typeof window.gameManager.playSound === 'function') {
                try {
                    window.gameManager.playSound('sounds/wolf_howl.mp3', 0.3);
                } catch(e) {
                    console.log(`Wolf howl sound effect failed to play:`, e);
                    // Fallback sound
                    try {
                        window.gameManager.playSound('sounds/claw_slash.mp3', 0.5);
                    } catch(e2) {
                        console.log(`Fallback sound also failed:`, e2);
                    }
                }
            }
            
            // Add shake class to target for impact effect
            targetElement.classList.add('target-shake');
            setTimeout(() => {
                targetElement.classList.remove('target-shake');
            }, 500);
            
            // Create claw marks container
            const clawContainer = document.createElement('div');
            clawContainer.className = 'renee-claw-vfx';
            clawContainer.id = `renee-claw-vfx-${Date.now()}`;
            targetElement.appendChild(clawContainer);
            
            // Log that we've created and added the container
            console.log(`[WolfClawVFX] Created VFX container with ID ${clawContainer.id}`);
            
            // Create claw marks
            for (let i = 0; i < 3; i++) {
                const clawMark = document.createElement('div');
                clawMark.className = 'claw-mark';
                clawMark.style.animationDelay = `${i * 0.1}s`;
                clawContainer.appendChild(clawMark);
            }
            
            // Create claw slash effect
            const clawSlash = document.createElement('div');
            clawSlash.className = 'claw-slash';
            clawContainer.appendChild(clawSlash);
            
            // Create impact burst effect
            const clawImpact = document.createElement('div');
            clawImpact.className = 'claw-impact';
            clawContainer.appendChild(clawImpact);
            
            // Create particles for more visual impact
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'claw-particle';
                
                // Randomize particle direction
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                particle.style.setProperty('--x', `${x}px`);
                particle.style.setProperty('--y', `${y}px`);
                
                // Randomize particle position
                particle.style.left = `${40 + Math.random() * 20}%`;
                particle.style.top = `${40 + Math.random() * 20}%`;
                
                // Randomize animation delay
                particle.style.animationDelay = `${Math.random() * 0.2}s`;
                
                clawContainer.appendChild(particle);
            }
            
            console.log(`[WolfClawVFX] VFX elements added to DOM, should be visible now`);
            
            // Remove the claw VFX after animation completes
            setTimeout(() => {
                if (targetElement.contains(clawContainer)) {
                    targetElement.removeChild(clawContainer);
                    console.log(`[WolfClawVFX] Removed VFX elements from DOM after animation completed`);
                }
            }, 1500);
        } catch (error) {
            console.error(`[WolfClawVFX] Error creating VFX:`, error);
        }
    }, 50); // Small delay to ensure DOM is ready
}

/**
 * Update Wolf Claw Strike description to show accurate damage calculation
 */
function updateWolfClawDescription(ability, character) {
    let description = `Deal ${ability.baseDamage || 700} physical damage to a target enemy. Wolf Claw Strike has double critical strike chance.`;
    
    if (ability.triggerTwiceChance) {
        description += `\n\n<span class="talent-effect damage">Double Claw: ${Math.round(ability.triggerTwiceChance * 100)}% chance to strike a second time.</span>`;
    }
    
    if (ability.chanceToTriggerStealth) {
        description += `\n\n<span class="talent-effect utility">Instinctive Veil: ${Math.round(ability.chanceToTriggerStealth * 100)}% chance to gain Stealth for 1 turn.</span>`;
    }
    
    if (ability.enablePrimalHealing) {
        description += `\n\n<span class="talent-effect healing">Primal Healing: Heals for 77% of damage dealt. This healing stacks with any lifesteal.</span>`;
    }
    
    ability.description = description;
    return description;
}

/**
 * Renée's Lupine Veil (W) ability
 * Grants stealth (untargetable, 100% crit chance) for up to 3 turns. Breaks on using any other ability or expiring. Does not end turn.
 */
const reneeLupineVeilEffect = function(caster, targetOrTargets, abilityInstance, actualManaCost, options = {}) {
    console.log('[LupineVeil] Effect called with parameters:', { caster: caster?.name });
    
    // Early initialization phase - set baseDescription directly
    if (abilityInstance && !abilityInstance.baseDescription) {
        console.log('[LupineVeil] Setting baseDescription during effect call');
        abilityInstance.baseDescription = 'Renée becomes untargetable and enters stealth for up to 3 turns. While stealthed, her critical chance is 100%. Using any other ability or letting the effect expire breaks stealth. Does not end your turn.';
        
        // Also set up generateDescription method if it doesn't exist
        if (typeof abilityInstance.generateDescription !== 'function') {
            abilityInstance.generateDescription = function() {
                let desc = this.baseDescription;
                let talentEffects = '';
                // Add Veil of the Moon talent effect
                if (this.character && this.character.enableVeilOfTheMoon) {
                    talentEffects += `\n<span class="talent-effect utility">🌙 <b>Veil of the Moon</b>: Using Lupine Veil decreases all active ability cooldowns by 2.</span>`;
                }
                // Add Endless Veil talent effect
                if (this.character && this.character.enableEndlessVeil) {
                    talentEffects += `\n<span class="talent-effect utility">🌙 <b>Endless Veil</b>: Lupine Veil no longer breaks when using abilities.</span>`;
                }
                this.description = desc + talentEffects;
                return this.description;
            };
            // Generate initial description
            abilityInstance.generateDescription();
        }
    }
    
    return executeLupineVeil(caster, abilityInstance);
};

function executeLupineVeil(caster, abilityInstance) {
    console.log('[LupineVeil] executeLupineVeil called with:', {
        caster: caster?.name,
        abilityInstance: abilityInstance?.id
    });
    
    const gameManager = window.gameManager;
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    if (!caster) {
        log('Lupine Veil failed: caster missing.', 'error');
        console.error('[LupineVeil] Missing caster parameter');
        return { success: false };
    }
    
    console.log('[LupineVeil] Starting ability execution...');
    
    // Prevent stacking: remove existing stealth buff if present
    if (caster.hasBuff('renee_stealth_buff')) {
        console.log('[LupineVeil] Removing existing stealth buff');
        caster.removeBuff('renee_stealth_buff');
    }
    
    // Show Lunar Curse VFX on cast
    showLunarCurseVFX(caster);
    
    // Play moon sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/lunar_cast.mp3', 0.7);
    }
    
    console.log('[LupineVeil] Creating stealth buff...');
    
    // Buff definition
    const stealthBuff = {
        id: 'renee_stealth_buff',
        name: 'Lupine Veil',
        icon: 'Icons/abilities/lupine_veil.webp',
        duration: 3,
        isUntargetable: true,
        statModifiers: [{ stat: 'critChance', value: 1, operation: 'set' }],
        description: 'Stealthed: Untargetable, 100% crit chance. Using any other ability or expiring breaks stealth.',
        _abilityListener: null,
        onApply(target) {
            // Add stealth VFX
            const el = document.getElementById(`character-${target.instanceId || target.id}`);
            if (el && !el.querySelector('.renee-stealth-vfx')) {
                const vfx = document.createElement('div');
                vfx.className = 'wolf-spirit-vfx renee-stealth-vfx';
                el.appendChild(vfx);
            }
            // Add stealth-active class for opacity
            if (el) {
                el.classList.add('renee-stealth-active');
            }
            // Listen for ability use to break stealth
            this._abilityListener = (event) => {
                const { caster, ability } = event.detail || {};
                if (!caster || caster.id !== target.id) return;
                if (!ability || ability.id === 'renee_w') return; // Don't break on W itself
                // Check for Endless Veil talent
                if (caster.enableEndlessVeil) {
                    if (log) log(`${target.name}'s Endless Veil prevents Lupine Veil from breaking!`, 'talent-effect renee');
                    return;
                }
                // Remove the VFX and class immediately before removing the buff
                const el = document.getElementById(`character-${target.instanceId || target.id}`);
                if (el) {
                    const vfx = el.querySelector('.renee-stealth-vfx');
                    if (vfx) vfx.remove();
                    el.classList.remove('renee-stealth-active');
                }
                // Remove the buff (break stealth)
                target.removeBuff('renee_stealth_buff');
                if (log) log(`${target.name}'s Lupine Veil breaks as she uses another ability!`, 'renee');
            };
            document.addEventListener('AbilityUsed', this._abilityListener);
            document.addEventListener('abilityUsed', this._abilityListener);
        },
        onRemove(target) {
            // Remove VFX
            const el = document.getElementById(`character-${target.instanceId || target.id}`);
            if (el) {
                const vfx = el.querySelector('.renee-stealth-vfx');
                if (vfx) vfx.remove();
                el.classList.remove('renee-stealth-active');
            }
            // Remove event listener
            if (this._abilityListener) {
                document.removeEventListener('AbilityUsed', this._abilityListener);
                document.removeEventListener('abilityUsed', this._abilityListener);
                this._abilityListener = null;
            }
            if (log) log(`${target.name}'s Lupine Veil fades.`, 'renee');
        }
    };
    caster.addBuff(stealthBuff);
    
    // Track Lupine Veil statistics
    if (window.trackLupineVeilStats) {
        window.trackLupineVeilStats(caster);
    }
    
    if (log) log(`${caster.name} slips into the shadows with Lupine Veil!`, 'renee');
    // Play sound
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/wolf_howl.mp3', 0.5);
    }
    // Return: doesNotEndTurn so player can act again
    return { success: true, doesNotEndTurn: true };
}

/**
 * Renée's Mystical Whip (E) ability
 * Deals 490 + 50% Physical damage with 50% chance to stun for 1 turn.
 * Critical hits deal 1000 + 100% Physical damage instead.
 */
const reneeMysticalWhipEffect = function(caster, targetOrTargets, abilityInstance, actualManaCost, options = {}) {
    console.log('[MysticalWhip] Effect called with parameters:', { caster: caster?.name, targets: Array.isArray(targetOrTargets) ? targetOrTargets.map(t => t?.name) : targetOrTargets?.name });
    
    // Handle target selection - Mystical Whip targets a single enemy
    let target = targetOrTargets;
    if (Array.isArray(targetOrTargets)) {
        target = targetOrTargets[0];
    }
    
    if (!target) {
        console.error('[MysticalWhip] No target provided');
        return { success: false };
    }
    
    // Early initialization phase - set baseDescription directly
    if (abilityInstance && !abilityInstance.baseDescription) {
        console.log('[MysticalWhip] Setting baseDescription during effect call');
        abilityInstance.baseDescription = 'Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.';
        
        // Also set up generateDescription method if it doesn't exist
        if (typeof abilityInstance.generateDescription !== 'function') {
            abilityInstance.generateDescription = function() {
                let desc = this.baseDescription;
                let talentEffects = '';
                
                // Add Essence Drain talent effect description
                if (this.enableManaDrain) {
                    talentEffects += `\n<span class="talent-effect resource">⚡ Essence Drain: Steals 50 mana from the target and restores it to Renée.</span>`;
                }
                
                // Add Arcane Lash talent effect description
                if (this.enableMagicalDamageScaling) {
                    talentEffects += `\n<span class="talent-effect damage">⚡ Arcane Lash: Also scales with 200% Magical Damage.</span>`;
                }
                
                // Add Disruptive Lash talent effect description
                if (this.enableAbilityDisable) {
                    talentEffects += `\n<span class="talent-effect utility">⚡ Disruptive Lash: 50% chance to disable a random ability of the target for 2 turns.</span>`;
                }
                
                // Add Chain Whip talent effect description
                if (this.enableChainWhip) {
                    talentEffects += `\n<span class="talent-effect aoe">🔥 Chain Whip: 50% chance to strike an additional random enemy target.</span>`;
                }
                
                // Add Mystical Convergence talent effect description
                if (this.damageType === 'magical') {
                    talentEffects += `\n<span class="talent-effect damage">⚡ Mystical Convergence: Deals magical damage instead of physical damage.</span>`;
                    
                    // Update the UI element for this ability to show the magical damage type
                    setTimeout(() => {
                        // Find all elements with this ability ID
                        const abilityElements = document.querySelectorAll(`.ability[data-ability-id="${this.id}"]`);
                        
                        // Set the data-damage-type attribute to indicate magical damage
                        abilityElements.forEach(element => {
                            element.setAttribute('data-damage-type', 'magical');
                        });
                        
                        console.log(`[MysticalWhip] Updated ${abilityElements.length} ability elements with magical damage type`);
                    }, 100);
                }
                
                this.description = desc + talentEffects;
                return this.description;
            };
            
            // Generate initial description
            abilityInstance.generateDescription();
        }
    }
    
    return executeMysticalWhip(caster, target, abilityInstance);
};

/**
 * Actual implementation of Mystical Whip ability
 */
function executeMysticalWhip(caster, target, abilityInstance, isRelentlessSecondHit = false) {
    // Get game manager for utility functions
    const gameManager = window.gameManager;
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Validate targets
    if (!caster || !target) {
        console.error(`[MysticalWhip] Invalid parameters: caster=${!!caster}, target=${!!target}`);
        return false;
    }
    
    if (target.isDead()) {
        log(`${caster.name} tried to use Mystical Whip, but the target is dead!`, "error");
        return false;
    }
    
    // Play whip sound effect
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/whip_slash.mp3', 0.65);
    }
    
    // Show whip attack VFX
    showWhipVFX(caster, target);
    
    // Calculate base damage
    const normalBaseDamage = 490;
    const criticalBaseDamage = 1000;
    const physicalDamage = caster.stats.physicalDamage || 0;
    
    // Determine if this is a critical hit
    let isCritical = false;
    let damage = 0;
    
    // Apply Arcane Lash talent if enabled
    let magicalDamageBonus = 0;
    if (abilityInstance.enableMagicalDamageScaling) {
        const magicalDamage = caster.stats.magicalDamage || 0;
        magicalDamageBonus = Math.floor(magicalDamage * 2.0); // 200% Magical Damage scaling
        console.log(`[MysticalWhip] Arcane Lash talent adds ${magicalDamageBonus} magical damage bonus`);
    }
    
    if (Math.random() < (caster.stats.critChance || 0)) {
        isCritical = true;
        // Critical hit: 1000 + 100% Physical damage
        // FIXED: Don't apply critical damage multiplier, just use the special formula
        damage = criticalBaseDamage + Math.floor(physicalDamage * 1.0);
        
        // Apply magical damage bonus to crit too if talent is enabled
        if (abilityInstance.enableMagicalDamageScaling) {
            damage += magicalDamageBonus;
            console.log(`[MysticalWhip] Critical hit calculation with Arcane Lash: ${criticalBaseDamage} + ${Math.floor(physicalDamage)} Physical + ${magicalDamageBonus} Magical = ${damage}`);
        } else {
            console.log(`[MysticalWhip] Critical hit calculation: ${criticalBaseDamage} + ${Math.floor(physicalDamage)} Physical = ${damage}`);
        }
    } else {
        // Normal hit: 490 + 50% Physical damage
        damage = normalBaseDamage + Math.floor(physicalDamage * 0.5);
        
        // Apply magical damage bonus if talent is enabled
        if (abilityInstance.enableMagicalDamageScaling) {
            damage += magicalDamageBonus;
            console.log(`[MysticalWhip] Normal hit calculation with Arcane Lash: ${normalBaseDamage} + ${Math.floor(physicalDamage * 0.5)} Physical + ${magicalDamageBonus} Magical = ${damage}`);
        } else {
            console.log(`[MysticalWhip] Normal hit calculation: ${normalBaseDamage} + ${Math.floor(physicalDamage * 0.5)} Physical = ${damage}`);
        }
    }
    
    // Determine the damage type - use the ability's damageType property if set (via Mystical Convergence talent)
    const damageType = abilityInstance.damageType || 'physical';
    
    // Apply damage to the target with statistics tracking
    const damageResult = target.applyDamage(damage, damageType, caster, {
        abilityId: 'renee_e'
    });
    
    // Log damage dealt
    let message = `${target.name} takes ${damageResult.damage} ${damageType} damage from ${caster.name}'s Mystical Whip`;
    if (isCritical) {
        message += " (Critical Hit!)";
    }
    if (isRelentlessSecondHit) {
        message += " (Relentless Whip)";
    }
    log(message, 'renee');
    
    // Track Mystical Whip statistics
    if (window.trackMysticalWhipStats) {
        window.trackMysticalWhipStats(caster, target, damageResult, {
            isChainTarget: false,
            isSecondHit: isRelentlessSecondHit,
            damageType: damageType
        });
    }
    
    // Predator's Momentum: On crit, apply 3-turn +20% crit chance buff
    if (caster.enablePredatorsMomentum && isCritical) {
        if (caster.hasBuff('predators_momentum_buff')) {
            caster.removeBuff('predators_momentum_buff');
        }
        const critBuff = {
            id: 'predators_momentum_buff',
            name: "Predator's Momentum",
            icon: 'Icons/talents/predators_momentum.webp',
            duration: 3,
            statModifiers: [{ stat: 'critChance', value: 0.2, operation: 'add' }],
            description: "Predator's Momentum: +20% crit chance.",
        };
        caster.addBuff(critBuff);
        if (log) log(`${caster.name} gains Predator's Momentum! +20% crit chance for 3 turns.`, 'talent-effect renee');
    }
    
    // Implement Essence Drain talent functionality
    if (abilityInstance.enableManaDrain && target.stats && target.stats.currentMana !== undefined) {
        // Define mana drain amount
        const manaDrainAmount = 50;
        
        // Calculate how much mana we can actually drain (don't go below 0)
        const actualDrainAmount = Math.min(manaDrainAmount, target.stats.currentMana);
        
        if (actualDrainAmount > 0) {
            // Reduce target's mana
            target.stats.currentMana -= actualDrainAmount;
            
            // Increase caster's mana (capped at max mana)
            const originalMana = caster.stats.currentMana;
            caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + actualDrainAmount);
            const manaGained = caster.stats.currentMana - originalMana;
            
            // Log the mana drain effect
            log(`${caster.name}'s Essence Drain steals ${actualDrainAmount} mana from ${target.name}!`, 'talent-effect renee');
            
            // Show mana drain/gain VFX
            showManaDrainVFX(caster, target, actualDrainAmount);
            
            // Update UI for both characters
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(caster);
                updateCharacterUI(target);
            }
        }
    }
    
    // Implement Disruptive Lash talent (ability disable)
    let disabledAbility = null;
    if (abilityInstance.enableAbilityDisable && Math.random() < 0.5) { // 50% chance to disable
        disabledAbility = applyAbilityDisable(target, caster);
        if (disabledAbility) {
            log(`${caster.name}'s Disruptive Lash disables ${target.name}'s ${disabledAbility.name} for 2 turns!`, 'talent-effect renee');
        }
    }
    
    // Check for stun effect (50% chance)
    let isStunned = false;
    if (Math.random() < 0.5) { // 50% chance to stun
        isStunned = applyStunEffect(target);
        if (isStunned) {
            log(`${target.name} is stunned by ${caster.name}'s Mystical Whip!`, 'renee');
            showStunVFX(target);
        }
    }
    
    // Check if the target died
    if (target.isDead()) {
        log(`${target.name} has been defeated!`, 'renee');
        if (gameManager) {
            gameManager.handleCharacterDeath(target);
        }
    }
    
    // Collect all targets for the return value
    const affectedTargets = [target];
    
    // Implement Chain Whip talent (strike additional target)
    if (abilityInstance.enableChainWhip && Math.random() < 0.5) { // 50% chance for Chain Whip
        // Find a random enemy that is not the current target
        let secondaryTarget = null;
        
        if (gameManager) {
            // Get all enemies of the caster
            const enemies = gameManager.getOpponents(caster);
            
            // Filter out the current target and dead enemies
            const validTargets = enemies.filter(enemy => 
                enemy !== target && !enemy.isDead() && !enemy.isUntargetable()
            );
            
            if (validTargets.length > 0) {
                // Pick a random valid target
                secondaryTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
                
                log(`${caster.name}'s Chain Whip strikes ${secondaryTarget.name} as well!`, 'talent-effect renee');
                
                // Show chain whip VFX for the secondary target
                setTimeout(() => {
                    showWhipVFX(caster, secondaryTarget, true); // Pass true to indicate secondary target for VFX
                    
                    // Apply a delay to make the attack sequence look nicer
                    setTimeout(() => {
                        // Apply same damage calculation to secondary target with statistics tracking
                        // We'll reuse the critical hit status from the primary attack
                        const chainDamageResult = secondaryTarget.applyDamage(damage, 'physical', caster, {
                            abilityId: 'renee_e_chain'
                        });
                        
                        // Log damage dealt to secondary target
                        let chainMessage = `${secondaryTarget.name} takes ${chainDamageResult.damage} physical damage from ${caster.name}'s Chain Whip`;
                        if (isCritical) {
                            chainMessage += " (Critical Hit!)";
                        }
                        if (isRelentlessSecondHit) {
                            chainMessage += " (Relentless Whip)";
                        }
                        log(chainMessage, 'renee');
                        
                        // Track Chain Whip statistics
                        if (window.trackMysticalWhipStats) {
                            window.trackMysticalWhipStats(caster, secondaryTarget, chainDamageResult, {
                                isChainTarget: true,
                                isSecondHit: isRelentlessSecondHit,
                                damageType: 'physical'
                            });
                        }
                        
                        // Apply Essence Drain to secondary target if enabled
                        if (abilityInstance.enableManaDrain && secondaryTarget.stats && secondaryTarget.stats.currentMana !== undefined) {
                            const secondaryDrainAmount = Math.min(manaDrainAmount, secondaryTarget.stats.currentMana);
                            
                            if (secondaryDrainAmount > 0) {
                                // Reduce secondary target's mana
                                secondaryTarget.stats.currentMana -= secondaryDrainAmount;
                                
                                // Increase caster's mana (capped at max mana)
                                const originalMana = caster.stats.currentMana;
                                caster.stats.currentMana = Math.min(caster.stats.maxMana, caster.stats.currentMana + secondaryDrainAmount);
                                const manaGained = caster.stats.currentMana - originalMana;
                                
                                // Log the mana drain effect
                                log(`${caster.name}'s Essence Drain steals ${secondaryDrainAmount} mana from ${secondaryTarget.name}!`, 'talent-effect renee');
                                
                                // Show mana drain/gain VFX
                                showManaDrainVFX(caster, secondaryTarget, secondaryDrainAmount);
                                
                                // Update UI for both characters
                                if (typeof updateCharacterUI === 'function') {
                                    updateCharacterUI(caster);
                                    updateCharacterUI(secondaryTarget);
                                }
                            }
                        }
                        
                        // Apply Disruptive Lash to secondary target if enabled
                        if (abilityInstance.enableAbilityDisable && Math.random() < 0.5) {
                            const secondaryDisabledAbility = applyAbilityDisable(secondaryTarget, caster);
                            if (secondaryDisabledAbility) {
                                log(`${caster.name}'s Disruptive Lash disables ${secondaryTarget.name}'s ${secondaryDisabledAbility.name} for 2 turns!`, 'talent-effect renee');
                            }
                        }
                        
                        // Apply stun effect to secondary target with the same chance
                        if (Math.random() < 0.5) {
                            const secondaryStunned = applyStunEffect(secondaryTarget);
                            if (secondaryStunned) {
                                log(`${secondaryTarget.name} is stunned by ${caster.name}'s Chain Whip!`, 'renee');
                                showStunVFX(secondaryTarget);
                            }
                        }
                        
                        // Check if the secondary target died
                        if (secondaryTarget.isDead()) {
                            log(`${secondaryTarget.name} has been defeated!`, 'renee');
                            if (gameManager) {
                                gameManager.handleCharacterDeath(secondaryTarget);
                            }
                        }
                        
                        // Add the secondary target to affected targets
                        affectedTargets.push(secondaryTarget);
                    }, 400); // Delay the secondary target effects for visual clarity
                }, 200); // Delay the secondary target VFX
            } else {
                log(`${caster.name}'s Chain Whip activates but finds no additional targets!`, 'talent-effect renee');
            }
        }
    }
    
    // Relentless Whip: 30% chance to trigger a second full attack (but only if not already a second hit)
    if (!isRelentlessSecondHit && abilityInstance.triggerTwiceChance && Math.random() < abilityInstance.triggerTwiceChance) {
        log(`${caster.name}'s Relentless Whip talent activates! Mystical Whip strikes again!`, 'talent-effect renee');
        showWhipVFX(caster, target);
        // Call executeMysticalWhip again for the second hit, passing true to prevent infinite recursion
        executeMysticalWhip(caster, target, abilityInstance, true);
    }
    
    // Return success info with all affected targets
    return {
        success: true,
        targets: affectedTargets,
        isStunned: isStunned,
        disabledAbility: disabledAbility
    };
}

/**
 * Apply stun effect to the target
 */
function applyStunEffect(target) {
    // Create stun debuff
    const stunDebuff = {
        id: 'renee_whip_stun',
        name: 'Mystical Whip Stun',
        icon: 'Icons/effects/stun.png',
        duration: 1, // 1 turn stun
        effects: { cantAct: true },
        isDebuff: true,
        description: 'Stunned: Cannot act for 1 turn.'
    };
    
    // Apply debuff to target
    target.addDebuff(stunDebuff);
    
    return true;
}

/**
 * Apply ability disable effect to a random ability of the target
 * Implementation inspired by Horn Drill ability
 */
function applyAbilityDisable(target, caster) {
    const Effect = window.Effect; // Assuming Effect class is globally available
    
    if (!target || !Effect) {
        console.error("[AbilityDisable] Cannot apply ability disable: target or Effect class not available");
        return null;
    }
    
    // Find abilities that are not passive and not currently disabled
    const targetAbilities = target.abilities || [];
    const usableAbilities = targetAbilities.filter(ability => 
        ability && !ability.passive && !ability.isDisabled
    );
    
    if (usableAbilities.length === 0) {
        console.log(`[AbilityDisable] ${target.name} has no usable abilities to disable.`);
        return null;
    }
    
    // Randomly select an ability to disable
    const randomIndex = Math.floor(Math.random() * usableAbilities.length);
    const abilityToDisable = usableAbilities[randomIndex];
    const abilityIndexToDisable = targetAbilities.indexOf(abilityToDisable);
    
    // Set up the debuff details
    const disableDuration = 2; // 2 turns as specified in the talent
    const debuffId = 'renee_whip_ability_disable';
    const debuffName = 'Ability Disabled (Mystical Whip)';
    const debuffIcon = 'Icons/effects/ability_disabled.webp';
    
    // Create the disable debuff
    const disableDebuff = new Effect(
        `${debuffId}_${abilityToDisable.id}`, // Unique ID per ability
        `${debuffName}: ${abilityToDisable.name}`, // Display which ability is disabled
        debuffIcon,
        disableDuration,
        null, // No per-turn effect needed
        true // isDebuff = true
    ).setDescription(`Cannot use ${abilityToDisable.name} for ${disableDuration} turns.`);
    
    // Store which ability index and ID were disabled
    disableDebuff.disabledAbilityIndex = abilityIndexToDisable;
    disableDebuff.disabledAbilityId = abilityToDisable.id;
    
    // Apply the disable effect directly to the ability
    abilityToDisable.isDisabled = true;
    abilityToDisable.disabledDuration = disableDuration;
    abilityToDisable.disabledByTalent = 'disruptive_lash'; // Add source info
    
    // Define the remove function for when the debuff expires
    disableDebuff.remove = function(character) {
        // Find the specific ability that was disabled
        const originallyDisabledAbility = character.abilities.find(a => a.id === this.disabledAbilityId);
        if (originallyDisabledAbility) {
            // Only re-enable if the ability's disable duration has run out
            if (originallyDisabledAbility.isDisabled && originallyDisabledAbility.disabledDuration <= 0) {
                originallyDisabledAbility.isDisabled = false;
                delete originallyDisabledAbility.disabledByTalent; // Remove talent source info
                console.log(`${character.name}'s ${originallyDisabledAbility.name} is no longer disabled by Mystical Whip.`);
                
                // Update UI to reflect the change
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
                
                // If we have direct access to the DOM, update the ability element
                const characterId = character.instanceId || character.id;
                const abilityElements = document.querySelectorAll(`#character-${characterId} .ability`);
                abilityElements.forEach((abilityEl, index) => {
                    if (index < character.abilities.length && character.abilities[index].id === originallyDisabledAbility.id) {
                        abilityEl.removeAttribute('data-talent-source');
                    }
                });
            }
        } else {
            console.log(`[AbilityDisable] Could not find ability ${this.disabledAbilityId} on ${character.name} to re-enable.`);
        }
    };
    
    // Apply the debuff to the target (clone to ensure it's unique)
    target.addDebuff(disableDebuff.clone());
    
    // Show VFX for the ability disable
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        const disableVfx = document.createElement('div');
        disableVfx.className = 'ability-disable-vfx';
        targetElement.appendChild(disableVfx);
        setTimeout(() => disableVfx.remove(), 800);
    }
    
    return abilityToDisable;
}

/**
 * Show stun visual effect on the target
 */
function showStunVFX(target) {
    // Get target element
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) {
        console.error(`[StunVFX] Target element not found for ${target.name} (ID: ${targetId})`);
        return;
    }
    
    // Create stun VFX container
    const stunContainer = document.createElement('div');
    stunContainer.className = 'whip-stun-vfx';
    targetElement.appendChild(stunContainer);
    
    // Add stun stars
    const stunStars = document.createElement('div');
    stunStars.className = 'whip-stun-stars';
    stunStars.textContent = '✦ ✦ ✦';
    stunContainer.appendChild(stunStars);
    
    // Remove stun VFX after animation completes
    setTimeout(() => {
        if (targetElement.contains(stunContainer)) {
            targetElement.removeChild(stunContainer);
        }
    }, 1500);
}

/**
 * Show Mystical Whip visual effect
 * @param {Object} caster - The character casting the ability
 * @param {Object} target - The target receiving the ability
 * @param {boolean} isChainTarget - Whether this is a secondary target from Chain Whip talent
 */
function showWhipVFX(caster, target, isChainTarget = false) {
    // Get DOM elements
    const casterId = caster.instanceId || caster.id;
    const targetId = target.instanceId || target.id;
    
    const casterElement = document.getElementById(`character-${casterId}`);
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!casterElement || !targetElement) {
        console.error(`[WhipVFX] Cannot find elements. Caster: ${!!casterElement}, Target: ${!!targetElement}`);
        return;
    }
    
    // Create VFX container
    setTimeout(() => {
        try {
            // Add shake animation to target
            targetElement.classList.add('target-shake');
            setTimeout(() => targetElement.classList.remove('target-shake'), 600);
            
            // Create whip container
            const whipContainer = document.createElement('div');
            whipContainer.className = 'renee-whip-vfx';
            
            // Add chain class for secondary targets
            if (isChainTarget) {
                whipContainer.classList.add('chain-whip');
            }
            
            targetElement.appendChild(whipContainer);
            
            // Create whip slash lines
            for (let i = 0; i < 2; i++) {
                const whipSlash = document.createElement('div');
                whipSlash.className = 'whip-slash';
                
                // Make slashes more electric for chain targets
                if (isChainTarget) {
                    whipSlash.classList.add('chain-slash');
                }
                
                whipContainer.appendChild(whipSlash);
            }
            
            // Create whip trail effect
            const whipTrail = document.createElement('div');
            whipTrail.className = 'whip-trail';
            
            // Make trail more electric for chain targets
            if (isChainTarget) {
                whipTrail.classList.add('chain-trail');
            }
            
            whipContainer.appendChild(whipTrail);
            
            // Create impact effect
            const whipImpact = document.createElement('div');
            whipImpact.className = 'whip-impact';
            
            // Make impact more electric for chain targets
            if (isChainTarget) {
                whipImpact.classList.add('chain-impact');
            }
            
            whipContainer.appendChild(whipImpact);
            
            // Create particles
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.className = 'whip-particle';
                
                // Make particles more electric for chain targets
                if (isChainTarget) {
                    particle.classList.add('chain-particle');
                }
                
                // Randomize particle properties
                const angle = Math.random() * Math.PI * 2;
                const distance = 70 + Math.random() * 120;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                particle.style.setProperty('--x', `${x}px`);
                particle.style.setProperty('--y', `${y}px`);
                particle.style.left = `${40 + Math.random() * 20}%`;
                particle.style.top = `${40 + Math.random() * 20}%`;
                particle.style.animationDelay = `${Math.random() * 0.2}s`;
                
                whipContainer.appendChild(particle);
            }
            
            // Add chain lightning effect between target and primary target if this is a chain target
            if (isChainTarget) {
                // Find player characters to connect with a lightning line
                const enemies = caster.isAI ? 
                    document.querySelectorAll('.character-slot:not(.ai-character)') : 
                    document.querySelectorAll('.character-slot.ai-character');
                
                if (enemies.length > 0) {
                    // Create connecting lightning between targets
                    const chainLightning = document.createElement('div');
                    chainLightning.className = 'chain-lightning';
                    targetElement.appendChild(chainLightning);
                    
                    // Create multiple lightning segments for more realistic effect
                    for (let i = 0; i < 3; i++) {
                        const lightningSegment = document.createElement('div');
                        lightningSegment.className = 'lightning-segment';
                        chainLightning.appendChild(lightningSegment);
                    }
                    
                    // Remove chain lightning after animation
                    setTimeout(() => {
                        if (targetElement.contains(chainLightning)) {
                            targetElement.removeChild(chainLightning);
                        }
                    }, 600);
                }
            }
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (targetElement.contains(whipContainer)) {
                    targetElement.removeChild(whipContainer);
                }
            }, 1200);
            
        } catch (error) {
            console.error(`[WhipVFX] Error creating VFX:`, error);
        }
    }, 50);
}

/**
 * Show mana drain visual effect between two characters
 */
function showManaDrainVFX(caster, target, drainAmount) {
    // Get DOM elements
    const casterId = caster.instanceId || caster.id;
    const targetId = target.instanceId || target.id;
    
    const casterElement = document.getElementById(`character-${casterId}`);
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!casterElement || !targetElement) {
        console.error(`[ManaDrainVFX] Cannot find elements. Caster: ${!!casterElement}, Target: ${!!targetElement}`);
        return;
    }
    
    // Create floating text indicators
    if (window.gameManager && typeof window.gameManager.showFloatingText === 'function') {
        // Show mana loss on target
        window.gameManager.showFloatingText(`character-${targetId}`, `-${drainAmount} Mana`, 'debuff');
        
        // Show mana gain on caster
        window.gameManager.showFloatingText(`character-${casterId}`, `+${drainAmount} Mana`, 'buff');
    }
    
    // Create mana drain beam effect connecting the characters
    const manaDrainBeam = document.createElement('div');
    manaDrainBeam.className = 'mana-drain-beam';
    document.body.appendChild(manaDrainBeam);
    
    // Position the beam between target and caster
    const targetRect = targetElement.getBoundingClientRect();
    const casterRect = casterElement.getBoundingClientRect();
    
    // Calculate center points
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const casterCenterX = casterRect.left + casterRect.width / 2;
    const casterCenterY = casterRect.top + casterRect.height / 2;
    
    // Calculate beam angle and length
    const angle = Math.atan2(casterCenterY - targetCenterY, casterCenterX - targetCenterX);
    const length = Math.sqrt(
        Math.pow(casterCenterX - targetCenterX, 2) + 
        Math.pow(casterCenterY - targetCenterY, 2)
    );
    
    // Apply styles to position and rotate the beam
    manaDrainBeam.style.width = `${length}px`;
    manaDrainBeam.style.left = `${targetCenterX}px`;
    manaDrainBeam.style.top = `${targetCenterY}px`;
    manaDrainBeam.style.transform = `rotate(${angle}rad)`;
    manaDrainBeam.style.transformOrigin = '0 50%';
    
    // Add mana particles flowing along the beam
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'mana-drain-particle';
        particle.style.animationDelay = `${i * 0.1}s`;
        manaDrainBeam.appendChild(particle);
    }
    
    // Play mana drain sound effect
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/mana_drain.mp3', 0.6);
    }
    
    // Remove beam after animation completes
    setTimeout(() => {
        if (manaDrainBeam.parentNode) {
            manaDrainBeam.remove();
        }
    }, 1000);
}

// Add CSS for VFX effects via a style element since we don't have direct access to CSS files
function addReneeVFXStyles() {
    // Check if styles are already added
    if (document.getElementById('renee-vfx-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'renee-vfx-styles';
    styleElement.textContent = `
        /* Mana Drain Effects */
        .mana-drain-beam {
            position: fixed;
            height: 5px;
            background: linear-gradient(to right, rgba(0, 150, 255, 0.7), rgba(0, 100, 255, 0.5));
            z-index: 100;
            border-radius: 2px;
            overflow: hidden;
            pointer-events: none;
        }
        
        .mana-drain-particle {
            position: absolute;
            width: 10px;
            height: 10px;
            background: rgba(0, 200, 255, 0.8);
            border-radius: 50%;
            top: -2.5px;
            left: 0;
            animation: mana-drain-flow 1s linear forwards;
        }
        
        /* Wolf Claw VFX */
        .renee-claw-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }
        
        .claw-mark {
            position: absolute;
            width: 80%;
            height: 3px;
            background: linear-gradient(90deg, transparent, #ff4444, transparent);
            top: 30%;
            left: 10%;
            transform: rotate(-15deg);
            animation: claw-slash 0.3s ease-out;
        }
        
        .claw-particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff6666;
            border-radius: 50%;
            animation: claw-particle-burst 0.6s ease-out forwards;
        }
        
        /* Whip VFX */
        .renee-whip-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }
        
        .whip-slash {
            position: absolute;
            width: 90%;
            height: 4px;
            background: linear-gradient(90deg, transparent, #9944ff, transparent);
            top: 40%;
            left: 5%;
            animation: whip-lash 0.4s ease-out;
        }
        
        .whip-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #bb66ff;
            border-radius: 50%;
            animation: whip-particle-burst 0.8s ease-out forwards;
        }
        
        /* Stealth VFX */
        .wolf-spirit-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(100, 150, 255, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: stealth-pulse 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 5;
        }
        
        .renee-stealth-active {
            opacity: 0.6;
            filter: blur(1px);
        }
        
        /* Lunar Curse VFX */
        .lunar-curse-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
        }
        
        .lunar-glow {
            position: absolute;
            top: -20%;
            left: -20%;
            width: 140%;
            height: 140%;
            background: radial-gradient(circle, rgba(200, 180, 255, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: lunar-glow 3s ease-out;
        }
        
        .lunar-mark-debuff {
            position: absolute;
            top: 10%;
            right: 10%;
            width: 30px;
            height: 30px;
            background: rgba(150, 100, 255, 0.8);
            border-radius: 50%;
            animation: lunar-mark-pulse 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
        }
        
        /* Stun VFX */
        .whip-stun-vfx, .lunar-stun-vfx {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
        }
        
        .whip-stun-stars, .lunar-stun-stars {
            position: absolute;
            top: -10%;
            left: 50%;
            transform: translateX(-50%);
            color: #ffff44;
            font-size: 16px;
            animation: stun-stars 1.5s ease-out;
        }
        
        /* Shake effect */
        .target-shake {
            animation: target-shake 0.5s ease-in-out;
        }
        
        /* Animations */
        @keyframes mana-drain-flow {
            0% { left: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
        }
        
        @keyframes claw-slash {
            0% { opacity: 0; transform: rotate(-15deg) scaleX(0); }
            50% { opacity: 1; transform: rotate(-15deg) scaleX(1); }
            100% { opacity: 0; transform: rotate(-15deg) scaleX(1); }
        }
        
        @keyframes claw-particle-burst {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--x, 50px), var(--y, 50px)) scale(0); }
        }
        
        @keyframes whip-lash {
            0% { opacity: 0; transform: scaleX(0); }
            50% { opacity: 1; transform: scaleX(1); }
            100% { opacity: 0; transform: scaleX(1); }
        }
        
        @keyframes whip-particle-burst {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--x, 60px), var(--y, 60px)) scale(0); }
        }
        
        @keyframes stealth-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        @keyframes lunar-glow {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 0.8; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1); }
        }
        
        @keyframes lunar-mark-pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes stun-stars {
            0% { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.5); }
            50% { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.2); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(1); }
        }
        
        @keyframes target-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Make sure to call addReneeVFXStyles when the ability module is loaded
(function() {
    setTimeout(addReneeVFXStyles, 0);
})();

/**
 * Renée's Lunar Curse (R) ability
 * Places a buff on herself for 5 turns. When she damages enemies, they receive a debuff.
 * The debuff causes them to take double damage and stuns them when it expires.
 */
const reneeLunarCurseEffect = function(caster, targetOrTargets, abilityInstance, actualManaCost, options = {}) {
    console.log('[LunarCurse] Effect called with parameters:', { caster: caster?.name });
    
    // Early initialization phase - set baseDescription directly
    if (abilityInstance && !abilityInstance.baseDescription) {
        console.log('[LunarCurse] Setting baseDescription during effect call');
        abilityInstance.baseDescription = 'Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.';
        
        // Also set up generateDescription method if it doesn't exist
        if (typeof abilityInstance.generateDescription !== 'function') {
            abilityInstance.generateDescription = function() {
                let desc = this.baseDescription;
                let talentEffects = '';
                
                // Add talent-specific descriptions
                if (this.enableLunarCascade) {
                    talentEffects += "\n<span class='talent-effect utility'>🌙 Lunar Cascade: 15% chance to cast Wolf Claw Strike or Mystical Whip on a random enemy.</span>";
                }
                
                // Lunar Devastation talent
                if (this.caster && this.caster.enableLunarDevastation) {
                    talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Devastation: Lunar Marked enemies now take triple damage instead of double while marked.</span>`;
                }
                
                // Lunar Empowerment talent
                if (this.caster && this.caster.enableLunarEmpowerment) {
                    talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Empowerment: While Lunar Curse is active, gain +15% Critical Chance and +25% Critical Damage.</span>`;
                }
                
                this.description = desc + talentEffects;
                return this.description;
            };
            
            // Generate initial description
            abilityInstance.generateDescription();
        }
    }
    
    return executeLunarCurse(caster, abilityInstance);
};

/**
 * Actual implementation of Lunar Curse
 */
function executeLunarCurse(caster, abilityInstance) {
    // Get game manager for utility functions
    const gameManager = window.gameManager;
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Prevent stacking: remove existing lunar curse buff if present
    if (caster.hasBuff('renee_lunar_curse_buff')) {
        caster.removeBuff('renee_lunar_curse_buff');
    }
    
    // Show Lunar Curse VFX on cast
    showLunarCurseVFX(caster);
    
    // Play moon sound if available
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/lunar_cast.mp3', 0.7);
    }
    
    // Define the lunar curse buff
    const lunarCurseBuff = {
        id: 'renee_lunar_curse_buff',
        name: 'Lunar Curse',
        icon: 'Icons/abilities/lunar_mark.png',
        duration: 5,
        description: 'Enemies damaged by Renée are marked with a Lunar Mark that causes them to take double damage. When the mark expires, they are stunned for 1 turn.',
        _damageListeners: null,
        
        // When the buff is applied
        onApply(target) {
            console.log(`[LunarCurse] Buff applied to ${target.name}`);
            
            // Create damage listener function to apply lunar mark to damaged enemies
            this._damageListeners = (event) => {
                const { source: eventCaster, target: eventDamagedTarget, damage: eventDamage, isCritical: eventIsCritical } = event.detail || {};
                // `target` here is from the onApply scope (the buff holder, Renée)
                console.log(`[LunarCurse Listener] Event received. Buff Holder: ${target.name} (ID: ${target.id}, Instance: ${target.instanceId}).`);
                if (eventCaster) {
                    console.log(`[LunarCurse Listener] Event Caster: ${eventCaster.name} (ID: ${eventCaster.id}, Instance: ${eventCaster.instanceId}, isAI: ${eventCaster.isAI}).`);
                } else {
                    console.log(`[LunarCurse Listener] Event Caster: N/A`);
                }
                if (eventDamagedTarget) {
                    console.log(`[LunarCurse Listener] Damaged Target: ${eventDamagedTarget.name} (ID: ${eventDamagedTarget.id}, Instance: ${eventDamagedTarget.instanceId}, isAI: ${eventDamagedTarget.isAI}).`);
                } else {
                    console.log(`[LunarCurse Listener] Damaged Target: N/A`);
                }
                console.log(`[LunarCurse Listener] Damage: ${eventDamage}`);

                console.log(`[LunarCurse Listener] Evaluating condition for early return:`);
                const condition_noEventCaster = !eventCaster;
                const condition_casterIdMismatch = eventCaster ? (eventCaster.id !== target.id) : true; // If no eventCaster, consider it a mismatch
                const condition_noEventDamagedTarget = !eventDamagedTarget;
                const condition_targetIsAlly = eventDamagedTarget && eventCaster ? (eventDamagedTarget.isAI === eventCaster.isAI) : true; // If no target/caster, consider it an issue
                const condition_noDamage = eventDamage <= 0;

                console.log(`[LunarCurse Listener] 1. !eventCaster: ${condition_noEventCaster}`);
                console.log(`[LunarCurse Listener] 2. eventCaster.id !== target.id: ${condition_casterIdMismatch} (eventCaster.id: ${eventCaster ? eventCaster.id : 'N/A'}, target.id: ${target.id})`);
                console.log(`[LunarCurse Listener] 3. !eventDamagedTarget: ${condition_noEventDamagedTarget}`);
                console.log(`[LunarCurse Listener] 4. eventDamagedTarget.isAI === eventCaster.isAI: ${condition_targetIsAlly} (DamagedTarget.isAI: ${eventDamagedTarget ? eventDamagedTarget.isAI : 'N/A'}, eventCaster.isAI: ${eventCaster ? eventCaster.isAI : 'N/A'})`);
                console.log(`[LunarCurse Listener] 5. eventDamage <= 0: ${condition_noDamage}`);
                
                if (condition_noEventCaster || condition_casterIdMismatch || condition_noEventDamagedTarget || condition_targetIsAlly || condition_noDamage) {
                    console.log(`[LunarCurse Listener] Condition MET (one or more true), returning early.`);
                    return;
                }
                
                console.log(`[LunarCurse] Damage event detected from ${eventCaster.name} to ${eventDamagedTarget.name}`); // Original log, should now appear
                
                // Apply lunar mark debuff to the damaged enemy
                applyLunarMarkDebuff(eventDamagedTarget, target); // Pass buff holder as 2nd arg
            };
            
            // Listen for both event types for compatibility
            document.addEventListener('damageDealt', this._damageListeners);
            document.addEventListener('character:damage-dealt', this._damageListeners);
        },
        
        // When the buff is removed
        onRemove(target) {
            console.log(`[LunarCurse] Buff removed from ${target.name}`);
            
            // Remove event listeners
            if (this._damageListeners) {
                document.removeEventListener('damageDealt', this._damageListeners);
                document.removeEventListener('character:damage-dealt', this._damageListeners);
                this._damageListeners = null;
            }
            
            if (log) log(`${target.name}'s Lunar Curse fades.`, 'renee');
        }
    };
    
    // Apply the buff to Renée
    caster.addBuff(lunarCurseBuff);
    
    // Track Lunar Curse statistics
    if (window.trackLunarCurseStats) {
        window.trackLunarCurseStats(caster);
    }
    
    // Log the effect
    log(`${caster.name} activates Lunar Curse! For 5 turns, her attacks will mark enemies with a curse that doubles damage and stuns when it expires.`, 'renee');
    
    // Return success
    return {
        success: true,
        targets: [caster]
    };
}

/**
 * Apply the lunar mark debuff to a target
 */
function applyLunarMarkDebuff(target, caster) {
    // Get game manager for utilities
    const gameManager = window.gameManager;
    const log = gameManager ? gameManager.addLogEntry.bind(gameManager) : console.log;
    
    // Remove any existing lunar mark
    if (target.hasBuff('renee_lunar_mark_debuff')) {
        target.removeBuff('renee_lunar_mark_debuff');
    }
    
    // Check if Lunar Devastation talent is active
    const damageMultiplier = caster.enableLunarDevastation ? 3.0 : 2.0;
    const damageText = damageMultiplier === 3.0 ? 'triple' : 'double';
    
    // Define the lunar mark debuff
    const lunarMarkDebuff = {
        id: 'renee_lunar_mark_debuff',
        name: 'Lunar Mark',
        icon: 'Icons/abilities/lunar_mark.png',
        duration: 2,
        isDebuff: true,
        increasesDamageTaken: damageMultiplier,
        description: `Marked by the moon. Taking ${damageText} damage from all sources. When this debuff expires, you will be stunned for 1 turn.`,
        warningTriggered: false,
        
        // Show the mark VFX when applied
        onApply(target) {
            console.log(`[LunarMark] Debuff applied to ${target.name}`);
            
            // Create and show the lunar mark VFX
            showLunarMarkVFX(target);
        },
        
        // Check for expiration warning in onTurnStart
        onTurnStart(target) {
            // If duration is 1 (about to expire next turn) and warning hasn't been shown yet
            if (this.duration === 1 && !this.warningTriggered) {
                console.log(`[LunarMark] Warning triggered for ${target.name} - mark about to expire`);
                
                // Show warning VFX
                showLunarMarkWarningVFX(target);
                
                // Set flag to prevent repeated warnings
                this.warningTriggered = true;
                
                // Log the warning
                if (log) log(`The Lunar Mark on ${target.name} pulses ominously as it's about to expire!`, 'renee');
            }
        },
        
        // Apply stun when the debuff expires
        onRemove(target) {
            console.log(`[LunarMark] Debuff expired on ${target.name} - applying stun`);
            
            // Show expiration VFX before applying stun
            showLunarMarkExpirationVFX(target);
            
            // Apply the stun effect
            applyLunarStunEffect(target);
            
            // Log the effect
            if (log) log(`The Lunar Mark on ${target.name} shatters, stunning them for 1 turn!`, 'renee');
            
            // Remove warning VFX elements if they exist
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            if (targetElement) {
                const markElement = targetElement.querySelector('.lunar-mark-debuff');
                if (markElement) {
                    markElement.classList.remove('lunar-mark-warning');
                }
            }
        }
    };
    
    // Apply the debuff to the target
    target.addDebuff(lunarMarkDebuff);
    
    // Log the effect
    log(`${target.name} is marked with a Lunar Mark! They will take double damage for 2 turns and be stunned when it expires.`, 'renee');
}

/**
 * Apply the lunar stun effect when mark expires
 */
function applyLunarStunEffect(target) {
    // Create stun debuff
    const lunarStunDebuff = {
        id: 'renee_lunar_stun',
        name: 'Lunar Stun',
        icon: 'Icons/effects/stun.png',
        duration: 1, // 1 turn stun
        effects: { cantAct: true },
        isDebuff: true,
        description: 'Stunned by lunar power: Cannot act for 1 turn.'
    };
    
    // Apply debuff to target
    target.addDebuff(lunarStunDebuff);
    
    // Show stun VFX
    showLunarStunVFX(target);
    
    return true;
}

/**
 * Show Lunar Curse visual effect on caster
 */
function showLunarCurseVFX(caster) {
    // Get caster DOM element
    const casterId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterId}`);
    
    if (!casterElement) {
        console.error(`[LunarCurseVFX] Cannot find caster element for ${caster.name} (ID: ${casterId})`);
        return;
    }
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'lunar-curse-vfx';
    casterElement.appendChild(vfxContainer);
    
    // Create lunar glow
    const lunarGlow = document.createElement('div');
    lunarGlow.className = 'lunar-glow';
    vfxContainer.appendChild(lunarGlow);
    
    // Create moon circle
    const moonCircle = document.createElement('div');
    moonCircle.className = 'moon-circle';
    vfxContainer.appendChild(moonCircle);
    
    // Create moon
    const moon = document.createElement('div');
    moon.className = 'moon';
    moonCircle.appendChild(moon);
    
    // Create stars
    const lunarStars = document.createElement('div');
    lunarStars.className = 'lunar-stars';
    vfxContainer.appendChild(lunarStars);
    
    // Create individual stars
    for (let i = 0; i < 8; i++) {
        const star = document.createElement('div');
        star.className = 'lunar-star';
        lunarStars.appendChild(star);
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        if (casterElement.contains(vfxContainer)) {
            casterElement.removeChild(vfxContainer);
        }
    }, 3000);
}

/**
 * Show Lunar Mark visual effect on target
 */
function showLunarMarkVFX(target) {
    // Get target DOM element
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) {
        console.error(`[LunarMarkVFX] Cannot find target element for ${target.name} (ID: ${targetId})`);
        return;
    }
    
    // Create VFX container
    const markContainer = document.createElement('div');
    markContainer.className = 'lunar-mark-debuff';
    targetElement.appendChild(markContainer);
    
    // Create mark symbol
    const markSymbol = document.createElement('div');
    markSymbol.className = 'lunar-mark-symbol';
    markContainer.appendChild(markSymbol);
    
    // Create mark aura
    const markAura = document.createElement('div');
    markAura.className = 'lunar-mark-aura';
    markContainer.appendChild(markAura);
    
    // Play sound effect if available
    const gameManager = window.gameManager;
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/lunar_mark.mp3', 0.5);
    }
}

/**
 * Show warning VFX when lunar mark is about to expire
 */
function showLunarMarkWarningVFX(target) {
    // Get target DOM element
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) {
        console.error(`[LunarMarkWarningVFX] Cannot find target element for ${target.name} (ID: ${targetId})`);
        return;
    }
    
    // Find the existing mark container
    const markContainer = targetElement.querySelector('.lunar-mark-debuff');
    if (markContainer) {
        // Add warning class to intensify the effect
        markContainer.classList.add('lunar-mark-warning');
        
        // Play warning sound if available
        const gameManager = window.gameManager;
        if (gameManager && typeof gameManager.playSound === 'function') {
            gameManager.playSound('sounds/lunar_warning.mp3', 0.6);
        }
    } else {
        console.error(`[LunarMarkWarningVFX] Mark container not found for ${target.name}`);
    }
}

/**
 * Show expiration effect when lunar mark triggers the stun
 */
function showLunarMarkExpirationVFX(target) {
    // Get target DOM element
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) {
        console.error(`[LunarMarkExpirationVFX] Cannot find target element for ${target.name} (ID: ${targetId})`);
        return;
    }
    
    // Remove the existing mark container
    const existingMark = targetElement.querySelector('.lunar-mark-debuff');
    if (existingMark) {
        targetElement.removeChild(existingMark);
    }
    
    // Create the lunar stun VFX
    showLunarStunVFX(target);
    
    // Play stun sound if available
    const gameManager = window.gameManager;
    if (gameManager && typeof gameManager.playSound === 'function') {
        gameManager.playSound('sounds/lunar_break.mp3', 0.7);
    }
}

/**
 * Show lunar stun visual effect
 */
function showLunarStunVFX(target) {
    // Get target DOM element
    const targetId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetId}`);
    
    if (!targetElement) {
        console.error(`[LunarStunVFX] Cannot find target element for ${target.name} (ID: ${targetId})`);
        return;
    }
    
    // Create stun VFX container
    const stunContainer = document.createElement('div');
    stunContainer.className = 'lunar-stun-vfx';
    targetElement.appendChild(stunContainer);
    
    // Create stun flash
    const stunFlash = document.createElement('div');
    stunFlash.className = 'lunar-stun-flash';
    stunContainer.appendChild(stunFlash);
    
    // Create stun stars
    const stunStars = document.createElement('div');
    stunStars.className = 'lunar-stun-stars';
    stunStars.textContent = '✦ ✦ ✦';
    stunContainer.appendChild(stunStars);
    
    // Add shake animation to target
    targetElement.classList.add('target-shake');
    setTimeout(() => targetElement.classList.remove('target-shake'), 600);
    
    // Remove stun VFX after animation completes
    setTimeout(() => {
        if (targetElement.contains(stunContainer)) {
            targetElement.removeChild(stunContainer);
        }
    }, 1500);
}

/**
 * Register the abilities with the AbilityFactory
 */
function registerAbilities() {
    console.log('[Renée Abilities] Registering abilities...');
    
    // Wait for AbilityFactory to be available
    if (!window.AbilityFactory || typeof window.AbilityFactory.registerAbilityEffect !== 'function') {
        console.warn('[Renée Abilities] AbilityFactory not ready, will retry...');
        return false;
    }
    
    try {
        // Register all effect functions by name (used by JSON functionName)
        console.log('[Renée Abilities] Registering effect functions...');
        window.AbilityFactory.registerAbilityEffect('reneeWolfClawStrikeEffect', reneeWolfClawStrikeEffect);
        window.AbilityFactory.registerAbilityEffect('reneeLupineVeilEffect', reneeLupineVeilEffect);
        window.AbilityFactory.registerAbilityEffect('reneeMysticalWhipEffect', reneeMysticalWhipEffect);
        window.AbilityFactory.registerAbilityEffect('reneeLunarCurseEffect', reneeLunarCurseEffect);
        
        // Also register by ability ID for good measure
        window.AbilityFactory.registerAbilityEffect('renee_q', reneeWolfClawStrikeEffect);
        window.AbilityFactory.registerAbilityEffect('renee_w', reneeLupineVeilEffect);
        window.AbilityFactory.registerAbilityEffect('renee_e', reneeMysticalWhipEffect);
        window.AbilityFactory.registerAbilityEffect('renee_r', reneeLunarCurseEffect);
        
        console.log('[Renée Abilities] Successfully registered all abilities');
        return true;
    } catch (error) {
        console.error('[Renée Abilities] Failed to register abilities:', error);
        return false;
    }
}

/**
 * Initialize hooks and registrations
 */
function initializeHook() {
    console.log('[Renée Abilities] Initializing Renée abilities');
    
    try {
        // Register abilities first
        if (!registerAbilities()) {
            console.warn('[Renée Abilities] registerAbilities may not have completed successfully');
        }
        
        // Add description generators to abilities with error handling
        try {
            addGenerateDescriptionMethods();
        } catch (error) {
            console.error('[Renée Abilities] Error in addGenerateDescriptionMethods:', error);
        }
        
        // Make sure descriptions are initialized
        setTimeout(() => {
            console.log('[Renée Abilities] Running delayed description initialization...');
            
            try {
                if (window.AbilityFactory && window.AbilityFactory.abilityRegistry) {
                    // Check if abilities have proper descriptions
                    let missingDescriptions = false;
                    
                    ['renee_q', 'renee_w', 'renee_e', 'renee_r'].forEach(abilityId => {
                        const ability = window.AbilityFactory.abilityRegistry[abilityId];
                        if (!ability) {
                            console.warn(`[Renée Abilities] Ability ${abilityId} not found in registry after delay`);
                            missingDescriptions = true;
                            return;
                        }
                        
                        // Log the current state
                        console.log(`[Renée Abilities] Delayed check - ${abilityId} - baseDescription: ${!!ability.baseDescription}, description: ${!!ability.description}`);
                        
                        // Check for missing descriptions
                        if (!ability.baseDescription) {
                            missingDescriptions = true;
                            console.warn(`[Renée Abilities] baseDescription still missing for ${abilityId} after delay`);
                            
                            // Set fallback baseDescription based on ability ID
                            switch(abilityId) {
                                case 'renee_q':
                                    ability.baseDescription = 'Renée attacks with her claws, dealing 700 + 1% of target\'s maximum HP as physical damage. This ability\'s critical chance is doubled.';
                                    break;
                                case 'renee_w':
                                    ability.baseDescription = 'Renée becomes untargetable and enters stealth for up to 3 turns. While stealthed, her critical chance is 100%. Using any other ability or letting the effect expire breaks stealth. Does not end your turn.';
                                    break;
                                case 'renee_e':
                                    ability.baseDescription = 'Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.';
                                    break;
                                case 'renee_r':
                                    ability.baseDescription = 'Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.';
                                    break;
                            }
                        }
                        
                        // Ensure generateDescription method exists
                        if (typeof ability.generateDescription !== 'function') {
                            console.warn(`[Renée Abilities] generateDescription method missing from ${abilityId} after delay, adding it`);
                            
                            // Add a basic generateDescription method if missing
                            ability.generateDescription = function() {
                                return this.description = this.baseDescription || this.description;
                            };
                        }
                        
                        // Generate description
                        try {
                            ability.generateDescription();
                            console.log(`[Renée Abilities] Generated description for ${abilityId} in delayed initialization`);
                        } catch (error) {
                            console.error(`[Renée Abilities] Error generating description for ${abilityId} in delayed initialization:`, error);
                        }
                    });
                    
                    if (missingDescriptions) {
                        console.warn('[Renée Abilities] Some descriptions were missing and fixed in delayed initialization');
                    } else {
                        console.log('[Renée Abilities] All descriptions verified in delayed initialization');
                    }
                } else {
                    console.error('[Renée Abilities] AbilityFactory or registry not available in delayed initialization');
                }
            } catch (error) {
                console.error('[Renée Abilities] Error in delayed description initialization:', error);
            }
        }, 1000); // Use a longer delay to ensure everything is loaded
        
        // Add ability-used event listener for Opportunistic Spirit talent
        document.addEventListener('AbilityUsed', (event) => {
            try {
                const detail = event.detail || {};
                const caster = detail.caster;
                const ability = detail.ability;
                
                // Check if this is Renée using an ability and if we have a result
                if (caster && caster.id && caster.id.includes('renee') && ability) {
                    // Store the result in window.abilityLastResult
                    // This lets the Character class detect if the ability should end the turn
                    window.abilityLastResult = window.abilityLastResult || {};
                    
                    // Send the preventTurnEnd signal through this global object
                    // GameManager checks this property when deciding whether to end turn
                    if (caster.enableOpportunisticSpirit) {
                        // The actual check and setting is done in the onAbilityUsed method in Renée's passive
                        console.log(`[ReneeAbilities] Ability used with Opportunistic Spirit talent enabled`);
                    }
                }
            } catch (error) {
                console.error('[Renée Abilities] Error in AbilityUsed event handler:', error);
            }
        });
        
        console.log('[Renée Abilities] Initialization complete');
    } catch (error) {
        console.error('[Renée Abilities] Fatal error during initialization:', error);
    }
}

/**
 * Register the abilities with the AbilityFactory - Main Entry Point
 */
(function() {
    console.log('[Renée Abilities] Module loaded, setting up registration...');
    
    // Function to attempt registration with retry logic
    function attemptRegistration() {
        if (window.AbilityFactory && typeof window.AbilityFactory.registerAbilityEffect === 'function') {
            console.log('[Renée Abilities] AbilityFactory found, registering abilities');
            const success = registerAbilities();
            if (success) {
                console.log('[Renée Abilities] Registration completed successfully');
                return true;
            } else {
                console.warn('[Renée Abilities] Registration failed, will retry');
                return false;
            }
        } else {
            console.log('[Renée Abilities] AbilityFactory not ready yet');
            return false;
        }
    }
    
    // Try immediate registration
    if (attemptRegistration()) {
        return; // Success, no need for further attempts
    }
    
    // Set up multiple fallback attempts
    let attempts = 0;
    const maxAttempts = 10;
    const retryInterval = 500; // 500ms
    
    const retryRegistration = () => {
        attempts++;
        console.log(`[Renée Abilities] Registration attempt ${attempts}/${maxAttempts}`);
        
        if (attemptRegistration()) {
            console.log('[Renée Abilities] Registration successful on retry');
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(retryRegistration, retryInterval);
        } else {
            console.error('[Renée Abilities] Failed to register abilities after maximum attempts');
        }
    };
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(retryRegistration, 100);
        });
    } else {
        setTimeout(retryRegistration, 100);
    }
    
    // Final fallback on window load
    window.addEventListener('load', () => {
        if (!window.AbilityFactory?.registeredEffects?.reneeWolfClawStrikeEffect) {
            console.log('[Renée Abilities] Final attempt on window load');
            attemptRegistration();
        }
    });
})();

// Add generateDescription methods to each ability
const updateReneeAbilityDescriptionsForTalents = (character) => {
    if (!character || character.id !== 'renée') return;
    
    console.log(`[ReneeTalents] Updating ability descriptions for talents...`);
    
    // Update passive description
    if (character.passive) {
        // It's crucial to get the *original* base description before appending talent effects.
        // This assumes the passive object on the character might have an originalBaseDescription field, or we fetch it.
        // For simplicity, if character.passive.originalBaseDescription doesn't exist, we use current description as a fallback ONE TIME.
        if (!character.passive.originalBaseDescription) {
            character.passive.originalBaseDescription = character.passive.description || "Renée channels a mystical wolf spirit, creating an aura around her that grants her and allies -1 cooldown on a random ability on game start.";
        }
        let passiveDescription = character.passive.originalBaseDescription;
        let talentEffects = '';
        
        // Add Lone Wolf talent description
        if (character.enableLoneWolfTalent) {
            talentEffects += '\n<span class="talent-effect utility">🐺 **Lone Wolf**: When alone, gain 3000 HP and 3% Armor & Magic Shield.</span>';
        }
        
        // Add Dual Spirit Awakening talent description if enabled
        if (character.dualSpiritAwakening) {
            talentEffects += '\n<span class="talent-effect utility">🐺 **Dual Spirit Awakening**: Start with a second Wolf Spirit, reducing an additional ability\'s cooldown.</span>';
        }
        
        // Add Opportunistic Spirit to description if enabled
        if (character.enableOpportunisticSpirit) {
            talentEffects += `\n<span class="talent-effect utility">⚡ **Opportunistic Spirit**: Your abilities have a 5% chance to not end your turn and another 5% chance to instantly refresh their cooldown.</span>`;
        }
        
        // Add Cornered Predator to description if enabled
        if (character.enableCorneredPredator) {
            talentEffects += `\n<span class="talent-effect damage">⚡ **Cornered Predator**: Gain 25% additional Critical Chance when your HP is below 50%.</span>`;
        }
        
        // Add Moonlit Reflexes to description if enabled
        if (character.enableMoonlitReflexes) {
            talentEffects += `\n<span class="talent-effect utility">🌙 **Moonlit Reflexes**: Using abilities grants 10% dodge chance for 5 turns, stacking up to 3 times.</span>`;
        }
        
        // Add Lunar Resonance to description if enabled
        if (character.enableLunarResonance) {
            talentEffects += `\n<span class="talent-effect utility">🌙 **Lunar Resonance**: 10% chance when casting an ability to reduce a random ability on cooldown by 1 turn.</span>`;
        }
        
        // Apply the updated description with talent effects
        character.passive.description = passiveDescription + talentEffects;
    }
    
    // Update ability descriptions by calling generateDescription
    character.abilities.forEach(ability => {
        if (typeof ability.generateDescription === 'function') {
            // Ensure the ability has a baseDescription before generating
            if (!ability.baseDescription && ability.description) {
                console.log(`[ReneeTalents] Setting missing baseDescription for ${ability.id} from existing description`);
                ability.baseDescription = ability.description; // This should have been set by the new Ability constructor logic
            }
            
            // Check and set Lunar Cascade talent for Lunar Curse ability
            if (ability.id === 'renee_r') {
                const hasLunarCascade = character.abilities.some(a => a.id === 'renee_r' && a.enableLunarCascade);
                if (hasLunarCascade) {
                    console.log('[Talent Description] Lunar Cascade talent detected for Lunar Curse');
                    ability.enableLunarCascade = true;
                }
            }
            
            try {
                ability.generateDescription(); // This will now use the more user-friendly talent strings
                console.log(`[ReneeTalents] Updated description for ${ability.id}`);
            } catch (error) {
                console.error(`[ReneeTalents] Error generating description for ${ability.id}:`, error);
            }
        } else {
            console.warn(`[ReneeTalents] Ability ${ability.id} doesn't have generateDescription method`);
        }
    });
    
    // Update Wolf Claw Strike description for Primal Healing
    const wolfClawAbility = character.abilities.find(a => a.id === "renee_q");
    if (wolfClawAbility) {
        const description = updateWolfClawDescription(wolfClawAbility, character);
        wolfClawAbility.setDescription(description);
    }
};

// This function should be populated by addGenerateDescriptionMethods or similar logic
const reneeAbilityGenerators = {};

window.getReneeAbilityGenerateDescription = function(abilityId) {
    // Return specific generators for each ability
    switch(abilityId) {
        case 'renee_q':
            return function() {
                let desc = this.baseDescription || "Renée attacks with her claws, dealing 700 + 1% of target's maximum HP as physical damage. This ability's critical chance is doubled.";
                let talentEffects = '';
                if (this.chanceToTriggerStealth) {
                    talentEffects += `\n<span class="talent-effect utility">🐾 Instinctive Veil: ${Math.round(this.chanceToTriggerStealth * 100)}% chance to trigger Lupine Veil for 2 turns.</span>`;
                }
                if (this.triggerTwiceChance) {
                    talentEffects += `\n<span class="talent-effect damage">Double Claw: ${Math.round(this.triggerTwiceChance * 100)}% chance to strike a second time.</span>`;
                }
                if (this.enablePrimalHealing) {
                    talentEffects += `\n<span class="talent-effect healing">Primal Healing: Heals for 77% of damage dealt. This healing stacks with any lifesteal.</span>`;
                }
                this.description = desc + talentEffects;
                return this.description;
            };
        case 'renee_w':
            return function() {
                let desc = this.baseDescription || "Renée becomes untargetable and enters stealth for up to 3 turns. While stealthed, her critical chance is 100%. Using any other ability or letting the effect expire breaks stealth. Does not end your turn.";
                let talentEffects = '';
                if (this.character && this.character.enableVeilOfTheMoon) {
                    talentEffects += `\n<span class="talent-effect utility">🌙 <b>Veil of the Moon</b>: Using Lupine Veil decreases all active ability cooldowns by 2.</span>`;
                }
                if (this.character && this.character.enableEndlessVeil) {
                    talentEffects += `\n<span class="talent-effect utility">🌙 <b>Endless Veil</b>: Lupine Veil no longer breaks when using abilities.</span>`;
                }
                this.description = desc + talentEffects;
                return this.description;
            };
        case 'renee_e':
            return function() {
                let desc = this.baseDescription || "Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.";
                let talentEffects = '';
                if (this.enableManaDrain) {
                    talentEffects += `\n<span class="talent-effect resource">⚡ Essence Drain: Steals 50 mana from the target and restores it to Renée.</span>`;
                }
                if (this.enableMagicalDamageScaling) {
                    talentEffects += `\n<span class="talent-effect damage">⚡ Arcane Lash: Also scales with 200% Magical Damage.</span>`;
                }
                if (this.enableAbilityDisable) {
                    talentEffects += `\n<span class="talent-effect utility">⚡ Disruptive Lash: 50% chance to disable a random ability of the target for 2 turns.</span>`;
                }
                if (this.enableChainWhip) {
                    talentEffects += `\n<span class="talent-effect aoe">🔥 Chain Whip: 50% chance to strike an additional random enemy target.</span>`;
                }
                if (this.triggerTwiceChance) {
                    const percent = Math.round(this.triggerTwiceChance * 100);
                    talentEffects += `\n<span class="talent-effect aoe">🐍 Relentless Whip: ${percent}% chance to trigger Mystical Whip twice.</span>`;
                }
                this.description = desc + talentEffects;
                return this.description;
            };
        case 'renee_r':
            return function() {
                let desc = this.baseDescription || "Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.";
                let talentEffects = '';
                if (this.enableLunarCascade) {
                    talentEffects += "\n<span class='talent-effect utility'>🌙 Lunar Cascade: 15% chance to cast Wolf Claw Strike or Mystical Whip on a random enemy.</span>";
                }
                if (this.caster && this.caster.enableLunarDevastation) {
                    talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Devastation: Lunar Marked enemies now take triple damage instead of double while marked.</span>`;
                }
                if (this.caster && this.caster.enableLunarEmpowerment) {
                    talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Empowerment: While Lunar Curse is active, gain +15% Critical Chance and +25% Critical Damage.</span>`;
                }
                this.description = desc + talentEffects;
                return this.description;
            };
        default:
            console.warn(`[getReneeAbilityGenerateDescription] No specific generator for ${abilityId}`);
            return null;
    }
};


// Add generateDescription methods to each ability
const addGenerateDescriptionMethods = () => {
    // Ensure this function is properly defined and accessible, e.g., within an IIFE or module
    // console.log("[Renee Abilities] Attempting to patch AbilityFactory.createAbility for custom descriptions.");

    const originalCreateAbility = AbilityFactory.createAbility;
    AbilityFactory.createAbility = function(abilityData) {
        const ability = originalCreateAbility.apply(this, arguments);

        if (ability && ability.id && ability.id.startsWith('renee_')) {
            // console.log(`[Renee Abilities] Customizing ability: ${ability.id}`);
            let specificGeneratorAssigned = false;
            switch (ability.id) {
                case 'renee_q': // Wolf Claw Strike
                    ability.generateDescription = function() {
                        let desc = this.baseDescription || "Deals {baseDamage} Physical damage. Consecutive strikes on the same target deal 25% increased damage, stacking up to 4 times.";
                        let talentEffects = '';
                        if (this.chanceToTriggerStealth) {
                            talentEffects += `\n<span class="talent-effect utility">🐾 Instinctive Veil: ${this.chanceToTriggerStealth * 100}% chance to trigger Lupine Veil for 1 turn.</span>`;
                        }
                        this.description = desc + talentEffects;
                        // console.log(`[Renee Q GenerateDesc] ID: ${this.id}, EnableStealth: ${this.chanceToTriggerStealth}, FinalDesc: "${this.description}"`);
                        return this.description;
                    };
                    specificGeneratorAssigned = true;
                    break;
                case 'renee_w': // Lupine Veil
                    ability.generateDescription = function() {
                        let desc = this.baseDescription || "Renée harnesses her lupine spirit, gaining Stealth for 2 turns. Her next Wolf Claw Strike deals a guaranteed critical hit and an additional 20% of the target's missing HP as Physical damage (max 2000).";
                        let talentEffects = '';
                        if (this.character && this.character.enableVeilOfTheMoon) {
                            talentEffects += `\n<span class=\"talent-effect utility\">🌙 <b>Veil of the Moon</b>: Using Lupine Veil decreases all active ability cooldowns by 2.</span>`;
                        }
                        if (this.character && this.character.enableEndlessVeil) {
                            talentEffects += `\n<span class=\"talent-effect utility\">🌙 <b>Endless Veil</b>: Lupine Veil no longer breaks when using abilities.</span>`;
                        }
                        this.description = desc + talentEffects;
                        return this.description;
                    };
                    specificGeneratorAssigned = true;
                    break;
                case 'renee_e': // Mystical Whip
                    ability.generateDescription = function() {
                        let desc = this.baseDescription;
                        if (!desc && this.description && this.description.includes("Renée strikes with a glowing whip")) {
                            console.warn(`[Renee E GenerateDesc] Ability ${this.id} missing baseDescription, attempting to use current description as base and strip old talent effects.`);
                            desc = this.description.split('\n<span class="talent-effect')[0];
                        }
                        if (!desc) {
                            // Fallback if baseDescription is still not found
                            desc = "Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.";
                            console.error(`[Renee E GenerateDesc] CRITICAL: Ability ${this.id} had no usable baseDescription. Using default. This might indicate an issue in AbilityFactory or ability JSON.`);
                        }

                        let talentEffects = '';
                        // Mana Drain (Essence Drain)
                        if (this.enableManaDrain) {
                            talentEffects += `\n<span class="talent-effect resource">⚡ Essence Drain: Steals 50 mana from the target and restores it to Renée.</span>`;
                        }
                        // Magical Damage Scaling (Arcane Lash)
                        if (this.enableMagicalDamageScaling) {
                            talentEffects += `\n<span class="talent-effect damage">⚡ Arcane Lash: Also scales with 200% Magical Damage.</span>`;
                        }
                        // Ability Disable (Disruptive Lash)
                        if (this.enableAbilityDisable) {
                            talentEffects += `\n<span class="talent-effect utility">⚡ Disruptive Lash: 50% chance to disable a random ability of the target for 2 turns.</span>`;
                        }
                        // Chain Whip
                        if (this.enableChainWhip) {
                            talentEffects += `\n<span class="talent-effect aoe">🔥 Chain Whip: 50% chance to strike an additional random enemy target.</span>`;
                        }
                        if (this.triggerTwiceChance) {
                            const percent = Math.round(this.triggerTwiceChance * 100);
                            talentEffects += `\n<span class=\"talent-effect aoe\">🐍 Relentless Whip: ${percent}% chance to trigger Mystical Whip twice.</span>`;
                        }
                        if (this.character && this.character.enablePredatorsMomentum) {
                            talentEffects += `\n<span class=\"talent-effect critical\">🩸 Predator's Momentum: Critical hits grant +20% crit chance for 3 turns.</span>`;
                        }
                        
                        this.description = desc + talentEffects;
                        console.log(`[Renee E GenerateDesc DEBUG] Called for ${this.id}. Base: "${desc.substring(0,30)}...". enableChainWhip: ${this.enableChainWhip}. Resulting description: "${this.description.substring(0, 150)}..."`);
                        return this.description;
                    };
                    specificGeneratorAssigned = true;
                    break;
                case 'renee_r': // Lunar Curse
                    ability.generateDescription = function() {
                        let desc = this.baseDescription || "Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.";
                        let talentEffects = '';
                        
                        // Add talent-specific descriptions
                        if (this.enableLunarCascade) {
                            talentEffects += "\n<span class='talent-effect utility'>🌙 Lunar Cascade: 15% chance to cast Wolf Claw Strike or Mystical Whip on a random enemy.</span>";
                        }
                        
                        // Lunar Devastation talent
                        if (this.caster && this.caster.enableLunarDevastation) {
                            talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Devastation: Lunar Marked enemies now take triple damage instead of double while marked.</span>`;
                        }
                        
                        // Lunar Empowerment talent
                        if (this.caster && this.caster.enableLunarEmpowerment) {
                            talentEffects += `\n<span class="talent-effect damage">🌙 Lunar Empowerment: While Lunar Curse is active, gain +15% Critical Chance and +25% Critical Damage.</span>`;
                        }
                        
                        this.description = desc + talentEffects;
                        return this.description;
                    };
                    specificGeneratorAssigned = true;
                    break;
            }

            // After assigning the custom generateDescription, call it once to initialize
            // if the description hasn't been properly set beyond its base.
            if (specificGeneratorAssigned && (ability.description === ability.baseDescription || !ability.description || ability.description.trim() === (ability.baseDescription || "").trim())) {
                // console.log(`[Renee Abilities] Initializing description for ${ability.id} using its new specific generator.`);
                ability.generateDescription();
            }
        }
        return ability;
    };
    // console.log("[Renee Abilities] AbilityFactory.createAbility has been patched.");
};

// ... existing code ...

// Initialize when the script loads
if (typeof window !== 'undefined') {
    window.updateReneeAbilityDescriptionsForTalents = updateReneeAbilityDescriptionsForTalents;
    addGenerateDescriptionMethods();
} 

// Add a global hook to ensure baseDescription is set for all Renée abilities
(function() {
    // Wait for window and Ability to be available
    const checkInterval = setInterval(() => {
        if (window.Ability && window.Ability.prototype) {
            clearInterval(checkInterval);
            
            console.log('[Renée Abilities] Installing global hooks for ability description integrity');
            
            // Store the original constructor
            const originalAbility = window.Ability;
            
            // Create a wrapper constructor
            function PatchedAbility(id, name, icon, manaCost, cooldown, effect) {
                // Call the original constructor
                const ability = new originalAbility(id, name, icon, manaCost, cooldown, effect);
                
                // If this is a Renée ability, ensure it has baseDescription
                if (id && (id.startsWith('renee_') || id.includes('renée'))) {
                    // Set baseDescription based on ability ID if missing
                    if (!ability.baseDescription) {
                        console.log(`[Renée Abilities] Adding missing baseDescription to ${id} via constructor patch`);
                        
                        switch(id) {
                            case 'renee_q':
                                ability.baseDescription = 'Renée attacks with her claws, dealing 700 + 1% of target\'s maximum HP as physical damage. This ability\'s critical chance is doubled.';
                                break;
                            case 'renee_w':
                                ability.baseDescription = 'Renée becomes untargetable and enters stealth for up to 3 turns. While stealthed, her critical chance is 100%. Using any other ability or letting the effect expire breaks stealth. Does not end your turn.';
                                break;
                            case 'renee_e':
                                ability.baseDescription = 'Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.';
                                break;
                            case 'renee_r':
                                ability.baseDescription = 'Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.';
                                break;
                        }
                        
                        // Also set description if it's not set
                        if (!ability.description && ability.baseDescription) {
                            ability.description = ability.baseDescription;
                        }
                    }
                }
                
                return ability;
            }
            
            // Copy prototype and constructor properties
            PatchedAbility.prototype = window.Ability.prototype;
            PatchedAbility.constructor = window.Ability.constructor;
            
            // Replace the global Ability constructor
            window.Ability = PatchedAbility;
            
            // Patch the generateDescription method to handle missing baseDescription
            const originalGenerateDescription = window.Ability.prototype.generateDescription;
            window.Ability.prototype.generateDescription = function() {
                // If the ability belongs to Renée and is missing baseDescription
                if (this.id && (this.id.startsWith('renee_') || this.id.includes('renée')) && !this.baseDescription) {
                    console.warn(`[Renée Abilities] Fixing missing baseDescription in generateDescription for ${this.id}`);
                    
                    // Set baseDescription based on ability ID
                    switch(this.id) {
                        case 'renee_q':
                            this.baseDescription = 'Renée attacks with her claws, dealing 700 + 1% of target\'s maximum HP as physical damage. This ability\'s critical chance is doubled.';
                            break;
                        case 'renee_w':
                            this.baseDescription = 'Renée becomes untargetable and enters stealth for up to 3 turns. While stealthed, her critical chance is 100%. Using any other ability or letting the effect expire breaks stealth. Does not end your turn.';
                            break;
                        case 'renee_e':
                            this.baseDescription = 'Renée strikes with a glowing whip, dealing 490 + 50% Physical damage with a 50% chance to stun for 1 turn. Critical hits deal 1000 + 100% Physical damage instead.';
                            break;
                        case 'renee_r':
                            this.baseDescription = 'Renée places a moon-powered buff on herself for 5 turns. While active, enemies damaged by her are marked with a debuff for 2 turns. When this debuff expires, the enemy is stunned for 1 turn and takes double damage from all sources while the debuff is active.';
                            break;
                    }
                }
                
                // Call original method if it exists, otherwise use a simple implementation
                if (typeof originalGenerateDescription === 'function') {
                    return originalGenerateDescription.call(this);
                } else {
                    // Simple fallback implementation
                    if (!this.baseDescription && this.description) {
                        this.baseDescription = this.description;
                    }
                    return this.description = this.baseDescription || this.description || '';
                }
            };
            
            console.log('[Renée Abilities] Global hooks installed for ability description integrity');
        }
    }, 100); // Check every 100ms
})(); 

// Export the execution functions to the window object for use by talents
if (typeof window !== 'undefined') {
    window.executeWolfClawStrike = executeWolfClawStrike;
    window.executeMysticalWhip = executeMysticalWhip;
}

// Add the Primal Healing VFX function
function showPrimalHealingVFX(character, healAmount) {
    const charElement = document.getElementById(`character-${character.id}`);
    if (!charElement) return;
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'primal-healing-vfx';
    charElement.appendChild(vfxContainer);
    
    // Create blood particles that transform into healing energy
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'primal-blood-particle';
        particle.style.setProperty('--delay', `${i * 0.1}s`);
        particle.style.setProperty('--angle', `${(i / 12) * 360}deg`);
        vfxContainer.appendChild(particle);
    }
    
    // Create wolf spirit outline
    const wolfSpirit = document.createElement('div');
    wolfSpirit.className = 'primal-wolf-spirit';
    vfxContainer.appendChild(wolfSpirit);
    
    // Create healing pulse
    const healingPulse = document.createElement('div');
    healingPulse.className = 'primal-healing-pulse';
    vfxContainer.appendChild(healingPulse);
    
    // Create text display
    const textElement = document.createElement('div');
    textElement.className = 'primal-healing-text';
    textElement.textContent = `+${healAmount}`;
    vfxContainer.appendChild(textElement);
    
    // Remove after animation completes
    setTimeout(() => {
        if (vfxContainer && vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
        }
    }, 2500);
    
    // Play a healing sound with a primal growl overlay if the gameManager exists
    if (window.gameManager && typeof window.gameManager.playSound === 'function') {
        window.gameManager.playSound('sounds/healing.mp3', 0.4);
        setTimeout(() => {
            window.gameManager.playSound('sounds/wolf_growl.mp3', 0.3);
        }, 200);
    }
}