# DM Screen Legendary Statblock Patch

## Included changes

- Adds preview-before-add behavior to the SRD/custom NPC picker.
- Adds a full statblock preview panel beside the NPC search results.
- Adds automatic legendary resistance tracking when the selected statblock includes `Legendary Resistance (x/Day)`.
- Adds automatic legendary action tracking when the selected statblock includes `Legendary Action Uses: x`.
- Legendary actions reset to their maximum when the creature becomes the active turn via Next Turn.
- Adds a custom Mythical Blue statblock builder inside the NPC picker.
- Custom statblocks are saved in the DM tracker localStorage state under `customStatblocks` and appear in the picker under the Custom library section.
- Quick Custom NPC remains available for simple ad-hoc combatants without a full statblock.

## Files changed

- dm-screen.html
- css/dm-screen.css
- js/dm-screen.js
