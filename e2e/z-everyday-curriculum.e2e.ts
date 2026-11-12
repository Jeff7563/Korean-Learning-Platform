import { expect, test, type APIRequestContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { curriculumModules } from "../src/content/curriculum";

const screenshots = resolve(process.cwd(), "test-results", "ui-v0.5");

async function passLesson(request: APIRequestContext, lesson: (typeof curriculumModules)[number]["lessons"][number]) {
  const response = await request.get(`/api/lessons/${lesson.slug}`);
  expect(response.ok(), lesson.slug).toBeTruthy();
  const data = await response.json();
  expect(data.exercises).toHaveLength(lesson.questions.length);
  const result = await request.post("/api/checkpoints", {
    data: {
      slug: lesson.slug,
      answers: data.exercises.map((exercise: { id: number }, index: number) => ({ exerciseId: exercise.id, selectedIndex: lesson.questions[index].answer })),
    },
  });
  expect(result.ok(), lesson.slug).toBeTruthy();
  expect((await result.json()).passed, lesson.slug).toBe(true);
}

test("Everyday Korean unlocks after Hangul and completes as a second module", async ({ page, request }) => {
  mkdirSync(screenshots, { recursive: true });
  page.setDefaultTimeout(12_000);

  const coursesResponse = await page.goto("/courses");
  expect(coursesResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Hangul Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everyday Korean" })).toBeVisible();
  await expect(page.locator(".course-module").nth(0).locator(".course-lesson-card")).toHaveCount(10);
  await expect(page.locator(".course-module").nth(1).locator(".course-lesson-card")).toHaveCount(10);
  await expect(page.locator('.course-lesson-card[href="#"]').first()).toContainText("ล็อก");
  expect((await request.get("/api/lessons/everyday-greetings")).status()).toBe(403);
  await page.screenshot({ path: resolve(screenshots, "courses-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "courses-mobile.png"), fullPage: true });
  const coursesMobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(coursesMobile.scroll).toBeLessThanOrEqual(coursesMobile.width);

  for (const lesson of curriculumModules[0].lessons) await passLesson(request, lesson);
  const afterHangul = await (await request.get("/api/courses")).json();
  expect(afterHangul.modules[0]).toMatchObject({ completed: 10, total: 10, percent: 100 });
  expect(afterHangul.modules[1].lessons[0].status).toBe("available");
  expect(afterHangul.modules[1].lessons[1].status).toBe("locked");
  expect((await request.get("/api/lessons/everyday-introduction")).status()).toBe(403);
  const publicLesson = await (await request.get("/api/lessons/everyday-greetings")).json();
  expect(JSON.stringify(publicLesson)).not.toMatch(/"(answer|answer_index|answerKey|correctAnswer)"/i);
  expect(publicLesson.exercises.every((exercise: { answer?: unknown; answer_index?: unknown }) => exercise.answer === undefined && exercise.answer_index === undefined)).toBe(true);

  const plannerDate = "2099-11-09";
  const plan = await (await request.get(`/api/daily-plan?date=${plannerDate}`)).json();
  expect(plan.lesson).toMatchObject({ slug: "everyday-greetings", moduleTitle: "Everyday Korean", modulePosition: 2 });
  expect(plan.recommendationHref).toBe("/learn/everyday-greetings#lesson-activities");

  const firstLessonResponse = await page.goto("/learn/everyday-greetings");
  expect(firstLessonResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "ทักทายและใช้คำสุภาพ" })).toBeVisible();
  await expect(page.locator(".player-phase")).toContainText("Everyday Korean");
  await expect(page.locator("#video .media-fallback")).toContainText("ทักทาย");
  await expect(page.locator("#video .media-attribution")).toContainText("K-MOOC / Thai MOOC");
  await expect(page.locator("#listening .listening-item")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "บทก่อนหน้า: ทบทวนพื้นฐานฮันกึล" })).toHaveAttribute("href", "/learn/hangul-review");
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.screenshot({ path: resolve(screenshots, "everyday-lesson-desktop.png"), fullPage: true });
  await page.locator("#checkpoint").scrollIntoViewIfNeeded();
  await page.locator("#checkpoint").screenshot({ path: resolve(screenshots, "everyday-checkpoint-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "everyday-lesson-mobile.png"), fullPage: true });
  await page.locator("#checkpoint").scrollIntoViewIfNeeded();
  await page.locator("#checkpoint").screenshot({ path: resolve(screenshots, "everyday-checkpoint-mobile.png") });
  const mobileSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(mobileSize.scroll).toBeLessThanOrEqual(mobileSize.width);

  for (const lesson of curriculumModules[1].lessons) await passLesson(request, lesson);
  const complete = await (await request.get("/api/courses")).json();
  expect(complete).toMatchObject({ completed: 20, total: 20, percent: 100 });
  expect(complete.modules[1]).toMatchObject({ completed: 10, total: 10, percent: 100 });
  expect(complete.next.slug).toBe("everyday-review");

  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "ความคืบหน้า Everyday Korean" })).toContainText("10/10");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(screenshots, "dashboard-everyday-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "dashboard-everyday-mobile.png"), fullPage: true });
  const dashboardMobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dashboardMobile.scroll).toBeLessThanOrEqual(dashboardMobile.width);

  await page.goto("/courses");
  await expect(page.locator(".course-overview")).toContainText("20 จาก 20");
});
