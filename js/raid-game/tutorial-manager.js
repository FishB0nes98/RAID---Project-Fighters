/**
 * Tutorial Manager - Provides interactive tutorial overlays for new players
 * Specifically designed for the Training Grounds tutorial stage
 */
class TutorialManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.isActive = false;
        this.overlay = null;
        this.highlightElement = null;
        this.tooltipElement = null;
        
        // Tutorial configuration
        this.tutorialData = {
            'training_grounds': [
                {
                    id: 'welcome',
                    title: 'Welcome to Battle!',
                    description: 'This is your first battle! Let me guide you through the interface so you can defeat Schoolboy Siegfried.',
                    target: null,
                    position: 'center',
                    showNext: true
                },
                {
                    id: 'character_overview',
                    title: 'Your Character',
                    description: 'This is your character card. You can see your HP (health), Mana, and abilities. The green bars show your current health and mana.',
                    target: '#player-characters-container .character-slot',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'enemy_overview',
                    title: 'Your Enemy',
                    description: 'Here\'s Schoolboy Siegfried, your opponent! You can see his stats too. Your goal is to reduce his HP to zero.',
                    target: '#ai-characters-container .character-slot',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'abilities_intro',
                    title: 'Your Abilities',
                    description: 'These are your character\'s abilities. For this tutorial, we\'ll focus on your Q ability (first one). Hover over it to see details!',
                    target: '#player-characters-container .abilities .ability:first-child',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'turn_system',
                    title: 'Turn-Based Combat',
                    description: 'This shows whose turn it is and the current turn number. Combat alternates between your turn and the enemy\'s turn.',
                    target: '.middle-section',
                    position: 'left',
                    showNext: true
                },
                {
                    id: 'battle_log',
                    title: 'Battle Log',
                    description: 'The battle log shows everything that happens during combat. You can see damage dealt, abilities used, and other important information here.',
                    target: '.battle-log-container',
                    position: 'right',
                    showNext: true
                },
                {
                    id: 'first_action',
                    title: 'Make Your First Move!',
                    description: 'Now it\'s time to act! First, click on your character to select them, then choose an ability to use.',
                    target: '#player-characters-container .character-slot',
                    position: 'top',
                    showNext: false,
                    waitForAction: 'selectCharacter'
                },
                {
                    id: 'select_ability',
                    title: 'Choose Your Q Ability',
                    description: 'Great! Now click on your Q ability (the first one) to select it. This is your basic attack ability.',
                    target: '#player-characters-container .abilities .ability:first-child',
                    position: 'top',
                    showNext: false,
                    waitForAction: 'selectAbility'
                },
                {
                    id: 'select_target',
                    title: 'Select Your Target',
                    description: 'Perfect! Now click on Siegfried to target him with your ability. Some abilities can target allies, others target enemies.',
                    target: '#ai-characters-container .character-slot',
                    position: 'bottom',
                    showNext: false,
                    waitForAction: 'selectTarget'
                },
                {
                    id: 'combat_continues',
                    title: 'Combat Continues!',
                    description: 'Excellent! You\'ve made your first attack. Now Siegfried will take his turn, then it\'ll be your turn again. Continue fighting until one of you is defeated!',
                    target: null,
                    position: 'center',
                    showNext: true
                },
                {
                    id: 'end_turn_button',
                    title: 'End Turn Button',
                    description: 'If you ever want to skip your turn or have finished all your actions, you can click the "End Turn" button to let your opponent act.',
                    target: '#end-turn-button',
                    position: 'left',
                    showNext: true
                },
                {
                    id: 'good_luck',
                    title: 'You\'re Ready!',
                    description: 'That covers the basics! Use your abilities strategically, watch your mana, and defeat Siegfried. Good luck, champion!',
                    target: null,
                    position: 'center',
                    showNext: true,
                    isLastStep: true
                }
            ],
            'advanced_training': [
                {
                    id: 'carryover_intro',
                    title: 'Resource Carryover!',
                    description: 'Notice something important: your HP and mana from the previous battle have carried over! This happens between all stages in a story.',
                    target: null,
                    position: 'center',
                    showNext: true
                },
                {
                    id: 'hp_bar_highlight',
                    title: 'Your Health Status',
                    description: 'This is your current HP from the previous battle. If you took damage fighting Siegfried, you\'ll need to manage your health carefully!',
                    target: '#player-characters-container .character-slot .health-bar',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'mana_bar_highlight',
                    title: 'Your Mana Status',
                    description: 'This is your current mana from the previous battle. If you used abilities against Siegfried, you\'ll have less mana available now.',
                    target: '#player-characters-container .character-slot .mana-bar',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'enemy_abilities_intro',
                    title: 'New Enemy Abilities',
                    description: 'These Little Devils have special abilities! They have damage resistance (take 25% less damage) and can steal your mana. Be strategic!',
                    target: '#ai-characters-container',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'mana_management',
                    title: 'Mana Management is Key',
                    description: 'Watch out! The Little Devils can steal your mana with their abilities. Make sure you have enough mana for your important abilities!',
                    target: '#player-characters-container .character-slot .mana-bar',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'damage_resistance_warning',
                    title: 'Damage Resistance',
                    description: 'These enemies take 25% less damage from all sources due to their passive ability. You\'ll need to deal more damage to defeat them!',
                    target: '#ai-characters-container .character-slot:first-child',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'advanced_combat_ready',
                    title: 'Ready for Advanced Combat!',
                    description: 'You now understand resource carryover and enemy special abilities. Fight strategically and manage your resources wisely. Good luck!',
                    target: null,
                    position: 'center',
                    showNext: true,
                    isLastStep: true
                }
            ],
            'farm_disturbance': [
                {
                    id: 'stage_modifiers_intro',
                    title: 'Stage Modifiers!',
                    description: 'This battle has special conditions! Stage modifiers affect the entire battlefield and can change how combat works. Look for the stage modifiers indicator at the top of the screen.',
                    target: '.stage-modifiers-indicator',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'healing_wind_explanation',
                    title: 'Healing Farm Wind',
                    description: 'The "Healing Farm Wind" modifier will restore 1% of each character\'s maximum HP at the start of every turn. This affects both you and your enemies!',
                    target: '.stage-modifiers-indicator',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'hp_monitoring',
                    title: 'Watch Your Health',
                    description: 'Pay attention to the health bars during this battle. You\'ll see small green healing numbers appear at the start of each turn thanks to the healing wind effect.',
                    target: '.character-hp',
                    position: 'top',
                    showNext: true
                },
                {
                    id: 'enemy_modifications',
                    title: 'Weakened Enemies',
                    description: 'Farmer Nina and Farmer Raiden have been weakened by whatever affected them - they have 30% less health than usual. Use this to your advantage!',
                    target: '#ai-characters-container',
                    position: 'bottom',
                    showNext: true
                },
                {
                    id: 'strategic_combat',
                    title: 'Strategic Combat',
                    description: 'With stage modifiers in play, every battle becomes more strategic. Consider how the healing wind affects your approach - you can be more aggressive knowing you\'ll heal over time!',
                    target: null,
                    position: 'center',
                    showNext: true
                },
                {
                    id: 'modifier_ready',
                    title: 'Ready for Modifiers!',
                    description: 'You now understand stage modifiers! Many future battles will have unique conditions that change gameplay. Always check the stage modifiers indicator before fighting!',
                    target: null,
                    position: 'center',
                    showNext: true,
                    isLastStep: true
                }
            ]
        };
    }

    /**
     * Initialize tutorial for a specific stage
     */
    initialize(stageData) {
        console.log('[TutorialManager] initialize() called with stageData:', stageData);
        console.log('[TutorialManager] stageData.isTutorial:', stageData?.isTutorial);
        console.log('[TutorialManager] stageData.name:', stageData?.name);
        console.log('[TutorialManager] stageData.tutorialHighlights:', stageData?.tutorialHighlights);
        
        if (!stageData || !stageData.isTutorial) {
            console.log('[TutorialManager] Not a tutorial stage, returning false');
            return false;
        }

        // Determine stage ID based on stage name and characteristics
        let stageId = stageData.id;
        console.log('[TutorialManager] Initial stageId from stageData.id:', stageId);
        
        if (!stageId) {
            // Map stage names to tutorial IDs
            const stageName = stageData.name?.toLowerCase() || '';
            console.log('[TutorialManager] stageName (lowercase):', stageName);
            
            if (stageName.includes('training grounds')) {
                stageId = 'training_grounds';
            } else if (stageName.includes('advanced training')) {
                stageId = 'advanced_training';
            } else if (stageName.includes('farm disturbance')) {
                stageId = 'farm_disturbance';
            } else {
                // Default fallback based on tutorial highlights or stage characteristics
                console.log('[TutorialManager] No stage name match, checking tutorialHighlights...');
                if (stageData.tutorialHighlights?.includes('stage-modifiers-indicator')) {
                    stageId = 'farm_disturbance';
                    console.log('[TutorialManager] Set stageId to farm_disturbance based on tutorialHighlights');
                } else if (stageData.boss?.includes('Siegfried')) {
                    stageId = 'training_grounds';
                } else {
                    stageId = 'training_grounds'; // Default fallback
                    console.log('[TutorialManager] Using default fallback: training_grounds');
                }
            }
        }
        
        console.log('[TutorialManager] Final determined stageId:', stageId);
        console.log('[TutorialManager] Available tutorial data keys:', Object.keys(this.tutorialData));

        if (!this.tutorialData[stageId]) {
            console.log('[TutorialManager] No tutorial data for stage:', stageId, 'Available:', Object.keys(this.tutorialData));
            return false;
        }

        this.tutorialSteps = this.tutorialData[stageId];
        this.currentStep = 0;
        this.currentStageId = stageId;
        
        console.log('[TutorialManager] About to create tutorial elements...');
        this.createTutorialElements();
        
        console.log('[TutorialManager] Tutorial initialized for stage:', stageId, 'with', this.tutorialSteps.length, 'steps');
        return true;
    }

    /**
     * Start the tutorial
     */
    start() {
        if (this.tutorialSteps.length === 0) {
            console.warn('[TutorialManager] No tutorial steps defined');
            return;
        }

        this.isActive = true;
        
        // Add tutorial-specific styling
        document.body.classList.add('tutorial-active');
        
        // Hide UI elements during tutorial
        this.hideUIElements();
        
        // Ensure battle log is visible and stays open
        this.ensureBattleLogVisible();
        
        // Disable interactions initially
        this.setInteractionMode('none');
        
        // Start periodic checks to ensure critical elements stay visible
        this.startPeriodicVisibilityChecks();
        
        // Wait a moment for the game UI to fully load
        setTimeout(() => {
            this.showStep(0);
            // Try to set up dynamic listeners as fallback
            setTimeout(() => {
                this.setupDynamicTutorialListeners();
                // Recheck battle log visibility after UI loads
                this.ensureBattleLogVisible();
                // Recheck critical elements visibility after UI loads
                this.ensureCriticalElementsVisible();
            }, 2000);
        }, 1000);
    }

    /**
     * Show a specific tutorial step
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) {
            console.warn('[TutorialManager] Invalid step index:', stepIndex);
            return;
        }

        this.currentStep = stepIndex;
        const step = this.tutorialSteps[stepIndex];
        
        // Update interaction mode based on step
        this.updateInteractionMode(stepIndex);
        
        // Clear any existing highlights
        this.clearHighlights();
        
        // Show overlay
        this.showOverlay();
        
        // Highlight target element if specified
        if (step.target) {
            this.highlightElement = this.createHighlight(step.target);
        }
        
        // Show tooltip
        this.showTooltip(step);
        
        // Update step counter
        const counterEl = this.tooltipElement.querySelector('.tutorial-step-counter');
        if (counterEl) {
            counterEl.textContent = `${stepIndex + 1}/${this.tutorialSteps.length}`;
        }

        // Update Back button state
        const backBtn = this.tooltipElement.querySelector('.tutorial-prev-button');
        if (backBtn) {
            backBtn.disabled = stepIndex === 0;
        }

        // Update Next button label (Finish on last step)
        const nextBtn = this.tooltipElement.querySelector('.tutorial-next-button');
        if (nextBtn) {
            if (stepIndex === this.tutorialSteps.length - 1) {
                nextBtn.textContent = 'Finish';
            } else {
                nextBtn.textContent = 'Next';
            }
        }
        
        console.log(`[TutorialManager] Showing step ${stepIndex + 1}/${this.tutorialSteps.length}: ${step.title}`);
    }

    /**
     * Create tutorial overlay elements
     */
    createTutorialElements() {
        // Create main overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
        `;
        
        // Create tooltip element
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tutorial-tooltip';
        this.tooltipElement.innerHTML = `
            <div class="tutorial-tooltip-content">
                <div class="tutorial-tooltip-header">
                    <h3 class="tutorial-tooltip-title"></h3>
                    <div class="tutorial-tooltip-progress">
                        <span class="tutorial-step-counter"></span>
                    </div>
                </div>
                <div class="tutorial-tooltip-body">
                    <p class="tutorial-tooltip-description"></p>
                </div>
                <div class="tutorial-tooltip-footer">
                    <button class="tutorial-button tutorial-prev-button" disabled>Back</button>
                    <button class="tutorial-button tutorial-skip-button">Skip Tutorial</button>
                    <button class="tutorial-button tutorial-next-button">Next</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.setupEventListeners();
        
        // Add to document
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltipElement);
    }

    /**
     * Setup event listeners for tutorial controls
     */
    setupEventListeners() {
        // Next button
        this.tooltipElement.querySelector('.tutorial-next-button').addEventListener('click', () => {
            this.nextStep();
        });
        
        // Previous (Back) button
        this.tooltipElement.querySelector('.tutorial-prev-button').addEventListener('click', () => {
            this.previousStep();
        });
        
        // Skip button
        this.tooltipElement.querySelector('.tutorial-skip-button').addEventListener('click', () => {
            this.skip();
        });
        
        // Listen for game events to progress tutorial
        document.addEventListener('characterSelected', (event) => {
            // During tutorial, block character selection until step 7
            if (this.isActive && this.currentStep < 6) {
                console.log('[TutorialManager] Blocking character selection - too early in tutorial');
                if (this.gameManager) {
                    this.gameManager.addLogEntry('Please follow the tutorial steps first!', 'system');
                }
                return;
            }
            this.handleGameEvent('selectCharacter', event.detail);
        });
        
        document.addEventListener('abilitySelected', (event) => {
            // During tutorial, only allow Q ability (index 0) AND only after step 7
            if (this.isActive) {
                if (event.detail.abilityIndex !== 0) {
                    console.log('[TutorialManager] Blocking non-Q ability during tutorial');
                    if (this.gameManager) {
                        this.gameManager.addLogEntry('For this tutorial, please use your Q ability!', 'system');
                    }
                    return;
                }
                
                // Block Q ability until step 8 (select ability step)
                if (this.currentStep < 7) {
                    console.log('[TutorialManager] Blocking Q ability - too early in tutorial');
                    if (this.gameManager) {
                        this.gameManager.addLogEntry('Please follow the tutorial steps first!', 'system');
                    }
                    return;
                }
            }
            this.handleGameEvent('selectAbility', event.detail);
        });
        
        document.addEventListener('targetSelected', (event) => {
            this.handleGameEvent('selectTarget', event.detail);
        });

        // Listen for dynamic tutorial events
        document.addEventListener('gameStateReady', () => {
            console.log('[TutorialManager] gameStateReady event received');
            setTimeout(() => {
                this.setupDynamicTutorialListeners();
            }, 1000);
        });

        document.addEventListener('GameStart', () => {
            console.log('[TutorialManager] GameStart event received');
            setTimeout(() => {
                this.setupDynamicTutorialListeners();
            }, 1000);
        });
    }

    /**
     * Handle game events for tutorial progression
     */
    handleGameEvent(eventType, eventData) {
        if (!this.isActive) return;
        
        const currentStep = this.tutorialSteps[this.currentStep];
        if (currentStep && currentStep.waitForAction === eventType) {
            console.log(`[TutorialManager] Tutorial progressed by ${eventType} event`);
            setTimeout(() => {
                this.nextStep();
            }, 500); // Small delay to let the action complete
        }
    }

    /**
     * Show the overlay
     */
    showOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'block';
            setTimeout(() => {
                this.overlay.classList.add('tutorial-overlay-visible');
            }, 50);
        }
    }

    /**
     * Hide the overlay
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('tutorial-overlay-visible');
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Create highlight for target element
     */
    createHighlight(selector) {
        const targetElement = document.querySelector(selector);
        if (!targetElement) {
            console.warn('[TutorialManager] Target element not found:', selector);
            return null;
        }

        const highlight = document.createElement('div');
        highlight.className = 'tutorial-highlight';
        
        // Position the highlight over the target element
        const rect = targetElement.getBoundingClientRect();
        highlight.style.left = (rect.left - 10) + 'px';
        highlight.style.top = (rect.top - 10) + 'px';
        highlight.style.width = (rect.width + 20) + 'px';
        highlight.style.height = (rect.height + 20) + 'px';
        
        document.body.appendChild(highlight);
        
        // Animate in
        setTimeout(() => {
            highlight.classList.add('tutorial-highlight-visible');
        }, 100);
        
        return highlight;
    }

    /**
     * Show tooltip for current step
     */
    showTooltip(step) {
        const tooltip = this.tooltipElement;
        const titleElement = tooltip.querySelector('.tutorial-tooltip-title');
        const descriptionElement = tooltip.querySelector('.tutorial-tooltip-description');
        const counterElement = tooltip.querySelector('.tutorial-step-counter');
        const nextButton = tooltip.querySelector('.tutorial-next-button');
        
        // Update content
        titleElement.textContent = step.title;
        descriptionElement.textContent = step.description;
        counterElement.textContent = `${this.currentStep + 1} / ${this.tutorialSteps.length}`;
        
        // Update button state
        if (step.waitForAction) {
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = 'block';
            nextButton.textContent = step.isLastStep ? 'Finish' : 'Next';
        }
        
        // Position tooltip
        this.positionTooltip(step);
        
        // Show tooltip
        tooltip.style.display = 'block';
        setTimeout(() => {
            tooltip.classList.add('tutorial-tooltip-visible');
        }, 100);
    }

    /**
     * Position tooltip based on step configuration
     */
    positionTooltip(step) {
        const tooltip = this.tooltipElement;
        const position = step.position || 'center';
        
        // Reset classes
        tooltip.className = 'tutorial-tooltip tutorial-tooltip-visible';
        
        if (position === 'center') {
            tooltip.classList.add('tutorial-tooltip-center');
        } else if (step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left = 0;
                let top = 0;
                
                switch (position) {
                    case 'top':
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.top - tooltipRect.height - 20;
                        tooltip.classList.add('tutorial-tooltip-top');
                        break;
                    case 'bottom':
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.bottom + 20;
                        tooltip.classList.add('tutorial-tooltip-bottom');
                        break;
                    case 'left':
                        left = rect.left - tooltipRect.width - 20;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        tooltip.classList.add('tutorial-tooltip-left');
                        break;
                    case 'right':
                        left = rect.right + 20;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        tooltip.classList.add('tutorial-tooltip-right');
                        break;
                }
                
                // Ensure tooltip stays within viewport
                left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
                top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        }
    }

    /**
     * Go to next tutorial step
     */
    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    /**
     * Go to previous tutorial step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        // Remove existing highlights
        const existingHighlights = document.querySelectorAll('.tutorial-highlight');
        existingHighlights.forEach(highlight => {
            highlight.classList.remove('tutorial-highlight-visible');
            setTimeout(() => {
                if (highlight.parentNode) {
                    highlight.parentNode.removeChild(highlight);
                }
            }, 300);
        });
        
        this.highlightElement = null;
    }

    /**
     * Skip the tutorial
     */
    skip() {
        if (confirm('Are you sure you want to skip the tutorial? You can always play it again by starting the Tutorial story.')) {
            this.complete();
        }
    }

    /**
     * Complete the tutorial
     */
    complete() {
        console.log('[TutorialManager] Tutorial completed');
        
        this.isActive = false;
        
        // Hide all tutorial elements
        this.hideOverlay();
        this.clearHighlights();
        
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('tutorial-tooltip-visible');
            setTimeout(() => {
                this.tooltipElement.style.display = 'none';
            }, 300);
        }
        
        // Remove tutorial styling
        document.body.classList.remove('tutorial-active');
        
        // Restore UI elements and interactions
        this.restoreUIElements();
        this.setInteractionMode('full');
        
        // Add completion log
        if (this.gameManager) {
            this.gameManager.addLogEntry('Tutorial completed! Good luck in battle!', 'system');
        }
    }

    /**
     * Hide UI elements during tutorial
     */
    hideUIElements() {
        // Hide talents panel button
        const talentsButton = document.getElementById('show-talents-button');
        if (talentsButton) {
            talentsButton.style.display = 'none';
        }
        
        // Store original visibility states
        this.hiddenElements = [];
        if (talentsButton) {
            this.hiddenElements.push({ element: talentsButton, originalDisplay: talentsButton.style.display });
        }
        
        // Ensure critical tutorial elements remain visible
        this.ensureCriticalElementsVisible();
    }

    /**
     * Ensure critical tutorial elements remain visible
     */
    ensureCriticalElementsVisible() {
        // Elements that must always be visible during tutorial
        const criticalSelectors = [
            '.stage-modifiers-indicator',
            '.stage-modifier-indicator',
            '.stage-modifiers',
            '.stage-modifier',
            '[class*="stage-modifiers"]',
            '[class*="stage-modifier"]',
            '[class*="modifier"]',
            '#stage-modifiers',
            '#stage-modifier',
            '.character-hp',
            '.health-bar',
            '.mana-bar',
            '[class*="hp-bar"]',
            '[class*="health"]',
            '[class*="mana"]'
        ];
        
        criticalSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    element.style.opacity = '1';
                    element.style.visibility = 'visible';
                    element.style.display = '';
                    element.style.pointerEvents = 'all';
                    console.log(`[TutorialManager] Ensured visibility for: ${selector}`);
                }
            });
        });
    }

    /**
     * Start periodic checks to ensure critical elements stay visible
     */
    startPeriodicVisibilityChecks() {
        if (this.visibilityCheckInterval) {
            clearInterval(this.visibilityCheckInterval);
        }
        
        this.visibilityCheckInterval = setInterval(() => {
            if (this.isActive) {
                this.ensureCriticalElementsVisible();
            }
        }, 1000); // Check every second
        
        console.log('[TutorialManager] Started periodic visibility checks');
    }

    /**
     * Restore UI elements after tutorial
     */
    restoreUIElements() {
        if (this.hiddenElements) {
            this.hiddenElements.forEach(item => {
                item.element.style.display = item.originalDisplay || '';
            });
            this.hiddenElements = [];
        }
    }

    /**
     * Ensure battle log is visible and stays open during tutorial
     */
    ensureBattleLogVisible() {
        // Try multiple common selectors for battle log
        const selectors = ['.battle-log-container', '.battle-log', '#battle-log', '.log-container', '.combat-log'];
        let battleLogContainer = null;
        
        for (const selector of selectors) {
            battleLogContainer = document.querySelector(selector);
            if (battleLogContainer) break;
        }
        
        if (battleLogContainer) {
            // Force it to be visible
            battleLogContainer.style.display = 'block';
            battleLogContainer.style.visibility = 'visible';
            battleLogContainer.style.opacity = '1';
            battleLogContainer.style.transform = 'none';
            
            // If there's a toggle button, make sure it's in "open" state
            const toggleSelectors = ['.battle-log-toggle', '.log-toggle-btn', '.toggle-log', '.log-button'];
            for (const toggleSelector of toggleSelectors) {
                const toggleButton = document.querySelector(toggleSelector);
                if (toggleButton) {
                    toggleButton.classList.add('active');
                    toggleButton.setAttribute('data-state', 'open');
                    // Force click if it seems to be in closed state
                    if (toggleButton.textContent?.includes('Show') || toggleButton.classList.contains('closed')) {
                        toggleButton.click();
                    }
                }
            }
            
            // Ensure battle log content is scrollable
            const battleLogContent = document.querySelector('.battle-log-content');
            if (battleLogContent) {
                battleLogContent.style.overflowY = 'auto';
                battleLogContent.style.overflowX = 'hidden';
                battleLogContent.style.maxHeight = '250px'; // Ensure it has a height limit to make scrolling possible
                battleLogContent.style.scrollBehavior = 'smooth';
                console.log('[TutorialManager] Battle log content scrolling enabled');
            }
            
            console.log('[TutorialManager] Battle log visibility ensured for:', battleLogContainer.className);
        } else {
            console.warn('[TutorialManager] Battle log container not found with any selector');
        }
    }

    /**
     * Set interaction mode for the tutorial
     */
    setInteractionMode(mode) {
        const gameContainer = document.querySelector('.battle-container');
        if (!gameContainer) return;

        // Remove all interaction classes
        gameContainer.classList.remove('tutorial-no-interact', 'tutorial-hover-only', 'tutorial-full-interact');

        switch (mode) {
            case 'none':
                gameContainer.classList.add('tutorial-no-interact');
                break;
            case 'hover':
                gameContainer.classList.add('tutorial-hover-only');
                break;
            case 'full':
                gameContainer.classList.add('tutorial-full-interact');
                break;
        }

        console.log(`[TutorialManager] Interaction mode set to: ${mode}`);
    }

    /**
     * Update interaction mode based on tutorial step
     */
    updateInteractionMode(stepIndex) {
        // Different interaction modes for different tutorial stages
        if (this.currentStageId === 'farm_disturbance') {
            // Farm disturbance tutorial is less restrictive
            if (stepIndex >= 2) { // Allow full interaction after stage modifier explanation
                this.setInteractionMode('full');
                document.body.classList.remove('q-ability-locked');
            } else {
                this.setInteractionMode('hover');
                document.body.classList.add('q-ability-locked');
            }
        } else {
            // Original training grounds interaction mode
            if (stepIndex >= 6) { // Step 7+ (0-indexed): Enable full clicking
                this.setInteractionMode('full');
                // Enable Q ability clicking
                document.body.classList.remove('q-ability-locked');
            } else if (stepIndex >= 2) { // Step 3+ (0-indexed): Enable hovering
                this.setInteractionMode('hover');
                // Keep Q ability locked for clicking but allow hovering
                document.body.classList.add('q-ability-locked');
            } else {
                this.setInteractionMode('none');
                // Lock Q ability completely
                document.body.classList.add('q-ability-locked');
            }
        }
    }

    /**
     * Setup dynamic tutorial listeners for game events
     */
    setupDynamicTutorialListeners() {
        console.log('[TutorialManager] setupDynamicTutorialListeners called');
        console.log('[TutorialManager] isActive:', this.isActive);
        console.log('[TutorialManager] gameManager:', !!this.gameManager);
        console.log('[TutorialManager] gameState:', !!this.gameManager?.gameState);
        
        if (!this.isActive) {
            console.log('[TutorialManager] Tutorial not active, skipping setup');
            return;
        }
        
        if (!this.gameManager || !this.gameManager.gameState) {
            console.log('[TutorialManager] Game state not ready, retrying in 2 seconds...');
            setTimeout(() => {
                this.setupDynamicTutorialListeners();
            }, 2000);
            return;
        }

        console.log('[TutorialManager] Setting up dynamic tutorial listeners');
        console.log('[TutorialManager] Player characters:', this.gameManager.gameState.playerCharacters?.length);
        console.log('[TutorialManager] AI characters:', this.gameManager.gameState.aiCharacters?.length);
        
        // Track if we've shown warnings already
        this.shownWarnings = this.shownWarnings || {
            siegfriedStacks: false,
            statsDebuffs: false,
            rightClick: false
        };

        // Monitor Siegfried's passive stacks
        this.monitorSiegfriedPassive();
        
        // Monitor stat changes and debuffs
        this.monitorStatsAndDebuffs();
        
        // Monitor turn changes for right-click tutorial
        this.monitorTurnChanges();
    }

    /**
     * Monitor Siegfried's passive stacks
     */
    monitorSiegfriedPassive() {
        console.log('[TutorialManager] Setting up Siegfried monitoring');
        if (!this.gameManager || !this.gameManager.gameState) {
            console.log('[TutorialManager] No game state for Siegfried monitoring');
            return;
        }

        // Find Siegfried in AI characters
        const siegfried = this.gameManager.gameState.aiCharacters.find(char => 
            char && (char.id === 'schoolboy_siegfried' || char.name?.includes('Siegfried')));
        
        console.log('[TutorialManager] Found Siegfried:', !!siegfried);
        if (siegfried) {
            console.log('[TutorialManager] Siegfried ID:', siegfried.id);
            console.log('[TutorialManager] Siegfried name:', siegfried.name);
        }
        
        if (!siegfried) {
            console.log('[TutorialManager] Siegfried not found, available AI characters:');
            this.gameManager.gameState.aiCharacters.forEach((char, i) => {
                console.log(`[TutorialManager] AI ${i}: ${char?.id} - ${char?.name}`);
            });
            return;
        }

        // Check for Lion's Courage stacks every few seconds
        const checkStacks = () => {
            if (!this.isActive || this.shownWarnings.siegfriedStacks) return;

            console.log('[TutorialManager] Checking Siegfried stacks...');
            console.log('[TutorialManager] Siegfried buffs:', siegfried.buffs?.length || 0);
            
            // Log all buffs for debugging
            if (siegfried.buffs) {
                siegfried.buffs.forEach((buff, i) => {
                    console.log(`[TutorialManager] Buff ${i}: ${buff.id || buff.name} - stacks: ${buff.stacks}`);
                });
            }

            // Look for Lion's Courage buff stacks - try multiple ways to find it
            const lionsCourageBuff = siegfried.buffs?.find(buff => 
                buff.id === 'lions_courage' || 
                buff.name?.toLowerCase().includes('lion') || 
                buff.name?.toLowerCase().includes('courage') ||
                buff.id?.includes('lion') ||
                buff.id?.includes('courage'));
            
            console.log('[TutorialManager] Lions Courage buff found:', !!lionsCourageBuff);
            if (lionsCourageBuff) {
                console.log('[TutorialManager] Lions Courage stacks:', lionsCourageBuff.stacks);
            }
            
            if (lionsCourageBuff && lionsCourageBuff.stacks >= 3) {
                console.log('[TutorialManager] Showing Siegfried warning - 3+ stacks detected!');
                this.showDynamicWarning(
                    'Danger: Siegfried\'s Power!',
                    'Siegfried has gained 3 stacks of Lion\'s Courage! His next attack will be devastating. You need abilities that provide dodge chance or increase your defense to survive!',
                    'warning'
                );
                this.shownWarnings.siegfriedStacks = true;
            }
        };

        // Check immediately and then every 2 seconds
        checkStacks();
        this.siegfriedStacksInterval = setInterval(checkStacks, 2000);
        console.log('[TutorialManager] Siegfried monitoring interval started');
    }

    /**
     * Monitor stat changes and debuffs
     */
    monitorStatsAndDebuffs() {
        console.log('[TutorialManager] Setting up stats/debuffs monitoring');
        if (!this.gameManager) {
            console.log('[TutorialManager] No game manager for stats monitoring');
            return;
        }

        // Check if we already overrode the function
        if (this.gameManager._tutorialLogOverridden) {
            console.log('[TutorialManager] Log function already overridden');
            return;
        }

        // Override the original addLogEntry to catch stat changes
        const originalAddLogEntry = this.gameManager.addLogEntry.bind(this.gameManager);
        
        this.gameManager.addLogEntry = (message, className) => {
            // Call original function first
            originalAddLogEntry(message, className);
            
            // Ensure auto-scroll happens for tutorial stages
            setTimeout(() => {
                // Try multiple selectors to ensure we find the scrollable element
                const selectors = ['.battle-log-content', '#battle-log', '.battle-log'];
                let scrollableElement = null;
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        // Check if this element has scrollable content
                        if (element.scrollHeight > element.clientHeight) {
                            scrollableElement = element;
                            break;
                        }
                    }
                }
                
                if (scrollableElement) {
                    scrollableElement.scrollTop = scrollableElement.scrollHeight;
                    console.log('[TutorialManager] Auto-scrolled battle log:', scrollableElement.className || scrollableElement.id);
                } else {
                    console.warn('[TutorialManager] No scrollable battle log element found');
                }
            }, 100); // Increased delay to ensure DOM is fully updated
            
            console.log('[TutorialManager] Log message intercepted:', message);
            
            // Skip tutorial messages to prevent infinite loop
            if (message.startsWith('[Tutorial]')) {
                return;
            }
            
            // Check for stat/debuff related messages
            if (!this.isActive || this.shownWarnings.statsDebuffs) return;

            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('buff') || lowerMessage.includes('debuff') || 
                lowerMessage.includes('increased') || lowerMessage.includes('decreased') ||
                lowerMessage.includes('gains') || lowerMessage.includes('loses') ||
                lowerMessage.includes('damage') || lowerMessage.includes('heal')) {
                
                console.log('[TutorialManager] Stats/debuffs message detected, showing warning');
                this.showDynamicWarning(
                    'Stats & Effects Explained',
                    'Characters can gain buffs (positive effects) or debuffs (negative effects) that modify their stats. These appear as icons below character names and can change damage, defense, speed, and more!',
                    'info'
                );
                this.shownWarnings.statsDebuffs = true;
            }
        };
        
        this.gameManager._tutorialLogOverridden = true;
        console.log('[TutorialManager] Stats monitoring override installed');
    }

    /**
     * Monitor turn changes for right-click tutorial
     */
    monitorTurnChanges() {
        console.log('[TutorialManager] Setting up turn monitoring');
        if (!this.gameManager) {
            console.log('[TutorialManager] No game manager for turn monitoring');
            return;
        }

        // Check for turn 2
        const checkTurnTwo = () => {
            if (!this.isActive || this.shownWarnings.rightClick) return;
            
            const currentTurn = this.gameManager.gameState?.turn || 1;
            console.log('[TutorialManager] Current turn:', currentTurn);
            
            if (currentTurn >= 2) {
                console.log('[TutorialManager] Turn 2 reached, showing right-click tutorial');
                this.showDynamicWarning(
                    'Inspect Characters',
                    'Right-click on any character (yours or Siegfried\'s) to see detailed stats, abilities, and effects! This is very useful for planning your strategy.',
                    'tip',
                    () => {
                        // Enable right-click during tutorial
                        this.enableRightClickDuringTutorial();
                    }
                );
                this.shownWarnings.rightClick = true;
                clearInterval(this.turnCheckInterval);
            }
        };

        // Check immediately and then every second
        checkTurnTwo();
        this.turnCheckInterval = setInterval(checkTurnTwo, 1000);
        console.log('[TutorialManager] Turn monitoring interval started');
    }

    /**
     * Enable right-click context menu during tutorial
     */
    enableRightClickDuringTutorial() {
        // Add special CSS to allow right-click on character elements
        const style = document.createElement('style');
        style.id = 'tutorial-rightclick-style';
        style.textContent = `
            body.tutorial-active .character-slot {
                pointer-events: all !important;
                cursor: context-menu;
            }
            body.tutorial-active #context-menu {
                z-index: 10005 !important;
                pointer-events: all !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show a dynamic tutorial warning/tip
     */
    showDynamicWarning(title, description, type = 'info', callback = null) {
        if (!this.isActive) return;

        // Create a temporary dynamic tooltip
        const dynamicTooltip = document.createElement('div');
        dynamicTooltip.className = `tutorial-dynamic-warning tutorial-dynamic-${type}`;
        dynamicTooltip.innerHTML = `
            <div class="tutorial-dynamic-content">
                <div class="tutorial-dynamic-header">
                    <h3 class="tutorial-dynamic-title">${title}</h3>
                    <span class="tutorial-dynamic-type">${type.toUpperCase()}</span>
                </div>
                <div class="tutorial-dynamic-body">
                    <p class="tutorial-dynamic-description">${description}</p>
                </div>
                <div class="tutorial-dynamic-footer">
                    <button class="tutorial-button tutorial-dynamic-ok">Got it!</button>
                </div>
            </div>
        `;

        // Position in top-right corner
        dynamicTooltip.style.position = 'fixed';
        dynamicTooltip.style.top = '20px';
        dynamicTooltip.style.right = '20px';
        dynamicTooltip.style.zIndex = '10006';
        dynamicTooltip.style.maxWidth = '350px';

        // Add to document
        document.body.appendChild(dynamicTooltip);

        // Show with animation
        setTimeout(() => {
            dynamicTooltip.classList.add('tutorial-dynamic-visible');
        }, 100);

        // Setup close button
        const okButton = dynamicTooltip.querySelector('.tutorial-dynamic-ok');
        okButton.addEventListener('click', () => {
            dynamicTooltip.classList.remove('tutorial-dynamic-visible');
            setTimeout(() => {
                if (dynamicTooltip.parentNode) {
                    dynamicTooltip.parentNode.removeChild(dynamicTooltip);
                }
            }, 300);
            
            // Execute callback if provided
            if (callback) callback();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (dynamicTooltip.parentNode) {
                okButton.click();
            }
        }, 10000);

        // Log the message
        if (this.gameManager) {
            this.gameManager.addLogEntry(`[Tutorial] ${title}: ${description}`, 'system');
        }
    }

    /**
     * Clean up tutorial elements
     */
    destroy() {
        this.isActive = false;
        this.clearHighlights();
        
        // Clear intervals
        if (this.siegfriedStacksInterval) {
            clearInterval(this.siegfriedStacksInterval);
        }
        if (this.turnCheckInterval) {
            clearInterval(this.turnCheckInterval);
        }
        if (this.visibilityCheckInterval) {
            clearInterval(this.visibilityCheckInterval);
        }
        
        // Remove dynamic tutorial styles
        const rightClickStyle = document.getElementById('tutorial-rightclick-style');
        if (rightClickStyle) {
            rightClickStyle.remove();
        }
        
        // Remove any dynamic warnings
        const dynamicWarnings = document.querySelectorAll('.tutorial-dynamic-warning');
        dynamicWarnings.forEach(warning => warning.remove());
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
        
        document.body.classList.remove('tutorial-active');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialManager;
} else {
    window.TutorialManager = TutorialManager;
}