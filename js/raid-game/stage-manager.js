// Stage manager for Roguelike Raid Game
class StageManager {
    constructor() {
        this.currentStage = null;
        this.availableStages = [];
        this.stageHistory = [];
        this.onStageLoaded = null;
        this.customPlayerCharacters = null; // Add this property to store custom characters
        this.stageModificationMessages = []; // Initialize array for stage modification messages
        this.gameState = {
            turn: 1,
            phase: 'player', // 'player' or 'ai'
            playerCharacters: [],
            aiCharacters: [],
            selectedCharacter: null,
            selectedAbility: null,
            battleLog: []
        };
        this.stageRegistry = {}; // Cache for loaded stage data
        this.allStoriesData = null; // Cache for stories.json
        this.stageModifiers = []; // Store active stage modifiers
    }

    // Helper to normalize strings into IDs (lowercase, underscores)
    normalizeId(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    // Initialize stage manager
    async initialize() {
        try {
            this.currentStage = null;
            this.gameState = {};
            this.stageHistory = [];
            this.stageModifiers = []; // Reset modifiers
            
            // Load the stage registry
            await this.loadStageRegistry();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize stage manager:', error);
            return false;
        }
    }

    // Load the stage registry
    async loadStageRegistry() {
        try {
            const response = await fetch('js/raid-game/stage-registry.json');
            if (!response.ok) {
                throw new Error('Failed to load stage registry');
            }
            const data = await response.json();
            this.availableStages = data.stages || [];
            console.log(`Loaded ${this.availableStages.length} stages from registry`);
            return this.availableStages;
        } catch (error) {
            console.error('Error loading stage registry:', error);
            this.availableStages = [];
            throw error;
        }
    }

    // Load a specific stage
    /**
     * @param {string} stageId - The ID of the stage to load
     * @param {Object} teamState - Optional object mapping charId to { currentHP, currentMana }
     */
    async loadStage(stageId, teamState = null, storyContext = null) {
        console.log(`Loading stage: ${stageId}`);
        console.log('Received team state for loading:', teamState);
        console.log('Story context:', storyContext);

        try {
            let stageData = null;
            
            // Check if this is a story stage
            if (storyContext && storyContext.storyId && storyContext.stageIndex !== undefined) {
                console.log(`Loading story stage from stories.json: ${storyContext.storyId}[${storyContext.stageIndex}]`);
                stageData = await this.loadStoryStage(storyContext.storyId, storyContext.stageIndex);
            } else {
                // Check if this is a single stage from localStorage first (for random battles)
                const storedStage = localStorage.getItem('selectedStage');
                if (storedStage) {
                    try {
                        const parsedStage = JSON.parse(storedStage);
                        if (parsedStage.id === stageId) {
                            console.log(`Loading single stage from localStorage: ${stageId}`);
                            stageData = parsedStage;
                            
                            // Handle random battle type stages
                            if (stageData.type === 'random_battle' && stageData.enemyPool && stageData.enemyCount) {
                                console.log(`Generating random enemies for ${stageId}`);
                                stageData.enemies = this.generateRandomEnemies(stageData.enemyPool, stageData.enemyCount);
                                console.log(`Generated enemies: ${stageData.enemies.map(e => e.characterId).join(', ')}`);
                            }
                            
                            // If the localStorage stage data doesn't have enemies, it's probably just registry metadata
                            // We need to load the full stage data from the stage file
                            if (!stageData.enemies || !Array.isArray(stageData.enemies) || stageData.enemies.length === 0) {
                                console.log(`[StageManager] localStorage stage data is incomplete (no enemies), loading from stage file instead`);
                                stageData = null; // Reset so it loads from registry/file below
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing stored stage data:', error);
                    }
                }
                
                // If not found in localStorage, load from registry (traditional stage loading)
                if (!stageData) {
                    console.log(`Loading stage from registry: ${stageId}`);
                    
                    // Make sure the registry is loaded first
                    if (!this.availableStages || this.availableStages.length === 0) {
                        console.log("Stage registry not loaded yet, loading now...");
                        await this.loadStageRegistry();
                    }
                    
                    // Find the stage in the registry
                    const stageInfo = this.availableStages.find(stage => stage.id === stageId);
                    if (!stageInfo) {
                        console.error(`Stage ${stageId} not found in registry. Available stages: ${this.availableStages.map(s => s.id).join(', ')}`);
                        throw new Error(`Stage ${stageId} not found in registry`);
                    }
                    
                    // Load the stage data using the path from the registry
                    const response = await fetch(stageInfo.path);
                    if (!response.ok) {
                        console.error(`Failed to fetch stage file from path ${stageInfo.path} for ${stageId}. Status: ${response.status}`);
                        throw new Error(`Failed to load stage data for ${stageId} from path ${stageInfo.path}`);
                    }
                    
                    stageData = await response.json();
                    
                    // Merge registry data with stage file data (registry takes priority)
                    if (stageInfo.enemies) {
                        console.log(`[StageManager] Using enemies from registry instead of stage file`);
                        stageData.enemies = stageInfo.enemies;
                    }
                    if (stageInfo.modifiers) {
                        console.log(`[StageManager] Using modifiers from registry instead of stage file`);
                        stageData.modifiers = stageInfo.modifiers;
                    }
                    if (stageInfo.objectives) {
                        console.log(`[StageManager] Using objectives from registry instead of stage file`);
                        stageData.objectives = stageInfo.objectives;
                    }
                    if (stageInfo.rewards) {
                        console.log(`[StageManager] Using rewards from registry instead of stage file`);
                        stageData.rewards = stageInfo.rewards;
                    }
                    if (stageInfo.difficulty !== undefined) {
                        console.log(`[StageManager] Using difficulty from registry: ${stageInfo.difficulty}`);
                        stageData.difficulty = stageInfo.difficulty;
                    }
                }
            }
            
            this.currentStage = stageData;
            this.currentStage.id = stageId; // Ensure the ID is stored on the loaded data
            
            // Initialize the game state for this stage
            this.resetGameState();

            // Load stage modifiers if present
            this.loadStageModifiers();
            
            // Load AI characters
            await this.loadAICharacters(stageData.enemies);
            
            // Load player characters using the provided state
            await this.loadPlayerCharacters(teamState); // Pass the state directly
            
            // --- NEW: Initialize Passives After Loading --- 
            console.log("[StageManager] Initializing passives after stage load...");
            const allCharacters = [...this.gameState.playerCharacters, ...this.gameState.aiCharacters];
            allCharacters.forEach(character => {
                if (character.passiveHandler && typeof character.passiveHandler.initialize === 'function') {
                     console.log(`[StageManager] Calling initialize() for ${character.name}'s passive: ${character.passiveHandler.name || character.passive.id}`);
                     try {
                         character.passiveHandler.initialize(character); 
                     } catch (err) {
                          console.error(`[StageManager] Error initializing passive for ${character.name}:`, err);
                     }
                } else if (character.passive && character.passive.id === 'scarecrow_evasive_stance' && typeof character.passiveHandler?.updateDodgeBuff === 'function') {
                    // Special check for Scarecrow passive if initialize wasn't found but handler exists
                    console.log(`[StageManager] Directly calling updateDodgeBuff() for ${character.name}`);
                    try {
                         character.passiveHandler.updateDodgeBuff();
                    } catch (err) {
                         console.error(`[StageManager] Error calling updateDodgeBuff for ${character.name}:`, err);
                    }
                }
            });
            console.log("[StageManager] Passive initialization complete.");
            // --- END NEW ---

            // Process stage modifiers for stage start AFTER all stat calculations are complete
            if (window.stageModifiersRegistry && this.stageModifiers.length > 0) {
                console.log(`[StageManager] Processing ${this.stageModifiers.length} stage modifiers for stage start (after all stat calculations)`);
                window.stageModifiersRegistry.processModifiers(window.gameManager, this, 'stageStart');
            }

            // Add to stage history
            this.stageHistory.push(stageId);
            
            // Call onStageLoaded callback if defined
            if (this.onStageLoaded) {
                this.onStageLoaded(this.currentStage, this.gameState);
            }
            
            return this.gameState;
            
        } catch (error) {
            console.error(`Error loading stage ${stageId}:`, error);
            // Log available stages for debugging
            console.error(`Available stages in registry: ${JSON.stringify(this.availableStages.map(s => s.id))}`);
            // Re-throw the error for the caller to handle
            throw error;
        }
    }
    
    // Load stage modifiers from the stage data
    loadStageModifiers() {
        this.stageModifiers = [];
        
        // Load from either 'modifiers' or 'stageEffects' (supporting both formats)
        const effects = this.currentStage?.modifiers || this.currentStage?.stageEffects || [];
        
        if (Array.isArray(effects) && effects.length > 0) {
            this.stageModifiers = [...effects];
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            // Log active modifiers
            log(`Stage modifiers active: ${this.stageModifiers.map(mod => mod.name).join(', ')}`, 'stage-info');
            
            // Log detailed descriptions
            this.stageModifiers.forEach(modifier => {
                log(`${modifier.name}: ${modifier.description}`, 'stage-info');
            });
            
            console.log(`Loaded ${this.stageModifiers.length} stage modifiers from ${this.currentStage?.modifiers ? 'modifiers' : 'stageEffects'} property`);
        } else {
            console.log('No stage modifiers found');
        }
    }
    
    // Apply stage modifiers to the current game state
    // NOTE: This method is deprecated in favor of the centralized StageModifiersRegistry system
    // Legacy method kept for backwards compatibility
    applyStageModifiers() {
        console.log('[StageManager] applyStageModifiers() is deprecated. Using centralized StageModifiersRegistry instead.');
    }
    
    // Create rain VFX for the stage
    createRainVFX() {
        // Check if the rain container already exists
        if (document.getElementById('rain-container')) {
            return; // Rain VFX already created
        }
        
        // Create the rain container
        const rainContainer = document.createElement('div');
        rainContainer.id = 'rain-container';
        rainContainer.className = 'rain-container';
        
        // Create raindrops
        const dropCount = 150; // Number of raindrops
        for (let i = 0; i < dropCount; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            
            // Randomize positions and animation delays
            const left = Math.random() * 100; // Random horizontal position
            const animationDelay = Math.random() * 2; // Random delay up to 2s
            const duration = 0.7 + Math.random() * 0.5; // Duration between 0.7-1.2s
            
            raindrop.style.left = `${left}%`;
            raindrop.style.animationDelay = `${animationDelay}s`;
            raindrop.style.animationDuration = `${duration}s`;
            
            rainContainer.appendChild(raindrop);
        }
        
        // Add to the stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(rainContainer);
        } else {
            document.querySelector('.battle-container').appendChild(rainContainer);
        }
    }
    
    // Create enhanced healing wind VFX for the stage
    createHealingWindVFX() {
        // Check if healing wind VFX already exists
        if (document.getElementById('healing-wind-vfx')) {
            return; // Healing wind VFX already created
        }
        
        // Initialize the enhanced healing wind VFX system
        if (typeof HealingWindVFX !== 'undefined') {
            if (!this.healingWindVFX) {
                this.healingWindVFX = new HealingWindVFX();
                this.healingWindVFX.initialize();
            }
            this.healingWindVFX.start();
            console.log('[StageManager] Enhanced healing wind VFX started');
        } else {
            console.warn('[StageManager] HealingWindVFX class not found, falling back to basic wind VFX');
            this.createWindVFX();
        }
    }

    // Create wind VFX for the stage (fallback method)
    createWindVFX() {
        // Check if the wind container already exists
        if (document.getElementById('wind-container')) {
            return; // Wind VFX already created
        }
        
        // Create the wind container
        const windContainer = document.createElement('div');
        windContainer.id = 'wind-container';
        windContainer.className = 'wind-container';
        
        // Create wind particles/leaves
        const particleCount = 80; // Number of wind particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'wind-particle';
            
            // Randomize positions and animation delays
            const startLeft = -10 + Math.random() * 20; // Start from left side
            const endLeft = 90 + Math.random() * 20; // End at right side
            const top = Math.random() * 100; // Random vertical position
            const animationDelay = Math.random() * 4; // Random delay up to 4s
            const duration = 8 + Math.random() * 4; // Duration between 8-12s
            const size = 0.3 + Math.random() * 0.4; // Size variation
            
            particle.style.left = `${startLeft}%`;
            particle.style.top = `${top}%`;
            particle.style.animationDelay = `${animationDelay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.transform = `scale(${size})`;
            
            // Set CSS custom properties for animation end position
            particle.style.setProperty('--end-left', `${endLeft}%`);
            
            windContainer.appendChild(particle);
        }
        
        // Add to the stage background
        const stageBackground = document.getElementById('stage-background');
        if (stageBackground) {
            stageBackground.appendChild(windContainer);
        } else {
            document.querySelector('.battle-container').appendChild(windContainer);
        }
    }

    // Create heavy rain with fire VFX for "It's raining man!" stage modifier
    createHeavyRainWithFireVFX() {
        // Remove any existing VFX containers
        const existingRain = document.querySelector('.heavy-rain-vfx-container');
        const existingFire = document.querySelector('.fire-background-vfx-container');
        if (existingRain) existingRain.remove();
        if (existingFire) existingFire.remove();

        // Create heavy rain VFX container
        const rainContainer = document.createElement('div');
        rainContainer.className = 'heavy-rain-vfx-container';
        rainContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            overflow: hidden;
        `;

        // Create fire background container
        const fireContainer = document.createElement('div');
        fireContainer.className = 'fire-background-vfx-container';
        fireContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            background: linear-gradient(180deg, rgba(255,69,0,0.3) 0%, rgba(255,140,0,0.2) 30%, rgba(255,215,0,0.1) 60%, transparent 100%);
        `;

        // Add heavy rain droplets
        for (let i = 0; i < 150; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'heavy-rain-drop';
            raindrop.style.cssText = `
                position: absolute;
                width: 2px;
                height: ${8 + Math.random() * 15}px;
                background: linear-gradient(to bottom, rgba(135,206,250,0.9), rgba(135,206,250,0.3));
                left: ${Math.random() * 110}%;
                top: -20px;
                animation: heavyRainFall ${0.3 + Math.random() * 0.5}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
                transform: rotate(${10 + Math.random() * 10}deg);
            `;
            rainContainer.appendChild(raindrop);
        }

        // Add fire embers
        for (let i = 0; i < 40; i++) {
            const ember = document.createElement('div');
            ember.className = 'fire-ember';
            ember.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 5}px;
                height: ${3 + Math.random() * 5}px;
                background: radial-gradient(circle, rgba(255,69,0,0.9), rgba(255,140,0,0.4));
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                bottom: 0;
                animation: fireEmberRise ${3 + Math.random() * 4}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
                box-shadow: 0 0 10px rgba(255,69,0,0.6);
            `;
            fireContainer.appendChild(ember);
        }

        // Lightning flashes
        const lightning = document.createElement('div');
        lightning.className = 'lightning-flash';
        lightning.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.4);
            opacity: 0;
            animation: lightningFlash 8s infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        rainContainer.appendChild(lightning);

        // Append to battlefield
        const battlefield = document.querySelector('#game-container') || document.body;
        battlefield.appendChild(fireContainer);
        battlefield.appendChild(rainContainer);

        // Add CSS animations if not already present
        if (!document.querySelector('#heavy-rain-fire-animation-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'heavy-rain-fire-animation-styles';
            styleSheet.textContent = `
                @keyframes heavyRainFall {
                    0% {
                        transform: translateY(-20px) rotate(15deg);
                        opacity: 0;
                    }
                    5% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(calc(100vh + 50px)) rotate(15deg);
                        opacity: 0.3;
                    }
                }

                @keyframes fireEmberRise {
                    0% {
                        transform: translateY(0) scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-200px) scale(0.3);
                        opacity: 0;
                    }
                }

                @keyframes lightningFlash {
                    0%, 90%, 92%, 100% {
                        opacity: 0;
                    }
                    91% {
                        opacity: 0.8;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        // Thunder sounds removed - keeping only rain healing sounds

        console.log('[StageManager] Heavy rain with fire VFX created for "It\'s raining man!" modifier');
    }


    
    // Reset the game state
    resetGameState() {
        this.gameState = {
            turn: 1,
            phase: 'player',
            playerCharacters: [],
            aiCharacters: [],
            selectedCharacter: null,
            selectedAbility: null,
            battleLog: []
        };
        // Clear stage modification messages for new stage
        this.stageModificationMessages = [];
    }
    
    // Load AI characters for the stage
    async loadAICharacters(enemyList) {
        if (!enemyList || !Array.isArray(enemyList)) {
            console.error('[StageManager] Invalid enemy list for stage');
            return;
        }
        
        this.gameState.aiCharacters = [];
        let instanceCounter = 0; // Counter for unique IDs
        
        console.log(`[StageManager] Starting AI character loading. Count: ${enemyList.length}`); // <<< Log start
        for (const enemyInfo of enemyList) {
            console.log(`[StageManager] Processing enemy: ${enemyInfo.characterId}`); // <<< Log each enemy
            try {
                // Load character data
                const charData = await CharacterFactory.loadCharacterData(enemyInfo.characterId);
                
                // <<< Log loaded charData >>>
                console.log(`[StageManager] Loaded charData for ${enemyInfo.characterId}:`, charData ? 'Data OK' : 'Load FAILED', charData);

                if (!charData) {
                    console.error(`[StageManager] Failed to load AI character data: ${enemyInfo.characterId}`);
                    continue; // Skip this character if data failed to load
                }
                
                // <<< Log before calling createCharacter >>>
                console.log(`[StageManager] Calling CharacterFactory.createCharacter for ${enemyInfo.characterId}`);
                const character = await CharacterFactory.createCharacter(charData);
                
                // <<< Log after calling createCharacter >>>
                if (!character) {
                    console.error(`[StageManager] CharacterFactory.createCharacter returned null/falsy for ${enemyInfo.characterId}`);
                    continue; // Skip if creation failed
                }
                console.log(`[StageManager] CharacterFactory.createCharacter call completed for ${enemyInfo.characterId}. Resulting passiveHandler: ${character.passiveHandler ? character.passiveHandler.constructor.name : 'NULL'}`);

                // Apply any stage-specific modifications AFTER character creation
                if (enemyInfo.modifications) {
                    console.log(`[StageManager] Applying modifications to ${enemyInfo.characterId} AFTER character creation`);
                    this.applyCharacterModificationsToCharacter(character, enemyInfo.modifications);
                }

                // IMPORTANT FIX: Apply current HP/Mana based on modified stats
                // CharacterFactory.createCharacter() sets currentHp to maxHp, but if maxHp was modified, we need to ensure currentHp reflects that
                character.stats.currentHp = character.stats.maxHp;
                character.stats.currentMana = character.stats.maxMana;
                console.log(`[StageManager] Set ${character.name} HP to ${character.stats.currentHp}/${character.stats.maxHp} and Mana to ${character.stats.currentMana}/${character.stats.maxMana}`);

                character.isAI = true;
                character.instanceId = `${character.id}-${instanceCounter++}`;
                console.log(`[StageManager] Assigned instance ID: ${character.instanceId} to ${character.name}`);
                
                this.gameState.aiCharacters.push(character);
                
            } catch (error) {
                // <<< Log errors during the loop >>>
                console.error(`[StageManager] Error loading AI character ${enemyInfo.characterId} inside loop:`, error);
            }
        }
        
        console.log(`[StageManager] Loaded ${this.gameState.aiCharacters.length} AI characters for stage`);
    }
    
    // Load player characters
    async loadPlayerCharacters(teamState) {
        let characterIds = [];
        let useDefaultState = false;

        // Load character registry to check locked status
        let characterRegistry = [];
        try {
            const registryResponse = await fetch('js/raid-game/character-registry.json');
            if (!registryResponse.ok) {
                throw new Error('Failed to load character registry');
            }
            const registryData = await registryResponse.json();
            characterRegistry = registryData.characters || [];
            console.log(`[StageManager] Loaded ${characterRegistry.length} characters from registry`);
        } catch (registryError) {
            console.error("[StageManager] Error loading character registry:", registryError);
            characterRegistry = []; // Empty if failed
        }

        // If teamState is null or empty, load default or last selected team from Firebase
        if (!teamState || Object.keys(teamState).length === 0) {
            console.warn("No team state provided to loadPlayerCharacters. Attempting to load default/saved team.");
            const userId = getCurrentUserId();
            if (userId) {
                 const teamSelectionSnapshot = await firebaseDatabase.ref(`users/${userId}/currentTeamSelection`).once('value');
                 const currentTeamSelection = teamSelectionSnapshot.exists() ? teamSelectionSnapshot.val() : [];
                 if (Array.isArray(currentTeamSelection) && currentTeamSelection.length > 0) {
                     console.log("Using team selection from Firebase:", currentTeamSelection);
                     
                     // Filter out locked characters
                     characterIds = currentTeamSelection.filter(id => {
                         const charInRegistry = characterRegistry.find(c => c.id === id);
                         console.log(`[StageManager] Checking character ${id}: found in registry = ${!!charInRegistry}, locked = ${charInRegistry ? charInRegistry.locked : 'N/A'}`);
                         if (!charInRegistry) {
                             console.warn(`[StageManager] Character ${id} not found in registry`);
                             return false;
                         }
                         
                         // If character is locked, filter it out
                         // TEMPORARILY DISABLED FOR TESTING
                         // if (charInRegistry.locked) {
                         //     console.log(`[StageManager] Filtering out locked character: ${id}`);
                         //     return false;
                         // }
                         console.log(`[StageManager] Character ${id} is unlocked and will be loaded`);
                         return true;
                     });
                     
                     // If all characters were locked, use farmer_raiden as fallback
                     if (characterIds.length === 0) {
                         console.log("[StageManager] All saved characters are locked. Using farmer_raiden as fallback.");
                         characterIds = ['farmer_raiden'];
                     } else {
                         console.log(`[StageManager] Successfully filtered team selection. Final character IDs to load: ${characterIds.join(', ')}`);
                     }
                     
                     useDefaultState = true; // Indicate we need to init with full HP/Mana
                 } else {
                      console.log("No saved team selection found. Falling back to hardcoded default team.");
                      characterIds = ['farmer_raiden']; // Changed from schoolboy_shoma to farmer_raiden
                      useDefaultState = true;
                 }
            } else {
                 console.error("Cannot load default team: User not logged in.");
                 // Fallback to hardcoded default team if not logged in for testing?
                 characterIds = ['farmer_raiden']; // Changed from schoolboy_shoma to farmer_raiden
                 useDefaultState = true;
            }
        } else {
             // Use the provided teamState but filter locked characters
             const teamStateIds = Object.keys(teamState);
             characterIds = teamStateIds.filter(id => {
                 const charInRegistry = characterRegistry.find(c => c.id === id);
                 if (!charInRegistry) return false;
                 
                 // If character is locked, filter it out
                 if (charInRegistry.locked) {
                     console.log(`[StageManager] Filtering out locked character from teamState: ${id}`);
                     return false;
                 }
                 return true;
             });
             
             // If all characters were locked, use farmer_raiden as fallback
             if (characterIds.length === 0) {
                 console.log("[StageManager] All characters in teamState are locked. Using farmer_raiden as fallback.");
                 characterIds = ['farmer_raiden'];
                 useDefaultState = true;
             } else {
                 useDefaultState = false;
             }
        }

        this.gameState.playerCharacters = [];
        let playerInstanceCounter = 0; // Counter for unique player instance IDs

        // --- NEW: Fetch all selected talents for the team first ---
        let allSelectedTalents = {};
        const userId = getCurrentUserId();
        if (userId) {
            try {
                const talentsRef = firebaseDatabase.ref(`users/${userId}/characterTalents`);
                const snapshot = await talentsRef.once('value');
                allSelectedTalents = snapshot.val() || {};
                console.log("[StageManager] Fetched selected talents for user:", JSON.stringify(allSelectedTalents)); // Log fetched data
            } catch (error) {
                console.error("[StageManager] Error fetching selected talents from Firebase:", error);
            }
        }
        // --- END NEW ---

        for (const charId of characterIds) {
            try {
                // Get saved state only if we are NOT using default state
                const savedState = useDefaultState ? null : teamState[charId];

                const charData = await CharacterFactory.loadCharacterData(charId);

                if (!charData) {
                    console.error(`Failed to load player character: ${charId}`);
                    continue;
                }

                // --- MODIFIED: Pass selected talents to createCharacter ---
                const characterTalentData = allSelectedTalents[charId] || {}; // Get data for this specific character
                const selectedTalentIds = Object.keys(characterTalentData);
                console.log(`[StageManager] Raw talent data for ${charId}:`, characterTalentData);
                console.log(`[StageManager] Passing ${selectedTalentIds.length} selected talents for ${charId} to CharacterFactory:`, selectedTalentIds);
                const character = await CharacterFactory.createCharacter(charData, selectedTalentIds);
                // --- END MODIFICATION ---

                if (!character) {
                     console.error(`[StageManager] CharacterFactory returned null/falsy for player ${charId}. Skipping.`);
                     continue;
                }

                // --- NEW: Assign unique instanceId to player character --- 
                character.instanceId = `${character.id}-player-${playerInstanceCounter++}`;
                character.isAI = false; // Explicitly mark as not AI
                console.log(`Assigned player instance ID: ${character.instanceId} to ${character.name}`);
                // --- END NEW ---

                // Merge saved stats into character
                // Check if character.stats exists before proceeding
                if (!character.stats) {
                    console.error(`[StageManager] Character ${character.name} has null stats! This indicates a character creation failure.`);
                    throw new Error(`Character ${character.name} has invalid stats object`);
                }
                
                // Only merge saved stats if we have a saved state with stats
                if (savedState && savedState.stats) {
                    Object.keys(savedState.stats).forEach(statKey => {
                        if (character.stats[statKey] !== undefined) {
                            character.stats[statKey] = savedState.stats[statKey];
                            // --- NEW: Also update baseStats to preserve enhanced stats through recalculateStats ---
                            if (character.baseStats && character.baseStats[statKey] !== undefined) {
                                character.baseStats[statKey] = savedState.stats[statKey];
                                console.log(`[StageManager] Updated baseStats.${statKey} to ${savedState.stats[statKey]} for ${character.name}`);
                            }
                            // --- END NEW ---
                        }
                    });
                    console.log(`Merged saved STATS into ${character.name}:`, character.stats);
                } else {
                    console.log(`No saved stats to merge for ${character.name}, using default stats`);
                }

                // Apply saved HP/Mana from teamState if available and valid
                if (savedState && savedState.currentHP !== undefined && savedState.currentMana !== undefined) {
                    character.stats.currentHp = Math.max(0, Math.min(savedState.currentHP, character.stats.maxHp));
                    character.stats.currentMana = Math.max(0, Math.min(savedState.currentMana, character.stats.maxMana));
                    console.log(`Applied provided state to ${character.name}: HP=${character.stats.currentHp}, Mana=${character.stats.currentMana}`);
                } else {
                    // Default to full HP/Mana if state wasn't fully provided
                    character.stats.currentHp = character.stats.maxHp;
                    character.stats.currentMana = character.stats.maxMana;
                     console.log(`Initialized ${character.name} with full HP/Mana as no valid state was provided.`);
                }

                // Apply talents if TalentManager is available and talents are selected
                if (window.talentManager && typeof window.talentManager.applyTalentsToCharacter === 'function') {
                    const selectedTalents = await window.talentManager.getSelectedTalents(charId, userId);
                    // Check if selectedTalents is not null and has keys
                    if (selectedTalents && Object.keys(selectedTalents).length > 0) {
                        console.log(`[StageManager] Applying selected talents for ${character.name}:`, selectedTalents);
                        await window.talentManager.applyTalentsToCharacter(character, selectedTalents);
                    } else {
                        console.log(`[StageManager] No talents selected or found for ${character.name}`);
                    }
                } else {
                    console.warn('[StageManager] TalentManager or applyTalentsToCharacter method not available. Skipping talent application for', character.name);
                }

                // Add to player characters
                this.gameState.playerCharacters.push(character);

            } catch (error) {
                console.error(`Error loading player character ${charId}:`, error);
            }
        }

        console.log(`Loaded ${this.gameState.playerCharacters.length} player characters`);
    }
    
    // Apply modifications to a character object (after character creation)
    applyCharacterModificationsToCharacter(character, modifications) {
        if (!modifications) return;
        
        console.log(`[StageManager] Applying modifications to character ${character.name}:`, modifications);
        console.log(`[StageManager] Character stats before modifications:`, {
            maxHp: character.stats.maxHp,
            currentHp: character.stats.currentHp,
            speed: character.stats.speed,
            abilities: character.abilities ? character.abilities.map(a => ({ 
                name: a.name, 
                damage: a.damage, 
                fixedDamage: a.fixedDamage,
                amount: a.amount,
                minDamage: a.minDamage, 
                maxDamage: a.maxDamage,
                type: a.type
            })) : []
        });
        
        // Initialize stage modifications object if it doesn't exist
        if (!character.stageModifications) {
            character.stageModifications = {};
        }
        
        // Apply HP multiplier
        if (modifications.hpMultiplier) {
            const originalMaxHp = character.stats.maxHp;
            const newMaxHp = Math.floor(originalMaxHp * modifications.hpMultiplier);
            character.stats.maxHp = newMaxHp;
            character.stats.currentHp = newMaxHp; // Set current HP to new max
            // Update baseStats so recalculation preserves the modification
            character.baseStats.maxHp = newMaxHp;
            // Store the modification for future reference
            character.stageModifications.hpMultiplier = modifications.hpMultiplier;
            
            console.log(`[StageManager] Applied HP multiplier ${modifications.hpMultiplier}x: ${originalMaxHp} -> ${newMaxHp}`);
            
            // Display modification message
            const message = `💪 ${character.name} is empowered with ${modifications.hpMultiplier}x HP!`;
            this.stageModificationMessages.push(message);
        }
        
        // Apply damage multiplier to abilities
        if (modifications.damageMultiplier && character.abilities) {
            character.abilities.forEach(ability => {
                if (ability.damage) {
                    const originalDamage = ability.damage;
                    ability.damage = Math.floor(ability.damage * modifications.damageMultiplier);
                    console.log(`[StageManager] Applied damage multiplier to ${ability.name}: ${originalDamage} -> ${ability.damage}`);
                }
                if (ability.fixedDamage) {
                    const originalFixedDamage = ability.fixedDamage;
                    ability.fixedDamage = Math.floor(ability.fixedDamage * modifications.damageMultiplier);
                    console.log(`[StageManager] Applied damage multiplier to ${ability.name} fixed damage: ${originalFixedDamage} -> ${ability.fixedDamage}`);
                }
                if (ability.amount && ability.type === 'damage') {
                    const originalAmount = ability.amount;
                    ability.amount = Math.floor(ability.amount * modifications.damageMultiplier);
                    console.log(`[StageManager] Applied damage multiplier to ${ability.name} amount: ${originalAmount} -> ${ability.amount}`);
                }
                if (ability.minDamage) {
                    const originalMinDamage = ability.minDamage;
                    ability.minDamage = Math.floor(ability.minDamage * modifications.damageMultiplier);
                    console.log(`[StageManager] Applied damage multiplier to ${ability.name} min damage: ${originalMinDamage} -> ${ability.minDamage}`);
                }
                if (ability.maxDamage) {
                    const originalMaxDamage = ability.maxDamage;
                    ability.maxDamage = Math.floor(ability.maxDamage * modifications.damageMultiplier);
                    console.log(`[StageManager] Applied damage multiplier to ${ability.name} max damage: ${originalMaxDamage} -> ${ability.maxDamage}`);
                }
            });
            
            // Store the modification for future reference
            character.stageModifications.damageMultiplier = modifications.damageMultiplier;
            
            // Display modification message
            const message = `⚔️ ${character.name}'s attacks are amplified with ${modifications.damageMultiplier}x damage power!`;
            this.stageModificationMessages.push(message);
        }
        
        // Apply speed multiplier
        if (modifications.speedMultiplier) {
            const originalSpeed = character.stats.speed;
            character.stats.speed = Math.floor(character.stats.speed * modifications.speedMultiplier);
            // Update baseStats so recalculation preserves the modification
            character.baseStats.speed = character.stats.speed;
            // Store the modification for future reference
            character.stageModifications.speedMultiplier = modifications.speedMultiplier;
            
            console.log(`[StageManager] Applied speed multiplier ${modifications.speedMultiplier}x: ${originalSpeed} -> ${character.stats.speed}`);
            
            // Display modification message
            const message = `⚡ ${character.name} moves with ${modifications.speedMultiplier}x speed!`;
            this.stageModificationMessages.push(message);
        }
        
        console.log(`[StageManager] Character stats after modifications:`, {
            maxHp: character.stats.maxHp,
            currentHp: character.stats.currentHp,
            speed: character.stats.speed,
            stageModifications: character.stageModifications,
            baseStats: character.baseStats
        });
    }

    // Apply modifications to character data (before character creation) - kept for backward compatibility
    applyCharacterModifications(charData, modifications) {
        if (!modifications) return;
        
        console.log(`[StageManager] Applying modifications to charData ${charData.name}:`, modifications);
        
        // Handle stage editor multiplier format (hpMultiplier, damageMultiplier, speedMultiplier)
        if (modifications.hpMultiplier && modifications.hpMultiplier !== 1) {
            const originalHp = charData.stats.maxHp;
            charData.stats.maxHp = Math.floor(originalHp * modifications.hpMultiplier);
            console.log(`[StageManager] Applied HP multiplier ${modifications.hpMultiplier}: ${originalHp} -> ${charData.stats.maxHp}`);
        }
        
        if (modifications.damageMultiplier && modifications.damageMultiplier !== 1) {
            const originalDamage = charData.stats.physicalDamage;
            charData.stats.physicalDamage = Math.floor(originalDamage * modifications.damageMultiplier);
            console.log(`[StageManager] Applied damage multiplier ${modifications.damageMultiplier}: ${originalDamage} -> ${charData.stats.physicalDamage}`);
            
            // Also apply to magical damage if it exists
            if (charData.stats.magicalDamage) {
                const originalMagicalDamage = charData.stats.magicalDamage;
                charData.stats.magicalDamage = Math.floor(originalMagicalDamage * modifications.damageMultiplier);
                console.log(`[StageManager] Applied magical damage multiplier ${modifications.damageMultiplier}: ${originalMagicalDamage} -> ${charData.stats.magicalDamage}`);
            }
        }
        
        if (modifications.speedMultiplier && modifications.speedMultiplier !== 1) {
            const originalSpeed = charData.stats.speed;
            charData.stats.speed = Math.floor(originalSpeed * modifications.speedMultiplier);
            console.log(`[StageManager] Applied speed multiplier ${modifications.speedMultiplier}: ${originalSpeed} -> ${charData.stats.speed}`);
        }
        
        // Apply stat modifications (original format)
        if (modifications.stats) {
            Object.keys(modifications.stats).forEach(statKey => {
                if (charData.stats[statKey] !== undefined) {
                    const modification = modifications.stats[statKey];
                    
                    // Handle object-style modifications with operations
                    if (typeof modification === 'object' && modification.operation) {
                        const currentValue = charData.stats[statKey];
                        const operationValue = modification.value;
                        
                        switch (modification.operation) {
                            case 'multiply':
                                charData.stats[statKey] = Math.floor(currentValue * operationValue);
                                console.log(`Applied ${modification.operation} to ${statKey}: ${currentValue} * ${operationValue} = ${charData.stats[statKey]}`);
                                break;
                            case 'add':
                                charData.stats[statKey] = currentValue + operationValue;
                                console.log(`Applied ${modification.operation} to ${statKey}: ${currentValue} + ${operationValue} = ${charData.stats[statKey]}`);
                                break;
                            case 'set':
                                charData.stats[statKey] = operationValue;
                                console.log(`Applied ${modification.operation} to ${statKey}: set to ${operationValue}`);
                                break;
                            default:
                                console.warn(`Unknown modification operation: ${modification.operation}`);
                                charData.stats[statKey] = operationValue;
                        }
                    } else {
                        // Handle direct value assignment (backwards compatibility)
                        charData.stats[statKey] = modification;
                    }
                }
            });
        }
        
        // Apply ability modifications
        if (modifications.abilities && charData.abilities) {
            modifications.abilities.forEach(abilityMod => {
                const ability = charData.abilities.find(a => a.id === abilityMod.id);
                if (ability) {
                    Object.keys(abilityMod).forEach(key => {
                        if (key !== 'id') {
                            ability[key] = abilityMod[key];
                        }
                    });
                }
            });
        }
    }
    
    // Get the current stage difficulty
    getStageDifficulty() {
        if (!this.currentStage) return 1;
        return this.currentStage.difficulty || 1;
    }
    
    // Check if the game is over
    isGameOver() {
        return this.gameState.playerCharacters.length === 0 || this.gameState.aiCharacters.length === 0;
    }
    
    // Get the game result (win/loss)
    getGameResult() {
        if (!this.isGameOver()) return null;
        
        return {
            victory: this.gameState.aiCharacters.length === 0,
            playerTeamSurvived: this.gameState.playerCharacters.length > 0,
            turns: this.gameState.turn
        };
    }
    
    // Generate random enemies for random battle stages
    generateRandomEnemies(enemyPool, enemyCount) {
        if (!enemyPool || !Array.isArray(enemyPool) || enemyPool.length === 0) {
            console.error('Invalid enemy pool for random battle');
            return [];
        }
        
        const enemies = [];
        const availableEnemies = [...enemyPool]; // Create a copy to avoid modifying original
        
        for (let i = 0; i < enemyCount; i++) {
            if (availableEnemies.length === 0) {
                console.warn('Not enough unique enemies in pool, reusing enemies');
                availableEnemies.push(...enemyPool); // Refill the pool
            }
            
            // Pick a random enemy from available pool
            const randomIndex = Math.floor(Math.random() * availableEnemies.length);
            const selectedEnemy = availableEnemies.splice(randomIndex, 1)[0]; // Remove to avoid duplicates
            
            enemies.push({
                characterId: selectedEnemy
            });
        }
        
        console.log(`Generated ${enemies.length} random enemies: ${enemies.map(e => e.characterId).join(', ')}`);
        return enemies;
    }
    
    // Get a random enemy for AI targeting
    getRandomEnemy(excludeIds = []) {
        const validTargets = this.gameState.playerCharacters.filter(
            char => !char.isDead() && !excludeIds.includes(char.id)
        );
        
        if (validTargets.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * validTargets.length);
        return validTargets[randomIndex];
    }
    
    // Get a random ally for AI targeting
    getRandomAlly(excludeIds = []) {
        const validTargets = this.gameState.aiCharacters.filter(
            char => !char.isDead() && !excludeIds.includes(char.id)
        );
        
        if (validTargets.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * validTargets.length);
        return validTargets[randomIndex];
    }

    // Load story stage data directly from stories.json
    async loadStoryStage(storyId, stageIndex) {
        // Load stories.json if not already loaded
        if (!this.allStoriesData) { 
            try {
                const response = await fetch('stories.json');
                if (!response.ok) throw new Error('Failed to load stories.json');
                this.allStoriesData = await response.json();
            } catch (error) {
                console.error("Failed to load stories.json:", error);
                throw new Error("Could not load stories data");
            }
        }

        // Find the story
        let storyData = this.allStoriesData.find(story => {
            return (story.id === storyId) || (this.normalizeId(story.title) === storyId);
        });
        
        if (!storyData || !storyData.stages || stageIndex < 0 || stageIndex >= storyData.stages.length) {
            console.error(`Story or stage index out of bounds for ${storyId}[${stageIndex}]`);
            throw new Error(`Story stage not found: ${storyId}[${stageIndex}]`);
        }
        
        const stageInfo = storyData.stages[stageIndex];
        
        // Convert story stage format to game stage format
        let enemies = stageInfo.enemies || [];
        
        // Handle boss field - convert it to an enemy entry
        if (stageInfo.boss && enemies.length === 0) {
            // Convert boss string to character ID format
            const bossCharacterId = stageInfo.boss.toLowerCase().replace(/\s+/g, '_');
            enemies = [{
                characterId: bossCharacterId
            }];
        }
        
        const gameStageData = {
            name: stageInfo.name,
            description: stageInfo.description,
            difficulty: stageInfo.difficulty || 1,
            enemies: enemies,
            objectives: stageInfo.objectives || null, // Copy objectives including winConditions
            modifiers: stageInfo.modifiers || [],
            backgroundImage: stageInfo.backgroundImage || 'images/stages/default.jpg',
            backgroundMusic: stageInfo.backgroundMusic || null,
            isTutorial: stageInfo.isTutorial || false,
            tutorialHighlights: stageInfo.tutorialHighlights || [],
            tutorialMessage: stageInfo.tutorialMessage || null
        };
        
        console.log(`Loaded story stage data:`, gameStageData);
        return gameStageData;
    }

    // --- NEW: Helper to get stage info from registry/stories.json ---
    async getStageInfoFromRegistry(storyId, stageIndex) {
         const self = this; // Assign this to self
         // Ensure stories.json is loaded (might need a dedicated method)
         if (!this.allStoriesData) { 
             try {
                 const response = await fetch('stories.json');
                 if (!response.ok) throw new Error('Failed to load stories.json');
                 this.allStoriesData = await response.json();
             } catch (error) {
                  console.error("Failed to load stories.json needed for getStageInfoFromRegistry:", error);
                  return null;
             }
         }

         // First try to find with explicit ID, then current normalization, then backwards compatibility
         let storyData = this.allStoriesData.find(function(story) {
             return (story.id === storyId) || (self.normalizeId(story.title) === storyId);
         });
         
         // If not found, try backwards compatibility for old format (with colons)
         if (!storyData) {
             console.log(`Story not found with current normalization. Trying backwards compatibility for: ${storyId}`);
             storyData = this.allStoriesData.find(function(story) {
                 const oldFormatId = story.title.toLowerCase().replace(/\s+/g, '_'); // Old format that kept colons
                 return oldFormatId === storyId;
             });
             if (storyData) {
                 console.log(`Found story using backwards compatibility: ${storyData.title}`);
             }
         }
         
         if (!storyData || !storyData.stages || stageIndex < 0 || stageIndex >= storyData.stages.length) {
             console.error(`Story or stage index out of bounds for ${storyId}[${stageIndex}]`);
             console.log('Available stories:', this.allStoriesData.map(s => ({ title: s.title, normalized: self.normalizeId(s.title) })));
             return null;
         }
         
         const stage = storyData.stages[stageIndex];
         // Use self here too for consistency, though arrow function wasn't the issue here
         const stageName = self.normalizeId(stage.name); 
         const fullStageId = stageName; // Use only the normalized stage name for the filename

         return {
             id: fullStageId, // Return the filename ID
             name: stage.name,
             // Add other relevant stage info if needed by caller
         };
    }
    // --- END NEW ---

    // Get active stage modifiers
    getStageModifiers() {
        return this.stageModifiers;
    }

    // Check if a specific modifier is active by ID
    hasStageModifier(modifierId) {
        return this.stageModifiers.some(mod => mod.id === modifierId);
    }

    // Get a specific stage modifier by ID
    getStageModifier(modifierId) {
        return this.stageModifiers.find(mod => mod.id === modifierId);
    }

    // Display stored stage modification messages
    displayStageModificationMessages() {
        if (!window.gameManager || !window.gameManager.addLogEntry) {
            console.warn('[StageManager] Game manager not available for displaying stage modification messages');
            return;
        }

        // Display messages for all characters that have modifications
        const allCharacters = [...this.gameState.playerCharacters, ...this.gameState.aiCharacters];
        allCharacters.forEach(character => {
            if (character._stageModificationMessages && character._stageModificationMessages.length > 0) {
                character._stageModificationMessages.forEach(message => {
                    window.gameManager.addLogEntry(message, 'stage-modifier');
                });
                // Clear the messages after displaying them
                delete character._stageModificationMessages;
            }
        });
    }
}

// Stage definition class
class Stage {
    constructor(id, name, description, difficulty) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.difficulty = difficulty || 1;
        this.enemies = [];
        this.rewards = [];
        this.backgroundImage = '';
        this.backgroundMusic = '';
        this.unlockRequirements = [];
        this.modifiers = []; // Add support for stage modifiers
    }
    
    addEnemy(characterId, modifications = null) {
        this.enemies.push({
            characterId,
            modifications
        });
        return this;
    }
    
    setBackgroundImage(imagePath) {
        this.backgroundImage = imagePath;
        return this;
    }
    
    setBackgroundMusic(musicPath) {
        this.backgroundMusic = musicPath;
        return this;
    }
    
    addReward(rewardType, rewardValue, chance = 1.0) {
        this.rewards.push({
            type: rewardType,
            value: rewardValue,
            chance: chance
        });
        return this;
    }
    
    addUnlockRequirement(requirementType, value) {
        this.unlockRequirements.push({
            type: requirementType,
            value: value
        });
        return this;
    }
    
    addModifier(id, name, description, effect) {
        this.modifiers.push({
            id,
            name,
            description,
            effect
        });
        return this;
    }
    
    isUnlocked(playerProgress) {
        if (this.unlockRequirements.length === 0) return true;
        
        return this.unlockRequirements.every(req => {
            switch (req.type) {
                case 'stage_completed':
                    return playerProgress.completedStages.includes(req.value);
                case 'character_owned':
                    return playerProgress.ownedCharacters.includes(req.value);
                case 'level_min':
                    return playerProgress.level >= req.value;
                default:
                    return false;
            }
        });
    }
}

// Global Stage Manager instance
const stageManager = new StageManager(); 