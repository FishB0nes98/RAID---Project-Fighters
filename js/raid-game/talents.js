// js/raid-game/talents.js - Enhanced RPG Talent Tree

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const CONFIG = {
        defaultTalentPoints: 0,       // Default talent points for new characters (changed from maxTalentPoints)
        nodeSize: 64,                 // Size of talent node in pixels
        baseFontSize: 16,             // Base font size for scaling
        zoomStep: 0.1,                // Zoom step amount
        minZoom: 0.5,                 // Minimum zoom level
        maxZoom: 1.5,                 // Maximum zoom level
        specialTypes: {               // Special node types with custom styling
            keystone: "keystone",     // Key talents (larger, special effects)
            mastery: "mastery",       // Mastery talents (special border)
            ultimate: "ultimate"      // Ultimate talents (special effects)
        },
        soundEffects: {
            hover: true,              // Play sound on hover
            select: true,             // Play sound on select
            deselect: true,           // Play sound on deselect
            unlock: true              // Play sound on tier unlock
        },
        volumeLevel: 0.3,             // Sound effect volume (0-1)
        treePadding: 100,             // Padding around the tree
        rankColors: [                 // Colors for different rank levels
            'var(--text-light)',
            'var(--info)',
            'var(--success)',
            'var(--primary)',
            'var(--accent)',
            'var(--warning)'
        ]
    };

    // State Management
    let talentDefinitions = null; // Renamed from talentData to hold the talentTree object
    let characterData = null;         // Character data
    let classData = null;             // Class specialization data
    let selectedTalents = {};         // Selected talents: { talentId: rank }
    let availableTalentPoints = 0;    // Points available to spend
    let maxTalentPoints = 0;          // Maximum talent points for this character (loaded from Firebase)
    let userId = null;                // Current user ID
    let characterId = null;           // Character ID
    let characterXPManager = null;    // Character XP Manager instance
    let currentTooltipId = null;      // Currently displayed tooltip
    
    // UI References
    let nodeElements = {};            // DOM elements for nodes
    let connectorElements = {};       // DOM elements for connectors
    let soundElements = {};           // Audio elements

    // Canvas & Interaction
    let currentScale = 1.0;           // Current zoom level
    let isPanning = false;            // Is user currently panning
    let startPoint = { x: 0, y: 0 };  // Start point for panning
    let scrollPosition = { left: 0, top: 0 }; // Current scroll position

    // --- Controller Support State ---
    let controllerManager = null;     // Reference to ControllerManager instance
    let isControllerMode = false;     // Is controller actively used on this screen
    let currentControllerElement = null; // Currently selected DOM element by controller
    let currentNavSection = 'talent-grid'; // 'talent-grid', 'header', 'map'
    const navGroups = {              // Available navigation groups
        'talent-grid': [],           // Populated dynamically
        'header': [],                // Populated from DOM
        'map': []                    // Populated from DOM
    };
    const navGroupOrder = ['header', 'talent-grid', 'map'];
    let controllerUpdateInterval = null; // Interval ID for controller updates
    const controllerCooldowns = {    // Cooldowns for controller actions
        navigation: 0,
        action: 0,
        zoom: 0,
        pan: 0,
        switchGroup: 0
    };
    const COOLDOWN_TIMES = {         // Cooldown durations in ms
        navigation: 150,            // DPad/Stick Nav
        action: 300,                // A/B/Start/Back
        zoom: 100,                  // LT/RT
        pan: 50,                   // Right Stick Pan
        switchGroup: 250            // LB/RB
    };
    let lastInputTime = 0;           // Timestamp of the last controller input
    let controllerCursor = null;     // Visual indicator for controller focus
    // --- End Controller Support State ---

    // DOM Elements
    const elements = {
        loadingScreen: document.getElementById('loading-screen'),
        loadingText: document.getElementById('loading-text'),
        talentTreeArea: document.getElementById('talent-tree-area'),
        talentTreeCanvas: document.getElementById('talent-tree-canvas'),
        characterImage: document.getElementById('character-image'),
        characterName: document.getElementById('character-name'),
        characterLevel: document.getElementById('character-level'),
        xpFill: document.getElementById('xp-fill'),
        xpText: document.getElementById('xp-text'),
        talentPointsInfo: document.getElementById('talent-points-info'),
        pointsAvailable: document.getElementById('points-available'),
        pointsTotal: document.getElementById('points-total'),
        talentControls: document.getElementById('talent-controls'),
        saveButton: document.getElementById('save-talents-button'),
        resetButton: document.getElementById('reset-talents-button'),
        backButton: document.getElementById('back-button'),
        talentTooltip: document.getElementById('talent-tooltip'),
        tooltipIcon: document.getElementById('tooltip-icon'),
        tooltipName: document.getElementById('tooltip-name'),
        tooltipType: document.getElementById('tooltip-type'),
        tooltipDescription: document.getElementById('tooltip-description'),
        tooltipEffects: document.getElementById('tooltip-effects'),
        tooltipStatus: document.getElementById('tooltip-status'),
        tooltipRequirements: document.getElementById('tooltip-requirements'),
        tooltipCost: document.getElementById('tooltip-cost'),
        classIcon: document.getElementById('class-icon-img'),
        className: document.getElementById('class-name'),
        classDescription: document.getElementById('class-description'),
        zoomIn: document.getElementById('zoom-in'),
        zoomOut: document.getElementById('zoom-out'),
        resetView: document.getElementById('reset-view'),
        soundSelect: document.getElementById('sound-select'),
        soundDeselect: document.getElementById('sound-deselect'),
        soundHover: document.getElementById('sound-hover'),
        soundUnlock: document.getElementById('sound-unlock')
    };

    // --- Initialization ---

    // Helper function to wait for Firebase Auth to initialize
    function waitForFirebaseAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                // Check if firebase and firebase.auth() are available
                if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && firebase.apps.length > 0) {
                    // Now check if the auth service itself is initialized
                    const auth = firebase.auth();
                    // Use onAuthStateChanged which fires when initialization completes
                    const unsubscribe = auth.onAuthStateChanged(user => {
                        unsubscribe(); // Unsubscribe after the first trigger
                        resolve();     // Resolve the promise
                    });
                } else {
                    console.log("[waitForFirebaseAuth] Waiting for Firebase SDK...");
                    setTimeout(checkAuth, 150); // Check again shortly
                }
            };
            checkAuth();
        });
    }

    async function initialize() {
        showLoading('Loading talents...');
        
        try {
            // --- Controller Support Initialization for Talents Screen ---
            if (typeof window.ControllerManager === 'function') {
                console.log("[Talents] ControllerManager class found. Initializing instance for talent screen.");
                // Create a new instance specifically for this screen.
                // Pass null for gameManager as it's not directly needed here.
                controllerManager = new window.ControllerManager(null);
                controllerManager.initialize(); // Initialize the new instance

                createControllerCursor(); // Create the visual cursor
                setupControllerListeners(); // Set up listeners to activate/deactivate based on input
                console.log("[Talents] Controller support initialized for this screen.");
            } else {
                controllerManager = null; // Ensure it's null if class isn't found
                console.warn("[Talents] ControllerManager class not found. Controller support disabled.");
            }
            // --- End Controller Support Initialization ---

            // Wait for Firebase auth to be ready
            await waitForFirebaseAuth();
            
            // Get User ID
            if (!firebaseAuth.currentUser) {
                throw new Error('User not authenticated');
            }
            userId = firebaseAuth.currentUser.uid;
            
            // Get character ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            characterId = urlParams.get('character');
            
            if (!characterId) {
                throw new Error('No character ID specified');
            }

            // Initialize sound effects
            initializeSounds();

            // Initialize character XP manager
            if (typeof window.characterXPManager !== 'undefined') {
                characterXPManager = window.characterXPManager;
                if (!characterXPManager.initialized) {
                    await characterXPManager.initialize();
                }
                console.log('[Talents] Using global CharacterXPManager');
            }

            // Fetch character base data (for name, image, etc.)
            characterData = await fetchCharacterBaseData(characterId);
            updateHeader();
            updateClassInfo();
            
            // Load and display character XP data
            await updateCharacterXPDisplay();

            // --- Fetch definitions, user selections, and talent points concurrently ---
            const fetchTalentDefinitions = async () => {
                try {
                    const response = await fetch(`js/raid-game/talents/${characterId}_talents.json`);
                    if (!response.ok) {
                        if (response.status === 404) {
                            console.warn(`No talent definitions found for character ${characterId}`);
                            return {}; // Return empty object if not found
                        } else {
                            throw new Error(`Failed to load talent definitions: ${response.statusText}`);
                        }
                    } else {
                        const fullTalentData = await response.json();
                        return fullTalentData.talentTree || {}; // Get the talentTree property
                    }
                } catch (fetchError) {
                    console.error('Error fetching talent definitions:', fetchError);
                    showNotification(`Error loading talent data: ${fetchError.message}`, 'error');
                    return {}; // Return empty object on error
                }
            };

            const fetchSelectedTalents = async () => {
                try {
                    const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).once('value');
                    return snapshot.val() || {}; // Default to empty object
                } catch (dbError) {
                    console.error('Error fetching selected talents:', dbError);
                    showNotification(`Error loading saved talents: ${dbError.message}`, 'error');
                    return {}; // Default to empty object on error
                }
            };

            const fetchTalentPoints = async () => {
                try {
                    const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).once('value');
                    const points = snapshot.val();
                    return points !== null ? points : CONFIG.defaultTalentPoints; // Default to 0 if not found
                } catch (dbError) {
                    console.error('Error fetching talent points:', dbError);
                    showNotification(`Error loading talent points: ${dbError.message}`, 'error');
                    return CONFIG.defaultTalentPoints; // Default to 0 on error
                }
            };

            // Wait for all three fetches to complete
            const [definitions, selections, talentPoints] = await Promise.all([
                fetchTalentDefinitions(),
                fetchSelectedTalents(),
                fetchTalentPoints()
            ]);

            talentDefinitions = definitions;
            selectedTalents = selections;
            maxTalentPoints = talentPoints;
            // ----------------------------------------------------------

            // Calculate available talent points (NOW that selections and max points are loaded)
            availableTalentPoints = calculateAvailablePoints();
            updateTalentPointsDisplay(); // Update points display after calculation
            
            // Render the talent tree (NOW that definitions AND selections are loaded)
            renderTalentTree();
            
            // Setup event handlers
            setupEventHandlers();
            setupCanvasInteraction();
            
            // Apply animation after everything is loaded
            setTimeout(() => {
                animateTreeReveal();
                // --- Controller: Select initial element ---
                populateNavGroups();
                // Check the newly created instance's mode (it might detect a connected controller immediately)
                if (controllerManager && controllerManager.isControllerMode) { 
                    activateControllerModeTalents();
                } else {
                    deactivateControllerModeTalents(); // Ensure it starts deactivated if manager isn't active
                }
                // --- End Controller Initial Selection ---
            }, 500);
            
            hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            showLoading(`Error: ${error.message}`, true);
        }
    }

    function initializeSounds() {
        // Preload sounds
        for (const sound in soundElements) {
            if (soundElements[sound]) {
                soundElements[sound].load();
            }
        }
    }

    function playSound(type) {
        if (soundElements[type]) {
            soundElements[type].currentTime = 0;
            soundElements[type].play().catch(e => console.warn(`Sound ${type} failed to play:`, e));
        }
    }

    // Fetch character data from game files
    async function fetchCharacterBaseData(charId) {
        try {
            const response = await fetch(`js/raid-game/characters/${charId}.json`);
            if (!response.ok) {
                throw new Error(`Character data not found for ${charId}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching character data:', error);
            throw error;
        }
    }

    // Update header with character info
    function updateHeader() {
        if (characterData) {
            elements.characterName.textContent = characterData.name || 'Character';
            // Use skin system for character image
            const imagePath = window.SkinManager ? 
                window.SkinManager.getCharacterImagePath(characterId) || characterData.image : 
                characterData.image;
            elements.characterImage.src = imagePath || 'Loading Screen/default.png';
            elements.characterImage.alt = characterData.name || 'Character';
        }
    }

    // Update class info section
    function updateClassInfo() {
        if (classData) {
            elements.className.textContent = classData.name;
            elements.classDescription.textContent = classData.description;
            elements.classIcon.src = classData.icon || 'images/icons/default_class.png';
            elements.classIcon.alt = classData.name;
        }
    }

    /**
     * Update character level and XP display
     */
    async function updateCharacterXPDisplay() {
        if (!characterXPManager || !characterId) {
            console.warn('[Talents] Cannot update XP display - missing manager or character ID');
            return;
        }

        try {
            const xpData = await characterXPManager.getCharacterXP(characterId);
            
            // Update level display
            if (elements.characterLevel) {
                elements.characterLevel.textContent = xpData.level;
            }

            // Update XP bar and text
            if (elements.xpFill && elements.xpText) {
                const xpProgress = (xpData.currentXP / xpData.xpForNextLevel) * 100;
                elements.xpFill.style.width = `${Math.min(xpProgress, 100)}%`;
                elements.xpText.textContent = `${xpData.currentXP} / ${xpData.xpForNextLevel} XP`;
            }

            console.log(`[Talents] Updated XP display - Level ${xpData.level}, XP: ${xpData.currentXP}/${xpData.xpForNextLevel}`);
        } catch (error) {
            console.error('[Talents] Error updating XP display:', error);
            // Set default values on error
            if (elements.characterLevel) {
                elements.characterLevel.textContent = '1';
            }
            if (elements.xpFill && elements.xpText) {
                elements.xpFill.style.width = '0%';
                elements.xpText.textContent = '0 / 1000 XP';
            }
        }
    }

    function updateTalentPointsDisplay() {
        // Calculate used points
        const usedPoints = calculateUsedPoints();
        availableTalentPoints = maxTalentPoints - usedPoints;
        
        // Update display
        elements.pointsAvailable.textContent = availableTalentPoints;
        elements.pointsTotal.textContent = maxTalentPoints;
        
        // Color coding
        elements.talentPointsInfo.style.color = 
            availableTalentPoints > 0 ? 'var(--accent)' : 'var(--danger)';
    }
    
    function calculateUsedPoints() {
        let total = 0;
        
        // Sum up points from all selected talents
        for (const talentId in selectedTalents) {
            // Get talent rank (default to 1 if boolean true for backward compatibility)
            const rank = typeof selectedTalents[talentId] === 'boolean' 
                ? 1 
                : selectedTalents[talentId];
                
            total += rank;
        }
        
        return total;
    }
    
    function calculateAvailablePoints() {
        return maxTalentPoints - calculateUsedPoints();
    }

    // --- Tree Layout & Rendering ---
    function renderTalentTree() {
        // Clear previous render
        elements.talentTreeCanvas.innerHTML = '';
        nodeElements = {};
        connectorElements = {};
        
        if (!talentDefinitions || Object.keys(talentDefinitions).length === 0) { // Check talentDefinitions
            showErrorMessage("No talent data available for this character.");
            return;
        }
        
        // Calculate node positions
        const positions = calculateTalentPositions();
        
        // Render connectors first (so they appear behind nodes)
        renderConnectors(positions);
        
        // Render nodes
        renderNodes(positions);
        
        // Update node states
        updateAllNodeStates();
    }
    
    function calculateTalentPositions() {
        // Improved position calculation - Better handle complex trees
        const positions = {};
        const tiers = {};     // Group by tiers
        const branches = {};  // Track talent branches
        
        // First, analyze the tree structure using talentDefinitions
        analyzeTreeStructure(tiers, branches);
        
        // Calculate horizontal positions by tier
        const horizontalSpacing = 180;
        const verticalSpacing = 120;
        const tierCounts = {}; // Count talents in each tier
        
        // Count talents per tier
        for (const tier in tiers) {
            tierCounts[tier] = tiers[tier].length;
        }
        
        // Position each talent
        const maxTier = Math.max(...Object.keys(tiers).map(Number));
        
        for (let tier = 0; tier <= maxTier; tier++) {
            const talentsInTier = tiers[tier] || [];
            const tierHeight = talentsInTier.length * verticalSpacing;
            
            // Position each talent in this tier
            talentsInTier.forEach((talentId, index) => {
                const talent = talentDefinitions[talentId]; // Use talentDefinitions
                if (!talent) return;
                
                // Calculate vertical position (centered in tier)
                const x = CONFIG.treePadding + (tier * horizontalSpacing);
                const y = CONFIG.treePadding + 200 + (index * verticalSpacing);
                
                // Store position
                positions[talentId] = { x, y };
                
                // Apply custom positioning if defined in talent
                if (talent.position) {
                    if (talent.position.x !== undefined) {
                        positions[talentId].x += talent.position.x;
                    }
                    if (talent.position.y !== undefined) {
                        positions[talentId].y += talent.position.y;
                    }
                }
            });
        }
        
        // Apply branch-based positioning adjustments
        // adjustPositionsForBranches(positions, branches); // <-- Commented out this line

        // Handle orphaned nodes
        positionOrphanedNodes(positions);
        
        return positions;
    }
    
    function analyzeTreeStructure(tiers, branches) {
        // First pass - identify starting nodes and assign tiers
        const startingNodes = [];
        const visited = new Set();
        
        // Find starting nodes (no parents or root flag) using talentDefinitions
        for (const talentId in talentDefinitions) {
            const talent = talentDefinitions[talentId]; // Use talentDefinitions
            if (!talent.parents || talent.parents.length === 0 || talent.isRoot) {
                startingNodes.push(talentId);
                // Initialize tier 0
                if (!tiers[0]) tiers[0] = [];
                tiers[0].push(talentId);
                visited.add(talentId);
            }
        }
        
        // Breadth-first traversal to assign tiers
        let currentTier = 0;
        let currentTierNodes = [...startingNodes];
        
        while (currentTierNodes.length > 0) {
            const nextTierNodes = [];
            
            // Process each node in the current tier
            for (const nodeId of currentTierNodes) {
                const talent = talentDefinitions[nodeId]; // Use talentDefinitions
                if (!talent || !talent.children) continue;
                
                // Process children
                for (const childId of talent.children) {
                    if (!talentDefinitions[childId]) continue; // Use talentDefinitions
                    
                    // If child not yet visited, add to next tier
                    if (!visited.has(childId)) {
                        // Initialize tier if needed
                        if (!tiers[currentTier + 1]) tiers[currentTier + 1] = [];
                        tiers[currentTier + 1].push(childId);
                        nextTierNodes.push(childId);
                        visited.add(childId);
                        
                        // Track branch information
                        if (!branches[nodeId]) branches[nodeId] = [];
                        branches[nodeId].push(childId);
                    }
                }
            }
            
            // Move to next tier
            currentTierNodes = nextTierNodes;
            currentTier++;
        }
        
        // Handle multi-parent talents (resolve tier conflicts) using talentDefinitions
        for (const talentId in talentDefinitions) {
            const talent = talentDefinitions[talentId]; // Use talentDefinitions
            if (!talent.parents || talent.parents.length <= 1) continue;
            
            // Find the deepest parent tier
            let deepestParentTier = -1;
            for (const parentId of talent.parents) {
                // Find the tier containing this parent
                for (const tier in tiers) {
                    if (tiers[tier].includes(parentId)) {
                        deepestParentTier = Math.max(deepestParentTier, parseInt(tier));
                        break;
                    }
                }
            }
            
            // Ensure talent is placed in proper tier (after its parents)
            if (deepestParentTier >= 0) {
                // Remove from current tier
                for (const tier in tiers) {
                    const index = tiers[tier].indexOf(talentId);
                    if (index >= 0) {
                        tiers[tier].splice(index, 1);
                        break;
                    }
                }
                
                // Add to correct tier
                const correctTier = deepestParentTier + 1;
                if (!tiers[correctTier]) tiers[correctTier] = [];
                tiers[correctTier].push(talentId);
            }
        }
    }
    
    function adjustPositionsForBranches(positions, branches) {
        // Adjust vertical positions to avoid overlaps in branches
        for (const parentId in branches) {
            const children = branches[parentId];
            if (children.length <= 1) continue; // No adjustment needed
            
            // Center children vertically relative to parent
            const parentPos = positions[parentId];
            if (!parentPos) continue;
            
            // Calculate total height of children
            const childrenHeight = (children.length - 1) * 120;
            
            // Position each child
            children.forEach((childId, index) => {
                if (!positions[childId]) return;
                
                // Center positions around parent
                const yOffset = (index * 120) - (childrenHeight / 2);
                positions[childId].y = parentPos.y + yOffset;
            });
        }
    }
    
    function positionOrphanedNodes(positions) {
        // Position any nodes that weren't handled in the tree traversal using talentDefinitions
        let offsetY = 100;
        for (const talentId in talentDefinitions) { // Use talentDefinitions
            if (!positions[talentId]) {
                console.warn(`Talent ${talentId} has no calculated position, placing at edge`);
                positions[talentId] = { 
                    x: CONFIG.treePadding, 
                    y: CONFIG.treePadding + 200 + offsetY
                };
                offsetY += 100;
            }
        }
    }
    
    function renderNodes(positions) {
        // Create DOM elements for each talent node using talentDefinitions
        for (const talentId in talentDefinitions) { // Use talentDefinitions
            const talent = talentDefinitions[talentId]; // Use talentDefinitions
            if (!talent) continue;
            
            const pos = positions[talentId];
            if (!pos) continue;
            
            createTalentNode(talent, pos.x, pos.y);
        }
    }
    
    function createTalentNode(talent, x, y) {
        // Create main node element
        const node = document.createElement('div');
        node.id = `talent-${talent.id}`;
        node.className = 'talent-node';
        node.dataset.talentId = talent.id;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        // Add special tier attribute for styling if specified
        if (talent.tier) {
            node.dataset.tier = talent.tier;
        }
        
        // Check if this is a powerful talent - from talent data or from the hardcoded list
        const powerfulTalents = ['talent_shoma_18', 'talent_shoma_19']; // Fallback list for backward compatibility
        const isPowerful = talent.powerful === true || powerfulTalents.includes(talent.id);
        
        if (isPowerful) {
            node.dataset.powerful = "true";
            
            // Create power particles container
            const powerParticles = document.createElement('div');
            powerParticles.className = 'power-particles';
            
            // Add particle elements
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('span');
                powerParticles.appendChild(particle);
            }
            
            // Create talent icon container for decoration
            const iconContainer = document.createElement('div');
            iconContainer.className = 'talent-icon-container';
            
            // Create powerful badge
            const powerfulBadge = document.createElement('div');
            powerfulBadge.className = 'powerful-badge';
            powerfulBadge.textContent = 'POWERFUL';
            
            // Append particles and badge
            node.appendChild(powerParticles);
            node.appendChild(powerfulBadge);
            
            // Wrap icon in container
            iconContainer.appendChild(document.createElement('div')); // Placeholder for ::before
            node.appendChild(iconContainer);
        }
        
        // Create icon
        const icon = document.createElement('img');
        icon.className = 'talent-icon';
        icon.src = talent.icon || 'images/icons/default_ability.png';
        icon.alt = talent.name;
        
        // Add rank indicator if multi-rank talent
        if (talent.maxRank && talent.maxRank > 1) {
            const rankIndicator = document.createElement('div');
            rankIndicator.className = 'talent-rank';
            rankIndicator.textContent = '0';
            node.appendChild(rankIndicator);
        }
        
        // Add icon to the node or to the container if powerful
        if (isPowerful) {
            node.querySelector('.talent-icon-container').appendChild(icon);
        } else {
            node.appendChild(icon);
        }
        
        elements.talentTreeCanvas.appendChild(node);
        nodeElements[talent.id] = node;
        
        // Add event listeners
        node.addEventListener('click', () => handleTalentClick(talent.id));
        node.addEventListener('mouseenter', (e) => {
            showTooltip(e, talent.id);
            // Only play hover sound if not in controller mode or if element is controller-selected
            if (!isControllerMode || node === currentControllerElement) {
                playSound('hover');
            }
        });
        node.addEventListener('mouseleave', hideTooltip);
    }
    
    function renderConnectors(positions) {
        // Create connector elements between linked talents using talentDefinitions
        for (const talentId in talentDefinitions) { // Use talentDefinitions
            const talent = talentDefinitions[talentId]; // Use talentDefinitions
            if (!talent) continue;
            
            // Create connectors from parents to this talent
            if (talent.parents) {
                talent.parents.forEach(parentId => {
                    if (talentDefinitions[parentId]) { // Use talentDefinitions
                        createConnector(talentDefinitions[parentId], talent, positions); // Use talentDefinitions
                    }
                });
            }
        }
    }
    
    function createConnector(parent, child, positions) {
        // Get positions
        const parentPos = positions[parent.id];
        const childPos = positions[child.id];
        
        if (!parentPos || !childPos) {
            console.warn(`Cannot create connector, missing position for ${parent.id} or ${child.id}`);
            return;
        }
        
        // Create connector element
        const connector = document.createElement('div');
        const connectorId = `connector-${parent.id}-${child.id}`;
        connector.id = connectorId;
        connector.className = 'talent-connector';
        
        // Calculate line between centers
        const nodeSize = CONFIG.nodeSize;
        const parentCenterX = parentPos.x + nodeSize / 2;
        const parentCenterY = parentPos.y + nodeSize / 2;
        const childCenterX = childPos.x + nodeSize / 2;
        const childCenterY = childPos.y + nodeSize / 2;
        
        // Calculate angle and length
        const angle = Math.atan2(childCenterY - parentCenterY, childCenterX - parentCenterX);
        const length = Math.hypot(childCenterX - parentCenterX, childCenterY - parentCenterY);
        
        // Position connector
        connector.style.width = `${length}px`;
        connector.style.left = `${parentCenterX}px`;
        connector.style.top = `${parentCenterY}px`;
        connector.style.transformOrigin = '0 0';
        connector.style.transform = `rotate(${angle}rad)`;
        
        // Add to DOM
        elements.talentTreeCanvas.appendChild(connector);
        connectorElements[connectorId] = connector;
    }

    // --- Event Handlers ---
    function setupEventHandlers() {
        elements.saveButton.addEventListener('click', handleSaveTalents);
        elements.resetButton.addEventListener('click', handleResetTalents);
        elements.backButton.addEventListener('click', () => {
            // Navigate back to character selector, potentially passing charId
            window.location.href = `character-selector.html`;
            // --- Controller: Cleanup on navigate away ---
            stopControllerUpdates();
            removeControllerCursor();
            // --- End Controller Cleanup ---
        });
    }

    function handleTalentClick(talentId) {
        const talent = talentDefinitions[talentId]; // Use talentDefinitions
        if (!talent) return;
        
        const status = getTalentStatus(talentId);
        
        if (status === 'available') {
            // Check if we have points available
            if (availableTalentPoints <= 0) {
                showNotification("No talent points available", "error");
                return;
            }
            
            // --- NEW: Prevent selecting a second powerful talent ---
            if (talent.powerful) {
                const hasOtherPowerfulSelected = Object.keys(selectedTalents).some(selectedId => {
                    const otherTalent = talentDefinitions[selectedId];
                    return otherTalent && otherTalent.powerful && selectedId !== talentId;
                });
                if (hasOtherPowerfulSelected) {
                    showNotification("Only one powerful talent can be selected", "warning");
                    return;
                }
            }
            // --- END NEW ---

            // Select the talent
            if (talent.maxRank && talent.maxRank > 1) {
                // Multi-rank talent
                selectedTalents[talentId] = 1;
            } else {
                // Single rank talent
                selectedTalents[talentId] = true;
            }
            
            // Play sound and update UI
            playSound('select');
            updateTalentPointsDisplay();
            updateAllNodeStates();
            
        } else if (status === 'selected') {
            // Handle multi-rank talents
            if (talent.maxRank && talent.maxRank > 1) {
                const currentRank = typeof selectedTalents[talentId] === 'number' 
                    ? selectedTalents[talentId] 
                    : 1;
                
                if (currentRank < talent.maxRank && availableTalentPoints > 0) {
                    // Increase rank
                    selectedTalents[talentId] = currentRank + 1;
                    playSound('select');
                    updateTalentPointsDisplay();
                    updateAllNodeStates();
                    return;
                }
            }
            
            // Attempt to deselect
            if (canDeselectTalent(talentId)) {
                // Deselect the talent
                delete selectedTalents[talentId];
                playSound('deselect');
                updateTalentPointsDisplay();
                updateAllNodeStates();
            } else {
                showNotification("Cannot remove this talent - other talents depend on it", "warning");
            }
        }
    }

    function canDeselectTalent(talentId) {
        // Can't deselect if other selected talents depend on it
        const talent = talentDefinitions[talentId]; // Use talentDefinitions
        if (!talent || !talent.children) return true;
        
        // Check if any selected child would lose its requirement
        for (const childId of talent.children) {
            if (!selectedTalents[childId]) continue;
            
            const childTalent = talentDefinitions[childId]; // Use talentDefinitions
            if (!childTalent || !childTalent.parents) continue;
            
            // If child has other selected parents, it's fine
            const hasOtherSelectedParent = childTalent.parents.some(parentId => 
                parentId !== talentId && selectedTalents[parentId]);
                
            if (!hasOtherSelectedParent) {
                return false; // Can't deselect because child would lose requirements
            }
        }
        
        return true;
    }

    async function handleSaveTalents() {
        if (!userId || !characterId || !firebaseDatabase) {
            showNotification("Cannot save talents. Missing connection data.", "error");
            return;
        }
        
        showLoading('Saving talents...');
        
        try {
            // Use the correct Firebase path: users/userId/characterTalents/characterId
            await firebaseDatabase.ref(`users/${userId}/characterTalents/${characterId}`).set(selectedTalents);
            hideLoading();
            showNotification("Talents saved successfully!", "success");
        } catch (error) {
            console.error("Error saving talents:", error);
            hideLoading();
            showNotification(`Error saving: ${error.message}`, "error");
        }
    }

    function handleResetTalents() {
        // Confirm reset
        if (Object.keys(selectedTalents).length > 0 && 
            !confirm("Are you sure you want to reset all talents?")) {
            return;
        }
        
        // Reset talent selections
        selectedTalents = {};
        updateTalentPointsDisplay();
        updateAllNodeStates();
        showNotification("Talents reset. Click Save to apply changes.", "info");
    }

    // --- Talent Points Management ---
    
    /**
     * Get talent points for the current character
     */
    async function getTalentPoints() {
        if (!userId || !characterId) {
            return CONFIG.defaultTalentPoints;
        }
        
        try {
            const snapshot = await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).once('value');
            const points = snapshot.val();
            return points !== null ? points : CONFIG.defaultTalentPoints;
        } catch (error) {
            console.error('Error fetching talent points:', error);
            return CONFIG.defaultTalentPoints;
        }
    }

    /**
     * Set talent points for the current character
     */
    async function setTalentPoints(points) {
        if (!userId || !characterId) {
            throw new Error('User not authenticated or character not selected');
        }
        
        if (typeof points !== 'number' || points < 0) {
            throw new Error('Invalid talent points value');
        }
        
        try {
            await firebaseDatabase.ref(`users/${userId}/characterTalentPoints/${characterId}`).set(points);
            maxTalentPoints = points;
            updateTalentPointsDisplay();
            console.log(`Set talent points for ${characterId}: ${points}`);
            return true;
        } catch (error) {
            console.error('Error setting talent points:', error);
            throw error;
        }
    }

    /**
     * Add talent points to the current character
     */
    async function addTalentPoints(pointsToAdd) {
        if (!userId || !characterId) {
            throw new Error('User not authenticated or character not selected');
        }
        
        if (typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
            throw new Error('Invalid talent points value');
        }
        
        try {
            const currentPoints = await getTalentPoints();
            const newPoints = currentPoints + pointsToAdd;
            await setTalentPoints(newPoints);
            showNotification(`Gained ${pointsToAdd} talent point${pointsToAdd > 1 ? 's' : ''}!`, 'success');
            return newPoints;
        } catch (error) {
            console.error('Error adding talent points:', error);
            throw error;
        }
    }

    // --- Expose functions for external use ---
    window.TalentPointsManager = {
        getTalentPoints,
        setTalentPoints,
        addTalentPoints
    };

    // --- Tooltip Logic ---
    function showTooltip(event, talentId) {
        // Cancel any pending hide
        clearTimeout(window.tooltipHideTimer);
        
        // Don't show if we're already showing this talent
        if (currentTooltipId === talentId) return;
        currentTooltipId = talentId;
        
        const talent = talentDefinitions[talentId];
        if (!talent) return;
        
        // Check if this is a powerful talent - from talent data or from the hardcoded list
        const powerfulTalents = ['talent_shoma_18', 'talent_shoma_19']; // Fallback list for backward compatibility
        const isPowerful = talent.powerful === true || powerfulTalents.includes(talent.id);
        
        // Update tooltip content
        elements.tooltipIcon.src = talent.icon || 'images/icons/default_ability.png';
        elements.tooltipName.textContent = talent.name;
        // elements.tooltipDescription.textContent = talent.description;

        // --- MODIFIED: Use innerHTML to allow styling --- 
        let descriptionHtml = talent.description;
        // Try to find talent-specific additions (simple approach, might need refinement)
        const talentMarker = "Talent:";
        const talentIndex = descriptionHtml.indexOf(talentMarker);
        if (talentIndex !== -1) {
            const baseDesc = descriptionHtml.substring(0, talentIndex);
            const talentDesc = descriptionHtml.substring(talentIndex);
            // Determine class based on simple keywords (can be improved)
            let talentClass = 'utility';
            if (talentDesc.toLowerCase().includes('damage')) talentClass = 'damage';
            else if (talentDesc.toLowerCase().includes('heal') || talentDesc.toLowerCase().includes('lifesteal')) talentClass = 'healing';
            
            descriptionHtml = `${baseDesc.trim()}<br><span class="talent-effect ${talentClass}">${talentDesc.replace(talentMarker, 'Talent:').trim()}</span>`;
        }
        elements.tooltipDescription.innerHTML = descriptionHtml.replace(/\n/g, '<br>'); // Replace \n with <br>
        // --- END MODIFICATION --- 

        // Set powerful talent attribute
        if (isPowerful) {
            elements.talentTooltip.dataset.powerful = "true";
            elements.tooltipType.textContent = "Powerful Talent";
        } else {
            delete elements.talentTooltip.dataset.powerful;
            elements.tooltipType.textContent = "Talent";
        }
        
        // Update status based on selected, available, or locked
        const status = getTalentStatus(talentId);
        elements.tooltipStatus.className = `tooltip-status ${status}`;
        
        switch (status) {
            case 'selected':
                elements.tooltipStatus.textContent = "Status: Selected";
                break;
            case 'available':
                elements.tooltipStatus.textContent = "Status: Available";
                break;
            case 'locked':
                elements.tooltipStatus.textContent = "Status: Locked";
                // Show requirements
                const requirements = getRequirementsText(talent);
                elements.tooltipRequirements.textContent = requirements || "";
                
                // --- NEW: Add specific message for powerful talent lock ---
                if (talent.powerful) {
                    const hasOtherPowerfulSelected = Object.keys(selectedTalents).some(selectedId => {
                        const otherTalent = talentDefinitions[selectedId];
                        return otherTalent && otherTalent.powerful && selectedId !== talentId;
                    });
                    if (hasOtherPowerfulSelected) {
                        elements.tooltipRequirements.textContent = "Requires: Only one powerful talent allowed.";
                    } else if (!requirements) {
                        // If it's a root powerful talent and none are selected, it should be available, but we show generic reqs if locked for other reasons
                        elements.tooltipRequirements.textContent = "Requires: Base talent"; // Placeholder if needed
                    }
                }
                // --- END NEW ---
                break;
        }
        
        // Show tooltip costs for available/selected talents
        if (status !== 'locked') {
            elements.tooltipCost.textContent = `Cost: 1 Talent Point`;
            elements.tooltipRequirements.textContent = "";
        }
        
        // Position and show the tooltip
        elements.talentTooltip.classList.add('visible');
        positionTooltip(event);
    }
    
    function positionTooltip(event) {
        // Set initial position off-screen to calculate dimensions
        elements.talentTooltip.style.left = '-9999px';
        elements.talentTooltip.style.top = '-9999px';
        
        // Calculate dimensions
        const tooltipRect = elements.talentTooltip.getBoundingClientRect();
        const margin = 15; // Margin from cursor
        
        // Calculate base position
        let x = event.clientX + margin;
        let y = event.clientY + margin;
        
        // Adjust if out of bounds
        if (x + tooltipRect.width > window.innerWidth) {
            x = event.clientX - tooltipRect.width - margin;
        }
        
        if (y + tooltipRect.height > window.innerHeight) {
            y = event.clientY - tooltipRect.height - margin;
        }
        
        // Set position
        elements.talentTooltip.style.left = `${Math.max(0, x)}px`;
        elements.talentTooltip.style.top = `${Math.max(0, y)}px`;
    }
    
    function hideTooltip() {
        // Use timer to avoid flicker when moving between nodes
        window.tooltipHideTimer = setTimeout(() => {
            elements.talentTooltip.classList.remove('visible');
            // Only reset tooltip ID if not controller selected (controller keeps tooltip open)
            if (!currentControllerElement || talentId !== currentControllerElement.dataset.talentId) {
                currentTooltipId = null;
            }
        }, 100);
    }

    // Helper function to get requirements text
    function getRequirementsText(talent) {
        if (!talent.parents || talent.parents.length === 0) {
            return "";
        }
        
        // Get parent names
        const parentNames = talent.parents.map(parentId => {
            const parent = talentDefinitions[parentId];
            return parent ? parent.name : 'Unknown';
        });
        
        // Format requirements text
        if (parentNames.length === 1) {
            return `Requires: ${parentNames[0]}`;
        } else if (parentNames.length === 2) {
            return `Requires: ${parentNames[0]} or ${parentNames[1]}`;
        } else {
            const lastParent = parentNames.pop();
            return `Requires: ${parentNames.join(', ')} or ${lastParent}`;
        }
    }

    // --- Map Interaction (Panning/Zooming) ---
    function setupCanvasInteraction() {
        const area = elements.talentTreeArea;
        const canvas = elements.talentTreeCanvas;
        
        // Panning
        area.addEventListener('mousedown', handlePanStart);
        area.addEventListener('mouseleave', handlePanEnd);
        area.addEventListener('mouseup', handlePanEnd);
        area.addEventListener('mousemove', handlePanMove);
        
        // Zooming with buttons
        elements.zoomIn.addEventListener('click', () => zoomCanvas(CONFIG.zoomStep));
        elements.zoomOut.addEventListener('click', () => zoomCanvas(-CONFIG.zoomStep));
        elements.resetView.addEventListener('click', resetView);
        
        // Zooming with wheel
        area.addEventListener('wheel', handleZoomWheel);
    }
    
    function handlePanStart(e) {
        // Only pan with left mouse button
        if (e.button !== 0) return;
        
        isPanning = true;
        startPoint = {
            x: e.pageX - elements.talentTreeArea.offsetLeft,
            y: e.pageY - elements.talentTreeArea.offsetTop
        };
        
        scrollPosition = {
            left: elements.talentTreeArea.scrollLeft,
            top: elements.talentTreeArea.scrollTop
        };
        
        elements.talentTreeArea.style.cursor = 'grabbing';
        elements.talentTreeArea.style.userSelect = 'none';
    }
    
    function handlePanEnd() {
        if (isPanning) {
            isPanning = false;
            elements.talentTreeArea.style.cursor = 'grab';
            elements.talentTreeArea.style.userSelect = '';
        }
    }
    
    function handlePanMove(e) {
        if (!isPanning) return;
        
        e.preventDefault();
        
        const x = e.pageX - elements.talentTreeArea.offsetLeft;
        const y = e.pageY - elements.talentTreeArea.offsetTop;
        
        const deltaX = x - startPoint.x;
        const deltaY = y - startPoint.y;
        
        elements.talentTreeArea.scrollLeft = scrollPosition.left - deltaX;
        elements.talentTreeArea.scrollTop = scrollPosition.top - deltaY;
    }
    
    function handleZoomWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -CONFIG.zoomStep : CONFIG.zoomStep;
        zoomCanvas(delta, e);
    }
    
    function zoomCanvas(delta, event) {
        // Calculate new scale
        const newScale = Math.max(
            CONFIG.minZoom, 
            Math.min(CONFIG.maxZoom, currentScale + delta)
        );
        
        if (newScale === currentScale) return;
        
        // If event provided, zoom toward mouse position
        if (event) {
            const rect = elements.talentTreeArea.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // Calculate point under mouse in content space
            const pointX = (elements.talentTreeArea.scrollLeft + mouseX) / currentScale;
            const pointY = (elements.talentTreeArea.scrollTop + mouseY) / currentScale;
            
            // Apply new scale
            currentScale = newScale;
            elements.talentTreeCanvas.style.transform = `scale(${currentScale})`;
            
            // Adjust scroll to keep pointed-at location under mouse
            elements.talentTreeArea.scrollLeft = pointX * currentScale - mouseX;
            elements.talentTreeArea.scrollTop = pointY * currentScale - mouseY;
        } else {
            // Center-based zoom if no event
            const viewportWidth = elements.talentTreeArea.clientWidth;
            const viewportHeight = elements.talentTreeArea.clientHeight;
            
            // Calculate center point in content space
            const centerX = (elements.talentTreeArea.scrollLeft + viewportWidth / 2) / currentScale;
            const centerY = (elements.talentTreeArea.scrollTop + viewportHeight / 2) / currentScale;
            
            // Apply new scale
            currentScale = newScale;
            elements.talentTreeCanvas.style.transform = `scale(${currentScale})`;
            
            // Adjust scroll to keep center point centered
            elements.talentTreeArea.scrollLeft = centerX * currentScale - viewportWidth / 2;
            elements.talentTreeArea.scrollTop = centerY * currentScale - viewportHeight / 2;
        }
    }
    
    function resetView() {
        currentScale = 1.0;
        elements.talentTreeCanvas.style.transform = `scale(${currentScale})`;
        centerTree();
    }
    
    function centerTree() {
        // Find a reasonable center point
        const viewportWidth = elements.talentTreeArea.clientWidth;
        const viewportHeight = elements.talentTreeArea.clientHeight;
        
        // Default center point
        let centerX = 300; // Default x-center if we can't calculate
        
        // Try to find actual center of talent nodes for horizontal centering
        if (Object.keys(nodeElements).length > 0) {
            let minX = Infinity, maxX = -Infinity;
            
            // Find bounding box of all nodes
            for (const nodeId in nodeElements) {
                const node = nodeElements[nodeId];
                const x = parseInt(node.style.left);
                
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x + CONFIG.nodeSize);
            }
            
            // Calculate horizontal center
            centerX = (minX + maxX) / 2;
        }
        
        // Center horizontally, but start scroll at the top vertically
        elements.talentTreeArea.scrollLeft = centerX * currentScale - (viewportWidth / 2);
        elements.talentTreeArea.scrollTop = 0; // Start at the top
    }

    // --- Utility Functions ---
    function showLoading(message, isError = false) {
        if (elements.loadingScreen && elements.loadingText) {
            elements.loadingText.textContent = message;
            elements.loadingText.style.color = isError ? 'var(--danger)' : 'var(--text-light)';
            elements.loadingScreen.style.opacity = '1';
            elements.loadingScreen.style.display = 'flex';
        }
    }

    function hideLoading() {
        if (elements.loadingScreen) {
            elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    function getTalentStatus(talentId) {
        const talent = talentDefinitions[talentId]; // Use talentDefinitions
        if (!talent) return 'locked';
        
        // Check if talent is already selected
        if (selectedTalents[talentId]) {
            return 'selected';
        }
        
        // Check if talent is a starting node (no parents)
        const isStartingNode = !talent.parents || talent.parents.length === 0 || talent.isRoot;
        
        // Check if at least one parent is selected
        const hasSelectedParent = talent.parents && 
            talent.parents.some(parentId => selectedTalents[parentId]);
        
        // If starting node or has selected parent, it's potentially available
        if (isStartingNode || hasSelectedParent) {
            // --- NEW: Check for powerful talent restriction ---
            if (talent.powerful) {
                // Check if another powerful talent is already selected
                const hasOtherPowerfulSelected = Object.keys(selectedTalents).some(selectedId => {
                    const otherTalent = talentDefinitions[selectedId];
                    return otherTalent && otherTalent.powerful && selectedId !== talentId;
                });

                if (hasOtherPowerfulSelected) {
                    return 'locked'; // Lock if another powerful talent is already selected
                }
            }
            // --- END NEW ---
            return 'available';
        }
        
        return 'locked';
    }

    function updateAllNodeStates() {
        if (!talentDefinitions) return; // Check talentDefinitions
        for (const talentId in talentDefinitions) { // Use talentDefinitions
            updateNodeState(talentId);
        }
    }

    function updateNodeState(talentId) {
        const node = nodeElements[talentId];
        if (!node) return;
        
        const talent = talentDefinitions[talentId]; // Use talentDefinitions
        if (!talent) return;
        
        // Get current status
        const status = getTalentStatus(talentId);
        
        // Update node class
        node.classList.remove('locked', 'available', 'selected');
        node.classList.add(status);
        
        // Update rank display for multi-rank talents
        if (talent.maxRank && talent.maxRank > 1) {
            const rankElement = node.querySelector('.talent-rank');
            if (rankElement) {
                const currentRank = typeof selectedTalents[talentId] === 'number' 
                    ? selectedTalents[talentId] 
                    : (selectedTalents[talentId] ? 1 : 0);
                
                rankElement.textContent = currentRank;
                
                // Update color based on rank
                if (currentRank > 0) {
                    const colorIndex = Math.min(currentRank, CONFIG.rankColors.length - 1);
                    rankElement.style.color = CONFIG.rankColors[colorIndex];
                } else {
                    rankElement.style.color = '';
                }
            }
        }
        
        // Update connectors from parents to this talent
        if (talent.parents) {
            talent.parents.forEach(parentId => {
                updateConnectorState(parentId, talentId);
            });
        }
        
        // Update connectors from this talent to its children
        if (talent.children) {
            talent.children.forEach(childId => {
                updateConnectorState(talentId, childId);
            });
        }
    }
    
    function updateConnectorState(parentId, childId) {
        const connectorId = `connector-${parentId}-${childId}`;
        const connector = connectorElements[connectorId];
        if (!connector) return;
        
        // Remove all state classes
        connector.classList.remove('available', 'selected');
        
        // If parent is selected, connector is at least available
        if (selectedTalents[parentId]) {
            connector.classList.add('available');
            
            // If child is also selected, connector is selected
            if (selectedTalents[childId]) {
                connector.classList.add('selected');
            }
        }
    }

    // --- UI Effects & Animations ---
    function animateTreeReveal() {
        // Animate talents appearing
        let delay = 0;
        const increment = 50; // ms between animations
        
        for (const tier in getNodesByTier()) {
            const nodesInTier = getNodesByTier()[tier];
            
            nodesInTier.forEach(nodeId => {
                const node = nodeElements[nodeId];
                if (!node) return;
                
                // Set initial state
                node.style.opacity = '0';
                node.style.transform = 'scale(0.5)';
                
                // Animate after delay
                setTimeout(() => {
                    node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    node.style.opacity = '1';
                    node.style.transform = 'scale(1)';
                }, delay);
                
                delay += increment;
            });
            
            // Add extra delay between tiers
            delay += increment * 2;
        }
        
        // Animate connectors after nodes
        setTimeout(() => {
            for (const connectorId in connectorElements) {
                const connector = connectorElements[connectorId];
                connector.style.opacity = '0';
                connector.style.transition = 'opacity 1s ease';
                
                setTimeout(() => {
                    connector.style.opacity = '1';
                }, Math.random() * 500); // Stagger connector appearance
            }
        }, delay);
    }
    
    function getNodesByTier() {
        // Group nodes by their tier
        const tiers = {};
        
        for (const talentId in talentDefinitions) { // Use talentDefinitions
            const talent = talentDefinitions[talentId]; // Use talentDefinitions
            if (!talent) continue;
            
            // Determine tier based on parents/children
            let tier = 0;
            
            if (talent.tier !== undefined) {
                // Use explicit tier if provided
                tier = talent.tier;
            } else if (!talent.parents || talent.parents.length === 0) {
                // Root nodes are tier 0
                tier = 0;
            } else {
                // Calculate tier based on parent tiers
                const parentTiers = talent.parents
                    .map(parentId => talentDefinitions[parentId]?.tier || 0) // Use talentDefinitions
                    .filter(t => t !== undefined);
                
                tier = parentTiers.length ? Math.max(...parentTiers) + 1 : 1;
            }
            
            // Add to tier group
            if (!tiers[tier]) tiers[tier] = [];
            tiers[tier].push(talentId);
        }
        
        return tiers;
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        if (!document.getElementById('talent-notification')) {
            const notification = document.createElement('div');
            notification.id = 'talent-notification';
            notification.className = 'talent-notification';
            document.body.appendChild(notification);
            
            // Add notification styles if not already in CSS
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    .talent-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        padding: 15px 25px;
                        background: rgba(20, 30, 45, 0.9);
                        border-left: 4px solid #8564d2;
                        border-radius: 4px;
                        color: white;
                        font-weight: 600;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                        z-index: 9999;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: opacity 0.3s ease, transform 0.3s ease;
                        backdrop-filter: blur(5px);
                    }
                    .talent-notification.info { border-color: #29b6f6; }
                    .talent-notification.success { border-color: #43a047; }
                    .talent-notification.warning { border-color: #ffb74d; }
                    .talent-notification.error { border-color: #e53935; }
                    .talent-notification.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        const notification = document.getElementById('talent-notification');
        notification.textContent = message;
        notification.className = `talent-notification ${type}`;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Hide after delay
        clearTimeout(window.notificationTimer);
        window.notificationTimer = setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
    
    function showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'talent-error-message';
        errorElement.innerHTML = `
            <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="error-text">${message}</div>
        `;
        elements.talentTreeCanvas.appendChild(errorElement);
        
        // Add error message styles if not in CSS
        if (!document.getElementById('error-message-styles')) {
            const style = document.createElement('style');
            style.id = 'error-message-styles';
            style.textContent = `
                .talent-error-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(20, 30, 45, 0.9);
                    border: 1px solid #e53935;
                    border-radius: 8px;
                    padding: 20px;
                    color: white;
                    text-align: center;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    max-width: 400px;
                    backdrop-filter: blur(5px);
                }
                .error-icon {
                    color: #e53935;
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .error-text {
                    font-size: 16px;
                    line-height: 1.5;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // --- Controller Support Functions ---

    function createControllerCursor() {
        if (!controllerCursor) {
            controllerCursor = document.createElement('div');
            controllerCursor.className = 'controller-cursor talents-cursor'; // Add specific class
            document.body.appendChild(controllerCursor);
        }
        controllerCursor.style.display = 'none'; // Start hidden
    }

    function removeControllerCursor() {
        if (controllerCursor && controllerCursor.parentNode) {
            controllerCursor.parentNode.removeChild(controllerCursor);
            controllerCursor = null;
        }
    }

    function positionControllerCursor(element) {
        if (!controllerCursor || !element || !isControllerMode) return;

        const rect = element.getBoundingClientRect();
        // Position cursor slightly offset or centered, adjust as needed
        controllerCursor.style.left = `${rect.left + window.scrollX - 5}px`; // Offset example
        controllerCursor.style.top = `${rect.top + window.scrollY - 5}px`;
        controllerCursor.style.width = `${rect.width + 10}px`;
        controllerCursor.style.height = `${rect.height + 10}px`;
        controllerCursor.style.display = 'block';

        // Also update tooltip for the selected element
        if (element.classList.contains('talent-node')) {
            // Simulate a mouse event at the element's center for the tooltip
            const fakeEvent = {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            };
            showTooltip(fakeEvent, element.dataset.talentId);
        } else {
            hideTooltip(); // Hide tooltip if not a talent node
        }
    }

    function selectControllerElement(element) {
        if (!element) return;

        if (currentControllerElement) {
            currentControllerElement.classList.remove('controller-selected');
        }
        currentControllerElement = element;
        currentControllerElement.classList.add('controller-selected');
        currentControllerElement.focus(); // Optional: improve accessibility
        positionControllerCursor(currentControllerElement);
        currentControllerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    function deselectControllerElement() {
        if (currentControllerElement) {
            currentControllerElement.classList.remove('controller-selected');
            hideTooltip(); // Hide tooltip when deselecting
            currentControllerElement = null;
        }
        if (controllerCursor) {
            controllerCursor.style.display = 'none';
        }
    }

    function setupControllerListeners() {
        if (!controllerManager) return;

        // Listen for controller connection/disconnection if manager provides events
        // Or periodically check controllerManager.isControllerMode

        // Use a simpler interval check for activation/deactivation
        setInterval(() => {
            if (controllerManager && controllerManager.isControllerMode && !isControllerMode) {
                activateControllerModeTalents();
            }
        }, 500);

        // Listen for user interaction that disables controller mode
        window.addEventListener('mousemove', () => { if (isControllerMode) deactivateControllerModeTalents(); });
        window.addEventListener('click', () => { if (isControllerMode) deactivateControllerModeTalents(); });
        window.addEventListener('keydown', (e) => {
            // Ignore gamepad keys triggering keydown
            if (!e.code || !e.code.startsWith('Gamepad')) {
                if (isControllerMode) deactivateControllerModeTalents();
            }
        });
    }

    function activateControllerModeTalents() {
        if (isControllerMode || !controllerManager) return; // Also check if controllerManager exists
        console.log("[Talents] Activating Controller Mode");
        isControllerMode = true;
        document.body.classList.add('controller-mode-talents'); // Specific body class
        startControllerUpdates();
        // Select initial element if none selected
        if (!currentControllerElement && navGroups[currentNavSection]?.length > 0) {
            selectControllerElement(navGroups[currentNavSection][0]);
        } else if (currentControllerElement) {
            // Re-select and position cursor
            selectControllerElement(currentControllerElement);
        }
    }

    function deactivateControllerModeTalents() {
        if (!isControllerMode || !controllerManager) return; // Also check if controllerManager exists
        console.log("[Talents] Deactivating Controller Mode");
        isControllerMode = false;
        document.body.classList.remove('controller-mode-talents');
        stopControllerUpdates();
        deselectControllerElement();
    }

    function startControllerUpdates() {
        if (!controllerUpdateInterval && controllerManager) {
            console.log("[Talents] Starting controller update loop.");
            controllerUpdateInterval = setInterval(pollControllerInput, 50); // Poll ~20 times/sec
        }
    }

    function stopControllerUpdates() {
        if (controllerUpdateInterval) {
            console.log("[Talents] Stopping controller update loop.");
            clearInterval(controllerUpdateInterval);
            controllerUpdateInterval = null;
        }
    }

    function checkCooldown(action) {
        const now = Date.now();
        if (now < controllerCooldowns[action]) {
            return false; // Still in cooldown
        }
        controllerCooldowns[action] = now + COOLDOWN_TIMES[action];
        return true; // Cooldown passed
    }

    function pollControllerInput() {
        if (!isControllerMode || !controllerManager) {
            stopControllerUpdates(); // Stop if mode disabled or manager lost
            return;
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const primaryGamepad = Object.values(gamepads).find(gp => gp && gp.connected);

        if (!primaryGamepad) {
            // Optional: Deactivate if controller disconnects?
            // deactivateControllerModeTalents();
            return;
        }

        let inputDetected = false;
        const now = Date.now();

        // --- Panning (Right Stick) ---
        const rightStickX = primaryGamepad.axes[2];
        const rightStickY = primaryGamepad.axes[3];
        const panDeadzone = 0.25;
        if (Math.abs(rightStickX) > panDeadzone || Math.abs(rightStickY) > panDeadzone) {
            inputDetected = true;
            if (now > controllerCooldowns.pan) { // Use a simple time check for panning
                const panSpeed = 15;
                elements.talentTreeArea.scrollLeft += rightStickX * panSpeed;
                elements.talentTreeArea.scrollTop += rightStickY * panSpeed;
                controllerCooldowns.pan = now + COOLDOWN_TIMES.pan; // Apply cooldown
            }
        }

        // --- Zooming (LT/RT) ---
        const leftTrigger = primaryGamepad.buttons[6];
        const rightTrigger = primaryGamepad.buttons[7];
        if (leftTrigger?.pressed || rightTrigger?.pressed) {
            inputDetected = true;
            if (checkCooldown('zoom')) {
                if (leftTrigger.pressed) zoomCanvas(-CONFIG.zoomStep); // Zoom Out
                if (rightTrigger.pressed) zoomCanvas(CONFIG.zoomStep);  // Zoom In
            }
        }

        // --- Navigation (D-Pad/Left Stick) ---
        const leftStickX = primaryGamepad.axes[0];
        const leftStickY = primaryGamepad.axes[1];
        const navDeadzone = 0.5;
        let navDirection = null;

        if (primaryGamepad.buttons[14]?.pressed || leftStickX < -navDeadzone) navDirection = 'left';
        else if (primaryGamepad.buttons[15]?.pressed || leftStickX > navDeadzone) navDirection = 'right';
        else if (primaryGamepad.buttons[12]?.pressed || leftStickY < -navDeadzone) navDirection = 'up';
        else if (primaryGamepad.buttons[13]?.pressed || leftStickY > navDeadzone) navDirection = 'down';

        if (navDirection) {
            inputDetected = true;
            if (checkCooldown('navigation')) {
                navigate(navDirection);
            }
        }

        // --- Action Buttons ---
        const buttonMap = controllerManager.buttonMap || {}; // Use manager's map if available
        const pressedButtons = primaryGamepad.buttons
            .map((button, index) => ({ button, index }))
            .filter(item => item.button.pressed)
            .map(item => buttonMap[item.index] || `Button${item.index}`);

        if (pressedButtons.length > 0) {
            inputDetected = true;
            handleActionButtons(pressedButtons);
        }

        if (inputDetected) {
            lastInputTime = now;
        }
    }

    function handleActionButtons(pressedButtons) {
        if (!checkCooldown('action')) return;

        // Handle one action per cooldown period
        const action = pressedButtons[0]; // Prioritize first detected button

        switch (action) {
            case 'A': // Confirm/Select
                if (currentControllerElement) {
                    currentControllerElement.click(); // Simulate click
                }
                break;
            case 'B': // Back/Cancel
                elements.backButton.click();
                break;
            case 'Start': // Save
                elements.saveButton.click();
                break;
            case 'Back': // Reset
                elements.resetButton.click();
                break;
            case 'LB': // Switch Group Left
                switchNavGroup(-1);
                break;
            case 'RB': // Switch Group Right
                switchNavGroup(1);
                break;
            // Add X, Y if needed for future actions
        }
    }

    function switchNavGroup(direction) {
        if (!checkCooldown('switchGroup')) return;

        const currentGroupIndex = navGroupOrder.indexOf(currentNavSection);
        let nextGroupIndex = (currentGroupIndex + direction + navGroupOrder.length) % navGroupOrder.length;

        // Ensure the next group has navigable elements
        let attempts = 0;
        while (navGroups[navGroupOrder[nextGroupIndex]].length === 0 && attempts < navGroupOrder.length) {
            nextGroupIndex = (nextGroupIndex + direction + navGroupOrder.length) % navGroupOrder.length;
            attempts++;
        }

        if (navGroups[navGroupOrder[nextGroupIndex]].length > 0) {
            currentNavSection = navGroupOrder[nextGroupIndex];
            // Select the first element in the new group
            selectControllerElement(navGroups[currentNavSection][0]);
        } else {
            console.warn("Could not find a navigable group.");
        }
    }

    function populateNavGroups() {
        navGroups['header'] = Array.from(elements.talentControls.querySelectorAll('[data-controller-nav][data-nav-group="header"]'));
        navGroups['map'] = Array.from(elements.talentTreeArea.querySelector('.map-controls').querySelectorAll('[data-controller-nav][data-nav-group="map"]'));
        navGroups['talent-grid'] = Array.from(elements.talentTreeCanvas.querySelectorAll('.talent-node'));
        console.log("Populated Nav Groups:", navGroups);
    }

    function navigate(direction) {
        if (!currentControllerElement) {
            // If nothing selected, select the first element in the current group
            if (navGroups[currentNavSection]?.length > 0) {
                selectControllerElement(navGroups[currentNavSection][0]);
            }
            return;
        }

        const currentGroup = navGroups[currentNavSection];
        if (!currentGroup || currentGroup.length === 0) return;

        let nextElement = null;

        if (currentNavSection === 'talent-grid') {
            nextElement = findNearestTalentNode(direction);
        } else {
            // Simple list navigation for header/map buttons
            const currentIndex = currentGroup.indexOf(currentControllerElement);
            if (currentIndex === -1) {
                nextElement = currentGroup[0]; // Default to first if current not found
            } else {
                if (direction === 'right' || direction === 'down') {
                    nextElement = currentGroup[(currentIndex + 1) % currentGroup.length];
                } else if (direction === 'left' || direction === 'up') {
                    nextElement = currentGroup[(currentIndex - 1 + currentGroup.length) % currentGroup.length];
                }
            }
        }

        if (nextElement) {
            selectControllerElement(nextElement);
        }
    }

    function findNearestTalentNode(direction) {
        if (!currentControllerElement || currentNavSection !== 'talent-grid') return null;

        const nodes = navGroups['talent-grid'];
        if (nodes.length <= 1) return null;

        const currentRect = currentControllerElement.getBoundingClientRect();
        const currentCenter = {
            x: currentRect.left + currentRect.width / 2,
            y: currentRect.top + currentRect.height / 2
        };

        let bestCandidate = null;
        let minDistance = Infinity;

        nodes.forEach(node => {
            if (node === currentControllerElement) return; // Skip self

            const nodeRect = node.getBoundingClientRect();
            const nodeCenter = {
                x: nodeRect.left + nodeRect.width / 2,
                y: nodeRect.top + nodeRect.height / 2
            };

            const dx = nodeCenter.x - currentCenter.x;
            const dy = nodeCenter.y - currentCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            let angleMatches = false;
            const angleTolerance = Math.PI / 3; // Allow some variance (e.g., 60 degrees)

            switch (direction) {
                case 'right': angleMatches = Math.abs(angle) < angleTolerance; break;
                case 'left': angleMatches = Math.abs(angle - Math.PI) < angleTolerance || Math.abs(angle + Math.PI) < angleTolerance; break;
                case 'down': angleMatches = Math.abs(angle - Math.PI / 2) < angleTolerance; break;
                case 'up': angleMatches = Math.abs(angle + Math.PI / 2) < angleTolerance; break;
            }

            // Prioritize nodes in the correct direction, then by distance
            if (angleMatches) {
                // Weight distance more heavily for nodes directly in line
                let effectiveDistance = distance;
                // Add a penalty for perpendicular distance to prioritize nodes more 'in line'
                if (direction === 'left' || direction === 'right') {
                    effectiveDistance += Math.abs(dy) * 2; // Penalize vertical offset
                } else {
                    effectiveDistance += Math.abs(dx) * 2; // Penalize horizontal offset
                }

                if (effectiveDistance < minDistance) {
                    minDistance = effectiveDistance;
                    bestCandidate = node;
                }
            }
        });

        return bestCandidate;
    }

    // --- End Controller Support Functions ---

    // --- Start Initialization ---
    initialize().catch(error => {
        console.error("Talent Screen Initialization failed:", error);
        showLoading("Error initializing talents. Please refresh.", true);
    });
}); 