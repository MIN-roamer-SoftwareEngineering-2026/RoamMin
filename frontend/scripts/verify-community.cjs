// Browser regression script for the community module (Team E, Issue #19).
// Usage: start the backend and the front-end dev server first, then run
//   node scripts/verify-community.cjs
// Optional environment variables:
//   PLAYWRIGHT_MODULE  path to an installed playwright / playwright-core
//   QA_BROWSER         browser executable (defaults to the installed Edge)
//   QA_BASE_URL        defaults to http://localhost:5173
//   QA_API_URL         defaults to http://127.0.0.1:8080/api/v1
//   QA_OUTPUT          defaults to artifacts/community
//   QA_VERSION         version label used in screenshot names (defaults to "local")
//
// What it checks (Issue #19 acceptance):
//   - publish a buddy post, the list shows it, it is still there after a reload
//   - delete with confirmation returns to the empty state
//   - create a trip (private by default), publish it, another user favorites it,
//     it shows up in "my favorites" and survives a reload
//   - failure paths: empty title 400, anonymous 401, deleting someone else's post 403
//   - when the API returns 500 the page shows an alert instead of a blank screen
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const BASE = process.env.QA_BASE_URL || "http://localhost:5173";
const API = (process.env.QA_API_URL || "http://127.0.0.1:8080/api/v1").replace(/\/$/, "");
const OUTPUT = path.resolve(process.env.QA_OUTPUT || "artifacts/community");
const VERSION = process.env.QA_VERSION || "local";
fs.mkdirSync(OUTPUT, { recursive: true });

const stamp = String(Date.now()).slice(-6);
const account = (prefix) => ({ username: `${prefix}_${stamp}`, email: `${prefix}_${stamp}@example.com`, password: "Verify@2026" });

async function api(pathname, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${pathname}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await response.json(); } catch { /* empty body */ }
  return { status: response.status, json };
}

function shot(page, name) {
  return page.screenshot({ path: path.join(OUTPUT, `${name}-${VERSION}.png`), fullPage: true });
}

async function login(page, person) {
  await page.goto(`${BASE}/login`);
  await page.locator("input[type=email]").fill(person.email);
  await page.locator("input[type=password]").fill(person.password);
  await page.locator("button.button-primary.full-width").click();
  await page.waitForSelector("#tab-trips", { timeout: 20000 });
}

(async () => {
  const owner = account("e_owner");
  const guest = account("e_guest");
  const ownerReg = await api("/auth/register", { method: "POST", body: owner });
  const guestReg = await api("/auth/register", { method: "POST", body: guest });
  assert.ok(ownerReg.status < 300 && guestReg.status < 300, "both test accounts should register");
  const ownerToken = ownerReg.json.data.token;
  const guestToken = guestReg.json.data.token;
  const ownerId = ownerReg.json.data.user.id;

  // ---- API failure paths -------------------------------------------------
  const emptyTitle = await api("/buddy", { method: "POST", token: ownerToken, body: { title: "", destination: "福州", description: "" } });
  assert.equal(emptyTitle.status, 400, "empty buddy post should be rejected with 400");
  const anonymous = await api("/buddy", { method: "POST", body: { title: "x", destination: "y", description: "z" } });
  assert.equal(anonymous.status, 401, "anonymous buddy post should be rejected with 401");
  const seeded = await api("/buddy", { method: "POST", token: ownerToken, body: { title: "越权删除用帖", destination: "福州", travelDate: "2026-12-06", description: "仅用于权限校验" } });
  const seededId = seeded.json.data.id;
  const crossDelete = await api(`/buddy/${seededId}`, { method: "DELETE", token: guestToken });
  assert.equal(crossDelete.status, 403, "deleting someone else's post should be rejected with 403");
  await api(`/buddy/${seededId}`, { method: "DELETE", token: ownerToken });

  const browser = await chromium.launch({
    executablePath: process.env.QA_BROWSER || (fs.existsSync(EDGE) ? EDGE : undefined),
    headless: true,
  });
  try {
    // ---- buddy post ------------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await login(page, owner);
    await page.locator("#tab-buddies").click();
    await page.locator(".empty-state, .social-item").first().waitFor();
    await shot(page, "01-buddy-empty");

    await page.locator("details.create-disclosure summary").click();
    const buddyForm = page.locator("form.compact-create-form");
    const title = `周末去平潭看海-${VERSION}`;
    await buddyForm.locator("input").nth(0).fill(title);
    await buddyForm.locator("input").nth(1).fill("平潭");
    await buddyForm.locator("input").nth(2).fill("2026-12-05");
    await buddyForm.locator("textarea").fill("12/5 早上福州出发，当晚住坛南湾，人均 300 以内。");
    await shot(page, "02-buddy-form");
    await buddyForm.locator("button.button-primary").click();

    const buddyCard = page.locator(".social-item", { hasText: title });
    await buddyCard.waitFor({ timeout: 20000 });
    await shot(page, "03-buddy-created");

    await page.reload();
    await page.locator("#tab-buddies").click();
    await page.locator(".social-item", { hasText: title }).waitFor({ timeout: 20000 });
    await shot(page, "04-buddy-after-reload");

    await page.locator(".social-item", { hasText: title }).locator("button", { hasText: "删除" }).click();
    const dialog = page.locator("dialog.confirm-dialog[open]");
    await dialog.waitFor({ timeout: 10000 });
    await shot(page, "05-buddy-delete-dialog");
    await dialog.locator("button.button-primary").click();
    await page.locator(".social-item", { hasText: title }).waitFor({ state: "detached", timeout: 20000 });
    await shot(page, "06-buddy-deleted");

    // ---- trip publish + favorite ----------------------------------------
    await page.locator("#tab-trips").click();
    await page.locator("details.create-disclosure summary").click();
    const tripForm = page.locator("details.create-disclosure form.compact-create-form");
    const tripTitle = `福州周末游-${VERSION}`;
    await tripForm.locator("input").nth(0).fill(tripTitle);
    await tripForm.locator("input").nth(1).fill("福州");
    // The destination field is a combobox: after typing, its listbox overlays the form and
    // would swallow later clicks, so pick the first option (or close it) like a real user.
    await page.waitForTimeout(300);
    const destinationOption = page.locator("#home-destination-options [role=option]").first();
    if (await destinationOption.count()) {
      await destinationOption.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await tripForm.locator("input").nth(2).fill("2026-12-12");
    await tripForm.locator("input").nth(3).fill("2026-12-13");
    await tripForm.locator("button.button-primary").click();
    const tripCard = page.locator(".social-item", { hasText: tripTitle });
    await tripCard.waitFor({ timeout: 20000 });
    assert.match(await tripCard.locator(".visibility-label").innerText(), /仅自己|私密|私有/, "a new trip should be private by default");
    await shot(page, "07-trip-private");

    await tripCard.locator("button", { hasText: "发布" }).first().click();
    await page.locator(".social-item", { hasText: tripTitle }).locator(".visibility-label", { hasText: "公开" }).waitFor({ timeout: 20000 });
    await shot(page, "08-trip-public");

    const guestPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await login(guestPage, guest);
    await guestPage.goto(`${BASE}/users/${ownerId}`);
    const favoriteButton = guestPage.locator("button", { hasText: "收藏" }).first();
    await favoriteButton.waitFor({ timeout: 20000 });
    await shot(guestPage, "09-public-profile");
    await favoriteButton.click();
    await guestPage.locator("button", { hasText: "取消收藏" }).first().waitFor({ timeout: 20000 });
    await shot(guestPage, "10-favorited");

    await guestPage.goto(`${BASE}/my`);
    await guestPage.locator("#tab-favorites").click();
    await guestPage.locator(".social-item", { hasText: tripTitle }).waitFor({ timeout: 20000 });
    await shot(guestPage, "11-my-favorites");

    await guestPage.reload();
    await guestPage.locator("#tab-favorites").click();
    await guestPage.locator(".social-item", { hasText: tripTitle }).waitFor({ timeout: 20000 });
    await shot(guestPage, "12-favorites-after-reload");

    // ---- failure path: API down, page must show an alert, not a blank screen
    const brokenPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await brokenPage.route("**/api/v1/**", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"code":500,"message":"simulated failure","data":null}' }),
    );
    await brokenPage.goto(`${BASE}/login`);
    await brokenPage.locator("input[type=email]").fill(owner.email);
    await brokenPage.locator("input[type=password]").fill(owner.password);
    await brokenPage.locator("button.button-primary.full-width").click();
    const alert = brokenPage.locator("[role=alert]").first();
    await alert.waitFor({ timeout: 15000 });
    assert.ok((await alert.innerText()).length > 0, "the failure alert should contain a message");
    assert.ok((await brokenPage.locator("main").innerText()).trim().length > 0, "the page must not go blank");
    await shot(brokenPage, "13-failure-path");

    assert.deepEqual(pageErrors, [], `no uncaught page errors expected: ${pageErrors.join("; ")}`);
    console.log(`OK  screenshots -> ${OUTPUT}`);
    console.log("OK  published buddy post, reload persisted, delete confirmed");
    console.log("OK  trip private -> public, favorited by another user, favorites survived reload");
    console.log("OK  failure paths: 400 / 401 / 403, and 500 shows an alert without a blank page");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
