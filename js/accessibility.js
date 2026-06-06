(() => {
  const STORAGE_KEY = "mythicalBlueFontScale";
  const FONT_SCALE_LEVELS = [0.9, 1, 1.1, 1.2, 1.3];
  const DEFAULT_INDEX = 1;
  const BASE_ROOT_FONT_SIZE = 16;

  let currentIndex = getStoredScaleIndex();
  const scaledRules = [];

  function getStoredScaleIndex() {
    const storedScale = Number(localStorage.getItem(STORAGE_KEY));
    const index = FONT_SCALE_LEVELS.indexOf(storedScale);
    return index >= 0 ? index : DEFAULT_INDEX;
  }

  function collectScalableRules() {
    scaledRules.length = 0;

    Array.from(document.styleSheets).forEach(styleSheet => {
      const href = styleSheet.href || "";

      // Scale the main application stylesheet only.
      // Keep the accessibility controls themselves at a stable size.
      if (!href.endsWith("/css/styles.css")) return;

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

      scaledRules.push({
        rule,
        originalPixels: Number(match[1])
      });
    });
  }

  function applyFontScale() {
    const scale = FONT_SCALE_LEVELS[currentIndex];

    // Scale inherited/default text and rem-based text.
    document.documentElement.style.fontSize =
      `${BASE_ROOT_FONT_SIZE * scale}px`;

    // Scale the explicit px font sizes in the app stylesheet.
    scaledRules.forEach(({ rule, originalPixels }) => {
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

  window.addEventListener("DOMContentLoaded", () => {
    collectScalableRules();

    document.querySelectorAll(".accessibility-size-btn").forEach(button => {
      button.addEventListener("click", () => {
        changeFontScale(button.dataset.sizeAction);
      });
    });

    applyFontScale();
  });
})();
