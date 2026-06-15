# DM Screen · Custom Statblock Action Line-Break Fix

This patch fixes custom statblock action parsing for entries with lowercase parenthetical descriptors, such as `Crossbow (light).`.

## Fixed

- Separate action lines such as `Scimitar.` and `Crossbow (light).` now render as separate action blocks in the statblock preview.
- Inline legacy text such as `... damage. Crossbow (light). Ranged Weapon Attack...` is also split into separate action blocks where possible.
- Editing a custom monster now pre-fills those actions on separate lines when the action names are recognizable.

## Why it happened

The parser was rejecting action titles with lowercase words inside parentheses. For example, `Crossbow (light).` was treated as continuation text instead of a new action entry.

## Files changed

- `js/dm-screen.js`
