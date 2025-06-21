// Game Manager for Roguelike Raid Game
class GameManager {
    constructor() {
        this.stageManager = new StageManager();
        this.uiManager = new UIManager(this);
        this.aiManager = new AIManager(this); // Initialize AI Manager
        this.weeklyChallengeAI = null; // Will be initialized when weekly challenge mode is enabled
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
        this.debug = false; // Enable debug logging
        
        // Audio context and sound buffer cache
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundBuffers = {};
        this.soundsLoading = {}; // Track sounds currently being loaded
        this.bgmPlayer = null; // Background music player
        this.bgmVolume = 0.3; // Default background music volume
        this.sfxVolume = 0.3; // Default sound effects volume
        
        // Load volume settings from localStorage if available
        const savedVolume = localStorage.getItem('gameVolume');
        if (savedVolume) {
            try {
                const volumeSettings = JSON.parse(savedVolume);
                this.bgmVolume = volumeSettings.bgm || 0.3;
                this.sfxVolume = volumeSettings.sfx || 0.3;
            } catch (e) {
                console.error('Error loading volume settings:', e);
            }
        }
        
        // Initialize preventTurnEnd flag
        this.preventTurnEndFlag = false;
        
        // Add weekly challenge mode toggle for debugging
        window.toggleWeeklyChallengeMode = () => {
            if (this.isWeeklyChallengeMode) {
                this.disableWeeklyChallengeMode();
                console.log('Weekly Challenge Mode DISABLED');
                return false;
            } else {
                this.enableWeeklyChallengeMode();
                console.log('Weekly Challenge Mode ENABLED - Healing Forbidden Challenge active!');
                return true;
            }
        };

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
        
        this.controllerManager = null; // Add a reference to the controller manager
        this.tutorialManager = null; // Tutorial manager for guided experiences
        this.isWeeklyChallengeMode = false; // Flag to track if weekly challenge mode is active
        
        this.playerProgressData = null; // Store player progress data
        this.questManager = null; // Will be initialized when available
        
        // Debug cheat code system
        this.debugKeySequence = '';
        this.debugKeyTimeout = null;
        this.initializeDebugCheatCodes();
        
        // Add debug function to window for testing HP bar calculations
        window.debugHPBars = () => {
            console.log('=== HP BAR DEBUG TEST ===');
            if (this.stageManager && this.stageManager.gameState) {
                const allCharacters = [
                    ...(this.stageManager.gameState.playerCharacters || []),
                    ...(this.stageManager.gameState.aiCharacters || [])
                ];
                
                allCharacters.forEach(char => {
                    const element = document.getElementById(`character-${char.instanceId || char.id}`);
                    if (element) {
                        const hpBar = element.querySelector('.hp-bar');
                        const hpText = element.querySelector('.hp-bar').parentElement.querySelector('.bar-text');
                        const hpPercentage = (char.stats.currentHp / char.stats.maxHp) * 100;
                        
                        console.log(`${char.name}:`, {
                            currentHp: char.stats.currentHp,
                            maxHp: char.stats.maxHp,
                            calculatedPercentage: hpPercentage.toFixed(1) + '%',
                            barWidth: hpBar.style.width,
                            textDisplay: hpText.textContent,
                            stageModifications: char.stageModifications,
                            baseStats: char.baseStats
                        });
                    }
                });
            } else {
                console.log('Game not started or no characters loaded');
            }
            console.log('=== END HP BAR DEBUG ===');
        };
        
        console.log('GameManager initialized. Use window.debugHPBars() in browser console to test HP calculations');
    }
    
    // Test battle log functionality
    testBattleLog() {
        console.log('[GameManager] Testing battle log functionality...');
        this.addLogEntry('🎮 Game Manager Initialized', 'system');
        this.addLogEntry('🔥 Battle log is working correctly!', 'system');
        console.log('[GameManager] Battle log test completed');
    }

    /**
     * Initialize debug cheat code system
     */
    initializeDebugCheatCodes() {
        // Listen for keydown events to capture cheat codes
        document.addEventListener('keydown', (event) => {
            // Ignore if user is typing in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Add the pressed key to the sequence
            this.debugKeySequence += event.key.toLowerCase();
            
            // Clear timeout if it exists
            if (this.debugKeyTimeout) {
                clearTimeout(this.debugKeyTimeout);
            }
            
            // Set new timeout to clear sequence after 2 seconds
            this.debugKeyTimeout = setTimeout(() => {
                this.debugKeySequence = '';
            }, 2000);
            
            // Check for "uhm" cheat code
            if (this.debugKeySequence.includes('uhm')) {
                this.activateEnemyLowHPCheat();
                this.debugKeySequence = ''; // Clear sequence after activation
                if (this.debugKeyTimeout) {
                    clearTimeout(this.debugKeyTimeout);
                }
            }
            
            // Keep sequence length reasonable (prevent memory issues)
            if (this.debugKeySequence.length > 10) {
                this.debugKeySequence = this.debugKeySequence.slice(-5);
            }
        });
        
        console.log('[GameManager] Debug cheat codes initialized. Type "uhm" quickly to activate enemy low HP cheat.');
    }

    /**
     * Cheat code: Set all enemy HP to 1%
     */
    activateEnemyLowHPCheat() {
        if (!this.gameState || !this.gameState.aiCharacters) {
            console.warn('[Debug] No AI characters found. Game may not be started yet.');
            return;
        }
        
        let enemiesAffected = 0;
        
        // Set all AI characters' HP to 1% of their max HP
        this.gameState.aiCharacters.forEach(enemy => {
            if (!enemy.isDead()) {
                const onePercent = Math.max(1, Math.floor(enemy.stats.maxHp * 0.01));
                enemy.stats.currentHp = onePercent;
                enemiesAffected++;
                
                // Update UI to reflect the HP change
                if (this.uiManager) {
                    this.uiManager.updateCharacterUI(enemy);
                }
            }
        });
        
        // Add visual feedback
        if (this.uiManager) {
            this.uiManager.addLogEntry(
                `🔧 DEBUG CHEAT: Set ${enemiesAffected} enemies to 1% HP!`, 
                'system'
            );
        }
        
        // Add screen shake for dramatic effect
        if (this.uiManager) {
            this.uiManager.addScreenShake();
        }
        
        console.log(`[Debug] Enemy low HP cheat activated! ${enemiesAffected} enemies affected.`);
    }

    /**
     * Enable Weekly Challenge Mode with intelligent AI
     */
    enableWeeklyChallengeMode() {
        this.isWeeklyChallengeMode = true;
        if (typeof WeeklyChallengeAI !== 'undefined') {
            this.weeklyChallengeAI = new WeeklyChallengeAI(this);
            this.weeklyChallengeAI.initialize();
            console.log('[GameManager] Weekly Challenge Mode enabled with intelligent AI');
        } else {
            console.error('[GameManager] WeeklyChallengeAI class not found. Make sure weekly-challenge-ai.js is loaded.');
        }
    }

    /**
     * Disable Weekly Challenge Mode
     */
    disableWeeklyChallengeMode() {
        this.isWeeklyChallengeMode = false;
        this.weeklyChallengeAI = null;
        console.log('[GameManager] Weekly Challenge Mode disabled');
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

    // Initialize tutorial system for tutorial stages
    initializeTutorial(stage) {
        console.log('[GameManager] initializeTutorial called with stage:', stage?.name, 'isTutorial:', stage?.isTutorial);
        
        if (!stage || !stage.isTutorial) {
            console.log('[GameManager] Not a tutorial stage, skipping tutorial initialization');
            return;
        }

        console.log('[GameManager] Initializing tutorial for stage:', stage.name);
        console.log('[GameManager] Stage data:', JSON.stringify(stage, null, 2));
        
        // Ensure TutorialManager class is available
        if (typeof TutorialManager === 'undefined') {
            console.error('[GameManager] TutorialManager class not found! Check if script is loaded.');
            return;
        }
        
        // Create tutorial manager if not exists
        if (!this.tutorialManager) {
            try {
                this.tutorialManager = new TutorialManager(this);
                console.log('[GameManager] TutorialManager created successfully');
            } catch (error) {
                console.error('[GameManager] Error creating TutorialManager:', error);
                return;
            }
        }
        
        // Initialize tutorial with stage data
        console.log('[GameManager] Calling tutorialManager.initialize with stage data...');
        try {
            if (this.tutorialManager.initialize(stage)) {
                console.log('[GameManager] Tutorial initialization successful, starting tutorial for stage:', stage.name);
                // Start tutorial after a delay to ensure stage is fully loaded
                setTimeout(() => {
                    console.log('[GameManager] Starting tutorial now...');
                    this.tutorialManager.start();
                }, 1000);
            } else {
                console.log('[GameManager] Tutorial initialization failed, falling back to simple message');
                // Fallback to simple tutorial message if TutorialManager fails
                if (stage.tutorialMessage) {
                    setTimeout(() => {
                        this.showTutorialMessage(stage.tutorialMessage, stage.tutorialHighlights || []);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('[GameManager] Error during tutorial initialization:', error);
        }
    }
    
    showTutorialMessage(message, highlights = []) {
        // Create tutorial overlay
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-content">
                <h3>Tutorial</h3>
                <p>${message}</p>
                <button class="tutorial-close-btn" onclick="this.closest('.tutorial-overlay').remove(); document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));">Got it!</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Apply highlights
        highlights.forEach(selector => {
            const element = document.querySelector(`[data-tutorial-target="${selector}"], .${selector}, #${selector}`);
            if (element) {
                element.classList.add('tutorial-highlight');
                console.log(`[Tutorial] Highlighted element: ${selector}`);
            } else {
                console.warn(`[Tutorial] Could not find element to highlight: ${selector}`);
            }
        });
        
        // Remove highlights when tutorial is closed
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('tutorial-close-btn') || e.target.classList.contains('tutorial-overlay')) {
                highlights.forEach(selector => {
                    const element = document.querySelector(`[data-tutorial-target="${selector}"], .${selector}, #${selector}`);
                    if (element) {
                        element.classList.remove('tutorial-highlight');
                    }
                });
            }
        });
    }

    // Method to prevent turn from ending (for abilities like Ayane's Teleport Blade)
    preventTurnEnd(character = null) {
        console.log("[DEBUG PREVENTTURNEND] Called preventTurnEnd() method");
        
        // Use provided character or try to find the selected character
        const selectedChar = character || this.gameState?.selectedCharacter || this.selectedCharacter;
        console.log("[DEBUG PREVENTTURNEND] Selected character:", selectedChar ? selectedChar.name : "none");
        
        // Set the flag directly
        this.preventTurnEndFlag = true;
        
        // Remove from acted characters if they were just added
        if (selectedChar) {
            const index = this.actedCharacters.indexOf(selectedChar.id);
            if (index > -1) {
                console.log("[DEBUG PREVENTTURNEND] Removing character from actedCharacters");
                this.actedCharacters.splice(index, 1);
            }
            
            // Also try instance ID
            const instanceIndex = this.actedCharacters.indexOf(selectedChar.instanceId);
            if (instanceIndex > -1) {
                console.log("[DEBUG PREVENTTURNEND] Removing character from actedCharacters (instance ID)");
                this.actedCharacters.splice(instanceIndex, 1);
            }
            
            // Update the end turn button
            this.uiManager.updateEndTurnButton();
            
            // If this is Ayane's Teleport Blade, reset its cooldown directly here
            if (selectedChar.id === 'ayane' && this.gameState?.selectedAbility && this.gameState.selectedAbility.id === 'ayane_q') {
                console.log("[DEBUG PREVENTTURNEND] Resetting cooldown for Ayane's Q ability");
                this.gameState.selectedAbility.currentCooldown = 0;
                
                // Update UI
                this.uiManager.updateCharacterUI(selectedChar);
                
                // Add message to battle log
                this.addLogEntry(`${selectedChar.name}'s Teleport Blade is reset!`, 'combo');
            }
            
            // Mark character as active again
            this.uiManager.markCharacterAsActive(selectedChar);
            
            // Clear selections to allow reselection
            if (this.gameState) {
                this.gameState.selectedCharacter = null;
                this.gameState.selectedAbility = null;
                this.gameState.selectedTarget = null;
            }
            
            // Clear UI selections
            this.uiManager.clearSelection();
            this.uiManager.resetActedCharacters();
            
            console.log("[DEBUG PREVENTTURNEND] Turn end prevention applied successfully");
        } else {
            console.log("[DEBUG PREVENTTURNEND] No selected character found");
        }
    }
    
    // Also add a method to reset the flag at the end of the ability
    setPreventTurnEnd(value) {
        this.preventTurnEndFlag = value;
    }

    // Initialize the game manager
    async initialize() {
        try {
            // Load character registry first
            await this.loadCharacterRegistry();
            console.log('[GameManager] Character registry loaded');
            
            // Initialize character XP manager
            this.characterXPManager = new CharacterXPManager();
            await this.characterXPManager.initialize();
            console.log('[GameManager] CharacterXPManager initialized');
            
            // --- Initialize Statistics Manager ---
            if (typeof StatisticsManager !== 'undefined') {
                window.statisticsManager = new StatisticsManager();
                console.log('[GameManager] Statistics manager initialized');
            } else {
                console.warn('[GameManager] StatisticsManager not found');
            }
            
            // Create and initialize stage manager
            this.stageManager = stageManager;
            await this.stageManager.initialize();
            
            // Initialize skin manager if available
            if (window.SkinManager) {
                try {
                    await window.SkinManager.initialize();
                    console.log("[GameManager] Skin manager initialized successfully");
                } catch (error) {
                    console.warn("[GameManager] Error initializing skin manager:", error);
                }
            }
            
            // Create UI manager - REMOVE THE DUPLICATE INITIALIZATION BELOW
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

            // Add event listener to regenerate ability descriptions
            document.addEventListener('abilityModified', (event) => {
                if (event.detail && event.detail.character) {
                    console.log(`[GameManager] Ability modification detected, updating character UI`);
                    this.uiManager.updateCharacterUI(event.detail.character);
                }
            });

            // REMOVE THIS DUPLICATE INITIALIZATION
            // this.uiManager = new UIManager(this);
            // await this.uiManager.initialize();
            
            // Now fully initialize the UI with event handlers
            await this.uiManager.initialize(true);
            
            // Initialize the controller manager after the UI manager
            this.controllerManager = new ControllerManager(this);
            this.controllerManager.initialize();
            
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
        
        // Initialize tutorial if this is a tutorial stage
        this.initializeTutorial(stage);
        
        // Load stage background and music
        this.loadStageBackground(stage);
        this.playStageMusic(stage);
        
        // --- STATISTICS TRACKING: Initialize statistics for the stage ---
        if (window.statisticsManager) {
            window.statisticsManager.reset();
            // Initialize all characters in the statistics manager
            [...gameState.playerCharacters, ...gameState.aiCharacters].forEach(character => {
                window.statisticsManager.initializeCharacter(character);
            });
            window.statisticsManager.setCurrentTurn(gameState.turn || 1);
            console.log("[GameManager] Statistics tracking initialized for stage");
        }
        // --- END STATISTICS TRACKING ---

        // Update UI
        this.uiManager.renderCharacters(gameState.playerCharacters, gameState.aiCharacters);
        this.uiManager.updateTurnCounter(gameState.turn);
        this.uiManager.updatePhase(gameState.phase);
        this.uiManager.clearBattleLog();
                    // Test the battle log
            this.testBattleLog();
            
            this.uiManager.addLogEntry(`Battle started in ${stage.name}!`, 'system');
            this.uiManager.addLogEntry(`Player's turn`, 'player-turn');
        
        // --- ENHANCED: Comprehensive UI update after complete character loading ---
        console.log('[GameManager] Starting comprehensive UI update after complete character loading...');
        setTimeout(() => {
            try {
                // Update UI for all player characters with full ability refreshing
                gameState.playerCharacters.forEach(character => {
                    if (character) {
                        console.log(`[GameManager] Updating UI for player character: ${character.name}`);
                        
                        // Update character UI
                        if (this.uiManager && typeof this.uiManager.updateCharacterUI === 'function') {
                            this.uiManager.updateCharacterUI(character);
                        }
                        
                        // Update character abilities and descriptions immediately
                        this.updateCharacterAbilities(character);
                    }
                });
                
                // Update UI for all AI characters with full ability refreshing
                gameState.aiCharacters.forEach(character => {
                    if (character) {
                        console.log(`[GameManager] Updating UI for AI character: ${character.name}`);
                        
                        // Update character UI
                        if (this.uiManager && typeof this.uiManager.updateCharacterUI === 'function') {
                            this.uiManager.updateCharacterUI(character);
                        }
                        
                        // Update character abilities and descriptions immediately
                        this.updateCharacterAbilities(character);
                    }
                });
                
                console.log('[GameManager] ✓ All character UIs updated after complete loading');
            } catch (error) {
                console.error('[GameManager] Error during comprehensive UI update:', error);
            }
        }, 150); // Slightly longer delay to ensure all character loading is complete
        // --- END NEW ---
        
        // Initialize volume slider
        this.initializeVolumeControl();
        
        
        // Now that game state is loaded, set up event handlers
        this.uiManager.setupEventHandlers();
        
        // Start the game
        this.isGameRunning = true;
        
        // Update UI with stage modifiers
        this.uiManager.createStageModifiersIndicator();
        
        // Initialize stage modifier VFX
        if (window.stageModifiersRegistry) {
            window.stageModifiersRegistry.initializeVFX(this.stageManager);
            // Process stage start modifiers (like Small Space)
            console.log('[GameManager] Processing stage start modifiers...');
            window.stageModifiersRegistry.processModifiers(this, this.stageManager, 'stageStart');
        }

        // Display stage modification messages (HP/damage/speed multipliers)
        if (this.stageManager && typeof this.stageManager.displayStageModificationMessages === 'function') {
            this.stageManager.displayStageModificationMessages();
        }
        
        // --- NEW: Trigger Talents Panel Update ---
        if (window.talentsPanelManager && typeof window.talentsPanelManager.loadTalentsForCurrentGame === 'function') {
            console.log("[GameManager] Triggering Talents Panel update after stage load...");
            window.talentsPanelManager.loadTalentsForCurrentGame().catch(err => {
                console.error("[GameManager] Error triggering talents panel update:", err);
            });
        }
        // --- END NEW ---

        // NEW: Emit stageLoaded and gameStateReady events to trigger character post-load hooks
        // This will enable talents like Farmer Shoma's Nurturing Aura
        setTimeout(() => {
            // First emit a gameStateReady event for more explicit hook
            const gameStateReadyEvent = new CustomEvent('gameStateReady', {
                detail: { 
                    gameState: this.gameState,
                    playerCharacters: this.gameState.playerCharacters,
                    aiCharacters: this.gameState.aiCharacters
                },
                bubbles: true
            });
            document.dispatchEvent(gameStateReadyEvent);
            console.log('[GameManager] Emitted gameStateReady event');
            
            // Then emit standard stageLoaded event
            const stageLoadedEvent = new CustomEvent('stageLoaded', {
                detail: { 
                    stage: stage,
                    gameState: this.gameState 
                },
                bubbles: true
            });
            document.dispatchEvent(stageLoadedEvent);
            console.log('[GameManager] Emitted stageLoaded event');

            // --- >>> THIS IS WHERE 'GameStart' SHOULD BE DISPATCHED <<< ---
            const gameStartEvent = new CustomEvent('GameStart', {
                detail: {
                    stage: stage,
                    gameState: this.gameState
                }
            });
            document.dispatchEvent(gameStartEvent);
            console.log("[GameManager] Dispatched GameStart event.");
            
            // Initialize the controller manager AFTER game state is ready and UI is set
            if (this.controllerManager) {
                // Just refresh current cursors if needed
                if (this.controllerManager.selectedElement === null) {
                    this.controllerManager.selectInitialElement();
                }
                console.log('[GameManager] Controller Manager already initialized, refreshing selection.');
            } else {
                console.warn('[GameManager] Controller Manager not initialized in initialize(), creating now as fallback.');
                this.controllerManager = new ControllerManager(this);
                this.controllerManager.initialize();
            }

            // Update ability descriptions and images after everything is loaded
            this.updateAllAbilityDescriptionsAndImages();
            
        }, 0); // Use setTimeout to ensure all initial rendering/setup is complete
    }

    /**
     * Updates ability descriptions and images for all characters after everything is loaded
     */
    updateAllAbilityDescriptionsAndImages() {
        console.log('[GameManager] Updating ability descriptions and images for all characters...');
        
        try {
            // Update player characters
            if (this.gameState && this.gameState.playerCharacters) {
                this.gameState.playerCharacters.forEach(character => {
                    this.updateCharacterAbilities(character);
                });
            }
            
            // Update AI characters
            if (this.gameState && this.gameState.aiCharacters) {
                this.gameState.aiCharacters.forEach(character => {
                    this.updateCharacterAbilities(character);
                });
            }
            
            console.log('[GameManager] ✓ Ability descriptions and images updated for all characters');
        } catch (error) {
            console.error('[GameManager] Error updating ability descriptions and images:', error);
        }
    }

    /**
     * Updates abilities for a specific character
     */
    updateCharacterAbilities(character) {
        if (!character || !character.abilities) {
            console.warn('[GameManager] Character or abilities not found:', character?.name || 'unknown');
            return;
        }

        // Prevent infinite loops by checking if we're already updating this character
        if (character._updatingAbilities) {
            console.log(`[GameManager] Already updating abilities for ${character.name}, skipping to prevent infinite loop`);
            return;
        }
        
        character._updatingAbilities = true;

        console.log(`[GameManager] Updating abilities for ${character.name}...`);
        
        // Handle Siegfried-specific talent ability updates
        if (character.id === 'schoolboy_siegfried') {
            // Call Siegfried's specific ability description updater
            if (typeof updateSiegfriedAbilityDescriptions === 'function') {
                updateSiegfriedAbilityDescriptions(character);
                console.log(`[GameManager] ✓ Updated Siegfried-specific ability descriptions`);
            }
            
            // Update UI to reflect Enhanced Lion Protection talent
            if (character.hasTalent && character.hasTalent('enhanced_lion_protection')) {
                const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
                if (characterElement) {
                    characterElement.classList.add('has-enhanced-lion-protection');
                    
                    // Find Lion Protection ability element and add cooldown indicator
                    const lionProtectionAbility = characterElement.querySelector('.ability[data-ability-id="schoolboy_siegfried_w"]');
                    if (lionProtectionAbility) {
                        lionProtectionAbility.classList.add('enhanced-cooldown');
                        console.log(`[GameManager] ✓ Applied Enhanced Lion Protection visual indicators`);
                    }
                }
            }
        }
        
        character.abilities.forEach((ability, index) => {
            try {
                // Generate or regenerate ability description to ensure it's current
                if (typeof ability.generateDescription === 'function') {
                    try {
                        ability.generateDescription();
                        console.log(`[GameManager] ✓ Generated description for ${ability.name}`);
                    } catch (error) {
                        console.error(`[GameManager] Error generating description for ${ability.name}:`, error);
                        // Fallback: ensure ability has some description
                        if (!ability.description) {
                            ability.description = ability.baseDescription || `[${ability.name}]`;
                        }
                    }
                } else if (!ability.description && ability.baseDescription) {
                    // Fallback: use base description if no generate function
                    ability.description = ability.baseDescription;
                }
                
                // Update ability description if needed
                if (typeof ability.updateDescription === 'function') {
                    try {
                        ability.updateDescription();
                        console.log(`[GameManager] ✓ Updated description for ${ability.name}`);
                    } catch (error) {
                        console.error(`[GameManager] Error updating description for ${ability.name}:`, error);
                    }
                }
                
                // Update ability icon/image if needed
                if (typeof ability.updateIcon === 'function') {
                    try {
                        ability.updateIcon();
                        console.log(`[GameManager] ✓ Updated icon for ${ability.name}`);
                    } catch (error) {
                        console.error(`[GameManager] Error updating icon for ${ability.name}:`, error);
                    }
                }
                
                // Refresh ability tooltip data if needed
                if (typeof ability.refreshTooltip === 'function') {
                    try {
                        ability.refreshTooltip();
                        console.log(`[GameManager] ✓ Refreshed tooltip for ${ability.name}`);
                    } catch (error) {
                        console.error(`[GameManager] Error refreshing tooltip for ${ability.name}:`, error);
                    }
                }
                
                // Log ability cooldown info for debugging
                if (ability.cooldown !== undefined && ability.currentCooldown !== undefined) {
                    console.log(`Ability ${ability.name} has cooldown: ${ability.currentCooldown}/${ability.cooldown}`);
                }
                
            } catch (error) {
                console.error(`[GameManager] Error processing ability ${ability.name || index}:`, error);
            }
        });

        // Update the character's UI to reflect any changes
        if (this.uiManager && typeof this.uiManager.updateCharacterUI === 'function') {
            this.uiManager.updateCharacterUI(character);
        }
        
        // Clear the flag after a short delay
        setTimeout(() => {
            character._updatingAbilities = false;
        }, 100);
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

        // Load the determined stage, passing the fetched team state and story context
        const storyContext = storyId && stageIndexParam !== null ? 
            { storyId, stageIndex: parseInt(stageIndexParam) } : null;
        await this.stageManager.loadStage(stageToLoadId, teamState, storyContext);

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
        
        // Dispatch event for tutorial progression
        const event = new CustomEvent('characterSelected', {
            detail: { character: character }
        });
        document.dispatchEvent(event);
        
        // Update quest display for selected character
        if (window.questUIManager && window.questUIManager.initialized) {
            window.questUIManager.updateForCharacter(character);
        }
        
        // Remove battlelog entry for character selection
        
        return true;
    }

    // Handle player selecting an ability
    selectAbility(character, abilityIndex) {
        console.log(`[DEBUG] selectAbility called for ${character.name}, ability index ${abilityIndex}`);
        
        // Make sure the character is selected
        if (this.gameState.selectedCharacter !== character || !this.isGameRunning) {
            console.log(`[DEBUG] selectAbility rejected - wrong character or game not running`);
            return false;
        }
        
        // --- NEW: Check if character is dead ---
        if (character.isDead()) {
            // This check might be redundant if selectCharacter already prevents selection
            // but it adds an extra layer of safety.
            console.log(`[DEBUG] selectAbility rejected - character is dead`);
            return false;
        }
        // --- END NEW ---
        
        const ability = character.abilities[abilityIndex];
        if (!ability) {
            console.log(`[DEBUG] selectAbility rejected - ability not found at index ${abilityIndex}`);
            return false;
        }
        
        console.log(`[DEBUG] selectAbility processing ability: ${ability.name}, targetType: ${ability.targetType}, requiresTarget: ${ability.requiresTarget}`);
        
        // Check if ability is on cooldown
        if (ability.currentCooldown > 0) {
            console.log(`[DEBUG] selectAbility rejected - ability on cooldown`);
            this.uiManager.addLogEntry(`${ability.name} is on cooldown for ${ability.currentCooldown} more turns.`);
            return false;
        }
        
        this.gameState.selectedAbility = ability;
        console.log(`[DEBUG] Selected ability: ${ability.name} (${ability.id})`);
        
        // Update UI
        this.uiManager.highlightSelectedAbility(abilityIndex);
        
        // Show valid targets based on ability type
        console.log(`[DEBUG] Calling showValidTargets with targetType: ${ability.targetType}`);
        this.uiManager.showValidTargets(ability.targetType);
        
        // Add log entry to guide the player to select their target
        let targetingMessage = "";
        switch(ability.targetType) {
            case 'self':
                targetingMessage = `${ability.name} selected. Click on yourself to cast this ability.`;
                break;
            case 'ally':
                targetingMessage = `${ability.name} selected. Click on an ally to target them.`;
                break;
            case 'ally_or_self':
                targetingMessage = `${ability.name} selected. Click on an ally or yourself to target them.`;
                break;
            case 'enemy':
                targetingMessage = `${ability.name} selected. Click on an enemy to target them.`;
                break;
            case 'any':
                targetingMessage = `${ability.name} selected. Click on any character to target them.`;
                break;
            case 'all_enemies':
            case 'all_allies':
                targetingMessage = `${ability.name} selected. Click on any valid target to cast this area effect.`;
                break;
            default:
                targetingMessage = `${ability.name} selected. Click on a valid target to cast this ability.`;
        }
        this.uiManager.addLogEntry(targetingMessage, 'system');
        console.log(`[DEBUG] Added targeting message: ${targetingMessage}`);
        
        // Dispatch event for tutorial progression
        const event = new CustomEvent('abilitySelected', {
            detail: { character: character, ability: ability, abilityIndex: abilityIndex }
        });
        document.dispatchEvent(event);
        console.log(`[DEBUG] Dispatched abilitySelected event`);
        
        // IMPORTANT: Always wait for user to click on target, even for self-targeted abilities
        // This ensures consistent targeting behavior for all abilities
        console.log(`[DEBUG] selectAbility completed successfully, waiting for user to select target`);
        
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
        console.log(`[DEBUG] targetCharacter called with target: ${target ? target.name : 'null'}`);
        
        // --- NEW: Check if target is dead ---
        if (target.isDead()) {
            console.log(`[DEBUG] targetCharacter rejected - target is dead`);
            this.uiManager.addLogEntry("Cannot target a defeated character.");
            return false;
        }
        // --- END NEW ---

        // Make sure we have a character and ability selected
        if (!this.gameState.selectedCharacter || !this.gameState.selectedAbility || !this.isGameRunning) {
            console.log(`[DEBUG] targetCharacter rejected - missing selectedCharacter, selectedAbility, or game not running`);
            // Remove log message about selecting character and ability first
            return false;
        }
        
        console.log(`[DEBUG] targetCharacter processing: caster=${this.gameState.selectedCharacter.name}, ability=${this.gameState.selectedAbility.name}, target=${target.name}`);
        console.log(`[DEBUG] targetCharacter ability targetType: ${this.gameState.selectedAbility.targetType}`);
        console.log(`[DEBUG] targetCharacter ability requiresTarget: ${this.gameState.selectedAbility.requiresTarget}`);
        
        const caster = this.gameState.selectedCharacter;
        const ability = this.gameState.selectedAbility;
        
        // Get target type (dynamic if available, otherwise static)
        let targetType = ability.targetType;
        if (typeof ability.getTargetType === 'function') {
            targetType = ability.getTargetType();
            console.log(`[GameManager] Using dynamic targetType: ${targetType} for ability ${ability.id}`);
        }
        
        // Validate targeting based on ability type
        if (!this.validateTarget(targetType, target)) {
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
        
        // --- NEW: Check if the ability effect returned a result with 'doesNotEndTurn' ---
        // Look for a result object with doesNotEndTurn property from the ability effect
        if (success && window.abilityLastResult && window.abilityLastResult.doesNotEndTurn) {
            console.log(`[GameManager] Ability returned doesNotEndTurn=true, preventing turn end`);
            this.preventTurnEndFlag = true;
        }
        // --- END NEW ---
        
        // Check for temporary doesNotEndTurn flag set by talents (like Healing Efficiency)
        const usedAbility = caster.abilities[abilityIndex];
        if (success && usedAbility && usedAbility._tempDoesNotEndTurn) {
            console.log(`[GameManager] Ability has _tempDoesNotEndTurn=true from talent, preventing turn end`);
            this.preventTurnEndFlag = true;
            // Clear the temporary flag after use
            delete usedAbility._tempDoesNotEndTurn;
        }
        
        // --- NEW: Check if the ability itself is flagged to not end turn (permanent property) ---
        if (success && usedAbility && usedAbility.doesNotEndTurn === true) {
            console.log(`[GameManager] Ability property doesNotEndTurn=true detected, preventing turn end`);
            this.preventTurnEndFlag = true;
        }
        
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
            
            // Dispatch event for tutorial progression
            const targetEvent = new CustomEvent('targetSelected', {
                detail: { caster: caster, target: target, ability: ability }
            });
            document.dispatchEvent(targetEvent);
            
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
        // Allow self-targeting even if untargetable for 'self' abilities
        if (targetIsUntargetable && targetType !== 'self') {
            console.log(`[validateTarget] Target ${target.name} is untargetable due to an effect.`);
            this.addLogEntry(`${target.name} cannot be targeted right now!`, 'error');
            return false;
        }
        
        // --- NEW: Check for enemy forced targeting (like Shadow Wings) ---
        const targetIsUntargetableByEnemyForcing = target.isUntargetableByEnemyForcing && target.isUntargetableByEnemyForcing();
        if (targetIsUntargetableByEnemyForcing) {
            console.log(`[validateTarget] Target ${target.name} is untargetable due to enemy forced targeting.`);
            this.addLogEntry(`${target.name} cannot be targeted right now!`, 'error');
            return false;
        }
        // --- END NEW ---

        // --- NEW: Check for Heart Debuff forced targeting ---
        // Note: This check should happen AFTER targetType validation for proper self-targeting
        if (selectedChar && selectedChar.forcedTargeting && selectedChar.forcedTargeting.type === 'heart_debuff') {
            const forcedCasterId = selectedChar.forcedTargeting.casterId;
            const forcedCasterName = selectedChar.forcedTargeting.casterName;
            
            // Allow self-targeting for 'self' type abilities
            if (targetType === 'self' || target === selectedChar) {
                console.log(`[validateTarget] ${selectedChar.name} with Heart Debuff can target self (targetType: ${targetType}).`);
                // Don't return here, let normal validation continue
            } else {
                // For non-self abilities, check Heart Debuff restrictions
                const allCharacters = [
                    ...this.gameState.playerCharacters,
                    ...this.gameState.aiCharacters
                ];
                const heartCaster = allCharacters.find(char => 
                    (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                );
                
                if (heartCaster) {
                    // Heart Debuff allows targeting:
                    // 1. The heart caster themselves
                    // 2. The debuffed character's own allies (same team as debuffed character)
                    // 3. Self (handled above)
                    
                    const targetTeam = target.isAI ? 'ai' : 'player';
                    const debuffedCharacterTeam = selectedChar.isAI ? 'ai' : 'player';
                    
                    const isTargetingHeartCaster = (target === heartCaster);
                    const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                    const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                    
                    if (!isValidHeartDebuffTarget) {
                        console.log(`[validateTarget] ${selectedChar.name} has Heart Debuff and can only target ${forcedCasterName} or their own allies!`);
                        this.addLogEntry(`${selectedChar.name} is enchanted and can only target ${forcedCasterName} or their own allies!`, 'heart-debuff');
                        return false;
                    }
                }
            }
        }
        // --- END NEW ---

        switch (targetType) {
            case 'enemy':
            case 'single_enemy': // Support for single enemy targeting
                return target.isAI !== selectedChar.isAI;
            case 'ally':
                // Modified to allow self-targeting for 'ally' targeting type
                // This ensures abilities like Farmer Alice's Carrot Power Up can target herself
                return target.isAI === selectedChar.isAI;
            case 'self':
                return target === selectedChar;
            case 'ally_or_self':
                return target.isAI === selectedChar.isAI; // Both allies and self
            case 'ally_except_self':
                // New target type: Can target allies but not self
                // Used for Love Bullet with Healing Shot talent
                return target.isAI === selectedChar.isAI && target !== selectedChar;
            case 'enemy_or_ally_except_self':
                // New target type: Can target both enemies and allies but not self
                // Used for Schoolgirl Elphelt's Love Bullet with Healing Shot talent
                return target !== selectedChar;
            case 'ally_or_enemy':
                // New target type: Can target both allies and enemies
                // Used for Schoolgirl Elphelt's Love Bullet with Healing Shot talent
                return true; // Can target anyone
            case 'any':
                return true;
            case 'any_except_self':
                // New target type: Can target both allies and enemies, but not self
                // Used for Farmer Alice's Bunny Bounce ability
                return target !== selectedChar;
            case 'all_enemies':
            case 'aoe_enemy': // Support for AOE enemy targeting
            case 'two_random_enemies': // Support for two random enemies
            case 'three_random_enemies': // Support for three random enemies
            case 'random_enemy': // Support for random enemy
                // For AOE abilities that target all enemies
                return target.isAI !== selectedChar.isAI;
            case 'all_allies':
            case 'all_allies_except_self': // Support for all allies except self
                // For AOE abilities that target all allies
                return target.isAI === selectedChar.isAI;
            case 'all':
                // For AOE abilities that target everyone
                return true;
            default:
                console.warn(`[validateTarget] Unknown target type: ${targetType}`);
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
                // --- REMOVED onTurnStart passive trigger here ---
                // if (char.passiveHandler && typeof char.passiveHandler.onTurnStart === 'function') {
                //     try {
                //         // Pass the character and current turn number
                //         char.passiveHandler.onTurnStart(char, this.gameState.turn);
                //     } catch (e) {
                //         console.error(`Error in onTurnStart for ${char.name}'s passive:`, e);
                //     }
                // }
                char.processEffects(true, true); // Reduce duration and regenerate resources
                
                // Apply Blessed Restoration healing for Siegfried
                if (char.id === 'schoolboy_siegfried' && char.passiveHandler && 
                    typeof char.passiveHandler.applyBlessedRestoration === 'function') {
                    try {
                        char.passiveHandler.applyBlessedRestoration(char);
                    } catch (e) {
                        console.error(`Error in Blessed Restoration for ${char.name}:`, e);
                    }
                }
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

        // BULLET RAIN FEATURE: Check for Nina and process Bullet Rain at turn end
        const checkForBulletRain = () => {
            // Find Nina in player characters
            const nina = this.gameState.playerCharacters.find(char => 
                char && char.id === 'farmer_nina' && !char.isDead());
                
            if (nina && nina.appliedTalents && nina.appliedTalents.includes('bullet_rain')) {
                console.log("[GAME MANAGER] Processing Bullet Rain for Nina at turn end");
                
                // Execute Bullet Rain effect
                try {
                    // Get enemies with Target Lock
                    const enemies = this.gameState.aiCharacters.filter(enemy => 
                        enemy && !enemy.isDead() && enemy.debuffs && 
                        enemy.debuffs.some(d => d.id === 'farmer_nina_e_target_lock'));
                    
                    if (enemies.length > 0) {
                        // Calculate base damage
                        const physDamage = nina.stats.physicalDamage || 100;
                        const damagePerTarget = Math.floor(physDamage * 0.25);
                        
                        // Create source visual effect on Nina first
                        this.showBulletRainSourceVFX(nina);
                        
                        // Create main activation visual effect and log entry
                        this.addLogEntry(`Nina's Bullet Rain activates against ${enemies.length} target${enemies.length > 1 ? 's' : ''}!`, 'skill');
                        
                        // Delay each target effect slightly for better visual
                        setTimeout(() => {
                            let i = 0;
                            const processNextTarget = () => {
                                if (i < enemies.length) {
                                    const enemy = enemies[i];
                                    i++;
                                    
                                    // Apply damage with slight delay between targets
                                    const isCrit = Math.random() < (nina.stats.critChance || 0);
                                    const critMulti = nina.stats.critDamage || 1.5;
                                    const finalDamage = isCrit ? Math.floor(damagePerTarget * critMulti) : damagePerTarget;
                                    
                                    const result = enemy.applyDamage(finalDamage, 'physical', nina);
                                    
                                    this.addLogEntry(`${enemy.name} takes ${result.damage} damage from Bullet Rain${isCrit ? " (Critical Hit!)" : ""}`, 'damage');
                                    
                                    // Show enhanced bullet rain VFX
                                    this.showBulletRainTargetVFX(nina, enemy, isCrit);
                                    
                                    // Process next target after a short delay
                                    setTimeout(processNextTarget, 200);
                                }
                            };
                            
                            // Start processing targets
                            processNextTarget();
                        }, 300); // Initial delay for source effect
                    } else {
                        console.log("[GAME MANAGER] No enemies with Target Lock found for Bullet Rain");
                    }
                } catch (error) {
                    console.error("[GAME MANAGER] Error processing Bullet Rain:", error);
                }
            }
        };
        
        // Process Bullet Rain before continuing with the AI turn
        checkForBulletRain();

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
        // Get available abilities
        console.log(`[AI Planner Debug] ${aiChar.name} has ${aiChar.abilities?.length || 0} total abilities`);
        
        const availableAbilities = (aiChar.abilities || []).filter(ability => {
            const cooldownOk = ability.currentCooldown <= 0;
            const manaOk = aiChar.stats.currentMana >= ability.manaCost;
            const notDisabled = !ability.isDisabled;
            
            if (!cooldownOk) {
                console.log(`[AI Planner Debug] ${aiChar.name}'s ${ability.name} is on cooldown (${ability.currentCooldown})`);
            }
            if (!manaOk) {
                console.log(`[AI Planner Debug] ${aiChar.name} lacks mana for ${ability.name} (${aiChar.stats.currentMana}/${ability.manaCost})`);
            }
            if (!notDisabled) {
                console.log(`[AI Planner Debug] ${aiChar.name}'s ${ability.name} is disabled`);
            }
            
            return cooldownOk && manaOk && notDisabled;
        });

        if (availableAbilities.length === 0) {
            console.log(`[AI Planner] ${aiChar.name} has no available abilities.`);
            if (aiChar.abilities && aiChar.abilities.length > 0) {
                console.log(`[AI Planner Debug] ${aiChar.name} ability details:`, aiChar.abilities.map(a => ({
                    name: a.name,
                    cooldown: a.currentCooldown,
                    manaCost: a.manaCost,
                    disabled: a.isDisabled
                })));
            } else {
                console.log(`[AI Planner Debug] ${aiChar.name} has no abilities array or empty abilities!`);
            }
            return null; // No action possible
        }

        // SPECIAL AI BEHAVIOR FOR INFERNAL RAIDEN
        console.log(`[AI Planner Debug] Character ID: "${aiChar.id}", Name: "${aiChar.name}"`);
        if (aiChar.id === 'infernal_raiden' || aiChar.name === 'Infernal Raiden') {
            console.log(`[AI Planner] Using special Infernal Raiden AI for ${aiChar.name}`);
            return this.planInfernalRaidenAction(aiChar, availableAbilities);
        }

        // Helper function to filter targetable characters considering enemy forced targeting
        const isTargetableByCharacter = (target, caster) => {
            if (target.isDead()) return false;
            if (target.isUntargetable && target.isUntargetable()) return false;
            
            // Check if this target is untargetable due to enemy forced targeting
            if (target.isUntargetableByEnemyForcing && target.isUntargetableByEnemyForcing()) {
                // The target is untargetable because an enemy is forcing targeting
                // This means we can only target allies/self for support abilities
                return false;
            }
            
            // Check for Heart Debuff forced targeting restrictions on the caster
            if (caster && caster.forcedTargeting && caster.forcedTargeting.type === 'heart_debuff') {
                const forcedCasterId = caster.forcedTargeting.casterId;
                
                // Allow self-targeting always
                if (target === caster) {
                    return true;
                }
                
                // Find the heart caster
                const allCharacters = [
                    ...this.gameState.playerCharacters,
                    ...this.gameState.aiCharacters
                ];
                const heartCaster = allCharacters.find(char => 
                    (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                );
                
                if (heartCaster) {
                    // Heart Debuff allows targeting:
                    // 1. The heart caster themselves (Elphelt)
                    // 2. The debuffed character's own allies (same team as debuffed character)
                    // 3. Self (handled above)
                    
                    const targetTeam = target.isAI ? 'ai' : 'player';
                    const debuffedCharacterTeam = caster.isAI ? 'ai' : 'player';
                    
                    const isTargetingHeartCaster = (target === heartCaster);
                    const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                    const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                    
                    console.log(`[AI Heart Debuff] ${caster.name} with heart debuff checking target ${target.name}. IsHeartCaster: ${isTargetingHeartCaster}, IsOwnAlly: ${isTargetingOwnAlly}, Valid: ${isValidHeartDebuffTarget}`);
                    
                    if (!isValidHeartDebuffTarget) {
                        console.log(`[AI Heart Debuff] Blocking target ${target.name} - not the heart caster or debuffed character's ally`);
                        return false; // Heart Debuff prevents targeting this character
                    }
                }
            }
            
            return true;
        };

        // Smart ability selection: Prioritize healing if allies need it
        const allPlayerChars = this.gameState.playerCharacters.filter(c => isTargetableByCharacter(c, aiChar));
        const allAIChars = this.gameState.aiCharacters.filter(c => isTargetableByCharacter(c, aiChar));
        
        // Check if any allies need healing (below 70% HP)
        const injuredAllies = allAIChars.filter(ally => ally !== aiChar && ally.stats.currentHp < ally.stats.maxHp * 0.7);
        const selfNeedsHealing = aiChar.stats.currentHp < aiChar.stats.maxHp * 0.5; // Self at 50% or below
        
                    // Look for healing abilities that can target allies or self
            const healingAbilities = availableAbilities.filter(ability => 
                ability.targetType === 'ally_or_self' || 
                ability.targetType === 'ally' || 
                (ability.targetType === 'self' && selfNeedsHealing) ||
                ability.targetType === 'all_allies' ||
                (ability.name && ability.name.toLowerCase().includes('heal')) || 
                (ability.description && ability.description.toLowerCase().includes('heal'))
            );
        
        let selectedAbility = null;
        
        // Prioritize healing if someone needs it and we have healing abilities
        if ((injuredAllies.length > 0 || selfNeedsHealing) && healingAbilities.length > 0) {
            // Use healing ability with 80% chance if allies are injured
            if (Math.random() < 0.8) {
                selectedAbility = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
                console.log(`[AI Planner] ${aiChar.name} prioritizing healing ability: ${selectedAbility.name}`);
            }
        }
        
        // If no healing ability selected, pick randomly from all available
        if (!selectedAbility) {
            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            selectedAbility = availableAbilities[randomIndex];
            console.log(`[AI Planner] ${aiChar.name} randomly selected: ${selectedAbility.name}`);
        }

        // Try to plan the action - if it fails for healing, fallback to non-healing
        const result = this.tryPlanAction(aiChar, selectedAbility, allPlayerChars, allAIChars, injuredAllies, selfNeedsHealing);
        if (result && result.error === 'No healing targets needed') {
            // Healing was selected but no targets need it - fallback to non-healing abilities
            console.log(`[AI Planner] ${aiChar.name} fallback: healing not needed, selecting non-healing ability`);
            const nonHealingAbilities = availableAbilities.filter(ability => {
                // Check if it's a healing ability
                const isHealingAbility = (ability.name && ability.name.toLowerCase().includes('heal')) || 
                                       (ability.description && ability.description.toLowerCase().includes('heal')) ||
                                       (ability.type === 'heal');
                
                // Check if it's a buff/support ability
                const isBuffAbility = (ability.name && (ability.name.toLowerCase().includes('buff') || 
                                                       ability.name.toLowerCase().includes('pact') ||
                                                       ability.name.toLowerCase().includes('blessing') ||
                                                       ability.name.toLowerCase().includes('boost') ||
                                                       ability.name.toLowerCase().includes('enhance') ||
                                                       ability.name.toLowerCase().includes('empow'))) ||
                                      (ability.description && (ability.description.toLowerCase().includes('double') ||
                                                              ability.description.toLowerCase().includes('increase') ||
                                                              ability.description.toLowerCase().includes('buff') ||
                                                              ability.description.toLowerCase().includes('empower') ||
                                                              ability.description.toLowerCase().includes('stats')));
                
                // Include non-healing abilities and buff abilities (even if they target allies)
                return !isHealingAbility || isBuffAbility;
            });
            
            if (nonHealingAbilities.length > 0) {
                selectedAbility = nonHealingAbilities[Math.floor(Math.random() * nonHealingAbilities.length)];
                console.log(`[AI Planner] ${aiChar.name} fallback selected: ${selectedAbility.name}`);
                return this.tryPlanAction(aiChar, selectedAbility, allPlayerChars, allAIChars, injuredAllies, selfNeedsHealing);
            }
        }
        
        return result;
    }

    // Helper method to try planning an action with a specific ability
    tryPlanAction(aiChar, selectedAbility, allPlayerChars, allAIChars, injuredAllies, selfNeedsHealing) {
        
        // Helper function to filter targetable characters considering enemy forced targeting
        const isTargetableByCharacter = (target, caster) => {
            if (target.isDead()) return false;
            if (target.isUntargetable && target.isUntargetable()) return false;
            
            // Check if this target is untargetable due to enemy forced targeting
            if (target.isUntargetableByEnemyForcing && target.isUntargetableByEnemyForcing()) {
                // The target is untargetable because an enemy is forcing targeting
                // This means we can only target allies/self for support abilities
                return false;
            }
            
            // Check for Heart Debuff forced targeting restrictions on the caster
            if (caster && caster.forcedTargeting && caster.forcedTargeting.type === 'heart_debuff') {
                const forcedCasterId = caster.forcedTargeting.casterId;
                
                // Allow self-targeting always
                if (target === caster) {
                    return true;
                }
                
                // Find the heart caster
                const allCharacters = [
                    ...this.gameState.playerCharacters,
                    ...this.gameState.aiCharacters
                ];
                const heartCaster = allCharacters.find(char => 
                    (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                );
                
                if (heartCaster) {
                    // Heart Debuff allows targeting:
                    // 1. The heart caster themselves (Elphelt)
                    // 2. The debuffed character's own allies (same team as debuffed character)
                    // 3. Self (handled above)
                    
                    const targetTeam = target.isAI ? 'ai' : 'player';
                    const debuffedCharacterTeam = caster.isAI ? 'ai' : 'player';
                    
                    const isTargetingHeartCaster = (target === heartCaster);
                    const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                    const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                    
                    console.log(`[AI Heart Debuff] ${caster.name} with heart debuff checking target ${target.name}. IsHeartCaster: ${isTargetingHeartCaster}, IsOwnAlly: ${isTargetingOwnAlly}, Valid: ${isValidHeartDebuffTarget}`);
                    
                    if (!isValidHeartDebuffTarget) {
                        console.log(`[AI Heart Debuff] Blocking target ${target.name} - not the heart caster or debuffed character's ally`);
                        return false; // Heart Debuff prevents targeting this character
                    }
                }
            }
            
            return true;
        };

        let possibleTargets = [];

        // Determine possible targets based on ability type
        switch (selectedAbility.targetType) {
            case 'enemy':
                possibleTargets = allPlayerChars;
                break;
            case 'ally':
                possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Exclude self
                break;
            case 'ally_except_self':
                // New target type: Can target allies but not self
                possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Exclude self
                break;
            case 'enemy_or_ally_except_self':
                // New target type: Can target both enemies and allies but not self
                possibleTargets = [
                    ...allPlayerChars, // All enemies
                    ...allAIChars.filter(c => c.id !== aiChar.id) // All allies except self
                ];
                break;
            case 'ally_or_self':
                // Include all AI allies plus self - prioritize injured targets for healing
                const potentialHealTargets = [...allAIChars];
                if (injuredAllies.length > 0 || selfNeedsHealing) {
                    // Filter to only injured targets for smarter healing
                    const injuredTargets = potentialHealTargets.filter(ally => 
                        ally.stats.currentHp < ally.stats.maxHp * 0.8 // Below 80% HP
                    );
                    possibleTargets = injuredTargets.length > 0 ? injuredTargets : potentialHealTargets;
                } else {
                    possibleTargets = potentialHealTargets;
                }
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
            case 'aoe_enemy': // Support for AOE enemy targeting
            case 'two_random_enemies': // Support for two random enemies
            case 'three_random_enemies': // Support for three random enemies
            case 'random_enemy': // Support for random enemy
            case 'all': // Add 'all' case to target enemies
                possibleTargets = allPlayerChars; // Target the group of enemies
                break;
            case 'all_allies':
                possibleTargets = allAIChars; // Target the group
                break;
            case 'all_allies_except_self': // Added this case for Carrot Power-up
                possibleTargets = allAIChars.filter(c => c.id !== aiChar.id); // Target the group, excluding self
                break;
            case 'single_enemy': // Support for single enemy targeting
                possibleTargets = allPlayerChars; // Enemy targets
                break;
            case 'ally_or_enemy':
                // New target type: Can target both allies and enemies
                // Used for Schoolgirl Elphelt's Love Bullet with Healing Shot talent
                possibleTargets = [...allPlayerChars, ...allAIChars];
                break;
            default:
                console.error(` [AI Planner] Unknown target type '${selectedAbility.targetType}'`);
                possibleTargets = []; // No valid target logic
                break;
        }

        // Filter out untargetable characters again, just in case
        possibleTargets = possibleTargets.filter(c => c && isTargetableByCharacter(c, aiChar));

        if (possibleTargets.length === 0) {
             console.log(`[AI Planner Debug] No valid targets found for ${selectedAbility.name} (type: ${selectedAbility.targetType}) after filtering.`);
             console.log(`[AI Planner Debug] All Player Chars (alive, targetable): ${allPlayerChars.map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);
             console.log(`[AI Planner Debug] All AI Chars (alive, targetable, not self): ${allAIChars.filter(c => c.id !== aiChar.id).map(c => c.name + '(' + (c.instanceId || c.id) + ')').join(', ')}`);

            return { ability: selectedAbility, target: null, error: 'No valid targets found' }; // Indicate no valid target
        }

        // Smart target selection for healing vs buff abilities
        let selectedTarget;
        if (selectedAbility.targetType === 'ally_or_self' || selectedAbility.targetType === 'ally') {
            // Check if this is actually a healing ability
            const isHealingAbility = (selectedAbility.name && selectedAbility.name.toLowerCase().includes('heal')) || 
                                   (selectedAbility.description && selectedAbility.description.toLowerCase().includes('heal')) ||
                                   (selectedAbility.type === 'heal');
            
            if (isHealingAbility) {
                // For healing abilities, only target allies who actually need healing (below 95% HP)
                const healableTargets = possibleTargets.filter(target => 
                    target.stats.currentHp < target.stats.maxHp * 0.95
                );
                
                if (healableTargets.length > 0) {
                    // Prioritize the most injured ally among those who need healing
                    const sortedByHealth = healableTargets.sort((a, b) => {
                        const aHealthPercent = a.stats.currentHp / a.stats.maxHp;
                        const bHealthPercent = b.stats.currentHp / b.stats.maxHp;
                        return aHealthPercent - bHealthPercent; // Lowest health first
                    });
                    selectedTarget = sortedByHealth[0];
                    console.log(`[AI Planner] Smart healing target selected: ${selectedTarget.name} (${Math.round((selectedTarget.stats.currentHp / selectedTarget.stats.maxHp) * 100)}% HP)`);
                } else {
                    // No ally needs healing, don't waste the heal
                    console.log(`[AI Planner] No allies need healing (all above 95% HP), skipping heal ability`);
                    return { ability: selectedAbility, target: null, error: 'No healing targets needed' };
                }
            } else {
                // For buff abilities, select any ally (no HP requirement)
                selectedTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                console.log(`[AI Planner] Random ally target selected for buff ${selectedAbility.name}: ${selectedTarget.name}`);
            }
        } else {
            // For non-ally abilities, select randomly
            selectedTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            console.log(`[AI Planner Debug] Random target selected for ${selectedAbility.name}: ${selectedTarget.name} (isAI: ${selectedTarget.isAI})`);
        }

        // Handle AoE abilities - target the whole group
        if (selectedAbility.targetType === 'all_enemies' || selectedAbility.targetType === 'aoe_enemy') {
            selectedTarget = allPlayerChars; // Pass the array
        } else if (selectedAbility.targetType === 'all_allies') {
            selectedTarget = allAIChars; // Pass the array
        } else if (selectedAbility.targetType === 'all') { // Handle the new 'all' case
            selectedTarget = allPlayerChars; // Pass the array of player characters
        } else if (selectedAbility.targetType === 'all_allies_except_self') { // Handle Carrot Power-up case
            selectedTarget = allAIChars.filter(c => c.id !== aiChar.id); // Pass the filtered array
        } else if (selectedAbility.targetType === 'two_random_enemies') {
            // For two random enemies, pass the array and let the ability handler select random targets
            selectedTarget = allPlayerChars; // Pass the array
        } else if (selectedAbility.targetType === 'three_random_enemies') {
            // For three random enemies, pass the array and let the ability handler select random targets
            selectedTarget = allPlayerChars; // Pass the array
        } else if (selectedAbility.targetType === 'random_enemy') {
            // For random enemy, pass the array and let the ability handler select random target
            selectedTarget = allPlayerChars; // Pass the array
        }
        // For single target types (enemy, single_enemy, ally, ally_or_self, self, any, any_except_self), selectedTarget remains the chosen single character.

        if (selectedTarget && (!Array.isArray(selectedTarget) || selectedTarget.length > 0)) {
             const targetName = Array.isArray(selectedTarget) ? `${selectedTarget.length} targets` : selectedTarget.name;
             console.log(`[AI Planner] Planned action: ${selectedAbility.name} on ${targetName}`);
            return { ability: selectedAbility, target: selectedTarget };
        } else {
            console.log(`[AI Planner] Skipping action for ${selectedAbility.name}: No valid targets found.`);
            return null; // Skip action if no target found
        }
    }

    // Special AI behavior for Infernal Raiden
    planInfernalRaidenAction(aiChar, availableAbilities) {
        const allPlayerChars = this.gameState.playerCharacters.filter(c => !c.isDead() && !c.isUntargetable());
        
        // Find Q ability (Blazing Lightning Ball)
        const blazingLightningBall = availableAbilities.find(ability => 
            ability.id === 'blazing_lightning_ball' || ability.name.includes('Blazing Lightning Ball')
        );
        
        // Check if Raiden has already used Q this turn by checking cooldown
        // If Q is on cooldown and it was 1 turn cooldown originally, he must have used it this turn
        const hasAlreadyUsedQ = blazingLightningBall && blazingLightningBall.currentCooldown > 0;
        
        let selectedAbility = null;
        
        // Priority 1: Use Blazing Lightning Ball if available and hasn't been used this turn
        if (blazingLightningBall && !hasAlreadyUsedQ) {
            selectedAbility = blazingLightningBall;
            console.log(`[Infernal Raiden AI] Using Q ability first: ${selectedAbility.name}`);
        } 
        // Priority 2: Use any other available ability
        else {
            const otherAbilities = availableAbilities.filter(ability => 
                ability.id !== 'blazing_lightning_ball' && !ability.name.includes('Blazing Lightning Ball')
            );
            
            if (otherAbilities.length > 0) {
                // Smart selection for other abilities
                // Prioritize high damage abilities when enemies are low HP
                const lowHpEnemies = allPlayerChars.filter(enemy => 
                    enemy.stats.currentHp < enemy.stats.maxHp * 0.3
                );
                
                if (lowHpEnemies.length > 0) {
                    // Look for high damage abilities to finish off low HP enemies
                    const damageAbilities = otherAbilities.filter(ability => 
                        ability.name.includes('Thunder') || 
                        ability.name.includes('Thunderstruck') ||
                        ability.description.includes('damage')
                    );
                    
                    if (damageAbilities.length > 0) {
                        selectedAbility = damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
                        console.log(`[Infernal Raiden AI] Using damage ability against low HP enemies: ${selectedAbility.name}`);
                    }
                }
                
                // If no specific strategy, pick randomly from other abilities
                if (!selectedAbility) {
                    selectedAbility = otherAbilities[Math.floor(Math.random() * otherAbilities.length)];
                    console.log(`[Infernal Raiden AI] Using random other ability: ${selectedAbility.name}`);
                }
            }
        }
        
        if (!selectedAbility) {
            console.log(`[Infernal Raiden AI] No suitable ability found, falling back to normal AI`);
            return null; // Fall back to normal AI behavior
        }
        
        // Target selection logic
        let possibleTargets = [];
        
        switch (selectedAbility.targetType) {
            case 'enemy':
                possibleTargets = allPlayerChars;
                break;
            case 'self':
                possibleTargets = [aiChar];
                break;
            case 'all_enemies':
            case 'all':
                possibleTargets = allPlayerChars;
                break;
            default:
                possibleTargets = allPlayerChars; // Default to enemies
                break;
        }
        
        if (possibleTargets.length === 0) {
            console.log(`[Infernal Raiden AI] No valid targets for ${selectedAbility.name}`);
            return null;
        }
        
        let selectedTarget;
        
        // Smart target selection for Raiden
        if (selectedAbility.targetType === 'all_enemies' || selectedAbility.targetType === 'all') {
            selectedTarget = allPlayerChars; // AoE abilities target all
        } else {
            // For single target abilities, prioritize low HP enemies
            const sortedByHealth = possibleTargets.sort((a, b) => a.stats.currentHp - b.stats.currentHp);
            selectedTarget = sortedByHealth[0]; // Target lowest HP enemy
            console.log(`[Infernal Raiden AI] Targeting lowest HP enemy: ${selectedTarget.name} (${selectedTarget.stats.currentHp}/${selectedTarget.stats.maxHp} HP)`);
        }
        
        const targetName = Array.isArray(selectedTarget) ? `${selectedTarget.length} targets` : selectedTarget.name;
        console.log(`[Infernal Raiden AI] Planned action: ${selectedAbility.name} on ${targetName}`);
        
        return { ability: selectedAbility, target: selectedTarget };
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
           } else if (targetType === 'enemy' || targetType === 'ally' || targetType === 'ally_or_enemy') {
               // Planned target was a single object
               const singleTarget = targetInfo;
               if (singleTarget && !singleTarget.isDead()) {
                   finalTargetInfo = singleTarget;
                   
                   // --- NEW: Check for ability redirection (Furry Guardian talent) ---
                   if (targetType === 'enemy' && !Array.isArray(finalTargetInfo)) {
                       // Only check for redirection on enemy abilities targeting a single player character
                       const redirected = this.checkForAbilityRedirection(caster, ability, finalTargetInfo);
                       if (redirected) {
                           finalTargetInfo = redirected;
                       }
                   }
                   // --- END NEW ---
               } else {
                   // Attempt to find a new random target if the original is dead
                   console.log(`[AI Execute] Original target ${singleTarget?.name} invalid. Retargeting for ${ability.name}...`);
                   if (targetType === 'enemy' || targetType === 'ally_or_enemy') {
                       const potentialEnemies = this.gameManager.gameState.playerCharacters.filter(p => !p.isDead());
                       if (potentialEnemies.length > 0) finalTargetInfo = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
                       
                       // --- NEW: Check for ability redirection (Furry Guardian talent) ---
                       if (finalTargetInfo) {
                           const redirected = this.checkForAbilityRedirection(caster, ability, finalTargetInfo);
                           if (redirected) {
                               finalTargetInfo = redirected;
                           }
                       }
                       // --- END NEW ---
                   } else { // targetType === 'ally'
                       const potentialAllies = this.gameManager.gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                       if (potentialAllies.length > 0) finalTargetInfo = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                       else finalTargetInfo = caster; // Fallback to self if no allies
                   }
                   if(finalTargetInfo) console.log(`[AI Execute] Re-targeted to ${finalTargetInfo.name}.`);
               }
           } else if (targetType === 'aoe_enemy' || targetType === 'all_enemies') {
               // Planned target was an array of enemies
               finalTargetInfo = this.gameManager.gameState.playerCharacters.filter(p => !p.isDead());
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
               
               // CHECK FOR ABILITIES THAT DON'T END TURN
               if (ability.doesNotEndTurn === true) {
                   console.log(`[AI Execute] ${ability.name} doesn't end turn, planning second action for ${caster.name}`);
                   
                   // Add a small delay for visual clarity
                   await this.delay(500);
                   
                   // Plan and execute a second action immediately
                   const secondAction = await this.planAIAction(caster);
                   if (secondAction && secondAction.ability) {
                       console.log(`[AI Execute] Executing second action: ${secondAction.ability.name}`);
                       
                       // Create the action object format expected by executeAction
                       const casterIndex = this.gameState.aiCharacters.indexOf(caster);
                       const abilityIndex = caster.abilities.indexOf(secondAction.ability);
                       
                       if (casterIndex !== -1 && abilityIndex !== -1) {
                           const secondActionData = {
                               casterIndex: casterIndex,
                               abilityIndex: abilityIndex,
                               target: secondAction.target
                           };
                           
                           // Recursively execute the second action
                           await this.executeAction(secondActionData);
                       } else {
                           console.warn(`[AI Execute] Could not find caster or ability indices for second action`);
                       }
                   } else {
                       console.log(`[AI Execute] No valid second action found for ${caster.name}`);
                   }
               }
           } else {
               // Log failure if useAbility returned false 
               this.addLogEntry(`${caster.name} failed to use ${ability.name} (possible internal check failure).`, 'error');
           }

           // Check for game over after each action
           if (this.checkGameOver()) {
               // Game over handling (including XP awarding and UI) is now done in checkGameOver()
               console.log(`[GameManager executeAction] Game Over detected and handled by checkGameOver()`);
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
           this.addLogEntry("AI turn ended."); 

           // --- Increment Turn Counter FIRST ---
           this.gameState.turn++;
           console.log(`--- New Turn Started: ${this.gameState.turn} ---`);
           
           // --- STATISTICS TRACKING: Update turn counter and living character counts ---
           if (window.statisticsManager) {
               window.statisticsManager.setCurrentTurn(this.gameState.turn);
               const allCharacters = [...this.gameState.playerCharacters, ...this.gameState.aiCharacters];
               const livingCharacters = allCharacters.filter(char => !char.isDead());
               window.statisticsManager.incrementTurnCounters(livingCharacters);
           }
           // --- END STATISTICS TRACKING ---

           // --- QUEST TRACKING: Update turn progress ---
           if (typeof window.questManager !== 'undefined' && window.questManager.initialized) {
               window.questManager.updateQuestProgress('turnsPlayed', 1);
           }
           // --- END QUEST TRACKING ---

           // Dispatch turn start event for global listeners
           const turnStartEvent = new CustomEvent('TurnStart', {
               detail: {
                   turn: this.gameState.turn,
                   phase: this.gameState.phase,
                   playerCharacters: this.gameState.playerCharacters,
                   // Add character information to help with Bubble Pop debugging
                   playerCharactersInfo: this.gameState.playerCharacters.map(char => ({
                       id: char.id,
                       name: char.name,
                       talents: char.appliedTalents,
                       bubblePopActive: char.bubblePopActive
                   }))
               }
           });
           document.dispatchEvent(turnStartEvent);
           console.log(`[GameManager] Dispatched TurnStart event for turn ${this.gameState.turn}`, turnStartEvent);

           // --- Process Start-of-Turn for PLAYER characters ---
           this.gameState.playerCharacters.forEach(char => {
               if (char && !char.isDead()) {
                   // 1. Trigger onTurnStart for passives (using the NEW turn number)
                   if (char.passiveHandler && typeof char.passiveHandler.onTurnStart === 'function') {
                       try {
                           console.log(`[GameManager endAITurn] Calling onTurnStart for ${char.name} (Instance: ${char.instanceId || char.id}), Turn: ${this.gameState.turn}`);
                           char.passiveHandler.onTurnStart(char, this.gameState.turn);
                       } catch (e) {
                           console.error(`Error in onTurnStart for ${char.name}'s passive:`, e);
                       }
                   }

                   // 2. Process effects (apply buffs/debuffs, NO duration reduction, WITH regeneration)
                   char.processEffects(false, true); // false, true -> Apply effects, don't reduce duration, do regenerate

                   // 4. Reduce ability cooldowns
                   char.abilities.forEach(ability => ability.reduceCooldown());

                   // 5. Update UI
                   this.uiManager.updateCharacterUI(char); // Use this.uiManager
               }
           });
           // --- END Player Start-of-Turn Processing ---

           // Check for Bridget characters with special talents
           this.gameState.playerCharacters.forEach(character => {
               if (character.id === 'bridget' && !character.isDead()) {
                   console.log(`[GameManager endAITurn] Checking Bridget character talents: 
                       - Applied Talents: ${character.appliedTalents?.join(', ') || 'none'}
                       - Has Bubble Pop talent: ${character.appliedTalents?.includes('bubble_pop')}
                       - bubblePopActive property: ${character.bubblePopActive}
                   `);
                   
                   // Trigger Tidal Mastery if active
                   if (character.tidalMasteryActive && typeof window.handleBridgetTidalMastery === 'function') {
                       console.log(`[GameManager endAITurn] Triggering Tidal Mastery check for ${character.name}`);
                       window.handleBridgetTidalMastery(character);
                   }
                   
                   // Force-trigger Bubble Pop if debug is needed
                   if (character.bubblePopActive && character.passiveHandler) {
                       console.log(`[GameManager endAITurn] DEBUG: Attempting direct Bubble Pop trigger for ${character.name}`);
                       try {
                           character.passiveHandler.applyBubblePopDebuff();
                       } catch (error) {
                           console.error(`[GameManager endAITurn] Error triggering Bubble Pop:`, error);
                       }
                   }
               }
           });

           // --- Process Start-of-Turn for AI characters (Duration Reduction Only) ---
           // AI regeneration and cooldowns happen at the *start* of executeAITurn
           this.gameState.aiCharacters.forEach(aiChar => {
                if (aiChar && !aiChar.isDead()) {
                    // Only reduce effect durations here
                    aiChar.processEffects(false, false); // false, false -> Don't reduce duration here, don't regenerate
                    this.uiManager.updateCharacterUI(aiChar); // Update UI for duration changes
                }
           });
           // --- END AI Start-of-Turn Processing ---


           // Set phase AFTER processing effects for the new turn
           this.gameState.phase = 'player';
           
           // Dispatch turn:start events for each player character who can act
           this.gameState.playerCharacters.forEach(character => {
               if (character && !character.isDead() && !character.isStunned()) {
                   const turnStartEvent = new CustomEvent('turn:start', {
                       detail: {
                           phase: this.gameState.phase,
                           character: character,
                           turn: this.gameState.turn
                       }
                   });
                   document.dispatchEvent(turnStartEvent);
                   console.log(`[GameManager] Dispatched turn:start event for ${character.name}`);
               }
           });

           // Update turn counter UI
           this.uiManager.updateTurnCounter(this.gameState.turn);
           this.uiManager.updatePhase(this.gameState.phase);
           this.uiManager.resetActedCharacters();
           this.actedCharacters = []; // Reset the list of characters who have acted this turn

           // Apply stage effects at the start of the player turn sequence
           this.applyStageEffects();

           // Clear selections
           this.gameState.selectedCharacter = null;
           this.gameState.selectedAbility = null;
           this.uiManager.clearSelection();

           // Re-enable end turn button
           this.uiManager.updateEndTurnButton();

           // Check if the game ended after processing turn start effects
           if (this.checkGameOver()) {
               console.log("[GameManager endAITurn] Game over detected after start-of-turn processing.");
               // Game over screen is shown within checkGameOver if true
               return; // Stop further actions if game is over
           }
       }

       // --- NEW FUNCTION: Apply stage-specific passive effects using centralized system ---
       applyStageEffects() {
           // Use the centralized stage modifiers system
           if (window.stageModifiersRegistry) {
               try {
                   window.stageModifiersRegistry.processModifiers(this, this.stageManager, 'turnStart');
               } catch (error) {
                   console.error('[GameManager] Error processing stage modifiers:', error);
               }
           } else {
               console.warn('[GameManager] StageModifiersRegistry not available, falling back to legacy system');
               
               // Legacy fallback for 'It finally rains!' modifier
               const rainModifier = this.stageManager?.getStageModifier('it_finally_rains');
               if (rainModifier) {
                   this.addLogEntry("The rain provides soothing relief.", "stage-effect positive");
                   this.gameState.playerCharacters.forEach(playerChar => {
                       if (!playerChar.isDead()) {
                           const healAmount = Math.floor(playerChar.stats.maxHp * 0.03);
                           if (healAmount > 0) {
                               playerChar.heal(healAmount, null, { passiveSource: rainModifier.id, isStageEffect: true, hideLog: true });
                               this.addLogEntry(`${playerChar.name} heals ${healAmount} HP from the rain.`, "stage-effect heal");
                               this.showRainHealVFX(playerChar, healAmount);
                           }
                       }
                   });
               }
           }
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
                
                            // --- DEBUG LOGGING ---
            console.log('[GameManager] checkGameOver: Checking win conditions:', JSON.stringify(winConditions, null, 2));
            console.log('[GameManager] checkGameOver: Current stage:', this.stageManager?.currentStage?.name);
            console.log('[GameManager] checkGameOver: AI Characters:', this.gameState.aiCharacters.map(c => ({ id: c.id, instanceId: c.instanceId, isDead: c.isDead() })));
            // --- END DEBUG LOGGING ---
                
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
                        // --- DEBUG LOGGING ---
                        console.log(`[GameManager] checkGameOver: Checking enemyDefeated condition for targetId: ${condition.targetId}`);
                        // --- END DEBUG LOGGING ---
                        
                        // Check both id and instanceId to find the target enemy
                        const targetEnemy = this.gameState.aiCharacters.find(char => 
                            char.id === condition.targetId || 
                            (char.instanceId && char.instanceId.startsWith(condition.targetId))
                        );
                        
                        // --- DEBUG LOGGING ---
                        console.log(`[GameManager] checkGameOver: Found target enemy:`, targetEnemy ? { id: targetEnemy.id, instanceId: targetEnemy.instanceId, isDead: targetEnemy.isDead() } : 'NOT FOUND');
                        // --- END DEBUG LOGGING ---
                        
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
                console.log('[GameManager] Attempting to save battle result and award XP...');
                // --- DEBUG LOGGING END ---
                
                // --- STATISTICS TRACKING: End match with winner ---
                if (window.statisticsManager) {
                    const winner = isVictory ? 'Player' : 'AI';
                    window.statisticsManager.endMatch(winner);
                    console.log(`[GameManager] Statistics tracking ended. Winner: ${winner}`);
                }
                // --- END STATISTICS TRACKING ---
                
                // Process stage end modifiers
                if (window.stageModifiersRegistry) {
                    try {
                        window.stageModifiersRegistry.processModifiers(this, this.stageManager, 'stageEnd');
                    } catch (error) {
                        console.error('[GameManager] Error processing stage end modifiers:', error);
                    }
                }
               
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
                       
                       // Show a brief notification about the save failure
                       if (error.message && error.message.includes('sendRequest')) {
                           console.warn('[GameManager] Firebase connection issue detected. Battle progress may not be saved.');
                           // You could show a toast notification here if you have a notification system
                       }
                       
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
           console.log(`[GameManager] Adding log entry: ${message} (class: ${className})`); // Debug log
           
           // Use the global addBattleLogMessage function if available
           if (window.addBattleLogMessage) {
               window.addBattleLogMessage(message, className);
               return;
           }
           
           // Fallback implementation
           const logElement = document.getElementById('battle-log');
           if (!logElement) {
               console.warn('[GameManager] Battle log element not found! Message:', message);
               return;
           }
           
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
           
           console.log(`[GameManager] Log entry added successfully`); // Debug log
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
           
           // Check if Firebase is properly initialized and try to reinitialize if needed
           if (!firebaseDatabase) {
               console.error('[GameManager] Firebase database not initialized. Attempting to reinitialize...');
               try {
                   // Try to reinitialize Firebase
                   if (window.firebase && window.firebase.database) {
                       firebaseDatabase = window.firebase.database();
                       console.log('[GameManager] Firebase database reinitialized successfully.');
                   } else {
                       console.error('[GameManager] Cannot reinitialize Firebase database. Firebase not available.');
                       return false;
                   }
               } catch (error) {
                   console.error('[GameManager] Error reinitializing Firebase database:', error);
                   return false;
               }
           }
           
           if (!firebaseAuth || !firebaseAuth.currentUser) {
               console.error('[GameManager] Firebase auth not initialized or user not authenticated.');
               try {
                   // Try to get auth from window
                   if (window.auth && window.auth.currentUser) {
                       firebaseAuth = window.auth;
                       console.log('[GameManager] Firebase auth recovered from window.');
                   } else {
                       console.error('[GameManager] Cannot save battle result - user not authenticated.');
                       return false;
                   }
               } catch (error) {
                   console.error('[GameManager] Error recovering Firebase auth:', error);
                   return false;
               }
           }
           
           const userId = getCurrentUserId();
           if (!userId) {
               console.log('[GameManager] User not logged in. Cannot save battle result.');
               return false;
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
                            .map(char => {
                                const charState = {
                                    id: char.id,
                                    currentHP: char.stats.currentHp,
                                    currentMana: char.stats.currentMana,
                                    // --- IMPORTANT: Include stats to persist modifications ---
                                    stats: { ...char.stats } 
                                    // --- END IMPORTANT ---
                                };
                                
                                // --- NEW: Include atlantean blessings if they exist ---
                                if (char.atlanteanBlessings && Object.keys(char.atlanteanBlessings).length > 0) {
                                    charState.atlanteanBlessings = { ...char.atlanteanBlessings };
                                }
                                // --- END NEW ---
                                
                                // Include hell effects if they exist (Firebase doesn't allow undefined)
                                if (char.hellEffects && Object.keys(char.hellEffects).length > 0) {
                                    charState.hellEffects = { ...char.hellEffects };
                                }
                                
                                // Include permanent debuffs if they exist
                                if (char.permanentDebuffs && char.permanentDebuffs.length > 0) {
                                    charState.permanentDebuffs = [...char.permanentDebuffs];
                                }
                                
                                // Include permanent buffs if they exist
                                if (char.permanentBuffs && char.permanentBuffs.length > 0) {
                                    charState.permanentBuffs = [...char.permanentBuffs];
                                }
                                
                                return charState;
                            });
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
                         console.log(`[GameManager] Firebase database status:`, firebaseDatabase ? 'initialized' : 'null');
                         console.log(`[GameManager] Firebase auth status:`, firebaseAuth?.currentUser ? 'authenticated' : 'not authenticated');
                         // --- DEBUG LOGGING END ---
                         
                         // Double-check Firebase is still valid before the operation
                         if (!firebaseDatabase) {
                             throw new Error('Firebase database became null during operation');
                         }
                         
                        await firebaseDatabase.ref(resultPath).set(battleResult);
                        console.log(`[GameManager] Battle result for story ${storyId}, stage ${stageIndex} saved to Firebase.`);
                        
                        // Update quest progress for story battles
                        if (typeof window.questManager !== 'undefined' && window.questManager.initialized) {
                            await this.updateQuestProgressOnGameEnd(isVictory, true); // true = story mode
                        }
                        
                        // Award XP for victory in story battles
                        if (isVictory) {
                            await this.awardExperienceToCharacters(
                                { 
                                    id: `${storyId}_${stageIndex}`,
                                    name: this.stageManager?.currentStage?.name || `Story Stage ${stageIndex}`,
                                    difficulty: this.stageManager?.currentStage?.difficulty || 1 
                                },
                                this.gameState.playerCharacters.map(char => ({
                                    id: char.id,
                                    name: char.name,
                                    level: char.level || 1,
                                    survived: !char.isDead()
                                }))
                            );
                        }
                        
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
                        // Double-check Firebase is still valid before the operation
                        if (!firebaseDatabase) {
                            throw new Error('Firebase database became null during standalone battle save operation');
                        }
                        
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
                        
                        console.log(`[GameManager] Saving standalone battle data:`, battleData);
                        
                        // Save the battle result
                        await firebaseDatabase.ref(resultsPath).push(battleData);
                        console.log(`[GameManager] Standalone battle result for stage ${stageId} saved to Firebase.`);

                        // Update quest progress for standalone battles
                        if (typeof window.questManager !== 'undefined' && window.questManager.initialized) {
                            await this.updateQuestProgressOnGameEnd(isVictory, false); // false = standalone mode
                        }
                        
                        // Award XP for victory in standalone battles
                        if (isVictory) {
                            await this.awardExperienceToCharacters(
                                { 
                                    id: stageId, 
                                    name: this.stageManager?.currentStage?.name || stageId,
                                    difficulty: this.stageManager?.currentStage?.difficulty || 1 
                                },
                                this.gameState.playerCharacters.map(char => ({
                                    id: char.id,
                                    name: char.name,
                                    level: char.level || 1,
                                    survived: !char.isDead()
                                }))
                            );
                        }

                        // Process stage rewards for victory
                        if (isVictory && this.stageManager?.currentStage?.rewards) {
                            await this.processStageRewards(this.stageManager.currentStage.rewards);
                        }
                        
                        return true; // Indicate success
                    } catch (error) {
                        console.error(`[GameManager] Firebase Error: Failed to save standalone battle result for stage ${stageId}:`, error);
                        // Re-throw the error so the caller knows it failed
                        throw error;
                    }
                }
                else {
                    console.log('[GameManager] No stage ID identified. Skipping Firebase save.');
                    
                    // Update quest progress even if we can't save to Firebase
                    if (typeof window.questManager !== 'undefined' && window.questManager.initialized) {
                        await this.updateQuestProgressOnGameEnd(isVictory, false); // false = unknown mode
                    }
                    
                    // Still award XP for victory even if we can't save to Firebase
                    if (isVictory) {
                        await this.awardExperienceToCharacters(
                            { 
                                id: 'unknown_stage',
                                name: 'Battle',
                                difficulty: 1 // Default difficulty for unknown stages
                            },
                            this.gameState.playerCharacters.map(char => ({
                                id: char.id,
                                name: char.name,
                                level: char.level || 1,
                                survived: !char.isDead()
                            }))
                        );
                    }
                    
                    return false; // Indicate save was skipped
                }
           } catch (error) { // Catch errors from the outer logic (e.g., parsing stageIndex)
                console.error(`[GameManager] Error during saveBattleResultToFirebase setup:`, error);
                throw error; // Re-throw to be caught by checkGameOver
           }
       }

       /**
        * Process stage rewards like character unlocks, items, etc.
        */
       async processStageRewards(rewards) {
           console.log('[GameManager] Processing stage rewards:', rewards);
           
           if (!rewards || rewards.length === 0) {
               console.log('[GameManager] No rewards to process');
               return;
           }

           const user = firebaseAuth.currentUser;
           if (!user) {
               console.error('[GameManager] Cannot process rewards - user not authenticated');
               return;
           }

           const userId = user.uid;
           
           // Process regular rewards
           if (rewards && rewards.length > 0) {
               for (const reward of rewards) {
                   try {
                       // Check if reward should be granted based on chance
                       const roll = Math.random();
                       if (roll > (reward.chance || 1.0)) {
                           console.log(`[GameManager] Reward ${reward.name || reward.id} not granted (chance: ${reward.chance}, roll: ${roll})`);
                           continue;
                       }

                       console.log(`[GameManager] Processing reward: ${reward.name || reward.id} (type: ${reward.type})`);

                       switch (reward.type) {
                           case 'character':
                               await this.unlockCharacterReward(userId, reward.id, reward.name);
                               break;
                           case 'stage':
                               await this.unlockStageReward(userId, reward.id, reward.name);
                               break;
                           case 'story':
                               await this.unlockStoryReward(userId, reward.id, reward.name);
                               break;
                           case 'gold':
                               console.log(`[GameManager] Gold rewards not yet implemented: ${reward.value}`);
                               break;
                           case 'experience':
                               console.log(`[GameManager] Experience rewards not yet implemented: ${reward.value}`);
                               break;
                           case 'item':
                               console.log(`[GameManager] Item rewards not yet implemented: ${reward.value}`);
                               break;
                           default:
                               console.warn(`[GameManager] Unknown reward type: ${reward.type}`);
                       }
                   } catch (error) {
                       console.error(`[GameManager] Error processing reward ${reward.name || reward.id}:`, error);
                   }
               }
           }

           // Check for first-time completion reward
           const currentStage = this.stageManager?.currentStage;
           if (currentStage?.firstTimeCompletionReward) {
               await this.processFirstTimeCompletionReward(userId, currentStage);
           }
       }

       /**
        * Process first-time completion reward for a stage
        */
       async processFirstTimeCompletionReward(userId, stage) {
           try {
               console.log(`[GameManager] Checking first-time completion reward for stage: ${stage.id}`);
               
               // Check if this stage has been completed before
               const completionRef = firebaseDatabase.ref(`users/${userId}/stageCompletions/${stage.id}`);
               const completionSnapshot = await completionRef.once('value');
               
               if (completionSnapshot.exists()) {
                   console.log(`[GameManager] Stage ${stage.id} already completed before, skipping first-time reward`);
                   return;
               }
               
               console.log(`[GameManager] First-time completion detected! Processing reward...`);
               
               const reward = stage.firstTimeCompletionReward;
               
               switch (reward.type) {
                   case 'random_character':
                       await this.grantRandomCharacterReward(userId, reward);
                       break;
                   case 'character':
                       await this.unlockCharacterReward(userId, reward.id, reward.name);
                       break;
                   default:
                       console.warn(`[GameManager] Unknown first-time completion reward type: ${reward.type}`);
               }
               
               // Mark stage as completed
               await completionRef.set({
                   completedAt: firebaseDatabase.ServerValue.TIMESTAMP,
                   rewardClaimed: true,
                   rewardType: reward.type
               });
               
               console.log(`[GameManager] ✅ First-time completion reward processed for stage: ${stage.id}`);
               
           } catch (error) {
               console.error(`[GameManager] Error processing first-time completion reward:`, error);
           }
       }

       /**
        * Grant a random character reward using QuestManager's character ownership logic
        */
       async grantRandomCharacterReward(userId, reward) {
           try {
               console.log('[GameManager] Granting random character reward...');
               
               // Use QuestManager's character ownership checking if available
               if (window.questManager && window.questManager.initialized) {
                   const unownedCharacters = await window.questManager.getUnownedCharacters();
                   
                   // Filter out farmer characters for Farm Showdown stage
                   const excludedFarmers = ['farmer_alice', 'farmer_cham_cham', 'farmer_nina', 'farmer_raiden', 'farmer_shoma'];
                   const availableCharacters = unownedCharacters.filter(charId => !excludedFarmers.includes(charId));
                   
                   console.log(`[GameManager] Filtered characters (excluding farmers): ${availableCharacters.length} available`);
                   console.log(`[GameManager] Available characters: ${availableCharacters.join(', ')}`);
                   
                   if (availableCharacters.length === 0) {
                       console.log('[GameManager] Player owns all non-farmer characters, granting alternative reward');
                       this.showRewardNotification('info', 'You already own all available non-farmer characters! Here are some bonus talent points instead.');
                       // TODO: Implement talent point alternative reward
                       return;
                   }
                   
                   // Select random character from filtered list
                   const randomCharacterId = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
                   console.log(`[GameManager] Selected random character: ${randomCharacterId}`);
                   
                   // Grant the character using QuestManager's system
                   const granted = await window.questManager.grantCharacterReward(randomCharacterId);
                   
                   if (granted) {
                       const characterName = window.questManager.getCharacterDisplayName(randomCharacterId);
                       console.log(`[GameManager] ✅ Random character ${characterName} granted successfully!`);
                       this.showRewardNotification('character', characterName, reward.message);
                   } else {
                       throw new Error('Failed to grant random character reward');
                   }
               } else {
                   console.warn('[GameManager] QuestManager not available, using fallback character reward system');
                   // Fallback to basic character unlock (you could implement a simpler version here)
                   this.showRewardNotification('info', 'Character reward system temporarily unavailable');
               }
               
           } catch (error) {
               console.error('[GameManager] Error granting random character reward:', error);
               throw error;
           }
       }

       /**
        * Unlock a character reward
        */
       async unlockCharacterReward(userId, characterId, characterName) {
           try {
               console.log(`[GameManager] Unlocking character: ${characterId}`);
               
               // Check if character is already owned
               const ownedSnapshot = await firebaseDatabase.ref(`users/${userId}/ownedCharacters`).once('value');
               let ownedCharacters = [];
               
               if (ownedSnapshot.exists()) {
                   const ownedData = ownedSnapshot.val();
                   if (Array.isArray(ownedData)) {
                       ownedCharacters = ownedData;
                   } else if (typeof ownedData === 'object') {
                       ownedCharacters = Object.values(ownedData);
                   }
               }

               if (ownedCharacters.includes(characterId)) {
                   console.log(`[GameManager] Character ${characterId} already owned, skipping unlock`);
                   return;
               }

               // Add character to owned characters
               ownedCharacters.push(characterId);
               await firebaseDatabase.ref(`users/${userId}/ownedCharacters`).set(ownedCharacters);
               
               // Also add to UnlockedRAIDCharacters for consistency
               await firebaseDatabase.ref(`users/${userId}/UnlockedRAIDCharacters/${characterId}`).set({
                   unlockedAt: firebaseDatabase.ServerValue.TIMESTAMP,
                   source: 'weekly_challenge_reward'
               });

               console.log(`[GameManager] ✅ Character ${characterId} unlocked successfully!`);
               
               // Show reward notification
               this.showRewardNotification('character', characterName || characterId);
               
           } catch (error) {
               console.error(`[GameManager] Error unlocking character ${characterId}:`, error);
               throw error;
           }
       }

       /**
        * Unlock a stage reward
        */
       async unlockStageReward(userId, stageId, stageName) {
           try {
               console.log(`[GameManager] Unlocking stage: ${stageId}`);
               
               const ownedSnapshot = await firebaseDatabase.ref(`users/${userId}/ownedStages`).once('value');
               let ownedStages = [];
               
               if (ownedSnapshot.exists()) {
                   const ownedData = ownedSnapshot.val();
                   if (Array.isArray(ownedData)) {
                       ownedStages = ownedData;
                   } else if (typeof ownedData === 'object') {
                       ownedStages = Object.values(ownedData);
                   }
               }

               if (ownedStages.includes(stageId)) {
                   console.log(`[GameManager] Stage ${stageId} already owned, skipping unlock`);
                   return;
               }

               ownedStages.push(stageId);
               await firebaseDatabase.ref(`users/${userId}/ownedStages`).set(ownedStages);
               
               console.log(`[GameManager] ✅ Stage ${stageId} unlocked successfully!`);
               this.showRewardNotification('stage', stageName || stageId);
               
           } catch (error) {
               console.error(`[GameManager] Error unlocking stage ${stageId}:`, error);
               throw error;
           }
       }

       /**
        * Unlock a story reward
        */
       async unlockStoryReward(userId, storyId, storyName) {
           try {
               console.log(`[GameManager] Unlocking story: ${storyId}`);
               
               const ownedSnapshot = await firebaseDatabase.ref(`users/${userId}/ownedStories`).once('value');
               let ownedStories = [];
               
               if (ownedSnapshot.exists()) {
                   const ownedData = ownedSnapshot.val();
                   if (Array.isArray(ownedData)) {
                       ownedStories = ownedData;
                   } else if (typeof ownedData === 'object') {
                       ownedStories = Object.values(ownedData);
                   }
               }

               if (ownedStories.includes(storyId)) {
                   console.log(`[GameManager] Story ${storyId} already owned, skipping unlock`);
                   return;
               }

               ownedStories.push(storyId);
               await firebaseDatabase.ref(`users/${userId}/ownedStories`).set(ownedStories);
               
               console.log(`[GameManager] ✅ Story ${storyId} unlocked successfully!`);
               this.showRewardNotification('story', storyName || storyId);
               
           } catch (error) {
               console.error(`[GameManager] Error unlocking story ${storyId}:`, error);
               throw error;
           }
       }

       /**
        * Show a reward notification to the player
        */
       showRewardNotification(rewardType, rewardName, customMessage = null) {
           const icons = {
               character: '🎭',
               stage: '🏟️',
               story: '📖',
               item: '🎁',
               gold: '💰',
               info: 'ℹ️'
           };
           
           const messages = {
               character: 'Character Unlocked!',
               stage: 'Stage Unlocked!',
               story: 'Story Unlocked!',
               item: 'Item Acquired!',
               gold: 'Gold Earned!',
               info: 'Information'
           };

           const notification = document.createElement('div');
           notification.className = 'reward-notification';
           // Use custom message if provided, otherwise use default structure
           const displayMessage = customMessage || `<div class="reward-title">${messages[rewardType] || 'Reward Earned!'}</div><div class="reward-name">${rewardName}</div>`;
           
           notification.innerHTML = `
               <div class="reward-notification-content">
                   <div class="reward-icon">${icons[rewardType] || '🎁'}</div>
                   <div class="reward-text">
                       ${displayMessage}
                   </div>
               </div>
           `;

           // Add styles if not already present
           if (!document.getElementById('reward-notification-styles')) {
               const styles = document.createElement('style');
               styles.id = 'reward-notification-styles';
               styles.textContent = `
                   .reward-notification {
                       position: fixed;
                       top: 20px;
                       right: 20px;
                       background: linear-gradient(135deg, #4ade80, #22c55e);
                       color: white;
                       padding: 20px;
                       border-radius: 12px;
                       box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                       transform: translateX(400px);
                       opacity: 0;
                       transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                       z-index: 10000;
                       max-width: 350px;
                       font-family: 'Montserrat', sans-serif;
                   }
                   
                   .reward-notification.show {
                       transform: translateX(0);
                       opacity: 1;
                   }
                   
                   .reward-notification-content {
                       display: flex;
                       align-items: center;
                       gap: 15px;
                   }
                   
                   .reward-icon {
                       font-size: 2.5rem;
                       background: rgba(255, 255, 255, 0.2);
                       width: 60px;
                       height: 60px;
                       border-radius: 50%;
                       display: flex;
                       align-items: center;
                       justify-content: center;
                       animation: rewardPulse 2s ease-in-out infinite;
                   }
                   
                   @keyframes rewardPulse {
                       0%, 100% { transform: scale(1); }
                       50% { transform: scale(1.1); }
                   }
                   
                   .reward-text {
                       flex: 1;
                   }
                   
                   .reward-title {
                       font-size: 1.2rem;
                       font-weight: 700;
                       margin-bottom: 5px;
                   }
                   
                   .reward-name {
                       font-size: 1rem;
                       opacity: 0.9;
                       font-weight: 500;
                   }
               `;
               document.head.appendChild(styles);
           }

           document.body.appendChild(notification);

           // Show notification
           setTimeout(() => {
               notification.classList.add('show');
           }, 100);

           // Hide notification after 5 seconds
           setTimeout(() => {
               notification.classList.remove('show');
               setTimeout(() => {
                   if (notification.parentNode) {
                       notification.remove();
                   }
               }, 500);
           }, 5000);

           console.log(`[GameManager] 🎉 Reward notification shown: ${rewardType} - ${rewardName}`);
       }

       /**
        * Award experience points to characters after a successful battle
        */
       async awardExperienceToCharacters(stageInfo, characterStates) {
           console.log('[GameManager] awardExperienceToCharacters called with:', { stageInfo, characterStates });
           
           if (!this.characterXPManager) {
               console.warn('[GameManager] CharacterXPManager not available for XP awarding');
               return;
           }

           console.log(`[GameManager] Awarding XP to characters. Stage: ${stageInfo.name}, Difficulty: ${stageInfo.difficulty}`);
           
           // Calculate bonuses based on battle performance
           const allSurvived = characterStates.every(char => char.survived);
           const bonuses = {
               perfectVictory: allSurvived,
               speedBonus: this.gameState.turn <= 5, // Completed in 5 turns or less
               underdog: characterStates.length < this.gameState.aiCharacters.length // Outnumbered
           };

           const xpResults = [];

           for (const charState of characterStates) {
               try {
                   // Get character's current level for calculation
                   const characterLevel = charState.level || 1;
                   
                   const result = await this.characterXPManager.awardExperience(
                       charState.id, 
                       stageInfo.difficulty, 
                       characterLevel, 
                       charState.survived, 
                       bonuses
                   );
                   
                   if (result) {
                       xpResults.push({
                           characterName: charState.name,
                           characterId: charState.id,
                           ...result
                       });
                       
                   if (result.leveledUp) {
                           console.log(`[GameManager] 🎉 ${charState.name} leveled up! ${result.oldLevel} → ${result.newLevel}`);
                   } else {
                           console.log(`[GameManager] ${charState.name} gained ${result.calculationDetails.xpAwarded} XP (Total: ${result.totalXP})`);
                       }
                   }
               } catch (error) {
                   console.error(`[GameManager] Error awarding XP to ${charState.name}:`, error);
               }
           }

           // Show the XP results in a beautiful display
           if (xpResults.length > 0) {
               this.showXPRewardsDisplay(xpResults, stageInfo, bonuses);
           }
       }

       /**
        * Show a modern, beautiful XP rewards display
        */
       showXPRewardsDisplay(xpResults, stageInfo, bonuses) {
           // Create the main container
           const xpDisplay = document.createElement('div');
           xpDisplay.className = 'xp-rewards-display';
           xpDisplay.innerHTML = `
               <div class="xp-display-backdrop"></div>
               <div class="xp-display-content">
                   <div class="xp-display-header">
                       <h2>🏆 Victory!</h2>
                       <p class="stage-complete">Completed: ${stageInfo.name}</p>
                       <div class="difficulty-badge difficulty-${stageInfo.difficulty}">
                           Difficulty ${stageInfo.difficulty}
                       </div>
                   </div>
                   
                   <div class="xp-bonuses">
                       ${bonuses.perfectVictory ? '<div class="bonus-item perfect"><span class="bonus-icon">⭐</span> Perfect Victory! +15% XP</div>' : ''}
                       ${bonuses.speedBonus ? '<div class="bonus-item speed"><span class="bonus-icon">⚡</span> Lightning Fast! +10% XP</div>' : ''}
                       ${bonuses.underdog ? '<div class="bonus-item underdog"><span class="bonus-icon">💪</span> Against the Odds! +20% XP</div>' : ''}
                   </div>
                   
                   <div class="xp-characters">
                       ${xpResults.map(result => this.createCharacterXPDisplay(result)).join('')}
                   </div>
                   
                   <div class="xp-display-actions">
                       <button class="xp-continue-btn" onclick="this.closest('.xp-rewards-display').remove()">
                           Continue
                       </button>
                   </div>
               </div>
           `;
           
           document.body.appendChild(xpDisplay);
           
           // Animate in
           setTimeout(() => {
               xpDisplay.classList.add('show');
               this.animateXPNumbers(xpDisplay);
           }, 100);
       }

       /**
        * Load character registry data
        */
       async loadCharacterRegistry() {
           if (this.characterRegistry) {
               return this.characterRegistry;
           }
           
           try {
               const response = await fetch('js/raid-game/character-registry.json');
               if (!response.ok) {
                   throw new Error(`Failed to load character registry: ${response.status}`);
               }
               const data = await response.json();
               this.characterRegistry = data;
               return data;
           } catch (error) {
               console.error('[GameManager] Error loading character registry:', error);
               return null;
           }
       }

       /**
        * Get character image path from registry (synchronous with cached data)
        */
       getCharacterImageFromRegistry(characterId) {
           if (this.characterRegistry && this.characterRegistry.characters) {
               const character = this.characterRegistry.characters.find(char => char.id === characterId);
               return character ? character.ingameimage : null;
           }
           return null;
       }

       /**
        * Get character image path with proper naming conversion
        */
       getCharacterImagePath(characterId) {
           // Always try skin system first (handles both basic and premium skins)
           if (window.SkinManager) {
               try {
                   const skinImagePath = window.SkinManager.getCharacterImagePath(characterId);
                   if (skinImagePath) {
                       return skinImagePath;
                   }
               } catch (error) {
                   console.warn(`[GameManager] Error getting skin image for ${characterId}: ${error.message}`);
               }
           }
           
           // Fallback to Loading Screen folder for ALL character images
           const characterImagePath = this.getCharacterImageFromRegistry(characterId);
           if (characterImagePath) {
               // Use URL encoding for the path from registry
               return characterImagePath.replace(/ /g, '%20');
           } else {
               // If character not found in registry, try to derive name from characterId
               // Convert character_id format to Character Name format
               const characterName = characterId
                   .split('_')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' ');
               return `Loading%20Screen/${encodeURIComponent(characterName)}.png`;
           }
       }

       /**
        * Create individual character XP display
        */
       createCharacterXPDisplay(result) {
           const xpGained = result.calculationDetails.xpAwarded;
           const levelUpClass = result.leveledUp ? 'level-up' : '';
           const deadClass = !result.calculationDetails.survived ? 'character-dead' : '';
           const imagePath = this.getCharacterImagePath(result.characterId);
           
           return `
               <div class="character-xp-item ${levelUpClass} ${deadClass}">
                   <div class="character-avatar">
                       <img src="${imagePath}" 
                            alt="${result.characterName}"
                            onerror="this.src='Icons/characters/default.png'">
                       ${result.leveledUp ? '<div class="level-up-burst">🎉</div>' : ''}
                   </div>
                   
                   <div class="character-info">
                       <h3 class="character-name">${result.characterName}</h3>
                       <div class="xp-gain">
                           <span class="xp-number" data-xp="${xpGained}">+0</span>
                           <span class="xp-label">XP</span>
                       </div>
                       
                       ${result.leveledUp ? `
                           <div class="level-change">
                               <span class="old-level">Lv.${result.oldLevel}</span>
                               <span class="level-arrow">→</span>
                               <span class="new-level">Lv.${result.newLevel}</span>
                           </div>
                           ${result.talentPointsAwarded > 0 ? `
                               <div class="talent-points-awarded">
                                   <span class="talent-icon">⭐</span>
                                   <span class="talent-points-text">+${result.talentPointsAwarded} Talent Point${result.talentPointsAwarded > 1 ? 's' : ''}!</span>
                               </div>
                           ` : ''}
                       ` : `
                           <div class="current-level">Level ${result.newLevel}</div>
                       `}
                       
                       <div class="xp-progress-bar">
                           <div class="xp-progress-fill" style="width: ${this.calculateXPProgressPercentage(result)}%"></div>
                           <span class="xp-progress-text">${result.totalXP} XP</span>
                       </div>
                   </div>
               </div>
           `;
       }

       /**
        * Calculate XP progress percentage for the progress bar
        */
       calculateXPProgressPercentage(result) {
           const currentLevel = result.newLevel;
           const totalXP = result.totalXP;
           
           // Use the Character class calculation methods
           const xpForCurrentLevel = Character.calculateXPRequiredForLevel(currentLevel);
           const xpForNextLevel = Character.calculateXPRequiredForLevel(currentLevel + 1);
           
           const progressXP = totalXP - xpForCurrentLevel;
           const progressNeeded = xpForNextLevel - xpForCurrentLevel;
           
           return progressNeeded > 0 ? Math.min(100, (progressXP / progressNeeded) * 100) : 100;
       }

       /**
        * Animate XP numbers counting up
        */
       animateXPNumbers(container) {
           const xpNumbers = container.querySelectorAll('.xp-number');
           
           xpNumbers.forEach(element => {
               const targetXP = parseInt(element.dataset.xp);
               let currentXP = 0;
               const increment = Math.max(1, Math.floor(targetXP / 30)); // Animate over ~30 frames
               
               const animateCounter = () => {
                   currentXP = Math.min(currentXP + increment, targetXP);
                   element.textContent = `+${currentXP}`;
                   
                   if (currentXP < targetXP) {
                       requestAnimationFrame(animateCounter);
                   }
               };
               
               // Start animation after a brief delay for each character
               const delay = Array.from(xpNumbers).indexOf(element) * 200;
           setTimeout(() => {
                   requestAnimationFrame(animateCounter);
               }, delay);
           });
       }

       /**
        * Show a level up notification to the player (updated version)
        */
       showLevelUpNotification(characterName, newLevel) {
           // This is now handled by the main XP display, but keeping for compatibility
           console.log(`[GameManager] ${characterName} reached Level ${newLevel}!`);
       }

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
           
           // --- STATISTICS TRACKING: Record character death ---
           if (window.statisticsManager) {
               window.statisticsManager.recordCharacterDeath(character);
           }
           // --- END STATISTICS TRACKING ---

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

           // Trigger stage modifiers for character death
           if (window.stageModifiersRegistry && this.stageManager) {
               window.stageModifiersRegistry.processModifiers(this, this.stageManager, 'characterDeath', { character: character });
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
           
           // After damage is applied, if there is a caster, dispatch a damage-dealt event
           if (caster && amount > 0) {
               // Create and dispatch custom event for damage dealt
               document.dispatchEvent(new CustomEvent('character:damage-dealt', {
                   detail: {
                       character: caster,
                       target: this.gameState.selectedTarget,
                       damage: amount,
                       damageType: type,
                       isCritical: options.isCritical || false
                   }
               }));
           }
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
           
           // Create dodge particles
           const dodgeParticles = document.createElement('div');
           dodgeParticles.className = 'dodge-particles';
           for (let i = 0; i < 6; i++) {
               const particle = document.createElement('div');
               particle.className = 'dodge-particle';
               // Add random particle direction variables
               const dx = (Math.random() - 0.5) * 60; // Random X direction
               const dy = (Math.random() - 0.5) * 40 - 20; // Random Y direction (bias upward)
               particle.style.setProperty('--dx', `${dx}px`);
               particle.style.setProperty('--dy', `${dy}px`);
               dodgeParticles.appendChild(particle);
           }
           dodgeVfx.appendChild(dodgeParticles);
           
           // Create afterimage effect
           const characterImage = charElement.querySelector('.character-image');
           if (characterImage) {
               const afterimage = document.createElement('div');
               afterimage.className = 'dodge-afterimage';
               afterimage.style.backgroundImage = `url(${characterImage.src})`;
               dodgeVfx.appendChild(afterimage);
           }
           
           // Create speed lines
           const speedLines = document.createElement('div');
           speedLines.className = 'dodge-speed-lines';
           for (let i = 0; i < 4; i++) {
               const speedLine = document.createElement('div');
               speedLine.className = 'speed-line';
               speedLines.appendChild(speedLine);
           }
           dodgeVfx.appendChild(speedLines);
           
           // Add to character element
           charElement.appendChild(dodgeVfx);
           
           // Play dodge sound effect
           if (window.gameManager && window.gameManager.playSound) {
               window.gameManager.playSound('sounds/dodge_whoosh.mp3', 0.5).catch(() => {
                   // Fallback if specific dodge sound doesn't exist - try generic swoosh
                   window.gameManager.playSound('sounds/whoosh.mp3', 0.4).catch(() => {
                       console.log('No dodge sound effect available');
                   });
               });
           }
           
           // Add screen shake effect for dramatic impact
           this.addDodgeScreenShake();
           
           // Remove after animation completes
           setTimeout(() => {
               if (dodgeVfx.parentNode === charElement) {
                   charElement.removeChild(dodgeVfx);
               }
           }, 900); // Slightly longer than animation duration to ensure it completes
       }
       
       // Add subtle screen shake for dodge effect
       addDodgeScreenShake() {
           const battleContainer = document.querySelector('.battle-container');
           if (battleContainer) {
               battleContainer.classList.add('dodge-shake');
               setTimeout(() => {
                   battleContainer.classList.remove('dodge-shake');
               }, 200);
           }
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

       // Add these new methods for enhanced Bullet Rain VFX
       showBulletRainSourceVFX(character) {
           // Find character element
           const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
           if (!characterElement) return;
           
           // Create source VFX container
           const sourceVFX = document.createElement('div');
           sourceVFX.className = 'bullet-rain-source-vfx';
           document.body.appendChild(sourceVFX);
           
           // Position source VFX over the character
           const charRect = characterElement.getBoundingClientRect();
           sourceVFX.style.position = 'fixed';
           sourceVFX.style.left = `${charRect.left}px`;
           sourceVFX.style.top = `${charRect.top}px`;
           sourceVFX.style.width = `${charRect.width}px`;
           sourceVFX.style.height = `${charRect.height}px`;
           sourceVFX.style.zIndex = '9999';
           
           // Create text effect
           const textEffect = document.createElement('div');
           textEffect.className = 'bullet-rain-text';
           textEffect.textContent = 'BULLET RAIN';
           sourceVFX.appendChild(textEffect);
           
           // Add glow effect
           const glowEffect = document.createElement('div');
           glowEffect.className = 'bullet-rain-source';
           sourceVFX.appendChild(glowEffect);
           
           // Clean up
           setTimeout(() => sourceVFX.remove(), 2000);
           
           // Highlight character
           characterElement.dataset.hasBulletRain = "true";
           setTimeout(() => characterElement.dataset.hasBulletRain = "false", 2000);
       }

       showBulletRainTargetVFX(source, target, isCrit = false) {
           // Find character elements
           const sourceElement = document.getElementById(`character-${source.instanceId || source.id}`);
           const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
           if (!sourceElement || !targetElement) return;
           
           // Get positions
           const sourceRect = sourceElement.getBoundingClientRect();
           const targetRect = targetElement.getBoundingClientRect();
           
           // Create VFX container
           const vfxContainer = document.createElement('div');
           vfxContainer.className = 'bullet-rain-vfx';
           targetElement.appendChild(vfxContainer);
           
           // Create fixed screen overlay for bullets and effects
           const bulletContainer = document.createElement('div');
           bulletContainer.className = 'bullet-rain-projectile-container';
           bulletContainer.style.position = 'fixed';
           bulletContainer.style.top = '0';
           bulletContainer.style.left = '0';
           bulletContainer.style.width = '100%';
           bulletContainer.style.height = '100%';
           bulletContainer.style.pointerEvents = 'none';
           bulletContainer.style.zIndex = '9999';
           document.body.appendChild(bulletContainer);
           
           // Calculate source point (Nina)
           const sourceX = sourceRect.left + sourceRect.width / 2;
           const sourceY = sourceRect.top + sourceRect.height / 3; // from upper body
           
           // Calculate target point and create multiple bullets
           const bulletCount = isCrit ? 15 : 10;
           const targetData = [];
           
           // Mark target as being hit
           targetElement.dataset.bulletRainTarget = "true";
           
           // Create muzzle flash at source
           const muzzleFlash = document.createElement('div');
           muzzleFlash.className = 'muzzle-flash';
           muzzleFlash.style.position = 'fixed';
           muzzleFlash.style.left = `${sourceX}px`;
           muzzleFlash.style.top = `${sourceY}px`;
           muzzleFlash.style.transform = 'translate(-50%, -50%)';
           bulletContainer.appendChild(muzzleFlash);
           
           // Remove muzzle flash after animation
           setTimeout(() => muzzleFlash.remove(), 150);
           
           // Create bullet animations with slight delay between each
           for (let i = 0; i < bulletCount; i++) {
               setTimeout(() => {
                   // Randomize target point slightly within the target element
                   const targetX = targetRect.left + Math.random() * targetRect.width;
                   const targetY = targetRect.top + Math.random() * targetRect.height;
                   
                   // Calculate angle and distance for the bullet
                   const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI);
                   const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
                   
                   // Calculate time based on distance (faster bullets)
                   const time = distance / 2000; // pixels per second
                   
                   // Create bullet projectile
                   const bullet = document.createElement('div');
                   bullet.className = isCrit ? 'bullet-projectile critical' : 'bullet-projectile';
                   bullet.style.position = 'fixed';
                   bullet.style.left = `${sourceX}px`;
                   bullet.style.top = `${sourceY}px`;
                   bullet.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
                   bullet.style.animationDuration = `${time}s`;
                   bulletContainer.appendChild(bullet);
                   
                   // Animate bullet movement
                   const bulletAnimation = bullet.animate([
                       { left: `${sourceX}px`, top: `${sourceY}px` },
                       { left: `${targetX}px`, top: `${targetY}px` }
                   ], {
                       duration: time * 1000,
                       easing: 'linear',
                       fill: 'forwards'
                   });
                   
                   // Create smoke trail with delay
                   const createSmokeTrail = setInterval(() => {
                       const currentPos = bullet.getBoundingClientRect();
                       const smoke = document.createElement('div');
                       smoke.className = 'bullet-smoke';
                       smoke.style.position = 'fixed';
                       smoke.style.left = `${currentPos.left + currentPos.width / 2}px`;
                       smoke.style.top = `${currentPos.top + currentPos.height / 2}px`;
                       smoke.style.transform = 'translate(-50%, -50%)';
                       bulletContainer.appendChild(smoke);
                       
                       // Remove smoke after animation
                       setTimeout(() => smoke.remove(), 800);
                   }, 50);
                   
                   // Create impact when bullet reaches target
                   bulletAnimation.onfinish = () => {
                       clearInterval(createSmokeTrail);
                       bullet.remove();
                       
                       // Create impact effect
                       const impact = document.createElement('div');
                       impact.className = 'bullet-impact';
                       impact.style.position = 'fixed';
                       impact.style.left = `${targetX}px`;
                       impact.style.top = `${targetY}px`;
                       impact.style.transform = 'translate(-50%, -50%)';
                       bulletContainer.appendChild(impact);
                       
                       // Create impact particles
                       const particleCount = isCrit ? 8 : 5;
                       for (let j = 0; j < particleCount; j++) {
                           const particle = document.createElement('div');
                           particle.className = isCrit ? 'impact-particle critical' : 'impact-particle';
                           particle.style.position = 'fixed';
                           particle.style.left = `${targetX}px`;
                           particle.style.top = `${targetY}px`;
                           
                           // Random angle for particles
                           const particleAngle = Math.random() * 360;
                           const distance = 10 + Math.random() * 20;
                           
                           // Animate particle
                           particle.animate([
                               { 
                                   transform: `translate(-50%, -50%) rotate(${particleAngle}deg) translateX(0)`,
                                   opacity: 1
                               },
                               { 
                                   transform: `translate(-50%, -50%) rotate(${particleAngle}deg) translateX(${distance}px)`,
                                   opacity: 0
                               }
                           ], {
                               duration: 300,
                               easing: 'ease-out',
                               fill: 'forwards'
                           });
                           
                           bulletContainer.appendChild(particle);
                           
                           // Remove particle after animation
                           setTimeout(() => particle.remove(), 300);
                       }
                       
                       // Remove impact after animation
                       setTimeout(() => impact.remove(), 400);
                   };
               }, i * 50); // Stagger bullet firing
           }
           
           // Clean up
           setTimeout(() => {
               vfxContainer.remove();
               bulletContainer.remove();
               targetElement.dataset.bulletRainTarget = "false";
           }, 1500);
       }

       /**
        * Comprehensive quest progress tracking when game ends
        * Tracks multiple quest metrics based on battle statistics
        */
       async updateQuestProgressOnGameEnd(isVictory, isStoryMode = false) {
           try {
               console.log(`[GameManager] Updating quest progress on game end. Victory: ${isVictory}, Story Mode: ${isStoryMode}`);
               
               // Basic battle tracking
               window.questManager.updateQuestProgress('battlesPlayed', 1);
               if (isVictory) {
                   window.questManager.updateQuestProgress('battlesWon', 1);
               }
               
               // Story-specific tracking
               if (isStoryMode && isVictory) {
                   window.questManager.updateQuestProgress('storiesCompleted', 1);
               }
               
               // Get statistics from statistics manager if available
               if (window.statisticsManager) {
                   const matchStats = window.statisticsManager.matchStats;
                   const allCharacterStats = window.statisticsManager.getAllCharacterStats();
                   
                   // Track total damage dealt
                   if (matchStats.totalDamageDealt > 0) {
                       window.questManager.updateQuestProgress('totalDamageDealt', matchStats.totalDamageDealt);
                   }
                   
                   // Track total healing done
                   if (matchStats.totalHealingDone > 0) {
                       window.questManager.updateQuestProgress('totalHealingDone', matchStats.totalHealingDone);
                   }
                   
                   // Track abilities used (sum from all player characters)
                   if (allCharacterStats && allCharacterStats.length > 0) {
                       // Filter to get only player character stats (non-AI)
                       const playerStats = allCharacterStats.filter(stat => !stat.isAI);
                       
                       const totalAbilitiesUsed = playerStats.reduce((total, charStats) => {
                           return total + (charStats.abilitiesUsed || 0);
                       }, 0);
                       
                       if (totalAbilitiesUsed > 0) {
                           window.questManager.updateQuestProgress('abilitiesUsed', totalAbilitiesUsed);
                       }
                   }
               }
               
               // Track battle length (turns taken)
               if (this.gameState && this.gameState.turn > 0) {
                   // Note: We don't track individual turns here since that's done in endAITurn()
                   // But we could track long/short battles if needed
                   const battleLength = this.gameState.turn;
                   
                   // Track long battles (10+ turns)
                   if (battleLength >= 10) {
                       window.questManager.updateQuestProgress('longBattles', 1);
                   }
                   
                   // Track quick victories (5 turns or less)
                   if (isVictory && battleLength <= 5) {
                       window.questManager.updateQuestProgress('quickVictories', 1);
                   }
               }
               
               // Track character survival
               if (this.gameState && this.gameState.playerCharacters) {
                   const survivors = this.gameState.playerCharacters.filter(char => !char.isDead()).length;
                   const totalCharacters = this.gameState.playerCharacters.length;
                   
                   // Track perfect victories (no character deaths)
                   if (isVictory && survivors === totalCharacters) {
                       window.questManager.updateQuestProgress('perfectVictories', 1);
                   }
                   
                   // Track character deaths
                   const deaths = totalCharacters - survivors;
                   if (deaths > 0) {
                       window.questManager.updateQuestProgress('characterDeaths', deaths);
                   }
               }
               
               console.log(`[GameManager] Quest progress updated successfully`);
               
           } catch (error) {
               console.error('[GameManager] Error updating quest progress on game end:', error);
           }
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
                   
                   // Plan the action with delay for visualization (faster thinking)
                   await this.delay(400);
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
                   
                   // Add small delay between planning for each character (faster thinking)
                   await this.delay(200);
               }
               
               // Hide planning phase overlay
               this.gameManager.uiManager.showPlanningPhase(false);
               
               // Execute each planned action with delay between them
               for (const action of actions) {
                   await this.executeAction(action);
                   await this.delay(1500); // Longer delay between AI actions for better pacing
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
           // Check if Weekly Challenge AI should be used
           if (this.gameManager.isWeeklyChallengeMode && this.gameManager.weeklyChallengeAI) {
               console.log(`[AI Planner] Using Weekly Challenge AI for ${aiChar.name}`);
               return await this.gameManager.weeklyChallengeAI.planWeeklyChallengeAction(aiChar);
           }

           // SPECIAL AI BEHAVIOR FOR INFERNAL RAIDEN
           console.log(`[AI Planner Debug] Character ID: "${aiChar.id}", Name: "${aiChar.name}"`);
           if (aiChar.id === 'infernal_raiden' || aiChar.name === 'Infernal Raiden') {
               console.log(`[AI Planner] Using special Infernal Raiden AI for ${aiChar.name}`);
               return this.planInfernalRaidenAction(aiChar);
           }

                   // Fall back to standard AI planning
        console.log(`[AI Planner] Using standard AI for ${aiChar.name}`);

        // Get available abilities
        const availableAbilities = aiChar.abilities.filter(ability =>
            ability.currentCooldown <= 0 &&
            aiChar.stats.currentMana >= ability.manaCost &&
            !ability.isDisabled // Added check for disabled abilities
        );

        if (availableAbilities.length === 0) {
            console.log(`[AI Planner] ${aiChar.name} has no available abilities.`);
            return null; // No action possible
        }

        // Helper function to filter targetable characters considering enemy forced targeting
        const isTargetableByCharacter = (target, caster) => {
            if (target.isDead()) return false;
            if (target.isUntargetable && target.isUntargetable()) return false;
            
            // Check if this target is untargetable due to enemy forced targeting
            if (target.isUntargetableByEnemyForcing && target.isUntargetableByEnemyForcing()) {
                // The target is untargetable because an enemy is forcing targeting
                // This means we can only target allies/self for support abilities
                return false;
            }
            
            // Check for Heart Debuff forced targeting restrictions on the caster
            if (caster && caster.forcedTargeting && caster.forcedTargeting.type === 'heart_debuff') {
                const forcedCasterId = caster.forcedTargeting.casterId;
                
                // Allow self-targeting always
                if (target === caster) {
                    return true;
                }
                
                // Find the heart caster
                const allCharacters = [
                    ...this.gameManager.gameState.playerCharacters,
                    ...this.gameManager.gameState.aiCharacters
                ];
                const heartCaster = allCharacters.find(char => 
                    (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                );
                
                if (heartCaster) {
                    // Heart Debuff allows targeting:
                    // 1. The heart caster themselves (Elphelt)
                    // 2. The debuffed character's own allies (same team as debuffed character)
                    // 3. Self (handled above)
                    
                    const targetTeam = target.isAI ? 'ai' : 'player';
                    const debuffedCharacterTeam = caster.isAI ? 'ai' : 'player';
                    
                    const isTargetingHeartCaster = (target === heartCaster);
                    const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                    const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                    
                    console.log(`[AI Heart Debuff] ${caster.name} with heart debuff checking target ${target.name}. IsHeartCaster: ${isTargetingHeartCaster}, IsOwnAlly: ${isTargetingOwnAlly}, Valid: ${isValidHeartDebuffTarget}`);
                    
                    if (!isValidHeartDebuffTarget) {
                        console.log(`[AI Heart Debuff] Blocking target ${target.name} - not the heart caster or debuffed character's ally`);
                        return false; // Heart Debuff prevents targeting this character
                    }
                }
            }
            
            return true;
        };

        // Smart ability selection: Prioritize healing if allies need it
        const allPlayerChars = this.gameManager.gameState.playerCharacters.filter(c => isTargetableByCharacter(c, aiChar));
        const allAIChars = this.gameManager.gameState.aiCharacters.filter(c => isTargetableByCharacter(c, aiChar));
           
           // Check if any allies need healing (below 70% HP)
           const injuredAllies = allAIChars.filter(ally => ally !== aiChar && ally.stats.currentHp < ally.stats.maxHp * 0.7);
           const selfNeedsHealing = aiChar.stats.currentHp < aiChar.stats.maxHp * 0.5; // Self at 50% or below
           
           // Look for healing abilities that can target allies or self
           const healingAbilities = availableAbilities.filter(ability => 
               // Only classify as healing if the ability actually mentions healing in name/description or has heal type
               (ability.name && typeof ability.name === 'string' && ability.name.toLowerCase().includes('heal')) || 
               (ability.description && typeof ability.description === 'string' && ability.description.toLowerCase().includes('heal')) ||
               (ability.type === 'heal')
           );
           
           let selectedAbility = null;
           
           // Prioritize healing if someone needs it and we have healing abilities
           if ((injuredAllies.length > 0 || selfNeedsHealing) && healingAbilities.length > 0) {
               // Use healing ability with 80% chance if allies are injured
               if (Math.random() < 0.8) {
                   selectedAbility = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
                   console.log(`[AI Planner] ${aiChar.name} prioritizing healing ability: ${selectedAbility.name}`);
               }
           }
           
           // If no healing ability selected, pick randomly from all available
           if (!selectedAbility) {
               const randomIndex = Math.floor(Math.random() * availableAbilities.length);
               selectedAbility = availableAbilities[randomIndex];
               console.log(`[AI Planner] ${aiChar.name} randomly selected: ${selectedAbility.name}`);
           }

           // Try to plan the action - if it fails for healing, fallback to non-healing
           const result = this.gameManager.tryPlanAction(aiChar, selectedAbility, allPlayerChars, allAIChars, injuredAllies, selfNeedsHealing);
           if (result && result.error === 'No healing targets needed') {
               // Healing was selected but no targets need it - fallback to non-healing abilities
               console.log(`[AI Planner] ${aiChar.name} fallback: healing not needed, selecting non-healing ability`);
               const nonHealingAbilities = availableAbilities.filter(ability => {
                   // Exclude abilities that are specifically for healing
                   const isHealingAbility = (ability.name && ability.name.toLowerCase().includes('heal')) || 
                                           (ability.description && ability.description.toLowerCase().includes('heal')) ||
                                           (ability.type === 'heal');
                   
                   // Include buff/support abilities that target allies but aren't healing
                   const isBuffAbility = (ability.name && (ability.name.toLowerCase().includes('buff') || 
                                                          ability.name.toLowerCase().includes('pact') ||
                                                          ability.name.toLowerCase().includes('blessing') ||
                                                          ability.name.toLowerCase().includes('boost') ||
                                                          ability.name.toLowerCase().includes('enhance') ||
                                                          ability.name.toLowerCase().includes('powder'))) ||
                                         (ability.description && (ability.description.toLowerCase().includes('double') ||
                                                                 ability.description.toLowerCase().includes('increase') ||
                                                                 ability.description.toLowerCase().includes('buff') ||
                                                                 ability.description.toLowerCase().includes('empower') ||
                                                                 ability.description.toLowerCase().includes('reduce') ||
                                                                 ability.description.toLowerCase().includes('cooldown')));
                   
                   // Keep abilities that aren't healing, or are buff abilities targeting allies
                   return !isHealingAbility || isBuffAbility;
               });
               
               if (nonHealingAbilities.length > 0) {
                   selectedAbility = nonHealingAbilities[Math.floor(Math.random() * nonHealingAbilities.length)];
                   console.log(`[AI Planner] ${aiChar.name} fallback selected: ${selectedAbility.name}`);
                   return this.gameManager.tryPlanAction(aiChar, selectedAbility, allPlayerChars, allAIChars, injuredAllies, selfNeedsHealing);
               }
           }
           
           return result;
       }

           // Helper method to try planning an action with a specific ability
    planInfernalRaidenAction(aiChar) {
        // Helper function to filter targetable characters considering enemy forced targeting
        const isTargetableByCharacter = (target, caster) => {
            if (target.isDead()) return false;
            if (target.isUntargetable && target.isUntargetable()) return false;
            
            // Check if this target is untargetable due to enemy forced targeting
            if (target.isUntargetableByEnemyForcing && target.isUntargetableByEnemyForcing()) {
                // The target is untargetable because an enemy is forcing targeting
                // This means we can only target allies/self for support abilities
                return false;
            }
            
            // Check for Heart Debuff forced targeting restrictions on the caster
            if (caster && caster.forcedTargeting && caster.forcedTargeting.type === 'heart_debuff') {
                const forcedCasterId = caster.forcedTargeting.casterId;
                
                // Allow self-targeting always
                if (target === caster) {
                    return true;
                }
                
                // Find the heart caster
                const allCharacters = [
                    ...this.gameManager.gameState.playerCharacters,
                    ...this.gameManager.gameState.aiCharacters
                ];
                const heartCaster = allCharacters.find(char => 
                    (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                );
                
                if (heartCaster) {
                    // Heart Debuff allows targeting:
                    // 1. The heart caster themselves (Elphelt)
                    // 2. The debuffed character's own allies (same team as debuffed character)
                    // 3. Self (handled above)
                    
                    const targetTeam = target.isAI ? 'ai' : 'player';
                    const debuffedCharacterTeam = caster.isAI ? 'ai' : 'player';
                    
                    const isTargetingHeartCaster = (target === heartCaster);
                    const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                    const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                    
                    console.log(`[AI Heart Debuff] ${caster.name} with heart debuff checking target ${target.name}. IsHeartCaster: ${isTargetingHeartCaster}, IsOwnAlly: ${isTargetingOwnAlly}, Valid: ${isValidHeartDebuffTarget}`);
                    
                    if (!isValidHeartDebuffTarget) {
                        console.log(`[AI Heart Debuff] Blocking target ${target.name} - not the heart caster or debuffed character's ally`);
                        return false; // Heart Debuff prevents targeting this character
                    }
                }
            }
            
            return true;
        };
        
        const allPlayerChars = this.gameManager.gameState.playerCharacters.filter(c => isTargetableByCharacter(c, aiChar));
           
           // Get available abilities
           const availableAbilities = aiChar.abilities.filter(ability =>
               ability.currentCooldown <= 0 &&
               aiChar.stats.currentMana >= ability.manaCost &&
               !ability.isDisabled
           );
           
           // Find Q ability (Blazing Lightning Ball)
           const blazingLightningBall = availableAbilities.find(ability => 
               ability.id === 'blazing_lightning_ball' || ability.name.includes('Blazing Lightning Ball')
           );
           
           // Check if Raiden has already used Q this turn by checking cooldown
           // If Q is on cooldown and it was 1 turn cooldown originally, he must have used it this turn
           const hasAlreadyUsedQ = blazingLightningBall && blazingLightningBall.currentCooldown > 0;
           
           let selectedAbility = null;
           
           // Priority 1: Use Blazing Lightning Ball if available and hasn't been used this turn
           if (blazingLightningBall && !hasAlreadyUsedQ) {
               selectedAbility = blazingLightningBall;
               console.log(`[Infernal Raiden AI] Using Q ability first: ${selectedAbility.name}`);
           } 
           // Priority 2: Use any other available ability
           else {
               const otherAbilities = availableAbilities.filter(ability => 
                   ability.id !== 'blazing_lightning_ball' && !ability.name.includes('Blazing Lightning Ball')
               );
               
               if (otherAbilities.length > 0) {
                   // Smart selection for other abilities
                   // Prioritize high damage abilities when enemies are low HP
                   const lowHpEnemies = allPlayerChars.filter(enemy => 
                       enemy.stats.currentHp < enemy.stats.maxHp * 0.3
                   );
                   
                   if (lowHpEnemies.length > 0) {
                       // Look for high damage abilities to finish off low HP enemies
                       const damageAbilities = otherAbilities.filter(ability => 
                           ability.name.includes('Thunder') || 
                           ability.name.includes('Thunderstruck') ||
                           ability.description.includes('damage')
                       );
                       
                       if (damageAbilities.length > 0) {
                           selectedAbility = damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
                           console.log(`[Infernal Raiden AI] Using damage ability against low HP enemies: ${selectedAbility.name}`);
                       }
                   }
                   
                   // If no specific strategy, pick randomly from other abilities
                   if (!selectedAbility) {
                       selectedAbility = otherAbilities[Math.floor(Math.random() * otherAbilities.length)];
                       console.log(`[Infernal Raiden AI] Using random other ability: ${selectedAbility.name}`);
                   }
               }
           }
           
           if (!selectedAbility) {
               console.log(`[Infernal Raiden AI] No suitable ability found, falling back to normal AI`);
               return null; // Fall back to normal AI behavior
           }
           
           // Target selection logic
           let possibleTargets = [];
           
           switch (selectedAbility.targetType) {
               case 'enemy':
                   possibleTargets = allPlayerChars;
                   break;
               case 'self':
                   possibleTargets = [aiChar];
                   break;
               case 'all_enemies':
               case 'all':
                   possibleTargets = allPlayerChars;
                   break;
               default:
                   possibleTargets = allPlayerChars; // Default to enemies
                   break;
           }
           
           if (possibleTargets.length === 0) {
               console.log(`[Infernal Raiden AI] No valid targets for ${selectedAbility.name}`);
               return null;
           }
           
           let selectedTarget;
           
           // Smart target selection for Raiden
           if (selectedAbility.targetType === 'all_enemies' || selectedAbility.targetType === 'all') {
               selectedTarget = allPlayerChars; // AoE abilities target all
           } else {
               // For single target abilities, prioritize low HP enemies
               const sortedByHealth = possibleTargets.sort((a, b) => a.stats.currentHp - b.stats.currentHp);
               selectedTarget = sortedByHealth[0]; // Target lowest HP enemy
               console.log(`[Infernal Raiden AI] Targeting lowest HP enemy: ${selectedTarget.name} (${selectedTarget.stats.currentHp}/${selectedTarget.stats.maxHp} HP)`);
           }
           
           const targetName = Array.isArray(selectedTarget) ? `${selectedTarget.length} targets` : selectedTarget.name;
           console.log(`[Infernal Raiden AI] Planned action: ${selectedAbility.name} on ${targetName}`);
           
           return { ability: selectedAbility, target: selectedTarget };
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
                 this.gameManager.addLogEntry(`${caster.name}'s ${ability.name} is still on cooldown (${ability.cooldown} turns). Skipping action.`, 'enemy-turn');
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
            } else if (targetType === 'enemy' || targetType === 'single_enemy' || targetType === 'ally' || targetType === 'ally_or_self' || targetType === 'ally_or_enemy') {
                // Planned target was a single object
                const singleTarget = targetInfo;
                if (singleTarget && typeof singleTarget.isDead === 'function' && !singleTarget.isDead()) { // Added type check for isDead
                    finalTargetInfo = singleTarget;
                    
                    // --- NEW: Check for ability redirection (Furry Guardian talent) ---
                    if ((targetType === 'enemy' || targetType === 'single_enemy') && !Array.isArray(finalTargetInfo)) {
                        // Only check for redirection on enemy abilities targeting a single player character
                        const redirected = this.checkForAbilityRedirection(caster, ability, finalTargetInfo);
                        if (redirected) {
                            finalTargetInfo = redirected;
                        }
                    }
                    // --- END NEW ---
                } else {
                    // Attempt to find a new random target if the original is dead
                    console.log(`[AI Execute] Original target ${singleTarget?.name} invalid. Retargeting for ${ability.name}...`);
                    if (targetType === 'enemy' || targetType === 'single_enemy' || targetType === 'ally_or_enemy') {
                        const potentialEnemies = gameState.playerCharacters.filter(p => !p.isDead());
                        if (potentialEnemies.length > 0) finalTargetInfo = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
                        
                        // --- NEW: Check for ability redirection (Furry Guardian talent) ---
                        if (finalTargetInfo) {
                            const redirected = this.checkForAbilityRedirection(caster, ability, finalTargetInfo);
                            if (redirected) {
                                finalTargetInfo = redirected;
                            }
                        }
                        // --- END NEW ---
                    } else if (targetType === 'ally') {
                        const potentialAllies = gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                        if (potentialAllies.length > 0) finalTargetInfo = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                        else finalTargetInfo = caster; // Fallback to self if no allies
                    } else if (targetType === 'ally_or_self') {
                        // For ally_or_self, prioritize injured allies, then self
                        const potentialAllies = gameState.aiCharacters.filter(a => !a.isDead());
                        const injuredAllies = potentialAllies.filter(a => a.stats.currentHp < a.stats.maxHp * 0.8);
                        if (injuredAllies.length > 0) {
                            // Sort by health and pick the most injured
                            injuredAllies.sort((a, b) => (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp));
                            finalTargetInfo = injuredAllies[0];
                        } else if (potentialAllies.length > 0) {
                            finalTargetInfo = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                        } else {
                            finalTargetInfo = caster; // Last resort
                        }
                    }
                    if(finalTargetInfo) console.log(`[AI Execute] Re-targeted to ${finalTargetInfo.name}.`);
                }
            } else if (targetType === 'aoe_enemy' || targetType === 'all_enemies' || targetType === 'two_random_enemies' || targetType === 'three_random_enemies' || targetType === 'random_enemy') {
                // Re-fetch living enemies just before execution
                finalTargetInfo = this.gameManager.gameState.playerCharacters.filter(p => !p.isDead());
                console.log(`[AI Execute] Validating ${finalTargetInfo.length} living enemies for AoE.`);
            } else if (targetType === 'aoe_ally' || targetType === 'all_allies') {
                // Re-fetch living allies just before execution
                if (this.gameManager.gameState && this.gameManager.gameState.aiCharacters) {
                    finalTargetInfo = this.gameManager.gameState.aiCharacters.filter(a => !a.isDead());
                    console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies for AoE.`);
                } else {
                    console.error(`[AI Execute] gameState or aiCharacters is undefined for aoe_ally target type`);
                    finalTargetInfo = [];
                }
             } else if (targetType === 'all') {
                 // Re-fetch all living characters just before execution
                 if (this.gameManager.gameState && this.gameManager.gameState.playerCharacters && this.gameManager.gameState.aiCharacters) {
                     const livingEnemies = this.gameManager.gameState.playerCharacters.filter(p => !p.isDead());
                     const livingAllies = this.gameManager.gameState.aiCharacters.filter(a => !a.isDead());
                     finalTargetInfo = [...livingEnemies, ...livingAllies];
                     console.log(`[AI Execute] Validating ${finalTargetInfo.length} living characters for 'all'.`);
                 } else {
                     console.error(`[AI Execute] gameState or character arrays are undefined for 'all' target type`);
                     finalTargetInfo = [];
                 }
             } else if (targetType === 'all_allies_except_self') { // Added this case
                 // Re-fetch living allies excluding self just before execution
                 if (this.gameManager.gameState && this.gameManager.gameState.aiCharacters) {
                     finalTargetInfo = this.gameManager.gameState.aiCharacters.filter(a => !a.isDead() && a.instanceId !== caster.instanceId);
                     console.log(`[AI Execute] Validating ${finalTargetInfo.length} living allies (excluding self) for AoE buff.`);
                 } else {
                     console.error(`[AI Execute] gameState or aiCharacters is undefined for all_allies_except_self target type`);
                     finalTargetInfo = [];
                 }
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
                
                // DEBUG: Check if doesNotEndTurn property is now working
                console.log(`[AI Execute Debug] ${ability.name} doesNotEndTurn check:`, {
                    id: ability.id,
                    doesNotEndTurn: ability.doesNotEndTurn,
                    typeOfProperty: typeof ability.doesNotEndTurn,
                    strictEquals: ability.doesNotEndTurn === true,
                    looseEquals: ability.doesNotEndTurn == true
                });
                
                // CHECK FOR ABILITIES THAT DON'T END TURN
                if (ability.doesNotEndTurn === true) {
                    console.log(`[AI Execute] ${ability.name} doesn't end turn, planning second action for ${caster.name}`);
                    
                    // Add a small delay for visual clarity
                    await this.delay(500);
                    
                    // Plan and execute a second action immediately
                    const secondAction = await this.planAIAction(caster);
                    if (secondAction && secondAction.ability) {
                        console.log(`[AI Execute] Executing second action: ${secondAction.ability.name}`);
                        
                        // Create the action object format expected by executeAction
                        const casterIndex = this.gameManager.gameState.aiCharacters.indexOf(caster);
                        const abilityIndex = caster.abilities.indexOf(secondAction.ability);
                        
                        if (casterIndex !== -1 && abilityIndex !== -1) {
                            const secondActionData = {
                                casterIndex: casterIndex,
                                abilityIndex: abilityIndex,
                                target: secondAction.target
                            };
                            
                            // Recursively execute the second action
                            await this.executeAction(secondActionData);
                        } else {
                            console.warn(`[AI Execute] Could not find caster or ability indices for second action`);
                        }
                    } else {
                        console.log(`[AI Execute] No valid second action found for ${caster.name}`);
                    }
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

        // --- NEW: Method to check for ability redirection (Furry Guardian talent) ---
        checkForAbilityRedirection(caster, ability, target) {
            try {
                // Only player characters (heroes) can have abilities redirected to their allies
                if (!target || target.isAI || !this.gameManager.gameState) return null;
                
                // Get all player characters
                const playerCharacters = this.gameManager.gameState.playerCharacters;
                if (!playerCharacters || !Array.isArray(playerCharacters)) return null;
                
                // Find all Farmer Alice characters with the abilityRedirectionChance property
                const alicesWithRedirection = playerCharacters.filter(char => 
                    char && 
                    char.id === 'farmer_alice' && 
                    !char.isDead() && 
                    char !== target && // Can't redirect to the original target
                    char.abilityRedirectionChance && 
                    char.abilityRedirectionChance > 0
                );
                
                // If no Alices with redirection, return null (no redirection)
                if (!alicesWithRedirection.length) return null;
                
                // For each Alice, check if redirection happens
                for (const alice of alicesWithRedirection) {
                    if (Math.random() < alice.abilityRedirectionChance) {
                        console.log(`[Ability Redirection] ${alice.name}'s Furry Guardian redirects ${caster.name}'s ${ability.name} from ${target.name}`);
                        
                        // Trigger VFX for the redirection if the function is available in global scope
                        if (typeof window.showFurryGuardianVFX === 'function') {
                            window.showFurryGuardianVFX(alice, target, caster, ability);
                        }
                        
                        return alice; // Return Alice as the new target
                    }
                }
                
                return null; // No redirection occurred
            } catch (error) {
                console.error("[checkForAbilityRedirection] Error:", error);
                return null; // On error, don't redirect
            }
        }
        // --- END NEW ---
    }

    // UI Manager for handling game UI
    class UIManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
        }

        // Initialize UI manager
        initialize(setupEventHandlers = true) {
            console.log('[UIManager] Initializing...');
            
            // Setup auto-select button
            this.createAutoSelectButton();
            
            // Create the volume control
            this.gameManager.initializeVolumeControl();
            
            // Create character stats menu element
            this.createCharacterStatsMenu();
            
            if (setupEventHandlers) {
                this.setupEventHandlers();
            }
            
            console.log('[UIManager] Initialized successfully.');
        }

        // Add HP/Mana Bar Animation Methods
        triggerHPAnimation(character, changeType, amount = 0, isCritical = false) {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (!characterElement) return;

            const hpContainer = characterElement.querySelector('.bar-container');
            const hpText = characterElement.querySelector('.bar-text');
            
            // Remove any existing animation classes
            this.clearBarAnimations(hpContainer, hpText);
            
            // Add particles if significant change
            if (Math.abs(amount) > character.stats.maxHp * 0.1) {
                this.createHPParticles(characterElement, changeType, amount);
            }
            
            switch (changeType) {
                case 'damage':
                    if (isCritical) {
                        hpContainer.classList.add('hp-critical-damage');
                        hpText.classList.add('damage-text');
                        this.addScreenShake();
                    } else {
                        hpContainer.classList.add('hp-damage');
                        hpText.classList.add('damage-text');
                    }
                    break;
                    
                case 'healing':
                    if (isCritical) {
                        hpContainer.classList.add('hp-critical-healing');
                        hpText.classList.add('healing-text');
            } else {
                        hpContainer.classList.add('hp-healing');
                        hpText.classList.add('healing-text');
                    }
                    
                    // Add healing wave effect
                    const hpBar = characterElement.querySelector('.hp-bar');
                    hpBar.classList.add('hp-healing');
                    break;
                    
                case 'regeneration':
                    const regenBar = characterElement.querySelector('.hp-bar');
                    regenBar.classList.add('hp-regenerating');
                    break;
            }
            
            // Check for low HP warnings
            this.updateHPWarnings(character, characterElement);
            
            // Auto-remove animation classes
            setTimeout(() => {
                this.clearBarAnimations(hpContainer, hpText);
                const hpBar = characterElement.querySelector('.hp-bar');
                hpBar.classList.remove('hp-healing', 'hp-regenerating', 'hp-draining');
            }, 1500);
        }

        triggerManaAnimation(character, changeType, amount = 0) {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (!characterElement) return;

            const manaContainer = characterElement.querySelector('.bar-container:nth-child(2)'); // Second bar container
            const manaBar = characterElement.querySelector('.mana-bar');
            
            // Remove any existing animation classes
            this.clearManaAnimations(manaContainer, manaBar);
            
            switch (changeType) {
                case 'drain':
                    manaContainer.classList.add('mana-drain');
                    break;
                    
                case 'restore':
                    manaContainer.classList.add('mana-restore');
                    manaBar.classList.add('mana-restoring');
                    break;
                    
                case 'casting':
                    manaBar.classList.add('mana-casting');
                    break;
                    
                case 'empty':
                    manaContainer.classList.add('mana-empty');
                    break;
            }
            
            // Auto-remove animation classes
            setTimeout(() => {
                this.clearManaAnimations(manaContainer, manaBar);
            }, 1000);
        }

        triggerShieldAnimation(character, changeType) {
            const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
            if (!characterElement) return;

            const shieldBar = characterElement.querySelector('.shield-bar');
            if (!shieldBar) return;

            switch (changeType) {
                case 'damaged':
                    shieldBar.classList.remove('shield-damaged');
                    // Force reflow to restart animation
                    shieldBar.offsetHeight;
                    shieldBar.classList.add('shield-damaged');
                    
                    setTimeout(() => {
                        shieldBar.classList.remove('shield-damaged');
                    }, 500);
                    break;
                    
                case 'broken':
                    shieldBar.classList.add('shield-broken');
                    setTimeout(() => {
                        shieldBar.remove();
                    }, 1000);
                    break;
            }
        }

        createHPParticles(characterElement, changeType, amount) {
            const particlesContainer = document.createElement('div');
            particlesContainer.className = 'hp-particles';
            characterElement.appendChild(particlesContainer);
            
            const particleCount = Math.min(8, Math.max(3, Math.abs(amount) / 100));
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = `hp-particle ${changeType}`;
                
                // Random positions and directions
                const randomX = (Math.random() - 0.5) * 60;
                const randomY = (Math.random() - 0.5) * 40;
                
                particle.style.setProperty('--random-x', `${randomX}px`);
                particle.style.setProperty('--random-y', `${randomY}px`);
                particle.style.left = `${Math.random() * 80 + 10}%`;
                particle.style.top = `${Math.random() * 60 + 20}%`;
                
                particlesContainer.appendChild(particle);
            }
            
            // Remove particles after animation
            setTimeout(() => {
                particlesContainer.remove();
            }, 1000);
        }

        updateHPWarnings(character, characterElement) {
            const hpContainer = characterElement.querySelector('.bar-container');
            const hpPercentage = character.stats.currentHp / character.stats.maxHp;
            
            // Remove existing warning classes
            hpContainer.classList.remove('hp-low', 'hp-very-low');
            
            if (hpPercentage <= 0.15) {
                hpContainer.classList.add('hp-very-low');
            } else if (hpPercentage <= 0.3) {
                hpContainer.classList.add('hp-low');
            }
        }

        clearBarAnimations(container, text) {
            if (container) {
                container.classList.remove('hp-damage', 'hp-critical-damage', 'hp-healing', 'hp-critical-healing');
            }
            if (text) {
                text.classList.remove('damage-text', 'healing-text');
            }
        }

        clearManaAnimations(container, bar) {
            if (container) {
                container.classList.remove('mana-drain', 'mana-restore', 'mana-empty');
            }
            if (bar) {
                bar.classList.remove('mana-casting', 'mana-restoring');
            }
        }

        addScreenShake() {
            const battleContainer = document.querySelector('.battle-container');
            if (battleContainer) {
                battleContainer.classList.add('screen-shake');
                setTimeout(() => {
                    battleContainer.classList.remove('screen-shake');
                }, 600);
            }
        }

        // Create character stats menu element
        createCharacterStatsMenu() {
            // Create the character stats menu element if it doesn't exist
            if (!this.characterStatsMenu) {
                this.characterStatsMenu = document.createElement('div');
                this.characterStatsMenu.id = 'character-stats-menu';
                this.characterStatsMenu.className = 'character-stats-menu';
                this.characterStatsMenu.style.position = 'absolute';
                this.characterStatsMenu.style.display = 'none';
                this.characterStatsMenu.style.zIndex = '10000';
                
                // Add close on click outside functionality
                document.addEventListener('click', (e) => {
                    if (this.characterStatsMenu && 
                        this.characterStatsMenu.style.display === 'block' && 
                        !this.characterStatsMenu.contains(e.target)) {
                        this.characterStatsMenu.style.display = 'none';
                    }
                });
                
                // Append to body
                document.body.appendChild(this.characterStatsMenu);
                
                console.log('[UIManager] Character stats menu created successfully.');
            }
        }

        // Set up event handlers for UI elements
        setupEventHandlers() {
            // Add event listener for Zoey talents updates
            document.addEventListener('zoey_talents_applied', (event) => {
                const character = event.detail.character;
                if (character && this.gameManager.gameState) {
                    console.log(`[UIManager] Zoey talents applied, updating UI for ${character.name}`);
                    this.updateCharacterUI(character);
                }
            });
            
            // Event delegation for player characters
            document.getElementById('player-characters-container').addEventListener('click', (e) => {
                const charElement = this.findCharacterElement(e.target);
                if (charElement) {
                    // CRITICAL FIX: Check if an ability was clicked first to prevent race condition
                    const abilityElement = e.target.closest('.ability');
                    if (abilityElement) {
                        // Handle ability click - this will auto-select the character and then the ability
                        const abilityIndex = parseInt(abilityElement.dataset.index);
                        const instanceId = charElement.dataset.instanceId; 
                        if (this.gameManager.gameState && this.gameManager.gameState.playerCharacters) {
                            const character = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === instanceId);
                            
                            if (character && !isNaN(abilityIndex) && abilityIndex >= 0) {
                                console.log(`[DEBUG] Ability clicked: ${character.name} ability ${abilityIndex}`);
                                
                                // First, auto-select the character who owns this ability
                                const characterSelected = this.gameManager.selectCharacter(character);
                                
                                if (characterSelected) {
                                    // Then select the ability
                                    this.gameManager.selectAbility(character, abilityIndex);
                                }
                            }
                        } else {
                            console.error('Game state or player characters not available');
                        }
                        // IMPORTANT: Return early to prevent character targeting logic from running
                        return;
                    }
                    
                    // Handle character click (only if no ability was clicked)
                    const instanceId = charElement.dataset.instanceId; 
                    // Find character by instanceId - add null check for gameState and playerCharacters
                    if (this.gameManager.gameState && this.gameManager.gameState.playerCharacters) {
                        const character = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === instanceId);
                        if (character) {
                            // Check if we're in targeting mode
                            if (this.gameManager.gameState.selectedCharacter && this.gameManager.gameState.selectedAbility) {
                                console.log(`[DEBUG] Character clicked for targeting: ${character.name}`);
                                // If a character and ability are already selected, this is a targeting action
                                this.gameManager.targetCharacter(character);
                            } else {
                                console.log(`[DEBUG] Character clicked for selection: ${character.name}`);
                                // Otherwise it's a character selection
                                this.gameManager.selectCharacter(character);
                            }
                        }
                    } else {
                        console.error('Game state or player characters not available');
                    }
                }
            });
            
            // Event delegation for AI characters (for targeting)
            document.getElementById('ai-characters-container').addEventListener('click', (e) => {
                const charElement = this.findCharacterElement(e.target);
                if (charElement) {
                    // Use the unique instanceId stored in the dataset
                    const instanceId = charElement.dataset.instanceId;
                    // Find character by instanceId - add null check for gameState and aiCharacters
                    if (this.gameManager.gameState && this.gameManager.gameState.aiCharacters) {
                        const character = this.gameManager.gameState.aiCharacters.find(c => c.instanceId === instanceId);
                        if (character) {
                            this.gameManager.targetCharacter(character);
                        } else {
                            console.error(`Could not find AI character with instanceId: ${instanceId}`);
                            // Fallback or further debugging needed
                        }
                    } else {
                        console.error('Game state or AI characters not available');
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
                    if (ability.isDisabled) {
                        abilityElement.classList.add('disabled');
                        // If ability was disabled by a specific talent, add special styling
                        if (ability.disabledByTalent) {
                            abilityElement.classList.add('disabled-by-talent');
                            abilityElement.setAttribute('data-talent-source', ability.disabledByTalent);
                        }
                    }
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
                        
                        // Calculate actual mana cost considering atlantean blessing
                        let actualManaCost = ability.manaCost;
                        if (character.atlanteanBlessings && character.atlanteanBlessings.mana_efficiency && !character.isAI) {
                            actualManaCost = Math.ceil(ability.manaCost * 0.5); // 50% reduction
                        }
                        
                        // Show reduced cost if different from base cost
                        if (actualManaCost !== ability.manaCost) {
                            manaCostDiv.innerHTML = `<span style="color: #ffffff; font-weight: bold;">${actualManaCost}</span>`;
                        } else {
                            manaCostDiv.textContent = ability.manaCost;
                        }
                        
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
            charDiv.className = 'character character-slot';
            // Store the unique instanceId in a data attribute for easy retrieval
            charDiv.dataset.instanceId = elementId; 
            if (isAI) {
                charDiv.classList.add('ai-character');
            }
            
            // Character image with buff/debuff containers
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            
            const image = document.createElement('img');
            // Use skin system for image path
            const imageSource = this.gameManager.getCharacterImagePath(character.id) || character.image;
            image.src = imageSource;
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
            
            // Character name and level removed from display but data still available for statistics
            
            // HP bar
            const hpContainer = document.createElement('div');
            hpContainer.className = 'bar-container';
            hpContainer.setAttribute('data-tutorial-target', 'character-hp');
            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            hpBar.style.width = `${(character.stats.currentHp / character.stats.maxHp) * 100}%`;
            
            // Shield bar - always create for all characters
            const shieldBar = document.createElement('div');
            shieldBar.className = 'shield-bar';
            shieldBar.style.width = '0%';
            shieldBar.style.display = 'none'; // Initially hidden
            
            const hpText = document.createElement('div');
            hpText.className = 'bar-text';
            hpText.textContent = `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)}`;
            
            hpContainer.appendChild(hpBar);
            hpContainer.appendChild(shieldBar);
            hpContainer.appendChild(hpText);
            
            // Mana bar
            const manaContainer = document.createElement('div');
            manaContainer.className = 'bar-container';
            const manaBar = document.createElement('div');
            manaBar.className = 'mana-bar';
            manaBar.style.width = `${(character.stats.currentMana / character.stats.maxMana) * 100}%`;
            const manaText = document.createElement('div');
            manaText.className = 'bar-text';
            manaText.textContent = `${Math.round(character.stats.currentMana)} / ${Math.round(character.stats.maxMana)}`;
            manaContainer.appendChild(manaBar);
            manaContainer.appendChild(manaText);
            
            // Ability slots
            const abilitiesDiv = document.createElement('div');
            abilitiesDiv.className = 'abilities';
            
            // Create ability elements
            this.createAbilityElements(character, abilitiesDiv, isAI);
            
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
            
            // --- NEW: Handle Desperate Strength visual state ---
            // Use the hasDesperateStrength method if it exists, or check buffs directly
            const hasDesperateStrength = typeof character.hasDesperateStrength === 'function' 
                ? character.hasDesperateStrength() 
                : character.buffs && character.buffs.some(buff => buff.id === 'desperate_strength_buff');
                
            if (hasDesperateStrength) {
                charElement.setAttribute('data-desperate-strength', 'true');
            } else {
                charElement.removeAttribute('data-desperate-strength');
            }
            // --- END NEW ---
            
            // Store previous values for animation triggers
            const previousHP = character._previousHP || character.stats.currentHp;
            const previousMana = character._previousMana || character.stats.currentMana;
            
            // Update HP bar
            const hpBar = charElement.querySelector('.hp-bar');
            hpBar.style.width = `${(character.stats.currentHp / character.stats.maxHp) * 100}%`;
            
            // Update HP text
            const hpText = charElement.querySelector('.hp-bar').parentElement.querySelector('.bar-text');
            
            // Trigger HP animations based on changes
            if (previousHP !== character.stats.currentHp) {
                const hpChange = character.stats.currentHp - previousHP;
                if (hpChange < 0) {
                    // HP decreased (damage)
                    this.triggerHPAnimation(character, 'damage', Math.abs(hpChange), character._lastDamageWasCritical || false);
                } else if (hpChange > 0) {
                    // HP increased (healing)
                    this.triggerHPAnimation(character, 'healing', hpChange, character._lastHealWasCritical || false);
                }
                character._previousHP = character.stats.currentHp;
            }
            
            // Update HP warnings continuously
            this.updateHPWarnings(character, charElement);
            
            // NEW: Update Shield bar
            const hpBarContainer = charElement.querySelector('.hp-bar').parentElement;
            let shieldBar = hpBarContainer.querySelector('.shield-bar');
            
            if (character.shield > 0) {
                // Create shield bar if it doesn't exist
                if (!shieldBar) {
                    shieldBar = document.createElement('div');
                    shieldBar.className = 'shield-bar';
                    hpBarContainer.insertBefore(shieldBar, hpText); // Insert before text element
                }
                
                // Calculate shield bar width - shield extends beyond the HP, so we need to show the total
                const totalHP = character.stats.maxHp;
                const shieldPercentage = Math.min(100, (character.shield / totalHP) * 100);
                shieldBar.style.width = `${shieldPercentage}%`;
                
                // Update HP bar text to include shield
                hpText.textContent = `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)} (${Math.round(character.shield)} shield)`;
                shieldBar.style.display = 'block'; // Show shield bar
            } else {
                // Remove shield bar if no shield
                if (shieldBar) {
                    shieldBar.style.display = 'none'; // Hide shield bar
                }
                // Reset HP bar text to normal
                hpText.textContent = `${Math.round(character.stats.currentHp)} / ${Math.round(character.stats.maxHp)}`;
            }
            
            // Update Mana bar
            const manaBar = charElement.querySelector('.mana-bar');
            manaBar.style.width = `${(character.stats.currentMana / character.stats.maxMana) * 100}%`;
            
            // Update Mana text
            const manaText = charElement.querySelector('.mana-bar').parentElement.querySelector('.bar-text');
            manaText.textContent = `${Math.round(character.stats.currentMana)} / ${Math.round(character.stats.maxMana)}`;
            
            // Trigger Mana animations based on changes
            if (previousMana !== character.stats.currentMana) {
                const manaChange = character.stats.currentMana - previousMana;
                if (manaChange < 0) {
                    // Mana decreased (drain/casting)
                    this.triggerManaAnimation(character, 'drain', Math.abs(manaChange));
                } else if (manaChange > 0) {
                    // Mana increased (restore)
                    this.triggerManaAnimation(character, 'restore', manaChange);
                }
                character._previousMana = character.stats.currentMana;
            }
            
            // Check for empty mana
            if (character.stats.currentMana === 0) {
                this.triggerManaAnimation(character, 'empty');
            }
            
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
                // Set data-turns attribute for CSS targeting
                durationElement.setAttribute('data-turns', buff.duration);
                
                // Add updated class for animation if turns changed
                if (buff.durationChanged) {
                    durationElement.classList.add('updated');
                    // Remove the class after animation completes
                    setTimeout(() => {
                        durationElement.classList.remove('updated');
                    }, 600);
                    // Clear the flag
                    buff.durationChanged = false;
                }
                
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
                // Set data-turns attribute for CSS targeting
                durationElement.setAttribute('data-turns', debuff.duration);
                
                // Add updated class for animation if turns changed
                if (debuff.durationChanged) {
                    durationElement.classList.add('updated');
                    // Remove the class after animation completes
                    setTimeout(() => {
                        durationElement.classList.remove('updated');
                    }, 600);
                    // Clear the flag
                    debuff.durationChanged = false;
                }
                
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
                    // Use the passive handler's damagePerBuff property (can be modified by talents)
                    const damagePerBuff = character.passiveHandler?.damagePerBuff || character.passiveHandler?.bonusPerBuff || 125;
                    const bonusDamage = buffCount * damagePerBuff;
                    
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
                    let tooltipText = `Buff Connoisseur: +${bonusDamage} Physical Damage from ${buffCount} active buff${buffCount > 1 ? 's' : ''} (${damagePerBuff} per buff)`;
                    
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
            
            // Apply or remove imprisoned visual effect based on whether the character is imprisoned
            const imprisonDebuff = character.debuffs.find(debuff => 
                debuff && debuff.id === 'kroudin_imprison'
            );
            
            if (imprisonDebuff) {
                if (!charElement.classList.contains('imprisoned')) {
                    charElement.classList.add('imprisoned');
                    
                    // Get the image container to add the prison effect
                    const imageContainer = charElement.querySelector('.image-container');
                    
                    // Remove any existing prison effects first
                    const existingPrisonEffect = imageContainer.querySelector('.prison-effect');
                    if (existingPrisonEffect) {
                        existingPrisonEffect.remove();
                    }
                    
                    // Create prison effect (persistent chains and cage)
                    const prisonEffect = document.createElement('div');
                    prisonEffect.className = 'kroudin-imprison-prison';
                    
                    // Add spectral chains around target
                    for (let i = 0; i < 12; i++) {
                        const prisonChain = document.createElement('div');
                        prisonChain.className = 'kroudin-imprison-prison-chain';
                        prisonChain.style.setProperty('--prison-chain-index', i);
                        prisonEffect.appendChild(prisonChain);
                    }

                    // Add dark energy cage
                    const cage = document.createElement('div');
                    cage.className = 'kroudin-imprison-cage';
                    prisonEffect.appendChild(cage);
                    
                    // Add to the image container
                    imageContainer.appendChild(prisonEffect);
                }
            } else {
                if (charElement.classList.contains('imprisoned')) {
                    charElement.classList.remove('imprisoned');
                    
                    // Remove prison effects
                    const imageContainer = charElement.querySelector('.image-container');
                    const prisonEffect = imageContainer.querySelector('.kroudin-imprison-prison');
                    if (prisonEffect) {
                        prisonEffect.remove();
                    }
                }
            }
            
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
            
            // Use dynamic targetType if available
            if (selectedAbility && typeof selectedAbility.getTargetType === 'function') {
                targetType = selectedAbility.getTargetType();
                console.log(`[UI] Using dynamic targetType: ${targetType} for ability ${selectedAbility.id}`);
            }
            
            const isPlayerCaster = !selectedChar.isAI;
            
            // Helper function to check if a character element represents a valid target
            const isValidTarget = (characterElement) => {
                const characterId = characterElement.dataset.characterId || characterElement.id.replace('character-', '');
                const character = this.gameManager.gameState.playerCharacters.concat(this.gameManager.gameState.aiCharacters)
                    .find(c => (c.instanceId || c.id) === characterId);
                
                if (!character) return false;
                if (character.isDead()) return false;
                if (character.isUntargetable && character.isUntargetable()) return false;
                if (character.isUntargetableByEnemyForcing && character.isUntargetableByEnemyForcing()) return false;
                
                // Check for Heart Debuff forced targeting restrictions on the caster
                if (selectedChar && selectedChar.forcedTargeting && selectedChar.forcedTargeting.type === 'heart_debuff') {
                    const forcedCasterId = selectedChar.forcedTargeting.casterId;
                    console.log(`[Heart Debuff UI] ${selectedChar.name} has heart debuff, checking target ${character.name}...`);
                    
                    // Allow self-targeting always
                    if (character === selectedChar) {
                        console.log(`[Heart Debuff UI] Allowing self-targeting for ${selectedChar.name}`);
                        return true;
                    }
                    
                    // Find the heart caster
                    const allCharacters = [
                        ...this.gameManager.gameState.playerCharacters,
                        ...this.gameManager.gameState.aiCharacters
                    ];
                    const heartCaster = allCharacters.find(char => 
                        (char.instanceId || char.id) === forcedCasterId && !char.isDead()
                    );
                    
                    if (heartCaster) {
                        // Heart Debuff allows targeting:
                        // 1. The heart caster themselves (Elphelt)
                        // 2. The debuffed character's own allies (same team as debuffed character)
                        // 3. Self (handled above)
                        
                        const targetTeam = character.isAI ? 'ai' : 'player';
                        const debuffedCharacterTeam = selectedChar.isAI ? 'ai' : 'player';
                        
                        const isTargetingHeartCaster = (character === heartCaster);
                        const isTargetingOwnAlly = (targetTeam === debuffedCharacterTeam);
                        const isValidHeartDebuffTarget = isTargetingHeartCaster || isTargetingOwnAlly;
                        
                        console.log(`[Heart Debuff UI] Target ${character.name} (${targetTeam}), Debuffed ${selectedChar.name} (${debuffedCharacterTeam}), Heart Caster ${heartCaster.name}. IsHeartCaster: ${isTargetingHeartCaster}, IsOwnAlly: ${isTargetingOwnAlly}, Valid: ${isValidHeartDebuffTarget}`);
                        
                        if (!isValidHeartDebuffTarget) {
                            console.log(`[Heart Debuff UI] Blocking target ${character.name} - not the heart caster or debuffed character's ally`);
                            return false; // Heart Debuff prevents targeting this character
                        }
                    }
                }
                
                return true;
            };
            
            // Remove targeting message logs
            
            switch (targetType) {
                case 'enemy':
                    if (isPlayerCaster) {
                        aiChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        playerChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                    } else {
                        playerChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
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
                        playerChars.forEach((el) => {
                            if (!el.classList.contains('selected') && isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           } else {
                        aiChars.forEach((el) => {
                            if (!el.classList.contains('selected') && isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           }
                           break;
                    
                case 'ally_except_self':
                    if (isPlayerCaster) {
                        playerChars.forEach((el) => {
                            if (!el.classList.contains('selected') && isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    } else {
                        aiChars.forEach((el) => {
                            if (!el.classList.contains('selected') && isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    }
                    break;
                    
                case 'enemy_or_ally_except_self':
                    // For abilities that can target both allies and enemies but not self (like Love Bullet with Healing Shot)
                    document.querySelectorAll('.character-slot').forEach((el) => {
                        if (!el.classList.contains('selected') && isValidTarget(el)) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        } else {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
                    });
                    break;
                    
                case 'ally_or_self':
                    if (isPlayerCaster) {
                        playerChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                           } else {
                        aiChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
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
                    if (selected && isValidTarget(selected)) {
                        selected.classList.add('valid-target');
                        selected.style.cursor = 'pointer';
                    } else if (selected) {
                        selected.classList.add('invalid-target');
                        selected.style.cursor = 'not-allowed';
                    }
                    break;
                    
                case 'any':
                    document.querySelectorAll('.character-slot').forEach((el) => {
                        if (isValidTarget(el)) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        } else {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
                    });
                    break;
                    
                case 'any_except_self':
                    // New case for Bunny Bounce ability
                    document.querySelectorAll('.character-slot').forEach((el) => {
                        if (!el.classList.contains('selected') && isValidTarget(el)) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        } else {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
                    });
                    break;
                    
                // For AOE abilities, we'll still need target selection to trigger the ability
                case 'all_enemies':
                    if (isPlayerCaster) {
                        aiChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        playerChars.forEach(function(el) {
                            if (!el.classList.contains('selected')) {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                    } else {
                        playerChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
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
                        playerChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        aiChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    } else {
                        aiChars.forEach((el) => {
                            if (isValidTarget(el)) {
                                el.classList.add('valid-target');
                                el.classList.add('aoe-target');
                                el.style.cursor = 'pointer';
                            } else {
                                el.classList.add('invalid-target');
                                el.style.cursor = 'not-allowed';
                            }
                        });
                        playerChars.forEach(function(el) {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        });
                    }
                    break;
                    
                case 'all':
                    document.querySelectorAll('.character-slot').forEach((el) => {
                        if (isValidTarget(el)) {
                            el.classList.add('valid-target');
                            el.classList.add('aoe-target');
                            el.style.cursor = 'pointer';
                        } else {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
                    });
                    break;
                    
                case 'ally_or_enemy':
                    // For abilities that can target both allies and enemies (like Love Bullet with Healing Shot)
                    document.querySelectorAll('.character-slot').forEach((el) => {
                        if (isValidTarget(el)) {
                            el.classList.add('valid-target');
                            el.style.cursor = 'pointer';
                        } else {
                            el.classList.add('invalid-target');
                            el.style.cursor = 'not-allowed';
                        }
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
            console.log(`[UIManager] Adding log entry: ${message} (class: ${className})`); // Debug log
            
            // Use the global addBattleLogMessage function if available
            if (window.addBattleLogMessage) {
                window.addBattleLogMessage(message, className);
                return;
            }
            
            // Use the GameManager's addLogEntry to avoid duplication
            if (this.gameManager && this.gameManager.addLogEntry) {
                this.gameManager.addLogEntry(message, className);
                return;
            }
            
            // Fallback implementation if neither is available
            console.warn('[UIManager] No battle log method available, using direct fallback');
            
            const logElement = document.getElementById('battle-log');
            if (!logElement) {
                console.warn('[UIManager] Battle log element not found! Message:', message);
                return;
            }
            
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

        // Add level and XP information
        const levelXPSection = document.createElement('div');
        levelXPSection.classList.add('stats-menu-section', 'level-xp-section');
        
        const levelDiv = document.createElement('div');
        levelDiv.classList.add('character-level-info');
        levelDiv.textContent = `Level ${character.level || 1}`;
        levelXPSection.appendChild(levelDiv);
        
        // Add XP progress information
        if (character.getXPProgress) {
            const xpProgress = character.getXPProgress();
            const xpDiv = document.createElement('div');
            xpDiv.classList.add('character-xp-info');
            xpDiv.textContent = `XP: ${xpProgress.progressXP} / ${xpProgress.progressNeeded} (${Math.floor(xpProgress.progressPercentage)}%)`;
            levelXPSection.appendChild(xpDiv);
            
            // Add XP progress bar
            const xpBarContainer = document.createElement('div');
            xpBarContainer.classList.add('xp-bar-container');
            
            const xpBar = document.createElement('div');
            xpBar.classList.add('xp-bar');
            xpBar.style.width = `${xpProgress.progressPercentage}%`;
            
            xpBarContainer.appendChild(xpBar);
            levelXPSection.appendChild(xpBarContainer);
            
            const totalXPDiv = document.createElement('div');
            totalXPDiv.classList.add('character-total-xp');
            totalXPDiv.textContent = `Total XP: ${character.experience || 0}`;
            levelXPSection.appendChild(totalXPDiv);
        }
        
        this.characterStatsMenu.appendChild(levelXPSection);

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
                
                // Add ability description - USE GENERATED DESCRIPTION
                if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription(); // Ensure description is up-to-date
                }
                const abilityDescription = document.createElement('div');
                abilityDescription.classList.add('ability-description');
                abilityDescription.innerHTML = ability.description || 'No description available.'; // Use innerHTML
                abilityItem.appendChild(abilityDescription);
                
                // Add ability details (cost, cooldown)
                const abilityDetails = document.createElement('div');
                abilityDetails.classList.add('ability-details');
                
                if (ability.manaCost !== undefined) {
                    const manaCost = document.createElement('span');
                    
                    // Calculate actual mana cost considering atlantean blessing
                    let actualManaCost = ability.manaCost;
                    if (character.atlanteanBlessings && character.atlanteanBlessings.mana_efficiency && !character.isAI) {
                        actualManaCost = Math.ceil(ability.manaCost * 0.5); // 50% reduction
                    }
                    
                    // Show reduced cost if different from base cost
                    if (actualManaCost !== ability.manaCost) {
                        manaCost.innerHTML = `Mana: <span style="text-decoration: line-through; color: #888;">${ability.manaCost}</span> <span style="color: #3498db; font-weight: bold;">${actualManaCost}</span>`;
                    } else {
                        manaCost.textContent = `Mana: ${ability.manaCost}`;
                    }
                    
                    manaCost.classList.add('ability-mana-cost');
                    abilityDetails.appendChild(manaCost);
                }
                
                if (ability.cooldown !== undefined) {
                    const cooldown = document.createElement('span');
                    // Read CURRENT cooldown from the instance
                    const currentCooldown = ability.currentCooldown || 0;
                    let maxCooldown = ability.cooldown || 0; // Base cooldown
                    
                    // --- NEW: Apply Atlantean Swiftness blessing to displayed cooldown ---
                    if (character.atlanteanBlessings && character.atlanteanBlessings.swiftness && index === 0 && !character.isAI) {
                        maxCooldown = Math.max(0, maxCooldown - 1); // Reduce Q ability cooldown by 1 for display
                    }
                    // --- END NEW ---
                    
                    cooldown.textContent = maxCooldown > 0 ? `Cooldown: ${maxCooldown} turn${maxCooldown !== 1 ? 's' : ''}` : 'No cooldown';
                    cooldown.classList.add('ability-cooldown-info');
                    
                    // If ability is on cooldown, show current cooldown
                    if (currentCooldown > 0) {
                        cooldown.textContent += ` (${currentCooldown} turn${currentCooldown !== 1 ? 's' : ''} left)`;
                        cooldown.classList.add('on-cooldown');
                    }
                    
                    abilityDetails.appendChild(cooldown);
                }
                
                // Add ability keybind
                const keybinds = ['Q', 'W', 'E', 'R'];
                if (index < keybinds.length && !character.isAI) { // Only show for player
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
            
            // --- ADDED: Show passive icon if available --- 
            if (character.passive.icon) {
                const passiveIcon = document.createElement('img');
                passiveIcon.classList.add('ability-icon-small'); // Use ability icon style
                passiveIcon.src = character.passive.icon;
                passiveIcon.alt = character.passive.name;
                passiveHeaderDiv.appendChild(passiveIcon);
            }
            // --- END ADDED --- 
            
            const passiveName = document.createElement('span');
            passiveName.classList.add('passive-name');
            passiveName.textContent = character.passive.name;
            passiveHeaderDiv.appendChild(passiveName);
            
            passiveItem.appendChild(passiveHeaderDiv);
            
            // Add passive description - USE UPDATED DESCRIPTION FROM HANDLER
            const passiveDescription = document.createElement('div');
            passiveDescription.classList.add('passive-description');
            
            // Add special class for Siegfried's passive to enable enhanced styling
            if (character.id === 'schoolboy_siegfried') {
                passiveDescription.classList.add('siegfried-passive');
            }
            
            let currentPassiveDesc = character.passive.description;
            // If passive handler exists and has an updated description, use that
            if (character.passiveHandler && typeof character.passiveHandler.description === 'string') {
                currentPassiveDesc = character.passiveHandler.description;
            } 
            // Ensure passive description from character data is updated based on talents
            else if (character.id === 'bridget' && typeof character.updatePassiveDescription === 'function') {
                 character.updatePassiveDescription(); // Ensure description reflects talents
                 currentPassiveDesc = character.passive.description;
            }
            // Update Elphelt's passive description for talents
            else if (character.id === 'schoolgirl_elphelt' && typeof window.updateElpheltPassiveDescriptionForTalents === 'function') {
                currentPassiveDesc = window.updateElpheltPassiveDescriptionForTalents(character);
                // Also update the character's passive object
                if (character.passive) {
                    character.passive.description = currentPassiveDesc;
                }
                console.log(`[UIManager] Updated Elphelt passive description for talents: ${currentPassiveDesc}`);
            }
            
            // Use innerHTML to render potential talent spans
            passiveDescription.innerHTML = currentPassiveDesc.replace(/\n/g, '<br>') || 'No description available.';
            passiveItem.appendChild(passiveDescription);
            
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
        
        // Highlight 1 turn left with special styling
        if (statusEffect.duration === 1) {
            turns.classList.add('last-turn');
            turns.textContent = `FINAL TURN`;
        } else if (statusEffect.duration === -1) {
            turns.textContent = `PERMANENT`;
        } else {
            turns.textContent = `${statusEffect.duration} turn${statusEffect.duration !== 1 ? 's' : ''}`;
        }
        
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
        
        // Add source if available
        if (statusEffect.source) {
            const source = document.createElement('div');
            source.className = 'status-tooltip-source';
            source.textContent = `Source: ${statusEffect.source}`;
            tooltip.appendChild(source);
        }
        
        // Add to DOM to get dimensions
        tooltip.style.visibility = 'hidden';
        document.body.appendChild(tooltip);
        
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Calculate position
        let left = rect.right + 10;
        let top = rect.top;
        
        // Adjust if tooltip would go off screen
        if (left + tooltipRect.width > window.innerWidth) {
            left = rect.left - tooltipRect.width - 10;
        }
        
        if (top + tooltipRect.height > window.innerHeight) {
            top = window.innerHeight - tooltipRect.height - 10;
        }
        
        // Position and show tooltip
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.visibility = 'visible';
        tooltip.classList.add('visible');
        
        // Store reference to tooltip
        this.statusTooltip = tooltip;
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
        
        // Get the existing container from HTML
        const modifiersContainer = document.getElementById('stage-modifiers-container');
        const modifiersList = document.getElementById('stage-modifiers-list');
        
        if (!modifiersContainer || !modifiersList) {
            console.error('[UIManager] Stage modifiers container not found in HTML');
            return;
        }
        
        // Clear existing modifiers
        modifiersList.innerHTML = '';
        
        if (!modifiers || modifiers.length === 0) {
            // Hide container if no modifiers
            modifiersContainer.style.display = 'none';
            return;
        }
        
        // Show container and populate with modifiers
        modifiersContainer.style.display = 'block';
        modifiersContainer.setAttribute('data-tutorial-target', 'stage-modifiers-indicator');
        modifiersContainer.setAttribute('data-persistent', 'true');
        
        console.log('[UIManager] Stage modifiers indicator updated successfully');
        
        // Add each modifier to the list
        modifiers.forEach(modifier => {
            const modifierElement = document.createElement('div');
            modifierElement.className = 'stage-modifier';
            modifierElement.dataset.modifierId = modifier.id;
            
            // Determine modifier type and icon from stage-modifiers.js registry
            let modifierType = 'utility'; // default
            let iconText = modifier.icon || '⭐'; // Use registered icon or default
            
            // Get registered modifier data for better icon and type
            if (window.stageModifiersRegistry) {
                const registeredModifier = window.stageModifiersRegistry.getModifier(modifier.id);
                if (registeredModifier) {
                    iconText = registeredModifier.icon || iconText;
                    
                    // Determine type based on modifier effects
                    if (modifier.id.includes('burning') || modifier.id.includes('damage') || modifier.id.includes('toxic')) {
                        modifierType = 'damage';
                    } else if (modifier.id.includes('heal') || modifier.id.includes('rain') || modifier.id.includes('wind') || modifier.id.includes('medicine')) {
                        modifierType = 'healing';
                    } else if (modifier.id.includes('fire') && modifier.id.includes('heal')) {
                        modifierType = 'mixed'; // Healing Fire is both healing and damage
                    } else if (modifier.id.includes('smoke') || modifier.id.includes('space') || modifier.id.includes('frozen')) {
                        modifierType = 'debuff';
                    }
                }
            }
            
            modifierElement.setAttribute('data-modifier-type', modifierType);
            
            // Create icon container
            const modifierIcon = document.createElement('div');
            modifierIcon.className = 'stage-modifier-icon';
            modifierIcon.textContent = iconText;
            modifierElement.appendChild(modifierIcon);
            
            // Create content container
            const modifierContent = document.createElement('div');
            modifierContent.className = 'stage-modifier-content';
            
            // Add modifier name
            const modifierName = document.createElement('div');
            modifierName.className = 'stage-modifier-name';
            modifierName.textContent = modifier.name;
            modifierContent.appendChild(modifierName);
            
            // Add modifier type label
            const modifierTypeLabel = document.createElement('div');
            modifierTypeLabel.className = 'stage-modifier-type';
            modifierTypeLabel.textContent = modifierType;
            modifierContent.appendChild(modifierTypeLabel);
            
            modifierElement.appendChild(modifierContent);
            
            // Add enhanced tooltip on hover
            this.addStageModifierTooltip(modifierElement, modifier);
            
            // Add to list
            modifiersList.appendChild(modifierElement);
        });
    }
    
    addStageModifierTooltip(element, modifier) {
        let tooltip = null;
        
        element.addEventListener('mouseenter', (e) => {
            // Remove existing tooltip
            const existingTooltip = document.querySelector('.stage-modifier-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
            
            // Create new tooltip
            tooltip = document.createElement('div');
            tooltip.className = 'stage-modifier-tooltip';
            
            // Tooltip header
            const header = document.createElement('div');
            header.className = 'stage-modifier-tooltip-header';
            
            const icon = document.createElement('div');
            icon.className = 'stage-modifier-tooltip-icon';
            icon.textContent = element.querySelector('.stage-modifier-icon').textContent;
            header.appendChild(icon);
            
            const title = document.createElement('div');
            title.className = 'stage-modifier-tooltip-title';
            title.textContent = modifier.name;
            header.appendChild(title);
            
            tooltip.appendChild(header);
            
            // Tooltip description
            const description = document.createElement('div');
            description.className = 'stage-modifier-tooltip-description';
            description.textContent = modifier.description;
            tooltip.appendChild(description);
            
            // Effect details if available
            if (modifier.effect) {
                const effect = document.createElement('div');
                effect.className = 'stage-modifier-tooltip-effect';
                
                let effectText = '';
                if (modifier.effect.value) {
                    effectText = `Effect: ${modifier.effect.value}`;
                    if (modifier.effect.type) {
                        effectText += ` (${modifier.effect.type})`;
                    }
                }
                effect.textContent = effectText || 'Special stage effect';
                tooltip.appendChild(effect);
            }
            
            // Position tooltip
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.right + 10;
            let top = rect.top;
            
            // Adjust if tooltip goes off screen
            if (left + tooltipRect.width > window.innerWidth) {
                left = rect.left - tooltipRect.width - 10;
            }
            if (top + tooltipRect.height > window.innerHeight) {
                top = window.innerHeight - tooltipRect.height - 10;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            // Show tooltip with animation
            setTimeout(() => {
                tooltip.classList.add('visible');
            }, 10);
        });
        
        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.classList.remove('visible');
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.remove();
                    }
                }, 300);
            }
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