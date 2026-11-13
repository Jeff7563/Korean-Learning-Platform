import { expect, test, type APIRequestContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { curriculumModules, type Lesson } from "../src/content/curriculum";

const screenshots = resolve("test-results/ui-v1.0");

async function passLesson(request: APIRequestContext, lesson: Lesson) {
  const response = await request.get(`/api/lessons/${lesson.slug}`);
  expect(response.ok(), lesson.slug).toBe(true);
  const data = await response.json();
  expect(data.exercises).toHaveLength(5);
  expect(JSON.stringify(data)).not.toMatch(/"(answer|answer_index|answerKey|correctAnswer)"/i);
  const result = await request.post("/api/checkpoints", { data: {
    slug: lesson.slug,
    answers: data.exercises.map((exercise: { id: number }, index: number) => ({ exerciseId: exercise.id, selectedIndex: lesson.questions[index].answer })),
  } });
  expect(result.ok(), lesson.slug).toBe(true);
  expect(await result.json()).toMatchObject({ passed: true, score: 5, total: 5 });
}

test("opens EPS preparation after lesson 40, links practice, and completes the fifth module", async ({ page, request }) => {
  test.setTimeout(180_000);
  await mkdir(screenshots, { recursive: true });
  const lessons = curriculumModules[4].lessons;
  const before = await (await request.get("/api/courses")).json();
  expect(before).toMatchObject({ completed: 40, total: 50, percent: 80 });
  expect(before.lessons[40]).toMatchObject({ slug: "eps-exam-structure-strategy", status: "available" });
  expect(before.lessons[41].status).toBe("locked");
  const planner = await (await request.get("/api/daily-plan?date=2099-11-12")).json();
  expect(planner.lesson).toMatchObject({ slug: "eps-exam-structure-strategy", moduleTitle: "EPS-TOPIK Preparation", modulePosition: 5 });
  expect(planner.recommendationHref).toBe("/learn/eps-exam-structure-strategy#lesson-activities");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/courses");
  const modules = page.locator(".course-module");
  await expect(modules).toHaveCount(5);
  await expect(modules.nth(4).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(4).getByRole("heading", { name: "EPS-TOPIK Preparation" })).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "courses-five-modules.png"), fullPage: true });

  const firstResponse = await page.goto(`/learn/${lessons[0].slug}`);
  expect(firstResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: lessons[0].title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ฝึกต่อใน EPS-TOPIK Practice" })).toBeVisible();
  const practiceLink = page.getByRole("link", { name: "ฝึกการอ่าน" });
  await expect(practiceLink).toHaveAttribute("href", "/eps-topik/practice?mode=reading");
  await page.screenshot({ path: resolve(screenshots, "lesson-41-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "lesson-41-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await practiceLink.click();
  await expect(page).toHaveURL(/\/eps-topik\/practice\?mode=reading$/);
  await expect(page.getByRole("radio", { name: "การอ่าน" })).toBeChecked();
  await page.screenshot({ path: resolve(screenshots, "preparation-to-reading-practice.png"), fullPage: true });

  expect((await request.get(`/api/lessons/${lessons[1].slug}`)).status()).toBe(403);
  await passLesson(request, lessons[0]);
  await page.goto(`/learn/${lessons[1].slug}`);
  await expect(page.getByRole("heading", { name: lessons[1].title })).toBeVisible();
  await expect(page.getByText(/ข้อความแต่งขึ้นเพื่อฝึก/)).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(screenshots, "lesson-42-reading.png"), fullPage: true });

  for (const lesson of lessons.slice(1, 6)) await passLesson(request, lesson);
  const listeningPage = await page.goto(`/learn/${lessons[6].slug}`);
  expect(listeningPage?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: lessons[6].title })).toBeVisible();
  await expect(page.locator("#listening")).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "lesson-47-listening.png"), fullPage: true });
  for (const lesson of lessons.slice(6)) await passLesson(request, lesson);

  const completed = await (await request.get("/api/courses")).json();
  expect(completed).toMatchObject({ completed: 50, total: 50, percent: 100 });
  expect(completed.modules[4]).toMatchObject({ slug: "eps-topik-preparation", completed: 10, total: 10, percent: 100 });
  await page.goto("/courses");
  await expect(page.locator(".course-overview")).toContainText("50 จาก 50 บทเรียน");
});
