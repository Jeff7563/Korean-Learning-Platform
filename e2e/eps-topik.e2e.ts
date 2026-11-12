import { expect, test } from "@playwright/test";

test("EPS-TOPIK sources, resumable exam, result and responsive screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto("/eps-topik");
  await expect(page.getByRole("heading", { name: "ฝึกข้อสอบเกาหลีเพื่อการทำงาน" })).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7/home-desktop.png", fullPage: true });
  await page.goto("/eps-topik/sources");
  await expect(page.getByRole("heading", { name: "แหล่งเรียนรู้ทางการ" })).toBeVisible();
  await expect(page.getByText("แหล่งข้อมูลภายนอก").first()).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7/sources-desktop.png", fullPage: true });

  await page.goto("/eps-topik/exams");
  await expect(page.getByText("แบบจำลองแนวข้อสอบรูปแบบเดิม")).toBeVisible();
  await page.getByRole("link", { name: "เริ่มหรือทำต่อ" }).first().click();
  await expect(page.getByRole("heading", { name: /ข้อ 1 \/ 20/ })).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/attemptId=/);
  await page.getByRole("button", { name: "ไปข้อ 1", exact: true }).click();
  await page.getByLabel(/^A\./).first().check();
  await page.reload();
  await expect(page.getByLabel(/^A\./).first()).toBeChecked();
  await page.screenshot({ path: "test-results/ui-v0.7/exam-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/ui-v0.7/exam-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.getByRole("button", { name: "ไปส่วนฟัง (25 นาที)" }).click();
  await expect(page.getByRole("heading", { name: /การฟัง · ข้อ 1 \/ 20/ })).toBeVisible();
  await page.getByRole("button", { name: "แสดงบทพูด" }).click();
  await expect(page.locator('[lang="ko"]')).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /การฟัง · ข้อ 1 \/ 20/ })).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ส่งคำตอบ" }).click();
  await expect(page).toHaveURL(/\/eps-topik\/results\//, { timeout: 30000 });
  await expect(page.getByText("คะแนนฝึกเพื่อดูจุดที่ควรทบทวน")).toBeVisible();
  const resultUrl = page.url();
  await page.screenshot({ path: "test-results/ui-v0.7/result-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/eps-topik");
  await page.screenshot({ path: "test-results/ui-v0.7/home-mobile.png", fullPage: true });
  await page.goto("/eps-topik/sources");
  await expect(page.getByText("แหล่งข้อมูลภายนอก").first()).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7/sources-mobile.png", fullPage: true });
  await page.goto(resultUrl);
  await expect(page.getByText("คะแนนฝึกเพื่อดูจุดที่ควรทบทวน")).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7/result-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

