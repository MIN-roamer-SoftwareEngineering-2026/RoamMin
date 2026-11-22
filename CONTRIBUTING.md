# RoamMin 团队协作规范

适用：MIN-roamer（第一组）Alpha 冲刺及之后所有阶段。

三条底线：

1. **main 永远可运行**——只有经过评审的 PR 才能进 main。
2. **每项交付有据可查**——一个 Issue 对应一项交付，PR 里写清验证结果。
3. **任何人不在别人的分支上工作**——一人一分支，合完就删。

---

## 1. 角色

| 角色 | 谁 | 职责 |
| --- | --- | --- |
| 仓库管理员 | 陈杭 @Nomkr | 唯一 Admin；合并所有 PR；管理 main 保护、成员权限、Issue、里程碑 |
| 前端集成 | 陈杭 | `frontend/src` 公共文件（`App.tsx`、`i18n.ts`、`index.css`、`main.tsx`）的最终取舍 |
| 后端集成 | 陈启扬 | `backend/` 公共接口与 `docs/API.md` 的最终取舍 |
| 测试负责人 | 邹佳妤 | 用例、Playwright 回归、测试报告、复测结论 |
| 模块负责人 | 各组组员 | 自己模块的分支、提交、PR 与 Issue 证据 |

> **公共文件**（`App.tsx`、`i18n.ts`、`index.css`、`main.tsx`、`package.json`、`docs/API.md`、`types.ts`）改动前先在 Issue 里说明，由集成人确认。多人同时改这几个文件必然冲突。

## 2. 权限模型

- 所有组员给 **Write**，只有陈杭是 **Admin**。
- 组员**不直接 push main**，也不合并自己的 PR。
- 不共享账号、密码、token。没权限找组长加，不要借号提交。
- Fork 只用于两种情况：外部同学没有 Write；或者你只想试验、不想污染主仓库。**有 Write 就在主仓库开分支，不要 fork**（fork 出来的 PR 默认拿不到 CI 权限，组长还要额外操作）。

## 3. 分支

从**最新 main** 切，一个人一个分支，一个分支只做一件事。

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat/` | 新功能 | `feat/c-destination-pages` |
| `fix/` | 修 bug | `fix/trip-invite-duplicate` |
| `docs/` | 文档、博客、规范 | `docs/alpha-coding-standards` |
| `test/` | 测试脚本、测试证据 | `test/alpha-main-flow` |
| `chore/` | 配置、构建、杂务 | `chore/ci-frontend-build` |

命名用小写英文和短横线，**不要**用中文、空格、`final`、`最终版`。

## 4. 提交信息

格式：`type(scope): 具体行为`

```
feat(frontend): 增加福州目的地列表页
fix(trip): 重复邀请时返回 409 而不是 500
docs(api): 补充成员移除接口说明
test(e2e): 增加主流程回归与截图
```

- `type` 用 `feat` / `fix` / `docs` / `test` / `chore` / `refactor`。
- `scope` 写模块：`frontend`、`trip`、`user`、`ai`、`community`。
- 一行说清“改了什么行为”，不写 `update`、`修改一下`、`111`。

## 5. Issue

**一项交付 = 一个 Issue**，领任务先建 Issue 再开分支。

- 标题：`[模块] 要做什么`，例如 `[行程] 创建行程并邀请成员`
- 内容：负责人、验收标准（可勾选）、涉及目录、依赖谁、需要什么证据
- 开发中的进度、截图、commit 链接都回在这个 Issue 下面
- PR 用 `Refs #12` 关联；**只有全部验收条件都满足**才写 `Closes #12`
- 状态标签：`待开始`、`进行中`、`待复核`、`已验收`、`阻塞`

Issue 是给老师和助教看的交付台账，也是冲刺日志的素材来源，不是形式主义。

## 6. PR

1. 分支推到主仓库，开 PR 到 `main`。
2. 按模板填：关联 Issue、改了什么、怎么验证、截图、影响面、未完成项。
3. 至少 **1 人批准**（CODEOWNERS 指定 @Nomkr）；作者不能批准自己的 PR。
4. CI 通过、无冲突、讨论已解决，才能合并。
5. 合并方式统一 **Squash and merge**（一个 PR 在 main 上变成 1 个提交，历史干净）。
6. 合并后**删除分支**，本地 `git switch main && git pull`。

PR 描述里必须写清：
- 在哪个提交上验证的（完整 SHA 或分支名）
- 实际跑了什么命令、结果如何（`npm run lint`、`npm run build`、`mvn test`）
- 截图/录屏（前端改动必须有）

## 7. main 分支保护（组长在 GitHub 设置一次）

Settings → Branches → Add branch protection rule，分支 `main`：

- [x] Require a pull request before merging
- [x] Require approvals：1
- [x] Dismiss stale approvals when new commits are pushed
- [x] Require conversation resolution
- [x] Require status checks to pass（选上前端 build 的 workflow，有的话）
- [x] Require linear history
- [x] Do not allow force pushes
- [x] Do not allow deletions

> 管理员可以绕过保护，但**组长自己也要走 PR**，只在紧急修复时例外并在群里说明。

## 8. 测试同学怎么干

测试不是“最后点一点”，而是独立交付：

1. 建 Issue：`[测试] Alpha 主流程回归`，写清覆盖哪些用例、验收标准。
2. 从最新 main 切 `test/xxx` 分支，写 Playwright 脚本或测试用例文档。
3. **在 Issue 里记录被测版本**：分支名 + 完整 commit SHA + 启动命令。
4. 截图/录屏存进仓库（`test/record1/` 之类），不要只发微信。
5. 发现问题 → 开 `bug` Issue：现象、复现步骤、期望/实际、版本 SHA、截图。
6. 开发在 `fix/xxx` 分支修，PR 里写 `Fixes #bug号`。
7. 测试**在同一 Issue 下复测**，写明“复测通过 @ 新 SHA”。没复测就不算验收。

## 9. 每天怎么同步

- 早：`git switch main && git pull`，看有没有新合并。
- 晚：在 Issue 下回一条——今天做了什么｜状态｜commit / 截图链接｜阻塞。
- 日志主笔直接从 Issue 汇总，不用再单独收集。

## 10. 冲突处理

```bash
git switch main && git pull
git switch 你的分支
git merge main          # 有冲突就解决
git add <冲突文件>
git commit
git push
```

- 共享文件冲突**找另一位作者一起看**，不要无脑“全部用我的”。
- 绝不 `git push --force` 到 main。自己的分支要用也只允许 `--force-with-lease`。

## 11. 绝对不要做

- 直接往 main 提交
- 合并自己的 PR
- 把 `node_modules`、`.env`、密钥、数据库文件提交上来
- 用压缩包覆盖别人的目录
- 把别人的分支 checkout 过来改完再推
- 删除别人的分支或 Issue
