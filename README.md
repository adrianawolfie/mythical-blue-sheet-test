# Mythical Blue · The Great Depth

## Architecture

This app intentionally uses plain HTML, CSS, and JavaScript. It does not require
a framework or build process.

## Environment behavior

The same `js/storage-config.js` file works in both environments:

```text
GitHub Pages / localhost
→ browser localStorage test data

Netlify production
→ shared Netlify Functions
→ GitHub character JSON files
```

This prevents an accidental repository copy from silently switching production
into localStorage mode.

## Frontend structure

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
  styles.css                 import-only entry point
  base.css                   global layout and base styles
  character-sheet.css        sheet sections and mobile layout
  components.css             shared sheet components such as HP tracker
  character-overview.css     Saved Characters cards and live controls
  speeds.css                 optional movement speeds
  calendar.css               Materra calendar
  accessibility.css          Aa text-size controls

js/
  conditions.js              condition reference data
  storage-config.js          automatic environment detection
  storage-adapter.js         localStorage / Netlify abstraction

  core.js                    schema, migrations, load/save, navigation
  tables.js                  weapons and spells
  conditions-ui.js           sheet condition controls
  features.js                features and traits
  proficiencies.js           proficiency rows
  speeds.js                  optional movement speeds
  character-overview.js      Saved Characters cards
  live-sync.js               HP / AC / conditions autosave and polling
  app.js                     startup and event binding

  campaign-state.js          shared campaign-state storage adapter
  calendar.js                Materra calendar and travel controls
  accessibility.js           font-size controls

netlify/
  functions/
    get-character-index.js
    get-character.js
    save-character.js
    save-character-status.js
    get-campaign-state.js
    save-campaign-state.js
    delete-character.js
```

## Save structure

Character JSON remains backwards compatible. No character migration is required
for this cleanup.

Frequently changing values are saved through:

```text
netlify/functions/save-character-status.js
```

This handles:

```text
HP
Temp HP
Armor Class
Conditions
```


## Shared campaign calendar

The calendar and travel counter are campaign-wide rather than character-specific.

```text
GitHub Pages test site
→ local campaign-state test data

Netlify production
→ campaign/campaign-state.json
→ shared between users and devices
```

The Saved Characters overview allows the DM to:

```text
set the campaign date manually
add 1 traveled day
remove 1 traveled day
add 1 traveled week
add 1 Materra month (28 days)
```

Character sheets show the saved campaign date as a read-only bar.
