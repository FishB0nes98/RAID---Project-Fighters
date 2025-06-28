/**
 * Shield Potion
 * Restores 50 shield points after a 3-second charge time
 * Charge is canceled if player walks
 */

import { BaseItem } from '../base-item.js';

class ShieldPotion extends BaseItem {
    constructor() {
        // Create the potion image
        const image = BaseItem.createImage(32, 32, (ctx, width, height) => {
            // Draw potion bottle
            ctx.fillStyle = '#3366CC';
            ctx.beginPath();
            ctx.ellipse(width/2, height*0.75, width*0.4, height*0.25, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Draw bottle body
            ctx.fillRect(width*0.3, height*0.25, width*0.4, height*0.5);
            
            // Draw bottle neck
            ctx.fillRect(width*0.4, height*0.1, width*0.2, height*0.15);
            
            // Draw bottle cap
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(width*0.35, height*0.05, width*0.3, height*0.05);
            
            // Draw shield symbol
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(width/2, height*0.35);
            ctx.lineTo(width*0.65, height*0.45);
            ctx.lineTo(width*0.65, height*0.6);
            ctx.lineTo(width/2, height*0.7);
            ctx.lineTo(width*0.35, height*0.6);
            ctx.lineTo(width*0.35, height*0.45);
            ctx.closePath();
            ctx.fill();
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(width*0.4, height*0.4, width*0.05, height*0.15, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        });
        
        super(
            'shield-potion',
            'Shield Potion',
            'Restores 50 shield points after a 3-second charge time. Charge is canceled if you move.',
            image
        );
        
        // Set charging time to 3 seconds
        this.chargeTime = 3000;
        
        // Shield amount to restore
        this.shieldAmount = 50;
        
        // This potion's charge is canceled when the player moves
        this.cancelOnMove = true;
    }
    
    // Apply shield potion effect
    applyEffect(player) {
        // Restore shield up to maximum
        player.shield = Math.min(100, player.shield + this.shieldAmount);
        
        // Show shield effect
        this.createShieldEffect(player);
        
        // Show announcement using the global showAnnouncement or window.showAnnouncement
        if (typeof window.showAnnouncement === 'function') {
            window.showAnnouncement(`Shield restored (+${this.shieldAmount})`, 2);
        }
    }
    
    // Create a visual shield effect
    createShieldEffect(player) {
        // Check if effects array exists in the game
        if (typeof window.effects !== 'undefined') {
            // Use global effects array and other objects
            const effects = window.effects;
            const ctx = window.ctx;
            const camera = window.camera;
            
            // Add shield effect animation
            effects.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                radius: 50,
                maxRadius: 80,
                alpha: 0.8,
                color: '#2196F3',
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

export { ShieldPotion }; 