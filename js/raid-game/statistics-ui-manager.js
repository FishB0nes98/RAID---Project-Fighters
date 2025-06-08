class StatisticsUIManager {
    constructor() {
        this.isVisible = false;
        this.activeTab = 'overview';
        this.updateInterval = null;
        this.bindEvents();
        this.initializeUI();
    }

    initializeUI() {
        // Set initial button visibility based on panel state
        const panel = document.getElementById('statistics-panel');
        const showButton = document.getElementById('show-statistics-button');
        
        if (panel && showButton) {
            const isCurrentlyVisible = panel.classList.contains('visible');
            this.isVisible = isCurrentlyVisible;
            
            if (isCurrentlyVisible) {
                showButton.style.display = 'none';
            } else {
                showButton.style.display = 'flex'; // Use flex for proper centering
            }
            
            console.log('[StatisticsUI] Initial state - Panel visible:', isCurrentlyVisible, 'Button display:', showButton.style.display);
        }
    }

    bindEvents() {
        // Toggle panel button
        const toggleButton = document.getElementById('toggle-statistics-panel');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.togglePanel());
        }

        // Show panel button
        const showButton = document.getElementById('show-statistics-button');
        if (showButton) {
            showButton.addEventListener('click', () => this.showPanel());
        }

        // Tab switching
        const tabs = document.querySelectorAll('.statistics-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Auto-update statistics when they're visible
        document.addEventListener('turnStart', () => {
            if (this.isVisible) {
                this.updateStatistics();
            }
        });

        // Update statistics when damage/healing occurs
        document.addEventListener('character:damage-dealt', () => {
            if (this.isVisible) {
                this.updateStatistics();
            }
        });
    }

    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        const panel = document.getElementById('statistics-panel');
        const showButton = document.getElementById('show-statistics-button');
        const toggleButton = document.getElementById('toggle-statistics-panel');
        
        if (panel && showButton && toggleButton) {
            panel.classList.add('visible');
            showButton.style.display = 'none';
            toggleButton.innerHTML = '◀';
            toggleButton.title = 'Hide statistics';
            this.isVisible = true;
            
            // Start auto-updating
            this.startAutoUpdate();
            this.updateStatistics();
        }
    }

    hidePanel() {
        const panel = document.getElementById('statistics-panel');
        const showButton = document.getElementById('show-statistics-button');
        const toggleButton = document.getElementById('toggle-statistics-panel');
        
        if (panel && showButton && toggleButton) {
            panel.classList.remove('visible');
            showButton.style.display = 'block';
            toggleButton.innerHTML = '▶';
            toggleButton.title = 'Show statistics';
            this.isVisible = false;
            
            // Stop auto-updating
            this.stopAutoUpdate();
        }
    }

    switchTab(tabName) {
        // Update active tab
        const tabs = document.querySelectorAll('.statistics-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            }
        });

        // Update active content
        const contents = document.querySelectorAll('.statistics-tab-content');
        contents.forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(`statistics-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        this.activeTab = tabName;
        this.updateStatistics();
    }

    startAutoUpdate() {
        this.stopAutoUpdate(); // Clear any existing interval
        this.updateInterval = setInterval(() => {
            this.updateStatistics();
        }, 2000); // Update every 2 seconds
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateStatistics() {
        if (!window.statisticsManager || !this.isVisible) return;

        switch (this.activeTab) {
            case 'overview':
                this.updateOverview();
                break;
            case 'damage':
                this.updateDamageStats();
                break;
            case 'healing':
                this.updateHealingStats();
                break;
            case 'combat':
                this.updateCombatStats();
                break;
            case 'abilities':
                this.updateAbilityStats();
                break;
        }
    }

    updateOverview() {
        const overviewElement = document.getElementById('statistics-overview');
        if (!overviewElement) return;

        const matchSummary = window.statisticsManager.getMatchSummary();
        const topPerformers = window.statisticsManager.getTopPerformers();
        const characters = window.statisticsManager.getAllCharacterStats();
        
        // Filter to only count player characters for match summary
        const playerCharacters = characters.filter(char => !char.isAI);

        overviewElement.innerHTML = `
            <div class="statistics-section">
                <h3>Match Summary (Player Characters Only)</h3>
                <div class="stat-row">
                    <span class="stat-label">Duration:</span>
                    <span class="stat-value">${this.formatDuration(matchSummary.duration)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Turn:</span>
                    <span class="stat-value">${matchSummary.totalTurns}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Damage:</span>
                    <span class="stat-value">${this.formatNumber(playerCharacters.reduce((sum, char) => sum + char.totalDamageDealt, 0))}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Healing:</span>
                    <span class="stat-value">${this.formatNumber(playerCharacters.reduce((sum, char) => sum + char.totalHealingDone, 0))}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Dodges:</span>
                    <span class="stat-value">${playerCharacters.reduce((sum, char) => sum + char.timesDodged, 0)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Crits:</span>
                    <span class="stat-value">${playerCharacters.reduce((sum, char) => sum + char.criticalHits, 0)}</span>
                </div>
            </div>

            <div class="statistics-section">
                <h3>Top Performers</h3>
                ${topPerformers.topDamageDealer ? `
                    <div class="performer-row">
                        <span class="performer-icon">⚔️</span>
                        <div class="performer-info">
                            <span class="performer-title">Top Damage</span>
                            <span class="performer-name">${topPerformers.topDamageDealer.name}</span>
                        </div>
                        <span class="performer-value">${this.formatNumber(topPerformers.topDamageDealer.totalDamageDealt)}</span>
                    </div>
                ` : ''}
                ${topPerformers.topHealer ? `
                    <div class="performer-row">
                        <span class="performer-icon">💚</span>
                        <div class="performer-info">
                            <span class="performer-title">Top Healer</span>
                            <span class="performer-name">${topPerformers.topHealer.name}</span>
                        </div>
                        <span class="performer-value">${this.formatNumber(topPerformers.topHealer.totalHealingDone)}</span>
                    </div>
                ` : ''}
                ${topPerformers.topTank ? `
                    <div class="performer-row">
                        <span class="performer-icon">🛡️</span>
                        <div class="performer-info">
                            <span class="performer-title">Top Tank</span>
                            <span class="performer-name">${topPerformers.topTank.name}</span>
                        </div>
                        <span class="performer-value">${this.formatNumber(topPerformers.topTank.totalDamageTaken)}</span>
                    </div>
                ` : ''}
                ${topPerformers.mostEfficient ? `
                    <div class="performer-row">
                        <span class="performer-icon">⭐</span>
                        <div class="performer-info">
                            <span class="performer-title">Most Efficient</span>
                            <span class="performer-name">${topPerformers.mostEfficient.name}</span>
                        </div>
                        <span class="performer-value">${this.formatNumber(topPerformers.mostEfficient.efficiency)}x</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateDamageStats() {
        const damageElement = document.getElementById('statistics-damage');
        if (!damageElement) return;

        const characters = window.statisticsManager.getAllCharacterStats();
        
        // Sort by total damage dealt
        const sortedByDamage = [...characters].sort((a, b) => b.totalDamageDealt - a.totalDamageDealt);

        damageElement.innerHTML = `
            <div class="statistics-section">
                <h3>Damage Dealt</h3>
                <div class="character-stats-list">
                    ${sortedByDamage.map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                                <div class="damage-breakdown">
                                    <span class="damage-type physical">Phys: ${this.formatNumber(char.physicalDamageDealt)}</span>
                                    <span class="damage-type magical">Mag: ${this.formatNumber(char.magicalDamageDealt)}</span>
                                </div>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${this.formatNumber(char.totalDamageDealt)}</div>
                                <div class="stat-details">
                                    <span class="crit-info">${char.criticalHits} crits dealt, ${char.timesCritted} received</span>
                                    <span class="dodge-info">${char.timesDodged} dodges</span>
                                    <span class="dps-info">${this.formatNumber(char.damagePerTurn)}/turn</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="statistics-section">
                <h3>Damage Taken</h3>
                <div class="character-stats-list">
                    ${[...characters].sort((a, b) => b.totalDamageTaken - a.totalDamageTaken).map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                                <div class="damage-breakdown">
                                    <span class="damage-type physical">Phys: ${this.formatNumber(char.physicalDamageTaken)}</span>
                                    <span class="damage-type magical">Mag: ${this.formatNumber(char.magicalDamageTaken)}</span>
                                </div>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${this.formatNumber(char.totalDamageTaken)}</div>
                                <div class="stat-details">
                                    <span class="shield-info">Shield: ${this.formatNumber(char.shieldAbsorbed)}</span>
                                    <span class="efficiency-info">Eff: ${this.formatNumber(char.efficiency)}x</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateHealingStats() {
        const healingElement = document.getElementById('statistics-healing');
        if (!healingElement) return;

        const characters = window.statisticsManager.getAllCharacterStats();
        
        // Sort by total healing done
        const sortedByHealing = [...characters].sort((a, b) => b.totalHealingDone - a.totalHealingDone);

        healingElement.innerHTML = `
            <div class="statistics-section">
                <h3>Healing Done</h3>
                <div class="character-stats-list">
                    ${sortedByHealing.map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                                <div class="healing-breakdown">
                                    <span class="healing-type self">Self: ${this.formatNumber(char.selfHealing)}</span>
                                    <span class="healing-type lifesteal">Lifesteal: ${this.formatNumber(char.lifestealHealing)}</span>
                                </div>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${this.formatNumber(char.totalHealingDone)}</div>
                                <div class="stat-details">
                                    <span class="crit-info">${char.criticalHeals} crit heals (${this.formatNumber(char.criticalHealAmount)})</span>
                                    <span class="hps-info">${this.formatNumber(char.healingPerTurn)}/turn</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="statistics-section">
                <h3>Healing Received</h3>
                <div class="character-stats-list">
                    ${[...characters].sort((a, b) => b.totalHealingReceived - a.totalHealingReceived).map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${this.formatNumber(char.totalHealingReceived)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateCombatStats() {
        const combatElement = document.getElementById('statistics-combat');
        if (!combatElement) return;

        const characters = window.statisticsManager.getAllCharacterStats();
        
        // Sort by total dodges
        const sortedByDodges = [...characters].sort((a, b) => b.timesDodged - a.timesDodged);
        
        // Sort by total crits dealt
        const sortedByCrits = [...characters].sort((a, b) => b.criticalHits - a.criticalHits);

        combatElement.innerHTML = `
            <div class="statistics-section">
                <h3>Dodge Statistics</h3>
                <div class="character-stats-list">
                    ${sortedByDodges.map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${char.timesDodged}</div>
                                <div class="stat-details">
                                    <span class="dodge-info">Dodges</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="statistics-section">
                <h3>Critical Hit Statistics</h3>
                <div class="character-stats-list">
                    ${sortedByCrits.map(char => `
                        <div class="character-stat-row">
                            <div class="character-info">
                                <span class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">${char.name}</span>
                                <div class="combat-breakdown">
                                    <span class="crit-type dealt">Dealt: ${char.criticalHits}</span>
                                    <span class="crit-type received">Received: ${char.timesCritted}</span>
                                </div>
                            </div>
                            <div class="character-stats">
                                <div class="stat-main">${this.formatNumber(char.criticalDamage)}</div>
                                <div class="stat-details">
                                    <span class="crit-info">Total Crit Damage</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateAbilityStats() {
        const abilityElement = document.getElementById('statistics-abilities');
        if (!abilityElement) return;

        const characters = window.statisticsManager.getAllCharacterStats();
        console.log('[StatisticsUI] All character stats:', characters.length, 'characters');
        
        // Filter characters who have used abilities
        const activeCharacters = characters.filter(char => {
            const hasAbilities = char.abilityBreakdown.size > 0;
            console.log(`[StatisticsUI] ${char.name}: ${char.abilityBreakdown.size} abilities tracked, total uses: ${char.abilitiesUsed}`);
            return hasAbilities;
        });
        
        console.log('[StatisticsUI] Active characters with abilities:', activeCharacters.length);

        if (activeCharacters.length === 0) {
            abilityElement.innerHTML = `
                <div class="abilities-overview">
                    <h3>Ability Usage by Character</h3>
                    <div style="text-align: center; color: #8a9ba8; padding: 20px;">
                        No ability usage recorded yet. Use some abilities in battle to see statistics here!
                    </div>
                </div>
            `;
            return;
        }

        abilityElement.innerHTML = `
            <div class="abilities-overview">
                <h3>Ability Usage by Character</h3>
                ${activeCharacters.map(char => {
                    const abilities = Array.from(char.abilityBreakdown.entries())
                        .sort((a, b) => b[1].timesUsed - a[1].timesUsed);
                    
                    console.log(`[StatisticsUI] ${char.name} abilities:`, abilities.map(([id, data]) => `${id}:${data.timesUsed} uses`));
                    
                    return `
                        <div class="character-ability-section">
                            <div class="character-ability-header">
                                <h4 class="character-name ${char.isAI ? 'ai-character' : 'player-character'}">
                                    ${char.name}
                                </h4>
                                <div class="character-ability-summary">
                                    <span class="summary-stat">
                                        <span class="summary-icon">🎯</span>
                                        ${char.abilitiesUsed} uses
                                    </span>
                                    <span class="summary-stat">
                                        <span class="summary-icon">⚔️</span>
                                        ${this.formatNumber(char.totalDamageDealt)} dmg
                                    </span>
                                    <span class="summary-stat">
                                        <span class="summary-icon">💚</span>
                                        ${this.formatNumber(char.totalHealingDone)} heal
                                    </span>
                                </div>
                            </div>
                            
                            <div class="abilities-grid">
                                ${abilities.map(([abilityId, abilityData]) => `
                                    <div class="ability-card">
                                        <div class="ability-card-header">
                                            <div class="ability-icon-wrapper">
                                                ${abilityData.abilityIcon ? 
                                                    `<img src="${abilityData.abilityIcon}" alt="${abilityData.abilityName}" class="ability-icon-small" onerror="this.style.display='none';">` : 
                                                    '<div class="ability-icon-placeholder">⚡</div>'
                                                }
                                            </div>
                                            <div class="ability-info">
                                                <span class="ability-name">${abilityData.abilityName || this.formatAbilityName(abilityId)}</span>
                                                <span class="ability-usage-count">${abilityData.timesUsed}x used</span>
                                            </div>
                                        </div>
                                        
                                        <div class="ability-stats-grid">
                                            ${abilityData.totalDamage > 0 ? `
                                                <div class="ability-stat damage-stat">
                                                    <span class="stat-icon">⚔️</span>
                                                    <div class="stat-details">
                                                        <span class="stat-value">${this.formatNumber(abilityData.totalDamage)}</span>
                                                        <span class="stat-label">Total Damage</span>
                                                        <span class="stat-avg">Avg: ${this.formatNumber(abilityData.averageDamage)}</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${abilityData.totalHealing > 0 ? `
                                                <div class="ability-stat healing-stat">
                                                    <span class="stat-icon">💚</span>
                                                    <div class="stat-details">
                                                        <span class="stat-value">${this.formatNumber(abilityData.totalHealing)}</span>
                                                        <span class="stat-label">Total Healing</span>
                                                        <span class="stat-avg">Avg: ${this.formatNumber(abilityData.averageHealing)}</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${abilityData.criticalUses > 0 ? `
                                                <div class="ability-stat crit-stat">
                                                    <span class="stat-icon">✨</span>
                                                    <div class="stat-details">
                                                        <span class="stat-value">${abilityData.criticalUses}</span>
                                                        <span class="stat-label">Critical Uses</span>
                                                        <span class="stat-avg">${Math.round((abilityData.criticalUses / abilityData.timesUsed) * 100)}% rate</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${abilityData.buffsApplied > 0 ? `
                                                <div class="ability-stat buff-stat">
                                                    <span class="stat-icon">📈</span>
                                                    <div class="stat-details">
                                                        <span class="stat-value">${abilityData.buffsApplied}</span>
                                                        <span class="stat-label">Buffs Applied</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${abilityData.debuffsApplied > 0 ? `
                                                <div class="ability-stat debuff-stat">
                                                    <span class="stat-icon">📉</span>
                                                    <div class="stat-details">
                                                        <span class="stat-value">${abilityData.debuffsApplied}</span>
                                                        <span class="stat-label">Debuffs Applied</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return Math.round(num).toString();
        }
    }

    formatAbilityName(abilityId) {
        // Convert ability ID to readable name
        return abilityId
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}

// Initialize the statistics UI manager
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsUIManager = new StatisticsUIManager();
});

// Statistics UI Manager
console.log('[Statistics UI] Loading statistics UI manager...'); 