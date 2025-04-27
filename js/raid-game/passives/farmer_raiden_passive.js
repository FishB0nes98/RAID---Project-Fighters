// Passive definition for Farmer Raiden: Zap

class FarmerRaidenPassive {
    constructor() {
        this.zapDamageMultiplier = 1.0; // 100% magical damage
        this.totalZapsDone = 0; // Track how many zaps have been triggered
        console.log("FarmerRaidenPassive constructor called");
    }

    // Called when Raiden uses any ability
    onAbilityUsed(caster) {
        console.log(`FarmerRaidenPassive.onAbilityUsed called for ${caster ? caster.name : 'unknown'}`);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        const gameState = window.gameManager ? window.gameManager.gameState : null;

        if (!gameState) {
            console.error("Zap passive error: Cannot access game state!");
            return;
        }

        // Get all enemy characters
        const enemies = gameState.aiCharacters || [];
        if (!enemies || enemies.length === 0) {
            log(`${caster.name}'s Zap passive has no targets!`, 'passive');
            return;
        }

        // Filter out dead enemies
        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
        if (aliveEnemies.length === 0) {
            log(`${caster.name}'s Zap passive has no living targets!`, 'passive');
            return;
        }

        // Select a random enemy
        const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
        const targetEnemy = aliveEnemies[randomIndex];

        // Calculate zap damage (bypassing magical shield)
        const zapDamage = Math.floor((caster.stats.magicalDamage || 0) * this.zapDamageMultiplier);

        // Log the passive trigger
        log(`${caster.name}'s Zap passive triggers, targeting ${targetEnemy.name}!`, 'passive');
        
        // Play zap sound
        playSound('sounds/lightning_zap.mp3', 0.6);

        // Apply zap damage
        // Custom function to bypass magical shield
        this.applyZapDamage(caster, targetEnemy, zapDamage);
        
        // Increment zap counter
        this.totalZapsDone++;
        // Store on character for UI display
        caster.zapCounter = this.totalZapsDone;

        // Show VFX
        this.showZapVFX(caster, targetEnemy);
    }

    // Custom damage application that bypasses magical shield
    applyZapDamage(caster, target, amount) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Check for dodge
        if (Math.random() < (target.stats.dodgeChance || 0)) {
            log(`${target.name} dodges ${caster.name}'s Zap!`, 'system');
            // Show dodge VFX if available
            if (typeof target.showDodgeVFX === 'function') {
                target.showDodgeVFX();
            }
            return { damage: 0, isDodged: true };
        }

        // Calculate damage (bypassing magical shield)
        let finalDamage = amount;
        
        // Check for critical hit
        const isCritical = Math.random() < (caster.stats.critChance || 0);
        if (isCritical) {
            finalDamage = Math.floor(finalDamage * (caster.stats.critDamage || 1.5));
            log(`${caster.name}'s Zap critically strikes ${target.name}!`, 'critical');
        }

        // Log the damage attempt (applyDamage will log the final result)
        log(`${caster.name}'s Zap targets ${target.name} for ${finalDamage} magical damage (ignoring shield)${isCritical ? ' (Critical)' : ''}!`, isCritical ? 'critical' : 'passive');

        // --- REPLACED Direct HP modification with applyDamage --- 
        // target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
        const damageResult = target.applyDamage(finalDamage, 'magical', caster, { bypassMagicalShield: true });

        // --- REMOVED redundant logging, death check, and UI update (handled by applyDamage) ---
        // log(`${target.name} takes ${finalDamage} magical damage from Zap (ignoring magical shield)${isCritical ? ' (Critical)' : ''}!`, isCritical ? 'critical' : 'system');
        // if (target.stats.hp <= 0) {
        //     log(`${target.name} is defeated!`, 'system');
        //     target.onDeath();
        // }
        // if (typeof updateCharacterUI === 'function') {
        //     updateCharacterUI(target);
        // }

        // Return the result from applyDamage, which includes actual damage dealt
        return { damage: damageResult.damage, isCritical: isCritical, dodged: false }; // Pass crit status
    }

    // Visual effects for Zap passive
    showZapVFX(caster, target) {
        const casterElementId = caster.instanceId || caster.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);

        if (!casterElement || !targetElement) return;

        // Create lightning bolt effect
        const zapEffect = document.createElement('div');
        zapEffect.className = 'raiden-zap-effect';
        document.body.appendChild(zapEffect);

        // Get positions
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // Set origin and destination points
        const startX = casterRect.left + casterRect.width/2;
        const startY = casterRect.top + casterRect.height/2;
        const endX = targetRect.left + targetRect.width/2;
        const endY = targetRect.top + targetRect.height/2;

        // Calculate angle for rotation
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Position and size the lightning bolt
        zapEffect.style.left = `${startX}px`;
        zapEffect.style.top = `${startY}px`;
        zapEffect.style.width = `${distance}px`;
        zapEffect.style.transform = `rotate(${angle}deg)`;
        zapEffect.style.transformOrigin = '0 50%';

        // Make lightning visible
        setTimeout(() => {
            zapEffect.classList.add('active');
        }, 50);

        // Add impact effect on target
        setTimeout(() => {
            // Remove lightning bolt
            zapEffect.remove();
            
            // Create impact on target
            const zapImpact = document.createElement('div');
            zapImpact.className = 'zap-impact-effect';
            targetElement.appendChild(zapImpact);
            
            // Remove impact after animation
            setTimeout(() => zapImpact.remove(), 600);
        }, 200);
    }

    // Called when the character is created
    initialize(character) {
        console.log(`FarmerRaidenPassive initialized for ${character.name}`);
        
        // Initialize tracking stat
        this.totalZapsDone = 0;
        character.zapCounter = 0;
        
        // Add passive indicator to character UI
        this.createPassiveIndicator(character);
        
        // Add debug info
        console.log(`Character passiveHandler:`, character.passiveHandler);
        console.log(`onAbilityUsed function:`, character.passiveHandler.onAbilityUsed);
    }

    // Creates the visual indicator on the character portrait
    createPassiveIndicator(character) {
        const tryCreate = () => {
            const elementId = character.instanceId || character.id;
            const characterElement = document.getElementById(`character-${elementId}`);
            if (characterElement) {
                const imageContainer = characterElement.querySelector('.image-container');
                if (imageContainer && !imageContainer.querySelector('.raiden-passive-indicator')) {
                    const passiveIndicator = document.createElement('div');
                    passiveIndicator.className = 'raiden-passive-indicator';
                    passiveIndicator.title = character.passive.description;
                    
                    imageContainer.appendChild(passiveIndicator);
                    console.log(`Passive indicator added for ${character.name}`);
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryCreate);
        } else {
            tryCreate();
        }
    }
}

// Make the class globally available
window.FarmerRaidenPassive = FarmerRaidenPassive; 