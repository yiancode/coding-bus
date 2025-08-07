const express = require('express');
const claudeRelayService = require('../services/claudeRelayService');
const claudeConsoleRelayService = require('../services/claudeConsoleRelayService');
const bedrockRelayService = require('../services/bedrockRelayService');
const bedrockAccountService = require('../services/bedrockAccountService');
const unifiedClaudeScheduler = require('../services/unifiedClaudeScheduler');
const apiKeyService = require('../services/apiKeyService');
const { authenticateApiKey } = require('../middleware/auth');
const logger = require('../utils/logger');
const redis = require('../models/redis');
const sessionHelper = require('../utils/sessionHelper');

const router = express.Router();

// 🔧 共享的消息处理函数
async function handleMessagesRequest(req, res) {
  try {
    const startTime = Date.now();
    
    // 严格的输入验证
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must be a valid JSON object'
      });
    }

    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Missing or invalid field: messages (must be an array)'
      });
    }

    if (req.body.messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Messages array cannot be empty'
      });
    }

    // 检查是否为流式请求
    const isStream = req.body.stream === true;
    
    logger.api(`🚀 Processing ${isStream ? 'stream' : 'non-stream'} request for key: ${req.apiKey.name}`);

    if (isStream) {
      // 流式响应 - 只使用官方真实usage数据
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
      
      // 禁用 Nagle 算法，确保数据立即发送
      if (res.socket && typeof res.socket.setNoDelay === 'function') {
        res.socket.setNoDelay(true);
      }
      
      // 流式响应不需要额外处理，中间件已经设置了监听器
      
      let usageDataCaptured = false;
      
      // 生成会话哈希用于sticky会话
      const sessionHash = sessionHelper.generateSessionHash(req.body);
      
      // 实现流式请求的重试逻辑
      const maxRetries = 3;
      let attempt = 0;
      let streamCompleted = false;
      let lastError = null;
      const failedAccountIds = new Set(); // 记录失败的账户ID
      
      // 使用统一调度选择账号（传递请求的模型）
      const requestedModel = req.body.model;
      
      while (attempt < maxRetries && !streamCompleted) {
        let currentAccountId;
        let currentAccountType;
        
        try {
          attempt++;
          
          // 选择账号（排除已失败的账户）
          const { accountId, accountType } = await unifiedClaudeScheduler.selectAccountForApiKey(req.apiKey, sessionHash, requestedModel, failedAccountIds);
          currentAccountId = accountId;
          currentAccountType = accountType;
          
          logger.info(`🔄 Stream attempt ${attempt}/${maxRetries}: Using account ${accountId} (${accountType})`);
      
          // 根据账号类型选择对应的转发服务并调用
          if (currentAccountType === 'claude-official') {
            // 官方Claude账号使用原有的转发服务（会自己选择账号）
            await claudeRelayService.relayStreamRequestWithUsageCapture(req.body, req.apiKey, res, req.headers, (usageData) => {
            // 回调函数：当检测到完整usage数据时记录真实token使用量
            logger.info('🎯 Usage callback triggered with complete data:', JSON.stringify(usageData, null, 2));
            
            if (usageData && usageData.input_tokens !== undefined && usageData.output_tokens !== undefined) {
              const inputTokens = usageData.input_tokens || 0;
              const outputTokens = usageData.output_tokens || 0;
              const cacheCreateTokens = usageData.cache_creation_input_tokens || 0;
              const cacheReadTokens = usageData.cache_read_input_tokens || 0;
              const model = usageData.model || 'unknown';
              
              // 记录真实的token使用量（包含模型信息和所有4种token以及账户ID）
              const accountId = usageData.accountId;
              apiKeyService.recordUsage(req.apiKey.id, inputTokens, outputTokens, cacheCreateTokens, cacheReadTokens, model, accountId).catch(error => {
                logger.error('❌ Failed to record stream usage:', error);
              });
              
              // 更新时间窗口内的token计数
              if (req.rateLimitInfo) {
                const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens;
                redis.getClient().incrby(req.rateLimitInfo.tokenCountKey, totalTokens).catch(error => {
                  logger.error('❌ Failed to update rate limit token count:', error);
                });
                logger.api(`📊 Updated rate limit token count: +${totalTokens} tokens`);
              }
              
              usageDataCaptured = true;
              logger.api(`📊 Stream usage recorded (real) - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cache Create: ${cacheCreateTokens}, Cache Read: ${cacheReadTokens}, Total: ${inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens} tokens`);
            } else {
              logger.warn('⚠️ Usage callback triggered but data is incomplete:', JSON.stringify(usageData));
            }
            });
          } else if (currentAccountType === 'claude-console') {
            // Claude Console账号使用Console转发服务（需要传递accountId）
            await claudeConsoleRelayService.relayStreamRequestWithUsageCapture(req.body, req.apiKey, res, req.headers, (usageData) => {
              // 回调函数：当检测到完整usage数据时记录真实token使用量
              logger.info('🎯 Usage callback triggered with complete data:', JSON.stringify(usageData, null, 2));
              
              if (usageData && usageData.input_tokens !== undefined && usageData.output_tokens !== undefined) {
                const inputTokens = usageData.input_tokens || 0;
                const outputTokens = usageData.output_tokens || 0;
                const cacheCreateTokens = usageData.cache_creation_input_tokens || 0;
                const cacheReadTokens = usageData.cache_read_input_tokens || 0;
                const model = usageData.model || 'unknown';
                
                // 记录真实的token使用量（包含模型信息和所有4种token以及账户ID）
                const usageAccountId = usageData.accountId;
                apiKeyService.recordUsage(req.apiKey.id, inputTokens, outputTokens, cacheCreateTokens, cacheReadTokens, model, usageAccountId).catch(error => {
                  logger.error('❌ Failed to record stream usage:', error);
                });
                
                // 更新时间窗口内的token计数
                if (req.rateLimitInfo) {
                  const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens;
                  redis.getClient().incrby(req.rateLimitInfo.tokenCountKey, totalTokens).catch(error => {
                    logger.error('❌ Failed to update rate limit token count:', error);
                  });
                  logger.api(`📊 Updated rate limit token count: +${totalTokens} tokens`);
                }
                
                usageDataCaptured = true;
                logger.api(`📊 Stream usage recorded (real) - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cache Create: ${cacheCreateTokens}, Cache Read: ${cacheReadTokens}, Total: ${inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens} tokens`);
              } else {
                logger.warn('⚠️ Usage callback triggered but data is incomplete:', JSON.stringify(usageData));
              }
            }, currentAccountId);
          } else if (currentAccountType === 'bedrock') {
            // Bedrock账号使用Bedrock转发服务
            const bedrockAccountResult = await bedrockAccountService.getAccount(currentAccountId);
            if (!bedrockAccountResult.success) {
              throw new Error('Failed to get Bedrock account details');
            }

            const result = await bedrockRelayService.handleStreamRequest(req.body, bedrockAccountResult.data, res);
            
            // 记录Bedrock使用统计
            if (result.usage) {
              const inputTokens = result.usage.input_tokens || 0;
              const outputTokens = result.usage.output_tokens || 0;
              
              apiKeyService.recordUsage(req.apiKey.id, inputTokens, outputTokens, 0, 0, result.model, currentAccountId).catch(error => {
                logger.error('❌ Failed to record Bedrock stream usage:', error);
              });
              
              // 更新时间窗口内的token计数
              if (req.rateLimitInfo) {
                const totalTokens = inputTokens + outputTokens;
                redis.getClient().incrby(req.rateLimitInfo.tokenCountKey, totalTokens).catch(error => {
                  logger.error('❌ Failed to update rate limit token count:', error);
                });
                logger.api(`📊 Updated rate limit token count: +${totalTokens} tokens`);
              }
              
              usageDataCaptured = true;
              logger.api(`📊 Bedrock stream usage recorded - Model: ${result.model}, Input: ${inputTokens}, Output: ${outputTokens}, Total: ${inputTokens + outputTokens} tokens`);
            }
          }
          
          // 如果流式请求成功完成，标记为完成
          streamCompleted = true;
          logger.info(`✅ Stream request succeeded with account ${currentAccountId} (${currentAccountType}) after ${attempt} attempt(s)`);
          break;
          
        } catch (error) {
          logger.error(`❌ Error with stream account ${currentAccountId} (${currentAccountType}):`, error.message);
          lastError = error;
          
          // 如果是客户端断开连接，不要重试
          if (error.isClientDisconnect || error.message.includes('Client disconnected')) {
            logger.info('🔌 Stream client disconnected, stopping retry attempts');
            break;
          }
          
          if (currentAccountId) {
            failedAccountIds.add(currentAccountId);
          }
          
          // 如果响应头还没有发送且不是最后一次重试，则继续重试
          if (!res.headersSent && attempt < maxRetries) {
            logger.info(`🔄 Will retry stream with a different account (attempt ${attempt + 1}/${maxRetries})`);
            continue;
          } else {
            // 如果是最后一次重试失败，或响应头已经发送，则不再重试
            break;
          }
        }
      }
      
      // 如果所有重试都失败了
      if (!streamCompleted) {
        if (!res.headersSent) {
          logger.error('❌ All stream retry attempts failed, sending error response');
          res.status(500).json({
            error: 'All available accounts failed',
            message: lastError ? lastError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        } else {
          logger.error('❌ All stream retry attempts failed but headers already sent');
        }
        return;
      }
      
      // 流式请求完成后 - 如果没有捕获到usage数据，记录警告但不进行估算
      setTimeout(() => {
        if (!usageDataCaptured) {
          logger.warn('⚠️ No usage data captured from SSE stream - no statistics recorded (official data only)');
        }
      }, 1000); // 1秒后检查
    } else {
      // 非流式响应 - 只使用官方真实usage数据
      logger.info('📄 Starting non-streaming request', {
        apiKeyId: req.apiKey.id,
        apiKeyName: req.apiKey.name
      });
      
      // 生成会话哈希用于sticky会话
      const sessionHash = sessionHelper.generateSessionHash(req.body);
      
      // 实现重试逻辑处理401/403等认证错误
      const maxRetries = 3;
      let attempt = 0;
      let response;
      let lastError = null;
      const failedAccountIds = new Set(); // 记录失败的账户ID
      
      // 使用统一调度选择账号（传递请求的模型）
      const requestedModel = req.body.model;
      
      logger.debug(`[DEBUG] Request query params: ${JSON.stringify(req.query)}`);
      logger.debug(`[DEBUG] Request URL: ${req.url}`);
      logger.debug(`[DEBUG] Request path: ${req.path}`);
      
      while (attempt < maxRetries) {
        let currentAccountId;
        let currentAccountType;
        
        try {
          attempt++;
          
          // 选择账号（排除已失败的账户）
          const { accountId, accountType } = await unifiedClaudeScheduler.selectAccountForApiKey(req.apiKey, sessionHash, requestedModel, failedAccountIds);
          currentAccountId = accountId;
          currentAccountType = accountType;
          
          logger.info(`🔄 Attempt ${attempt}/${maxRetries}: Using account ${accountId} (${accountType})`);
          
          // 根据账号类型选择对应的转发服务
          if (accountType === 'claude-official') {
            // 官方Claude账号使用原有的转发服务
            response = await claudeRelayService.relayRequest(req.body, req.apiKey, req, res, req.headers);
            // 确保响应包含accountId
            if (response) {
              response.accountId = accountId;
            }
          } else if (accountType === 'claude-console') {
            // Claude Console账号使用Console转发服务
            logger.debug(`[DEBUG] Calling claudeConsoleRelayService.relayRequest with accountId: ${accountId}`);
            response = await claudeConsoleRelayService.relayRequest(req.body, req.apiKey, req, res, req.headers, accountId);
          } else if (accountType === 'bedrock') {
            // Bedrock账号使用Bedrock转发服务
            try {
              const bedrockAccountResult = await bedrockAccountService.getAccount(accountId);
              if (!bedrockAccountResult.success) {
                throw new Error('Failed to get Bedrock account details');
              }

              const result = await bedrockRelayService.handleNonStreamRequest(req.body, bedrockAccountResult.data, req.headers);
              
              // 构建标准响应格式
              response = {
                statusCode: result.success ? 200 : 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.success ? result.data : { error: result.error }),
                accountId: accountId
              };
              
              // 如果成功，添加使用统计到响应数据中
              if (result.success && result.usage) {
                const responseData = JSON.parse(response.body);
                responseData.usage = result.usage;
                response.body = JSON.stringify(responseData);
              }
            } catch (error) {
              logger.error('❌ Bedrock non-stream request failed:', error);
              response = {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Bedrock service error', message: error.message }),
                accountId: accountId
              };
            }
          }
          
          // 检查响应是否为需要切换的错误状态码
          const shouldRetry = response && (
            response.statusCode === 401 ||  // 未认证
            response.statusCode === 403 ||  // 禁止访问
            response.statusCode === 500 ||  // 服务器内部错误
            response.statusCode === 502 ||  // 网关错误
            response.statusCode === 503 ||  // 服务不可用
            response.statusCode === 504     // 网关超时
          );
          
          if (shouldRetry) {
            logger.warn(`🚫 Account ${currentAccountId} (${currentAccountType}) failed with status ${response.statusCode}, adding to failed list`);
            failedAccountIds.add(currentAccountId);
            
            // 如果不是最后一次尝试，继续重试
            if (attempt < maxRetries) {
              logger.info(`🔄 Will retry with a different account (attempt ${attempt + 1}/${maxRetries})`);
              lastError = new Error(`Request failed with status ${response.statusCode} for account ${currentAccountId}`);
              continue;
            }
          }
          
          // 如果响应成功，退出重试循环
          if (response && !shouldRetry) {
            logger.info(`✅ Request succeeded with account ${currentAccountId} (${currentAccountType}) after ${attempt} attempt(s)`);
            break;
          }
          
        } catch (error) {
          logger.error(`❌ Error with account ${currentAccountId} (${currentAccountType}):`, error.message);
          lastError = error;
          
          // 如果是客户端断开连接，不要重试
          if (error.isClientDisconnect || error.message.includes('Client disconnected')) {
            logger.info('🔌 Client disconnected, stopping retry attempts');
            break;
          }
          
          if (currentAccountId) {
            failedAccountIds.add(currentAccountId);
          }
          
          // 如果不是最后一次尝试，继续重试
          if (attempt < maxRetries) {
            logger.info(`🔄 Will retry with a different account due to error (attempt ${attempt + 1}/${maxRetries})`);
            continue;
          }
        }
      }
      
      // 如果所有重试都失败了
      if (!response || (response.statusCode >= 400)) {
        logger.error('❌ All accounts failed, no more retries available');
        if (lastError) {
          throw lastError;
        }
        throw new Error('All available accounts failed with errors');
      }
      
      logger.info('📡 Claude API response received', {
        statusCode: response.statusCode,
        headers: JSON.stringify(response.headers),
        bodyLength: response.body ? response.body.length : 0
      });
      
      res.status(response.statusCode);
      
      // 设置响应头，避免 Content-Length 和 Transfer-Encoding 冲突
      const skipHeaders = ['content-encoding', 'transfer-encoding', 'content-length'];
      Object.keys(response.headers).forEach(key => {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, response.headers[key]);
        }
      });
      
      let usageRecorded = false;
      
      // 尝试解析JSON响应并提取usage信息
      try {
        const jsonData = JSON.parse(response.body);
        
        logger.info('📊 Parsed Claude API response:', JSON.stringify(jsonData, null, 2));
        
        // 从Claude API响应中提取usage信息（完整的token分类体系）
        if (jsonData.usage && jsonData.usage.input_tokens !== undefined && jsonData.usage.output_tokens !== undefined) {
          const inputTokens = jsonData.usage.input_tokens || 0;
          const outputTokens = jsonData.usage.output_tokens || 0;
          const cacheCreateTokens = jsonData.usage.cache_creation_input_tokens || 0;
          const cacheReadTokens = jsonData.usage.cache_read_input_tokens || 0;
          const model = jsonData.model || req.body.model || 'unknown';
          
          // 记录真实的token使用量（包含模型信息和所有4种token以及账户ID）
          const accountId = response.accountId;
          await apiKeyService.recordUsage(req.apiKey.id, inputTokens, outputTokens, cacheCreateTokens, cacheReadTokens, model, accountId);
          
          // 更新时间窗口内的token计数
          if (req.rateLimitInfo) {
            const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens;
            await redis.getClient().incrby(req.rateLimitInfo.tokenCountKey, totalTokens);
            logger.api(`📊 Updated rate limit token count: +${totalTokens} tokens`);
          }
          
          usageRecorded = true;
          logger.api(`📊 Non-stream usage recorded (real) - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cache Create: ${cacheCreateTokens}, Cache Read: ${cacheReadTokens}, Total: ${inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens} tokens`);
        } else {
          logger.warn('⚠️ No usage data found in Claude API JSON response');
        }
        
        res.json(jsonData);
      } catch (parseError) {
        logger.warn('⚠️ Failed to parse Claude API response as JSON:', parseError.message);
        logger.info('📄 Raw response body:', response.body);
        res.send(response.body);
      }
      
      // 如果没有记录usage，只记录警告，不进行估算
      if (!usageRecorded) {
        logger.warn('⚠️ No usage data recorded for non-stream request - no statistics recorded (official data only)');
      }
    }
    
    const duration = Date.now() - startTime;
    logger.api(`✅ Request completed in ${duration}ms for key: ${req.apiKey.name}`);
    
  } catch (error) {
    logger.error('❌ Claude relay error:', error.message, {
      code: error.code,
      stack: error.stack
    });
    
    // 确保在任何情况下都能返回有效的JSON响应
    if (!res.headersSent) {
      // 根据错误类型设置适当的状态码
      let statusCode = 500;
      let errorType = 'Relay service error';
      
      if (error.message.includes('Connection reset') || error.message.includes('socket hang up')) {
        statusCode = 502;
        errorType = 'Upstream connection error';
      } else if (error.message.includes('Connection refused')) {
        statusCode = 502;
        errorType = 'Upstream service unavailable';
      } else if (error.message.includes('timeout')) {
        statusCode = 504;
        errorType = 'Upstream timeout';
      } else if (error.message.includes('resolve') || error.message.includes('ENOTFOUND')) {
        statusCode = 502;
        errorType = 'Upstream hostname resolution failed';
      }
      
      res.status(statusCode).json({
        error: errorType,
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      });
    } else {
      // 如果响应头已经发送，尝试结束响应
      if (!res.destroyed && !res.finished) {
        res.end();
      }
    }
  }
}

// 🚀 Claude API messages 端点 - /api/v1/messages
router.post('/v1/messages', authenticateApiKey, handleMessagesRequest);

// 🚀 Claude API messages 端点 - /claude/v1/messages (别名)
router.post('/claude/v1/messages', authenticateApiKey, handleMessagesRequest);

// 📋 模型列表端点 - Claude Code 客户端需要
router.get('/v1/models', authenticateApiKey, async (req, res) => {
  try {
    // 返回支持的模型列表
    const models = [
      {
        id: 'claude-3-5-sonnet-20241022',
        object: 'model',
        created: 1669599635,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-5-haiku-20241022', 
        object: 'model',
        created: 1669599635,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-opus-20240229',
        object: 'model', 
        created: 1669599635,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-sonnet-4-20250514',
        object: 'model',
        created: 1669599635, 
        owned_by: 'anthropic'
      }
    ];
    
    res.json({
      object: 'list',
      data: models
    });
    
  } catch (error) {
    logger.error('❌ Models list error:', error);
    res.status(500).json({
      error: 'Failed to get models list',
      message: error.message
    });
  }
});

// 🏥 健康检查端点
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await claudeRelayService.healthCheck();
    
    res.status(healthStatus.healthy ? 200 : 503).json({
      status: healthStatus.healthy ? 'healthy' : 'unhealthy',
      service: 'claude-relay-service',
      version: '1.0.0',
      ...healthStatus
    });
  } catch (error) {
    logger.error('❌ Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'claude-relay-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 API Key状态检查端点 - /api/v1/key-info
router.get('/v1/key-info', authenticateApiKey, async (req, res) => {
  try {
    const usage = await apiKeyService.getUsageStats(req.apiKey.id);
    
    res.json({
      keyInfo: {
        id: req.apiKey.id,
        name: req.apiKey.name,
        tokenLimit: req.apiKey.tokenLimit,
        usage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Key info error:', error);
    res.status(500).json({
      error: 'Failed to get key info',
      message: error.message
    });
  }
});

// 📈 使用统计端点 - /api/v1/usage
router.get('/v1/usage', authenticateApiKey, async (req, res) => {
  try {
    const usage = await apiKeyService.getUsageStats(req.apiKey.id);
    
    res.json({
      usage,
      limits: {
        tokens: req.apiKey.tokenLimit,
        requests: 0 // 请求限制已移除
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to get usage stats',
      message: error.message
    });
  }
});

// 👤 用户信息端点 - Claude Code 客户端需要
router.get('/v1/me', authenticateApiKey, async (req, res) => {
  try {
    // 返回基础用户信息
    res.json({
      id: 'user_' + req.apiKey.id,
      type: 'user', 
      display_name: req.apiKey.name || 'API User',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ User info error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: error.message
    });
  }
});

// 💰 余额/限制端点 - Claude Code 客户端需要
router.get('/v1/organizations/:org_id/usage', authenticateApiKey, async (req, res) => {
  try {
    const usage = await apiKeyService.getUsageStats(req.apiKey.id);
    
    res.json({
      object: 'usage',
      data: [
        {
          type: 'credit_balance', 
          credit_balance: req.apiKey.tokenLimit - (usage.totalTokens || 0)
        }
      ]
    });
  } catch (error) {
    logger.error('❌ Organization usage error:', error);
    res.status(500).json({
      error: 'Failed to get usage info',
      message: error.message
    });
  }
});

module.exports = router;