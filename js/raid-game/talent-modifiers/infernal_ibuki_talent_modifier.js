/**
 * Handles special talent effects for Infernal Ibuki.
 */
class InfernalIbukiTalentModifier {
    constructor() {
        // No longer need listeners or activeShadowVeilTalents here
    }

    /**
     * Applies all Infernal Ibuki's special talents.
     * This function is called from TalentManager.applySpecialTalentEffect
     * @param {Character} character - The character to apply talents to.
     * @param {Array<string>} appliedTalentIds - IDs of all talents applied to the character.
     * @param {Array|Object} allAbilities - Character's abilities (can be an array or an object/map).
     */
    applyTalents(character, appliedTalentIds, allAbilities) {
        try {
            // Ensure allAbilities is an iterable array for find method
            let abilitiesArray = [];
            if (Array.isArray(allAbilities)) {
                abilitiesArray = allAbilities;
            } else if (typeof allAbilities === 'object' && allAbilities !== null) {
                // If it's an object/map (like abilitiesById or abilitiesMap), convert to array of values
                abilitiesArray = Object.values(allAbilities);
            }

            // Elemental Mastery: +60 magical damage, +50% magical scaling on Kunai Throw
            if (appliedTalentIds.includes('infernal_ibuki_t1')) {
                character.magicalDamage = (character.magicalDamage || 0) + 60;
                const kunaiThrowAbility = abilitiesArray.find(ability => ability.id === 'kunai_throw');
                if (kunaiThrowAbility) {
                    kunaiThrowAbility.magicalScaling = (kunaiThrowAbility.magicalScaling || 0) + 0.5;
                }
            }

            // Kunai Mastery Awakening: cooldown 0, 17% chance to end turn
            if (appliedTalentIds.includes('infernal_ibuki_t2')) {
                const kunaiThrowAbility = abilitiesArray.find(ability => ability.id === 'kunai_throw');
                if (kunaiThrowAbility) {
                    kunaiThrowAbility.cooldown = 0;
                    kunaiThrowAbility.kunaiEndTurnChance = 0.17;
                }
            }

            // Infernal Edge: +11% crit chance
            if (appliedTalentIds.includes('infernal_ibuki_t3')) {
                character.critChance = (character.critChance || 0) + 0.11;
            }

            // Urarenge: Swift Strike crits deal damage again
            const swiftStrikeAbility = abilitiesArray.find(ability => ability.id === 'swift_strike');
            if (appliedTalentIds.includes('infernal_ibuki_t4') && swiftStrikeAbility) {
                swiftStrikeAbility.urarenge = true;
            }

            // Shadow Dancer: No direct stat change here. The logic is now handled within shadowVeilEffect in abilities.js
            // This talent just flags that the ability should apply an extra buff.
            // The presence of this talent ID in appliedTalents is checked by shadowVeilEffect.
            if (appliedTalentIds.includes('infernal_ibuki_t5')) {
                console.log(`[InfernalIbukiTalentModifier] Shadow Dancer talent (infernal_ibuki_t5) is active for ${character.name}. Shadow Veil ability will handle crit buff application.`);
            }

        } catch (err) {
            console.error('[InfernalIbukiTalentModifier] Error applying Infernal Ibuki special talent:', err);
        }
    }

    // No longer need checkShadowVeilStatus, applyShadowVeilCritBonus, removeShadowVeilCritBonus,
    // onBuffApplied, onBuffRemoved, or destroy methods as their logic is moved.
}

// Export a singleton instance
window.infernalIbukiTalentModifier = new InfernalIbukiTalentModifier();
