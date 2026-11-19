import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [320, 1280]) {
  test(`AT-018 (REQ-027): no horizontal scroll and 44x44 targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);

    const small = await page.evaluate(() => {
      const els = document.querySelectorAll<HTMLElement>("button, input");
      return [...els]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { name: el.id || el.textContent, w: r.width, h: r.height };
        })
        .filter((r) => r.w < 44 || r.h < 44);
    });
    expect(small).toEqual([]);
  });
}

test("AT-017 (REQ-024, REQ-026): axe (incl. contrast) finds no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("AT-017 (REQ-024): keyboard operation shows a visible focus indicator", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const start = page.getByRole("button", { name: "Start" });
  await expect(start).toBeFocused();
  const outline = await start.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Pause" })).toBeFocused();
  await expect(page).toHaveTitle(/Focus/);
});

test("AT-007 (REQ-009): a persisted Dark theme is applied before the first animation frame", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pomodoro.theme", "dark");
    requestAnimationFrame(() => {
      window.name = document.documentElement.dataset.theme ?? "missing";
    });
  });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => window.name)).toBe("dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#121212");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
});

test("AT-005 (REQ-006, REQ-007): a selected mode persists after a real reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Dark" }).check();
  await page.reload();
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("AT-010 (REQ-013): both themes meet WCAG 2.2 AA at mobile and desktop widths", async ({ page }) => {
  await page.clock.install();
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const [label, theme] of [
      ["Light", "light"],
      ["Dark", "dark"],
    ]) {
      await page.goto("/");
      await page.getByRole("radio", { name: label }).check();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);

      await page.getByLabel(/Focus duration/).fill("0");
      const errorResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(errorResults.violations).toEqual([]);

      await page.getByLabel(/Focus duration/).fill("1");
      await page.getByRole("button", { name: "Start" }).click();
      await page.clock.fastForward(60_000);
      await page.clock.runFor(500);
      await expect(page.getByTestId("live-region")).toContainText("Focus ended. Next: Short break.");
      const endResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(endResults.violations).toEqual([]);
    }
  }
});

test("AT-012 (REQ-016, REQ-017): settings survive a real reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/Focus duration/).fill("30");
  await page.reload();
  await expect(page.getByLabel(/Focus duration/)).toHaveValue("30");
  await expect(page.getByTestId("time")).toContainText("30:00");
});

test("REQ-005: countdown follows wall clock in a real browser", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward(60_000); // jumps the clock without firing every tick
  await page.clock.runFor(500);
  await expect(page.getByTestId("time")).toContainText(/(23:5\d|24:00)/);
});
