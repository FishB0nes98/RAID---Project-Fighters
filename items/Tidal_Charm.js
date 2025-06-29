import { BaseItem } from './base-item.js';

class TidalCharm extends BaseItem {
    constructor() {
        super(
            'tidal-charm',
            'Tidal Charm',
            'When you heal, a random ally is also healed for 25% of the original amount.',
            './assets/icons/items/tidal-charm.png' // Placeholder path
        );
        this.isPassive = true;
    }

    // Passive items won't use the default use/update methods
    // Their effects will be handled by the game manager or character class
}

export { TidalCharm };
