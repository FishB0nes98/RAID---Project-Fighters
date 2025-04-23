# Schoolboy Shoma's Homerun Ability - Testing Guide

The Homerun ability for Schoolboy Shoma has three main effects:
1. Gives 100% dodge chance for 3 turns
2. Resets all ability cooldowns to 0
3. Allows selecting a new ball type

## Testing Steps

1. Start a raid battle with Schoolboy Shoma in your team
2. Wait for Schoolboy Shoma's turn
3. Use some of Schoolboy Shoma's abilities to put them on cooldown (especially his Ball Throw)
4. Use the Homerun ability (it should be the 4th ability in Schoolboy Shoma's list)

## Expected Results

- All cooldowns for Schoolboy Shoma's abilities should be reset to 0
- The ball selection UI should appear, allowing you to choose a new ball type
- The Ball Throw ability icon and effect should update based on your selection
- The Homerun ability should go on cooldown (6 turns)

## Effect Details

- After using Homerun, Schoolboy Shoma should dodge all attacks for 3 turns
- Cooldown reset is immediate and applies to all abilities
- Ball selection allows choosing from Grass, Fire, Heavy, or Water ball

## Implementation Details

The implementation consists of two main components:

1. **Homerun ability handler**: Implemented in `schoolboy_shoma-homerun.js`
   - Overrides the `AbilityFactory.createBuffEffect` method to handle the Homerun ability
   - Applies the dodge buff
   - Resets all ability cooldowns
   - Triggers the ball selection UI

2. **Ball selection and ball throw abilities**: Implemented in `schoolboy_shoma-ball-selection.js`
   - Handles the UI for selecting a ball type
   - Modifies the Ball Throw ability based on the selected ball
   - Implements the unique effects for each ball type

## Troubleshooting

If the ball selection doesn't show up after using Homerun:
- Check the browser console for errors
- Verify that the `schoolboy_shoma-ball-selection.js` script is loaded
- Check if the showBallSelectionForShoma function is available
- Verify the schoolboy_shoma-ball-selection.js script is loaded before schoolboy_shoma-homerun.js

If abilities don't reset properly:
- Check that the character has the correct ID ('schoolboy_shoma')
- Ensure the ability cooldown system is working correctly in the Character class 