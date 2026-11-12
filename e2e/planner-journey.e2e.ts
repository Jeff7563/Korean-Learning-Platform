import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const screenshots = resolve("test-results/ui-v0.4.1");
const journeyDate = "2099-01-05"; // Monday, isolated from the real learner database and other E2E dates.

test.beforeAll(async () => { await mkdir(screenshots, { recursive: true }); });

function shiftDate(date: string, amount: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + amount);
  return shifted.toISOString().slice(0, 10);
}

async function selectPlanDate(page: import("@playwright/test").Page) {
  if (new URL(page.url()).pathname !== "/dashboard") await page.goto("/dashboard");
  const dateInput = page.locator("#daily-plan input[type=date]");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  await expect(dateInput).toBeVisible();
  if (await dateInput.inputValue() !== journeyDate) {
    await expect(dateInput).toHaveValue(today);
    await dateInput.fill(journeyDate);
    await expect(dateInput).toHaveValue(journeyDate);
  }
  await expect(page.locator("#daily-plan .planner-task")).toHaveCount(6);
}

test("daily planner navigation, task persistence, and responsive learning flow", async ({ page, request }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1000 });

  const currentPlan = await (await request.get("/api/daily-plan")).json();
  const expectedToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  expect(currentPlan).toMatchObject({ date: expectedToday, today: expectedToday, isToday: true });

  const previousDate = shiftDate(expectedToday, -1);
  const previousPlan = await (await request.get(`/api/daily-plan?date=${previousDate}`)).json();
  const expectedPreviousActual = previousPlan.actualMinutes + 12;
  expect((await request.post("/api/daily-plan", { data: { action: "task", date: previousDate, taskId: previousPlan.tasks[0].id, completed: true } })).ok()).toBe(true);
  expect((await request.post("/api/daily-plan", { data: { action: "time", date: previousDate, minutes: 12 } })).ok()).toBe(true);
  const updatedToday = await (await request.get("/api/daily-plan")).json();
  expect(updatedToday).toMatchObject({ previous: { date: previousDate, actualMinutes: expectedPreviousActual } });

  await page.goto("/dashboard");
  await expect(page.locator("#daily-plan .planner-previous")).toContainText(`${expectedPreviousActual} นาที`);
  await selectPlanDate(page);
  await expect(page.locator("#daily-plan .planner-duration strong")).toContainText("90");
  await page.screenshot({ path: resolve(screenshots, "dashboard-desktop.png"), fullPage: true });

  const plan = await (await request.get(`/api/daily-plan?date=${journeyDate}`)).json();
  expect(plan.mode).toBe("standard");
  expect(plan.plannedMinutes).toBe(90);
  expect(plan.tasks.map((task: { href: string }) => task.href)).toEqual([
    `/learn/${plan.lesson.slug}#vocabulary`,
    `/learn/${plan.lesson.slug}#video`,
    `/learn/${plan.lesson.slug}#listening`,
    "/dashboard#daily-plan",
    `/learn/${plan.lesson.slug}#lesson-activities`,
    "/review",
  ]);

  const checkpointHref = `/learn/${plan.lesson.slug}#checkpoint`;
  const navigationTargets = [...plan.tasks.map((task: { href: string }) => task.href), checkpointHref];
  for (const href of navigationTargets) {
    await selectPlanDate(page);
    const plannerLink = page.locator(`#daily-plan a[href="${href}"]`).first();
    await expect(plannerLink).toBeVisible();
    await plannerLink.click();
    await page.waitForURL((url) => `${url.pathname}${url.hash}` === href);

    if (href.startsWith("/learn/")) {
      const anchor = href.slice(href.indexOf("#") + 1);
      const target = page.locator(`#${anchor}`);
      await expect(target).toBeVisible();
      await expect.poll(() => target.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      })).toBe(true);
    } else if (href === "/dashboard#daily-plan") {
      await expect(page.locator("#daily-plan")).toBeVisible();
    } else {
      await expect(page.locator("main h1")).toBeVisible();
    }
  }

  await selectPlanDate(page);
  const modeGroup = page.getByRole("group", { name: /เลือกรูปแบบการเรียน/ });
  const standardMode = modeGroup.getByRole("button", { name: /มาตรฐาน/ });
  const lightMode = modeGroup.getByRole("button", { name: /วันเหนื่อย/ });
  await lightMode.click();
  await expect(lightMode).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#daily-plan .planner-duration strong")).toContainText("15");
  await expect(page.locator("#daily-plan .planner-task")).toHaveCount(3);
  await standardMode.click();
  await expect(standardMode).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#daily-plan .planner-duration strong")).toContainText("90");
  await expect(page.locator("#daily-plan .planner-task")).toHaveCount(6);

  const firstTask = page.locator("#daily-plan .planner-task input[type=checkbox]").first();
  const taskUpdate = page.waitForResponse((response) => response.url().endsWith("/api/daily-plan") && response.request().method() === "POST");
  await firstTask.click();
  expect((await taskUpdate).ok()).toBe(true);
  await expect(firstTask).toBeChecked();
  await page.reload();
  await selectPlanDate(page);
  await expect(page.locator("#daily-plan .planner-task input[type=checkbox]").first()).toBeChecked();

  await page.locator("#actual-study-minutes").fill("23");
  await page.getByRole("button", { name: "บันทึกเวลา", exact: true }).click();
  await expect(page.locator("#daily-plan .planner-records > p")).toContainText("23 นาที");
  await expect(page.locator("#daily-plan .planner-records > p")).toContainText("90 นาที");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "dashboard-mobile.png"), fullPage: true });
  const dashboardSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dashboardSize.scroll).toBeLessThanOrEqual(dashboardSize.width);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/courses");
  await expect(page.locator("main h1, .shell h1").first()).toBeVisible();
  await expect(page.locator(".shell section.card").first().locator(".grid > a.card")).toHaveCount(10);
  await page.goto(`/learn/${plan.lesson.slug}`);
  for (const anchor of ["video", "listening", "vocabulary", "lesson-activities", "checkpoint"]) {
    await expect(page.locator(`#${anchor}`)).toBeVisible();
  }
  await page.screenshot({ path: resolve(screenshots, "lesson-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "lesson-mobile.png"), fullPage: true });
  const lessonSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(lessonSize.scroll).toBeLessThanOrEqual(lessonSize.width);
});
