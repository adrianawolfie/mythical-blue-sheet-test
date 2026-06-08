# Mythical Blue · The Great Depth

A plain HTML, CSS, and JavaScript character-sheet web app with a character overview, campaign calendar, structured inventory, SRD libraries, and a DM initiative screen.

## Environments

The same frontend is used in test and production. `js/storage-config.js` selects the correct storage behavior automatically:

```text
GitHub Pages / localhost
→ browser localStorage test data
→ seeded from characters/test-character-index.json

Netlify production
→ shared Netlify Functions
→ GitHub-backed character JSON files
```

## Pages

```text
index.html        Character Overview and Character Sheet
dm-screen.html    DM Screen with initiative tracker and inline SRD statblocks
```

## Stylesheets

`css/styles.css` is the main character-sheet entry point. Its import order is intentional.

```text
css/
  accessibility.css       Aa text-size controls
  styles.css              character-sheet import entry point
  base.css                global layout and core variables
  character-sheet.css     main sheet layout and mobile behavior
  components.css          shared sheet components
  inventory.css           structured inventory and equipment UI
  spells.css              spellbook, spell cards, and spell picker
  armor-class.css         AC editor
  character-overview.css  overview cards and live controls
  speeds.css              optional movement speeds
  calendar.css            Materra calendar
  srd-library.css         feat and item picker UI
  dm-screen.css           DM screen and statblock UI
  theme-mode.css          Daylight / Moonlight theme overrides
```

Avoid linking `inventory.css`, `spells.css`, or `armor-class.css` separately from `index.html`; they are already imported by `styles.css`.

## Assets

Daylight assets remain in their original stable paths. Theme-specific moonlight assets are grouped under `assets/themes/moonlight/`.

```text
assets/
  parchment-seamless.png
  compass.png
  corner.png
  ship.png
  title-banner.png

  equipment-icons/        daylight equipment-slot icons
  spell-icons/            daylight spell-school and area icons
  icons/navigation/       daylight navigation icons

  themes/moonlight/
    backgrounds/          moonlight parchment texture
    branding/             moonlight title banner
    ornaments/            moonlight compass, corner, and ship art
    equipment-icons/      moonlight equipment-slot icons
    spell-icons/          moonlight spell-school and area icons
    navigation/           moonlight navigation icons
```

`js/theme-mode.js` swaps supported assets automatically when Daylight / Moonlight mode changes, including dynamically rendered spell and equipment icons.

## SRD libraries

Editable snapshot import flows are available for SRD 5.2.1 content:

```text
data/srd-spells.json      351 spells
data/srd-feats.json        22 feats, including Mythical Blue origin feats
data/srd-items.json       435 equipment and magic-item entries
data/srd-statblocks.json  330 monster and animal statblocks
```

Imported entries remain editable. Custom spells, feats, traits, items, and NPCs remain supported.

## Character data

Character JSON stays backwards compatible. Frequently changing values are saved through:

```text
netlify/functions/save-character-status.js
```

This includes:

```text
HP
Temp HP
Armor Class
Conditions
```

## Inventory model

The inventory page stores owned items, their locations, and equipped or carried slots separately:

```text
customLists.inventoryItems
customLists.storageLocations
customLists.equippedSlots
customLists.customEquippedSlots
```

Legacy freeform inventory notes remain visible under **Imported / Freeform Notes**.

## Accessibility

The Aa controls scale local app stylesheets automatically. New UI additions should continue to use local CSS files and remain compatible with both desktop and mobile font scaling.
