// Skin Registry System
window.SkinRegistry = {
    // Define all available skins
    skins: {
        // Red Schoolboy Siegfried
        'red_schoolboy_siegfried': {
            id: 'red_schoolboy_siegfried',
            name: 'Red Schoolboy Siegfried',
            characterId: 'schoolboy_siegfried',
            description: 'A fiery red variant of the classic Schoolboy Siegfried outfit.',
            imagePath: 'Loading Screen/Red Schoolboy Siegfried.png',
            price: 1500, // FM cost
            rarity: 'common',
            category: 'schoolboy',
            unlocked: false
        },
        // Red Schoolboy Shoma
        'red_schoolboy_shoma': {
            id: 'red_schoolboy_shoma',
            name: 'Red Schoolboy Shoma',
            characterId: 'schoolboy_shoma',
            description: 'An energetic red sports uniform for the ball-playing Shoma.',
            imagePath: 'Loading Screen/Red Schoolboy Shoma.png',
            price: 1500,
            rarity: 'common',
            category: 'schoolboy',
            unlocked: false
        },
        // Red Schoolgirl Julia
        'red_schoolgirl_julia': {
            id: 'red_schoolgirl_julia',
            name: 'Red Schoolgirl Julia',
            characterId: 'schoolgirl_julia',
            description: 'A striking red school uniform for the healing specialist Julia.',
            imagePath: 'Loading Screen/Red Schoolgirl Julia.png',
            price: 1500,
            rarity: 'common',
            category: 'schoolgirl',
            unlocked: false
        },
        // Red Schoolgirl Kokoro
        'red_schoolgirl_kokoro': {
            id: 'red_schoolgirl_kokoro',
            name: 'Red Schoolgirl Kokoro',
            characterId: 'schoolgirl_kokoro',
            description: 'An elegant red school dress for the mysterious Kokoro.',
            imagePath: 'Loading Screen/Red Schoolgirl Kokoro.png',
            price: 1500,
            rarity: 'common',
            category: 'schoolgirl',
            unlocked: false
        },
        // Red Schoolgirl Ayane
        'red_schoolgirl_ayane': {
            id: 'red_schoolgirl_ayane',
            name: 'Red Schoolgirl Ayane',
            characterId: 'schoolgirl_ayane',
            description: 'A vibrant red uniform for the agile butterfly master Ayane.',
            imagePath: 'Loading Screen/Red Schoolgirl Ayane.png',
            price: 1500,
            rarity: 'common',
            category: 'schoolgirl',
            unlocked: false
        },
        // Red Schoolgirl Elphelt
        'red_schoolgirl_elphelt': {
            id: 'red_schoolgirl_elphelt',
            name: 'Red Schoolgirl Elphelt',
            characterId: 'schoolgirl_elphelt',
            description: 'A passionate red school outfit for the love-powered Elphelt.',
            imagePath: 'Loading Screen/Red Schoolgirl Elphelt.png',
            price: 1500,
            rarity: 'common',
            category: 'schoolgirl',
            unlocked: false
        }
    },

    // Get all skins for a specific character
    getSkinsForCharacter(characterId) {
        return Object.values(this.skins).filter(skin => skin.characterId === characterId);
    },

    // Get skin by ID
    getSkin(skinId) {
        return this.skins[skinId] || null;
    },

    // Get all skins by category
    getSkinsByCategory(category) {
        return Object.values(this.skins).filter(skin => skin.category === category);
    },

    // Get all skins by rarity
    getSkinsByRarity(rarity) {
        return Object.values(this.skins).filter(skin => skin.rarity === rarity);
    },

    // Get all available skins
    getAllSkins() {
        return Object.values(this.skins);
    },

    // Check if skin exists
    skinExists(skinId) {
        return this.skins.hasOwnProperty(skinId);
    },

    // Get price of a skin
    getSkinPrice(skinId) {
        const skin = this.getSkin(skinId);
        return skin ? skin.price : 0;
    },

    // Get rarity colors for UI
    getRarityColor(rarity) {
        const colors = {
            'common': '#9CA3AF',
            'uncommon': '#10B981',
            'rare': '#3B82F6',
            'epic': '#8B5CF6',
            'legendary': '#F59E0B'
        };
        return colors[rarity] || colors.common;
    },

    // Get category display names
    getCategoryDisplayName(category) {
        const names = {
            'schoolboy': 'School Boys',
            'schoolgirl': 'School Girls',
            'farmer': 'Farmers',
            'special': 'Special Edition'
        };
        return names[category] || category;
    }
};

console.log('[SkinRegistry] Skin registry loaded with', Object.keys(window.SkinRegistry.skins).length, 'skins'); 