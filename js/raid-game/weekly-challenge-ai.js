/**
 * Weekly Challenge AI Manager
 * Specialized AI logic for weekly challenges where Siegfried is the carry
 * and other team members prioritize keeping him and each other alive
 */

class WeeklyChallengeAI {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.carryCharacterId = 'siegfried'; // Main damage dealer
        this.teamStrategy = {
            carryProtectionPriority: 0.8, // 80% chance to prioritize carry protection
            healThreshold: 0.6, // Heal when below 60% HP
            carryHealThreshold: 0.8, // Heal carry when below 80% HP
            emergencyHealThreshold: 0.3, // Emergency heal when below 30% HP
            shieldPriority: 0.7, // 70% chance to prioritize shielding abilities
        };
        this.roleAssignments = new Map(); // Character ID -> Role mapping
        this.lastAnalysis = 0; // Turn when team was last analyzed
    }

    /**
     * Initialize the weekly challenge AI system
     */
    initialize() {
        this.analyzeTeamComposition();
        console.log('[Weekly Challenge AI] Initialized with Siegfried as carry');
    }

    /**
     * Analyze team composition and assign roles
     */
    analyzeTeamComposition() {
        const gameState = this.gameManager.gameState;
        if (!gameState || !gameState.aiCharacters) return;

        this.roleAssignments.clear();
        
        gameState.aiCharacters.forEach(character => {
            const characterId = this.normalizeCharacterId(character.id);
            
            // Assign roles based on character abilities and identity
            if (characterId === this.carryCharacterId) {
                this.roleAssignments.set(character.id, 'carry');
            } else if (this.hasHealingAbilities(character)) {
                this.roleAssignments.set(character.id, 'healer');
            } else if (this.hasShieldingAbilities(character)) {
                this.roleAssignments.set(character.id, 'protector');
            } else if (this.hasBuffingAbilities(character)) {
                this.roleAssignments.set(character.id, 'support');
            } else {
                this.roleAssignments.set(character.id, 'offtank');
            }
        });

        console.log('[Weekly Challenge AI] Team roles assigned:', 
            Array.from(this.roleAssignments.entries()).map(([id, role]) => `${id}: ${role}`).join(', '));
    }

    /**
     * Normalize character ID for comparison
     */
    normalizeCharacterId(id) {
        return id.toLowerCase().replace(/[^a-z]/g, '');
    }

    /**
     * Check if character has healing abilities
     */
    hasHealingAbilities(character) {
        return character.abilities.some(ability => 
            (ability.name && typeof ability.name === 'string' && 
             (ability.name.toLowerCase().includes('heal') || 
              ability.name.toLowerCase().includes('cure') ||
              ability.name.toLowerCase().includes('restore'))) ||
            (ability.description && typeof ability.description === 'string' && 
             ability.description.toLowerCase().includes('heal'))
        );
    }

    /**
     * Check if character has shielding abilities
     */
    hasShieldingAbilities(character) {
        return character.abilities.some(ability => 
            (ability.name && typeof ability.name === 'string' && 
             (ability.name.toLowerCase().includes('shield') || 
              ability.name.toLowerCase().includes('barrier') ||
              ability.name.toLowerCase().includes('protection'))) ||
            (ability.description && typeof ability.description === 'string' && 
             (ability.description.toLowerCase().includes('shield') ||
              ability.description.toLowerCase().includes('barrier')))
        );
    }

    /**
     * Check if character has buffing abilities
     */
    hasBuffingAbilities(character) {
        return character.abilities.some(ability => 
            (ability.name && typeof ability.name === 'string' && 
             (ability.name.toLowerCase().includes('blessing') || 
              ability.name.toLowerCase().includes('boost') ||
              ability.name.toLowerCase().includes('enhancement'))) ||
            (ability.description && typeof ability.description === 'string' && 
             ability.description.toLowerCase().includes('buff'))
        );
    }

    /**
     * Main AI planning function for weekly challenge
     */
    async planWeeklyChallengeAction(aiChar) {
        const gameState = this.gameManager.gameState;
        if (!gameState) return null;

        // Re-analyze team if needed
        if (this.gameManager.turnCounter - this.lastAnalysis > 5) {
            this.analyzeTeamComposition();
            this.lastAnalysis = this.gameManager.turnCounter;
        }

        const role = this.roleAssignments.get(aiChar.id) || 'offtank';
        const carryCharacter = this.findCarryCharacter();
        const allAIChars = gameState.aiCharacters.filter(c => !c.isDead());
        const allPlayerChars = gameState.playerCharacters.filter(c => !c.isDead());

        console.log(`[Weekly Challenge AI] Planning action for ${aiChar.name} (Role: ${role})`);

        // Get available abilities
        const availableAbilities = aiChar.abilities.filter(ability => 
            ability.currentCooldown === 0 && 
            aiChar.stats.currentMana >= ability.manaCost &&
            !ability.isDisabled
        );

        if (availableAbilities.length === 0) {
            console.log(`[Weekly Challenge AI] No available abilities for ${aiChar.name}`);
            return null;
        }

        // Role-based decision making
        switch (role) {
            case 'carry':
                return this.planCarryAction(aiChar, availableAbilities, allPlayerChars, allAIChars);
            case 'healer':
                return this.planHealerAction(aiChar, availableAbilities, allPlayerChars, allAIChars, carryCharacter);
            case 'protector':
                return this.planProtectorAction(aiChar, availableAbilities, allPlayerChars, allAIChars, carryCharacter);
            case 'support':
                return this.planSupportAction(aiChar, availableAbilities, allPlayerChars, allAIChars, carryCharacter);
            case 'offtank':
                return this.planOfftankAction(aiChar, availableAbilities, allPlayerChars, allAIChars, carryCharacter);
            default:
                return this.planDefaultAction(aiChar, availableAbilities, allPlayerChars, allAIChars);
        }
    }

    /**
     * Find the carry character (Siegfried)
     */
    findCarryCharacter() {
        const gameState = this.gameManager.gameState;
        if (!gameState) return null;

        return gameState.aiCharacters.find(char => 
            this.normalizeCharacterId(char.id) === this.carryCharacterId && !char.isDead()
        );
    }

    /**
     * Plan action for carry character (Siegfried)
     */
    planCarryAction(aiChar, availableAbilities, enemies, allies) {
        console.log(`[Weekly Challenge AI] Carry ${aiChar.name} planning aggressive action`);
        
        // Prioritize highest damage abilities when possible
        const damageAbilities = availableAbilities.filter(ability => 
            ability.targetType === 'enemy' || ability.targetType === 'all_enemies' || ability.targetType === 'all'
        );

        if (damageAbilities.length > 0) {
            // Sort by cooldown (higher cooldown usually means more powerful)
            damageAbilities.sort((a, b) => b.cooldown - a.cooldown);
            const selectedAbility = damageAbilities[0];
            
            let target;
            if (selectedAbility.targetType === 'all_enemies' || selectedAbility.targetType === 'all') {
                target = enemies;
            } else {
                // Target lowest HP enemy for finishing blows
                target = enemies.reduce((prev, current) => 
                    (prev.stats.currentHp < current.stats.currentHp) ? prev : current
                );
            }

            console.log(`[Weekly Challenge AI] Carry using ${selectedAbility.name} on ${Array.isArray(target) ? 'all enemies' : target.name}`);
            return { ability: selectedAbility, target: target };
        }

        // Fallback to any available ability
        return this.planDefaultAction(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Plan action for healer characters
     */
    planHealerAction(aiChar, availableAbilities, enemies, allies, carryCharacter) {
        console.log(`[Weekly Challenge AI] Healer ${aiChar.name} analyzing healing priorities`);

        // Find healing abilities
        const healingAbilities = availableAbilities.filter(ability => 
            ability.targetType === 'ally' || 
            ability.targetType === 'ally_or_self' || 
            ability.targetType === 'all_allies' ||
            (ability.name && typeof ability.name === 'string' && ability.name.toLowerCase().includes('heal'))
        );

        if (healingAbilities.length > 0) {
            // Check if carry needs urgent healing
            if (carryCharacter && carryCharacter.stats.currentHp / carryCharacter.stats.maxHp < this.teamStrategy.carryHealThreshold) {
                const carryHealAbility = healingAbilities.find(ability => 
                    ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
                );
                if (carryHealAbility) {
                    console.log(`[Weekly Challenge AI] Emergency heal for carry: ${carryCharacter.name}`);
                    return { ability: carryHealAbility, target: carryCharacter };
                }
            }

            // Check for critically injured allies
            const criticalAllies = allies.filter(ally => 
                ally.stats.currentHp / ally.stats.maxHp < this.teamStrategy.emergencyHealThreshold
            );

            if (criticalAllies.length > 1) {
                // Use AoE heal if multiple allies are critical
                const aoeHeal = healingAbilities.find(ability => ability.targetType === 'all_allies');
                if (aoeHeal) {
                    console.log(`[Weekly Challenge AI] AoE heal for multiple critical allies`);
                    return { ability: aoeHeal, target: allies };
                }
            }

            // Single target heal for most injured ally
            const injuredAllies = allies.filter(ally => 
                ally.stats.currentHp / ally.stats.maxHp < this.teamStrategy.healThreshold
            );

            if (injuredAllies.length > 0) {
                const mostInjured = injuredAllies.reduce((prev, current) => 
                    (prev.stats.currentHp / prev.stats.maxHp < current.stats.currentHp / current.stats.maxHp) ? prev : current
                );

                const singleHeal = healingAbilities.find(ability => 
                    ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
                );

                if (singleHeal) {
                    console.log(`[Weekly Challenge AI] Healing ${mostInjured.name} (${Math.round(mostInjured.stats.currentHp / mostInjured.stats.maxHp * 100)}% HP)`);
                    return { ability: singleHeal, target: mostInjured };
                }
            }
        }

        // If no healing needed, support with damage or buffs
        return this.planSupportAttack(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Plan action for protector characters
     */
    planProtectorAction(aiChar, availableAbilities, enemies, allies, carryCharacter) {
        console.log(`[Weekly Challenge AI] Protector ${aiChar.name} planning defensive action`);

        // Find protective abilities
        const protectiveAbilities = availableAbilities.filter(ability => 
            (ability.name && typeof ability.name === 'string' && 
             (ability.name.toLowerCase().includes('shield') || 
              ability.name.toLowerCase().includes('protection') ||
              ability.name.toLowerCase().includes('barrier'))) ||
            ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
        );

        if (protectiveAbilities.length > 0 && Math.random() < this.teamStrategy.shieldPriority) {
            // Prioritize protecting the carry
            if (carryCharacter && carryCharacter.stats.currentHp / carryCharacter.stats.maxHp < 0.9) {
                const carryProtection = protectiveAbilities.find(ability => 
                    ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
                );
                if (carryProtection) {
                    console.log(`[Weekly Challenge AI] Protecting carry: ${carryCharacter.name}`);
                    return { ability: carryProtection, target: carryCharacter };
                }
            }

            // Protect most vulnerable ally
            const vulnerableAllies = allies.filter(ally => 
                ally.stats.currentHp / ally.stats.maxHp < 0.7
            );

            if (vulnerableAllies.length > 0) {
                const mostVulnerable = vulnerableAllies.reduce((prev, current) => 
                    (prev.stats.currentHp / prev.stats.maxHp < current.stats.currentHp / current.stats.maxHp) ? prev : current
                );

                const protection = protectiveAbilities.find(ability => 
                    ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
                );

                if (protection) {
                    console.log(`[Weekly Challenge AI] Protecting vulnerable ally: ${mostVulnerable.name}`);
                    return { ability: protection, target: mostVulnerable };
                }
            }
        }

        // Attack enemies that are targeting allies
        return this.planSupportAttack(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Plan action for support characters
     */
    planSupportAction(aiChar, availableAbilities, enemies, allies, carryCharacter) {
        console.log(`[Weekly Challenge AI] Support ${aiChar.name} planning buff/utility action`);

        // Find buff abilities
        const buffAbilities = availableAbilities.filter(ability => 
            (ability.name && typeof ability.name === 'string' && 
             (ability.name.toLowerCase().includes('blessing') || 
              ability.name.toLowerCase().includes('boost') ||
              ability.name.toLowerCase().includes('enhancement'))) ||
            (ability.targetType === 'ally' || ability.targetType === 'ally_or_self' || ability.targetType === 'all_allies')
        );

        if (buffAbilities.length > 0 && Math.random() < 0.6) {
            // Prioritize buffing the carry
            if (carryCharacter) {
                const carryBuff = buffAbilities.find(ability => 
                    ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
                );
                if (carryBuff) {
                    console.log(`[Weekly Challenge AI] Buffing carry: ${carryCharacter.name}`);
                    return { ability: carryBuff, target: carryCharacter };
                }
            }

            // AoE buff if available
            const aoeBuff = buffAbilities.find(ability => ability.targetType === 'all_allies');
            if (aoeBuff) {
                console.log(`[Weekly Challenge AI] AoE buff for team`);
                return { ability: aoeBuff, target: allies };
            }
        }

        // Support with damage
        return this.planSupportAttack(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Plan action for offtank characters
     */
    planOfftankAction(aiChar, availableAbilities, enemies, allies, carryCharacter) {
        console.log(`[Weekly Challenge AI] Offtank ${aiChar.name} planning hybrid action`);

        // Balance between protection and offense
        if (carryCharacter && carryCharacter.stats.currentHp / carryCharacter.stats.maxHp < 0.5) {
            // Desperately try to help carry
            const supportAbilities = availableAbilities.filter(ability => 
                ability.targetType === 'ally' || ability.targetType === 'ally_or_self'
            );

            if (supportAbilities.length > 0) {
                console.log(`[Weekly Challenge AI] Offtank emergency support for carry`);
                return { ability: supportAbilities[0], target: carryCharacter };
            }
        }

        // Otherwise, focus on damage
        return this.planSupportAttack(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Plan support attack - secondary damage dealing
     */
    planSupportAttack(aiChar, availableAbilities, enemies, allies) {
        const damageAbilities = availableAbilities.filter(ability => 
            ability.targetType === 'enemy' || ability.targetType === 'all_enemies' || ability.targetType === 'all'
        );

        if (damageAbilities.length > 0) {
            const selectedAbility = damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
            
            let target;
            if (selectedAbility.targetType === 'all_enemies' || selectedAbility.targetType === 'all') {
                target = enemies;
            } else {
                // Focus fire on lowest HP enemy
                target = enemies.reduce((prev, current) => 
                    (prev.stats.currentHp < current.stats.currentHp) ? prev : current
                );
            }

            console.log(`[Weekly Challenge AI] Support attack: ${selectedAbility.name} on ${Array.isArray(target) ? 'all enemies' : target.name}`);
            return { ability: selectedAbility, target: target };
        }

        return this.planDefaultAction(aiChar, availableAbilities, enemies, allies);
    }

    /**
     * Fallback default action
     */
    planDefaultAction(aiChar, availableAbilities, enemies, allies) {
        if (availableAbilities.length === 0) return null;

        const randomAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        let target;

        switch (randomAbility.targetType) {
            case 'enemy':
                target = enemies[Math.floor(Math.random() * enemies.length)];
                break;
            case 'ally':
                target = allies.filter(c => c.id !== aiChar.id)[0] || aiChar;
                break;
            case 'self':
                target = aiChar;
                break;
            case 'all_enemies':
            case 'all':
                target = enemies;
                break;
            case 'all_allies':
                target = allies;
                break;
            default:
                target = enemies[0] || aiChar;
        }

        console.log(`[Weekly Challenge AI] Default action: ${randomAbility.name}`);
        return { ability: randomAbility, target: target };
    }

    /**
     * Check if weekly challenge AI should be used for this character
     */
    shouldUseWeeklyChallengeAI(character) {
        // Use for all AI characters in weekly challenge mode
        return character && character.isAI;
    }

    /**
     * Get team status summary for debugging
     */
    getTeamStatus() {
        const gameState = this.gameManager.gameState;
        if (!gameState) return "No game state";

        const status = gameState.aiCharacters.map(char => {
            const role = this.roleAssignments.get(char.id) || 'unknown';
            const hpPercent = Math.round((char.stats.currentHp / char.stats.maxHp) * 100);
            return `${char.name}(${role}): ${hpPercent}% HP`;
        }).join(', ');

        return `Team Status: ${status}`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeeklyChallengeAI;
} else {
    window.WeeklyChallengeAI = WeeklyChallengeAI;
} 