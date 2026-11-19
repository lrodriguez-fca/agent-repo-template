import { useEffect, useLayoutEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AppliedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pomodoro.theme";
export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function warn(message: string, err?: unknown) {
  if (import.meta.env?.DEV) console.warn(message, err);
}

export function loadThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === null) return "system";
    if (isThemeMode(stored)) return stored;
    warn("Ignoring invalid stored theme mode");
  } catch (err) {
    warn("Could not read stored theme mode", err);
  }
  return "system";
}

function saveThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (err) {
    warn("Could not persist theme mode", err);
  }
}

function systemTheme(): AppliedTheme {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: AppliedTheme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#121212" : "#ffffff");
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode);
  const [system, setSystem] = useState<AppliedTheme>(systemTheme);
  const theme = mode === "system" ? system : mode;

  useEffect(() => {
    let media: MediaQueryList;
    try {
      if (!window.matchMedia) return;
      media = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }

    const update = (event: MediaQueryListEvent) => setSystem(event.matches ? "dark" : "light");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => applyTheme(theme), [theme]);

  function selectMode(next: ThemeMode) {
    setMode(next);
    saveThemeMode(next);
  }

  return { mode, selectMode };
}
