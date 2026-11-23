import fs from "node:fs";
import { expect, test as setup } from "@playwright/test";
import { env, requireAccounts } from "./env";
import { sel } from "./selectors";
import {
  AUTH_DIR,
  sessionPath,
  storageStatePath,
  type Role,
  type StoredSession,
} from "./session";

function accountFor(role: Role) {
  return role === "owner" ? env.owner : env.member;
}

for (const role of ["owner", "member"] as const) {
  setup(`sign in as ${role}`, async ({ page }) => {
    requireAccounts();
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    // The app reads the language from localStorage at module init, so this has
    // to be installed before the first navigation.
    await page.addInitScript(() => {
      localStorage.setItem("min-roamer.language", "en");
    });

    const account = accountFor(role);
    await page.goto("/login");
    await page.locator(sel.login.email).fill(account.email);
    await page.locator(sel.login.password).fill(account.password);
    await page.locator(sel.login.submit).click();

    // Login redirects to "/" or back to the protected route; waiting for the
    // stored JWT is independent of that redirect.
    await page.waitForFunction(
      () => Boolean(sessionStorage.getItem("min-roamer.token")),
      undefined,
      { timeout: 20_000 },
    );

    const token = await page.evaluate(() =>
      sessionStorage.getItem("min-roamer.token"),
    );
    expect(token, `JWT for ${role} should be stored`).toBeTruthy();

    // sessionStorage is NOT part of Playwright's storageState, so the token is
    // persisted separately and re-injected in e2e/fixtures.ts.
    const stored: StoredSession = { token: token as string, email: account.email };
    fs.writeFileSync(sessionPath(role), JSON.stringify(stored, null, 2));

    // storageState still carries cookies + localStorage (language, theme).
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
