import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

/**
 * Load frontend/.env.e2e (KEY=VALUE per line) so `npm run e2e` works without
 * dotenv. Existing process.env values always win.
 */
function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env.e2e"),
    path.join(process.cwd(), "frontend", ".env.e2e"),
  ];
  const envFile = candidates.find((file) => fs.existsSync(file));
  if (!envFile) return;
  for (const raw of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: "./e2e/global-setup.ts",
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    locale: "en-US",
    // Built-in fixtures (smoke test) get these automatically. The two-account
    // main flow records its own contexts in e2e/fixtures.ts.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // No backend / no accounts required: proves Playwright + Vite are wired.
    { name: "smoke", testMatch: /smoke\.spec\.ts/ },

    // Logs both accounts in once and stores their session.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // The Alpha main flow: create -> invite -> member sees joined trip.
    {
      name: "main",
      testMatch: /(main-flow|secondary|trip-detail)\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
});
