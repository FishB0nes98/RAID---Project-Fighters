// Character Factory Extensions
// This file extends the CharacterFactory with additional functionality to support custom character classes and passive handlers

// Map passive IDs to their corresponding class names
// Assumes passive classes are globally available (e.g., window.AngryPigPassive)
CharacterFactory.passiveIdToClassMap = {
    'angry_pig_damage_heal': 'AngryPigPassive',
    'angry_chicken_dodge_gain': 'AngryChickenPassive',
    'angry_bull_armor_gain': 'AngryBullPassive',
    'lifesteal_on_stun': 'InfernalBirdiePassive',
    'farmer_raiden_zap': 'FarmerRaidenPassive',
    // Add other passive ID -> Class mappings here
};

// Custom character class registry
CharacterFactory.customCharacterClasses = {};

/**
 * Register a custom Character class to be used when creating characters with a specific ID
 * @param {string} characterId - The character ID to associate with this custom class
 * @param {function} characterClass - The custom Character class constructor
 */
CharacterFactory.registerCharacterClass = function(characterId, characterClass) {
    if (!characterId || typeof characterId !== 'string') {
        console.error('Invalid characterId provided to registerCharacterClass');
        return;
    }
    
    if (!characterClass || typeof characterClass !== 'function') {
        console.error('Invalid characterClass provided to registerCharacterClass');
        return;
    }
    
    console.log(`Registering custom character class for: ${characterId}`);
    this.customCharacterClasses[characterId] = characterClass;
};

// Override the original createCharacter method to use custom classes and passive handlers
const originalCreateCharacter = CharacterFactory.createCharacter;
CharacterFactory.createCharacter = function(charData) {
    let character;
    // Check if we have a custom class for this character ID
    if (charData && charData.id && this.customCharacterClasses[charData.id]) {
        console.log(`Creating character ${charData.id} using custom character class`);
        const CustomClass = this.customCharacterClasses[charData.id];
        character = new CustomClass(
            charData.id,
            charData.name,
            charData.image,
            { ...charData.stats } // Pass a copy of stats
        );
    } else {
        // If no custom class is registered, use the original method or base Character class
        // Assuming originalCreateCharacter exists and uses the base Character class
         console.log(`Creating character ${charData.id} using base Character class`);
         // Ensure the base Character class constructor handles stats correctly
         character = new Character(
             charData.id,
             charData.name,
             charData.image,
             { ...charData.stats } // Pass a copy of stats
         );
        // --- Fallback if originalCreateCharacter is not reliable ---
        // character = originalCreateCharacter ? originalCreateCharacter.call(this, charData) :
        //     new Character(charData.id, charData.name, charData.image, { ...charData.stats });
    }

    // Add abilities
    if (charData.abilities) {
        charData.abilities.forEach(abilityData => {
            const ability = AbilityFactory.createAbility(abilityData);
            if (ability) { // Check if ability creation was successful
                character.addAbility(ability);
            } else {
                console.warn(`Failed to create or add ability ${abilityData.id || 'unknown'} for ${character.name}`);
            }
        });
    }

    // Add passive info (description, icon)
    if (charData.passive) {
        character.passive = { ...charData.passive }; // Store passive info

        // --- NEW: Instantiate Passive Handler ---
        const passiveId = charData.passive.id;
        const PassiveClassName = this.passiveIdToClassMap[passiveId];

        if (PassiveClassName) {
            const PassiveClass = window[PassiveClassName]; // Get class from global scope
            if (PassiveClass && typeof PassiveClass === 'function') {
                try {
                    character.passiveHandler = new PassiveClass();
                    console.log(`[CharacterFactory] Instantiated passive handler ${PassiveClassName} for ${character.name}`);
                    if (typeof character.passiveHandler.initialize === 'function') {
                        character.passiveHandler.initialize(character);
                        console.log(`[CharacterFactory] Initialized passive handler for ${character.name}`);
                    } else {
                        console.log(`[CharacterFactory] Passive handler ${PassiveClassName} for ${character.name} has no initialize method.`);
                    }
                } catch (error) {
                    console.error(`[CharacterFactory] Error loading or initializing passive ${PassiveClassName} for ${character.name}:`, error);
                }
            } else {
                console.error(`[CharacterFactory] Failed to load passive class ${PassiveClassName} for ${character.name}. PassiveClass type:`, typeof PassiveClass);
            }
        } else {
            console.log(`No specific passive handler class registered for passive ID: ${passiveId}`);
        }
        // --- END NEW ---
    }

    if (charData.isAI) {
        character.isAI = true;
    }
    
    // Ensure baseStats are set correctly after character creation
    // This is crucial for passives that modify based on base stats
    character.baseStats = { ...character.stats }; // Store initial stats as baseStats
    console.log(`[DEBUG] Base stats set for ${character.name}:`, JSON.parse(JSON.stringify(character.baseStats)));
    
    // Initialize ability cooldowns
    character.abilityCooldowns = character.abilities.map(() => 0);

    return character;
}; 