// Game Manager for Roguelike Raid Game
class GameManager {
    constructor() {
        this.stageManager = new StageManager();
        this.uiManager = new UIManager(this);
        this.aiManager = new AIManager(this); // Initialize AI Manager
        this.characterFactory = CharacterFactory; // Use the global instance
        this.gameState = {}; // Initial empty game state
        this.actedCharacters = []; // Track characters who have acted this turn
        this.deadCharactersLogged = []; // Initialize array to track logged deaths
        this.selectedCharacter = null;
        this.selectedAbilityIndex = null;
        this.targetingMode = false;
        this.currentTargets = [];
        this.actionQueue = [];
        this.isExecutingAction = false;
        this.currentTurn = 1;
        this.currentPhase = 'player'; // 'player' or 'ai'
        this.playerCharactersActed = new Set(); // Track which player characters have acted
        this._preventTurnEnd = false; // Flag to prevent ending the turn
        this.autoSelectEnabled = false; // Auto-select character/ability state
        this.debug = true; // Enable debug logging
        
        // Audio context and sound buffer cache
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundBuffers = {};
        this.soundsLoading = {}; // Track sounds currently being loaded
        this.bgmPlayer = null; // Background music player
        this.bgmVolume = 0.7; // Default background music volume
        this.sfxVolume = 0.7; // Default sound effects volume
        
        // Load volume settings from localStorage if available
        const savedVolume = localStorage.getItem('gameVolume');
        if (savedVolume) {
            try {
                const volumeSettings = JSON.parse(savedVolume);
                this.bgmVolume = volumeSettings.bgm || 0.7;
                this.sfxVolume = volumeSettings.sfx || 0.7;
            } catch (e) {
                console.error('Error loading volume settings:', e);
            }
        }
        
        // Initialize preventTurnEnd flag
        this.preventTurnEndFlag = false;
        
        // Add a special window function to force ability reuse for debugging
        window.forceAyaneAbilityReuse = () => {
            if (this.gameState.selectedCharacter && 
                this.gameState.selectedCharacter.id === 'ayane' &&
                this.gameState.selectedAbility && 
                this.gameState.selectedAbility.id === 'ayane_q') {
                
                console.log("[DEBUG] Forcing Ayane ability reuse via debug function");
                
                // Force ability cooldown reset
                this.gameState.selectedAbility.currentCooldown = 0;
                
                // Ensure turn doesn't end
                this.preventTurnEndFlag = true;
                
                // Remove character from actedCharacters if present
                const index = this.actedCharacters.indexOf(this.gameState.selectedCharacter.id);
                if (index > -1) {
                    this.actedCharacters.splice(index, 1);
                }
                
                // Unmark character as acted in UI
                this.uiManager.markCharacterAsActive(this.gameState.selectedCharacter);
                
                // Add message to log
                if (this.uiManager) {
                    this.uiManager.addLogEntry(`Debug: ${this.gameState.selectedCharacter.name} can act again!`, 'combo');
                }
                
                return true;
            }
            return false;
        };
        
        // Debug info
        console.log("[DEBUG] GameManager initialized with preventTurnEndFlag:", this.preventTurnEndFlag);

        this.lastSoundPlayTime = {};
        this.soundCache = {};
    }

    // --- NEW METHOD: Change the current game phase ---
    changePhase(newPhase) {
        if (this.gameState) {
            this.gameState.phase = newPhase;
            console.log(`[GameManager] Phase changed to: ${newPhase}`);
            if (this.uiManager) {
                this.uiManager.updatePhase(newPhase);
            } else {
                console.warn("UIManager not available to update phase display.");
            }
        } else {
            console.error("Cannot change phase: gameState is not initialized.");
        }
    }
    // --- END NEW METHOD ---

    // Method to prevent turn from ending (for abilities like Ayane's Teleport Blade)
    preventTurnEnd() {
        console.log("[DEBUG PREVENTTURNEND] Called preventTurnEnd() method");
        console.log("[DEBUG PREVENTTURNEND] Selected character:", this.selectedCharacter ? this.selectedCharacter.name : "none");
        
        // Set the flag directly
        this.preventTurnEndFlag = true;
        
        // Remove from acted characters if they were just added
        if (this.selectedCharacter) {
            const index = this.actedCharacters.indexOf(this.selectedCharacter.id);
            if (index > -1) {
                console.log("[DEBUG PREVENTTURNEND] Removing character from actedCharacters");
                this.actedCharacters.splice(index, 1);
            }
            
            // Update the end turn button
            this.uiManager.updateEndTurnButton();
            
            // If this is Ayane's Teleport Blade, reset its cooldown directly here
            if (this.selectedCharacter.id === 'ayane' && this.selectedAbility && this.selectedAbility.id === 'ayane_q') {
                console.log("[DEBUG PREVENTTURNEND] Resetting cooldown for Ayane's Q ability");
                this.selectedAbility.currentCooldown = 0;
                
                // Update UI
                this.uiManager.updateCharacterUI(this.selectedCharacter);
                
                // Add message to battle log
                this.addLogEntry(`${this.selectedCharacter.name}'s Teleport Blade is reset!`, 'combo');
            }
        }
    }
    
    // Also add a method to reset the flag at the end of the ability
    setPreventTurnEnd(value) {
        this.preventTurnEndFlag = value;
    }

    // Initialize the game manager
    async initialize() {
        try {
            // Create and initialize stage manager
            this.stageManager = stageManager;
            await this.stageManager.initialize();
            
            // Create UI manager - keep the AIManager created in constructor
            this.uiManager = new UIManager(this);
            this.uiManager.initialize(false); // Only initialize basic UI components
            
            // Set callback for stage loading
            this.stageManager.onStageLoaded = (stage, gameState) => {
                this.onStageLoaded(stage, gameState);
            };
            
            // Preload common sounds
            this.preloadSound('sounds/shomaa1.mp3');
            this.preloadSound('sounds/shomaa2.mp3');
            this.preloadSound('sounds/siegfrieda1.mp3');
            this.preloadSound('sounds/siegfrieda1sfx.mp3');
            this.preloadSound('sounds/ayane_ohshit.mp3');
            this.preloadSound('sounds/elphelta1.mp3');
            this.preloadSound('sounds/elphelt_go.mp3');
            this.preloadSound('sounds/elphelt_help.mp3');
            this.preloadSound('sounds/elphelt_a2.mp3'); // Preload Flower Bomb sound
            
            console.log("GameManager initialized.");
            return true;
        } catch (error) {
            console.error('Failed to initialize game manager:', error);
            return false;
        }
    }

    // Called when a stage is loaded
    onStageLoaded(stage, gameState) {
        console.log('Stage loaded:', stage.name);
        this.gameState = gameState;
        
        // Initialize actedCharacters array
        this.actedCharacters = [];
        
        // Load stage background and music
        this.loadStageBackground(stage);
        this.playStageMusic(stage);
        
        // Update UI
        this.uiManager.renderCharacters(gameState.playerCharacters, gameState.aiCharacters);
        this.uiManager.updateTurnCounter(gameState.turn);
        this.uiManager.updatePhase(gameState.phase);
        this.uiManager.clearBattleLog();
        this.uiManager.addLogEntry(`Battle started in ${stage.name}!`, 'system');
        this.uiManager.addLogEntry(`Player's turn`, 'player-turn');
        
        // Initialize volume slider
        this.initializeVolumeControl();
        
        // Show system announcement about armor/magic shield changes
        setTimeout(() => {
            this.uiManager.addLogEntry(`SYSTEM UPDATE: Armor and Magic Shield now reduce damage by percentage instead of flat values!`, 'system-update');
            this.uiManager.addLogEntry(`Example: 45 Armor = 45% physical damage reduction`, 'system-update');
            this.uiManager.addLogEntry(`Hover over these stats in character details for more info.`, 'system-update');
        }, 2000);
        
        // Now that game state is loaded, set up event handlers
        this.uiManager.setupEventHandlers();
        
        // Start the game
        this.isGameRunning = true;
        
        // Update UI with stage modifiers
        this.uiManager.createStageModifiersIndicator();
    }

    // Load stage background image
    loadStageBackground(stage) {
        const backgroundElement = document.getElementById('stage-background');
        if (!backgroundElement) return;
        
        let backgroundImage = '';
        
        // Check if stage has a specific background
        if (stage && stage.backgroundImage) { // <<< Directly use stage.backgroundImage
            backgroundImage = stage.backgroundImage;
        }
        
        // Set background image if found, otherwise use default gradient
        if (backgroundImage) {
            backgroundElement.style.backgroundImage = `url(${backgroundImage})`;
        } else {
            backgroundElement.style.backgroundImage = 'linear-gradient(to bottom, #1a1a2e, #16213e, #1a1a2e)';
        }
    }
    
    // Play stage background music
    playStageMusic(stage) {
        // Stop any currently playing background music
        this.stopBackgroundMusic();
        
        let musicFile = '';
        
        // Check if stage has specific music
        if (stage && stage.backgroundMusic) { // <<< Directly use stage.backgroundMusic
            musicFile = stage.backgroundMusic;
        }
        
        // Play music if found
        if (musicFile) {
            this.playBackgroundMusic(musicFile);
        }
    }
    
    // Play background music with looping
    playBackgroundMusic(musicPath) {
        // Create audio element for background music
        const audio = new Audio(musicPath);
        audio.loop = true;
        audio.volume = this.bgmVolume;
        
        // Store reference to control later
        this.bgmPlayer = audio;
        
        // Play the music
        audio.play().catch(error => {
            console.error('Error playing background music:', error);
        });
    }
    
    // Stop background music
    stopBackgroundMusic() {
        if (this.bgmPlayer) {
            this.bgmPlayer.pause();
            this.bgmPlayer.currentTime = 0;
            this.bgmPlayer = null;
        }
    }
    
    // Initialize volume control
    initializeVolumeControl() {
        const volumeSlider = document.getElementById('volume-slider');
        const volumeIcon = document.getElementById('volume-icon');
        
        if (!volumeSlider || !volumeIcon) return;
        
        // Set initial slider value from stored volume
        volumeSlider.value = Math.round(this.bgmVolume * 100);
        
        // Update volume when slider changes
        volumeSlider.addEventListener('input', () => {
            const volume = volumeSlider.value / 100;
            this.setVolume(volume);
            
            // Update icon based on volume level
            if (volume === 0) {
                volumeIcon.textContent = '🔇';
            } else if (volume < 0.5) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
            
            // Save volume settings to localStorage
            this.saveVolumeSettings();
        });
        
        // Toggle mute when clicking the icon
        volumeIcon.addEventListener('click', () => {
            if (this.bgmVolume > 0) {
                // Store current volume for unmuting
                this.previousVolume = this.bgmVolume;
                this.setVolume(0);
                volumeSlider.value = 0;
                volumeIcon.textContent = '🔇';
            } else {
                // Restore previous volume or default to 0.7
                const newVolume = this.previousVolume || 0.7;
                this.setVolume(newVolume);
                volumeSlider.value = Math.round(newVolume * 100);
                volumeIcon.textContent = newVolume < 0.5 ? '🔉' : '🔊';
            }
            
            // Save volume settings to localStorage
            this.saveVolumeSettings();
        });
    }
    
    // Set volume for all audio
    setVolume(volume) {
        // Set volume for background music
        this.bgmVolume = volume;
        if (this.bgmPlayer) {
            this.bgmPlayer.volume = volume;
        }
        
        // Set volume for sound effects
        this.sfxVolume = volume;
    }
    
    // Save volume settings to localStorage
    saveVolumeSettings() {
        const volumeSettings = {
            bgm: this.bgmVolume,
            sfx: this.sfxVolume
        };
        localStorage.setItem('gameVolume', JSON.stringify(volumeSettings));
    }

    // Start a new game with a specific stage
    async startGame(stageId) {
        const userId = getCurrentUserId();
        if (!userId) {
            console.error("User not logged in. Cannot start game.");
            // Handle error appropriately - maybe redirect?
             document.getElementById('loading-text').textContent = 'Error: User not logged in.';
             hideLoadingScreen(); // Assuming hideLoadingScreen is globally available
            return;
        }

        console.log("Starting game...");
        this.resetGame(); // Reset game state before starting
        this.isGameOver = false;

        // Create and initialize stage manager
        this.stageManager = stageManager;
        await this.stageManager.initialize();
        
        // Create UI manager - keep the AIManager created in constructor
        this.uiManager = new UIManager(this);
        this.uiManager.initialize(false); // Only initialize basic UI components
        
        // Set callback for stage loading
        this.stageManager.onStageLoaded = (stage, gameState) => {
            this.onStageLoaded(stage, gameState);
        };
        
        // Preload common sounds
        this.preloadSound('sounds/shomaa1.mp3');
        this.preloadSound('sounds/shomaa2.mp3');
        this.preloadSound('sounds/siegfrieda1.mp3');
        this.preloadSound('sounds/siegfrieda1sfx.mp3');
        this.preloadSound('sounds/ayane_ohshit.mp3');
        this.preloadSound('sounds/elphelta1.mp3');
        this.preloadSound('sounds/elphelt_go.mp3');
        this.preloadSound('sounds/elphelt_help.mp3');
        this.preloadSound('sounds/elphelt_a2.mp3'); // Preload Flower Bomb sound
        
        console.log("GameManager initialized.");

        // Check URL parameters for story context
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('storyId');
        const stageIndexParam = urlParams.get('stageIndex');

        let stageToLoadId = null; // Use a new variable to store the final ID
        let teamState = null; // Will hold { id: { currentHP, currentMana } }

        if (storyId && stageIndexParam !== null) {
            // --- Story Mode Context --- 
            const stageIndex = parseInt(stageIndexParam);
            console.log(`Loading from Story Context: ${storyId}, Stage Index: ${stageIndex}`);

            // 1. Fetch story progress to get the team state
            const progressRef = firebaseDatabase.ref(`users/${userId}/storyProgress/${storyId}`);
            const progressSnapshot = await progressRef.once('value');
            if (progressSnapshot.exists()) {
                const progressData = progressSnapshot.val();
                teamState = progressData.lastTeamState || {}; // Get the saved state
                console.log("Fetched team state from existing progress:", teamState);
            } else {
                console.log(`Progress not found for story ${storyId}. Initializing new progress.`);
                teamState = {}; // Initialize empty team state for a new story
            }

            // 2. Determine the actual stage ID from story data and index
            const stageInfo = await this.stageManager.getStageInfoFromRegistry(storyId, stageIndex);
            if (!stageInfo || !stageInfo.id) {
                throw new Error(`Could not find stage info for ${storyId} index ${stageIndex}`);
            }
            stageToLoadId = stageInfo.id; // Set the ID to load
            console.log(`Determined Stage ID for story context: ${stageToLoadId}`);

            // Store story context on the stage manager's current stage
            // This might be redundant if loadStage handles it, but belt-and-suspenders
            // Need to load the stage first before setting these?
            // this.stageManager.currentStage.storyId = storyId;
            // this.stageManager.currentStage.stageIndex = parseInt(stageIndexParam);
            // console.log("Applied story context to loaded stage:", this.stageManager.currentStage);
        } else {
            // --- Non-Story Mode (Direct Load / Test) --- 
            stageToLoadId = stageId; // Use the function parameter stageId
            console.log(`Loading directly with Stage ID: ${stageToLoadId}`);
            // Fetch the user's default/last used team? Or use a fixed test team?
            // For now, let StageManager handle default team loading if teamState is null.
        }

        // Ensure we determined a stage ID to load
        if (!stageToLoadId) {
            throw new Error("Could not determine which stage to load.");
        }

        // Load the determined stage, passing the fetched team state
        await this.stageManager.loadStage(stageToLoadId, teamState);

        // --- NEW: Trigger Shoma Ball Selection if needed ---
        const shomaCharacter = this.gameState.playerCharacters.find(char => char.id === 'schoolboy_shoma');
        if (shomaCharacter && typeof showBallSelectionForShoma === 'function') {
            console.log('Schoolboy Shoma detected in player team, showing ball selection after stage load.');
            // Show the selection UI - we don't need to wait for it here as the stage is already loaded
            showBallSelectionForShoma(shomaCharacter, () => {
                console.log('Ball selection completed or timed out (triggered after stage load).');
                // Optionally, refresh UI if needed after selection, though it should be handled within showBallSelection
                // this.uiManager.updateUI(this.gameState); 
            });
        } else if (shomaCharacter && typeof showBallSelectionForShoma !== 'function') {
             console.error("Schoolboy Shoma found, but showBallSelectionForShoma function is not available.");
        }
        // --- END NEW ---

        // --- DEBUG LOG ---
        console.log("[DEBUG] 'this' before calling changePhase:", this);
        console.log("[DEBUG] typeof this.changePhase:", typeof this?.changePhase);
        // --- END DEBUG LOG ---

        // Set the initial phase
        this.changePhase('player');

        // --- Apply story context AFTER stage is loaded ---
        if (storyId) { 
            // Make sure currentStage is not null before accessing it
            if (this.stageManager.currentStage) {
                this.stageManager.currentStage.storyId = storyId;
                this.stageManager.currentStage.stageIndex = parseInt(stageIndexParam);
                console.log("Applied story context to loaded stage:", this.stageManager.currentStage);
            } else {
                console.error("Cannot apply story context: StageManager.currentStage is null after loadStage.");
                // Potentially throw an error here or handle it depending on desired behavior
            }
        }
        // --- END Apply story context ---

        this.gameState = this.stageManager.gameState; // Get the loaded game state
 
        // --- Initialize UI --- 
        // ... (Rest of startGame)
    }

    // Handle player selecting a character
    selectCharacter(character) {
        // --- NEW: Check if character is dead ---
        if (character.isDead()) {
            this.uiManager.addLogEntry(`${character.name} is defeated and cannot act.`);
            return false;
        }
        // --- END NEW ---

        // Can only select player characters during player phase
        if (this.gameState.phase !== 'player' || character.isAI || !this.isGameRunning) {
            return false;
        }
        
        // Check if character has already acted this turn
        if (this.actedCharacters.includes(character.id)) {
            this.uiManager.addLogEntry(`${character.name} has already acted this turn.`);
            return false;
        }
        
        // Check if character is stunned
        if (character.isStunned()) {
            this.uiManager.addLogEntry(`${character.name} is stunned and cannot act this turn.`);
            return false;
        }
        
        // Deselect previously selected characters
        this.gameState.selectedCharacter = character;
        this.gameState.selectedAbility = null;
        
        // Update UI
        this.uiManager.highlightSelectedCharacter(character);
        this.uiManager.showCharacterAbilities(character);
        
        // Remove battlelog entry for character selection
        
        return true;
    }

    // Handle player selecting an ability
    selectAbility(character, abilityIndex) {
        // Make sure the character is selected
        if (this.gameState.selectedCharacter !== character || !this.isGameRunning) {
            return false;
        }
        
        // --- NEW: Check if character is dead ---
        if (character.isDead()) {
            // This check might be redundant if selectCharacter already prevents selection
            // but it adds an extra layer of safety.
            return false;
        }
        // --- END NEW ---
        
        const ability = character.abilities[abilityIndex];
        if (!ability) {
            return false;
        }
        
        // Check if ability is on cooldown
        if (ability.currentCooldown > 0) {
            this.uiManager.addLogEntry(`${ability.name} is on cooldown for ${ability.currentCooldown} more turns.`);
            return false;
        }
        
        this.gameState.selectedAbility = ability;
        
        // Update UI
        this.uiManager.highlightSelectedAbility(abilityIndex);
        
        // Show valid targets based on ability type
        this.uiManager.showValidTargets(ability.targetType);
        
        // Remove battlelog entry for ability selection
        
        // No auto-selection of targets - this has been removed
        
        return true;
    }

    // Auto-select the best ability for the currently selected character
    autoSelectAbility() {
        // This method is disabled as we only want auto character selection, not auto ability selection
        return false;
    }

    // Auto-select the best target for the currently selected ability
    autoSelectTarget() {
        // This method is disabled as we only want auto character selection, not auto target selection
        return false;
    }

    // Handle player targeting a character with an ability
    targetCharacter(target) {
        // --- NEW: Check if target is dead ---
        if (target.isDead()) {
            this.uiManager.addLogEntry("Cannot target a defeated character.");
            return false;
        }
        // --- END NEW ---

        // Make sure we have a character and ability selected
        if (!this.gameState.selectedCharacter || !this.gameState.selectedAbility || !this.isGameRunning) {
            // Remove log message about selecting character and ability first
            return false;
        }
        
        const caster = this.gameState.selectedCharacter;
        const ability = this.gameState.selectedAbility;
        
        // Validate targeting based on ability type
        if (!this.validateTarget(ability.targetType, target)) {
            this.uiManager.addLogEntry("Invalid target for this ability.");
            return false;
        }
        
        // Check if caster has enough mana
        if (caster.stats.currentMana < ability.manaCost) {
            this.uiManager.addLogEntry(`Not enough mana! Need ${ability.manaCost} mana.`);
            return false;
        }
        
        // Check if ability is on cooldown
        if (ability.currentCooldown > 0) {
            this.uiManager.addLogEntry(`Ability is on cooldown for ${ability.currentCooldown} more turns.`);
            return false;
        }
        
        let success = false;
        
        // Reset the preventTurnEndFlag before using the ability
        this.preventTurnEndFlag = false;
        
        // --- MODIFIED: Call Character.useAbility instead of Ability.use --- 
        // Find the index of the selected ability within the caster's abilities array
        const abilityIndex = caster.abilities.findIndex(a => a === ability);

        if (abilityIndex === -1) {
            console.error(`[GameManager.targetCharacter] Could not find index for selected ability: ${ability.name} on caster: ${caster.name}`);
            this.uiManager.addLogEntry("Internal error: Ability index not found.", "error");
            return false; // Prevent further execution if index is not found
        }

        // Call the Character's useAbility method, passing the index and target.
        // This ensures the logic within Character.useAbility (like the interaction sound) is executed.
        success = caster.useAbility(abilityIndex, target);
        // --- END MODIFICATION ---
        
        // Remove the old direct call to ability.use
        // success = ability.use(caster, target);
        
        // Remove the old AoE-specific block that incorrectly called ability.effect in a loop
        /*
        // Handle AOE abilities specially - OLD INCORRECT LOGIC REMOVED
        if (ability.targetType.startsWith('all_')) {
            // ... old code ...
            targets.forEach(function(target) {
                ability.effect(caster, target);
            }, this);
            success = true;
        } else {
            // Single target ability
            success = ability.use(caster, target);
        }
        */
        
        // Common logic after ability use attempt
        if (success) {
            // Explicitly update the caster's UI to ensure cooldowns/mana are reflected
            this.uiManager.updateCharacterUI(caster);

            // Check if the clicked target died (for single-target)
            // AoE death checks should happen within the ability effect itself for clarity
            if (target && target.isDead() && !ability.targetType.startsWith('all_')) {
                 if (!this.deadCharactersLogged.includes(target.instanceId || target.id)) {
                    this.uiManager.addLogEntry(`${target.name} has been defeated!`, 'system');
                    this.deadCharactersLogged.push(target.instanceId || target.id);
                    
                    const charElement = document.getElementById(`character-${target.instanceId || target.id}`);
                    if (charElement) {
                        charElement.classList.add('dead');
                    }
                }
            }
            // Note: Caster UI update happens within ability.use
            
            // Check if the game is over
            if (this.checkGameOver()) {
                return true;
            }
            
            // IMPORTANT DEBUG: Log whether we should prevent turn end
            console.log("[DEBUG MANAGER] After ability use, preventTurnEndFlag =", this.preventTurnEndFlag);
            console.log("[DEBUG MANAGER] Ability ID:", this.gameState.selectedAbility.id);
            
            // Force Ayane's Q ability to prevent turn end - IMPORTANT FIX
            if (this.gameState.selectedAbility.id === 'ayane_q') {
                console.log("[DEBUG MANAGER] Ayane's Q ability used - special handling");
                this.preventTurnEndFlag = true; // CRITICAL: Force the flag to true
            }
            
            // Only mark character as acted if turn shouldn't be prevented
            if (!this.preventTurnEndFlag) {
                // Mark character as having acted this turn
                this.actedCharacters.push(this.gameState.selectedCharacter.id);
                this.uiManager.markCharacterAsActed(this.gameState.selectedCharacter);
            } else {
                // Remove character from acted list if they were just added
                const index = this.actedCharacters.indexOf(this.gameState.selectedCharacter.id);
                if (index > -1) {
                    this.actedCharacters.splice(index, 1);
                }
                
                // Mark character as active again
                this.uiManager.markCharacterAsActive(this.gameState.selectedCharacter);
                
                // Add message to battle log
                this.addLogEntry(`${this.gameState.selectedCharacter.name} can act again!`, 'combo');
                
                // Update button text
                this.uiManager.updateEndTurnButton();
            }
            
            // Reset preventTurnEndFlag after use
            if (this.preventTurnEndFlag && this.gameState.selectedAbility.id !== 'ayane_q') {
                this.preventTurnEndFlag = false;
            }
            
            // Deselect character
            this.gameState.selectedCharacter = null;
            this.gameState.selectedAbility = null;
            this.uiManager.clearSelection();
            
            // Check if all player characters have acted
            if (this.allPlayerCharactersActed()) {
                // End player turn
                this.endPlayerTurn();
            } else {
                // Auto-select the next character if auto-select is enabled
                if (this.autoSelectEnabled) {
                    // Small delay before auto-selecting to make it more user-friendly
                    setTimeout(() => {
                        this.autoSelectCharacter();
                    }, 300);
                } else {
                    // Remove prompt to select the next character
                }
            }
        }
        
        return success;
    }

    // Validate if a target is valid for the given ability type
    validateTarget(targetType, target) {
        // --- NEW: Check if target is dead first ---
        if (!target || target.isDead()) {
            return false;
        }
        // --- END NEW ---

        const selectedChar = this.gameState.selectedCharacter;
        
        // --- NEW: Check if target is untargetable by abilities ---
        const targetIsUntargetable = target.isUntargetable && target.isUntargetable();
        if (targetIsUntargetable) {
            console.log(`[validateTarget] Target ${target.name} is untargetable due to an effect.`);
            // Optionally add a visual indication to the user (e.g., log message, UI flash)
            this.addLogEntry(`${target.name} cannot be targeted right now!`, 'error');
            return false;
        }
        // --- END NEW ---

        switch (targetType) {
            case 'enemy':
                return target.isAI !== selectedChar.isAI;
            case 'ally':
                // Modified to allow self-targeting for 'ally' targeting type
                // This ensures abilities like Farmer Alice's Carrot Power Up can target herself
                return target.isAI === selectedChar.isAI;
            case 'self':
                return target === selectedChar;
            case 'ally_or_self':
                return target.isAI === selectedChar.isAI; // Both allies and self
            case 'any':
                return true;
            case 'any_except_self':
                // New target type: Can target both allies and enemies, but not self
                // Used for Farmer Alice's Bunny Bounce ability
                return target !== selectedChar;
            case 'all_enemies':
                // For AOE abilities that target all enemies
                return target.isAI !== selectedChar.isAI;
            case 'all_allies':
                // For AOE abilities that target all allies
                return target.isAI === selectedChar.isAI;
            case 'all':
                // For AOE abilities that target everyone
                return true;
            default:
                return false;
        }
    }

    // Check if all player characters have acted
    allPlayerCharactersActed() {
        // --- MODIFIED: Filter out dead characters before checking --- 
        const livingPlayerCharacters = this.gameState.playerCharacters.filter(c => !c.isDead());
        if (livingPlayerCharacters.length === 0) {
            // If all player characters are dead, the turn effectively ends
            return true; 
        }
        return livingPlayerCharacters.every(c => this.actedCharacters.includes(c.id));
        // --- END MODIFICATION ---
    }

    // End player turn and start AI turn
    endPlayerTurn() {
        console.log("Player turn ended.");

        // Process player character effects WITH duration reduction
        this.gameState.playerCharacters.forEach(char => {
            if (char && !char.isDead()) {
                // Trigger onTurnStart for passives
                if (char.passiveHandler && typeof char.passiveHandler.onTurnStart === 'function') {
                    try {
                        // Pass the character and current turn number
                        char.passiveHandler.onTurnStart(char, this.gameState.turn);
                    } catch (e) {
                        console.error(`Error in onTurnStart for ${char.name}'s passive:`, e);
                    }
                }
                char.processEffects(true, true); // Reduce duration and regenerate resources
            }
        });

        // Do NOT reduce durations for AI characters here, it will be done in AI turn
        
        this.gameState.phase = 'ai';
        
        // Deselect character and ability
        this.gameState.selectedCharacter = null;
        this.gameState.selectedAbility = null;
        
        // Update UI
        this.uiManager.clearSelection();
        this.uiManager.updatePhase('ai');
        this.uiManager.addLogEntry("AI's turn", 'enemy-turn');
        
        // Start AI turn with a delay - use aiManager instead of calling our own method
        setTimeout(() => this.aiManager.executeAITurn(), this.turnDelay);
    }

    // Execute AI turn
    async executeAITurn() {
        try {
            this.gameManager.gameState.phase = 'ai';
            this.gameManager.uiManager.updatePhase('ai');

            // Process AI effects at start of their turn WITH duration reduction
            this.gameManager.gameState.aiCharacters.forEach(aiChar => {
                if (!aiChar.isDead()) {
                    // Process buffs/debuffs, reduce duration=true, regenerate resources
                    aiChar.processEffects(true, true);
                    // Reduce ability cooldowns
                    aiChar.abilities.forEach(ability => ability.reduceCooldown());
                    // Update UI after processing
                    this.gameManager.uiManager.updateCharacterUI(aiChar);
                }
            });

            // Show planning phase overlay
            this.gameManager.uiManager.showPlanningPhase(true);
            
            // Get list of AI characters that can act (not stunned)
            const activeAICharacters = this.gameManager.gameState.aiCharacters.filter(char => {
                if (char.isStunned()) {
                    this.gameManager.addLogEntry(`${char.name} is stunned and cannot act this turn.`, 'enemy-turn');
                    return false;
                }
                return true;
            });
            
            // Plan actions for each AI character
            const actions = [];
            for (const aiChar of activeAICharacters) {
                // Show planning animation for this character
                this.gameManager.uiManager.showCharacterPlanning(aiChar, true);
                
                // Plan the action with delay for visualization
                await this.delay(800);
                const plannedAction = await this.planAIAction(aiChar);
                
                // If an action was planned (not null and no error)
                if (plannedAction && !plannedAction.error) {
                    // --- NEW: Construct the action object expected by executeAction --- 
                    const casterIndex = this.gameManager.gameState.aiCharacters.findIndex(c => c.instanceId === aiChar.instanceId);
                    const abilityIndex = aiChar.abilities.findIndex(a => a.id === plannedAction.ability.id);

                    if (casterIndex !== -1 && abilityIndex !== -1) {
                         const finalAction = {
                             casterIndex: casterIndex,
                             abilityIndex: abilityIndex,
                             target: plannedAction.target // Use the target from the plan
                         };
                         actions.push(finalAction);
                    } else {
                         console.error(`[AI EXECUTE TURN] Failed to find caster or ability index for planned action by ${aiChar.name}:`, plannedAction);
                    }
                    // --- END NEW --- 
                } else if (plannedAction && plannedAction.error) {
                     // Log the reason why the action couldn't be fully planned (e.g., no target)
                     console.log(`[AI EXECUTE TURN] Skipping action for ${aiChar.name} (${plannedAction.ability.name}): ${plannedAction.error}`);
                     // Optionally add to game log
                     // this.gameManager.addLogEntry(`${aiChar.name} tried to use ${plannedAction.ability.name} but could not: ${plannedAction.error}`, 'enemy-turn');
                }
                
                // Hide planning animation when done
                this.gameManager.uiManager.showCharacterPlanning(aiChar, false);
                
                // Add small delay between planning for each character
                await this.delay(300);
            }
            
            // Hide planning phase overlay
            this.gameManager.uiManager.showPlanningPhase(false);
            
            // Execute each planned action with delay between them
            for (const action of actions) {
                await this.executeAction(action);
                await this.delay(1000); // Delay between AI actions
            }
            
            // End AI turn
            this.gameManager.endAITurn();
            
            return true;
        } catch (error) {
            console.error('Error in AI turn:', error);
            this.gameManager.uiManager.showPlanningPhase(false);
            this.gameManager.endAITurn();
            return false;
        }
    }

    // Plan an action for an AI character (but don't execute it yet)
    async planAIAction(aiChar) {
        // Simple AI: Use a random available ability on a valid target
        const availableAbilities = aiChar.abilities.filter(ability =>
            ability.currentCooldown <= 0 &&
            aiChar.stats.currentMana >= ability.manaCost &&
            !ability.isDisabled // Added check for disabled abilities
        );

        if (availableAbilities.length === 0) {
            console.log(`[AI Planner] ${aiChar.name} has no available abilities.`);
            return null; // No action possible
        }

        // Randomly select an ability
        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const selectedAbility = availableAbilities[randomIndex];
        console.log(`[AI Planner] Randomly selected ${selectedAbility.name} for ${aiChar.name}`);

        let possibleTargets = [];
        const allPlayerChars = this.gameManager.gameState.playerCharacters.filter(c => !c.isDead() && !c.isUntargetable());
        const allAIChars = this.gameManager.gameState.aiCharacters.filter(c => !c.isDead() && !c.isUntargetable());

        // Determine possible targets based on ability type
        switch (selectedAbility.targetType) {
            case 'enemy':
                possibleTargets = allPlayerChars;
                break;
            case 'ally':
                possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Exclude self
                break;
            case 'self':
                possibleTargets = [aiChar]; // Only self
                break;
            case 'any':
                possibleTargets = [...allPlayerChars, ...allAIChars];
                break;
            case 'any_except_self': // Added this case
                possibleTargets = [
                    ...allPlayerChars, // All enemies
                    ...allAIChars.filter(c => c.id !== aiChar.id) // All allies except self
                ];
                break;
            case 'all_enemies':
            case 'all': // Add 'all' case to target enemies
                possibleTargets = allPlayerChars; // Target the group of enemies
                break;
            case 'all_allies':
                possibleTargets = allAIChars; // Target the group
                break;
            case 'all_allies_except_self': // Added this case for Carrot Power-up
                possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Target the group, excluding self
                break;
            default:
                console.error(` [AI Planner] Unknown target type '${selectedAbility.targetType}'`);
                possibleTargets = []; // No valid target logic
                break;
        }

        // Filter out untargetable characters again, just in case
        possibleTargets = possibleTargets.filter(c => c && !c.isDead() && !c.isUntargetable());

        if (possibleTargets.length === 0) {
             console.log(`[AI Planner Debug] No valid targets found for ${selectedAbility.name} (type: ${selectedAbility.targetType}) after filtering.`);
             console.log(`[AI Planner Debug] All Player Chars (alive, targetable): ${allPlayerChars.map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);
             console.log(`[AI Planner Debug] All AI Chars (alive, targetable, not self): ${allAIChars.filter(c => c.id !== aiChar.id).map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);

            return { ability: selectedAbility, target: null, error: 'No valid targets found' }; // Indicate no valid target
        }

        // Select a random target from the valid list for single-target abilities
        // For group abilities, we'll use the entire group later
        let selectedTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        console.log(`[AI Planner Debug] Initial target selected for ${selectedAbility.name}: ${selectedTarget.name} (isAI: ${selectedTarget.isAI})`);

        // Handle AoE abilities - target the whole group
        if (selectedAbility.targetType === 'all_enemies') {
            selectedTarget = allPlayerChars; // Pass the array
        } else if (selectedAbility.targetType === 'all_allies') {
            selectedTarget = allAIChars; // Pass the array
        } else if (selectedAbility.targetType === 'all') { // Handle the new 'all' case
            selectedTarget = allPlayerChars; // Pass the array of player characters
        } else if (selectedAbility.targetType === 'all_allies_except_self') { // Handle Carrot Power-up case
            selectedTarget = allAIChars.filter(c => c.id !== aiChar.id); // Pass the filtered array
        }
        // For single target types (enemy, ally, self, any, any_except_self), selectedTarget remains the randomly chosen single character.

        if (selectedTarget && (!Array.isArray(selectedTarget) || selectedTarget.length > 0)) {
             const targetName = Array.isArray(selectedTarget) ? `${selectedTarget.length} targets` : selectedTarget.name;
             console.log(`[AI Planner] Planned action: ${selectedAbility.name} on ${targetName}`);
            return { ability: selectedAbility, target: selectedTarget };
        } else {
            console.log(`[AI Planner] Skipping action for ${selectedAbility.name}: No valid targets found.`);
            return null; // Skip action if no target found
        }
    }

    // Execute a previously planned action
      async executeAction(action) {
          if (!action || action.casterIndex === undefined || action.abilityIndex === undefined || action.target === undefined) {
              console.error("AI executeAction called with invalid or incomplete action:", action);
              this.addLogEntry(`AI encountered an error retrieving planned action.`, 'error');
              return;
          }

          const caster = this.gameState.aiCharacters[action.casterIndex];
          const ability = caster ? caster.abilities[action.abilityIndex] : null;
          let targetInfo = action.target; // Target from the planned action (can be object or array)

          if (!caster || !ability) {
              console.error("AI executeAction: Caster or Ability not found for action:", action);
              this.addLogEntry(`AI encountered an error finding character or ability.`, 'error');
              return;
          }
          
          // --- VALIDATION CHECKS --- 
           if (caster.isDead() || caster.isStunned()) {
               this.addLogEntry(`${caster.name} cannot execute action (dead or stunned).`, 'enemy-turn');
               return;
           }
           if (caster.stats.currentMana < ability.manaCost) {
               this.addLogEntry(`${caster.name} does not have enough mana for ${ability.name}. Skipping action.`, 'enemy-turn');
               return;
           }
           if (ability.currentCooldown > 0) {
                this.addLogEntry(`${caster.name}'s ${ability.name} is still on cooldown (${ability.currentCooldown} turns). Skipping action.`, 'enemy-turn');
                return;
           }
           if (ability.isDisabled) { 
                this.addLogEntry(`${caster.name}'s ${ability.name} is disabled. Skipping action.`, 'enemy-turn');
                return;
           }
           // --- END VALIDATION CHECKS ---
           
           // --- TARGET RE-VALIDATION (Just before execution) ---
           let finalTargetInfo = null;
           const targetType = ability.targetType; // Use targetType from the ability itself
           
           if (targetType === 'self') {
               finalTargetInfo = caster.isDead() ? null : caster;
           } else if (targetType === 'enemy' || targetType === 'ally') {
               // Planned target was a single object
               const singleTarget = targetInfo;
               if (singleTarget && !singleTarget.isDead()) {
                   finalTargetInfo = singleTarget;
               } else {
                   // Attempt to find a new random target if the original is dead
                   console.log(`[AI Execute] Original target ${singleTarget?.name} invalid. Retargeting for ${ability.name}...`);
                   if (targetType === 'enemy') {
                       const potentialEnemies = this.gameState.playerCharacters.filter(p => !p.isDead());
                       if (potentialEnemies.length > 0) finalTargetInfo = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
                   } else { // targetType === 'ally'
                       const potentialAllies = this.gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                       if (potentialAllies.length > 0) finalTargetInfo = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                       else finalTargetInfo = caster; // Fallback to self if no allies
                   }
                   if(finalTargetInfo) console.log(`[AI Execute] Re-targeted to ${finalTargetInfo.name}.`);
               }
           } else if (targetType === 'aoe_enemy' || targetType === 'all_enemies') {
               // Planned target was an array of enemies
               finalTargetInfo = this.gameState.playerCharacters.filter(p => !p.isDead());
               console.log(`[AI Execute] Validating ${finalTargetInfo.length} living enemies for AoE.`);
           } else if (targetType === 'aoe_ally' || targetType === 'all_allies') {
               // Planned target was an array of allies
               finalTargetInfo = this.gameState.aiCharacters.filter(a => !a.isDead());
               console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies for AoE.`);
            } else if (targetType === 'all') {
                // Planned target was an array of all characters
                const livingEnemies = this.gameState.playerCharacters.filter(p => !p.isDead());
                const livingAllies = this.gameState.aiCharacters.filter(a => !a.isDead());
                finalTargetInfo = [...livingEnemies, ...livingAllies];
                console.log(`[AI Execute] Validating ${finalTargetInfo.length} living characters for 'all'.`);
            } else if (targetType === 'all_allies_except_self') { // Added this case
                // Re-fetch living allies excluding self just before execution
                finalTargetInfo = this.gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies (excluding self) for AoE buff.`);
            } else {
                 console.warn(`[AI Execute] Unhandled target type ${targetType} during re-validation.`);
                 finalTargetInfo = targetInfo; // Pass original planned target if type is unknown
            }

           // Final check: If after re-validation, there are no targets for non-self abilities
           if (targetType !== 'self' && (!finalTargetInfo || (Array.isArray(finalTargetInfo) && finalTargetInfo.length === 0))) {
               this.addLogEntry(`${caster.name} uses ${ability.name}, but there are no valid targets remaining.`, 'enemy-turn');
               // Decide whether to still consume mana/cooldown or just skip
               // Skipping seems more logical if the ability couldn't execute.
               return; 
           }
           // --- END TARGET RE-VALIDATION ---

           // Log the action being taken (handle single target name vs array)
           let targetName = '';
            if (finalTargetInfo) {
                if (Array.isArray(finalTargetInfo)) {
                    targetName = `${finalTargetInfo.length} targets`;
                } else if (finalTargetInfo.name) {
                    targetName = `on ${finalTargetInfo.name}`;
                }
            }
           this.addLogEntry(`${caster.name} uses ${ability.name} ${targetName}.`, 'enemy-turn');

           // Use ability (pass the final validated target info)
           const success = caster.useAbility(action.abilityIndex, finalTargetInfo); 

           if (success) {
               // Log cooldown only if successful
               if (ability.cooldown > 0) {
                    this.addLogEntry(`${ability.name} is on cooldown for ${ability.cooldown} more turns.`);
               }
           } else {
               // Log failure if useAbility returned false 
               this.addLogEntry(`${caster.name} failed to use ${ability.name} (possible internal check failure).`, 'error');
           }

           // Check for game over after each action
           if (this.checkGameOver()) {
               // Determine victory status *here* based on game state
               const playerWon = this.gameState.aiCharacters.every(char => char.isDead());
               console.log(`[GameManager executeAction] Game Over detected. Player Won: ${playerWon}`); // Log game over detection
               this.uiManager.showGameOverScreen(playerWon); // Pass the determined victory status
               await this.saveBattleResultToFirebase(playerWon);
               this.isGameRunning = false;
           }
       }

       // Helper to create a delay
       async delay(ms) {
           return new Promise(resolve => setTimeout(resolve, ms));
       }

       // End AI turn and start a new turn
       endAITurn() {
           console.log("AI turn ended.");

           // --- DISPATCH TurnStart EVENT --- 
           // Dispatch event *before* processing player turn effects
           const turnStartEvent = new CustomEvent('TurnStart', {
               detail: { turn: this.gameState.turn + 1 } // Dispatch for the upcoming player turn
           });
           document.dispatchEvent(turnStartEvent);
           console.log(`[GameManager] Dispatched TurnStart event for turn ${this.gameState.turn + 1}`);
           // --- END DISPATCH ---

           // At the end of AI turn, do NOT process effects for all characters again
           // Just trigger passive onTurnStart without reducing durations
           [...this.gameState.playerCharacters, ...this.gameState.aiCharacters].forEach(char => {
               if (char && !char.isDead()) {
                   // Trigger onTurnStart for passives without reducing effect durations
                   if (char.passiveHandler && typeof char.passiveHandler.onTurnStart === 'function') {
                       try {
                           // Pass the character and current turn number
                           char.passiveHandler.onTurnStart(char, this.gameState.turn);
                       } catch (e) {
                           console.error(`Error in onTurnStart for ${char.name}'s passive:`, e);
                       }
                   }
                   // We don't call processEffects(true) here anymore
               }
           });

           this.addLogEntry("AI turn ended.");
           this.gameState.phase = 'player';
           this.gameState.turn++; // Increment turn counter

           // Update turn counter UI
           this.uiManager.updateTurnCounter(this.gameState.turn);
           this.uiManager.updatePhase(this.gameState.phase);
           this.uiManager.resetActedCharacters();
           this.actedCharacters = []; // Reset the list of characters who have acted this turn

           // Apply stage effects at the start of the player turn sequence
           this.applyStageEffects();
           
           // Process player characters at the start of their turn - but don't reduce durations
           this.gameState.playerCharacters.forEach(char => {
               if (!char.isDead()) {
                   // Call processEffects with false to apply effects but not reduce durations
                   // And false for regenerateResources since we'll do it manually
                   char.processEffects(false, false);
                   
                   // Manually regenerate resources
                   char.regenerateResources();
                   
                   // Reduce ability cooldowns
                   char.abilities.forEach(ability => ability.reduceCooldown());
                   
                   // Update UI after processing
                   updateCharacterUI(char);
               }
           });

           // Clear AI selections
           this.gameState.selectedCharacter = null;
           this.gameState.selectedAbility = null;
           this.uiManager.clearSelection();

           // Re-enable end turn button
           this.uiManager.updateEndTurnButton();

           // Check if the game ended after processing player turn start effects
           this.checkGameOver();
       }

       // NEW FUNCTION: Apply stage-specific passive effects
       applyStageEffects() {
           // Clear existing stage VFX first
           const existingVfx = document.querySelector('.burning-ground-container');
           if (existingVfx) {
               existingVfx.remove();
           }

           // --- MODIFIED: Check for Burning Ground effect by ID --- 
           const burningGroundEffect = this.stageManager?.currentStage?.stageEffects?.find(effect => effect.id === 'burning_ground');

           if (burningGroundEffect) {
               // Initialize the VFX if the function exists
               if (typeof window.initializeBurningGroundEffect === 'function') {
                    window.initializeBurningGroundEffect();
               } else {
                    console.warn("initializeBurningGroundEffect function not found!");
               }

               this.addLogEntry(burningGroundEffect.description || "The ground burns beneath the players!", "stage-effect"); // Use description from JSON
               const burningDamage = 200; // Default or get from JSON if added later
               const playerChars = [...this.gameState.playerCharacters]; // Create copy

               playerChars.forEach(playerChar => {
                   if (!playerChar.isDead()) {
                       // Apply damage directly
                       const originalHp = playerChar.stats.currentHp;
                       playerChar.stats.currentHp = Math.max(0, playerChar.stats.currentHp - burningDamage);
                       const actualDamage = originalHp - playerChar.stats.currentHp;
                       updateCharacterUI(playerChar); // Update UI immediately

                       // Play damage VFX
                       const charElement = document.getElementById(`character-${playerChar.id}`);
                       if (charElement) {
                           const damageVfx = document.createElement('div');
                           damageVfx.className = 'damage-vfx stage-damage';
                           damageVfx.textContent = `-${actualDamage}`;
                           charElement.appendChild(damageVfx);
                           setTimeout(() => damageVfx.remove(), 1000);
                       }

                       this.addLogEntry(`${playerChar.name} takes ${actualDamage} damage from Burning Ground.`, "stage-effect");

                       if (playerChar.isDead()) {
                           this.addLogEntry(`${playerChar.name} succumbed to the flames!`, "stage-effect");
                           // Mark as dead in UI instead of removing
                           const charElement = document.getElementById(`character-${playerChar.id}`);
                           if (charElement) {
                               charElement.classList.add('dead');
                           }
                           // this.uiManager.removeCharacter(playerChar);
                           // Check game over immediately after a character dies from stage effect
                           if(this.checkGameOver()) return; // Stop processing if game over
                       }
                   }
               });
               // We no longer filter out dead characters
               // this.gameState.playerCharacters = this.gameState.playerCharacters.filter(p => !p.isDead());
           }
           // --- END MODIFICATION ---

           // --- NEW: Handle 'It finally rains!' modifier ---
           const rainModifier = this.stageManager?.getStageModifier('it_finally_rains');
           if (rainModifier) {
               this.addLogEntry("The rain provides soothing relief.", "stage-effect positive");
               this.gameState.playerCharacters.forEach(playerChar => {
                   if (!playerChar.isDead()) {
                       const healAmount = Math.floor(playerChar.stats.maxHp * 0.03);
                       if (healAmount > 0) {
                           playerChar.heal(healAmount, null, { passiveSource: rainModifier.id, isStageEffect: true, hideLog: true }); // Pass hideLog
                           this.addLogEntry(`${playerChar.name} heals ${healAmount} HP from the rain.`, "stage-effect heal");
                           // Show custom rain healing VFX
                           this.showRainHealVFX(playerChar, healAmount);
                       }
                   }
               });
           }
           // --- END NEW ---

           // Add checks for other stage effects here in the future
       }
       // --- END applyStageEffects ---

       // Check if the game is over
       checkGameOver() {
           let gameOver = false;
           let isVictory = false;
           const urlParams = new URLSearchParams(window.location.search); // Get URL params here
           const storyId = urlParams.get('storyId');
           const returnUrl = urlParams.get('returnUrl');
           
           // --- DEBUG LOGGING START ---
           console.log('[GameManager] checkGameOver called.');
           if (!this.gameState || !this.gameState.playerCharacters || !this.gameState.aiCharacters) {
                console.error('[GameManager] checkGameOver: Game state is not fully initialized!');
                return false; // Cannot determine game over state
           }
           
           const playerStatus = this.gameState.playerCharacters.map(c => ({ id: c.id, hp: c.stats.currentHp, dead: c.isDead() }));
           const aiStatus = this.gameState.aiCharacters.map(c => ({ id: c.id, hp: c.stats.currentHp, dead: c.isDead() }));
           console.log('[GameManager] Player Status:', JSON.stringify(playerStatus));
           console.log('[GameManager] AI Status:', JSON.stringify(aiStatus));
           // --- DEBUG LOGGING END ---

           // Check for player defeat (use loss conditions from stage data if available)
           const lossConditions = this.stageManager?.currentStage?.objectives?.lossConditions || [{ type: "allPlayersDefeated" }]; // Default if none defined
           for (const condition of lossConditions) {
               if (condition.type === "allPlayersDefeated") {
                   const allPlayersDead = this.gameState.playerCharacters.length > 0 && this.gameState.playerCharacters.every(char => char.isDead());
                   if (allPlayersDead) {
                       console.log('[GameManager] checkGameOver: Loss condition met - allPlayersDefeated.');
                       gameOver = true;
                       isVictory = false;
                       break; // Found a loss condition, no need to check others
                   }
               }
               // Add other loss condition types here if needed (e.g., turn limit)
           }

           // Check for player victory (use win conditions from stage data if available)
           if (!gameOver) { // Only check for victory if not already lost
                const winConditions = this.stageManager?.currentStage?.objectives?.winConditions || [{ type: "allEnemiesDefeated" }]; // Default if none defined
                
                for (const condition of winConditions) {
                    // --- Corrected type check --- 
                    if (condition.type === "allEnemiesDefeated") { // <-- Changed this line
                         const allAIDead = this.gameState.aiCharacters.length > 0 && this.gameState.aiCharacters.every(char => char.isDead());
                         if (allAIDead) {
                             console.log('[GameManager] checkGameOver: Win condition met - allEnemiesDefeated.'); // <-- Updated log message
                             gameOver = true;
                             isVictory = true;
                             break; // Found a win condition
                         }
                    } else if (condition.type === "enemyDefeated") {
                        // Check both id and instanceId to find the target enemy
                        const targetEnemy = this.gameState.aiCharacters.find(char => 
                            char.id === condition.targetId || 
                            (char.instanceId && char.instanceId.startsWith(condition.targetId))
                        );
                        if (targetEnemy && targetEnemy.isDead()) {
                            console.log(`[GameManager] checkGameOver: Win condition met - enemyDefeated (Target ID: ${condition.targetId}, Instance ID: ${targetEnemy.instanceId}).`);
                            gameOver = true;
                            isVictory = true;
                            break; // Found a win condition
                        }
                    }
                    // Add other win condition types here if needed (e.g., survive X turns)
                }
           }
           
           if (gameOver) {
                // --- DEBUG LOGGING ---
                console.log(`[GameManager] checkGameOver: Game Over detected. Victory: ${isVictory}`);
                console.log('[GameManager] Attempting to save battle result...');
                // --- DEBUG LOGGING END ---
               
               // Save result (especially important for story mode)
               this.saveBattleResultToFirebase(isVictory)
                   .then(async (saveSuccess) => { // Check if save was successful (optional, assuming it returns true/false or throws)
                       // --- DEBUG LOGGING ---
                       console.log(`[GameManager] Battle result saved (Success: ${saveSuccess}). Showing Game Over screen...`);
                       // --- DEBUG LOGGING END ---
                       // Pass context to the UIManager's showGameOverScreen
                       this.uiManager.showGameOverScreen(isVictory, { storyId, returnUrl }); 
                       
                       // Maybe clear log AFTER showing screen so user can see final messages? Or maybe not clear at all?
                       // this.clearBattleLog(); // Consider removing or moving this clear
                   })
                   .catch(error => {
                       // --- DEBUG LOGGING ---
                       console.error('[GameManager] Error saving battle result, but still showing Game Over screen.', error);
                       // --- DEBUG LOGGING END ---
                       // Still show the game over screen even if saving failed, pass context
                       this.uiManager.showGameOverScreen(isVictory, { storyId, returnUrl }); 
                       // this.clearBattleLog(); 
                   });
               
               return true; // Game is over
           }
           
           // --- DEBUG LOGGING ---
           // console.log('[GameManager] checkGameOver: Game not over.'); // Optional: Can be noisy
           // --- DEBUG LOGGING END ---
           return false; // Game is not over
       }

       // Add a log entry
       addLogEntry(message, className = '') {
           const logElement = document.getElementById('battle-log');
           const entry = document.createElement('div');
           entry.className = `log-entry ${className}`;
           
           // Create message text element
           const messageText = document.createElement('span');
           messageText.className = 'log-message';
           messageText.textContent = message;
           entry.appendChild(messageText);
           
           // Add timestamp (in format HH:MM:SS)
           const now = new Date();
           const hours = String(now.getHours()).padStart(2, '0');
           const minutes = String(now.getMinutes()).padStart(2, '0');
           const seconds = String(now.getSeconds()).padStart(2, '0');
           const timestamp = `${hours}:${minutes}:${seconds}`;
           
           const timestampElement = document.createElement('span');
           timestampElement.className = 'battle-log-timestamp';
           timestampElement.textContent = timestamp;
           entry.appendChild(timestampElement);
           
           logElement.appendChild(entry);
           
           // Auto-scroll to bottom
           const contentElement = document.querySelector('.battle-log-content');
           if (contentElement) {
               contentElement.scrollTop = contentElement.scrollHeight;
           }
           
           // Flash the header for important messages
           if (className === 'critical' || className === 'system') {
               const headerElement = document.querySelector('.battle-log-header');
               if (headerElement) {
                   headerElement.classList.add('flash');
                   setTimeout(() => {
                       headerElement.classList.remove('flash');
                   }, 500);
               }
           }
       }

       // Clear battle log
       clearBattleLog() {
           const logElement = document.getElementById('battle-log');
           logElement.innerHTML = '';
       }

       // Auto-select the most appropriate character based on current game state
       autoSelectCharacter() {
           // Only works during player phase
           if (this.gameState.phase !== 'player' || !this.isGameRunning) {
               return false;
           }
           
           // Filter characters that haven't acted yet and aren't stunned
           const availableCharacters = this.gameState.playerCharacters.filter(char => {
               return !this.actedCharacters.includes(char.id) && !char.isStunned() && !char.isDead();
           });
           
           if (availableCharacters.length === 0) {
               this.uiManager.addLogEntry("No available characters to select.");
               return false;
           }
           
           let bestCharacter = null;
           let bestScore = -Infinity;
           
           // Analyze game state to evaluate which character would be most effective
           availableCharacters.forEach(character => {
               let score = 0;
               
               // Get available abilities (not on cooldown and have enough mana)
               const availableAbilities = character.abilities.filter(ability => {
                   return ability.currentCooldown === 0 && character.stats.currentMana >= ability.manaCost;
               });
               
               // Check if any enemies are low on health (below 30%)
               const lowHealthEnemies = this.gameState.aiCharacters.filter(enemy => {
                   return !enemy.isDead() && (enemy.stats.currentHp / enemy.stats.maxHp) < 0.3;
               });
               
               // Check if any allies are low on health (below 40%)
               const lowHealthAllies = this.gameState.playerCharacters.filter(ally => {
                   return !ally.isDead() && (ally.stats.currentHp / ally.stats.maxHp) < 0.4;
               });
               
               // Factor 1: Available offensive abilities
               const offensiveAbilities = availableAbilities.filter(ability => {
                   return ability.targetType === 'enemy' || ability.targetType === 'all_enemies';
               });
               
               score += offensiveAbilities.length * 5;
               
               // Factor 2: Available healing abilities when allies need healing
               if (lowHealthAllies.length > 0) {
                   const healingAbilities = availableAbilities.filter(ability => {
                       return ability.targetType === 'ally' || ability.targetType === 'ally_or_self' || 
                              ability.targetType === 'all_allies' || ability.targetType === 'self';
                   });
                   
                   score += healingAbilities.length * 10; // Higher priority for healing when needed
               }
               
               // Factor 3: Character's current health ratio
               const healthRatio = character.stats.currentHp / character.stats.maxHp;
               if (healthRatio < 0.3) {
                   // Low health is risky, reduce score
                   score -= 10;
               } else {
                   // Healthy characters are better choices
                   score += healthRatio * 5;
               }
               
               // Factor 4: Character can deal damage to kill low health enemies
               if (lowHealthEnemies.length > 0 && offensiveAbilities.length > 0) {
                   score += 15; // High priority for finishing off enemies
               }
               
               // Factor 5: Character with AoE abilities when multiple enemies present
               if (this.gameState.aiCharacters.filter(enemy => !enemy.isDead()).length > 1) {
                   const aoeAbilities = availableAbilities.filter(ability => {
                       return ability.targetType === 'all_enemies';
                   });
                   
                   score += aoeAbilities.length * 8;
               }
               
               // Update best character if this one has a higher score
               if (score > bestScore) {
                   bestScore = score;
                   bestCharacter = character;
               }
           });
           
           // If we found a good character, select it
           if (bestCharacter) {
               return this.selectCharacter(bestCharacter);
           }
           
           // Fallback: select first available character
           return this.selectCharacter(availableCharacters[0]);
       }
       
       // Toggle auto-select character feature
       toggleAutoSelect() {
           this.autoSelectEnabled = !this.autoSelectEnabled;
           
           if (this.autoSelectEnabled) {
               this.uiManager.addLogEntry(`Auto character select enabled. Characters will be automatically selected at turn start and after abilities.`, 'system');
           } else {
               this.uiManager.addLogEntry(`Auto character select disabled.`, 'system');
           }
           
           if (this.autoSelectEnabled && this.gameState.phase === 'player' && !this.gameState.selectedCharacter) {
               // If enabled and no character selected, immediately select one
               this.autoSelectCharacter();
           }
           
           // Update UI to show auto-select status
           this.uiManager.updateAutoSelectButton(this.autoSelectEnabled);
           
           return this.autoSelectEnabled;
       }

       // --- Sound Management ---
       
       // Preload sounds to improve performance
       async preloadSound(soundPath) {
           if (this.soundBuffers[soundPath] || this.soundsLoading[soundPath]) {
               return; // Already loaded or loading
           }
           
           this.soundsLoading[soundPath] = true;
           
           try {
               const response = await fetch(soundPath);
               if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status} for ${soundPath}`);
               }
               const arrayBuffer = await response.arrayBuffer();
               
               // Decode audio data in the main thread
               const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
               
               this.soundBuffers[soundPath] = audioBuffer;
               console.log(`Sound preloaded successfully: ${soundPath}`);
               
           } catch (error) {
               console.error(`Error preloading sound ${soundPath}:`, error);
           } finally {
               delete this.soundsLoading[soundPath]; // Remove from loading tracker
           }
       }
       
       // Play a sound effect
       async playSound(soundPath, volume = 1.0) {
           try {
               // Apply global volume setting to sound effects
               const adjustedVolume = volume * this.sfxVolume;
               
               // If audio context is suspended (browser policy), resume it
               if (this.audioContext.state === 'suspended') {
                   await this.audioContext.resume();
               }
               
               // Check if sound is already in buffer
               if (this.soundBuffers[soundPath]) {
                   this.playBufferedSound(this.soundBuffers[soundPath], adjustedVolume);
                   return;
               }
               
               // Check if sound is currently loading
               if (this.soundsLoading[soundPath]) {
                   // Wait for it to complete loading
                   const buffer = await this.soundsLoading[soundPath];
                   this.playBufferedSound(buffer, adjustedVolume);
                   return;
               }
               
               // Start loading the sound
               const loadPromise = this.loadSound(soundPath);
               this.soundsLoading[soundPath] = loadPromise;
               
               // Wait for it to load, then play
               const buffer = await loadPromise;
               // Cache the buffer
               this.soundBuffers[soundPath] = buffer;
               // Clear from loading list
               delete this.soundsLoading[soundPath];
               // Play the sound
               this.playBufferedSound(buffer, adjustedVolume);
           } catch (error) {
               console.error(`Error playing sound ${soundPath}:`, error);
           }
       }

       // Play sound from buffer with volume control
       playBufferedSound(buffer, volume) {
           try {
               // Create a source node
               const source = this.audioContext.createBufferSource();
               source.buffer = buffer;
               
               // Create a gain node for volume control
               const gainNode = this.audioContext.createGain();
               gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
               
               // Connect nodes: source -> gain -> destination
               source.connect(gainNode);
               gainNode.connect(this.audioContext.destination);
               
               // Play the sound
               source.start(0);
           } catch (error) {
               console.error('Error playing buffered sound:', error);
           }
       }
       
       // Load sound file and return AudioBuffer
       async loadSound(soundPath) {
           try {
               const response = await fetch(soundPath);
               if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status}`);
               }
               
               const arrayBuffer = await response.arrayBuffer();
               const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
               
               return audioBuffer;
           } catch (error) {
               console.error(`Error loading sound ${soundPath}:`, error);
               throw error;
           }
       }

       // --- NEW: Helper function to save battle result to Firebase --- 
       async saveBattleResultToFirebase(isVictory) {
            // --- DEBUG LOGGING ---
            console.log(`[GameManager] saveBattleResultToFirebase called. Victory: ${isVictory}`);
            // --- DEBUG LOGGING END ---
           const userId = getCurrentUserId();
           if (!userId) {
               console.log('[GameManager] User not logged in. Cannot save battle result.');
               return;
           }

           const urlParams = new URLSearchParams(window.location.search);
           const storyId = urlParams.get('storyId');
           const stageIndexStr = urlParams.get('stageIndex'); // Get as string
           const returnUrl = urlParams.get('returnUrl'); // Used for navigation logic
           const stageId = this.stageManager?.currentStage?.id || urlParams.get('stage');

           // If in story mode context
           try { // Added try block around the main logic
                if (storyId && stageIndexStr !== null && returnUrl) {
                    // --- DEBUG LOGGING ---
                    console.log(`[GameManager] Saving result for Story: ${storyId}, Stage Index: ${stageIndexStr}`);
                    // --- DEBUG LOGGING END ---

                    const stageIndex = parseInt(stageIndexStr, 10); // Parse index to integer
                    if (isNaN(stageIndex)) {
                         console.error("[GameManager] Invalid stageIndex passed in URL params:", stageIndexStr);
                         return; // Don't save if index is invalid
                    }

                    const resultPath = `users/${userId}/lastBattleResult`;
                    
                    // Get final team state ONLY if it's a victory
                    let finalTeamState = null;
                    if (isVictory) {
                         finalTeamState = this.gameState.playerCharacters
                            .filter(char => !char.isDead()) // Only include survivors
                            .map(char => ({
                                id: char.id,
                                currentHP: char.stats.currentHp,
                                currentMana: char.stats.currentMana,
                                // --- IMPORTANT: Include stats to persist modifications ---
                                stats: { ...char.stats } 
                                // --- END IMPORTANT ---
                            }));
                          // --- DEBUG LOGGING ---
                          console.log('[GameManager] Final Team State (Victory):', JSON.stringify(finalTeamState));
                          // --- DEBUG LOGGING END ---
                    } else {
                        // --- DEBUG LOGGING ---
                        console.log('[GameManager] Defeat detected, finalTeamState will be null.');
                        // --- DEBUG LOGGING END ---
                    }

                    const battleResult = {
                        storyId: storyId,
                        stageIndex: stageIndex, // Save the numeric index
                        victory: isVictory,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        // Only include finalTeamState if it's a victory
                        ...(isVictory && { finalTeamState: finalTeamState }) 
                    };

                    // --- DEBUG LOGGING ---
                    console.log('[GameManager] Battle Result object prepared:', JSON.stringify(battleResult));
                    // --- DEBUG LOGGING END ---
                    
                    try {
                         // --- DEBUG LOGGING ---
                         console.log(`[GameManager] Attempting to set data at path: ${resultPath}`);
                         // --- DEBUG LOGGING END ---
                        await firebaseDatabase.ref(resultPath).set(battleResult);
                        console.log(`[GameManager] Battle result for story ${storyId}, stage ${stageIndex} saved to Firebase.`);
                        return true; // Indicate success
                    } catch (error) {
                         console.error(`[GameManager] Firebase Error: Failed to save battle result for story ${storyId}:`, error);
                         // Re-throw the error so the caller (.then/.catch in checkGameOver) knows it failed
                         throw error; 
                    }
                }
                // For standalone battles (not in story mode)
                else if (stageId) {
                    console.log(`[GameManager] Saving standalone battle result for stage: ${stageId}`);
                    
                    try {
                        // Path for standalone battle results
                        const resultsPath = `users/${userId}/battleResults/${stageId}`;
                        
                        // Calculate survivors count
                        const survivors = isVictory ? 
                            this.gameState.playerCharacters.filter(char => !char.isDead()).length : 0;
                        
                        // Get team composition
                        const teamComposition = this.gameState.playerCharacters.map(char => char.id);
                        
                        const battleData = {
                            victory: isVictory,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            turns: this.gameState.turn,
                            survivors: survivors,
                            teamComposition: teamComposition
                        };
                        
                        // Save the battle result
                        await firebaseDatabase.ref(resultsPath).push(battleData);
                        console.log(`[GameManager] Standalone battle result for stage ${stageId} saved to Firebase.`);
                        return true; // Indicate success
                    } catch (error) {
                        console.error(`[GameManager] Firebase Error: Failed to save standalone battle result for stage ${stageId}:`, error);
                        // Re-throw the error so the caller knows it failed
                        throw error;
                    }
                }
                else {
                    console.log('[GameManager] No stage ID identified. Skipping Firebase save.');
                    return false; // Indicate save was skipped
                }
           } catch (error) { // Catch errors from the outer logic (e.g., parsing stageIndex)
                console.error(`[GameManager] Error during saveBattleResultToFirebase setup:`, error);
                throw error; // Re-throw to be caught by checkGameOver
           }
       }
       // --- END NEW --- 

       /**
        * Resets the game state to its initial values.
        */
       resetGame() {
           console.log("[GameManager] Resetting game...");
           this.isGameOver = false;
           this.isGameRunning = false;
           this.actedCharacters = [];
           this.deadCharactersLogged = []; // Reset logged deaths
           this.gameState = {
               turn: 1,
               phase: 'player',
               playerCharacters: [],
               aiCharacters: [],
               selectedCharacter: null,
               selectedAbility: null,
               battleLog: []
           };
           this.currentTurnActions = [];
           this.selectedCharacter = null;
           this.selectedAbilityIndex = -1;
           this.autoSelectEnabled = false; 
           this.currentActionTarget = null;

           // Clear UI elements managed by GameManager or UIManager if necessary
           if (this.uiManager) {
                this.uiManager.clearBattleLog();
                // Reset other UI elements as needed (e.g., turn counter, phase display)
                this.uiManager.updateTurnCounter(1);
                this.uiManager.updatePhase('player');
                this.uiManager.clearSelection();
           } else {
               // Fallback if UIManager isn't ready (shouldn't happen in normal flow)
                const logElement = document.getElementById('battle-log');
                if (logElement) logElement.innerHTML = '';
                const turnElement = document.getElementById('turn-count');
                if (turnElement) turnElement.textContent = '1';
                const phaseElement = document.getElementById('battle-phase');
                if (phaseElement) phaseElement.textContent = "Player's Turn";
           }

           console.log("Game state reset.");
       }

       // --- NEW DEBUG FUNCTION ---
       debugKillAllEnemies() {
           if (!this.isGameRunning || this.isGameOver) return;

           console.warn("[DEBUG] Killing all enemies via debug command (Num2).");
           this.addLogEntry("DEBUG: Defeating all enemies!", 'debug');

           this.gameState.aiCharacters.forEach(enemy => {
               if (!enemy.isDead()) {
                   // Set HP to 0 to kill, bypassing normal damage calculation/effects
                   enemy.stats.currentHp = 0; 
                   this.uiManager.updateCharacterUI(enemy);
               }
           });

           // Check for game over immediately after setting HP
           this.checkGameOver();
       }
       // --- END NEW DEBUG FUNCTION ---

       handleCharacterDeath(character) {
           const log = this.addLogEntry.bind(this);
           log(`${character.name} has been defeated!`, 'death');

           // --- Trigger Death Passive FIRST --- 
           // We need to trigger this *before* modifying game state arrays 
           // in case the passive needs access to the character's original team/opponents.
           let passiveTriggered = false;
           console.log(`[Passive Check - ${character.name}] Checking passive:`, character.passive); // Log 1
           if (character.passive && character.passive.id && window.PassiveFactory) {
               console.log(`[Passive Check - ${character.name}] Found passive ID: ${character.passive.id}. PassiveFactory exists.`); // Log 2
               const PassiveHandlerClass = window.PassiveFactory.getPassiveHandlerClass(character.passive.id);
               // --- MODIFIED LOG --- 
               console.log(`[Passive Check - ${character.name}] Retrieved handler class:`, PassiveHandlerClass, ` | Registered IDs:`, Array.from(window.PassiveFactory.registeredPassives.keys())); // Log 3
               // --- END MODIFIED LOG --- 
               if (PassiveHandlerClass) {
                   try {
                       const handler = new PassiveHandlerClass(character);
                       console.log(`[Passive Check - ${character.name}] Instantiated handler:`, handler); // Log 4
                       if (typeof handler.onDeath === 'function') {
                           console.log(`[Passive Trigger] Found onDeath for ${character.passive.id}. Triggering...`); // Log 5
                           handler.onDeath(character, this); 
                           passiveTriggered = true;
                       } else {
                           console.warn(`[Passive Check - ${character.name}] Handler exists but onDeath is not a function. Type: ${typeof handler.onDeath}`); // Log 6a
                           console.warn(`Passive handler for ${character.passive.id} does not have an onDeath method.`);
                       }
                   } catch (error) {
                       console.error(`[Passive Check - ${character.name}] Error during handler instantiation or onDeath call:`, error); // Log 6b
                       console.error(`Error executing onDeath passive for ${character.passive.id}:`, error);
                   }
               } else {
                    console.log(`[Passive Check - ${character.name}] No specific passive handler CLASS found registered for ID: ${character.passive.id}`); // Log 6c
                    // console.log(`No specific passive handler found for ${character.passive.id} on death.`);
               }
           } else if (character.passive && character.passive.id) {
                console.warn(`[Passive Check - ${character.name}] PassiveFactory missing?`, window.PassiveFactory); // Log 7a
                console.warn("PassiveFactory not found, cannot trigger death passive.");
           } else {
                console.log(`[Passive Check - ${character.name}] Passive check failed: passive=${!!character.passive}, id=${character.passive?.id}`); // Log 7b
           }
           // --- End Trigger Death Passive --- 

           // Remove character from game state *after* triggering passive
           // Find which team the character belonged to
           let found = false;
           if (character.isAI) {
               const index = this.gameState.aiCharacters.findIndex(c => (c.instanceId || c.id) === (character.instanceId || character.id));
               if (index !== -1) {
                   // Don't splice, just mark as dead if needed, state update handles visuals
                   // this.gameState.aiCharacters.splice(index, 1);
                   console.log(`Character ${character.name} found in aiCharacters.`);
                   found = true;
               } else {
                    console.log(`Character ${character.name} NOT found in aiCharacters array for removal/update.`);
                    console.log("Current aiCharacters:", this.gameState.aiCharacters.map(c => ({id: c.id, instanceId: c.instanceId})));
               }
           } else {
               const index = this.gameState.playerCharacters.findIndex(c => c.id === character.id);
               if (index !== -1) {
                   // Don't splice, just mark as dead
                   // this.gameState.playerCharacters.splice(index, 1);
                    console.log(`Character ${character.name} found in playerCharacters.`);
                   found = true;
               } else {
                    console.log(`Character ${character.name} NOT found in playerCharacters array for removal/update.`);
                    console.log("Current playerCharacters:", this.gameState.playerCharacters.map(c => ({id: c.id, instanceId: c.instanceId})));
               }
           }

           if (found) {
               // Instead of removing the element, update its UI to reflect the dead state
               // this.uiManager.removeCharacter(character); // REMOVED
               this.uiManager.updateCharacterUI(character); // Ensure UI reflects HP 0 and dead state
               console.log(`Updated UI for deceased character: ${character.name}`);

               // --- ADDED: Special handling for crow despawn ---
               if (character.id === 'crow') {
                   // Use a slight delay to allow death animations/effects to play
                   setTimeout(() => {
                       this.uiManager.removeCharacter(character);
                       log(`${character.name} (a crow) has despawned.`);
                   }, 500); // Delay in milliseconds (adjust as needed)
               }
               // --- END ADDED ---
           } else {
                console.warn(`[handleCharacterDeath] Could not find character ${character.name} (ID: ${character.id}, InstanceID: ${character.instanceId}) in game state arrays.`);
           }

           // Check for game over after handling death
           this.checkGameOver();

           // Update the End Turn button state, as a death might change who can act
           this.uiManager.updateEndTurnButton();

           console.log(`${character.name} (instanceId: ${character.instanceId}) has been removed from the game state.`);
           // Check for game over after removing the character
           this.checkGameOver();

           // <<< Dispatch CharacterDied event >>>
           const deathEvent = new CustomEvent('CharacterDied', {
               detail: { character: character }
           });
           document.dispatchEvent(deathEvent);
           // <<< End Dispatch >>>
       }

       /**
        * Gets the opposing team relative to the given character.
        * @param {Character} character - The character to find opponents for.
        * @returns {Character[]} - Array of opponent characters.
        */
       getOpponents(character) {
           return character.isAI ? this.gameState.playerCharacters : this.gameState.aiCharacters;
       }

       /**
        * Gets the allied team relative to the given character (including the character itself if alive).
        * @param {Character} character - The character to find allies for.
        * @returns {Character[]} - Array of allied characters.
        */
       getAllies(character) {
           return character.isAI ? this.gameState.aiCharacters : this.gameState.playerCharacters;
       }

       applyDamage(amount, type, caster = null, options = {}) { // Added options object
           if (this.isDead()) {
               return 0;
           }

           // Check if character can dodge
           const dodgeChance = this.stats.dodgeChance || 0;
           const dodgeRoll = Math.random();
           
           // Process dodge - if character has dodge chance and roll is successful
           if (dodgeChance > 0 && dodgeRoll < dodgeChance) {
               console.log(`${this.name} dodged the attack!`);
               
               // Show dodge VFX
               this.showDodgeVFX();
               
               // Add log entry
               addLogEntry(`${this.name} dodged the attack!`, 'system');
               
               return 0; // No damage taken
           }

           // Rest of the damage application logic remains the same...
       }
       
       // Add new method to show dodge VFX
       showDodgeVFX() {
           // Get character element
           const charElement = document.getElementById(`character-${this.instanceId || this.id}`);
           if (!charElement) return;
           
           // Create VFX container
           const dodgeVfx = document.createElement('div');
           dodgeVfx.className = 'dodge-vfx';
           
           // Create the DODGE! text
           const dodgeText = document.createElement('div');
           dodgeText.className = 'dodge-text';
           dodgeText.textContent = 'DODGE!';
           dodgeVfx.appendChild(dodgeText);
           
           // Add to character element
           charElement.appendChild(dodgeVfx);
           
           // Remove after animation completes
           setTimeout(() => {
               if (dodgeVfx.parentNode === charElement) {
                   charElement.removeChild(dodgeVfx);
               }
           }, 700); // Slightly longer than animation duration to ensure it completes
       }

       // Show VFX for rain healing (add this method after applyStageEffects)
       showRainHealVFX(character, amount) {
           const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
           if (!characterElement) return;
           
           // Create heal VFX with rain style
           const vfx = document.createElement('div');
           vfx.className = 'heal-vfx rain-heal-vfx';
           vfx.textContent = `+${amount}`;
           
           // Add the rain droplets
           const rainDrops = document.createElement('div');
           rainDrops.className = 'rain-heal-particles';
           vfx.appendChild(rainDrops);
           
           // Append to character element
           characterElement.appendChild(vfx);
           
           // Remove after animation
           setTimeout(() => {
               vfx.remove();
           }, 2000);
       }
   }

   // AI Manager for handling AI turns
   class AIManager {
       constructor(gameManager) {
           this.gameManager = gameManager;
       }

       async executeAITurn() {
           try {
               this.gameManager.gameState.phase = 'ai';
               this.gameManager.uiManager.updatePhase('ai');

               // Process AI effects at start of their turn WITH duration reduction
               this.gameManager.gameState.aiCharacters.forEach(aiChar => {
                   if (!aiChar.isDead()) {
                       // Process buffs/debuffs, reduce duration=true, regenerate resources
                       aiChar.processEffects(true, true);
                       // Reduce ability cooldowns
                       aiChar.abilities.forEach(ability => ability.reduceCooldown());
                       // Update UI after processing
                       this.gameManager.uiManager.updateCharacterUI(aiChar);
                   }
               });

               // Show planning phase overlay
               this.gameManager.uiManager.showPlanningPhase(true);
               
               // Get list of AI characters that can act (not stunned)
               const activeAICharacters = this.gameManager.gameState.aiCharacters.filter(char => {
                   if (char.isStunned()) {
                       this.gameManager.addLogEntry(`${char.name} is stunned and cannot act this turn.`, 'enemy-turn');
                       return false;
                   }
                   return true;
               });
               
               // Plan actions for each AI character
               const actions = [];
               for (const aiChar of activeAICharacters) {
                   // Show planning animation for this character
                   this.gameManager.uiManager.showCharacterPlanning(aiChar, true);
                   
                   // Plan the action with delay for visualization
                   await this.delay(800);
                   const plannedAction = await this.planAIAction(aiChar);
                   
                   // If an action was planned (not null and no error)
                   if (plannedAction && !plannedAction.error) {
                       // --- NEW: Construct the action object expected by executeAction --- 
                       const casterIndex = this.gameManager.gameState.aiCharacters.findIndex(c => c.instanceId === aiChar.instanceId);
                       const abilityIndex = aiChar.abilities.findIndex(a => a.id === plannedAction.ability.id);

                       if (casterIndex !== -1 && abilityIndex !== -1) {
                            const finalAction = {
                                casterIndex: casterIndex,
                                abilityIndex: abilityIndex,
                                target: plannedAction.target // Use the target from the plan
                            };
                            actions.push(finalAction);
                       } else {
                            console.error(`[AI EXECUTE TURN] Failed to find caster or ability index for planned action by ${aiChar.name}:`, plannedAction);
                       }
                       // --- END NEW --- 
                   } else if (plannedAction && plannedAction.error) {
                        // Log the reason why the action couldn't be fully planned (e.g., no target)
                        console.log(`[AI EXECUTE TURN] Skipping action for ${aiChar.name} (${plannedAction.ability.name}): ${plannedAction.error}`);
                        // Optionally add to game log
                        // this.gameManager.addLogEntry(`${aiChar.name} tried to use ${plannedAction.ability.name} but could not: ${plannedAction.error}`, 'enemy-turn');
                   }
                   
                   // Hide planning animation when done
                   this.gameManager.uiManager.showCharacterPlanning(aiChar, false);
                   
                   // Add small delay between planning for each character
                   await this.delay(300);
               }
               
               // Hide planning phase overlay
               this.gameManager.uiManager.showPlanningPhase(false);
               
               // Execute each planned action with delay between them
               for (const action of actions) {
                   await this.executeAction(action);
                   await this.delay(1000); // Delay between AI actions
               }
               
               // End AI turn
               this.gameManager.endAITurn();
               
               return true;
           } catch (error) {
               console.error('Error in AI turn:', error);
               this.gameManager.uiManager.showPlanningPhase(false);
               this.gameManager.endAITurn();
               return false;
           }
       }

       // Plan an action for an AI character (but don't execute it yet)
       async planAIAction(aiChar) {
           // Simple AI: Use a random available ability on a valid target
           const availableAbilities = aiChar.abilities.filter(ability =>
               ability.currentCooldown <= 0 &&
               aiChar.stats.currentMana >= ability.manaCost &&
               !ability.isDisabled // Added check for disabled abilities
           );

           if (availableAbilities.length === 0) {
               console.log(`[AI Planner] ${aiChar.name} has no available abilities.`);
               return null; // No action possible
           }

           // Randomly select an ability
           const randomIndex = Math.floor(Math.random() * availableAbilities.length);
           const selectedAbility = availableAbilities[randomIndex];
           console.log(`[AI Planner] Randomly selected ${selectedAbility.name} for ${aiChar.name}`);

           let possibleTargets = [];
           const allPlayerChars = this.gameManager.gameState.playerCharacters.filter(c => !c.isDead() && !c.isUntargetable());
           const allAIChars = this.gameManager.gameState.aiCharacters.filter(c => !c.isDead() && !c.isUntargetable());

           // Determine possible targets based on ability type
           switch (selectedAbility.targetType) {
               case 'enemy':
                   possibleTargets = allPlayerChars;
                   break;
               case 'ally':
                   possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Exclude self
                   break;
               case 'self':
                   possibleTargets = [aiChar]; // Only self
                   break;
               case 'any':
                   possibleTargets = [...allPlayerChars, ...allAIChars];
                   break;
               case 'any_except_self': // Added this case
                   possibleTargets = [
                       ...allPlayerChars, // All enemies
                       ...allAIChars.filter(c => c.id !== aiChar.id) // All allies except self
                   ];
                   break;
               case 'all_enemies':
               case 'all': // Add 'all' case to target enemies
                   possibleTargets = allPlayerChars; // Target the group of enemies
                   break;
               case 'all_allies':
                   possibleTargets = allAIChars; // Target the group
                   break;
               case 'all_allies_except_self': // Added this case for Carrot Power-up
                   possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Target the group, excluding self
                   break;
               default:
                   console.error(` [AI Planner] Unknown target type '${selectedAbility.targetType}'`);
                   possibleTargets = []; // No valid target logic
                   break;
           }

           // Filter out untargetable characters again, just in case
           possibleTargets = possibleTargets.filter(c => c && !c.isDead() && !c.isUntargetable());

           if (possibleTargets.length === 0) {
                console.log(`[AI Planner Debug] No valid targets found for ${selectedAbility.name} (type: ${selectedAbility.targetType}) after filtering.`);
                console.log(`[AI Planner Debug] All Player Chars (alive, targetable): ${allPlayerChars.map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);
                console.log(`[AI Planner Debug] All AI Chars (alive, targetable, not self): ${allAIChars.filter(c => c.id !== aiChar.id).map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);

               return { ability: selectedAbility, target: null, error: 'No valid targets found' }; // Indicate no valid target
           }

           // Select a random target from the valid list for single-target abilities
           // For group abilities, we'll use the entire group later
           let selectedTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

           console.log(`[AI Planner Debug] Initial target selected for ${selectedAbility.name}: ${selectedTarget.name} (isAI: ${selectedTarget.isAI})`);

           // Handle AoE abilities - target the whole group
           if (selectedAbility.targetType === 'all_enemies') {
               selectedTarget = allPlayerChars; // Pass the array
           } else if (selectedAbility.targetType === 'all_allies') {
               selectedTarget = allAIChars; // Pass the array
           } else if (selectedAbility.targetType === 'all') { // Handle the new 'all' case
               selectedTarget = allPlayerChars; // Pass the array of player characters
           } else if (selectedAbility.targetType === 'all_allies_except_self') { // Handle Carrot Power-up case
               selectedTarget = allAIChars.filter(c => c.id !== aiChar.id); // Pass the filtered array
           }
           // For single target types (enemy, ally, self, any, any_except_self), selectedTarget remains the randomly chosen single character.

           if (selectedTarget && (!Array.isArray(selectedTarget) || selectedTarget.length > 0)) {
                const targetName = Array.isArray(selectedTarget) ? `${selectedTarget.length} targets` : selectedTarget.name;
                console.log(`[AI Planner] Planned action: ${selectedAbility.name} on ${targetName}`);
               return { ability: selectedAbility, target: selectedTarget };
           } else {
               console.log(`[AI Planner] Skipping action for ${selectedAbility.name}: No valid targets found.`);
               return null; // Skip action if no target found
           }
       }
       
       // Execute a previously planned action
        async executeAction(action) {
            if (!action || action.casterIndex === undefined || action.abilityIndex === undefined || action.target === undefined) {
                console.error("AI executeAction called with invalid or incomplete action:", action);
                this.gameManager.addLogEntry(`AI encountered an error retrieving planned action.`, 'error');
                return;
            }

            const gameState = this.gameManager.gameState; // Get gameState from gameManager
            const caster = gameState.aiCharacters[action.casterIndex];
            const ability = caster ? caster.abilities[action.abilityIndex] : null;
            let targetInfo = action.target; // Target from the planned action (can be object or array)

            if (!caster || !ability) {
                console.error("AI executeAction: Caster or Ability not found for action:", action);
                this.gameManager.addLogEntry(`AI encountered an error finding character or ability.`, 'error');
                return;
            }
            
            // --- VALIDATION CHECKS --- 
            if (caster.isDead() || caster.isStunned()) {
                this.gameManager.addLogEntry(`${caster.name} cannot execute action (dead or stunned).`, 'enemy-turn');
                return;
            }
            if (caster.stats.currentMana < ability.manaCost) {
                this.gameManager.addLogEntry(`${caster.name} does not have enough mana for ${ability.name}. Skipping action.`, 'enemy-turn');
                return;
            }
            if (ability.currentCooldown > 0) {
                 this.gameManager.addLogEntry(`${caster.name}'s ${ability.name} is still on cooldown (${ability.currentCooldown} turns). Skipping action.`, 'enemy-turn');
                 return;
            }
            if (ability.isDisabled) { 
                 this.gameManager.addLogEntry(`${caster.name}'s ${ability.name} is disabled. Skipping action.`, 'enemy-turn');
                 return;
            }
            // --- END VALIDATION CHECKS ---
            
            // --- TARGET RE-VALIDATION (Just before execution) ---
            let finalTargetInfo = null;
            const targetType = ability.targetType; // Use targetType from the ability itself
            
            if (targetType === 'self') {
                finalTargetInfo = caster.isDead() ? null : caster;
            } else if (targetType === 'enemy' || targetType === 'ally') {
                // Planned target was a single object
                const singleTarget = targetInfo;
                if (singleTarget && typeof singleTarget.isDead === 'function' && !singleTarget.isDead()) { // Added type check for isDead
                    finalTargetInfo = singleTarget;
                } else {
                    // Attempt to find a new random target if the original is dead
                    console.log(`[AI Execute] Original target ${singleTarget?.name} invalid. Retargeting for ${ability.name}...`);
                    if (targetType === 'enemy') {
                        const potentialEnemies = gameState.playerCharacters.filter(p => !p.isDead());
                        if (potentialEnemies.length > 0) finalTargetInfo = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
                    } else { // targetType === 'ally'
                        const potentialAllies = gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                        if (potentialAllies.length > 0) finalTargetInfo = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                        else finalTargetInfo = caster; // Fallback to self if no allies
                    }
                    if(finalTargetInfo) console.log(`[AI Execute] Re-targeted to ${finalTargetInfo.name}.`);
                }
            } else if (targetType === 'aoe_enemy' || targetType === 'all_enemies') {
                // Re-fetch living enemies just before execution
                finalTargetInfo = gameState.playerCharacters.filter(p => !p.isDead());
                console.log(`[AI Execute] Validating ${finalTargetInfo.length} living enemies for AoE.`);
            } else if (targetType === 'aoe_ally' || targetType === 'all_allies') {
                // Re-fetch living allies just before execution
                finalTargetInfo = gameState.aiCharacters.filter(a => !a.isDead());
                console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies for AoE.`);
             } else if (targetType === 'all') {
                 // Re-fetch all living characters just before execution
                 const livingEnemies = gameState.playerCharacters.filter(p => !p.isDead());
                 const livingAllies = gameState.aiCharacters.filter(a => !a.isDead());
                 finalTargetInfo = [...livingEnemies, ...livingAllies];
                 console.log(`[AI Execute] Validating ${finalTargetInfo.length} living characters for 'all'.`);
             } else if (targetType === 'all_allies_except_self') { // Added this case
                 // Re-fetch living allies excluding self just before execution
                 finalTargetInfo = gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                 console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies (excluding self) for AoE buff.`);
             } else {
                  console.warn(`[AI Execute] Unhandled target type ${targetType} during re-validation.`);
                  // Attempt to use original planned target if type is unknown, after checking if it's valid
                  if (targetInfo && typeof targetInfo.isDead === 'function' && !targetInfo.isDead()) {
                     finalTargetInfo = targetInfo; 
                  } else if (Array.isArray(targetInfo)) {
                     finalTargetInfo = targetInfo.filter(t => t && typeof t.isDead === 'function' && !t.isDead());
                     if (finalTargetInfo.length === 0) finalTargetInfo = null;
                  } else {
                     finalTargetInfo = null;
                  }
             }

            // Final check: If after re-validation, there are no targets for non-self abilities
            if (targetType !== 'self' && (!finalTargetInfo || (Array.isArray(finalTargetInfo) && finalTargetInfo.length === 0))) {
                this.gameManager.addLogEntry(`${caster.name} uses ${ability.name}, but there are no valid targets remaining.`, 'enemy-turn'); // Use gameManager
                // Skipping seems more logical if the ability couldn't execute.
                return; 
            }
            // --- END TARGET RE-VALIDATION ---

            // Log the action being taken (handle single target name vs array)
            let targetName = '';
             if (finalTargetInfo) {
                 if (Array.isArray(finalTargetInfo)) {
                     targetName = `${finalTargetInfo.length} targets`;
                 } else if (finalTargetInfo.name) {
                     targetName = `on ${finalTargetInfo.name}`;
                 }
             }
            this.gameManager.addLogEntry(`${caster.name} uses ${ability.name} ${targetName}.`, 'enemy-turn'); // Use gameManager

            // Use ability (pass the final validated target info)
            // Ensure useAbility is called on the correct Character instance
            const success = caster.useAbility(action.abilityIndex, finalTargetInfo); 

            if (success) {
                // Log cooldown only if successful
                if (ability.cooldown > 0) {
                     this.gameManager.addLogEntry(`${ability.name} is on cooldown for ${ability.cooldown} more turns.`, 'enemy-turn'); // Use gameManager
                }
            } else {
                // Log failure if useAbility returned false 
                this.gameManager.addLogEntry(`${caster.name} failed to use ${ability.name} (possible internal check failure).`, 'error');
            }
        }

        // Helper to create a delay
        async delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // UI Manager for handling game UI
    class UIManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
        }

        // Initialize UI manager
        initialize(setupEventHandlers = true) {
            // Get UI elements
            this.playerCharactersContainer = document.getElementById('player-characters-container');
            this.aiCharactersContainer = document.getElementById('ai-characters-container');
            this.turnCounter = document.getElementById('turn-count');
            this.battlePhaseElement = document.getElementById('battle-phase');
            this.endTurnButton = document.getElementById('end-turn-button');
            this.battleLog = document.getElementById('battle-log');
            
            // --- NEW: Initialize Character Stats Menu ---
            this.characterStatsMenu = document.getElementById('character-stats-menu');
            if (!this.characterStatsMenu) {
                console.log('[UIManager] Character stats menu element not found, creating it.');
                this.characterStatsMenu = document.createElement('div');
                this.characterStatsMenu.id = 'character-stats-menu';
                this.characterStatsMenu.className = 'character-stats-menu'; // Add class for styling
                this.characterStatsMenu.style.display = 'none'; // Start hidden
                document.body.appendChild(this.characterStatsMenu);
            
                // Add event listener to hide menu on escape key
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape' && this.characterStatsMenu && this.characterStatsMenu.style.display === 'block') {
                        this.characterStatsMenu.style.display = 'none';
                    }
                });
                
                // Add event listener to hide menu on click outside (use capture phase)
                document.addEventListener('click', (event) => {
                    if (this.characterStatsMenu && this.characterStatsMenu.style.display === 'block') {
                        const isClickInsideMenu = this.characterStatsMenu.contains(event.target);
                        // Prevent closing if clicking on the character that opened it (check character-slot)
                        const clickedCharSlot = event.target.closest('.character-slot'); 
                        
                        if (!isClickInsideMenu && !clickedCharSlot) {
                            this.characterStatsMenu.style.display = 'none';
                        }
                    }
                }, true);
                
            } else {
                console.log('[UIManager] Found existing character stats menu element.');
                this.characterStatsMenu.style.display = 'none'; // Ensure it starts hidden
            }
            // --- END NEW ---
            
            // Create auto-select button
            this.createAutoSelectButton();
            
            // Set up event handlers
            if (setupEventHandlers) {
                this.setupEventHandlers();
            }
            
            // Create planning phase overlay
            this.createPlanningPhaseOverlay();
            
            // Create stage modifiers UI if any are present
            this.createStageModifiersIndicator();
        }

        // Set up event handlers for UI elements
        setupEventHandlers() {
            // Event delegation for player characters
            document.getElementById('player-characters-container').addEventListener('click', (e) => {
                const charElement = this.findCharacterElement(e.target);
                if (charElement) {
                    // Use the unique instanceId stored in the dataset
                    const instanceId = charElement.dataset.instanceId; 
                    // Find character by instanceId
                    const character = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === instanceId);
                    if (character) {
                        // Check if we're in targeting mode
                        if (this.gameManager.gameState.selectedCharacter && this.gameManager.gameState.selectedAbility) {
                            // If a character and ability are already selected, this is a targeting action
                            this.gameManager.targetCharacter(character);
                        } else {
                            // Otherwise it's a character selection
                            this.gameManager.selectCharacter(character);
                        }
                    }
                }
            });
            
            // Event delegation for AI characters (for targeting)
            document.getElementById('ai-characters-container').addEventListener('click', (e) => {
                const charElement = this.findCharacterElement(e.target);
                if (charElement) {
                    // Use the unique instanceId stored in the dataset
                    const instanceId = charElement.dataset.instanceId;
                    // Find character by instanceId
                    const character = this.gameManager.gameState.aiCharacters.find(c => c.instanceId === instanceId);
                    if (character) {
                        this.gameManager.targetCharacter(character);
                    } else {
                        console.error(`Could not find AI character with instanceId: ${instanceId}`);
                        // Fallback or further debugging needed
                    }
                }
            });
            
            // End Turn button
            const endTurnButton = document.getElementById('end-turn-button');
            if (endTurnButton) {
                endTurnButton.addEventListener('click', () => {
                    // Only enable during player's turn and when game state exists
                    if (this.gameManager.gameState && this.gameManager.gameState.phase === 'player') {
                        this.gameManager.endPlayerTurn();
                    }
                });
            }
            
            // Keyboard controls for abilities using Q, W, E, R keys
            document.addEventListener('keydown', (e) => {
                // Only process keyboard shortcuts during player phase
                if (!this.gameManager.gameState || this.gameManager.gameState.phase !== 'player') {
                    return;
                }
                
                // --- NEW: Escape key to cancel targeting --- 
                if (e.key === 'Escape') {
                    if (this.gameManager.gameState.selectedCharacter && this.gameManager.gameState.selectedAbility) {
                        console.log("Escape pressed during targeting - cancelling.");
                        this.gameManager.gameState.selectedAbility = null;
                        this.clearSelection(); // Removes target highlights and ability selection
                        this.gameManager.addLogEntry("Targeting cancelled.", 'system');
                        // Highlight the character again to show they are still selected
                        this.highlightSelectedCharacter(this.gameManager.gameState.selectedCharacter);
                        return; // Don't process other keys if escape was handled
                    }
                }
                // --- END Escape key --- 

                // Debug mode - special key handlers
                if (e.key === 'Numpad4' || e.key === '4') {
                    // NUM4: Reduces ALL enemies HP to 20% MAXHP
                    console.log("[DEBUG] NUM4 pressed - reducing all enemies HP to 20% of maximum");
                    this.gameManager.gameState.aiCharacters.forEach(enemy => {
                        const newHp = Math.floor(enemy.stats.maxHp * 0.2);
                        enemy.stats.currentHp = newHp;
                        this.gameManager.uiManager.updateCharacterUI(enemy);
                        this.gameManager.addLogEntry(`[DEBUG] ${enemy.name}'s HP reduced to ${newHp}`, 'system');
                    });
                    return;
                }

                // Shift+F: Duplicate a random living enemy
                if (e.key === 'F' && e.shiftKey) {
                    console.log("[DEBUG] Shift+F pressed - duplicating random enemy");
                    (async () => { // Use async IIFE to handle await inside listener
                        const livingEnemies = this.gameManager.gameState.aiCharacters.filter(enemy => !enemy.isDead());
                        if (livingEnemies.length > 0) {
                            const enemyToCopy = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                            try {
                                const baseData = await CharacterFactory.loadCharacterData(enemyToCopy.id);
                                if (baseData) {
                                    // Create a truly deep copy of the base data to avoid reference issues
                                    const copyData = JSON.parse(JSON.stringify(baseData)); 
                                    const newId = `${enemyToCopy.id}_copy_${Date.now()}`;
                                    copyData.id = newId; // Assign the unique ID
                                    
                                    // Ensure the copy also gets a unique name if desired, or keep original
                                    // copyData.name = `${copyData.name} (Copy)`; 
                                    
                                    const newEnemy = CharacterFactory.createCharacter(copyData);
                                    newEnemy.isAI = true;
                                    
                                    // Add the new enemy to the game state
                                    this.gameManager.gameState.aiCharacters.push(newEnemy);
                                    
                                    // Re-render characters immediately
                                    // Need to call renderCharacters on the UIManager instance (this)
                                    this.renderCharacters(this.gameManager.gameState.playerCharacters, this.gameManager.gameState.aiCharacters);
                                    
                                    this.gameManager.addLogEntry(`[DEBUG] Duplicated ${enemyToCopy.name} as ${newEnemy.name}`, 'system');
                                } else {
                                    console.error(`[DEBUG] Failed to load base data for ${enemyToCopy.id}`);
                                    this.gameManager.addLogEntry(`[DEBUG] Failed to load base data for ${enemyToCopy.name}`, 'system');
                                }
                            } catch (error) {
                                console.error("[DEBUG] Error duplicating enemy:", error);
                                this.gameManager.addLogEntry(`[DEBUG] Error duplicating enemy: ${error.message}`, 'system');
                            }
                        } else {
                            this.gameManager.addLogEntry("[DEBUG] No living enemies to duplicate.", 'system');
                        }
                    })(); // Immediately invoke the async function
                    e.preventDefault(); // Prevent browser find action
                    return; // Prevent further processing for this key event
                }
                
                // NUM9: Set all enemies HP to 1
                if (e.key === 'Numpad9' || e.key === '9') {
                    console.log("[DEBUG] NUM9 pressed - setting all enemies HP to 1");
                    this.gameManager.gameState.aiCharacters.forEach(enemy => {
                        if (!enemy.isDead()) {
                            enemy.stats.currentHp = 1;
                            this.updateCharacterUI(enemy); // Use 'this' to refer to UIManager instance
                            this.gameManager.addLogEntry(`[DEBUG] ${enemy.name}'s HP set to 1`, 'system');
                        }
                    });
                    e.preventDefault();
                    return;
                }

                // NUM1: Set all player characters HP to 2%
                if (e.key === 'Numpad1' || e.key === '1') {
                    console.log("[DEBUG] NUM1 pressed - reducing player characters HP to 2% of maximum");
                    this.gameManager.gameState.playerCharacters.forEach(character => {
                        if (!character.isDead()) {
                            const newHp = Math.max(1, Math.floor(character.stats.maxHp * 0.02)); // Ensure HP is at least 1
                            character.stats.currentHp = newHp;
                            this.updateCharacterUI(character); // Use 'this' to refer to UIManager instance
                            this.gameManager.addLogEntry(`[DEBUG] ${character.name}'s HP reduced to ${newHp} (2%)`, 'system');
                        }
                    });
                    e.preventDefault(); // Prevent typing '1' in input fields etc.
                    return;
                }
                
                // NUM2: Kill all enemies
                if (e.key === 'Numpad2' || e.key === '2') {
                    console.log("[DEBUG] NUM2 pressed - killing all enemies");
                    this.gameManager.debugKillAllEnemies(); // Call the GameManager method
                    e.preventDefault();
                    return;
                }

                // Shift+P: Reduces player characters HP to 51% of maximum
                if (e.key === 'P' && e.shiftKey) {
                    console.log("[DEBUG] Shift+P pressed - reducing player characters HP to 51% of maximum");
                    this.gameManager.gameState.playerCharacters.forEach(character => {
                        const newHp = Math.floor(character.stats.maxHp * 0.51);
                        character.stats.currentHp = newHp; // Set current HP to 51% of max
                        this.updateCharacterUI(character);
                        this.gameManager.addLogEntry(`[DEBUG] ${character.name}'s HP reduced to ${newHp} (51%)`, 'system');
                    });
                    return;
                }
                
                const selectedChar = this.gameManager.gameState.selectedCharacter;
                if (!selectedChar || selectedChar.isAI) {
                    return;
                }
                
                let abilityIndex = -1;
                
                // Map keys to ability indices (0-3)
                switch (e.key.toLowerCase()) {
                    case 'q': abilityIndex = 0; break;
                    case 'w': abilityIndex = 1; break;
                    case 'e': abilityIndex = 2; break;
                    case 'r': abilityIndex = 3; break;
                    default: return; // Not a mapped key
                }
                
                // Check if the character has this ability
                if (abilityIndex >= 0 && abilityIndex < selectedChar.abilities.length) {
                    this.gameManager.selectAbility(selectedChar, abilityIndex);
                }
            });
            
            // Now safe to update the button state
            this.updateEndTurnButton();
            
            // Set up battle log controls
            const clearLogButton = document.getElementById('clear-log-button');
            const toggleLogButton = document.getElementById('toggle-log-button');
            const battleLogContainer = document.querySelector('.battle-log-container');
            
            if (clearLogButton) {
                clearLogButton.addEventListener('click', () => {
                    this.clearBattleLog();
                    this.addLogEntry('Battle log cleared', 'system');
                });
            }
            
            if (toggleLogButton && battleLogContainer) {
                toggleLogButton.addEventListener('click', () => {
                    battleLogContainer.classList.toggle('expanded');
                    toggleLogButton.textContent = battleLogContainer.classList.contains('expanded') ? '⬆' : '⬍';
                });
            }
        }

        // Find character element from event target
        findCharacterElement(element) {
            while (element && !element.id.startsWith('character-')) {
                element = element.parentElement;
            }
            return element;
        }

        // Render characters to UI
        renderCharacters(playerCharacters, aiCharacters) {
            const playerContainer = document.getElementById('player-characters-container');
            const aiContainer = document.getElementById('ai-characters-container');
            
            // Clear containers
            playerContainer.innerHTML = '';
            aiContainer.innerHTML = '';
            
            // Render player characters (Filter out dead ones)
            playerCharacters
                .filter(character => !character.isDead())
                .forEach(function(character) {
                    const charElement = this.createCharacterElement(character);
                    playerContainer.appendChild(charElement);
                }, this);
            
            // Render AI characters (Filter out dead ones)
            aiCharacters
                .filter(character => !character.isDead())
                .forEach(function(character) {
                    const charElement = this.createCharacterElement(character, true);
                    aiContainer.appendChild(charElement);
                }, this);
        }

        // Create ability UI elements
        createAbilityElements(character, abilitiesDiv, isAI = false) {
            if (character.abilities.length > 0) {
                character.abilities.forEach((ability, index) => { // Use arrow function here
                    // Debug log for cooldowns
                    console.log(`Ability ${ability.name} has cooldown: ${ability.currentCooldown}/${ability.cooldown}`);
                    
                    const abilityElement = document.createElement('div'); // Renamed from abilityDiv
                    abilityElement.className = 'ability';
                    abilityElement.dataset.index = index;
                    
                    // Add ability icon
                    if (ability.icon) {
                        const abilityIcon = document.createElement('img');
                        abilityIcon.src = ability.icon;
                        abilityIcon.className = 'ability-icon';
                        abilityElement.appendChild(abilityIcon);
                    }
                    
                    // Add mana cost indicator
                    if (ability.manaCost > 0) {
                        const manaCostDiv = document.createElement('div');
                        manaCostDiv.className = 'ability-cost';
                        manaCostDiv.textContent = ability.manaCost;
                        abilityElement.appendChild(manaCostDiv);
                    }
                    
                    // Add cooldown overlay if on cooldown
                    if (ability.currentCooldown > 0) {
                        const cooldownDiv = document.createElement('div');
                        cooldownDiv.className = 'ability-cooldown';
                        cooldownDiv.textContent = ability.currentCooldown;
                        abilityElement.appendChild(cooldownDiv);
                    }
                    
                    // Add keyboard shortcut indicator for player characters
                    if (!isAI) {
                        const keybindDiv = document.createElement('div');
                        keybindDiv.className = 'ability-keybind';
                        
                        let keyLabel = '';
                        switch (index) {
                            case 0: keyLabel = 'Q'; break;
                            case 1: keyLabel = 'W'; break;
                            case 2: keyLabel = 'E'; break;
                            case 3: keyLabel = 'R'; break;
                        }
                        
                        keybindDiv.textContent = keyLabel;
                        abilityElement.appendChild(keybindDiv);
                    }
                    
                    // Add class if ability is disabled
                    if (ability.isDisabled) {
                        abilityElement.classList.add('disabled');
                    } else {
                        abilityElement.classList.remove('disabled');
                    }
                    
                    abilitiesDiv.appendChild(abilityElement);
                });
            } else {
                // Create placeholder ability slots
                for (let i = 0; i < 4; i++) {
                    const abilityDiv = document.createElement('div');
                    abilityDiv.className = 'ability';
                    
                    // Add keyboard shortcut indicators to placeholders for player characters
                    if (!isAI) {
                        const keybindDiv = document.createElement('div');
                        keybindDiv.className = 'ability-keybind';
                        
                        let keyLabel = '';
                        switch (i) {
                            case 0: keyLabel = 'Q'; break;
                            case 1: keyLabel = 'W'; break;
                            case 2: keyLabel = 'E'; break;
                            case 3: keyLabel = 'R'; break;
                        }
                        
                        keybindDiv.textContent = keyLabel;
                        abilityDiv.appendChild(keybindDiv);
                    }
                    
                    abilitiesDiv.appendChild(abilityDiv);
                }
            }
        }

        // Create character UI element
        createCharacterElement(character, isAI = false) {
            const charDiv = document.createElement('div');
            // Use instanceId if available (for AI), otherwise fallback to id
            const elementId = character.instanceId || character.id;
            charDiv.id = `character-${elementId}`;
            charDiv.className = 'character-slot';
            // Store the unique instanceId in a data attribute for easy retrieval
            charDiv.dataset.instanceId = elementId; 
            if (isAI) {
                charDiv.classList.add('ai-character');
            }
            
            // Character image with buff/debuff containers
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            
            const image = document.createElement('img');
            image.src = character.image;
            image.className = 'character-image';
            image.alt = character.name;
            
            // Add right-click context menu for character stats
            image.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showCharacterStatsMenu(character, e.clientX, e.clientY);
            });
            
            // Buff container
            const buffsDiv = document.createElement('div');
            buffsDiv.className = 'status-effects buffs';
            
            // Debuff container
            const debuffsDiv = document.createElement('div');
            debuffsDiv.className = 'status-effects debuffs';
            
            // Cham Cham Passive Stack Indicator Container (Ensure this is only added for Cham Cham)
            let passiveStackDiv = null;
            if (character.id === 'cham_cham') {
                passiveStackDiv = document.createElement('div');
                // Add specific class AND a general class for potential reuse/styling
                passiveStackDiv.className = 'passive-stack-indicator cham-cham-passive';
                passiveStackDiv.style.display = 'none'; // Hide initially
            }

            // Siegfried Passive Stack Indicator Container
            let siegfriedPassiveDiv = null;
            if (character.id === 'schoolboy_siegfried') {
                siegfriedPassiveDiv = document.createElement('div');
                siegfriedPassiveDiv.className = 'passive-stack-indicator siegfried-passive'; // Specific class
                siegfriedPassiveDiv.style.display = 'none'; // Hide initially
            }

            imageContainer.appendChild(image);
            imageContainer.appendChild(buffsDiv);
            imageContainer.appendChild(debuffsDiv);
            // Only append if created (i.e., if it's Cham Cham)
            if (passiveStackDiv) {
                imageContainer.appendChild(passiveStackDiv);
            }
            // Append Siegfried's passive indicator if created
            if (siegfriedPassiveDiv) {
                imageContainer.appendChild(siegfriedPassiveDiv);
            }

            // Character info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'character-info';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'character-name';
            nameDiv.textContent = character.name;
            
            // HP bar
            const hpContainer = document.createElement('div');
            hpContainer.className = 'bar-container';
            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            hpBar.style.width = `${(character.stats.currentHp / character.stats.maxHp) * 100}%`;
            hpBar.textContent = `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)}`;
            hpContainer.appendChild(hpBar);
            
            // Mana bar
            const manaContainer = document.createElement('div');
            manaContainer.className = 'bar-container';
            const manaBar = document.createElement('div');
            manaBar.className = 'mana-bar';
            manaBar.style.width = `${(character.stats.currentMana / character.stats.maxMana) * 100}%`;
            manaBar.textContent = `${Math.round(character.stats.currentMana)} / ${Math.round(character.stats.maxMana)}`;
            manaContainer.appendChild(manaBar);
            
            // Ability slots
            const abilitiesDiv = document.createElement('div');
            abilitiesDiv.className = 'abilities';
            
            // Create ability elements
            this.createAbilityElements(character, abilitiesDiv, isAI);
            
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(hpContainer);
            infoDiv.appendChild(manaContainer);
            infoDiv.appendChild(abilitiesDiv);
            
            charDiv.appendChild(imageContainer);
            charDiv.appendChild(infoDiv);
            
            return charDiv;
        }

        // Update character UI
        updateCharacterUI(character) {
            // Use instanceId if available, otherwise fallback to id
            const elementId = character.instanceId || character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            
            // --- MODIFIED: Check if element exists before proceeding --- 
            if (!charElement) {
                // Log a warning instead of an error, as this can happen during initial load
                console.warn(`[UIManager] updateCharacterUI: UI element not found for character: ${elementId}. Skipping update.`);
                return; // Exit if element not found
            }
            // --- END MODIFICATION ---
            
            // --- NEW: Add/Remove character-dead class based on status --- 
            if (character.isDead()) {
                charElement.classList.add('character-dead');
            } else {
                charElement.classList.remove('character-dead');
            }
            // --- END NEW ---
            
            // Update HP bar
            const hpBar = charElement.querySelector('.hp-bar');
            hpBar.style.width = `${(character.stats.currentHp / character.stats.maxHp) * 100}%`;
            hpBar.textContent = `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)}`;
            
            // Update Mana bar
            const manaBar = charElement.querySelector('.mana-bar');
            manaBar.style.width = `${(character.stats.currentMana / character.stats.maxMana) * 100}%`;
            manaBar.textContent = `${Math.round(character.stats.currentMana)} / ${Math.round(character.stats.maxMana)}`;
            
            // Update abilities (cooldowns and mana costs)
            const abilitiesDiv = charElement.querySelector('.abilities');
            abilitiesDiv.innerHTML = '';
            this.createAbilityElements(character, abilitiesDiv, character.isAI);
            
            // Update buffs
            const buffsDiv = charElement.querySelector('.buffs');
            buffsDiv.innerHTML = '';
            character.buffs.forEach((buff) => {
                const buffIconContainer = document.createElement('div'); // Renamed for clarity
                buffIconContainer.className = 'status-icon-container buff-container'; // More specific class
                buffIconContainer.dataset.effectId = buff.id; // Store ID for reference
                
                // Add buff icon if available
                if (buff.icon) {
                    const img = document.createElement('img');
                    img.src = buff.icon;
                    img.alt = buff.name;
                    img.className = 'status-icon buff-icon'; // Keep buff-icon class for consistency
                    // --- NEW: Use updated description from buff object --- 
                    img.title = buff.description ? `${buff.name}: ${buff.description}` : buff.name;
                    // --- END NEW ---
                    buffIconContainer.appendChild(img);
                }
                
                // Add turn counter
                const durationElement = document.createElement('div');
                durationElement.className = 'status-duration';
                durationElement.textContent = buff.duration;
                buffIconContainer.appendChild(durationElement);
                
                // --- NEW: Add Nurturing Toss Stack Indicator --- 
                if (buff.id === 'nurturing_toss_buff' && buff.currentStacks > 0) {
                    const stackIndicator = document.createElement('div');
                    stackIndicator.className = 'nurturing-toss-stack-indicator';
                    stackIndicator.textContent = buff.currentStacks;
                    buffIconContainer.appendChild(stackIndicator);
                    
                    // Optional: Add glow effect container
                    const glowEffect = document.createElement('div');
                    glowEffect.className = 'nurturing-toss-glow';
                    buffIconContainer.appendChild(glowEffect);
                    
                    // Apply animation if needed (could be triggered differently, e.g., via a flag)
                    // For simplicity, let's assume CSS handles the animation based on class
                }
                // --- END NEW ---
                
                // Add enhanced tooltip functionality
                buffIconContainer.addEventListener('mouseenter', (e) => {
                    // --- NEW: Re-fetch the buff object just before showing tooltip --- 
                    const currentBuff = character.buffs.find(b => b.id === buff.id);
                    if (currentBuff) {
                        this.showStatusTooltip(e, currentBuff, 'buff');
                    } else {
                        console.warn(`Tooltip: Could not find current buff with ID ${buff.id} for ${character.name}`);
                        // Optionally show tooltip with the old data if needed
                        // this.showStatusTooltip(e, buff, 'buff'); 
                    }
                    // --- END NEW ---
                });
                
                buffIconContainer.addEventListener('mouseleave', () => {
                    this.hideStatusTooltip();
                });
                
                buffsDiv.appendChild(buffIconContainer);
            });
            
            // Update debuffs
            const debuffsDiv = charElement.querySelector('.debuffs');
            debuffsDiv.innerHTML = '';
            debuffsDiv.innerHTML = ''; // This line seems redundant
            character.debuffs.forEach((debuff) => {
                // --- MODIFICATION START: Skip rendering icon for Birdie's internal stun --- 
                if (debuff.id === 'birdie_internal_stun') {
                    return; // Skip the rest of the loop for this specific debuff
                }
                // --- MODIFICATION END ---

                const debuffIconContainer = document.createElement('div'); // Use container
                debuffIconContainer.className = 'status-icon-container debuff-container';
                debuffIconContainer.dataset.effectId = debuff.id;
                
                // Add debuff icon if available
                if (debuff.icon) {
                    const img = document.createElement('img');
                    img.src = debuff.icon;
                    img.alt = debuff.name;
                    img.className = 'status-icon debuff-icon';
                    // --- NEW: Use updated description --- 
                    img.title = debuff.description ? `${debuff.name}: ${debuff.description}` : debuff.name;
                    // --- END NEW ---
                    debuffIconContainer.appendChild(img);
                }
                
                // Add turn counter
                const durationElement = document.createElement('div');
                durationElement.className = 'status-duration';
                durationElement.textContent = debuff.duration;
                debuffIconContainer.appendChild(durationElement);
                
                // Add enhanced tooltip functionality
                debuffIconContainer.addEventListener('mouseenter', (e) => {
                    // --- NEW: Re-fetch the debuff object --- 
                    const currentDebuff = character.debuffs.find(d => d.id === debuff.id);
                    if (currentDebuff) {
                        this.showStatusTooltip(e, currentDebuff, 'debuff');
                    } else {
                        console.warn(`Tooltip: Could not find current debuff with ID ${debuff.id} for ${character.name}`);
                    }
                    // --- END NEW ---
                });
                
                debuffIconContainer.addEventListener('mouseleave', () => {
                    this.hideStatusTooltip();
                });
                
                debuffsDiv.appendChild(debuffIconContainer);
            });

            // Update Cham Cham Passive Stack Indicator
            const passiveStackElement = charElement.querySelector('.cham-cham-passive');
            // Check if the element exists (it should only exist for Cham Cham)
            if (passiveStackElement) {
                // Check if the character has the passive stacks property defined
                if (typeof character.chamChamPassiveStacks !== 'undefined' && character.chamChamPassiveStacks > 0) {
                    // Display the stacks
                    passiveStackElement.textContent = character.chamChamPassiveStacks;
                    // Add a tooltip showing the percentage bonus
                    const bonusPercent = character.chamChamPassiveStacks * 2; // 2% per stack
                    passiveStackElement.title = `Growing Power: +${bonusPercent}% Damage (${character.chamChamPassiveStacks} stacks)`;
                    passiveStackElement.style.display = 'flex'; // Use flex for centering text inside
                } else {
                    // Hide if no stacks or property undefined
                    passiveStackElement.style.display = 'none';
                }
            }

            // Update Siegfried Passive Indicator
            const siegfriedPassiveElement = charElement.querySelector('.siegfried-passive');
            if (siegfriedPassiveElement) {
                const buffCount = character.buffs.length;
                if (buffCount > 0) {
                    const bonusDamage = buffCount * 125;
                    
                    // Track previous value to detect changes
                    const previousValue = siegfriedPassiveElement.getAttribute('data-value');
                    const currentValue = bonusDamage.toString();
                    
                    // Clear previous content and create new structure
                    siegfriedPassiveElement.textContent = '';
                    
                    // Create stack counter circle
                    const stackCountElem = document.createElement('div');
                    stackCountElem.className = 'stack-count';
                    stackCountElem.textContent = buffCount;
                    
                    // Create value display
                    const valueElem = document.createElement('div');
                    valueElem.className = 'value';
                    valueElem.textContent = `+${bonusDamage}`;
                    
                    // Create suffix element (AD)
                    const suffixElem = document.createElement('div');
                    suffixElem.className = 'suffix';
                    suffixElem.textContent = 'AD';
                    
                    // Append all elements to container
                    siegfriedPassiveElement.appendChild(stackCountElem);
                    siegfriedPassiveElement.appendChild(valueElem);
                    siegfriedPassiveElement.appendChild(suffixElem);
                    
                    // Enhanced tooltip with buff details
                    let tooltipText = `Buff Connoisseur: +${bonusDamage} Physical Damage from ${buffCount} active buff${buffCount > 1 ? 's' : ''}`;
                    
                    // Add buff list to tooltip if there are buffs
                    if (buffCount > 0) {
                        tooltipText += '\n\nActive buffs:';
                        character.buffs.forEach(buff => {
                            tooltipText += `\n• ${buff.name}`;
                        });
                    }
                    
                    siegfriedPassiveElement.title = tooltipText;
                    siegfriedPassiveElement.style.display = 'flex'; // Show element
                    siegfriedPassiveElement.dataset.stacks = buffCount; // For CSS styling based on stacks
                    siegfriedPassiveElement.dataset.value = currentValue; // Store value for change detection
                    
                    // Add animation class if the value increased
                    if (previousValue && parseInt(currentValue) > parseInt(previousValue)) {
                        // Remove and re-add the class to restart the animation
                        siegfriedPassiveElement.classList.remove('stack-added');
                        void siegfriedPassiveElement.offsetWidth; // Force reflow
                        siegfriedPassiveElement.classList.add('stack-added');
                        
                        // Special milestone effects for significant buff counts (5 and 10)
                        // Removed sound effect call causing linter warning
                        // if (buffCount === 5 || buffCount === 10) {
                            // Play a sound effect if available
                            // if (typeof playSound === 'function') {
                            //     playSound('sfx_lion_roar');
                            // }
                        // }
                        
                        // Remove the class after animation completes
                        setTimeout(() => {
                            siegfriedPassiveElement.classList.remove('stack-added');
                        }, 600); // Match animation duration
                    }
                } else {
                    siegfriedPassiveElement.style.display = 'none'; // Hide if no buffs
                }
            }

            // --- Primal Fury (W Buff) VFX --- 
            const imageContainerW = charElement.querySelector('.image-container');
            if (imageContainerW) {
                // Check if the character has the buff (assuming a hasBuff method exists)
                if (character.hasBuff && character.hasBuff('cham_cham_w_buff')) {
                    imageContainerW.classList.add('primal-fury-active');
                } else {
                    imageContainerW.classList.remove('primal-fury-active');
                }
            }
            // --- End Primal Fury VFX ---
            
            // Apply or remove stunned visual effect based on whether the character is stunned
            if (character.isStunned()) {
                if (!charElement.classList.contains('stunned')) {
                    charElement.classList.add('stunned');
                    
                    // Get the image container to add the stun effect
                    const imageContainer = charElement.querySelector('.image-container');
                    
                    // Remove any existing stun effects first
                    const existingStunEffect = imageContainer.querySelector('.stun-effect');
                    if (existingStunEffect) {
                        existingStunEffect.remove();
                    }
                    
                    // Create stun effect
                    const stunEffect = document.createElement('div');
                    stunEffect.className = 'stun-effect';
                    
                    // Add stars
                    const stunStars = document.createElement('div');
                    stunStars.className = 'stun-stars';
                    stunEffect.appendChild(stunStars);
                    
                    // Add circle
                    const stunCircle = document.createElement('div');
                    stunCircle.className = 'stun-circle';
                    stunEffect.appendChild(stunCircle);
                    
                    // Add to the image container
                    imageContainer.appendChild(stunEffect);
                    
                    // Add a log entry to indicate character is stunned (only if gameManager exists)
                    if (this.gameManager && !character.justStunned) {
                        this.gameManager.addLogEntry(`${character.name} is stunned!`, 'system');
                        character.justStunned = true;
                    }
                }
            } else {
                charElement.classList.remove('stunned');
                
                // Remove stun effects if they exist
                const imageContainer = charElement.querySelector('.image-container');
                const stunEffect = imageContainer.querySelector('.stun-effect');
                if (stunEffect) {
                    stunEffect.remove();
                }
                
                // Reset the justStunned flag when no longer stunned
                character.justStunned = false;
            }

            // --- NEW: Handle Dead State ---
            if (character.isDead()) {
                charElement.classList.add('dead');
                // Optionally remove other states like selected, acted, targetable
                charElement.classList.remove('selected', 'acted', 'selectable', 'targetable');
            } else {
                charElement.classList.remove('dead');
            }
            // --- END NEW ---
        }

        // Highlight selected character
        highlightSelectedCharacter(character) {
            // Remove selected class from all slots first
            document.querySelectorAll('.character-slot').forEach(function(el) {
                el.classList.remove('selected');
            });
            
            // Add selected class to the specific character
            // Use instanceId if available, otherwise fallback to id
            const elementId = character.instanceId || character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                charElement.classList.add('selected');
            } else {
                console.error(`Cannot highlight character, element not found for ID: ${elementId}`);
            }
        }

        // Highlight selected ability
        highlightSelectedAbility(index) {
            // Clear previous selection
            document.querySelectorAll('.ability').forEach(function(el) {
                el.classList.remove('selected');
            });
            
            // Find selected character element
            const charElement = document.querySelector('.character-slot.selected');
            if (charElement) {
                // Find ability at index
                const abilityElement = charElement.querySelector(`.ability[data-index="${index}"]`);
                if (abilityElement) {
                    abilityElement.classList.add('selected');
                }
            }
        }

        // Show character abilities
        showCharacterAbilities(character) {
            // Will be implemented with ability tooltips/details
            console.log('Character abilities:', character.abilities);
        }

        // Show valid targets for an ability
        showValidTargets(targetType) {
            // Clear previous targeting
            document.querySelectorAll('.character-slot').forEach(function(el) {
                el.classList.remove('valid-target');
                el.classList.remove('invalid-target');
                el.classList.remove('aoe-target');
            });
            
            const playerChars = document.querySelectorAll('.player-character');
            const aiChars = document.querySelectorAll('.ai-character');
            const selectedChar = this.gameManager.gameState.selectedCharacter;
            const selectedAbility = this.gameManager.gameState.selectedAbility;
            
            if (!selectedChar || !selectedAbility) return;
            
            const isPlayerCaster = !selectedChar.isAI;
            
            // Remove targeting message logs
            
            switch (targetType) {
                case 'enemy':
                    if (isPlayerCaster) {
                        aiChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        playerChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                    } else {
                        playerChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        aiChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                           }
                           break;
                    
                case 'ally':
                    if (isPlayerCaster) {
                        playerChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('selected') && !el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           } else {
                        aiChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('selected') && !el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           }
                           break;
                    
                case 'ally_or_self':
                    if (isPlayerCaster) {
                        playerChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           } else {
                        aiChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           }
                           break;
                    
                case 'self':
                    document.querySelectorAll('.character-slot:not(.selected)').forEach(function(el) {
                        el.classList.add('invalid-target');
                        el.style.cursor = 'not-allowed';
                    });
                    const selected = document.querySelector('.character-slot.selected');
                    // --- NEW: Check if dead ---
                    if (selected && !selected.classList.contains('dead')) {
                        selected.classList.add('valid-target');
                        selected.style.cursor = 'pointer';
                    }
                    // --- END NEW ---
                    break;
                    
                case 'any':
                    document.querySelectorAll('.character-slot').forEach(function(el) {
                        // --- NEW: Check if dead ---
                        if (!el.classList.contains('dead')) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        }
                        // --- END NEW ---
                    });
                    break;
                    
                case 'any_except_self':
                    // New case for Bunny Bounce ability
                    document.querySelectorAll('.character-slot').forEach(function(el) {
                        // --- NEW: Check if dead ---
                        if (!el.classList.contains('selected') && !el.classList.contains('dead')) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        } else if (!el.classList.contains('selected')) {
                            // If it's not selected, but dead, it's still invalid
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        } else {
                            // If it is selected, it's invalid for this target type
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
                        // --- END NEW ---
                    });
                    break;
                    
                // For AOE abilities, we'll still need target selection to trigger the ability
                case 'all_enemies':
                    if (isPlayerCaster) {
                        aiChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        playerChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                    } else {
                        playerChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        aiChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                    }
                    break;
                    
                case 'all_allies':
                    if (isPlayerCaster) {
                        playerChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    } else {
                        aiChars.forEach(function(el) {
                            // --- NEW: Check if dead ---
                            if (!el.classList.contains('dead')) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            }
                            // --- END NEW ---
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    }
                    break;
                    
                case 'all':
                    document.querySelectorAll('.character-slot').forEach(function(el) {
                        // --- NEW: Check if dead ---
                        if (!el.classList.contains('dead')) {
                            el.classList.add('valid-target');
                            el.classList.add('aoe-target');
                            el.style.cursor = 'pointer';
                        }
                        // --- END NEW ---
                    });
                    break;
            }
        }

        // Clear selection UI
        clearSelection() {
            document.querySelectorAll('.character-slot').forEach(function(el) {
                el.classList.remove('selected');
                el.classList.remove('valid-target');
                el.classList.remove('invalid-target');
                el.style.cursor = ''; // Reset cursor style
            });
            
            document.querySelectorAll('.ability').forEach(function(el) {
                el.classList.remove('selected');
            });
        }

        // Remove a character from the UI
        removeCharacter(character) {
            // Use instanceId if available, otherwise fallback to id
            const elementId = character.instanceId || character.id;
            const charElement = document.getElementById(`character-${elementId}`);
            if (charElement) {
                charElement.remove();
            } else {
                console.warn(`Could not find element to remove for character: ${elementId}`);
            }
        }

        // Update turn counter
        updateTurnCounter(turn) {
            document.getElementById('turn-count').textContent = turn;
        }

        // Update phase indicator
        updatePhase(phase) {
            // Only update if phase is provided
            if (phase) {
                const phaseText = phase === 'player' ? "Player's Turn" : "AI's Turn";
                document.getElementById('battle-phase').textContent = phaseText;
            }
            
            // Update End Turn button state
            this.updateEndTurnButton();
        }

        // Mark character as acted in UI
        markCharacterAsActed(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`); // Use instanceId, fallback to id
            if (charElement) {
                charElement.classList.add('acted'); // Use 'acted' class
            }
        }
        
        // Reverse the 'acted' state of a character (for Ayane's ability)
        markCharacterAsActive(character) {
            const charElement = document.getElementById(`character-${character.instanceId || character.id}`); // Use instanceId, fallback to id
            if (charElement) {
                charElement.classList.remove('acted'); // Use 'acted' class
            }
        }

        resetActedCharacters() {
            document.querySelectorAll('.character-slot').forEach(function(el) {
                el.classList.remove('acted'); // Use 'acted' class
            });
        }

        // Add log entry
        addLogEntry(message, className = '') {
            const logElement = document.getElementById('battle-log');
            const entry = document.createElement('div');
            entry.className = `log-entry ${className}`;
            
            // Create message text element
            const messageText = document.createElement('span');
            messageText.className = 'log-message';
            messageText.textContent = message;
            entry.appendChild(messageText);
            
            // Add timestamp (in format HH:MM:SS)
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');2
            const timestamp = `${hours}:${minutes}:${seconds}`;
            
            const timestampElement = document.createElement('span');
            timestampElement.className = 'battle-log-timestamp';
            timestampElement.textContent = timestamp;
            entry.appendChild(timestampElement);
            
            logElement.appendChild(entry);
            
            // Auto-scroll to bottom
            const contentElement = document.querySelector('.battle-log-content');
            if (contentElement) {
                contentElement.scrollTop = contentElement.scrollHeight;
            }
            
            // Flash the header for important messages
            if (className === 'critical' || className === 'system') {
                const headerElement = document.querySelector('.battle-log-header');
                if (headerElement) {
                    headerElement.classList.add('flash');
                    setTimeout(() => {
                        headerElement.classList.remove('flash');
                    }, 500);
                }
            }
        }

        // Clear battle log
        clearBattleLog() {
            const logElement = document.getElementById('battle-log');
            logElement.innerHTML = '';
        }

        // Show game over screen
        showGameOverScreen(isVictory, context = {}) { // Added context parameter
            // Use the global showGameOverScreen function if available
            if (window.showGameOverScreen) {
                 // Pass victory status and the context object (containing storyId, returnUrl)
                window.showGameOverScreen(isVictory, context);
            } else {
                // Fallback to simple alert
                const message = isVictory ? 
                    "Victory! You've defeated all enemies." : 
                    "Defeat! Your team has been defeated.";
                    
                alert(message);

                 // Basic fallback navigation if returnUrl is present in context
                 if (context.returnUrl) {
                      console.log(`[UIManager Fallback] Navigating back to: ${context.returnUrl}`);
                      window.location.href = context.returnUrl; 
                 }
            }
        }

        // Create planning phase overlay
        createPlanningPhaseOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'planning-phase-overlay';
            
            const content = document.createElement('div');
            content.className = 'planning-phase-content';
            
            const title = document.createElement('div');
            title.className = 'planning-phase-title';
            title.textContent = 'AI is planning its turn...';
            
            content.appendChild(title);
            overlay.appendChild(content);
            
            document.body.appendChild(overlay);
        }
        
        // Show or hide planning phase overlay
        showPlanningPhase(show) {
            const overlay = document.querySelector('.planning-phase-overlay');
            if (overlay) {
                if (show) {
                    overlay.classList.add('active');
                } else {
                    overlay.classList.remove('active');
                }
            }
        }
        
        // Show or hide planning indicator for a character
        showCharacterPlanning(character, show) {
            const charElement = document.getElementById(`character-${character.id}`);
            if (charElement) {
                if (show) {
                    charElement.classList.add('planning');
                } else {
                    charElement.classList.remove('planning');
                }
            }
        }

        // Update End Turn button state
        updateEndTurnButton() {
        const endTurnButton = document.getElementById('end-turn-button');
        if (endTurnButton) {
            // Check if gameState exists first
            if (this.gameManager.gameState) {
                if (this.gameManager.gameState.phase === 'player') {
                    endTurnButton.disabled = false;
                    endTurnButton.textContent = 'End Turn';
                } else {
                    endTurnButton.disabled = true;
                    endTurnButton.textContent = 'AI Turn...';
                }
            } else {
                // If gameState doesn't exist yet, disable the button
                endTurnButton.disabled = true;
                endTurnButton.textContent = 'Waiting...';
            }
        }
    }

    // Show character stats context menu
    showCharacterStatsMenu(character, x, y) {
        // Hide the menu if it's already visible
        if (this.characterStatsMenu.style.display === 'block') {
            this.characterStatsMenu.style.display = 'none';
            return;
        }

        // If no character is provided, hide the menu
        if (!character) {
            this.characterStatsMenu.style.display = 'none';
            return;
        }

        // Clear the existing content
        this.characterStatsMenu.innerHTML = '';

        // Create the character name header
        const nameHeader = document.createElement('h2');
        nameHeader.textContent = character.name;
        nameHeader.classList.add('stats-menu-header');
        this.characterStatsMenu.appendChild(nameHeader);

        // Get base stats and buff-modified stats
        const baseStats = character.constructor.BASE_STATS || {};
        const buffModifiedStats = character.getBuffModifiedStats ? character.getBuffModifiedStats() : {};

        // Basic stats section
        const statsSection = document.createElement('div');
        statsSection.classList.add('stats-menu-section');
        
        const statsHeader = document.createElement('h3');
        statsHeader.textContent = 'Statistics';
        statsHeader.classList.add('stats-menu-subheader');
        statsSection.appendChild(statsHeader);
        
        const statsList = document.createElement('ul');
        statsList.classList.add('stats-list');
        
        // Using the provided stats array
        const stats = [
            { name: 'Physical DMG', value: character.stats.physicalDamage, key: 'physicalDamage', baseValue: baseStats.physicalDamage, buffValue: buffModifiedStats.physicalDamage },
            { name: 'Magical DMG', value: character.stats.magicalDamage, key: 'magicalDamage', baseValue: baseStats.magicalDamage },
            { name: 'Armor', value: character.stats.armor, key: 'armor', baseValue: baseStats.armor, tooltip: `Reduces physical damage by ${Math.min(80, character.stats.armor)}% (max 80%)` },
            { name: 'Magic Shield', value: character.stats.magicalShield, key: 'magicalShield', baseValue: baseStats.magicalShield, tooltip: `Reduces magical damage by ${Math.min(80, character.stats.magicalShield)}% (max 80%)` },
            { name: 'HP', value: `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)}`, key: 'hp' },
            { name: 'HP Regen', value: character.stats.hpPerTurn, key: 'hpPerTurn' },
            { name: 'Mana', value: `${Math.round(character.stats.currentMana)} / ${Math.round(character.stats.maxMana)}`, key: 'mana' },
            { name: 'Mana Regen', value: character.stats.manaPerTurn, key: 'manaPerTurn' },
            { name: 'Lifesteal', value: `${character.stats.lifesteal * 100}%`, key: 'lifesteal', baseValue: baseStats.lifesteal },
            { name: 'Dodge', value: `${character.stats.dodgeChance * 100}%`, key: 'dodgeChance', baseValue: baseStats.dodgeChance, buffValue: buffModifiedStats.dodgeChance },
            { name: 'Crit Chance', value: `${character.stats.critChance * 100}%`, key: 'critChance', baseValue: baseStats.critChance },
            { name: 'Crit Damage', value: `${character.stats.critDamage * 100}%`, key: 'critDamage', baseValue: baseStats.critDamage },
            { name: 'Healing Power', value: character.stats.healingPower, key: 'healingPower', baseValue: baseStats.healingPower }
        ];
        
        stats.forEach(stat => {
            const statItem = document.createElement('li');
            statItem.classList.add('stat-item');
            
            const statName = document.createElement('span');
            statName.classList.add('stat-name');
            statName.textContent = stat.name;
            
            const statValue = document.createElement('span');
            statValue.classList.add('stat-value');
            statValue.textContent = stat.value;
            
            // Add buff/debuff visual indicators
            if (stat.baseValue !== undefined && stat.key) {
                const currentValue = typeof stat.value === 'string' ? parseFloat(stat.value) : stat.value;
                const baseValue = stat.baseValue;
                
                if (typeof currentValue === 'number' && typeof baseValue === 'number') {
                    if (currentValue > baseValue) {
                        statValue.classList.add('buffed');
                    } else if (currentValue < baseValue) {
                        statValue.classList.add('debuffed');
                    }
                }
            }
            
            // Add tooltip if available
            if (stat.tooltip) {
                statItem.setAttribute('title', stat.tooltip);
                statItem.style.cursor = 'help';
            }
            
            statItem.appendChild(statName);
            statItem.appendChild(statValue);
            statsList.appendChild(statItem);
        });
        
        statsSection.appendChild(statsList);
        this.characterStatsMenu.appendChild(statsSection);
        
        // Abilities section
        if (character.abilities && character.abilities.length > 0) {
            const abilitiesSection = document.createElement('div');
            abilitiesSection.classList.add('stats-menu-section', 'abilities-section');
            
            const abilitiesHeader = document.createElement('h3');
            abilitiesHeader.textContent = 'Abilities';
            abilitiesHeader.classList.add('stats-menu-subheader');
            abilitiesSection.appendChild(abilitiesHeader);
            
            character.abilities.forEach((ability, index) => {
                const abilityItem = document.createElement('div');
                abilityItem.classList.add('ability-item');
                
                const abilityHeader = document.createElement('div');
                abilityHeader.classList.add('ability-header');
                
                // Add ability icon if available
                if (ability.icon) {
                    const abilityIcon = document.createElement('img');
                    abilityIcon.classList.add('ability-icon-small');
                    abilityIcon.src = ability.icon;
                    abilityIcon.alt = ability.name;
                    abilityHeader.appendChild(abilityIcon);
                }
                
                const abilityName = document.createElement('span');
                abilityName.classList.add('ability-name');
                abilityName.textContent = ability.name;
                abilityHeader.appendChild(abilityName);
                
                abilityItem.appendChild(abilityHeader);
                
                // Add ability description
                if (ability.description) {
                    const abilityDescription = document.createElement('div');
                    abilityDescription.classList.add('ability-description');
                    abilityDescription.innerHTML = ability.description; // Use innerHTML instead of textContent
                    abilityItem.appendChild(abilityDescription);
                }
                
                // Add ability details (cost, cooldown)
                const abilityDetails = document.createElement('div');
                abilityDetails.classList.add('ability-details');
                
                if (ability.manaCost !== undefined) {
                    const manaCost = document.createElement('span');
                    manaCost.textContent = `Mana: ${ability.manaCost}`;
                    manaCost.classList.add('ability-mana-cost');
                    abilityDetails.appendChild(manaCost);
                }
                
                if (ability.cooldown !== undefined) {
                    const cooldown = document.createElement('span');
                    cooldown.textContent = ability.cooldown > 0 ? `Cooldown: ${ability.cooldown} turn${ability.cooldown !== 1 ? 's' : ''}` : 'No cooldown';
                    cooldown.classList.add('ability-cooldown-info');
                    
                    // If ability is on cooldown, show current cooldown
                    if (ability.currentCooldown && ability.currentCooldown > 0) {
                        cooldown.textContent += ` (${ability.currentCooldown} turn${ability.currentCooldown !== 1 ? 's' : ''} left)`;
                        cooldown.classList.add('on-cooldown');
                    }
                    
                    abilityDetails.appendChild(cooldown);
                }
                
                // Add ability keybind
                const keybinds = ['Q', 'W', 'E', 'R'];
                if (index < keybinds.length) {
                    const keybind = document.createElement('span');
                    keybind.textContent = `Hotkey: ${keybinds[index]}`;
                    keybind.classList.add('ability-keybind-info');
                    abilityDetails.appendChild(keybind);
                }
                
                abilityItem.appendChild(abilityDetails);
                abilitiesSection.appendChild(abilityItem);
            });
            
            this.characterStatsMenu.appendChild(abilitiesSection);
        }
        
        // Passive ability section
        if (character.passive) {
            const passiveSection = document.createElement('div');
            passiveSection.classList.add('stats-menu-section', 'passive-section');
            
            const passiveHeader = document.createElement('h3');
            passiveHeader.textContent = 'Passive';
            passiveHeader.classList.add('stats-menu-subheader');
            passiveSection.appendChild(passiveHeader);
            
            const passiveItem = document.createElement('div');
            passiveItem.classList.add('passive-item');
            
            // Passive header with icon
            const passiveHeaderDiv = document.createElement('div');
            passiveHeaderDiv.classList.add('buff-header'); // Reuse buff header style
            
            // REMOVED: Add passive icon if available
            /*
            if (character.passive.icon) {
                const passiveIcon = document.createElement('img');
                passiveIcon.classList.add('ability-icon-small');
                passiveIcon.src = character.passive.icon;
                passiveIcon.alt = character.passive.name;
                passiveHeaderDiv.appendChild(passiveIcon);
            }
            */
            
            const passiveName = document.createElement('span');
            passiveName.classList.add('passive-name');
            passiveName.textContent = character.passive.name;
            passiveHeaderDiv.appendChild(passiveName);
            
            passiveItem.appendChild(passiveHeaderDiv);
            
            // Add passive description
            if (character.passive.description) {
                const passiveDescription = document.createElement('div');
                passiveDescription.classList.add('passive-description');
                passiveDescription.textContent = character.passive.description;
                passiveItem.appendChild(passiveDescription);
            }
            
            // Add passive tracking info if available (e.g., lifestealFromPassive for InfernalBirdie)
            if (character.lifestealFromPassive !== undefined) {
                const trackingInfo = document.createElement('div');
                trackingInfo.classList.add('passive-tracking');
                trackingInfo.textContent = `Total Lifesteal gained: ${(character.lifestealFromPassive * 100).toFixed(1)}%`;
                passiveItem.appendChild(trackingInfo);
            }
            
            passiveSection.appendChild(passiveItem);
            this.characterStatsMenu.appendChild(passiveSection);
        }
        
        // Buffs section
        const buffsSection = document.createElement('div');
        buffsSection.classList.add('stats-menu-section', 'buffs-section');
        
        if (character.buffs && character.buffs.length > 0) {
            const buffsHeader = document.createElement('h3');
            buffsHeader.textContent = 'Buffs';
            buffsHeader.classList.add('stats-menu-subheader');
            buffsSection.appendChild(buffsHeader);
            
            character.buffs.forEach(buff => {
                const buffItem = document.createElement('div');
                buffItem.classList.add('buff-item');
                
                const buffHeader = document.createElement('div');
                buffHeader.classList.add('buff-header');
                
                // Add buff icon if available
                if (buff.icon) {
                    const buffIcon = document.createElement('img');
                    buffIcon.classList.add('buff-icon-small');
                    buffIcon.src = buff.icon;
                    buffIcon.alt = buff.name;
                    buffHeader.appendChild(buffIcon);
                }
                
                const buffName = document.createElement('span');
                buffName.classList.add('buff-name');
                buffName.textContent = buff.name;
                
                const buffDuration = document.createElement('span');
                buffDuration.classList.add('buff-duration');
                buffDuration.textContent = `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`;
                
                buffHeader.appendChild(buffName);
                buffHeader.appendChild(buffDuration);
                
                const buffDescription = document.createElement('div');
                buffDescription.classList.add('buff-description');
                buffDescription.textContent = buff.description || 'No description available.';
                
                buffItem.appendChild(buffHeader);
                buffItem.appendChild(buffDescription);
                buffsSection.appendChild(buffItem);
            });
        }
        
        this.characterStatsMenu.appendChild(buffsSection);
        
        // Debuffs section
        const debuffsSection = document.createElement('div');
        debuffsSection.classList.add('stats-menu-section', 'buffs-section');
        
        if (character.debuffs && character.debuffs.length > 0) {
            const debuffsHeader = document.createElement('h3');
            debuffsHeader.textContent = 'Debuffs';
            debuffsHeader.classList.add('stats-menu-subheader');
            debuffsSection.appendChild(debuffsHeader);
            
            character.debuffs.forEach(debuff => {
                const debuffItem = document.createElement('div');
                debuffItem.classList.add('buff-item');
                debuffItem.style.borderLeftColor = '#e74c3c';
                
                const debuffHeader = document.createElement('div');
                debuffHeader.classList.add('buff-header');
                
                // Add debuff icon if available
                if (debuff.icon) {
                    const debuffIcon = document.createElement('img');
                    debuffIcon.classList.add('buff-icon-small');
                    debuffIcon.src = debuff.icon;
                    debuffIcon.alt = debuff.name;
                    debuffHeader.appendChild(debuffIcon);
                }
                
                const debuffName = document.createElement('span');
                debuffName.classList.add('buff-name');
                debuffName.style.color = '#e74c3c';
                debuffName.textContent = debuff.name;
                
                const debuffDuration = document.createElement('span');
                debuffDuration.classList.add('buff-duration');
                debuffDuration.textContent = `${debuff.duration} turn${debuff.duration !== 1 ? 's' : ''}`;
                
                debuffHeader.appendChild(debuffName);
                debuffHeader.appendChild(debuffDuration);
                
                const debuffDescription = document.createElement('div');
                debuffDescription.classList.add('buff-description');
                debuffDescription.textContent = debuff.description || 'No description available.';
                
                debuffItem.appendChild(debuffHeader);
                debuffItem.appendChild(debuffDescription);
                debuffsSection.appendChild(debuffItem);
            });
        }
        
        this.characterStatsMenu.appendChild(debuffsSection);
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.classList.add('stats-menu-close');
        closeButton.addEventListener('click', () => {
            this.characterStatsMenu.style.display = 'none';
        });
        this.characterStatsMenu.appendChild(closeButton);
        
        // Set the position based on cursor coordinates
        this.characterStatsMenu.style.left = `${x}px`;
        this.characterStatsMenu.style.top = `${y}px`;
        this.characterStatsMenu.style.transform = 'none'; // Remove any transform that might have been set previously
        
        // Calculate if menu would go off-screen and adjust position if needed
        setTimeout(() => {
            const menuRect = this.characterStatsMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Check if menu extends beyond the right edge of viewport
            if (x + menuRect.width > viewportWidth) {
                this.characterStatsMenu.style.left = `${x - menuRect.width}px`;
            }
            
            // Check if menu extends beyond the bottom edge of viewport
            if (y + menuRect.height > viewportHeight) {
                this.characterStatsMenu.style.top = `${y - menuRect.height}px`;
            }
            
            // Make sure menu is not positioned off the left or top edges
            if (parseFloat(this.characterStatsMenu.style.left) < 0) {
                this.characterStatsMenu.style.left = '0px';
            }
            
            if (parseFloat(this.characterStatsMenu.style.top) < 0) {
                this.characterStatsMenu.style.top = '0px';
            }
        }, 0);
        
        // Show the menu
        this.characterStatsMenu.style.display = 'block';
    }

    // Create auto-select button
    createAutoSelectButton() {
        // Skip button creation - button is disabled in CSS
        console.log("Auto-select button creation skipped.");
        return;
    }
    
    // Update the auto-select button state
    updateAutoSelectButton(isEnabled) {
        // No-op since button is removed/hidden
    }

    // Show tooltip for status effects (buffs/debuffs)
    showStatusTooltip(event, statusEffect, type) {
        // Hide any existing tooltips
        this.hideStatusTooltip();
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = `status-tooltip ${type}-tooltip`;
        
        // Create tooltip header with icon and name
        const header = document.createElement('div');
        header.className = 'status-tooltip-header';
        
        // Add icon if available
        if (statusEffect.icon) {
            const iconImg = document.createElement('img');
            iconImg.src = statusEffect.icon;
            iconImg.className = 'status-tooltip-icon';
            header.appendChild(iconImg);
        }
        
        // Add name
        const name = document.createElement('div');
        name.className = 'status-tooltip-name';
        name.textContent = statusEffect.name || (type === 'buff' ? 'Buff' : 'Debuff');
        header.appendChild(name);
        
        // Add turns remaining
        const turns = document.createElement('div');
        turns.className = 'status-tooltip-turns';
        turns.textContent = `${statusEffect.duration} turn${statusEffect.duration !== 1 ? 's' : ''}`;
        header.appendChild(turns);
        
        tooltip.appendChild(header);
        
        // Add description
        const description = document.createElement('div');
        description.className = 'status-tooltip-description';
        description.textContent = statusEffect.description || 
            (type === 'buff' 
                ? 'A positive effect enhancing this character.' 
                : 'A negative effect hindering this character.');
        tooltip.appendChild(description);
        
        // Add to DOM to get dimensions
        tooltip.style.visibility = 'hidden';
        document.body.appendChild(tooltip);
        
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate best position that keeps tooltip within window
        let posX, posY;
        
        // Try to position to the right of the target
        if (rect.right + tooltipRect.width + 10 <= windowWidth) {
            posX = rect.right + 10;
        }
        // Otherwise try to position to the left
        else if (rect.left - tooltipRect.width - 10 >= 0) {
            posX = rect.left - tooltipRect.width - 10;
        }
        // If neither works, position horizontally centered but avoid overflow
        else {
            posX = Math.max(10, Math.min(windowWidth - tooltipRect.width - 10, rect.left));
        }
        
        // Try to position at the same vertical level
        if (rect.top + tooltipRect.height <= windowHeight) {
            posY = rect.top;
        }
        // Otherwise try to position above
        else if (rect.top - tooltipRect.height >= 0) {
            posY = rect.top - tooltipRect.height;
        }
        // If neither works, position at the top with minimal padding
        else {
            posY = 10;
        }
        
        // Set final position
        tooltip.style.left = `${posX}px`;
        tooltip.style.top = `${posY}px`;
        tooltip.style.visibility = 'visible';
        
        // Make tooltip visible with a slight delay for better UX
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 50);
    }
    
    // Hide status tooltip
    hideStatusTooltip() {
        const existingTooltips = document.querySelectorAll('.status-tooltip');
        existingTooltips.forEach(tooltip => {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                tooltip.remove();
            }, 200);
        });
    }

    // Create a debug button for Ayane's Teleport Blade ability
    createAyaneDebugButton() {
        const middleSection = document.querySelector('.middle-section');
        if (middleSection) {
            // Create the button element
            const debugButton = document.createElement('button');
            debugButton.id = 'ayane-debug-button';
            debugButton.className = 'ayane-debug-button';
            debugButton.textContent = 'Debug Ayane';
            debugButton.title = 'Force Ayane\'s Teleport Blade to reset';
            debugButton.style.backgroundColor = '#ff00aa';
            debugButton.style.color = 'white';
            debugButton.style.margin = '0 10px';
            debugButton.style.padding = '5px 10px';
            debugButton.style.border = 'none';
            debugButton.style.borderRadius = '4px';
            debugButton.style.cursor = 'pointer';
            
            // Add it before the end turn button
            if (this.endTurnButton) {
                middleSection.insertBefore(debugButton, this.endTurnButton);
            } else {
                middleSection.appendChild(debugButton);
            }
            
            // Add event listener
            debugButton.addEventListener('click', () => {
                if (window.forceAyaneAbilityReuse) {
                    const result = window.forceAyaneAbilityReuse();
                    if (result) {
                        console.log("[DEBUG UI] Ayane ability reset via debug button");
                    } else {
                        console.log("[DEBUG UI] Ayane ability reset failed - make sure Ayane is selected with Teleport Blade");
                        this.addLogEntry("Debug: Select Ayane and Teleport Blade first", "system");
                    }
                } else {
                    console.error("[DEBUG UI] forceAyaneAbilityReuse function not available");
                }
            });
            
            // Store reference to the button
            this.ayaneDebugButton = debugButton;
        }
    }

    // Inside the UIManager class
    createStageModifiersIndicator() {
        const modifiers = stageManager.getStageModifiers();
        if (!modifiers || modifiers.length === 0) {
            return;
        }
        
        // Create container for modifiers
        const modifiersContainer = document.createElement('div');
        modifiersContainer.className = 'stage-modifiers-container';
        document.querySelector('.middle-section').appendChild(modifiersContainer);
        
        // Create heading
        const heading = document.createElement('div');
        heading.className = 'stage-modifiers-heading';
        heading.textContent = 'Stage Modifiers:';
        modifiersContainer.appendChild(heading);
        
        // Create list of modifiers
        const modifiersList = document.createElement('div');
        modifiersList.className = 'stage-modifiers-list';
        modifiersContainer.appendChild(modifiersList);
        
        // Add each modifier to the list
        modifiers.forEach(modifier => {
            const modifierElement = document.createElement('div');
            modifierElement.className = 'stage-modifier';
            modifierElement.dataset.modifierId = modifier.id;
            
            // Create tooltip for the modifier
            modifierElement.title = `${modifier.name}: ${modifier.description}`;
            
            // Add an icon based on modifier type (placeholder, could be improved)
            const modifierIcon = document.createElement('span');
            modifierIcon.className = 'stage-modifier-icon';
            
            // Determine icon based on modifier type
            let iconText = '🛡️'; // Default icon
            if (modifier.effect) {
                switch (modifier.effect.type) {
                    case 'ai_damage_reduction':
                        iconText = '⚔️';
                        break;
                    // Add cases for other modifier types
                }
            }
            
            modifierIcon.textContent = iconText;
            modifierElement.appendChild(modifierIcon);
            
            // Add modifier name
            const modifierName = document.createElement('span');
            modifierName.className = 'stage-modifier-name';
            modifierName.textContent = modifier.name;
            modifierElement.appendChild(modifierName);
            
            // Add to list
            modifiersList.appendChild(modifierElement);
        });
    }

    /**
     * Applies visual styling to mark a character as dead without removing the element.
     * @param {Character} character - The character to mark.
     */
    markCharacterAsDead(character) {
        const elementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${elementId}`);
        if (characterElement) {
            characterElement.classList.add('character-dead'); // Add a class for styling
            characterElement.classList.remove('selected', 'valid-target', 'invalid-target', 'aoe-target'); // Remove interaction states
            console.log(`Marked character ${elementId} as dead visually.`);
            
            // Optionally disable ability buttons further
            const abilityButtons = characterElement.querySelectorAll('.ability');
            abilityButtons.forEach(button => button.disabled = true);
        } else {
            console.warn(`UIManager: Could not find element for character ${elementId} to mark as dead.`);
        }
    }

    // --- NEW: Add showFloatingText method ---
    showFloatingText(targetId, text, type) {
        console.log(`[UIManager] Showing floating text for ${targetId}: "${text}" (${type})`);
        // Try finding by instanceId first, then fall back to basic ID
        const targetElement = document.querySelector(`[data-instance-id="${targetId}"]`) || document.getElementById(`character-${targetId}`);
        if (!targetElement) {
            console.warn(`[UIManager] Could not find target element for floating text: ${targetId}`);
            return;
        }

        const floatingText = document.createElement('div');
        // Add base class and specific type class for styling
        floatingText.className = `floating-text ${type}`;
        floatingText.textContent = text;

        // Get target position relative to the viewport
        const rect = targetElement.getBoundingClientRect();
        // Get the main battle container for relative positioning
        const container = document.querySelector('.battle-container');
        if (!container) {
             console.error("[UIManager] Battle container not found for floating text!");
             return;
        }
        const containerRect = container.getBoundingClientRect();

        // Calculate position relative to the battle container
        const x = rect.left - containerRect.left + (rect.width / 2);
        const y = rect.top - containerRect.top; // Position above the element

        floatingText.style.position = 'absolute';
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        floatingText.style.transform = 'translateX(-50%)'; // Center horizontally
        floatingText.style.pointerEvents = 'none'; // Prevent interactions
        floatingText.style.zIndex = '110'; // Ensure it's above most elements

        // Add to the main battle container
        container.appendChild(floatingText);

        // Animation: Float up and fade out
        floatingText.animate([
            { transform: 'translate(-50%, 0)', opacity: 1 },
            { transform: 'translate(-50%, -60px)', opacity: 0 } // Float up 60px
        ], {
            duration: 1500, // 1.5 seconds
            easing: 'ease-out'
        }).onfinish = () => {
            floatingText.remove(); // Remove element after animation
        };
    }
    // --- END NEW --- 
}

// Global Game Manager instance creation
const gameManager = new GameManager();

// Make gameManager available globally immediately
window.gameManager = gameManager;

// Initialize when document is ready, but don't start game automatically
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the game manager
    await gameManager.initialize();
    console.log("Game manager initialized and ready");
}); 