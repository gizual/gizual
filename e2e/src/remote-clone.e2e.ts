import { test, expect } from "@playwright/test";
import { PageModel } from "./page-model";

test("can remote-clone from url, then wait until idle", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");

  const model = new PageModel(page);

  await model.waitForPageReady();

  const [idle] = await Promise.all([
    model.waitForWorkersIdle(),
    model.openRepoFromURL("https://github.com/gizual/testcase--ts-rest"),
  ]);

  expect(idle).toBe(true);

  const numFiles = await model.getNumFilesSelected();

  expect(numFiles).toBe(162);

  await expect(page).toHaveScreenshot("range-by-date.png", {
    mask: [model.versionAndBuildHash],
  });

  // TODO: This should be enabled as soon as the bug "uncaught exception: repo path should not be empty" is fixed
  //expect(model.consoleErrors).toHaveLength(0);
});
