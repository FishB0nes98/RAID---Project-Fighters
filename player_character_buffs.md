# Character Buffs Collection

## Basic Buff Structure
```javascript
const buff = new Effect(
    'buff_id',              // Unique ID
    'Buff Name',            // Display name
    'path/to/icon.png',     // Icon path
    duration,               // Duration in turns
    effectFunction,         // Per-turn effect (optional)
    false                   // isDebuff (false for buffs)
).setDescription('Description of what the buff does');

// Stat modifiers
buff.statModifiers = {
    statName: value         // Direct value or percentage
};
```

## Combat & Defensive Buffs

### Dodge Buffs
1. **Dodge Boost** (Schoolboy Shoma)
   - ID: `dodge_boost`
   - Duration: 3 turns
   - Effects: 85% dodge chance
   - Source: Shoma's "Catch!" ability

2. **Homerun** (Schoolboy Shoma)
   - ID: `homerun_buff`
   - Duration: 3 turns
   - Effects: 100% dodge chance, resets all cooldowns
   - Source: Shoma's "Homerun" ability

3. **Quick Reflexes** (Schoolgirl Ayane)
   - ID: `schoolgirl_ayane_e_buff`
   - Duration: 2 turns
   - Effects: 100% dodge chance, increased Physical Damage
   - Source: Ayane's "Quick Reflexes" ability

4. **Rush Run** (Hound)
   - ID: `rush_run_dodge`
   - Duration: 3 turns
   - Effects: +50% dodge chance
   - Source: Hound's "Rush Run" ability

### Damage Buffs
1. **Enraged** (Angry Carrot)
   - ID: `anger_damage_buff`
   - Duration: 3 turns
   - Effects: Physical Damage increased by 500%
   - Source: Angry Carrot's "Anger" ability

2. **Primal Fury** (Cham Cham)
   - ID: `cham_cham_w_buff`
   - Duration: 5 turns
   - Effects: +8% lifesteal
   - Source: Cham Cham's "Primal Fury" ability

3. **Blessed Strength** (Schoolboy Siegfried)
   - ID: `siegfried_e_damage_buff`
   - Duration: 6 turns
   - Effects: +200 Physical Damage
   - Source: Siegfried's "Sword Blessing" ability

4. **Butterfly Trail Buff** (Schoolgirl Ayane)
   - ID: `schoolgirl_ayane_w_buff`
   - Duration: 4 turns
   - Effects: +20% Physical and Magical Damage
   - Source: Ayane's "Butterfly Trail" ability

5. **Storm Empowerment** (Farmer Raiden)
   - ID: `storm-empowerment-{timestamp}`
   - Duration: 3 turns
   - Effects: +300 Magical Damage
   - Source: Raiden's talent when stunning an enemy

6. **Farmer's Leap** (Farmer Cham Cham)
   - Duration: Varies
   - Effects: +Physical Damage based on bonus percent
   - Source: Farmer Cham Cham's "Leap" ability

7. **Vampiric Leap** (Farmer Cham Cham - Talent)
   - ID: `farmer_leap_lifesteal_buff`
   - Duration: Same as Leap
   - Effects: Additional lifesteal bonus
   - Source: Farmer Cham Cham's "Vampiric Leap" talent

### Shield & Defensive Buffs
1. **Thunder Shield** (Farmer Raiden)
   - ID: `thunder_shield_buff`
   - Duration: 5 turns
   - Effects: Increases Magical Shield by percent, triggers Zap passive twice per turn
   - Source: Raiden's "Thunder Shield" ability

2. **Fire Shield** (Infernal Birdie)
   - ID: `fire_shield_buff`
   - Duration: 5 turns
   - Effects: Reduces incoming damage by 25%, retaliates for 50% of damage taken
   - Source: Birdie's "Fire Shield" ability

3. **Spiritwalk Shield** (Atlantean Kagome)
   - ID: `kagome_e_shield_buff`
   - Duration: 4 turns
   - Effects: 200% increased armor and magic shield
   - Source: Kagome's "Spiritwalk" ability

4. **Defensive Stance** (Schoolgirl Elphelt)
   - ID: `schoolgirl_elphelt_passive_buff`
   - Duration: 3 turns
   - Effects: +10 Armor and +10 Magic Shield
   - Source: Elphelt's passive after using any ability

5. **Affection** (Schoolgirl Elphelt)
   - ID: `affection_buff_{targetId}`
   - Duration: 4 turns
   - Effects: 50% less damage from specific target
   - Source: Elphelt's "Affection" ability

### Healing & Support Buffs
1. **Healing Boost** (Infernal Birdie)
   - ID: `drink_up_healing_power_buff`
   - Duration: 4 turns
   - Effects: +20% Healing Power
   - Source: Birdie's "Drink Up!" ability

2. **Nurturing Toss** (Farmer Shoma - Talent)
   - ID: `nurturing_toss_buff`
   - Duration: 5 turns
   - Effects: +5% Healing Power per stack (max 5 stacks)
   - Source: Shoma's "Apple Throw" with talent

3. **Healing Sprout** (Schoolgirl Julia)
   - ID: Various IDs
   - Duration: 2 turns
   - Effects: Heals target for 1250 (+Healing Power) when expired
   - Source: Julia's "Sprout Planting" ability

### Special Effect Buffs
1. **Shadow Step** (Infernal Ibuki)
   - ID: `shadow_step_buff`
   - Duration: 4 turns
   - Effects: Makes character untargetable
   - Source: Ibuki's "Shadow Step" ability

2. **Golden Power** (Atlantean Kagome)
   - ID: `kagome_w_buff`
   - Duration: 6 turns
   - Effects: Increases Ability Power based on enemies hit
   - Source: Kagome's "Scatter Golden Arrows" ability

3. **Farmer Died** (Crazy Farmer Passive)
   - ID: `farmer_died_buff` 
   - Duration: Permanent
   - Effects: Doubles all stats
   - Source: Crazy Farmer's death passive

4. **Thunder Perception** (Farmer Raiden - Talent)
   - ID: `thunder_perception_crit_{timestamp}`
   - Duration: 3 turns
   - Effects: +10% Critical Chance
   - Source: Raiden's "Thunder Perception" talent when receiving a buff

5. **Hiding** (Farmer Nina)
   - ID: `farmer_nina_w_hiding_buff`
   - Duration: Varies
   - Effects: Makes character untargetable until taking damage
   - Source: Nina's Hiding ability

## Talent & Passive-Generated Buffs

1. **Desperate Strength** (Farmer Cham Cham)
   - Triggered when below health threshold
   - Effects: Varies based on talents

2. **Farmer's Resilience** (Farmer Cham Cham)
   - Effects: Permanent Physical Damage and Lifesteal boosts
   - Source: Passive talent

3. **Critical Focus** (Farmer Cham Cham)
   - Effects: Permanent Critical Chance boost
   - Source: Passive talent

4. **Sharp Focus** (Farmer Cham Cham)
   - Effects: Crit boost after dodging
   - Source: Talent trigger

5. **Buff Connoisseur** (Schoolboy Siegfried)
   - Effects: +125 Physical Damage per active buff
   - Source: Siegfried's passive 