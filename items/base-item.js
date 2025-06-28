/**
 * Base Item Class
 * Foundation for all items in Project Fighters Easter Egg Hunt
 */

class BaseItem {
    constructor(id, name, description, image) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.image = image; // Path to image or Image object
        this.isCharging = false;
        this.isActive = false;
        this.isConsumed = false;
        this.chargeStartTime = 0;
        this.chargeTime = 0; // Milliseconds to charge
        this.activeStartTime = 0;
        this.activeDuration = 0; // Milliseconds active (0 = instant)
        this.cancelOnMove = false; // Whether charging is canceled when player moves
    }
    
    // Start using the item
    use(player) {
        if (this.chargeTime > 0) {
            // Item needs charging
            this.isCharging = true;
            this.chargeStartTime = Date.now();
            return false; // Not used immediately
        } else {
            // Instant use
            this.applyEffect(player);
            
            if (this.activeDuration > 0) {
                // Item has active duration
                this.isActive = true;
                this.activeStartTime = Date.now();
                return false; // Not consumed immediately
            } else {
                // Consume after instant use
                this.isConsumed = true;
                return true; // Consumed
            }
        }
    }
    
    // Cancel charging
    cancelCharge() {
        if (this.isCharging) {
            this.isCharging = false;
            this.chargeStartTime = 0;
            
            // Show cancellation message if available
            if (typeof window.showAnnouncement === 'function') {
                window.showAnnouncement(`${this.name} charge canceled`, 1);
            }
            
            return true;
        }
        return false;
    }
    
    // Update item state
    update(player, playerMoved) {
        // Check if charging is complete
        if (this.isCharging) {
            const now = Date.now();
            const chargeElapsed = now - this.chargeStartTime;
            
            // If player moved during charging and the item should be canceled on movement
            if (playerMoved && (this.cancelOnMove || this.id === 'shield-potion')) {
                this.cancelCharge();
                return;
            }
            
            if (chargeElapsed >= this.chargeTime) {
                // Charging complete
                this.isCharging = false;
                this.applyEffect(player);
                
                if (this.activeDuration > 0) {
                    // Item has active duration
                    this.isActive = true;
                    this.activeStartTime = now;
                } else {
                    // Consume after effect is applied
                    this.isConsumed = true;
                }
            }
        }
        
        // Check if active effect has expired
        if (this.isActive) {
            const now = Date.now();
            const activeElapsed = now - this.activeStartTime;
            
            if (activeElapsed >= this.activeDuration) {
                // Active effect expired
                this.isActive = false;
                this.removeEffect(player);
                this.isConsumed = true;
            }
        }
    }
    
    // Apply item effect (override in subclasses)
    applyEffect(player) {
        // To be implemented by subclasses
    }
    
    // Remove item effect (override in subclasses if needed)
    removeEffect(player) {
        // To be implemented by subclasses if needed
    }
    
    // Get charge progress (0 to 1)
    getChargeProgress() {
        if (!this.isCharging || this.chargeTime === 0) {
            return 0;
        }
        
        const elapsed = Date.now() - this.chargeStartTime;
        return Math.min(1, elapsed / this.chargeTime);
    }
    
    // Get active progress (0 to 1)
    getActiveProgress() {
        if (!this.isActive || this.activeDuration === 0) {
            return 0;
        }
        
        const elapsed = Date.now() - this.activeStartTime;
        return Math.min(1, elapsed / this.activeDuration);
    }
    
    // Create an image for the item
    static createImage(width, height, renderFunction) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Call the provided render function to draw on the canvas
        renderFunction(ctx, width, height);
        
        // Create image from canvas
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }
}

export { BaseItem }; 