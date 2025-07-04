// Skin VFX Manager - Handles applying skin-specific VFX classes to characters
class SkinVFXManager {
    constructor() {
        this.skinVFXMap = new Map();
        this.activeCharacterSkins = new Map();
        this.initialized = false;
    }

    // Initialize the skin VFX manager
    initialize() {
        if (this.initialized) return true;

        try {
            // Register all skin VFX mappings
            this.registerSkinVFXMappings();
            
            // Set up event listeners for character creation and skin changes
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('[SkinVFXManager] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[SkinVFXManager] Initialization failed:', error);
            return false;
        }
    }

    // Register skin VFX class mappings
    registerSkinVFXMappings() {
        // Bridget skins
        this.skinVFXMap.set('bridget_atlantean_ghost', {
            characterId: 'bridget',
            vfxClass: 'bridget-atlantean-ghost',
            cssFile: 'css/bridget_atlantean_ghost.css'
        });

        // Kokoro skins
        this.skinVFXMap.set('schoolgirl_kokoro_holy', {
            characterId: 'schoolgirl_kokoro',
            vfxClass: 'schoolgirl-kokoro-holy',
            cssFile: 'css/schoolgirl_kokoro_holy.css'
        });

        // Future skins can be added here
        // Example:
        // this.skinVFXMap.set('ayane_school_uniform', {
        //     characterId: 'ayane',
        //     vfxClass: 'ayane-school-uniform',
        //     cssFile: 'css/ayane_school_uniform.css'
        // });
    }

    // Set up event listeners for character and skin changes
    setupEventListeners() {
        // Listen for character creation events
        document.addEventListener('character:created', (event) => {
            const character = event.detail.character;
            this.applyCharacterSkinVFX(character);
        });

        // Listen for skin selection changes
        document.addEventListener('skin:selected', (event) => {
            const { characterId, skinId } = event.detail;
            this.handleSkinChange(characterId, skinId);
        });

        // Listen for character UI updates
        document.addEventListener('character:ui:updated', (event) => {
            const character = event.detail.character;
            this.applyCharacterSkinVFX(character);
        });

        // Listen for stage/battle start to apply skins
        document.addEventListener('battle:started', () => {
            this.applyAllActiveSkins();
        });
    }

    // Apply skin VFX to a character
    applyCharacterSkinVFX(character, retryCount = 0) {
        if (!character || !character.id) return;

        const characterId = character.id;
        const instanceId = character.instanceId || character.id;
        
        // Get the character element
        const characterElement = document.getElementById(`character-${instanceId}`);
        
        if (!characterElement) {
            if (retryCount < 10) { // Retry up to 10 times (1 second total)
                setTimeout(() => this.applyCharacterSkinVFX(character, retryCount + 1), 100);
            } else {
                console.error(`[SkinVFXManager] Character element not found for ${instanceId} after multiple retries.`);
            }
            return;
        }

        // Get the selected skin for this character
        const selectedSkin = window.SkinManager ? 
            window.SkinManager.getSelectedSkin(characterId) : null;

        // Remove any existing skin VFX classes
        this.removeAllSkinVFXClasses(characterElement, characterId);

        // Apply new skin VFX if a skin is selected
        if (selectedSkin && this.skinVFXMap.has(selectedSkin)) {
            const skinVFX = this.skinVFXMap.get(selectedSkin);
            characterElement.classList.add(skinVFX.vfxClass);
            
            // Store the active skin for this character
            this.activeCharacterSkins.set(instanceId, selectedSkin);
            
            console.log(`[SkinVFXManager] Applied skin VFX ${skinVFX.vfxClass} to character ${instanceId}`);
        } else {
            // Remove from active skins if no skin is selected
            this.activeCharacterSkins.delete(instanceId);
        }
    }

    // Remove all skin VFX classes for a character
    removeAllSkinVFXClasses(characterElement, characterId) {
        // Get all registered skin VFX classes for this character
        const characterSkins = Array.from(this.skinVFXMap.values())
            .filter(skin => skin.characterId === characterId);
        
        characterSkins.forEach(skin => {
            characterElement.classList.remove(skin.vfxClass);
        });
    }

    // Handle skin change event
    handleSkinChange(characterId, skinId) {
        // Find all character instances of this character type
        const characterElements = document.querySelectorAll(`[data-character-id="${characterId}"]`);
        
        characterElements.forEach(element => {
            const instanceId = element.id.replace('character-', '');
            
            // Remove existing skin VFX classes
            this.removeAllSkinVFXClasses(element, characterId);
            
            // Apply new skin VFX if a skin is selected
            if (skinId && this.skinVFXMap.has(skinId)) {
                const skinVFX = this.skinVFXMap.get(skinId);
                element.classList.add(skinVFX.vfxClass);
                this.activeCharacterSkins.set(instanceId, skinId);
                
                console.log(`[SkinVFXManager] Changed skin VFX for ${characterId} to ${skinVFX.vfxClass}`);
            } else {
                this.activeCharacterSkins.delete(instanceId);
            }
        });
    }

    // Apply all active skins (useful for battle start)
    applyAllActiveSkins() {
        if (!window.SkinManager) return;

        // Get all character elements
        const characterElements = document.querySelectorAll('[id^="character-"]');
        
        characterElements.forEach(element => {
            const instanceId = element.id.replace('character-', '');
            const characterId = element.getAttribute('data-character-id');
            
            if (characterId) {
                // Create a mock character object for applying VFX
                const character = {
                    id: characterId,
                    instanceId: instanceId
                };
                
                this.applyCharacterSkinVFX(character);
            }
        });
    }

    // Get the VFX class for a character's current skin
    getCharacterSkinVFXClass(characterId) {
        const selectedSkin = window.SkinManager ? 
            window.SkinManager.getSelectedSkin(characterId) : null;
        
        if (selectedSkin && this.skinVFXMap.has(selectedSkin)) {
            return this.skinVFXMap.get(selectedSkin).vfxClass;
        }
        
        return null;
    }

    // Check if a character has a specific skin VFX active
    hasCharacterSkinVFX(characterId, skinId) {
        return this.activeCharacterSkins.has(characterId) && 
               this.activeCharacterSkins.get(characterId) === skinId;
    }

    // Check if a character has a specific skin active (compatibility method)
    hasActiveSkin(character, skinId) {
        if (!character) return false;
        
        const instanceId = character.instanceId || character.id;
        const characterId = character.id;
        
        // Check if this character instance has the specific skin active
        return this.activeCharacterSkins.has(instanceId) && 
               this.activeCharacterSkins.get(instanceId) === skinId;
    }

    // Manually apply skin VFX to a character element
    applySkinVFXToElement(element, skinId) {
        if (!skinId || !this.skinVFXMap.has(skinId)) return false;

        const skinVFX = this.skinVFXMap.get(skinId);
        element.classList.add(skinVFX.vfxClass);
        
        return true;
    }

    // Remove skin VFX from a character element
    removeSkinVFXFromElement(element, skinId) {
        if (!skinId || !this.skinVFXMap.has(skinId)) return false;

        const skinVFX = this.skinVFXMap.get(skinId);
        element.classList.remove(skinVFX.vfxClass);
        
        return true;
    }
}

// Create global instance
window.SkinVFXManager = new SkinVFXManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SkinVFXManager.initialize();
    });
} else {
    // DOM is already ready
    window.SkinVFXManager.initialize();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkinVFXManager;
}
