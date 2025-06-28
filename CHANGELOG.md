# Project Fighters - Changelog

## Patch 0.5 - Schoolboy Shoma Talent System Expansion
*Released: [Current Date]*

### New Features

#### ⚾ Schoolboy Shoma - Advanced Talent Tree
**Rationale**: Schoolboy Shoma's talent tree was limited to just the Debuff Hunter talent. This expansion adds two powerful new Boink enhancement talents that branch from the root, giving players meaningful choices in how they develop Shoma's signature ability.

**New Talents Added:**

**🔥 Power Boink** (Tier 2 - Connected to Debuff Hunter)
- **Effect**: Boink now scales with **85% additional Physical Damage**
- **Visual Enhancement**: Stunning power aura VFX with energy burst, floating "POWER BOINK!" text, and radial strength particles
- **Impact**: Transforms Boink from a utility ability into a devastating damage dealer that scales with Shoma's Physical Damage stat

**⚡ Efficient Boink** (Tier 2 - Connected to Debuff Hunter)
- **Effect**: Boink **costs no mana**
- **Visual Enhancement**: Updated UI displays show "0 mana" cost with proper crossed-out original cost styling
- **Impact**: Allows unlimited Boink usage, enabling aggressive playstyles without mana constraints

**Technical Features:**
- **Smart Ability Descriptions**: Boink's tooltip dynamically updates to show all active talent effects in a clean, organized format
- **Enhanced VFX System**: Power Boink features particle-based visual effects with golden energy bursts, power auras, and floating combat text
- **Complete Integration**: Both talents work seamlessly with existing systems including battle statistics, AI targeting, and controller support
- **Stacking Compatibility**: Power Boink stacks multiplicatively with Debuff Hunter for massive damage against debuffed targets

**Developer Commentary**: 
*These talents provide meaningful branching choices for Shoma players. Power Boink appeals to damage-focused builds and scales naturally with character progression, while Efficient Boink enables spam-heavy playstyles and resource-free aggression. Both talents enhance Shoma's signature ability in distinct ways, allowing players to customize their approach based on team composition and preferred playstyle.*

**Balance Considerations**:
- Power Boink provides significant damage scaling but requires investment in Physical Damage stats
- Efficient Boink removes resource constraints but doesn't increase damage output
- Both talents require the Debuff Hunter prerequisite, ensuring players invest in the character's core identity first

---

## Patch 0.4 - Farmer Alice Balance Changes
*Released: [Current Date]*

### Character Balance Changes

#### 🐰 Farmer Alice - Defensive & Utility Buffs
**Rationale**: Farmer Alice needed improvements to her defensive capabilities and ability accessibility. Her base defensive stats were too low for a tank character, and her abilities needed better cooldown management and healing output to fulfill her support role effectively.

**Base Stat Changes:**
- **Armor**: Increased from **12 → 22** (+83% increase)
- **Magic Shield**: Increased from **20 → 35** (+75% increase)
- *Impact: Significantly improved survivability against both physical and magical damage, making Alice a more reliable frontline tank*

**Ability Changes:**

**🐾 Pounce (Q)**
- **Cooldown**: Reduced from **2 → 1 turn**
- **Stun Chance**: Reduced from **85% → 47%**
- *Impact: Much more frequent crowd control with reduced reliability. The 1-turn cooldown allows Alice to be more disruptive while the stun chance reduction prevents oppressive lockdown scenarios*

**🛡️ Thick Fur (W)**
- **Cooldown**: Reduced from **18 → 14 turns**
- *Impact: More frequent access to defensive buffs, improving Alice's tanking consistency and team protection uptime*

**🥕 Carrot Power Up (R)**
- **Healing**: Increased from **21% → 27%** of missing health
- **Mana Cost**: Reduced from **155 → 90** mana
- **Power Carrots Talent**: Updated to heal **27%** of maximum HP (was 21%)
- *Impact: Significantly more accessible healing ability with improved output. The mana cost reduction makes it much easier to use consistently, while the healing increase provides better support value*

**Developer Commentary**: 
*These changes transform Farmer Alice from a niche tank into a more reliable frontline protector. The defensive stat buffs address her core weakness of being too fragile for a tank character, while the ability changes improve her utility and support capabilities. The Pounce changes create a more dynamic playstyle with frequent but less oppressive crowd control, while Carrot Power Up becomes a much more accessible and effective healing tool.*

**Impact Summary**:
- **Early Game**: Much better survivability with improved base stats
- **Mid Game**: More frequent ability usage creates better combat flow
- **Late Game**: Enhanced healing output and defensive buffs provide stronger team support
- **Team Fights**: More reliable tanking and support capabilities without being oppressive

---

## Patch 0.4 - Zoey Balance Overhaul
*Released: [Current Date]*

### Character Balance Changes

#### 🌟 Zoey - Complete Damage Scaling Rebalance
**Rationale**: Zoey was dealing excessive damage across all abilities with her 200% magical damage scaling, making her oppressive in both single-target and AoE scenarios. Additionally, her Bell Mark passive was providing too much bonus damage. This comprehensive rebalance reduces her raw damage output while maintaining her unique mechanics and playstyle identity.

**Ability Changes:**

**🍓 Strawberry Bell Burst (Q)**
- **Damage Scaling**: Reduced from **200% → 122%** Magical Damage
- *Impact: ~39% reduction in Q ability damage output, bringing her primary damage source in line with other characters*

**💖 Heart Pounce (W)**
- **Base Damage**: Remains **855** (unchanged)
- **Magical Damage Scaling**: Reduced from **125% → 50%** Magical Damage
- **Enhanced Heart Pounce Talent**: Now adds **+50% Magical + 50% Physical** damage scaling
  - *Total with talent: 855 + 100% Magical + 50% Physical damage*
- *Impact: Significant reduction in W ability scaling, but talent provides meaningful upgrade path*

**⚡ Sparkle Burst (E)**
- **Damage Scaling**: Reduced from **200% → 122%** Magical Damage
- *Impact: AoE damage potential significantly reduced, preventing oppressive team-fight scenarios*

**🌈 Glowing Light Arc (R)**
- **Base Damage**: Removed **255** base damage (now **0**)
- **Magical Damage Scaling**: Remains **100%** (175% with Enhanced Light Arc talent)
- *Impact: Ultimate now scales purely with magical damage, removing guaranteed damage floor*

**Passive Rebalance:**

**✨ Sparkle Bell Mark (Passive)**
- **Damage Multiplier**: Reduced from **200% (2x) → 125%** damage to marked enemies
- **Stacking Formula**: Multiple marks now use **1 + (stacks × 0.25)** formula
  - *1 stack = 125% damage, 2 stacks = 150% damage, 3 stacks = 175% damage*
- **Updated Descriptions**: All passive and debuff tooltips now correctly display "125%" instead of "double damage"

**Bug Fixes:**
- **🐛 Fixed**: Strawberry Bell Burst not applying Sparkle Bell Mark to damaged enemies
  - *Enhanced isDamageSpell detection to properly recognize "Bell" abilities*
  - *Added comprehensive debugging and improved passive trigger reliability*

**Developer Commentary**: 
*These changes address Zoey's dominant position in the meta while preserving her unique kit identity. The ~39% damage reduction across her primary abilities, combined with the passive nerf from 200% to 125% marked damage, should bring her power level in line with other characters. Players can still achieve high damage through talent investments and proper mark management, but the baseline power is now more reasonable for healthy gameplay.*

**Impact Summary**:
- **Early Game**: Significantly reduced damage output requires more strategic ability usage
- **Mid Game**: Talent investments become more important for maintaining damage relevance  
- **Late Game**: Still capable of high damage through mark stacking and enhanced abilities
- **Team Fights**: Reduced AoE oppression allows for more interactive combat scenarios

---

## Patch 0.3 - Bug Fixes
*Released: [Current Date]*

### Bug Fixes

#### 🐰 Farmer Alice - Pounce (Q)
**Rationale**: Pounce was not applying its stun effect and needed to be more impactful as a crowd control ability.

**Changes**:
- **Fixed**: Pounce now correctly applies stun effects as intended
- **Stun Duration**: Increased from **1 → 2 turns**
- **Stun Chance**: Remains 85%

**Impact**: Farmer Alice is now a more viable tank/disruptor option with reliable crowd control that can remove enemies from combat for extended periods.

#### 🌊 Bridget - Complete Balance Overhaul
**Rationale**: Bridget was overpowered with excessive damage output, low ability costs, and oppressive passive healing. This rebalancing focuses her as a hybrid damage/support character while reducing her overall power level.

**Changes**:
- **Base Magical Damage**: Reduced from **222 → 195**
- **Aqua Life Essence (Passive)**: Healing scaling reduced from **22% → 16%** of damage dealt
- **Ribbon Wave Rush (Q)**:
  - Cooldown reduced from **2 → 1** turn
  - Mana cost increased from **30 → 55** mana  
  - Base damage reduced from **365 → 120**
  - Damage scaling increased from **85% → 100%** Magical Damage
- **Bubble Beam Barrage (W)**: Mana cost reduced from **100 → 90** mana
- **Arcane Bubble Shield (E)**: Mana cost reduced from **200 → 90** mana
- **Fixed**: Bubble Arsenal from Arcane Bubble Shield now correctly triggers passive healing when dealing damage

**Impact**: Bridget becomes more active in combat with Q available every turn, but significantly less oppressive overall. The ~27% reduction in passive healing and lower total damage output per Q cast creates better counterplay opportunities while maintaining her hybrid role. Reduced mana costs on W and E abilities improve her accessibility and resource management options.

#### 🎯 Farmer Nina - Balance Adjustments & Bug Fixes
**Rationale**: Farmer Nina had several critical issues: her Hiding ability was healing far too much due to a calculation bug, the ability was too accessible with low cooldown, and her passive was completely non-functional due to missing system integration.

**Changes**:
- **Hiding (W)**:
  - Cooldown increased from **5 → 8 turns**
  - **Critical Bug Fix**: Healing was incorrectly calculated as 10% of Max HP (~698 HP per turn) instead of the intended fixed 350 HP per turn
  - Now correctly heals exactly **350 HP per turn** as described
- **Piercing Shot (R)**: Cooldown reduced from **15 → 12 turns**
- **Evasive Adaptability (Passive)**:
  - **Major Bug Fix**: Passive was completely broken due to missing registration in the character system
  - Now correctly provides **5% dodge chance per active buff**
  - Added modern visual indicator system with lightning bolt icon and dodge percentage display
  - Indicator positioned in lower-left corner of character image with clean, professional styling

**Impact**: Nina's power level is significantly reduced with the Hiding nerf, removing an overpowered healing exploit while making the ability more strategic with longer cooldown. The Piercing Shot buff provides better ultimate accessibility. Most importantly, her passive now functions as intended, making her much more survivable when using buff abilities like Hiding, creating meaningful synergy between her abilities.

#### 🐱 Farmer Cham Cham - Balance Adjustments
**Rationale**: Farmer Cham Cham needed power level adjustments to improve her Q ability availability while reducing the strength of her self-buffs and ultimate abilities for better balance.

**Ability Changes:**
- **Scratch (Q)**: Cooldown: 2 turns → **1 turn**, Mana Cost: 30 → **40**
- **Leap (W)**: Cooldown: 10 turns → **8 turns**, Dodge Chance buff: 50% → **25%**, Physical Damage buff: 50% → **25%**  
- **Boomerang (E)**: Cooldown: 6 turns → **5 turns**, Damage scaling: 250% → **185%** Physical Damage
- **Feral Strike (R)**: Mana Cost: 100 → **125**, Cooldown: 16 turns → **14 turns**

**Impact**: Cham Cham becomes more accessible with Q available every turn, balanced by higher mana cost. Her defensive and offensive buffs are significantly reduced but last the same duration, requiring more strategic use. Boomerang becomes more frequent but less powerful, while Feral Strike is more expensive but available sooner, encouraging better mana management and creating more balanced team fights.

#### ⚡ Farmer Raiden - Passive Nerf
**Rationale**: Farmer Raiden's passive was too powerful, providing significant damage output while completely bypassing magical shield defenses. This change reduces his passive damage while making it respect defensive stats.

**Changes:**
- **Zap Passive:** Damage scaling reduced from **100% → 60%** Magical Damage
- **Zap Passive:** No longer ignores magical shield (now affected by target's magical shield)
- **Lightning Mastery Talent:** Updated scaling from **200% → 120%** Magical Damage to maintain talent effectiveness

**Impact**: Farmer Raiden's passive damage output is significantly reduced, making him less oppressive while still maintaining his unique zap mechanic. The removal of magical shield bypass means tanky magical characters can better survive his passive procs, creating more strategic counterplay options.

#### ⚾ Schoolboy Shoma - Balance Adjustments
**Rationale**: Schoolboy Shoma's Boink ability provided unlimited crit chance scaling which could become overpowered in longer battles. The ball types needed individual balancing to create more meaningful choices, while Catch needed to be more expensive to reflect its powerful defensive utility.

**Changes**:
- **Boink (Q)**: Removed crit chance increase effect (no longer has 50% chance to permanently increase crit chance by 5%)
- **Ball Throw (W)**:
  - **Grass Ball**: Base healing increased from **450 → 500** HP
  - **Water Ball**: Cooldown increased from **3 → 2 turns** (Water Ball only)
- **Catch! (E)**: Mana cost increased from **65 → 90** mana

**Impact**: Removing the crit chance scaling prevents Shoma from becoming overpowered in extended battles while maintaining his core identity. The Grass Ball buff makes it more appealing as a healing option, while the Water Ball cooldown reduction increases its utility as an AoE damage choice. The Catch mana increase makes the powerful 85% dodge buff more expensive to use strategically.

#### 🐺 Renée - Balance Adjustments
**Rationale**: Renée's Wolf Claw Strike was dealing excessive damage against high-HP targets due to the max HP scaling, making her disproportionately powerful against tanky enemies. The ability frequency has been increased to maintain overall damage output. Lunar Curse's extended debuff duration was too punishing, especially in prolonged fights.

**Changes:**
- **Wolf Claw Strike (Q)**:
  - ❌ **Removed** max HP scaling (no longer deals +1% of target's max HP)
  - 🔻 **Base damage**: 700 → 585 physical damage  
  - ⚡ **Cooldown**: 3 → 1 turn
- **Lunar Curse (R)**:
  - 🔻 **Mana cost**: 120 → 100 mana
  - ⏱️ **Debuff duration**: 2 → 1 turn (Lunar Mark debuff)

**Impact**: Renée's damage against high-HP targets is significantly reduced, creating more balanced matchups against tanks while maintaining her identity as a sustained damage dealer through improved ability frequency. The Lunar Curse changes make the ability more accessible and less oppressive, encouraging more frequent use while reducing the punishment window for opponents.

#### 🦋 Schoolgirl Ayane - Balance Adjustments
**Rationale**: Schoolgirl Ayane needed improvements to her consistency and accessibility. The Butterfly Dagger proc rate was too unreliable, Butterfly Trail had excessive cooldown for a team buff, and Execute Attack was too expensive while suffering from cooldown reset bugs.

**Changes Made:**
- **Butterfly Dagger (Q)**: Increased dodge buff chance from **40% → 60%**
- **Butterfly Trail (W)**: Reduced cooldown from **9 → 7** turns  
- **Execute Attack (R)**: Reduced mana cost from **200 → 100**, reduced cooldown from **15 → 12** turns, **fixed cooldown reset mechanism**

**Impact**: The increased proc rate on Butterfly Dagger makes Ayane more reliable in combat with better defensive utility. The reduced Butterfly Trail cooldown allows for more frequent team support, making her a better team player. Execute Attack becomes more accessible with lower costs while maintaining its high-risk/high-reward nature, and the fixed cooldown reset ensures the ability works as intended when securing kills.

#### 🚜 Farmer Shoma - Balance Adjustments
**Rationale**: Farmer Shoma needed adjustments to create better ability flow while reducing the power of his ultimate ability. The Q ability was underused due to its cooldown, while his ultimate was too powerful for its frequency.

**Changes**:
- **Home Run Smash (Q)**: 
  - Cooldown reduced from **2 → 1 turn**
  - Base damage increased from **235 → 315**
  - Mighty Swing talent damage increased from **455 → 495** (maintaining talent scaling)
- **Apple Throw (W)**: 
  - Mana cost increased from **45 → 60**
- **Cottage Run (R)**: 
  - Healing reduced from **50% → 35%** missing HP
  - Perfect Dodge duration reduced from **4 → 3 turns**

**Impact**: Home Run Smash becomes more accessible with 1-turn cooldown, encouraging more active gameplay. Apple Throw requires better mana management with higher cost. Cottage Run remains powerful but with reduced healing and dodge duration for better counterplay opportunities.

---

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

## [Latest Updates]

### ✨ New Features - Consumable Item System

**Advanced Training Stage - New Consumable Items:**
- **Infernal Cinder** - Crafting material with 75% drop chance, drops 1-4 quantity
- **Mana Sack** - Consumable item that restores 500 mana when used, 100% drop chance, drops 1-3 quantity, 5-turn cooldown

**Consumable System Features:**
- ✅ Enhanced Item class with consumable support (effect functions, cooldown management)
- ✅ CharacterInventory now supports item stacking for consumables
- ✅ New consumable window UI with draggable interface
- ✅ Character icons show which character owns each consumable item
- ✅ Consumable usage directly from the consumable window
- ✅ Visual cooldown indicators and disabled states
- ✅ Turn-based cooldown reduction system
- ✅ Battle log integration for consumable usage
- ✅ Firebase integration for persistent character inventories

**Implementation Details:**
- New consumable button (🧪) added to quick action bar
- Modern, responsive UI with animations and visual feedback
- Support for quantity ranges in loot tables
- Backward compatibility with existing inventory data
- Proper error handling and user feedback

**Technical Components Added:**
- Enhanced `Item.setConsumableEffect()` and `Item.useConsumable()` methods
- `CharacterInventory.useConsumableItem()` for inventory integration
- `InventoryUIManager.createConsumableWindow()` for UI management
- Updated `LootManager` with Advanced Training stage loot configuration
- Automatic cooldown reduction in `GameManager.endPlayerTurn()`

**Usage:**
1. Complete Advanced Training stage to receive items
2. Click the 🧪 button in the quick action bar during battle
3. View all player characters' consumable items in one window
4. Click "Use" to consume items (respects cooldowns)
5. Items stack automatically in character inventories

---




