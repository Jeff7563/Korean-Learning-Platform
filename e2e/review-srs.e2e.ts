import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const screenshots = resolve("test-results/ui-v0.6");

test("learner reveals, rates, and resumes vocabulary review on desktop and mobile", async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "ทบทวนคำศัพท์" })).toBeVisible();
  await page.locator(".review-tabs").getByRole("button", { name: /คำศัพท์ใหม่/ }).click();
  const card = page.locator(".vocab-card");
  await expect(card.locator(".vocab-korean")).toBeVisible();
  const korean = await card.locator(".vocab-korean").textContent();
  await expect(card.getByText("ลองนึกความหมายด้วยตัวเองก่อน")).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "review-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "เปิดคำแปล" }).click();
  await expect(page.getByRole("button", { name: /จำได้/ })).toBeVisible();
  await expect(card.locator(".vocab-answer")).toBeVisible();
  const newTab = page.getByRole("button", { name: /คำศัพท์ใหม่/ });
  const initialNewCount = Number((await newTab.textContent())?.match(/\((\d+)\)/)?.[1]);
  await page.getByRole("button", { name: /จำได้/ }).click();
  await expect(newTab).toHaveText(new RegExp(`\\(${initialNewCount - 1}\\)`));
  await page.getByRole("button", { name: "ประวัติการทบทวน" }).click();
  await expect(page.locator(".review-history")).toContainText(korean ?? "");
  await page.screenshot({ path: resolve(screenshots, "review-history-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole("button", { name: "ทบทวนทั้งหมด" }).click();
  await expect(page.locator(".vocab-card")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({ path: resolve(screenshots, "review-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "ประวัติการทบทวน" }).click();
  await expect(page.locator(".review-history")).toBeVisible();
});
