import { useId } from "react";
import { THEME_OPTIONS, type ThemeMode } from "../lib/theme";

interface Props {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export function ThemeControl({ mode, onChange }: Props) {
  const id = useId();

  return (
    <fieldset className="settings theme-picker">
      <legend>Appearance</legend>
      <div className="theme-options">
        {THEME_OPTIONS.map(({ value, label }) => (
          <label className="theme-option" key={value} htmlFor={`${id}-${value}`}>
            <input
              id={`${id}-${value}`}
              type="radio"
              name="theme-mode"
              value={value}
              checked={mode === value}
              onChange={() => onChange(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
