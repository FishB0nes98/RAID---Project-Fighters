// Hell Fly Abilities - Double Scissor

// Double Scissor Effect - Deals 450 damage twice to the same enemy
const hellFlyDoubleScissorEffect = async (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    if (!target || target.isDead()) {
        log(`🪰 ${caster.name}'s scissor claws snap at empty air!`, 'warning');
        return false;
    }

    log(`🪰 ${caster.name} buzzes menacingly and prepares to strike with razor-sharp claws!`, 'ability-cast');
    
    // Play scissor sound
    playSound('sounds/scissor_cut.mp3', 0.9);
    
    // Show initial buzz and windup VFX
    await createDoubleScissorWindupVFX(caster);
    
    const baseDamage = 450;
    let totalDamage = 0;
    
    // First Scissor Strike
    log(`🪰 ${caster.name} strikes with the first scissor claw!`, 'ability-use');
    
    // Create first scissor VFX
    await createScissorStrikeVFX(caster, target, 1);
    
    if (!target.isDead()) {
        const firstDamageResult = target.applyDamage(baseDamage, 'physical', caster, {
            abilityId: 'hell_fly_double_scissor',
            strikeNumber: 1
        });
        
        totalDamage += firstDamageResult.damage;
        
        let firstMessage = `🪰 ${target.name} is slashed by the first scissor for ${firstDamageResult.damage} damage`;
        if (firstDamageResult.isCritical) firstMessage += " (Razor Critical!)";
        log(firstMessage, firstDamageResult.isCritical ? 'critical' : 'damage');
        
        // Apply lifesteal for first hit
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(firstDamageResult.damage);
        }
    } else {
        log(`🪰 ${target.name} was already defeated before the first strike!`, 'system');
        return;
    }
    
    // Small delay between strikes
    await delay(400);
    
    // Second Scissor Strike (if target is still alive)
    if (!target.isDead()) {
        log(`🪰 ${caster.name} follows up with the second scissor claw!`, 'ability-use');
        
        // Create second scissor VFX
        await createScissorStrikeVFX(caster, target, 2);
        
        const secondDamageResult = target.applyDamage(baseDamage, 'physical', caster, {
            abilityId: 'hell_fly_double_scissor',
            strikeNumber: 2
        });
        
        totalDamage += secondDamageResult.damage;
        
        let secondMessage = `🪰 ${target.name} is slashed by the second scissor for ${secondDamageResult.damage} damage`;
        if (secondDamageResult.isCritical) secondMessage += " (Razor Critical!)";
        log(secondMessage, secondDamageResult.isCritical ? 'critical' : 'damage');
        
        // Apply lifesteal for second hit
        if (caster.stats.lifesteal > 0) {
            caster.applyLifesteal(secondDamageResult.damage);
        }
    } else {
        log(`🪰 ${target.name} was defeated by the first scissor strike!`, 'system');
    }
    
    // Final VFX and summary
    if (totalDamage > 0) {
        log(`🪰 Total damage dealt: ${totalDamage}`, 'system');
        await createDoubleScissorFinisherVFX(target);
    }
    
    // Check if target is defeated
    if (target.isDead()) {
        log(`🪰 ${target.name} has been sliced to pieces!`, 'defeat');
    }
    
    return true;
};

// Helper function for delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// VFX Functions
async function createDoubleScissorWindupVFX(caster) {
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (!casterElement) return;
    
    // Create buzz effect
    const buzzEffect = document.createElement('div');
    buzzEffect.className = 'hell-fly-buzz-effect';
    casterElement.appendChild(buzzEffect);
    
    // Add caster glow
    casterElement.classList.add('hell-fly-preparing');
    
    // Wait for windup animation
    await delay(600);
    
    // Cleanup
    if (buzzEffect.parentNode) buzzEffect.remove();
    casterElement.classList.remove('hell-fly-preparing');
}

async function createScissorStrikeVFX(caster, target, strikeNumber) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create scissor slash effect
    const scissorSlash = document.createElement('div');
    scissorSlash.className = `hell-fly-scissor-slash strike-${strikeNumber}`;
    targetElement.appendChild(scissorSlash);
    
    // Create impact particles
    createScissorImpactParticles(targetElement, strikeNumber);
    
    // Add target hit animation
    targetElement.classList.add(`scissor-hit-${strikeNumber}`);
    
    // Wait for strike animation
    await delay(300);
    
    // Cleanup
    setTimeout(() => {
        if (scissorSlash.parentNode) scissorSlash.remove();
        targetElement.classList.remove(`scissor-hit-${strikeNumber}`);
    }, 500);
}

function createScissorImpactParticles(targetElement, strikeNumber) {
    // Create blood/impact particles
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'scissor-impact-particle';
        particle.style.position = 'absolute';
        particle.style.top = '50%';
        particle.style.left = '50%';
        
        // Different angles for each strike
        const baseAngle = strikeNumber === 1 ? -45 : 45; // First strike goes up-left, second goes up-right
        const angle = (baseAngle + (Math.random() - 0.5) * 60) * Math.PI / 180;
        const velocity = 20 + Math.random() * 15;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;
        
        particle.style.setProperty('--dx', `${x}px`);
        particle.style.setProperty('--dy', `${y}px`);
        particle.style.animationDelay = `${Math.random() * 0.1}s`;
        
        targetElement.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) particle.remove();
        }, 800);
    }
}

async function createDoubleScissorFinisherVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (!targetElement) return;
    
    // Create finisher glow
    const finisherGlow = document.createElement('div');
    finisherGlow.className = 'double-scissor-finisher-glow';
    targetElement.appendChild(finisherGlow);
    
    // Add screen shake for dramatic effect
    addScissorScreenShake();
    
    // Wait for finisher animation
    await delay(800);
    
    // Cleanup
    if (finisherGlow.parentNode) finisherGlow.remove();
}

function addScissorScreenShake() {
    try {
        const battleContainer = document.querySelector('.battle-container');
        if (battleContainer) {
            battleContainer.style.animation = 'scissorImpactShake 0.5s ease-out';
            setTimeout(() => {
                battleContainer.style.animation = '';
            }, 500);
        }
    } catch (error) {
        console.error('[Scissor Screen Shake] Error:', error);
    }
}

// Create the Double Scissor Ability
const hellFlyDoubleScissor = new Ability(
    'hell_fly_double_scissor',
    'Double Scissor',
    'Icons/abilities/double_scissor.png',
    25, // Mana cost
    1,  // Cooldown
    hellFlyDoubleScissorEffect
);

hellFlyDoubleScissor.setDescription('Strikes the target twice with razor-sharp claws, dealing 450 physical damage per hit.')
                   .setTargetType('enemy');

// Register the ability
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([hellFlyDoubleScissor]);
    console.log("Registered Hell Fly Double Scissor ability.");
} else {
    console.warn("Hell Fly abilities defined but AbilityFactory not found.");
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.hell_fly_double_scissor = hellFlyDoubleScissor;
}

// Export for global access
window.HellFlyAbilities = {
    hellFlyDoubleScissor,
    createDoubleScissorWindupVFX,
    createScissorStrikeVFX,
    createScissorImpactParticles,
    createDoubleScissorFinisherVFX,
    addScissorScreenShake
}; 