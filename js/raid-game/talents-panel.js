/**
 * TalentsPanelManager - Manages the talents panel UI
 * Shows active talents for characters by reading directly from the game state
 */
class TalentsPanelManager {
    constructor() {
        this.initialized = false;
        this.panelElement = document.getElementById('talents-panel');
        this.charactersListElement = document.getElementById('talents-characters-list');
        this.retryAttempts = 0;
        this.maxRetryAttempts = 5;
        this.loadedTalentDefinitions = {};
    }

    /**
     * Initialize the talents panel
     */
    async initialize() {
        console.log("[TalentsPanelManager] Initializing...");
        if (this.initialized) {
            console.log("[TalentsPanelManager] Already initialized. Skipping.");
            return;
        }

        // Set initial panel state
        if (this.panelElement) {
            this.panelElement.classList.add('collapsed');
            const showButton = document.getElementById('show-talents-button');
            if (showButton) {
                showButton.style.display = 'block';
            }
        }

        try {
            // Make sure we have access to the game manager and game state
            if (!window.gameManager || !window.gameManager.gameState) {
                console.warn("[TalentsPanelManager] Game manager or game state not available. Will retry later.");
                this.scheduleRetry();
                return;
            }

            // Initialize the panel by loading talents for the current game state
            await this.loadTalentsForCurrentGame();

            // Listen for game state changes to update the panel
            document.addEventListener('gameStateChanged', this.handleGameStateChanged.bind(this));
            
            // Listen for turn change to update the panel
            document.addEventListener('turnChanged', this.handleGameStateChanged.bind(this));

            // Set as initialized
            this.initialized = true;
            console.log("[TalentsPanelManager] Initialization complete.");
        } catch (error) {
            console.error("[TalentsPanelManager] Error initializing talents panel:", error);
            this.scheduleRetry();
        }
    }

    /**
     * Schedule a retry for initialization
     */
    scheduleRetry() {
        this.retryAttempts++;
        if (this.retryAttempts <= this.maxRetryAttempts) {
            const delay = Math.min(2000 * this.retryAttempts, 10000); // Exponential backoff up to 10 seconds
            console.log(`[TalentsPanelManager] Scheduling retry ${this.retryAttempts}/${this.maxRetryAttempts} in ${delay}ms`);
            setTimeout(() => this.initialize(), delay);
        } else {
            console.warn(`[TalentsPanelManager] Failed to initialize after ${this.maxRetryAttempts} attempts. Giving up.`);
            // Add a fallback message to the panel if possible
            this.showErrorMessage("Failed to load talents. The feature may not be available.");
        }
    }

    /**
     * Show an error message in the panel
     */
    showErrorMessage(message) {
        if (!this.charactersListElement) return;
        
        this.charactersListElement.innerHTML = '';
        const errorElement = document.createElement('div');
        errorElement.className = 'talents-error-message';
        errorElement.textContent = message;
        this.charactersListElement.appendChild(errorElement);
    }

    /**
     * Handle game state changes
     */
    async handleGameStateChanged() {
        console.log("[TalentsPanelManager] Game state changed. Updating talents panel...");
        await this.loadTalentsForCurrentGame();
    }

    /**
     * Load talents for the current game state
     */
    async loadTalentsForCurrentGame() {
        try {
            if (!window.gameManager || !window.gameManager.gameState) {
                console.warn("[TalentsPanelManager] Game state not available yet. Cannot load talents.");
                return;
            }

            // Clear existing content
            this.charactersListElement.innerHTML = '';

            // Get player characters from game state
            const playerCharacters = window.gameManager.gameState.playerCharacters || [];
            const aiCharacters = window.gameManager.gameState.aiCharacters || [];
            const allCharacters = [...playerCharacters, ...aiCharacters];
            
            if (allCharacters.length === 0) {
                this.showErrorMessage("No characters found in game state.");
                return;
            }

            // Process each character
            for (const character of allCharacters) {
                await this.processCharacterTalents(character);
            }

            console.log("[TalentsPanelManager] Talents panel updated successfully.");
        } catch (error) {
            console.error("[TalentsPanelManager] Error loading talents:", error);
            this.showErrorMessage("Error updating talents panel. Please try refreshing the page.");
        }
    }

    /**
     * Process talents for a single character
     */
    async processCharacterTalents(character) {
        if (!character || !character.id) {
            console.warn("[TalentsPanelManager] Invalid character provided to processCharacterTalents");
            return null;
        }

        const characterId = character.id;
        const selectedTalentIds = this.getSelectedTalentIdsForCharacter(character); // Use helper

        console.log(`[TalentsPanelManager] Found ${selectedTalentIds.length} applied talents for ${character.name}:`, selectedTalentIds);

        // Directly access the preloaded definitions from TalentManager registry
        let talentDefinitions = null;
        if (window.talentManager && window.talentManager.talentRegistry && window.talentManager.talentRegistry[characterId]) {
            talentDefinitions = window.talentManager.talentRegistry[characterId].talentTree;
            console.log(`[TalentsPanelManager] Accessed talent definitions for ${characterId} from talentRegistry.`);
        } else {
            // Fallback or error handling if definitions aren't preloaded
            console.error(`[TalentsPanelManager] Talent definitions for ${characterId} not found in talentManager.talentRegistry. Panel update might fail.`);
            // Optionally, try loading them now as a last resort, though this might indicate an initialization issue.
            // try {
            //     const definitionsData = await window.talentManager.loadTalentDefinitions(characterId);
            //     talentDefinitions = definitionsData ? definitionsData.talentTree : null;
            //     if (talentDefinitions) {
            //         console.warn(`[TalentsPanelManager] Loaded definitions on demand for ${characterId}. Check initialization flow.`);
            //     }
            // } catch (err) {
            //     console.error(`[TalentsPanelManager] Error loading definitions on demand for ${characterId}:`, err);
            // }

            // If still no definitions, return null or an empty element
             if (!talentDefinitions) {
                 this.loadedTalentDefinitions[characterId] = {}; // Ensure it's an empty object
                 return this.createCharacterSection(character, [], {}); // Pass empty talents/definitions
             }
        }

        if (!talentDefinitions) {
             console.error(`[TalentsPanelManager] Failed to get talent definitions for ${characterId}.`);
             this.loadedTalentDefinitions[characterId] = {};
             return this.createCharacterSection(character, [], {});
        }

        // Store the definitions locally in the panel manager instance
        this.loadedTalentDefinitions[characterId] = talentDefinitions;

        // Create the character section using the selected IDs and loaded definitions
        return this.createCharacterSection(character, selectedTalentIds, talentDefinitions);
    }

    /**
     * Helper function to get the applied talent IDs for a character
     */
    getSelectedTalentIdsForCharacter(character) {
        if (!character) {
            return [];
        }
        // Assuming talents are stored in an array property named 'appliedTalents'
        // This property should be populated by the character creation/enhancement process
        return Array.isArray(character.appliedTalents) ? character.appliedTalents : [];
    }

    /**
     * Create a character section in the talents panel
     */
    createCharacterSection(character, talentIds, talentDefinitions, isError = false) {
        // Create the character section container
        const characterSection = document.createElement('div');
        characterSection.className = 'talents-character';
        characterSection.dataset.characterId = character.id;

        // Create the character header
        const characterHeader = document.createElement('div');
        characterHeader.className = 'talents-character-header';

        // Add character portrait
        const characterPortrait = document.createElement('img');
        characterPortrait.className = 'character-portrait-small';
        characterPortrait.src = this.getCharacterPortraitUrl(character);
        characterPortrait.alt = character.name || character.id;
        characterHeader.appendChild(characterPortrait);

        // Add character name
        const characterName = document.createElement('div');
        characterName.className = 'character-name-small';
        characterName.textContent = character.name || character.id;
        characterHeader.appendChild(characterName);

        // Add header to section
        characterSection.appendChild(characterHeader);

        // Create talents list
        const talentsList = document.createElement('div');
        talentsList.className = 'talents-list';
        
        if (isError) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'talents-error-message small'; // Add a small class for inline errors
            errorMessage.textContent = 'Error loading talents';
            talentsList.appendChild(errorMessage);
        }
        // If no talents are selected, show a message
        else if (!talentIds || talentIds.length === 0) {
            const noTalentsMessage = document.createElement('div');
            noTalentsMessage.className = 'no-talents-message';
            noTalentsMessage.textContent = 'No talents applied';
            talentsList.appendChild(noTalentsMessage);
        } else {
            // Add each talent to the list
            for (const talentId of talentIds) {
                // Skip empty talent IDs
                if (!talentId) continue;

                // Pass definitions to createTalentElement
                const talentElement = this.createTalentElement(talentId, character, talentDefinitions);
                talentsList.appendChild(talentElement);
            }
        }

        // Add talents list to section
        characterSection.appendChild(talentsList);

        // Add the section to the panel
        this.charactersListElement.appendChild(characterSection);
    }

    /**
     * Create a talent element for the panel
     */
    createTalentElement(talentId, character, talentDefinitions) {
        const talentElement = document.createElement('div');
        talentElement.className = 'talent-item';
        talentElement.dataset.talentId = talentId;

        // --- NEW: Use Definitions --- 
        let talentName = `Unknown (${talentId})`; // Default fallback name
        let talentDescription = 'No description available.';
        let talentIconSrc = 'images/talents/default.png'; // Default fallback icon
        let isPowerful = false;
        let talentTier = null;

        const talentDefinition = talentDefinitions?.[talentId];

        if (talentDefinition) {
            talentName = talentDefinition.name || talentName;
            talentDescription = talentDefinition.description || talentDescription;
            talentIconSrc = talentDefinition.icon || this.getTalentIconUrl(talentId, character); // Use definition icon, fallback to old method
            isPowerful = talentDefinition.powerful === true; // Check powerful flag
            talentTier = talentDefinition.tier; // Check tier flag
            // --- Add Debug Log --- 
            console.log(`[TalentsPanelManager] Using definition for ${talentId}: Name='${talentName}', Icon='${talentIconSrc}'`);
            // --- End Debug Log ---
        } else {
            // Fallback to old formatting if definition not found
            talentName = this.formatTalentName(talentId); // Use old name formatting
            talentDescription = 'Talent applied to ' + character.name; // Old generic description
            talentIconSrc = this.getTalentIconUrl(talentId, character); // Use old icon lookup
            console.warn(`[TalentsPanelManager] Talent definition not found for ${talentId} in loaded definitions for ${character.id}. Using fallback display.`);
        }
        // --- END NEW ---

        // Store data for tooltip
        talentElement.dataset.talentName = talentName;
        talentElement.dataset.talentDescription = talentDescription;

        // MODIFICATION: Add power & tier attributes based *only* on the definition
        if (isPowerful) {
            talentElement.dataset.powerful = 'true';
        }
        if (talentTier) {
            talentElement.dataset.tier = talentTier;
        }

        // Create talent icon (using potentially updated src)
        const talentIcon = document.createElement('img');
        talentIcon.className = 'talent-icon';
        talentIcon.src = talentIconSrc;
        talentIcon.alt = talentName;
        talentElement.appendChild(talentIcon);

        // Create talent name
        const talentNameElement = document.createElement('div');
        talentNameElement.className = 'talent-name';
        talentNameElement.textContent = talentName;
        talentElement.appendChild(talentNameElement);

        return talentElement;
    }

    /**
     * Format talent name from ID
     */
    formatTalentName(talentId) {
        if (!talentId) return 'Unknown Talent';
        
        // Remove character prefix (e.g., "talent_raiden_" -> "")
        let name = talentId.replace(/^talent_[a-z]+_/i, '');
        
        // Handle numeric suffix (e.g., "storm_1" -> "storm")
        name = name.replace(/_\d+$/, '');
        
        // Replace underscores with spaces
        name = name.replace(/_/g, ' ');
        
        // Capitalize first letter of each word
        name = name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return name;
    }

    /**
     * Get character portrait URL
     */
    getCharacterPortraitUrl(character) {
        // Try to get selected skin image first
        if (window.SkinManager && character.id) {
            try {
                const skinImagePath = window.SkinManager.getCharacterImagePath(character.id);
                if (skinImagePath) {
                    return skinImagePath;
                }
            } catch (error) {
                console.warn(`[TalentsPanelManager] Error getting skin image for ${character.id}: ${error.message}`);
            }
        }
        
        // Try to get portrait from character data
        if (character.portraitUrl) {
            return character.portraitUrl;
        }
        
        // Fallback 1: Try image property directly
        if (character.image) {
            return character.image;
        }
        
        // Default portrait path based on character ID
        return `Loading Screen/${character.id}.png`;
    }

    /**
     * Get talent icon URL
     */
    getTalentIconUrl(talentId, character) {
        // Character-specific patterns
        if (character && character.id) {
            // For Raiden talents
            if (character.id.includes('raiden')) {
                if (talentId.includes('lightning') || talentId.includes('shock')) {
                    return 'images/talents/damage.png';
                }
                if (talentId.includes('shield') || talentId.includes('armor')) {
                    return 'images/talents/shield.png';
                }
                if (talentId.includes('storm')) {
                    return 'images/talents/mana.png';
                }
            }
            
            // For Julia talents
            if (character.id.includes('julia')) {
                if (talentId.includes('heal')) {
                    return 'images/talents/healing.png';
                }
            }
        }
        
        // Generic patterns
        if (talentId.includes('damage') || talentId.includes('power')) {
            return 'images/talents/damage.png';
        } else if (talentId.includes('heal')) {
            return 'images/talents/healing.png';
        } else if (talentId.includes('shield') || talentId.includes('armor')) {
            return 'images/talents/shield.png';
        } else if (talentId.includes('crit')) {
            return 'images/talents/critical.png';
        } else if (talentId.includes('mana')) {
            return 'images/talents/mana.png';
        } else if (talentId.includes('speed')) {
            return 'images/talents/speed.png';
        }
        
        // Default icon
        return 'images/talents/default.png';
    }
}

// Create and export the singleton instance
window.talentsPanelManager = new TalentsPanelManager();

// Start initialization after a short delay to ensure other systems are loaded
// Use DOMContentLoaded for more reliability than a fixed timeout
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { // Keep a small delay just in case gameManager init is also async
        if (window.talentsPanelManager) {
            window.talentsPanelManager.initialize();
        }
    }, 500); // Reduced delay, as we mainly wait for DOM + gameManager
}); 