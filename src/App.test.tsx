import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "./routes";
import { STORAGE_KEY } from "./lib/settings";
import { playAlert } from "./lib/sound";

vi.mock("./lib/sound", () => ({ playAlert: vi.fn(), primeAudio: vi.fn() }));

function renderApp() {
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  return render(<RouterProvider router={router} />);
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const time = () => screen.getByTestId("time");
const start = () => screen.getByRole("button", { name: "Start" });
const pause = () => screen.getByRole("button", { name: "Pause" });
const reset = () => screen.getByRole("button", { name: "Reset" });
const live = () => screen.getByTestId("live-region");
const field = (name: RegExp) => screen.getByLabelText(name);
const setField = (name: RegExp, value: string) => fireEvent.change(field(name), { target: { value } });

/** Runs the current session to zero (requires 1-minute durations or default). */
function runToEnd(minutes: number) {
  fireEvent.click(start());
  advance(minutes * 60_000 + 500);
}

function useShortSessions(over: Record<string, number> = {}) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ focusMin: 1, shortBreakMin: 1, longBreakMin: 1, longBreakEvery: 4, ...over }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(playAlert).mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("timer control", () => {
  it("AT-001 (REQ-001): shows 25:00 by default", () => {
    renderApp();
    expect(time()).toHaveTextContent("25:00");
  });

  it("AT-002 (REQ-002, REQ-006): Start counts down; Start hidden, Pause offered", () => {
    renderApp();
    fireEvent.click(start());
    advance(3000);
    expect(time()).toHaveTextContent("24:57");
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
    expect(pause()).toBeInTheDocument();
  });

  it("AT-003 (REQ-003, REQ-006): Pause retains the time; Start offered, Pause hidden", () => {
    renderApp();
    fireEvent.click(start());
    advance(3000);
    fireEvent.click(pause());
    advance(10_000);
    expect(time()).toHaveTextContent("24:57");
    expect(start()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    fireEvent.click(start());
    advance(2000);
    expect(time()).toHaveTextContent("24:55");
  });

  it("AT-004 (REQ-004): Reset while running and paused restores full time, idle", () => {
    renderApp();
    fireEvent.click(start());
    advance(5000);
    fireEvent.click(reset());
    expect(time()).toHaveTextContent("25:00");
    expect(start()).toBeInTheDocument();
    advance(5000);
    expect(time()).toHaveTextContent("25:00");

    fireEvent.click(start());
    advance(5000);
    fireEvent.click(pause());
    fireEvent.click(reset());
    expect(time()).toHaveTextContent("25:00");
    expect(start()).toBeInTheDocument();
  });

  it("AT-005 (REQ-005): a 60 s clock jump with no ticks is reflected on the next tick", () => {
    renderApp();
    fireEvent.click(start());
    advance(3000);
    expect(time()).toHaveTextContent("24:57");
    vi.setSystemTime(Date.now() + 60_000); // backgrounded tab: no ticks fired
    advance(250);
    expect(time()).toHaveTextContent("23:57");
  });
});

describe("sessions", () => {
  it("AT-006 (REQ-007, REQ-011): session label always present; completed counter increments", () => {
    useShortSessions();
    renderApp();
    expect(screen.getByText("Focus", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/completed this cycle/)).toHaveTextContent("0 of 4");
    runToEnd(1);
    expect(screen.getByText("Short break", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/completed this cycle/)).toHaveTextContent("1 of 4");
    runToEnd(1); // break
    runToEnd(1); // focus
    expect(screen.getByText(/completed this cycle/)).toHaveTextContent("2 of 4");
  });

  it("AT-007 (REQ-008): Long break after the 4th Focus; Short break before", () => {
    useShortSessions();
    renderApp();
    for (let i = 1; i <= 3; i++) {
      runToEnd(1);
      expect(screen.getByText("Short break", { selector: "strong" })).toBeInTheDocument();
      runToEnd(1);
    }
    runToEnd(1);
    expect(screen.getByText("Long break", { selector: "strong" })).toBeInTheDocument();
  });

  it("AT-007 (REQ-008): with N=2 the 2nd Focus leads to a Long break", () => {
    useShortSessions({ longBreakEvery: 2 });
    renderApp();
    runToEnd(1);
    expect(screen.getByText("Short break", { selector: "strong" })).toBeInTheDocument();
    runToEnd(1);
    runToEnd(1);
    expect(screen.getByText("Long break", { selector: "strong" })).toBeInTheDocument();
  });

  it("AT-008 (REQ-009, REQ-010): break ends -> Focus, idle, no countdown until Start", () => {
    useShortSessions();
    renderApp();
    runToEnd(1); // focus -> short break (idle, no auto start)
    expect(start()).toBeInTheDocument();
    expect(time()).toHaveTextContent("01:00");
    advance(30_000);
    expect(time()).toHaveTextContent("01:00");
    runToEnd(1); // break -> focus
    expect(screen.getByText("Focus", { selector: "strong" })).toBeInTheDocument();
    expect(start()).toBeInTheDocument();
    advance(30_000);
    expect(time()).toHaveTextContent("01:00");
  });

  it("Reset does not change the completed Focus count (spec decision 8)", () => {
    useShortSessions();
    renderApp();
    runToEnd(1);
    runToEnd(1);
    fireEvent.click(start());
    advance(10_000);
    fireEvent.click(reset());
    expect(screen.getByText(/completed this cycle/)).toHaveTextContent("1 of 4");
  });
});

describe("configuration", () => {
  it("AT-009 (REQ-012, REQ-014): changing Focus to 30 while idle shows 30:00", () => {
    renderApp();
    setField(/Focus duration/, "30");
    expect(time()).toHaveTextContent("30:00");
  });

  it.each(["0", "-5", "abc", "2.5", "121", ""])(
    "AT-010 (REQ-013): %j is rejected with an associated error and settings unchanged",
    (bad) => {
      renderApp();
      setField(/Focus duration/, "30");
      setField(/Focus duration/, bad);
      const input = field(/Focus duration/);
      expect(input).toHaveAttribute("aria-invalid", "true");
      const described = input.getAttribute("aria-describedby")!.split(" ");
      const errorText = described.map((id) => document.getElementById(id)?.textContent).join(" ");
      expect(errorText).toMatch(/whole number between 1 and 120/);
      expect(time()).toHaveTextContent("30:00");
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).focusMin).toBe(30);
    },
  );

  it("AT-010 (REQ-013): out-of-range Focus count N is rejected", () => {
    renderApp();
    setField(/before a long break/, "11");
    expect(field(/before a long break/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/completed this cycle/)).toHaveTextContent("0 of 4");
  });

  it("AT-011 (REQ-015): changing Focus while running leaves the countdown; applies next Focus", () => {
    useShortSessions();
    renderApp();
    fireEvent.click(start());
    advance(10_000);
    setField(/^Focus duration/, "30");
    expect(time()).toHaveTextContent("00:50");
    advance(60_000); // ends focus
    runToEnd(1); // short break
    expect(screen.getByText("Focus", { selector: "strong" })).toBeInTheDocument();
    expect(time()).toHaveTextContent("30:00");
  });

  it("AT-012 (REQ-016, REQ-017): saved settings are restored after reload", () => {
    const first = renderApp();
    setField(/Focus duration/, "30");
    setField(/Short break duration/, "7");
    setField(/Long break duration/, "20");
    setField(/before a long break/, "3");
    first.unmount();
    renderApp();
    expect(field(/Focus duration/)).toHaveValue("30");
    expect(field(/Short break duration/)).toHaveValue("7");
    expect(field(/Long break duration/)).toHaveValue("20");
    expect(field(/before a long break/)).toHaveValue("3");
    expect(time()).toHaveTextContent("30:00");
  });

  it.each([
    ["invalid JSON", "{nope"],
    ["out-of-range values", JSON.stringify({ focusMin: 0, shortBreakMin: 500, longBreakMin: 15, longBreakEvery: 4 })],
    ["non-integer values", JSON.stringify({ focusMin: 2.5, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4 })],
    ["wrong shape", JSON.stringify([1, 2, 3])],
  ])("AT-013 (REQ-018): %s falls back to defaults", (_name, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);
    renderApp();
    expect(time()).toHaveTextContent("25:00");
    expect(field(/Focus duration/)).toHaveValue("25");
  });

  it("AT-013 (REQ-018): throwing storage still works with defaults", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    renderApp();
    expect(time()).toHaveTextContent("25:00");
    setField(/Focus duration/, "30");
    expect(time()).toHaveTextContent("30:00");
  });
});

describe("notifications", () => {
  class FakeNotification {
    static permission: NotificationPermission = "default";
    static requestPermission = vi.fn(async () => FakeNotification.permission);
    static instances: { title: string; body?: string }[] = [];
    constructor(title: string, opts?: NotificationOptions) {
      FakeNotification.instances.push({ title, body: opts?.body });
    }
  }
  beforeEach(() => {
    FakeNotification.instances = [];
    FakeNotification.requestPermission.mockClear();
  });

  it("AT-014 (REQ-019, REQ-025): end message names next session in a polite live region, not updated each second", () => {
    useShortSessions();
    renderApp();
    expect(live()).toHaveAttribute("aria-live", "polite");
    expect(live()).toBeEmptyDOMElement();
    fireEvent.click(start());
    const mutations: string[] = [];
    const observer = new MutationObserver(() => mutations.push(live().textContent ?? ""));
    observer.observe(live(), { childList: true, characterData: true, subtree: true });
    advance(30_000);
    expect(mutations.length).toBe(0);
    advance(31_000);
    observer.takeRecords();
    expect(live()).toHaveTextContent("Focus ended. Next: Short break.");
  });

  it("AT-015 (REQ-020, REQ-021): granted -> notification at zero; no request on load", async () => {
    useShortSessions();
    FakeNotification.permission = "granted";
    vi.stubGlobal("Notification", FakeNotification);
    renderApp();
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
    // permission is already granted, so enabling resolves without prompting again
    fireEvent.click(screen.getByRole("checkbox", { name: /system notifications/ }));
    await act(async () => {});
    expect(screen.getByRole("checkbox", { name: /system notifications/ })).toBeChecked();
    runToEnd(1);
    expect(FakeNotification.instances).toHaveLength(1);
    expect(FakeNotification.instances[0].body).toBe("Focus ended. Next: Short break.");
  });

  it("AT-015 (REQ-021): enabling requests permission once from the user action", async () => {
    FakeNotification.permission = "default";
    FakeNotification.requestPermission.mockImplementation(async () => {
      FakeNotification.permission = "granted";
      return "granted";
    });
    vi.stubGlobal("Notification", FakeNotification);
    renderApp();
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: /system notifications/ }));
    await act(async () => {});
    expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("AT-015 (REQ-022): denied -> no throw, in-page message still appears", async () => {
    useShortSessions();
    FakeNotification.permission = "denied";
    vi.stubGlobal("Notification", FakeNotification);
    renderApp();
    fireEvent.click(screen.getByRole("checkbox", { name: /system notifications/ }));
    await act(async () => {});
    expect(screen.getByText(/permission was not granted/)).toBeInTheDocument();
    runToEnd(1);
    expect(FakeNotification.instances).toHaveLength(0);
    expect(live()).toHaveTextContent("Focus ended. Next: Short break.");
  });

  it("AT-015 (REQ-022): unsupported -> no throw, in-page message still appears", async () => {
    useShortSessions();
    // jsdom has no Notification by default
    renderApp();
    fireEvent.click(screen.getByRole("checkbox", { name: /system notifications/ }));
    await act(async () => {});
    expect(screen.getByText(/not supported in this browser/)).toBeInTheDocument();
    runToEnd(1);
    expect(live()).toHaveTextContent("Focus ended. Next: Short break.");
  });
});

describe("sound and title", () => {
  it("AT-016 (REQ-023): sound on plays once at zero", () => {
    useShortSessions();
    renderApp();
    fireEvent.click(screen.getByRole("checkbox", { name: /Play a sound/ }));
    runToEnd(1);
    expect(playAlert).toHaveBeenCalledTimes(1);
    advance(5000);
    expect(playAlert).toHaveBeenCalledTimes(1);
  });

  it("AT-016 (REQ-023): sound off (default) plays nothing", () => {
    useShortSessions();
    renderApp();
    runToEnd(1);
    expect(playAlert).not.toHaveBeenCalled();
  });

  it("AT-019 (REQ-028): title shows time and session type while running", () => {
    renderApp();
    expect(document.title).toBe("Pomodoro");
    fireEvent.click(start());
    advance(3000);
    expect(document.title).toContain("24:57");
    expect(document.title).toContain("Focus");
    fireEvent.click(pause());
    expect(document.title).toBe("Pomodoro");
  });
});

describe("keyboard and labels", () => {
  it("AT-017 (REQ-024, REQ-026): every control is reachable and operable by keyboard with accessible names", async () => {
    vi.useRealTimers(); // user-event's internal delays hang under fake timers
    const user = userEvent.setup();
    renderApp();
    await user.tab();
    expect(start()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(pause()).toBeInTheDocument();
    expect(pause()).toHaveFocus(); // focus stays on the same control
    await user.keyboard(" ");
    expect(start()).toBeInTheDocument();
    await user.tab();
    expect(reset()).toHaveFocus();
    const expected = [
      /Focus duration/,
      /Short break duration/,
      /Long break duration/,
      /before a long break/,
      /system notifications/,
      /Play a sound/,
    ];
    for (const name of expected) {
      await user.tab();
      expect(screen.getByRole(name.source.includes("system") || name.source.includes("sound") ? "checkbox" : "textbox", { name })).toHaveFocus();
    }
    // session type is text, not colour alone
    const timer = screen.getByRole("region", { name: "Timer" });
    expect(within(timer).getByText("Focus", { selector: "strong" })).toBeInTheDocument();
  });
});
