# DM Screen custom statblock scroll fix

This patch fixes the Add NPC modal when the Custom Statblock Builder is open.

## Changed

- The Add NPC modal is now a flex column so its inner sections can shrink correctly.
- The custom statblock builder receives its own scroll area inside the modal.
- The save/cancel action row is sticky at the bottom of the builder, so it remains reachable while scrolling.
- Mobile layout uses the available viewport height instead of trapping fields below the screen.
- Daylight and Moonlight backgrounds are handled for the sticky footer.

## Files

- css/dm-screen.css
