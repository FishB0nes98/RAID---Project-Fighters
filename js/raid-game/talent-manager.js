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
     * For Infernal Ibuki: call updateIbukiAbilityDescriptionsForTalents after talents are applied
     * Ensures ability descriptions are updated after talents are loaded and applied
     */
    callIbukiDescriptionUpdateHook(character) {
        if (character.id === 'infernal_ibuki' && typeof window.updateIbukiAbilityDescriptionsForTalents === 'function') {
            // Debug: log playerTalents state
            console.debug('[TalentManager] Calling updateIbukiAbilityDescriptionsForTalents. window.playerTalents:', window.playerTalents);
            window.updateIbukiAbilityDescriptionsForTalents(character);
        }
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
        
        // Preloading is deferred to on-demand loading in GameManager.
        this.initialized = true;
        console.log('TalentManager initialized successfully (preloading deferred).');
    }

    /**
     * Load talent definitions for characters present in the current game.
     * This is called by the GameManager when a stage is loaded.
     * @param {Array<Character>} characters - The character instances in the current match.
     */
    async loadTalentsForCharacters(characters) {
        if (!characters || !Array.isArray(characters)) {
            console.warn('[TalentManager] No characters provided to load talents for.');
            return;
        }
        
        const characterIds = new Set(characters.map(c => c.id));
        console.log(`[TalentManager] Loading talents for ${characterIds.size} unique characters in the match.`);

        for (const characterId of characterIds) {
            if (characterId) {
                // This will use cache if available, or fetch if not.
                await this.loadTalentDefinitions(characterId);
            }
        }
        console.log('[TalentManager] Finished loading talents for current match characters.');
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
                    await this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } else if (Array.isArray(talent.effect)) {
                for (const effect of talent.effect) {
                    await this.applyTalentEffect(character, effect);
                    appliedEffectsCount++;
                }
            } 
            // Handle single effect (object) - check both 'effects' and 'effect'
            else if (talent.effects) {
                await this.applyTalentEffect(character, talent.effects);
                appliedEffectsCount++;
            } else if (talent.effect) {
                await this.applyTalentEffect(character, talent.effect);
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
            console.log('[TalentManager] Ayane talents being applied:', selectedTalentIds);
            console.log('[TalentManager] Ayane character object:', character);

            // Update Q ability description if it has a generateDescription method
            const qAbility = character.abilities.find(a => a.id === 'schoolgirl_ayane_q');
            if (qAbility && typeof qAbility.generateDescription === 'function') {
                const desc = qAbility.generateDescription();
                console.log('[TalentManager] Updated Butterfly Dagger description for talent modifications:', desc);
            } else {
                console.log('[TalentManager] Q ability or generateDescription not found for Ayane.');
            }

            // Dispatch specific event for Ayane talent application
            setTimeout(() => {
                console.log('[TalentManager] Dispatching schoolgirl_ayane_talents_applied event', {
                    character: character,
                    talentIds: selectedTalentIds
                });
                document.dispatchEvent(new CustomEvent('schoolgirl_ayane_talents_applied', {
                    detail: {
                        character: character,
                        talentIds: selectedTalentIds
                    }
                }));
            }, 100);
        }

        // For Infernal Ibuki: apply talent effects
        if (character.id === 'infernal_ibuki') {
            try {
                const allAbilities = character.abilitiesById || character.abilitiesMap || character.abilities;
                const appliedTalents = character.appliedTalents || [];

                // Elemental Mastery: +60 magical damage, +50% magical scaling on Kunai Throw
                if (appliedTalents.includes('infernal_ibuki_t1')) {
                    character.applyStatModification('magicalDamage', 'add', 60);
                    const kunaiThrowAbility = allAbilities.find(ability => ability.id === 'kunai_throw');
                    if (kunaiThrowAbility) {
                        kunaiThrowAbility.magicalScaling = (kunaiThrowAbility.magicalScaling || 0) + 0.5;
                    }
                }

                // Kunai Mastery Awakening: cooldown 0, 17% chance to end turn
                if (appliedTalents.includes('infernal_ibuki_t2')) {
                    const kunaiThrowAbility = allAbilities.find(ability => ability.id === 'kunai_throw');
                    if (kunaiThrowAbility) {
                        kunaiThrowAbility.cooldown = 0;
                        kunaiThrowAbility.kunaiEndTurnChance = 0.17;
                    }
                }

                // Infernal Edge: +11% crit chance
                if (appliedTalents.includes('infernal_ibuki_t3')) {
                    character.applyStatModification('critChance', 'add', 0.11);
                }

                // Savage Blade: +75 Physical Damage
                if (appliedTalents.includes('infernal_ibuki_t6')) {
                    character.applyStatModification('physicalDamage', 'add', 75);
                }

                // Urarenge: Swift Strike crits deal damage again
                const swiftStrikeAbility = allAbilities.find(ability => ability.id === 'swift_strike');
                if (appliedTalents.includes('infernal_ibuki_t4') && swiftStrikeAbility) {
                    swiftStrikeAbility.urarenge = true;
                }

                // Vampiric Strikes: heal for 25% of crit damage
                if (appliedTalents.includes('infernal_ibuki_t5')) {
                    if (!character.vampiricStrikesListenerAttached) {
                        const vampiricListener = (event) => {
                            const { character: attacker, damage, isCritical } = event.detail;
                            // Check if the attacker has the talent and if it was a critical hit.
                            if (attacker && attacker.id === character.id && attacker.appliedTalents && attacker.appliedTalents.includes('infernal_ibuki_t5') && isCritical && damage > 0) {
                                const healingAmount = Math.round(damage * 0.25);
                                if (typeof attacker.heal === 'function') {
                                    attacker.heal(healingAmount, attacker, { abilityId: 'infernal_ibuki_vampiric_strikes' });
                                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                    log(`<span class="talent-enhanced">${attacker.name} heals for ${healingAmount} from a critical strike!</span>`);
                                }
                            }
                        };
                        document.addEventListener('character:damage-dealt', vampiricListener);
                        // Store listener for cleanup and a flag to prevent re-attaching
                        character.vampiricStrikesListener = vampiricListener;
                        character.vampiricStrikesListenerAttached = true;
                    }
                }
                
                // Swift Blade Expertise: Swift Strike scales with Blade Expertise passive
                if (appliedTalents.includes('infernal_ibuki_t7')) {
                    // This talent's effect is handled directly in infernal_ibuki_abilities.js
                    // by checking for the presence of the talent ID in appliedTalents.
                    // No direct modification needed here, but keeping this block for clarity
                    // that the talent is acknowledged.
                    console.log('[TalentManager] Infernal Ibuki T7 (Swift Blade Expertise) detected. Swift Strike passive scaling enabled.');
                }

                // Critical Stack: Critical strikes count 1 additional passive stack
                if (appliedTalents.includes('infernal_ibuki_t8')) {
                    if (!character.criticalStackListenerAttached) {
                        const criticalStackListener = (event) => {
                            const { character: attacker, isCritical } = event.detail;
                            if (attacker && attacker.id === character.id && attacker.appliedTalents && attacker.appliedTalents.includes('infernal_ibuki_t8') && isCritical) {
                                if (character.passiveHandler && typeof character.passiveHandler.addPassiveStack === 'function') {
                                    character.passiveHandler.addPassiveStack(1); // Add 1 additional stack
                                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                    log(`<span class="talent-enhanced">${attacker.name}'s Critical Stack talent grants an additional passive stack!</span>`);
                                } else {
                                    console.warn('[TalentManager] Infernal Ibuki Critical Stack talent: passiveHandler or addPassiveStack not found.');
                                }
                            }
                        };
                        document.addEventListener('character:damage-dealt', criticalStackListener); // Assuming this event fires on critical strikes
                        character.criticalStackListener = criticalStackListener;
                        character.criticalStackListenerAttached = true;
                    }
                }

                // Critical Damage Boost: Increase Critical Damage Stat by 20%
                if (appliedTalents.includes('infernal_ibuki_t9')) {
                    character.applyStatModification('critDamage', 'add', 0.20);
                }

                // Blade Expertise Enhancement: Increase Blade Expertise bonus by 5%
                if (appliedTalents.includes('infernal_ibuki_t10')) {
                    // Update the character's bladeExpertiseBonusPerStack property
                    character.bladeExpertiseBonusPerStack = (character.bladeExpertiseBonusPerStack || 0.10) + 0.05;
                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                    log(`<span class="talent-enhanced">${character.name}'s Blade Expertise Enhancement increases Blade Expertise bonus!</span>`);
                }

                // Kunai Barrage: Kunai Throw hits all enemies
                if (appliedTalents.includes('infernal_ibuki_t11')) {
                    const kunaiThrowAbility = allAbilities.find(ability => ability.id === 'kunai_throw');
                    if (kunaiThrowAbility) {
                        kunaiThrowAbility.hitsAllEnemies = true;
                        kunaiThrowAbility.multiTargetHitChance = 0.70; // 70% chance for other enemies
                    }
                }

                // Shadow Strike: Attacking Obscured targets deals additional 200% Magical Damage
                if (appliedTalents.includes('infernal_ibuki_t12')) {
                    character.shadowStrikeBonusEnabled = true;
                    console.log('[TalentManager] Infernal Ibuki T12 (Shadow Strike) detected. Enabling bonus damage against Obscured targets.');
                }

                // Smoke Bomb Enhancement: Increase Smoke bomb damage by 50 and scales with 20% of Magical Damage.
                if (appliedTalents.includes('infernal_ibuki_t13')) {
                    const smokeBombAbility = allAbilities.find(ability => ability.id === 'smoke_bomb');
                    if (smokeBombAbility) {
                        smokeBombAbility.baseDamage = (smokeBombAbility.baseDamage || 0) + 50;
                        smokeBombAbility.magicalScaling = (smokeBombAbility.magicalScaling || 0) + 0.20;
                        console.log('[TalentManager] Infernal Ibuki T13 (Smoke Bomb Enhancement) detected. Smoke bomb damage and scaling increased.');
                        console.log(`[TalentManager Debug] smokeBombAbility.baseDamage after T13: ${smokeBombAbility.baseDamage}`);
                        console.log(`[TalentManager Debug] smokeBombAbility.magicalScaling after T13: ${smokeBombAbility.magicalScaling}`);
                    }
                }

                // Debilitating Strikes: Ibuki deals 25% increased damage to targets with at least 1 debuff.
                if (appliedTalents.includes('infernal_ibuki_t19')) {
                    character.debilitatingStrikesEnabled = true;
                    console.log('[TalentManager] Infernal Ibuki T19 (Debilitating Strikes) detected. Enabling bonus damage against debuffed targets.');
                    // Call VFX function
                    if (typeof window.showDebilitatingStrikesVFX === 'function') {
                        window.showDebilitatingStrikesVFX(character);
                    }
                }

                // Doubled Physical Damage: At turn 25, physical damage is doubled permanently
                if (appliedTalents.includes('infernal_ibuki_t14') && !character._doubledPhysicalDamageApplied) {
                    console.log('[TalentManager] Infernal Ibuki T14 (Doubled Physical Damage) detected. Setting up turn 25 listener.');

                    const doubledPhysicalDamageListener = (event) => {
                        // Use event.detail.turn for reliability
                        const currentTurn = event.detail.turn;
                        console.log(`[TalentManager DEBUG] doubledPhysicalDamageListener triggered. Current turn: ${currentTurn}, Character: ${character.name}, Talent Applied: ${character._doubledPhysicalDamageApplied}`);
                        if (currentTurn === 25) {
                            if (character && !character.isDead() && !character._doubledPhysicalDamageApplied) {
                                console.log('[TalentManager] Applying Infernal Ibuki T14: Doubling Physical Damage.');
                                character.applyStatModification('physicalDamage', 'multiply', 2);
                                character._doubledPhysicalDamageApplied = true;
                                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                log(`<span class="talent-enhanced">🔥 ${character.name}'s Physical Damage is permanently doubled by Doubled Physical Damage talent!</span>`);
                                
                                // Apply VFX
                                if (typeof window.applyDoubledPhysicalDamageVFX === 'function') {
                                    window.applyDoubledPhysicalDamageVFX(character);
                                } else {
                                    console.warn('[TalentManager] applyDoubledPhysicalDamageVFX function not found.');
                                }

                                // Remove listener after applying to prevent re-application
                                document.removeEventListener('turn:start', doubledPhysicalDamageListener);
                            }
                        }
                    };
                    // Store the listener reference on the character for potential cleanup if needed
                    character._doubledPhysicalDamageListener = doubledPhysicalDamageListener;
                    document.addEventListener('turn:start', doubledPhysicalDamageListener);
                }

                // Swift Shadow: Decrease Shadow Veil cooldown by 2 turns
                if (appliedTalents.includes('infernal_ibuki_t16')) {
                    const shadowVeilAbility = allAbilities.find(ability => ability.id === 'shadow_veil');
                    if (shadowVeilAbility) {
                        shadowVeilAbility.cooldown = Math.max(0, (shadowVeilAbility.cooldown || 0) - 2);
                        console.log(`[TalentManager] Infernal Ibuki T16 (Swift Shadow) detected. Shadow Veil cooldown reduced to: ${shadowVeilAbility.cooldown}`);
                    } else {
                        console.warn('[TalentManager] Shadow Veil ability not found for Infernal Ibuki T16.');
                    }
                }

                // Shadow Dance (infernal_ibuki_t17): 10% chance for Shadow Veil after Q, E, R
                if (appliedTalents.includes('infernal_ibuki_t17')) {
                    console.log('[TalentManager] Infernal Ibuki T17 (Shadow Dance) detected. Setting up ability-used listener.');

                    // Attach listener if not already attached
                    if (!character._shadowDanceListenerAttached) {
                        const shadowDanceListener = (event) => {
                            console.log('[TalentManager] shadowDanceListener triggered (re-added logs).');
                            const { caster: abilityCaster, ability: usedAbility } = event.detail;
                            console.log(`[TalentManager DEBUG] abilityCaster.id: ${abilityCaster.id}, character.id: ${character.id}`);
                            console.log(`[TalentManager DEBUG] abilityCaster.appliedTalents: ${JSON.stringify(abilityCaster.appliedTalents)}`);
                            console.log(`[TalentManager DEBUG] usedAbility.id: ${usedAbility.id}`);

                            // Ensure it's Ibuki using her own abilities
                            if (abilityCaster.id === character.id && abilityCaster.appliedTalents.includes('infernal_ibuki_t17')) {
                                console.log(`[TalentManager DEBUG] Character ID and talent check passed.`);
                                const abilityId = usedAbility.id;
                                console.log(`[TalentManager DEBUG] Ability ID: ${abilityId}`);
                                // Check if it's Q, E, or R
                                if (['kunai_throw', 'swift_strike', 'smoke_bomb'].includes(abilityId)) {
                                    console.log(`[TalentManager DEBUG] Used ability is Kunai Throw (Q), Swift Strike (E), or Smoke Bomb (R).`);
                                    // 10% chance to activate
                                    if (Math.random() < 0.10) { // Reverted to 0.10
                                        console.log(`[TalentManager DEBUG] Shadow Dance activated after ${usedAbility.name}! (Random check passed)`);
                                        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

                                        // Apply Shadow Veil buffs for 2 turns
                                        const untargetableBuff = {
                                            id: 'shadow_veil_untargetable_t17',
                                            name: 'Shadow Veil (Talent)',
                                            icon: 'Icons/abilities/shadow_step.png',
                                            duration: 2, // 2 turns as per talent description
                                            onApply: (target) => {
                                                console.log(`[TalentManager DEBUG] Applying untargetableBuff to ${target.name}.`);
                                                const targetElementId = target.instanceId || target.id;
                                                const targetElement = document.getElementById(`character-${targetElementId}`);
                                                if (targetElement) {
                                                    targetElement.classList.add('shadow-step-active');
                                                    const smokeContainer = document.createElement('div');
                                                    smokeContainer.className = 'shadow-step-smoke-container';
                                                    for (let i = 0; i < 5; i++) {
                                                        const smoke = document.createElement('div');
                                                        smoke.className = 'shadow-step-smoke';
                                                        smoke.style.setProperty('--i', i);
                                                        smokeContainer.appendChild(smoke);
                                                    }
                                                    targetElement.appendChild(smokeContainer);
                                                } else {
                                                    console.warn(`[TalentManager DEBUG] Target element not found for untargetableBuff: character-${targetElementId}`);
                                                }
                                            },
                                            onRemove: (target) => {
                                                console.log(`[TalentManager DEBUG] Removing untargetableBuff from ${target.name}.`);
                                                const targetElementId = target.instanceId || target.id;
                                                const targetElement = document.getElementById(`character-${targetElementId}`);
                                                if (targetElement) {
                                                    targetElement.classList.remove('shadow-step-active');
                                                    const smokeContainer = targetElement.querySelector('.shadow-step-smoke-container');
                                                    if (smokeContainer) {
                                                        smokeContainer.remove();
                                                    }
                                                } else {
                                                    console.warn(`[TalentManager DEBUG] Target element not found for untargetableBuff removal: character-${targetElementId}`);
                                                }
                                            },
                                            isDebuff: false,
                                            isUntargetableByEnemies: true,
                                            description: "Untargetable by enemies only."
                                        };

                                        log(`${character.name}'s Shadow Dance activates! She enters Shadow Veil for 2 turns!`, 'talent');
                                        playSound('sounds/shadow_step.mp3', 0.7);

                                        if (typeof updateCharacterUI === 'function') {
                                            updateCharacterUI(character);
                                        } else {
                                            console.warn(`[TalentManager DEBUG] updateCharacterUI function not found!`);
                                        }
                                    } else {
                                        console.log(`[TalentManager DEBUG] Shadow Dance did not activate (10% chance failed) after ${usedAbility.name}.`);
                                    }
                                } else {
                                    console.log(`[TalentManager DEBUG] Used ability ${abilityId} is not Q, E, or R.`);
                                }
                            } else {
                                console.log(`[TalentManager DEBUG] Character ID or talent check failed. abilityCaster.id=${abilityCaster.id}, character.id=${character.id}, talent included=${abilityCaster.appliedTalents.includes('infernal_ibuki_t17')}`);
                            }
                        };
                        document.addEventListener('AbilityUsed', shadowDanceListener);
                        character._shadowDanceListener = shadowDanceListener;
                        character._shadowDanceListenerAttached = true;
                    }
                }

                // Infernal Kunais (infernal_ibuki_t20): Kunai Throw applies Blazing debuff
                if (appliedTalents.includes('infernal_ibuki_t20')) {
                    console.log('[TalentManager] Infernal Ibuki T20 (Infernal Kunais) detected. Debuff application handled in Kunai Throw effect.');
                    // No direct action needed here, as the effect is applied within the kunaiThrowEffect.
                }

                // Debilitating Kunais (infernal_ibuki_t21): Auto-target enemies with 3+ debuffs with Swift Strike
                if (appliedTalents.includes('infernal_ibuki_t21')) {
                    console.log('[TalentManager] Infernal Ibuki T21 (Debilitating Kunais) detected. Setting up turn start listener.');
                    if (!character._debilitatingKunaisListenerAttached) {
                        const debilitatingKunaisListener = (event) => {
                            const { character: currentChar } = event.detail || {};
                            if (currentChar && currentChar.id === character.id && !currentChar.isDead()) {
                                console.log('[TalentManager] Debilitating Kunais listener triggered for Ibuki.');
                                
                                if (!window.gameManager || !window.gameManager.gameState) {
                                    console.warn('[TalentManager] GameManager or GameState not available.');
                                    return;
                                }

                                const enemies = window.gameManager.gameState.aiCharacters;
                                console.log(`[TalentManager DEBUG] Total AI enemies found: ${enemies ? enemies.length : 0}`);
                                if (!enemies || enemies.length === 0) {
                                    console.log('[TalentManager DEBUG] No AI enemies to check for debuffs.');
                                    return;
                                }

                                const swiftStrikeAbility = allAbilities.find(ability => ability.id === 'swift_strike');

                                if (!swiftStrikeAbility) {
                                    console.warn('[TalentManager] Swift Strike ability not found for Debilitating Kunais talent.');
                                    return;
                                }
                                
                                console.log('[TalentManager] Checking enemies for debuffs...');
                                const aliveEnemiesWithDebuffs = enemies.filter(enemy => {
                                    console.log(`[TalentManager DEBUG] Processing enemy: ${enemy.name} (${enemy.id}). isDead(): ${enemy.isDead()}`);
                                    if (enemy.isDead()) {
                                        console.log(`[TalentManager DEBUG] Enemy ${enemy.name} is dead, skipping.`);
                                        return false;
                                    }
                                    // Declare debuffs in a higher scope so it's accessible outside the filter callback
                                    let currentEnemyDebuffs = []; 
                                    if (typeof enemy.getBuffsAndDebuffs === 'function') {
                                        const allEffects = enemy.getBuffsAndDebuffs();
                                        currentEnemyDebuffs = allEffects.filter(effect => {
                                            console.log(`[TalentManager DEBUG] Effect on ${enemy.name}: ID=${effect.id}, Name=${effect.name}, isDebuff=${effect.isDebuff}`);
                                            return effect.isDebuff;
                                        });
                                        console.log(`[TalentManager DEBUG] Enemy ${enemy.name} (${enemy.id}) has ${currentEnemyDebuffs.length} debuffs after filtering (via getBuffsAndDebuffs). All effects raw:`, allEffects);
                                        console.log(`[TalentManager DEBUG] Debuffs on ${enemy.name} (filtered):`, currentEnemyDebuffs.map(d => d.id));
                                    } else if (enemy.debuffs && Array.isArray(enemy.debuffs)) {
                                        // Fallback if getBuffsAndDebuffs is not available
                                        currentEnemyDebuffs = enemy.debuffs.filter(effect => {
                                            console.log(`[TalentManager DEBUG] Fallback (enemy.debuffs) Effect on ${enemy.name}: ID=${effect.id}, Name=${effect.name}, isDebuff=${effect.isDebuff}`);
                                            return effect.isDebuff;
                                        });
                                        console.warn(`[TalentManager] enemy.getBuffsAndDebuffs is not a function for ${enemy.name}. Falling back to enemy.debuffs. Found ${currentEnemyDebuffs.length} debuffs.`);
                                        console.log(`[TalentManager DEBUG] Debuffs on ${enemy.name} (fallback):`, currentEnemyDebuffs.map(d => d.id));
                                    } else if (enemy.activeEffects && Array.isArray(enemy.activeEffects)) {
                                        // Another common pattern for active effects
                                        currentEnemyDebuffs = enemy.activeEffects.filter(effect => {
                                            console.log(`[TalentManager DEBUG] Fallback (enemy.activeEffects) Effect on ${enemy.name}: ID=${effect.id}, Name=${effect.name}, isDebuff=${effect.isDebuff}`);
                                            return effect.isDebuff;
                                        });
                                        console.warn(`[TalentManager] Neither getBuffsAndDebuffs nor enemy.debuffs found for ${enemy.name}. Falling back to enemy.activeEffects. Found ${currentEnemyDebuffs.length} debuffs.`);
                                        console.log(`[TalentManager DEBUG] Debuffs on ${enemy.name} (fallback activeEffects):`, currentEnemyDebuffs.map(d => d.id));
                                    }
                                    else {
                                        console.warn(`[TalentManager] No debuff information found for ${enemy.name}. Neither getBuffsAndDebuffs, enemy.debuffs, nor enemy.activeEffects is available.`);
                                        console.log(`[TalentManager DEBUG] Full enemy object for ${enemy.name}:`, enemy); // Log the full object
                                    }
                                    // Attach the debuff count to the enemy object for sorting
                                    enemy._tempDebuffCount = currentEnemyDebuffs.length;
                                    return currentEnemyDebuffs.length >= 3;
                                });

                                if (aliveEnemiesWithDebuffs.length > 0) {
                                    console.log(`[TalentManager] Found ${aliveEnemiesWithDebuffs.length} enemies with 3+ debuffs.`);
                                    // Sort by number of debuffs (descending) then by currentHP (ascending)
                                    aliveEnemiesWithDebuffs.sort((a, b) => {
                                        // Use the _tempDebuffCount for sorting
                                        const aDebuffs = a._tempDebuffCount;
                                        const bDebuffs = b._tempDebuffCount;
                                        if (aDebuffs !== bDebuffs) {
                                            return bDebuffs - aDebuffs;
                                        }
                                        return a.currentHP - b.currentHP;
                                    });

                                    const targetEnemy = aliveEnemiesWithDebuffs[0]; // Target the enemy with most debuffs/lowest HP
                                    // Use the stored _tempDebuffCount for logging
                                    const targetEnemyDebuffCount = targetEnemy._tempDebuffCount; 
                                    console.log(`[TalentManager] Debilitating Kunais: Auto-targeting ${targetEnemy.name} with Swift Strike (${targetEnemyDebuffCount} debuffs).`);
                                    
                                    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                                    log(`<span class="talent-enhanced">🔥 ${character.name}'s Debilitating Kunais automatically targets ${targetEnemy.name} with Swift Strike!</span>`);

                                    // Simulate ability use. This assumes swiftStrikeAbility has a use() method
                                    // and that the game loop can handle an ability being used outside of a player action.
                                    if (typeof swiftStrikeAbility.use === 'function') {
                                        // Ensure the ability's caster is set correctly
                                        swiftStrikeAbility.caster = character;
                                        swiftStrikeAbility.character = character;
                                        swiftStrikeAbility.use(character, targetEnemy); // Use Swift Strike on the target
                                    } else {
                                        console.warn('[TalentManager] Swift Strike ability does not have a "use" method. Auto-targeting failed.');
                                    }
                                }
                            }
                        };
                        document.addEventListener('turn:start', debilitatingKunaisListener);
                        character._debilitatingKunaisListener = debilitatingKunaisListener;
                        console.log(`[TalentManager] Debilitating Kunais listener attached: ${character._debilitatingKunaisListenerAttached}`);
                        character._debilitatingKunaisListenerAttached = true;
                    } else {
                        console.log('[TalentManager] Debilitating Kunais listener already attached.');
                    }
                }

            } catch (err) {
                console.error('[TalentManager] Error applying Infernal Ibuki special talent:', err);
            }
            // Update Ibuki's ability descriptions after applying talents
            if (typeof window.updateIbukiAbilityDescriptionsForTalents === 'function') {
                window.updateIbukiAbilityDescriptionsForTalents(character);
            }
        }
        console.log('[TalentManager] Finished Infernal Ibuki talent application.');
        
        // Get talent definitions for more detailed event
        const talentDefinitionsForEvent = await this.loadTalentDefinitions(character.id);
        if (talentDefinitionsForEvent) {
            console.log('[TalentManager] Dispatching talent_applied event for each applied talent:', selectedTalentIds);
            // Dispatch talent applied event for each applied talent with detailed info
            selectedTalentIds.forEach(talentId => {
                const talent = talentDefinitionsForEvent[talentId];
                if (talent) {
                    console.log(`[TalentManager] Dispatching talent_applied for ${character.name} talent:`, talentId, talent);
                    document.dispatchEvent(new CustomEvent('talent_applied', {
                        detail: {
                            character: character,
                            talent: talent,
                            talentId: talentId
                        }
                    }));
                } else {
                    console.warn(`[TalentManager] Talent definition not found for id: ${talentId}`);
                }
            });
        } else {
            console.warn('[TalentManager] No talent definitions found for event dispatch. Fallback to simple event.');
            document.dispatchEvent(new CustomEvent('talent_applied', {
                detail: {
                    character: character,
                    talentIds: selectedTalentIds
                }
            }));
        }
        console.log('[TalentManager] Finished dispatching talent_applied events.');
        
        return character;
    }

    /**
     * Apply a specific talent effect to a character
     * Accepts either a single effect object or an array of effect objects.
     */
    async applyTalentEffect(character, effectOrEffects) {
        // Handle array of effects (for talents with multiple effects)
        if (Array.isArray(effectOrEffects)) {
            console.log(`[TalentManager] Applying multiple effects (${effectOrEffects.length}) from a single talent`);
            for (const singleEffect of effectOrEffects) {
                // Recursive call for each effect in the array
                await this.applySingleTalentEffect(character, singleEffect);
            }
        } else {
            // Apply a single effect object
            await this.applySingleTalentEffect(character, effectOrEffects);
        }
        // Note: updateCharacterAfterTalent is called once after all talents for a character are processed.
    }
    
    /**
     * Apply a single talent effect object to a character
     */
    async applySingleTalentEffect(character, effect) {
        if (!effect || !character) return false;

        switch (effect.type) {
            case 'modify_stat':
            case 'stat_modification':
                // Call the applyStatModification method on the character object
                // The character.applyStatModification expects (statName, operation, value)
                character.applyStatModification(effect.stat, effect.operation, effect.value);
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
            case 'add_ability':
                await this.addAbilityToCharacter(character, effect);
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

        // Infernal Ibuki special talents
        if (character.id === 'infernal_ibuki') {
            try {
                // Lazy import to avoid circular deps
                if (!window.applyInfernalIbukiRootTalent || !window.applyInfernalIbukiTalents) {
                    // Try to import if not already loaded
                    // (Assume ES6 modules or global script loaded)
                }
                // Always call root talent for elemental mastery
                if (effect.specialType === 'elemental_mastery' && typeof window.applyInfernalIbukiRootTalent === 'function') {
                    window.applyInfernalIbukiRootTalent(character, character.abilitiesById || character.abilitiesMap || character.abilities);
                }
                // Apply all Infernal Ibuki talents directly here
                const allAbilities = character.abilitiesById || character.abilitiesMap || character.abilities;
                const appliedTalents = character.appliedTalents || [];

                // Elemental Mastery: +60 magical damage, +50% magical scaling on Kunai Throw
                if (appliedTalents.includes('infernal_ibuki_t1')) {
                    // Use applyStatModification to ensure recalculation
                    character.applyStatModification('magicalDamage', 'add', 60);
                    const kunaiThrowAbility = allAbilities.find(ability => ability.id === 'kunai_throw');
                    if (kunaiThrowAbility) {
                        kunaiThrowAbility.magicalScaling = (kunaiThrowAbility.magicalScaling || 0) + 0.5;
                    }
                }

                // Kunai Mastery Awakening: cooldown 0, 17% chance to end turn
                if (appliedTalents.includes('infernal_ibuki_t2')) {
                    const kunaiThrowAbility = allAbilities.find(ability => ability.id === 'kunai_throw');
                    if (kunaiThrowAbility) {
                        kunaiThrowAbility.cooldown = 0;
                        kunaiThrowAbility.kunaiEndTurnChance = 0.17;
                    }
                }

                // Infernal Edge: +11% crit chance
                if (appliedTalents.includes('infernal_ibuki_t3')) {
                    character.critChance = (character.critChance || 0) + 0.11;
                }

                // Urarenge: Swift Strike crits deal damage again
                const swiftStrikeAbility = allAbilities.find(ability => ability.id === 'swift_strike');
                if (appliedTalents.includes('infernal_ibuki_t4') && swiftStrikeAbility) {
                    swiftStrikeAbility.urarenge = true;
                }

                // Vampiric Strikes: heal for 25% of crit damage
                if (appliedTalents.includes('infernal_ibuki_t5')) {
                    // The listener for this is attached in applyTalentsToCharacter to ensure it's only for the player
                }
            } catch (err) {
                console.error('[TalentManager] Error applying Infernal Ibuki special talent:', err);
            }
            return;
        }

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
        const passiveId = effect.passiveId;
        const property = effect.property;
        const operation = effect.operation || 'set';
        const value = effect.value;
        
        if (!passiveId || !property || value === undefined) {
            console.warn('Invalid passive modification effect', effect);
            return;
        }
        
        // Find the passive in the character's passives
        const passive = character.passives?.find(p => p.id === passiveId);
        if (!passive) {
            console.warn(`Passive ${passiveId} not found for character ${character.name}`);
            return;
        }
        
        // Apply the modification
        switch (operation) {
            case 'set':
                passive[property] = value;
                break;
            case 'add':
                passive[property] = (passive[property] || 0) + value;
                break;
            case 'multiply':
                passive[property] = (passive[property] || 1) * value;
                break;
            default:
                console.warn(`Unknown passive modification operation: ${operation}`);
                return;
        }
        
        console.log(`Applied passive modification to ${character.name}: ${passiveId}.${property} ${operation} ${value}`);
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
        
        // Handle Siegfried's talent properties by routing them to the passive ONLY
        if (character.id === 'schoolboy_siegfried' && (property === 'buffDurationBonus' || property === 'healOnBuffReceived' || property === 'healOnAllyHealed')) {
            // For Siegfried, don't set the character-level property, only route to passive
            if (character.passiveHandler && typeof character.passiveHandler.applyTalentModification === 'function') {
                character.passiveHandler.applyTalentModification(property, value);
                console.log(`[TalentManager] Routed ${property} to Siegfried's passive only: ${value}`);
            } else if (character.passive && typeof character.passive.applyTalentModification === 'function') {
                character.passive.applyTalentModification(property, value);
                console.log(`[TalentManager] Routed ${property} to Siegfried's passive via passive object only: ${value}`);
            }
        } else {
            // --- For other characters: Directly set the property on the character object --- 
            character[property] = value;
            console.log(`[TalentManager] Set character.${property} = ${value}`);
        }
        
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
            } else if (property === 'enableIceSwordFollowUp') {
                const iceSwordAbility = character.abilities && character.abilities.find(a => a.id === 'ice_sword_strike');
                if (iceSwordAbility && typeof window.updateIceSwordStrikeDescription === 'function') {
                    // Attach generateDescription that calls helper
                    iceSwordAbility.generateDescription = function() {
                        return window.updateIceSwordStrikeDescription(iceSwordAbility, character);
                    };
                    iceSwordAbility.description = iceSwordAbility.generateDescription();
                    console.log('[TalentManager] Updated Ice Sword Strike description via updateIceSwordStrikeDescription');
                }
            }
            
            // Trigger UI update if description was changed
            if (descriptionUpdated) {
                document.dispatchEvent(new CustomEvent('abilityDescriptionUpdated', {
                    detail: { character: character }
                }));
            }
        }
        
        // --- NEW: Handle Siegfried Mana Efficiency talent ---
        if (property === 'manaCostReduction' && character.id === 'schoolboy_siegfried') {
            console.log(`[TalentManager] Applying mana cost reduction of ${Math.round(value * 100)}% to all abilities for ${character.name}`);
            if (character.abilities && Array.isArray(character.abilities)) {
                character.abilities.forEach(ability => {
                    if (ability.baseManaCost === undefined) {
                        ability.baseManaCost = ability.manaCost; // Store original cost
                    }
                    const reducedCost = Math.ceil(ability.baseManaCost * (1 - value));
                    ability.manaCost = Math.max(1, reducedCost); // Minimum 1 mana
                    console.log(`[TalentManager] ${ability.name} mana cost: ${ability.baseManaCost} -> ${ability.manaCost}`);
                });
            }
            
            // Update ability descriptions to show reduced mana costs
            if (typeof window.updateSiegfriedAbilityDescriptions === 'function') {
                window.updateSiegfriedAbilityDescriptions(character);
                console.log(`[TalentManager] Updated Siegfried ability descriptions after mana cost reduction`);
            }
        }
        // --- END NEW ---

        // --- NEW: Handle Julia's Healing Sprout Critical talent ---
        if (property === 'healingSproutCriticalChance' && character.id === 'schoolgirl_julia') {
            console.log(`[TalentManager] Applied Healing Sprout Critical talent to ${character.name}: ${Math.round(value * 100)}% chance`);
            
            // Update the Sprout Planting ability description
            const sproutAbility = character.abilities.find(a => a.id === 'schoolgirl_julia_w');
            if (sproutAbility && typeof sproutAbility.generateDescription === 'function') {
                sproutAbility.description = sproutAbility.generateDescription();
                console.log(`[TalentManager] Updated Sprout Planting description for Healing Sprout Critical talent`);
                
                // Trigger UI update
                document.dispatchEvent(new CustomEvent('abilityDescriptionUpdated', {
                    detail: { character: character }
                }));
            }
        }
        // --- END NEW ---

        // --- NEW: Handle Julia's Nature's Fury talent ---
        if (property === 'naturesFuryTurn10' && character.id === 'schoolgirl_julia') {
            console.log(`[TalentManager] Applied Nature's Fury talent to ${character.name}`);
        }
        // --- END NEW ---

        // --- NEW: Handle Shoma's Healing Mastery talent ---
        if (property === 'healingMasteryEnabled' && character.id === 'schoolboy_shoma') {
            console.log(`[TalentManager] Applied Healing Mastery talent to ${character.name}: +20% healing power`);
            
            // Set healing power to 0.2 (20% increase)
            character.stats.healingPower = 0.2;
            
            console.log(`[TalentManager] ${character.name} healing power set to: ${character.stats.healingPower} (20% increase)`);
            console.log(`[TalentManager] ${character.name} stats after talent application:`, character.stats);
            
            // Update ability descriptions to reflect the healing power increase
            if (typeof window.updateShomaAbilityDescriptions === 'function') {
                window.updateShomaAbilityDescriptions(character);
                console.log(`[TalentManager] Updated Shoma ability descriptions for Healing Mastery talent`);
                
                // Trigger UI update
                document.dispatchEvent(new CustomEvent('abilityDescriptionUpdated', {
                    detail: { character: character }
                }));
            }
        }
        // --- END NEW ---

        // --- NEW: Handle Shoma's Grass Growth talent ---
        if (property === 'grassGrowthEnabled' && character.id === 'schoolboy_shoma') {
            console.log(`[TalentManager] Applied Grass Growth talent to ${character.name}: Grass Ball applies delayed healing buff`);
            
            // Update ability descriptions to reflect the grass growth effect
            if (typeof window.updateShomaAbilityDescriptions === 'function') {
                window.updateShomaAbilityDescriptions(character);
            }
        }
        // --- END NEW ---

        // --- NEW: Handle Shoma's Magical Empowerment talent ---
        if (property === 'magicalEmpowermentEnabled' && character.id === 'schoolboy_shoma') {
            console.log(`[TalentManager] Applied Magical Empowerment talent to ${character.name}: Grass Ball grants +30% magical damage buff`);
            
            // Update ability descriptions to reflect the magical empowerment effect
            if (typeof window.updateShomaAbilityDescriptions === 'function') {
                window.updateShomaAbilityDescriptions(character);
            }
        }
    }

    /**
     * Add ability to character from talent
     */
    async addAbilityToCharacter(character, effect) {
        const { abilityId, keybind, specialType } = effect;
        
        console.log(`[TalentManager] Adding ability ${abilityId} to ${character.name} with keybind ${keybind}`);
        
        // Check if the ability is already added
        const existingAbility = character.abilities?.find(a => a.id === abilityId);
        if (existingAbility) {
            console.log(`[TalentManager] Ability ${abilityId} already exists for ${character.name}`);
            return;
        }
        
        // Use the character's built-in method for Fan of Knives
        if (abilityId === 'fan_of_knives') {
            if (typeof character.addFanOfKnivesAbility === 'function') {
                const success = await character.addFanOfKnivesAbility(keybind);
                if (success) {
                    console.log(`[TalentManager] Successfully added Fan of Knives to ${character.name} using character method`);
                } else {
                    console.error(`[TalentManager] Failed to add Fan of Knives to ${character.name}`);
                }
            } else {
                console.error(`[TalentManager] Character ${character.name} does not have addFanOfKnivesAbility method`);
            }
            return;
        }
        
        // For other abilities, use the existing logic
        console.warn(`[TalentManager] Unknown ability ID: ${abilityId}`);
    }

    /**
     * Setup deadly power talent for Ayane
     */
    setupDeadlyPower(character, effect) {
        const { thresholdDamage, critChanceBonus } = effect;
        
        console.log(`[TalentManager] Setting up Deadly Power for ${character.name}: 100% crit chance when above ${thresholdDamage} Physical Damage`);
        
        // Initialize deadly power config
        character.deadlyPowerConfig = {
            thresholdDamage,
            critChanceBonus,
            isActive: false,
            originalCritChance: character.stats.critChance || 0
        };
        
        // Use the ability file functions if available
        if (typeof window.initializeDeadlyPower === 'function') {
            window.initializeDeadlyPower(character);
        } else {
            // Fallback to checking state directly
            this.checkDeadlyPowerState(character);
        }
        
        console.log(`[TalentManager] Deadly Power set up for ${character.name}`);
    }

    /**
     * Check and update deadly power state
     */
    checkDeadlyPowerState(character) {
        if (!character.deadlyPowerConfig) return;
        
        // Use the ability file function if available
        if (typeof window.checkDeadlyPowerState === 'function') {
            window.checkDeadlyPowerState(character);
        } else {
            // Fallback implementation
            const config = character.deadlyPowerConfig;
            const currentPhysicalDamage = character.stats.physicalDamage || 0;
            const shouldBeActive = currentPhysicalDamage > config.thresholdDamage;
            
            if (shouldBeActive && !config.isActive) {
                this.activateDeadlyPower(character);
            } else if (!shouldBeActive && config.isActive) {
                this.deactivateDeadlyPower(character);
            }
        }
    }

    /**
     * Activate deadly power
     */
    activateDeadlyPower(character) {
        // Use the ability file function if available
        if (typeof window.activateDeadlyPower === 'function') {
            window.activateDeadlyPower(character);
        } else {
            // Fallback implementation
            const config = character.deadlyPowerConfig;
            if (!config) return;
            
            config.isActive = true;
            character.stats.critChance = 1.0;
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${character.name}'s Deadly Power activates! 100% Critical Hit Chance!`);
        }
    }

    /**
     * Deactivate deadly power
     */
    deactivateDeadlyPower(character) {
        // Use the ability file function if available
        if (typeof window.deactivateDeadlyPower === 'function') {
            window.deactivateDeadlyPower(character);
        } else {
            // Fallback implementation
            const config = character.deadlyPowerConfig;
            if (!config) return;
            
            config.isActive = false;
            character.stats.critChance = config.originalCritChance;
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`${character.name}'s Deadly Power deactivates as Physical Damage drops below ${config.thresholdDamage}.`);
        }
    }

    /**
     * Create visual indicator for Deadly Power
     */
    createDeadlyPowerIndicator(character) {
        // Try multiple possible character element IDs
        const possibleIds = [
            `character-${character.instanceId}`,
            `character-${character.id}`,
            `character-${character.instanceId || character.id}`,
            `player-character-${character.id}`,
            `ally-character-${character.id}`
        ];
        
        let charElement = null;
        for (const id of possibleIds) {
            charElement = document.getElementById(id);
            if (charElement) {
                console.log(`[Deadly Power] Found character element with ID: ${id}`);
                break;
            }
        }
        
        if (!charElement) {
            console.log(`[Deadly Power] Could not find character element for ${character.name}. Will try again later`);
            return;
        }
        
        // Remove existing indicator
        const existingIndicator = charElement.querySelector('.deadly-power-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'deadly-power-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff0000, #ff6b6b, #ffaa00);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
            z-index: 10000;
            pointer-events: none;
            border: 2px solid #ff0000;
            animation: deadly-power-pulse 1.5s ease-in-out infinite;
            display: block !important;
            visibility: visible !important;
            text-align: center;
            white-space: nowrap;
        `;
        
        // Ensure parent has relative positioning
        const computedStyle = window.getComputedStyle(charElement);
        if (computedStyle.position === 'static') {
            charElement.style.position = 'relative';
        }
        
        // Add CSS animation if not already present
        if (!document.getElementById('deadly-power-styles')) {
            const style = document.createElement('style');
            style.id = 'deadly-power-styles';
            style.textContent = `
                @keyframes deadly-power-pulse {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1); 
                        box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
                        background: linear-gradient(135deg, #ff0000, #ff6b6b, #ffaa00);
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.1); 
                        box-shadow: 0 0 30px rgba(255, 0, 0, 1.0);
                        background: linear-gradient(135deg, #ff6b6b, #ffaa00, #ff0000);
                    }
                }
                
                @keyframes deadly-power-activation {
                    0% { transform: translateX(-50%) scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: translateX(-50%) scale(1.5) rotate(180deg); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1) rotate(360deg); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        indicator.textContent = '💀 DEADLY POWER';
        indicator.title = 'Deadly Power: 100% Critical Hit Chance while above 750 Physical Damage';
        
        charElement.appendChild(indicator);
        
        console.log(`[TalentManager] Created deadly power indicator for ${character.name}`);
    }

    /**
     * Remove visual indicator for Butterfly Protection
     */
    removeButterflyProtectionIndicator(character) {
        // Use the ability file function if available
        if (typeof window.removeButterflyProtectionVisuals === 'function') {
            window.removeButterflyProtectionVisuals(character);
        } else {
            // Fallback implementation
            const possibleIds = [
                `character-${character.instanceId}`,
                `character-${character.id}`,
                `character-${character.instanceId || character.id}`,
                `player-character-${character.id}`,
                `ally-character-${character.id}`
            ];
            
            let charElement = null;
            for (const id of possibleIds) {
                charElement = document.getElementById(id);
                if (charElement) break;
            }
            
            if (!charElement) return;
            
            const indicator = charElement.querySelector('.butterfly-protection-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }

    /**
     * Remove visual indicator for Blade Mastery
     */
    removeBladeMasteryIndicator(character) {
        // Use the ability file function if available
        if (typeof window.removeBladeMasteryVisuals === 'function') {
            window.removeBladeMasteryVisuals(character);
        } else {
            // Fallback implementation
            const possibleIds = [
                `character-${character.instanceId}`,
                `character-${character.id}`,
                `character-${character.instanceId || character.id}`,
                `player-character-${character.id}`,
                `ally-character-${character.id}`
            ];
            
            let charElement = null;
            for (const id of possibleIds) {
                charElement = document.getElementById(id);
                if (charElement) break;
            }
            
            if (!charElement) return;
            
            const indicator = charElement.querySelector('.blade-mastery-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }

    /**
     * Remove visual indicator for Deadly Power
     */
    removeDeadlyPowerIndicator(character) {
        // Use the ability file function if available
        if (typeof window.removeDeadlyPowerVisuals === 'function') {
            window.removeDeadlyPowerVisuals(character);
        } else {
            // Fallback implementation
            const possibleIds = [
                `character-${character.instanceId}`,
                `character-${character.id}`,
                `character-${character.instanceId || character.id}`,
                `player-character-${character.id}`,
                `ally-character-${character.id}`
            ];
            
            let charElement = null;
            for (const id of possibleIds) {
                charElement = document.getElementById(id);
                if (charElement) break;
            }
            
            if (!charElement) return;
            
            const indicator = charElement.querySelector('.deadly-power-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }

    /**
     * Show VFX for Deadly Power activation
     */
    showDeadlyPowerActivationVFX(character) {
        const possibleIds = [
            `character-${character.instanceId}`,
            `character-${character.id}`,
            `character-${character.instanceId || character.id}`,
            `player-character-${character.id}`,
            `ally-character-${character.id}`
        ];
        
        let charElement = null;
        for (const id of possibleIds) {
            charElement = document.getElementById(id);
            if (charElement) break;
        }
        
        if (!charElement) return;
        
        const vfx = document.createElement('div');
        vfx.className = 'deadly-power-activation-vfx';
        vfx.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff0000;
            font-weight: bold;
            font-size: 20px;
            text-shadow: 0 0 10px rgba(255, 0, 0, 1);
            z-index: 999;
            pointer-events: none;
            animation: deadly-power-activation-vfx 2s ease-out forwards;
        `;
        vfx.textContent = '💀 DEADLY POWER ACTIVATED! 💀';
        
        // Add CSS animation if not already present
        if (!document.getElementById('deadly-power-activation-vfx-styles')) {
            const style = document.createElement('style');
            style.id = 'deadly-power-activation-vfx-styles';
            style.textContent = `
                @keyframes deadly-power-activation-vfx {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
                    80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        charElement.appendChild(vfx);
        
        // Remove VFX after animation
        setTimeout(() => {
            vfx.remove();
        }, 2000);
    }

    /**
     * Clean up talent-related UI elements and listeners for a character
     */
    cleanupCharacterTalents(character) {
        if (!character) return;
        
        console.log(`[TalentManager] Cleaning up talents for ${character.name}`);
        
        // Remove Butterfly Protection indicator
        this.removeButterflyProtectionIndicator(character);
        
        // Remove Blade Mastery indicator
        this.removeBladeMasteryIndicator(character);
        
        // Remove Deadly Power indicator
        this.removeDeadlyPowerIndicator(character);
        
        // Remove event listeners
        if (character.butterflyProtectionListener) {
            document.removeEventListener('character:dodged', character.butterflyProtectionListener);
            character.butterflyProtectionListener = null;
        }
        
        if (character.butterflyStealthListener) {
            document.removeEventListener('character:dodged', character.butterflyStealthListener);
            character.butterflyStealthListener = null;
        }
        
        if (character.bladeMasteryListener) {
            document.removeEventListener('character:damage-dealt', character.bladeMasteryListener);
            character.bladeMasteryListener = null;
        }

        if (character.vampiricStrikesListener) {
            document.removeEventListener('character:damage-dealt', character.vampiricStrikesListener);
            character.vampiricStrikesListener = null;
        }

        if (character.spectralMomentumListener) {
            document.removeEventListener('character:damage-dealt', character.spectralMomentumListener);
            character.spectralMomentumListener = null;
        }
        
        if (character.bladeMasteryUIListener) {
            document.removeEventListener('character:ui-created', character.bladeMasteryUIListener);
            character.bladeMasteryUIListener = null;
        }
        
        // Note: Butterfly Healing is handled by the passive handler's onDodge method
        
        // Remove Spectral Daggers listener and visuals
        if (character.spectralDaggersListener) {
            document.removeEventListener('turn:start', character.spectralDaggersListener);
            character.spectralDaggersListener = null;
        }
        
        if (character.spectralDaggersBuffListener) {
            document.removeEventListener('BuffApplied', character.spectralDaggersBuffListener);
            character.spectralDaggersBuffListener = null;
        }

        // Remove Shadow Dance listener
        if (character._shadowDanceListener) {
            document.removeEventListener('AbilityUsed', character._shadowDanceListener);
            character._shadowDanceListener = null;
            character._shadowDanceListenerAttached = false;
        }
        
        // Remove spectral daggers visuals
        this.removeSpectralDaggersVisuals(character);
        
        // Clear spectral daggers config
        if (character.spectralDaggersConfig) {
            character.spectralDaggersConfig = null;
        }
        
        // Clear talent-related config
        if (character.butterflyProtectionConfig) {
            character.butterflyProtectionConfig = null;
        }
        
        if (character.bladeMasteryConfig) {
            character.bladeMasteryConfig = null;
        }
        
        if (character.spectralMomentumConfig) {
            character.spectralMomentumConfig = null;
        }
        
        if (character.deadlyPowerConfig) {
            character.deadlyPowerConfig = null;
        }

        // Remove Doubled Physical Damage VFX if applied
        if (typeof window.removeDoubledPhysicalDamageVFX === 'function') {
            window.removeDoubledPhysicalDamageVFX(character);
        }
        
        console.log(`[TalentManager] Cleaned up talents for ${character.name}`);
    }

    /**
     * Reset all talents for a character and clean up UI
     */
    async resetCharacterTalents(characterId, userId) {
        if (!userId) {
            userId = getCurrentUserId();
        }
        
        if (!userId) {
            console.error('No user ID available for resetting talents');
            return;
        }
        
        try {
            // Save empty talent selection
            await this.saveSelectedTalents(characterId, {}, userId);
            
            // Find character instances and clean up
            const characterElements = document.querySelectorAll(`[id^="character-${characterId}"]`);
            characterElements.forEach(element => {
                // Remove visual indicators
                const indicator = element.querySelector('.butterfly-protection-indicator');
                if (indicator) {
                    indicator.remove();
                }
            });
            
            console.log(`[TalentManager] Reset talents for ${characterId}`);
            return true;
        } catch (error) {
            console.error(`Error resetting talents for ${characterId}:`, error);
            throw error;
        }
    }
    
    /**
     * Setup blade mastery talent for Ayane
     */
    setupBladeMastery(character, effect) {
        const { damagePerHit, stacksInfinitely } = effect;
        
        console.log(`[TalentManager] Setting up Blade Mastery for ${character.name}: +${damagePerHit} Physical Damage per hit dealt${stacksInfinitely ? ' (infinite stacks)' : ''}`);
        
        // Initialize blade mastery config
        character.bladeMasteryConfig = {
            damagePerHit,
            stacksInfinitely,
            currentStacks: 0,
            totalBonusDamage: 0
        };
        
        // Set up damage dealt listener
        const damageListener = (event) => {
            const { character: attacker, damage } = event.detail;
            
            // Only trigger for our character
            if (attacker !== character) return;
            
            // Only trigger if damage was actually dealt
            if (damage <= 0) return;
            
            const config = character.bladeMasteryConfig;
            if (!config) return;
            
            // Increment stacks
            config.currentStacks++;
            config.totalBonusDamage += config.damagePerHit;
            
            // Apply permanent physical damage bonus to base stats
            character.baseStats.physicalDamage = (character.baseStats.physicalDamage || 0) + config.damagePerHit;
            
            // Recalculate stats to apply the bonus
            character.recalculateStats();
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`<span class="talent-enhanced">${character.name} gains +${config.damagePerHit} Physical Damage from Blade Mastery! (${config.currentStacks} stacks, +${config.totalBonusDamage} total)</span>`);
            
            console.log(`[Blade Mastery] ${character.name} gained stack ${config.currentStacks} (+${config.damagePerHit} damage, +${config.totalBonusDamage} total)`);
        };
        
        // Listen for damage dealt events
        document.addEventListener('character:damage-dealt', damageListener);
        
        // Store listener for cleanup
        character.bladeMasteryListener = damageListener;
        
        console.log(`[TalentManager] Blade Mastery set up for ${character.name}`);
    }

    /**
     * Setup spectral momentum talent for Ayane
     */
    setupSpectralMomentum(character, effect) {
        const { damageThreshold, cooldownReduction } = effect;
        
        console.log(`[TalentManager] Setting up Spectral Momentum for ${character.name}: -${cooldownReduction} turns cooldown when dealing >${damageThreshold} damage`);
        
        // Initialize spectral momentum config
        character.spectralMomentumConfig = {
            damageThreshold,
            cooldownReduction
        };
        
        // Set up damage dealt listener
        const damageListener = (event) => {
            const { character: attacker, damage } = event.detail;
            
            // Only trigger for our character
            if (attacker !== character) return;
            
            // Check if damage meets threshold
            if (damage <= damageThreshold) return;
            
            const config = character.spectralMomentumConfig;
            if (!config) return;
            
            // Reduce cooldowns for all abilities with active cooldowns
            let abilitiesAffected = 0;
            if (character.abilities) {
                character.abilities.forEach(ability => {
                    if (ability.currentCooldown > 0) {
                        const oldCooldown = ability.currentCooldown;
                        ability.currentCooldown = Math.max(0, ability.currentCooldown - cooldownReduction);
                        if (ability.currentCooldown < oldCooldown) {
                            abilitiesAffected++;
                        }
                    }
                });
            }
            
            if (abilitiesAffected > 0) {
                const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
                log(`<span class="talent-enhanced">${character.name}'s Spectral Momentum reduces ${abilitiesAffected} ability cooldowns by ${cooldownReduction} turns!</span>`);
                
                console.log(`[Spectral Momentum] ${character.name} dealt ${damage} damage (>${damageThreshold}), reduced ${abilitiesAffected} ability cooldowns by ${cooldownReduction} turns`);
                
                // Update UI to reflect cooldown changes
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            }
        };
        
        // Listen for damage dealt events
        document.addEventListener('character:damage-dealt', damageListener);
        
        // Store listener for cleanup
        character.spectralMomentumListener = damageListener;
        
        console.log(`[TalentManager] Spectral Momentum set up for ${character.name}`);
    }

    /**
     * Setup spectral daggers talent for Ayane
     */
    setupSpectralDaggers(character, effect) {
        const { dodgeThreshold, daggerCount, damagePerDagger, autoFire } = effect;
        
        console.log(`[TalentManager] Setting up Spectral Daggers for ${character.name}: ${daggerCount} daggers, ${damagePerDagger} damage each, dodge threshold: ${dodgeThreshold * 100}%`);
        
        // Initialize spectral daggers config
        character.spectralDaggersConfig = {
            dodgeThreshold,
            daggerCount,
            damagePerDagger,
            autoFire,
            active: false
        };
        
        // Set up turn start listener for auto-fire
        const turnStartListener = (event) => {
            const { character: currentChar } = event.detail || {};
            
            // Only trigger for our character
            if (currentChar !== character) return;
            
            // Check if spectral daggers are active
            if (!character.spectralDaggersConfig || !character.spectralDaggersConfig.active) return;
            
            this.fireSpectralDaggers(character);
        };
        
        // Set up buff applied listener to check activation when dodge buffs are added
        const buffAppliedListener = (event) => {
            const { character: buffedChar } = event.detail || {};
            
            // Only trigger for our character
            if (buffedChar !== character) return;
            
            // Check if the buff affects dodge chance and recheck activation
            this.checkSpectralDaggersActivation(character);
        };
        
        // Listen for turn start events
        document.addEventListener('turn:start', turnStartListener);
        
        // Listen for buff applied events
        document.addEventListener('BuffApplied', buffAppliedListener);
        
        // Store listeners for cleanup
        character.spectralDaggersListener = turnStartListener;
        character.spectralDaggersBuffListener = buffAppliedListener;
        
        // Initial activation check
        this.checkSpectralDaggersActivation(character);
        
        console.log(`[TalentManager] Spectral Daggers set up for ${character.name}`);
    }

    /**
     * Check if spectral daggers should be activated based on dodge chance
     */
    checkSpectralDaggersActivation(character) {
        if (!character.spectralDaggersConfig) return;
        
        const config = character.spectralDaggersConfig;
        
        // Get current dodge chance including buffs
        let currentDodgeChance = character.stats?.dodgeChance || 0;
        
        // Add dodge chance from active buffs
        if (character.buffs && character.buffs.length > 0) {
            character.buffs.forEach(buff => {
                if (buff.statModifiers && buff.statModifiers.dodgeChance) {
                    const modifier = buff.statModifiers.dodgeChance;
                    if (modifier.operation === 'add') {
                        currentDodgeChance += modifier.value;
                    } else if (modifier.operation === 'multiply') {
                        currentDodgeChance *= modifier.value;
                    }
                }
            });
        }
        
        const shouldBeActive = currentDodgeChance >= config.dodgeThreshold;
        
        console.log(`[TalentManager] Checking Spectral Daggers activation for ${character.name}: base dodge=${((character.stats?.dodgeChance || 0) * 100).toFixed(1)}%, total dodge=${(currentDodgeChance * 100).toFixed(1)}%, threshold=${(config.dodgeThreshold * 100).toFixed(1)}%, should be active=${shouldBeActive}`);
        
        if (shouldBeActive && !config.active) {
            // Activate spectral daggers
            config.active = true;
            this.summonSpectralDaggers(character);
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`<span class="talent-enhanced">✨ ${character.name}'s Spectral Daggers activated! (${(currentDodgeChance * 100).toFixed(1)}% dodge chance)</span>`);
        } else if (!shouldBeActive && config.active) {
            // Deactivate spectral daggers
            config.active = false;
            this.removeSpectralDaggersVisuals(character);
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`<span class="talent-enhanced">💫 ${character.name}'s Spectral Daggers deactivated (${(currentDodgeChance * 100).toFixed(1)}% dodge chance)</span>`);
        }
    }

    /**
     * Summon spectral daggers visuals
     */
    summonSpectralDaggers(character) {
        console.log(`[TalentManager] Summoning spectral daggers for ${character.name}`);
        
        // Find character's UI element
        const characterSlot = document.querySelector(`[data-character-id="${character.id}"]`);
        if (!characterSlot) {
            console.warn(`[TalentManager] Character slot not found for ${character.name}`);
            return;
        }
        
        // Remove existing daggers
        const existingDaggers = characterSlot.querySelectorAll('.spectral-dagger');
        existingDaggers.forEach(dagger => dagger.remove());
        
        // Add spectral daggers class to character slot
        characterSlot.classList.add('has-spectral-daggers');
        
        // Create dagger elements
        const config = character.spectralDaggersConfig;
        for (let i = 0; i < config.daggerCount; i++) {
            const dagger = document.createElement('div');
            dagger.className = 'spectral-dagger';
            dagger.style.left = i === 0 ? '-25px' : '85px';
            dagger.style.top = '30px';
            
            if (i === 0) {
                dagger.style.animation = 'spectral-dagger-float-left 2s ease-in-out infinite';
            } else {
                dagger.style.animation = 'spectral-dagger-float-right 2s ease-in-out infinite';
            }
            
            characterSlot.appendChild(dagger);
        }
        
        console.log(`[TalentManager] Summoned ${config.daggerCount} spectral daggers for ${character.name}`);
    }

    /**
     * Fire spectral daggers at random enemies
     */
    fireSpectralDaggers(character) {
        const config = character.spectralDaggersConfig;
        if (!config || !config.active) return;
        
        console.log(`[TalentManager] Firing spectral daggers for ${character.name}`);
        
        // Get all enemies from the game state
        const enemies = window.gameManager?.gameState?.aiCharacters || [];
        
        // Debug logging to understand enemy structure
        console.log(`[TalentManager] Enemy objects:`, enemies);
        enemies.forEach((enemy, index) => {
            console.log(`[TalentManager] Enemy ${index}:`, {
                name: enemy.name,
                currentHP: enemy.currentHP,
                hp: enemy.hp,
                stats: enemy.stats,
                isDead: enemy.isDead(),
                isAlive: !enemy.isDead()
            });
        });
        
        const aliveEnemies = enemies.filter(enemy => !enemy.isDead());
        
        console.log(`[TalentManager] Found ${enemies.length} total enemies, ${aliveEnemies.length} alive`);
        
        if (aliveEnemies.length === 0) {
            console.log(`[TalentManager] No alive enemies to target with spectral daggers`);
            return;
        }
        
        // Fire each dagger at a random enemy
        for (let i = 0; i < config.daggerCount; i++) {
            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            
            // Show VFX for spectral dagger firing
            this.showSpectralDaggerVFX(character, randomEnemy, i);
            
            // Apply damage
            const result = randomEnemy.applyDamage(config.damagePerDagger, 'magical', character, { 
                abilityId: 'spectral_daggers',
                isSpectralDagger: true 
            });
            
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`🗡️ ${character.name}'s spectral dagger strikes ${randomEnemy.name} for ${result.damage} damage!`);
        }
        
        console.log(`[TalentManager] Fired ${config.daggerCount} spectral daggers`);
    }

    /**
     * Remove spectral daggers visuals
     */
    removeSpectralDaggersVisuals(character) {
        console.log(`[TalentManager] Removing spectral daggers visuals for ${character.name}`);
        
        // Find character's UI element
        const characterSlot = document.querySelector(`[data-character-id="${character.id}"]`);
        if (characterSlot) {
            // Remove spectral daggers class
            characterSlot.classList.remove('has-spectral-daggers');
            
            // Remove dagger elements
            const daggers = characterSlot.querySelectorAll('.spectral-dagger');
            daggers.forEach(dagger => dagger.remove());
            
            console.log(`[TalentManager] Removed spectral daggers visuals for ${character.name}`);
        }
    }

    /**
     * Show VFX for spectral dagger firing
     */
    showSpectralDaggerVFX(caster, target, daggerIndex) {
        try {
            console.log(`[TalentManager] Creating spectral dagger VFX from ${caster.name} to ${target.name}`);
            
            // Get character elements
            const casterElement = document.querySelector(`[data-character-id="${caster.id}"]`);
            const targetElement = document.querySelector(`[data-character-id="${target.id}"]`);
            
            if (!casterElement || !targetElement) {
                console.log(`[TalentManager] Missing character elements for spectral dagger VFX - caster: ${!!casterElement}, target: ${!!targetElement}`);
                return;
            }

            console.log(`[TalentManager] Character elements found, creating VFX container`);

            // Create VFX container
            const vfxContainer = document.createElement('div');
            vfxContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 10000;
                background: rgba(0,0,0,0.1);
            `;
            document.body.appendChild(vfxContainer);

            // Get positions
            const casterRect = casterElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            const startX = casterRect.left + casterRect.width / 2;
            const startY = casterRect.top + casterRect.height / 2;
            const endX = targetRect.left + targetRect.width / 2 + (Math.random() - 0.5) * 40;
            const endY = targetRect.top + targetRect.height / 2 + (Math.random() - 0.5) * 40;

            console.log(`[TalentManager] Dagger path: (${startX}, ${startY}) -> (${endX}, ${endY})`);

            // Create spectral dagger projectile
            const dagger = document.createElement('div');
            dagger.style.cssText = `
                position: absolute;
                left: ${startX}px;
                top: ${startY}px;
                width: 30px;
                height: 8px;
                background: linear-gradient(90deg, #4444ff, #aaaaff, #4444ff);
                border-radius: 4px;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 20px rgba(68, 68, 255, 0.9), 0 0 40px rgba(68, 68, 255, 0.5);
                transition: all 0.8s ease-out;
                opacity: 1;
                border: 2px solid #aaaaff;
            `;
            vfxContainer.appendChild(dagger);

            // Create spectral trail
            const trail = document.createElement('div');
            trail.style.cssText = `
                position: absolute;
                left: ${startX}px;
                top: ${startY}px;
                width: 60px;
                height: 4px;
                background: linear-gradient(90deg, transparent, rgba(68, 68, 255, 0.6), transparent);
                transform: translate(-50%, -50%);
                transition: all 0.8s ease-out;
                opacity: 0.8;
            `;
            vfxContainer.appendChild(trail);

            // Calculate rotation angle
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            
            // Apply rotation
            dagger.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            trail.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

            console.log(`[TalentManager] Dagger created, animating in ${50 + daggerIndex * 150}ms`);

            // Animate dagger to target
            setTimeout(() => {
                console.log(`[TalentManager] Starting dagger animation`);
                dagger.style.left = `${endX}px`;
                dagger.style.top = `${endY}px`;
                trail.style.left = `${endX}px`;
                trail.style.top = `${endY}px`;
                trail.style.opacity = '0';
            }, 50 + daggerIndex * 150); // Stagger multiple daggers

            // Create impact effect
            setTimeout(() => {
                console.log(`[TalentManager] Creating impact effect`);
                // Create impact particles
                for (let i = 0; i < 8; i++) {
                    const particle = document.createElement('div');
                    particle.style.cssText = `
                        position: absolute;
                        left: ${endX}px;
                        top: ${endY}px;
                        width: 6px;
                        height: 6px;
                        background: #4444ff;
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        transition: all 0.8s ease-out;
                        box-shadow: 0 0 10px rgba(68, 68, 255, 0.8);
                    `;
                    
                    const angle = (i * 45) * Math.PI / 180;
                    const distance = 30 + Math.random() * 20;
                    
                    vfxContainer.appendChild(particle);
                    
                    // Animate particles outward
                    setTimeout(() => {
                        particle.style.left = `${endX + Math.cos(angle) * distance}px`;
                        particle.style.top = `${endY + Math.sin(angle) * distance}px`;
                        particle.style.opacity = '0';
                        particle.style.transform = `translate(-50%, -50%) scale(0)`;
                    }, 50);
                }

                // Fade out dagger
                dagger.style.opacity = '0';
                dagger.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(0.3)`;
                
            }, 850 + daggerIndex * 150);

            // Clean up VFX
            setTimeout(() => {
                console.log(`[TalentManager] Cleaning up spectral dagger VFX`);
                if (vfxContainer && vfxContainer.parentNode) {
                    vfxContainer.remove();
                }
            }, 1800 + daggerIndex * 150);

        } catch (error) {
            console.error(`[TalentManager] Error showing spectral dagger VFX:`, error);
        }
    }

    /**
     * Reduce all ability cooldowns for a character by a specified amount (used by talents)
     */
    applyReduceCooldowns(character, effect) {
        if (!character || !character.abilities || !effect || typeof effect.amount !== 'number') {
            console.warn('[TalentManager] applyReduceCooldowns: Invalid arguments', { character, effect });
            return;
        }
        const amount = effect.amount;
        let affected = 0;
        character.abilities.forEach(ability => {
            if (ability.currentCooldown > 0) {
                const oldCooldown = ability.currentCooldown;
                ability.currentCooldown = Math.max(0, ability.currentCooldown - amount);
                if (ability.currentCooldown < oldCooldown) {
                    affected++;
                }
            }
        });
        if (affected > 0) {
            const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            log(`<span class="talent-enhanced">${character.name}'s talent reduces ${affected} ability cooldown(s) by ${amount} turn(s)!</span>`);
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(character);
            }
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
