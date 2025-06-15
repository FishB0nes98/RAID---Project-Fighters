class StatisticsManager {
    constructor() {
        this.reset();
    }

    reset() {
        // Character-level statistics
        this.characterStats = new Map();
        
        // Ability-level statistics
        this.abilityStats = new Map();
        
        // Turn-based tracking
        this.turnHistory = [];
        this.currentTurn = 0;
        
        // Overall match statistics
        this.matchStats = {
            startTime: Date.now(),
            endTime: null,
            totalDamageDealt: 0,
            totalHealingDone: 0,
            totalTurns: 0,
            winner: null
        };
    }

    // Initialize character statistics
    initializeCharacter(character) {
        const characterId = character.instanceId || character.id;
        
        if (!this.characterStats.has(characterId)) {
            this.characterStats.set(characterId, {
                name: character.name,
                id: character.id,
                instanceId: character.instanceId,
                isAI: character.isAI,
                
                // Damage statistics
                totalDamageDealt: 0,
                totalDamageTaken: 0,
                physicalDamageDealt: 0,
                magicalDamageDealt: 0,
                physicalDamageTaken: 0,
                magicalDamageTaken: 0,
                criticalHits: 0,
                criticalDamage: 0,
                timesCritted: 0,  // Times this character was critically hit
                timesDodged: 0,   // Times this character dodged an attack
                
                // Healing statistics
                totalHealingDone: 0,
                totalHealingReceived: 0,
                criticalHeals: 0,
                criticalHealAmount: 0,
                selfHealing: 0,
                lifestealHealing: 0,
                
                // Ability usage
                abilitiesUsed: 0,
                abilityBreakdown: new Map(),
                
                // Shield and mitigation
                shieldAbsorbed: 0,
                
                // Status effects
                buffsApplied: 0,
                debuffsApplied: 0,
                buffsReceived: 0,
                debuffsReceived: 0,
                
                // Turn statistics
                turnsAlive: 0,
                turnsKO: 0,
                deathCount: 0,
                
                // Performance metrics
                damagePerTurn: 0,
                healingPerTurn: 0,
                efficiency: 0 // damage dealt / damage taken ratio
            });
        }
        
        return this.characterStats.get(characterId);
    }

    // Track damage dealing
    recordDamageDealt(caster, target, damage, damageType, isCritical = false, abilityId = null) {
        if (!caster || !target) return;
        
        const casterStats = this.initializeCharacter(caster);
        const targetStats = this.initializeCharacter(target);
        
        // Update caster (damage dealer) stats
        casterStats.totalDamageDealt += damage;
        
        if (damageType === 'physical') {
            casterStats.physicalDamageDealt += damage;
        } else if (damageType === 'magical') {
            casterStats.magicalDamageDealt += damage;
        }
        
        if (isCritical) {
            casterStats.criticalHits++;
            casterStats.criticalDamage += damage;
            // Also track that the target was critically hit
            targetStats.timesCritted++;
            
            // Dispatch critical strike event for quest tracking
            const criticalStrikeEvent = new CustomEvent('criticalStrike', {
                detail: {
                    character: caster,
                    target: target,
                    damage: damage,
                    abilityId: abilityId
                }
            });
            document.dispatchEvent(criticalStrikeEvent);
        }
        
        // Update target (damage receiver) stats
        targetStats.totalDamageTaken += damage;
        
        if (damageType === 'physical') {
            targetStats.physicalDamageTaken += damage;
        } else if (damageType === 'magical') {
            targetStats.magicalDamageTaken += damage;
        }
        
        // Dispatch damage taken event for quest tracking
        const damageTakenEvent = new CustomEvent('damageTaken', {
            detail: {
                character: target,
                damage: damage,
                damageType: damageType,
                caster: caster,
                abilityId: abilityId
            }
        });
        document.dispatchEvent(damageTakenEvent);
        
        // Track ability-specific damage
        if (abilityId) {
            console.log(`[StatisticsManager] About to record damage for ability ${abilityId}: ${damage} damage`);
            this.recordAbilityUsage(caster, abilityId, 'damage', damage, isCritical);
        }
        
        // Track quest progress for damage
        if (window.questManager && window.questManager.initialized) {
            window.questManager.trackDamage(caster, damage, abilityId);
        }
        
        // Update match totals
        this.matchStats.totalDamageDealt += damage;
        
        // Record turn event
        this.recordTurnEvent({
            type: 'damage',
            caster: caster.name,
            casterId: caster.instanceId || caster.id,
            target: target.name,
            targetId: target.instanceId || target.id,
            amount: damage,
            damageType: damageType,
            isCritical: isCritical,
            abilityId: abilityId,
            turn: this.currentTurn
        });
    }

    // Track healing done
    recordHealingDone(healer, target, healing, isCritical = false, abilityId = null, healType = 'direct') {
        if (!healer || !target) return;
        
        const healerStats = this.initializeCharacter(healer);
        const targetStats = this.initializeCharacter(target);
        
        // Update healer stats
        healerStats.totalHealingDone += healing;
        
        if (isCritical) {
            healerStats.criticalHeals++;
            healerStats.criticalHealAmount += healing;
        }
        
        // Check if self-healing
        if (healer === target || (healer.instanceId && healer.instanceId === target.instanceId)) {
            healerStats.selfHealing += healing;
        }
        
        // Check if lifesteal healing
        if (healType === 'lifesteal') {
            healerStats.lifestealHealing += healing;
        }
        
        // Update target (healing receiver) stats
        targetStats.totalHealingReceived += healing;
        
        // Track ability-specific healing
        if (abilityId) {
            this.recordAbilityUsage(healer, abilityId, 'healing', healing, isCritical);
        }
        
        // Track quest progress for healing
        if (window.questManager && window.questManager.initialized) {
            window.questManager.trackHealing(healer, healing, abilityId);
        }
        
        // Update match totals
        this.matchStats.totalHealingDone += healing;
        
        // Record turn event
        this.recordTurnEvent({
            type: 'healing',
            healer: healer.name,
            healerId: healer.instanceId || healer.id,
            target: target.name,
            targetId: target.instanceId || target.id,
            amount: healing,
            isCritical: isCritical,
            healType: healType,
            abilityId: abilityId,
            turn: this.currentTurn
        });
    }

    // Track shield absorption
    recordShieldAbsorption(target, shieldAmount) {
        if (!target) return;
        
        const targetStats = this.initializeCharacter(target);
        targetStats.shieldAbsorbed += shieldAmount;
        
        this.recordTurnEvent({
            type: 'shield',
            target: target.name,
            targetId: target.instanceId || target.id,
            amount: shieldAmount,
            turn: this.currentTurn
        });
    }

    // Track when a character dodges an attack
    recordDodge(dodger, attacker, abilityId = null) {
        if (!dodger) return;
        
        const dodgerStats = this.initializeCharacter(dodger);
        dodgerStats.timesDodged++;
        
        // Dispatch dodge event for quest tracking
        const dodgeEvent = new CustomEvent('dodge', {
            detail: {
                character: dodger,
                attacker: attacker,
                abilityId: abilityId
            }
        });
        document.dispatchEvent(dodgeEvent);
        
        this.recordTurnEvent({
            type: 'dodge',
            dodger: dodger.name,
            dodgerId: dodger.instanceId || dodger.id,
            attacker: attacker ? attacker.name : 'Unknown',
            attackerId: attacker ? (attacker.instanceId || attacker.id) : null,
            abilityId: abilityId,
            turn: this.currentTurn
        });
    }

    // Track ability usage
    recordAbilityUsage(character, abilityId, effectType, amount, isCritical = false) {
        if (!character || !abilityId) {
            console.warn('[StatisticsManager] recordAbilityUsage called with invalid parameters:', character?.name, abilityId);
            return;
        }
        
        console.log(`[StatisticsManager] Recording ability usage: ${character.name} used ${abilityId} (${effectType}) amount: ${amount}`);
        
        const characterStats = this.initializeCharacter(character);
        
        // Track per-ability statistics
        if (!characterStats.abilityBreakdown.has(abilityId)) {
            characterStats.abilityBreakdown.set(abilityId, {
                timesUsed: 0,
                totalDamage: 0,
                totalHealing: 0,
                criticalUses: 0,
                averageDamage: 0,
                averageHealing: 0,
                buffsApplied: 0,
                debuffsApplied: 0,
                abilityName: '',
                abilityIcon: ''
            });
        }
        
        const abilityData = characterStats.abilityBreakdown.get(abilityId);
        
        // Only increment timesUsed for 'use' effectType to avoid double counting
        if (effectType === 'use') {
            abilityData.timesUsed++;
            characterStats.abilitiesUsed++;
            
            // Track quest progress for ability usage
            if (window.questManager && window.questManager.initialized) {
                window.questManager.trackAbilityUsage(character, abilityId);
            }
        }
        
        if (effectType === 'damage') {
            abilityData.totalDamage += amount;
            // Recalculate average only if we have usage count
            if (abilityData.timesUsed > 0) {
                abilityData.averageDamage = abilityData.totalDamage / abilityData.timesUsed;
            }
        } else if (effectType === 'healing') {
            abilityData.totalHealing += amount;
            // Recalculate average only if we have usage count
            if (abilityData.timesUsed > 0) {
                abilityData.averageHealing = abilityData.totalHealing / abilityData.timesUsed;
            }
        } else if (effectType === 'buff') {
            abilityData.buffsApplied++;
        } else if (effectType === 'debuff') {
            abilityData.debuffsApplied++;
            // NEW: Track quest progress when a debuff is applied by an ability (e.g., Zoey R disable)
            if (window.questManager && window.questManager.initialized) {
                window.questManager.trackAbilityUsage(character, abilityId);
            }
        }
        
        if (isCritical) {
            abilityData.criticalUses++;
        }
        
        // Get ability info from character's abilities if available
        if (character.abilities) {
            const ability = character.abilities.find(a => a.id === abilityId);
            if (ability) {
                abilityData.abilityName = ability.name || abilityId;
                abilityData.abilityIcon = ability.icon || '';
                console.log(`[StatisticsManager] Updated ability info: ${abilityData.abilityName} with icon ${abilityData.abilityIcon}`);
            } else {
                console.warn(`[StatisticsManager] Ability ${abilityId} not found on character ${character.name}`);
            }
        }
        
        // Track global ability statistics
        if (!this.abilityStats.has(abilityId)) {
            this.abilityStats.set(abilityId, {
                timesUsed: 0,
                totalDamage: 0,
                totalHealing: 0,
                averageDamage: 0,
                averageHealing: 0,
                criticalRate: 0,
                buffsApplied: 0,
                debuffsApplied: 0,
                abilityName: '',
                abilityIcon: ''
            });
        }
        
        const globalAbilityData = this.abilityStats.get(abilityId);
        
        // Only increment global timesUsed for 'use' effectType to avoid double counting
        if (effectType === 'use') {
            globalAbilityData.timesUsed++;
        }
        
        if (effectType === 'damage') {
            globalAbilityData.totalDamage += amount;
            // Recalculate average only if we have usage count
            if (globalAbilityData.timesUsed > 0) {
                globalAbilityData.averageDamage = globalAbilityData.totalDamage / globalAbilityData.timesUsed;
            }
        } else if (effectType === 'healing') {
            globalAbilityData.totalHealing += amount;
            // Recalculate average only if we have usage count
            if (globalAbilityData.timesUsed > 0) {
                globalAbilityData.averageHealing = globalAbilityData.totalHealing / globalAbilityData.timesUsed;
            }
        } else if (effectType === 'buff') {
            globalAbilityData.buffsApplied++;
        } else if (effectType === 'debuff') {
            globalAbilityData.debuffsApplied++;
        }
        
        // Update ability info
        if (character.abilities) {
            const ability = character.abilities.find(a => a.id === abilityId);
            if (ability) {
                globalAbilityData.abilityName = ability.name || abilityId;
                globalAbilityData.abilityIcon = ability.icon || '';
            }
        }
    }

    // New method to record basic ability use (when we just know an ability was used)
    recordAbilityUse(character, abilityId) {
        this.recordAbilityUsage(character, abilityId, 'use', 0, false);
    }

    // Track status effects
    recordStatusEffect(caster, target, effectType, effectId, isDebuff = false, abilityId = null) {
        if (!caster || !target) return;
        
        const casterStats = this.initializeCharacter(caster);
        const targetStats = this.initializeCharacter(target);
        
        if (isDebuff) {
            casterStats.debuffsApplied++;
            targetStats.debuffsReceived++;
        } else {
            casterStats.buffsApplied++;
            targetStats.buffsReceived++;
        }
        
        // Track ability-specific buff/debuff application
        if (abilityId) {
            this.recordAbilityUsage(caster, abilityId, isDebuff ? 'debuff' : 'buff', 1, false);
        }
        
        this.recordTurnEvent({
            type: 'status_effect',
            caster: caster.name,
            casterId: caster.instanceId || caster.id,
            target: target.name,
            targetId: target.instanceId || target.id,
            effectId: effectId,
            isDebuff: isDebuff,
            abilityId: abilityId,
            turn: this.currentTurn
        });
    }

    // Track character death
    recordCharacterDeath(character) {
        if (!character) return;
        
        const characterStats = this.initializeCharacter(character);
        characterStats.deathCount++;
        
        this.recordTurnEvent({
            type: 'death',
            character: character.name,
            characterId: character.instanceId || character.id,
            turn: this.currentTurn
        });
    }

    // Record turn events
    recordTurnEvent(event) {
        this.turnHistory.push({
            ...event,
            timestamp: Date.now()
        });
    }

    // Update turn counter
    setCurrentTurn(turnNumber) {
        this.currentTurn = turnNumber;
        this.matchStats.totalTurns = Math.max(this.matchStats.totalTurns, turnNumber);
    }

    // Update character performance metrics
    updatePerformanceMetrics() {
        for (const [characterId, stats] of this.characterStats) {
            if (stats.turnsAlive > 0) {
                stats.damagePerTurn = stats.totalDamageDealt / stats.turnsAlive;
                stats.healingPerTurn = stats.totalHealingDone / stats.turnsAlive;
                stats.efficiency = stats.totalDamageTaken > 0 ? 
                    (stats.totalDamageDealt / stats.totalDamageTaken) : 
                    (stats.totalDamageDealt > 0 ? Infinity : 0);
            }
        }
    }

    // Increment turn counters for living characters
    incrementTurnCounters(characters) {
        for (const character of characters) {
            if (!character.isDead()) {
                const stats = this.initializeCharacter(character);
                stats.turnsAlive++;
            }
        }
    }

    // End match tracking
    endMatch(winner = null) {
        this.matchStats.endTime = Date.now();
        this.matchStats.winner = winner;
        this.updatePerformanceMetrics();
    }

    // Get character statistics
    getCharacterStats(character) {
        const characterId = character.instanceId || character.id;
        return this.characterStats.get(characterId) || null;
    }

    // Get all character statistics
    getAllCharacterStats() {
        return Array.from(this.characterStats.values());
    }

    // Get ability statistics
    getAbilityStats(abilityId = null) {
        if (abilityId) {
            return this.abilityStats.get(abilityId) || null;
        }
        return Array.from(this.abilityStats.entries());
    }

    // Get match summary
    getMatchSummary() {
        this.updatePerformanceMetrics();
        
        const duration = this.matchStats.endTime ? 
            (this.matchStats.endTime - this.matchStats.startTime) / 1000 : 
            (Date.now() - this.matchStats.startTime) / 1000;
        
        return {
            ...this.matchStats,
            duration: Math.round(duration),
            averageDamagePerTurn: this.matchStats.totalTurns > 0 ? 
                (this.matchStats.totalDamageDealt / this.matchStats.totalTurns) : 0,
            averageHealingPerTurn: this.matchStats.totalTurns > 0 ? 
                (this.matchStats.totalHealingDone / this.matchStats.totalTurns) : 0
        };
    }

    // Get top performers
    getTopPerformers() {
        const characters = this.getAllCharacterStats();
        
        return {
            topDamageDealer: characters.reduce((max, char) => 
                char.totalDamageDealt > (max?.totalDamageDealt || 0) ? char : max, null),
            topHealer: characters.reduce((max, char) => 
                char.totalHealingDone > (max?.totalHealingDone || 0) ? char : max, null),
            topTank: characters.reduce((max, char) => 
                char.totalDamageTaken > (max?.totalDamageTaken || 0) ? char : max, null),
            mostEfficient: characters.reduce((max, char) => 
                char.efficiency > (max?.efficiency || 0) ? char : max, null)
        };
    }

    // Export statistics for external analysis
    exportStats() {
        return {
            characterStats: Object.fromEntries(this.characterStats),
            abilityStats: Object.fromEntries(this.abilityStats),
            matchStats: this.getMatchSummary(),
            turnHistory: this.turnHistory,
            topPerformers: this.getTopPerformers()
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsManager;
} 