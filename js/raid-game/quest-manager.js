/**
 * Quest Management System
 * Handles quest loading, progress tracking, and rewards
 */
class QuestManager {
    constructor() {
        this.initialized = false;
        this.firebaseDatabase = null;
        this.userId = null;
        this.questRegistry = new Map();
        this.userProgress = new Map();
        this.completedQuests = new Set();
        this.globalQuests = new Map();
        this.completedCharacterQuests = new Set();
        this.setupEventListeners();
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

            // Get current user - wait for auth state if needed
            if (typeof firebaseAuth !== 'undefined') {
                // Wait for auth state to be ready
                let attempts = 0;
                const maxAttempts = 10;
                
                while (!firebaseAuth.currentUser && attempts < maxAttempts) {
                    console.log(`[QuestManager] Waiting for auth state... (attempt ${attempts + 1}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (firebaseAuth.currentUser) {
                this.userId = firebaseAuth.currentUser.uid;
            } else {
                    console.warn('[QuestManager] No authenticated user found after waiting');
                    return false;
                }
            } else {
                console.warn('[QuestManager] Firebase auth not available');
                return false;
            }

            // Load quest definitions and user progress
            await this.loadQuestDefinitions();
            await this.loadUserProgress();
            await this.initializeGlobalQuests();

            this.initialized = true;
            
            // Make quest manager globally accessible for debugging
            window.questManager = this;
            
            console.log('[QuestManager] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[QuestManager] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Initialize global quests
     */
    async initializeGlobalQuests() {
        console.log('[QuestManager] Initializing global quests...');
        
        const globalQuest = {
            id: 'complete_5_character_quests',
            type: 'global',
            title: 'Quest Master',
            description: 'Complete 5 character quests',
            target: {
                count: 5
            },
            rewards: {
                characterChoice: true
            },
            icon: '🏆',
            isActive: true,
            createdAt: Date.now()
        };

        // NEW GLOBAL DAMAGE QUEST
        const globalDamageQuest = {
            id: 'global_total_damage_125k',
            type: 'global',
            subType: 'damage_total',
            title: 'World Breaker',
            description: 'Deal 125,000 total damage with any characters',
            target: {
                amount: 125000
            },
            rewards: {
                randomCharacter: true
            },
            icon: '💥',
            isActive: true,
            createdAt: Date.now()
        };

        // NEW GLOBAL STORY COMPLETION QUEST
        const globalStoryQuest = {
            id: 'complete_to_the_hell_we_go_story',
            type: 'global',
            subType: 'story_completion',
            title: 'Hell Conqueror',
            description: 'Complete the "To The Hell We Go" story',
            target: {
                storyId: 'to_the_hell_we_go'
            },
            rewards: {
                randomCharacter: true
            },
            icon: '🔥',
            isActive: true,
            createdAt: Date.now()
        };

        try {
            // Check if global quest already exists
            const existingQuest = await this.firebaseDatabase.ref(`questDefinitions/${globalQuest.id}`).once('value');
            
            if (!existingQuest.exists()) {
                // Save to Firebase
                await this.firebaseDatabase.ref(`questDefinitions/${globalQuest.id}`).set(globalQuest);
                console.log('[QuestManager] Global quest created in Firebase');
            }

            // NEW: Ensure global damage quest exists
            const existingDamageQuest = await this.firebaseDatabase.ref(`questDefinitions/${globalDamageQuest.id}`).once('value');
            if (!existingDamageQuest.exists()) {
                await this.firebaseDatabase.ref(`questDefinitions/${globalDamageQuest.id}`).set(globalDamageQuest);
                console.log('[QuestManager] Global damage quest created in Firebase');
            }

            // NEW: Ensure global story quest exists
            const existingStoryQuest = await this.firebaseDatabase.ref(`questDefinitions/${globalStoryQuest.id}`).once('value');
            if (!existingStoryQuest.exists()) {
                await this.firebaseDatabase.ref(`questDefinitions/${globalStoryQuest.id}`).set(globalStoryQuest);
                console.log('[QuestManager] Global story quest created in Firebase');
            }

            // Add to local registry
            this.globalQuests.set(globalQuest.id, globalQuest);
            this.globalQuests.set(globalDamageQuest.id, globalDamageQuest);
            this.globalQuests.set(globalStoryQuest.id, globalStoryQuest);
            console.log('[QuestManager] Global quests initialized successfully');
        } catch (error) {
            console.error('[QuestManager] Error initializing global quests:', error);
        }
    }

    /**
     * Load quest definitions from Firebase
     */
    async loadQuestDefinitions() {
        if (!this.firebaseDatabase) {
            console.warn('[QuestManager] Cannot load quest definitions - Firebase database not available');
            return;
        }

        try {
            // Load quest definitions from Firebase
            const questSnapshot = await this.firebaseDatabase.ref('questDefinitions').once('value');
            
            if (questSnapshot.exists()) {
                const questData = questSnapshot.val() || {};
                let loadedCount = 0;

                // Store quest definitions in registry
                Object.entries(questData).forEach(([questId, quest]) => {
                    if (quest && quest.id) {
                        if (quest.type === 'global') {
                            this.globalQuests.set(questId, quest);
                        } else {
                            this.questRegistry.set(questId, quest);
                        }
                        loadedCount++;
                    }
                });

                console.log(`[QuestManager] Loaded ${loadedCount} quest definitions from Firebase`);
            } else {
                console.warn('[QuestManager] No quest definitions found in Firebase');
                
                // Initialize with default quests if none exist
                await this.initializeDefaultQuests();
            }
        } catch (error) {
            console.error('[QuestManager] Error loading quest definitions from Firebase:', error);
            
            // Fallback to initializing default quests
            await this.initializeDefaultQuests();
        }
    }

    /**
     * Initialize default quest definitions in Firebase
     */
    async initializeDefaultQuests() {
        console.log('[QuestManager] Initializing default quest definitions...');
        
        const defaultQuests = [
            {
                id: 'ayane_butterfly_dagger_25',
                characterId: 'schoolgirl_ayane',
                title: 'Butterfly Master',
                description: 'Use Butterfly Dagger 25 times',
                type: 'ability_usage',
                target: {
                    abilityId: 'ayane_q',
                    count: 25
                },
                rewards: {
                    xp: 520
                },
                icon: '🦋',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'julia_healing_total',
                characterId: 'schoolgirl_julia',
                title: 'Master Healer',
                description: 'Heal 55,950 HP with your abilities',
                type: 'healing_total',
                target: {
                    amount: 55950
                },
                rewards: {
                    xp: 520
                },
                icon: '🌿',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'kokoro_silencing_ring_damage',
                characterId: 'schoolgirl_kokoro',
                title: 'Silent Striker',
                description: 'Deal 5,000 damage with Silencing Ring DoT',
                type: 'ability_damage',
                target: {
                    abilityId: 'silencing_ring_dot',
                    amount: 5000
                },
                rewards: {
                    xp: 520
                },
                icon: '💍',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'siegfried_total_damage',
                characterId: 'schoolboy_siegfried',
                title: 'Damage Dealer',
                description: 'Deal 85,000 total damage',
                type: 'damage_total',
                target: {
                    amount: 85000
                },
                rewards: {
                    xp: 520
                },
                icon: '⚔️',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'bridget_healing_master',
                characterId: 'bridget',
                title: 'Ability Master',
                description: 'Use any abilities 50 times',
                type: 'ability_usage',
                target: {
                    count: 50
                },
                rewards: {
                    xp: 520
                },
                icon: '✨',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'infernal_ibuki_kunai_master',
                characterId: 'infernal_ibuki',
                title: 'Blade Master',
                description: 'Use Kunai Throw 80 times',
                type: 'ability_usage',
                target: {
                    abilityId: 'kunai_throw',
                    count: 80
                },
                rewards: {
                    xp: 520
                },
                icon: '🥷',
                isActive: true,
                createdAt: Date.now()
            },
            {
                id: 'infernal_ibuki_smoke_specialist',
                characterId: 'infernal_ibuki',
                title: 'Smoke Specialist',
                description: 'Apply Smoke Bomb debuff to enemies 30 times',
                type: 'debuff_applications',
                target: {
                    abilityId: 'smoke_bomb',
                    count: 30
                },
                rewards: {
                    xp: 520
                },
                icon: '💨',
                isActive: true,
                createdAt: Date.now()
            }
        ];

        try {
            // Save each quest to Firebase
            for (const quest of defaultQuests) {
                await this.firebaseDatabase.ref(`questDefinitions/${quest.id}`).set(quest);
                this.questRegistry.set(quest.id, quest);
            }

            console.log(`[QuestManager] Initialized ${defaultQuests.length} default quests in Firebase`);
        } catch (error) {
            console.error('[QuestManager] Error initializing default quests:', error);
        }
    }

    /**
     * Load user's quest progress from Firebase
     */
    async loadUserProgress() {
        if (!this.firebaseDatabase || !this.userId) {
            console.warn('[QuestManager] Cannot load user progress - Firebase or user not available');
            return;
        }

        try {
            // Load quest progress
            const progressSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/questProgress`).once('value');
            if (progressSnapshot.exists()) {
                const progressData = progressSnapshot.val() || {};
                Object.entries(progressData).forEach(([questId, progress]) => {
                    this.userProgress.set(questId, progress);
                });
                console.log(`[QuestManager] Loaded progress for ${Object.keys(progressData).length} quests`);
            }

            // Load completed quests
            const completedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/completedQuests`).once('value');
            if (completedSnapshot.exists()) {
                const completedData = completedSnapshot.val() || {};
                Object.entries(completedData).forEach(([questId, isCompleted]) => {
                    if (isCompleted) {
                        this.completedQuests.add(questId);
                        this.completedCharacterQuests.add(questId);
                    }
                });
                console.log(`[QuestManager] Loaded ${this.completedQuests.size} completed quests`);
            }
        } catch (error) {
            console.error('[QuestManager] Error loading user progress:', error);
        }
    }

    /**
     * Track debuff applications for quest progress
     */
    trackDebuffApplications(character, abilityId, count = 1) {
        if (!this.initialized || !character) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track debuff applications
            if (quest.type === 'debuff_applications' && quest.target.abilityId === abilityId) {
                this.updateQuestProgress(questId, count);
            }
        }
    }

    /**
     * Track ability usage for quest progress
     */
    trackAbilityUsage(character, abilityId, amount = 1) {
        if (!this.initialized || !character) return;

        const characterId = character.id;
        console.log(`[QuestManager] Tracking ability usage - Character: ${character.name} (${characterId}), AbilityId: ${abilityId}, Amount: ${amount}`);
        
        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            if (quest.type === 'ability_usage') {
                // If quest specifies a specific ability, check for match
                if (quest.target.abilityId && quest.target.abilityId === abilityId) {
                    console.log(`[QuestManager] Quest match found! Updating quest: ${questId} (${quest.title})`);
                    this.updateQuestProgress(questId, amount);
                }
                // If quest tracks any ability usage (abilityId is 'any' or undefined)
                else if (!quest.target.abilityId || quest.target.abilityId === 'any') {
                    console.log(`[QuestManager] Generic ability quest match found! Updating quest: ${questId} (${quest.title})`);
                    this.updateQuestProgress(questId, amount);
                }
            }
        }

        // Special tracking for smoke bomb debuff applications
        if (abilityId === 'smoke_bomb') {
            // This will be called from the Smoke Bomb ability when debuffs are applied
            this.trackDebuffApplications(character, 'smoke_bomb', amount);
        }
    }

    /**
     * Track damage dealt for quest progress
     */
    trackDamage(character, damage, abilityId = null) {
        if (!this.initialized || !character || !damage) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track total damage
            if (quest.type === 'damage_total') {
                this.updateQuestProgress(questId, damage);
            }

            // Track specific ability damage
            if (quest.type === 'ability_damage' && abilityId && quest.target.abilityId === abilityId) {
                this.updateQuestProgress(questId, damage);
            }
        }

        // NEW: Track global damage quests (any character)
        for (const [questId, quest] of this.globalQuests) {
            if (this.completedQuests.has(questId)) continue;
            if ((quest.subType && quest.subType === 'damage_total') || quest.type === 'global_damage_total') {
                this.updateQuestProgress(questId, damage);
            }
        }
    }

    /**
     * Track damage taken for quest progress
     */
    trackDamageTaken(character, damage, damageType = null) {
        if (!this.initialized || !character || !damage) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track magical damage taken
            if (quest.type === 'damage_taken_magical' && damageType === 'magical') {
                this.updateQuestProgress(questId, damage);
            }
        }
    }

    /**
     * Track dodges for quest progress
     */
    trackDodge(character) {
        if (!this.initialized || !character) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track dodge count
            if (quest.type === 'dodge_count') {
                this.updateQuestProgress(questId, 1);
            }
        }
    }

    /**
     * Track healing done for quest progress
     */
    trackHealing(character, healing, abilityId = null) {
        if (!this.initialized || !character || !healing) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track total healing
            if (quest.type === 'healing_total') {
                this.updateQuestProgress(questId, healing);
            }

            // Track specific ability healing
            if (quest.type === 'ability_healing' && abilityId && quest.target.abilityId === abilityId) {
                this.updateQuestProgress(questId, healing);
            }
        }
    }

    /**
     * Track critical strikes for quest progress
     */
    trackCriticalStrike(character, abilityId = null) {
        if (!this.initialized || !character) return;

        const characterId = character.id;

        // Check for relevant quests
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId !== characterId || this.completedQuests.has(questId)) continue;

            // Track critical strikes
            if (quest.type === 'critical_strikes') {
                this.updateQuestProgress(questId, 1);
            }
        }
    }

    /**
     * Track story completion for quest progress
     */
    trackStoryCompletion(storyId) {
        if (!this.initialized || !storyId) return;

        console.log(`[QuestManager] Story completed: ${storyId}`);

        // Check for relevant global quests
        for (const [questId, quest] of this.globalQuests) {
            if (this.completedQuests.has(questId)) continue;

            // Track story completion
            if (quest.subType === 'story_completion' && quest.target.storyId === storyId) {
                console.log(`[QuestManager] Story completion quest matched: ${questId}`);
                this.updateQuestProgress(questId, 1);
            }
        }
    }

    /**
     * Update quest progress and check for completion
     */
    updateQuestProgress(questId, amount) {
        const quest = this.questRegistry.get(questId) || this.globalQuests.get(questId);
        if (!quest || this.completedQuests.has(questId)) return;

        // Get current progress
        let currentProgress = this.userProgress.get(questId) || 0;
        let newProgress = currentProgress + amount;

        // Determine target value
        let targetValue = quest.target.count || quest.target.amount;

        // Cap progress at target
        newProgress = Math.min(newProgress, targetValue);

        // Update progress
        this.userProgress.set(questId, newProgress);

        // Save to Firebase
        this.saveProgressToFirebase(questId, newProgress);

        // Check for completion
        if (newProgress >= targetValue && !this.completedQuests.has(questId)) {
            this.completeQuest(questId);
        }

        // Update UI
        this.updateQuestUI(questId, newProgress, targetValue);

        console.log(`[QuestManager] Updated quest ${questId}: ${newProgress}/${targetValue}`);
    }

    /**
     * Complete a quest and award rewards
     */
    async completeQuest(questId) {
        const quest = this.questRegistry.get(questId) || this.globalQuests.get(questId);
        if (!quest || this.completedQuests.has(questId)) return;

        // Mark as completed
        this.completedQuests.add(questId);

        // Save completion to Firebase
        await this.saveCompletionToFirebase(questId);

        // Award rewards
        await this.awardQuestRewards(quest);

        // Show completion notification
        this.showQuestCompletionNotification(quest);
        
        // Trigger completion event
        const event = new CustomEvent('questCompleted', {
            detail: { questId, quest }
        });
        document.dispatchEvent(event);

        // Update via UI manager if available
        if (window.questUIManager && window.questUIManager.initialized) {
            window.questUIManager.markQuestCompleted(questId);
        }

        console.log(`[QuestManager] Quest completed: ${quest.title}`);
    }

    /**
     * Award quest rewards
     */
    async awardQuestRewards(quest) {
        if (!quest.rewards) return;

        try {
            // Award XP if character XP manager is available
            if (quest.rewards.xp && window.characterXPManager && window.characterXPManager.initialized) {
                const result = await window.characterXPManager.addExperienceAndSave(quest.characterId, quest.rewards.xp);
                if (result) {
                    console.log(`[QuestManager] Successfully awarded ${quest.rewards.xp} XP to ${quest.characterId}`);
                    if (result.leveledUp) {
                        console.log(`[QuestManager] 🎉 ${quest.characterId} leveled up! ${result.oldLevel} → ${result.newLevel}`);
                    }
                    
                    // Update the character's XP in the game if they're currently loaded
                    this.updateCharacterXPInGame(quest.characterId, result);
                } else {
                    console.error(`[QuestManager] Failed to award XP to ${quest.characterId}`);
                }
            } else {
                console.warn(`[QuestManager] Cannot award XP - characterXPManager not available or not initialized`);
                console.log(`[QuestManager] characterXPManager available:`, !!window.characterXPManager);
                console.log(`[QuestManager] characterXPManager initialized:`, window.characterXPManager?.initialized);
            }

            // Award talent points if talent manager is available
            if (quest.rewards.talentPoints && window.talentManager) {
                await window.talentManager.addTalentPoints(quest.characterId, quest.rewards.talentPoints);
            }

            // NEW: Random character reward
            if (quest.rewards.randomCharacter) {
                const unownedCharacters = await this.getUnownedCharacters();
                if (unownedCharacters.length > 0) {
                    const randomCharId = unownedCharacters[Math.floor(Math.random() * unownedCharacters.length)];
                    const granted = await this.grantCharacterReward(randomCharId);
                    if (granted) {
                        this.showNotification(`🎉 You received ${this.getCharacterDisplayName(randomCharId)}!`);
                    }
                } else {
                    console.log('[QuestManager] Player already owns all characters, skipping random reward');
                }
            }

            console.log(`[QuestManager] Awarded rewards for quest ${quest.id}:`, quest.rewards);
        } catch (error) {
            console.error('[QuestManager] Error awarding quest rewards:', error);
        }
    }

    /**
     * Save quest progress to Firebase
     */
    async saveProgressToFirebase(questId, progress) {
        if (!this.userId || !this.firebaseDatabase) return;

        try {
            await this.firebaseDatabase.ref(`users/${this.userId}/questProgress/${questId}`).set(progress);
        } catch (error) {
            console.error('[QuestManager] Error saving progress to Firebase:', error);
        }
    }

    /**
     * Save quest completion to Firebase
     */
    async saveCompletionToFirebase(questId) {
        if (!this.userId || !this.firebaseDatabase) return;

        try {
            await this.firebaseDatabase.ref(`users/${this.userId}/completedQuests/${questId}`).set(true);
        } catch (error) {
            console.error('[QuestManager] Error saving completion to Firebase:', error);
        }
    }

    /**
     * Get character quests for a specific character ID
     */
    getCharacterQuests(characterId) {
        const characterQuests = [];
        
        for (const [questId, quest] of this.questRegistry) {
            if (quest.characterId === characterId && quest.isActive) {
                const progress = this.userProgress.get(questId) || 0;
                const isCompleted = this.completedQuests.has(questId);
                
                characterQuests.push({
                    ...quest,
                    progress: progress,
                    progressPercentage: this.calculateProgressPercentage(quest, progress),
                    targetValue: this.getQuestTargetValue(quest),
                    isCompleted: isCompleted
                });
            }
        }
        
        return characterQuests;
    }

    /**
     * Get global quests
     */
    getGlobalQuests() {
        const globalQuests = [];
        
        for (const [questId, quest] of this.globalQuests) {
            if (quest.isActive) {
                const progress = this.getGlobalQuestProgress(questId);
                const isCompleted = this.completedQuests.has(questId);
                
                globalQuests.push({
                    ...quest,
                    progress: progress,
                    progressPercentage: this.calculateProgressPercentage(quest, progress),
                    targetValue: this.getQuestTargetValue(quest),
                    isCompleted: isCompleted
                });
            }
        }
        
        return globalQuests;
    }

    /**
     * Get global quest progress
     */
    getGlobalQuestProgress(questId) {
        if (questId === 'complete_5_character_quests') {
            return this.completedCharacterQuests.size;
        }
        // For story completion and other global quests, use stored progress map
        return this.userProgress.get(questId) || 0;
    }

    /**
     * Check global quest progress
     */
    async checkGlobalQuestProgress() {
        try {
            // Count completed character quests
            let completedCount = 0;
            
            for (const [questId, quest] of this.questRegistry) {
                if (this.completedQuests.has(questId)) {
                    completedCount++;
                    this.completedCharacterQuests.add(questId);
                }
            }

            const globalQuestId = 'complete_5_character_quests';
            
            // Check if global quest should be completed
            if (completedCount >= 5 && !this.completedQuests.has(globalQuestId)) {
                console.log('[QuestManager] Global quest completed!');
                
                // Mark as completed
                this.completedQuests.add(globalQuestId);
                
                // Save to Firebase
                await this.firebaseDatabase.ref(`users/${this.userId}/completedQuests/${globalQuestId}`).set(true);
                
                // Show character choice reward
                await this.showCharacterChoiceReward(globalQuestId);
                
                // Trigger completion event
                const event = new CustomEvent('questCompleted', {
                    detail: { 
                        questId: globalQuestId,
                        quest: this.globalQuests.get(globalQuestId)
                    }
                });
                document.dispatchEvent(event);
            }
        } catch (error) {
            console.error('[QuestManager] Error checking global quest progress:', error);
        }
    }

    /**
     * Show character choice reward
     */
    async showCharacterChoiceReward(questId) {
        try {
            console.log('[QuestManager] 🎁 Showing character choice reward...');
            
            // Get unowned characters
            const unownedCharacters = await this.getUnownedCharacters();
            
            if (unownedCharacters.length < 3) {
                console.warn('[QuestManager] Not enough unowned characters for choice reward');
                return;
            }

            // Select 3 random unowned characters
            const shuffled = unownedCharacters.sort(() => 0.5 - Math.random());
            const choiceCharacters = shuffled.slice(0, 3);

            // Create character choice modal
            this.createCharacterChoiceModal(questId, choiceCharacters);
            
        } catch (error) {
            console.error('[QuestManager] Error showing character choice reward:', error);
        }
    }

    /**
     * Get unowned characters from both Firebase folders
     */
    async getUnownedCharacters() {
        try {
            console.log('[QuestManager] 🔍 Checking character ownership...');
            
            const ownedCharacters = new Set();
            
            // Add default/free characters that everyone gets
            const defaultCharacters = ['schoolboy_shoma', 'farmer_cham_cham', 'renée'];
            defaultCharacters.forEach(charId => {
                ownedCharacters.add(charId);
            });
            console.log('[QuestManager] Added default/free characters to owned list:', defaultCharacters);
            
            // Check UnlockedRAIDCharacters folder
            const unlockedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/UnlockedRAIDCharacters`).once('value');
            if (unlockedSnapshot.exists()) {
                const unlockedData = unlockedSnapshot.val();
                Object.keys(unlockedData).forEach(charId => {
                    // UnlockedRAIDCharacters stores objects with metadata, not just booleans
                    // If the key exists, the character is owned regardless of the value
                    ownedCharacters.add(charId);
                });
                console.log('[QuestManager] Found characters in UnlockedRAIDCharacters:', Object.keys(unlockedData));
            }

            // Check ownedCharacters folder
            const ownedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).once('value');
            if (ownedSnapshot.exists()) {
                const ownedData = ownedSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedData.forEach(charId => ownedCharacters.add(charId));
                } else if (typeof ownedData === 'object') {
                    Object.entries(ownedData).forEach(([key, value]) => {
                        if (typeof value === 'string') {
                            ownedCharacters.add(value);
                        } else if (value === true) {
                            ownedCharacters.add(key);
                        }
                    });
                }
                console.log('[QuestManager] Found characters in ownedCharacters:', ownedData);
            }

            console.log('[QuestManager] Total owned characters:', Array.from(ownedCharacters));

            // Rewardable characters (exclude globally unlocked and unobtainable ones)
            const allRewardCharacters = [
                'schoolgirl_julia', 'schoolgirl_kokoro', 'schoolgirl_ayane', 'schoolgirl_elphelt',
                'schoolboy_siegfried', 'farmer_nina', 'farmer_alice', 'farmer_shoma', 'farmer_raiden',
                'bridget', 'zoey', 'atlantean_christie', 'atlantean_kotal_kahn', 'atlantean_kagome', 
                'atlantean_sub_zero_playable', 'infernal_ibuki'
            ];

            // Filter out owned characters
            const unownedCharacters = allRewardCharacters.filter(charId => !ownedCharacters.has(charId));
            
            console.log('[QuestManager] Unowned characters available for reward:', unownedCharacters);
            
            return unownedCharacters;
        } catch (error) {
            console.error('[QuestManager] Error getting unowned characters:', error);
            return [];
        }
    }

    /**
     * Create character choice modal
     */
    createCharacterChoiceModal(questId, characters) {
        // Remove existing modal if any
        const existingModal = document.getElementById('character-choice-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'character-choice-modal';
        modal.className = 'character-choice-modal';
        modal.innerHTML = `
            <div class="character-choice-content">
                <h3>🎁 Quest Reward: Choose Your Character!</h3>
                <p>You've completed 5 character quests! Choose one of these characters as your reward:</p>
                <div class="character-choice-options">
                    ${characters.map(charId => `
                        <div class="character-choice-option" data-character-id="${charId}">
                            <img src="images/characters/${charId}.png" alt="${this.getCharacterDisplayName(charId)}" 
                                 onerror="this.src='images/characters/placeholder.png'">
                            <h4>${this.getCharacterDisplayName(charId)}</h4>
                            <button class="choose-character-btn" data-character-id="${charId}">Choose</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('choose-character-btn')) {
                const characterId = e.target.dataset.characterId;
                this.awardCharacter(questId, characterId);
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Get character display name
     */
    getCharacterDisplayName(characterId) {
        const displayNames = {
            'schoolgirl_julia': 'Schoolgirl Julia',
            'schoolgirl_kokoro': 'Schoolgirl Kokoro',
            'schoolgirl_ayane': 'Schoolgirl Ayane',
            'schoolgirl_elphelt': 'Schoolgirl Elphelt',
            'schoolboy_siegfried': 'Schoolboy Siegfried',
            'farmer_nina': 'Farmer Nina',
            'farmer_alice': 'Farmer Alice',
            'farmer_shoma': 'Farmer Shoma',
            'farmer_raiden': 'Farmer Raiden',
            'farmer_cham_cham': 'Farmer Cham Cham',
            'bridget': 'Bridget',
            'renée': 'Renée',
            'zoey': 'Zoey'
        };
        return displayNames[characterId] || characterId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Award character to player
     */
    async awardCharacter(questId, characterId) {
        try {
            console.log(`[QuestManager] 🎁 Awarding character: ${characterId}`);
            
            // Add to ownedCharacters
            const ownedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).once('value');
            let ownedCharacters = [];
            
            if (ownedSnapshot.exists()) {
                const ownedData = ownedSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedCharacters = ownedData;
                } else if (typeof ownedData === 'object') {
                    ownedCharacters = Object.keys(ownedData).filter(key => ownedData[key] === true);
                }
            }
            
            if (!ownedCharacters.includes(characterId)) {
                ownedCharacters.push(characterId);
                await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).set(ownedCharacters);
            }

            // Also add to UnlockedRAIDCharacters for compatibility
            await this.firebaseDatabase.ref(`users/${this.userId}/UnlockedRAIDCharacters/${characterId}`).set(true);
            
            console.log(`[QuestManager] ✅ Character ${characterId} awarded successfully!`);
            
            // Show success notification
            this.showNotification(`🎉 You received ${this.getCharacterDisplayName(characterId)}!`);
            
        } catch (error) {
            console.error('[QuestManager] Error awarding character:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'quest-notification';
        notification.innerHTML = `
            <div class="quest-notification-content">
                <h3>${message}</h3>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Force complete a quest (debug function)
     */
    async forceCompleteQuest(questId) {
        try {
            console.log(`[QuestManager] 🎯 Force completing quest: ${questId}`);
            
            // Get quest definition
            const quest = this.questRegistry.get(questId) || this.globalQuests.get(questId);
            if (!quest) {
                throw new Error(`Quest ${questId} not found`);
            }

            // Set progress to target value
            const targetValue = this.getQuestTargetValue(quest);
            this.userProgress.set(questId, targetValue);
            
            // Mark as completed
            this.completedQuests.add(questId);

            // Award rewards
            await this.awardQuestRewards(quest);

            // Save to Firebase
            const updates = {};
            updates[`users/${this.userId}/questProgress/${questId}`] = targetValue;
            updates[`users/${this.userId}/completedQuests/${questId}`] = true;
            
            await this.firebaseDatabase.ref().update(updates);

            // Handle global quest progress for character quests
            if (quest.characterId && quest.characterId !== 'global') {
                this.completedCharacterQuests.add(questId);
                this.updateGlobalQuestProgress();
            }

            // Show completion notification
            this.showQuestCompletionNotification(quest);

            // Trigger completion event
            const event = new CustomEvent('questCompleted', {
                detail: { questId, quest }
            });
            document.dispatchEvent(event);

            console.log(`[QuestManager] ✅ Quest ${questId} force completed successfully`);
            
            return true;
        } catch (error) {
            console.error('[QuestManager] Error force completing quest:', error);
            throw error;
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
                    <h3>Quest Completed!</h3>
                    <p>${quest.title}</p>
                    <div class="quest-rewards">
                        ${quest.rewards.xp ? `<span class="reward-xp">+${quest.rewards.xp} XP</span>` : ''}
                        ${quest.rewards.randomCharacter ? `<span class="reward-random-character">🎲 Random Character</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
        }, 5000);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Update quest UI
     */
    updateQuestUI(questId, progress, targetValue) {
        // Trigger UI update event
        const event = new CustomEvent('questProgressUpdated', {
            detail: { questId, progress, targetValue }
        });
        document.dispatchEvent(event);

        // Update via UI manager if available
        if (window.questUIManager && window.questUIManager.initialized) {
            window.questUIManager.updateQuestProgress(questId, progress, targetValue);
        }
    }

    /**
     * Setup event listeners for statistics tracking
     */
    setupEventListeners() {
        // Listen for ability usage
        document.addEventListener('AbilityUsed', (event) => {
            const { caster, ability } = event.detail || {};
            if (!caster || !ability) return;
            const abilityId = ability.id || ability.abilityId || ability.name || null;
            if (abilityId) {
                console.log(`[QuestManager] AbilityUsed event - Character: ${caster.name}, AbilityId: ${abilityId}`);
                this.trackAbilityUsage(caster, abilityId);
            }
        });

        document.addEventListener('abilityUsed', (event) => {
            const { character, abilityId } = event.detail;
            console.log(`[QuestManager] abilityUsed event - Character: ${character?.name}, AbilityId: ${abilityId}`);
            this.trackAbilityUsage(character, abilityId);
        });

        // Listen for damage dealt
        document.addEventListener('damageDealt', (event) => {
            const { character, damage, abilityId } = event.detail;
            this.trackDamage(character, damage, abilityId);
        });

        // Listen for damage taken
        document.addEventListener('damageTaken', (event) => {
            const { character, damage, damageType } = event.detail;
            this.trackDamageTaken(character, damage, damageType);
        });

        // Listen for dodges
        document.addEventListener('dodge', (event) => {
            const { character } = event.detail;
            this.trackDodge(character);
        });

        // Listen for healing done
        document.addEventListener('healingDone', (event) => {
            const { character, healing, abilityId } = event.detail;
            this.trackHealing(character, healing, abilityId);
        });

        // Listen for critical strikes
        document.addEventListener('criticalStrike', (event) => {
            const { character, abilityId } = event.detail;
            this.trackCriticalStrike(character, abilityId);
        });

        // Listen for story completion
        document.addEventListener('storyCompleted', (event) => {
            const { storyId } = event.detail;
            this.trackStoryCompletion(storyId);
        });
    }

    /**
     * Admin function to add quest to Firebase
     */
    async adminAddQuest(questData) {
        if (!this.firebaseDatabase) {
            console.error('[QuestManager] Firebase not available for admin operations');
            return false;
        }

        try {
            // Add metadata if not present
            const questToSave = {
                ...questData,
                isActive: questData.isActive !== undefined ? questData.isActive : true,
                createdAt: questData.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            await this.firebaseDatabase.ref(`questDefinitions/${questData.id}`).set(questToSave);
            
            // Update local registry
            this.questRegistry.set(questData.id, questToSave);
            
            console.log(`[QuestManager] Admin added quest: ${questData.id}`);
            return true;
        } catch (error) {
            console.error('[QuestManager] Admin quest addition failed:', error);
            return false;
        }
    }

    /**
     * Admin function to update quest in Firebase
     */
    async adminUpdateQuest(questId, updates) {
        if (!this.firebaseDatabase) {
            console.error('[QuestManager] Firebase not available for admin operations');
            return false;
        }

        try {
            const currentQuest = this.questRegistry.get(questId);
            if (!currentQuest) {
                console.error(`[QuestManager] Quest ${questId} not found`);
                return false;
            }

            const updatedQuest = {
                ...currentQuest,
                ...updates,
                updatedAt: Date.now()
            };

            await this.firebaseDatabase.ref(`questDefinitions/${questId}`).set(updatedQuest);
            
            // Update local registry
            this.questRegistry.set(questId, updatedQuest);
            
            console.log(`[QuestManager] Admin updated quest: ${questId}`);
            return true;
        } catch (error) {
            console.error('[QuestManager] Admin quest update failed:', error);
            return false;
        }
    }

    /**
     * Admin function to activate/deactivate quest
     */
    async adminToggleQuest(questId, isActive) {
        return await this.adminUpdateQuest(questId, { isActive });
    }

    /**
     * Admin function to delete quest from Firebase
     */
    async adminDeleteQuest(questId) {
        if (!this.firebaseDatabase) {
            console.error('[QuestManager] Firebase not available for admin operations');
            return false;
        }

        try {
            await this.firebaseDatabase.ref(`questDefinitions/${questId}`).remove();
            
            // Remove from local registry
            this.questRegistry.delete(questId);
            
            console.log(`[QuestManager] Admin deleted quest: ${questId}`);
            return true;
        } catch (error) {
            console.error('[QuestManager] Admin quest deletion failed:', error);
            return false;
        }
    }

    /**
     * Admin function to get all quests
     */
    adminGetAllQuests() {
        const allQuests = [];
        for (const [questId, quest] of this.questRegistry) {
            allQuests.push({
                id: questId,
                ...quest
            });
        }
        return allQuests;
    }

    /**
     * Admin function to reload quest definitions from Firebase
     */
    async adminReloadQuests() {
        try {
            this.questRegistry.clear();
            await this.loadQuestDefinitions();
            console.log('[QuestManager] Admin reloaded quest definitions');
            return true;
        } catch (error) {
            console.error('[QuestManager] Admin quest reload failed:', error);
            return false;
        }
    }

    /**
     * Admin function to reset user's quest progress
     */
    async adminResetUserProgress(userId, questId = null) {
        if (!this.firebaseDatabase) {
            console.error('[QuestManager] Firebase not available for admin operations');
            return false;
        }

        try {
            if (questId) {
                // Reset specific quest
                await this.firebaseDatabase.ref(`users/${userId}/questProgress/${questId}`).remove();
                await this.firebaseDatabase.ref(`users/${userId}/completedQuests/${questId}`).remove();
            } else {
                // Reset all quests
                await this.firebaseDatabase.ref(`users/${userId}/questProgress`).remove();
                await this.firebaseDatabase.ref(`users/${userId}/completedQuests`).remove();
            }
            console.log(`[QuestManager] Admin reset quest progress for user ${userId}`);
            return true;
        } catch (error) {
            console.error('[QuestManager] Admin reset failed:', error);
            return false;
        }
    }

    /**
     * Get quest target value
     */
    getQuestTargetValue(quest) {
        return quest.target.count || quest.target.amount || 1;
    }

    /**
     * Calculate progress percentage
     */
    calculateProgressPercentage(quest, progress) {
        const targetValue = this.getQuestTargetValue(quest);
        return Math.min((progress / targetValue) * 100, 100);
    }

    /**
     * Get user's owned characters from Firebase
     */
    async getUserOwnedCharacters() {
        if (!this.firebaseDatabase || !this.userId) {
            console.warn('[QuestManager] Cannot get owned characters - Firebase or user not available');
            return [];
        }

        try {
            const ownedCharacters = new Set();

            // Add default/free characters that everyone gets
            const defaultCharacters = ['schoolboy_shoma', 'farmer_cham_cham', 'renée'];
            defaultCharacters.forEach(charId => {
                ownedCharacters.add(charId);
            });
            console.log('[QuestManager] Added default/free characters to owned list:', defaultCharacters);

            // Check UnlockedRAIDCharacters folder (keys are character IDs)
            const unlockedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/UnlockedRAIDCharacters`).once('value');
            if (unlockedSnapshot.exists()) {
                const unlockedData = unlockedSnapshot.val();
                Object.keys(unlockedData).forEach(characterId => {
                    ownedCharacters.add(characterId);
                });
                console.log('[QuestManager] Found UnlockedRAIDCharacters:', Object.keys(unlockedData));
            }

            // Check ownedCharacters folder (array of character IDs)
            const ownedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).once('value');
            if (ownedSnapshot.exists()) {
                const ownedData = ownedSnapshot.val();
                if (Array.isArray(ownedData)) {
                    ownedData.forEach(characterId => ownedCharacters.add(characterId));
                } else if (typeof ownedData === 'object') {
                    Object.entries(ownedData).forEach(([key, value]) => {
                        if (typeof value === 'string') {
                            ownedCharacters.add(value);
                        } else if (value === true) {
                            ownedCharacters.add(key);
                        }
                    });
                }
                console.log('[QuestManager] Found characters in ownedCharacters:', ownedData);
            }

            const result = Array.from(ownedCharacters);
            console.log('[QuestManager] Total owned characters:', result);
            return result;

        } catch (error) {
            console.error('[QuestManager] Error getting owned characters:', error);
            return [];
        }
    }

    /**
     * Get available characters for reward selection
     */
    async getAvailableCharactersForReward() {
        try {
            // Candidate characters for modal choice (exclude globally unlocked and unobtainable ones)
            const allCharacters = [
                'schoolgirl_ayane', 'schoolgirl_julia', 'schoolgirl_kokoro', 'schoolboy_siegfried',
                'zoey', 'farmer_raiden', 'schoolgirl_elphelt',
                'farmer_alice', 'farmer_shoma', 'bridget', 'farmer_nina'
            ];

            // Get user's owned characters
            const ownedCharacters = await this.getUserOwnedCharacters();
            console.log('[QuestManager] User owned characters:', ownedCharacters);

            // Filter out owned characters
            const availableCharacters = allCharacters.filter(character => 
                !ownedCharacters.includes(character)
            );

            console.log('[QuestManager] Available characters for reward:', availableCharacters);
            
            // Randomly select 3 characters (or all if less than 3)
            const shuffled = availableCharacters.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Math.min(3, availableCharacters.length));
            
            console.log('[QuestManager] Selected characters for choice:', selected);
            return selected;

        } catch (error) {
            console.error('[QuestManager] Error getting available characters:', error);
            return ['schoolgirl_ayane', 'schoolgirl_julia', 'schoolgirl_kokoro']; // Fallback
        }
    }

    /**
     * Show character choice modal
     */
    async showCharacterChoiceModal() {
        const availableCharacters = await this.getAvailableCharactersForReward();
        
        if (availableCharacters.length === 0) {
            alert('You already own all available characters!');
            return;
        }

        return new Promise((resolve) => {
            // Create modal HTML
            const modalHTML = `
                <div class="character-choice-modal-overlay">
                    <div class="character-choice-modal">
                        <div class="character-choice-header">
                            <h2>🎁 Choose Your Character Reward!</h2>
                            <p>Select one character to unlock:</p>
                        </div>
                        <div class="character-choice-options">
                            ${availableCharacters.map(characterId => {
                                const displayName = this.getCharacterDisplayName(characterId);
                                const imagePath = `images/characters/${characterId.replace('_', '_')}.png`;
                                return `
                                    <div class="character-choice-option" data-character="${characterId}">
                                        <div class="character-image-container">
                                            <img src="${imagePath}" 
                                                 alt="${displayName}" 
                                                 onerror="this.src='images/characters/placeholder.png'"
                                                 class="character-reward-image">
                                        </div>
                                        <h3>${displayName}</h3>
                                        <button class="select-character-btn" data-character="${characterId}">
                                            Select
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="character-choice-footer">
                            <button class="close-choice-modal">Maybe Later</button>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = document.querySelector('.character-choice-modal-overlay');

            // Add event listeners
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('character-choice-modal-overlay') || 
                    e.target.classList.contains('close-choice-modal')) {
                    modal.remove();
                    resolve(null);
                }
                
                if (e.target.classList.contains('select-character-btn')) {
                    const selectedCharacter = e.target.dataset.character;
                    modal.remove();
                    resolve(selectedCharacter);
                }
            });
        });
    }

    /**
     * Debug function to check character XP
     * Call this from console: window.questManager.debugCheckCharacterXP("zoey")
     */
    async debugCheckCharacterXP(characterId) {
        if (!characterId) {
            console.log('[QuestManager] Please provide a character ID. Example: window.questManager.debugCheckCharacterXP("zoey")');
            return;
        }
        
        try {
            if (window.characterXPManager && window.characterXPManager.initialized) {
                const xpData = await window.characterXPManager.getCharacterXP(characterId);
                if (xpData) {
                    console.log(`[QuestManager] 📊 ${characterId} XP Status:`);
                    console.log(`  Level: ${xpData.level}`);
                    console.log(`  Total XP: ${xpData.totalXP}`);
                    console.log(`  Current Level Progress: ${xpData.currentXP} / ${xpData.xpForNextLevel} XP`);
                    console.log(`  Progress: ${Math.floor((xpData.currentXP / xpData.xpForNextLevel) * 100)}%`);
                    return xpData;
                } else {
                    console.log(`[QuestManager] No XP data found for ${characterId}`);
                }
            } else {
                console.log('[QuestManager] CharacterXPManager not available');
            }
        } catch (error) {
            console.error('[QuestManager] Error checking character XP:', error);
        }
    }

    /**
     * Debug function to complete active character's quest
     * Call this from console: window.questManager.debugCompleteActiveQuest()
     */
    debugCompleteActiveQuest() {
        try {
            const currentCharacter = window.gameManager?.selectedCharacter;
            if (!currentCharacter || !currentCharacter.id) {
                console.error('[Debug] No active character selected');
                return false;
            }

            const characterId = currentCharacter.id;
            console.log(`[Debug] Attempting to complete quest for character: ${characterId}`);

            // Find active quest for this character
            for (const [questId, quest] of this.questRegistry) {
                if (quest.characterId === characterId && !this.completedQuests.has(questId)) {
                    console.log(`[Debug] Found active quest: ${questId}`, quest);
                    
                    // Set progress to target value
                    const targetValue = this.getQuestTargetValue(quest);
                    this.userProgress.set(questId, targetValue);
                    
                    // Complete the quest
                    this.checkQuestCompletion(questId, quest);
                    
                    console.log(`[Debug] Quest ${questId} completed!`);
                    return true;
                }
            }

            console.warn(`[Debug] No active quest found for character: ${characterId}`);
            return false;

        } catch (error) {
            console.error('[Debug] Error completing quest:', error);
            return false;
        }
    }

    /**
     * Grant character reward to user
     */
    async grantCharacterReward(characterId) {
        if (!this.firebaseDatabase || !this.userId) {
            console.warn('[QuestManager] Cannot grant character - Firebase or user not available');
            return false;
        }

        try {
            // Add character to UnlockedRAIDCharacters
            await this.firebaseDatabase.ref(`users/${this.userId}/UnlockedRAIDCharacters/${characterId}`).set({
                source: 'quest_reward',
                unlockedAt: Date.now()
            });

            // Also add to ownedCharacters array if it doesn't exist
            const ownedSnapshot = await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).once('value');
            let ownedCharacters = [];
            
            if (ownedSnapshot.exists() && Array.isArray(ownedSnapshot.val())) {
                ownedCharacters = ownedSnapshot.val();
            }
            
            if (!ownedCharacters.includes(characterId)) {
                ownedCharacters.push(characterId);
                await this.firebaseDatabase.ref(`users/${this.userId}/ownedCharacters`).set(ownedCharacters);
            }

            console.log(`[QuestManager] Successfully granted character: ${characterId}`);
            return true;

        } catch (error) {
            console.error('[QuestManager] Error granting character reward:', error);
            return false;
        }
    }

    /**
     * Show reward notification
     */
    showRewardNotification(message) {
        // Create and show a temporary notification
        const notification = document.createElement('div');
        notification.className = 'quest-reward-notification';
        notification.innerHTML = `
            <div class="reward-notification-content">
                <h3>${message}</h3>
                <div class="reward-sparkles">✨ ⭐ ✨</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    /**
     * Check and handle quest completion
     */
    async checkQuestCompletion(questId, quest) {
        if (this.completedQuests.has(questId)) {
            return; // Already completed
        }

        const currentProgress = this.userProgress.get(questId) || 0;
        const targetValue = this.getQuestTargetValue(quest);

        if (currentProgress >= targetValue) {
            console.log(`[QuestManager] Quest completed: ${questId}`);
            
            // Mark as completed
            this.completedQuests.add(questId);
            
            // Handle quest completion rewards
            if (questId === 'global_quest_master') {
                try {
                    // Show character selection modal
                    const selectedCharacter = await this.showCharacterChoiceModal();
                    
                    if (selectedCharacter) {
                        // Grant the selected character
                        const success = await this.grantCharacterReward(selectedCharacter);
                        if (success) {
                            console.log(`[QuestManager] Granted character reward: ${selectedCharacter}`);
                            this.showRewardNotification(`🎉 ${this.getCharacterDisplayName(selectedCharacter)} unlocked!`);
                        }
                    }
                } catch (error) {
                    console.error('[QuestManager] Error handling global quest reward:', error);
                }
            } else {
                // Handle regular character quest completion
                
                // Award rewards using centralized method
                await this.awardQuestRewards(quest);
                
                // Show completion notification
                this.showQuestCompletionNotification(quest);
                
                // Track completed character quest for global quest
                this.completedCharacterQuests.add(questId);
                this.updateGlobalQuestProgress();
            }

            // Save completion to Firebase
            await this.saveQuestCompletion(questId);

            // Dispatch completion event
            document.dispatchEvent(new CustomEvent('questCompleted', {
                detail: { questId, quest }
            }));

            console.log(`[QuestManager] Quest ${questId} marked as completed`);
        }
    }

    /**
     * Update character XP in the current game session
     */
    updateCharacterXPInGame(characterId, xpResult) {
        try {
            // Update character in game manager if available
            if (window.gameManager && window.gameManager.playerCharacters) {
                const character = window.gameManager.playerCharacters.find(char => char.id === characterId);
                if (character) {
                    character.setExperienceAndLevel(xpResult.totalXP, xpResult.newLevel);
                    console.log(`[QuestManager] Updated ${character.name} in-game XP: Level ${xpResult.newLevel} (${xpResult.totalXP} XP)`);
                    
                    // Trigger UI update if available
                    if (window.gameManager.uiManager && typeof window.gameManager.uiManager.updateCharacterUI === 'function') {
                        window.gameManager.uiManager.updateCharacterUI(character);
                    }
                }
            }
            
            // Update character in AI characters if available
            if (window.gameManager && window.gameManager.aiCharacters) {
                const aiCharacter = window.gameManager.aiCharacters.find(char => char.id === characterId);
                if (aiCharacter) {
                    aiCharacter.setExperienceAndLevel(xpResult.totalXP, xpResult.newLevel);
                    console.log(`[QuestManager] Updated ${aiCharacter.name} AI character XP: Level ${xpResult.newLevel} (${xpResult.totalXP} XP)`);
                }
            }
            
            // Dispatch event for other systems to listen to
            document.dispatchEvent(new CustomEvent('characterXPUpdated', {
                detail: { 
                    characterId: characterId,
                    xpResult: xpResult
                }
            }));
            
        } catch (error) {
            console.error('[QuestManager] Error updating character XP in game:', error);
        }
    }

    /**
     * Update global quest progress
     */
    updateGlobalQuestProgress() {
        const globalQuestId = 'global_quest_master';
        const completedCount = this.completedCharacterQuests.size;
        
        // Update progress
        this.userProgress.set(globalQuestId, completedCount);
        
        console.log(`[QuestManager] Global quest progress: ${completedCount}/5 character quests completed`);
        
        // Check if global quest should be completed
        if (completedCount >= 5 && !this.completedQuests.has(globalQuestId)) {
            // Register the global quest if not already registered
            if (!this.questRegistry.has(globalQuestId)) {
                this.questRegistry.set(globalQuestId, {
                    id: globalQuestId,
                    name: 'Quest Master',
                    description: 'Complete 5 character quests',
                    type: 'global',
                    target: { count: 5 },
                    reward: { type: 'character_choice' },
                    isActive: true,
                    characterId: 'global',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
            
            // Complete the global quest
            this.checkQuestCompletion(globalQuestId, this.questRegistry.get(globalQuestId));
        }
        
        // Dispatch update event for UI
        document.dispatchEvent(new CustomEvent('questProgressUpdated', {
            detail: { questId: globalQuestId, progress: completedCount }
        }));
    }
}

// Create global instance
window.questManager = new QuestManager();

// Add debug functions
window.debugQuestManager = () => {
    console.log('=== QUEST MANAGER DEBUG INFO ===');
    console.log('Initialized:', window.questManager.initialized);
    console.log('User ID:', window.questManager.userId);
    console.log('Firebase Database:', !!window.questManager.firebaseDatabase);
    console.log('Quest Registry Size:', window.questManager.questRegistry.size);
    console.log('User Progress Size:', window.questManager.userProgress.size);
    console.log('Completed Quests Size:', window.questManager.completedQuests.size);
    
    // Show all available quests
    const allQuests = [];
    for (const [questId, quest] of window.questManager.questRegistry) {
        allQuests.push({
            id: questId,
            character: quest.characterId,
            title: quest.title,
            type: quest.type,
            isActive: quest.isActive
        });
    }
    console.log('Available Quests:', allQuests);
    
    return {
        initialized: window.questManager.initialized,
        userId: window.questManager.userId,
        questCount: window.questManager.questRegistry.size,
        progressCount: window.questManager.userProgress.size,
        completedCount: window.questManager.completedQuests.size
    };
};

// Enhanced admin functions for console use
window.addQuestToUser = async (userId, questId) => {
    if (!window.questManager.firebaseDatabase) {
        console.error('Firebase not available');
        return false;
    }
    
    try {
        await window.questManager.firebaseDatabase.ref(`users/${userId}/questProgress/${questId}`).set(0);
        console.log(`Added quest ${questId} to user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error adding quest to user:', error);
        return false;
    }
};

window.completeQuestForUser = async (userId, questId) => {
    if (!window.questManager.firebaseDatabase) {
        console.error('Firebase not available');
        return false;
    }
    
    try {
        const quest = window.questManager.questRegistry.get(questId);
        if (!quest) {
            console.error(`Quest ${questId} not found`);
            return false;
        }

        const targetValue = quest.target.count || quest.target.amount;
        await window.questManager.firebaseDatabase.ref(`users/${userId}/questProgress/${questId}`).set(targetValue);
        await window.questManager.firebaseDatabase.ref(`users/${userId}/completedQuests/${questId}`).set(true);
        console.log(`Completed quest ${questId} for user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error completing quest for user:', error);
        return false;
    }
};

window.getUserQuestProgress = async (userId) => {
    if (!window.questManager.firebaseDatabase) {
        console.error('Firebase not available');
        return null;
    }
    
    try {
        const progressSnapshot = await window.questManager.firebaseDatabase.ref(`users/${userId}/questProgress`).once('value');
        const completedSnapshot = await window.questManager.firebaseDatabase.ref(`users/${userId}/completedQuests`).once('value');
        
        const progress = progressSnapshot.val() || {};
        const completed = completedSnapshot.val() || {};
        
        console.log(`Quest progress for user ${userId}:`, { progress, completed });
        return { progress, completed };
    } catch (error) {
        console.error('Error getting user quest progress:', error);
        return null;
    }
};

window.resetUserQuests = async (userId) => {
    return await window.questManager.adminResetUserProgress(userId);
};

window.getAvailableQuests = () => {
    return window.questManager.adminGetAllQuests();
};

window.addQuest = async (questData) => {
    return await window.questManager.adminAddQuest(questData);
};

window.updateQuest = async (questId, updates) => {
    return await window.questManager.adminUpdateQuest(questId, updates);
};

window.toggleQuest = async (questId, isActive) => {
    return await window.questManager.adminToggleQuest(questId, isActive);
};

window.deleteQuest = async (questId) => {
    return await window.questManager.adminDeleteQuest(questId);
};

window.reloadQuests = async () => {
    return await window.questManager.adminReloadQuests();
};

window.forceShowQuests = () => {
    if (window.questUIManager) {
        window.questUIManager.showQuestPanel();
    } else {
        console.error('Quest UI Manager not available');
    }
};

// Debug functions
window.completeActiveCharacterQuest = async () => {
    if (window.questUIManager) {
        return await window.questUIManager.completeActiveCharacterQuest();
    } else {
        console.error('Quest UI Manager not available');
    }
};

window.debugCharacterOwnership = async () => {
    if (window.questManager && window.questManager.initialized) {
        console.log('=== CHARACTER OWNERSHIP DEBUG ===');
        const owned = await window.questManager.getUserOwnedCharacters();
        const unowned = await window.questManager.getUnownedCharacters();
        console.log('Owned characters:', owned);
        console.log('Unowned characters:', unowned);
        return { owned, unowned };
    } else {
        console.error('Quest Manager not available');
    }
};

window.forceCompleteQuest = async (questId) => {
    if (window.questManager && window.questManager.initialized) {
        return await window.questManager.forceCompleteQuest(questId);
    } else {
        console.error('Quest Manager not available');
    }
};

window.checkGlobalQuestProgress = async () => {
    if (window.questManager && window.questManager.initialized) {
        return await window.questManager.checkGlobalQuestProgress();
    } else {
        console.error('Quest Manager not available');
    }
};

// Global function to track story completion
window.trackStoryCompletion = (storyId) => {
    if (window.questManager && window.questManager.initialized) {
        return window.questManager.trackStoryCompletion(storyId);
    } else {
        console.error('Quest Manager not available');
    }
};

// Auto-initialize when Firebase auth is ready
if (typeof firebaseAuth !== 'undefined') {
    firebaseAuth.onAuthStateChanged(async (user) => {
        if (user && !window.questManager.initialized) {
            console.log('[QuestManager] Firebase user detected, initializing...');
            await window.questManager.initialize();
        }
    });
} 