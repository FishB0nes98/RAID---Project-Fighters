/**
 * Ability Modifier - Ensures that ability modifications from talents can be applied directly
 * This file patches game objects to allow modifying ability properties at runtime
 */

(function() {
    // Keep track of ability modifications
    const abilityModifications = {};
    
    // Function to apply ability modifications when an ability is used
    function applyStoredModifications(ability, characterId) {
        const abilityId = ability.id;
        
        // Check for character-specific modifications first
        if (characterId && abilityModifications[characterId] && abilityModifications[characterId][abilityId]) {
            console.log(`[ApplyStoredModifications] Applying character-specific modifications for ${characterId}, ${abilityId}`);
            
            // Apply all stored modifications for this character's ability
            for (const prop in abilityModifications[characterId][abilityId]) {
                const value = abilityModifications[characterId][abilityId][prop];
                ability[prop] = value;
                console.log(`[ApplyStoredModifications] Applied ${prop} = ${value} to ${ability.name || ability.id}`);
                
                // Always regenerate description after any property change
                if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                    console.log(`[ApplyStoredModifications] Updated description for ${ability.name || ability.id}`);
                }
            }
            
            // If there are any changes, dispatch an event to notify UI components
            if (Object.keys(abilityModifications[characterId][abilityId]).length > 0) {
                const abilityModifiedEvent = new CustomEvent('abilityModified', {
                    detail: {
                        characterId: characterId,
                        abilityId: abilityId,
                        ability: ability,
                        properties: Object.keys(abilityModifications[characterId][abilityId])
                    },
                    bubbles: true
                });
                document.dispatchEvent(abilityModifiedEvent);
            }
        }
        
        // Also check for legacy global modifications (for backward compatibility)
        if (abilityModifications[abilityId]) {
            console.log(`[ApplyStoredModifications] Applying legacy global modifications for ${abilityId}`);
            
            // Apply all stored modifications
            for (const prop in abilityModifications[abilityId]) {
                ability[prop] = abilityModifications[abilityId][prop];
                
                // Always regenerate description after any property change
                if (typeof ability.generateDescription === 'function') {
                    ability.generateDescription();
                    console.log(`[ApplyStoredModifications] Updated description for ${ability.name || ability.id}`);
                }
            }
            
            // If there are any changes, dispatch an event to notify UI components
            if (Object.keys(abilityModifications[abilityId]).length > 0) {
                const abilityModifiedEvent = new CustomEvent('abilityModified', {
                    detail: {
                        abilityId: abilityId,
                        ability: ability,
                        properties: Object.keys(abilityModifications[abilityId])
                    },
                    bubbles: true
                });
                document.dispatchEvent(abilityModifiedEvent);
            }
        }
    }
    
    // Patch the Ability class use method to apply modifications before use
    const originalAbilityUse = Ability.prototype.use;
    Ability.prototype.use = function(caster, targetOrTargets, actualManaCost, options = {}) {
        // Apply any stored modifications, passing the caster's ID for character-specific modifications
        const characterId = caster ? caster.id : null;
        applyStoredModifications(this, characterId);
        
        // Call the original method and pass back its result
        return originalAbilityUse.call(this, caster, targetOrTargets, actualManaCost, options);
    };
    
    // Wrap the CharacterFactory patch in DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Patch CharacterFactory.prototype.createCharacter to apply ability mods immediately
        // Check if CharacterFactory and its prototype methods exist before patching
        if (typeof CharacterFactory !== 'undefined' && CharacterFactory.prototype && CharacterFactory.prototype.createCharacter) {
            const originalCreateCharacter = CharacterFactory.prototype.createCharacter;
            CharacterFactory.prototype.createCharacter = async function(charData, selectedTalentIds = []) {
                // Call the original method first
                const character = await originalCreateCharacter.call(this, charData, selectedTalentIds);
                
                // Apply any stored modifications to abilities immediately
                if (character && character.abilities) {
                    character.abilities.forEach(ability => {
                        applyStoredModifications(ability, character.id);
                        
                        // Special handling for Schoolboy Shoma's Boink ability
                        if (character.id === 'schoolboy_shoma' && ability.id === 'boink') {
                            // Attach the generateDescription function if it doesn't exist
                            if (!ability.generateDescription && typeof window.generateBoinkDescription === 'function') {
                                ability.generateDescription = window.generateBoinkDescription;
                                ability.character = character;
                                console.log(`[AbilityModifier] Attached generateDescription to Boink ability for ${character.name}`);
                            }
                        }
                    });
                }
                
                return character;
            };
            console.log("Patched CharacterFactory.createCharacter to apply ability mods immediately");
        } else {
            console.warn("CharacterFactory or CharacterFactory.prototype.createCharacter not found. Skipping patch.");
        }
    });
    
    // Add ability modification storage method to Character class
    Character.prototype.storeAbilityModification = function(abilityId, property, value) {
        // Prevent infinite loops
        if (this._updatingAbilities) {
            console.log(`[StoreAbilityModification] Skipping modification for ${this.name} to prevent infinite loop`);
            return;
        }
        
        // Initialize if needed
        if (!abilityModifications[abilityId]) {
            abilityModifications[abilityId] = {};
        }
        
        // Log modification request
        console.log(`[StoreAbilityModification] Storing modification for ${abilityId}.${property} = ${value}`);
        
        // Store the modification
        abilityModifications[abilityId][property] = value;
        
        // Find and update the actual ability if it exists
        const ability = this.abilities.find(a => a.id === abilityId);
        if (ability) {
            const oldValue = ability[property];
            
            // Only proceed if the value is actually different
            if (oldValue === value) {
                console.log(`[StoreAbilityModification] Value unchanged for ${ability.name}.${property}, skipping update`);
                return;
            }
            
            ability[property] = value;
            console.log(`[StoreAbilityModification] Modified ${this.name}'s ${abilityId} ${property} from ${oldValue} to ${value}`);
            
            // Handle cooldown modifications specially
            if (property === 'cooldown') {
                console.log(`[StoreAbilityModification] Cooldown modified for ${ability.name}: ${oldValue} → ${value}`);
            }
            
            let descriptionChanged = false;
            if (typeof ability.generateDescription === 'function') {
                const oldDescription = ability.description;
                ability.generateDescription();
                
                // Compare descriptions to see if there was a change
                if (oldDescription !== ability.description) {
                    console.log(`[StoreAbilityModification] Updated description for ${ability.name}`);
                    console.log(`Old: ${oldDescription}`);
                    console.log(`New: ${ability.description}`);
                    descriptionChanged = true;
                } else {
                    console.log(`[StoreAbilityModification] Description unchanged for ${ability.name} despite property change`);
                }
            }
            
            // Only dispatch event and update UI if something actually changed
            if (descriptionChanged || property === 'cooldown') {
                // Dispatch an event to notify that the ability was modified
                const abilityModifiedEvent = new CustomEvent('abilityModified', {
                    detail: {
                        abilityId: abilityId,
                        property: property,
                        oldValue: oldValue,
                        newValue: value,
                        character: this,
                        ability: ability
                    },
                    bubbles: true
                });
                document.dispatchEvent(abilityModifiedEvent);
                
                // Update the UI with a delay to break call stack
                if (window.gameManager && window.gameManager.uiManager && this.instanceId) {
                    setTimeout(() => {
                        try {
                            window.gameManager.uiManager.updateCharacterUI(this);
                            console.log(`[StoreAbilityModification] UI updated for ${this.name} after modifying ${abilityId}`);
                        } catch (error) {
                            console.warn(`[StoreAbilityModification] Error updating UI after ability modification: ${error.message}`);
                        }
                    }, 10);
                }
            } else {
                console.log(`[StoreAbilityModification] No meaningful changes detected, skipping UI update`);
            }
        } else {
            console.warn(`[StoreAbilityModification] Ability ${abilityId} not found on character ${this.name || this.id}`);
        }
    };
    
    // Override the existing applyAbilityModification to use our storage method
    Character.prototype.applyAbilityModification = function(abilityId, property, operation, value) {
        // Find the ability
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) {
            console.warn(`Ability ${abilityId} not found for ${this.name}`);
            return;
        }
        
        // Apply the modification based on operation
        let newValue;
        if (operation === 'set') {
            newValue = value;
        } else if (operation === 'add') {
            newValue = ability[property] + value;
        } else if (operation === 'multiply') {
            newValue = ability[property] * value;
        } else if (operation === 'divide') {
            newValue = ability[property] / value;
        } else {
            console.warn(`Unknown operation: ${operation}`);
            return;
        }
        
        // Store the modification
        this.storeAbilityModification(abilityId, property, newValue);
    };
    
    // Add a debug function to verify ability properties
    window.debugAbility = function(character, abilityId) {
        if (!character || !character.abilities) {
            console.log("Character not found or has no abilities");
            return;
        }
        
        const ability = character.abilities.find(a => a.id === abilityId);
        if (!ability) {
            console.log(`Ability ${abilityId} not found for ${character.name}`);
            return;
        }
        
        console.log(`=== DEBUG ABILITY: ${ability.name} (${ability.id}) ===`);
        console.log(`Cooldown: ${ability.cooldown}`);
        console.log(`Current cooldown: ${ability.currentCooldown || 0}/${ability.cooldown}`);
        console.log(`Mana cost: ${ability.manaCost}`);
        
        if (abilityModifications[abilityId]) {
            console.log("Applied modifications:");
            for (const prop in abilityModifications[abilityId]) {
                console.log(`  ${prop}: ${abilityModifications[abilityId][prop]}`);
            }
        } else {
            console.log("No modifications applied");
        }
        
        console.log("=== END DEBUG ===");
    };

    // Function to add a modification to a specific ability on a specific character
    window.addAbilityModification = function(characterId, abilityId, property, value) {
        if (!characterId || !abilityId) {
            console.warn('[AbilityModifier] addAbilityModification called without valid characterId or abilityId.');
            return;
        }
        if (!abilityModifications[characterId]) {
            abilityModifications[characterId] = {};
        }
        if (!abilityModifications[characterId][abilityId]) {
            abilityModifications[characterId][abilityId] = {};
        }
        abilityModifications[characterId][abilityId][property] = value;
        console.log(`[DEBUG_AM] Added modification for character ${characterId}, ability ${abilityId}: ${property} = ${value}`);
        // Dispatch an event to notify UI components that a modification has been added
        document.dispatchEvent(new CustomEvent('abilityModificationAdded', {
            detail: { characterId: characterId, abilityId: abilityId, property: property, value: value },
            bubbles: true
        }));
    };

    // Function to clear a specific modification from an ability on a specific character
    window.clearAbilityModification = function(characterId, abilityId, property) {
        if (!characterId || !abilityId) {
            console.warn('[AbilityModifier] clearAbilityModification called without valid characterId or abilityId.');
            return;
        }
        if (abilityModifications[characterId] &&
            abilityModifications[characterId][abilityId] &&
            abilityModifications[characterId][abilityId][property] !== undefined) {
            
            console.log(`[DEBUG_AM] Clearing modification for character ${characterId}, ability ${abilityId}, property ${property}`);
            delete abilityModifications[characterId][abilityId][property];

            // Clean up empty ability entry
            if (Object.keys(abilityModifications[characterId][abilityId]).length === 0) {
                delete abilityModifications[characterId][abilityId];
                console.log(`[DEBUG_AM] All modifications cleared for ability ${abilityId} on character ${characterId}, removing ability entry.`);
            }
            // Clean up empty character entry
            if (Object.keys(abilityModifications[characterId]).length === 0) {
                delete abilityModifications[characterId];
                console.log(`[DEBUG_AM] All modifications cleared for character ${characterId}, removing character entry.`);
            }
            
            // Dispatch an event to notify UI components that a modification has been cleared
            document.dispatchEvent(new CustomEvent('abilityModificationCleared', {
                detail: { characterId: characterId, abilityId: abilityId, property: property },
                bubbles: true
            }));
        } else {
            console.warn(`[DEBUG_AM] No modification found to clear for character ${characterId}, ability ${abilityId}, property ${property}`);
        }
    };
    
    // Apply stored modifications immediately to all character abilities after loading
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (window.gameManager && window.gameManager.gameState) {
                console.log("Applying stored ability modifications after game loaded");
                
                // Apply to player characters
                if (window.gameManager.gameState.playerCharacters) {
                    window.gameManager.gameState.playerCharacters.forEach(character => {
                        if (character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability, character.id);
                            });
                        }
                    });
                }
                
                // Apply to AI characters
                if (window.gameManager.gameState.aiCharacters) {
                    window.gameManager.gameState.aiCharacters.forEach(character => {
                        if (character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability, character.id);
                            });
                        }
                    });
                }
            }
        }, 1000); // Wait for game to fully initialize
    });
    
    // Add a patch to fix the UI display of cooldowns
    const originalGameManagerRenderCharacters = window.GameManager?.prototype?.uiManager?.renderCharacters;
    if (originalGameManagerRenderCharacters) {
        window.GameManager.prototype.uiManager.renderCharacters = function(playerCharacters, aiCharacters) {
            // Call original method
            originalGameManagerRenderCharacters.call(this, playerCharacters, aiCharacters);
            
            // Apply ability modifications to all characters after rendering
            [...playerCharacters, ...aiCharacters].forEach(character => {
                if (character && character.abilities) {
                    character.abilities.forEach(ability => {
                        applyStoredModifications(ability, character.id);
                    });
                }
            });
            
            console.log("Applied ability modifications after UI rendering");
        };
    }
    
    // Patch the createAbilityElements method to ensure it uses modified cooldowns
    // This method handles the UI creation for abilities
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (window.GameManager && 
                window.GameManager.prototype && 
                window.GameManager.prototype.uiManager && 
                window.GameManager.prototype.uiManager.createAbilityElements) {
                
                const originalCreateAbilityElements = window.GameManager.prototype.uiManager.createAbilityElements;
                window.GameManager.prototype.uiManager.createAbilityElements = function(character, abilitiesDiv, isAI = false) {
                    // Apply modifications before creating UI elements
                    if (character && character.abilities) {
                        character.abilities.forEach(ability => {
                            applyStoredModifications(ability, character.id);
                        });
                    }
                    
                    // Call original method with potentially modified abilities
                    return originalCreateAbilityElements.call(this, character, abilitiesDiv, isAI);
                };
                
                console.log("Patched UIManager.createAbilityElements to apply ability mods first");
            }
        }, 500); // Execute earlier than the general initialization
    });
    
    // Also patch the updateCharacterUI method to always apply modifications first
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (window.GameManager && 
                window.GameManager.prototype && 
                window.GameManager.prototype.uiManager) {
                
                // Patch updateCharacterUI if it exists
                if (window.GameManager.prototype.uiManager.updateCharacterUI) {
                    const originalUpdateCharacterUI = window.GameManager.prototype.uiManager.updateCharacterUI;
                    window.GameManager.prototype.uiManager.updateCharacterUI = function(character) {
                        // Apply modifications before updating UI
                        if (character && character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability, character.id);
                            });
                        }
                        
                        // Call original method
                        return originalUpdateCharacterUI.call(this, character);
                    };
                    console.log("Patched UIManager.updateCharacterUI to apply ability mods first");
                }
                
                // Also patch highlighting functions
                if (window.GameManager.prototype.uiManager.highlightSelectedCharacter) {
                    const originalHighlight = window.GameManager.prototype.uiManager.highlightSelectedCharacter;
                    window.GameManager.prototype.uiManager.highlightSelectedCharacter = function(character) {
                        // Apply modifications before highlighting
                        if (character && character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability, character.id);
                            });
                        }
                        
                        // Call original method
                        return originalHighlight.call(this, character);
                    };
                }
                
                // Patch showCharacterAbilities to ensure abilities display correctly
                if (window.GameManager.prototype.uiManager.showCharacterAbilities) {
                    const originalShowAbilities = window.GameManager.prototype.uiManager.showCharacterAbilities;
                    window.GameManager.prototype.uiManager.showCharacterAbilities = function(character) {
                        // Apply modifications before showing abilities
                        if (character && character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability, character.id);
                            });
                        }
                        
                        // Call original method
                        return originalShowAbilities.call(this, character);
                    };
                    console.log("Patched UIManager.showCharacterAbilities to apply ability mods first");
                }
            }
        }, 300); // Execute even earlier to catch initial rendering
    });
    
    // Log that the ability modifier is initialized
    console.log('Ability Modifier initialized - Talent ability modifications will be applied');
    
    // Add event listener for ability description updates
    document.addEventListener('abilityDescriptionUpdated', function(event) {
        if (event.detail && event.detail.character) {
            const character = event.detail.character;
            console.log(`[AbilityModifier] Received abilityDescriptionUpdated event for ${character.name}`);
            
            // Force UI update with a delay to ensure the description changes are applied
            setTimeout(() => {
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                    console.log(`[AbilityModifier] Updated UI for ${character.name} after description change`);
                }
            }, 50);
        }
    });
    
    // Add event listener specifically for Shoma's talent application
    document.addEventListener('talent_applied', function(event) {
        if (event.detail && event.detail.character && event.detail.character.id === 'schoolboy_shoma') {
            const character = event.detail.character;
            console.log(`[AbilityModifier] Talent applied to Shoma: ${event.detail.talentId}`);
            
            // Find and update Boink ability
            const boinkAbility = character.abilities.find(a => a.id === 'boink');
            if (boinkAbility) {
                // Ensure generateDescription function is attached
                if (!boinkAbility.generateDescription && typeof window.generateBoinkDescription === 'function') {
                    boinkAbility.generateDescription = window.generateBoinkDescription;
                    boinkAbility.character = character;
                }
                
                // Regenerate description
                if (typeof boinkAbility.generateDescription === 'function') {
                    const oldDescription = boinkAbility.description;
                    boinkAbility.description = boinkAbility.generateDescription();
                    console.log(`[AbilityModifier] Updated Boink description due to talent: ${event.detail.talentId}`);
                    console.log(`  Old: ${oldDescription}`);
                    console.log(`  New: ${boinkAbility.description}`);
                }
            }
            
            // Force UI update
            setTimeout(() => {
                if (window.gameManager && window.gameManager.uiManager) {
                    window.gameManager.uiManager.updateCharacterUI(character);
                }
            }, 100);
        }
    });
})();
