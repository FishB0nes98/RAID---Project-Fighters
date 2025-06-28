# Project Fighters - Inventory System

## Overview
This inventory system adds potion items and inventory management to the Project Fighters Easter Egg Hunt game.

## Features
- Max 5 inventory slots
- Two different potion types:
  - **Shield Potion**: Restores 50 shield points after a 3-second charge time. Charge is canceled if you move.
  - **Power Up Potion**: Increases damage by 20% for 30 seconds after a 2-second charge time.
- Potions spawn randomly around the map
- Visual effects when using potions

## Controls
- **Number keys (1-5)**: Select inventory slot
- **E key**: Use the selected item
- **Q key**: Cancel charging item
- **Click on inventory slot**: Select that slot

## Development
The inventory system is modular and can be extended with additional item types:
- Base item class in `base-item.js`
- Inventory management in `inventory.js`
- UI rendering in `inventory-ui.js`
- Potion spawning in `potion-spawner.js`
- Game integration in `game-integration.js`

To add a new item type, create a new class that extends BaseItem and implement the required methods.

## Integration
The inventory system hooks into the main game loop via the `game-integration.js` module, which:
1. Initializes the inventory system
2. Overrides the game's update and render functions
3. Removes existing health/shield pickups
4. Enhances the combat system with the power potion effect 