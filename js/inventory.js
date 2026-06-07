// Mythical Blue · Inventory page
// Structured items, storage locations, mirrored coinage, equipped slots, and filters.

const DEFAULT_INVENTORY_EQUIPMENT_ROWS = [];
const DEFAULT_INVENTORY_MAGIC_ITEM_ROWS = [];
const DEFAULT_INVENTORY_CONSUMABLE_ROWS = [];
const DEFAULT_INVENTORY_GEM_ROWS = [];
const DEFAULT_STORAGE_LOCATION_ROWS = [];
const DEFAULT_INVENTORY_ATTUNEMENT_ROWS = [
  { item: "", notes: "" },
  { item: "", notes: "" },
  { item: "", notes: "" }
];

const EQUIPPED_SLOT_DEFINITIONS = [
  { key: "head", label: "Head" },
  { key: "neck", label: "Neck" },
  { key: "cape", label: "Cape" },
  { key: "armor", label: "Armor" },
  { key: "clothing", label: "Clothing" },
  { key: "mainHand", label: "Main Hand" },
  { key: "offHand", label: "Off Hand" },
  { key: "ring1", label: "Ring 1" },
  { key: "ring2", label: "Ring 2" },
  { key: "belt", label: "Belt / Quick Access" },
  { key: "glovesBracers", label: "Gloves / Bracers" },
  { key: "footwear", label: "Footwear" },
  { key: "backStorage", label: "Backpack / Carried Storage" },
  { key: "otherWorn", label: "Other Worn Item" }
];

const STANDARD_ITEM_LOCATIONS = [
  { value: "", label: "Unassigned" },
  { value: "carried", label: "Carried" },
  { value: "worn", label: "Worn / Equipped" }
];


const SILHOUETTE_VIEW_DEFAULT = "silhouette";

const EQUIPPED_SILHOUETTE_COLUMNS = {
  left: ["head", "cape", "armor", "mainHand", "glovesBracers", "ring1", "footwear"],
  right: ["neck", "clothing", "offHand", "belt", "backStorage", "ring2", "otherWorn"]
};

const EQUIPPED_SLOT_ICON_MAP = {
  head: "assets/equipment-icons/head-hood.png",
  neck: "assets/equipment-icons/necklace.svg",
  cape: "assets/equipment-icons/cape.png",
  armor: "assets/equipment-icons/armor.png",
  clothing: "assets/equipment-icons/clothing.png",
  mainHand: "assets/equipment-icons/main-hand.png",
  offHand: "assets/equipment-icons/off-hand.png",
  ring1: "assets/equipment-icons/ring.svg",
  ring2: "assets/equipment-icons/ring.svg",
  belt: "assets/equipment-icons/belt.png",
  glovesBracers: "assets/equipment-icons/gloves-bracers.png",
  footwear: "assets/equipment-icons/boots.png",
  backStorage: "assets/equipment-icons/backpack.png",
  otherWorn: "assets/equipment-icons/clothing.png"
};

const CUSTOM_SLOT_NODE_HINTS = [
  { pattern: /glove|bracer|gauntlet/i, slot: "glovesBracers" },
  { pattern: /boot|shoe|greave/i, slot: "footwear" },
  { pattern: /backpack|satchel|bag|pouch|quiver|pack/i, slot: "backStorage" },
  { pattern: /cloak|cape|mantle/i, slot: "cape" },
  { pattern: /ring/i, slot: "ring2" },
  { pattern: /helmet|hood|circlet|hat/i, slot: "head" },
  { pattern: /amulet|necklace|pendant/i, slot: "neck" },
  { pattern: /belt/i, slot: "belt" },
  { pattern: /weapon|sword|staff|wand|bow|axe|hammer/i, slot: "mainHand" },
  { pattern: /shield|focus|orb|lantern/i, slot: "offHand" }
];

let currentEquippedSlotsState = Object.fromEntries(
  EQUIPPED_SLOT_DEFINITIONS.map(slot => [slot.key, ""])
);

function getInventoryView() {
  return document.getElementById("equippedLayout")?.dataset.view || SILHOUETTE_VIEW_DEFAULT;
}

function setInventoryView(view = SILHOUETTE_VIEW_DEFAULT) {
  const layout = document.getElementById("equippedLayout");
  if (!layout) return;

  const selectedView = view === "list" ? "list" : SILHOUETTE_VIEW_DEFAULT;
  layout.dataset.view = selectedView;
  layout.classList.toggle("is-list-view", selectedView === "list");
  layout.classList.toggle("is-silhouette-view", selectedView !== "list");

  document.querySelectorAll(".inventory-view-btn").forEach(button => {
    const active = button.dataset.inventoryView === selectedView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  renderEquippedActiveView();
}

function bindInventoryViewToggle() {
  document.querySelectorAll(".inventory-view-btn").forEach(button => {
    button.addEventListener("click", () => {
      setInventoryView(button.dataset.inventoryView || SILHOUETTE_VIEW_DEFAULT);
    });
  });
}

function getSelectedOptionLabel(select) {
  return select?.selectedOptions?.[0]?.textContent?.trim() || "";
}

function findEquippedSlotDefinition(slotKey) {
  return EQUIPPED_SLOT_DEFINITIONS.find(slot => slot.key === slotKey);
}

function createEquippedSlotCard(slot, value = "") {
  const iconSrc = EQUIPPED_SLOT_ICON_MAP[slot.key] || EQUIPPED_SLOT_ICON_MAP.otherWorn;
  return `
    <label class="equipped-slot-card${value ? " is-active" : ""}" data-slot-key="${inventorySafeValue(slot.key)}">
      <span class="equipped-slot-icon-wrap">
        <img class="equipped-slot-icon" src="${inventorySafeValue(iconSrc)}" alt="" aria-hidden="true">
      </span>
      <span class="equipped-slot-content">
        <span class="equipped-slot-label">${inventorySafeValue(slot.label)}</span>
        <select
          class="equipped-slot-select"
          data-equipped-slot="${inventorySafeValue(slot.key)}"
          data-selected-item-id="${inventorySafeValue(value || "")}"
        ></select>
      </span>
    </label>
  `;
}

function bindEquippedSlotEvents(scope = document) {
  scope.querySelectorAll('.equipped-slot-select[data-equipped-slot]').forEach(select => {
    select.addEventListener('change', () => {
      const slotKey = select.dataset.equippedSlot;
      currentEquippedSlotsState[slotKey] = select.value || "";
      select.dataset.selectedItemId = select.value || "";
      renderEquippedNodeMap();
    });
  });
}

function populateEquippedSelects(scope = document) {
  scope.querySelectorAll('.equipped-slot-select').forEach(select => {
    refreshEquippedSelect(select);
    if (select.dataset.equippedSlot) {
      currentEquippedSlotsState[select.dataset.equippedSlot] = select.value || "";
      const card = select.closest('.equipped-slot-card');
      if (card) card.classList.toggle('is-active', Boolean(select.value));
    }
  });
}

function renderEquippedSilhouetteColumns(equippedSlots = currentEquippedSlotsState) {
  const left = document.getElementById('equippedLeftColumn');
  const right = document.getElementById('equippedRightColumn');
  if (!left || !right) return;

  left.innerHTML = EQUIPPED_SILHOUETTE_COLUMNS.left
    .map(key => createEquippedSlotCard(findEquippedSlotDefinition(key), equippedSlots[key] || ""))
    .join('');

  right.innerHTML = EQUIPPED_SILHOUETTE_COLUMNS.right
    .map(key => createEquippedSlotCard(findEquippedSlotDefinition(key), equippedSlots[key] || ""))
    .join('');

  bindEquippedSlotEvents(left);
  bindEquippedSlotEvents(right);
  populateEquippedSelects(left);
  populateEquippedSelects(right);
}

function renderEquippedListView(equippedSlots = currentEquippedSlotsState) {
  const list = document.getElementById('equippedListView');
  if (!list) return;

  list.innerHTML = EQUIPPED_SLOT_DEFINITIONS
    .map(slot => createEquippedSlotCard(slot, equippedSlots[slot.key] || ""))
    .join('');

  bindEquippedSlotEvents(list);
  populateEquippedSelects(list);
}

function resolveEquippedNodeStates() {
  const states = {};

  EQUIPPED_SLOT_DEFINITIONS.forEach(slot => {
    const itemId = currentEquippedSlotsState[slot.key] || "";
    states[slot.key] = {
      filled: Boolean(itemId),
      label: ""
    };
  });

  document.querySelectorAll('.equipped-slot-select[data-equipped-slot]').forEach(select => {
    const slotKey = select.dataset.equippedSlot;
    if (!slotKey) return;
    states[slotKey] = {
      filled: Boolean(select.value),
      label: getSelectedOptionLabel(select)
    };
  });

  document.querySelectorAll('#customEquippedSlots .custom-equipped-slot').forEach(row => {
    const name = row.querySelector('.custom-equipped-slot-name')?.value.trim() || "";
    const select = row.querySelector('.equipped-slot-select');
    if (!name || !select?.value) return;

    const hint = CUSTOM_SLOT_NODE_HINTS.find(entry => entry.pattern.test(name));
    if (!hint) return;

    if (!states[hint.slot] || !states[hint.slot].filled) {
      states[hint.slot] = {
        filled: true,
        label: getSelectedOptionLabel(select) || name
      };
    }
  });

  return states;
}

function renderEquippedNodeMap() {
  const states = resolveEquippedNodeStates();

  document.querySelectorAll('.silhouette-node').forEach(node => {
    const slotKey = node.dataset.slotKey;
    const active = Boolean(states[slotKey]?.filled);
    node.classList.toggle('is-active', active);
    node.title = active ? states[slotKey]?.label || findEquippedSlotDefinition(slotKey)?.label || '' : findEquippedSlotDefinition(slotKey)?.label || '';
  });

  document.querySelectorAll('.equipped-slot-card').forEach(card => {
    const slotKey = card.dataset.slotKey;
    const active = Boolean(states[slotKey]?.filled);
    card.classList.toggle('is-active', active);
  });
}

function renderEquippedActiveView() {
  const view = getInventoryView();
  const silhouetteShell = document.getElementById('equippedSilhouetteShell');
  const listView = document.getElementById('equippedListView');

  if (view === 'list') {
    if (silhouetteShell) silhouetteShell.hidden = true;
    if (listView) listView.hidden = false;
    renderEquippedListView(currentEquippedSlotsState);
  } else {
    if (silhouetteShell) silhouetteShell.hidden = false;
    if (listView) listView.hidden = true;
    renderEquippedSilhouetteColumns(currentEquippedSlotsState);
  }

  renderEquippedNodeMap();
}

function inventoryId(prefix = "item") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function inventorySafeValue(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inventorySafeText(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeInventoryItem(data = {}, prefix = "item") {
  return {
    id: String(data.id || inventoryId(prefix)),
    name: String(data.name || ""),
    qty: String(data.qty || ""),
    value: String(data.value || ""),
    location: String(data.location || ""),
    details: String(data.details || ""),
    open: data.open === true
  };
}

function normalizeStorageLocation(data = {}) {
  return {
    id: String(data.id || inventoryId("storage")),
    name: String(data.name || ""),
    type: String(data.type || ""),
    notes: String(data.notes || "")
  };
}

function inventoryRemoveButton(label = "row") {
  return `
    <td class="inventory-remove-cell">
      <button
        type="button"
        class="inventory-remove"
        title="Remove ${inventorySafeValue(label)}"
        aria-label="Remove ${inventorySafeValue(label)}"
      >×</button>
    </td>
  `;
}

function inventoryInputCell(className, value = "", placeholder = "") {
  return `
    <td>
      <input
        class="${className}"
        type="text"
        value="${inventorySafeValue(value)}"
        placeholder="${inventorySafeValue(placeholder)}"
      >
    </td>
  `;
}

function inventoryLocationCell(value = "") {
  return `
    <td>
      <select class="inventory-location" data-selected-location="${inventorySafeValue(value)}">
      </select>
    </td>
  `;
}

function inventoryDetailsCell(open = false) {
  return `
    <td class="inventory-details-cell">
      <button
        type="button"
        class="inventory-details-toggle ${open ? "open" : ""}"
      >Details</button>
    </td>
  `;
}

function inventoryDetailsRow(details = "", open = false, colspan = 6) {
  const row = document.createElement("tr");
  row.className = "inventory-item-details-row";
  row.style.display = open ? "" : "none";
  row.innerHTML = `
    <td colspan="${colspan}">
      <div class="inventory-item-details-panel">
        <textarea
          class="inventory-item-details"
          placeholder="Full item description, properties, charges, weight, attunement requirements, lore, reminders..."
        >${inventorySafeText(details)}</textarea>
      </div>
    </td>
  `;

  return row;
}

function getStorageLocations() {
  return Array.from(
    document.querySelectorAll("#storageLocationsBody .storage-location-row")
  ).map(row => ({
    id: row.dataset.storageId,
    name: row.querySelector(".storage-location-name")?.value.trim() || "",
    type: row.querySelector(".storage-location-type")?.value.trim() || "",
    notes: row.querySelector(".storage-location-notes")?.value.trim() || ""
  }));
}

function locationOptions() {
  return [
    ...STANDARD_ITEM_LOCATIONS,
    ...getStorageLocations()
      .filter(location => location.name)
      .map(location => ({
        value: `storage:${location.id}`,
        label: location.name
      }))
  ];
}

function refreshLocationSelect(select) {
  if (!select) return;

  const previous = select.value || select.dataset.selectedLocation || "";

  select.innerHTML = locationOptions()
    .map(option => `
      <option value="${inventorySafeValue(option.value)}">
        ${inventorySafeValue(option.label)}
      </option>
    `)
    .join("");

  select.value = Array.from(select.options).some(option => option.value === previous)
    ? previous
    : "";

  select.dataset.selectedLocation = select.value;
}

function refreshAllLocationSelects() {
  document.querySelectorAll(".inventory-location").forEach(refreshLocationSelect);
}

function getEquippableItems() {
  const equipment = [];
  const magicItems = [];
  const storageItems = [];

  document
    .querySelectorAll("#inventoryEquipmentBody .inventory-equipment-row")
    .forEach(row => {
      const name = row.querySelector(".inventory-equipment-name")?.value.trim() || "";

      if (name) {
        equipment.push({
          id: row.dataset.itemId,
          label: name
        });
      }
    });

  document
    .querySelectorAll("#inventoryMagicItemsBody .inventory-magic-row")
    .forEach(row => {
      const name = row.querySelector(".inventory-magic-name")?.value.trim() || "";

      if (name) {
        magicItems.push({
          id: row.dataset.itemId,
          label: name
        });
      }
    });

  getStorageLocations()
    .filter(location => location.name)
    .forEach(location => {
      storageItems.push({
        id: `storage:${location.id}`,
        label: location.name
      });
    });

  return {
    equipment,
    magicItems,
    storageItems
  };
}

function equippedOptionGroup(label, items) {
  if (!items.length) return "";

  return `
    <optgroup label="${inventorySafeValue(label)}">
      ${items
        .map(item => `
          <option value="${inventorySafeValue(item.id)}">
            ${inventorySafeValue(item.label)}
          </option>
        `)
        .join("")}
    </optgroup>
  `;
}

function refreshEquippedSelect(select) {
  if (!select) return;

  const previous = select.value || select.dataset.selectedItemId || "";
  const groups = getEquippableItems();

  select.innerHTML = `
    <option value="">— None —</option>
    ${equippedOptionGroup("Equipment", groups.equipment)}
    ${equippedOptionGroup("Magic Items", groups.magicItems)}
    ${equippedOptionGroup("Storage / Bags", groups.storageItems)}
  `;

  select.value = Array.from(select.options).some(option => option.value === previous)
    ? previous
    : "";

  select.dataset.selectedItemId = select.value;
}

function refreshAllEquippedSelects() {
  document.querySelectorAll(".equipped-slot-select").forEach(select => {
    refreshEquippedSelect(select);
    if (select.dataset.equippedSlot) {
      currentEquippedSlotsState[select.dataset.equippedSlot] = select.value || "";
    }
  });
  renderEquippedNodeMap();
}

function refreshLocationFilter() {
  const filter = document.getElementById("inventoryLocationFilter");
  if (!filter) return;

  const previous = filter.value || "all";

  filter.innerHTML = `
    <option value="all">All Locations</option>
    ${locationOptions()
      .map(option => `
        <option value="${inventorySafeValue(option.value)}">
          ${inventorySafeValue(option.label)}
        </option>
      `)
      .join("")}
  `;

  filter.value = Array.from(filter.options).some(option => option.value === previous)
    ? previous
    : "all";

  applyInventoryLocationFilter();
}

function setFilteredRowVisibility(row, visible) {
  row.hidden = !visible;

  const detailsRow = row.nextElementSibling;

  if (detailsRow?.classList.contains("inventory-item-details-row")) {
    detailsRow.hidden = !visible;
  }
}

function applyInventoryLocationFilter() {
  const filterValue =
    document.getElementById("inventoryLocationFilter")?.value ||
    "all";

  document
    .querySelectorAll(".inventory-item-row, .inventory-gem-row")
    .forEach(row => {
      const itemLocation =
        row.querySelector(".inventory-location")?.value ||
        "";

      setFilteredRowVisibility(
        row,
        filterValue === "all" || itemLocation === filterValue
      );
    });
}

function refreshInventoryDependentOptions() {
  refreshAllLocationSelects();
  refreshAllEquippedSelects();
  refreshLocationFilter();
}

function attachItemRowBehavior(mainRow, detailsRow) {
  const toggle = mainRow.querySelector(".inventory-details-toggle");
  const remove = mainRow.querySelector(".inventory-remove");
  const nameInput = mainRow.querySelector(".inventory-item-name");
  const locationSelect = mainRow.querySelector(".inventory-location");

  toggle?.addEventListener("click", event => {
    event.preventDefault();

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const opening = detailsRow.style.display === "none";

    detailsRow.style.display = opening ? "" : "none";
    toggle.classList.toggle("open", opening);

    requestAnimationFrame(() => {
      window.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "auto"
      });
    });
  });

  remove?.addEventListener("click", () => {
    detailsRow.remove();
    mainRow.remove();
    refreshInventoryDependentOptions();
  });

  nameInput?.addEventListener("input", refreshAllEquippedSelects);

  locationSelect?.addEventListener("change", () => {
    locationSelect.dataset.selectedLocation = locationSelect.value;
    applyInventoryLocationFilter();
  });
}

function addInventoryEquipmentRow(data = {}) {
  const body = document.getElementById("inventoryEquipmentBody");
  if (!body) return;

  const item = normalizeInventoryItem(data, "equipment");

  const row = document.createElement("tr");
  row.className = "inventory-equipment-row inventory-item-row";
  row.dataset.itemId = item.id;

  row.innerHTML =
    inventoryInputCell("inventory-equipment-name inventory-item-name", item.name, "Item…") +
    inventoryInputCell("inventory-equipment-qty", item.qty, "1") +
    inventoryInputCell("inventory-equipment-value", item.value, "—") +
    inventoryLocationCell(item.location) +
    inventoryDetailsCell(item.open) +
    inventoryRemoveButton("equipment item");

  const detailsRow = inventoryDetailsRow(item.details, item.open, 6);

  body.appendChild(row);
  body.appendChild(detailsRow);

  attachItemRowBehavior(row, detailsRow);
  refreshInventoryDependentOptions();
}

function addInventoryMagicItemRow(data = {}) {
  const body = document.getElementById("inventoryMagicItemsBody");
  if (!body) return;

  const item = normalizeInventoryItem(data, "magic");

  const row = document.createElement("tr");
  row.className = "inventory-magic-row inventory-item-row";
  row.dataset.itemId = item.id;

  row.innerHTML =
    inventoryInputCell("inventory-magic-name inventory-item-name", item.name, "Magic item…") +
    inventoryInputCell("inventory-magic-value", item.value, "—") +
    inventoryLocationCell(item.location) +
    inventoryDetailsCell(item.open) +
    inventoryRemoveButton("magic item");

  const detailsRow = inventoryDetailsRow(item.details, item.open, 5);

  body.appendChild(row);
  body.appendChild(detailsRow);

  attachItemRowBehavior(row, detailsRow);
  refreshInventoryDependentOptions();
}

function addInventoryConsumableRow(data = {}) {
  const body = document.getElementById("inventoryConsumablesBody");
  if (!body) return;

  const item = normalizeInventoryItem(data, "consumable");

  const row = document.createElement("tr");
  row.className = "inventory-consumable-row inventory-item-row";
  row.dataset.itemId = item.id;

  row.innerHTML =
    inventoryInputCell("inventory-consumable-name inventory-item-name", item.name, "Potion or consumable…") +
    inventoryInputCell("inventory-consumable-qty", item.qty, "1") +
    inventoryInputCell("inventory-consumable-value", item.value, "—") +
    inventoryLocationCell(item.location) +
    inventoryDetailsCell(item.open) +
    inventoryRemoveButton("consumable");

  const detailsRow = inventoryDetailsRow(item.details, item.open, 6);

  body.appendChild(row);
  body.appendChild(detailsRow);

  attachItemRowBehavior(row, detailsRow);
  refreshInventoryDependentOptions();
}

function addInventoryGemRow(data = {}) {
  const body = document.getElementById("inventoryGemsBody");
  if (!body) return;

  const gem = {
    id: String(data.id || inventoryId("gem")),
    name: String(data.name || ""),
    qty: String(data.qty || ""),
    value: String(data.value || ""),
    location: String(data.location || ""),
    notes: String(data.notes || "")
  };

  const row = document.createElement("tr");
  row.className = "inventory-gem-row";
  row.dataset.itemId = gem.id;

  row.innerHTML =
    inventoryInputCell("inventory-gem-name", gem.name, "Diamond, ruby, diamond dust…") +
    inventoryInputCell("inventory-gem-qty", gem.qty, "1") +
    inventoryInputCell("inventory-gem-value", gem.value, "—") +
    inventoryLocationCell(gem.location) +
    inventoryInputCell("inventory-gem-notes", gem.notes, "Notes…") +
    inventoryRemoveButton("gem or valuable");

  body.appendChild(row);

  const locationSelect = row.querySelector(".inventory-location");

  locationSelect?.addEventListener("change", () => {
    locationSelect.dataset.selectedLocation = locationSelect.value;
    applyInventoryLocationFilter();
  });

  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
    applyInventoryLocationFilter();
  });

  refreshInventoryDependentOptions();
}

function addInventoryAttunementRow(data = {}) {
  const body = document.getElementById("inventoryAttunementBody");
  if (!body) return;

  const row = document.createElement("tr");
  row.className = "inventory-attunement-row";

  row.innerHTML = `
    <td class="inventory-slot-number"></td>
  ` +
    inventoryInputCell("inventory-attunement-item", data.item || "", "Attuned item…") +
    inventoryInputCell("inventory-attunement-notes", data.notes || "", "Notes…") +
    inventoryRemoveButton("attunement slot");

  body.appendChild(row);

  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
    renumberInventoryAttunementRows();
  });

  renumberInventoryAttunementRows();
}

function addStorageLocationRow(data = {}) {
  const body = document.getElementById("storageLocationsBody");
  if (!body) return;

  const storage = normalizeStorageLocation(data);

  const row = document.createElement("tr");
  row.className = "storage-location-row";
  row.dataset.storageId = storage.id;

  row.innerHTML =
    inventoryInputCell("storage-location-name", storage.name, "Backpack, ship cabin, home…") +
    inventoryInputCell("storage-location-type", storage.type, "Bag, room, chest…") +
    inventoryInputCell("storage-location-notes", storage.notes, "Notes…") +
    inventoryRemoveButton("container or location");

  body.appendChild(row);

  row.querySelector(".storage-location-name")?.addEventListener(
    "input",
    refreshInventoryDependentOptions
  );

  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
    refreshInventoryDependentOptions();
  });

  refreshInventoryDependentOptions();
}

function renumberInventoryAttunementRows() {
  document
    .querySelectorAll("#inventoryAttunementBody .inventory-attunement-row")
    .forEach((row, index) => {
      const slot = row.querySelector(".inventory-slot-number");
      if (slot) slot.textContent = String(index + 1);
    });
}

function renderEquippedSlots(savedSlots = {}, customSlots = []) {
  currentEquippedSlotsState = Object.fromEntries(
    EQUIPPED_SLOT_DEFINITIONS.map(slot => [slot.key, savedSlots[slot.key] || ""])
  );

  renderCustomEquippedSlots(customSlots);
  renderEquippedActiveView();
}

function addCustomEquippedSlot(data = {}) {
  const container = document.getElementById("customEquippedSlots");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "custom-equipped-slot";
  row.dataset.customSlotId = String(data.id || inventoryId("slot"));

  row.innerHTML = `
    <input
      class="custom-equipped-slot-name"
      type="text"
      value="${inventorySafeValue(data.label || "")}"
      placeholder="Gloves, bracers, quiver…"
      aria-label="Custom equipped slot name"
    >

    <select
      class="equipped-slot-select custom-equipped-slot-select"
      data-selected-item-id="${inventorySafeValue(data.itemId || "")}"
      aria-label="Custom equipped item"
    ></select>

    <button
      type="button"
      class="inventory-remove custom-equipped-remove"
      title="Remove custom slot"
      aria-label="Remove custom equipped slot"
    >×</button>
  `;

  container.appendChild(row);

  const select = row.querySelector(".equipped-slot-select");

  refreshEquippedSelect(select);

  select?.addEventListener("change", () => {
    select.dataset.selectedItemId = select.value;
    renderEquippedNodeMap();
  });

  row.querySelector(".custom-equipped-slot-name")?.addEventListener("input", renderEquippedNodeMap);

  row.querySelector(".custom-equipped-remove")?.addEventListener("click", () => {
    row.remove();
    renderEquippedNodeMap();
  });
}

function renderCustomEquippedSlots(customSlots = []) {
  const container = document.getElementById("customEquippedSlots");
  if (!container) return;

  container.innerHTML = "";
  (customSlots || []).forEach(addCustomEquippedSlot);
}

function collectEquippedSlots() {
  return { ...currentEquippedSlotsState };
}

function collectCustomEquippedSlots() {
  return Array.from(
    document.querySelectorAll("#customEquippedSlots .custom-equipped-slot")
  )
    .map(row => ({
      id: row.dataset.customSlotId,
      label: row.querySelector(".custom-equipped-slot-name")?.value.trim() || "",
      itemId: row.querySelector(".equipped-slot-select")?.value || ""
    }))
    .filter(slot => slot.label || slot.itemId);
}

function collectStorageLocations() {
  return getStorageLocations()
    .filter(location => location.name || location.type || location.notes);
}

function collectItemRows(selector, fields) {
  return Array.from(document.querySelectorAll(selector))
    .map(row => {
      const detailsRow = row.nextElementSibling;
      const data = {
        id: row.dataset.itemId,
        details: detailsRow?.querySelector(".inventory-item-details")?.value || "",
        open: detailsRow?.style.display !== "none"
      };

      fields.forEach(([key, fieldSelector]) => {
        data[key] = row.querySelector(fieldSelector)?.value.trim() || "";
      });

      return data;
    })
    .filter(row =>
      row.name ||
      row.qty ||
      row.value ||
      row.location ||
      row.details
    );
}

function collectInventoryEquipmentRows() {
  return collectItemRows(
    "#inventoryEquipmentBody .inventory-equipment-row",
    [
      ["name", ".inventory-equipment-name"],
      ["qty", ".inventory-equipment-qty"],
      ["value", ".inventory-equipment-value"],
      ["location", ".inventory-location"]
    ]
  );
}

function collectInventoryMagicItemRows() {
  return collectItemRows(
    "#inventoryMagicItemsBody .inventory-magic-row",
    [
      ["name", ".inventory-magic-name"],
      ["value", ".inventory-magic-value"],
      ["location", ".inventory-location"]
    ]
  );
}

function collectInventoryConsumableRows() {
  return collectItemRows(
    "#inventoryConsumablesBody .inventory-consumable-row",
    [
      ["name", ".inventory-consumable-name"],
      ["qty", ".inventory-consumable-qty"],
      ["value", ".inventory-consumable-value"],
      ["location", ".inventory-location"]
    ]
  );
}

function collectInventoryGemRows() {
  return Array.from(
    document.querySelectorAll("#inventoryGemsBody .inventory-gem-row")
  )
    .map(row => ({
      id: row.dataset.itemId,
      name: row.querySelector(".inventory-gem-name")?.value.trim() || "",
      qty: row.querySelector(".inventory-gem-qty")?.value.trim() || "",
      value: row.querySelector(".inventory-gem-value")?.value.trim() || "",
      location: row.querySelector(".inventory-location")?.value.trim() || "",
      notes: row.querySelector(".inventory-gem-notes")?.value.trim() || ""
    }))
    .filter(row =>
      row.name ||
      row.qty ||
      row.value ||
      row.location ||
      row.notes
    );
}

function collectInventoryAttunementRows() {
  return Array.from(
    document.querySelectorAll("#inventoryAttunementBody .inventory-attunement-row")
  ).map(row => ({
    item: row.querySelector(".inventory-attunement-item")?.value.trim() || "",
    notes: row.querySelector(".inventory-attunement-notes")?.value.trim() || ""
  }));
}

function resetInventoryRows({
  equipment = DEFAULT_INVENTORY_EQUIPMENT_ROWS,
  magicItems = DEFAULT_INVENTORY_MAGIC_ITEM_ROWS,
  consumables = DEFAULT_INVENTORY_CONSUMABLE_ROWS,
  gems = DEFAULT_INVENTORY_GEM_ROWS,
  attunement = DEFAULT_INVENTORY_ATTUNEMENT_ROWS,
  storageLocations = DEFAULT_STORAGE_LOCATION_ROWS,
  equippedSlots = {},
  customEquippedSlots = [],
  inventoryView = SILHOUETTE_VIEW_DEFAULT
} = {}) {
  const equipmentBody = document.getElementById("inventoryEquipmentBody");
  const magicBody = document.getElementById("inventoryMagicItemsBody");
  const consumablesBody = document.getElementById("inventoryConsumablesBody");
  const gemsBody = document.getElementById("inventoryGemsBody");
  const attunementBody = document.getElementById("inventoryAttunementBody");
  const storageBody = document.getElementById("storageLocationsBody");

  if (equipmentBody) equipmentBody.innerHTML = "";
  if (magicBody) magicBody.innerHTML = "";
  if (consumablesBody) consumablesBody.innerHTML = "";
  if (gemsBody) gemsBody.innerHTML = "";
  if (attunementBody) attunementBody.innerHTML = "";
  if (storageBody) storageBody.innerHTML = "";

  (storageLocations || []).forEach(addStorageLocationRow);
  (equipment || []).forEach(addInventoryEquipmentRow);
  (magicItems || []).forEach(addInventoryMagicItemRow);
  (consumables || []).forEach(addInventoryConsumableRow);
  (gems || []).forEach(addInventoryGemRow);
  (attunement || []).forEach(addInventoryAttunementRow);

  renumberInventoryAttunementRows();
  renderEquippedSlots(equippedSlots || {}, customEquippedSlots || []);
  setInventoryView(inventoryView || SILHOUETTE_VIEW_DEFAULT);
  refreshInventoryDependentOptions();
  syncCoinageMirrorsFromCanonical();
  renderEquippedNodeMap();
}

function syncCoinageMirrorsFromCanonical() {
  document
    .querySelectorAll("[data-field][data-coinage-key]")
    .forEach(canonical => {
      document
        .querySelectorAll(`[data-coinage-key="${canonical.dataset.coinageKey}"]`)
        .forEach(field => {
          if (field !== canonical) {
            field.value = canonical.value;
          }
        });
    });
}

function bindCoinageMirrors() {
  document
    .querySelectorAll("[data-coinage-key]")
    .forEach(field => {
      field.addEventListener("input", () => {
        document
          .querySelectorAll(`[data-coinage-key="${field.dataset.coinageKey}"]`)
          .forEach(other => {
            if (other !== field) {
              other.value = field.value;
            }
          });
      });
    });

  syncCoinageMirrorsFromCanonical();
}

function bindInventoryControls() {
  bindCoinageMirrors();
  bindInventoryViewToggle();

  document
    .getElementById("inventoryLocationFilter")
    ?.addEventListener("change", applyInventoryLocationFilter);

  refreshLocationFilter();
  setInventoryView(SILHOUETTE_VIEW_DEFAULT);
  renderEquippedNodeMap();
}
