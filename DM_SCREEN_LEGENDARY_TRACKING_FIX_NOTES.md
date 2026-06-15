# DM Screen legendary tracking fix

This patch repairs the DM screen legendary-resource behavior:

- SRD statblocks now import Legendary Resistance counts from lines such as `Legendary Resistance (3/Day, or 4/Day in Lair)`.
- SRD statblocks now import Legendary Action counts from lines such as `Legendary Action Uses: 3 (4 in Lair)`.
- Existing NPCs already added to the tracker are re-normalized after the SRD library loads, so legendary counters can appear retroactively.
- The tracker shows how many Legendary Resistances and Legendary Actions are left.
- Legendary Actions still reset to their maximum at the start of the monster's turn when pressing Next Turn.
- The Create Custom Statblock button now visibly opens the builder by hiding the library list while the builder is open.
