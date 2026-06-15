# DM Screen · campaign custom statblocks + compact legendary tracker

This patch refines the DM Screen changes from the previous custom-monster phase.

## Included changes

- Legendary Resistances and Legendary Actions are rendered in one compact tracker row.
- The extra monster description / table note field was removed from the initiative tracker.
- Monster descriptions now live only in the statblock preview / expanded statblock.
- The custom statblock builder keeps a Description field, but it is explicitly for the statblock, not the tracker row.
- Custom statblocks created or edited in production are saved to shared campaign storage via Netlify Functions.
- Local/test environments still save custom statblocks in browser local storage.

## New shared storage files

Production uses these Netlify Functions:

- `netlify/functions/get-custom-statblocks.js`
- `netlify/functions/save-custom-statblocks.js`

Saved production custom statblocks are written to:

- `campaign/custom-statblocks.json`

The bundled XML-imported monsters remain in:

- `data/custom-statblocks.json`

If a bundled monster is edited, the edited version is saved as a campaign custom statblock and overrides the bundled version in the DM picker while keeping the bundled source file intact.

## Deployment note

Upload all included files together. The new Netlify functions require the same GitHub environment variables already used by character and campaign-state saves:

- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH` if production does not use `main`
