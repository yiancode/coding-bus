# Coding Bus 多域名认证与支付系统实现计划

## 项目概述

为 Coding Bus 实现完整的多域名认证（微信+Google）和跨域支付系统，支持国内外用户的统一认证和支付体验。

---

## 🎨 Stage 0: 首页落地页设计

### 0.1 整体设计理念

基于 Claude Code 官方落地页的设计风格，打造专业、现代、易用的 Coding Bus 首页。

**设计原则**：
- 🎯 **清晰的价值主张**：首屏突出核心价值（多平台AI中转、统一管理）
- 🚀 **渐进式引导**：从功能介绍 → 平台支持 → 定价方案 → 快速开始
- 💎 **视觉一致性**：保持与后台管理界面一致的玻璃态风格和渐变配色
- 📱 **响应式设计**：完美适配桌面、平板、手机
- 🌓 **暗黑模式兼容**：所有组件支持明亮/暗黑双主题

### 0.2 落地页结构（9个Section）

```
┌────────────────────────────────────────────────────┐
│ 1. 导航栏 (Navbar)                                  │
│    Logo + 导航菜单 + 登录/注册按钮                    │
├────────────────────────────────────────────────────┤
│ 2. 英雄区 (Hero Section)                           │
│    标题 + 副标题 + CTA按钮 + 动画效果                 │
├────────────────────────────────────────────────────┤
│ 3. 核心功能展示 (Features)                          │
│    4大核心功能卡片（多账户、智能调度、成本优化、监控）  │
├────────────────────────────────────────────────────┤
│ 4. 支持的平台 (Supported Platforms)                │
│    8大平台展示（Claude、Gemini、Bedrock等）          │
├────────────────────────────────────────────────────┤
│ 5. 定价方案 (Pricing)                              │
│    4个定价层级（免费、基础、专业、企业）               │
├────────────────────────────────────────────────────┤
│ 6. 使用场景 (Use Cases)                            │
│    3大应用场景（开发者、团队、企业）                   │
├────────────────────────────────────────────────────┤
│ 7. 客户端接入指南 (Client Integration)             │
│    快速接入步骤 + 代码示例                            │
├────────────────────────────────────────────────────┤
│ 8. 行动号召 (CTA Section)                          │
│    立即开始按钮 + 联系方式                            │
├────────────────────────────────────────────────────┤
│ 9. 页脚 (Footer)                                   │
│    链接、文档、社交媒体、版权信息                      │
└────────────────────────────────────────────────────┘
```

### 0.3 详细设计规范

#### 1. 导航栏组件 (LandingNavbar.vue)

```vue
<template>
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <span class="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            Coding Bus
          </span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <a href="#features" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            功能特性
          </a>
          <a href="#platforms" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            支持平台
          </a>
          <a href="#pricing" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            定价方案
          </a>
          <a href="#docs" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            文档
          </a>
        </div>

        <!-- Auth Buttons -->
        <div class="flex items-center space-x-4">
          <button
            @click="$router.push('/login')"
            class="hidden sm:block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            登录
          </button>
          <button
            @click="$router.push('/register')"
            class="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            免费开始
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div class="px-4 py-6 space-y-4">
        <a href="#features" class="block text-gray-700 dark:text-gray-300 hover:text-orange-500">功能特性</a>
        <a href="#platforms" class="block text-gray-700 dark:text-gray-300 hover:text-orange-500">支持平台</a>
        <a href="#pricing" class="block text-gray-700 dark:text-gray-300 hover:text-orange-500">定价方案</a>
        <a href="#docs" class="block text-gray-700 dark:text-gray-300 hover:text-orange-500">文档</a>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
const mobileMenuOpen = ref(false);
</script>
```

#### 2. 英雄区组件 (HeroSection.vue)

```vue
<template>
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <!-- Title -->
      <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
        <span class="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          多平台AI中转服务
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
        统一管理 Claude、Gemini、Codex 等 8 大平台账户<br/>
        智能调度、成本优化、实时监控，让 AI 开发更简单
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <button
          @click="$router.push('/register')"
          class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
        >
          免费开始使用
        </button>
        <button
          @click="scrollTo('#demo')"
          class="w-full sm:w-auto px-8 py-4 border-2 border-orange-500 text-orange-500 dark:text-orange-400 text-lg font-semibold rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 transition-all"
        >
          查看演示
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <div class="text-center">
          <div class="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            8+
          </div>
          <div class="text-gray-600 dark:text-gray-400 mt-2">支持平台</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            99.9%
          </div>
          <div class="text-gray-600 dark:text-gray-400 mt-2">服务可用性</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            <500ms
          </div>
          <div class="text-gray-600 dark:text-gray-400 mt-2">平均响应</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            24/7
          </div>
          <div class="text-gray-600 dark:text-gray-400 mt-2">全天候服务</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const scrollTo = (selector) => {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
};
</script>
```

#### 3. 核心功能展示 (FeaturesSection.vue)

```vue
<template>
  <section id="features" class="py-20 bg-white dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Title -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          核心功能特性
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          企业级 AI 中转服务，助力开发者高效使用多平台 AI 能力
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Feature 1: Multi-Account -->
        <div class="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl bg-white dark:bg-gray-800">
          <div class="w-14 h-14 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            多账户管理
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            支持 Claude、Gemini、Codex 等 8 大平台，统一管理多个账户，自动负载均衡
          </p>
        </div>

        <!-- Feature 2: Smart Scheduling -->
        <div class="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl bg-white dark:bg-gray-800">
          <div class="w-14 h-14 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            智能调度
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            粘性会话、并发控制、自动故障转移，确保请求高效可靠处理
          </p>
        </div>

        <!-- Feature 3: Cost Optimization -->
        <div class="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl bg-white dark:bg-gray-800">
          <div class="w-14 h-14 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            成本优化
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            实时成本统计、缓存监控、Token 使用分析，帮助您控制 AI 使用成本
          </p>
        </div>

        <!-- Feature 4: Real-time Monitoring -->
        <div class="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl bg-white dark:bg-gray-800">
          <div class="w-14 h-14 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            实时监控
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            现代化管理界面，实时查看系统状态、使用统计和账户健康度
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
```

#### 4. 支持的平台展示 (PlatformsSection.vue)

```vue
<template>
  <section id="platforms" class="py-20 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          支持的 AI 平台
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          一个服务，统一管理所有主流 AI 平台
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <!-- Platform Card Template -->
        <div
          v-for="platform in platforms"
          :key="platform.name"
          class="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg text-center"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" :class="platform.bgClass">
            <component :is="platform.icon" class="w-10 h-10 text-white"/>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
            {{ platform.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ platform.type }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const platforms = ref([
  { name: 'Claude Official', type: 'Anthropic API', bgClass: 'bg-gradient-to-r from-orange-500 to-red-600' },
  { name: 'Claude Console', type: 'Console 账户', bgClass: 'bg-gradient-to-r from-orange-600 to-red-700' },
  { name: 'AWS Bedrock', type: 'AWS 服务', bgClass: 'bg-gradient-to-r from-yellow-500 to-orange-600' },
  { name: 'Google Gemini', type: 'Google AI', bgClass: 'bg-gradient-to-r from-blue-500 to-purple-600' },
  { name: 'OpenAI Codex', type: 'Responses 格式', bgClass: 'bg-gradient-to-r from-green-500 to-teal-600' },
  { name: 'Azure OpenAI', type: 'Azure 服务', bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-700' },
  { name: 'Droid (Factory.ai)', type: 'Factory AI', bgClass: 'bg-gradient-to-r from-purple-500 to-pink-600' },
  { name: 'CCR 账户', type: 'CCR 凭据', bgClass: 'bg-gradient-to-r from-pink-500 to-rose-600' }
]);
</script>
```

#### 5. 定价方案 (PricingSection.vue)

```vue
<template>
  <section id="pricing" class="py-20 bg-white dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          灵活的定价方案
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          从免费试用到企业定制，总有适合您的方案
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Free Tier -->
        <div class="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">免费版</h3>
            <div class="text-4xl font-bold text-gray-900 dark:text-white">¥0</div>
            <div class="text-gray-500 dark:text-gray-400">永久免费</div>
          </div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">100 万 tokens/月</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">1 个 API Key</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">基础功能</span>
            </li>
          </ul>
          <button class="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors">
            开始使用
          </button>
        </div>

        <!-- Basic Tier -->
        <div class="p-8 rounded-xl border-2 border-orange-500 bg-white dark:bg-gray-800 relative">
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-semibold rounded-full">
            推荐
          </div>
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">基础版</h3>
            <div class="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">¥199</div>
            <div class="text-gray-500 dark:text-gray-400">/月</div>
          </div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">500 万 tokens/月</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">5 个 API Keys</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">所有平台支持</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">邮件支持</span>
            </li>
          </ul>
          <button class="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg">
            立即购买
          </button>
        </div>

        <!-- Pro Tier -->
        <div class="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">专业版</h3>
            <div class="text-4xl font-bold text-gray-900 dark:text-white">¥499</div>
            <div class="text-gray-500 dark:text-gray-400">/月</div>
          </div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">2000 万 tokens/月</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">无限 API Keys</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">优先技术支持</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">Webhook 通知</span>
            </li>
          </ul>
          <button class="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors">
            立即购买
          </button>
        </div>

        <!-- Enterprise Tier -->
        <div class="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">企业版</h3>
            <div class="text-4xl font-bold text-gray-900 dark:text-white">定制</div>
            <div class="text-gray-500 dark:text-gray-400">联系我们</div>
          </div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">无限 tokens</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">私有化部署</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">SLA 保障</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">专属技术顾问</span>
            </li>
          </ul>
          <button class="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors">
            联系销售
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
```

### 0.4 路由配置

在 `web/admin-spa/src/router/index.js` 中添加落地页路由：

```javascript
{
  path: '/',
  name: 'landing',
  component: () => import('@/views/LandingPageView.vue'),
  meta: { layout: 'blank', requiresAuth: false }
}
```

### 0.5 响应式设计要求

- **移动端 (< 640px)**：单列布局，导航栏汉堡菜单
- **平板端 (640px - 1024px)**：2列网格，适中字体
- **桌面端 (> 1024px)**：4列网格，完整导航

### 0.6 暗黑模式适配

所有组件必须同时支持明亮和暗黑模式：
- 背景：`bg-white dark:bg-gray-900`
- 文本：`text-gray-900 dark:text-white`
- 边框：`border-gray-200 dark:border-gray-700`
- 渐变色保持一致（`from-orange-500 to-red-600`）

**Status**: Not Started

---

## 🌐 域名架构设计

### 域名分配策略

| 域名 | 用途 | ICP备案 | 主体类型 | 支持的认证方式 | 支持的支付方式 |
|------|------|---------|----------|---------------|---------------|
| **code.ai80.net** | 主服务域名（国内） | ✅ 已备案 | 个人/企业 | 微信、Google、LDAP | - |
| **vilicode.com** | 国际服务域名 | ❌ 未备案 | - | Google | - |
| **code.ai80.vip** | 统一支付网关 | ✅ 已备案 | 企业 | - | 支付宝、微信支付 |

### 架构流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户访问层                                  │
│                                                                      │
│   code.ai80.net (国内)          vilicode.com (国际)                 │
│   支持: 微信+Google+LDAP         支持: Google                        │
└──────────────┬────────────────────────────┬─────────────────────────┘
               │                            │
               │  OAuth认证（跨域跳转）       │
               │                            │
               ├────────────┬───────────────┤
               │            │               │
          微信登录     Google登录      LDAP登录
          (via vip)                 (本地)
               │            │               │
               └────────────┴───────────────┘
                            │
                    获取 JWT Token
                            │
                ┌───────────┴────────────┐
                │                        │
           使用服务              需要付费功能
                │                        │
                │                        ↓
                │            跳转到 code.ai80.vip
                │            (统一支付网关)
                │                        │
                │                 完成支付
                │                        │
                │            更新用户余额/订阅
                │                        │
                └────────────────────────┘
```

### 核心设计理念

1. **认证域名分离**: code.ai80.net和vilicode.com作为用户访问域名，code.ai80.vip作为OAuth认证和支付的中转域名
2. **跨域安全**: 通过HMAC-SHA256签名、域名白名单、时间限制token确保跨域安全
3. **用户无感知**: 跨域跳转在1-2秒内完成，用户体验流畅
4. **统一会话**: JWT Token在各域名间通过URL参数传递，localStorage独立存储

---

## 📋 Stage 1: 多域名认证系统

### 1.1 微信登录集成（跨域方案）

#### 🎯 目标
在code.ai80.net（个人备案）实现微信登录，通过code.ai80.vip（企业备案）中转

#### 📐 完整登录流程

```
步骤1: 用户在 code.ai80.net 点击"微信登录"
   ↓
步骤2: 前端跳转到 code.ai80.vip/auth/wechat/login?return_domain=code.ai80.net
   ↓
步骤3: code.ai80.vip 生成微信授权URL（回调域名设置为 code.ai80.vip）
   ↓
步骤4: 重定向到微信授权页面（扫码）
   ↓
步骤5: 用户完成微信扫码授权
   ↓
步骤6: 微信回调 code.ai80.vip/auth/wechat/callback?code=xxx&state=xxx
   ↓
步骤7: code.ai80.vip 后端交换 access_token，获取用户信息
   ↓
步骤8: 创建/更新用户记录（provider='wechat'）
   ↓
步骤9: 生成 JWT Token（30天有效期）
   ↓
步骤10: 回跳到 code.ai80.net/auth/callback?token=xxx&provider=wechat
   ↓
步骤11: code.ai80.net 前端保存 token 到 localStorage，登录完成 ✅
```

#### 🔧 实现细节

##### 1. 微信开放平台配置

**前置条件**:
- 企业营业执照
- 企业对公账户（用于打款验证）
- 企业管理员身份证明
- 认证费用：300元/年

**申请步骤**:
1. 访问 https://open.weixin.qq.com/
2. 使用企业资质注册开发者账号
3. 提交企业认证（1-3个工作日）
4. 创建"网站应用"
5. **授权回调域名**: 填写 `code.ai80.vip`（不包含协议和路径）
6. 等待审核（1-3个工作日）
7. 获得 AppID 和 AppSecret

##### 2. 后端服务实现

**创建文件**:
```bash
touch src/services/wechatAuthService.js
touch src/routes/userAuthRoutes.js
```

**wechatAuthService.js** - 微信认证服务

```javascript
// src/services/wechatAuthService.js
const axios = require('axios');
const crypto = require('crypto');
const redis = require('../models/redis');
const logger = require('../utils/logger');

class WechatAuthService {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.redirectUri = process.env.WECHAT_REDIRECT_URI;
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8');
  }

  /**
   * 生成微信授权URL
   * @param {string} state - 包含返回域名的state参数
   */
  generateAuthUrl(state) {
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: encodeURIComponent(this.redirectUri),
      response_type: 'code',
      scope: 'snsapi_login', // 网站应用使用 snsapi_login
      state: state
    });

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  /**
   * 使用code交换access_token
   * @param {string} code - 微信返回的授权码
   */
  async exchangeCodeForToken(code) {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code: code,
        grant_type: 'authorization_code'
      };

      const response = await axios.get(url, { params, timeout: 10000 });

      if (response.data.errcode) {
        throw new Error(`微信token交换失败: ${response.data.errmsg}`);
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        openid: response.data.openid,
        unionid: response.data.unionid,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('微信token交换失败', { error: error.message, code });
      throw error;
    }
  }

  /**
   * 获取微信用户信息
   * @param {string} accessToken
   * @param {string} openid
   */
  async getUserInfo(accessToken, openid) {
    try {
      const url = 'https://api.weixin.qq.com/sns/userinfo';
      const params = {
        access_token: accessToken,
        openid: openid
      };

      const response = await axios.get(url, { params, timeout: 10000 });

      if (response.data.errcode) {
        throw new Error(`获取微信用户信息失败: ${response.data.errmsg}`);
      }

      return {
        openid: response.data.openid,
        unionid: response.data.unionid,
        nickname: response.data.nickname,
        avatar: response.data.headimgurl,
        sex: response.data.sex,
        province: response.data.province,
        city: response.data.city,
        country: response.data.country
      };
    } catch (error) {
      logger.error('获取微信用户信息失败', { error: error.message, openid });
      throw error;
    }
  }

  /**
   * 刷新access_token
   * @param {string} refreshToken
   */
  async refreshAccessToken(refreshToken) {
    const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
    const params = {
      appid: this.appId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    const response = await axios.get(url, { params });

    if (response.data.errcode) {
      throw new Error(`刷新token失败: ${response.data.errmsg}`);
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * 加密存储token
   */
  encryptToken(tokenData) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

    let encrypted = cipher.update(JSON.stringify(tokenData), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密token
   */
  decryptToken(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * 创建或更新微信用户
   */
  async createOrUpdateUser(wechatUser, tokenInfo) {
    const userService = require('./userService');

    // 查找已存在的用户（通过unionid或openid）
    let user = await userService.getUserByWechatId(wechatUser.unionid || wechatUser.openid);

    const userData = {
      provider: 'wechat',
      wechatOpenid: wechatUser.openid,
      wechatUnionid: wechatUser.unionid,
      name: wechatUser.nickname,
      avatar: wechatUser.avatar,
      lastLoginAt: new Date().toISOString()
    };

    if (!user) {
      // 创建新用户
      user = await userService.createUser({
        username: `wechat_${wechatUser.openid.substring(0, 10)}`,
        ...userData
      });
    } else {
      // 更新现有用户
      user = await userService.updateUser(user.id, userData);
    }

    // 加密并存储微信token
    const encryptedToken = this.encryptToken(tokenInfo);
    await redis.setex(
      `user:${user.id}:wechat_token`,
      tokenInfo.expiresIn,
      encryptedToken
    );

    return user;
  }
}

module.exports = new WechatAuthService();
```

**userAuthRoutes.js** - 认证路由

```javascript
// src/routes/userAuthRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const wechatAuthService = require('../services/wechatAuthService');
const googleAuthService = require('../services/googleAuthService');
const logger = require('../utils/logger');

/**
 * 生成state参数（包含原始域名、随机字符串、时间戳）
 */
function generateState(originalDomain) {
  const stateData = {
    random: crypto.randomBytes(16).toString('hex'),
    returnDomain: originalDomain,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(stateData)).toString('base64');
}

/**
 * 验证state参数
 */
function verifyState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    // 检查state是否在5分钟内有效
    if (Date.now() - decoded.timestamp > 5 * 60 * 1000) {
      return null;
    }

    // 验证回跳域名在白名单中
    const allowedDomains = process.env.ALLOWED_AUTH_RETURN_DOMAINS.split(',');
    if (!allowedDomains.some(d => decoded.returnDomain.includes(d))) {
      logger.warn('回跳域名不在白名单中', { domain: decoded.returnDomain });
      return null;
    }

    return decoded;
  } catch (error) {
    logger.error('state验证失败', { error: error.message });
    return null;
  }
}

/**
 * 生成JWT Token
 */
function generateJWT(user) {
  return jwt.sign(
    {
      userId: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name || user.nickname,
      avatar: user.avatar
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ==================== 微信登录 ====================

/**
 * 微信登录入口（跨域跳转）
 * GET /auth/wechat/login?return_domain=code.ai80.net
 */
router.get('/wechat/login', (req, res) => {
  try {
    const returnDomain = req.query.return_domain || req.get('referer');

    if (!returnDomain) {
      return res.status(400).json({ error: '缺少返回域名参数' });
    }

    // 生成包含原始域名的state
    const state = generateState(returnDomain);

    // 生成微信授权URL（回调域名是 code.ai80.vip）
    const authUrl = wechatAuthService.generateAuthUrl(state);

    logger.info('生成微信授权URL', { returnDomain, authUrl });

    // 重定向到微信授权页面
    res.redirect(authUrl);
  } catch (error) {
    logger.error('生成微信登录URL失败', { error: error.message });
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

/**
 * 微信登录回调（微信回调到 code.ai80.vip）
 * GET /auth/wechat/callback?code=xxx&state=xxx
 */
router.get('/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      throw new Error('缺少必要参数');
    }

    // 验证state
    const stateData = verifyState(state);
    if (!stateData) {
      throw new Error('无效的state参数或回跳域名');
    }

    // 1. 使用code交换access_token
    const tokenInfo = await wechatAuthService.exchangeCodeForToken(code);

    // 2. 获取用户信息
    const wechatUser = await wechatAuthService.getUserInfo(
      tokenInfo.accessToken,
      tokenInfo.openid
    );

    // 3. 创建或更新用户
    const user = await wechatAuthService.createOrUpdateUser(wechatUser, tokenInfo);

    // 4. 生成JWT
    const jwtToken = generateJWT(user);

    // 5. 回跳到原始域名
    const returnUrl = `https://${stateData.returnDomain}/auth/callback?token=${jwtToken}&provider=wechat`;

    logger.info('微信登录成功，回跳到', {
      userId: user.id,
      returnDomain: stateData.returnDomain
    });

    res.redirect(returnUrl);

  } catch (error) {
    logger.error('微信登录回调失败', { error: error.message, stack: error.stack });

    // 回跳到错误页面
    const stateData = req.query.state ? verifyState(req.query.state) : null;
    const returnDomain = stateData?.returnDomain || 'code.ai80.net';
    const errorUrl = `https://${returnDomain}/auth/error?message=${encodeURIComponent(error.message)}&provider=wechat`;

    res.redirect(errorUrl);
  }
});

// ==================== Google登录 ====================

/**
 * Google登录（使用GIS ID Token验证）
 * POST /auth/google/login
 * Body: { credential: "google_id_token", nonce: "optional_nonce" }
 */
router.post('/google/login', async (req, res) => {
  try {
    const { credential, nonce } = req.body;

    if (!credential) {
      return res.status(400).json({ error: '缺少Google credential' });
    }

    // 1. 验证Google ID Token
    const payload = await googleAuthService.verifyIdToken(credential, nonce);

    // 2. 验证email必须已验证
    if (!payload.email_verified) {
      return res.status(400).json({ error: '邮箱未验证，请使用已验证的Google账号' });
    }

    // 3. 检查域名白名单（可选）
    if (process.env.GOOGLE_OAUTH_ALLOWED_DOMAINS) {
      const allowedDomains = process.env.GOOGLE_OAUTH_ALLOWED_DOMAINS.split(',');
      const emailDomain = payload.email.split('@')[1];

      if (!allowedDomains.includes(emailDomain)) {
        return res.status(403).json({
          error: `不允许的邮箱域名。仅支持: ${allowedDomains.join(', ')}`
        });
      }
    }

    // 4. 创建或更新用户
    const user = await googleAuthService.createOrUpdateUser(payload);

    // 5. 生成JWT
    const jwtToken = generateJWT(user);

    // 6. 创建Redis会话（与现有系统兼容）
    const userService = require('../services/userService');
    const sessionToken = await userService.createUserSession(user.id);

    logger.info('Google登录成功', {
      userId: user.id,
      email: payload.email,
      provider: 'google'
    });

    res.json({
      success: true,
      token: jwtToken,
      sessionToken: sessionToken, // 兼容现有会话系统
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: 'google'
      }
    });

  } catch (error) {
    logger.error('Google登录失败', { error: error.message, stack: error.stack });

    res.status(401).json({
      error: error.message || 'Google登录失败，请稍后重试'
    });
  }
});

/**
 * 获取认证配置
 * GET /auth/config
 */
router.get('/config', (req, res) => {
  res.json({
    wechatEnabled: !!process.env.WECHAT_APP_ID,
    googleEnabled: process.env.GOOGLE_OAUTH_ENABLE === 'true',
    ldapEnabled: process.env.LDAP_ENABLED === 'true',
    allowedDomains: {
      google: process.env.GOOGLE_OAUTH_ALLOWED_DOMAINS?.split(',') || []
    }
  });
});

/**
 * 通用登出
 * POST /auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // 将token加入黑名单（15分钟TTL，足够JWT验证失败）
      const redis = require('../models/redis');
      await redis.setex(`token:blacklist:${token}`, 900, '1');
    }

    res.json({ success: true, message: '登出成功' });
  } catch (error) {
    logger.error('登出失败', { error: error.message });
    res.status(500).json({ error: '登出失败' });
  }
});

module.exports = router;
```

##### 3. Google认证服务实现

**创建文件**:
```bash
touch src/services/googleAuthService.js
```

**googleAuthService.js** - Google GIS认证

```javascript
// src/services/googleAuthService.js
const { OAuth2Client } = require('google-auth-library');
const redis = require('../models/redis');
const logger = require('../utils/logger');

class GoogleAuthService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.client = new OAuth2Client(this.clientId);
  }

  /**
   * 验证Google ID Token
   * @param {string} idToken - Google返回的ID token
   * @param {string} nonce - 可选的nonce参数（防重放攻击）
   */
  async verifyIdToken(idToken, nonce = null) {
    try {
      // 如果提供了nonce，检查是否已使用过
      if (nonce) {
        const nonceKey = `oauth_nonce:${nonce}`;
        const exists = await redis.get(nonceKey);

        if (exists) {
          throw new Error('Nonce已被使用，可能是重放攻击');
        }

        // 标记nonce为已使用（5分钟TTL）
        await redis.setex(nonceKey, 300, '1');
      }

      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: this.clientId
      });

      const payload = ticket.getPayload();

      // 验证issuer
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        throw new Error('无效的token issuer');
      }

      // 验证audience
      if (payload.aud !== this.clientId) {
        throw new Error('无效的token audience');
      }

      // 验证过期时间
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token已过期');
      }

      logger.info('Google ID Token验证成功', {
        sub: payload.sub,
        email: payload.email
      });

      return payload;

    } catch (error) {
      logger.error('Google ID Token验证失败', {
        error: error.message,
        category: this.categorizeError(error)
      });
      throw error;
    }
  }

  /**
   * 错误分类（用于监控和告警）
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('audience')) return 'invalid_audience';
    if (message.includes('expired')) return 'expired_token';
    if (message.includes('issuer')) return 'invalid_issuer';
    if (message.includes('nonce')) return 'replay_attempt';
    if (message.includes('domain')) return 'blocked_domain';

    return 'verification_failed';
  }

  /**
   * 提取和标准化Google用户信息
   */
  mapGoogleProfile(payload) {
    return {
      googleSub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      avatar: payload.picture,
      locale: payload.locale
    };
  }

  /**
   * 创建或更新Google用户
   */
  async createOrUpdateUser(payload) {
    const userService = require('./userService');

    const profile = this.mapGoogleProfile(payload);

    // 通过googleSub查找用户
    let user = await userService.getUserByGoogleSub(profile.googleSub);

    const userData = {
      provider: 'google',
      googleSub: profile.googleSub,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      lastLoginAt: new Date().toISOString()
    };

    if (!user) {
      // 检查邮箱是否已被其他provider使用
      const existingUser = await userService.getUserByEmail(profile.email);

      if (existingUser && existingUser.provider !== 'google') {
        throw new Error(
          `该邮箱已关联${existingUser.provider}账号，请联系管理员合并账户`
        );
      }

      // 创建新用户
      user = await userService.createUser({
        username: profile.email.split('@')[0],
        ...userData
      });
    } else {
      // 更新现有用户
      user = await userService.updateUser(user.id, userData);
    }

    return user;
  }
}

module.exports = new GoogleAuthService();
```

##### 4. 扩展userService支持OAuth

在现有的 `src/services/userService.js` 中添加以下方法：

```javascript
// src/services/userService.js 添加

/**
 * 通过微信ID查找用户
 */
async getUserByWechatId(wechatId) {
  const users = await this.getAllUsers();
  return users.find(u =>
    u.wechatUnionid === wechatId || u.wechatOpenid === wechatId
  );
}

/**
 * 通过GoogleSub查找用户
 */
async getUserByGoogleSub(googleSub) {
  const users = await this.getAllUsers();
  return users.find(u => u.googleSub === googleSub);
}

/**
 * 通过邮箱查找用户
 */
async getUserByEmail(email) {
  const users = await this.getAllUsers();
  return users.find(u => u.email === email);
}
```

##### 5. 前端实现 - 微信登录

**登录按钮组件** (`web/admin-spa/src/components/auth/WechatLoginButton.vue`)

```vue
<template>
  <button
    @click="handleWechatLogin"
    :disabled="isLoading"
    class="flex items-center justify-center w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
  >
    <svg v-if="!isLoading" class="w-5 h-5 mr-2" fill="#07C160" viewBox="0 0 24 24">
      <!-- 微信图标SVG -->
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-5.523 2.804-7.192C14.691 8.088 16.723 7.2 18.95 7.2c.87 0 1.714.11 2.523.315-.752-3.146-4.793-5.327-9.782-5.327zM6.196 7.12a.93.93 0 1 1 .002-1.86.93.93 0 0 1-.002 1.86zm5.012 0a.93.93 0 1 1 .002-1.86.93.93 0 0 1-.002 1.86z"/>
      <path d="M16.95 8.99c-4.508 0-8.076 2.753-8.076 6.155 0 1.984 1.049 3.768 2.691 4.972a.528.528 0 0 1 .19.592l-.348 1.323a1.19 1.19 0 0 0-.043.19c0 .146.116.264.259.264.067 0 .131-.02.189-.048l1.703-.997a.774.774 0 0 1 .641-.088c.67.188 1.383.294 2.118.294 4.508 0 8.076-2.753 8.076-6.155 0-3.401-3.568-6.502-8.076-6.502zm-1.546 7.772a.833.833 0 1 1 0-1.666.833.833 0 0 1 0 1.666zm3.68 0a.833.833 0 1 1 .001-1.667.833.833 0 0 1 0 1.667z"/>
    </svg>
    <svg v-else class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>{{ isLoading ? '正在跳转...' : '微信登录' }}</span>
  </button>

  <!-- 加载提示弹窗 -->
  <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
      <svg class="animate-spin h-10 w-10 mx-auto mb-4 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-gray-900 dark:text-white">正在跳转到微信登录...</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">请稍候</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLoading = ref(false);

const handleWechatLogin = () => {
  isLoading.value = true;

  // 获取当前域名
  const returnDomain = window.location.hostname;

  // 跳转到 code.ai80.vip 的微信登录入口
  const loginUrl = `https://code.ai80.vip/auth/wechat/login?return_domain=${returnDomain}`;

  // 设置超时保护（30秒）
  const timeout = setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
      alert('登录超时，请重试');
    }
  }, 30000);

  // 跳转
  window.location.href = loginUrl;
};
</script>
```

**登录回调处理** (`web/admin-spa/src/views/auth/AuthCallbackView.vue`)

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <svg class="animate-spin h-12 w-12 mx-auto mb-4 text-orange-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xl text-gray-900 dark:text-white">正在完成登录...</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const statusMessage = ref('验证登录凭据...');

onMounted(async () => {
  try {
    const { token, provider } = route.query;

    if (!token) {
      throw new Error('缺少登录凭据');
    }

    statusMessage.value = '保存登录状态...';

    // 保存JWT到localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_provider', provider);

    // 更新Pinia store
    authStore.token = token;
    authStore.isAuthenticated = true;

    statusMessage.value = '获取用户信息...';

    // 获取用户信息
    await authStore.fetchUserInfo();

    statusMessage.value = '登录成功，正在跳转...';

    // 延迟跳转，让用户看到成功消息
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);

  } catch (error) {
    console.error('登录回调处理失败:', error);
    alert(`登录失败: ${error.message}`);
    router.push('/login');
  }
});
</script>
```

**错误页面** (`web/admin-spa/src/views/auth/AuthErrorView.vue`)

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <svg class="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        登录失败
      </h2>

      <p class="text-gray-600 dark:text-gray-300 mb-6">
        {{ errorMessage }}
      </p>

      <div class="space-y-3">
        <button
          @click="retryLogin"
          class="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
        >
          重新登录
        </button>

        <button
          @click="goHome"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          返回首页
        </button>
      </div>

      <div class="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p>如果问题持续存在，请联系客服</p>
        <p class="mt-1">错误代码: {{ provider }}_auth_failed</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const errorMessage = ref('未知错误');
const provider = ref('unknown');

onMounted(() => {
  errorMessage.value = decodeURIComponent(route.query.message || '登录过程中发生错误');
  provider.value = route.query.provider || 'unknown';
});

const retryLogin = () => {
  router.push('/login');
};

const goHome = () => {
  router.push('/');
};
</script>
```

##### 6. Google登录前端实现

**Google登录按钮组件** (`web/admin-spa/src/components/auth/GoogleLoginButton.vue`)

```vue
<template>
  <div>
    <!-- Google按钮容器 -->
    <div
      id="google-signin-button"
      class="w-full flex items-center justify-center"
    ></div>

    <!-- 备用按钮（GIS加载失败时） -->
    <button
      v-if="showFallback"
      @click="handleManualLogin"
      class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>使用Google登录</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const showFallback = ref(false);

// 生成nonce（防重放攻击）
const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const handleGoogleCallback = async (response) => {
  try {
    const nonce = sessionStorage.getItem('google_auth_nonce');

    // 发送ID token到后端验证
    const result = await axios.post('/auth/google/login', {
      credential: response.credential,
      nonce: nonce
    });

    // 保存token
    authStore.setAuth(result.data);

    // 清除nonce
    sessionStorage.removeItem('google_auth_nonce');

    // 跳转到控制台
    router.push('/dashboard');

  } catch (error) {
    console.error('Google登录失败:', error);
    alert(error.response?.data?.error || 'Google登录失败，请重试');
  }
};

onMounted(() => {
  // 动态加载Google Identity Services脚本
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    // 初始化Google Identity Services
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      nonce: generateNonce(),
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // 生成并保存nonce
    const nonce = generateNonce();
    sessionStorage.setItem('google_auth_nonce', nonce);

    // 渲染Google按钮
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );

    // 可选：显示One Tap提示
    // window.google.accounts.id.prompt();
  };

  script.onerror = () => {
    console.error('Google Identity Services加载失败');
    showFallback.value = true;
  };

  document.head.appendChild(script);
});

const handleManualLogin = () => {
  alert('Google登录服务暂时不可用，请稍后重试或使用其他登录方式');
};
</script>
```

##### 7. 路由配置

更新 `web/admin-spa/src/router/index.js`：

```javascript
// 添加认证路由
{
  path: '/auth/callback',
  name: 'auth-callback',
  component: () => import('@/views/auth/AuthCallbackView.vue'),
  meta: { layout: 'blank' }
},
{
  path: '/auth/error',
  name: 'auth-error',
  component: () => import('@/views/auth/AuthErrorView.vue'),
  meta: { layout: 'blank' }
}
```

##### 8. Pinia Auth Store更新

扩展 `web/admin-spa/src/stores/auth.js`：

```javascript
// stores/auth.js 添加
async fetchUserInfo() {
  try {
    const response = await axios.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    this.user = response.data.user;
    this.isAuthenticated = true;

    localStorage.setItem('user_info', JSON.stringify(response.data.user));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    this.clearAuth();
    throw error;
  }
}
```

---

### 测试清单

#### 微信登录测试
- [ ] code.ai80.net → 微信登录 → 扫码授权 → 回跳成功
- [ ] vilicode.com → 微信登录 → 扫码授权 → 回跳成功
- [ ] 验证state参数有效性（5分钟超时）
- [ ] 验证域名白名单限制
- [ ] 测试用户信息获取和存储
- [ ] 测试JWT token生成和验证
- [ ] 测试重复登录（用户更新）

#### Google登录测试
- [ ] code.ai80.net → Google登录 → 授权 → 登录成功
- [ ] vilicode.com → Google登录 → 授权 → 登录成功
- [ ] 验证ID token签名
- [ ] 测试邮箱域名白名单（如果配置）
- [ ] 测试未验证邮箱拒绝
- [ ] 测试nonce防重放
- [ ] 测试用户创建和更新

#### 错误处理测试
- [ ] 无效state参数 → 跳转错误页
- [ ] 微信授权被拒 → 跳转错误页
- [ ] Google token验证失败 → 返回错误
- [ ] 网络超时处理
- [ ] 登出功能正常

**Status**: Not Started

---

## 📦 Stage 2: 跨域支付系统

### 2.1 支付网关架构

#### 🎯 设计目标

使用 **code.ai80.vip** 作为统一支付网关，处理所有域名的支付请求，确保支付安全和合规性。

#### 跨域支付完整流程

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1: 用户在 code.ai80.net/vilicode.com 点击购买                   │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 2: 生成支付请求参数                                             │
│  - amount: 199 (支付金额)                                             │
│  - userId: "encrypted_user_id" (AES加密)                              │
│  - planId: "plan_basic"                                               │
│  - returnUrl: "https://code.ai80.net"                                │
│  - signature: HMAC-SHA256(params, PAYMENT_SESSION_SECRET)            │
│  - timestamp: 1737461234567                                           │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 3: 跳转到支付网关                                               │
│  https://code.ai80.vip/payment?params...&signature=xxx                │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 4: code.ai80.vip 验证签名和参数                                 │
│  - 验证签名有效性（HMAC-SHA256）                                      │
│  - 检查timestamp（15分钟内有效）                                      │
│  - 验证returnUrl在白名单中                                             │
│  - 解密userId                                                         │
│  - 创建支付会话（15分钟TTL）                                          │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 5: 显示支付页面                                                 │
│  - 选择支付方式（支付宝/微信）                                         │
│  - 显示支付金额和订单信息                                              │
│  - 显示安全提示                                                       │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 6: 用户选择支付方式并完成支付                                    │
│  - 支付宝: 扫码或跳转                                                 │
│  - 微信支付: 扫码                                                     │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 7: 支付提供商回调                                               │
│  POST https://code.ai80.vip/payment/notify                            │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 8: 验证支付结果并更新数据                                        │
│  - 验证支付签名                                                       │
│  - 更新订单状态                                                       │
│  - 更新用户余额/订阅                                                  │
│  - 记录支付流水                                                       │
│  - 生成回调token                                                      │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 9: 回跳到原域名                                                 │
│  https://code.ai80.net/payment/success?token=callback_token           │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 10: 原域名验证回调token并更新前端状态                            │
│  - 验证token签名                                                      │
│  - 获取支付结果                                                       │
│  - 更新前端余额/订阅显示                                               │
│  - 显示支付成功页面                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 安全机制实现

#### 🔐 六重安全保障

1. **HMAC-SHA256签名**: 防止参数篡改
2. **域名白名单**: 只允许配置的域名回跳
3. **AES加密**: 敏感数据（userId）加密传输
4. **时间限制**: 支付会话15分钟自动过期
5. **CSRF保护**: State参数验证
6. **双重验证**: 支付签名 + 回调token

#### 实现代码

**创建文件**:
```bash
touch src/services/crossDomainPaymentService.js
touch src/routes/paymentGatewayRoutes.js
```

**crossDomainPaymentService.js** - 跨域支付服务

```javascript
// src/services/crossDomainPaymentService.js
const crypto = require('crypto');
const redis = require('../models/redis');
const logger = require('../utils/logger');

class CrossDomainPaymentService {
  constructor() {
    this.sessionSecret = Buffer.from(process.env.PAYMENT_SESSION_SECRET, 'utf8');
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8');
    this.allowedDomains = process.env.ALLOWED_RETURN_DOMAINS.split(',');
    this.sessionTTL = 900; // 15分钟
  }

  /**
   * 生成支付请求签名
   * @param {Object} params - 支付参数
   */
  generateSignature(params) {
    // 按key排序参数
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.sessionSecret)
      .update(sortedParams)
      .digest('hex');
  }

  /**
   * 验证支付请求签名
   */
  verifySignature(params, signature) {
    const { signature: _, ...paramsWithoutSignature } = params;
    const expectedSignature = this.generateSignature(paramsWithoutSignature);

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 加密用户ID
   */
  encryptUserId(userId) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

    let encrypted = cipher.update(userId, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密用户ID
   */
  decryptUserId(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 验证returnUrl在白名单中
   */
  isAllowedReturnDomain(returnUrl) {
    try {
      const url = new URL(returnUrl);
      return this.allowedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * 创建支付会话
   */
  async createPaymentSession(params) {
    const { amount, userId, planId, returnUrl, timestamp } = params;

    // 验证时间戳（15分钟内）
    if (Date.now() - parseInt(timestamp) > 15 * 60 * 1000) {
      throw new Error('请求已过期，请重新发起支付');
    }

    // 验证returnUrl
    if (!this.isAllowedReturnDomain(returnUrl)) {
      throw new Error('不允许的回跳域名');
    }

    // 生成会话ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // 存储会话数据（15分钟TTL）
    const sessionData = {
      sessionId,
      amount: parseFloat(amount),
      userId,
      planId,
      returnUrl,
      status: 'pending',
      createdAt: Date.now()
    };

    await redis.setex(
      `payment:session:${sessionId}`,
      this.sessionTTL,
      JSON.stringify(sessionData)
    );

    logger.info('创建支付会话', { sessionId, userId, amount });

    return sessionData;
  }

  /**
   * 获取支付会话
   */
  async getPaymentSession(sessionId) {
    const data = await redis.get(`payment:session:${sessionId}`);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * 更新支付会话状态
   */
  async updatePaymentSession(sessionId, updates) {
    const session = await this.getPaymentSession(sessionId);

    if (!session) {
      throw new Error('支付会话不存在或已过期');
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: Date.now()
    };

    await redis.setex(
      `payment:session:${sessionId}`,
      this.sessionTTL,
      JSON.stringify(updatedSession)
    );

    return updatedSession;
  }

  /**
   * 生成回调token（用于返回原域名）
   */
  generateCallbackToken(sessionId, status, orderId) {
    const tokenData = {
      sessionId,
      status,
      orderId,
      timestamp: Date.now()
    };

    const payload = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const signature = crypto
      .createHmac('sha256', this.sessionSecret)
      .update(payload)
      .digest('hex');

    return `${payload}.${signature}`;
  }

  /**
   * 验证回调token
   */
  verifyCallbackToken(token) {
    try {
      const [payload, signature] = token.split('.');

      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', this.sessionSecret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new Error('无效的token签名');
      }

      // 解码payload
      const tokenData = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

      // 验证时间戳（1小时内有效）
      if (Date.now() - tokenData.timestamp > 60 * 60 * 1000) {
        throw new Error('Token已过期');
      }

      return tokenData;

    } catch (error) {
      logger.error('回调token验证失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 处理支付成功
   */
  async handlePaymentSuccess(sessionId, transactionId, rawCallback) {
    const session = await this.getPaymentSession(sessionId);

    if (!session) {
      throw new Error('支付会话不存在');
    }

    if (session.status === 'completed') {
      logger.warn('重复的支付回调（幂等性保护）', { sessionId });
      return session.orderId;
    }

    // 创建订单记录
    const orderService = require('./orderService');
    const order = await orderService.createOrder({
      userId: session.userId,
      planId: session.planId,
      amount: session.amount,
      billingCycle: 'monthly',
      paymentMethod: 'alipay', // 根据实际情况
      status: 'paid',
      transactionId,
      paidAt: new Date().toISOString()
    });

    // 激活订阅或增加余额
    const subscriptionService = require('./subscriptionService');
    await subscriptionService.activateSubscription(
      session.userId,
      session.planId,
      'monthly',
      order.orderId
    );

    // 记录支付流水
    await redis.set(`payment_transaction:${transactionId}`, JSON.stringify({
      transactionId,
      orderId: order.orderId,
      userId: session.userId,
      amount: session.amount,
      paymentMethod: 'alipay',
      status: 'success',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rawCallback
    }));

    // 更新会话状态
    await this.updatePaymentSession(sessionId, {
      status: 'completed',
      orderId: order.orderId,
      transactionId
    });

    // 添加到用户余额日志
    await redis.lpush(
      `user:${session.userId}:balance_log`,
      JSON.stringify({
        type: 'payment',
        amount: session.amount,
        orderId: order.orderId,
        timestamp: Date.now()
      })
    );

    logger.info('支付处理完成', {
      sessionId,
      orderId: order.orderId,
      userId: session.userId
    });

    return order.orderId;
  }
}

module.exports = new CrossDomainPaymentService();
```

**paymentGatewayRoutes.js** - 支付网关路由

```javascript
// src/routes/paymentGatewayRoutes.js
const express = require('express');
const router = express.Router();
const crossDomainPaymentService = require('../services/crossDomainPaymentService');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

/**
 * 创建支付订单（从用户域名发起）
 * POST /api/payment/create
 * Body: { planId, billingCycle, returnUrl }
 */
router.post('/create', async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly', returnUrl } = req.body;
    const userId = req.user.userId; // 从JWT获取

    // 获取套餐信息
    const subscriptionService = require('../services/subscriptionService');
    const plan = await subscriptionService.getPlan(planId);

    const amount = billingCycle === 'monthly' ? plan.price : plan.yearPrice;

    // 生成支付参数
    const timestamp = Date.now().toString();
    const encryptedUserId = crossDomainPaymentService.encryptUserId(userId);

    const params = {
      amount: amount.toString(),
      userId: encryptedUserId,
      planId,
      returnUrl,
      timestamp
    };

    // 生成签名
    const signature = crossDomainPaymentService.generateSignature(params);

    // 构建支付网关URL
    const paymentGatewayUrl = new URL(`${process.env.PAYMENT_DOMAIN}/payment`);
    Object.keys(params).forEach(key => {
      paymentGatewayUrl.searchParams.append(key, params[key]);
    });
    paymentGatewayUrl.searchParams.append('signature', signature);

    logger.info('创建支付请求', { userId, planId, amount });

    res.json({
      success: true,
      paymentUrl: paymentGatewayUrl.toString()
    });

  } catch (error) {
    logger.error('创建支付请求失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * 支付网关页面（仅在 code.ai80.vip 上）
 * GET /payment?amount=xxx&userId=xxx&planId=xxx&returnUrl=xxx&timestamp=xxx&signature=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { signature, ...params } = req.query;

    // 验证签名
    if (!crossDomainPaymentService.verifySignature(params, signature)) {
      throw new Error('无效的签名');
    }

    // 解密userId
    const userId = crossDomainPaymentService.decryptUserId(params.userId);

    // 创建支付会话
    const session = await crossDomainPaymentService.createPaymentSession({
      ...params,
      userId
    });

    // 渲染支付页面（可以是静态HTML或Vue组件）
    res.render('payment/checkout', {
      sessionId: session.sessionId,
      amount: session.amount,
      planId: session.planId
    });

  } catch (error) {
    logger.error('支付页面加载失败', { error: error.message });
    res.status(400).send(`支付请求无效: ${error.message}`);
  }
});

/**
 * 处理支付（用户在支付页面选择支付方式）
 * POST /payment/process
 * Body: { sessionId, paymentMethod: 'alipay' | 'wechat' }
 */
router.post('/process', async (req, res) => {
  try {
    const { sessionId, paymentMethod } = req.body;

    // 获取支付会话
    const session = await crossDomainPaymentService.getPaymentSession(sessionId);

    if (!session) {
      throw new Error('支付会话不存在或已过期');
    }

    // 调用对应的支付服务
    let paymentResult;

    if (paymentMethod === 'alipay') {
      paymentResult = await paymentService.createAlipayOrder(
        session.userId,
        session.planId,
        'monthly'
      );
    } else if (paymentMethod === 'wechat') {
      paymentResult = await paymentService.createWechatOrder(
        session.userId,
        session.planId,
        'monthly'
      );
    } else {
      throw new Error('不支持的支付方式');
    }

    // 关联订单到会话
    await crossDomainPaymentService.updatePaymentSession(sessionId, {
      orderId: paymentResult.orderId,
      paymentMethod
    });

    res.json({
      success: true,
      ...paymentResult
    });

  } catch (error) {
    logger.error('处理支付失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * 支付回调（支付提供商回调）
 * POST /payment/notify
 */
router.post('/notify', async (req, res) => {
  try {
    // 获取支付方式（从URL参数或请求体）
    const paymentMethod = req.query.method || 'alipay';

    let result;

    if (paymentMethod === 'alipay') {
      result = await paymentService.handleAlipayNotify(req.body);
    } else if (paymentMethod === 'wechat') {
      result = await paymentService.handleWechatNotify(req.body);
    }

    // 查找对应的支付会话
    const orderId = req.body.out_trade_no;

    // 处理支付成功
    // （这部分逻辑可能需要根据实际的orderService调整）

    res.send('success');

  } catch (error) {
    logger.error('支付回调处理失败', { error: error.message });
    res.send('fail');
  }
});

/**
 * 支付回调页面（返回到原域名）
 * GET /payment/callback?token=xxx
 */
router.get('/callback', async (req, res) => {
  try {
    const { token } = req.query;

    // 验证回调token
    const tokenData = crossDomainPaymentService.verifyCallbackToken(token);

    // 获取支付会话
    const session = await crossDomainPaymentService.getPaymentSession(tokenData.sessionId);

    if (!session) {
      throw new Error('支付会话不存在');
    }

    // 回跳到原域名
    const returnUrl = new URL(session.returnUrl);
    returnUrl.searchParams.append('payment_status', tokenData.status);
    returnUrl.searchParams.append('order_id', tokenData.orderId);

    res.redirect(returnUrl.toString());

  } catch (error) {
    logger.error('支付回调失败', { error: error.message });
    res.status(400).send(`支付回调失败: ${error.message}`);
  }
});

/**
 * 查询支付状态
 * GET /payment/status/:sessionId
 */
router.get('/status/:sessionId', async (req, res) => {
  try {
    const session = await crossDomainPaymentService.getPaymentSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }

    res.json({
      status: session.status,
      orderId: session.orderId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 2.3 Redis数据结构完善

```javascript
// 支付会话（15分钟TTL）
payment:session:{sessionId} = {
  sessionId: "abc123...",
  amount: 199,
  userId: "user_xxx",
  planId: "plan_basic",
  returnUrl: "https://code.ai80.net/payment/success",
  status: "pending", // pending | processing | completed | failed
  orderId: "ord_xxx", // 关联的订单ID
  paymentMethod: "alipay",
  transactionId: "txn_xxx",
  createdAt: 1737461234567,
  updatedAt: 1737461434567
}

// 用户余额
user:{userId}:balance = "1000" // 余额（分）

// 用户余额变动日志
user:{userId}:balance_log = [
  {
    type: "payment", // payment | consume | refund
    amount: 199,
    orderId: "ord_xxx",
    timestamp: 1737461234567
  },
  ...
]

// OAuth token存储（加密）
user:{userId}:wechat_token = "iv:encrypted_data" // AES-256-CBC加密
user:{userId}:google_token = "iv:encrypted_data"

// OAuth nonce（防重放，5分钟TTL）
oauth_nonce:{nonce} = "1" // TTL: 300秒

// Token黑名单（登出，15分钟TTL）
token:blacklist:{token} = "1" // TTL: 900秒
```

### 2.4 环境变量完整配置

```env
# ==================== 服务配置 ====================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ==================== 安全密钥 ====================
JWT_SECRET=your_jwt_secret_min_32_chars_random_string
ENCRYPTION_KEY=your_encryption_key_exactly_32chars
PAYMENT_SESSION_SECRET=your_payment_session_secret_32chars

# ==================== 微信登录（使用企业域名 code.ai80.vip） ====================
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_wechat_app_secret_from_open_platform
WECHAT_REDIRECT_URI=https://code.ai80.vip/auth/wechat/callback

# ==================== Google登录（支持多域名） ====================
GOOGLE_OAUTH_ENABLE=true
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_ALLOWED_DOMAINS=example.com,example.org
GOOGLE_OAUTH_NONCE_TTL=300

# ==================== 跨域认证配置 ====================
ALLOWED_AUTH_RETURN_DOMAINS=code.ai80.net,vilicode.com
AUTH_CALLBACK_TIMEOUT=300

# ==================== 支付配置 ====================
# 支付网关域名
PAYMENT_DOMAIN=https://code.ai80.vip

# 允许的回跳域名
ALLOWED_RETURN_DOMAINS=code.ai80.net,vilicode.com

# 支付会话TTL（秒）
PAYMENT_SESSION_TTL=900

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key

# 微信支付配置
WECHAT_MCH_ID=your_merchant_id
WECHAT_SERIAL_NO=your_certificate_serial_no
WECHAT_APIV3_KEY=your_apiv3_key

# ==================== Redis配置 ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_ENABLE_TLS=false

# ==================== LDAP认证（可选） ====================
LDAP_ENABLED=false
LDAP_URL=ldaps://ldap.example.com:636
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin_password
LDAP_SEARCH_BASE=dc=example,dc=com
LDAP_SEARCH_FILTER=(uid={{username}})
LDAP_TLS_REJECT_UNAUTHORIZED=true

# ==================== 其他配置 ====================
# 用户管理
USER_MANAGEMENT_ENABLED=true
MAX_API_KEYS_PER_USER=5

# 日志
LOG_LEVEL=info

# Base URL（用于回调）
BASE_URL=https://code.ai80.vip
```

### 2.5 Nginx配置详解

#### code.ai80.net配置

```nginx
# /etc/nginx/sites-available/code.ai80.net

server {
    listen 443 ssl http2;
    server_name code.ai80.net;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/code.ai80.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/code.ai80.net/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 现代SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS (可选)
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 允许所有路由（主服务域名）
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # 传递真实IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持（SSE需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 流式响应配置
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
        proxy_request_buffering off;

        # 超时配置
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_connect_timeout 30s;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name code.ai80.net;
    return 301 https://$server_name$request_uri;
}
```

#### vilicode.com配置

```nginx
# /etc/nginx/sites-available/vilicode.com

server {
    listen 443 ssl http2;
    server_name vilicode.com;

    ssl_certificate /etc/letsencrypt/live/vilicode.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vilicode.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # 允许所有路由（国际服务域名）
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_buffering off;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}

server {
    listen 80;
    server_name vilicode.com;
    return 301 https://$server_name$request_uri;
}
```

#### code.ai80.vip配置（支付网关+认证中转）

```nginx
# /etc/nginx/sites-available/code.ai80.vip

server {
    listen 443 ssl http2;
    server_name code.ai80.vip;

    ssl_certificate /etc/letsencrypt/live/code.ai80.vip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/code.ai80.vip/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # 只允许认证和支付相关路由
    location ~ ^/(auth|payment) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 不需要WebSocket（认证和支付使用普通HTTP）
        proxy_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # 拒绝所有其他请求
    location / {
        return 403 "Access Denied - This domain is for authentication and payment only";
    }
}

server {
    listen 80;
    server_name code.ai80.vip;
    return 301 https://$server_name$request_uri;
}
```

---

## 测试清单 ✅

### 认证系统测试

#### 微信登录
- [ ] code.ai80.net → 微信登录 → 成功回跳
- [ ] vilicode.com → 微信登录 → 成功回跳（如支持）
- [ ] State参数验证（5分钟超时）
- [ ] 域名白名单验证
- [ ] 用户创建/更新
- [ ] JWT Token生成
- [ ] Token加密存储

#### Google登录
- [ ] code.ai80.net → Google登录 → 成功
- [ ] vilicode.com → Google登录 → 成功
- [ ] ID Token验证
- [ ] 邮箱验证检查
- [ ] 域名白名单（如配置）
- [ ] Nonce防重放
- [ ] 用户创建/更新

### 支付系统测试

#### 跨域支付流程
- [ ] code.ai80.net → 购买 → 跳转code.ai80.vip → 支付 → 回跳成功
- [ ] vilicode.com → 购买 → 跳转code.ai80.vip → 支付 → 回跳成功
- [ ] 签名验证正确
- [ ] 时间戳验证（15分钟）
- [ ] 域名白名单验证
- [ ] 用户ID加密/解密
- [ ] 支付会话创建
- [ ] 支付成功处理
- [ ] 订单创建
- [ ] 订阅激活
- [ ] 余额更新
- [ ] 回调Token验证

#### 支付方式测试
- [ ] 支付宝支付流程
- [ ] 微信支付流程
- [ ] 支付回调处理
- [ ] 重复回调幂等性

### 安全测试

#### 签名和加密
- [ ] HMAC-SHA256签名验证
- [ ] 篡改参数检测
- [ ] AES加密正确性
- [ ] Nonce防重放
- [ ] Token黑名单

#### 域名安全
- [ ] 域名白名单限制
- [ ] 非法域名拒绝
- [ ] HTTPS强制

#### 时间安全
- [ ] 支付会话15分钟过期
- [ ] State参数5分钟过期
- [ ] Token 1小时过期

---

## 部署清单 📦

### 环境变量检查
- [ ] JWT_SECRET（32字符以上）
- [ ] ENCRYPTION_KEY（32字符）
- [ ] PAYMENT_SESSION_SECRET（32字符）
- [ ] WECHAT_APP_ID、WECHAT_APP_SECRET
- [ ] GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET
- [ ] ALIPAY配置
- [ ] ALLOWED_AUTH_RETURN_DOMAINS
- [ ] ALLOWED_RETURN_DOMAINS
- [ ] PAYMENT_DOMAIN

### 域名和SSL
- [ ] code.ai80.net SSL证书
- [ ] vilicode.com SSL证书
- [ ] code.ai80.vip SSL证书
- [ ] Nginx配置部署
- [ ] DNS解析正确

### 第三方服务
- [ ] 微信开放平台审核通过
- [ ] Google OAuth配置完成
- [ ] 支付宝商户配置
- [ ] 微信支付商户配置

### 监控和日志
- [ ] 认证日志记录
- [ ] 支付日志记录
- [ ] 错误监控
- [ ] 性能监控

---

## 开发时间估算 ⏱️

- **Stage 1（多域名认证）**: 6-8天
  - 微信登录跨域实现：3-4天
  - Google登录GIS实现：2-3天
  - 前端集成和测试：1-2天

- **Stage 2（跨域支付）**: 5-7天
  - 支付网关实现：3-4天
  - 安全机制实现：1-2天
  - 前端集成和测试：1-2天

**总计**: 约11-15个工作日

---

## 成功指标 📊

### 技术指标
- 认证成功率 > 95%
- 支付成功率 > 98%
- 跨域跳转时间 < 2秒
- API响应时间 < 500ms
- 系统可用性 > 99.9%

### 安全指标
- 零签名伪造事件
- 零参数篡改事件
- 零非法域名回跳
- 所有敏感数据加密

### 用户体验指标
- 认证流程完成率 > 90%
- 支付流程完成率 > 85%
- 用户投诉率 < 1%

---

文档版本: 2.0
最后更新: 2025-01-21
维护者: Coding Bus Team