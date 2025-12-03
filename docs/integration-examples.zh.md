# CronPulse 集成示例

本文档提供了将您的定时任务与 CronPulse 集成的各种示例。

**语言**: [English](integration-examples.md) | 简体中文

## 目录

- [Bash 脚本](#bash-脚本)
- [Python 脚本](#python-脚本)
- [Node.js 脚本](#nodejs-脚本)
- [Cron 表达式示例](#cron-表达式示例)

## Bash 脚本

### 基础集成

```bash
#!/bin/bash
set -e

# 您的定时任务逻辑
echo "开始备份..."
/usr/local/bin/backup-database.sh
echo "备份完成"

# 向 CronPulse 发送心跳
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123456
```

### 带错误处理

```bash
#!/bin/bash

HEARTBEAT_URL="https://your-worker.workers.dev/api/heartbeat/job-123456"

# 运行您的任务
if /usr/local/bin/backup-database.sh; then
    echo "任务成功 - 发送心跳"
    curl -X POST "$HEARTBEAT_URL"
else
    echo "任务失败 - 跳过心跳"
    exit 1
fi
```

### 带元数据

```bash
#!/bin/bash

HEARTBEAT_URL="https://your-worker.workers.dev/api/heartbeat/job-123456"

# 运行任务并捕获统计信息
START_TIME=$(date +%s)
/usr/local/bin/backup-database.sh
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 发送带元数据的心跳
curl -X POST "$HEARTBEAT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"metadata\": {\"duration\": $DURATION, \"server\": \"$(hostname)\"}}"
```

## Python 脚本

### 基础集成

```python
#!/usr/bin/env python3
import requests

def main():
    # 您的定时任务逻辑
    print("运行数据库备份...")
    backup_database()
    print("备份完成")
    
    # 发送心跳
    heartbeat_url = "https://your-worker.workers.dev/api/heartbeat/job-123456"
    response = requests.post(heartbeat_url)
    response.raise_for_status()

def backup_database():
    # 您的备份逻辑
    pass

if __name__ == "__main__":
    main()
```

### 带错误处理

```python
#!/usr/bin/env python3
import requests
import sys

HEARTBEAT_URL = "https://your-worker.workers.dev/api/heartbeat/job-123456"

def send_heartbeat():
    try:
        response = requests.post(HEARTBEAT_URL, timeout=10)
        response.raise_for_status()
        print("心跳发送成功")
    except requests.RequestException as e:
        print(f"发送心跳失败: {e}", file=sys.stderr)

def main():
    try:
        # 您的任务逻辑
        print("开始任务...")
        run_my_task()
        print("任务成功完成")
        
        # 仅在成功时发送心跳
        send_heartbeat()
        
    except Exception as e:
        print(f"任务失败: {e}", file=sys.stderr)
        sys.exit(1)

def run_my_task():
    # 您的任务逻辑
    pass

if __name__ == "__main__":
    main()
```

### 带元数据

```python
#!/usr/bin/env python3
import requests
import time
import socket
import sys

HEARTBEAT_URL = "https://your-worker.workers.dev/api/heartbeat/job-123456"

def main():
    start_time = time.time()
    
    try:
        # 您的任务逻辑
        run_my_task()
        
        # 计算持续时间
        duration = time.time() - start_time
        
        # 发送带元数据的心跳
        metadata = {
            "duration": round(duration, 2),
            "hostname": socket.gethostname(),
            "status": "success"
        }
        
        requests.post(
            HEARTBEAT_URL,
            json={"metadata": metadata},
            timeout=10
        ).raise_for_status()
        
        print(f"任务在 {duration:.2f}s 内完成")
        
    except Exception as e:
        print(f"任务失败: {e}", file=sys.stderr)
        sys.exit(1)

def run_my_task():
    # 您的任务逻辑
    pass

if __name__ == "__main__":
    main()
```

## Node.js 脚本

### 基础集成

```javascript
#!/usr/bin/env node

const https = require('https');

const HEARTBEAT_URL = 'https://your-worker.workers.dev/api/heartbeat/job-123456';

async function sendHeartbeat() {
  return new Promise((resolve, reject) => {
    const url = new URL(HEARTBEAT_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
    }, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    // 您的任务逻辑
    console.log('运行任务...');
    await runMyTask();
    console.log('任务完成');
    
    // 发送心跳
    await sendHeartbeat();
    console.log('心跳已发送');
    
  } catch (error) {
    console.error('任务失败:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // 您的任务逻辑
}

main();
```

### 使用 Fetch (Node 18+)

```javascript
#!/usr/bin/env node

const HEARTBEAT_URL = 'https://your-worker.workers.dev/api/heartbeat/job-123456';

async function main() {
  try {
    // 您的任务逻辑
    console.log('运行任务...');
    await runMyTask();
    console.log('任务完成');
    
    // 发送心跳
    const response = await fetch(HEARTBEAT_URL, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log('心跳已发送');
    
  } catch (error) {
    console.error('任务失败:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // 您的任务逻辑
}

main();
```

### 带元数据

```javascript
#!/usr/bin/env node

const os = require('os');

const HEARTBEAT_URL = 'https://your-worker.workers.dev/api/heartbeat/job-123456';

async function main() {
  const startTime = Date.now();
  
  try {
    // 您的任务逻辑
    await runMyTask();
    
    const duration = (Date.now() - startTime) / 1000;
    
    // 发送带元数据的心跳
    const response = await fetch(HEARTBEAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: {
          duration,
          hostname: os.hostname(),
          nodeVersion: process.version,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log(`任务在 ${duration.toFixed(2)}s 内完成`);
    
  } catch (error) {
    console.error('任务失败:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // 您的任务逻辑
}

main();
```

## Cron 表达式示例

以下是常见的 cron 计划和相应的 CronPulse `expectedInterval` 值：

| 计划 | Cron 表达式 | 预期间隔（秒） |
|----------|-----------------|-------------------------------|
| 每分钟 | `* * * * *` | 60 |
| 每 5 分钟 | `*/5 * * * *` | 300 |
| 每 15 分钟 | `*/15 * * * *` | 900 |
| 每小时 | `0 * * * *` | 3600 |
| 每 6 小时 | `0 */6 * * *` | 21600 |
| 每天午夜 | `0 0 * * *` | 86400 |
| 每天凌晨 2 点 | `0 2 * * *` | 86400 |
| 每周（周日凌晨 2 点） | `0 2 * * 0` | 604800 |
| 每月（1 号凌晨 2 点） | `0 2 1 * *` | 2592000 |

### 推荐的告警阈值

为了可靠的监控，根据计划设置您的 `alertThreshold`：

- **频繁任务** (< 5 分钟): 60-300 秒（1-5 分钟）
- **每小时任务**: 300-600 秒（5-10 分钟）
- **每日任务**: 1800-3600 秒（30-60 分钟）
- **每周/每月**: 3600-7200 秒（1-2 小时）

## 提示和最佳实践

1. **仅在成功时发送心跳**: 如果任务失败，不要发送心跳
2. **使用超时**: 为心跳请求设置合理的超时时间（5-10 秒）
3. **添加重试逻辑**: 考虑对失败的心跳发送进行重试
4. **包含元数据**: 跟踪持续时间、主机名等以便调试
5. **先测试**: 在添加到 cron 之前手动测试心跳端点
6. **监控日志**: 检查 CronPulse 仪表板是否有错过的心跳

## 测试您的集成

在计划您的定时任务之前：

```bash
# 手动测试您的脚本
./your-script.sh

# 在 CronPulse 仪表板中验证心跳已收到
# 检查"Last Ping"时间戳是否更新

# 使用显式 curl 测试
curl -X POST https://your-worker.workers.dev/api/heartbeat/YOUR_JOB_ID
```
