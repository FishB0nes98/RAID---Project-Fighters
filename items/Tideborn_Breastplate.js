import { BaseItem } from './base-item.js';

class TidebornBreastplate extends BaseItem {
    constructor() {
        super(
            'tideborn_breastplate',
            'Tideborn Breastplate',
            'Heals 5% of the damage received.',
            'items/tideborn_breastplate.webp'
        );
        this.isPassive = true;
    }
}

export { TidebornBreastplate };
