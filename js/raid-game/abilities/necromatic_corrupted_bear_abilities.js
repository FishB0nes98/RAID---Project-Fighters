// Necromatic Corrupted Bear Abilities

console.log('Necromatic Corrupted Bear abilities loaded');

// Maul Effect Function
function createMaulEffect(caster, target) {
    console.log('[Maul] Executing ability:', { caster: caster.name, target: target.name });
    
    const damage = 1000;
    const stunChance = 0.5;
    const stunDuration = 2;

    // Apply damage with proper options for statistics tracking
    const damageResult = target.applyDamage(damage, 'physical', caster, { 
        abilityId: 'maul' 
    });

    console.log('[Maul] Damage result:', damageResult);

    // Log damage
    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `${caster.name} mauls ${target.name} for ${damageResult.damage} damage!`,
            'damage'
        );
    }

    // Stun chance
    if (Math.random() < stunChance) {
        const stunDebuff = new Effect(
            'stun',
            'Stun',
            'Cannot act.',
            stunDuration,
            'icons/debuffs/stun.png',
            true
        );
        target.addDebuff(stunDebuff);

        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `${target.name} is stunned for ${stunDuration} turns!`,
                'debuff'
            );
        }
    }

    // Create VFX
    showMaulVFX(caster, target);

    return true;
}

// Maul VFX Function
function showMaulVFX(caster, target) {
    const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);

    if (!casterElement || !targetElement) {
        console.warn('Maul VFX: Character elements not found', { 
            casterId: caster.id, 
            targetId: target.id,
            casterElement: !!casterElement,
            targetElement: !!targetElement
        });
        return;
    }

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'maul-vfx-container';
    vfxContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    `;
    targetElement.appendChild(vfxContainer);

    const clawMarks = document.createElement('div');
    clawMarks.className = 'maul-claw-marks';
    clawMarks.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 40px;
        background: linear-gradient(45deg, #8B0000, #DC143C);
        clip-path: polygon(0 50%, 20% 0, 40% 50%, 60% 0, 80% 50%, 100% 0, 100% 100%, 0 100%);
        opacity: 0;
        animation: maulClawMarks 1s ease-out forwards;
    `;
    vfxContainer.appendChild(clawMarks);

    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
        }
    }, 1000);
}

// Bear Charge Effect Function
function createBearChargeEffect(caster, target) {
    console.log('[Bear Charge] Executing ability:', { caster: caster.name, target: target.name });
    
    const damage = 750;
    const stunChance = 0.25;
    const stunDuration = 1;

    // Apply damage with proper options for statistics tracking
    const damageResult = target.applyDamage(damage, 'physical', caster, { 
        abilityId: 'bear_charge' 
    });

    console.log('[Bear Charge] Damage result:', damageResult);

    // Log damage
    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `${caster.name} charges into ${target.name} for ${damageResult.damage} damage!`,
            'damage'
        );
    }

    // Stun chance
    if (Math.random() < stunChance) {
        const stunDebuff = new Effect(
            'stun',
            'Stun',
            'Cannot act.',
            stunDuration,
            'icons/debuffs/stun.png',
            true
        );
        target.addDebuff(stunDebuff);

        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `${target.name} is stunned for ${stunDuration} turn!`,
                'debuff'
            );
        }
    }

    // Create VFX
    showBearChargeVFX(caster, target);

    return true;
}

// Heart Rip Effect Function
function createHeartRipEffect(caster, target) {
    console.log('[Heart Rip] Executing ability:', { caster: caster.name, target: target.name });
    
    // Calculate damage as 8% of target's max HP
    const maxHpDamage = Math.floor(target.stats.maxHp * 0.08);
    
    // Apply damage with proper options for statistics tracking
    const damageResult = target.applyDamage(maxHpDamage, 'physical', caster, { 
        abilityId: 'heart_rip' 
    });

    console.log('[Heart Rip] Damage result:', damageResult);

    // Log damage
    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `${caster.name} rips ${target.name}'s heart for ${damageResult.damage} damage!`,
            'damage'
        );
    }

    // Apply permanent bleeding debuff
    const bleedingDebuff = new Effect(
        'heart_rip_bleeding',
        'Heart Rip Bleeding',
        'icons/debuffs/bleeding.png',
        999, // Permanent duration (999 turns)
        null, // Effect function will be set separately
        true // isDebuff
    ).setDescription('Suffers 120 damage per turn from heart wound.');
    
    // Add the bleeding effect that deals 120 damage per turn
    bleedingDebuff.effect = (character) => {
        if (window.gameManager) {
            const bleedDamage = 120;
            const bleedResult = character.applyDamage(bleedDamage, 'physical', caster, { 
                abilityId: 'heart_rip_bleeding_dot',
                source: 'heart_rip_bleeding'
            });
            
            window.gameManager.addLogEntry(
                `${character.name} suffers ${bleedResult.damage} bleeding damage from heart wound!`,
                'debuff'
            );
        }
    };
    
    target.addDebuff(bleedingDebuff);

    if (window.gameManager) {
        window.gameManager.addLogEntry(
            `${target.name} is bleeding from heart wound!`,
            'debuff'
        );
    }

    // Create VFX
    showHeartRipVFX(caster, target);

    return true;
}

// Bear Charge VFX Function
function showBearChargeVFX(caster, target) {
    const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);

    if (!casterElement || !targetElement) {
        console.warn('Bear Charge VFX: Character elements not found', { 
            casterId: caster.id, 
            targetId: target.id,
            casterElement: !!casterElement,
            targetElement: !!targetElement
        });
        return;
    }

    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'bear-charge-vfx-container';
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
    
    const startX = casterRect.left + casterRect.width / 2;
    const startY = casterRect.top + casterRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    // Create charge trail
    const chargeTrail = document.createElement('div');
    chargeTrail.className = 'bear-charge-trail';
    chargeTrail.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, #8B4513, #A0522D, #CD853F);
        border-radius: 50%;
        box-shadow: 0 0 10px #8B4513, 0 0 20px #A0522D;
        transform-origin: center;
        animation: bearChargeTrail 0.8s ease-out forwards;
    `;
    vfxContainer.appendChild(chargeTrail);

    // Create impact effect
    setTimeout(() => {
        const impactEffect = document.createElement('div');
        impactEffect.className = 'bear-charge-impact';
        impactEffect.style.cssText = `
            position: absolute;
            left: ${endX - 30}px;
            top: ${endY - 30}px;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, #8B4513, #A0522D, transparent);
            border-radius: 50%;
            opacity: 0;
            animation: bearChargeImpact 0.5s ease-out forwards;
        `;
        vfxContainer.appendChild(impactEffect);

        // Add screen shake
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.addScreenShake();
        }
    }, 800);

    // Cleanup
    setTimeout(() => {
        if (vfxContainer.parentNode) {
            vfxContainer.parentNode.removeChild(vfxContainer);
        }
    }, 2000);
}

// Heart Rip VFX Function
function showHeartRipVFX(caster, target) {
    console.log('[Heart Rip VFX] Starting VFX for:', { caster: caster.name, target: target.name });
    
    const casterElement = document.querySelector(`.character-slot[data-character-id="${caster.id}"]`);
    const targetElement = document.querySelector(`.character-slot[data-character-id="${target.id}"]`);

    console.log('[Heart Rip VFX] Found elements:', { 
        casterElement: !!casterElement, 
        targetElement: !!targetElement,
        casterId: caster.id,
        targetId: target.id
    });

    if (!casterElement || !targetElement) {
        console.warn('Heart Rip VFX: Character elements not found', { 
            casterId: caster.id, 
            targetId: target.id,
            casterElement: !!casterElement,
            targetElement: !!targetElement
        });
        return;
    }

    // Create the bleeding damage VFX container using existing CSS classes
    const bleedingVfx = document.createElement('div');
    bleedingVfx.className = 'bleeding-damage-vfx';
    targetElement.appendChild(bleedingVfx);
    
    console.log('[Heart Rip VFX] Created bleeding VFX container:', bleedingVfx);

    // Create blood drops using existing CSS classes
    for (let i = 0; i < 6; i++) {
        const bloodDrop = document.createElement('div');
        bloodDrop.className = 'blood-drop';
        bloodDrop.style.left = `${Math.random() * 80 + 10}%`;
        bloodDrop.style.animationDelay = `${Math.random() * 0.5}s`;
        bleedingVfx.appendChild(bloodDrop);
    }

    // Create blood splatters using existing CSS classes
    for (let i = 0; i < 5; i++) {
        const bloodSplatter = document.createElement('div');
        bloodSplatter.className = 'blood-splatter';
        bloodSplatter.style.left = `${Math.random() * 80 + 10}%`;
        bloodSplatter.style.top = `${Math.random() * 80 + 10}%`;
        bloodSplatter.style.animationDelay = `${Math.random() * 0.3}s`;
        bleedingVfx.appendChild(bloodSplatter);
    }

    // Create bleeding indicator using existing CSS classes
    const bleedIndicator = document.createElement('div');
    bleedIndicator.className = 'bleed-indicator';
    bleedIndicator.textContent = '+HEART RIP BLEEDING';
    bleedingVfx.appendChild(bleedIndicator);
    
    console.log('[Heart Rip VFX] Added all VFX elements, total children:', bleedingVfx.children.length);

    // Remove VFX after animation completes
    setTimeout(() => {
        if (bleedingVfx.parentNode) {
            bleedingVfx.parentNode.removeChild(bleedingVfx);
            console.log('[Heart Rip VFX] Cleaned up VFX elements');
        }
    }, 2000);
}

// Register the effect functions
if (window.AbilityFactory) {
    window.AbilityFactory.registerAbilityEffect('maul', createMaulEffect);
    window.AbilityFactory.registerAbilityEffect('bear_charge', createBearChargeEffect);
    window.AbilityFactory.registerAbilityEffect('heart_rip', createHeartRipEffect);
}

// Add CSS animations for Bear Charge, Maul, and Heart Rip VFX
if (!document.querySelector('#necromatic-bear-styles')) {
    const style = document.createElement('style');
    style.id = 'necromatic-bear-styles';
    style.textContent = `
        @keyframes bearChargeTrail {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            20% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                transform: scale(0);
                opacity: 0;
            }
        }
        
        @keyframes bearChargeImpact {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 0.8;
                transform: scale(1.2);
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        @keyframes maulClawMarks {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        @keyframes heartExtraction {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            30% {
                opacity: 1;
                transform: scale(1.2);
            }
            70% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                transform: scale(0.8);
                opacity: 0;
            }
        }
        
        @keyframes bloodTrail {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                transform: scale(0);
                opacity: 0;
            }
        }
        
        @keyframes finalHeart {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 1;
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        @keyframes bloodSplatter {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                opacity: 1;
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}