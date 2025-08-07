const https = require('https');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');

class FallbackRelayService {
  constructor() {
    this.fallbackRelays = config.claude.fallbackRelays || [];
    this.currentRelayIndex = 0;
    this.failedRelays = new Set(); // 跟踪失败的中转
    this.retryAfterTime = new Map(); // 跟踪中转的重试时间
  }

  // 🔍 检测是否为账户补号错误
  isAccountReplenishmentError(errorMessage) {
    if (typeof errorMessage !== 'string') return false;
    
    const replenishmentPatterns = [
      '正在补号中，请稍等片刻',
      'account replenishment in progress', 
      'please wait while we replenish accounts',
      '账号补充中',
      'account maintenance',
      '系统维护中'
    ];
    
    return replenishmentPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // 🔍 检测是否为限流或其他需要切换的错误
  isFailoverError(response, responseBody) {
    // 检查HTTP状态码
    if (response.statusCode === 429) {
      logger.warn('🚫 Rate limit detected - triggering failover');
      return true;
    }
    
    if (response.statusCode === 503) {
      logger.warn('🚫 Service unavailable - triggering failover');
      return true;
    }

    // 检查响应体中的错误信息
    try {
      const errorMessage = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
      
      // 账户补号错误
      if (this.isAccountReplenishmentError(errorMessage)) {
        logger.warn('🚫 Account replenishment error detected - triggering failover');
        return true;
      }
      
      // 其他API错误模式
      const failoverPatterns = [
        'exceed your account\'s rate limit',
        'quota exceeded',
        'temporarily unavailable',
        'service overloaded',
        'internal server error'
      ];
      
      if (failoverPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern))) {
        logger.warn('🚫 API error requiring failover detected');
        return true;
      }
    } catch (parseError) {
      // 忽略解析错误
    }

    return false;
  }

  // 🎯 获取下一个可用的中转API
  getNextAvailableRelay() {
    if (this.fallbackRelays.length === 0) {
      logger.warn('⚠️ No fallback relays configured');
      return null;
    }

    const now = Date.now();
    let attempts = 0;
    
    while (attempts < this.fallbackRelays.length) {
      const relay = this.fallbackRelays[this.currentRelayIndex];
      
      // 检查这个中转是否在重试冷却期
      if (this.retryAfterTime.has(relay.name)) {
        const retryTime = this.retryAfterTime.get(relay.name);
        if (now < retryTime) {
          logger.info(`⏳ Relay ${relay.name} in cooldown until ${new Date(retryTime).toISOString()}`);
          this.currentRelayIndex = (this.currentRelayIndex + 1) % this.fallbackRelays.length;
          attempts++;
          continue;
        } else {
          // 冷却期结束，移除记录
          this.retryAfterTime.delete(relay.name);
          this.failedRelays.delete(relay.name);
        }
      }
      
      // 如果这个中转没有失败记录，使用它
      if (!this.failedRelays.has(relay.name)) {
        logger.info(`🎯 Selected fallback relay: ${relay.name} (${relay.baseUrl})`);
        return relay;
      }
      
      this.currentRelayIndex = (this.currentRelayIndex + 1) % this.fallbackRelays.length;
      attempts++;
    }
    
    logger.warn('⚠️ All fallback relays are currently unavailable');
    return null;
  }

  // 🔄 使用中转API发送请求
  async makeRelayRequest(requestBody, relay, clientHeaders = {}) {
    try {
      logger.info(`📡 Making request to fallback relay: ${relay.name}`);
      
      // 构建请求URL
      const url = relay.baseUrl.endsWith('/') ? relay.baseUrl.slice(0, -1) : relay.baseUrl;
      const endpoint = `${url}/v1/messages`;
      
      // 准备请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${relay.apiKey}`,
        'User-Agent': 'claude-cli/1.0.57 (external, cli)',
        ...this._filterClientHeaders(clientHeaders)
      };

      // 发送请求
      const response = await axios.post(endpoint, requestBody, {
        headers,
        timeout: config.proxy.timeout || 30000,
        validateStatus: () => true // 不抛出HTTP错误
      });

      logger.info(`📡 Relay ${relay.name} responded with status: ${response.status}`);

      // 检查响应是否成功
      if (response.status === 200 || response.status === 201) {
        // 成功响应，清除失败记录
        this.failedRelays.delete(relay.name);
        this.retryAfterTime.delete(relay.name);
        
        return {
          statusCode: response.status,
          headers: response.headers,
          body: JSON.stringify(response.data)
        };
      } else {
        // 失败响应，记录失败
        this._recordRelayFailure(relay.name, response.status);
        
        const errorBody = response.data || { error: `Relay returned status ${response.status}` };
        return {
          statusCode: response.status,
          headers: response.headers,
          body: JSON.stringify(errorBody)
        };
      }
    } catch (error) {
      logger.error(`❌ Relay ${relay.name} request failed:`, error.message);
      
      // 记录失败并设置重试时间
      this._recordRelayFailure(relay.name, 0, error);
      
      throw error;
    }
  }

  // 🌊 使用中转API发送流式请求
  async makeRelayStreamRequest(requestBody, relay, responseStream, clientHeaders = {}, usageCallback = null) {
    try {
      logger.info(`📡 Making streaming request to fallback relay: ${relay.name}`);
      
      // 构建请求URL
      const url = relay.baseUrl.endsWith('/') ? relay.baseUrl.slice(0, -1) : relay.baseUrl;
      const endpoint = `${url}/v1/messages`;
      
      // 准备请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${relay.apiKey}`,
        'User-Agent': 'claude-cli/1.0.57 (external, cli)',
        ...this._filterClientHeaders(clientHeaders)
      };

      // 确保请求体包含stream参数
      const streamRequestBody = { ...requestBody, stream: true };

      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(streamRequestBody);
        const urlObj = new URL(endpoint);
        
        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: config.proxy.timeout || 30000
        };

        const req = https.request(requestOptions, (res) => {
          logger.info(`📡 Relay ${relay.name} streaming response status: ${res.statusCode}`);

          if (res.statusCode !== 200) {
            logger.error(`❌ Relay ${relay.name} returned error status: ${res.statusCode}`);
            this._recordRelayFailure(relay.name, res.statusCode);
            
            let errorData = '';
            res.on('data', (chunk) => {
              errorData += chunk.toString();
            });
            
            res.on('end', () => {
              if (!responseStream.destroyed) {
                responseStream.writeHead(res.statusCode, { 'Content-Type': 'application/json' });
                responseStream.end(errorData || JSON.stringify({ error: `Relay returned status ${res.statusCode}` }));
              }
              reject(new Error(`Relay error: ${res.statusCode}`));
            });
            return;
          }

          // 成功响应，清除失败记录
          this.failedRelays.delete(relay.name);
          this.retryAfterTime.delete(relay.name);

          // 设置响应头
          if (!responseStream.headersSent) {
            responseStream.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            });
          }

          let buffer = '';
          let finalUsageReported = false;
          let collectedUsageData = {};

          // 处理流式数据
          res.on('data', (chunk) => {
            try {
              const chunkStr = chunk.toString();
              buffer += chunkStr;

              // 处理完整的SSE行
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              // 转发数据到客户端
              if (lines.length > 0 && !responseStream.destroyed) {
                const linesToForward = lines.join('\n') + (lines.length > 0 ? '\n' : '');
                responseStream.write(linesToForward);
              }

              // 解析usage数据（如果需要）
              if (usageCallback) {
                for (const line of lines) {
                  if (line.startsWith('data: ') && line.length > 6) {
                    try {
                      const jsonStr = line.slice(6);
                      const data = JSON.parse(jsonStr);

                      // 收集usage数据
                      if (data.type === 'message_start' && data.message && data.message.usage) {
                        collectedUsageData.input_tokens = data.message.usage.input_tokens || 0;
                        collectedUsageData.cache_creation_input_tokens = data.message.usage.cache_creation_input_tokens || 0;
                        collectedUsageData.cache_read_input_tokens = data.message.usage.cache_read_input_tokens || 0;
                        collectedUsageData.model = data.message.model;
                      }

                      if (data.type === 'message_delta' && data.usage && data.usage.output_tokens !== undefined) {
                        collectedUsageData.output_tokens = data.usage.output_tokens || 0;
                        
                        if (collectedUsageData.input_tokens !== undefined && !finalUsageReported) {
                          usageCallback(collectedUsageData);
                          finalUsageReported = true;
                        }
                      }
                    } catch (parseError) {
                      // 忽略解析错误
                    }
                  }
                }
              }
            } catch (error) {
              logger.error('❌ Error processing relay stream data:', error);
            }
          });

          res.on('end', () => {
            try {
              // 处理缓冲区中剩余的数据
              if (buffer.trim() && !responseStream.destroyed) {
                responseStream.write(buffer);
              }
              
              if (!responseStream.destroyed) {
                responseStream.end();
              }
            } catch (error) {
              logger.error('❌ Error ending relay stream:', error);
            }
            
            logger.info(`✅ Relay ${relay.name} streaming request completed`);
            resolve();
          });

          res.on('error', (error) => {
            logger.error(`❌ Relay ${relay.name} response error:`, error);
            this._recordRelayFailure(relay.name, 0, error);
            if (!responseStream.destroyed) {
              responseStream.write('event: error\n');
              responseStream.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              responseStream.end();
            }
            reject(error);
          });
        });

        req.on('error', (error) => {
          logger.error(`❌ Relay ${relay.name} request error:`, error);
          this._recordRelayFailure(relay.name, 0, error);
          
          if (!responseStream.destroyed) {
            if (!responseStream.headersSent) {
              responseStream.writeHead(500, { 'Content-Type': 'application/json' });
            }
            responseStream.end(JSON.stringify({ error: `Relay request failed: ${error.message}` }));
          }
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          logger.error(`❌ Relay ${relay.name} request timeout`);
          this._recordRelayFailure(relay.name, 0, new Error('Request timeout'));
          reject(new Error('Request timeout'));
        });

        // 发送请求数据
        req.write(postData);
        req.end();
      });

    } catch (error) {
      logger.error(`❌ Relay ${relay.name} streaming request failed:`, error.message);
      this._recordRelayFailure(relay.name, 0, error);
      throw error;
    }
  }

  // 📝 记录中转失败
  _recordRelayFailure(relayName, statusCode, error = null) {
    this.failedRelays.add(relayName);
    
    // 根据错误类型设置不同的重试时间
    let retryDelayMs = 60000; // 默认1分钟
    
    if (statusCode === 429) {
      retryDelayMs = 300000; // 5分钟
    } else if (statusCode === 503) {
      retryDelayMs = 180000; // 3分钟
    } else if (error && error.code === 'ETIMEDOUT') {
      retryDelayMs = 120000; // 2分钟
    }
    
    const retryTime = Date.now() + retryDelayMs;
    this.retryAfterTime.set(relayName, retryTime);
    
    logger.warn(`⚠️ Relay ${relayName} marked as failed, will retry after ${new Date(retryTime).toISOString()}`);
  }

  // 🔧 过滤客户端请求头
  _filterClientHeaders(clientHeaders) {
    const sensitiveHeaders = [
      'content-type',
      'authorization',
      'host',
      'content-length',
      'connection'
    ];
    
    const filteredHeaders = {};
    Object.keys(clientHeaders || {}).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (!sensitiveHeaders.includes(lowerKey)) {
        filteredHeaders[key] = clientHeaders[key];
      }
    });
    
    return filteredHeaders;
  }

  // 📊 获取中转状态
  getRelayStatus() {
    return {
      totalRelays: this.fallbackRelays.length,
      availableRelays: this.fallbackRelays.length - this.failedRelays.size,
      failedRelays: Array.from(this.failedRelays),
      currentRelay: this.fallbackRelays[this.currentRelayIndex]?.name || null,
      retryTimes: Object.fromEntries(this.retryAfterTime)
    };
  }

  // 🔄 重置所有中转状态
  resetAllRelays() {
    this.failedRelays.clear();
    this.retryAfterTime.clear();
    this.currentRelayIndex = 0;
    logger.info('🔄 All relay failure states have been reset');
  }
}

module.exports = new FallbackRelayService();