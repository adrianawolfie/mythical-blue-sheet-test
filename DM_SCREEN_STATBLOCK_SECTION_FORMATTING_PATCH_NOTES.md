# DM Screen statblock section formatting patch

This patch improves how the custom statblock editor handles separated text entries.

## What changed

- Textarea placeholders now show real line breaks instead of literal `\n` text.
- The editor now converts pasted literal `\n` sequences into actual line breaks before saving.
- Traits, Actions, Bonus Actions / Reactions, Legendary Actions, metadata, and description fields normalize their line breaks before saving.
- Statblock rendering can recover older saved text that contains literal `\n` sequences.
- Statblock rendering also tries to split multiple action-style entries that accidentally ended up on one line, such as `Scimitar. ... Crossbow. ...`.
- Added small helper text below the key statblock text fields explaining how to separate entries and sections.

## How to use in the editor

- Put each trait or action on its own line:
  - `Scimitar. Melee Weapon Attack...`
  - `Crossbow. Ranged Weapon Attack...`
- For extra sections, put the section heading on its own line:
  - `Bonus Actions`
  - `Shadow Step. ...`
  - `Reactions`
  - `Parry. ...`
- For legendary actions, only enter the action options. Use the numeric Legendary Actions field for the amount.
