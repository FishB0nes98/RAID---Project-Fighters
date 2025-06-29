import { BaseItem } from '../base-item.js';

class MurkyWaterVial extends BaseItem {
    constructor() {
        super(
            'murky_water_vial',
            'Murky Water Vial',
            'A vial of murky water, used for crafting.',
            'items/Murky_Water_Vial.png'
        );
        this.isCraftingMaterial = true;
    }
}

export { MurkyWaterVial };
