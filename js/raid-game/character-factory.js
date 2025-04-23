// Character Factory Extensions
// This file extends the CharacterFactory with additional functionality to support custom character classes

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

// Override the original createCharacter method to use custom classes if registered
const originalCreateCharacter = CharacterFactory.createCharacter;
CharacterFactory.createCharacter = function(charData) {
    // Check if we have a custom class for this character ID
    if (charData && charData.id && this.customCharacterClasses[charData.id]) {
        console.log(`Creating character ${charData.id} using custom character class`);
        
        // Use the custom class constructor
        const CustomClass = this.customCharacterClasses[charData.id];
        const character = new CustomClass(
            charData.id,
            charData.name,
            charData.image,
            charData.stats
        );
        
        // Add abilities
        if (charData.abilities) {
            charData.abilities.forEach(abilityData => {
                const ability = AbilityFactory.createAbility(abilityData);
                character.addAbility(ability);
            });
        }
        
        // Add passive
        if (charData.passive) {
            character.passive = charData.passive;
        }
        
        if (charData.isAI) {
            character.isAI = true;
        }
        
        return character;
    }
    
    // If no custom class is registered, use the original method
    return originalCreateCharacter.call(this, charData);
}; 