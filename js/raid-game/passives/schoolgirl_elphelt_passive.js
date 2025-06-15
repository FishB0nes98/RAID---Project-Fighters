// Passive handler for Schoolgirl Elphelt: Defensive Stance

class SchoolgirlElpheltPassive {
    constructor() {
        this.buffId = 'schoolgirl_elphelt_passive_buff';
        this.buffName = 'Defensive Stance';
        this.buffIcon = 'Icons/abilities/defensive_stance.webp';
        this.duration = 3;
        this.armorBonus = 10;
        this.shieldBonus = 10;
    }

    initialize(character) {
        this.character = character;
        console.log(`SchoolgirlElpheltPassive initialized for ${character.name}`);
    }

    // This method is now called centrally from Ability.use
    onAbilityCast(caster, abilityUsed) { // caster is passed from Ability.use
        // Ensure the handler is associated with the correct character
        if (!this.character || this.character !== caster) {
             console.warn('Elphelt passive triggered for wrong character?', caster, this.character);
             return; 
        }
        
        const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : addLogEntry;
        log(`${this.character.name}'s passive 'Defensive Stance' triggers from using ${abilityUsed.name}!`);

        // Create the stackable buff
        // Using a *unique* ID per stack allows multiple buffs to co-exist and sum up
        const buff = new Effect(
            `${this.buffId}_${Date.now()}_${Math.random()}`, // Unique ID for each stack instance
            this.buffName, // Keep the name the same for grouping/display
            this.buffIcon,
            this.duration,
            null, // No per-turn effect needed
            false
        );

        buff.statModifiers = {
            armor: this.armorBonus,
            magicalShield: this.shieldBonus
        };

        buff.setDescription(`+${this.armorBonus} Armor, +${this.shieldBonus} Magical Shield for ${this.duration} turns.`);
        
        // Define remove behavior (optional, for logging)
        buff.remove = (character) => {
            log(`${character.name}'s Defensive Stance stack fades.`);
            // Recalculation happens in Character.removeBuff
        };

        this.character.addBuff(buff); // Add the new buff instance
        log(`${this.character.name} gains a stack of Defensive Stance (+${this.armorBonus} Armor, +${this.shieldBonus} Shield).`);
        
        // === STATISTICS TRACKING ===
        if (typeof trackDefensiveManeuversStats === 'function') {
            trackDefensiveManeuversStats(this.character, this.armorBonus, this.shieldBonus);
        } else if (window.statisticsManager) {
            // Fallback tracking if global function not available
            try {
                // Track passive buff application
                window.statisticsManager.recordStatusEffect(this.character, this.character, 'defensive_buff', 'defensive_maneuvers', false, 'schoolgirl_elphelt_passive');
                
                // Track passive usage
                window.statisticsManager.recordAbilityUsage(this.character, 'schoolgirl_elphelt_passive', 'buff', this.armorBonus + this.shieldBonus, false);
                
                console.log(`[ElpheltPassiveStats] Tracked Defensive Maneuvers: +${this.armorBonus} Armor, +${this.shieldBonus} Magic Shield`);
            } catch (error) {
                console.error('[ElpheltPassiveStats] Error tracking Defensive Maneuvers stats:', error);
            }
        }
        // === END STATISTICS TRACKING ===
        
        // Play passive trigger VFX
        const charElement = document.getElementById(`character-${this.character.id}`);
        if (charElement) {
            const vfx = document.createElement('div');
            vfx.className = 'elphelt-passive-vfx'; // Add specific class for styling
            // You might want to add some visual content or animation via CSS
            charElement.appendChild(vfx);
            setTimeout(() => vfx.remove(), 1000); // Remove after 1 second
        }

        // updateCharacterUI is called by addBuff, no need to call again
        // updateCharacterUI(this.character);
    }
}

// Make the class available globally or export it if using modules
if (typeof window !== 'undefined') {
    window.SchoolgirlElpheltPassive = SchoolgirlElpheltPassive;
} 