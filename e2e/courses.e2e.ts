import { expect, test } from "@playwright/test";

test("courses page renders the curriculum without a server error", async ({ page }) => {
  const serverErrors: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto("/courses");
  expect(response?.status()).toBe(200);

  await expect(page.locator("main h1, .shell h1").first()).toBeVisible();
  const phases = page.locator(".shell section.card");
  await expect(phases).toHaveCount(5);
  await expect(phases.first().locator(".grid > a.card")).toHaveCount(10);
  await expect(phases.first().locator(".grid > a.card h3").first()).not.toBeEmpty();
  expect(serverErrors).toEqual([]);
});
