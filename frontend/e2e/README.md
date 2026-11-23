# Alpha 主流程 E2E（B 组 · 邹佳妤）

最小 Playwright 回归：账号 A 创建福州示例行程 → 搜索账号 B → 邀请 B → 账号 B 在「我参与的行程」看到它。

## 一次性准备

```powershell
cd frontend
npm install
npx playwright install chromium
Copy-Item .env.e2e.example .env.e2e
```

打开 `frontend/.env.e2e`，填入两个 Alpha 测试账号（A 组陈杭提供）：

| 变量 | 含义 |
| --- | --- |
| `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD` | 账号 A（行程 Owner） |
| `E2E_MEMBER_EMAIL` / `E2E_MEMBER_PASSWORD` | 账号 B（被邀请成员） |
| `E2E_MEMBER_USERNAME` | 账号 B 的 username，邀请搜索用它匹配 |
| `E2E_TRIP_*` | 示例行程名前缀、目的地、起止日期 |

开跑前需要两个服务都在：

- 后端 Spring Boot :8080（见下方"已知约束 6"的 jar 启动方式）
- 前端 Vite :5173 —— **先手动起**，Playwright 不再自动拉起（本机 webServer 握手会挂起）

## 跑法

```powershell
# 终端 1：起前端
cd frontend
npm run dev

# 终端 2：跑测试
cd frontend

# 1) 环境自检（不需要后端和账号，先确认 Playwright 能驱动页面）
npm run e2e:smoke

# 2) 主流程（自动先跑 setup：两个账号各登录一次并保存登录态）
npm run e2e:main

# 3) 看 HTML 报告
npm run e2e:report

# 4) 一键重拍 8 步截图（前端 + 后端都在跑）
npm run e2e:record
```

`npm run e2e:record` 会自动：

- 从当前 `HEAD` 取 7 位 SHA，从系统时间取 `MMDD`；
- 按 `TC-序号-页面-日期-SHA.png` 命名（例：`TC-04-邀请成功-1123-07de29d.png`）；
- 覆盖写入 `test/record1/`，并生成 `manifest.md` 与 `capture-log.txt`；
- 同时输出 `TC-08-越权拒绝-<日期>-<SHA>.json`（接口状态码证据）。

想先试跑、不覆盖正式证据：

```powershell
npm run e2e:record -- --out test/record-preview
```

三个命令对应 Playwright 的三个 project：

| project | 文件 | 作用 |
| --- | --- | --- |
| `smoke` | `smoke.spec.ts` | 登录页能渲染，证明测试环境可用 |
| `setup` | `auth.setup.ts` | 两个账号各登录一次，保存 storageState + JWT |
| `main` | `main-flow.spec.ts` | 主流程用例，依赖 setup |

## 产物在哪

| 产物 | 位置 |
| --- | --- |
| 通过截图 | `test-results/<用例>/01-owner-trip-card.png`、`02-member-joined-trip.png` |
| HTML 报告 | `playwright-report/index.html` |
| 失败 trace | 失败时附加在报告里；也可在 `test-results/<用例>/<role>-trace.zip` |

看失败 trace：

```powershell
npx playwright show-trace test-results\<用例>\owner-trace.zip
```

## 11/22 本地预演结果

已用本机 H2 后端 + 两个本地测试账号跑通整套：

```text
npm run e2e  →  4 passed (7.1s)
  [smoke] login page renders
  [setup] sign in as owner
  [setup] sign in as member
  [main]  owner creates a Fuzhou trip, invites B, B sees the joined trip
```

产物：`test-results/main-flow-.../01-owner-trip-card.png`、`02-member-joined-trip.png`、`playwright-report/index.html`。

> 本地账号（`e2e.owner@example.com` / `e2e.member@example.com`）只存在于本机 `backend/data` 的 H2 里。
> 11/23 拿到陈杭的正式测试账号后，改 `frontend/.env.e2e` 再跑即可。

## 已知约束（和界面联调相关）

1. **JWT 在 sessionStorage**（`src/store/authStore.ts` 的 `min-roamer.token`）。Playwright 的 `storageState` 只保存 cookie + localStorage，所以 `auth.setup.ts` 额外存一份 token，`fixtures.ts` 用 `addInitScript` 注入。不要删这两个文件里的任何一步。
2. **界面是中英双语，默认中文**。测试统一把 `localStorage["min-roamer.language"]` 固定为 `en`，否则 placeholder 文案对不上。
3. **目前仓库没有 `data-testid`**，选择器集中在 `e2e/selectors.ts`。如果页面文案改了，只改这个文件；建议请王婧菱在创建表单、行程卡、邀请面板上补 testid，之后把 `selectors.ts` 换成 `[data-testid=...]` 即可。
4. **没有删除行程接口**，每跑一次会新增一条行程。用例用带时间戳的唯一标题，并按标题过滤，不要断言列表总数。
5. `test-results/`、`playwright-report/`、`e2e/.auth/` 都已加入 `.gitignore`，token 不会进仓库。
6. **后端不要用 `mvn spring-boot:run` 从中文路径启动**。本机仓库在 `E:\project\软工\...`，Maven 的 fork 会丢路径，报 `ClassNotFoundException: com.minroamer.MinRoamerApplication`（编译其实是成功的）。已验证可行的方式：

   ```powershell
   cd backend
   mvn -DskipTests package
   $env:JWT_SECRET = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   java -jar target\min-roamer-api-0.1.0-SNAPSHOT.jar
   ```

## 明天（11/23）建议顺序

1. 09:00 前：确认后端已起、两个账号能手工登录、`npm run e2e:smoke` 通过。
2. 09:00–10:00：填好 `.env.e2e`，跑 `npm run e2e:main`。首次失败通常是选择器或账号数据问题，按 trace 定位。
3. 跑通后立刻保存三样证据：owner 截图、member 截图、`playwright-report/index.html`。
4. 在 B 组 GitHub Issue 回一条：今天做了什么 / 状态 / 证据链接 / 阻塞。
5. 如果卡在 A/E 组接口，把「卡在哪、需要谁、是否影响演示」写清楚，不要自己硬改别人模块。

## Issue 回复模板

```text
今天做了什么：搭好 frontend/e2e Playwright 回归，跑通 smoke；主流程执行到 XX 步
状态：部分通过（5 项中 X 项通过）
证据：test-results/... 截图 / playwright-report / 录屏链接
阻塞：邀请接口返回 XXX，需要 E 组查实确认；不影响演示（可手工操作）
```
