<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="mx-auto max-w-7xl">
      <!-- 页面标题 -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="mb-2 text-3xl font-bold text-gray-900">📊 代码统计分析</h1>
          <p class="text-gray-600">追踪 Claude 代码编辑操作的详细统计数据</p>
        </div>
        <button
          class="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
          :disabled="loading"
          @click="refreshData"
        >
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-sync-alt']"></i>
          {{ loading ? '刷新中...' : '刷新数据' }}
        </button>
      </div>

      <!-- 模块选择标签页 -->
      <div class="mb-8">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
              :class="activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              @click="activeTab = 'overview'"
            >
              📈 全局统计概览
            </button>
            <button
              class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
              :class="activeTab === 'tools' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              @click="activeTab = 'tools'"
            >
              🔧 工具调用统计
            </button>
            <button
              class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
              :class="activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              @click="activeTab = 'users'"
            >
              👥 用户统计明细
            </button>
          </nav>
        </div>
      </div>

      <!-- 全局统计概览模块 -->
      <div v-if="activeTab === 'overview'">
        <!-- 统计卡片 -->
        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            color="bg-blue-500"
            icon="📝"
            title="今日编辑行数"
            :value="systemStats?.todayLines || 0"
          />
          <StatCard
            color="bg-green-500"
            icon="⚡"
            title="编辑操作次数"
            :value="systemStats?.todayOperations || 0"
          />
          <StatCard
            color="bg-purple-500"
            icon="📄"
            title="创建文件数"
            :value="systemStats?.todayNewFiles || 0"
          />
          <StatCard
            color="bg-orange-500"
            icon="✏️"
            title="修改文件数"
            :value="systemStats?.todayModifiedFiles || 0"
          />
        </div>

        <!-- 图表区域 -->
        <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 编辑趋势图 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">📈 编辑趋势</h3>
            <div class="relative h-64 w-full">
              <canvas ref="trendChart" class="absolute inset-0 h-full w-full"></canvas>
            </div>
          </div>

          <!-- 语言分布图 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">🌍 编程语言分布</h3>
            <div class="relative h-64 w-full">
              <canvas ref="languageChart" class="absolute inset-0 h-full w-full"></canvas>
            </div>
          </div>
        </div>

        <!-- 排行榜 -->
        <div class="rounded-lg bg-white p-6 shadow-lg">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">🏆 排行榜 (Top 10)</h3>
          <div class="overflow-hidden rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">排名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">用户名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">编辑行数</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作次数</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">新建文件</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">修改文件</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="(user, index) in leaderboard" :key="user.keyId">
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ user.userName }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ user.totalEditedLines }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ user.totalEditOperations }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ user.totalNewFiles }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ user.totalModifiedFiles }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 工具调用统计模块 -->
      <div v-if="activeTab === 'tools'">
        <!-- 工具调用统计卡片 -->
        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            color="bg-indigo-500"
            icon="🔧"
            title="今日工具调用"
            :value="toolStats?.todayToolCalls || 0"
          />
          <StatCard
            color="bg-teal-500"
            icon="⚙️"
            title="工具种类"
            :value="Object.keys(toolStats?.tools || {}).filter(tool => tool !== 'Unknown' && tool !== 'undefined').length"
          />
          <StatCard
            color="bg-pink-500"
            icon="🏆"
            title="最常用工具"
            :value="getMostUsedTool()"
          />
          <StatCard
            color="bg-cyan-500"
            icon="📊"
            title="日均调用"
            :value="getAvgDailyCalls()"
          />
        </div>

        <!-- 工具调用图表 -->
        <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 工具调用趋势图 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">📈 工具调用趋势</h3>
            <div class="relative h-64 w-full">
              <canvas ref="toolTrendChart" class="absolute inset-0 h-full w-full"></canvas>
            </div>
          </div>

          <!-- 工具分布图 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">🔧 工具使用分布</h3>
            <div class="relative h-64 w-full">
              <canvas ref="toolDistributionChart" class="absolute inset-0 h-full w-full"></canvas>
            </div>
          </div>
        </div>

        <!-- 工具排行榜 -->
        <div class="rounded-lg bg-white p-6 shadow-lg">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">🏆 工具使用排行榜 (Top 10)</h3>
          <div class="overflow-hidden rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">排名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">工具名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">总调用数</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">使用用户数</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="(tool, index) in toolRanking" :key="tool.tool">
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <span class="inline-flex items-center gap-2">
                      {{ getToolIcon(tool.tool) }} {{ tool.tool }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ tool.totalCount }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ tool.totalUsers }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 用户统计明细模块 -->
      <div v-if="activeTab === 'users'">
        <!-- 搜索和筛选区域 -->
        <div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <!-- 搜索框 -->
            <div class="group relative min-w-[200px] flex-1">
              <div
                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 blur transition duration-300 group-hover:opacity-20"
              ></div>
              <div class="relative flex items-center">
                <input
                  v-model="searchKeyword"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="搜索用户名..."
                  type="text"
                />
                <i class="fas fa-search absolute left-3 text-sm text-blue-500"></i>
                <button
                  v-if="searchKeyword"
                  class="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  @click="clearSearch"
                >
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>

            <!-- 筛选选项 -->
            <div class="flex items-center gap-3">
              <label class="text-sm font-medium text-gray-700">天数范围：</label>
              <select
                v-model="userStatsDays"
                class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="fetchUserStats"
              >
                <option value="7">最近7天</option>
                <option value="30">最近30天</option>
                <option value="90">最近90天</option>
              </select>
            </div>
          </div>

          <!-- 用户网格选择 -->
          <div v-if="filteredUsers.length > 0" class="mt-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-gray-600">
                找到 {{ filteredUsers.length }} 个用户
                <span v-if="selectedUserId" class="ml-2 text-blue-600">
                  (已选择: {{ selectedUser?.userName }})
                </span>
              </span>
              <button
                v-if="selectedUserId"
                class="text-sm text-gray-500 hover:text-gray-700"
                @click="clearSelection"
              >
                清除选择
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              <div
                v-for="user in filteredUsers"
                :key="user.keyId"
                class="group cursor-pointer rounded-md border p-2 transition-all duration-200 hover:shadow-sm"
                :class="selectedUserId === user.keyId 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-blue-300'"
                @click="selectUser(user)"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                    :class="selectedUserId === user.keyId 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'"
                  >
                    {{ user.userName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div 
                      class="truncate text-sm font-medium"
                      :class="selectedUserId === user.keyId ? 'text-blue-900' : 'text-gray-900'"
                    >
                      {{ user.userName }}
                    </div>
                    <div v-if="user.description" class="truncate text-xs text-gray-500">
                      {{ user.description }}
                    </div>
                  </div>
                  <div 
                    v-if="selectedUserId === user.keyId"
                    class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"
                  >
                    <i class="fas fa-check text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 无搜索结果 -->
          <div v-else-if="searchKeyword && users.length > 0" class="mt-4 text-center text-gray-500">
            <i class="fas fa-search mb-2 text-2xl"></i>
            <p>未找到匹配 "{{ searchKeyword }}" 的用户</p>
          </div>
        </div>

        <!-- 用户统计详情 -->
        <div v-if="selectedUserStats.user" class="space-y-6">
          <!-- 用户概览卡片 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">👤 {{ selectedUserStats.user.userName }} 的统计概览</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div class="rounded-lg bg-blue-50 p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ selectedUserStats.total.totalEditedLines || 0 }}</div>
                <div class="text-sm text-gray-600">总编辑行数</div>
              </div>
              <div class="rounded-lg bg-green-50 p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ selectedUserStats.total.totalEditOperations || 0 }}</div>
                <div class="text-sm text-gray-600">总操作次数</div>
              </div>
              <div class="rounded-lg bg-purple-50 p-4 text-center">
                <div class="text-2xl font-bold text-purple-600">{{ selectedUserStats.total.totalNewFiles || 0 }}</div>
                <div class="text-sm text-gray-600">新建文件数</div>
              </div>
              <div class="rounded-lg bg-orange-50 p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ selectedUserStats.total.totalModifiedFiles || 0 }}</div>
                <div class="text-sm text-gray-600">修改文件数</div>
              </div>
            </div>
          </div>

          <!-- 每日统计表格 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">📅 每日统计明细</h3>
            <div class="overflow-hidden rounded-lg border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">日期</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">编辑行数</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作次数</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">新建文件</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">修改文件</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">最后更新</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="day in paginatedDailyStats" :key="day.date">
                    <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ day.date }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ day.editedLines || 0 }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ day.editOperations || 0 }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ day.newFiles || 0 }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ day.modifiedFiles || 0 }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {{ day.lastUpdated ? new Date(day.lastUpdated).toLocaleString('zh-CN') : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 分页控件 -->
            <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between border-t border-gray-200 px-6 py-3">
              <div class="flex flex-1 justify-between sm:hidden">
                <!-- 移动端分页 -->
                <button 
                  @click="prevPage"
                  :disabled="!hasPrevPage"
                  :class="[
                    'relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium',
                    hasPrevPage 
                      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  ]"
                >
                  上一页
                </button>
                <button 
                  @click="nextPage"
                  :disabled="!hasNextPage"
                  :class="[
                    'relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium',
                    hasNextPage 
                      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  ]"
                >
                  下一页
                </button>
              </div>
              
              <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    显示
                    <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                    到
                    <span class="font-medium">{{ Math.min(currentPage * pageSize, selectedUserStats.daily.length) }}</span>
                    项，共
                    <span class="font-medium">{{ selectedUserStats.daily.length }}</span>
                    项
                  </p>
                </div>
                <div>
                  <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="分页">
                    <button 
                      @click="prevPage"
                      :disabled="!hasPrevPage"
                      :class="[
                        'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
                        hasPrevPage ? 'hover:text-gray-500' : 'cursor-not-allowed'
                      ]"
                    >
                      <span class="sr-only">上一页</span>
                      <i class="fas fa-chevron-left h-5 w-5" aria-hidden="true"></i>
                    </button>
                    
                    <!-- 页码按钮 -->
                    <template v-for="page in Math.min(totalPages, 7)" :key="page">
                      <button 
                        v-if="page <= 5 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                        @click="goToPage(page)"
                        :class="[
                          'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
                          page === currentPage 
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900'
                        ]"
                      >
                        {{ page }}
                      </button>
                    </template>
                    
                    <button 
                      @click="nextPage"
                      :disabled="!hasNextPage"
                      :class="[
                        'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
                        hasNextPage ? 'hover:text-gray-500' : 'cursor-not-allowed'
                      ]"
                    >
                      <span class="sr-only">下一页</span>
                      <i class="fas fa-chevron-right h-5 w-5" aria-hidden="true"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <!-- 语言分布 -->
          <div class="rounded-lg bg-white p-6 shadow-lg">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">🌍 编程语言分布</h3>
            <div
              v-if="Object.keys(selectedUserStats.languages).length === 0"
              class="text-center text-gray-500"
            >
              暂无语言统计数据
            </div>
            <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="(stats, language) in selectedUserStats.languages"
                :key="language"
                class="rounded-lg border border-gray-200 p-4"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900">{{ language }}</span>
                  <span class="text-sm text-gray-500">{{ stats.operations }} 操作</span>
                </div>
                <div class="mt-2 text-2xl font-bold text-blue-600">{{ stats.lines }} 行</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无选择用户时的提示 -->
        <div v-else class="rounded-lg bg-white p-12 text-center shadow-lg">
          <div class="text-gray-400">
            <i class="fas fa-user-friends mb-4 text-6xl"></i>
            <h3 class="mb-2 text-xl font-medium text-gray-900">选择用户查看统计</h3>
            <p class="text-gray-600">请从上方下拉菜单中选择一个用户来查看其详细的代码统计信息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import StatCard from '@/components/common/StatCard.vue'
import { showToast } from '@/utils/toast'

Chart.register(...registerables)

// 响应式数据
const loading = ref(true)
const activeTab = ref('overview')
const systemStats = ref(null)
const leaderboard = ref([])
const languageStats = ref({})
const trendData = ref([])

// 工具统计数据
const toolStats = ref({})
const toolRanking = ref([])
const toolTrendData = ref([])

// 用户相关数据
const users = ref([])
const selectedUserId = ref('')
const selectedUserStats = ref({ user: null, daily: [], languages: {}, total: {} })
const userStatsDays = ref('7')

// 搜索和筛选
const searchKeyword = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = 7  // 每页7条记录

// 计算属性
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return users.value.filter(user => 
    user.userName.toLowerCase().includes(keyword) ||
    (user.description && user.description.toLowerCase().includes(keyword))
  )
})

// 分页相关计算属性
const paginatedDailyStats = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return selectedUserStats.value.daily.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(selectedUserStats.value.daily.length / pageSize)
})

const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

const selectedUser = computed(() => {
  return users.value.find(user => user.keyId === selectedUserId.value)
})

// 图表引用
const trendChart = ref(null)
const languageChart = ref(null)
const toolTrendChart = ref(null)
const toolDistributionChart = ref(null)

// Chart.js 实例
let trendChartInstance = null
let languageChartInstance = null
let toolTrendChartInstance = null
let toolDistributionChartInstance = null

// 获取系统统计数据
async function fetchSystemStats() {
  try {
    const response = await fetch('/admin/code-stats/system?days=30', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch system stats')
    }
    const data = await response.json()
    if (data.success) {
      systemStats.value = processSystemStats(data.data)
      trendData.value = data.data.daily || []
    }
  } catch (error) {
    console.error('Error fetching system stats:', error)
    showToast('获取系统统计失败', 'error')
  }
}

// 获取排行榜数据
async function fetchLeaderboard() {
  try {
    const response = await fetch('/admin/code-stats/leaderboard?limit=10', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard')
    }
    const data = await response.json()
    if (data.success) {
      leaderboard.value = data.data || []
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    showToast('获取排行榜失败', 'error')
  }
}

// 获取语言统计数据
async function fetchLanguageStats() {
  try {
    const response = await fetch('/admin/code-stats/languages?days=30', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch language stats')
    }
    const data = await response.json()
    if (data.success) {
      languageStats.value = data.data || {}
    }
  } catch (error) {
    console.error('Error fetching language stats:', error)
    showToast('获取语言统计失败', 'error')
  }
}

// 获取工具统计数据
async function fetchToolStats() {
  try {
    const response = await fetch('/admin/code-stats/tools?days=30', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch tool stats')
    }
    const data = await response.json()
    if (data.success) {
      toolStats.value = data.data || {}
      toolTrendData.value = data.data.daily || []
    }
  } catch (error) {
    console.error('Error fetching tool stats:', error)
    showToast('获取工具统计失败', 'error')
  }
}

// 获取工具排行榜
async function fetchToolRanking() {
  try {
    const response = await fetch('/admin/code-stats/tools/ranking?limit=10&days=30', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch tool ranking')
    }
    const data = await response.json()
    if (data.success) {
      toolRanking.value = data.data || []
    }
  } catch (error) {
    console.error('Error fetching tool ranking:', error)
    showToast('获取工具排行榜失败', 'error')
  }
}

// 获取所有用户列表
async function fetchUsers() {
  try {
    const response = await fetch('/admin/code-stats/users', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    const data = await response.json()
    if (data.success) {
      users.value = data.data || []
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    showToast('获取用户列表失败', 'error')
  }
}

// 清除搜索
function clearSearch() {
  searchKeyword.value = ''
}

// 清除选择
function clearSelection() {
  selectedUserId.value = ''
  selectedUserStats.value = { user: null, daily: [], languages: {}, total: {} }
  currentPage.value = 1  // 重置分页
}

// 获取指定用户的统计数据
async function fetchUserStats() {
  if (!selectedUserId.value) {
    selectedUserStats.value = { user: null, daily: [], languages: {}, total: {} }
    return
  }

  try {
    const response = await fetch(
      `/admin/code-stats/users/${selectedUserId.value}?days=${userStatsDays.value}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      }
    )
    if (!response.ok) {
      throw new Error('Failed to fetch user stats')
    }
    const data = await response.json()
    if (data.success) {
      selectedUserStats.value = data.data
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    showToast('获取用户统计失败', 'error')
  }
}

// 处理系统统计数据
function processSystemStats(data) {
  const today = new Date().toISOString().split('T')[0]
  const todayData = data.daily?.find((d) => d.date === today) || {}

  return {
    todayLines: parseInt(todayData.totalEditedLines || 0),
    todayOperations: parseInt(todayData.totalEditOperations || 0),
    todayNewFiles: parseInt(todayData.totalNewFiles || 0),
    todayModifiedFiles: parseInt(todayData.totalModifiedFiles || 0)
  }
}

// 创建趋势图表
function createTrendChart() {
  // 检查canvas元素是否存在且可见
  if (!trendChart.value || !trendChart.value.offsetParent) {
    return
  }

  if (trendChartInstance) {
    trendChartInstance.destroy()
  }

  const ctx = trendChart.value.getContext('2d')
  const dates = trendData.value.map((d) => d.date).reverse()
  const lines = trendData.value.map((d) => parseInt(d.totalEditedLines || 0)).reverse()
  const operations = trendData.value.map((d) => parseInt(d.totalEditOperations || 0)).reverse()

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: '编辑行数',
          data: lines,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        },
        {
          label: '操作次数',
          data: operations,
          borderColor: 'rgb(16, 185, 129)', // green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// 创建语言分布图表
function createLanguageChart() {
  // 检查canvas元素是否存在且可见
  if (!languageChart.value || !languageChart.value.offsetParent) {
    return
  }

  if (languageChartInstance) {
    languageChartInstance.destroy()
  }

  const ctx = languageChart.value.getContext('2d')
  const languages = Object.keys(languageStats.value)
  const lines = Object.values(languageStats.value).map((stat) => stat.lines || 0)

  const colors = [
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(139, 92, 246)', // purple
    'rgb(245, 101, 101)', // red
    'rgb(251, 191, 36)', // yellow
    'rgb(168, 85, 247)', // violet
    'rgb(34, 197, 94)', // emerald
    'rgb(239, 68, 68)' // rose
  ]

  languageChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: languages,
      datasets: [
        {
          data: lines,
          backgroundColor: colors.slice(0, languages.length),
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  })
}

// 创建工具调用趋势图表
function createToolTrendChart() {
  if (!toolTrendChart.value || !toolTrendChart.value.offsetParent) {
    return
  }

  if (toolTrendChartInstance) {
    toolTrendChartInstance.destroy()
  }

  const ctx = toolTrendChart.value.getContext('2d')
  const dates = Object.keys(toolStats.value.daily || {}).reverse()
  const toolCounts = dates.map(date => {
    const dayData = toolStats.value.daily[date] || {}
    return Object.values(dayData).reduce((sum, toolData) => {
      return sum + (toolData.count || 0)
    }, 0)
  })

  toolTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: '工具调用次数',
          data: toolCounts,
          borderColor: 'rgb(168, 85, 247)', // purple
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// 创建工具分布图表
function createToolDistributionChart() {
  if (!toolDistributionChart.value || !toolDistributionChart.value.offsetParent) {
    return
  }

  if (toolDistributionChartInstance) {
    toolDistributionChartInstance.destroy()
  }

  const ctx = toolDistributionChart.value.getContext('2d')
  // 过滤掉 Unknown 和 undefined
  const allTools = toolStats.value.tools || {}
  const filteredTools = Object.fromEntries(
    Object.entries(allTools).filter(([toolName]) => 
      toolName !== 'Unknown' && toolName !== 'undefined'
    )
  )
  const tools = Object.keys(filteredTools)
  const counts = Object.values(filteredTools).map((tool) => tool.totalCount || 0)

  const colors = [
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(139, 92, 246)', // purple
    'rgb(245, 101, 101)', // red
    'rgb(251, 191, 36)', // yellow
    'rgb(168, 85, 247)', // violet
    'rgb(34, 197, 94)', // emerald
    'rgb(239, 68, 68)' // rose
  ]

  toolDistributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: tools,
      datasets: [
        {
          data: counts,
          backgroundColor: colors.slice(0, tools.length),
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  })
}

// 获取排名样式
function getRankClass(index) {
  if (index === 0) return 'bg-yellow-500 text-white' // 金牌
  if (index === 1) return 'bg-gray-400 text-white' // 银牌
  if (index === 2) return 'bg-yellow-600 text-white' // 铜牌
  return 'bg-gray-200 text-gray-700' // 其他
}

// 刷新数据
async function refreshData() {
  showToast('正在刷新统计数据...', 'info')
  await initializeData()
  
  // 刷新时需要重新渲染所有图表，确保隐藏的tab数据也能更新
  await nextTick()
  createTrendChart()
  createLanguageChart()
  createToolTrendChart() 
  createToolDistributionChart()
  
  showToast('统计数据刷新成功！', 'success')
}

// 初始化数据
async function initializeData() {
  loading.value = true

  try {
    await Promise.all([
      fetchSystemStats(), 
      fetchLeaderboard(), 
      fetchLanguageStats(), 
      fetchUsers(),
      fetchToolStats(),
      fetchToolRanking()
    ])

    // 计算今日工具调用数
    if (toolStats.value && toolStats.value.daily) {
      const today = new Date().toISOString().split('T')[0]
      const todayToolData = toolStats.value.daily[today]
      
      let todayToolCalls = 0
      if (todayToolData) {
        Object.entries(todayToolData).forEach(([toolName, toolData]) => {
          if (typeof toolData === 'object' && toolData !== null) {
            todayToolCalls += (toolData.count || 0)
          }
        })
      }
      
      toolStats.value.todayToolCalls = todayToolCalls
    }

    // 等待DOM更新后创建当前tab的图表
    await nextTick()
    renderCurrentTabCharts()
  } catch (error) {
    console.error('Error initializing data:', error)
    showToast('初始化数据失败', 'error')
  } finally {
    loading.value = false
  }
}

// 分页控制函数
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function prevPage() {
  if (hasPrevPage.value) {
    currentPage.value--
  }
}

function nextPage() {
  if (hasNextPage.value) {
    currentPage.value++
  }
}

// 选择用户时重置分页
async function selectUser(user) {
  selectedUserId.value = user.keyId
  currentPage.value = 1  // 重置到第一页
  await fetchUserStats()
}

// 获取最常用工具
function getMostUsedTool() {
  if (!toolStats.value.tools || Object.keys(toolStats.value.tools).length === 0) {
    return '-'
  }
  
  let maxTool = ''
  let maxCount = 0
  
  Object.entries(toolStats.value.tools).forEach(([tool, data]) => {
    // 过滤掉 Unknown 和 undefined
    if (tool !== 'Unknown' && tool !== 'undefined' && data.totalCount > maxCount) {
      maxCount = data.totalCount
      maxTool = tool
    }
  })
  
  return maxTool || '-'
}

// 获取日均调用数
function getAvgDailyCalls() {
  if (!toolStats.value.tools || Object.keys(toolStats.value.tools).length === 0) {
    return 0
  }
  
  // 过滤掉 Unknown 和 undefined 后计算总调用数
  const totalCalls = Object.entries(toolStats.value.tools)
    .filter(([toolName]) => toolName !== 'Unknown' && toolName !== 'undefined')
    .reduce((sum, [, tool]) => sum + (tool.totalCount || 0), 0)
  const days = 30 // 假设30天统计周期
  return Math.round(totalCalls / days * 100) / 100
}

// 获取工具图标
function getToolIcon(toolName) {
  const icons = {
    'Edit': '✏️',
    'Write': '📝',
    'Read': '📖',
    'Bash': '💻',
    'Grep': '🔍',
    'Glob': '🌐',
    'MultiEdit': '📑',
    'NotebookEdit': '📓',
    'LS': '📁',
    'Task': '⚡',
    'WebFetch': '🌍',
    'TodoWrite': '✅'
  }
  return icons[toolName] || '🔧'
}

// 根据当前tab渲染相应图表
function renderCurrentTabCharts() {
  if (activeTab.value === 'overview') {
    createTrendChart()
    createLanguageChart()
  } else if (activeTab.value === 'tools') {
    createToolTrendChart()
    createToolDistributionChart()
  }
}

// 监听标签页切换，重新渲染图表
watch(activeTab, async (newTab) => {
  await nextTick()
  renderCurrentTabCharts()
})

// 组件挂载
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
/* 自定义样式 */
</style>