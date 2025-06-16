# Project Fighters - Changelog

## Patch 0.2.1 - Infernal Ibuki Hotfix Buffs
*Released: [Current Date]*

### Character Balance Changes

#### 🥷 Infernal Ibuki - Power Enhancement
**Rationale**: Infernal Ibuki was underperforming compared to other carry characters. These buffs significantly enhance her damage scaling and utility to make her more competitive.

**Changes:**
- **Blade Expertise Passive**: Damage bonus per stack increased from **+2% → +10%** per stack
- **Blade Expertise Passive**: Maximum stacks increased from **10 → 15** stacks  
- **Total Passive Potential**: Now provides up to **+150% damage** at max stacks (was +20%)
- **Swift Strike (E)**: Chain chance increased from **30% → 45%**
- **Shadow Veil (W)**: Cooldown reduced from **16 → 11** turns

**Impact**: These changes transform Infernal Ibuki into a legitimate late-game damage dealer. The massively increased passive scaling rewards consistent Kunai Throw usage, while the improved Swift Strike chaining and reduced Shadow Veil cooldown provide better combat flow and survivability. At max stacks, she becomes one of the highest damage dealers in the game.

---

## Patch 0.2 - Schoolgirl Julia Balance Adjustments
*Released: [Current Date]*

### Character Balance Changes

#### 💚 Schoolgirl Julia - Healing Kick (Q) Nerf
**Rationale**: Julia's Healing Kick was significantly overpowered, providing excessive healing output that made encounters trivial. In testing, the ability healed 15.4k over 25 turns while dealing 8.1k damage, creating an unsustainable power level.

**Changes:**
- **Mana Cost**: Increased from 60 → 80 mana
- **Cooldown**: Increased from 1 → 2 turns  
- **Healing Efficiency**: Reduced from 65% → 40% of total damage dealt

**Impact**: These changes will require more strategic use of Julia's healing ability while still maintaining her role as a hybrid damage/support character. The increased mana cost and cooldown prevent spam usage, while the reduced healing efficiency brings her in line with other support characters.

#### 💚 Schoolgirl Kokoro - Silencing Ring (W) Enhancement
**Rationale**: Silencing Ring was providing limited utility as a pure damage reduction debuff. Adding a damage-over-time component makes it more impactful and creates meaningful pressure on enemies.

**Changes:**
- **DOT Effect**: Now deals 90 damage per turn for the duration (6 turns)
- **Total Damage**: Can deal up to 540 damage over full duration
- **Visual Effects**: Added new DOT damage VFX with energy drain particles
- **Status Indicator**: Removed persistent status icon for cleaner UI

**Impact**: Silencing Ring now serves as both a damage mitigation tool and a significant damage source, making Kokoro more versatile in both support and offensive roles. The DOT effect provides consistent pressure while maintaining the original damage reduction utility.

#### ⚾ Schoolboy Shoma
- **Boink (Q)**
  - Stun chance increased from **35% → 40%**
  - Mana cost increased from **40 → 45**
- **Base Stats**
  - Physical Damage increased from **210 → 220**

#### 🛡️ Schoolboy Siegfried
- **Lion Protection (W)**
  - Cooldown reduced from **10 → 6** turns
  - Buff duration reduced from **5 → 3** turns (Armor & Magical Shield bonuses unchanged)

#### 🐰 Farmer Alice
- **Pounce (Q)**
  - Stun chance increased from **65% → 85%**
  - Stun duration reduced from **4 → 1** turn
- **Bunny Bounce (E)** *(Ally Cast)*
  - Reworked: Now redirects **all damage** the ally would take to Alice for 5 turns (no longer grants Magic Shield). Uses the same redirection logic as Scamp's Sacrificial Devotion.

#### 🐺 Renée
- **Mystical Whip (E)**
  - Critical Hit formula changed from **1400 + 100% Physical Damage** to **1000 + 100% Physical Damage**

#### ⚡ Farmer Raiden
- **Electric Shock (E) & Storm Circle (R)**
  - Added **80% hit chance** to each target individually (matching Zoey's ability mechanics)
  - Miss behavior: Attacks that miss show "MISS!" visual effect and are tracked separately
  - Hit-only effects: Impact VFX, damage, debuffs, and stuns only apply on successful hits
  - Individual targeting: Each enemy rolls separately for hit/miss
- **Comprehensive Statistics Tracking**
  - Added complete tracking integration for all abilities and passive effects
  - Lightning Orb (Q): Tracks damage, chain lightning hits, stun applications
  - Thunder Shield (W): Tracks buff applications and permanent shield activations
  - Electric Shock (E): Tracks hits/misses, forked casts, debuff applications
  - Storm Circle (R): Tracks hits/misses, stuns, recast damage
  - Zap Passive: Tracks damage, lifesteal, empowerment, and power growth effects

### Gameplay Improvements

#### 🤖 AI Turn Timing Optimization
**Rationale**: AI turns previously felt sluggish during the planning phase but rushed during action execution, leading to poor gameplay pacing and reduced player engagement.

**Changes:**
- **AI Planning Speed**: Reduced planning delay from 800ms → 400ms per character (50% faster)
- **Planning Transitions**: Reduced delay between character planning from 300ms → 200ms (33% faster)
- **Action Execution Pacing**: Increased delay between AI actions from 1000ms → 1500ms (50% slower)

**Impact**: These changes create a more responsive AI experience where players spend less time waiting during the planning phase but have more time to observe and react to each AI action. The improved pacing enhances the tactical feel of combat while maintaining dramatic impact for AI abilities.

### New Playable Character

#### 🥷 Infernal Ibuki - Balance Adjustments & Quest Integration
**Rationale**: Infernal Ibuki's damage scaling was too high for a character with utility and mobility, making her overpowered in both damage and survivability. The balance changes focus her role as a tactical ninja with moderate damage but strong utility.

**Balance Changes:**
- **Kunai Throw (Q)**: Physical damage scaling reduced from **150% → 100%**
  - *Maintains steady damage growth while preventing excessive scaling with equipment*
- **Swift Strike (E)**: Cooldown reduced from **8 → 6** turns
  - *Improves mobility and chaining potential for better ninja-style gameplay*
- **Smoke Bomb (R)**: Cooldown increased from **12 → 15** turns
  - *Reduces frequency of powerful AoE debuff to prevent oppressive battlefield control*

**New Character Quests:**
- **🥷 "Blade Master"**: Use Kunai Throw 80 times (+520 XP)
- **💨 "Smoke Specialist"**: Apply Smoke Bomb debuff to enemies 30 times (+520 XP)

**Technical Improvements:**
- **Complete Statistics Tracking**: All abilities now track usage, damage, buffs, and debuffs
- **Quest System Integration**: Added support for debuff application tracking
- **Enhanced Battle Analytics**: Separate tracking for chain damage and DOT effects

**Impact**: These changes position Infernal Ibuki as a balanced tactical character who excels at battlefield control and mobility rather than raw damage output. The reduced Kunai scaling prevents her from becoming an overpowered damage dealer while maintaining her unique ninja identity. The quest system integration provides clear progression goals for players mastering her kit.

#### ⚾ Schoolboy Shoma

---

## Patch 0.1.1 - School Characters Cooldown Balancing
*Released: [Current Date]*

### Character Balance Changes

This patch addresses cooldown issues with several school characters who were underperforming due to high ability cooldowns.

#### 🛡️ Schoolboy Siegfried
**Rationale**: Siegfried was struggling with long defensive cooldowns, making him less viable in sustained fights.

- **Lion Protection (W)**: Cooldown reduced from 15 → 10 turns
- **Sword Blessing (E)**: Cooldown reduced from 12 → 9 turns  
- **Judgement (R)**: Cooldown reduced from 25 → 15 turns

#### 💚 Schoolgirl Kokoro
**Rationale**: As a primary healer/support, Kokoro's abilities were too infrequent to provide consistent team support.

- **Silencing Ring (W)**: Cooldown reduced from 15 → 9 turns
- **Circle Heal (E)**: Cooldown reduced from 9 → 8 turns
- **Protective Aura (R)**: Cooldown reduced from 20 → 16 turns

#### 🦋 Schoolgirl Ayane  
**Rationale**: Ayane's utility and damage abilities were not available frequently enough to maintain her intended role as a mobile damage dealer.

- **Butterfly Trail (W)**: Cooldown reduced from 10 → 9 turns
- **Quick Reflexes (E)**: Cooldown reduced from 12 → 11 turns
- **Execute Attack (R)**: Cooldown reduced from 20 → 15 turns

#### 💕 Schoolgirl Elphelt
**Rationale**: Elphelt's longer cooldowns prevented her from effectively controlling enemies and dealing consistent damage.

- **Affection (E)**: Cooldown reduced from 12 → 9 turns
- **Piercing Bullet (R)**: Cooldown reduced from 22 → 14 turns

#### ⚾ Schoolboy Shoma
**Rationale**: Shoma's utility abilities needed to be more accessible, and Heavy Ball needed to be more impactful.

- **Catch! (E)**: Cooldown reduced from 11 → 9 turns
- **Heavy Ball**: Debuff duration increased from 2 → 4 turns
  - *The Heavy Ball now applies damage reduction for 4 turns instead of 2, making it more strategically valuable*

### Developer Notes

These changes are designed to improve the viability of school faction characters in both story mode and single stages. The reduced cooldowns should allow players to use these characters' signature abilities more frequently, leading to more engaging and dynamic gameplay patterns.

The Heavy Ball buff specifically addresses feedback that the debuff duration was too short to be meaningful in longer encounters.

### Technical Changes

- Updated ability cooldowns in character JSON files
- Modified Heavy Ball debuff duration and description text
- Updated ball selection UI to reflect new Heavy Ball duration

---

