/**
 * TalentManager handles talent definitions, storage, and application.
 * 
 * CRITICAL SECURITY FEATURE: AI Character Talent Prevention
 * =========================================================
 * This system has multiple layers of protection to ensure AI characters
 * never receive user-selected talents:
 * 
 * 1. applyTalentsToCharacter() - Checks character.isAI === true and blocks
 * 2. enhanceCharacterWithTalents() - Checks character.isAI === true and blocks  
 * 3. CharacterFactory.applyTalents() - Checks character.isAI === true and blocks
 * 4. StageManager.loadPlayerCharacters() - Only applies to characters with isAI === false
 * 5. StageManager.loadAICharacters() - Never calls talent application functions
 * 
 * This ensures game balance by preventing AI enemies from getting player talents.
 */
class TalentManager {
    constructor() {
        this.talentRegistry = {};
        this.characterTalents = {};
        this.initialized = false;
        this.talentDefinitionsCache = {}; // Add cache object for talent definitions
    }

    /**
     * Initialize the talent manager
     */
    async initialize() {
        console.log("[TalentManager] Initialize started.");
        if (this.initialized) {
            console.log("[TalentManager] Already initialized. Skipping.");
            return;
        }
        
        try {
            console.log("[TalentManager] Calling preloadAllTalents...");
            await this.preloadAllTalents();
            console.log("[TalentManager] preloadAllTalents completed successfully.");
            
            console.log('TalentManager initialized successfully');
            this.initialized = true;
            console.log("[TalentManager] Initialization flag set to true.");
        } catch (error) {
            // Explicitly log the error that occurred during initialization
            console.error('[TalentManager] Initialization failed during preloadAllTalents:', error);
            throw new Error('TalentManager failed to initialize'); // Re-throw a general error
        }
    }

    /**
     * Preload all character talents
     */
    async preloadAllTalents() {
        console.log("[TalentManager] Starting preloadAllTalents...");
        try {
            // --- MODIFICATION START: Fetch registry directly ---
            let availableCharacters = [];
            try {
                const response = await fetch('js/raid-game/character-registry.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch character registry: ${response.statusText}`);
                }
                const registryData = await response.json();
                // Assuming registryData.characters is an array of {id: "...", path: "..."}
                availableCharacters = registryData.characters.map(charInfo => charInfo.id);
                console.log(`[TalentManager] Fetched available characters from registry: ${availableCharacters.length} found`, availableCharacters);
            } catch (registryError) {
                console.error("[TalentManager] Error fetching character registry:", registryError);
                // Optionally, try a fallback or just return if registry is essential
                console.warn("[TalentManager] Cannot preload talents without character registry.");
                return; // Exit preload if registry fetch fails
            }
            // --- MODIFICATION END ---

            if (!availableCharacters || availableCharacters.length === 0) {
                console.warn("[TalentManager] No available characters found in registry. Cannot preload talents.");
                return; // Don't throw error, just warn and exit preload
            }
            
            // Load talents for each character
            for (const characterId of availableCharacters) {
                console.log(`[TalentManager] Preloading talents for: ${characterId}`);
                await this.loadTalentDefinitions(characterId);
            }
            console.log("[TalentManager] Finished preloading talents for all characters.");
        } catch (error) {
            console.error('[TalentManager] Error during preloadAllTalents:', error);
            throw error; // Re-throw the error to be caught by initialize
        }
    }

    /**
     * Load talent definitions for a character (with caching)
     */
    async loadTalentDefinitions(characterId) {
        if (this.talentDefinitionsCache[characterId]) {
            return this.talentDefinitionsCache[characterId];
        }
        try {
            const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
            if (!response.ok) {
                // If 404 or other error, store null and return
                console.warn(`[TalentManager] No talent file found for ${characterId}. Status: ${response.status}`);
                this.talentDefinitionsCache[characterId] = null; 
                return null;
            }
            const data = await response.json();
            // Store the full talent definition object in talentRegistry for quick access by UI helpers like TalentsPanelManager
            // This ensures panels can access metadata (icon, description, etc.) without making additional fetches.
            this.talentRegistry[characterId] = data;
            this.talentDefinitionsCache[characterId] = data.talentTree; // Store only the talentTree part
            return data.talentTree;
        } catch (error) {
            console.error(`Error loading talent definitions for ${characterId}:`, error);
            this.talentDefinitionsCache[characterId] = null; // Cache null on error
            return null;
        }
    }

    /**
     * Get selected talents for a character from Firebase
     */
    async getSelectedTalents(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('No user ID available for fetching selected talents');
            return [];
        }

        try {
            // Corrected path
            const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).once('value');
            const selectedTalentsData = snapshot.val() || {};

            // Ensure we return an array of IDs, checking if the data is an object or array
            let selectedTalentIds = [];
            if (Array.isArray(selectedTalentsData)) {
                selectedTalentIds = selectedTalentsData; // Assume it's already an array of IDs
            } else if (typeof selectedTalentsData === 'object' && selectedTalentsData !== null) {
                selectedTalentIds = Object.keys(selectedTalentsData); // Get keys if it's an object { talentId: rank/true }
            }

            return selectedTalentIds;
        } catch (error) {
            console.error(`Error fetching selected talents for ${characterId}:`, error);
            return [];
        }
    }

    /**
     * Save selected talents for a character to Firebase
     */
    async saveSelectedTalents(characterId, selectedTalents, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for saving talents');
            throw new Error('User not authenticated');
        }

        try {
            // Corrected path
            await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).set(selectedTalents);
            console.log(`Saved talents for ${characterId}`);
            // Update local cache
            if (!this.characterTalents[characterId]) {
                this.characterTalents[characterId] = {};
            }
            this.characterTalents[characterId][userId] = selectedTalents;
            return true;
        } catch (error) {
            console.error(`Error saving talents for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Get talent points for a character
     */
    async getTalentPoints(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('No user ID available for fetching talent points');
            return 0;
        }

        try {
            const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).once('value');
            const points = snapshot.val();
            return points !== null ? points : 0; // Default to 0 if not found
        } catch (error) {
            console.error(`Error fetching talent points for ${characterId}:`, error);
            return 0;
        }
    }

    /**
     * Set talent points for a character
     */
    async setTalentPoints(characterId, points, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for setting talent points');
            throw new Error('User not authenticated');
        }

        if (typeof points !== 'number' || points < 0) {
            throw new Error('Invalid talent points value');
        }

        try {
            await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).set(points);
            console.log(`Set talent points for ${characterId}: ${points}`);
            return true;
        } catch (error) {
            console.error(`Error setting talent points for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Add talent points to a character
     */
    async addTalentPoints(characterId, pointsToAdd, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for adding talent points');
            throw new Error('User not authenticated');
        }

        if (typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
            throw new Error('Invalid talent points value');
        }

        try {
            const currentPoints = await this.getTalentPoints(characterId, userId);
            const newPoints = currentPoints + pointsToAdd;
            await this.setTalentPoints(characterId, newPoints, userId);
            console.log(`Added ${pointsToAdd} talent points to ${characterId}. New total: ${newPoints}`);
            return newPoints;
        } catch (error) {
            console.error(`Error adding talent points for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Initialize talent points for all characters (sets to 0 if not already set)
     */
    async initializeAllCharacterTalentPoints(userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for initializing talent points');
            return;
        }

        try {
            // Get all characters from the registry
            const registryResponse = await fetch('js/raid-game/character-registry.json');
            if (!registryResponse.ok) {
                throw new Error('Failed to load character registry');
            }
            
            const registry = await registryResponse.json();
            const characters = registry.characters || [];
            
            // Initialize points for each character if not already set
            const updates = {};
            for (const character of characters) {
                if (character.id && !character.isHidden) {
                    const currentPoints = await this.getTalentPoints(character.id, userId);
                    // Only set if not already initialized (to avoid overwriting existing points)
                    if (currentPoints === null) {
                        updates[`users/${userId}/characterTalentPoints/${character.id}`] = 0;
                    }
                }
            }
            
            if (Object.keys(updates).length > 0) {
                await firebaseDatabase.ref().update(updates);
                console.log(`Initialized talent points for ${Object.keys(updates).length} characters`);
            }
            
        } catch (error) {
            console.error('Error initializing character talent points:', error);
        }
    }

    /**
     * Apply talents to a character without modifying the game engine
     */
    async applyTalentsToCharacter(character, selectedTalentIds = []) {
        // CRITICAL SAFETY CHECK: Never apply user talents to AI characters
        if (!character) {
            console.log("[TalentManager] No character provided for talent application");
            return character;
        }
        
        if (character.isAI === true) {
            console.log(`[TalentManager] BLOCKED: Attempted to apply user talents to AI character ${character.name}. AI characters should not get user talents.`);
            return character;
        }
        
        if (!selectedTalentIds || !selectedTalentIds.length) {
            console.log("[TalentManager] No talents to apply or invalid character");
            return character;
        }

        console.log(`Applying talents to ${character.name}: ${selectedTalentIds.join(', ')}`);
        
        // Load talent definitions for this character
        const talentDefinitions = await this.loadTalentDefinitions(character.id);
        if (!talentDefinitions) {
            console.error(`Failed to load talent definitions for ${character.id}`);
            return character;
        }
        
        // Store applied talents on the character for reference
        character.appliedTalents = selectedTalentIds;
        
        // Apply each selected talent
        let appliedEffectsCount = 0;
        
        for (const talentId of selectedTalentIds) {
            const talent = talentDefinitions[talentId];
            if (!talent) {
                console.warn(`Talent ${talentId} not found in definitions`);
                continue;
            }
            
            console.log(`Applying talent: ${talent.name}`);
            
            // Handle talent with multiple effects (array) - check both 'effects' and 'effect'
            if (Array.isArray(talent.effects)) {
                for (const effect of talent.effects) {
                    this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } else if (Array.isArray(talent.effect)) {
                for (const effect of talent.effect) {
                    this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } 
            // Handle single effect (object) - check both 'effects' and 'effect'
            else if (talent.effects) {
                this.applyTalentEffect(character, talent.effects);
                appliedEffectsCount++;
            } else if (talent.effect) {
                this.applyTalentEffect(character, talent.effect);
                appliedEffectsCount++;
            }
            
            // For Bridget: We dispatch a talent_applied event immediately after each talent is applied
            // to ensure the talent's effects are immediately visible
            if (character.id === 'bridget') {
                console.log(`[TalentManager] Dispatching immediate talent_applied event for Bridget talent: ${talent.name} (${talentId})`);
                document.dispatchEvent(new CustomEvent('talent_applied', {
                    detail: {
                        character: character,
                        talent: talent,
                        talentId: talentId
                    }
                }));
            }
        }
        
        // Update character after all talents applied
        this.updateCharacterAfterTalent(character);
        
        // Reference abilities for description updates
        character.abilities.forEach(ability => {
            // Set caster and character reference for description generation
            ability.caster = character;
            ability.character = character;
            // Regenerate description if the ability has a custom generateDescription method
            if (typeof ability.generateDescription === 'function') {
                ability.description = ability.generateDescription();
                console.log(`[TalentManager] Regenerated description for ${ability.name}`);
            }
        });
        
        console.log(`Applied ${appliedEffectsCount} talent effects to ${character.name}`);
        
        // For Bridget: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'bridget') {
            console.log(`[TalentManager] Forcing special description update for Bridget abilities`);
            
            // Find and update specific abilities
            const qAbility = character.abilities.find(a => a.id === 'bridget_q');
            if (qAbility && qAbility.generateDescription) {
                qAbility.description = qAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated Q ability description`);
            }
            
            const wAbility = character.abilities.find(a => a.id === 'bridget_w');
            if (wAbility && wAbility.generateDescription) {
                wAbility.description = wAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated W ability description`);
            }
            
            const eAbility = character.abilities.find(a => a.id === 'bridget_e');
            if (eAbility && eAbility.generateDescription) {
                eAbility.description = eAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated E ability description`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special bridget_talents_applied event`);
            setTimeout(() => {
                const event = new CustomEvent('bridget_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                });
                document.dispatchEvent(event);
            }, 100);
        }
        
        // For Zoey: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'zoey') {
            console.log(`[TalentManager] Forcing special description update for Zoey abilities`);
            
            // Find and update specific abilities
            const wAbility = character.abilities.find(a => a.id === 'zoey_w');
            if (wAbility && typeof window.updateHeartPounceDescription === 'function') {
                wAbility.description = window.updateHeartPounceDescription(wAbility, character);
                console.log(`[TalentManager] Specifically updated Heart Pounce ability description`);
            }
            
            const eAbility = character.abilities.find(a => a.id === 'zoey_e');
            if (eAbility && typeof window.updateSparkleburstDescription === 'function') {
                eAbility.description = window.updateSparkleburstDescription(eAbility, character);
                console.log(`[TalentManager] Specifically updated Sparkle Burst ability description`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special zoey_talents_applied event`);
            setTimeout(() => {
                const event = new CustomEvent('zoey_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                });
                document.dispatchEvent(event);
            }, 100);
        }
        
        // For Siegfried: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'schoolboy_siegfried') {
            console.log(`[TalentManager] Forcing special description update for Siegfried abilities`);
            
            // Update ability descriptions if the global function exists
            if (typeof window.updateSiegfriedAbilityDescriptions === 'function') {
                window.updateSiegfriedAbilityDescriptions(character);
                console.log(`[TalentManager] Updated Siegfried ability descriptions via global function`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special siegfried_talents_applied event`);
            document.dispatchEvent(new CustomEvent('siegfried_talents_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
        }
        
        // For Schoolgirl Elphelt: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'schoolgirl_elphelt' && typeof window.updateElpheltAbilityDescriptionsForTalents === 'function') {
            console.log('[TalentManager] Updating Elphelt ability and passive descriptions');
            window.updateElpheltAbilityDescriptionsForTalents(character);
        }
        
        // For Schoolgirl Julia: update ability descriptions to reflect new talents
        if (character.id === 'schoolgirl_julia' && typeof window.updateJuliaAbilityDescriptions === 'function') {
            console.log('[TalentManager] Updating Julia ability and passive descriptions');
            setTimeout(() => {
                window.updateJuliaAbilityDescriptions(character);
            }, 100);
        }
        
        // For Schoolboy Shoma: update ability descriptions to reflect new talents
        if (character.id === 'schoolboy_shoma' && typeof window.updateShomaAbilityDescriptions === 'function') {
            console.log('[TalentManager] Updating Shoma ability descriptions');
            window.updateShomaAbilityDescriptions(character);
        }
        
        // For Schoolgirl Ayane: update ability descriptions to reflect new talents
        if (character.id === 'schoolgirl_ayane') {
            console.log('[TalentManager] Updating Schoolgirl Ayane ability descriptions');
            
            // Update Q ability description if it has a generateDescription method
            const qAbility = character.abilities.find(a => a.id === 'schoolgirl_ayane_q');
            if (qAbility && typeof qAbility.generateDescription === 'function') {
                qAbility.generateDescription();
                console.log('[TalentManager] Updated Butterfly Dagger description for talent modifications');
            }
            
            // Dispatch specific event for Ayane talent application
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('schoolgirl_ayane_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                }));
            }, 100);
        }
        
        // Get talent definitions for more detailed event
        const talentDefinitionsForEvent = await this.loadTalentDefinitions(character.id);
        if (talentDefinitionsForEvent) {
            // Dispatch talent applied event for each applied talent with detailed info
            selectedTalentIds.forEach(talentId => {
                const talent = talentDefinitionsForEvent[talentId];
                if (talent) {
                    document.dispatchEvent(new CustomEvent('talent_applied', {
                        detail: {
                            character: character,
                            talent: talent,
                            talentId: talentId
                        }
                    }));
                }
            });
        } else {
            // Fallback to simpler event if definitions aren't available
            document.dispatchEvent(new CustomEvent('talent_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
        }
        
        return character;
    }

    /**
     * Apply a specific talent effect to a character
     * Accepts either a single effect object or an array of effect objects.
     */
    applyTalentEffect(character, effectOrEffects) {
        // Handle array of effects (for talents with multiple effects)
        if (Array.isArray(effectOrEffects)) {
            console.log(`[TalentManager] Applying multiple effects (${effectOrEffects.length}) from a single talent`);
            effectOrEffects.forEach(singleEffect => {
                // Recursive call for each effect in the array
                this.applySingleTalentEffect(character, singleEffect);
            });
        } else {
            // Apply a single effect object
            this.applySingleTalentEffect(character, effectOrEffects);
        }
        // Note: updateCharacterAfterTalent is called once after all talents for a character are processed.
    }
    
    /**
     * Apply a single talent effect object to a character
     */
    applySingleTalentEffect(character, effect) {
        if (!effect || !character) return false;

        switch (effect.type) {
            case 'modify_stat':
            case 'stat_modification':
                this.applyStatModification(character, effect);
                break;
            case 'modify_ability':
            case 'ability_modification':
                this.applyAbilityModification(character, effect);
                break;
            case 'modify_passive':
                this.applyPassiveModification(character, effect);
                break;
            case 'modify_character_property':
                this.applyCharacterPropertyModification(character, effect);
                break;
            case 'add_ability':
                this.applyAddAbility(character, effect);
                break;
            case 'on_crit_heal_self_stat_buff_permanent':
                console.log(`[TalentManager] Setting up 'on_crit_heal_self_stat_buff_permanent' for ${character.name}. Effect details:`, effect);
                this.setupCritHealStatBuffListener(character, effect);
                break;
            case 'passive_modification':
                this.applyPassiveModification(character, effect);
                break;
            case 'property_modification':
                this.applyPropertyModification(character, effect);
                break;
            case 'reduce_all_cooldowns':
                this.applyReduceCooldowns(character, effect);
                break;
            case 'special':
                this.applySpecialTalentEffect(character, effect);
                break;
            default:
                console.warn(`[TalentManager] Unknown talent effect type: ${effect.type}`);
        }
    }

    /**
     * Apply special talent effects based on specialType
     */
    applySpecialTalentEffect(character, effect) {
        if (!effect.specialType) {
            console.warn(`[TalentManager] Special effect missing specialType:`, effect);
            return;
        }
        
        console.log(`[TalentManager] Applying special talent effect: ${effect.specialType} to ${character.name}`);
        
        if (effect.specialType === 'blade_mastery') {
            this.setupBladeMastery(character, effect);
        } else if (effect.specialType === 'deadly_power') {
            this.setupDeadlyPower(character, effect);
        } else if (effect.specialType === 'spectral_momentum') {
            this.setupSpectralMomentum(character, effect);
        } else if (effect.specialType === 'spectral_daggers') {
            this.setupSpectralDaggers(character, effect);
        } else {
            console.warn(`[TalentManager] Special talent type not implemented: ${effect.specialType}`);
        }
    }

    /**
     * Updates any character properties after a talent is applied
     */
    updateCharacterAfterTalent(character) {
        // Recalculate stats to ensure all modifications are applied
        if (typeof character.recalculateStats === 'function') {
            character.recalculateStats('talent_applied');
        }
        
        // Check spectral daggers activation if the talent is configured
        if (character.spectralDaggersConfig) {
            this.checkSpectralDaggersActivation(character);
        }
        
        // Update UI to reflect changes
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character);
        }
        
        // Update ability descriptions for specific characters
        if (character.id === 'schoolboy_siegfried' && typeof window.updateSiegfriedAbilityDescriptions === 'function') {
            console.log(`[TalentManager] Updating Siegfried ability descriptions`);
            setTimeout(() => {
                window.updateSiegfriedAbilityDescriptions(character);
            }, 100);
        }
        
        // Special handling for Elphelt to update ability descriptions
        if (character.id === 'schoolgirl_elphelt' && typeof window.updateElpheltAbilityDescriptionsForTalents === 'function') {
            console.log('[TalentManager] Updating Elphelt ability and passive descriptions');
            window.updateElpheltAbilityDescriptionsForTalents(character);
        }
        
        // Special handling for Ayane to update ability and passive descriptions
        if (character.id === 'schoolgirl_ayane') {
            console.log('[TalentManager] Updating Ayane ability and passive descriptions');
            
            // Update ability descriptions (Q ability with dodge chance)
            if (character.abilities) {
                character.abilities.forEach(ability => {
                    if (ability.generateDescription && typeof ability.generateDescription === 'function') {
                        ability.generateDescription();
                    }
                });
            }
            
            // Update passive description
            if (character.passiveHandler && typeof character.passiveHandler.updateDescription === 'function') {
                character.passiveHandler.updateDescription(character);
            }
        }
        
        // Dispatch talent application event
        const talentEvent = new CustomEvent('talentsApplied', {
            detail: { character: character },
            bubbles: true
        });
        document.dispatchEvent(talentEvent);
        
        console.log(`[TalentManager] Character ${character.name} updated after talent application`);
    }

    /**
     * Apply stat modification from talent
     */
    applyStatModification(character, effect) {
        // Support both 'stat' and 'statName' properties
        const statName = effect.stat || effect.statName;
        if (!statName || effect.value === undefined) {
            console.warn('Invalid stat modification effect', effect);
            return;
        }
        
        // Safety check to prevent NaN values
        if (typeof effect.value === 'number' && (isNaN(effect.value) || !isFinite(effect.value))) {
            console.error(`[TalentManager] Invalid value for stat modification: ${effect.value}, skipping effect for ${character.name}'s ${statName}`);
            return;
        }

        // --- NEW: Add flag for Reinforced Fur --- 
        if (character.id === 'farmer_alice' && statName === 'armor' && effect.operation === 'add' && effect.value === 8) {
             console.log(`[TalentManager] Setting hasReinforcedFurTalent flag for ${character.name}`);
             character.hasReinforcedFurTalent = true;
        }
        // --- END NEW ---

        // Special handling for maxMana increases - give the player the extra mana immediately
        if (statName === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const oldCurrentMana = character.stats.currentMana || character.stats.mana || 0;
            const oldMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            console.log(`[TalentManager] Before mana modification - Current: ${oldCurrentMana}, Max: ${oldMaxMana}`);
        }

        // Use the character's existing method to modify stats
        const operation = effect.operation || 'set'; // Default to set

        if (operation === 'add_base_percentage') {
            const baseVal = character.baseStats[statName] || 0;
            const addVal = baseVal * effect.value;
            console.log(`[TalentManager] add_base_percentage converted for ${statName}: base ${baseVal} + ${(effect.value*100).toFixed(1)}% = +${addVal}`);
            character.applyStatModification(statName, 'add', addVal);
            return;
        }

        character.applyStatModification(statName, operation, effect.value);
        
        // Special handling for maxMana increases - ensure current mana also increases
        if (statName === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const newMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            if (effect.operation === 'add') {
                // Increase current mana by the same amount we increased max mana
                const manaIncrease = effect.value;
                character.stats.currentMana = (character.stats.currentMana || character.stats.mana || 0) + manaIncrease;
                console.log(`[TalentManager] Increased current mana by ${manaIncrease} due to maxMana talent`);
                
                // Trigger VFX for Julia's Enhanced Mystic Reserve talent
                if (character.id === 'schoolgirl_julia' && manaIncrease === 1000 && typeof window.showEnhancedMysticReserveVFX === 'function') {
                    setTimeout(() => {
                        window.showEnhancedMysticReserveVFX(character);
                    }, 100);
                }
            } else if (effect.operation === 'set') {
                // For set operations, give full mana
                character.stats.currentMana = newMaxMana;
                console.log(`[TalentManager] Set current mana to max (${newMaxMana}) due to maxMana talent`);
            }
            
            // Make sure current mana doesn't exceed max mana
            if (character.stats.currentMana > newMaxMana) {
                character.stats.currentMana = newMaxMana;
            }
            
            console.log(`[TalentManager] After mana modification - Current: ${character.stats.currentMana}, Max: ${newMaxMana}`);
        }
        
        // Special handling for critChance increases - trigger VFX for Julia's Critical Strike Mastery
        if (statName === 'critChance' && character.id === 'schoolgirl_julia' && effect.operation === 'add' && effect.value === 0.10) {
            if (typeof window.showCriticalStrikeMasteryVFX === 'function') {
                setTimeout(() => {
                    window.showCriticalStrikeMasteryVFX(character);
                }, 100);
            }
        }
        
        // Special handling for HP increases - give the player the extra HP immediately
        if ((statName === 'hp' || statName === 'maxHp') && (effect.operation === 'add' || effect.operation === 'set')) {
            // Wait for the stat modification to be applied first
            setTimeout(() => {
                const newMaxHp = character.stats.maxHp || character.stats.hp || 0;
                const currentHp = character.stats.currentHp || character.stats.hp || 0;

                if (effect.operation === 'add') {
                    // Increase current HP by the exact amount we increased max HP
                    const hpIncrease = effect.value;
                    character.stats.currentHp = currentHp + hpIncrease;
                    console.log(`[TalentManager] Increased current HP by ${hpIncrease} due to ${statName} talent`);
                } else if (effect.operation === 'set') {
                    // For set operations, heal to full
                    character.stats.currentHp = newMaxHp;
                    console.log(`[TalentManager] Set current HP to max (${newMaxHp}) due to ${statName} talent`);
                }

                // Ensure current HP does not exceed the new maximum
                if (character.stats.currentHp > newMaxHp) {
                    character.stats.currentHp = newMaxHp;
                }

                console.log(`[TalentManager] After HP modification - Current: ${character.stats.currentHp}, Max: ${newMaxHp}`);
                
                // Update the UI to reflect the new HP values
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            }, 10);
        }
        
        console.log(`Applied stat modification to ${character.name}: ${statName} ${operation} ${effect.value}`);
    }

    /**
     * Apply ability modification from talent
     */
    applyAbilityModification(character, effect) {
        const abilityId = effect.abilityId;
        const property = effect.property;
        const operation = effect.operation || 'set';
        const value = effect.value;
        
        if (!abilityId || !property || value === undefined) {
            console.warn('Invalid ability modification effect', effect);
            return;
        }
        
        // Find the ability in the character's abilities
        const ability = character.abilities?.find(ab => ab.id === abilityId);
        if (!ability) {
            console.warn(`Ability ${abilityId} not found for character ${character.name}`);
            return;
        }
        
        // Apply the modification
        switch (operation) {
            case 'set':
                ability[property] = value;
                break;
            case 'add':
                ability[property] = (ability[property] || 0) + value;
                break;
            case 'multiply':
                ability[property] = (ability[property] || 1) * value;
                break;
            default:
                console.warn(`Unknown ability modification operation: ${operation}`);
                return;
        }
        
        console.log(`Applied ability modification to ${character.name}: ${abilityId}.${property} ${operation} ${value}`);
    }

    /**
     * Apply passive modification from talent
     */
    applyPassiveModification(character, effect) {
        if (!effect.passiveId) {
            console.warn(`[TalentManager] Passive modification missing passiveId:`, effect);
            return;
        }

        if (character.passive && character.passive.id === effect.passiveId) {
            console.log(`[TalentManager] Modifying passive ${effect.passiveId}.${effect.property} to ${effect.value}`);
            character.passive[effect.property] = effect.value;
            
            // Notify the passive handler if it exists
            if (character.passiveHandler && typeof character.passiveHandler.onTalentModified === 'function') {
                character.passiveHandler.onTalentModified(effect.property, effect.value);
            }
        } else {
            console.warn(`[TalentManager] Passive ${effect.passiveId} not found or ID mismatch.`);
        }
    }

    /**
     * Apply add ability effect from talent
     */
    applyAddAbility(character, effect) {
        if (!effect.abilityId) {
            console.warn(`[TalentManager] Add ability effect missing abilityId:`, effect);
            return;
        }

        console.log(`[TalentManager] Adding ability ${effect.abilityId} to ${character.name}`);

        try {
            // Check if AbilityFactory is available and has the ability
            if (!window.AbilityFactory) {
                console.error(`[TalentManager] AbilityFactory not available for adding ability ${effect.abilityId}`);
                return;
            }

            // Get the ability from AbilityFactory
            const abilityData = window.AbilityFactory.getAbility ? window.AbilityFactory.getAbility(effect.abilityId) : null;
            
            if (!abilityData) {
                console.error(`[TalentManager] Ability ${effect.abilityId} not found in AbilityFactory`);
                return;
            }

            // Create a new ability instance
            const newAbility = window.AbilityFactory.createAbility(abilityData);
            
            if (!newAbility) {
                console.error(`[TalentManager] Failed to create ability instance for ${effect.abilityId}`);
                return;
            }

            // Set the keybind if specified
            if (effect.keyBind) {
                newAbility.keyBind = effect.keyBind.toLowerCase();
            }

            // Check if the character already has this ability
            const existingAbilityIndex = character.abilities.findIndex(a => a.id === effect.abilityId);
            
            if (existingAbilityIndex !== -1) {
                // Replace existing ability
                character.abilities[existingAbilityIndex] = newAbility;
                console.log(`[TalentManager] Replaced existing ability ${effect.abilityId} on ${character.name}`);
            } else {
                // Add new ability
                character.abilities.push(newAbility);
                console.log(`[TalentManager] Added new ability ${effect.abilityId} to ${character.name} with keybind ${effect.keyBind || 'none'}`);
            }

            // Set character reference on the ability
            newAbility.character = character;
            newAbility.caster = character;

        } catch (error) {
            console.error(`[TalentManager] Error adding ability ${effect.abilityId} to ${character.name}:`, error);
        }
    }
}

/**
 * TalentManager handles talent definitions, storage, and application.
 * 
 * CRITICAL SECURITY FEATURE: AI Character Talent Prevention
 * =========================================================
 * This system has multiple layers of protection to ensure AI characters
 * never receive user-selected talents:
 * 
 * 1. applyTalentsToCharacter() - Checks character.isAI === true and blocks
 * 2. enhanceCharacterWithTalents() - Checks character.isAI === true and blocks  
 * 3. CharacterFactory.applyTalents() - Checks character.isAI === true and blocks
 * 4. StageManager.loadPlayerCharacters() - Only applies to characters with isAI === false
 * 5. StageManager.loadAICharacters() - Never calls talent application functions
 * 
 * This ensures game balance by preventing AI enemies from getting player talents.
 */
class TalentManager {
    constructor() {
        this.talentRegistry = {};
        this.characterTalents = {};
        this.initialized = false;
        this.talentDefinitionsCache = {}; // Add cache object for talent definitions
    }

    /**
     * Initialize the talent manager
     */
    async initialize() {
        console.log("[TalentManager] Initialize started.");
        if (this.initialized) {
            console.log("[TalentManager] Already initialized. Skipping.");
            return;
        }
        
        try {
            console.log("[TalentManager] Calling preloadAllTalents...");
            await this.preloadAllTalents();
            console.log("[TalentManager] preloadAllTalents completed successfully.");
            
            console.log('TalentManager initialized successfully');
            this.initialized = true;
            console.log("[TalentManager] Initialization flag set to true.");
        } catch (error) {
            // Explicitly log the error that occurred during initialization
            console.error('[TalentManager] Initialization failed during preloadAllTalents:', error);
            throw new Error('TalentManager failed to initialize'); // Re-throw a general error
        }
    }

    /**
     * Preload all character talents
     */
    async preloadAllTalents() {
        console.log("[TalentManager] Starting preloadAllTalents...");
        try {
            // --- MODIFICATION START: Fetch registry directly ---
            let availableCharacters = [];
            try {
                const response = await fetch('js/raid-game/character-registry.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch character registry: ${response.statusText}`);
                }
                const registryData = await response.json();
                // Assuming registryData.characters is an array of {id: "...", path: "..."}
                availableCharacters = registryData.characters.map(charInfo => charInfo.id);
                console.log(`[TalentManager] Fetched available characters from registry: ${availableCharacters.length} found`, availableCharacters);
            } catch (registryError) {
                console.error("[TalentManager] Error fetching character registry:", registryError);
                // Optionally, try a fallback or just return if registry is essential
                console.warn("[TalentManager] Cannot preload talents without character registry.");
                return; // Exit preload if registry fetch fails
            }
            // --- MODIFICATION END ---

            if (!availableCharacters || availableCharacters.length === 0) {
                console.warn("[TalentManager] No available characters found in registry. Cannot preload talents.");
                return; // Don't throw error, just warn and exit preload
            }
            
            // Load talents for each character
            for (const characterId of availableCharacters) {
                console.log(`[TalentManager] Preloading talents for: ${characterId}`);
                await this.loadTalentDefinitions(characterId);
            }
            console.log("[TalentManager] Finished preloading talents for all characters.");
        } catch (error) {
            console.error('[TalentManager] Error during preloadAllTalents:', error);
            throw error; // Re-throw the error to be caught by initialize
        }
    }

    /**
     * Load talent definitions for a character (with caching)
     */
    async loadTalentDefinitions(characterId) {
        if (this.talentDefinitionsCache[characterId]) {
            return this.talentDefinitionsCache[characterId];
        }
        try {
            const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
            if (!response.ok) {
                // If 404 or other error, store null and return
                console.warn(`[TalentManager] No talent file found for ${characterId}. Status: ${response.status}`);
                this.talentDefinitionsCache[characterId] = null; 
                return null;
            }
            const data = await response.json();
            // Store the full talent definition object in talentRegistry for quick access by UI helpers like TalentsPanelManager
            // This ensures panels can access metadata (icon, description, etc.) without making additional fetches.
            this.talentRegistry[characterId] = data;
            this.talentDefinitionsCache[characterId] = data.talentTree; // Store only the talentTree part
            return data.talentTree;
        } catch (error) {
            console.error(`Error loading talent definitions for ${characterId}:`, error);
            this.talentDefinitionsCache[characterId] = null; // Cache null on error
            return null;
        }
    }

    /**
     * Get selected talents for a character from Firebase
     */
    async getSelectedTalents(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('No user ID available for fetching selected talents');
            return [];
        }

        try {
            // Corrected path
            const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).once('value');
            const selectedTalentsData = snapshot.val() || {};

            // Ensure we return an array of IDs, checking if the data is an object or array
            let selectedTalentIds = [];
            if (Array.isArray(selectedTalentsData)) {
                selectedTalentIds = selectedTalentsData; // Assume it's already an array of IDs
            } else if (typeof selectedTalentsData === 'object' && selectedTalentsData !== null) {
                selectedTalentIds = Object.keys(selectedTalentsData); // Get keys if it's an object { talentId: rank/true }
            }

            return selectedTalentIds;
        } catch (error) {
            console.error(`Error fetching selected talents for ${characterId}:`, error);
            return [];
        }
    }

    /**
     * Save selected talents for a character to Firebase
     */
    async saveSelectedTalents(characterId, selectedTalents, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for saving talents');
            throw new Error('User not authenticated');
        }

        try {
            // Corrected path
            await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).set(selectedTalents);
            console.log(`Saved talents for ${characterId}`);
            // Update local cache
            if (!this.characterTalents[characterId]) {
                this.characterTalents[characterId] = {};
            }
            this.characterTalents[characterId][userId] = selectedTalents;
            return true;
        } catch (error) {
            console.error(`Error saving talents for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Get talent points for a character
     */
    async getTalentPoints(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('No user ID available for fetching talent points');
            return 0;
        }

        try {
            const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).once('value');
            const points = snapshot.val();
            return points !== null ? points : 0; // Default to 0 if not found
        } catch (error) {
            console.error(`Error fetching talent points for ${characterId}:`, error);
            return 0;
        }
    }

    /**
     * Set talent points for a character
     */
    async setTalentPoints(characterId, points, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for setting talent points');
            throw new Error('User not authenticated');
        }

        if (typeof points !== 'number' || points < 0) {
            throw new Error('Invalid talent points value');
        }

        try {
            await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).set(points);
            console.log(`Set talent points for ${characterId}: ${points}`);
            return true;
        } catch (error) {
            console.error(`Error setting talent points for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Add talent points to a character
     */
    async addTalentPoints(characterId, pointsToAdd, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for adding talent points');
            throw new Error('User not authenticated');
        }

        if (typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
            throw new Error('Invalid talent points value');
        }

        try {
            const currentPoints = await this.getTalentPoints(characterId, userId);
            const newPoints = currentPoints + pointsToAdd;
            await this.setTalentPoints(characterId, newPoints, userId);
            console.log(`Added ${pointsToAdd} talent points to ${characterId}. New total: ${newPoints}`);
            return newPoints;
        } catch (error) {
            console.error(`Error adding talent points for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Initialize talent points for all characters (sets to 0 if not already set)
     */
    async initializeAllCharacterTalentPoints(userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for initializing talent points');
            return;
        }

        try {
            // Get all characters from the registry
            const registryResponse = await fetch('js/raid-game/character-registry.json');
            if (!registryResponse.ok) {
                throw new Error('Failed to load character registry');
            }
            
            const registry = await registryResponse.json();
            const characters = registry.characters || [];
            
            // Initialize points for each character if not already set
            const updates = {};
            for (const character of characters) {
                if (character.id && !character.isHidden) {
                    const currentPoints = await this.getTalentPoints(character.id, userId);
                    // Only set if not already initialized (to avoid overwriting existing points)
                    if (currentPoints === null) {
                        updates[`users/${userId}/characterTalentPoints/${character.id}`] = 0;
                    }
                }
            }
            
            if (Object.keys(updates).length > 0) {
                await firebaseDatabase.ref().update(updates);
                console.log(`Initialized talent points for ${Object.keys(updates).length} characters`);
            }
            
        } catch (error) {
            console.error('Error initializing character talent points:', error);
        }
    }

    /**
     * Apply talents to a character without modifying the game engine
     */
    async applyTalentsToCharacter(character, selectedTalentIds = []) {
        // CRITICAL SAFETY CHECK: Never apply user talents to AI characters
        if (!character) {
            console.log("[TalentManager] No character provided for talent application");
            return character;
        }
        
        if (character.isAI === true) {
            console.log(`[TalentManager] BLOCKED: Attempted to apply user talents to AI character ${character.name}. AI characters should not get user talents.`);
            return character;
        }
        
        if (!selectedTalentIds || !selectedTalentIds.length) {
            console.log("[TalentManager] No talents to apply or invalid character");
            return character;
        }

        console.log(`Applying talents to ${character.name}: ${selectedTalentIds.join(', ')}`);
        
        // Load talent definitions for this character
        const talentDefinitions = await this.loadTalentDefinitions(character.id);
        if (!talentDefinitions) {
            console.error(`Failed to load talent definitions for ${character.id}`);
            return character;
        }
        
        // Store applied talents on the character for reference
        character.appliedTalents = selectedTalentIds;
        
        // Apply each selected talent
        let appliedEffectsCount = 0;
        
        for (const talentId of selectedTalentIds) {
            const talent = talentDefinitions[talentId];
            if (!talent) {
                console.warn(`Talent ${talentId} not found in definitions`);
                continue;
            }
            
            console.log(`Applying talent: ${talent.name}`);
            
            // Handle talent with multiple effects (array) - check both 'effects' and 'effect'
            if (Array.isArray(talent.effects)) {
                for (const effect of talent.effects) {
                    this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } else if (Array.isArray(talent.effect)) {
                for (const effect of talent.effect) {
                    this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } 
            // Handle single effect (object) - check both 'effects' and 'effect'
            else if (talent.effects) {
                this.applyTalentEffect(character, talent.effects);
                appliedEffectsCount++;
            } else if (talent.effect) {
                this.applyTalentEffect(character, talent.effect);
                appliedEffectsCount++;
            }
            
            // For Bridget: We dispatch a talent_applied event immediately after each talent is applied
            // to ensure the talent's effects are immediately visible
            if (character.id === 'bridget') {
                console.log(`[TalentManager] Dispatching immediate talent_applied event for Bridget talent: ${talent.name} (${talentId})`);
                document.dispatchEvent(new CustomEvent('talent_applied', {
                    detail: {
                        character: character,
                        talent: talent,
                        talentId: talentId
                    }
                }));
            }
        }
        
        // Update character after all talents applied
        this.updateCharacterAfterTalent(character);
        
        // Reference abilities for description updates
        character.abilities.forEach(ability => {
            // Set caster and character reference for description generation
            ability.caster = character;
            ability.character = character;
            // Regenerate description if the ability has a custom generateDescription method
            if (typeof ability.generateDescription === 'function') {
                ability.description = ability.generateDescription();
                console.log(`[TalentManager] Regenerated description for ${ability.name}`);
            }
        });
        
        console.log(`Applied ${appliedEffectsCount} talent effects to ${character.name}`);
        
        // For Bridget: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'bridget') {
            console.log(`[TalentManager] Forcing special description update for Bridget abilities`);
            
            // Find and update specific abilities
            const qAbility = character.abilities.find(a => a.id === 'bridget_q');
            if (qAbility && qAbility.generateDescription) {
                qAbility.description = qAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated Q ability description`);
            }
            
            const wAbility = character.abilities.find(a => a.id === 'bridget_w');
            if (wAbility && wAbility.generateDescription) {
                wAbility.description = wAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated W ability description`);
            }
            
            const eAbility = character.abilities.find(a => a.id === 'bridget_e');
            if (eAbility && eAbility.generateDescription) {
                eAbility.description = eAbility.generateDescription();
                console.log(`[TalentManager] Specifically updated E ability description`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special bridget_talents_applied event`);
            setTimeout(() => {
                const event = new CustomEvent('bridget_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                });
                document.dispatchEvent(event);
            }, 100);
        }
        
        // For Zoey: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'zoey') {
            console.log(`[TalentManager] Forcing special description update for Zoey abilities`);
            
            // Find and update specific abilities
            const wAbility = character.abilities.find(a => a.id === 'zoey_w');
            if (wAbility && typeof window.updateHeartPounceDescription === 'function') {
                wAbility.description = window.updateHeartPounceDescription(wAbility, character);
                console.log(`[TalentManager] Specifically updated Heart Pounce ability description`);
            }
            
            const eAbility = character.abilities.find(a => a.id === 'zoey_e');
            if (eAbility && typeof window.updateSparkleburstDescription === 'function') {
                eAbility.description = window.updateSparkleburstDescription(eAbility, character);
                console.log(`[TalentManager] Specifically updated Sparkle Burst ability description`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special zoey_talents_applied event`);
            setTimeout(() => {
                const event = new CustomEvent('zoey_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                });
                document.dispatchEvent(event);
            }, 100);
        }
        
        // For Siegfried: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'schoolboy_siegfried') {
            console.log(`[TalentManager] Forcing special description update for Siegfried abilities`);
            
            // Update ability descriptions if the global function exists
            if (typeof window.updateSiegfriedAbilityDescriptions === 'function') {
                window.updateSiegfriedAbilityDescriptions(character);
                console.log(`[TalentManager] Updated Siegfried ability descriptions via global function`);
            }
            
            // After all individual updates, dispatch a general update event
            console.log(`[TalentManager] Dispatching special siegfried_talents_applied event`);
            document.dispatchEvent(new CustomEvent('siegfried_talents_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
        }
        
        // For Schoolgirl Elphelt: Force-update ability descriptions to ensure they reflect talent changes
        if (character.id === 'schoolgirl_elphelt' && typeof window.updateElpheltAbilityDescriptionsForTalents === 'function') {
            console.log('[TalentManager] Updating Elphelt ability and passive descriptions');
            window.updateElpheltAbilityDescriptionsForTalents(character);
        }
        
        // For Schoolgirl Julia: update ability descriptions to reflect new talents
        if (character.id === 'schoolgirl_julia' && typeof window.updateJuliaAbilityDescriptions === 'function') {
            console.log('[TalentManager] Updating Julia ability and passive descriptions');
            setTimeout(() => {
                window.updateJuliaAbilityDescriptions(character);
            }, 100);
        }
        
        // For Schoolboy Shoma: update ability descriptions to reflect new talents
        if (character.id === 'schoolboy_shoma' && typeof window.updateShomaAbilityDescriptions === 'function') {
            console.log('[TalentManager] Updating Shoma ability descriptions');
            window.updateShomaAbilityDescriptions(character);
        }
        
        // For Schoolgirl Ayane: update ability descriptions to reflect new talents
        if (character.id === 'schoolgirl_ayane') {
            console.log('[TalentManager] Updating Schoolgirl Ayane ability descriptions');
            
            // Update Q ability description if it has a generateDescription method
            const qAbility = character.abilities.find(a => a.id === 'schoolgirl_ayane_q');
            if (qAbility && typeof qAbility.generateDescription === 'function') {
                qAbility.generateDescription();
                console.log('[TalentManager] Updated Butterfly Dagger description for talent modifications');
            }
            
            // Dispatch specific event for Ayane talent application
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('schoolgirl_ayane_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                }));
            }, 100);
        }
        
        // Get talent definitions for more detailed event
        const talentDefinitionsForEvent = await this.loadTalentDefinitions(character.id);
        if (talentDefinitionsForEvent) {
            // Dispatch talent applied event for each applied talent with detailed info
            selectedTalentIds.forEach(talentId => {
                const talent = talentDefinitionsForEvent[talentId];
                if (talent) {
                    document.dispatchEvent(new CustomEvent('talent_applied', {
                        detail: {
                            character: character,
                            talent: talent,
                            talentId: talentId
                        }
                    }));
                }
            });
        } else {
            // Fallback to simpler event if definitions aren't available
            document.dispatchEvent(new CustomEvent('talent_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
        }
        
        return character;
    }

    /**
     * Apply a specific talent effect to a character
     * Accepts either a single effect object or an array of effect objects.
     */
    applyTalentEffect(character, effectOrEffects) {
        // Handle array of effects (for talents with multiple effects)
        if (Array.isArray(effectOrEffects)) {
            console.log(`[TalentManager] Applying multiple effects (${effectOrEffects.length}) from a single talent`);
            effectOrEffects.forEach(singleEffect => {
                // Recursive call for each effect in the array
                this.applySingleTalentEffect(character, singleEffect);
            });
        } else {
            // Apply a single effect object
            this.applySingleTalentEffect(character, effectOrEffects);
        }
        // Note: updateCharacterAfterTalent is called once after all talents for a character are processed.
    }
    
    /**
     * Apply a single talent effect object to a character
     */
    applySingleTalentEffect(character, effect) {
        if (!effect || !character) return false;

        switch (effect.type) {
            case 'modify_stat':
            case 'stat_modification':
                this.applyStatModification(character, effect);
                break;
            case 'modify_ability':
            case 'ability_modification':
                this.applyAbilityModification(character, effect);
                break;
            case 'modify_passive':
                this.applyPassiveModification(character, effect);
                break;
            case 'modify_character_property':
                this.applyCharacterPropertyModification(character, effect);
                break;
            case 'add_ability':
                this.applyAddAbility(character, effect);
                break;
            case 'on_crit_heal_self_stat_buff_permanent':
                console.log(`[TalentManager] Setting up 'on_crit_heal_self_stat_buff_permanent' for ${character.name}. Effect details:`, effect);
                this.setupCritHealStatBuffListener(character, effect);
                break;
            case 'passive_modification':
                this.applyPassiveModification(character, effect);
                break;
            case 'property_modification':
                this.applyPropertyModification(character, effect);
                break;
            case 'reduce_all_cooldowns':
                this.applyReduceCooldowns(character, effect);
                break;
            case 'special':
                this.applySpecialTalentEffect(character, effect);
                break;
            default:
                console.warn(`[TalentManager] Unknown talent effect type: ${effect.type}`);
        }
    }

    /**
     * Apply special talent effects based on specialType
     */
    applySpecialTalentEffect(character, effect) {
        if (!effect.specialType) {
            console.warn(`[TalentManager] Special effect missing specialType:`, effect);
            return;
        }
        
        console.log(`[TalentManager] Applying special talent effect: ${effect.specialType} to ${character.name}`);
        
        if (effect.specialType === 'blade_mastery') {
            this.setupBladeMastery(character, effect);
        } else if (effect.specialType === 'deadly_power') {
            this.setupDeadlyPower(character, effect);
        } else if (effect.specialType === 'spectral_momentum') {
            this.setupSpectralMomentum(character, effect);
        } else if (effect.specialType === 'spectral_daggers') {
            this.setupSpectralDaggers(character, effect);
        } else {
            console.warn(`[TalentManager] Special talent type not implemented: ${effect.specialType}`);
        }
    }

    /**
     * Updates any character properties after a talent is applied
     */
    updateCharacterAfterTalent(character) {
        // Recalculate stats to ensure all modifications are applied
        if (typeof character.recalculateStats === 'function') {
            character.recalculateStats('talent_applied');
        }
        
        // Check spectral daggers activation if the talent is configured
        if (character.spectralDaggersConfig) {
            this.checkSpectralDaggersActivation(character);
        }
        
        // Update UI to reflect changes
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character);
        }
        
        // Update ability descriptions for specific characters
        if (character.id === 'schoolboy_siegfried' && typeof window.updateSiegfriedAbilityDescriptions === 'function') {
            console.log(`[TalentManager] Updating Siegfried ability descriptions`);
            setTimeout(() => {
                window.updateSiegfriedAbilityDescriptions(character);
            }, 100);
        }
        
        // Special handling for Elphelt to update ability descriptions
        if (character.id === 'schoolgirl_elphelt' && typeof window.updateElpheltAbilityDescriptionsForTalents === 'function') {
            console.log('[TalentManager] Updating Elphelt ability and passive descriptions');
            window.updateElpheltAbilityDescriptionsForTalents(character);
        }
        
        // Special handling for Ayane to update ability and passive descriptions
        if (character.id === 'schoolgirl_ayane') {
            console.log('[TalentManager] Updating Ayane ability and passive descriptions');
            
            // Update ability descriptions (Q ability with dodge chance)
            if (character.abilities) {
                character.abilities.forEach(ability => {
                    if (ability.generateDescription && typeof ability.generateDescription === 'function') {
                        ability.generateDescription();
                    }
                });
            }
            
            // Update passive description
            if (character.passiveHandler && typeof character.passiveHandler.updateDescription === 'function') {
                character.passiveHandler.updateDescription(character);
            }
        }
        
        // Dispatch talent application event
        const talentEvent = new CustomEvent('talentsApplied', {
            detail: { character: character },
            bubbles: true
        });
        document.dispatchEvent(talentEvent);
        
        console.log(`[TalentManager] Character ${character.name} updated after talent application`);
    }

    /**
     * Apply stat modification from talent
     */
    applyStatModification(character, effect) {
        // Support both 'stat' and 'statName' properties
        const statName = effect.stat || effect.statName;
        if (!statName || effect.value === undefined) {
            console.warn('Invalid stat modification effect', effect);
            return;
        }
        
        // Safety check to prevent NaN values
        if (typeof effect.value === 'number' && (isNaN(effect.value) || !isFinite(effect.value))) {
            console.error(`[TalentManager] Invalid value for stat modification: ${effect.value}, skipping effect for ${character.name}'s ${statName}`);
            return;
        }

        // --- NEW: Add flag for Reinforced Fur --- 
        if (character.id === 'farmer_alice' && statName === 'armor' && effect.operation === 'add' && effect.value === 8) {
             console.log(`[TalentManager] Setting hasReinforcedFurTalent flag for ${character.name}`);
             character.hasReinforcedFurTalent = true;
        }
        // --- END NEW ---

        // Special handling for maxMana increases - give the player the extra mana immediately
        if (statName === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const oldCurrentMana = character.stats.currentMana || character.stats.mana || 0;
            const oldMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            console.log(`[TalentManager] Before mana modification - Current: ${oldCurrentMana}, Max: ${oldMaxMana}`);
        }

        // Use the character's existing method to modify stats
        const operation = effect.operation || 'set'; // Default to set

        if (operation === 'add_base_percentage') {
            const baseVal = character.baseStats[statName] || 0;
            const addVal = baseVal * effect.value;
            console.log(`[TalentManager] add_base_percentage converted for ${statName}: base ${baseVal} + ${(effect.value*100).toFixed(1)}% = +${addVal}`);
            character.applyStatModification(statName, 'add', addVal);
            return;
        }

        character.applyStatModification(statName, operation, effect.value);
        
        // Special handling for maxMana increases - ensure current mana also increases
        if (statName === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const newMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            if (effect.operation === 'add') {
                // Increase current mana by the same amount we increased max mana
                const manaIncrease = effect.value;
                character.stats.currentMana = (character.stats.currentMana || character.stats.mana || 0) + manaIncrease;
                console.log(`[TalentManager] Increased current mana by ${manaIncrease} due to maxMana talent`);
                
                // Trigger VFX for Julia's Enhanced Mystic Reserve talent
                if (character.id === 'schoolgirl_julia' && manaIncrease === 1000 && typeof window.showEnhancedMysticReserveVFX === 'function') {
                    setTimeout(() => {
                        window.showEnhancedMysticReserveVFX(character);
                    }, 100);
                }
            } else if (effect.operation === 'set') {
                // For set operations, give full mana
                character.stats.currentMana = newMaxMana;
                console.log(`[TalentManager] Set current mana to max (${newMaxMana}) due to maxMana talent`);
            }
            
            // Make sure current mana doesn't exceed max mana
            if (character.stats.currentMana > newMaxMana) {
                character.stats.currentMana = newMaxMana;
            }
            
            console.log(`[TalentManager] After mana modification - Current: ${character.stats.currentMana}, Max: ${newMaxMana}`);
        }
        
        // Special handling for critChance increases - trigger VFX for Julia's Critical Strike Mastery
        if (statName === 'critChance' && character.id === 'schoolgirl_julia' && effect.operation === 'add' && effect.value === 0.10) {
            if (typeof window.showCriticalStrikeMasteryVFX === 'function') {
                setTimeout(() => {
                    window.showCriticalStrikeMasteryVFX(character);
                }, 100);
            }
        }
        
        // Special handling for HP increases - give the player the extra HP immediately
        if ((statName === 'hp' || statName === 'maxHp') && (effect.operation === 'add' || effect.operation === 'set')) {
            // Wait for the stat modification to be applied first
            setTimeout(() => {
                const newMaxHp = character.stats.maxHp || character.stats.hp || 0;
                const currentHp = character.stats.currentHp || character.stats.hp || 0;

                if (effect.operation === 'add') {
                    // Increase current HP by the exact amount we increased max HP
                    const hpIncrease = effect.value;
                    character.stats.currentHp = currentHp + hpIncrease;
                    console.log(`[TalentManager] Increased current HP by ${hpIncrease} due to ${statName} talent`);
                } else if (effect.operation === 'set') {
                    // For set operations, heal to full
                    character.stats.currentHp = newMaxHp;
                    console.log(`[TalentManager] Set current HP to max (${newMaxHp}) due to ${statName} talent`);
                }

                // Ensure current HP does not exceed the new maximum
                if (character.stats.currentHp > newMaxHp) {
                    character.stats.currentHp = newMaxHp;
                }

                console.log(`[TalentManager] After HP modification - Current: ${character.stats.currentHp}, Max: ${newMaxHp}`);
                
                // Update the UI to reflect the new HP values
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            }, 10);
        }
        
        console.log(`Applied stat modification to ${character.name}: ${statName} ${operation} ${effect.value}`);
    }

    /**
     * Apply ability modification from talent
     */
    applyAbilityModification(character, effect) {
        const abilityId = effect.abilityId;
        const property = effect.property;
        const operation = effect.operation || 'set';
        const value = effect.value;
        
        if (!abilityId || !property || value === undefined) {
            console.warn('Invalid ability modification effect', effect);
            return;
        }
        
        // Find the ability in the character's abilities
        const ability = character.abilities?.find(ab => ab.id === abilityId);
        if (!ability) {
            console.warn(`Ability ${abilityId} not found for character ${character.name}`);
            return;
        }
        
        // Apply the modification
        switch (operation) {
            case 'set':
                ability[property] = value;
                break;
            case 'add':
                ability[property] = (ability[property] || 0) + value;
                break;
            case 'multiply':
                ability[property] = (ability[property] || 1) * value;
                break;
            default:
                console.warn(`Unknown ability modification operation: ${operation}`);
                return;
        }
        
        console.log(`Applied ability modification to ${character.name}: ${abilityId}.${property} ${operation} ${value}`);
    }

    /**
     * Apply passive modification from talent
     */
    applyPassiveModification(character, effect) {
        if (!effect.passiveId) {
            console.warn(`[TalentManager] Passive modification missing passiveId:`, effect);
            return;
        }

        if (character.passive && character.passive.id === effect.passiveId) {
            console.log(`[TalentManager] Modifying passive ${effect.passiveId}.${effect.property} to ${effect.value}`);
            character.passive[effect.property] = effect.value;
            
            // Notify the passive handler if it exists
            if (character.passiveHandler && typeof character.passiveHandler.onTalentModified === 'function') {
                character.passiveHandler.onTalentModified(effect.property, effect.value);
            }
        } else {
            console.warn(`[TalentManager] Passive ${effect.passiveId} not found or ID mismatch.`);
        }
    }

    /**
     * Apply add ability effect from talent
     */
    async applyAddAbility(character, effect) {
        if (!effect.abilityId) {
            console.warn(`[TalentManager] Add ability effect missing abilityId:`, effect);
            return;
        }

        console.log(`[TalentManager] Adding ability ${effect.abilityId} to ${character.name}`);

        try {
            // Check if AbilityFactory is available
            if (!window.AbilityFactory) {
                console.error(`[TalentManager] AbilityFactory not available for adding ability ${effect.abilityId}`);
                return;
            }

            let abilityData = null;

            // Special handling for fan_of_knives - load from Shadow Assassin Female
            if (effect.abilityId === 'fan_of_knives') {
                try {
                    const response = await fetch('js/raid-game/characters/shadow_assassin_female.json');
                    if (!response.ok) {
                        throw new Error(`Failed to fetch shadow_assassin_female.json: ${response.status}`);
                    }
                    const shadowAssassinData = await response.json();
                    
                    // Find the fan_of_knives ability in the shadow assassin's abilities
                    abilityData = shadowAssassinData.abilities.find(ability => ability.id === 'fan_of_knives');
                    
                    if (!abilityData) {
                        console.error(`[TalentManager] fan_of_knives ability not found in shadow_assassin_female.json`);
                        return;
                    }
                    
                    console.log(`[TalentManager] Loaded fan_of_knives ability data from shadow_assassin_female.json`);
                } catch (error) {
                    console.error(`[TalentManager] Error loading fan_of_knives from shadow_assassin_female.json:`, error);
                    return;
                }
            } else {
                // For other abilities, try to get from AbilityFactory (existing logic)
                abilityData = window.AbilityFactory.getAbility ? window.AbilityFactory.getAbility(effect.abilityId) : null;
                
                if (!abilityData) {
                    console.error(`[TalentManager] Ability ${effect.abilityId} not found in AbilityFactory`);
                    return;
                }
            }

            // Create a new ability instance
            const newAbility = window.AbilityFactory.createAbility(abilityData);
            
            if (!newAbility) {
                console.error(`[TalentManager] Failed to create ability instance for ${effect.abilityId}`);
                return;
            }

            // Set the keybind if specified
            if (effect.keyBind) {
                newAbility.keyBind = effect.keyBind.toLowerCase();
            }

            // Check if the character already has this ability
            const existingAbilityIndex = character.abilities.findIndex(a => a.id === effect.abilityId);
            
            if (existingAbilityIndex !== -1) {
                // Replace existing ability
                character.abilities[existingAbilityIndex] = newAbility;
                console.log(`[TalentManager] Replaced existing ability ${effect.abilityId} on ${character.name}`);
            } else {
                // Add new ability
                character.abilities.push(newAbility);
                console.log(`[TalentManager] Added new ability ${effect.abilityId} to ${character.name} with keybind ${effect.keyBind || 'none'}`);
            }

            // Set character reference on the ability
            newAbility.character = character;
            newAbility.caster = character;

        } catch (error) {
            console.error(`[TalentManager] Error adding ability ${effect.abilityId} to ${character.name}:`, error);
        }
    }
}

// Create singleton instance
const talentManager = new TalentManager();
window.talentManager = talentManager;

// Remove the hook that's causing errors since we apply talents in stage-manager.js
// const originalCreateCharacter = CharacterFactory.prototype.createCharacter;
// CharacterFactory.prototype.createCharacter = async function(charData, selectedTalentIds = []) {
//     // Call the original method first
//     const character = await originalCreateCharacter.call(this, charData);
//     
//     // If no specific talent IDs were provided, get them from the talent manager
//     if (!selectedTalentIds || selectedTalentIds.length === 0) {
//         return await talentManager.enhanceCharacterWithTalents(character);
//     } else {
//         // Apply specific talent IDs (used when testing)
//         return await talentManager.applyTalentsToCharacter(character, selectedTalentIds);
//     }
// };
