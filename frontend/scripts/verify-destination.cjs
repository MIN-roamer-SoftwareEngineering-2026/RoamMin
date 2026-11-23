// Browser regression script for the destination module (Team C).
// Usage: start the front-end dev server first, then run
//   node scripts/verify-destination.cjs
// Optional environment variables:
//   PLAYWRIGHT_MODULE  path to an installed playwright / playwright-core
//   QA_BROWSER         browser executable (defaults to the installed Edge)
//   QA_BASE_URL        defaults to http://127.0.0.1:5173
//   QA_OUTPUT          defaults to artifacts/destination
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
  // With the backend down, /api/v1/destinations returns 500; that is the known fallback path, not a page error.
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      errors.push(message.text());
    }
  });

  try {
    // 1. List page: all samples rendered
    await page.goto(`${base}/destinations`, { waitUntil: "networkidle" });
    await page.locator(".destination-card").first().waitFor();
    const cards = page.locator(".destination-card");
    assert.equal(await cards.count(), 8, "list should render 8 sample destinations");
    assert.equal(
      await page.locator(".destination-source-badge").innerText(),
      "本地样例数据",
      "sample badge should show while the places API is unavailable",
    );
    await page.getByRole("button", { name: "浅色", exact: true }).click();
    await page.waitForTimeout(160);
    await page.screenshot({ path: path.join(output, "destinations-light.png"), fullPage: true });

    // 2. Keyword search
    const search = page.getByRole("searchbox", { name: "搜索目的地" });
    await search.fill("鼓山");
    await page.waitForTimeout(120);
    assert.equal(await cards.count(), 1, 'searching "鼓山" should leave 1 result');
    assert.match(await cards.first().innerText(), /鼓山/);
    await page.screenshot({ path: path.join(output, "destinations-search.png"), fullPage: true });

    // 3. Category filter
    await search.fill("");
    await page.getByRole("button", { name: "人文古厝", exact: true }).click();
    await page.waitForTimeout(120);
    assert.equal(await cards.count(), 4, "heritage category should hold 4 destinations");
    assert.match(await page.locator(".destination-count").innerText(), /当前显示 4 个/);

    // 4. Empty state
    await search.fill("不存在的关键字");
    await page.locator(".destination-empty").waitFor();
    assert.match(await page.locator(".destination-empty").innerText(), /没有匹配的目的地/);
    await search.fill("");
    await page.getByRole("button", { name: "全部", exact: true }).click();

    // 5. Detail page
    await page.locator('a[href="/destinations/sanfang-qixiang"]').click();
    await page.waitForURL("**/destinations/sanfang-qixiang");
    assert.equal(
      await page.locator(".destination-facts > div").count(),
      6,
      "detail page should show 6 facts",
    );
    assert.equal(await page.locator(".destination-highlights li").count(), 3);
    await page.screenshot({ path: path.join(output, "destination-detail.png"), fullPage: true });

    // 6. Dark theme
    await page.getByRole("button", { name: "深色", exact: true }).click();
    await page.waitForTimeout(160);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.screenshot({ path: path.join(output, "destination-detail-dark.png"), fullPage: true });
    await page.getByRole("button", { name: "浅色", exact: true }).click();

    // 7. English UI
    await page.goto(`${base}/destinations`, { waitUntil: "networkidle" });
    await page.locator(".language-switch button", { hasText: "EN" }).click();
    await page.waitForTimeout(160);
    assert.match(await page.locator(".destination-heading h1").innerText(), /Destinations from Fuzhou/);
    await page.screenshot({ path: path.join(output, "destinations-en.png"), fullPage: true });
    await page.locator(".language-switch button", { hasText: "中" }).click();

    // 8. Mobile viewport: no horizontal scroll
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/destinations`, { waitUntil: "networkidle" });
    await page.locator(".destination-card").first().waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, `no horizontal overflow expected on mobile, actual ${overflow}px`);
    await page.screenshot({ path: path.join(output, "destinations-mobile.png"), fullPage: true });

    assert.deepEqual(errors, [], "no uncaught errors expected on the page");
    console.log(`destination module ok -> ${output}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
