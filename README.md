# Mythical Blue · The Great Depth — Character Sheet

## Repository structure

```text
index.html

assets/
  compass.png
  corner.png
  parchment-seamless.png
  parchment.jpg
  ship.png
  title-banner.png

css/
  styles.css
  accessibility.css

js/
  app.js
  accessibility.js
  conditions.js
  storage-adapter.js
  storage-config.js

characters/
  test-character-index.json
  <character-id>.json

netlify/
  functions/
```

## Architecture

### Shared frontend

`index.html`, `css/styles.css`, `css/accessibility.css`, `js/app.js`,
`js/accessibility.js`, `js/conditions.js`, and `js/storage-adapter.js`
should remain shared between test and production.

### Environment-specific configuration

Only `js/storage-config.js` intentionally differs.

Test repository:

```js
window.APP_CONFIG = {
  storageMode: "local",
  localStorageKey: "mythicalBlueSheetTestCharactersV2",
  seedIndexUrl: "characters/test-character-index.json"
};
```

Production repository:

```js
window.APP_CONFIG = {
  storageMode: "netlify"
};
```

### Save behavior

Test GitHub Pages site:

```text
browser → localStorage
```

Production Netlify site:

```text
browser → Netlify Functions → GitHub character JSON files
```

## Character-save structure

Characters use `schemaVersion: 2` and stable named fields.

Dynamic proficiencies are stored as:

```json
{
  "customLists": {
    "proficiencies": {
      "armor": [],
      "weapons": [],
      "tools": [],
      "other": []
    }
  }
}
```

## Cleanup note

The old root-level `conditions.js` file is obsolete after this update.
The active file is now:

```text
js/conditions.js
```
