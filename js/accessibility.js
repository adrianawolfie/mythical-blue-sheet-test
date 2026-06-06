(() => {
  const STORAGE_KEY = "mythicalBluePageScale";
  const SCALE_LEVELS = [0.9, 1, 1.15, 1.3];
  const DEFAULT_INDEX = 1;

  function getStoredScaleIndex() {
    const storedScale = Number(localStorage.getItem(STORAGE_KEY));
    const index = SCALE_LEVELS.indexOf(storedScale);
    return index >= 0 ? index : DEFAULT_INDEX;
  }

  let currentIndex = getStoredScaleIndex();

  function applyScale() {
    const scale = SCALE_LEVELS[currentIndex];
    document.documentElement.style.setProperty("--app-page-scale", scale);
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

  function changeScale(action) {
    if (action === "decrease") {
      currentIndex = Math.max(0, currentIndex - 1);
    } else if (action === "increase") {
      currentIndex = Math.min(SCALE_LEVELS.length - 1, currentIndex + 1);
    } else {
      currentIndex = DEFAULT_INDEX;
    }

    applyScale();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".accessibility-size-btn").forEach(button => {
      button.addEventListener("click", () => {
        changeScale(button.dataset.sizeAction);
      });
    });

    applyScale();
  });
})();
