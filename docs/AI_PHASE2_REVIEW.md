# MIN-roamer AI 旅行助手第二阶段复验报告

EE308FZ 软件工程 Alpha Sprint，2026 年 11 月 21 日（北京时间）。本轮目标是复验已实现的 `FR-AI-01` 至 `FR-AI-04`、修复确认的问题，并提供可复现的验收和 PR 材料。

## A. 结论

AI 旅行助手已通过本地回归和北京百炼 `qwen-plus` 真实端到端联调。真实联调覆盖浏览器登录、福州 3 天行程生成、1500 元预算输入、两轮旅行问答与上下文传递。测试前后读取同一测试账号的已保存行程并进行完整比较，结果一致。 [配置与复现指南](AI_ASSISTANT.md)

## B. 仓库与提交身份

- 目录与 Git 根目录均为 `/Users/yuhejiang/Documents/juniorTerm1/Software Engineering/RoamMin`。远端为 `https://github.com/MIN-roamer-SoftwareEngineering-2026/RoamMin.git`。
- 本地分支为 `feature/ai-assistant`、`main`。第二阶段开始时，只读 `git ls-remote --heads origin` 确认远端存在 `main`（`cddb26f`）和 `ch`（`b247298`），功能分支当时比 `origin/main` 多三个提交，起始工作区干净。
- 初期三个提交的 author 与 committer 均为 `Yuhe Jiang`，邮箱为由主机名推断的 `.local` 地址。交付时核对了已登录的 GitHub 账号 `yuhejiang929-cmd`，为本次新提交使用其 `noreply` 邮箱。GitHub 使用 author 邮箱进行归属匹配，旧提交的 GitHub 归属仍未验证。 [GitHub 提交邮箱说明](https://docs.github.com/en/account-and-profile/concepts/email-addresses)

| 已有提交 | 实际作者时间（UTC+8） | 内容 |
| --- | --- | --- |
| `3cfb570` | 2026-11-21 16:05:58 | 带认证的 Qwen 行程和问答接口及后端测试 |
| `2434c48` | 2026-11-21 16:06:23 | 中英双语界面、路由和浏览器测试 |
| `789d101` | 2026-11-21 16:08:30 | 配置指南、历史测试及 Sprint 报告 |
| `69428f3` | 2026-11-21 19:08:59 | 第二阶段的 AI JSON、供应商响应和超时修复及可复现测试 |

**安全修正选项。** 为后续提交设置本仓库的 `git config --local user.name "你的名字"`，以及 `git config --local user.email "GitHub 已验证邮箱或账号专用 noreply 地址"`，然后用 `git var GIT_AUTHOR_IDENT` 和 `git var GIT_COMMITTER_IDENT` 核对。旧提交可保留；若旧地址确实可收邮件，也可尝试把它添加并验证到自己的 GitHub 账号。若必须更正旧提交元数据，先取得明确批准并建本地备份引用，再在尚未共享的功能分支上使用 `git rebase -i origin/main` 将三个旧提交标为 `edit`，逐个执行 `git commit --amend --reset-author --no-edit` 和 `git rebase --continue`。这会改变提交哈希，需重新验证并更新 Sprint 记录。本轮没有执行历史修改。 [GitHub 配置提交邮箱](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)

## C. 代码审查结论

没有发现需阻断本地验收的 Critical 或 High 缺陷。下表按影响排列，路径相对于仓库根目录。

| 级别 | 位置 | 已核实的问题及影响 | 修复或后续处理 |
| --- | --- | --- | --- |
| Medium | `backend/src/main/java/com/minroamer/ai/AiJsonConfiguration.java` 的 `extendMessageConverters`，`AiController.java`、`AiRequestBodyAdvice.java` | 默认 JSON 绑定接受了尾随对象、重复键和部分标量转换。无效输入可进入供应商调用并使用配额。非 JSON 请求返回通用 500。 | 两个 AI DTO 使用专用严格 JSON 解析，返回 400。请求体转换阶段的媒体类型异常返回 415，沿用公共响应结构。 |
| Medium | `backend/src/main/java/com/minroamer/ai/QwenClient.java` 的 `complete` 和 `BoundedBodySubscriber` | 供应商响应原先由 `ofString()` 整体缓冲。模型 token 限制不能约束异常 HTTP 响应；没有声明长度的响应也可能占用过多内存。 | 收到 256 KiB 上限外的正文时取消订阅，返回通用 502。用不含 `Content-Length` 的响应测到 502。 |
| Medium | `backend/src/main/java/com/minroamer/ai/QwenClient.java` 的构造函数及 `parseTimeout` | 注入 `Duration` 时，格式错误的 `QWEN_TIMEOUT` 会在 Spring 创建组件时失败，影响非 AI 接口。 | 解析留在客户端配置阶段。实际启动 JAR 验证注册和资料接口可用，两个 AI 路由返回 503。 |
| Medium | `backend/src/main/java/com/minroamer/ai/QwenClient.java` 的 `complete` | 同时带有正文和显式 `refusal` 的供应商回复可被当成成功答案。 | 拒绝标志或非正常完成状态走 502，且不返回原始供应商内容。普通聊天文本仍按文本展示。 |
| Low | `backend/src/main/java/com/minroamer/ai/dto/ItineraryRequest.java` 的 `days`，`AiService.java` 的 `generate` | 10 天在供应商提示 JSON 中可被序列化为指数格式。依赖整数类型的解析器会得到非整数节点。 | 用整数 DTO 表达天数，严格拒绝小数输入。覆盖 10 天、14 天和范围边界。 |
| Low | `frontend/src/api/http.ts` 的错误拦截器与 `frontend/src/api/ai.ts` 的 `aiErrorKey` | Axios 客户端超时的错误码被拦截器丢弃，AI 界面提示检查网络，和后端超时提示不一致。 | 保留错误码并映射到已有的中英超时提示。Browser 测试在 XHR 超时事件后核对提示和重试按钮。 |
| Improvement suggestion | `backend/src/main/java/com/minroamer/ai/AiRequestLimiter.java` 的 `acquire` | 限额独立于每个后端实例，固定窗口边界允许短时集中请求。扩容时各实例会分别计数。 | Alpha 继续使用单实例限流。Beta 评估共享限额和百炼账户级预算控制。 |

## D. 改动与集成边界

- 后端修改 `AiController.java`、`AiRequestBodyAdvice.java`、`AiService.java`、`QwenClient.java`、`dto/ItineraryRequest.java`，新增 `AiJsonConfiguration.java`。在项目既有的 Spring MVC、Bean Validation、Jackson 和 Java HTTP Client 上实现。`backend/.env.example` 保留配置占位和可选默认值注释。
- 前端修改 `frontend/src/api/http.ts`、`frontend/src/api/ai.ts`。继续使用既有的 JWT 注入、401 处理、React Router 的 `ProtectedRoute`、中文/英语文案、主题与布局。测试覆盖加载、重试、错误、键盘可操作的原生控件、历史区显示，以及宽度 320px 的页面无横向溢出。屏幕阅读器实机体验仍待人工验证。
- 测试修改 `AiEndpointsTest.java`、`QwenClientTest.java` 和 `frontend/scripts/verify-ai-assistant.cjs`。新增 `backend/src/test/fixtures/qwen_https.py`、`frontend/scripts/verify-ai-https.cjs`、`scripts/verify-ai-https.sh`。真实后端 TLS 调用由本地 fixture 响应；组件回归则用 Playwright 拦截 AI 请求。
- 文档改动包括 `AI_ASSISTANT.md`、`AI_ALPHA_SPRINT.md`，新增本文和 `AI_ALPHA_PR.md`。模型调用没有数据库写入路径。导入草稿需要 Trip 团队确认日程活动模型、编辑权限与保存接口。地点匹配和地图展示需要地点团队的规范 ID 与坐标。

## E. 测试论文材料

目标是验证用例正确性、鉴权与费用控制、外部依赖异常隔离，以及既有账号、资料和行程功能的兼容性。环境使用 JDK 21（编译目标 Java 17）、Maven 3.9.11、Node.js 22、TypeScript/Vite、JUnit/MockMvc、Playwright/Chrome。浏览器联调使用 loopback、一次性 H2、临时 TLS 证书和随机测试账号。测试摘要留在 `.local/ai-phase2/`，后端表格引用汇总结果而非原始含测试调试数据的日志。

| 执行命令 | 结果 |
| --- | --- |
| `../.local/ai-tools/apache-maven-3.9.11/bin/mvn -B -ntp -o -Dmaven.repo.local=../.local/ai-tools/m2 clean package`（`backend/`） | 初始复验 36 通过、0 失败、0 跳过。最终 56 通过、0 失败、0 跳过，应用 JAR 构建成功。最终为接口 39、客户端 14、限流 3。 |
| `../.local/ai-tools/apache-maven-3.9.11/bin/mvn -B -ntp -o -Dmaven.repo.local=../.local/ai-tools/m2 -Dtest=AiEndpointsTest,QwenClientTest test`（`backend/`，修复前复现） | 51 项执行，10 失败。其中错误类型/尾随对象会进入服务，媒体类型错误为 500，10 天转为非整数 JSON 节点，显式拒绝被接收。部分旧路径的 500 由未返回有效数据的 mock 触发。 |
| `tsc -b`、`npm run build`、`npm run lint`、`node --check` 两份 AI 浏览器脚本 | 均通过。实际命令通过本地 Node/npm 可执行路径运行。 |
| `bash scripts/verify-ai-https.sh` 内的 `node --test scripts/verify-ai-https.cjs` | 1 个 HTTPS 端到端用例通过，0 失败、0 跳过。记录福州行程、两轮上下文、已有行程一致性、桌面浅色与移动深色。额外验证 429、502、超限 502 和分段慢响应 504。 |
| 同一脚本内的 `node --test scripts/verify-ai-assistant.cjs` | 8 个场景通过。Node 汇总包含父测试，共 9 通过、0 失败、0 跳过。 |
| 同一脚本内的 `node scripts/verify-user-module.cjs` | 原有用户模块浏览器回归通过，覆盖登录、资料、头像、搜索、行程及社交交互。仓库现有 Java 测试均为 AI 相关。 |
| `python3 .local/ai-phase2/verify-disabled.py` | 无凭据和错误超时配置两个实际 JAR 启动场景通过。基本应用接口正常，两个 AI 接口均返回 503。 |

| 用例 | SRS | 覆盖与结论 |
| --- | --- | --- |
| 行程表单、输入范围和输出结构 | FR-AI-01、FR-AI-04 | 正常 3、10、14 天，缺失/空白/超长目的地，超长偏好，负预算与小数精度，错误天数、重复键、尾随对象、错误类型和媒体类型均覆盖。供应商缺失字段、错误结构、不连贯天数、空行程和非 JSON 返回受控错误。额外字段未出现在客户端。 |
| 多轮问答和输入上限 | FR-AI-02、FR-AI-04 | 正确传递两轮历史，最多四轮已完成的往返。拒绝空白问题、超长问题、无效角色、历史过长及 96 KiB 以上请求。验证清空、刷新与状态渲染。 |
| 登录态、配额和凭据 | FR-AI-03、FR-AI-04 | 两个路由分别测试缺失、无效、过期 JWT，均 401 且未调用 Qwen。有效 JWT 通过，同一账号跨端点第七次调用返回 429。限流单测覆盖总量、并发和窗口重置。 |
| 供应商异常和超时 | FR-AI-04 | 覆盖拒绝、截断、上游失败、缺配置、429、502、504、响应体超限和浏览器超时提示。实测 HTTPS 端到端时长记录在浏览器日志；这些时长仅反映本地 fixture。 |
| 兼容和展示 | FR-AI-01、FR-AI-02 | 前后端构建、原用户模块回归、双语及双主题通过。创建厦门测试行程后进行 AI 操作，比较前后列表完全相同。 |

截断、拒绝、错误结构与传输超时属于不同失败条件，应分别验证。真实百炼联调已覆盖返回结构、模型调用、时延和页面显示。Beta 可增加网络条件测试、实机读屏和共享限额，草稿保存与行程模块分开评审。

## F. Qwen 与密钥核查

实际配置使用 `DASHSCOPE_API_KEY`、`QWEN_ENDPOINT`、`QWEN_MODEL`、`QWEN_TIMEOUT`，由后端发出 HTTPS `POST`，携带 Bearer key。请求包含 `model`、`messages`、`stream: false`、`enable_thinking: false` 和 `max_tokens`。行程请求启用 JSON Object 模式，后端从第一条完成结果的 `message.content` 取文本并按合同校验。成功使用标准百炼 Chat Completions 的前提是模型支持该模式、key 与 workspace/region 匹配，子工作区对所选标准模型具有调用权。 [百炼 Chat Completions](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions) · [结构化输出](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output) · [子工作区权限](https://www.alibabacloud.com/help/en/model-studio/model-calling-in-sub-workspace)

连接超时 5 秒，缺省总超时 45 秒，覆盖正文读取。行程与问答的输出上限分别为 6500 和 1000 tokens。服务端适用 96 KiB 请求、256 KiB 上游正文限制，以及单实例每账号每分钟 6 次、总计 30 次、在途 4 次。失败后由用户操作重试。浏览器生产 bundle、Git 历史和改动、配置模板、本地测试摘要及截图均检查了密钥暴露路径。前端未引用百炼环境变量，供应商错误正文经测试不会传到客户端，检查范围内未发现真实密钥。`.gitignore` 排除 `.env`、`.env.*`、本地工具和 QA 截图，保留无密钥的示例文件。

2026 年 11 月 21 日，钥匙串凭据成功查询了北京工作空间的模型列表。经用户授权，仅为该空间增加了 `qwen-plus` 推理权限，回查确认生效。账号实名认证完成前，浏览器行程请求返回应用层 HTTP 502，百炼直接探测返回 HTTP 403 `AccessDenied.Unpurchased`。按官方说明，这是账号级服务开通问题。 [配置指南](AI_ASSISTANT.md#run-a-live-check-locally) · [百炼错误码说明](https://help.aliyun.com/zh/model-studio/error-code/#accessdenied-unpurchased)

用户确认完成实名认证后，于 20:23:12（北京时间）使用同一钥匙串条目对北京地域的 `qwen-plus` 发送了一次最小结构化请求。HTTP 200，耗时 856 ms，返回预期 JSON `{"status":"ready"}`，百炼返回总用量 34 tokens。探测通过后运行 `AI_QA_PROVIDER=live node --test scripts/verify-ai-https.cjs`，1 个场景通过、0 失败、0 跳过。浏览器测得行程生成 12,850 ms、首轮问答 6,743 ms、追问 1,093 ms。福州三日草稿显示完整，追问正确复述福州站，已保存行程前后一致。共发出一次探测和三次联调推理请求。 [联调输出](../.local/ai-delivery/post-verification.log) · [真实行程截图](../frontend/artifacts/ai-phase2/live/itinerary-light.png) · [真实问答截图](../frontend/artifacts/ai-phase2/live/chat-dark-mobile.png)

## G. Sprint 证据与贡献

| 报告窗口 | 可证实事项 | 之后计划 |
| --- | --- | --- |
| 11 月 21–22 日 | 11 月 21 日的初期提交和第二阶段修复提交 `69428f3`，56 项后端测试、8 个 AI 浏览器场景、本地 TLS 验收和截图。实名认证完成后，北京百炼 `qwen-plus` 最小探测和真实端到端场景均通过。 | 提交团队评审，归档脱敏验收材料。 |
| 11 月 23–24 日 | 截至本报告暂无该期间证据。 | 如果完成，保留真实百炼模型 ID、三个请求的结果、延迟和脱敏截图。 |
| 11 月 25–26 日 | 截至本报告暂无该期间证据。 | 如果完成，记录同伴评审、实际 Issue/PR 和最后一轮回归。 |
| 11 月 27–28 日 | 截至本报告暂无该期间证据。 | 记录已批准的交付版本、剩余问题及最终验证日期。 |

AI 分支贡献覆盖草稿、问答、认证与供应商集成、异常防护、测试和复现材料。现有用户、行程和社交实现是集成基础。Beta 待评估云端运营限额、调用可观测性、跨会话历史的隐私设计，以及经用户确认的草稿导入。课程报告应把这些后续项与 Alpha 已验证范围分开。

- [本地 HTTPS fixture 行程截图](../frontend/artifacts/ai-phase2/https/itinerary-light.png) · [320px 深色问答截图](../frontend/artifacts/ai-phase2/https/chat-dark-mobile.png)
- [浏览器与 TLS 联调日志](../.local/ai-phase2/browser.log) · [后端测试汇总](../.local/ai-phase2/backend-summary.txt) · [前端检查日志](../.local/ai-phase2/frontend.log) · [缺凭据及错误配置验证](../.local/ai-phase2/disabled.log)
- [拟议 Issues 与 Sprint 材料](AI_ALPHA_SPRINT.md#phase-2-reverification) · [PR 正文草稿](AI_ALPHA_PR.md)

## H. PR 审查与发布

代码与文档具备本地审查条件。完整比较包含初期三个提交和后续第二阶段提交。构建目录和 QA 产物属于本地忽略项。前端共享 HTTP 文件的修改仅保留 Axios 错误码。交付复验通过 56 项后端测试、前后端构建、前端 lint、本地 HTTPS 模拟联调、两套浏览器回归和真实百炼端到端验证。此前 GitHub API 返回 `yuhejiang929-cmd` 对团队仓库具有读取权限。远端评审及合并待完成。

拟议 PR 标题为 `feat(ai): implement AI travel assistant for Alpha Sprint`。取得团队仓库的写权限和发布授权后，在仓库根目录执行以下命令。

```sh
git status --short --branch
git fetch origin
git diff --check origin/main...HEAD
git push --set-upstream origin feature/ai-assistant
gh pr create --base main --head feature/ai-assistant \
  --title "feat(ai): implement AI travel assistant for Alpha Sprint" \
  --body-file docs/AI_ALPHA_PR.md
```

也可在推送后通过 GitHub 的 **Pull requests → New pull request** 选择 base `main` 和 compare `feature/ai-assistant`，填写草稿并按团队流程提交评审。选择有权限的证据发布位置并附脱敏截图。

## I. 最高优先级的三项后续工作

1. 将真实百炼验收结果及两张脱敏截图纳入团队评审材料。
2. 获得团队写权限和发布授权，推送已提交的功能分支，使用现有 PR 草稿发起同伴评审。
3. 确认 Trip、地点和地图团队的接口及数据所有权，把可验证的导入与运营限额需求移入 Beta。
