// Farmer Cham Cham Abilities - Anime Cat Farmer Theme

// Assume Ability, Effect, Character classes and necessary game manager access are available

// Ability Definition: Scratch (Farmer)
const farmerScratchEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target || target.isDead()) {
        log(`${caster.name} tries to Scratch, but the target is invalid.`);
        return;
    }

    log(`${caster.name} uses Scratch (Farmer) on ${target.name}!`);
    // playSound('sounds/meow_scratch.mp3', 0.7); // TODO: Add sound

    // Damage Calculation
    const damageMultiplier = 1.25; // 125% Physical Damage
    const physicalDamage = Math.floor((caster.stats.physicalDamage || 0) * damageMultiplier);

    // Apply Damage
    if (physicalDamage > 0) {
        const physResult = target.applyDamage(physicalDamage, 'physical', caster);
        log(`${target.name} takes ${physResult.damage} physical damage from Scratch.`);

        // Trigger caster's lifesteal if applicable (especially from passive)
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(physResult.damage);
        }
    }

    // Create main VFX container
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    if (targetElement) {
        // Create cat paw scratch VFX
        const scratchVfx = document.createElement('div');
        scratchVfx.className = 'farmer-scratch-vfx';
        targetElement.appendChild(scratchVfx);
        
        // Add impact star (anime style)
        const impactStar = document.createElement('div');
        impactStar.className = 'farmer-scratch-impact';
        scratchVfx.appendChild(impactStar);
        
        // Add flying soil particles (8 particles)
        for (let i = 0; i < 8; i++) {
            const soilParticle = document.createElement('div');
            soilParticle.className = 'soil-particle';
            // Random positions
            const x = Math.random() * 120 - 60; // -60 to 60
            const y = Math.random() * 120 - 60; // -60 to 60
            
            // Set custom property for particle animation
            soilParticle.style.setProperty('--x', `${x}px`);
            soilParticle.style.setProperty('--y', `${y}px`);
            
            // Position randomly in the container
            soilParticle.style.top = `${40 + Math.random() * 20}%`;
            soilParticle.style.left = `${40 + Math.random() * 20}%`;
            
            // Add animation with slight delay based on index
            soilParticle.style.animation = `soil-particle-fly 0.6s ease-out ${i * 0.08}s forwards`;
            
            scratchVfx.appendChild(soilParticle);
        }
        
        // Clean up after animation completes
        setTimeout(() => {
            if (scratchVfx.parentNode) {
                scratchVfx.remove();
            }
        }, 1000);
    }

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
        // Update caster if lifesteal triggered
        if (caster.stats.lifesteal > 0) {
            updateCharacterUI(caster);
        }
    }
};

const farmerScratchAbility = new Ability(
    'farmer_scratch',               // id
    'Scratch (Farmer Version)',     // name
    'Icons/abilities/scratch_farmer.jpeg', // icon
    10,                             // manaCost
    0,                              // cooldown
    farmerScratchEffect             // effect function
).setDescription('Scratches the target with farming tools, dealing 125% Physical Damage.')
 .setTargetType('enemy');

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
    // Special property for dodge calculation in Character.recalculateStats
    dodgeBuff.effects = { dodgeChance: 0.5 };
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
    physDamageBuff.statModifiers = { physicalDamage: bonusPhysDamage };
    caster.addBuff(physDamageBuff.clone()); // Apply a clone
    log(`${caster.name} gains +${bonusPhysDamage} Physical Damage for ${buffDuration} turns.`);

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
).setDescription('Leaps into an agile stance, gaining 50% Dodge Chance and 50% bonus Physical Damage for 4 turns.')
 .setTargetType('self'); // This ability targets the caster

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
    const physicalDamage = Math.floor((caster.stats.physicalDamage || 0) * damageMultiplier);

    // Apply VFX
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    const casterElementId = caster.instanceId || caster.id;
    const casterElement = document.getElementById(`character-${casterElementId}`);
    
    if (targetElement && casterElement) {
        // Create cat-themed boomerang VFX
        const boomerangVfx = document.createElement('div');
        boomerangVfx.className = 'farmer-boomerang-vfx';
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
                    const firstHitResult = target.applyDamage(physicalDamage, 'physical', caster);
                    log(`${target.name} takes ${firstHitResult.damage} physical damage from the first Boomerang hit!`);
                    
                    // Create impact effect
                    const impactEffect = document.createElement('div');
                    impactEffect.className = 'boomerang-impact';
                    targetElement.appendChild(impactEffect);
                    
                    // Create damage number VFX
                    const damageVfx = document.createElement('div');
                    damageVfx.className = 'damage-vfx';
                    damageVfx.textContent = firstHitResult.damage;
                    targetElement.appendChild(damageVfx);
                    
                    // Create sparkles around impact point
                    for (let i = 0; i < 4; i++) {
                        const angle = i * Math.PI / 2;
                        const offsetX = Math.cos(angle) * 40;
                        const offsetY = Math.sin(angle) * 40;
                        createSparkle(targetRect.left + targetRect.width/2 + offsetX, targetRect.top + targetRect.height/2 + offsetY);
                    }
                    
                    setTimeout(() => {
                        if (impactEffect.parentNode) {
                            impactEffect.remove();
                        }
                        if (damageVfx.parentNode) {
                            damageVfx.remove();
                        }
                    }, 1500);
                    
                    // Trigger lifesteal if applicable
                    if (caster.stats.lifesteal > 0) {
                        caster.applyLifesteal(firstHitResult.damage);
                    }
                }
                
                // Animate return throw
                boomerangVfx.classList.remove('throw');
                boomerangVfx.classList.add('return');
                boomerangVfx.style.transform = 'translate(0, 0) rotate(2160deg)';
                
                // Create paw prints along return path
                for (let i = 0; i < pathPoints; i++) {
                    // Calculate position along the return path
                    const ratio = i / (pathPoints - 1);
                    const x = targetX + (casterRect.left + casterRect.width/2 - targetX) * ratio;
                    const y = targetY + (casterRect.top + casterRect.height/2 - targetY) * ratio;
                    
                    // Create paw print with delay
                    createPawPrint(x, y, ratio * 400);
                    
                    // Create sparkle randomly along the return path
                    if (Math.random() > 0.5) {
                        setTimeout(() => {
                            createSparkle(x + (Math.random() * 30 - 15), y + (Math.random() * 30 - 15));
                        }, ratio * 400 + Math.random() * 200);
                    }
                }
                
                // Second hit after short delay
                setTimeout(() => {
                    if (!target.isDead()) {
                        const secondHitResult = target.applyDamage(physicalDamage, 'physical', caster);
                        log(`${target.name} takes ${secondHitResult.damage} physical damage from the second Boomerang hit!`);
                        
                        // Create second impact effect
                        const impactEffect2 = document.createElement('div');
                        impactEffect2.className = 'boomerang-impact';
                        targetElement.appendChild(impactEffect2);
                        
                        // Create second damage number VFX
                        const damageVfx2 = document.createElement('div');
                        damageVfx2.className = 'damage-vfx';
                        damageVfx2.textContent = secondHitResult.damage;
                        targetElement.appendChild(damageVfx2);
                        
                        setTimeout(() => {
                            if (impactEffect2.parentNode) {
                                impactEffect2.remove();
                            }
                            if (damageVfx2.parentNode) {
                                damageVfx2.remove();
                            }
                        }, 1500);
                        
                        // Trigger lifesteal if applicable
                        if (caster.stats.lifesteal > 0) {
                            caster.applyLifesteal(secondHitResult.damage);
                        }
                    }
                    
                    // Clean up VFX
                    setTimeout(() => {
                        if (boomerangVfx.parentNode) {
                            boomerangVfx.remove();
                        }
                    }, 200);
                    
                    // 20% chance not to go on cooldown
                    const noCooldownRoll = Math.random();
                    if (noCooldownRoll <= 0.2) { // 20% chance
                        // Find the ability in caster's abilities array and reset its cooldown counter
                        const boomerangAbility = caster.abilities.find(ability => ability.id === 'farmer_boomerang');
                        if (boomerangAbility) {
                            boomerangAbility.currentCooldown = 0;
                            log(`${caster.name}'s Boomerang returned perfectly! No cooldown.`, 'system');
                            
                            // Add no cooldown visual effect - dancing paw prints
                            const abilityElement = document.querySelector(`.ability[data-ability-id="farmer_boomerang"]`);
                            if (abilityElement) {
                                const noCooldownFlash = document.createElement('div');
                                noCooldownFlash.className = 'boomerang-no-cooldown-flash';
                                abilityElement.appendChild(noCooldownFlash);
                                
                                // Add dancing paw prints
                                for (let i = 0; i < 6; i++) {
                                    const paw = document.createElement('div');
                                    paw.className = 'paw-dance';
                                    
                                    // Random starting positions
                                    paw.style.top = `${Math.random() * 80 + 10}%`; // 10-90%
                                    paw.style.left = `${Math.random() * 80 + 10}%`; // 10-90%
                                    
                                    // Random travel paths
                                    const tx = (Math.random() * 30 - 15); // -15 to 15px
                                    const ty = (Math.random() * 30 - 15); // -15 to 15px
                                    const tx2 = tx + (Math.random() * 20 - 10); // additional -10 to 10px
                                    const ty2 = ty - 20; // always up 20px
                                    
                                    paw.style.setProperty('--tx', `${tx}px`);
                                    paw.style.setProperty('--ty', `${ty}px`);
                                    paw.style.setProperty('--tx2', `${tx2}px`);
                                    paw.style.setProperty('--ty2', `${ty2}px`);
                                    
                                    // Animate with delay
                                    paw.style.animation = `paw-no-cooldown 0.8s ease-out ${i * 0.1}s forwards`;
                                    
                                    noCooldownFlash.appendChild(paw);
                                }
                                
                                // Remove after animation completes
                                setTimeout(() => {
                                    if (noCooldownFlash && noCooldownFlash.parentNode) {
                                        noCooldownFlash.remove();
                                    }
                                }, 1000);
                            }
                        }
                    }
                    
                    // Update UI
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(target);
                        updateCharacterUI(caster);
                    }
                }, 500); // Time for second hit
                
            }, 500); // Time for first hit
        }, 100); // Small delay to start animation
    } else {
        // Fallback if VFX can't be rendered, just apply damage
        if (!target.isDead()) {
            // First hit
            const firstHitResult = target.applyDamage(physicalDamage, 'physical', caster);
            log(`${target.name} takes ${firstHitResult.damage} physical damage from the first Boomerang hit!`);
            
            // Second hit
            const secondHitResult = target.applyDamage(physicalDamage, 'physical', caster);
            log(`${target.name} takes ${secondHitResult.damage} physical damage from the second Boomerang hit!`);
            
            // Trigger lifesteal if applicable
            if (caster.stats.lifesteal > 0) {
                caster.applyLifesteal(firstHitResult.damage + secondHitResult.damage);
            }
            
            // 20% chance not to go on cooldown
            const noCooldownRoll = Math.random();
            if (noCooldownRoll <= 0.2) { // 20% chance
                // Find the ability in caster's abilities array and reset its cooldown counter
                const boomerangAbility = caster.abilities.find(ability => ability.id === 'farmer_boomerang');
                if (boomerangAbility) {
                    boomerangAbility.currentCooldown = 0;
                    log(`${caster.name}'s Boomerang returned perfectly! No cooldown.`, 'system');
                    
                    // Try to add visual effect
                    const abilityElement = document.querySelector(`.ability[data-ability-id="farmer_boomerang"]`);
                    if (abilityElement) {
                        const noCooldownFlash = document.createElement('div');
                        noCooldownFlash.className = 'boomerang-no-cooldown-flash';
                        abilityElement.appendChild(noCooldownFlash);
                        
                        // Add dancing paw prints
                        for (let i = 0; i < 6; i++) {
                            const paw = document.createElement('div');
                            paw.className = 'paw-dance';
                            
                            // Random starting positions
                            paw.style.top = `${Math.random() * 80 + 10}%`; // 10-90%
                            paw.style.left = `${Math.random() * 80 + 10}%`; // 10-90%
                            
                            // Random travel paths
                            const tx = (Math.random() * 30 - 15); // -15 to 15px
                            const ty = (Math.random() * 30 - 15); // -15 to 15px
                            const tx2 = tx + (Math.random() * 20 - 10); // additional -10 to 10px
                            const ty2 = ty - 20; // always up 20px
                            
                            paw.style.setProperty('--tx', `${tx}px`);
                            paw.style.setProperty('--ty', `${ty}px`);
                            paw.style.setProperty('--tx2', `${tx2}px`);
                            paw.style.setProperty('--ty2', `${ty2}px`);
                            
                            // Animate with delay
                            paw.style.animation = `paw-no-cooldown 0.8s ease-out ${i * 0.1}s forwards`;
                            
                            noCooldownFlash.appendChild(paw);
                        }
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            if (noCooldownFlash && noCooldownFlash.parentNode) {
                                noCooldownFlash.remove();
                            }
                        }, 1000);
                    }
                }
            }
            
            // Update UI
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(target);
                updateCharacterUI(caster);
            }
        }
    }
};

const farmerBoomerangAbility = new Ability(
    'farmer_boomerang',             // id
    'Boomerang (Farmer Version)',   // name
    'Icons/abilities/boomerang_farmer.jpeg', // icon (Placeholder)
    50,                             // manaCost
    7,                              // cooldown
    farmerBoomerangEffect           // effect function
).setDescription('Throws a farming boomerang that deals 250% Physical Damage twice. Has a 20% chance not to go on cooldown.')
 .setTargetType('enemy');

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

    if (!targetElement || !casterElement) {
        log(`VFX elements not found, applying damage directly.`);
        // Apply damage directly if no VFX possible
        executeAllStrikes();
        return;
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
        const baseDamage = caster.stats.physicalDamage || 0;
        
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
        const damageResult = target.applyDamage(finalDamage, 'physical', caster);
        
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
        
        // Update UI after each strike
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(target);
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
            const baseDamage = caster.stats.physicalDamage || 0;
            
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
            const damageResult = target.applyDamage(finalDamage, 'physical', caster);
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