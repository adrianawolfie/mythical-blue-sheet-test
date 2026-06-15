# DM Screen edit monsters + Moonlight visibility patch

Changed files:
- dm-screen.html
- css/dm-screen.css
- js/dm-screen.js

What changed:
- Moonlight Mode statblock result cards now use brighter title, metadata, small text, and chip colors so the creature subtitle is readable.
- Each statblock result now has Preview, Edit, and Add actions.
- The statblock preview panel also has an Edit Statblock button.
- Editing a Custom statblock reopens it in the Mythical Blue builder and saves changes to the same custom statblock.
- Editing an SRD statblock opens it in the builder as a custom copy. This keeps the SRD library untouched while letting the DM save a modified version.
- The custom builder is prefilled from the selected statblock where possible: basics, AC/HP/speed/CR, legendary resources, abilities, metadata, traits, actions, bonus actions, reactions, and legendary actions.
- The Create Custom Statblock button now starts from a clean form.

Validation:
- js/dm-screen.js passes node --check.
