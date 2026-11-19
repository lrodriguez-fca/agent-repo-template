export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  /** Number of completed Focus sessions before a Long break (N). */
  longBreakEvery: number;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
};

export const RANGES: Record<SettingKey, { min: number; max: number }> = {
  focusMin: { min: 1, max: 120 },
  shortBreakMin: { min: 1, max: 120 },
  longBreakMin: { min: 1, max: 120 },
  longBreakEvery: { min: 1, max: 10 },
};

export const STORAGE_KEY = "pomodoro.settings.v1";

/** REQ-013: returns the integer, or an error message for the field. */
export function parseSetting(key: SettingKey, raw: string): { value: number } | { error: string } {
  const { min, max } = RANGES[key];
  const text = raw.trim();
  if (!/^-?\d+$/.test(text)) {
    return { error: `Enter a whole number between ${min} and ${max}.` };
  }
  const value = Number(text);
  if (value < min || value > max) {
    return { error: `Enter a whole number between ${min} and ${max}.` };
  }
  return { value };
}

function isValidValue(key: SettingKey, v: unknown): v is number {
  const { min, max } = RANGES[key];
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/** Validates untrusted data; returns null unless every field is valid. */
export function validateSettings(data: unknown): Settings | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    const v = record[key];
    if (!isValidValue(key, v)) return null;
    out[key] = v;
  }
  return out;
}

function warn(message: string, err?: unknown) {
  if (import.meta.env?.DEV) console.warn(message, err);
}

/** REQ-017/018: never throws; falls back to defaults. */
export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    const parsed = validateSettings(JSON.parse(raw));
    if (!parsed) {
      warn("Ignoring invalid stored settings");
      return { ...DEFAULT_SETTINGS };
    }
    return parsed;
  } catch (err) {
    warn("Could not read stored settings", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/** REQ-016: returns false when storage is unavailable. */
export function saveSettings(settings: Settings): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    warn("Could not persist settings", err);
    return false;
  }
}
