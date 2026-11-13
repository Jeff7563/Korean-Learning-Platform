import { expect, test } from "@playwright/test";

test("primary navigation exposes its current page and remains keyboard usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/dashboard");
  expect(response?.status()).toBe(200);

  const nav = page.locator(".sidebar nav");
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", "/dashboard");
  await expect(nav.locator("a")).toHaveCount(5);
  for (const link of await nav.locator("a").all()) await expect(link).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.locator(".sidebar-brand")).toBeFocused();
  await page.keyboard.press("Tab");
  const firstNavigationLink = nav.locator("a").first();
  await expect(firstNavigationLink).toBeFocused();
  const outlineStyle = await firstNavigationLink.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe("none");

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});
