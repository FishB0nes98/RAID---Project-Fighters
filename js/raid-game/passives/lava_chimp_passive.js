/**
 * Lava Chimp Passive: Volcanic Leap
 * When Lava Chimp dodges an attack, it immediately leaps onto a random enemy, dealing 275 damage.
 */

class LavaChimpPassive {
    constructor() {
        this.passiveId = 'lava_chimp_volcanic_leap';
        this.passiveName = 'Volcanic Leap';
        this.character = null;
        console.log(`[LavaChimpPassive] Passive initialized`);
    }

    initialize(character) {
        console.log('[LavaChimpPassive] INITIALIZE called with character:', character?.name, character?.id);
        this.attachToCharacter(character);
    }

    attachToCharacter(character) {
        // Check if this character already has a passive instance
        if (character._lavaChimpPassiveInstance) {
            console.log(`[LavaChimpPassive] Character ${character.name} already has a passive instance, detaching old one`);
            character._lavaChimpPassiveInstance.detachFromCharacter();
        }
        
        this.character = character;
        character._lavaChimpPassiveInstance = this;
        
        console.log(`[LavaChimpPassive] Attached to character: ${character.name} (ID: ${character.id})`);
        console.log(`[LavaChimpPassive] Character has showEnhancedDodgeVFX method: ${typeof character.showEnhancedDodgeVFX === 'function'}`);
        console.log(`[LavaChimpPassive] Character dodge chance: ${character.stats.dodgeChance || 0}`);
        
        // Hook into the dodge mechanism
        this.setupDodgeHook();
        
        // Set up periodic integrity check to ensure hook isn't lost (but only if not already running)
        if (!this.integrityCheckInterval) {
            this.setupPeriodicIntegrityCheck();
        }
    }

    setupDodgeHook() {
        if (!this.character) {
            console.error('[LavaChimpPassive] Cannot setup dodge hook - no character attached');
            return;
        }

        console.log(`[LavaChimpPassive] Setting up dodge hook for ${this.character.name}`);
        console.log(`[LavaChimpPassive] Character showEnhancedDodgeVFX method exists:`, typeof this.character.showEnhancedDodgeVFX === 'function');

        // Store original showEnhancedDodgeVFX method
        if (!this.character._originalShowEnhancedDodgeVFX) {
            this.character._originalShowEnhancedDodgeVFX = this.character.showEnhancedDodgeVFX.bind(this.character);
            console.log(`[LavaChimpPassive] Stored original showEnhancedDodgeVFX method`);
        }

        // Override showEnhancedDodgeVFX to trigger our passive
        const self = this;
        this.character.showEnhancedDodgeVFX = function() {
            console.log(`[LavaChimpPassive] DODGE HOOK TRIGGERED for ${this.name}!`);
            console.log(`[LavaChimpPassive] Character ID: ${this.id}, Instance ID: ${this.instanceId}`);
            
            // Call original dodge VFX
            if (this._originalShowEnhancedDodgeVFX) {
                this._originalShowEnhancedDodgeVFX();
            } else {
                console.warn(`[LavaChimpPassive] Original showEnhancedDodgeVFX method not found for ${this.name}`);
            }
            
            // Trigger volcanic leap
            self.triggerVolcanicLeap();
        };

        // Mark the method as hooked so we can detect if it gets overridden
        this.character.showEnhancedDodgeVFX._lavaChimpHooked = true;

        console.log(`[LavaChimpPassive] Dodge hook established for ${this.character.name}`);
    }

    checkHookIntegrity() {
        if (!this.character) return false;
        
        const hookIntact = this.character.showEnhancedDodgeVFX && this.character.showEnhancedDodgeVFX._lavaChimpHooked === true;
        console.log(`[LavaChimpPassive] Hook integrity check for ${this.character.name}: ${hookIntact ? 'INTACT' : 'BROKEN'}`);
        
        if (!hookIntact) {
            console.warn(`[LavaChimpPassive] Hook was lost for ${this.character.name}! Re-establishing...`);
            this.setupDodgeHook();
        }
        
        return hookIntact;
    }

    setupPeriodicIntegrityCheck() {
        if (!this.character) return;
        
        // Check hook integrity every 30 seconds (reduced from 5 to prevent spam)
        this.integrityCheckInterval = setInterval(() => {
            // Only check if character still exists and is not dead
            if (this.character && !this.character.isDead()) {
                this.checkHookIntegrity();
            } else if (this.character && this.character.isDead()) {
                // Character is dead, stop the interval
                console.log(`[LavaChimpPassive] ${this.character.name} is dead, stopping integrity checks`);
                this.detachFromCharacter();
            }
        }, 30000);
        
        console.log(`[LavaChimpPassive] Periodic integrity check started for ${this.character.name} (every 30 seconds)`);
    }

    triggerVolcanicLeap() {
        if (!this.character || this.character.isDead()) return;

        console.log(`[LavaChimpPassive] ${this.character.name} triggers Volcanic Leap!`);

        // Get all enemies (opposite team)
        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            console.error('[LavaChimpPassive] Cannot access game manager');
            return;
        }

        const enemies = this.character.isAI ? 
            gameManager.gameState.playerCharacters : 
            gameManager.gameState.aiCharacters;

        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
        
        if (aliveEnemies.length === 0) {
            console.log('[LavaChimpPassive] No alive enemies to leap onto');
            return;
        }

        // Select random enemy
        const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        
        // Add log entry
        if (gameManager.addLogEntry) {
            gameManager.addLogEntry(
                `🦍 ${this.character.name} leaps through the air onto ${randomEnemy.name}!`, 
                'passive-trigger volcanic-leap'
            );
        }

        // Create leap animation and VFX
        this.createVolcanicLeapVFX(randomEnemy);

        // Deal damage after animation delay
        setTimeout(() => {
            const damage = Math.floor(this.character.stats.physicalDamage * 1.55);
            
            // Apply damage
            randomEnemy.applyDamage(damage, 'physical', this.character, {
                isVolcanicLeap: true,
                skipDodge: true // Can't dodge the leap since it's from dodging
            });

            if (gameManager.addLogEntry) {
                gameManager.addLogEntry(
                    `💥 Volcanic Leap deals ${damage} damage to ${randomEnemy.name}!`, 
                    'damage volcanic-leap'
                );
            }

            // Create impact VFX
            this.createImpactVFX(randomEnemy, damage);

        }, 800); // Delay for leap animation
    }

    createVolcanicLeapVFX(target) {
        try {
            const chimpElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);

            if (!chimpElement || !targetElement) {
                console.warn('[LavaChimpPassive] Could not find character elements for VFX');
                return;
            }

            // Add leap animation class to chimp
            chimpElement.classList.add('volcanic-leap-animation');

            // Create volcanic leap trail effect
            const leapTrail = document.createElement('div');
            leapTrail.className = 'volcanic-leap-trail';
            document.body.appendChild(leapTrail);

            // Position trail from chimp to target
            const chimpRect = chimpElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();

            leapTrail.style.cssText = `
                position: fixed;
                left: ${chimpRect.left + chimpRect.width / 2}px;
                top: ${chimpRect.top + chimpRect.height / 2}px;
                width: 3px;
                height: ${Math.sqrt(Math.pow(targetRect.left - chimpRect.left, 2) + Math.pow(targetRect.top - chimpRect.top, 2))}px;
                background: linear-gradient(45deg, #ff4444, #ff8800, #ffaa00);
                transform-origin: top;
                transform: rotate(${Math.atan2(targetRect.top - chimpRect.top, targetRect.left - chimpRect.left) * 180 / Math.PI + 90}deg);
                box-shadow: 0 0 20px #ff6600, 0 0 40px #ff4400;
                animation: volcanic-leap-trail 0.8s ease-out forwards;
                z-index: 1000;
            `;

            // Create fire particles along the trail
            this.createLeapParticles(chimpElement, targetElement);

            // Remove effects after animation
            setTimeout(() => {
                chimpElement.classList.remove('volcanic-leap-animation');
                if (leapTrail.parentNode) {
                    leapTrail.remove();
                }
            }, 1000);

        } catch (error) {
            console.error('[LavaChimpPassive] Error creating leap VFX:', error);
        }
    }

    createLeapParticles(chimpElement, targetElement) {
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'volcanic-leap-particle';
                
                const chimpRect = chimpElement.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                
                // Interpolate position along the leap path
                const progress = i / particleCount;
                const x = chimpRect.left + (targetRect.left - chimpRect.left) * progress;
                const y = chimpRect.top + (targetRect.top - chimpRect.top) * progress - 50 * Math.sin(progress * Math.PI); // Arc effect
                
                particle.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #ff6600, #ff0000);
                    border-radius: 50%;
                    box-shadow: 0 0 10px #ff4400;
                    animation: volcanic-particle-fade 0.6s ease-out forwards;
                    z-index: 999;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 600);
                
            }, i * 50);
        }
    }

    createImpactVFX(target, damage) {
        try {
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            if (!targetElement) return;

            // Add impact shake
            targetElement.classList.add('volcanic-impact-shake');

            // Create volcanic explosion effect
            const explosion = document.createElement('div');
            explosion.className = 'volcanic-explosion';
            
            const targetRect = targetElement.getBoundingClientRect();
            explosion.style.cssText = `
                position: fixed;
                left: ${targetRect.left + targetRect.width / 2 - 50}px;
                top: ${targetRect.top + targetRect.height / 2 - 50}px;
                width: 100px;
                height: 100px;
                background: radial-gradient(circle, rgba(255, 100, 0, 0.8), rgba(255, 0, 0, 0.6), transparent);
                border-radius: 50%;
                animation: volcanic-explosion 0.5s ease-out forwards;
                z-index: 1001;
            `;

            document.body.appendChild(explosion);

            // Create impact particles
            this.createImpactParticles(targetElement);

            // Add floating damage text
            this.showVolcanicDamageText(target, damage);

            // Remove all VFX effects after animation completes
            setTimeout(() => {
                // Remove impact shake from target
                targetElement.classList.remove('volcanic-impact-shake');
                
                // Remove explosion element
                if (explosion.parentNode) {
                    explosion.remove();
                }
                
                // Clean up any remaining particle elements
                const remainingParticles = document.querySelectorAll('.volcanic-impact-particle');
                remainingParticles.forEach(particle => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                });
                
                // Clean up any remaining damage text elements
                const remainingDamageText = document.querySelectorAll('.volcanic-damage-text');
                remainingDamageText.forEach(text => {
                    if (text.parentNode) {
                        text.remove();
                    }
                });
                
                console.log('[LavaChimpPassive] Impact VFX cleanup completed');
            }, 1600); // Extended timeout to ensure all animations complete

        } catch (error) {
            console.error('[LavaChimpPassive] Error creating impact VFX:', error);
        }
    }

    createImpactParticles(targetElement) {
        const particleCount = 12;
        const targetRect = targetElement.getBoundingClientRect();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'volcanic-impact-particle';
            
            const angle = (i / particleCount) * 2 * Math.PI;
            const distance = 30 + Math.random() * 20;
            const x = targetRect.left + targetRect.width / 2 + Math.cos(angle) * distance;
            const y = targetRect.top + targetRect.height / 2 + Math.sin(angle) * distance;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 6px;
                height: 6px;
                background: #ff4400;
                border-radius: 50%;
                box-shadow: 0 0 8px #ff6600;
                animation: volcanic-impact-particle 0.8s ease-out forwards;
                z-index: 1000;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 800);
        }
    }

    showVolcanicDamageText(target, damage) {
        try {
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            if (!targetElement) return;

            const damageText = document.createElement('div');
            damageText.className = 'volcanic-damage-text';
            damageText.textContent = `🦍 ${damage}`;
            
            const targetRect = targetElement.getBoundingClientRect();
            damageText.style.cssText = `
                position: fixed;
                left: ${targetRect.left + targetRect.width / 2}px;
                top: ${targetRect.top - 20}px;
                color: #ff4400;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px #ff6600;
                z-index: 1002;
                pointer-events: none;
                animation: volcanic-damage-float 1.5s ease-out forwards;
                transform: translateX(-50%);
            `;
            
            document.body.appendChild(damageText);
            
            setTimeout(() => {
                if (damageText.parentNode) {
                    damageText.remove();
                }
            }, 1500);

        } catch (error) {
            console.error('[LavaChimpPassive] Error showing damage text:', error);
        }
    }

    detachFromCharacter() {
        if (this.character) {
            // Clear the periodic integrity check
            if (this.integrityCheckInterval) {
                clearInterval(this.integrityCheckInterval);
                this.integrityCheckInterval = null;
                console.log(`[LavaChimpPassive] Cleared integrity check interval for ${this.character.name}`);
            }
            
            // Restore original showEnhancedDodgeVFX if it was overridden
            if (this.character._originalShowEnhancedDodgeVFX) {
                this.character.showEnhancedDodgeVFX = this.character._originalShowEnhancedDodgeVFX;
                delete this.character._originalShowEnhancedDodgeVFX;
            }
            
            // Clear the character's reference to this passive instance
            if (this.character._lavaChimpPassiveInstance === this) {
                delete this.character._lavaChimpPassiveInstance;
            }
            
            console.log(`[LavaChimpPassive] Detached from character: ${this.character.name}`);
            this.character = null;
        }
    }
}

// Global instance
if (typeof window !== 'undefined') {
    window.LavaChimpPassive = LavaChimpPassive;
    console.log('[LavaChimpPassive] Class registered globally as window.LavaChimpPassive');
} else {
    console.error('[LavaChimpPassive] Window object not available - cannot register class globally');
} 