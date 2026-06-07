// Mythical Blue · Inventory page
// Structured items, storage locations, mirrored coinage, and equipped slots.

const DEFAULT_INVENTORY_EQUIPMENT_ROWS = [];
const DEFAULT_INVENTORY_MAGIC_ITEM_ROWS = [];
const DEFAULT_INVENTORY_CONSUMABLE_ROWS = [];
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
  { key: "armor", label: "Armor / Clothing" },
  { key: "mainHand", label: "Main Hand" },
  { key: "offHand", label: "Off Hand" },
  { key: "ring1", label: "Ring 1" },
  { key: "ring2", label: "Ring 2" },
  { key: "belt", label: "Belt / Quick Access" },
  { key: "footwear", label: "Footwear" },
  { key: "otherWorn", label: "Other Worn Item" }
];

const STANDARD_ITEM_LOCATIONS = [
  { value: "", label: "Unassigned" },
  { value: "carried", label: "Carried" },
  { value: "worn", label: "Worn / Equipped" }
];

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

  const previous =
    select.value ||
    select.dataset.selectedLocation ||
    "";

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
  const items = [];

  document
    .querySelectorAll("#inventoryEquipmentBody .inventory-equipment-row")
    .forEach(row => {
      const name = row.querySelector(".inventory-equipment-name")?.value.trim() || "";
      if (name) {
        items.push({
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
        items.push({
          id: row.dataset.itemId,
          label: name
        });
      }
    });

  return items;
}

function refreshEquippedSelect(select) {
  if (!select) return;

  const previous = select.value || select.dataset.selectedItemId || "";

  select.innerHTML = `
    <option value="">— None —</option>
    ${getEquippableItems()
      .map(item => `
        <option value="${inventorySafeValue(item.id)}">
          ${inventorySafeValue(item.label)}
        </option>
      `)
      .join("")}
  `;

  select.value = Array.from(select.options).some(option => option.value === previous)
    ? previous
    : "";

  select.dataset.selectedItemId = select.value;
}

function refreshAllEquippedSelects() {
  document.querySelectorAll(".equipped-slot-select").forEach(refreshEquippedSelect);
}

function refreshInventoryDependentOptions() {
  refreshAllLocationSelects();
  refreshAllEquippedSelects();
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
    inventoryRemoveButton("storage location");

  body.appendChild(row);

  row.querySelector(".storage-location-name")?.addEventListener(
    "input",
    refreshAllLocationSelects
  );

  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
    refreshAllLocationSelects();
  });

  refreshAllLocationSelects();
}

function renumberInventoryAttunementRows() {
  document
    .querySelectorAll("#inventoryAttunementBody .inventory-attunement-row")
    .forEach((row, index) => {
      const slot = row.querySelector(".inventory-slot-number");
      if (slot) slot.textContent = String(index + 1);
    });
}

function renderEquippedSlots(savedSlots = {}) {
  const container = document.getElementById("equippedSlots");
  if (!container) return;

  container.innerHTML = EQUIPPED_SLOT_DEFINITIONS
    .map(slot => `
      <label class="equipped-slot equipped-slot-${inventorySafeValue(slot.key)}">
        <span>${inventorySafeValue(slot.label)}</span>
        <select
          class="equipped-slot-select"
          data-equipped-slot="${inventorySafeValue(slot.key)}"
          data-selected-item-id="${inventorySafeValue(savedSlots[slot.key] || "")}"
        ></select>
      </label>
    `)
    .join("");

  refreshAllEquippedSelects();

  container
    .querySelectorAll(".equipped-slot-select")
    .forEach(select => {
      select.addEventListener("change", () => {
        select.dataset.selectedItemId = select.value;
      });
    });
}

function collectEquippedSlots() {
  return Object.fromEntries(
    Array.from(document.querySelectorAll(".equipped-slot-select"))
      .map(select => [select.dataset.equippedSlot, select.value || ""])
  );
}

function collectStorageLocations() {
  return getStorageLocations()
    .filter(location => location.name || location.type || location.notes);
}

function collectItemRows(selector, fields) {
  return Array.from(document.querySelectorAll(selector)).map(row => {
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
  }).filter(row =>
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
  attunement = DEFAULT_INVENTORY_ATTUNEMENT_ROWS,
  storageLocations = DEFAULT_STORAGE_LOCATION_ROWS,
  equippedSlots = {}
} = {}) {
  const equipmentBody = document.getElementById("inventoryEquipmentBody");
  const magicBody = document.getElementById("inventoryMagicItemsBody");
  const consumablesBody = document.getElementById("inventoryConsumablesBody");
  const attunementBody = document.getElementById("inventoryAttunementBody");
  const storageBody = document.getElementById("storageLocationsBody");

  if (equipmentBody) equipmentBody.innerHTML = "";
  if (magicBody) magicBody.innerHTML = "";
  if (consumablesBody) consumablesBody.innerHTML = "";
  if (attunementBody) attunementBody.innerHTML = "";
  if (storageBody) storageBody.innerHTML = "";

  (storageLocations || []).forEach(addStorageLocationRow);
  (equipment || []).forEach(addInventoryEquipmentRow);
  (magicItems || []).forEach(addInventoryMagicItemRow);
  (consumables || []).forEach(addInventoryConsumableRow);
  (attunement || []).forEach(addInventoryAttunementRow);

  renumberInventoryAttunementRows();
  renderEquippedSlots(equippedSlots || {});
  refreshInventoryDependentOptions();
  syncCoinageMirrorsFromCanonical();
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
}
