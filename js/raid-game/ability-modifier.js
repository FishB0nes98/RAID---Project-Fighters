/**
 * Ability Modifier - Ensures that ability modifications from talents can be applied directly
 * This file patches game objects to allow modifying ability properties at runtime
 */

(function() {
    // Keep track of ability modifications
    const abilityModifications = {};
    
    // Function to apply ability modifications when an ability is used
    function applyStoredModifications(ability) {
        const abilityId = ability.id;
        if (!abilityModifications[abilityId]) return;
        
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
    
    // Patch the Ability class use method to apply modifications before use
    const originalAbilityUse = Ability.prototype.use;
    Ability.prototype.use = function(caster, targetOrTargets, actualManaCost, options = {}) {
        // Apply any stored modifications
        applyStoredModifications(this);
        
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
                        applyStoredModifications(ability);
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
            ability[property] = value;
            console.log(`[StoreAbilityModification] Modified ${this.name}'s ${abilityId} ${property} from ${oldValue} to ${value}`);
            
            if (typeof ability.generateDescription === 'function') {
                const oldDescription = ability.description;
                ability.generateDescription();
                
                // Compare descriptions to see if there was a change
                if (oldDescription !== ability.description) {
                    console.log(`[StoreAbilityModification] Updated description for ${ability.name}`);
                    console.log(`Old: ${oldDescription}`);
                    console.log(`New: ${ability.description}`);
                } else {
                    console.log(`[StoreAbilityModification] Description unchanged for ${ability.name} despite property change`);
                }
            }
            
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
            
            // Update the UI immediately if possible
            if (window.gameManager && window.gameManager.uiManager && this.instanceId) {
                try {
                    window.gameManager.uiManager.updateCharacterUI(this);
                    console.log(`[StoreAbilityModification] UI updated for ${this.name} after modifying ${abilityId}`);
                } catch (error) {
                    console.warn(`[StoreAbilityModification] Error updating UI after ability modification: ${error.message}`);
                }
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
                                applyStoredModifications(ability);
                            });
                        }
                    });
                }
                
                // Apply to AI characters
                if (window.gameManager.gameState.aiCharacters) {
                    window.gameManager.gameState.aiCharacters.forEach(character => {
                        if (character.abilities) {
                            character.abilities.forEach(ability => {
                                applyStoredModifications(ability);
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
                        applyStoredModifications(ability);
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
                            applyStoredModifications(ability);
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
                                applyStoredModifications(ability);
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
                                applyStoredModifications(ability);
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
                                applyStoredModifications(ability);
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
})(); 