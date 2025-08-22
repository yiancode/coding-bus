const config = require('../../config/config')
const logger = require('../../src/utils/logger')

class CodeStatisticsRedis {
  constructor() {
    this.redis = null
    this.prefix = config.plugins?.codeStatistics?.redisPrefix || 'code_stats:'
  }

  init() {
    // 复用主应用的 Redis 连接
    this.redis = require('../../src/models/redis')
    logger.info('📊 Code statistics Redis extension initialized')
  }

  /**
   * 记录编辑统计数据
   */
  async recordEditStatistics(keyId, editStats, model = 'unknown') {
    if (!this.redis) {
      logger.error('❌ Redis not initialized for code statistics')
      return
    }

    const now = new Date()
    const today = this.getDateString(now)
    const currentMonth = this.getMonthString(now)

    const pipeline = this.redis.getClient().pipeline()

    // API Key 级别统计
    const keyStatsKey = `${this.prefix}key:${keyId}`
    pipeline.hincrby(keyStatsKey, 'totalEditedLines', editStats.totalEditedLines)
    pipeline.hincrby(keyStatsKey, 'totalEditOperations', editStats.editOperations)
    pipeline.hincrby(keyStatsKey, 'totalNewFiles', editStats.newFiles)
    pipeline.hincrby(keyStatsKey, 'totalModifiedFiles', editStats.modifiedFiles)

    // 每日统计
    const dailyKey = `${this.prefix}daily:${keyId}:${today}`
    pipeline.hincrby(dailyKey, 'editedLines', editStats.totalEditedLines)
    pipeline.hincrby(dailyKey, 'editOperations', editStats.editOperations)
    pipeline.hincrby(dailyKey, 'newFiles', editStats.newFiles)
    pipeline.hincrby(dailyKey, 'modifiedFiles', editStats.modifiedFiles)
    pipeline.hset(dailyKey, 'lastUpdated', now.toISOString())
    pipeline.expire(dailyKey, 86400 * 90) // 保留90天

    // 每月统计
    const monthlyKey = `${this.prefix}monthly:${keyId}:${currentMonth}`
    pipeline.hincrby(monthlyKey, 'editedLines', editStats.totalEditedLines)
    pipeline.hincrby(monthlyKey, 'editOperations', editStats.editOperations)
    pipeline.expire(monthlyKey, 86400 * 365) // 保留1年

    // 工具调用统计 - 新增功能
    if (editStats.toolUsage && Object.keys(editStats.toolUsage).length > 0) {
      for (const [toolName, count] of Object.entries(editStats.toolUsage)) {
        // API Key级别的工具调用统计
        pipeline.hincrby(keyStatsKey, `tool_${toolName}`, count)
        
        // 每日工具调用统计
        pipeline.hincrby(dailyKey, `tool_${toolName}`, count)
        
        // 系统级每日工具调用统计
        const systemDailyKey = `${this.prefix}system:daily:${today}`
        pipeline.hincrby(systemDailyKey, `tool_${toolName}`, count)
        
        // 专门的工具统计键
        const toolDailyKey = `${this.prefix}tool:daily:${toolName}:${today}`
        pipeline.hincrby(toolDailyKey, 'count', count)
        pipeline.hincrby(toolDailyKey, 'users', 0) // 初始化用户计数器
        pipeline.sadd(toolDailyKey + ':users', keyId) // 用集合记录使用该工具的用户
        pipeline.expire(toolDailyKey, 86400 * 90)
        pipeline.expire(toolDailyKey + ':users', 86400 * 90)
      }
    }

    // 按编程语言统计
    for (const [language, lines] of Object.entries(editStats.languages)) {
      const langDailyKey = `${this.prefix}language:daily:${language}:${today}`
      pipeline.hincrby(langDailyKey, 'lines', lines)
      pipeline.hincrby(langDailyKey, 'operations', 1)
      pipeline.expire(langDailyKey, 86400 * 90)

      const keyLangDailyKey = `${this.prefix}key:${keyId}:language:daily:${language}:${today}`
      pipeline.hincrby(keyLangDailyKey, 'lines', lines)
      pipeline.expire(keyLangDailyKey, 86400 * 90)
    }

    // 按文件类型统计
    for (const [fileType, lines] of Object.entries(editStats.fileTypes)) {
      const typeDailyKey = `${this.prefix}filetype:daily:${fileType}:${today}`
      pipeline.hincrby(typeDailyKey, 'lines', lines)
      pipeline.expire(typeDailyKey, 86400 * 90)
    }

    // 系统级统计
    const systemDailyKey = `${this.prefix}system:daily:${today}`
    pipeline.hincrby(systemDailyKey, 'totalEditedLines', editStats.totalEditedLines)
    pipeline.hincrby(systemDailyKey, 'totalEditOperations', editStats.editOperations)
    pipeline.hincrby(systemDailyKey, 'totalNewFiles', editStats.newFiles)
    pipeline.hincrby(systemDailyKey, 'totalModifiedFiles', editStats.modifiedFiles)
    pipeline.expire(systemDailyKey, 86400 * 365)

    try {
      await pipeline.exec()
    } catch (error) {
      logger.error('❌ Failed to record code statistics:', error)
      throw error
    }
  }

  /**
   * 获取 API Key 的编辑统计
   */
  async getKeyEditStatistics(keyId, days = 7) {
    const stats = {
      total: {},
      daily: [],
      languages: {},
      fileTypes: {}
    }

    try {
      // 获取总计数据
      const keyStatsKey = `${this.prefix}key:${keyId}`
      stats.total = await this.redis.getClient().hgetall(keyStatsKey)

      // 获取每日数据
      const today = new Date()
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)

        const dailyKey = `${this.prefix}daily:${keyId}:${dateString}`
        const dailyData = await this.redis.getClient().hgetall(dailyKey)

        stats.daily.push({
          date: dateString,
          ...dailyData
        })
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get code statistics:', error)
      return stats
    }
  }

  /**
   * 获取系统级编辑统计
   */
  async getSystemEditStatistics(days = 30) {
    const stats = {
      daily: [],
      languages: {},
      fileTypes: {}
    }

    try {
      const today = new Date()

      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)

        const systemDailyKey = `${this.prefix}system:daily:${dateString}`
        const dailyData = await this.redis.getClient().hgetall(systemDailyKey)

        stats.daily.push({
          date: dateString,
          ...dailyData
        })
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get system code statistics:', error)
      return stats
    }
  }

  /**
   * 获取语言统计数据
   */
  async getLanguageStatistics(days = 30) {
    const stats = {}

    try {
      const today = new Date()

      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)

        // 获取所有语言的统计
        const keys = await this.redis.getClient().keys(`${this.prefix}language:daily:*:${dateString}`)

        for (const key of keys) {
          const language = key.split(':')[3] // 从 code_stats:language:daily:javascript:2024-01-01 中提取 javascript
          const data = await this.redis.getClient().hgetall(key)

          if (!stats[language]) {
            stats[language] = { lines: 0, operations: 0 }
          }

          stats[language].lines += parseInt(data.lines || 0)
          stats[language].operations += parseInt(data.operations || 0)
        }
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get language statistics:', error)
      return stats
    }
  }

  /**
   * 获取排行榜数据
   */
  async getLeaderboard(limit = 10) {
    try {
      const keys = await this.redis.getClient().keys(`${this.prefix}key:*`)
      const leaderboard = []

      for (const key of keys) {
        const keyId = key.split(':')[2]
        const data = await this.redis.getClient().hgetall(key)

        if (data.totalEditedLines) {
          // 获取API Key的详细信息来获取用户名
          const apiKeyInfo = await this.redis.getClient().hgetall(`apikey:${keyId}`)
          const userName = apiKeyInfo.name || keyId
          
          leaderboard.push({
            keyId,
            userName,
            totalEditedLines: parseInt(data.totalEditedLines || 0),
            totalEditOperations: parseInt(data.totalEditOperations || 0),
            totalNewFiles: parseInt(data.totalNewFiles || 0),
            totalModifiedFiles: parseInt(data.totalModifiedFiles || 0)
          })
        }
      }

      // 按编辑行数排序
      leaderboard.sort((a, b) => b.totalEditedLines - a.totalEditedLines)

      return leaderboard.slice(0, limit)
    } catch (error) {
      logger.error('❌ Failed to get leaderboard:', error)
      return []
    }
  }

  /**
   * 获取指定用户的统计数据
   */
  async getUserStatistics(keyId, days = 30) {
    try {
      const stats = {
        user: null,
        daily: [],
        languages: {},
        fileTypes: {},
        total: {}
      }

      // 获取用户信息
      const apiKeyInfo = await this.redis.getClient().hgetall(`apikey:${keyId}`)
      if (!apiKeyInfo.name) {
        return stats
      }

      stats.user = {
        keyId,
        userName: apiKeyInfo.name,
        description: apiKeyInfo.description || ''
      }

      // 获取用户的总统计
      const keyStatsKey = `${this.prefix}key:${keyId}`
      stats.total = await this.redis.getClient().hgetall(keyStatsKey)

      // 获取每日统计
      const today = new Date()
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)
        
        const dailyKey = `${this.prefix}daily:${keyId}:${dateString}`
        const dailyData = await this.redis.getClient().hgetall(dailyKey)
        
        stats.daily.push({
          date: dateString,
          ...dailyData
        })
      }

      // 获取语言统计 (过去N天汇总)
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)
        
        const langKeys = await this.redis.getClient().keys(`${this.prefix}key:${keyId}:language:daily:*:${dateString}`)
        
        for (const key of langKeys) {
          const language = key.split(':')[5] // 从 code_stats:key:xxx:language:daily:python:2024-01-01 中提取 python
          const data = await this.redis.getClient().hgetall(key)
          
          if (!stats.languages[language]) {
            stats.languages[language] = { lines: 0, operations: 0 }
          }
          
          stats.languages[language].lines += parseInt(data.lines || 0)
          stats.languages[language].operations += parseInt(data.operations || 0)
        }
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get user statistics:', error)
      return { user: null, daily: [], languages: {}, fileTypes: {}, total: {} }
    }
  }

  /**
   * 获取所有有统计数据的用户列表
   */
  async getAllUsers() {
    try {
      // 只获取基础统计键，避免语言统计键等重复
      const keys = await this.redis.getClient().keys(`${this.prefix}key:*`)
      const users = []
      const userSet = new Set() // 用于去重

      for (const key of keys) {
        // 只处理基础统计键 (code_stats:key:xxx)，不包含子键
        const parts = key.split(':')
        if (parts.length === 3) { // code_stats:key:keyId
          const keyId = parts[2]
          
          if (!userSet.has(keyId)) {
            const apiKeyInfo = await this.redis.getClient().hgetall(`apikey:${keyId}`)
            
            if (apiKeyInfo.name) {
              users.push({
                keyId,
                userName: apiKeyInfo.name,
                description: apiKeyInfo.description || ''
              })
              userSet.add(keyId)
            }
          }
        }
      }

      return users.sort((a, b) => a.userName.localeCompare(b.userName))
    } catch (error) {
      logger.error('❌ Failed to get all users:', error)
      return []
    }
  }

  /**
   * 获取工具调用统计
   */
  async getToolUsageStatistics(days = 30) {
    const stats = {
      daily: {},
      tools: {},
      totalUsage: 0
    }

    try {
      const today = new Date()

      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)

        // 获取该日期所有工具的统计
        const toolKeys = await this.redis.getClient().keys(`${this.prefix}tool:daily:*:${dateString}`)

        stats.daily[dateString] = {}

        for (const key of toolKeys) {
          const toolName = key.split(':')[3] // 从 code_stats:tool:daily:Edit:2024-01-01 中提取 Edit
          const data = await this.redis.getClient().hgetall(key)
          const userSet = await this.redis.getClient().smembers(key + ':users')

          const count = parseInt(data.count || 0)
          const users = userSet.length

          stats.daily[dateString][toolName] = {
            count,
            users
          }

          // 累计工具统计
          if (!stats.tools[toolName]) {
            stats.tools[toolName] = {
              totalCount: 0,
              totalUsers: new Set(),
              dailyAvg: 0
            }
          }

          stats.tools[toolName].totalCount += count
          userSet.forEach(userId => stats.tools[toolName].totalUsers.add(userId))
          stats.totalUsage += count
        }
      }

      // 计算平均值和转换Set为数量
      for (const [toolName, toolData] of Object.entries(stats.tools)) {
        toolData.dailyAvg = Math.round(toolData.totalCount / days * 100) / 100
        toolData.totalUsers = toolData.totalUsers.size
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get tool usage statistics:', error)
      return stats
    }
  }

  /**
   * 获取指定用户的工具调用统计
   */
  async getUserToolUsageStatistics(keyId, days = 30) {
    const stats = {
      daily: {},
      tools: {},
      totalUsage: 0
    }

    try {
      const today = new Date()

      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = this.getDateString(date)

        const dailyKey = `${this.prefix}daily:${keyId}:${dateString}`
        const dailyData = await this.redis.getClient().hgetall(dailyKey)

        stats.daily[dateString] = {}

        // 提取工具调用数据
        for (const [field, value] of Object.entries(dailyData)) {
          if (field.startsWith('tool_')) {
            const toolName = field.substring(5) // 移除 'tool_' 前缀
            const count = parseInt(value || 0)

            stats.daily[dateString][toolName] = count

            // 累计工具统计
            if (!stats.tools[toolName]) {
              stats.tools[toolName] = { totalCount: 0, dailyAvg: 0 }
            }

            stats.tools[toolName].totalCount += count
            stats.totalUsage += count
          }
        }
      }

      // 计算平均值
      for (const toolData of Object.values(stats.tools)) {
        toolData.dailyAvg = Math.round(toolData.totalCount / days * 100) / 100
      }

      return stats
    } catch (error) {
      logger.error('❌ Failed to get user tool usage statistics:', error)
      return stats
    }
  }

  /**
   * 获取最受欢迎的工具排行
   */
  async getTopToolsRanking(limit = 10, days = 30) {
    try {
      const toolStats = await this.getToolUsageStatistics(days)
      
      const ranking = Object.entries(toolStats.tools)
        .filter(([toolName]) => toolName !== 'Unknown' && toolName !== 'undefined')
        .map(([toolName, data]) => ({
          tool: toolName,
          totalCount: data.totalCount,
          totalUsers: data.totalUsers,
          dailyAvg: data.dailyAvg
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, limit)

      return ranking
    } catch (error) {
      logger.error('❌ Failed to get top tools ranking:', error)
      return []
    }
  }

  getDateString(date) {
    return date.toISOString().split('T')[0]
  }

  getMonthString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
}

module.exports = new CodeStatisticsRedis()
