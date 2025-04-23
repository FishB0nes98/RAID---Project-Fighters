// Game Manager for Roguelike Raid Game
class GameManager {
    constructor() {
        this.stageManager = new StageManager();
        this.uiManager = new UIManager(this);
        this.aiManager = new AIManager(this); // Initialize AI Manager
        this.characters = []; // Combined list of all characters
        this.gameState = null;
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
        this.gameState.phase = 'ai';
        
        // Deselect character and ability
        this.gameState.selectedCharacter = null;
        this.gameState.selectedAbility = null;
        
        // Update UI
        this.uiManager.clearSelection();
        this.uiManager.updatePhase('ai');
        this.uiManager.addLogEntry("AI's turn", 'enemy-turn');
        
        // Process effects for all characters (but don't reduce cooldowns or buff/debuff durations here)
        this.gameState.playerCharacters.concat(this.gameState.aiCharacters).forEach(char => {
            if (!char.isDead()) {
                // Process buffs/debuffs (without reducing durations)
                char.processEffects(false);
                
                // Regenerate resources
                char.regenerateResources();
                
                // Update UI for each character
                this.uiManager.updateCharacterUI(char);
            }
        });
        
        // Start AI turn with a delay - use aiManager instead of calling our own method
        setTimeout(() => this.aiManager.executeAITurn(), this.turnDelay);
    }

    // Execute AI turn
    async executeAITurn() {
        try {
            this.gameManager.gameState.phase = 'ai';
            this.gameManager.uiManager.updatePhase('ai');
            // No need to add log entry here, it's added in endPlayerTurn
            // this.gameManager.addLogEntry("AI's turn", 'enemy-turn');

            // --- NEW: Process AI effects at start of their turn --- 
            this.gameManager.gameState.aiCharacters.forEach(aiChar => {
                if (!aiChar.isDead()) {
                    // Process buffs/debuffs, reduce duration=true
                    aiChar.processEffects(true); 
                    // Reduce ability cooldowns
                    aiChar.abilities.forEach(ability => ability.reduceCooldown());
                    // Update UI after processing
                    this.gameManager.uiManager.updateCharacterUI(aiChar); 
                }
            });
            // --- END Process AI effects --- 

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
                possibleTargets = allPlayerChars; // Target the group of enemies
                break;
            case 'all': // Add 'all' case to target enemies
                possibleTargets = allPlayerChars; // Target the group of enemies
                break;
            case 'all_allies':
                possibleTargets = allAIChars; // Target the group
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

        // Select a random target from the valid list
        const targetIndex = Math.floor(Math.random() * possibleTargets.length);
        let selectedTarget = possibleTargets[targetIndex]; // Changed const to let

        console.log(`[AI Planner Debug] Initial target selected for ${selectedAbility.name}: ${selectedTarget.name} (isAI: ${selectedTarget.isAI})`);

        // Handle AoE abilities - target the whole group
        if (selectedAbility.targetType === 'all_enemies') {
            selectedTarget = allPlayerChars; // Pass the array
        } else if (selectedAbility.targetType === 'all_allies') {
            selectedTarget = allAIChars; // Pass the array
        } else if (selectedAbility.targetType === 'all') { // Handle the new 'all' case
            selectedTarget = allPlayerChars; // Pass the array of player characters
        }

        if (selectedTarget) {
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
           this.addLogEntry("AI turn ended.");
           this.gameState.phase = 'player';
           this.gameState.turn++; // Increment turn counter

           // Update turn counter UI
           this.uiManager.updateTurnCounter(this.gameState.turn);
           this.uiManager.updatePhase(this.gameState.phase);
           this.uiManager.resetActedCharacters();
           this.actedCharacters = []; // Reset the list of characters who have acted this turn

           // Apply stage effects at the start of the player turn sequence
           this.applyStageEffects(); // NEW CALL

           // --- NEW: Stage Passive Check - Burning Ground --- MOVED TO applyStageEffects() ---
           // if (this.stageManager.currentStage && this.stageManager.currentStage.id === 'burning_school_gym') {
           //     this.addLogEntry("The ground burns beneath the players!", "stage-effect");
           //     const burningDamage = 50;
           //     const playerChars = [...this.gameState.playerCharacters]; // Create copy to avoid issues if a character dies

           //     playerChars.forEach(playerChar => {
           //         if (!playerChar.isDead()) {
           //             // Apply damage directly, bypassing dodge/mitigation for stage effect
           //             const originalHp = playerChar.stats.currentHp;
           //             playerChar.stats.currentHp = Math.max(0, playerChar.stats.currentHp - burningDamage);
           //             const actualDamage = originalHp - playerChar.stats.currentHp;
           //             updateCharacterUI(playerChar); // Update UI immediately
           //             
           //             // Play damage VFX
           //             const charElement = document.getElementById(`character-${playerChar.id}`);
           //             if (charElement) {
           //                 const damageVfx = document.createElement('div');
           //                 damageVfx.className = 'damage-vfx stage-damage'; // Add specific class if needed
           //                 damageVfx.textContent = `-${actualDamage}`;
           //                 charElement.appendChild(damageVfx);
           //                 setTimeout(() => damageVfx.remove(), 1000);
           //             }

           //             this.addLogEntry(`${playerChar.name} takes ${actualDamage} damage from Burning Ground.`, "stage-effect");

           //             if (playerChar.isDead()) {
           //                 this.addLogEntry(`${playerChar.name} succumbed to the flames!`, "stage-effect");
           //                 // Handle character removal from UI/game state if necessary, might need a dedicated function
           //                 this.uiManager.removeCharacter(playerChar);
           //                 // Check game over immediately after a character dies from stage effect
           //                 if(this.checkGameOver()) return; // Stop processing if game over
           //             }
           //         }
           //     });
           //     // Update player characters array in case someone died
           //     this.gameState.playerCharacters = this.gameState.playerCharacters.filter(p => !p.isDead());
           // }
           // --- END Stage Passive Check ---
           
           // Process effects and reduce cooldowns for player characters at the start of their turn
           this.gameState.playerCharacters.forEach(char => {
               if (!char.isDead()) {
                   // Process buffs/debuffs, reduce duration=true
                   char.processEffects(true);
                   // Reduce ability cooldowns
                   char.abilities.forEach(ability => ability.reduceCooldown());
                   updateCharacterUI(char); // Update UI after processing
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

           // Add checks for other stage effects here in the future
       }
       // --- END applyStageEffects ---

       // Check if the game is over
       checkGameOver() {
           let gameOver = false;
           let isVictory = false;
           
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
                    if (condition.type === "allEnemiesDefeated") {
                         const allAIDead = this.gameState.aiCharacters.length > 0 && this.gameState.aiCharacters.every(char => char.isDead());
                         if (allAIDead) {
                             console.log('[GameManager] checkGameOver: Win condition met - allEnemiesDefeated.');
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
           
           // --- Old Victory Check (Replaced by condition loop above) ---
           /*
           const allAIDead = this.gameState.aiCharacters.length > 0 && this.gameState.aiCharacters.every(char => char.isDead());
           if (!gameOver && allAIDead) {
                // --- DEBUG LOGGING ---\n                console.log('[GameManager] checkGameOver: All AI detected as dead.');
                // --- DEBUG LOGGING END ---\n               gameOver = true;
               isVictory = true;
           }
           */

           if (gameOver) {
                // --- DEBUG LOGGING ---\n                console.log(`[GameManager] checkGameOver: Game Over detected. Victory: ${isVictory}`);
                console.log('[GameManager] Attempting to save battle result...');
                // --- DEBUG LOGGING END ---
               
               // Save result (especially important for story mode)
               this.saveBattleResultToFirebase(isVictory)
                   .then(() => {
                       // --- DEBUG LOGGING ---
                       console.log('[GameManager] Battle result saved (or save skipped). Showing Game Over screen...');
                       // --- DEBUG LOGGING END ---
                       // Show game over screen using UIManager
                       this.uiManager.showGameOverScreen(isVictory);
                       
                       // Maybe clear log AFTER showing screen so user can see final messages? Or maybe not clear at all?
                       // this.clearBattleLog(); // Consider removing or moving this clear
                   })
                   .catch(error => {
                       // --- DEBUG LOGGING ---
                       console.error('[GameManager] Error saving battle result, but still showing Game Over screen.', error);
                       // --- DEBUG LOGGING END ---
                       // Still show the game over screen even if saving failed
                       this.uiManager.showGameOverScreen(isVictory);
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
               } catch (error) {
                   console.error(`[GameManager] Firebase Error: Failed to save standalone battle result for stage ${stageId}:`, error);
                   // Re-throw the error so the caller knows it failed
                   throw error;
               }
           }
           else {
               console.log('[GameManager] No stage ID identified. Skipping Firebase save.');
           }
       }
       // --- END NEW --- 

       /**
        * Resets the game state to its initial values.
        */
       resetGame() {
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
           this.isGameOver = false;
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
           console.log(`[handleCharacterDeath] Processing death for: ${character.name} (ID: ${character.id}, InstanceID: ${character.instanceId})`);
           // Mark character as dead internally if not already (belt-and-suspenders)
           // Character.applyDamage should set currentHp to 0 or less.

           // Remove from the correct game state array
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
           } else {
                console.warn(`[handleCharacterDeath] Could not find character ${character.name} (ID: ${character.id}, InstanceID: ${character.instanceId}) in game state arrays.`);
           }

           // Check for game over after handling death
           this.checkGameOver();

           // Update the End Turn button state, as a death might change who can act
           this.uiManager.updateEndTurnButton();
       }
   }

   // AI Manager for handling AI turns
   class AIManager {
       constructor(gameManager) {
           this.gameManager = gameManager;
           this.previousActions = {}; // Track previous actions to avoid repetition
       }

       async executeAITurn() {
           try {
               this.gameManager.gameState.phase = 'ai';
               this.gameManager.uiManager.updatePhase('ai');
               // No need to add log entry here, it's added in endPlayerTurn
               // this.gameManager.addLogEntry("AI's turn", 'enemy-turn');

               // --- NEW: Process AI effects at start of their turn --- 
               this.gameManager.gameState.aiCharacters.forEach(aiChar => {
                   if (!aiChar.isDead()) {
                       // Process buffs/debuffs, reduce duration=true
                       aiChar.processEffects(true); 
                       // Reduce ability cooldowns
                       aiChar.abilities.forEach(ability => ability.reduceCooldown());
                       // Update UI after processing
                       this.gameManager.uiManager.updateCharacterUI(aiChar); 
                   }
               });
               // --- END Process AI effects --- 

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

           // Select a random target from the valid list
           const targetIndex = Math.floor(Math.random() * possibleTargets.length);
           let selectedTarget = possibleTargets[targetIndex]; // Changed const to let

           console.log(`[AI Planner Debug] Initial target selected for ${selectedAbility.name}: ${selectedTarget.name} (isAI: ${selectedTarget.isAI})`);

           // Handle AoE abilities - target the whole group
           if (selectedAbility.targetType === 'all_enemies') {
               selectedTarget = allPlayerChars; // Pass the array
           } else if (selectedAbility.targetType === 'all_allies') {
               selectedTarget = allAIChars; // Pass the array
           } else if (selectedAbility.targetType === 'all') { // Handle the new 'all' case
               selectedTarget = allPlayerChars; // Pass the array of player characters
           }

           if (selectedTarget) {
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
                this.gameManager.addLogEntry(`AI encountered an error retrieving planned action.`, 'error'); // Use gameManager
                return;
            }

            const gameState = this.gameManager.gameState; // Get gameState from gameManager
            const caster = gameState.aiCharacters[action.casterIndex];
            const ability = caster ? caster.abilities[action.abilityIndex] : null;
            let targetInfo = action.target; // Target from the planned action (can be object or array)

            if (!caster || !ability) {
                console.error("AI executeAction: Caster or Ability not found for action:", action);
                this.gameManager.addLogEntry(`AI encountered an error finding character or ability.`, 'error'); // Use gameManager
                return;
            }
            
            // --- VALIDATION CHECKS --- 
            if (caster.isDead() || caster.isStunned()) {
                this.gameManager.addLogEntry(`${caster.name} cannot execute action (dead or stunned).`, 'enemy-turn'); // Use gameManager
                return;
            }
            if (caster.stats.currentMana < ability.manaCost) {
                this.gameManager.addLogEntry(`${caster.name} does not have enough mana for ${ability.name}. Skipping action.`, 'enemy-turn'); // Use gameManager
                return;
            }
            if (ability.currentCooldown > 0) {
                 this.gameManager.addLogEntry(`${caster.name}'s ${ability.name} is still on cooldown (${ability.currentCooldown} turns). Skipping action.`, 'enemy-turn'); // Use gameManager
                 return;
            }
            if (ability.isDisabled) { 
                 this.gameManager.addLogEntry(`${caster.name}'s ${ability.name} is disabled. Skipping action.`, 'enemy-turn'); // Use gameManager
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
            
            // Render player characters
            playerCharacters.forEach(function(character) {
                const charElement = this.createCharacterElement(character);
                playerContainer.appendChild(charElement);
            }, this);
            
            // Render AI characters
            aiCharacters.forEach(function(character) {
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
            if (!charElement) {
                console.error(`UI element not found for character: ${elementId}`);
                return; // Exit if element not found
            }
            
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
                const buffIcon = document.createElement('div');
                buffIcon.className = 'status-icon buff-icon';
                
                // Add buff icon if available
                if (buff.icon) {
                    const img = document.createElement('img');
                    img.src = buff.icon;
                    img.alt = buff.name;
                    img.className = 'effect-icon';
                    buffIcon.appendChild(img);
                }
                
                // Add turn counter
                const durationElement = document.createElement('div');
                durationElement.className = 'status-duration';
                durationElement.textContent = buff.duration;
                buffIcon.appendChild(durationElement);
                
                // Add enhanced tooltip functionality
                buffIcon.addEventListener('mouseenter', (e) => {
                    this.showStatusTooltip(e, buff, 'buff');
                });
                
                buffIcon.addEventListener('mouseleave', () => {
                    this.hideStatusTooltip();
                });
                
                buffsDiv.appendChild(buffIcon);
            });
            
            // Update debuffs
            const debuffsDiv = charElement.querySelector('.debuffs');
            debuffsDiv.innerHTML = '';
            
            character.debuffs.forEach((debuff) => {
                // --- MODIFICATION START: Skip rendering icon for Birdie's internal stun --- 
                if (debuff.id === 'birdie_internal_stun') {
                    return; // Skip the rest of the loop for this specific debuff
                }
                // --- MODIFICATION END ---

                const debuffIcon = document.createElement('div');
                debuffIcon.className = 'status-icon debuff-icon';
                
                // Add debuff icon if available
                if (debuff.icon) {
                    const img = document.createElement('img');
                    img.src = debuff.icon;
                    img.alt = debuff.name;
                    img.className = 'effect-icon';
                    debuffIcon.appendChild(img);
                }
                
                // Add turn counter
                const durationElement = document.createElement('div');
                durationElement.className = 'status-duration';
                durationElement.textContent = debuff.duration;
                debuffIcon.appendChild(durationElement);
                
                // Add enhanced tooltip functionality
                debuffIcon.addEventListener('mouseenter', (e) => {
                    this.showStatusTooltip(e, debuff, 'debuff');
                });
                
                debuffIcon.addEventListener('mouseleave', () => {
                    this.hideStatusTooltip();
                });
                
                debuffsDiv.appendChild(debuffIcon);
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
                        if (buffCount === 5 || buffCount === 10) {
                            // Play a sound effect if available
                            if (typeof playSound === 'function') {
                                playSound('sfx_lion_roar');
                            }
                        }
                        
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

        // Show game over screen
        showGameOverScreen(isVictory) {
            // Use the global showGameOverScreen function if available
            if (window.showGameOverScreen) {
                window.showGameOverScreen(isVictory);
            } else {
                // Fallback to simple alert
                const message = isVictory ? 
                    "Victory! You've defeated all enemies." : 
                    "Defeat! Your team has been defeated.";
                    
                alert(message);
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
        // Debug output to check character stats structure
        console.log("Character stats structure:", character.id, character.stats);
        if (character.buffs && character.buffs.length > 0) {
            console.log("Buffs:", character.buffs);
        }
        
        // Remove any existing stats menu
        const existingMenu = document.getElementById('character-stats-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Check if character is in bottom row
        const isBottomRow = !character.isAI;
        
        // Create stats menu
        const statsMenu = document.createElement('div');
        statsMenu.id = 'character-stats-menu';
        statsMenu.className = 'character-stats-menu';
        
        // Add bottom-character class for better positioning if character is in bottom row
        if (isBottomRow) {
            statsMenu.classList.add('bottom-character');
        }
        
        // Temporarily add to DOM with visibility:hidden to calculate dimensions
        statsMenu.style.visibility = 'hidden';
        document.body.appendChild(statsMenu);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'stats-menu-header';
        header.textContent = character.name;
        statsMenu.appendChild(header);
        
        // Create stats section
        const statsSection = document.createElement('div');
        statsSection.className = 'stats-menu-section';
        
        // Add stats
        const statsList = document.createElement('ul');
        statsList.className = 'stats-list';
        
        // Use character's base stats (retrieved from registry) to compare with current stats
        // This ensures all buffs are reflected correctly
        const baseStats = {};
        
        // Attempt to retrieve the original character stats from the registry
        try {
            if (window.characterRegistry && window.characterRegistry[character.id]) {
                const regChar = window.characterRegistry[character.id];
                if (regChar.stats) {
                    baseStats.physicalDamage = regChar.stats.physicalDamage || 0;
                    baseStats.magicalDamage = regChar.stats.magicalDamage || 0;
                    baseStats.armor = regChar.stats.armor || 0;
                    baseStats.magicalShield = regChar.stats.magicalShield || 0;
                    baseStats.lifesteal = regChar.stats.lifesteal || 0;
                    baseStats.dodgeChance = regChar.stats.dodgeChance || 0;
                    baseStats.critChance = regChar.stats.critChance || 0;
                    baseStats.critDamage = regChar.stats.critDamage || 1.5;
                    baseStats.healingPower = regChar.stats.healingPower || 0;
                }
            }
        } catch (e) {
            console.warn("Error retrieving base stats:", e);
        }
        
        // Check for any buff-specific origins of stat modifications (like Ready to Slice for Ayane)
        const buffModifiedStats = {};
        
        if (character.buffs && character.buffs.length > 0) {
            character.buffs.forEach(buff => {
                // Check specifically for Ready to Slice buff which stores original values
                if (buff.id === 'ready_to_slice') {
                    if (character.readyToSliceOriginalPhysicalDamage !== undefined) {
                        buffModifiedStats.physicalDamage = character.readyToSliceOriginalPhysicalDamage;
                    }
                    if (character.readyToSliceOriginalDodgeChance !== undefined) {
                        buffModifiedStats.dodgeChance = character.readyToSliceOriginalDodgeChance;
                    }
                }
                
                // Could add other buff-specific handling here if needed
            });
        }
        
        // Flag to check if any buffs are modifying stats
        let hasStatBuffs = character.buffs && character.buffs.length > 0;
        
        // Define stats to display
        const statsToDisplay = [
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
        
        statsToDisplay.forEach(stat => {
            if (stat.value && stat.value !== 0 && stat.value !== '0%') {
                const statItem = document.createElement('li');
                
                // Check if this stat has a baseValue to compare with current
                if (hasStatBuffs) {
                    let originalValue, currentValue;
                    
                    // First check if we have a buff-stored original value (like from Ready to Slice)
                    if (stat.buffValue !== undefined) {
                        originalValue = stat.buffValue;
                    } else if (stat.baseValue !== undefined) {
                        originalValue = stat.baseValue;
                    } else {
                        originalValue = null;
                    }
                    
                    // Format value based on stat type
                    if (stat.key === 'dodgeChance' || stat.key === 'critChance' || stat.key === 'lifesteal' || stat.key === 'critDamage') {
                        currentValue = character.stats[stat.key] || 0;
                    } else {
                        currentValue = typeof stat.value === 'string' ? character.stats[stat.key] : stat.value;
                    }
                    
                    // Calculate percentage change if there's a difference and we have the original value
                    if (originalValue !== null && originalValue !== currentValue) {
                        const percentChange = originalValue > 0 ? 
                            ((currentValue - originalValue) / originalValue) * 100 : 
                            currentValue > 0 ? 100 : 0;
                        
                        const isPositive = percentChange > 0;
                        const changeColor = isPositive ? '#4cd137' : '#e74c3c';
                        const changeSymbol = isPositive ? '+' : '';
                        
                        // Round to nearest integer, but for very small changes (< 1%), show at least 1%
                        const displayPercent = Math.abs(percentChange) < 1 && percentChange !== 0 ? 
                            (isPositive ? 1 : -1) : 
                            Math.round(percentChange);
                        
                        const percentText = `${changeSymbol}${displayPercent}%`;
                        
                        // Format the value appropriately
                        let formattedValue;
                        if (stat.key === 'dodgeChance' || stat.key === 'critChance' || stat.key === 'lifesteal' || stat.key === 'critDamage') {
                            formattedValue = `${(currentValue * 100).toFixed(1)}%`;
                        } else if (stat.key === 'hp' || stat.key === 'mana') {
                            formattedValue = stat.value; // Keep the original format for hp/mana
                        } else {
                            formattedValue = Math.round(currentValue);
                        }
                        
                        // Apply colored stat value with percentage indicator
                        statItem.innerHTML = `
                            <span class="stat-name">${stat.name}:</span>
                            <span class="stat-value">
                                <span style="color: ${changeColor}; font-weight: bold;">${formattedValue}</span> 
                                <span class="stat-change" style="color: ${changeColor};">(${percentText})</span>
                            </span>`;
                    } else {
                        // Add tooltip if available
                        if (stat.tooltip) {
                            statItem.title = stat.tooltip;
                            statItem.classList.add('has-tooltip');
                        }
                        statItem.innerHTML = `<span class="stat-name">${stat.name}:</span> <span class="stat-value">${stat.value}</span>`;
                    }
                } else {
                    // Add tooltip if available
                    if (stat.tooltip) {
                        statItem.title = stat.tooltip;
                        statItem.classList.add('has-tooltip');
                    }
                    statItem.innerHTML = `<span class="stat-name">${stat.name}:</span> <span class="stat-value">${stat.value}</span>`;
                }
                
                statsList.appendChild(statItem);
            }
        });
        
        statsSection.appendChild(statsList);
        statsMenu.appendChild(statsSection);
        
        // Rest of the method for buffs, abilities, etc. remains the same...
        
        // Add active buffs section if character has buffs
        if (character.buffs && character.buffs.length > 0) {
            const buffsHeader = document.createElement('div');
            buffsHeader.className = 'stats-menu-subheader';
            buffsHeader.textContent = 'Active Buffs';
            statsMenu.appendChild(buffsHeader);
            
            const buffsSection = document.createElement('div');
            buffsSection.className = 'stats-menu-section buffs-section';
            
            character.buffs.forEach(buff => {
                const buffItem = document.createElement('div');
                buffItem.className = 'buff-item';
                
                const buffHeader = document.createElement('div');
                buffHeader.className = 'buff-header';
                
                if (buff.icon) {
                    const buffIcon = document.createElement('img');
                    buffIcon.src = buff.icon;
                    buffIcon.className = 'buff-icon-small';
                    buffHeader.appendChild(buffIcon);
                }
                
                const buffName = document.createElement('span');
                buffName.className = 'buff-name';
                buffName.textContent = buff.name;
                buffHeader.appendChild(buffName);
                
                const buffDuration = document.createElement('span');
                buffDuration.className = 'buff-duration';
                buffDuration.textContent = `${buff.duration} turns`;
                buffHeader.appendChild(buffDuration);
                
                const buffDescription = document.createElement('div');
                buffDescription.className = 'buff-description';
                buffDescription.textContent = buff.description;
                
                buffItem.appendChild(buffHeader);
                buffItem.appendChild(buffDescription);
                buffsSection.appendChild(buffItem);
            });
            
            statsMenu.appendChild(buffsSection);
        }
        
        // Add abilities section
        if (character.abilities && character.abilities.length > 0) {
            const abilitiesHeader = document.createElement('div');
            abilitiesHeader.className = 'stats-menu-subheader';
            abilitiesHeader.textContent = 'Abilities';
            statsMenu.appendChild(abilitiesHeader);
            
            const abilitiesSection = document.createElement('div');
            abilitiesSection.className = 'stats-menu-section abilities-section';
            
            character.abilities.forEach(ability => {
                const abilityItem = document.createElement('div');
                abilityItem.className = 'ability-item';
                
                const abilityHeader = document.createElement('div');
                abilityHeader.className = 'ability-header';
                
                if (ability.icon) {
                    const abilityIcon = document.createElement('img');
                    abilityIcon.src = ability.icon;
                    abilityIcon.className = 'ability-icon-small';
                    abilityHeader.appendChild(abilityIcon);
                }
                
                const abilityName = document.createElement('span');
                abilityName.className = 'ability-name';
                abilityName.textContent = ability.name;
                abilityHeader.appendChild(abilityName);
                
                const abilityDescription = document.createElement('div');
                abilityDescription.className = 'ability-description';
                abilityDescription.textContent = ability.description;
                
                const abilityDetails = document.createElement('div');
                abilityDetails.className = 'ability-details';
                abilityDetails.innerHTML = `Mana: ${ability.manaCost} | Cooldown: ${ability.cooldown}`;
                
                abilityItem.appendChild(abilityHeader);
                abilityItem.appendChild(abilityDescription);
                abilityItem.appendChild(abilityDetails);
                abilitiesSection.appendChild(abilityItem);
            });
            
            statsMenu.appendChild(abilitiesSection);
        }
        
        // Add passive ability if exists
        if (character.passive) {
            const passiveHeader = document.createElement('div');
            passiveHeader.className = 'stats-menu-subheader';
            passiveHeader.textContent = 'Passive';
            statsMenu.appendChild(passiveHeader);
            
            const passiveSection = document.createElement('div');
            passiveSection.className = 'stats-menu-section';
            
            const passiveItem = document.createElement('div');
            passiveItem.className = 'passive-item';
            
            const passiveName = document.createElement('div');
            passiveName.className = 'passive-name';
            passiveName.textContent = character.passive.name;
            
            const passiveDescription = document.createElement('div');
            passiveDescription.className = 'passive-description';
            passiveDescription.textContent = character.passive.description;
            
            passiveItem.appendChild(passiveName);
            passiveItem.appendChild(passiveDescription);
            passiveSection.appendChild(passiveItem);
            
            statsMenu.appendChild(passiveSection);
        }
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'stats-menu-close';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            statsMenu.remove();
        });
        statsMenu.appendChild(closeButton);
        
        // Calculate dimensions and adjust position
        const menuRect = statsMenu.getBoundingClientRect();
        const menuWidth = menuRect.width;
        const menuHeight = menuRect.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Add scrolling if menu height is too large (more than 80% of window height)
        if (menuHeight > windowHeight * 0.8) {
            statsMenu.style.maxHeight = `${windowHeight * 0.8}px`;
            statsMenu.style.overflowY = 'auto';
            
            // Add padding to accommodate scrollbar
            statsMenu.style.paddingRight = '5px';
        }
        
        // Ensure the menu stays within the window bounds
        let finalX = x;
        let finalY = y;
        
        // Check horizontally
        if (x + menuWidth > windowWidth - 10) {
            finalX = Math.max(10, windowWidth - menuWidth - 10);
        }
        if (finalX < 10) {
            finalX = 10;
        }
        
        // Check vertically - make sure we account for the possibly applied max-height
        const actualHeight = Math.min(menuHeight, windowHeight * 0.8);
        
        // If using bottom-character class, we'll position from the bottom instead of the top
        if (isBottomRow) {
            // Don't set top position since we're using bottom in the CSS
            statsMenu.style.left = `${finalX}px`;
        } else {
            // If it would go below the bottom of the window, position it higher
            if (y + actualHeight > windowHeight - 10) {
                finalY = Math.max(10, windowHeight - actualHeight - 10);
            }
            if (finalY < 10) {
                finalY = 10;
            }
            
            // Set final position 
            statsMenu.style.left = `${finalX}px`;
            statsMenu.style.top = `${finalY}px`;
        }
        
        // Make visible
        statsMenu.style.visibility = 'visible';
        
        // Add click outside to close
        document.addEventListener('click', function closeMenu(e) {
            if (!statsMenu.contains(e.target) && e.target.id !== 'character-stats-menu') {
                statsMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    // Create auto-select button
    createAutoSelectButton() {
        // --- NEW: Check if button already exists ---
        if (document.getElementById('auto-select-button')) {
            console.log("Auto-select button already exists. Skipping creation.");
            this.autoSelectButton = document.getElementById('auto-select-button'); // Ensure reference is set
            return; // Don't create another one
        }
        // --- END NEW ---

        const middleSection = document.querySelector('.middle-section');
        if (middleSection) {
            // Create the button element
            const autoSelectButton = document.createElement('button');
            autoSelectButton.id = 'auto-select-button';
            autoSelectButton.className = 'auto-select-button';
            autoSelectButton.textContent = 'Enable Auto Character';
            autoSelectButton.title = 'Automatically selects the best character for each turn and after abilities are used';
            
            // Add it before the end turn button
            if (this.endTurnButton) {
                middleSection.insertBefore(autoSelectButton, this.endTurnButton);
            } else {
                middleSection.appendChild(autoSelectButton);
            }
            
            // Add event listener
            autoSelectButton.addEventListener('click', () => {
                if (this.gameManager.isGameRunning) {
                    this.gameManager.toggleAutoSelect();
                }
            });
            
            // Store reference to the button
            this.autoSelectButton = autoSelectButton;
        }
    }
    
    // Update the auto-select button state
    updateAutoSelectButton(isEnabled) {
        if (this.autoSelectButton) {
            if (isEnabled) {
                this.autoSelectButton.textContent = 'Disable Auto Character';
                this.autoSelectButton.classList.add('active');
            } else {
                this.autoSelectButton.textContent = 'Enable Auto Character';
                this.autoSelectButton.classList.remove('active');
            }
        }
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