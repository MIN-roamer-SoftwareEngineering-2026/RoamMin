# RoamMin 团队代码规范

[English version](CODING_STANDARDS.en.md)

本规范适用于 MIN-roamer Alpha 冲刺期间的 React / TypeScript 前端、Java 17 / Spring Boot 后端和项目文档。Java 部分参考 [《阿里巴巴 Java 开发手册（终极版 v1.3.0）》](https://developer.aliyun.com/special/tech-java)。

## 通用约定

- 文件使用 UTF-8。新写的前端代码按 Prettier 格式化，Java 使用 4 个空格缩进。同一个 PR 中的格式调整限定在本次修改涉及的文件。
- 类和 React 组件用大驼峰，如 `TripService`、`UserSearch`。变量、函数和 JSON 字段用小驼峰，如 `tripId`、`listMembers`。Java 常量用全大写加下划线，如 `MAX_AVATAR_BYTES`。名称应能说明用途。
- 函数集中处理一件事。注释说明业务约束或选择原因，例如私有行程的可见性规则。删除废弃的代码和无用导入。

## React 与 TypeScript

- 可复用组件放在 `frontend/src/components`，页面放在 `frontend/src/pages`。API 调用统一放在 `frontend/src/api`，通过现有 HTTP 客户端处理登录凭证和响应。
- 共享的请求和响应类型集中维护在 `frontend/src/types.ts`。为组件输入和接口数据提供准确类型，优先用明确类型或收窄 `unknown`。
- 异步列表区分加载、空结果和请求失败。保存与邀请要反馈结果，处理中防止重复提交。新增界面文案同步维护中英文资源。

## Java 与 Spring Boot

- Controller 接收请求、校验 DTO 并调用 Service。Service 处理权限、领域规则和需要原子提交的写操作。Repository 负责读写数据。
- 使用构造注入。使用 DTO 表达接口输入和输出，对请求字段做 Bean Validation，并在服务端检查当前用户是否有权访问资源或修改成员。
- 参数错误、越权和重复操作使用对应的 HTTP 状态。业务异常交给统一异常处理，用户响应只给出必要的提示。变更接口前核对已有调用方。

## API 与数据

- 接口沿用 `/api/v1` 和 `{code, message, data}`。成功时 `code` 为 `0`，失败使用恰当的 HTTP 状态，例如无登录凭证为 `401`、无权操作为 `403`、重复邀请为 `409`。
- 请求或响应字段变更时，在同一 PR 更新 [API 文档](API.md)、前端类型和受影响调用。以邀请为例，`POST /api/v1/trips/{tripId}/members` 接收 `username`，Service 从登录身份校验行程归属。
- 密钥、令牌、密码、本地数据库和测试产物保存在各自的本地环境。测试和演示使用临时账号，提交前检查代码、日志和截图里的敏感字段。

## Git 协作与提交前检查

1. 从团队确认的集成基线切分支。功能用 `feat/<模块>-<简述>`，修复用 `fix/<模块>-<简述>`，文档用 `docs/<简述>`。`main` 用于演示版本，团队通过 PR 合并。开发文档约定由 `develop` 做日常集成，启用后统一以它作为功能 PR 的目标。
2. 一次提交写清一个目的，例如 `fix: 修复重复邀请后的提示`。PR 关联对应 Issue，写清改动、验证步骤与结果。所有任务由组长陈杭复核，复核通过后按仓库权限合并。
3. 改前端时在 `frontend` 运行 `npm run lint`、`npm run build`，并用 Prettier 检查本次改动的源文件。改后端时在 `backend` 运行 `mvn test`。提交涉及状态、权限或数据写入的改动时补做相应回归。
4. 涉及邀请时，用创建者和受邀者两个账号检查创建、邀请、重复邀请、移除以及刷新后的参与列表，记录实际结果。自动化检查记录运行了哪些用例、通过与失败数。
