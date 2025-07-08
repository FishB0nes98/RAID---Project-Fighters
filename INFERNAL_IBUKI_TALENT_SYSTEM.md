# Infernal Ibuki Talents Documentation

## How to Implement Infernal Ibuki Talents (Step-by-Step Guide)

This guide explains how to correctly add new talents for Infernal Ibuki in this project. Please follow these steps and conventions to ensure all logic is maintainable, modular, and consistent with the current system.

---

### 1. **Where to Put Logic**
- **All logic for Infernal Ibuki's talents is now integrated into:**
  - `js/raid-game/talent-manager.js` (specifically within the `applyTalentsToCharacter` function for `infernal_ibuki`).
- **Stat modifications are applied using the `character.applyStatModification` method to ensure they are correctly added to `baseStats` and trigger `recalculateStats`.**
- **Individual talent modifier files like `js/raid-game/talent-modifiers/infernal_ibuki_talent_modifier.js` have been removed to centralize logic.**
- This approach ensures talents are applied consistently through the main talent management system.

---

### 2. **Defining Talents**
- Add new talent definitions and metadata to:
  - `js/raid-game/talents/infernal_ibuki_talents.json`
- Each talent should have a unique ID (e.g., `infernal_ibuki_t1`), name, description, tier, position, and any unlock requirements (parents/children).

---

### 3. **Ability Logic & Descriptions**
- If a talent modifies or adds to an ability (e.g., Kunai Throw/Q):
  - Implement core ability logic in `js/raid-game/abilities/infernal_ibuki_abilities.js`.
  - **Talent-specific descriptions** are also handled in this file, within functions like `getKunaiThrowDescription(character)`.
  - For visuals, use `js/raid-game/abilities/infernal_ibuki_abilities.css`.
  - **Talent-specific effects** (e.g., scaling, stat boosts, or special triggers like Urarenge) are applied directly within `js/raid-game/talent-manager.js` when the talents are processed.

---

### 4. **Applying Talents**
- Talents are automatically applied by the `TalentManager` during character setup or when talents are granted.
- The `TalentManager`'s `applyTalentsToCharacter` function now directly handles Infernal Ibuki's talent effects.
- The `updateIbukiAbilityDescriptionsForTalents` function in `js/raid-game/abilities/infernal_ibuki_abilities.js` is called to update the UI.

---

### 5. **Example: Root Talent Implementation**
- **Talent:** Elemental Mastery
  - Increases Infernal Ibuki's Magical Damage by **60**.
  - Her Kunai Throw (Q) now scales with an additional **50%** of her Magical Damage.
- **Implementation:**
  - All logic is now handled directly within `js/raid-game/talent-manager.js` under the `infernal_ibuki` special talent type processing.
  - Stat bonuses are applied using `character.applyStatModification('statName', 'add', value)`.

---

### 6. **Testing and Debugging**
- Test new talents in the game using the character selection and talent UI.
- Use the browser console for debugging. Add logs in `js/raid-game/abilities/infernal_ibuki_abilities.js` or `js/raid-game/talent-manager.js` if needed.
- Do not add debug or test code to global managers.

---

- **infernal_ibuki_talents.json**: Talent definitions and metadata.
- **infernal_ibuki_abilities.js**: Ability logic and description updates, including Kunai Throw (Q) and Swift Strike.
- **infernal_ibuki_abilities.css**: Visuals for abilities.
- **talent-manager.js**: All logic for Infernal Ibuki's talent effects are now applied directly within this file.

---

### 7. **Generating Icons**
- Use the DALL-E MCP server to generate talent icons and buff/debuff icons.
- Ensure icons visually match the ability and character theme (e.g., Infernal Ibuki's aesthetic).
- When generating, use prompts that describe the desired visual style and context.
- path: D:\Programs\Champion Selector website\Card Game\Icons\talents

---

### 8. **Best Practices**
- All Ibuki-specific talent logic is now centralized in `talent-manager.js`.
- Use clear, unique IDs for talents (e.g., `infernal_ibuki_t1`, `infernal_ibuki_t2`).
- Document new talents in this markdown file as you add them.
- Link this file in future chats or documentation for reference.

---

## Talents

- **Elemental Mastery** (`infernal_ibuki_t1`)
  - Increases Infernal Ibuki's Magical Damage by **60**.
  - Her Kunai Throw (Q) now scales with an additional **50%** of her Magical Damage.

- **Kunai Mastery Awakening** (`infernal_ibuki_t2`)
  - Kunai Throw cooldown is reduced to **0**.
  - Kunai Throw now has a **17%** chance to end your turn (does not call acted).

- **Infernal Edge** (`infernal_ibuki_t3`)
  - Gains **11%** crit chance.

- **Urarenge** (`infernal_ibuki_t4`)
  - If Swift Strike Crits, it deals damage to the same target again (before dash to another target).

- **Vampiric Strikes** (`infernal_ibuki_t5`)
  - Your critical strikes heal you for 25% of the damage dealt.
  - Prerequisite: Urarenge

- **Savage Blade** (`infernal_ibuki_t6`)
  - Ibuki starts with bonus 75 Phyiscal Damage.
  - Prerequisite: Infernal Edge

- **Critical Stack** (`infernal_ibuki_t8`)
  - Your critical strikes now count 1 additional passive stack.
  - Prerequisite: Vampiric Strikes, Swift Blade Expertise

- **Infernal Kunais** (`infernal_ibuki_t9`)
  - Your Kunai Throw applies a Blazing debuff on the target. It is a permanent debuff but can be removed.
  - It deals 100% of Ibuki's Magical Damage to the debuff holder every turn.
  - Prerequisite: Smoke Bomb (E)

- **Swift Shadow** (`infernal_ibuki_t16`)
  - Decreases Shadow Veil cooldown by 2 turns.
  - Prerequisite: Kunai Mastery Awakening, Twin Shadow Strike

- **Doubled Physical Damage** (`infernal_ibuki_t14`)
  - At turn 25, your physical damage is doubled permanently.
  - Prerequisite: Savage Blade

- **Smoke Bomb Enhancement** (`infernal_ibuki_t13`)
  - Increases Smoke Bomb's DOT fixed damage by 50.
  - Increases Smoke Bomb's DOT magical scaling by 20% (total 70%).
  - Prerequisite: Shadow Strike

- **Critical Damage Boost** (`infernal_ibuki_t9`)
  - Increases Critical Damage by 20%.

- **Blade Expertise Enhancement** (`infernal_ibuki_t10`)
  - Increases Blade Expertise bonus by 5%.

- **Kunai Barrage** (`infernal_ibuki_t11`)
  - Kunai Throw now hits all enemies.
  - It has 100% chance to hit main target.
  - Has 70% chance to hit all other enemies (70%/enemy).
  - Prerequisite: Critical Damage Boost, Blade Expertise Enhancement

### Implementation Notes

- The logic for these talents is handled directly within `js/raid-game/talent-manager.js`.
- Talent description updates are handled in `js/raid-game/abilities/infernal_ibuki_abilities.js`.
- Talents are automatically applied by the `TalentManager`. There is no need to manually call any talent application function.

---

## Next Steps

- Add more talents to this file as they are designed.
- Link this documentation in future chats for reference.
