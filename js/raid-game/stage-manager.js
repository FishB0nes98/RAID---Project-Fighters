// Stage manager for Roguelike Raid Game
class StageManager {
    constructor() {
        this.currentStage = null;
        this.availableStages = [];
        this.stageHistory = [];
        this.onStageLoaded = null;
        this.customPlayerCharacters = null; // Add this property to store custom characters
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
    async loadStage(stageId, teamState = null) {
        console.log(`Loading stage: ${stageId}`);
        console.log('Received team state for loading:', teamState);

        try {
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
            const response = await fetch(stageInfo.path); // Use stageInfo.path
            if (!response.ok) {
                console.error(`Failed to fetch stage file from path ${stageInfo.path} for ${stageId}. Status: ${response.status}`);
                throw new Error(`Failed to load stage data for ${stageId} from path ${stageInfo.path}`);
            }
            
            const stageData = await response.json();
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
            
            // Apply stage modifiers
            this.applyStageModifiers();

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
        
        if (this.currentStage && this.currentStage.modifiers && Array.isArray(this.currentStage.modifiers)) {
            this.stageModifiers = [...this.currentStage.modifiers];
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            
            // Log active modifiers
            if (this.stageModifiers.length > 0) {
                log(`Stage modifiers active: ${this.stageModifiers.map(mod => mod.name).join(', ')}`, 'stage-info');
                
                // Log detailed descriptions
                this.stageModifiers.forEach(modifier => {
                    log(`${modifier.name}: ${modifier.description}`, 'stage-info');
                });
            }
            
            console.log(`Loaded ${this.stageModifiers.length} stage modifiers`);
        }
    }
    
    // Apply stage modifiers to the current game state
    applyStageModifiers() {
        if (!this.stageModifiers || this.stageModifiers.length === 0) {
            return;
        }

        this.stageModifiers.forEach(modifier => {
            // --- Handle AI Damage Reduction --- 
            if (modifier.effect && modifier.effect.type === 'ai_damage_reduction') {
                const reductionValue = modifier.effect.value || 0;
                
                this.gameState.aiCharacters.forEach(character => {
                    character.stageModifiers = character.stageModifiers || {};
                    // Store the reduction value
                    character.stageModifiers.damageReduction = (character.stageModifiers.damageReduction || 0) + reductionValue;
                    console.log(`Applying ${modifier.name} modifier to ${character.name} (Added ${reductionValue * 100}% Damage Reduction)`);
                });
            }

            // --- Handle AI Damage Increase (Pack Power) --- 
            if (modifier.effect && modifier.effect.type === 'ai_damage_increase') {
                const increaseValue = modifier.effect.value || 0;

                this.gameState.aiCharacters.forEach(character => {
                    character.stageModifiers = character.stageModifiers || {};
                    // Store the multiplier increase
                    character.stageModifiers.damageMultiplier = (character.stageModifiers.damageMultiplier || 0) + increaseValue;
                     console.log(`Applying ${modifier.name} modifier to ${character.name} (Added ${increaseValue * 100}% Damage Increase)`);
                });
            }
            
            // --- Handle 'it_finally_rains' modifier --- 
            if (modifier.id === 'it_finally_rains') {
                // Apply to all player characters
                this.gameState.playerCharacters.forEach(character => {
                    // Initialize stage modifiers property
                    character.stageModifiers = character.stageModifiers || {};
                    character.stageModifiers.itFinallyRains = true;
                    
                    // Patch the ability cost calculation
                    const originalUseAbility = character.useAbility;
                    character.useAbility = function(abilityIndex, targetOrTargets) {
                        // Store original mana cost
                        const originalManaCost = this.abilities[abilityIndex].manaCost;
                        
                        // Set mana cost to 0 temporarily
                        this.abilities[abilityIndex].manaCost = 0;
                        
                        // Call the original method
                        const result = originalUseAbility.call(this, abilityIndex, targetOrTargets);
                        
                        // Restore original mana cost
                        this.abilities[abilityIndex].manaCost = originalManaCost;
                        
                        return result;
                    };
                });
                
                // Create and add rain VFX to the stage
                this.createRainVFX();
                
                console.log(`Applied ${modifier.name} modifier: Rain healing and zero mana cost for player characters`);
            }
        });
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
                
                // Apply any stage-specific modifications
                if (enemyInfo.modifications) {
                    console.log(`[StageManager] Applying modifications to ${enemyInfo.characterId}`);
                    this.applyCharacterModifications(charData, enemyInfo.modifications);
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

        // If teamState is null or empty, load default or last selected team from Firebase
        if (!teamState || Object.keys(teamState).length === 0) {
            console.warn("No team state provided to loadPlayerCharacters. Attempting to load default/saved team.");
            const userId = getCurrentUserId();
            if (userId) {
                 const teamSelectionSnapshot = await firebaseDatabase.ref(`users/${userId}/currentTeamSelection`).once('value');
                 const currentTeamSelection = teamSelectionSnapshot.exists() ? teamSelectionSnapshot.val() : [];
                 if (Array.isArray(currentTeamSelection) && currentTeamSelection.length > 0) {
                     console.log("Using team selection from Firebase:", currentTeamSelection);
                     characterIds = currentTeamSelection;
                     useDefaultState = true; // Indicate we need to init with full HP/Mana
                 } else {
                      console.log("No saved team selection found. Falling back to hardcoded default team.");
                      characterIds = ['schoolboy_shoma']; // Fallback ID
                      useDefaultState = true;
                 }
            } else {
                 console.error("Cannot load default team: User not logged in.");
                 // Fallback to hardcoded default team if not logged in for testing?
                 characterIds = ['schoolboy_shoma']; // Fallback ID
                 useDefaultState = true;
            }
        } else {
             // Use the provided teamState
             characterIds = Object.keys(teamState);
             useDefaultState = false;
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

                // Apply saved HP/Mana from teamState if available and valid
                if (savedState && savedState.currentHP !== undefined && savedState.currentMana !== undefined) {
                    // --- NEW: Apply saved stats FIRST ---
                    if (savedState.stats && typeof savedState.stats === 'object') {
                        // --- DEBUG: Log the saved stats object --- 
                        console.log(`[DEBUG] Saved stats for ${character.name}:`, JSON.stringify(savedState.stats));
                        // --- END DEBUG ---

                        // --- FIXED: Merge saved stats onto existing object --- 
                        for (const statKey in savedState.stats) {
                            if (Object.hasOwnProperty.call(savedState.stats, statKey)) {
                                const savedValue = savedState.stats[statKey];

                                // --- Corrected Handling for maxHp/maxMana --- 
                                if (statKey === 'hp') { // Saved state uses 'hp' for maxHp
                                    if (typeof character.stats.maxHp !== 'undefined') {
                                        character.stats.maxHp = savedValue;
                                        console.log(`Set character.stats.maxHp from saved state hp: ${savedValue}`);
                                        if (typeof character.baseStats.maxHp !== 'undefined') {
                                            character.baseStats.maxHp = savedValue;
                                            console.log(`Updated baseStats.maxHp from saved state hp: ${savedValue}`);
                                        }
                                    }
                                } else if (statKey === 'mana') { // Saved state uses 'mana' for maxMana
                                     if (typeof character.stats.maxMana !== 'undefined') {
                                        character.stats.maxMana = savedValue;
                                        console.log(`Set character.stats.maxMana from saved state mana: ${savedValue}`);
                                        if (typeof character.baseStats.maxMana !== 'undefined') {
                                            character.baseStats.maxMana = savedValue;
                                            console.log(`Updated baseStats.maxMana from saved state mana: ${savedValue}`);
                                        }
                                    }
                                } else {
                                    // Update other stats directly on the character.stats object
                                    character.stats[statKey] = savedValue;
                                }
                                // --- End Corrected Handling ---

                                // OLD logic for updating baseStats (now handled above)
                                /*
                                // --- NEW: Update baseStats for maxHp/maxMana if saved ---
                                if (statKey === 'maxHp' || statKey === 'maxMana') {
                                    if (typeof character.baseStats[statKey] !== 'undefined') {
                                        character.baseStats[statKey] = savedValue; // Use savedValue here
                                        console.log(`Updated baseStat ${statKey} to saved value: ${savedValue}`);
                                        // --- DEBUG: Confirm baseStat update --- 
                                        console.log(`[DEBUG] ${character.name}'s baseStats.${statKey} is now: ${character.baseStats[statKey]}`);
                                        // --- END DEBUG ---
                                    }
                                }
                                // --- END NEW ---
                                */
                            }
                        }
                        console.log(`Merged saved STATS into ${character.name}:`, character.stats);
                        // --- END FIX ---

                        // IMPORTANT: Ensure baseStats are NOT overwritten unless intended by design.
                        // If stats boosts are meant to be permanent increases *to the base*, then baseStats
                        // should also be updated here. For now, let's assume they modify current operational stats.

                        // Recalculate dependent stats if necessary (though Character constructor usually handles initial setup)
                        // character.recalculateStats(); // Might be needed if stats interactions are complex
                    }
                    // --- END NEW ---

                    character.stats.currentHp = Math.max(0, Math.min(savedState.currentHP, character.stats.maxHp));
                    character.stats.currentMana = Math.max(0, Math.min(savedState.currentMana, character.stats.maxMana));
                    console.log(`Applied provided state to ${character.name}: HP=${character.stats.currentHp}, Mana=${character.stats.currentMana}`);
                } else {
                    // Default to full HP/Mana if state wasn't fully provided
                    character.stats.currentHp = character.stats.maxHp;
                    character.stats.currentMana = character.stats.maxMana;
                     console.log(`Initialized ${character.name} with full HP/Mana as no valid state was provided.`);
                }

                // Apply character talents if TalentManager is available
                if (window.talentManager && character) {
                    try {
                        // Load and apply talents for this character
                        await character.loadTalents();
                        
                        // Log talent application
                        console.log(`Applied talents for ${character.name}`);
                    } catch (error) {
                        console.error(`Error applying talents for ${character.id}:`, error);
                    }
                }

                // Add to player characters
                this.gameState.playerCharacters.push(character);

            } catch (error) {
                console.error(`Error loading player character ${charId}:`, error);
            }
        }

        console.log(`Loaded ${this.gameState.playerCharacters.length} player characters`);
    }
    
    // Apply modifications to a character
    applyCharacterModifications(charData, modifications) {
        if (!modifications) return;
        
        // Apply stat modifications
        if (modifications.stats) {
            Object.keys(modifications.stats).forEach(statKey => {
                if (charData.stats[statKey] !== undefined) {
                    charData.stats[statKey] = modifications.stats[statKey];
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

         const storyData = this.allStoriesData.find(function(story) { // Use function() instead of arrow
             return self.normalizeId(story.title) === storyId; // Use self here
         });
         if (!storyData || !storyData.stages || stageIndex < 0 || stageIndex >= storyData.stages.length) {
             console.error(`Story or stage index out of bounds for ${storyId}[${stageIndex}]`);
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