(() => {
  const STORAGE_KEY = 'mythicalBlueThemeMode';
  const DAYLIGHT = 'daylight';
  const MOONLIGHT = 'moonlight';

  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === MOONLIGHT ? MOONLIGHT : DAYLIGHT;
    } catch {
      return DAYLIGHT;
    }
  }

  function setStoredTheme(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }

  function currentTheme() {
    return document.documentElement.dataset.theme === MOONLIGHT ? MOONLIGHT : DAYLIGHT;
  }

  function updateThemeAssets(mode) {
    document.querySelectorAll('[data-daylight-src][data-moonlight-src]').forEach((img) => {
      const desired = mode === MOONLIGHT ? img.dataset.moonlightSrc : img.dataset.daylightSrc;
      if (desired && img.getAttribute('src') !== desired) img.setAttribute('src', desired);
    });
  }

  function updateToggleButtons(mode) {
    const nextMode = mode === MOONLIGHT ? DAYLIGHT : MOONLIGHT;
    const label = nextMode === MOONLIGHT ? 'Moonlight Mode' : 'Daylight Mode';
    const shortLabel = nextMode === MOONLIGHT ? 'Moonlight' : 'Daylight';
    const icon = nextMode === MOONLIGHT ? '☾' : '☀';

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const iconNode = button.querySelector('.theme-toggle-icon');
      const labelNode = button.querySelector('.theme-toggle-label');
      if (iconNode) iconNode.textContent = icon;
      if (labelNode) labelNode.textContent = button.classList.contains('theme-toggle-compact') ? shortLabel : label;
      button.setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
      button.setAttribute('title', `Switch to ${label.toLowerCase()}`);
      button.dataset.nextTheme = nextMode;
    });
  }

  function applyTheme(mode) {
    const normalized = mode === MOONLIGHT ? MOONLIGHT : DAYLIGHT;
    document.documentElement.dataset.theme = normalized;
    updateThemeAssets(normalized);
    updateToggleButtons(normalized);
    setStoredTheme(normalized);
  }

  function toggleTheme() {
    applyTheme(currentTheme() === MOONLIGHT ? DAYLIGHT : MOONLIGHT);
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getStoredTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', toggleTheme);
    });
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) applyTheme(getStoredTheme());
  });
})();
