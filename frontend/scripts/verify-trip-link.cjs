// One-off check for the destination -> create-trip hand-off (Team C, 11/25).
// Needs the backend on 8080 and the front-end dev server on 5173.
// Usage: node verify-trip-link.cjs   (QA_OUTPUT sets the screenshot folder)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.QA_BROWSER || (fs.existsSync(EDGE) ? EDGE : undefined),
    headless: true,
  });
  const base = process.env.QA_BASE_URL || "http://localhost:5173";
  const output = path.resolve(process.env.QA_OUTPUT || "artifacts/destination");
  fs.mkdirSync(output, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    const stamp = Date.now().toString().slice(-8);
    const account = { username: `cl${stamp}`, email: `cl${stamp}@example.com`, password: "Passw0rd!23" };

    await page.goto(`${base}/register`, { waitUntil: "networkidle" });
    await page.getByLabel("用户名", { exact: true }).fill(account.username);
    await page.getByLabel("邮箱", { exact: true }).fill(account.email);
    await page.getByLabel("密码", { exact: true }).fill(account.password);
    await page.getByLabel("确认密码", { exact: true }).fill(account.password);
    await page.locator("form .button-primary").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/register"), { timeout: 20000 });

    // 1. Plain create-trip page stays empty
    await page.goto(`${base}/trips/new`, { waitUntil: "networkidle" });
    const titleInput = page.getByLabel("行程名称", { exact: true });
    const destInput = page.getByLabel("目的地", { exact: true });
    assert.equal(await titleInput.inputValue(), "", "a plain /trips/new should not be prefilled");
    assert.equal(await destInput.inputValue(), "", "a plain /trips/new should not be prefilled");

    // 2. Arriving from the destination detail page prefills title + destination
    await page.goto(`${base}/trips/new?from=sanfang-qixiang`, { waitUntil: "networkidle" });
    assert.match(await titleInput.inputValue(), /三坊七巷/, "title should carry the destination name");
    assert.equal(await destInput.inputValue(), "三坊七巷", "destination field should be prefilled");
    const hint = page.locator(".trip-form-panel .field-hint");
    assert.match(await hint.innerText(), /已从目的地/, "hint should say where the values came from");
    assert.equal(
      await hint.locator("a").getAttribute("href"),
      "/destinations/sanfang-qixiang",
      "hint link should return to the source destination",
    );
    await page.getByRole("button", { name: "浅色", exact: true }).click();
    await page.waitForTimeout(160);

    // 2b. The prefill feeds the Team B destination picker: opening it narrows to the same place
    await destInput.click();
    const options = page.locator(".destination-picker-options [role='option']");
    await options.first().waitFor();
    assert.equal(
      await options.count(),
      1,
      "the prefilled destination should narrow the picker to that one sample",
    );
    assert.match(await options.first().innerText(), /三坊七巷/, "the picker option should be the same place");
    await page.screenshot({ path: path.join(output, "trip-prefill.png"), fullPage: true });
    // Close the picker so its overlay does not intercept the submit button (see #54).
    await page.keyboard.press("Escape");
    await page.locator(".destination-picker-options").waitFor({ state: "hidden" });

    // 3. The prefilled form really creates the trip
    await page.locator(".trip-form-actions .button-primary").click();
    await page.waitForURL("**/trips?created=*", { timeout: 20000 });
    await page.locator(".trip-list-item h2").first().waitFor({ timeout: 20000 });
    assert.match(
      await page.locator(".trip-list-item h2").first().innerText(),
      /三坊七巷/,
      "the prefilled trip should show up in my trips",
    );

    assert.deepEqual(errors, [], "no uncaught page errors expected");
    console.log(`trip link ok -> ${output}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
