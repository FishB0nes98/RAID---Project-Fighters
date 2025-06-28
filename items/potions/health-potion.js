/**
 * Health Potion
 * Restores 50 health points after a 2-second charge time
 * Charge is canceled if player walks
 */

import { BaseItem } from '../base-item.js';

class HealthPotion extends BaseItem {
    constructor() {
        // Create the potion image
        const image = BaseItem.createImage(32, 32, (ctx, width, height) => {
            // Draw potion bottle
            ctx.fillStyle = '#FF5252';
            ctx.beginPath();
            ctx.ellipse(width/2, height*0.75, width*0.4, height*0.25, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Draw bottle body
            ctx.fillRect(width*0.3, height*0.25, width*0.4, height*0.5);
            
            // Draw bottle neck
            ctx.fillRect(width*0.4, height*0.1, width*0.2, height*0.15);
            
            // Draw bottle cap
            ctx.fillStyle = '#B71C1C';
            ctx.fillRect(width*0.35, height*0.05, width*0.3, height*0.05);
            
            // Draw health symbol (plus sign)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(width*0.45, height*0.35, width*0.1, height*0.3); // Vertical line
            ctx.fillRect(width*0.35, height*0.45, width*0.3, height*0.1); // Horizontal line
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(width*0.4, height*0.4, width*0.05, height*0.15, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        });
        
        super(
            'health-potion',
            'Health Potion',
            'Restores 50 health points after a 2-second charge time. Charge is canceled if you move.',
            image
        );
        
        // Set charging time to 2 seconds
        this.chargeTime = 2000;
        
        // Health amount to restore
        this.healthAmount = 50;
        
        // This potion's charge is canceled when the player moves
        this.cancelOnMove = true;
    }
    
    // Apply health potion effect
    applyEffect(player) {
        // Restore health up to maximum
        player.health = Math.min(100, player.health + this.healthAmount);
        
        // Show health effect
        this.createHealthEffect(player);
        
        // Show announcement using the global showAnnouncement or window.showAnnouncement
        if (typeof window.showAnnouncement === 'function') {
            window.showAnnouncement(`Health restored (+${this.healthAmount})`, 2);
        }
    }
    
    // Create a visual health effect
    createHealthEffect(player) {
        // Check if effects array exists in the game
        if (typeof window.effects !== 'undefined') {
            // Use global effects array and other objects
            const effects = window.effects;
            const ctx = window.ctx;
            const camera = window.camera;
            
            // Add health effect animation
            effects.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                radius: 50,
                maxRadius: 80,
                alpha: 0.8,
                color: '#FF5252',
                duration: 1000,
                startTime: Date.now(),
                update: function() {
                    const elapsed = Date.now() - this.startTime;
                    
                    if (elapsed > this.duration) return false;
                    
                    const progress = elapsed / this.duration;
                    this.radius = this.maxRadius * progress;
                    this.alpha = 0.8 * (1 - progress);
                    
                    return true;
                },
                render: function() {
                    if (!ctx || !camera) return;
                    
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.arc(
                        this.x - camera.x, 
                        this.y - camera.y, 
                        this.radius, 
                        0, 
                        Math.PI * 2
                    );
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }
    }
}

export { HealthPotion }; 