// Passive Handler for Schoolgirl Ayane

class SchoolgirlAyanePassive {
    constructor() {
        this.passiveId = 'schoolgirl_ayane_passive';
        this.buffId = 'schoolgirl_ayane_passive_ad_buff';
        this.buffName = 'Combat Reflex';
        this.buffIcon = 'Icons/abilities/passive_schoolgirl_ayane.webp'; // Correct path
        this.physicalDamageBonus = 200;
        this.buffDuration = 5; 
    }

    initialize(character) {
        // Optional: Can be used for setup when the character is created
        console.log(`Schoolgirl Ayane Passive initialized for ${character.name}`);
    }

    /**
     * Called when the character successfully dodges an attack.
     * @param {Character} character - The character instance (Ayane) that dodged.
     */
    onDodge(character) {
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

        log(`${character.name}'s Combat Reflexes triggers after dodging!`);
        playSound('sounds/ayane_fucker2.mp3'); // Play dodge sound

        // Create the Physical Damage buff
        const adBuff = new Effect(
            this.buffId,
            this.buffName,
            this.buffIcon,
            this.buffDuration,
            null, // No per-turn effect
            false // Not a debuff
        ).setDescription(`+${this.physicalDamageBonus} Physical Damage for ${this.buffDuration} turns.`);

        // Add the stat modifier
        adBuff.statModifiers = [{ stat: 'physicalDamage', value: this.physicalDamageBonus, operation: 'add' }];

        // Define remove function for cleanup
        adBuff.remove = (char) => {
            log(`${char.name}'s Combat Reflex bonus fades.`);
            // Note: Stat reversion is handled by the core Character.removeBuff method
        };

        // Apply the buff (or refresh duration if already active)
        character.addBuff(adBuff.clone());
        log(`${character.name} gains +${this.physicalDamageBonus} Physical Damage for ${this.buffDuration} turns!`);

        // --- Add Passive Proc VFX ---
        const charElement = document.getElementById(`character-${character.id}`);
        if (charElement) {
            const passiveVfx = document.createElement('div');
            passiveVfx.className = 'schoolgirl-ayane-passive-proc-vfx'; // Specific class
            charElement.appendChild(passiveVfx);

            // Example: A brief, bright flash
            passiveVfx.style.animation = 'ayane-passive-flash 0.6s ease-out forwards';
            
            // Text indicator (optional)
            const vfxText = document.createElement('div');
            vfxText.className = 'passive-vfx-text';
            vfxText.textContent = '+AD!';
            charElement.appendChild(vfxText);
            
            setTimeout(() => {
                 passiveVfx.remove();
                 vfxText.remove();
            }, 600);
        }
        // --- End VFX ---

        // Update UI
        updateCharacterUI(character);
    }
}

// Make the class available globally or ensure it's properly imported/managed
if (typeof window !== 'undefined') {
    window.SchoolgirlAyanePassive = SchoolgirlAyanePassive;
} 