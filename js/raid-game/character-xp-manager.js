/**
 * Character Experience Manager
 * Handles saving and loading character XP and level data to/from Firebase
 */
class CharacterXPManager {
    constructor() {
        this.firebase = null;
        this.database = null;
        this.initialized = false;
    }

    /**
     * Initialize the XP Manager with Firebase
     */
    async initialize() {
        if (typeof firebase === 'undefined') {
            console.error('[CharacterXPManager] Firebase not available');
            return false;
        }

        this.firebase = firebase;
        this.database = firebase.database();
        this.initialized = true;
        
        console.log('[CharacterXPManager] Initialized successfully');
        return true;
    }

    /**
     * Get current user ID
     * @returns {string|null} User ID or null if not authenticated
     */
    getCurrentUserId() {
        if (!this.firebase || !this.firebase.auth().currentUser) {
            console.warn('[CharacterXPManager] No authenticated user');
            return null;
        }
        return this.firebase.auth().currentUser.uid;
    }

    /**
     * Save character XP and level to Firebase
     * @param {string} characterId - Character ID
     * @param {number} experience - Total experience points
     * @param {number} level - Character level
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<boolean>} Success status
     */
    async saveCharacterXP(characterId, experience, level, userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return false;
        }

        if (!userId) {
            userId = this.getCurrentUserId();
        }

        if (!userId) {
            console.error('[CharacterXPManager] No user ID available for saving XP');
            return false;
        }

        if (!characterId || typeof experience !== 'number' || typeof level !== 'number') {
            console.error('[CharacterXPManager] Invalid parameters for saving XP');
            return false;
        }

        try {
            const xpData = {
                experience: Math.max(0, experience),
                level: Math.max(1, level),
                lastUpdated: this.firebase.database.ServerValue.TIMESTAMP
            };

            await this.database.ref(`users/${userId}/characterXP/${characterId}`).set(xpData);
            
            console.log(`[CharacterXPManager] Saved XP data for ${characterId}: Level ${level} (${experience} XP)`);
            return true;
        } catch (error) {
            console.error(`[CharacterXPManager] Error saving XP for ${characterId}:`, error);
            return false;
        }
    }

    /**
     * Load character XP and level from Firebase
     * @param {string} characterId - Character ID
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<Object|null>} XP data object or null if not found
     */
    async loadCharacterXP(characterId, userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return null;
        }

        if (!userId) {
            userId = this.getCurrentUserId();
        }

        if (!userId) {
            console.error('[CharacterXPManager] No user ID available for loading XP');
            return null;
        }

        if (!characterId) {
            console.error('[CharacterXPManager] No character ID provided');
            return null;
        }

        try {
            const snapshot = await this.database.ref(`users/${userId}/characterXP/${characterId}`).once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log(`[CharacterXPManager] Loaded XP data for ${characterId}: Level ${data.level} (${data.experience} XP)`);
                return {
                    experience: data.experience || 0,
                    level: data.level || 1,
                    lastUpdated: data.lastUpdated
                };
            } else {
                console.log(`[CharacterXPManager] No XP data found for ${characterId}, returning defaults`);
                return {
                    experience: 0,
                    level: 1,
                    lastUpdated: null
                };
            }
        } catch (error) {
            console.error(`[CharacterXPManager] Error loading XP for ${characterId}:`, error);
            return null;
        }
    }

    /**
     * Get character XP data formatted for UI display (includes currentXP and xpForNextLevel)
     * This method is used by character-selector.html and talents.js
     * @param {string} characterId - Character ID
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<Object|null>} XP data object formatted for UI or null if not found
     */
    async getCharacterXP(characterId, userId = null) {
        try {
            const xpData = await this.loadCharacterXP(characterId, userId);
            if (!xpData) {
                return null;
            }

            const currentLevel = xpData.level;
            const totalXP = xpData.experience;

            // Calculate XP for current level and next level
            const xpForCurrentLevel = Character.calculateXPRequiredForLevel(currentLevel);
            const xpForNextLevel = Character.calculateXPRequiredForLevel(currentLevel + 1);
            
            // Calculate current progress within the level
            const currentXP = Math.max(0, totalXP - xpForCurrentLevel);
            const progressNeeded = xpForNextLevel - xpForCurrentLevel;
            
            return {
                level: currentLevel,
                currentXP: currentXP,
                xpForNextLevel: progressNeeded,
                totalXP: totalXP,
                lastUpdated: xpData.lastUpdated
            };
        } catch (error) {
            console.error(`[CharacterXPManager] Error getting character XP for UI: ${characterId}`, error);
            return null;
        }
    }

    /**
     * Add experience to a character and save to Firebase
     * @param {string} characterId - Character ID
     * @param {number} xpAmount - Amount of XP to add
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<Object|null>} Level up information or null on error
     */
    async addExperienceAndSave(characterId, xpAmount, userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return null;
        }

        if (typeof xpAmount !== 'number' || xpAmount < 0) {
            console.error('[CharacterXPManager] Invalid XP amount:', xpAmount);
            return null;
        }

        try {
            // Load current XP data
            const currentData = await this.loadCharacterXP(characterId, userId);
            if (!currentData) {
                console.error(`[CharacterXPManager] Failed to load current XP data for ${characterId}`);
                return null;
            }

            const oldLevel = currentData.level;
            const oldXP = currentData.experience;

            // Calculate new XP and level
            const newXP = oldXP + xpAmount;
            const newLevel = Character.calculateLevelFromXP(newXP);
            const leveledUp = newLevel > oldLevel;

            // Save updated data
            const saveSuccess = await this.saveCharacterXP(characterId, newXP, newLevel, userId);
            if (!saveSuccess) {
                console.error(`[CharacterXPManager] Failed to save updated XP data for ${characterId}`);
                return null;
            }

            const result = {
                leveledUp: leveledUp,
                oldLevel: oldLevel,
                newLevel: newLevel,
                xpGained: xpAmount,
                totalXP: newXP,
                oldXP: oldXP,
                talentPointsAwarded: 0
            };

            // Award talent points for each level gained
            if (leveledUp) {
                const levelsGained = newLevel - oldLevel;
                result.talentPointsAwarded = levelsGained;
                
                console.log(`[CharacterXPManager] ${characterId} LEVEL UP! ${oldLevel} → ${newLevel} (XP: ${oldXP} → ${newXP})`);
                console.log(`[CharacterXPManager] ${characterId} gained ${levelsGained} talent point(s) for leveling up!`);
                
                // Award talent points (1 per level gained)
                try {
                    await this.awardTalentPointsForLevelUp(characterId, levelsGained, userId);
                } catch (error) {
                    console.error(`[CharacterXPManager] Failed to award talent points for ${characterId}:`, error);
                    // Don't fail the entire operation if talent points fail
                }
            } else {
                console.log(`[CharacterXPManager] ${characterId} gained ${xpAmount} XP (Total: ${newXP})`);
            }

            return result;
        } catch (error) {
            console.error(`[CharacterXPManager] Error adding XP to ${characterId}:`, error);
            return null;
        }
    }

    /**
     * Initialize XP data for all owned characters (sets to default if not already set)
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<boolean>} Success status
     */
    async initializeAllCharacterXP(userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return false;
        }

        if (!userId) {
            userId = this.getCurrentUserId();
        }

        if (!userId) {
            console.error('[CharacterXPManager] No user ID available for initializing XP');
            return false;
        }

        try {
            // Get unlocked characters
            const unlockedSnapshot = await this.database.ref(`users/${userId}/UnlockedRAIDCharacters`).once('value');
            
            if (!unlockedSnapshot.exists()) {
                console.log('[CharacterXPManager] No unlocked characters found');
                return true;
            }

            const unlockedCharacters = unlockedSnapshot.val();
            const characterIds = Object.keys(unlockedCharacters);

            // Initialize XP for each unlocked character if not already set
            const updates = {};
            let initializedCount = 0;

            for (const characterId of characterIds) {
                const xpData = await this.loadCharacterXP(characterId, userId);
                
                // Only set if no data exists (to avoid overwriting existing XP)
                if (!xpData || (xpData.experience === 0 && xpData.level === 1 && !xpData.lastUpdated)) {
                    updates[`users/${userId}/characterXP/${characterId}`] = {
                        experience: 0,
                        level: 1,
                        lastUpdated: this.firebase.database.ServerValue.TIMESTAMP
                    };
                    initializedCount++;
                }
            }

            if (Object.keys(updates).length > 0) {
                await this.database.ref().update(updates);
                console.log(`[CharacterXPManager] Initialized XP data for ${initializedCount} characters`);
            } else {
                console.log('[CharacterXPManager] All characters already have XP data');
            }

            return true;
        } catch (error) {
            console.error('[CharacterXPManager] Error initializing character XP:', error);
            return false;
        }
    }

    /**
     * Get XP data for multiple characters
     * @param {Array<string>} characterIds - Array of character IDs
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<Object>} Object with character IDs as keys and XP data as values
     */
    async loadMultipleCharacterXP(characterIds, userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return {};
        }

        if (!Array.isArray(characterIds) || characterIds.length === 0) {
            console.error('[CharacterXPManager] Invalid character IDs array');
            return {};
        }

        if (!userId) {
            userId = this.getCurrentUserId();
        }

        if (!userId) {
            console.error('[CharacterXPManager] No user ID available');
            return {};
        }

        try {
            const results = {};
            
            // Load XP data for each character
            for (const characterId of characterIds) {
                const xpData = await this.loadCharacterXP(characterId, userId);
                results[characterId] = xpData || { experience: 0, level: 1, lastUpdated: null };
            }

            console.log(`[CharacterXPManager] Loaded XP data for ${Object.keys(results).length} characters`);
            return results;
        } catch (error) {
            console.error('[CharacterXPManager] Error loading multiple character XP:', error);
            return {};
        }
    }

    /**
     * Apply XP data to a character instance
     * @param {Character} character - Character instance
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<boolean>} Success status
     */
    async applyXPToCharacter(character, userId = null) {
        if (!character || !character.id) {
            console.error('[CharacterXPManager] Invalid character provided');
            return false;
        }

        try {
            const xpData = await this.loadCharacterXP(character.id, userId);
            if (xpData) {
                character.setExperienceAndLevel(xpData.experience, xpData.level);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[CharacterXPManager] Error applying XP to character ${character.id}:`, error);
            return false;
        }
    }

    /**
     * Calculate XP to award based on stage difficulty and character level
     * Creative, grindy formula that scales well
     * @param {number} stageDifficulty - Stage difficulty (1-10)
     * @param {number} characterLevel - Character's current level
     * @param {boolean} survived - Whether the character survived the battle
     * @param {Object} bonuses - Additional bonuses like victory condition, team size, etc.
     * @returns {number} XP to award
     */
    calculateXPReward(stageDifficulty, characterLevel, survived = true, bonuses = {}) {
        // Base XP calculation that gets more generous at higher difficulties
        // but accounts for character level to prevent over-leveling
        const baseDifficultyXP = Math.floor(stageDifficulty * (25 + (stageDifficulty * 5))); // 30, 70, 120, 180, 250, 330, 420, 520, 630, 750
        
        // Level scaling factor - diminishing returns for higher levels
        // This prevents level 1 characters from getting too much, but still rewards progression
        const levelScalingFactor = Math.max(0.3, 1 - (characterLevel - 1) * 0.05); // Starts at 1.0, decreases by 5% per level, min 0.3
        
        // Character level bonus - slight bonus for being higher level (risk vs reward)
        const levelBonus = Math.floor(characterLevel * 2);
        
        // Difficulty challenge bonus - exponential increase for very hard content
        const challengeBonus = stageDifficulty >= 7 ? Math.floor(Math.pow(stageDifficulty - 6, 2) * 10) : 0;
        
        // Calculate base XP with all factors
        let finalXP = Math.floor((baseDifficultyXP + levelBonus) * levelScalingFactor) + challengeBonus;
        
        // Survival bonus
        if (survived) {
            finalXP += Math.floor(finalXP * 0.25); // 25% bonus for survival
        } else {
            finalXP = Math.floor(finalXP * 0.5); // 50% XP if dead
        }
        
        // Additional bonuses
        if (bonuses.perfectVictory) {
            finalXP += Math.floor(finalXP * 0.15); // 15% bonus for perfect victory
        }
        
        if (bonuses.speedBonus) {
            finalXP += Math.floor(finalXP * 0.1); // 10% bonus for fast completion
        }
        
        if (bonuses.underdog) {
            finalXP += Math.floor(finalXP * 0.2); // 20% bonus for being outnumbered
        }
        
        if (bonuses.storyMode) {
            finalXP += Math.floor(finalXP * 0.3); // 30% bonus for story mode progression
        }
        
        // Random small variance to make it feel more organic (±5%)
        const variance = 1 + (Math.random() - 0.5) * 0.1;
        finalXP = Math.floor(finalXP * variance);
        
        // Ensure minimum XP
        return Math.max(10, finalXP);
    }

    /**
     * Award talent points to a character for leveling up
     * @param {string} characterId - Character ID
     * @param {number} levelsGained - Number of levels gained (1 talent point per level)
     * @param {string} userId - User ID (optional, will get current user if not provided)
     * @returns {Promise<boolean>} Success status
     */
    async awardTalentPointsForLevelUp(characterId, levelsGained, userId = null) {
        if (!characterId || typeof levelsGained !== 'number' || levelsGained <= 0) {
            console.error('[CharacterXPManager] Invalid parameters for talent point award');
            return false;
        }

        if (!userId) {
            userId = this.getCurrentUserId();
        }

        if (!userId) {
            console.error('[CharacterXPManager] No user ID available for awarding talent points');
            return false;
        }

        try {
            // Check if talent manager is available
            if (typeof window.talentManager !== 'undefined' && window.talentManager.addTalentPoints) {
                // Use the global talent manager
                await window.talentManager.addTalentPoints(characterId, levelsGained, userId);
                console.log(`[CharacterXPManager] Awarded ${levelsGained} talent point(s) to ${characterId} via TalentManager`);
                return true;
            } else {
                // Fallback: directly update Firebase if talent manager isn't available
                console.warn('[CharacterXPManager] TalentManager not available, using direct Firebase update for talent points');
                
                // Get current talent points
                const currentPointsSnapshot = await this.database.ref(`users/${userId}/characterTalentPoints/${characterId}`).once('value');
                const currentPoints = currentPointsSnapshot.exists() ? currentPointsSnapshot.val() : 0;
                
                // Add the new points
                const newPoints = currentPoints + levelsGained;
                await this.database.ref(`users/${userId}/characterTalentPoints/${characterId}`).set(newPoints);
                
                console.log(`[CharacterXPManager] Awarded ${levelsGained} talent point(s) to ${characterId} via direct Firebase update (${currentPoints} → ${newPoints})`);
                return true;
            }
        } catch (error) {
            console.error(`[CharacterXPManager] Error awarding talent points to ${characterId}:`, error);
            return false;
        }
    }

    /**
     * Award experience using the smart calculation system
     * @param {string} characterId - Character ID
     * @param {number} stageDifficulty - Stage difficulty
     * @param {number} characterLevel - Character's current level
     * @param {boolean} survived - Whether character survived
     * @param {Object} bonuses - Additional bonuses
     * @param {string} userId - User ID (optional)
     * @returns {Promise<Object|null>} Award result with XP details
     */
    async awardExperience(characterId, stageDifficulty, characterLevel, survived = true, bonuses = {}, userId = null) {
        if (!this.initialized) {
            console.error('[CharacterXPManager] Not initialized');
            return null;
        }

        // Calculate XP to award
        const xpToAward = this.calculateXPReward(stageDifficulty, characterLevel, survived, bonuses);
        
        // Use the existing addExperienceAndSave method
        const result = await this.addExperienceAndSave(characterId, xpToAward, userId);
        
        if (result) {
            // Add additional info about the calculation
            result.calculationDetails = {
                stageDifficulty,
                characterLevel,
                survived,
                bonuses,
                xpAwarded: xpToAward
            };
        }
        
        return result;
    }
}

// Create global instance
window.characterXPManager = new CharacterXPManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready
    if (typeof firebase !== 'undefined') {
        await window.characterXPManager.initialize();
    } else {
        console.warn('[CharacterXPManager] Firebase not available at initialization');
    }
});

// Also try to initialize if Firebase auth state changes
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && !window.characterXPManager.initialized) {
            await window.characterXPManager.initialize();
        }
    });
} 