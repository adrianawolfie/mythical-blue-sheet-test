/* Mythical Blue character-sheet application logic.
   Extracted from index.html for maintainability. */

function sw(name, btn) {
    document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
    document.getElementById('pg-' + name).classList.add('on');
    btn.classList.add('on');
  }

const DEFAULT_WEAPON_ROWS = [
  {
    name: "Cutlass",
    atk: "+5",
    damage: "1d6+3 slashing",
    notes: "Finesse"
  },
  { name: "", atk: "", damage: "", notes: "" },
  { name: "", atk: "", damage: "", notes: "" },
  { name: "", atk: "", damage: "", notes: "" },
  { name: "", atk: "", damage: "", notes: "" }
];

const DEFAULT_SPELL_ROWS = [
  {
    level: "C",
    name: "Mage Hand",
    castTime: "1 action",
    range: "30 ft",
    concentration: false,
    ritual: false,
    material: false,
    effect: "",
    details: "",
    open: false
  },
  {
    level: "C",
    name: "Control Water",
    castTime: "1 action",
    range: "300 ft",
    concentration: true,
    ritual: false,
    material: false,
    effect: "",
    details: "",
    open: false
  },
  {
    level: "1",
    name: "Fog Cloud",
    castTime: "1 action",
    range: "120 ft",
    concentration: true,
    ritual: false,
    material: false,
    effect: "",
    details: "",
    open: false
  },
  {
    level: "2",
    name: "Misty Step",
    castTime: "Bonus",
    range: "Self",
    concentration: false,
    ritual: false,
    material: false,
    effect: "",
    details: "",
    open: false
  },
  {
    level: "3",
    name: "Call Lightning",
    castTime: "1 action",
    range: "120 ft",
    concentration: true,
    ritual: false,
    material: false,
    effect: "",
    details: "",
    open: false
  },
  { level: "", name: "", castTime: "", range: "", concentration: false, ritual: false, material: false, effect: "", details: "", open: false },
  { level: "", name: "", castTime: "", range: "", concentration: false, ritual: false, material: false, effect: "", details: "", open: false },
  { level: "", name: "", castTime: "", range: "", concentration: false, ritual: false, material: false, effect: "", details: "", open: false },
  { level: "", name: "", castTime: "", range: "", concentration: false, ritual: false, material: false, effect: "", details: "", open: false }
];

function safeValue(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeText(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tableCell(className, value = "") {
  return `<td><input class="${className}" type="text" value="${safeValue(value)}" /></td>`;
}

function makeEditCell() {
  return `
    <td class="row-edit-cell">
      <div class="row-edit-tools">
        <button type="button" class="row-up" title="Move up">↑</button>
        <button type="button" class="row-down" title="Move down">↓</button>
        <button type="button" class="row-delete delete-x" title="Delete">X</button>
      </div>
    </td>
  `;
}

function attachSimpleRowControls(row) {
  row.querySelector(".row-up")?.addEventListener("click", () => {
    const previous = row.previousElementSibling;
    if (previous) row.parentElement.insertBefore(row, previous);
  });

  row.querySelector(".row-down")?.addEventListener("click", () => {
    const next = row.nextElementSibling;
    if (next) row.parentElement.insertBefore(next, row);
  });

  row.querySelector(".row-delete")?.addEventListener("click", () => {
    if (confirm("Remove this row?")) row.remove();
  });
}

function attachSpellRowControls(mainRow, detailsRow) {
  mainRow.querySelector(".row-up")?.addEventListener("click", () => {
    const previousDetails = mainRow.previousElementSibling;
    const previousMain = previousDetails?.previousElementSibling;

    if (previousMain?.classList.contains("spell-main-row")) {
      const tbody = mainRow.parentElement;
      tbody.insertBefore(mainRow, previousMain);
      tbody.insertBefore(detailsRow, previousMain);
    }
  });

  mainRow.querySelector(".row-down")?.addEventListener("click", () => {
    const nextMain = detailsRow.nextElementSibling;
    const nextDetails = nextMain?.nextElementSibling;

    if (nextMain?.classList.contains("spell-main-row") && nextDetails?.classList.contains("spell-details-row")) {
      const tbody = mainRow.parentElement;
      tbody.insertBefore(nextMain, mainRow);
      tbody.insertBefore(nextDetails, mainRow);
    }
  });

  mainRow.querySelector(".row-delete")?.addEventListener("click", () => {
    if (confirm("Remove this spell?")) {
      detailsRow.remove();
      mainRow.remove();
    }
  });
}

function addWeaponRow(data = {}) {
  const tb = document.getElementById("weaponBody");
  if (!tb) return;

  const tr = document.createElement("tr");
  tr.className = "weapon-row";

  tr.innerHTML =
    tableCell("weapon-name", data.name || "") +
    tableCell("weapon-atk", data.atk || "") +
    tableCell("weapon-damage", data.damage || "") +
    tableCell("weapon-notes", data.notes || "") +
    makeEditCell();

  tb.appendChild(tr);
  attachSimpleRowControls(tr);
}

function resetWeaponRows(rows = DEFAULT_WEAPON_ROWS) {
  const tb = document.getElementById("weaponBody");
  if (!tb) return;

  tb.innerHTML = "";
  rows.forEach(row => addWeaponRow(row));
}

function addSR(data = {}) {
  const tb = document.getElementById("sbody");
  if (!tb) return;

  const spell = {
    level: data.level || "",
    name: data.name || "",
    castTime: data.castTime || "",
    range: data.range || "",
    concentration: data.concentration === true,
    ritual: data.ritual === true,
    material: data.material === true,
    effect: data.effect || "",
    details: data.details || "",
    open: data.open === true
  };

  const mainRow = document.createElement("tr");
  mainRow.className = "spell-main-row";

  const detailsRow = document.createElement("tr");
  detailsRow.className = "spell-details-row";

  mainRow.innerHTML =
    tableCell("spell-level", spell.level) +
    tableCell("spell-name", spell.name) +
    tableCell("spell-cast-time", spell.castTime) +
    tableCell("spell-range", spell.range) +
    `<td style="text-align:center;"><input class="spell-concentration" type="checkbox" ${spell.concentration ? "checked" : ""} /></td>` +
    `<td style="text-align:center;"><input class="spell-ritual" type="checkbox" ${spell.ritual ? "checked" : ""} /></td>` +
    `<td style="text-align:center;"><input class="spell-material" type="checkbox" ${spell.material ? "checked" : ""} /></td>` +
    tableCell("spell-effect", spell.effect) +
    `
      <td class="spell-details-cell">
        <button type="button" class="spell-details-toggle ${spell.open ? "open" : ""}">Details</button>
      </td>
    ` +
    makeEditCell();

  detailsRow.style.display = spell.open ? "" : "none";
  const detailsColspan = document
    .getElementById("spellTable")
    ?.classList.contains("editing")
      ? 10
      : 9;

  detailsRow.innerHTML = `
    <td colspan="${detailsColspan}">
      <div class="spell-details-panel">
        <textarea class="spell-details" placeholder="Full spell rules, upcasting, components, area, duration, reminders...">${safeText(spell.details)}</textarea>
      </div>
    </td>
  `;

  tb.appendChild(mainRow);
  tb.appendChild(detailsRow);

  mainRow.querySelector(".spell-details-toggle").addEventListener("click", event => {
    event.preventDefault();

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const isOpening = detailsRow.style.display === "none";

    detailsRow.style.display = isOpening ? "" : "none";
    event.currentTarget.classList.toggle("open", isOpening);

    requestAnimationFrame(() => {
      window.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "auto"
      });
    });
  });

  attachSpellRowControls(mainRow, detailsRow);
}

function resetSpellRows(rows = DEFAULT_SPELL_ROWS) {
  const tb = document.getElementById("sbody");
  if (!tb) return;

  tb.innerHTML = "";
  rows.forEach(row => addSR(row));
}

function toggleTableEditMode(tableId, button) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const isEditing = table.classList.toggle("editing");

  if (tableId === "spellTable") {
    table.querySelectorAll(".spell-details-row td").forEach(cell => {
      cell.colSpan = isEditing ? 10 : 9;
    });
  }

  if (button) {
    button.classList.toggle("editing-active", isEditing);
  }
}

function collectWeaponRows() {
  return Array.from(document.querySelectorAll("#weaponBody .weapon-row")).map(row => ({
    name: row.querySelector(".weapon-name")?.value || "",
    atk: row.querySelector(".weapon-atk")?.value || "",
    damage: row.querySelector(".weapon-damage")?.value || "",
    notes: row.querySelector(".weapon-notes")?.value || ""
  }));
}

function collectSpellRows() {
  const rows = [];
  const mainRows = Array.from(document.querySelectorAll("#sbody .spell-main-row"));

  mainRows.forEach(mainRow => {
    const detailsRow = mainRow.nextElementSibling;

    rows.push({
      level: mainRow.querySelector(".spell-level")?.value || "",
      name: mainRow.querySelector(".spell-name")?.value || "",
      castTime: mainRow.querySelector(".spell-cast-time")?.value || "",
      range: mainRow.querySelector(".spell-range")?.value || "",
      concentration: mainRow.querySelector(".spell-concentration")?.checked || false,
      ritual: mainRow.querySelector(".spell-ritual")?.checked || false,
      material: mainRow.querySelector(".spell-material")?.checked || false,
      effect: mainRow.querySelector(".spell-effect")?.value || "",
      details: detailsRow?.querySelector(".spell-details")?.value || "",
      open: detailsRow?.style.display !== "none"
    });
  });

  return rows;
}

resetWeaponRows();
resetSpellRows();

let currentCharacterId = null;
let loadedCharacterUpdatedAt = null;
let hpAutoSaveTimer = null;
let indexPollTimer = null;
let sheetHPPollTimer = null;
const cardHPAutoSaveTimers = new Map();

const HP_SYNC_CHANNEL_NAME = "mythical-blue-hp-sync-v1";
const HP_SYNC_STORAGE_KEY = "mythicalBlueHPBroadcastV1";
const hpSyncChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(HP_SYNC_CHANNEL_NAME)
    : null;

function createHPUpdatePayload({ id, hpCurrent, hpMax, tempHp, updatedAt }) {
  return {
    type: "hp-updated",
    id: String(id || ""),
    hpCurrent: hpCurrent ?? "",
    hpMax: hpMax ?? "",
    tempHp: tempHp ?? "",
    updatedAt: updatedAt || new Date().toISOString(),
    nonce:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
  };
}

function publishHPUpdate(update) {
  const payload = createHPUpdatePayload(update);

  try {
    hpSyncChannel?.postMessage(payload);
  } catch (error) {
    console.warn("Could not broadcast HP update:", error);
  }

  // Fallback for browsers that do not support BroadcastChannel.
  // The storage event fires in other tabs on the same origin.
  try {
    localStorage.setItem(HP_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not publish HP update through localStorage:", error);
  }
}

function receiveHPUpdate(payload) {
  if (!payload || payload.type !== "hp-updated" || !payload.id) return;

  applyIndexHPUpdates([payload]);

  if (currentCharacterId === payload.id) {
    applySheetHPUpdates({
      updatedAt: payload.updatedAt,
      summary: {
        hpCurrent: payload.hpCurrent,
        hpMax: payload.hpMax,
        tempHp: payload.tempHp
      }
    });
  }
}

hpSyncChannel?.addEventListener("message", event => {
  receiveHPUpdate(event.data);
});

window.addEventListener("storage", event => {
  if (event.key !== HP_SYNC_STORAGE_KEY || !event.newValue) return;

  try {
    receiveHPUpdate(JSON.parse(event.newValue));
  } catch (error) {
    console.warn("Could not parse HP sync event:", error);
  }
});

const STORAGE_KEY = "mythicalBlueCharacters";
const CURRENT_SCHEMA_VERSION = 2;

// Legacy positional mapping used only to read old schema-v1 characters.
// New saves use stable data-field names so layout changes cannot shift values.
const LEGACY_FIELD_KEYS = [
  "characterName",
  "background",
  "classLevel",
  "experience",
  "speciesRace",
  "subclass",
  "alignment",
  "initiative",
  "speed",
  "armorClass",
  "hpCurrent",
  "hpMax",
  "tempHp",
  "currentConditions",
  "proficiencyBonus",
  "passivePerception",
  "strengthModifier",
  "strengthScore",
  "strengthSavingThrow",
  "athletics",
  "dexterityModifier",
  "dexterityScore",
  "dexteritySavingThrow",
  "acrobatics",
  "sleightOfHand",
  "stealth",
  "constitutionModifier",
  "constitutionScore",
  "constitutionSavingThrow",
  "intelligenceModifier",
  "intelligenceScore",
  "intelligenceSavingThrow",
  "arcana",
  "history",
  "investigation",
  "nature",
  "religion",
  "wisdomModifier",
  "wisdomScore",
  "wisdomSavingThrow",
  "animalHandling",
  "insight",
  "medicine",
  "perception",
  "survival",
  "charismaModifier",
  "charismaScore",
  "charismaSavingThrow",
  "deception",
  "intimidation",
  "performance",
  "persuasion",
  "equipmentProficiencies",
  "hitDice",
  "hitDiceSpent",
  "copperPieces",
  "silverPieces",
  "electrumPieces",
  "goldPieces",
  "platinumPieces",
  "treasureNotes",
  "spellcastingAbility",
  "spellSaveDc",
  "spellAttackBonus",
  "spellSlotsLevel1",
  "spellSlotsLevel2",
  "spellSlotsLevel3",
  "spellSlotsLevel4",
  "spellSlotsLevel5",
  "spellSlotsLevel6",
  "spellSlotsLevel7",
  "spellSlotsLevel8",
  "spellSlotsLevel9",
  "backstory",
  "personalityIdealsBonds",
  "appearance",
  "languages",
  "attunement",
  "equipmentInventory"
];

function getCharacters() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveCharacters(characters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

let focusedCondition = "";

function populateConditionDropdown() {
  const dropdown = document.getElementById("conditionPicker");
  if (!dropdown) return;

  dropdown.innerHTML = `
    <option value="">Add condition…</option>
    ${Object.keys(CONDITION_DETAILS)
      .map(condition => `<option value="${condition}">${condition}</option>`)
      .join("")}
  `;
}

function getSelectedConditions() {
  const input = document.getElementById("currentConditionsInput");
  if (!input || !input.value.trim()) return [];

  const knownConditions = Object.keys(CONDITION_DETAILS);

  return input.value
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .map(value =>
      knownConditions.find(condition =>
        condition.toLowerCase() === value.toLowerCase()
      ) || value
    )
    .filter((value, index, array) =>
      array.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index
    );
}

function setSelectedConditions(conditions) {
  const input = document.getElementById("currentConditionsInput");
  if (!input) return;

  input.value = conditions.join(", ");
}

function addSelectedCondition(condition) {
  if (!condition) return;

  const conditions = getSelectedConditions();

  if (!conditions.some(item => item.toLowerCase() === condition.toLowerCase())) {
    conditions.push(condition);
    setSelectedConditions(conditions);
  }

  focusedCondition = condition;
  renderSelectedConditions();
}

function removeSelectedCondition(condition, event) {
  if (event) event.stopPropagation();

  const conditions = getSelectedConditions().filter(
    item => item.toLowerCase() !== condition.toLowerCase()
  );

  setSelectedConditions(conditions);

  if (focusedCondition.toLowerCase() === condition.toLowerCase()) {
    focusedCondition = conditions[0] || "";
  }

  renderSelectedConditions();
}

function showConditionExplanation(condition) {
  focusedCondition = condition;
  renderSelectedConditions();
}

function renderSelectedConditions() {
  const chips = document.getElementById("activeConditions");
  const display = document.getElementById("currentConditionsDisplay");
  const explanation = document.getElementById("conditionExplanation");
  const conditions = getSelectedConditions();

  if (!chips || !display || !explanation) return;

  if (conditions.length) {
    display.style.display = "none";
  } else {
    display.style.display = "flex";
    display.textContent = "Add condition…";
  }

  chips.innerHTML = conditions.map(condition => `
    <button
      type="button"
      class="condition-chip ${focusedCondition === condition ? "active" : ""}"
      onclick="showConditionExplanation('${condition}')"
    >
      ${condition}
      <span
        class="condition-chip-remove"
        onclick="removeSelectedCondition('${condition}', event)"
        aria-label="Remove ${condition}"
      >×</span>
    </button>
  `).join("");

  if (!focusedCondition || !conditions.includes(focusedCondition)) {
    focusedCondition = conditions[0] || "";
  }

  if (!focusedCondition || !CONDITION_DETAILS[focusedCondition]) {
    explanation.classList.remove("on");
    explanation.innerHTML = "";
    return;
  }

  explanation.innerHTML = `
    <strong>${focusedCondition}</strong>
    <ul>
      ${CONDITION_DETAILS[focusedCondition]
        .map(detail => `<li>${detail}</li>`)
        .join("")}
    </ul>
  `;
  explanation.classList.add("on");
}

function getFields() {
  return Array.from(document.querySelectorAll(".sheet [data-field]"));
}

function readFieldValue(field) {
  return field.type === "checkbox" ? field.checked : field.value;
}

function setFieldValue(field, value) {
  if (!field) return;

  if (field.type === "checkbox") {
    field.checked = value === true;
    return;
  }

  field.value = typeof value === "boolean" ? "" : (value ?? "");
}

function collectNamedFields() {
  const namedFields = Object.fromEntries(
    getFields().map(field => [field.dataset.field, readFieldValue(field)])
  );

  [
    "equipmentProficiencies",
    "armorProficiencies",
    "weaponProficiencies",
    "toolProficiencies",
    "otherProficiencies"
  ].forEach(key => delete namedFields[key]);

  return namedFields;
}

function normalizeSavedFields(character = {}) {
  const savedFields = character.fields || {};

  if (
    character.schemaVersion >= CURRENT_SCHEMA_VERSION &&
    savedFields &&
    !Array.isArray(savedFields)
  ) {
    return savedFields;
  }

  // Temporary backwards-compatible reader for schema-v1 positional saves.
  if (Array.isArray(savedFields)) {
    return Object.fromEntries(
      savedFields
        .map(item => [LEGACY_FIELD_KEYS[item.index], item.value])
        .filter(([key]) => Boolean(key))
    );
  }

  return {};
}

function migrateLegacyEquipmentAndProficiencies(namedFields = {}) {
  const migrated = { ...namedFields };
  const legacyText = String(migrated.equipmentProficiencies || "").trim();

  const newKeys = [
    "armorProficiencies",
    "weaponProficiencies",
    "toolProficiencies",
    "otherProficiencies",
    "equipment"
  ];

  const alreadyMigrated = newKeys.some(key =>
    String(migrated[key] || "").trim()
  );

  if (legacyText && !alreadyMigrated) {
    const otherLines = [];

    legacyText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        const label = match ? match[1].trim().toLowerCase() : "";
        const value = match ? match[2].trim() : line;

        if (/^armou?r$/.test(label)) {
          migrated.armorProficiencies = value;
        } else if (/^weapons?$/.test(label)) {
          migrated.weaponProficiencies = value;
        } else if (/^tools?$/.test(label)) {
          migrated.toolProficiencies = value;
        } else if (/^equipment$/.test(label)) {
          migrated.equipment = value;
        } else {
          otherLines.push(line);
        }
      });

    if (otherLines.length) {
      migrated.otherProficiencies = otherLines.join(" · ");
    }
  }

  delete migrated.equipmentProficiencies;
  return migrated;
}

function applyNamedFields(namedFields = {}) {
  getFields().forEach(field => {
    if (!Object.prototype.hasOwnProperty.call(namedFields, field.dataset.field)) return;
    setFieldValue(field, namedFields[field.dataset.field]);
  });
}

function getFieldValue(fieldKey) {
  const field = document.querySelector(`[data-field="${fieldKey}"]`);
  return field ? readFieldValue(field) : "";
}

function findFieldByNearbyText(possibleTexts) {
  const fields = getFields();

  for (const field of fields) {
    const container = field.closest("label, div, section, article") || field.parentElement;
    const text = container ? container.innerText.toLowerCase() : "";

    if (possibleTexts.some(t => text.includes(t.toLowerCase()))) {
      return field.value;
    }
  }

  return "";
}
 function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addFeatureEntry(listId, data = {}) {
  const list = document.getElementById(listId);
  if (!list) return;

  const hasResource =
    data.hasResource === true ||
    Boolean(String(data.resource || "").trim());

  const entry = document.createElement("div");
  entry.className = "feature-entry";

  entry.innerHTML = `
    <div class="feature-entry-top">
      <input class="feature-name" type="text" placeholder="Name" value="${escapeHtml(data.name || "")}" />
      <input class="feature-short" type="text" placeholder="Short description" value="${escapeHtml(data.short || "")}" />
    </div>

    <div class="feature-meta-row">
      <details ${data.open ? "open" : ""}>
        <summary>Details</summary>
        <textarea class="feature-details" placeholder="Full rules text, usage limits, recharge, source, notes...">${escapeHtml(data.details || "")}</textarea>
      </details>

      <div class="feature-resource-area ${hasResource ? "has-resource" : ""}">
        <button type="button" class="feature-resource-toggle">
          + Add Resource
        </button>

        <div class="feature-resource-box">
          <label>Resource</label>
          <input class="feature-resource" type="text" placeholder="2/3 Short Rest" value="${escapeHtml(data.resource || "")}" />
          <button type="button" class="feature-resource-remove" aria-label="Remove resource tracker">X</button>
        </div>
      </div>
    </div>

    <div class="feature-edit-controls">
      <button type="button" class="feature-edit-btn feature-up">↑</button>
      <button type="button" class="feature-edit-btn feature-down">↓</button>
      <button type="button" class="feature-edit-btn feature-delete delete-x">X</button>
    </div>
  `;

  const resourceArea = entry.querySelector(".feature-resource-area");
  const resourceToggle = entry.querySelector(".feature-resource-toggle");
  const resourceInput = entry.querySelector(".feature-resource");
  const resourceRemove = entry.querySelector(".feature-resource-remove");

  resourceToggle.addEventListener("click", () => {
    resourceArea.classList.add("has-resource");
    resourceInput.focus();
  });

  resourceRemove.addEventListener("click", () => {
    const shouldRemove = confirm(
      "Remove the resource tracker from this feature or trait?"
    );

    if (!shouldRemove) return;

    resourceInput.value = "";
    resourceArea.classList.remove("has-resource");
  });

  entry.querySelector(".feature-up").addEventListener("click", () => {
    const previous = entry.previousElementSibling;
    if (previous) {
      list.insertBefore(entry, previous);
    }
  });

  entry.querySelector(".feature-down").addEventListener("click", () => {
    const next = entry.nextElementSibling;
    if (next) {
      list.insertBefore(next, entry);
    }
  });

  entry.querySelector(".feature-delete").addEventListener("click", () => {
    if (confirm("Remove this feature or trait?")) {
      entry.remove();
    }
  });

  list.appendChild(entry);
}
function toggleFeatureEditMode(listId, button) {
  const list = document.getElementById(listId);
  if (!list) return;

  const isEditing = list.classList.toggle("editing");
  if (button) {
    button.classList.toggle("editing-active", isEditing);
  }
}
function collectFeatureEntries(listId) {
  const list = document.getElementById(listId);
  if (!list) return [];

return Array.from(list.querySelectorAll(".feature-entry")).map(entry => {
  const resourceArea = entry.querySelector(".feature-resource-area");
  const hasResource = resourceArea?.classList.contains("has-resource") || false;

  return {
    name: entry.querySelector(".feature-name")?.value || "",
    short: entry.querySelector(".feature-short")?.value || "",
    hasResource,
    resource: hasResource
      ? entry.querySelector(".feature-resource")?.value || ""
      : "",
    details: entry.querySelector(".feature-details")?.value || "",
    open: entry.querySelector("details")?.open || false
  };
});
}

function renderFeatureEntries(listId, entries = []) {
  const list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = "";

if (!entries.length) {
addFeatureEntry(listId, {
  name: "Class Feature",
  short: "Short summary of what this feature does.",
  resource: "1/1 Short Rest",
  details: ""
});
  addFeatureEntry(listId, {
    name: "Species Trait",
    short: "Short summary of what this trait does.",
    details: ""
  });
  addFeatureEntry(listId, {
    name: "Feat",
    short: "Short summary of what this feat does.",
    details: ""
  });
  return;
}

  entries.forEach(entry => addFeatureEntry(listId, entry));
}
function getValueByExactLabel(labelText) {
  const labels = Array.from(document.querySelectorAll(".sheet label"));

  const label = labels.find(l =>
    l.textContent.trim().toLowerCase() === labelText.toLowerCase()
  );

  if (!label) return "";

  const container = label.parentElement;
  const field = container.querySelector("input, textarea, select");

  return field ? field.value : "";
}
function getToggleStates(selector) {
  return Array.from(document.querySelectorAll(selector)).map(element =>
    element.classList.contains("on")
  );
}

function applyToggleStates(selector, savedStates = []) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.classList.toggle("on", savedStates[index] === true);
  });
}

function collectUiState() {
  return {
    inspiration: document.querySelector(".insp")?.textContent.trim() === "✦",
    skillProficiencies: getToggleStates(".sk .dot"),
    deathSaves: getToggleStates(".dsbox .svdie"),
    exhaustion: getToggleStates(".exhaustion-row .svdie")
  };
}

function applyUiState(uiState = {}) {
  const inspiration = document.querySelector(".insp");
  if (inspiration) {
    inspiration.textContent = uiState.inspiration === true ? "✦" : "○";
  }

  applyToggleStates(".sk .dot", uiState.skillProficiencies || []);
  applyToggleStates(".dsbox .svdie", uiState.deathSaves || []);
  applyToggleStates(".exhaustion-row .svdie", uiState.exhaustion || []);
}

const PROFICIENCY_TYPES = [
  {
    key: "armor",
    label: "Armour",
    placeholder: "Light, medium, heavy, shields…"
  },
  {
    key: "weapons",
    label: "Weapons",
    placeholder: "Simple, martial, hand crossbows…"
  },
  {
    key: "tools",
    label: "Tools",
    placeholder: "Navigator's tools, calligrapher's supplies…"
  },
  {
    key: "other",
    label: "Other",
    placeholder: "Darkvision, swim speed, special training…"
  }
];

function normalizeProficiencyLists(proficiencies = {}) {
  return Object.fromEntries(
    PROFICIENCY_TYPES.map(type => {
      const raw = proficiencies[type.key];
      const values = Array.isArray(raw)
        ? raw
        : (raw === undefined || raw === null ? [] : [raw]);

      const cleaned = values
        .map(value => String(value || ""))
        .filter((value, index) => value.trim() || index === 0);

      return [type.key, cleaned.length ? cleaned : [""]];
    })
  );
}

function proficienciesFromNamedFields(namedFields = {}) {
  const migratedFields = migrateLegacyEquipmentAndProficiencies(namedFields);

  return normalizeProficiencyLists({
    armor: migratedFields.armorProficiencies || "",
    weapons: migratedFields.weaponProficiencies || "",
    tools: migratedFields.toolProficiencies || "",
    other: migratedFields.otherProficiencies || ""
  });
}

function addProficiencyValueRow(typeKey, value = "") {
  const container = document.querySelector(
    `.proficiency-values[data-proficiency-type="${typeKey}"]`
  );

  if (!container) return;

  const row = document.createElement("div");
  row.className = "proficiency-value-row";

  row.innerHTML = `
    <input
      type="text"
      class="proficiency-value"
      value="${escapeHtml(value)}"
      placeholder="${escapeHtml(
        PROFICIENCY_TYPES.find(type => type.key === typeKey)?.placeholder || ""
      )}"
    />
    <button
      type="button"
      class="proficiency-remove-row"
      title="Remove row"
      aria-label="Remove proficiency row"
    >×</button>
  `;

  row.querySelector(".proficiency-remove-row").addEventListener("click", () => {
    const rows = container.querySelectorAll(".proficiency-value-row");

    if (rows.length === 1) {
      row.querySelector(".proficiency-value").value = "";
      return;
    }

    row.remove();
  });

  container.appendChild(row);
}

function renderProficiencyRows(proficiencies = {}) {
  const body = document.getElementById("proficiencyBody");
  if (!body) return;

  const normalized = normalizeProficiencyLists(proficiencies);
  body.innerHTML = "";

  PROFICIENCY_TYPES.forEach(type => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <th class="proficiency-type-cell">
        <div class="proficiency-type-wrap">
          <span class="proficiency-type-label">${type.label}</span>
          <button
            type="button"
            class="proficiency-add-row"
            title="Add ${type.label.toLowerCase()} row"
            aria-label="Add ${type.label.toLowerCase()} proficiency row"
          >+</button>
        </div>
      </th>
      <td class="proficiency-values-cell">
        <div
          class="proficiency-values"
          data-proficiency-type="${type.key}"
        ></div>
      </td>
    `;

    body.appendChild(tr);

    tr.querySelector(".proficiency-add-row").addEventListener("click", () => {
      addProficiencyValueRow(type.key);
    });

    normalized[type.key].forEach(value => {
      addProficiencyValueRow(type.key, value);
    });
  });
}

function collectProficiencyRows() {
  return Object.fromEntries(
    PROFICIENCY_TYPES.map(type => [
      type.key,
      Array.from(
        document.querySelectorAll(
          `.proficiency-values[data-proficiency-type="${type.key}"] .proficiency-value`
        )
      )
        .map(input => input.value.trim())
        .filter(Boolean)
    ])
  );
}

function collectCharacterData() {
  const fields = collectNamedFields();

return {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  id: currentCharacterId || crypto.randomUUID(),
  expectedUpdatedAt: loadedCharacterUpdatedAt,
  updatedAt: new Date().toISOString(),
summary: {
  name: getFieldValue("characterName") || "Unnamed Character",
  armorClass: getFieldValue("armorClass"),
  hpCurrent: getFieldValue("hpCurrent"),
  hpMax: getFieldValue("hpMax"),
  tempHp: getFieldValue("tempHp"),
  hitDice: getFieldValue("hitDice"),
  passivePerception: getFieldValue("passivePerception"),
  currentConditions: getFieldValue("currentConditions")
},
    fields,
    uiState: collectUiState(),
customLists: {
  feats: collectFeatureEntries("featList"),
  weapons: collectWeaponRows(),
  spells: collectSpellRows(),
  proficiencies: collectProficiencyRows()
}
  };
}

function loadCharacter(character) {
  currentCharacterId = character.id;
  loadedCharacterUpdatedAt = character.updatedAt || null;

  const normalizedFields = migrateLegacyEquipmentAndProficiencies(
    normalizeSavedFields(character)
  );

  applyNamedFields(normalizedFields);

renderFeatureEntries("featList", character.customLists?.feats || []);
resetWeaponRows(character.customLists?.weapons || DEFAULT_WEAPON_ROWS);
resetSpellRows(character.customLists?.spells || DEFAULT_SPELL_ROWS);
renderProficiencyRows(
  character.customLists?.proficiencies ||
  proficienciesFromNamedFields(normalizedFields)
);
applyUiState(character.uiState || {});
focusedCondition = "";
renderSelectedConditions();

// HP is also stored explicitly in the character summary.
// Reapply it by id so layout changes cannot shift these two fields.
const hpCurrentInput = document.getElementById("hpCurrentInput");
const hpMaxInput = document.getElementById("hpMaxInput");

if (hpCurrentInput && character.summary?.hpCurrent !== undefined) {
  hpCurrentInput.value = character.summary.hpCurrent || "";
}

if (hpMaxInput && character.summary?.hpMax !== undefined) {
  hpMaxInput.value = character.summary.hpMax || "";
}

// Load Temp HP and Hit Dice by ID so they survive DOM reordering
const tempHpInput = document.getElementById("tempHpInput");
const hitDiceInput = document.getElementById("hitDiceInput");
if (tempHpInput && character.summary?.tempHp !== undefined) {
  tempHpInput.value = character.summary.tempHp || "";
}
if (hitDiceInput && character.summary?.hitDice !== undefined) {
  hitDiceInput.value = character.summary.hitDice || "";
}

updateHPBar(); // sync bar with loaded values

showSheet();
}

async function saveCurrentCharacter(showAlert = true) {
  const data = collectCharacterData();

  try {
    const result = await characterStorage.saveCharacterData(data);

    currentCharacterId = data.id;
    loadedCharacterUpdatedAt = result.updatedAt || data.updatedAt;

    if (showAlert) {
      alert("Character saved!");
    }

    await renderCharacterList();
  } catch (error) {
    console.error(error);
    alert(error.message || "Error saving character.");
  }
}
function newCharacter() {
  currentCharacterId = crypto.randomUUID();
  loadedCharacterUpdatedAt = null;

  getFields().forEach(field => {
    if (field.type === "checkbox") {
      field.checked = false;
    } else {
      field.value = "";
    }
  });

renderFeatureEntries("featList", []);
resetWeaponRows();
resetSpellRows();
renderProficiencyRows();
applyUiState({});
focusedCondition = "";
renderSelectedConditions();

showSheet();
}

async function deleteCurrentCharacter() {
  if (!currentCharacterId) return;
  if (!confirm("Delete this character?")) return;

  try {
    await characterStorage.deleteCharacterData({
      id: currentCharacterId,
      expectedUpdatedAt: loadedCharacterUpdatedAt
    });

    currentCharacterId = null;
    loadedCharacterUpdatedAt = null;

    await renderCharacterList();
    showStartPage();
    alert("Character deleted!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Error deleting character.");
  }
}

async function renderCharacterList() {
  const list = document.getElementById("characterList");

  let characters = [];

  try {
    characters = await characterStorage.listCharacterData();
  } catch (error) {
    console.error(error);
    list.innerHTML = "<p>Could not load saved characters.</p>";
    return;
  }

  if (!characters.length) {
    list.innerHTML = "<p>No saved characters yet.</p>";
    return;
  }

  list.innerHTML = characters.map(character => {
    const hpCur  = parseInt(character.hpCurrent) || 0;
    const hpMax  = parseInt(character.hpMax)     || 0;
    const hpPct  = hpMax > 0 ? Math.round((hpCur / hpMax) * 100) : 0;
    const danger = hpPct > 0 && hpPct <= 50 ? " danger" : "";
    const tempHp = character.tempHp || "";
    return `
    <div class="character-card" data-id="${character.id}">
      <strong>${character.name}</strong><br>
      Armor Class: ${character.armorClass || "—"}<br>
      Passive Perception: ${character.passivePerception || "—"}<br>
      Current Conditions: ${character.currentConditions || "—"}
      <div class="card-hp" data-id="${character.id}" data-temphp="${tempHp}">
        <div class="card-hp-bwrap">
          <div class="card-hp-bar${danger}" style="width:${hpPct}%"></div>
        </div>
        <div class="card-hp-controls">
          <button class="card-hp-adj" data-id="${character.id}" data-delta="-1" title="Lose 1 HP" aria-label="Lose 1 HP for ${character.name}">−</button>
          <span class="card-hp-readout">
            <input class="card-hp-cur" type="number" min="0"
              value="${hpCur}"
              data-id="${character.id}"
              aria-label="Current HP for ${character.name}">
            <span class="card-hp-slash">/</span>
            <input class="card-hp-max" type="number" min="0"
              value="${hpMax}"
              data-id="${character.id}"
              aria-label="Max HP for ${character.name}">
          </span>
          <button class="card-hp-adj" data-id="${character.id}" data-delta="1" title="Gain 1 HP" aria-label="Gain 1 HP for ${character.name}">+</button>
        </div>
      </div>
    </div>`;
  }).join("");

  if (list.dataset.hpHandlersBound === "true") return;
  list.dataset.hpHandlersBound = "true";

  list.addEventListener("click", async (event) => {
    const btn = event.target.closest(".card-hp-adj");
    if (btn) {
      event.stopPropagation();
      const id    = btn.dataset.id;
      const delta = parseInt(btn.dataset.delta, 10);
      const cardHp = list.querySelector(`.card-hp[data-id="${id}"]`);
      if (!cardHp) return;
      const curIn = cardHp.querySelector(".card-hp-cur");
      const maxIn = cardHp.querySelector(".card-hp-max");
      let c = parseInt(curIn.value) || 0;
      const m = parseInt(maxIn.value) || 0;
      c = Math.max(0, Math.min(m || 9999, c + delta));
      curIn.value = c;
      updateCardHPBar(cardHp, c, m);
      scheduleCardHPAutoSave(id, String(c), maxIn.value, cardHp.dataset.temphp);
      return;
    }

    const card = event.target.closest(".character-card");
    if (card && !event.target.closest(".card-hp-controls")) {
      try {
        const result = await characterStorage.loadCharacterData(card.dataset.id);
        loadCharacter(result);
      } catch (error) {
        console.error(error);
        alert(error.message || "Could not load character.");
      }
    }
  });

  list.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.classList.contains("card-hp-cur") && !input.classList.contains("card-hp-max")) return;
    const id     = input.dataset.id;
    const cardHp = list.querySelector(`.card-hp[data-id="${id}"]`);
    if (!cardHp) return;
    const curIn = cardHp.querySelector(".card-hp-cur");
    const maxIn = cardHp.querySelector(".card-hp-max");
    const c = parseInt(curIn.value) || 0;
    const m = parseInt(maxIn.value) || 0;
    updateCardHPBar(cardHp, c, m);
    scheduleCardHPAutoSave(id, curIn.value, maxIn.value, cardHp.dataset.temphp);
  });
}

function updateCardHPBar(cardHpEl, c, m) {
  const bar  = cardHpEl.querySelector(".card-hp-bar");
  if (!bar) return;
  const pct  = m > 0 ? Math.round((c / m) * 100) : 0;
  bar.style.width = pct + "%";
  bar.classList.toggle("danger", pct > 0 && pct <= 50);
}

function scheduleCardHPAutoSave(id, hpCurrent, hpMax, tempHp) {
  clearTimeout(cardHPAutoSaveTimers.get(id));
  cardHPAutoSaveTimers.set(id, setTimeout(async () => {
    cardHPAutoSaveTimers.delete(id);
    try {
      const result = await characterStorage.saveHPOnly({ id, hpCurrent, hpMax, tempHp });

      if (result?.updatedAt && currentCharacterId === id) {
        loadedCharacterUpdatedAt = result.updatedAt;
      }

      publishHPUpdate({
        id,
        hpCurrent,
        hpMax,
        tempHp,
        updatedAt: result?.updatedAt
      });
    } catch (err) {
      console.warn("Card HP auto-save failed:", err.message);
    }
  }, 800));
}

function showStartPage() {
  document.getElementById("startPage").style.display = "block";
  document.querySelector(".sheet").style.display = "none";
  document.querySelector(".sheet-toolbar").style.display = "none";
  stopSheetHPPolling();
  startIndexPolling();
}

function showSheet() {
  document.getElementById("startPage").style.display = "none";
  document.querySelector(".sheet").style.display = "block";
  document.querySelector(".sheet-toolbar").style.display = "flex";
  stopIndexPolling();
  startSheetHPPolling();
}

document.addEventListener("DOMContentLoaded", async () => {
  populateConditionDropdown();
  showStartPage();
  renderSelectedConditions();
  renderFeatureEntries("featList", []);
  renderProficiencyRows();

  document.getElementById("newCharacterBtn").addEventListener("click", newCharacter);
  document.getElementById("saveCharacterBtn").addEventListener("click", saveCurrentCharacter);
  document.getElementById("deleteCharacterBtn").addEventListener("click", deleteCurrentCharacter);

  document.getElementById("backToStartBtn").addEventListener("click", async () => {
    currentCharacterId = null;
    loadedCharacterUpdatedAt = null;
    showStartPage();
    await renderCharacterList();
  });

  try {
    await characterStorage.init();

    const resetButton = document.getElementById("resetTestDataBtn");
    if (characterStorage.canReset && resetButton) {
      resetButton.style.display = "inline-block";
      resetButton.addEventListener("click", async () => {
        if (!confirm("Reset local test data to the repository seed characters?")) return;
        await characterStorage.resetTestData();
        currentCharacterId = null;
        loadedCharacterUpdatedAt = null;
        showStartPage();
        await renderCharacterList();
        alert("Local test data reset.");
      });
    }

    await renderCharacterList();
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not initialize character storage.");
  }
});

// ─── HP TRACKER LOGIC ────────────────────────────────────────────────────────

function adjustHP(delta) {
  const cur = document.getElementById("hpCurrentInput");
  const max = document.getElementById("hpMaxInput");
  if (!cur || !max) return;
  let c = parseInt(cur.value) || 0;
  let m = parseInt(max.value) || 0;
  c = Math.max(0, Math.min(m || 9999, c + delta));
  cur.value = c;
  updateHPBar();
  scheduleHPAutoSave();
}

function updateHPBar() {
  const bar = document.getElementById("hp-bar");
  const cur = document.getElementById("hpCurrentInput");
  const max = document.getElementById("hpMaxInput");
  if (!bar || !cur || !max) return;
  const c = parseInt(cur.value) || 0;
  const m = parseInt(max.value) || 0;
  const pct = m > 0 ? Math.round((c / m) * 100) : 0;
  bar.style.width = pct + "%";
  // green above 50 %, red at 50 % and below
  bar.classList.toggle("danger", pct > 0 && pct <= 50);
}

function onHPInput() {
  updateHPBar();
  scheduleHPAutoSave();
}

function scheduleHPAutoSave() {
  clearTimeout(hpAutoSaveTimer);
  hpAutoSaveTimer = setTimeout(async () => {
    hpAutoSaveTimer = null;
    if (!currentCharacterId) return;
    try {
      const result = await characterStorage.saveHPOnly({
        id:        currentCharacterId,
        hpCurrent: document.getElementById("hpCurrentInput")?.value ?? "",
        hpMax:     document.getElementById("hpMaxInput")?.value ?? "",
        tempHp:    document.getElementById("tempHpInput")?.value ?? ""
      });
      if (result?.updatedAt) loadedCharacterUpdatedAt = result.updatedAt;

      publishHPUpdate({
        id: currentCharacterId,
        hpCurrent: document.getElementById("hpCurrentInput")?.value ?? "",
        hpMax: document.getElementById("hpMaxInput")?.value ?? "",
        tempHp: document.getElementById("tempHpInput")?.value ?? "",
        updatedAt: result?.updatedAt
      });
    } catch (err) {
      console.warn("HP auto-save failed:", err.message);
    }
  }, 800);
}

// ─── INDEX PAGE POLLING ───────────────────────────────────────────────────────

function startIndexPolling() {
  stopIndexPolling();
  scheduleIndexPoll();
}

function stopIndexPolling() {
  clearTimeout(indexPollTimer);
  indexPollTimer = null;
}

function scheduleIndexPoll() {
  const ms = document.hidden ? 30000 : 5000;
  indexPollTimer = setTimeout(async () => {
    await pollIndexHP();
    if (indexPollTimer !== null) scheduleIndexPoll();
  }, ms);
}

async function pollIndexHP() {
  try {
    const characters = await characterStorage.listCharacterData();
    applyIndexHPUpdates(characters);
  } catch {
    // silent — wait for next poll
  }
}

function applyIndexHPUpdates(characters) {
  const list = document.getElementById("characterList");
  if (!list) return;

  for (const ch of characters) {
    const cardHp = list.querySelector(`.card-hp[data-id="${ch.id}"]`);
    if (!cardHp) continue;

    const curIn = cardHp.querySelector(".card-hp-cur");
    const maxIn = cardHp.querySelector(".card-hp-max");
    if (!curIn || !maxIn) continue;

    // Skip if user is actively editing this card's HP
    if (document.activeElement === curIn || document.activeElement === maxIn) continue;

    // Skip if a pending auto-save timer exists (user just made a change)
    if (cardHPAutoSaveTimers.has(ch.id)) continue;

    const newCur = String(ch.hpCurrent || "0");
    const newMax = String(ch.hpMax     || "0");

    if (curIn.value !== newCur || maxIn.value !== newMax) {
      curIn.value = newCur;
      maxIn.value = newMax;
      updateCardHPBar(cardHp, parseInt(newCur) || 0, parseInt(newMax) || 0);
    }

    // Keep tempHp data attribute in sync for future auto-saves
    if (ch.tempHp !== undefined) {
      cardHp.dataset.temphp = ch.tempHp;
    }
  }
}

// ─── CHARACTER SHEET HP POLLING ───────────────────────────────────────────────

function startSheetHPPolling() {
  stopSheetHPPolling();
  scheduleSheetHPPoll();
}

function stopSheetHPPolling() {
  clearTimeout(sheetHPPollTimer);
  sheetHPPollTimer = null;
}

function scheduleSheetHPPoll() {
  const ms = document.hidden ? 30000 : 5000;
  sheetHPPollTimer = setTimeout(async () => {
    await pollSheetHP();
    if (sheetHPPollTimer !== null) scheduleSheetHPPoll();
  }, ms);
}

async function pollSheetHP() {
  if (!currentCharacterId) return;
  try {
    const character = await characterStorage.loadCharacterData(currentCharacterId);
    applySheetHPUpdates(character);
  } catch {
    // silent — wait for next poll
  }
}

function applySheetHPUpdates(character) {
  // Don't overwrite while a local auto-save is pending
  if (hpAutoSaveTimer !== null) return;

  const remoteUpdatedAt = character.updatedAt;
  // Skip if we already have this version or newer
  if (remoteUpdatedAt && loadedCharacterUpdatedAt &&
      remoteUpdatedAt <= loadedCharacterUpdatedAt) return;

  const curIn = document.getElementById("hpCurrentInput");
  const maxIn = document.getElementById("hpMaxInput");
  const tmpIn = document.getElementById("tempHpInput");

  if (curIn && document.activeElement !== curIn) {
    curIn.value = character.summary?.hpCurrent ?? "";
  }
  if (maxIn && document.activeElement !== maxIn) {
    maxIn.value = character.summary?.hpMax ?? "";
  }
  if (tmpIn && document.activeElement !== tmpIn) {
    tmpIn.value = character.summary?.tempHp ?? "";
  }

  // Only advance our timestamp if none of the HP fields are focused
  if (document.activeElement !== curIn &&
      document.activeElement !== maxIn &&
      document.activeElement !== tmpIn) {
    loadedCharacterUpdatedAt = remoteUpdatedAt;
  }

  updateHPBar();
}

// ─── PAGE VISIBILITY ──────────────────────────────────────────────────────────

document.addEventListener("visibilitychange", () => {
  if (indexPollTimer !== null) {
    stopIndexPolling();
    startIndexPolling();
  }
  if (sheetHPPollTimer !== null) {
    stopSheetHPPolling();
    startSheetHPPolling();
  }
});
