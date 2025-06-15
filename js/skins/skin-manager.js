// Skin Manager - Handles Firebase operations and skin management
class SkinManager {
    constructor() {
        this.currentUserId = null;
        this.ownedSkins = {};
        this.selectedSkins = {}; // characterId -> skinId mapping
        this.userFM = 0;
        this.initialized = false;
    }

    // Initialize the skin manager
    async initialize() {
        try {
            // Wait for Firebase auth
            await this.waitForAuth();
            this.currentUserId = window.auth.currentUser?.uid;
            
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
            
            if (window.auth && window.auth.currentUser) {
                console.log('[SkinManager] User already authenticated');
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 100; // 10 seconds timeout

            const checkAuth = () => {
                attempts++;
                console.log(`[SkinManager] Auth check attempt ${attempts}/${maxAttempts}`);
                
                if (window.auth && window.auth.currentUser) {
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

            // Load owned skins from RAIDSkin
            const ownedSkinsRef = window.database.ref(`users/${userId}/RAIDSkin`);
            const ownedSkinsSnapshot = await ownedSkinsRef.once('value');
            this.ownedSkins = ownedSkinsSnapshot.val() || {};

            // Load selected skins
            const selectedSkinsRef = window.database.ref(`users/${userId}/selectedSkins`);
            const selectedSkinsSnapshot = await selectedSkinsRef.once('value');
            this.selectedSkins = selectedSkinsSnapshot.val() || {};

            // Load user's Fighter Money (FM)
            const fmRef = window.database.ref(`users/${userId}/FM`);
            const fmSnapshot = await fmRef.once('value');
            this.userFM = fmSnapshot.val() || 0;

            console.log('[SkinManager] User data loaded:', {
                ownedSkins: Object.keys(this.ownedSkins).length,
                selectedSkins: Object.keys(this.selectedSkins).length,
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
        return this.selectedSkins[characterId] || null;
    }

    // Get the image path for a character (only returns skin path if skin is selected and owned)
    getCharacterImagePath(characterId) {
        const selectedSkin = this.getSelectedSkin(characterId);
        if (selectedSkin && this.ownsSkin(selectedSkin)) {
            const skin = window.SkinRegistry.getSkin(selectedSkin);
            if (skin) {
                return skin.imagePath;
            }
        }

        // Return null if no skin is selected - let the game engine handle default images
        return null;
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

            // Deduct FM
            const newFM = this.userFM - skin.price;
            await window.database.ref(`users/${userId}/FM`).set(newFM);

            // Add skin to owned skins
            await window.database.ref(`users/${userId}/RAIDSkin/${skinId}`).set({
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

            if (skinId === null || skinId === undefined) {
                // Remove skin selection (use default)
                await window.database.ref(`users/${userId}/selectedSkins/${characterId}`).remove();
                delete this.selectedSkins[characterId];
            } else {
                // Set skin selection
                await window.database.ref(`users/${userId}/selectedSkins/${characterId}`).set(skinId);
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
}

// Create global instance
window.SkinManager = new SkinManager();

console.log('[SkinManager] Skin manager class loaded'); 