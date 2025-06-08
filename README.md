# Project Fighters

A browser-based turn-based tactical RPG with roguelike elements, featuring character collection, story campaigns, and strategic combat mechanics.

## 🎮 Game Overview

Project Fighters is a web-based card game that combines turn-based combat with character progression and story campaigns. Players collect characters from different factions (School, Farmer, Atlantean, Infernal, Mew), build teams, and battle through various stages with unique modifiers and mechanics.

## ✨ Key Features

### 🏆 Game Modes
- **Story Mode**: Narrative-driven campaigns with multiple stages and encounters
- **Single Stages**: Individual battles for quick play and practice
- **Tutorial System**: Guided introduction to game mechanics
- **Weekly Challenges**: Special AI-driven challenges for experienced players

### 👥 Character System
- **17+ Unique Characters** across 5 factions:
  - **School**: Schoolboy Shoma, Schoolgirl Kokoro, Schoolboy Siegfried, etc.
  - **Farmer**: Farmer Nina, Farmer Alice, Farmer Raiden, etc.
  - **Atlantean**: Atlantean Kagome
  - **Infernal**: Various demonic entities and corrupted characters
  - **Mew**: Bridget, Renée, Zoey
- **Character Tags**: Physical, Magical, Tank, Support, Carry, Solo
- **Unique Abilities**: Each character has 4 distinct abilities with cooldowns and mana costs
- **Passive Skills**: Special ongoing effects that define character playstyles

### 🎯 Combat System
- **Turn-Based Strategy**: Players and AI alternate turns
- **Resource Management**: HP and Mana systems with regeneration
- **Status Effects**: Buffs, debuffs, stuns, and special conditions
- **Target Types**: Single-target, AoE, ally-targeted, and self-targeted abilities
- **Stage Modifiers**: Environmental effects that change battle dynamics

### 🌟 Progression Systems
- **Talent Trees**: Character customization and enhancement
- **Character Unlocking**: Recruit new fighters through story progression
- **XP System**: Character experience and leveling
- **Quest System**: Achievements and progression tracking
- **Statistics Tracking**: Detailed combat analytics

### 🎨 User Experience
- **Modern UI**: Glassmorphism design with smooth animations
- **Controller Support**: Full gamepad compatibility using HTML5 Gamepad API
- **Visual Effects**: Dynamic VFX system for abilities and environmental effects
- **Audio System**: Background music and sound effects with volume control
- **Mobile Responsive**: Optimized for various screen sizes

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Node.js (for local server)

### Installation
1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

### Quick Start
1. Open `index.html` for the login screen
2. Navigate to `raid-game.html` for direct game access
3. Use `character-selector.html` for team building
4. Try `story.html` for story mode selection

## 🎮 How to Play

### Basic Controls
**Mouse & Keyboard:**
- Click to select characters, abilities, and targets
- Use UI buttons for navigation and actions
- Scroll for viewing different areas

**Controller Support:**
- Left Stick/D-Pad: Navigate UI elements
- A Button: Confirm/Select
- B Button: Cancel/Back
- Bumpers: Quick navigation between sections
- See [CONTROLLER_SUPPORT.md](CONTROLLER_SUPPORT.md) for detailed controls

### Combat Flow
1. **Character Selection**: Choose an active character from your team
2. **Ability Selection**: Pick one of 4 available abilities
3. **Target Selection**: Choose target(s) based on ability type
4. **Execution**: Watch the action play out with visual effects
5. **AI Turn**: Enemy characters act automatically
6. **Turn Progression**: Continue until victory or defeat

### Team Building
- Select characters that complement each other
- Consider faction synergies and role balance
- Account for story/stage requirements (team size, required tags)
- Experiment with different combinations for various challenges

## 🏗️ Technical Architecture

### Frontend Structure
```
├── index.html              # Login/main entry point
├── raid-game.html          # Main battle interface
├── character-selector.html # Team building interface
├── story.html             # Story mode selection
├── talents.html           # Character talent customization
├── js/raid-game/          # Core game logic
│   ├── game-manager.js    # Main game state management
│   ├── stage-manager.js   # Stage loading and progression
│   ├── character.js       # Character classes and mechanics
│   ├── abilities/         # Character ability definitions
│   ├── characters/        # Character-specific implementations
│   ├── stages/            # Stage definitions and modifiers
│   ├── talents/           # Talent system implementation
│   └── vfx/              # Visual effects system
├── css/                   # Styling and animations
├── Icons/                 # Character and UI icons
├── images/                # Background images and assets
└── sounds/                # Audio files and music
```

### Data Files
- `characters.json`: Character metadata and tags
- `stories.json`: Story campaigns and stage progression
- `stage-registry.json`: Stage definitions and enemy configurations
- `character-registry.json`: Character stats and ability mappings
- `single-stages.json`: Standalone battle configurations

### Key Systems
- **Game Manager**: Core game loop and state management
- **UI Manager**: Interface updates and user interactions
- **AI Manager**: Enemy behavior and decision-making
- **Stage Manager**: Level loading and environmental effects
- **Character Factory**: Dynamic character creation and modification
- **Talent Manager**: Character customization and progression
- **Statistics Manager**: Combat analytics and tracking
- **Quest Manager**: Achievement and progression system

## 🎨 Customization

### Adding New Characters
1. Add character data to `characters.json`
2. Create character abilities in `js/raid-game/abilities/`
3. Define character stats in `character-registry.json`
4. Add character icon to `Icons/characters/`
5. Implement any special mechanics in character-specific files

### Creating New Stages
1. Define stage in `stage-registry.json`
2. Create stage modifiers in `stage-modifiers.js`
3. Add background images to `images/stages/`
4. Configure enemy layouts and difficulty scaling

### Modifying UI
- CSS files in `css/` directory control styling
- VFX system in `js/raid-game/vfx/` handles visual effects
- Audio system supports custom sounds and music

## 🐛 Development Tools

### Debug Features
- Stage Editor (`stage-editor.html`): Visual stage creation tool
- Registry Updater (`registry-updater.html`): Batch update character data
- Debug Clear Tutorial (`debug-clear-tutorial.html`): Reset tutorial progress
- Test Image Paths (`test-image-paths.html`): Validate asset loading

### Development Guidelines
- Modular architecture with separate concerns
- Event-driven communication between systems
- Comprehensive error handling and logging
- Mobile-first responsive design principles

## 📱 Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- HTML5 Canvas
- CSS3 Transforms and Animations
- ECMAScript 2018+
- Web Audio API
- Gamepad API (for controller support)

## 🎯 Game Balance

### Character Roles
- **Tanks**: High HP, defensive abilities, crowd control
- **Carries**: High damage output, requires protection
- **Support**: Healing, buffs, utility abilities
- **Solo**: Self-sufficient, versatile abilities

### Strategic Elements
- **Resource Management**: Mana costs and ability cooldowns
- **Positioning**: AoE abilities and target selection
- **Timing**: Turn order and ability combinations
- **Adaptation**: Stage modifiers require strategy changes

## 📝 Story & Lore

### Available Campaigns
- **Tutorial: First Steps**: Introduction to combat mechanics
- **Blazing School Day**: School faction story with fire-themed challenges
- Multiple additional story arcs with unique themes and characters

### Narrative Elements
- Character recruitment through story progression
- Environmental storytelling through stage design
- Faction conflicts and alliances
- Mystery elements and world-building

## 🏆 Achievements & Progress

### Quest System
- Combat-based achievements
- Story progression milestones
- Character mastery challenges
- Statistical accomplishments

### Progression Tracking
- Turn-by-turn combat statistics
- Character usage analytics
- Win/loss ratios
- Damage and healing metrics

## 🎵 Audio Design

### Music System
- Stage-specific background music
- Dynamic volume control
- Looping ambient tracks
- Battle intensity variations

### Sound Effects
- Ability-specific audio cues
- UI interaction feedback
- Environmental audio
- Character voice elements

## 🔧 Performance Optimization

### Efficient Rendering
- Canvas-based visual effects
- Optimized animation loops
- Resource caching systems
- Lazy loading for assets

### Memory Management
- Object pooling for frequent creations
- Cleanup routines for completed battles
- Efficient data structures
- Garbage collection optimization

## 📖 Documentation

- [Controller Support Guide](CONTROLLER_SUPPORT.md)
- [Stage Editor Guide](STAGE_EDITOR_GUIDE.md)
- [Stage Editor Summary](STAGE_EDITOR_SUMMARY.md)

## 🤝 Contributing

This appears to be a personal project with active development. The codebase is well-structured with clear separation of concerns and comprehensive documentation.

## 📄 License

Licensed under ISC License.

## 🎮 Credits

A passion project featuring turn-based tactical combat with modern web technologies, controller support, and engaging character progression systems.

---

**Start your adventure today!** Build your team, master the combat system, and uncover the mysteries of the Project Fighters universe. 