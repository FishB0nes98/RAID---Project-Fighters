/**
 * TalentManager - Handles all talent-related operations without modifying the game engine
 * Loads talent definitions from character-specific json files and applies them at runtime
 */
class TalentManager {
    constructor() {
        this.talentRegistry = {};
        this.characterTalents = {};
        this.initialized = false;
    }

    /**
     * Initialize the talent manager
     */
    async initialize() {
        console.log("[TalentManager] Initialize started.");
        if (this.initialized) {
            console.log("[TalentManager] Already initialized. Skipping.");
            return;
        }
        
        try {
            console.log("[TalentManager] Calling preloadAllTalents...");
            await this.preloadAllTalents();
            console.log("[TalentManager] preloadAllTalents completed successfully.");
            
            console.log('TalentManager initialized successfully');
            this.initialized = true;
            console.log("[TalentManager] Initialization flag set to true.");
        } catch (error) {
            // Explicitly log the error that occurred during initialization
            console.error('[TalentManager] Initialization failed during preloadAllTalents:', error);
            throw new Error('TalentManager failed to initialize'); // Re-throw a general error
        }
    }

    /**
     * Preload all character talents
     */
    async preloadAllTalents() {
        console.log("[TalentManager] Starting preloadAllTalents...");
        try {
            // Get a list of all available characters
            if (typeof CharacterFactory === 'undefined') {
                throw new Error("CharacterFactory is not defined globally.");
            }
            console.log("[TalentManager] CharacterFactory found.");
            
            const characterFactory = new CharacterFactory();
            console.log("[TalentManager] CharacterFactory instance created.");
            
            const availableCharacters = await characterFactory.getAvailableCharacters();
            console.log(`[TalentManager] Fetched available characters: ${availableCharacters.length} found`, availableCharacters);
            
            if (!availableCharacters || availableCharacters.length === 0) {
                console.warn("[TalentManager] No available characters found in registry. Cannot preload talents.");
                return; // Don't throw error, just warn and exit preload
            }
            
            // Load talents for each character
            for (const characterId of availableCharacters) {
                console.log(`[TalentManager] Preloading talents for: ${characterId}`);
                await this.loadTalentDefinitions(characterId);
            }
            console.log("[TalentManager] Finished preloading talents for all characters.");
        } catch (error) {
            console.error('[TalentManager] Error during preloadAllTalents:', error);
            throw error; // Re-throw the error to be caught by initialize
        }
    }

    /**
     * Load talent definitions for a specific character
     */
    async loadTalentDefinitions(characterId) {
        try {
            // Check if we already loaded this character's talents
            if (this.talentRegistry[characterId]) {
                return this.talentRegistry[characterId];
            }

            // Fetch talent definitions from the character-specific JSON file
            const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
            if (!response.ok) {
                // If no talents file exists, return empty talents
                console.warn(`No talent definitions found for character ${characterId}`);
                this.talentRegistry[characterId] = { characterId, talentTree: {} };
                return this.talentRegistry[characterId];
            }

            const talentDefinitions = await response.json();
            this.talentRegistry[characterId] = talentDefinitions;
            return talentDefinitions;
        } catch (error) {
            console.error(`Error loading talent definitions for ${characterId}:`, error);
            // Return empty talent tree as fallback
            this.talentRegistry[characterId] = { characterId, talentTree: {} };
            return this.talentRegistry[characterId];
        }
    }

    /**
     * Get selected talents for a character from Firebase
     */
    async getSelectedTalents(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('No user ID available for fetching selected talents');
            return [];
        }

        try {
            const snapshot = await firebaseDatabase.ref(`userTalents/${userId}/${characterId}`).once('value');
            const selectedTalents = snapshot.val() || [];
            return selectedTalents;
        } catch (error) {
            console.error(`Error fetching selected talents for ${characterId}:`, error);
            return [];
        }
    }

    /**
     * Save selected talents for a character to Firebase
     */
    async saveSelectedTalents(characterId, selectedTalents, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for saving talents');
            throw new Error('User not authenticated');
        }

        try {
            await firebaseDatabase.ref(`userTalents/${userId}/${characterId}`).set(selectedTalents);
            console.log(`Saved talents for ${characterId}`);
            // Update local cache
            if (!this.characterTalents[characterId]) {
                this.characterTalents[characterId] = {};
            }
            this.characterTalents[characterId][userId] = selectedTalents;
            return true;
        } catch (error) {
            console.error(`Error saving talents for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Apply talents to a character without modifying the game engine
     */
    async applyTalentsToCharacter(character, selectedTalentIds = []) {
        if (!character || !character.id) {
            console.error('Invalid character provided for talent application');
            return character;
        }

        try {
            // Load talent definitions if not already loaded
            const talentDefinitions = await this.loadTalentDefinitions(character.id);
            if (!talentDefinitions || !talentDefinitions.talentTree) {
                console.warn(`No talent tree found for character ${character.id}`);
                return character; // Return unmodified character
            }

            // Apply each selected talent
            for (const talentId of selectedTalentIds) {
                const talent = talentDefinitions.talentTree[talentId];
                if (!talent) {
                    console.warn(`Talent ${talentId} not found in talent tree for ${character.id}`);
                    continue;
                }

                // Apply talent effect based on its type
                if (talent.effect) {
                    this.applyTalentEffect(character, talent.effect);
                }
            }

            return character;
        } catch (error) {
            console.error(`Error applying talents to ${character.id}:`, error);
            return character; // Return unmodified character on error
        }
    }

    /**
     * Apply a specific talent effect to a character
     */
    applyTalentEffect(character, effect) {
        if (!effect || !effect.type) {
            console.warn('Invalid talent effect', effect);
            return;
        }

        switch (effect.type) {
            case 'modify_stat':
                this.applyStatModification(character, effect);
                break;
            case 'modify_ability':
                this.applyAbilityModification(character, effect);
                break;
            case 'add_ability':
                this.applyAddAbility(character, effect);
                break;
            case 'modify_passive':
                this.applyPassiveModification(character, effect);
                break;
            case 'modify_character_property':
                this.applyCharacterPropertyModification(character, effect);
                break;
            default:
                console.warn(`Unknown talent effect type: ${effect.type}`);
        }
    }

    /**
     * Apply stat modification from talent
     */
    applyStatModification(character, effect) {
        if (!effect.stat || effect.value === undefined) {
            console.warn('Invalid stat modification effect', effect);
            return;
        }

        // Use the character's existing method to modify stats
        const operation = effect.operation || 'set'; // Default to set
        character.applyStatModification(effect.stat, operation, effect.value);
        
        console.log(`Applied stat modification to ${character.name}: ${effect.stat} ${operation} ${effect.value}`);
    }

    /**
     * NEW: Apply character property modification from talent
     */
    applyCharacterPropertyModification(character, effect) {
        if (!effect.property || effect.value === undefined) {
            console.warn('Invalid character property modification effect', effect);
            return;
        }

        // Directly set the property on the character instance
        character[effect.property] = effect.value;
        console.log(`Applied character property modification to ${character.name}: Set ${effect.property} to ${effect.value}`);

        // Specific handling for Farmer Shoma's passive description
        if (character.id === 'farmer_shoma' && effect.property === 'passiveCritBoostValue' && character.passive) {
            character.passive.description = `You start with 50% crit chance, increased to ${effect.value * 100}% after turn 20.`;
            console.log(`Updated ${character.name}'s passive description to reflect ${effect.value * 100}% boost.`);
            // Optionally, trigger a UI update if necessary, though it might happen automatically
            // if (typeof updateCharacterUI === 'function') { updateCharacterUI(character); }
        }
    }

    /**
     * Apply ability modification from talent
     */
    applyAbilityModification(character, effect) {
        if (!effect.abilityId || !effect.property || effect.value === undefined) {
            console.warn('Invalid ability modification effect', effect);
            return;
        }

        // Find the ability
        const ability = character.abilities.find(ability => ability.id === effect.abilityId);
        if (!ability) {
            console.warn(`Ability ${effect.abilityId} not found for character ${character.name}`);
            return;
        }

        // Calculate the new value based on the operation
        let newValue;
        const currentValue = ability[effect.property];
        const operation = effect.operation || 'set'; // Default to 'set'

        if (operation === 'set') {
            newValue = effect.value;
        } else if (operation === 'add') {
            newValue = (currentValue || 0) + effect.value; // Ensure currentValue is a number
        } else if (operation === 'multiply') {
            newValue = (currentValue || 0) * effect.value;
        } else if (operation === 'subtract') {
            newValue = (currentValue || 0) - effect.value;
        } else if (operation === 'divide') {
            // Prevent division by zero
            newValue = effect.value !== 0 ? (currentValue || 0) / effect.value : currentValue;
        } else {
            console.warn(`Unknown ability modification operation: ${operation}`);
            return; // Don't apply if operation is invalid
        }

        // Apply the modification to the ability property
        ability[effect.property] = newValue;
        console.log(`${operation === 'set' ? 'Set' : operation.charAt(0).toUpperCase() + operation.slice(1) + 'ed'} ${character.name}'s ${effect.abilityId} ${effect.property} to ${newValue}`);

        // --- NEW: Regenerate description after modification ---
        if (typeof ability.generateDescription === 'function') {
            ability.generateDescription();
            console.log(`Updated description for ${character.name}'s ${effect.abilityId}`);
        }
        // --- END NEW ---

        // Also try using the character's method if available (for potential extra logic/UI updates)
        if (typeof character.applyAbilityModification === 'function') {
            try {
                // Note: This character method might need updating if it doesn't use operations correctly
                character.applyAbilityModification(effect.abilityId, effect.property, operation, effect.value);
            } catch (error) {
                console.warn(`Error applying ability modification using character method: ${error.message}`);
            }
        }

        // Log the final applied modification
        console.log(`Applied ability modification to ${character.name}'s ${effect.abilityId}: ${effect.property} ${operation} ${effect.value} (Result: ${ability[effect.property]})`);
    }

    /**
     * Apply add ability effect from talent
     */
    applyAddAbility(character, effect) {
        if (!effect.ability) {
            console.warn('Invalid add ability effect', effect);
            return;
        }

        // Add the new ability
        character.addAbility(effect.ability);
        console.log(`Added ability ${effect.ability.name} to ${character.name}`);
    }

    /**
     * Apply passive modification from talent
     */
    applyPassiveModification(character, effect) {
        if (!effect.property || effect.value === undefined) {
            console.warn('Invalid passive modification effect', effect);
            return;
        }

        // Modify the passive
        if (character.passive) {
            const operation = effect.operation || 'set'; // Default to set
            
            if (operation === 'set') {
                character.passive[effect.property] = effect.value;
            } else if (operation === 'add') {
                character.passive[effect.property] += effect.value;
            } else if (operation === 'multiply') {
                character.passive[effect.property] *= effect.value;
            }
            
            console.log(`Applied passive modification to ${character.name}: ${effect.property} ${operation} ${effect.value}`);
        } else {
            console.warn(`Character ${character.name} has no passive ability to modify`);
        }
    }

    /**
     * Hook into character creation process to apply talents
     * This is called by our modified talent application code
     */
    async enhanceCharacterWithTalents(character) {
        if (!character || !character.id) return character;
        
        try {
            // Get user ID
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('No user ID available for talent application');
                return character;
            }
            
            // Get selected talents for this character
            const selectedTalents = await this.getSelectedTalents(character.id, userId);
            if (!selectedTalents || selectedTalents.length === 0) {
                console.log(`No talents selected for ${character.id}`);
                return character;
            }
            
            // Apply talents to the character
            return await this.applyTalentsToCharacter(character, selectedTalents);
        } catch (error) {
            console.error(`Error enhancing character ${character.id} with talents:`, error);
            return character; // Return unmodified character on error
        }
    }
}

// Create singleton instance
const talentManager = new TalentManager();

// Remove the hook that's causing errors since we apply talents in stage-manager.js
// const originalCreateCharacter = CharacterFactory.prototype.createCharacter;
// CharacterFactory.prototype.createCharacter = async function(charData, selectedTalentIds = []) {
//     // Call the original method first
//     const character = await originalCreateCharacter.call(this, charData);
//     
//     // If no specific talent IDs were provided, get them from the talent manager
//     if (!selectedTalentIds || selectedTalentIds.length === 0) {
//         return await talentManager.enhanceCharacterWithTalents(character);
//     } else {
//         // Apply specific talent IDs (used when testing)
//         return await talentManager.applyTalentsToCharacter(character, selectedTalentIds);
//     }
// }; 