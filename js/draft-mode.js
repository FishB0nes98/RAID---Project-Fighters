/**
 * Draft Mode JavaScript - League of Legends Style Character Selection
 */

class DraftMode {
    constructor() {
        this.firebase = null;
        this.auth = null;
        this.database = null;
        this.currentUser = null;

        // Draft state
        this.allCharacters = [];
        this.ownedCharacters = [];
        this.availableCharacters = [];
        this.selectedCharacter = null;
        
        // Teams
        this.playerTeam = [null, null, null];
        this.aiTeam = [null, null, null];
        
        // Draft order and timing
        this.pickOrder = [];
        this.currentPickIndex = 0;
        this.pickTimer = 30;
        this.timerInterval = null;
        
        // AI available characters
        this.aiAvailableCharacters = [
            'atlantean_kagome', 'bridget', 'farmer_alice', 'farmer_cham_cham', 
            'farmer_nina', 'farmer_raiden', 'farmer_shoma', 'infernal_ibuki', 
            'renée', 'schoolboy_shoma', 'schoolboy_siegfried', 'schoolgirl_ayane', 
            'schoolgirl_elphelt', 'schoolgirl_julia', 'schoolgirl_kokoro', 
            'atlantean_sub_zero', 'zoey'
        ];

        // Character registry
        this.characterRegistry = {};
        
        // Stage modifier settings
        this.randomModifierEnabled = true;
        this.selectedRandomModifier = null;
        this.availableModifiers = [];
        
        // UI elements
        this.elements = {
            loadingOverlay: null,
            characterGrid: null,
            pickBtn: null,
            timer: null,
            currentTurnText: null,
            phaseText: null,
            pickSequence: null,
            previewImage: null,
            previewName: null,
            previewDescription: null,
            championSearch: null,
            filterBtns: null,
            randomModifierToggle: null,
            modifierIcon: null,
            modifierName: null,
            modifierDescription: null,
            selectedModifierDisplay: null
        };
        
        this.isPlayerTurn = false;
        this.isDraftComplete = false;
        
        // Don't call init() here - it will be called from DOMContentLoaded
    }

    async init() {
        try {
            console.log('[DRAFT] Initializing Draft Mode...');
            
            // Initialize UI elements
            this.initializeElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Wait for Firebase
            console.log('[DRAFT] Waiting for Firebase...');
            await this.waitForFirebase();
            console.log('[DRAFT] Firebase wait complete, loading character data...');
            
            // Load character data
            await this.loadCharacterData();
            console.log('[DRAFT] Character data loaded, setting up draft...');
            
            // Setup draft
            this.setupDraft();
            
            console.log('[DRAFT] Draft Mode initialized successfully');
        } catch (error) {
            console.error('[DRAFT] Error initializing Draft Mode:', error);
            this.showError('Failed to initialize Draft Mode');
        }
    }

    initializeElements() {
        this.elements = {
            loadingOverlay: document.getElementById('loading-overlay'),
            characterGrid: document.getElementById('character-grid'),
            pickBtn: document.getElementById('pick-btn'),
            timer: document.querySelector('.timer'),
            currentTurnText: document.getElementById('current-turn-text'),
            phaseText: document.getElementById('phase-text'),
            pickSequence: document.getElementById('pick-sequence'),
            previewImage: document.getElementById('preview-image'),
            previewName: document.getElementById('preview-name'),
            previewDescription: document.getElementById('preview-description'),
            championSearch: document.getElementById('champion-search'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            randomModifierToggle: document.getElementById('random-modifier-toggle'),
            modifierIcon: document.getElementById('modifier-icon'),
            modifierName: document.getElementById('modifier-name'),
            modifierDescription: document.getElementById('modifier-description'),
            selectedModifierDisplay: document.getElementById('selected-modifier-display')
        };
    }

    setupEventListeners() {
        // Pick button
        this.elements.pickBtn?.addEventListener('click', () => this.pickCharacter());
        
        // Search functionality
        this.elements.championSearch?.addEventListener('input', (e) => this.filterCharacters(e.target.value));
        
        // Filter buttons
        this.elements.filterBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Random modifier toggle
        this.elements.randomModifierToggle?.addEventListener('change', (e) => {
            this.randomModifierEnabled = e.target.checked;
            this.updateModifierDisplay();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.isPlayerTurn && this.selectedCharacter) {
                this.pickCharacter();
            }
        });
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Firebase initialization timeout'));
            }, 10000); // 10 second timeout
            
            const setupAuth = () => {
                // Check auth state with timeout
                console.log('[DRAFT] Setting up auth state listener...');
                let authResolved = false;
                const authTimeout = setTimeout(() => {
                    if (!authResolved) {
                        console.log('[DRAFT] Auth state timeout, continuing without user');
                        authResolved = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                }, 3000); // 3 second auth timeout
                
                try {
                    this.auth.onAuthStateChanged((user) => {
                        console.log('[DRAFT] Auth state changed, user:', user ? user.uid : 'none');
                        if (!authResolved) {
                            authResolved = true;
                            clearTimeout(timeout);
                            clearTimeout(authTimeout);
                            
                            this.currentUser = user;
                            if (user) {
                                console.log('[DRAFT] User authenticated:', user.uid);
                            } else {
                                console.log('[DRAFT] No user authenticated, using guest mode');
                            }
                            console.log('[DRAFT] Resolving Firebase wait...');
                            resolve();
                        } else {
                            console.log('[DRAFT] Auth state change ignored (already resolved)');
                        }
                    });
                    console.log('[DRAFT] Auth state listener registered');
                } catch (error) {
                    console.error('[DRAFT] Error setting up auth listener:', error);
                    if (!authResolved) {
                        authResolved = true;
                        clearTimeout(timeout);
                        clearTimeout(authTimeout);
                        resolve();
                    }
                }
            };
            
            const checkFirebase = () => {
                console.log('[DRAFT] Checking Firebase availability:', {
                    firebase: !!window.firebase,
                    database: !!window.database, 
                    auth: !!window.auth,
                    firebaseDatabase: !!window.firebaseDatabase,
                    firebaseAuth: !!window.firebaseAuth
                });
                
                if (window.firebase && window.database && window.auth) {
                    try {
                        this.firebase = window.firebase;
                        this.database = window.database;
                        this.auth = window.auth;
                        
                        console.log('[DRAFT] Firebase services loaded');
                        setupAuth();
                    } catch (error) {
                        console.error('[DRAFT] Error in Firebase services setup:', error);
                        clearTimeout(timeout);
                        reject(error);
                    }
                } else if (typeof firebase !== 'undefined') {
                    try {
                        // Fallback: try to access Firebase directly
                        console.log('[DRAFT] Using direct Firebase access');
                        this.firebase = firebase;
                        this.database = firebase.database();
                        this.auth = firebase.auth();
                        
                        // Also set window variables for consistency
                        window.firebase = firebase;
                        window.database = this.database;
                        window.auth = this.auth;
                        
                        console.log('[DRAFT] Direct Firebase access complete');
                        setupAuth();
                    } catch (error) {
                        console.error('[DRAFT] Error in direct Firebase access:', error);
                        clearTimeout(timeout);
                        reject(error);
                    }
                } else {
                    console.log('[DRAFT] Waiting for Firebase services...');
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    async loadCharacterData() {
        this.showLoading('Loading character data...');
        
        try {
            // Load character registry
            const registryResponse = await fetch('js/raid-game/character-registry.json');
            const registryData = await registryResponse.json();
            
            this.allCharacters = registryData.characters || [];
            console.log('[DRAFT] Loaded characters:', this.allCharacters.length);
            
            // Create character registry for quick lookup
            this.allCharacters.forEach(char => {
                this.characterRegistry[char.id] = char;
            });
            
            // Load user's owned characters
            if (this.currentUser) {
                await this.loadOwnedCharacters();
            } else {
                // If no user, assume they own default characters
                this.ownedCharacters = ['schoolboy_shoma', 'farmer_cham_cham', 'renée'];
            }
            
            // Filter available characters for AI (remove any that don't exist in registry)
            this.aiAvailableCharacters = this.aiAvailableCharacters.filter(id => 
                this.characterRegistry[id]
            );
            
            console.log('[DRAFT] Owned characters:', this.ownedCharacters);
            console.log('[DRAFT] AI available characters:', this.aiAvailableCharacters);
            
        } catch (error) {
            console.error('[DRAFT] Error loading character data:', error);
            throw error;
        }
    }

    async loadOwnedCharacters() {
        if (!this.currentUser) return;
        
        try {
            const userId = this.currentUser.uid;
            const ownedSet = new Set();
            
            // Check both database locations as mentioned in the requirements
            // 1. Check ownedCharacters folder
            const ownedSnapshot = await this.database.ref(`users/${userId}/ownedCharacters`).once('value');
            const ownedData = ownedSnapshot.val();
            
            if (ownedData) {
                if (Array.isArray(ownedData)) {
                    ownedData.forEach(id => ownedSet.add(id));
                } else if (typeof ownedData === 'object') {
                    Object.keys(ownedData).forEach(id => {
                        if (ownedData[id] === true || typeof ownedData[id] === 'object') {
                            ownedSet.add(id);
                        }
                    });
                }
            }
            
            // 2. Check UnlockedRAIDCharacters folder
            const unlockedSnapshot = await this.database.ref(`users/${userId}/UnlockedRAIDCharacters`).once('value');
            const unlockedData = unlockedSnapshot.val();
            
            if (unlockedData && typeof unlockedData === 'object') {
                Object.keys(unlockedData).forEach(id => ownedSet.add(id));
            }
            
            // Add default free characters
            ['schoolboy_shoma', 'farmer_cham_cham', 'renée'].forEach(id => ownedSet.add(id));
            
            this.ownedCharacters = Array.from(ownedSet);
            
        } catch (error) {
            console.error('[DRAFT] Error loading owned characters:', error);
            // Fallback to default characters
            this.ownedCharacters = ['schoolboy_shoma', 'farmer_cham_cham', 'renée'];
        }
    }

    setupDraft() {
        console.log('[DRAFT] Setting up draft...');
        
        // Generate pick order
        this.generatePickOrder();
        
        // Render pick order
        this.renderPickOrder();
        
        // Render character grid
        this.renderCharacterGrid();
        
        // Load and setup stage modifiers
        this.loadStageModifiers();
        
        // Start first pick
        this.startNextPick();
        
        // Hide loading overlay
        this.hideLoading();
        
        console.log('[DRAFT] Draft setup complete');
    }

    generatePickOrder() {
        // Player always picks first as requested
        console.log('[DRAFT] Pick order: Player first (as requested)');
        
        // Player: 1, 4, 5 (1-2-2-1 pattern)
        // AI: 2, 3, 6
        this.pickOrder = [
            { team: 'player', slot: 0 },  // Player pick 1
            { team: 'ai', slot: 0 },      // AI pick 1 (waits for player)
            { team: 'ai', slot: 1 },      // AI pick 2
            { team: 'player', slot: 1 },  // Player pick 2
            { team: 'player', slot: 2 },  // Player pick 3
            { team: 'ai', slot: 2 }       // AI pick 3 (waits for player)
        ];
        
        this.renderPickOrder();
    }

    renderPickOrder() {
        if (!this.elements.pickSequence) return;
        
        this.elements.pickSequence.innerHTML = '';
        
        this.pickOrder.forEach((pick, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = `pick-step ${pick.team}`;
            stepEl.textContent = `${pick.team === 'player' ? 'You' : 'AI'} ${pick.slot + 1}`;
            
            if (index === this.currentPickIndex) {
                stepEl.classList.add('current');
            } else if (index < this.currentPickIndex) {
                stepEl.classList.add('completed');
            }
            
            this.elements.pickSequence.appendChild(stepEl);
        });
    }

    renderCharacterGrid() {
        if (!this.elements.characterGrid) return;
        
        this.elements.characterGrid.innerHTML = '';
        
        // Get characters to display based on current filter
        const charactersToShow = this.getFilteredCharacters();
        
        charactersToShow.forEach(character => {
            const card = this.createCharacterCard(character);
            this.elements.characterGrid.appendChild(card);
        });
    }

    getFilteredCharacters() {
        const searchTerm = this.elements.championSearch?.value.toLowerCase() || '';
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'owned'; // Default to owned only
        
        let characters = this.allCharacters;
        
        // Always filter to owned characters first (only show characters the user owns)
        characters = characters.filter(char => this.ownedCharacters.includes(char.id));
        
        // Apply additional filter
        switch (activeFilter) {
            case 'available':
                characters = characters.filter(char => !this.isCharacterPicked(char.id));
                break;
            case 'owned':
            default:
                // Already filtered to owned above
                break;
        }
        
        // Apply search
        if (searchTerm) {
            characters = characters.filter(char => 
                char.name.toLowerCase().includes(searchTerm) ||
                char.id.toLowerCase().includes(searchTerm)
            );
        }
        
        return characters;
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        // Check if character is owned
        const isOwned = this.ownedCharacters.includes(character.id);
        const isPicked = this.isCharacterPicked(character.id);
        
        if (!isOwned) {
            card.classList.add('not-owned');
        }
        
        if (isPicked) {
            card.classList.add('disabled');
        }
        
        // Create image
        const img = document.createElement('img');
        img.src = this.getCharacterImagePath(character);
        img.alt = character.name;
        img.onerror = () => {
            img.src = 'Icons/default-icon.jpg'; // Fallback image
        };
        
        card.appendChild(img);
        
        // Add click listener
        card.addEventListener('click', () => {
            // Check current state, not the state when card was created
            const currentlyPicked = this.isCharacterPicked(character.id);
            if (!currentlyPicked && isOwned && this.isPlayerTurn) {
                this.selectCharacter(character);
            }
        });
        
        return card;
    }

    getCharacterImagePath(character) {
        // Try different possible image paths
        const possiblePaths = [
            `Icons/characters/${character.name}.png`,
            `Icons/characters/${character.id}.png`,
            `Icons/Profile/${character.id}.png`,
            `Icons/Profile/${character.name.replace(/\s+/g, '_')}.png`,
            `Icons/${character.id}.png`,
            `Icons/${character.name.replace(/\s+/g, '_')}.png`,
            'Icons/default-icon.jpg'
        ];
        
        return possiblePaths[0]; // Return first path, fallback will be handled by onerror
    }

    isCharacterPicked(characterId) {
        return this.playerTeam.includes(characterId) || this.aiTeam.includes(characterId);
    }

    selectCharacter(character) {
        if (!this.isPlayerTurn) return;
        
        // Remove previous selection
        document.querySelectorAll('.character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new character
        const card = document.querySelector(`[data-character-id="${character.id}"]`);
        card?.classList.add('selected');
        
        this.selectedCharacter = character;
        this.updatePreview(character);
        
        // Enable pick button
        if (this.elements.pickBtn) {
            this.elements.pickBtn.disabled = false;
        }
    }

    updatePreview(character) {
        if (this.elements.previewImage) {
            this.elements.previewImage.src = this.getCharacterImagePath(character);
        }
        
        if (this.elements.previewName) {
            this.elements.previewName.textContent = character.name;
        }
        
        if (this.elements.previewDescription) {
            this.elements.previewDescription.textContent = character.description || 'A powerful fighter ready for battle.';
        }
    }

    startNextPick() {
        if (this.currentPickIndex >= this.pickOrder.length) {
            this.completeDraft();
            return;
        }
        
        const currentPick = this.pickOrder[this.currentPickIndex];
        this.isPlayerTurn = currentPick.team === 'player';
        
        // Update UI
        this.updateTurnIndicator();
        this.renderPickOrder();
        this.highlightActiveSlot(currentPick);
        
        // Start timer
        this.startPickTimer();
        
        if (!this.isPlayerTurn) {
            // AI turn - pick after a short delay
            setTimeout(() => {
                this.makeAIPick();
            }, 2000);
        }
    }

    updateTurnIndicator() {
        const currentPick = this.pickOrder[this.currentPickIndex];
        const pickNumber = Math.floor(this.currentPickIndex / 2) + 1;
        
        if (this.elements.currentTurnText) {
            if (this.isPlayerTurn) {
                this.elements.currentTurnText.textContent = `Your Turn - Pick ${currentPick.slot + 1}`;
            } else {
                this.elements.currentTurnText.textContent = `AI Turn - Pick ${currentPick.slot + 1}`;
            }
        }
        
        if (this.elements.phaseText) {
            this.elements.phaseText.textContent = `Round ${Math.ceil((this.currentPickIndex + 1) / 2)} of 3`;
        }
    }

    highlightActiveSlot(pick) {
        // Remove previous highlights
        document.querySelectorAll('.character-slot.picking').forEach(slot => {
            slot.classList.remove('picking');
        });
        
        // Add highlight to current slot
        const teamSection = document.querySelector(`.${pick.team}-team`);
        const slot = teamSection?.querySelector(`[data-slot="${pick.slot}"]`);
        slot?.classList.add('picking');
    }

    startPickTimer() {
        this.pickTimer = 30;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.pickTimer--;
            console.log('[DRAFT] Timer tick:', this.pickTimer); // Debug log
            this.updateTimerDisplay();
            
            if (this.pickTimer <= 0) {
                this.onPickTimeout();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        if (this.elements.timer) {
            this.elements.timer.textContent = this.pickTimer;
            
            // Add warning class for last 10 seconds
            if (this.pickTimer <= 10) {
                this.elements.timer.classList.add('warning');
            } else {
                this.elements.timer.classList.remove('warning');
            }
        }
    }

    onPickTimeout() {
        clearInterval(this.timerInterval);
        
        if (this.isPlayerTurn) {
            // Auto-pick a random available character for player
            this.autoPickForPlayer();
        }
        // AI should have already picked, but just in case
    }

    autoPickForPlayer() {
        const availableChars = this.allCharacters.filter(char => 
            this.ownedCharacters.includes(char.id) && 
            !this.isCharacterPicked(char.id)
        );
        
        if (availableChars.length > 0) {
            const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
            this.selectedCharacter = randomChar;
            this.pickCharacter();
        }
    }

    makeAIPick() {
        // Exclude any playable-only variants from AI selection (e.g., atlantean_sub_zero_playable)
        const availableAIChars = this.aiAvailableCharacters.filter(id => 
            !id.endsWith('_playable') &&
            !this.isCharacterPicked(id) &&
            this.characterRegistry[id]
        );
        
        if (availableAIChars.length === 0) {
            console.error('[DRAFT] No available AI characters!');
            return;
        }
        
        // AI picks randomly for now (could implement more sophisticated logic)
        const randomIndex = Math.floor(Math.random() * availableAIChars.length);
        const pickedCharId = availableAIChars[randomIndex];
        const pickedChar = this.characterRegistry[pickedCharId];
        
        console.log('[DRAFT] AI picks:', pickedChar.name);
        
        // Add to AI team
        const currentPick = this.pickOrder[this.currentPickIndex];
        if (!currentPick) {
            console.error('[DRAFT] No current pick found for AI at index:', this.currentPickIndex);
            return;
        }
        this.aiTeam[currentPick.slot] = pickedCharId;
        
        // Update UI
        this.updateTeamSlot('ai', currentPick.slot, pickedChar);
        
        // Re-render grid to update disabled states
        this.renderCharacterGrid();
        
        // Continue to next pick
        this.advanceToNextPick();
    }

    pickCharacter() {
        if (!this.selectedCharacter || !this.isPlayerTurn) return;
        
        console.log('[DRAFT] Player picks:', this.selectedCharacter.name);
        
        // Add to player team
        const currentPick = this.pickOrder[this.currentPickIndex];
        if (!currentPick) {
            console.error('[DRAFT] No current pick found at index:', this.currentPickIndex);
            return;
        }
        this.playerTeam[currentPick.slot] = this.selectedCharacter.id;
        
        // Update UI
        this.updateTeamSlot('player', currentPick.slot, this.selectedCharacter);
        
        // Reset selection
        this.selectedCharacter = null;
        this.clearPreview();
        this.elements.pickBtn.disabled = true;
        
        // Remove selection from grid
        document.querySelectorAll('.character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Re-render grid to update disabled states
        this.renderCharacterGrid();
        
        // Continue to next pick
        this.advanceToNextPick();
    }

    updateTeamSlot(team, slot, character) {
        const teamSection = document.querySelector(`.${team}-team`);
        const slotElement = teamSection?.querySelector(`[data-slot="${slot}"]`);
        
        if (!slotElement) return;
        
        slotElement.classList.add('filled');
        slotElement.classList.remove('picking');
        
        const slotContent = slotElement.querySelector('.slot-content');
        slotContent.innerHTML = `
            <div class="character-in-slot">
                <img src="${this.getCharacterImagePath(character)}" alt="${character.name}">
                <div class="character-name">${character.name}</div>
            </div>
        `;
    }

    clearPreview() {
        if (this.elements.previewImage) {
            this.elements.previewImage.src = '';
        }
        
        if (this.elements.previewName) {
            this.elements.previewName.textContent = 'Select a champion';
        }
        
        if (this.elements.previewDescription) {
            this.elements.previewDescription.textContent = 'Click on a champion to see details';
        }
    }

    advanceToNextPick() {
        clearInterval(this.timerInterval);
        
        this.currentPickIndex++;
        
        // Small delay before next pick
        setTimeout(() => {
            this.startNextPick();
        }, 1000);
    }

    completeDraft() {
        console.log('[DRAFT] Draft completed!');
        console.log('Player team:', this.playerTeam);
        console.log('AI team:', this.aiTeam);
        
        this.isDraftComplete = true;
        clearInterval(this.timerInterval);
        
        // Update UI
        if (this.elements.currentTurnText) {
            this.elements.currentTurnText.textContent = 'Draft Complete!';
        }
        
        if (this.elements.phaseText) {
            this.elements.phaseText.textContent = 'Ready for Battle';
        }
        
        // Show completion overlay
        this.showDraftComplete();
    }

    showDraftComplete() {
        const overlay = document.getElementById('draft-complete');
        if (!overlay) return;
        
        // Populate final teams
        this.populateFinalTeams();
        
        overlay.classList.add('show');
    }

    populateFinalTeams() {
        const playerTeamEl = document.getElementById('final-player-team');
        const aiTeamEl = document.getElementById('final-ai-team');
        
        if (playerTeamEl) {
            playerTeamEl.innerHTML = '';
            this.playerTeam.forEach(charId => {
                if (charId) {
                    const char = this.characterRegistry[charId];
                    const charEl = this.createFinalCharElement(char);
                    playerTeamEl.appendChild(charEl);
                }
            });
        }
        
        if (aiTeamEl) {
            aiTeamEl.innerHTML = '';
            this.aiTeam.forEach(charId => {
                if (charId) {
                    const char = this.characterRegistry[charId];
                    const charEl = this.createFinalCharElement(char);
                    aiTeamEl.appendChild(charEl);
                }
            });
        }
    }

    createFinalCharElement(character) {
        const div = document.createElement('div');
        div.className = 'final-char';
        div.innerHTML = `
            <img src="${this.getCharacterImagePath(character)}" alt="${character.name}">
            <span>${character.name}</span>
        `;
        return div;
    }

    filterCharacters(searchTerm) {
        this.renderCharacterGrid();
    }

    setFilter(filter) {
        // Update active filter button
        this.elements.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        // Re-render grid
        this.renderCharacterGrid();
    }

    showLoading(message = 'Loading...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
            const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }

    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message) {
        console.error('[DRAFT] Error:', message);
        alert(`Draft Mode Error: ${message}`);
    }

    loadStageModifiers() {
        try {
            // Load available modifiers from the draft mode stage
            this.availableModifiers = [
                {
                    id: "burning_ground",
                    name: "Burning Ground",
                    description: "The ground is ablaze with hellish flames! Player characters take fire damage at the start of each turn.",
                    icon: "🔥"
                },
                {
                    id: "healing_wind",
                    name: "Healing Wind",
                    description: "A gentle breeze carries healing energy across the battlefield.",
                    icon: "🌬️"
                },
                {
                    id: "its_raining_man",
                    name: "It's raining man!",
                    description: "Heavy rain falls from the burning sky! All player characters heal HP each turn.",
                    icon: "🌧️"
                },
                {
                    id: "frozen_ground",
                    name: "Frozen Ground",
                    description: "The ground is frozen solid! All characters move 25% slower.",
                    icon: "❄️"
                },
                {
                    id: "toxic_miasma",
                    name: "Toxic Miasma",
                    description: "Poisonous gas fills the air! All characters take poison damage each turn.",
                    icon: "☠️"
                },
                {
                    id: "desert_heat",
                    name: "Desert Heat",
                    description: "The desert heat intensifies everyone's focus! All characters gain 50% critical strike chance, 50 HP regen, and 50 mana regen.",
                    icon: "🌵"
                },
                {
                    id: "cleansing_winds",
                    name: "Cleansing Winds",
                    description: "Mystical winds sweep across the battlefield every 3rd turn, removing all buffs and debuffs from all characters.",
                    icon: "🌪️✨"
                },
                {
                    id: "small_space",
                    name: "Small Space",
                    description: "The confined space makes dodging impossible! All characters have their dodge chance reduced to 0.",
                    icon: "🚪"
                }
            ];
            
            // Select a random modifier
            this.selectRandomModifier();
            
            // Update the display
            this.updateModifierDisplay();
            
            console.log('[DRAFT] Stage modifiers loaded successfully');
        } catch (error) {
            console.error('[DRAFT] Error loading stage modifiers:', error);
        }
    }

    selectRandomModifier() {
        if (this.availableModifiers.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.availableModifiers.length);
            this.selectedRandomModifier = this.availableModifiers[randomIndex];
            console.log('[DRAFT] Selected random modifier:', this.selectedRandomModifier.name);
        }
    }

    updateModifierDisplay() {
        if (!this.elements.modifierIcon || !this.elements.modifierName || !this.elements.modifierDescription) {
            return;
        }
        
        if (this.randomModifierEnabled && this.selectedRandomModifier) {
            // Show the selected random modifier
            this.elements.modifierIcon.textContent = this.selectedRandomModifier.icon;
            this.elements.modifierName.textContent = this.selectedRandomModifier.name;
            this.elements.modifierDescription.textContent = this.selectedRandomModifier.description;
            this.elements.selectedModifierDisplay.classList.remove('disabled');
        } else {
            // Show disabled state
            this.elements.modifierIcon.textContent = '🚫';
            this.elements.modifierName.textContent = 'No Modifier';
            this.elements.modifierDescription.textContent = 'No additional stage effects will be active during this battle';
            this.elements.selectedModifierDisplay.classList.add('disabled');
        }
    }
}

// Global functions for HTML onclick handlers
function exitDraft() {
    if (confirm('Are you sure you want to exit the draft? Your progress will be lost.')) {
        window.location.href = 'character-selector.html';
    }
}

function startBattle() {
    console.log('[DRAFT] Starting battle...');
    
    if (!window.draftMode) {
        console.error('[DRAFT] Draft mode not initialized');
        alert('Draft mode not properly initialized');
        return;
    }
    
    // Get the completed teams (filter out null values)
    const playerTeamIds = window.draftMode.playerTeam.filter(charId => charId !== null);
    const aiTeamIds = window.draftMode.aiTeam.filter(charId => charId !== null);
    
    // Convert IDs to character objects for logging
    const playerTeamChars = playerTeamIds.map(id => window.draftMode.characterRegistry[id]).filter(char => char);
    const aiTeamChars = aiTeamIds.map(id => window.draftMode.characterRegistry[id]).filter(char => char);
    
    console.log('[DRAFT] Player team:', playerTeamChars.map(c => c.name));
    console.log('[DRAFT] AI team:', aiTeamChars.map(c => c.name));
    
    if (playerTeamIds.length === 0 || aiTeamIds.length === 0) {
        console.error('[DRAFT] Invalid teams - missing characters');
        alert('Invalid team composition. Please restart the draft.');
        return;
    }
    
    // Prepare stage modifier data
    const stageModifierData = {
        randomModifierEnabled: window.draftMode.randomModifierEnabled,
        selectedRandomModifier: window.draftMode.selectedRandomModifier
    };
    
    // Save draft results to localStorage
    const draftResults = {
        playerTeam: playerTeamChars.map(char => ({
            id: char.id,
            name: char.name
        })),
        aiTeam: aiTeamChars.map(char => ({
            id: char.id,
            name: char.name
        })),
        stageModifiers: stageModifierData,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('draftResults', JSON.stringify(draftResults));
        console.log('[DRAFT] Draft results saved to localStorage:', draftResults);
        
        // Navigate to raid game
        window.location.href = 'raid-game.html?stage=draft_mode_stage';
    } catch (error) {
        console.error('[DRAFT] Error saving draft results:', error);
        alert('Failed to save draft results. Please try again.');
    }
}

function restartDraft() {
    if (confirm('Start a new draft? This will reset all picks.')) {
        window.location.reload();
    }
}

// Initialize draft mode when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DRAFT] DOM loaded, initializing DraftMode...');
    window.draftMode = new DraftMode();
    await window.draftMode.init();
}); 