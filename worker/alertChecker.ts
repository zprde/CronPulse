import type { JobWithStatus, Alert, JobStatus } from './types';
import { Storage } from './storage';
import { TelegramNotifier } from './telegram';

/**
 * Check all jobs for missed heartbeats and generate alerts
 */
export async function checkForMissedHeartbeats(
    storage: Storage,
    telegramNotifier: TelegramNotifier | null
): Promise<Alert[]> {
    const jobs = await storage.getAllJobsWithStatus();
    const now = Date.now();
    const alerts: Alert[] = [];

    for (const job of jobs) {
        const alert = await checkJob(job, now, storage);
        if (alert) {
            alerts.push(alert);

            // Store alert in KV
            await storage.addAlert(alert);

            // Send Telegram notification
            if (telegramNotifier) {
                await telegramNotifier.sendAlert(alert);
            }
        }
    }

    return alerts;
}

/**
 * Check individual job for missed heartbeat
 */
async function checkJob(
    job: JobWithStatus,
    now: number,
    storage: Storage
): Promise<Alert | null> {
    const { config, status } = job;
    const lastPingTime = new Date(status.lastPingTime).getTime();
    const expectedInterval = config.expectedInterval * 1000; // Convert to ms
    const alertThreshold = config.alertThreshold * 1000; // Convert to ms
    const timeSinceLastPing = now - lastPingTime;
    const allowedDelay = expectedInterval + alertThreshold;

    // Check if heartbeat is overdue
    if (timeSinceLastPing > allowedDelay) {
        const consecutiveMisses = status.consecutiveMisses + 1;
        const severity = consecutiveMisses >= 3 ? 'critical' : 'warning';

        // Update job status
        const updatedStatus: JobStatus = {
            ...status,
            status: severity,
            consecutiveMisses,
        };
        await storage.setJobStatus(updatedStatus);

        // Create alert
        const alert: Alert = {
            id: `${config.id}-${now}`,
            jobId: config.id,
            jobName: config.name,
            timestamp: new Date(now).toISOString(),
            type: 'missed_heartbeat',
            message: `Job "${config.name}" has not sent a heartbeat in ${formatDuration(
                timeSinceLastPing
            )}. Expected interval: ${formatDuration(expectedInterval)}.`,
            severity,
        };

        return alert;
    } else if (status.status !== 'healthy') {
        // Job recovered, reset status
        const updatedStatus: JobStatus = {
            ...status,
            status: 'healthy',
            consecutiveMisses: 0,
        };
        await storage.setJobStatus(updatedStatus);
    }

    return null;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
