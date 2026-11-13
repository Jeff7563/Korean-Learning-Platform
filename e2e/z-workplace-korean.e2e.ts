import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { curriculumModules, type Lesson } from "../src/content/curriculum";

const screenshots = resolve("test-results/ui-v0.9");

async function passLesson(request: APIRequestContext, lesson: Lesson) {
  const lessonResponse = await request.get(`/api/lessons/${lesson.slug}`);
  expect(lessonResponse.ok(), lesson.slug).toBe(true);
  const data = await lessonResponse.json();
  expect(data.exercises).toHaveLength(lesson.questions.length);
  expect(JSON.stringify(data)).not.toMatch(/"(answer|answer_index|answerKey|correctAnswer)"/i);
  const result = await request.post("/api/checkpoints", {
    data: {
      slug: lesson.slug,
      answers: data.exercises.map((exercise: { id: number }, index: number) => ({
        exerciseId: exercise.id,
        selectedIndex: lesson.questions[index].answer,
      })),
    },
  });
  expect(result.ok(), lesson.slug).toBe(true);
  expect(await result.json()).toMatchObject({ passed: true, score: lesson.questions.length });
}

test("completes the workplace learning path and captures desktop/mobile evidence", async ({ page, request }) => {
  await mkdir(screenshots, { recursive: true });
  const lessons = curriculumModules.flatMap((module) => module.lessons);
  const beforeProgress = await (await request.get("/api/courses")).json();
  const initialReview = await (await request.get("/api/review")).json();
  const workplaceCardWasAvailable = initialReview.cards.some((card: { moduleTitle: string }) => card.moduleTitle === "Workplace Korean");
  expect(workplaceCardWasAvailable).toBe(beforeProgress.lessons[30].status !== "locked");

  for (const lesson of lessons.slice(0, 30)) await passLesson(request, lesson);

  const afterGrammar = await (await request.get("/api/courses")).json();
  expect(afterGrammar.lessons[30]).toMatchObject({ slug: "workplace-respectful-greetings", status: "available" });
  const availableReview = await (await request.get("/api/review")).json();
  expect(availableReview.cards.some((card: { moduleTitle: string }) => card.moduleTitle === "Workplace Korean")).toBe(true);
  const planner = await (await request.get("/api/daily-plan?date=2099-11-11")).json();
  expect(planner.lesson).toMatchObject({ slug: "workplace-respectful-greetings", moduleTitle: "Workplace Korean", modulePosition: 4 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/courses");
  const modules = page.locator(".course-module");
  await expect(modules).toHaveCount(5);
  await expect(modules.nth(3).getByRole("heading", { name: "Workplace Korean" })).toBeVisible();
  await expect(modules.nth(3).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(3).locator(".course-lesson-card").first()).toContainText("พร้อมเรียน");
  await expect(modules.nth(4).getByRole("heading", { name: "EPS-TOPIK Preparation" })).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "courses-five-modules.png"), fullPage: true });

  const firstWorkplaceLesson = lessons[30];
  await page.goto(`/learn/${firstWorkplaceLesson.slug}`);
  await expect(page.getByRole("heading", { name: firstWorkplaceLesson.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "บทสนทนาฝึกใช้" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ฟังและฝึกออกเสียง" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ฝึกทีละขั้น" })).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "lesson-31-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "บทสนทนาฝึกใช้" })).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "lesson-31-mobile.png"), fullPage: true });
  const mobileWidth = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(mobileWidth.scroll).toBeLessThanOrEqual(mobileWidth.client);

  for (const lesson of lessons.slice(30, 37)) await passLesson(request, lesson);
  const safetyLesson = lessons[37];
  await page.goto(`/learn/${safetyLesson.slug}`);
  await expect(page.getByRole("heading", { name: safetyLesson.title })).toBeVisible();
  await expect(page.getByText(/ไม่แทนหลักสูตรอบรม/)).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "lesson-38-safety.png"), fullPage: true });

  for (const lesson of lessons.slice(37, 39)) await passLesson(request, lesson);
  const finalLesson = lessons[39];
  const finalLessonResponse = await request.get(`/api/lessons/${finalLesson.slug}`);
  expect(finalLessonResponse.ok()).toBe(true);
  const finalLessonData = await finalLessonResponse.json();
  await page.goto(`/learn/${finalLesson.slug}`);
  for (let index = 0; index < finalLessonData.exercises.length; index += 1) {
    const exercise = finalLessonData.exercises[index] as { id: number };
    await page.locator(`input[name="q${exercise.id}"]`).nth(finalLesson.questions[index].answer).check();
  }
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/checkpoints") && response.request().method() === "POST" && response.status() === 200),
    page.getByRole("button", { name: "ส่งคำตอบ" }).click(),
  ]);
  await expect(page.locator(".checkpoint-result")).toContainText("5/5");
  await page.screenshot({ path: resolve(screenshots, "lesson-40-checkpoint-result.png"), fullPage: true });

  const completed = await (await request.get("/api/courses")).json();
  expect(completed).toMatchObject({ completed: 40, total: 50, percent: 80 });
  expect(completed.modules[3]).toMatchObject({ slug: "workplace-korean", completed: 10, total: 10, percent: 100 });
  await page.goto("/courses");
  await expect(page.getByRole("region", { name: "ความคืบหน้าหลักสูตร" })).toContainText("40 จาก 50 บทเรียน");
  await page.screenshot({ path: resolve(screenshots, "workplace-module-complete.png"), fullPage: true });
});
