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
            
            document.body.removeChild(modalContainer);
            document.head.removeChild(styleElement);
            
            // Remove the global function
            delete window.shomaSelectBall;
            
            // Call the callback to continue the game
            if (onSelectionComplete) onSelectionComplete();
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
                    
                    document.body.removeChild(modalContainer);
                    document.head.removeChild(styleElement);
                    
                    // Call the callback to continue the game
                    if (onSelectionComplete) onSelectionComplete();
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
            
            if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
            }
            if (document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }
            
            // Remove the global function
            if (window.shomaSelectBall) {
                delete window.shomaSelectBall;
            }
            
            // Call the callback to continue the game
            if (onSelectionComplete) onSelectionComplete();
        }, 60000); // 60 seconds timeout
        
        // Clear the timeout if a selection is made
        const originalOnSelectionComplete = onSelectionComplete;
        onSelectionComplete = function() {
            clearTimeout(autoSelectTimeout);
            if (originalOnSelectionComplete) originalOnSelectionComplete();
        };
    } catch (error) {
        console.error('Error showing ball selection:', error);
        if (onSelectionComplete) onSelectionComplete();
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
 * Process the ball selection and modify Schoolboy Shoma's abilities accordingly
 * @param {Character} shomaCharacter - The Schoolboy Shoma character instance
 * @param {String} ballId - The ID of the selected ball
 */
function selectBall(shomaCharacter, ballId) {
    try {
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
        
        // Define the ball effects based on type
        switch (ballId) {
            case 'grass_ball':
                // Grass Ball - Healing effect
                ballThrowAbility.id = 'ball_throw_grass';
                ballThrowAbility.name = 'Grass Ball Throw';
                ballThrowAbility.description = 'Heals ally for 500 + 2% of target\'s max HP. Scales with Healing Power.';
                ballThrowAbility.type = 'heal';
                ballThrowAbility.targetType = 'ally';
                ballThrowAbility.healAmount = undefined;
                ballThrowAbility.damageType = undefined;
                ballThrowAbility.fixedDamage = undefined;
                ballThrowAbility.icon = ballIcon;
                
                // Replace the default effect with a healing effect
                ballThrowAbility.effect = function(caster, target) {
                    // Check if target is valid
                    if (!target || !target.stats || typeof target.stats.maxHp === 'undefined') {
                        console.error('No valid target or target missing maxHp for grass ball effect');
                        return;
                    }
                    
                    // Play the ball throw animation
                    showBallThrowAnimation('grass_ball', caster, target);
                    
                    // Calculate heal amount: 500 base + 2% of target's max HP
                    const baseHeal = 500;
                    const percentHpHeal = Math.floor(target.stats.maxHp * 0.02);
                    const totalHealAmount = baseHeal + percentHpHeal;
                    
                    // Apply healing
                    const healResult = target.heal(totalHealAmount, caster, { abilityId: 'ball_throw_grass' });
                    
                    // Updated log entry
                    let logMessage = `${caster.name} used Grass Ball on ${target.name}, healing for ${healResult.healAmount} HP (${baseHeal} + ${percentHpHeal} from max HP).`;
                    if (healResult.isCritical) {
                        logMessage += " (Critical Heal!)";
                    }
                    addLogEntry(logMessage, healResult.isCritical ? 'critical heal' : 'heal');
                    
                    // Play Grass Ball sound
                    const playSoundGrass = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundGrass('sounds/shoma_grassball.mp3');
                    
                    // Add Grass Ball VFX
                    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
                    if (targetElement) {
                        // Create grass ball VFX elements
                        const grassBallVfx = document.createElement('div');
                        grassBallVfx.className = 'grass-ball-vfx';
                        targetElement.appendChild(grassBallVfx);
                        
                        const grassParticles = document.createElement('div');
                        grassParticles.className = 'grass-ball-particles';
                        targetElement.appendChild(grassParticles);

                        // Critical Heal Indicator
                        if (healResult.isCritical) {
                            const critHealText = document.createElement('div');
                            critHealText.className = 'crit-heal-vfx';
                            critHealText.textContent = `CRIT HEAL!`;
                            targetElement.appendChild(critHealText);
                            setTimeout(() => critHealText.remove(), 1000);
                        }
                        
                        // Remove VFX after animation completes
                        setTimeout(() => {
                            const vfxElements = targetElement.querySelectorAll('.grass-ball-vfx, .grass-ball-particles');
                            vfxElements.forEach(el => el.remove());
                        }, 1000);
                    }
                };
                break;
                
            case 'fire_ball':
                // Fire Ball - Damage effect
                ballThrowAbility.id = 'ball_throw_fire';
                ballThrowAbility.name = 'Fire Ball Throw';
                ballThrowAbility.description = 'Deals 600 + 2% target max HP as magic damage';
                ballThrowAbility.type = 'damage';
                ballThrowAbility.targetType = 'enemy';
                ballThrowAbility.damageType = 'magical';
                ballThrowAbility.fixedDamage = undefined;
                ballThrowAbility.icon = ballIcon;
                
                // Add custom effect to ensure damage is applied correctly
                ballThrowAbility.effect = function(caster, target) {
                    // Check if target is valid
                    if (!target || !target.stats || typeof target.stats.maxHp === 'undefined') {
                        console.error('No valid target or target missing maxHp for fire ball effect');
                        return;
                    }
                    
                    // Play the ball throw animation
                    showBallThrowAnimation('fire_ball', caster, target);
                    
                    // Calculate damage: 600 base + 2% of target's max HP
                    const baseDamage = 600;
                    const percentHpDamage = Math.floor(target.stats.maxHp * 0.02);
                    const totalDamage = baseDamage + percentHpDamage;
                    
                    // Apply damage as magical
                    const result = target.applyDamage(totalDamage, 'magical', caster, { abilityId: 'ball_throw_fire' });
                    
                    addLogEntry(`${caster.name} used Fire Ball on ${target.name} for ${result.damage} magical damage (${baseDamage} + ${percentHpDamage} from max HP).`);
                    
                    // Play Fire Ball sound
                    const playSoundFire = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundFire('sounds/shoma_fireball.mp3');
                    
                    // Add Fire Ball VFX
                    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
                    if (targetElement) {
                        // Create fire ball VFX elements
                        const fireBallVfx = document.createElement('div');
                        fireBallVfx.className = 'fire-ball-vfx';
                        targetElement.appendChild(fireBallVfx);
                        
                        const fireFlames = document.createElement('div');
                        fireFlames.className = 'fire-ball-flames';
                        targetElement.appendChild(fireFlames);
                        
                        const fireImpact = document.createElement('div');
                        fireImpact.className = 'fire-ball-impact';
                        targetElement.appendChild(fireImpact);
                        
                        // Remove VFX after animation completes
                        setTimeout(() => {
                            const vfxElements = targetElement.querySelectorAll('.fire-ball-vfx, .fire-ball-flames, .fire-ball-impact');
                            vfxElements.forEach(el => el.remove());
                        }, 1000);
                    }
                    
                    // Check if target died from this damage
                    if (target.isDead()) {
                        addLogEntry(`${target.name} has been defeated!`);
                    }
                };
                break;
                
            case 'heavy_ball':
                // Heavy Ball - Debuff effect
                ballThrowAbility.id = 'ball_throw_heavy';
                ballThrowAbility.name = 'Heavy Ball Throw'; 
                ballThrowAbility.description = 'Deals 200 damage and reduces the target\'s damage by 20% for 4 turns.';
                ballThrowAbility.type = 'damage';
                ballThrowAbility.targetType = 'enemy';
                ballThrowAbility.damageType = 'physical';
                ballThrowAbility.fixedDamage = 200;
                ballThrowAbility.icon = ballIcon;
                
                // Add custom effect to ensure debuff is applied correctly
                ballThrowAbility.effect = function(caster, target) {
                    // Check if target is valid
                    if (!target) {
                        console.error('No valid target for heavy ball effect');
                        return;
                    }
                    
                    // Play the ball throw animation
                    showBallThrowAnimation('heavy_ball', caster, target);
                    
                    // Apply some base damage
                    const damageAmount = 200;
                    const result = target.applyDamage(damageAmount, 'physical', caster, { abilityId: 'ball_throw_heavy' });
                    
                    addLogEntry(`${caster.name} used Heavy Ball on ${target.name} for ${result.damage} physical damage.`);
                    
                    // Apply the debuff effect (damage reduction)
                    const debuff = {
                        id: 'heavy_ball_debuff',
                        name: 'Heavy Ball Damage Reduction',
                        icon: 'Icons/abilities/heavyball.jfif',
                        duration: 4,
                        isDebuff: true,
                        effects: { damageReductionPercent: 0.20 },
                        description: 'Damage dealt reduced by 20%.'
                    };
                    target.addDebuff(debuff);
                    addLogEntry(`${target.name} is affected by Heavy Ball, reducing their damage by 20% for 4 turns.`);
                    
                    // Play Heavy Ball sound
                    const playSoundHeavy = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundHeavy('sounds/shoma_heavyball.mp3');
                    
                    // Add Heavy Ball VFX
                    const targetElement = document.getElementById(`character-${target.id || target.instanceId}`);
                    if (targetElement) {
                        // Create heavy ball VFX elements
                        const heavyBallVfx = document.createElement('div');
                        heavyBallVfx.className = 'heavy-ball-vfx';
                        targetElement.appendChild(heavyBallVfx);
                        
                        const heavyImpact = document.createElement('div');
                        heavyImpact.className = 'heavy-ball-impact';
                        targetElement.appendChild(heavyImpact);
                        
                        const heavyWaves = document.createElement('div');
                        heavyWaves.className = 'heavy-ball-waves';
                        targetElement.appendChild(heavyWaves);
                        
                        // Remove VFX after animation completes
                        setTimeout(() => {
                            const vfxElements = targetElement.querySelectorAll('.heavy-ball-vfx, .heavy-ball-impact, .heavy-ball-waves');
                            vfxElements.forEach(el => el.remove());
                        }, 1000);
                    }
                };
                break;
                
            case 'water_ball':
                // Water Ball - Multi-target damage
                ballThrowAbility.id = 'ball_throw_water';
                ballThrowAbility.name = 'Water Ball Throw';
                ballThrowAbility.description = 'Deals 550 damage to main target and 180 to all other enemies.';
                ballThrowAbility.type = 'damage';
                ballThrowAbility.targetType = 'enemy';
                ballThrowAbility.damageType = 'physical';
                ballThrowAbility.fixedDamage = undefined;
                ballThrowAbility.cooldown = 2;
                ballThrowAbility.icon = ballIcon;
                
                // Replace the default effect with a multi-target damage effect
                ballThrowAbility.effect = function(caster, mainTarget) {
                    // Check if we have a valid main target
                    if (!mainTarget) {
                        console.error('No valid main target for water ball effect');
                        return;
                    }
                    
                    // Play the ball throw animation (using mainTarget)
                    showBallThrowAnimation('water_ball', caster, mainTarget);
                    
                    // Apply damage to main target
                    const damage = 550;
                    const result = mainTarget.applyDamage(damage, 'physical', caster, { abilityId: 'ball_throw_water' });
                    addLogEntry(`${caster.name} used Water Ball on ${mainTarget.name}, dealing ${result.damage} damage.`);
                    
                    // Play Water Ball sound
                    const playSoundWater = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};
                    playSoundWater('sounds/shoma_water2.mp3');
                    
                    // Apply splash damage to all other enemies
                    const splashDamage = 180;
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
                break;
                
            default:
                console.error(`Unknown ball type selected: ${ballId}`);
                return;
        }
        
        // Update the ability's icon property
        ballThrowAbility.icon = ballIcon;
        
        // Use the dedicated function to refresh the ability icon
        refreshAbilityIcon(shomaCharacter, ballThrowIndex);
        
        // Log the selection
        console.log(`Schoolboy Shoma selected ${ballThrowAbility.name}`);
        addLogEntry(`Schoolboy Shoma equipped the ${ballThrowAbility.name}!`);
        
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

// Register an event handler for when Schoolboy Shoma loads into a stage
/* REMOVE THIS BLOCK:
document.addEventListener('DOMContentLoaded', function() {
    console.log('Schoolboy Shoma ball selection script loaded');

    try {
        // Make sure StageManager exists
        if (typeof StageManager === 'undefined') {
            console.error('StageManager not defined - ball selection cannot be initialized');
            return;
        }

        // Hook into the StageManager's loadPlayerCharacters method
        const originalLoadPlayerCharacters = StageManager.prototype.loadPlayerCharacters;

        StageManager.prototype.loadPlayerCharacters = async function(playerTeam) {
            try {
                // Call the original method first
                await originalLoadPlayerCharacters.call(this, playerTeam);

                // Check if Schoolboy Shoma is in the player team
                const shomaCharacter = this.gameState.playerCharacters.find(char => char.id === 'schoolboy_shoma');
                if (shomaCharacter) {
                    console.log('Schoolboy Shoma detected in player team, showing ball selection');

                    // Use a promise with timeout to make the game wait for ball selection
                    // but not forever if something goes wrong
                    await Promise.race([
                        new Promise(resolve => {
                            // Small delay to ensure the UI is fully loaded
                            setTimeout(() => {
                                try {
                                    showBallSelectionForShoma(shomaCharacter, resolve);
                                } catch (err) {
                                    console.error('Error showing ball selection:', err);
                                    resolve(); // Resolve anyway to prevent game from hanging
                                }
                            }, 500);
                        }),
                        // Safety timeout to prevent infinite waiting
                        new Promise(resolve => setTimeout(resolve, 10000))
                    ]);

                    console.log('Ball selection completed or timed out');
                }
            } catch (error) {
                console.error('Error in loadPlayerCharacters override:', error);
                // Don't rethrow - we want the game to continue even if ball selection fails
            }
        };

        console.log('Schoolboy Shoma ball selection script initialized');
    } catch (error) {
        console.error('Failed to initialize Schoolboy Shoma ball selection:', error);
    }
});
*/ 