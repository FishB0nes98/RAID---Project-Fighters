// Ability definitions for Schoolboy Siegfried

// This file is now primarily for registering the ability ID so the factory can find it.
// The actual effect logic is handled by the AbilityFactory based on the type defined in the JSON.

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // We no longer need to define the full Ability object here.
    // The AbilityFactory will create it based on the 'schoolboy_siegfried.json' data.
    // We might register pre-defined *data* here in the future if needed,
    // but for simple abilities defined in JSON, this file can be minimal or even removed
    // if the factory automatically loads all character JSONs.
    
    // For now, let's keep this structure but acknowledge it's less critical for JSON-defined abilities.
    console.log("Schoolboy Siegfried abilities script loaded - relying on AbilityFactory and JSON data.");

} else {
    console.warn("AbilityFactory not found. Schoolboy Siegfried abilities might not load correctly.");
}

// --- Enhanced Passive Display ---
// Function to enhance and animate Siegfried's passive display
const enhanceSiegfriedPassiveDisplay = (character) => {
    if (!character || character.id !== 'schoolboy_siegfried') return;
    
    const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
    if (!charElement) return;
    
    const passiveElement = charElement.querySelector('.siegfried-passive');
    if (!passiveElement) return;
    
    const buffCount = character.buffs.length;
    
    // Skip if no buffs
    if (buffCount === 0) return;
    
    // Special effects based on number of buffs
    if (buffCount >= 5) {
        // Add a subtle lion-themed glow to the character
        const imageContainer = charElement.querySelector('.image-container');
        if (imageContainer && !imageContainer.classList.contains('siegfried-power-glow')) {
            imageContainer.classList.add('siegfried-power-glow');
            
            // Optional: Add a brief lion roar sound effect for dramatic effect
            if (typeof playSound === 'function' && buffCount >= 8) {
                playSound('sfx_lion_roar');
            }
        }
    } else {
        // Remove the glow if buff count drops below threshold
        const imageContainer = charElement.querySelector('.image-container');
        if (imageContainer && imageContainer.classList.contains('siegfried-power-glow')) {
            imageContainer.classList.remove('siegfried-power-glow');
        }
    }
};

// Hook into the game manager's updateCharacterUI if possible to run our enhancement
if (window.gameManager && window.gameManager.uiManager) {
    // Store the original updateCharacterUI function
    const originalUpdateCharacterUI = window.gameManager.uiManager.updateCharacterUI;
    
    // Override with our enhanced version
    window.gameManager.uiManager.updateCharacterUI = function(character) {
        // Call the original function first
        originalUpdateCharacterUI.call(this, character);
        
        // Then apply our enhancements
        if (character.id === 'schoolboy_siegfried') {
            enhanceSiegfriedPassiveDisplay(character);
        }
    };
    
    console.log("Enhanced Siegfried passive display enabled");
}

// --- Passive Implementation Note ---
// The passive effect (Gain 125 Physical Damage per buff) is implemented by modifying
// the AbilityFactory.createDamageEffect method in character.js to check for 
// caster.id === 'schoolboy_siegfried' and add bonus damage based on caster.buffs.length. 

// --- CSS Injection for Dynamic Effects ---
// This ensures we have the necessary CSS for the character image glow
const injectSiegfriedCSS = () => {
    const styleId = 'siegfried-dynamic-styles';
    if (document.getElementById(styleId)) return; // Already exists
    
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
        /* Siegfried Power Glow - Added dynamically when buff count is high */
        .image-container.siegfried-power-glow {
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
            transition: box-shadow 0.5s ease-in-out;
        }
        
        .image-container.siegfried-power-glow img {
            filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
            transition: filter 0.5s ease-in-out;
        }

        /* Sword Slash VFX - Q ability */
        .siegfried-sword-slash-vfx {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            z-index: 1002;
            pointer-events: none;
            animation: siegfried-slash-container 0.6s ease-out forwards;
        }

        .siegfried-sword-slash-vfx::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            width: 0;
            height: 4px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.3) 10%, 
                rgba(255, 255, 255, 0.9) 30%, 
                #ffffff 50%, 
                rgba(255, 255, 255, 0.9) 70%, 
                rgba(255, 255, 255, 0.3) 90%, 
                transparent 100%
            );
            border-radius: 2px;
            box-shadow: 
                0 0 4px rgba(255, 255, 255, 0.8),
                0 0 8px rgba(192, 192, 192, 0.6),
                0 0 12px rgba(255, 255, 255, 0.4);
            animation: siegfried-slash-blade 0.6s ease-out forwards;
        }

        .siegfried-sword-slash-vfx::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(135deg);
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 215, 0, 0.3) 10%, 
                rgba(255, 215, 0, 0.8) 30%, 
                #ffd700 50%, 
                rgba(255, 215, 0, 0.8) 70%, 
                rgba(255, 215, 0, 0.3) 90%, 
                transparent 100%
            );
            border-radius: 1.5px;
            box-shadow: 
                0 0 3px rgba(255, 215, 0, 0.8),
                0 0 6px rgba(255, 215, 0, 0.5);
            animation: siegfried-slash-trail 0.6s ease-out 0.1s forwards;
        }

        /* Container animation */
        @keyframes siegfried-slash-container {
            0% {
                transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
                opacity: 0;
            }
            20% {
                transform: translate(-50%, -50%) scale(1) rotate(10deg);
                opacity: 1;
            }
            80% {
                transform: translate(-50%, -50%) scale(1.1) rotate(-5deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
                opacity: 0;
            }
        }

        /* Main blade slash animation */
        @keyframes siegfried-slash-blade {
            0% {
                opacity: 0;
                width: 0;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(0);
            }
            15% {
                opacity: 1;
                width: 80px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1);
            }
            40% {
                opacity: 1;
                width: 140px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.1);
            }
            70% {
                opacity: 0.8;
                width: 160px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.2);
            }
            100% {
                opacity: 0;
                width: 180px;
                transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.3);
            }
        }

        /* Secondary trail animation */
        @keyframes siegfried-slash-trail {
            0% {
                opacity: 0;
                width: 0;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(0);
            }
            20% {
                opacity: 0.8;
                width: 60px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1);
            }
            50% {
                opacity: 0.6;
                width: 100px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1.1);
            }
            100% {
                opacity: 0;
                width: 120px;
                transform: translate(-50%, -50%) rotate(135deg) scaleX(1.2);
            }
        }
    `;
    
    document.head.appendChild(styleSheet);
};

// Run the CSS injector
injectSiegfriedCSS();

// W: Lion Protection
const schoolboySiegfriedLionProtectionEffect = (caster) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Lion Protection!`);

    // Calculate missing health heal
    const missingHp = caster.stats.maxHp - caster.stats.currentHp;
    const healAmount = Math.floor(missingHp * 0.10);
    if (healAmount > 0) {
        const healResult = caster.heal(healAmount, caster);
        log(`${caster.name} heals for ${healResult.healAmount} (10% of missing health).`);

        // Add healing VFX
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx lion-protection-heal';
            healVfx.textContent = `+${healResult.healAmount}`;
            casterElement.appendChild(healVfx);
            setTimeout(() => healVfx.remove(), 1000);
        }
    }

    // Create the Armor/Magical Shield buff
    const lionProtectionBuff = new Effect(
        'schoolboy_siegfried_w_buff',
        'Lion Protection',
        'Icons/abilities/lion_protection.jfif', 
        5, // Duration: 5 turns
        (character) => {
            // No ongoing effect, stats applied/reverted via statModifiers and remove function
        },
        false // isDebuff = false
    ).setDescription('Increases Armor and Magical Shield by 50%.');

    // Calculate bonus amounts
    const bonusArmor = Math.floor(caster.stats.armor * 0.50);
    const bonusMagicalShield = Math.floor(caster.stats.magicalShield * 0.50);

    // Define stat modifiers to be applied
    lionProtectionBuff.statModifiers = [
        { stat: 'armor', value: bonusArmor, operation: 'add' },
        { stat: 'magicalShield', value: bonusMagicalShield, operation: 'add' }
    ];
    
    // Ensure originalStats is initialized if not present
    if (!lionProtectionBuff.originalStats) {
        lionProtectionBuff.originalStats = {};
    }

    // Store original values BEFORE adding the buff (addBuff will apply the modifiers)
    lionProtectionBuff.originalStats.armor = caster.stats.armor;
    lionProtectionBuff.originalStats.magicalShield = caster.stats.magicalShield;
    
    // Add log entry for the stat gain
    log(`${caster.name} gains +${bonusArmor} Armor and +${bonusMagicalShield} Magical Shield.`);

    // Define the onRemove function (correct property name for buff system)
    lionProtectionBuff.onRemove = (character) => {
        // No need to manually revert here, the base removeBuff handles it using originalStats
        log(`${character.name}'s Lion Protection fades.`);

        // Remove VFX using unique ID for reliable removal
        const shieldVfx = document.getElementById(`lion-shield-${character.instanceId || character.id}`);
        if (shieldVfx) {
            // Add fade-out animation before removal
            shieldVfx.classList.add('lion-shield-fadeout');
            setTimeout(() => {
                if (shieldVfx.parentNode) {
                    shieldVfx.remove();
                }
            }, 500); // Allow time for fade-out animation
        } else {
            console.warn('Lion Protection shield VFX not found for removal');
        }
        
        // Play shield deactivation sound
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
        playSound('sounds/lion_protection_deactivate.mp3', 0.5);
    };

    // Apply the buff to the caster
    caster.addBuff(lionProtectionBuff.clone()); 

    // --- Enhanced Lion Protection VFX --- 
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        // Create main shield container
        const shieldVfx = document.createElement('div');
        shieldVfx.className = 'lion-protection-shield-vfx';
        shieldVfx.id = `lion-shield-${caster.instanceId || caster.id}`; // Add unique ID for reliable removal
        
        // Create shield layers for better visual effect
        const shieldCore = document.createElement('div');
        shieldCore.className = 'lion-shield-core';
        
        const shieldRings = document.createElement('div');
        shieldRings.className = 'lion-shield-rings';
        
        const lionSymbol = document.createElement('div');
        lionSymbol.className = 'lion-shield-symbol';
        
        const shieldParticles = document.createElement('div');
        shieldParticles.className = 'lion-shield-particles';
        
        // Assemble the shield VFX
        shieldVfx.appendChild(shieldCore);
        shieldVfx.appendChild(shieldRings);
        shieldVfx.appendChild(lionSymbol);
        shieldVfx.appendChild(shieldParticles);
        
        casterElement.appendChild(shieldVfx);
        
        // Play shield activation sound
        playSound('sounds/lion_protection_activate.mp3', 0.7);
    }
    // --- End Enhanced VFX ---

    // Play sound
    playSound('sounds/siegfrieda2.mp3', 0.8); // Siegfried's voice line for W

    updateCharacterUI(caster);
};

const schoolboySiegfriedW = new Ability(
    'schoolboy_siegfried_w',
    'Lion Protection',
    'Icons/abilities/lion_protection.jfif',
    65, // Mana cost
    10,  // Cooldown
    schoolboySiegfriedLionProtectionEffect
).setDescription('Heals for 10% of missing health (scales with Healing Power). Gains 50% bonus Armor and Magical Shield for 5 turns.')
 .setTargetType('self');

// Q: Sword Slash with VFX
const schoolboySiegfriedSwordSlashEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    if (!target) {
        log("Siegfried Q: No target selected!", "error");
        return;
    }

    log(`${caster.name} performs a Sword Slash against ${target.name}!`);

    // --- Sword Slash VFX ---
    const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
    if (targetElement) {
        const slashVfx = document.createElement('div');
        slashVfx.className = 'siegfried-sword-slash-vfx';
        targetElement.appendChild(slashVfx);

        // Remove VFX after animation completes
        setTimeout(() => {
            slashVfx.remove();
        }, 600); // Match animation duration
    }
    // --- End Sword Slash VFX ---

    // Calculate damage: 100% Physical Damage
    const baseDamage = caster.stats.physicalDamage;

    // Apply damage
    const result = target.applyDamage(baseDamage, 'physical', caster);
    
    // Log the damage
    log(`${target.name} takes ${result.damage} physical damage from Sword Slash!${result.isCritical ? ' (Critical Hit!)' : ''}`);

    // Play sound
    playSound('sounds/siegfrieda1.mp3', 0.8); // Siegfried's voice line for Q

    // Update UI
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolboySiegfriedQ = new Ability(
    'schoolboy_siegfried_q',
    'Sword Slash',
    'Icons/abilities/sword_slash.jfif',
    15, // Mana cost
    0,  // Cooldown
    schoolboySiegfriedSwordSlashEffect
).setDescription('Deals 100% Physical Damage.')
 .setTargetType('enemy');

// Re-register abilities including Q and W abilities
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolboySiegfriedQ,
        schoolboySiegfriedW
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_q = schoolboySiegfriedQ;
    window.definedAbilities.schoolboy_siegfried_w = schoolboySiegfriedW;
}

// E: Sword Blessing
const siegfriedSwordBlessingEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    log(`${caster.name} uses Sword Blessing, empowering his blade!`);

    // --- Sword Blessing VFX ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const swordBlessingVfx = document.createElement('div');
        swordBlessingVfx.className = 'sword-blessing-vfx';
        // Optional: Add inner elements for more complex visuals
        swordBlessingVfx.innerHTML = '<div class="sword-glow"></div><div class="power-aura"></div>';
        casterElement.appendChild(swordBlessingVfx);

        // Remove VFX after animation completes
        setTimeout(() => {
            swordBlessingVfx.remove();
        }, 1500); // Adjust duration as needed
    }
    // --- End Sword Blessing VFX ---

    // Create Lifesteal Buff
    const lifestealBuff = new Effect(
        'siegfried_e_lifesteal_buff',
        'Blessed Lifesteal',
        'Icons/buffs/sword_blessing_lifesteal.jfif', // Placeholder icon
        6, // Duration: 6 turns
        null, // No per-turn effect needed, handled by stats
        false // isDebuff = false
    ).setDescription('Gains 15% Lifesteal.');

    // Add stat modifier for lifesteal
    lifestealBuff.statModifiers = [
        { stat: 'lifesteal', value: 0.15, operation: 'add' }
    ];

    // Define remove function if needed (optional for simple stat buffs)
    lifestealBuff.remove = (character) => {
        log(`${character.name}'s Blessed Lifesteal fades.`);
    };

    // Apply lifesteal buff to the caster
    caster.addBuff(lifestealBuff.clone());
    log(`${caster.name} gains Blessed Lifesteal!`);


    // Create Physical Damage Buff
    const damageBuff = new Effect(
        'siegfried_e_damage_buff',
        'Blessed Strength',
        'Icons/buffs/sword_blessing_damage.jfif', // Placeholder icon
        6, // Duration: 6 turns
        null, // No per-turn effect needed, handled by stats
        false // isDebuff = false
    ).setDescription('Gains 200 Physical Damage.');

    // Add stat modifier for physical damage
    damageBuff.statModifiers = [
        { stat: 'physicalDamage', value: 200, operation: 'add' }
    ];

    // Define remove function if needed (optional for simple stat buffs)
    damageBuff.remove = (character) => {
        log(`${character.name}'s Blessed Strength fades.`);
    };

    // Apply damage buff to the caster
    caster.addBuff(damageBuff.clone());
    log(`${caster.name} gains Blessed Strength!`);

    // Play sound
    playSound('sounds/siegfrieda3.mp3', 0.8); // Siegfried's voice line for E

    // Update UI
    updateCharacterUI(caster);
};

const siegfriedE = new Ability(
    'schoolboy_siegfried_e', // Ability ID
    'Sword Blessing',        // Ability Name
    'Icons/abilities/sword_blessing.jfif', // Placeholder icon for the ability itself
    100, // Mana cost
    9,  // Cooldown
    siegfriedSwordBlessingEffect
).setDescription('Siegfried blesses his sword, gaining 15% Lifesteal and 200 Physical Damage for 6 turns.')
 .setTargetType('self'); // Target is self

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Assuming Siegfried's Q ability might be defined elsewhere or needs to be added here too.
    // For now, just registering the E ability.
    AbilityFactory.registerAbilities([
        siegfriedE
        // Add other Siegfried abilities here if defined in this file
    ]);
} else {
    console.warn("Siegfried E ability defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_e = siegfriedE;
}

// R: Judgement
const schoolboySiegfriedJudgementEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
    const gameManager = window.gameManager; // Get reference for finding allies

    if (!target) {
        log("Siegfried R: No target selected!", "error");
        return;
    }

    // --- NEW: Use instanceId for target logging if available ---
    const targetName = target.name || (target.instanceId || target.id);
    log(`${caster.name} calls upon Judgement against ${targetName}!`);
    // --- END NEW ---

    // --- Judgement VFX Start ---
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    // --- NEW: Use instanceId for target element ---
    const targetElementId = target.instanceId || target.id;
    const targetElement = document.getElementById(`character-${targetElementId}`);
    // --- END NEW ---
    const battleContainer = document.querySelector('.battle-container');

    // 1. Earthquake effect
    if (battleContainer) {
        battleContainer.classList.add('earthquake-animation');
        setTimeout(() => battleContainer.classList.remove('earthquake-animation'), 1200); // Duration of earthquake
    }

    // 2. Caster Animation (Optional: Add if a specific casting pose is desired)
    if (casterElement) {
        casterElement.classList.add('siegfried-judgement-cast');
        setTimeout(() => casterElement.classList.remove('siegfried-judgement-cast'), 1000);
    }

    // 3. Impact VFX on Target
    if (targetElement) {
        // Delay impact slightly to sync with potential caster animation/sound
        setTimeout(() => {
            const impactVfx = document.createElement('div');
            impactVfx.className = 'judgement-impact-vfx';
            // You can add inner elements for more complex visuals
            impactVfx.innerHTML = `
                <div class="judgement-light-beam"></div>
                <div class="judgement-shatter-effect"></div>
            `;
            targetElement.appendChild(impactVfx);

            // Play impact sound
            playSound('sounds/judgement_impact.mp3', 0.9); // Placeholder sound

            // Remove armor piercing text
            /*
            const armorBreakText = document.createElement('div');
            armorBreakText.className = 'armor-break-text siegfried-judgement-pierce'; // Specific class
            armorBreakText.textContent = 'ARMOR IGNORED!';
            targetElement.appendChild(armorBreakText);
            */

            setTimeout(() => {
                 impactVfx.remove();
                 // armorBreakText.remove(); // Removed text element
            }, 1500); // Duration of impact VFX
        }, 500); // Delay before impact hits
    }
    // --- Judgement VFX End ---

    // Calculate base damage: 285% AD
    const damageMultiplier = 2.85; // Nerfed from 3.5
    const baseDamage = Math.floor(caster.stats.physicalDamage * damageMultiplier);

    // Remove armor ignore logic
    // const originalArmor = target.stats.armor;
    // target.stats.armor = 0;
    // log(`${caster.name}'s Judgement ignores armor! (Original: ${originalArmor})`);

    // --- REFACTORED: Use applyDamage ---
    // Pass caster as the third argument to correctly handle crits/lifesteal source
    // applyDamage now handles the actual damage calculation (incl. crit) and standard VFX
    const result = target.applyDamage(baseDamage, 'physical', caster);
    // --- END REFACTOR ---

    // Remove armor restore logic
    // target.stats.armor = originalArmor;

    // --- Adjusted Logging: Use result.damage and check isCritical ---
    log(`${targetName} takes ${result.damage} physical damage from Judgement!${result.isCritical ? ' (Critical Hit!)' : ''}`);
    // --- END Adjusted Logging ---


    // Apply lifesteal from caster's stats first (applyLifesteal likely needs the damage dealt)
    const lifestealHeal = caster.applyLifesteal(result.damage);
    if (lifestealHeal > 0) {
         log(`${caster.name} healed for ${lifestealHeal} from innate lifesteal.`);
    }

    // Apply Judgement's heal if damage was dealt
    if (result.damage > 0) {
        const healAmount = result.damage; // Heal based on actual damage dealt

        // Heal caster
        const casterHealResult = caster.heal(healAmount, caster);
        log(`${caster.name} is healed by Judgement for ${casterHealResult.healAmount} HP.`);
        // Add caster heal VFX
        if (casterElement) {
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx judgement-heal-vfx';
            healVfx.textContent = `+${casterHealResult.healAmount}`;
            casterElement.appendChild(healVfx);
            setTimeout(() => healVfx.remove(), 1200);
        }

        // Find a random living ally (player character, not the caster)
        let randomAlly = null;
        if (gameManager && gameManager.gameState && gameManager.gameState.playerCharacters) {
            const potentialAllies = gameManager.gameState.playerCharacters.filter(ally =>
                ally.id !== caster.id && !ally.isDead()
            );

            if (potentialAllies.length > 0) {
                const randomIndex = Math.floor(Math.random() * potentialAllies.length);
                randomAlly = potentialAllies[randomIndex];
            }
        }

        // Heal random ally if found
        if (randomAlly) {
            const allyHealResult = randomAlly.heal(healAmount, caster);
            // --- NEW: Use ally instanceId if available ---
            const allyName = randomAlly.name || (randomAlly.instanceId || randomAlly.id);
            log(`${allyName} is healed by Judgement for ${allyHealResult.healAmount} HP.`);
            // Add ally heal VFX
            const allyElementId = randomAlly.instanceId || randomAlly.id;
            const allyElement = document.getElementById(`character-${allyElementId}`);
            // --- END NEW ---
            if (allyElement) {
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx judgement-heal-vfx'; // Use same style
                healVfx.textContent = `+${allyHealResult.healAmount}`;
                allyElement.appendChild(healVfx);
                setTimeout(() => healVfx.remove(), 1200);
                updateCharacterUI(randomAlly); // Update ally UI
            }
        } else {
            log("No other living allies found to receive Judgement's heal.");
        }
    }

    // Play sound
    playSound('sounds/siegfrieda4.mp3', 0.8); // Siegfried's voice line for R (placeholder)

    // Update UI for caster and target
    updateCharacterUI(caster);
    updateCharacterUI(target);
};

const schoolboySiegfriedR = new Ability(
    'schoolboy_siegfried_r', // Ability ID
    'Judgement',             // Ability Name
    'Icons/abilities/judgement.jfif', // Placeholder icon
    100, // Mana cost
    15,  // Cooldown
    schoolboySiegfriedJudgementEffect
).setDescription('Deals 285% AD physical damage. If damage is dealt, Siegfried and a random ally are healed for the damage amount (scales with Healing Power).') // Updated description
 .setTargetType('enemy'); // Target is enemy

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Registering Q, W, E, and R abilities.
    AbilityFactory.registerAbilities([
        schoolboySiegfriedQ,  // Add Q ability here
        schoolboySiegfriedW,
        siegfriedE,
        schoolboySiegfriedR
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_q = schoolboySiegfriedQ; // Add Q ability here
    window.definedAbilities.schoolboy_siegfried_w = schoolboySiegfriedW;
    window.definedAbilities.schoolboy_siegfried_e = siegfriedE;
    window.definedAbilities.schoolboy_siegfried_r = schoolboySiegfriedR;
} 