// Talking Necromatic Tree Abilities
// Placeholder abilities - to be implemented later

console.log('Talking Necromatic Tree abilities loaded');

// Placeholder ability implementations
// These will be replaced with actual ability logic later 

// Healing Roots Ability Implementation
function createHealingRootsEffect(abilityData) {
    console.log('[Healing Roots] Creating effect with data:', abilityData);
    
    return async function(caster, target) {
        console.log('[Healing Roots] Executing ability:', { caster: caster.name, target: target.name });
        
        // Get healing amount from the JSON structure
        const healAmount = abilityData.healing || 800;
        console.log('[Healing Roots] Healing amount:', healAmount);
        
        // Apply healing with proper options for statistics tracking
        const healResult = target.heal(healAmount, caster, { 
            abilityId: 'healing_roots',
            source: 'talking_necromatic_tree'
        });
        
        console.log('[Healing Roots] Heal result:', healResult);
        
        // Show VFX
        showHealingRootsVFX(caster, target, healAmount);
        
        // Add battle log entry
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `🌿 ${caster.name} extends healing roots to ${target.name}, restoring ${healResult.healAmount} HP!`,
                'healing'
            );
        }
        
        // Update target UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
        }
        
        return healResult;
    };
}

// Register the ability effect - this should be the actual effect function, not a factory
if (window.AbilityFactory) {
    // Register the actual effect function that takes (caster, target)
    window.AbilityFactory.registerAbilityEffect('healing_roots', async function(caster, target) {
        console.log('[Healing Roots] Executing ability:', { caster: caster.name, target: target.name });
        
        // Get healing amount from the ability data (800 from JSON)
        const healAmount = 800;
        console.log('[Healing Roots] Healing amount:', healAmount);
        
        // Apply healing with proper options for statistics tracking
        const healResult = target.heal(healAmount, caster, { 
            abilityId: 'healing_roots',
            source: 'talking_necromatic_tree'
        });
        
        console.log('[Healing Roots] Heal result:', healResult);
        
        // Show VFX
        showHealingRootsVFX(caster, target, healAmount);
        
        // Add battle log entry
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `🌿 ${caster.name} extends healing roots to ${target.name}, restoring ${healResult.healAmount} HP!`,
                'healing'
            );
        }
        
        // Update target UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(target);
        }
        
        return healResult;
    });
}

// Healing Roots VFX
function showHealingRootsVFX(caster, target, healAmount) {
    console.log('[Healing Roots VFX] Starting VFX for:', { caster: caster.name, target: target.name, healAmount });
    
    const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
    
    if (!casterElement || !targetElement) {
        console.warn('Healing Roots VFX: Character elements not found', { 
            casterId: caster.id, 
            targetId: target.id,
            casterElement: !!casterElement,
            targetElement: !!targetElement
        });
        return;
    }
    
    console.log('[Healing Roots VFX] Found character elements, creating VFX');
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'healing-roots-vfx-container';
    vfxContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    `;
    document.body.appendChild(vfxContainer);
    
    // Get character positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const casterX = casterRect.left + casterRect.width / 2;
    const casterY = casterRect.top + casterRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    console.log('[Healing Roots VFX] Character positions:', { casterX, casterY, targetX, targetY });
    
    // Create root path
    createRootPath(casterX, casterY, targetX, targetY, vfxContainer);
    
    // Create healing effect on target
    createTargetHealingEffect(targetX, targetY, vfxContainer, healAmount);
    
    // Create caster effect
    createCasterRootEffect(casterX, casterY, vfxContainer);
    
    // Cleanup after animation
    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
            console.log('[Healing Roots VFX] VFX container cleaned up');
        }
    }, 3000);
}

function createRootPath(startX, startY, endX, endY, container) {
    const rootPath = document.createElement('div');
    rootPath.className = 'healing-root-path';
    rootPath.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, #2d5016, #4a7c59, #6b8e23);
        border-radius: 50%;
        box-shadow: 0 0 10px #4a7c59, 0 0 20px #2d5016;
        transform-origin: center;
        animation: rootGrow 1.5s ease-out forwards;
    `;
    
    // Calculate distance and angle
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    // Create multiple root segments
    const numSegments = Math.floor(distance / 30);
    for (let i = 0; i < numSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'root-segment';
        const progress = i / numSegments;
        const segmentX = startX + (endX - startX) * progress;
        const segmentY = startY + (endY - startY) * progress;
        
        segment.style.cssText = `
            position: absolute;
            left: ${segmentX}px;
            top: ${segmentY}px;
            width: 3px;
            height: 3px;
            background: linear-gradient(45deg, #2d5016, #4a7c59);
            border-radius: 50%;
            box-shadow: 0 0 8px #4a7c59;
            opacity: 0;
            animation: rootSegmentAppear 1.5s ease-out ${i * 0.1}s forwards;
        `;
        
        container.appendChild(segment);
    }
    
    container.appendChild(rootPath);
}

function createTargetHealingEffect(targetX, targetY, container, healAmount) {
    // Create healing burst
    const healingBurst = document.createElement('div');
    healingBurst.className = 'healing-burst';
    healingBurst.style.cssText = `
        position: absolute;
        left: ${targetX - 25}px;
        top: ${targetY - 25}px;
        width: 50px;
        height: 50px;
        background: radial-gradient(circle, #4a7c59, #2d5016);
        border-radius: 50%;
        opacity: 0;
        animation: healingBurstExpand 1s ease-out 1s forwards;
    `;
    
    // Create healing particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'healing-particle';
        const angle = (i / 12) * 2 * Math.PI;
        const distance = 30 + Math.random() * 20;
        
        particle.style.cssText = `
            position: absolute;
            left: ${targetX}px;
            top: ${targetY}px;
            width: 4px;
            height: 4px;
            background: #4a7c59;
            border-radius: 50%;
            box-shadow: 0 0 6px #4a7c59;
            opacity: 0;
            animation: healingParticleFloat 2s ease-out 1.2s forwards;
        `;
        
        // Set final position
        setTimeout(() => {
            particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        }, 10);
        
        container.appendChild(particle);
    }
    
    // Create healing number
    const healNumber = document.createElement('div');
    healNumber.className = 'heal-number';
    healNumber.textContent = `+${healAmount}`;
    healNumber.style.cssText = `
        position: absolute;
        left: ${targetX}px;
        top: ${targetY - 40}px;
        color: #4a7c59;
        font-size: 18px;
        font-weight: bold;
        text-shadow: 0 0 8px #4a7c59;
        opacity: 0;
        transform: translateX(-50%);
        animation: healNumberFloat 2s ease-out 1s forwards;
    `;
    
    container.appendChild(healingBurst);
    container.appendChild(healNumber);
}

function createCasterRootEffect(casterX, casterY, container) {
    // Create root emergence effect
    const rootEmergence = document.createElement('div');
    rootEmergence.className = 'root-emergence';
    rootEmergence.style.cssText = `
        position: absolute;
        left: ${casterX - 20}px;
        top: ${casterY - 20}px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, #2d5016, transparent);
        border-radius: 50%;
        opacity: 0;
        animation: rootEmergencePulse 1.5s ease-out forwards;
    `;
    
    // Create root particles around caster
    for (let i = 0; i < 8; i++) {
        const rootParticle = document.createElement('div');
        rootParticle.className = 'root-particle';
        const angle = (i / 8) * 2 * Math.PI;
        const distance = 25 + Math.random() * 15;
        
        rootParticle.style.cssText = `
            position: absolute;
            left: ${casterX}px;
            top: ${casterY}px;
            width: 3px;
            height: 3px;
            background: #2d5016;
            border-radius: 50%;
            box-shadow: 0 0 6px #2d5016;
            opacity: 0;
            animation: rootParticleEmerge 1s ease-out ${i * 0.1}s forwards;
        `;
        
        // Set final position
        setTimeout(() => {
            rootParticle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        }, 10);
        
        container.appendChild(rootParticle);
    }
    
    container.appendChild(rootEmergence);
}

// Add CSS animations if not already present
if (!document.querySelector('#healing-roots-styles')) {
    const style = document.createElement('style');
    style.id = 'healing-roots-styles';
    style.textContent = `
        @keyframes rootGrow {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 1;
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        @keyframes rootSegmentAppear {
            0% {
                opacity: 0;
                transform: scale(0);
            }
            50% {
                opacity: 1;
                transform: scale(1.2);
            }
            100% {
                opacity: 0;
                transform: scale(1);
            }
        }
        
        @keyframes healingBurstExpand {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 0.8;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        @keyframes healingParticleFloat {
            0% {
                opacity: 0;
                transform: scale(0);
            }
            20% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 0;
                transform: scale(0.5);
            }
        }
        
        @keyframes healNumberFloat {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(0);
            }
            20% {
                opacity: 1;
            }
            100% {
                opacity: 0;
                transform: translateX(-50%) translateY(-30px);
            }
        }
        
        @keyframes rootEmergencePulse {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.6;
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        @keyframes rootParticleEmerge {
            0% {
                opacity: 0;
                transform: scale(0);
            }
            50% {
                opacity: 1;
                transform: scale(1.2);
            }
            100% {
                opacity: 0;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

// Hollowing Scream Ability Implementation
function createHollowingScreamEffect(abilityData) {
    console.log('[Hollowing Scream] Creating effect with data:', abilityData);
    
    return async function(caster, targets) {
        console.log('[Hollowing Scream] Executing ability:', { caster: caster.name, targets: targets.map(t => t.name) });
        
        // Get all enemies
        const enemies = targets || window.gameManager?.getOpponents(caster) || [];
        console.log('[Hollowing Scream] Enemies to affect:', enemies.map(e => e.name));
        
        let totalBuffsRemoved = 0;
        const affectedEnemies = [];
        
        // Remove one buff from each enemy
        for (const enemy of enemies) {
            if (enemy.buffs && enemy.buffs.length > 0) {
                // Get the first buff to remove
                const buffToRemove = enemy.buffs[0];
                console.log('[Hollowing Scream] Removing buff from', enemy.name, ':', buffToRemove.name);
                
                // Remove the buff
                enemy.removeBuff(buffToRemove.id);
                totalBuffsRemoved++;
                affectedEnemies.push(enemy);
                
                // Show VFX for this enemy
                showHollowingScreamVFX(caster, enemy, buffToRemove.name);
            }
        }
        
        // Add battle log entry
        if (window.gameManager) {
            if (totalBuffsRemoved > 0) {
                window.gameManager.addLogEntry(
                    `👻 ${caster.name}'s hollowing scream removes ${totalBuffsRemoved} buff${totalBuffsRemoved > 1 ? 's' : ''} from ${affectedEnemies.map(e => e.name).join(', ')}!`,
                    'debuff'
                );
            } else {
                window.gameManager.addLogEntry(
                    `👻 ${caster.name} emits a hollowing scream, but no enemies have buffs to remove!`,
                    'ability'
                );
            }
        }
        
        // Update affected enemies' UI
        if (window.gameManager && window.gameManager.uiManager) {
            for (const enemy of affectedEnemies) {
                window.gameManager.uiManager.updateCharacterUI(enemy);
            }
        }
        
        return {
            buffsRemoved: totalBuffsRemoved,
            affectedEnemies: affectedEnemies
        };
    };
}

// Register the ability effect
if (window.AbilityFactory) {
    // Register the actual effect function that takes (caster, targetOrTargets)
    const hollowingScreamEffect = async function(caster, targetOrTargets) {
        console.log('[Hollowing Scream] Executing ability:', { 
            caster: caster.name, 
            targetOrTargets: targetOrTargets,
            isArray: Array.isArray(targetOrTargets),
            type: typeof targetOrTargets
        });
        
        // This ability affects ALL enemies regardless of target parameter
        const enemies = window.gameManager?.getOpponents(caster) || [];
        console.log('[Hollowing Scream] Enemies to affect:', enemies.map(e => e.name));
        
        let totalBuffsRemoved = 0;
        const affectedEnemies = [];
        
        // Remove one buff from each enemy
        for (const enemy of enemies) {
            if (enemy.buffs && enemy.buffs.length > 0) {
                // Get the first buff to remove
                const buffToRemove = enemy.buffs[0];
                console.log('[Hollowing Scream] Removing buff from', enemy.name, ':', buffToRemove.name);
                
                // Remove the buff
                enemy.removeBuff(buffToRemove.id);
                totalBuffsRemoved++;
                affectedEnemies.push(enemy);
                
                // Show VFX for this enemy
                showHollowingScreamVFX(caster, enemy, buffToRemove.name);
            }
        }
        
        // Add battle log entry
        if (window.gameManager) {
            if (totalBuffsRemoved > 0) {
                window.gameManager.addLogEntry(
                    `👻 ${caster.name}'s hollowing scream removes ${totalBuffsRemoved} buff${totalBuffsRemoved > 1 ? 's' : ''} from ${affectedEnemies.map(e => e.name).join(', ')}!`,
                    'debuff'
                );
            } else {
                window.gameManager.addLogEntry(
                    `👻 ${caster.name} emits a hollowing scream, but no enemies have buffs to remove!`,
                    'ability'
                );
            }
        }
        
        // Update affected enemies' UI
        if (window.gameManager && window.gameManager.uiManager) {
            for (const enemy of affectedEnemies) {
                window.gameManager.uiManager.updateCharacterUI(enemy);
            }
        }
        
        return {
            buffsRemoved: totalBuffsRemoved,
            affectedEnemies: affectedEnemies
        };
    };
    
    // Register with the ability ID
    window.AbilityFactory.registerAbilityEffect('hollowing_scream', hollowingScreamEffect);
    
    // Also register with the functionName from JSON (as backup)
    window.AbilityFactory.registerAbilityEffect('hollowing_scream', hollowingScreamEffect);
    
    console.log('[Hollowing Scream] Registered with AbilityFactory');
    console.log('[Hollowing Scream] Registered effects:', Object.keys(window.AbilityFactory.registeredEffects));
} else {
    console.warn('[Hollowing Scream] AbilityFactory not available, will retry...');
    // Retry registration after a delay
    setTimeout(() => {
        if (window.AbilityFactory) {
            const hollowingScreamEffect = async function(caster, targetOrTargets) {
                console.log('[Hollowing Scream] Executing ability (retry):', { 
                    caster: caster.name, 
                    targetOrTargets: targetOrTargets,
                    isArray: Array.isArray(targetOrTargets),
                    type: typeof targetOrTargets
                });
                
                // This ability affects ALL enemies regardless of target parameter
                const enemies = window.gameManager?.getOpponents(caster) || [];
                console.log('[Hollowing Scream] Enemies to affect:', enemies.map(e => e.name));
                
                let totalBuffsRemoved = 0;
                const affectedEnemies = [];
                
                // Remove one buff from each enemy
                for (const enemy of enemies) {
                    if (enemy.buffs && enemy.buffs.length > 0) {
                        // Get the first buff to remove
                        const buffToRemove = enemy.buffs[0];
                        console.log('[Hollowing Scream] Removing buff from', enemy.name, ':', buffToRemove.name);
                        
                        // Remove the buff
                        enemy.removeBuff(buffToRemove.id);
                        totalBuffsRemoved++;
                        affectedEnemies.push(enemy);
                        
                        // Show VFX for this enemy
                        showHollowingScreamVFX(caster, enemy, buffToRemove.name);
                    }
                }
                
                // Add battle log entry
                if (window.gameManager) {
                    if (totalBuffsRemoved > 0) {
                        window.gameManager.addLogEntry(
                            `👻 ${caster.name}'s hollowing scream removes ${totalBuffsRemoved} buff${totalBuffsRemoved > 1 ? 's' : ''} from ${affectedEnemies.map(e => e.name).join(', ')}!`,
                            'debuff'
                        );
                    } else {
                        window.gameManager.addLogEntry(
                            `👻 ${caster.name} emits a hollowing scream, but no enemies have buffs to remove!`,
                            'ability'
                        );
                    }
                }
                
                // Update affected enemies' UI
                if (window.gameManager && window.gameManager.uiManager) {
                    for (const enemy of affectedEnemies) {
                        window.gameManager.uiManager.updateCharacterUI(enemy);
                    }
                }
                
                return {
                    buffsRemoved: totalBuffsRemoved,
                    affectedEnemies: affectedEnemies
                };
            };
            
            window.AbilityFactory.registerAbilityEffect('hollowing_scream', hollowingScreamEffect);
            console.log('[Hollowing Scream] Registered with AbilityFactory (retry)');
        }
    }, 1000);
}

// Also make the function globally available as a fallback
window.hollowingScreamEffect = async function(caster, targetOrTargets) {
    console.log('[Hollowing Scream] Executing ability (global):', { 
        caster: caster.name, 
        targetOrTargets: targetOrTargets,
        isArray: Array.isArray(targetOrTargets),
        type: typeof targetOrTargets
    });
    
    // This ability affects ALL enemies regardless of target parameter
    const enemies = window.gameManager?.getOpponents(caster) || [];
    console.log('[Hollowing Scream] Enemies to affect:', enemies.map(e => e.name));
    
    let totalBuffsRemoved = 0;
    const affectedEnemies = [];
    
    // Remove one buff from each enemy
    for (const enemy of enemies) {
        if (enemy.buffs && enemy.buffs.length > 0) {
            // Get the first buff to remove
            const buffToRemove = enemy.buffs[0];
            console.log('[Hollowing Scream] Removing buff from', enemy.name, ':', buffToRemove.name);
            
            // Remove the buff
            enemy.removeBuff(buffToRemove.id);
            totalBuffsRemoved++;
            affectedEnemies.push(enemy);
            
            // Show VFX for this enemy
            showHollowingScreamVFX(caster, enemy, buffToRemove.name);
        }
    }
    
    // Add battle log entry
    if (window.gameManager) {
        if (totalBuffsRemoved > 0) {
            window.gameManager.addLogEntry(
                `👻 ${caster.name}'s hollowing scream removes ${totalBuffsRemoved} buff${totalBuffsRemoved > 1 ? 's' : ''} from ${affectedEnemies.map(e => e.name).join(', ')}!`,
                'debuff'
            );
        } else {
            window.gameManager.addLogEntry(
                `👻 ${caster.name} emits a hollowing scream, but no enemies have buffs to remove!`,
                'ability'
            );
        }
    }
    
    // Update affected enemies' UI
    if (window.gameManager && window.gameManager.uiManager) {
        for (const enemy of affectedEnemies) {
            window.gameManager.uiManager.updateCharacterUI(enemy);
        }
    }
    
    return {
        buffsRemoved: totalBuffsRemoved,
        affectedEnemies: affectedEnemies
    };
};

// Test function to verify registration
console.log('[Hollowing Scream] Testing registration...');
if (window.AbilityFactory && window.AbilityFactory.registeredEffects) {
    console.log('[Hollowing Scream] Available registered effects:', Object.keys(window.AbilityFactory.registeredEffects));
    if (window.AbilityFactory.registeredEffects['hollowing_scream']) {
        console.log('[Hollowing Scream] ✓ Effect function is registered!');
    } else {
        console.log('[Hollowing Scream] ✗ Effect function is NOT registered!');
    }
} else {
    console.log('[Hollowing Scream] AbilityFactory not available for testing');
}

// Hollowing Scream VFX
function showHollowingScreamVFX(caster, target, buffName) {
    console.log('[Hollowing Scream VFX] Starting VFX for:', { caster: caster.name, target: target.name, buffName });
    
    const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
    
    if (!casterElement || !targetElement) {
        console.warn('Hollowing Scream VFX: Character elements not found', { 
            casterId: caster.id, 
            targetId: target.id,
            casterElement: !!casterElement,
            targetElement: !!targetElement
        });
        return;
    }
    
    console.log('[Hollowing Scream VFX] Found character elements, creating VFX');
    
    // Create VFX container
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'hollowing-scream-vfx-container';
    vfxContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    `;
    document.body.appendChild(vfxContainer);
    
    // Get character positions
    const casterRect = casterElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const casterX = casterRect.left + casterRect.width / 2;
    const casterY = casterRect.top + casterRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    console.log('[Hollowing Scream VFX] Character positions:', { casterX, casterY, targetX, targetY });
    
    // Create scream wave from caster
    createScreamWave(casterX, casterY, targetX, targetY, vfxContainer);
    
    // Create buff removal effect on target
    createBuffRemovalEffect(targetX, targetY, vfxContainer, buffName);
    
    // Create caster scream effect
    createCasterScreamEffect(casterX, casterY, vfxContainer);
    
    // Cleanup after animation
    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
            console.log('[Hollowing Scream VFX] VFX container cleaned up');
        }
    }, 2500);
}

function createScreamWave(startX, startY, endX, endY, container) {
    // Create multiple scream waves
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'scream-wave';
        wave.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${startY}px;
            width: 20px;
            height: 20px;
            border: 3px solid #8b0000;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(139, 0, 0, 0.3), transparent);
            box-shadow: 0 0 15px #8b0000, 0 0 30px #4a0000;
            transform: translate(-50%, -50%);
            opacity: 0.8;
            animation: screamWaveExpand 1.5s ease-out ${i * 0.2}s forwards;
        `;
        
        container.appendChild(wave);
    }
}

function createBuffRemovalEffect(targetX, targetY, container, buffName) {
    // Create buff removal burst
    const removalBurst = document.createElement('div');
    removalBurst.className = 'buff-removal-burst';
    removalBurst.style.cssText = `
        position: absolute;
        left: ${targetX}px;
        top: ${targetY}px;
        width: 60px;
        height: 60px;
        background: radial-gradient(circle, rgba(139, 0, 0, 0.6), rgba(75, 0, 0, 0.3), transparent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: buffRemovalBurst 1s ease-out 0.5s forwards;
    `;
    
    // Create floating buff name text
    const buffText = document.createElement('div');
    buffText.className = 'buff-removal-text';
    buffText.textContent = buffName;
    buffText.style.cssText = `
        position: absolute;
        left: ${targetX}px;
        top: ${targetY - 40}px;
        color: #8b0000;
        font-weight: bold;
        font-size: 12px;
        text-shadow: 0 0 5px #4a0000;
        transform: translate(-50%, -50%);
        animation: buffRemovalText 1.5s ease-out 0.5s forwards;
    `;
    
    container.appendChild(removalBurst);
    container.appendChild(buffText);
}

function createCasterScreamEffect(casterX, casterY, container) {
    // Create scream aura around caster
    const screamAura = document.createElement('div');
    screamAura.className = 'scream-aura';
    screamAura.style.cssText = `
        position: absolute;
        left: ${casterX}px;
        top: ${casterY}px;
        width: 80px;
        height: 80px;
        border: 4px solid #8b0000;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(139, 0, 0, 0.2), transparent);
        box-shadow: 0 0 20px #8b0000, 0 0 40px #4a0000;
        transform: translate(-50%, -50%);
        animation: screamAuraPulse 1.5s ease-out forwards;
    `;
    
    // Create scream particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'scream-particle';
        const angle = (i / 8) * 2 * Math.PI;
        const distance = 40;
        const particleX = casterX + Math.cos(angle) * distance;
        const particleY = casterY + Math.sin(angle) * distance;
        
        particle.style.cssText = `
            position: absolute;
            left: ${particleX}px;
            top: ${particleY}px;
            width: 4px;
            height: 4px;
            background: #8b0000;
            border-radius: 50%;
            box-shadow: 0 0 8px #8b0000;
            transform: translate(-50%, -50%);
            animation: screamParticleExpand 1.5s ease-out ${i * 0.1}s forwards;
        `;
        
        container.appendChild(particle);
    }
    
    container.appendChild(screamAura);
}

// Add CSS animations for Hollowing Scream VFX
const style = document.createElement('style');
style.textContent = `
    @keyframes screamWaveExpand {
        0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
        }
    }
    
    @keyframes buffRemovalBurst {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
        }
    }
    
    @keyframes buffRemovalText {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.2) translateY(-20px);
            opacity: 0;
        }
    }
    
    @keyframes screamAuraPulse {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
    
    @keyframes screamParticleExpand {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 