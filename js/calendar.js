// js/calendar.js
// ═══════════════════════════════════════════════════════════════════════════
//  Materra Calendar — Era of Materra (EM)
//  13 months × 28 days (4 weeks × 7 days) per month
//  + Aenaris       (Day Out of Time — between Gahen and Akhus, year-end)
//  + Intercalis    (Leap Day — between Amarsa and Lotan, every 4th year)
//  Starting date:  Year 4520 EM, Month 3 (Trelus), Day 28 (Final Solaris)
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── CALENDAR DATA ──────────────────────────────────────────────────────────

  var MONTHS = [
    { num:  1, name: 'Akhus',   god: 'Akhlys',   season: 'Winter (Hiver)',           meaning: 'Misery & Revenge' },
    { num:  2, name: 'Abzutus', god: 'Abzutarus', season: 'Winter (Hiver)',           meaning: 'The Void' },
    { num:  3, name: 'Trelus',  god: 'Trel',      season: 'Winter (Hiver)',           meaning: 'Hope & Nautic Origin' },
    { num:  4, name: 'Sahetru', god: 'Sahet',     season: 'Between Winter & Spring',  meaning: 'The Tides' },
    { num:  5, name: 'Lahman',  god: 'Lahmu',     season: 'Spring (Len)',             meaning: 'Destructive Nature of Water' },
    { num:  6, name: 'Lahaman', god: 'Lahamu',    season: 'Spring (Len)',             meaning: 'Healing Nature of Water' },
    { num:  7, name: 'Aeru',    god: 'Aerie',     season: 'Between Spring & Summer',  meaning: 'Purity' },
    { num:  8, name: 'Thalsa',  god: 'Thalassa',  season: 'Summer (Sumor)',           meaning: 'The Origin of Life' },
    { num:  9, name: 'Amarsa',  god: 'Amaru',     season: 'Summer (Sumor)',           meaning: 'Unconditional Love' },
    // ── Intercalis (leap day) falls between month 9 and 10 ──
    { num: 10, name: 'Lotan',   god: 'Lotaru',    season: 'Between Summer & Autumn',  meaning: 'Chaos' },
    { num: 11, name: 'Basen',   god: 'Basmu',     season: 'Autumn (Autumnus)',        meaning: 'Decay' },
    { num: 12, name: 'Haden',   god: 'Hadad',     season: 'Autumn (Autumnus)',        meaning: 'Tempest & Rain' },
    { num: 13, name: 'Gahen',   god: 'Gahakan',   season: 'Autumn (Autumnus)',        meaning: 'Trickery' }
    // ── Aenaris (Day Out of Time) falls after month 13 ──
  ];

  // Day 1 of every month = Lunaris; day 7 = Solaris; day 28 = Final Solaris.
  // The 7-day cycle resets fresh each month (special days are "outside" the week).
  var WEEKDAYS = [
    { num: 1, scripture: 'Lunaris',  common: 'Lunis',   meaning: 'Start of the Week',   desc: 'The Moon Rises' },
    { num: 2, scripture: 'Thalaris', common: 'Thalis',  meaning: 'The Flow of Times',   desc: 'The Tides Come In' },
    { num: 3, scripture: 'Terranis', common: 'Terris',  meaning: 'Stabilization',       desc: 'Land Emerges from Water' },
    { num: 4, scripture: 'Ignaris',  common: 'Ignis',   meaning: 'Mid of the Week',     desc: 'Energy Ruptures from the Earth' },
    { num: 5, scripture: 'Ventaris', common: 'Ventris', meaning: 'Relinquishment',      desc: 'The Dissipation of Solidity' },
    { num: 6, scripture: 'Aetheris', common: 'Aethris', meaning: 'Ascension',           desc: 'Letting Go of Material Chains' },
    { num: 7, scripture: 'Solaris',  common: 'Solis',   meaning: 'Setting of the Week', desc: 'The Sun Sets' }
  ];

  // Zodiac signs — index 1 (0-based) = Void Wyrm, which aligns with year 4520.
  var ZODIAC = [
    { sign: 'Thalassa',  form: 'Sea Seraph' },
    { sign: 'Abzutarus', form: 'Void Wyrm' },
    { sign: 'Lotan',     form: 'Storm Hydra' },
    { sign: 'Lahmu',     form: 'Flow Drake' },
    { sign: 'Lahamu',    form: 'Ebb Drake' },
    { sign: 'Hadad',     form: 'Thunder Roc' },
    { sign: 'Basmu',     form: 'King Viper' },
    { sign: 'Aerie',     form: 'White Serpent' },
    { sign: 'Gahakan',   form: 'Night Weaver' },
    { sign: 'Sahet',     form: 'Twin Koi' },
    { sign: 'Trel',      form: 'Deep Whale' },
    { sign: 'Akhlys',    form: 'Poison Mist' },
    { sign: 'Amaru',     form: 'Tide Breaker' }
  ];

  // ── CONSTANTS ──────────────────────────────────────────────────────────────

  var DEFAULT_DATE = { year: 4520, month: 3, day: 28, special: null };
  var STORAGE_KEY  = 'matteraCalendarDate';

  // ── MATH HELPERS ───────────────────────────────────────────────────────────

  function isLeap(y) { return y % 4 === 0; }

  function daysInYear(y) { return 13 * 28 + 1 + (isLeap(y) ? 1 : 0); }

  // Year 4520 → Void Wyrm (ZODIAC[1]).  Formula keeps that anchor constant.
  function getZodiac(year) {
    var idx = ((year - 4519) % 13 + 13) % 13;
    return ZODIAC[idx];
  }

  // Weekday for day d (1–28) within any month.  Day 1 = Lunaris, day 7 = Solaris.
  function getWeekday(d) {
    return WEEKDAYS[(d - 1) % 7];
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // Occurrence label for week position in month.  Week 4 is always "Final".
  function weekOcc(day) {
    return ['1st', '2nd', '3rd', 'Final'][Math.ceil(day / 7) - 1] || '';
  }

  // ── DATE ARITHMETIC ────────────────────────────────────────────────────────

  function toAbs(d) {
    var abs = 0, y, m;
    for (y = 1; y < d.year; y++) abs += daysInYear(y);
    if (d.special === 'intercalis') {
      for (m = 1; m <= 9; m++) abs += 28;
      abs += 1;
    } else if (d.special === 'aenaris') {
      for (m = 1; m <= 13; m++) abs += 28;
      if (isLeap(d.year)) abs += 1;
      abs += 1;
    } else {
      for (m = 1; m < d.month; m++) {
        abs += 28;
        if (m === 9 && isLeap(d.year)) abs += 1;
      }
      abs += d.day;
    }
    return abs;
  }

  function fromAbs(abs) {
    if (abs < 1) abs = 1;
    var rem = abs, year = 1, m;
    while (rem > daysInYear(year)) { rem -= daysInYear(year); year++; }
    for (m = 1; m <= 13; m++) {
      if (rem <= 28) return { year: year, month: m, day: rem, special: null };
      rem -= 28;
      if (m === 9 && isLeap(year)) {
        if (rem === 1) return { year: year, month: null, day: null, special: 'intercalis' };
        rem--;
      }
    }
    return { year: year, month: null, day: null, special: 'aenaris' };
  }

  function advance(date, delta) {
    return fromAbs(toAbs(date) + delta);
  }

  // ── DATE INFO ──────────────────────────────────────────────────────────────

  function getInfo(date) {
    var zod = getZodiac(date.year);
    if (date.special === 'intercalis') {
      return { isSpecial: true, specialName: 'Intercalis',
               specialSub: 'The Repair of Time · The Start of the Beginning',
               year: date.year, zodiac: zod };
    }
    if (date.special === 'aenaris') {
      return { isSpecial: true, specialName: 'Aenaris',
               specialSub: 'The Day Out of Time · The Turning of Time',
               year: date.year, zodiac: zod };
    }
    var month = MONTHS[date.month - 1];
    var wd    = getWeekday(date.day);
    var occ   = weekOcc(date.day);
    return {
      isSpecial: false,
      year:      date.year,
      zodiac:    zod,
      month:     month,
      weekday:   wd,
      day:       date.day,
      occurrence: occ,
      weekNum:   Math.ceil(date.day / 7),
      dayLabel:  occ + ' ' + wd.scripture + ' of ' + month.name + ' (the ' + ordinal(date.day) + ')'
    };
  }

  // ── STORAGE ────────────────────────────────────────────────────────────────

  function load() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        var parsed = JSON.parse(s);
        if (typeof parsed.year === 'number') return parsed;
      }
    } catch (e) {}
    return { year: DEFAULT_DATE.year, month: DEFAULT_DATE.month,
             day: DEFAULT_DATE.day, special: DEFAULT_DATE.special };
  }

  function save(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderWidget(date) {
    var info = getInfo(date);
    var zod  = info.zodiac;
    setText('calWidgetYear', info.year + ' EM');
    setText('calWidgetSign', 'Year of the ' + zod.form + ' · ' + zod.sign);
    if (info.isSpecial) {
      setText('calWidgetWeekday', info.specialName);
      setText('calWidgetWdDesc',  info.specialSub);
      setText('calWidgetDay',     '');
      setText('calWidgetMonth',   '');
      setText('calWidgetMeaning', '');
      setText('calWidgetSeason',  '');
      setText('calWidgetWeek',    '');
    } else {
      setText('calWidgetWeekday', info.weekday.scripture + ' · ' + info.weekday.common);
      setText('calWidgetWdDesc',  info.weekday.desc);
      setText('calWidgetDay',     'the ' + ordinal(info.day));
      setText('calWidgetMonth',   'of ' + info.month.name);
      setText('calWidgetMeaning', info.month.meaning);
      setText('calWidgetSeason',  info.month.season);
      setText('calWidgetWeek',    'Week ' + info.weekNum + ' of 4');
    }
  }

  function renderSheetBar(date) {
    var el = document.getElementById('calSheetDisplay');
    if (!el) return;
    var info  = getInfo(date);
    var zod   = info.zodiac;
    var label = info.isSpecial
      ? info.year + ' EM  ·  ' + zod.form + ' Year  ·  ' + info.specialName
      : info.year + ' EM  ·  ' + zod.form + ' Year  ·  ' + info.dayLabel;
    el.textContent = label;
  }

  // ── INIT WIDGET ────────────────────────────────────────────────────────────

  function initWidget() {
    var prevBtn  = document.getElementById('calPrevDay');
    var nextBtn  = document.getElementById('calNextDay');
    var resetBtn = document.getElementById('calResetDay');
    if (!prevBtn) return;

    var current = load();
    renderWidget(current);

    prevBtn.addEventListener('click', function () {
      current = advance(current, -1);
      save(current);
      renderWidget(current);
      renderSheetBar(current);
    });

    nextBtn.addEventListener('click', function () {
      current = advance(current, +1);
      save(current);
      renderWidget(current);
      renderSheetBar(current);
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        current = { year: DEFAULT_DATE.year, month: DEFAULT_DATE.month,
                    day: DEFAULT_DATE.day, special: DEFAULT_DATE.special };
        save(current);
        renderWidget(current);
        renderSheetBar(current);
      });
    }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  // Called by the inline patch in index.html when a character sheet opens.
  global.renderCalendarOnSheet = function () {
    renderSheetBar(load());
  };

  // Called by the inline patch to restore a saved calendar date when
  // a character is loaded, and to read the current date when saving.
  global.MatteraCalendar = {
    getDate: load,
    setDate: function (date) {
      if (date && typeof date.year === 'number') {
        save(date);
        renderWidget(date);
        renderSheetBar(date);
      }
    }
  };

  // ── BOOT ───────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initWidget();
  });

}(window));
