# Stage Editor System - Complete Implementation

## Overview

I've created a comprehensive Stage Editor system for your Card Game that allows you to create stages in separate files instead of managing everything in a single registry. This system includes three main components:

## 🔧 Components

### 1. Stage Editor (`stage-editor.html`)
- **Location**: Root directory
- **Purpose**: Main tool for creating and editing individual stage files
- **Features**:
  - Visual form-based stage creation
  - Real-time preview
  - Asset management (images, audio)
  - Enemy configuration with stat modifications
  - Stage modifier selection
  - Reward system setup
  - Export as JSON files

### 2. Registry Updater (`registry-updater.html`)
- **Location**: Root directory  
- **Purpose**: Helper tool to add new stages to the stage registry
- **Features**:
  - Load stage files created by the editor
  - Generate registry entries automatically
  - Update existing stage registry
  - Download updated registry files

### 3. Enhanced Stage Manager
- **Location**: `js/raid-game/stage-manager.js`
- **Purpose**: Load stages from separate files
- **Features**:
  - Multiple loading approaches (registry + file, direct file, fallback)
  - Backward compatibility with existing system
  - Support for both `modifiers` and `stageEffects` formats

## 📁 File Structure

```
Card Game/
├── stage-editor.html              # Main stage editor
├── registry-updater.html          # Registry management tool
├── STAGE_EDITOR_GUIDE.md          # Detailed usage guide
├── STAGE_EDITOR_SUMMARY.md        # This summary
├── css/
│   └── stage-editor.css           # Styling for the editor
├── js/
│   ├── stage-editor.js            # Editor functionality
│   └── raid-game/
│       ├── stage-manager.js       # Enhanced stage loading
│       ├── stage-registry.json    # Central stage registry
│       └── stages/
│           ├── example_stage.json # Example stage file
│           └── [your_stages].json # Your custom stages
```

## 🚀 Quick Start

### Creating Your First Stage

1. **Open the Stage Editor**
   ```
   Open stage-editor.html in your browser
   ```

2. **Fill in Basic Information**
   - Stage ID: `my_epic_battle`
   - Name: `Epic Battle Arena`
   - Description: `Face challenging enemies!`
   - Difficulty: `5`
   - Type: `challenge`

3. **Configure Enemies**
   - Click "Add Enemy"
   - Select enemy character (e.g., `infernal_astaroth`)
   - Set level and stat multipliers
   - Add multiple enemies as needed

4. **Add Stage Effects**
   - Click "Add Modifier"
   - Choose from available modifiers (Burning Ground, Healing Wind, etc.)

5. **Set Rewards**
   - Click "Add Reward"
   - Configure gold, XP, or character unlocks

6. **Save Your Stage**
   - Click "Save Stage"
   - Downloads `my_epic_battle.json`

### Adding to Game

1. **Place Stage File**
   ```
   Move my_epic_battle.json to js/raid-game/stages/
   ```

2. **Update Registry**
   - Open `registry-updater.html`
   - Load your stage file
   - Load current registry (`js/raid-game/stage-registry.json`)
   - Click "Add to Registry"
   - Download updated registry
   - Replace old registry file

3. **Test in Game**
   - Stage should now appear in character selector
   - Can be loaded and played normally

## 🎯 Key Features

### Advanced Enemy Configuration
- **Level Scaling**: Set enemy levels independently
- **Stat Multipliers**: Adjust HP, damage, and speed
- **Multiple Enemies**: Support for complex battles

### Stage Modifiers System
- **Burning Ground**: Fire damage each turn
- **Healing Wind**: Health regeneration
- **Heavy Rain**: Mana regeneration
- **Small Space**: No dodging allowed
- **Healing Fire**: Damage when healing
- **Carried Medicines**: Mana restoration at low HP

### Flexible Objectives
- **Win Conditions**: Multiple victory types
- **Turn Limits**: Optional time pressure
- **Survival Modes**: Endurance challenges

### Rich Reward System
- **Currency**: Gold rewards
- **Experience**: XP for character progression
- **Unlocks**: Characters, stages, stories
- **Drop Chances**: Configurable probability

## 🔄 Workflow

```
Create Stage → Save JSON → Place in stages/ → Update Registry → Play
     ↓              ↓           ↓              ↓           ↓
Stage Editor → Download → File System → Registry Tool → Game
```

## 🛠️ Technical Details

### Stage File Format
```json
{
  "id": "unique_identifier",
  "name": "Display Name",
  "description": "Stage description",
  "difficulty": 5,
  "type": "challenge",
  "enemies": [
    {
      "characterId": "enemy_id",
      "level": 5,
      "modifications": {
        "hpMultiplier": 1.5,
        "damageMultiplier": 1.2,
        "speedMultiplier": 1.0
      }
    }
  ],
  "modifiers": [{"id": "modifier_name"}],
  "objectives": {
    "winConditions": [{"type": "allEnemiesDefeated"}]
  },
  "rewards": [
    {"type": "gold", "value": 250, "chance": 1.0}
  ]
}
```

### Registry Entry Format
```json
{
  "id": "unique_identifier",
  "name": "Display Name",
  "description": "Stage description",
  "difficulty": 5,
  "type": "challenge",
  "backgroundImage": "images/stages/background.png",
  "backgroundMusic": "sounds/music.mp3",
  "unlockRequirements": [],
  "path": "js/raid-game/stages/unique_identifier.json"
}
```

## 🎮 Example: Creating a Boss Battle

1. **Basic Setup**
   - ID: `dragon_boss_fight`
   - Name: `Ancient Dragon Lair`
   - Difficulty: 9
   - Type: `boss`

2. **Boss Configuration**
   - Enemy: `infernal_astaroth`
   - Level: 15
   - HP Multiplier: 3.0
   - Damage Multiplier: 2.0

3. **Stage Effects**
   - Burning Ground (constant fire damage)
   - Healing Fire (dangerous healing)

4. **Objectives**
   - Win: Defeat all enemies
   - Turn Limit: 30 turns

5. **Rewards**
   - 1000 Gold (100% chance)
   - Special Character (10% chance)

## 📋 Best Practices

### Stage Design
- **Balanced Progression**: Gradually increase difficulty
- **Unique Mechanics**: Use modifiers to create distinct experiences  
- **Clear Themes**: Match visuals and mechanics
- **Testing**: Always test stages before finalizing

### File Management
- **Consistent Naming**: Use descriptive, clear file names
- **Version Control**: Keep backups of your stages
- **Organization**: Group related stages in folders
- **Documentation**: Comment your stage designs

### Integration
- **Registry Updates**: Always update registry when adding stages
- **Asset Paths**: Use relative paths for portability
- **Dependencies**: Check that referenced assets exist
- **Compatibility**: Test with existing save files

## 🐛 Troubleshooting

### Common Issues
1. **Stage Not Loading**: Check file path in registry
2. **Missing Assets**: Verify image/audio file paths
3. **Invalid JSON**: Use editor validation features
4. **Character Not Found**: Ensure enemy IDs exist in characters.json

### Validation Tools
- **Stage Editor**: Built-in validation and preview
- **Registry Updater**: Checks for duplicate IDs
- **Browser Console**: Shows loading errors
- **Game Testing**: Ultimate validation method

## 🔮 Future Enhancements

### Planned Features
- **Visual Stage Builder**: Drag-and-drop interface
- **Asset Browser**: Built-in asset management
- **Batch Operations**: Bulk stage operations
- **Template System**: Pre-made stage templates
- **Advanced Scripting**: Custom stage logic

### Integration Possibilities
- **Story Editor**: Visual story campaign builder
- **Character Editor**: Custom character creation
- **Modifier Editor**: Custom stage effect creation
- **Campaign Manager**: Multi-stage campaign tools

## 📚 Documentation

- **`STAGE_EDITOR_GUIDE.md`**: Comprehensive usage guide
- **`example_stage.json`**: Working example stage
- **In-app Help**: Tooltips and contextual help
- **Console Logging**: Detailed debugging information

---

This stage editor system provides a complete solution for creating, managing, and integrating custom stages into your Card Game. The separation of stage data into individual files makes the system more manageable and allows for easier collaboration and version control. 