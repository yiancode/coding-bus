<template>
  <div class="docs-container">
    <!-- 固定顶部导航 -->
    <nav class="docs-nav">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- 返回首页 -->
          <router-link class="flex items-center space-x-3" to="/">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-orange-500"
            >
              <span class="text-sm font-bold text-white">V</span>
            </div>
            <span class="text-lg font-bold text-white">vilicode</span>
          </router-link>

          <!-- 导航链接 -->
          <div class="hidden items-center space-x-6 md:flex">
            <router-link class="nav-link" to="/">首页</router-link>
            <router-link class="nav-link" to="/api-stats">统计查询</router-link>
            <router-link class="nav-link" to="/user-login">用户登录</router-link>
          </div>

          <!-- 主题切换 -->
          <div class="flex items-center">
            <ThemeToggle mode="icon" />
          </div>
        </div>
      </div>
    </nav>

    <div class="docs-layout">
      <!-- 左侧边栏 -->
      <aside class="docs-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">文档目录</h2>
          <button class="sidebar-toggle md:hidden" @click="sidebarOpen = !sidebarOpen">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- 快速开始 -->
          <div class="nav-section">
            <h3 class="nav-section-title">
              <i class="fas fa-rocket"></i>
              快速开始
            </h3>
            <ul class="nav-items">
              <li>
                <a class="nav-item" href="#setup" @click="setActiveSection('setup')">环境配置</a>
              </li>
              <li>
                <a
                  class="nav-item"
                  href="#first-request"
                  @click="setActiveSection('first-request')"
                >
                  第一个请求
                </a>
              </li>
              <li>
                <a class="nav-item" href="#api-key" @click="setActiveSection('api-key')">
                  API密钥管理
                </a>
              </li>
            </ul>
          </div>

          <!-- Claude使用技巧 -->
          <div class="nav-section">
            <h3 class="nav-section-title">
              <i class="fas fa-brain"></i>
              Claude使用技巧
            </h3>
            <ul class="nav-items">
              <li>
                <a
                  class="nav-item"
                  href="#prompt-engineering"
                  @click="setActiveSection('prompt-engineering')"
                >
                  提示词工程
                </a>
              </li>
              <li>
                <a
                  class="nav-item"
                  href="#context-management"
                  @click="setActiveSection('context-management')"
                >
                  上下文管理
                </a>
              </li>
              <li>
                <a class="nav-item" href="#streaming" @click="setActiveSection('streaming')">
                  流式响应处理
                </a>
              </li>
            </ul>
          </div>

          <!-- API参考 -->
          <div class="nav-section">
            <h3 class="nav-section-title">
              <i class="fas fa-code"></i>
              API参考
            </h3>
            <ul class="nav-items">
              <li>
                <a class="nav-item" href="#endpoints" @click="setActiveSection('endpoints')">
                  端点说明
                </a>
              </li>
              <li>
                <a class="nav-item" href="#models" @click="setActiveSection('models')">
                  模型列表
                </a>
              </li>
              <li>
                <a class="nav-item" href="#error-codes" @click="setActiveSection('error-codes')">
                  错误代码
                </a>
              </li>
            </ul>
          </div>

          <!-- 最佳实践 -->
          <div class="nav-section">
            <h3 class="nav-section-title">
              <i class="fas fa-star"></i>
              最佳实践
            </h3>
            <ul class="nav-items">
              <li>
                <a class="nav-item" href="#performance" @click="setActiveSection('performance')">
                  性能优化
                </a>
              </li>
              <li>
                <a
                  class="nav-item"
                  href="#error-handling"
                  @click="setActiveSection('error-handling')"
                >
                  错误处理
                </a>
              </li>
              <li>
                <a class="nav-item" href="#security" @click="setActiveSection('security')">
                  安全建议
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- 移动端侧边栏遮罩 -->
      <div v-if="sidebarOpen" class="sidebar-overlay md:hidden" @click="sidebarOpen = false"></div>

      <!-- 主内容区域 -->
      <main class="docs-content">
        <!-- 移动端顶部菜单按钮 -->
        <button class="mobile-menu-btn md:hidden" @click="sidebarOpen = true">
          <i class="fas fa-bars"></i>
          <span class="ml-2">文档目录</span>
        </button>

        <!-- 面包屑导航 -->
        <nav class="breadcrumb">
          <router-link class="breadcrumb-item" to="/">首页</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">文档中心</span>
        </nav>

        <!-- 文档内容 -->
        <div class="content-area">
          <!-- 环境配置 -->
          <section id="setup" class="doc-section">
            <h1 class="section-title">环境配置</h1>
            <p class="section-description">
              开始使用 Claude Code 中转服务之前，你需要完成以下配置步骤。
            </p>

            <div class="code-block">
              <div class="code-header">
                <span class="code-lang">bash</span>
                <button class="copy-btn" @click="copyCode('setup-code')">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <pre id="setup-code"><code># 安装依赖
npm install anthropic

# 或者使用 yarn
yarn add anthropic</code></pre>
            </div>

            <h3 class="subsection-title">配置 API 密钥</h3>
            <p class="text-content">获取你的 API 密钥后，可以通过以下方式配置：</p>
            <div class="code-block">
              <div class="code-header">
                <span class="code-lang">javascript</span>
                <button class="copy-btn" @click="copyCode('config-code')">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <pre id="config-code"><code>import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'cr_xxxxxxxxxxxxxxxxx', // 你的 API 密钥
  baseURL: 'https://vilicode.com/api/v1' // 我们的中转服务地址
});</code></pre>
            </div>
          </section>

          <!-- 第一个请求 -->
          <section id="first-request" class="doc-section">
            <h1 class="section-title">第一个请求</h1>
            <p class="section-description">
              完成配置后，让我们发送第一个 API 请求来验证设置是否正确。
            </p>

            <div class="code-block">
              <div class="code-header">
                <span class="code-lang">javascript</span>
                <button class="copy-btn" @click="copyCode('first-request-code')">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <pre id="first-request-code"><code>async function firstRequest() {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: '你好，Claude！请介绍一下你自己。'
        }
      ]
    });
    
    console.log(response.content[0].text);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

firstRequest();</code></pre>
            </div>
          </section>

          <!-- 提示词工程 -->
          <section id="prompt-engineering" class="doc-section">
            <h1 class="section-title">提示词工程</h1>
            <p class="section-description">
              良好的提示词设计是获得优质回复的关键。以下是一些最佳实践：
            </p>

            <div class="tips-grid">
              <div class="tip-card">
                <h4 class="tip-title">明确具体</h4>
                <p class="tip-content">提供清晰、具体的指令，避免模糊表达</p>
              </div>
              <div class="tip-card">
                <h4 class="tip-title">提供示例</h4>
                <p class="tip-content">通过示例展示期望的输出格式</p>
              </div>
              <div class="tip-card">
                <h4 class="tip-title">分步骤思考</h4>
                <p class="tip-content">要求 Claude 逐步分析和解决问题</p>
              </div>
              <div class="tip-card">
                <h4 class="tip-title">设定角色</h4>
                <p class="tip-content">让 Claude 扮演特定角色来获得专业回复</p>
              </div>
            </div>
          </section>

          <!-- API参考 -->
          <section id="endpoints" class="doc-section">
            <h1 class="section-title">API 端点</h1>
            <p class="section-description">
              我们的中转服务提供以下 API 端点，与官方 API 完全兼容：
            </p>

            <div class="endpoint-list">
              <div class="endpoint-item">
                <div class="endpoint-method">POST</div>
                <div class="endpoint-path">/v1/messages</div>
                <div class="endpoint-desc">发送消息请求</div>
              </div>
              <div class="endpoint-item">
                <div class="endpoint-method">GET</div>
                <div class="endpoint-path">/v1/models</div>
                <div class="endpoint-desc">获取可用模型列表</div>
              </div>
            </div>
          </section>
        </div>

        <!-- 页面导航 -->
        <div class="page-nav">
          <div class="nav-item">
            <span class="nav-label">上一页</span>
            <router-link class="nav-link-btn" to="/">返回首页</router-link>
          </div>
          <div class="nav-item">
            <span class="nav-label">下一页</span>
            <router-link class="nav-link-btn" to="/api-stats">统计查询</router-link>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const themeStore = useThemeStore()
const sidebarOpen = ref(false)
const activeSection = ref('setup')

// 设置激活的章节
const setActiveSection = (section) => {
  activeSection.value = section
  sidebarOpen.value = false // 移动端点击后关闭侧边栏
}

// 复制代码功能
const copyCode = async (codeId) => {
  try {
    const codeElement = document.getElementById(codeId)
    const text = codeElement.textContent
    await navigator.clipboard.writeText(text)

    // 显示复制成功提示
    const copyBtn = codeElement.parentNode.querySelector('.copy-btn')
    const icon = copyBtn.querySelector('i')
    icon.className = 'fas fa-check'
    setTimeout(() => {
      icon.className = 'fas fa-copy'
    }, 2000)
  } catch (err) {
    // console.error('复制失败:', err)
  }
}

onMounted(() => {
  // 初始化主题
  themeStore.initTheme()
})
</script>

<style scoped>
/* JetBrains文档风格 */
.docs-container {
  background: #000000;
  min-height: 100vh;
  color: white;
}

/* 顶部导航 */
.docs-nav {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.nav-link {
  color: #a1a1aa;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #ffffff;
}

/* 文档布局 */
.docs-layout {
  display: flex;
  padding-top: 64px; /* 为固定导航栏留空间 */
  min-height: calc(100vh - 64px);
}

/* 左侧边栏 */
.docs-sidebar {
  width: 280px;
  background: #1c1c1e;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 30;
}

.docs-sidebar.sidebar-open {
  transform: translateX(0);
}

@media (min-width: 768px) {
  .docs-sidebar {
    position: sticky;
    transform: translateX(0);
    top: 64px;
    height: calc(100vh - 64px);
  }
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: between;
  align-items: center;
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

.sidebar-toggle {
  color: #a1a1aa;
  transition: color 0.3s ease;
}

.sidebar-toggle:hover {
  color: #ffffff;
}

/* 侧边栏导航 */
.sidebar-nav {
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #9333ea;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-section-title i {
  margin-right: 0.5rem;
}

.nav-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  display: block;
  padding: 0.5rem 2rem;
  color: #a1a1aa;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover,
.nav-item.active {
  color: #ffffff;
  background: rgba(147, 51, 234, 0.1);
  border-left-color: #9333ea;
}

/* 侧边栏遮罩 */
.sidebar-overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 20;
}

/* 主内容区域 */
.docs-content {
  flex: 1;
  padding: 2rem;
  margin-left: 0;
  max-width: 100%;
}

@media (min-width: 768px) {
  .docs-content {
    margin-left: 280px;
    max-width: calc(100% - 280px);
  }
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1c1c1e;
  color: #a1a1aa;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  color: #ffffff;
  background: rgba(147, 51, 234, 0.1);
  border-color: rgba(147, 51, 234, 0.3);
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: #9333ea;
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb-item:hover {
  color: #a855f7;
}

.breadcrumb-separator {
  color: #6b7280;
  margin: 0 0.5rem;
}

.breadcrumb-current {
  color: #a1a1aa;
}

/* 文档内容样式 */
.content-area {
  max-width: 800px;
}

.doc-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  font-size: 1.125rem;
  color: #a1a1aa;
  line-height: 1.7;
  margin-bottom: 2rem;
}

.subsection-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 2rem 0 1rem 0;
}

.text-content {
  color: #d1d5db;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

/* 代码块样式 */
.code-block {
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.code-header {
  background: rgba(147, 51, 234, 0.1);
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.code-lang {
  font-size: 0.875rem;
  font-weight: 500;
  color: #9333ea;
}

.copy-btn {
  color: #a1a1aa;
  transition: color 0.3s ease;
  padding: 0.25rem;
}

.copy-btn:hover {
  color: #ffffff;
}

.code-block pre {
  padding: 1.5rem;
  margin: 0;
  overflow-x: auto;
  background: transparent;
}

.code-block code {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #e5e7eb;
}

/* 提示卡片网格 */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.tip-card {
  background: rgba(28, 28, 30, 0.8);
  border: 1px solid rgba(147, 51, 234, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.tip-card:hover {
  border-color: rgba(147, 51, 234, 0.5);
  transform: translateY(-2px);
}

.tip-title {
  font-size: 1rem;
  font-weight: 600;
  color: #9333ea;
  margin-bottom: 0.5rem;
}

.tip-content {
  color: #a1a1aa;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* API端点列表 */
.endpoint-list {
  margin: 2rem 0;
}

.endpoint-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(28, 28, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.endpoint-method {
  background: #059669;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 1rem;
  min-width: 60px;
  text-align: center;
}

.endpoint-path {
  font-family: 'JetBrains Mono', monospace;
  color: #60a5fa;
  font-weight: 500;
  margin-right: 1rem;
}

.endpoint-desc {
  color: #a1a1aa;
  flex: 1;
}

/* 页面导航 */
.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.nav-link-btn {
  color: #9333ea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link-btn:hover {
  color: #a855f7;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .docs-content {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }

  .endpoint-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .endpoint-method {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .page-nav {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
