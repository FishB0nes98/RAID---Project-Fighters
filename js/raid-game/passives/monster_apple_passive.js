// Passive logic for Monster Apple's Monstrous Curse

class MonsterApplePassive {
    constructor(character) {
        this.character = character;
        this.passiveId = 'monster_apple_curse';
        this.passiveName = 'Monstrous Curse';
    }

    /**
     * Triggered when the character holding this passive dies.
     * Applies a permanent 35% damage reduction debuff to all enemies.
     * @param {Character} dyingCharacter - The character that died.
     * @param {GameManager} gameManager - The game manager instance.
     */
    onDeath(dyingCharacter, gameManager) {
        const log = gameManager.addLogEntry.bind(gameManager);
        const opponents = gameManager.getOpponents(dyingCharacter);

        log(`${dyingCharacter.name}'s ${this.passiveName} triggers upon death!`, 'passive');

        // Apply curse VFX to the dying character
        this.applyCurseVFX(dyingCharacter);

        opponents.forEach(opponent => {
            if (!opponent.isDead()) {
                log(`${opponent.name} is cursed, permanently losing 35% Physical and Magical Damage!`, 'debuff');
                
                // Add a slight delay before applying VFX to each target for a cascading effect
                setTimeout(() => {
                    this.applyTargetCurseVFX(opponent);
                }, 300 + Math.random() * 400); // Random delay between 300-700ms
                
                // Apply permanent reduction (using a permanent debuff)
                const debuff = {
                    id: 'monster_curse_debuff',
                    name: 'Monstrous Curse (Permanent)',
                    description: 'Permanently deals 35% less Physical and Magical Damage.',
                    icon: 'Icons/passives/monster_apple_curse.png', // Use passive icon or a dedicated debuff icon
                    duration: Infinity, // Permanent
                    isPermanent: true, // Custom flag
                    applyStats: (stats) => {
                        // Multiply base damage stats
                        const newPhysical = Math.max(1, Math.floor(stats.physicalDamage * 0.65));
                        const newMagical = Math.max(1, Math.floor(stats.magicalDamage * 0.65));
                        console.log(`Applying Monster Curse to ${opponent.name}: Phys ${stats.physicalDamage}->${newPhysical}, Mag ${stats.magicalDamage}->${newMagical}`);
                        stats.physicalDamage = newPhysical;
                        stats.magicalDamage = newMagical;
                        return stats;
                    },
                    onApply: function(character) {
                        // No immediate effect needed other than stat change
                    },
                    remove: function(character) {
                        // This should ideally not be called for permanent effects
                        console.warn("Attempted to remove permanent Monster Curse debuff");
                    }
                };

                opponent.addDebuff(debuff); 
                // Character's recalculateStats() should be called after adding/removing buffs/debuffs
                // Let's assume addDebuff handles this or the game loop does.
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(opponent);
                }
            }
        });
    }

    /**
     * Apply main curse VFX to the character that died
     * @param {Character} character - The character to apply VFX to
     */
    applyCurseVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'monster-curse-vfx';
        character.domElement.appendChild(vfxElement);

        // Create the circle of magical symbols
        const symbolsElement = document.createElement('div');
        symbolsElement.className = 'monster-curse-symbols';
        vfxElement.appendChild(symbolsElement);

        // Add mystical symbols that float outward
        const symbols = ['♱', '⛧', '⛥', '⍟', '⎈', '⏣', '⏥', '☠', '⚉', '⚇', '⚈'];
        for (let i = 0; i < 8; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'monster-curse-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            
            // Random position and animation path
            const randomAngle = (i * 45) + (Math.random() * 30 - 15); // Distribute around circle
            const distance = 100 + Math.random() * 80;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            const rotation = -180 + Math.random() * 360;
            
            symbol.style.setProperty('--end-x', `${endX}px`);
            symbol.style.setProperty('--end-y', `${endY}px`);
            symbol.style.setProperty('--rotation', `${rotation}deg`);
            
            symbol.style.top = '50%';
            symbol.style.left = '50%';
            symbol.style.transform = 'translate(-50%, -50%)';
            symbol.style.fontSize = `${16 + Math.random() * 10}px`;
            
            symbolsElement.appendChild(symbol);
        }

        // Add dark mist particles
        for (let i = 0; i < 12; i++) {
            const mist = document.createElement('div');
            mist.className = 'monster-dark-mist';
            
            // Random position and animation path
            const randomAngle = Math.random() * 360;
            const distance = 30 + Math.random() * 150;
            const endX = Math.cos(randomAngle * Math.PI / 180) * distance;
            const endY = Math.sin(randomAngle * Math.PI / 180) * distance;
            
            mist.style.setProperty('--end-x', `${endX}px`);
            mist.style.setProperty('--end-y', `${endY}px`);
            
            // Randomize mist appearance
            mist.style.width = `${20 + Math.random() * 30}px`;
            mist.style.height = `${20 + Math.random() * 30}px`;
            
            mist.style.top = '50%';
            mist.style.left = '50%';
            mist.style.transform = 'translate(-50%, -50%)';
            
            vfxElement.appendChild(mist);
        }

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 3100); // Slightly longer than animation duration
    }

    /**
     * Apply curse VFX to characters being cursed
     * @param {Character} character - The character to apply VFX to
     */
    applyTargetCurseVFX(character) {
        if (!character || !character.domElement) return;

        const vfxElement = document.createElement('div');
        vfxElement.className = 'monster-curse-vfx';
        
        // Make the target VFX slightly smaller than the source
        vfxElement.style.transform = 'scale(0.8)';
        character.domElement.appendChild(vfxElement);

        // Create smaller symbol circle for the target
        const symbolsElement = document.createElement('div');
        symbolsElement.className = 'monster-curse-symbols';
        symbolsElement.style.width = '180px';
        symbolsElement.style.height = '180px';
        vfxElement.appendChild(symbolsElement);

        // Remove the VFX element after animation completes
        setTimeout(() => {
            if (vfxElement && vfxElement.parentNode) {
                vfxElement.parentNode.removeChild(vfxElement);
            }
        }, 3100); // Slightly longer than animation duration
    }
}

// Register the passive handler
// Ensure the global factory and its method exist before calling
if (typeof window.PassiveFactory !== 'undefined' && typeof window.PassiveFactory.registerPassive === 'function') { 
    console.log("[Passive Registration] Attempting to register: monster_apple_curse with class:", MonsterApplePassive);
    window.PassiveFactory.registerPassive('monster_apple_curse', MonsterApplePassive);
} else {
    console.warn("PassiveFactory or its registerPassive method not defined/ready, MonsterApplePassive not registered.");
    // Optional: Log the state of PassiveFactory if it exists but lacks the method
    if (typeof window.PassiveFactory !== 'undefined') {
        console.warn("window.PassiveFactory object:", window.PassiveFactory);
        console.warn("typeof window.PassiveFactory.registerPassive:", typeof window.PassiveFactory.registerPassive);
    }
} 