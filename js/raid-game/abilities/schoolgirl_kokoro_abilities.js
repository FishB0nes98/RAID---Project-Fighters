// Ability definitions for Schoolgirl Kokoro

// Create a subclass of Character for Schoolgirl Kokoro to implement her passive
class SchoolgirlKokoroCharacter extends Character {
    constructor(id, name, image, stats) {
        super(id, name, image, stats);
        
        // Create passive visual indicator
        this.createPassiveIndicator();
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
                passiveIndicator.title = 'Healing Feedback: Using an ability restores 410HP back to yourself.';
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
    
    // Apply the passive Healing Feedback
    applyPassiveHealingFeedback() {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        
        // Get passive healing amount from passive
        const healAmount = 410;
        
        // Apply healing to self with proper tracking (passive healing is considered self-healing)
        const actualHeal = this.heal(healAmount, this, { abilityId: 'healing_feedback', healType: 'passive' });
        
        // Log the passive activation
        log(`${this.name}'s Healing Feedback activates, healing for ${actualHeal.healAmount} HP.`, 'passive');
        
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
}

// --- Ability implementations ---

// Lesser Heal
const lesserHealEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    
    // Base healing amount
    const baseHealAmount = 410;
    
    // Apply healing power multiplier
    const healAmount = Math.floor(baseHealAmount * (1 + caster.stats.healingPower));
    
    // Apply healing using the target's heal() method with proper caster tracking
    const actualHeal = target.heal(healAmount, caster, { abilityId: 'lesser_heal' });
    
    // Log the healing
    log(`${caster.name} used Lesser Heal on ${target.name}, healing for ${actualHeal.healAmount} HP.`);
    
    // Show visual effect for healing (custom VFX for Kokoro)
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create custom healing effect instead of using the default heal-vfx
        const healVfx = document.createElement('div');
        healVfx.className = 'lesser-heal-vfx';
        
        // Create healing number display (using a div instead of a span to avoid default heal-vfx styling)
        const healNumber = document.createElement('div');
        healNumber.className = 'lesser-heal-number';
        healNumber.textContent = `+${actualHeal.healAmount}`;
        
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

// Silencing Ring - Debuff implementation
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
    
    // Create and add the debuff
    const debuff = {
        id: 'silencing_ring',
        name: 'Silencing Ring',
        description: 'Deals 30% less damage',
        icon: 'Icons/abilities/silencing_ring.jfif',
        duration: 6,
        
        // Apply the debuff when added - this will be called by addDebuff
        effect: function(character) {
            
            // We don't need any per-turn effect for this debuff
        },
        
        // Set up when the debuff is first applied
        onApply: function() {
            // Don't log from here - we'll log after adding the debuff to avoid duplicate messages
            addSilencingRingStatusIndicator(target);
            
            
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
        },

        
        
        // Clean up when the debuff expires or is removed
        remove: function() {
            log(`Silencing Ring effect removed from ${target.name}.`, 'status');
            removeSilencingRingStatusIndicator(target);
            
            // Restore the original damage calculation method
            if (target._originalCalculateDamage) {
                target.calculateDamage = target._originalCalculateDamage;
                delete target._originalCalculateDamage;
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

// Helper function to add silencing ring status indicator
function addSilencingRingStatusIndicator(target) {
    const elementId = target.instanceId || target.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        const imageContainer = characterElement.querySelector('.image-container');
        if (imageContainer && !imageContainer.querySelector('.silencing-ring-status')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'silencing-ring-status';
            statusIndicator.title = 'Silencing Ring: Deals 30% less damage';
            imageContainer.appendChild(statusIndicator);
        }
    }
}

// Helper function to remove silencing ring status indicator
function removeSilencingRingStatusIndicator(target) {
    const elementId = target.instanceId || target.id;
    const characterElement = document.getElementById(`character-${elementId}`);
    if (characterElement) {
        const statusIndicator = characterElement.querySelector('.silencing-ring-status');
        if (statusIndicator) {
            statusIndicator.remove();
        }
    }
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



// Circle Heal - Heal all allies implementation
const circleHealEffect = (caster, target) => {
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
        console.warn("gameManager not found, only healing caster");
    }
    
    // Base healing amount
    const baseHealAmount = 250;
    const magicalDamageBonus = Math.floor(caster.stats.magicalDamage * 1.5);
    const totalHealAmount = baseHealAmount + magicalDamageBonus;
    
    // Log the ability usage
    log(`${caster.name} used Circle Heal, healing all allies for ${totalHealAmount} HP.`);
    
    // Apply healing to all allies
    allAllies.forEach(ally => {
        // Apply healing power multiplier from caster (the one casting the healing spell)
        const healAmount = Math.floor(totalHealAmount * (1 + caster.stats.healingPower));
        
        // Apply healing using the ally's heal() method with proper caster tracking  
        const actualHeal = ally.heal(healAmount, caster, { suppressDefaultVFX: true, abilityId: 'circle_heal' }); 
        
        if (actualHeal.healAmount > 0) {
            // Log the healing for each ally
            log(`${ally.name} was healed for ${actualHeal.healAmount} HP.`);
            
            // Show healing VFX for each ally
            showCircleHealVFX(ally, actualHeal.healAmount);
        }
        
        // Update UI (heal() method already calls updateCharacterUI)
        // if (typeof updateCharacterUI === 'function') {
        //     updateCharacterUI(ally);
        // }
    });
    
    // Play sounds
    playSound('sounds/kokoroa3.mp3', 0.8); // Kokoro's voice line for E
    playSound('sounds/kokoroa3sfx.mp3', 0.6); // SFX for E
    
    return true;
};

// Show visual effect for Circle Heal
function showCircleHealVFX(target, healAmount) {
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        // Create main healing effect container
        const healVfx = document.createElement('div');
        healVfx.className = 'circle-heal-vfx';
        
        // Create healing number display
        const healNumber = document.createElement('div');
        healNumber.className = 'circle-heal-number';
        healNumber.textContent = `+${healAmount}`;
        
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

// Create Silencing Ring ability
const silencingRingAbility = new Ability(
    'silencing_ring',
    'Silencing Ring',
    'Icons/abilities/silencing_ring.jfif',
    40, // Mana cost
    15, // Cooldown in turns
    silencingRingEffect
).setDescription('Places a debuff on the target for 6 turns, reducing their damage output by 30%.')
 .setTargetType('enemy'); // Can only target enemies

// Create Circle Heal ability
const circleHealAbility = new Ability(
    'circle_heal',
    'Circle Heal',
    'Icons/abilities/circle_heal.jfif',
    95, // Mana cost
    9,   // Cooldown in turns
    circleHealEffect
).setDescription('Heals all allies for 250HP + 150% of Magic Damage.')
 .setTargetType('self'); // Target self but affect all allies

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
    log(`${caster.name} used Protective Aura, buffing all allies with increased armor and healing power.`);
    
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
            buff.statModifiers = [
                { stat: 'armor', value: 15, operation: 'add' }, // +15 armor (flat)
                { stat: 'healingPower', value: 0.35, operation: 'add' } // +35% healing power (0.35 as flat increase)
            ];

            buff.setDescription('+15% Armor, +35% Healing Power'); // Update description if needed

            // Custom logic for VFX on apply/remove
            buff.onApply = function(character) {
                log(`${character.name} gained Protective Aura! (+15% Armor, +35% Healing Power)`, 'buff');
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

// Create Protective Aura ability
const protectiveAuraAbility = new Ability(
    'protective_aura',
    'Protective Aura',
    'Icons/abilities/protective_aura.jfif',
    125, // Mana cost
    20,  // Cooldown in turns
    protectiveAuraEffect
).setDescription('Gives 15% Increased armor to all allies and increase their healing power by 35% for 7 turns.')
 .setTargetType('self'); // Target self but affect all allies

// Register the custom character class and abilities
document.addEventListener('DOMContentLoaded', () => {
    console.log("[KOKORO] Registering character class and abilities");
    
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