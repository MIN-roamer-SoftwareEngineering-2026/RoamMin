import { env } from "./env";

/**
 * Fail fast with an actionable message when the dev server is not running.
 *
 * Playwright's built-in `webServer` handshake hangs on this Windows setup even
 * though Vite answers on the port, so the suite expects the dev server to be
 * started first (`npm run dev` in another terminal).
 */
export default async function globalSetup() {
  try {
    const response = await fetch(env.baseURL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(
      [
        `Frontend dev server is not reachable at ${env.baseURL}.`,
        "Start it first in another terminal:",
        "  cd frontend",
        "  npm run dev",
        `Then rerun the tests. (${error instanceof Error ? error.message : String(error)})`,
      ].join("\n"),
    );
  }
}
