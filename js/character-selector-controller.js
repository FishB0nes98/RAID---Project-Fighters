// Character Selector Controller
// This extends the ControllerManager functionality for the Character Selection screen

class CharacterSelectorController {
    constructor() {
        this.controllerManager = null;
        this.currentSection = 'stories'; // 'stories', 'stages', 'characters', 'team', 'buttons'
        this.currentIndex = 0;
        this.showingHints = false;
        this.hintsTimeout = null;
        this.lastButtonPress = 0;
        this.buttonCooldown = 200; // ms
        this.sections = {
            tabs: {
                selector: '.tab-button',
                currentIndex: 0,
                navigationType: 'horizontal'
            },
            stories: { 
                selector: '#story-tab .story-container', 
                currentIndex: 0,
                navigationType: 'grid'
            },
            stages: { 
                selector: '#stage-tab .stage-card', 
                currentIndex: 0,
                navigationType: 'grid'
            },
            tagFilters: {
                selector: '.tag-filter-button',
                currentIndex: 0,
                navigationType: 'horizontal'
            },
            characters: { 
                selector: '.character-card:not(.hidden):not(.locked)', 
                currentIndex: 0,
                navigationType: 'grid'
            },
            team: { 
                selector: '.team-slot', 
                currentIndex: 0,
                navigationType: 'horizontal'
            },
            buttons: { 
                selector: '.action-button', 
                currentIndex: 0,
                navigationType: 'horizontal'
            }
        };
        this.runButtons = {
            selector: '.run-action-button',
            currentIndex: 0,
            navigationType: 'horizontal'
        };
        this.contextHelperVisible = false;
        this.contextHelperTimeout = null;
        this.initialize();
    }

    initialize() {
        console.log('[CharacterSelector] Initializing controller support...');
        
        // Check if ControllerManager is available
        if (typeof ControllerManager === 'undefined') {
            console.warn('[CharacterSelector] ControllerManager not available, controller support disabled');
            return;
        }
        
        // We'll use the existing ControllerManager for gamepad connectivity
        this.controllerManager = new ControllerManager();
        
        console.log('[CharacterSelector] ControllerManager instantiated:', this.controllerManager);
        
        // Override specific methods
        this.controllerManager.handleConfirmButton = () => {
            console.log('[CharacterSelector] A button pressed');
            this.handleConfirmButton();
        };
        
        this.controllerManager.handleCancelButton = () => {
            console.log('[CharacterSelector] B button pressed');
            this.handleCancelButton();
        };
        
        this.controllerManager.handleXButton = () => {
            console.log('[CharacterSelector] X button pressed');
            this.handleXButton();
        };
        
        this.controllerManager.handleYButton = () => {
            console.log('[CharacterSelector] Y button pressed');
            this.handleYButton();
        };
        
        this.controllerManager.handleStartButton = () => {
            console.log('[CharacterSelector] Start button pressed');
            this.handleStartButton();
        };
        
        this.controllerManager.handleBackButton = () => {
            console.log('[CharacterSelector] Back button pressed');
            this.handleBackButton();
        };
        
        this.controllerManager.navigateUp = () => {
            console.log('[CharacterSelector] Up pressed');
            this.navigateDirection('up');
        };
        
        this.controllerManager.navigateDown = () => {
            console.log('[CharacterSelector] Down pressed');
            this.navigateDirection('down');
        };
        
        this.controllerManager.navigateLeft = () => {
            console.log('[CharacterSelector] Left pressed');
            this.navigateDirection('left');
        };
        
        this.controllerManager.navigateRight = () => {
            console.log('[CharacterSelector] Right pressed');
            this.navigateDirection('right');
        };
        
        this.controllerManager.navigatePreviousCharacter = () => {
            console.log('[CharacterSelector] LB pressed');
            this.navigateSection('previous');
        };
        
        this.controllerManager.navigateNextCharacter = () => {
            console.log('[CharacterSelector] RB pressed');
            this.navigateSection('next');
        };
        
        // Setup controller mode indicator and context helper functionality
        this.setupControllerIndicator();
        
        // Override enableControllerMode to show indicator
        const originalEnableMethod = this.controllerManager.enableControllerMode;
        this.controllerManager.enableControllerMode = () => {
            console.log('[CharacterSelector] Controller mode enabled');
            originalEnableMethod.call(this.controllerManager);
            this.showControllerModeIndicator();
        };
        
        // Override disableControllerMode to hide indicator
        const originalDisableMethod = this.controllerManager.disableControllerMode;
        this.controllerManager.disableControllerMode = () => {
            console.log('[CharacterSelector] Controller mode disabled');
            originalDisableMethod.call(this.controllerManager);
            this.hideControllerModeIndicator();
        };
        
        // Initialize the controller manager
        console.log('[CharacterSelector] Calling controllerManager.initialize()');
        this.controllerManager.initialize();
        
        // Show temporary hints on first controller detection
        document.addEventListener('gamepadconnected', (e) => {
            console.log('[CharacterSelector] Gamepad connected:', e.gamepad.id);
            this.showControllerHints();
            this.showTooltip('Controller connected: ' + e.gamepad.id);
        });
        
        console.log('Character Selector Controller initialized');
        
        // Start in story section by default
        setTimeout(() => {
            console.log('[CharacterSelector] Selecting initial element');
            this.selectInitialElement();
        }, 500);

        /* -----------------------------------------------------
           Inject Draft Mode Tab & Content (UI helper)
        ----------------------------------------------------- */
        try {
            const tabsContainer = document.querySelector('.tabs');
            if (tabsContainer && !tabsContainer.querySelector('[data-tab="draft-tab"]')) {
                // Create the tab button element
                const draftBtn = document.createElement('button');
                draftBtn.className = 'tab-button';
                draftBtn.setAttribute('data-tab', 'draft-tab');
                draftBtn.textContent = 'Draft Mode';
                tabsContainer.appendChild(draftBtn);

                // Create the corresponding content panel
                const selectorPanel = tabsContainer.closest('.selector-panel');
                if (selectorPanel) {
                    const weeklyTabContent = selectorPanel.querySelector('#weekly-tab');
                    const draftTab = document.createElement('div');
                    draftTab.className = 'tab-content';
                    draftTab.id = 'draft-tab';
                    draftTab.innerHTML = `
                        <div class="draft-mode-panel" style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:24px;max-width:640px;margin:0 auto;text-align:center;">
                            <h3 style="font-size:1.8rem;">🛡️ Draft Mode</h3>
                            <p style="line-height:1.6;color:var(--neutral-300);">Take turns with the AI to pick from a shared hero pool, then battle with your drafted squad. Ready to test your drafting skills?</p>
                            <button id="start-draft-mode-btn" class="action-button start-button" style="padding:14px 28px;font-size:1rem;">Enter Draft Lobby</button>
                        </div>`;
                    // Insert right after the weekly tab panel so order matches buttons
                    if (weeklyTabContent) {
                        weeklyTabContent.after(draftTab);
                    } else {
                        selectorPanel.appendChild(draftTab);
                    }
                }

                // Add click handler to navigate to Draft Mode
                document.addEventListener('click', (evt) => {
                    if (evt.target && evt.target.id === 'start-draft-mode-btn') {
                        window.location.href = 'draft-mode.html';
                    }
                });
            }
        } catch (draftErr) {
            console.error('[CharacterSelector] Failed to inject Draft Mode tab:', draftErr);
        }
        /* ----------------------------------------------------- */
    }

    setupControllerIndicator() {
        const indicator = document.querySelector('.controller-mode-indicator');
        const contextHelper = document.querySelector('.controller-context-helper');
        
        if (indicator) {
            // Show context helper when hovering or clicking the indicator
            indicator.addEventListener('mouseenter', () => this.showContextHelper());
            indicator.addEventListener('click', () => {
                if (this.contextHelperVisible) {
                    this.hideContextHelper();
                } else {
                    this.showContextHelper(true); // Show with longer timeout
                }
            });
            
            // Hide context helper when mouse leaves
            indicator.addEventListener('mouseleave', () => {
                if (!this.contextHelperPinned) {
                    this.hideContextHelper(500); // Small delay before hiding
                }
            });
        }
        
        if (contextHelper) {
            // Click outside to hide pinned context helper
            document.addEventListener('click', (event) => {
                if (this.contextHelperPinned && 
                    !contextHelper.contains(event.target) && 
                    !indicator.contains(event.target)) {
                    this.hideContextHelper();
                }
            });
        }
    }
    
    showControllerModeIndicator() {
        const indicator = document.querySelector('.controller-mode-indicator');
        if (indicator) {
            indicator.classList.add('active');
            
            // Show context helper briefly when controller mode is first activated
            this.showContextHelper();
            
            // Hide context helper after a few seconds
            setTimeout(() => {
                this.hideContextHelper();
            }, 3000);
        }
    }
    
    hideControllerModeIndicator() {
        const indicator = document.querySelector('.controller-mode-indicator');
        if (indicator) {
            indicator.classList.remove('active');
            this.hideContextHelper();
        }
    }
    
    showContextHelper(pin = false) {
        clearTimeout(this.contextHelperTimeout);
        
        const contextHelper = document.querySelector('.controller-context-helper');
        if (!contextHelper) return;
        
        // Update context helper content based on current section
        this.updateContextHelperContent();
        
        contextHelper.classList.add('visible');
        this.contextHelperVisible = true;
        this.contextHelperPinned = pin;
        
        if (!pin) {
            // Auto-hide after timeout if not pinned
            this.contextHelperTimeout = setTimeout(() => {
                this.hideContextHelper();
            }, 5000);
        }
    }
    
    hideContextHelper(delay = 0) {
        clearTimeout(this.contextHelperTimeout);
        
        if (delay > 0) {
            this.contextHelperTimeout = setTimeout(() => {
                this.hideContextHelperImmediately();
            }, delay);
        } else {
            this.hideContextHelperImmediately();
        }
    }
    
    hideContextHelperImmediately() {
        const contextHelper = document.querySelector('.controller-context-helper');
        if (contextHelper) {
            contextHelper.classList.remove('visible');
            this.contextHelperVisible = false;
            this.contextHelperPinned = false;
        }
    }
    
    updateContextHelperContent() {
        const contextTitle = document.querySelector('.controller-context-title');
        if (!contextTitle) return;
        
        // Update title based on current section
        let title;
        switch (this.currentSection) {
            case 'tabs': title = 'Tab Selection'; break;
            case 'stories': title = 'Story Selection'; break;
            case 'stages': title = 'Stage Selection'; break;
            case 'tagFilters': title = 'Tag Filters'; break;
            case 'characters': title = 'Character Selection'; break;
            case 'team': title = 'Team Management'; break;
            case 'buttons': title = 'Actions'; break;
            case 'activeRuns': title = 'Active Runs'; break;
            default: title = 'Controller Buttons';
        }
        
        contextTitle.textContent = title;
        
        // Update button mappings based on current section
        const actionMappings = {
            'tabs': {
                'A': 'Switch Tab',
                'B': 'Cancel',
                'X': 'N/A',
                'Y': 'Tag Filters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'stories': {
                'A': 'Select Story',
                'B': 'To Tabs',
                'X': 'Story Details',
                'Y': 'Tag Filters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'stages': {
                'A': 'Select Stage',
                'B': 'To Tabs',
                'X': 'Stage Details',
                'Y': 'Tag Filters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'tagFilters': {
                'A': 'Apply Filter',
                'B': 'Clear Filters',
                'X': 'N/A',
                'Y': 'Back to Characters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'characters': {
                'A': 'Select/Deselect',
                'B': 'Back to Story/Stage',
                'X': 'View Talents',
                'Y': 'Tag Filters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'team': {
                'A': 'Remove Character',
                'B': 'Back to Characters',
                'X': 'N/A',
                'Y': 'Tag Filters',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'buttons': {
                'A': 'Activate Button',
                'B': 'Back',
                'X': 'N/A',
                'Y': 'N/A',
                'LB/RB': 'Change Section',
                '▶': 'Start Battle'
            },
            'activeRuns': {
                'A': 'Continue Run',
                'B': 'Back to Stories',
                'X': 'N/A',
                'Y': 'N/A',
                'LB/RB': 'Change Run',
                '▶': 'Continue Selected Run'
            }
        };
        
        // Get mappings for current section or use default
        const mappings = actionMappings[this.currentSection] || actionMappings['characters'];
        
        // Update all button mappings
        const buttonMappings = document.querySelectorAll('.context-button-mapping');
        if (buttonMappings.length >= 6) {
            buttonMappings[0].querySelector('.context-action').textContent = mappings['A'];
            buttonMappings[1].querySelector('.context-action').textContent = mappings['B'];
            buttonMappings[2].querySelector('.context-action').textContent = mappings['X'];
            buttonMappings[3].querySelector('.context-action').textContent = mappings['Y'];
            buttonMappings[4].querySelector('.context-action').textContent = mappings['LB/RB'];
            buttonMappings[5].querySelector('.context-action').textContent = mappings['▶'];
        }
    }

    selectInitialElement() {
        // Check for active runs first
        const activeRuns = document.querySelectorAll('.active-run-item');
        if (activeRuns.length > 0) {
            this.currentSection = 'activeRuns';
            this.sections.activeRuns = {
                selector: '.active-run-item',
                currentIndex: 0,
                navigationType: 'vertical'
            };
            this.selectElement(activeRuns[0]);
            return;
        }
        
        // Otherwise start with story tab
        const storyElements = document.querySelectorAll(this.sections.stories.selector);
        if (storyElements.length > 0) {
            this.currentSection = 'stories';
            this.selectElement(storyElements[0]);
        }
    }

    selectElement(element) {
        if (!element) return;

        // Remove highlight from previously selected element
        document.querySelectorAll('.controller-selected').forEach(el => {
            el.classList.remove('controller-selected');
        });
        
        // Add highlight to new element
        element.classList.add('controller-selected');
        
        // Update controller cursor position
        this.controllerManager.positionCursorAtElement(element);
        
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        
        // Update context helper if visible
        if (this.contextHelperVisible) {
            this.updateContextHelperContent();
        }
        
        // Show contextual tooltip based on element type
        this.showContextualTooltip(element);
    }
    
    getCurrentSectionElements() {
        const section = this.sections[this.currentSection];
        if (!section) return [];
        
        return document.querySelectorAll(section.selector);
    }
    
    navigateDirection(direction) {
        const now = Date.now();
        if (now - this.lastButtonPress < this.buttonCooldown) return;
        this.lastButtonPress = now;
        
        const elements = this.getCurrentSectionElements();
        if (elements.length === 0) return;
        
        const section = this.sections[this.currentSection];
        const currentIndex = section.currentIndex;
        let newIndex = currentIndex;
        
        // Handle different navigation patterns based on section type
        switch (section.navigationType) {
            case 'horizontal':
                if (direction === 'left') {
                    newIndex = Math.max(0, currentIndex - 1);
                } else if (direction === 'right') {
                    newIndex = Math.min(elements.length - 1, currentIndex + 1);
                } else if (direction === 'up' || direction === 'down') {
                    // Change sections on up/down when in horizontal nav sections
                    this.changeSectionVertically(direction);
                    return;
                }
                break;
                
            case 'vertical':
                if (direction === 'up') {
                    newIndex = Math.max(0, currentIndex - 1);
                } else if (direction === 'down') {
                    newIndex = Math.min(elements.length - 1, currentIndex + 1);
                } else if (direction === 'left' || direction === 'right') {
                    // For active runs, navigate between buttons
                    if (this.currentSection === 'activeRuns') {
                        const currentElement = elements[currentIndex];
                        if (!currentElement) return;
                        
                        const buttons = currentElement.querySelectorAll('.run-action-button');
                        if (buttons.length > 0) {
                            const buttonIndex = direction === 'left' ? 0 : 1;
                            if (buttons[buttonIndex]) {
                                this.selectElement(buttons[buttonIndex]);
                                return;
                            }
                        }
                    }
                }
                break;
                
            case 'grid':
                // Grid navigation logic
                const grid = this.calculateGrid(elements);
                const [row, col] = this.findPositionInGrid(currentIndex, grid);
                
                if (direction === 'left') {
                    if (col > 0) {
                        newIndex = grid[row][col - 1];
                    }
                } else if (direction === 'right') {
                    if (col < grid[row].length - 1) {
                        newIndex = grid[row][col + 1];
                    }
                } else if (direction === 'up') {
                    if (row > 0 && grid[row - 1][col] !== undefined) {
                        newIndex = grid[row - 1][col];
                    } else {
                        // Change sections if at top of grid
                        this.changeSectionVertically('up');
                        return;
                    }
                } else if (direction === 'down') {
                    if (row < grid.length - 1 && grid[row + 1][col] !== undefined) {
                        newIndex = grid[row + 1][col];
                    } else {
                        // Change sections if at bottom of grid
                        this.changeSectionVertically('down');
                        return;
                    }
                }
                break;
        }
        
        if (newIndex !== currentIndex && elements[newIndex]) {
            section.currentIndex = newIndex;
            this.selectElement(elements[newIndex]);
        }
    }
    
    // Calculate a grid representation of elements based on their positions
    calculateGrid(elements) {
        if (elements.length === 0) return [[]];
        
        const positions = Array.from(elements).map(el => {
            const rect = el.getBoundingClientRect();
            return {
                element: el,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            };
        });
        
        // Sort by Y position first to group into rows
        positions.sort((a, b) => a.centerY - b.centerY);
        
        // Group into rows based on Y position (elements within 30px vertically are in the same row)
        const rows = [];
        let currentRow = [0];
        
        for (let i = 1; i < positions.length; i++) {
            if (Math.abs(positions[i].centerY - positions[i-1].centerY) < 30) {
                currentRow.push(i);
            } else {
                rows.push([...currentRow]);
                currentRow = [i];
            }
        }
        
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }
        
        // Sort each row by X position
        for (let i = 0; i < rows.length; i++) {
            rows[i].sort((a, b) => positions[a].centerX - positions[b].centerX);
        }
        
        return rows;
    }
    
    // Find the row and column of an element index in the grid
    findPositionInGrid(index, grid) {
        for (let row = 0; row < grid.length; row++) {
            const col = grid[row].indexOf(index);
            if (col !== -1) {
                return [row, col];
            }
        }
        return [0, 0];
    }
    
    changeSectionVertically(direction) {
        // Section switching logic based on current context
        const sectionOrder = ['tabs', 'stories', 'stages', 'tagFilters', 'characters', 'team', 'buttons'];
        
        // Handle the active tabs
        const activeTab = document.querySelector('.tab-button.active');
        const isStoryTab = activeTab && activeTab.dataset.tab === 'story-tab';
        
        // Find current section index
        let currentSectionIndex = sectionOrder.indexOf(this.currentSection);
        if (currentSectionIndex === -1) currentSectionIndex = 0;
        
        // Determine new section based on direction
        let newSectionIndex = currentSectionIndex;
        if (direction === 'up') {
            newSectionIndex = Math.max(0, currentSectionIndex - 1);
            
            // Skip 'stages' if story tab is active
            if (isStoryTab && sectionOrder[newSectionIndex] === 'stages') {
                newSectionIndex--;
            }
            
            // Skip 'stories' if stage tab is active
            if (!isStoryTab && sectionOrder[newSectionIndex] === 'stories') {
                newSectionIndex--;
            }
        } else {
            newSectionIndex = Math.min(sectionOrder.length - 1, currentSectionIndex + 1);
            
            // Skip 'stages' if story tab is active
            if (isStoryTab && sectionOrder[newSectionIndex] === 'stages') {
                newSectionIndex++;
            }
            
            // Skip 'stories' if stage tab is active
            if (!isStoryTab && sectionOrder[newSectionIndex] === 'stories') {
                newSectionIndex++;
            }
        }
        
        // Don't go beyond bounds
        if (newSectionIndex < 0) newSectionIndex = 0;
        if (newSectionIndex >= sectionOrder.length) newSectionIndex = sectionOrder.length - 1;
        
        // Switch to new section if different
        if (newSectionIndex !== currentSectionIndex) {
            const newSection = sectionOrder[newSectionIndex];
            this.navigateToSection(newSection);
        }
    }
    
    navigateToSection(sectionName) {
        if (!this.sections[sectionName]) return;
        
        this.currentSection = sectionName;
        const elements = this.getCurrentSectionElements();
        
        if (elements.length > 0) {
            // Use currentIndex if within bounds, otherwise reset to 0
            let index = this.sections[sectionName].currentIndex;
            if (index >= elements.length) {
                index = 0;
                this.sections[sectionName].currentIndex = 0;
            }
            
            this.selectElement(elements[index]);
            
            // Update context helper content when changing sections
            if (this.contextHelperVisible) {
                this.updateContextHelperContent();
            } else {
                // Briefly show context helper when changing sections
                this.showContextHelper();
            }
        }
    }
    
    navigateSection(direction) {
        // LB/RB buttons to switch between major sections
        const sectionOrder = ['tabs', 'stories', 'stages', 'tagFilters', 'characters', 'team', 'buttons'];
        
        // Handle the active tabs
        const activeTab = document.querySelector('.tab-button.active');
        const isStoryTab = activeTab && activeTab.dataset.tab === 'story-tab';
        
        // Get current section index
        let currentSectionIndex = sectionOrder.indexOf(this.currentSection);
        if (currentSectionIndex === -1) currentSectionIndex = 0;
        
        // Calculate new section index
        let newSectionIndex;
        if (direction === 'previous') {
            newSectionIndex = Math.max(0, currentSectionIndex - 1);
            
            // Skip 'stages' if story tab is active
            if (isStoryTab && sectionOrder[newSectionIndex] === 'stages') {
                newSectionIndex--;
            }
            
            // Skip 'stories' if stage tab is active
            if (!isStoryTab && sectionOrder[newSectionIndex] === 'stories') {
                newSectionIndex--;
            }
        } else {
            newSectionIndex = Math.min(sectionOrder.length - 1, currentSectionIndex + 1);
            
            // Skip 'stages' if story tab is active
            if (isStoryTab && sectionOrder[newSectionIndex] === 'stages') {
                newSectionIndex++;
            }
            
            // Skip 'stories' if stage tab is active
            if (!isStoryTab && sectionOrder[newSectionIndex] === 'stories') {
                newSectionIndex++;
            }
        }
        
        if (newSectionIndex < 0 || newSectionIndex >= sectionOrder.length) return;
        
        const newSection = sectionOrder[newSectionIndex];
        this.navigateToSection(newSection);
    }

    handleConfirmButton() {
        const elements = this.getCurrentSectionElements();
        if (elements.length === 0) return;
        
        const section = this.sections[this.currentSection];
        if (!section) return;
        
        const currentElement = elements[section.currentIndex];
        if (!currentElement) return;
        
        // Handle based on current section
        switch (this.currentSection) {
            case 'tabs':
                // Click the tab button
                currentElement.click();
                // Navigate to the appropriate section after tab change
                setTimeout(() => {
                    const newTab = currentElement.dataset.tab;
                    if (newTab === 'story-tab') {
                        this.navigateToSection('stories');
                    } else if (newTab === 'stage-tab') {
                        this.navigateToSection('stages');
                    }
                }, 50);
                break;
                
            case 'stories':
            case 'stages':
                // Click the story or stage
                currentElement.click();
                break;
                
            case 'tagFilters':
                // Click the tag filter button
                currentElement.click();
                // Stay in tag filters section
                break;
                
            case 'characters':
                // Click the character card
                currentElement.click();
                break;
                
            case 'team':
                // Click the team slot to remove character
                if (currentElement.classList.contains('filled')) {
                    currentElement.click();
                } else {
                    // If empty slot, navigate to characters section
                    this.navigateToSection('characters');
                }
                break;
                
            case 'buttons':
                // Click the button
                if (!currentElement.disabled) {
                    currentElement.click();
                } else {
                    // Show feedback for disabled button
                    this.showTooltip(currentElement.title || 'This action is not available yet');
                }
                break;
                
            case 'activeRuns':
                // If it's a button, click it
                if (currentElement.classList.contains('run-action-button')) {
                    currentElement.click();
                } else {
                    // If it's the run item itself, find and click the continue button
                    const continueButton = currentElement.querySelector('.continue-run-button');
                    if (continueButton) {
                        continueButton.click();
                    }
                }
                break;
        }
    }

    handleCancelButton() {
        // B button generally acts as back/cancel
        if (this.currentSection === 'characters' || this.currentSection === 'team') {
            // From characters or team, go back to stages/stories
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab && activeTab.dataset.tab === 'story-tab') {
                this.navigateToSection('stories');
            } else {
                this.navigateToSection('stages');
            }
        } else if (this.currentSection === 'buttons') {
            // From buttons, try to click "back" if it exists
            const backButton = document.querySelector('#back-button');
            if (backButton) {
                backButton.click();
            }
        } else if (this.currentSection === 'stories' || this.currentSection === 'stages') {
            // From stages, go to tabs
            this.navigateToSection('tabs');
        } else if (this.currentSection === 'activeRuns') {
            // From active runs, go to stories
            this.navigateToSection('stories');
        } else if (this.currentSection === 'tagFilters') {
            // From tag filters, go back to characters without filter
            const allTagsButton = document.querySelector('.tag-filter-button[data-tag=""]');
            if (allTagsButton) {
                allTagsButton.click();
            }
            this.navigateToSection('characters');
        }
    }

    handleXButton() {
        // X button - Open character talents if in characters section
        if (this.currentSection === 'characters') {
            const elements = this.getCurrentSectionElements();
            const section = this.sections[this.currentSection];
            if (!elements[section.currentIndex]) return;
            
            const talentsButton = elements[section.currentIndex].querySelector('.talents-button');
            if (talentsButton) {
                talentsButton.click();
            }
        } else if (this.currentSection === 'stories' || this.currentSection === 'stages') {
            // Show detail modal for story/stage
            // TODO: Implement story/stage details display functionality if needed
        }
    }

    handleYButton() {
        // Y button - Toggle tag filters visibility
        this.navigateToSection('tagFilters');
    }

    handleStartButton() {
        // Start button triggers the start battle action if ready
        const startButton = document.querySelector('#start-button');
        if (startButton && !startButton.disabled) {
            startButton.click();
        } else {
            this.showTooltip('Team not ready yet. Please complete your selection.');
        }
    }

    handleBackButton() {
        // Back button acts like the back button
        const backButton = document.querySelector('#back-button');
        if (backButton) {
            backButton.click();
        }
    }
    
    showControllerHints() {
        if (this.showingHints) return;
        
        clearTimeout(this.hintsTimeout);
        this.showingHints = true;
        
        const hintsContainer = document.createElement('div');
        hintsContainer.className = 'controller-hints';
        hintsContainer.innerHTML = `
            <div class="controller-hint-item">
                <div class="controller-hint-button">A</div>
                <div class="controller-hint-text">Select</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button">B</div>
                <div class="controller-hint-text">Back</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button">X</div>
                <div class="controller-hint-text">Talents</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button">Y</div>
                <div class="controller-hint-text">Filters</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button">LB/RB</div>
                <div class="controller-hint-text">Change Section</div>
            </div>
            <div class="controller-hint-item">
                <div class="controller-hint-button">▶</div>
                <div class="controller-hint-text">Start Battle</div>
            </div>
        `;
        
        document.body.appendChild(hintsContainer);
        
        // Auto-hide after 5 seconds
        this.hintsTimeout = setTimeout(() => {
            if (hintsContainer.parentNode) {
                hintsContainer.parentNode.removeChild(hintsContainer);
            }
            this.showingHints = false;
        }, 5000);
    }
    
    showTooltip(message) {
        // Reuse existing tooltip function if available
        if (window.showTooltip && typeof window.showTooltip === 'function') {
            window.showTooltip(message);
            return;
        }
        
        // Otherwise create our own tooltip
        let tooltip = document.querySelector('.tooltip-message');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip-message';
            document.body.appendChild(tooltip);
            
            // Make sure we have styles for our tooltip
            if (!document.getElementById('tooltip-styles')) {
                const style = document.createElement('style');
                style.id = 'tooltip-styles';
                style.textContent = `
                    .tooltip-message {
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%) translateY(-50px);
                        background-color: rgba(126, 87, 194, 0.9);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 4px;
                        font-size: 0.9rem;
                        z-index: 1000;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                        opacity: 0;
                        transition: transform 0.3s, opacity 0.3s;
                        text-align: center;
                    }
                    
                    .tooltip-message.show {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        tooltip.textContent = message;
        
        tooltip.classList.remove('show');
        void tooltip.offsetWidth; // Force reflow
        
        tooltip.classList.add('show');
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 2500);
    }

    // Show contextual tooltips based on what's selected
    showContextualTooltip(element) {
        if (!element) return;
        
        let message = null;
        
        // First-time help messages based on element type
        if (element.classList.contains('tab-button')) {
            message = "A: Switch between Story/Stage tabs";
        } else if (element.classList.contains('story-container')) {
            message = "A: Select story | X: View details";
        } else if (element.classList.contains('stage-card')) {
            message = "A: Select stage | X: View details";
        } else if (element.classList.contains('character-card') && !element.classList.contains('locked')) {
            if (!element.classList.contains('selected')) {
                message = "A: Add to team | X: View talents";
            } else {
                message = "A: Remove from team | X: View talents";
            }
        } else if (element.classList.contains('team-slot')) {
            if (element.classList.contains('filled')) {
                message = "A: Remove character from team";
            }
        } else if (element.classList.contains('tag-filter-button')) {
            message = "A: Filter characters by tag";
        } else if (element.classList.contains('action-button')) {
            if (element.id === 'start-button') {
                if (element.disabled) {
                    message = element.title || "Complete your selection to start";
                } else {
                    message = "A: Start battle with selected team";
                }
            } else if (element.id === 'back-button') {
                message = "A: Return to main menu";
            }
        } else if (element.classList.contains('run-action-button')) {
            if (element.classList.contains('continue-run-button')) {
                message = "A: Continue this story run";
            } else if (element.classList.contains('finish-run-button')) {
                message = "A: Delete this story progress";
            }
        }
        
        // Show the message if we have one
        if (message) {
            // Check if we've already shown this type of help
            const helpKey = `help_shown_${this.currentSection}`;
            if (!sessionStorage.getItem(helpKey)) {
                this.showTooltip(message);
                sessionStorage.setItem(helpKey, 'true');
            }
        }
    }
}

// Initialize controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure all other scripts have initialized
    setTimeout(() => {
        window.characterSelectorController = new CharacterSelectorController();
    }, 1000);
}); 