// Controller Manager for Raid Game
class ControllerManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.uiManager = gameManager ? gameManager.uiManager : null;
        this.controllers = {};
        this.isControllerMode = false;
        this.selectedElement = null;
        this.currentSection = 'characters'; // 'characters', 'abilities', 'targets'
        this.currentCharacterIndex = 0;
        this.currentAbilityIndex = 0;
        this.controllerIconsVisible = false;
        this.isInitialized = false; // Add flag to track initialization

        // Button mapping
        this.buttonMap = {
            0: 'A',           // A button (Xbox) / X button (PlayStation)
            1: 'B',           // B button (Xbox) / Circle button (PlayStation)
            2: 'X',           // X button (Xbox) / Square button (PlayStation)
            3: 'Y',           // Y button (Xbox) / Triangle button (PlayStation)
            4: 'LB',          // Left Bumper
            5: 'RB',          // Right Bumper
            6: 'LT',          // Left Trigger
            7: 'RT',          // Right Trigger
            8: 'Back',        // Back/Select button
            9: 'Start',       // Start button
            10: 'LS',         // Left Stick press
            11: 'RS',         // Right Stick press
            12: 'DPadUp',     // D-Pad Up
            13: 'DPadDown',   // D-Pad Down
            14: 'DPadLeft',   // D-Pad Left
            15: 'DPadRight'   // D-Pad Right
        };

        // Button debounce timers
        this.buttonCooldowns = {};
        this.buttonCooldownTime = 250; // ms

        // --- NEW: Stick cooldowns ---
        this.stickCooldowns = {};
        this.stickCooldownTime = 250; // ms, same as button cooldown
        // --- END NEW ---

        // Stick deadzone
        this.deadzone = 0.2;

        // Visual feedback for controller
        this.controllerCursor = null;
        
        // Last processed timestamp to limit processing frequency
        this.lastProcessedTime = 0;
        this.processingInterval = 50; // ms

        // --- NEW: Confirm action cooldown ---
        this.confirmActionTimestamp = 0;
        this.confirmActionCooldown = 300; // ms - Keep this for basic debouncing
        this.isProcessingConfirm = false; // --- NEW: Action lock flag ---
        // --- END NEW ---
    }

    initialize() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('[ControllerManager] Already initialized, skipping duplicate initialization');
            return;
        }

        // Remove any existing controller cursors first
        const existingCursors = document.querySelectorAll('.controller-cursor');
        if (existingCursors.length > 0) {
            console.warn(`[ControllerManager] Found ${existingCursors.length} existing controller cursors. Cleaning up.`);
            existingCursors.forEach(cursor => {
                if (cursor.parentNode) {
                    cursor.parentNode.removeChild(cursor);
                }
            });
        }
        
        this.setupEventListeners();
        this.createControllerCursor();
        this.scanForControllers();
        console.log('Controller Manager initialized');
        
        // Start the update loop
        this.update();
        
        // Mark as initialized
        this.isInitialized = true;
    }
    
    createControllerCursor() {
        // Clean up any existing cursors first
        this.cleanup();
        
        // Create new cursor
        this.controllerCursor = document.createElement('div');
        this.controllerCursor.className = 'controller-cursor';
        this.controllerCursor.id = 'controller-cursor-' + Date.now(); // Add unique ID for debugging
        document.body.appendChild(this.controllerCursor);
        console.log(`[ControllerManager] Created new controller cursor: ${this.controllerCursor.id}`);
    }

    setupEventListeners() {
        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // Listen for keyboard events to disable controller mode
        window.addEventListener('keydown', (e) => {
            // Ignore gamepad button presses that might also trigger keydown
            if (e.code && e.code.startsWith('Gamepad')) return;
            // --- REMOVED: Don't disable on keydown --- 
            // console.log(`[Controller] Keydown detected (${e.key}), disabling controller mode.`); // Added Log
            // this.disableControllerMode();
            // --- END REMOVED ---
        });
        
        // Listen for mouse events to disable controller mode
        window.addEventListener('mousemove', (e) => {
            // Check for minimal movement to avoid accidental disabling
            // --- REMOVED: Don't disable on mouse move --- 
            // if (e.movementX !== 0 || e.movementY !== 0) {
            //      console.log("[Controller] Mouse move detected, disabling controller mode."); // Added Log
            //     this.disableControllerMode();
            // }
            // --- END REMOVED ---
        });
        
        window.addEventListener('click', (e) => {
            // Ignore clicks potentially triggered by controller confirm button
            if (e.pointerType === 'touch' || e.pointerType === 'pen' || (e.clientX === 0 && e.clientY === 0)) {
                 // Heuristic to ignore potential synthetic clicks
                 // console.log("[Controller] Ignoring click event likely from controller.");
                 return;
            }
            console.log("[Controller] Click detected, disabling controller mode.");
            this.disableControllerMode();
        });
    }

    onGamepadConnected(event) {
        const gamepad = event.gamepad;
        this.controllers[gamepad.index] = gamepad;
        console.log(`Gamepad connected at index ${gamepad.index}: ${gamepad.id}`);

        // --- NEW: Check if controller mode is already active ---
        if (this.isControllerMode) {
            console.log("[Controller] Gamepad connected, but controller mode is already active. Skipping re-enable.");
            return; // Don't re-enable if already active
        }
        // --- END NEW ---

        this.enableControllerMode();
        this.showControllerConnectedMessage(gamepad.id);
    }

    onGamepadDisconnected(event) {
        const gamepad = event.gamepad;
        delete this.controllers[gamepad.index];
        console.log(`Gamepad disconnected from index ${gamepad.index}: ${gamepad.id}`);
        
        // If no controllers left, disable controller mode
        if (Object.keys(this.controllers).length === 0) {
            this.disableControllerMode();
        }
    }

    enableControllerMode() {
        // --- MODIFIED: Strengthen the check ---
        if (this.isControllerMode) {
             console.log("[Controller] enableControllerMode called, but already active. Skipping.");
             return; // Explicitly return if already active
        }
        // --- END MODIFIED ---

        // --- Original logic starts here ---
        this.isControllerMode = true;
        console.log('Controller mode enabled');

        // Make controller cursor visible
        // --- ADDED: Null check for safety ---
        if (this.controllerCursor) {
            this.controllerCursor.style.display = 'block';
        } else {
             console.warn("[Controller] enableControllerMode: controllerCursor element not found.");
        }
        // --- END ADDED ---

        // Add controller mode class to body
        document.body.classList.add('controller-mode');

        // Show controller button hints
        // --- REMOVED: Don't show hints ---
            // this.showControllerIcons();
            // --- END REMOVED ---

        // Initial selection
        this.selectInitialElement();
        // --- END ORIGINAL LOGIC (closing brace was missing, added below) ---
    }

    // --- NEW: Function to reactivate controller mode on input --- 
    reactivateControllerMode() {
        if (this.isControllerMode) return; // Already active

        this.isControllerMode = true;
        console.log('[Controller] Controller mode re-activated by input.');

        // Make controller cursor visible
        if (this.controllerCursor) {
            this.controllerCursor.style.display = 'block';
        } else {
            console.warn("[Controller] reactivateControllerMode: controllerCursor element not found.");
        }

        // Add controller mode class to body
        if (document.body) {
            document.body.classList.add('controller-mode');
        } else {
            console.warn("[Controller] reactivateControllerMode: document.body not found.");
        }

        // Show controller button hints
        // --- REMOVED: Don't show hints ---
        // this.showControllerIcons();
        // --- END REMOVED ---

        // Re-select the last element or initial element
        if (this.selectedElement) {
            this.selectElement(this.selectedElement); // Re-highlight last selection
        } else {
            this.selectInitialElement();
        }
    }
    // --- END NEW ---

    disableControllerMode() {
        // --- Add check and try...catch --- 
        if (!this.isControllerMode) return; // Already disabled

        // --- NEW: Add a timestamp to prevent immediate reactivation --- 
        const now = Date.now();
        this.lastDisabledTime = now;
        // --- END NEW ---

        try {
            // Set the disabled flag first
            this.isControllerMode = false;
            console.log('[Controller] Controller mode disabled');

            // Hide controller cursor
            if (this.controllerCursor) {
                this.controllerCursor.style.display = 'none';
            } else {
                console.warn("[Controller] disableControllerMode: controllerCursor element not found.");
            }

            // Remove controller mode class from body
            if (document.body) {
                document.body.classList.remove('controller-mode');
            } else {
                console.warn("[Controller] disableControllerMode: document.body not found.");
            }

            // Don't completely clean up or reset selection when disabling temporarily
            // Only hide the cursor visually to maintain context when re-enabling

        } catch (error) {
            console.error("[Controller] Error during disableControllerMode:", error);
        }
        // --- End Add check and try...catch --- 
    }

    showControllerConnectedMessage(controllerId) {
        const shortName = controllerId.split('(')[0].trim();
        const message = `Controller connected: ${shortName}`;
        
        if (this.gameManager && this.gameManager.addLogEntry) {
            // this.gameManager.addLogEntry(message, 'system-update'); // Reduced logging
        } else {
            // console.log(message); // Reduced logging
        }
    }

    selectInitialElement() {
        // Get first player character
        const playerChars = document.querySelectorAll('.bottom-section .character-slot:not(.character-dead)');
        if (playerChars.length > 0) {
            this.selectElement(playerChars[0]);
            this.currentSection = 'characters';
            this.currentCharacterIndex = 0;
        }
    }

    selectElement(element) {
        // Remove highlight from previously selected element
        if (this.selectedElement) {
            this.selectedElement.classList.remove('controller-selected');
        }
        
        // Highlight the newly selected element
        this.selectedElement = element;
        if (this.selectedElement) {
            this.selectedElement.classList.add('controller-selected');
            
            // Position the controller cursor
            this.positionCursorAtElement(this.selectedElement);
            
            // Scroll element into view if needed
            this.selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    positionCursorAtElement(element) {
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        
        // Position in the middle of the element
        this.controllerCursor.style.left = `${rect.left + rect.width / 2}px`;
        this.controllerCursor.style.top = `${rect.top + rect.height / 2}px`;
        
        // Brief animation to show position change
        this.controllerCursor.classList.remove('cursor-moved');
        void this.controllerCursor.offsetWidth; // Force reflow
        this.controllerCursor.classList.add('cursor-moved');
    }

    scanForControllers() {
        // Check for existing controllers (in case they were connected before page load)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.controllers[gamepads[i].index] = gamepads[i];
                console.log(`Found existing gamepad at index ${gamepads[i].index}: ${gamepads[i].id}`);
                
                // Enable controller mode if not already
                this.enableControllerMode();
            }
        }
    }

    update() {
        // Only process at the specified interval
        const now = Date.now();
        if (now - this.lastProcessedTime < this.processingInterval) {
            requestAnimationFrame(() => this.update());
            return;
        }
        this.lastProcessedTime = now;
        
        // Check if controller mode is active
        if (!this.isControllerMode) {
            requestAnimationFrame(() => this.update());
            return;
        }
        
        // Get fresh gamepad data
        this.refreshGamepadData();
        
        // Process controller input for each connected controller
        // We'll just use the first connected controller for simplicity
        const controllerIndices = Object.keys(this.controllers);
        if (controllerIndices.length > 0) {
            const activeController = this.controllers[controllerIndices[0]];
            this.processControllerInput(activeController);
        }
        
        // Continue the update loop
        requestAnimationFrame(() => this.update());
    }

    refreshGamepadData() {
        // Get fresh gamepad data from the browser
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && this.controllers[gamepads[i].index]) {
                this.controllers[gamepads[i].index] = gamepads[i];
            }
        }
    }

    processControllerInput(controller) {
        if (!controller) return;

        // --- NEW: Check disable timestamp before reactivating ---
        const now = Date.now();
        const disableCooldown = 200; // ms - Prevent reactivation for a short period after disable
        let shouldReactivate = false;
        // --- END NEW ---

        // Check for input activity
        const buttonPressed = controller.buttons.some(button => button.pressed);
        const stickMoved = controller.axes.some(axis => Math.abs(axis) > this.deadzone);

        if (buttonPressed || stickMoved) {
            // --- MODIFIED: Check cooldown before setting reactivate flag ---
            if (!this.isControllerMode) {
                 if (!this.lastDisabledTime || (now - this.lastDisabledTime > disableCooldown)) {
                     shouldReactivate = true;
                 } else {
                      // console.log("[Controller] Ignoring input for reactivation due to recent disable."); // Optional debug log
                 }
            }
            // --- END MODIFIED ---
        }

        // --- MODIFIED: Use the flag to reactivate ---
        if (shouldReactivate) {
            this.reactivateControllerMode();
            // After reactivating, process the input normally in the *next* frame
            // This prevents processing the input that *caused* the reactivation immediately
            return; 
        }
        // --- END MODIFIED ---

        // --- ORIGINAL: Only process if already in controller mode --- 
        if (!this.isControllerMode) return; // Don't process if not active and not reactivating
        // --- END ORIGINAL ---

        // Process buttons
        this.processButtons(controller);

        // Process analog sticks
        this.processAnalogSticks(controller);
    }

    processButtons(controller) {
        // Process standard buttons
        controller.buttons.forEach((button, index) => {
            const buttonName = this.buttonMap[index] || `Button${index}`;
            
            // Check if button is pressed
            if (button.pressed) {
                this.onButtonPressed(buttonName, controller.index);
            } else {
                // Clear cooldown when button is released
                delete this.buttonCooldowns[`${controller.index}-${buttonName}`];
            }
        });
    }

    onButtonPressed(buttonName, controllerIndex) {
        // Check if the button is in cooldown
        const cooldownKey = `${controllerIndex}-${buttonName}`;
        if (this.buttonCooldowns[cooldownKey]) return;
        
        // Set cooldown
        this.buttonCooldowns[cooldownKey] = true;
        setTimeout(() => {
            delete this.buttonCooldowns[cooldownKey];
        }, this.buttonCooldownTime);
        
        // console.log(`Button pressed: ${buttonName}`); // Removed log
        
        // Handle button actions based on current context
        switch (buttonName) {
            case 'A': // Confirm/Select
                this.handleConfirmButton();
                break;
            case 'B': // Cancel/Back
                this.handleCancelButton();
                break;
            case 'X': // Special action 1
                this.handleXButton();
                break;
            case 'Y': // Special action 2
                this.handleYButton();
                break;
            case 'DPadUp':
                this.navigateUp();
                break;
            case 'DPadDown':
                this.navigateDown();
                break;
            case 'DPadLeft':
                this.navigateLeft();
                break;
            case 'DPadRight':
                this.navigateRight();
                break;
            case 'LB': // Previous character
                this.navigatePreviousCharacter();
                break;
            case 'RB': // Next character
                this.navigateNextCharacter();
                break;
            case 'Start': // End turn / Menu
                this.handleStartButton();
                break;
            case 'Back': // Toggle stats view
                this.handleBackButton();
                break;
        }
    }

    processAnalogSticks(controller) {
        const leftStickX = controller.axes[0];
        const leftStickY = controller.axes[1];
        const rightStickY = controller.axes[3]; // Get right stick Y axis

        // --- NEW: Check for active scrollable menus --- 
        const talentsPanel = document.querySelector('.talents-panel:not(.collapsed)');
        const statsMenu = document.querySelector('.character-stats-menu[style*="display: block"]');
        let activeScrollableMenu = null;
        let scrollableContentElement = null;

        if (statsMenu) {
            activeScrollableMenu = statsMenu;
            scrollableContentElement = statsMenu; // The menu itself is scrollable
        } else if (talentsPanel) {
            activeScrollableMenu = talentsPanel;
            scrollableContentElement = talentsPanel.querySelector('.talents-panel-content');
        }
        // --- END NEW ---

        // --- MODIFIED: Prioritize scrolling if a menu is active --- 
        if (activeScrollableMenu && scrollableContentElement && Math.abs(rightStickY) > this.deadzone) {
            // Use Right Stick Y for scrolling
            const scrollAmount = rightStickY * 15; // Adjust multiplier for sensitivity
            scrollableContentElement.scrollTop += scrollAmount;
            // Prevent left stick navigation while scrolling
            // this.stickCooldowns = { 'Up': true, 'Down': true, 'Left': true, 'Right': true }; // Temporarily disable nav
             // --- NEW: Explicitly return after scrolling to prevent left stick processing --- 
             return; 
             // --- END NEW ---
        } else {
            // Use Left Stick for navigation if no menu is being scrolled
        if (Math.abs(leftStickX) > this.deadzone || Math.abs(leftStickY) > this.deadzone) {
            // Determine the dominant direction
            if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
                if (leftStickX > 0) {
                        this.handleStickInput('Right'); // Use helper function
                } else {
                        this.handleStickInput('Left'); // Use helper function
                }
            } else {
                if (leftStickY > 0) {
                        this.handleStickInput('Down'); // Use helper function
                } else {
                        this.handleStickInput('Up'); // Use helper function
                }
            }
            } else {
                // Clear stick cooldowns when left stick returns to center
                this.stickCooldowns = {};
        }
        }
        // --- END MODIFIED --- 
        
        // Process right stick X (unused for now)
        // const rightStickX = controller.axes[2];
    }

    // --- NEW: Helper function to handle stick input with cooldown ---
    handleStickInput(direction) {
        // Check if the direction is in cooldown
        if (this.stickCooldowns[direction]) return;

        // Set cooldown for this direction
        this.stickCooldowns[direction] = true;
        setTimeout(() => {
            delete this.stickCooldowns[direction];
        }, this.stickCooldownTime);

        // Call the appropriate navigation function
        switch (direction) {
            case 'Up':
                this.navigateUp();
                break;
            case 'Down':
                this.navigateDown();
                break;
            case 'Left':
                this.navigateLeft();
                break;
            case 'Right':
                this.navigateRight();
                break;
    }
    }
    // --- END NEW ---

    handleConfirmButton() {
        if (!this.selectedElement) return;

        // --- MODIFIED: Check action lock flag FIRST --- 
        if (this.isProcessingConfirm) {
            // console.log("[Controller] Confirm action already in progress, ignoring."); // Optional log
            return;
        }
        // --- END MODIFIED ---

        // --- NEW: Check if game is running --- 
        if (!this.gameManager || !this.gameManager.isGameRunning) {
            // console.log("[Controller] Game is not running, ignoring confirm action."); // Optional log
            return;
        }
        // --- END NEW ---

        // Check timestamp cooldown (basic debounce)
        const now = Date.now();
        if (now - this.confirmActionTimestamp < this.confirmActionCooldown) {
            // console.log("[Controller] Confirm button pressed too quickly (timestamp), ignoring."); // Optional log
            return; // Ignore if pressed too recently
        }
        this.confirmActionTimestamp = now; // Update timestamp

        // --- NEW: Add guard clause for gameState --- 
        if (!this.gameManager || !this.gameManager.gameState) {
            console.warn("[Controller] Attempted action, but gameState is not ready.");
            return;
        }
        // --- END NEW ---

        // Handle specific section logic by calling GameManager methods directly
        try { 
             // --- NEW: Set action lock flag --- 
             this.isProcessingConfirm = true;
             // --- END NEW ---

            switch (this.currentSection) {
                case 'characters':
                    // --- NEW: Check playerCharacters exists --- 
                    if (!this.gameManager.gameState.playerCharacters) {
                        console.warn("[Controller] Attempted character selection, but playerCharacters array is not ready.");
                        // this.isProcessingConfirm = false; // Reset flag - Handled by finally
                        return; // Exit if no characters
                    }
                    // --- END NEW ---
                    const charInstanceId = this.selectedElement.dataset.instanceId;
                    const characterToSelect = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === charInstanceId);
                    if (characterToSelect && !characterToSelect.isDead() && !this.gameManager.actedCharacters.includes(characterToSelect.id) && !characterToSelect.isStunned()) {
                        const selectionSuccess = this.gameManager.selectCharacter(characterToSelect);
                        if (selectionSuccess) {
                            // --- MODIFIED: Select first ability SYNCHRONOUSLY --- 
                            this.currentSection = 'abilities';
                            const selectedCharElement = document.getElementById(`character-${charInstanceId}`);
                            if (selectedCharElement) {
                                const abilities = selectedCharElement.querySelectorAll('.abilities .ability:not([disabled])');
                                if (abilities.length > 0) {
                                    this.selectElement(abilities[0]); // Select immediately
                                    this.currentAbilityIndex = 0;
                                } else {
                                    console.warn("[Controller] No selectable abilities found for character:", characterToSelect.name);
                                    this.currentSection = 'characters'; // Revert section if no abilities
                                }
                            } else {
                                console.error("[Controller] Could not find selected character element:", charInstanceId);
                                this.currentSection = 'characters'; // Revert section on error
                            }
                            // --- END MODIFIED --- 
                            // --- NEW: Break after successful character selection --- 
                            break;
                            // --- END NEW ---
                        } else {
                            console.log("[Controller] gameManager.selectCharacter returned false.");
                            // No break here, let finally handle the flag reset
                        }
                    } else {
                         // Provide feedback if selection failed
                         if (characterToSelect?.isDead()) this.gameManager.addLogEntry(`${characterToSelect.name} is defeated.`, 'system');
                         else if (this.gameManager.actedCharacters.includes(characterToSelect?.id)) this.gameManager.addLogEntry(`${characterToSelect.name} has already acted.`, 'system');
                         else if (characterToSelect?.isStunned()) this.gameManager.addLogEntry(`${characterToSelect.name} is stunned.`, 'system');
                         else this.gameManager.addLogEntry(`Cannot select character.`, 'system');
                         // No break here, let finally handle the flag reset
                    }
                break; // End of 'characters' case
                
                case 'abilities':
                    const selectedCharacter = this.gameManager.gameState.selectedCharacter;
                    const abilityIndex = parseInt(this.selectedElement.dataset.index);

                    if (selectedCharacter && !isNaN(abilityIndex)) {
                        const abilityToSelect = selectedCharacter.abilities[abilityIndex];
                         if (abilityToSelect && abilityToSelect.currentCooldown <= 0 && selectedCharacter.stats.currentMana >= abilityToSelect.manaCost) {
                            
                            // Call selectAbility immediately without requiring a second press
                            const selectionSuccess = this.gameManager.selectAbility(selectedCharacter, abilityIndex);
                            
                            if (selectionSuccess) {
                                if (abilityToSelect.requiresTarget) {
                                    // Enter targeting mode immediately
                                    this.currentSection = 'targets';
                                    
                                    // Select the first valid target
                                    const targets = document.querySelectorAll('.character-slot.valid-target');
                                    if (targets.length > 0) {
                                        this.selectElement(targets[0]);
                                    } else {
                                        console.warn(`[Controller] No valid targets found for ability: ${abilityToSelect.name}`);
                                        this.currentSection = 'abilities'; // Revert section if no valid targets
                                    }
                                } else {
                                    // For self-targeted abilities, apply immediately
                                    const targetForSelfAbility = abilityToSelect.targetType === 'self' ? selectedCharacter : null;
                                    const useSuccess = this.gameManager.targetCharacter(targetForSelfAbility);
                                    
                                    if (useSuccess) {
                                        // After using self/no-target ability, go back to characters
                                        this.currentSection = 'characters';
                                        this.selectPlayerCharacter(this.currentCharacterIndex);
                                    } else {
                                        console.log("[Controller] Failed to use self/no-target ability.");
                                    }
                                }
                            } else {
                                console.log("[Controller] gameManager.selectAbility returned false.");
                            }
                            
                            break;
                         } else {
                             // Provide feedback if ability cannot be selected
                             if(abilityToSelect?.currentCooldown > 0) this.gameManager.addLogEntry(`${abilityToSelect.name} is on cooldown.`, 'system');
                             else if (selectedCharacter.stats.currentMana < abilityToSelect?.manaCost) this.gameManager.addLogEntry(`Not enough mana for ${abilityToSelect.name}.`, 'system');
                             // No break, let finally handle flag
                         }
                    } else {
                        console.error("[Controller] Error selecting ability: No selected character or invalid index.");
                         // No break, let finally handle flag
                    }
                break; // End of 'abilities' case
                
                case 'targets':
                    // --- NEW: Check both character arrays exist --- 
                    if (!this.gameManager.gameState.playerCharacters || !this.gameManager.gameState.aiCharacters) {
                        console.warn("[Controller] Attempted target selection, but character arrays are not ready.");
                        // this.isProcessingConfirm = false; // Reset flag - Handled by finally
                        return; // Exit if no characters
                    }
                    // --- END NEW ---

                    // FIX: Don't reset to 'targets' and select first target when we're already in targets mode
                    // Get the currently selected target's instance ID
                    const targetInstanceId = this.selectedElement.dataset.instanceId;
                    
                    // Find target in either player or AI characters
                    const targetCharacter = [...this.gameManager.gameState.playerCharacters, ...this.gameManager.gameState.aiCharacters]
                                            .find(c => c.instanceId === targetInstanceId);

                    if (targetCharacter && !targetCharacter.isDead()) {
                        // Validate target again before calling (UIManager highlights might not be perfect)
                        const selectedAbility = this.gameManager.gameState.selectedAbility;
                        if (selectedAbility && this.gameManager.validateTarget(selectedAbility.targetType, targetCharacter)) {
                             const useSuccess = this.gameManager.targetCharacter(targetCharacter);
                             if (useSuccess) {
                                 // After selecting a target and ability resolves, go back to characters
                                this.currentSection = 'characters';
                                 // --- MODIFIED: Select synchronously --- 
                                 this.selectPlayerCharacter(this.currentCharacterIndex);
                                 // --- END MODIFIED ---
                                 // --- NEW: Break after successful target use --- 
                                 break;
                                 // --- END NEW ---
                             } else {
                                console.log("[Controller] gameManager.targetCharacter returned false.");
                                // No break, let finally handle flag
                             }
                        } else {
                             console.log(`[Controller] Invalid target ${targetCharacter.name} for ability ${selectedAbility?.name}.`);
                             this.gameManager.addLogEntry(`Invalid target: ${targetCharacter.name}.`, 'system');
                              // No break, let finally handle flag
                        }
                    } else {
                        console.log(`[Controller] Invalid target character: ${targetInstanceId}. Dead or not found.`);
                         this.gameManager.addLogEntry(`Cannot target defeated character.`, 'system');
                          // No break, let finally handle flag
                    }
                break; // End of 'targets' case
            }
        } catch (error) {
            console.error("[ControllerManager] Error during handleConfirmButton:", error);
            this.gameManager.addLogEntry("Controller action failed. Please try again.", "error");
            this.currentSection = 'characters'; // Reset to character selection on error
            this.selectInitialElement();
             // Ensure flag is reset even on error
             // this.isProcessingConfirm = false; // Moved to finally block
        } finally {
             // --- NEW: Always reset the flag in finally --- 
             // Use a small delay in finally as well to ensure it doesn't reset *too* quickly
             // before subsequent event processing in the same frame completes.
             setTimeout(() => {
                 this.isProcessingConfirm = false;
             }, 150); // --- INCREASED DELAY --- 
             // --- END NEW ---
        }
    }

    handleCancelButton() {
        // Handle cancel based on current section
        switch (this.currentSection) {
            case 'abilities':
                // Go back to character selection
                this.currentSection = 'characters';
                this.selectPlayerCharacter(this.currentCharacterIndex);
                
                // Cancel character selection
                if (this.gameManager.uiManager) {
                    this.gameManager.uiManager.clearSelection();
                }
                break;
                
            case 'targets':
                // Go back to ability selection
                this.currentSection = 'abilities';
                
                const abilities = document.querySelectorAll('.selected .ability:not([disabled])');
                if (abilities.length > 0 && this.currentAbilityIndex < abilities.length) {
                    this.selectElement(abilities[this.currentAbilityIndex]);
                }
                break;
        }
    }

    handleXButton() {
        // Special action 1 - For example, show character stats
        if (this.currentSection === 'characters' && this.selectedElement) {
            // Find the character ID
            const characterId = this.selectedElement.id.replace('character-', '');
            const character = this.getCharacterById(characterId);
            
            // Show character stats menu
            if (character && this.gameManager.uiManager && 
                typeof this.gameManager.uiManager.showCharacterStatsMenu === 'function') {
                
                const rect = this.selectedElement.getBoundingClientRect();
                this.gameManager.uiManager.showCharacterStatsMenu(
                    character, 
                    rect.left + rect.width / 2, 
                    rect.top + rect.height / 2
                );
            }
        }
    }

    handleYButton() {
        // Special action 2 - For example, auto select target
        if (this.currentSection === 'targets') {
            if (this.gameManager && typeof this.gameManager.autoSelectTarget === 'function') {
                this.gameManager.autoSelectTarget();
                
                // After auto selecting, go back to characters
                setTimeout(() => {
                    this.currentSection = 'characters';
                    this.selectPlayerCharacter(this.currentCharacterIndex);
                }, 100);
            }
        }
    }

    handleStartButton() {
        // Handle Start button - End turn
        if (this.gameManager && typeof this.gameManager.endPlayerTurn === 'function') {
            // Only try to end turn if the button is enabled
            const endTurnButton = document.querySelector('.end-turn-button');
            if (endTurnButton && !endTurnButton.disabled) {
                this.gameManager.endPlayerTurn();
            }
        }
    }

    handleBackButton() {
        // Handle Back button - Toggle talents panel or other UI
        const talentsPanel = document.querySelector('.talents-panel');
        if (talentsPanel) {
            talentsPanel.classList.toggle('collapsed');
        }
    }

    navigateUp() {
        if (!this.selectedElement) return;
        
        switch (this.currentSection) {
            case 'characters':
                // For characters, up means going to enemy characters
                if (this.selectedElement.closest('.bottom-section')) {
                    // Currently in bottom section, move to top section
                    const enemyChars = document.querySelectorAll('.top-section .character-slot:not(.character-dead)');
                    if (enemyChars.length > 0) {
                        // Find the enemy character in roughly the same column
                        const currentRect = this.selectedElement.getBoundingClientRect();
                        let closestChar = enemyChars[0];
                        let closestDistance = Infinity;
                        
                        enemyChars.forEach(char => {
                            const rect = char.getBoundingClientRect();
                            const distance = Math.abs(rect.left - currentRect.left);
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                closestChar = char;
                            }
                        });
                        
                        this.selectElement(closestChar);
                    }
                }
                break;
                
            case 'abilities':
                // No up navigation for abilities as they're horizontal
                break;
                
            case 'targets':
                if (this.selectedElement.closest('.bottom-section')) {
                    // If in bottom section, try to find targets in top section
                    const topTargets = document.querySelectorAll('.top-section .valid-target');
                    if (topTargets.length > 0) {
                        this.selectClosestElementInDirection(topTargets, 'up');
                    }
                 } else if (this.selectedElement.closest('.top-section')) {
                     // --- MODIFIED: If targeting allies, stay in top section --- 
                     const selectedAbility = this.gameManager.gameState?.selectedAbility;
                     if (selectedAbility?.targetType.includes('ally')) {
                          // If targeting allies, Up should find the previous ally target in the same section
                          const currentTargets = Array.from(document.querySelectorAll('.top-section .valid-target'));
                          this.navigateAmongTargets(currentTargets, 'previous');
                     } else {
                         // If targeting enemies, Up does nothing when already in top section (or wrap?)
                         // console.log("[Controller NavigateUp Targets] Already in top section, targeting enemies. No vertical move up."); // Removed log
                     }
                     // --- END MODIFIED ---
                }
                break;
        }
    }

    navigateDown() {
        if (!this.selectedElement) return;
        
        switch (this.currentSection) {
            case 'characters':
                // For characters, down means going to player characters
                if (this.selectedElement.closest('.top-section')) {
                    // Currently in top section, move to bottom section
                    const playerChars = document.querySelectorAll('.bottom-section .character-slot:not(.character-dead)');
                    if (playerChars.length > 0) {
                        this.selectClosestElementInDirection(playerChars, 'down');
                        // Update currentCharacterIndex after selection
                        this.currentCharacterIndex = Array.from(playerChars).indexOf(this.selectedElement);
                    }
                }
                break;
                
            case 'abilities':
                // No down navigation for abilities as they're horizontal
                break;
                
            case 'targets':
                if (this.selectedElement.closest('.top-section')) {
                    // If in top section, try to find targets in bottom section
                    const bottomTargets = document.querySelectorAll('.bottom-section .valid-target');
                    if (bottomTargets.length > 0) {
                        this.selectClosestElementInDirection(bottomTargets, 'down');
                    }
                } else if (this.selectedElement.closest('.bottom-section')) {
                     // --- MODIFIED: If targeting allies, stay in bottom section --- 
                     const selectedAbility = this.gameManager.gameState?.selectedAbility;
                     if (selectedAbility?.targetType.includes('ally')) {
                         // If targeting allies, Down should find the next ally target in the same section
                         const currentTargets = Array.from(document.querySelectorAll('.bottom-section .valid-target'));
                         this.navigateAmongTargets(currentTargets, 'next');
                     } else {
                         // If targeting enemies, Down does nothing when already in bottom section (or wrap?)
                          // console.log("[Controller NavigateDown Targets] Already in bottom section, targeting enemies. No vertical move down."); // Removed log
                     }
                     // --- END MODIFIED ---
                }
                break;
        }
    }

    navigateLeft() {
        if (!this.selectedElement) return;
        
        switch (this.currentSection) {
            case 'characters':
                // For characters, move to the previous character in the same row
                const charRow = this.selectedElement.closest('.characters-container');
                if (charRow) {
                    const chars = Array.from(charRow.querySelectorAll('.character-slot:not(.character-dead)'));
                    const currentIndex = chars.indexOf(this.selectedElement);
                    
                    if (currentIndex > 0) {
                        this.selectElement(chars[currentIndex - 1]);
                        if (charRow.closest('.bottom-section')) {
                            this.currentCharacterIndex = currentIndex - 1;
                        }
                    }
                }
                break;
                
            case 'abilities':
                // For abilities, move to the previous ability
                const abilities = document.querySelectorAll('.selected .ability:not([disabled])');
                if (abilities.length > 0) {
                    const currentIndex = Array.from(abilities).indexOf(this.selectedElement);
                    
                    if (currentIndex > 0) {
                        this.selectElement(abilities[currentIndex - 1]);
                        this.currentAbilityIndex = currentIndex - 1;
                    }
                }
                break;
                
            case 'targets':
                // For targets, move to the previous valid target
                const targets = document.querySelectorAll('.valid-target');
                if (targets.length > 0) {
                    const currentTargets = Array.from(targets);
                    this.navigateAmongTargets(currentTargets, 'previous'); // Use helper
                }
                break;
        }
    }

    navigateRight() {
        if (!this.selectedElement) return;
        
        switch (this.currentSection) {
            case 'characters':
                // For characters, move to the next character in the same row
                const charRow = this.selectedElement.closest('.characters-container');
                if (charRow) {
                    const chars = Array.from(charRow.querySelectorAll('.character-slot:not(.character-dead)'));
                    const currentIndex = chars.indexOf(this.selectedElement);
                    
                    if (currentIndex < chars.length - 1) {
                        this.selectElement(chars[currentIndex + 1]);
                        if (charRow.closest('.bottom-section')) {
                            this.currentCharacterIndex = currentIndex + 1;
                        }
                    }
                }
                break;
                
            case 'abilities':
                // For abilities, move to the next ability
                const abilities = document.querySelectorAll('.selected .ability:not([disabled])');
                if (abilities.length > 0) {
                    const currentIndex = Array.from(abilities).indexOf(this.selectedElement);
                    
                    if (currentIndex < abilities.length - 1) {
                        this.selectElement(abilities[currentIndex + 1]);
                        this.currentAbilityIndex = currentIndex + 1;
                    }
                }
                break;
                
            case 'targets':
                // For targets, move to the next valid target
                const targets = document.querySelectorAll('.valid-target');
                if (targets.length > 0) {
                   const currentTargets = Array.from(targets);
                   this.navigateAmongTargets(currentTargets, 'next'); // Use helper
                }
                break;
        }
    }

    navigatePreviousCharacter() {
        // Switch to previous player character
        const playerChars = document.querySelectorAll('.bottom-section .character-slot:not(.character-dead)');
        if (playerChars.length > 0) {
            this.currentCharacterIndex = (this.currentCharacterIndex - 1 + playerChars.length) % playerChars.length;
            const characterToSelectElement = playerChars[this.currentCharacterIndex];
            this.selectElement(characterToSelectElement);
            
            // Reset to character selection
            this.currentSection = 'characters';
            
            // Clear any previous ability selection
            if (this.gameManager.uiManager) {
                this.gameManager.uiManager.clearSelection();
            }
            
            // --- MODIFIED: Call selectCharacter directly --- 
            const charInstanceId = characterToSelectElement.dataset.instanceId;
            const characterToSelect = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === charInstanceId);
            if (characterToSelect && !characterToSelect.isDead() && !this.gameManager.actedCharacters.includes(characterToSelect.id) && !characterToSelect.isStunned()){
                // Use setTimeout to ensure selection happens after UI updates settle slightly
                // This helps prevent potential race conditions or state inconsistencies
                setTimeout(() => {
                    this.gameManager.selectCharacter(characterToSelect);
                    // console.log(`[Controller LB] Selected character: ${characterToSelect.name}`); // Removed log
                    // No need to transition section, selectCharacter handles UI
                }, 50); // Small delay
            } else {
                // console.warn(`[Controller LB] Could not select character ${charInstanceId}. State:`, characterToSelect); // Removed warn
                // Handle cases where the character is invalid (acted, stunned, dead)
                // Potentially select the *next* available character instead?
                // For now, just log it.
            }
            // --- END MODIFIED --- 
        }
    }

    navigateNextCharacter() {
        // Switch to next player character
        const playerChars = document.querySelectorAll('.bottom-section .character-slot:not(.character-dead)');
        if (playerChars.length > 0) {
            this.currentCharacterIndex = (this.currentCharacterIndex + 1) % playerChars.length;
            const characterToSelectElement = playerChars[this.currentCharacterIndex];
            this.selectElement(characterToSelectElement);
            
            // Reset to character selection
            this.currentSection = 'characters';
            
            // Clear any previous ability selection
            if (this.gameManager.uiManager) {
                this.gameManager.uiManager.clearSelection();
            }
            
             // --- MODIFIED: Call selectCharacter directly --- 
             const charInstanceId = characterToSelectElement.dataset.instanceId;
             const characterToSelect = this.gameManager.gameState.playerCharacters.find(c => c.instanceId === charInstanceId);
             if (characterToSelect && !characterToSelect.isDead() && !this.gameManager.actedCharacters.includes(characterToSelect.id) && !characterToSelect.isStunned()){
                 // Use setTimeout for consistency and safety
                 setTimeout(() => {
                     this.gameManager.selectCharacter(characterToSelect);
                     // console.log(`[Controller RB] Selected character: ${characterToSelect.name}`); // Removed log
                     // No need to transition section, selectCharacter handles UI
                 }, 50); // Small delay
             } else {
                 // console.warn(`[Controller RB] Could not select character ${charInstanceId}. State:`, characterToSelect); // Removed warn
                 // Handle cases where the character is invalid (acted, stunned, dead)
             }
             // --- END MODIFIED --- 
        }
    }

    selectPlayerCharacter(index) {
        const playerChars = document.querySelectorAll('.bottom-section .character-slot:not(.character-dead)');
        if (playerChars.length > 0 && index >= 0 && index < playerChars.length) {
            this.selectElement(playerChars[index]);
        }
    }

    showControllerIcons() {
        if (this.controllerIconsVisible) return;
        
        this.controllerIconsVisible = true;
        
        // Create controller button hints container if it doesn't exist
        let hintsContainer = document.querySelector('.controller-hints');
        if (!hintsContainer) {
            hintsContainer = document.createElement('div');
            hintsContainer.className = 'controller-hints';
            document.body.appendChild(hintsContainer);
        }
        
        // Add hint items
        hintsContainer.innerHTML = `
            <div class="controller-hint-item">
                <div class="controller-hint-button a-button"></div>
                <div class="controller-hint-text">Select/Confirm</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button b-button"></div>
                <div class="controller-hint-text">Back/Cancel</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button x-button"></div>
                <div class="controller-hint-text">Character Stats</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button y-button"></div>
                <div class="controller-hint-text">Auto Target</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button lb-button"></div>
                <div class="controller-hint-text">Prev Character</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button rb-button"></div>
                <div class="controller-hint-text">Next Character</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button start-button"></div>
                <div class="controller-hint-text">End Turn</div>
            </div>
        `;
    }

    hideControllerIcons() {
        if (!this.controllerIconsVisible) return;
        
        this.controllerIconsVisible = false;
        
        const hintsContainer = document.querySelector('.controller-hints');
        if (hintsContainer) {
            hintsContainer.remove();
        }
    }

    getCharacterById(characterId) {
        if (!this.gameManager || !this.gameManager.gameState) return null;
        
        // Check player characters
        if (this.gameManager.gameState.playerCharacters) {
            const playerChar = this.gameManager.gameState.playerCharacters.find(
                c => c.id === characterId || c.instanceId === characterId
            );
            if (playerChar) return playerChar;
        }
        
        // Check AI characters
        if (this.gameManager.gameState.aiCharacters) {
            const aiChar = this.gameManager.gameState.aiCharacters.find(
                c => c.id === characterId || c.instanceId === characterId
            );
            if (aiChar) return aiChar;
        }
        
        return null;
    }

    // --- NEW HELPER: Find closest element (vertically) in a list of elements --- 
    selectClosestElementInDirection(elements, direction) {
        if (!this.selectedElement || !elements || elements.length === 0) return;

        const currentRect = this.selectedElement.getBoundingClientRect();
        let closestElement = elements[0];
        let minDistance = Infinity;

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            // Calculate vertical distance based on direction
            let distance;
            if (direction === 'up') {
                distance = currentRect.top - rect.bottom; // Element must be above
            } else { // direction === 'down'
                distance = rect.top - currentRect.bottom; // Element must be below
            }

            // Horizontal distance (to prioritize elements closer horizontally)
            const horizontalDistance = Math.abs(rect.left + rect.width / 2 - (currentRect.left + currentRect.width / 2));

            // We want the element with the smallest positive vertical distance
            // and prioritize smaller horizontal distance as a tie-breaker
            if (distance >= 0) { // Ensure element is in the correct direction
                 // Combine vertical and horizontal distance for sorting (prioritize vertical)
                 const combinedDistance = distance + horizontalDistance * 0.1; 
                if (combinedDistance < minDistance) {
                    minDistance = combinedDistance;
                    closestElement = element;
                }
            }
        });

        this.selectElement(closestElement);
    }
    // --- END NEW HELPER --- 

     // --- NEW HELPER: Navigate among a list of targets (e.g., allies in the same row) ---
     navigateAmongTargets(targets, direction) {
         if (!this.selectedElement || !targets || targets.length === 0) return;
 
         const currentIndex = targets.indexOf(this.selectedElement);
         let nextIndex;
 
         if (direction === 'next') {
             nextIndex = (currentIndex + 1) % targets.length;
         } else { // direction === 'previous'
             nextIndex = (currentIndex - 1 + targets.length) % targets.length;
         }
 
         if (nextIndex >= 0 && nextIndex < targets.length) {
             this.selectElement(targets[nextIndex]);
         }
     }
     // --- END NEW HELPER ---

    // Add cleanup method
    cleanup() {
        console.log('[ControllerManager] Cleaning up controller resources');
        
        // Remove existing controller cursor from DOM
        if (this.controllerCursor && this.controllerCursor.parentNode) {
            this.controllerCursor.parentNode.removeChild(this.controllerCursor);
            this.controllerCursor = null;
        }
        
        // Clean up any existing controller cursors that might have been orphaned
        const existingCursors = document.querySelectorAll('.controller-cursor');
        existingCursors.forEach(cursor => {
            if (cursor.parentNode) {
                cursor.parentNode.removeChild(cursor);
            }
        });
        
        // Reset state
        this.isControllerMode = false;
        this.selectedElement = null;
        this.currentSection = 'characters';
        this.currentCharacterIndex = 0;
        this.currentAbilityIndex = 0;
    }
}

// Export the class for use in other modules
window.ControllerManager = ControllerManager; 