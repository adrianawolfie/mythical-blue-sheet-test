// Mythical Blue · DM screen initiative tracker
// Player rows stay connected to the live character summaries.

(() => {
  const DM_STATE_KEY = "mythicalBlueDMTrackerV1";
  const SYNC_CHANNEL_NAME = "mythical-blue-hp-sync-v1";
  const SYNC_STORAGE_KEY = "mythicalBlueHPBroadcastV1";
  const SAVE_DELAY = 550;
  const POLL_DELAY = 5000;

  let playerCharacters = [];
  let state = loadTrackerState();
  let saveTimers = new Map();
  let pollTimer = null;

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

  function normalizeNpc(npc) {
    return {
      id: String(npc.id || createId()),
      name: String(npc.name || "New NPC"),
      initiative: String(npc.initiative ?? ""),
      hpCurrent: String(npc.hpCurrent ?? ""),
      hpMax: String(npc.hpMax ?? ""),
      armorClass: String(npc.armorClass ?? ""),
      currentConditions: String(npc.currentConditions ?? ""),
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
      currentConditions: String(character.currentConditions ?? ""),
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

  function renderCombatantRow(combatant) {
    const isNpc = combatant.type === "npc";
    const activeClass = combatant.id === state.activeId ? " active-turn" : "";
    const encodedName = escapeHtml(combatant.name);

    return `
      <article class="combatant-row${activeClass}" data-id="${escapeHtml(combatant.id)}" data-type="${combatant.type}">
        <div class="combatant-name-wrap">
          ${isNpc
            ? rowInput({ className: "combatant-name-input", field: "name", value: combatant.name, label: "NPC name" })
            : `<span class="combatant-name">${encodedName}</span><span class="combatant-type">Player character</span>`}
        </div>
        <div class="combatant-initiative">
          ${rowInput({ className: "initiative-input", field: "initiative", value: combatant.initiative, label: `Initiative for ${combatant.name}`, type: "number", inputmode: "numeric" })}
        </div>
        <div class="combatant-hp">
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
          ${rowInput({ className: "conditions-input", field: "currentConditions", value: combatant.currentConditions, label: `Conditions for ${combatant.name}` })}
        </div>
        <label class="combatant-concentration concentration-toggle" title="Concentrating">
          <input data-field="concentrating" type="checkbox" ${combatant.concentrating ? "checked" : ""} aria-label="${encodedName} is concentrating">
        </label>
        ${isNpc
          ? `<button class="combatant-remove" type="button" data-action="remove-npc" title="Remove ${encodedName}" aria-label="Remove ${encodedName}">×</button>`
          : `<span class="player-lock-icon" title="Player character live sync" aria-label="Player character live sync">◆</span>`}
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
      ? `Current turn: ${active.name}`
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

    if (field === "initiative" || field === "name") {
      const focusedId = id;
      const selectionStart = input.selectionStart;
      renderTracker();
      const restored = document.querySelector(`.combatant-row[data-id="${CSS.escape(focusedId)}"] [data-field="${CSS.escape(field)}"]`);
      restored?.focus();
      if (restored && typeof selectionStart === "number" && typeof restored.setSelectionRange === "function") {
        restored.setSelectionRange(selectionStart, selectionStart);
      }
    }
  }

  function addNpc() {
    state.npcs.push(normalizeNpc({ id: createId(), name: "New NPC" }));
    persistTrackerState();
    renderTracker();
  }

  function removeNpc(id) {
    state.npcs = state.npcs.filter(npc => npc.id !== id);
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

    document.getElementById("initiativeList")?.addEventListener("input", handleTrackerInput);
    document.getElementById("initiativeList")?.addEventListener("change", handleTrackerInput);
    document.getElementById("initiativeList")?.addEventListener("click", event => {
      const removeButton = event.target.closest('[data-action="remove-npc"]');
      if (removeButton) removeNpc(removeButton.closest(".combatant-row")?.dataset.id || "");
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
