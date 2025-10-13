# ViliCode 品牌化检查清单

## 📋 品牌更新状态

### ✅ 已完成的品牌更新

#### 前端界面
- [x] **社交登录页面**: `UserLoginSocialView.vue` - "Claude Relay" → "ViliCode"
- [x] **页面标题**: 社交登录页面头部显示 "ViliCode"
- [x] **OAuth 按钮文本**: 更新为 "使用 Google 登录 ViliCode"

#### 移除的品牌元素
- [x] **GitHub 登录**: 按照要求移除 GitHub OAuth 选项
- [x] **相关 CSS**: 移除 GitHub 按钮的样式和动画

### ❓ 待检查的品牌位置

#### 核心配置文件
- [ ] **package.json**: 检查项目名称和描述
  - `claude-relay-service` → `vilicode-service`?
  - 项目描述是否需要更新
  
- [ ] **Docker 配置**: 
  - `docker-compose.yml` 中的服务名称
  - Docker 镜像标签和名称

#### 前端应用
- [ ] **HTML 标题**: `web/admin-spa/index.html` 的 `<title>` 标签
- [ ] **应用名称**: `web/admin-spa/package.json` 中的项目名称
- [ ] **主布局组件**: `MainLayout.vue` 中可能的品牌显示
- [ ] **登录页面**: `UserLoginView.vue` 中的传统登录表单
- [ ] **着陆页**: `LandingView.vue` 中的主要品牌显示
- [ ] **仪表板**: 各种 Dashboard 组件中的标题
- [ ] **设置页面**: 系统设置中的应用名称显示

#### 后端服务
- [ ] **API 响应**: 检查 API 响应中是否有硬编码的应用名称
- [ ] **日志消息**: 系统日志中的应用标识
- [ ] **错误消息**: 用户可见错误中的应用名称
- [ ] **邮件模板**: 如果有邮件通知功能

#### 文档和配置
- [ ] **README.md**: 项目描述和说明
- [ ] **CLAUDE.md**: 项目概述部分
- [ ] **配置文件**: `config/config.js` 中的默认值
- [ ] **环境变量**: `.env.example` 中的示例值

#### 元数据和 SEO
- [ ] **Meta 标签**: 页面的 meta description 和 keywords
- [ ] **Favicon**: 是否需要更新图标
- [ ] **PWA 配置**: 如果有 PWA 配置的应用名称

### 🎨 视觉品牌元素

#### 图标和图像
- [ ] **Logo**: 是否有需要更新的 Logo 文件
- [ ] **Favicon**: `favicon.ico` 和相关图标文件
- [ ] **社交媒体图片**: Open Graph 和 Twitter Card 图片
- [ ] **错误页面图片**: 404 等错误页面的品牌元素

#### 颜色和样式
- [ ] **主题色**: 是否需要调整品牌色彩方案
- [ ] **CSS 变量**: 检查是否有品牌相关的 CSS 自定义属性
- [ ] **字体选择**: 品牌字体是否需要调整

### 🔍 需要搜索的关键词

使用以下命令搜索可能遗漏的品牌引用：

```bash
# 搜索 "Claude Relay" 相关文本
grep -r "Claude Relay" . --exclude-dir=node_modules --exclude-dir=.git

# 搜索 "claude-relay" 相关文本
grep -r "claude-relay" . --exclude-dir=node_modules --exclude-dir=.git

# 搜索可能的配置和标题
grep -r "<title>" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "name.*claude" . --exclude-dir=node_modules --exclude-dir=.git
```

### 📝 品牌一致性指南

#### ViliCode 品牌规范
- **正式名称**: ViliCode
- **显示格式**: 始终使用驼峰式 "ViliCode"，不使用 "Vili Code" 或 "vilicode"
- **标语**: 待确定
- **主色调**: 保持当前的深色主题和玻璃态效果

#### 使用场景
- **用户界面**: 所有用户可见的地方都应显示 "ViliCode"
- **技术文档**: 内部文档可以继续使用 "Claude Relay Service" 作为技术标识
- **API 端点**: 技术端点名称保持不变，避免破坏兼容性

### ⚠️ 注意事项

#### 兼容性考虑
- 更新品牌名称时避免破坏现有 API 契约
- 保持配置文件的向后兼容性
- 确保数据库中的数据迁移不受影响

#### 渐进式更新
- 优先更新用户可见的界面元素
- 逐步更新内部文档和配置
- 保持关键系统功能的稳定性

---

**创建日期**: 2025-09-08  
**最后更新**: 2025-09-08  
**完成度**: 约 15% (主要是社交登录页面)  
**下一步**: 搜索和更新所有用户可见的品牌位置