/**
 * Smith Lord Passive: Forge Mastery
 * Gains +5 armor and +5 magical shield for each buff that alive allies have.
 */

class SmithLordPassive {
    constructor() {
        this.passiveId = 'smith_lord_forge_mastery';
        this.passiveName = 'Forge Mastery';
        this.character = null;
        this.currentBuffCount = 0;
        this.currentArmorBonus = 0;
        this.currentMagicalShieldBonus = 0;
        this.eventListeners = [];
        console.log(`[SmithLordPassive] Passive initialized`);
    }

    initialize(character) {
        this.character = character;
        console.log(`[SmithLordPassive] Initializing Forge Mastery for ${character.name}`);
        
        // Set up event listeners for buff changes and character events
        this.setupEventListeners();
        
        // Initial calculation after a short delay to let the game state stabilize
        setTimeout(() => {
            this.updateForgeBonus();
        }, 500);
        
        return true;
    }

    setupEventListeners() {
        if (!this.character) return;

        // Listen for buff applied events (using the exact event name from Character.addBuff)
        const buffAppliedListener = (event) => {
            const { character: buffedCharacter } = event.detail || {};
            if (buffedCharacter && this.isAliveAlly(buffedCharacter)) {
                console.log(`[SmithLordPassive] Ally ${buffedCharacter.name} gained a buff`);
                // Small delay to let the buff be fully processed
                setTimeout(() => this.updateForgeBonus(), 100);
            }
        };

        // Listen for buff removed events (using the exact event name from Character.removeBuff)
        const buffRemovedListener = (event) => {
            const { character: buffedCharacter } = event.detail || {};
            if (buffedCharacter && this.isAliveAlly(buffedCharacter)) {
                console.log(`[SmithLordPassive] Ally ${buffedCharacter.name} lost a buff`);
                // Small delay to let the buff removal be fully processed
                setTimeout(() => this.updateForgeBonus(), 100);
            }
        };

        // Listen for character death events (custom event we'll check for)
        const characterDeathListener = (event) => {
            const deadCharacter = event.detail?.character || event.target;
            if (deadCharacter && this.isAlly(deadCharacter)) {
                console.log(`[SmithLordPassive] Ally ${deadCharacter.name} died, recalculating forge bonus`);
                setTimeout(() => this.updateForgeBonus(), 100);
            }
        };

        // Listen for turn start to recalculate (just in case)
        const turnStartListener = () => {
            setTimeout(() => this.updateForgeBonus(), 200);
        };

        // Add event listeners (using the exact event names from the character system)
        document.addEventListener('BuffApplied', buffAppliedListener);
        document.addEventListener('BuffRemoved', buffRemovedListener);
        document.addEventListener('character:death', characterDeathListener);
        document.addEventListener('turn:start', turnStartListener);

        // Store listeners for cleanup
        this.eventListeners = [
            { event: 'BuffApplied', listener: buffAppliedListener },
            { event: 'BuffRemoved', listener: buffRemovedListener },
            { event: 'character:death', listener: characterDeathListener },
            { event: 'turn:start', listener: turnStartListener }
        ];
    }

    isAlly(character) {
        if (!this.character || !character) return false;
        return this.character.isAI === character.isAI && character.id !== this.character.id;
    }

    isAliveAlly(character) {
        return this.isAlly(character) && !character.isDead();
    }

    countAllyBuffs() {
        if (!this.character) return 0;

        const gameManager = window.gameManager;
        if (!gameManager || !gameManager.gameState) {
            console.warn('[SmithLordPassive] Cannot access game manager');
            return 0;
        }

        // Get all allies (same team, excluding self)
        const allies = this.character.isAI ? 
            gameManager.gameState.aiCharacters : 
            gameManager.gameState.playerCharacters;

        const aliveAllies = allies.filter(ally => 
            ally.id !== this.character.id && !ally.isDead()
        );

        // Count total buffs on alive allies (excluding passive effects)
        let totalBuffs = 0;
        for (const ally of aliveAllies) {
            if (ally.buffs && Array.isArray(ally.buffs)) {
                // Only count buffs that are not passive effects or forge mastery buffs
                const validBuffs = ally.buffs.filter(buff => 
                    !buff.isPassiveEffect && 
                    buff.id !== 'forge_mastery_bonus'
                );
                totalBuffs += validBuffs.length;
                
                if (validBuffs.length > 0) {
                    console.log(`[SmithLordPassive] ${ally.name} has ${validBuffs.length} buffs:`, 
                        validBuffs.map(b => b.name || b.id));
                }
            }
        }

        console.log(`[SmithLordPassive] Found ${totalBuffs} buffs on ${aliveAllies.length} alive allies`);
        return totalBuffs;
    }

    updateForgeBonus() {
        if (!this.character) return;

        const newBuffCount = this.countAllyBuffs();
        
        // Only update if the count has changed
        if (newBuffCount === this.currentBuffCount) {
            return;
        }

        const oldBuffCount = this.currentBuffCount;
        this.currentBuffCount = newBuffCount;

        // Calculate armor and magical shield bonuses (5 per buff)
        const newArmorBonus = newBuffCount * 5;
        const newMagicalShieldBonus = newBuffCount * 5;

        // Remove old forge mastery bonuses if they exist
        this.removeForgeBonus();

        // Apply new forge mastery bonuses if there are any buffs
        if (newBuffCount > 0) {
            this.applyForgeBonus(newArmorBonus, newMagicalShieldBonus);
        }

        // Update our tracking
        this.currentArmorBonus = newArmorBonus;
        this.currentMagicalShieldBonus = newMagicalShieldBonus;

        // Log the change
        if (newBuffCount > oldBuffCount) {
            console.log(`[SmithLordPassive] Forge Mastery strengthened: +${newArmorBonus} armor, +${newMagicalShieldBonus} magical shield (${newBuffCount} ally buffs)`);
        } else if (newBuffCount < oldBuffCount) {
            console.log(`[SmithLordPassive] Forge Mastery weakened: +${newArmorBonus} armor, +${newMagicalShieldBonus} magical shield (${newBuffCount} ally buffs)`);
        }

        // Update UI
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(this.character);
        }

        // Show visual indicator update
        this.updateForgePassiveIndicator();
    }

    applyForgeBonus(armorBonus, magicalShieldBonus) {
        if (!this.character) return;

        // Create a temporary buff for the forge mastery bonus
        const forgeMasteryBuff = new Effect(
            'forge_mastery_bonus',
            'Forge Mastery',
            'Icons/abilities/gear_up.png',
            999, // Permanent duration (will be manually managed)
            null,
            false // Not a debuff
        );

        forgeMasteryBuff.setDescription(`+${armorBonus} armor and +${magicalShieldBonus} magical shield from ally buffs.`);

        // Add stat modifiers
        forgeMasteryBuff.statModifiers = [
            { stat: 'armor', value: armorBonus, operation: 'add' },
            { stat: 'magicalShield', value: magicalShieldBonus, operation: 'add' }
        ];

        // Mark this as a passive effect so it doesn't count toward ally buffs
        forgeMasteryBuff.isPassiveEffect = true;

        // Apply the buff
        this.character.addBuff(forgeMasteryBuff);

        // Add battle log entry (only on strengthening, not initial)
        if (window.gameManager && window.gameManager.addLogEntry && this.currentBuffCount < this.countAllyBuffs()) {
            window.gameManager.addLogEntry(
                `🔨 ${this.character.name}'s Forge Mastery strengthens from ally support (+${armorBonus} armor, +${magicalShieldBonus} magical shield)!`, 
                'passive-trigger forge-mastery'
            );
        }

        // Show VFX for forge mastery activation
        this.showForgeMasteryVFX(armorBonus, magicalShieldBonus);
    }

    removeForgeBonus() {
        if (!this.character) return;

        // Remove any existing forge mastery buff
        this.character.removeBuff('forge_mastery_bonus');
    }

    showForgeMasteryVFX(armorBonus, magicalShieldBonus) {
        const characterElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!characterElement) return;

        // Create forge mastery VFX
        const forgeMasteryEffect = document.createElement('div');
        forgeMasteryEffect.className = 'forge-mastery-vfx';
        characterElement.appendChild(forgeMasteryEffect);

        // Create armor enhancement glow
        const armorGlow = document.createElement('div');
        armorGlow.className = 'forge-mastery-armor-glow';
        forgeMasteryEffect.appendChild(armorGlow);

        // Create floating stat indicators
        const statIndicator = document.createElement('div');
        statIndicator.className = 'forge-mastery-stat-indicator';
        statIndicator.textContent = `+${armorBonus} Armor, +${magicalShieldBonus} Shield`;
        forgeMasteryEffect.appendChild(statIndicator);

        // Create forge sparks
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'forge-mastery-spark';
            spark.style.left = Math.random() * 100 + '%';
            spark.style.top = Math.random() * 100 + '%';
            spark.style.animationDelay = (Math.random() * 0.8) + 's';
            forgeMasteryEffect.appendChild(spark);
        }

        // Remove VFX after animation
        setTimeout(() => forgeMasteryEffect.remove(), 2500);
    }

    updateForgePassiveIndicator() {
        const characterElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!characterElement) return;

        // Find or create passive indicator
        let passiveIndicator = characterElement.querySelector('.forge-mastery-passive-indicator');
        if (!passiveIndicator) {
            const imageContainer = characterElement.querySelector('.image-container');
            if (imageContainer) {
                passiveIndicator = document.createElement('div');
                passiveIndicator.className = 'forge-mastery-passive-indicator';
                passiveIndicator.setAttribute('data-tooltip-html', 'true');
                imageContainer.appendChild(passiveIndicator);
            }
        }

        if (passiveIndicator) {
            // Update indicator content
            if (this.currentBuffCount > 0) {
                passiveIndicator.textContent = `🔨${this.currentBuffCount}`;
                passiveIndicator.classList.add('active');
                
                // Update tooltip
                const description = `Forge Mastery: +${this.currentArmorBonus} armor and +${this.currentMagicalShieldBonus} magical shield from ${this.currentBuffCount} ally buffs.`;
                passiveIndicator.setAttribute('data-passive-description', description);
            } else {
                passiveIndicator.textContent = '🔨';
                passiveIndicator.classList.remove('active');
                passiveIndicator.setAttribute('data-passive-description', 'Forge Mastery: Gains +5 armor and +5 magical shield for each buff that alive allies have.');
            }
        }
    }

    cleanup() {
        console.log(`[SmithLordPassive] Cleaning up event listeners for ${this.character?.name || 'unknown'}`);
        
        // Remove all event listeners
        for (const { event, listener } of this.eventListeners) {
            document.removeEventListener(event, listener);
        }
        this.eventListeners = [];

        // Remove forge bonus
        this.removeForgeBonus();
    }

    // Called when character dies
    onCharacterDeath() {
        this.cleanup();
    }
}

// Auto-initialize when character is created
document.addEventListener('character:created', (event) => {
    const character = event.detail?.character;
    if (character && character.id === 'smith_lord' && character.passive?.id === 'smith_lord_forge_mastery') {
        console.log('[SmithLordPassive] Auto-initializing for Smith Lord');
        
        if (!window.smithLordPassiveInstance) {
            window.smithLordPassiveInstance = new SmithLordPassive();
        }
        
        window.smithLordPassiveInstance.initialize(character);
        character.passiveHandler = window.smithLordPassiveInstance;
    }
});

// Global instance management
if (typeof window !== 'undefined') {
    window.SmithLordPassive = SmithLordPassive;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmithLordPassive;
} 