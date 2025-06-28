/**
 * Inventory UI
 * Renders the player inventory interface
 */

import { MAX_INVENTORY_SIZE } from './inventory.js';

class InventoryUI {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.slotSize = 50;
        this.padding = 5;
        this.borderWidth = 2;
        this.borderRadius = 8;
        this.spacing = 10;
        this.isVisible = true;
    }
    
    // Set inventory visibility
    setVisibility(isVisible) {
        this.isVisible = isVisible;
    }
    
    // Update inventory UI
    update() {
        // No update logic needed for now
    }
    
    // Render inventory UI
    render(inventory) {
        if (!this.isVisible) return;
        
        this.ctx.save();
        
        // Position inventory at bottom center of screen
        const totalWidth = (this.slotSize + this.spacing) * MAX_INVENTORY_SIZE - this.spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = this.canvas.height - this.slotSize - 20;
        
        // Render all inventory slots
        for (let i = 0; i < MAX_INVENTORY_SIZE; i++) {
            const x = startX + i * (this.slotSize + this.spacing);
            const y = startY;
            
            // Determine if this slot is active
            const isActive = i === inventory.activeItemIndex;
            
            // Render slot background with rounded corners
            this.ctx.fillStyle = isActive ? 'rgba(60, 145, 230, 0.7)' : 'rgba(0, 0, 0, 0.5)';
            this.ctx.strokeStyle = isActive ? '#3C91E6' : '#777777';
            this.ctx.lineWidth = this.borderWidth;
            
            // Draw rounded rectangle for slot
            this.roundRect(
                x, 
                y, 
                this.slotSize, 
                this.slotSize, 
                this.borderRadius, 
                true, // Fill
                true  // Stroke
            );
            
            // Render item in slot if it exists
            const item = inventory.items[i];
            if (item) {
                // Draw item image
                if (item.image) {
                    this.ctx.drawImage(
                        item.image, 
                        x + this.padding, 
                        y + this.padding, 
                        this.slotSize - this.padding * 2, 
                        this.slotSize - this.padding * 2
                    );
                }
                
                // If item is charging, draw charging progress
                if (item.isCharging) {
                    const progress = item.getChargeProgress();
                    this.drawChargeProgress(x, y, progress);
                }
                
                // If item is active, draw active duration
                if (item.isActive) {
                    const progress = 1 - item.getActiveProgress(); // Invert for countdown
                    this.drawActiveDuration(x, y, progress);
                }
                
                // Draw item slot number
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((i + 1).toString(), x + this.slotSize - 10, y + 10);
                
                // Draw stack count if there's more than 1 item
                if (item.count && item.count > 1) {
                    // Background for stack count
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.slotSize - 10, y + this.slotSize - 10, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Stack count text
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(item.count.toString(), x + this.slotSize - 10, y + this.slotSize - 10);
                }
            } else {
                // Draw empty slot label
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((i + 1).toString(), x + this.slotSize / 2, y + this.slotSize / 2);
            }
        }
        
        this.ctx.restore();
    }
    
    // Helper to draw rounded rectangles
    roundRect(x, y, width, height, radius, fill, stroke) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.arcTo(x, y, x + radius, y, radius);
        this.ctx.closePath();
        if (fill) this.ctx.fill();
        if (stroke) this.ctx.stroke();
    }
    
    // Draw charging progress overlay
    drawChargeProgress(x, y, progress) {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Calculate height based on progress (bottom to top)
        const height = this.slotSize * (1 - progress);
        
        // Draw progress overlay
        this.ctx.fillRect(
            x + this.borderWidth, 
            y + this.slotSize - height - this.borderWidth, 
            this.slotSize - this.borderWidth * 2, 
            height
        );
        
        // Add progress text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            `${Math.round(progress * 100)}%`, 
            x + this.slotSize / 2, 
            y + this.slotSize / 2
        );
    }
    
    // Draw active duration overlay
    drawActiveDuration(x, y, progress) {
        // Draw circular progress indicator
        const centerX = x + this.slotSize / 2;
        const centerY = y + this.slotSize / 2;
        const radius = this.slotSize / 2 - 5;
        
        // Draw background circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw progress arc
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY, 
            radius, 
            -Math.PI / 2, // Start from top
            -Math.PI / 2 + (Math.PI * 2 * progress) // End based on progress
        );
        this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.8)';
        this.ctx.stroke();
    }
    
    // Handle clicks on inventory slots
    handleClick(x, y, inventory) {
        if (!this.isVisible) return -1;
        
        // Calculate inventory UI position
        const totalWidth = (this.slotSize + this.spacing) * MAX_INVENTORY_SIZE - this.spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = this.canvas.height - this.slotSize - 20;
        
        // Check each slot
        for (let i = 0; i < MAX_INVENTORY_SIZE; i++) {
            const slotX = startX + i * (this.slotSize + this.spacing);
            const slotY = startY;
            
            // Check if click is within this slot
            if (x >= slotX && 
                x <= slotX + this.slotSize && 
                y >= slotY && 
                y <= slotY + this.slotSize) {
                // If there's an item in this slot, select it
                if (i < inventory.items.length) {
                    return i;
                }
            }
        }
        
        return -1; // No slot clicked
    }
}

export { InventoryUI }; 