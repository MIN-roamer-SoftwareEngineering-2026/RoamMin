# Issue #13 证据：地点/天气接口核对

- 被测版本：`main@a9f2be8`（2026-11-23）
- 结论：**阻塞**
- 完整证据包：`RoamMin-Issue13-evidence.zip`（23 张截图、`baseline/results.json`、`verified/results.json`、`place-fallback.patch`、`reproduce.py`）
- 说明：401、503、超时三种失败态在页面上都回退到同一个样例页，因此截图字节相同；差异以 `verified/results.json` 的 `http_status` 与 `seconds_from_interception` 为准。

## 场景

| 场景 | HTTP/失败 | 页面行为 | 截图 |
| --- | --- | --- | --- |
| 真实后端匿名 | 401 | 列表/详情回退样例 | `04-real-401-list-1123-a9f2be8.png` |
| HTTP 200，记录只有 `id`（修复前） | 200 | 列表/详情白屏，`Cannot read properties of undefined (reading 'zh')` | `01-incomplete-before-1123-a9f2be8.png` |
| HTTP 200，记录只有 `id`（修复后） | 200 | 回退样例 | `02-incomplete-after-1123-a9f2be8.png` |
| HTTP 503 | 503 | 回退样例 | `05-503-list-1123-a9f2be8.png` |
| 响应超时 | `net::ERR_ABORTED`，约 15.3s | 回退样例 | `06-timeout-list-1123-a9f2be8.png` |
| 完整模拟成功响应 | 200 fixture | 展示接口数据 | `03-valid-list-1123-a9f2be8.png` |

## 关键结论

1. `GET /api/v1/destinations` 与 `GET /api/v1/destinations/sanfang-qixiang`：匿名 401，带本地测试 JWT 500；同一 JWT 调 `GET /api/v1/auth/me` 返回 200。
2. `backend/src/main/java/com/minroamer` 下没有地点/天气控制器，`docs/API.md` 没有地点/天气契约；500 是“无路由 + 全局异常兜底”，不是接口内部报错。
3. `main@a9f2be8` 上缺字段会白屏；补丁 `place-fallback.patch`（1 文件，+57/−5）已在本地验证，**尚未合入 main**。
4. 天气：无路由、无契约、无前端入口，暂时无法采集成功响应或做兜底截图。

## 复现

完整步骤见 `README.md`（证据包根目录）与 `reproduce.py`。前端 `npm run preview`、后端 `mvn spring-boot:run`，Playwright 脚本使用本地 Chromium。
