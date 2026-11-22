# Git 协作操作手册（含完整示例）

配套 [团队协作规范](../../CONTRIBUTING.md)。本文件给命令和时序，规范给规则。

---

## 0. 一次性配置

```bash
git config --global user.name  "你的真名或常用名"
git config --global user.email "你的邮箱"
git config --global init.defaultBranch main
git config --global pull.ff only        # 拉取只允许快进，避免莫名其妙的 merge
```

`user.name` 会写进每个提交，**不要**用 `ch`、`admin`、`test` 这类名字——后期统计工作量时会认不出人。

## 1. 第一次拿到代码

```bash
git clone https://github.com/MIN-roamer-SoftwareEngineering-2026/RoamMin.git
cd RoamMin
git switch main
```

团队统一：**在主仓库开分支，不 fork**（组员都有 Write 权限）。只有没权限的外部同学才 fork。

## 2. 一个任务的完整流程（九步）

以“王婧菱做行程创建页”为例。

### ① 先看 main 是不是最新

```bash
git switch main
git pull
```

### ② 建 Issue（在 GitHub 网页上）

标题 `[行程] 创建行程并邀请成员`，写验收标准、涉及目录、依赖、需要的证据。
拿到 Issue 编号，例如 `#12`。

### ③ 从最新 main 切分支

```bash
git switch -c feat/trip-create-page
```

一个分支一件事。不要在一个分支里又改前端又改后端又改文档。

### ④ 开发，小步提交

```bash
git status
git add frontend/src/pages/TripCreatePage.tsx frontend/src/api/trip.ts
git commit -m "feat(trip): 增加创建行程页面与表单校验"
```

- 一次提交只做一件事，改 3 个文件也能提交，不要攒一天。
- 提交前看清楚 `git status`，别把 `node_modules`、`.env`、`data/` 加进去。

### ⑤ 提交前自测

```bash
# 前端
cd frontend && npm run lint && npm run build

# 后端
cd backend && mvn test
```

把实际执行的命令和结果记下来，PR 里要用。

### ⑥ 推送并开 PR

```bash
git push -u origin feat/trip-create-page
```

网页上开 PR → base 选 `main` → 按模板填 → 关联 `Refs #12`。
**PR 描述必须写**：改了什么 / 怎么验证 / 截图 / 影响面 / 未完成项。

### ⑦ 等评审，按意见改

```bash
git add .
git commit -m "fix(trip): 按评审意见补充空表单提示"
git push
```

评审通过前不要自己点 merge。

### ⑧ 组长合并（Squash and merge）

合并后 main 上多 1 个提交，分支被删除。

### ⑨ 收尾

```bash
git switch main
git pull
git branch -d feat/trip-create-page
```

回到 Issue，贴一句“已完成，合并提交 xxxxxxx”，并关掉 Issue（或在 PR 里写 `Closes #12` 自动关）。

---

## 3. 测试同学的一天（完整时序）

测试是**独立交付**，不是帮别人点一下。

```
建 Issue（测试范围 + 验收标准）
        │
        ├─ 切 test/alpha-main-flow 分支
        ├─ 写 Playwright 用例 / 测试用例文档
        ├─ 记录被测版本：分支名 + 完整 SHA + 启动命令
        ├─ 跑通 → 截图存 test/record1/ → 提交
        ├─ 发现问题 → 开 bug Issue（现象/复现/期望/实际/SHA/截图）
        └─ 开 PR（Refs #测试Issue）→ 组长合并
                    │
开发收到 bug Issue ─┴─ 切 fix/xxx 分支 → 修 → PR（Fixes #bug号）→ 合并
                    │
测试复测新 SHA ─────┴─ 在 bug Issue 下写“复测通过 @ abc1234”
```

关键点：

1. **必须写清测的是哪个提交**。`abc1234` 这种短 SHA 就够，但一定要有，否则出了问题是“测的哪个版本”都说不清。
2. 截图进仓库，别只发群里——博客和答辩要用。
3. 同一个 bug 不重复开 Issue，在原 Issue 下复测。
4. 测试 PR 也要评审、也要 CI 通过。

## 4. 同步与冲突

每天开工第一件事：

```bash
git switch main && git pull
git switch 你的分支
git merge main
```

有冲突：

```bash
git status                 # 看哪些文件冲突
# 手动编辑，保留双方意图
git add <冲突文件>
git commit
git push
```

- `i18n.ts`、`App.tsx`、`HomePage.tsx` 是高频冲突文件，改之前先在 Issue 里说。
- 冲突时找另一位作者确认，不要整段删掉对方的代码。
- 绝不 `git push --force` 到 main；自己的分支最多 `--force-with-lease`。

## 5. 组长合并前的检查清单

- [ ] PR 关联了 Issue
- [ ] 描述里有验证命令和结果
- [ ] 前端改动有截图
- [ ] CI 绿
- [ ] 没有冲突、没有把别人的文件整包覆盖
- [ ] 没有提交密钥、`node_modules`、数据库文件
- [ ] 公共文件（App/i18n/样式/接口文档）改动合理
- [ ] Squash merge，然后删分支

## 6. 紧急修复

线上/演示前发现阻断问题：

```bash
git switch main && git pull
git switch -c fix/demo-blocker
# 改
git commit -m "fix(demo): 修复演示环境登录失败"
git push -u origin fix/demo-blocker
```

照样开 PR，但可以在群里 @组长 优先合并。**不要**因为急就直接 push main。

## 7. 常见错误对照表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Updates were rejected` | 远端有你本地没有的提交 | `git pull` 后再 push，不要 `-f` |
| PR 里有几百个文件 | 分支从旧 main 切的，或者把 `node_modules` 提交了 | 重新从最新 main 切分支，只挑自己的文件 |
| 别人看不到我的改动 | 改动只在你的分支，没合并进 main | 开 PR 合进 main，或者让对方切到你的分支 |
| 合并后 main 跑不起来 | 两个 PR 各自没问题，合起来冲突 | 合并前先 `git merge main` 到自己的分支跑一遍 |
| `detached HEAD` | checkout 了某个提交而不是分支 | `git switch main` 或 `git switch -c 新分支名` |
| 提交作者显示成别人 | 共用电脑或没配 `user.name` | 配置自己的 `user.name` / `user.email` |
| 想撤回已合并的 PR | 不能删历史 | 用 `git revert` 生成反向提交，走 PR 合入 |

## 8. 关于 `cddb26f` 这类编号

- 它是 **commit SHA-1** 的前 7 位，提交内容的指纹，**不能改、不能重命名**。
- 分支名（`ch`、`feat/xxx`）只是指向某个提交的“指针”，**可以随便改**：`git branch -m 新名字`。
- 同一个改动在不同分支上 SHA 不同；squash 合并后 main 上会生成**新的 SHA**，所以 PR 里的 SHA 和 main 上的 SHA 常常对不上，这是正常的。
- 引用历史版本时写完整或 7 位 SHA 都行，例如 `eee9962`。
- `git revert` 不是删除历史，而是新增一个“反向提交”，历史越长越安全。
