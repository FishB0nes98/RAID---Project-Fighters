/**
 * Magical Grenade
 * When used, activates aiming - pressing left click throws the grenade at the target location.
 * If it hits an enemy, it completely destroys their shield.
 */

import { BaseItem } from '../base-item.js';

class MagicalGrenade extends BaseItem {
    constructor() {
        // Create the grenade image
        const image = BaseItem.createImage(32, 32, (ctx, width, height) => {
            // Draw grenade body (circular)
            ctx.fillStyle = '#800080'; // Purple
            ctx.beginPath();
            ctx.arc(width/2, height/2, width*0.35, 0, Math.PI*2);
            ctx.fill();
            
            // Draw grenade top/cap
            ctx.fillStyle = '#C0C0C0'; // Silver
            ctx.beginPath();
            ctx.arc(width/2, height*0.25, width*0.15, 0, Math.PI*2);
            ctx.fill();
            
            // Draw fuse
            ctx.strokeStyle = '#FFD700'; // Gold
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width/2, height*0.25);
            ctx.quadraticCurveTo(width*0.7, height*0.1, width*0.8, height*0.2);
            ctx.stroke();
            
            // Draw sparks/magical effect
            ctx.fillStyle = '#FF00FF'; // Magenta
            ctx.beginPath();
            ctx.arc(width*0.8, height*0.2, width*0.08, 0, Math.PI*2);
            ctx.fill();
            
            // Add magical glow effect
            const gradient = ctx.createRadialGradient(
                width/2, height/2, width*0.2,
                width/2, height/2, width*0.4
            );
            gradient.addColorStop(0, 'rgba(128, 0, 128, 0)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(width/2, height/2, width*0.4, 0, Math.PI*2);
            ctx.fill();
        });
        
        super(
            'magical-grenade',
            'Magical Grenade',
            'When used, activates aiming mode. Left-click to throw the grenade. If it hits an enemy, it completely destroys their shield.',
            image
        );
        
        // This is an instant-use item that activates aiming mode
        this.chargeTime = 0;
        this.activeDuration = 0;
        this.range = 500; // Maximum throw range
        this.explosionRadius = 80; // Explosion radius
        this.projectileSpeed = 500; // Pixels per second
        this.isAiming = false;
        this.explosionDuration = 500; // milliseconds
    }
    
    // Override use method to enable aiming mode
    use(player) {
        if (!this.isAiming) {
            this.isAiming = true;
            // Start aiming mode
            this.startAiming();
            return false; // Not consumed yet
        }
        return false;
    }
    
    // Start aiming mode
    startAiming() {
        // Show aiming reticle
        document.body.style.cursor = 'crosshair';
        
        // Set up click handler for throwing
        this.clickHandler = (e) => this.handleThrow(e);
        window.addEventListener('click', this.clickHandler);
        
        // Set up escape key handler to cancel
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.cancelAiming();
            }
        };
        window.addEventListener('keydown', this.escHandler);
    }
    
    // Handle grenade throw
    handleThrow(e) {
        // Get canvas and player
        const canvas = document.getElementById('gameCanvas');
        const player = window.players[window.currentUser.uid];
        
        if (!player) {
            this.cancelAiming();
            return;
        }
        
        // Calculate throw position (center of player)
        const startX = player.x + player.width / 2;
        const startY = player.y + player.height / 2;
        
        // Calculate target position (from canvas coordinates to world coordinates)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // Transform to world coordinates based on camera position
        const camera = window.camera || { x: 0, y: 0 };
        const targetX = mouseX + camera.x;
        const targetY = mouseY + camera.y;
        
        // Calculate direction and distance
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit to maximum range
        let endX = targetX;
        let endY = targetY;
        if (distance > this.range) {
            const ratio = this.range / distance;
            endX = startX + dx * ratio;
            endY = startY + dy * ratio;
        }
        
        // Create and animate the projectile
        this.animateGrenade(startX, startY, endX, endY);
        
        // Clean up aiming mode
        this.cancelAiming();
        
        // Mark item as consumed
        this.isConsumed = true;
    }
    
    // Animate grenade projectile
    animateGrenade(startX, startY, endX, endY) {
        // Create projectile element
        const projectile = document.createElement('div');
        projectile.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: #800080;
            border-radius: 50%;
            box-shadow: 0 0 10px #FF00FF;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(projectile);
        
        // Calculate flight time based on distance and speed
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const flightTime = distance / this.projectileSpeed * 1000; // in milliseconds
        
        // Animation start time
        const startTime = Date.now();
        
        // Animation function
        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(1, elapsedTime / flightTime);
            
            if (progress < 1) {
                // Update position with slight arc effect
                const arcHeight = distance * 0.2; // maximum height of arc
                const arcProgress = Math.sin(progress * Math.PI); // 0->1->0 curve
                
                const currentX = startX + dx * progress;
                const currentY = startY + dy * progress - arcHeight * arcProgress;
                
                // Adjust position for camera
                const camera = window.camera || { x: 0, y: 0 };
                projectile.style.left = `${currentX - camera.x - 10}px`; // -10 for half width
                projectile.style.top = `${currentY - camera.y - 10}px`; // -10 for half height
                
                requestAnimationFrame(animate);
            } else {
                // Animation complete, create explosion
                document.body.removeChild(projectile);
                this.createExplosion(endX, endY);
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }
    
    // Create explosion effect and apply damage
    createExplosion(x, y) {
        // Create explosion element
        const explosion = document.createElement('div');
        explosion.style.cssText = `
            position: absolute;
            width: ${this.explosionRadius * 2}px;
            height: ${this.explosionRadius * 2}px;
            background: radial-gradient(circle, rgba(255,0,255,0.8) 0%, rgba(128,0,128,0.4) 70%, rgba(128,0,128,0) 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: explode ${this.explosionDuration}ms ease-out forwards;
        `;
        
        // Add keyframe animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes explode {
                0% { transform: scale(0.3); opacity: 1; }
                100% { transform: scale(1.2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Adjust position for camera
        const camera = window.camera || { x: 0, y: 0 };
        explosion.style.left = `${x - camera.x - this.explosionRadius}px`;
        explosion.style.top = `${y - camera.y - this.explosionRadius}px`;
        
        document.body.appendChild(explosion);
        
        // Apply effect to players in range
        this.applyGrenadeEffect(x, y);
        
        // Remove explosion after animation
        setTimeout(() => {
            document.body.removeChild(explosion);
            document.head.removeChild(style);
        }, this.explosionDuration);
    }
    
    // Apply grenade effect to players
    applyGrenadeEffect(centerX, centerY) {
        const players = window.players;
        const currentUser = window.currentUser;
        const database = window.database;
        const currentLobbyId = window.currentLobbyId;
        
        if (!players || !currentUser || !database || !currentLobbyId) return;
        
        // Check for hits on other players
        for (const targetId in players) {
            if (targetId === currentUser.uid) continue; // Skip self
            
            const target = players[targetId];
            if (!target) continue; // Skip if target is no longer valid
            
            const targetCenterX = target.x + target.width/2;
            const targetCenterY = target.y + target.height/2;
            
            // Calculate distance to target
            const distance = Math.sqrt(
                Math.pow(targetCenterX - centerX, 2) + 
                Math.pow(targetCenterY - centerY, 2)
            );
            
            // Check if target is in range
            if (distance <= this.explosionRadius + target.width/2) {
                // Set shield to 0 (completely destroy it)
                if (target.shield > 0) {
                    target.shield = 0;
                    
                    // Update target in Firebase
                    window.set(window.ref(database, `easterEggHunt/lobbies/${currentLobbyId}/players/${targetId}`), target);
                    
                    // Create hit effect
                    if (typeof window.createHitEffect === 'function') {
                        window.createHitEffect(targetCenterX, targetCenterY);
                    }
                    
                    // Show announcement
                    if (typeof window.showAnnouncement === 'function') {
                        window.showAnnouncement(`Player's shield destroyed!`, 2);
                    }
                }
            }
        }
        
        // Send effect to Firebase so others can see it
        if (typeof window.sendAbilityEffectToFirebase === 'function') {
            window.sendAbilityEffectToFirebase("magicalGrenade", centerX, centerY, 0, this.explosionRadius);
        }
    }
    
    // Cancel aiming mode
    cancelAiming() {
        document.body.style.cursor = 'default';
        window.removeEventListener('click', this.clickHandler);
        window.removeEventListener('keydown', this.escHandler);
        this.isAiming = false;
    }
    
    // Create shield-breaking effect
    createShieldBreakEffect(player) {
        // Implementation depends on game's effect system
        // Similar to createHitEffect but with shield break visuals
    }
}

export { MagicalGrenade }; 