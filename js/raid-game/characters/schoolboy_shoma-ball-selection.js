// Schoolboy Shoma Ball Selection Module
// This script handles Schoolboy Shoma's unique ability to select a ball type at the start of a game

/**
 * Handles displaying the ball selection UI and processing the player's choice for Schoolboy Shoma
 * @param {Character} shomaCharacter - The Schoolboy Shoma character instance
 * @param {Function} onSelectionComplete - Callback function to execute after selection is made
 */
function showBallSelectionForShoma(shomaCharacter, onSelectionComplete) {
    try {
        console.log('Showing ball selection modal');
        
        // Check if this is actually Schoolboy Shoma
        if (!shomaCharacter || shomaCharacter.id !== 'schoolboy_shoma') {
            console.error('Ball selection called for non-Schoolboy Shoma character');
            if (onSelectionComplete) onSelectionComplete();
            return;
        }
        
        // Preload ball icons for smooth display
        preloadBallIcons();
        
        // Create the ball selection modal
        const modalContainer = document.createElement('div');
        modalContainer.className = 'ball-selection-modal';
        modalContainer.innerHTML = `
            <div class="ball-selection-content">
                <h2>Select Schoolboy Shoma's Ball</h2>
                <p>Choose which ball Schoolboy Shoma will use for this battle:</p>
                <div class="ball-options">
                    <div class="ball-option" data-ball-id="grass_ball" style="cursor: pointer;" onclick="window.shomaSelectBall('grass_ball')">
                        <img src="Icons/abilities/grassball.jfif" alt="Grass Ball">
                        <h3>Grass Ball</h3>
                        <p>Heals ally for 500 + 2% target max HP (scales with Healing Power)</p>
                    </div>
                    <div class="ball-option" data-ball-id="fire_ball" style="cursor: pointer;" onclick="window.shomaSelectBall('fire_ball')">
                        <img src="Icons/abilities/fireball.jfif" alt="Fire Ball">
                        <h3>Fire Ball</h3>
                        <p>Deals 600 + 2% target max HP as magic damage</p>
                    </div>
                    <div class="ball-option" data-ball-id="heavy_ball" style="cursor: pointer;" onclick="window.shomaSelectBall('heavy_ball')">
                        <img src="Icons/abilities/heavyball.jfif" alt="Heavy Ball">
                        <h3>Heavy Ball</h3>
                        <p>Deals 200 damage and reduces the target's damage by 20% for 4 turns</p>
                    </div>
                    <div class="ball-option" data-ball-id="water_ball" style="cursor: pointer;" onclick="window.shomaSelectBall('water_ball')">
                        <img src="Icons/abilities/waterball.jfif" alt="Water Ball">
                        <h3>Water Ball</h3>
                        <p>Deals 550 damage to main target and 180 to all other enemies</p>
                    </div>
                    <div class="controller-hints">
                        <span class="controller-hint">D-Pad/Left Stick: Navigate</span>
                        <span class="controller-hint">A: Select Ball</span>
                        <span class="controller-hint">B: Auto-select Fire Ball</span>
                    </div>
                </div>
            </div>
        `;

        // Add the modal to the document
        document.body.appendChild(modalContainer);
        console.log('Ball selection modal added to DOM');

        // Temporarily disable main game controller and enable ball selection controller
        const gameControllerWasActive = window.gameManager?.controllerManager?.isControllerMode || false;
        if (window.gameManager?.controllerManager) {
            // Hide the main game's controller cursor
            const mainCursor = document.querySelector('.controller-cursor');
            if (mainCursor) {
                mainCursor.style.display = 'none';
            }
            
            // Store the state but don't fully disable controller mode
            window.ballSelectionControllerState = {
                wasActive: gameControllerWasActive,
                mainCursor: mainCursor
            };
        }
        
        // Enable controller support for ball selection
        enableControllerSupport(modalContainer);

        // Add CSS styles for the modal
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .ball-selection-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .ball-selection-content {
                background-color: #1a1a2e;
                border: 2px solid #4d4dff;
                border-radius: 8px;
                padding: 20px;
                width: 80%;
                max-width: 800px;
                color: white;
                text-align: center;
            }
            
            .ball-options {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
                flex-wrap: wrap;
            }
            
            .ball-option {
                background-color: #16213e;
                border: 2px solid #30475e;
                border-radius: 5px;
                padding: 15px;
                width: 22%;
                min-width: 180px;
                cursor: pointer !important;
                transition: all 0.3s ease;
                margin-bottom: 15px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                position: relative;
                overflow: hidden;
            }
            
            .ball-option:hover {
                transform: translateY(-5px);
                border-color: #4d4dff;
                box-shadow: 0px 6px 12px rgba(77, 77, 255, 0.3);
            }
            
            .ball-option img {
                width: 64px;
                height: 64px;
                margin-bottom: 10px;
                position: relative;
                z-index: 2;
            }
            
            .ball-option h3 {
                margin: 5px 0;
                color: #ffffff;
                position: relative;
                z-index: 2;
            }
            
            .ball-option p {
                font-size: 14px;
                color: #cccccc;
                position: relative;
                z-index: 2;
            }

            /* Ball Selection Preview Effects */
            .ball-option[data-ball-id="grass_ball"]::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, rgba(76, 175, 80, 0.3) 0%, rgba(76, 175, 80, 0) 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .ball-option[data-ball-id="fire_ball"]::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, rgba(255, 87, 34, 0.3) 0%, rgba(255, 87, 34, 0) 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .ball-option[data-ball-id="heavy_ball"]::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, rgba(97, 97, 97, 0.3) 0%, rgba(97, 97, 97, 0) 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .ball-option[data-ball-id="water_ball"]::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, rgba(33, 150, 243, 0.3) 0%, rgba(33, 150, 243, 0) 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .ball-option:hover::before {
                opacity: 1;
            }
            
            /* Controller support styling */
            .ball-option.controller-selected {
                border-color: #4d4dff !important;
                box-shadow: 0px 6px 12px rgba(77, 77, 255, 0.5) !important;
                transform: translateY(-5px) scale(1.05) !important;
            }
            
            .ball-option.controller-selected::before {
                opacity: 1 !important;
            }
            
            .controller-ball-cursor {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #4d4dff;
                border-radius: 8px;
                box-shadow: 0 0 15px rgba(77, 77, 255, 0.8);
                animation: controllerPulse 1s infinite alternate;
                pointer-events: none;
                z-index: 100;
            }
            
            @keyframes controllerPulse {
                0% { 
                    opacity: 0.7; 
                    transform: scale(1);
                }
                100% { 
                    opacity: 1; 
                    transform: scale(1.02);
                }
            }
            
            .ball-selection-content h2 {
                color: #4d4dff;
                margin-bottom: 10px;
            }
            
            .controller-hints {
                margin-top: 15px;
                color: #cccccc;
                font-size: 14px;
                text-align: center;
            }
            
            .controller-hint {
                display: inline-block;
                margin: 0 10px;
                padding: 5px 10px;
                background: rgba(77, 77, 255, 0.2);
                border-radius: 5px;
                border: 1px solid #4d4dff;
            }
        `;
        document.head.appendChild(styleElement);

        // Create a global function to be called by the onclick attribute
        window.shomaSelectBall = function(ballId) {
            console.log(`Ball option clicked: ${ballId}`);
            selectBall(shomaCharacter, ballId);
            
            // Clean up
            if (window.cleanupBallSelectionController) {
                window.cleanupBallSelectionController();
                delete window.cleanupBallSelectionController;
            }
            
            // Restore main game controller cursor
            if (window.ballSelectionControllerState) {
                const { wasActive, mainCursor } = window.ballSelectionControllerState;
                if (mainCursor && wasActive) {
                    mainCursor.style.display = 'block';
                }
                delete window.ballSelectionControllerState;
            }
            
            // Safely remove modal container
            if (modalContainer && modalContainer.parentNode) {
                modalContainer.parentNode.removeChild(modalContainer);
            }
            
            // Safely remove style element
            if (styleElement && styleElement.parentNode) {
                styleElement.parentNode.removeChild(styleElement);
            }
            
            // Remove the global function
            delete window.shomaSelectBall;
            
            // Call the callback to continue the game with the selected ball ID
            if (onSelectionComplete) onSelectionComplete(ballId);
        };

        // Also add traditional event listeners as backup
        console.log('Adding click event listeners to ball options');
        const ballOptions = modalContainer.querySelectorAll('.ball-option');
        ballOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedBallId = this.getAttribute('data-ball-id');
                console.log(`Ball option clicked via event listener: ${selectedBallId}`);
                if (window.shomaSelectBall) {
                    window.shomaSelectBall(selectedBallId);
                } else {
                    console.error('shomaSelectBall function not found');
                    // Fallback - directly call selectBall
                    selectBall(shomaCharacter, selectedBallId);
                    
                    // Clean up
                    if (window.cleanupBallSelectionController) {
                        window.cleanupBallSelectionController();
                        delete window.cleanupBallSelectionController;
                    }
                    
                    // Restore main game controller cursor
                    if (window.ballSelectionControllerState) {
                        const { wasActive, mainCursor } = window.ballSelectionControllerState;
                        if (mainCursor && wasActive) {
                            mainCursor.style.display = 'block';
                        }
                        delete window.ballSelectionControllerState;
                    }
                    
                    // Safely remove modal container
                    if (modalContainer && modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                    }
                    
                    // Safely remove style element
                    if (styleElement && styleElement.parentNode) {
                        styleElement.parentNode.removeChild(styleElement);
                    }
                    
                    // Call the callback to continue the game
                    if (onSelectionComplete) onSelectionComplete(selectedBallId);
                }
            });
        });
        
        // Add a debug click anywhere message
        document.addEventListener('click', function debugClick(e) {
            console.log('Click detected at:', e.clientX, e.clientY, e.target);
            // Only run this once
            document.removeEventListener('click', debugClick);
        });
        
        // Auto-select fire ball after 60 seconds if no selection was made
        // This prevents the game from getting stuck if there's an issue with the UI
        const autoSelectTimeout = setTimeout(() => {
            console.log('Ball selection timed out - auto-selecting Fire Ball');
            selectBall(shomaCharacter, 'fire_ball');
            
            // Clean up
            if (window.cleanupBallSelectionController) {
                window.cleanupBallSelectionController();
                delete window.cleanupBallSelectionController;
            }
            
            // Restore main game controller cursor
            if (window.ballSelectionControllerState) {
                const { wasActive, mainCursor } = window.ballSelectionControllerState;
                if (mainCursor && wasActive) {
                    mainCursor.style.display = 'block';
                }
                delete window.ballSelectionControllerState;
            }
            
            // Safely remove modal container
            if (modalContainer && modalContainer.parentNode) {
                modalContainer.parentNode.removeChild(modalContainer);
            }
            
            // Safely remove style element
            if (styleElement && styleElement.parentNode) {
                styleElement.parentNode.removeChild(styleElement);
            }
            
            // Remove the global function
            if (window.shomaSelectBall) {
                delete window.shomaSelectBall;
            }
            
            // Call the callback to continue the game
            if (onSelectionComplete) onSelectionComplete('fire_ball');
        }, 60000); // 60 seconds timeout
        
        // Clear the timeout if a selection is made
        const originalOnSelectionComplete = onSelectionComplete;
        onSelectionComplete = function() {
            clearTimeout(autoSelectTimeout);
            if (originalOnSelectionComplete) originalOnSelectionComplete();
        };
    } catch (error) {
        console.error('Error showing ball selection:', error);
        if (onSelectionComplete) onSelectionComplete('fire_ball'); // Default to fire ball on error
    }
}

/**
 * Enable controller support for ball selection modal
 * @param {HTMLElement} modalContainer - The modal container element
 */
function enableControllerSupport(modalContainer) {
    const ballOptions = modalContainer.querySelectorAll('.ball-option');
    let selectedIndex = 0;
    let isControllerActive = false;
    let controllerCursor = null;
    let lastInputTime = 0;
    const inputCooldown = 200; // ms between inputs
    
    // Create controller cursor
    function createControllerCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'controller-ball-cursor';
        cursor.style.position = 'absolute';
        cursor.style.top = '0';
        cursor.style.left = '0';
        cursor.style.width = '100%';
        cursor.style.height = '100%';
        cursor.style.border = '3px solid #4d4dff';
        cursor.style.borderRadius = '8px';
        cursor.style.boxShadow = '0 0 15px rgba(77, 77, 255, 0.8)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '100';
        cursor.style.animation = 'controllerPulse 1s infinite alternate';
        return cursor;
    }
    
    // Update cursor position
    function updateCursorPosition() {
        if (!ballOptions[selectedIndex]) return;
        
        const selectedOption = ballOptions[selectedIndex];
        
        // Remove cursor from all options
        ballOptions.forEach(option => {
            option.classList.remove('controller-selected');
            const existingCursors = option.querySelectorAll('.controller-ball-cursor');
            existingCursors.forEach(cursor => cursor.remove());
        });
        
        // Add cursor and styling to current option
        selectedOption.classList.add('controller-selected');
        
        // Make sure the option has relative positioning for absolute cursor
        if (getComputedStyle(selectedOption).position === 'static') {
            selectedOption.style.position = 'relative';
        }
        
        const newCursor = createControllerCursor();
        selectedOption.appendChild(newCursor);
        
        console.log(`Controller cursor moved to ball option ${selectedIndex}: ${selectedOption.getAttribute('data-ball-id')}`);
    }
    
    // Select current ball
    function selectCurrentBall() {
        if (ballOptions[selectedIndex]) {
            const ballId = ballOptions[selectedIndex].getAttribute('data-ball-id');
            console.log(`Controller selected ball: ${ballId}`);
            
            // Trigger the click event
            if (window.shomaSelectBall) {
                window.shomaSelectBall(ballId);
            } else {
                ballOptions[selectedIndex].click();
            }
        }
    }
    
    // Controller input handler
    function handleControllerInput(event) {
        if (!isControllerActive) return;
        
        const now = Date.now();
        if (now - lastInputTime < inputCooldown) return;
        
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            // D-Pad navigation
            let inputDetected = false;
            if (gamepad.buttons[14] && gamepad.buttons[14].pressed) { // D-Pad Left
                selectedIndex = Math.max(0, selectedIndex - 1);
                updateCursorPosition();
                inputDetected = true;
            } else if (gamepad.buttons[15] && gamepad.buttons[15].pressed) { // D-Pad Right
                selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 1);
                updateCursorPosition();
                inputDetected = true;
            } else if (gamepad.buttons[12] && gamepad.buttons[12].pressed) { // D-Pad Up
                if (selectedIndex >= 2) {
                    selectedIndex = Math.max(0, selectedIndex - 2);
                    updateCursorPosition();
                    inputDetected = true;
                }
            } else if (gamepad.buttons[13] && gamepad.buttons[13].pressed) { // D-Pad Down
                if (selectedIndex < 2) {
                    selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 2);
                    updateCursorPosition();
                    inputDetected = true;
                }
            }
            
            // Left stick navigation
            const leftStickX = gamepad.axes[0];
            const leftStickY = gamepad.axes[1];
            const deadzone = 0.3;
            
            if (Math.abs(leftStickX) > deadzone) {
                if (leftStickX > deadzone) { // Right
                    selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 1);
                    updateCursorPosition();
                    inputDetected = true;
                } else if (leftStickX < -deadzone) { // Left
                    selectedIndex = Math.max(0, selectedIndex - 1);
                    updateCursorPosition();
                    inputDetected = true;
                }
            }
            
            if (Math.abs(leftStickY) > deadzone) {
                if (leftStickY < -deadzone) { // Up
                    if (selectedIndex >= 2) {
                        selectedIndex = Math.max(0, selectedIndex - 2);
                        updateCursorPosition();
                        inputDetected = true;
                    }
                } else if (leftStickY > deadzone) { // Down
                    if (selectedIndex < 2) {
                        selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 2);
                        updateCursorPosition();
                        inputDetected = true;
                    }
                }
            }
            
            // Update last input time if any navigation input was detected
            if (inputDetected) {
                lastInputTime = now;
            }
            
            // A button - Select ball
            if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
                selectCurrentBall();
                break;
            }
            
            // B button - Auto-select Fire Ball
            if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
                console.log('Controller B button pressed - auto-selecting Fire Ball');
                if (window.shomaSelectBall) {
                    window.shomaSelectBall('fire_ball');
                }
                break;
            }
        }
    }
    
    // Start controller support
    function startControllerSupport() {
        isControllerActive = true;
        selectedIndex = 0; // Start with first ball (grass ball)
        updateCursorPosition();
        
        // Start polling for controller input
        const controllerInterval = setInterval(() => {
            handleControllerInput();
            
            // Stop if modal is no longer in DOM
            if (!document.body.contains(modalContainer)) {
                clearInterval(controllerInterval);
                isControllerActive = false;
            }
        }, 100); // Check every 100ms
        
        console.log('Ball selection controller support enabled');
    }
    
    // Keyboard support as backup
    function handleKeyboardInput(event) {
        if (!isControllerActive) return;
        
        switch(event.key) {
            case 'ArrowLeft':
                selectedIndex = Math.max(0, selectedIndex - 1);
                updateCursorPosition();
                event.preventDefault();
                break;
            case 'ArrowRight':
                selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 1);
                updateCursorPosition();
                event.preventDefault();
                break;
            case 'ArrowUp':
                if (selectedIndex >= 2) {
                    selectedIndex = Math.max(0, selectedIndex - 2);
                    updateCursorPosition();
                }
                event.preventDefault();
                break;
            case 'ArrowDown':
                if (selectedIndex < 2) {
                    selectedIndex = Math.min(ballOptions.length - 1, selectedIndex + 2);
                    updateCursorPosition();
                }
                event.preventDefault();
                break;
            case 'Enter':
            case ' ':
                selectCurrentBall();
                event.preventDefault();
                break;
            case 'Escape':
                // Auto-select Fire Ball on escape
                if (window.shomaSelectBall) {
                    window.shomaSelectBall('fire_ball');
                }
                event.preventDefault();
                break;
        }
    }
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Auto-start controller support if controller is connected
    const gamepads = navigator.getGamepads();
    const hasController = Array.from(gamepads).some(gamepad => gamepad !== null);
    
    if (hasController) {
        startControllerSupport();
    } else {
        // Listen for controller connection
        const controllerConnectHandler = (event) => {
            console.log('Controller connected during ball selection');
            startControllerSupport();
            window.removeEventListener('gamepadconnected', controllerConnectHandler);
        };
        window.addEventListener('gamepadconnected', controllerConnectHandler);
    }
    
    // Cleanup function
    window.cleanupBallSelectionController = function() {
        isControllerActive = false;
        document.removeEventListener('keydown', handleKeyboardInput);
        ballOptions.forEach(option => {
            option.classList.remove('controller-selected');
            const cursor = option.querySelector('.controller-ball-cursor');
            if (cursor) cursor.remove();
        });
    };
}

/**
 * Generates a description for the ball throw ability based on the selected ball type
 * @param {string} ballType - The type of ball ('grass_ball', 'fire_ball', 'heavy_ball', 'water_ball')
 * @param {Character} character - The character using the ability
 * @returns {string} The generated description
 */
function generateBallDescription(ballType, character) {
    try {
        let baseDescription = '';
        let talentEffects = '';
        
        switch (ballType) {
            case 'grass_ball':
                baseDescription = 'Throw a Grass Ball that heals the target for 300 HP.';
                if (character.hasTalent && character.hasTalent('enhanced_grass_ball')) {
                    talentEffects += ' <span class="talent-effect healing">Verdant Recovery:</span> Heals 250% more on buffed targets.';
                }
                if (character.hasTalent && character.hasTalent('healing_mastery')) {
                    talentEffects += ' <span class="talent-effect healing">Healing Mastery:</span> +20% healing power.';
                }
                if (character.hasTalent && character.hasTalent('grass_growth')) {
                    talentEffects += ' <span class="talent-effect healing">Grass Growth:</span> Applies delayed healing buff (2% max HP after 2 turns).';
                }
                if (character.hasTalent && character.hasTalent('magical_empowerment')) {
                    talentEffects += ' <span class="talent-effect damage">Magical Empowerment:</span> Grants +30% Magical Damage for 3 turns.';
                }
                break;
                
            case 'fire_ball':
                baseDescription = 'Throw a Fire Ball that deals 600 + 2% target max HP magical damage.';
                if (character.hasTalent && character.hasTalent('fire_ball_burn')) {
                    talentEffects += ' <span class="talent-effect damage">Scorching Flames:</span> Applies Burn for 3 turns.';
                }
                if (character.hasTalent && character.hasTalent('fire_ball_magical_scaling')) {
                    talentEffects += ' <span class="talent-effect damage">Infernal Magic:</span> Scales with 100% Magical Damage.';
                }
                if (character.hasTalent && character.hasTalent('devastating_power')) {
                    talentEffects += ' <span class="talent-effect damage">Devastating Power:</span> All damage is doubled.';
                }
                break;
                
            case 'heavy_ball':
                baseDescription = 'Throw a Heavy Ball that deals 400 physical damage and reduces the target\'s overall damage output by 20% for 2 turns.';
                if (character.hasTalent && character.hasTalent('heavy_ball_cooldown_mastery')) {
                    talentEffects += ' <span class="talent-effect utility">Heavy Ball Mastery:</span> Cooldown reduced to 1.';
                }
                if (character.hasTalent && character.hasTalent('heavy_ball_bounce')) {
                    talentEffects += ' <span class="talent-effect damage">Rebounding Impact:</span> Bounces to an additional enemy.';
                }
                if (character.hasTalent && character.hasTalent('devastating_power')) {
                    talentEffects += ' <span class="talent-effect damage">Devastating Power:</span> All damage is doubled.';
                }
                break;
                
            case 'water_ball':
                baseDescription = 'Throw a Water Ball that deals 350 physical damage to the target and 200 splash damage to 2 other enemies.';
                if (character.hasTalent && character.hasTalent('water_ball_splash_power')) {
                    talentEffects += ' <span class="talent-effect damage">Tidal Devastation:</span> Splash damage increased by 300.';
                }
                if (character.hasTalent && character.hasTalent('water_ball_magical_scaling')) {
                    talentEffects += ' <span class="talent-effect damage">Tsunami Force:</span> Scales with 100% Magical Damage.';
                }
                if (character.hasTalent && character.hasTalent('water_ball_double_cast')) {
                    talentEffects += ' <span class="talent-effect damage">Tidal Echo:</span> 50% chance to trigger twice.';
                }
                if (character.hasTalent && character.hasTalent('devastating_power')) {
                    talentEffects += ' <span class="talent-effect damage">Devastating Power:</span> All damage is doubled.';
                }
                break;
                
            default:
                baseDescription = 'Throw a ball with various effects depending on the type selected.';
                break;
        }
        
        // Add Compassionate Resonance effect if active
        if (character.hasTalent && character.hasTalent('compassionate_resonance')) {
            talentEffects += ' <span class="talent-effect healing">Compassionate Resonance:</span> Heals random ally for 50% of damage dealt.';
        }
        
        // Elemental Juggling talent (does not end turn after using a ball)
        if ((character.hasTalent && character.hasTalent('elemental_juggling')) || character.ballFollowupEnabled) {
            talentEffects += ' <span class="talent-effect utility">Elemental Juggling:</span> Using Ball abilities does <strong>NOT</strong> end your turn.';
        }
        
        return baseDescription + talentEffects;
        
    } catch (error) {
        console.error('Error generating ball description:', error);
        return 'Throw a ball with various effects.';
    }
}

/**
 * Sets up the selected ball type for Schoolboy Shoma
 * @param {Character} shomaCharacter - The Schoolboy Shoma character instance
 * @param {string} ballId - The ball type to select
 */
function selectBall(shomaCharacter, ballId) {
    try {
        console.log(`[Ball Selection] Setting up ${ballId} for ${shomaCharacter.name}`);
        
        // Find the Ball Throw ability - it might be ball_throw or ball_throw_* if already selected once
        const ballThrowIndex = shomaCharacter.abilities.findIndex(ability => 
            ability.id === 'ball_throw' || ability.id.startsWith('ball_throw_')
        );
        
        if (ballThrowIndex === -1) {
            console.error('Ball Throw ability not found for Schoolboy Shoma');
            return;
        }
        
        // Get the original ability
        const ballThrowAbility = shomaCharacter.abilities[ballThrowIndex];
        
        // Get the icon based on ball type
        const ballIcon = getIconForBallType(ballId);
        
        // Update the ability with the new ball type
        ballThrowAbility.id = `ball_throw_${ballId}`;
        ballThrowAbility.icon = ballIcon;
        ballThrowAbility.ballType = ballId;
        
        // Initialize Elemental Juggling talent properties
        const hasElementalJuggling = shomaCharacter.hasTalent && shomaCharacter.hasTalent('elemental_juggling');
        if (hasElementalJuggling) {
            shomaCharacter.ballFollowupEnabled = true;
            console.log(`[Elemental Juggling] Initialized for ${shomaCharacter.name}`);
        } else {
            shomaCharacter.ballFollowupEnabled = false;
            // Ensure ballFollowupRemaining is reset when talent is not active
            shomaCharacter.ballFollowupRemaining = 0;
        }
        
        // Elemental Juggling – prepare follow-up tracking ONLY if talent is active
        if (hasElementalJuggling && shomaCharacter.ballFollowupEnabled) {
            // Initialise remaining follow-up only if not already in a combo
            if (!shomaCharacter.ballFollowupRemaining || shomaCharacter.ballFollowupRemaining <= 0) {
                shomaCharacter.ballFollowupRemaining = 1; // one extra ball this turn
                console.log(`[Elemental Juggling] Set follow-up remaining to 1 for ${shomaCharacter.name}`);
            }
        } else {
            // Ensure no follow-ups if talent is not active
            shomaCharacter.ballFollowupRemaining = 0;
            console.log(`[Elemental Juggling] No follow-ups available for ${shomaCharacter.name} (talent not active)`);
        }
        
        // Set up the ability effect based on ball type
        ballThrowAbility.effect = (caster, target) => {
            return executeBallThrow(caster, target, ballId);
        };

        // Apply Heavy Ball Mastery talent: cooldown reduction
        if (ballId === 'heavy_ball') {
            const hasHeavyBallMastery = shomaCharacter.hasTalent && shomaCharacter.hasTalent('heavy_ball_cooldown_mastery');
            ballThrowAbility.cooldown = hasHeavyBallMastery ? 1 : 3;
            ballThrowAbility.currentCooldown = 0; // reset after selection to avoid leftover longer cooldown
            console.log(`[Heavy Ball Mastery] Set Heavy Ball cooldown to ${ballThrowAbility.cooldown} for ${shomaCharacter.name}`);
        }
        
        // Set the correct target type based on ball type
        if (ballId === 'grass_ball') {
            ballThrowAbility.targetType = 'ally_or_self'; // Grass ball can target allies and self
        } else {
            ballThrowAbility.targetType = 'enemy'; // Other balls target enemies
        }
        
        // Update ability description
        ballThrowAbility.description = generateBallDescription(ballId, shomaCharacter);
        
        console.log(`[Ball Selection] Successfully set up ${ballId} for ${shomaCharacter.name}`);
        
        // Update the UI to reflect the new ball
        refreshAbilityIcon(shomaCharacter, ballThrowIndex);
        
        // Also refresh the ability description in the UI
        refreshAbilityDescription(shomaCharacter, ballThrowIndex);
        
        // Force a full character UI update to ensure everything is refreshed
        refreshCharacterUI(shomaCharacter);
        
        // Add a delayed refresh to ensure UI updates after modal cleanup
        setTimeout(() => {
            refreshAbilityIcon(shomaCharacter, ballThrowIndex);
            refreshAbilityDescription(shomaCharacter, ballThrowIndex);
            refreshCharacterUI(shomaCharacter);
            console.log(`[Ball Selection] Delayed UI refresh completed for ${ballId}`);
        }, 100);
        
    } catch (error) {
        console.error('Error selecting ball:', error);
    }
}

/**
 * Executes the ball throw ability with the specified ball type
 * @param {Character} caster - The character using the ability
 * @param {Character} target - The target character
 * @param {string} ballType - The type of ball being thrown
 */
function executeBallThrow(caster, target, ballType) {
    try {
        console.log(`[Ball Throw] ${caster.name} using ${ballType} on ${target.name}`);
        
        // Get the main target (for water ball splash calculations)
        const mainTarget = target;
        
        // Helper to manage Elemental Juggling follow-up logic
        // This only applies to Ball abilities, not other abilities like Boink or buffs
        function prepareFollowUpResult(resultObj = {}) {
            const res = resultObj || {};

            // Check if Elemental Juggling talent is active AND this is specifically a Ball ability
            const hasElementalJuggling = caster.hasTalent && caster.hasTalent('elemental_juggling');
            const isBallAbility = true; // This function is only called for Ball abilities
            const followupsRemaining = caster.ballFollowupRemaining || 0;
            
            // Check for Grass Ball Flow talent (specifically for Grass Ball)
            const hasGrassBallFlow = caster.hasTalent && caster.hasTalent('grass_ball_flow');
            const isGrassBall = ballType === 'grass_ball';
            
            console.log(`[Elemental Juggling Debug] hasElementalJuggling: ${hasElementalJuggling}, isBallAbility: ${isBallAbility}, followupsRemaining: ${followupsRemaining}`);
            console.log(`[Grass Ball Flow Debug] hasGrassBallFlow: ${hasGrassBallFlow}, isGrassBall: ${isGrassBall}`);
            console.log(`[Elemental Juggling Debug] Condition check: ${hasElementalJuggling} && ${isBallAbility} && ${followupsRemaining} > 0 = ${hasElementalJuggling && isBallAbility && followupsRemaining > 0}`);
            console.log(`[Grass Ball Flow Debug] Condition check: ${hasGrassBallFlow} && ${isGrassBall} = ${hasGrassBallFlow && isGrassBall}`);
            
            if (hasElementalJuggling && isBallAbility && followupsRemaining > 0) {
                // Consume one queued follow-up
                caster.ballFollowupRemaining--;

                // Re-open ball selection shortly after current animation finishes
                setTimeout(() => {
                    if (typeof showBallSelectionForShoma === 'function') {
                        showBallSelectionForShoma(caster);
                    }
                }, 150);
            } else if (hasGrassBallFlow && isGrassBall) {
                // Grass Ball Flow talent prevents turn ending for Grass Ball specifically
                if (window.gameManager) {
                    window.gameManager.preventTurnEndFlag = true;
                    console.log(`[Grass Ball Flow] ${caster.name}'s turn continues after Grass Ball!`);
                    
                    // Add battle log entry
                    if (window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(
                            `${caster.name}'s Grass Ball Flow maintains healing rhythm!`,
                            'system-update'
                        );
                    }
                }
            } else {
                // Normal turn ending - ensure turn ends properly
                if (window.gameManager) {
                    window.gameManager.preventTurnEndFlag = false;
                    console.log(`[Ball Throw] Normal turn ending for ${caster.name} (Elemental Juggling: ${hasElementalJuggling}, Grass Ball Flow: ${hasGrassBallFlow}, Follow-ups: ${followupsRemaining})`);
                }
            }

            return res;
        }
        
        // Define the ball effects based on type
        switch (ballType) {
            case 'grass_ball':
                console.log(`[Grass Ball] Healing ${target.name} with Grass Ball`);
                
                // Calculate base healing
                let grassHealAmount = 300;
                
                // Check for Healing Mastery talent (healingPower stat is handled by the healing system)
                const hasHealingMastery = caster.hasTalent && caster.hasTalent('healing_mastery');
                if (hasHealingMastery) {
                    console.log(`[Healing Mastery] Active - healingPower: ${caster.stats.healingPower} (20% increase)`);
                    
                    // Show Healing Mastery VFX
                    if (window.showHealingMasteryVFX && typeof window.showHealingMasteryVFX === 'function') {
                        window.showHealingMasteryVFX(caster, target);
                    }
                }
                
                // Check for Enhanced Grass Ball talent (250% more healing on buffed targets)
                const hasEnhancedGrassBall = caster.hasTalent && caster.hasTalent('enhanced_grass_ball');
                if (hasEnhancedGrassBall && target.buffs && target.buffs.length > 0) {
                    grassHealAmount = Math.floor(grassHealAmount * 3.5); // 250% more = 350% total
                    console.log(`[Enhanced Grass Ball] Target has buffs, increased healing to ${grassHealAmount}`);
                    
                    // Show enhanced grass ball VFX
                    if (window.showEnhancedGrassballVFX && typeof window.showEnhancedGrassballVFX === 'function') {
                        window.showEnhancedGrassballVFX(caster, target);
                    }
                    
                    // Add battle log entry
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(
                            `${caster.name}'s Verdant Recovery draws power from ${target.name}'s buffs!`,
                            'talent-effect'
                        );
                    }
                }
                
                // Apply healing
                const healResult = target.heal(grassHealAmount, caster, { abilityId: 'ball_throw_grass' });
                
                // Check for Grass Growth talent (delayed healing buff)
                const hasGrassGrowth = caster.hasTalent && caster.hasTalent('grass_growth');
                if (hasGrassGrowth) {
                    console.log(`[Grass Growth] Applying delayed healing buff to ${target.name}`);
                    
                    // Create Grass Growth buff
                    const grassGrowthBuff = {
                        id: 'grass_growth',
                        name: 'Grass Growth',
                        duration: 2,
                        source: 'grass_growth',
                        description: 'Growing grass will heal you for 2% of max HP',
                        onTurnStart: function(character) {
                            console.log(`[Grass Growth] onTurnStart triggered for ${character.name}`);
                            
                            // Calculate healing amount (2% of max HP)
                            const healAmount = Math.floor(character.stats.maxHp * 0.02);
                            
                            // Apply healing with caster's healing power
                            const delayedHealResult = character.heal(healAmount, caster, { 
                                abilityId: 'grass_growth_heal',
                                isPassiveHealing: true 
                            });
                            
                            // Show Grass Growth VFX
                            if (window.showGrassGrowthVFX && typeof window.showGrassGrowthVFX === 'function') {
                                window.showGrassGrowthVFX(character, healAmount);
                            }
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `🌱 Grass Growth heals ${character.name} for ${delayedHealResult.healAmount} HP!`,
                                    'talent-effect'
                                );
                            }
                        }
                    };
                    
                    target.addBuff(grassGrowthBuff);
                    
                    // Show initial Grass Growth VFX
                    if (window.showGrassGrowthInitialVFX && typeof window.showGrassGrowthInitialVFX === 'function') {
                        window.showGrassGrowthInitialVFX(caster, target);
                    }
                    
                    // Add battle log entry
                    if (window.gameManager && window.gameManager.addLogEntry) {
                        window.gameManager.addLogEntry(
                            `🌱 Grass Growth applied to ${target.name}! Will heal in 2 turns.`,
                            'talent-effect'
                        );
                    }
                }
                
                // Check for Magical Empowerment talent (+30% magical damage for 3 turns)
                const hasMagicalEmpowerment = caster.hasTalent && caster.hasTalent('magical_empowerment');
                if (hasMagicalEmpowerment) {
                    console.log(`[Magical Empowerment] Applying magical damage buff to ${target.name}`);
                    
                    // Create Magical Empowerment buff
                    const magicalEmpowermentBuff = {
                        id: 'magical_empowerment',
                        name: 'Magical Empowerment',
                        duration: 3,
                        source: 'magical_empowerment',
                        description: '+30% Magical Damage from nature\'s energy',
                        statModifiers: [{
                            stat: 'magicalDamage',
                            value: Math.floor(target.stats.magicalDamage * 0.3),
                            operation: 'add'
                        }],
                        onApplied: function(character) {
                            console.log(`[Magical Empowerment] Applied to ${character.name}`);
                            
                            // Show Magical Empowerment VFX
                            if (window.showMagicalEmpowermentVFX && typeof window.showMagicalEmpowermentVFX === 'function') {
                                window.showMagicalEmpowermentVFX(caster, character);
                            }
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `✨ ${character.name} is empowered with +30% Magical Damage!`,
                                    'talent-effect'
                                );
                            }
                        },
                        onRemoved: function(character) {
                            console.log(`[Magical Empowerment] Removed from ${character.name}`);
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `✨ ${character.name}'s Magical Empowerment fades.`,
                                    'system'
                                );
                            }
                        }
                    };
                    
                    target.addBuff(magicalEmpowermentBuff);
                }
                
                // Track ability usage
                if (window.statisticsManager) {
                    window.statisticsManager.recordHealingDone(caster, target, healResult.healAmount, healResult.isCritical, 'ball_throw_grass', 'direct');
                }
                
                // Check for Healing Cascade talent (bouncing to other allies)
                const hasGrassBallBounce = caster.hasTalent && caster.hasTalent('grass_ball_bounce');
                if (hasGrassBallBounce) {
                    console.log(`[Healing Cascade] Checking for bounces after healing ${target.name}`);
                    
                    // Get all allies (excluding the original target)
                    const allies = [];
                    if (window.gameManager && window.gameManager.gameState) {
                        if (caster.isAI) {
                            allies.push(...window.gameManager.gameState.aiCharacters.filter(char => 
                                char !== caster && char !== target && !char.isDead()
                            ));
                        } else {
                            allies.push(...window.gameManager.gameState.playerCharacters.filter(char => 
                                char !== caster && char !== target && !char.isDead()
                            ));
                        }
                    }
                    
                    if (allies.length > 0) {
                        // Check 75% chance for each ally independently
                        executeGrassBallBounceToAllies(caster, allies, [target]); // Pass already healed targets
                    }
                }
                
                // Elemental Juggling VFX
                if (caster.ballFollowupEnabled && window.showElementalJugglingVFX) {
                    window.showElementalJugglingVFX(caster);
                }
                
                // Grass Ball Flow VFX
                const hasGrassBallFlow = caster.hasTalent && caster.hasTalent('grass_ball_flow');
                if (hasGrassBallFlow && window.showGrassBallFlowVFX) {
                    window.showGrassBallFlowVFX(caster);
                }
                
                return prepareFollowUpResult(healResult);
                
            case 'fire_ball':
                console.log(`[Fire Ball] Dealing magical damage to ${target.name} with Fire Ball`);
                
                // Calculate base damage
                let fireBallDamage = 600 + (target.stats.maxHp * 0.02); // Base damage + 2% target max HP
                
                // Apply Fire Ball Magical Scaling talent
                const hasFireBallMagicalScaling = caster.hasTalent && caster.hasTalent('fire_ball_magical_scaling');
                if (hasFireBallMagicalScaling) {
                    const magicalDamageBonus = caster.stats.magicalDamage;
                    fireBallDamage += magicalDamageBonus;
                    console.log(`[Infernal Magic] Added ${magicalDamageBonus} magical damage (100% of ${caster.stats.magicalDamage})`);
                    
                    // Show Infernal Magic VFX
                    if (window.showInfernalMagicVFX) {
                        window.showInfernalMagicVFX(caster, target);
                    }
                    
                    addLogEntry(`🔥 Infernal Magic activated! Enhanced with magical power!`, 'talent-activation');
                }
                
                // Apply Devastating Power talent
                const hasDevastatingPowerFire = caster.hasTalent && caster.hasTalent('devastating_power');
                if (hasDevastatingPowerFire) {
                    const originalFireDamage = fireBallDamage;
                    fireBallDamage *= 2;
                    console.log(`[Devastating Power] Doubled fire damage: ${originalFireDamage} → ${fireBallDamage}`);
                    
                    // Show Devastating Power VFX
                    if (window.showDevastatingPowerVFX) {
                        window.showDevastatingPowerVFX(caster, target, originalFireDamage, fireBallDamage);
                    }
                    
                    addLogEntry(`💥 Devastating Power activated! Fire damage doubled!`, 'talent-activation');
                }
                
                const fireBallResult = target.applyDamage(fireBallDamage, 'magical', caster, { abilityId: 'ball_throw_fire' });
                
                // Handle Compassionate Resonance talent
                if (caster.hasTalent && caster.hasTalent('compassionate_resonance')) {
                    const fireResonanceHeal = Math.floor(fireBallResult.damage * 0.5);
                    if (fireResonanceHeal > 0) {
                        healRandomAlly(caster, fireResonanceHeal, 'compassionate_resonance');
                    }
                }
                
                let fireBallLogMessage = `${caster.name} used Fire Ball on ${target.name}, dealing ${fireBallResult.damage} magical damage`;
                if (hasFireBallMagicalScaling) {
                    fireBallLogMessage += ` (Enhanced with Infernal Magic)`;
                }
                if (hasDevastatingPowerFire) {
                    fireBallLogMessage += ` (Doubled by Devastating Power)`;
                }
                fireBallLogMessage += `.`;
                addLogEntry(fireBallLogMessage);
                
                // Apply Fire Ball Burn talent
                const hasFireBallBurn = caster.hasTalent && caster.hasTalent('fire_ball_burn');
                if (hasFireBallBurn) {
                    const burnDebuff = {
                        id: 'fire_ball_burn',
                        name: 'Fire Ball Burn',
                        duration: 3,
                        damagePerTurn: 20,
                        source: 'fire_ball_burn',
                        description: 'Burning damage from Fire Ball attack',
                        onTurnStart: function(character) {
                            console.log(`[Fire Ball Burn] onTurnStart triggered for ${character.name}, dealing ${this.damagePerTurn} damage`);
                            
                            let burnDamage = this.damagePerTurn;
                            
                            // Apply Devastating Power to burn damage if active
                            if (caster.hasTalent && caster.hasTalent('devastating_power')) {
                                burnDamage *= 2;
                                console.log(`[Devastating Power] Burn damage doubled: ${this.damagePerTurn} → ${burnDamage}`);
                            }
                            
                            const damageResult = character.applyDamage(burnDamage, 'magical', null, { abilityId: 'fire_ball_burn_dot' });
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(`${character.name} takes ${damageResult.damage} burn damage from Fire Ball!`, 'debuff');
                            }
                            
                            // Show burn damage VFX
                            if (window.showFireBallBurnVFX) {
                                window.showFireBallBurnVFX(character, burnDamage);
                            }
                        }
                    };
                    
                    target.addDebuff(burnDebuff);
                    console.log(`[Fire Ball Burn] Applied burn to ${target.name} for 3 turns (20 damage/turn)`);
                    addLogEntry(`🔥 Scorching Flames activated! ${target.name} is burning! (20 damage/turn for 3 turns)`, 'talent-activation');
                }
                
                // Play Fire Ball sound
                const playSoundFire = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                playSoundFire('sounds/shoma_fire2.mp3');
                
                // Track ability usage
                if (window.statisticsManager) {
                    window.statisticsManager.recordDamageDealt(caster, target, Math.floor(fireBallDamage), false, 'ball_throw_fire', 'ability');
                }
                
                // Elemental Juggling VFX
                if (caster.ballFollowupEnabled && window.showElementalJugglingVFX) {
                    window.showElementalJugglingVFX(caster);
                }
                
                return prepareFollowUpResult({ damage: Math.floor(fireBallDamage), isCritical: false });
                
            case 'heavy_ball':
                console.log(`[Heavy Ball] Dealing physical damage to ${target.name} with Heavy Ball`);
                
                // Calculate base damage
                let heavyBallDamage = 400;
                
                // Apply Devastating Power talent
                const hasDevastatingPowerHeavy = caster.hasTalent && caster.hasTalent('devastating_power');
                if (hasDevastatingPowerHeavy) {
                    const originalHeavyDamage = heavyBallDamage;
                    heavyBallDamage *= 2;
                    console.log(`[Devastating Power] Doubled heavy damage: ${originalHeavyDamage} → ${heavyBallDamage}`);
                    
                    // Show Devastating Power VFX
                    if (window.showDevastatingPowerVFX) {
                        window.showDevastatingPowerVFX(caster, target, originalHeavyDamage, heavyBallDamage);
                    }
                    
                    addLogEntry(`💥 Devastating Power activated! Heavy damage doubled!`, 'talent-activation');
                }
                
                const heavyResult = target.applyDamage(heavyBallDamage, 'physical', caster, { abilityId: 'ball_throw_heavy' });
                
                // Handle Compassionate Resonance talent
                if (caster.hasTalent && caster.hasTalent('compassionate_resonance')) {
                    const heavyResonanceHeal = Math.floor(heavyResult.damage * 0.5);
                    if (heavyResonanceHeal > 0) {
                        healRandomAlly(caster, heavyResonanceHeal, 'compassionate_resonance');
                    }
                }
                
                let heavyLogMessage = `${caster.name} used Heavy Ball on ${target.name}, dealing ${heavyResult.damage} physical damage`;
                if (hasDevastatingPowerHeavy) {
                    heavyLogMessage += ` (Doubled by Devastating Power)`;
                }
                heavyLogMessage += `.`;
                addLogEntry(heavyLogMessage);
                
                // Factory function to create the correct Heavy Ball debuff instance
                const createHeavyBallDebuff = () => {
                    return {
                        id: 'heavy_ball_debuff',
                        name: 'Heavy Ball Debuff',
                        duration: 2,
                        icon: getIconForBallType('heavy_ball'),
                        source: 'heavy_ball',
                        description: 'Damage output reduced by 20%',
                        effects: { damageReductionPercent: 0.20 },
                        onApply: function(character) {
                            console.log(`[Heavy Ball Debuff] ${character.name}'s outgoing damage reduced by 20% for 2 turns`);
                        },
                        onRemove: function(character) {
                            console.log(`[Heavy Ball Debuff] Damage reduction expired for ${character.name}`);
                        }
                    };
                };

                // Apply debuff to primary target
                target.addDebuff(createHeavyBallDebuff());
                addLogEntry(`${target.name}'s damage output reduced by 20% for 2 turns.`);

                // Play Heavy Ball sound
                const playSoundHeavy = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                playSoundHeavy('sounds/shoma_heavy2.mp3');
                
                // Track ability usage
                if (window.statisticsManager) {
                    window.statisticsManager.recordDamageDealt(caster, target, heavyBallDamage, false, 'ball_throw_heavy', 'ability');
                }
                
                // Elemental Juggling VFX
                if (caster.ballFollowupEnabled && window.showElementalJugglingVFX) {
                    window.showElementalJugglingVFX(caster);
                }
                
                // Handle Rebounding Impact (Heavy Ball Bounce) talent
                const hasHeavyBallBounce = caster.hasTalent && caster.hasTalent('heavy_ball_bounce');
                if (hasHeavyBallBounce) {
                    // Gather enemy characters (opposite team of caster) excluding original target and dead characters
                    let enemies = [];
                    if (window.gameManager && window.gameManager.gameState) {
                        if (caster.isAI) {
                            enemies = window.gameManager.gameState.playerCharacters;
                        } else {
                            enemies = window.gameManager.gameState.aiCharacters;
                        }
                    }
                    const possibleTargets = enemies.filter(ch => ch !== target && !ch.isDead());
                    if (possibleTargets.length > 0) {
                        const secondaryTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                        console.log(`[Heavy Ball Bounce] Bouncing to secondary target: ${secondaryTarget.name}`);
                        // Show ball animation towards new target
                        showBallThrowAnimation('heavy_ball', caster, secondaryTarget);
                        // Apply damage
                        const secondaryResult = secondaryTarget.applyDamage(heavyBallDamage, 'physical', caster, { abilityId: 'ball_throw_heavy_bounce' });
                        // Apply same debuff (new independent instance)
                        secondaryTarget.addDebuff(createHeavyBallDebuff());
                        // Log entry
                        addLogEntry(`${secondaryTarget.name} is hit by the rebounding Heavy Ball, taking ${secondaryResult.damage} physical damage and suffering Reduced Damage debuff!`);
                        // Stats tracking
                        if (window.statisticsManager) {
                            window.statisticsManager.recordDamageDealt(caster, secondaryTarget, heavyBallDamage, false, 'ball_throw_heavy_bounce', 'ability');
                        }
                    }
                }
                
                return prepareFollowUpResult(heavyResult);
                
            case 'water_ball':
                console.log(`[Water Ball] Dealing AoE damage with Water Ball`);
                
                // Check for Water Ball Double Cast talent
                const hasWaterBallDoubleCast = caster.hasTalent && caster.hasTalent('water_ball_double_cast');
                
                // Define the water ball attack function
                const executeWaterBallAttack = (isSecondCast = false) => {
                    // Play the ball throw animation (using mainTarget)
                    showBallThrowAnimation('water_ball', caster, mainTarget);
                    
                    // Apply damage to main target
                    let damage = 550;
                    
                    // Apply Tsunami Force talent (100% magical damage scaling)
                    const hasWaterBallMagicalScaling = caster.hasTalent && caster.hasTalent('water_ball_magical_scaling');
                    if (hasWaterBallMagicalScaling) {
                        const magicalDamageBonus = caster.stats.magicalDamage;
                        damage += magicalDamageBonus;
                        console.log(`[Tsunami Force] Added ${magicalDamageBonus} magical damage to main target (100% of ${caster.stats.magicalDamage})`);
                        
                        // Show Tsunami Force VFX
                        if (window.showTsunamiForceVFX) {
                            window.showTsunamiForceVFX(caster, mainTarget);
                        }
                    }
                    
                    // Apply Devastating Power talent
                    const hasDevastatingPowerWater = caster.hasTalent && caster.hasTalent('devastating_power');
                    if (hasDevastatingPowerWater) {
                        const originalDamage = damage;
                        damage *= 2;
                        console.log(`[Devastating Power] Doubled water damage: ${originalDamage} → ${damage}`);
                        
                        // Show Devastating Power VFX
                        if (window.showDevastatingPowerVFX) {
                            window.showDevastatingPowerVFX(caster, mainTarget, originalDamage, damage);
                        }
                        
                        addLogEntry(`💥 Devastating Power activated! Water damage doubled!`, 'talent-activation');
                    }
                    
                    const result = mainTarget.applyDamage(damage, 'physical', caster, { abilityId: 'ball_throw_water' });
                    
                    // Handle Compassionate Resonance talent
                    if (caster.hasTalent && caster.hasTalent('compassionate_resonance')) {
                        const waterResonanceHeal = Math.floor(result.damage * 0.5);
                        if (waterResonanceHeal > 0) {
                            healRandomAlly(caster, waterResonanceHeal, 'compassionate_resonance');
                        }
                    }
                    
                    let waterLogMessage = `${caster.name} used Water Ball on ${mainTarget.name}, dealing ${result.damage} damage`;
                    if (hasWaterBallMagicalScaling) {
                        waterLogMessage += ` (Enhanced with magical tsunami force)`;
                    }
                    if (hasDevastatingPowerWater) {
                        waterLogMessage += ` (Doubled by Devastating Power)`;
                    }
                    if (isSecondCast) {
                        waterLogMessage += ` (Tidal Echo triggered!)`;
                    }
                    waterLogMessage += `.`;
                    addLogEntry(waterLogMessage);
                    
                    // Play Water Ball sound
                    const playSoundWater = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundWater('sounds/shoma_water2.mp3');
                    
                    // Apply splash damage to all other enemies
                    let splashDamage = 180;
                    
                    // Check for Water Ball Splash Power talent
                    const hasWaterBallSplashPower = caster.hasTalent && caster.hasTalent('water_ball_splash_power');
                    if (hasWaterBallSplashPower) {
                        splashDamage += 300; // Increase splash damage by 300
                        addLogEntry(`🌊 Tidal Devastation activated! Enhanced splash damage!`, 'talent-activation');
                    }
                    
                    // Apply Tsunami Force talent to splash damage too
                    if (hasWaterBallMagicalScaling) {
                        const magicalSplashBonus = caster.stats.magicalDamage;
                        splashDamage += magicalSplashBonus;
                        console.log(`[Tsunami Force] Added ${magicalSplashBonus} magical damage to splash (100% of ${caster.stats.magicalDamage})`);
                        addLogEntry(`🌀 Tsunami Force enhances splash with magical power!`, 'talent-activation');
                    }
                    
                    // Apply Devastating Power to splash damage too
                    if (hasDevastatingPowerWater) {
                        const originalSplashDamage = splashDamage;
                        splashDamage *= 2;
                        console.log(`[Devastating Power] Doubled splash damage: ${originalSplashDamage} → ${splashDamage}`);
                    }
                    
                    const gameManager = window.gameManager;
                    
                    if (gameManager && gameManager.gameState && gameManager.gameState.aiCharacters) {
                        let splashCount = 0;
                        gameManager.gameState.aiCharacters.forEach(enemy => {
                            if (enemy !== mainTarget && !enemy.isDead()) {
                                const splashResult = enemy.applyDamage(splashDamage, 'physical', caster, { abilityId: 'ball_throw_water' });
                                addLogEntry(`Splash damage hits ${enemy.name} for ${splashResult.damage} physical damage.`);
                                splashCount++;
                                
                                // Add Splash VFX for secondary targets
                                const enemyElement = document.getElementById(`character-${enemy.id || enemy.instanceId}`);
                                if (enemyElement) {
                                    // Create splash VFX elements for secondary targets
                                    const splashVfx = document.createElement('div');
                                    splashVfx.className = 'water-splash-aoe';
                                    enemyElement.appendChild(splashVfx);
                                    
                                    // Remove VFX after animation completes
                                    setTimeout(() => {
                                        const splashElements = enemyElement.querySelectorAll('.water-splash-aoe');
                                        splashElements.forEach(el => el.remove());
                                    }, 800);
                                }
                                
                                // Check if enemy died from splash damage
                                if (enemy.isDead()) {
                                    addLogEntry(`${enemy.name} has been defeated!`);
                                }
                            }
                        });
                        
                        if (splashCount === 0) {
                            addLogEntry(`No additional enemies for splash damage.`);
                        }
                    }
                    
                    // Check if main target died from this damage
                    if (mainTarget.isDead()) {
                        addLogEntry(`${mainTarget.name} has been defeated!`);
                    }
                };
                
                // Execute the first attack
                executeWaterBallAttack(false);
                
                // Check for double cast
                if (hasWaterBallDoubleCast && Math.random() < 0.5) {
                    console.log(`[Tidal Echo] Water Ball double cast triggered!`);
                    
                    // Show Tidal Echo VFX
                    if (window.showTidalEchoVFX) {
                        window.showTidalEchoVFX(caster, mainTarget);
                    }
                    
                    addLogEntry(`🌊 Tidal Echo activated! Water Ball casts twice!`, 'talent-activation');
                    
                    // Execute the second attack after a short delay
                    setTimeout(() => {
                        executeWaterBallAttack(true);
                    }, 500);
                }
                
                // Elemental Juggling VFX (trigger once per primary cast)
                if (caster.ballFollowupEnabled && window.showElementalJugglingVFX) {
                    window.showElementalJugglingVFX(caster);
                }
                
                return prepareFollowUpResult({ success: true });
                
            default:
                console.error(`Unknown ball type selected: ${ballType}`);
                return;
        }
        
        // Update the ability's icon property
        ballThrowAbility.icon = ballIcon;
        
        // Use the dedicated function to refresh the ability icon
        refreshAbilityIcon(shomaCharacter, ballThrowIndex);
        
        // Apply Arcane Mastery talent bonus if active
        if (shomaCharacter.hasTalent && shomaCharacter.hasTalent('arcane_mastery')) {
            const arcaneMasteryBonus = 125;
            shomaCharacter.stats.magicalDamage = (shomaCharacter.stats.magicalDamage || 0) + arcaneMasteryBonus;
            shomaCharacter.baseStats.magicalDamage = (shomaCharacter.baseStats.magicalDamage || 0) + arcaneMasteryBonus;
            console.log(`[Arcane Mastery] Applied +${arcaneMasteryBonus} magical damage to ${shomaCharacter.name}. New magical damage: ${shomaCharacter.stats.magicalDamage}`);
            
            // Show Arcane Mastery VFX
            showArcaneMasteryVFX(shomaCharacter);
        }
        
        console.log(`Schoolboy Shoma ball selection completed: ${ballType}`);
        if (onSelectionComplete) onSelectionComplete();
        
    } catch (error) {
        console.error('Error selecting ball:', error);
    }
}

/**
 * Get the appropriate icon path for a ball type
 * @param {String} ballId - The ball type ID
 * @returns {String} - Path to the icon image
 */
function getIconForBallType(ballId) {
    switch (ballId) {
        case 'grass_ball':
            return 'Icons/abilities/grassball.jfif';
        case 'fire_ball':
            return 'Icons/abilities/fireball.jfif';
        case 'heavy_ball':
            return 'Icons/abilities/heavyball.jfif';
        case 'water_ball':
            return 'Icons/abilities/waterball.jfif';
        default:
            return 'Icons/abilities/ball_throw.jfif';
    }
}

/**
 * Preload all ball icons to ensure they display quickly when selected
 */
function preloadBallIcons() {
    const ballTypes = ['grass_ball', 'fire_ball', 'heavy_ball', 'water_ball'];
    ballTypes.forEach(ballType => {
        const img = new Image();
        img.src = getIconForBallType(ballType);
        console.log(`Preloading ball icon: ${img.src}`);
    });
}

/**
 * Force refresh the ability UI for a specific character
 * @param {Character} character - The character whose ability UI needs refreshing
 * @param {Number} abilityIndex - The index of the ability to refresh
 */
function refreshAbilityIcon(character, abilityIndex) {
    try {
        const characterId = character.id || character.instanceId;
        const ability = character.abilities[abilityIndex];
        
        if (!ability || !ability.icon) {
            console.warn(`No ability or icon found for index ${abilityIndex}`);
            return;
        }
        
        // Find all possible icon elements and update them
        const selectors = [
            `#character-${characterId} .ability[data-index="${abilityIndex}"] .ability-icon`,
            `#character-${characterId} .ability[data-ability-id="${ability.id}"] .ability-icon`,
            `#character-${characterId} .abilities .ability:nth-child(${abilityIndex + 1}) .ability-icon`,
            `#character-${characterId} .ability-${abilityIndex} .ability-icon`
        ];
        
        let updated = false;
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element && element.tagName === 'IMG') {
                        element.src = ability.icon;
                        element.style.opacity = '0';
                        setTimeout(() => {
                            element.style.opacity = '1';
                        }, 100);
                        updated = true;
                        console.log(`Updated icon via selector: ${selector}`);
                    }
                });
            } catch (selectorError) {
                // Silently continue to next selector
            }
        });
        
        if (!updated) {
            console.warn(`Could not find ability icon element to update for character ${characterId}`);
            
            // Try a general UI refresh as last resort
            if (window.gameManager && window.gameManager.uiManager) {
                if (window.gameManager.uiManager.updateCharacterUI) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                } else if (window.gameManager.uiManager.updateAllCharacterUIs) {
                    window.gameManager.uiManager.updateAllCharacterUIs();
                }
            }
        }
        
    } catch (error) {
        console.error('Error refreshing ability icon:', error);
    }
}

/**
 * Refreshes the ability description in the UI
 * @param {Character} character - The character whose ability to refresh
 * @param {number} abilityIndex - The index of the ability to refresh
 */
function refreshAbilityDescription(character, abilityIndex) {
    try {
        const characterId = character.id || character.instanceId;
        const ability = character.abilities[abilityIndex];
        
        if (!ability) {
            console.warn(`No ability found for index ${abilityIndex}`);
            return;
        }
        
        // Find all possible description elements and update them
        const selectors = [
            `#character-${characterId} .ability[data-index="${abilityIndex}"] .ability-description`,
            `#character-${characterId} .ability[data-ability-id="${ability.id}"] .ability-description`,
            `#character-${characterId} .abilities .ability:nth-child(${abilityIndex + 1}) .ability-description`,
            `#character-${characterId} .ability-${abilityIndex} .ability-description`,
            `#character-${characterId} .ability[data-index="${abilityIndex}"] .ability-tooltip`,
            `#character-${characterId} .ability[data-ability-id="${ability.id}"] .ability-tooltip`
        ];
        
        let updated = false;
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element) {
                        element.innerHTML = ability.description || '';
                        updated = true;
                        console.log(`Updated description via selector: ${selector}`);
                    }
                });
            } catch (selectorError) {
                // Silently continue to next selector
            }
        });
        
        if (!updated) {
            console.warn(`Could not find ability description element to update for character ${characterId}`);
        }
        
    } catch (error) {
        console.error('Error refreshing ability description:', error);
    }
}

/**
 * Forces a complete refresh of the character's UI
 * @param {Character} character - The character whose UI to refresh
 */
function refreshCharacterUI(character) {
    try {
        const characterId = character.id || character.instanceId;
        
        // Try multiple UI update methods
        if (window.gameManager && window.gameManager.uiManager) {
            if (window.gameManager.uiManager.updateCharacterUI) {
                window.gameManager.uiManager.updateCharacterUI(character);
                console.log(`Updated character UI via uiManager.updateCharacterUI for ${characterId}`);
                return;
            } else if (window.gameManager.uiManager.updateAllCharacterUIs) {
                window.gameManager.uiManager.updateAllCharacterUIs();
                console.log(`Updated character UI via uiManager.updateAllCharacterUIs for ${characterId}`);
                return;
            }
        }
        
        // Try global update functions
        if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI(character);
            console.log(`Updated character UI via global updateCharacterUI for ${characterId}`);
            return;
        }
        
        // Try to trigger a custom event for UI refresh
        const refreshEvent = new CustomEvent('characterUIRefresh', {
            detail: { character: character, characterId: characterId }
        });
        document.dispatchEvent(refreshEvent);
        console.log(`Dispatched characterUIRefresh event for ${characterId}`);
        
        // As a last resort, try to find and update the character element directly
        const characterElement = document.getElementById(`character-${characterId}`);
        if (characterElement) {
            // Force a reflow by temporarily changing and restoring a style
            const originalDisplay = characterElement.style.display;
            characterElement.style.display = 'none';
            setTimeout(() => {
                characterElement.style.display = originalDisplay;
                console.log(`Forced character element reflow for ${characterId}`);
            }, 10);
        }
        
    } catch (error) {
        console.error('Error refreshing character UI:', error);
    }
}

/**
 * Creates and plays a ball throwing animation from the caster to the target
 * @param {String} ballType - The type of ball being thrown ('grass_ball', 'fire_ball', 'heavy_ball', 'water_ball')
 * @param {Object} caster - The character throwing the ball
 * @param {Object} target - The character receiving the ball
 */
function showBallThrowAnimation(ballType, caster, target) {
    try {
        // Check if target is defined
        if (!target) {
            console.error('Target is undefined for ball throw animation');
            return;
        }

        // Use instanceId if available
        const casterElementId = caster.instanceId || caster.id;
        const targetElementId = target.instanceId || target.id;
        const casterElement = document.getElementById(`character-${casterElementId}`);
        const targetElement = document.getElementById(`character-${targetElementId}`);
        
        if (!casterElement || !targetElement) {
            console.error(`Could not find elements for ball throw animation. Caster: ${casterElementId} (${casterElement ? 'Found' : 'Not Found'}), Target: ${targetElementId} (${targetElement ? 'Found' : 'Not Found'})`);
            return;
        }
        
        // Get the icon for the ball
        let ballIcon;
        switch (ballType) {
            case 'grass_ball':
                ballIcon = 'Icons/abilities/grassball.jfif';
                break;
            case 'fire_ball':
                ballIcon = 'Icons/abilities/fireball.jfif';
                break;
            case 'heavy_ball':
                ballIcon = 'Icons/abilities/heavyball.jfif';
                break;
            case 'water_ball':
                ballIcon = 'Icons/abilities/waterball.jfif';
                break;
            default:
                ballIcon = 'Icons/abilities/ball_throw.jfif';
                break;
        }
        
        // Get the positions of caster and target
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Calculate the center points
        const casterCenterX = casterRect.left + casterRect.width / 2;
        const casterCenterY = casterRect.top + casterRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        
        // Create the ball element
        const ballElement = document.createElement('div');
        ballElement.style.position = 'fixed';
        ballElement.style.left = `${casterCenterX}px`;
        ballElement.style.top = `${casterCenterY}px`;
        ballElement.style.width = '40px';
        ballElement.style.height = '40px';
        ballElement.style.borderRadius = '50%';
        ballElement.style.backgroundImage = `url('${ballIcon}')`;
        ballElement.style.backgroundSize = 'cover';
        ballElement.style.backgroundPosition = 'center';
        ballElement.style.zIndex = '1000';
        ballElement.style.transform = 'translate(-50%, -50%)';
        ballElement.style.filter = 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))';
        
        // Add ball-specific effects
        switch (ballType) {
            case 'grass_ball':
                ballElement.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.7)';
                break;
            case 'fire_ball':
                ballElement.style.boxShadow = '0 0 15px rgba(255, 87, 34, 0.7)';
                break;
            case 'heavy_ball':
                ballElement.style.boxShadow = '0 0 15px rgba(97, 97, 97, 0.7)';
                break;
            case 'water_ball':
                ballElement.style.boxShadow = '0 0 15px rgba(33, 150, 243, 0.7)';
                break;
        }
        
        // Add the ball to the document
        document.body.appendChild(ballElement);
        
        // Calculate the distance and angle
        const dx = targetCenterX - casterCenterX;
        const dy = targetCenterY - casterCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate the animation duration based on distance
        const speed = 0.5; // pixels per millisecond
        const duration = distance / speed;
        
        // Create and start the animation
        const startTime = performance.now();
        const animateBall = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate current position
            const currentX = casterCenterX + dx * progress;
            const currentY = casterCenterY + dy * progress;
            
            // Add a slight arc to the trajectory
            const arcHeight = distance * 0.2;
            const arcY = Math.sin(progress * Math.PI) * arcHeight;
            
            // Update position
            ballElement.style.left = `${currentX}px`;
            ballElement.style.top = `${currentY - arcY}px`;
            
            // Rotate the ball
            const rotation = progress * 720; // 2 full rotations
            ballElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            // Continue the animation if not done
            if (progress < 1) {
                requestAnimationFrame(animateBall);
            } else {
                // Animation complete, remove the ball
                document.body.removeChild(ballElement);
            }
        };
        
        // Start animation
        requestAnimationFrame(animateBall);
        
    } catch (error) {
        console.error('Error showing ball throw animation:', error);
    }
}

/**
 * Shows the Arcane Mastery VFX when the talent is active
 * @param {Object} character - The character with Arcane Mastery talent
 */
function showArcaneMasteryVFX(character) {
    try {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) {
            console.error('Character element not found for Arcane Mastery VFX');
            return;
        }

        // Create the main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'arcane-mastery-vfx';
        characterElement.appendChild(vfxContainer);

        // Create the rotating aura
        const aura = document.createElement('div');
        aura.className = 'arcane-mastery-aura';
        vfxContainer.appendChild(aura);

        // Create arcane symbols
        const symbolsContainer = document.createElement('div');
        symbolsContainer.className = 'arcane-mastery-symbols';
        vfxContainer.appendChild(symbolsContainer);

        const arcaneSymbols = ['★', '✦', '✧', '✩', '✪', '✫'];
        arcaneSymbols.forEach(symbol => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'arcane-symbol';
            symbolElement.textContent = symbol;
            symbolsContainer.appendChild(symbolElement);
        });

        // Create floating particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'arcane-mastery-particles';
        vfxContainer.appendChild(particlesContainer);

        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'arcane-particle';
            particlesContainer.appendChild(particle);
        }

        // Create floating text
        const floatingText = document.createElement('div');
        floatingText.className = 'arcane-mastery-floating-text';
        floatingText.textContent = '+125 MAGICAL DMG';
        vfxContainer.appendChild(floatingText);

        // Add battle log entry
        window.gameManager.addLogEntry(`✨ Arcane Mastery activated! ${character.name} gains +125 Magical Damage!`, 'talent-activation');

        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 3000);

    } catch (error) {
        console.error('Error showing Arcane Mastery VFX:', error);
    }
}

/**
 * Shows the Tidal Echo VFX when the water ball double cast talent triggers
 * @param {Object} caster - The character with Tidal Echo talent
 * @param {Object} target - The target of the water ball
 */
function showTidalEchoVFX(caster, target) {
    try {
        const casterElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        
        if (!casterElement || !targetElement) {
            console.error('Character elements not found for Tidal Echo VFX');
            return;
        }

        // Create the main VFX container
        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'tidal-echo-vfx';
        vfxContainer.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 1000;
        `;
        targetElement.appendChild(vfxContainer);

        // Create tidal echo aura
        const echoAura = document.createElement('div');
        echoAura.className = 'tidal-echo-aura';
        echoAura.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(33,150,243,0.4) 0%, rgba(33,150,243,0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: tidalEchoPulse 1.5s ease-in-out;
        `;
        vfxContainer.appendChild(echoAura);

        // Create echo waves
        const echoWaves = document.createElement('div');
        echoWaves.className = 'tidal-echo-waves';
        echoWaves.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 50%;
            animation: tidalEchoWaves 2s ease-out;
        `;
        vfxContainer.appendChild(echoWaves);

        // Create floating echo text
        const echoText = document.createElement('div');
        echoText.className = 'tidal-echo-text';
        echoText.textContent = 'TIDAL ECHO!';
        echoText.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: #2196f3;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: tidalEchoTextFloat 2s ease-out forwards;
            z-index: 1001;
        `;
        vfxContainer.appendChild(echoText);

        // Create echo particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'tidal-echo-particle';
            particle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(circle, #2196f3, #64b5f6);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: tidalEchoParticleFloat ${2 + Math.random() * 0.5}s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
            `;
            vfxContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2500);
        }

        // Create echo ripple effect
        const echoRipple = document.createElement('div');
        echoRipple.className = 'tidal-echo-ripple';
        echoRipple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border: 3px solid #2196f3;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: tidalEchoRipple 1.5s ease-out;
        `;
        vfxContainer.appendChild(echoRipple);

        // Remove VFX after animation completes
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.parentNode.removeChild(vfxContainer);
            }
        }, 2500);

    } catch (error) {
        console.error('Error showing Tidal Echo VFX:', error);
    }
}

/**
 * Heal a random ally when Compassionate Resonance talent is active
 * @param {Character} caster - The character with the talent
 * @param {number} healAmount - Amount to heal (50% of damage dealt)
 * @param {string} source - Source of the healing
 */
function healRandomAlly(caster, healAmount, source = 'compassionate_resonance') {
    try {
        // Get all allies (excluding the caster)
        const allies = [];
        
        if (window.gameManager && window.gameManager.gameState) {
            // If caster is AI, allies are other AI characters
            if (caster.isAI) {
                allies.push(...window.gameManager.gameState.aiCharacters.filter(char => 
                    char !== caster && !char.isDead()
                ));
            } else {
                // If caster is player, allies are other player characters
                allies.push(...window.gameManager.gameState.playerCharacters.filter(char => 
                    char !== caster && !char.isDead()
                ));
            }
        }
        
        if (allies.length === 0) {
            console.log(`[Compassionate Resonance] No valid allies found for ${caster.name}`);
            return;
        }
        
        // Select a random ally
        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
        
        // Apply healing
        const healResult = randomAlly.heal(healAmount, caster, { abilityId: source });
        
        // Add battle log entry
        if (window.gameManager && window.gameManager.addLogEntry) {
            let logMessage = `✨ Compassionate Resonance! ${caster.name}'s damage resonates with ${randomAlly.name}, healing for ${healResult.healAmount} HP`;
            if (healResult.isCritical) {
                logMessage += " (Critical Heal!)";
            }
            window.gameManager.addLogEntry(logMessage, healResult.isCritical ? 'critical heal' : 'heal');
        }
        
        // Show Compassionate Resonance VFX
        showCompassionateResonanceVFX(caster, randomAlly, healAmount);
        
        console.log(`[Compassionate Resonance] ${caster.name} healed ${randomAlly.name} for ${healResult.healAmount} HP`);
        
    } catch (error) {
        console.error('[Compassionate Resonance] Error healing random ally:', error);
    }
}

/**
 * Show Compassionate Resonance VFX
 * @param {Character} caster - The character with the talent
 * @param {Character} target - The ally being healed
 * @param {number} healAmount - Amount being healed
 */
function showCompassionateResonanceVFX(caster, target, healAmount) {
    try {
        const casterElement = document.getElementById(`character-${caster.id || caster.instanceId}`);
        const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
        
        if (!casterElement || !targetElement) {
            console.error('[Compassionate Resonance VFX] Could not find character elements');
            return;
        }
        
        // Create resonance beam between caster and target
        const resonanceBeam = document.createElement('div');
        resonanceBeam.className = 'compassionate-resonance-beam';
        document.body.appendChild(resonanceBeam);
        
        // Position beam
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const angle = Math.atan2(targetRect.top - casterRect.top, targetRect.left - casterRect.left);
        const distance = Math.hypot(targetRect.left - casterRect.left, targetRect.top - casterRect.top);
        
        resonanceBeam.style.left = `${casterRect.left + casterRect.width/2}px`;
        resonanceBeam.style.top = `${casterRect.top + casterRect.height/2}px`;
        resonanceBeam.style.width = `${distance}px`;
        resonanceBeam.style.transform = `rotate(${angle}rad)`;
        resonanceBeam.style.transformOrigin = '0 50%';
        
        // Create healing aura on target
        const healingAura = document.createElement('div');
        healingAura.className = 'compassionate-resonance-healing-aura';
        targetElement.appendChild(healingAura);
        
        // Create floating heal text
        const healText = document.createElement('div');
        healText.className = 'compassionate-resonance-heal-text';
        healText.textContent = `+${healAmount} RESONANCE`;
        targetElement.appendChild(healText);
        
        // Create resonance particles
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'compassionate-resonance-particle';
            particle.style.animationDelay = `${i * 0.2}s`;
            targetElement.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 3000);
        }
        
        // Cleanup
        setTimeout(() => {
            if (resonanceBeam.parentNode) resonanceBeam.parentNode.removeChild(resonanceBeam);
            if (healingAura.parentNode) healingAura.parentNode.removeChild(healingAura);
            if (healText.parentNode) healText.parentNode.removeChild(healText);
        }, 2500);
        
    } catch (error) {
        console.error('[Compassionate Resonance VFX] Error showing VFX:', error);
    }
}

/**
 * Execute Grass Ball bounce to all allies with 75% chance each
 * @param {Character} caster - The character using Grass Ball
 * @param {Array} availableAllies - Array of allies that can be bounced to
 * @param {Array} healedTargets - Array of targets already healed (to avoid duplicates)
 */
function executeGrassBallBounceToAllies(caster, availableAllies, healedTargets) {
    console.log(`[Healing Cascade] Checking 75% chance for each of ${availableAllies.length} allies`);
    
    // Filter out already healed targets
    const eligibleAllies = availableAllies.filter(ally => !healedTargets.includes(ally));
    
    if (eligibleAllies.length === 0) {
        console.log(`[Healing Cascade] No eligible allies for bouncing`);
        return;
    }
    
    let bounceCount = 0;
    
    // Check each eligible ally with 75% chance
    eligibleAllies.forEach((ally, index) => {
        const bounceRoll = Math.random();
        console.log(`[Healing Cascade] Ally ${index + 1} (${ally.name}) bounce roll: ${bounceRoll} (need < 0.75 for bounce)`);
        
        if (bounceRoll < 0.75) {
            bounceCount++;
            console.log(`[Healing Cascade] Bounce #${bounceCount} successful! Healing ${ally.name}`);
            
            // Calculate healing amount (same as original Grass Ball)
            let grassHealAmount = 300;
            
            // Apply Healing Mastery talent (same as original Grass Ball)
            const hasHealingMastery = caster.hasTalent && caster.hasTalent('healing_mastery');
            if (hasHealingMastery) {
                grassHealAmount = Math.floor(grassHealAmount * 1.2); // +20% healing
                console.log(`[Healing Cascade] Healing Mastery active for bounce #${bounceCount}`);
            }
            
            // Apply Enhanced Grass Ball talent (250% more healing on buffed targets) - same as original
            const hasEnhancedGrassBall = caster.hasTalent && caster.hasTalent('enhanced_grass_ball');
            if (hasEnhancedGrassBall && ally.buffs && ally.buffs.length > 0) {
                grassHealAmount = Math.floor(grassHealAmount * 3.5); // 250% more = 350% total
                console.log(`[Healing Cascade] Enhanced Grass Ball active for bounce #${bounceCount} - increased healing to ${grassHealAmount}`);
            }
            
            // Apply healing with small delay for visual effect
            setTimeout(() => {
                const bounceHealResult = ally.heal(grassHealAmount, caster, { 
                    abilityId: `ball_throw_grass_bounce_${bounceCount}`,
                    isBounceHeal: true,
                    bounceNumber: bounceCount
                });
                
                // Track ability usage
                if (window.statisticsManager) {
                    window.statisticsManager.recordHealingDone(caster, ally, bounceHealResult.healAmount, bounceHealResult.isCritical, `ball_throw_grass_bounce_${bounceCount}`, 'direct');
                }
                
                // Show bounce VFX
                if (window.showGrassBallBounceVFX) {
                    window.showGrassBallBounceVFX(caster, ally, bounceCount, grassHealAmount);
                }
                
                // Add battle log entry
                if (window.gameManager && window.gameManager.addLogEntry) {
                    let bounceMessage = `🌱 Healing Cascade bounces to ${ally.name} (Bounce #${bounceCount})! +${bounceHealResult.healAmount} HP`;
                    if (bounceHealResult.isCritical) {
                        bounceMessage += " (Critical Heal!)";
                    }
                    window.gameManager.addLogEntry(bounceMessage, bounceHealResult.isCritical ? 'critical heal' : 'heal');
                }
                
                // Apply Grass Growth talent to bounce target
                const hasGrassGrowth = caster.hasTalent && caster.hasTalent('grass_growth');
                if (hasGrassGrowth) {
                    console.log(`[Healing Cascade] Applying Grass Growth to bounce target ${ally.name}`);
                    
                    // Create Grass Growth buff
                    const grassGrowthBuff = {
                        id: 'grass_growth',
                        name: 'Grass Growth',
                        duration: 2,
                        source: 'grass_growth',
                        description: 'Growing grass will heal you for 2% of max HP',
                        onTurnStart: function(character) {
                            console.log(`[Grass Growth] onTurnStart triggered for ${character.name} (bounce target)`);
                            
                            // Calculate healing amount (2% of max HP)
                            const healAmount = Math.floor(character.stats.maxHp * 0.02);
                            
                            // Apply healing with caster's healing power
                            const delayedHealResult = character.heal(healAmount, caster, { 
                                abilityId: 'grass_growth_heal',
                                isPassiveHealing: true 
                            });
                            
                            // Show Grass Growth VFX
                            if (window.showGrassGrowthVFX && typeof window.showGrassGrowthVFX === 'function') {
                                window.showGrassGrowthVFX(character, healAmount);
                            }
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `🌱 Grass Growth heals ${character.name} for ${delayedHealResult.healAmount} HP!`,
                                    'talent-effect'
                                );
                            }
                        }
                    };
                    
                    ally.addBuff(grassGrowthBuff);
                    
                    // Show initial Grass Growth VFX
                    if (window.showGrassGrowthInitialVFX && typeof window.showGrassGrowthInitialVFX === 'function') {
                        window.showGrassGrowthInitialVFX(caster, ally);
                    }
                }
                
                // Apply Magical Empowerment talent to bounce target
                const hasMagicalEmpowerment = caster.hasTalent && caster.hasTalent('magical_empowerment');
                if (hasMagicalEmpowerment) {
                    console.log(`[Healing Cascade] Applying Magical Empowerment to bounce target ${ally.name}`);
                    
                    // Create Magical Empowerment buff
                    const magicalEmpowermentBuff = {
                        id: 'magical_empowerment',
                        name: 'Magical Empowerment',
                        duration: 3,
                        source: 'magical_empowerment',
                        description: '+30% Magical Damage from nature\'s energy',
                        statModifiers: [{
                            stat: 'magicalDamage',
                            value: Math.floor(ally.stats.magicalDamage * 0.3),
                            operation: 'add'
                        }],
                        onApplied: function(character) {
                            console.log(`[Magical Empowerment] Applied to ${character.name} (bounce target)`);
                            
                            // Show Magical Empowerment VFX
                            if (window.showMagicalEmpowermentVFX && typeof window.showMagicalEmpowermentVFX === 'function') {
                                window.showMagicalEmpowermentVFX(caster, character);
                            }
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `✨ ${character.name} is empowered with +30% Magical Damage!`,
                                    'talent-effect'
                                );
                            }
                        },
                        onRemoved: function(character) {
                            console.log(`[Magical Empowerment] Removed from ${character.name} (bounce target)`);
                            
                            // Add battle log entry
                            if (window.gameManager && window.gameManager.addLogEntry) {
                                window.gameManager.addLogEntry(
                                    `✨ ${character.name}'s Magical Empowerment fades.`,
                                    'system'
                                );
                            }
                        }
                    };
                    
                    ally.addBuff(magicalEmpowermentBuff);
                }
                
            }, index * 200); // Stagger bounces by 200ms for visual effect
        } else {
            console.log(`[Healing Cascade] Bounce to ${ally.name} failed (roll: ${bounceRoll})`);
        }
    });
    
    // Add summary battle log entry
    if (bounceCount > 0) {
        setTimeout(() => {
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(
                    `🌱 Healing Cascade completed! ${bounceCount} additional ally${bounceCount > 1 ? 'ies' : ''} healed.`,
                    'system-update'
                );
            }
        }, (eligibleAllies.length * 200) + 500); // Wait for all bounces to complete
    } else {
        console.log(`[Healing Cascade] No bounces occurred`);
        
        // Add battle log entry for no bounces
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(
                `🌱 Healing Cascade attempted but no bounces occurred.`,
                'system'
            );
        }
    }
}

// Expose globally
window.executeGrassBallBounceToAllies = executeGrassBallBounceToAllies;

// Register global functions for external access
window.selectBall = selectBall;
window.executeBallThrow = executeBallThrow;
window.generateBallDescription = generateBallDescription;
window.showBallSelectionForShoma = showBallSelectionForShoma;
window.getIconForBallType = getIconForBallType;
window.refreshAbilityIcon = refreshAbilityIcon;
window.refreshAbilityDescription = refreshAbilityDescription;
window.refreshCharacterUI = refreshCharacterUI;
window.showBallThrowAnimation = showBallThrowAnimation;
window.showArcaneMasteryVFX = showArcaneMasteryVFX;
window.showTidalEchoVFX = showTidalEchoVFX;
window.healRandomAlly = healRandomAlly;
window.showCompassionateResonanceVFX = showCompassionateResonanceVFX;

console.log('Schoolboy Shoma ball selection module loaded'); 