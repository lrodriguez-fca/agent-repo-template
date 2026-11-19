import { useId, useState } from "react";
import { parseSetting, RANGES, type SettingKey, type Settings } from "../lib/settings";

const FIELDS: { key: SettingKey; label: string }[] = [
  { key: "focusMin", label: "Focus duration (minutes)" },
  { key: "shortBreakMin", label: "Short break duration (minutes)" },
  { key: "longBreakMin", label: "Long break duration (minutes)" },
  { key: "longBreakEvery", label: "Focus sessions before a long break" },
];

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
}

/**
 * REQ-012/013: each valid edit is applied and persisted; an invalid edit shows
 * an associated error and leaves the previous valid value in effect.
 */
export function SettingsForm({ settings, onChange }: Props) {
  const baseId = useId();
  const [drafts, setDrafts] = useState<Record<SettingKey, string>>(() => ({
    focusMin: String(settings.focusMin),
    shortBreakMin: String(settings.shortBreakMin),
    longBreakMin: String(settings.longBreakMin),
    longBreakEvery: String(settings.longBreakEvery),
  }));
  const [errors, setErrors] = useState<Partial<Record<SettingKey, string>>>({});

  function handle(key: SettingKey, raw: string) {
    setDrafts((d) => ({ ...d, [key]: raw }));
    const result = parseSetting(key, raw);
    if ("error" in result) {
      setErrors((e) => ({ ...e, [key]: result.error }));
      return;
    }
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (result.value !== settings[key]) onChange({ ...settings, [key]: result.value });
  }

  function restore(key: SettingKey) {
    if (errors[key]) {
      setDrafts((d) => ({ ...d, [key]: String(settings[key]) }));
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  return (
    <fieldset className="settings">
      <legend>Settings</legend>
      {FIELDS.map(({ key, label }) => {
        const id = `${baseId}-${key}`;
        const errId = `${id}-error`;
        const { min, max } = RANGES[key];
        return (
          <div className="field" key={key}>
            <label htmlFor={id}>{label}</label>
            <input
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={drafts[key]}
              aria-invalid={errors[key] ? true : undefined}
              aria-describedby={`${id}-hint${errors[key] ? ` ${errId}` : ""}`}
              onChange={(e) => handle(key, e.target.value)}
              onBlur={() => restore(key)}
            />
            <span id={`${id}-hint`} className="hint">
              {min}–{max}
            </span>
            {errors[key] && (
              <span id={errId} className="error">
                {errors[key]}
              </span>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
