// Farmer Shoma's abilities and passive implementation

// Create a subclass of Character for Farmer Shoma to implement his passive
class FarmerShomaCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        
        // Initialize passive tracking
        this.isPassiveCritBoosted = false;
        this.createPassiveIndicator();
    }
    
    // Method to create the passive indicator
    createPassiveIndicator() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initPassiveIndicator());
        } else {
            this.initPassiveIndicator();
        }
    }
    
    // Initialize the passive indicator element
    initPassiveIndicator() {
        const checkForCharElement = setInterval(() => {
            const charElement = document.getElementById(`character-${this.id}`);
            if (charElement) {
                clearInterval(checkForCharElement);
                
                // Create indicator if it doesn't exist
                if (!charElement.querySelector('.shoma-passive-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'shoma-passive-indicator';
                    indicator.innerHTML = `
                        <span>${this.isPassiveCritBoosted ? '70%' : '50%'} Crit</span>
                    `;
                    charElement.appendChild(indicator);
                }
            }
        }, 500);
    }
    
    // Update the passive indicator when boosted
    updatePassiveIndicator() {
        const charElement = document.getElementById(`character-${this.id}`);
        if (charElement) {
            let indicator = charElement.querySelector('.shoma-passive-indicator');
            
            // Create the indicator if it doesn't exist
            if (!indicator) {
                this.initPassiveIndicator();
                return;
            }
            
            // Update indicator value
            const valueSpan = indicator.querySelector('span');
            if (valueSpan) {
                valueSpan.textContent = `${this.isPassiveCritBoosted ? '70%' : '50%'} Crit`;
                
                // Add animation class
                indicator.classList.add('updated');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    indicator.classList.remove('updated');
                }, 1000);
            }
        }
    }
    
    // Check and update crit boost on turn change
    checkPassiveCritBoost(currentTurn) {
        // Get actual turn from the game manager if available 
        const actualTurn = window.gameManager && window.gameManager.gameState ? 
            window.gameManager.gameState.turn : currentTurn;
        
        // Debug log to confirm turn checking is working
        const logFunction = window.gameManager ? 
            window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        
        // Only log once every 5 turns to avoid spam
        if (actualTurn % 5 === 0 || actualTurn === 20) {
            logFunction(`${this.name}'s Farming Experience: Turn ${actualTurn}/20`, 'passive-check');
        }
        
        if (actualTurn >= 20 && !this.isPassiveCritBoosted) {
            // Apply crit chance boost at turn 20
            this.isPassiveCritBoosted = true;
            this.stats.critChance = 0.7; // 70% crit chance
            
            // Update UI
            this.updatePassiveIndicator();
            
            // Log the passive activation with prominent styling
            logFunction(`★★★ ${this.name}'s Farming Experience reaches full potential! Crit chance increased to 70%! ★★★`, 'passive-effect critical');
            
            // Create passive activation VFX
            const charElement = document.getElementById(`character-${this.id}`);
            if (charElement) {
                // Create a more prominent passive activation effect
                const passiveVfx = document.createElement('div');
                passiveVfx.className = 'shoma-passive-boost-vfx';
                passiveVfx.innerHTML = `<span>Crit Boost 70%!</span>`;
                charElement.appendChild(passiveVfx);
                
                // Add a full-character highlight effect
                const highlightEffect = document.createElement('div');
                highlightEffect.className = 'shoma-passive-highlight';
                charElement.appendChild(highlightEffect);
                
                // Remove VFX after animation
                setTimeout(() => {
                    passiveVfx.remove();
                    highlightEffect.remove();
                }, 2000);
            }
        }
    }
}

// Register Farmer Shoma's character class with the character factory
CharacterFactory.registerCharacterClass('farmer_shoma', FarmerShomaCharacter);

// Create the Home Run Smash ability effect function
const homeRunSmashEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container home-run-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself for transform
        casterElement.classList.add('home-run-animation');

        // Create bat swing VFX inside the container
        const batSwingVfx = document.createElement('div');
        batSwingVfx.className = 'bat-swing-vfx';
        vfxContainer.appendChild(batSwingVfx);

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('home-run-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster VFX ---

    // Play sound
    playSound('sounds/bat_swing.mp3', 0.7); // Example sound

    // Set damage source property correctly on target for critical hit calculation
    target.isDamageSource = caster;
    
    // Apply fixed damage - 235 damage as specified
    const result = target.applyDamage(235, 'physical');
    
    // Reset damage source
    target.isDamageSource = null;
    
    let message = `${caster.name} used Home Run Smash on ${target.name} for ${result.damage} physical damage`;
    if (result.isCritical) {
        message += " (Critical Hit!)";
    }
    
    // --- Target Impact VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container home-run-impact-container';
        targetElement.appendChild(vfxContainer);

        // Add impact animation to target element itself
        targetElement.classList.add('home-run-impact');

        // Create impact VFX inside the container
        const impactVfx = document.createElement('div');
        impactVfx.className = 'home-run-impact-vfx';
        vfxContainer.appendChild(impactVfx);

        // Play impact sound
        playSound('sounds/bat_hit.mp3', 0.8); // Example sound

        // Remove container and target animation class
        setTimeout(() => {
            targetElement.classList.remove('home-run-impact');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Target Impact VFX ---

    // Apply stun effect with 35% chance
    if (Math.random() < 0.35) {
        const stunDebuff = new Effect(
            'farmer_shoma_stun_debuff',
            'Stunned',
            'Icons/debuffs/stun.png',
            3, // Duration of 3 turns
            null,
            true // Is a debuff
        );
        
        // Set stun effect properties
        stunDebuff.effects = {
            cantAct: true
        };
        
        stunDebuff.setDescription('Cannot perform any actions.');
        
        // Add a custom remove method to clean up the stun VFX when the debuff expires
        stunDebuff.remove = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                charElement.classList.remove('stunned');
                const stunEffects = charElement.querySelectorAll('.stun-effect-container');
                stunEffects.forEach(el => el.remove());
            }
        };
        
        // Add debuff to target
        target.addDebuff(stunDebuff.clone()); // Clone before adding
        log(`${target.name} is stunned for 3 turns!`);

        // Add stun VFX
        if (targetElement) {
            targetElement.classList.add('stunned'); // Apply grayscale

            // Create container for stun VFX
            const stunVfxContainer = document.createElement('div');
            stunVfxContainer.className = 'vfx-container stun-effect-container';
            targetElement.appendChild(stunVfxContainer);

            // Create stun stars effect inside container
            const stunEffect = document.createElement('div');
            stunEffect.className = 'stun-effect'; // From farmer_alice_abilities.css
            stunVfxContainer.appendChild(stunEffect);

            // Note: The removal is handled by stunDebuff.remove
        }
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Create the Home Run Smash ability object
const homeRunSmashAbility = new Ability(
    'farmer_shoma_q',
    'Home Run Smash',
    'Icons/abilities/homerun_smash.jpeg',
    35, // Mana cost
    2,  // Cooldown in turns
    homeRunSmashEffect
).setDescription('Deals 235 damage and has 35% chance to stun the target for 3 turns.')
 .setTargetType('enemy');

// Create the Apple Throw ability effect function
const appleThrowEffect = (caster, target) => {
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container apple-throw-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('apple-throw-animation');

        // Create apple throw projectile VFX inside the container
        const appleVfx = document.createElement('div');
        appleVfx.className = 'apple-throw-vfx';
        vfxContainer.appendChild(appleVfx);

        // Create apple throw trail effects inside the container
        createAppleTrail(vfxContainer); // Pass container as parent

        // Play throwing sound
        playSound('sounds/apple_throw.mp3', 0.6); // Example sound

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('apple-throw-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Check if target is an ally or enemy
    const isAlly = caster.isAI === target.isAI;
    
    if (isAlly) {
        // HEAL ALLY
        // Calculate heal amount
        const healAmount = 750;
        
        // Check for critical heal
        let finalHealAmount = healAmount;
        let isCritical = false;
        
        if (Math.random() < caster.stats.critChance) {
            finalHealAmount = Math.floor(healAmount * caster.stats.critDamage);
            isCritical = true;
        }
        
        // Apply healing
        const actualHeal = target.heal(finalHealAmount);
        
        // Log the healing
        let message = `${caster.name} used Apple Throw to heal ${target.name} for ${Math.round(actualHeal)} health`;
        if (isCritical) {
            message += " (Critical Heal!)";
        }
        logFunction(message);
        
        // --- Ally Heal VFX ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'vfx-container apple-heal-vfx-container';
            targetElement.appendChild(vfxContainer);

            // Add heal animation class to target element
            targetElement.classList.add('apple-heal-effect');

            // Create heal VFX elements inside the container
            const healVfx = document.createElement('div');
            healVfx.className = 'apple-heal-vfx';
            vfxContainer.appendChild(healVfx);

            const healSplash = document.createElement('div');
            healSplash.className = 'healing-apple-splash';
            vfxContainer.appendChild(healSplash);

            // Create healing particles inside the container
            createHealingParticles(vfxContainer); // Pass container as parent

            // Play heal sound
            playSound('sounds/heal_effect.mp3', 0.7); // Example sound

            // Remove container and target animation class
            setTimeout(() => {
                targetElement.classList.remove('apple-heal-effect');
                vfxContainer.remove();
            }, 1200); // Match animation duration
        }
        // --- End Ally Heal VFX ---
    } else {
        // DAMAGE ENEMY
        // Set damage source for crit calculation
        target.isDamageSource = caster;
        
        // Apply damage
        const result = target.applyDamage(400, 'physical');
        
        // Reset damage source
        target.isDamageSource = null;
        
        // Log the damage
        let message = `${caster.name} used Apple Throw on ${target.name} for ${result.damage} physical damage`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        logFunction(message);
        
        // --- Enemy Impact VFX ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (targetElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'vfx-container apple-impact-vfx-container';
            targetElement.appendChild(vfxContainer);

            // Add impact animation class to target element
            targetElement.classList.add('apple-impact');

            // Create impact VFX elements inside the container
            const impactVfx = document.createElement('div');
            impactVfx.className = 'apple-impact-vfx';
            vfxContainer.appendChild(impactVfx);

            createAppleSplashFragments(vfxContainer); // Pass container as parent

            const damagePulse = document.createElement('div');
            damagePulse.className = 'apple-damage-pulse';
            vfxContainer.appendChild(damagePulse);

            // Play impact sound
            playSound('sounds/apple_impact.mp3', 0.8); // Example sound

            // Remove container and target animation class
            setTimeout(() => {
                targetElement.classList.remove('apple-impact');
                vfxContainer.remove();
            }, 900); // Match animation duration
        }
        // --- End Enemy Impact VFX ---

        // Apply damage reduction debuff
        const damageDebuff = new Effect(
            'apple_splash_debuff',
            'Apple Splash',
            'Icons/debuffs/apple_splash.jpeg',
            4, // Duration of 4 turns
            null,
            true // Is a debuff
        );
        
        // Set damage reduction effect properties
        damageDebuff.effects = {
            outgoingDamageModifier: 0.8 // Target deals 80% damage (20% reduction)
        };
        
        damageDebuff.setDescription('Deals 20% less damage for 4 turns.');

        // --- Refactored Debuff Apply/Remove for Indicator ---
        damageDebuff.onApply = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                // Create container for the indicator
                const indicatorContainer = document.createElement('div');
                indicatorContainer.className = 'status-indicator-container apple-splash-indicator-container'; // Add specific class
                indicatorContainer.dataset.debuffId = 'apple_splash_debuff'; // Link to debuff
                charElement.appendChild(indicatorContainer);

                const debuffIndicator = document.createElement('div');
                debuffIndicator.className = 'apple-splash-indicator'; // CSS for styling and animation
                debuffIndicator.innerHTML = '🍎';
                indicatorContainer.appendChild(debuffIndicator);

                // Add initial splash effect (optional, reuse impact vfx?)
                // const initialSplash = document.createElement('div');
                // initialSplash.className = 'apple-impact-vfx';
                // initialSplash.style.opacity = '0.5';
                // indicatorContainer.appendChild(initialSplash);
                // setTimeout(() => initialSplash.remove(), 800);
            }
        };

        damageDebuff.remove = function(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (charElement) {
                const indicators = charElement.querySelectorAll('.apple-splash-indicator-container[data-debuff-id="apple_splash_debuff"]');
                indicators.forEach(container => {
                    const indicator = container.querySelector('.apple-splash-indicator');
                    if (indicator) {
                        indicator.style.animation = 'none'; // Stop animation
                        void indicator.offsetWidth; // Trigger reflow
                        indicator.style.animation = 'fadeOut 0.5s forwards'; // Apply fade out
                    }
                    // Remove the container after fade out
                    setTimeout(() => container.remove(), 500);
                });
            }
        };
        // --- End Refactored Debuff Apply/Remove ---

        // Add debuff to target
        target.addDebuff(damageDebuff.clone()); // Clone before adding
        logFunction(`${target.name} is affected by Apple Splash and deals 20% less damage for 4 turns!`);
    }

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Helper function to create trail effect for apple throw
function createAppleTrail(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for trail elements *inside* the provided vfxContainer
    const trailContainer = document.createElement('div');
    trailContainer.className = 'apple-throw-trail';
    vfxContainer.appendChild(trailContainer);
    
    // Create 8 trail dots
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            if (!vfxContainer.contains(trailContainer)) return;
            
            const trailDot = document.createElement('div');
            trailDot.style.position = 'absolute';
            trailDot.style.width = '15px';
            trailDot.style.height = '15px';
            trailDot.style.borderRadius = '50%';
            trailDot.style.background = `radial-gradient(circle, rgba(255, ${20 + i * 10}, ${i * 10}, 0.7) 0%, rgba(255, 0, 0, 0.1) 70%)`;
            trailDot.style.left = `${25 + i * 20}%`;
            trailDot.style.top = `${40 - i * 5}%`;
            trailDot.style.zIndex = '4';
            trailDot.style.filter = 'blur(2px)';
            trailDot.style.animation = 'trailFade 0.6s forwards';
            
            trailContainer.appendChild(trailDot);
            
            // Auto-remove trail dot after animation
            setTimeout(() => {
                if (trailDot && trailDot.parentNode) { // Check if dot exists
                    trailDot.remove();
                }
            }, 600);
        }, i * 60);
    }
    
    // No need to remove trailContainer separately, it gets removed with vfxContainer
    // setTimeout(() => {
    //     if (trailContainer.parentNode) {
    //         trailContainer.remove();
    //     }
    // }, 1000);
}

// Helper function to create healing particles
function createHealingParticles(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'apple-heal-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create 15 particles with different positions, sizes and delays
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'apple-heal-particle';
        
        // Randomize particle properties
        const size = 5 + Math.random() * 8;
        const left = 10 + Math.random() * 80;
        const bottom = 5 + Math.random() * 80;
        const delay = Math.random() * 0.5;
        const duration = 0.7 + Math.random() * 0.8;
        
        // Set particle styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.bottom = `${bottom}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }
    
    // No need to remove particlesContainer separately
    // setTimeout(() => {
    //     if (particlesContainer.parentNode) {
    //         particlesContainer.remove();
    //     }
    // }, 1500);
}

// Helper function to create apple splash fragments
function createAppleSplashFragments(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for fragments *inside* the provided vfxContainer
    const fragmentsContainer = document.createElement('div');
    fragmentsContainer.className = 'apple-splash-fragments';
    vfxContainer.appendChild(fragmentsContainer);
    
    // Create fragments with different trajectories and sizes
    for (let i = 0; i < 12; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'apple-fragment';
        
        // Randomize fragment properties
        const size = 4 + Math.random() * 8;
        const angle = (i / 12) * 360;
        const distance = 30 + Math.random() * 40;
        const duration = 0.5 + Math.random() * 0.5;
        
        // Set initial position at center
        fragment.style.left = '50%';
        fragment.style.top = '50%';
        fragment.style.width = `${size}px`;
        fragment.style.height = `${size}px`;
        fragment.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
        
        // Create keyframe animation for this fragment
        const keyframes = `
        @keyframes fragment${i} {
            0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
            100% { transform: translate(
                calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px), 
                calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)
            ) rotate(${Math.random() * 720 - 360}deg); opacity: 0; }
        }`;
        
        // Add keyframes to document
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
        
        // Apply animation
        fragment.style.animation = `fragment${i} ${duration}s forwards ease-out`;
        
        fragmentsContainer.appendChild(fragment);
    }
    
    // No need to remove fragmentsContainer separately
    // setTimeout(() => {
    //     if (fragmentsContainer.parentNode) {
    //         fragmentsContainer.remove();
    //     }
    // }, 1000);
}

// Create Apple Throw ability object
const appleThrowAbility = new Ability(
    'farmer_shoma_w',
    'Apple Throw',
    'Icons/abilities/apple_throw.jpeg',
    45, // Mana cost
    3,  // Cooldown in turns
    appleThrowEffect
).setDescription('If targets ally: Heals 750 health. If targets enemy: Deals 400 damage and reduces their damage by 20% for 4 turns. Both effects can crit.')
 .setTargetType('any');

// Create the Farmer's Catch ability effect function
const farmersCatchEffect = (caster, target) => {
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container farmers-catch-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('farmers-catch-animation');

        // Create VFX elements inside the container
        const catchVfx = document.createElement('div');
        catchVfx.className = 'farmers-catch-vfx';
        vfxContainer.appendChild(catchVfx);

        // Play catch sound
        playSound('sounds/catch.mp3', 0.6); // Example sound

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('farmers-catch-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Create dodge buff effect
    const dodgeBuff = new Effect(
        'farmers_catch_buff',
        'Farmer\'s Catch',
        'Icons/buffs/farmers_catch.jpeg',
        5, // Duration of 5 turns
        null,
        false // Is a buff, not a debuff
    );
    
    // Set dodge boost using statModifiers - this is the correct way
    // The stat has to match exactly the property name in the character's stats object
    dodgeBuff.statModifiers = {
        dodgeChance: 0.5 // +50% dodge chance
    };
    
    dodgeBuff.setDescription('Increases dodge chance by 50% for 5 turns.');

    // --- Refactored Buff Apply/Remove for Indicator ---
    dodgeBuff.onApply = function(character) {
        const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (targetElement) {
            // Create container for the indicator
            const indicatorContainer = document.createElement('div');
            indicatorContainer.className = 'status-indicator-container dodge-buff-indicator-container';
            indicatorContainer.dataset.buffId = 'farmers_catch_buff'; // Link to buff
            targetElement.appendChild(indicatorContainer);

            const buffIndicator = document.createElement('div');
            buffIndicator.className = 'dodge-buff-indicator'; // CSS for styling and animation
            buffIndicator.innerHTML = '💨';
            indicatorContainer.appendChild(buffIndicator);

            // Create initial buff application VFX (glow and particles)
            const buffVfxContainer = document.createElement('div');
            buffVfxContainer.className = 'vfx-container dodge-buff-apply-vfx';
            targetElement.appendChild(buffVfxContainer);

            const buffGlowVfx = document.createElement('div');
            buffGlowVfx.className = 'dodge-buff-vfx'; // The glow effect
            buffVfxContainer.appendChild(buffGlowVfx);

            createWindEffectParticles(buffVfxContainer); // Add particles to this container

            // Remove apply effect container after animation
            setTimeout(() => buffVfxContainer.remove(), 1200);
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s dodge chance increased by 50%!`, 'buff-effect');
    };

    dodgeBuff.remove = function(character) {
        const targetElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (targetElement) {
            const indicators = targetElement.querySelectorAll('.dodge-buff-indicator-container[data-buff-id="farmers_catch_buff"]');
            indicators.forEach(container => {
                const indicator = container.querySelector('.dodge-buff-indicator');
                if (indicator) {
                    indicator.style.animation = 'fadeOut 0.5s forwards';
                }
                setTimeout(() => container.remove(), 500);
            });
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s dodge chance boost has expired.`, 'effect-expired');
    };
    // --- End Refactored Buff Apply/Remove ---

    // Add buff to target
    target.addBuff(dodgeBuff.clone()); // Clone before adding

    // Log the buff application
    logFunction(`${caster.name} used Farmer's Catch on ${target.name}, increasing their dodge chance by 50% for 5 turns!`);

    // --- Target Buff VFX (Now handled in onApply) ---
    // const targetElement = document.getElementById(`character-${target.id}`);
    // if (targetElement) {
    //     targetElement.classList.add('dodge-buff-effect');
    //     const dodgeBoostVfx = document.createElement('div');
    //     dodgeBoostVfx.className = 'dodge-boost-vfx'; // Likely redundant now
    //     targetElement.appendChild(dodgeBoostVfx);
    //     createWindEffectParticles(targetElement);
    //     setTimeout(() => {
    //         targetElement.classList.remove('dodge-buff-effect');
    //         // dodgeBoostVfx might not exist or be needed
    //         const boostVfx = targetElement.querySelector('.dodge-boost-vfx');
    //         if (boostVfx) boostVfx.remove();
    //     }, 1200);
    // }
    // --- End Target Buff VFX ---

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

// Helper function to create wind effect particles for dodge buff
function createWindEffectParticles(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'wind-effect-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create wind streaks with different positions and animations
    for (let i = 0; i < 8; i++) {
        const streak = document.createElement('div');
        streak.className = 'wind-streak';
        
        // Randomize properties
        const width = 50 + Math.random() * 30;
        const opacity = 0.6 + Math.random() * 0.3;
        const top = 10 + Math.random() * 80;
        const delay = Math.random() * 0.3;
        const duration = 0.6 + Math.random() * 0.4;
        
        // Set streak styles
        streak.style.width = `${width}px`;
        streak.style.height = `3px`;
        streak.style.opacity = opacity;
        streak.style.top = `${top}%`;
        streak.style.animationDelay = `${delay}s`;
        streak.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(streak);
    }
    
    // No need to remove particlesContainer separately
    // setTimeout(() => {
    //     if (particlesContainer.parentNode) {
    //         particlesContainer.remove();
    //     }
    // }, 1500);
}

// Create Farmer's Catch ability object
const farmersCatchAbility = new Ability(
    'farmer_shoma_e',
    'Farmer\'s Catch',
    'Icons/abilities/farmers_catch.jpeg',
    95, // Mana cost
    10, // Cooldown in turns
    farmersCatchEffect
).setDescription('Increase target\'s dodge chance by 50% for 5 turns.')
 .setTargetType('ally');

// Create the Cottage Run ability effect function
const cottageRunEffect = (caster, target) => {
    const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // --- Caster Animation VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'vfx-container cottage-run-caster-vfx';
        casterElement.appendChild(vfxContainer);

        // Add animation class to caster element itself
        casterElement.classList.add('cottage-run-animation');

        // Create VFX elements inside the container
        const runVfx = document.createElement('div');
        runVfx.className = 'cottage-run-vfx';
        vfxContainer.appendChild(runVfx);

        createDashEffectParticles(vfxContainer); // Pass container as parent

        // Play dash sound
        playSound('sounds/dash.mp3', 0.6); // Example sound

        // Remove container and caster animation class
        setTimeout(() => {
            casterElement.classList.remove('cottage-run-animation');
            vfxContainer.remove();
        }, 800); // Match animation duration
    }
    // --- End Caster Animation VFX ---

    // Calculate healing - 50% of missing health
    const missingHealth = target.stats.maxHp - target.stats.currentHp;
    const healAmount = Math.round(missingHealth * 0.5);
    
    // Apply healing
    const actualHeal = target.heal(healAmount);
    
    // Log the healing
    logFunction(`${caster.name} used Cottage Run to heal ${Math.round(actualHeal)} health (50% of missing health).`);
    
    // --- Caster Heal VFX (target is caster) ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`); // target is caster
    if (targetElement) {
        const healVfxContainer = document.createElement('div');
        healVfxContainer.className = 'vfx-container cottage-run-heal-vfx-container';
        targetElement.appendChild(healVfxContainer);

        // Add heal animation class to target element
        targetElement.classList.add('cottage-run-heal-effect');

        // Create heal VFX elements inside the container
        const healVfx = document.createElement('div');
        healVfx.className = 'cottage-run-heal-vfx';
        healVfxContainer.appendChild(healVfx);

        createHealingParticles(healVfxContainer); // Pass container as parent

        // Play heal sound
        playSound('sounds/cottage_heal.mp3', 0.7); // Example sound

        // Remove container and target animation class
        setTimeout(() => {
            targetElement.classList.remove('cottage-run-heal-effect');
            healVfxContainer.remove();
        }, 1200); // Match animation duration
    }
    // --- End Caster Heal VFX ---

    // Create perfect dodge buff effect
    const perfectDodgeBuff = new Effect(
        'cottage_run_buff',
        'Perfect Dodge',
        'Icons/buffs/cottage_run.webp',
        4, // Duration of 4 turns
        null,
        false // Is a buff, not a debuff
    );
    
    // Set dodge boost using statModifiers to 100%
    perfectDodgeBuff.statModifiers = {
        dodgeChance: 1.0 // Set to 100% dodge chance total
    };
    
    perfectDodgeBuff.setDescription('Grants 100% dodge chance for 4 turns.');

    // --- Refactored Buff Apply/Remove for Indicator ---
    perfectDodgeBuff.onApply = function(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
             // Create container for the indicator
             const indicatorContainer = document.createElement('div');
             indicatorContainer.className = 'status-indicator-container perfect-dodge-indicator-container';
             indicatorContainer.dataset.buffId = 'cottage_run_buff'; // Link to buff
             charElement.appendChild(indicatorContainer);

            const buffIndicator = document.createElement('div');
            buffIndicator.className = 'perfect-dodge-indicator'; // CSS for styling and animation
            buffIndicator.innerHTML = '🏠';
            indicatorContainer.appendChild(buffIndicator);

            // Create initial buff application VFX
            const buffVfxContainer = document.createElement('div');
            buffVfxContainer.className = 'vfx-container perfect-dodge-apply-vfx';
            charElement.appendChild(buffVfxContainer);

            const buffGlowVfx = document.createElement('div');
            buffGlowVfx.className = 'perfect-dodge-vfx';
            buffVfxContainer.appendChild(buffGlowVfx);

            createWindEffectParticles(buffVfxContainer); // Add particles

            // Remove apply effect container after animation
            setTimeout(() => buffVfxContainer.remove(), 1200);
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name} gains Perfect Dodge! (100% dodge chance for 4 turns)`, 'buff-effect');
    };

    perfectDodgeBuff.remove = function(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const indicators = charElement.querySelectorAll('.perfect-dodge-indicator-container[data-buff-id="cottage_run_buff"]');
            indicators.forEach(container => {
                const indicator = container.querySelector('.perfect-dodge-indicator');
                if (indicator) {
                    indicator.style.animation = 'fadeOut 0.5s forwards';
                }
                setTimeout(() => container.remove(), 500);
            });
        }
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        logFunction(`${character.name}'s Perfect Dodge has expired.`, 'effect-expired');
    };
    // --- End Refactored Buff Apply/Remove ---

    // Add buff to target (caster)
    target.addBuff(perfectDodgeBuff.clone()); // Clone before adding

    // Log the buff application
    logFunction(`${caster.name} used Cottage Run, granting themselves Perfect Dodge for 4 turns!`);

    // Update UI
    updateCharacterUI(caster);
};

// Helper function to create dash effect particles
function createDashEffectParticles(vfxContainer) { // Accept VFX container
    if (!vfxContainer) return;

    // Create container for particles *inside* the provided vfxContainer
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'dash-effect-particles';
    vfxContainer.appendChild(particlesContainer);
    
    // Create dust particles with different positions and animations
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'dash-particle';
        
        // Randomize properties
        const size = 5 + Math.random() * 8;
        const opacity = 0.5 + Math.random() * 0.4;
        const xPos = 20 + Math.random() * 60;
        const yPos = 40 + Math.random() * 40;
        const delay = Math.random() * 0.3;
        const duration = 0.5 + Math.random() * 0.5;
        
        // Set particle styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = opacity;
        particle.style.left = `${xPos}%`;
        particle.style.top = `${yPos}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }
    
    // No need to remove particlesContainer separately
    // setTimeout(() => {
    //     if (particlesContainer.parentNode) {
    //         particlesContainer.remove();
    //     }
    // }, 1500);
}

// Create Cottage Run ability object
const cottageRunAbility = new Ability(
    'farmer_shoma_r',
    'Cottage Run',
    'Icons/abilities/cottage_run.webp',
    150, // Mana cost
    22,  // Cooldown in turns
    cottageRunEffect
).setDescription('Heals 50% of missing health to himself and gains 100% dodge chance for 4 turns.')
 .setTargetType('self'); // Self-targeting ability

// Register abilities with AbilityFactory
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            homeRunSmashAbility,
            appleThrowAbility,
            farmersCatchAbility,
            cottageRunAbility
        ]);
    } else {
        console.warn("Farmer Shoma abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback: assign to a global object
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.farmer_shoma_q = homeRunSmashAbility;
        window.definedAbilities.farmer_shoma_w = appleThrowAbility;
        window.definedAbilities.farmer_shoma_e = farmersCatchAbility;
        window.definedAbilities.farmer_shoma_r = cottageRunAbility;
    }
    
    // Set up turn listener for passive turn-based effects
    setupTurnBasedPassives();
});

// Setup function for all turn-based passive effects
function setupTurnBasedPassives() {
    // Wait for game manager to be available
    const checkGameManager = setInterval(() => {
        if (window.gameManager) {
            clearInterval(checkGameManager);
            
            // Log that the turn-based passive system has been initialized
            console.log("Turn-based passive system initialized");
            
            // Check if the endAITurn method exists - this is where turns increment
            if (window.gameManager.endAITurn) {
                // Store the original endAITurn method
                const originalEndAITurn = window.gameManager.endAITurn;
                
                // Override endAITurn to run our passive checks after turn increment
                window.gameManager.endAITurn = function() {
                    // Call the original method first to increment turn counter
                    originalEndAITurn.apply(this, arguments);
                    
                    // After the turn counter has been incremented, check for turn-based passives
                    const currentTurn = this.gameState.turn;
                    
                    // Get all characters in play
                    const allCharacters = [
                        ...this.gameState.playerCharacters,
                        ...this.gameState.aiCharacters
                    ];
                    
                    // Process turn-based passives for all characters
                    allCharacters.forEach(character => {
                        // Handle Farmer Shoma's passive
                        if (character.id === 'farmer_shoma' && 
                            character.checkPassiveCritBoost && 
                            typeof character.checkPassiveCritBoost === 'function') {
                            character.checkPassiveCritBoost(currentTurn);
                        }
                        
                        // Future turn-based passives can be added here with similar structure
                    });
                    
                    // Log the turn number for debugging
                    console.log(`[Turn Passives] Processed passives for turn ${currentTurn}`);
                };
            } else {
                console.warn("Could not find endAITurn method to hook turn-based passives");
            }
            
            // Also hook into character addition for mid-game character spawns
            if (window.gameManager.addCharacter && typeof window.gameManager.addCharacter === 'function') {
                const originalAddCharacter = window.gameManager.addCharacter;
                window.gameManager.addCharacter = function(character, isAI) {
                    // Call original method to add character
                    originalAddCharacter.apply(this, arguments);
                    
                    // Check if the added character has turn-based passives
                    if (character.id === 'farmer_shoma' && 
                        character.checkPassiveCritBoost && 
                        typeof character.checkPassiveCritBoost === 'function') {
                        // Initialize with current turn count
                        character.checkPassiveCritBoost(this.gameState.turn);
                    }
                    
                    // Future character passive initializations can be added here
                };
            }
            
            // Initialize passives for existing characters
            if (window.gameManager.gameState) {
                const existingCharacters = [
                    ...window.gameManager.gameState.playerCharacters,
                    ...window.gameManager.gameState.aiCharacters
                ];
                
                const currentTurn = window.gameManager.gameState.turn || 1;
                
                // Initialize passives for existing characters
                existingCharacters.forEach(character => {
                    if (character.id === 'farmer_shoma' && 
                        character.checkPassiveCritBoost && 
                        typeof character.checkPassiveCritBoost === 'function') {
                        character.checkPassiveCritBoost(currentTurn);
                    }
                    
                    // Future character passive initializations can be added here
                });
            }
        }
    }, 500);
}

// Add CSS for VFX
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Farmer Shoma Passive Indicator */
        .shoma-passive-indicator {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8e4506, #d78b0d);
            border-radius: 8px;
            width: auto;
            height: 30px;
            padding: 0 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #ffd700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.3);
            transition: transform 0.3s, box-shadow 0.3s;
            z-index: 5;
        }
        
        .shoma-passive-indicator::before {
            content: "⚔️";
            margin-right: 5px;
            font-size: 14px;
        }
        
        .shoma-passive-indicator.updated {
            transform: translateX(-50%) scale(1.2);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 12px rgba(255, 215, 0, 0.5);
            animation: pulsate 1s ease-in-out;
        }
        
        @keyframes pulsate {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.3); }
            100% { transform: translateX(-50%) scale(1.2); }
        }
        
        /* Home Run Animations */
        .home-run-animation {
            animation: shomaSwing 0.5s forwards;
        }
        
        @keyframes shomaSwing {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            75% { transform: rotate(30deg); }
            100% { transform: rotate(0deg); }
        }
        
        .bat-swing-vfx {
            position: absolute;
            width: 100%;
            height: 50px;
            background: linear-gradient(transparent, rgba(255, 255, 255, 0.5), transparent);
            transform: rotate(-30deg);
            animation: batSwing 0.5s forwards;
            z-index: 2;
        }
        
        @keyframes batSwing {
            0% { opacity: 0; transform: rotate(-30deg) translateY(0); }
            50% { opacity: 1; transform: rotate(0deg) translateY(-10px); }
            100% { opacity: 0; transform: rotate(30deg) translateY(0); }
        }
        
        .home-run-impact {
            animation: homeRunImpact 0.5s forwards;
        }
        
        @keyframes homeRunImpact {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px) translateY(-5px); }
            50% { transform: translateX(8px) translateY(5px); }
            75% { transform: translateX(-5px) translateY(-3px); }
            100% { transform: translateX(0); }
        }
        
        .home-run-impact-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 200, 0, 0.5) 0%, transparent 70%);
            animation: impactFade 0.6s forwards;
            z-index: 2;
        }
        
        @keyframes impactFade {
            0% { opacity: 0; transform: scale(0.5); }
            40% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* Apple Throw Animations */
        .apple-throw-animation {
            animation: appleThrow 0.6s forwards;
        }
        
        @keyframes appleThrow {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg) translateY(-5px); }
            50% { transform: rotate(5deg) translateY(0); }
            75% { transform: rotate(-5deg) translateY(-3px); }
            100% { transform: rotate(0deg); }
        }
        
        .apple-throw-vfx {
            position: absolute;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0.3) 70%);
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            animation: appleThrowPath 0.6s forwards;
            z-index: 3;
        }
        
        @keyframes appleThrowPath {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-20%, -80%) scale(1); opacity: 1; }
            80% { transform: translate(150%, -20%) scale(1); opacity: 1; }
            100% { transform: translate(200%, 50%) scale(0.8); opacity: 0; }
        }
        
        /* Apple Heal Effect */
        .apple-heal-effect {
            animation: appleHeal 0.8s forwards;
        }
        
        @keyframes appleHeal {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
            100% { filter: brightness(1); }
        }
        
        .apple-heal-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(0, 255, 0, 0.5) 0%, rgba(0, 255, 0, 0) 70%);
            animation: healGlow 0.8s forwards;
            z-index: 2;
        }
        
        @keyframes healGlow {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* Apple Impact Effect */
        .apple-impact {
            animation: appleImpact 0.5s forwards;
        }
        
        @keyframes appleImpact {
            0% { transform: scale(1); }
            25% { transform: scale(1.05) rotate(2deg); }
            50% { transform: scale(0.97) rotate(-1deg); }
            75% { transform: scale(1.02) rotate(1deg); }
            100% { transform: scale(1); }
        }
        
        .apple-impact-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 50, 0, 0.6) 0%, transparent 70%);
            animation: appleSplash 0.6s forwards;
            z-index: 2;
        }
        
        @keyframes appleSplash {
            0% { opacity: 0; transform: scale(0.5); }
            40% { opacity: 0.8; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1.3); }
        }
        
        /* Apple Splash Debuff Indicator */
        .apple-splash-indicator {
            position: absolute;
            top: -15px;
            right: 5px;
            font-size: 20px;
            animation: bobbing 2s infinite ease-in-out;
            filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.7));
            z-index: 5;
        }
        
        @keyframes bobbing {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
        }
        
        /* Passive Boost VFX */
        .shoma-passive-boost-vfx {
            position: absolute;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f5a623, #ff7e00);
            color: #fff;
            padding: 8px 15px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 18px;
            animation: passiveBoost 2s forwards;
            z-index: 10;
            box-shadow: 0 0 15px #ffcc00, inset 0 0 8px rgba(255, 255, 255, 0.5);
            border: 2px solid #fff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .shoma-passive-boost-vfx::before,
        .shoma-passive-boost-vfx::after {
            content: "⚔️";
            margin: 0 5px;
        }
        
        @keyframes passiveBoost {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
        
        /* Stun Effect Styling */
        .stunned {
            filter: grayscale(50%);
        }
        
        .stun-effect {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background-image: radial-gradient(circle, transparent 30%, yellow 30%, yellow 40%, transparent 40%);
            animation: spin 2s linear infinite;
            z-index: 5;
        }
        
        @keyframes spin {
            0% { transform: translateX(-50%) rotate(0deg); }
            100% { transform: translateX(-50%) rotate(360deg); }
        }

        /* Cottage Run Animations */
        .cottage-run-animation {
            animation: cottageRun 0.8s forwards;
        }

        @keyframes cottageRun {
            0% { transform: translateX(0); }
            15% { transform: translateX(-10px) scale(0.95); }
            40% { transform: translateX(80px) scale(1.05); filter: blur(2px); }
            65% { transform: translateX(10px) scale(0.98); filter: blur(1px); }
            100% { transform: translateX(0) scale(1); filter: blur(0); }
        }

        .cottage-run-vfx {
            position: absolute;
            width: 150%;
            height: 100%;
            left: -25%;
            top: 0;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
            animation: cottageRunDash 0.8s forwards;
            z-index: 2;
        }

        @keyframes cottageRunDash {
            0% { transform: translateX(-80px) skewX(-20deg); opacity: 0; }
            30% { transform: translateX(0) skewX(-10deg); opacity: 0.8; }
            70% { transform: translateX(80px) skewX(5deg); opacity: 0.6; }
            100% { transform: translateX(150px) skewX(0deg); opacity: 0; }
        }

        .dash-effect-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 3;
            pointer-events: none;
        }

        .dash-particle {
            position: absolute;
            background: #ddd;
            border-radius: 50%;
            opacity: 0.7;
            filter: blur(1px);
            animation: dashParticle 0.6s forwards;
        }

        @keyframes dashParticle {
            0% { transform: translateX(30px); opacity: 0.7; }
            100% { transform: translateX(-50px); opacity: 0; }
        }

        /* Cottage Run Heal Effect */
        .cottage-run-heal-effect {
            animation: cottageHeal 1s forwards;
        }

        @keyframes cottageHeal {
            0% { filter: brightness(1); }
            30% { filter: brightness(1.3) hue-rotate(60deg); }
            70% { filter: brightness(1.2) hue-rotate(30deg); }
            100% { filter: brightness(1); }
        }

        .cottage-run-heal-vfx {
            position: absolute;
            width: 130%;
            height: 130%;
            top: -15%;
            left: -15%;
            background: radial-gradient(circle, rgba(255, 220, 120, 0.6) 0%, transparent 70%);
            animation: cottageHealGlow 1.2s forwards;
            z-index: 2;
            border-radius: 50%;
        }

        @keyframes cottageHealGlow {
            0% { opacity: 0; transform: scale(0.8); }
            40% { opacity: 0.8; transform: scale(1.1); }
            80% { opacity: 0.5; transform: scale(1.3); }
            100% { opacity: 0; transform: scale(1.5); }
        }

        /* Perfect Dodge Effect Styles */
        .perfect-dodge-vfx {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            border-radius: inherit;
            background: radial-gradient(circle, rgba(255, 220, 120, 0.7) 0%, rgba(255, 195, 40, 0.4) 40%, transparent 70%);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.5);
            animation: perfectDodgeGlow 1.2s forwards;
            z-index: 2;
        }

        @keyframes perfectDodgeGlow {
            0% { opacity: 0; transform: scale(0.8); }
            40% { opacity: 0.8; transform: scale(1.15); }
            80% { opacity: 0.6; transform: scale(1.3); }
            100% { opacity: 0; transform: scale(1.5); }
        }

        .perfect-dodge-indicator {
            position: absolute;
            top: -15px;
            right: 50px;
            font-size: 24px;
            animation: cottageFloat 3s infinite ease-in-out;
            filter: drop-shadow(0 0 5px rgba(255, 220, 120, 0.8));
            z-index: 5;
        }

        @keyframes cottageFloat {
            0% { transform: translateY(0) rotate(0deg); }
            33% { transform: translateY(-7px) rotate(5deg); }
            66% { transform: translateY(-3px) rotate(-3deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
    `;
    document.head.appendChild(style);
});

// Modify Character.prototype.applyDamage to check for outgoingDamageModifier in effects
document.addEventListener('DOMContentLoaded', () => {
    // Only modify if not already modified
    if (!Character.prototype._hasOutgoingDamageModifier) {
        // Store the original applyDamage method
        const originalApplyDamage = Character.prototype.applyDamage;
        
        // Override the applyDamage method to handle outgoing damage modifiers
        Character.prototype.applyDamage = function(amount, type, caster) {
            let modifiedAmount = amount;
            
            // Check if this character has outgoingDamageModifier from debuffs
            // This is for when the character is attacking others (reduces their outgoing damage)
            if (this.isDamageSource) {
                // Check all debuffs on the attacker for outgoingDamageModifier
                for (const debuff of this.isDamageSource.debuffs) {
                    if (debuff.effects && typeof debuff.effects.outgoingDamageModifier === 'number') {
                        // Apply the modifier to reduce damage
                        modifiedAmount *= debuff.effects.outgoingDamageModifier;
                    }
                }
            }
            
            // Call the original method with the modified amount and caster
            return originalApplyDamage.call(this, modifiedAmount, type, caster);
        };
        
        // Mark the prototype as modified to avoid double patching
        Character.prototype._hasOutgoingDamageModifier = true;
        
        console.log("Added outgoingDamageModifier support to Character.prototype.applyDamage");
    }
});

// Modify Character.prototype to handle dodge animations when a dodge occurs
document.addEventListener('DOMContentLoaded', () => {
    // Only modify if not already modified for dodge animations
    if (!Character.prototype._hasDodgeAnimation) {
        // Store the original dodge check method if it exists
        const originalCheckDodge = Character.prototype.checkDodge || function() {
            // Default implementation if none exists
            return Math.random() < (this.stats.dodgeChance || 0);
        };
        
        // Override the dodge check method
        Character.prototype.checkDodge = function() {
            // Use the original method to check if dodge occurs
            // The statModifiers are already applied to stats.dodgeChance
            const dodged = originalCheckDodge.call(this);
            
            // If dodged, apply dodge animation effects
            if (dodged) {
                // Find character element and add dodge animation
                const charElement = document.getElementById(`character-${this.instanceId || this.id}`); // Use instanceId or id
                if (charElement) {
                    // --- Dodge VFX Container ---
                    const vfxContainer = document.createElement('div');
                    vfxContainer.className = 'vfx-container dodge-vfx-container';
                    charElement.appendChild(vfxContainer);

                    // Add dodge animation class to character element itself
                    charElement.classList.add('dodge-animation');

                    // Create afterimage effect inside container
                    const afterimage = document.createElement('div');
                    afterimage.className = 'dodge-afterimage';
                    vfxContainer.appendChild(afterimage);

                    // Play dodge sound
                    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSound('sounds/dodge_whoosh.mp3', 0.5); // Example sound

                    // Remove class and VFX container after animation
                    setTimeout(() => {
                        charElement.classList.remove('dodge-animation');
                        vfxContainer.remove();
                    }, 500); // Match animation duration
                    // --- End Dodge VFX Container ---
                }
            }
            
            return dodged;
        };
        
        // Mark the prototype as modified to avoid double patching
        Character.prototype._hasDodgeAnimation = true;
        
        console.log("Added dodge animation to Character.prototype.checkDodge");
    }
}); 