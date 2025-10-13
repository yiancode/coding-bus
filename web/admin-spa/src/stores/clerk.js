/**
 * Clerk 认证状态管理 Store
 * 专门处理 Clerk OAuth 社交登录相关的状态和逻辑
 * 与现有的 user store 协作，提供统一的用户认证体验
 */

import { defineStore } from 'pinia'
import { useClerk, useUser } from '@clerk/vue'
import { ref, computed, watch, readonly } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useUserStore } from './user'
import { OAUTH_PROVIDERS, CLERK_ERROR_MESSAGES } from '@/config/clerk'
import axios from 'axios'

export const useClerkStore = defineStore('clerk', () => {
  // ========== 响应式数据 ==========

  // Clerk 初始化状态
  const isClerkReady = ref(false)
  const isClerkLoading = ref(true)

  // 用户认证状态
  const isAuthenticated = ref(false)
  const isSigningIn = ref(false)
  const isSigningOut = ref(false)

  // Clerk 用户信息
  const clerkUser = ref(null)
  const clerkSession = ref(null)
  const clerkToken = ref(null)

  // OAuth 提供商状态
  const availableProviders = ref(Object.keys(OAUTH_PROVIDERS))
  const activeProvider = ref(null)

  // 错误状态管理
  const lastError = ref(null)
  const errorCount = ref(0)

  // ========== Clerk 实例获取 ==========

  let clerkInstance = null
  let userInstance = null

  // 初始化 Clerk 实例
  function initializeClerk() {
    try {
      console.log('Clerk Store: 开始初始化')

      // 尝试获取 Clerk 实例
      clerkInstance = useClerk()
      userInstance = useUser()

      console.log('Clerk Store: 实例获取结果', {
        hasClerkInstance: !!clerkInstance,
        hasUserInstance: !!userInstance,
        clerkLoaded: clerkInstance?.loaded
      })

      if (clerkInstance && userInstance) {
        // 如果 Clerk 已经加载完成
        if (clerkInstance.loaded) {
          isClerkReady.value = true
          isClerkLoading.value = false
          setupWatchers()
          console.log('Clerk Store: 成功初始化（已加载）')
        } else {
          // 等待 Clerk 加载完成
          console.log('Clerk Store: 等待 Clerk 加载完成...')
          clerkInstance.addOnLoaded(() => {
            isClerkReady.value = true
            isClerkLoading.value = false
            setupWatchers()
            console.log('Clerk Store: 成功初始化（加载完成）')
          })
        }
      } else {
        throw new Error('无法获取 Clerk 实例')
      }
    } catch (error) {
      console.error('Clerk Store: 初始化失败', error)
      isClerkReady.value = false
      isClerkLoading.value = false
    }
  }

  // ========== 计算属性 ==========

  // 当前用户信息（格式化后）
  const currentUser = computed(() => {
    if (!clerkUser.value) return null

    return {
      id: clerkUser.value.id,
      email: clerkUser.value.primaryEmailAddress?.emailAddress,
      firstName: clerkUser.value.firstName,
      lastName: clerkUser.value.lastName,
      fullName: `${clerkUser.value.firstName || ''} ${clerkUser.value.lastName || ''}`.trim(),
      avatar: clerkUser.value.imageUrl,
      provider: getAuthProvider(clerkUser.value),
      createdAt: clerkUser.value.createdAt,
      lastActiveAt: clerkUser.value.lastActiveAt
    }
  })

  // 是否有有效的会话
  const hasValidSession = computed(() => {
    return isAuthenticated.value && clerkSession.value && clerkToken.value
  })

  // 认证提供商信息
  const authProviderInfo = computed(() => {
    if (!activeProvider.value || !OAUTH_PROVIDERS[activeProvider.value]) {
      return null
    }
    return OAUTH_PROVIDERS[activeProvider.value]
  })

  // ========== 监听器设置 ==========

  function setupWatchers() {
    // 监听用户状态变化
    watch(
      () => userInstance?.user,
      (newUser) => {
        clerkUser.value = newUser
        isAuthenticated.value = !!newUser

        if (newUser) {
          updateSessionInfo()
          syncWithUserStore()
        } else {
          clearSessionInfo()
        }
      },
      { immediate: true }
    )

    // 监听会话变化
    watch(
      () => clerkInstance?.session,
      (newSession) => {
        clerkSession.value = newSession
        if (newSession) {
          updateTokenInfo()
        }
      },
      { immediate: true }
    )
  }

  // ========== 核心认证方法 ==========

  /**
   * 使用指定提供商登录
   * @param {string} provider - OAuth 提供商 (google, github 等)
   * @param {Object} options - 登录选项
   */
  async function signInWithProvider(provider = 'google', options = {}) {
    if (!isClerkReady.value) {
      throw new Error('Clerk 尚未初始化完成')
    }

    if (!OAUTH_PROVIDERS[provider]) {
      throw new Error(`不支持的 OAuth 提供商: ${provider}`)
    }

    isSigningIn.value = true
    activeProvider.value = provider
    lastError.value = null

    // 显示加载提示
    const loading = ElLoading.service({
      lock: true,
      text: `正在使用 ${OAUTH_PROVIDERS[provider].displayName} 登录...`,
      spinner: 'el-icon-loading'
    })

    try {
      // 调用 Clerk 的 OAuth 登录
      await clerkInstance.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: options.redirectUrl || '/sso-callback',
        redirectUrlComplete: options.afterSignInUrl || '/user-dashboard'
      })

      console.log(`Clerk Store: 开始 ${provider} OAuth 登录流程`)
    } catch (error) {
      console.error(`Clerk Store: ${provider} 登录失败`, error)

      isSigningIn.value = false
      activeProvider.value = null
      lastError.value = error
      errorCount.value++

      // 显示用户友好的错误消息
      const errorMessage = getErrorMessage(error)
      ElMessage.error(errorMessage)

      throw error
    } finally {
      loading.close()
    }
  }

  /**
   * 处理 OAuth 回调
   * 在回调页面中调用此方法来完成认证流程
   */
  async function handleOAuthCallback() {
    if (!isClerkReady.value) {
      throw new Error('Clerk 尚未初始化完成')
    }

    try {
      // Clerk 会自动处理 OAuth 回调
      // 我们只需要等待用户状态更新
      await new Promise((resolve) => {
        const unwatch = watch(
          () => isAuthenticated.value,
          (newValue) => {
            if (newValue) {
              unwatch()
              resolve()
            }
          }
        )

        // 设置超时防止无限等待
        setTimeout(() => {
          unwatch()
          resolve()
        }, 10000)
      })

      if (isAuthenticated.value) {
        console.log('Clerk Store: OAuth 回调处理成功')
        await syncWithUserStore()
        return true
      } else {
        throw new Error('OAuth 回调处理超时')
      }
    } catch (error) {
      console.error('Clerk Store: OAuth 回调处理失败', error)
      lastError.value = error
      throw error
    }
  }

  /**
   * 登出用户
   */
  async function signOut() {
    if (!isClerkReady.value || !isAuthenticated.value) {
      return
    }

    isSigningOut.value = true

    try {
      // 调用 Clerk 登出
      await clerkInstance.signOut()

      // 清理本地状态
      clearSessionInfo()

      // 同步到用户 store
      const userStore = useUserStore()
      await userStore.logout()

      ElMessage.success('已成功退出登录')
      console.log('Clerk Store: 用户已成功登出')
    } catch (error) {
      console.error('Clerk Store: 登出失败', error)
      ElMessage.error('登出时发生错误')
      throw error
    } finally {
      isSigningOut.value = false
    }
  }

  // ========== 数据同步方法 ==========

  /**
   * 将 Clerk 用户数据同步到后端和用户 store
   */
  async function syncWithUserStore() {
    if (!currentUser.value) {
      console.warn('Clerk Store: 无用户数据需要同步')
      return
    }

    try {
      // 获取最新的认证 Token
      await updateTokenInfo()

      if (!clerkToken.value) {
        throw new Error('无法获取 Clerk 认证 Token')
      }

      // 准备同步到后端的用户数据
      const syncData = {
        clerkUserId: currentUser.value.id,
        email: currentUser.value.email,
        firstName: currentUser.value.firstName,
        lastName: currentUser.value.lastName,
        fullName: currentUser.value.fullName,
        avatar: currentUser.value.avatar,
        provider: currentUser.value.provider,
        clerkToken: clerkToken.value
      }

      // 调用后端 API 同步用户数据
      const response = await axios.post('/webapi/users/clerk/sync', syncData)

      if (response.data.success) {
        // 更新用户 store 的数据
        const userStore = useUserStore()
        await userStore.setUserData({
          ...response.data.user,
          authProvider: 'clerk',
          sessionToken: response.data.sessionToken
        })

        console.log('Clerk Store: 用户数据同步成功')
        ElMessage.success('登录成功，欢迎回来！')
      } else {
        throw new Error(response.data.message || '用户数据同步失败')
      }
    } catch (error) {
      console.error('Clerk Store: 用户数据同步失败', error)

      // 如果是网络错误，提示用户重试
      if (error.code === 'NETWORK_ERROR') {
        ElMessage.error('网络连接错误，请稍后重试')
      } else {
        ElMessage.error('用户数据同步失败，请联系管理员')
      }

      throw error
    }
  }

  /**
   * 获取当前 Clerk Token
   */
  async function getClerkToken() {
    if (!isAuthenticated.value || !clerkSession.value) {
      return null
    }

    try {
      const token = await clerkSession.value.getToken()
      return token
    } catch (error) {
      console.error('Clerk Store: 获取 Token 失败', error)
      return null
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 更新会话信息
   */
  async function updateSessionInfo() {
    try {
      clerkSession.value = clerkInstance?.session || null
      await updateTokenInfo()
    } catch (error) {
      console.error('Clerk Store: 更新会话信息失败', error)
    }
  }

  /**
   * 更新 Token 信息
   */
  async function updateTokenInfo() {
    try {
      if (clerkSession.value) {
        clerkToken.value = await clerkSession.value.getToken()
      }
    } catch (error) {
      console.error('Clerk Store: 更新 Token 失败', error)
      clerkToken.value = null
    }
  }

  /**
   * 清理会话信息
   */
  function clearSessionInfo() {
    isAuthenticated.value = false
    clerkUser.value = null
    clerkSession.value = null
    clerkToken.value = null
    activeProvider.value = null
  }

  /**
   * 获取用户的认证提供商
   */
  function getAuthProvider(user) {
    if (!user || !user.externalAccounts || user.externalAccounts.length === 0) {
      return 'email'
    }

    return user.externalAccounts[0].provider || 'unknown'
  }

  /**
   * 获取友好的错误消息
   */
  function getErrorMessage(error) {
    const errorCode = error?.code || error?.type || 'clerk_error_generic'
    return CLERK_ERROR_MESSAGES[errorCode] || CLERK_ERROR_MESSAGES['clerk_error_generic']
  }

  /**
   * 重置错误状态
   */
  function clearError() {
    lastError.value = null
  }

  // ========== 返回 Store 接口 ==========

  return {
    // 状态
    isClerkReady: readonly(isClerkReady),
    isClerkLoading: readonly(isClerkLoading),
    isAuthenticated: readonly(isAuthenticated),
    isSigningIn: readonly(isSigningIn),
    isSigningOut: readonly(isSigningOut),
    currentUser,
    hasValidSession,
    authProviderInfo,
    availableProviders: readonly(availableProviders),
    lastError: readonly(lastError),
    errorCount: readonly(errorCount),

    // 方法
    initializeClerk,
    signInWithProvider,
    handleOAuthCallback,
    signOut,
    syncWithUserStore,
    getClerkToken,
    clearError
  }
})

// 导出一个初始化函数，供 main.js 使用
export function initializeClerkStore() {
  const clerkStore = useClerkStore()

  // 延迟初始化，确保 Clerk 插件已经加载
  setTimeout(() => {
    clerkStore.initializeClerk()
  }, 100)

  return clerkStore
}
