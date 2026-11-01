# 用户模块（A 组）

本次只完善用户模块，沿用 React、Vite、TypeScript、Spring Boot、JWT 和 H2。地图、AI、预算、城市信息与社区广场不在本次实现范围内。主页对接原有行程、收藏、搭子和成员接口，保留已有的新建和管理操作，方便其他小组联调。

## 页面与入口

| 路径 | 用途 |
| --- | --- |
| `/` | 未登录入口；已登录时进入我的空间 |
| `/register` | 注册、确认密码、注册成功进入个人资料 |
| `/login` | 邮箱登录；完成后回到原先访问的受保护页面 |
| `/my` | 用户主页、创建/参与的行程、收藏、自己的搭子帖 |
| `/profile` | 昵称、头像、简介、语言偏好编辑及只读账户信息 |
| `/people` | 按用户名搜索用户，300ms 防抖，忽略过期请求结果 |
| `/users/:id` | 其他用户的公开资料、公开行程和结伴计划 |

除入口和登录注册外，以上页面需要登录。所有列表与统计来自后端接口，没有伪造旅行记录、粉丝数或认证状态。新账号正常展示空状态。昵称、头像、简介属于公开主页信息；邮箱仅在本人账户页面展示。身份认证、关注/粉丝、密码找回暂未添加。

## 运行

本机可直接双击根目录的 `启动项目.cmd`：自动选择可用的 JDK 17+，启动前后端并将日志保存到 `.local/`。服务在启动窗口关闭后继续运行。浏览器访问 [登录页](http://127.0.0.1:5173/login)。本地 JWT 密钥保存在被 Git 忽略的 `.local/` 内，重启复用。5173 或 8080 端口已被占用时保留现有服务；如果页面仍无法打开，可检查 `.local/frontend-error.log` 和 `.local/backend-error.log`。

右上角提供“浅色 / 深色”切换，默认浅色；主题偏好保存在浏览器中，刷新及切换页面后继续保留。浅色为米白与淡绿配色，深色为调亮后的灰绿配色。

需要 Node.js 18+、完整 JDK 17+ 和 Maven。注意本机默认 `java` 可能指向 Java 8 JRE，需要先将 `JAVA_HOME` 和 `PATH` 指向实际 JDK。Android Studio 附带的 `jbr` 在包含编译器时也可用。

前端：

```powershell
cd frontend
npm install
npm run dev
```

后端（另开终端，项目根目录）：

```powershell
# 如有必要，先设置本机 JDK 路径：
# $env:JAVA_HOME = '你的 JDK 目录'
# $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
cd backend
mvn spring-boot:run
```

访问 [本地用户主页](http://localhost:5173/my)。默认 API 代理到 `localhost:8080`。H2 文件位于 `backend/data`。JWT 密钥应在自己的本地环境保持稳定；更换密钥会让旧登录凭证失效。

## 已修复的交互和接口问题

- 上传头像单独保存；不会覆盖正在编辑但尚未保存的昵称、简介或语言。表单标明未保存状态，提供放弃修改，离开浏览器页面时有原生提醒。
- 头像仅支持 PNG/JPEG，前后端均限制 5MB；后端检测实际图片格式和像素尺寸。上传失败保留原头像。头像地址变化后重新尝试加载图片。
- 恢复登录时，网络错误保留凭证并允许重试；401 清除失效会话。请求有 15 秒超时。
- 注册前验证两次密码一致；后端验证去除首尾空格后的用户名长度，以及 BCrypt 的 72 字节密码限制。
- 修复原头像下载接口在当前 Spring 版本无法编译的问题。
- 区分创建与参与的行程；列表支持名称/目的地搜索；请求失败不伪装成空数据。
- 查看他人主页时初始化已收藏状态，忽略过期页面请求，避免切换用户时短暂显示上一人的信息。
- 退出与删除搭子帖有确认弹窗，支持键盘取消。
- 中文/英文界面与本地语言偏好保留，资料中的语言通过用户接口保存。

## 文件结构

- `frontend/src/account.css`：用户模块视觉样式和响应式布局。
- `frontend/src/account-translations.ts`：本次用户模块的中英文文案。
- `frontend/src/components/UserSearch.tsx`：可复用用户搜索；`ConfirmDialog.tsx`：原生模态确认；`AuthScenery.tsx`：登录注册共用封面。
- `frontend/src/pages/`：用户模块页面；`api/auth.ts`：原有用户接口封装。

## 验证

生产构建：`cd frontend; npm run build`（在 PowerShell 中也可分两行执行）。

浏览器回归脚本：`frontend/scripts/verify-user-module.cjs`，使用 Playwright 和 Chromium，需要先启动前后端。脚本会创建临时测试账号，建议后端测试时设置以下环境变量，避免写入日常数据库：

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:h2:mem:accountqa;DB_CLOSE_DELAY=-1'
$env:APP_AVATAR_DIRECTORY = './target/qa-avatars'
```

前端目录下执行 `node scripts/verify-user-module.cjs`。如果没有项目级 Playwright，可以用 `PLAYWRIGHT_MODULE` 指向已安装模块路径，用 `QA_BROWSER` 指向现有 Chromium 可执行文件。可选 `QA_BASE_URL`（默认 `http://127.0.0.1:5173`）、`QA_OUTPUT`（默认 `artifacts/user-module`）。脚本验证注册、错误密码、资料保存、上传不覆盖草稿、刷新恢复、语言偏好、手机无横向溢出、网络故障重试、退出和搜索空结果，并输出截图。测试账号和图片应仅用于临时测试环境。

2026-11-01 已通过前后端浏览器联调。另已验证：非法头像类型拦截；创建、收藏、搭子帖、参与行程的真实计数；搜索到其他用户并查看公开主页；已收藏状态初始化与取消收藏；320px 英文公开主页布局；后端拒绝超过 72 UTF-8 字节的密码。

预览截图保存在 `frontend/artifacts/user-module/`：`home-populated.png` 为有测试记录的主页，`home-desktop.png` 为新账号主页，`profile-desktop.png` 为资料页，另有手机预览。截图使用临时测试账号与测试记录。该目录已在 Git 忽略列表中。

## 视觉素材

页面封面为通用旅行风景，不代表福州实景。图片来自 [Unsplash 图片 CDN](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b)，已保存在 `frontend/public/images/mountains.jpg`，页面运行不依赖外部图片请求。图标使用 `@phosphor-icons/react`。后续可用团队自有照片替换此文件。
