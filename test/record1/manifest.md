# Alpha 主流程截图清单

- 被测版本：main @ 5acdbca
- 测试分支：test/alpha-main-flow-v2 @ d595512
- 日期：1124（0015）
- 前端：http://127.0.0.1:5173
- 后端：http://localhost:8080/api/v1
- 账号 A：e2e.owner@example.com
- 账号 B：e2e.member@example.com / @e2e_member
- 行程：福州周末游-1124-5acdbca
- 截图目录：test/record1

## 结果

| 用例 | 内容 | 结果 |
| --- | --- | --- |
| TC-01 | 登录 | 通过 |
| TC-02 | 创建行程 | 通过 |
| TC-03 | 搜索成员 | 通过 |
| TC-04 | 邀请成功 | 通过 |
| TC-05 | 对方看到参与行程 | 通过 |
| TC-06 | 刷新后仍在 | 通过 |
| TC-07 | 重复邀请提示 | 通过 |
| TC-08 | 越权拒绝 | 通过（实际 403） |

## 文件

- `TC-01-登录-1124-5acdbca.png`
- `TC-02-创建行程-1124-5acdbca.png`
- `TC-03-搜索成员-1124-5acdbca.png`
- `TC-04-邀请成功-1124-5acdbca.png`
- `TC-05-对方看到参与行程-1124-5acdbca.png`
- `TC-06-刷新后仍在-1124-5acdbca.png`
- `TC-07-重复邀请提示-1124-5acdbca.png`
- `TC-08-越权拒绝-1124-5acdbca.json`

## 运行日志

- TC-01 登录: TC-01-登录-1124-5acdbca.png
- TC-02 创建行程: TC-02-创建行程-1124-5acdbca.png
- TC-03 搜索成员: TC-03-搜索成员-1124-5acdbca.png
- TC-04 邀请成功: TC-04-邀请成功-1124-5acdbca.png
- TC-05 对方看到参与行程: TC-05-对方看到参与行程-1124-5acdbca.png
- TC-06 刷新后仍在: TC-06-刷新后仍在-1124-5acdbca.png
- TC-07 重复邀请提示: TC-07-重复邀请提示-1124-5acdbca.png
- TC-08 越权拒绝: status=403
