/**
 * Story Manager 
 * Handles story progression, stage management, and overall game flow
 */
class StoryManager {
    constructor(userId) {
        this.userId = userId;
        this.currentStory = null;
        this.currentStageIndex = 0;
        this.completedStages = [];
        this.playerTeam = [];
        this.storyId = null;
        this.progressData = {
            currentStage: 0,
            completedStages: [],
            teamState: {},
            rewards: []
        };
        this.characterRegistry = {}; // To store registry data
        this.characterXPManager = null; // XP Manager for awarding experience
        this.storyProgress = {
            currentStageIndex: 0,
            completedStages: 0,
            lastTeamState: null
        };
        this.allStoriesData = null;
        this.storyRegistry = {}; // For storing loaded story details

        // Events
        this.onStoryLoaded = null;
        this.onStageCompleted = null;

        // Initialize XP manager
        this.initializeXPManager();
    }

    /**
     * Initialize the character XP manager
     */
    async initializeXPManager() {
        try {
            if (typeof CharacterXPManager !== 'undefined') {
                this.characterXPManager = new CharacterXPManager();
                await this.characterXPManager.initialize();
                console.log('[StoryManager] CharacterXPManager initialized');
            }
        } catch (error) {
            console.error('[StoryManager] Error initializing XP manager:', error);
        }
    }

    /**
     * Check if the story is available to the current user
     * Combines global availability settings with user ownership
     * @param {string} storyId - The ID of the story to check
     * @throws {Error} If story is not available
     */
    async checkStoryAvailability(storyId) {
        try {
            console.log(`[StoryManager] Checking availability for story: ${storyId}`);
            
            // Check global story availability settings
            let isGloballyAvailable = null;
            try {
                const globalAvailabilityRef = firebase.database().ref(`globalSettings/storyAvailability/${storyId}`);
                const globalSnapshot = await globalAvailabilityRef.once('value');
                if (globalSnapshot.exists()) {
                    isGloballyAvailable = globalSnapshot.val();
                    console.log(`[StoryManager] Global availability for ${storyId}:`, isGloballyAvailable);
                }
            } catch (error) {
                console.warn('[StoryManager] Error checking global story availability:', error);
                // Continue with local checks if global check fails
            }

            // If globally disabled, deny access immediately
            if (isGloballyAvailable === false) {
                throw new Error(`Story "${this.currentStory.title}" is currently not available. Please check back later.`);
            }

            // If globally enabled, allow access
            if (isGloballyAvailable === true) {
                console.log(`[StoryManager] Story ${storyId} is globally enabled, access granted`);
                return;
            }

            // If no global setting (null/undefined), check user ownership and local playerunlocked setting
            const userOwnedStoriesRef = firebase.database().ref(`users/${this.userId}/ownedStories`);
            const ownedSnapshot = await userOwnedStoriesRef.once('value');
            let ownedStories = [];
            
            if (ownedSnapshot.exists()) {
                const ownedData = ownedSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedStories = ownedData;
                } else if (typeof ownedData === 'object') {
                    ownedStories = Object.values(ownedData);
                }
            }

            // Check if user owns the story
            const userOwnsStory = ownedStories.includes(storyId);
            
            // Check local playerunlocked setting
            const locallyUnlocked = this.currentStory.playerunlocked === true;

            console.log(`[StoryManager] Story availability check for ${storyId}:`);
            console.log(`  - User owns: ${userOwnsStory}`);
            console.log(`  - Locally unlocked: ${locallyUnlocked}`);
            console.log(`  - Global setting: ${isGloballyAvailable}`);

            if (userOwnsStory || locallyUnlocked) {
                console.log(`[StoryManager] Story ${storyId} is available to user`);
                return;
            }

            // Story is not available
            throw new Error(`You do not have access to "${this.currentStory.title}". This story may be locked or requires purchase.`);

        } catch (error) {
            console.error(`[StoryManager] Story availability check failed:`, error);
            if (error.message.includes('not available') || error.message.includes('do not have access')) {
                // These are user-facing availability errors, re-throw as-is
                throw error;
            } else {
                // This is a system error, provide a generic message
                throw new Error(`Unable to verify story availability. Please try again later.`);
            }
        }
    }

    /**
     * Load a story and initialize the game state
     * @param {string} storyId - The ID of the story to load (from URL)
     * @returns {Promise} - A promise that resolves when the story is loaded
     */
    async loadStory(storyId) {
        console.log(`[StoryManager] loadStory START - Story: ${storyId}, User: ${this.userId}`);
        if (!this.userId) {
            console.error("[StoryManager] Cannot load story without a user ID.");
            throw new Error("User not authenticated.");
        }

        try {
            this.storyId = storyId;
            console.log("[StoryManager] Set storyId:", this.storyId);

            // 1. Load all stories definitions if not already loaded
            if (!this.allStoriesData) {
                console.log("[StoryManager] Loading stories.json...");
                const response = await fetch('stories.json');
                if (!response.ok) throw new Error('Failed to load stories.json');
                this.allStoriesData = await response.json();
                console.log("[StoryManager] stories.json loaded.");
            }

            // 2. Find the specific story definition
            this.currentStory = this.allStoriesData.find(story => {
                // First try explicit ID, then fall back to normalized title
                return (story.id === storyId) || (this.normalizeId(story.title) === storyId);
            });
            if (!this.currentStory) {
                throw new Error(`[StoryManager] Story with ID '${storyId}' not found.`);
            }
            console.log("[StoryManager] Found current story:", this.currentStory.title);

            // 2.5. Check if story is available to the user (global availability + user ownership)
            await this.checkStoryAvailability(storyId);

            // 3. Fetch user's progress for this specific story from Firebase FIRST
            console.log("[StoryManager] Fetching story progress from Firebase...");
            await this.fetchStoryProgress(); // This populates this.storyProgress
            console.log("[StoryManager] Story progress fetched/initialized:", JSON.parse(JSON.stringify(this.storyProgress))); // Log a deep copy

            let currentTeamIds = [];
            let initialTeamObjects = [];

            // 4. Determine initial team based on progress or fallback
            if (this.storyProgress.lastTeamState && Object.keys(this.storyProgress.lastTeamState).length > 0) {
                // Use team from saved story progress
                currentTeamIds = Object.keys(this.storyProgress.lastTeamState);
                console.log("[StoryManager] Using team IDs from saved story progress:", currentTeamIds);
                initialTeamObjects = currentTeamIds.map(id => ({ id }));
            } else {
                // Fallback to general currentTeamSelection if no saved state
                console.log("[StoryManager] No saved team state found. Fetching currentTeamSelection from Firebase as fallback...");
                const teamSelectionSnapshot = await firebaseDatabase.ref(`users/${this.userId}/currentTeamSelection`).once('value');
                currentTeamIds = teamSelectionSnapshot.exists() ? teamSelectionSnapshot.val() : [];
                if (!Array.isArray(currentTeamIds) || currentTeamIds.length === 0) {
                    console.warn("[StoryManager] Fallback failed: No valid team selection found in Firebase.");
                    this.playerTeam = [];
                    // Potentially throw an error or redirect if no team can be determined
                } else {
                    console.log("[StoryManager] Using team IDs from fallback currentTeamSelection:", currentTeamIds);
                    initialTeamObjects = currentTeamIds.map(id => ({ id }));
                }
            }

            // 5. Load team data using the determined IDs
            if (initialTeamObjects.length > 0) {
                console.log("[StoryManager] Loading character registry...");
                await this.loadCharacterRegistry();
                console.log("[StoryManager] Loading team data for:", currentTeamIds);
                this.playerTeam = await this.loadTeamData(initialTeamObjects);
                console.log("[StoryManager] Player team data loaded.");
                console.log('[StoryManager] Team immediately after loadTeamData:', JSON.parse(JSON.stringify(this.playerTeam.map(c => c.id))));
            } else {
                 console.warn("[StoryManager] No team IDs determined. Player team is empty.");
                 this.playerTeam = [];
            }

            // 6. Apply saved STATS from progress (if progress existed)
            // This should now work correctly as the right characters are in playerTeam
            if (this.storyProgress.lastTeamState && this.playerTeam.length > 0) {
                console.log("[StoryManager] Applying saved STATS from Firebase progress:", JSON.parse(JSON.stringify(this.storyProgress.lastTeamState)));
                this.applyStatsFromProgress(); // Apply stats modifications
            }

            // 7. Apply saved team state (HP/Mana) from fetched progress (if progress existed)
            // This should also work correctly now
            if (this.storyProgress.lastTeamState && this.playerTeam.length > 0) {
                 console.log("[StoryManager] Applying saved team state (HP/Mana) from Firebase progress:", JSON.parse(JSON.stringify(this.storyProgress.lastTeamState)));
                 this.applyTeamStateFromProgress(); // Apply current HP/Mana
            }

            // 8. Check for and process last battle result from Firebase
            console.log("[StoryManager] Processing last battle result...");
            const battleResultProcessed = await this.processLastBattleResult();
            console.log("[StoryManager] Battle result processing finished. Processed:", battleResultProcessed);

            // If a battle result was processed (and it was a victory), progress/state might have changed.
            // We might need to re-render UI elements after this point.

            console.log(`[StoryManager] loadStory END - Story "${this.currentStory.title}" loaded. Current Stage Index:`, this.storyProgress.currentStageIndex);
            console.log(`[StoryManager] Player team loaded:`, this.playerTeam);

            // Call event handler if defined
            if (this.onStoryLoaded) {
                console.log("[StoryManager] Calling onStoryLoaded callback.");
                this.onStoryLoaded(this.currentStory);
            }

            return this.currentStory;
        } catch (error) {
            console.error('[StoryManager] Error in loadStory:', error);
            throw error;
        }
    }

    /**
     * Load full character data for the team, merging with saved state.
     * @param {Array<Object>} teamObjects - Array of character objects (just {id: '...'} expected).
     * @returns {Promise<Array<Object>>} - A promise that resolves with the full team data.
     */
    async loadTeamData(teamObjects) {
        const teamDataPromises = teamObjects.map(async (teamMember) => {
            const charId = teamMember.id; // Extract the ID from the object
            if (!charId) {
                console.error('Character object missing ID:', teamMember);
                return null;
            }

            try {
                // --- NEW: Load enhanced character stats from Firebase first ---
                let characterData = null;
                const userId = this.userId;
                
                if (userId) {
                    try {
                        // Try to load from users/{userId}/Raid/{characterId}/stats first
                        const enhancedStatsRef = firebaseDatabase.ref(`users/${userId}/Raid/${charId}/stats`);
                        const enhancedSnapshot = await enhancedStatsRef.once('value');
                        
                        if (enhancedSnapshot.exists()) {
                            console.log(`[StoryManager] Found enhanced stats for ${charId} in Firebase`);
                            const enhancedStats = enhancedSnapshot.val();
                            
                            // Load base character data for other properties (abilities, name, etc.)
                            const response = await fetch(`js/raid-game/characters/${charId}.json`);
                            if (!response.ok) {
                                throw new Error(`Failed to load base data for character ${charId}`);
                            }
                            const baseCharacterData = await response.json();
                            
                            // Merge enhanced stats with base character data
                            characterData = {
                                ...baseCharacterData,
                                stats: { ...enhancedStats } // Use enhanced stats from Firebase
                            };
                            
                            console.log(`[StoryManager] Using enhanced stats for ${charId}:`, enhancedStats);
                        } else {
                            console.log(`[StoryManager] No enhanced stats found for ${charId}, using base stats`);
                        }
                    } catch (error) {
                        console.warn(`[StoryManager] Error loading enhanced stats for ${charId}:`, error);
                    }
                }
                
                // Fallback to base character data if enhanced stats not available
                if (!characterData) {
                    const response = await fetch(`js/raid-game/characters/${charId}.json`);
                    if (!response.ok) {
                        throw new Error(`Failed to load data for character ${charId}`);
                    }
                    characterData = await response.json();
                    console.log(`[StoryManager] Using base stats for ${charId}`);
                }
                // --- END NEW ---
                
                // Get avatar image from registry
                const registryEntry = this.characterRegistry[charId];
                if (registryEntry && registryEntry.image) {
                    characterData.avatarImage = registryEntry.image;
                } else {
                    characterData.avatarImage = characterData.image; // Fallback to character's image
                    console.warn(`Avatar image not found in registry for ${charId}, using default.`);
                }
                
                // Initialize with full HP/Mana - saved state applied separately after progress fetch
                characterData.currentHP = characterData.stats.hp;
                characterData.currentMana = characterData.stats.mana;
                console.log(`Initialized state for ${charId}: HP=${characterData.currentHP}, Mana=${characterData.currentMana}`);
                
                // Add the original ID back for reference if needed
                characterData.id = charId;
                
                return characterData;
            } catch (error) {
                console.error(`Error loading character ${charId}:`, error);
                return null; // Return null for failed loads
            }
        });
        
        const loadedTeamData = await Promise.all(teamDataPromises);
        return loadedTeamData.filter(data => data !== null); // Filter out any failed loads
    }

    /**
     * Get information about the current story
     * @returns {Object} - Story information
     */
    getStoryInfo() {
        if (!this.currentStory) {
            throw new Error('No story loaded');
        }
        
        return {
            title: this.currentStory.title,
            description: this.currentStory.description || 'No description available',
            totalStages: this.currentStory.stages.length,
            currentStage: this.currentStageIndex,
            progress: this.getProgressPercentage()
        };
    }

    /**
     * Get the current progress percentage
     * @returns {number} - Progress percentage (0-100)
     */
    getProgressPercentage() {
        if (!this.currentStory || !this.currentStory.stages.length) {
            return 0;
        }
        
        return Math.round((this.progressData.completedStages.length / this.currentStory.stages.length) * 100);
    }

    /**
     * Get all stages in the current story
     * @returns {Array} - Array of stage data
     */
    getAllStages() {
        if (!this.currentStory) {
            throw new Error('No story loaded');
        }
        
        // Use the numeric completedStages count from storyProgress
        // Assuming storyProgress.currentStageIndex points to the *next* stage to play
        const currentActiveIndex = this.storyProgress.currentStageIndex;

        return this.currentStory.stages.map((stage, index) => {
            const stageId = this.getStageId(index);
            
            return {
                id: stageId,
                name: stage.name,
                description: stage.description || 'No description available',
                difficulty: stage.difficulty,
                boss: stage.boss || null,
                type: stage.type || 'battle',
                choices: stage.choices || null,
                recruitTag: stage.recruitTag || null,
                recruitCount: stage.recruitCount || 0,
                specificCharacters: stage.specificCharacters || null,
                isEncounter: stage.isEncounter || false,
                unlockableCharacters: stage.unlockableCharacters || null,
                tutorialReward: stage.tutorialReward || false,
                firstTimeCompletionReward: stage.firstTimeCompletionReward || false,
                maxSelections: stage.maxSelections || 1, // For ally_selection stages
                description_detail: stage.description_detail || null, // For ally_selection stages
                index: index,
                // A stage is completed if its index is less than the current active index.
                isCompleted: index < this.storyProgress.currentStageIndex, 
                // A stage is active if its index *is* the current active index.
                isActive: index === this.storyProgress.currentStageIndex,
                 // A stage is locked if its index is greater than the current active index.
                isLocked: index > this.storyProgress.currentStageIndex 
            };
        });
    }

    /**
     * Get the current stage data
     * @returns {Object} - Current stage data
     */
    getCurrentStage() {
        if (!this.currentStory) {
            throw new Error('No story loaded');
        }
        
        // Use storyProgress.currentStageIndex as the reliable index
        const currentStageIndex = this.storyProgress.currentStageIndex;
        
        // Check if the story is already completed
        if (currentStageIndex >= this.currentStory.stages.length) {
             console.warn("Attempting to get current stage, but story is complete.");
             // Return null or a special object indicating completion
             return null; 
        }

        const stage = this.currentStory.stages[currentStageIndex];
        if (!stage) {
            // This should ideally not happen if the index is within bounds
            throw new Error(`Invalid current stage index: ${currentStageIndex}`);
        }
        
        const stageId = this.getStageId(currentStageIndex);

        return {
            id: stageId,
            name: stage.name,
            description: stage.description || 'No description available',
            difficulty: stage.difficulty,
            boss: stage.boss || null,
            type: stage.type || 'battle',
            choices: stage.choices || null,
            recruitTag: stage.recruitTag || null,
            recruitCount: stage.recruitCount || 0,
            specificCharacters: stage.specificCharacters || null,
            isEncounter: stage.isEncounter || false,
            unlockableCharacters: stage.unlockableCharacters || null,
            tutorialReward: stage.tutorialReward || false,
            firstTimeCompletionReward: stage.firstTimeCompletionReward || false,
            maxSelections: stage.maxSelections || 1, // For ally_selection stages
            description_detail: stage.description_detail || null, // For ally_selection stages
            index: currentStageIndex,
            // Use storyProgress to determine completion status accurately
            isCompleted: currentStageIndex < this.storyProgress.completedStages, 
            isActive: true,
            isLocked: false
        };
    }

    /**
     * Normalize a string to create an ID
     * @param {string} str - The string to normalize
     * @returns {string} - Normalized ID
     */
    normalizeId(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    /**
     * Get a stage ID from the story and stage index
     * @param {number} index - Stage index
     * @returns {string} - Stage ID
     */
    getStageId(index) {
        if (!this.currentStory) {
            throw new Error('No story loaded');
        }
        
        const stage = this.currentStory.stages[index];
        if (!stage) {
            throw new Error(`Invalid stage index: ${index}`);
        }
        
        return `${this.normalizeId(this.currentStory.title)}_${this.normalizeId(stage.name)}`;
    }

    /**
     * Loads the character registry data.
     */
    async loadCharacterRegistry() {
        if (Object.keys(this.characterRegistry).length > 0) return; // Already loaded

        try {
            const response = await fetch('js/raid-game/character-registry.json');
            if (!response.ok) {
                throw new Error('Failed to load character registry');
            }
            const registryData = await response.json();
            registryData.characters.forEach(char => {
                this.characterRegistry[char.id] = char;
            });
            console.log('Character registry loaded.');
        } catch (error) {
            console.error('Error loading character registry:', error);
        }
    }

    // --- NEW Helper to apply saved team state from storyProgress --- 
    applyTeamStateFromProgress() {
         if (!this.storyProgress.lastTeamState || !this.playerTeam || this.playerTeam.length === 0) return;

         const savedStatesMap = new Map(Object.entries(this.storyProgress.lastTeamState)); // Assuming lastTeamState is an object { charId: { hp, mana } }

         this.playerTeam = this.playerTeam.map(teamMember => {
            const savedState = savedStatesMap.get(teamMember.id);
            if (savedState && savedState.currentHP !== undefined && savedState.currentMana !== undefined) {
                 const maxHp = teamMember.stats?.hp ?? teamMember.currentHP ?? 0;
                 const maxMana = teamMember.stats?.mana ?? teamMember.currentMana ?? 0;
                 return {
                     ...teamMember,
                     currentHP: Math.max(0, Math.min(savedState.currentHP, maxHp)),
                     currentMana: Math.max(0, Math.min(savedState.currentMana, maxMana))
                 };
            } else {
                 // If no saved state for this member, keep their initial state (should be full HP/Mana)
                 return teamMember;
            }
        });
         console.log("Applied saved team state from progress to playerTeam.");
    }
    // --- END Helper ---

    // --- NEW Helper to apply saved STATS from storyProgress --- 
    applyStatsFromProgress() {
         if (!this.storyProgress.lastTeamState || !this.playerTeam || this.playerTeam.length === 0) return;

         const savedStatesMap = new Map(Object.entries(this.storyProgress.lastTeamState)); // Assuming lastTeamState is an object { charId: { hp, mana, stats } }

         this.playerTeam = this.playerTeam.map(teamMember => {
            const savedState = savedStatesMap.get(teamMember.id);
            // Check if saved state exists and has a stats object
            if (savedState && typeof savedState.stats === 'object' && savedState.stats !== null) {
                 // Merge saved stats onto the loaded character data
                 // This overwrites base stats with the modified ones from progress
                 // Important: Also ensure currentHP/Mana are capped by the potentially modified maxHP/maxMana from saved stats
                 const newStats = { ...savedState.stats };
                 const newCurrentHP = Math.max(0, Math.min(teamMember.currentHP, newStats.hp));
                 const newCurrentMana = Math.max(0, Math.min(teamMember.currentMana, newStats.mana));
                 // Also restore hell effects and permanent debuffs if they exist
                 const hellEffects = savedState.hellEffects ? { ...savedState.hellEffects } : undefined;
                 const permanentDebuffs = savedState.permanentDebuffs ? [...savedState.permanentDebuffs] : undefined;
                 
                 return {
                     ...teamMember,
                     stats: newStats, // Apply the saved stats object
                     currentHP: newCurrentHP,
                     currentMana: newCurrentMana,
                     hellEffects: hellEffects,
                     permanentDebuffs: permanentDebuffs
                 };
            } else {
                 // If no saved stats for this member, keep their base stats
                 return teamMember;
            }
        });
         console.log("Applied saved stats from progress to playerTeam.");
    }
    // --- END Helper ---

    // --- Process last battle result from Firebase ---
    async processLastBattleResult() {
        console.log("[StoryManager] processLastBattleResult START");
        const battleResultRef = firebaseDatabase.ref(`users/${this.userId}/lastBattleResult`);
        try {
            const snapshot = await battleResultRef.once('value');
            if (!snapshot.exists()) {
                console.log('[StoryManager] No lastBattleResult found in Firebase.');
                return false; // No result to process
            }

            const result = snapshot.val();
            console.log('[StoryManager] Found lastBattleResult:', JSON.stringify(result, null, 2));

            // Clear the result immediately after reading
            await battleResultRef.remove();
            console.log('[StoryManager] Removed lastBattleResult from Firebase.');

            // The `stageIndex` from the battle result should match the `currentStageIndex`
            // that was loaded *before* processing this result. This represents the stage
            // the player just finished.
            console.log(`[StoryManager] Current storyId: ${this.storyId}, Current progress stage index (before processing): ${this.storyProgress.currentStageIndex}`);
            console.log(`[StoryManager] Battle result stage index: ${result.stageIndex}`);
            
            // Check if result is for the correct story
            if (result.storyId !== this.storyId) {
                console.warn(`[StoryManager] Battle result story mismatch. Result: ${result.storyId}, Expected: ${this.storyId}. Ignoring.`);
                return false; // Result is for a different story
            }
            
            // Strict check: The result's stage index MUST match the current progress stage index
            if (result.stageIndex !== this.storyProgress.currentStageIndex) {
                console.warn(`[StoryManager] Battle result stage index mismatch. Result index: ${result.stageIndex}, Expected current progress index: ${this.storyProgress.currentStageIndex}. Ignoring.`);
                // If this happens often, there might be an issue in how currentStageIndex is loaded/saved elsewhere
                // or how the stageIndex is passed to the battle.
                return false;
            }
            
            // If we're here, the story and stage index match exactly.
            console.log(`[StoryManager] Battle result story/stage MATCHED. Processing result for stage index: ${result.stageIndex}`);
            
            if (result.victory) {
                 console.log("[StoryManager] Processing VICTORY from lastBattleResult.");
                 // Ensure team state reflects the survivors from the battle
                 const finalTeamState = result.finalTeamState || result.survivingTeamState || [];
                 console.log("[StoryManager] Updating team state from battle result:", finalTeamState);
                 this.updateTeamStateFromBattleResult(finalTeamState);
                 
                 // Award XP to characters for story battle victory
                 await this.awardExperienceForStoryBattle(result);
                 
                 // Advance the stage index and save progress (including the updated team state)
                 await this.completeCurrentStageAfterVictory();

            } else {
                 console.log("[StoryManager] Processing DEFEAT from lastBattleResult.");
                 // --- DEBUG LOG ---
                 console.log("[StoryManager] Defeat detected. Attempting to delete saved story progress...");
                 // --- END DEBUG LOG ---
                 // For defeats, delete the story progress and redirect to character select
                 // This implements the "run" concept - if you fail, the run is over
                 await this.deleteSavedProgress();
                 
                 // Set redirect flag that will be checked in the UI
                 console.log("[StoryManager] Setting shouldRedirectToCharacterSelect = true");
                 this.shouldRedirectToCharacterSelect = true;
                 return true; // Indicate that we processed a result
            }

            console.log("[StoryManager] processLastBattleResult END - Processed successfully.");
            return true; // Indicate that we processed a result successfully
        } catch (error) {
            console.error("[StoryManager] Error processing battle result:", error);
            return false;
        }
    }

    /**
     * Delete the progress for the current story in Firebase (for failed runs)
     */
    async deleteSavedProgress() {
        console.log("[StoryManager] deleteSavedProgress START");
        if (!this.storyId || !this.userId) {
            console.warn('[StoryManager] Cannot delete progress, no story ID or user ID set.');
            return;
        }
        const progressPath = `users/${this.userId}/storyProgress/${this.storyId}`;
        const progressRef = firebaseDatabase.ref(progressPath);
        console.log(`[StoryManager] Attempting to remove progress at path: ${progressPath}`);
        try {
            await progressRef.remove();
            console.log(`[StoryManager] Progress for story ${this.storyId} has been deleted from Firebase.`);
        } catch (error) {
            console.error("[StoryManager] Error deleting progress in Firebase:", error);
        }

        // Reset internal state as well
        console.log("[StoryManager] Resetting internal storyProgress state.");
        this.storyProgress = {
            currentStageIndex: 0,
            completedStages: 0,
            lastTeamState: null
        };
        console.log("[StoryManager] deleteSavedProgress END");
    }

    // --- NEW Method to update team state from a battle result array ---
    updateTeamStateFromBattleResult(finalTeamStateArray) {
         if (!Array.isArray(finalTeamStateArray)) {
             console.error("Invalid finalTeamStateArray provided.");
             return;
         }
         if (!this.playerTeam || this.playerTeam.length === 0) {
             console.warn("Player team not loaded, cannot apply battle result state.");
             return;
         }

         const finalStatesMap = new Map(finalTeamStateArray.map(s => [s.id, s]));

         this.playerTeam = this.playerTeam.map(teamMember => {
             const finalState = finalStatesMap.get(teamMember.id);
             if (finalState) {
                 const maxHp = teamMember.stats?.hp ?? teamMember.currentHP ?? 0;
                 const maxMana = teamMember.stats?.mana ?? teamMember.currentMana ?? 0;
                 return {
                     ...teamMember,
                     currentHP: Math.max(0, Math.min(finalState.currentHP, maxHp)),
                     currentMana: Math.max(0, Math.min(finalState.currentMana, maxMana))
                 };
             } else {
                 // If character not in final state, assume they died (or weren't in the battle?)
                 return { ...teamMember, currentHP: 0 };
             }
         });

         // Update the state that gets saved in storyProgress
         this.storyProgress.lastTeamState = this.playerTeam.reduce((acc, member) => {
             acc[member.id] = { 
                 currentHP: member.currentHP, 
                 currentMana: member.currentMana,
                 // Include the full stats object to persist modifications
                 stats: { ...member.stats },
                 // Also preserve hell effects and permanent debuffs
                 hellEffects: member.hellEffects ? { ...member.hellEffects } : undefined,
                 permanentDebuffs: member.permanentDebuffs ? [...member.permanentDebuffs] : undefined
             };
             return acc;
         }, {});

         console.log("Applied battle result state to playerTeam and storyProgress.lastTeamState.");
    }
    // --- END NEW ---

    /**
     * Award experience points to characters after a successful story battle
     */
    async awardExperienceForStoryBattle(battleResult) {
        if (!this.characterXPManager) {
            console.warn('[StoryManager] CharacterXPManager not available for XP awarding');
            return;
        }

        // Get current stage for difficulty calculation
        const currentStage = this.getCurrentStage();
        if (!currentStage) {
            console.warn('[StoryManager] No current stage found for XP calculation');
            return;
        }

        const stageDifficulty = currentStage.difficulty || 1;
        console.log(`[StoryManager] Awarding XP for story battle. Stage: ${currentStage.name}, Difficulty: ${stageDifficulty}`);

        const finalTeamState = battleResult.finalTeamState || battleResult.survivingTeamState || [];
        const finalStatesMap = new Map(finalTeamState.map(s => [s.id, s]));

        // Calculate story bonuses - story mode gets additional bonuses
        const allSurvived = this.playerTeam.every(member => {
            const finalState = finalStatesMap.get(member.id);
            return finalState && finalState.currentHP > 0;
        });
        
        const bonuses = {
            perfectVictory: allSurvived,
            speedBonus: false, // Story mode doesn't have speed bonus for now
            underdog: false, // Story mode doesn't have underdog bonus
            storyMode: true // Special story mode bonus
        };

        const xpResults = [];

        for (const teamMember of this.playerTeam) {
            const finalState = finalStatesMap.get(teamMember.id);
            const survived = finalState && finalState.currentHP > 0;
            const characterLevel = teamMember.level || finalState?.level || 1;

            try {
                // Use the enhanced XP calculation with story bonuses
                const result = await this.characterXPManager.awardExperience(
                    teamMember.id, 
                    stageDifficulty, 
                    characterLevel, 
                    survived, 
                    bonuses
                );
                
                if (result) {
                    xpResults.push({
                        characterName: teamMember.name,
                        characterId: teamMember.id,
                        ...result
                    });
                    
                    if (result.leveledUp) {
                        console.log(`[StoryManager] 🎉 ${teamMember.name} leveled up! ${result.oldLevel} → ${result.newLevel}`);
                        this.showLevelUpNotification(teamMember.name, result.newLevel);
                    } else {
                        console.log(`[StoryManager] ${teamMember.name} gained ${result.calculationDetails.xpAwarded} XP (Total: ${result.totalXP})`);
                    }
                }
            } catch (error) {
                console.error(`[StoryManager] Error awarding XP to ${teamMember.name}:`, error);
            }
        }

        // Show XP results if available (story UI will handle this differently than game manager)
        if (xpResults.length > 0) {
            this.showStoryXPRewards(xpResults, currentStage, bonuses);
        }
    }

    /**
     * Show XP rewards in story mode context
     */
    showStoryXPRewards(xpResults, stageInfo, bonuses) {
        // Delegate to the story UI manager if available
        if (this.storyUI && typeof this.storyUI.showXPRewards === 'function') {
            this.storyUI.showXPRewards(xpResults, stageInfo, bonuses);
        } else {
            // Fallback: log the results
            console.log('[StoryManager] XP Results:', xpResults);
            xpResults.forEach(result => {
                if (result.leveledUp) {
                    console.log(`${result.characterName}: +${result.calculationDetails.xpAwarded} XP (Level up! ${result.oldLevel} → ${result.newLevel})`);
                } else {
                    console.log(`${result.characterName}: +${result.calculationDetails.xpAwarded} XP (Total: ${result.totalXP})`);
                }
            });
        }
    }

    /**
     * Show a level up notification to the player
     */
    showLevelUpNotification(characterName, newLevel) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">
                    <strong>${characterName}</strong> reached Level ${newLevel}!
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Advance to the next stage without requiring a battle victory
     * Used for choice stages, character unlock stages, etc.
     * @returns {boolean} - True if there are more stages, false if the story is complete
     */
    async advanceToNextStage() {
        if (!this.currentStory) throw new Error('No story loaded');
        if (this.isStoryComplete()) return false;

        // Advance to next stage
        this.storyProgress.currentStageIndex++;
        this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex);

        // Save progress
        await this.saveStoryProgress();
        console.log(`[StoryManager] Advanced to stage ${this.storyProgress.currentStageIndex} and saved progress.`);

        const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

        // Call event handler if defined
        if (this.onStageCompleted) {
            const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1);
            this.onStageCompleted(completedStageId, [], hasMoreStages);
        }

        return hasMoreStages;
    }

    /**
     * Mark the current stage as completed and advance to the next stage
     * Called INTERNALLY after processing a victorious battle result.
     * @returns {boolean} - True if there are more stages, false if the story is complete
     */
    async completeCurrentStageAfterVictory() {
        if (!this.currentStory) throw new Error('No story loaded');
        if (this.isStoryComplete()) return false;

        // Stage index should ALREADY be correct based on fetched progress OR needs incrementing
        // Let's assume it needs incrementing here, as this is called *after* confirming victory for the *previous* index.
        this.storyProgress.currentStageIndex++;
        this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex); // Record highest reached

        // Rewards handling needs review - where do rewards come from?
        // Let's assume rewards are passed or fetched elsewhere.

        // Save progress (includes updated index and lastTeamState from battle result)
        await this.saveStoryProgress();
        console.log(`[StoryManager] Advanced to stage ${this.storyProgress.currentStageIndex} and saved progress.`);

        const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

        // Call event handler if defined
        if (this.onStageCompleted) {
            // Need stageId and rewards for this event
            const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1);
            this.onStageCompleted(completedStageId, [], hasMoreStages); // Pass empty rewards for now
        }

        return hasMoreStages;
    }

    /**
     * Start a battle with the current stage
     * @returns {string} - URL to the battle page
     */
    startStageBattle() {
        if (!this.currentStory) throw new Error('No story loaded');
        if (this.isStoryComplete()) throw new Error("Story is already complete.");

        const stage = this.currentStory.stages[this.storyProgress.currentStageIndex];
        const stageName = this.normalizeId(stage.name);
        const stageId = `${this.storyId}_${stageName}`; // Consistent stage ID generation

        // Generate the URL for the battle page
        const returnURL = `story.html?story=${this.storyId}`;
        // Pass necessary info via URL
        const battleURL = `raid-game.html?storyId=${this.storyId}&stageIndex=${this.storyProgress.currentStageIndex}&returnUrl=${encodeURIComponent(returnURL)}`;

        return battleURL;
    }

    /**
     * Reset the progress for the current story in Firebase
     */
    async resetProgress() {
        if (!this.storyId || !this.userId) {
            console.warn('Cannot reset progress, no story ID or user ID set.');
            return;
        }
        const progressRef = firebaseDatabase.ref(`users/${this.userId}/storyProgress/${this.storyId}`);
        try {
            await progressRef.remove();
            console.log(`Progress for story ${this.storyId} has been reset in Firebase.`);
        } catch (error) {
             console.error("Error resetting progress in Firebase:", error);
        }

        // Reset internal state as well
        this.storyProgress = {
            currentStageIndex: 0,
            completedStages: 0,
            lastTeamState: null
        };

        // Reload team data with full HP/Mana using the initially selected team
        const teamSelectionSnapshot = await firebaseDatabase.ref(`users/${this.userId}/currentTeamSelection`).once('value');
        const currentTeamIds = teamSelectionSnapshot.exists() ? teamSelectionSnapshot.val() : [];
        if (Array.isArray(currentTeamIds) && currentTeamIds.length > 0) {
            console.log("Fetched current team selection IDs:", currentTeamIds);
            // Create initial team objects with just IDs for loadTeamData
            const initialTeamObjects = currentTeamIds.map(id => ({ id }));
            // Load character registry data needed for loadTeamData
            await this.loadCharacterRegistry();
            // Load full team data (stats, etc.)
             this.playerTeam = await this.loadTeamData(initialTeamObjects);
        } else {
            console.warn("No valid team selection found in Firebase. Using defaults or redirecting?");
            // Handle this case - maybe redirect to selector? For now, use fallback.
            // throw new Error("No team selected."); 
            this.playerTeam = []; // Or a default team
        }

        // 5. Apply saved team state (HP/Mana) from fetched progress
        if (this.storyProgress.lastTeamState && this.playerTeam.length > 0) {
             console.log("Applying saved team state from Firebase progress:", this.storyProgress.lastTeamState);
             this.applyTeamStateFromProgress(); // Use helper function
        }

        // 6. Check for and process last battle result from Firebase
        const battleResultProcessed = await this.processLastBattleResult();

        // If a battle result was processed (and it was a victory), progress/state might have changed.
        // We might need to re-render UI elements after this point.

        console.log(`Story "${this.currentStory.title}" loaded. Current Stage Index:`, this.storyProgress.currentStageIndex);
        console.log(`Player team loaded:`, this.playerTeam);

        // Call event handler if defined
        if (this.onStoryLoaded) {
            this.onStoryLoaded(this.currentStory);
        }

        return this.currentStory;
    }

    // --- Fetch Story Progress ---
    async fetchStoryProgress() {
        if (!this.userId || !this.storyId) return;

        const progressRef = firebaseDatabase.ref(`users/${this.userId}/storyProgress/${this.storyId}`);
        try {
            const snapshot = await progressRef.once('value');
            if (snapshot.exists()) {
                const savedProgress = snapshot.val();
                // Ensure lastTeamState is treated as an object { charId: state }
                let lastTeamStateObject = null;
                if (Array.isArray(savedProgress.lastTeamState)) {
                    // Convert array [{id, hp, mana}] to object { id: {hp, mana}} if needed
                    lastTeamStateObject = savedProgress.lastTeamState.reduce((acc, char) => {
                        // Include stats if present in the old array format (unlikely but safe)
                        acc[char.id] = { 
                            currentHP: char.currentHP, 
                            currentMana: char.currentMana,
                            stats: char.stats || null // Include stats if they exist
                        };
                        return acc;
                    }, {});
                     console.warn("Converted lastTeamState from Array to Object format.");
                } else if (typeof savedProgress.lastTeamState === 'object' && savedProgress.lastTeamState !== null) {
                     lastTeamStateObject = savedProgress.lastTeamState;
                }

                this.storyProgress = {
                    currentStageIndex: savedProgress.currentStageIndex || 0,
                    // completedStages should be a number representing highest index reached
                    completedStages: savedProgress.completedStages || 0, 
                    // Ensure the fully loaded object (including stats if present) is assigned
                    lastTeamState: lastTeamStateObject 
                };
                console.log(`Fetched progress for story ${this.storyId}:`, this.storyProgress);
            } else {
                console.log(`No saved progress found for story ${this.storyId}. Initializing.`);
                // Initialize with defaults if no progress exists
                this.storyProgress = { currentStageIndex: 0, completedStages: 0, lastTeamState: null };
            }
        } catch (error) {
            console.error(`Error fetching progress for story ${this.storyId}:`, error);
            // Fallback to default initialization on error
            this.storyProgress = { currentStageIndex: 0, completedStages: 0, lastTeamState: null };
        }
    }

    // --- Save Story Progress ---
    async saveStoryProgress() {
        if (!this.userId || !this.storyId) {
            console.error("Cannot save progress: Missing userId or story info.");
            return;
        }

        const progressRef = firebaseDatabase.ref(`users/${this.userId}/storyProgress/${this.storyId}`);
        try {
            // Ensure lastTeamState is saved as an object { charId: { currentHP, currentMana, stats, hellEffects, permanentDebuffs } }
            const teamStateToSave = this.playerTeam.reduce((acc, member) => {
                const memberState = {
                    currentHP: member.currentHP,
                    currentMana: member.currentMana,
                    // Include the full stats object to persist modifications
                    stats: { ...member.stats }
                };
                
                // Only include hell effects if they exist (Firebase doesn't allow undefined)
                if (member.hellEffects && Object.keys(member.hellEffects).length > 0) {
                    memberState.hellEffects = { ...member.hellEffects };
                }
                
                // Only include permanent debuffs if they exist (Firebase doesn't allow undefined)  
                if (member.permanentDebuffs && member.permanentDebuffs.length > 0) {
                    memberState.permanentDebuffs = [...member.permanentDebuffs];
                }
                
                // Debug logging for save
                console.log(`[StoryManager] Saving ${member.id}:`, {
                    currentHP: memberState.currentHP,
                    maxHP: memberState.stats.hp,
                    hellEffects: memberState.hellEffects || 'none',
                    permanentDebuffs: memberState.permanentDebuffs ? memberState.permanentDebuffs.length : 0
                });
                
                acc[member.id] = memberState;
                return acc;
            }, {}) || null;

            const progressData = {
                currentStageIndex: this.storyProgress.currentStageIndex,
                completedStages: this.storyProgress.completedStages, // Save the highest index reached
                lastTeamState: teamStateToSave
            };

            await progressRef.set(progressData);
            console.log(`Saved progress for story ${this.storyId}:`, progressData);
        } catch (error) {
            console.error(`Error saving progress for story ${this.storyId}:`, error);
        }
    }

    getCurrentStageData() {
        if (!this.currentStory) {
            throw new Error('No story loaded');
        }
        
        const stage = this.currentStory.stages[this.currentStageIndex];
        if (!stage) {
            throw new Error('Invalid current stage index');
        }
        
        return {
            id: this.getStageId(this.currentStageIndex),
            name: stage.name,
            description: stage.description || 'No description available',
            difficulty: stage.difficulty || Math.floor(this.currentStageIndex / 2) + 1,
            boss: stage.boss || null,
            index: this.currentStageIndex,
            isCompleted: this.completedStages.includes(this.getStageId(this.currentStageIndex)),
            isActive: true,
            isLocked: false
        };
    }

    // --- NEW: Handle Choice Stage Completion ---
    async applyChoiceEffectAndAdvance(choice, targetCharacterId) {
        if (!this.currentStory) throw new Error('No story loaded');
        if (this.isStoryComplete()) return false; 

        const currentStageData = this.getCurrentStage();
        if (!currentStageData || (currentStageData.type !== 'choice' && currentStageData.type !== 'recruit')) { // Allow recruit type for UI flow
            console.error('Attempted to apply choice/recruit effect on an invalid stage type:', currentStageData?.type);
            // Don't throw error here, let UI handle closing etc.
             return false; 
        }

        const effect = choice.effect;
        console.log(`Applying choice '${choice.name}' effect:`, effect);

        try {
            // --- Handle effects targeting the whole team (no character selection needed) ---
            if (effect.target === 'all') {
                console.log(`Applying effect to all team members.`);
                let changesMade = false;
                switch (effect.type) {
                    case 'heal_percent':
                        this.playerTeam.forEach(member => {
                            if (member.currentHP > 0) { // Only heal living characters
                                const maxHP = member.stats?.hp ?? 1;
                                const healAmount = Math.floor(maxHP * (effect.amount_percent / 100));
                                member.currentHP = Math.min(maxHP, (member.currentHP || 0) + healAmount);
                                console.log(`Healed ${member.id} by ${effect.amount_percent}%, new HP: ${member.currentHP}`);
                                changesMade = true;
                            }
                        });
                        break;
                    case 'mana_restore':
                        if (effect.amount === 'full') {
                            this.playerTeam.forEach(member => {
                                if (member.currentHP > 0) { // Only affect living characters
                                    const maxMana = member.stats?.mana ?? 0;
                                    member.currentMana = maxMana;
                                    console.log(`Restored ${member.id}'s Mana to full: ${member.currentMana}`);
                                    changesMade = true;
                                }
                            });
                        } else {
                            // Handle specific amount mana restore if needed later
                            console.warn(`Mana restore amount '${effect.amount}' not implemented for target 'all'.`);
                        }
                        break;
                    case 'mana_restore_percent':
                        this.playerTeam.forEach(member => {
                            if (member.currentHP > 0) { // Only affect living characters
                                const maxMana = member.stats?.mana ?? 0;
                                const restoreAmount = Math.floor(maxMana * (effect.amount_percent / 100));
                                member.currentMana = Math.min(maxMana, (member.currentMana || 0) + restoreAmount);
                                console.log(`Restored ${member.id}'s Mana by ${restoreAmount} (${effect.amount_percent}% of max). New Mana: ${member.currentMana}/${maxMana}`);
                                changesMade = true;
                            }
                        });
                        break;
                    // --- NEW: Sacrifice effects for 'all' target ---
                    case 'sacrifice_hp_for_mana':
                        this.playerTeam.forEach(member => {
                            if (member.currentHP > 0) { // Only affect living characters
                                const hpLoss = Math.floor(member.currentHP * (effect.hp_percent / 100));
                                member.currentHP = Math.max(1, member.currentHP - hpLoss); // Don't let HP go to 0
                                member.currentMana = member.stats?.mana ?? 0; // Restore mana to full
                                console.log(`Sacrifice for Mana: ${member.id} lost ${hpLoss} HP (${effect.hp_percent}%) and restored mana to full (${member.currentMana})`);
                                changesMade = true;
                            }
                        });
                        break;
                    case 'sacrifice_defense_for_power':
                        this.playerTeam.forEach(member => {
                            if (member.currentHP > 0) { // Only affect living characters
                                // Reduce defenses
                                member.stats.armor = Math.max(0, (member.stats.armor || 0) - effect.defense_reduction);
                                member.stats.magicalShield = Math.max(0, (member.stats.magicalShield || 0) - effect.defense_reduction);
                                // Boost damage
                                member.stats.physicalDamage = (member.stats.physicalDamage || 0) + effect.damage_boost;
                                member.stats.magicalDamage = (member.stats.magicalDamage || 0) + effect.damage_boost;
                                console.log(`Sacrifice for Power: ${member.id} lost ${effect.defense_reduction} armor/shield, gained ${effect.damage_boost} damage`);
                                changesMade = true;
                            }
                        });
                        break;
                    // --- END NEW ---
                    // Add other 'all' target effects here if needed
                    case 'heal_and_mana_restore_all_full':
                        this.playerTeam.forEach(member => {
                            if (member.currentHP > 0) { // Only affect living characters
                                const maxHP = member.stats?.hp ?? 1;
                                const maxMana = member.stats?.mana ?? 0;
                                member.currentHP = maxHP;
                                member.currentMana = maxMana;
                                console.log(`Fully restored ${member.id}: HP ${member.currentHP}/${maxHP}, Mana ${member.currentMana}/${maxMana}`);
                                changesMade = true;
                            }
                        });
                        // Show popup notification
                        if (window.storyUI && window.storyUI.showPopupMessage) {
                            window.storyUI.showPopupMessage('✨ All team members have been fully restored! HP and Mana are at maximum.', 'success', 4000);
                        }
                        break;
                    default:
                        console.warn(`Unknown effect type for target 'all': ${effect.type}`);
                        break;
                }
                if (!changesMade) {
                     console.log("Effect targeted 'all' but no applicable changes were made.");
                     // Optionally skip advancement if nothing happened?
                     // For now, we still advance the stage.
                }
            } 
            // --- Handle effects targeting the team (summon ally) ---
            else if (effect.target === 'team') {
                console.log(`Applying effect to team.`);
                switch (effect.type) {
                    case 'summon_random_ally':
                        // Get available allies
                        const availableAllies = await this.getAllUnlockedCharacters();
                        
                        if (!availableAllies || availableAllies.length === 0) {
                            console.log('No allies available for summoning');
                            // Show popup notification
                            if (window.storyUI && window.storyUI.showPopupMessage) {
                                window.storyUI.showPopupMessage('🚫 No allies available for summoning. All champions are already in your team.', 'warning', 4000);
                            }
                        } else {
                            // Randomly select an ally
                            const randomAlly = availableAllies[Math.floor(Math.random() * availableAllies.length)];
                            
                            // Add the ally to the team
                            await this.addSelectedAlly(randomAlly.id);
                            
                            console.log(`Summoned random ally: ${randomAlly.name || randomAlly.id}`);
                            // Show popup notification
                            if (window.storyUI && window.storyUI.showPopupMessage) {
                                window.storyUI.showPopupMessage(`🔥 ${randomAlly.name || randomAlly.id} has been summoned to aid your journey!`, 'success', 4000);
                            }
                        }
                        break;
                    default:
                        console.warn(`Unknown effect type for target 'team': ${effect.type}`);
                        break;
                }
            }
            // --- Handle effects targeting a selected character ---
            else if (effect.target === 'selected' || effect.target === 'selected_living' || effect.target === 'selected_dead') {
                if (!targetCharacterId) {
                    console.error("Target character ID is required for 'selected' effects but was not provided.");
                    return false; // Stop if target is needed but missing
                }
                
                const targetCharacterIndex = this.playerTeam.findIndex(c => c.id === targetCharacterId);
                if (targetCharacterIndex === -1) {
                    console.error(`Target character ID ${targetCharacterId} not found in player team.`);
                    return false;
                }
                let character = this.playerTeam[targetCharacterIndex];
                console.log(`Applying effect to selected character ${character.name || character.id}.`);
                
                // Check if target type matches character state (living/dead)
                if (effect.target === 'selected_living' && character.currentHP <= 0) {
                    console.warn(`Choice target is 'selected_living' but character ${character.id} is dead. Skipping effect.`);
                    // Don't apply effect, but still advance stage?
                    // For now, we advance.
                } else if (effect.target === 'selected_dead' && character.currentHP > 0) {
                    console.warn(`Choice target is 'selected_dead' but character ${character.id} is alive. Skipping effect.`);
                    // Don't apply effect, but still advance stage?
                    // For now, we advance.
                } else {
                    // Apply the effect
                    switch (effect.type) {
                        case 'heal':
                            if (effect.amount === 'full') {
                                character.currentHP = character.stats.hp; // Heal to max HP based on current stats.hp
                                console.log(`Healed ${character.id} to full HP: ${character.currentHP}`);
                                // Show popup notification
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    window.storyUI.showPopupMessage(`❤️ ${character.name || character.id} has been fully healed! (${character.currentHP}/${character.stats.hp})`, 'success', 3000);
                                }
                            } else {
                                const maxHP = character.stats?.hp ?? character.currentHP ?? 0;
                                character.currentHP = Math.min(maxHP, (character.currentHP || 0) + effect.amount);
                                console.log(`Healed ${character.id} by ${effect.amount}, new HP: ${character.currentHP}`);
                                // Show popup notification
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    window.storyUI.showPopupMessage(`❤️ ${character.name || character.id} recovered ${effect.amount} HP! (${character.currentHP}/${maxHP})`, 'success', 3000);
                                }
                            }
                            break;
                        case 'mana_restore':
                            if (effect.amount === 'full') {
                                const maxMana = character.stats?.mana ?? 0;
                                character.currentMana = maxMana;
                                console.log(`Restored ${character.id}'s Mana to full: ${character.currentMana}`);
                                // Show popup notification
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    window.storyUI.showPopupMessage(`💙 ${character.name || character.id}'s mana has been restored to full! (${character.currentMana}/${maxMana})`, 'success', 3000);
                                }
                            } else {
                                // Handle specific amount mana restore
                                const restoreAmount = effect.amount || 0;
                                const maxMana = character.stats?.mana ?? character.currentMana ?? 0;
                                character.currentMana = Math.min(maxMana, (character.currentMana || 0) + restoreAmount);
                                console.log(`Restored ${character.id}'s Mana by ${restoreAmount}, new Mana: ${character.currentMana}`);
                                // Show popup notification
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    window.storyUI.showPopupMessage(`💙 ${character.name || character.id} recovered ${restoreAmount} mana! (${character.currentMana}/${maxMana})`, 'success', 3000);
                                }
                            }
                            break;
                        case 'mana_restore_percent':
                            if (character.stats) {
                                const maxMana = character.stats.mana ?? character.currentMana ?? 0;
                                const restoreAmount = Math.floor(maxMana * (effect.amount_percent / 100));
                                character.currentMana = Math.min(maxMana, (character.currentMana || 0) + restoreAmount);
                                console.log(`Restored ${character.id}'s Mana by ${restoreAmount} (${effect.amount_percent}% of max). New Mana: ${character.currentMana}/${maxMana}`);
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    window.storyUI.showPopupMessage(`💙 ${character.name || character.id} recovered ${restoreAmount} mana! (${character.currentMana}/${maxMana})`, 'success', 3000);
                                }
                            } else {
                                console.warn(`Cannot apply mana_restore_percent: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'stat_boost':
                            let statName = effect.stat;
                            // Remap 'hpRegen' from the choice effect to 'hpPerTurn' on the character stats
                            if (statName === 'hpRegen') {
                                statName = 'hpPerTurn';
                            }
                            
                            // Initialize hpPerTurn if it doesn't exist
                            if (statName === 'hpPerTurn' && character.stats[statName] === undefined) {
                                character.stats[statName] = 0; 
                            }
                            
                            if (character.stats && character.stats[statName] !== undefined) {
                                const boostAmount = effect.amount;
                                character.stats[statName] = (character.stats[statName] || 0) + boostAmount;
                                console.log(`Boosted ${character.id}'s ${statName} (from effect stat: ${effect.stat}) by ${boostAmount} to ${character.stats[statName]}`);
                                
                                // Show popup notification
                                if (window.storyUI && window.storyUI.showPopupMessage) {
                                    const displayStat = effect.stat === 'hpRegen' ? 'HP regeneration' : statName;
                                    window.storyUI.showPopupMessage(`⚡ ${character.name || character.id}'s ${displayStat} increased by ${boostAmount}! (Now: ${character.stats[statName]})`, 'success', 3000);
                                }
                                
                                // Adjust current HP/Mana if max was boosted
                                if (statName === 'hp') { // Use the potentially remapped statName here
                                    character.currentHP = Math.min(character.stats.hp, (character.currentHP || 0) + boostAmount);
                                } else if (statName === 'mana') { // And here
                                    character.currentMana = Math.min(character.stats.mana, (character.currentMana || 0) + boostAmount);
                                }
                            } else {
                                console.warn(`Stat ${statName} (from effect stat: ${effect.stat}) not found or undefined on character ${character.id}. Stats:`, character.stats);
                            }
                            break;
                        case 'stat_boost_percent':
                            console.log(`[DEBUG] Applying stat_boost_percent to ${character.id}`);
                            const baseStats = await this.getBaseStats(character.id);
                            if (!baseStats) {
                                console.error(`[DEBUG] Could not retrieve base stats for ${character.id}. Cannot apply boost.`);
                                throw new Error(`Could not retrieve base stats for ${character.id}`);
                            }
                            console.log(`[DEBUG] Base stats for ${character.id}:`, JSON.parse(JSON.stringify(baseStats))); 

                            const boostMultiplier = 1 + (effect.amount / 100);
                            console.log(`[DEBUG] Boost multiplier: ${boostMultiplier}`);
                            console.log(`[DEBUG] Stats BEFORE boost for ${character.id}:`, JSON.parse(JSON.stringify(character.stats)));

                            const oldMaxHp = character.stats.hp;
                            const oldMaxMana = character.stats.mana;
                            
                            // --- Handle single stat, 'all', or array of stats --- 
                            let statsToBoost = [];
                            if (effect.stat === 'all') {
                                console.log(`[DEBUG] Boosting ALL stats.`);
                                statsToBoost = Object.keys(character.stats).filter(stat => 
                                    typeof character.stats[stat] === 'number' && 
                                    stat !== 'currentHP' && 
                                    stat !== 'currentMana' && 
                                    baseStats[stat] !== undefined
                                );
                            } else if (Array.isArray(effect.stat)) {
                                console.log(`[DEBUG] Boosting multiple specific stats:`, effect.stat);
                                statsToBoost = effect.stat.filter(stat => 
                                    character.stats[stat] !== undefined && 
                                    baseStats[stat] !== undefined
                                );
                            } else if (typeof effect.stat === 'string' && character.stats[effect.stat] !== undefined && baseStats[effect.stat] !== undefined) {
                                console.log(`[DEBUG] Boosting single specific stat: ${effect.stat}`);
                                statsToBoost = [effect.stat];
                            } else {
                                console.warn(`[DEBUG] Invalid or missing stat(s) specified for boost:`, effect.stat);
                            }
                            // --- End Stat Handling --- 
                            
                            // --- Apply boost to determined stats --- 
                            statsToBoost.forEach(stat => {
                                const baseValue = baseStats[stat];
                                const newStatValue = Math.round(baseValue * boostMultiplier);
                                console.log(`[DEBUG] Boosting ${stat}: Base=${baseValue}, New=${newStatValue}`);
                                character.stats[stat] = newStatValue; // Update live stat
                                
                                // Special handling for HP - also update maxHp for raid game compatibility
                                if (stat === 'hp') {
                                    character.stats.maxHp = newStatValue;
                                    console.log(`[DEBUG] Also set maxHp to ${newStatValue} for raid game compatibility`);
                                }
                                // Special handling for mana - also update maxMana for raid game compatibility
                                if (stat === 'mana') {
                                    character.stats.maxMana = newStatValue;
                                    console.log(`[DEBUG] Also set maxMana to ${newStatValue} for raid game compatibility`);
                                }
                            });
                            // --- End Apply Boost --- 

                            console.log(`[DEBUG] Stats AFTER boost for ${character.id}:`, JSON.parse(JSON.stringify(character.stats)));
                            console.log(`Recalculated stats for ${character.id} after % base stat boost. New Max HP: ${character.stats.hp}, New Max Mana: ${character.stats.mana}`);
                            
                            // Adjust current HP/Mana based on Max increase
                            const hpIncrease = character.stats.hp - oldMaxHp;
                            const manaIncrease = character.stats.mana - oldMaxMana;
                            if (hpIncrease > 0) {
                                character.currentHP = Math.min(character.stats.hp, (character.currentHP || 0) + hpIncrease);
                            }
                            if (manaIncrease > 0) {
                                character.currentMana = Math.min(character.stats.mana, (character.currentMana || 0) + manaIncrease);
                            }
                            break;
                        case 'revive':
                            if (character.currentHP <= 0) { 
                                const revivePercent = effect.amount_percent || 50; 
                                const maxHP = character.stats?.hp ?? 1;
                                character.currentHP = Math.max(1, Math.floor(maxHP * (revivePercent / 100)));
                                console.log(`Revived ${character.id} to ${revivePercent}% HP: ${character.currentHP}`);
                            } else {
                                console.warn(`Attempted to revive living character ${character.id}`);
                            }
                            break;
                        case 'risky_medicine':
                            const chance = Math.random();
                            if (chance < 0.5) { 
                                character.currentHP = 0;
                                console.log(`Risky Medicine backfired! ${character.id} was defeated.`);
                            } else { 
                                const oldMaxHp = character.stats.hp;
                                const newMaxHp = oldMaxHp * 2;
                                character.stats.hp = newMaxHp;
                                character.stats.maxHp = newMaxHp; // Also set maxHp for raid game compatibility
                                character.currentHP = newMaxHp; // For story system compatibility
                                console.log(`Risky Medicine worked! ${character.id}'s Max HP doubled to ${newMaxHp} and fully healed.`);
                            }
                            break;
                        // --- NEW: Handle Pocket of Weed --- 
                        case 'pocket_of_weed_effect':
                            if (character.stats) {
                                // Double damages
                                character.stats.physicalDamage = (character.stats.physicalDamage || 0) * 2;
                                character.stats.magicalDamage = (character.stats.magicalDamage || 0) * 2;
                                // Set defenses to 0
                                character.stats.armor = 0;
                                character.stats.magicalShield = 0;
                                console.log(`Applied Pocket of Weed to ${character.id}. New Phys Dmg: ${character.stats.physicalDamage}, New Mag Dmg: ${character.stats.magicalDamage}, Armor/MR: 0`);
                            } else {
                                console.warn(`Cannot apply Pocket of Weed: Stats object missing for ${character.id}`);
                            }
                            break;
                        // --- END NEW --- 

                        // --- NEW: Handle combined effects --- 
                        case 'heal_and_mana_restore':
                            if (character.stats) {
                                const maxHP = character.stats.hp ?? character.currentHP ?? 0;
                                const maxMana = character.stats.mana ?? character.currentMana ?? 0;
                                const hpAmount = effect.amount?.hp || 0;
                                const manaAmount = effect.amount?.mana || 0;
                                
                                character.currentHP = Math.min(maxHP, (character.currentHP || 0) + hpAmount);
                                character.currentMana = Math.min(maxMana, (character.currentMana || 0) + manaAmount);
                                console.log(`Applied Water Bottle to ${character.id}. Restored ${hpAmount} HP (now ${character.currentHP}) and ${manaAmount} Mana (now ${character.currentMana}).`);
                            } else {
                                console.warn(`Cannot apply Water Bottle: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'mana_restore_and_stat_boost':
                            if (character.stats) {
                                // Restore mana to full
                                character.currentMana = character.stats.mana ?? 0;
                                
                                // Boost stat
                                const statToBoost = effect.amount?.stat;
                                const boostValue = effect.amount?.value || 0;
                                if (statToBoost && character.stats[statToBoost] !== undefined) {
                                    character.stats[statToBoost] = (character.stats[statToBoost] || 0) + boostValue;
                                    console.log(`Applied Magical Ring to ${character.id}. Mana restored to full (${character.currentMana}). Boosted ${statToBoost} by ${boostValue} (now ${character.stats[statToBoost]}).`);
                                } else {
                                    console.warn(`Cannot apply Magical Ring stat boost: Stat ${statToBoost} invalid or boost value missing.`);
                                    console.log(`Applied Magical Ring to ${character.id}. Mana restored to full (${character.currentMana}). Stat boost skipped.`);
                                }
                            } else {
                                console.warn(`Cannot apply Magical Ring: Stats object missing for ${character.id}`);
                            }
                            break;
                        // --- END NEW --- 

                        // --- NEW: Handle missing percentage restore effects ---
                        case 'heal_missing_percent':
                            if (character.stats) {
                                const maxHP = character.stats.hp ?? character.currentHP ?? 0;
                                const currentHP = character.currentHP || 0;
                                const missingHP = Math.max(0, maxHP - currentHP);
                                const healAmount = Math.floor(missingHP * (effect.amount_percent / 100));
                                character.currentHP = Math.min(maxHP, currentHP + healAmount);
                                console.log(`Applied healing potion to ${character.id}. Restored ${healAmount} HP (${effect.amount_percent}% of missing ${missingHP}). New HP: ${character.currentHP}/${maxHP}`);
                            } else {
                                console.warn(`Cannot apply healing potion: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'mana_restore_missing_percent':
                            if (character.stats) {
                                const maxMana = character.stats.mana ?? character.currentMana ?? 0;
                                const currentMana = character.currentMana || 0;
                                const missingMana = Math.max(0, maxMana - currentMana);
                                const restoreAmount = Math.floor(missingMana * (effect.amount_percent / 100));
                                character.currentMana = Math.min(maxMana, currentMana + restoreAmount);
                                console.log(`Applied mana potion to ${character.id}. Restored ${restoreAmount} Mana (${effect.amount_percent}% of missing ${missingMana}). New Mana: ${character.currentMana}/${maxMana}`);
                            } else {
                                console.warn(`Cannot apply mana potion: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'heal_and_mana_restore_missing_percent':
                            if (character.stats) {
                                const maxHP = character.stats.hp ?? character.currentHP ?? 0;
                                const currentHP = character.currentHP || 0;
                                const missingHP = Math.max(0, maxHP - currentHP);
                                const healAmount = Math.floor(missingHP * (effect.amount_percent / 100));
                                
                                const maxMana = character.stats.mana ?? character.currentMana ?? 0;
                                const currentMana = character.currentMana || 0;
                                const missingMana = Math.max(0, maxMana - currentMana);
                                const restoreAmount = Math.floor(missingMana * (effect.amount_percent / 100));
                                
                                character.currentHP = Math.min(maxHP, currentHP + healAmount);
                                character.currentMana = Math.min(maxMana, currentMana + restoreAmount);
                                console.log(`Applied both potions to ${character.id}. Restored ${healAmount} HP (${effect.amount_percent}% of missing ${missingHP}) and ${restoreAmount} Mana (${effect.amount_percent}% of missing ${missingMana}). New HP: ${character.currentHP}/${maxHP}, New Mana: ${character.currentMana}/${maxMana}`);
                            } else {
                                console.warn(`Cannot apply potions: Stats object missing for ${character.id}`);
                            }
                            break;
                        // --- NEW: Hell story effects ---
                        case 'set_magical_damage':
                            if (character.stats) {
                                character.stats.magicalDamage = effect.amount;
                                console.log(`Lava Sample: Set ${character.id}'s magical damage to exactly ${effect.amount}.`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.lava_sample = true;
                                character.hellEffects.choiceId = choice.name; // Track which choice was made
                                character.hellEffects.choiceEffect = 'set_magical_damage'; // Track effect type
                            } else {
                                console.warn(`Cannot apply Lava Sample: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'demon_claws_effect':
                            if (character.stats) {
                                // Increase physical damage by 80
                                character.stats.physicalDamage = (character.stats.physicalDamage || 0) + 80;
                                // Set dodge chance to 0
                                character.stats.dodgeChance = 0;
                                console.log(`Demon Claws: Increased ${character.id}'s physical damage by 80 and set dodge chance to 0. New Phys Dmg: ${character.stats.physicalDamage}`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.demon_claws = true;
                                character.hellEffects.choiceId = choice.name; // Track which choice was made
                                character.hellEffects.choiceEffect = 'demon_claws_effect'; // Track effect type
                            } else {
                                console.warn(`Cannot apply Demon Claws: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'hellish_pact_effect':
                            if (character.stats) {
                                // Increase HP by 2000
                                const oldMaxHp = character.stats.hp;
                                const oldCurrentHp = character.currentHP || character.stats.hp;
                                
                                character.stats.hp = oldMaxHp + 2000;
                                character.stats.maxHp = oldMaxHp + 2000; // Also set maxHp for raid game compatibility
                                character.currentHP = oldCurrentHp + 2000;
                                
                                console.log(`Hellish Pact: Increased ${character.id}'s Max HP by 2000 (${oldMaxHp} -> ${character.stats.hp}), Current HP by 2000 (${oldCurrentHp} -> ${character.currentHP})`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.hellish_pact = true;
                                character.hellEffects.choiceId = choice.name; // Track which choice was made
                                character.hellEffects.choiceEffect = 'hellish_pact_effect'; // Track effect type
                                
                                // Mark as applied to prevent double application in stage manager
                                character._hellishPactApplied = true;
                                
                                // Apply the hellish pact debuff that will be processed during battles
                                // We'll store this in the character's permanent effects
                                if (!character.permanentDebuffs) character.permanentDebuffs = [];
                                
                                // Create the hellish pact debuff (without function serialization)
                                const hellishPactDebuff = {
                                    id: 'hellish_pact_curse',
                                    name: 'Hellish Pact Curse',
                                    description: 'Takes 75 damage at the start of each turn due to a dark pact.',
                                    duration: -1, // Permanent
                                    effect: {
                                        type: 'damage_over_time',
                                        value: 75
                                    },
                                    // Store effect type instead of function for serialization
                                    effectType: 'hellish_pact_dot'
                                };
                                
                                // Add to permanent debuffs that will be applied when character enters battle
                                character.permanentDebuffs.push(hellishPactDebuff);
                                console.log(`Hellish Pact: Added permanent debuff to ${character.id}. Debuffs count: ${character.permanentDebuffs.length}`);
                            } else {
                                console.warn(`Cannot apply Hellish Pact: Stats object missing for ${character.id}`);
                            }
                            break;
                        // --- NEW: Molten Weapons Effects ---
                        case 'molten_hammer_effect':
                            if (character.stats) {
                                // Increase physical damage by 200
                                character.stats.physicalDamage = (character.stats.physicalDamage || 0) + 200;
                                console.log(`Molten Hammer: Increased ${character.id}'s physical damage by 200. New Phys Dmg: ${character.stats.physicalDamage}`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.molten_hammer = true;
                                character.hellEffects.choiceId = choice.name;
                                character.hellEffects.choiceEffect = 'molten_hammer_effect';
                            } else {
                                console.warn(`Cannot apply Molten Hammer: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'molten_scythe_effect':
                            if (character.stats) {
                                console.log(`Molten Scythe: Applied growing power effect to ${character.id}. All stats will increase by 1% each turn.`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.molten_scythe = true;
                                character.hellEffects.choiceId = choice.name;
                                character.hellEffects.choiceEffect = 'molten_scythe_effect';
                                
                                // Apply the molten scythe buff that will be processed during battles
                                if (!character.permanentBuffs) character.permanentBuffs = [];
                                
                                // Create the molten scythe buff
                                const moltenScytheBuff = {
                                    id: 'molten_scythe_growth',
                                    name: 'Molten Scythe Power',
                                    description: 'All stats increase by 1% each turn due to the cursed scythe.',
                                    duration: -1, // Permanent
                                    effect: {
                                        type: 'stat_growth_per_turn',
                                        value: 0.01 // 1%
                                    },
                                    effectType: 'molten_scythe_growth'
                                };
                                
                                character.permanentBuffs.push(moltenScytheBuff);
                                console.log(`Molten Scythe: Added permanent buff to ${character.id}. Buffs count: ${character.permanentBuffs.length}`);
                            } else {
                                console.warn(`Cannot apply Molten Scythe: Stats object missing for ${character.id}`);
                            }
                            break;
                        case 'molten_spear_effect':
                            if (character.stats) {
                                // Increase dodge chance by 18%
                                character.stats.dodgeChance = (character.stats.dodgeChance || 0) + 18;
                                console.log(`Molten Spear: Increased ${character.id}'s dodge chance by 18%. New Dodge Chance: ${character.stats.dodgeChance}%`);
                                
                                // Mark this character as having received this effect for Firebase tracking
                                if (!character.hellEffects) character.hellEffects = {};
                                character.hellEffects.molten_spear = true;
                                character.hellEffects.choiceId = choice.name;
                                character.hellEffects.choiceEffect = 'molten_spear_effect';
                            } else {
                                console.warn(`Cannot apply Molten Spear: Stats object missing for ${character.id}`);
                            }
                            break;
                        // --- END NEW ---
                        
                        // --- NEW: Sacrifice for Life effect ---
                        case 'sacrifice_character_for_restoration':
                            // Kill the selected character
                            character.currentHP = 0;
                            console.log(`Sacrifice for Life: ${character.id} was sacrificed`);
                            
                            // Restore all other living characters to full HP and mana
                            this.playerTeam.forEach(member => {
                                if (member.id !== character.id && member.currentHP > 0) {
                                    member.currentHP = member.stats?.hp ?? member.currentHP;
                                    member.currentMana = member.stats?.mana ?? member.currentMana;
                                    console.log(`Sacrifice for Life: Restored ${member.id} to full HP (${member.currentHP}) and mana (${member.currentMana})`);
                                }
                            });
                            break;
                        // --- END NEW ---
                        
                        case 'none':
                            console.log(`No effect applied to ${character.id} - choice declined.`);
                            break;

                        // --- END NEW ---

                        default:
                            console.warn(`Unknown choice effect type: ${effect.type}`);
                            break;
                    }
                    
                    // Update the character in the playerTeam array
                    this.playerTeam[targetCharacterIndex] = character;
                }
            } else {
                 console.warn(`Unknown or unsupported effect target type: ${effect.target}`);
            }

            // --- Common Logic after applying effect (or skipping) ---
            
                            // Update lastTeamState for saving (reflects changes from effects)
            this.storyProgress.lastTeamState = this.playerTeam.reduce((acc, member) => {
                const memberState = { 
                     currentHP: member.currentHP, 
                     currentMana: member.currentMana,
                     stats: { ...member.stats }
                 };
                 
                 // Only include hell effects if they exist (Firebase doesn't allow undefined)
                 if (member.hellEffects && Object.keys(member.hellEffects).length > 0) {
                     memberState.hellEffects = { ...member.hellEffects };
                 }
                 
                 // Only include permanent debuffs if they exist (Firebase doesn't allow undefined)
                 if (member.permanentDebuffs && member.permanentDebuffs.length > 0) {
                     memberState.permanentDebuffs = [...member.permanentDebuffs];
                 }
                 
                 // Only include permanent buffs if they exist (Firebase doesn't allow undefined)
                 if (member.permanentBuffs && member.permanentBuffs.length > 0) {
                     memberState.permanentBuffs = [...member.permanentBuffs];
                 }
                 
                 // Debug logging for each character
                 console.log(`[StoryManager] Saving state for ${member.id}:`, {
                     currentHP: memberState.currentHP,
                     maxHP: memberState.stats.hp,
                     hellEffects: memberState.hellEffects || 'none',
                     permanentDebuffs: memberState.permanentDebuffs ? memberState.permanentDebuffs.length : 0,
                     permanentBuffs: memberState.permanentBuffs ? memberState.permanentBuffs.length : 0
                 });
                 
                 acc[member.id] = memberState;
                 return acc;
            }, {});

            // Advance stage progression
            this.storyProgress.currentStageIndex++;
            this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex);

            // Save progress (which now includes the updated stats in lastTeamState)
            await this.saveStoryProgress();
            console.log(`[StoryManager] Processed choice/recruit, advanced to stage ${this.storyProgress.currentStageIndex}, and saved progress.`);

            const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

            // Call event handler if defined
            if (this.onStageCompleted) {
                const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1);
                this.onStageCompleted(completedStageId, [], hasMoreStages); 
            }

            return hasMoreStages;

        } catch (error) {
            console.error(`Error applying choice effect: ${error}`);
            return false;
        }
    }
    // --- END NEW ---

    /**
     * Helper to get base stats for a character from the registry.
     * Needs loadCharacterRegistry to have run first.
     */
    async getBaseStats(characterId) {
        // NEW LOGIC: Fetch full character data
        try {
            const response = await fetch(`js/raid-game/characters/${characterId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load base stats data for character ${characterId}`);
            }
            const characterData = await response.json();
            return characterData.stats; // Return the stats object from the full data
        } catch (error) {
            console.error(`Error getting base stats for ${characterId}:`, error);
            return null; // Return null if fetching fails
        }
    }

    /**
     * Check if the current story is completed.
     * @returns {boolean} True if the story is complete, false otherwise.
     */
    isStoryComplete() {
        if (!this.currentStory) {
            return false; // No story loaded, not complete
        }
        // Story is complete if the current index is >= total stages
        return this.storyProgress.currentStageIndex >= this.currentStory.stages.length;
    }

    getTotalStages() {
        return this.currentStory ? this.currentStory.stages.length : 0;
    }

    /**
     * Gets a list of all unlocked characters for ally selection.
     * @returns {Promise<Array<Object>>} - A promise that resolves with an array of unlocked character objects.
     */
    async getAllUnlockedCharacters() {
        console.log('[StoryManager] Getting all unlocked characters for ally selection');
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Ensure character registry is loaded
            await this.loadCharacterRegistry();
            if (Object.keys(this.characterRegistry).length === 0) {
                throw new Error("Character registry is empty.");
            }

            // Get current team IDs to filter out
            const currentTeamIds = new Set(this.playerTeam.map(c => c.id));
            console.log('[StoryManager] Current team IDs:', Array.from(currentTeamIds));

            // Fetch from both Firebase folders
            const [unlockedSnapshot, ownedSnapshot] = await Promise.all([
                firebase.database().ref(`users/${user.uid}/UnlockedRAIDCharacters`).once('value'),
                firebase.database().ref(`users/${user.uid}/ownedCharacters`).once('value')
            ]);

            let ownedCharacterIds = [];
            
            // Add the 3 free starter characters that everyone has
            const freeStarterCharacters = ['farmer_cham_cham', 'schoolboy_shoma', 'renée'];
            ownedCharacterIds = [...ownedCharacterIds, ...freeStarterCharacters];
            console.log('[StoryManager] Added free starter characters:', freeStarterCharacters);
            
            // Get from UnlockedRAIDCharacters
            if (unlockedSnapshot.exists()) {
                const unlockedData = unlockedSnapshot.val();
                ownedCharacterIds = [...ownedCharacterIds, ...Object.keys(unlockedData)];
                console.log('[StoryManager] Characters from UnlockedRAIDCharacters:', Object.keys(unlockedData));
            }
            
            // Get from ownedCharacters
            if (ownedSnapshot.exists()) {
                const ownedData = ownedSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedCharacterIds = [...ownedCharacterIds, ...ownedData];
                } else if (typeof ownedData === 'object') {
                    ownedCharacterIds = [...ownedCharacterIds, ...Object.keys(ownedData)];
                }
                console.log('[StoryManager] Characters from ownedCharacters:', ownedData);
            }

            // Remove duplicates and filter out current team members
            ownedCharacterIds = [...new Set(ownedCharacterIds)].filter(id => !currentTeamIds.has(id));
            console.log('[StoryManager] Available character IDs (excluding team):', ownedCharacterIds);

            // Filter to only include characters that exist in the registry
            const availableCharacters = ownedCharacterIds.filter(id => {
                const exists = this.characterRegistry[id] !== undefined;
                if (!exists) {
                    console.warn(`[StoryManager] Character ${id} not found in registry, excluding`);
                }
                return exists;
            });

            console.log('[StoryManager] Final available characters:', availableCharacters);

            // Randomly shuffle and select only 3 characters for the ally selection
            const shuffledCharacters = availableCharacters.sort(() => 0.5 - Math.random());
            const selectedCharacters = shuffledCharacters.slice(0, 3); // Limit to 3 characters
            
            console.log('[StoryManager] Selected 3 random characters for ally selection:', selectedCharacters);

            // Load full data for the selected characters
            const characterDataPromises = selectedCharacters.map(async (id) => {
                const registryEntry = this.characterRegistry[id];
                const baseStats = await this.getBaseStats(id);
                return {
                    id: id,
                    name: registryEntry?.name || id,
                    image: registryEntry?.image || 'images/characters/default.png',
                    avatarImage: registryEntry?.image || 'images/characters/default.png',
                    description: registryEntry?.description || 'No description available',
                    tags: registryEntry?.tags || [],
                    stats: baseStats
                };
            });

            const characterDetails = await Promise.all(characterDataPromises);
            console.log('[StoryManager] Returning 3 unlocked character details:', characterDetails);
            return characterDetails;

        } catch (error) {
            console.error("[StoryManager] Error getting unlocked characters:", error);
            return [];
        }
    }

    /**
     * Adds a selected ally to the team.
     * @param {string} characterId - The ID of the character to add.
     * @returns {Promise<boolean>} - True if there are more stages, false if the story is complete.
     */
    async addSelectedAlly(characterId) {
        console.log(`[StoryManager] Adding selected ally: ${characterId}`);
        
        try {
            // Ensure character registry is loaded
            await this.loadCharacterRegistry();
            
            const registryEntry = this.characterRegistry[characterId];
            if (!registryEntry) {
                throw new Error(`Character ${characterId} not found in registry`);
            }

            // Load the character's base stats
            const baseStats = await this.getBaseStats(characterId);

            // Create the new team member with full stats
            const newMember = {
                id: characterId,
                name: registryEntry.name,
                image: registryEntry.image,
                currentHP: baseStats.hp,
                currentMana: baseStats.mana,
                stats: { ...baseStats }
            };

            console.log(`[StoryManager] Created new ally member:`, newMember);

            // Add to player team
            this.playerTeam.push(newMember);
            console.log(`[StoryManager] Team after adding ally:`, this.playerTeam.map(m => ({ id: m.id, name: m.name })));

            // Update lastTeamState for saving
            this.storyProgress.lastTeamState = this.playerTeam.reduce((acc, member) => {
                const memberState = { 
                    currentHP: member.currentHP, 
                    currentMana: member.currentMana,
                    stats: { ...member.stats }
                };
                
                // Include hell effects if they exist
                if (member.hellEffects && Object.keys(member.hellEffects).length > 0) {
                    memberState.hellEffects = { ...member.hellEffects };
                }
                
                // Include permanent debuffs if they exist
                if (member.permanentDebuffs && member.permanentDebuffs.length > 0) {
                    memberState.permanentDebuffs = [...member.permanentDebuffs];
                }
                
                acc[member.id] = memberState;
                return acc;
            }, {});

            // Advance to next stage
            this.storyProgress.currentStageIndex++;
            this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex);

            // Save progress
            await this.saveStoryProgress();
            console.log(`[StoryManager] Ally selection completed. Saved progress for stage ${this.storyProgress.currentStageIndex}`);

            const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

            // Trigger event handler
            if (this.onStageCompleted) {
                const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1);
                this.onStageCompleted(completedStageId, [], hasMoreStages);
            }

            console.log(`[StoryManager] Ally selection successful. More stages: ${hasMoreStages}`);
            return hasMoreStages;

        } catch (error) {
            console.error(`[StoryManager] Error adding selected ally ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Gets a list of character offers for a recruitment stage.
     * @param {Object} stageData - The data for the recruitment stage.
     * @returns {Promise<Array<Object>>} - A promise that resolves with an array of character offer objects.
     */
    async getRecruitmentOffers(stageData) {
        console.log(`[StoryManager] getRecruitmentOffers for stage: ${stageData.name}, tag: ${stageData.recruitTag}, count: ${stageData.recruitCount}`);
        console.log(`[StoryManager] Full stageData:`, stageData);
        console.log(`[StoryManager] stageData.specificCharacters:`, stageData.specificCharacters);
        console.log(`[StoryManager] Is specificCharacters an array?`, Array.isArray(stageData.specificCharacters));
        
        try {
            // Ensure character registry is loaded
            await this.loadCharacterRegistry();
            if (Object.keys(this.characterRegistry).length === 0) {
                throw new Error("Character registry is empty.");
            }

            const currentTeamIds = new Set(this.playerTeam.map(c => c.id));
            let potentialRecruits = [];

            // Check if specific characters are defined (for tutorial or special stages)
            if (stageData.specificCharacters && Array.isArray(stageData.specificCharacters)) {
                console.log(`[StoryManager] Using specific characters list:`, stageData.specificCharacters);
                console.log(`[StoryManager] Current team IDs:`, Array.from(currentTeamIds));
                console.log(`[StoryManager] Available character registry keys:`, Object.keys(this.characterRegistry));
                
                // Filter specific characters to exclude those already in team
                potentialRecruits = stageData.specificCharacters.filter(id => {
                    if (currentTeamIds.has(id)) {
                        console.log(`[StoryManager] Character ${id} already in team, excluding.`);
                        return false;
                    }
                    if (!this.characterRegistry[id]) {
                        console.warn(`[StoryManager] Character ${id} not found in registry, excluding.`);
                        console.warn(`[StoryManager] Available registry keys:`, Object.keys(this.characterRegistry));
                        return false;
                    }
                    console.log(`[StoryManager] Character ${id} is available for recruitment.`);
                    return true;
                });
            } else if (stageData.recruitTag && stageData.recruitCount > 0) {
                // Use original tag-based filtering for regular recruitment stages
                const allCharacterIds = Object.keys(this.characterRegistry);
                potentialRecruits = allCharacterIds.filter(id => {
                    // Check if not already in the team
                    if (currentTeamIds.has(id)) return false;

                    // Get the registry entry for this character
                    const registryEntry = this.characterRegistry[id];
                    if (!registryEntry) return false;

                    // Check if the character has tags defined
                    if (!registryEntry.tags || !Array.isArray(registryEntry.tags)) {
                        return false; 
                    }

                    // Check if the character's tags array includes the required recruitTag
                    const requiredTag = stageData.recruitTag;
                    return registryEntry.tags.includes(requiredTag);
                });

                // Shuffle the potential recruits for random selection
                potentialRecruits = potentialRecruits.sort(() => 0.5 - Math.random());
            } else {
                console.error("Invalid recruitment stage data: missing recruitTag/recruitCount or specificCharacters");
                return [];
            }

            console.log(`[StoryManager] Potential recruits found (${potentialRecruits.length}):`, potentialRecruits);

            // Take the required number of offers (or all if using specific characters)
            const maxOffers = stageData.recruitCount || potentialRecruits.length;
            const offers = potentialRecruits.slice(0, maxOffers);
            console.log(`[StoryManager] Selected offers (${offers.length}):`, offers);

            // If no offers available, return empty array
            if (offers.length === 0) {
                console.log(`[StoryManager] No recruitment offers available (all characters may already be recruited).`);
                return [];
            }

            // Load full data for the offers to return (name, image, etc.)
            const offerDataPromises = offers.map(async (id) => {
                const registryEntry = this.characterRegistry[id];
                // Fetch base stats for display
                const baseStats = await this.getBaseStats(id); 
                return {
                    id: id,
                    name: registryEntry?.name || id,
                    image: registryEntry?.image || 'images/characters/default.png',
                    avatarImage: registryEntry?.image || 'images/characters/default.png', // For UI consistency
                    stats: baseStats
                };
            });

            const offerDetails = await Promise.all(offerDataPromises);
            console.log(`[StoryManager] Returning recruitment offer details:`, offerDetails);
            return offerDetails;

        } catch (error) {
            console.error("[StoryManager] Error getting recruitment offers:", error);
            return [];
        }
    }

    /**
     * Adds a recruited character to the team, updates Firebase, and advances the stage.
     * @param {string} characterId - The ID of the character to recruit.
     * @returns {Promise<boolean>} - True if there are more stages, false if the story is complete.
     */
    async addRecruitedCharacter(characterId) {
        console.log(`[StoryManager] Attempting to recruit character: ${characterId}`);
        if (!this.userId || !this.storyId) {
            console.error("Cannot recruit character: Missing userId or story info.");
            throw new Error("User or story information is missing.");
        }
        if (this.isStoryComplete()) {
             console.warn("Cannot recruit character: Story is already complete.");
             return false;
        }

        try {
            // 1. Validate character ID and ensure registry is loaded
            await this.loadCharacterRegistry();
            if (!this.characterRegistry[characterId]) {
                throw new Error(`Character ID "${characterId}" not found in registry.`);
            }

            // 2. Load full character data for the new recruit
            const newCharacterData = await this.getBaseStats(characterId); // Reusing getBaseStats
            if (!newCharacterData) {
                 throw new Error(`Failed to load full data for recruited character ${characterId}`);
            }

            // 3. Create the character object for the team
            const newCharacter = {
                id: characterId,
                name: this.characterRegistry[characterId].name || characterId,
                avatarImage: this.characterRegistry[characterId].image || 'images/characters/default.png',
                stats: { ...newCharacterData }, // Use a copy of the base stats
                currentHP: newCharacterData.hp, // Start with full HP
                currentMana: newCharacterData.mana // Start with full Mana
            };
            console.log(`[StoryManager] New character object created:`, newCharacter);


            // 4. Add to the internal player team state
            this.playerTeam.push(newCharacter);
            console.log(`[StoryManager] Added ${characterId} to internal playerTeam.`);

            // 5. Update Firebase: currentTeamSelection
            const teamSelectionRef = firebaseDatabase.ref(`users/${this.userId}/currentTeamSelection`);
            const teamSnapshot = await teamSelectionRef.once('value');
            let currentTeamIds = teamSnapshot.exists() ? teamSnapshot.val() : [];
            if (!Array.isArray(currentTeamIds)) currentTeamIds = []; // Ensure it's an array
            if (!currentTeamIds.includes(characterId)) {
                currentTeamIds.push(characterId);
                await teamSelectionRef.set(currentTeamIds);
                console.log(`[StoryManager] Updated currentTeamSelection in Firebase.`);
            }

            // 6. Prepare updated lastTeamState for story progress
            // This ensures the newly added character's state is saved
            const updatedLastTeamState = this.playerTeam.reduce((acc, member) => {
                acc[member.id] = {
                    currentHP: member.currentHP,
                    currentMana: member.currentMana,
                    stats: { ...member.stats }
                };
                return acc;
            }, {});
            this.storyProgress.lastTeamState = updatedLastTeamState;
            console.log(`[StoryManager] Updated internal storyProgress.lastTeamState.`);


            // 7. Advance stage index
            this.storyProgress.currentStageIndex++;
            this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex);
            console.log(`[StoryManager] Advanced stage index to ${this.storyProgress.currentStageIndex}.`);

            // 8. Save updated story progress to Firebase
            await this.saveStoryProgress(); // Saves index and the updated lastTeamState

            const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

            // 9. Trigger event handler (treat recruitment like stage completion)
            if (this.onStageCompleted) {
                const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1); // Get ID of the recruit stage just finished
                this.onStageCompleted(completedStageId, [], hasMoreStages); // Pass empty rewards for recruit stages
            }

            console.log(`[StoryManager] Recruitment of ${characterId} successful. More stages: ${hasMoreStages}`);
            return hasMoreStages;

        } catch (error) {
            console.error(`[StoryManager] Error recruiting character ${characterId}:`, error);
            // Should we roll back changes? For now, just re-throw.
            throw error; // Re-throw the error for the UI layer to handle
        }
    }
}