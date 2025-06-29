import { BaseItem } from './base-item.js';

class LeviathansFang extends BaseItem {
    constructor() {
        super(
            'leviathans_fang',
            "Leviathan's Fang",
            'Your Q ability when used, it casts one additional time.',
            'items/leviathans_fang.webp'
        );
        this.isPassive = true;
    }

    // Passive items won't use the default use/update methods
    // Their effects will be handled by the game manager or character class
}

export { LeviathansFang };
