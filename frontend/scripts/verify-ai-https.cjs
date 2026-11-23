/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium, request } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const provider = process.env.AI_QA_PROVIDER;
if (!["fixture", "live"].includes(provider)) {
  throw new Error(
    "Set AI_QA_PROVIDER=fixture or explicitly opt in with AI_QA_PROVIDER=live.",
  );
}
const base = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(base).hostname),
  "Use a disposable local app",
);
const output = path.resolve(
  process.env.QA_OUTPUT || "artifacts/ai-phase2/" + provider,
);
const station = /Fuzhou Railway Station|福州站/i;

test(
  "signed-in itinerary and contextual chat through the " +
    provider +
    " provider",
  { timeout: 240_000 },
  async (t) => {
    const api = await request.newContext({ baseURL: base });
    t.after(() => api.dispose());
    const browser = await chromium.launch({
      executablePath: process.env.QA_BROWSER || undefined,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.setDefaultTimeout(10_000);
    async function register() {
      const suffix = randomBytes(6).toString("hex");
      const email = "ai-qa-" + suffix + "@example.com";
      const password = randomBytes(18).toString("base64url");
      const response = await api.post("/api/v1/auth/register", {
        data: { username: "aiqa" + suffix, email, password },
      });
      assert.equal(response.status(), 201);
      const {
        data: { token },
      } = await response.json();
      return { email, password, headers: { Authorization: "Bearer " + token } };
    }
    const { email, password, headers } = await register();
    const existing = await api.post("/api/v1/trips", {
      headers,
      data: { title: "Earlier saved trip", destination: "Xiamen" },
    });
    assert.equal(existing.status(), 200);
    const getTrips = async () => {
      const result = await api.get("/api/v1/trips/mine", { headers });
      assert.equal(result.status(), 200);
      return (await result.json()).data;
    };
    const before = await getTrips();
    assert.equal(before.length, 1);
    assert.equal(before[0].title, "Earlier saved trip");

    await page.addInitScript(() =>
      localStorage.setItem("min-roamer.language", "en"),
    );
    await page.goto(base + "/ai");
    await page.waitForURL("**/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("main")
      .getByRole("button", { name: "Log in", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/ai");
    await page
      .getByRole("heading", { name: "AI Assistant", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Light", exact: true }).click();

    let browserRequests = 0;
    page.on("request", (sent) => {
      if (new URL(sent.url()).pathname.startsWith("/api/v1/ai/"))
        browserRequests++;
    });
    async function submitAi(endpoint, button) {
      const start = Date.now();
      const result = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/ai/" + endpoint &&
          response.request().method() === "POST",
        { timeout: 70_000 },
      );
      await page.getByRole("button", { name: button, exact: true }).click();
      const response = await result;
      assert.equal(
        response.status(),
        200,
        "Expected a successful " + endpoint + " request",
      );
      const envelope = await response.json();
      assert.equal(envelope.code, 0);
      return {
        data: envelope.data,
        input: response.request().postDataJSON(),
        elapsed: Date.now() - start,
      };
    }

    fs.mkdirSync(output, { recursive: true });
    await page.getByLabel("Destination", { exact: true }).fill("Fuzhou");
    await page.getByLabel("Travel days").fill("3");
    await page.getByLabel("Budget (CNY, optional)").fill("1500");
    const itinerary = await submitAi(
      "generate-itinerary",
      "Generate itinerary",
    );
    assert.equal(itinerary.input.destination, "Fuzhou");
    assert.equal(itinerary.input.days, 3);
    assert.equal(itinerary.input.budget, 1500);
    assert.deepEqual(
      itinerary.data.dailyItinerary.map(({ day }) => day),
      [1, 2, 3],
    );
    for (const day of itinerary.data.dailyItinerary) {
      await page
        .getByRole("heading", {
          name: "Day " + day.day + " " + day.title,
          exact: true,
        })
        .waitFor();
    }
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    if (provider === "fixture")
      await page.getByText("Min River promenade", { exact: true }).waitFor();
    await page.screenshot({
      path: path.join(output, "itinerary-light.png"),
      fullPage: true,
    });

    await page
      .getByRole("button", { name: "Travel chat", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    const question = page.getByLabel("Travel question", { exact: true });
    const firstQuestion =
      "My starting point is Fuzhou Railway Station. Name it and suggest a nearby place to visit.";
    await question.fill(firstQuestion);
    const first = await submitAi("chat", "Send question");
    assert.deepEqual(first.input.history, []);
    assert.match(first.data.reply, station);
    await question.fill(
      "Which station did I say I was starting from? Repeat the name.",
    );
    const followUp = await submitAi("chat", "Send question");
    assert.deepEqual(followUp.input.history, [
      { role: "user", content: firstQuestion },
      { role: "assistant", content: first.data.reply },
    ]);
    assert.match(followUp.data.reply, station);
    const displayedReply = page
      .getByRole("log")
      .getByText(followUp.data.reply, { exact: true })
      .last();
    await displayedReply.waitFor();
    assert.equal(browserRequests, 3);
    assert.deepEqual(await getTrips(), before);

    await page.setViewportSize({ width: 320, height: 850 });
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByRole("button", { name: "中", exact: true }).click();
    await page
      .getByRole("heading", { name: "AI 旅行助手", exact: true })
      .waitFor();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await displayedReply.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, "chat-dark-mobile.png"),
      fullPage: true,
    });

    console.log(
      "Three AI browser calls (ms): itinerary",
      itinerary.elapsed,
      "chat",
      first.elapsed,
      "follow-up",
      followUp.elapsed,
    );
    console.log(
      "Verified three day headings, ordered conversation context, unchanged saved trip, and both themes.",
    );
    if (provider === "fixture") {
      const { headers: probeHeaders } = await register();
      for (const [message, expected] of [
        ["Fixture quota", 429],
        ["Fixture upstream failure", 502],
        ["Fixture oversized body", 502],
        ["Fixture slow body", 504],
      ]) {
        const response = await api.post("/api/v1/ai/chat", {
          headers: probeHeaders,
          data: { message },
        });
        assert.equal(response.status(), expected, message);
        const error = await response.json();
        assert.equal(error.code, expected);
        assert.equal(error.data, null);
        assert.doesNotMatch(error.message, /PRIVATE_FIXTURE_PAYLOAD/);
        console.log(message, "→", expected);
      }
    }
  },
);
