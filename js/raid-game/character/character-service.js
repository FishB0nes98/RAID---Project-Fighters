// Service for managing character data loading and caching
class CharacterService {
    constructor() {
        this.characterDataCache = new Map();
        this.characterRegistry = null;
    }

    // Initialize the service by loading the character registry
    async initialize() {
        if (this.characterRegistry) {
            return;
        }
        try {
            const response = await fetch('js/raid-game/character-registry.json');
            if (!response.ok) {
                throw new Error('Failed to load character registry');
            }
            this.characterRegistry = await response.json();
            console.log('[CharacterService] Character registry loaded and cached.');
        } catch (error) {
            console.error('[CharacterService] Error initializing:', error);
            throw error;
        }
    }

    // Get character data, loading from file if not in cache
    async getCharacterData(characterId) {
        if (this.characterDataCache.has(characterId)) {
            return this.characterDataCache.get(characterId);
        }

        // Data not in cache, so load it from the character's JSON file
        try {
            const characterFile = `js/raid-game/characters/${characterId}.json`;
            const response = await fetch(characterFile);
            if (!response.ok) {
                throw new Error(`Failed to load character data file: ${characterFile}`);
            }
            const characterData = await response.json();
            
            // Cache the loaded data
            this.characterDataCache.set(characterId, characterData);
            console.log(`[CharacterService] Loaded and cached data for ${characterId}`);
            
            return characterData;
        } catch (error) {
            console.error(`[CharacterService] Error loading character data for ${characterId}:`, error);
            return null;
        }
    }

    // Preload character data for a list of character IDs
    async preloadCharacterData(characterIds) {
        console.log(`[CharacterService] Preloading data for characters:`, characterIds);
        const preloadPromises = characterIds.map(id => this.getCharacterData(id));
        await Promise.all(preloadPromises);
        console.log('[CharacterService] Preloading complete.');
    }
}

// Create a global instance of the character service
window.characterService = new CharacterService();
