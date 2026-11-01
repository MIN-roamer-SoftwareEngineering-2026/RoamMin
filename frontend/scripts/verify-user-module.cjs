// Run against a disposable backend database. See docs/USER_MODULE.md.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.QA_BROWSER || undefined,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
  const output = path.resolve(process.env.QA_OUTPUT || "artifacts/user-module");
  fs.mkdirSync(output, { recursive: true });
  const suffix = Date.now();
  const email = `traveler-${suffix}@example.com`;
  try {
    await page.goto(`${base}/profile`);
    await page.waitForURL("**/login");
    await page.getByRole("link", { name: "注册", exact: true }).last().click();
    await page.getByLabel("用户名", { exact: true }).fill(`traveler${suffix}`);
    await page.getByLabel("邮箱", { exact: true }).fill(email);
    await page.getByLabel("密码", { exact: true }).fill("Travel2026!");
    await page.getByLabel("确认密码", { exact: true }).fill("Travel2026?");
    await page.getByRole("button", { name: "注册", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "两次输入的密码不一致" })
      .waitFor();
    await page.getByLabel("确认密码", { exact: true }).fill("Travel2026!");
    await page.getByRole("button", { name: "注册", exact: true }).click();
    await page.waitForURL("**/profile");
    await page.getByLabel("昵称", { exact: true }).fill("山海漫游者");
    await page
      .getByLabel("个人简介", { exact: true })
      .fill("喜欢城市漫步、山野与街巷里的小店。下一站，福州。");
    await page
      .getByLabel("上传头像", { exact: true })
      .setInputFiles({
        name: "invalid.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("not an image"),
      });
    await page
      .getByRole("alert")
      .filter({ hasText: "请选择 PNG 或 JPEG" })
      .waitFor();
    await page
      .getByLabel("上传头像", { exact: true })
      .setInputFiles(path.resolve("public/images/mountains.jpg"));
    await page.getByRole("status").filter({ hasText: "头像已更新" }).waitFor();
    assert.equal(
      await page.getByLabel("昵称", { exact: true }).inputValue(),
      "山海漫游者",
      "Avatar upload must preserve nickname draft",
    );
    assert.match(
      await page.getByLabel("个人简介", { exact: true }).inputValue(),
      /下一站/,
    );
    await page.getByRole("button", { name: "保存资料", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "资料已保存" }).waitFor();
    await page.screenshot({
      path: path.join(output, "profile-desktop.png"),
      fullPage: true,
    });
    await page.reload();
    await page.getByLabel("昵称", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("昵称", { exact: true }).inputValue(),
      "山海漫游者",
    );
    await page.getByRole("link", { name: "返回我的空间" }).click();
    await page.getByRole("heading", { name: /山海漫游者/ }).waitFor();
    await page
      .getByRole("heading", { name: "下一段旅程，从这里开始" })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "home-desktop.png"),
      fullPage: true,
    });
    await page.getByRole("tab", { name: /我的收藏/ }).click();
    await page
      .getByRole("heading", { name: "为下一次出发，存一点灵感" })
      .waitFor();
    await page.getByRole("tab", { name: /参与的行程/ }).click();
    await page.getByRole("heading", { name: "期待下一次同行" }).waitFor();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page
      .getByRole("heading", { name: "Your next adventure together" })
      .waitFor();
    await page.reload();
    await page.getByRole("link", { name: "My space", exact: true }).waitFor();
    await page.getByRole("button", { name: "中", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "home-mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Mobile must not overflow horizontally",
    );
    await page.getByRole("link", { name: "个人资料", exact: true }).click();
    await page.screenshot({
      path: path.join(output, "profile-mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Mobile profile must not overflow",
    );
    await page.route("**/api/v1/auth/me", (route) => route.abort());
    await page.reload();
    await page
      .getByRole("alert")
      .filter({ hasText: "暂时无法恢复登录状态" })
      .waitFor();
    assert.ok(
      await page.evaluate(() => sessionStorage.getItem("min-roamer.token")),
      "Network error must keep token",
    );
    await page.unroute("**/api/v1/auth/me");
    await page.getByRole("button", { name: "重新加载", exact: true }).click();
    await page.getByLabel("昵称", { exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "退出登录", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "确认", exact: true })
      .click();
    await page.waitForURL("**/login");
    await page.getByLabel("邮箱", { exact: true }).fill(email);
    await page.getByLabel("密码", { exact: true }).fill("wrongpass");
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.getByRole("alert").waitFor();
    await page.getByLabel("密码", { exact: true }).fill("Travel2026!");
    await page.getByRole("button", { name: "登录", exact: true }).click();
    // Logout happened on /profile: the route guard remembers that destination.
    await page.waitForURL("**/profile");
    await page.getByRole("link", { name: "查找旅伴", exact: true }).click();
    await page
      .getByRole("textbox", { name: "搜索用户", exact: true })
      .fill("no-user-with-this-name");
    await page.getByText("没有找到匹配用户。", { exact: true }).waitFor();
    // Populate the disposable database to verify real counts and another user's profile.
    const token = await page.evaluate(() =>
      sessionStorage.getItem("min-roamer.token"),
    );
    const request = async (method, url, data, authToken = token) => {
      const response = await page.request.fetch(`${base}/api/v1${url}`, {
        method,
        data,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.ok(response.ok(), `${method} ${url}: ${response.status()}`);
      return (await response.json()).data;
    };
    const other = await request("POST", "/auth/register", {
      username: `buddy${suffix}`,
      email: `buddy-${suffix}@example.com`,
      password: "Travel2026!",
    });
    await request(
      "PUT",
      "/users/me",
      {
        nickname: "沿海旅人",
        bio: "一起发现城市的另一面。",
        avatarUrl: "",
        language: "zh",
      },
      other.token,
    );
    await request("POST", "/trips", {
      title: "福州街巷漫游",
      destination: "福州",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
    });
    const shared = await request(
      "POST",
      "/trips",
      {
        title: "和朋友去看海",
        destination: "厦门",
        startDate: "2026-12-01",
        endDate: "2026-12-03",
      },
      other.token,
    );
    await request("PUT", `/trips/${shared.id}/publish`, undefined, other.token);
    await request(
      "POST",
      `/trips/${shared.id}/members`,
      { username: `traveler${suffix}` },
      other.token,
    );
    await request("POST", `/trips/${shared.id}/favorite`);
    await request("POST", "/buddy", {
      title: "周末城市漫步",
      destination: "福州",
      travelDate: "2026-11-20",
      description: "一起走走街巷，寻找当地小店。",
    });
    await page.goto(`${base}/my`);
    await page
      .getByRole("heading", { name: "福州街巷漫游", exact: true })
      .waitFor();
    assert.deepEqual(
      await page.locator(".space-stats button strong").allTextContents(),
      ["01", "01", "01", "01"],
    );
    await page.screenshot({
      path: path.join(output, "home-populated.png"),
      fullPage: true,
    });
    await page.getByRole("tab", { name: /参与的行程/ }).click();
    await page
      .getByRole("heading", { name: "和朋友去看海", exact: true })
      .waitFor();
    await page.getByRole("link", { name: "查找旅伴", exact: true }).click();
    await page
      .getByRole("textbox", { name: "搜索用户", exact: true })
      .fill(`buddy${suffix}`);
    await page.getByRole("link", { name: "查看主页", exact: true }).click();
    await page
      .getByRole("heading", { name: "沿海旅人", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "取消收藏", exact: true }).click();
    await page.getByRole("button", { name: "收藏行程", exact: true }).waitFor();
    await page.setViewportSize({ width: 320, height: 750 });
    await page.getByRole("button", { name: "EN", exact: true }).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "English profile at 320px must not overflow",
    );
    const invalidPassword = await page.request.post(
      `${base}/api/v1/auth/register`,
      {
        data: {
          username: `bad${suffix}`,
          email: `bad-${suffix}@example.com`,
          password: "中".repeat(25),
        },
      },
    );
    assert.equal(
      invalidPassword.status(),
      400,
      "Backend must enforce BCrypt UTF-8 byte limit",
    );
    assert.deepEqual(errors, [], "No uncaught browser exceptions");
    console.log(
      "PASS: registration validation, registration, avatar/draft preservation, profile save/reload, home/tabs, language persistence, mobile layouts, session retry, logout, wrong/correct login, user search.",
    );
    console.log(`Screenshots: ${output}`);
  } catch (error) {
    await page.screenshot({
      path: path.join(output, "failure.png"),
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
