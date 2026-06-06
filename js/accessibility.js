(() => {
  const STORAGE_KEY = "mythicalBlueFontScaleV2";
  const LEGACY_STORAGE_KEYS = [
    "mythicalBlueFontScale",
    "mythicalBluePageScale"
  ];

  const FONT_SCALE_LEVELS = [0.9, 1, 1.1, 1.2, 1.3];
  const DEFAULT_INDEX = 1;
  const BASE_ROOT_FONT_SIZE = 16;

  const scalableRules = [];
  let currentIndex = getStoredScaleIndex();

  function getStoredScaleIndex() {
    const storedScale = Number(localStorage.getItem(STORAGE_KEY));
    const index = FONT_SCALE_LEVELS.indexOf(storedScale);
    return index >= 0 ? index : DEFAULT_INDEX;
  }

  function clearLegacyScaling() {
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

    document.documentElement.style.removeProperty("--app-font-scale");
    document.documentElement.style.removeProperty("--app-page-scale");
    document.body?.style.removeProperty("zoom");
  }

  function collectScalableRules() {
    scalableRules.length = 0;

    Array.from(document.styleSheets).forEach(styleSheet => {
      const href = styleSheet.href || "";

      // Scale only the main app stylesheet.
      // The toolbar-control styling stays a stable size.
      if (!href.includes("/css/styles.css")) return;

      let rules;

      try {
        rules = styleSheet.cssRules;
      } catch {
        return;
      }

      collectFromRuleList(rules);
    });
  }

  function collectFromRuleList(rules) {
    Array.from(rules || []).forEach(rule => {
      if (rule.cssRules) {
        collectFromRuleList(rule.cssRules);
      }

      const fontSize = rule.style?.fontSize || "";
      const match = fontSize.match(/^([0-9]*\.?[0-9]+)px$/);

      if (!match) return;

      scalableRules.push({
        rule,
        originalPixels: Number(match[1])
      });
    });
  }

  function applyFontScale() {
    const scale = FONT_SCALE_LEVELS[currentIndex];

    // Scale inherited/default text and rem-based text.
    // Dimensions, padding, images and parchment are unchanged.
    document.documentElement.style.fontSize =
      `${BASE_ROOT_FONT_SIZE * scale}px`;

    scalableRules.forEach(({ rule, originalPixels }) => {
      rule.style.fontSize = `${originalPixels * scale}px`;
    });

    localStorage.setItem(STORAGE_KEY, String(scale));

    document.querySelectorAll(".accessibility-size-btn").forEach(button => {
      button.setAttribute(
        "aria-pressed",
        button.dataset.sizeAction === "reset" && scale === 1
          ? "true"
          : "false"
      );
    });
  }

  function changeFontScale(action) {
    if (action === "decrease") {
      currentIndex = Math.max(0, currentIndex - 1);
    } else if (action === "increase") {
      currentIndex = Math.min(FONT_SCALE_LEVELS.length - 1, currentIndex + 1);
    } else {
      currentIndex = DEFAULT_INDEX;
    }

    applyFontScale();
  }

  document.addEventListener("DOMContentLoaded", () => {
    clearLegacyScaling();
    collectScalableRules();

    document.querySelectorAll(".accessibility-size-btn").forEach(button => {
      button.addEventListener("click", () => {
        changeFontScale(button.dataset.sizeAction);
      });
    });

    applyFontScale();
  });
})();
