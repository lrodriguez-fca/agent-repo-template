import { useEffect, useState } from "react";
import { useSessionEnd, useTimer } from "../hooks";
import { SettingsForm } from "../components/SettingsForm";
import { formatTime, SESSION_LABEL } from "../lib/timer";
import { endMessage, notificationsSupported, requestNotificationPermission, showSystemNotification } from "../lib/notify";
import { playAlert, primeAudio } from "../lib/sound";

const BASE_TITLE = "Pomodoro";

export function PomodoroPage() {
  const { state, start, pause, reset, applySettings } = useTimer();
  const [message, setMessage] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);
  const [notifyNote, setNotifyNote] = useState("");

  const running = state.status === "running";
  const time = formatTime(state.remainingMs);

  // REQ-028
  useEffect(() => {
    document.title = running ? `${time} · ${SESSION_LABEL[state.session]} · ${BASE_TITLE}` : BASE_TITLE;
  }, [running, time, state.session]);
  useEffect(() => () => void (document.title = BASE_TITLE), []);

  // REQ-019/020/023: on session end
  useSessionEnd(state, (s) => {
    const text = endMessage(s.lastEnded ?? "focus", s.session);
    setMessage(text);
    if (notifyOn) showSystemNotification("Pomodoro", text);
    if (soundOn) playAlert();
  });

  async function toggleNotifications(checked: boolean) {
    if (!checked) {
      setNotifyOn(false);
      setNotifyNote("");
      return;
    }
    // REQ-021: permission is requested only here, from a user action.
    const result = await requestNotificationPermission();
    if (result === "granted") {
      setNotifyOn(true);
      setNotifyNote("");
    } else {
      // REQ-022
      setNotifyOn(false);
      setNotifyNote(
        result === "unsupported"
          ? "System notifications are not supported in this browser. You will see in-page messages instead."
          : "Notification permission was not granted. You will see in-page messages instead.",
      );
    }
  }

  return (
    <main className="app">
      <h1>Pomodoro</h1>

      <section aria-labelledby="timer-heading" className="timer">
        <h2 id="timer-heading" className="visually-hidden">
          Timer
        </h2>
        <p className={`session session-${state.session}`}>
          <span className="session-icon" aria-hidden="true">
            {state.session === "focus" ? "●" : state.session === "short" ? "◐" : "○"}
          </span>
          <span>
            Session: <strong>{SESSION_LABEL[state.session]}</strong>
          </span>
        </p>
        <p className="time" data-testid="time">
          <span className="visually-hidden">Time remaining: </span>
          {time}
        </p>
        <p className="count">
          Focus sessions completed this cycle: <strong>{state.completed}</strong> of {state.settings.longBreakEvery}
        </p>
        <div className="controls">
          {running ? (
            <button type="button" onClick={pause}>
              Pause
            </button>
          ) : (
            <button type="button" onClick={start}>
              Start
            </button>
          )}
          <button type="button" onClick={reset} className="secondary">
            Reset
          </button>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="message" data-testid="live-region">
          {message}
        </div>
      </section>

      <SettingsForm settings={state.settings} onChange={applySettings} />

      <fieldset className="settings">
        <legend>Alerts</legend>
        <label className="check">
          <input type="checkbox" checked={notifyOn} onChange={(e) => void toggleNotifications(e.target.checked)} />
          <span>Enable system notifications{notificationsSupported() ? "" : " (not supported)"}</span>
        </label>
        {notifyNote && <p className="hint">{notifyNote}</p>}
        <label className="check">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={(e) => {
              setSoundOn(e.target.checked);
              if (e.target.checked) primeAudio();
            }}
          />
          <span>Play a sound when a session ends</span>
        </label>
      </fieldset>
    </main>
  );
}
