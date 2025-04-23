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
            this.currentStory = this.allStoriesData.find(story => this.normalizeId(story.title) === storyId);
            if (!this.currentStory) {
                throw new Error(`[StoryManager] Story with ID '${storyId}' not found.`);
            }
            console.log("[StoryManager] Found current story:", this.currentStory.title);

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
                const response = await fetch(`js/raid-game/characters/${charId}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load data for character ${charId}`);
                }
                const characterData = await response.json();
                
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
        return str.toLowerCase().replace(/\s+/g, '_');
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
                 return {
                     ...teamMember,
                     stats: newStats, // Apply the saved stats object
                     currentHP: newCurrentHP,
                     currentMana: newCurrentMana
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
                 stats: { ...member.stats } 
             };
             return acc;
         }, {});

         console.log("Applied battle result state to playerTeam and storyProgress.lastTeamState.");
    }
    // --- END NEW ---

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
            // Ensure lastTeamState is saved as an object { charId: { currentHP, currentMana, stats } }
            const teamStateToSave = this.playerTeam.reduce((acc, member) => {
                acc[member.id] = {
                    currentHP: member.currentHP,
                    currentMana: member.currentMana,
                    // Include the full stats object to persist modifications
                    stats: { ...member.stats }
                };
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
        if (!currentStageData || currentStageData.type !== 'choice') {
            console.error('Attempted to apply choice effect on a non-choice stage.');
            return false;
        }

        const targetCharacterIndex = this.playerTeam.findIndex(c => c.id === targetCharacterId);
        if (targetCharacterIndex === -1) {
            console.error(`Target character ID ${targetCharacterId} not found in player team.`);
            return false;
        }

        let character = this.playerTeam[targetCharacterIndex];
        const effect = choice.effect;

        console.log(`Applying choice '${choice.name}' effect to character ${character.name || character.id}:`, effect);

        // Apply the effect
        try {
            switch (effect.type) {
                case 'heal':
                    if (effect.amount === 'full') {
                        character.currentHP = character.stats.hp; // Heal to max HP based on current stats.hp
                        console.log(`Healed ${character.id} to full HP: ${character.currentHP}`);
                    } else {
                        // Ensure stats.hp exists before trying to use it as the cap
                        const maxHP = character.stats && character.stats.hp ? character.stats.hp : character.currentHP;
                        character.currentHP = Math.min(maxHP, (character.currentHP || 0) + effect.amount);
                        console.log(`Healed ${character.id} by ${effect.amount}, new HP: ${character.currentHP}`);
                    }
                    break;
                case 'stat_boost':
                    if (character.stats && character.stats[effect.stat] !== undefined) {
                        const boostAmount = effect.amount;
                        // Directly modify the character's current stats object.
                        // This change will be persisted when lastTeamState is rebuilt and saved.
                        character.stats[effect.stat] = (character.stats[effect.stat] || 0) + boostAmount;
                        console.log(`Boosted ${character.id}'s ${effect.stat} by ${boostAmount} to ${character.stats[effect.stat]}`);

                        // --- Optional: Check if HP/Mana was boosted and adjust current if needed ---
                        if (effect.stat === 'hp' || effect.stat === 'mana') {
                             // If max HP was boosted, also increase current HP by the same amount
                             if (effect.stat === 'hp') {
                                character.currentHP = Math.min(character.stats.hp, (character.currentHP || 0) + boostAmount);
                                console.log(`Adjusted ${character.id}'s current HP after Max HP boost: ${character.currentHP}`);
                             }
                             // If max Mana was boosted, also increase current Mana by the same amount
                             if (effect.stat === 'mana') {
                                character.currentMana = Math.min(character.stats.mana, (character.currentMana || 0) + boostAmount);
                                console.log(`Adjusted ${character.id}'s current Mana after Max Mana boost: ${character.currentMana}`);
                             }
                        }
                        // NOTE: Base stats are not modified here, only the current operational stats for the run.
                    } else {
                        console.warn(`Stat ${effect.stat} not found or undefined on character ${character.id}. Stats:`, character.stats);
                    }
                    break;
                case 'stat_boost_percent':
                     console.log(`[DEBUG] Applying stat_boost_percent for ${effect.stat} to ${character.id}`);
                     const baseStats = await this.getBaseStats(character.id); // Helper needed
                     if (!baseStats) {
                         console.error(`[DEBUG] Could not retrieve base stats for ${character.id}. Cannot apply boost.`);
                         throw new Error(`Could not retrieve base stats for ${character.id}`);
                     }
                     console.log(`[DEBUG] Base stats for ${character.id}:`, JSON.parse(JSON.stringify(baseStats))); // Log a copy

                    const boostMultiplier = 1 + (effect.amount / 100);
                    console.log(`[DEBUG] Boost multiplier: ${boostMultiplier}`);
                    
                    // Log stats BEFORE boost for comparison
                    console.log(`[DEBUG] Stats BEFORE boost for ${character.id}:`, JSON.parse(JSON.stringify(character.stats))); 

                    const oldMaxHp = character.stats.hp; // Store old max HP
                    const oldMaxMana = character.stats.mana; // Store old max Mana

                    if (effect.stat === 'all') {
                         console.log(`[DEBUG] Boosting ALL stats.`);
                         for (const stat in character.stats) {
                            // Avoid boosting non-numeric stats like name/id or currentHP/Mana
                             if (typeof character.stats[stat] === 'number' && stat !== 'currentHP' && stat !== 'currentMana' && baseStats[stat] !== undefined) { // Check if base stat exists
                                // Apply boost to current stats based on base stat
                                const baseValue = baseStats[stat];
                                const newStatValue = Math.round(baseValue * boostMultiplier);
                                console.log(`[DEBUG] Boosting ${stat}: Base=${baseValue}, New=${newStatValue}`);
                                character.stats[stat] = newStatValue; // Update live stat
                            } else {
                                console.log(`[DEBUG] Skipping boost for non-numeric or non-base stat: ${stat}`);
                            }
                        }
                     } else if (effect.stat && character.stats[effect.stat] !== undefined && baseStats[effect.stat] !== undefined) { // Check specific stat exists in character.stats and baseStats
                         console.log(`[DEBUG] Boosting specific stat: ${effect.stat}`);
                         const baseValue = baseStats[effect.stat];
                         const newStatValue = Math.round(baseValue * boostMultiplier);
                         console.log(`[DEBUG] Boosting ${effect.stat}: Base=${baseValue}, New=${newStatValue}`);
                         character.stats[effect.stat] = newStatValue; // Update live stat
                     } else {
                         console.warn(`[DEBUG] Stat ${effect.stat} not found on character ${character.id} or base stats. Cannot apply boost.`);
                     }
                     
                     // Log stats AFTER boost
                     console.log(`[DEBUG] Stats AFTER boost for ${character.id}:`, JSON.parse(JSON.stringify(character.stats)));
                     console.log(`Recalculated stats for ${character.id} after % base stat boost. New Max HP: ${character.stats.hp}, New Max Mana: ${character.stats.mana}`);

                     // --- NEW: Adjust current HP/Mana based on Max increase ---
                     const hpIncrease = character.stats.hp - oldMaxHp; // Use recalculated maxHp
                     const manaIncrease = character.stats.mana - oldMaxMana; // Use recalculated maxMana

                     if (hpIncrease > 0) {
                         character.currentHP = Math.min(character.stats.hp, (character.currentHP || 0) + hpIncrease);
                         console.log(`Increased ${character.id}'s current HP by ${hpIncrease} due to Max HP boost.`);
                     }
                     if (manaIncrease > 0) {
                         character.currentMana = Math.min(character.stats.mana, (character.currentMana || 0) + manaIncrease);
                         console.log(`Increased ${character.id}'s current Mana by ${manaIncrease} due to Max Mana boost.`);
                     }
                     // --- END NEW ---
                    break;
                // --- NEW: Revive Effect --- 
                case 'revive':
                    if (character.currentHP <= 0) { // Double-check target is actually dead
                        const revivePercent = effect.amount_percent || 50; // Default to 50% if not specified
                        const maxHP = character.stats && character.stats.hp ? character.stats.hp : 1; // Get max HP, fallback to 1
                        character.currentHP = Math.max(1, Math.floor(maxHP * (revivePercent / 100))); // Restore HP, ensure at least 1
                        console.log(`Revived ${character.id} to ${revivePercent}% HP: ${character.currentHP}`);
                    } else {
                        console.warn(`Attempted to revive living character ${character.id}`);
                        // Optionally, still heal them slightly or provide some other benefit?
                        // For now, just log the warning.
                    }
                    break;
                // --- END: Revive Effect --- 

                // --- NEW: Risky Medicine Effect --- 
                case 'risky_medicine':
                    const chance = Math.random();
                    if (chance < 0.5) { // 50% chance to kill
                        character.currentHP = 0;
                        console.log(`Risky Medicine backfired! ${character.id} was defeated.`);
                    } else { // 50% chance to double HP
                        const oldMaxHp = character.stats.hp;
                        const newMaxHp = oldMaxHp * 2;
                        character.stats.hp = newMaxHp;
                        character.currentHP = newMaxHp; // Fully heal to new max HP
                        console.log(`Risky Medicine worked! ${character.id}'s Max HP doubled to ${newMaxHp} and fully healed.`);
                    }
                    break;
                // --- END: Risky Medicine Effect --- 
                default:
                    console.warn(`Unknown choice effect type: ${effect.type}`);
                    break;
            }
            
            // Update the character in the playerTeam array
            this.playerTeam[targetCharacterIndex] = character;

            // Update lastTeamState for saving (HP/Mana are most critical, but stats changes should persist too)
            // This correctly includes the potentially modified stats object
            this.storyProgress.lastTeamState = this.playerTeam.reduce((acc, member) => {
                 acc[member.id] = { 
                     currentHP: member.currentHP, 
                     currentMana: member.currentMana,
                     // Include the full stats object to persist modifications
                     stats: { ...member.stats } 
                 };
                 return acc;
            }, {});

            // Advance stage progression
            this.storyProgress.currentStageIndex++;
            this.storyProgress.completedStages = Math.max(this.storyProgress.completedStages, this.storyProgress.currentStageIndex);

            // Save progress (which now includes the updated stats in lastTeamState)
            await this.saveStoryProgress();
            console.log(`[StoryManager] Applied choice, advanced to stage ${this.storyProgress.currentStageIndex}, and saved progress.`);

            const hasMoreStages = this.storyProgress.currentStageIndex < this.getTotalStages();

            // Call event handler if defined
            if (this.onStageCompleted) {
                const completedStageId = this.getStageId(this.storyProgress.currentStageIndex - 1);
                // Pass empty rewards for choice stages for now
                this.onStageCompleted(completedStageId, [], hasMoreStages); 
            }

            return hasMoreStages;

        } catch (error) {
            console.error(`Error applying choice effect: ${error}`);
            // Should we revert changes? Or just log? For now, just log.
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
     * Gets a list of character offers for a recruitment stage.
     * @param {Object} stageData - The data for the recruitment stage.
     * @returns {Promise<Array<Object>>} - A promise that resolves with an array of character offer objects.
     */
    async getRecruitmentOffers(stageData) {
        console.log(`[StoryManager] getRecruitmentOffers for stage: ${stageData.name}, tag: ${stageData.recruitTag}, count: ${stageData.recruitCount}`);
        if (!stageData.recruitTag || stageData.recruitCount <= 0) {
            console.error("Invalid recruitment stage data:", stageData);
            return [];
        }

        try {
            // Ensure character registry is loaded
            await this.loadCharacterRegistry();
            if (Object.keys(this.characterRegistry).length === 0) {
                throw new Error("Character registry is empty.");
            }

            const allCharacterIds = Object.keys(this.characterRegistry);
            const currentTeamIds = new Set(this.playerTeam.map(c => c.id));

            // Filter characters
            const potentialRecruits = allCharacterIds.filter(id => {
                // Check if not already in the team
                if (currentTeamIds.has(id)) return false;

                // Check for the required tag (case-insensitive inference from ID)
                const tag = stageData.recruitTag.toLowerCase();
                const charIdLower = id.toLowerCase();
                // Simple inference: check if ID contains the tag
                if (tag === 'school' && (charIdLower.includes('schoolboy') || charIdLower.includes('schoolgirl'))) {
                    return true;
                }
                // NEW: Check for Farmer tag
                if (tag === 'farmer' && (charIdLower.includes('farmer') || charIdLower.includes('farmhand'))) {
                    return true;
                }
                // Add more tag checks here if needed
                // else if (tag === 'another_tag' && ...) { return true; }

                return false; // Default: no match
            });

            console.log(`[StoryManager] Potential recruits found (${potentialRecruits.length}):`, potentialRecruits);

            // Shuffle the potential recruits
            const shuffledRecruits = potentialRecruits.sort(() => 0.5 - Math.random());

            // Take the required number of offers
            const offers = shuffledRecruits.slice(0, stageData.recruitCount);
            console.log(`[StoryManager] Selected offers (${offers.length}):`, offers);

            // Load full data for the offers to return (name, image, etc.)
            const offerDataPromises = offers.map(async (id) => {
                const registryEntry = this.characterRegistry[id];
                // Fetch base stats for display if needed (optional, but good for UI)
                const baseStats = await this.getBaseStats(id); 
                return {
                    id: id,
                    name: registryEntry?.name || id,
                    image: registryEntry?.image || 'images/characters/default.png',
                    stats: baseStats // Include base stats
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