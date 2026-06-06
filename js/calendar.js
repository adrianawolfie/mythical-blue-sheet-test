// js/calendar.js
// ═══════════════════════════════════════════════════════════════════════════
//  Materra Calendar — Era of Materra (EM)
//  13 months × 28 days (4 weeks × 7 days) per month
//  + Aenaris    (Day Out of Time — between Gahen and Akhus, year-end)
//  + Intercalis (Leap Day — between Amarsa and Lotan, every 4th year)
//  Default date: Year 4520 EM, Month 3 (Trelus), Day 28 (Final Solaris)
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── DATA ───────────────────────────────────────────────────────────────────

  var MONTHS = [
    { num:  1, name: 'Akhus',   season: 'Winter (Hiver)'          },
    { num:  2, name: 'Abzutus', season: 'Winter (Hiver)'          },
    { num:  3, name: 'Trelus',  season: 'Winter (Hiver)'          },
    { num:  4, name: 'Sahetru', season: 'Between Winter & Spring'  },
    { num:  5, name: 'Lahman',  season: 'Spring (Len)'            },
    { num:  6, name: 'Lahaman', season: 'Spring (Len)'            },
    { num:  7, name: 'Aeru',    season: 'Between Spring & Summer'  },
    { num:  8, name: 'Thalsa',  season: 'Summer (Sumor)'          },
    { num:  9, name: 'Amarsa',  season: 'Summer (Sumor)'          },
    { num: 10, name: 'Lotan',   season: 'Between Summer & Autumn'  },
    { num: 11, name: 'Basen',   season: 'Autumn (Autumnus)'       },
    { num: 12, name: 'Haden',   season: 'Autumn (Autumnus)'       },
    { num: 13, name: 'Gahen',   season: 'Autumn (Autumnus)'       }
  ];

  var WEEKDAYS = [
    { num: 1, scripture: 'Lunaris',  common: 'Lunis'   },
    { num: 2, scripture: 'Thalaris', common: 'Thalis'  },
    { num: 3, scripture: 'Terranis', common: 'Terris'  },
    { num: 4, scripture: 'Ignaris',  common: 'Ignis'   },
    { num: 5, scripture: 'Ventaris', common: 'Ventris' },
    { num: 6, scripture: 'Aetheris', common: 'Aethris' },
    { num: 7, scripture: 'Solaris',  common: 'Solis'   }
  ];

  // Index 1 (0-based) = Void Wyrm, anchored to year 4520.
  var ZODIAC = [
    { sign: 'Thalassa',  form: 'Sea Seraph'    },
    { sign: 'Abzutarus', form: 'Void Wyrm'     },
    { sign: 'Lotan',     form: 'Storm Hydra'   },
    { sign: 'Lahmu',     form: 'Flow Drake'    },
    { sign: 'Lahamu',    form: 'Ebb Drake'     },
    { sign: 'Hadad',     form: 'Thunder Roc'   },
    { sign: 'Basmu',     form: 'King Viper'    },
    { sign: 'Aerie',     form: 'White Serpent' },
    { sign: 'Gahakan',   form: 'Night Weaver'  },
    { sign: 'Sahet',     form: 'Twin Koi'      },
    { sign: 'Trel',      form: 'Deep Whale'    },
    { sign: 'Akhlys',    form: 'Poison Mist'   },
    { sign: 'Amaru',     form: 'Tide Breaker'  }
  ];

  var DEFAULT_DATE = { year: 4520, month: 3, day: 28, special: null };
  var STORAGE_KEY  = 'matteraCalendarDate';

  // ── HELPERS ────────────────────────────────────────────────────────────────

  function isLeap(y) { return y % 4 === 0; }
  function daysInYear(y) { return 13 * 28 + 1 + (isLeap(y) ? 1 : 0); }

  function getZodiac(year) {
    return ZODIAC[((year - 4519) % 13 + 13) % 13];
  }

  function getWeekday(d) { return WEEKDAYS[(d - 1) % 7]; }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // Week 4 is always labelled "Final".
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

  function advance(date, delta) { return fromAbs(toAbs(date) + delta); }

  // ── DATE INFO ──────────────────────────────────────────────────────────────

  function getInfo(date) {
    var zod = getZodiac(date.year);
    if (date.special === 'intercalis') {
      return { isSpecial: true, specialName: 'Intercalis',
               specialSub: 'The Repair of Time', year: date.year, zodiac: zod };
    }
    if (date.special === 'aenaris') {
      return { isSpecial: true, specialName: 'Aenaris',
               specialSub: 'The Day Out of Time', year: date.year, zodiac: zod };
    }
    var month = MONTHS[date.month - 1];
    var wd    = getWeekday(date.day);
    var occ   = weekOcc(date.day);
    return {
      isSpecial:  false,
      year:       date.year,
      zodiac:     zod,
      season:     month.season,
      monthNum:   date.month,
      monthName:  month.name,
      weekNum:    Math.ceil(date.day / 7),
      weekday:    wd,
      day:        date.day,
      occurrence: occ,
      dayLabel:   occ + ' ' + wd.scripture + ' of ' + month.name + ' (the ' + ordinal(date.day) + ')'
    };
  }

  // ── STORAGE ────────────────────────────────────────────────────────────────

  // Loads last *saved* date from localStorage.
  function loadSaved() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        var p = JSON.parse(s);
        if (typeof p.year === 'number') return p;
      }
    } catch (e) {}
    return { year: DEFAULT_DATE.year, month: DEFAULT_DATE.month,
             day:  DEFAULT_DATE.day,  special: DEFAULT_DATE.special };
  }

  function saveToStorage(d) {
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

    // Header
    setText('calWidgetYear', info.year + ' EM');
    setText('calWidgetSign', 'Year of the ' + zod.form + ' · ' + zod.sign);

    if (info.isSpecial) {
      setText('calWidgetSeason',   info.specialSub);
      setText('calWidgetMonthNum', info.specialName);
      setText('calWidgetMonth',    '');
      setText('calWidgetWeek',     '');
      setText('calWidgetWeekday',  '');
      setText('calWidgetDay',      '');
    } else {
      // Order: season → month (num · name) → week → weekday → day
      setText('calWidgetSeason',   info.season);
      setText('calWidgetMonthNum', 'Month ' + info.monthNum);
      setText('calWidgetMonth',    info.monthName);
      setText('calWidgetWeek',     'Week ' + info.weekNum + ' of 4');
      setText('calWidgetWeekday',  info.occurrence + ' ' + info.weekday.scripture + ' · ' + info.weekday.common);
      setText('calWidgetDay',      'the ' + ordinal(info.day));
    }
  }

  function renderSheetBar(date) {
    var el = document.getElementById('calSheetDisplay');
    if (!el) return;
    var info  = getInfo(date);
    var zod   = info.zodiac;
    el.textContent = info.isSpecial
      ? info.year + ' EM  ·  ' + zod.form + ' Year  ·  ' + info.specialName
      : info.year + ' EM  ·  ' + zod.form + ' Year  ·  ' + info.dayLabel;
  }

  // ── INIT WIDGET ────────────────────────────────────────────────────────────

  function initWidget() {
    var prevBtn = document.getElementById('calPrevDay');
    var nextBtn = document.getElementById('calNextDay');
    var saveBtn = document.getElementById('calSaveDay');
    if (!prevBtn) return;

    // Start from the last saved date; navigation is ephemeral until Save.
    var current = loadSaved();
    renderWidget(current);

    prevBtn.addEventListener('click', function () {
      current = advance(current, -1);
      renderWidget(current);
      renderSheetBar(current);   // update sheet bar live while navigating
    });

    nextBtn.addEventListener('click', function () {
      current = advance(current, +1);
      renderWidget(current);
      renderSheetBar(current);
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        saveToStorage(current);
        // Brief "Saved ✓" flash on the button
        var orig = saveBtn.textContent;
        saveBtn.textContent = 'Saved ✓';
        saveBtn.disabled = true;
        setTimeout(function () {
          saveBtn.textContent = orig;
          saveBtn.disabled = false;
        }, 1200);
      });
    }
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────────

  // Called by the showSheet patch so the bar always reflects the saved date.
  global.renderCalendarOnSheet = function () {
    renderSheetBar(loadSaved());
  };

  // ── BOOT ───────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initWidget();
  });

}(window));
