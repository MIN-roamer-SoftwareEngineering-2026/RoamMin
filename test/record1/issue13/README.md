# Issue #13 证据：地点/天气接口核对

- 被测版本：`main@a9f2be8`（补丁验证）；合并后复测 `main@85155aa`
- 结论：**阻塞**（地点前端兜底已完成；天气与真实地点成功响应未提供）
- 代码 PR：[#27](https://github.com/MIN-roamer-SoftwareEngineering-2026/RoamMin/pull/27)，已 squash 合并 `85155aa`
- 完整证据包（23 张截图、`baseline/results.json`、`verified/results.json`、`place-fallback.patch`、`reproduce.py`）：见 Issue #13 评论中的 zip 链接（commit `00f6fdf`，历史提交，链接稳定）。按评审要求，本 PR 只带 PNG + README，不带 3.3MB zip。

## 场景与截图

| 场景 | HTTP/失败 | 页面行为 | 截图 |
| --- | --- | --- | --- |
| 真实后端匿名 | 401 | 列表/详情回退样例 | `04-real-401-list-1123-a9f2be8.png` |
| HTTP 200，记录只有 `id`（修复前） | 200 | 列表/详情白屏，`Cannot read properties of undefined (reading 'zh')` | `01-incomplete-before-1123-a9f2be8.png` |
| HTTP 200，记录只有 `id`（修复后） | 200 | 回退样例 | `02-incomplete-after-1123-a9f2be8.png` |
| HTTP 503 | 503 | 回退样例 | `05-503-list-1123-a9f2be8.png` |
| 响应超时 | `net::ERR_ABORTED`，约 15.3s | 回退样例 | `06-timeout-list-1123-a9f2be8.png` |
| 完整模拟成功响应 | 200 fixture | 展示接口数据 | `03-valid-list-1123-a9f2be8.png` |
| 合并后缺字段列表 | 200 + `[{id}]` | 8 张样例回退，badge「本地样例数据」，0 pageerror | `07-merged-incomplete-list-1123-85155aa.png` |
| 合并后缺字段详情 | 200 + `{id}` | 三坊七巷，6 项 facts，0 pageerror | `08-merged-incomplete-detail-1123-85155aa.png` |

## 接口返回与样例的对应关系

响应统一为 `{ code, message, data }`，前端 `unwrap` 取 `data`：

- 列表：`data` 是 `Destination[]`；详情：`data` 是 `Destination`。
- 前端 `isDestination` 校验字段；字段与 `frontend/src/data/destinations.ts` 的 `DESTINATION_SAMPLES` 一一对应：

| 接口字段 | 样例字段 | 说明 |
| --- | --- | --- |
| `id` | `id` | 详情路由 `/destinations/:id` |
| `name.zh` / `name.en` | `name` | 双语名称 |
| `category` | `category` | `heritage` / `nature` / `urban` / `island`，必须在 `CATEGORY_ORDER` 内 |
| `district`、`address`、`summary`、`ticket`、`duration`、`hours`、`bestSeason` | 同名字段 | 均为 `{ zh, en }` |
| `highlights[]`、`tags[]` | 同名字段 | 均为 `{ zh, en }` 数组 |
| `coords.lat` / `coords.lng` | `coords` | 数字 |
| `heat` | `heat` | 数字，列表排序用 |

校验失败、空列表或请求失败时，列表回退 `DESTINATION_SAMPLES`，详情回退已知样例；未知 id 返回 `null`，页面显示未找到。

当前真实接口：`backend/src/main/java/com/minroamer` 下没有地点/天气控制器，`docs/API.md` 没有契约；匿名 401、带 JWT 500。`success-fixture.json` 是模拟成功响应，不是真实服务返回。

## 合并后复测（main@85155aa）

- `pnpm run lint` / `pnpm run build`：通过（4703 modules，472.24 kB JS / 84.15 kB CSS，3.88s）。
- 缺字段列表：8 张样例回退，badge「本地样例数据」，0 pageerror。
- 缺字段详情：三坊七巷，6 项 facts，0 pageerror。
- HTTP 503：列表回退 8 张样例（同 UI，未另截图）。

## 复现

完整步骤见 Issue #13 评论中的证据包 `README.md` 与 `reproduce.py`。前端 `npm run preview`、后端 `mvn spring-boot:run`，Playwright 脚本使用本地 Chromium。
