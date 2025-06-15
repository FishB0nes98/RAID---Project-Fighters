// Ability definitions for Schoolgirl Kokoro

// Create a subclass of Character for Schoolgirl Kokoro to implement her passive
class SchoolgirlKokoroCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        this.focusedMindStacks = 0;
        this.mysticBarrierTurnCounter = 0; // Track turns for Mystic Barrier
        
        // Set up GameStart event listener for Mystic Barrier
        this.boundOnGameStart = this.onGameStart.bind(this);
        this.mysticBarrierInitialized = false; // Flag to prevent double application
        document.addEventListener('GameStart', this.boundOnGameStart);
        
        // Create passive visual indicator
        this.createPassiveIndicator();
        
        // Initialize ability descriptions after a short delay to ensure talents are applied
        setTimeout(() => {
            // Set up generateDescription methods first
            if (typeof window.setupKokoroAbilityDescriptionsForCharacter === 'function') {
                window.setupKokoroAbilityDescriptionsForCharacter(this);
            }
            this.updateAbilityDescriptions();
            this.updateFocusedMindIndicator();
        }, 50);
    }
    
    // Update the character element to show Focused Mind indicator if talent is selected
    updateFocusedMindIndicator() {
        if (this.hasTalent && this.hasTalent('focused_mind')) {
            const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
            if (characterElement) {
                characterElement.setAttribute('data-has-focused-mind', 'true');
            }
        }
    }
    
    // Update all ability descriptions based on current talents
    updateAbilityDescriptions() {
        // Update Lesser Heal description
        const lesserHealAbility = this.abilities.find(a => a.id === 'lesser_heal');
        if (lesserHealAbility && typeof lesserHealAbility.generateDescription === 'function') {
            lesserHealAbility.updateCaster(this);
            lesserHealAbility.description = lesserHealAbility.generateDescription();
        }
        
        // Update Silencing Ring description
        const silencingRingAbility = this.abilities.find(a => a.id === 'silencing_ring');
        if (silencingRingAbility && typeof silencingRingAbility.generateDescription === 'function') {
            silencingRingAbility.updateCaster(this);
            silencingRingAbility.description = silencingRingAbility.generateDescription();
        }
        
        // Update Circle Heal description
        const circleHealAbility = this.abilities.find(a => a.id === 'circle_heal');
        if (circleHealAbility && typeof circleHealAbility.generateDescription === 'function') {
            circleHealAbility.updateCaster(this);
            circleHealAbility.description = circleHealAbility.generateDescription();
        }
        
        // Update Protective Aura description
        const protectiveAuraAbility = this.abilities.find(a => a.id === 'protective_aura');
        if (protectiveAuraAbility && typeof protectiveAuraAbility.generateDescription === 'function') {
            protectiveAuraAbility.updateCaster(this);
            protectiveAuraAbility.description = protectiveAuraAbility.generateDescription();
        }
        
        // Update passive description
        if (typeof this.generatePassiveDescription === 'function') {
            this.generatePassiveDescription();
        }
    }
    
    // Generate passive description based on talents
    generatePassiveDescription() {
        let healAmount = 410; // Base amount
        let isEnhanced = false;
        let hasEnergizing = false;
        
        // Check for Enhanced Healing Feedback talent
        if (this.enhancedHealingFeedback) {
            healAmount = 580;
            isEnhanced = true;
        }
        
        // Check for Energizing Feedback talent
        if (this.energizingFeedback) {
            hasEnergizing = true;
        }
        
        // Create colored text for enhanced amounts
        let healText = isEnhanced ? `<span class="kokoro-enhanced-passive">${healAmount}</span>` : healAmount;
        
        // Build description with talent mentions
        let description = `Using an ability restores ${healText}HP back to yourself.`;
        
        if (isEnhanced) {
            description += ` <span class="talent-effect healing">[Enhanced Healing Feedback]</span>`;
        }
        
        if (this.shieldingFeedback) {
            const shieldAmount = Math.floor(this.stats.magicalDamage * 0.25);
            description += ` <span class="talent-effect utility">[Shielding Feedback: ${shieldAmount} shield]</span>`;
        }
        
        if (hasEnergizing) {
            description += ` <span class="talent-effect utility">[Energizing Feedback: 15% chance to also restore 105 mana]</span>`;
        }
        
        // Check for Shield Empowerment talent
        if (this.shieldEmpowerment) {
            const currentShield = this.shield || 0;
            const empowermentBonus = Math.floor(currentShield * 0.25);
            if (currentShield > 0) {
                description += ` <span class="talent-effect empowerment">[Shield Empowerment: +${empowermentBonus} Magical Damage from shield]</span>`;
            } else {
                description += ` <span class="talent-effect empowerment">[Shield Empowerment: Active when shield exists]</span>`;
            }
        }
        
        // Update the passive description
        if (this.passive) {
            this.passive.description = description;
        }
        
        return description;
    }
    
    // Show visual effect when Focused Mind talent triggers critical strikes
    showFocusedMindCritVFX() {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            try {
                // Create focused mind crit effect
                const focusedMindVfx = document.createElement('div');
                focusedMindVfx.className = 'focused-mind-crit-vfx';
                
                // Create floating text
                const critText = document.createElement('div');
                critText.className = 'focused-mind-crit-text';
                critText.textContent = 'Focused Mind!';
                
                // Create mind-focus particle container
                const particleContainer = document.createElement('div');
                particleContainer.className = 'focused-mind-particles';
                
                // Add focused energy particles
                const particleCount = 12;
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'focused-particle';
                    
                    // Randomize particle properties
                    const angle = (i / particleCount) * 360;
                    const delay = Math.random() * 0.3;
                    const distance = 40 + Math.random() * 30;
                    const size = 3 + Math.random() * 4;
                    
                    particle.style.setProperty('--angle', `${angle}deg`);
                    particle.style.setProperty('--delay', `${delay}s`);
                    particle.style.setProperty('--distance', `${distance}px`);
                    particle.style.setProperty('--size', `${size}px`);
                    
                    particleContainer.appendChild(particle);
                }
                
                // Create convergence waves
                for (let i = 0; i < 3; i++) {
                    const wave = document.createElement('div');
                    wave.className = 'focused-mind-wave';
                    wave.style.animationDelay = `${i * 0.15}s`;
                    particleContainer.appendChild(wave);
                }
                
                // Add elements to the DOM
                focusedMindVfx.appendChild(critText);
                focusedMindVfx.appendChild(particleContainer);
                characterElement.appendChild(focusedMindVfx);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (focusedMindVfx.parentNode) focusedMindVfx.remove();
                }, 2000);
            } catch (error) {
                console.error('[Focused Mind Crit VFX] Error:', error);
            }
        }
    }
    
    // Create a visual indicator for the passive
    createPassiveIndicator() {
        console.log("[KOKORO] Creating passive indicator");
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createPassiveIndicatorElement());
        } else {
            this.createPassiveIndicatorElement();
        }
    }
    
    createPassiveIndicatorElement() {
        // Try to find the character element
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        
        if (characterElement) {
            const imageContainer = characterElement.querySelector('.image-container');
            if (imageContainer && !imageContainer.querySelector('.kokoro-passive')) {
                const passiveIndicator = document.createElement('div');
                passiveIndicator.className = 'kokoro-passive';
                
                // Generate dynamic tooltip based on talents
                const passiveDescription = this.generatePassiveDescription();
                // Strip HTML tags for tooltip (tooltips don't support HTML)
                const tooltipDescription = passiveDescription.replace(/<[^>]*>/g, '');
                passiveIndicator.title = `Healing Feedback: ${tooltipDescription}`;
                
                imageContainer.appendChild(passiveIndicator);
                
                // Add CSS for the passive indicator
                if (!document.getElementById('kokoro-styles')) {
                    const styleSheet = document.createElement('style');
                    styleSheet.id = 'kokoro-styles';
                    styleSheet.textContent = `
                        .kokoro-passive {
                            position: absolute;
                            bottom: 5px;
                            right: 5px;
                            width: 20px;
                            height: 20px;
                            background-color: #ff84e8;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
                            z-index: 2;
                        }
                        
                        .kokoro-heal-vfx {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            top: 0;
                            left: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            pointer-events: none;
                            z-index: 5;
                        }
                        
                        .kokoro-heal-vfx span {
                            background-color: rgba(255, 132, 232, 0.8);
                            color: white;
                            padding: 2px 5px;
                            border-radius: 10px;
                            font-weight: bold;
                            font-size: 14px;
                            animation: kokoro-float-up 1.5s forwards;
                            box-shadow: 0 0 5px #ff84e8;
                        }
                        
                        @keyframes kokoro-float-up {
                            0% { transform: translateY(0); opacity: 0; }
                            20% { opacity: 1; }
                            100% { transform: translateY(-40px); opacity: 0; }
                        }
                    `;
                    document.head.appendChild(styleSheet);
                }
            }
        }
    }
    
    // Override the base heal method to prevent default animations for Kokoro
    // but still call the base method for proper statistics tracking
    heal(amount, caster = null, options = {}) {
        // Set option to suppress default VFX but allow base functionality
        const modifiedOptions = { 
            ...options, 
            suppressDefaultVFX: true,
            suppressUIUpdate: options.suppressUIUpdate 
        };
        
        // Call the base heal method which handles all the statistics and events
        const result = super.heal(amount, caster, modifiedOptions);
        
        // Debug: Check if caster has mana infusion talent
        if (caster) {
            console.log(`[Mana Infusion DEBUG] Caster: ${caster.name}, has manaInfusion: ${!!caster.manaInfusion}, heal amount: ${result.healAmount}, isPassive: ${!!options.isPassiveHealing}`);
        }
        
        // Check for Mana Infusion talent - restore mana equal to 10% of heal amount
        if (caster && caster.manaInfusion && result.healAmount > 0 && !options.isPassiveHealing) {
            console.log(`[Mana Infusion] Triggered! Caster: ${caster.name}, Target: ${this.name}, Heal Amount: ${result.healAmount}`);
            const manaRestoreAmount = Math.ceil(result.healAmount * 0.1);
            console.log(`[Mana Infusion] Calculated mana restore: ${manaRestoreAmount}`);
            
            // Get current and max mana - prioritize currentMana property
            const oldMana = this.stats.currentMana !== undefined ? this.stats.currentMana : (this.stats.mana || 0);
            const maxMana = this.stats.maxMana !== undefined ? this.stats.maxMana : (this.stats.mana || 0);
            console.log(`[Mana Infusion] Target: ${this.name}, Current mana: ${oldMana}/${maxMana}`);
            console.log(`[Mana Infusion] Target character stats:`, this.stats);
            
            // Restore mana using the correct property
            let newMana = oldMana;
            if (this.stats.currentMana !== undefined) {
                this.stats.currentMana = Math.min(oldMana + manaRestoreAmount, maxMana);
                newMana = this.stats.currentMana;
            } else if (this.stats.mana !== undefined) {
                this.stats.mana = Math.min(oldMana + manaRestoreAmount, maxMana);
                newMana = this.stats.mana;
            } else {
                console.error(`[Mana Infusion] Could not find mana property on character ${this.name}`);
                console.error(`[Mana Infusion] Available properties:`, Object.keys(this.stats));
                return;
            }
            
            const actualManaRestored = newMana - oldMana;
            
            console.log(`[Mana Infusion] Mana after restoration: ${newMana}/${maxMana}, restored: ${actualManaRestored}`);
            
            if (actualManaRestored > 0) {
                // Log the mana infusion
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`Mana Infusion: ${this.name} gains ${actualManaRestored} mana from healing!`, 'passive');
                
                // Show VFX for mana infusion
                this.showManaInfusionVFX(actualManaRestored);
                
                // Update UI for mana change
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.triggerManaAnimation(this, 'restore', actualManaRestored);
                }
            } else {
                console.log(`[Mana Infusion] No mana restored - already at max or calculation error`);
            }
        }
        
        // Return the result from base method
        return result;
    }
    
    // Override the base useAbility method to implement the passive
    useAbility(abilityIndex, target) {
        // First use the original method to use the ability
        const abilityUsed = super.useAbility(abilityIndex, target);
        
        // If ability was successfully used, apply the passive effect
        if (abilityUsed) {
            this.applyPassiveHealingFeedback();
        }
        
        return abilityUsed;
    }
    
    // Override applyDamage to show Focused Mind VFX on critical strikes
    applyDamage(amount, type, caster = null, options = {}) {
        // Call the parent applyDamage method
        const result = super.applyDamage(amount, type, caster, options);
        
        // Check if this was a critical strike and the caster has Focused Mind talent
        if (result.isCritical && caster && caster.hasTalent && caster.hasTalent('focused_mind')) {
            // Show the Focused Mind VFX
            if (typeof caster.showFocusedMindCritVFX === 'function') {
                caster.showFocusedMindCritVFX();
            }
            
            // Add data attribute for enhanced critical glow
            const characterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (characterElement) {
                characterElement.setAttribute('data-has-focused-mind', 'true');
                characterElement.querySelector('.image-container')?.classList.add('critical-strike');
                
                // Remove the critical strike class after animation
                setTimeout(() => {
                    characterElement.querySelector('.image-container')?.classList.remove('critical-strike');
                }, 500);
            }
        }
        
        return result;
    }
    
    // Apply the passive Healing Feedback
    applyPassiveHealingFeedback() {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Get passive healing amount from passive (check for talent modifications)
        let healAmount = 410; // Base amount
        
        // Check for Enhanced Healing Feedback talent
        if (this.enhancedHealingFeedback) {
            healAmount = 580;
        }
        
        // Apply healing to self with proper tracking (passive healing is considered self-healing)
        const actualHeal = this.heal(healAmount, this, { abilityId: 'healing_feedback', healType: 'passive' });
        
        // Note: Empathic Resonance doesn't trigger on self-healing (passive feedback)
        
        // Check for Energizing Feedback talent
        let manaRestored = 0;
        if (this.energizingFeedback && Math.random() <= 0.15) { // 15% chance
            const manaAmount = 105;
            const oldMana = this.stats.mana;
            this.stats.mana = Math.min(this.stats.mana + manaAmount, this.stats.maxMana);
            manaRestored = this.stats.mana - oldMana;
            
            if (manaRestored > 0) {
                log(`${this.name}'s Energizing Feedback triggers, restoring ${manaRestored} mana!`, 'passive');
                
                // Show VFX for mana restoration
                this.showEnergizingFeedbackVFX(manaRestored);
                
                // Update UI for mana change
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.triggerManaAnimation(this, 'restore', manaRestored);
                }
            }
        }
        
        // Check for Shielding Feedback talent
        let shieldAmount = 0;
        if (this.shieldingFeedback) {
            shieldAmount = Math.floor(this.stats.magicalDamage * 0.25); // 25% of magical damage
            
            if (shieldAmount > 0) {
                // Apply shield to self
                this.applyShield(shieldAmount);
                
                // Show VFX for shield application
                this.showShieldingFeedbackVFX(shieldAmount);
                
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateShieldBar(this);
                }
            }
        }
        
        // Log the passive activation
        let passiveMessage = `${this.name}'s Healing Feedback activates, healing for ${actualHeal.healAmount} HP.`;
        if (manaRestored > 0) {
            passiveMessage += ` Energizing Feedback also restored ${manaRestored} mana!`;
        }
        if (shieldAmount > 0) {
            passiveMessage += ` Shielding Feedback created a ${shieldAmount} HP shield!`;
        }
        log(passiveMessage, 'passive');
        
        // Show visual effect for passive healing
        this.showPassiveHealingVFX(actualHeal.healAmount);
        
        // Update UI
        if (typeof updateCharacterUI === 'function') {
            updateCharacterUI(this);
        }
    }
    
    // Show visual effect for passive healing
    showPassiveHealingVFX(healAmount) {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            // Create healing effect
            const healVfx = document.createElement('div');
            healVfx.className = 'kokoro-heal-vfx';
            healVfx.innerHTML = `<span>+${healAmount} HP</span>`;
            characterElement.appendChild(healVfx);
            
            // Remove VFX after animation
            setTimeout(() => {
                healVfx.remove();
            }, 1500);
        }
    }
    
    // Show visual effect for Energizing Feedback mana restoration
    showEnergizingFeedbackVFX(manaAmount) {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            try {
                // Create energizing feedback effect
                const energizingVfx = document.createElement('div');
                energizingVfx.className = 'energizing-feedback-vfx';
                
                // Create floating mana text
                const manaText = document.createElement('div');
                manaText.className = 'energizing-feedback-text';
                manaText.textContent = `+${manaAmount} MP`;
                
                // Create energy particle container
                const energyContainer = document.createElement('div');
                energyContainer.className = 'energizing-feedback-particles';
                
                // Add energy orbs
                const orbCount = 8;
                for (let i = 0; i < orbCount; i++) {
                    const orb = document.createElement('div');
                    orb.className = 'energy-orb';
                    
                    // Randomize orb properties
                    const angle = (i / orbCount) * 360;
                    const delay = Math.random() * 0.4;
                    const distance = 30 + Math.random() * 25;
                    const size = 4 + Math.random() * 6;
                    
                    orb.style.setProperty('--angle', `${angle}deg`);
                    orb.style.setProperty('--delay', `${delay}s`);
                    orb.style.setProperty('--distance', `${distance}px`);
                    orb.style.setProperty('--size', `${size}px`);
                    
                    energyContainer.appendChild(orb);
                }
                
                // Create energy streams
                for (let i = 0; i < 4; i++) {
                    const stream = document.createElement('div');
                    stream.className = 'energy-stream';
                    stream.style.animationDelay = `${i * 0.1}s`;
                    stream.style.setProperty('--rotation', `${i * 90}deg`);
                    energyContainer.appendChild(stream);
                }
                
                // Add elements to the DOM
                energizingVfx.appendChild(manaText);
                energizingVfx.appendChild(energyContainer);
                characterElement.appendChild(energizingVfx);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (energizingVfx.parentNode) energizingVfx.remove();
                }, 2000);
            } catch (error) {
                console.error('[Energizing Feedback VFX] Error:', error);
            }
        }
    }
    
    // Show visual effect for Mana Infusion talent
    showManaInfusionVFX(manaAmount) {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            try {
                // Create mana infusion effect
                const manaInfusionVfx = document.createElement('div');
                manaInfusionVfx.className = 'mana-infusion-vfx';
                
                // Create floating mana text
                const manaText = document.createElement('div');
                manaText.className = 'mana-infusion-text';
                manaText.textContent = `+${manaAmount} MP`;
                
                // Create energy flow container
                const flowContainer = document.createElement('div');
                flowContainer.className = 'mana-infusion-particles';
                
                // Add energy flow streams
                const streamCount = 6;
                for (let i = 0; i < streamCount; i++) {
                    const stream = document.createElement('div');
                    stream.className = 'mana-flow-stream';
                    
                    // Randomize stream properties
                    const angle = (i / streamCount) * 360;
                    const delay = Math.random() * 0.3;
                    const length = 25 + Math.random() * 15;
                    
                    stream.style.setProperty('--angle', `${angle}deg`);
                    stream.style.setProperty('--delay', `${delay}s`);
                    stream.style.setProperty('--length', `${length}px`);
                    
                    flowContainer.appendChild(stream);
                }
                
                // Create energy motes
                for (let i = 0; i < 8; i++) {
                    const mote = document.createElement('div');
                    mote.className = 'mana-energy-mote';
                    mote.style.animationDelay = `${i * 0.1}s`;
                    mote.style.setProperty('--orbit-angle', `${i * 45}deg`);
                    flowContainer.appendChild(mote);
                }
                
                // Add elements to the DOM
                manaInfusionVfx.appendChild(manaText);
                manaInfusionVfx.appendChild(flowContainer);
                characterElement.appendChild(manaInfusionVfx);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (manaInfusionVfx.parentNode) manaInfusionVfx.remove();
                }, 1800);
            } catch (error) {
                console.error('[Mana Infusion VFX] Error:', error);
            }
        }
    }
    
    // Trigger Cooldown Mastery talent effect
    triggerCooldownMastery() {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Find abilities that are currently on cooldown, excluding Lesser Heal itself
        const abilitiesOnCooldown = this.abilities.filter(ability => 
            ability.currentCooldown > 0 && ability.id !== 'lesser_heal'
        );
        
        if (abilitiesOnCooldown.length === 0) {
            // No abilities on cooldown (excluding Lesser Heal), but still show the talent triggered
            log(`${this.name}'s Cooldown Mastery activates, but no other abilities are on cooldown.`, 'utility');
            this.showCooldownMasteryVFX(null);
            return;
        }
        
        // Select a random ability on cooldown (excluding Lesser Heal)
        const randomAbility = abilitiesOnCooldown[Math.floor(Math.random() * abilitiesOnCooldown.length)];
        
        // Store original cooldown for logging
        const originalCooldown = randomAbility.currentCooldown;
        
        // Use the proper reduceCooldown method
        randomAbility.reduceCooldown();
        
        // Check if reduction actually happened
        const actualReduction = originalCooldown - randomAbility.currentCooldown;
        
        if (actualReduction > 0) {
            log(`${this.name}'s Cooldown Mastery reduces ${randomAbility.name}'s cooldown from ${originalCooldown} to ${randomAbility.currentCooldown}!`, 'utility');
            
            // Show VFX
            this.showCooldownMasteryVFX(randomAbility);
            
            // Update UI if available
            if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(this);
            }
        } else {
            log(`${this.name}'s Cooldown Mastery tried to reduce ${randomAbility.name}'s cooldown but no reduction occurred.`, 'utility');
        }
    }
    
    // Show visual effect for Cooldown Mastery
    showCooldownMasteryVFX(affectedAbility) {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            try {
                // Create cooldown mastery effect
                const cooldownVfx = document.createElement('div');
                cooldownVfx.className = 'cooldown-mastery-vfx';
                
                // Create floating text
                const masteryText = document.createElement('div');
                masteryText.className = 'cooldown-mastery-text';
                masteryText.textContent = affectedAbility ? `${affectedAbility.name} -1 CD!` : 'Cooldown Mastery!';
                
                // Create clock particle container
                const clockContainer = document.createElement('div');
                clockContainer.className = 'cooldown-mastery-particles';
                
                // Add clock/time particles
                const clockCount = 6;
                for (let i = 0; i < clockCount; i++) {
                    const clock = document.createElement('div');
                    clock.className = 'clock-particle';
                    clock.textContent = '⏰';
                    
                    // Randomize clock properties
                    const angle = (i / clockCount) * 360;
                    const delay = Math.random() * 0.3;
                    const distance = 35 + Math.random() * 25;
                    
                    clock.style.setProperty('--angle', `${angle}deg`);
                    clock.style.setProperty('--delay', `${delay}s`);
                    clock.style.setProperty('--distance', `${distance}px`);
                    
                    clockContainer.appendChild(clock);
                }
                
                // Create time waves
                for (let i = 0; i < 3; i++) {
                    const wave = document.createElement('div');
                    wave.className = 'cooldown-mastery-wave';
                    wave.style.animationDelay = `${i * 0.15}s`;
                    clockContainer.appendChild(wave);
                }
                
                // Add elements to the DOM
                cooldownVfx.appendChild(masteryText);
                cooldownVfx.appendChild(clockContainer);
                characterElement.appendChild(cooldownVfx);
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (cooldownVfx.parentNode) cooldownVfx.remove();
                }, 2500);
            } catch (error) {
                console.error('[Cooldown Mastery VFX] Error:', error);
            }
        }
    }
    
    // Check for Empathic Resonance talent trigger when healing allies
    checkEmpathicResonance(target, caster) {
        // Only trigger if caster has the talent and target is an ally (not self)
        if (!caster.empathicResonance || target === caster) {
            return;
        }
        
        // Check if target is actually an ally (same team)
        const isAlly = target.isAI === caster.isAI;
        if (!isAlly) {
            return;
        }
        
        // 20% chance to trigger
        if (Math.random() > 0.2) {
            return;
        }
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Create or refresh the Empathic Resonance buff
        const buffId = 'empathic_resonance';
        const existingBuff = caster.buffs.find(b => b.id === buffId);
        
        if (existingBuff) {
            // Refresh duration and increase stacks
            existingBuff.duration = 2;
            existingBuff.stacks = (existingBuff.stacks || 1) + 1;
            existingBuff.setDescription(`+${existingBuff.stacks * 3}% Healing Power (${existingBuff.stacks} stacks)`);
            
            log(`${caster.name}'s Empathic Resonance grows stronger! (${existingBuff.stacks} stacks)`, 'buff');
        } else {
            // Create new buff
            const buff = new Effect(
                buffId,
                'Empathic Resonance',
                'Icons/talents/empathic_resonance.webp',
                2, // Duration
                null, // No per-turn effect needed
                false // isDebuff
            );
            
            buff.stacks = 1;
            buff.setDescription('+3% Healing Power (1 stack)');
            
            // Define stat modifiers for the buff
            buff.statModifiers = [
                { stat: 'healingPower', value: 0.03, operation: 'add' } // +3% healing power per stack
            ];
            
            buff.onApply = function(character) {
                log(`${character.name} gained Empathic Resonance! (+3% Healing Power)`, 'buff');
                showEmpathicResonanceVFX(character);
            };
            
            buff.remove = function(character) {
                log(`Empathic Resonance effect removed from ${character.name}.`, 'status');
            };
            
            // Override recalculation to handle stacking
            const originalRecalc = buff.applyStatModifiers;
            buff.applyStatModifiers = function(character) {
                if (this.statModifiers && this.stacks) {
                    this.statModifiers.forEach(modifier => {
                        const stackedValue = modifier.value * this.stacks;
                        if (modifier.operation === 'add') {
                            character.stats[modifier.stat] += stackedValue;
                        } else if (modifier.operation === 'multiply') {
                            character.stats[modifier.stat] *= (1 + stackedValue);
                        }
                    });
                }
            };
            
            caster.addBuff(buff);
        }
        
        // Show VFX for the resonance trigger
        showEmpathicResonanceVFX(caster, existingBuff ? existingBuff.stacks : 1);
        
        // Recalculate stats to apply the new/updated buff
        caster.recalculateStats('empathic_resonance');
    }

    // Handle GameStart event for initial talent effects
    onGameStart(event) {
        console.log(`[Kokoro] GameStart event received for ${this.name}`);
        
        // Apply Mystic Barrier shield at game start (only once)
        if (this.hasTalent && this.hasTalent('mystic_barrier') && !this.mysticBarrierInitialized) {
            console.log('[Kokoro] Mystic Barrier talent detected, applying initial shield...');
            this.mysticBarrierInitialized = true;
            
            // Add small delay to ensure mana is properly initialized
            setTimeout(() => {
                this.applyMysticBarrierShield();
                
                // Check Shield Empowerment after Mystic Barrier creates shield
                if (this.hasTalent && this.hasTalent('shield_empowerment')) {
                    setTimeout(() => {
                        this.applyShieldEmpowerment();
                    }, 100);
                }
            }, 500);
        } else if (this.hasTalent && this.hasTalent('shield_empowerment')) {
            // Apply Shield Empowerment at game start if there's already a shield
            setTimeout(() => {
                this.applyShieldEmpowerment();
            }, 600);
        }
    }

    // Cleanup method to remove event listeners
    destroy() {
        if (this.boundOnGameStart) {
            document.removeEventListener('GameStart', this.boundOnGameStart);
        }
        
        // Reset flags
        this.mysticBarrierInitialized = false;
        
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
    }

    // Method to apply Mystic Barrier shield
    applyMysticBarrierShield() {
        if (!this.hasTalent || !this.hasTalent('mystic_barrier')) return;

        // Use the correct mana property based on our testing
        const currentMana = this.stats?.currentMana || this.stats?.maxMana || 0;
        
        if (currentMana <= 0) {
            console.warn(`[Kokoro] No mana available for Mystic Barrier (mana: ${currentMana})`);
            return;
        }
        
        const shieldAmount = Math.ceil(currentMana * 0.25);
        this.shield = (this.shield || 0) + shieldAmount;
        this.updateShieldDisplay();
        
        // Force UI update to show shield bar immediately
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(this);
            window.gameManager.uiManager.triggerShieldAnimation(this, 'gain');
        }
        
        // Show VFX
        this.showMysticBarrierVFX(shieldAmount);
        
        // Log the shield gain
        if (window.gameManager) {
            window.gameManager.addLogEntry(
                `✨ ${this.name} gains ${shieldAmount} shield from Mystic Barrier! (25% of ${currentMana} mana)`, 
                'system mystic-barrier'
            );
        }
    }

    // Override processEffects to handle Mystic Barrier turn tracking and Shield Empowerment
    processEffects(shouldReduceDuration = false, shouldRegenerateResources = true) {
        super.processEffects(shouldReduceDuration, shouldRegenerateResources);
        
        // Handle Mystic Barrier turn counter - only increment on actual turn start
        // We only want to count turns when it's the start of the player's turn with regeneration
        if (this.hasTalent && this.hasTalent('mystic_barrier') && 
            !shouldReduceDuration && shouldRegenerateResources && 
            !this.isAI) { // Only for player characters at start of their turn
            
            this.mysticBarrierTurnCounter++;
            console.log(`[Kokoro] Mystic Barrier turn counter: ${this.mysticBarrierTurnCounter}`);
            
            // Apply shield every 10th turn
            if (this.mysticBarrierTurnCounter % 10 === 0) {
                console.log(`[Kokoro] Mystic Barrier activating on turn ${this.mysticBarrierTurnCounter}!`);
                this.applyMysticBarrierShield();
            }
        }
        
        // Handle Shield Empowerment - check shield at start of every turn
        if (this.hasTalent && this.hasTalent('shield_empowerment') && 
            !shouldReduceDuration && shouldRegenerateResources) {
            this.applyShieldEmpowerment();
        }
    }

    showMysticBarrierVFX(shieldAmount) {
        const characterElement = document.querySelector(`[data-character-id="${this.id}"]`);
        if (!characterElement) return;

        // Create main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'mystic-barrier-vfx';
        characterElement.appendChild(vfxContainer);

        // Shield amount text
        const shieldText = document.createElement('div');
        shieldText.className = 'mystic-barrier-text';
        shieldText.textContent = `+${shieldAmount} Shield`;
        vfxContainer.appendChild(shieldText);

        // Barrier formation particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'mystic-barrier-particles';
        vfxContainer.appendChild(particlesContainer);

        // Generate barrier particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'barrier-particle';
            particle.style.setProperty('--delay', `${i * 0.1}s`);
            particlesContainer.appendChild(particle);
        }

        // Protective aura overlay
        const auraOverlay = document.createElement('div');
        auraOverlay.className = 'mystic-barrier-aura';
        vfxContainer.appendChild(auraOverlay);

        // Barrier formation waves
        const wavesContainer = document.createElement('div');
        wavesContainer.className = 'mystic-barrier-waves';
        vfxContainer.appendChild(wavesContainer);

        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'barrier-wave';
            wave.style.animationDelay = `${i * 0.2}s`;
            wavesContainer.appendChild(wave);
        }

        // Add temporary shield glow to character
        const imageContainer = characterElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.classList.add('mystic-barrier-active');
            setTimeout(() => {
                imageContainer.classList.remove('mystic-barrier-active');
            }, 3000);
        }

        // Clean up VFX
        setTimeout(() => {
            if (vfxContainer && vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2500);
    }

    // Show visual effect for Shielding Feedback talent
    showShieldingFeedbackVFX(shieldAmount) {
        const characterElement = document.getElementById(`character-${this.instanceId || this.id}`);
        if (characterElement) {
            try {
                console.log(`[Shielding Feedback VFX] Showing VFX for ${this.name} with ${shieldAmount} shield`);
                
                // Create shielding feedback effect
                const shieldingVfx = document.createElement('div');
                shieldingVfx.className = 'shielding-feedback-vfx';
                
                // Create floating shield text
                const shieldText = document.createElement('div');
                shieldText.className = 'shielding-feedback-text';
                shieldText.textContent = `+${shieldAmount} Shield`;
                
                // Create shield particle container
                const shieldContainer = document.createElement('div');
                shieldContainer.className = 'shielding-feedback-particles';
                
                // Add shield fragments
                const fragmentCount = 12;
                for (let i = 0; i < fragmentCount; i++) {
                    const fragment = document.createElement('div');
                    fragment.className = 'shield-fragment';
                    
                    // Randomize fragment properties
                    const angle = (i / fragmentCount) * 360;
                    const delay = Math.random() * 0.6;
                    const distance = 40 + Math.random() * 20;
                    const size = 6 + Math.random() * 8;
                    
                    fragment.style.setProperty('--angle', `${angle}deg`);
                    fragment.style.setProperty('--delay', `${delay}s`);
                    fragment.style.setProperty('--distance', `${distance}px`);
                    fragment.style.setProperty('--size', `${size}px`);
                    
                    shieldContainer.appendChild(fragment);
                }
                
                // Create protective barrier ring
                const barrierRing = document.createElement('div');
                barrierRing.className = 'protective-barrier-ring';
                shieldContainer.appendChild(barrierRing);
                
                // Create shield energy waves
                for (let i = 0; i < 3; i++) {
                    const wave = document.createElement('div');
                    wave.className = 'shield-energy-wave';
                    wave.style.animationDelay = `${i * 0.2}s`;
                    shieldContainer.appendChild(wave);
                }
                
                // Add elements to the DOM
                shieldingVfx.appendChild(shieldText);
                shieldingVfx.appendChild(shieldContainer);
                characterElement.appendChild(shieldingVfx);
                
                // Add temporary shield glow to character
                characterElement.classList.add('shielding-feedback-glow');
                
                // Remove VFX after animation completes
                setTimeout(() => {
                    if (shieldingVfx.parentNode) shieldingVfx.remove();
                    characterElement.classList.remove('shielding-feedback-glow');
                }, 2200);
            } catch (error) {
                console.error('[Shielding Feedback VFX] Error:', error);
            }
        }
    }

    applyShieldEmpowerment() {
        if (!this.hasTalent('shield_empowerment')) return;
        
        const currentShield = this.shield || 0;
        console.log(`[Shield Empowerment] Checking shield for ${this.name}: ${currentShield}`);
        
        if (currentShield <= 0) {
            // No shield, remove the buff if it exists
            if (this.hasBuff('shield_empowerment_buff')) {
                this.removeBuff('shield_empowerment_buff');
                console.log(`[Shield Empowerment] Removed buff from ${this.name} - no shield`);
                
                // Recalculate stats after removing buff
                this.recalculateStats('shield_empowerment_removal');
                
                // Log the buff removal
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🛡️ ${this.name}'s Shield Empowerment fades as the protective barrier depletes.`, 'shield-empowerment');
                }
            }
            return;
        }
        
        // Calculate magical damage bonus (25% of current shield)
        const magicalDamageBonus = Math.floor(currentShield * 0.25);
        
        // Check if we already have the buff
        const existingBuff = this.buffs.find(buff => buff.id === 'shield_empowerment_buff');
        if (existingBuff) {
            // Update existing buff with current shield amount (no stacking)
            existingBuff.magicalDamageBonus = magicalDamageBonus;
            
            console.log(`[Shield Empowerment] Updated buff for ${this.name}: ${magicalDamageBonus} Magical Damage (from ${currentShield} shield)`);
            
            // Update buff description
            existingBuff.description = `Grants ${magicalDamageBonus} Magical Damage from shield energy.`;
            
            // Update statModifiers with new value
            if (existingBuff.statModifiers && existingBuff.statModifiers[0]) {
                existingBuff.statModifiers[0].value = magicalDamageBonus;
            }
            
            // Log the update (only if the value changed significantly)
            const previousValue = existingBuff.statModifiers?.[0]?.value || 0;
            if (Math.abs(magicalDamageBonus - previousValue) > 1) {
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`🛡️ ${this.name}'s Shield Empowerment adjusts to shield changes (${magicalDamageBonus} Magical Damage)`, 'shield-empowerment');
                }
            }
        } else {
            // Create new buff
            const shieldEmpowermentBuff = {
                id: 'shield_empowerment_buff',
                name: 'Shield Empowerment',
                description: `Grants ${magicalDamageBonus} Magical Damage from shield energy.`,
                icon: 'Icons/talents/shield_empowerment.webp',
                duration: -1, // Permanent until shield is gone
                magicalDamageBonus: magicalDamageBonus,
                statModifiers: [{
                    stat: 'magicalDamage',
                    value: magicalDamageBonus,
                    operation: 'add'
                }]
            };
            
            this.addBuff(shieldEmpowermentBuff);
            
            console.log(`[Shield Empowerment] Applied new buff to ${this.name}: ${magicalDamageBonus} Magical Damage`);
            
            // Log the buff application
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`🛡️ ${this.name}'s Shield Empowerment activates! (+${magicalDamageBonus} Magical Damage)`, 'shield-empowerment');
            }
        }
        
        // Recalculate stats after applying buff
        this.recalculateStats('shield_empowerment_application');
        
        // Show VFX
        this.showShieldEmpowermentVFX(magicalDamageBonus);
        
        // Update UI
        this.updateStatsMenuIfOpen();
    }

    showShieldEmpowermentVFX(magicalDamageBonus) {
        const characterElement = document.querySelector(`[data-character-id="${this.id}"]`);
        if (!characterElement) return;

        // Create main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'shield-empowerment-vfx';
        characterElement.appendChild(vfxContainer);

        // Magical damage bonus text
        const empowermentText = document.createElement('div');
        empowermentText.className = 'shield-empowerment-text';
        empowermentText.textContent = `+${magicalDamageBonus} Magical Damage`;
        vfxContainer.appendChild(empowermentText);

        // Shield energy particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'shield-empowerment-particles';
        vfxContainer.appendChild(particlesContainer);

        // Generate energy particles that flow from shield to character
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'empowerment-particle';
            particle.style.setProperty('--delay', `${i * 0.1}s`);
            particle.style.setProperty('--angle', `${(i / 12) * 360}deg`);
            particlesContainer.appendChild(particle);
        }

        // Shield energy conversion wave
        const conversionWave = document.createElement('div');
        conversionWave.className = 'shield-conversion-wave';
        vfxContainer.appendChild(conversionWave);

        // Magical empowerment aura
        const empowermentAura = document.createElement('div');
        empowermentAura.className = 'shield-empowerment-aura';
        vfxContainer.appendChild(empowermentAura);

        // Add temporary empowerment glow to character
        const imageContainer = characterElement.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.classList.add('shield-empowerment-active');
            setTimeout(() => {
                imageContainer.classList.remove('shield-empowerment-active');
            }, 3000);
        }

        // Clean up VFX
        setTimeout(() => {
            if (vfxContainer && vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2500);
    }
}

// --- Ability implementations ---

// Lesser Heal
const lesserHealEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Get Lesser Heal ability to check for talent modifications
    const lesserHealAbility = caster.abilities.find(a => a.id === 'lesser_heal');
    
    // Base healing amount (can be modified by talents)
    let baseHealAmount = lesserHealAbility?.baseAmount || 410;
    
    // Check for Enhanced Lesser Heal talent
    if (caster.enhancedLesserHeal) {
        baseHealAmount = 580;
    }
    
    // Check if target is an enemy and if ability can target enemies (talent modification)
    const isEnemy = target.isAI !== caster.isAI;
    const canTargetEnemies = lesserHealAbility?.canTargetEnemies || false;
    
    if (isEnemy && canTargetEnemies) {
        // Deal damage to enemy instead of healing
        let enemyDamagePercent = lesserHealAbility?.enemyDamagePercent || 0.5; // Default 50% damage
        
        // Check for Magical Amplification talent
        if (caster.magicalAmplification) {
            enemyDamagePercent = 1.0; // 100% damage with talent
            // Show VFX for talent activation
            showMagicalAmplificationVFX(caster);
        }
        
        let damageAmount = Math.floor(baseHealAmount * enemyDamagePercent);
        
        // Check for Magical Amplification talent to add magical damage scaling
        if (caster.magicalAmplification) {
            // Add 100% of magical damage to the base heal amount damage
            damageAmount = Math.floor(baseHealAmount + caster.stats.magicalDamage);
        }
        
        // Apply healing power to damage calculation (magic damage conversion)
        damageAmount = Math.floor(damageAmount * (1 + caster.stats.healingPower));
        
        // Apply damage
        const result = target.applyDamage(damageAmount, 'magical', caster, { abilityId: 'lesser_heal' });
        
        // Check if dodged
        if (result.isDodged) {
            log(`${target.name} dodged ${caster.name}'s Lesser Heal attack!`);
            return;
        }
        
        // Check for Protective Healing talent (apply shield to caster when damaging enemies)
        if (caster.protectiveHealing) {
            const shieldAmount = Math.floor(caster.stats.magicalDamage * 0.21);
            if (shieldAmount > 0) {
                // Add shield to caster (self-protection when attacking)
                caster.shield = (caster.shield || 0) + shieldAmount;
                
                // Show protective healing VFX
                showProtectiveHealingVFX(caster, shieldAmount);
                
                // Update shield display
                caster.updateShieldDisplay();
                
                // Log shield application
                log(`${caster.name} gains ${shieldAmount} shield from Protective Healing.`, 'buff');
            }
        }
        
        // Check for Healing Efficiency talent (23% chance not to end turn)
        let healingEfficiencyTriggered = false;
        if (caster.healingEfficiency && Math.random() <= 0.23) {
            healingEfficiencyTriggered = true;
            
            // Show VFX for talent activation
            showHealingEfficiencyVFX(caster);
            
            // Prevent turn from ending by setting the ability as not ending turn
            const lesserHealAbility = caster.abilities.find(a => a.id === 'lesser_heal');
            if (lesserHealAbility) {
                lesserHealAbility._tempDoesNotEndTurn = true;
            }
        }
        
        // Log the damage
        let message = `${caster.name} used Lesser Heal on ${target.name}, dealing ${result.damage} magical damage.`;
        if (result.isCritical) {
            message += " (Critical Hit!)";
        }
        if (caster.magicalAmplification) {
            message += " [Magical Amplification]";
        }
        if (healingEfficiencyTriggered) {
            message += " [Healing Efficiency - Turn Continues!]";
        }
        log(message);
        
        // Show damage VFX (enhanced if Magical Amplification is active)
        showLesserHealDamageVFX(target, result.damage, caster.magicalAmplification);
        
        // Check for Empathic Conversion talent
        if (caster.empathicConversion && result.damage > 0) {
            applyEmpathicConversion(caster, result.damage);
        }
        
        // Check if target died
        if (target.isDead()) {
            log(`${target.name} has been defeated!`);
            if (window.gameManager) {
                window.gameManager.handleCharacterDeath(target);
            }
        }
        
        // Play damage sound
        playSound('sounds/kokoroa2.mp3', 0.8); // Use W ability sound for damage
        
        return;
    }
    
    // Normal healing behavior for allies
    // Apply healing power multiplier
    const healAmount = Math.floor(baseHealAmount * (1 + caster.stats.healingPower));
    
    // Check for Overheal Mastery talent
    let actualHeal;
    if (caster.overhealMastery) {
        // Check if healing would exceed max HP
        const currentHp = target.stats.currentHp;
        const maxHp = target.stats.maxHp;
        const missingHp = maxHp - currentHp;
        
        if (healAmount <= missingHp) {
            // Normal healing - will not exceed max HP
            actualHeal = target.heal(healAmount, caster, { abilityId: 'lesser_heal' });
        } else {
            // Overheal scenario
            if (missingHp > 0) {
                // Heal to max first
                actualHeal = target.heal(missingHp, caster, { abilityId: 'lesser_heal' });
            } else {
                // Already at full HP - no healing but create actualHeal object for consistency
                actualHeal = { healAmount: 0, isCritical: false };
            }
            
            // Check if shield application is blocked by Imprison debuff
            const imprisonDebuff = target.debuffs.find(debuff => 
                debuff && debuff.effects && debuff.effects.cantReceiveShields
            );
            
            if (!imprisonDebuff) {
                // Create shield for the excess amount
                const excessHeal = healAmount - missingHp;
                target.shield = (target.shield || 0) + excessHeal;
                
                // Show overheal VFX
                showOverhealMasteryVFX(target, excessHeal);
                
                // Update shield display
                target.updateShieldDisplay();
                
                // Log overheal shield application
                log(`${target.name} gains ${excessHeal} shield from overheal!`, 'buff');
                
                // Trigger shield gained animation
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.triggerShieldAnimation(target, 'gained');
                }
            } else {
                // Log that shield was blocked
                log(`${target.name}'s overheal shield is blocked by imprisonment!`, 'debuff');
            }
        }
    } else {
        // Normal healing without overheal
        actualHeal = target.heal(healAmount, caster, { abilityId: 'lesser_heal' });
    }
    
    // Check for Protective Healing talent (apply shield regardless of heal amount)
    if (caster.protectiveHealing) {
        const shieldAmount = Math.floor(caster.stats.magicalDamage * 0.21);
        if (shieldAmount > 0) {
            // Add shield to target
            target.shield = (target.shield || 0) + shieldAmount;
            
            // Show protective healing VFX
            showProtectiveHealingVFX(target, shieldAmount);
            
            // Update shield display
            target.updateShieldDisplay();
            
            // Log shield application
            log(`${target.name} gains ${shieldAmount} shield from Protective Healing.`, 'buff');
        }
    }
    
    // Check for Empathic Resonance talent trigger (only for ally healing, not self)
    if (caster instanceof SchoolgirlKokoroCharacter && target !== caster) {
        caster.checkEmpathicResonance(target, caster);
    }
    
    // Check for Cooldown Mastery talent (100% chance to reduce cooldown)
    if (caster.cooldownMastery && Math.random() <= 1.0) {
        caster.triggerCooldownMastery();
    }
    
    // Check for Healing Efficiency talent (23% chance not to end turn)
    let healingEfficiencyTriggered = false;
    if (caster.healingEfficiency && Math.random() <= 0.23) {
        healingEfficiencyTriggered = true;
        
        // Show VFX for talent activation
        showHealingEfficiencyVFX(caster);
        
        // Prevent turn from ending by setting the ability as not ending turn
        const lesserHealAbility = caster.abilities.find(a => a.id === 'lesser_heal');
        if (lesserHealAbility) {
            lesserHealAbility._tempDoesNotEndTurn = true;
        }
    }
    
    // Log the healing with crit information
    let healMessage = `${caster.name} used Lesser Heal on ${target.name}, healing for ${actualHeal.healAmount} HP.`;
    if (actualHeal.isCritical) {
        healMessage += " (Critical Heal!)";
    }
    if (healingEfficiencyTriggered) {
        healMessage += " [Healing Efficiency - Turn Continues!]";
    }
    log(healMessage);
    
    // Show visual effect for healing (custom VFX for Kokoro)
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create custom healing effect instead of using the default heal-vfx
        const healVfx = document.createElement('div');
        healVfx.className = 'lesser-heal-vfx';
        if (actualHeal.isCritical) {
            healVfx.classList.add('critical-heal');
        }
        
        // Create healing number display (using a div instead of a span to avoid default heal-vfx styling)
        const healNumber = document.createElement('div');
        healNumber.className = 'lesser-heal-number';
        if (actualHeal.isCritical) {
            healNumber.classList.add('critical');
            healNumber.textContent = `+${actualHeal.healAmount}! CRIT HEAL!`;
        } else {
            healNumber.textContent = `+${actualHeal.healAmount}`;
        }
        
        // Create leaf particles container
        const leafContainer = document.createElement('div');
        leafContainer.className = 'lesser-heal-leaf-container';
        
        // Add emerald rune circles
        for (let i = 0; i < 3; i++) {
            const runeCircle = document.createElement('div');
            runeCircle.className = 'emerald-rune-circle';
            runeCircle.style.animationDelay = `${i * 0.2}s`;
            leafContainer.appendChild(runeCircle);
        }
        
        // Create dark-green leaf particles
        const leafCount = 8;
        for (let i = 0; i < leafCount; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'emerald-leaf';
            
            // Randomize leaf positions and animations
            const angle = (i / leafCount) * 360;
            const delay = Math.random() * 0.5;
            const size = 10 + Math.random() * 10;
            
            leaf.style.setProperty('--angle', `${angle}deg`);
            leaf.style.setProperty('--delay', `${delay}s`);
            leaf.style.setProperty('--size', `${size}px`);
            
            leafContainer.appendChild(leaf);
        }
        
        // Add elements to the DOM
        healVfx.appendChild(healNumber);
        healVfx.appendChild(leafContainer);
        targetElement.appendChild(healVfx);
        
        // Prevent applying default heal animation classes
        // Don't add heal-animation or heal-vfx classes that use scale transformations
        
        // Remove VFX after animation completes
        setTimeout(() => {
            healVfx.remove();
        }, 2000);
    }
    
    // Play sounds
    playSound('sounds/kokoroa1.mp3', 0.8); // Kokoro's voice line
    playSound('sounds/kokoroa1sfx.mp3', 0.6); // SFX (using splash as placeholder)
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }
    
    return actualHeal;
};

// Silencing Ring - Debuff implementation with DOT damage
const silencingRingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Check if target already has the debuff
    const existingDebuff = target.debuffs.find(d => d.id === 'silencing_ring');
    if (existingDebuff) {
        // Refresh the duration if it already exists
        existingDebuff.duration = 6;
        log(`${target.name}'s Silencing Ring refreshed.`, 'debuff');
        return true;
    }
    
    // Create debuff description based on caster's talents
    let debuffDescription = 'Deals 30% less damage and takes 90 damage per turn';
    
    // Check for Empowered Silencing talent
    if (caster && caster.empoweredSilencing) {
        debuffDescription = 'Deals 30% less damage and takes 230 damage per turn';
    }
    
    // Check for Mana Disruption talent
    if (caster && caster.manaDisruption) {
        debuffDescription += ', ability mana costs doubled';
    }
    
    // Create and add the debuff with DOT damage
    const debuff = {
        id: 'silencing_ring',
        name: 'Silencing Ring',
        description: debuffDescription,
        icon: 'Icons/abilities/silencing_ring.jfif',
        duration: 6,
        caster: caster, // Store reference to caster for critical strike calculations
        
        // Per-turn DOT effect
        effect: function(character) {
            let dotDamage = 90;
            
            // Check for Empowered Silencing talent
            if (this.caster && this.caster.empoweredSilencing) {
                dotDamage = 230; // +155% damage (90 * 2.55 = 229.5, rounded to 230)
            }
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            // Apply DOT damage using proper damage system to enable critical strikes
            const result = character.applyDamage(dotDamage, 'magical', this.caster, { 
                abilityId: 'silencing_ring_dot',
                isDOT: true 
            });
            
            // Log the damage with crit information
            let message = `${character.name} takes ${result.damage} damage from Silencing Ring.`;
            if (result.isCritical) {
                message += " (Critical DOT!)";
            }
            if (this.caster && this.caster.empoweredSilencing) {
                message += " [Empowered Silencing]";
            }
            log(message, 'debuff');
            
            // Show DOT VFX with actual damage amount
            showSilencingRingDOTVFX(character, result.damage, result.isCritical);
            
            // Check if character died from DOT
            if (character.isDead()) {
                log(`${character.name} succumbed to Silencing Ring!`, 'death');
                if (window.gameManager) {
                    window.gameManager.handleCharacterDeath(character);
                }
            }
        },
        
        // Set up when the debuff is first applied
        onApply: function() {
            // Store the original damage calculation method
            if (!target._originalCalculateDamage) {
                // Only save the original if we haven't already (to prevent stacking)
                if (typeof target.calculateDamage === 'function') {
                    target._originalCalculateDamage = target.calculateDamage;
                }
                
                // Override the damage calculation method
                target.calculateDamage = function(baseDamage, type) {
                    // First use the original calculation if it exists
                    let damage = baseDamage;
                    if (this._originalCalculateDamage) {
                        damage = this._originalCalculateDamage.call(this, baseDamage, type);
                    }
                   
                    // Then apply our 30% reduction
                    return Math.floor(damage * 0.7); // 30% damage reduction
                };
            }
            
            // Check for Mana Disruption talent
            if (caster && caster.manaDisruption) {
                // Store original useAbility method for mana cost doubling
                if (!target._originalUseAbility) {
                    target._originalUseAbility = target.useAbility;
                    
                    // Override useAbility to double mana costs
                    target.useAbility = function(index, targetChar) {
                        // Get the ability
                        const ability = this.abilities[index];
                        if (!ability) return false;
                        
                        // Store original mana cost and double it temporarily
                        const originalManaCost = ability.manaCost;
                        ability.manaCost = originalManaCost * 2;
                        
                        // Call original useAbility method
                        const result = this._originalUseAbility.call(this, index, targetChar);
                        
                        // Restore original mana cost
                        ability.manaCost = originalManaCost;
                        
                        return result;
                    };
                    
                    // Add visual indicator for mana disruption
                    showManaDisruptionVFX(target);
                }
            }
        },
        
        // Clean up when the debuff expires or is removed
        remove: function() {
            log(`Silencing Ring effect removed from ${target.name}.`, 'status');
            
            // Restore the original damage calculation method
            if (target._originalCalculateDamage) {
                target.calculateDamage = target._originalCalculateDamage;
                delete target._originalCalculateDamage;
            }
            
            // Restore the original useAbility method (mana disruption cleanup)
            if (target._originalUseAbility) {
                target.useAbility = target._originalUseAbility;
                delete target._originalUseAbility;
                
                // Remove mana disruption visual indicator
                removeManaDisruptionVFX(target);
            }
        }
    };
    
    // Apply the debuff to the target
    target.addDebuff(debuff);
    
    // Manually call the onApply method since the Character class doesn't do it
    if (typeof debuff.onApply === 'function') {
        debuff.onApply();
    }
    
    // Show visual effect for silencing
    showSilencingRingVFX(target);
    
    // Play sound
    playSound('sounds/kokoroa2.mp3', 0.8); // Kokoro's voice line for W
    
    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(target);
    }

    return true;
};

// Remove the status indicator functions since we don't want them displayed
function addSilencingRingStatusIndicator(target) {
    // Do nothing - we don't want the status indicator displayed
}

function removeSilencingRingStatusIndicator(target) {
    // Do nothing - we don't want the status indicator displayed
}

// Show visual effect for silencing ring
function showSilencingRingVFX(target) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        // Create main silencing effect
        const silencingVfx = document.createElement('div');
        silencingVfx.className = 'silencing-ring-vfx';
        
        // Create debuff text display
        const debuffText = document.createElement('div');
        debuffText.className = 'silencing-ring-text';
        debuffText.textContent = '-30% DMG';
        
        // Create ring container
        const ringContainer = document.createElement('div');
        ringContainer.className = 'silencing-ring-container';
        
        // Add multiple purple rings
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.className = 'silencing-ring';
            ring.style.animationDelay = `${i * 0.3}s`;
            ring.style.setProperty('--size', `${90 + i * 40}px`);
            ringContainer.appendChild(ring);
        }
        
        // Add elements to the DOM
        silencingVfx.appendChild(debuffText);
        silencingVfx.appendChild(ringContainer);
        targetElement.appendChild(silencingVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            silencingVfx.remove();
        }, 2000);
    }
}

// Show DOT damage VFX for Silencing Ring
function showSilencingRingDOTVFX(character, damageAmount, isCritical = false) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create DOT damage trigger effect
            const dotTrigger = document.createElement('div');
            dotTrigger.className = 'silencing-ring-dot-trigger';
            if (isCritical) {
                dotTrigger.classList.add('critical-dot');
            }
            characterElement.appendChild(dotTrigger);
            
            // Create floating damage number
            const damageNumber = document.createElement('div');
            damageNumber.className = 'silencing-ring-dot-number';
            if (isCritical) {
                damageNumber.classList.add('critical');
                damageNumber.textContent = `-${damageAmount}! CRIT DOT!`;
            } else {
                damageNumber.textContent = `-${damageAmount}`;
            }
            dotTrigger.appendChild(damageNumber);
            
            // Create energy drain particles
            const particleContainer = document.createElement('div');
            particleContainer.className = 'silencing-ring-dot-particles';
            
            // Add energy drain particles
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'energy-drain-particle';
                particle.style.setProperty('--angle', `${i * 45}deg`);
                particle.style.setProperty('--delay', `${i * 0.1}s`);
                particleContainer.appendChild(particle);
            }
            
            dotTrigger.appendChild(particleContainer);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (dotTrigger.parentNode) dotTrigger.remove();
            }, 2000);
        } catch (error) {
            console.error('[Silencing Ring DOT VFX] Error:', error);
        }
    }
}

// Circle Heal - Heal all allies implementation
const circleHealEffect = (caster, target, options = {}) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Check if this is a Divine Resonance trigger to avoid infinite loops
    const isDivineResonanceEcho = options.isDivineResonanceEcho || false;
    
    // Get all allies
    let allAllies = [];
    if (window.gameManager) {
        // Determine if caster is a player or AI character
        const isAI = caster.isAI;
        if (isAI) {
            allAllies = window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
        } else {
            allAllies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
        }
    } else {
        // Fallback for testing when gameManager is not available
        allAllies = [caster];
        console.warn("gameManager not found, only healing caster");
    }
    
    // Base healing amount
    const baseHealAmount = 250;
    let magicalDamageMultiplier = 1.5; // Default 150%
    
    // Check for Transcendent Healing talent
    if (caster.transcendentHealing) {
        magicalDamageMultiplier = 2.0; // 200% with talent
    }
    
    const magicalDamageBonus = Math.floor(caster.stats.magicalDamage * magicalDamageMultiplier);
    const totalHealAmount = baseHealAmount + magicalDamageBonus;
    
    // Log the ability usage
    if (isDivineResonanceEcho) {
        log(`Divine Resonance triggers! Circle Heal echoes again, healing all allies for ${totalHealAmount} HP.`, 'utility');
    } else {
        log(`${caster.name} used Circle Heal, healing all allies for ${totalHealAmount} HP.`);
    }
    
    // Check for Circle Heal Mastery talent and show VFX
    if (caster instanceof SchoolgirlKokoroCharacter && caster.abilities.find(a => a.id === 'circle_heal' && a.cooldown < 8)) {
        showCircleHealMasteryVFX(caster);
    }
    
    // Check for Transcendent Healing talent and show VFX
    if (caster instanceof SchoolgirlKokoroCharacter && caster.transcendentHealing) {
        showTranscendentHealingVFX(caster);
    }
    
    // Check for Divine Resonance talent and show VFX
    if (caster instanceof SchoolgirlKokoroCharacter && caster.divineResonance && isDivineResonanceEcho) {
        showDivineResonanceVFX(caster);
    }
    
    // Apply healing to all allies
    allAllies.forEach(ally => {
        // Apply healing power multiplier from caster (the one casting the healing spell)
        const healAmount = Math.floor(totalHealAmount * (1 + caster.stats.healingPower));
        
        // Apply healing using the ally's heal() method with proper caster tracking
        const abilityId = isDivineResonanceEcho ? 'circle_heal_divine_resonance' : 'circle_heal';
        const actualHeal = ally.heal(healAmount, caster, { suppressDefaultVFX: true, abilityId: abilityId });
        
        if (actualHeal.healAmount > 0) {
            // Log the healing for each ally with crit information
            let healMessage = `${ally.name} was healed for ${actualHeal.healAmount} HP.`;
            if (actualHeal.isCritical) {
                healMessage += " (Critical Heal!)";
            }
            if (isDivineResonanceEcho) {
                healMessage += " [Divine Resonance]";
            }
            log(healMessage);
            
            // Show healing VFX for each ally (enhanced for Divine Resonance)
            showCircleHealVFX(ally, actualHeal.healAmount, actualHeal.isCritical, isDivineResonanceEcho);
        }
        
        // Check for Protective Healing talent (apply shield regardless of heal amount)
        if (caster.protectiveHealing) {
            const shieldAmount = Math.floor(caster.stats.magicalDamage * 0.21);
            if (shieldAmount > 0) {
                // Add shield to ally
                ally.shield = (ally.shield || 0) + shieldAmount;
                
                // Show protective healing VFX
                showProtectiveHealingVFX(ally, shieldAmount);
                
                // Update UI to reflect shield change
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(ally);
                }
                
                // Log shield application (only once for Circle Heal to avoid spam)
                if (ally === allAllies[0]) {
                    log(`All allies gain ${shieldAmount} shield from Protective Healing.`, 'buff');
                }
            }
        }
        
        // Check for Empathic Resonance talent trigger (only for ally healing, not self)
        if (caster instanceof SchoolgirlKokoroCharacter && ally !== caster) {
            caster.checkEmpathicResonance(ally, caster);
        }
        
        // Update UI (heal() method already calls updateCharacterUI)
        // if (typeof updateCharacterUI === 'function') {
        //     updateCharacterUI(ally);
        // }
    });
    
    // Play sounds (different sounds for Divine Resonance)
    if (isDivineResonanceEcho) {
        playSound('sounds/kokoroa3.mp3', 0.6); // Slightly quieter for echo
        playSound('sounds/kokoroa3sfx.mp3', 0.4); // Softer SFX for echo
    } else {
        playSound('sounds/kokoroa3.mp3', 0.8); // Kokoro's voice line for E
        playSound('sounds/kokoroa3sfx.mp3', 0.6); // SFX for E
    }
    
    // Check for Divine Resonance talent trigger (only on the original cast, not the echo)
    if (!isDivineResonanceEcho && caster.divineResonance && Math.random() <= 0.4) {
        // 40% chance to trigger Divine Resonance
        log(`${caster.name}'s Divine Resonance activates!`, 'utility');
        
        // Trigger Circle Heal echo directly after a short delay
        // This bypasses the normal ability usage restrictions since it's a talent effect
        setTimeout(() => {
            try {
                // Call the effect directly to bypass turn restrictions
                circleHealEffect(caster, target, { isDivineResonanceEcho: true });
                
                // Record the divine resonance trigger as a separate ability usage for statistics
                if (window.statisticsManager) {
                    window.statisticsManager.recordAbilityUsage(caster, {
                        id: 'divine_resonance',
                        name: 'Divine Resonance',
                        type: 'utility'
                    }, 0);
                }
            } catch (error) {
                console.error('[Divine Resonance] Error triggering echo:', error);
                log(`${caster.name}'s Divine Resonance echo failed to trigger.`, 'system');
            }
        }, 800); // 800ms delay for the echo effect
    }
    
    return true;
};

// Show visual effect for Circle Heal
function showCircleHealVFX(target, healAmount, isCritical = false, isDivineResonance = false) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create main healing effect container
        const healVfx = document.createElement('div');
        healVfx.className = 'circle-heal-vfx';
        if (isCritical) {
            healVfx.classList.add('critical-heal');
        }
        if (isDivineResonance) {
            healVfx.classList.add('divine-resonance');
        }
        
        // Create healing number display
        const healNumber = document.createElement('div');
        healNumber.className = 'circle-heal-number';
        if (isCritical) {
            healNumber.classList.add('critical');
            healNumber.textContent = `+${healAmount}! CRIT!`;
        } else {
            healNumber.textContent = `+${healAmount}`;
        }
        
        // Create hexagonal pattern container
        const patternContainer = document.createElement('div');
        patternContainer.className = 'circle-heal-pattern';
        
        // Create pulsing ground effect
        const groundEffect = document.createElement('div');
        groundEffect.className = 'circle-heal-ground';
        
        // Add hexagon cells
        const hexCount = 8;
        for (let i = 0; i < hexCount; i++) {
            const radius = 50 + Math.random() * 30;
            const angle = (i / hexCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius + 50; // percentage of container width
            const y = Math.sin(angle) * radius + 50; // percentage of container height
            
            const hexagon = document.createElement('div');
            hexagon.className = 'hexagon-cell';
            hexagon.style.left = `${x}%`;
            hexagon.style.top = `${y}%`;
            hexagon.style.animationDelay = `${Math.random() * 0.5}s`;
            
            patternContainer.appendChild(hexagon);
        }
        
        // Add vine tendrils
        const vineCount = 6;
        for (let i = 0; i < vineCount; i++) {
            const angle = (i / vineCount) * Math.PI * 2;
            const x = Math.cos(angle) * 40 + 50; // starting at 40% from center
            const y = Math.sin(angle) * 40 + 50; // starting at 40% from center
            const height = 30 + Math.random() * 40; // variable heights
            
            const vine = document.createElement('div');
            vine.className = 'vine-tendril';
            vine.style.left = `${x}%`;
            vine.style.top = `${y}%`;
            vine.style.setProperty('--height', `${height}px`);
            vine.style.transform = `rotate(${angle + Math.PI}rad)`; // point outward
            vine.style.animationDelay = `${Math.random() * 0.3}s`;
            
            // Add leaf at end of vine
            const leaf = document.createElement('div');
            leaf.className = 'vine-leaf';
            leaf.style.setProperty('--angle', `${(Math.random() * 60 - 30)}deg`);
            vine.appendChild(leaf);
            
            patternContainer.appendChild(vine);
        }
        
        // Add healing glyphs
        const glyphSymbols = ['✦', '❊', '✧', '❉', '✿', '❋'];
        const glyphCount = 8;
        for (let i = 0; i < glyphCount; i++) {
            const randomSymbol = glyphSymbols[Math.floor(Math.random() * glyphSymbols.length)];
            const glyph = document.createElement('div');
            glyph.className = 'healing-glyph';
            glyph.textContent = randomSymbol;
            
            // Random position
            const x = 20 + Math.random() * 60; // 20-80% of width
            const y = 40 + Math.random() * 40; // 40-80% of height
            const rotation = Math.random() * 360;
            
            glyph.style.left = `${x}%`;
            glyph.style.top = `${y}%`;
            glyph.style.setProperty('--rotation', `${rotation}deg`);
            glyph.style.animationDelay = `${Math.random() * 0.7}s`;
            
            patternContainer.appendChild(glyph);
        }
        
        // Add elements to the DOM
        healVfx.appendChild(healNumber);
        healVfx.appendChild(patternContainer);
        healVfx.appendChild(groundEffect);
        targetElement.appendChild(healVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            healVfx.remove();
        }, 2500);
    }
}

// Create ability objects
const lesserHealAbility = new Ability(
    'lesser_heal',
    'Lesser Heal',
    'Icons/abilities/lesser_heal.jfif',
    40, // Mana cost
    1,  // Cooldown in turns
    lesserHealEffect
).setDescription('Heals the selected ally or herself for 410HP.')
 .setTargetType('ally_or_self'); // Can target any ally including self

// Override the target type based on talent modifications
lesserHealAbility.getTargetType = function() {
    // Check if talent allows targeting enemies
    if (this.canTargetEnemies) {
        return 'any'; // Allow targeting anyone (allies, self, or enemies)
    }
    return 'ally_or_self'; // Default behavior
};

// Override description generation to reflect talent changes
lesserHealAbility.generateDescription = function() {
    // Get the caster to check for talents
    const caster = this.caster || window.gameManager?.gameState?.selectedCharacter;
    
    let baseAmount = this.baseAmount || 410;
    let isEnhanced = false;
    let hasVersatility = false;
    let hasEmpathicResonance = false;
    let hasCooldownMastery = false;
    let hasMagicalAmplification = false;
    let hasEmpathicConversion = false;
    
    // Check for Enhanced Lesser Heal talent
    if (caster && caster.enhancedLesserHeal) {
        baseAmount = 580;
        isEnhanced = true;
    }
    
    // Check for Healing Versatility talent
    if (this.canTargetEnemies) {
        hasVersatility = true;
    }
    
    // Check for Empathic Resonance talent
    if (caster && caster.empathicResonance) {
        hasEmpathicResonance = true;
    }
    
    // Check for Cooldown Mastery talent
    if (caster && caster.cooldownMastery) {
        hasCooldownMastery = true;
    }
    
    // Check for Magical Amplification talent
    if (caster && caster.magicalAmplification) {
        hasMagicalAmplification = true;
    }
    
    // Check for Empathic Conversion talent
    if (caster && caster.empathicConversion) {
        hasEmpathicConversion = true;
    }
    
    // Apply visual filter to ability if Empathic Conversion is active
    updateEmpathicConversionVisuals(caster);
    
    let enemyDamagePercent = this.enemyDamagePercent || 0.5;
    let enemyDamage = Math.floor(baseAmount * enemyDamagePercent);
    
    // Calculate damage with Magical Amplification talent
    if (hasMagicalAmplification && caster) {
        enemyDamage = Math.floor(baseAmount + caster.stats.magicalDamage);
    }
    
    // Create colored text for enhanced amounts
    const healText = isEnhanced ? `<span class="kokoro-enhanced-heal">${baseAmount}</span>` : baseAmount;
    const damageText = hasMagicalAmplification ? `<span class="kokoro-enhanced-heal">${enemyDamage}</span>` : (isEnhanced ? `<span class="kokoro-enhanced-heal">${enemyDamage}</span>` : enemyDamage);
    
    let description = `Heals the selected ally or herself for ${healText}HP.`;
    
    if (hasVersatility) {
        description = `Heals allies for ${healText}HP or deals ${damageText} magical damage to enemies. <span class="talent-effect utility">[Healing Versatility]</span>`;
    }
    
    if (isEnhanced) {
        description += ` <span class="talent-effect healing">[Enhanced Lesser Heal]</span>`;
    }
    
    if (hasEmpathicResonance) {
        description += ` <span class="talent-effect utility">[Empathic Resonance: 20% chance to gain healing power when healing allies]</span>`;
    }
    
    if (hasCooldownMastery) {
        description += ` <span class="talent-effect utility">[Cooldown Mastery: 100% chance to reduce an ability's cooldown by 1]</span>`;
    }
    
    if (hasMagicalAmplification) {
        description += ` <span class="talent-effect damage">[Magical Amplification: Enhanced enemy damage scaling]</span>`;
    }
    
    if (hasEmpathicConversion) {
        description += ` <span class="talent-effect healing">[Empathic Conversion: Damage converts to healing for lowest HP ally]</span>`;
    }
    
    // Force update visuals after description generation
    setTimeout(() => {
        updateEmpathicConversionVisuals(caster);
    }, 100);
    
    return description;
};

// Update description when caster changes
lesserHealAbility.updateCaster = function(newCaster) {
    this.caster = newCaster;
    if (this.generateDescription) {
        this.description = this.generateDescription();
    }
};

// Create Silencing Ring ability
const silencingRingAbility = new Ability(
    'silencing_ring',
    'Silencing Ring',
    'Icons/abilities/silencing_ring.jfif',
    40, // Mana cost
    9, // Cooldown in turns
    silencingRingEffect
).setDescription('Places a debuff on the target for 6 turns, reducing their damage output by 30% and dealing 90 damage per turn.')
 .setTargetType('enemy'); // Can only target enemies

// Override description generation to reflect talent changes
silencingRingAbility.generateDescription = function() {
    // Get the caster to check for talents
    const caster = this.caster || window.gameManager?.gameState?.selectedCharacter;
    
    let baseCooldown = 9;
    let hasMastery = false;
    let hasEmpoweredSilencing = false;
    let hasManaDisruption = false;
    let dotDamage = 90;
    
    // Check if cooldown has been reduced by talent (actual cooldown will be modified by talent system)
    if (this.cooldown < baseCooldown) {
        hasMastery = true;
        baseCooldown = this.cooldown;
    }
    
    // Check for Empowered Silencing talent
    if (caster && caster.empoweredSilencing) {
        hasEmpoweredSilencing = true;
        dotDamage = 230;
    }
    
    // Check for Mana Disruption talent
    if (caster && caster.manaDisruption) {
        hasManaDisruption = true;
    }
    
    const dotText = hasEmpoweredSilencing ? `<span class="kokoro-enhanced-heal">${dotDamage}</span>` : dotDamage;
    
    let description = `Places a debuff on the target for 6 turns, reducing their damage output by 30% and dealing ${dotText} damage per turn.`;
    
    if (hasManaDisruption) {
        description += ` Also <span class="kokoro-enhanced-heal">doubles</span> their ability mana costs.`;
    }
    
    if (hasMastery) {
        description += ` <span class="talent-effect utility">[Silencing Ring Mastery: Cooldown reduced to ${baseCooldown} turns]</span>`;
    }
    
    if (hasEmpoweredSilencing) {
        description += ` <span class="talent-effect damage">[Empowered Silencing: +155% DOT damage]</span>`;
    }
    
    if (hasManaDisruption) {
        description += ` <span class="talent-effect debuff">[Mana Disruption: Doubles mana costs]</span>`;
    }
    
    return description;
};

// Update description when caster changes
silencingRingAbility.updateCaster = function(newCaster) {
    this.caster = newCaster;
    if (this.generateDescription) {
        this.description = this.generateDescription();
    }
};

// Create Circle Heal ability
const circleHealAbility = new Ability(
    'circle_heal',
    'Circle Heal',
    'Icons/abilities/circle_heal.jfif',
    95, // Mana cost
    8,   // Cooldown in turns
    circleHealEffect
).setDescription('Heals all allies for 250HP + 150% of Magic Damage.')
 .setTargetType('self'); // Target self but affect all allies

// Override description generation to reflect talent changes
circleHealAbility.generateDescription = function() {
    // Get the caster to check for talents
    const caster = this.caster || window.gameManager?.gameState?.selectedCharacter;
    
    let hasEmpathicResonance = false;
    let hasCircleHealMastery = false;
    let hasTranscendentHealing = false;
    let hasDivineResonance = false;
    let cooldown = 8; // Base cooldown
    let magicalDamageScaling = '150%'; // Default scaling
    
    // Check for Empathic Resonance talent
    if (caster && caster.empathicResonance) {
        hasEmpathicResonance = true;
    }
    
    // Check for Circle Heal Mastery talent (cooldown reduction)
    if (this.cooldown < 8) {
        hasCircleHealMastery = true;
        cooldown = this.cooldown;
    }
    
    // Check for Transcendent Healing talent (enhanced scaling)
    if (caster && caster.transcendentHealing) {
        hasTranscendentHealing = true;
        magicalDamageScaling = '<span class="kokoro-enhanced-heal">200%</span>';
    }
    
    // Check for Divine Resonance talent
    if (caster && caster.divineResonance) {
        hasDivineResonance = true;
    }
    
    let description = `Heals all allies for 250HP + ${magicalDamageScaling} of Magic Damage.`;
    
    if (hasDivineResonance) {
        description += ` <span class="kokoro-enhanced-heal">40%</span> chance to trigger again immediately.`;
    }
    
    if (hasTranscendentHealing) {
        description += ` <span class="talent-effect healing">[Transcendent Healing: Enhanced magical scaling]</span>`;
    }
    
    if (hasDivineResonance) {
        description += ` <span class="talent-effect utility">[Divine Resonance: 40% chance to echo]</span>`;
    }
    
    if (hasCircleHealMastery) {
        description += ` <span class="talent-effect utility">[Circle Heal Mastery: Cooldown reduced to ${cooldown} turns]</span>`;
    }
    
    if (hasEmpathicResonance) {
        description += ` <span class="talent-effect utility">[Empathic Resonance: 20% chance to gain healing power when healing allies]</span>`;
    }
    
    return description;
};

// Update description when caster changes
circleHealAbility.updateCaster = function(newCaster) {
    this.caster = newCaster;
    if (this.generateDescription) {
        this.description = this.generateDescription();
    }
};

// Protective Aura - Buff all allies implementation
const protectiveAuraEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Get all allies
    let allAllies = [];
    if (window.gameManager) {
        // Determine if caster is a player or AI character
        const isAI = caster.isAI;
        if (isAI) {
            allAllies = window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
        } else {
            allAllies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
        }
    } else {
        // Fallback for testing when gameManager is not available
        allAllies = [caster];
        console.warn("gameManager not found, only buffing caster");
    }
    
    // Log the ability usage
    let protectiveAuraMessage = `${caster.name} used Protective Aura, buffing all allies with increased armor and healing power`;
    if (caster.empoweredProtection) {
        protectiveAuraMessage += ' and magical damage';
    }
    if (caster.shieldingAura) {
        protectiveAuraMessage += ' and shields';
    }
    protectiveAuraMessage += '.';
    log(protectiveAuraMessage);
    
    // Check for Empowered Protection talent and show VFX
    if (caster instanceof SchoolgirlKokoroCharacter && caster.empoweredProtection) {
        showEmpoweredProtectionVFX(caster);
    }
    
    // Apply buff to all allies
    allAllies.forEach(ally => {
        // Apply the Protective Aura buff
        const buffId = 'protective_aura';
        
        // Check if ally already has the buff
        const existingBuff = ally.buffs.find(b => b.id === buffId);
        if (existingBuff) {
            // Refresh the duration
            existingBuff.duration = 7;
            log(`${ally.name}'s Protective Aura refreshed.`, 'buff');
        } else {
            // Create a new buff using the Effect class constructor
            const buff = new Effect(
                buffId,
                'Protective Aura',
                'Icons/abilities/protective_aura.jfif',
                7, // Duration
                null, // No per-turn effect needed here
                false // isDebuff
            );

            // Define stat modifiers for the buff
            let statModifiers = [
                { stat: 'armor', value: 15, operation: 'add' }, // +15 armor (flat)
                { stat: 'healingPower', value: 0.35, operation: 'add' } // +35% healing power (0.35 as flat increase)
            ];
            
            let buffDescription = '+15% Armor, +35% Healing Power';
            
            // Check for Empowered Protection talent
            if (caster.empoweredProtection) {
                statModifiers.push({ stat: 'magicalDamage', value: 1.17, operation: 'multiply' }); // +17% magical damage (multiply by 1.17)
                buffDescription = '+15% Armor, +35% Healing Power, +17% Magical Damage';
            }
            
            buff.statModifiers = statModifiers;
            buff.setDescription(buffDescription);

            // Custom logic for VFX on apply/remove
            buff.onApply = function(character) {
                let logMessage = `${character.name} gained Protective Aura! (+15% Armor, +35% Healing Power`;
                if (caster.empoweredProtection) {
                    logMessage += ', +17% Magical Damage';
                }
                logMessage += ')';
                log(logMessage, 'buff');
                showProtectiveAuraVFX(character); // Keep the VFX call
            };

            buff.remove = function(character) {
                log(`Protective Aura effect removed from ${character.name}.`, 'status');
                 // If using flat healingPower modifier, no action needed here for removal
                 // If recalculateStats doesn't fully reset, manual restoration might be needed,
                 // but ideally recalculateStats handles it by reapplying from baseStats.
            };
            
            // Add the buff to the character (this will trigger recalculateStats)
            ally.addBuff(buff);
            
            // onApply is called by addBuff if it exists, no need to call manually
        }
        
        // Show VFX for the buff (ensure this runs even if buff is just refreshed)
        showProtectiveAuraVFX(ally);
        
        // Apply shield if Shielding Aura talent is active
        if (caster.shieldingAura) {
            // Use stats.maxHp for max HP, fallback to baseStats if needed
            const maxHP = ally.stats.maxHp || ally.baseStats?.maxHp || ally.baseStats?.hp || ally.stats.hp || 0;  
            const shieldAmount = Math.ceil(maxHP * 0.05); // 5% of max HP
            console.log(`[Shielding Aura Debug] ${ally.name}: maxHP=${maxHP}, shieldAmount=${shieldAmount}`);
            ally.addShield(shieldAmount);
            log(`${ally.name} gained a ${shieldAmount} HP shield from Shielding Aura!`, 'buff');
            showShieldingAuraVFX(ally, shieldAmount);
        }
        
        // Update UI (addBuff calls recalculateStats which calls updateCharacterUI)
        // No need for explicit call here if addBuff handles it
    });
    
    // Play sound
    playSound('sounds/kokoro_keepup.mp3', 0.8); // Kokoro's voice line for R
    
    return true;
};

// Show visual effect for Protective Aura
function showProtectiveAuraVFX(target) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create main buff effect container
        const buffVfx = document.createElement('div');
        buffVfx.className = 'protective-aura-vfx';
        
        // Create buff text display
        const buffText = document.createElement('div');
        buffText.className = 'protective-aura-text';
        buffText.textContent = '+15% ARM, +35% HEAL';
        
        // Create shield container
        const shieldContainer = document.createElement('div');
        shieldContainer.className = 'protective-aura-container';
        
        // Add shield elements
        for (let i = 0; i < 3; i++) {
            const shield = document.createElement('div');
            shield.className = 'protective-shield';
            shield.style.animationDelay = `${i * 0.2}s`;
            shieldContainer.appendChild(shield);
        }
        
        // Add energy particles
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'aura-particle';
            
            // Set random position and animation properties
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const delay = Math.random() * 0.5;
            const duration = 0.8 + Math.random() * 0.7;
            const size = 4 + Math.random() * 6;
            
            particle.style.setProperty('--angle', `${angle}rad`);
            particle.style.setProperty('--distance', `${distance}px`);
            particle.style.setProperty('--delay', `${delay}s`);
            particle.style.setProperty('--duration', `${duration}s`);
            particle.style.setProperty('--size', `${size}px`);
            
            shieldContainer.appendChild(particle);
        }
        
        // Add magic runes
        const runeSymbols = ['✧', '✦', '☥', '☯', '☸', '⚕', '⚜', '⚝'];
        for (let i = 0; i < 5; i++) {
            const rune = document.createElement('div');
            rune.className = 'aura-rune';
            rune.textContent = runeSymbols[Math.floor(Math.random() * runeSymbols.length)];
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 40;
            const delay = Math.random() * 0.6;
            
            rune.style.setProperty('--angle', `${angle}rad`);
            rune.style.setProperty('--distance', `${distance}px`);
            rune.style.setProperty('--delay', `${delay}s`);
            
            shieldContainer.appendChild(rune);
        }
        
        // Add elements to the DOM
        buffVfx.appendChild(buffText);
        buffVfx.appendChild(shieldContainer);
        targetElement.appendChild(buffVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            buffVfx.remove();
        }, 2500);
    }
}

// Show visual effect for Shielding Aura
function showShieldingAuraVFX(target, shieldAmount) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create main shield effect container
        const shieldVfx = document.createElement('div');
        shieldVfx.className = 'shielding-aura-vfx';
        
        // Create shield text display
        const shieldText = document.createElement('div');
        shieldText.className = 'shielding-aura-text';
        shieldText.textContent = `+${shieldAmount} SHIELD`;
        
        // Create shield barrier container
        const barrierContainer = document.createElement('div');
        barrierContainer.className = 'shielding-aura-barrier';
        
        // Add hexagonal shield segments
        for (let i = 0; i < 6; i++) {
            const segment = document.createElement('div');
            segment.className = 'shield-barrier-segment';
            segment.style.transform = `rotate(${i * 60}deg)`;
            segment.style.animationDelay = `${i * 0.1}s`;
            barrierContainer.appendChild(segment);
        }
        
        // Add energy particles
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'shield-energy-particle';
            
            // Set random position and animation properties
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const delay = Math.random() * 0.6;
            const duration = 1.0 + Math.random() * 0.8;
            const size = 3 + Math.random() * 5;
            
            particle.style.setProperty('--angle', `${angle}rad`);
            particle.style.setProperty('--distance', `${distance}px`);
            particle.style.setProperty('--delay', `${delay}s`);
            particle.style.setProperty('--duration', `${duration}s`);
            particle.style.setProperty('--size', `${size}px`);
            
            barrierContainer.appendChild(particle);
        }
        
        // Add shield energy orbs (replacing emojis)
        for (let i = 0; i < 8; i++) {
            const orb = document.createElement('div');
            orb.className = 'shield-energy-orb';
            
            const angle = (i * 45) * (Math.PI / 180); // Convert to radians
            const distance = 65 + Math.random() * 20;
            const delay = Math.random() * 0.4;
            
            orb.style.setProperty('--angle', `${angle}rad`);
            orb.style.setProperty('--distance', `${distance}px`);
            orb.style.setProperty('--delay', `${delay}s`);
            
            barrierContainer.appendChild(orb);
        }
        
        // Add shield pulse waves
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'shield-pulse-wave';
            wave.style.animationDelay = `${i * 0.3}s`;
            barrierContainer.appendChild(wave);
        }
        
        // Add elements to the DOM
        shieldVfx.appendChild(shieldText);
        shieldVfx.appendChild(barrierContainer);
        targetElement.appendChild(shieldVfx);
        
        // Remove VFX after animation completes
        setTimeout(() => {
            shieldVfx.remove();
        }, 3000);
    }
}

// VFX for Lesser Heal damage dealing (when targeting enemies)
function showLesserHealDamageVFX(target, damageAmount, isMagicallyAmplified = false) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        // Create damage VFX container
        const damageVfx = document.createElement('div');
        damageVfx.className = 'lesser-heal-damage-vfx';
        if (isMagicallyAmplified) {
            damageVfx.classList.add('magically-amplified');
        }
        
        // Create damage number
        const damageNumber = document.createElement('div');
        damageNumber.className = 'lesser-heal-damage-number';
        if (isMagicallyAmplified) {
            damageNumber.classList.add('amplified');
            damageNumber.textContent = `-${damageAmount}! AMPLIFIED!`;
        } else {
            damageNumber.textContent = `-${damageAmount}`;
        }
        
        // Create dark energy particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'lesser-heal-damage-particles';
        
        // Create dark healing particles (corrupted healing energy)
        const particleCount = isMagicallyAmplified ? 15 : 10;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'dark-heal-particle';
            if (isMagicallyAmplified) {
                particle.classList.add('amplified');
            }
            
            // Randomize particle properties
            const angle = (i / particleCount) * 360;
            const delay = Math.random() * 0.5;
            const size = (isMagicallyAmplified ? 8 : 6) + Math.random() * 8;
            const distance = (isMagicallyAmplified ? 40 : 30) + Math.random() * 20;
            
            particle.style.setProperty('--angle', `${angle}deg`);
            particle.style.setProperty('--delay', `${delay}s`);
            particle.style.setProperty('--size', `${size}px`);
            particle.style.setProperty('--distance', `${distance}px`);
            
            particlesContainer.appendChild(particle);
        }
        
        // Create corrupted runes
        const runeCount = isMagicallyAmplified ? 8 : 6;
        const runeSymbols = isMagicallyAmplified ? ['♦', '♠', '♣', '⬥', '⬧', '◆', '✦', '✧'] : ['♦', '♠', '♣', '⬥', '⬧', '◆'];
        for (let i = 0; i < runeCount; i++) {
            const rune = document.createElement('div');
            rune.className = 'corrupted-rune';
            if (isMagicallyAmplified) {
                rune.classList.add('amplified');
            }
            rune.textContent = runeSymbols[i];
            
            const angle = (i / runeCount) * 360;
            const delay = Math.random() * 0.8;
            
            rune.style.setProperty('--angle', `${angle}deg`);
            rune.style.setProperty('--delay', `${delay}s`);
            
            particlesContainer.appendChild(rune);
        }
        
        // Add magical amplification waves if talent is active
        if (isMagicallyAmplified) {
            for (let i = 0; i < 3; i++) {
                const wave = document.createElement('div');
                wave.className = 'magical-amplification-wave';
                wave.style.animationDelay = `${i * 0.2}s`;
                particlesContainer.appendChild(wave);
            }
        }
        
        // Add elements to DOM
        damageVfx.appendChild(damageNumber);
        damageVfx.appendChild(particlesContainer);
        targetElement.appendChild(damageVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            damageVfx.remove();
        }, isMagicallyAmplified ? 2500 : 2000);
    }
}

// VFX for splash heal effect
function showLesserHealSplashVFX(target, healAmount) {
    const elementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    if (targetElement) {
        // Create splash heal VFX
        const splashVfx = document.createElement('div');
        splashVfx.className = 'lesser-heal-splash-vfx';
        
        // Create heal number
        const healNumber = document.createElement('div');
        healNumber.className = 'lesser-heal-splash-number';
        healNumber.textContent = `+${healAmount}`;
        
        // Create splash particles
        const splashContainer = document.createElement('div');
        splashContainer.className = 'splash-heal-particles';
        
        // Create small healing droplets
        const dropletCount = 8;
        for (let i = 0; i < dropletCount; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'heal-droplet';
            
            const angle = (i / dropletCount) * 360;
            const delay = Math.random() * 0.3;
            const size = 4 + Math.random() * 6;
            
            droplet.style.setProperty('--angle', `${angle}deg`);
            droplet.style.setProperty('--delay', `${delay}s`);
            droplet.style.setProperty('--size', `${size}px`);
            
            splashContainer.appendChild(droplet);
        }
        
        // Add elements to DOM
        splashVfx.appendChild(healNumber);
        splashVfx.appendChild(splashContainer);
        targetElement.appendChild(splashVfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            splashVfx.remove();
        }, 1500);
    }
}

// Create Protective Aura ability
const protectiveAuraAbility = new Ability(
    'protective_aura',
    'Protective Aura',
    'Icons/abilities/protective_aura.jfif',
    125, // Mana cost
    16,  // Cooldown in turns
    protectiveAuraEffect
).setDescription('Gives 15% Increased armor to all allies and increase their healing power by 35% for 7 turns.')
 .setTargetType('self'); // Target self but affect all allies

// Override description generation to reflect talent changes
protectiveAuraAbility.generateDescription = function() {
    // Get the caster to check for talents
    const caster = this.caster || window.gameManager?.gameState?.selectedCharacter;
    
    let hasEmpathicResonance = false;
    let hasEmpoweredProtection = false;
    
    // Check for Empathic Resonance talent
    if (caster && caster.empathicResonance) {
        hasEmpathicResonance = true;
    }
    
    // Check for Empowered Protection talent
    if (caster && caster.empoweredProtection) {
        hasEmpoweredProtection = true;
    }
    
    let description = 'Gives 15% Increased armor to all allies and increase their healing power by 35% for 7 turns.';
    
    if (hasEmpoweredProtection) {
        description = 'Gives 15% Increased armor, 35% healing power, and <span class="kokoro-enhanced-heal">17% magical damage</span> to all allies for 7 turns.';
        description += ` <span class="talent-effect damage">[Empowered Protection]</span>`;
    }
    
    if (hasEmpathicResonance) {
        description += ` <span class="talent-effect utility">[Note: Empathic Resonance may activate when buffing allies]</span>`;
    }
    
    return description;
};

// Update description when caster changes
protectiveAuraAbility.updateCaster = function(newCaster) {
    this.caster = newCaster;
    if (this.generateDescription) {
        this.description = this.generateDescription();
    }
};

// Register the custom character class and abilities
document.addEventListener('DOMContentLoaded', () => {
    console.log("[KOKORO] Registering character class and abilities");
    
    // IMPORTANT: Fix targeting behavior for existing abilities
    // Ensure ALL abilities require explicit targeting for consistent user experience
    [lesserHealAbility, silencingRingAbility, circleHealAbility, protectiveAuraAbility].forEach(ability => {
        ability.requiresTarget = true;
        console.log(`[KOKORO] Fixed requiresTarget=true for ${ability.id}`);
    });
    
    // Register custom character class
    if (typeof CharacterFactory !== 'undefined' && typeof CharacterFactory.registerCharacterClass === 'function') {
        CharacterFactory.registerCharacterClass('schoolgirl_kokoro', SchoolgirlKokoroCharacter);
    } else {
        console.warn("SchoolgirlKokoroCharacter defined but CharacterFactory not found or registerCharacterClass method missing.");
    }
    
    // Register abilities
    if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
        AbilityFactory.registerAbilities([
            lesserHealAbility,
            silencingRingAbility,
            circleHealAbility,
            protectiveAuraAbility
        ]);
    } else {
        console.warn("Schoolgirl Kokoro abilities defined but AbilityFactory not found or registerAbilities method missing.");
        // Fallback: assign to a global object
        window.definedAbilities = window.definedAbilities || {};
        window.definedAbilities.lesser_heal = lesserHealAbility;
        window.definedAbilities.silencing_ring = silencingRingAbility;
        window.definedAbilities.circle_heal = circleHealAbility;
        window.definedAbilities.protective_aura = protectiveAuraAbility;
    }
});

// Listen for talent changes to update descriptions
document.addEventListener('abilityDescriptionUpdated', (event) => {
    if (event.detail && event.detail.character && event.detail.character.id === 'schoolgirl_kokoro') {
        console.log("[KOKORO] Updating ability descriptions due to talent change");
        const character = event.detail.character;
        if (typeof character.updateAbilityDescriptions === 'function') {
            character.updateAbilityDescriptions();
        }
    }
});

// Also listen for character initialized events to set up descriptions
document.addEventListener('characterInitialized', (event) => {
    if (event.detail && event.detail.character && event.detail.character.id === 'schoolgirl_kokoro') {
        console.log("[KOKORO] Character initialized, updating descriptions");
        const character = event.detail.character;
        setTimeout(() => {
            if (typeof character.updateAbilityDescriptions === 'function') {
                character.updateAbilityDescriptions();
            }
        }, 100);
    }
});

// Show visual effect for Empathic Resonance talent trigger
function showEmpathicResonanceVFX(character, stacks = 1) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create empathic resonance effect
            const resonanceVfx = document.createElement('div');
            resonanceVfx.className = 'empathic-resonance-vfx';
            
            // Create floating buff text
            const buffText = document.createElement('div');
            buffText.className = 'empathic-resonance-text';
            buffText.textContent = `Empathic Resonance ${stacks > 1 ? `(${stacks})` : ''}`;
            
            // Create heart particle container
            const heartContainer = document.createElement('div');
            heartContainer.className = 'empathic-resonance-hearts';
            
            // Add heart particles based on stack count
            const heartCount = Math.min(stacks * 2 + 3, 8); // 3-8 hearts based on stacks
            for (let i = 0; i < heartCount; i++) {
                const heart = document.createElement('div');
                heart.className = 'empathic-heart';
                heart.textContent = '💖';
                
                // Randomize heart positions and animations
                const angle = (i / heartCount) * 360 + Math.random() * 30;
                const delay = Math.random() * 0.5;
                const distance = 40 + Math.random() * 30;
                
                heart.style.setProperty('--angle', `${angle}deg`);
                heart.style.setProperty('--delay', `${delay}s`);
                heart.style.setProperty('--distance', `${distance}px`);
                
                heartContainer.appendChild(heart);
            }
            
            // Create empathy waves
            for (let i = 0; i < 3; i++) {
                const wave = document.createElement('div');
                wave.className = 'empathy-wave';
                wave.style.animationDelay = `${i * 0.2}s`;
                heartContainer.appendChild(wave);
            }
            
            // Add elements to the DOM
            resonanceVfx.appendChild(buffText);
            resonanceVfx.appendChild(heartContainer);
            characterElement.appendChild(resonanceVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (resonanceVfx.parentNode) resonanceVfx.remove();
            }, 2500);
        } catch (error) {
            console.error('[Empathic Resonance VFX] Error:', error);
        }
    }
}

// Show visual effect for Circle Heal Mastery talent
function showCircleHealMasteryVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create circle heal mastery effect
            const masteryVfx = document.createElement('div');
            masteryVfx.className = 'circle-heal-mastery-vfx';
            
            // Create floating text
            const masteryText = document.createElement('div');
            masteryText.className = 'circle-heal-mastery-text';
            masteryText.textContent = 'Circle Heal Mastery!';
            
            // Add elements to the DOM
            masteryVfx.appendChild(masteryText);
            characterElement.appendChild(masteryVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (masteryVfx.parentNode) masteryVfx.remove();
            }, 2000);
        } catch (error) {
            console.error('[Circle Heal Mastery VFX] Error:', error);
        }
    }
}

// Show visual effect for Empowered Protection talent
function showEmpoweredProtectionVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create empowered protection effect
            const protectionVfx = document.createElement('div');
            protectionVfx.className = 'empowered-protection-vfx';
            
            // Create floating text
            const protectionText = document.createElement('div');
            protectionText.className = 'empowered-protection-text';
            protectionText.textContent = 'Empowered Protection!';
            
            // Add elements to the DOM
            protectionVfx.appendChild(protectionText);
            characterElement.appendChild(protectionVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (protectionVfx.parentNode) protectionVfx.remove();
            }, 2200);
        } catch (error) {
            console.error('[Empowered Protection VFX] Error:', error);
        }
    }
}

// Show visual effect for Transcendent Healing talent
function showTranscendentHealingVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create transcendent healing effect
            const transcendentVfx = document.createElement('div');
            transcendentVfx.className = 'transcendent-healing-vfx';
            
            // Create floating text
            const transcendentText = document.createElement('div');
            transcendentText.className = 'transcendent-healing-text';
            transcendentText.textContent = 'Transcendent Healing!';
            
            // Add elements to the DOM
            transcendentVfx.appendChild(transcendentText);
            characterElement.appendChild(transcendentVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (transcendentVfx.parentNode) transcendentVfx.remove();
            }, 2500);
        } catch (error) {
            console.error('[Transcendent Healing VFX] Error:', error);
        }
    }
}

// Show visual effect for Divine Resonance talent
function showDivineResonanceVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create divine resonance effect
            const divineVfx = document.createElement('div');
            divineVfx.className = 'divine-resonance-vfx';
            
            // Create floating text
            const divineText = document.createElement('div');
            divineText.className = 'divine-resonance-text';
            divineText.textContent = 'Divine Resonance!';
            
            // Create resonance wave container
            const waveContainer = document.createElement('div');
            waveContainer.className = 'divine-resonance-waves';
            
            // Add multiple divine waves
            for (let i = 0; i < 5; i++) {
                const wave = document.createElement('div');
                wave.className = 'divine-wave';
                wave.style.animationDelay = `${i * 0.15}s`;
                wave.style.setProperty('--wave-size', `${80 + i * 40}px`);
                waveContainer.appendChild(wave);
            }
            
            // Create divine particles
            const particleContainer = document.createElement('div');
            particleContainer.className = 'divine-resonance-particles';
            
            // Add celestial particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'celestial-particle';
                particle.textContent = ['✦', '✧', '✨', '⭐', '💫', '🌟'][i % 6];
                
                const angle = (i / 12) * 360;
                const delay = Math.random() * 0.8;
                const distance = 60 + Math.random() * 40;
                
                particle.style.setProperty('--angle', `${angle}deg`);
                particle.style.setProperty('--delay', `${delay}s`);
                particle.style.setProperty('--distance', `${distance}px`);
                
                particleContainer.appendChild(particle);
            }
            
            // Add elements to the DOM
            divineVfx.appendChild(divineText);
            divineVfx.appendChild(waveContainer);
            divineVfx.appendChild(particleContainer);
            characterElement.appendChild(divineVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (divineVfx.parentNode) divineVfx.remove();
            }, 3000);
        } catch (error) {
            console.error('[Divine Resonance VFX] Error:', error);
        }
    }
}

// Show visual effect for Mana Disruption talent
function showManaDisruptionVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create mana disruption indicator
            const disruptionIndicator = document.createElement('div');
            disruptionIndicator.className = 'mana-disruption-indicator';
            disruptionIndicator.id = `mana-disruption-${elementId}`;
            
            // Create disruption text
            const disruptionText = document.createElement('div');
            disruptionText.className = 'mana-disruption-text';
            disruptionText.textContent = '2x MANA';
            
            // Create disruption particles
            const particleContainer = document.createElement('div');
            particleContainer.className = 'mana-disruption-particles';
            
            // Add disruption particles
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('div');
                particle.className = 'disruption-particle';
                particle.style.animationDelay = `${i * 0.2}s`;
                particleContainer.appendChild(particle);
            }
            
            // Add elements to the DOM
            disruptionIndicator.appendChild(disruptionText);
            disruptionIndicator.appendChild(particleContainer);
            characterElement.appendChild(disruptionIndicator);
            
        } catch (error) {
            console.error('[Mana Disruption VFX] Error:', error);
        }
    }
}

// Remove visual effect for Mana Disruption talent
function removeManaDisruptionVFX(character) {
    const elementId = character.instanceId || character.id;
    const indicator = document.getElementById(`mana-disruption-${elementId}`);
    if (indicator) {
        indicator.remove();
    }
}

// Apply Empathic Conversion talent effect
function applyEmpathicConversion(caster, damageDealt) {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    
    // Get all allies (including self)
    let allAllies = [];
    if (window.gameManager) {
        const isAI = caster.isAI;
        if (isAI) {
            allAllies = window.gameManager.gameState.aiCharacters.filter(char => !char.isDead());
        } else {
            allAllies = window.gameManager.gameState.playerCharacters.filter(char => !char.isDead());
        }
    } else {
        // Fallback for testing
        allAllies = [caster];
    }
    
    if (allAllies.length === 0) return;
    
    // Find ally with lowest current HP percentage
    let lowestHPAlly = allAllies[0];
    let lowestHPPercentage = lowestHPAlly.stats.hp / lowestHPAlly.stats.maxHp;
    
    for (const ally of allAllies) {
        const hpPercentage = ally.stats.hp / ally.stats.maxHp;
        if (hpPercentage < lowestHPPercentage) {
            lowestHPPercentage = hpPercentage;
            lowestHPAlly = ally;
        }
    }
    
    // Convert 100% of damage into healing
    const conversionHealAmount = damageDealt;
    
    // Apply healing with proper tracking
    const actualHeal = lowestHPAlly.heal(conversionHealAmount, caster, { 
        abilityId: 'empathic_conversion', 
        suppressDefaultVFX: true,
        healType: 'conversion' 
    });
    
    // Log the conversion
    let conversionMessage = `${caster.name}'s Empathic Conversion heals ${lowestHPAlly.name} for ${actualHeal.healAmount} HP!`;
    if (actualHeal.isCritical) {
        conversionMessage += " (Critical Heal!)";
    }
    log(conversionMessage, 'utility');
    
    // Show special VFX for empathic conversion
    showEmpathicConversionVFX(caster, lowestHPAlly, actualHeal.healAmount, actualHeal.isCritical);
    
    // Check for Empathic Resonance talent trigger (only if healing an ally, not self)
    if (caster instanceof SchoolgirlKokoroCharacter && lowestHPAlly !== caster) {
        caster.checkEmpathicResonance(lowestHPAlly, caster);
    }
}

// Show visual effect for Magical Amplification talent
function showMagicalAmplificationVFX(character) {
    const elementId = character.instanceId || character.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        try {
            // Create magical amplification effect
            const amplificationVfx = document.createElement('div');
            amplificationVfx.className = 'magical-amplification-trigger-vfx';
            
            // Create floating text
            const amplificationText = document.createElement('div');
            amplificationText.className = 'magical-amplification-trigger-text';
            amplificationText.textContent = 'Magical Amplification!';
            
            // Create magic circle container
            const circleContainer = document.createElement('div');
            circleContainer.className = 'magical-amplification-circles';
            
            // Add multiple magic circles
            for (let i = 0; i < 3; i++) {
                const circle = document.createElement('div');
                circle.className = 'magic-amplification-circle';
                circle.style.animationDelay = `${i * 0.2}s`;
                circle.style.setProperty('--size', `${80 + i * 30}px`);
                circleContainer.appendChild(circle);
            }
            
            // Create energy particles
            const particleContainer = document.createElement('div');
            particleContainer.className = 'magical-amplification-trigger-particles';
            
            // Add energy particles
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'amplification-energy-particle';
                
                const angle = (i / 12) * 360;
                const delay = Math.random() * 0.6;
                const distance = 50 + Math.random() * 30;
                
                particle.style.setProperty('--angle', `${angle}deg`);
                particle.style.setProperty('--delay', `${delay}s`);
                particle.style.setProperty('--distance', `${distance}px`);
                
                particleContainer.appendChild(particle);
            }
            
            // Add elements to the DOM
            amplificationVfx.appendChild(amplificationText);
            amplificationVfx.appendChild(circleContainer);
            amplificationVfx.appendChild(particleContainer);
            characterElement.appendChild(amplificationVfx);
            
            // Remove VFX after animation completes
            setTimeout(() => {
                if (amplificationVfx.parentNode) amplificationVfx.remove();
            }, 2500);
        } catch (error) {
            console.error('[Magical Amplification VFX] Error:', error);
        }
    }
}

// Show visual effect for Empathic Conversion talent
function showEmpathicConversionVFX(caster, healedAlly, healAmount, isCritical = false) {
    try {
        // Show effect on caster (source of conversion)
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const conversionSourceVfx = document.createElement('div');
            conversionSourceVfx.className = 'empathic-conversion-source-vfx';
            
            const sourceText = document.createElement('div');
            sourceText.className = 'empathic-conversion-source-text';
            sourceText.textContent = 'Empathic Conversion';
            
            // Create energy transfer beam preparation
            const energyPrep = document.createElement('div');
            energyPrep.className = 'conversion-energy-prep';
            
            conversionSourceVfx.appendChild(sourceText);
            conversionSourceVfx.appendChild(energyPrep);
            casterElement.appendChild(conversionSourceVfx);
            
            setTimeout(() => conversionSourceVfx.remove(), 2000);
        }
        
        // Show healing effect on target ally
        const healedElement = document.getElementById(`character-${healedAlly.instanceId || healedAlly.id}`);
        if (healedElement) {
            const conversionHealVfx = document.createElement('div');
            conversionHealVfx.className = 'empathic-conversion-heal-vfx';
            if (isCritical) {
                conversionHealVfx.classList.add('critical-heal');
            }
            
            // Create heal number
            const healNumber = document.createElement('div');
            healNumber.className = 'empathic-conversion-heal-number';
            if (isCritical) {
                healNumber.classList.add('critical');
                healNumber.textContent = `+${healAmount}! CONVERSION CRIT!`;
            } else {
                healNumber.textContent = `+${healAmount} CONVERTED`;
            }
            
            // Create conversion particle container
            const conversionParticles = document.createElement('div');
            conversionParticles.className = 'empathic-conversion-particles';
            
            // Add heart-to-light conversion particles
            const particleCount = 12;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'conversion-particle';
                
                const angle = (i / particleCount) * 360;
                const delay = Math.random() * 0.5;
                const distance = 40 + Math.random() * 30;
                
                particle.style.setProperty('--angle', `${angle}deg`);
                particle.style.setProperty('--delay', `${delay}s`);
                particle.style.setProperty('--distance', `${distance}px`);
                
                conversionParticles.appendChild(particle);
            }
            
            // Add empathy waves
            for (let i = 0; i < 3; i++) {
                const wave = document.createElement('div');
                wave.className = 'empathic-conversion-wave';
                wave.style.animationDelay = `${i * 0.3}s`;
                conversionParticles.appendChild(wave);
            }
            
            // Add healing aura
            const healingAura = document.createElement('div');
            healingAura.className = 'conversion-healing-aura';
            
            conversionHealVfx.appendChild(healNumber);
            conversionHealVfx.appendChild(conversionParticles);
            conversionHealVfx.appendChild(healingAura);
            healedElement.appendChild(conversionHealVfx);
            
            setTimeout(() => conversionHealVfx.remove(), 3000);
        }
        
        // Create energy transfer beam effect between caster and healed ally
        if (caster !== healedAlly) {
            showEmpathicConversionBeam(caster, healedAlly);
        }
        
    } catch (error) {
        console.error('[Empathic Conversion VFX] Error:', error);
    }
}

// Show energy transfer beam between caster and healed ally
function showEmpathicConversionBeam(caster, healedAlly) {
    try {
        const battleContainer = document.querySelector('.battle-container');
        if (!battleContainer) return;
        
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const healedElement = document.getElementById(`character-${healedAlly.instanceId || healedAlly.id}`);
        
        if (!casterElement || !healedElement) return;
        
        const casterRect = casterElement.getBoundingClientRect();
        const healedRect = healedElement.getBoundingClientRect();
        const containerRect = battleContainer.getBoundingClientRect();
        
        // Calculate positions relative to battle container
        const startX = casterRect.left + casterRect.width / 2 - containerRect.left;
        const startY = casterRect.top + casterRect.height / 2 - containerRect.top;
        const endX = healedRect.left + healedRect.width / 2 - containerRect.left;
        const endY = healedRect.top + healedRect.height / 2 - containerRect.top;
        
        // Calculate beam properties
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Create beam element
        const beam = document.createElement('div');
        beam.className = 'empathic-conversion-beam';
        beam.style.position = 'absolute';
        beam.style.left = `${startX}px`;
        beam.style.top = `${startY}px`;
        beam.style.width = `${distance}px`;
        beam.style.height = '4px';
        beam.style.transform = `rotate(${angle}deg)`;
        beam.style.transformOrigin = '0 50%';
        beam.style.zIndex = '15';
        
        battleContainer.appendChild(beam);
        
        // Remove beam after animation
        setTimeout(() => {
            if (beam.parentNode) beam.remove();
        }, 1500);
        
    } catch (error) {
        console.error('[Empathic Conversion Beam] Error:', error);
    }
}

// Update visual effects for Empathic Conversion talent
function updateEmpathicConversionVisuals(character) {
    if (!character) return;
    
    try {
        // Find all possible Lesser Heal ability elements with different selectors
        const selectors = [
            '.ability[data-ability-id="lesser_heal"]',
            '.ability[data-id="lesser_heal"]', 
            '.ability-button[data-ability-id="lesser_heal"]',
            '.ability-button[data-id="lesser_heal"]',
            '[data-ability="lesser_heal"]',
            '.lesser-heal-ability'
        ];
        
        selectors.forEach(selector => {
            const abilityElements = document.querySelectorAll(selector);
            abilityElements.forEach(abilityElement => {
                if (character.empathicConversion) {
                    // Add purple filter class
                    abilityElement.classList.add('empathic-conversion-active');
                    console.log(`[Empathic Conversion] Applied purple filter to Lesser Heal ability (${selector})`);
                } else {
                    // Remove purple filter class
                    abilityElement.classList.remove('empathic-conversion-active');
                    console.log(`[Empathic Conversion] Removed purple filter from Lesser Heal ability (${selector})`);
                }
            });
        });
        
        // Also apply to any images within these elements directly
        const imageElements = document.querySelectorAll('img[src*="lesser_heal"], img[alt*="lesser heal"], img[alt*="Lesser Heal"]');
        imageElements.forEach(img => {
            const parentAbility = img.closest('.ability, .ability-button');
            if (parentAbility) {
                if (character.empathicConversion) {
                    parentAbility.classList.add('empathic-conversion-active');
                    console.log(`[Empathic Conversion] Applied purple filter to Lesser Heal image parent`);
                } else {
                    parentAbility.classList.remove('empathic-conversion-active');
                }
            }
        });
        
    } catch (error) {
        console.error('[Empathic Conversion Visuals] Error:', error);
    }
}

// Initialize visual updates for Empathic Conversion talent
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Update visuals when talents are changed
        document.addEventListener('talentUpdated', (event) => {
            if (event.detail && event.detail.talentId === 'empathic_conversion') {
                updateEmpathicConversionVisuals(event.detail.character);
            }
        });
        
        // Update visuals when character stats are recalculated
        document.addEventListener('characterStatsUpdated', (event) => {
            if (event.detail && event.detail.character) {
                updateEmpathicConversionVisuals(event.detail.character);
            }
        });
        
        // Update visuals on battle start
        document.addEventListener('battleStarted', (event) => {
            if (window.gameManager && window.gameManager.gameState) {
                const allCharacters = [
                    ...window.gameManager.gameState.playerCharacters,
                    ...window.gameManager.gameState.aiCharacters
                ];
                allCharacters.forEach(char => {
                    if (char.id === 'schoolgirl_kokoro' || char.characterId === 'schoolgirl_kokoro') {
                        updateEmpathicConversionVisuals(char);
                    }
                });
            }
        });
    });
}

// Set up generateDescription methods for Kokoro's abilities
function setupKokoroAbilityDescriptions() {
    // Find Kokoro character instances and attach generateDescription methods
    const kokoroCharacters = [];
    
    // Check player characters
    if (window.gameManager && window.gameManager.playerCharacters) {
        kokoroCharacters.push(...window.gameManager.playerCharacters.filter(char => char.id === 'schoolgirl_kokoro'));
    }
    
    // Check AI characters  
    if (window.gameManager && window.gameManager.aiCharacters) {
        kokoroCharacters.push(...window.gameManager.aiCharacters.filter(char => char.id === 'schoolgirl_kokoro'));
    }
    
    kokoroCharacters.forEach(character => {
        setupKokoroAbilityDescriptionsForCharacter(character);
    });
}

function setupKokoroAbilityDescriptionsForCharacter(character) {
    if (!character || character.id !== 'schoolgirl_kokoro') return;
    
    console.log(`[Kokoro] Setting up generateDescription for ${character.name}`);
    
    // Set up Lesser Heal generateDescription
    const lesserHealAbility = character.abilities.find(a => a.id === 'lesser_heal');
    if (lesserHealAbility) {
        lesserHealAbility.baseDescription = "Heals the selected ally or herself for 410HP.";
        lesserHealAbility.generateDescription = function() {
            let healAmount = 410;
            let description = "";
            const caster = character;
            
            // Check for Enhanced Lesser Heal talent
            if (caster.enhancedLesserHeal) {
                healAmount = 580;
            }
            
            // Check if can target enemies
            const canTargetEnemies = this.canTargetEnemies || false;
            
            if (canTargetEnemies) {
                let damagePercent = 50;
                if (caster.magicalAmplification) {
                    damagePercent = 100;
                }
                description = `Heals allies for <span class="kokoro-enhanced-heal">${healAmount}</span>HP or deals <span class="kokoro-enhanced-heal">${damagePercent}%</span> of heal amount as magical damage to enemies.`;
                
                // Add talent effects
                const talentEffects = [];
                if (caster.enhancedLesserHeal) {
                    talentEffects.push('<span class="talent-effect healing">[Enhanced Lesser Heal]</span>');
                }
                if (caster.overhealMastery) {
                    talentEffects.push('<span class="talent-effect utility">[Overheal Mastery: Excess healing becomes shield]</span>');
                }
                if (caster.cooldownMastery) {
                    talentEffects.push('<span class="talent-effect utility">[Cooldown Mastery]</span>');
                }
                if (caster.manaInfusion) {
                    talentEffects.push('<span class="talent-effect resource">[Mana Infusion: +10% mana]</span>');
                }
                if (caster.healingEfficiency) {
                    talentEffects.push('<span class="talent-effect utility">[Healing Efficiency: 23% no turn end]</span>');
                }
                
                if (talentEffects.length > 0) {
                    description += ' ' + talentEffects.join(' ');
                }
            } else {
                description = `Heals the selected ally or herself for <span class="kokoro-enhanced-heal">${healAmount}</span>HP.`;
                
                // Add talent effects
                const talentEffects = [];
                if (caster.enhancedLesserHeal) {
                    talentEffects.push('<span class="talent-effect healing">[Enhanced Lesser Heal]</span>');
                }
                if (caster.overhealMastery) {
                    talentEffects.push('<span class="talent-effect utility">[Overheal Mastery: Excess healing becomes shield]</span>');
                }
                if (caster.cooldownMastery) {
                    talentEffects.push('<span class="talent-effect utility">[Cooldown Mastery]</span>');
                }
                if (caster.manaInfusion) {
                    talentEffects.push('<span class="talent-effect resource">[Mana Infusion: +10% mana]</span>');
                }
                if (caster.healingEfficiency) {
                    talentEffects.push('<span class="talent-effect utility">[Healing Efficiency: 23% no turn end]</span>');
                }
                
                if (talentEffects.length > 0) {
                    description += ' ' + talentEffects.join(' ');
                }
            }
            
            return description;
        };
        console.log(`[Kokoro] Set up Lesser Heal generateDescription`);
    }
    
    // Set up Circle Heal generateDescription
    const circleHealAbility = character.abilities.find(a => a.id === 'circle_heal');
    if (circleHealAbility) {
        circleHealAbility.baseDescription = "Heals all allies for 250HP + 150% of Magic Damage.";
        circleHealAbility.generateDescription = function() {
            const caster = character;
            let magicalDamagePercent = 150;
            let description = "";
            
            // Check for Transcendent Healing talent
            if (caster.transcendentHealing) {
                magicalDamagePercent = 200;
            }
            
            description = `Heals all allies for <span class="kokoro-enhanced-heal">250</span>HP + <span class="kokoro-enhanced-heal">${magicalDamagePercent}%</span> of Magic Damage.`;
            
            // Add talent effects
            const talentEffects = [];
            if (caster.transcendentHealing) {
                talentEffects.push('<span class="talent-effect healing">[Transcendent Healing]</span>');
            }
            if (caster.divineResonance) {
                talentEffects.push('<span class="talent-effect healing">[Divine Resonance: 40% double cast]</span>');
            }
            if (caster.manaInfusion) {
                talentEffects.push('<span class="talent-effect resource">[Mana Infusion: +10% mana]</span>');
            }
            
            if (talentEffects.length > 0) {
                description += ' ' + talentEffects.join(' ');
            }
            
            return description;
        };
        console.log(`[Kokoro] Set up Circle Heal generateDescription`);
    }
}

// Global function to set up Kokoro abilities after character creation
window.setupKokoroAbilityDescriptionsForCharacter = setupKokoroAbilityDescriptionsForCharacter;

// Call setup when characters are created
if (typeof window !== 'undefined') {
    document.addEventListener('characterCreated', (event) => {
        if (event.detail && event.detail.character && event.detail.character.id === 'schoolgirl_kokoro') {
            console.log(`[Kokoro] Character created event received for ${event.detail.character.name}`);
            setTimeout(() => {
                setupKokoroAbilityDescriptionsForCharacter(event.detail.character);
            }, 100);
        }
    });
    
    // Also set up on game start
    document.addEventListener('gameStarted', () => {
        setTimeout(setupKokoroAbilityDescriptions, 200);
    });
}

// Healing Efficiency VFX - shows when the talent prevents turn from ending
function showHealingEfficiencyVFX(character) {
    const elementId = character.instanceId || character.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    
    if (!targetElement) {
        console.warn(`[Healing Efficiency VFX] Character element not found for ${character.name}`);
        return;
    }
    
    console.log(`[Healing Efficiency VFX] Showing VFX for ${character.name}`);
    
    // Create main efficiency effect container
    const efficiencyVfx = document.createElement('div');
    efficiencyVfx.className = 'healing-efficiency-vfx';
    
    // Create efficiency text
    const efficiencyText = document.createElement('span');
    efficiencyText.className = 'healing-efficiency-text';
    efficiencyText.textContent = 'HEALING EFFICIENCY!';
    
    // Create efficiency particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'healing-efficiency-particles';
    
    // Create fast healing particles (speed/efficiency themes)
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'efficiency-particle';
        particle.style.animationDelay = `${i * 0.08}s`;
        
        // Position particles in a circle around the character
        const angle = (i / 8) * 360;
        particle.style.setProperty('--angle', `${angle}deg`);
        particle.style.setProperty('--particle-index', i);
        
        particlesContainer.appendChild(particle);
    }
    
    // Create efficiency waves (speed lines)
    const wavesContainer = document.createElement('div');
    wavesContainer.className = 'healing-efficiency-waves';
    
    for (let i = 0; i < 4; i++) {
        const wave = document.createElement('div');
        wave.className = 'efficiency-wave';
        wave.style.animationDelay = `${i * 0.15}s`;
        wavesContainer.appendChild(wave);
    }
    
    // Create energy streams for efficiency theme
    const streamContainer = document.createElement('div');
    streamContainer.className = 'healing-efficiency-streams';
    
    for (let i = 0; i < 6; i++) {
        const stream = document.createElement('div');
        stream.className = 'efficiency-stream';
        stream.style.animationDelay = `${i * 0.1}s`;
        
        // Create different stream directions
        const angle = (i / 6) * 360;
        stream.style.setProperty('--stream-angle', `${angle}deg`);
        
        streamContainer.appendChild(stream);
    }
    
    // Add all elements to the container
    efficiencyVfx.appendChild(efficiencyText);
    efficiencyVfx.appendChild(particlesContainer);
    efficiencyVfx.appendChild(wavesContainer);
    efficiencyVfx.appendChild(streamContainer);
    
    // Add the VFX to the character element
    targetElement.appendChild(efficiencyVfx);
    
    // Add temporary glow effect to character
    const imageContainer = targetElement.querySelector('.image-container');
    if (imageContainer) {
        imageContainer.classList.add('healing-efficiency-active');
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        efficiencyVfx.remove();
        if (imageContainer) {
            imageContainer.classList.remove('healing-efficiency-active');
        }
    }, 2500);
    
    console.log(`[Healing Efficiency VFX] VFX created and will be removed after 2.5s`);
}

// Overheal Mastery VFX - shows when shields are applied through overheal
function showOverhealMasteryVFX(character, shieldAmount) {
    try {
        const elementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${elementId}`);
        
        if (!characterElement) {
            console.error(`[Overheal Mastery VFX] Character element not found for ${character.name}`);
            return;
        }
        
        console.log(`[Overheal Mastery VFX] Showing VFX for ${character.name} with ${shieldAmount} shield`);
        
        // Create the VFX container
        const overhealVfx = document.createElement('div');
        overhealVfx.className = 'overheal-mastery-vfx';
        
        // Shield amount text
        const shieldText = document.createElement('div');
        shieldText.className = 'overheal-mastery-text';
        shieldText.textContent = `+${shieldAmount} Shield!`;
        
        // Create particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'overheal-mastery-particles';
        
        // Create shield particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'overheal-particle';
            particlesContainer.appendChild(particle);
        }
        
        // Create shield barrier visual
        const barrierContainer = document.createElement('div');
        barrierContainer.className = 'overheal-barrier';
        
        for (let i = 0; i < 6; i++) {
            const segment = document.createElement('div');
            segment.className = 'overheal-barrier-segment';
            barrierContainer.appendChild(segment);
        }
        
        // Append elements
        overhealVfx.appendChild(shieldText);
        overhealVfx.appendChild(particlesContainer);
        overhealVfx.appendChild(barrierContainer);
        characterElement.appendChild(overhealVfx);
        
        // Add active class to character
        characterElement.classList.add('overheal-mastery-active');
        
        // Cleanup after animation
        setTimeout(() => {
            if (overhealVfx.parentNode) {
                overhealVfx.remove();
            }
            characterElement.classList.remove('overheal-mastery-active');
        }, 3000);
        
    } catch (error) {
        console.error('[Overheal Mastery VFX] Error:', error);
    }
}

// Protective Healing VFX - shows when shields are applied through the talent
function showProtectiveHealingVFX(character, shieldAmount) {
    const elementId = character.instanceId || character.id;
    const targetElement = document.getElementById(`character-${elementId}`);
    
    if (!targetElement) {
        console.warn(`[Protective Healing VFX] Character element not found for ${character.name}`);
        return;
    }
    
    console.log(`[Protective Healing VFX] Showing VFX for ${character.name} with ${shieldAmount} shield`);
    
    // Create main protective effect container
    const protectiveVfx = document.createElement('div');
    protectiveVfx.className = 'protective-healing-vfx';
    
    // Create shield text
    const shieldText = document.createElement('span');
    shieldText.className = 'protective-healing-text';
    shieldText.textContent = `+${shieldAmount} Shield`;
    
    // Create protective particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'protective-healing-particles';
    
    // Create shield particles
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'protective-particle';
        particle.style.animationDelay = `${i * 0.1}s`;
        
        // Position particles in a defensive formation
        const angle = (i / 6) * 360;
        particle.style.setProperty('--angle', `${angle}deg`);
        particle.style.setProperty('--particle-index', i);
        
        particlesContainer.appendChild(particle);
    }
    
    // Create shield barrier effect
    const barrierContainer = document.createElement('div');
    barrierContainer.className = 'protective-healing-barrier';
    
    for (let i = 0; i < 4; i++) {
        const barrier = document.createElement('div');
        barrier.className = 'protective-barrier-segment';
        barrier.style.animationDelay = `${i * 0.15}s`;
        barrierContainer.appendChild(barrier);
    }
    
    // Add all elements to the container
    protectiveVfx.appendChild(shieldText);
    protectiveVfx.appendChild(particlesContainer);
    protectiveVfx.appendChild(barrierContainer);
    
    // Add the VFX to the character element
    targetElement.appendChild(protectiveVfx);
    
    // Add temporary glow effect to character
    const imageContainer = targetElement.querySelector('.image-container');
    if (imageContainer) {
        imageContainer.classList.add('protective-healing-active');
    }
    
    // Remove VFX after animation completes
    setTimeout(() => {
        protectiveVfx.remove();
        if (imageContainer) {
            imageContainer.classList.remove('protective-healing-active');
        }
    }, 2000);
    
    console.log(`[Protective Healing VFX] VFX created and will be removed after 2s`);
}