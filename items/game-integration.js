/**
 * Game Integration
 * Integrates the item and inventory system with the Easter Egg Hunt game
 */

import { initItemSystem, updateItemSystem, renderItemSystem, IceDagger, IceFlask, IceShard } from './index.js';

// Wait for the window to load
window.addEventListener('load', () => {
    // Wait for the game to initialize
    const checkGameInit = setInterval(() => {
        // Check if the game object exists and has initialized
        if (window.gameStarted && window.players && window.currentUser) {
            clearInterval(checkGameInit);
            
            // Modify game loop functions to include our inventory system
            integrateWithGameLoop();
            
            console.log('Item system integrated with game');
        }
    }, 500);
});

// Integrate inventory system with game loop
function integrateWithGameLoop() {
    // Create a game reference object that our inventory system can use
    const gameRef = {
        players: window.players,
        currentUser: window.currentUser,
        database: window.database,
        currentLobbyId: window.currentLobbyId,
        isNewLobby: window.isNewLobby,
        ctx: window.ctx,
        canvas: window.canvas,
        camera: window.camera,
        gameStarted: window.gameStarted,
        // Add map size and collision function
        MAP_WIDTH: window.MAP_WIDTH,
        MAP_HEIGHT: window.MAP_HEIGHT,
        checkCollision: window.checkCollision,
        walls: window.walls,
        environmentElements: window.environmentElements,
        effects: window.effects,
        showAnnouncement: window.showAnnouncement
    };
    
    // Initialize our inventory system
    initItemSystem(gameRef);
    
    // Store original update and render functions
    const originalUpdate = window.update;
    const originalRender = window.render;
    
    // Replace the update function with our extended version
    window.update = function() {
        // Call original update function
        if (originalUpdate) {
            originalUpdate.call(window);
        }
        
        // Update gameRef with latest values
        gameRef.players = window.players;
        gameRef.walls = window.walls;
        gameRef.environmentElements = window.environmentElements;
        gameRef.effects = window.effects;
        
        // Update our inventory system
        updateItemSystem(gameRef);
    };
    
    // Replace the render function with our extended version
    window.render = function() {
        // Call original render function
        if (originalRender) {
            originalRender.call(window);
        }
        
        // Render our inventory system
        renderItemSystem(gameRef);
    };
    
    // Replace pickup collection to remove health/shield pickups
    replacePickupSystem();
    
    // Add powerup functionality to combat
    enhanceCombatSystem();
    
    // Force an initial potion spawn
    if (gameRef.potionSpawner) {
        setTimeout(() => {
            gameRef.potionSpawner.lastSpawnTime = 0;
            gameRef.potionSpawner.update(Date.now(), gameRef.isNewLobby);
            console.log('Initial potions spawned');
        }, 5000); // Wait 5 seconds for game to fully init
    }
}

// Replace the pickup system to remove health/shield pickups
function replacePickupSystem() {
    // Make sure pickups array is accessible
    if (typeof window.pickups !== 'undefined') {
        // Remove health and shield pickups
        window.pickups = window.pickups.filter(pickup => {
            return pickup.type !== 'health' && pickup.type !== 'shield';
        });
        
        // Save to Firebase if we're the host
        if (window.isNewLobby && window.database && window.currentLobbyId) {
            const ref = window.database.ref(
                `easterEggHunt/lobbies/${window.currentLobbyId}/pickups`
            );
            ref.set(window.pickups);
        }
        
        console.log('Removed health and shield pickups');
    }
}

// Enhance combat system with damage multiplier
function enhanceCombatSystem() {
    // If handleCombat function exists, we'll replace it
    if (typeof window.handleCombat === 'function') {
        const originalHandleCombat = window.handleCombat;
        
        window.handleCombat = function() {
            // Apply damage multiplier if it exists
            const player = window.players[window.currentUser.uid];
            if (player && player.damageMultiplier) {
                const originalDamage = player.damage || 10;
                player.damage = originalDamage * player.damageMultiplier;
                
                // Call original combat handler
                originalHandleCombat.call(window);
                
                // Restore original damage
                player.damage = originalDamage;
            } else {
                // Just call original without modifications
                originalHandleCombat.call(window);
            }
        };
    }
}

// Admin function to give all ice items
window.giveAllIceItems = function() {
    const user = firebase.auth().currentUser;
    if (!user || user.uid !== 'J1Wanf4kmFMTiG2xOLsvR9bsrYd2') {
        console.log("You don't have permission to use this command.");
        return;
    }

    if (typeof window.adminAddItemToGlobal === 'function') {
        // We are in character-selector.html, use the global inventory
        console.log('Adding ice items to global inventory...');
        window.adminAddItemToGlobal('ice_dagger');
        window.adminAddItemToGlobal('ice_flask');
        window.adminAddItemToGlobal('ice_shard');
        console.log('All ice items have been added to your global inventory.');
    } else if (window.players && window.players[window.currentUser.uid] && window.players[window.currentUser.uid].inventory) {
        // We are in raid-game.html, add to player's inventory
        console.log('Adding ice items to player inventory...');
        const player = window.players[window.currentUser.uid];
        player.inventory.addItem(new IceDagger());
        player.inventory.addItem(new IceFlask());
        player.inventory.addItem(new IceShard());
        console.log('All ice items have been added to your inventory.');
    } else {
        console.log('Could not find a valid inventory to add items to.');
    }
};
