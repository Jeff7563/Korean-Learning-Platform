import { expect, test } from "@playwright/test";

test("learner completes a lesson and progress survives reload", async ({ page, request }) => {
  const first = await request.get("/api/lessons/hangul-intro");
  expect(first.ok()).toBeTruthy();
  const lesson = await first.json();
  expect(lesson.lesson).not.toHaveProperty("questions");
  expect(lesson.lesson.videoResources).toHaveLength(3);
  expect(JSON.stringify(lesson)).not.toMatch(/"(answer|answer_index|answerKey|correctAnswer)"/i);
  expect(lesson.exercises.every((exercise: { answer?: unknown; answer_index?: unknown }) => exercise.answer === undefined && exercise.answer_index === undefined)).toBe(true);
  await request.post("/api/activities", { data: { activityId: lesson.activities[0].id, completed: false } });

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ยินดีต้อนรับกลับมา" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "กิจกรรมฝึกของบทเรียนถัดไป" })).toBeVisible();
  await expect(page.locator(".daily-item").first()).toBeVisible();
  await page.locator(".hero-action").click();
  await expect(page).toHaveURL(/\/learn\//);
  await expect(page.getByRole("heading", { name: lesson.lesson.title })).toBeVisible();
  await expect(page.locator(".media-frame")).toBeVisible();

  const checkbox = page.getByRole("checkbox").first();
  await Promise.all([page.waitForResponse(response => response.url().endsWith("/api/activities") && response.status() === 200), checkbox.click()]);
  await page.reload();
  await expect(checkbox).toBeChecked();

  const correct = [0, 0, 2, 1, 1];
  const wrong = [1, 1, 0, 0, 0];
  for (let index = 0; index < lesson.exercises.length; index++) await page.locator(`input[name="q${lesson.exercises[index].id}"]`).nth(wrong[index]).check();
  const failedSubmission = page.waitForResponse(response => response.url().endsWith("/api/checkpoints") && response.request().method() === "POST");
  await page.getByRole("button", { name: "ส่งคำตอบ" }).click();
  expect((await failedSubmission).ok()).toBeTruthy();
  await expect(page.locator(".checkpoint-result")).toContainText("0/5", { timeout: 15_000 });
  let course = await request.get("/api/courses");
  let progress = await course.json();
  expect(progress.lessons[0].status).toBe("in_progress");
  expect(progress.lessons[1].status).toBe("locked");

  for (let index = 0; index < lesson.exercises.length; index++) await page.locator(`input[name="q${lesson.exercises[index].id}"]`).nth(correct[index]).check();
  const passedSubmission = page.waitForResponse(response => response.url().endsWith("/api/checkpoints") && response.request().method() === "POST");
  await page.getByRole("button", { name: "ส่งคำตอบ" }).click();
  expect((await passedSubmission).ok()).toBeTruthy();
  await expect(page.locator(".checkpoint-result")).toContainText("5/5", { timeout: 15_000 });
  await page.reload();
  await expect(page).toHaveURL(/\/learn\//);
  await expect(page.getByRole("heading", { name: lesson.lesson.title })).toBeVisible();
  course = await request.get("/api/courses");
  progress = await course.json();
  expect(progress.lessons[0].status).toBe("completed");
  expect(progress.lessons[1].status).toBe("available");

  await page.locator("#tutor-question").fill("อธิบาย 한글");
  await page.getByRole("button", { name: /ถาม Tutor/ }).click();
  await expect(page.getByText(/Ollama-compatible mock/)).toBeVisible();
});
