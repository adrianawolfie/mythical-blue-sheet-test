# DM Screen proficiency-bonus patch

This patch adds proficiency-bonus support to the DM Screen statblock system.

## Included changes

- SRD statblocks now display their proficiency bonus when the source text contains `PB +X`, for example `PB +4`.
- If no PB text is present, the DM Screen falls back to the standard CR-to-proficiency-bonus progression.
- Statblock result chips and full statblock previews now show PB.
- The custom statblock builder now has a Proficiency Bonus field.
- The builder now lets the DM mark saving throws as proficient.
- The builder now lets the DM enter skill proficiencies and skill expertise.
- Custom statblocks calculate saving throw and skill bonuses from ability scores + PB.
- Editing SRD monsters still creates a custom copy rather than overwriting the SRD library.
- Editing saved custom monsters keeps the same custom statblock ID.

## Files

- dm-screen.html
- css/dm-screen.css
- js/dm-screen.js
