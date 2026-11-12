import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const screenshots = resolve("test-results/ui-v0.4");
test.beforeAll(async () => { await mkdir(screenshots, { recursive: true }); });

test("daily planner is readable on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "แผนเรียนวันนี้" })).toBeVisible();
  await expect(page.getByRole("button", { name: /มาตรฐาน/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#daily-plan .planner-task")).toHaveCount(6);
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await expect(page.locator("#daily-plan .planner-resume")).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "daily-planner-desktop.png"), fullPage: true });
  const desktop = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(desktop.scroll).toBeLessThanOrEqual(desktop.width);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "แผนเรียนวันนี้" })).toBeVisible();
  await expect(page.locator("#daily-plan .planner-task")).toHaveCount(6);
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "daily-planner-mobile.png"), fullPage: true });
  const mobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(mobile.scroll).toBeLessThanOrEqual(mobile.width);

  await page.locator("#daily-plan input[type=date]").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#daily-plan :focus-visible")).toHaveCount(1);
});
