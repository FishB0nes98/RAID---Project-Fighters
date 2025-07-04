// Skin Selector JavaScript
class SkinSelector {
    constructor() {
        this.currentUserId = null;
        this.charactersWithSkins = [];
        this.selectedCharacter = null;
    }

    // Initialize the skin selector
    async init() {
        console.log('[SkinSelector] Initializing...');
        
        try {
            // Initialize skin manager
            const initialized = await window.SkinManager.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize skin manager');
            }

            // Load characters with skins
            await this.loadCharactersWithSkins();
            this.setupEventListeners();
            
            // Hide loading screen and show content
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('selector-content').style.display = 'block';
            
            console.log('[SkinSelector] Initialized successfully');
        } catch (error) {
            console.error('[SkinSelector] Initialization error:', error);
            
            // Hide loading screen
            document.getElementById('loading-screen').style.display = 'none';
            
            // Show error message instead of content
            if (error.message.includes('timeout') || error.message.includes('not signed in')) {
                this.showAuthError();
            } else {
                this.showNotification('Failed to load skin selector. Please try again.', 'error');
                document.getElementById('selector-content').style.display = 'block';
            }
        }
    }

    // Load characters that have available skins
    async loadCharactersWithSkins() {
        const allSkins = window.SkinRegistry.getAllSkins();
        const charactersMap = new Map();

        // Group skins by character
        allSkins.forEach(skin => {
            if (!charactersMap.has(skin.characterId)) {
                charactersMap.set(skin.characterId, {
                    characterId: skin.characterId,
                    characterName: this.getCharacterDisplayName(skin.characterId),
                    skins: [],
                    currentSkin: window.SkinManager.getSelectedSkin(skin.characterId),
                    ownedSkins: []
                });
            }
            
            const character = charactersMap.get(skin.characterId);
            character.skins.push(skin);
            
            if (window.SkinManager.ownsSkin(skin.id)) {
                character.ownedSkins.push(skin);
            }
        });

        // Only include characters that have owned skins
        this.charactersWithSkins = Array.from(charactersMap.values())
            .filter(character => character.ownedSkins.length > 0);

        this.displayCharacters();
        console.log(`[SkinSelector] Loaded ${this.charactersWithSkins.length} characters with skins`);
    }

    // Get display name for character
    getCharacterDisplayName(characterId) {
        const nameMap = {
            'farmer_nina': 'Farmer Nina',
            'farmer_raiden': 'Farmer Raiden',
            'farmer_alice': 'Farmer Alice',
            'farmer_shoma': 'Farmer Shoma',
            'farmer_cham_cham': 'Farmer Cham Cham',
            'atlantean_kagome': 'Atlantean Kagome',
            'atlantean_christie': 'Atlantean Christie',
            'atlantean_kotal_kahn': 'Atlantean Kotal Kahn',
            'atlantean_sub_zero': 'Atlantean Sub Zero',
            'atlantean_sub_zero_playable': 'Atlantean Sub Zero',
            'schoolboy_shoma': 'Schoolboy Shoma',
            'schoolboy_siegfried': 'Schoolboy Siegfried',
            'schoolgirl_julia': 'Schoolgirl Julia',
            'schoolgirl_ayane': 'Schoolgirl Ayane',
            'schoolgirl_elphelt': 'Schoolgirl Elphelt',
            'schoolgirl_kokoro': 'Schoolgirl Kokoro',
            'cham_cham': 'Cham Cham',
            'ayane': 'Ayane',
            'bridget': 'Bridget',
            'renée': 'Renée',
            'zoey': 'Zoey',
            'infernal_ibuki': 'Infernal Ibuki'
        };
        return nameMap[characterId] || characterId;
    }

    // Get basic character image from Loading Screen folder
    getBasicCharacterImage(characterId) {
        const imageNameMap = {
            'farmer_nina': 'Farmer Nina.png',
            'farmer_raiden': 'Farmer Raiden.png',
            'farmer_alice': 'Farmer Alice.png',
            'farmer_shoma': 'Farmer Shoma.png',
            'farmer_cham_cham': 'Farmer Cham Cham.png',
            'atlantean_kagome': 'Atlantean Kagome.png',
            'atlantean_christie': 'Atlantean Christie.png',
            'atlantean_kotal_kahn': 'Atlantean Kotal Kahn.png',
            'atlantean_sub_zero': 'Atlantean Sub Zero.png',
            'atlantean_sub_zero_playable': 'Atlantean Sub Zero.png',
            'schoolboy_shoma': 'Schoolboy Shoma.png',
            'schoolboy_siegfried': 'Schoolboy Siegfried.png',
            'schoolgirl_julia': 'Schoolgirl Julia.png',
            'schoolgirl_ayane': 'Schoolgirl Ayane.png',
            'schoolgirl_elphelt': 'Schoolgirl Elphelt.png',
            'schoolgirl_kokoro': 'Schoolgirl Kokoro.png',
            'cham_cham': 'Cham Cham.png',
            'ayane': 'Ayane.png',
            'bridget': 'Bridget.png',
            'renée': 'Renée.png',
            'zoey': 'Zoey.png',
            'infernal_ibuki': 'Infernal Ibuki.png'
        };
        
        const imageName = imageNameMap[characterId] || (characterId + '.png');
        return `Loading Screen/${imageName}`;
    }

    // Display characters in the grid
    displayCharacters() {
        const grid = document.getElementById('characters-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.charactersWithSkins.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.charactersWithSkins.map(character => this.createCharacterCard(character)).join('');

        // Add click listeners to change skin buttons
        grid.querySelectorAll('.change-skin-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const characterId = e.target.dataset.characterId;
                this.showSkinModal(characterId);
            });
        });
    }

    // Create a character card HTML
    createCharacterCard(character) {
        // Get the basic character image from Loading Screen folder
        const basicImage = this.getBasicCharacterImage(character.characterId);
        
        // Get current selected skin image (will be from Loading Screen folder too)
        const currentSkinImage = character.currentSkin ? 
            window.SkinRegistry.getSkin(character.currentSkin)?.imagePath || basicImage :
            basicImage;
        
        const currentSkinName = character.currentSkin ? 
            window.SkinRegistry.getSkin(character.currentSkin)?.name || 'Unknown Skin' : 
            'Default';

        return `
            <div class="character-card">
                <div class="character-preview">
                    <div class="character-images">
                        <div class="character-image-half">
                            <img class="character-image" src="${basicImage}" alt="Default ${character.characterName}" 
                                 onerror="this.src='Icons/characters/default.png'">
                            <div class="image-label">Default</div>
                        </div>
                        <div class="character-image-half">
                            <img class="character-image" src="${currentSkinImage}" alt="Current ${character.characterName}" 
                                 onerror="this.src='Icons/characters/default.png'">
                            <div class="image-label">Current</div>
                        </div>
                    </div>
                    <div class="skin-count-badge">${character.ownedSkins.length} skin${character.ownedSkins.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="character-info">
                    <h3 class="character-name">${character.characterName}</h3>
                    <p class="character-description">Choose from ${character.ownedSkins.length} available skin${character.ownedSkins.length !== 1 ? 's' : ''}</p>
                    <div class="character-status">
                        <span class="current-skin">Current: ${currentSkinName}</span>
                        <button class="change-skin-btn" data-character-id="${character.characterId}">
                            Change Skin
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Show skin selection modal
    showSkinModal(characterId) {
        const character = this.charactersWithSkins.find(c => c.characterId === characterId);
        if (!character) return;

        this.selectedCharacter = character;
        
        // Update modal title
        const modalTitle = document.getElementById('modal-character-name');
        modalTitle.textContent = `${character.characterName} Skins`;

        // Create skin options
        const skinOptions = document.getElementById('skin-options');
        const defaultOption = this.createSkinOption(null, character.characterId, 'Default', 
            this.getBasicCharacterImage(character.characterId), 
            !character.currentSkin);

        const ownedSkinOptions = character.ownedSkins.map(skin => 
            this.createSkinOption(skin.id, character.characterId, skin.name, skin.imagePath, 
                character.currentSkin === skin.id)
        );

        skinOptions.innerHTML = defaultOption + ownedSkinOptions.join('');

        // Add click listeners
        skinOptions.querySelectorAll('.skin-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectSkin(e.currentTarget.dataset.skinId, characterId);
            });
        });

        // Show modal
        document.getElementById('skin-modal').style.display = 'flex';
    }

    // Create skin option HTML
    createSkinOption(skinId, characterId, name, imagePath, isSelected) {
        return `
            <div class="skin-option ${isSelected ? 'selected' : ''}" data-skin-id="${skinId || 'default'}">
                <img class="skin-option-image" src="${imagePath}" alt="${name}" 
                     onerror="this.src='Icons/characters/default.png'">
                <div class="skin-option-info">
                    <h4 class="skin-option-name">${name}</h4>
                    <p class="skin-option-type">${skinId ? 'Premium Skin' : 'Default Skin'}</p>
                </div>
                ${isSelected ? '<div class="selected-indicator">✓ Selected</div>' : ''}
            </div>
        `;
    }

    // Select a skin
    async selectSkin(skinId, characterId) {
        try {
            // Convert 'default' to null for default skin
            const actualSkinId = skinId === 'default' ? null : skinId;
            
            const result = await window.SkinManager.selectSkin(characterId, actualSkinId);
            
            if (result.success) {
                const skinName = actualSkinId ? 
                    window.SkinRegistry.getSkin(actualSkinId)?.name || 'Unknown Skin' : 
                    'Default';
                
                this.showNotification(`Successfully selected ${skinName}!`, 'success');
                this.closeSkinModal();
                
                // Refresh the character display
                await this.loadCharactersWithSkins();
            } else {
                this.showNotification(result.error || 'Failed to select skin', 'error');
            }
        } catch (error) {
            console.error('[SkinSelector] Skin selection error:', error);
            this.showNotification('Failed to select skin. Please try again.', 'error');
        }
    }

    // Close skin modal
    closeSkinModal() {
        document.getElementById('skin-modal').style.display = 'none';
        this.selectedCharacter = null;
    }

    // Setup event listeners
    setupEventListeners() {
        // Modal close button
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeSkinModal();
        });

        // Click outside modal to close
        document.getElementById('skin-modal').addEventListener('click', (e) => {
            if (e.target.id === 'skin-modal') {
                this.closeSkinModal();
            }
        });
    }

    // Show authentication error
    showAuthError() {
        const selectorContent = document.getElementById('selector-content');
        selectorContent.innerHTML = `
            <div class="auth-error">
                <div class="auth-error-icon">🔒</div>
                <h2>Authentication Required</h2>
                <p>You need to be signed in to access the Skin Selector.</p>
                <div class="auth-error-actions">
                    <button class="back-button" onclick="goBack()">
                        <span>←</span> Back to Character Selection
                    </button>
                </div>
            </div>
        `;
        selectorContent.style.display = 'block';
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageEl = document.getElementById('notification-message');

        // Set content
        messageEl.textContent = message;
        icon.textContent = type === 'success' ? '✅' : '❌';
        
        // Set type class
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        // Auto hide after 4 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
}

// Global functions
function goToShop() {
    window.location.href = 'skin-shop.html';
}

function goBack() {
    window.location.href = 'character-selector.html';
}

function closeSkinModal() {
    if (window.skinSelector) {
        window.skinSelector.closeSkinModal();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.skinSelector = new SkinSelector();
    await window.skinSelector.init();
}); 