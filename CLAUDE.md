# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Claude Relay Service 是一个多平台 AI API 中转服务，支持 Claude (官方/Console)、Gemini、OpenAI Responses (Codex)、AWS Bedrock、Azure OpenAI、Droid (Factory.ai)、CCR 等多种账户类型。作为客户端与 AI API 之间的中间件，提供认证、限流、监控、成本统计等功能。

## 常用命令

```bash
# 安装依赖和初始化
npm install
npm run setup                  # 生成配置和管理员凭据
npm run install:web            # 安装Web界面依赖
npm run build:web              # 构建前端

# 开发和运行
npm run dev                    # 开发模式（热重载）
npm start                      # 生产模式（含lint）
npm test                       # 运行测试
npm run lint                   # ESLint代码检查并修复
npm run lint:check             # ESLint检查（不修复）
npm run format                 # Prettier格式化

# 服务管理
npm run service:start:daemon   # 后台启动（推荐）
npm run service:status         # 查看服务状态
npm run service:logs           # 查看日志
npm run service:logs:follow    # 实时跟踪日志
npm run service:stop           # 停止服务
npm run service:restart:daemon # 重启服务

# Docker部署
docker-compose up -d

# CLI工具
npm run cli keys list          # API Key列表
npm run cli keys create -- --name "name" --limit 1000
npm run cli accounts list      # Claude账户列表
npm run cli status             # 系统状态

# 数据管理
npm run data:export            # 导出Redis数据
npm run data:import            # 导入数据
npm run data:debug             # 调试Redis键
npm run init:costs             # 初始化成本数据
npm run update:pricing         # 更新模型价格

# 迁移和修复
npm run migrate:apikey-expiry  # API Key过期迁移
npm run fix:cost               # 修复成本统计
```

## 开发环境配置

```bash
cp config/config.example.js config/config.js
cp .env.example .env
npm run setup  # 自动生成密钥并创建管理员账户
```

### 必须配置的环境变量
- `JWT_SECRET`: JWT密钥（32字符以上）
- `ENCRYPTION_KEY`: 数据加密密钥（32字符固定长度）
- `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`: Redis连接配置

## 核心架构

### 请求处理流程

1. 客户端使用 API Key（cr\_ 前缀）发送请求到对应路由（/api、/claude、/gemini、/openai、/droid等）
2. `authenticateApiKey` 中间件验证 API Key、速率限制、权限、客户端限制、模型黑名单
3. 统一调度器根据请求模型、会话hash、权限选择最优账户
4. 检查账户 token 有效性，过期则自动刷新（通过代理）
5. 根据账户类型调用对应转发服务，使用账户凭据转发请求
6. 流式或非流式返回响应，捕获真实 usage 数据
7. 记录使用统计和成本计算，更新速率限制计数器

### 关键架构概念

- **统一调度系统**: unifiedClaudeScheduler、unifiedGeminiScheduler、unifiedOpenAIScheduler、droidScheduler
- **多账户类型**: claude-official、claude-console、bedrock、ccr、droid、gemini、openai-responses、azure-openai
- **粘性会话**: 基于请求内容hash的会话绑定，同一会话使用同一账户
- **数据加密**: 敏感数据（refreshToken, accessToken, credentials）使用 AES 加密存储在 Redis
- **并发控制**: Redis Sorted Set 实现的并发计数，支持自动过期清理

### 目录结构

```
src/
├── app.js                 # 应用入口
├── services/              # 核心服务（30+文件）
│   ├── claudeRelayService.js        # Claude官方API转发
│   ├── claudeAccountService.js      # Claude账户管理、OAuth刷新
│   ├── unifiedClaudeScheduler.js    # Claude统一调度器
│   ├── apiKeyService.js             # API Key管理、验证、限流
│   ├── pricingService.js            # 定价和成本计算
│   └── ...
├── routes/                # 路由处理（13个路由文件）
│   ├── api.js             # Claude API路由
│   ├── admin.js           # 管理端点
│   ├── geminiRoutes.js    # Gemini路由
│   └── ...
├── middleware/            # 中间件
│   ├── auth.js            # 认证中间件
│   └── ...
├── utils/                 # 工具函数
│   ├── logger.js          # Winston日志
│   ├── oauthHelper.js     # OAuth PKCE实现
│   ├── proxyHelper.js     # 代理工具
│   ├── sessionHelper.js   # 会话管理
│   └── ...
├── models/redis.js        # Redis模型
└── validators/            # 输入验证

web/admin-spa/             # Vue 3 + Vite 前端
├── src/
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   └── stores/theme.js    # 主题管理（暗黑模式）

config/config.js           # 配置文件
logs/                      # 日志目录
data/init.json             # 管理员凭据
```

## 重要端点

### API转发
- `POST /api/v1/messages`, `POST /claude/v1/messages` - Claude消息
- `POST /gemini/v1/models/:model:generateContent` - Gemini API
- `POST /openai/v1/chat/completions` - OpenAI格式转发
- `POST /droid/claude/v1/messages` - Droid Claude转发

### 管理
- `POST /admin/claude-accounts/generate-auth-url` - 生成OAuth授权URL
- `POST /admin/claude-accounts/exchange-code` - 交换authorization code
- `GET /admin/dashboard` - 系统概览

### 系统
- `GET /health` - 健康检查
- `GET /metrics` - 系统指标
- `GET /admin-next/` - Web管理界面

## 开发最佳实践

### 代码格式化

必须使用 Prettier 格式化所有代码：
- 后端：`npx prettier --write <file>`
- 前端：已安装 `prettier-plugin-tailwindcss`
- 格式化所有：`npm run format`

### 前端开发要求

- **响应式设计**: 使用 Tailwind CSS 响应式前缀（sm:、md:、lg:、xl:）
- **暗黑模式兼容**: 所有UI组件必须同时兼容明亮和暗黑模式
  - 使用 `dark:` 前缀：`bg-white dark:bg-gray-800`、`text-gray-700 dark:text-gray-200`
- **主题切换**: 使用 `stores/theme.js` 中的 `useThemeStore()`

### 代码修改原则

- 首先检查代码库的现有模式和风格
- 重用现有的服务和工具函数
- 遵循现有的错误处理和日志记录模式
- 敏感数据必须使用加密存储（参考 claudeAccountService.js）

### 调试和验证

- 运行 `npm run lint` 进行代码检查
- 运行 `npm test` 执行测试
- 使用 `npm run cli status` 验证功能
- 查看日志：`logs/claude-relay-*.log`

## Redis 数据结构

- `api_key:{id}` - API Key详情（权限、客户端限制、模型黑名单）
- `api_key_hash:{hash}` - 哈希到ID映射
- `claude_account:{id}` - Claude账户（加密OAuth数据）
- `gemini_account:{id}` / `bedrock_account:{id}` / ... - 各类型账户
- `sticky_session:{sessionHash}` - 粘性会话绑定
- `rate_limit:{keyId}:{window}` - 速率限制计数
- `concurrency:{accountId}` - 并发计数（Sorted Set）

## 故障排除

1. **Redis连接失败**: 检查 REDIS_HOST、REDIS_PORT、REDIS_PASSWORD
2. **管理员登录失败**: 检查 data/init.json，运行 `npm run setup`
3. **OAuth授权失败**: 检查代理设置，OAuth token交换也需要代理
4. **粘性会话失效**: Nginx代理需添加 `underscores_in_headers on;`
5. **成本统计不准确**: 运行 `npm run init:costs`
6. **并发计数泄漏**: 系统每分钟自动清理过期计数

### 日志文件

- `logs/claude-relay-*.log` - 应用主日志
- `logs/token-refresh-error.log` - Token刷新错误
- `logs/webhook-*.log` - Webhook通知
- `logs/http-debug-*.log` - HTTP调试（DEBUG_HTTP_TRAFFIC=true时）
