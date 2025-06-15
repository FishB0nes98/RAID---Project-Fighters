// Hotshot Diabla Passive: Trickshot
// Whenever you deal damage, you have 24% chance to fire a bullet that deals 100% Physical damage to a random enemy. This ignores armor.

class HotshotDiablaPassive {
    constructor() {
        this.passiveId = 'hotshot_diabla_trickshot';
        this.passiveName = 'Trickshot';
        this.character = null;
        this.triggerChance = 0.24; // 24% chance
        this.lastTriggerTime = 0; // Prevent multiple triggers in quick succession
        this.cooldownTime = 100; // 100ms cooldown between triggers
        this.trickshotTriggers = 0; // Track number of triggers
        this.trickshotDamage = 0; // Track total damage dealt
        console.log('[HotshotDiablaPassive] Passive initialized');
    }

    initialize(character) {
        this.character = character;
        console.log(`[HotshotDiablaPassive] Initialize for ${character.name}`);
        
        // Listen for damage dealt events
        this._boundOnDamageDealt = this.onDamageDealt.bind(this);
        document.addEventListener('damageDealt', this._boundOnDamageDealt);
        
        // Store passive instance globally for cleanup
        if (!window.hotshotPassiveInstances) {
            window.hotshotPassiveInstances = {};
        }
        window.hotshotPassiveInstances[character.instanceId || character.id] = this;
        
        console.log(`[HotshotDiablaPassive] Passive initialized for ${character.name}`);
        
        // Add passive indicator
        setTimeout(() => {
            this.createPassiveIndicator();
        }, 1000); // Delay to ensure character UI is rendered
    }

    /**
     * Called when character deals damage
     */
    onDamageDealt(event) {
        if (!event.detail) return;
        
        const { source: caster, target, amount: damage } = event.detail;
        
        // Check if this is our character dealing damage
        if (caster !== this.character || damage <= 0 || !target) {
            return;
        }
        
        // Prevent rapid successive triggers
        const now = Date.now();
        if (now - this.lastTriggerTime < this.cooldownTime) {
            return;
        }
        
        // Check if passive triggers (24% chance)
        if (Math.random() >= this.triggerChance) {
            return;
        }
        
        this.lastTriggerTime = now;
        
        // Track passive trigger
        this.trickshotTriggers++;
        
        // Update character tracking for UI display
        if (caster) {
            caster.trickshotTriggers = this.trickshotTriggers;
            // Update counter in UI
            this.updatePassiveCounter();
        }
        
        console.log(`[HotshotDiablaPassive] Trickshot triggered from ${caster.name} dealing ${damage} damage to ${target.name} (Total triggers: ${this.trickshotTriggers})`);
        
        // Execute trickshot
        this.executeTrickshot(caster);
    }

    /**
     * Execute the trickshot effect
     */
    executeTrickshot(caster) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        const gameManager = window.gameManager;
        
        if (!gameManager) {
            console.error('[HotshotDiablaPassive] GameManager not found');
            return;
        }
        
        // Get all enemy characters
        const enemies = gameManager.getOpponents(caster);
        const aliveEnemies = enemies.filter(enemy => enemy && !enemy.isDead());
        
        if (aliveEnemies.length === 0) {
            console.log(`[HotshotDiablaPassive] No alive enemies found for Trickshot`);
            return;
        }
        
        // Select random enemy
        const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
        const targetEnemy = aliveEnemies[randomIndex];
        
        // Calculate damage (100% Physical Damage)
        const trickshotDamage = caster.stats.physicalDamage || 0;
        
        log(`${caster.name}'s Trickshot targets ${targetEnemy.name}!`, 'passive');
        
        // Show VFX first
        this.showTrickshotVFX(caster, targetEnemy);
        
        // Add character glow effect
        this.addCharacterGlow(caster);
        
        // Apply damage after VFX delay (ignores armor)
        setTimeout(() => {
            if (!targetEnemy.isDead()) {
                const damageResult = targetEnemy.applyDamage(trickshotDamage, 'physical', caster, { 
                    bypassArmor: true,
                    isTrickshot: true,
                    abilityId: 'trickshot_passive' // Add ability ID for statistics tracking
                });
                
                // Track damage dealt by passive
                this.trickshotDamage += damageResult.damage;
                if (caster) {
                    caster.trickshotDamage = this.trickshotDamage;
                }
                
                // Record passive statistics
                if (window.statisticsManager) {
                    // Record as a passive ability usage
                    window.statisticsManager.recordAbilityUsage(caster, 'trickshot_passive', 'use', 1, false);
                    window.statisticsManager.recordAbilityUsage(caster, 'trickshot_passive', 'damage', damageResult.damage, damageResult.isCritical);
                    
                    // Also record in turn events for detailed tracking
                    window.statisticsManager.recordTurnEvent({
                        type: 'passive_trigger',
                        caster: caster.name,
                        casterId: caster.instanceId || caster.id,
                        target: targetEnemy.name,
                        targetId: targetEnemy.instanceId || targetEnemy.id,
                        passiveName: 'Trickshot',
                        passiveId: 'trickshot_passive',
                        damage: damageResult.damage,
                        isCritical: damageResult.isCritical,
                        turn: window.statisticsManager.currentTurn || 0
                    });
                }
                
                log(`${targetEnemy.name} takes ${damageResult.damage} physical damage from Trickshot (ignores armor)!`, damageResult.isCritical ? 'critical' : 'passive');
                
                // Apply lifesteal if caster has it
                if (caster.stats.lifesteal > 0) {
                    caster.applyLifesteal(damageResult.damage);
                }
                
                // Update UI
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(targetEnemy);
                    updateCharacterUI(caster);
                }
            }
        }, 500); // Delay for VFX
        
        // Play trickshot sound
        playSound('sounds/bullet_fire.mp3', 0.8);
    }

    /**
     * Show Trickshot VFX
     */
    showTrickshotVFX(caster, target) {
        try {
            const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
            
            if (!casterElement || !targetElement) return;
            
            // Create muzzle flash on caster
            const muzzleFlash = document.createElement('div');
            muzzleFlash.className = 'trickshot-muzzle-flash';
            casterElement.appendChild(muzzleFlash);
            
            // Calculate trajectory for bullet trail
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            const deltaX = targetRect.left - casterRect.left;
            const deltaY = targetRect.top - casterRect.top;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            // Create bullet trail
            const bulletTrail = document.createElement('div');
            bulletTrail.className = 'trickshot-bullet-trail';
            bulletTrail.style.width = `${distance}px`;
            bulletTrail.style.transform = `rotate(${angle}deg)`;
            bulletTrail.style.transformOrigin = 'left center';
            casterElement.appendChild(bulletTrail);
            
            // Create impact effect on target after delay
            setTimeout(() => {
                const impact = document.createElement('div');
                impact.className = 'trickshot-impact';
                targetElement.appendChild(impact);
                
                // Cleanup impact after animation
                setTimeout(() => {
                    if (impact.parentNode) impact.remove();
                }, 800);
            }, 400);
            
            // Cleanup muzzle flash and trail
            setTimeout(() => {
                if (muzzleFlash.parentNode) muzzleFlash.remove();
                if (bulletTrail.parentNode) bulletTrail.remove();
            }, 600);
            
        } catch (error) {
            console.error('[HotshotDiablaPassive] Error creating Trickshot VFX:', error);
        }
    }

    /**
     * Add character glow when Trickshot triggers
     */
    addCharacterGlow(character) {
        try {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (characterElement) {
                characterElement.classList.add('trickshot-active');
                
                // Remove glow after animation
                setTimeout(() => {
                    characterElement.classList.remove('trickshot-active');
                }, 800);
            }
        } catch (error) {
            console.error('[HotshotDiablaPassive] Error adding character glow:', error);
        }
    }

    /**
     * Create passive indicator
     */
    createPassiveIndicator() {
        try {
            const characterElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
            if (characterElement) {
                // Remove existing indicator if any
                const existingIndicator = characterElement.querySelector('.trickshot-passive-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                // Create new indicator
                const indicator = document.createElement('div');
                indicator.className = 'trickshot-passive-indicator';
                indicator.title = 'Trickshot: 24% chance to fire bullet on damage dealt';
                indicator.innerHTML = '🎯';
                
                // Add trigger counter
                const counter = document.createElement('div');
                counter.className = 'trickshot-counter';
                counter.textContent = '0';
                indicator.appendChild(counter);
                
                characterElement.appendChild(indicator);
                
                console.log(`[HotshotDiablaPassive] Created passive indicator for ${this.character.name}`);
            }
        } catch (error) {
            console.error('[HotshotDiablaPassive] Error creating passive indicator:', error);
        }
    }

    /**
     * Update passive counter in UI
     */
    updatePassiveCounter() {
        try {
            const characterElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
            if (characterElement) {
                const counter = characterElement.querySelector('.trickshot-counter');
                if (counter) {
                    counter.textContent = this.trickshotTriggers.toString();
                    counter.title = `Trickshot triggered ${this.trickshotTriggers} times\nTotal damage: ${this.trickshotDamage}`;
                    // Trigger update animation
                    counter.style.animation = 'none';
                    setTimeout(() => {
                        counter.style.animation = 'trickshotCounterUpdate 0.3s ease-out';
                    }, 10);
                }
            }
        } catch (error) {
            console.error('[HotshotDiablaPassive] Error updating passive counter:', error);
        }
    }

    /**
     * Cleanup when character is removed
     */
    cleanup() {
        if (this._boundOnDamageDealt) {
            document.removeEventListener('damageDealt', this._boundOnDamageDealt);
        }
        
        if (window.hotshotPassiveInstances && this.character) {
            delete window.hotshotPassiveInstances[this.character.instanceId || this.character.id];
        }
        
        console.log(`[HotshotDiablaPassive] Cleaned up passive for ${this.character?.name || 'unknown'}`);
    }
}

// Register the passive globally
window.HotshotDiablaPassive = HotshotDiablaPassive;

// Register with PassiveFactory if available
if (window.PassiveFactory) {
    window.PassiveFactory.registerPassive('hotshot_diabla_trickshot', HotshotDiablaPassive);
    console.log('[HotshotDiablaPassive] Registered with PassiveFactory');
} else {
    console.warn('[HotshotDiablaPassive] PassiveFactory not found');
} 