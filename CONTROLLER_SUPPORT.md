# Controller Support for Raid Game

This game supports gamepads and controllers for a more console-like experience.

## How to Use

1. Simply connect a controller to your computer before or during gameplay
2. The game will automatically detect the controller and enable controller mode
3. A controller cursor will appear on screen, and button prompts will be displayed

## Controls

### Character Selection Screen

- **Left Stick / D-Pad**: Navigate between stories, stages, characters, and team slots
- **A Button** (Xbox) / **X Button** (PlayStation): Select story/stage/character or confirm action
- **B Button** (Xbox) / **Circle Button** (PlayStation): Back to previous section
- **X Button** (Xbox) / **Square Button** (PlayStation): View character talents
- **Y Button** (Xbox) / **Triangle Button** (PlayStation): Navigate to tag filters
- **LB/RB** (Bumpers): Switch between UI sections (tabs/stories/characters/team)
- **Start Button**: Start battle (when team is ready)
- **Back/Select Button**: Return to main menu

### Battle Screen

- **Left Stick / D-Pad**: Navigate between characters, abilities, and targets
- **A Button** (Xbox) / **X Button** (PlayStation): Confirm/Select
- **B Button** (Xbox) / **Circle Button** (PlayStation): Cancel/Back
- **X Button** (Xbox) / **Square Button** (PlayStation): Show character stats
- **Y Button** (Xbox) / **Triangle Button** (PlayStation): Auto-select target
- **LB** (Left Bumper): Switch to previous character
- **RB** (Right Bumper): Switch to next character
- **Start Button**: End turn (when available)
- **Back/Select Button**: Toggle talents panel

## Navigation Flow

### Character Selection

1. **Tab Navigation**: Use d-pad/stick to select between Story Mode and Single Stages
2. **Story/Stage Selection**: Choose a story or stage to play
3. **Character Selection**: Build your team by selecting characters from the grid
4. **Team Management**: Review your team and remove characters if needed
5. **Start Battle**: Press Start button or navigate to Start Battle button and confirm

### Battle Screen

1. **Character Selection**: Use left stick or d-pad to select a character, then press A/X to confirm
2. **Ability Selection**: After selecting a character, use left/right to choose an ability, then press A/X
3. **Target Selection**: If the ability requires a target, use d-pad/stick to select a target, then press A/X
4. The flow then returns to character selection

## Tips

- You can switch between mouse/keyboard and controller at any time
- Use LB/RB to quickly switch between different UI sections
- Press Y/Triangle on the character selection screen to access tag filters
- Press X/Square on a character to view their talents page

## Troubleshooting

If your controller isn't detected:
1. Make sure it's properly connected to your computer
2. Try disconnecting and reconnecting the controller
3. Refresh the browser page
4. Some controllers may require additional drivers or software

## Technical Details

The controller support uses the HTML5 Gamepad API and should work with most standard controllers including:
- Xbox controllers
- PlayStation controllers
- Most generic USB/Bluetooth gamepads

Supported browsers include Chrome, Edge, Firefox, and other modern browsers that implement the Gamepad API.

## Talent Screen Controls

When on the Character Talents screen:

- **Left Stick / D-Pad**: Navigate between Talents or UI Buttons (Save, Reset, Back, Zoom)
- **Right Stick**: Pan the Talent Tree view
- **A Button** (Xbox) / **X Button** (PlayStation): Select/Deselect Talent OR Activate highlighted Button
- **B Button** (Xbox) / **Circle Button** (PlayStation): Activate the 'Back' button
- **LB / RB**: Switch focus between control groups (Header Buttons <-> Talent Grid <-> Map Buttons)
- **LT / RT**: Zoom Out / Zoom In
- **Start Button**: Activate the 'Save' button
- **Back/Select Button**: Activate the 'Reset' button 