import { BaseItem } from '../base-item.js';

class VoidEssence extends BaseItem {
    constructor() {
        super(
            'void_essence',
            'Void Essence',
            'A dark, unstable essence, used for crafting.',
            'items/Void_Essence.png'
        );
        this.isCraftingMaterial = true;
    }
}

export { VoidEssence };
