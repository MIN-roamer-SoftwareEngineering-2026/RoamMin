import { expect, test } from "@playwright/test";
import { sel } from "./selectors";

/**
 * Environment smoke test — no backend and no accounts required.
 * If this passes, Playwright can drive the app and Vite is serving it.
 */
test("login page renders", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("min-roamer.language", "en");
  });

  await page.goto("/login");

  await expect(page.locator(sel.login.email)).toBeVisible();
  await expect(page.locator(sel.login.password)).toBeVisible();
  await expect(page.locator(sel.login.submit)).toBeEnabled();
});
