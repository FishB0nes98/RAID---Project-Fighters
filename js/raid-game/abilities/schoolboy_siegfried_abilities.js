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
        const actualHeal = caster.heal(healAmount);
        log(`${caster.name} heals for ${actualHeal} (10% of missing health).`);

        // Add healing VFX
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        if (casterElement) {
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx lion-protection-heal';
            healVfx.textContent = `+${actualHeal}`;
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
    lionProtectionBuff.statModifiers = {
        armor: bonusArmor,
        magicalShield: bonusMagicalShield
    };
    
    // Ensure originalStats is initialized if not present
    if (!lionProtectionBuff.originalStats) {
        lionProtectionBuff.originalStats = {};
    }

    // Store original values BEFORE adding the buff (addBuff will apply the modifiers)
    lionProtectionBuff.originalStats.armor = caster.stats.armor;
    lionProtectionBuff.originalStats.magicalShield = caster.stats.magicalShield;
    
    // Add log entry for the stat gain
    log(`${caster.name} gains +${bonusArmor} Armor and +${bonusMagicalShield} Magical Shield.`);

    // Define the remove function to correctly revert the stats
    lionProtectionBuff.remove = (character) => {
        // No need to manually revert here, the base removeBuff handles it using originalStats
        log(`${character.name}'s Lion Protection fades.`);

        // Remove VFX
        const casterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (casterElement) {
            const shieldVfx = casterElement.querySelector('.lion-protection-shield-vfx');
            if (shieldVfx) shieldVfx.remove();
        }
    };

    // Apply the buff to the caster
    caster.addBuff(lionProtectionBuff.clone()); 

    // --- Lion Protection VFX --- 
    const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
    if (casterElement) {
        const shieldVfx = document.createElement('div');
        shieldVfx.className = 'lion-protection-shield-vfx';
        casterElement.appendChild(shieldVfx);
        
        // Optional: Remove after buff duration? No, remove() handles it.
        // setTimeout(() => shieldVfx.remove(), lionProtectionBuff.duration * 1000); // Example if remove didn't handle it
    }
    // --- End VFX ---

    // Play sound
    playSound('sounds/siegfrieda2.mp3', 0.8); // Siegfried's voice line for W

    updateCharacterUI(caster);
};

const schoolboySiegfriedW = new Ability(
    'schoolboy_siegfried_w',
    'Lion Protection',
    'Icons/abilities/lion_protection.jfif',
    120, // Mana cost
    15,  // Cooldown
    schoolboySiegfriedLionProtectionEffect
).setDescription('Heals for 10% of missing health. Gains 50% bonus Armor and Magical Shield for 5 turns.')
 .setTargetType('self');

// Re-register abilities including the new W ability
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    AbilityFactory.registerAbilities([
        schoolboySiegfriedW
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    window.definedAbilities = window.definedAbilities || {};
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
    lifestealBuff.statModifiers = { lifesteal: 0.15 };

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
    damageBuff.statModifiers = { physicalDamage: 200 };

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
    125, // Mana cost
    12,  // Cooldown
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
        const casterHealActual = caster.heal(healAmount);
        log(`${caster.name} is healed by Judgement for ${casterHealActual} HP.`);
        // Add caster heal VFX
        if (casterElement) {
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx judgement-heal-vfx';
            healVfx.textContent = `+${casterHealActual}`;
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
            const allyHealActual = randomAlly.heal(healAmount);
            // --- NEW: Use ally instanceId if available ---
            const allyName = randomAlly.name || (randomAlly.instanceId || randomAlly.id);
            log(`${allyName} is healed by Judgement for ${allyHealActual} HP.`);
            // Add ally heal VFX
            const allyElementId = randomAlly.instanceId || randomAlly.id;
            const allyElement = document.getElementById(`character-${allyElementId}`);
            // --- END NEW ---
            if (allyElement) {
                const healVfx = document.createElement('div');
                healVfx.className = 'heal-vfx judgement-heal-vfx'; // Use same style
                healVfx.textContent = `+${allyHealActual}`;
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
    200, // Mana cost
    25,  // Cooldown
    schoolboySiegfriedJudgementEffect
).setDescription('Deals 285% AD physical damage. If damage is dealt, Siegfried and a random ally are healed for the damage amount.') // Updated description
 .setTargetType('enemy'); // Target is enemy

// --- Ability Factory Integration ---
if (typeof AbilityFactory !== 'undefined' && typeof AbilityFactory.registerAbilities === 'function') {
    // Assuming Siegfried's Q ability might be defined elsewhere or needs to be added here too.
    // Registering W, E, and R abilities.
    AbilityFactory.registerAbilities([
        schoolboySiegfriedW,
        siegfriedE,
        schoolboySiegfriedR // Add R ability here
    ]);
} else {
    console.warn("Siegfried abilities defined but AbilityFactory not found or registerAbilities method missing.");
    // Fallback: assign to a global object
    window.definedAbilities = window.definedAbilities || {};
    window.definedAbilities.schoolboy_siegfried_w = schoolboySiegfriedW;
    window.definedAbilities.schoolboy_siegfried_e = siegfriedE;
    window.definedAbilities.schoolboy_siegfried_r = schoolboySiegfriedR; // Add R ability here
} 