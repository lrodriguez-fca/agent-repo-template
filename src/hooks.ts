import { useCallback, useEffect, useReducer, useRef } from "react";
import { initialState, reducer, type TimerState } from "./lib/timer";
import { loadSettings, saveSettings, type Settings } from "./lib/settings";

const TICK_MS = 250;

export function useTimer() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(loadSettings()));

  // REQ-005: ticks only re-read the wall clock; throttled timers just tick late.
  useEffect(() => {
    if (state.status !== "running") return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    const id = window.setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.status]);

  const start = useCallback(() => dispatch({ type: "start", now: Date.now() }), []);
  const pause = useCallback(() => dispatch({ type: "pause", now: Date.now() }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const applySettings = useCallback((settings: Settings) => {
    saveSettings(settings); // REQ-016
    dispatch({ type: "settings", settings });
  }, []);

  return { state, start, pause, reset, applySettings };
}

/** Fires `onEnd` exactly once per ended session. */
export function useSessionEnd(state: TimerState, onEnd: (s: TimerState) => void) {
  const seen = useRef(state.endedCount);
  const cb = useRef(onEnd);
  useEffect(() => {
    cb.current = onEnd;
  });
  useEffect(() => {
    if (state.endedCount !== seen.current) {
      seen.current = state.endedCount;
      cb.current(state);
    }
  }, [state]);
}
