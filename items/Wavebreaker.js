import { BaseItem } from './base-item.js';

class Wavebreaker extends BaseItem {
    constructor() {
        super(
            'wavebreaker',
            'Wavebreaker',
            '+30 Physical Damage +150 HP',
            'items/wavebreaker.webp'
        );
        this.isPassive = true;
    }
}

export { Wavebreaker };
