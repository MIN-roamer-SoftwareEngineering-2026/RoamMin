import fs from "node:fs";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import {
  sessionPath,
  storageStatePath,
  type Role,
  type StoredSession,
} from "./session";

export type RoleSession = {
  role: Role;
  context: BrowserContext;
  page: Page;
};

function readSession(role: Role): StoredSession {
  const file = sessionPath(role);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing ${file}. Run the setup project first: npx playwright test --project=setup`,
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as StoredSession;
}

/**
 * Opens an authenticated browser context for one role.
 *
 * The config-level trace/screenshot/video options are applied by Playwright to
 * every context created inside a test, so failures of either role are captured
 * automatically — do not call context.tracing.start() here.
 */
export async function openRole(
  browser: Browser,
  role: Role,
): Promise<RoleSession> {
  const stored = readSession(role);
  const storageState = storageStatePath(role);

  const context = await browser.newContext({
    ...(fs.existsSync(storageState) ? { storageState } : {}),
    locale: "en-US",
  });

  // The JWT lives in sessionStorage (see src/store/authStore.ts), which
  // storageState does not capture, so it is re-injected before app start.
  await context.addInitScript(
    ([key, token]) => {
      sessionStorage.setItem(key, token);
    },
    ["min-roamer.token", stored.token] as const,
  );
  await context.addInitScript(() => {
    localStorage.setItem("min-roamer.language", "en");
  });

  const page = await context.newPage();
  return { role, context, page };
}

/** Closes the context; Playwright keeps trace/screenshot/video if the test failed. */
export async function closeRole(session: RoleSession): Promise<void> {
  await session.context.close();
}
