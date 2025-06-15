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
                this.talentDefinitionsCache[characterId] = null; 
                return null;
            }
            const data = await response.json();
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
            
            // Handle talent with multiple effects (array)
            if (Array.isArray(talent.effect)) {
                for (const effect of talent.effect) {
                    this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } 
            // Handle single effect (object)
            else if (talent.effect) {
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
            document.dispatchEvent(new CustomEvent('bridget_talents_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
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
            document.dispatchEvent(new CustomEvent('zoey_talents_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
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
                this.applyStatModification(character, effect);
                break;
            case 'modify_ability':
                const ability = character.abilities.find(a => a.id === effect.abilityId);
                if (!ability) {
                    console.warn(`Cannot modify ability [${effect.abilityId}] - not found on character ${character.name}`);
                    return false;
                }
                
                // Get the property to modify
                const property = effect.property;
                const value = effect.value;
                const operation = effect.operation || 'set';
                
                // Apply the modification
                if (operation === 'set') {
                    ability[property] = value;
                } else if (operation === 'add') {
                    if (typeof ability[property] === 'undefined') {
                        ability[property] = value;
                    } else if (typeof ability[property] === 'number') {
                        ability[property] += value;
                    } else {
                        console.warn(`Cannot add to non-numeric ability property: ${property}`);
                    }
                } else if (operation === 'subtract') {
                    if (typeof ability[property] === 'number') {
                        ability[property] -= value;
                        // Make sure cooldown doesn't go below 0
                        if (property === 'cooldown' && ability[property] < 0) {
                            ability[property] = 0;
                        }
                    } else {
                        console.warn(`Cannot subtract from non-numeric ability property: ${property}`);
                    }
                } else if (operation === 'multiply') {
                    if (typeof ability[property] === 'number') {
                        ability[property] *= value;
                    } else {
                        console.warn(`Cannot multiply non-numeric ability property: ${property}`);
                    }
                }
                
                // Special handling for Primal Healing
                if (property === 'enablePrimalHealing' && value === true) {
                    console.log(`Enabling Primal Healing for ${character.name}'s ${ability.name}`);
                    // Make sure the ability description is updated
                    if (typeof ability.generateDescription === 'function') {
                        ability.generateDescription();
                    }
                    
                    // If the character has a method to update ability descriptions, call it
                    if (character.updateAbilityDescriptions && typeof character.updateAbilityDescriptions === 'function') {
                        character.updateAbilityDescriptions();
                    }
                    
                    // Fire a custom event that the passive can listen for
                    const talentAppliedEvent = new CustomEvent('TalentApplied', {
                        detail: {
                            talentId: 'primal_healing',
                            character: character,
                            ability: ability
                        }
                    });
                    document.dispatchEvent(talentAppliedEvent);
                }
                
                // Update ability description if needed
                if (ability.generateDescription && typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                }
                break;
            case 'add_ability':
                this.applyAddAbility(character, effect);
                break;
            case 'modify_passive':
                this.applyPassiveModification(character, effect);
                break;
            case 'modify_character_property':
                this.applyCharacterPropertyModification(character, effect);
                break;
            case 'on_crit_heal_self_stat_buff_permanent':
                console.log(`[TalentManager] Setting up 'on_crit_heal_self_stat_buff_permanent' for ${character.name}. Effect details:`, effect);
                this.setupCritHealStatBuffListener(character, effect);
                break;
            default:
                console.warn(`[TalentManager] Unknown talent effect type: ${effect.type}`);
        }
    }

    /**
     * Updates any character properties after a talent is applied
     */
    updateCharacterAfterTalent(character) {
        if (!character) return;
        
        // Check if character has Firebase stats loaded (indicated by hellEffects or other story-specific properties)
        const hasFirebaseStats = character.hellEffects || character._firebaseStatsLoaded;
        
        if (hasFirebaseStats) {
            console.log(`[TalentManager] Skipping recalculateStats for ${character.name || character.id} - Firebase stats detected`);
        } else {
            // Recalculate stats after talent application only if no Firebase stats are present
            console.log(`[TalentManager] Recalculating stats for ${character.name || character.id} after talent application`);
            if (typeof character.recalculateStats === 'function') {
                character.recalculateStats('talent-application');
            }
        }
        
        // Update ability descriptions after talent application
        if (character.abilities && Array.isArray(character.abilities)) {
            for (const ability of character.abilities) {
                if (ability && typeof ability.generateDescription === 'function') {
                    try {
                        ability.generateDescription();
                        console.log(`[TalentManager] Updated description for ability ${ability.name || ability.id}`);
                    } catch (error) {
                        console.error(`[TalentManager] Error updating description for ability ${ability.name || ability.id}:`, error);
                    }
                }
            }
        }
        
        // Update passive description if there's a passive handler with the update method
        if (character.passiveHandler && typeof character.passiveHandler.updatePassiveDescription === 'function') {
            try {
                character.passiveHandler.updatePassiveDescription(character);
                console.log(`[TalentManager] Updated passive description for ${character.name}`);
            } catch (error) {
                console.error(`[TalentManager] Error updating passive description for ${character.name}:`, error);
            }
        }
        // --- NEW: Check for direct method on character ---
        else if (typeof character.generatePassiveDescription === 'function') {
            try {
                character.generatePassiveDescription();
                console.log(`[TalentManager] Updated passive description directly for ${character.name}`);
            } catch (error) {
                console.error(`[TalentManager] Error updating passive description directly for ${character.name}:`, error);
            }
        }
        // --- END NEW ---
        
        // Special handling for Schoolgirl Kokoro's ability descriptions
        if (character.id === 'schoolgirl_kokoro') {
            console.log(`[TalentManager] Updating Schoolgirl Kokoro's ability descriptions`);
            
            // Update Lesser Heal description
            const lesserHealAbility = character.abilities.find(a => a.id === 'lesser_heal');
            if (lesserHealAbility && typeof lesserHealAbility.generateDescription === 'function') {
                lesserHealAbility.updateCaster(character);
                lesserHealAbility.description = lesserHealAbility.generateDescription();
                console.log(`[TalentManager] Updated Lesser Heal description for ${character.name}`);
            }
            
            // Update passive indicator tooltip
            if (typeof character.generatePassiveDescription === 'function') {
                character.generatePassiveDescription();
                
                // Update existing passive indicator tooltip if it exists
                setTimeout(() => {
                    const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
                    if (characterElement) {
                        const passiveIndicator = characterElement.querySelector('.kokoro-passive');
                        if (passiveIndicator) {
                            const passiveDescription = character.generatePassiveDescription();
                            const tooltipDescription = passiveDescription.replace(/<[^>]*>/g, '');
                            passiveIndicator.title = `Healing Feedback: ${tooltipDescription}`;
                            console.log(`[TalentManager] Updated passive indicator tooltip for ${character.name}`);
                        }
                    }
                }, 100);
            }
        }
        
        // Update UI if needed
        if (typeof updateCharacterUI === 'function') {
            try {
                updateCharacterUI(character);
                console.log(`[TalentManager] Updated UI for ${character.name || character.id} after talent application`);
            } catch (error) {
                console.warn(`[TalentManager] Error updating UI for ${character.name || character.id}:`, error);
            }
        }
    }

    /**
     * Apply stat modification from talent
     */
    applyStatModification(character, effect) {
        if (!effect.stat || effect.value === undefined) {
            console.warn('Invalid stat modification effect', effect);
            return;
        }

        // --- NEW: Add flag for Reinforced Fur --- 
        if (character.id === 'farmer_alice' && effect.stat === 'armor' && effect.operation === 'add' && effect.value === 8) {
             console.log(`[TalentManager] Setting hasReinforcedFurTalent flag for ${character.name}`);
             character.hasReinforcedFurTalent = true;
        }
        // --- END NEW ---

        // Special handling for maxMana increases - give the player the extra mana immediately
        if (effect.stat === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const oldCurrentMana = character.stats.currentMana || character.stats.mana || 0;
            const oldMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            console.log(`[TalentManager] Before mana modification - Current: ${oldCurrentMana}, Max: ${oldMaxMana}`);
        }

        // Use the character's existing method to modify stats
        const operation = effect.operation || 'set'; // Default to set
        character.applyStatModification(effect.stat, operation, effect.value);
        
        // Special handling for maxMana increases - ensure current mana also increases
        if (effect.stat === 'maxMana' && (effect.operation === 'add' || effect.operation === 'set')) {
            const newMaxMana = character.stats.maxMana || character.stats.mana || 0;
            
            if (effect.operation === 'add') {
                // Increase current mana by the same amount we increased max mana
                const manaIncrease = effect.value;
                character.stats.currentMana = (character.stats.currentMana || character.stats.mana || 0) + manaIncrease;
                console.log(`[TalentManager] Increased current mana by ${manaIncrease} due to maxMana talent`);
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
        
        console.log(`Applied stat modification to ${character.name}: ${effect.stat} ${operation} ${effect.value}`);
    }

    /**
     * NEW: Apply character property modification from talent
     */
    applyCharacterPropertyModification(character, effect) {
        const property = effect.property;
        const value = effect.value;
        
        // <<< ADDED SPECIFIC LOGGING >>>
        if (property === 'farmerResiliencePhysicalDamageBoost') {
            console.log(`[TalentManager] Setting ${character.name}.${property} = ${value}`);
        } else {
             console.log(`Applying property modification: ${property} = ${value} for ${character.name}`);
        }
        // <<< END SPECIFIC LOGGING >>>
        
        // --- NEW: Directly set the property on the character object --- 
        character[property] = value;
        console.log(`[TalentManager] Set character.${property} = ${value}`);
        
        // Update ability descriptions for Zoey's improved talents
        if (character.id === 'zoey') {
            let descriptionUpdated = false;
            if (property === 'enableImprovedSparkleburst') {
                const sparkleburstAbility = character.abilities.find(a => a.id === 'zoey_e');
                if (sparkleburstAbility && typeof window.updateSparkleburstDescription === 'function') {
                    sparkleburstAbility.description = window.updateSparkleburstDescription(sparkleburstAbility, character);
                    console.log(`[TalentManager] Updated Sparkle Burst description for talent`);
                    descriptionUpdated = true;
                }
            } else if (property === 'enableImprovedHeartPounce' || property === 'enableEnhancedHeartPounce') {
                const heartPounceAbility = character.abilities.find(a => a.id === 'zoey_w');
                if (heartPounceAbility && typeof window.updateHeartPounceDescription === 'function') {
                    heartPounceAbility.description = window.updateHeartPounceDescription(heartPounceAbility, character);
                    console.log(`[TalentManager] Updated Heart Pounce description for talent`);
                    descriptionUpdated = true;
                }
            } else if (property === 'enableSparklePounce') {
                const sparkleburstAbility = character.abilities.find(a => a.id === 'zoey_e');
                if (sparkleburstAbility && typeof window.updateSparkleburstDescription === 'function') {
                    sparkleburstAbility.description = window.updateSparkleburstDescription(sparkleburstAbility, character);
                    console.log(`[TalentManager] Updated Sparkle Burst description for Sparkle Pounce talent`);
                    descriptionUpdated = true;
                }
            } else if (property === 'enableEnhancedLightArc') {
                const glowingLightArcAbility = character.abilities.find(a => a.id === 'zoey_r');
                if (glowingLightArcAbility && typeof window.updateGlowingLightArcDescription === 'function') {
                    glowingLightArcAbility.description = window.updateGlowingLightArcDescription(glowingLightArcAbility, character);
                    console.log(`[TalentManager] Updated Glowing Light Arc description for Enhanced Light Arc talent`);
                    descriptionUpdated = true;
                }
            } else if (property === 'enableDoubleBellMark') {
                // Double Bell Mark doesn't change ability descriptions, but we could log it
                console.log(`[TalentManager] Applied Double Bell Mark talent to ${character.name}`);
            } else if (property === 'enableBellRecast') {
                // Bell Recast talent - update Strawberry Bell Burst description
                const strawberryBellAbility = character.abilities.find(a => a.id === 'zoey_q');
                if (strawberryBellAbility && typeof window.updateStrawberryBellDescription === 'function') {
                    strawberryBellAbility.description = window.updateStrawberryBellDescription(strawberryBellAbility, character);
                    console.log(`[TalentManager] Updated Strawberry Bell Burst description for Bell Recast talent`);
                    descriptionUpdated = true;
                }
            } else if (property === 'enableSparkleBellHealing') {
                // Sparkle Bell Healing doesn't change ability descriptions directly, but we log it
                console.log(`[TalentManager] Applied Sparkle Bell Healing talent to ${character.name}`);
            } else if (property === 'enableBellMastery') {
                // Bell Mastery talent - update Strawberry Bell Burst description and target type
                const strawberryBellAbility = character.abilities.find(a => a.id === 'zoey_q');
                if (strawberryBellAbility) {
                    // Update target type to all_enemies when Bell Mastery is active
                    strawberryBellAbility.targetType = 'all_enemies';
                    console.log(`[TalentManager] Changed Strawberry Bell Burst target type to all_enemies for Bell Mastery`);
                    
                    // Update description
                    if (typeof window.updateStrawberryBellDescription === 'function') {
                        strawberryBellAbility.description = window.updateStrawberryBellDescription(strawberryBellAbility, character);
                        console.log(`[TalentManager] Updated Strawberry Bell Burst description for Bell Mastery talent`);
                        descriptionUpdated = true;
                    }
                }
                console.log(`[TalentManager] Applied Bell Mastery talent to ${character.name} - Strawberry Bell Burst now hits ALL ENEMIES`);
            }
            
            // Trigger UI update if description was changed
            if (descriptionUpdated) {
                document.dispatchEvent(new CustomEvent('abilityDescriptionUpdated', {
                    detail: { character: character }
                }));
            }
        }
        // --- END NEW ---

        // Existing switch for specific side effects (can be removed if direct assignment is enough)
        /*
        switch (property) {
            case 'powerGrowth':
                // Raiden's passive: gain power every 10 turns
                character.powerGrowth = value;
                break;
                
            case 'lowHealthDodge':
                // Raiden's passive: gain dodge when below 50% HP
                character.lowHealthDodge = value;
                break;
                
            case 'critOnBuff':
                // Raiden's passive: gain crit when receiving a buff
                character.critOnBuff = value;
                break;
                
            case 'stunningZap':
                // Raiden's passive: zap has chance to stun
                character.stunningZap = value;
                break;
                
            case 'zapLifesteal':
                // Raiden's passive: zap heals based on damage
                character.zapLifesteal = value;
                break;
                
            case 'permanentThunderShield':
                // Raiden's talent: start with permanent shield
                character.permanentThunderShield = value;
                // If player has a passive system loaded, apply the effect
                if (window.FarmerRaidenPassive) {
                    try {
                        const applyPermanentShield = window.applyPermanentThunderShield;
                        if (typeof applyPermanentShield === 'function') {
                            applyPermanentShield(character);
                            console.log(`Applied permanent thunder shield to ${character.name}`);
                        } else {
                            console.warn('applyPermanentThunderShield function not found');
                        }
                    } catch (error) {
                        console.error('Error applying permanent thunder shield:', error);
                    }
                }
                break;
                
            case 'initialMagicalShield':
                // Raiden's talent: start with magical shield
                character.initialMagicalShield = value;
                // Apply initial shield effect (15%)
                character.stats.magicalShield += 15;
                console.log(`Applied initial magical shield to ${character.name}: +15%`);
                break;
                
            case 'stormEmpowerment':
                // Raiden's talent: gain magical damage on stun
                character.stormEmpowerment = value;
                break;
                
            case 'zapDamageMultiplier':
                // Raiden's talent: increase zap damage scaling
                character.zapDamageMultiplier = value;
                break;
                
            case 'growingPower':
                // Raiden's talent: gain magical damage on ability use
                character.growingPower = value;
                console.log(`Applied Growing Power talent to ${character.name}`);
                break;
                
            case 'teamHealthAura':
                // Handle the team health aura property for Farmer Shoma
                if (character.id === 'farmer_shoma') {
                    console.log(`[TalentManager] Setting up Nurturing Aura talent for ${character.name}`);
                    console.log(`[TalentManager] Self bonus: +${value.selfBonus} HP, Ally bonus: +${value.allyBonus} HP`);
                }
                break;
                
            case 'primalFuryPassive':
                // Primal Fury passive for Night Hunter Ayane
                console.log(`[TalentManager] Setting up Primal Fury passive for ${character.name}`);
                break;
                
            // --- Farmer Shoma Specific Properties ---
            case 'passiveCritBoostValue':
                character.passiveCritBoostValue = value; // Set the value for passive handler
                console.log(`Set ${character.name}'s passiveCritBoostValue to ${value}`);
                break;
                
            case 'passiveTriggerTurn':
                character.passiveTriggerTurn = value; // Set the value for passive handler
                console.log(`Set ${character.name}'s passiveTriggerTurn to ${value}`);
                break;
                
            case 'criticalHealProc':
                character.criticalHealProc = value; // Set the value for passive handler
                console.log(`Set ${character.name}'s criticalHealProc amount to ${value}`);
                break;
                
            case 'critLifestealBoost':
                character.critLifestealBoost = value; // Set the value for passive handler
                console.log(`Set ${character.name}'s critLifestealBoost to ${value}`);
                break;
            // --- End Farmer Shoma Specific Properties ---
                
            // --- NEW: Raiden Relentless Storm talent ---
            case 'reduceShockOnAbilityUse':
                character.reduceShockOnAbilityUse = value;
                console.log(`Set ${character.name}'s reduceShockOnAbilityUse to ${value}`);
                break;
            // --- END NEW ---

            // --- NEW: Farmer Alice Quick Reflexes talent ---
            case 'chanceToReduceCooldownsOnHit':
                character.chanceToReduceCooldownsOnHit = value;
                console.log(`Set ${character.name}'s chanceToReduceCooldownsOnHit to ${value}`);
                break;
            // --- END NEW ---

            // --- NEW: Farmer Alice Adaptive Defense talent ---
            case 'bonusHpPerEnemy':
                character.bonusHpPerEnemy = value;
                console.log(`Set ${character.name}'s bonusHpPerEnemy to ${value}`);
                // The actual HP bonus will be applied when the battle starts
                break;
            // --- END NEW ---

            default:
                console.warn(`Unknown character property modification: ${property}`);
                break;
        }
        */
    }

    /**
     * Apply ability modification from talent
     */
    applyAbilityModification(character, effect) {
        if (!effect.abilityId || !effect.property || effect.value === undefined) {
            console.warn('Invalid ability modification effect', effect);
            return;
        }

        const abilityToModify = character.abilities.find(a => a.id === effect.abilityId);
        if (abilityToModify) {
            // Store the modification details (optional, mainly for debugging or complex logic)
            abilityToModify.talentModifiers = abilityToModify.talentModifiers || {};
            abilityToModify.talentModifiers[effect.property] = effect.value;
            
            // Directly modify the ability property value
            abilityToModify[effect.property] = effect.value;
            console.log(`[TalentManager] Applied DIRECT MODIFICATION: Set ${character.name}'s ability ${effect.abilityId} property ${effect.property} to ${effect.value}`);
            
            // Special handling for target type changes
            if (effect.property === 'canTargetEnemies' && effect.value === true) {
                console.log(`[TalentManager] Enabling enemy targeting for ${character.name}'s ${effect.abilityId}`);
                // The ability's getTargetType method will handle the dynamic change
            }
            
            // Special handling for Bridget's Focused Barrage talent affecting W ability
            if (character.id === 'bridget' && effect.abilityId === 'bridget_w') {
                console.log(`[TalentManager] Special handling for Bridget's W ability modification: ${effect.property} = ${effect.value}`);
                
                // If damageScaling is changed (Focused Barrage talent)
                if (effect.property === 'damageScaling') {
                    console.log(`[TalentManager] Bridget's Focused Barrage talent detected - damageScaling modified to ${effect.value}`);
                    // Ensure we update bubble beam description
                    if (typeof abilityToModify.generateDescription === 'function') {
                        abilityToModify.description = abilityToModify.generateDescription();
                        console.log(`[TalentManager] Specifically updated W ability description for damageScaling change`);
                    }
                    // Force trigger an event to let the UI know
                    document.dispatchEvent(new CustomEvent('bridget_w_modified', {
                        detail: {
                            character: character,
                            ability: abilityToModify,
                            property: effect.property,
                            value: effect.value
                        }
                    }));
                }
                
                // If cooldown is changed (Focused Barrage talent)
                if (effect.property === 'cooldown') {
                    console.log(`[TalentManager] Bridget's Focused Barrage talent detected - cooldown modified to ${effect.value}`);
                    // Ensure we update bubble beam description
                    if (typeof abilityToModify.generateDescription === 'function') {
                        abilityToModify.description = abilityToModify.generateDescription();
                        console.log(`[TalentManager] Specifically updated W ability description for cooldown change`);
                    }
                }
            }
            
            // --- IMPORTANT: Regenerate description AFTER modification --- 
            if (typeof abilityToModify.generateDescription === 'function') {
                try {
                    abilityToModify.generateDescription(); // Generate description right after direct modification
                    console.log(`  - Regenerated description for ${effect.abilityId} after direct talent application.`);
                } catch (error) {
                    console.error(`[TalentManager] Error regenerating description for ability ${effect.abilityId}:`, error);
                }
            }
            // --- END DESCRIPTION REGENERATION ---
            
            // Apply side effects specific to certain ability modifications
            if (effect.abilityId === 'farmer_boomerang' && effect.property === 'extraHitsChance') {
                // Potentially update UI or other elements related to Boomerang hits
                console.log(`  - Updated Farmer Cham Cham's Boomerang extra hit chance.`);
            } else if (effect.abilityId === 'farmer_leap' && effect.property === 'additionalLifestealBuff') {
                 // Potentially update UI or other elements related to Leap buff
                console.log(`  - Updated Farmer Cham Cham's Leap to grant lifesteal buff.`);
            } else if (effect.abilityId === 'infernal_scorch' && effect.property === 'baseDamagePercentage') {
                // If modifying Infernal Scorch damage for Astaroth
                console.log(`  - Updated Infernal Astaroth's Scorch damage scaling.`);
            } else if (effect.abilityId === 'infernal_scorch' && effect.property === 'dotDamagePercentage') {
                // If modifying Infernal Scorch DoT for Astaroth
                console.log(`  - Updated Infernal Astaroth's Scorch DoT scaling.`);
            } else if (effect.abilityId === 'lightning_zap' && effect.property === 'baseDamagePercent') {
                 // If modifying Raiden's Zap damage
                 console.log(`  - Updated Farmer Raiden's Zap damage scaling.`);
            } else if (effect.abilityId === 'shocking_touch' && effect.property === 'bonusDamageOnStunned') {
                 // If modifying Raiden's Shocking Touch bonus damage
                 console.log(`  - Updated Farmer Raiden's Shocking Touch bonus damage on stunned targets.`);
            } else if (effect.abilityId === 'apple_throw' && effect.property === 'casterHealPercent') {
                 // If modifying Farmer Shoma's Apple Throw self-heal
                 console.log(`  - Updated Farmer Shoma's Apple Throw self-heal percentage.`);
            } else if (effect.abilityId === 'apple_throw' && effect.property === 'appliesHealingPowerBuff') {
                 // If modifying Farmer Shoma's Apple Throw healing power buff application
                 console.log(`  - Updated Farmer Shoma's Apple Throw to apply stacking Healing Power buff.`);
            } else if (effect.abilityId === 'root_armor' && effect.property === 'thornsDamagePercent') {
                 // If modifying Farmer Alice's Root Armor thorns damage
                 console.log(`  - Updated Farmer Alice's Root Armor thorns damage.`);
            }
            // Add other specific checks if needed
            
        } else {
            console.warn(`[TalentManager] Ability ${effect.abilityId} not found on character ${character.name}.`);
        }
    }

    /**
     * Apply add ability effect from talent
     */
    applyAddAbility(character, effect) {
        if (!effect.ability) {
            console.warn('Invalid add ability effect', effect);
            return;
        }

        // Add the new ability
        character.addAbility(effect.ability);
        console.log(`Added ability ${effect.ability.name} to ${character.name}`);
    }

    /**
     * Apply passive modification from talent
     */
    applyPassiveModification(character, effect) {
        if (!effect.property || effect.value === undefined) {
            console.warn('Invalid passive modification effect', effect);
            return;
        }

        // Modify the passive
        if (character.passive) {
            const operation = effect.operation || 'set'; // Default to set
            
            if (operation === 'set') {
                character.passive[effect.property] = effect.value;
            } else if (operation === 'add') {
                character.passive[effect.property] += effect.value;
            } else if (operation === 'multiply') {
                character.passive[effect.property] *= effect.value;
            }
            
            console.log(`Applied passive modification to ${character.name}: ${effect.property} ${operation} ${effect.value}`);
        } else {
            console.warn(`Character ${character.name} has no passive ability to modify`);
        }
    }

    /**
     * Hook into character creation process to apply talents
     * This is called by our modified talent application code
     */
    async enhanceCharacterWithTalents(character) {
        if (!character || !character.id) return character;
        
        // CRITICAL SAFETY CHECK: Never apply user talents to AI characters
        if (character.isAI === true) {
            console.log(`[TalentManager] BLOCKED: enhanceCharacterWithTalents called on AI character ${character.name}. AI characters should not get user talents.`);
            return character;
        }
        
        try {
            // Get user ID
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('No user ID available for talent application');
                return character;
            }
            
            // Get selected talents for this character
            const selectedTalents = await this.getSelectedTalents(character.id, userId);
            if (!selectedTalents || selectedTalents.length === 0) {
                console.log(`No talents selected for ${character.id}`);
                return character;
            }
            
            // Apply talents to the character
            const enhancedCharacter = await this.applyTalentsToCharacter(character, selectedTalents);

            // Update UI and dispatch events
            if (window.updateCharacterUI && document.getElementById(`character-${character.instanceId || character.id}`)) {
                window.updateCharacterUI(enhancedCharacter);
            }
            
            // ADDED: Dispatch character initialized event
            document.dispatchEvent(new CustomEvent('characterInitialized', {
                detail: {
                    character: enhancedCharacter
                }
            }));
            
            return enhancedCharacter;
        } catch (error) {
            console.error(`Error enhancing character ${character.id} with talents:`, error);
            return character; // Return unmodified character on error
        }
    }

    /**
     * Sets up an event listener for the 'on_crit_heal_self_stat_buff_permanent' talent effect.
     * When the specified character performs a critical heal, a stat is permanently buffed,
     * and a VFX is shown.
     */
    setupCritHealStatBuffListener(character, talentEffect) {
        if (!character || !talentEffect || !talentEffect.stat || typeof talentEffect.value !== 'number') {
            console.error('[TalentManager] Invalid arguments for setupCritHealStatBuffListener:', character, talentEffect);
            return;
        }

        console.log(`[TalentManager] Attaching criticalHeal listener for ${character.name}, talent effect:`, talentEffect);

        const listener = (event) => {
            console.log(`%c[Aqueous Renewal Listener DEBUG] GLOBAL criticalHeal event captured!`, 'color: lime; font-weight: bold;', event.detail);

            // Ensure the event has the necessary details
            if (event.detail && event.detail.source && event.detail.isCritical) {
                const eventSourceId = event.detail.source.id;
                const characterIdForListener = character.id;
                const isSourceMatching = eventSourceId === characterIdForListener;
                
                console.log(`[Aqueous Renewal Listener DEBUG] Event source ID: ${eventSourceId}, Listener character ID: ${characterIdForListener}, Match: ${isSourceMatching}`);
                console.log(`[Aqueous Renewal Listener DEBUG] Event isCritical: ${event.detail.isCritical}`);

                // Check if the source is the character with the talent AND it was critical
                // IMPORTANT: We removed the ally-only check so it works when Bridget heals anyone (including herself)
                if (isSourceMatching && event.detail.isCritical) { 
                    console.log(`[TalentManager] 'Aqueous Renewal' triggered for ${character.name} by critical heal on ${event.detail.target.name}.`);

                    const statToBuff = talentEffect.stat; // e.g., 'healingPower'
                    const buffValue = talentEffect.value; // e.g., 0.05

                    const oldValue = character.stats[statToBuff] || 0;
                    character.stats[statToBuff] = oldValue + buffValue;
                    console.log(`[TalentManager] ${character.name}'s ${statToBuff} Before: ${oldValue}, After: ${character.stats[statToBuff]} (Added: ${buffValue})`);

                    if (typeof character.recalculateStats === 'function') {
                        console.log(`[TalentManager] Calling recalculateStats for ${character.name} after Aqueous Renewal.`);
                        character.recalculateStats('talent_crit_heal_buff_aqueous_renewal');
                    } else {
                        console.warn(`[TalentManager] character.recalculateStats is not a function for ${character.name}.`);
                    }

                    if (typeof showAqueousRenewalVFX === 'function') {
                        console.log(`[TalentManager] Calling showAqueousRenewalVFX for ${character.name}.`);
                        showAqueousRenewalVFX(character, buffValue);
                    } else {
                        console.warn('[TalentManager] showAqueousRenewalVFX function is not defined. Cannot show VFX.');
                    }

                    if (window.gameManager && typeof window.gameManager.addLogEntry === 'function') {
                        const buffPercentage = Math.round(buffValue * 100);
                        window.gameManager.addLogEntry(
                            `${character.name}'s Aqueous Renewal activates, permanently increasing Healing Power by ${buffPercentage}%!`,
                            'talent-effect positive'
                        );
                    }
                    if (typeof updateCharacterUI === 'function') {
                        console.log(`[TalentManager] Calling updateCharacterUI for ${character.name} after Aqueous Renewal.`);
                        updateCharacterUI(character);
                    }
                } else {
                    console.log(`[Aqueous Renewal Listener DEBUG] Critical heal event requirements not met: Source match=${isSourceMatching}, Critical=${event.detail.isCritical}`);
                }
            } else {
                console.log('[Aqueous Renewal Listener DEBUG] Critical heal event ignored: Missing detail, source, or not critical.', event.detail);
            }
        };

        document.addEventListener('criticalHeal', listener);
        
        console.log(`[TalentManager] Event listener for '${talentEffect.id || 'Aqueous Renewal'}' on critical heal set up for ${character.name}.`);
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