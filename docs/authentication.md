# 🔐 CronPulse Authentication Guide

Session-based authentication to protect dashboard access while keeping heartbeat API public.

---

## 🚀 Quick Setup

### 1. Set Admin Password

```bash
npx wrangler secret put ADMIN_PASSWORD
# Enter your secure password when prompted
```

### 2. Deploy

```bash
npm run deploy
```

### 3. Access Dashboard

Visit your worker URL and you'll see the login page:
- Enter the password you set in step 1
- Click "Login"
- You'll be redirected to the dashboard

---

## 🔑 Authentication Features

### ✅ What's Protected

- **Dashboard UI** - Requires login
- **Job Management APIs** - `GET/POST/PUT/DELETE /api/jobs/*`
- **Alert APIs** - `GET /api/alerts`

### ✅ What's Public (No Auth Required)

- **Heartbeat API** - `POST /api/heartbeat/:jobId`
  - ⚡ Your existing cron jobs will continue to work
  - No breaking changes
- **Login page** - `/login`
- **Static assets** - CSS, JS, images

---

## 🔐 Security Details

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-256
- **Iterations**: 100,000
- **Salt**: Random 16-byte salt per password
- **Storage**: Password hash stored as `$pbkdf2$iterations$salt$hash`

### Session Management

- **Storage**: Cloudflare KV
- **Token**: 32-byte cryptographically random token
- **Cookie**: HTTP-only, Secure, SameSite=Strict
- **Expiration**: 7 days (auto-cleanup via KV TTL)

### Cookie Format

```
session_token={token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

## 📖 Usage

### Login

1. Navigate to your dashboard URL
2. If not authenticated, you'll see the login page
3. Enter admin password
4. Session cookie is set (7-day expiration)
5. Redirected to dashboard

### Logout

1. Click "Logout" button in dashboard header
2. Session is deleted from KV
3. Cookie is cleared
4. Redirected to login page

### Session Persistence

- Sessions last 7 days
- Close browser and reopen - still logged in
- After 7 days, need to log in again

---

## 🔧 Configuration

### Change Password

```bash
# Set new password
npx wrangler secret put ADMIN_PASSWORD

# Deploy
npm run deploy
```

Old sessions remain valid until they expire (7 days).

### Session Duration

To change session duration, edit `worker/auth.ts`:

```typescript
// Change from 7 days to desired duration
const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // milliseconds
```

---

## 🛠️ API Reference

### POST /api/auth/login

Authenticate with admin password.

**Request:**
```json
{
  "password": "your_admin_password"
}
```

**Response (Success):**
```json
{
  "success": true
}
```
Sets `session_token` cookie.

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

### POST /api/auth/logout

Invalidate current session.

**Response:**
```json
{
  "success": true
}
```
Clears `session_token` cookie.

### GET /api/auth/me

Check current session status.

**Response (Authenticated):**
```json
{
  "success": true,
  "data": {
    "userId": "admin",
    "expiresAt": "2025-12-09T12:00:00.000Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```
HTTP 401 status.

---

## 🧪 Testing

### Test Login Flow

```bash
# 1. Try accessing dashboard without auth (should show login page)
curl https://your-worker.workers.dev/

# 2. Login via API
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}' \
  -c cookies.txt

# 3. Access protected API with session
curl https://your-worker.workers.dev/api/jobs \
  -b cookies.txt

# 4. Heartbeat API still works without auth
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123
```

### Test in Browser

1. Open dashboard URL
2. Should see login page
3. Enter incorrect password → Error message
4. Enter correct password → Redirect to dashboard
5. Refresh page → Still logged in
6. Click logout → Redirect to login
7. Try accessing `/api/jobs` → 401 Unauthorized

---

## 🚨 Troubleshooting

### Can't log in

**Problem**: "Invalid password" error

**Solutions**:
1. Verify password was set correctly:
   ```bash
   npx wrangler secret list
   # Should show ADMIN_PASSWORD
   ```

2. Re-set password:
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npm run deploy
   ```

### Logged out unexpectedly

**Problem**: Session expired

**Cause**: Sessions expire after 7 days

**Solution**: Log in again

### Heartbeat API returning 401

**Problem**: Heartbeat endpoint requires authentication

**Cause**: URL might be wrong - check it starts with `/api/heartbeat/`

**Solution**: Verify heartbeat URL format:
```
https://your-worker.workers.dev/api/heartbeat/{jobId}
```

---

## 🔒 Security Best Practices

### ✅ Recommended

1. **Use strong password**
   - 16+ characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

2. **Rotate password periodically**
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   ```

3. **Monitor access**
   - Check Cloudflare Analytics
   - Review Worker logs: `npx wrangler tail`

### ⚠️ Limitations

1. **Single user only** - One admin password
2. **No 2FA** - Password only
3. **No rate limiting** - Unlimited login attempts
4. **No IP restrictions** - Accessible worldwide

### 🚧 Future Enhancements

For enhanced security, consider:
- **Cloudflare Access** - Enterprise SSO, 2FA, multi-user
- **Rate limiting** - Prevent brute force
- **IP whitelist** - Restrict by location
- **Audit logs** - Track all authentication events

---

## 🆘 Emergency Access

### Lost Password

If you forget your password:

```bash
# Reset password via Wrangler
npx wrangler secret put ADMIN_PASSWORD
# Enter new password

# Deploy
npm run deploy
```

All existing sessions remain valid for 7 days.

### Disable Authentication

To temporarily disable authentication (not recommended):

1. Comment out auth middleware in `worker/index.ts`
2. Deploy
3. Remember to re-enable later!

---

## 📝 Summary

- ✅ Dashboard protected with password authentication
- ✅ Heartbeat API remains public (no breaking changes)
- ✅ Secure PBKDF2 password hashing
- ✅ 7-day session persistence
- ✅ HTTP-only secure cookies
- ✅ Easy password management via Wrangler secrets

🎉 Your CronPulse dashboard is now secure!
