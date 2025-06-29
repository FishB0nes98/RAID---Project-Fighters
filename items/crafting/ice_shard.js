import { BaseItem } from '../base-item.js';

class IceShard extends BaseItem {
    constructor() {
        super(
            'ice_shard',
            'Ice Shard',
            'Throws an ice shard onto a random enemy dealing 200 Magical Damage and freezing it for 3 turns (10 turns cooldown).',
            'items/ice_shard.png'
        );
        this.isCraftingMaterial = true;
        this.isConsumable = true;
        this.cooldown = 10; // turns
        this.lastUsedTurn = -10; // So it can be used immediately
        this.damage = 200;
        this.damageType = 'magical';
        this.effects = {
            onUse: {
                target: 'random_enemy',
                effect: 'freeze',
                duration: 3, // turns
            }
        };
    }

    canUse(currentTurn) {
        return currentTurn >= this.lastUsedTurn + this.cooldown;
    }

    applyEffect(player, currentTurn) {
        if (this.canUse(currentTurn)) {
            this.lastUsedTurn = currentTurn;
            // The game-manager will handle the actual effect application
            console.log(`${player.name} used Ice Shard.`);
            this.isConsumed = true;
            return true;
        }
        console.log('Ice Shard is on cooldown.');
        return false;
    }
}

export { IceShard };
