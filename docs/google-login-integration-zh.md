# Google 登录集成蓝图

## 背景概览
- **后端**: Express 应用 (`src/app.js`)，采用模块化路由、Redis 持久化 (`src/models/redis.js`)，以及面向服务的抽象层 `src/services/`，包括 Anthropic、OpenAI、Gemini 和用户管理服务。
- **当前认证方式**: 管理员通过静态凭据登录 (`/web/auth/login`)，用户通过 LDAP 登录 (`/users/login`) 并使用 Redis 会话令牌，以及休眠的 Clerk OAuth 脚手架 (`src/services/clerkService.js`，`userService` 中的辅助方法)。
- **前端**: Vue 3 SPA 从 `/admin-next` 提供服务，使用 Pinia stores (`web/admin-spa/src/stores`) 和 axios。用户 store 在 localStorage 中持久化会话令牌，并将其附加到后续请求。

## 当前认证架构
### 后端
- `src/routes/userRoutes.js` 中的 LDAP 登录处理器依赖 `ldapService`，通过 `userService.createUserSession` 发放基于 Redis 的会话令牌。
- 会话验证中间件 (`authenticateUser`, `authenticateUserOrAdmin`) 期望接收由 `userService` 生成的 Redis 会话密钥或 JWT 令牌。
- 管理员登录路径管理来自 `data/init.json` 的凭据，并通过 `redis.setSession` 存储会话。
- `clerkService` 提供令牌验证、用户配置和会话存储助手，但缺少路由入口点和功能开关。

### 前端
- `web/admin-spa/src/views/UserLoginView.vue` (传统登录) 将请求发送到 `/users/login`，并在 Pinia 中存储 `sessionToken`。
- 文档中引用的 Clerk 特定视图 (`UserLoginSocialView.vue`, `SSOCallbackView.vue`) 在当前代码树中不存在；SPA 启动时没有 Clerk 绑定。
- `web/admin-spa/src/stores/user.js` 中的全局 axios 配置为认证调用注入 `x-user-token` 头。

### 数据与会话
- 存储在 Redis 中的用户 (`user:` 前缀) 包括 `provider`、`clerkUserId` 和使用计数器，支持 LDAP 和第三方身份的共存。
- `userService` 公开了创建/更新特定提供商用户和使会话失效的助手方法。
- Redis 存储每个会话的密钥 `user_session:<token>`，过期时间源自 `config.userManagement.userSessionTimeout`。

## 评估的集成选项
| 选项 | 摘要 | 优势 | 缺点 | 评估 |
| --- | --- | --- | --- | --- |
| **恢复 Clerk SaaS 流程** | 重新激活 Clerk Vue store、后端 webhooks 和环境变量配置。 | 丰富的托管流程，支持多提供商。 | 缺少 SPA 组件，额外的 SaaS 依赖，生产配置开销。 | **高工作量 / 间接方案** |
| **Passport.js (`passport-google-oauth20`)** | 引入 Passport 中间件与 Google 策略和 Express 会话。 | 成熟的生态系统，自动处理 OAuth 交换。 | 需要 Express 会话管理，偏离 Redis 令牌方法，增加中间件复杂性。 | **中等工作量 / 不匹配** |
| **Google Identity Services (GIS) + ID Token 验证** | 使用 Google GIS 前端（按钮或 One Tap）获取 ID 令牌，在后端使用 `google-auth-library` 验证。 | 与现有令牌发放对齐，最小新依赖，保留 Redis 会话，灵活的 UI 集成。 | 需要自定义 UI 连接和后端服务来验证令牌和映射用户。 | **最佳选择** |

## 推荐策略: Google Identity Services + 后端令牌验证

### 为什么适合本项目
- 重用 Redis 会话模型和 `userService` 助手，最小化架构变更。
- 完全控制用户配置和审计日志在现有后端内。
- 适用于 SPA + API 分离（GIS 在浏览器中运行，后端验证令牌，发放本地会话）。
- 避免添加完整的 OAuth 回调路由或 Express 会话中间件。

### 高级认证流程
1. 前端使用配置的 `GOOGLE_CLIENT_ID` 通过 `window.google.accounts.id` 渲染 Google One Tap 或登录按钮。
2. Google 认证成功后，前端接收凭据（ID 令牌）并将其 POST 到 `/users/oauth/google`。
3. 后端使用 `OAuth2Client` 验证 ID 令牌，确认 audience、issuer、签名、电子邮件验证以及 nonce/state（如果提供）。
4. 后端通过 `googleSub`（令牌的 `sub`）或电子邮件查找现有用户；需要时通过 `userService` 使用 `provider = 'google'` 创建/更新用户。
5. 后端通过 `userService.createUserSession` 发放 Redis 会话令牌，并返回用户元数据。
6. 前端在 Pinia/localStorage 中持久化会话令牌（与 LDAP 流程相同），并导航到认证路由。

## 实施计划

### 1. 配置和密钥
- **环境变量**: 添加 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`（仅用于未来的服务器到服务器使用）、`GOOGLE_OAUTH_ALLOWED_DOMAINS`（可选 CSV）和 `GOOGLE_OAUTH_ENABLE` 标志。
- **配置更新**: 扩展 `config/config.js`，添加从环境变量获取的 `googleAuth` 部分（启用标志、客户端 ID、允许的托管域、超时）。
- **文档**: 更新 `.env.example` 和 `config/config.example.js`，添加新密钥和指导。
- **部署**: 在 Google Cloud Console 中注册 OAuth 同意屏幕 + 批准的 JavaScript 来源/重定向 URI。对于 GIS 按钮使用，确保域已授权。

### 2. 后端增强
1. **服务模块** (`src/services/googleAuthService.js`):
   - 使用 `GOOGLE_CLIENT_ID` 初始化 `OAuth2Client`。
   - 公开 `verifyIdToken(idToken, nonce?)` 返回 payload 或抛出分类错误（无效 audience、过期令牌、未验证电子邮件、阻止的域）。
   - 提供 `mapGoogleProfile(payload)` 规范化字段 (`sub`, `email`, `name`, `given_name`, `family_name`, `picture`)。
2. **用户配置**:
   - 添加 `userService.getUserByGoogleSub(sub)`，扩展现有 `createOrUpdateUser` 以接受 `googleSub`、`provider = 'google'`，并设置 `lastLoginAt`。
   - 确保唯一性约束：`googleSub` 和电子邮件不能属于多个提供商（向客户端显示可操作的错误）。
3. **路由处理器** (`src/routes/userRoutes.js`):
   - 在速率限制和可选的 reCAPTCHA/nonce 验证后引入 `POST /users/oauth/google`。
   - 步骤: 验证 payload (`credential`, `clientNonce`)，通过服务验证令牌，强制执行 `email_verified`，按允许域列表过滤，创建/更新用户，发放会话令牌（与 LDAP 相同的 TTL），响应用户数据 + 令牌。
   - 记录可疑尝试的安全事件 (`logger.security`)，并附加结构化元数据以便观察。
4. **中间件**:
   - `authenticateUser` 无需更改；通过 Redis 生成的令牌保持兼容。
   - 可选在 Redis 中添加 nonce 存储以阻止重放（登录尝试时 `setex oauth_nonce:<value>`）。
5. **速率限制和审计**:
   - 重用 `initRateLimiters`（基于 IP）或引入专用限制器 (`google_oauth_ip`) 以防止滥用。
   - 通过现有日志/Redis 为成功/失败的 Google 登录发出指标。

### 3. 前端更新
1. **依赖**: 在 `web/admin-spa/src/main.js` 或登录视图中动态加载 GIS 脚本 (`https://accounts.google.com/gsi/client`)。无需 npm 包。
2. **UI**: 创建/恢复社交登录视图 (`UserLoginSocialView.vue`) 或使用 Google 登录按钮扩展现有登录页面。禁用时提供回退到 LDAP 登录。
3. **Pinia Store**:
   - 添加 `loginWithGoogle(credential)` 操作，调用 `/users/oauth/google` 并重用 `setAuthHeader`、`localStorage` 持久化逻辑。
   - 为社交登录分别跟踪加载/错误状态以提供用户反馈。
4. **路由**: 可选添加路由守卫或功能开关，当 `GOOGLE_OAUTH_ENABLE` 为 false 时隐藏 Google 按钮（从 `GET /users/config` 获取或嵌入 SPA 构建环境）。
5. **UX 和消息**: 如果配置了 `GOOGLE_OAUTH_ALLOWED_DOMAINS`，提供清晰的文案说明企业限制。

### 4. 会话和用户模型考虑
- 扩展存储的用户对象，添加 `googleSub`、`avatar`、`provider = 'google'`，以及可选的 `oauthProviders = ['google']` 以支持未来扩展。
- 当 LDAP 用户尝试使用相同电子邮件进行 Google 登录时，决定策略：要么合并（首选，需明确同意），要么阻止并指示联系管理员。在响应 payload 中记录行为。
- 确保 `userService.updateUser` 保留提供商和第三方 ID。

## 安全考虑
- **Audience 和 Issuer 验证**: 拒绝 `aud` 不匹配 `GOOGLE_CLIENT_ID` 或 `iss` 不是 `https://accounts.google.com` 或 `accounts.google.com` 的令牌。
- **电子邮件验证**: 要求 `email_verified === true`；可选强制执行域白名单。
- **Nonce / State**: 对于按钮流程，使用 GIS `nonce` 支持；在服务器端存储 nonce 以减轻重放攻击。
- **HTTPS**: 在生产环境中通过 HTTPS 提供 GIS 前端和后端端点；如果缺少 TLS，则禁用 Google 登录。
- **令牌处理**: 不持久化 Google ID 令牌；在内存中处理并丢弃。仅记录匿名标识符（截断的 `sub`）以避免泄露 PII。
- **速率限制和滥用检测**: 监控失败的验证尝试并相应限制 IP。
- **会话安全**: 保留现有 Redis TTL；如果组织策略要求，考虑为 OAuth 会话使用更短的生命周期。

## 推出策略
1. **阶段 1 – 开发**: 在 `GOOGLE_OAUTH_ENABLE` 后实现功能；使用 Google 测试用户和暂存 Redis 进行测试。
2. **阶段 2 – 内部试点**: 为一小组域或用户启用；监控日志以查找令牌验证失败和延迟。
3. **阶段 3 – 正式发布**: 更新管理员文档，通知用户，可选在确认采用后禁用 LDAP。
4. **回退计划**: 在推出期间将 LDAP 登录维护为备份；通过翻转启用标志提供管理员快速恢复的开关。

## 测试计划
- **单元测试**: 模拟 `OAuth2Client.verifyIdToken` 以涵盖成功、无效 audience、过期令牌、未验证电子邮件和阻止域场景。
- **集成测试**: 使用 Jest + Supertest 使用来自 `google-auth-library` 测试工具或使用 Google 公钥手动构造的 JWT 的签名令牌访问 `/users/oauth/google`。
- **前端测试**: 添加组件测试，确保 Google 按钮触发凭据处理器；可选集成 Playwright 以使用模拟后端覆盖完整登录流程。
- **冒烟测试**: 验证 LDAP 登录和 Google 登录的共存，包括并发会话和注销行为。

## 运营监控
- 记录登录成功/失败的结构化事件，包含结果代码 (`google_login_success`, `google_login_invalid_audience` 等)。
- 跟踪每个提供商的 `user_session:*` Redis 密钥计数以监控采用情况。
- 设置针对持续验证失败（每分钟 >N）的警报，表示配置错误或滥用。
- 记录支持运行手册，用于轮换 Google 凭据和撤销受损的 OAuth 客户端。

## 附录
### 环境变量参考
| 变量 | 描述 | 示例 |
| --- | --- | --- |
| `GOOGLE_OAUTH_ENABLE` | Google 登录的功能开关。 | `true` |
| `GOOGLE_CLIENT_ID` | Google 颁发的 OAuth 2.0 客户端 ID。 | `123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | （可选）用于未来服务器端令牌交换的密钥。 | `supersecret` |
| `GOOGLE_OAUTH_ALLOWED_DOMAINS` | 允许的 Google Workspace 域的逗号分隔列表。 | `example.com,example.org` |
| `GOOGLE_OAUTH_NONCE_TTL` | （可选）在 Redis 中保留 nonce 条目的秒数。 | `300` |

### 参考链接
- Google Identity Services 文档: <https://developers.google.com/identity/gsi/web>
- 令牌验证指南: <https://developers.google.com/identity/gsi/web/guides/verify-google-id-token>
- 代码库中现有的 `google-auth-library` 使用示例: `src/services/geminiAccountService.js`。