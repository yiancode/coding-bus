# 多域名认证与支付集成技术方案

## 一、系统架构概述

### 1.1 域名规划

| 域名 | 用途 | 备案状态 | 主体类型 | 支持的登录方式 |
|------|------|---------|---------|--------------|
| code.ai80.net | 主服务域名 | 已备案 | 个人/企业 | 微信登录、谷歌登录 |
| vilicode.com | 备用服务域名 | 未备案 | - | 谷歌登录 |
| code.ai80.vip | 支付专用域名 | 已备案 | 企业主体 | 统一支付入口 |

### 1.2 核心流程

```
用户访问 → 选择登录方式 → OAuth认证 → 获取JWT Token → 使用服务
                                                ↓
                                          需要付费功能
                                                ↓
                              跳转到 code.ai80.vip 支付页面
                                                ↓
                                          支付成功回调
                                                ↓
                                    更新用户额度 & 回跳原域名
```

## 二、技术实现方案

### 2.1 微信登录集成（仅 code.ai80.net）

#### 前置条件
1. 微信开放平台账号（https://open.weixin.qq.com/）
2. 创建网站应用，配置授权回调域名：`code.ai80.net`
3. 获取 AppID 和 AppSecret

#### 实现步骤

**步骤1：环境变量配置（.env）**
```env
# 微信登录配置
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://code.ai80.net/auth/wechat/callback

# 谷歌登录配置
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI_AI80=https://code.ai80.net/auth/google/callback
GOOGLE_REDIRECT_URI_VILICODE=https://vilicode.com/auth/google/callback

# 支付域名配置
PAYMENT_DOMAIN=https://code.ai80.vip
ALLOWED_RETURN_DOMAINS=code.ai80.net,vilicode.com

# 跨域会话密钥（用于支付流程）
PAYMENT_SESSION_SECRET=your_payment_session_secret_32chars
```

**步骤2：创建微信登录服务（src/services/wechatAuthService.js）**
```javascript
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const redisClient = require('../models/redis').getClient();

class WechatAuthService {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.redirectUri = process.env.WECHAT_REDIRECT_URI;
    this.apiBaseUrl = 'https://api.weixin.qq.com';
  }

  /**
   * 生成微信授权URL
   * @param {string} state - 防CSRF的state参数
   * @returns {string} 授权URL
   */
  generateAuthUrl(state) {
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'snsapi_login', // 网站应用使用 snsapi_login
      state: state
    });

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  /**
   * 使用授权码交换access_token
   * @param {string} code - 微信返回的授权码
   * @returns {Promise<Object>} Token信息
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/sns/oauth2/access_token`, {
        params: {
          appid: this.appId,
          secret: this.appSecret,
          code: code,
          grant_type: 'authorization_code'
        }
      });

      if (response.data.errcode) {
        throw new Error(`微信授权失败: ${response.data.errmsg}`);
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        openid: response.data.openid,
        unionid: response.data.unionid,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('微信token交换失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取微信用户信息
   * @param {string} accessToken
   * @param {string} openid
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(accessToken, openid) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/sns/userinfo`, {
        params: {
          access_token: accessToken,
          openid: openid
        }
      });

      if (response.data.errcode) {
        throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
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
      logger.error('获取微信用户信息失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 刷新access_token
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/sns/oauth2/refresh_token`, {
        params: {
          appid: this.appId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }
      });

      if (response.data.errcode) {
        throw new Error(`刷新token失败: ${response.data.errmsg}`);
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('刷新微信token失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建或更新微信用户
   * @param {Object} wechatUser - 微信用户信息
   * @param {Object} tokenInfo - Token信息
   * @returns {Promise<Object>} 用户对象
   */
  async createOrUpdateUser(wechatUser, tokenInfo) {
    const userId = `wechat_${wechatUser.unionid || wechatUser.openid}`;

    const user = {
      id: userId,
      provider: 'wechat',
      openid: wechatUser.openid,
      unionid: wechatUser.unionid,
      nickname: wechatUser.nickname,
      avatar: wechatUser.avatar,
      email: null, // 微信不提供邮箱
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      metadata: {
        sex: wechatUser.sex,
        province: wechatUser.province,
        city: wechatUser.city,
        country: wechatUser.country
      }
    };

    // 存储用户信息
    await redisClient.set(`user:${userId}`, JSON.stringify(user));

    // 存储微信Token（加密）
    const encryptedToken = this.encryptToken(JSON.stringify(tokenInfo));
    await redisClient.set(`user:${userId}:wechat_token`, encryptedToken, {
      EX: tokenInfo.expiresIn
    });

    logger.info('微信用户创建/更新成功', { userId, nickname: user.nickname });
    return user;
  }

  /**
   * 加密Token数据
   */
  encryptToken(data) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密Token数据
   */
  decryptToken(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}

module.exports = new WechatAuthService();
```

**步骤3：创建谷歌登录服务（src/services/googleAuthService.js）**
```javascript
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const redisClient = require('../models/redis').getClient();

class GoogleAuthService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.tokenEndpoint = 'https://oauth2.googleapis.com/token';
    this.userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
  }

  /**
   * 生成谷歌授权URL
   * @param {string} domain - 当前域名（code.ai80.net 或 vilicode.com）
   * @param {string} state - 防CSRF的state参数
   * @returns {string} 授权URL
   */
  generateAuthUrl(domain, state) {
    const redirectUri = domain.includes('vilicode.com')
      ? process.env.GOOGLE_REDIRECT_URI_VILICODE
      : process.env.GOOGLE_REDIRECT_URI_AI80;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      access_type: 'offline', // 获取refresh_token
      prompt: 'consent' // 强制显示授权页面以获取refresh_token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 使用授权码交换access_token
   * @param {string} code - 谷歌返回的授权码
   * @param {string} domain - 当前域名
   * @returns {Promise<Object>} Token信息
   */
  async exchangeCodeForToken(code, domain) {
    try {
      const redirectUri = domain.includes('vilicode.com')
        ? process.env.GOOGLE_REDIRECT_URI_VILICODE
        : process.env.GOOGLE_REDIRECT_URI_AI80;

      const response = await axios.post(this.tokenEndpoint, {
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('谷歌token交换失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取谷歌用户信息
   * @param {string} accessToken
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return {
        googleId: response.data.id,
        email: response.data.email,
        emailVerified: response.data.verified_email,
        name: response.data.name,
        avatar: response.data.picture,
        locale: response.data.locale
      };
    } catch (error) {
      logger.error('获取谷歌用户信息失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 刷新access_token
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(this.tokenEndpoint, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('刷新谷歌token失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建或更新谷歌用户
   * @param {Object} googleUser - 谷歌用户信息
   * @param {Object} tokenInfo - Token信息
   * @returns {Promise<Object>} 用户对象
   */
  async createOrUpdateUser(googleUser, tokenInfo) {
    const userId = `google_${googleUser.googleId}`;

    const user = {
      id: userId,
      provider: 'google',
      googleId: googleUser.googleId,
      email: googleUser.email,
      emailVerified: googleUser.emailVerified,
      name: googleUser.name,
      avatar: googleUser.avatar,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      metadata: {
        locale: googleUser.locale
      }
    };

    // 存储用户信息
    await redisClient.set(`user:${userId}`, JSON.stringify(user));

    // 存储谷歌Token（加密）
    const encryptedToken = this.encryptToken(JSON.stringify(tokenInfo));
    await redisClient.set(`user:${userId}:google_token`, encryptedToken, {
      EX: tokenInfo.expiresIn
    });

    logger.info('谷歌用户创建/更新成功', { userId, email: user.email });
    return user;
  }

  encryptToken(data) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}

module.exports = new GoogleAuthService();
```

**步骤4：创建用户认证路由（src/routes/userAuthRoutes.js）**
```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const wechatAuthService = require('../services/wechatAuthService');
const googleAuthService = require('../services/googleAuthService');
const redisClient = require('../models/redis').getClient();
const logger = require('../utils/logger');

/**
 * 生成JWT Token
 */
function generateJWT(user) {
  return jwt.sign(
    {
      userId: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name || user.nickname
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * 生成随机state参数
 */
function generateState(domain) {
  const randomStr = crypto.randomBytes(16).toString('hex');
  const stateData = {
    random: randomStr,
    domain: domain,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(stateData)).toString('base64');
}

/**
 * 验证并解析state参数
 */
function verifyState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    // 检查state是否在5分钟内有效
    if (Date.now() - decoded.timestamp > 5 * 60 * 1000) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// ==================== 微信登录路由 ====================

/**
 * 发起微信登录
 * GET /auth/wechat/login
 */
router.get('/wechat/login', (req, res) => {
  const domain = req.get('host');

  // 仅允许 code.ai80.net 使用微信登录
  if (!domain.includes('code.ai80.net')) {
    return res.status(403).json({
      error: '微信登录仅在 code.ai80.net 域名下可用'
    });
  }

  const state = generateState(domain);
  const authUrl = wechatAuthService.generateAuthUrl(state);

  res.json({ authUrl });
});

/**
 * 微信登录回调
 * GET /auth/wechat/callback
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
      throw new Error('无效的state参数');
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

    // 5. 重定向到前端，带上JWT
    const frontendUrl = `https://${stateData.domain}/auth/callback?token=${jwtToken}&provider=wechat`;
    res.redirect(frontendUrl);
  } catch (error) {
    logger.error('微信登录回调失败', { error: error.message });
    res.redirect(`https://${req.get('host')}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

// ==================== 谷歌登录路由 ====================

/**
 * 发起谷歌登录
 * GET /auth/google/login
 */
router.get('/google/login', (req, res) => {
  const domain = req.get('host');
  const state = generateState(domain);
  const authUrl = googleAuthService.generateAuthUrl(domain, state);

  res.json({ authUrl });
});

/**
 * 谷歌登录回调
 * GET /auth/google/callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      throw new Error('缺少必要参数');
    }

    // 验证state
    const stateData = verifyState(state);
    if (!stateData) {
      throw new Error('无效的state参数');
    }

    // 1. 使用code交换access_token
    const tokenInfo = await googleAuthService.exchangeCodeForToken(code, stateData.domain);

    // 2. 获取用户信息
    const googleUser = await googleAuthService.getUserInfo(tokenInfo.accessToken);

    // 3. 创建或更新用户
    const user = await googleAuthService.createOrUpdateUser(googleUser, tokenInfo);

    // 4. 生成JWT
    const jwtToken = generateJWT(user);

    // 5. 重定向到前端，带上JWT
    const frontendUrl = `https://${stateData.domain}/auth/callback?token=${jwtToken}&provider=google`;
    res.redirect(frontendUrl);
  } catch (error) {
    logger.error('谷歌登录回调失败', { error: error.message });
    res.redirect(`https://${req.get('host')}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

// ==================== 用户信息路由 ====================

/**
 * 获取当前用户信息
 * GET /auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 从Redis获取用户信息
    const userStr = await redisClient.get(`user:${decoded.userId}`);
    if (!userStr) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = JSON.parse(userStr);

    // 不返回敏感信息
    delete user.metadata;

    res.json({ user });
  } catch (error) {
    logger.error('获取用户信息失败', { error: error.message });
    res.status(401).json({ error: '无效的token' });
  }
});

/**
 * 登出
 * POST /auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // 将token加入黑名单（可选）
      await redisClient.set(`token:blacklist:${token}`, '1', {
        EX: 30 * 24 * 60 * 60 // 30天
      });
    }

    res.json({ message: '登出成功' });
  } catch (error) {
    logger.error('登出失败', { error: error.message });
    res.status(500).json({ error: '登出失败' });
  }
});

module.exports = router;
```

### 2.2 跨域名支付流程

#### 核心设计

**支付流程图：**
```
code.ai80.net/vilicode.com            code.ai80.vip                code.ai80.net/vilicode.com
     (用户端)                           (支付端)                        (用户端)
        |                                  |                              |
        | 1. 用户点击购买                    |                              |
        |--------------------------------->|                              |
        |    带参数：                        |                              |
        |    - amount（金额）                |                              |
        |    - userId（加密）                |                              |
        |    - returnUrl（回跳地址）         |                              |
        |    - signature（签名）             |                              |
        |                                  |                              |
        |                                  | 2. 验证签名和参数               |
        |                                  |                              |
        |                                  | 3. 展示支付页面（微信/支付宝）    |
        |                                  |                              |
        |                                  | 4. 用户完成支付                |
        |                                  |                              |
        |                                  | 5. 支付成功，更新用户额度         |
        |                                  |                              |
        |                                  | 6. 生成回调token               |
        |<---------------------------------|                              |
        |    回跳 URL:                      |                              |
        |    returnUrl?                    |                              |
        |    token=xxx&                    |                              |
        |    status=success                |                              |
        |                                  |                              |
        | 7. 验证回调token                   |                              |
        |                                  |                              |
        | 8. 更新前端状态                     |                              |
```

**步骤5：创建支付服务（src/services/paymentService.js）**
```javascript
const crypto = require('crypto');
const logger = require('../utils/logger');
const redisClient = require('../models/redis').getClient();

class PaymentService {
  constructor() {
    this.paymentDomain = process.env.PAYMENT_DOMAIN;
    this.allowedReturnDomains = process.env.ALLOWED_RETURN_DOMAINS.split(',');
    this.sessionSecret = process.env.PAYMENT_SESSION_SECRET;
  }

  /**
   * 生成支付跳转URL
   * @param {Object} params
   * @param {string} params.userId - 用户ID
   * @param {number} params.amount - 金额（分）
   * @param {string} params.productId - 产品ID
   * @param {string} params.returnUrl - 回跳地址
   * @returns {string} 支付URL
   */
  generatePaymentUrl(params) {
    const { userId, amount, productId, returnUrl } = params;

    // 验证回跳域名
    const returnDomain = new URL(returnUrl).hostname;
    if (!this.allowedReturnDomains.some(d => returnDomain.includes(d))) {
      throw new Error('不允许的回跳域名');
    }

    // 生成支付会话ID
    const sessionId = crypto.randomBytes(16).toString('hex');

    // 创建签名数据
    const signData = {
      sessionId,
      userId,
      amount,
      productId,
      returnUrl,
      timestamp: Date.now()
    };

    // 生成签名
    const signature = this.generateSignature(signData);

    // 构建支付URL
    const paymentParams = new URLSearchParams({
      session: sessionId,
      user: this.encryptUserId(userId),
      amount: amount,
      product: productId,
      return: Buffer.from(returnUrl).toString('base64'),
      sig: signature
    });

    // 存储支付会话（15分钟有效期）
    this.storePaymentSession(sessionId, signData);

    return `${this.paymentDomain}/payment?${paymentParams.toString()}`;
  }

  /**
   * 验证支付请求参数
   * @param {Object} params - URL参数
   * @returns {Promise<Object>} 验证后的数据
   */
  async verifyPaymentRequest(params) {
    const { session, user, amount, product, return: returnBase64, sig } = params;

    // 1. 从Redis获取会话数据
    const sessionData = await this.getPaymentSession(session);
    if (!sessionData) {
      throw new Error('无效或过期的支付会话');
    }

    // 2. 解密用户ID
    const userId = this.decryptUserId(user);
    if (userId !== sessionData.userId) {
      throw new Error('用户ID不匹配');
    }

    // 3. 验证签名
    const expectedSig = this.generateSignature(sessionData);
    if (sig !== expectedSig) {
      throw new Error('签名验证失败');
    }

    // 4. 验证参数一致性
    const returnUrl = Buffer.from(returnBase64, 'base64').toString('utf-8');
    if (
      Number(amount) !== sessionData.amount ||
      product !== sessionData.productId ||
      returnUrl !== sessionData.returnUrl
    ) {
      throw new Error('参数不匹配');
    }

    // 5. 检查会话是否已使用
    if (sessionData.used) {
      throw new Error('支付会话已被使用');
    }

    return {
      sessionId: session,
      userId,
      amount: Number(amount),
      productId: product,
      returnUrl
    };
  }

  /**
   * 标记支付会话为已使用
   */
  async markSessionAsUsed(sessionId) {
    const key = `payment:session:${sessionId}`;
    const sessionStr = await redisClient.get(key);
    if (sessionStr) {
      const sessionData = JSON.parse(sessionStr);
      sessionData.used = true;
      await redisClient.set(key, JSON.stringify(sessionData), { EX: 900 });
    }
  }

  /**
   * 生成支付回调token
   * @param {Object} data
   * @param {string} data.sessionId
   * @param {string} data.userId
   * @param {string} data.orderId - 支付订单ID
   * @param {string} data.status - 支付状态
   * @returns {string} 回调token
   */
  generateCallbackToken(data) {
    const tokenData = {
      ...data,
      timestamp: Date.now()
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    const signature = this.generateSignature(tokenData);

    return `${token}.${signature}`;
  }

  /**
   * 验证回调token
   * @param {string} token
   * @returns {Object} Token数据
   */
  verifyCallbackToken(token) {
    try {
      const [tokenPart, signature] = token.split('.');
      const tokenData = JSON.parse(Buffer.from(tokenPart, 'base64').toString('utf-8'));

      // 验证签名
      const expectedSig = this.generateSignature(tokenData);
      if (signature !== expectedSig) {
        throw new Error('签名验证失败');
      }

      // 验证时间戳（30分钟有效）
      if (Date.now() - tokenData.timestamp > 30 * 60 * 1000) {
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
   * @param {Object} data
   * @param {string} data.userId
   * @param {string} data.orderId
   * @param {number} data.amount
   * @param {string} data.productId
   */
  async handlePaymentSuccess(data) {
    const { userId, orderId, amount, productId } = data;

    try {
      // 1. 记录支付订单
      const order = {
        id: orderId,
        userId,
        amount,
        productId,
        status: 'completed',
        createdAt: Date.now(),
        completedAt: Date.now()
      };

      await redisClient.set(`payment:order:${orderId}`, JSON.stringify(order));

      // 2. 更新用户额度
      await this.updateUserBalance(userId, amount, productId);

      // 3. 记录支付日志
      logger.info('支付成功', {
        orderId,
        userId,
        amount,
        productId
      });

      return order;
    } catch (error) {
      logger.error('处理支付成功失败', { error: error.message, data });
      throw error;
    }
  }

  /**
   * 更新用户余额/额度
   */
  async updateUserBalance(userId, amount, productId) {
    // 根据产品ID计算额度增量
    const credits = this.calculateCredits(amount, productId);

    // 获取当前余额
    const balanceKey = `user:${userId}:balance`;
    const currentBalance = await redisClient.get(balanceKey) || '0';
    const newBalance = Number(currentBalance) + credits;

    // 更新余额
    await redisClient.set(balanceKey, newBalance.toString());

    // 记录余额变动日志
    const logEntry = {
      userId,
      type: 'payment',
      amount,
      credits,
      balance: newBalance,
      productId,
      timestamp: Date.now()
    };

    await redisClient.lPush(`user:${userId}:balance_log`, JSON.stringify(logEntry));

    logger.info('用户余额更新成功', {
      userId,
      credits,
      newBalance
    });
  }

  /**
   * 根据金额和产品ID计算额度
   */
  calculateCredits(amount, productId) {
    // 示例：1元 = 100积分
    // 可以根据不同产品设置不同比例
    const conversionRate = 100;
    return Math.floor(amount / 100 * conversionRate);
  }

  /**
   * 生成签名
   */
  generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
    const hmac = crypto.createHmac('sha256', this.sessionSecret);
    hmac.update(signString);
    return hmac.digest('hex');
  }

  /**
   * 加密用户ID
   */
  encryptUserId(userId) {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8'),
      Buffer.alloc(16, 0) // 固定IV，仅用于混淆
    );
    let encrypted = cipher.update(userId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密用户ID
   */
  decryptUserId(encryptedUserId) {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8'),
      Buffer.alloc(16, 0)
    );
    let decrypted = decipher.update(encryptedUserId, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 存储支付会话
   */
  async storePaymentSession(sessionId, data) {
    const key = `payment:session:${sessionId}`;
    await redisClient.set(key, JSON.stringify(data), {
      EX: 15 * 60 // 15分钟有效期
    });
  }

  /**
   * 获取支付会话
   */
  async getPaymentSession(sessionId) {
    const key = `payment:session:${sessionId}`;
    const sessionStr = await redisClient.get(key);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }
}

module.exports = new PaymentService();
```

**步骤6：创建支付路由（src/routes/paymentRoutes.js）**
```javascript
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 创建支付订单（在用户端调用）
 * POST /api/payment/create
 */
router.post('/create', async (req, res) => {
  try {
    const { userId, amount, productId } = req.body;

    // 验证参数
    if (!userId || !amount || !productId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 验证用户认证（从JWT获取）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    // 构建回跳URL（回到当前域名）
    const protocol = req.protocol;
    const host = req.get('host');
    const returnUrl = `${protocol}://${host}/payment/callback`;

    // 生成支付URL
    const paymentUrl = paymentService.generatePaymentUrl({
      userId,
      amount: Number(amount),
      productId,
      returnUrl
    });

    res.json({
      paymentUrl,
      message: '请在新窗口中完成支付'
    });
  } catch (error) {
    logger.error('创建支付订单失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * 支付页面（在 code.ai80.vip 上）
 * GET /payment
 */
router.get('/', async (req, res) => {
  try {
    // 验证支付请求参数
    const paymentData = await paymentService.verifyPaymentRequest(req.query);

    // 渲染支付页面（这里简化处理，实际应该返回HTML页面）
    res.json({
      message: '支付页面',
      data: {
        sessionId: paymentData.sessionId,
        amount: paymentData.amount,
        productId: paymentData.productId
      },
      // 实际应该返回包含微信/支付宝支付的HTML页面
      note: '此端点应返回支付页面HTML，而不是JSON'
    });
  } catch (error) {
    logger.error('支付页面加载失败', { error: error.message });
    res.status(400).send(`支付失败: ${error.message}`);
  }
});

/**
 * 支付回调（微信/支付宝回调到 code.ai80.vip）
 * POST /payment/notify
 */
router.post('/notify', async (req, res) => {
  try {
    // 这里处理支付平台的异步通知
    // 具体实现取决于使用的支付平台（微信支付/支付宝）

    const { sessionId, orderId, status } = req.body;

    if (status !== 'success') {
      return res.status(400).json({ error: '支付未成功' });
    }

    // 获取支付会话
    const sessionData = await paymentService.getPaymentSession(sessionId);
    if (!sessionData) {
      return res.status(400).json({ error: '无效的支付会话' });
    }

    // 处理支付成功
    await paymentService.handlePaymentSuccess({
      userId: sessionData.userId,
      orderId,
      amount: sessionData.amount,
      productId: sessionData.productId
    });

    // 标记会话已使用
    await paymentService.markSessionAsUsed(sessionId);

    // 生成回调token
    const callbackToken = paymentService.generateCallbackToken({
      sessionId,
      userId: sessionData.userId,
      orderId,
      status: 'success'
    });

    // 返回回跳URL（支付平台会引导用户跳转）
    const returnUrl = `${sessionData.returnUrl}?token=${callbackToken}&status=success`;

    res.json({
      success: true,
      returnUrl
    });
  } catch (error) {
    logger.error('支付回调处理失败', { error: error.message });
    res.status(500).json({ error: '支付处理失败' });
  }
});

/**
 * 用户端支付回调接收（在 code.ai80.net/vilicode.com 上）
 * GET /payment/callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { token, status } = req.query;

    if (!token || status !== 'success') {
      throw new Error('支付失败或被取消');
    }

    // 验证回调token
    const tokenData = paymentService.verifyCallbackToken(token);

    // 重定向到前端成功页面
    const frontendUrl = `/payment/success?orderId=${tokenData.orderId}`;
    res.redirect(frontendUrl);
  } catch (error) {
    logger.error('支付回调接收失败', { error: error.message });
    res.redirect(`/payment/failed?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * 查询支付订单状态
 * GET /api/payment/order/:orderId
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderStr = await require('../models/redis')
      .getClient()
      .get(`payment:order:${orderId}`);

    if (!orderStr) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = JSON.parse(orderStr);
    res.json({ order });
  } catch (error) {
    logger.error('查询订单失败', { error: error.message });
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 查询用户余额
 * GET /api/payment/balance
 */
router.get('/balance', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const balanceKey = `user:${decoded.userId}:balance`;
    const balance = await require('../models/redis').getClient().get(balanceKey) || '0';

    res.json({
      userId: decoded.userId,
      balance: Number(balance)
    });
  } catch (error) {
    logger.error('查询余额失败', { error: error.message });
    res.status(500).json({ error: '查询失败' });
  }
});

module.exports = router;
```

### 2.3 前端集成

**步骤7：前端登录组件（web/admin-spa/src/views/UserLogin.vue）**
```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo和标题 -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          欢迎使用 Coding Bus
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          选择登录方式继续
        </p>
      </div>

      <!-- 登录按钮组 -->
      <div class="space-y-4">
        <!-- 微信登录 (仅 code.ai80.net) -->
        <button
          v-if="isAi80NetDomain"
          @click="handleWechatLogin"
          :disabled="isLoading"
          class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <!-- 微信图标 -->
            <path d="M8.5 14.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm7 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
          </svg>
          微信登录
        </button>

        <!-- 谷歌登录 -->
        <button
          @click="handleGoogleLogin"
          :disabled="isLoading"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <!-- Google 图标 -->
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 登录
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center text-sm text-gray-600 dark:text-gray-400">
        正在跳转登录...
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- 隐私政策和用户协议 -->
      <div class="text-center text-xs text-gray-500 dark:text-gray-400">
        登录即表示同意
        <a href="/terms" class="text-blue-600 hover:text-blue-500">用户协议</a>
        和
        <a href="/privacy" class="text-blue-600 hover:text-blue-500">隐私政策</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const error = ref('');

// 检测当前域名
const isAi80NetDomain = computed(() => {
  return window.location.hostname.includes('code.ai80.net');
});

// 微信登录
const handleWechatLogin = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const response = await axios.get('/auth/wechat/login');
    const { authUrl } = response.data;

    // 跳转到微信授权页面
    window.location.href = authUrl;
  } catch (err) {
    error.value = err.response?.data?.error || '登录失败，请重试';
    isLoading.value = false;
  }
};

// 谷歌登录
const handleGoogleLogin = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const response = await axios.get('/auth/google/login');
    const { authUrl } = response.data;

    // 跳转到谷歌授权页面
    window.location.href = authUrl;
  } catch (err) {
    error.value = err.response?.data?.error || '登录失败，请重试';
    isLoading.value = false;
  }
};

// 处理登录回调
onMounted(() => {
  if (route.path === '/auth/callback') {
    const token = route.query.token;
    const provider = route.query.provider;

    if (token) {
      // 保存token到localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_provider', provider);

      // 跳转到首页
      router.push('/');
    }
  }

  if (route.path === '/auth/error') {
    error.value = route.query.message || '登录失败';
  }
});
</script>
```

**步骤8：前端支付组件（web/admin-spa/src/views/Payment.vue）**
```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      充值额度
    </h2>

    <!-- 余额显示 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">当前余额</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {{ balance }} 积分
          </p>
        </div>
        <button
          @click="refreshBalance"
          class="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          刷新
        </button>
      </div>
    </div>

    <!-- 充值套餐 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="product in products"
        :key="product.id"
        @click="selectedProduct = product"
        :class="[
          'cursor-pointer rounded-lg border-2 p-6 transition-all',
          selectedProduct?.id === product.id
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
        ]"
      >
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            ¥{{ product.price / 100 }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ product.credits }} 积分
          </p>
          <p v-if="product.bonus" class="text-xs text-green-600 dark:text-green-400 mt-2">
            额外赠送 {{ product.bonus }} 积分
          </p>
        </div>
      </div>
    </div>

    <!-- 支付按钮 -->
    <button
      @click="handlePurchase"
      :disabled="!selectedProduct || isProcessing"
      class="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isProcessing ? '处理中...' : '立即支付' }}
    </button>

    <!-- 说明文字 -->
    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
      <p>支付将跳转到安全支付页面</p>
      <p class="mt-1">支持微信支付、支付宝支付</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const balance = ref(0);
const selectedProduct = ref(null);
const isProcessing = ref(false);

const products = ref([
  { id: 'plan_1', price: 1000, credits: 1000, bonus: 0 },
  { id: 'plan_2', price: 5000, credits: 5000, bonus: 500 },
  { id: 'plan_3', price: 10000, credits: 10000, bonus: 2000 }
]);

// 获取余额
const fetchBalance = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get('/api/payment/balance', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    balance.value = response.data.balance;
  } catch (error) {
    console.error('获取余额失败', error);
  }
};

const refreshBalance = () => {
  fetchBalance();
};

// 发起支付
const handlePurchase = async () => {
  try {
    isProcessing.value = true;

    const token = localStorage.getItem('auth_token');
    const jwt = JSON.parse(atob(token.split('.')[1]));

    const response = await axios.post(
      '/api/payment/create',
      {
        userId: jwt.userId,
        amount: selectedProduct.value.price,
        productId: selectedProduct.value.id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const { paymentUrl } = response.data;

    // 打开支付页面（新窗口）
    window.location.href = paymentUrl;
  } catch (error) {
    console.error('创建支付订单失败', error);
    alert('支付失败，请重试');
  } finally {
    isProcessing.value = false;
  }
};

onMounted(() => {
  fetchBalance();

  // 监听支付回调
  if (router.currentRoute.value.path === '/payment/success') {
    alert('支付成功！');
    fetchBalance();
    router.push('/');
  }
});
</script>
```

## 三、部署配置

### 3.1 Nginx配置

**code.ai80.net 配置：**
```nginx
server {
    listen 443 ssl http2;
    server_name code.ai80.net;

    ssl_certificate /path/to/code.ai80.net.crt;
    ssl_certificate_key /path/to/code.ai80.net.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**vilicode.com 配置：**
```nginx
server {
    listen 443 ssl http2;
    server_name vilicode.com;

    ssl_certificate /path/to/vilicode.com.crt;
    ssl_certificate_key /path/to/vilicode.com.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**code.ai80.vip 配置（支付专用）：**
```nginx
server {
    listen 443 ssl http2;
    server_name code.ai80.vip;

    ssl_certificate /path/to/code.ai80.vip.crt;
    ssl_certificate_key /path/to/code.ai80.vip.key;

    # 只允许支付相关路由
    location /payment {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 拒绝其他请求
    location / {
        return 403;
    }
}
```

### 3.2 环境变量配置清单

```env
# 服务配置
NODE_ENV=production
PORT=3000

# 安全密钥
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars
PAYMENT_SESSION_SECRET=your_payment_session_secret_32chars

# 微信登录 (仅 code.ai80.net)
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://code.ai80.net/auth/wechat/callback

# 谷歌登录 (两个域名)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI_AI80=https://code.ai80.net/auth/google/callback
GOOGLE_REDIRECT_URI_VILICODE=https://vilicode.com/auth/google/callback

# 支付配置
PAYMENT_DOMAIN=https://code.ai80.vip
ALLOWED_RETURN_DOMAINS=code.ai80.net,vilicode.com

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## 四、安全和最佳实践

### 4.1 安全检查清单

- [ ] 所有敏感数据（Token、密钥）使用AES加密存储
- [ ] 支付签名使用HMAC-SHA256防篡改
- [ ] 实现CSRF防护（state参数）
- [ ] 限制允许的回跳域名白名单
- [ ] 支付会话设置短期过期时间（15分钟）
- [ ] 使用HTTPS确保传输安全
- [ ] 实现请求频率限制防止滥用
- [ ] 记录所有敏感操作日志

### 4.2 测试建议

1. **登录流程测试**：
   - 微信登录正常流程
   - 谷歌登录正常流程
   - 跨域名登录状态保持
   - Token过期处理

2. **支付流程测试**：
   - 正常支付流程端到端测试
   - 支付签名验证
   - 支付会话过期处理
   - 回跳URL安全验证
   - 余额更新正确性

3. **安全测试**：
   - CSRF攻击防护
   - 签名伪造测试
   - 重放攻击防护
   - 域名白名单验证

## 五、后续优化建议

1. **性能优化**：
   - Redis缓存用户会话
   - 支付订单状态使用Redis缓存
   - 实现连接池优化数据库查询

2. **功能扩展**：
   - 支持更多支付方式（PayPal、信用卡）
   - 实现支付退款功能
   - 添加支付记录查询接口
   - 实现自动发票功能

3. **监控和告警**：
   - 接入支付失败告警
   - 监控异常支付行为
   - 记录完整的支付审计日志

## 六、部署步骤

1. 配置环境变量
2. 更新 `src/app.js` 注册新路由
3. 配置Nginx反向代理
4. 申请微信开放平台和谷歌OAuth凭据
5. 配置域名SSL证书
6. 测试登录和支付流程
7. 上线监控

---

文档版本：1.0
最后更新：2025-10-16
