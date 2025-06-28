/**
 * Potion Spawner
 * Handles spawning potions in the game world
 */

import { ShieldPotion, SmallShieldPotion, HealthPotion, PowerPotion, MagicalGrenade } from './potions/index.js';
import { BaseItem } from './base-item.js';

// Potion types with spawn weights
const POTION_TYPES = [
    { type: 'shield-potion', weight: 30, class: ShieldPotion },
    { type: 'small-shield-potion', weight: 40, class: SmallShieldPotion },
    { type: 'health-potion', weight: 40, class: HealthPotion },
    { type: 'power-potion', weight: 25, class: PowerPotion },
    { type: 'magical-grenade', weight: 15, class: MagicalGrenade }
];

// Total spawn weight for probability calculation
const TOTAL_WEIGHT = POTION_TYPES.reduce((sum, potion) => sum + potion.weight, 0);

class PotionSpawner {
    constructor(database, lobbyId) {
        this.database = database;
        this.lobbyId = lobbyId;
        this.potions = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 30000; // 30 seconds between spawns (decreased from 60s)
        this.maxPotions = 20; // Maximum potions in the game world
        this.potionSize = 32;
        
        // Game references - will be set from gameRef
        this.MAP_WIDTH = 10000; // Default, will be updated
        this.MAP_HEIGHT = 10000; // Default, will be updated
        this.walls = null;
        this.environmentElements = null;
        this.checkCollision = null;
        
        // Create assets for potion drops
        this.assets = {
            'shield-potion': new ShieldPotion().image,
            'small-shield-potion': new SmallShieldPotion().image,
            'health-potion': new HealthPotion().image,
            'power-potion': new PowerPotion().image,
            'magical-grenade': new MagicalGrenade().image
        };
    }
    
    // Update the spawner
    update(currentTime, isNewLobby, gameRef) {
        // Update references to game objects if provided
        if (gameRef) {
            if (gameRef.MAP_WIDTH) this.MAP_WIDTH = gameRef.MAP_WIDTH;
            if (gameRef.MAP_HEIGHT) this.MAP_HEIGHT = gameRef.MAP_HEIGHT;
            if (gameRef.walls) this.walls = gameRef.walls;
            if (gameRef.environmentElements) this.environmentElements = gameRef.environmentElements;
            if (gameRef.checkCollision) this.checkCollision = gameRef.checkCollision;
        }
        
        // Check if it's time to spawn a new potion
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            // Don't spawn if we already have the maximum
            if (this.potions.length < this.maxPotions) {
                // Spawn a potion
                this.spawnRandomPotion(isNewLobby);
                this.lastSpawnTime = currentTime;
                console.log('Spawned new potion, total:', this.potions.length);
            }
        }
    }
    
    // Spawn a random potion
    spawnRandomPotion(isNewLobby) {
        // Select potion type based on weight
        const potionType = this.selectPotionType();
        
        // Create a valid spawn position
        const pos = this.findValidSpawnPosition();
        if (!pos) {
            console.warn('Could not find valid position for potion spawn');
            return; // No valid position found
        }
        
        // Create potion object
        const potion = {
            id: `potion_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: potionType,
            x: pos.x,
            y: pos.y,
            width: this.potionSize,
            height: this.potionSize
        };
        
        // Add to local array
        this.potions.push(potion);
        
        // If new lobby, save to Firebase
        if (isNewLobby) {
            this.savePotionsToFirebase();
        }
    }
    
    // Select a potion type based on spawn weights
    selectPotionType() {
        const rand = Math.random() * TOTAL_WEIGHT;
        let weightSum = 0;
        
        for (const potion of POTION_TYPES) {
            weightSum += potion.weight;
            if (rand <= weightSum) {
                return potion.type;
            }
        }
        
        // Default to shield potion if something goes wrong
        return 'shield-potion';
    }
    
    // Find a valid spawn position (not colliding with walls, etc)
    findValidSpawnPosition() {
        // Check that map dimensions are valid
        if (!this.MAP_WIDTH || !this.MAP_HEIGHT) {
            console.warn('Map dimensions not available for potion spawning');
            return { 
                x: Math.random() * 1000, 
                y: Math.random() * 1000 
            };
        }
        
        const MAX_ATTEMPTS = 30; // Increased from 20
        
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            // Generate random position within map bounds
            const x = Math.random() * (this.MAP_WIDTH - this.potionSize);
            const y = Math.random() * (this.MAP_HEIGHT - this.potionSize);
            
            // Create potion rect at this position
            const potionRect = {
                x: x,
                y: y,
                width: this.potionSize,
                height: this.potionSize
            };
            
            // Check for collisions with walls
            let collision = false;
            
            // Use the game's collision detection if available
            if (this.checkCollision) {
                // Check walls
                if (this.walls) {
                    for (const wall of this.walls) {
                        if (this.checkCollision(potionRect, wall)) {
                            collision = true;
                            break;
                        }
                    }
                }
                
                if (collision) continue;
                
                // Check environment elements
                if (this.environmentElements) {
                    for (const element of this.environmentElements) {
                        if (this.checkCollision(potionRect, element)) {
                            collision = true;
                            break;
                        }
                    }
                }
                
                if (collision) continue;
                
                // If we got here, position is valid
                return { x, y };
            } else {
                // Fallback collision detection using our own implementation
                // We'll place the potion in a random spot and hope for the best
                console.warn('No collision detection function available for potion spawning');
                return { x, y };
            }
        }
        
        // If we couldn't find a spot after max attempts, just pick a random position
        // near the center of the map for safety
        console.warn('Could not find collision-free position for potion after max attempts');
        return {
            x: this.MAP_WIDTH / 2 + (Math.random() * 200 - 100),
            y: this.MAP_HEIGHT / 2 + (Math.random() * 200 - 100)
        };
    }
    
    // Save potions to Firebase
    savePotionsToFirebase() {
        if (this.database) {
            const ref = this.database.ref(`easterEggHunt/lobbies/${this.lobbyId}/potions`);
            ref.set(this.potions);
        }
    }
    
    // Load potions from Firebase
    loadPotionsFromFirebase() {
        if (this.database) {
            const ref = this.database.ref(`easterEggHunt/lobbies/${this.lobbyId}/potions`);
            ref.once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    this.potions = snapshot.val() || [];
                    console.log('Loaded', this.potions.length, 'potions from Firebase');
                }
            });
        }
    }
    
    // Update potion collection in Firebase
    updatePotionCollectionInFirebase(potionId) {
        if (this.database) {
            // Remove the potion from local array
            const potionIndex = this.potions.findIndex(p => p.id === potionId);
            if (potionIndex !== -1) {
                this.potions.splice(potionIndex, 1);
                
                // Update Firebase
                this.savePotionsToFirebase();
            }
        }
    }
    
    // Get a new potion instance of the given type
    createNewPotionInstance(type) {
        const potionInfo = POTION_TYPES.find(p => p.type === type);
        if (potionInfo && potionInfo.class) {
            return new potionInfo.class();
        }
        return null;
    }
    
    // Render potions
    render(ctx, camera) {
        for (const potion of this.potions) {
            // Only render if in viewport
            if (this.isInViewport(potion, camera)) {
                // Draw potion
                const img = this.assets[potion.type];
                if (img) {
                    ctx.drawImage(
                        img,
                        potion.x - camera.x,
                        potion.y - camera.y,
                        potion.width,
                        potion.height
                    );
                }
            }
        }
    }
    
    // Check if object is in viewport
    isInViewport(obj, camera, buffer = 0) {
        return obj.x + obj.width + buffer >= camera.x && 
               obj.x - buffer <= camera.x + camera.width &&
               obj.y + obj.height + buffer >= camera.y && 
               obj.y - buffer <= camera.y + camera.height;
    }
    
    // Check collision between player and potions, return collected potion
    checkCollection(player) {
        for (let i = 0; i < this.potions.length; i++) {
            const potion = this.potions[i];
            
            // Check collision with player
            if (this.checkCollision && this.checkCollision(player, potion)) {
                // Create a potion instance
                const potionInstance = this.createNewPotionInstance(potion.type);
                
                // Remove from the world
                const potionId = potion.id;
                this.potions.splice(i, 1);
                
                // Update in Firebase
                this.updatePotionCollectionInFirebase(potionId);
                
                // Return the potion instance
                return potionInstance;
            }
        }
        
        return null;
    }
}

export { PotionSpawner }; 