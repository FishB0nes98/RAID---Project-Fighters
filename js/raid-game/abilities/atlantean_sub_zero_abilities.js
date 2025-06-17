// Atlantean Sub Zero Abilities
class AtlanteanSubZeroAbilities {
    static createIceBallEffect(abilityData) {
        return function(caster, target) {
            console.log(`${caster.name} casts Ice Ball on ${target.name}!`);
            
            // Show ice ball projectile VFX
            AtlanteanSubZeroAbilities.showIceBallVFX(caster, target);
            
            setTimeout(() => {
                // Calculate damage: 395 + 125% Magical Damage
                const baseDamage = 395;
                const magicalDamageBonus = Math.floor(caster.stats.magicalDamage * 1.25);
                const totalDamage = baseDamage + magicalDamageBonus;
                
                // Apply damage
                const result = target.applyDamage(totalDamage, 'magical', caster, { abilityId: 'ice_ball' });
                
                // Only apply freeze if damage wasn't dodged
                if (!result.isDodged) {
                    // 25% chance to freeze for 3 turns
                    if (Math.random() < 0.25) {
                        const freezeDebuff = {
                            id: 'freeze',
                            name: 'Freeze',
                            icon: '❄️',
                            duration: 3,
                            maxDuration: 3, // Always max duration
                            isDebuff: true,
                            source: caster.name,
                            description: 'Frozen solid! Abilities have only 40% chance to succeed.',
                            effect: function(character) {
                                // Freeze effect is handled in the ability usage logic
                            },
                            onRemove: function(character) {
                                if (window.AtlanteanSubZeroAbilities) {
                                    // Natural expiry melt
                                    window.AtlanteanSubZeroAbilities.removeFreezeIndicator(character, false);
                                }
                            }
                        };
                        
                        target.addDebuff(freezeDebuff);
                        
                        // Show freeze VFX
                        AtlanteanSubZeroAbilities.showFreezeApplicationVFX(target);
                        
                        if (window.gameManager) {
                            window.gameManager.addLogEntry(`💧 ${target.name} is frozen solid!`, 'debuff');
                        }
                    }
                }
            }, 800); // Delay for projectile travel time
        };
    }
    
    static showIceBallVFX(caster, target) {
        const casterElement = AtlanteanSubZeroAbilities.getCharacterElement(caster);
        const targetElement = AtlanteanSubZeroAbilities.getCharacterElement(target);
        
        if (!casterElement || !targetElement) return;
        
        // Create ice ball projectile
        const projectile = document.createElement('div');
        projectile.className = 'ice-ball-projectile';
        
        // Position at caster
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        projectile.style.left = (casterRect.left + casterRect.width / 2) + 'px';
        projectile.style.top = (casterRect.top + casterRect.height / 2) + 'px';
        
        document.body.appendChild(projectile);
        
        // Animate to target
        setTimeout(() => {
            projectile.style.left = (targetRect.left + targetRect.width / 2) + 'px';
            projectile.style.top = (targetRect.top + targetRect.height / 2) + 'px';
        }, 10);
        
        // Impact effect
        setTimeout(() => {
            AtlanteanSubZeroAbilities.createIceImpactVFX(targetElement);
            projectile.remove();
        }, 800);
    }
    
    static createIceImpactVFX(targetElement) {
        // Create ice impact particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'ice-impact-particle';
            
            const angle = (i / 12) * 360;
            const distance = 30 + Math.random() * 20;
            
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--distance', distance + 'px');
            
            targetElement.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
        
        // Screen shake
        document.querySelector('.battle-container')?.classList.add('ice-impact-shake');
        setTimeout(() => {
            document.querySelector('.battle-container')?.classList.remove('ice-impact-shake');
        }, 300);
    }
    
    static showFreezeApplicationVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        // Add freeze overlay
        const freezeOverlay = document.createElement('div');
        freezeOverlay.className = 'freeze-overlay';
        characterElement.appendChild(freezeOverlay);
        
        // Create ice crystals
        for (let i = 0; i < 8; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'ice-crystal';
            crystal.style.animationDelay = (i * 0.1) + 's';
            freezeOverlay.appendChild(crystal);
        }
        
        // Show freeze indicator on character
        AtlanteanSubZeroAbilities.showFreezeIndicator(character);
    }
    
    static showFreezeIndicator(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        let freezeIndicator = characterElement.querySelector('.freeze-indicator');
        if (!freezeIndicator) {
            freezeIndicator = document.createElement('div');
            freezeIndicator.className = 'freeze-indicator';
            freezeIndicator.innerHTML = '❄️';
            characterElement.appendChild(freezeIndicator);
        }
    }
    
    static removeFreezeIndicator(character, broken = false) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;

        // Scatter shards when broken, otherwise melt.
        if (broken) {
            AtlanteanSubZeroAbilities.scatterFreezeVFX(character);
        } else {
            AtlanteanSubZeroAbilities.meltFreezeVFX(character);
        }
    }
    
    // Scatter shards outward when freeze is broken early
    static scatterFreezeVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;

        // Create shard particles
        for (let i = 0; i < 14; i++) {
            const shard = document.createElement('div');
            shard.className = 'freeze-scatter-particle';
            const angle = Math.random() * 360;
            const distance = 40 + Math.random() * 25;
            const dx = Math.cos(angle * Math.PI / 180) * distance;
            const dy = Math.sin(angle * Math.PI / 180) * distance;
            shard.style.left = '50%';
            shard.style.top = '50%';
            shard.style.setProperty('--dx', dx.toFixed(1));
            shard.style.setProperty('--dy', dy.toFixed(1));
            characterElement.appendChild(shard);
            setTimeout(() => shard.remove(), 800);
        }

        // Flash removal for indicator/overlay
        const indicator = characterElement.querySelector('.freeze-indicator');
        if (indicator) indicator.remove();
        const overlay = characterElement.querySelector('.freeze-overlay');
        if (overlay) overlay.remove();
    }
    
    // Melt/fade when freeze naturally expires
    static meltFreezeVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        const overlay = characterElement.querySelector('.freeze-overlay');
        if (overlay) {
            overlay.classList.add('freeze-melt');
            // Remove after animation completes
            setTimeout(() => overlay.remove(), 1200);
        }
        // Fade & remove indicator too
        const indicator = characterElement.querySelector('.freeze-indicator');
        if (indicator) {
            indicator.style.transition = 'opacity 0.8s';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 800);
        }
    }
    
    static showFreezeFailVFX(character) {
        const characterElement = AtlanteanSubZeroAbilities.getCharacterElement(character);
        if (!characterElement) return;
        
        // Add flash overlay
        const flash = document.createElement('div');
        flash.className = 'freeze-fail-vfx';
        characterElement.appendChild(flash);
        
        // Slight shake on character element
        characterElement.classList.add('freeze-fail-shake');
        setTimeout(() => {
            flash.remove();
            characterElement.classList.remove('freeze-fail-shake');
        }, 600);
    }
    
    // Helper to get character DOM element reliably
    static getCharacterElement(character) {
        const instanceId = character.instanceId || character.id;
        // Try by element ID first (used by UIManager)
        let el = document.getElementById(`character-${instanceId}`);
        if (!el) {
            // Fallback to data-character-id selector (used by some older code)
            el = document.querySelector(`[data-character-id="${instanceId}"]`);
        }
        return el;
    }
}

// Register abilities
if (typeof window !== 'undefined') {
    window.AtlanteanSubZeroAbilities = AtlanteanSubZeroAbilities;
} 