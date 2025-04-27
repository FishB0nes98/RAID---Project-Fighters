// Passive logic for Angry Apple's Final Fury

class AngryApplePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'angry_apple_final_fury';
        this.passiveName = 'Final Fury';
    }

    /**
     * Triggered when the character holding this passive dies.
     * Applies a permanent 200% damage buff to all allies.
     * @param {Character} dyingCharacter - The character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const allies = gameManager.getAllies(dyingCharacter);

        log(`${dyingCharacter.name}'s ${this.passiveName} triggers upon death!`, 'passive');

        // Apply fury VFX to the dying character
        this.applyFuryVFX(dyingCharacter);

        allies.forEach(ally => {
            if (!ally.isDead()) {
                log(`${ally.name} flies into a Final Fury, permanently gaining 200% Physical and Magical Damage!`, 'buff');

                // Add a slight delay before applying VFX to each ally for a cascading effect
                setTimeout(() => {
                    this.applyAllyFuryVFX(ally);
                }, 300 + Math.random() * 300); // Random delay between 300-600ms

                // Apply permanent buff (using a permanent buff object)
                const buff = {
                    id: 'final_fury_buff',
                    name: 'Final Fury (Permanent)',
                    description: 'Permanently deals 200% more Physical and Magical Damage.',
                    icon: 'Icons/passives/angry_apple_final_fury.png', // Use passive icon or a dedicated buff icon
                    duration: Infinity, // Permanent
                    isPermanent: true, // Custom flag
                    applyStats: (stats) => {
                        // Multiply base damage stats
                        const newPhysical = Math.max(1, Math.floor(stats.physicalDamage * 3.00)); // 200% increase means 3x damage
                        const newMagical = Math.max(1, Math.floor(stats.magicalDamage * 3.00));
                        console.log(`Applying Final Fury to ${ally.name}: Phys ${stats.physicalDamage}->${newPhysical}, Mag ${stats.magicalDamage}->${newMagical}`);
                        stats.physicalDamage = newPhysical;
                        stats.magicalDamage = newMagical;
                        return stats;
                    },
                    onApply: function(character) {
                        // No immediate effect needed other than stat change
                    },
                    remove: function(character) {
                        // This should ideally not be called for permanent effects
                        console.warn("Attempted to remove permanent Final Fury buff");
                    }
                };

                ally.addBuff(buff);
                // Assuming addBuff or game loop handles recalculateStats()
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(ally);
                }
            }
        });
    }

    /**
     * Apply fury VFX to the character that died
     * @param {Character} character - The character to apply VFX to
     */
    applyFuryVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'final-fury-vfx';
        character.domElement.appendChild(vfxElement);

        // Create flame effects and other VFX elements
        const flameColors = ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'];
        
        // Add 10 flame particles that burst outward
        for (let i = 0; i < 10; i++) {
            const flame = document.createElement('div');
            flame.style.position = 'absolute';
            flame.style.width = `${10 + Math.random() * 15}px`;
            flame.style.height = `${20 + Math.random() * 30}px`;
            flame.style.backgroundColor = flameColors[Math.floor(Math.random() * flameColors.length)];
            flame.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            
            // Random position and animation
            const angle = Math.random() * 360;
            const distance = 50 + Math.random() * 100;
            const startX = 0;
            const startY = 0;
            const endX = Math.cos(angle * Math.PI / 180) * distance;
            const endY = Math.sin(angle * Math.PI / 180) * distance;
            
            flame.style.top = '50%';
            flame.style.left = '50%';
            flame.style.transform = 'translate(-50%, -50%)';
            flame.style.opacity = '0';
            
            // Create animation
            flame.animate([
                { transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`, opacity: 0 },
                { transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`, opacity: 0.9, offset: 0.1 },
                { transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 500,
                easing: 'ease-out',
                fill: 'forwards'
            });
            
            vfxElement.appendChild(flame);
        }

        // Add a sword/weapon icon that grows and fades
        const weaponIcon = document.createElement('div');
        weaponIcon.style.position = 'absolute';
        weaponIcon.style.top = '30%';
        weaponIcon.style.left = '50%';
        weaponIcon.style.transform = 'translate(-50%, -50%) scale(0)';
        weaponIcon.style.fontSize = '60px';
        weaponIcon.style.color = '#ff0000';
        weaponIcon.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
        weaponIcon.style.opacity = '0';
        weaponIcon.innerHTML = '⚔️';
        
        // Create animation
        weaponIcon.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(2)', opacity: 1, offset: 0.5 },
            { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
        ], {
            duration: 2000,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        vfxElement.appendChild(weaponIcon);

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 2100); // Slightly longer than animation duration
    }

    /**
     * Apply fury VFX to allies that receive the buff
     * @param {Character} character - The character to apply VFX to
     */
    applyAllyFuryVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'final-fury-vfx';
        
        // Make the ally VFX slightly smaller
        vfxElement.style.transform = 'scale(0.85)';
        character.domElement.appendChild(vfxElement);

        // Add an aura effect
        const aura = document.createElement('div');
        aura.style.position = 'absolute';
        aura.style.top = '50%';
        aura.style.left = '50%';
        aura.style.width = '120%';
        aura.style.height = '120%';
        aura.style.transform = 'translate(-50%, -50%) scale(0)';
        aura.style.borderRadius = '50%';
        aura.style.background = 'radial-gradient(circle, rgba(255,0,0,0.4) 0%, rgba(255,0,0,0) 70%)';
        aura.style.opacity = '0';
        
        // Create animation
        aura.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.8, offset: 0.3 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 0 }
        ], {
            duration: 1800,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        vfxElement.appendChild(aura);

        // Add a weapon icon that pulses briefly
        const weaponIcon = document.createElement('div');
        weaponIcon.style.position = 'absolute';
        weaponIcon.style.top = '40%';
        weaponIcon.style.left = '50%';
        weaponIcon.style.transform = 'translate(-50%, -50%) scale(0)';
        weaponIcon.style.fontSize = '40px';
        weaponIcon.style.color = '#ff0000';
        weaponIcon.style.textShadow = '0 0 8px #ff0000';
        weaponIcon.style.opacity = '0';
        weaponIcon.innerHTML = '🔥';
        
        // Create animation
        weaponIcon.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.4 },
            { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        vfxElement.appendChild(weaponIcon);

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 2000); // Slightly longer than animation duration
    }
}

// Register the passive handler
// Ensure the global factory and its method exist before calling
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') { 
    console.log("[Passive Registration] Attempting to register: angry_apple_final_fury with class:", AngryApplePassive);
    window.PassiveFactory.registerPassive('angry_apple_final_fury', AngryApplePassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, AngryApplePassive not registered.");
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
}