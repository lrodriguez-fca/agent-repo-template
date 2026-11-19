import type { Settings } from "./settings";

export type SessionType = "focus" | "short" | "long";
export type Status = "idle" | "running" | "paused";

export const SESSION_LABEL: Record<SessionType, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

export interface TimerState {
  settings: Settings;
  session: SessionType;
  status: Status;
  /** Remaining ms (authoritative while idle/paused; snapshot while running). */
  remainingMs: number;
  /** Wall-clock ms timestamp when the running countdown hits zero. */
  endAt: number;
  /** Focus sessions completed in the current cycle (REQ-011). */
  completed: number;
  /** Increments each time a session ends; lets the UI react exactly once. */
  endedCount: number;
  /** Session that just ended (for messages), if any. */
  lastEnded: SessionType | null;
}

export type Action =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "reset" }
  | { type: "tick"; now: number }
  | { type: "settings"; settings: Settings };

export function durationMs(session: SessionType, s: Settings): number {
  const min = session === "focus" ? s.focusMin : session === "short" ? s.shortBreakMin : s.longBreakMin;
  return min * 60_000;
}

export function initialState(settings: Settings): TimerState {
  return {
    settings,
    session: "focus",
    status: "idle",
    remainingMs: durationMs("focus", settings),
    endAt: 0,
    completed: 0,
    endedCount: 0,
    lastEnded: null,
  };
}

/** REQ-001: MM:SS, rounding up so 00:00 only shows when finished. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function finishSession(state: TimerState): TimerState {
  const { settings } = state;
  let session: SessionType;
  let completed = state.completed;
  if (state.session === "focus") {
    completed += 1; // REQ-011
    session = completed >= settings.longBreakEvery ? "long" : "short"; // REQ-008
  } else {
    session = "focus"; // REQ-009
    if (state.session === "long") completed = 0; // cycle ends after the long break
  }
  return {
    ...state,
    session,
    completed,
    status: "idle", // REQ-010: never auto-start
    remainingMs: durationMs(session, settings),
    endAt: 0,
    endedCount: state.endedCount + 1,
    lastEnded: state.session,
  };
}

export function reducer(state: TimerState, action: Action): TimerState {
  switch (action.type) {
    case "start":
      if (state.status === "running") return state;
      return { ...state, status: "running", endAt: action.now + state.remainingMs };
    case "pause":
      if (state.status !== "running") return state;
      return { ...state, status: "paused", remainingMs: Math.max(0, state.endAt - action.now), endAt: 0 };
    case "reset":
      return { ...state, status: "idle", endAt: 0, remainingMs: durationMs(state.session, state.settings) };
    case "tick": {
      if (state.status !== "running") return state;
      const remaining = state.endAt - action.now; // REQ-005: derived from wall clock
      if (remaining <= 0) return finishSession(state);
      return remaining === state.remainingMs ? state : { ...state, remainingMs: remaining };
    }
    case "settings": {
      // REQ-014: idle -> apply now. REQ-015: running/paused -> next session only.
      const next = { ...state, settings: action.settings };
      if (state.status === "idle") next.remainingMs = durationMs(state.session, action.settings);
      return next;
    }
  }
}
