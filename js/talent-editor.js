// Talent Editor Script
// Author: o3-generated for Fishb0nes98
// Provides a smooth drag-and-drop UI for repositioning talent nodes

(function () {
    const DEFAULT_TALENT_PATH = 'js/raid-game/talents/schoolboy_siegfried_talents.json';

    const fileInput = document.getElementById('talent-file-input');
    const loadBtn = document.getElementById('load-default-btn');
    const saveBtn = document.getElementById('save-talents-btn');
    const container = document.getElementById('talent-container');
    const canvas = document.getElementById('talent-canvas');
    const selectEl = document.getElementById('talent-file-select');

    // Match main talents system configuration exactly
    const CONFIG = {
        nodeSize: 64,                 // Match --talent-node-size from CSS
        treePadding: 100,             // Padding around the tree
        horizontalSpacing: 180,       // Space between tier columns
        verticalSpacing: 120,         // Space between nodes in same tier
        snapGrid: 10                  // Snap to grid for easier alignment
    };

    /** @type {any} */
    let talentData = null;
    let loadedFileName = '';
    /** @type {Record<string, HTMLElement>} */
    const nodeElements = {};
    
    // Dragging state
    let dragState = {
        isDragging: false,
        dragNode: null,
        dragTalent: null,
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
        constrainAxis: null,
        dragPreview: null
    };

    /* --------------------------------------------------------------------- */
    /*  Helper functions                                                     */
    /* --------------------------------------------------------------------- */

    function clearContainer() {
        canvas.innerHTML = '';
        Object.keys(nodeElements).forEach((k) => delete nodeElements[k]);
    }

    function px(value) {
        return `${value}px`;
    }

    function snapToGrid(value) {
        return Math.round(value / CONFIG.snapGrid) * CONFIG.snapGrid;
    }

    function renderTalentTree(data) {
        clearContainer();
        if (!data || !data.talentTree) {
            console.warn('Invalid talent data');
            return;
        }
        const talents = data.talentTree;
        
        // Calculate positions using the same logic as talents.js
        const positions = calculateTalentPositions(talents);
        
        // Create nodes first
        Object.values(talents).forEach((talent) => {
            const pos = positions[talent.id] || talent.position || { x: 100, y: 100 };
            createTalentNode(talent, pos.x, pos.y);
        });

        // Then draw connections
        drawConnections();
    }

    function calculateTalentPositions(talents) {
        const positions = {};
        const tiers = {};
        
        // Group talents by tier
        for (const talentId in talents) {
            const talent = talents[talentId];
            let tier = talent.tier || 0;
            
            // Calculate tier based on parents if not explicitly set
            if (!talent.tier && talent.parents && talent.parents.length > 0) {
                const parentTiers = talent.parents
                    .map(parentId => talents[parentId]?.tier || 0)
                    .filter(t => t !== undefined);
                tier = parentTiers.length ? Math.max(...parentTiers) + 1 : 1;
            }
            
            if (!tiers[tier]) tiers[tier] = [];
            tiers[tier].push(talentId);
        }
        
        // Position each talent
        for (let tier in tiers) {
            const talentsInTier = tiers[tier];
            
            talentsInTier.forEach((talentId, index) => {
                const talent = talents[talentId];
                
                // Use custom position if available, otherwise calculate
                if (talent.position) {
                    positions[talentId] = { ...talent.position };
                } else {
                    const x = CONFIG.treePadding + (parseInt(tier) * CONFIG.horizontalSpacing);
                    const y = CONFIG.treePadding + 200 + (index * CONFIG.verticalSpacing);
                    positions[talentId] = { x, y };
                }
            });
        }
        
        return positions;
    }

    function createTalentNode(talent, x, y) {
        // Create main node element - match talents.js structure exactly
        const node = document.createElement('div');
        node.id = `talent-${talent.id}`;
        node.className = 'talent-node';
        node.dataset.talentId = talent.id;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        // Add tier attribute for styling
        if (talent.tier) {
            node.dataset.tier = talent.tier;
        }
        
        // Check if this is a powerful talent
        const isPowerful = talent.powerful === true;
        
        if (isPowerful) {
            node.dataset.powerful = "true";
            node.classList.add('powerful');
            
            // Create power particles container - match talents.js
            const powerParticles = document.createElement('div');
            powerParticles.className = 'power-particles';
            
            // Add particle elements
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('span');
                powerParticles.appendChild(particle);
            }
            
            // Create powerful badge
            const powerfulBadge = document.createElement('div');
            powerfulBadge.className = 'powerful-badge';
            powerfulBadge.textContent = 'POWERFUL';
            
            // Append particles and badge
            node.appendChild(powerParticles);
            node.appendChild(powerfulBadge);
        }
        
        // Create icon
        const icon = document.createElement('img');
        icon.className = 'talent-icon';
        icon.src = talent.icon || 'Icons/default-icon.jpg';
        icon.alt = talent.name;
        icon.draggable = false; // Prevent image dragging
        
        // Create name label
        const label = document.createElement('span');
        label.textContent = talent.name;
        
        // Add elements to node
        node.appendChild(icon);
        node.appendChild(label);
        
        // Add to canvas
        canvas.appendChild(node);
        nodeElements[talent.id] = node;
        
        // Make draggable with improved system
        makeDraggable(node, talent);
    }

    function makeDraggable(node, talent) {
        // Mouse events
        node.addEventListener('mousedown', (e) => startDrag(e, node, talent));
        
        // Touch events for mobile
        node.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startDrag(touch, node, talent);
        });
        
        // Prevent context menu
        node.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    function startDrag(e, node, talent) {
        // Don't start drag on span labels
        if (e.target.tagName === 'SPAN') return;
        
        dragState.isDragging = true;
        dragState.dragNode = node;
        dragState.dragTalent = talent;
        dragState.constrainAxis = null;
        
        // Calculate initial positions
        const rect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        dragState.startPos = {
            x: parseInt(node.style.left, 10) || 0,
            y: parseInt(node.style.top, 10) || 0
        };
        
        dragState.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Visual feedback
        node.style.zIndex = '9999';
        node.style.transform = 'scale(1.1)';
        node.style.boxShadow = '0 10px 30px rgba(133, 100, 210, 0.6)';
        container.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        // Create drag preview with coordinates
        createDragPreview();
        
        // Bind global mouse/touch events
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', endDrag);
        
        // Prevent default behavior
        e.preventDefault();
    }

    function handleDragMove(e) {
        if (!dragState.isDragging) return;
        updateDragPosition(e.clientX, e.clientY, e.shiftKey);
    }

    function handleTouchMove(e) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateDragPosition(touch.clientX, touch.clientY, false);
    }

    function updateDragPosition(clientX, clientY, shiftKey) {
        const containerRect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        
        // Calculate new position relative to canvas
        let newX = clientX - containerRect.left + scrollLeft - dragState.offset.x;
        let newY = clientY - containerRect.top + scrollTop - dragState.offset.y;
        
        // Handle axis constraints with Shift key
        if (shiftKey) {
            if (!dragState.constrainAxis) {
                const deltaX = Math.abs(newX - dragState.startPos.x);
                const deltaY = Math.abs(newY - dragState.startPos.y);
                dragState.constrainAxis = deltaX > deltaY ? 'x' : 'y';
            }
            
            if (dragState.constrainAxis === 'x') {
                newY = dragState.startPos.y;
            } else {
                newX = dragState.startPos.x;
            }
        } else {
            dragState.constrainAxis = null;
        }
        
        // Snap to grid for easier alignment
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        
        // Clamp to canvas bounds
        newX = Math.max(0, Math.min(canvas.offsetWidth - CONFIG.nodeSize, newX));
        newY = Math.max(0, Math.min(canvas.offsetHeight - CONFIG.nodeSize, newY));
        
        // Update node position
        dragState.dragNode.style.left = `${newX}px`;
        dragState.dragNode.style.top = `${newY}px`;
        
        // Update connections
        updateLinesForNode(dragState.dragNode);
        
        // Update drag preview
        updateDragPreview(newX, newY);
    }

    function endDrag() {
        if (!dragState.isDragging) return;
        
        // Clean up visual feedback
        dragState.dragNode.style.zIndex = '';
        dragState.dragNode.style.transform = '';
        dragState.dragNode.style.boxShadow = '';
        container.style.cursor = 'grab';
        document.body.style.userSelect = '';
        
        // Remove drag preview
        removeDragPreview();
        
        // Save position to data
        persistNodePosition(dragState.dragNode, dragState.dragTalent);
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', endDrag);
        
        // Reset drag state
        dragState.isDragging = false;
        dragState.dragNode = null;
        dragState.dragTalent = null;
        dragState.constrainAxis = null;
    }

    function createDragPreview() {
        dragState.dragPreview = document.createElement('div');
        dragState.dragPreview.className = 'drag-preview';
        dragState.dragPreview.style.cssText = `
            position: absolute;
            background: rgba(133, 100, 210, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(5px);
        `;
        document.body.appendChild(dragState.dragPreview);
    }

    function updateDragPreview(x, y) {
        if (!dragState.dragPreview) return;
        
        dragState.dragPreview.textContent = `${dragState.dragTalent.name} (${x}, ${y})`;
        
        // Position preview near cursor
        const rect = container.getBoundingClientRect();
        dragState.dragPreview.style.left = `${rect.left + 20}px`;
        dragState.dragPreview.style.top = `${rect.top - 40}px`;
    }

    function removeDragPreview() {
        if (dragState.dragPreview) {
            dragState.dragPreview.remove();
            dragState.dragPreview = null;
        }
    }

    function persistNodePosition(node, talentRef) {
        const left = parseInt(node.style.left, 10) || 0;
        const top = parseInt(node.style.top, 10) || 0;
        talentRef.position = {
            x: left,
            y: top
        };
        console.info(`Updated ${talentRef.name} => x:${left}, y:${top}`);
        showTemporaryStatus(`Updated: ${talentRef.name} (${left}, ${top})`);
    }

    function showTemporaryStatus(message) {
        let status = document.getElementById('drag-status');
        if (!status) {
            status = document.createElement('div');
            status.id = 'drag-status';
            status.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(67, 160, 71, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(status);
        }
        
        status.textContent = message;
        status.style.opacity = '1';
        
        clearTimeout(status.timer);
        status.timer = setTimeout(() => {
            status.style.opacity = '0';
        }, 2000);
    }

    /* --------------------------------------------------------------------- */
    /*  File loading / saving                                                */
    /* --------------------------------------------------------------------- */

    async function loadTalentFile(url, fileNameOverride = '') {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            talentData = json;
            loadedFileName = fileNameOverride || url.split('/').pop();
            renderTalentTree(json);
            console.log(`Loaded talent data from ${url}`);
            showTemporaryStatus(`Loaded: ${loadedFileName}`);
        } catch (err) {
            alert(`Failed to load talent file: ${err.message}`);
            console.error(err);
        }
    }

    function handleLocalFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                talentData = JSON.parse(e.target.result);
                loadedFileName = file.name.endsWith('.json') ? file.name : `${file.name}.json`;
                renderTalentTree(talentData);
                showTemporaryStatus(`Loaded: ${loadedFileName}`);
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }

    async function saveTalentJSON() {
        if (!talentData) {
            alert('No talent data in memory');
            return;
        }

        // Determine file to save
        let fileName = selectEl.value || loadedFileName;
        if (!fileName) {
            fileName = prompt('Enter a file name (e.g., my_character_talents.json):');
            if (!fileName) return;
        }

        try {
            const res = await fetch('/save-talents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, content: talentData })
            });
            if (!res.ok) throw new Error(await res.text());
            showTemporaryStatus(`Saved: ${fileName}`);
        } catch (err) {
            console.warn('Server save failed, downloading file locally instead.', err);
            downloadLocal(fileName);
        }
    }

    function downloadLocal(fileName) {
        const jsonStr = JSON.stringify(talentData, null, 4);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showTemporaryStatus(`Downloaded: ${fileName}`);
    }

    /* --------------------------------------------------------------------- */
    /*  Connections drawing                                                  */
    /* --------------------------------------------------------------------- */

    let svgLayer = null;

    function ensureSvgLayer() {
        if (!svgLayer) {
            svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgLayer.setAttribute('id', 'connection-layer');
            svgLayer.style.position = 'absolute';
            svgLayer.style.top = '0';
            svgLayer.style.left = '0';
            svgLayer.style.width = '3000px';
            svgLayer.style.height = '2000px';
            svgLayer.style.pointerEvents = 'none';
            svgLayer.style.zIndex = '1';
            canvas.appendChild(svgLayer);
        }
    }

    function clearConnections() {
        ensureSvgLayer();
        while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);
    }

    const edgeElements = {}; // key = source|target

    function drawConnections() {
        if (!talentData || !talentData.talentTree) return;
        const talents = talentData.talentTree;
        clearConnections();
        
        Object.values(talents).forEach((talent) => {
            if (!talent.children) return;
            talent.children.forEach((childId) => {
                const key = `${talent.id}|${childId}`;
                const srcNode = nodeElements[talent.id];
                const tgtNode = nodeElements[childId];
                if (!srcNode || !tgtNode) return;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('stroke', 'var(--connector-locked)');
                line.setAttribute('stroke-width', '5');
                line.setAttribute('stroke-linecap', 'round');
                line.style.transition = 'all 0.2s ease';
                
                svgLayer.appendChild(line);
                edgeElements[key] = line;
                updateLinePosition(key);
            });
        });
    }

    function updateLinePosition(key) {
        const [srcId, tgtId] = key.split('|');
        const src = nodeElements[srcId];
        const tgt = nodeElements[tgtId];
        if (!(src && tgt && edgeElements[key])) return;
        
        // Calculate center positions
        const srcLeft = parseInt(src.style.left, 10) || 0;
        const srcTop = parseInt(src.style.top, 10) || 0;
        const tgtLeft = parseInt(tgt.style.left, 10) || 0;
        const tgtTop = parseInt(tgt.style.top, 10) || 0;
        
        const x1 = srcLeft + CONFIG.nodeSize / 2;
        const y1 = srcTop + CONFIG.nodeSize / 2;
        const x2 = tgtLeft + CONFIG.nodeSize / 2;
        const y2 = tgtTop + CONFIG.nodeSize / 2;
        
        const line = edgeElements[key];
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
    }

    function updateLinesForNode(node) {
        const id = node.dataset.talentId;
        if (!id) return;
        Object.keys(edgeElements).forEach((key) => {
            const [src, tgt] = key.split('|');
            if (src === id || tgt === id) {
                updateLinePosition(key);
            }
        });
    }

    /* --------------------------------------------------------------------- */
    /*  Event bindings                                                       */
    /* --------------------------------------------------------------------- */

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleLocalFile(e.target.files[0]);
        }
    });

    loadBtn.addEventListener('click', () => {
        if (selectEl.value) {
            loadTalentFile('js/raid-game/talents/' + selectEl.value, selectEl.value);
        } else {
            alert('Select a talent file first');
        }
    });

    saveBtn.addEventListener('click', () => {
        saveTalentJSON();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveTalentJSON();
        }
    });

    /* --------------------------------------------------------------------- */
    /*  Fetch list of talent files                                           */
    /* --------------------------------------------------------------------- */

    async function fetchTalentList() {
        try {
            const res = await fetch('talents-list');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list = await res.json();
            // Populate select
            list.forEach((file) => {
                const opt = document.createElement('option');
                opt.value = file;
                opt.textContent = file;
                selectEl.appendChild(opt);
            });
            // Optionally preselect Siegfried
            const defaultFile = 'schoolboy_siegfried_talents.json';
            if (list.includes(defaultFile)) {
                selectEl.value = defaultFile;
            }
        } catch (err) {
            console.warn('Could not retrieve talent list. The endpoint may be unavailable. You can still load files manually.', err);
        }
    }

    // Initialize
    fetchTalentList();
})(); 