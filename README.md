# ⚡ CronPulse

> Monitor your cron jobs with heartbeat alerts powered by Cloudflare Workers

**Languages**: English | [简体中文](README.zh.md)


CronPulse is a lightweight, serverless cron job monitoring platform that helps you track your scheduled tasks and get notified when they fail to execute. Built on Cloudflare Workers with React frontend, it provides real-time monitoring with Telegram notifications.

## ✨ Features

- **📊 Real-time Monitoring**: Track all your cron jobs from a single dashboard
- **💓 Heartbeat Detection**: Jobs send heartbeats to confirm execution
- **⚡ Instant Alerts**: Get notified via Telegram when jobs miss their schedule
- **🌍 Edge Deployment**: Runs globally on Cloudflare's edge network
- **📈 History Tracking**: View recent execution history for each job
- **🎨 Modern UI**: Beautiful dark-mode dashboard with real-time updates
- **⚙️ Easy Integration**: Simple HTTP endpoint for any cron job

## 🏗️ Architecture

```
┌─────────────────┐
│   Your Cron Job │
│   curl POST →   │
└─────────────────┘
        ↓
┌─────────────────────────────────┐
│   Cloudflare Worker (Edge API)  │
│   • Receive heartbeats          │
│   • Store in KV                 │
│   • Check for missed beats      │
└─────────────────────────────────┘
        ↓                   ↓
┌─────────────────┐    ┌──────────────┐
│  Cloudflare KV  │    │   Telegram   │
│  (Job Data)     │    │   (Alerts)   │
└─────────────────┘    └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Telegram Bot (for alerts)

### 1. Clone and Install

```bash
git clone https://github.com/zprde/CronPulse.git
cd cron-pulse
npm install
```

### 2. Create KV Namespace

```bash
npx wrangler kv namespace create "CRONPULSE_KV"
npx wrangler kv namespace create "CRONPULSE_KV" --preview
```

Update `wrangler.jsonc` with the generated namespace IDs.

### 3. Set Up Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your chat ID from [@userinfobot](https://t.me/userinfobot)
3. Set secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your bot token

npx wrangler secret put TELEGRAM_CHAT_ID
# Paste your chat ID
```

### 4. Set Up Admin Password

```bash
npx wrangler secret put ADMIN_PASSWORD
# Type your password
``` 

### 5. Deploy

```bash
npm run deploy
```

## 📖 Usage

### Adding a Job

1. Open your deployed CronPulse dashboard
2. Click "+ Add Job"
3. Fill in:
   - **Name**: e.g., "Database Backup"
   - **Expected Interval**: How often it runs (in seconds)
   - **Alert Threshold**: Grace period before alerting (in seconds)

### Integrating with Your Cron Job

After creating a job, you'll get a heartbeat URL. Add this to your cron script:

**Bash Example:**
```bash
#!/bin/bash
# Your job logic
/path/to/backup.sh

# Send heartbeat
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123456
```

**Python Example:**
```python
import requests

# Your job logic
backup_database()

# Send heartbeat
requests.post('https://your-worker.workers.dev/api/heartbeat/job-123456')
```

**Crontab Entry:**
```cron
0 2 * * * /path/to/your/script.sh
```

## 🔧 Development

### Local Development

```bash
# Start dev server (frontend + worker)
npm run dev
```

Visit `http://localhost:5173` for the dashboard.

### Project Structure

```
cron-pulse/
├── worker/               # Cloudflare Worker (backend)
│   ├── index.ts         # Main worker entry
│   ├── types.ts         # TypeScript interfaces
│   ├── storage.ts       # KV storage layer
│   ├── telegram.ts      # Telegram integration
│   └── alertChecker.ts  # Alert logic
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── utils/          # API client & formatters
│   └── App.tsx         # Main app
└── wrangler.jsonc      # Cloudflare config
```

## 📡 API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/jobs` | Create new job |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Get job details |
| `PUT` | `/api/jobs/:id` | Update job |
| `DELETE` | `/api/jobs/:id` | Delete job |
| `POST` | `/api/heartbeat/:id` | Send heartbeat |
| `GET` | `/api/alerts` | Get recent alerts |

### Create Job Request

```json
{
  "name": "Database Backup",
  "description": "Daily backup of production DB",
  "expectedInterval": 86400,
  "alertThreshold": 3600,
  "tags": ["production", "database"]
}
```

## ⚙️ Configuration

### Environment Variables

Set via `npx wrangler secret put <NAME>`:

- `TELEGRAM_BOT_TOKEN` - Telegram bot authentication token
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID for alerts
- `ADMIN_PASSWORD` - Admin password for dashboard access

### Wrangler Config

In `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "MAX_HISTORY_RECORDS": 50  // Max ping history per job
  },
  "triggers": {
    "crons": ["*/5 * * * *"]  // Alert check frequency
  }
}
```

## 🎯 How Alerting Works

1. **Heartbeat**: Your cron job sends a POST request after execution
2. **Tracking**: CronPulse records the timestamp in Cloudflare KV
3. **Monitoring**: Every 5 minutes, a scheduled job checks all jobs
4. **Detection**: If `time_since_last_ping > (expected_interval + threshold)`, an alert is triggered
5. **Notification**: Alert sent via Telegram with job details and severity

### Alert Severity

- **Warning**: 1-2 consecutive misses
- **Critical**: 3+ consecutive misses

## 🛠️ Troubleshooting

**Jobs not showing up?**
- Check browser console for API errors
- Verify KV namespace is bound correctly

**No Telegram alerts?**
- Confirm secrets are set: `npx wrangler secret list`
- Test bot token with [@BotFather](https://t.me/botfather)

**Heartbeat not working?**
- Verify URL is accessible from your cron environment
- Check Worker logs: `npx wrangler tail`

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using:**
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
