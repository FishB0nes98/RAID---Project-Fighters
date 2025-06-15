# Stage Modifiers Reference Table

This document provides a comprehensive overview of all available stage modifiers in the game, their effects, triggers, and implementation details.

## Table of Contents
- [Damage & Environmental Modifiers](#damage--environmental-modifiers)
- [Healing & Support Modifiers](#healing--support-modifiers)
- [Stat Modification Modifiers](#stat-modification-modifiers)
- [Combat Enhancement Modifiers](#combat-enhancement-modifiers)
- [Special Mechanics Modifiers](#special-mechanics-modifiers)

---

## Damage & Environmental Modifiers

| Modifier ID | Name | Icon | Description | Effect | Trigger | Target |
|-------------|------|------|-------------|--------|---------|---------|
| `burning_ground` | Burning Ground | 🔥 | The ground is ablaze with hellish flames! Player characters take fire damage at the start of each turn. | 150 fire damage per turn | `onTurnStart` | Player characters only |
| `toxic_miasma` | Toxic Miasma | ☠️ | Poisonous gas fills the air! All characters take poison damage each turn. | 75 poison damage per turn | `onTurnStart` | All characters |
| `smoke_cloud` | Smoke Cloud | ☁️ | Dense smoke clouds the battlefield. Player abilities have a 21% chance to miss completely and go on cooldown. | 21% miss chance for player abilities | Passive | Player abilities only |

---

## Healing & Support Modifiers

| Modifier ID | Name | Icon | Description | Effect | Trigger | Target |
|-------------|------|------|-------------|--------|---------|---------|
| `healing_wind` | Healing Wind | 🌬️ | A gentle breeze carries healing energy across the battlefield. | 1% max HP healing per turn | `onTurnStart` | All characters (configurable) |
| `its_raining_man` | It's raining man! | 🌧️ | Heavy rain falls from the burning sky! All player characters heal HP each turn. | 100 HP healing per turn | `onTurnStart` | Player characters only |
| `carried_medicines` | Carried medicines | 💊 | Medical supplies scattered around provide periodic mana recovery. Every fifth turn, restores 10% of maximum mana for player characters. | 10% max mana restoration every 5 turns | `onTurnStart` (turn counter) | Player characters only |
| `pack_healing` | Pack Healing | 🩺 | When an enemy dies, all remaining enemies heal to full HP. The bond between these beasts runs deep. | Full HP restoration for all living enemies | `onCharacterDeath` | Enemy characters |
| `healing_mana_flow` | Healing Mana Flow | 💧 | Healing energy is supercharged: whenever a character is healed, they also restore 20% of the heal amount as mana. | +20% of heal amount as mana | Passive (during healing) | All characters |

---

## Stat Modification Modifiers

| Modifier ID | Name | Icon | Description | Effect | Trigger | Target |
|-------------|------|------|-------------|--------|---------|---------|
| `frozen_ground` | Frozen Ground | ❄️ | The ground is frozen solid! All characters move 25% slower. | -25% speed | `onStageStart` | All characters |
| `small_space` | Small Space | 🚪 | The confined space makes dodging impossible! All characters have their dodge chance reduced to 0. | Dodge chance set to 0% | `onStageStart` + `onTurnStart` | All characters |
| `desert_heat` | Desert Heat | 🌵 | The scorching desert heat heightens reflexes and vitality! All characters have their critical strike chance set to 50%, HP regeneration set to 50, and mana regeneration set to 50. | Crit chance = 50%, HP regen = 50, Mana regen = 50 | `onStageStart` + `onTurnStart` | All characters |

---

## Combat Enhancement Modifiers

| Modifier ID | Name | Icon | Description | Effect | Trigger | Target |
|-------------|------|------|-------------|--------|---------|---------|
| `enchanted_weapon` | Enchanted Weapon | ⚔️ | The demonic forge's magic empowers enemy weapons. Every 5th turn, enemy physical damage increases by 15%. | +15% physical damage per milestone (cumulative) | `onTurnStart` (every 5th turn) | Enemy characters |
| `aggressive_protection` | Aggressive Protection | 🛡️ | The castle guardians inspire fierce combat! When a character dodges, they gain +30% dodge chance for 3 turns. When someone deals damage, they gain +100 magical damage and +80 physical damage for 3 turns (stacking). | Dodge: +30% dodge for 3 turns<br>Damage: +100 magical + 80 physical for 3 turns | Event listeners (`character:dodged`, `character:damage-dealt`) | All characters |

---

## Special Mechanics Modifiers

| Modifier ID | Name | Icon | Description | Effect | Trigger | Target |
|-------------|------|------|-------------|--------|---------|---------|
| `healing_disabled` | Healing Disabled | 🚫💚 | A malevolent curse prevents all healing! No character can recover HP through any means. | Completely disables all healing | `onStageStart` (flag set) | All characters |
| `healing_fire` | Healing Fire | 🔥💚 | The infernal flames corrupt all healing! Whenever a player character heals, they take 22% of the heal amount as fire damage. | 22% of heal amount as fire damage | Passive (during healing) | Player characters only |
| `essence_transfer` | Essence Transfer | 💀 | When a character dies, their remaining power is transferred to a random survivor, adding each of their stats to the recipient. The transfer is additive and can stack indefinitely. | All stats of dead character transferred to random survivor | `onCharacterDeath` | All characters |

---

## Implementation Details

### Trigger Types
- **`onStageStart`**: Executes once when the stage begins
- **`onTurnStart`**: Executes at the beginning of each turn
- **`onTurnEnd`**: Executes at the end of each turn
- **`onStageEnd`**: Executes when the stage ends (cleanup)
- **`onCharacterDeath`**: Executes when a character dies
- **Passive**: Continuously active or triggered by specific game events
- **Event Listeners**: Uses custom event system for real-time triggers

### VFX System
Most modifiers include visual effects:
- **Particle Systems**: Floating particles, embers, sparks
- **Overlay Effects**: Screen-wide visual overlays with animations
- **Character Effects**: Individual character visual feedback
- **Environmental Effects**: Stage background modifications

### Technical Notes
- All modifiers are registered in the `StageModifiersRegistry` class
- Modifiers can stack and interact with each other
- Some modifiers store original values for restoration on stage end
- Event-based modifiers use `document.addEventListener` for real-time triggers
- VFX cleanup is handled automatically with timed removal

### Balancing Considerations
- **Player vs Enemy Targeting**: Some modifiers specifically target only players or enemies
- **Cumulative Effects**: Some modifiers stack (like Enchanted Weapon), others replace values
- **Turn-based vs Immediate**: Different timing for various strategic impacts
- **Counterplay**: Most negative effects have strategic workarounds or limited duration

---

## Usage in Stages

To use these modifiers in stage definitions, add them to the `stageEffects` array:

```json
{
  "stageEffects": [
    {
      "id": "burning_ground",
      "effect": {
        "value": 150,
        "damageType": "fire"
      }
    },
    {
      "id": "desert_heat"
    }
  ]
}
```

Some modifiers accept configuration through the `effect` object to customize their behavior. 