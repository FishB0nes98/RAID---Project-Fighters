// Passive Factory to manage and instantiate passive handlers

class PassiveFactory {
    constructor() {
        this.registeredPassives = new Map();
        console.log("PassiveFactory initialized.");
    }

    /**
     * Registers a passive handler class associated with a passive ID.
     * @param {string} passiveId - The unique ID of the passive (e.g., 'monster_apple_curse').
     * @param {Class} handlerClass - The class responsible for handling the passive logic.
     */
    registerPassive(passiveId, handlerClass) {
        if (this.registeredPassives.has(passiveId)) {
            console.warn(`PassiveFactory: Passive with ID '${passiveId}' is already registered. Overwriting.`);
        }
        this.registeredPassives.set(passiveId, handlerClass);
        console.log(`PassiveFactory: Registered passive '${passiveId}'.`);
    }

    /**
     * Creates an instance of a passive handler for a given character, if a handler is registered for their passive.
     * @param {Character} character - The character instance.
     * @returns {object|null} - An instance of the passive handler or null if no handler is registered.
     */
    createPassiveHandler(character) {
        if (!character.passive || !character.passive.id) {
            return null; // Character has no passive or passive ID
        }

        const passiveId = character.passive.id;
        const HandlerClass = this.registeredPassives.get(passiveId);

        if (HandlerClass) {
            try {
                // Assumes the handler constructor takes the character instance
                return new HandlerClass(character);
            } catch (error) {
                console.error(`PassiveFactory: Error instantiating handler for passive '${passiveId}':`, error);
                return null;
            }
        } else {
            // console.log(`PassiveFactory: No specific handler registered for passive '${passiveId}'.`);
            return null; // No specific handler registered for this passive
        }
    }

    /**
     * Gets the passive handler class for a given passive ID.
     * @param {string} passiveId - The unique ID of the passive.
     * @returns {Class|null} - The registered handler class or null.
     */
    getPassiveHandlerClass(passiveId) {
        return this.registeredPassives.get(passiveId) || null;
    }

    // --- NEW METHOD: Retrieve the registered class constructor ---
    getHandlerClass(passiveId) {
        if (this.registeredPassives.has(passiveId)) {
            return this.registeredPassives.get(passiveId);
        }
        // Optional: Log if not found, CharacterFactory should handle warnings
        // console.log(`[PassiveFactory] Handler class not found for ID: ${passiveId}`);
        return null;
    }
    // --- END NEW METHOD ---
}

// Create a global instance (or manage it within GameManager)
const GlobalPassiveFactory = new PassiveFactory();

// Make the instance accessible globally using the expected name
window.PassiveFactory = GlobalPassiveFactory; 