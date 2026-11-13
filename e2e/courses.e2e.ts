import { expect, test } from "@playwright/test";

test("courses page renders the curriculum without a server error", async ({ page }) => {
  const serverErrors: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto("/courses");
  expect(response?.status()).toBe(200);

  await expect(page.locator("main h1, .shell h1").first()).toBeVisible();
  const modules = page.locator(".course-module");
  await expect(modules).toHaveCount(5);
  await expect(modules.nth(0).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(1).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(2).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(3).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(4).locator(".course-lesson-card")).toHaveCount(10);
  await expect(modules.nth(0).getByRole("heading", { name: "Hangul Foundation" })).toBeVisible();
  await expect(modules.nth(1).getByRole("heading", { name: "Everyday Korean" })).toBeVisible();
  await expect(modules.nth(2).getByRole("heading", { name: "Korean Grammar" })).toBeVisible();
  await expect(modules.nth(3).getByRole("heading", { name: "Workplace Korean" })).toBeVisible();
  await expect(modules.nth(4).getByRole("heading", { name: "EPS-TOPIK Preparation" })).toBeVisible();
  expect(serverErrors).toEqual([]);
});
