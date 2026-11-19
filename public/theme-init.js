/* global window, document */

(() => {
  const key = "pomodoro.theme";
  let mode = "system";

  try {
    const stored = window.localStorage.getItem(key);
    if (stored === "light" || stored === "dark" || stored === "system") mode = stored;
  } catch {
    // Keep the system default when storage is unavailable.
  }

  let theme = mode === "dark" ? "dark" : "light";
  if (mode === "system") {
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
    } catch {
      // Keep the light fallback when the preference cannot be read.
    }
  }

  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#121212" : "#ffffff");
})();
