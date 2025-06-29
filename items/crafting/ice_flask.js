import { BaseItem } from '../base-item.js';

class IceFlask extends BaseItem {
    constructor() {
        super(
            'ice_flask',
            'Ice Flask',
            'A flask containing a chilling liquid. Used in ice-related crafting recipes.',
            'items/ice_flask.png'
        );
        this.isCraftingMaterial = true;
    }
}

export { IceFlask };
