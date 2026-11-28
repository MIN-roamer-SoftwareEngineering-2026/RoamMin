# E 组 · Issue #19 功能证据（11/23 整合日）

- 被测版本：`main` @ **`a7d70ff`**（`fix(start): 启动后默认打开首页而不是登录页 (#23)`）
- 被测时间：2026-11-23 19:45–19:52（本地真实运行，非 mock）
- 后端：Spring Boot，`--server.port=8080`，H2 内存库（`jdbc:h2:mem:roammin`）
- 前端：Vite 5.4.21 + React，`http://localhost:5173`，`/api` 代理到 8080
- 浏览器：Edge headless 1440×900（puppeteer-core）
- 脚本：`.tools/pptr/e-verify-1123.mjs`；原始结果：`verify-results.json`

## 一、结论

| 验收项（Issue #19） | 结果 | 证据 |
| --- | --- | --- |
| 选一项操作跑通（**搭子帖发布**） | ✅ 通过 | 02 → 03 |
| 操作后数据落库，刷新仍在 | ✅ 通过 | 04（刷新后列表仍含该帖） |
| 失败路径有提示，不出现白屏 | ✅ 通过 | 07（接口 500 → 页面 `role=alert` 显示错误，DOM 未空） |
| 截图 2 张 + 数据说明 | ✅ 已备 7 张 + 本文 | 01~07 |

**自动断言 10 项全过**（`total=10 pass=10 fail=0`）：

```
PASS | register owner/viewer
PASS | POST /buddy 空标题 -> 400        {"code":400,"message":"description is invalid"}
PASS | POST /buddy 未登录 -> 401
PASS | DELETE 他人搭子帖 -> 403          {"code":403,"message":"Cannot delete another user's post"}
PASS | 清理种子帖 -> 2xx
PASS | UI 发布搭子帖                   列表出现新帖
PASS | UI 刷新后数据仍在
PASS | UI 删除搭子帖                   删除确认后列表回到空状态
PASS | UI 失败路径有提示、不白屏        alert=true text="simulated failure" rootChildren=1
PASS | 页面无 JS 报错 / 无 5xx
```

> 口径说明（界面层）：本轮 UI 验证用 **H2 内存库**，证明的是「**刷新后数据仍在**」。
> 「**重启后仍在**」另用 H2 文件库单独验证并**通过**：见 [`数据落库-重启验证.md`](数据落库-重启验证.md)（`WRITE_DELAY=0`，强杀 JVM 后重启仍能读回该帖）。
> 本机坑：默认 `./data/minroamer` 或继承只读属性的旧 `.mv.db` 会报 `SQL Error 90097 database is read only`，换全新目录即可写。

## 二、搭子帖主链路（截图顺序）

> 版本跟进（11/23 20:10）：`main` 已前进到 `a9f2be8`（PR #24 目的地页面，改了 `App.tsx` 路由与 i18n，未动 E 模块）。
> 本分支已合并 `a9f2be8`，并把两份脚本在**新 main** 上重跑：**24/24 仍全部通过**（截图仍保留 `a7d70ff` 基线那一轮，避免 PR 膨胀）。

| 图 | 操作 | 实际结果 |
| --- | --- | --- |
| 01 | 登录 → 我的空间 → 「我的搭子帖」页签 | 空状态正常渲染，计数 0 |
| 02 | 点「发布结伴计划」，填标题/目的地/日期/简介 | 表单可用，日期控件正常 |
| 03 | 提交 | 列表出现「周末去平潭看海，找两个搭子」，计数 0 → 1，右侧「我的搭子帖 01」同步 |
| 04 | **刷新页面** | 帖子仍在（数据已落库） |
| 05 | 点「删除」 | 弹出二次确认对话框 |
| 06 | 确认删除 | 回到空状态，计数 1 → 0 |

数据流：`POST /api/v1/buddy` → `BuddyPost` 实体落 H2 → `GET /api/v1/buddy/mine` 回读 → `DELETE /api/v1/buddy/{id}`。

## 三、失败路径

| 场景 | 期望 | 实际 |
| --- | --- | --- |
| 空标题/空简介提交 | 400 + 可读提示 | `{"code":400,"message":"description is invalid"}` |
| 未登录调用 `POST /buddy` | 401 | 401 |
| 删除他人帖子 | 403 | `{"code":403,"message":"Cannot delete another user's post"}` |
| 接口整体不可用（500）| 页面有提示不白屏 | 顶部 `role=alert` 显示 `simulated failure`，`#root` 仍有内容，无空白页 |

## 四、遗留问题（已作为 #19 阻塞/风险登记）

1. **匿名访客看不到公开行程**：`GET /api/v1/trips/public` 未登录返回 401，与 SRS §2.2/§3.3「访客可浏览公开内容」不符（`SecurityConfig` 只放行了 `/api/v1/community/**`）。
2. **没有搭子广场 / 目的地筛选**：SRS FR-SOC-08 要求，当前只有「我的搭子帖」列表。
3. **搭子帖字段不全**：无 `endDate`、无人数，无 `PUT /buddy/{id}` 修改接口。
4. **社区前端（PR #2 `module-e`）未合入**：54 文件独立 `e-module/`，需按「一个 PR ≤20 文件」拆分。

## 五、发布行程 + 收藏（11/23 补跑，截图 08~15）

同一版本 `a7d70ff`，脚本 `.tools/pptr/e-verify-trip-favorite.mjs`，结果 `verify-results-trip-favorite.json`（**14/14 通过**）。

| 图 | 操作 | 实际结果 |
| --- | --- | --- |
| 08 | 我的行程 → 创建行程，填标题/目的地/起止日期 | 表单校验正常 |
| 09 | 提交 | 创建成功，可见性「仅自己和成员可见」，公开列表不含该行程 |
| 10 | 点「发布」 | 可见性变「公开」 |
| 11 | 用另一个账号打开 `/users/{ownerId}` | 公开行程卡片出现「收藏」按钮 |
| 12 | 点「收藏」 | 按钮变「取消收藏」 |
| 13 | 我的空间 → 我的收藏 | 列表含该行程，计数 0 → 1 |
| 14 | **刷新**（右下角带刷新时刻标注，避免与 13 像素相同被误认成复制） | 收藏仍在 |
| 15 | 点「取消收藏」 | 收藏列表清空 |

接口断言：重复收藏幂等（`count=1`）、收藏未公开行程 404、日期倒置 400、未登录 `GET /trips/public` 401（已知偏差）。

## 六、复现命令

```powershell
# 1. 后端（标准端口 8080 + 内存库）
cd RoamMin\backend
$env:JAVA_HOME='<repo>\\.tools\\jdk-17.0.2'
& "$env:JAVA_HOME\\bin\\java.exe" -jar target\\min-roamer-api-0.1.0-SNAPSHOT.jar `
  --server.port=8080 "--spring.datasource.url=jdbc:h2:mem:roammin;DB_CLOSE_DELAY=-1"

# 2. 前端（默认 vite.config.ts 把 /api 代理到 8080）
cd RoamMin\frontend
node node_modules\\vite\\bin\\vite.js --config vite.local.config.ts

# 3. 跑验证脚本（仓库内，见第七节）
cd RoamMin\frontend
node scripts\verify-community.cjs
```

## 七、可复现脚本（仓库内）

`frontend/scripts/verify-community.cjs`（与 C 组 `verify-destination.cjs` 同一套约定：Playwright Core + Edge，全部参数可用环境变量覆盖）。

```powershell
# 前置：后端 8080 + 前端 5173 已启动（见第六节）；本机需有 Playwright Core
#   pnpm add playwright-core        （或 npm i playwright-core）
$env:PLAYWRIGHT_MODULE = '<path-to>/node_modules/playwright-core'   # 可选，默认按包名 require("playwright")
$env:QA_BASE_URL = 'http://localhost:5173'
$env:QA_API_URL  = 'http://127.0.0.1:8080/api/v1'
$env:QA_OUTPUT   = 'artifacts/community'                            # 截图输出目录
$env:QA_VERSION  = 'a7d70ff'                                        # 截图文件名里的版本号

node frontend/scripts/verify-community.cjs
```

脚本断言：发布搭子帖 → 刷新仍在 → 删除确认回到空状态；创建行程默认私有 → 发布变公开 → 他人主页收藏 → 我的收藏 → 刷新仍在；失败路径 400/401/403，以及接口 500 时页面出现 `role=alert` 且不白屏。任一断言失败脚本以非 0 退出。

> 本目录 15 张截图是用 `.tools/pptr/` 下的等价脚本（puppeteer-core）生成的；入库的这份用 Playwright Core 重写了同样步骤，2026-11-23 21:03 在 `main@85155aa` 上跑通（13 张截图 + 全部断言通过，退出码 0）。
