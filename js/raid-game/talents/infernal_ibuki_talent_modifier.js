/**
 * Infernal Ibuki Talent Modifier
 * 
 * This file handles all talent-related modifications for Infernal Ibuki
 * to avoid cluttering the main talent-manager.js file.
 */

class InfernalIbukiTalentModifier {
    constructor() {
        this.modifierName = 'InfernalIbukiTalentModifier';
        this.characterId = 'infernal_ibuki';
    }

    /**
     * Apply talent effects specific to Infernal Ibuki
     * @param {Object} character - The character object
     * @param {Object} effect - The talent effect to apply
     * @returns {boolean} - Whether the effect was successfully applied
     */
    applySpecialTalentEffect(character, effect) {
        if (character.id !== this.characterId) {
            return false;
        }

        console.log(`[InfernalIbukiTalentModifier] Applying special talent effect: ${effect.specialType} to ${character.name}`);

        switch (effect.specialType) {
            case 'elemental_mastery':
                return this.applyElementalMastery(character, effect);
            default:
                console.warn(`[InfernalIbukiTalentModifier] Unknown special talent effect: ${effect.specialType}`);
                return false;
        }
    }

    /**
     * Apply Elemental Mastery talent effect
     * This modifies the Kunai Throw ability to scale with magical damage
     * @param {Object} character - The character object
     * @param {Object} effect - The talent effect
     * @returns {boolean} - Success status
     */
    applyElementalMastery(character, effect) {
        try {
            character.hasElementalMastery = true;
            character.elementalMasteryMagicalScaling = effect.magicalScaling || 0.5;

            const kunaiThrowAbility = character.abilities.find(ability => ability.id === 'kunai_throw');
            if (kunaiThrowAbility) {
                kunaiThrowAbility.effect = enhancedKunaiThrowEffect;
                this.updateKunaiThrowDescription(character);
            }

            console.log(`[InfernalIbukiTalentModifier] Elemental Mastery applied to ${character.name}`);
            return true;
        } catch (error) {
            console.error(`[InfernalIbukiTalentModifier] Error applying Elemental Mastery:`, error);
            return false;
        }
    }

    /**
     * Update Kunai Throw ability description to reflect the talent
     * @param {Object} character - The character object
     */
    updateKunaiThrowDescription(character) {
        const kunaiThrowAbility = character.abilities.find(ability => ability.id === 'kunai_throw');
        if (kunaiThrowAbility) {
            const magicalScalingPercent = character.elementalMasteryMagicalScaling * 100;
            kunaiThrowAbility.description = `Deals <span class='damage-text'>250 + 100%</span> Physical Damage and <span class='damage-text'>${magicalScalingPercent}%</span> Magical Damage to the target. Each use grants <span class='utility-text'>+10%</span> damage permanently (max 15 stacks).`;
        }
    }

    /**
     * Update character after talents are applied
     * @param {Object} character - The character object
     */
    updateCharacterAfterTalent(character) {
        if (character.id !== this.characterId) {
            return;
        }

        // Update ability descriptions if needed
        if (character.hasElementalMastery) {
            this.updateKunaiThrowDescription(character);
        }

        // Update UI if available
        if (window.gameManager && window.gameManager.uiManager) {
            window.gameManager.uiManager.updateCharacterUI(character.id);
        }

        console.log(`[InfernalIbukiTalentModifier] Character ${character.name} updated after talent application`);
    }
}

/**
 * Enhanced Kunai Throw Effect with Elemental Mastery support
 * This replaces the original kunaiThrowEffect when Elemental Mastery is active
 */
const enhancedKunaiThrowEffect = (caster, target) => {
    const log = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
    const playSound = window.gameManager ? window.gameManager.playSound.bind(window.gameManager) : () => {};

    // Base damage components
    const baseFixedDamage = 250;
    const basePhysicalScaling = 1.0; // 100% Physical Damage scaling

    // Calculate physical damage component
    let physicalDamage = baseFixedDamage + (caster.stats.physicalDamage * basePhysicalScaling);

    // Add magical damage component if Elemental Mastery is active
    let magicalDamage = 0;
    if (caster.hasElementalMastery && caster.elementalMasteryMagicalScaling) {
        magicalDamage = caster.stats.magicalDamage * caster.elementalMasteryMagicalScaling;
    }

    // Total base damage before passive multiplier
    let totalBaseDamage = physicalDamage + magicalDamage;

    // Apply Blade Expertise passive multiplier (10% per stack, max 15 stacks = 150%)
    const passiveMultiplier = (caster.kunaiStacks !== undefined) ? (1 + (caster.kunaiStacks * 0.10)) : 1;
    totalBaseDamage *= passiveMultiplier;

    // Use the character's calculateDamage to factor in crit/defense
    const finalDamage = caster.calculateDamage(totalBaseDamage, 'physical', target);

    // Check for critical hit to trigger passive
    const damageResult = target.applyDamage(finalDamage, 'physical', caster, { abilityId: 'kunai_throw' });
    
    // Trigger critical hit passive if it was a crit
    if (damageResult.isCritical && typeof caster.onCriticalHit === 'function') {
        caster.onCriticalHit();
    }

    // Track statistics
    if (window.statisticsManager) {
        window.statisticsManager.recordAbilityUsage(caster, 'kunai_throw', 'use', 1);
        window.statisticsManager.recordDamageDealt(caster, target, damageResult.damage, 'physical', damageResult.isCritical, 'kunai_throw');
    }

    // Create damage breakdown text
    let damageBreakdown = '';
    if (caster.hasElementalMastery && magicalDamage > 0) {
        const magicalDamagePart = caster.calculateDamage(magicalDamage * passiveMultiplier, 'magical', target);
        damageBreakdown = ` (+${magicalDamagePart.damage} magic)`;
    }

    const stackText = caster.kunaiStacks ? ` (Passive: +${(caster.kunaiStacks * 10)}%)` : '';
    log(`${caster.name} throws a Kunai at ${target.name}, dealing ${damageResult.damage} physical damage${damageBreakdown}${stackText}${damageResult.isCritical ? ' (Critical!)' : ''}`);

    // Play sounds
    playSound('sounds/kunai_throw.mp3', 0.7);

    // Show enhanced VFX
    if (typeof showEnhancedKunaiTossVFX === 'function') {
        showEnhancedKunaiTossVFX(caster, target);
    }

    // Update UI
    if (typeof updateCharacterUI === 'function') {
        updateCharacterUI(caster.id);
        updateCharacterUI(target.id);
    }

    return true;
};

// Initialize the modifier and register it globally
window.infernalIbukiTalentModifier = new InfernalIbukiTalentModifier();

// Register the modifier with the talent manager when it's available
document.addEventListener('DOMContentLoaded', () => {
    if (window.talentManager) {
        window.talentManager.registerModifier('infernal_ibuki', window.infernalIbukiTalentModifier);
    }
});
