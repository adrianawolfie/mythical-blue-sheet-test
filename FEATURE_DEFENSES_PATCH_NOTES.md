# Features & Traits categories + Defenses patch

## Add or replace
- index.html
- css/character-sheet.css
- css/theme-mode.css
- js/app.js
- js/core.js
- js/features.js
- js/defenses.js

## Features & Traits
- Adds name search, category filter, sorting, clear-filters control and result count.
- Adds compact inline category selection per feature card.
- Built-in categories: Class Feature, Species Trait, Origin Feat, General Feat, Fighting Style Feat, Epic Boon Feat, Other.
- Custom category creation remains available through the inline selector.
- Existing saved features without categories remain backward-compatible and default to Other unless inferred from the starter feature name.

## Defenses
- Adds Resistances, Immunities and Vulnerabilities beneath Proficiencies.
- Supports multiple editable rows per defense type.
- Saves under customLists.defenses.
- Older character files remain compatible and load empty defense rows.
