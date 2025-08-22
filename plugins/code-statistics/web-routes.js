const express = require('express')
const redisExtension = require('./redis-extension')
const { authenticateAdmin } = require('../../src/middleware/auth')

const apiRouter = express.Router()
const adminRouter = express.Router()

// API 路由 - 获取 API Key 的代码统计
apiRouter.get('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params
    const { days = 7 } = req.query

    const stats = await redisExtension.getKeyEditStatistics(keyId, parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取系统级代码统计
adminRouter.get('/system', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query

    const stats = await redisExtension.getSystemEditStatistics(parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取语言统计
adminRouter.get('/languages', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query

    const stats = await redisExtension.getLanguageStatistics(parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取代码统计排行榜
adminRouter.get('/leaderboard', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const leaderboard = await redisExtension.getLeaderboard(parseInt(limit))

    res.json({
      success: true,
      data: leaderboard
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取所有用户列表
adminRouter.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await redisExtension.getAllUsers()

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取指定用户的统计数据
adminRouter.get('/users/:keyId', authenticateAdmin, async (req, res) => {
  try {
    const { keyId } = req.params
    const { days = 30 } = req.query

    const stats = await redisExtension.getUserStatistics(keyId, parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取工具调用统计
adminRouter.get('/tools', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query

    const stats = await redisExtension.getToolUsageStatistics(parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取工具调用排行榜
adminRouter.get('/tools/ranking', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query

    const ranking = await redisExtension.getTopToolsRanking(parseInt(limit), parseInt(days))

    res.json({
      success: true,
      data: ranking
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 管理员路由 - 获取指定用户的工具调用统计
adminRouter.get('/users/:keyId/tools', authenticateAdmin, async (req, res) => {
  try {
    const { keyId } = req.params
    const { days = 30 } = req.query

    const stats = await redisExtension.getUserToolUsageStatistics(keyId, parseInt(days))

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = {
  api: apiRouter,
  admin: adminRouter
}
