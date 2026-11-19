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
