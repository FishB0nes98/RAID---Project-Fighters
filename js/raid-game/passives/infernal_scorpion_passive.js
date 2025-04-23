// Infernal Scorpion Passive: Chain Reaction

function infernalScorpionChainReactionPassive(caster, target, ability, damageResult) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const gameManager = window.gameManager;
    if (!gameManager) return;

    // Check if it's a damaging ability and the passive procs (50% chance)
    if (damageResult && damageResult.damage > 0 && Math.random() < 0.5) {
        log(`${caster.name}'s Chain Reaction passive triggers!`);

        // Determine opponent list
        const opponentList = caster.isAI ? gameManager.gameState.playerCharacters : gameManager.gameState.aiCharacters;

        // Find valid targets (alive, not the original target)
        const validTargets = opponentList.filter(char => 
            char && 
            !char.isDead() && 
            char !== target // Don't hit the primary target again
        );

        if (validTargets.length === 0) {
            log("Chain Reaction: No other valid targets found.");
            return;
        }

        // Select a random valid target
        const nextTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
        const chainDamage = Math.floor(damageResult.damage * 0.5);

        if (chainDamage <= 0) {
            log("Chain Reaction: Calculated chain damage is zero or less.");
            return;
        }

        log(`Chain Reaction strikes ${nextTarget.name} for ${chainDamage} damage!`);

        // Play a sound effect
        gameManager.playSound('sounds/chain_lightning.wav', 0.7);

        // --- Enhanced VFX for Chain Reaction ---
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        const nextTargetElement = document.getElementById(`character-${nextTarget.instanceId || nextTarget.id}`);
        
        if (targetElement && nextTargetElement) {
            // Get positions for chain animation
            const targetRect = targetElement.getBoundingClientRect();
            const nextTargetRect = nextTargetElement.getBoundingClientRect();
            
            const startX = targetRect.left + targetRect.width / 2;
            const startY = targetRect.top + targetRect.height / 2;
            const endX = nextTargetRect.left + nextTargetRect.width / 2;
            const endY = nextTargetRect.top + nextTargetRect.height / 2;
            
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            
            // Add start point glow effect
            const startPoint = document.createElement('div');
            startPoint.className = 'chain-start-point';
            startPoint.style.left = `${startX}px`;
            startPoint.style.top = `${startY}px`;
            document.body.appendChild(startPoint);
            
            // Create the Chain Lightning bolt
            const chainBolt = document.createElement('div');
            chainBolt.className = 'chain-reaction-bolt';
            document.body.appendChild(chainBolt);
            
            // Position and animate the bolt
            chainBolt.style.left = `${startX}px`;
            chainBolt.style.top = `${startY}px`;
            chainBolt.style.width = `0px`; // Start at 0 width
            chainBolt.style.transform = `rotate(${angle}deg)`;
            
            // Random zigzag effect (make chain lightning look jagged)
            // By adding multiple points with slight offset from main line
            const zigzagCount = Math.floor(distance / 20); // One zigzag every 20px
            for (let i = 0; i < zigzagCount; i++) {
                const zigzag = document.createElement('div');
                zigzag.className = 'chain-reaction-bolt';
                document.body.appendChild(zigzag);
                
                // Position zigzag along chain with random offset
                const positionPercent = (i + 0.5) / zigzagCount;
                const offsetX = (Math.random() * 10) - 5; // -5 to 5 pixels
                const offsetY = (Math.random() * 10) - 5; // -5 to 5 pixels
                
                const zigzagX = startX + (endX - startX) * positionPercent;
                const zigzagY = startY + (endY - startY) * positionPercent;
                
                const subBoltLength = Math.random() * 20 + 10; // 10-30px
                const subBoltAngle = angle + (Math.random() * 60 - 30); // +/- 30 degrees
                
                zigzag.style.left = `${zigzagX}px`;
                zigzag.style.top = `${zigzagY}px`;
                zigzag.style.width = `${subBoltLength}px`;
                zigzag.style.height = `${3 + Math.random() * 2}px`; // Varied thickness
                zigzag.style.transform = `rotate(${subBoltAngle}deg)`;
                zigzag.style.opacity = `${0.5 + Math.random() * 0.5}`; // Varied opacity
                
                // Animate and remove with a fixed delay after main bolt animation
                setTimeout(() => {
                    zigzag.animate([
                        { opacity: zigzag.style.opacity },
                        { opacity: 0 }
                    ], { duration: 150, easing: 'ease-out' }).onfinish = () => zigzag.remove();
                }, 250); // Remove slightly after main bolt (200ms) + impact (50ms)
            }
            
            // Animate main bolt extending
            chainBolt.animate([
                { width: '0px' },
                { width: `${distance}px` }
            ], { 
                duration: 200, 
                easing: 'ease-in-out'
            });
            
            // After bolt reaches target
            setTimeout(() => {
                // Create impact effect at target
                const endPoint = document.createElement('div');
                endPoint.className = 'chain-end-point';
                endPoint.style.left = `${endX}px`;
                endPoint.style.top = `${endY}px`;
                document.body.appendChild(endPoint);
                
                // --- FIX: Add removal for endPoint --- 
                setTimeout(() => endPoint.remove(), 800); // Match end-impact animation duration in CSS
                
                // Create damage number that floats up
                const damageNumber = document.createElement('div');
                damageNumber.className = 'chain-damage-number';
                damageNumber.textContent = chainDamage;
                damageNumber.style.left = `${endX}px`;
                damageNumber.style.top = `${endY - 20}px`;
                document.body.appendChild(damageNumber);
                
                // Add particle effect (sparks flying from impact)
                const particles = document.createElement('div');
                particles.className = 'chain-particles';
                nextTargetElement.appendChild(particles);
                
                // Generate 10-15 particles
                for (let i = 0; i < 10 + Math.floor(Math.random() * 6); i++) {
                    const particle = document.createElement('div');
                    particle.className = 'chain-particle';
                    
                    // Random position within target
                    const particleX = Math.random() * 100; // % position
                    const particleY = Math.random() * 100; // % position
                    
                    // Random movement direction
                    const tx = (Math.random() * 60) - 30; // -30px to +30px
                    const ty = (Math.random() * 60) - 30; // -30px to +30px
                    
                    particle.style.left = `${particleX}%`;
                    particle.style.top = `${particleY}%`;
                    particle.style.setProperty('--tx', `${tx}px`);
                    particle.style.setProperty('--ty', `${ty}px`);
                    
                    particles.appendChild(particle);
                }
                
                // Fade out main bolt
                chainBolt.animate([
                    { opacity: 0.9 },
                    { opacity: 0 }
                ], { 
                    duration: 200, 
                    easing: 'ease-out' 
                }).onfinish = () => chainBolt.remove();
                
                // Clean up particles after animation
                setTimeout(() => {
                    particles.remove();
                    damageNumber.remove();
                    // endPoint removal moved above
                }, 800);
                
                // Add brief flicker/shake to the character hit by chain reaction
                nextTargetElement.animate([
                    { filter: 'brightness(1)', transform: 'translate(0, 0)' },
                    { filter: 'brightness(1.5)', transform: 'translate(-4px, 2px)' },
                    { filter: 'brightness(1.2)', transform: 'translate(3px, -2px)' },
                    { filter: 'brightness(1.5)', transform: 'translate(-2px, -3px)' },
                    { filter: 'brightness(1)', transform: 'translate(0, 0)' }
                ], { 
                    duration: 400, 
                    easing: 'ease-in-out' 
                });
            }, 200);
            
            // Clean up starting point after animation
            setTimeout(() => {
                startPoint.remove();
            }, 500);
        }
        // --- End Enhanced VFX ---

        // Apply the chain damage
        // Important: Pass 'caster' so crits/lifesteal apply to the scorpion
        // Also pass a flag to prevent infinite loops if the passive could trigger itself (it shouldn't based on description)
        const chainDamageResult = nextTarget.applyDamage(chainDamage, damageResult.type, caster, true); // Added 'true' for isChainReaction, store result

        // --- NEW: Check for and apply debuffs from specific abilities ---
        let appliedDebuff = null;
        if (ability && ability.id === 'infernal_scorpion_q') { // GET OVER HERE
            const originalHookedDebuff = target.debuffs.find(d => d.id === 'hooked_debuff');
            if (originalHookedDebuff) {
                log(`Chain Reaction applying Hooked debuff to ${nextTarget.name}.`);
                appliedDebuff = originalHookedDebuff.clone(); // Assuming Effect has a clone method
                nextTarget.addDebuff(appliedDebuff);
                // Add visual indicator if needed (similar to how it's added in the original ability)
                const hookedIndicator = document.createElement('div');
                hookedIndicator.className = 'hooked-debuff-indicator';
                if (nextTargetElement) nextTargetElement.appendChild(hookedIndicator);
                hookedIndicator.id = `hooked-indicator-${nextTarget.instanceId || nextTarget.id}`;
                // Ensure indicator is removed when debuff is removed
                appliedDebuff.onRemove = () => {
                    const indicator = document.getElementById(`hooked-indicator-${nextTarget.instanceId || nextTarget.id}`);
                    if (indicator) indicator.remove();
                };
            }
        } else if (ability && ability.id === 'infernal_scorpion_w') { // Fire Breath
            const originalBurnDebuff = target.debuffs.find(d => d.id === 'burn_debuff');
            if (originalBurnDebuff) {
                log(`Chain Reaction applying Burn debuff to ${nextTarget.name}.`);
                appliedDebuff = originalBurnDebuff.clone(); // Assuming Effect has a clone method
                nextTarget.addDebuff(appliedDebuff);
                // Burn might have its own visual indicator on tick, handled by the effect itself
            }
        }
        // --- END NEW ---

        // Update UI for the chained target
        updateCharacterUI(nextTarget);
    }
}

// -- Removed incorrect registration call --
/*
// Register the passive effect with the CharacterFactory
if (typeof CharacterFactory !== 'undefined') {
    CharacterFactory.registerPassiveEffect('infernal_chain_reaction', infernalScorpionChainReactionPassive);
} else {
    console.warn("Infernal Scorpion passive defined but CharacterFactory not found.");
}
*/ 