import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const shots = resolve("test-results/ui-v0.2");
test.beforeAll(async () => { await mkdir(shots, { recursive: true }); });

test("dashboard and lesson player fit desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ยินดีต้อนรับกลับมา" })).toBeVisible();
  await expect(page.getByRole("link", { name: /เรียนต่อ/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "เส้นทางการเรียน" })).toBeVisible();
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await page.screenshot({ path: resolve(shots, "dashboard-desktop.png"), fullPage: true });

  await page.goto("/learn/hangul-intro");
  await expect(page.locator(".video-stage iframe")).toBeVisible();
  await expect(page.getByRole("heading", { name: "แบบทดสอบท้ายบท" })).toBeVisible();
  await page.screenshot({ path: resolve(shots, "lesson-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
  await expect(page.getByRole("link", { name: "หลักสูตร", exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(shots, "dashboard-mobile.png"), fullPage: true });
  const dashboardSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dashboardSize.scroll).toBeLessThanOrEqual(dashboardSize.width);

  await page.goto("/learn/hangul-intro");
  await expect(page.locator(".video-stage")).toBeVisible();
  await page.screenshot({ path: resolve(shots, "lesson-mobile.png"), fullPage: true });
  const lessonSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(lessonSize.scroll).toBeLessThanOrEqual(lessonSize.width);
});