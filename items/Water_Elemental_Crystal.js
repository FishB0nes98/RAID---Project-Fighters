import { BaseItem } from './base-item.js';

class WaterElementalCrystal extends BaseItem {
    constructor() {
        super(
            'water_elemental_crystal',
            'Water Elemental Crystal',
            '+22 Mana regen, +5 HP Regen',
            'items/water_elemental_crystal.webp'
        );
        this.isPassive = true;
    }
}

export { WaterElementalCrystal };
