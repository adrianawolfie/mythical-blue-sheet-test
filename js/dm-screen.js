// Mythical Blue · DM screen initiative tracker
// Player rows stay connected to the live character summaries.

(() => {
  const DM_STATE_KEY = "mythicalBlueDMTrackerV1";
  const SYNC_CHANNEL_NAME = "mythical-blue-hp-sync-v1";
  const SYNC_STORAGE_KEY = "mythicalBlueHPBroadcastV1";
  const SAVE_DELAY = 550;
  const POLL_DELAY = 5000;
  const CUSTOM_CONDITION_VALUE = "__custom__";

  let playerCharacters = [];
  let state = loadTrackerState();
  let saveTimers = new Map();
  let pollTimer = null;
  const focusedConditions = new Map();

  const syncChannel = typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(SYNC_CHANNEL_NAME)
    : null;

  function createId(prefix = "npc") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadTrackerState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DM_STATE_KEY) || "{}");
      return {
        round: Math.max(1, Number(parsed.round) || 1),
        activeId: String(parsed.activeId || ""),
        playerInitiatives: parsed.playerInitiatives && typeof parsed.playerInitiatives === "object"
          ? parsed.playerInitiatives
          : {},
        playerConcentration: parsed.playerConcentration && typeof parsed.playerConcentration === "object"
          ? parsed.playerConcentration
          : {},
        npcs: Array.isArray(parsed.npcs) ? parsed.npcs : []
      };
    } catch {
      return { round: 1, activeId: "", playerInitiatives: {}, playerConcentration: {}, npcs: [] };
    }
  }

  function persistTrackerState() {
    localStorage.setItem(DM_STATE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numericInitiative(value) {
    const parsed = Number.parseFloat(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
  }

  function numericHp(value) {
    const parsed = Number.parseFloat(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeConditionNames(value) {
    const knownConditions = Object.keys(window.CONDITION_DETAILS || {});

    return String(value || "")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => knownConditions.find(condition => condition.toLowerCase() === item.toLowerCase()) || item)
      .filter((item, index, array) =>
        array.findIndex(other => other.toLowerCase() === item.toLowerCase()) === index
      );
  }

  function serializeConditionNames(conditions) {
    return normalizeConditionNames(conditions.join(", ")).join(", ");
  }

  function normalizeNpc(npc) {
    return {
      id: String(npc.id || createId()),
      name: String(npc.name || "New NPC"),
      initiative: String(npc.initiative ?? ""),
      hpCurrent: String(npc.hpCurrent ?? ""),
      hpMax: String(npc.hpMax ?? ""),
      armorClass: String(npc.armorClass ?? ""),
      currentConditions: serializeConditionNames(normalizeConditionNames(npc.currentConditions)),
      concentrating: Boolean(npc.concentrating)
    };
  }

  function getCombatants() {
    const players = playerCharacters.map(character => ({
      id: character.id,
      type: "player",
      name: character.name || "Unnamed Character",
      initiative: String(state.playerInitiatives[character.id] ?? ""),
      hpCurrent: String(character.hpCurrent ?? ""),
      hpMax: String(character.hpMax ?? ""),
      armorClass: String(character.armorClass ?? ""),
      currentConditions: serializeConditionNames(normalizeConditionNames(character.currentConditions)),
      concentrating: Boolean(state.playerConcentration[character.id])
    }));

    const npcs = state.npcs.map(normalizeNpc).map(npc => ({ ...npc, type: "npc" }));

    return [...players, ...npcs].sort((a, b) => {
      const aInitiative = numericInitiative(a.initiative);
      const bInitiative = numericInitiative(b.initiative);

      if (aInitiative !== bInitiative) {
        if (aInitiative === Number.NEGATIVE_INFINITY) return 1;
        if (bInitiative === Number.NEGATIVE_INFINITY) return -1;
        return bInitiative - aInitiative;
      }

      return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" });
    });
  }

  function rowInput({ className, field, value, label, type = "text", inputmode = "text" }) {
    return `<input class="${className}" data-field="${field}" type="${type}" inputmode="${inputmode}" value="${escapeHtml(value)}" aria-label="${escapeHtml(label)}">`;
  }

  function hpBarMarkup(combatant) {
    const hpCurrent = numericHp(combatant.hpCurrent);
    const hpMax = numericHp(combatant.hpMax);
    const pct = hpMax > 0 ? Math.max(0, Math.min(100, Math.round((hpCurrent / hpMax) * 100))) : 0;
    const danger = pct > 0 && pct <= 50 ? " danger" : "";
    return `
      <div class="combatant-hp-bwrap" aria-hidden="true">
        <div class="combatant-hp-bar${danger}" style="width:${pct}%"></div>
      </div>`;
  }

  function conditionOptionsMarkup() {
    return `
      <option value="">Add condition…</option>
      ${Object.keys(window.CONDITION_DETAILS || {})
        .map(condition => `<option value="${escapeHtml(condition)}">${escapeHtml(condition)}</option>`)
        .join("")}
      <option value="${CUSTOM_CONDITION_VALUE}">Custom condition…</option>`;
  }

  function conditionInfoMarkup(combatant) {
    const focused = focusedConditions.get(combatant.id);
    if (!focused) return "";

    const standardDetails = window.CONDITION_DETAILS?.[focused];
    const details = standardDetails?.length
      ? `<ul>${standardDetails.map(detail => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`
      : `<p>Custom condition. Add any campaign-specific details to your own notes.</p>`;

    return `
      <aside class="combatant-condition-info" aria-live="polite">
        <div class="combatant-condition-info-header">
          <strong>${escapeHtml(focused)}</strong>
          <button type="button" data-action="close-condition-info" aria-label="Close ${escapeHtml(focused)} details">×</button>
        </div>
        ${details}
      </aside>`;
  }

  function conditionEditorMarkup(combatant) {
    const conditions = normalizeConditionNames(combatant.currentConditions);
    return `
      <div class="combatant-condition-chips">
        ${conditions.length
          ? conditions.map(condition => `
              <span class="combatant-condition-chip${focusedConditions.get(combatant.id) === condition ? " active" : ""}">
                <button type="button" class="combatant-condition-open" data-action="show-condition" data-condition="${escapeHtml(condition)}">${escapeHtml(condition)}</button>
                <button type="button" class="combatant-condition-remove" data-action="remove-condition" data-condition="${escapeHtml(condition)}" aria-label="Remove ${escapeHtml(condition)}">×</button>
              </span>`).join("")
          : `<span class="combatant-condition-empty">No conditions</span>`}
      </div>
      <select class="combatant-condition-picker" data-action="add-condition" aria-label="Add condition for ${escapeHtml(combatant.name)}">
        ${conditionOptionsMarkup()}
      </select>
      ${conditionInfoMarkup(combatant)}`;
  }

  function renderCombatantRow(combatant, displayIndex) {
    const isNpc = combatant.type === "npc";
    const activeClass = combatant.id === state.activeId ? " active-turn" : "";
    const encodedName = escapeHtml(combatant.name);
    const hasInitiative = numericInitiative(combatant.initiative) !== Number.NEGATIVE_INFINITY;

    return `
      <article class="combatant-row${activeClass}" data-id="${escapeHtml(combatant.id)}" data-type="${combatant.type}">
        <div class="combatant-order-medallion" aria-hidden="true">${hasInitiative ? displayIndex + 1 : "·"}</div>
        <div class="combatant-name-wrap">
          ${isNpc
            ? rowInput({ className: "combatant-name-input", field: "name", value: combatant.name, label: "NPC name" })
            : `<span class="combatant-name">${encodedName}</span><span class="combatant-type">Player character · live sync</span>`}
        </div>
        <div class="combatant-initiative">
          ${rowInput({ className: "initiative-input", field: "initiative", value: combatant.initiative, label: `Initiative for ${combatant.name}`, type: "number", inputmode: "numeric" })}
        </div>
        <div class="combatant-hp">
          ${hpBarMarkup(combatant)}
          <div class="combatant-hp-fields">
            ${rowInput({ className: "hp-current-input", field: "hpCurrent", value: combatant.hpCurrent, label: `Current HP for ${combatant.name}`, type: "number", inputmode: "numeric" })}
            <span class="hp-divider">/</span>
            ${rowInput({ className: "hp-max-input", field: "hpMax", value: combatant.hpMax, label: `Maximum HP for ${combatant.name}`, type: "number", inputmode: "numeric" })}
          </div>
        </div>
        <div class="combatant-ac">
          ${rowInput({ className: "ac-input", field: "armorClass", value: combatant.armorClass, label: `Armor Class for ${combatant.name}`, type: "number", inputmode: "numeric" })}
        </div>
        <div class="combatant-conditions">
          ${conditionEditorMarkup(combatant)}
        </div>
        <label class="combatant-concentration concentration-toggle" title="Concentrating">
          <input data-field="concentrating" type="checkbox" ${combatant.concentrating ? "checked" : ""} aria-label="${encodedName} is concentrating">
          <span class="concentration-rune" aria-hidden="true">✦</span>
        </label>
        ${isNpc
          ? `<button class="combatant-remove" type="button" data-action="remove-npc" title="Remove ${encodedName}" aria-label="Remove ${encodedName}">×</button>`
          : `<span class="player-lock-icon" title="Character live sync" aria-label="Character live sync">◆</span>`}
      </article>
    `;
  }

  function renderTracker() {
    const combatants = getCombatants();
    const list = document.getElementById("initiativeList");
    const empty = document.getElementById("initiativeEmptyState");
    const round = document.getElementById("roundNumber");
    const activeText = document.getElementById("activeTurnText");

    if (!list || !empty || !round || !activeText) return;

    list.innerHTML = combatants.map(renderCombatantRow).join("");
    empty.hidden = combatants.length > 0;
    round.textContent = String(state.round);

    const active = combatants.find(combatant => combatant.id === state.activeId);
    activeText.textContent = active
      ? `Current turn · ${active.name}`
      : "Add initiative values to begin.";
  }

  function publishLiveUpdate(update) {
    const payload = {
      type: "live-summary-updated",
      ...update,
      nonce: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    };

    try { syncChannel?.postMessage(payload); } catch {}
    try { localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload)); } catch {}
  }

  function updatePlayerSummaryLocally(id, patch) {
    const character = playerCharacters.find(item => item.id === id);
    if (!character) return;
    Object.assign(character, patch);
  }

  function schedulePlayerStatusSave(id) {
    clearTimeout(saveTimers.get(id));
    saveTimers.set(id, setTimeout(async () => {
      saveTimers.delete(id);
      const character = playerCharacters.find(item => item.id === id);
      if (!character) return;

      const payload = {
        id,
        hpCurrent: character.hpCurrent ?? "",
        hpMax: character.hpMax ?? "",
        tempHp: character.tempHp ?? "",
        armorClass: character.armorClass ?? "",
        currentConditions: character.currentConditions ?? ""
      };

      try {
        const result = await characterStorage.saveCharacterStatus(payload);
        publishLiveUpdate({ ...payload, updatedAt: result?.updatedAt || new Date().toISOString() });
      } catch (error) {
        console.warn("Could not save DM-screen player status:", error.message);
      }
    }, SAVE_DELAY));
  }

  function updateNpc(id, field, value) {
    const npc = state.npcs.find(item => item.id === id);
    if (!npc) return;
    npc[field] = value;
    persistTrackerState();
  }

  function updateCombatantConditions(id, type, conditions) {
    const currentConditions = serializeConditionNames(conditions);
    if (type === "npc") {
      updateNpc(id, "currentConditions", currentConditions);
    } else {
      updatePlayerSummaryLocally(id, { currentConditions });
      schedulePlayerStatusSave(id);
    }
  }

  function refreshHpBar(row) {
    const current = numericHp(row.querySelector('[data-field="hpCurrent"]')?.value);
    const max = numericHp(row.querySelector('[data-field="hpMax"]')?.value);
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
    const bar = row.querySelector(".combatant-hp-bar");
    if (!bar) return;
    bar.style.width = `${pct}%`;
    bar.classList.toggle("danger", pct > 0 && pct <= 50);
  }

  function restoreFocus(id, field, selectionStart) {
    const restored = document.querySelector(`.combatant-row[data-id="${CSS.escape(id)}"] [data-field="${CSS.escape(field)}"]`);
    restored?.focus();
    if (restored && typeof selectionStart === "number" && typeof restored.setSelectionRange === "function") {
      restored.setSelectionRange(selectionStart, selectionStart);
    }
  }

  function handleTrackerInput(event) {
    const input = event.target.closest("[data-field]");
    const row = input?.closest(".combatant-row");
    if (!input || !row) return;

    const { id, type } = row.dataset;
    const field = input.dataset.field;
    const value = input.type === "checkbox" ? input.checked : input.value;

    if (type === "npc") {
      updateNpc(id, field, value);
    } else if (field === "initiative") {
      state.playerInitiatives[id] = String(value);
      persistTrackerState();
    } else if (field === "concentrating") {
      state.playerConcentration[id] = Boolean(value);
      persistTrackerState();
    } else {
      updatePlayerSummaryLocally(id, { [field]: String(value) });
      schedulePlayerStatusSave(id);
    }

    if (field === "hpCurrent" || field === "hpMax") refreshHpBar(row);

    if (field === "initiative" || field === "name") {
      const selectionStart = input.selectionStart;
      renderTracker();
      restoreFocus(id, field, selectionStart);
    }
  }

  function addCondition(row, rawCondition) {
    if (!row || !rawCondition) return;
    const { id, type } = row.dataset;
    let condition = rawCondition;

    if (rawCondition === CUSTOM_CONDITION_VALUE) {
      condition = prompt("Enter a custom condition:", "")?.trim() || "";
    }
    if (!condition) return;

    const combatant = getCombatants().find(item => item.id === id);
    if (!combatant) return;

    const conditions = normalizeConditionNames(combatant.currentConditions);
    if (!conditions.some(item => item.toLowerCase() === condition.toLowerCase())) {
      conditions.push(condition);
      updateCombatantConditions(id, type, conditions);
    }
    focusedConditions.set(id, normalizeConditionNames(condition)[0] || condition);
    renderTracker();
  }

  function removeCondition(row, condition) {
    if (!row || !condition) return;
    const { id, type } = row.dataset;
    const combatant = getCombatants().find(item => item.id === id);
    if (!combatant) return;

    const conditions = normalizeConditionNames(combatant.currentConditions)
      .filter(item => item.toLowerCase() !== condition.toLowerCase());
    updateCombatantConditions(id, type, conditions);
    if (focusedConditions.get(id)?.toLowerCase() === condition.toLowerCase()) {
      focusedConditions.delete(id);
    }
    renderTracker();
  }

  function showCondition(row, condition) {
    if (!row || !condition) return;
    const id = row.dataset.id;
    if (focusedConditions.get(id) === condition) focusedConditions.delete(id);
    else focusedConditions.set(id, condition);
    renderTracker();
  }

  function addNpc() {
    state.npcs.push(normalizeNpc({ id: createId(), name: "New NPC" }));
    persistTrackerState();
    renderTracker();
  }

  function removeNpc(id) {
    state.npcs = state.npcs.filter(npc => npc.id !== id);
    focusedConditions.delete(id);
    if (state.activeId === id) state.activeId = "";
    persistTrackerState();
    renderTracker();
  }

  function getInitiativeCombatants() {
    return getCombatants().filter(combatant => numericInitiative(combatant.initiative) !== Number.NEGATIVE_INFINITY);
  }

  function advanceTurn() {
    const combatants = getInitiativeCombatants();
    if (!combatants.length) {
      state.activeId = "";
      persistTrackerState();
      renderTracker();
      return;
    }

    const currentIndex = combatants.findIndex(combatant => combatant.id === state.activeId);

    if (currentIndex < 0) {
      state.activeId = combatants[0].id;
    } else if (currentIndex === combatants.length - 1) {
      state.activeId = combatants[0].id;
      state.round += 1;
    } else {
      state.activeId = combatants[currentIndex + 1].id;
    }

    persistTrackerState();
    renderTracker();
  }

  function resetCombat() {
    if (!confirm("Reset initiative values, NPCs, concentration markers, active turn, and round number?")) return;
    state = { round: 1, activeId: "", playerInitiatives: {}, playerConcentration: {}, npcs: [] };
    focusedConditions.clear();
    persistTrackerState();
    renderTracker();
  }

  function receiveLiveUpdate(payload) {
    if (!payload || payload.type !== "live-summary-updated" || !payload.id) return;
    updatePlayerSummaryLocally(payload.id, {
      hpCurrent: payload.hpCurrent ?? "",
      hpMax: payload.hpMax ?? "",
      tempHp: payload.tempHp ?? "",
      armorClass: payload.armorClass ?? "",
      currentConditions: payload.currentConditions ?? ""
    });

    if (!saveTimers.has(payload.id)) renderTracker();
  }

  async function refreshPlayers() {
    try {
      const latest = await characterStorage.listCharacterData();
      playerCharacters = latest;
      renderTracker();
    } catch (error) {
      console.warn("Could not refresh DM-screen characters:", error.message);
    }
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(refreshPlayers, POLL_DELAY);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    state.npcs = state.npcs.map(normalizeNpc);
    persistTrackerState();

    const list = document.getElementById("initiativeList");
    list?.addEventListener("input", handleTrackerInput);
    list?.addEventListener("change", event => {
      const picker = event.target.closest('[data-action="add-condition"]');
      if (picker) {
        addCondition(picker.closest(".combatant-row"), picker.value);
        return;
      }
      handleTrackerInput(event);
    });
    list?.addEventListener("click", event => {
      const row = event.target.closest(".combatant-row");
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!row || !action) return;

      if (action === "remove-npc") removeNpc(row.dataset.id || "");
      if (action === "show-condition") showCondition(row, event.target.closest("[data-condition]")?.dataset.condition || "");
      if (action === "remove-condition") removeCondition(row, event.target.closest("[data-condition]")?.dataset.condition || "");
      if (action === "close-condition-info") {
        focusedConditions.delete(row.dataset.id || "");
        renderTracker();
      }
    });

    document.getElementById("addNpcBtn")?.addEventListener("click", addNpc);
    document.getElementById("nextTurnBtn")?.addEventListener("click", advanceTurn);
    document.getElementById("resetCombatBtn")?.addEventListener("click", resetCombat);

    syncChannel?.addEventListener("message", event => receiveLiveUpdate(event.data));
    window.addEventListener("storage", event => {
      if (event.key !== SYNC_STORAGE_KEY || !event.newValue) return;
      try { receiveLiveUpdate(JSON.parse(event.newValue)); } catch {}
    });

    try {
      await characterStorage.init();
      await refreshPlayers();
      startPolling();
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not initialize the DM screen.");
    }
  });
})();
