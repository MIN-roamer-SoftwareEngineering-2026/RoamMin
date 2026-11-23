import { expect, test } from "@playwright/test";
import { env, requireAccounts } from "./env";
import { closeRole, openRole } from "./fixtures";
import { sel } from "./selectors";

test("unauthenticated visitor is redirected from /my to /login", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${env.baseURL}/my`);
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await context.close();
  }
});

test("empty create form is rejected by required-field validation", async ({
  browser,
}) => {
  requireAccounts();
  const owner = await openRole(browser, "owner");
  try {
    await owner.page.goto(`${env.baseURL}/my`);
    await owner.page.locator(sel.myHome.createDisclosure).click();
    const before = await owner.page.locator(sel.myHome.tripCard).count();
    await owner.page.locator(sel.myHome.createSubmit).click();
    await expect(
      owner.page.locator(`${sel.myHome.createForm} input:invalid`).first(),
    ).toBeVisible();
    await expect(owner.page.locator(sel.myHome.tripCard)).toHaveCount(before);
  } finally {
    await closeRole(owner);
  }
});

test("protected API rejects an anonymous request with 401", async ({
  request,
}) => {
  const response = await request.get(`${env.apiBase}/trips/mine`);
  expect(response.status()).toBe(401);
});

test("dark theme switch sets data-theme on the document", async ({
  browser,
}) => {
  requireAccounts();
  const owner = await openRole(browser, "owner");
  try {
    await owner.page.goto(`${env.baseURL}/my`);
    await owner.page.getByRole("button", { name: /深色|Dark/ }).click();
    await expect(owner.page.locator("html")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  } finally {
    await closeRole(owner);
  }
});

test("language switch renders English copy", async ({ browser }) => {
  requireAccounts();
  const owner = await openRole(browser, "owner");
  try {
    await owner.page.goto(`${env.baseURL}/my`);
    await owner.page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(owner.page.getByText("Log out").first()).toBeVisible();
  } finally {
    await closeRole(owner);
  }
});

test("375px viewport has no horizontal overflow", async ({ browser }) => {
  requireAccounts();
  const owner = await openRole(browser, "owner", {
    viewport: { width: 375, height: 812 },
  });
  try {
    await owner.page.goto(`${env.baseURL}/my`);
    await owner.page.locator('[role="tab"]').first().waitFor();
    const overflow = await owner.page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  } finally {
    await closeRole(owner);
  }
});
