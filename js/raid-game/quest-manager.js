/**
 * Quest Management System
 * Handles quest loading, progress tracking, and rewards
 */
class QuestManager {
    constructor() {
        this.questRegistry = [];
        this.userQuestProgress = {};
        this.completedQuests = new Set();
        this.initialized = false;
        this.userId = null;
        this.firebaseDatabase = null;
    }

    /**
     * Initialize the quest manager with Firebase
     */
    async initialize() {
        try {
            // Get Firebase instances
            if (typeof firebaseDatabase !== 'undefined') {
                this.firebaseDatabase = firebaseDatabase;
            } else {
                throw new Error('Firebase database not available');
            }

            // Get current user
            if (typeof firebaseAuth !== 'undefined' && firebaseAuth.currentUser) {
                this.userId = firebaseAuth.currentUser.uid;
            } else {
                console.warn('[QuestManager] No authenticated user found');
                return false;
            }

            // Load quest registry
            await this.loadQuestRegistry();
            
            // Load user quest progress
            await this.loadUserQuestProgress();
            
            // Load claimed quests
            await this.loadClaimedQuests();

            this.initialized = true;
            console.log('[QuestManager] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[QuestManager] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Load quest definitions from Firebase database
     */
    async loadQuestRegistry() {
        try {
            // Load available quests from Firebase database
            const questSnapshot = await this.firebaseDatabase.ref(`quests`).once('value');
            
            if (questSnapshot.exists()) {
                const questData = questSnapshot.val();
                this.questRegistry = Object.entries(questData).map(([id, quest]) => ({
                    id,
                    ...quest
                }));
                console.log(`[QuestManager] Loaded ${this.questRegistry.length} quests from database`);
            } else {
                console.log(`[QuestManager] No quests found in database`);
                this.questRegistry = [];
            }
        } catch (error) {
            console.error('[QuestManager] Error loading quest registry from database:', error);
            this.questRegistry = [];
        }
    }

    /**
     * Load user's quest progress from Firebase
     */
    async loadUserQuestProgress() {
        if (!this.userId || !this.firebaseDatabase) {
            console.warn('[QuestManager] Cannot load user quest progress - missing userId or database');
            return;
        }

        try {
            // Load quest progress (stored by progressKey now)
            const progressSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/RAIDQUEST`).once('value');
            if (progressSnapshot.exists()) {
                this.userQuestProgress = progressSnapshot.val() || {};
            }

            // Load completed quests
            const completedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/RAIDQUESTDONE`).once('value');
            if (completedSnapshot.exists()) {
                const completedData = completedSnapshot.val() || {};
                this.completedQuests = new Set(Object.keys(completedData).filter(key => completedData[key] === true));
            }

            console.log(`[QuestManager] Loaded progress for ${Object.keys(this.userQuestProgress).length} metrics`);
            console.log(`[QuestManager] Loaded ${this.completedQuests.size} completed quests`);
        } catch (error) {
            console.error('[QuestManager] Error loading user quest progress:', error);
        }
    }

    /**
     * Get all available quests with progress information
     */
    getAvailableQuests() {
        return this.questRegistry.map(quest => {
            const progress = this.userQuestProgress[quest.id] || 0;
            const isCompleted = this.completedQuests.has(quest.id);
            const progressPercentage = Math.min((progress / quest.target) * 100, 100);

            return {
                ...quest,
                progress,
                isCompleted,
                progressPercentage,
                isAvailable: !isCompleted // Could add more complex logic here
            };
        });
    }

    /**
     * Update quest progress for a specific metric
     */
    async updateQuestProgress(progressKey, increment = 1) {
        if (!this.initialized || !this.userId) {
            console.warn('[QuestManager] Cannot update quest progress - not initialized or no user');
            return;
        }

        try {
            // Find quests that track this progress key
            const relevantQuests = this.questRegistry.filter(quest => 
                quest.progressKey === progressKey && !this.completedQuests.has(quest.id)
            );

            if (relevantQuests.length === 0) {
                return; // No quests track this metric
            }

            const updates = {};
            const newlyCompletedQuests = [];

            for (const quest of relevantQuests) {
                // Get current progress
                const currentProgress = this.userQuestProgress[quest.id] || 0;
                const newProgress = Math.min(currentProgress + increment, quest.target);

                // Update local progress
                this.userQuestProgress[quest.id] = newProgress;
                
                // Prepare Firebase update
                updates[`users/${this.userId}/RAIDQUEST/${quest.id}`] = newProgress;

                // Check if quest is completed
                if (newProgress >= quest.target && !this.completedQuests.has(quest.id)) {
                    newlyCompletedQuests.push(quest);
                    this.completedQuests.add(quest.id);
                    updates[`users/${this.userId}/RAIDQUESTDONE/${quest.id}`] = true;
                }
            }

            // Save to Firebase
            if (Object.keys(updates).length > 0) {
                await this.firebaseDatabase.ref().update(updates);
                console.log(`[QuestManager] Updated quest progress for ${progressKey}:`, updates);
            }

            // Handle newly completed quests
            for (const quest of newlyCompletedQuests) {
                await this.handleQuestCompletion(quest);
            }

        } catch (error) {
            console.error(`[QuestManager] Error updating quest progress for ${progressKey}:`, error);
        }
    }

    /**
     * Handle quest completion rewards
     */
    async handleQuestCompletion(quest) {
        console.log(`[QuestManager] Quest completed: ${quest.name}`);

        try {
            // Award the reward
            const success = await this.awardQuestReward(quest.reward);
            
            if (success) {
                // Show completion notification
                this.showQuestCompletionNotification(quest);
                
                // Dispatch custom event for UI updates
                window.dispatchEvent(new CustomEvent('questCompleted', {
                    detail: { quest, reward: quest.reward }
                }));
            }
        } catch (error) {
            console.error(`[QuestManager] Error handling completion for quest ${quest.id}:`, error);
        }
    }

    /**
     * Award quest reward to the user
     */
    async awardQuestReward(reward) {
        if (!this.userId || !this.firebaseDatabase) {
            console.error('[QuestManager] Cannot award reward - missing userId or database');
            return false;
        }

        try {
            const updates = {};

            switch (reward.type) {
                case 'character':
                    // Add character to owned characters
                    const ownedCharsSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).once('value');
                    let ownedCharacters = [];
                    
                    if (ownedCharsSnapshot.exists()) {
                        const ownedData = ownedCharsSnapshot.val();
                        if (Array.isArray(ownedData)) {
                            ownedCharacters = ownedData;
                        } else if (typeof ownedData === 'object') {
                            ownedCharacters = Object.values(ownedData);
                        }
                    }

                    if (!ownedCharacters.includes(reward.value)) {
                        ownedCharacters.push(reward.value);
                        updates[`users/${this.userId}/ownedCharacters`] = ownedCharacters;
                    }
                    break;

                case 'stage':
                    // Add stage to owned stages
                    const ownedStagesSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedStages`).once('value');
                    let ownedStages = [];
                    
                    if (ownedStagesSnapshot.exists()) {
                        const ownedData = ownedStagesSnapshot.val();
                        if (Array.isArray(ownedData)) {
                            ownedStages = ownedData;
                        } else if (typeof ownedData === 'object') {
                            ownedStages = Object.values(ownedData);
                        }
                    }

                    if (!ownedStages.includes(reward.value)) {
                        ownedStages.push(reward.value);
                        updates[`users/${this.userId}/ownedStages`] = ownedStages;
                    }
                    break;

                case 'story':
                    // Add story to owned stories
                    const ownedStoriesSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedStories`).once('value');
                    let ownedStories = [];
                    
                    if (ownedStoriesSnapshot.exists()) {
                        const ownedData = ownedStoriesSnapshot.val();
                        if (Array.isArray(ownedData)) {
                            ownedStories = ownedData;
                        } else if (typeof ownedData === 'object') {
                            ownedStories = Object.values(ownedData);
                        }
                    }

                    if (!ownedStories.includes(reward.value)) {
                        ownedStories.push(reward.value);
                        updates[`users/${this.userId}/ownedStories`] = ownedStories;
                    }
                    break;

                case 'student_character_choice':
                    // This is handled by the character choice system, not here
                    // The quest completion event will trigger the character selection modal
                    console.log('[QuestManager] Student character choice reward - will be handled by modal system');
                    return true; // Don't block completion

                default:
                    console.warn(`[QuestManager] Unknown reward type: ${reward.type}`);
                    return false;
            }

            // Apply updates to Firebase
            if (Object.keys(updates).length > 0) {
                await this.firebaseDatabase.ref().update(updates);
                console.log(`[QuestManager] Awarded reward ${reward.name}:`, updates);
                return true;
            }

            return true;
        } catch (error) {
            console.error('[QuestManager] Error awarding quest reward:', error);
            return false;
        }
    }

    /**
     * Show quest completion notification
     */
    showQuestCompletionNotification(quest) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'quest-completion-notification';
        notification.innerHTML = `
            <div class="quest-completion-content">
                <div class="quest-completion-icon">${quest.icon}</div>
                <div class="quest-completion-text">
                    <div class="quest-completion-title">Quest Complete!</div>
                    <div class="quest-completion-name">${quest.name}</div>
                    <div class="quest-completion-reward">Reward: ${quest.reward.name}</div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    /**
     * Get quest progress for a specific quest
     */
    getQuestProgress(questId) {
        const quest = this.questRegistry.find(q => q.id === questId);
        if (!quest) return null;

        const progress = this.userQuestProgress[questId] || 0;
        const isCompleted = this.completedQuests.has(questId);
        const progressPercentage = Math.min((progress / quest.target) * 100, 100);

        return {
            quest,
            progress,
            isCompleted,
            progressPercentage
        };
    }

    /**
     * Reset quest progress (for testing)
     */
    async resetQuestProgress(questId) {
        if (!this.userId || !this.firebaseDatabase) return false;

        try {
            const quest = this.questRegistry.find(q => q.id === questId);
            if (!quest) {
                console.error(`[QuestManager] Quest not found: ${questId}`);
                return false;
            }

            const updates = {};
            updates[`users/${this.userId}/RAIDQUEST/${quest.progressKey}`] = null;
            updates[`users/${this.userId}/RAIDQUESTDONE/${questId}`] = null;

            await this.firebaseDatabase.ref().update(updates);
            
            // Update local state
            delete this.userQuestProgress[quest.progressKey];
            this.completedQuests.delete(questId);

            console.log(`[QuestManager] Reset quest ${questId} (${quest.progressKey})`);
            return true;
        } catch (error) {
            console.error(`[QuestManager] Error resetting quest ${questId}:`, error);
            return false;
        }
    }

    /**
     * Get user's quest progress data (mapped by progressKey)
     */
    getUserQuestProgress() {
        if (!this.initialized) {
            console.warn('[QuestManager] Not initialized');
            return {};
        }
        
        // Convert questId-based progress to progressKey-based
        const progressByKey = {};
        for (const quest of this.questRegistry) {
            const questProgress = this.userQuestProgress[quest.id] || 0;
            progressByKey[quest.progressKey] = Math.max(progressByKey[quest.progressKey] || 0, questProgress);
        }
        
        return progressByKey;
    }

    /**
     * Get completed quests set
     */
    getCompletedQuests() {
        if (!this.initialized) {
            console.warn('[QuestManager] Not initialized');
            return new Set();
        }
        return this.completedQuests;
    }

    /**
     * Check if a quest is ready to be claimed (completed but not yet claimed)
     */
    isQuestReadyToClaim(questId) {
        const quest = this.questRegistry.find(q => q.id === questId);
        if (!quest) return false;

        const progress = this.userQuestProgress[questId] || 0;
        const isCompleted = this.completedQuests.has(questId);
        const isClaimed = this.claimedQuests && this.claimedQuests.has(questId);

        return (progress >= quest.target) && !isCompleted && !isClaimed;
    }

    /**
     * Claim a completed quest and award its reward
     */
    async claimQuest(questId) {
        if (!this.userId || !this.firebaseDatabase) {
            console.error('[QuestManager] Cannot claim quest - missing userId or database');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const quest = this.questRegistry.find(q => q.id === questId);
            if (!quest) {
                return { success: false, error: 'Quest not found' };
            }

            // Check if quest is ready to claim
            if (!this.isQuestReadyToClaim(questId)) {
                return { success: false, error: 'Quest not ready to claim' };
            }

            console.log(`[QuestManager] Claiming quest ${questId}: ${quest.name}`);

            // Award the reward
            const rewardAwarded = await this.awardQuestReward(quest.reward);
            if (!rewardAwarded) {
                return { success: false, error: 'Failed to award reward' };
            }

            // Mark quest as completed and claimed
            const updates = {};
            updates[`users/${this.userId}/RAIDQUESTDONE/${questId}`] = true;
            updates[`users/${this.userId}/RAIDQUESTCLAIMED/${questId}`] = Date.now(); // Timestamp when claimed

            await this.firebaseDatabase.ref().update(updates);

            // Update local state
            this.completedQuests.add(questId);
            if (!this.claimedQuests) {
                this.claimedQuests = new Set();
            }
            this.claimedQuests.add(questId);

            // Show claim notification
            this.showQuestClaimNotification(quest);

            // Dispatch claim event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('questClaimed', {
                    detail: { quest, reward: quest.reward }
                }));
            }

            console.log(`[QuestManager] ✅ Successfully claimed quest ${questId}!`);
            return { 
                success: true, 
                quest, 
                reward: quest.reward,
                message: `Claimed: ${quest.reward.name}!`
            };

        } catch (error) {
            console.error(`[QuestManager] Error claiming quest ${questId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Show quest claim notification
     */
    showQuestClaimNotification(quest) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.quest-claim-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'quest-claim-notification';
        notification.innerHTML = `
            <div class="quest-claim-content">
                <div class="quest-claim-icon">🎁</div>
                <div class="quest-claim-text">
                    <div class="quest-claim-title">Reward Claimed!</div>
                    <div class="quest-claim-name">${quest.name}</div>
                    <div class="quest-claim-reward">Received: ${quest.reward.name}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide notification after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, 4000);
    }

    /**
     * Load claimed quests from Firebase
     */
    async loadClaimedQuests() {
        if (!this.userId || !this.firebaseDatabase) return;

        try {
            const snapshot = await this.firebaseDatabase.ref(`users/${this.userId}/RAIDQUESTCLAIMED`).once('value');
            
            this.claimedQuests = new Set();
            
            if (snapshot.exists()) {
                const claimedData = snapshot.val();
                for (const questId in claimedData) {
                    this.claimedQuests.add(questId);
                }
                console.log(`[QuestManager] Loaded ${this.claimedQuests.size} claimed quests`);
            }
        } catch (error) {
            console.error('[QuestManager] Error loading claimed quests:', error);
            this.claimedQuests = new Set();
        }
    }

    /**
     * Get quests that are available to display (not claimed)
     */
    getDisplayableQuests() {
        return this.questRegistry.map(quest => {
            const progress = this.userQuestProgress[quest.id] || 0;
            const isCompleted = this.completedQuests.has(quest.id);
            const isClaimed = this.claimedQuests && this.claimedQuests.has(quest.id);
            const progressPercentage = Math.min((progress / quest.target) * 100, 100);
            const canClaim = (progress >= quest.target) && !isCompleted && !isClaimed;

            return {
                ...quest,
                progress,
                isCompleted,
                isClaimed,
                canClaim,
                progressPercentage,
                isAvailable: !isClaimed // Only show quests that haven't been claimed
            };
        }).filter(quest => quest.isAvailable); // Filter out claimed quests
    }
}

// Create global instance
window.questManager = new QuestManager();

// Auto-initialize when Firebase auth is ready
if (typeof firebaseAuth !== 'undefined') {
    firebaseAuth.onAuthStateChanged(async (user) => {
        if (user && !window.questManager.initialized) {
            await window.questManager.initialize();
        }
    });
} 