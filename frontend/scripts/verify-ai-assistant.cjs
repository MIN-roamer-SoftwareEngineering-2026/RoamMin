/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium, request } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const base = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
const output = path.resolve(process.env.QA_OUTPUT || "artifacts/ai-assistant");
const draft = {
  destination: "Fuzhou",
  days: 2,
  dailyItinerary: [
    {
      day: 1,
      title: "Old quarter",
      activities: [
        {
          name: "Sanfang Qixiang",
          description: "Explore the historic lanes.",
          estimatedCost: 0,
        },
      ],
    },
    {
      day: 2,
      title: "Lakeside",
      activities: [
        {
          name: "West Lake Park",
          description: "Walk along the lake.",
          estimatedCost: null,
        },
      ],
    },
  ],
  suggestions: ["Confirm museum hours before visiting."],
};

const ok = (route, data) =>
  route.fulfill({ status: 200, json: { code: 0, message: "success", data } });
const fail = (route, status, message) =>
  route.fulfill({ status, json: { code: status, message, data: null } });

test("AI assistant browser regression", async (t) => {
  const browser = await chromium.launch({
    executablePath: process.env.QA_BROWSER || undefined,
  });
  const api = await request.newContext({ baseURL: base });
  t.after(async () => {
    await api.dispose();
    await browser.close();
  });
  const suffix = Date.now();
  const registration = await api.post("/api/v1/auth/register", {
    data: {
      username: `aiqa${suffix}`,
      email: `aiqa-${suffix}@example.com`,
      password: "TravelTest!123",
    },
  });
  assert.equal(
    registration.status(),
    201,
    "The disposable backend must support registration",
  );
  const {
    data: { token },
  } = await registration.json();
  fs.mkdirSync(output, { recursive: true });

  async function open(caseTest, viewport = { width: 1440, height: 1000 }) {
    const context = await browser.newContext({ viewport });
    caseTest.after(() => context.close());
    await context.addInitScript((sessionToken) => {
      sessionStorage.setItem("min-roamer.token", sessionToken);
      localStorage.setItem("min-roamer.language", "en");
    }, token);
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    await page.goto(`${base}/ai`);
    await page
      .getByRole("heading", { name: "AI Assistant", exact: true })
      .waitFor();
    return page;
  }

  await t.test("redirects logged-out users to sign-in", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${base}/ai`);
      await page.waitForURL("**/login");
    } finally {
      await page.close();
    }
  });

  await t.test(
    "blocks missing destination, invalid days, and negative budget",
    async (caseTest) => {
      const page = await open(caseTest);
      let requests = 0;
      await page.route("**/api/v1/ai/generate-itinerary", (route) => {
        requests++;
        return route.abort();
      });
      const submit = page.getByRole("button", {
        name: "Generate itinerary",
        exact: true,
      });
      const destination = page.getByLabel("Destination", { exact: true });
      const days = page.getByLabel("Travel days");
      const budget = page.getByLabel("Budget (CNY, optional)");
      await submit.click();
      assert.equal(
        await destination.evaluate((input) => input.validity.valueMissing),
        true,
      );
      await destination.fill(" ");
      await submit.click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Enter a destination." })
        .waitFor();
      await destination.fill("Fuzhou");
      await days.fill("15");
      await submit.click();
      assert.equal(
        await days.evaluate((input) => input.validity.rangeOverflow),
        true,
      );
      await days.fill("2");
      await budget.fill("-1");
      await submit.click();
      assert.equal(
        await budget.evaluate((input) => input.validity.rangeUnderflow),
        true,
      );
      assert.equal(requests, 0);
    },
  );

  await t.test(
    "shows pending state, sends the authenticated request and renders a draft",
    async (caseTest) => {
      const page = await open(caseTest);
      let payload;
      let hasToken;
      let release;
      const responseGate = new Promise((resolve) => {
        release = resolve;
      });
      await page.route("**/api/v1/ai/generate-itinerary", async (route) => {
        payload = route.request().postDataJSON();
        hasToken = Boolean(await route.request().headerValue("authorization"));
        await responseGate;
        await ok(route, draft);
      });
      await page.getByLabel("Destination", { exact: true }).fill("Fuzhou");
      await page.getByLabel("Travel days").fill("2");
      await page.getByLabel("Budget (CNY, optional)").fill("1500");
      await page
        .getByLabel("Preferences (optional)", { exact: false })
        .first()
        .fill("History, Local food");
      await page
        .getByLabel("Additional requirements (optional)")
        .fill("Short walks");
      try {
        await page.getByRole("button", { name: "Generate itinerary" }).click();
        assert.equal(
          await page
            .getByRole("button", { name: "Generating itinerary…" })
            .isDisabled(),
          true,
        );
      } finally {
        release();
      }
      await page.getByText("Sanfang Qixiang", { exact: true }).waitFor();
      await page.getByText("West Lake Park", { exact: true }).waitFor();
      await page
        .getByText("Confirm museum hours before visiting.", { exact: true })
        .waitFor();
      await page.getByText(/Estimated cost/).waitFor();
      assert.ok(hasToken);
      assert.deepEqual(payload, {
        destination: "Fuzhou",
        days: 2,
        budget: 1500,
        preferences: ["History", "Local food"],
        requirements: "Short walks",
        language: "en",
      });
      await page.screenshot({
        path: path.join(output, "itinerary-light.png"),
        fullPage: true,
      });
    },
  );

  await t.test(
    "shows a provider timeout and retries the itinerary",
    async (caseTest) => {
      const page = await open(caseTest);
      let attempts = 0;
      await page.route("**/api/v1/ai/generate-itinerary", (route) =>
        ++attempts === 1
          ? fail(route, 504, "AI provider took too long to respond.")
          : ok(route, draft),
      );
      await page.getByLabel("Destination", { exact: true }).fill("Fuzhou");
      await page.getByLabel("Travel days").fill("2");
      await page.getByRole("button", { name: "Generate itinerary" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "took too long" })
        .waitFor();
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByText("Sanfang Qixiang", { exact: true }).waitFor();
      assert.equal(attempts, 2);
    },
  );

  await t.test(
    "reports an Axios request deadline as a timeout",
    async (caseTest) => {
      const page = await open(caseTest);
      await page.evaluate(() => {
        const open = XMLHttpRequest.prototype.open;
        const send = XMLHttpRequest.prototype.send;
        const aiRequests = new WeakSet();
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
          if (String(url).endsWith("/ai/chat")) aiRequests.add(this);
          return open.call(this, method, url, ...args);
        };
        XMLHttpRequest.prototype.send = function (...args) {
          if (aiRequests.has(this)) {
            this.dispatchEvent(new ProgressEvent("timeout"));
          } else {
            return send.apply(this, args);
          }
        };
      });
      await page.getByRole("button", { name: "Travel chat" }).click();
      await page.getByLabel("Travel question").fill("Where should I go?");
      await page.getByRole("button", { name: "Send question" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "took too long" })
        .waitFor();
      await page.getByRole("button", { name: "Try again" }).waitFor();
    },
  );

  await t.test(
    "keeps recent chat context in order and clears it on restart",
    async (caseTest) => {
      const page = await open(caseTest);
      const messages = [];
      await page.route("**/api/v1/ai/chat", (route) => {
        messages.push(route.request().postDataJSON());
        return ok(route, { reply: `Travel answer ${messages.length}` });
      });
      await page.getByRole("button", { name: "Travel chat" }).click();
      const question = page.getByLabel("Travel question");
      for (let turn = 1; turn <= 6; turn++) {
        await question.fill(`Trip question ${turn}`);
        await page.getByRole("button", { name: "Send question" }).click();
        await page
          .getByText(`Travel answer ${turn}`, { exact: true })
          .waitFor();
      }
      assert.deepEqual(messages[0].history, []);
      assert.deepEqual(
        messages[5].history,
        [2, 3, 4, 5].flatMap((turn) => [
          { role: "user", content: `Trip question ${turn}` },
          { role: "assistant", content: `Travel answer ${turn}` },
        ]),
      );
      await page
        .getByRole("button", { name: "Itinerary", exact: true })
        .click();
      await page.getByRole("button", { name: "Travel chat" }).click();
      await page.getByText("Travel answer 6", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Clear chat" }).click();
      assert.equal(
        await page.getByText("Travel answer 6", { exact: true }).count(),
        0,
      );
      await question.fill("New trip?");
      await page.getByRole("button", { name: "Send question" }).click();
      await page.getByText("Travel answer 7", { exact: true }).waitFor();
      assert.deepEqual(messages[6].history, []);
      await page.reload();
      await page.getByRole("button", { name: "Travel chat" }).click();
      assert.equal(
        await page.getByText("Travel answer 7", { exact: true }).count(),
        0,
      );
    },
  );

  await t.test(
    "shows chat loading and a network failure, retaining the question for retry",
    async (caseTest) => {
      const page = await open(caseTest);
      let attempts = 0;
      let release;
      const responseGate = new Promise((resolve) => {
        release = resolve;
      });
      await page.route("**/api/v1/ai/chat", async (route) => {
        if (++attempts === 1) {
          await responseGate;
          await route.abort();
        } else {
          await ok(route, {
            reply: "Ask the station about the accessible entrance.",
          });
        }
      });
      await page.getByRole("button", { name: "Travel chat" }).click();
      const question = page.getByLabel("Travel question");
      await question.fill(" ");
      await page.getByRole("button", { name: "Send question" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Enter a travel question" })
        .waitFor();
      await question.fill("Is there an accessible entrance?");
      try {
        await page.getByRole("button", { name: "Send question" }).click();
        await page
          .getByRole("status")
          .filter({ hasText: "Preparing a reply" })
          .waitFor();
        assert.equal(await question.isDisabled(), true);
      } finally {
        release();
      }
      await page
        .getByRole("alert")
        .filter({ hasText: "Check your connection" })
        .waitFor();
      assert.equal(
        await question.inputValue(),
        "Is there an accessible entrance?",
      );
      await page.getByRole("button", { name: "Try again" }).click();
      await page
        .getByText("Ask the station about the accessible entrance.")
        .waitFor();
      assert.equal(attempts, 2);
    },
  );

  await t.test(
    "supports dark theme, Chinese copy and a 320px viewport",
    async (caseTest) => {
      const page = await open(caseTest, { width: 320, height: 850 });
      await page.getByRole("button", { name: "Dark", exact: true }).click();
      await page.getByRole("button", { name: "中", exact: true }).click();
      await page
        .getByRole("heading", { name: "AI 旅行助手", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "旅行问答", exact: true }).click();
      await page.route("**/api/v1/ai/chat", (route) => {
        assert.equal(route.request().postDataJSON().language, "zh");
        return ok(route, {
          reply: "可以考虑参观市内博物馆。出发前请确认开放时间和预约要求。",
        });
      });
      await page
        .getByLabel("旅行问题", { exact: true })
        .fill("福州雨天可以去哪里？");
      await page.getByRole("button", { name: "发送问题" }).click();
      await page.getByText(/市内博物馆/).waitFor();
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "dark",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(output, "chat-dark-mobile.png"),
        fullPage: true,
      });
    },
  );
});
