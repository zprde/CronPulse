# ⚡ CronPulse

> 通过 Cloudflare Workers 提供心跳告警功能，监控您的定时任务

**语言**: [English](README.md) | 简体中文

CronPulse 是一个轻量级、无服务器的定时任务监控平台，帮助您跟踪计划任务并在任务执行失败时获得通知。基于 Cloudflare Workers 和 React 前端构建，提供实时监控和 Telegram 通知功能。

## ✨ 功能特性

- **📊 实时监控**: 从单一仪表板跟踪所有定时任务
- **💓 心跳检测**: 任务发送心跳以确认执行
- **⚡ 即时告警**: 当任务错过计划执行时通过 Telegram 获得通知
- **🌍 边缘部署**: 在 Cloudflare 的全球边缘网络上运行
- **📈 历史记录**: 查看每个任务的最近执行历史
- **🎨 现代化界面**: 具有实时更新的精美暗色主题仪表板
- **⚙️ 易于集成**: 为任何定时任务提供简单的 HTTP 端点

## 🏗️ 架构

```
┌─────────────────┐
│   您的定时任务   │
│   curl POST →   │
└─────────────────┘
        ↓
┌─────────────────────────────────┐
│   Cloudflare Worker (边缘 API)  │
│   • 接收心跳                     │
│   • 存储到 KV                    │
│   • 检查错过的心跳               │
└─────────────────────────────────┘
        ↓                   ↓
┌─────────────────┐    ┌──────────────┐
│  Cloudflare KV  │    │   Telegram   │
│  (任务数据)      │    │   (告警)     │
└─────────────────┘    └──────────────┘
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm
- Cloudflare 账户
- Telegram 机器人（用于告警）

### 1. 克隆并安装

```bash
git clone <your-repo>
cd cron-pulse
npm install
```

### 2. 创建 KV 命名空间

```bash
npx wrangler kv namespace create "CRONPULSE_KV"
npx wrangler kv namespace create "CRONPULSE_KV" --preview
```

使用生成的命名空间 ID 更新 `wrangler.jsonc`。

### 3. 设置 Telegram 机器人

1. 通过 [@BotFather](https://t.me/botfather) 创建机器人
2. 从 [@userinfobot](https://t.me/userinfobot) 获取您的聊天 ID
3. 设置密钥：

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# 粘贴您的机器人令牌

npx wrangler secret put TELEGRAM_CHAT_ID
# 粘贴您的聊天 ID
```

### 4. 部署

```bash
npm run deploy
```

## 📖 使用说明

### 添加任务

1. 打开您已部署的 CronPulse 仪表板
2. 点击 "+ Add Job"
3. 填写：
   - **Name**: 例如 "数据库备份"
   - **Expected Interval**: 运行频率（以秒为单位）
   - **Alert Threshold**: 告警前的宽限期（以秒为单位）

### 集成到您的定时任务

创建任务后，您将获得一个心跳 URL。将其添加到您的定时脚本中：

**Bash 示例：**
```bash
#!/bin/bash
# 您的任务逻辑
/path/to/backup.sh

# 发送心跳
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123456
```

**Python 示例：**
```python
import requests

# 您的任务逻辑
backup_database()

# 发送心跳
requests.post('https://your-worker.workers.dev/api/heartbeat/job-123456')
```

**Crontab 条目：**
```cron
0 2 * * * /path/to/your/script.sh
```

## 🔧 开发

### 本地开发

```bash
# 启动开发服务器（前端 + worker）
npm run dev
```

访问 `http://localhost:5173` 查看仪表板。

### 项目结构

```
cron-pulse/
├── worker/               # Cloudflare Worker (后端)
│   ├── index.ts         # Worker 主入口
│   ├── types.ts         # TypeScript 接口
│   ├── storage.ts       # KV 存储层
│   ├── telegram.ts      # Telegram 集成
│   └── alertChecker.ts  # 告警逻辑
├── src/                 # React 前端
│   ├── components/      # UI 组件
│   ├── utils/          # API 客户端和格式化工具
│   └── App.tsx         # 主应用
└── wrangler.jsonc      # Cloudflare 配置
```

## 📡 API 参考

### 端点

| 方法 | 路径 | 描述 |
|--------|------|------|
| `POST` | `/api/jobs` | 创建新任务 |
| `GET` | `/api/jobs` | 列出所有任务 |
| `GET` | `/api/jobs/:id` | 获取任务详情 |
| `PUT` | `/api/jobs/:id` | 更新任务 |
| `DELETE` | `/api/jobs/:id` | 删除任务 |
| `POST` | `/api/heartbeat/:id` | 发送心跳 |
| `GET` | `/api/alerts` | 获取最近的告警 |

### 创建任务请求

```json
{
  "name": "数据库备份",
  "description": "生产环境数据库的每日备份",
  "expectedInterval": 86400,
  "alertThreshold": 3600,
  "tags": ["production", "database"]
}
```

## ⚙️ 配置

### 环境变量

通过 `npx wrangler secret put <NAME>` 设置：

- `TELEGRAM_BOT_TOKEN` - Telegram 机器人认证令牌
- `TELEGRAM_CHAT_ID` - 用于告警的 Telegram 聊天 ID

### Wrangler 配置

在 `wrangler.jsonc` 中：

```jsonc
{
  "vars": {
    "MAX_HISTORY_RECORDS": 50  // 每个任务的最大心跳历史记录
  },
  "triggers": {
    "crons": ["*/5 * * * *"]  // 告警检查频率
  }
}
```

## 🎯 告警机制

1. **心跳**: 您的定时任务在执行后发送 POST 请求
2. **跟踪**: CronPulse 在 Cloudflare KV 中记录时间戳
3. **监控**: 每 5 分钟，一个计划任务检查所有任务
4. **检测**: 如果 `距上次心跳时间 > (预期间隔 + 阈值)`，则触发告警
5. **通知**: 通过 Telegram 发送告警，包含任务详情和严重程度

### 告警严重程度

- **警告**: 连续错过 1-2 次
- **严重**: 连续错过 3 次以上

## 🛠️ 故障排除

**任务未显示？**
- 检查浏览器控制台的 API 错误
- 验证 KV 命名空间是否正确绑定

**没有收到 Telegram 告警？**
- 确认密钥已设置：`npx wrangler secret list`
- 使用 [@BotFather](https://t.me/botfather) 测试机器人令牌

**心跳不工作？**
- 验证 URL 在您的定时任务环境中可访问
- 检查 Worker 日志：`npx wrangler tail`

## 📝 许可证

MIT

## 🤝 贡献

欢迎贡献！请打开 issue 或 PR。

---

**使用以下技术构建 ❤️：**
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
