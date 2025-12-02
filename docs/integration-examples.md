# Integration Examples for CronPulse

This document provides various examples of integrating your cron jobs with CronPulse.

## Table of Contents

- [Bash Scripts](#bash-scripts)
- [Python Scripts](#python-scripts)
- [Node.js Scripts](#nodejs-scripts)
- [Cron Expression Examples](#cron-expression-examples)

## Bash Scripts

### Basic Integration

```bash
#!/bin/bash
set -e

# Your cron job logic
echo "Starting backup..."
/usr/local/bin/backup-database.sh
echo "Backup completed"

# Send heartbeat to CronPulse
curl -X POST https://your-worker.workers.dev/api/heartbeat/job-123456
```

### With Error Handling

```bash
#!/bin/bash

HEARTBEAT_URL="https://your-worker.workers.dev/api/heartbeat/job-123456"

# Run your job
if /usr/local/bin/backup-database.sh; then
    echo "Job succeeded - sending heartbeat"
    curl -X POST "$HEARTBEAT_URL"
else
    echo "Job failed - skipping heartbeat"
    exit 1
fi
```

### With Metadata

```bash
#!/bin/bash

HEARTBEAT_URL="https://your-worker.workers.dev/api/heartbeat/job-123456"

# Run job and capture stats
START_TIME=$(date +%s)
/usr/local/bin/backup-database.sh
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Send heartbeat with metadata
curl -X POST "$HEARTBEAT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"metadata\": {\"duration\": $DURATION, \"server\": \"$(hostname)\"}}"
```

## Python Scripts

### Basic Integration

```python
#!/usr/bin/env python3
import requests

def main():
    # Your cron job logic
    print("Running database backup...")
    backup_database()
    print("Backup completed")
    
    # Send heartbeat
    heartbeat_url = "https://your-worker.workers.dev/api/heartbeat/job-123456"
    response = requests.post(heartbeat_url)
    response.raise_for_status()

def backup_database():
    # Your backup logic here
    pass

if __name__ == "__main__":
    main()
```

### With Error Handling

```python
#!/usr/bin/env python3
import requests
import sys

HEARTBEAT_URL = "https://your-worker.workers.dev/api/heartbeat/job-123456"

def send_heartbeat():
    try:
        response = requests.post(HEARTBEAT_URL, timeout=10)
        response.raise_for_status()
        print("Heartbeat sent successfully")
    except requests.RequestException as e:
        print(f"Failed to send heartbeat: {e}", file=sys.stderr)

def main():
    try:
        # Your job logic
        print("Starting job...")
        run_my_task()
        print("Job completed successfully")
        
        # Send heartbeat only on success
        send_heartbeat()
        
    except Exception as e:
        print(f"Job failed: {e}", file=sys.stderr)
        sys.exit(1)

def run_my_task():
    # Your task logic here
    pass

if __name__ == "__main__":
    main()
```

### With Metadata

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
        # Your job logic
        run_my_task()
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Send heartbeat with metadata
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
        
        print(f"Job completed in {duration:.2f}s")
        
    except Exception as e:
        print(f"Job failed: {e}", file=sys.stderr)
        sys.exit(1)

def run_my_task():
    # Your task logic here
    pass

if __name__ == "__main__":
    main()
```

## Node.js Scripts

### Basic Integration

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
    // Your job logic
    console.log('Running job...');
    await runMyTask();
    console.log('Job completed');
    
    // Send heartbeat
    await sendHeartbeat();
    console.log('Heartbeat sent');
    
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // Your task logic here
}

main();
```

### Using Fetch (Node 18+)

```javascript
#!/usr/bin/env node

const HEARTBEAT_URL = 'https://your-worker.workers.dev/api/heartbeat/job-123456';

async function main() {
  try {
    // Your job logic
    console.log('Running job...');
    await runMyTask();
    console.log('Job completed');
    
    // Send heartbeat
    const response = await fetch(HEARTBEAT_URL, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log('Heartbeat sent');
    
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // Your task logic here
}

main();
```

### With Metadata

```javascript
#!/usr/bin/env node

const os = require('os');

const HEARTBEAT_URL = 'https://your-worker.workers.dev/api/heartbeat/job-123456';

async function main() {
  const startTime = Date.now();
  
  try {
    // Your job logic
    await runMyTask();
    
    const duration = (Date.now() - startTime) / 1000;
    
    // Send heartbeat with metadata
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
    
    console.log(`Job completed in ${duration.toFixed(2)}s`);
    
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

async function runMyTask() {
  // Your task logic here
}

main();
```

## Cron Expression Examples

Here are common cron schedules and corresponding CronPulse `expectedInterval` values:

| Schedule | Cron Expression | Expected Interval (seconds) |
|----------|-----------------|----------------------------|
| Every minute | `* * * * *` | 60 |
| Every 5 minutes | `*/5 * * * *` | 300 |
| Every 15 minutes | `*/15 * * * *` | 900 |
| Every hour | `0 * * * *` | 3600 |
| Every 6 hours | `0 */6 * * *` | 21600 |
| Daily at midnight | `0 0 * * *` | 86400 |
| Daily at 2 AM | `0 2 * * *` | 86400 |
| Weekly (Sunday 2 AM) | `0 2 * * 0` | 604800 |
| Monthly (1st, 2 AM) | `0 2 1 * *` | 2592000 |

### Recommended Alert Thresholds

For reliable monitoring, set your `alertThreshold` based on schedule:

- **Frequent jobs** (< 5 min): 60-300 seconds (1-5 minutes)
- **Hourly jobs**: 300-600 seconds (5-10 minutes)
- **Daily jobs**: 1800-3600 seconds (30-60 minutes)
- **Weekly/Monthly**: 3600-7200 seconds (1-2 hours)

## Tips & Best Practices

1. **Send heartbeat only on success**: Don't send heartbeat if your job fails
2. **Use timeouts**: Set reasonable timeouts for the heartbeat request (5-10 seconds)
3. **Add retry logic**: Consider retrying failed heartbeat sends
4. **Include metadata**: Track duration, hostname, etc. for debugging
5. **Test first**: Manually test heartbeat endpoint before adding to cron
6. **Monitor logs**: Check CronPulse dashboard for missed heartbeats

## Testing Your Integration

Before scheduling your cron job:

```bash
# Test your script manually
./your-script.sh

# Verify heartbeat was received in CronPulse dashboard
# Check "Last Ping" timestamp updated

# Test with explicit curl
curl -X POST https://your-worker.workers.dev/api/heartbeat/YOUR_JOB_ID
```
