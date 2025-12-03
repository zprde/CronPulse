# 🔐 CronPulse 身份验证指南

基于会话的身份验证，保护仪表板访问的同时保持心跳 API 公开可用。

**语言**: [English](authentication.md) | 简体中文

---

## 🚀 快速设置

### 1. 设置管理员密码

```bash
npx wrangler secret put ADMIN_PASSWORD
# 在提示时输入您的安全密码
```

### 2. 部署

```bash
npm run deploy
```

### 3. 访问仪表板

访问您的 worker URL，您将看到登录页面：
- 输入您在步骤 1 中设置的密码
- 点击"Login"
- 您将被重定向到仪表板

---

## 🔑 身份验证功能

### ✅ 受保护的内容

- **仪表板 UI** - 需要登录
- **任务管理 APIs** - `GET/POST/PUT/DELETE /api/jobs/*`
- **告警 APIs** - `GET /api/alerts`

### ✅ 公开访问（无需身份验证）

- **心跳 API** - `POST /api/heartbeat/:jobId`
  - ⚡ 您现有的定时任务将继续工作
  - 无破坏性更改
- **登录页面** - `/login`
- **静态资源** - CSS、JS、图片

---

## 🔐 安全详情

### 密码哈希

- **算法**: 使用 SHA-256 的 PBKDF2
- **迭代次数**: 100,000
- **盐**: 每个密码使用随机 16 字节盐
- **存储**: 密码哈希存储为 `$pbkdf2$iterations$salt$hash`

### 会话管理

- **存储**: Cloudflare KV
- **令牌**: 32 字节加密随机令牌
- **Cookie**: HTTP-only、Secure、SameSite=Strict
- **过期时间**: 7 天（通过 KV TTL 自动清理）

### Cookie 格式

```
session_token={token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

## 📖 使用说明

### 登录

1. 导航到您的仪表板 URL
2. 如果未认证，您将看到登录页面
3. 输入管理员密码
4. 设置会话 cookie（7 天过期）
5. 重定向到仪表板

### 注销

1. 在仪表板标题中点击"Logout"按钮
2. 从 KV 中删除会话
3. 清除 cookie
4. 重定向到登录页面

### 会话持久性

- 会话持续 7 天
- 关闭浏览器并重新打开 - 仍然保持登录
- 7 天后，需要重新登录

---

## 🔧 配置

### 更改密码

```bash
# 设置新密码
npx wrangler secret put ADMIN_PASSWORD

# 部署
npm run deploy
```

旧会话在过期前（7 天）仍然有效。

### 会话持续时间

要更改会话持续时间，编辑 `worker/auth.ts`：

```typescript
// 从 7 天更改为所需持续时间
const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 毫秒
```

---

## 🛠️ API 参考

### POST /api/auth/login

使用管理员密码进行身份验证。

**请求：**
```json
{
  "password": "your_admin_password"
}
```

**响应（成功）：**
```json
{
  "success": true
}
```
设置 `session_token` cookie。

**响应（错误）：**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

### POST /api/auth/logout

使当前会话失效。

**响应：**
```json
{
  "success": true
}
```
清除 `session_token` cookie。

### GET /api/auth/me

检查当前会话状态。

**响应（已认证）：**
```json
{
  "success": true,
  "data": {
    "userId": "admin",
    "expiresAt": "2025-12-09T12:00:00.000Z"
  }
}
```

**响应（未认证）：**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```
HTTP 401 状态。

---

## 🧪 测试

### 测试登录流程

```bash
# 1. 尝试不带身份验证访问仪表板（应显示登录页面）
curl https://your-worker.workers.dev/

# 2. 通过 API 登录
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}' \
  -c cookies.txt

# 3. 使用会话访问受保护的 API
curl https://your-worker.workers.dev/api/jobs \
  -b cookies.txt

# 4. 心跳 API 在没有身份验证的情况下仍然工作
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123
```

### 在浏览器中测试

1. 打开仪表板 URL
2. 应该看到登录页面
3. 输入错误密码 → 错误消息
4. 输入正确密码 → 重定向到仪表板
5. 刷新页面 → 仍然保持登录
6. 点击注销 → 重定向到登录
7. 尝试访问 `/api/jobs` → 401 未授权

---

## 🚨 故障排除

### 无法登录

**问题**: "Invalid password" 错误

**解决方案**:
1. 验证密码是否正确设置：
   ```bash
   npx wrangler secret list
   # 应该显示 ADMIN_PASSWORD
   ```

2. 重新设置密码：
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npm run deploy
   ```

### 意外注销

**问题**: 会话过期

**原因**: 会话在 7 天后过期

**解决方案**: 重新登录

### 心跳 API 返回 401

**问题**: 心跳端点需要身份验证

**原因**: URL 可能错误 - 检查它是否以 `/api/heartbeat/` 开头

**解决方案**: 验证心跳 URL 格式：
```
https://your-worker.workers.dev/api/heartbeat/{jobId}
```

---

## 🔒 安全最佳实践

### ✅ 推荐做法

1. **使用强密码**
   - 16+ 个字符
   - 字母、数字、符号混合
   - 不要重复使用密码

2. **定期轮换密码**
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   ```

3. **监控访问**
   - 检查 Cloudflare Analytics
   - 查看 Worker 日志：`npx wrangler tail`

### ⚠️ 限制

1. **仅支持单用户** - 一个管理员密码
2. **无 2FA** - 仅密码
3. **无速率限制** - 无限登录尝试
4. **无 IP 限制** - 全球可访问

### 🚧 未来增强

为了增强安全性，考虑：
- **Cloudflare Access** - 企业级 SSO、2FA、多用户
- **速率限制** - 防止暴力破解
- **IP 白名单** - 按位置限制
- **审计日志** - 跟踪所有身份验证事件

---

## 🆘 紧急访问

### 忘记密码

如果您忘记了密码：

```bash
# 通过 Wrangler 重置密码
npx wrangler secret put ADMIN_PASSWORD
# 输入新密码

# 部署
npm run deploy
```

所有现有会话在 7 天内仍然有效。

### 禁用身份验证

暂时禁用身份验证（不推荐）：

1. 在 `worker/index.ts` 中注释掉身份验证中间件
2. 部署
3. 记得稍后重新启用！

---

## 📝 总结

- ✅ 仪表板通过密码身份验证保护
- ✅ 心跳 API 保持公开（无破坏性更改）
- ✅ 安全的 PBKDF2 密码哈希
- ✅ 7 天会话持久性
- ✅ HTTP-only 安全 cookies
- ✅ 通过 Wrangler secrets 轻松管理密码

🎉 您的 CronPulse 仪表板现在是安全的！
