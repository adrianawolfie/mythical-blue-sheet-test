// Mythical Blue · SRD spell picker and card/list spellbook views.
(function () {
  const SCHOOL_ICONS = {
    Abjuration: 'abjuration',
    Conjuration: 'conjuration',
    Divination: 'divination',
    Enchantment: 'enchantment',
    Evocation: 'evocation',
    Illusion: 'illusion',
    Necromancy: 'necromancy',
    Transmutation: 'transmutation',
    Homebrew: 'homebrew'
  };

  let srdLibrary = [];
  let srdLoaded = false;

  const originalAddSR = window.addSR;
  const originalResetSpellRows = window.resetSpellRows;

  function esc(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function text(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function icon(school = 'Homebrew') {
    const key = SCHOOL_ICONS[school] || 'homebrew';
    return `assets/spell-icons/${key}.svg`;
  }

  function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function firstSentence(value = '') {
    const cleaned = cleanText(value);
    if (!cleaned) return '';

    const match = cleaned.match(/^(.{1,220}?[.!?])(?:\s|$)/);
    const first = match ? match[1] : cleaned;
    return first.length > 190 ? `${first.slice(0, 187).trim()}…` : first;
  }

  function deriveBoolean(explicitValue, fallbackText = '', pattern) {
    return explicitValue === true || pattern.test(String(fallbackText || ''));
  }

  function levelRank(level = '') {
    if (level === 'C') return 0;
    const parsed = Number.parseInt(level, 10);
    return Number.isFinite(parsed) ? parsed : 99;
  }

  function compareSpells(a, b) {
    const levelDifference = levelRank(a.level) - levelRank(b.level);
    if (levelDifference) return levelDifference;
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base'
    });
  }

  function levelLabel(level = '') {
    return level === 'C' ? 'Cantrip' : level ? `Level ${level}` : 'Unassigned';
  }

  function rowMetadata(row) {
    return {
      sourceId: row.dataset.sourceId || '',
      source: row.dataset.source || '',
      school: row.dataset.school || 'Homebrew',
      duration: row.dataset.duration || '',
      componentsText: row.dataset.componentsText || '',
      classes: row.dataset.classes || ''
    };
  }

  function findRow(index) {
    return document.querySelectorAll('#sbody .spell-main-row')[index];
  }

  function getDetailsRow(row) {
    return row?.nextElementSibling?.classList.contains('spell-details-row')
      ? row.nextElementSibling
      : null;
  }

  function syncSRDCheckboxes(row, data = {}, match = null) {
    if (!row) return;

    const sourceLinked = Boolean(
      data.sourceId ||
      row.dataset.sourceId ||
      data.source === 'SRD 5.2.1' ||
      row.dataset.source === 'SRD 5.2.1'
    );

    if (!sourceLinked) return;

    const resolved = match || data;
    const duration = data.duration || row.dataset.duration || resolved?.duration || '';
    const castTime = data.castTime || resolved?.castTime || '';
    const components = data.componentsText || row.dataset.componentsText || resolved?.componentsText || '';

    const concentration = deriveBoolean(resolved?.concentration, duration, /concentration/i);
    const ritual = deriveBoolean(resolved?.ritual, castTime, /ritual/i);
    const material = deriveBoolean(resolved?.material, components, /(^|,\s*)M(?:\s|,|\(|$)/i);

    const concentrationInput = row.querySelector('.spell-concentration');
    const ritualInput = row.querySelector('.spell-ritual');
    const materialInput = row.querySelector('.spell-material');

    if (concentrationInput) concentrationInput.checked = concentration;
    if (ritualInput) ritualInput.checked = ritual;
    if (materialInput) materialInput.checked = material;
  }

  function enhanceRow(row, data = {}) {
    if (!row) return;

    const detailsRow = getDetailsRow(row);
    const panel = detailsRow?.querySelector('.spell-details-panel');
    const nameCell = row.querySelector('.spell-name')?.closest('td');
    const name = row.querySelector('.spell-name')?.value || data.name || '';
    const match = srdLibrary.find(spell => spell.name.toLowerCase() === name.toLowerCase());

    const meta = {
      sourceId: data.sourceId || row.dataset.sourceId || match?.id || '',
      source: data.source || row.dataset.source || match?.source || '',
      school: data.school || row.dataset.school || match?.school || 'Homebrew',
      duration: data.duration || row.dataset.duration || match?.duration || '',
      componentsText: data.componentsText || row.dataset.componentsText || match?.componentsText || '',
      classes: Array.isArray(data.classes)
        ? data.classes.join(', ')
        : data.classes || row.dataset.classes || (match?.classes || []).join(', ')
    };

    Object.entries(meta).forEach(([key, value]) => {
      row.dataset[key] = value || '';
    });

    if (nameCell && !nameCell.querySelector('.spell-list-school-icon')) {
      nameCell.insertAdjacentHTML(
        'afterbegin',
        `<img class="spell-list-school-icon" src="${icon(meta.school)}" alt="" aria-hidden="true">`
      );
    } else {
      const image = nameCell?.querySelector('.spell-list-school-icon');
      if (image) image.src = icon(meta.school);
    }

    syncSRDCheckboxes(row, data, match);

    if (panel && !panel.querySelector('.spell-structured-grid')) {
      panel.insertAdjacentHTML(
        'afterbegin',
        `<span class="spell-source-badge">${esc(meta.source || 'Homebrew / Custom')}</span>
         <div class="spell-structured-grid">
           <label><span>School</span><input class="spell-school" value="${esc(meta.school === 'Homebrew' ? '' : meta.school)}" placeholder="Evocation, Abjuration…"></label>
           <label><span>Duration</span><input class="spell-duration" value="${esc(meta.duration)}" placeholder="Instantaneous, 1 minute…"></label>
           <label><span>Components</span><input class="spell-components-text" value="${esc(meta.componentsText)}" placeholder="V, S, M…"></label>
           <label><span>Classes</span><input class="spell-classes" value="${esc(meta.classes)}" placeholder="Wizard, Cleric…"></label>
         </div>`
      );

      panel.querySelectorAll('.spell-structured-grid input').forEach(input => {
        input.addEventListener('input', () => {
          row.dataset.school = panel.querySelector('.spell-school')?.value || 'Homebrew';
          row.dataset.duration = panel.querySelector('.spell-duration')?.value || '';
          row.dataset.componentsText = panel.querySelector('.spell-components-text')?.value || '';
          row.dataset.classes = panel.querySelector('.spell-classes')?.value || '';

          const image = nameCell?.querySelector('.spell-list-school-icon');
          if (image) image.src = icon(row.dataset.school);

          refreshSpellCards();
        });
      });
    }
  }

  function enhanceAll() {
    document
      .querySelectorAll('#sbody .spell-main-row')
      .forEach(row => enhanceRow(row));
  }

  window.addSR = function addEnhancedSpellRow(data = {}) {
    const duration = data.duration || '';
    const castTime = data.castTime || '';
    const componentsText = data.componentsText || '';
    const enriched = {
      ...data,
      concentration: deriveBoolean(data.concentration, duration, /concentration/i),
      ritual: deriveBoolean(data.ritual, castTime, /ritual/i),
      material: deriveBoolean(data.material, componentsText, /(^|,\s*)M(?:\s|,|\(|$)/i),
      effect: data.effect || data.effectSummary || firstSentence(data.details || '')
    };

    originalAddSR(enriched);

    const rows = document.querySelectorAll('#sbody .spell-main-row');
    enhanceRow(rows[rows.length - 1], enriched);
    refreshSpellCards();
    applySpellFilters();
  };

  window.resetSpellRows = function resetEnhancedSpellRows(rows) {
    if (rows === undefined) {
      originalResetSpellRows();
      enhanceAll();
      refreshSpellCards();
      return;
    }

    const body = document.getElementById('sbody');
    if (!body) return;

    body.innerHTML = '';
    (rows || []).forEach(row => window.addSR(row));
    refreshSpellCards();
  };

  window.collectSpellRows = function collectEnhancedSpellRows() {
    return Array.from(document.querySelectorAll('#sbody .spell-main-row')).map(row => {
      const detailsRow = getDetailsRow(row);
      const meta = rowMetadata(row);

      return {
        level: row.querySelector('.spell-level')?.value || '',
        name: row.querySelector('.spell-name')?.value || '',
        castTime: row.querySelector('.spell-cast-time')?.value || '',
        range: row.querySelector('.spell-range')?.value || '',
        concentration: row.querySelector('.spell-concentration')?.checked || false,
        ritual: row.querySelector('.spell-ritual')?.checked || false,
        material: row.querySelector('.spell-material')?.checked || false,
        effect: row.querySelector('.spell-effect')?.value || '',
        details: detailsRow?.querySelector('.spell-details')?.value || '',
        open: detailsRow?.style.display !== 'none',
        ...meta
      };
    });
  };

  async function loadLibrary() {
    if (srdLoaded) return;

    try {
      const response = await fetch('data/srd-spells.json', { cache: 'no-store' });
      const library = await response.json();
      srdLibrary = (library.spells || []).sort(compareSpells);
      srdLoaded = true;
      enhanceAll();
      refreshSpellCards();
    } catch (error) {
      console.warn('SRD spell library unavailable', error);
    }
  }

  window.openSpellPicker = async function openSpellPicker() {
    await loadLibrary();
    const modal = document.getElementById('spellPickerModal');
    if (!modal) return;

    modal.hidden = false;
    document.getElementById('spellPickerSearch')?.focus();
    renderPicker();
  };

  window.closeSpellPicker = function closeSpellPicker() {
    const modal = document.getElementById('spellPickerModal');
    if (modal) modal.hidden = true;
  };

  window.addCustomSpell = function addCustomSpell() {
    window.addSR({ source: 'Homebrew / Custom', school: 'Homebrew' });
    setSpellView('list');
    const rows = document.querySelectorAll('#sbody .spell-main-row');
    rows[rows.length - 1]?.querySelector('.spell-name')?.focus();
  };

  window.addSpellFromLibrary = function addSpellFromLibrary(id) {
    const spell = srdLibrary.find(candidate => candidate.id === id);
    if (!spell) return;

    window.addSR({
      sourceId: spell.id,
      source: spell.source,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      classes: spell.classes,
      castTime: spell.castTime,
      range: spell.range,
      duration: spell.duration,
      componentsText: spell.componentsText,
      concentration: deriveBoolean(spell.concentration, spell.duration, /concentration/i),
      ritual: deriveBoolean(spell.ritual, spell.castTime, /ritual/i),
      material: deriveBoolean(spell.material, spell.componentsText, /(^|,\s*)M(?:\s|,|\(|$)/i),
      effect: spell.effectSummary || firstSentence(spell.details),
      details: spell.details
    });

    closeSpellPicker();
  };

  function renderPicker() {
    const query = (document.getElementById('spellPickerSearch')?.value || '').toLowerCase();
    const level = document.getElementById('spellPickerLevel')?.value || 'all';
    const school = document.getElementById('spellPickerSchool')?.value || 'all';
    const spellClass = document.getElementById('spellPickerClass')?.value || 'all';

    const results = srdLibrary
      .filter(spell =>
        (!query || [spell.name, spell.school, (spell.classes || []).join(' ')].join(' ').toLowerCase().includes(query)) &&
        (level === 'all' || spell.level === level) &&
        (school === 'all' || spell.school === school) &&
        (spellClass === 'all' || (spell.classes || []).includes(spellClass))
      )
      .slice(0, 180);

    const box = document.getElementById('spellPickerResults');
    if (box) {
      box.innerHTML = results.map(spell => `
        <button type="button" class="spell-picker-result" onclick="addSpellFromLibrary('${esc(spell.id)}')">
          <img src="${icon(spell.school)}" alt="" aria-hidden="true">
          <span>
            <strong>${esc(spell.name)}</strong>
            <em>${esc(levelLabel(spell.level))} · ${esc(spell.school)} · ${esc((spell.classes || []).join(', '))}</em>
          </span>
          <span class="spell-picker-add">Add</span>
        </button>
      `).join('') || '<p class="spell-picker-empty">No matching SRD spells found.</p>';
    }

    const count = document.getElementById('spellPickerCount');
    if (count) count.textContent = `Showing ${results.length} of ${srdLibrary.length} SRD spells`;
  }

  function currentFilters() {
    return {
      query: (document.getElementById('spellSearchInput')?.value || '').toLowerCase(),
      level: document.getElementById('spellLevelFilter')?.value || 'all',
      school: document.getElementById('spellSchoolFilter')?.value || 'all'
    };
  }

  function matches(spell, filters) {
    const school = spell.school || 'Homebrew';
    return (
      (!filters.query || [spell.name, spell.effect, spell.details, school].join(' ').toLowerCase().includes(filters.query)) &&
      (filters.level === 'all' || spell.level === filters.level) &&
      (filters.school === 'all' || school === filters.school)
    );
  }

  window.applySpellFilters = function applySpellFilters() {
    const filters = currentFilters();
    const spells = window.collectSpellRows();

    document.querySelectorAll('#sbody .spell-main-row').forEach((row, index) => {
      const show = matches(spells[index] || {}, filters);
      row.hidden = !show;
      const detailsRow = getDetailsRow(row);
      if (detailsRow) detailsRow.hidden = !show;
    });

    refreshSpellCards();
  };

  function properties(spell) {
    const components = spell.componentsText || '';
    const flags = [
      ['V', /(^|,\s*)V(?:,|\s|$)/i.test(components)],
      ['S', /(^|,\s*)S(?:,|\s|$)/i.test(components)],
      ['M', spell.material],
      ['C', spell.concentration],
      ['R', spell.ritual]
    ];

    return flags.map(([label, active]) => `
      <span class="spell-property-chip ${active ? 'active' : ''}" title="${label}">${label}</span>
    `).join('');
  }

  function cardTeaser(spell) {
    const customEffect = cleanText(spell.effect || '');
    const autoSummary = firstSentence(spell.details || '');

    if (customEffect && customEffect !== autoSummary) return customEffect;
    return autoSummary || 'No short effect entered yet.';
  }

  function cardDetails(spell) {
    return `
      <div class="spell-card-detail-grid">
        <div><strong>Level</strong><span>${esc(levelLabel(spell.level))}</span></div>
        <div><strong>Casting Time</strong><span>${esc(spell.castTime || '—')}</span></div>
        <div><strong>Range</strong><span>${esc(spell.range || '—')}</span></div>
        <div><strong>Components</strong><span>${esc(spell.componentsText || '—')}</span></div>
        <div><strong>Duration</strong><span>${esc(spell.duration || '—')}</span></div>
        <div><strong>School</strong><span>${esc(spell.school || 'Homebrew')}</span></div>
        <div><strong>Classes</strong><span>${esc(spell.classes || '—')}</span></div>
        <div><strong>Source</strong><span>${esc(spell.source || 'Custom')}</span></div>
      </div>
      <div class="spell-card-rule-text">${text(spell.details || 'No full description entered yet.')}</div>
    `;
  }

  window.refreshSpellCards = function refreshSpellCards() {
    const box = document.getElementById('spellCardView');
    if (!box) return;

    const filters = currentFilters();
    const spells = window.collectSpellRows()
      .map((spell, index) => ({ ...spell, index }))
      .filter(spell => spell.name && matches(spell, filters))
      .sort(compareSpells);

    box.innerHTML = spells.map(spell => `
      <article class="spell-card">
        <div class="spell-card-summary-row">
          <img class="spell-school-icon" src="${icon(spell.school || 'Homebrew')}" alt="" aria-hidden="true">
          <span class="spell-level-badge"><span>${esc(spell.level || '—')}</span></span>
          <div class="spell-card-title-wrap">
            <div class="spell-card-title">${esc(spell.name)}</div>
            <div class="spell-card-school">${esc(spell.school || 'Homebrew')} · ${esc(levelLabel(spell.level))}</div>
          </div>
          <div class="spell-card-quick"><strong>Cast</strong><span>${esc(spell.castTime || '—')}</span></div>
          <div class="spell-card-quick"><strong>Duration</strong><span>${esc(spell.duration || '—')}</span></div>
          <div class="spell-card-quick"><strong>Range</strong><span>${esc(spell.range || '—')}</span></div>
          <div class="spell-card-properties">${properties(spell)}</div>
          <button class="spell-card-expand" type="button" onclick="toggleSpellCardDetails(this)" aria-expanded="false">Details ▾</button>
        </div>
        <div class="spell-card-teaser">${text(cardTeaser(spell))}</div>
        <div class="spell-card-details" hidden>
          ${cardDetails(spell)}
          <div class="spell-card-actions">
            <button class="spell-card-btn" type="button" onclick="editSpellFromCard(${spell.index})">Edit Spell</button>
          </div>
        </div>
      </article>
    `).join('') || '<p class="spell-picker-empty">No spells match the current filters.</p>';
  };

  window.toggleSpellCardDetails = function toggleSpellCardDetails(button) {
    const details = button.closest('.spell-card')?.querySelector('.spell-card-details');
    if (!details) return;

    details.hidden = !details.hidden;
    button.textContent = details.hidden ? 'Details ▾' : 'Details ▴';
    button.setAttribute('aria-expanded', details.hidden ? 'false' : 'true');
  };

  window.editSpellFromCard = function editSpellFromCard(index) {
    setSpellView('list');
    const row = findRow(index);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row?.querySelector('.spell-name')?.focus();
  };

  window.setSpellView = function setSpellView(view = 'cards') {
    const cards = document.getElementById('spellCardView');
    const list = document.getElementById('spellListView');
    const selected = view === 'list' ? 'list' : 'cards';

    if (cards) cards.hidden = selected !== 'cards';
    if (list) list.hidden = selected !== 'list';

    document.querySelectorAll('.spell-view-btn').forEach(button => {
      const active = button.dataset.spellView === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll('.spell-list-only-action').forEach(button => {
      button.hidden = selected !== 'list';
    });

    localStorage.setItem('mythical-blue-spell-view', selected);
    refreshSpellCards();
  };

  function bind() {
    document.querySelectorAll('.spell-view-btn').forEach(button => {
      button.addEventListener('click', () => setSpellView(button.dataset.spellView));
    });

    ['spellLevelFilter', 'spellSchoolFilter', 'spellSearchInput'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applySpellFilters);
    });

    ['spellPickerSearch', 'spellPickerLevel', 'spellPickerSchool', 'spellPickerClass'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderPicker);
    });

    document.getElementById('spellPickerModal')?.addEventListener('click', event => {
      if (event.target.id === 'spellPickerModal') closeSpellPicker();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeSpellPicker();
    });

    document.getElementById('sbody')?.addEventListener('input', refreshSpellCards);
    document.getElementById('sbody')?.addEventListener('change', refreshSpellCards);

    enhanceAll();
    setSpellView(localStorage.getItem('mythical-blue-spell-view') || 'cards');
    loadLibrary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
