/**
 * Power Up Potion
 * Increases damage dealt by 20% after a 2-second charge time
 */

import { BaseItem } from '../base-item.js';

class PowerPotion extends BaseItem {
    constructor() {
        // Create the potion image
        const image = BaseItem.createImage(32, 32, (ctx, width, height) => {
            // Draw potion bottle
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.ellipse(width/2, height*0.75, width*0.4, height*0.25, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Draw bottle body
            ctx.fillRect(width*0.3, height*0.25, width*0.4, height*0.5);
            
            // Draw bottle neck
            ctx.fillRect(width*0.4, height*0.1, width*0.2, height*0.15);
            
            // Draw bottle cap
            ctx.fillStyle = '#BF360C';
            ctx.fillRect(width*0.35, height*0.05, width*0.3, height*0.05);
            
            // Draw power symbol
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            // Lightning bolt
            ctx.moveTo(width*0.45, height*0.3);
            ctx.lineTo(width*0.6, height*0.45);
            ctx.lineTo(width*0.5, height*0.5);
            ctx.lineTo(width*0.65, height*0.7);
            ctx.lineTo(width*0.5, height*0.55);
            ctx.lineTo(width*0.4, height*0.6);
            ctx.closePath();
            ctx.fill();
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(width*0.4, height*0.4, width*0.05, height*0.15, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        });
        
        super(
            'power-potion',
            'Power Up Potion',
            'Increases damage dealt by 20% for 30 seconds after a 2-second charge time.',
            image
        );
        
        // Set charging time to 2 seconds
        this.chargeTime = 2000;
        
        // Set active duration to 30 seconds
        this.activeDuration = 30000;
        
        // Damage increase percentage
        this.damageBoost = 0.2; // 20%
    }
    
    // Apply power potion effect
    applyEffect(player) {
        // Store original damage multiplier
        if (!player.originalDamageMultiplier) {
            player.originalDamageMultiplier = player.damageMultiplier || 1;
        }
        
        // Apply damage boost
        player.damageMultiplier = player.originalDamageMultiplier * (1 + this.damageBoost);
        
        // Add visual effect to player
        player.powerBoostEffect = true;
        
        // Create power up effect
        this.createPowerEffect(player);
        
        // Show announcement using global object
        if (typeof window.showAnnouncement === 'function') {
            window.showAnnouncement(`Power Up! Damage +${this.damageBoost * 100}% for ${this.activeDuration / 1000}s`, 3);
        }
    }
    
    // Remove power potion effect when duration expires
    removeEffect(player) {
        // Reset damage multiplier
        if (player.originalDamageMultiplier) {
            player.damageMultiplier = player.originalDamageMultiplier;
            delete player.originalDamageMultiplier;
        }
        
        // Remove visual effect
        player.powerBoostEffect = false;
        
        // Show announcement using global object
        if (typeof window.showAnnouncement === 'function') {
            window.showAnnouncement('Power Up effect has worn off', 2);
        }
    }
    
    // Create a visual power effect
    createPowerEffect(player) {
        // Check if effects array exists in the game
        if (typeof window.effects !== 'undefined') {
            // Use global effects array and other objects
            const effects = window.effects;
            const ctx = window.ctx;
            const camera = window.camera;
            
            // Add power effect animation
            effects.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                radius: 40,
                maxRadius: 70,
                alpha: 0.8,
                color: '#FF5722',
                duration: 1500,
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

export { PowerPotion };