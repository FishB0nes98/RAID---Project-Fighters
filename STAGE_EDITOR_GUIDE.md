# Stage Editor Guide

## Overview

The Stage Editor is a comprehensive web-based tool for creating and editing individual stage files for the Card Game. Instead of managing all stages in a single registry file, this tool allows you to create separate JSON files for each stage, making it easier to manage and organize stages.

## Getting Started

### Opening the Stage Editor

1. Open `stage-editor.html` in your web browser
2. The editor will load with a default empty stage template

### Interface Overview

The Stage Editor is organized into several sections:

#### Header Actions
- **New Stage**: Creates a fresh empty stage
- **Load Stage**: Loads an existing stage JSON file
- **Save Stage**: Downloads the current stage as a JSON file
- **Preview**: Opens a preview window showing the stage details

#### Main Sections

1. **Basic Information**: Core stage properties
2. **Media Assets**: Background images and music
3. **Enemies**: Configure enemy characters and their modifications
4. **Player Requirements**: Set team size and character type requirements
5. **Stage Modifiers**: Add special effects and modifiers
6. **Objectives & Conditions**: Win conditions and turn limits
7. **Rewards**: Stage completion rewards
8. **Advanced Settings**: Unlock conditions and visibility

## Creating a Stage

### 1. Basic Information

- **Stage ID**: Unique identifier (use underscores, no spaces)
- **Stage Name**: Display name for the stage
- **Description**: Brief description of what happens in the stage
- **Difficulty**: 1-10 scale
- **Stage Type**: 
  - `story`: Part of a story campaign
  - `challenge`: Standalone challenge stage
  - `weekly_challenge`: Special weekly content
  - `boss`: Boss battle stage
  - `tutorial`: Tutorial stage
- **Story Title**: Required for story stages

### 2. Media Assets

- **Background Image**: Path to the stage background image
  - Use paths like `images/stages/your_background.png`
  - Supports drag & drop for preview
- **Background Music**: Path to the background music file
  - Use paths like `sounds/your_music.mp3`
  - Test button to preview audio

### 3. Enemies Configuration

Click "Add Enemy" to configure opponents:

- **Character ID**: Select from available enemy characters
- **Level**: Enemy level (affects stats)
- **Stat Modifications**:
  - **HP Multiplier**: Multiply base HP (e.g., 2.0 = double HP)
  - **Damage Multiplier**: Multiply damage output
  - **Speed Multiplier**: Multiply speed/initiative

### 4. Player Requirements

- **Min/Max Players**: Team size constraints
- **Required Character Types**: Restrict which character types can be used
  - School Characters
  - Farmer Characters
  - Atlantean Characters
  - Any Type (no restriction)

### 5. Stage Modifiers

Add special effects that apply during the stage:

- **Burning Ground**: Characters take fire damage each turn
- **Healing Wind**: Characters regenerate health each turn
- **Heavy Rain**: Characters regenerate mana each turn
- **Carried Medicines**: Restore mana when dropping below 50% HP
- **Small Space**: All characters have 0% dodge chance
- **Healing Fire**: Characters take damage when healing

### 6. Objectives & Conditions

- **Win Conditions**: How players can win
  - Defeat All Enemies (default)
  - Survive X Turns
  - Protect Ally
  - Reach Location
- **Turn Limit**: Maximum turns (0 = no limit)

### 7. Rewards

Add rewards for completing the stage:

- **Gold**: Currency reward
- **XP**: Experience points
- **Character**: Unlock a new character
- **Stage**: Unlock a new stage
- **Story**: Unlock a story
- **Item**: Special items

Each reward has a drop chance (0.0 to 1.0)

### 8. Advanced Settings

- **Player Unlocked**: Whether stage is available by default
- **Hidden Stage**: Hide from stage selection (for testing)
- **Unlock Requirements**: JSON array of requirements
  ```json
  [
    {"type": "stageComplete", "value": "previous_stage_id"},
    {"type": "level", "value": 5}
  ]
  ```

## Example Stage JSON Structure

```json
{
  "id": "epic_boss_battle",
  "name": "Epic Boss Battle",
  "description": "Face the ultimate challenge!",
  "difficulty": 8,
  "type": "boss",
  "backgroundImage": "images/stages/boss_arena.png",
  "backgroundMusic": "sounds/epic_boss_music.mp3",
  "enemies": [
    {
      "characterId": "infernal_astaroth",
      "level": 10,
      "modifications": {
        "hpMultiplier": 2.5,
        "damageMultiplier": 1.5,
        "speedMultiplier": 1.2
      }
    }
  ],
  "playerRequirements": {
    "minPlayers": 3,
    "maxPlayers": 5,
    "requiredTypes": ["any"]
  },
  "modifiers": [
    {"id": "burning_ground"}
  ],
  "stageEffects": [
    {"id": "burning_ground"}
  ],
  "objectives": {
    "winConditions": [
      {"type": "allEnemiesDefeated"}
    ],
    "turnLimit": 20
  },
  "rewards": [
    {"type": "gold", "value": 1000, "chance": 1.0},
    {"type": "character", "value": "special_hero", "chance": 0.1}
  ],
  "unlockRequirements": [
    {"type": "stageComplete", "value": "final_story_stage"}
  ],
  "playerunlocked": false
}
```

## Integration with Game

### File Organization

Save your stages in the `js/raid-game/stages/` directory with descriptive names:
- `epic_boss_battle.json`
- `tutorial_first_fight.json`
- `forest_ambush.json`

### Adding to Stage Registry

After creating your stage file, you need to add it to the stage registry (`js/raid-game/stage-registry.json`):

```json
{
  "id": "epic_boss_battle",
  "name": "Epic Boss Battle",
  "description": "Face the ultimate challenge!",
  "difficulty": 8,
  "type": "boss",
  "backgroundImage": "images/stages/boss_arena.png",
  "backgroundMusic": "sounds/epic_boss_music.mp3",
  "unlockRequirements": [
    {"type": "stageComplete", "value": "final_story_stage"}
  ],
  "path": "js/raid-game/stages/epic_boss_battle.json"
}
```

### Story Integration

For story stages, also update `stories.json` to include your stage in the appropriate story sequence.

## Tips and Best Practices

### Stage Design

1. **Balanced Difficulty**: Make sure enemy stats are challenging but fair
2. **Clear Objectives**: Ensure win conditions are obvious to players
3. **Meaningful Modifiers**: Use stage modifiers to create unique gameplay
4. **Appropriate Rewards**: Match rewards to difficulty and effort required

### File Management

1. **Consistent Naming**: Use descriptive, consistent file names
2. **Unique IDs**: Ensure stage IDs are unique across all stages
3. **Asset Paths**: Use relative paths for images and audio
4. **Version Control**: Keep backup copies of your stages

### Testing

1. **Preview Function**: Use the preview button to review your stage
2. **Test in Game**: Load your stage in the actual game to test gameplay
3. **Balance Testing**: Ensure the stage is neither too easy nor too hard

## Troubleshooting

### Common Issues

1. **Invalid JSON**: Check the unlock requirements field for proper JSON syntax
2. **Missing Assets**: Ensure image and audio files exist at specified paths
3. **Character Not Found**: Verify enemy character IDs exist in characters.json
4. **Modifier Errors**: Check that modifier IDs are valid

### Validation

The editor provides basic validation:
- Required fields are marked with red borders
- JSON syntax is validated for unlock requirements
- Character and modifier selections are validated

## Advanced Features

### Custom Modifiers

To add new modifiers, update the `stage-modifiers.js` file with your custom modifier logic.

### Complex Unlock Requirements

Support for complex unlock conditions:
```json
[
  {"type": "stageComplete", "value": "stage1"},
  {"type": "allStagesComplete", "value": ["stage1", "stage2", "stage3"]},
  {"type": "characterUnlocked", "value": "special_character"},
  {"type": "level", "value": 10}
]
```

### Multiple Enemy Waves

For complex battles, add multiple enemies with different levels and modifications.

## Support

If you encounter issues or need help:
1. Check the browser console for error messages
2. Verify all file paths are correct
3. Test with a simple stage first
4. Refer to existing stage files as examples 