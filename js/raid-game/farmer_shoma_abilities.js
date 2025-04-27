const appleThrowEffect = (caster, target) => {
    // Debug the abilities at the start
    debugAbilities(caster);
    
    // Ensure correct cooldown display by explicitly setting it based on any modifications
    const appleThrowAbility = caster.abilities.find(ability => ability.id === 'farmer_shoma_w');
    if (appleThrowAbility) {
        // Make sure the correct cooldown is applied (important for talents)
        console.log(`Apple Throw cooldown before use: ${appleThrowAbility.cooldown}`);
    }
    
    // VFX container for all apple throw effects
    const vfxContainer = document.createElement('div');
    vfxContainer.className = 'apple-throw-vfx-container';
    document.body.appendChild(vfxContainer);
    
    // Create apple trail effect
    createAppleTrail(vfxContainer);
    
    // Play sound effect
    if (window.gameManager) {
        window.gameManager.playSound('sounds/apple_throw.mp3');
    }
    
    // Damage amount based on caster's stats
    const damageValue = Math.round(caster.stats.physicalDamage * 2);
    
    // Apply damage to the target
    target.applyDamage(damageValue, 'physical', caster);
    
    // Set a debuff on the target
    const debuff = {
        id: 'apple_splash',
        name: 'Apple Splash',
        duration: 4,
        icon: 'images/icons/apple_splash.png',
        description: 'Taking damage each turn from apple juices.',
        onTurnEnd: (character) => {
            if (caster && caster.stats) {
                const dotDamage = Math.round(caster.stats.physicalDamage * 0.3);
                character.applyDamage(dotDamage, 'physical', caster);
                return true; // Effect continues
            }
            return false; // End effect if caster is gone
        }
    };
    
    target.addDebuff(debuff);
    
    // Self-heal for the caster
    const healAmount = 1500;
    
    // Check if we should do a critical heal
    let isCritical = false;
    const critChance = 0.25; // 25% chance
    if (Math.random() < critChance) {
        isCritical = true;
    }
    
    if (isCritical) {
        const multiplier = 2; // Double healing on crit
        const critHealAmount = healAmount * multiplier;
        console.log(`[Crit Heal Debug - ${caster.name}] Critical Heal! Multiplier: ${multiplier}, Base Amount: ${healAmount}`);
        caster.heal(critHealAmount, 'critical');
        
        // Create healing particles with critical effect
        const healingParticles = createHealingParticles(vfxContainer);
        healingParticles.classList.add('critical-heal');
        
    } else {
        // Normal heal
        caster.heal(healAmount);
        
        // Create regular healing particles
        createHealingParticles(vfxContainer);
    }
    
    // Play healing sound
    if (window.gameManager) {
        window.gameManager.playSound('sounds/heal_effect.mp3');
    }
    
    // Add a strong impact at the target's position
    // Get target element
    const targetElement = document.getElementById(`character-${target.instanceId}`);
    if (targetElement) {
        // Create apple splash fragments
        createAppleSplashFragments(vfxContainer);
        
        // Position them at the target
        const targetRect = targetElement.getBoundingClientRect();
        const particles = vfxContainer.querySelectorAll('.apple-splash-fragment');
        particles.forEach(particle => {
            particle.style.left = `${targetRect.left + targetRect.width/2}px`;
            particle.style.top = `${targetRect.top + targetRect.height/2}px`;
        });
        
        // Add screen shake
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
        
        // Play impact sound
        if (window.gameManager) {
            window.gameManager.playSound('sounds/apple_impact.mp3');
        }
    }
    
    // Clean up VFX after animation
    setTimeout(() => {
        vfxContainer.remove();
    }, 2000);
    
    // Debug the abilities again after the effect
    setTimeout(() => {
        console.log("Apple Throw ability after use:");
        const applethrowAbility = caster.abilities.find(ability => ability.id === 'farmer_shoma_w');
        if (applethrowAbility) {
            console.log(`Cooldown: ${applethrowAbility.cooldown}, Current: ${applethrowAbility.currentCooldown}`);
        }
    }, 50);
}; 