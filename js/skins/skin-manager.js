// Skin Manager - Handles Firebase operations and skin management
class SkinManager {
    constructor() {
        this.currentUserId = null;
        this.ownedSkins = {};
        this.selectedSkins = {}; // characterId -> skinId mapping
        this.videoPreferences = {}; // characterId_skinId -> boolean mapping
        this.userFM = 0;
        this.initialized = false;
        this.forcedSkins = null; // To handle story-forced skins
    }

    /**
     * Set forced skins for a story.
     * @param {Array} skins - Array of { characterId, skinId }
     */
    setForcedSkins(skins) {
        if (!skins || !Array.isArray(skins)) {
            this.forcedSkins = null;
            return;
        }

        this.forcedSkins = {};
        skins.forEach(skinInfo => {
            if (skinInfo.characterId && skinInfo.skinId) {
                this.forcedSkins[skinInfo.characterId] = skinInfo.skinId;
            }
        });
        console.log('[SkinManager] Forced skins set:', this.forcedSkins);
    }

    /**
     * Clear any forced skins.
     */
    clearForcedSkins() {
        if (this.forcedSkins) {
            console.log('[SkinManager] Clearing forced skins.');
            this.forcedSkins = null;
        }
    }

    // Initialize the skin manager
    async initialize() {
        try {
            // Wait for Firebase auth
            await this.waitForAuth();
            this.currentUserId = window.auth?.currentUser?.uid || firebase?.auth()?.currentUser?.uid;

            if (!this.currentUserId) {
                console.error('[SkinManager] No authenticated user found');
                return false;
            }

            // Load user data
            await this.loadUserData();
            this.initialized = true;
            console.log('[SkinManager] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[SkinManager] Initialization error:', error);
            return false;
        }
    }

    // Wait for Firebase authentication
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            console.log('[SkinManager] Waiting for authentication...');

            // Check multiple auth sources
            const currentUser = window.auth?.currentUser || firebase?.auth()?.currentUser;
            if (currentUser) {
                console.log('[SkinManager] User already authenticated');
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 100; // 10 seconds timeout

            const checkAuth = () => {
                attempts++;
                console.log(`[SkinManager] Auth check attempt ${attempts}/${maxAttempts}`);

                const user = window.auth?.currentUser || firebase?.auth()?.currentUser;
                if (user) {
                    console.log('[SkinManager] Authentication successful');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('[SkinManager] Authentication timeout');
                    reject(new Error('Authentication timeout - user not signed in'));
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    // Load user's owned skins and selected skins from Firebase
    async loadUserData() {
        try {
            const userId = this.currentUserId;
            if (!userId) return;

            // Get database reference
            const database = window.database || firebase.database();
            if (!database) {
                console.error('[SkinManager] Firebase database not available');
                return;
            }

            // Load owned skins from RAIDSkin
            const ownedSkinsRef = database.ref(`users/${userId}/RAIDSkin`);
            const ownedSkinsSnapshot = await ownedSkinsRef.once('value');
            this.ownedSkins = ownedSkinsSnapshot.val() || {};

            // Load selected skins
            const selectedSkinsRef = database.ref(`users/${userId}/selectedSkins`);
            const selectedSkinsSnapshot = await selectedSkinsRef.once('value');
            this.selectedSkins = selectedSkinsSnapshot.val() || {};

            // Load video preferences
            const videoPreferencesRef = database.ref(`users/${userId}/videoPreferences`);
            const videoPreferencesSnapshot = await videoPreferencesRef.once('value');
            this.videoPreferences = videoPreferencesSnapshot.val() || {};

            // Load user's Fighter Money (FM)
            const fmRef = database.ref(`users/${userId}/FM`);
            const fmSnapshot = await fmRef.once('value');
            this.userFM = fmSnapshot.val() || 0;

            console.log('[SkinManager] User data loaded:', {
                ownedSkins: Object.keys(this.ownedSkins).length,
                selectedSkins: Object.keys(this.selectedSkins).length,
                videoPreferences: Object.keys(this.videoPreferences).length,
                fighterMoney: this.userFM
            });
        } catch (error) {
            console.error('[SkinManager] Error loading user data:', error);
        }
    }

    // Check if user owns a specific skin
    ownsSkin(skinId) {
        return this.ownedSkins.hasOwnProperty(skinId);
    }

    // Get selected skin for a character (returns null if using default)
    getSelectedSkin(characterId) {
        // NEW: Check for forced skins first
        if (this.forcedSkins && this.forcedSkins[characterId]) {
            console.log(`[SkinManager] Using forced skin ${this.forcedSkins[characterId]} for ${characterId}`);
            return this.forcedSkins[characterId];
        }
        return this.selectedSkins[characterId] || null;
    }

    // Set video preference for a character skin
    async setVideoPreference(characterId, skinId, useVideo) {
        try {
            if (!this.initialized || !this.currentUserId) {
                throw new Error('Skin manager not initialized or user not authenticated');
            }

            const userId = this.currentUserId;
            const preferenceKey = `${characterId}_${skinId}`;
            const database = window.database || firebase.database();

            if (!database) {
                throw new Error('Firebase database not available');
            }

            if (useVideo) {
                await database.ref(`users/${userId}/videoPreferences/${preferenceKey}`).set(true);
                this.videoPreferences[preferenceKey] = true;
            } else {
                await database.ref(`users/${userId}/videoPreferences/${preferenceKey}`).remove();
                delete this.videoPreferences[preferenceKey];
            }

            console.log(`[SkinManager] Video preference set for ${characterId} ${skinId}:`, useVideo);

            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('videoPreferenceChanged', {
                detail: { characterId, skinId, useVideo }
            }));

            return { success: true };
        } catch (error) {
            console.error('[SkinManager] Video preference error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get video preference for a character skin
    getVideoPreference(characterId, skinId) {
        const preferenceKey = `${characterId}_${skinId}`;
        return this.videoPreferences[preferenceKey] || false;
    }

    // Check if a skin should use video (has video and user prefers it)
    shouldUseVideo(characterId, skinId) {
        const skin = window.SkinRegistry.getSkin(skinId);
        if (!skin || !skin.hasVideo) return false;

        return this.getVideoPreference(characterId, skinId);
    }

    // Get character media path (video or image) based on preferences
    getCharacterMediaPath(characterId, skinId = null) {
        if (!skinId) {
            skinId = this.getSelectedSkin(characterId);
        }

        if (!skinId) {
            // Default character image
            return this.getDefaultCharacterImage(characterId);
        }

        const skin = window.SkinRegistry.getSkin(skinId);
        if (!skin) {
            return this.getDefaultCharacterImage(characterId);
        }

        // Check if should use video
        if (this.shouldUseVideo(characterId, skinId)) {
            return skin.videoPath;
        }

        return skin.imagePath;
    }

    // Get default character image path
    getDefaultCharacterImage(characterId) {
        const imageNameMap = {
            'schoolgirl_ayane': 'Schoolgirl Ayane.png',
            'schoolgirl_kokoro': 'Schoolgirl Kokoro.png',
            'schoolboy_shoma': 'Schoolboy Shoma.png',
            'schoolboy_siegfried': 'Schoolboy Siegfried.png',
            'schoolgirl_julia': 'Schoolgirl Julia.png',
            'schoolgirl_elphelt': 'Schoolgirl Elphelt.png',
            'bridget': 'Bridget.png',
            'renée': 'Renée.png',
            'zoey': 'Zoey.png',
            'atlantean_kotal_kahn': 'Atlantean Kotal Kahn.png',
            'atlantean_sub_zero_playable': 'Atlantean Sub Zero.png',
            'atlantean_christie': 'Atlantean Christie.png',
            'atlantean_kagome': 'Atlantean Kagome.png',
            'atlantean_zasalamel': 'Atlantean Zasalamel.png',
            'atlantean_shinnok': 'Atlantean Shinnok.png',
            'farmer_nina': 'Farmer Nina.png',
            'farmer_raiden': 'Farmer Raiden.png',
            'farmer_alice': 'Farmer Alice.png',
            'farmer_shoma': 'Farmer Shoma.png',
            'farmer_cham_cham': 'Farmer Cham Cham.png',
            'cham_cham': 'Cham Cham.png',
            'ayane': 'Ayane.png',
            'infernal_ibuki': 'Infernal Ibuki.png',
            'infernal_astaroth': 'Infernal Astaroth.png',
            'infernal_birdie': 'Infernal Birdie.png',
            'infernal_raiden': 'Infernal Raiden.png',
            'infernal_scorpion': 'Infernal Scorpion.png',
            'little_devil': 'Little Devil.webp',
            'little_devil_female': 'Little_Devil_Female.webp',
            'angry_carrot': 'Angry Carrot.jpeg',
            'angry_bull': 'Angry Bull.jpeg',
            'angry_pig': 'Angry Pig.jpeg',
            'angry_chicken': 'Angry Chicken.jpeg',
            'monster_apple': 'Monster Apple.webp',
            'healthy_apple': 'Healthy Apple.webp',
            'angry_apple': 'Angry Apple.webp',
            'leafy_apple': 'Leafy Apple.webp',
            'rotten_apple': 'Rotten Apple.webp',
            'crazy_farmer': 'Crazy Farmer.jpeg',
            'hound': 'Hound.jpeg',
            'crow': 'Crow.webp',
            'scarecrow': 'Scarecrow.webp',
        };

        const imageName = imageNameMap[characterId];
        if (imageName) {
            return `Loading Screen/${imageName}`;
        }

        // Fallback: try to convert character_id to Character Name format
        const characterName = characterId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        return `Loading Screen/${characterName}.png`;
    }

    // Legacy method for backwards compatibility - returns image path only
    getCharacterImagePath(characterId, skinId = null) {
        if (!skinId) {
            skinId = this.getSelectedSkin(characterId);
        }

        if (!skinId) {
            // Default character image
            return this.getDefaultCharacterImage(characterId);
        }

        const skin = window.SkinRegistry.getSkin(skinId);
        if (!skin) {
            return this.getDefaultCharacterImage(characterId);
        }

        // Always return image path for backwards compatibility
        return skin.imagePath;
    }

    // Purchase a skin
    async purchaseSkin(skinId) {
        try {
            if (!this.initialized || !this.currentUserId) {
                throw new Error('Skin manager not initialized or user not authenticated');
            }

            const skin = window.SkinRegistry.getSkin(skinId);
            if (!skin) {
                throw new Error('Skin not found');
            }

            if (this.ownsSkin(skinId)) {
                throw new Error('Skin already owned');
            }

            if (this.userFM < skin.price) {
                throw new Error('Insufficient Fighter Money (FM)');
            }

            const userId = this.currentUserId;
            const database = window.database || firebase.database();

            if (!database) {
                throw new Error('Firebase database not available');
            }

            // Deduct FM
            const newFM = this.userFM - skin.price;
            await database.ref(`users/${userId}/FM`).set(newFM);

            // Add skin to owned skins
            await database.ref(`users/${userId}/RAIDSkin/${skinId}`).set({
                purchasedAt: Date.now(),
                price: skin.price
            });

            // Update local data
            this.userFM = newFM;
            this.ownedSkins[skinId] = {
                purchasedAt: Date.now(),
                price: skin.price
            };

            console.log(`[SkinManager] Successfully purchased skin: ${skin.name}`);
            return { success: true, newFM: newFM };
        } catch (error) {
            console.error('[SkinManager] Purchase error:', error);
            return { success: false, error: error.message };
        }
    }

    // Select a skin for a character
    async selectSkin(characterId, skinId) {
        try {
            if (!this.initialized || !this.currentUserId) {
                throw new Error('Skin manager not initialized or user not authenticated');
            }

            // Allow null/undefined to reset to default skin
            if (skinId !== null && skinId !== undefined) {
                const skin = window.SkinRegistry.getSkin(skinId);
                if (!skin) {
                    throw new Error('Skin not found');
                }

                if (skin.characterId !== characterId) {
                    throw new Error('Skin does not belong to this character');
                }

                if (!this.ownsSkin(skinId)) {
                    throw new Error('Skin not owned');
                }
            }

            const userId = this.currentUserId;
            const database = window.database || firebase.database();

            if (!database) {
                throw new Error('Firebase database not available');
            }

            if (skinId === null || skinId === undefined) {
                // Remove skin selection (use default)
                await database.ref(`users/${userId}/selectedSkins/${characterId}`).remove();
                delete this.selectedSkins[characterId];
            } else {
                // Set skin selection
                await database.ref(`users/${userId}/selectedSkins/${characterId}`).set(skinId);
                this.selectedSkins[characterId] = skinId;
            }

            console.log(`[SkinManager] Skin selection updated for ${characterId}:`, skinId || 'default');
            return { success: true };
        } catch (error) {
            console.error('[SkinManager] Skin selection error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user's current FM
    getFighterMoney() {
        return this.userFM;
    }

    // Get all owned skins
    getOwnedSkins() {
        return Object.keys(this.ownedSkins);
    }

    // Get skin purchase info
    getSkinPurchaseInfo(skinId) {
        return this.ownedSkins[skinId] || null;
    }

    // Refresh user data from Firebase
    async refreshUserData() {
        await this.loadUserData();
    }

    // Get skins for character (with ownership status)
    getCharacterSkinsWithOwnership(characterId) {
        const skins = window.SkinRegistry.getSkinsForCharacter(characterId);
        return skins.map(skin => ({
            ...skin,
            owned: this.ownsSkin(skin.id),
            selected: this.getSelectedSkin(characterId) === skin.id
        }));
    }

    // Get all skins with ownership status
    getAllSkinsWithOwnership() {
        const skins = window.SkinRegistry.getAllSkins();
        return skins.map(skin => ({
            ...skin,
            owned: this.ownsSkin(skin.id),
            selected: this.getSelectedSkin(skin.characterId) === skin.id
        }));
    }

    // Grant a skin to the user (for lootbox rewards)
    async grantSkin(skinId, source = 'lootbox') {
        try {
            if (!this.initialized || !this.currentUserId) {
                console.error('[SkinManager] Cannot grant skin - not initialized or no user');
                return { success: false, error: 'Not initialized or no user' };
            }

            if (this.ownsSkin(skinId)) {
                console.log(`[SkinManager] User already owns skin ${skinId}`);
                return { success: false, error: 'Skin already owned' };
            }

            const userId = this.currentUserId;
            const database = window.database || firebase.database();

            if (!database) {
                console.error('[SkinManager] Firebase database not available');
                return { success: false, error: 'Database not available' };
            }

            // Add skin to Firebase
            await database.ref(`users/${userId}/RAIDSkin/${skinId}`).set({
                grantedAt: Date.now(),
                source: source,
                price: 0 // Free from lootbox
            });

            // Update local data
            this.ownedSkins[skinId] = {
                grantedAt: Date.now(),
                source: source,
                price: 0
            };

            console.log(`[SkinManager] Successfully granted skin ${skinId} to user ${userId}`);
            return { success: true };
        } catch (error) {
            console.error('[SkinManager] Error granting skin:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if SkinManager is ready for operations
    isReady() {
        return this.initialized && this.currentUserId;
    }

    // Wait for SkinManager to be ready
    async waitForReady(maxWaitTime = 10000) {
        const startTime = Date.now();

        while (!this.isReady() && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return this.isReady();
    }
}

// Debug: Add a global function to check character image paths
window.debugCharacterImages = (characterId) => {
    console.log(`[Debug] Checking character images for: ${characterId}`);

    // Test SkinManager path
    if (window.SkinManager) {
        try {
            const skinImagePath = window.SkinManager.getCharacterImagePath(characterId);
            console.log(`[Debug] SkinManager image path: ${skinImagePath}`);

            const skinMediaPath = window.SkinManager.getCharacterMediaPath(characterId);
            console.log(`[Debug] SkinManager media path: ${skinMediaPath}`);
        } catch (error) {
            console.error(`[Debug] SkinManager error: ${error.message}`);
        }
    }

    // Test GameManager path
    if (window.gameManager) {
        try {
            const gameImagePath = window.gameManager.getCharacterImagePath(characterId);
            console.log(`[Debug] GameManager image path: ${gameImagePath}`);

            const gameMediaPath = window.gameManager.getCharacterMediaPath(characterId);
            console.log(`[Debug] GameManager media path: ${gameMediaPath}`);
        } catch (error) {
            console.error(`[Debug] GameManager error: ${error.message}`);
        }
    }

    // Test actual file existence
    const testPaths = [
        `Loading Screen/${characterId}.png`,
        `Loading Screen/${characterId.charAt(0).toUpperCase() + characterId.slice(1)}.png`,
        `Loading Screen/${characterId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}.png`
    ];

    testPaths.forEach(async (path) => {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            console.log(`[Debug] ${path}: ${response.ok ? 'EXISTS' : 'NOT FOUND'}`);
        } catch (error) {
            console.log(`[Debug] ${path}: ERROR - ${error.message}`);
        }
    });
};

// Debug: List all character image mappings
window.listCharacterMappings = () => {
    console.log('[Debug] Character Image Mappings:');

    const imageNameMap = {
        'schoolgirl_ayane': 'Schoolgirl Ayane.png',
        'schoolgirl_kokoro': 'Schoolgirl Kokoro.png',
        'schoolboy_shoma': 'Schoolboy Shoma.png',
        'schoolboy_siegfried': 'Schoolboy Siegfried.png',
        'schoolgirl_julia': 'Schoolgirl Julia.png',
        'schoolgirl_elphelt': 'Schoolgirl Elphelt.png',
        'bridget': 'Bridget.png',
        'renée': 'Renée.png',
        'zoey': 'Zoey.png',
        'atlantean_kotal_kahn': 'Atlantean Kotal Kahn.png',
        'atlantean_sub_zero_playable': 'Atlantean Sub Zero.png',
        'atlantean_christie': 'Atlantean Christie.png',
        'atlantean_kagome': 'Atlantean Kagome.png',
        'atlantean_zasalamel': 'Atlantean Zasalamel.png',
        'atlantean_shinnok': 'Atlantean Shinnok.png',
        'farmer_nina': 'Farmer Nina.png',
        'farmer_raiden': 'Farmer Raiden.png',
        'farmer_alice': 'Farmer Alice.png',
        'farmer_shoma': 'Farmer Shoma.png',
        'farmer_cham_cham': 'Farmer Cham Cham.png',
        'cham_cham': 'Cham Cham.png',
        'ayane': 'Ayane.png',
        'infernal_ibuki': 'Infernal Ibuki.png',
        'infernal_astaroth': 'Infernal Astaroth.png',
        'infernal_birdie': 'Infernal Birdie.png',
        'infernal_raiden': 'Infernal Raiden.png',
        'infernal_scorpion': 'Infernal Scorpion.png',
    };

    Object.entries(imageNameMap).forEach(([id, filename]) => {
        console.log(`  ${id} -> ${filename}`);
    });
};

console.log('[Debug] Character image debugging functions available:');
console.log('- window.debugCharacterImages(characterId) - Debug paths for specific character');
console.log('- window.listCharacterMappings() - List all character mappings');

// Debug: Add a test function to check video support
window.testVideoSupport = () => {
    console.log('[Debug] Testing video support...');

    if (window.SkinManager && window.SkinRegistry) {
        const ayaneSkin = window.SkinRegistry.getSkin('schoolgirl_ayane_true_form');
        console.log('[Debug] Ayane True Form skin:', ayaneSkin);

        if (ayaneSkin) {
            console.log('[Debug] Has video:', ayaneSkin.hasVideo);
            console.log('[Debug] Video path:', ayaneSkin.videoPath);
            console.log('[Debug] Image path:', ayaneSkin.imagePath);

            // Test media path resolution
            const mediaPath = window.SkinManager.getCharacterMediaPath('schoolgirl_ayane', 'schoolgirl_ayane_true_form');
            console.log('[Debug] Resolved media path:', mediaPath);

            // Test video preference
            const videoPreference = window.SkinManager.getVideoPreference('schoolgirl_ayane', 'schoolgirl_ayane_true_form');
            console.log('[Debug] Video preference:', videoPreference);
        }
    } else {
        console.log('[Debug] SkinManager or SkinRegistry not available');
    }
};

// Debug: Add a test function to toggle video preference
window.testVideoToggle = () => {
    if (window.SkinManager) {
        const currentPreference = window.SkinManager.getVideoPreference('schoolgirl_ayane', 'schoolgirl_ayane_true_form');
        const newPreference = !currentPreference;

        console.log(`[Debug] Toggling video preference from ${currentPreference} to ${newPreference}`);

        window.SkinManager.setVideoPreference('schoolgirl_ayane', 'schoolgirl_ayane_true_form', newPreference)
            .then(result => {
                console.log('[Debug] Video preference toggle result:', result);
            })
            .catch(error => {
                console.error('[Debug] Video preference toggle error:', error);
            });
    }
};

console.log('[Debug] Video support test functions available:');
console.log('- window.testVideoSupport() - Check video support');
console.log('- window.testVideoToggle() - Toggle video preference for Ayane True Form');

// Create global instance
window.SkinManager = new SkinManager();

// Auto-initialize SkinManager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.SkinManager && !window.SkinManager.initialized) {
        console.log('[SkinManager] Auto-initializing on DOMContentLoaded...');
        window.SkinManager.initialize().catch(error => {
            console.warn('[SkinManager] Auto-initialization failed:', error);
        });
    }
});

// Also try to initialize when Firebase auth state changes
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && window.SkinManager && !window.SkinManager.initialized) {
            console.log('[SkinManager] Auto-initializing on auth state change...');
            window.SkinManager.initialize().catch(error => {
                console.warn('[SkinManager] Auto-initialization on auth change failed:', error);
            });
        }
    });
}

// Debug function to test lootbox skin drops
window.testLootboxSkinDrop = async function () {
    console.log('[Debug] Testing lootbox skin drop...');

    if (!window.ItemRegistry) {
        console.error('[Debug] ItemRegistry not available');
        return;
    }

    const basketItem = window.ItemRegistry.getItem('basket_of_goods');
    if (!basketItem) {
        console.error('[Debug] Basket of Goods item not found');
        return;
    }

    // Create mock character
    const mockCharacter = {
        id: 'test-character',
        name: 'Test Character'
    };

    try {
        console.log('[Debug] Opening basket of goods...');
        const result = await basketItem.openLootbox(mockCharacter);
        console.log('[Debug] Lootbox result:', result);

        if (result.specialRewards && result.specialRewards.length > 0) {
            console.log('[Debug] 🎉 Skin dropped!', result.specialRewards);
        } else {
            console.log('[Debug] No skin drop this time');
        }

        return result;
    } catch (error) {
        console.error('[Debug] Error testing lootbox:', error);
        return null;
    }
};

// Debug function to test multiple drops
window.testMultipleLootboxDrops = async function (count = 10) {
    console.log(`[Debug] Testing ${count} lootbox drops...`);

    let skinDrops = 0;
    const results = [];

    for (let i = 0; i < count; i++) {
        const result = await window.testLootboxSkinDrop();
        if (result && result.specialRewards && result.specialRewards.length > 0) {
            skinDrops++;
        }
        results.push(result);
    }

    console.log(`[Debug] Results: ${skinDrops}/${count} skin drops (${(skinDrops / count * 100).toFixed(1)}%)`);
    return results;
};

console.log('[SkinManager] Skin manager class loaded');
console.log('[Debug] Test functions available:');
console.log('- window.testLootboxSkinDrop() - Test single lootbox opening');
console.log('- window.testMultipleLootboxDrops(10) - Test multiple openings');
