// Stage Editor JavaScript
class StageEditor {
    constructor() {
        this.currentStage = this.createDefaultStage();
        this.enemyCharacters = [];
        this.availableModifiers = [];
        this.editingEnemyIndex = -1;
        this.currentAudio = null;
        
        this.init();
    }

    async init() {
        await this.loadCharacterData();
        await this.loadModifierData();
        this.setupEventListeners();
        this.setupImagePreview();
        this.setupAudioControls();
        this.updateUI();
    }

    createDefaultStage() {
        return {
            id: "",
            name: "",
            description: "",
            difficulty: 1,
            type: "story",
            storyTitle: "",
            backgroundImage: "",
            backgroundMusic: "",
            enemies: [],
            requirements: {
                teamSize: {
                    min: 1,
                    max: 5
                },
                tags: []
            },
            modifiers: [],
            stageEffects: [],
            objectives: {
                winConditions: [{ type: "allEnemiesDefeated" }],
                turnLimit: 0
            },
            rewards: [],
            unlockRequirements: [],
            playerunlocked: false,
            isHidden: false
        };
    }

    async loadCharacterData() {
        try {
            // Load character data from character-registry.json
            const response = await fetch('js/raid-game/character-registry.json');
            const characterRegistry = await response.json();
            
            // Map all characters from the registry (not just enemy characters)
            this.enemyCharacters = characterRegistry.characters.map(char => ({
                id: char.id,
                name: char.name || char.id,
                type: this.getCharacterType(char.id),
                rarity: char.rarity || 'common',
                tags: char.tags || [],
                description: char.description || ''
            }));
                
            this.populateEnemySelect();
            console.log(`Loaded ${this.enemyCharacters.length} characters from character registry`);
        } catch (error) {
            console.error('Failed to load character data:', error);
            this.showError('Failed to load character data from registry');
        }
    }

    async loadModifierData() {
        try {
            // Try to get modifiers from the stage modifiers registry
            if (window.stageModifiersRegistry) {
                const modifiers = window.stageModifiersRegistry.getAllModifiers();
                this.availableModifiers = Object.keys(modifiers).map(id => ({
                    id: id,
                    ...modifiers[id]
                }));
            } else {
                // Fallback list of common modifiers
                this.availableModifiers = [
                    {
                        id: 'burning_ground',
                        name: 'Burning Ground',
                        description: 'All characters take fire damage each turn'
                    },
                    {
                        id: 'healing_wind',
                        name: 'Healing Wind',
                        description: 'All characters regenerate health each turn'
                    },
                    {
                        id: 'heavy_rain',
                        name: 'Heavy Rain',
                        description: 'All characters regenerate mana each turn'
                    },
                    {
                        id: 'carried_medicines',
                        name: 'Carried Medicines',
                        description: 'Characters restore mana when dropping below 50% HP'
                    },
                    {
                        id: 'small_space',
                        name: 'Small Space',
                        description: 'All characters have 0% dodge chance'
                    },
                    {
                        id: 'healing_fire',
                        name: 'Healing Fire',
                        description: 'Characters take damage equal to 50% of healing received'
                    }
                ];
            }
            
            this.populateModifierSelect();
        } catch (error) {
            console.error('Failed to load modifier data:', error);
        }
    }

    isEnemyCharacter(characterId) {
        // Characters that are typically enemies
        const enemyKeywords = ['infernal', 'angry', 'blazing', 'little_devil', 'crazy', 'farmer_fang', 'hound', 'scarecrow', 'crow'];
        const playerKeywords = ['schoolboy', 'schoolgirl', 'atlantean', 'bridget', 'renée', 'zoey'];
        
        // First check if it's explicitly a player character
        if (playerKeywords.some(keyword => characterId.includes(keyword))) {
            return false;
        }
        
        // Then check if it's an enemy character
        return enemyKeywords.some(keyword => characterId.includes(keyword)) || 
               characterId.includes('target_dummy');
    }

    getCharacterType(characterId) {
        if (characterId.includes('school')) return 'school';
        if (characterId.includes('farmer')) return 'farmer';
        if (characterId.includes('atlantean')) return 'atlantean';
        if (characterId.includes('infernal')) return 'infernal';
        return 'other';
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('new-stage-btn').addEventListener('click', () => this.newStage());
        document.getElementById('load-stage-btn').addEventListener('click', () => this.loadStage());
        document.getElementById('save-stage-btn').addEventListener('click', () => this.saveStage());
        document.getElementById('preview-stage-btn').addEventListener('click', () => this.previewStage());

        // Form inputs
        document.getElementById('stage-id').addEventListener('input', (e) => {
            this.currentStage.id = e.target.value;
            this.updateSaveStatus();
        });

        document.getElementById('stage-name').addEventListener('input', (e) => {
            this.currentStage.name = e.target.value;
            this.updateSaveStatus();
        });

        document.getElementById('stage-description').addEventListener('input', (e) => {
            this.currentStage.description = e.target.value;
            this.updateSaveStatus();
        });

        document.getElementById('stage-difficulty').addEventListener('input', (e) => {
            this.currentStage.difficulty = parseInt(e.target.value);
            this.updateSaveStatus();
        });

        document.getElementById('stage-type').addEventListener('change', (e) => {
            this.currentStage.type = e.target.value;
            this.updateSaveStatus();
        });

        document.getElementById('story-title').addEventListener('input', (e) => {
            this.currentStage.storyTitle = e.target.value;
            this.updateSaveStatus();
        });

        document.getElementById('background-image').addEventListener('input', (e) => {
            this.currentStage.backgroundImage = e.target.value;
            this.updateBackgroundPreview();
            this.updateSaveStatus();
        });

        document.getElementById('background-music').addEventListener('input', (e) => {
            this.currentStage.backgroundMusic = e.target.value;
            this.updateSaveStatus();
        });

        // Player requirements
        document.getElementById('min-players').addEventListener('input', (e) => {
            this.currentStage.requirements.teamSize.min = parseInt(e.target.value);
            this.updateSaveStatus();
        });

        document.getElementById('max-players').addEventListener('input', (e) => {
            this.currentStage.requirements.teamSize.max = parseInt(e.target.value);
            this.updateSaveStatus();
        });

        // Character type checkboxes
        document.querySelectorAll('input[type="checkbox"][value]').forEach(checkbox => {
            if (checkbox.parentElement.parentElement.classList.contains('checkbox-group')) {
                checkbox.addEventListener('change', () => this.updateRequiredTypes());
            }
        });

        // Win conditions
        document.querySelectorAll('input[type="checkbox"][value="allEnemiesDefeated"], input[type="checkbox"][value="surviveTurns"], input[type="checkbox"][value="protectAlly"], input[type="checkbox"][value="reachLocation"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateWinConditions());
        });

        document.getElementById('turn-limit').addEventListener('input', (e) => {
            this.currentStage.objectives.turnLimit = parseInt(e.target.value);
            this.updateSaveStatus();
        });

        // Advanced settings
        document.getElementById('player-unlocked').addEventListener('change', (e) => {
            this.currentStage.playerunlocked = e.target.checked;
            this.updateSaveStatus();
        });

        document.getElementById('is-hidden').addEventListener('change', (e) => {
            this.currentStage.isHidden = e.target.checked;
            this.updateSaveStatus();
        });

        document.getElementById('unlock-requirements').addEventListener('input', (e) => {
            try {
                this.currentStage.unlockRequirements = e.target.value ? JSON.parse(e.target.value) : [];
                this.clearValidationError(e.target);
            } catch (error) {
                this.showValidationError(e.target, 'Invalid JSON format');
            }
            this.updateSaveStatus();
        });

        // Add buttons
        document.getElementById('add-enemy-btn').addEventListener('click', () => this.showEnemyModal());
        document.getElementById('add-modifier-btn').addEventListener('click', () => this.showModifierModal());
        document.getElementById('add-reward-btn').addEventListener('click', () => this.showRewardModal());

        // Modal event listeners
        this.setupModalEventListeners();

        // File input
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
    }

    setupModalEventListeners() {
        // Enemy modal
        document.getElementById('save-enemy-btn').addEventListener('click', () => this.saveEnemy());
        document.getElementById('cancel-enemy-btn').addEventListener('click', () => this.hideEnemyModal());
        
        // Modifier modal
        document.getElementById('save-modifier-btn').addEventListener('click', () => this.saveModifier());
        document.getElementById('cancel-modifier-btn').addEventListener('click', () => this.hideModifierModal());
        document.getElementById('modifier-select').addEventListener('change', (e) => this.updateModifierDescription(e.target.value));
        
        // Reward modal
        document.getElementById('save-reward-btn').addEventListener('click', () => this.saveReward());
        document.getElementById('cancel-reward-btn').addEventListener('click', () => this.hideRewardModal());

        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    setupImagePreview() {
        const backgroundInput = document.getElementById('background-image');
        const preview = document.getElementById('background-preview');
        
        backgroundInput.addEventListener('input', () => this.updateBackgroundPreview());
        
        // Drag and drop support
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('dragover');
        });
        
        preview.addEventListener('dragleave', () => {
            preview.classList.remove('dragover');
        });
        
        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        backgroundInput.value = `data:${file.type};base64,${btoa(e.target.result)}`;
                        this.updateBackgroundPreview();
                    };
                    reader.readAsBinaryString(file);
                }
            }
        });
    }

    setupAudioControls() {
        document.getElementById('play-music-btn').addEventListener('click', () => this.playMusic());
        document.getElementById('stop-music-btn').addEventListener('click', () => this.stopMusic());
    }

    updateBackgroundPreview() {
        const imagePath = document.getElementById('background-image').value;
        const preview = document.getElementById('background-preview');
        
        if (imagePath) {
            preview.innerHTML = `<img src="${imagePath}" alt="Background preview" onerror="this.parentElement.innerHTML='<div class=\\'preview-placeholder\\'>Invalid image path</div>'">`;
        } else {
            preview.innerHTML = '<div class="preview-placeholder">No image selected</div>';
        }
    }

    playMusic() {
        const musicPath = document.getElementById('background-music').value;
        if (musicPath) {
            this.stopMusic();
            this.currentAudio = new Audio(musicPath);
            this.currentAudio.volume = 0.5;
            this.currentAudio.play().catch(error => {
                console.error('Failed to play audio:', error);
                this.showError('Could not play audio file');
            });
        }
    }

    stopMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    populateEnemySelect() {
        const select = document.getElementById('enemy-character-id');
        select.innerHTML = '<option value="">Select Character...</option>';
        
        if (this.enemyCharacters.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No characters loaded';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        // Sort characters by name for easier browsing
        const sortedCharacters = [...this.enemyCharacters].sort((a, b) => a.name.localeCompare(b.name));
        
        // Group characters by rarity for better organization
        const rarityGroups = {};
        sortedCharacters.forEach(character => {
            const rarity = character.rarity || 'common';
            if (!rarityGroups[rarity]) {
                rarityGroups[rarity] = [];
            }
            rarityGroups[rarity].push(character);
        });
        
        // Add characters grouped by rarity
        const rarityOrder = ['legendary', 'epic', 'rare', 'common'];
        rarityOrder.forEach(rarity => {
            if (rarityGroups[rarity]) {
                // Add group header
                const groupHeader = document.createElement('option');
                groupHeader.value = '';
                groupHeader.textContent = `--- ${rarity.toUpperCase()} ---`;
                groupHeader.disabled = true;
                groupHeader.style.fontWeight = 'bold';
                select.appendChild(groupHeader);
                
                // Add characters in this group
                rarityGroups[rarity].forEach(character => {
                    const option = document.createElement('option');
                    option.value = character.id;
                    
                    // Show character name and main tags
                    const tags = character.tags.slice(0, 2).join(', ');
                    const displayText = `${character.name}${tags ? ' - ' + tags : ''}`;
                    option.textContent = displayText;
                    option.title = character.description; // Tooltip with description
                    
                    select.appendChild(option);
                });
            }
        });
    }

    populateModifierSelect() {
        const select = document.getElementById('modifier-select');
        select.innerHTML = '<option value="">Choose a modifier...</option>';
        
        this.availableModifiers.forEach(modifier => {
            const option = document.createElement('option');
            option.value = modifier.id;
            option.textContent = modifier.name;
            select.appendChild(option);
        });
    }

    updateRequiredTypes() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
        this.currentStage.requirements.tags = Array.from(checkboxes).map(cb => cb.value);
        this.updateSaveStatus();
    }

    updateWinConditions() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][value="allEnemiesDefeated"]:checked, input[type="checkbox"][value="surviveTurns"]:checked, input[type="checkbox"][value="protectAlly"]:checked, input[type="checkbox"][value="reachLocation"]:checked');
        // Save win conditions in the format expected by the stage manager (objects with type property)
        this.currentStage.objectives.winConditions = Array.from(checkboxes).map(cb => ({ type: cb.value }));
        this.updateSaveStatus();
    }

    updateModifierDescription(modifierId) {
        const description = document.getElementById('modifier-description');
        const modifier = this.availableModifiers.find(m => m.id === modifierId);
        
        if (modifier) {
            description.textContent = modifier.description || 'No description available';
        } else {
            description.textContent = 'Select a modifier to see its description';
        }
    }

    showEnemyModal(editIndex = -1) {
        this.editingEnemyIndex = editIndex;
        const modal = document.getElementById('enemy-modal');
        
        if (editIndex >= 0) {
            const enemy = this.currentStage.enemies[editIndex];
            document.getElementById('enemy-character-id').value = enemy.characterId;
            document.getElementById('enemy-level').value = enemy.level || 1;
            document.getElementById('enemy-hp-mult').value = enemy.modifications?.hpMultiplier || 1.0;
            document.getElementById('enemy-dmg-mult').value = enemy.modifications?.damageMultiplier || 1.0;
            document.getElementById('enemy-speed-mult').value = enemy.modifications?.speedMultiplier || 1.0;
        } else {
            document.getElementById('enemy-character-id').value = '';
            document.getElementById('enemy-level').value = 1;
            document.getElementById('enemy-hp-mult').value = 1.0;
            document.getElementById('enemy-dmg-mult').value = 1.0;
            document.getElementById('enemy-speed-mult').value = 1.0;
        }
        
        modal.classList.add('active');
    }

    hideEnemyModal() {
        document.getElementById('enemy-modal').classList.remove('active');
        this.editingEnemyIndex = -1;
    }

    saveEnemy() {
        const characterId = document.getElementById('enemy-character-id').value;
        const level = parseInt(document.getElementById('enemy-level').value);
        const hpMult = parseFloat(document.getElementById('enemy-hp-mult').value);
        const dmgMult = parseFloat(document.getElementById('enemy-dmg-mult').value);
        const speedMult = parseFloat(document.getElementById('enemy-speed-mult').value);

        if (!characterId) {
            this.showError('Please select a character');
            return;
        }

        const enemy = {
            characterId: characterId,
            level: level,
            modifications: {
                hpMultiplier: hpMult,
                damageMultiplier: dmgMult,
                speedMultiplier: speedMult
            }
        };

        if (this.editingEnemyIndex >= 0) {
            this.currentStage.enemies[this.editingEnemyIndex] = enemy;
        } else {
            this.currentStage.enemies.push(enemy);
        }

        this.hideEnemyModal();
        this.updateEnemiesList();
        this.updateSaveStatus();
    }

    showModifierModal() {
        const modal = document.getElementById('modifier-modal');
        document.getElementById('modifier-select').value = '';
        this.updateModifierDescription('');
        modal.classList.add('active');
    }

    hideModifierModal() {
        document.getElementById('modifier-modal').classList.remove('active');
    }

    saveModifier() {
        const modifierId = document.getElementById('modifier-select').value;
        
        if (!modifierId) {
            this.showError('Please select a modifier');
            return;
        }

        // Check if modifier already exists
        if (this.currentStage.modifiers.some(m => m.id === modifierId) || 
            this.currentStage.stageEffects.some(m => m.id === modifierId)) {
            this.showError('This modifier is already added');
            return;
        }

        const modifier = this.availableModifiers.find(m => m.id === modifierId);
        if (modifier) {
            // Add to both modifiers and stageEffects for compatibility
            this.currentStage.modifiers.push({ id: modifierId });
            this.currentStage.stageEffects.push({ id: modifierId });
        }

        this.hideModifierModal();
        this.updateModifiersList();
        this.updateSaveStatus();
    }

    showRewardModal() {
        const modal = document.getElementById('reward-modal');
        document.getElementById('reward-type').value = '';
        document.getElementById('reward-value').value = '';
        document.getElementById('reward-chance').value = 1.0;
        modal.classList.add('active');
    }

    hideRewardModal() {
        document.getElementById('reward-modal').classList.remove('active');
    }

    saveReward() {
        const type = document.getElementById('reward-type').value;
        const value = document.getElementById('reward-value').value;
        const chance = parseFloat(document.getElementById('reward-chance').value);

        if (!type || !value) {
            this.showError('Please fill in all required fields');
            return;
        }

        const reward = {
            type: type,
            value: isNaN(parseInt(value)) ? value : parseInt(value),
            chance: chance
        };

        this.currentStage.rewards.push(reward);
        this.hideRewardModal();
        this.updateRewardsList();
        this.updateSaveStatus();
    }

    updateEnemiesList() {
        const container = document.getElementById('enemies-list');
        const count = document.getElementById('enemy-count');
        
        container.innerHTML = '';
        count.textContent = this.currentStage.enemies.length;

        this.currentStage.enemies.forEach((enemy, index) => {
            const character = this.enemyCharacters.find(c => c.id === enemy.characterId);
            const enemyElement = document.createElement('div');
            enemyElement.className = 'enemy-item';
            
            // Show character info with rarity and tags
            const characterInfo = character ? 
                `${character.name} (${character.rarity}${character.tags.length > 0 ? ' - ' + character.tags.slice(0, 2).join(', ') : ''})` : 
                enemy.characterId;
            
            enemyElement.innerHTML = `
                <div class="enemy-info">
                    <div class="enemy-name">${characterInfo}</div>
                    <div class="enemy-details">
                        Level ${enemy.level || 1} | 
                        HP: x${enemy.modifications?.hpMultiplier || 1.0} | 
                        DMG: x${enemy.modifications?.damageMultiplier || 1.0} | 
                        Speed: x${enemy.modifications?.speedMultiplier || 1.0}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-secondary" onclick="stageEditor.showEnemyModal(${index})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="stageEditor.removeEnemy(${index})">Remove</button>
                </div>
            `;
            
            container.appendChild(enemyElement);
        });
    }

    updateModifiersList() {
        const container = document.getElementById('modifiers-list');
        const count = document.getElementById('modifier-count');
        
        container.innerHTML = '';
        count.textContent = this.currentStage.modifiers.length;

        this.currentStage.modifiers.forEach((modifier, index) => {
            const modifierData = this.availableModifiers.find(m => m.id === modifier.id);
            const modifierElement = document.createElement('div');
            modifierElement.className = 'modifier-item';
            
            modifierElement.innerHTML = `
                <div class="modifier-info">
                    <div class="modifier-name">${modifierData ? modifierData.name : modifier.id}</div>
                    <div class="modifier-description">${modifierData ? modifierData.description : 'No description available'}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-danger" onclick="stageEditor.removeModifier(${index})">Remove</button>
                </div>
            `;
            
            container.appendChild(modifierElement);
        });
    }

    updateRewardsList() {
        const container = document.getElementById('rewards-list');
        const count = document.getElementById('reward-count');
        
        container.innerHTML = '';
        count.textContent = this.currentStage.rewards.length;

        this.currentStage.rewards.forEach((reward, index) => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-item';
            
            rewardElement.innerHTML = `
                <div class="reward-info">
                    <div class="reward-name">${reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}</div>
                    <div class="reward-details">Value: ${reward.value} | Chance: ${(reward.chance * 100).toFixed(0)}%</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-danger" onclick="stageEditor.removeReward(${index})">Remove</button>
                </div>
            `;
            
            container.appendChild(rewardElement);
        });
    }

    removeEnemy(index) {
        this.currentStage.enemies.splice(index, 1);
        this.updateEnemiesList();
        this.updateSaveStatus();
    }

    removeModifier(index) {
        this.currentStage.modifiers.splice(index, 1);
        this.currentStage.stageEffects.splice(index, 1);
        this.updateModifiersList();
        this.updateSaveStatus();
    }

    removeReward(index) {
        this.currentStage.rewards.splice(index, 1);
        this.updateRewardsList();
        this.updateSaveStatus();
    }

    updateUI() {
        // Update all form fields with current stage data
        document.getElementById('stage-id').value = this.currentStage.id;
        document.getElementById('stage-name').value = this.currentStage.name;
        document.getElementById('stage-description').value = this.currentStage.description;
        document.getElementById('stage-difficulty').value = this.currentStage.difficulty;
        document.getElementById('stage-type').value = this.currentStage.type;
        document.getElementById('story-title').value = this.currentStage.storyTitle || '';
        document.getElementById('background-image').value = this.currentStage.backgroundImage || '';
        document.getElementById('background-music').value = this.currentStage.backgroundMusic || '';
        
        document.getElementById('min-players').value = this.currentStage.requirements?.teamSize?.min || 1;
        document.getElementById('max-players').value = this.currentStage.requirements?.teamSize?.max || 5;
        
        // Update checkboxes
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = this.currentStage.requirements?.tags?.includes(cb.value) || false;
        });
        
        document.querySelectorAll('input[type="checkbox"][value="allEnemiesDefeated"], input[type="checkbox"][value="surviveTurns"], input[type="checkbox"][value="protectAlly"], input[type="checkbox"][value="reachLocation"]').forEach(cb => {
            // Handle both old string format and new object format for win conditions
            const winConditions = this.currentStage.objectives?.winConditions || [];
            const isChecked = winConditions.some(condition => 
                (typeof condition === 'string' && condition === cb.value) ||
                (typeof condition === 'object' && condition.type === cb.value)
            );
            cb.checked = isChecked;
        });
        
        document.getElementById('turn-limit').value = this.currentStage.objectives?.turnLimit || 0;
        
        document.getElementById('player-unlocked').checked = this.currentStage.playerunlocked || false;
        document.getElementById('is-hidden').checked = this.currentStage.isHidden || false;
        document.getElementById('unlock-requirements').value = JSON.stringify(this.currentStage.unlockRequirements || [], null, 2);
        
        this.updateBackgroundPreview();
        this.updateEnemiesList();
        this.updateModifiersList();
        this.updateRewardsList();
        this.updateSaveStatus('Ready');
    }

    updateSaveStatus(status = 'Modified') {
        const statusElement = document.getElementById('save-status');
        statusElement.textContent = status;
        statusElement.className = '';
        
        if (status === 'Saving...') {
            statusElement.classList.add('saving');
        } else if (status === 'Saved') {
            statusElement.classList.add('saved');
        } else if (status.includes('Error')) {
            statusElement.classList.add('error');
        }
    }

    newStage() {
        if (confirm('Are you sure you want to create a new stage? Unsaved changes will be lost.')) {
            this.currentStage = this.createDefaultStage();
            this.updateUI();
        }
    }

    loadStage() {
        document.getElementById('file-input').click();
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const stageData = JSON.parse(e.target.result);
                    // Migrate old format to new format
                    const migratedStage = this.migrateStageFormat(stageData);
                    this.currentStage = { ...this.createDefaultStage(), ...migratedStage };
                    this.updateUI();
                    this.showSuccess('Stage loaded successfully');
                } catch (error) {
                    this.showError('Invalid stage file format');
                }
            };
            reader.readAsText(file);
        }
    }

    // Migrate old stage format to new format
    migrateStageFormat(stageData) {
        const migrated = { ...stageData };
        
        // Migrate playerRequirements to requirements format
        if (migrated.playerRequirements && !migrated.requirements) {
            migrated.requirements = {
                teamSize: {
                    min: migrated.playerRequirements.minPlayers || 1,
                    max: migrated.playerRequirements.maxPlayers || 5
                },
                tags: migrated.playerRequirements.requiredTypes || []
            };
            delete migrated.playerRequirements;
        }
        
        // Migrate win conditions from string array to object array
        if (migrated.objectives && migrated.objectives.winConditions) {
            migrated.objectives.winConditions = migrated.objectives.winConditions.map(condition => {
                if (typeof condition === 'string') {
                    return { type: condition };
                }
                return condition;
            });
        }
        
        return migrated;
    }

    saveStage() {
        try {
            this.updateSaveStatus('Saving...');
            
            // Validate required fields
            if (!this.currentStage.id || !this.currentStage.name) {
                throw new Error('Stage ID and Name are required');
            }
            
            // Clean up the stage data
            const stageData = this.prepareStageForSave();
            
            // Create download
            const blob = new Blob([JSON.stringify(stageData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentStage.id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.updateSaveStatus('Saved');
            this.showSuccess('Stage saved successfully');
        } catch (error) {
            this.updateSaveStatus('Error: ' + error.message);
            this.showError('Failed to save stage: ' + error.message);
        }
    }

    prepareStageForSave() {
        const stageData = { ...this.currentStage };
        
        // Remove empty arrays and null values
        Object.keys(stageData).forEach(key => {
            if (Array.isArray(stageData[key]) && stageData[key].length === 0) {
                delete stageData[key];
            } else if (stageData[key] === null || stageData[key] === '') {
                delete stageData[key];
            }
        });
        
        // Ensure required fields exist
        if (!stageData.enemies) stageData.enemies = [];
        if (!stageData.objectives) {
            stageData.objectives = {
                winConditions: [{ type: "allEnemiesDefeated" }]
            };
        }
        
        return stageData;
    }

    previewStage() {
        try {
            const stageData = this.prepareStageForSave();
            
            // Open preview in new window
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Stage Preview: ${stageData.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                        h2 { color: #555; margin-top: 30px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                        .enemies, .modifiers, .rewards { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
                        pre { background: #282c34; color: white; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${stageData.name}</h1>
                        <p><strong>Description:</strong> ${stageData.description || 'No description'}</p>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Stage ID:</strong> ${stageData.id}<br>
                                <strong>Difficulty:</strong> ${stageData.difficulty}/10<br>
                                <strong>Type:</strong> ${stageData.type}
                            </div>
                            <div class="info-item">
                                <strong>Players:</strong> ${stageData.requirements?.teamSize?.min || 1}-${stageData.requirements?.teamSize?.max || 5}<br>
                                <strong>Turn Limit:</strong> ${stageData.objectives?.turnLimit || 'None'}<br>
                                <strong>Unlocked:</strong> ${stageData.playerunlocked ? 'Yes' : 'No'}
                            </div>
                        </div>
                        
                        <h2>Enemies (${stageData.enemies?.length || 0})</h2>
                        <div class="enemies">
                            ${stageData.enemies?.map(enemy => `
                                <div>• ${enemy.characterId} (Level ${enemy.level || 1})</div>
                            `).join('') || 'No enemies defined'}
                        </div>
                        
                        <h2>Stage Modifiers (${stageData.modifiers?.length || 0})</h2>
                        <div class="modifiers">
                            ${stageData.modifiers?.map(mod => `<div>• ${mod.id}</div>`).join('') || 'No modifiers'}
                        </div>
                        
                        <h2>Rewards (${stageData.rewards?.length || 0})</h2>
                        <div class="rewards">
                            ${stageData.rewards?.map(reward => `
                                <div>• ${reward.type}: ${reward.value} (${(reward.chance * 100).toFixed(0)}% chance)</div>
                            `).join('') || 'No rewards'}
                        </div>
                        
                        <h2>Raw JSON Data</h2>
                        <pre>${JSON.stringify(stageData, null, 2)}</pre>
                    </div>
                </body>
                </html>
            `);
            previewWindow.document.close();
        } catch (error) {
            this.showError('Failed to generate preview: ' + error.message);
        }
    }

    showValidationError(element, message) {
        const formGroup = element.closest('.form-group');
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearValidationError(element) {
        const formGroup = element.closest('.form-group');
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Initialize the stage editor when the page loads
let stageEditor;
document.addEventListener('DOMContentLoaded', () => {
    stageEditor = new StageEditor();
});

// Make it globally accessible for onclick handlers
window.stageEditor = stageEditor; 