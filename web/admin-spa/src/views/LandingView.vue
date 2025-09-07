<template>
  <div class="landing-container">
    <!-- 固定顶部导航栏 -->
    <nav class="nav-glass fixed left-0 right-0 top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo和品牌名 -->
          <div class="flex items-center space-x-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-orange-500"
            >
              <span class="text-lg font-bold text-white">V</span>
            </div>
            <span class="text-xl font-bold tracking-tight text-white">vilicode</span>
          </div>

          <!-- 桌面端导航菜单 -->
          <div class="hidden items-center space-x-8 md:flex">
            <a class="nav-link" href="#features">功能</a>
            <a class="nav-link" href="#pricing">定价</a>
            <router-link class="nav-link" to="/docs">文档</router-link>
            <a class="nav-link" href="#testimonials">客户案例</a>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <ThemeToggle mode="icon" />

            <!-- 统计查询入口 -->
            <router-link
              class="text-gray-300 transition-colors duration-200 hover:text-white"
              to="/api-stats"
            >
              统计查询
            </router-link>

            <!-- 用户登录 -->
            <router-link
              class="text-gray-300 transition-colors duration-200 hover:text-white"
              to="/user-login"
            >
              登录
            </router-link>

            <!-- 开始使用按钮 -->
            <button class="btn-gradient">开始使用</button>

            <!-- 移动端汉堡菜单 -->
            <button
              class="text-gray-300 hover:text-white md:hidden"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <i class="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <div
        v-if="mobileMenuOpen"
        class="border-t border-gray-800 bg-black/90 backdrop-blur-xl md:hidden"
      >
        <div class="space-y-4 px-4 py-6">
          <a class="nav-link block" href="#features">功能</a>
          <a class="nav-link block" href="#pricing">定价</a>
          <router-link class="nav-link block" to="/docs">文档</router-link>
          <a class="nav-link block" href="#testimonials">客户案例</a>
          <div class="border-t border-gray-800 pt-4">
            <router-link class="nav-link block" to="/user-login">登录</router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero区域 -->
    <section class="hero-section">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <!-- 主标题 -->
          <h1 class="hero-title">
            <span v-if="typingText" class="typing-text">{{ displayText }}</span>
            <span v-else>Claude Code 专业中转服务</span>
            <span v-if="showCursor" class="typing-cursor">|</span>
          </h1>

          <!-- 副标题 -->
          <p class="hero-subtitle">官方10%价格，100%相同体验</p>

          <!-- 核心卖点标签 -->
          <div class="mb-12 mt-8 flex flex-wrap justify-center gap-4">
            <span class="feature-tag">
              <i class="fas fa-database mr-2"></i>
              海量$200账户池
            </span>
            <span class="feature-tag">
              <i class="fas fa-shield-alt mr-2"></i>
              零封号风险
            </span>
            <span class="feature-tag">
              <i class="fas fa-headset mr-2"></i>
              专家1对1支持
            </span>
          </div>

          <!-- CTA按钮组 -->
          <div class="flex flex-col justify-center gap-4 sm:flex-row">
            <button class="btn-primary" @click="handleFreeTrialClick">
              免费体验 $10
              <i class="fas fa-arrow-right ml-2"></i>
            </button>
            <button class="btn-secondary" @click="handlePricingClick">查看定价方案</button>
          </div>

          <!-- 微信客服提示 -->
          <div class="mt-8 flex items-center justify-center text-gray-400">
            <i class="fab fa-weixin mr-2 text-green-500"></i>
            <span class="text-sm">添加客服微信：20133213 申请体验金</span>
          </div>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="hero-bg-decoration">
        <!-- 几何网格 -->
        <div class="geometric-grid"></div>

        <!-- 代码浮动动画 -->
        <div class="floating-code">
          <div class="code-snippet code-snippet-1">
            <span class="code-keyword">const</span>
            <span class="code-variable">response</span> =
            <span class="code-keyword">await</span>
            <span class="code-function">claude.chat</span>()
          </div>
          <div class="code-snippet code-snippet-2">
            <span class="code-comment">// 零封号风险</span>
          </div>
          <div class="code-snippet code-snippet-3">
            <span class="code-keyword">if</span> (<span class="code-variable">success</span>) {
          </div>
          <div class="code-snippet code-snippet-4">
            <span class="code-string">"price": "$20/month"</span>
          </div>
          <div class="code-snippet code-snippet-5">
            <span class="code-function">loadBalance</span>(<span class="code-variable"
              >accounts</span
            >)
          </div>
        </div>
      </div>
    </section>

    <!-- 功能特性区域 -->
    <section id="features" class="relative bg-gray-900 py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- 区域标题 -->
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-4xl font-bold text-white">为什么选择我们？</h2>
          <p class="mx-auto max-w-3xl text-xl text-gray-400">
            基于海量官方$200 Max账户池的专业中转服务，为开发者提供稳定、安全、高性价比的Claude
            API访问体验
          </p>
        </div>

        <!-- 功能特性网格 -->
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- 特性1: 海量账户池 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-database"></i>
            </div>
            <h3 class="feature-title">海量账户池</h3>
            <p class="feature-description">
              100+ 官方 $200 Max
              账户组成的动态资源池，通过负载均衡策略进行实时轮询调度，确保服务高可用性
            </p>
            <div class="feature-highlight">动态调度 • 负载均衡</div>
          </div>

          <!-- 特性2: 零封号风险 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-shield-alt"></i>
            </div>
            <h3 class="feature-title">零封号风险</h3>
            <p class="feature-description">
              采用技术中转方式，您的账号不会面临任何封号风险。专业的技术架构确保用户账号完全安全
            </p>
            <div class="feature-highlight">技术中转 • 账号安全</div>
          </div>

          <!-- 特性3: 无速率限制 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <h3 class="feature-title">无速率限制</h3>
            <p class="feature-description">
              达到限额即时切换到其他账户，避免单一账户的速率限制，确保API调用的连续性和稳定性
            </p>
            <div class="feature-highlight">即时切换 • 连续稳定</div>
          </div>

          <!-- 特性4: 完全兼容 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <h3 class="feature-title">完全兼容</h3>
            <p class="feature-description">
              与官方 API
              完全相同的响应格式，无需修改任何现有代码，响应速度、数据格式和模型能力完全一致
            </p>
            <div class="feature-highlight">100%兼容 • 零修改</div>
          </div>

          <!-- 特性5: 专家支持 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-headset"></i>
            </div>
            <h3 class="feature-title">专家支持</h3>
            <p class="feature-description">
              1对1工程师远程技术支持，非机器人客服。技术团队全天候在线，远程协助解决问题
            </p>
            <div class="feature-highlight">1对1支持 • 24/7在线</div>
          </div>

          <!-- 特性6: 超高性价比 -->
          <div class="feature-card" @mouseenter="animateCard" @mouseleave="resetCard">
            <div class="feature-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <h3 class="feature-title">超高性价比</h3>
            <p class="feature-description">
              相比官方 $200 固定月费，我们提供灵活计费选择，价格仅为官方的10%，性价比提升400%
            </p>
            <div class="feature-highlight">节省90% • 性价比之王</div>
          </div>
        </div>

        <!-- 统计数据展示 -->
        <div class="mt-20 grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div class="stat-item">
            <div class="stat-number">10000+</div>
            <div class="stat-label">开发者用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">服务稳定性</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">500万+</div>
            <div class="stat-label">API调用次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">24/7</div>
            <div class="stat-label">技术支持</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 定价方案部分 -->
    <section
      id="pricing"
      class="relative bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800"
    >
      <div class="container mx-auto px-4">
        <div class="mb-16 text-center">
          <h2 class="section-title">选择适合您的方案</h2>
          <p class="section-subtitle mt-4">灵活的定价选择，满足不同开发需求</p>
        </div>

        <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <!-- 标准版 -->
          <div class="pricing-card pricing-card-standard">
            <div class="pricing-header">
              <h3 class="pricing-title">标准版</h3>
              <div class="pricing-price">
                <span class="pricing-currency">$</span>
                <span class="pricing-amount">20</span>
                <span class="pricing-period">/每日</span>
              </div>
              <div class="pricing-price-cny">≈ ¥140/月</div>
              <div class="pricing-token-desc">$20 Token额度</div>
            </div>

            <div class="pricing-features">
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>$20 Token额度/每日</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>Claude 4.0 Sonnet 支持</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>智能负载均衡</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>99.9% 服务可用性</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>24/7 技术支持</span>
              </div>
            </div>

            <div class="pricing-footer">
              <button class="pricing-btn pricing-btn-standard" @click="handleSignupClick">
                开始使用
              </button>
            </div>
          </div>

          <!-- Plus版（推荐） -->
          <div class="pricing-card pricing-card-plus">
            <div class="pricing-badge">推荐</div>
            <div class="pricing-header">
              <h3 class="pricing-title">Plus版</h3>
              <div class="pricing-price">
                <span class="pricing-currency">$</span>
                <span class="pricing-amount">50</span>
                <span class="pricing-period">/每日</span>
              </div>
              <div class="pricing-price-cny">≈ ¥350/月</div>
              <div class="pricing-token-desc">$50 Token额度</div>
            </div>

            <div class="pricing-features">
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>$50 Token额度/每日</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>Claude 4.0 Sonnet 支持</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>智能负载均衡</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>99.99% 服务可用性</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>优先技术支持</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>专属账户池</span>
              </div>
            </div>

            <div class="pricing-footer">
              <button class="pricing-btn pricing-btn-plus" @click="handleSignupClick">
                立即升级
              </button>
            </div>
          </div>

          <!-- Pro版 -->
          <div class="pricing-card pricing-card-pro">
            <div class="pricing-header">
              <h3 class="pricing-title">Pro版</h3>
              <div class="pricing-price">
                <span class="pricing-currency">$</span>
                <span class="pricing-amount">100</span>
                <span class="pricing-period">/每日</span>
              </div>
              <div class="pricing-price-cny">≈ ¥700/月</div>
              <div class="pricing-token-desc">$100 Token额度</div>
            </div>

            <div class="pricing-features">
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>$100 Token额度/每日</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>Claude 4.0 Sonnet 支持</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>智能负载均衡</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>99.99% SLA保障</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>1对1专家支持</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>独享账户资源</span>
              </div>
              <div class="pricing-feature">
                <i class="fas fa-check pricing-check"></i>
                <span>API优先级支持</span>
              </div>
            </div>

            <div class="pricing-footer">
              <button class="pricing-btn pricing-btn-pro" @click="handleSignupClick">
                选择Pro版
              </button>
            </div>
          </div>
        </div>

        <!-- 免费试用提示 -->
        <div class="mt-16 text-center">
          <div class="free-trial-banner">
            <div class="free-trial-content">
              <h3 class="free-trial-title">🎁 免费试用 & 定制服务</h3>
              <p class="free-trial-description">
                新用户免费获得 <span class="highlight">$10</span> 额度！<br />
                需要更多额度？联系客服微信 <span class="wechat-id">20133213</span> 获取定制方案
              </p>
              <div class="flex flex-col justify-center gap-4 sm:flex-row">
                <button class="free-trial-btn" @click="handleTrialClick">申请免费试用</button>
                <button class="custom-plan-btn" @click="handleCustomPlanClick">定制更多额度</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

// 打字机效果相关
const typingText = ref(true)
const displayText = ref('')
const showCursor = ref(true)
const fullText = 'Claude Code 专业中转服务'
const typingSpeed = 150 // 打字速度（毫秒）
let typingTimer = null
let cursorTimer = null

// 打字机效果函数
const startTyping = () => {
  let index = 0
  typingTimer = setInterval(() => {
    if (index < fullText.length) {
      displayText.value = fullText.substring(0, index + 1)
      index++
    } else {
      clearInterval(typingTimer)
      // 打字完成后，隐藏光标并显示完整文本
      setTimeout(() => {
        typingText.value = false
        showCursor.value = false
      }, 1000)
    }
  }, typingSpeed)
}

// 光标闪烁效果
const startCursorBlink = () => {
  cursorTimer = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 500)
}

// 平滑滚动到指定元素
const scrollToElement = (elementId) => {
  const element = document.querySelector(elementId)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// 处理CTA按钮点击
const handleFreeTrialClick = () => {
  // 跳转到用户登录页面
  window.location.href = '/user-login'
}

const handlePricingClick = () => {
  scrollToElement('#pricing')
}

// 处理注册按钮点击
const handleSignupClick = () => {
  window.location.href = '/user-login'
}

// 处理免费试用点击
const handleTrialClick = () => {
  // 可以展示微信二维码或复制微信号
  navigator.clipboard
    .writeText('20133213')
    .then(() => {
      alert('客服微信号已复制：20133213\n请添加微信申请免费试用！')
    })
    .catch(() => {
      alert('客服微信号：20133213\n请手动复制添加微信申请免费试用！')
    })
}

// 处理定制方案点击
const handleCustomPlanClick = () => {
  navigator.clipboard
    .writeText('20133213')
    .then(() => {
      alert('客服微信号已复制：20133213\n请添加微信获取更多额度定制方案！')
    })
    .catch(() => {
      alert('客服微信号：20133213\n请手动复制添加微信获取更多额度定制方案！')
    })
}

// 特性卡片动画
const animateCard = (event) => {
  const card = event.currentTarget
  card.style.transform = 'translateY(-8px) scale(1.02)'
}

const resetCard = (event) => {
  const card = event.currentTarget
  card.style.transform = 'translateY(0) scale(1)'
}

onMounted(() => {
  // 初始化主题（默认深色）
  themeStore.initTheme()

  // 延迟开始打字机效果，让页面先加载
  setTimeout(() => {
    startTyping()
    startCursorBlink()
  }, 500)
})

onUnmounted(() => {
  // 清理定时器
  if (typingTimer) clearInterval(typingTimer)
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<style scoped>
/* JetBrains深色专业风格 + trae.ai现代美感 */

.landing-container {
  background: #000000; /* JetBrains纯黑背景 */
  min-height: 100vh;
  color: white;
}

/* 导航栏玻璃态效果 */
.nav-glass {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 导航链接样式 */
.nav-link {
  color: #a1a1aa;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #ffffff;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

/* Hero区域 */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding-top: 64px; /* 为固定导航栏留空间 */
}

/* 主标题渐变效果 (trae.ai风格) */
.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  min-height: 4.2rem; /* 防止打字机效果时布局跳动 */
}

/* 打字机光标效果 */
.typing-cursor {
  color: #9333ea;
  font-weight: 300;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
}

/* 副标题 */
.hero-subtitle {
  font-size: 1.25rem;
  color: #a1a1aa;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 特性标签 */
.feature-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(28, 28, 30, 0.8);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 50px;
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* 渐变按钮 (trae.ai风格) */
.btn-gradient,
.btn-primary {
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  color: white;
  padding: 12px 32px;
  border-radius: 50px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);
  display: inline-flex;
  align-items: center;
}

.btn-gradient:hover,
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(147, 51, 234, 0.6);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: white;
  padding: 12px 32px;
  border: 2px solid rgba(147, 51, 234, 0.5);
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(147, 51, 234, 0.1);
  border-color: #9333ea;
  transform: translateY(-1px);
}

/* 背景装饰 */
.hero-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

/* 几何网格装饰 (JetBrains风格) */
.geometric-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

/* 添加微妙的紫色光晕效果 */
.hero-section::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: -1;
}

/* 代码浮动动画效果 (JetBrains风格) */
.floating-code {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}

.code-snippet {
  position: absolute;
  background: rgba(28, 28, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(147, 51, 234, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0.7;
}

/* 代码语法高亮 */
.code-keyword {
  color: #9333ea;
  font-weight: 600;
}
.code-variable {
  color: #60a5fa;
}
.code-function {
  color: #34d399;
}
.code-string {
  color: #fbbf24;
}
.code-comment {
  color: #6b7280;
  font-style: italic;
}

/* 不同代码片段的位置和动画 */
.code-snippet-1 {
  top: 15%;
  left: 10%;
  animation: float1 15s infinite ease-in-out;
}

.code-snippet-2 {
  top: 25%;
  right: 15%;
  animation: float2 18s infinite ease-in-out;
}

.code-snippet-3 {
  bottom: 30%;
  left: 5%;
  animation: float3 20s infinite ease-in-out;
}

.code-snippet-4 {
  bottom: 20%;
  right: 10%;
  animation: float4 16s infinite ease-in-out;
}

.code-snippet-5 {
  top: 40%;
  left: 20%;
  animation: float5 22s infinite ease-in-out;
}

/* 浮动动画关键帧 */
@keyframes float1 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  25% {
    transform: translate(30px, -20px) rotate(1deg);
    opacity: 0.7;
  }
  50% {
    transform: translate(-20px, 15px) rotate(-1deg);
    opacity: 0.5;
  }
  75% {
    transform: translate(25px, 10px) rotate(0.5deg);
    opacity: 0.6;
  }
}

@keyframes float2 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  33% {
    transform: translate(-25px, 20px) rotate(-0.5deg);
    opacity: 0.6;
  }
  66% {
    transform: translate(15px, -25px) rotate(1deg);
    opacity: 0.7;
  }
}

@keyframes float3 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  20% {
    transform: translate(20px, -30px) rotate(0.8deg);
    opacity: 0.6;
  }
  40% {
    transform: translate(-15px, -10px) rotate(-0.3deg);
    opacity: 0.5;
  }
  60% {
    transform: translate(10px, 20px) rotate(0.2deg);
    opacity: 0.7;
  }
  80% {
    transform: translate(-20px, 5px) rotate(-0.5deg);
    opacity: 0.4;
  }
}

@keyframes float4 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.5;
  }
  40% {
    transform: translate(-30px, -15px) rotate(-1deg);
    opacity: 0.7;
  }
  80% {
    transform: translate(20px, 25px) rotate(0.7deg);
    opacity: 0.4;
  }
}

@keyframes float5 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  30% {
    transform: translate(25px, 20px) rotate(0.5deg);
    opacity: 0.6;
  }
  60% {
    transform: translate(-30px, -15px) rotate(-0.8deg);
    opacity: 0.7;
  }
  90% {
    transform: translate(15px, -10px) rotate(0.3deg);
    opacity: 0.5;
  }
}

/* 移动端隐藏代码动画以优化性能 */
@media (max-width: 768px) {
  .floating-code {
    display: none;
  }
}

/* ================== 功能特性区域样式 ================== */

/* 特性卡片 (JetBrains深色卡片风格) */
.feature-card {
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover {
  border-color: rgba(147, 51, 234, 0.5);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(147, 51, 234, 0.2);
}

.feature-card:hover::before {
  opacity: 1;
}

/* 特性图标 */
.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.feature-icon i {
  font-size: 1.5rem;
  color: white;
}

/* 特性标题 */
.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

/* 特性描述 */
.feature-description {
  color: #a1a1aa;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

/* 特性亮点标签 */
.feature-highlight {
  display: inline-block;
  background: rgba(147, 51, 234, 0.2);
  color: #c084fc;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  border: 1px solid rgba(147, 51, 234, 0.3);
  position: relative;
  z-index: 1;
}

/* 统计数据样式 */
.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .feature-card {
    padding: 1.5rem;
  }

  .feature-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
  }

  .feature-icon i {
    font-size: 1.25rem;
  }

  .feature-title {
    font-size: 1.25rem;
  }

  .stat-number {
    font-size: 2rem;
  }
}

/* 滚动触发动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card {
  animation: fadeInUp 0.6s ease-out;
}

/* 为不同的卡片添加延迟动画 */
.feature-card:nth-child(1) {
  animation-delay: 0.1s;
}
.feature-card:nth-child(2) {
  animation-delay: 0.2s;
}
.feature-card:nth-child(3) {
  animation-delay: 0.3s;
}
.feature-card:nth-child(4) {
  animation-delay: 0.4s;
}
.feature-card:nth-child(5) {
  animation-delay: 0.5s;
}
.feature-card:nth-child(6) {
  animation-delay: 0.6s;
}

/* 定价卡片样式 */
.pricing-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dark .pricing-card {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(147, 51, 234, 0.3);
}

/* 推荐标签 */
.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
}

/* Plus版特殊样式 */
.pricing-card-plus {
  border: 2px solid;
  border-image: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%) 1;
  border-radius: 20px;
  position: relative;
  background: rgba(147, 51, 234, 0.05);
}

.pricing-card-standard,
.pricing-card-pro {
  background: rgba(255, 255, 255, 0.03);
}

.dark .pricing-card-standard,
.dark .pricing-card-pro {
  background: rgba(0, 0, 0, 0.1);
}

.pricing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.pricing-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.dark .pricing-title {
  color: #ffffff;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.pricing-currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: #9333ea;
}

.pricing-amount {
  font-size: 3rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0.25rem;
}

.pricing-period {
  font-size: 1.125rem;
  color: #a1a1aa;
}

.pricing-price-cny {
  font-size: 1rem;
  color: #a1a1aa;
  text-align: center;
}

.pricing-token-desc {
  font-size: 0.875rem;
  color: #9333ea;
  text-align: center;
  font-weight: 600;
  margin-top: 0.25rem;
}

.pricing-features {
  flex: 1;
  margin-bottom: 2rem;
}

.pricing-feature {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #e5e5e5;
}

.pricing-check {
  color: #22c55e;
  margin-right: 0.75rem;
  font-size: 1rem;
}

.pricing-footer {
  text-align: center;
}

.pricing-btn {
  width: 100%;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.pricing-btn-standard {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pricing-btn-standard:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.pricing-btn-plus {
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
}

.pricing-btn-plus:hover {
  box-shadow: 0 6px 30px rgba(147, 51, 234, 0.6);
  transform: translateY(-2px);
}

.pricing-btn-pro {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pricing-btn-pro:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* 免费试用横幅 */
.free-trial-banner {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.free-trial-content {
  text-align: center;
}

.free-trial-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.free-trial-description {
  color: #e5e5e5;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.highlight {
  color: #9333ea;
  font-weight: 700;
  font-size: 1.125rem;
}

.wechat-id {
  color: #ff6b35;
  font-weight: 700;
  background: rgba(255, 107, 53, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.free-trial-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
}

.free-trial-btn:hover {
  box-shadow: 0 6px 30px rgba(34, 197, 94, 0.6);
  transform: translateY(-2px);
}

.custom-plan-btn {
  background: linear-gradient(135deg, #9333ea 0%, #ff6b35 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
}

.custom-plan-btn:hover {
  box-shadow: 0 6px 30px rgba(147, 51, 234, 0.6);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pricing-card {
    padding: 1.5rem;
  }

  .pricing-amount {
    font-size: 2.5rem;
  }

  .free-trial-banner {
    padding: 1.5rem;
  }
}
</style>
