import { Page, expect } from "@playwright/test";
import type { Maestro } from "@giz/maestro";

declare global {
  interface Window {
    maestro: Maestro;
  }
}

export class PageModel {
  consoleErrors: string[] = [];

  constructor(public page: Page) {
    this.consoleErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        this.consoleErrors.push(msg.text());
      }
    });
  }

  get gizualLogo() {
    return this.page.locator("img[alt='Gizual Logo']");
  }

  get notSupportedContainer() {
    return this.page.locator("#not-supported");
  }

  get versionAndBuildHash() {
    return this.page.locator("p[data-test-id='versionAndBuildHash']");
  }

  get maskedAreas() {
    return [this.versionAndBuildHash];
  }

  async waitForPageReady() {
    await expect(this.notSupportedContainer).not.toBeVisible();
    await expect(this.gizualLogo).toBeVisible();
  }

  async openRepoFromURL(url: string) {
    await this.page.evaluate((url) => {
      window.maestro.openRepoFromURL(url);
    }, url);
  }

  async waitForWorkersIdle() {
    return this.page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        window.maestro.on("workers:idle", () => {
          resolve(true);
        });
      });
    });
  }

  async getNumFilesSelected() {
    const text = await this.page.locator("p[data-test-id='numSelectedFiles']").innerText();
    const num = text.split(" ")[0];
    return parseInt(num, 10);
  }
}
