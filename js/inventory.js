// Mythical Blue · Inventory page
// Structured items, storage locations, mirrored coinage, equipped slots, and filters.

const DEFAULT_INVENTORY_EQUIPMENT_ROWS = [];
const DEFAULT_INVENTORY_MAGIC_ITEM_ROWS = [];
const DEFAULT_INVENTORY_CONSUMABLE_ROWS = [];
const DEFAULT_UNIFIED_INVENTORY_ROWS = [];
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


const INVENTORY_ITEM_TYPE_OPTIONS = [
  { value: "equipment", label: "Equipment" },
  { value: "magic", label: "Magic Item" },
  { value: "consumable", label: "Potion / Consumable" },
  { value: "other", label: "Other" }
];

const STANDARD_ITEM_LOCATIONS = [
  { value: "", label: "Unassigned" },
  { value: "carried", label: "Carried" },
  { value: "worn", label: "Worn / Equipped" }
];


const SILHOUETTE_VIEW_DEFAULT = "list";

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
  otherWorn: "assets/equipment-icons/other-worn-gem.svg"
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
  return "list";
}

function setInventoryView(view = SILHOUETTE_VIEW_DEFAULT) {
  const layout = document.getElementById("equippedLayout");
  if (!layout) return;

  layout.dataset.view = "list";
  layout.classList.add("is-list-view", "equipped-list-only");
  layout.classList.remove("is-silhouette-view");

  renderEquippedActiveView();
}

function bindInventoryViewToggle() {
  // List-only view: toggle removed intentionally.
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
  bindEquippedCardInteractions(left);
  bindEquippedCardInteractions(right);
}

function renderEquippedListView(equippedSlots = currentEquippedSlotsState) {
  const list = document.getElementById('equippedListView');
  if (!list) return;

  list.innerHTML = EQUIPPED_SLOT_DEFINITIONS
    .map(slot => createEquippedSlotCard(slot, equippedSlots[slot.key] || ""))
    .join('');

  bindEquippedSlotEvents(list);
  populateEquippedSelects(list);
  bindEquippedCardInteractions(list);
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

function focusEquippedSlot(slotKey) {
  const selector = `.equipped-slot-select[data-equipped-slot="${slotKey}"]`;
  const select = document.querySelector(selector);
  if (!select) return;

  select.focus({ preventScroll: false });
  select.closest(".equipped-slot-card")?.classList.add("is-focused");
  window.setTimeout(() => {
    select.closest(".equipped-slot-card")?.classList.remove("is-focused");
  }, 700);
}

function clearEquippedHoverState() {
  document.querySelectorAll(".silhouette-node.is-hovered").forEach(node => {
    node.classList.remove("is-hovered");
  });

  document.querySelectorAll(".equipped-slot-card.is-hovered").forEach(card => {
    card.classList.remove("is-hovered");
  });
}

function setEquippedHoverState(slotKey, active) {
  if (!slotKey) return;

  document
    .querySelectorAll(`.silhouette-node[data-slot-key="${slotKey}"]`)
    .forEach(node => node.classList.toggle("is-hovered", active));

  document
    .querySelectorAll(`.equipped-slot-card[data-slot-key="${slotKey}"]`)
    .forEach(card => card.classList.toggle("is-hovered", active));
}

function bindSilhouetteNodeInteractions() {
  // Silhouette view removed.
}

function bindEquippedCardInteractions(scope = document) {
  scope.querySelectorAll(".equipped-slot-card").forEach(card => {
    if (card.dataset.interactionsBound === "true") return;

    const slotKey = card.dataset.slotKey;
    card.dataset.interactionsBound = "true";
    card.addEventListener("mouseenter", () => setEquippedHoverState(slotKey, true));
    card.addEventListener("mouseleave", () => setEquippedHoverState(slotKey, false));
    card.addEventListener("focusin", () => setEquippedHoverState(slotKey, true));
    card.addEventListener("focusout", () => setEquippedHoverState(slotKey, false));
  });
}

function renderEquippedNodeMap() {
  const states = resolveEquippedNodeStates();

  document.querySelectorAll('.equipped-slot-card').forEach(card => {
    const slotKey = card.dataset.slotKey;
    const active = Boolean(states[slotKey]?.filled);
    card.classList.toggle('is-active', active);
  });

  bindEquippedCardInteractions();
}

function renderEquippedActiveView() {
  const listView = document.getElementById('equippedListView');
  if (listView) listView.hidden = false;
  renderEquippedListView(currentEquippedSlotsState);
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
    type: String(data.type || prefix || "equipment"),
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

function inventoryTypeCell(value = "equipment") {
  return `
    <td>
      <select class="inventory-item-type">
        ${INVENTORY_ITEM_TYPE_OPTIONS
          .map(option => `
            <option value="${inventorySafeValue(option.value)}"${option.value === value ? " selected" : ""}>
              ${inventorySafeValue(option.label)}
            </option>
          `)
          .join("")}
      </select>
    </td>
  `;
}

function inventoryTypeLabel(type = "equipment") {
  return INVENTORY_ITEM_TYPE_OPTIONS.find(option => option.value === type)?.label || "Other";
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
  const groups = {
    equipment: [],
    magicItems: [],
    consumables: [],
    other: [],
    storageItems: []
  };

  document
    .querySelectorAll("#inventoryItemsBody .inventory-unified-row")
    .forEach(row => {
      const name = row.querySelector(".inventory-item-name")?.value.trim() || "";
      const type = row.querySelector(".inventory-item-type")?.value || "equipment";
      if (!name) return;

      const item = { id: row.dataset.itemId, label: name };

      if (type === "magic") groups.magicItems.push(item);
      else if (type === "consumable") groups.consumables.push(item);
      else if (type === "other") groups.other.push(item);
      else groups.equipment.push(item);
    });

  getStorageLocations()
    .filter(location => location.name)
    .forEach(location => {
      groups.storageItems.push({
        id: `storage:${location.id}`,
        label: location.name
      });
    });

  return groups;
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
    ${equippedOptionGroup("Potions / Consumables", groups.consumables)}
    ${equippedOptionGroup("Other", groups.other)}
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

  applyInventoryFilters();
}

function setFilteredRowVisibility(row, visible) {
  row.hidden = !visible;

  const detailsRow = row.nextElementSibling;

  if (detailsRow?.classList.contains("inventory-item-details-row")) {
    detailsRow.hidden = !visible;
  }
}

function applyInventoryFilters() {
  const locationFilter = document.getElementById("inventoryLocationFilter")?.value || "all";
  const typeFilter = document.getElementById("inventoryTypeFilter")?.value || "all";
  const searchText = (document.getElementById("inventorySearchInput")?.value || "")
    .trim()
    .toLowerCase();

  document
    .querySelectorAll("#inventoryItemsBody .inventory-unified-row")
    .forEach(row => {
      const location = row.querySelector(".inventory-location")?.value || "";
      const type = row.querySelector(".inventory-item-type")?.value || "equipment";
      const searchable = [
        row.querySelector(".inventory-item-name")?.value || "",
        inventoryTypeLabel(type),
        row.nextElementSibling?.querySelector(".inventory-item-details")?.value || ""
      ]
        .join(" ")
        .toLowerCase();

      const visible =
        (locationFilter === "all" || location === locationFilter) &&
        (typeFilter === "all" || type === typeFilter) &&
        (!searchText || searchable.includes(searchText));

      setFilteredRowVisibility(row, visible);
    });

  document
    .querySelectorAll("#inventoryGemsBody .inventory-gem-row")
    .forEach(row => {
      const location = row.querySelector(".inventory-location")?.value || "";
      const searchable = [
        row.querySelector(".inventory-gem-name")?.value || "",
        row.querySelector(".inventory-gem-notes")?.value || ""
      ]
        .join(" ")
        .toLowerCase();

      const visible =
        (locationFilter === "all" || location === locationFilter) &&
        typeFilter === "all" &&
        (!searchText || searchable.includes(searchText));

      row.hidden = !visible;
    });
}

function applyInventoryLocationFilter() {
  applyInventoryFilters();
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
  const typeSelect = mainRow.querySelector(".inventory-item-type");
  const detailsTextarea = detailsRow.querySelector(".inventory-item-details");

  toggle?.addEventListener("click", event => {
    event.preventDefault();

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const opening = detailsRow.style.display === "none";

    detailsRow.style.display = opening ? "" : "none";
    toggle.classList.toggle("open", opening);

    requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    });
  });

  remove?.addEventListener("click", () => {
    detailsRow.remove();
    mainRow.remove();
    refreshInventoryDependentOptions();
  });

  nameInput?.addEventListener("input", () => {
    refreshAllEquippedSelects();
    applyInventoryFilters();
  });

  detailsTextarea?.addEventListener("input", applyInventoryFilters);

  locationSelect?.addEventListener("change", () => {
    locationSelect.dataset.selectedLocation = locationSelect.value;
    applyInventoryFilters();
  });

  typeSelect?.addEventListener("change", () => {
    refreshAllEquippedSelects();
    applyInventoryFilters();
  });
}

function addUnifiedInventoryRow(data = {}) {
  const body = document.getElementById("inventoryItemsBody");
  if (!body) return;

  const item = normalizeInventoryItem(data, data.type || "equipment");

  const row = document.createElement("tr");
  row.className = "inventory-unified-row inventory-item-row";
  row.dataset.itemId = item.id;

  row.innerHTML =
    inventoryInputCell("inventory-item-name", item.name, "Item…") +
    inventoryTypeCell(item.type) +
    inventoryInputCell("inventory-item-qty", item.qty, "1") +
    inventoryInputCell("inventory-item-value", item.value, "—") +
    inventoryLocationCell(item.location) +
    inventoryDetailsCell(item.open) +
    inventoryRemoveButton("inventory item");

  const detailsRow = inventoryDetailsRow(item.details, item.open, 7);

  body.appendChild(row);
  body.appendChild(detailsRow);

  attachItemRowBehavior(row, detailsRow);
  refreshInventoryDependentOptions();
}

function addInventoryEquipmentRow(data = {}) {
  addUnifiedInventoryRow({ ...data, type: data.type || "equipment" });
}

function addInventoryMagicItemRow(data = {}) {
  addUnifiedInventoryRow({ ...data, type: data.type || "magic" });
}

function addInventoryConsumableRow(data = {}) {
  addUnifiedInventoryRow({ ...data, type: data.type || "consumable" });
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
    applyInventoryFilters();
  });

  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
    applyInventoryFilters();
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

function collectUnifiedInventoryRows() {
  return Array.from(
    document.querySelectorAll("#inventoryItemsBody .inventory-unified-row")
  )
    .map(row => {
      const detailsRow = row.nextElementSibling;
      return {
        id: row.dataset.itemId,
        name: row.querySelector(".inventory-item-name")?.value.trim() || "",
        type: row.querySelector(".inventory-item-type")?.value || "equipment",
        qty: row.querySelector(".inventory-item-qty")?.value.trim() || "",
        value: row.querySelector(".inventory-item-value")?.value.trim() || "",
        location: row.querySelector(".inventory-location")?.value.trim() || "",
        details: detailsRow?.querySelector(".inventory-item-details")?.value || "",
        open: detailsRow?.style.display !== "none"
      };
    })
    .filter(row => row.name || row.qty || row.value || row.location || row.details);
}

function collectInventoryEquipmentRows() {
  return collectUnifiedInventoryRows().filter(row => row.type === "equipment");
}

function collectInventoryMagicItemRows() {
  return collectUnifiedInventoryRows().filter(row => row.type === "magic");
}

function collectInventoryConsumableRows() {
  return collectUnifiedInventoryRows().filter(row => row.type === "consumable");
}

function mergeLegacyInventoryRows({
  inventoryItems = [],
  equipment = [],
  magicItems = [],
  consumables = []
} = {}) {
  if (Array.isArray(inventoryItems) && inventoryItems.length) {
    return inventoryItems.map(item => ({ ...item, type: item.type || "equipment" }));
  }

  return [
    ...(equipment || []).map(item => ({ ...item, type: item.type || "equipment" })),
    ...(magicItems || []).map(item => ({ ...item, type: item.type || "magic" })),
    ...(consumables || []).map(item => ({ ...item, type: item.type || "consumable" }))
  ];
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
  inventoryItems = DEFAULT_UNIFIED_INVENTORY_ROWS,
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
  const itemsBody = document.getElementById("inventoryItemsBody");
  const gemsBody = document.getElementById("inventoryGemsBody");
  const attunementBody = document.getElementById("inventoryAttunementBody");
  const storageBody = document.getElementById("storageLocationsBody");

  if (itemsBody) itemsBody.innerHTML = "";
  if (gemsBody) gemsBody.innerHTML = "";
  if (attunementBody) attunementBody.innerHTML = "";
  if (storageBody) storageBody.innerHTML = "";

  (storageLocations || []).forEach(addStorageLocationRow);

  mergeLegacyInventoryRows({
    inventoryItems,
    equipment,
    magicItems,
    consumables
  }).forEach(addUnifiedInventoryRow);

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
    ?.addEventListener("change", applyInventoryFilters);

  document
    .getElementById("inventoryTypeFilter")
    ?.addEventListener("change", applyInventoryFilters);

  document
    .getElementById("inventorySearchInput")
    ?.addEventListener("input", applyInventoryFilters);

  refreshLocationFilter();
  setInventoryView(SILHOUETTE_VIEW_DEFAULT);
  renderEquippedNodeMap();
}
