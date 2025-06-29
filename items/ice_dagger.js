import { BaseItem } from './base-item.js';

class IceDagger extends BaseItem {
    constructor() {
        super(
            'ice_dagger',
            'Ice Dagger',
            '+25 AD. Gives your Q ability 10% chance to freeze the target for 2 turns.',
            'items/ice_dagger.png'
        );
        this.isPassive = true;
        this.adBonus = 25;
        this.effects = {
            onAbility: {
                ability: 'Q',
                chance: 0.1,
                effect: 'freeze',
                duration: 2, // turns
            }
        };
    }
}

export { IceDagger };
