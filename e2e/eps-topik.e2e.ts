import { expect, test } from "@playwright/test";

test("EPS-TOPIK sources, resumable exam, result and responsive screenshots", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto("/eps-topik");
  await expect(page.getByRole("heading", { name: "ฝึกข้อสอบเกาหลีเพื่อการทำงาน" })).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7.1/home-desktop.png", fullPage: true });
  await page.goto("/eps-topik/sources");
  await expect(page.getByRole("heading", { name: "แหล่งเรียนรู้ทางการ" })).toBeVisible();
  await expect(page.getByText("แหล่งข้อมูลภายนอก").first()).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7.1/sources-desktop.png", fullPage: true });

  await page.goto("/eps-topik/exams");
  await expect(page.getByText("EPS-TOPIK 원본 모의고사 A · V0.7.1")).toBeVisible();
  await expect(page.getByText("แบบจำลองแนวข้อสอบรูปแบบเดิม")).toHaveCount(0);
  await page.getByRole("link", { name: "เริ่มหรือทำต่อ" }).first().click();
  await expect(page.getByRole("heading", { name: /ข้อ 1 \/ 20/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("progressbar", { name: "Question progress" })).toHaveAttribute("aria-valuenow", "5");
  await expect(page).toHaveURL(/attemptId=/);
  const publicAttempt = await page.request.get(`/api/eps-topik/attempts/${new URL(page.url()).searchParams.get("attemptId")}`);
  expect(await publicAttempt.json()).not.toHaveProperty("answerIndex");
  await page.getByRole("button", { name: "ไปข้อ 1", exact: true }).click();
  await page.getByLabel(/^A\./).first().check();
  await page.reload();
  await expect(page.getByLabel(/^A\./).first()).toBeChecked();
  await page.screenshot({ path: "test-results/ui-v0.7.1/exam-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/ui-v0.7.1/exam-mobile.png", fullPage: true });
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
  await expect(page.getByRole("heading", { name: "กลับไปทบทวนทักษะที่ยังพลาด" })).toBeVisible();
  await expect(page.getByText("บทนี้เปิดหลังผ่าน 40 บทแรก").first()).toBeVisible();
  const resultUrl = page.url();
  await page.screenshot({ path: "test-results/ui-v0.7.1/result-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/eps-topik");
  await page.screenshot({ path: "test-results/ui-v0.7.1/home-mobile.png", fullPage: true });
  await page.goto("/eps-topik/sources");
  await expect(page.getByText("แหล่งข้อมูลภายนอก").first()).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7.1/sources-mobile.png", fullPage: true });
  await page.goto(resultUrl);
  await expect(page.getByText("คะแนนฝึกเพื่อดูจุดที่ควรทบทวน")).toBeVisible();
  await page.screenshot({ path: "test-results/ui-v0.7.1/result-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

