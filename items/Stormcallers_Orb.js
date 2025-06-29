import { BaseItem } from './base-item.js';

class StormcallersOrb extends BaseItem {
    constructor() {
        super(
            'stormcallers_orb',
            "Stormcaller's Orb",
            'Increases Crit Damage by an additional 20%.',
            'items/stormcallers_orb.webp'
        );
        this.isPassive = true;
    }
}

export { StormcallersOrb };
