import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const shots = resolve("test-results/ui-v0.3a");
test.beforeAll(async () => { await mkdir(shots, { recursive: true }); });

test("dashboard and lesson player fit desktop and mobile", async ({ page }) => {
  await page.route("**/api/settings", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ settings: {}, progress: { completed: 0, total: 10, percent: 0 }, aiReady: false }) }));
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [], addEventListener: () => {}, removeEventListener: () => {}, cancel: () => {}, speak: () => {} } });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ยินดีต้อนรับกลับมา" })).toBeVisible();
  await expect(page.getByRole("link", { name: /เรียนต่อ/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "เส้นทางการเรียน" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "กิจกรรมฝึกของบทเรียนถัดไป" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "เช็กลิสต์การเรียนวันนี้" })).toHaveCount(0);
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await page.screenshot({ path: resolve(shots, "dashboard-desktop.png"), fullPage: true });

  await page.goto("/learn/hangul-intro");
  await expect(page.locator(".media-frame iframe")).toBeVisible();
  await expect(page.getByText(/AI Tutor ยังไม่เปิดใช้งาน/)).toBeVisible();
  await expect(page.locator("#tutor-question")).toHaveCount(0);
  await expect(page.getByText("KHEM KOREA").first()).toBeVisible();
  await expect(page.locator(".media-attribution a")).toHaveAttribute("href", "https://www.youtube.com/watch?v=hVnDpNqWwDc");
  await expect(page.getByText(/เบราว์เซอร์นี้ยังไม่มีเสียงภาษาเกาหลีพร้อมใช้/)).toBeVisible();
  await expect(page.getByRole("button", { name: /ฟังเสียงสังเคราะห์/ }).first()).toBeDisabled();
  const articleResource = page.getByRole("button", { name: /เอกสาร\/แหล่งข้อมูล.*สระพื้นฐาน I/ });
  await articleResource.click();
  await expect(page.getByText("เอกสารและแหล่งเรียนรู้ภายนอก")).toBeVisible();
  await expect(page.getByRole("link", { name: /เปิดเอกสารต้นฉบับ/ })).toHaveAttribute("href", "https://hangul.openblog.com/th/lesson/hangul-vowels-1");
  await page.getByRole("button", { name: /วิดีโอ.*KHEM KOREA/ }).click();
  await expect(page.getByRole("heading", { name: "แบบทดสอบท้ายบท" })).toBeVisible();
  const videoRatio = await page.locator(".media-frame").evaluate((element) => { const rect = element.getBoundingClientRect(); return rect.width / rect.height; });
  expect(videoRatio).toBeGreaterThan(1.7);
  expect(videoRatio).toBeLessThan(1.85);
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
  await expect(page.locator(".media-frame")).toBeVisible();
  await page.screenshot({ path: resolve(shots, "lesson-mobile.png"), fullPage: true });
  const lessonSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(lessonSize.scroll).toBeLessThanOrEqual(lessonSize.width);

  await page.goto("/settings");
  await expect(page.getByText("AI Tutor ยังไม่เปิดใช้งาน — จะตั้งค่าภายหลัง")).toBeVisible();
});
