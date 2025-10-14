# Google Login Integration Blueprint

## Context Overview
- **Backend**: Express application (`src/app.js`) with modular routes, Redis persistence (`src/models/redis.js`), and service-oriented abstractions under `src/services/` for Anthropic, OpenAI, Gemini, and user management.
- **Authentication Today**: Admin login via static credentials (`/web/auth/login`), user login via LDAP (`/users/login`) with Redis session tokens, and dormant Clerk OAuth scaffolding (`src/services/clerkService.js`, helper methods in `userService`).
- **Frontend**: Vue 3 SPA served from `/admin-next`, using Pinia stores (`web/admin-spa/src/stores`) and axios. User store persists session tokens in localStorage and attaches them to subsequent requests.

## Current Authentication Architecture
### Backend
- LDAP login handler in `src/routes/userRoutes.js` depends on `ldapService` and issues Redis-backed session tokens through `userService.createUserSession`.
- Session validation middleware (`authenticateUser`, `authenticateUserOrAdmin`) expects Redis session keys or JWT tokens produced by `userService`.
- Admin login path manages credentials from `data/init.json` and stores sessions with `redis.setSession`.
- `clerkService` offers token verification, user provisioning, and session storage helpers but lacks routed entry points and feature toggles.

### Frontend
- `web/admin-spa/src/views/UserLoginView.vue` (traditional login) posts to `/users/login` and stores `sessionToken` in Pinia.
- Clerk-specific views referenced in docs (`UserLoginSocialView.vue`, `SSOCallbackView.vue`) are not present in the current tree; the SPA boots without Clerk bindings.
- Global axios configuration in `web/admin-spa/src/stores/user.js` injects `x-user-token` for authenticated calls.

### Data & Sessions
- Users stored in Redis (`user:` prefix) include `provider`, `clerkUserId`, and usage counters, enabling coexistence of LDAP and third-party identities.
- `userService` exposes helpers to create/update provider-specific users and invalidate sessions.
- Redis stores per-session keys `user_session:<token>` with expiration derived from `config.userManagement.userSessionTimeout`.

## Integration Options Evaluated
| Option | Summary | Advantages | Drawbacks | Assessment |
| --- | --- | --- | --- | --- |
| **Revive Clerk SaaS Flow** | Rehydrate Clerk Vue store, backend webhooks, and env plumbing. | Rich hosted flows, multi-provider support. | Missing SPA components, additional SaaS dependency, production configuration overhead. | **High effort / indirect** |
| **Passport.js (`passport-google-oauth20`)** | Introduce Passport middleware with Google strategy and Express sessions. | Mature ecosystem, handles OAuth exchange automatically. | Requires Express session management, diverges from Redis token approach, adds middleware complexity. | **Medium effort / misaligned** |
| **Google Identity Services (GIS) + ID Token Verification** | Use Google GIS front-end (button or One Tap) to obtain ID tokens, verify on backend with `google-auth-library`. | Aligns with existing token issuance, minimal new dependencies, retains Redis sessions, flexible UI integration. | Requires custom UI wiring and backend service to verify tokens and map users. | **Best fit** |

## Recommended Strategy: Google Identity Services + Backend Token Verification

### Why It Fits This Project
- Reuses Redis session model and `userService` helpers, minimizing architectural change.
- Keeps control of user provisioning and audit logs entirely within the existing backend.
- Works for SPA + API separation (GIS runs in browser, backend validates tokens, issues local session).
- Avoids adding full OAuth callback routes or Express session middleware.

### High-Level Auth Flow
1. Frontend renders a Google One Tap or Sign-In button using `window.google.accounts.id` with the configured `GOOGLE_CLIENT_ID`.
2. Upon successful Google authentication, the frontend receives a credential (ID token) and POSTs it to `/users/oauth/google`.
3. Backend verifies the ID token using `OAuth2Client`, confirming audience, issuer, signature, email verification, and nonce/state if provided.
4. Backend looks up existing user by `googleSub` (token `sub`) or email; creates/updates user via `userService` with `provider = 'google'` when needed.
5. Backend issues a Redis session token via `userService.createUserSession` and returns it alongside user metadata.
6. Frontend persists session token in Pinia/localStorage (same as LDAP flow) and navigates to authenticated routes.

## Implementation Plan

### 1. Configuration & Secrets
- **Environment Variables**: Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (only required for future server-to-server usage), `GOOGLE_OAUTH_ALLOWED_DOMAINS` (optional CSV), and `GOOGLE_OAUTH_ENABLE` flag.
- **Config Update**: Extend `config/config.js` with a `googleAuth` section (enable flag, client ID, allowed hosted domains, timeout) sourced from env.
- **Documentation**: Update `.env.example` and `config/config.example.js` with new keys and guidance.
- **Deployment**: Register OAuth consent screen + approved JavaScript origins/redirect URIs within Google Cloud Console. For GIS button usage, ensure the domain is authorized.

### 2. Backend Enhancements
1. **Service Module** (`src/services/googleAuthService.js`):
   - Initialize `OAuth2Client` with `GOOGLE_CLIENT_ID`.
   - Expose `verifyIdToken(idToken, nonce?)` returning payload or throwing categorized errors (invalid audience, expired token, unverified email, blocked domain).
   - Provide `mapGoogleProfile(payload)` to normalize fields (`sub`, `email`, `name`, `given_name`, `family_name`, `picture`).
2. **User Provisioning**:
   - Add `userService.getUserByGoogleSub(sub)` and extend existing `createOrUpdateUser` to accept `googleSub`, `provider = 'google'`, and set `lastLoginAt`.
   - Ensure uniqueness constraints: `googleSub` and email cannot belong to multiple providers (surface actionable error to client).
3. **Route Handler** (`src/routes/userRoutes.js`):
   - Introduce `POST /users/oauth/google` behind rate limiting and optional reCAPTCHA/nonce validation.
   - Steps: validate payload (`credential`, `clientNonce`), verify token via service, enforce `email_verified`, filter by allowed domain list, create/update user, issue session token (same TTL as LDAP), respond with user data + token.
   - Log security events (`logger.security`) for suspicious attempts and attach structured metadata for observability.
4. **Middleware**:
   - No changes required to `authenticateUser`; tokens produced via Redis remain compatible.
   - Optionally add nonce storage in Redis to block replay (`setex oauth_nonce:<value>` upon login attempt).
5. **Rate Limiting & Auditing**:
   - Reuse `initRateLimiters` (IP-based) or introduce dedicated limiter (`google_oauth_ip`) to prevent abuse.
   - Emit metrics via existing logging/Redis for successful/failed Google logins.

### 3. Frontend Updates
1. **Dependencies**: Load GIS script dynamically (`https://accounts.google.com/gsi/client`) in `web/admin-spa/src/main.js` or within the login view. No npm package required.
2. **UI**: Create/restore a social login view (`UserLoginSocialView.vue`) or extend existing login page with a Google Sign-In button. Provide fallback to LDAP login when disabled.
3. **Pinia Store**:
   - Add `loginWithGoogle(credential)` action calling `/users/oauth/google` and reusing `setAuthHeader`, `localStorage` persistence logic.
   - Track loading/error states for social login separately for user feedback.
4. **Routing**: Optionally add route guard or feature toggle to hide Google button when `GOOGLE_OAUTH_ENABLE` is false (fetch from `GET /users/config` or embed in SPA build env).
5. **UX & Messaging**: Provide clear copy explaining corporate restrictions if `GOOGLE_OAUTH_ALLOWED_DOMAINS` is configured.

### 4. Session & User Model Considerations
- Extend stored user object with `googleSub`, `avatar`, `provider = 'google'`, and optionally `oauthProviders = ['google']` for future extensibility.
- When LDAP users attempt Google login with same email, decide policy: either merge (preferred with explicit consent) or block with instruction to contact admin. Document behaviour in response payload.
- Ensure `userService.updateUser` preserves provider and third-party IDs.

## Security Considerations
- **Audience & Issuer Validation**: Reject tokens whose `aud` does not match `GOOGLE_CLIENT_ID` or whose `iss` is not `https://accounts.google.com` or `accounts.google.com`.
- **Email Verification**: Require `email_verified === true`; optionally enforce domain allowlist.
- **Nonce / State**: For button flows, use GIS `nonce` support; store nonce server-side to mitigate replay.
- **HTTPS**: Serve both GIS frontend and backend endpoints over HTTPS in production; disable Google login if TLS is absent.
- **Token Handling**: Do not persist Google ID tokens; process in-memory and discard. Log only anonymized identifiers (`sub` truncated) to avoid leaking PII.
- **Rate Limiting & Abuse Detection**: Monitor failed verification attempts and throttle IPs accordingly.
- **Session Security**: Keep existing Redis TTLs; consider shorter lifetimes for OAuth sessions if organisational policy requires.

## Rollout Strategy
1. **Phase 1 – Development**: Implement feature behind `GOOGLE_OAUTH_ENABLE`; test with Google test users and staging Redis.
2. **Phase 2 – Internal Pilot**: Enable for a small set of domains or users; monitor logs for token verification failures and latency.
3. **Phase 3 – General Availability**: Update admin documentation, notify users, and optionally disable LDAP once adoption is confirmed.
4. **Fallback Plan**: Maintain LDAP login as backup during rollout; provide admin toggle to revert quickly by flipping the enable flag.

## Testing Plan
- **Unit Tests**: Mock `OAuth2Client.verifyIdToken` to cover success, invalid audience, expired token, unverified email, and blocked domain scenarios.
- **Integration Tests**: Use Jest + Supertest to hit `/users/oauth/google` with signed tokens from `google-auth-library` test utilities or manually crafted JWTs using Google public keys.
- **Frontend Tests**: Add component tests ensuring Google button triggers credential handler; optionally integrate Playwright to cover full login flow with mocked backend.
- **Smoke Tests**: Verify coexistence of LDAP login and Google login, including concurrent sessions and logout behaviour.

## Operational Monitoring
- Log structured events for login success/failure with outcome codes (`google_login_success`, `google_login_invalid_audience`, etc.).
- Track Redis key counts for `user_session:*` per provider to monitor adoption.
- Set up alerts on sustained verification failures (>N per minute) signaling misconfiguration or abuse.
- Document support runbook for rotating Google credentials and revoking compromised OAuth clients.

## Appendix
### Environment Variable Reference
| Variable | Description | Example |
| --- | --- | --- |
| `GOOGLE_OAUTH_ENABLE` | Feature toggle for Google login. | `true` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID issued by Google. | `123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | (Optional) Secret for future server-side token exchanges. | `supersecret` |
| `GOOGLE_OAUTH_ALLOWED_DOMAINS` | Comma-separated list of permitted Google Workspace domains. | `example.com,example.org` |
| `GOOGLE_OAUTH_NONCE_TTL` | (Optional) Seconds to keep nonce entries in Redis. | `300` |

### Reference Links
- Google Identity Services documentation: <https://developers.google.com/identity/gsi/web>
- Token verification guide: <https://developers.google.com/identity/gsi/web/guides/verify-google-id-token>
- Existing `google-auth-library` usage example in repo: `src/services/geminiAccountService.js`.

