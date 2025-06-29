/**
 * Items System
 * Exports all item-related functionality for the game
 */

// Export main components
export { Inventory, MAX_INVENTORY_SIZE } from './inventory.js';
export { InventoryUI } from './inventory-ui.js';
export { PotionSpawner } from './potion-spawner.js';
export { BaseItem } from './base-item.js';

// Export potion classes
export { ShieldPotion, PowerPotion } from './potions/index.js';

// Export passive item classes
export { TidalCharm } from './Tidal_Charm.js';
export { LeviathansFang } from './Leviathans_Fang.js';
export { StormcallersOrb } from './Stormcallers_Orb.js';
export { TidebornBreastplate } from './Tideborn_Breastplate.js';
export { WaterElementalCrystal } from './Water_Elemental_Crystal.js';
export { Wavebreaker } from './Wavebreaker.js';

// Export crafting materials
export { MurkyWaterVial } from './crafting/Murky_Water_Vial.js';
export { ShadowEssence } from './crafting/Shadow_Essence.js';
export { VoidEssence } from './crafting/Void_Essence.js';
export { IceFlask } from './crafting/ice_flask.js';
export { IceShard } from './crafting/ice_shard.js';

// Export passive item classes
export { IceDagger } from './ice_dagger.js';

// Initialize the item system for the game
export function initItemSystem(game) {
    // Create inventory for the current player
    if (game.players && game.players[game.currentUser.uid]) {
        game.players[game.currentUser.uid].inventory = new (require('./inventory.js').Inventory)();
    }
    
    // Create inventory UI
    game.inventoryUI = new (require('./inventory-ui.js').InventoryUI)(game.ctx, game.canvas);
    
    // Create potion spawner
    game.potionSpawner = new (require('./potion-spawner.js').PotionSpawner)(
        game.database,
        game.currentLobbyId
    );
    
    // Load existing potions from Firebase if not a new lobby
    if (!game.isNewLobby) {
        game.potionSpawner.loadPotionsFromFirebase();
    } else {
        // Force initial spawn for new lobbies
        game.potionSpawner.lastSpawnTime = 0;
        game.potionSpawner.update(Date.now(), game.isNewLobby, game);
    }
    
    // Add keyboard listeners for inventory management
    addKeyboardListeners(game);
    
    // Add click listeners for inventory interaction
    addClickListeners(game);
    
    console.log('Item system initialized');
}

// Add keyboard listeners for inventory management
function addKeyboardListeners(game) {
    // Use number keys 1-5 to select items
    const originalKeydownHandler = window.onkeydown;
    
    window.addEventListener('keydown', (e) => {
        // Only handle if game is started
        if (!game.gameStarted) return;
        
        const player = game.players[game.currentUser.uid];
        if (!player || !player.inventory) return;
        
        // Number keys for selecting items (1-5)
        if (e.key >= '1' && e.key <= '5') {
            const index = parseInt(e.key) - 1;
            player.inventory.setActiveItem(index);
        }
        
        // E key to use active item
        if (e.key === 'e' || e.key === 'E') {
            player.inventory.useActiveItem(player);
        }
        
        // Q key to cancel charging item
        if (e.key === 'q' || e.key === 'Q') {
            player.inventory.cancelActiveItem();
        }
    });
}

// Add click listeners for inventory interaction
function addClickListeners(game) {
    game.canvas.addEventListener('click', (e) => {
        // Only handle if game is started
        if (!game.gameStarted) return;
        
        const player = game.players[game.currentUser.uid];
        if (!player || !player.inventory) return;
        
        // Get click position
        const rect = game.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Check if clicked on inventory
        const clickedSlot = game.inventoryUI.handleClick(clickX, clickY, player.inventory);
        if (clickedSlot >= 0) {
            // Select the clicked item
            player.inventory.setActiveItem(clickedSlot);
        }
    });
}

// Update the inventory system
export function updateItemSystem(game) {
    const player = game.players[game.currentUser.uid];
    if (!player || !player.inventory) return;
    
    // Determine if player moved since last frame
    const playerMoved = 
        player.lastPosition.x !== player.x || 
        player.lastPosition.y !== player.y;
    
    // Update player's inventory
    player.inventory.update(player, playerMoved);
    
    // Update the inventory UI
    game.inventoryUI.update();
    
    // Update potion spawner - pass game reference
    game.potionSpawner.update(Date.now(), game.isNewLobby, game);
    
    // Check for potion collection
    const collectedPotion = game.potionSpawner.checkCollection(player);
    if (collectedPotion) {
        // Try to add to inventory
        const added = player.inventory.addItem(collectedPotion);
        if (added) {
            if (typeof game.showAnnouncement === 'function') {
                game.showAnnouncement(`Picked up ${collectedPotion.name}`, 2);
            }
        } else {
            if (typeof game.showAnnouncement === 'function') {
                game.showAnnouncement(`Inventory full! Cannot pick up ${collectedPotion.name}`, 2);
            }
        }
    }
    
    // Store current position for next frame
    player.lastPosition = { x: player.x, y: player.y };
}

// Render the inventory system
export function renderItemSystem(game) {
    const player = game.players[game.currentUser.uid];
    if (!player || !player.inventory) return;
    
    // Render potions in the world
    game.potionSpawner.render(game.ctx, game.camera);
    
    // Render inventory UI
    game.inventoryUI.render(player.inventory);
    
    // Render power boost effect if active
    if (player.powerBoostEffect) {
        renderPowerBoostEffect(game, player);
    }
}

// Render power boost effect around the player
function renderPowerBoostEffect(game, player) {
    const ctx = game.ctx;
    
    // Save context
    ctx.save();
    
    // Draw pulsing glow effect
    const pulseSize = 5 * Math.sin(Date.now() / 200) + 5;
    
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    
    ctx.beginPath();
    ctx.arc(
        player.x + player.width/2 - game.camera.x,
        player.y + player.height/2 - game.camera.y,
        player.width/2 + pulseSize,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    // Restore context
    ctx.restore();
}
