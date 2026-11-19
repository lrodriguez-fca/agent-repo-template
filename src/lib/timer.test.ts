import { describe, expect, it } from "vitest";
import { initialState, reducer, formatTime } from "./timer";
import { DEFAULT_SETTINGS, parseSetting } from "./settings";

describe("timer reducer", () => {
  it("REQ-001: formats MM:SS", () => {
    expect(formatTime(25 * 60_000)).toBe("25:00");
    expect(formatTime(59_001)).toBe("01:00");
    expect(formatTime(0)).toBe("00:00");
  });

  it("REQ-005: remaining time derives from wall clock, not tick count", () => {
    let s = reducer(initialState(DEFAULT_SETTINGS), { type: "start", now: 1000 });
    s = reducer(s, { type: "tick", now: 1000 + 600_000 });
    expect(s.remainingMs).toBe(25 * 60_000 - 600_000);
  });

  it("REQ-005: a tick far past the end finishes the session once", () => {
    let s = reducer(initialState(DEFAULT_SETTINGS), { type: "start", now: 0 });
    s = reducer(s, { type: "tick", now: 10 * 3_600_000 });
    expect(s.session).toBe("short");
    expect(s.status).toBe("idle");
    expect(s.endedCount).toBe(1);
  });

  it("REQ-015: settings change while paused does not alter the countdown", () => {
    let s = reducer(initialState(DEFAULT_SETTINGS), { type: "start", now: 0 });
    s = reducer(s, { type: "pause", now: 10_000 });
    const before = s.remainingMs;
    s = reducer(s, { type: "settings", settings: { ...DEFAULT_SETTINGS, focusMin: 50 } });
    expect(s.remainingMs).toBe(before);
  });
});

describe("parseSetting", () => {
  it.each(["0", "-5", "abc", "2.5", "121", "", "1e2"])("REQ-013: rejects %j", (raw) => {
    expect(parseSetting("focusMin", raw)).toHaveProperty("error");
  });
  it("REQ-012: accepts whole numbers in range", () => {
    expect(parseSetting("focusMin", " 30 ")).toEqual({ value: 30 });
    expect(parseSetting("longBreakEvery", "10")).toEqual({ value: 10 });
    expect(parseSetting("longBreakEvery", "11")).toHaveProperty("error");
  });
});
