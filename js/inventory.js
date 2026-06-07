// Mythical Blue · Inventory page
// Structured equipment, attunement, magic items, and consumables.

const DEFAULT_INVENTORY_EQUIPMENT_ROWS = [];
const DEFAULT_INVENTORY_MAGIC_ITEM_ROWS = [];
const DEFAULT_INVENTORY_CONSUMABLE_ROWS = [];
const DEFAULT_INVENTORY_ATTUNEMENT_ROWS = [
  { item: "", notes: "" },
  { item: "", notes: "" },
  { item: "", notes: "" }
];

function inventorySafeValue(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function attachInventoryRemove(row) {
  row.querySelector(".inventory-remove")?.addEventListener("click", () => {
    row.remove();
  });
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

function addInventoryEquipmentRow(data = {}) {
  const body = document.getElementById("inventoryEquipmentBody");
  if (!body) return;

  const row = document.createElement("tr");
  row.className = "inventory-equipment-row";

  row.innerHTML =
    inventoryInputCell("inventory-equipment-name", data.name || "", "Item…") +
    inventoryInputCell("inventory-equipment-qty", data.qty || "", "1") +
    inventoryInputCell("inventory-equipment-notes", data.notes || "", "Notes…") +
    inventoryRemoveButton("equipment item");

  body.appendChild(row);
  attachInventoryRemove(row);
}

function addInventoryMagicItemRow(data = {}) {
  const body = document.getElementById("inventoryMagicItemsBody");
  if (!body) return;

  const row = document.createElement("tr");
  row.className = "inventory-magic-row";

  row.innerHTML =
    inventoryInputCell("inventory-magic-name", data.name || "", "Magic item…") +
    inventoryInputCell("inventory-magic-notes", data.notes || "", "Notes…") +
    inventoryRemoveButton("magic item");

  body.appendChild(row);
  attachInventoryRemove(row);
}

function addInventoryConsumableRow(data = {}) {
  const body = document.getElementById("inventoryConsumablesBody");
  if (!body) return;

  const row = document.createElement("tr");
  row.className = "inventory-consumable-row";

  row.innerHTML =
    inventoryInputCell("inventory-consumable-name", data.name || "", "Potion or consumable…") +
    inventoryInputCell("inventory-consumable-qty", data.qty || "", "1") +
    inventoryInputCell("inventory-consumable-notes", data.notes || "", "Notes…") +
    inventoryRemoveButton("consumable");

  body.appendChild(row);
  attachInventoryRemove(row);
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
  attachInventoryRemove(row);
  renumberInventoryAttunementRows();
}

function renumberInventoryAttunementRows() {
  document
    .querySelectorAll("#inventoryAttunementBody .inventory-attunement-row")
    .forEach((row, index) => {
      const slot = row.querySelector(".inventory-slot-number");
      if (slot) slot.textContent = String(index + 1);
    });
}

function resetInventoryRows({
  equipment = DEFAULT_INVENTORY_EQUIPMENT_ROWS,
  magicItems = DEFAULT_INVENTORY_MAGIC_ITEM_ROWS,
  consumables = DEFAULT_INVENTORY_CONSUMABLE_ROWS,
  attunement = DEFAULT_INVENTORY_ATTUNEMENT_ROWS
} = {}) {
  const equipmentBody = document.getElementById("inventoryEquipmentBody");
  const magicBody = document.getElementById("inventoryMagicItemsBody");
  const consumablesBody = document.getElementById("inventoryConsumablesBody");
  const attunementBody = document.getElementById("inventoryAttunementBody");

  if (equipmentBody) {
    equipmentBody.innerHTML = "";
    (equipment || []).forEach(addInventoryEquipmentRow);
  }

  if (magicBody) {
    magicBody.innerHTML = "";
    (magicItems || []).forEach(addInventoryMagicItemRow);
  }

  if (consumablesBody) {
    consumablesBody.innerHTML = "";
    (consumables || []).forEach(addInventoryConsumableRow);
  }

  if (attunementBody) {
    attunementBody.innerHTML = "";
    (attunement || []).forEach(addInventoryAttunementRow);
    renumberInventoryAttunementRows();
  }
}

function collectInventoryEquipmentRows() {
  return Array.from(
    document.querySelectorAll("#inventoryEquipmentBody .inventory-equipment-row")
  )
    .map(row => ({
      name: row.querySelector(".inventory-equipment-name")?.value.trim() || "",
      qty: row.querySelector(".inventory-equipment-qty")?.value.trim() || "",
      notes: row.querySelector(".inventory-equipment-notes")?.value.trim() || ""
    }))
    .filter(row => row.name || row.qty || row.notes);
}

function collectInventoryMagicItemRows() {
  return Array.from(
    document.querySelectorAll("#inventoryMagicItemsBody .inventory-magic-row")
  )
    .map(row => ({
      name: row.querySelector(".inventory-magic-name")?.value.trim() || "",
      notes: row.querySelector(".inventory-magic-notes")?.value.trim() || ""
    }))
    .filter(row => row.name || row.notes);
}

function collectInventoryConsumableRows() {
  return Array.from(
    document.querySelectorAll("#inventoryConsumablesBody .inventory-consumable-row")
  )
    .map(row => ({
      name: row.querySelector(".inventory-consumable-name")?.value.trim() || "",
      qty: row.querySelector(".inventory-consumable-qty")?.value.trim() || "",
      notes: row.querySelector(".inventory-consumable-notes")?.value.trim() || ""
    }))
    .filter(row => row.name || row.qty || row.notes);
}

function collectInventoryAttunementRows() {
  return Array.from(
    document.querySelectorAll("#inventoryAttunementBody .inventory-attunement-row")
  ).map(row => ({
    item: row.querySelector(".inventory-attunement-item")?.value.trim() || "",
    notes: row.querySelector(".inventory-attunement-notes")?.value.trim() || ""
  }));
}
