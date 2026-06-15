# DM Screen Custom Monsters, Description Notes, and Legendary Resource Layout

This patch extends the DM Screen using the current test repository plus the latest DM Screen patches.

## Added

- Legendary Resistances and Legendary Actions now render on the same compact row in the initiative tracker.
- The Legendary Actions tracker no longer includes the explanatory reset text, saving vertical space.
- NPC rows now include a small editable description / table-note textarea.
- When a monster is added from a statblock, the note is prefilled from the statblock description when available.
- Custom statblock builder now has a Description / Table Note field.
- Full statblock previews show the description when available.
- Added a seeded custom monster library at `data/custom-statblocks.json`.

## Added custom monsters from XML

- Deck Swabbie
- Below Deck Swabbie
- Bosun

These appear in the NPC picker under the `Custom Monsters` category. They can be previewed, added, and edited. Editing one of these saves an override into local DM tracker state, leaving the bundled seed file intact.

## Validation

- JavaScript syntax passed.
- JSON parsing passed.
- Local HTML and CSS references resolve.
