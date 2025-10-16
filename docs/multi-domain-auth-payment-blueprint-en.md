# Multi-Domain Authentication and Payment Integration Blueprint

## Overview

This blueprint provides a comprehensive solution for implementing multi-domain authentication (WeChat + Google) and cross-domain payment flow for the Coding Bus service.

## Domain Architecture

### Domain Allocation

| Domain | Purpose | ICP Filing | Entity Type | Supported Auth Methods |
|--------|---------|-----------|-------------|----------------------|
| code.ai80.net | Primary Service | Filed | Personal/Enterprise | WeChat, Google |
| vilicode.com | International Service | Not Filed | - | Google Only |
| code.ai80.vip | Payment Gateway | Filed | Enterprise | Unified Payment |

### Core Flow

```
User Access → Choose Auth Method → OAuth Authentication → Get JWT Token → Use Services
                                                              ↓
                                                    Need Paid Features
                                                              ↓
                                            Redirect to code.ai80.vip
                                                              ↓
                                                    Complete Payment
                                                              ↓
                                          Update User Credits & Return
```

## Implementation Details

### 1. WeChat Login Integration (code.ai80.net only)

#### Prerequisites
1. WeChat Open Platform Account (https://open.weixin.qq.com/)
2. Create Website Application
3. Configure Callback Domain: `code.ai80.net`
4. Obtain AppID and AppSecret

#### Key Features
- QR Code login flow (snsapi_login)
- Secure token storage with AES encryption
- Automatic token refresh
- User profile management with unionid/openid

### 2. Google OAuth Integration (Both Domains)

#### Prerequisites
1. Google Cloud Console Project
2. Configure OAuth 2.0 Credentials
3. Add Authorized Redirect URIs:
   - `https://code.ai80.net/auth/google/callback`
   - `https://vilicode.com/auth/google/callback`

#### Key Features
- Multi-domain support
- Offline access with refresh_token
- Profile data (email, name, avatar)
- Automatic token refresh

### 3. Cross-Domain Payment Flow

#### Payment Architecture

```
code.ai80.net/vilicode.com            code.ai80.vip                code.ai80.net/vilicode.com
     (User Domain)                    (Payment Domain)                  (User Domain)
        |                                  |                              |
        | 1. User clicks purchase          |                              |
        |--------------------------------->|                              |
        |    Parameters:                   |                              |
        |    - amount                      |                              |
        |    - userId (encrypted)          |                              |
        |    - returnUrl                   |                              |
        |    - signature (HMAC-SHA256)     |                              |
        |                                  |                              |
        |                                  | 2. Verify signature           |
        |                                  |                              |
        |                                  | 3. Show payment page          |
        |                                  |                              |
        |                                  | 4. User completes payment     |
        |                                  |                              |
        |                                  | 5. Update user credits        |
        |                                  |                              |
        |                                  | 6. Generate callback token    |
        |<---------------------------------|                              |
        |    Return URL with token         |                              |
        |                                  |                              |
        | 7. Verify callback token         |                              |
        |                                  |                              |
        | 8. Update frontend state         |                              |
```

#### Security Measures

1. **HMAC-SHA256 Signature**: Prevent parameter tampering
2. **Domain Whitelist**: Only allow specific return domains
3. **Session Encryption**: AES encryption for payment sessions
4. **Time-Limited Tokens**: 15-minute expiry for payment sessions
5. **CSRF Protection**: State parameter validation
6. **Double Verification**: Both payment signature and callback token

## Environment Configuration

### Required Environment Variables

```env
# Service Configuration
NODE_ENV=production
PORT=3000

# Security Keys
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars
PAYMENT_SESSION_SECRET=your_payment_session_secret_32chars

# WeChat Login (code.ai80.net only)
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://code.ai80.net/auth/wechat/callback

# Google Login (both domains)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI_AI80=https://code.ai80.net/auth/google/callback
GOOGLE_REDIRECT_URI_VILICODE=https://vilicode.com/auth/google/callback

# Payment Configuration
PAYMENT_DOMAIN=https://code.ai80.vip
ALLOWED_RETURN_DOMAINS=code.ai80.net,vilicode.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## API Endpoints

### Authentication Routes

```
GET  /auth/wechat/login          - Initiate WeChat login
GET  /auth/wechat/callback       - WeChat OAuth callback
GET  /auth/google/login          - Initiate Google login
GET  /auth/google/callback       - Google OAuth callback
GET  /auth/me                    - Get current user info
POST /auth/logout                - User logout
```

### Payment Routes

```
POST /api/payment/create         - Create payment order
GET  /payment                    - Payment page (on code.ai80.vip)
POST /payment/notify             - Payment callback (from payment provider)
GET  /payment/callback           - Return to user domain after payment
GET  /api/payment/order/:orderId - Query order status
GET  /api/payment/balance        - Get user balance
```

## Redis Data Structure

### User Authentication
- `user:{userId}` - User profile
- `user:{userId}:wechat_token` - Encrypted WeChat tokens
- `user:{userId}:google_token` - Encrypted Google tokens
- `token:blacklist:{token}` - Logout token blacklist

### Payment
- `payment:session:{sessionId}` - Payment session data (15min TTL)
- `payment:order:{orderId}` - Order records
- `user:{userId}:balance` - User balance/credits
- `user:{userId}:balance_log` - Balance change history

## Deployment

### Nginx Configuration

**code.ai80.net:**
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

**vilicode.com:**
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

**code.ai80.vip (Payment Only):**
```nginx
server {
    listen 443 ssl http2;
    server_name code.ai80.vip;

    ssl_certificate /path/to/code.ai80.vip.crt;
    ssl_certificate_key /path/to/code.ai80.vip.key;

    # Only allow payment routes
    location /payment {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Deny all other requests
    location / {
        return 403;
    }
}
```

## Security Checklist

- [ ] All sensitive data encrypted with AES-256-CBC
- [ ] Payment signatures use HMAC-SHA256
- [ ] CSRF protection with state parameter
- [ ] Domain whitelist enforcement
- [ ] Short-lived payment sessions (15min)
- [ ] HTTPS for all domains
- [ ] Rate limiting on sensitive endpoints
- [ ] Comprehensive audit logging

## Testing Strategy

### Authentication Testing
- WeChat login normal flow
- Google login normal flow
- Cross-domain session persistence
- Token expiration handling

### Payment Testing
- End-to-end payment flow
- Signature verification
- Session expiration handling
- Return URL security validation
- Balance update accuracy

### Security Testing
- CSRF attack prevention
- Signature forgery attempts
- Replay attack protection
- Domain whitelist bypass attempts

## Future Enhancements

1. **Performance**:
   - Redis session caching optimization
   - Connection pooling for database queries
   - CDN integration for static assets

2. **Features**:
   - Additional payment methods (PayPal, Credit Cards)
   - Refund functionality
   - Payment history API
   - Automatic invoice generation

3. **Monitoring**:
   - Payment failure alerts
   - Anomaly detection for suspicious payments
   - Complete payment audit trail

## Implementation Steps

1. Configure environment variables
2. Register new routes in `src/app.js`
3. Configure Nginx reverse proxy
4. Obtain WeChat and Google OAuth credentials
5. Configure SSL certificates for all domains
6. Test authentication and payment flows
7. Deploy with monitoring

---

Document Version: 1.0
Last Updated: 2025-10-16
