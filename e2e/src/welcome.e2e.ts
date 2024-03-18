import { test, expect, devices } from "@playwright/test";
import { PageModel } from "./page-model";

test.setTimeout(10000);

test("can display welcome screen properly on desktop", async ({ page }) => {
  await page.goto("/");

  const model = new PageModel(page);

  await model.waitForPageReady();

  await expect(page).toHaveScreenshot("welcome-desktop.png", {
    mask: model.maskedAreas,
  });
});

test("can display welcome screen properly on mobile", async ({ page }) => {
  const iphoneViewport = devices["iPhone 14"].viewport;
  await page.setViewportSize(iphoneViewport);

  await page.goto("/");

  const model = new PageModel(page);

  await model.waitForPageReady();

  await expect(page).toHaveScreenshot("welcome-mobile.png", {
    mask: model.maskedAreas,
  });
});
