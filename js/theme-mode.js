(() => {
  const STORAGE_KEY = 'mythicalBlueThemeMode';
  const DAYLIGHT = 'daylight';
  const MOONLIGHT = 'moonlight';
  const THEME_ASSET_ROOTS = ['assets/equipment-icons/', 'assets/spell-icons/'];

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

  function moonlightAssetPath(src = '') {
    if (!src || src.includes('-moonlight.')) return src;
    return src.replace(/(\.[a-z0-9]+)(?:[?#].*)?$/i, '-moonlight$1');
  }

  function daylightAssetPath(src = '') {
    return src.replace(/-moonlight(\.[a-z0-9]+)(?:[?#].*)?$/i, '$1');
  }

  function isThemeIconAsset(src = '') {
    return THEME_ASSET_ROOTS.some(root => src.includes(root));
  }

  function updateImageAsset(img, mode) {
    if (!(img instanceof HTMLImageElement)) return;

    const explicitDaylight = img.dataset.daylightSrc;
    const explicitMoonlight = img.dataset.moonlightSrc;
    const currentSrc = img.getAttribute('src') || '';

    if (explicitDaylight && explicitMoonlight) {
      const desired = mode === MOONLIGHT ? explicitMoonlight : explicitDaylight;
      if (desired && currentSrc !== desired) img.setAttribute('src', desired);
      return;
    }

    if (!isThemeIconAsset(currentSrc)) return;

    const daylight = img.dataset.themeDaylightSrc || daylightAssetPath(currentSrc);
    const moonlight = img.dataset.themeMoonlightSrc || moonlightAssetPath(daylight);
    img.dataset.themeDaylightSrc = daylight;
    img.dataset.themeMoonlightSrc = moonlight;

    const desired = mode === MOONLIGHT ? moonlight : daylight;
    if (desired && currentSrc !== desired) img.setAttribute('src', desired);
  }

  function updateThemeAssets(mode, scope = document) {
    if (scope instanceof HTMLImageElement) updateImageAsset(scope, mode);
    scope.querySelectorAll?.('img').forEach(img => updateImageAsset(img, mode));
  }

  function updateToggleButtons(mode) {
    const isMoonlight = mode === MOONLIGHT;
    const nextMode = isMoonlight ? DAYLIGHT : MOONLIGHT;
    const label = nextMode === MOONLIGHT ? 'Moonlight Mode' : 'Daylight Mode';
    const shortLabel = nextMode === MOONLIGHT ? 'Moonlight' : 'Daylight';
    const icon = isMoonlight ? '☀' : '☾';

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const iconNode = button.querySelector('.theme-toggle-icon');
      const labelNode = button.querySelector('.theme-toggle-label');
      if (iconNode) iconNode.textContent = icon;
      if (labelNode) labelNode.textContent = button.classList.contains('theme-toggle-compact') ? shortLabel : label;
      button.setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
      button.setAttribute('title', `Switch to ${label.toLowerCase()}`);
      button.setAttribute('aria-pressed', isMoonlight ? 'true' : 'false');
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

    const observer = new MutationObserver((mutations) => {
      const mode = currentTheme();
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) updateThemeAssets(mode, node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) applyTheme(getStoredTheme());
  });
})();
