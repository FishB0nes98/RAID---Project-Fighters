/**
 * Player Inventory System
 * Handles inventory management for players in Project Fighters Easter Egg Hunt
 */

// Maximum inventory size
const MAX_INVENTORY_SIZE = 5;

// Maximum stack size for stackable items
const MAX_STACK_SIZE = 3;

// Inventory class to manage player's items
class Inventory {
    constructor() {
        this.items = [];
        this.activeItemIndex = -1;
    }

    // Add an item to inventory with stacking support
    addItem(item) {
        // Check if the item can be stacked with an existing item
        const stackIndex = this.findStackableItemIndex(item.id);
        
        if (stackIndex !== -1) {
            // Item can be stacked with an existing stack
            const stackItem = this.items[stackIndex];
            
            // Check if we've reached max stack size
            if (stackItem.count < MAX_STACK_SIZE) {
                // Add to existing stack
                stackItem.count++;
                return true;
            }
        }
        
        // Can't stack or no existing stack found, try to add as new item
        if (this.items.length >= MAX_INVENTORY_SIZE) {
            return false;
        }
        
        // Add as new item with count of 1
        item.count = 1;
        this.items.push(item);
        
        // If this is the first item, make it active
        if (this.items.length === 1) {
            this.activeItemIndex = 0;
        }
        
        return true;
    }
    
    // Find an item of the same type that can be stacked
    findStackableItemIndex(itemId) {
        for (let i = 0; i < this.items.length; i++) {
            // Check if item is of the same type and not at max stack
            if (this.items[i].id === itemId && this.items[i].count < MAX_STACK_SIZE) {
                return i;
            }
        }
        return -1;
    }
    
    // Remove an item from inventory
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            // If stacked, decrement count instead of removing
            if (this.items[index].count > 1) {
                this.items[index].count--;
                return true;
            }
            
            // If count is 1, remove the item entirely
            this.items.splice(index, 1);
            
            // Update active item if necessary
            if (this.activeItemIndex === index) {
                this.activeItemIndex = this.items.length > 0 ? 0 : -1;
            } else if (this.activeItemIndex > index) {
                this.activeItemIndex--;
            }
            
            return true;
        }
        return false;
    }
    
    // Get the currently active item
    getActiveItem() {
        if (this.activeItemIndex >= 0 && this.activeItemIndex < this.items.length) {
            return this.items[this.activeItemIndex];
        }
        return null;
    }
    
    // Set the active item by index
    setActiveItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.activeItemIndex = index;
            return true;
        }
        return false;
    }
    
    // Use the currently active item
    useActiveItem(player) {
        const activeItem = this.getActiveItem();
        if (activeItem && !activeItem.isCharging && !activeItem.isActive) {
            activeItem.use(player);
            return true;
        }
        return false;
    }
    
    // Cancel the currently active item if it's charging
    cancelActiveItem() {
        const activeItem = this.getActiveItem();
        if (activeItem && activeItem.isCharging) {
            activeItem.cancelCharge();
            return true;
        }
        return false;
    }
    
    // Update all items in inventory
    update(player, playerMoved) {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            
            // Update the item
            item.update(player, playerMoved);
            
            // Remove item if it's been used up
            if (item.isConsumed) {
                this.removeItem(i);
                i--; // Adjust index after removal
            }
        }
    }
    
    // Get inventory size
    get size() {
        return this.items.length;
    }
    
    // Check if inventory is full
    get isFull() {
        return this.items.length >= MAX_INVENTORY_SIZE;
    }
}

// Export the Inventory class
export { Inventory, MAX_INVENTORY_SIZE, MAX_STACK_SIZE }; 