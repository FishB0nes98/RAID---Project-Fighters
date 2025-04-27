/**
 * Story UI Manager
 * Handles the UI for the story page, including the map, stage nodes, and progression
 */
class StoryUI {
    constructor(storyManager) {
        this.storyManager = storyManager;
        
        // --- Move element selections to initialize --- 
        // DOM Elements (Initialize to null)
        this.storyTitleElement = null;
        this.storyDescriptionElement = null;
        this.progressFillElement = null;
        this.progressTextElement = null;
        this.playerTeamElement = null;
        this.mapStagesElement = null;
        this.mapPathElement = null;
        this.storyMapElement = null; // Added for the main map container
        this.mapContainerElement = null; // Added this line
        this.stageDetailsElement = null;
        
        // Stage details elements
        this.stageNameElement = null;
        this.stageDifficultyElement = null;
        this.stageImageElement = null;
        this.stageDescriptionElement = null;
        this.enemyListElement = null;
        this.rewardListElement = null;
        this.startStageButton = null;
        
        // Choice elements
        this.stageChoicesContainer = null;
        this.choiceListElement = null;
        
        // Recruit elements
        this.stageRecruitContainer = null;
        this.recruitListElement = null;
        
        // Character Selection Modal elements
        this.characterSelectionModal = null;
        this.characterSelectionList = null;
        this.choiceModalDescription = null;
        
        // Other screens
        this.victoryScreenElement = null;
        this.gameOverScreenElement = null;
        this.storyCompleteScreenElement = null;
        // --- End Move --- 
        
        this.selectedChoice = null; // To store the choice being processed
        
        // Stage node mapping
        this.stageNodes = [];
        
        // --- Move callback assignments to story.html or later --- 
        // this.storyManager.onStoryLoaded = this.handleStoryLoaded.bind(this);
        // this.storyManager.onStageCompleted = this.handleStageCompleted.bind(this);
        // --- End Move --- 
        
        // Bind event handlers that need `this` context early
        this.handleStageNodeClick = this.handleStageNodeClick.bind(this);
        // Bind others in setupEventHandlers if needed
    }

    /**
     * Initialize the UI elements and bind event handlers
     */
    initialize() {
        console.log('[StoryUI] Initializing UI components, selecting elements, and setting up handlers...');

        // --- Select DOM Elements --- 
        this.storyTitleElement = document.getElementById('story-title');
        this.storyDescriptionElement = document.getElementById('story-description');
        this.progressFillElement = document.getElementById('progress-fill');
        this.progressTextElement = document.getElementById('progress-text');
        this.playerTeamElement = document.getElementById('player-team');
        this.mapStagesElement = document.getElementById('map-stages');
        this.mapPathElement = document.getElementById('map-path');
        this.storyMapElement = document.querySelector('.story-map'); // Select by class
        this.mapContainerElement = document.querySelector('.map-container'); // Added this line
        
        // Create zoom controls if they don't exist
        if (!document.querySelector('.map-zoom-controls')) {
            const zoomControls = document.createElement('div');
            zoomControls.className = 'map-zoom-controls';
            zoomControls.innerHTML = '<div class="zoom-text">Zoom: 100%</div>';
            this.mapContainerElement.appendChild(zoomControls);
            this.zoomTextElement = zoomControls.querySelector('.zoom-text');
        } else {
            this.zoomTextElement = document.querySelector('.map-zoom-controls .zoom-text');
        }
        
        this.stageDetailsElement = document.getElementById('stage-details');
        this.stageNameElement = document.getElementById('stage-name');
        this.stageDifficultyElement = document.getElementById('stage-difficulty');
        this.stageImageElement = document.getElementById('stage-image');
        this.stageDescriptionElement = document.getElementById('stage-description');
        this.enemyListElement = document.getElementById('enemy-list');
        this.rewardListElement = document.getElementById('reward-list');
        this.startStageButton = document.getElementById('start-stage-button');
        this.stageChoicesContainer = document.getElementById('stage-choices-container');
        this.choiceListElement = document.getElementById('choice-list');
        this.stageRecruitContainer = document.getElementById('stage-recruit-container');
        this.recruitListElement = document.getElementById('recruit-list');
        this.characterSelectionModal = document.getElementById('character-selection-modal');
        this.characterSelectionList = document.getElementById('character-selection-list');
        this.choiceModalDescription = document.getElementById('choice-modal-description');
        this.victoryScreenElement = document.getElementById('victory-screen');
        this.gameOverScreenElement = document.getElementById('game-over-screen');
        this.storyCompleteScreenElement = document.getElementById('story-complete-screen');
        // --- End Select DOM Elements ---

        // --- Check if essential elements were found --- 
        if (!this.storyMapElement || !this.mapStagesElement || !this.mapContainerElement) { // Added mapContainerElement check
            console.error("[StoryUI] FATAL: Essential map elements (.story-map, .map-container or #map-stages) not found in the DOM during initialization.");
            alert("UI Error: Could not find map elements. Story cannot be displayed.");
            // Potentially redirect or stop further execution
            return; 
        }
        // --- End Check --- 

        console.log('[StoryUI] DOM elements selected.');

        // Redirect check (can likely be removed if handled reliably in story.html)
        if (this.storyManager.shouldRedirectToCharacterSelect) {
            console.log('[StoryUI] Story run has failed. Redirecting to character selection...');
            alert('Your story run has ended in defeat. Start a new adventure!');
            window.location.href = 'character-selector.html';
            return; // Stop initialization if redirecting
        }

        // Initialize map dragging (now that elements are selected)
        this.initializeMapDragging();

        // Setup main event handlers
        this.setupEventHandlers();

        console.log("[StoryUI] Initialization complete.");
    }

    /**
     * Sets up the primary event listeners for UI controls.
     */
    setupEventHandlers() {
        console.log("[StoryUI] Setting up event handlers...");
        
        // Ensure elements exist before adding listeners
        const backButton = document.getElementById('back-button');
        const startStageButton = document.getElementById('start-stage-button');
        const closeDetailsButton = document.getElementById('close-details-button');
        const continueButton = document.getElementById('continue-button');
        const retryButton = document.getElementById('retry-button');
        const quitButton = document.getElementById('quit-button');
        const newStoryButton = document.getElementById('new-story-button');

        if (backButton) backButton.addEventListener('click', () => this.backToSelection());
        else console.warn('Back button not found');

        if (startStageButton) startStageButton.addEventListener('click', () => this.startCurrentStage());
        else console.warn('Start stage button not found');

        if (closeDetailsButton) closeDetailsButton.addEventListener('click', () => this.closeStageDetails());
        else console.warn('Close details button not found');

        if (continueButton) continueButton.addEventListener('click', () => this.continueToNextStage());
        else console.warn('Continue button not found');

        if (retryButton) retryButton.addEventListener('click', () => this.retryCurrentStage());
        else console.warn('Retry button not found');

        if (quitButton) quitButton.addEventListener('click', () => this.quitStory());
        else console.warn('Quit button not found');

        if (newStoryButton) newStoryButton.addEventListener('click', () => this.newStory());
        else console.warn('New story button not found');
        
        console.log("[StoryUI] Event handlers set up.");
    }

    /**
     * Handle the story loaded event
     * @param {Object} story - The loaded story data
     */
    handleStoryLoaded(story) {
        console.log('[StoryUI] handleStoryLoaded triggered for:', story?.title);
        if (!story) {
            console.error("[StoryUI] handleStoryLoaded called with null story data.");
            // Maybe show an error to the user or redirect?
            alert("Error: Failed to load story details.");
            window.location.href = 'character-selector.html';
            return;
        }
        // Perform initial rendering based on loaded story data
        this.renderStoryInfo();
        this.renderPlayerTeam();
        this.renderStoryMap(); // This will call calculateStagePositions
        this.updateProgressIndicator();
        console.log("[StoryUI] Initial rendering complete after story load.");
    }

    /**
     * Handle the stage completed event
     * @param {string} stageId - The ID of the completed stage
     * @param {Array} rewards - The rewards earned
     * @param {boolean} hasMoreStages - Whether there are more stages to complete
     */
    handleStageCompleted(stageId, rewards, hasMoreStages) {
        console.log(`Stage ${stageId} completed with ${rewards.length} rewards. More stages: ${hasMoreStages}`);
        
        // Update UI
        this.updateStageNodes();
        this.updateProgressIndicator();
        this.renderStoryMap();
        
        // Show appropriate screen
        if (hasMoreStages) {
            this.showVictoryScreen(rewards);
        } else {
            this.showStoryCompleteScreen();
        }
    }

    /**
     * Render the story info in the sidebar
     */
    renderStoryInfo() {
        const storyInfo = this.storyManager.getStoryInfo();
        
        this.storyTitleElement.textContent = storyInfo.title;
        this.storyDescriptionElement.textContent = storyInfo.description;
        
        this.updateProgressIndicator();
    }

    /**
     * Update the progress indicator
     */
    updateProgressIndicator() {
        const storyInfo = this.storyManager.getStoryInfo();
        
        this.progressFillElement.style.width = `${storyInfo.progress}%`;
        this.progressTextElement.textContent = `Stage ${storyInfo.currentStage + 1}/${storyInfo.totalStages}`;
    }

    /**
     * Render the player team in the sidebar
     */
    renderPlayerTeam() {
        this.playerTeamElement.innerHTML = '';
        
        this.storyManager.playerTeam.forEach(character => {
            console.log('Rendering character:', character);
            
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            
            // Character avatar
            const avatar = document.createElement('img');
            avatar.className = 'character-avatar';
            avatar.src = character.avatarImage || character.image || 'images/characters/default.png';
            avatar.alt = character.name;
            avatar.onerror = () => {
                avatar.src = 'images/characters/default.png';
            };
            
            // Character info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'character-info';
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'character-name';
            nameSpan.textContent = character.name;
            
            // Character Stats (HP/Mana)
            const statsDiv = document.createElement('div');
            statsDiv.className = 'character-stats';
            
            // HP Bar Container
            const hpBarContainer = document.createElement('div');
            hpBarContainer.className = 'bar-container hp-container';
            
            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            const currentHP = character.currentHP !== undefined ? character.currentHP : (character.stats ? character.stats.hp : 'N/A');
            const maxHP = character.stats ? character.stats.hp : 'N/A';
            if (currentHP !== 'N/A' && maxHP !== 'N/A') {
                const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
                hpBar.style.width = `${hpPercentage}%`;
                hpBar.innerHTML = `<span class="bar-text">${currentHP}/${maxHP}</span>`;
            }
            
            // Mana Bar Container
            const manaBarContainer = document.createElement('div');
            manaBarContainer.className = 'bar-container mana-container';
            
            const manaBar = document.createElement('div');
            manaBar.className = 'mana-bar';
            const currentMana = character.currentMana !== undefined ? character.currentMana : (character.stats ? character.stats.mana : 'N/A');
            const maxMana = character.stats ? character.stats.mana : 'N/A';
            if (currentMana !== 'N/A' && maxMana !== 'N/A') {
                const manaPercentage = Math.max(0, Math.min(100, (currentMana / maxMana) * 100));
                manaBar.style.width = `${manaPercentage}%`;
                manaBar.innerHTML = `<span class="bar-text">${currentMana}/${maxMana}</span>`;
            }
            
            // Assemble the bars
            hpBarContainer.appendChild(hpBar);
            manaBarContainer.appendChild(manaBar);
            statsDiv.appendChild(hpBarContainer);
            statsDiv.appendChild(manaBarContainer);
            
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'character-tags';
            
            // Add tags
            if (character.tags && character.tags.length) {
                character.tags.slice(0, 3).forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'character-tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
            }
            
            // Assemble the component
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(statsDiv);
            infoDiv.appendChild(tagsDiv);
            
            characterCard.appendChild(avatar);
            characterCard.appendChild(infoDiv);
            
            this.playerTeamElement.appendChild(characterCard);
        });
    }

    /**
     * Render the story map with stage nodes and connecting paths
     */
    renderStoryMap() {
        // Clear existing content immediately
        if (!this.mapStagesElement || !this.mapPathElement) {
             console.error("[StoryUI] Cannot render map, elements not initialized.");
             return;
        }
        this.mapStagesElement.innerHTML = '';
        this.mapPathElement.innerHTML = '';
        this.stageNodes = [];

        const stages = this.storyManager.getAllStages();
        if (!stages || stages.length === 0) {
            console.warn("[StoryUI] No stages to render in renderStoryMap.");
            return;
        }

        // --- Defer position calculation and rendering --- 
        requestAnimationFrame(() => {
            try {
                console.log("[StoryUI] Deferred: Calculating stage positions...");
                const positions = this.calculateStagePositions(stages);

                // Check if positions were calculated correctly
                if (!positions || positions.length !== stages.length) {
                    console.error("[StoryUI] Error: Failed to calculate valid positions for stages.");
                    return; // Stop if positions are invalid
                }
                console.log(`[StoryUI] Deferred: Positions calculated (${positions.length}). Rendering nodes and paths...`);

                // Create nodes and connections using the calculated positions
                stages.forEach((stage, index) => {
                    const pos = positions[index];
                    if (!pos || typeof pos.x === 'undefined' || typeof pos.y === 'undefined') {
                        console.error(`[StoryUI] Invalid position for stage index ${index}:`, pos);
                        return; // Skip rendering this node
                    }
                    
                    // Create the stage node
                    const nodeElement = this.createStageNode(stage, pos);
                    this.mapStagesElement.appendChild(nodeElement);
                    this.stageNodes.push({ element: nodeElement, stage: stage, position: pos });
                    
                    // Create connections between nodes
                    if (index > 0) {
                        const prevPos = positions[index - 1];
                         if (prevPos && typeof prevPos.x !== 'undefined' && typeof prevPos.y !== 'undefined') {
                            const isCompleted = stage.isCompleted || stage.isActive; // Path is completed if the destination stage is reached or passed
                            const pathSegment = this.createPathSegment(prevPos, pos, isCompleted);
                            this.mapPathElement.appendChild(pathSegment);
                        }
                    }
                });
                console.log("[StoryUI] Deferred: Node and path rendering complete.");

                // After rendering, re-initialize dragging in case container size changed
                this.initializeMapDragging();
                
            } catch (error) {
                console.error("[StoryUI] Error during deferred map rendering:", error);
                 // Handle error appropriately, maybe show a message to the user
            }
        });
    }

    /**
     * Calculate stage positions based on a pattern or custom layout for specific stories.
     * @param {Array<Object>} stages - Array of stage objects from the current story.
     * @returns {Array} - Array of position objects {x, y}
     */
    calculateStagePositions(stages) {
        const positions = [];
        // Use the actual container dimensions for calculation base
        const mapContainerWidth = this.storyMapElement.offsetWidth || 1000;
        const mapContainerHeight = this.storyMapElement.offsetHeight || 700;
        const totalStages = stages.length;

        const stageWidth = 200;
        const stageHeight = 100;
        const minPadding = 50; // Increase padding slightly more

        const genericXSpacing = 350; // Increased from 250 for more spacing
        const genericYSpacing = 250; // Increased from 180 for more spacing

        const storyTitle = this.storyManager.currentStory?.title;

        if (storyTitle === "Blazing School Day" && mapContainerWidth > 0 && mapContainerHeight > 0) {
            console.log("[StoryUI] Applying SPECIFIC layout for 'Blazing School Day'");

            // Define specific positions using double quotes for keys
            const layout = {
                "Burning School Gym": { x: 0.1, y: 0.1 },
                "School Corridor":    { x: 0.4, y: 0.2 },
                "School Yard":        { x: 0.7, y: 0.1 },
                "Classroom 5B Door":  { x: 0.75, y: 0.45 }, // Recruit
                "Rooftop":            { x: 0.4, y: 0.5 },
                "Final Choice":       { x: 0.1, y: 0.4 },
                "Bathroom Entrance":  { x: 0.25, y: 0.75 }, // Recruit
                "Bathroom Fight":     { x: 0.5, y: 0.8 },    // Added Boss stage
                "Principal's Office": { x: 0.75, y: 0.75 }    // Fixed key
            };

            stages.forEach((stage, index) => {
                let posPercent = layout[stage.name];
                let x, y;

                if (posPercent) {
                    // Calculate absolute pixel values from percentages
                    x = posPercent.x * mapContainerWidth;
                    y = posPercent.y * mapContainerHeight;
                } else {
                    // Fallback for any unexpected stages in this story
                    console.warn(`[StoryUI] No specific position defined for stage: ${stage.name}. Using fallback grid.`);
                    const fallbackCols = 3;
                    const colIndex = index % fallbackCols;
                    const rowIndex = Math.floor(index / fallbackCols);
                    x = minPadding + (mapContainerWidth / fallbackCols) * colIndex;
                    y = minPadding + rowIndex * (stageHeight + 100); // Basic row spacing
                }

                // Clamp positions (ensure they don't overlap edges too much)
                x = Math.max(minPadding, Math.min(x, mapContainerWidth - stageWidth - minPadding));
                y = Math.max(minPadding, Math.min(y, mapContainerHeight - stageHeight - minPadding));

                positions.push({ x, y });
            });
        } else if (storyTitle === "Corruption at the Farmland" && mapContainerWidth > 0 && mapContainerHeight > 0) {
            console.log("[StoryUI] Applying SPECIFIC narrative layout for 'Corruption at the Farmland'");
            
            // Create a winding path layout that follows a more narrative progression
            // This will create a zigzag path with descending stages
            
            // Map dimensions - ensure plenty of space (Increased significantly)
            const width = Math.max(mapContainerWidth, 2500); // Increased from 1500
            const height = Math.max(mapContainerHeight, 2000); // Increased from 1200
            
            // Create a winding narrative path
            const pathPoints = [
                { x: 0.15, y: 0.15 },  // Start top-left
                { x: 0.50, y: 0.22 },  // Move right
                { x: 0.80, y: 0.30 },  // Continue right
                { x: 0.65, y: 0.45 },  // Move back left and down
                { x: 0.35, y: 0.55 },  // Continue left
                { x: 0.60, y: 0.70 },  // Move right and down
                { x: 0.80, y: 0.80 },  // Continue right
                { x: 0.45, y: 0.88 }   // Final position - middle bottom
            ];
            
            // Handle case where we have more or fewer stages than path points
            const totalPoints = pathPoints.length;
            const totalStages = stages.length;
            
            stages.forEach((stage, index) => {
                // If we have more stages than pathPoints, interpolate new positions
                let position;
                
                if (totalStages <= totalPoints) {
                    // We have enough pre-defined points
                    position = pathPoints[index];
                } else {
                    // We need to interpolate points based on index
                    const normalizedPosition = index / (totalStages - 1);
                    const pointIndex = Math.floor(normalizedPosition * (totalPoints - 1));
                    const nextPointIndex = Math.min(pointIndex + 1, totalPoints - 1);
                    const pointProgress = (normalizedPosition * (totalPoints - 1)) - pointIndex;
                    
                    const point1 = pathPoints[pointIndex];
                    const point2 = pathPoints[nextPointIndex];
                    
                    position = {
                        x: point1.x + (point2.x - point1.x) * pointProgress,
                        y: point1.y + (point2.y - point1.y) * pointProgress
                    };
                }
                
                // Calculate actual pixel coordinates from percentages
                const x = position.x * width;
                const y = position.y * height;
                
                // Add slight random variation to prevent perfect alignment
                const jitterAmount = 40;
                const jitterX = (Math.random() - 0.5) * jitterAmount;
                const jitterY = (Math.random() - 0.5) * jitterAmount;
                
                positions.push({ 
                    x: x + jitterX, 
                    y: y + jitterY 
                });
            });
            
            // Ensure the map container is large enough
            this.mapStagesElement.style.width = `${width}px`;
            this.mapStagesElement.style.height = `${height}px`;
        } else {
            // --- Generic layout (remains the same) ---
            console.log("[StoryUI] Applying generic layout.");
            const nodesPerRow = Math.max(1, Math.floor((mapContainerWidth - minPadding * 2 + genericXSpacing) / (stageWidth + genericXSpacing)));
            const numRows = Math.ceil(totalStages / nodesPerRow);

            for (let i = 0; i < totalStages; i++) {
                const row = Math.floor(i / nodesPerRow);
                const col = i % nodesPerRow;

                const rowWidth = (nodesPerRow * stageWidth) + Math.max(0, nodesPerRow - 1) * genericXSpacing;
                const startX = Math.max(minPadding, (mapContainerWidth - rowWidth) / 2);

                let x = startX + col * (stageWidth + genericXSpacing);
                let y = minPadding + row * (stageHeight + genericYSpacing);

                if (numRows > 1 && row % 2 === 1) {
                   const reversedCol = nodesPerRow - 1 - col;
                   x = startX + reversedCol * (stageWidth + genericXSpacing);
                }

                x = Math.max(minPadding, Math.min(x, mapContainerWidth - stageWidth - minPadding));
                y = Math.max(minPadding, Math.min(y, mapContainerHeight - stageHeight - minPadding));

                positions.push({ x, y });
            }
        }

        // --- Dynamically resize the scrollable container --- 
        let maxX = 0;
        let maxY = 0;
        positions.forEach(pos => {
            maxX = Math.max(maxX, pos.x + stageWidth + minPadding);
            maxY = Math.max(maxY, pos.y + stageHeight + minPadding);
        });

        // Ensure the container is at least as big as the viewable area
        maxX = Math.max(maxX, mapContainerWidth);
        maxY = Math.max(maxY, mapContainerHeight);

        this.mapStagesElement.style.width = `${maxX}px`;
        this.mapStagesElement.style.height = `${maxY}px`;
        console.log(`[StoryUI] Map stages container resized to: ${maxX}px x ${maxY}px`);

        return positions;
    }

    /**
     * Create a stage node element
     * @param {Object} stage - The stage data
     * @param {Object} position - The position {x, y}
     * @returns {HTMLElement} - The stage node element
     */
    createStageNode(stage, position) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'stage-node';
        nodeElement.dataset.stageId = stage.id;
        nodeElement.dataset.stageIndex = stage.index;
        
        // Set position
        nodeElement.style.left = `${position.x}px`;
        nodeElement.style.top = `${position.y}px`;
        
        // Add appropriate classes
        if (stage.isCompleted) {
            nodeElement.classList.add('completed');
        } else if (stage.isActive) {
            nodeElement.classList.add('active');
        } else if (stage.isLocked) {
            nodeElement.classList.add('locked');
        }
        
        // Add stage title
        const titleElement = document.createElement('div');
        titleElement.className = 'stage-title';
        titleElement.textContent = stage.name;
        
        // Add difficulty indicator
        const difficultyElement = document.createElement('div');
        difficultyElement.className = 'stage-difficulty';
        difficultyElement.classList.add(`difficulty-${stage.difficulty}`);
        difficultyElement.textContent = `Difficulty: ${stage.difficulty}`;
        
        // Add brief description
        const briefElement = document.createElement('div');
        briefElement.className = 'stage-brief';
        briefElement.textContent = stage.description;
        
        // Add status indicator
        const statusElement = document.createElement('div');
        statusElement.className = 'stage-status';
        
        if (stage.isCompleted) {
            statusElement.classList.add('status-completed');
            statusElement.textContent = '✓';
        } else if (stage.isActive) {
            statusElement.classList.add('status-active');
            statusElement.textContent = '!';
        } else {
            statusElement.classList.add('status-locked');
            statusElement.textContent = '🔒';
        }
        
        // Assemble the node
        nodeElement.appendChild(titleElement);
        nodeElement.appendChild(difficultyElement);
        nodeElement.appendChild(briefElement);
        nodeElement.appendChild(statusElement);
        
        // Add click handler
        nodeElement.addEventListener('click', () => this.handleStageNodeClick(stage));
        
        return nodeElement;
    }

    /**
     * Create a path segment between two nodes
     * @param {Object} from - Starting position {x, y}
     * @param {Object} to - Ending position {x, y}
     * @param {boolean} isCompleted - Whether the path is for a completed stage
     */
    createPathSegment(from, to, isCompleted) {
        const segment = document.createElement('div');
        segment.className = 'path-segment';
        
        if (isCompleted) {
            segment.classList.add('completed');
        }
        
        // Calculate path position and dimensions
        const fromX = from.x + 100; // Center of node width (assuming 200px width)
        const fromY = from.y + 50;  // Center of node height (assuming 100px height)
        const toX = to.x + 100;
        const toY = to.y + 50;
        
        const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
        const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
        
        segment.style.width = `${length}px`;
        segment.style.left = `${fromX}px`;
        segment.style.top = `${fromY}px`;
        segment.style.transform = `rotate(${angle}deg)`;
        segment.style.transformOrigin = '0 0'; // Set transform origin to the start point
        
        // Return the created segment element
        return segment;
    }

    /**
     * Handle a click on a stage node
     * @param {Object} stage - The stage data
     */
    async handleStageNodeClick(stage) {
        console.log('[StoryUI] Stage node clicked:', stage);

        if (stage.isLocked) {
            console.log('Stage locked');
            // Optionally show a message to the user
            return;
        }

        if (stage.isCompleted) {
            // Optionally allow viewing details of completed stages, but not replaying?
            console.log('Stage already completed');
            // this.showStageDetails(stage);
            return;
        }

        // Reset UI elements
        this.stageChoicesContainer.classList.add('hidden');
        this.stageRecruitContainer.classList.add('hidden');

        // Handle stage type
        switch (stage.type) {
            case 'battle':
            case 'boss':
                this.showStageDetails(stage);
                break;
            case 'choice':
                this.showStageDetails(stage); // Show base details
                this.renderStageChoices(stage.choices); // Render choices
                break;
            case 'recruit':
                this.showStageDetails(stage); // Show base details
                await this.renderRecruitmentOffers(stage); // Render recruitment offers
                break;
            default:
                console.error("Unknown stage type:", stage.type);
                this.showStageDetails(stage); // Default to showing details
        }
    }

    /**
     * Show the stage details panel
     * @param {Object} stage - The stage data
     */
    showStageDetails(stage) {
        // Populate common stage details
        this.stageNameElement.textContent = stage.name;
        this.stageDifficultyElement.textContent = stage.difficulty ? `Difficulty: ${stage.difficulty}` : 'Non-Combat'; // Show difficulty or 'Non-Combat'
        this.stageDescriptionElement.textContent = stage.description;
        
        // Set stage image - use a placeholder if none available or for non-battle stages
        let imagePath = 'images/stages/default.jpg'; // Default image
        if (stage.type === 'battle' || stage.type === 'boss') {
            // Try to load specific image for battle/boss stages
            // Assuming stage.id is something like 'storyid_stagename'
            // We might need a better way to determine the image filename
            const potentialImageName = stage.id ? `${stage.id}.jpg` : 'default.jpg';
            imagePath = `images/stages/${potentialImageName}`;
        }
        this.stageImageElement.src = imagePath;
        this.stageImageElement.onerror = () => {
            this.stageImageElement.src = 'images/stages/default.jpg'; // Fallback on error
        };
        
        // Reset visibility states
        this.enemyListElement.parentElement.classList.remove('hidden');
        this.rewardListElement.parentElement.classList.remove('hidden');
        this.stageChoicesContainer.classList.add('hidden');
        this.stageRecruitContainer.classList.add('hidden');
        this.startStageButton.classList.remove('hidden'); // Default to visible
        this.startStageButton.disabled = false; // Default to enabled
        this.startStageButton.textContent = 'Begin Battle'; // Default text
        
        // Handle stage type specifics
        if (stage.type === 'choice') {
            this.enemyListElement.parentElement.classList.add('hidden');
            this.rewardListElement.parentElement.classList.add('hidden');
            this.startStageButton.classList.add('hidden'); // Hide start button
            this.stageChoicesContainer.classList.remove('hidden');
            this.renderStageChoices(stage.choices); // Render choices
        } else if (stage.type === 'recruit') {
            this.enemyListElement.parentElement.classList.add('hidden');
            this.rewardListElement.parentElement.classList.add('hidden');
            this.startStageButton.classList.add('hidden'); // Hide start button
            this.stageRecruitContainer.classList.remove('hidden');
            this.renderRecruitmentOffers(stage); // Render recruitment offers
        } else { // Default case (battle/boss)
            // Populate enemies and rewards for battle stages
            this.renderEnemyList(this.getMockEnemiesForStage(stage));
            this.renderRewardList(this.getMockRewardsForStage(stage));
        }
        
        // Show details panel
        this.stageDetailsElement.classList.add('visible');
    }

    /**
     * Render the choices available for a 'choice' type stage
     * @param {Array} choices - Array of choice objects from stage data
     */
    renderStageChoices(choices) {
        this.choiceListElement.innerHTML = ''; // Clear previous choices
        if (!choices || choices.length === 0) {
            this.choiceListElement.innerHTML = '<p>No choices available for this stage.</p>';
            return;
        }

        choices.forEach(choice => {
            const choiceElement = document.createElement('div');
            choiceElement.className = 'choice-item';

            // Add effect-specific class for styling
            if (choice.effect && choice.effect.type) {
                choiceElement.classList.add(`effect-${choice.effect.type}`);
            }

            const choiceName = document.createElement('h4');
            
            // Add icon based on effect type
            let iconPrefix = '✦'; // Default
            if (choice.effect) {
                switch (choice.effect.type) {
                    case 'heal':
                        iconPrefix = '❤️';
                        break;
                    case 'stat_boost':
                        iconPrefix = '⚔️';
                        break;
                    case 'stat_boost_percent':
                        iconPrefix = '📊';
                        break;
                }
            }
            choiceName.innerHTML = `${iconPrefix} ${choice.name}`;
            
            const choiceDesc = document.createElement('p');
            choiceDesc.textContent = choice.description;

            const selectButton = document.createElement('button');
            selectButton.className = 'button choice-select-button';
            selectButton.textContent = 'Select';
            selectButton.dataset.choiceName = choice.name; // Store choice name for handler

            // Attach event listener to the button
            selectButton.addEventListener('click', () => this.handleChoiceSelection(choice));

            choiceElement.appendChild(choiceName);
            choiceElement.appendChild(choiceDesc);
            choiceElement.appendChild(selectButton);
            this.choiceListElement.appendChild(choiceElement);
        });
    }

    /**
     * Called when a choice button is clicked in the stage details panel
     * @param {Object} choice - The selected choice object
     */
    async handleChoiceSelection(choice) {
        console.log('Choice selected:', choice);
        // Check if the choice requires character selection
        if (choice.effect && (choice.effect.target === 'selected' || choice.effect.target === 'selected_living' || choice.effect.target === 'selected_dead')) {
            this.selectedChoice = choice; // Store the selected choice
            this.showCharacterSelectionModal(choice); // Show modal to pick character
        } else if (choice.effect && choice.effect.target === 'all') {
            // If target is 'all', apply effect directly without modal
            try {
                showLoadingOverlay(`Applying effect: ${choice.name}...`); // Use placeholder
                const hasMore = await this.storyManager.applyChoiceEffectAndAdvance(choice, null); // Pass null for targetCharacterId
                hideLoadingOverlay(); // Use placeholder
                if (hasMore) {
                    this.closeStageDetails();
                    this.renderPlayerTeam(); // Update team display
                    this.updateStageNodes(); // Update map node statuses
                } else {
                    // Story complete or error occurred
                    this.closeStageDetails();
                    if (!this.storyManager.isStoryComplete()) {
                        showPopupMessage("Failed to apply effect.", 'error');
                    } else {
                        this.showStoryCompleteScreen();
                    }
                }
            } catch (error) {
                hideLoadingOverlay(); // Use placeholder
                console.error("Error applying 'all' target effect:", error);
                showPopupMessage(`Error applying effect: ${error.message}`, 'error');
            }
        } else {
            // Handle other cases or choices without effects if needed
            console.warn('Selected choice does not require character selection or target \'all\', or effect/target is missing:', choice);
            // Maybe just close the details panel?
            // this.closeStageDetails();
        }
    }

    /**
     * Displays the modal for selecting a character to apply a choice effect to.
     * @param {Object} choice - The choice that was selected.
     */
    showCharacterSelectionModal(choice) {
        const playerTeam = this.storyManager.playerTeam;
        this.characterSelectionList.innerHTML = ''; // Clear previous list

        if (!playerTeam || playerTeam.length === 0) {
            console.error("Cannot select character, player team is empty.");
            // Optionally show an error message to the user
            return;
        }

        // Update modal description
        this.choiceModalDescription.textContent = `Apply '${choice.name}' to which character?`;

        // --- NEW: Filter characters based on choice target --- 
        const targetType = choice.target || 'selected'; // Default to 'selected' if not specified
        let availableCharacters = [];

        if (targetType === 'selected_dead') {
            availableCharacters = playerTeam.filter(c => c.currentHP <= 0);
            if (availableCharacters.length === 0) {
                console.log("No dead characters available for revive.");
                // Show message to user and close modal?
                this.choiceModalDescription.textContent = "No fallen allies to revive!";
                // Optionally disable closing modal automatically
                // setTimeout(() => this.closeCharacterSelectionModal(), 2000);
                return; // Prevent modal from showing empty list
            }
        } else if (targetType === 'selected_living') {
            availableCharacters = playerTeam.filter(c => c.currentHP > 0);
             if (availableCharacters.length === 0) {
                console.log("No living characters available for this choice.");
                this.choiceModalDescription.textContent = "No conscious allies available for this choice!";
                return; // Prevent modal from showing empty list
            }
        } else { // Default case ('selected', or any other value) - allow targeting any character (dead or alive)
            // For standard heals/buffs, should we prevent targeting dead? YES.
            availableCharacters = playerTeam.filter(c => c.currentHP > 0); 
            if (availableCharacters.length === 0) {
                console.log("No living characters available for this choice.");
                this.choiceModalDescription.textContent = "No conscious allies available for this choice!";
                return; // Prevent modal from showing empty list
            }
        }
        // --- END NEW --- 

        // Use the filtered list
        availableCharacters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-select-card';
            card.dataset.characterId = character.id;

            // --- NEW: Style dead characters --- 
            const isDead = character.currentHP <= 0;
            if (isDead) {
                card.classList.add('is-dead');
            }
            // --- END NEW ---

            const img = document.createElement('img');
            // Construct path using the directory and the filename stored in character.avatarImage
            // Encode the filename to handle spaces and other special characters safely in the URL
            // Use character.avatarImage directly as it should contain the full path
            img.src = encodeURIComponent(character.avatarImage || 'Icons/characters/default_avatar.png'); 
            img.alt = character.name;
            img.onerror = () => { img.src = 'Icons/characters/default_avatar.png'; }; // Fallback remains relative to root

            const name = document.createElement('h4');
            name.textContent = character.name || character.id;

            // Create HP bar
            const hpContainer = document.createElement('div');
            hpContainer.className = 'stat-bar hp-container';
            
            const hpPercentage = Math.max(0, Math.min(100, (character.currentHP / character.stats.hp) * 100));
            
            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            hpBar.style.width = `${hpPercentage}%`;
            
            const hpText = document.createElement('span');
            hpText.className = 'bar-text';
            hpText.textContent = `HP: ${character.currentHP}/${character.stats.hp}`;
            
            hpContainer.appendChild(hpBar);
            hpContainer.appendChild(hpText);

            // Create Mana bar
            const manaContainer = document.createElement('div');
            manaContainer.className = 'stat-bar mana-container';
            
            const manaPercentage = Math.max(0, Math.min(100, (character.currentMana / character.stats.mana) * 100));
            
            const manaBar = document.createElement('div');
            manaBar.className = 'mana-bar';
            manaBar.style.width = `${manaPercentage}%`;
            
            const manaText = document.createElement('span');
            manaText.className = 'bar-text';
            manaText.textContent = `Mana: ${character.currentMana}/${character.stats.mana}`;
            
            manaContainer.appendChild(manaBar);
            manaContainer.appendChild(manaText);

            // Create effect info
            const effectInfo = document.createElement('div');
            effectInfo.className = 'effect-preview';
            
            // Customize effect preview based on the choice
            if (choice.effect) {
                let effectText = '';
                switch (choice.effect.type) {
                    case 'heal':
                        effectText = choice.effect.amount === 'full' ? 
                            `+${character.stats.hp - character.currentHP} HP` : 
                            `+${Math.min(choice.effect.amount, character.stats.hp - character.currentHP)} HP`;
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'stat_boost':
                        effectText = `+${choice.effect.amount} ${choice.effect.stat}`;
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'stat_boost_percent':
                        // Fetch base stats asynchronously - simplified here, assume base stats are available
                        // In a real scenario, you might need to pre-load or fetch base stats
                        const baseStatValue = character.stats[choice.effect.stat] / (1 + (/* previous percentage boosts? */ 0 / 100)); // Simplified: assumes no prior % boosts
                        const boostAmount = Math.round(baseStatValue * (choice.effect.amount / 100));
                        effectText = choice.effect.stat === 'all' ?
                            `+${choice.effect.amount}% All Stats` :
                            `+${choice.effect.amount}% ${choice.effect.stat}`;
                        effectInfo.classList.add('effect-positive');
                        break;
                    // --- NEW: Add effect previews for new types --- 
                    case 'revive':
                        effectText = `Revived at ${choice.effect.amount_percent || 50}% HP`;
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'risky_medicine':
                        effectText = '50% Double HP / 50% Defeat';
                        // Add a neutral or warning class?
                        // effectInfo.classList.add('effect-neutral'); 
                        break;
                     // --- END NEW ---
                }
                effectInfo.textContent = effectText;
            }

            // Add elements to card
            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(hpContainer);
            card.appendChild(manaContainer);
            card.appendChild(effectInfo);

            // Add click listener (only if character is selectable for the current choice)
            // The filter above already ensures only valid targets are shown, so click listener is always added to displayed cards.
            card.addEventListener('click', () => this.handleCharacterSelected(character.id));

            this.characterSelectionList.appendChild(card);
        });

        this.characterSelectionModal.classList.remove('hidden');
    }

    /**
     * Closes the character selection modal.
     */
    closeCharacterSelectionModal() {
        this.characterSelectionModal.classList.add('hidden');
        this.selectedChoice = null; // Clear the stored choice
    }

    /**
     * Handles the event when a character card is clicked in the selection modal.
     * @param {string} characterId - The ID of the selected character.
     */
    async handleCharacterSelected(characterId) {
        if (!this.selectedChoice) {
            console.error("Character selected but no choice was stored.");
            this.closeCharacterSelectionModal();
            return;
        }

        console.log(`Character ${characterId} selected for choice '${this.selectedChoice.name}'`);

        try {
            // Disable interaction while processing
            // TODO: Add loading indicator?
            
            // Call StoryManager to apply the effect and advance
            const hasMoreStages = await this.storyManager.applyChoiceEffectAndAdvance(this.selectedChoice, characterId);
            
            // Close modal and details panel regardless of outcome for now
            this.closeCharacterSelectionModal();
            this.closeStageDetails();

            // UI updates (map, progress) should be handled by the onStageCompleted event listener already set up.
            if (hasMoreStages === false) {
                // If that was the last stage after the choice, maybe show story complete screen?
                // The onStageCompleted handler should already manage this.
                console.log("Choice applied, story might be complete.");
            } else {
                console.log("Choice applied, proceeding to next stage.");
                this.renderPlayerTeam(); // Re-render team immediately to show changes
                this.updateStageNodes(); // Update map nodes
                this.updateProgressIndicator(); // Update progress bar
            }

        } catch (error) {
            console.error("Error applying choice effect via StoryManager:", error);
            // Re-enable UI? Show error message?
            alert(`Failed to apply choice: ${error.message}`); 
            this.closeCharacterSelectionModal(); // Still close modal on error
        }
    }

    // Helper function to get character image path (if it exists)
    getCharacterImagePath(characterId) {
        // Assuming a naming convention like images/characters/character_id.png
        // Adjust path and extension as needed
        return `Icons/characters/${characterId}.png`; 
    }

    /**
     * Close the stage details panel
     */
    closeStageDetails() {
        this.stageDetailsElement.classList.remove('visible');
    }

    /**
     * Render the enemy list in the stage details panel
     * @param {Array} enemies - Array of enemy data
     */
    renderEnemyList(enemies) {
        this.enemyListElement.innerHTML = '';
        
        enemies.forEach(enemy => {
            const enemyElement = document.createElement('div');
            enemyElement.className = 'enemy-preview';
            
            const enemyImage = document.createElement('img');
            enemyImage.className = 'enemy-image';
            enemyImage.src = enemy.image;
            enemyImage.alt = enemy.name;
            enemyImage.onerror = () => {
                enemyImage.src = window.DEFAULT_ENEMY_IMAGE || 'Icons/enemies/default_enemy.png';
            };
            
            const enemyName = document.createElement('div');
            enemyName.className = 'enemy-name';
            enemyName.textContent = enemy.name;
            
            enemyElement.appendChild(enemyImage);
            enemyElement.appendChild(enemyName);
            
            this.enemyListElement.appendChild(enemyElement);
        });
    }

    /**
     * Render the reward list in the stage details panel
     * @param {Array} rewards - Array of reward data
     */
    renderRewardList(rewards) {
        this.rewardListElement.innerHTML = '';
        
        rewards.forEach(reward => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-preview';
            
            const rewardImage = document.createElement('img');
            rewardImage.className = 'reward-image';
            rewardImage.src = reward.image;
            rewardImage.alt = reward.name;
            rewardImage.onerror = () => {
                rewardImage.src = window.DEFAULT_REWARD_IMAGE || 'Icons/rewards/default_reward.png';
            };
            
            const rewardName = document.createElement('div');
            rewardName.className = 'reward-name';
            rewardName.textContent = reward.name;
            
            if (reward.amount) {
                rewardName.textContent += ` x${reward.amount}`;
            }
            
            rewardElement.appendChild(rewardImage);
            rewardElement.appendChild(rewardName);
            
            this.rewardListElement.appendChild(rewardElement);
        });
    }

    /**
     * Get mock enemies for a stage - in a real app, this would come from the backend
     * @param {Object} stage - The stage data
     * @returns {Array} - Array of enemy data
     */
    getMockEnemiesForStage(stage) {
        let enemies = [];
        
        // Add the boss if available
        if (stage.boss) {
            enemies.push({
                name: stage.boss,
                image: `Icons/enemies/${stage.boss.toLowerCase().replace(/\s+/g, '_')}.png`
            });
        }
        
        // Add some generic enemies based on the stage difficulty
        const enemyTypes = [
            { name: 'Minion', image: 'Icons/enemies/minion.png' },
            { name: 'Guard', image: 'Icons/enemies/guard.png' },
            { name: 'Elemental', image: 'Icons/enemies/elemental.png' }
        ];
        
        // Add 1-3 regular enemies based on difficulty
        const numEnemies = Math.min(3, Math.max(1, Math.floor(stage.difficulty / 2)));
        for (let i = 0; i < numEnemies; i++) {
            enemies.push(enemyTypes[i % enemyTypes.length]);
        }
        
        // Add error handler for images
        enemies.forEach(enemy => {
            const img = new Image();
            img.onerror = () => {
                enemy.image = 'Icons/enemies/default_enemy.png';
            };
            img.src = enemy.image;
        });
        
        return enemies;
    }

    /**
     * Get mock rewards for a stage - in a real app, this would come from the backend
     * @param {Object} stage - The stage data
     * @returns {Array} - Array of reward data
     */
    getMockRewardsForStage(stage) {
        // Scale rewards based on difficulty
        const baseGold = 50 + (stage.difficulty * 25);
        const baseXP = 25 + (stage.difficulty * 15);
        
        const rewards = [
            {
                name: 'Gold',
                image: 'Icons/rewards/gold.png',
                amount: baseGold
            },
            {
                name: 'Experience',
                image: 'Icons/rewards/experience.png',
                amount: baseXP
            }
        ];
        
        // Add special rewards for higher difficulty stages
        if (stage.difficulty >= 5) {
            rewards.push({
                name: 'Rare Item',
                image: 'Icons/rewards/rare_item.png'
            });
        }
        
        if (stage.difficulty >= 8) {
            rewards.push({
                name: 'Epic Item',
                image: 'Icons/rewards/epic_item.png'
            });
        }
        
        // Add error handler for images
        rewards.forEach(reward => {
            const img = new Image();
            img.onerror = () => {
                reward.image = 'Icons/rewards/default_reward.png';
            };
            img.src = reward.image;
        });
        
        return rewards;
    }

    /**
     * Start the current stage
     */
    startCurrentStage() {
        const battleURL = this.storyManager.startStageBattle();
        
        // Close the details panel
        this.closeStageDetails();
        
        // Navigate to the battle page
        window.location.href = battleURL;
    }

    /**
     * Checks local storage for results from a battle and updates the story state.
     */
    checkBattleResults() {
        const battleResultJson = localStorage.getItem('battleResult');
        if (!battleResultJson) {
            console.log('No battle result found in localStorage.');
            return;
        }

        localStorage.removeItem('battleResult'); // Clear the result after reading

        try {
            const result = JSON.parse(battleResultJson);
            console.log('Processing battle result:', result);

            // Check if the result is for the current story and stage
            const currentStoryId = this.storyManager.currentStory?.id;
            const currentStageIndex = this.storyManager.storyProgress?.currentStageIndex;

            if (result.storyId !== currentStoryId) {
                 console.warn("Battle result story ID doesn't match current story. Ignoring.");
                 return;
            }
            
            // Important: The result's stageIndex *should* correspond to the stage that was *just played*. 
            // The StoryManager's currentStageIndex might have already been incremented if it was a victory.
            // We need to be careful here. Let's assume the result.stageIndex is the index of the completed battle.

            if (result.victory) {
                console.log("Battle won! Advancing stage...");
                
                // Extract survivor state from the battle result
                const survivorState = result.survivorsState || []; // GameManager needs to add this
                
                // Advance the stage in StoryManager, which also updates team state and saves progress
                this.storyManager.advanceStage({ 
                    victory: true, 
                    survivorsState: survivorState 
                }).then(() => {
                    // Check if the story is now complete
                    if (this.storyManager.isStoryComplete()) {
                        this.showStoryCompleteScreen();
                    } else {
                        // Show victory screen for the *completed* stage
                        const completedStageData = this.storyManager.getStageByIndex(result.stageIndex);
                        const rewards = completedStageData?.rewards || this.getMockRewardsForStage(completedStageData);
                        this.showVictoryScreen(rewards);
                    }
                    // Update UI elements after advancing
                    this.updateStageNodes();
                    this.updateProgressIndicator();
                    this.renderPlayerTeam(); // Re-render team with potentially updated HP/Mana
                }).catch(error => {
                     console.error("Error advancing stage after victory:", error);
                });
                
            } else {
                console.log("Battle lost. Showing game over screen.");
                // Update team state in StoryManager to reflect defeat (e.g., reset HP? Keep state?)
                // Currently, advanceStage handles not changing state on loss.
                // We might want a specific method like `handleDefeat()` if needed.
                this.showGameOverScreen();
                // Re-render team to show potentially low HP/Mana from the loss
                this.renderPlayerTeam(); 
            }

        } catch (error) {
            console.error('Error parsing battle result:', error);
        }
    }

    /**
     * Update the stage nodes based on current progress
     */
    updateStageNodes() {
        const stages = this.storyManager.getAllStages();
        
        stages.forEach((stage, index) => {
            const nodeElement = this.mapStagesElement.querySelector(`[data-stage-index="${index}"]`);
            if (nodeElement) {
                // Reset classes
                nodeElement.classList.remove('completed', 'active', 'locked');
                
                // Add appropriate class
                if (stage.isCompleted) {
                    nodeElement.classList.add('completed');
                } else if (stage.isActive) {
                    nodeElement.classList.add('active');
                } else if (stage.isLocked) {
                    nodeElement.classList.add('locked');
                }
                
                // Update status indicator
                const statusElement = nodeElement.querySelector('.stage-status');
                if (statusElement) {
                    statusElement.className = 'stage-status';
                    
                    if (stage.isCompleted) {
                        statusElement.classList.add('status-completed');
                        statusElement.textContent = '✓';
                    } else if (stage.isActive) {
                        statusElement.classList.add('status-active');
                        statusElement.textContent = '!';
                    } else {
                        statusElement.classList.add('status-locked');
                        statusElement.textContent = '🔒';
                    }
                }
            }
        });
    }

    /**
     * Show the victory screen
     * @param {Array} rewards - Rewards earned from the battle
     */
    showVictoryScreen(rewards = []) {
        // Populate rewards
        const rewardList = document.getElementById('victory-reward-list');
        rewardList.innerHTML = '';
        
        rewards.forEach(reward => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-preview';
            
            const rewardImage = document.createElement('img');
            rewardImage.className = 'reward-image';
            rewardImage.src = reward.image || 'Icons/rewards/default_reward.png';
            rewardImage.alt = reward.name;
            rewardImage.onerror = () => {
                rewardImage.src = window.DEFAULT_REWARD_IMAGE || 'Icons/rewards/default_reward.png';
            };
            
            const rewardName = document.createElement('div');
            rewardName.className = 'reward-name';
            rewardName.textContent = reward.name;
            
            if (reward.amount) {
                rewardName.textContent += ` x${reward.amount}`;
            }
            
            rewardElement.appendChild(rewardImage);
            rewardElement.appendChild(rewardName);
            
            rewardList.appendChild(rewardElement);
        });
        
        // Show the screen
        this.victoryScreenElement.classList.add('visible');
    }

    /**
     * Hide the victory screen
     */
    hideVictoryScreen() {
        this.victoryScreenElement.classList.remove('visible');
    }

    /**
     * Show the game over screen
     */
    showGameOverScreen() {
        this.gameOverScreenElement.classList.add('visible');
    }

    /**
     * Hide the game over screen
     */
    hideGameOverScreen() {
        this.gameOverScreenElement.classList.remove('visible');
    }

    /**
     * Show the story complete screen
     */
    showStoryCompleteScreen() {
        this.storyCompleteScreenElement.classList.add('visible');
    }

    /**
     * Hide the story complete screen
     */
    hideStoryCompleteScreen() {
        this.storyCompleteScreenElement.classList.remove('visible');
    }

    /**
     * Continue to the next stage
     */
    continueToNextStage() {
        this.hideVictoryScreen();
        this.renderStoryMap();
    }

    /**
     * Retry the current stage
     */
    retryCurrentStage() {
        this.hideGameOverScreen();
        const battleURL = this.storyManager.startStageBattle();
        window.location.href = battleURL;
    }

    /**
     * Quit the current story and return to character selection
     * This will delete the current story progress
     */
    async quitStory() {
        console.log('Quitting story...');
        if (confirm('Are you sure you want to quit? This will end your current run.')) {
            try {
                // Delete the story progress from Firebase
                await this.storyManager.deleteSavedProgress();
                console.log('Story progress deleted.');
                window.location.href = 'character-selector.html';
            } catch (error) {
                console.error('Error quitting story:', error);
                alert('Failed to quit story. Please try again.');
            }
        }
    }

    /**
     * Returns to character selection without clearing progress.
     */
    backToSelection() {
        console.log("Returning to character selection...");
        window.location.href = 'character-selector.html';
    }

    /**
     * Goes to character selection after completing a story (clears progress).
     */
    newStory() {
        console.log("Story complete, choosing a new story...");
        this.storyManager.clearSavedProgress(); // Clear localStorage
        window.location.href = 'character-selector.html';
    }

    /**
     * Renders the recruitment offers for a recruitment stage.
     * @param {Object} stage - The stage data containing recruitTag and recruitCount.
     */
    async renderRecruitmentOffers(stage) {
        console.log('[StoryUI] Rendering recruitment offers for:', stage.name);
        this.recruitListElement.innerHTML = '<div class="loading-spinner"></div>'; // Show loading indicator

        try {
            const offers = await this.storyManager.getRecruitmentOffers(stage);
            this.recruitListElement.innerHTML = ''; // Clear loading

            if (!offers || offers.length === 0) {
                this.recruitListElement.innerHTML = '<p>No available allies found matching the criteria.</p>';
                return;
            }

            offers.forEach(offer => {
                const offerCard = this.createRecruitOfferCard(offer);
                this.recruitListElement.appendChild(offerCard);
            });

            // Make container visible
            this.stageRecruitContainer.classList.remove('hidden');

        } catch (error) {
            console.error('[StoryUI] Error rendering recruitment offers:', error);
            this.recruitListElement.innerHTML = '<p class="error-message">Error loading potential allies.</p>';
        }
    }

    /**
     * Creates a card element for a single recruitment offer.
     * @param {Object} offer - The character offer data (id, name, image, stats).
     * @returns {HTMLElement} The created card element.
     */
    createRecruitOfferCard(offer) {
        const card = document.createElement('div');
        card.className = 'recruit-offer-card character-card selectable'; // Reuse some styles
        card.dataset.characterId = offer.id;

        // Image
        const img = document.createElement('img');
        img.src = offer.image || 'images/characters/default.png';
        img.alt = offer.name;
        img.className = 'character-avatar'; // Reuse style
        card.appendChild(img);

        // Info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'character-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'character-name';
        nameDiv.textContent = offer.name;
        infoDiv.appendChild(nameDiv);

        // Optional: Basic Stats (HP/Mana)
        if (offer.stats) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'character-stats small'; // Smaller version
            statsDiv.innerHTML = `
                <div class="stat-item"><span class="stat-label">HP:</span> ${offer.stats.hp || 'N/A'}</div>
                <div class="stat-item"><span class="stat-label">MP:</span> ${offer.stats.mana || 'N/A'}</div>
            `;
            infoDiv.appendChild(statsDiv);
        }

        card.appendChild(infoDiv);

        // Add click listener to recruit
        card.addEventListener('click', () => this.handleRecruitSelection(offer.id));

        return card;
    }

    /**
     * Handles the selection of a character to recruit.
     * @param {string} characterId - The ID of the character selected.
     */
    async handleRecruitSelection(characterId) {
        console.log(`[StoryUI] Recruit selected: ${characterId}`);
        // Optionally add confirmation
        // if (!confirm(`Are you sure you want to recruit ${characterId}?`)) {
        //     return;
        // }

        showLoadingOverlay('Adding ally to your team...');

        try {
            // Call the storyManager to handle recruitment logic
            const hasMoreStages = await this.storyManager.addRecruitedCharacter(characterId);

            // Recruitment is handled like stage completion, so onStageCompleted event
            // will trigger UI updates (progress, map, etc.).
            // We just need to close the details panel.
            this.closeStageDetails();
            this.renderPlayerTeam(); // Re-render team immediately to show the new member

            if (!hasMoreStages) {
                // If recruitment was the last action, show story complete screen
                this.showStoryCompleteScreen();
            } else {
                // Optionally, briefly show a success message or transition
                showPopupMessage("Ally recruited!", "success", 2000);
            }

        } catch (error) {
            console.error('[StoryUI] Error during recruitment:', error);
            showPopupMessage(`Error recruiting: ${error.message}`, 'error');
        } finally {
            hideLoadingOverlay();
        }
    }

    /**
     * Initializes the map dragging functionality.
     */
    initializeMapDragging() {
        const mapElement = this.storyMapElement;
        const stagesContainer = this.mapStagesElement;
        const pathElement = this.mapPathElement;

        if (!mapElement || !stagesContainer) {
            console.error("Map elements not found for dragging initialization.");
            return;
        }

        let isDragging = false;
        let startX, startY;
        let initialTranslateX = 0, initialTranslateY = 0;
        let currentTranslateX = 0, currentTranslateY = 0;
        let currentScale = 1.0; // Initial zoom level

        // --- Get initial transform values if already set ---
        const initialTransform = stagesContainer.style.transform;
        if (initialTransform && initialTransform.includes('translate')) {
            const match = initialTransform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
            if (match) {
                initialTranslateX = parseFloat(match[1]);
                initialTranslateY = parseFloat(match[2]);
                currentTranslateX = initialTranslateX;
                currentTranslateY = initialTranslateY;
            }
        }
        
        // Set initial transform 
        this.applyMapTransform(stagesContainer, pathElement, currentTranslateX, currentTranslateY, currentScale);
        
        // --- Mouse wheel for zooming ---
        mapElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Determine zoom direction
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out (0.9) or in (1.1)
            
            // Calculate new scale with limits
            const newScale = Math.max(0.5, Math.min(2.5, currentScale * zoomFactor));
            
            // Only proceed if scale changed
            if (newScale !== currentScale) {
                // Calculate mouse position relative to the map
                const mapRect = mapElement.getBoundingClientRect();
                const mouseX = e.clientX - mapRect.left;
                const mouseY = e.clientY - mapRect.top;
                
                // Calculate zoom around mouse position
                const scaleRatio = newScale / currentScale;
                const newTranslateX = mouseX - (mouseX - currentTranslateX) * scaleRatio;
                const newTranslateY = mouseY - (mouseY - currentTranslateY) * scaleRatio;
                
                // Update current values
                currentScale = newScale;
                currentTranslateX = newTranslateX;
                currentTranslateY = newTranslateY;
                
                // Apply transform
                this.applyMapTransform(stagesContainer, pathElement, currentTranslateX, currentTranslateY, currentScale);
            }
        });

        mapElement.addEventListener('mousedown', (e) => {
            // --- Updated Drag Start Condition ---
            // Allow drag if clicking on map background OR the map container
            // Disallow drag if clicking on a stage node or its children
            const clickedOnNode = e.target.closest('.stage-node');
            
            if (clickedOnNode) {
                return; // Don't start drag if click is on a node
            } 
            
            // If the click wasn't on a node, proceed with dragging
            isDragging = true;
            mapElement.classList.add('dragging');
            // Record starting mouse position relative to the viewport
            startX = e.pageX;
            startY = e.pageY;
            // Record the transform value when dragging starts
            initialTranslateX = currentTranslateX;
            initialTranslateY = currentTranslateY;
            e.preventDefault();
        });

        mapElement.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                mapElement.classList.remove('dragging');
            }
        });

        mapElement.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                mapElement.classList.remove('dragging');
            }
        });

        mapElement.addEventListener('mousemove', (e) => {
            if (!isDragging) {
                return;
            }
            e.preventDefault();

            // Calculate mouse movement delta
            const dx = e.pageX - startX;
            const dy = e.pageY - startY;

            // Calculate new transform values
            let newTranslateX = initialTranslateX + dx;
            let newTranslateY = initialTranslateY + dy;

            // Update current translate values
            currentTranslateX = newTranslateX;
            currentTranslateY = newTranslateY;

            // Apply the transform
            this.applyMapTransform(stagesContainer, pathElement, currentTranslateX, currentTranslateY, currentScale);
        });

        console.log("[StoryUI] Map dragging and zooming initialized.");
    }

    /**
     * Helper method to apply transform to both map elements
     * @param {HTMLElement} stagesContainer - The stages container element
     * @param {HTMLElement} pathElement - The path element
     * @param {number} translateX - Translation X value
     * @param {number} translateY - Translation Y value
     * @param {number} scale - Scale value
     */
    applyMapTransform(stagesContainer, pathElement, translateX, translateY, scale) {
        const transformValue = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        stagesContainer.style.transform = transformValue;
        if (pathElement) {
            pathElement.style.transform = transformValue;
        }
        
        // Update zoom percentage display if element exists
        if (this.zoomTextElement) {
            const zoomPercentage = Math.round(scale * 100);
            this.zoomTextElement.textContent = `Zoom: ${zoomPercentage}%`;
        }
    }
} 