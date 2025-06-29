import { BaseItem } from '../base-item.js';

class ShadowEssence extends BaseItem {
    constructor() {
        super(
            'shadow_essence',
            'Shadow Essence',
            'A dark, swirling essence, used for crafting.',
            'items/shadow_essence.png'
        );
        this.isCraftingMaterial = true;
    }
}

export { ShadowEssence };
