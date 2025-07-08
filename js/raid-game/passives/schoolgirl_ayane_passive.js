// Passive Handler for Schoolgirl Ayane

class SchoolgirlAyanePassive {
    constructor() {
        this.passiveId = 'schoolgirl_ayane_passive';
        this.buffId = 'schoolgirl_ayane_passive_ad_buff';
        this.buffName = 'Combat Reflex';
        this.buffIcon = 'Icons/abilities/passive_schoolgirl_ayane.webp'; // Correct path
        this.physicalDamageBonus = 200;
        this.buffDuration = 5; 
        
        // Butterfly Guardian tracking
        this.butterflyGuardianActive = false;
        this.boundOnTurnStart = null;
    }

    initialize(character) {
        // Optional: Can be used for setup when the character is created
        console.log(`[AYANE PASSIVE] Schoolgirl Ayane Passive initialized for ${character.name}`);
        console.log(`[AYANE PASSIVE] Character ID: ${character.id}`);
        console.log(`[AYANE PASSIVE] Passive Handler onDodge available: ${typeof this.onDodge === 'function'}`);
        
        // Store character reference for talent modifications
        this.character = character;
        
        // Apply Butterfly Vitality permanent buff if talent is active
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t14')) {
            this.applyButterflyVitalityBuff(character);
        }
        
        // Set up event listeners for damage dealt events (for vampirism)
        this.setupDamageEventListeners();
        
        // Track turn start for Butterfly Guardian talent
        this.trackTurnStartForButterflyGuardian(character);
    }

    /**
     * Set up event listeners for damage dealt events
     */
    setupDamageEventListeners() {
        // Bind the event handler to preserve context
        this.boundOnDamageDealt = this.handleDamageDealtEvent.bind(this);
        
        // Listen for damage dealt events
        document.addEventListener('character:damage-dealt', this.boundOnDamageDealt);
        console.log(`[AYANE PASSIVE] Set up damage event listeners for ${this.character.name}`);
    }

    /**
     * Handle damage dealt events from the global event system
     * @param {CustomEvent} event - The damage dealt event
     */
    handleDamageDealtEvent(event) {
        if (!event.detail) return;
        
        const { character, damage, target } = event.detail;
        
        // Check if this is our character dealing damage
        if (character === this.character) {
            console.log(`[AYANE PASSIVE] handleDamageDealtEvent - ${character.name} dealt ${damage} damage to ${target.name}`);
            this.onDamageDealt(character, damage, target);
        }
    }

    /**
     * Called when the character successfully dodges an attack.
     * @param {Character} character - The character instance (Ayane) that dodged.
     */
    onDodge(character) {
        console.log(`[AYANE PASSIVE] onDodge called for ${character.name}!`);
        console.log(`[AYANE PASSIVE] Applied talents:`, character.appliedTalents);
        console.log(`[AYANE PASSIVE] Has Butterfly Healing talent:`, character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t12'));
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        log(`${character.name}'s Combat Reflexes triggers after dodging!`);
        playSound('sounds/ayane_fucker2.mp3'); // Play dodge sound

        // Calculate the total physical damage bonus (base + talent enhancement)
        let totalDamageBonus = this.physicalDamageBonus;
        let isEnhanced = false;
        
        // Check for Enhanced Reflexes talent (adds +55 Physical Damage)
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t4')) {
            totalDamageBonus += 55;
            isEnhanced = true;
            console.log(`[AYANE PASSIVE] Enhanced Reflexes talent active: +55 bonus damage (total: ${totalDamageBonus})`);
        }

        // Create the Physical Damage buff with the calculated total and enhanced styling
        const damageText = isEnhanced 
            ? `<span class="talent-enhanced">+${totalDamageBonus}</span>` 
            : `+${totalDamageBonus}`;
        
        const adBuff = new Effect(
            this.buffId,
            this.buffName,
            this.buffIcon,
            this.buffDuration,
            null, // No per-turn effect
            false // Not a debuff
        ).setDescription(`${damageText} Physical Damage for ${this.buffDuration} turns.`);

        // Add the stat modifier with the calculated total
        adBuff.statModifiers = [{ stat: 'physicalDamage', value: totalDamageBonus, operation: 'add' }];

        // Define remove function for cleanup
        adBuff.onRemove = (char) => {
            log(`${char.name}'s Combat Reflex bonus fades.`);
            // Note: Stat reversion is handled by the core Character.removeBuff method
        };

        // Apply the buff (or refresh duration if already active)
        character.addBuff(adBuff);
        
        // Log message with enhanced styling if talent is active
        const logDamageText = isEnhanced 
            ? `<span class="talent-enhanced">+${totalDamageBonus} Physical Damage</span>` 
            : `+${totalDamageBonus} Physical Damage`;
        log(`${character.name} gains ${logDamageText} for ${this.buffDuration} turns!`);

        // --- NEW TALENT EFFECTS ---
        
        // Butterfly Healing Talent (t12) - Heal 175 HP when dodging
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t12')) {
            let healAmount = 175;
            
            // Apply Butterfly Vitality bonus if active
            if (character.appliedTalents.includes('schoolgirl_ayane_t14')) {
                healAmount = Math.floor(healAmount * 1.12);
            }
            
            const maxHeal = Math.min(healAmount, character.stats.maxHp - character.stats.currentHp);
            
            if (maxHeal > 0) {
                character.stats.currentHp += maxHeal;
                log(`<span class="talent-enhanced">${character.name}'s Butterfly Healing restores ${maxHeal} HP!</span>`, 'healing');
                console.log(`[Butterfly Healing] ${character.name} healed for ${maxHeal} HP (${character.stats.currentHp}/${character.stats.maxHp})`);
                
                // Add healing VFX using talent manager method
                if (window.talentManager && typeof window.talentManager.showButterflyHealingVFX === 'function') {
                    window.talentManager.showButterflyHealingVFX(character, maxHeal);
                } else {
                    // Fallback VFX if talent manager is not available
                    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
                    if (charElement) {
                        const healVfx = document.createElement('div');
                        healVfx.className = 'butterfly-heal-vfx';
                        healVfx.textContent = `+${maxHeal} HP`;
                        charElement.appendChild(healVfx);
                        
                        setTimeout(() => {
                            healVfx.remove();
                        }, 2000);
                    }
                }
                
                // Update UI to reflect healing
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(character);
                }
            } else {
                console.log(`[Butterfly Healing] ${character.name} already at max HP, no healing needed`);
            }
        }
        
        // Butterfly Stealth Talent (t13) - 50% chance to go stealth for 1 turn
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t13')) {
            const stealthChance = 0.5;
            if (Math.random() < stealthChance) {
                // Apply stealth buff (similar to Infernal Ibuki's Shadow Veil)
                const stealthBuff = {
                    id: 'butterfly_stealth_untargetable',
                    name: 'Butterfly Stealth',
                    icon: 'Icons/abilities/shadow_step.png',
                    duration: 1,
                    effect: (target) => {},
                    onApply: (target) => {
                        const targetElementId = target.instanceId || target.id;
                        const targetElement = document.getElementById(`character-${targetElementId}`);
                        if (targetElement) {
                            targetElement.classList.add('shadow-step-active');
                            const smokeContainer = document.createElement('div');
                            smokeContainer.className = 'shadow-step-smoke-container';
                            for (let i = 0; i < 5; i++) {
                                const smoke = document.createElement('div');
                                smoke.className = 'shadow-step-smoke';
                                smoke.style.setProperty('--i', i);
                                smokeContainer.appendChild(smoke);
                            }
                            targetElement.appendChild(smokeContainer);
                        }
                    },
                    onRemove: (target) => {
                        const targetElementId = target.instanceId || target.id;
                        const targetElement = document.getElementById(`character-${targetElementId}`);
                        if (targetElement) {
                            targetElement.classList.remove('shadow-step-active');
                            const smokeContainer = targetElement.querySelector('.shadow-step-smoke-container');
                            if (smokeContainer) {
                                smokeContainer.remove();
                            }
                        }
                    },
                    isDebuff: false,
                    isUntargetableByEnemies: true,
                    description: "Untargetable by enemies only."
                };
                
                const stealthEffect = new Effect(
                    stealthBuff.id,
                    stealthBuff.name,
                    stealthBuff.icon,
                    stealthBuff.duration,
                    stealthBuff.effect,
                    stealthBuff.isDebuff
                );
                stealthEffect.isUntargetableByEnemies = stealthBuff.isUntargetableByEnemies;
                stealthEffect.onApply = stealthBuff.onApply;
                stealthEffect.onRemove = stealthBuff.onRemove;
                stealthEffect.setDescription(stealthBuff.description);
                
                character.addBuff(stealthEffect);
                log(`${character.name}'s Butterfly Stealth activates! She becomes untargetable for 1 turn!`, 'ability');
            }
        }

        // Track statistics
        if (typeof trackCombatReflexesPassiveStats === 'function') {
            trackCombatReflexesPassiveStats(character, totalDamageBonus);
        } else if (window.trackCombatReflexesPassiveStats) {
            window.trackCombatReflexesPassiveStats(character, totalDamageBonus);
        }

        // --- Add Passive Proc VFX ---
        const charElement = document.getElementById(`character-${character.id}`);
        if (charElement) {
            const passiveVfx = document.createElement('div');
            passiveVfx.className = 'schoolgirl-ayane-passive-proc-vfx'; // Specific class
            charElement.appendChild(passiveVfx);

            // Example: A brief, bright flash
            passiveVfx.style.animation = 'ayane-passive-flash 0.6s ease-out forwards';
            
            // Text indicator with talent enhancement styling - show enhanced value if talent is active
            const vfxText = document.createElement('div');
            vfxText.className = isEnhanced ? 'passive-vfx-text talent-enhanced-glow' : 'passive-vfx-text';
            vfxText.textContent = `+${totalDamageBonus} AD!`;
            charElement.appendChild(vfxText);
            
            setTimeout(() => {
                 passiveVfx.remove();
                 vfxText.remove();
            }, 600);
        }
        // --- End VFX ---

        // Update UI
        updateCharacterUI(character);
    }

    /**
     * Generate a description of the passive, accounting for talent enhancements
     * @param {Character} character - The character to generate the description for
     * @returns {string} The passive description
     */
    generateDescription(character) {
        let totalDamageBonus = this.physicalDamageBonus;
        let isEnhanced = false;
        let additionalEffects = [];
        
        // Check for Enhanced Reflexes talent (adds +55 Physical Damage)
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t4')) {
            totalDamageBonus += 55;
            isEnhanced = true;
        }
        
        // Check for Butterfly Healing talent
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t12')) {
            let healAmount = 175;
            if (character.appliedTalents.includes('schoolgirl_ayane_t14')) {
                healAmount = Math.floor(healAmount * 1.12);
            }
            additionalEffects.push(`<span class="talent-enhanced">Heals ${healAmount} HP</span>`);
        }
        
        // Check for Butterfly Stealth talent
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t13')) {
            additionalEffects.push(`<span class="talent-enhanced">50% chance to go stealth for 2 turns</span>`);
        }
        
        // Check for Butterfly Vitality talent
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t14')) {
            additionalEffects.push(`<span class="talent-enhanced">Permanent: All healing 12% stronger</span>`);
        }
        
        // Check for Butterfly Vampirism talent
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t15')) {
            additionalEffects.push(`<span class="talent-enhanced">17% chance to heal for 100% of damage dealt</span>`);
        }
        
        // Check for Butterfly Guardian talent
        if (character && character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t16')) {
            let healAmount = 1815;
            if (character.appliedTalents.includes('schoolgirl_ayane_t14')) {
                healAmount = Math.floor(healAmount * 1.12);
            }
            additionalEffects.push(`<span class="talent-enhanced">14% chance each turn: Beautiful butterfly heals for ${healAmount} HP</span>`);
        }
        
        // Create description with enhanced styling if talent is active
        const damageText = isEnhanced 
            ? `<span class="talent-enhanced">+${totalDamageBonus}</span>` 
            : `+${totalDamageBonus}`;
        
        let description = `When dodging an attack, gain ${damageText} Physical Damage for ${this.buffDuration} turns.`;
        
        // Add additional effects if any talents are active
        if (additionalEffects.length > 0) {
            description += `\n${additionalEffects.join(', ')}.`;
        }
        
        return description;
    }

    /**
     * Update the passive description when talents are applied
     */
    updateDescription(character) {
        if (!character) return;
        
        const description = this.generateDescription(character);
        
        // Update the character's passive description
        if (character.passive) {
            character.passive.description = description;
        }
        
        // Update any UI elements that might be displaying the passive
        const passiveDescriptionElements = document.querySelectorAll('.passive-description');
        passiveDescriptionElements.forEach(element => {
            // Check if this element is for Ayane specifically
            if (element.closest('.character-stats-menu') && 
                element.closest('.character-stats-menu').dataset.characterId === character.id) {
                element.innerHTML = description.replace(/\n/g, '<br>');
            }
        });
        
        console.log(`[AYANE PASSIVE] Updated passive description for ${character.name}: ${description}`);
    }

    /**
     * Apply talent modifications to the passive
     */
    applyTalentModification(property, value) {
        if (property === 'physicalDamageBonus' && typeof value === 'number') {
            this.physicalDamageBonus += value;
            console.log(`[AYANE PASSIVE] Applied talent modification: ${property} += ${value}, new total: ${this.physicalDamageBonus}`);
            
            // Update description for the character if available
            if (this.character) {
                this.updateDescription(this.character);
            }
        }
    }

    /**
     * Called when the character deals damage to an enemy.
     * @param {Character} character - The character instance (Ayane) that dealt damage.
     * @param {number} damage - The amount of damage dealt.
     * @param {Character} target - The target that received the damage.
     */
    onDamageDealt(character, damage, target) {
        console.log(`[AYANE PASSIVE] onDamageDealt called for ${character.name}! Damage: ${damage}`);
        
        // Check for Butterfly Vampirism talent (t15)
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t15')) {
            const vampirismChance = 0.17; // 17% chance
            const vampirismMultiplier = 1.0; // 100% of damage dealt
            
            console.log(`[Butterfly Vampirism] ${character.name} has vampirism talent, checking proc (${Math.round(vampirismChance * 100)}% chance)`);
            
            if (Math.random() < vampirismChance) {
                let healAmount = Math.floor(damage * vampirismMultiplier);
                
                // Apply Butterfly Vitality bonus if active
                if (character.appliedTalents.includes('schoolgirl_ayane_t14')) {
                    healAmount = Math.floor(healAmount * 1.12);
                    console.log(`[Butterfly Vampirism] Vitality bonus applied: ${healAmount} HP`);
                }
                
                const maxHeal = Math.min(healAmount, character.stats.maxHp - character.stats.currentHp);
                
                if (maxHeal > 0) {
                    character.stats.currentHp += maxHeal;
                    
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`<span class="talent-enhanced">${character.name}'s Butterfly Vampirism heals for ${maxHeal} HP!</span>`, 'healing');
                    console.log(`[Butterfly Vampirism] ${character.name} healed for ${maxHeal} HP (${character.stats.currentHp}/${character.stats.maxHp})`);
                    
                    // Show vampirism VFX
                    this.showButterflyVampirismVFX(character, maxHeal);
                    
                    // Update UI to reflect healing
                    if (typeof updateCharacterUI === 'function') {
                        updateCharacterUI(character);
                    }
                } else {
                    console.log(`[Butterfly Vampirism] ${character.name} already at max HP, no healing needed`);
                }
            } else {
                console.log(`[Butterfly Vampirism] ${character.name} vampirism did not proc this time`);
            }
        }
    }

    /**
     * Apply the permanent Butterfly Vitality buff
     * @param {Character} character - The character to apply the buff to
     */
    applyButterflyVitalityBuff(character) {
        console.log(`[Butterfly Vitality] Applying permanent healing enhancement buff to ${character.name}`);
        
        const vitalityBuff = new Effect(
            'butterfly_vitality_permanent',
            'Butterfly Vitality',
            'Icons/stat_icons/healing.webp',
            -1, // Permanent buff
            null, // No per-turn effect
            false // Not a debuff
        ).setDescription(`<span class="talent-enhanced">Heals on you are 12% stronger</span>`);
        
        // Add a custom property to identify this as a healing enhancement buff
        vitalityBuff.isHealingEnhancement = true;
        vitalityBuff.healingMultiplier = 1.12;
        
        // Define remove function for cleanup (though it should never be removed)
        vitalityBuff.onRemove = (char) => {
            console.log(`[Butterfly Vitality] ${char.name}'s Butterfly Vitality buff removed (this shouldn't happen)`);
        };
        
        // Apply the buff
        character.addBuff(vitalityBuff);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`<span class="talent-enhanced">${character.name} gains permanent Butterfly Vitality! All healing is 12% stronger.</span>`);
        
        // Show application VFX
        this.showButterflyVitalityApplicationVFX(character);
    }

    /**
     * Show VFX for Butterfly Vampirism healing
     * @param {Character} character - The character to show the VFX for
     * @param {number} healAmount - The amount of healing
     */
    showButterflyVampirismVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'butterfly-vampirism-vfx-container';
            vfxContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            // Create multiple pink energy orbs that spiral around
            for (let i = 0; i < 8; i++) {
                const energyOrb = document.createElement('div');
                energyOrb.className = 'butterfly-vampirism-orb energy-orb-continuous-float';
                energyOrb.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #FF69B4 0%, #FF1493 50%, #C71585 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 15px #FF69B4, 0 0 30px #FF1493;
                    transform: translate(-50%, -50%);
                    animation-delay: ${i * 0.1}s;
                `;
                energyOrb.style.setProperty('--angle', `${i * 45}deg`);
                // Add initial spiral animation and then continuous floating
                energyOrb.style.animation = `butterfly-vampirism-spiral 2.5s ease-out, energy-orb-float-continuous 3s ease-in-out infinite`;
                energyOrb.style.animationDelay = `${i * 0.1}s, ${i * 0.1 + 2.5}s`;
                vfxContainer.appendChild(energyOrb);
            }
            
            // Central pink energy burst
            const centralBurst = document.createElement('div');
            centralBurst.className = 'butterfly-vampirism-burst glow-continuous-pulse';
            centralBurst.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, rgba(255, 105, 180, 0.9) 0%, rgba(255, 20, 147, 0.6) 50%, rgba(199, 21, 133, 0.3) 100%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 40px #FF69B4, 0 0 60px #FF1493;
            `;
            // Add initial burst animation and then continuous glow
            centralBurst.style.animation = `butterfly-vampirism-central-pulse 2s ease-out, glow-pulse-continuous 2.5s ease-in-out infinite`;
            centralBurst.style.animationDelay = `0s, 2s`;
            vfxContainer.appendChild(centralBurst);
            
            // Floating pink butterflies (custom CSS butterflies instead of emojis)
            for (let i = 0; i < 6; i++) {
                const butterfly = document.createElement('div');
                butterfly.className = 'butterfly-vampirism-butterfly butterfly-continuous-dance';
                butterfly.style.cssText = `
                    position: absolute;
                    top: ${30 + Math.random() * 40}%;
                    left: ${20 + Math.random() * 60}%;
                    width: 16px;
                    height: 12px;
                    filter: hue-rotate(${Math.random() * 60 - 30}deg);
                `;
                // Add initial flutter animation and then continuous dance
                butterfly.style.animation = `butterfly-vampirism-flutter ${2.5 + Math.random() * 1}s ease-in-out, butterfly-dance-continuous 4s ease-in-out infinite`;
                butterfly.style.animationDelay = `${i * 0.2}s, ${i * 0.2 + 3}s`;
                
                // Create butterfly wings
                const leftWing = document.createElement('div');
                leftWing.className = 'butterfly-wing-left butterfly-continuous-flap';
                leftWing.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 6px;
                    height: 8px;
                    background: radial-gradient(ellipse, #FF69B4 0%, #FF1493 70%, #C71585 100%);
                    border-radius: 60% 20% 60% 20%;
                    transform-origin: bottom right;
                    box-shadow: 0 0 8px #FF69B4;
                `;
                // Add initial wing flap and then continuous flap
                leftWing.style.animation = `butterfly-wing-flap 0.3s ease-in-out infinite alternate, butterfly-wing-flap-continuous 1.5s ease-in-out infinite`;
                leftWing.style.animationDelay = `0s, 1s`;
                
                const rightWing = document.createElement('div');
                rightWing.className = 'butterfly-wing-right butterfly-continuous-flap';
                rightWing.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 6px;
                    height: 8px;
                    background: radial-gradient(ellipse, #FF69B4 0%, #FF1493 70%, #C71585 100%);
                    border-radius: 20% 60% 20% 60%;
                    transform-origin: bottom left;
                    box-shadow: 0 0 8px #FF69B4;
                `;
                // Add initial wing flap and then continuous flap
                rightWing.style.animation = `butterfly-wing-flap 0.3s ease-in-out infinite alternate, butterfly-wing-flap-continuous 1.5s ease-in-out infinite`;
                rightWing.style.animationDelay = `0.15s, 1.15s`;
                
                // Butterfly body
                const body = document.createElement('div');
                body.className = 'butterfly-body';
                body.style.cssText = `
                    position: absolute;
                    top: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    height: 8px;
                    background: linear-gradient(to bottom, #8B008B, #4B0082);
                    border-radius: 50%;
                    box-shadow: 0 0 4px #FF1493;
                `;
                
                butterfly.appendChild(leftWing);
                butterfly.appendChild(rightWing);
                butterfly.appendChild(body);
                vfxContainer.appendChild(butterfly);
            }
            
            // Healing text with pink glow
            const healText = document.createElement('div');
            healText.className = 'butterfly-vampirism-heal-text';
            healText.textContent = `+${healAmount} HP`;
            healText.style.cssText = `
                position: absolute;
                top: 15%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #FF69B4;
                font-weight: bold;
                font-size: 18px;
                text-shadow: 0 0 15px #FF69B4, 0 0 25px #FF1493, 0 0 35px #C71585;
                animation: butterfly-vampirism-heal-text-rise 2.5s ease-out;
                z-index: 1001;
            `;
            vfxContainer.appendChild(healText);
            
            // Add rotating energy rings around the character
            for (let i = 0; i < 3; i++) {
                const energyRing = document.createElement('div');
                energyRing.className = 'butterfly-vampirism-energy-ring energy-continuous-swirl';
                energyRing.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: ${80 + i * 30}px;
                    height: ${80 + i * 30}px;
                    border: 2px solid rgba(255, 105, 180, ${0.7 - i * 0.2});
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 15px rgba(255, 105, 180, 0.6);
                `;
                // Apply continuous swirl animation with staggered delays
                energyRing.style.animation = `energy-swirl-continuous ${3 + i * 0.5}s linear infinite`;
                energyRing.style.animationDelay = `${i * 0.2}s`;
                vfxContainer.appendChild(energyRing);
            }
            
            // Add floating energy particles
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'butterfly-vampirism-particle sparkle-continuous-twinkle';
                particle.style.cssText = `
                    position: absolute;
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    width: 2px;
                    height: 2px;
                    background: radial-gradient(circle, #FF69B4 0%, #FF1493 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 6px #FF69B4;
                    filter: hue-rotate(${Math.random() * 60 - 30}deg);
                `;
                // Apply continuous floating animation
                particle.style.animation = `energy-orb-float-continuous ${2 + Math.random() * 2}s ease-in-out infinite`;
                particle.style.animationDelay = `${Math.random() * 2}s`;
                vfxContainer.appendChild(particle);
            }
            
            // Pink energy waves
            for (let i = 0; i < 3; i++) {
                const wave = document.createElement('div');
                wave.className = 'butterfly-vampirism-wave border-continuous-pulse';
                wave.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: ${40 + i * 20}px;
                    height: ${40 + i * 20}px;
                    border: 2px solid #FF69B4;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    opacity: ${0.8 - i * 0.2};
                `;
                // Apply initial wave expansion and then continuous border pulse
                wave.style.animation = `butterfly-vampirism-wave-expand 2s ease-out, border-pulse-continuous 2s ease-in-out infinite`;
                wave.style.animationDelay = `${i * 0.3}s, ${i * 0.3 + 2}s`;
                vfxContainer.appendChild(wave);
            }
            
            // Pink sparkles (custom sparkle elements)
            for (let i = 0; i < 15; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'butterfly-vampirism-sparkle sparkle-continuous-twinkle';
                sparkle.style.cssText = `
                    position: absolute;
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    width: ${4 + Math.random() * 6}px;
                    height: ${4 + Math.random() * 6}px;
                    background: radial-gradient(circle, #FF69B4 0%, #FF1493 50%, transparent 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 8px #FF69B4, 0 0 16px #FF1493;
                    filter: hue-rotate(${Math.random() * 40 - 20}deg);
                `;
                // Apply initial sparkle animation and then continuous twinkle
                sparkle.style.animation = `butterfly-vampirism-sparkle ${1.5 + Math.random() * 1}s ease-out, sparkle-twinkle-continuous 2s ease-in-out infinite`;
                sparkle.style.animationDelay = `${Math.random() * 1.5}s, ${Math.random() * 1.5 + 2}s`;
                
                // Add sparkle rays
                const sparkleRays = document.createElement('div');
                sparkleRays.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    transform: translate(-50%, -50%);
                `;
                
                // Create 4 sparkle rays
                for (let j = 0; j < 4; j++) {
                    const ray = document.createElement('div');
                    ray.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 1px;
                        height: ${8 + Math.random() * 6}px;
                        background: linear-gradient(to bottom, #FF69B4, transparent);
                        transform: translate(-50%, -50%) rotate(${j * 45 + Math.random() * 45}deg);
                        transform-origin: center;
                    `;
                    sparkleRays.appendChild(ray);
                }
                
                sparkle.appendChild(sparkleRays);
                vfxContainer.appendChild(sparkle);
            }
            
            charElement.appendChild(vfxContainer);
            
            // Add character glow effect
            const characterGlow = document.createElement('div');
            characterGlow.className = 'butterfly-vampirism-character-glow glow-continuous-pulse';
            characterGlow.style.cssText = `
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                background: radial-gradient(circle, rgba(255, 105, 180, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 999;
            `;
            // Apply initial glow pulse and then continuous pulse
            characterGlow.style.animation = `butterfly-vampirism-glow-pulse 2s ease-out, glow-pulse-continuous 2.5s ease-in-out infinite`;
            characterGlow.style.animationDelay = `0s, 2s`;
            charElement.appendChild(characterGlow);
            
            // Play vampiric sound effect
            const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
            playSound('sounds/life_drain.mp3'); // Or a custom vampiric sound
            
            // Remove VFX after animation
            setTimeout(() => {
                vfxContainer.remove();
                characterGlow.remove();
            }, 3000);
        }
    }

    /**
     * Show VFX for Butterfly Vitality application
     * @param {Character} character - The character to show the VFX for
     */
    showButterflyVitalityApplicationVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            const vfxContainer = document.createElement('div');
            vfxContainer.className = 'butterfly-vitality-vfx-container';
            
            // Create multiple glowing butterflies with continuous animation
            for (let i = 0; i < 10; i++) {
                const butterfly = document.createElement('div');
                butterfly.className = 'butterfly-vitality-vfx butterfly-continuous-dance';
                butterfly.style.setProperty('--i', i);
                butterfly.style.cssText = `
                    position: absolute;
                    top: ${20 + Math.random() * 60}%;
                    left: ${15 + Math.random() * 70}%;
                    width: 12px;
                    height: 8px;
                    background: linear-gradient(45deg, #FFD700, #FFA500, #FF69B4);
                    border-radius: 50% 10% 50% 10%;
                    box-shadow: 0 0 10px #FFD700, 0 0 20px #FFA500;
                `;
                // Apply initial flutter animation and then continuous dance
                butterfly.style.animation = `butterfly-vitality-flutter 2s ease-in-out, butterfly-dance-continuous 4s ease-in-out infinite`;
                butterfly.style.animationDelay = `calc(var(--i) * 0.2s), calc(var(--i) * 0.2s + 2s)`;
                vfxContainer.appendChild(butterfly);
            }
            
            // Add glowing energy orbs
            for (let i = 0; i < 6; i++) {
                const orb = document.createElement('div');
                orb.className = 'butterfly-vitality-orb energy-orb-continuous-float';
                orb.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 6px;
                    height: 6px;
                    background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 12px #FFD700, 0 0 24px #FFA500;
                `;
                orb.style.setProperty('--angle', `${i * 60}deg`);
                // Apply initial spiral animation and then continuous float
                orb.style.animation = `butterfly-vitality-spiral 2s ease-out, energy-orb-float-continuous 3s ease-in-out infinite`;
                orb.style.animationDelay = `${i * 0.2}s, ${i * 0.2 + 2}s`;
                vfxContainer.appendChild(orb);
            }
            
            // Add golden sparkles
            for (let i = 0; i < 12; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'butterfly-vitality-sparkle sparkle-continuous-twinkle';
                sparkle.style.cssText = `
                    position: absolute;
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    width: 3px;
                    height: 3px;
                    background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 8px #FFD700;
                `;
                // Apply initial swirl animation and then continuous twinkle
                sparkle.style.animation = `butterfly-vitality-swirl 2s ease-out, sparkle-twinkle-continuous 2s ease-in-out infinite`;
                sparkle.style.animationDelay = `${Math.random() * 2}s, ${Math.random() * 2 + 2}s`;
                vfxContainer.appendChild(sparkle);
            }
            
            // Add glowing text
            const vitalityText = document.createElement('div');
            vitalityText.className = 'butterfly-vitality-text';
            vitalityText.textContent = 'Butterfly Vitality!';
            vitalityText.style.cssText = `
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #FFD700;
                font-weight: bold;
                font-size: 12px;
                text-shadow: 0 0 15px #FFD700, 0 0 30px #FFA500;
                animation: butterfly-vitality-text-glow 3s ease-out;
                pointer-events: none;
                z-index: 1002;
            `;
            
            vfxContainer.appendChild(vitalityText);
            charElement.appendChild(vfxContainer);
            
            // Remove VFX after animation
            setTimeout(() => {
                vfxContainer.remove();
            }, 3000);
        }
    }

    /**
     * Set up Butterfly Guardian talent - heals every turn
     * @param {Character} character - The character to set up the talent for
     */
    setupButterflyGuardian(character) {
        // Prevent double setup
        if (this.butterflyGuardianActive) {
            console.log(`[Butterfly Guardian] Already active for ${character.name}, skipping setup`);
            return;
        }
        
        console.log(`[Butterfly Guardian] Setting up Butterfly Guardian for ${character.name}`);
        
        this.butterflyGuardianActive = true;
        
        // Bind the turn start event handler
        this.boundOnTurnStart = this.handleButterflyGuardianTurn.bind(this);
        
        // Listen for turn start events
        document.addEventListener('turn:start', this.boundOnTurnStart);
        
        console.log(`[Butterfly Guardian] Event listener added for turn:start events`);
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        log(`<span class="talent-enhanced">${character.name} is blessed by the Butterfly Guardian! A beautiful butterfly will visit each turn.</span>`);
        
        // Show initial setup VFX
        this.showButterflyGuardianSetupVFX(character);
    }

    /**
     * Handle Butterfly Guardian healing on turn start
     * @param {CustomEvent} event - The turn start event
     */
    handleButterflyGuardianTurn(event) {
        console.log(`[Butterfly Guardian] Turn start event received:`, event.detail);
        
        if (!event.detail || !this.butterflyGuardianActive) {
            console.log(`[Butterfly Guardian] No event detail or Butterfly Guardian not active`);
            return;
        }
        
        const { character } = event.detail;
        
        // Check if this is our character's turn
        if (character === this.character) {
            console.log(`[Butterfly Guardian] ${character.name}'s turn - triggering butterfly healing`);
            this.triggerButterflyGuardianHealing(character);
        } else {
            console.log(`[Butterfly Guardian] Turn start for ${character ? character.name : 'unknown'}, but not our character (${this.character ? this.character.name : 'unknown'})`);
        }
    }

    /**
     * Trigger the Butterfly Guardian healing effect
     * @param {Character} character - The character to heal
     */
    triggerButterflyGuardianHealing(character) {
        const guardianChance = 0.14; // 14% chance to trigger
        
        console.log(`[Butterfly Guardian] ${character.name} has Butterfly Guardian talent, checking proc (${Math.round(guardianChance * 100)}% chance)`);
        
        if (Math.random() < guardianChance) {
            let healAmount = 1815;
            
            // Apply Butterfly Vitality bonus if active
            if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t14')) {
                healAmount = Math.floor(healAmount * 1.12);
            }
            
            const maxHeal = Math.min(healAmount, character.stats.maxHp - character.stats.currentHp);
            
            if (maxHeal > 0) {
                character.stats.currentHp += maxHeal;
                
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`<span class="talent-enhanced">A beautiful butterfly visits ${character.name} and heals for ${maxHeal} HP!</span>`, 'healing');
                console.log(`[Butterfly Guardian] ${character.name} healed for ${maxHeal} HP (${character.stats.currentHp}/${character.stats.maxHp})`);
                
                // Show detailed butterfly VFX
                this.showButterflyGuardianVFX(character, maxHeal);
                
                // Update UI to reflect healing
                if (typeof updateCharacterUI === 'function') {
                    updateCharacterUI(character);
                }
            } else {
                console.log(`[Butterfly Guardian] ${character.name} already at max HP, butterfly blessing not needed`);
                // Still show VFX even if no healing needed
                this.showButterflyGuardianVFX(character, 0);
            }
        } else {
            console.log(`[Butterfly Guardian] ${character.name} butterfly guardian did not proc this turn`);
        }
    }

    /**
     * Show detailed VFX for Butterfly Guardian healing
     * @param {Character} character - The character to show the VFX for
     * @param {number} healAmount - The amount of healing (0 if no healing needed)
     */
    showButterflyGuardianVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'butterfly-guardian-vfx-container';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        // Create the main butterfly
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly-guardian-main';
        butterfly.style.cssText = `
            position: absolute;
            top: -80px;
            left: -80px;
            width: 80px;
            height: 60px;
            z-index: 1002;
            filter: drop-shadow(0 0 20px rgba(138, 43, 226, 0.9));
        `;
        
        // Create butterfly body
        const body = document.createElement('div');
        body.className = 'butterfly-guardian-body';
        body.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 4px;
            height: 35px;
            background: linear-gradient(to bottom, #4B0082 0%, #8B008B 30%, #9932CC 70%, #DA70D6 100%);
            border-radius: 3px;
            box-shadow: 0 0 12px rgba(138, 43, 226, 0.8);
        `;
        
        // Create left wing
        const leftWing = document.createElement('div');
        leftWing.className = 'butterfly-guardian-left-wing';
        leftWing.style.cssText = `
            position: absolute;
            top: 4px;
            left: 4px;
            width: 32px;
            height: 24px;
            background: linear-gradient(135deg, 
                #DA70D6 0%, 
                #BA55D3 15%, 
                #9932CC 35%, 
                #8B008B 65%, 
                #4B0082 85%,
                #2E0854 100%);
            border-radius: 70% 30% 70% 30%;
            transform-origin: bottom right;
            box-shadow: 
                inset 0 0 12px rgba(255, 255, 255, 0.4),
                0 0 20px rgba(186, 85, 211, 0.8),
                0 0 30px rgba(138, 43, 226, 0.6);
            animation: butterfly-guardian-wing-flap 0.3s ease-in-out infinite alternate;
        `;
        
        // Create right wing
        const rightWing = document.createElement('div');
        rightWing.className = 'butterfly-guardian-right-wing';
        rightWing.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 32px;
            height: 24px;
            background: linear-gradient(45deg, 
                #DA70D6 0%, 
                #BA55D3 15%, 
                #9932CC 35%, 
                #8B008B 65%, 
                #4B0082 85%,
                #2E0854 100%);
            border-radius: 30% 70% 30% 70%;
            transform-origin: bottom left;
            box-shadow: 
                inset 0 0 12px rgba(255, 255, 255, 0.4),
                0 0 20px rgba(186, 85, 211, 0.8),
                0 0 30px rgba(138, 43, 226, 0.6);
            animation: butterfly-guardian-wing-flap 0.3s ease-in-out infinite alternate;
            animation-delay: 0.15s;
        `;
        
        // Add wing patterns
        const leftWingPattern = document.createElement('div');
        leftWingPattern.style.cssText = `
            position: absolute;
            top: 6px;
            left: 6px;
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 40%, transparent 70%);
            border-radius: 50%;
        `;
        
        const rightWingPattern = document.createElement('div');
        rightWingPattern.style.cssText = `
            position: absolute;
            top: 6px;
            right: 6px;
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 40%, transparent 70%);
            border-radius: 50%;
        `;
        
        leftWing.appendChild(leftWingPattern);
        rightWing.appendChild(rightWingPattern);
        
        // Add antennae
        const antennae = document.createElement('div');
        antennae.className = 'butterfly-guardian-antennae';
        antennae.style.cssText = `
            position: absolute;
            top: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 8px;
        `;
        
        const leftAntenna = document.createElement('div');
        leftAntenna.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 2px;
            height: 10px;
            background: linear-gradient(to bottom, #8B008B, #4B0082);
            transform: rotate(-20deg);
            transform-origin: bottom;
            border-radius: 50%;
        `;
        
        const rightAntenna = document.createElement('div');
        rightAntenna.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: 2px;
            height: 10px;
            background: linear-gradient(to bottom, #8B008B, #4B0082);
            transform: rotate(20deg);
            transform-origin: bottom;
            border-radius: 50%;
        `;
        
        antennae.appendChild(leftAntenna);
        antennae.appendChild(rightAntenna);
        
        // Add magical glow around the butterfly
        const butterflyGlow = document.createElement('div');
        butterflyGlow.className = 'butterfly-guardian-glow';
        butterflyGlow.style.cssText = `
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: radial-gradient(circle, rgba(218, 112, 214, 0.4) 0%, rgba(186, 85, 211, 0.3) 50%, transparent 100%);
            border-radius: 50%;
            animation: butterfly-guardian-glow-pulse 2s ease-in-out infinite;
        `;
        
        // Add magical sparkle trail
        const sparkleTrail = document.createElement('div');
        sparkleTrail.className = 'butterfly-guardian-sparkle-trail';
        sparkleTrail.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            pointer-events: none;
        `;
        
        // Create multiple sparkles that follow the butterfly
        for (let i = 0; i < 12; i++) {
            const trailSparkle = document.createElement('div');
            trailSparkle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: radial-gradient(circle, #FFD700 0%, #DA70D6 50%, transparent 100%);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
                animation: butterfly-guardian-trail-sparkle ${1 + Math.random() * 0.5}s ease-out infinite;
                animation-delay: ${i * 0.1}s;
            `;
            trailSparkle.style.setProperty('--delay', `${i * 0.1}s`);
            sparkleTrail.appendChild(trailSparkle);
        }
        
        butterfly.appendChild(butterflyGlow);
        butterfly.appendChild(sparkleTrail);
        
        butterfly.appendChild(body);
        butterfly.appendChild(leftWing);
        butterfly.appendChild(rightWing);
        butterfly.appendChild(antennae);
        
        // Animate butterfly flight path
        butterfly.style.animation = 'butterfly-guardian-flight 4s ease-in-out forwards';
        
        // Create magical trail particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'butterfly-guardian-trail-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #DA70D6 0%, #BA55D3 50%, transparent 100%);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(218, 112, 214, 0.8);
                animation: butterfly-guardian-trail-particle ${2 + Math.random() * 2}s ease-out forwards;
                animation-delay: ${i * 0.1}s;
            `;
            particle.style.setProperty('--start-x', `${Math.random() * 100}%`);
            particle.style.setProperty('--start-y', `${Math.random() * 100}%`);
            vfxContainer.appendChild(particle);
        }
        
        // Create healing aura
        const healingAura = document.createElement('div');
        healingAura.className = 'butterfly-guardian-healing-aura';
        healingAura.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, 
                rgba(218, 112, 214, 0.3) 0%, 
                rgba(186, 85, 211, 0.2) 40%, 
                rgba(138, 43, 226, 0.1) 70%, 
                transparent 100%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: butterfly-guardian-healing-aura 4s ease-in-out forwards;
        `;
        
        // Create sparkles around the character
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'butterfly-guardian-sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #DA70D6 0%, #BA55D3 50%, transparent 100%);
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(218, 112, 214, 0.9);
                animation: butterfly-guardian-sparkle ${1.5 + Math.random() * 1}s ease-out forwards;
                animation-delay: ${1 + Math.random() * 2}s;
            `;
            sparkle.style.setProperty('--angle', `${i * 24}deg`);
            sparkle.style.setProperty('--distance', `${60 + Math.random() * 40}px`);
            vfxContainer.appendChild(sparkle);
        }
        
        // Add floating runes/symbols
        const runeSymbols = ['✧', '✦', '✨', '◆', '◇', '▸', '◂'];
        for (let i = 0; i < 8; i++) {
            const rune = document.createElement('div');
            rune.className = 'butterfly-guardian-rune';
            rune.textContent = runeSymbols[i % runeSymbols.length];
            rune.style.cssText = `
                position: absolute;
                top: ${20 + Math.random() * 60}%;
                left: ${10 + Math.random() * 80}%;
                font-size: 16px;
                color: #DA70D6;
                text-shadow: 0 0 10px rgba(218, 112, 214, 0.8);
                animation: butterfly-guardian-rune-float ${3 + Math.random() * 2}s ease-in-out forwards;
                animation-delay: ${0.5 + Math.random() * 1.5}s;
            `;
            vfxContainer.appendChild(rune);
        }
        
        // Add healing text if healing occurred
        if (healAmount > 0) {
            const healText = document.createElement('div');
            healText.className = 'butterfly-guardian-heal-text';
            healText.textContent = `+${healAmount} HP`;
            healText.style.cssText = `
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #DA70D6;
                font-weight: bold;
                font-size: 20px;
                text-shadow: 
                    0 0 15px rgba(218, 112, 214, 0.9),
                    0 0 25px rgba(186, 85, 211, 0.7),
                    0 0 35px rgba(138, 43, 226, 0.5);
                animation: butterfly-guardian-heal-text 3s ease-out forwards;
                z-index: 1003;
            `;
            vfxContainer.appendChild(healText);
        }
        
        // Add energy rings
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.className = 'butterfly-guardian-energy-ring';
            ring.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${80 + i * 30}px;
                height: ${80 + i * 30}px;
                border: 2px solid rgba(218, 112, 214, ${0.6 - i * 0.15});
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 20px rgba(218, 112, 214, 0.4);
                animation: butterfly-guardian-energy-ring ${2 + i * 0.5}s ease-out forwards;
                animation-delay: ${1 + i * 0.3}s;
            `;
            vfxContainer.appendChild(ring);
        }
        
        vfxContainer.appendChild(butterfly);
        vfxContainer.appendChild(healingAura);
        charElement.appendChild(vfxContainer);
        
        // Add character glow effect
        const characterGlow = document.createElement('div');
        characterGlow.className = 'butterfly-guardian-character-glow';
        characterGlow.style.cssText = `
            position: absolute;
            top: -15px;
            left: -15px;
            right: -15px;
            bottom: -15px;
            background: radial-gradient(circle, rgba(218, 112, 214, 0.4) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            animation: butterfly-guardian-character-glow 4s ease-out forwards;
        `;
        charElement.appendChild(characterGlow);
        
        // Play sound effect
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/butterfly_healing.mp3'); // Custom butterfly sound
        
        // Remove VFX after animation
        setTimeout(() => {
            vfxContainer.remove();
            characterGlow.remove();
        }, 4500);
    }

    /**
     * Show VFX for Butterfly Guardian setup
     * @param {Character} character - The character to show the VFX for
     */
    showButterflyGuardianSetupVFX(character) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!charElement) return;
        
        const setupVfx = document.createElement('div');
        setupVfx.className = 'butterfly-guardian-setup-vfx';
        setupVfx.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, 
                rgba(218, 112, 214, 0.3) 0%, 
                rgba(186, 85, 211, 0.2) 40%, 
                transparent 70%);
            border-radius: 50%;
            animation: butterfly-guardian-setup-pulse 3s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const setupText = document.createElement('div');
        setupText.textContent = 'Butterfly Guardian Activated!';
        setupText.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #DA70D6;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 0 0 15px rgba(218, 112, 214, 0.9);
            animation: butterfly-guardian-setup-text 3s ease-out forwards;
            white-space: nowrap;
        `;
        
        setupVfx.appendChild(setupText);
        charElement.appendChild(setupVfx);
        
        setTimeout(() => {
            setupVfx.remove();
        }, 3000);
    }

    /**
     * Track turn start for Butterfly Guardian talent
     * @param {Character} character - The character to track turn starts for
     */
    trackTurnStartForButterflyGuardian(character) {
        if (!character) return;
        
        // Check if the Butterfly Guardian talent is active
        if (character.appliedTalents && character.appliedTalents.includes('schoolgirl_ayane_t16')) {
            console.log(`[Butterfly Guardian] Butterfly Guardian talent is active for ${character.name}, turn start tracking is enabled`);
            // The actual event listener setup happens in setupButterflyGuardian
        } else {
            console.log(`[Butterfly Guardian] Butterfly Guardian talent is not active for ${character.name}, no turn start tracking needed`);
        }
    }

    /**
     * Cleanup method to remove event listeners
     */
    cleanup() {
        // Remove damage event listeners
        if (this.boundOnDamageDealt) {
            document.removeEventListener('character:damage-dealt', this.boundOnDamageDealt);
            this.boundOnDamageDealt = null;
        }
        
        // Remove turn start event listeners for Butterfly Guardian
        if (this.boundOnTurnStart) {
            document.removeEventListener('turn:start', this.boundOnTurnStart);
            this.boundOnTurnStart = null;
        }
        
        // Reset butterfly guardian state
        this.butterflyGuardianActive = false;
        
        console.log(`[AYANE PASSIVE] Cleaned up event listeners for ${this.character ? this.character.name : 'unknown character'}`);
    }

    // ...existing code...
}

// Global function to update Ayane's passive description for talents (similar to Elphelt)
window.updateAyanePassiveDescriptionForTalents = function(character) {
    if (!character || character.id !== 'schoolgirl_ayane') return '';
    
    if (character.passiveHandler && typeof character.passiveHandler.generateDescription === 'function') {
        const description = character.passiveHandler.generateDescription(character);
        console.log(`[AYANE PASSIVE] Generated description for talents: ${description}`);
        return description;
    }
    
    // Fallback if no passive handler
    const ayanePassive = new SchoolgirlAyanePassive();
    return ayanePassive.generateDescription(character);
};

// Make the class available globally or ensure it's properly imported/managed
if (typeof window !== 'undefined') {
    window.SchoolgirlAyanePassive = SchoolgirlAyanePassive;
}