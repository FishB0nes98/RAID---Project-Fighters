/**
 * QuestUIManager - Handles quest panel display and interactions
 */
class QuestUIManager {
    constructor() {
        this.initialized = false;
        this.currentCharacter = null;
        this.questPanel = null;
        this.toggleButton = null;
        this.questsList = null;
        this.questsLoading = null;
        this.questsEmpty = null;
        this.isCollapsed = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isVisible = false;
        this.closeButton = null;
        this.dragHandle = null;
        this.questToggleButton = null;
    }

    /**
     * Initialize the quest UI manager
     */
    initialize() {
        try {
            console.log('[QuestUIManager] Starting initialization...');
            
            // Get UI elements
            this.questPanel = document.getElementById('quests-panel');
            this.toggleButton = document.getElementById('toggle-quests-button');
            this.questToggleButton = document.getElementById('quest-panel-toggle');
            this.questsList = document.getElementById('quests-list');
            this.questsLoading = document.getElementById('quests-loading');
            this.questsEmpty = document.getElementById('quests-empty');

            console.log('[QuestUIManager] UI Elements found:', {
                questPanel: !!this.questPanel,
                toggleButton: !!this.toggleButton,
                questToggleButton: !!this.questToggleButton,
                questsList: !!this.questsList,
                questsLoading: !!this.questsLoading,
                questsEmpty: !!this.questsEmpty
            });

            if (!this.questPanel || !this.toggleButton || !this.questsList) {
                throw new Error('Quest UI elements not found');
            }

            // Setup drag and close functionality
            this.setupDragAndClose();

            // Setup event listeners
            this.setupEventListeners();

            // Initial hide
            this.hideQuestPanel();

            this.initialized = true;
            console.log('[QuestUIManager] Initialized successfully');
            
            // Add debug functions to window
            window.debugQuests = () => this.debugInfo();
            window.showQuestPanel = () => this.showQuestPanel();
            window.hideQuestPanel = () => this.hideQuestPanel();
            window.toggleQuestPanel = () => this.toggleQuestPanel();
            window.completeActiveCharacterQuest = () => this.completeActiveCharacterQuest();
            
            return true;
        } catch (error) {
            console.error('[QuestUIManager] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Setup drag and close functionality
     */
    setupDragAndClose() {
        // Add close button to header
        const header = this.questPanel.querySelector('.quests-panel-header');
        if (header) {
            // Create drag handle
            this.dragHandle = document.createElement('div');
            this.dragHandle.className = 'quest-drag-handle';
            this.dragHandle.innerHTML = '⋮⋮';
            this.dragHandle.title = 'Drag to move';
            
            // Create close button
            this.closeButton = document.createElement('button');
            this.closeButton.className = 'quest-close-button';
            this.closeButton.innerHTML = '✕';
            this.closeButton.title = 'Close quest panel';
            
            // Insert drag handle at the beginning
            header.insertBefore(this.dragHandle, header.firstChild);
            
            // Add close button after the toggle button
            header.appendChild(this.closeButton);
        }

        // Make panel draggable
        this.setupDragFunctionality();
    }

    /**
     * Setup drag functionality
     */
    setupDragFunctionality() {
        if (!this.dragHandle) return;

        this.dragHandle.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.questPanel.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            // Add dragging class for visual feedback
            this.questPanel.classList.add('dragging');
            
            // Prevent text selection during drag
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            // Keep panel within viewport bounds
            const maxX = window.innerWidth - this.questPanel.offsetWidth;
            const maxY = window.innerHeight - this.questPanel.offsetHeight;
            
            const clampedX = Math.max(0, Math.min(maxX, x));
            const clampedY = Math.max(0, Math.min(maxY, y));
            
            this.questPanel.style.left = `${clampedX}px`;
            this.questPanel.style.top = `${clampedY}px`;
            this.questPanel.style.position = 'fixed';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.questPanel.classList.remove('dragging');
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button (collapse/expand)
        this.toggleButton.addEventListener('click', () => {
            this.toggleCollapse();
        });

        // Quest panel toggle button (show/hide panel)
        if (this.questToggleButton) {
            this.questToggleButton.addEventListener('click', () => {
                this.toggleQuestPanel();
            });
        }

        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.hideQuestPanel();
            });
        }

        // Listen for character selection changes
        document.addEventListener('characterSelected', (event) => {
            const character = event.detail.character;
            this.updateForCharacter(character);
        });

        // Listen for quest progress updates
        document.addEventListener('questProgressUpdated', (event) => {
            this.refreshQuests();
        });

        // Listen for quest completion
        document.addEventListener('questCompleted', (event) => {
            this.refreshQuests();
            this.checkGlobalQuestProgress();
        });

        // Add keyboard shortcut to toggle quest panel (SHIFT key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift' && !e.ctrlKey && !e.altKey) {
                // Only if not typing in an input field
                if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                    e.preventDefault();
                    this.toggleQuestPanel();
                }
            }
        });
    }

    /**
     * Toggle quest panel visibility
     */
    toggleQuestPanel() {
        if (this.isVisible) {
            this.hideQuestPanel();
        } else {
            this.showQuestPanel();
        }
    }

    /**
     * Update quest display for a specific character
     */
    updateForCharacter(character) {
        if (!this.initialized) return;

        this.currentCharacter = character;
        
        if (character && this.isVisible) {
            this.loadCharacterQuests(character);
        }
    }

    /**
     * Load and display quests for a character
     */
    async loadCharacterQuests(character) {
        if (!window.questManager || !window.questManager.initialized) {
            this.showLoading();
            return;
        }

        try {
            const quests = window.questManager.getCharacterQuests(character.id);
            const globalQuests = window.questManager.getGlobalQuests();
            
            const allQuests = [...quests, ...globalQuests];
            
            if (allQuests.length === 0) {
                this.showEmpty();
            } else {
                this.displayQuests(allQuests);
            }
        } catch (error) {
            console.error('[QuestUIManager] Error loading character quests:', error);
            this.showEmpty();
        }
    }

    /**
     * Display quests in the UI
     */
    displayQuests(quests) {
        this.hideLoading();
        this.hideEmpty();

        // NEW: Filter out completed quests so they are not shown
        const activeQuests = Array.isArray(quests) ? quests.filter(q => !q.isCompleted) : [];

        // Clear existing quests
        this.questsList.innerHTML = '';

        if (activeQuests.length === 0) {
            this.showEmpty();
            return;
        }

        // Create quest items
        activeQuests.forEach(quest => {
            const questElement = this.createQuestElement(quest);
            this.questsList.appendChild(questElement);
        });
    }

    /**
     * Create a quest element
     */
    createQuestElement(quest) {
        const questItem = document.createElement('div');
        questItem.className = `quest-item ${quest.isCompleted ? 'completed' : ''} ${quest.type === 'global' ? 'global-quest' : ''}`;
        questItem.dataset.questId = quest.id;

        const progressPercentage = Math.min(quest.progressPercentage, 100);
        const progressWidth = `${progressPercentage}%`;

        questItem.innerHTML = `
            <div class="quest-header">
                <span class="quest-icon">${quest.icon}</span>
                <h4 class="quest-title">${quest.title}</h4>
                ${quest.type === 'global' ? '<span class="global-quest-badge">GLOBAL</span>' : ''}
            </div>
            <p class="quest-description">${quest.description}</p>
            
            ${!quest.isCompleted ? `
                <div class="quest-progress-container">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progressWidth}"></div>
                    </div>
                    <div class="quest-progress-text">
                        <span class="quest-progress-numbers">${this.formatProgress(quest.progress)}/${this.formatProgress(quest.targetValue)}</span>
                        <span class="quest-progress-percentage">${Math.floor(progressPercentage)}%</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="quest-rewards">
                ${quest.rewards.xp ? `<span class="quest-reward xp">+${quest.rewards.xp} XP</span>` : ''}
                ${quest.rewards.talentPoints ? `<span class="quest-reward talent-points">+${quest.rewards.talentPoints} TP</span>` : ''}
                ${quest.rewards.characterChoice ? `<span class="quest-reward character-choice">📦 Character Choice</span>` : ''}
                ${quest.rewards.randomCharacter ? `<span class="quest-reward random-character">🎲 Random Character</span>` : ''}
            </div>
        `;

        return questItem;
    }

    /**
     * Format progress numbers for display
     */
    formatProgress(value) {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    }

    /**
     * Refresh quest display
     */
    refreshQuests() {
        if (this.currentCharacter && this.isVisible) {
            this.loadCharacterQuests(this.currentCharacter);
        }
    }

    /**
     * Show quest panel
     */
    showQuestPanel() {
        if (this.questPanel) {
            this.questPanel.style.display = 'block';
            this.isVisible = true;
            console.log('[QuestUIManager] Quest panel shown');
            
            // Load quests for current character if available
            if (this.currentCharacter) {
                this.loadCharacterQuests(this.currentCharacter);
            } else {
                // Show global quests if no character selected
                this.loadGlobalQuests();
            }
        }
    }

    /**
     * Hide quest panel
     */
    hideQuestPanel() {
        if (this.questPanel) {
            this.questPanel.style.display = 'none';
            this.isVisible = false;
            console.log('[QuestUIManager] Quest panel hidden');
        }
    }

    /**
     * Load global quests only
     */
    async loadGlobalQuests() {
        if (!window.questManager || !window.questManager.initialized) {
            this.showLoading();
            return;
        }

        try {
            const globalQuests = window.questManager.getGlobalQuests();
            
            if (globalQuests.length === 0) {
                this.showEmpty();
            } else {
                this.displayQuests(globalQuests);
            }
        } catch (error) {
            console.error('[QuestUIManager] Error loading global quests:', error);
            this.showEmpty();
        }
    }

    /**
     * Check global quest progress
     */
    async checkGlobalQuestProgress() {
        if (!window.questManager || !window.questManager.initialized) return;

        try {
            await window.questManager.checkGlobalQuestProgress();
        } catch (error) {
            console.error('[QuestUIManager] Error checking global quest progress:', error);
        }
    }

    /**
     * Debug function to complete active character's quest
     */
    async completeActiveCharacterQuest() {
        if (!this.currentCharacter) {
            console.log('❌ No character selected');
            return;
        }

        if (!window.questManager || !window.questManager.initialized) {
            console.log('❌ Quest manager not initialized');
            return;
        }

        try {
            const quests = window.questManager.getCharacterQuests(this.currentCharacter.id);
            const activeQuest = quests.find(q => !q.isCompleted);

            if (!activeQuest) {
                console.log(`❌ No active quests found for ${this.currentCharacter.name}`);
                return;
            }

            console.log(`🎯 Force completing quest: ${activeQuest.title} for ${this.currentCharacter.name}`);
            
            // Force complete the quest
            await window.questManager.forceCompleteQuest(activeQuest.id);
            
            // Refresh the display
            this.refreshQuests();
            
            console.log(`✅ Quest "${activeQuest.title}" completed!`);
        } catch (error) {
            console.error('❌ Error completing quest:', error);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.questsLoading) {
            this.questsLoading.style.display = 'block';
        }
        if (this.questsEmpty) {
            this.questsEmpty.style.display = 'none';
        }
        if (this.questsList) {
            this.questsList.innerHTML = '';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.questsLoading) {
            this.questsLoading.style.display = 'none';
        }
    }

    /**
     * Show empty state
     */
    showEmpty() {
        this.hideLoading();
        if (this.questsEmpty) {
            this.questsEmpty.style.display = 'block';
        }
        if (this.questsList) {
            this.questsList.innerHTML = '';
        }
    }

    /**
     * Hide empty state
     */
    hideEmpty() {
        if (this.questsEmpty) {
            this.questsEmpty.style.display = 'none';
        }
    }

    /**
     * Toggle collapse state
     */
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.questPanel) {
            if (this.isCollapsed) {
                this.questPanel.classList.add('collapsed');
                this.toggleButton.innerHTML = '▲';
            } else {
                this.questPanel.classList.remove('collapsed');
                this.toggleButton.innerHTML = '▼';
            }
        }
    }

    /**
     * Update quest progress in the UI
     */
    updateQuestProgress(questId, progress, targetValue) {
        const questElement = this.questsList.querySelector(`[data-quest-id="${questId}"]`);
        if (!questElement) return;

        const progressPercentage = Math.min((progress / targetValue) * 100, 100);
        const progressWidth = `${progressPercentage}%`;

        const progressFill = questElement.querySelector('.quest-progress-fill');
        const progressNumbers = questElement.querySelector('.quest-progress-numbers');
        const progressPercentageElement = questElement.querySelector('.quest-progress-percentage');

        if (progressFill) {
            progressFill.style.width = progressWidth;
        }

        if (progressNumbers) {
            progressNumbers.textContent = `${this.formatProgress(progress)}/${this.formatProgress(targetValue)}`;
        }

        if (progressPercentageElement) {
            progressPercentageElement.textContent = `${Math.floor(progressPercentage)}%`;
        }
    }

    /**
     * Mark quest as completed in the UI
     */
    markQuestCompleted(questId) {
        const questElement = this.questsList.querySelector(`[data-quest-id="${questId}"]`);
        if (!questElement) return;

        questElement.classList.add('completed');

        // Remove progress container
        const progressContainer = questElement.querySelector('.quest-progress-container');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * Get current character
     */
    getCurrentCharacter() {
        return this.currentCharacter;
    }

    /**
     * Check if quest panel is visible
     */
    isQuestPanelVisible() {
        return this.isVisible;
    }

    /**
     * Debug information
     */
    debugInfo() {
        console.log('=== QUEST UI DEBUG INFO ===');
        console.log('Initialized:', this.initialized);
        console.log('Current Character:', this.currentCharacter?.name || 'None');
        console.log('Panel Visible:', this.isVisible);
        console.log('Quest Manager Available:', !!window.questManager);
        console.log('Quest Manager Initialized:', window.questManager?.initialized);
        
        if (this.currentCharacter && window.questManager) {
            const quests = window.questManager.getCharacterQuests(this.currentCharacter.id);
            console.log('Character Quests:', quests);
        }
        
        console.log('UI Elements:', {
            questPanel: !!this.questPanel,
            toggleButton: !!this.toggleButton,
            questsList: !!this.questsList,
            questsLoading: !!this.questsLoading,
            questsEmpty: !!this.questsEmpty,
            closeButton: !!this.closeButton,
            dragHandle: !!this.dragHandle
        });
        
        return {
            initialized: this.initialized,
            currentCharacter: this.currentCharacter?.name,
            visible: this.isVisible,
            questManagerAvailable: !!window.questManager,
            questManagerInitialized: window.questManager?.initialized
        };
    }
}

// Create global instance
window.questUIManager = new QuestUIManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.questUIManager.initialize();
    });
} else {
    window.questUIManager.initialize();
} 