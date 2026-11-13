import { expect, test, type APIRequestContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { curriculumModules } from "../src/content/curriculum";

const screenshots = resolve(process.cwd(), "test-results", "ui-v0.5");
const miniLessonScreenshots = resolve(process.cwd(), "test-results", "ui-v0.7.2");
const grammarScreenshots = resolve(process.cwd(), "test-results", "ui-v0.8");

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

test("Korean Grammar unlocks after the first twenty lessons and completes as module three", async ({ page, request }) => {
  test.setTimeout(180_000);
  mkdirSync(screenshots, { recursive: true });
  mkdirSync(miniLessonScreenshots, { recursive: true });
  mkdirSync(grammarScreenshots, { recursive: true });
  page.setDefaultTimeout(12_000);

  const initialCoursesApi = await request.get("/api/courses");
  expect(initialCoursesApi.status(), await initialCoursesApi.text()).toBe(200);
  expect((await initialCoursesApi.json()).modules).toHaveLength(3);
  const coursesResponse = await page.goto("/courses");
  expect(coursesResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Hangul Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everyday Korean" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Korean Grammar" })).toBeVisible();
  await expect(page.locator(".course-module").nth(0).locator(".course-lesson-card")).toHaveCount(10);
  await expect(page.locator(".course-module").nth(1).locator(".course-lesson-card")).toHaveCount(10);
  await expect(page.locator(".course-module").nth(2).locator(".course-lesson-card")).toHaveCount(10);
  await expect(page.locator('.course-lesson-card[href="#"]').first()).toContainText("ล็อก");
  expect((await request.get("/api/lessons/everyday-greetings")).status()).toBe(403);
  expect((await request.get("/api/lessons/grammar-sentence-structure-particles")).status()).toBe(403);
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
  expect(afterHangul.modules[2].lessons[0].status).toBe("locked");
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
  await expect(page.locator("#video .media-fallback")).toContainText("วิดีโอจากแหล่งภายนอก");
  await expect(page.locator("#video .media-attribution")).toContainText("Thai PBS ALTV");
  await expect(page.locator("#video .media-attribution a")).toHaveAttribute("href", "https://altv.thaipbs.or.th/programs/tutor-hub/643507794568cccc2a1a67a8?type=episode");
  await expect(page.locator("#listening .listening-item")).toHaveCount(3);
  const tipToggle = page.locator(".teacher-tip-toggle");
  const controlledTipId = await tipToggle.getAttribute("aria-controls");
  expect(controlledTipId).toMatch(/^teacher-tip-content-/);
  await tipToggle.press("Enter");
  await expect(tipToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#${controlledTipId}`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "วลีเอาตัวรอด แยกตามสถานการณ์" })).toBeVisible();
  await expect(page.locator(".teacher-tip-examples article")).toHaveCount(8);
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.locator("#teacher-tip").screenshot({ path: resolve(miniLessonScreenshots, "teacher-tip-desktop.png") });
  await page.locator(".teacher-tip-question").nth(0).getByRole("radio").nth(1).check();
  await page.locator(".teacher-tip-question").nth(1).getByRole("radio").first().check();
  await page.locator(".teacher-tip-question").nth(2).getByRole("radio").nth(2).check();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.getByText(/Mini Lesson นี้เป็นแบบฝึกเสริม/)).toBeVisible();
  await expect(page.locator("#checkpoint .question-card")).toHaveCount(5);
  expect((await (await request.get("/api/lessons/everyday-greetings")).json()).attempts).toEqual(publicLesson.attempts);
  await page.locator(".teacher-tip").screenshot({ path: resolve(miniLessonScreenshots, "teacher-tip-practice-desktop.png") });
  for (const anchor of ["video", "listening", "vocabulary", "lesson-activities", "checkpoint"]) {
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }
  await expect(page.getByRole("link", { name: "บทก่อนหน้า: ทบทวนพื้นฐานฮันกึล" })).toHaveAttribute("href", "/learn/hangul-review");
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.screenshot({ path: resolve(screenshots, "everyday-lesson-desktop.png"), fullPage: true });
  await page.locator("#checkpoint").scrollIntoViewIfNeeded();
  await page.locator("#checkpoint").screenshot({ path: resolve(screenshots, "everyday-checkpoint-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#teacher-tip").scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(miniLessonScreenshots, "teacher-tip-mobile.png"), fullPage: true });
  const tipMobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(tipMobile.scroll).toBeLessThanOrEqual(tipMobile.width);
  await page.screenshot({ path: resolve(screenshots, "everyday-lesson-mobile.png"), fullPage: true });
  await page.locator("#checkpoint").scrollIntoViewIfNeeded();
  await page.locator("#checkpoint").screenshot({ path: resolve(screenshots, "everyday-checkpoint-mobile.png") });
  const mobileSize = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(mobileSize.scroll).toBeLessThanOrEqual(mobileSize.width);

  for (const lesson of curriculumModules[1].lessons) await passLesson(request, lesson);
  const afterEveryday = await (await request.get("/api/courses")).json();
  expect(afterEveryday).toMatchObject({ completed: 20, total: 30 });
  expect(afterEveryday.modules[2].lessons[0].status).toBe("available");
  expect(afterEveryday.modules[2].lessons[1].status).toBe("locked");
  expect((await request.get("/api/lessons/grammar-copula")).status()).toBe(403);
  const grammarPlan = await (await request.get("/api/daily-plan?date=2099-11-10")).json();
  expect(grammarPlan.lesson).toMatchObject({ slug: "grammar-sentence-structure-particles", moduleTitle: "Korean Grammar", modulePosition: 3 });
  expect(grammarPlan.recommendationHref).toBe("/learn/grammar-sentence-structure-particles#lesson-activities");

  const grammarPage = await page.goto("/learn/grammar-sentence-structure-particles");
  expect(grammarPage?.status()).toBe(200);
  await expect(page.locator(".player-phase")).toContainText("Korean Grammar");
  await expect(page.locator(".player-title h1")).toBeVisible();
  await expect(page.locator(".grammar-dialogue")).toBeVisible();
  await expect(page.locator(".grammar-practice")).toBeVisible();
  await expect(page.locator(".grammar-mistakes")).toBeVisible();
  await expect(page.locator("#checkpoint .question-card")).toHaveCount(5);
  const grammarPublic = await (await request.get("/api/lessons/grammar-sentence-structure-particles")).json();
  expect(grammarPublic.lesson.dialogue.length).toBeGreaterThanOrEqual(2);
  expect(JSON.stringify(grammarPublic)).not.toMatch(/"(answer|answer_index|answerKey|correctAnswer)"/i);
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.screenshot({ path: resolve(grammarScreenshots, "grammar-lesson-21-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(grammarScreenshots, "grammar-lesson-21-mobile.png"), fullPage: true });
  const grammarMobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(grammarMobile.scroll).toBeLessThanOrEqual(grammarMobile.width);
  await page.goto("/courses");
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.screenshot({ path: resolve(grammarScreenshots, "grammar-module-progress-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(grammarScreenshots, "grammar-module-progress-mobile.png"), fullPage: true });
  for (const lesson of curriculumModules[2].lessons) await passLesson(request, lesson);
  const complete = await (await request.get("/api/courses")).json();
  expect(complete).toMatchObject({ completed: 30, total: 30, percent: 100 });
  expect(complete.modules[1]).toMatchObject({ completed: 10, total: 10, percent: 100 });
  expect(complete.modules[2]).toMatchObject({ completed: 10, total: 10, percent: 100 });
  expect(complete.next.slug).toBe("grammar-integrated-review");

  await page.goto("/learn/everyday-sino-korean-numbers");
  await expect(page.getByRole("heading", { name: "ตัวเลขเกาหลีจีน" })).toBeVisible();
  await expect(page.locator("#video .media-fallback")).toContainText("เอกสารและแหล่งเรียนรู้ภายนอก");
  await expect(page.locator("#video .media-attribution a")).toHaveAttribute("href", "https://epstopik.hrdkorea.or.kr/epstopik/eps_klt/ebook_pdf/4.%20Thailand%201.pdf");

  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "ความคืบหน้า Everyday Korean" })).toContainText("10/10");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(screenshots, "dashboard-everyday-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, "dashboard-everyday-mobile.png"), fullPage: true });
  const dashboardMobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dashboardMobile.scroll).toBeLessThanOrEqual(dashboardMobile.width);

  await page.goto("/courses");
  await expect(page.locator(".course-overview")).toContainText(/30/);
});
