class TalkingNecromaticTreePassive {
    constructor(character) {
        this.character = character;
        this.id = 'forest_corruption';
        this.name = 'Forest Corruption';
        this.description = 'Takes 2.5x damage from Schoolboy Shoma\'s Fire Ball. Healed by Water Ball and Grass Ball.';
        this.initialize();
    }

    initialize() {
        console.log(`[TalkingNecromaticTreePassive] Initializing passive for ${this.character.name}`);
        
        // Hook into the character's applyDamage method to intercept damage
        this.hookIntoDamageSystem();
        
        // Hook into the character's heal method to intercept healing
        this.hookIntoHealSystem();
        
        // Add passive indicator to character
        this.addPassiveIndicator();
        
        console.log(`[TalkingNecromaticTreePassive] Passive initialized successfully for ${this.character.name}`);
    }

    hookIntoDamageSystem() {
        // Store the original applyDamage method
        const originalApplyDamage = this.character.applyDamage.bind(this.character);
        
        // Override the applyDamage method
        this.character.applyDamage = (amount, type, caster = null, options = {}) => {
            console.log(`[TalkingNecromaticTreePassive] Damage intercepted: ${amount} ${type} damage from ${caster?.name || 'unknown'}, abilityId: ${options.abilityId}`);
            
            // Check if this is already being processed by the passive to prevent infinite loops
            if (options.isPassiveProcessed) {
                console.log(`[TalkingNecromaticTreePassive] Already processed by passive, proceeding normally`);
                return originalApplyDamage(amount, type, caster, options);
            }
            
            // Check if this is Schoolboy Shoma's Fire Ball
            if (caster && caster.id === 'schoolboy_shoma' && options.abilityId === 'ball_throw_fire') {
                console.log(`[TalkingNecromaticTreePassive] Fire Ball detected! Applying 2.5x damage multiplier`);
                
                // Apply 2.5x damage multiplier
                const multipliedDamage = Math.floor(amount * 2.5);
                
                // Show fire vulnerability VFX
                this.showFireVulnerabilityVFX(multipliedDamage);
                
                // Log the damage amplification
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🔥 The Talking Necromatic Tree is vulnerable to fire! Takes ${multipliedDamage} damage (2.5x multiplier)!`, 'passive-effect');
                }
                
                // Call the original applyDamage with multiplied damage and flag to prevent loops
                return originalApplyDamage(multipliedDamage, type, caster, { ...options, isPassiveProcessed: true });
            }
            
            // Check if this is Schoolboy Shoma's Water Ball - convert damage to healing
            if (caster && caster.id === 'schoolboy_shoma' && options.abilityId === 'ball_throw_water') {
                console.log(`[TalkingNecromaticTreePassive] Water Ball detected! Converting damage to healing`);
                
                // Show nourishment VFX
                this.showNourishmentVFX('Water Ball');
                
                // Log the special healing
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🌿 The Talking Necromatic Tree is nourished by the Water Ball! +2000 HP!`, 'passive-effect');
                }
                
                // Instead of applying damage, apply healing
                return this.character.heal(2000, caster, { ...options, isPassiveHealing: true });
            }
            
            // Check if this is Schoolboy Shoma's Grass Ball - allow normal healing
            if (caster && caster.id === 'schoolboy_shoma' && options.abilityId === 'ball_throw_grass') {
                console.log(`[TalkingNecromaticTreePassive] Grass Ball detected! Allowing normal healing`);
                // Allow normal healing for Grass Ball
                return originalApplyDamage(amount, type, caster, options);
            }
            
            // Check if this is Schoolboy Shoma's Heavy Ball - allow normal damage
            if (caster && caster.id === 'schoolboy_shoma' && options.abilityId === 'ball_throw_heavy') {
                console.log(`[TalkingNecromaticTreePassive] Heavy Ball detected! Allowing normal damage`);
                // Allow normal damage for Heavy Ball
                return originalApplyDamage(amount, type, caster, options);
            }
            
            // For all other abilities from any character, block the damage
            if (caster && caster.id !== 'schoolboy_shoma') {
                console.log(`[TalkingNecromaticTreePassive] Blocking damage from ${caster.name}'s ability: ${options.abilityId}`);
                
                // Show spell immunity VFX
                this.showSpellImmunityVFX(caster.name);
                
                // Log the spell immunity
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🛡️ The Talking Necromatic Tree is immune to ${caster.name}'s ability!`, 'passive-effect');
                }
                
                // Return zero damage (ability blocked)
                return { damage: 0, isCritical: false, isDodged: false };
            }
            
            // For abilities from Schoolboy Shoma that aren't ball abilities, block them too
            if (caster && caster.id === 'schoolboy_shoma' && !options.abilityId?.startsWith('ball_throw_')) {
                console.log(`[TalkingNecromaticTreePassive] Blocking non-ball ability from Schoolboy Shoma: ${options.abilityId}`);
                
                // Show spell immunity VFX
                this.showSpellImmunityVFX(caster.name);
                
                // Log the spell immunity
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🛡️ The Talking Necromatic Tree is immune to ${caster.name}'s ${options.abilityId} ability!`, 'passive-effect');
                }
                
                // Return zero damage (ability blocked)
                return { damage: 0, isCritical: false, isDodged: false };
            }
            
            // For all other damage, proceed normally
            return originalApplyDamage(amount, type, caster, options);
        };
    }

    hookIntoHealSystem() {
        // Store the original heal method
        const originalHeal = this.character.heal.bind(this.character);
        
        // Override the heal method
        this.character.heal = (amount, caster = null, options = {}) => {
            console.log(`[TalkingNecromaticTreePassive] Heal intercepted: ${amount} healing from ${caster?.name || 'unknown'}, abilityId: ${options.abilityId}`);
            
            // Check if this is Schoolboy Shoma's Grass Ball
            if (caster && caster.id === 'schoolboy_shoma' && options.abilityId === 'ball_throw_grass') {
                console.log(`[TalkingNecromaticTreePassive] Grass Ball detected! Applying 2000 healing`);
                
                // Show nourishment VFX
                this.showNourishmentVFX('Grass Ball');
                
                // Log the special healing
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🌿 The Talking Necromatic Tree is nourished by the Grass Ball! +2000 HP!`, 'passive-effect');
                }
                
                // Call the original heal with 2000 healing
                return originalHeal(2000, caster, options);
            }
            
            // For all other healing, proceed normally
            return originalHeal(amount, caster, options);
        };
    }

    showFireVulnerabilityVFX(damageAmount) {
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        
        if (charElement) {
            // Add fire vulnerability animation class
            charElement.classList.add('talking-necromatic-tree-fire-vulnerability');
            
            // Create damage multiplier text
            const damageText = document.createElement('div');
            damageText.className = 'fire-vulnerability-text';
            damageText.textContent = `2.5x DMG!`;
            charElement.appendChild(damageText);
            
            // Remove classes and elements after animation
            setTimeout(() => {
                charElement.classList.remove('talking-necromatic-tree-fire-vulnerability');
                if (damageText.parentNode) {
                    damageText.parentNode.removeChild(damageText);
                }
            }, 1000);
        }
    }

    showNourishmentVFX(ballType) {
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        
        if (charElement) {
            // Add nourishment animation class
            charElement.classList.add('talking-necromatic-tree-nourishment');
            
            // Create nourishment text
            const nourishmentText = document.createElement('div');
            nourishmentText.className = 'nourishment-heal-text';
            nourishmentText.textContent = `+2000 HP!`;
            charElement.appendChild(nourishmentText);
            
            // Remove classes and elements after animation
            setTimeout(() => {
                charElement.classList.remove('talking-necromatic-tree-nourishment');
                if (nourishmentText.parentNode) {
                    nourishmentText.parentNode.removeChild(nourishmentText);
                }
            }, 1500);
        }
    }

    showSpellImmunityVFX(casterName) {
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        
        if (charElement) {
            // Add spell immunity animation class
            charElement.classList.add('talking-necromatic-tree-spell-immunity');
            
            // Create spell immunity text
            const immunityText = document.createElement('div');
            immunityText.className = 'spell-immunity-text';
            immunityText.textContent = `IMMUNE!`;
            charElement.appendChild(immunityText);
            
            // Remove classes and elements after animation
            setTimeout(() => {
                charElement.classList.remove('talking-necromatic-tree-spell-immunity');
                if (immunityText.parentNode) {
                    immunityText.parentNode.removeChild(immunityText);
                }
            }, 1000);
        }
    }

    addPassiveIndicator() {
        const elementId = this.character.instanceId || this.character.id;
        const charElement = document.getElementById(`character-${elementId}`);
        
        if (charElement) {
            // Add passive indicator class
            charElement.classList.add('talking-necromatic-tree-passive-active');
        }
    }

    // Method to check if the passive is working correctly
    checkPassiveStatus() {
        console.log(`[TalkingNecromaticTreePassive] Passive status check for ${this.character.name}:`);
        console.log(`- Fire Ball vulnerability: Active (2.5x damage)`);
        console.log(`- Water Ball healing: Active (+2000 HP)`);
        console.log(`- Grass Ball healing: Active (+2000 HP)`);
    }
}

// Make the class globally available
window.TalkingNecromaticTreePassive = TalkingNecromaticTreePassive; 