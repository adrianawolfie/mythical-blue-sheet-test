# DM Screen search/mobile fixes + character unsaved-warning patch

## DM Screen
- Replaced broad substring statblock search with token-aware search.
- Short searches such as `rat` no longer match words such as `aberration`, `creature`, or `restoration`.
- Names remain searchable, including useful cases such as `Rat`, `Swarm of Rats`, `Giant Rat`, and `Wererat`.
- Mobile Add NPC modal now keeps its result list reachable/scrollable after searching.
- Proficiency checkboxes in the custom statblock builder are forced to compact checkbox sizing on desktop and mobile.

## Character Sheet
- Added dirty-state tracking while a character sheet is open.
- Typing/changing fields or using sheet controls marks the character as having unsaved changes.
- Saving, loading, creating a fresh blank sheet, or deleting clears the dirty state.
- Closing/reloading the tab triggers the browser's native unsaved-changes prompt.
- Returning to the character list, starting a new character, resetting test data, or deleting asks for confirmation first when unsaved changes exist.

## Files changed
- css/dm-screen.css
- js/dm-screen.js
- js/core.js
- js/app.js
