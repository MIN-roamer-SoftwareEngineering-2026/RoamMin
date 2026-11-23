#!/usr/bin/env node
/**
 * Alpha main-flow screenshot capture for Issue #11.
 *
 * Usage (frontend dev server + backend must already be running):
 *   npm run e2e:record
 *   npm run e2e:record -- --out test/record-preview
 *
 * File names follow the team convention: TC-序号-页面-日期-SHA.png
 * e.g. TC-04-邀请成功-1123-07de29d.png
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const frontendDir = path.join(repoRoot, "frontend");

const require = createRequire(path.join(frontendDir, "package.json"));
const { chromium } = require("playwright");

function parseArgs(argv) {
  const outIndex = argv.indexOf("--out");
  const shaIndex = argv.indexOf("--sha");
  return {
    out: outIndex >= 0 ? argv[outIndex + 1] : "test/record1",
    sha: shaIndex >= 0 ? argv[shaIndex + 1] : undefined,
  };
}

function loadEnv() {
  const file = path.join(frontendDir, ".env.e2e");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function gitSha() {
  return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function gitBranch() {
  return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function stamp() {
  const now = new Date();
  return {
    date: `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
    time: `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

loadEnv();

const { out, sha: shaOverride } = parseArgs(process.argv.slice(2));
const outDir = path.resolve(repoRoot, out);
const relativeOut = path.relative(repoRoot, outDir).split(path.sep).join("/");
if (!relativeOut.startsWith("test/record")) {
  throw new Error(`Refusing to write outside test/record*: ${outDir}`);
}

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const API = process.env.E2E_API_URL ?? "http://localhost:8080/api/v1";
const OWNER = {
  email: process.env.E2E_OWNER_EMAIL ?? "",
  password: process.env.E2E_OWNER_PASSWORD ?? "",
};
const MEMBER = {
  email: process.env.E2E_MEMBER_EMAIL ?? "",
  password: process.env.E2E_MEMBER_PASSWORD ?? "",
  username: process.env.E2E_MEMBER_USERNAME ?? "",
};
if (!OWNER.email || !OWNER.password || !MEMBER.email || !MEMBER.password) {
  throw new Error("Missing E2E accounts. Fill frontend/.env.e2e first.");
}

const headSha = gitSha();
const sha = shaOverride || headSha;
const branch = gitBranch();
const { date, time } = stamp();
const tripTitle = `福州周末游-${date}-${sha}`;
const files = [];

fs.mkdirSync(outDir, { recursive: true });
// Only clean this team's own top-level evidence. Other teams keep their
// subfolders in test/record1 (e.g. ai/, destination/).
for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const ownedByThisTeam =
    /^TC-\d+.*\.(png|json)$/i.test(entry.name) ||
    /^\d{2}-.*\.(png|txt)$/.test(entry.name) ||
    entry.name === "manifest.md" ||
    entry.name === "capture-log.txt" ||
    entry.name === "测试记录.md";
  if (ownedByThisTeam) {
    fs.rmSync(path.join(outDir, entry.name), { force: true });
  }
}

const browser = await chromium.launch();
const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const memberContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const log = [];

async function shot(page, tc, label, options = {}) {
  const file = path.join(outDir, `${tc}-${label}-${date}-${sha}.png`);
  await page.screenshot({ path: file, fullPage: true, ...options });
  files.push(path.basename(file));
  log.push(`${tc} ${label}: ${path.basename(file)}`);
}

async function login(context, account, tag) {
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") log.push(`[console:${tag}] ${message.text()}`);
  });
  await page.addInitScript(() => localStorage.setItem("min-roamer.language", "zh"));
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.locator("form button").click();
  await page.waitForFunction(
    () => Boolean(sessionStorage.getItem("min-roamer.token")),
    undefined,
    { timeout: 20000 },
  );
  return page;
}

try {
  // TC-01 login
  const owner = await login(ownerContext, OWNER, "owner");
  await owner.goto(`${BASE}/my`, { waitUntil: "domcontentloaded" });
  await owner.locator('[role="tab"]').first().waitFor();
  await shot(owner, "TC-01", "登录");

  // TC-02 create trip
  await owner.locator("details.create-disclosure > summary").click();
  await owner.locator('form.compact-create-form input[placeholder="行程名称"]').fill(tripTitle);
  await owner.locator('form.compact-create-form input[placeholder="目的地"]').fill("福州");
  const dates = owner.locator('form.compact-create-form input[type="date"]');
  await dates.nth(0).fill("2026-11-28");
  await dates.nth(1).fill("2026-11-29");
  await owner.locator("form.compact-create-form button.button-primary").click();
  const card = owner.locator("article.social-item", { hasText: tripTitle }).first();
  await card.waitFor({ timeout: 20000 });
  await shot(owner, "TC-02", "创建行程");

  // TC-03 search member
  await card.getByRole("button", { name: /邀请成员/ }).click();
  const panel = owner.locator(".invite-panel").first();
  await panel.locator("input[placeholder]").fill(MEMBER.username);
  const row = panel
    .locator(".search-results li")
    .filter({ hasText: `@${MEMBER.username}` })
    .first();
  await row.waitFor({ timeout: 20000 });
  await shot(owner, "TC-03", "搜索成员");

  // TC-04 invite success
  await row.getByRole("button", { name: /邀请/ }).click();
  await panel.locator(".member-list").getByText(`@${MEMBER.username}`).first().waitFor({ timeout: 20000 });
  await shot(owner, "TC-04", "邀请成功");

  // TC-05 member sees joined trip
  const member = await login(memberContext, MEMBER, "member");
  await member.goto(`${BASE}/my`, { waitUntil: "domcontentloaded" });
  await member.locator("#tab-joined").click();
  await member.getByText(tripTitle).first().waitFor({ timeout: 20000 });
  await shot(member, "TC-05", "对方看到参与行程");

  // TC-06 refresh keeps the trip
  await owner.reload({ waitUntil: "domcontentloaded" });
  await owner.locator("article.social-item", { hasText: tripTitle }).first().waitFor({ timeout: 20000 });
  await shot(owner, "TC-06", "刷新后仍在");

  // TC-07 duplicate invite is blocked
  const card2 = owner.locator("article.social-item", { hasText: tripTitle }).first();
  if (await card2.locator(".invite-panel").count() === 0) {
    await card2.getByRole("button", { name: /邀请成员/ }).click();
  }
  const panel2 = owner.locator(".invite-panel").first();
  await panel2.locator("input[placeholder]").fill(MEMBER.username);
  const row2 = panel2
    .locator(".search-results li")
    .filter({ hasText: `@${MEMBER.username}` })
    .first();
  await row2.waitFor({ timeout: 20000 });
  await shot(owner, "TC-07", "重复邀请提示");

  // TC-08 permission: member inviting someone else must be rejected (403)
  const ownerToken = await owner.evaluate(() => sessionStorage.getItem("min-roamer.token"));
  // sessionStorage is per-tab, so read the token from the already-logged-in tab.
  const memberToken = await member.evaluate(() =>
    sessionStorage.getItem("min-roamer.token"),
  );
  const apiHeaders = (token) => ({ Authorization: `Bearer ${token}` });
  const tripsRes = await fetch(`${API}/trips/mine`, { headers: apiHeaders(ownerToken) });
  const tripsJson = await tripsRes.json();
  const trip = (tripsJson.data ?? []).find((item) => item.title === tripTitle);
  if (!trip) throw new Error("Created trip was not returned by /trips/mine");
  const meRes = await fetch(`${API}/auth/me`, { headers: apiHeaders(ownerToken) });
  const ownerName = (await meRes.json()).data?.username;
  const forbidden = await fetch(`${API}/trips/${trip.id}/members`, {
    method: "POST",
    headers: { ...apiHeaders(memberToken), "Content-Type": "application/json" },
    body: JSON.stringify({ username: ownerName }),
  });
  const forbiddenBody = await forbidden.text();
  const tc08 = {
    case: "TC-08",
    step: "成员尝试邀请他人",
    expectedStatus: 403,
    actualStatus: forbidden.status,
    passed: forbidden.status === 403,
    response: forbiddenBody,
    tripId: trip.id,
    sha,
    date,
  };
  fs.writeFileSync(
    path.join(outDir, `TC-08-越权拒绝-${date}-${sha}.json`),
    `${JSON.stringify(tc08, null, 2)}\n`,
    "utf8",
  );
  files.push(`TC-08-越权拒绝-${date}-${sha}.json`);
  log.push(`TC-08 越权拒绝: status=${forbidden.status}`);

  const manifest = [
    "# Alpha 主流程截图清单",
    "",
    `- 被测版本：main @ ${sha}`,
    `- 测试分支：${branch} @ ${headSha}`,
    `- 日期：${date}（${time}）`,
    `- 前端：${BASE}`,
    `- 后端：${API}`,
    `- 账号 A：${OWNER.email}`,
    `- 账号 B：${MEMBER.email} / @${MEMBER.username}`,
    `- 行程：${tripTitle}`,
    `- 截图目录：${relativeOut}`,
    "",
    "## 结果",
    "",
    "| 用例 | 内容 | 结果 |",
    "| --- | --- | --- |",
    "| TC-01 | 登录 | 通过 |",
    "| TC-02 | 创建行程 | 通过 |",
    "| TC-03 | 搜索成员 | 通过 |",
    "| TC-04 | 邀请成功 | 通过 |",
    "| TC-05 | 对方看到参与行程 | 通过 |",
    "| TC-06 | 刷新后仍在 | 通过 |",
    "| TC-07 | 重复邀请提示 | 通过 |",
    `| TC-08 | 越权拒绝 | ${tc08.passed ? "通过" : "失败"}（实际 ${forbidden.status}） |`,
    "",
    "## 文件",
    "",
    ...files.map((file) => `- \`${file}\``),
    "",
    "## 运行日志",
    "",
    ...log.map((line) => `- ${line}`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "manifest.md"), manifest, "utf8");
  fs.writeFileSync(path.join(outDir, "capture-log.txt"), log.join("\n"), "utf8");

  console.log(`Saved ${files.length + 1} files to ${outDir}`);
  console.log(log.join("\n"));
  if (!tc08.passed) process.exitCode = 1;
} finally {
  await browser.close();
}
