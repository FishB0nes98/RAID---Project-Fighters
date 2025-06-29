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
        this.characterUnlockInProgress = false; // Prevent multiple unlock actions
        
        // Initialize character registry cache
        this.characterRegistry = null;
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
        this.closeDetailsButton = document.getElementById('close-details-button');
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

        // Initialize inventory system for story mode (async, but don't block UI)
        this.initializeInventorySystem().catch(error => {
            console.error('[StoryUI] Error during inventory initialization:', error);
        });

        // Setup inventory event handlers
        this.setupInventoryEventHandlers();

        // Set global reference for inline events
        window.storyUI = this;

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

        if (newStoryButton) newStoryButton.addEventListener('click', async () => await this.newStory());
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
        
        // Add event story indicator if applicable
        const eventInfo = this.storyManager.getEventStoryInfo();
        if (eventInfo) {
            // Create event indicator
            const eventIndicator = document.createElement('div');
            eventIndicator.className = 'event-story-indicator';
            eventIndicator.innerHTML = `
                <div class="event-badge">
                    <span class="event-icon">🎭</span>
                    <span class="event-text">EVENT STORY</span>
                </div>
                <div class="event-type">${eventInfo.eventType === 'temporary' ? 'Temporary Event' : 'Special Event'}</div>
            `;
            
            // Insert after title
            this.storyTitleElement.parentNode.insertBefore(eventIndicator, this.storyTitleElement.nextSibling);
        }
        
        // Add character restrictions info if applicable
        const allowedCharacters = this.storyManager.getAllowedCharactersForStory();
        if (allowedCharacters.length > 0) {
            const restrictionIndicator = document.createElement('div');
            restrictionIndicator.className = 'character-restriction-indicator';
            restrictionIndicator.innerHTML = `
                <div class="restriction-badge">
                    <span class="restriction-icon">👥</span>
                    <span class="restriction-text">RESTRICTED CHARACTERS</span>
                </div>
                <div class="allowed-characters">
                    Only ${allowedCharacters.length} character${allowedCharacters.length > 1 ? 's' : ''} allowed: ${allowedCharacters.join(', ')}
                </div>
            `;
            
            // Insert after description
            this.storyDescriptionElement.parentNode.insertBefore(restrictionIndicator, this.storyDescriptionElement.nextSibling);
        }
        
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
            
            // Mark dead characters
            if (character.currentHP <= 0) {
                characterCard.classList.add('is-dead');
            }
            
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
            
            // Create level display
            const levelSpan = document.createElement('span');
            levelSpan.className = 'character-level';
            levelSpan.textContent = `Lv.${character.level || 1}`;
            
            // Create name text
            const nameText = document.createElement('span');
            nameText.className = 'character-name-text';
            nameText.textContent = character.name;
            
            nameSpan.appendChild(levelSpan);
            nameSpan.appendChild(nameText);
            
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
            }
            
            const hpText = document.createElement('div');
            hpText.className = 'bar-text';
            if (currentHP !== 'N/A' && maxHP !== 'N/A') {
                hpText.textContent = `${currentHP}/${maxHP}`;
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
            }
            
            const manaText = document.createElement('div');
            manaText.className = 'bar-text';
            if (currentMana !== 'N/A' && maxMana !== 'N/A') {
                manaText.textContent = `${currentMana}/${maxMana}`;
            }
            
            // Assemble the bars
            hpBarContainer.appendChild(hpBar);
            hpBarContainer.appendChild(hpText);
            manaBarContainer.appendChild(manaBar);
            manaBarContainer.appendChild(manaText);
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
            
            // Character actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'character-actions';
            
            const inventoryBtn = document.createElement('button');
            inventoryBtn.className = 'character-inventory-btn';
            inventoryBtn.textContent = '🎒';
            inventoryBtn.title = 'Manage Inventory';
            inventoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openCharacterInventory(character.id);
            });
            
            actionsDiv.appendChild(inventoryBtn);
            
            // Assemble the component
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(statsDiv);
            infoDiv.appendChild(tagsDiv);
            infoDiv.appendChild(actionsDiv);
            
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

                // Determine story title here for special logic
                const storyTitle = this.storyManager.currentStory?.title;
                const isHellStory = storyTitle === "To The Hell We Go";

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
                    // Connect nodes sequentially for all stories
                    if (index > 0) {
                        const prevPos = positions[index - 1];
                         if (prevPos && typeof prevPos.x !== 'undefined' && typeof prevPos.y !== 'undefined') {
                            const isCompleted = stage.isCompleted || stage.isActive; // Path is completed if the destination stage is reached or passed
                            const pathSegment = this.createPathSegment(prevPos, pos, isCompleted);
                            this.mapPathElement.appendChild(pathSegment);
                        }
                    }
                });

                // For "To The Hell We Go" story, we still use sequential connections
                // but with the improved positioning layout above
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

            // Increase the effective container height to accommodate more spacing
            const effectiveHeight = Math.max(mapContainerHeight, 1800); // Increased minimum height for better spacing
            
            // Create a cleaner, more organized layout that follows a logical flow
            // Arranged in a clear path from top to bottom with minimal line crossings
            const layout = {
                "Burning School Gym": { x: 0.15, y: 0.08 },   // Start: Top left
                "School Corridor":    { x: 0.45, y: 0.08 },   // Move right
                "School Yard":        { x: 0.75, y: 0.08 },   // Continue right
                "Classroom 5B Door":  { x: 0.75, y: 0.25 },   // Recruit: Down from yard
                "Rooftop":            { x: 0.45, y: 0.25 },   // Center position
                "Final Choice":       { x: 0.15, y: 0.25 },   // Left choice
                "Bathroom Entrance":  { x: 0.15, y: 0.42 },   // Recruit: Down from choice
                "Bathroom Fight":     { x: 0.45, y: 0.42 },   // Battle: Center
                "Principal's Office": { x: 0.75, y: 0.42 },   // Office: Right path
                "Returning to the Burning School Gym": { x: 0.45, y: 0.62 }, // Final boss: Center
                "School Liberation Complete": { x: 0.35, y: 0.92 } // Reward: Further down and offset horizontally
            };

            stages.forEach((stage, index) => {
                let posPercent = layout[stage.name];
                let x, y;

                if (posPercent) {
                    // Calculate absolute pixel values from percentages using effective height
                    x = posPercent.x * mapContainerWidth;
                    y = posPercent.y * effectiveHeight;
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
                // For Blazing School Day, don't clamp Y to container height since we want scrollable area
                x = Math.max(minPadding, Math.min(x, mapContainerWidth - stageWidth - minPadding));
                y = Math.max(minPadding, Math.min(y, effectiveHeight - stageHeight - minPadding));

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
        } else if (storyTitle === "To The Hell We Go" && mapContainerWidth > 0 && mapContainerHeight > 0) {
            console.log("[StoryUI] Applying SPECIFIC hellish descent layout for 'To The Hell We Go'");
            
            // Create a descent into hell layout that follows the narrative progression
            // This will create a winding path downward with branching for choices
            
            // Map dimensions - ensure plenty of space for the hellish journey
            const width = Math.max(mapContainerWidth, 2800);
            const height = Math.max(mapContainerHeight, 2200);
            
            // Define specific positions for each stage in the To The Hell We Go story
            // Organized in clear tiers with proper branching and convergence
            const hellLayout = {
                // Tier 1: Entry to Hell
                "The Devil's Bargain": { x: 0.50, y: 0.08 },           // Start at the gates of hell (top center)
                
                // Tier 2: First Battle
                "Hell's Entrance Hall": { x: 0.50, y: 0.20 },          // Enter hell proper (below gates)
                
                // Tier 3: First Branch - Allies vs Sacrifices
                "Calling for Reinforcements": { x: 0.25, y: 0.32 },    // Call for allies (left branch)
                "Hellish Sacrifices": { x: 0.75, y: 0.32 },            // Dark choices (right branch)
                
                // Tier 4: Convergence at Smith Cave
                "Smith Cave": { x: 0.50, y: 0.44 },                    // Central forge (convergence point)
                
                // Tier 5: Weapon Choice
                "Molten Weapons Choice": { x: 0.50, y: 0.56 },         // Weapon selection (center)
                
                // Tier 6: Second Branch - Desert vs More Allies
                "Desert in Hell": { x: 0.25, y: 0.68 },                // Desert trials (left descent)
                "Demonic Reinforcements": { x: 0.75, y: 0.68 },        // Final summoning (right descent)
                
                // Tier 7: Convergence at Beast Gauntlet
                "Infernal Beast Gauntlet": { x: 0.50, y: 0.80 },       // Beast battle (convergence point)
                
                // Tier 8: Final Choices and Exit
                "Hell's Oasis": { x: 0.50, y: 0.92 },                  // Oasis choices (center)
                "Oasis Exit": { x: 0.50, y: 1.04 },                    // Exit preparation (center)
                
                // Tier 9: Final Boss
                "Hell Castle Entrance Guardians": { x: 0.50, y: 1.16 }, // Castle guardians
                
                // Tier 10: Final Preparation
                "Final Preparation": { x: 0.50, y: 1.28 },               // Final choice before end
                
                // Tier 11: Throne Room Boss
                "Hell Castle Throne": { x: 0.50, y: 1.40 }                // Final battle vs Grok
            };
             
             stages.forEach((stage, index) => {
                 let position = hellLayout[stage.name];
                 
                 if (position) {
                     // Calculate absolute pixel values from percentages
                     const x = position.x * width;
                     const y = position.y * height;
                     
                     // No jitter for clean connections
                     positions.push({ x, y });
                 } else {
                     // Fallback for any unexpected stages
                     console.warn(`[StoryUI] No specific position defined for stage: ${stage.name}. Using fallback.`);
                     const fallbackX = minPadding + (mapContainerWidth / 3) * (index % 3);
                     const fallbackY = minPadding + Math.floor(index / 3) * (stageHeight + 150);
                     positions.push({ x: fallbackX, y: fallbackY });
                 }
             });
        } else if (storyTitle === "Saving Atlantis" && mapContainerWidth > 0 && mapContainerHeight > 0) {
            console.log("[StoryUI] Applying SPECIFIC layout for 'Saving Atlantis'");
            // Ensure plenty of scrollable area
            const width = Math.max(mapContainerWidth, 2600);
            const height = Math.max(mapContainerHeight, 2000);

            const layout = {
                "The Deep Waters": { x: 0.50, y: 0.05 },
                "Atlantean Blessings": { x: 0.50, y: 0.15 },
                "Frozen Underground Ruins": { x: 0.25, y: 0.30 },
                "Alliance with Sub Zero": { x: 0.25, y: 0.40 },
                "Ambush of the Shadow Assassins": { x: 0.75, y: 0.40 },
                "Returning Home": { x: 0.75, y: 0.50 },
                "Dark Underwater Cave": { x: 0.50, y: 0.60 },
                "Atlantean Recovery Chamber": { x: 0.25, y: 0.70 },
                "The Ruler's Return": { x: 0.75, y: 0.70 },
                "Ancient Atlantean Throne Room": { x: 0.50, y: 0.85 },
                "Legacy of Atlantis": { x: 0.50, y: 0.95 }
            };

            stages.forEach((stage, index) => {
                let posPercent = layout[stage.name];
                let x, y;

                if (posPercent) {
                    x = posPercent.x * width;
                    y = posPercent.y * height;
                } else {
                    // Fallback grid if unexpected stage found
                    const cols = 3;
                    const colIndex = index % cols;
                    const rowIndex = Math.floor(index / cols);
                    x = minPadding + (width / cols) * colIndex;
                    y = minPadding + rowIndex * (stageHeight + 120);
                }

                // Apply jitter to avoid perfect alignment
                const jitter = 30;
                x += (Math.random() - 0.5) * jitter;
                y += (Math.random() - 0.5) * jitter;

                // Clamp within bounds
                x = Math.max(minPadding, Math.min(x, width - stageWidth - minPadding));
                y = Math.max(minPadding, Math.min(y, height - stageHeight - minPadding));

                positions.push({ x, y });
            });

            // Expand container to allow scrolling
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
        
        // Check if this is the "To The Hell We Go" story for special styling
        const storyTitle = this.storyManager.currentStory?.title;
        const isHellStory = storyTitle === "To The Hell We Go";
        
        // Check if this is an event story for special styling
        const isEventStory = this.storyManager.isEventStory();
        
        if (isHellStory) {
            nodeElement.classList.add('hellish-node');
        }
        
        if (isEventStory) {
            nodeElement.classList.add('event-story');
        }
        
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
        
        // Add stage type indicator for special styling
        if (stage.type === 'character_unlock') {
            nodeElement.classList.add('character-unlock');
        } else if (stage.type === 'recruit') {
            nodeElement.classList.add('recruit');
        } else if (stage.type === 'choice') {
            nodeElement.classList.add('choice');
        }
        
        // Add stage title
        const titleElement = document.createElement('div');
        titleElement.className = 'stage-title';
        titleElement.textContent = stage.name;
        
        // Add difficulty indicator
        const difficultyElement = document.createElement('div');
        difficultyElement.className = 'stage-difficulty';
        if (stage.difficulty) {
        difficultyElement.classList.add(`difficulty-${stage.difficulty}`);
        difficultyElement.textContent = `Difficulty: ${stage.difficulty}`;
        } else {
            difficultyElement.textContent = 'Non-Combat';
        }
        
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
        nodeElement.addEventListener('click', () => {
            // Ensure stage has index property
            const stageWithIndex = {
                ...stage,
                index: stage.index || parseInt(nodeElement.dataset.stageIndex)
            };
            this.handleStageNodeClick(stageWithIndex);
        });
        
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
        
        // Check if this is the "To The Hell We Go" story for special styling
        const storyTitle = this.storyManager.currentStory?.title;
        const isHellStory = storyTitle === "To The Hell We Go";
        
        // Check if this is an event story for special styling
        const isEventStory = this.storyManager.isEventStory();
        
        if (isCompleted) {
            segment.classList.add('completed');
        }
        
        if (isHellStory) {
            segment.classList.add('hellish-path');
        }
        
        if (isEventStory) {
            segment.classList.add('event-path');
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
        segment.style.transformOrigin = '0 0';
        
        // Add arrow indicator for direction
        const arrow = document.createElement('div');
        arrow.className = 'path-arrow';
        if (isCompleted) {
            arrow.classList.add('completed');
        }
        if (isHellStory) {
            arrow.classList.add('hellish-arrow');
        }
        if (isEventStory) {
            arrow.classList.add('event-arrow');
        }
        segment.appendChild(arrow);
        
        // Add hellish particles effect for hell story
        if (isHellStory) {
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('div');
                particle.className = 'hell-particle';
                particle.style.left = `${20 + i * 30}%`;
                particle.style.animationDelay = `${i * 0.5}s`;
                segment.appendChild(particle);
            }
        }
        
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

        // Get the full stage data from the story manager
        const fullStageData = this.storyManager.getAllStages()[stage.index];
        console.log('[StoryUI] Full stage data from story manager:', fullStageData);

        // Reset UI elements
        this.stageChoicesContainer.classList.add('hidden');
        this.stageRecruitContainer.classList.add('hidden');

        // Handle stage type
        switch (stage.type) {
            case 'battle':
            case 'boss':
                await this.showStageDetails(fullStageData);
                break;
            case 'choice':
                await this.showStageDetails(fullStageData); // Show base details
                this.renderStageChoices(fullStageData.choices); // Render choices
                break;
            case 'recruit':
                await this.showStageDetails(fullStageData); // Show base details
                await this.renderRecruitmentOffers(fullStageData); // Render recruitment offers
                break;
            case 'character_unlock':
                await this.showStageDetails(fullStageData); // Show base details
                await this.renderCharacterUnlockOffers(fullStageData); // Render character unlock offers
                break;
            case 'ally_selection':
                await this.showStageDetails(fullStageData); // Show base details - custom demonic interface is rendered inside showStageDetails
                // Note: No additional renderAllySelection call - demonic interface handles everything
                break;
            case 'healing_and_recruit':
                await this.showStageDetails(fullStageData); // Show base details
                // Don't process effects here - wait for user to click "Continue Journey"
                break;
            default:
                console.error("Unknown stage type:", stage.type);
                await this.showStageDetails(fullStageData); // Default to showing details
        }
    }

    /**
     * Show the stage details panel
     * @param {Object} stage - The stage data
     */
    async showStageDetails(stage) {
        const detailsPanel = document.getElementById('stage-details');
        const stageName = document.getElementById('stage-name');
        const stageDifficulty = document.getElementById('stage-difficulty');
        const stageImage = document.getElementById('stage-image');
        const stageDescription = document.getElementById('stage-description');
        const enemyList = document.getElementById('enemy-list');
        const rewardList = document.getElementById('reward-list');
        const choicesContainer = document.getElementById('stage-choices-container');
        const recruitContainer = document.getElementById('stage-recruit-container');
        const stageActions = document.querySelector('.stage-actions');

        // Check if this is a battle stage
        const isBattleStage = stage.type === 'battle' || (stage.enemies && stage.enemies.length > 0);

        // Always show stage header
        stageName.textContent = stage.name;
        stageDifficulty.textContent = `Difficulty: ${stage.difficulty || 'Unknown'}`;

        if (isBattleStage) {
            // Simplified view for battle stages - only enemies and loot
            
            // Hide stage image, description, choices, and recruit sections
            document.querySelector('.stage-image-container').style.display = 'none';
            stageDescription.style.display = 'none';
            choicesContainer.classList.add('hidden');
            recruitContainer.classList.add('hidden');
            
            // Show enemies section
            document.querySelector('.stage-enemies').style.display = 'block';
            await this.renderBattleEnemyList(stage.enemies || []);
            
            // Show loot section
            document.querySelector('.stage-rewards').style.display = 'block';
            this.renderLootTable(stage);
            
        } else {
            // Full view for non-combat stages
            
            // Show all sections
            document.querySelector('.stage-image-container').style.display = 'block';
            stageDescription.style.display = 'block';
            
            // Set stage image and description
            stageImage.src = stage.backgroundImage || 'images/stages/default.png';
            stageDescription.textContent = stage.description || 'No description available.';

            // Handle choices for choice stages
            if (stage.choices && stage.choices.length > 0) {
                this.renderStageChoices(stage.choices);
                choicesContainer.classList.remove('hidden');
            } else {
                choicesContainer.classList.add('hidden');
            }

            // Handle recruitment for recruit stages
            if (stage.type === 'recruit' || stage.recruitTag || stage.specificCharacters) {
                this.renderRecruitmentOffers(stage);
                recruitContainer.classList.remove('hidden');
            } else if (stage.type === 'ally_selection') {
                this.renderAllySelection(stage);
                recruitContainer.classList.remove('hidden');
            } else if (stage.type === 'character_unlock') {
                this.renderCharacterUnlockOffers(stage);
                recruitContainer.classList.remove('hidden');
        } else if (stage.type === 'healing_and_recruit') {
                this.handleHealingAndRecruitStage(stage);
                recruitContainer.classList.remove('hidden');
        } else {
                recruitContainer.classList.add('hidden');
            }

            // Hide enemies and rewards for non-combat stages
            document.querySelector('.stage-enemies').style.display = 'none';
            document.querySelector('.stage-rewards').style.display = 'none';
        }

        // Show appropriate action button
        const startButton = document.getElementById('start-stage-button');
        if (isBattleStage) {
            startButton.textContent = 'Begin Battle';
            startButton.style.display = 'block';
        } else if (stage.type === 'choice') {
            startButton.style.display = 'none'; // Choices have their own buttons
        } else if (stage.type === 'recruit' || stage.type === 'ally_selection' || stage.type === 'character_unlock') {
            startButton.style.display = 'none'; // Recruitment has its own buttons
        } else {
            startButton.textContent = 'Continue';
            startButton.style.display = 'block';
        }

        // Show/hide stage modifiers section
        this.renderStageModifiers(stage);

        // Show the panel
        detailsPanel.classList.add('visible');
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
                    case 'heal_missing_percent':
                        iconPrefix = '🧪';
                        break;
                    case 'mana_restore_missing_percent':
                        iconPrefix = '💙';
                        break;
                    case 'heal_and_mana_restore_missing_percent':
                        iconPrefix = '🍯';
                        break;
                    case 'stat_boost':
                        iconPrefix = '⚔️';
                        break;
                    case 'stat_boost_percent':
                        iconPrefix = '📊';
                        break;
                    case 'none':
                        iconPrefix = '🚫';
                        break;
                    // --- NEW: Hell story effect icons ---
                    case 'set_magical_damage':
                        iconPrefix = '🌋';
                        break;
                    case 'demon_claws_effect':
                        iconPrefix = '👹';
                        break;
                    case 'hellish_pact_effect':
                        iconPrefix = '🔥';
                        break;
                    // --- NEW: Sacrifice effect icons ---
                    case 'sacrifice_hp_for_mana':
                        iconPrefix = '🩸';
                        break;
                    case 'sacrifice_defense_for_power':
                        iconPrefix = '⚔️';
                        break;
                    case 'sacrifice_character_for_restoration':
                        iconPrefix = '💀';
                        break;
                    // --- NEW: Molten Weapons effect icons ---
                    case 'molten_hammer_effect':
                        iconPrefix = '🔨';
                        break;
                    case 'molten_scythe_effect':
                        iconPrefix = '⚔️';
                        break;
                    case 'molten_spear_effect':
                        iconPrefix = '🗡️';
                        break;
                    // --- END NEW ---
                    // --- NEW: Atlantean Blessing effect icons ---
                    case 'atlantean_lifesteal_blessing':
                        iconPrefix = '🌊';
                        break;
                    case 'atlantean_mana_efficiency':
                        iconPrefix = '💧';
                        break;
                    case 'atlantean_swiftness':
                        iconPrefix = '⚡';
                        break;
                    // --- END NEW ---
                    case 'mana_restore_percent':
                        iconPrefix = '💙';
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
        } else if (choice.effect && (choice.effect.target === 'all' || choice.effect.target === 'team')) {
            // If target is 'all' or 'team', apply effect directly without modal
            try {
                this.showLoadingOverlay(`Applying effect: ${choice.name}...`);
                const hasMore = await this.storyManager.applyChoiceEffectAndAdvance(choice, null); // Pass null for targetCharacterId
                this.hideLoadingOverlay();
                if (hasMore) {
                    this.closeStageDetails();
                    this.renderPlayerTeam(); // Update team display
                    this.updateStageNodes(); // Update map node statuses
                } else {
                    // Story complete or error occurred
                    this.closeStageDetails();
                    if (!this.storyManager.isStoryComplete()) {
                        this.showPopupMessage("Failed to apply effect.", 'error');
                    } else {
                        this.showStoryCompleteScreen();
                    }
                }
            } catch (error) {
                this.hideLoadingOverlay();
                console.error("Error applying 'all/team' target effect:", error);
                this.showPopupMessage(`Error applying effect: ${error.message}`, 'error');
            }
        } else if (choice.effect && choice.effect.type === 'none') {
            // Handle 'none' effect type - advance without applying any effect
            try {
                this.showLoadingOverlay(`Processing choice: ${choice.name}...`);
                const hasMore = await this.storyManager.applyChoiceEffectAndAdvance(choice, null);
                this.hideLoadingOverlay();
                if (hasMore) {
                    this.closeStageDetails();
                    this.renderPlayerTeam(); // Update team display
                    this.updateStageNodes(); // Update map node statuses
                } else {
                    // Story complete or error occurred
                    this.closeStageDetails();
                    if (!this.storyManager.isStoryComplete()) {
                        this.showPopupMessage("Failed to process choice.", 'error');
                    } else {
                        this.showStoryCompleteScreen();
                    }
                }
            } catch (error) {
                this.hideLoadingOverlay();
                console.error("Error processing 'none' effect choice:", error);
                this.showPopupMessage(`Error processing choice: ${error.message}`, 'error');
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
            
            const hpText = document.createElement('div');
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
            
            const manaText = document.createElement('div');
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
                    // --- NEW: Hell story effect previews ---
                    case 'set_magical_damage':
                        effectText = `Set Magical Damage to ${choice.effect.amount}`;
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'demon_claws_effect':
                        effectText = '+80 Physical Damage, 0% Dodge';
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'hellish_pact_effect':
                        effectText = '+2000 HP, -75 HP per turn';
                        effectInfo.classList.add('effect-positive');
                        break;
                    // --- NEW: Molten Weapons effect previews ---
                    case 'molten_hammer_effect':
                        effectText = '+200 Physical Damage';
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'molten_scythe_effect':
                        effectText = '+1% All Stats per Turn';
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'molten_spear_effect':
                        effectText = '+18% Dodge Chance';
                        effectInfo.classList.add('effect-positive');
                        break;
                    // --- END NEW ---
                    // --- NEW: Atlantean Blessing effect previews ---
                    case 'atlantean_lifesteal_blessing':
                        effectText = '+10% Lifesteal';
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'atlantean_mana_efficiency':
                        effectText = '50% Mana Cost Reduction';
                        effectInfo.classList.add('effect-positive');
                        break;
                    case 'atlantean_swiftness':
                        effectText = 'Q Ability -1 Turn Cooldown';
                        effectInfo.classList.add('effect-positive');
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
     * Render stage modifiers section with descriptions
     * @param {Object} stage - The stage data
     */
    renderStageModifiers(stage) {
        const modifiersSection = document.getElementById('stage-modifiers-section');
        const modifiersList = document.getElementById('stage-modifiers-list');
        
        if (!modifiersSection || !modifiersList) {
            console.warn('[StoryUI] Stage modifiers section not found in DOM');
            return;
        }

        // Clear existing content
        modifiersList.innerHTML = '';

        // Get stage modifiers from either 'modifiers' or 'stageEffects' properties
        const stageModifiers = stage.modifiers || stage.stageEffects || [];

        if (!stageModifiers || stageModifiers.length === 0) {
            // Hide section if no modifiers
            modifiersSection.style.display = 'none';
            return;
        }

        // Show section and populate with modifiers
        modifiersSection.style.display = 'block';

        stageModifiers.forEach(modifier => {
            this.createStageModifierItem(modifier, modifiersList);
        });
    }

    /**
     * Create a stage modifier item element with proper styling and description
     * @param {Object} modifier - The modifier data
     * @param {HTMLElement} container - The container to append the modifier to
     */
    createStageModifierItem(modifier, container) {
        // Get modifier definition from stage modifiers registry if available
        let modifierData = modifier;
        if (window.stageModifiersRegistry && typeof window.stageModifiersRegistry.getModifier === 'function') {
            const registeredModifier = window.stageModifiersRegistry.getModifier(modifier.id || modifier.name);
            if (registeredModifier) {
                modifierData = { ...modifier, ...registeredModifier };
            }
        }

        // Create modifier item element
        const modifierItem = document.createElement('div');
        modifierItem.className = 'stage-modifier-item';
        modifierItem.dataset.modifierId = modifierData.id || modifierData.name;

        // Determine modifier type based on ID and effects
        const modifierType = this.determineModifierType(modifierData);
        modifierItem.setAttribute('data-modifier-type', modifierType);

        // Create icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'stage-modifier-icon';
        iconContainer.textContent = modifierData.icon || '⭐';

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'stage-modifier-content';

        // Create modifier name
        const nameElement = document.createElement('div');
        nameElement.className = 'stage-modifier-name';
        nameElement.textContent = modifierData.name || modifierData.id || 'Unknown Modifier';

        // Create modifier description
        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'stage-modifier-description';
        descriptionElement.textContent = modifierData.description || 'No description available';

        // Create modifier type label
        const typeElement = document.createElement('div');
        typeElement.className = 'stage-modifier-type';
        typeElement.textContent = modifierType;

        // Assemble the modifier item
        contentContainer.appendChild(nameElement);
        contentContainer.appendChild(descriptionElement);
        contentContainer.appendChild(typeElement);

        modifierItem.appendChild(iconContainer);
        modifierItem.appendChild(contentContainer);

        // Add hover tooltip for modifier details
        this.addStageModifierTooltip(modifierItem, modifierData);

        // Add to container
        container.appendChild(modifierItem);

        console.log(`[StoryUI] Added stage modifier: ${modifierData.name} (${modifierType})`);
    }

    /**
     * Determine modifier type based on ID and effects for proper styling
     * @param {Object} modifier - The modifier data
     * @returns {string} - The modifier type ('damage', 'healing', 'utility', 'debuff', 'mixed')
     */
    determineModifierType(modifier) {
        const id = (modifier.id || modifier.name || '').toLowerCase();
        
        // Check for damage types
        if (id.includes('burning') || id.includes('damage') || id.includes('toxic') || 
            id.includes('fire') && !id.includes('heal')) {
            return 'damage';
        }
        
        // Check for healing types
        if (id.includes('heal') || id.includes('rain') || id.includes('wind') || 
            id.includes('medicine') || id.includes('pack_healing')) {
            return 'healing';
        }
        
        // Check for mixed types (like healing fire)
        if ((id.includes('fire') && id.includes('heal')) || id.includes('power_of_love')) {
            return 'mixed';
        }
        
        // Check for debuff types
        if (id.includes('smoke') || id.includes('space') || id.includes('frozen') || 
            id.includes('dark') || id.includes('disable')) {
            return 'debuff';
        }
        
        // Default to utility for everything else
        return 'utility';
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
     * Render enemies for battle stages using Loading Screen images (9:16 format)
     * @param {Array} enemies - Array of enemy data from stage
     */
    async renderBattleEnemyList(enemies) {
        const enemyList = document.getElementById('enemy-list');
        enemyList.innerHTML = '';
        
        if (!enemies || enemies.length === 0) {
            enemyList.innerHTML = '<p>No enemies found for this stage.</p>';
            return;
        }
        
        // Process enemies sequentially to maintain order
        for (const enemy of enemies) {
            const enemyElement = document.createElement('div');
            enemyElement.className = 'battle-enemy-preview';
            
            const enemyImageContainer = document.createElement('div');
            enemyImageContainer.className = 'battle-enemy-image-container';
            
            const enemyImage = document.createElement('img');
            enemyImage.className = 'battle-enemy-image';
            
            // Use character ID to find Loading Screen image
            const characterId = enemy.characterId;
            const loadingScreenFilename = await this.getLoadingScreenImageName(characterId);
            const loadingScreenPath = `Loading Screen/${loadingScreenFilename}`;
            
            enemyImage.src = loadingScreenPath;
            enemyImage.alt = characterId;
            enemyImage.onerror = () => {
                // Fallback to default enemy image
                enemyImage.src = 'Icons/default-icon.jpg';
            };
            
            const enemyName = document.createElement('div');
            enemyName.className = 'battle-enemy-name';
            enemyName.textContent = this.formatCharacterName(characterId);
            
            // Add modifications info if present
            if (enemy.modifications) {
                const modificationsElement = document.createElement('div');
                modificationsElement.className = 'battle-enemy-modifications';
                
                const modsList = [];
                if (enemy.modifications.hpMultiplier && enemy.modifications.hpMultiplier !== 1) {
                    modsList.push(`${Math.round(enemy.modifications.hpMultiplier * 100)}% HP`);
                }
                if (enemy.modifications.damageMultiplier && enemy.modifications.damageMultiplier !== 1) {
                    modsList.push(`${Math.round(enemy.modifications.damageMultiplier * 100)}% Damage`);
                }
                
                if (modsList.length > 0) {
                    modificationsElement.textContent = modsList.join(', ');
                    enemyElement.appendChild(modificationsElement);
                }
            }
            
            enemyImageContainer.appendChild(enemyImage);
            enemyElement.appendChild(enemyImageContainer);
            enemyElement.appendChild(enemyName);
            
            enemyList.appendChild(enemyElement);
        }
    }

    /**
     * Render the loot table for battle stages
     * @param {Object} stage - Stage data containing loot information
     */
    renderLootTable(stage) {
        const rewardList = document.getElementById('reward-list');
        rewardList.innerHTML = '';
        
        // Check if stage has loot defined
        if (!stage.loot) {
            rewardList.innerHTML = '<p>No loot defined for this stage.</p>';
            return;
        }
        
        const lootContainer = document.createElement('div');
        lootContainer.className = 'loot-table-container';
        
        // Handle new format: stage.loot.items (with dropChance system)
        if (stage.loot.items && stage.loot.items.length > 0) {
            // Separate guaranteed (dropChance 1.0) from random items
            const guaranteedItems = stage.loot.items.filter(item => item.dropChance >= 1.0);
            const randomItems = stage.loot.items.filter(item => item.dropChance < 1.0);
            
            // Render guaranteed items
            if (guaranteedItems.length > 0) {
                const guaranteedSection = document.createElement('div');
                guaranteedSection.className = 'loot-section guaranteed-loot';
                
                const guaranteedTitle = document.createElement('h4');
                guaranteedTitle.textContent = 'Guaranteed Rewards';
                guaranteedTitle.className = 'loot-section-title';
                guaranteedSection.appendChild(guaranteedTitle);
                
                const guaranteedGrid = document.createElement('div');
                guaranteedGrid.className = 'loot-grid';
                
                guaranteedItems.forEach(item => {
                    const lootItem = this.createLootItemElement(item, 'guaranteed');
                    guaranteedGrid.appendChild(lootItem);
                });
                
                guaranteedSection.appendChild(guaranteedGrid);
                lootContainer.appendChild(guaranteedSection);
            }
            
            // Render random items
            if (randomItems.length > 0) {
                const randomSection = document.createElement('div');
                randomSection.className = 'loot-section random-loot';
                
                const randomTitle = document.createElement('h4');
                randomTitle.textContent = 'Possible Rewards';
                randomTitle.className = 'loot-section-title';
                randomSection.appendChild(randomTitle);
                
                const randomGrid = document.createElement('div');
                randomGrid.className = 'loot-grid';
                
                randomItems.forEach(item => {
                    const lootItem = this.createLootItemElement(item, 'random');
                    randomGrid.appendChild(lootItem);
                });
                
                randomSection.appendChild(randomGrid);
                lootContainer.appendChild(randomSection);
            }
        }
        
        // Handle legacy format: stage.loot.guaranteed and stage.loot.random
        else {
            // Render guaranteed loot
            if (stage.loot.guaranteed && stage.loot.guaranteed.length > 0) {
                const guaranteedSection = document.createElement('div');
                guaranteedSection.className = 'loot-section guaranteed-loot';
                
                const guaranteedTitle = document.createElement('h4');
                guaranteedTitle.textContent = 'Guaranteed Rewards';
                guaranteedTitle.className = 'loot-section-title';
                guaranteedSection.appendChild(guaranteedTitle);
                
                const guaranteedGrid = document.createElement('div');
                guaranteedGrid.className = 'loot-grid';
                
                stage.loot.guaranteed.forEach(item => {
                    const lootItem = this.createLootItemElement(item, 'guaranteed');
                    guaranteedGrid.appendChild(lootItem);
                });
                
                guaranteedSection.appendChild(guaranteedGrid);
                lootContainer.appendChild(guaranteedSection);
            }
            
            // Render random loot
            if (stage.loot.random && stage.loot.random.length > 0) {
                const randomSection = document.createElement('div');
                randomSection.className = 'loot-section random-loot';
                
                const randomTitle = document.createElement('h4');
                randomTitle.textContent = 'Possible Rewards';
                randomTitle.className = 'loot-section-title';
                randomSection.appendChild(randomTitle);
                
                const randomGrid = document.createElement('div');
                randomGrid.className = 'loot-grid';
                
                stage.loot.random.forEach(item => {
                    const lootItem = this.createLootItemElement(item, 'random');
                    randomGrid.appendChild(lootItem);
                });
                
                randomSection.appendChild(randomGrid);
                lootContainer.appendChild(randomSection);
            }
        }
        
        // If no loot sections were added, show default message
        if (lootContainer.children.length === 0) {
            lootContainer.innerHTML = '<p>No specific loot defined for this stage.</p>';
        }
        
        rewardList.appendChild(lootContainer);
    }

    /**
     * Create a loot item element for display
     * @param {Object} item - Loot item data
     * @param {string} type - 'guaranteed' or 'random'
     * @returns {HTMLElement} - Loot item element
     */
    createLootItemElement(item, type) {
        const lootElement = document.createElement('div');
        lootElement.className = `loot-item ${type}`;
        
        const lootImage = document.createElement('img');
        lootImage.className = 'loot-item-image';
        
        // Try to get item image from item system
        let imagePath = '';
        if (window.ItemRegistry) {
            try {
                const itemData = window.ItemRegistry.getItem(item.itemId);
                if (itemData && itemData.icon) {
                    imagePath = itemData.icon;
                } else {
                    imagePath = `items/${item.itemId}.webp`;
                }
            } catch (error) {
                imagePath = `items/${item.itemId}.webp`;
            }
        } else {
            imagePath = `items/${item.itemId}.webp`;
        }
        
        lootImage.alt = item.itemId;
        
        // Load image with .webp and .png fallback
        const img = new Image();
        img.onload = () => {
            lootImage.src = imagePath;
        };
        img.onerror = () => {
            console.warn(`[StoryUI] Failed to load item image: ${imagePath}. Attempting .png fallback.`);
            const pngPath = imagePath.replace(/\.webp$/, '.png');
            if (pngPath !== imagePath) {
                const pngImg = new Image();
                pngImg.onload = () => {
                    lootImage.src = pngPath;
                };
                pngImg.onerror = () => {
                    console.error(`[StoryUI] Failed to load item image: ${pngPath}. Using default icon.`);
                    lootImage.src = 'Icons/default-icon.jpg';
                };
                pngImg.src = pngPath;
            } else {
                console.error(`[StoryUI] Item image is not a .webp, no .png fallback possible. Using default icon.`);
                lootImage.src = 'Icons/default-icon.jpg';
            }
        };
        img.src = imagePath;
        
        const lootName = document.createElement('div');
        lootName.className = 'loot-item-name';
        lootName.textContent = this.formatItemName(item.itemId);
        
        const lootQuantity = document.createElement('div');
        lootQuantity.className = 'loot-item-quantity';
        
        // Add appropriate class based on item type (use type parameter for legacy format)
        if (type === 'guaranteed' || item.dropChance >= 1.0) {
            lootQuantity.classList.add('guaranteed');
        } else {
            lootQuantity.classList.add('random');
        }
        
        // Handle both old format (quantity) and new format (quantityMin/quantityMax) with better formatting
        if (item.quantity && item.quantity > 1) {
            lootQuantity.innerHTML = `<span class="quantity-icon multiple"></span>${item.quantity} items`;
        } else if (item.quantityMin !== undefined && item.quantityMax !== undefined) {
            if (item.quantityMin === item.quantityMax) {
                if (item.quantityMin > 1) {
                    lootQuantity.innerHTML = `<span class="quantity-icon multiple"></span>${item.quantityMin} items`;
                } else {
                    lootQuantity.innerHTML = `<span class="quantity-icon single"></span>1 item`;
                }
            } else {
                lootQuantity.innerHTML = `<span class="quantity-icon range"></span>${item.quantityMin}-${item.quantityMax} items`;
            }
        } else {
            // Single item case
            lootQuantity.innerHTML = `<span class="quantity-icon single"></span>1 item`;
        }
        
        // Add drop chance for random loot
        if (type === 'random' && item.dropChance) {
            const dropChance = document.createElement('div');
            dropChance.className = 'loot-item-chance';
            dropChance.textContent = `${Math.round(item.dropChance * 100)}%`;
            lootElement.appendChild(dropChance);
        }
        
        lootElement.appendChild(lootImage);
        lootElement.appendChild(lootName);
        if (lootQuantity.innerHTML) {
            lootElement.appendChild(lootQuantity);
        }
        
        // Add hover tooltip for item details
        this.addLootItemTooltip(lootElement, item);
        
        return lootElement;
    }

    /**
     * Add hover tooltip to loot item element
     * @param {HTMLElement} element - The loot item element
     * @param {Object} item - The item data
     */
    addLootItemTooltip(element, item) {
        console.log('Adding tooltip to element:', element, 'with item:', item);
        
        element.addEventListener('mouseenter', (event) => {
            console.log('Mouse entered loot item, showing tooltip');
            this.showLootItemTooltip(event, item);
        });
        
        element.addEventListener('mouseleave', () => {
            console.log('Mouse left loot item, hiding tooltip');
            this.hideLootItemTooltip();
        });
        
        element.addEventListener('mousemove', (event) => {
            this.updateLootItemTooltipPosition(event);
        });
    }

    /**
     * Show tooltip with item information
     * @param {Event} event - Mouse event
     * @param {Object} item - Item data
     */
    showLootItemTooltip(event, item) {
        console.log('showLootItemTooltip called with:', { event, item });
        
        this.hideLootItemTooltip(); // Hide any existing tooltip
        
        // Get item data from ItemRegistry if available
        let itemData = null;
        if (window.ItemRegistry) {
            console.log('ItemRegistry found, attempting to get item:', item.itemId);
            try {
                itemData = window.ItemRegistry.getItem(item.itemId);
                console.log('Item data retrieved:', itemData);
            } catch (error) {
                console.warn(`Could not find item data for ${item.itemId}:`, error);
            }
        } else {
            console.warn('ItemRegistry not available on window');
        }
        
        // Fallback: create basic item data if none found
        if (!itemData) {
            console.log('Creating fallback item data');
            itemData = {
                name: this.formatItemName(item.itemId),
                description: `A ${this.formatItemName(item.itemId)} that modifies character stats.`,
                rarity: 'common',
                stats: this.getBasicItemStats(item.itemId)
            };
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'loot-item-tooltip';
        tooltip.id = 'loot-item-tooltip';
        
        // Item name and rarity
        const itemName = itemData ? itemData.name : this.formatItemName(item.itemId);
        const itemRarity = itemData ? itemData.rarity : 'common';
        
        console.log('Creating tooltip with:', { itemName, itemRarity, itemData });
        
        tooltip.innerHTML = `
            <div class="tooltip-header ${itemRarity}">
                <h4>${itemName}</h4>
                <span class="rarity-badge ${itemRarity}">${itemRarity.charAt(0).toUpperCase() + itemRarity.slice(1)}</span>
            </div>
            <div class="tooltip-content">
                ${itemData ? `<p class="item-description">${itemData.description}</p>` : ''}
                ${this.renderItemStats(itemData)}
                ${this.renderItemDropInfo(item)}
            </div>
        `;
        
        console.log('Appending tooltip to body:', tooltip);
        document.body.appendChild(tooltip);
        
        // Position tooltip immediately
        this.updateLootItemTooltipPosition(event);
        console.log('Tooltip should now be visible');
    }

    /**
     * Render item stats for tooltip
     * @param {Object} itemData - Item data from registry
     * @returns {string} - HTML string for stats
     */
    renderItemStats(itemData) {
        if (!itemData) return '';
        
        // Use statBonuses from the Item object (item-system.js structure)
        const stats = itemData.statBonuses || itemData.stats || {};
        const hasStats = Object.values(stats).some(value => value && value !== 0);
        
        // Debug: console.log('renderItemStats - stats found:', stats, 'hasStats:', hasStats);
        
        if (!hasStats) return '';
        
        let statsHtml = '<div class="item-stats"><h5>Stat Modifications:</h5><p class="stat-explanation">Equipping this item will modify your character\'s stats:</p><ul>';
        
        Object.entries(stats).forEach(([stat, value]) => {
            if (value && value !== 0) {
                const statName = this.formatStatName(stat);
                const prefix = value > 0 ? '+' : '';
                const changeText = value > 0 ? 'increased' : 'decreased';
                statsHtml += `<li><span class="stat-name">${statName}:</span> <span class="stat-value ${value > 0 ? 'positive' : 'negative'}">${prefix}${value}</span> <span class="stat-change-indicator">(${changeText})</span></li>`;
            }
        });
        
        statsHtml += '</ul></div>';
        return statsHtml;
    }

    /**
     * Render drop information for tooltip
     * @param {Object} item - Item drop data
     * @returns {string} - HTML string for drop info
     */
    renderItemDropInfo(item) {
        let dropInfo = '<div class="drop-info">';
        
        // Drop chance
        if (item.dropChance !== undefined) {
            if (item.dropChance >= 1.0) {
                dropInfo += '<p class="drop-chance guaranteed">Guaranteed Drop</p>';
            } else {
                dropInfo += `<p class="drop-chance">Drop Chance: ${Math.round(item.dropChance * 100)}%</p>`;
            }
        }
        
        // Quantity info
        if (item.quantity && item.quantity > 1) {
            dropInfo += `<p class="quantity-info">Quantity: ${item.quantity}</p>`;
        } else if (item.quantityMin !== undefined && item.quantityMax !== undefined) {
            if (item.quantityMin === item.quantityMax) {
                if (item.quantityMin > 1) {
                    dropInfo += `<p class="quantity-info">Quantity: ${item.quantityMin}</p>`;
                }
            } else {
                dropInfo += `<p class="quantity-info">Quantity: ${item.quantityMin}-${item.quantityMax}</p>`;
            }
        }
        
        dropInfo += '</div>';
        return dropInfo;
    }

    /**
     * Format stat names for display
     * @param {string} statName - Raw stat name
     * @returns {string} - Formatted stat name
     */
    formatStatName(statName) {
        const statMap = {
            'physicalDamage': 'Physical Damage',
            'magicalDamage': 'Magical Damage',
            'armor': 'Armor',
            'magicalShield': 'Magical Shield',
            'hp': 'Health',
            'mana': 'Mana',
            'speed': 'Speed',
            'critChance': 'Critical Chance',
            'critMultiplier': 'Critical Multiplier',
            'dodgeChance': 'Dodge Chance',
            'hpPerTurn': 'HP Regeneration',
            'manaPerTurn': 'Mana Regeneration'
        };
        
        return statMap[statName] || statName;
    }

    /**
     * Update tooltip position
     * @param {Event} event - Mouse event
     */
    updateLootItemTooltipPosition(event) {
        const tooltip = document.getElementById('loot-item-tooltip');
        if (!tooltip) {
            console.warn('Tooltip not found for positioning');
            return;
        }
        
        // Get dimensions without toggling visibility (CSS handles that now)
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        
        // Adjust if tooltip would go off-screen horizontally
        if (x + tooltipRect.width > viewportWidth) {
            x = event.clientX - tooltipRect.width - 15;
        }
        
        // Adjust if tooltip would go off-screen vertically
        if (y + tooltipRect.height > viewportHeight) {
            y = event.clientY - tooltipRect.height - 15;
        }
        
        // Ensure tooltip stays within viewport bounds
        x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
        y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10));
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        
        console.log('Tooltip positioned at:', { x, y, width: tooltipRect.width, height: tooltipRect.height });
    }

    /**
     * Get basic item stats for fallback when ItemRegistry is not available
     * @param {string} itemId - Item identifier
     * @returns {Object} - Basic stats object
     */
    getBasicItemStats(itemId) {
        // Provide fallback stats based on item name
        const stats = {};
        
        if (itemId.includes('rifle') || itemId.includes('weapon') || itemId.includes('sword')) {
            stats.physicalDamage = 25;
        }
        if (itemId.includes('gloves') || itemId.includes('magic') || itemId.includes('wand')) {
            stats.magicalDamage = 25;
        }
        if (itemId.includes('armor') || itemId.includes('shield')) {
            stats.armor = 15;
            stats.magicalShield = 15;
        }
        if (itemId.includes('boots') || itemId.includes('speed')) {
            stats.speed = 10;
        }
        
        return stats;
    }

    /**
     * Hide the loot item tooltip
     */
    hideLootItemTooltip() {
        const tooltip = document.getElementById('loot-item-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Add hover tooltip to stage modifier element
     * @param {HTMLElement} element - The stage modifier element
     * @param {Object} modifier - The modifier data
     */
    addStageModifierTooltip(element, modifier) {
        element.addEventListener('mouseenter', (event) => {
            this.showStageModifierTooltip(event, modifier);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideStageModifierTooltip();
        });
        
        element.addEventListener('mousemove', (event) => {
            this.updateStageModifierTooltipPosition(event);
        });
    }

    /**
     * Show tooltip with stage modifier information
     * @param {Event} event - Mouse event
     * @param {Object} modifier - Modifier data
     */
    showStageModifierTooltip(event, modifier) {
        this.hideStageModifierTooltip(); // Hide any existing tooltip
        
        // Get enhanced modifier data from stage modifiers registry if available
        let modifierData = modifier;
        if (window.stageModifiersRegistry && typeof window.stageModifiersRegistry.getModifier === 'function') {
            const registeredModifier = window.stageModifiersRegistry.getModifier(modifier.id || modifier.name);
            if (registeredModifier) {
                modifierData = { ...modifier, ...registeredModifier };
            }
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'stage-modifier-tooltip';
        tooltip.id = 'stage-modifier-tooltip';
        
        // Modifier name and type
        const modifierName = modifierData.name || this.formatModifierName(modifierData.id);
        const modifierType = this.determineModifierType(modifierData);
        const modifierIcon = modifierData.icon || '⭐';
        
        // Create tooltip content
        const tooltipContent = `
            <div class="tooltip-header stage-modifier-header">
                <div class="modifier-icon-large">${modifierIcon}</div>
                <div class="modifier-title-section">
                    <h3 class="modifier-name">${modifierName}</h3>
                    <div class="modifier-type-badge ${modifierType}">${modifierType.toUpperCase()}</div>
                </div>
            </div>
            <div class="tooltip-body">
                ${this.renderModifierDescription(modifierData)}
                ${this.renderModifierEffects(modifierData)}
                ${this.renderModifierTiming(modifierData)}
            </div>
        `;
        
        tooltip.innerHTML = tooltipContent;
        document.body.appendChild(tooltip);
        
        // Position tooltip immediately
        this.updateStageModifierTooltipPosition(event);
    }

    /**
     * Render modifier description for tooltip
     * @param {Object} modifier - Modifier data
     * @returns {string} - HTML string for description
     */
    renderModifierDescription(modifier) {
        if (!modifier.description) return '';
        
        return `
            <div class="modifier-description">
                <h5>Description:</h5>
                <p>${modifier.description}</p>
            </div>
        `;
    }

    /**
     * Render modifier effects for tooltip
     * @param {Object} modifier - Modifier data
     * @returns {string} - HTML string for effects
     */
    renderModifierEffects(modifier) {
        if (!modifier.effect && !this.hasKnownEffects(modifier)) return '';
        
        let effectsHtml = '<div class="modifier-effects"><h5>Effects:</h5><ul>';
        
        const effect = modifier.effect || {};
        const modifierId = modifier.id?.toLowerCase() || '';
        
        // Handle configured effect values
        if (effect.value !== undefined) {
            const effectType = this.getEffectType(modifier);
            let valueText = effect.value;
            
            // Format different types of values
            if (effectType === 'damage' || effectType === 'healing') {
                valueText = `${effect.value} ${effectType}`;
            } else if (effectType === 'percentage') {
                valueText = `${Math.round(effect.value * 100)}%`;
            } else if (effectType === 'speed_reduction') {
                valueText = `${Math.round(effect.value * 100)}% speed reduction`;
            } else if (effectType === 'stat_value') {
                valueText = `${effect.value}`;
            }
            
            effectsHtml += `<li><span class="effect-value">${valueText}</span></li>`;
        } else {
            // Handle known default effects when no specific value is configured
            const defaultEffect = this.getDefaultEffectForModifier(modifierId);
            if (defaultEffect) {
                effectsHtml += `<li><span class="effect-value">${defaultEffect}</span></li>`;
            }
        }
        
        // Show target information
        if (effect.target) {
            const targetText = this.formatTargetType(effect.target);
            effectsHtml += `<li><span class="effect-target">Affects: ${targetText}</span></li>`;
        } else {
            // Default targets for known modifiers
            const defaultTarget = this.getDefaultTargetForModifier(modifierId);
            if (defaultTarget) {
                effectsHtml += `<li><span class="effect-target">Affects: ${defaultTarget}</span></li>`;
            }
        }
        
        // Show damage type
        if (effect.damageType) {
            effectsHtml += `<li><span class="effect-damage-type">Damage Type: ${effect.damageType}</span></li>`;
        }
        
        // Show effect type
        if (effect.type) {
            const typeText = this.formatEffectType(effect.type);
            effectsHtml += `<li><span class="effect-type">Type: ${typeText}</span></li>`;
        }
        
        effectsHtml += '</ul></div>';
        return effectsHtml;
    }

    /**
     * Check if modifier has known effects even without effect object
     * @param {Object} modifier - Modifier data
     * @returns {boolean} - Whether modifier has known effects
     */
    hasKnownEffects(modifier) {
        const knownModifiers = [
            'burning_ground', 'healing_wind', 'its_raining_man', 'frozen_ground',
            'toxic_miasma', 'atlantean_purification', 'smoke_cloud', 'healing_fire',
            'carried_medicines', 'small_space', 'desert_heat', 'pack_healing'
        ];
        return knownModifiers.includes(modifier.id?.toLowerCase());
    }

    /**
     * Get default effect for known modifiers
     * @param {string} modifierId - Modifier ID
     * @returns {string} - Default effect description
     */
    getDefaultEffectForModifier(modifierId) {
        const defaults = {
            'burning_ground': '150 fire damage per turn',
            'healing_wind': '1% max HP healing per turn',
            'its_raining_man': '100 HP healing per turn',
            'frozen_ground': '25% speed reduction',
            'toxic_miasma': '75 poison damage per turn',
            'smoke_cloud': '21% miss chance for abilities',
            'healing_fire': '50% of heal amount as fire damage',
            'carried_medicines': '10% max mana every 5 turns',
            'small_space': 'Dodge chance set to 0%',
            'desert_heat': '50% crit chance, 50 HP/mana regen',
            'pack_healing': 'Full HP restore on enemy death',
            'atlantean_purification': 'Remove all debuffs per turn'
        };
        return defaults[modifierId];
    }

    /**
     * Get default target for known modifiers
     * @param {string} modifierId - Modifier ID
     * @returns {string} - Default target description
     */
    getDefaultTargetForModifier(modifierId) {
        const targets = {
            'burning_ground': 'Player Characters',
            'healing_wind': 'All Characters',
            'its_raining_man': 'Player Characters',
            'frozen_ground': 'All Characters',
            'toxic_miasma': 'All Characters',
            'smoke_cloud': 'Player Abilities',
            'healing_fire': 'Player Characters',
            'carried_medicines': 'Player Characters',
            'small_space': 'All Characters',
            'desert_heat': 'All Characters',
            'pack_healing': 'Enemy Characters',
            'atlantean_purification': 'All Characters'
        };
        return targets[modifierId];
    }

    /**
     * Format effect type for display
     * @param {string} effectType - Effect type
     * @returns {string} - Formatted effect type
     */
    formatEffectType(effectType) {
        const typeMap = {
            'turn_start_damage': 'Turn Start Damage',
            'turn_start_heal': 'Turn Start Healing',
            'stat_override': 'Stat Override',
            'stat_modifier': 'Stat Modifier',
            'ability_modifier': 'Ability Modifier',
            'passive_effect': 'Passive Effect'
        };
        return typeMap[effectType] || effectType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Render modifier timing for tooltip
     * @param {Object} modifier - Modifier data
     * @returns {string} - HTML string for timing
     */
    renderModifierTiming(modifier) {
        const timingInfo = [];
        
        if (modifier.onStageStart) {
            timingInfo.push('Stage Start');
        }
        if (modifier.onTurnStart) {
            timingInfo.push('Each Turn Start');
        }
        if (modifier.onTurnEnd) {
            timingInfo.push('Each Turn End');
        }
        if (modifier.onStageEnd) {
            timingInfo.push('Stage End');
        }
        
        if (timingInfo.length === 0) return '';
        
        return `
            <div class="modifier-timing">
                <h5>Triggers:</h5>
                <p>${timingInfo.join(', ')}</p>
            </div>
        `;
    }

    /**
     * Get effect type for proper formatting
     * @param {Object} modifier - Modifier data
     * @returns {string} - Effect type
     */
    getEffectType(modifier) {
        const id = (modifier.id || '').toLowerCase();
        const effect = modifier.effect || {};
        
        // Check effect type first
        if (effect.type === 'stat_override' || effect.type === 'stat_modifier') {
            return 'stat_value';
        }
        
        // Check based on modifier ID
        if (id.includes('burn') || id.includes('toxic') || (id.includes('damage') && !id.includes('heal'))) {
            return 'damage';
        }
        if (id.includes('heal') || id.includes('rain') || id.includes('wind') || id.includes('medicine')) {
            return 'healing';
        }
        if (id.includes('frozen') || id.includes('speed')) {
            return 'speed_reduction';
        }
        if (id.includes('desert_heat') || id.includes('crit')) {
            return 'stat_value';
        }
        
        // Check effect value for percentage detection
        if (effect.value !== undefined && effect.value > 0 && effect.value < 1) {
            return 'percentage';
        }
        
        return 'value';
    }

    /**
     * Format target type for display
     * @param {string} target - Target type
     * @returns {string} - Formatted target
     */
    formatTargetType(target) {
        const targetMap = {
            'all': 'All Characters',
            'players': 'Player Characters',
            'enemies': 'Enemy Characters',
            'allies': 'Allies'
        };
        
        return targetMap[target] || target;
    }

    /**
     * Format modifier name for display
     * @param {string} modifierId - Modifier identifier
     * @returns {string} - Formatted name
     */
    formatModifierName(modifierId) {
        if (!modifierId) return 'Unknown Modifier';
        
        return modifierId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Update stage modifier tooltip position
     * @param {Event} event - Mouse event
     */
    updateStageModifierTooltipPosition(event) {
        const tooltip = document.getElementById('stage-modifier-tooltip');
        if (!tooltip) {
            return;
        }
        
        // Get dimensions without toggling visibility (CSS handles that now)
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        
        // Adjust if tooltip would go off-screen horizontally
        if (x + tooltipRect.width > viewportWidth) {
            x = event.clientX - tooltipRect.width - 15;
        }
        
        // Adjust if tooltip would go off-screen vertically
        if (y + tooltipRect.height > viewportHeight) {
            y = event.clientY - tooltipRect.height - 15;
        }
        
        // Ensure tooltip stays within viewport bounds
        x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
        y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10));
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    /**
     * Hide the stage modifier tooltip
     */
    hideStageModifierTooltip() {
        const tooltip = document.getElementById('stage-modifier-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Get Loading Screen image name for a character ID
     * @param {string} characterId - Character identifier
     * @returns {string} - Image filename
     */
    async getLoadingScreenImageName(characterId) {
        try {
            // Load character registry if not already cached
            if (!this.characterRegistry) {
                const response = await fetch('js/raid-game/character-registry.json');
                if (response.ok) {
                    const registryData = await response.json();
                    this.characterRegistry = {};
                    registryData.characters.forEach(char => {
                        this.characterRegistry[char.id] = char;
                    });
                } else {
                    console.warn('[StoryUI] Failed to load character registry, using fallback');
                    return `${characterId}.png`;
                }
            }

            // Look up character in registry
            const character = this.characterRegistry[characterId];
            if (character && character.ingameimage) {
                // Extract filename from the ingameimage path (e.g., "Loading Screen/Schoolboy Siegfried.png" -> "Schoolboy Siegfried.png")
                return character.ingameimage.replace('Loading Screen/', '');
            }

            // Fallback to formatted character ID
            return this.formatCharacterName(characterId) + '.png';
        } catch (error) {
            console.error('[StoryUI] Error getting Loading Screen image:', error);
            return `${characterId}.png`;
        }
    }

    /**
     * Format character name for display
     * @param {string} characterId - Character identifier
     * @returns {string} - Formatted name
     */
    formatCharacterName(characterId) {
        // Convert character ID to readable name
        return characterId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format item name for display
     * @param {string} itemId - Item identifier
     * @returns {string} - Formatted name
     */
    formatItemName(itemId) {
        // Convert item ID to readable name
        return itemId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
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
     * Show XP rewards in story mode
     * @param {Array} xpResults - XP results from the battle
     * @param {Object} stageInfo - Stage information
     * @param {Object} bonuses - Bonuses applied
     */
    showXPRewards(xpResults, stageInfo, bonuses) {
        // For now, just log the results - could be enhanced with story-specific UI
        console.log('[StoryUI] XP Rewards:', xpResults);
        
        // You could create a story-specific XP display here
        // For now, we'll use the same display as the game manager
        if (window.gameManager && typeof window.gameManager.showXPRewardsDisplay === 'function') {
            window.gameManager.showXPRewardsDisplay(xpResults, stageInfo, bonuses);
        }
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
        // Get the current stage data to check its type
        const currentStage = this.storyManager.getCurrentStage();
        
        if (currentStage && currentStage.type === 'ally_selection') {
            // For ally selection stages, trigger the demonic summoning process
            this.handleDemonicSummoning();
            return;
        }
        
        if (currentStage && currentStage.type === 'healing_and_recruit') {
            console.log('[StoryUI] startCurrentStage: Processing healing_and_recruit stage');
            // For healing and recruit stages, apply effects and advance
            this.handleHealingAndRecruitStage(currentStage).then(() => {
                // Close the details panel
                this.closeStageDetails();
                
                // Advance to next stage
                this.storyManager.advanceToNextStage().then((hasMoreStages) => {
                    if (!hasMoreStages) {
                        this.showStoryCompleteScreen();
                    } else {
                        this.renderPlayerTeam(); // Update UI
                        this.updateStageNodes(); // Update map
                    }
                }).catch(error => {
                    console.error('[StoryUI] Error advancing after healing and recruit stage:', error);
                    this.showPopupMessage('❌ Error advancing to next stage. Please try again.', 'error', 3000);
                });
            }).catch(error => {
                console.error('[StoryUI] Error processing healing and recruit stage:', error);
                this.showPopupMessage('❌ Error processing stage effects. Please try again.', 'error', 3000);
            });
            return;
        }
        
        // For regular battle stages, proceed as normal
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
                        console.log('[StoryUI] Story completed after battle!');
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
        // Dispatch story completion event for quest tracking
        const storyId = this.storyManager.storyId;
        if (storyId) {
            document.dispatchEvent(new CustomEvent('storyCompleted', {
                detail: { storyId: storyId }
            }));
            console.log(`[StoryUI] Dispatched story completion event for ${storyId} via showStoryCompleteScreen`);
        }
        
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
        // Go back to the main character selector
        window.location.href = 'character-selector.html';
    }

    /**
     * Goes to character selection after completing a story (clears progress).
     */
    async newStory() {
        // Start a new story run (reset progress)
        const confirmed = confirm('This will reset your current progress in this story. Are you sure?');
        if (confirmed) {
            await this.storyManager.resetProgress();
            // Reload the page to start fresh
            window.location.reload();
        }
    }

    /**
     * Show a loading overlay
     * @param {string} message - The loading message to display
     */
    showLoadingOverlay(message = 'Loading...') {
        // Remove existing overlay if present
        this.hideLoadingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--bg-card);
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            color: var(--text-primary);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 300px;
        `;
        
        content.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <div style="font-size: 1.1rem; font-weight: 600;">${message}</div>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    /**
     * Hide the loading overlay
     */
    hideLoadingOverlay() {
        const existing = document.getElementById('loading-overlay');
        if (existing) {
            existing.remove();
        }
    }

    /**
     * Show a popup message
     * @param {string} message - The message to display
     * @param {string} type - The type of message ('success', 'error', 'info')
     * @param {number} duration - How long to show the message in milliseconds
     */
    showPopupMessage(message, type = 'info', duration = 3000) {
        // Remove existing popup if present
        const existing = document.getElementById('popup-message');
        if (existing) {
            existing.remove();
        }
        
        const popup = document.createElement('div');
        popup.id = 'popup-message';
        
        let backgroundColor = 'var(--primary)';
        let icon = 'ℹ️';
        
        switch (type) {
            case 'success':
                backgroundColor = '#2ecc71';
                icon = '✅';
                break;
            case 'error':
                backgroundColor = '#e74c3c';
                icon = '❌';
                break;
            case 'info':
            default:
                backgroundColor = 'var(--primary)';
                icon = 'ℹ️';
                break;
        }
        
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            font-weight: 600;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        popup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate in
        setTimeout(() => {
            popup.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-hide after duration
        setTimeout(() => {
            popup.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 300);
        }, duration);
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
                this.recruitListElement.innerHTML = '<p>No available allies found. All potential allies may already be in your team.</p>';
                return;
            }

            // Add recruitment cards class for styling
            this.recruitListElement.className = 'character-grid recruitment-cards';

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
        card.className = 'character-select-card';
        card.dataset.characterId = offer.id;

        // Image
        const img = document.createElement('img');
        img.src = offer.image || 'images/characters/default.png';
        img.alt = offer.name;
        card.appendChild(img);

        // Name
        const nameElement = document.createElement('h4');
        nameElement.textContent = offer.name;
        card.appendChild(nameElement);

        // Basic stats display
        if (offer.stats) {
            const statsElement = document.createElement('p');
            statsElement.innerHTML = `HP: ${offer.stats.hp || 'N/A'} | MP: ${offer.stats.mana || 'N/A'}`;
            card.appendChild(statsElement);
        }

        // Add character tags if available
        if (offer.tags && offer.tags.length > 0) {
            const tagsElement = document.createElement('p');
            tagsElement.textContent = `Tags: ${offer.tags.join(', ')}`;
            tagsElement.style.fontSize = '0.8rem';
            tagsElement.style.fontStyle = 'italic';
            card.appendChild(tagsElement);
        }

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

        this.showLoadingOverlay('Adding ally to your team...');

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
                this.showPopupMessage("Ally recruited!", "success", 2000);
            }

        } catch (error) {
            console.error('[StoryUI] Error during recruitment:', error);
            this.showPopupMessage(`Error recruiting: ${error.message}`, 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    /**
     * Renders the ally selection interface for selecting from all unlocked characters.
     * @param {Object} stage - The stage data containing ally selection parameters.
     */
    async renderAllySelection(stage) {
        console.log('[StoryUI] Rendering ally selection for:', stage.name);
        this.recruitListElement.innerHTML = '<div class="loading">Loading your unlocked champions...</div>';

        try {
            const availableAllies = await this.storyManager.getAllUnlockedCharacters();
            this.recruitListElement.innerHTML = ''; // Clear loading

            if (!availableAllies || availableAllies.length === 0) {
                this.recruitListElement.innerHTML = `
                    <div class="unlock-description">
                        <h3>🎭 No Additional Allies Available</h3>
                        <p>All your unlocked characters are already in your team, or you haven't unlocked any additional characters yet. You'll continue with your current team.</p>
                        <button class="character-unlock-button" onclick="window.location.reload()">Continue Without Additional Ally</button>
                    </div>
                `;
                return;
            }

            // Create the description section
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'unlock-description';
            
            const titleElement = document.createElement('h3');
            titleElement.textContent = '🔥 Call for Reinforcements 🔥';
            
            const descElement = document.createElement('p');
            descElement.textContent = stage.description_detail || 'Choose one character from all your unlocked champions to add to your team for the remainder of your journey through hell.';
            
            descriptionDiv.appendChild(titleElement);
            descriptionDiv.appendChild(descElement);
            this.recruitListElement.appendChild(descriptionDiv);

            // Add ally selection cards class for styling
            this.recruitListElement.className = 'character-grid ally-selection-cards';

            // Create character selection grid
            const characterGrid = document.createElement('div');
            characterGrid.className = 'unlock-cards';

            availableAllies.forEach(ally => {
                const allyCard = this.createAllySelectionCard(ally);
                characterGrid.appendChild(allyCard);
            });

            this.recruitListElement.appendChild(characterGrid);

            // Make container visible
            this.stageRecruitContainer.classList.remove('hidden');

        } catch (error) {
            console.error('[StoryUI] Error rendering ally selection:', error);
            this.recruitListElement.innerHTML = '<p class="error-message">Error loading available allies.</p>';
        }
    }

    /**
     * Creates a card element for a single ally selection.
     * @param {Object} ally - The character ally data (id, name, image, stats, tags).
     * @returns {HTMLElement} The created card element.
     */
    createAllySelectionCard(ally) {
        const card = document.createElement('div');
        card.className = 'unlock-card ally-selection-card';
        card.dataset.characterId = ally.id;

        // Character image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'character-image-container';
        
        const img = document.createElement('img');
        img.src = ally.image || 'images/characters/default.png';
        img.alt = ally.name;
        imageContainer.appendChild(img);
        card.appendChild(imageContainer);

        // Character info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'character-info';

        // Name
        const nameElement = document.createElement('h4');
        nameElement.textContent = ally.name;
        infoDiv.appendChild(nameElement);

        // Description
        const descElement = document.createElement('p');
        descElement.textContent = ally.description || 'A powerful ally ready to join your cause.';
        infoDiv.appendChild(descElement);

        // Tags
        if (ally.tags && ally.tags.length > 0) {
            const tagsElement = document.createElement('div');
            tagsElement.className = 'character-tags';
            ally.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = `tag tag-${tag.toLowerCase()}`;
                tagSpan.textContent = tag;
                tagsElement.appendChild(tagSpan);
            });
            infoDiv.appendChild(tagsElement);
        }

        // Stats display
        if (ally.stats) {
            const statsElement = document.createElement('div');
            statsElement.className = 'character-stats-preview';
            statsElement.innerHTML = `
                <div class="stat-row">
                    <span>❤️ HP: ${ally.stats.hp || 'N/A'}</span>
                    <span>💙 MP: ${ally.stats.mana || 'N/A'}</span>
                </div>
                <div class="stat-row">
                    <span>⚔️ ATK: ${ally.stats.physicalDamage || 'N/A'}</span>
                    <span>🔮 MAG: ${ally.stats.magicalDamage || 'N/A'}</span>
                </div>
            `;
            infoDiv.appendChild(statsElement);
        }

        card.appendChild(infoDiv);

        // Selection button
        const selectButton = document.createElement('button');
        selectButton.className = 'character-unlock-button';
        selectButton.textContent = 'Add to Team';
        selectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAllySelection(ally.id);
        });
        infoDiv.appendChild(selectButton);

        return card;
    }

    /**
     * Renders a custom demonic ally interface directly in the stage description area
     * @param {Object} stage - The ally selection stage data
     */
    async renderDemonicAllyInterface(stage) {
        console.log('[StoryUI] Rendering demonic ally interface for:', stage.name);
        
        // Modify the stage description to include the ally interface
        const originalDescription = stage.description;
        this.stageDescriptionElement.innerHTML = `
            <div class="demonic-interface">
                <div class="original-description">
                    ${originalDescription}
                </div>
                <div class="summoning-circle">
                    <div class="circle-glow"></div>
                    <div class="circle-inner">
                        <div class="demon-text">🔥 DEMONIC SUMMONING CIRCLE 🔥</div>
                        <div class="circle-status" id="circle-status">
                            <span class="pulsing">Circle is ready for summoning...</span>
                        </div>
                    </div>
                </div>
                <div class="ally-preview-area" id="ally-preview-area">
                    <div class="preview-text">Click "Call for Reinforcements" to channel the circle's power</div>
                </div>
            </div>
        `;

        // Add custom styling for the demonic interface
        this.addDemonicInterfaceStyles();
        
        // Store the stage data for later use
        this.currentAllyStage = stage;
    }

    /**
     * Adds custom CSS for the demonic ally interface
     */
    addDemonicInterfaceStyles() {
        if (document.getElementById('demonic-interface-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'demonic-interface-styles';
        style.textContent = `
            .demonic-interface {
                background: linear-gradient(135deg, rgba(255, 87, 34, 0.1), rgba(139, 0, 0, 0.2));
                border: 2px solid #ff5722;
                border-radius: 12px;
                padding: 20px;
                margin-top: 15px;
            }
            
            .original-description {
                margin-bottom: 20px;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            
            .summoning-circle {
                position: relative;
                width: 200px;
                height: 200px;
                margin: 20px auto;
                border-radius: 50%;
                background: radial-gradient(circle, #8b0000, #ff5722, #ff6b35);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: demonicPulse 3s ease-in-out infinite;
            }
            
            .circle-glow {
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                border-radius: 50%;
                background: radial-gradient(circle, transparent, #ff5722);
                animation: glowPulse 2s ease-in-out infinite alternate;
                opacity: 0.7;
            }
            
            .circle-inner {
                text-align: center;
                color: white;
                z-index: 2;
                position: relative;
            }
            
            .demon-text {
                font-weight: bold;
                font-size: 0.9rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                margin-bottom: 10px;
            }
            
            .circle-status {
                font-size: 0.8rem;
                opacity: 0.9;
            }
            
            .pulsing {
                animation: textPulse 2s ease-in-out infinite;
            }
            
            .ally-preview-area {
                margin-top: 20px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                text-align: center;
                color: #ff6b35;
                font-weight: 600;
            }
            
            @keyframes demonicPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 20px #ff5722; }
                50% { transform: scale(1.05); box-shadow: 0 0 40px #ff5722; }
            }
            
            @keyframes glowPulse {
                0% { opacity: 0.5; }
                100% { opacity: 0.9; }
            }
            
            @keyframes textPulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handles the demonic ally summoning process when the button is clicked
     */
    async handleDemonicSummoning() {
        if (!this.currentAllyStage) {
            console.error('[StoryUI] No ally stage data available for summoning');
            return;
        }

        const circleStatus = document.getElementById('circle-status');
        const previewArea = document.getElementById('ally-preview-area');
        
        try {
            // Update circle status - channeling phase
            circleStatus.innerHTML = '<span class="pulsing">🔮 Channeling demonic energy...</span>';
            previewArea.innerHTML = '<div class="loading">The circle pulses with otherworldly power...</div>';
            
            // Wait a moment for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get available allies
            const availableAllies = await this.storyManager.getAllUnlockedCharacters();
            
            if (!availableAllies || availableAllies.length === 0) {
                circleStatus.innerHTML = '<span style="color: #ff6b6b;">❌ No spirits answer the call</span>';
                previewArea.innerHTML = `
                    <div style="color: #ff6b6b; text-align: center;">
                        <h4>🚫 The Void Remains Silent</h4>
                        <p>All champions are bound to your cause, or the demonic realm offers no new allies.</p>
                        <button class="character-unlock-button" onclick="window.storyUI.advanceWithoutAlly();">
                            Dismiss the Circle
                        </button>
                    </div>
                `;
                return;
            }

            // Mystical summoning - randomly select one ally automatically
            const randomAlly = availableAllies[Math.floor(Math.random() * availableAllies.length)];
            
            // Show summoning in progress
            circleStatus.innerHTML = '<span style="color: #ffa500;">🌀 A presence stirs in the darkness...</span>';
            previewArea.innerHTML = `
                <div style="text-align: center; color: #ffa500;">
                    <h4>✨ The Circle Responds! ✨</h4>
                    <p>A powerful spirit materializes from the hellish void...</p>
                    <div class="summoning-animation">🔥 ⚡ 🌟 ⚡ 🔥</div>
                </div>
            `;

            // Wait for summoning animation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Reveal the summoned ally
            circleStatus.innerHTML = '<span style="color: #90EE90;">✅ Summoning Complete!</span>';
            previewArea.innerHTML = `
                <div style="text-align: center; color: #90EE90;">
                    <h3>🎉 ${randomAlly.name} has answered your call! 🎉</h3>
                    <div style="margin: 15px 0;">
                        <img src="${randomAlly.image || 'images/characters/default.png'}" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #ff5722; object-fit: cover;" 
                             alt="${randomAlly.name}">
                    </div>
                    <p style="color: #ffcc99;">"${randomAlly.description || 'I shall aid you in this hellish realm.'}"</p>
                    <p>The demonic circle fades as your new ally joins your cause...</p>
                </div>
            `;

            // Add the ally automatically after the reveal
            setTimeout(async () => {
                try {
                    const hasMoreStages = await this.storyManager.addSelectedAlly(randomAlly.id);
                    
                    // Close details and update UI
                    setTimeout(() => {
                        this.closeStageDetails();
                        this.renderPlayerTeam();
                        
                        if (!hasMoreStages) {
                            this.showStoryCompleteScreen();
                        } else {
                            this.showPopupMessage(`${randomAlly.name} has been summoned to aid your journey!`, "success", 4000);
                        }
                    }, 2000);
                    
                } catch (error) {
                    console.error('[StoryUI] Error adding summoned ally:', error);
                    circleStatus.innerHTML = '<span style="color: #ff6b6b;">💀 Binding ritual failed!</span>';
                    previewArea.innerHTML = `<div style="color: #ff6b6b;">The ally vanishes back into the void... Error: ${error.message}</div>`;
                }
            }, 2000);

        } catch (error) {
            console.error('[StoryUI] Error during demonic summoning:', error);
            circleStatus.innerHTML = '<span style="color: #ff6b6b;">💀 The ritual has failed!</span>';
            previewArea.innerHTML = `<div style="color: #ff6b6b;">Dark energies reject your call... Error: ${error.message}</div>`;
        }
    }

    /**
     * Creates a compact ally card for the demonic interface
     * @param {Object} ally - The ally data
     * @returns {HTMLElement} The ally card element
     */
    createCompactAllyCard(ally) {
        const card = document.createElement('div');
        card.className = 'compact-ally-card';
        card.innerHTML = `
            <div class="ally-avatar">
                <img src="${ally.image || 'images/characters/default.png'}" alt="${ally.name}">
            </div>
            <div class="ally-info">
                <h5>${ally.name}</h5>
                <p>${ally.description || 'A powerful champion'}</p>
                <div class="ally-stats">
                    ❤️${ally.stats?.hp || 'N/A'} 💙${ally.stats?.mana || 'N/A'}
                </div>
            </div>
            <button class="summon-button" data-ally-id="${ally.id}">
                🔥 Summon
            </button>
        `;

        // Add styling for compact cards
        if (!document.getElementById('compact-ally-styles')) {
            const style = document.createElement('style');
            style.id = 'compact-ally-styles';
            style.textContent = `
                .ally-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .compact-ally-card {
                    background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(139, 0, 0, 0.3));
                    border: 2px solid #ff5722;
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .compact-ally-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
                    border-color: #ff6b35;
                }
                
                .ally-avatar img {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 2px solid #ff5722;
                    object-fit: cover;
                }
                
                .ally-info h5 {
                    margin: 10px 0 5px 0;
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 600;
                }
                
                .ally-info p {
                    margin: 0 0 8px 0;
                    font-size: 0.8rem;
                    color: #ffcc99;
                    line-height: 1.3;
                }
                
                .ally-stats {
                    font-size: 0.9rem;
                    color: #ff6b35;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .summon-button {
                    background: linear-gradient(135deg, #ff5722, #ff6b35);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }
                
                .summon-button:hover {
                    background: linear-gradient(135deg, #e64a19, #ff5722);
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
                }
            `;
            document.head.appendChild(style);
        }

        // Add click handler for summon button
        const summonButton = card.querySelector('.summon-button');
        summonButton.addEventListener('click', () => this.handleCompactAllySelection(ally.id, ally.name));

        return card;
    }

    /**
     * Handles ally selection from the compact interface
     * @param {string} allyId - The ID of the selected ally
     * @param {string} allyName - The name of the selected ally
     */
    async handleCompactAllySelection(allyId, allyName) {
        if (!confirm(`Summon ${allyName} to join your team? They will aid you for the rest of your journey through hell.`)) {
            return;
        }

        const circleStatus = document.getElementById('circle-status');
        const previewArea = document.getElementById('ally-preview-area');

        try {
            circleStatus.innerHTML = '<span class="pulsing">🌀 Binding ally to your cause...</span>';
            previewArea.innerHTML = '<div class="loading">Completing summoning ritual...</div>';

            // Call the story manager to add the ally
            const hasMoreStages = await this.storyManager.addSelectedAlly(allyId);

            // Show success and close
            circleStatus.innerHTML = '<span style="color: #90EE90;">✅ Summoning complete!</span>';
            previewArea.innerHTML = `
                <div style="color: #90EE90; text-align: center;">
                    <h4>🎉 ${allyName} has joined your team! 🎉</h4>
                    <p>The demonic circle fades as your new ally materializes...</p>
                </div>
            `;

            // Close details after a short delay
            setTimeout(() => {
                this.closeStageDetails();
                this.renderPlayerTeam(); // Update team display
                
                if (!hasMoreStages) {
                    this.showStoryCompleteScreen();
                } else {
                    this.showPopupMessage(`${allyName} has joined your team through demonic summoning!`, "success", 3000);
                }
            }, 2000);

        } catch (error) {
            console.error('[StoryUI] Error during compact ally selection:', error);
            circleStatus.innerHTML = '<span style="color: #ff6b6b;">💀 Binding failed!</span>';
            previewArea.innerHTML = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
        }
    }

    /**
     * Advances the story without selecting an ally
     */
    async advanceWithoutAlly() {
        try {
            // Advance the story without adding an ally
            await this.storyManager.advanceToNextStage();
            this.closeStageDetails();
            this.updateStageNodes();
            this.showPopupMessage("You continue your journey alone...", "info", 2000);
        } catch (error) {
            console.error('[StoryUI] Error advancing without ally:', error);
            this.showPopupMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handles the selection of an ally character.
     * @param {string} characterId - The ID of the character selected.
     */
    async handleAllySelection(characterId) {
        console.log(`[StoryUI] Ally selected: ${characterId}`);

        // Add confirmation for ally selection
        const ally = await this.storyManager.getAllUnlockedCharacters().then(allies => 
            allies.find(a => a.id === characterId)
        );
        
        if (ally && !confirm(`Add ${ally.name} to your team? They will join you for the rest of your journey through hell.`)) {
            return;
        }

        this.showLoadingOverlay('Adding ally to your team...');

        try {
            // Call the storyManager to handle ally selection logic
            const hasMoreStages = await this.storyManager.addSelectedAlly(characterId);

            // Close the details panel and update UI
            this.closeStageDetails();
            this.renderPlayerTeam(); // Re-render team immediately to show the new member

            if (!hasMoreStages) {
                // If ally selection was the last action, show story complete screen
                this.showStoryCompleteScreen();
            } else {
                // Show success message
                this.showPopupMessage(`${ally?.name || 'Ally'} has joined your team!`, "success", 3000);
            }

        } catch (error) {
            console.error('[StoryUI] Error during ally selection:', error);
            this.showPopupMessage(`Error adding ally: ${error.message}`, 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    /**
     * Renders the character unlock offers for a character_unlock stage.
     * @param {Object} stage - The stage data containing unlockableCharacters.
     */
    async renderCharacterUnlockOffers(stage) {
        console.log('[StoryUI] Rendering character unlock offers for stage:', stage.name);
        
        // Show loading indicator
        this.recruitListElement.innerHTML = '<div class="loading">Loading character options...</div>';
        this.stageRecruitContainer.classList.remove('hidden');

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if tutorial reward was already claimed
            if (stage.tutorialReward) {
                const tutorialRewardRef = firebase.database().ref(`users/${user.uid}/tutorialRewardClaimed`);
                const snapshot = await tutorialRewardRef.once('value');
                if (snapshot.val() === true) {
                    // Show completion message instead of skipping
                    console.log('[StoryUI] Tutorial reward already claimed, showing completion message');
                    this.recruitListElement.innerHTML = `
                        <div class="unlock-description">
                            <h3>🎉 Tutorial Already Completed! 🎉</h3>
                            <p>You have already unlocked your tutorial reward character. Thank you for playing!</p>
                            <button class="character-unlock-button" onclick="window.location.href='character-selector.html'">Return to Character Selector</button>
                        </div>
                    `;
                    this.stageRecruitContainer.classList.remove('hidden');
                    return;
                }
            }

            // Check if this is a first-time completion reward
            if (stage.firstTimeCompletionReward) {
                const storyId = this.storyManager.storyId;
                console.log('[StoryUI] Checking first-time completion for story:', storyId);
                
                // Check if this story has been completed before
                const storyCompletionRef = firebase.database().ref(`users/${user.uid}/storyCompletions/${storyId}`);
                const completionSnapshot = await storyCompletionRef.once('value');
                
                if (completionSnapshot.exists()) {
                    console.log('[StoryUI] Story already completed before, skipping first-time reward');
                    // Story was already completed, skip to next stage without showing unlock
                    this.closeStageDetails();
                    const hasMoreStages = await this.storyManager.advanceToNextStage();
                    if (!hasMoreStages) {
                        this.showStoryCompleteScreen();
                    } else {
                        this.renderPlayerTeam();
                        this.updateStageNodes();
                    }
                    return;
                }

                // Handle dynamic character fetching for Student tags
                if (stage.unlockableCharacters === "dynamic_student_tags") {
                    console.log('[StoryUI] Fetching dynamic Student tagged characters');
                    
                    // Get character registry
                    let characterRegistry = [];
                    try {
                        const registryResponse = await fetch('js/raid-game/character-registry.json');
                        const registryData = await registryResponse.json();
                        characterRegistry = registryData.characters;
                    } catch (error) {
                        console.error('[StoryUI] Error loading character registry:', error);
                        throw new Error('Failed to load character registry');
                    }

                    // Filter Student tagged characters
                    const studentCharacters = characterRegistry.filter(char => 
                        char.tags && 
                        char.tags.includes('Student') && 
                        !char.isHidden && 
                        char.playerunlocked === false // Only characters that aren't unlocked by default
                    );

                    console.log('[StoryUI] Found Student characters:', studentCharacters.map(c => c.id));

                    // Check which characters the user already owns
                    const [unlockedSnapshot, ownedSnapshot] = await Promise.all([
                        firebase.database().ref(`users/${user.uid}/UnlockedRAIDCharacters`).once('value'),
                        firebase.database().ref(`users/${user.uid}/ownedCharacters`).once('value')
                    ]);

                    let ownedCharacterIds = [];
                    
                    // Get from UnlockedRAIDCharacters
                    if (unlockedSnapshot.exists()) {
                        ownedCharacterIds = [...ownedCharacterIds, ...Object.keys(unlockedSnapshot.val())];
                    }
                    
                    // Get from ownedCharacters
                    if (ownedSnapshot.exists()) {
                        const ownedData = ownedSnapshot.val();
                        if (Array.isArray(ownedData)) {
                            ownedCharacterIds = [...ownedCharacterIds, ...ownedData];
                        } else if (typeof ownedData === 'object') {
                            ownedCharacterIds = [...ownedCharacterIds, ...Object.values(ownedData)];
                        }
                    }

                    // Remove duplicates
                    ownedCharacterIds = [...new Set(ownedCharacterIds)];

                    console.log('[StoryUI] User owned character IDs:', ownedCharacterIds);

                    // Filter out owned characters
                    const availableCharacters = studentCharacters.filter(char => 
                        !ownedCharacterIds.includes(char.id)
                    );

                    console.log('[StoryUI] Available Student characters for reward:', availableCharacters.map(c => c.id));

                    if (availableCharacters.length === 0) {
                        console.log('[StoryUI] User already owns all Student characters, skipping reward');
                        this.recruitListElement.innerHTML = `
                            <div class="unlock-description">
                                <h3>🎉 Story Complete! 🎉</h3>
                                <p>You already own all the student characters from this story's reward pool. Great job completing the blazing school liberation!</p>
                                <button class="character-unlock-button" onclick="location.reload()">Continue</button>
                            </div>
                        `;
                        this.stageRecruitContainer.classList.remove('hidden');
                        
                        // Still mark the story as completed for future reference
                        await storyCompletionRef.set({
                            completedAt: firebase.database.ServerValue.TIMESTAMP,
                            rewardClaimed: false, // No reward was claimed since user already owned characters
                            rewardReason: 'already_owned_all_characters'
                        });
                        
                        // Dispatch story completion event for quest tracking
                        const storyId = this.storyManager.storyId;
                        document.dispatchEvent(new CustomEvent('storyCompleted', {
                            detail: { storyId: storyId }
                        }));
                        console.log(`[StoryUI] Dispatched story completion event for ${storyId}`);
                        
                        return;
                    }

                    // Convert to the expected format for the UI
                    stage.unlockableCharacters = availableCharacters.map(char => ({
                        characterId: char.id,
                        name: char.name,
                        description: char.description,
                        image: char.image
                    }));

                } else {
                    // Handle static character lists (existing logic)
                // Check if user already owns any of the unlockable characters
                const unlockedCharactersRef = firebase.database().ref(`users/${user.uid}/UnlockedRAIDCharacters`);
                const unlockedSnapshot = await unlockedCharactersRef.once('value');
                const unlockedCharacters = unlockedSnapshot.val() || {};
                
                console.log('[StoryUI] User unlocked characters:', Object.keys(unlockedCharacters));
                console.log('[StoryUI] Characters offered in stage:', stage.unlockableCharacters.map(c => c.characterId));
                
                // Filter out characters the user already owns
                const availableCharacters = stage.unlockableCharacters.filter(char => {
                    const isOwned = unlockedCharacters.hasOwnProperty(char.characterId);
                    console.log(`[StoryUI] Character ${char.characterId}: owned = ${isOwned}`);
                    return !isOwned;
                });

                if (availableCharacters.length === 0) {
                    console.log('[StoryUI] User already owns all unlockable characters, skipping reward');
                    // User already owns all characters, skip to next stage
                    this.recruitListElement.innerHTML = `
                        <div class="unlock-description">
                            <h3>🎉 Story Complete! 🎉</h3>
                            <p>You already own all the characters from this story's reward pool. Great job completing the farmland liberation!</p>
                            <button class="character-unlock-button" onclick="location.reload()">Continue</button>
                        </div>
                    `;
                    this.stageRecruitContainer.classList.remove('hidden');
                    
                    // Still mark the story as completed for future reference
                    await storyCompletionRef.set({
                        completedAt: firebase.database.ServerValue.TIMESTAMP,
                        rewardClaimed: false, // No reward was claimed since user already owned characters
                        rewardReason: 'already_owned_all_characters'
                    });
                    
                    // Dispatch story completion event for quest tracking
                    const storyId = this.storyManager.storyId;
                    document.dispatchEvent(new CustomEvent('storyCompleted', {
                        detail: { storyId: storyId }
                    }));
                    console.log(`[StoryUI] Dispatched story completion event for ${storyId}`);
                    
                    return;
                }

                // Set the available characters for display
                stage.unlockableCharacters = availableCharacters;
                console.log('[StoryUI] Available characters for first-time reward:', availableCharacters.map(c => c.characterId));
                }
            }

            // Clear and prepare the container
            this.recruitListElement.innerHTML = '';

            if (!stage.unlockableCharacters || stage.unlockableCharacters.length === 0) {
                console.error('[StoryUI] No unlockable characters found in stage data');
                this.recruitListElement.innerHTML = '<div class="error-message">No characters available for unlock.</div>';
                return;
            }

            // Create the description section
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'unlock-description';
            
            const titleElement = document.createElement('h3');
            if (stage.tutorialReward) {
                titleElement.textContent = '🎓 Choose Your Tutorial Reward! 🎓';
            } else if (stage.firstTimeCompletionReward) {
                titleElement.textContent = '🎉 Choose Your Story Completion Reward! 🎉';
            } else {
                titleElement.textContent = '⭐ Character Unlock ⭐';
            }
            
            const descElement = document.createElement('p');
            if (stage.tutorialReward) {
                descElement.textContent = 'Congratulations on completing the tutorial! Choose one character to unlock permanently:';
            } else if (stage.firstTimeCompletionReward) {
                descElement.textContent = 'You have successfully completed this story for the first time! Choose one character to unlock as your reward:';
            } else {
                descElement.textContent = 'Choose one character to unlock:';
            }
            
            descriptionDiv.appendChild(titleElement);
            descriptionDiv.appendChild(descElement);
            this.recruitListElement.appendChild(descriptionDiv);

            // Create the character selection grid
            const characterGrid = document.createElement('div');
            characterGrid.className = 'unlock-cards';

            // Render each unlockable character
            stage.unlockableCharacters.forEach(character => {
                const characterCard = this.createCharacterUnlockCard(
                    character, 
                    stage.tutorialReward || false, 
                    stage.firstTimeCompletionReward || false
                );
                characterGrid.appendChild(characterCard);
            });

            this.recruitListElement.appendChild(characterGrid);
            this.stageRecruitContainer.classList.remove('hidden');

        } catch (error) {
            console.error('[StoryUI] Error rendering character unlock offers:', error);
            this.recruitListElement.innerHTML = `<div class="error-message">Error loading character options: ${error.message}</div>`;
        } finally {
            // Remove loading indicator if it exists
            const loadingElement = this.recruitListElement.querySelector('.loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    /**
     * Creates a card element for a character unlock offer.
     * @param {Object} character - The character unlock data.
     * @param {boolean} isTutorialReward - Whether this is a tutorial reward.
     * @param {boolean} isFirstTimeCompletionReward - Whether this is a first-time completion reward.
     * @returns {HTMLElement} The created card element.
     */
    createCharacterUnlockCard(character, isTutorialReward = false, isFirstTimeCompletionReward = false) {
        const card = document.createElement('div');
        card.className = 'character-select-card unlock-card';
        card.dataset.characterId = character.characterId;

        // Add special styling for tutorial rewards
        if (isTutorialReward) {
            card.classList.add('tutorial-reward');
        }

        // Image container for better layout with tall images
        const imageContainer = document.createElement('div');
        imageContainer.className = 'character-image-container';
        
        const img = document.createElement('img');
        img.src = character.image || `images/characters/${character.characterId}.png`;
        img.alt = character.name;
        
        // Add debugging for image loading
        console.log(`[Character Unlock] Loading image for ${character.name}:`, img.src);
        
        img.onload = () => {
            console.log(`[Character Unlock] ✓ Image loaded successfully for ${character.name}:`, img.src);
        };
        
        img.onerror = (error) => {
            console.log(`[Character Unlock] ✗ Image failed to load for ${character.name}:`, img.src);
            console.log(`[Character Unlock] Trying fallback: Icons/characters/default.png`);
            img.src = 'Icons/characters/default.png'; // Updated fallback path
        };
        
        imageContainer.appendChild(img);
        card.appendChild(imageContainer);

        // Character info container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'character-info';

        // Name
        const nameElement = document.createElement('h4');
        nameElement.textContent = character.name;
        infoContainer.appendChild(nameElement);

        // Description
        const descElement = document.createElement('p');
        descElement.textContent = character.description;
        infoContainer.appendChild(descElement);

        // Unlock button
        const unlockButton = document.createElement('button');
        unlockButton.className = 'character-unlock-button';
        unlockButton.textContent = isFirstTimeCompletionReward ? '🎉 Claim Reward' : '🔓 Unlock Character';
        unlockButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCharacterUnlock(character.characterId, isTutorialReward, isFirstTimeCompletionReward);
        });
        infoContainer.appendChild(unlockButton);

        card.appendChild(infoContainer);
        return card;
    }

    /**
     * Handles the unlocking of a character.
     * @param {string} characterId - The ID of the character to unlock.
     * @param {boolean} isTutorialReward - Whether this is a tutorial reward.
     * @param {boolean} isFirstTimeCompletionReward - Whether this is a first-time completion reward.
     */
    async handleCharacterUnlock(characterId, isTutorialReward = false, isFirstTimeCompletionReward = false) {
        // Guard against multiple selections
        if (this.characterUnlockInProgress) {
            console.warn('[StoryUI] Character unlock already in progress – ignoring additional clicks');
            return;
        }
        this.characterUnlockInProgress = true;

        // Disable all unlock buttons to prevent further interaction
        const allButtons = this.stageRecruitContainer?.querySelectorAll('.character-unlock-button');
        if (allButtons) {
            allButtons.forEach(btn => btn.disabled = true);
        }

        console.log(`[StoryUI] Character unlock selected: ${characterId}`);
        
        const characterDisplayName = characterId.replace('farmer_', 'Farmer ').replace('_', ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
        if (!confirm(`Are you sure you want to unlock ${characterDisplayName}? This choice cannot be changed.`)) {
            // Re-enable buttons and release guard if user cancels
            if (allButtons) allButtons.forEach(btn => btn.disabled = false);
            this.characterUnlockInProgress = false;
            return;
        }

        this.showLoadingOverlay('Unlocking character...');

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Save unlocked character to Firebase - both locations for consistency
            let source = 'story_unlock';
            if (isTutorialReward) {
                source = 'tutorial_reward';
            } else if (isFirstTimeCompletionReward) {
                source = 'first_time_completion_reward';
            }
            
            // Save to UnlockedRAIDCharacters (structured data)
            const unlockedCharacterRef = firebase.database().ref(`users/${user.uid}/UnlockedRAIDCharacters/${characterId}`);
            await unlockedCharacterRef.set({
                unlockedAt: firebase.database.ServerValue.TIMESTAMP,
                source: source
            });

            // Also save to ownedCharacters (array format for consistency with character selector)
            const ownedCharsSnapshot = await firebase.database().ref(`users/${user.uid}/ownedCharacters`).once('value');
            let ownedCharacters = [];
            
            if (ownedCharsSnapshot.exists()) {
                const ownedData = ownedCharsSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedCharacters = ownedData;
                } else if (typeof ownedData === 'object') {
                    ownedCharacters = Object.values(ownedData);
                }
            }

            // Add character if not already in the list
            if (!ownedCharacters.includes(characterId)) {
                ownedCharacters.push(characterId);
                await firebase.database().ref(`users/${user.uid}/ownedCharacters`).set(ownedCharacters);
            }

            // If this is a tutorial reward, mark it as claimed
            if (isTutorialReward) {
                const tutorialRewardRef = firebase.database().ref(`users/${user.uid}/tutorialRewardClaimed`);
                await tutorialRewardRef.set(true);
            }

            // If this is a first-time completion reward, mark the story as completed
            if (isFirstTimeCompletionReward) {
                const storyId = this.storyManager.storyId;
                const storyCompletionRef = firebase.database().ref(`users/${user.uid}/storyCompletions/${storyId}`);
                await storyCompletionRef.set({
                    completedAt: firebase.database.ServerValue.TIMESTAMP,
                    rewardClaimed: true,
                    rewardCharacter: characterId
                });
                console.log(`[StoryUI] Marked story ${storyId} as completed with reward ${characterId}`);
                
                // Dispatch story completion event for quest tracking
                document.dispatchEvent(new CustomEvent('storyCompleted', {
                    detail: { storyId: storyId }
                }));
                console.log(`[StoryUI] Dispatched story completion event for ${storyId}`);
            }

            console.log(`[StoryUI] Character ${characterId} unlocked successfully`);

            // Show a special success message for different reward types
            if (isTutorialReward) {
                this.showPopupMessage(`🎓 ${characterDisplayName} has been unlocked for completing the tutorial! 🎓`, "success", 4000);
            } else if (isFirstTimeCompletionReward) {
                const storyName = this.storyManager.storyInfo?.title || 'the story';
                this.showPopupMessage(`🎉 ${characterDisplayName} has been unlocked for completing ${storyName}! 🎉`, "success", 4000);
            } else {
                this.showPopupMessage(`${characterDisplayName} has been unlocked!`, "success", 3000);
            }

            // Advance to next stage
            this.closeStageDetails();
            const hasMoreStages = await this.storyManager.advanceToNextStage();

            if (!hasMoreStages) {
                this.showStoryCompleteScreen();
            } else {
                this.renderPlayerTeam(); // Update UI
                this.updateStageNodes(); // Update map
            }

        } catch (error) {
            console.error('[StoryUI] Error unlocking character:', error);
            this.showPopupMessage(`Error unlocking character: ${error.message}`, 'error');
        } finally {
            this.hideLoadingOverlay();
            this.characterUnlockInProgress = false; // Reset guard after operation completes
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

    /**
     * Handle healing and recruit stage type
     * @param {Object} stage - The stage data
     */
    async handleHealingAndRecruitStage(stage) {
        console.log('[StoryUI] Processing healing and recruit stage:', stage);
        console.log('[StoryUI] Stage healingEffect:', stage.healingEffect);
        console.log('[StoryUI] Stage recruitEffect:', stage.recruitEffect);
        console.log('[StoryUI] Stage keys:', Object.keys(stage));
        
        try {
            // Apply healing effect if present (without advancing)
            if (stage.healingEffect) {
                console.log('[StoryUI] Applying healing effect:', stage.healingEffect);
                // Apply the effect directly without advancing stage
                const effect = stage.healingEffect;
                if (effect.target === 'all' && effect.type === 'heal_and_mana_restore_all_full') {
                    console.log('[StoryUI] Healing all team members to full HP and Mana');
                    this.storyManager.playerTeam.forEach(member => {
                        if (member.currentHP > 0) { // Only affect living characters
                            const maxHP = member.stats?.hp ?? 1;
                            const maxMana = member.stats?.mana ?? 0;
                            const oldHP = member.currentHP;
                            const oldMana = member.currentMana;
                            member.currentHP = maxHP;
                            member.currentMana = maxMana;
                            console.log(`Fully restored ${member.id}: HP ${oldHP}→${member.currentHP}/${maxHP}, Mana ${oldMana}→${member.currentMana}/${maxMana}`);
                        }
                    });
                    console.log('[StoryUI] Healing effect applied successfully');
                } else {
                    console.warn('[StoryUI] Healing effect type not recognized:', effect);
                }
            } else {
                console.log('[StoryUI] No healing effect found in stage');
            }
            
            // Apply recruit effect if present (without advancing)
            if (stage.recruitEffect) {
                console.log('[StoryUI] Applying recruit effect:', stage.recruitEffect);
                const effect = stage.recruitEffect;
                if (effect.type === 'add_specific_ally' && effect.characterId) {
                    console.log(`[StoryUI] Attempting to add specific ally: ${effect.characterId}`);
                    // Check if character is already in the team
                    const isAlreadyInTeam = this.storyManager.playerTeam.some(member => member.id === effect.characterId);
                    if (!isAlreadyInTeam) {
                        console.log(`[StoryUI] Character ${effect.characterId} not in team, adding...`);
                        // Add the specific ally to the team
                        await this.storyManager.addSelectedAlly(effect.characterId);
                        console.log(`[StoryUI] Successfully added specific ally: ${effect.characterId}`);
                    } else {
                        console.log(`[StoryUI] Character ${effect.characterId} is already in the team`);
                    }
                } else {
                    console.warn('[StoryUI] Recruit effect type not recognized or missing characterId:', effect);
                }
            } else {
                console.log('[StoryUI] No recruit effect found in stage');
            }
            
            // Show success message
            this.showPopupMessage('✨ Your team has been fully healed and reinforced! Ready to continue the journey.', 'success', 4000);
            
        } catch (error) {
            console.error('[StoryUI] Error processing healing and recruit stage:', error);
            this.showPopupMessage('❌ Error processing stage effects. Please try again.', 'error', 3000);
            throw error; // Re-throw to be handled by startCurrentStage
        }
    }

    /**
     * Open character inventory management
     * @param {string} characterId - The character ID
     */
    async openCharacterInventory(characterId) {
        console.log(`[StoryUI] Opening inventory for character: ${characterId}`);
        
        try {
            // Verify inventory system is ready
            const systemReady = !!(window.ItemRegistry && window.GlobalInventory && window.CharacterInventories);
            if (!systemReady) {
                console.error('[StoryUI] Inventory system not ready!');
                this.showPopupMessage('❌ Inventory system not ready. Please wait a moment and try again.', 'error', 3000);
                return;
            }

            if (!window.InventoryUIManager) {
                console.error('[StoryUI] InventoryUIManager class not found!');
                this.showPopupMessage('❌ Inventory manager not loaded. Please refresh the page.', 'error', 3000);
                return;
            }

            // Initialize inventory UI manager if needed - use a single global instance
            if (!window.storyInventoryUIManager) {
                console.log('[StoryUI] Creating new InventoryUIManager instance for story mode');
                window.storyInventoryUIManager = new InventoryUIManager();
                console.log('[StoryUI] InventoryUIManager instance created successfully');
            } else {
                console.log('[StoryUI] Using existing InventoryUIManager instance');
                
                // Only reinitialize if there's an actual issue (missing modal or tooltip)
                const modalExists = document.getElementById('inventory-modal') && window.storyInventoryUIManager.modal;
                const tooltipExists = document.getElementById('item-tooltip') && window.storyInventoryUIManager.tooltip;
                
                if (!modalExists || !tooltipExists) {
                    console.log('[StoryUI] Modal or tooltip missing, reinitializing InventoryUIManager');
                    if (typeof window.storyInventoryUIManager.reinitialize === 'function') {
                        window.storyInventoryUIManager.reinitialize();
                        console.log('[StoryUI] InventoryUIManager reinitialized');
                    }
                } else {
                    console.log('[StoryUI] InventoryUIManager is ready, no reinitialization needed');
                }
            }

            // Verify the instance was created successfully
            if (!window.storyInventoryUIManager) {
                throw new Error('Failed to create InventoryUIManager instance');
            }

            // Open the inventory modal for this character
            console.log(`[StoryUI] Opening modal for character: ${characterId}`);
            await window.storyInventoryUIManager.openModal(characterId);
            
            console.log('[StoryUI] Character inventory modal opened successfully');
            
        } catch (error) {
            console.error('[StoryUI] Error opening character inventory:', error);
            this.showPopupMessage(`❌ Failed to open inventory: ${error.message}`, 'error', 4000);
        }
    }

    /**
     * Open global inventory management
     */
    async openGlobalInventory() {
        console.log('[StoryUI] Opening global inventory');
        
        try {
            // Verify inventory system is ready
            const systemReady = !!(window.ItemRegistry && window.GlobalInventory && window.CharacterInventories);
            if (!systemReady) {
                console.error('[StoryUI] Inventory system not ready!');
                this.showPopupMessage('❌ Inventory system not ready. Please wait a moment and try again.', 'error', 3000);
                return;
            }

            if (!window.InventoryUIManager) {
                console.error('[StoryUI] InventoryUIManager class not found!');
                this.showPopupMessage('❌ Inventory manager not loaded. Please refresh the page.', 'error', 3000);
                return;
            }

            // Initialize inventory UI manager if needed - use a single global instance
            if (!window.storyInventoryUIManager) {
                console.log('[StoryUI] Creating new InventoryUIManager instance for global inventory');
                window.storyInventoryUIManager = new InventoryUIManager();
                console.log('[StoryUI] InventoryUIManager instance created successfully');
            } else {
                console.log('[StoryUI] Using existing InventoryUIManager instance for global inventory');
                
                // Only reinitialize if there's an actual issue (missing modal or tooltip)
                const modalExists = document.getElementById('inventory-modal') && window.storyInventoryUIManager.modal;
                const tooltipExists = document.getElementById('item-tooltip') && window.storyInventoryUIManager.tooltip;
                
                if (!modalExists || !tooltipExists) {
                    console.log('[StoryUI] Modal or tooltip missing, reinitializing InventoryUIManager');
                    if (typeof window.storyInventoryUIManager.reinitialize === 'function') {
                        window.storyInventoryUIManager.reinitialize();
                        console.log('[StoryUI] InventoryUIManager reinitialized');
                    }
                } else {
                    console.log('[StoryUI] InventoryUIManager is ready, no reinitialization needed');
                }
            }

            // Verify the instance was created successfully
            if (!window.storyInventoryUIManager) {
                throw new Error('Failed to create InventoryUIManager instance');
            }

            // Open the global inventory modal
            console.log('[StoryUI] Opening global inventory modal');
            await window.storyInventoryUIManager.openGlobalInventoryModal();
            
            console.log('[StoryUI] Global inventory modal opened successfully');
            
        } catch (error) {
            console.error('[StoryUI] Error opening global inventory:', error);
            this.showPopupMessage(`❌ Failed to open global inventory: ${error.message}`, 'error', 4000);
        }
    }

    /**
     * Initialize inventory system for story mode
     */
    async initializeInventorySystem() {
        console.log('[StoryUI] Initializing inventory system for story mode');
        
        try {
            // Ensure Firebase auth is ready
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await new Promise((resolve) => {
                    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                        unsubscribe();
                        console.log('[StoryUI] Firebase auth state:', user ? 'authenticated' : 'not authenticated');
                        resolve();
                    });
                });
            }

            // Verify that the global instances were already created by story.html
            const inventorySystemStatus = {
                ItemRegistry: !!window.ItemRegistry,
                GlobalInventory: !!window.GlobalInventory,
                CharacterInventories: !!window.CharacterInventories,
                InventoryIntegrationManager: !!window.InventoryIntegrationManager
            };
            
            console.log('[StoryUI] Inventory system status check:', inventorySystemStatus);

            // If global instances don't exist, story.html initialization failed
            if (!inventorySystemStatus.ItemRegistry || !inventorySystemStatus.GlobalInventory || !inventorySystemStatus.CharacterInventories) {
                console.error('[StoryUI] Critical inventory system components missing! This suggests story.html initialization failed.');
                console.log('[StoryUI] Attempting emergency initialization...');
                
                // Emergency fallback initialization
                if (!window.ItemRegistry && typeof ItemRegistry !== 'undefined') {
                    window.ItemRegistry = new ItemRegistry();
                    console.log('[StoryUI] Emergency: Created ItemRegistry');
                }
                if (!window.GlobalInventory && typeof GlobalInventory !== 'undefined') {
                    window.GlobalInventory = new GlobalInventory();
                    console.log('[StoryUI] Emergency: Created GlobalInventory');
                }
                if (!window.CharacterInventories) {
                    window.CharacterInventories = new Map();
                    console.log('[StoryUI] Emergency: Created CharacterInventories');
                }
            } else {
                console.log('[StoryUI] ✓ All core inventory system components are properly initialized');
            }

            // Initialize inventory integration manager
            if (window.InventoryIntegrationManager) {
                console.log('[StoryUI] Initializing InventoryIntegrationManager...');
                await window.InventoryIntegrationManager.initialize();
                console.log('[StoryUI] ✓ Inventory integration manager initialized');
            } else {
                console.warn('[StoryUI] InventoryIntegrationManager not found - this is optional');
            }

            // Final verification
            const finalStatus = !!(window.ItemRegistry && window.GlobalInventory && window.CharacterInventories);
            console.log('[StoryUI] Final inventory system status:', finalStatus ? '✓ Ready' : '✗ Failed');
            
            if (!finalStatus) {
                throw new Error('Inventory system initialization failed - critical components missing');
            }

        } catch (error) {
            console.error('[StoryUI] Error initializing inventory system:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    /**
     * Update character stats after inventory changes
     */
    async updateCharacterStatsAfterInventoryChange() {
        console.log('[StoryUI] Updating character stats after inventory change');
        
        try {
            // Apply inventory items to all team members
            if (window.InventoryIntegrationManager && this.storyManager.playerTeam) {
                await window.InventoryIntegrationManager.applyInventoriesToCharacters(this.storyManager.playerTeam);
                
                // Re-render the team display to show updated stats
                this.renderPlayerTeam();
                
                console.log('[StoryUI] Character stats updated successfully');
            }
        } catch (error) {
            console.error('[StoryUI] Error updating character stats:', error);
        }
    }

    /**
     * Setup inventory management event handlers
     */
    setupInventoryEventHandlers() {
        // Team inventory management button
        const teamInventoryBtn = document.getElementById('team-inventory-button');
        if (teamInventoryBtn) {
            teamInventoryBtn.addEventListener('click', () => {
                this.showTeamInventoryManager();
            });
        }

        // Global inventory button
        const globalInventoryBtn = document.getElementById('global-inventory-button');
        if (globalInventoryBtn) {
            globalInventoryBtn.addEventListener('click', () => {
                this.openGlobalInventory();
            });
        }
    }

    /**
     * Show team inventory manager with all characters
     */
    showTeamInventoryManager() {
        console.log('[StoryUI] Showing team inventory manager');
        
        if (!this.storyManager.playerTeam || this.storyManager.playerTeam.length === 0) {
            this.showPopupMessage('❌ No team members to manage inventory for.', 'error', 3000);
            return;
        }

        // Show popup with character selection for inventory management
        this.showPopupMessage(`📦 Click on any character's inventory button (🎒) to manage their equipment.`, 'info', 4000);
    }
}
