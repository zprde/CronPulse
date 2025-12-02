import type {
    Env,
    JobConfig,
    JobStatus,
    PingRecord,
    Alert,
    JobWithStatus,
} from './types';
import { KV_KEYS } from './types';

/**
 * Storage layer for KV operations
 */
export class Storage {
    private kv: KVNamespace;
    private maxHistoryRecords: number;

    constructor(kv: KVNamespace, maxHistoryRecords: number) {
        this.kv = kv;
        this.maxHistoryRecords = maxHistoryRecords;
    }

    // Job index operations
    async getJobIds(): Promise<string[]> {
        const ids = await this.kv.get<string[]>(KV_KEYS.jobsIndex(), 'json');
        return ids || [];
    }

    async addJobId(jobId: string): Promise<void> {
        const ids = await this.getJobIds();
        if (!ids.includes(jobId)) {
            ids.push(jobId);
            await this.kv.put(KV_KEYS.jobsIndex(), JSON.stringify(ids));
        }
    }

    async removeJobId(jobId: string): Promise<void> {
        const ids = await this.getJobIds();
        const filtered = ids.filter((id) => id !== jobId);
        await this.kv.put(KV_KEYS.jobsIndex(), JSON.stringify(filtered));
    }

    // Job config operations
    async getJobConfig(jobId: string): Promise<JobConfig | null> {
        return await this.kv.get<JobConfig>(KV_KEYS.jobConfig(jobId), 'json');
    }

    async setJobConfig(config: JobConfig): Promise<void> {
        await this.kv.put(KV_KEYS.jobConfig(config.id), JSON.stringify(config));
        await this.addJobId(config.id);
    }

    async deleteJobConfig(jobId: string): Promise<void> {
        await this.kv.delete(KV_KEYS.jobConfig(jobId));
        await this.removeJobId(jobId);
    }

    // Job status operations
    async getJobStatus(jobId: string): Promise<JobStatus | null> {
        return await this.kv.get<JobStatus>(KV_KEYS.jobStatus(jobId), 'json');
    }

    async setJobStatus(status: JobStatus): Promise<void> {
        await this.kv.put(KV_KEYS.jobStatus(status.jobId), JSON.stringify(status));
    }

    async deleteJobStatus(jobId: string): Promise<void> {
        await this.kv.delete(KV_KEYS.jobStatus(jobId));
    }

    // Job history operations (limited records)
    async getJobHistory(jobId: string): Promise<PingRecord[]> {
        const history = await this.kv.get<PingRecord[]>(
            KV_KEYS.jobHistory(jobId),
            'json'
        );
        return history || [];
    }

    async addPingRecord(jobId: string, record: PingRecord): Promise<void> {
        const history = await this.getJobHistory(jobId);
        history.unshift(record); // Add to beginning

        // Keep only the most recent records
        if (history.length > this.maxHistoryRecords) {
            history.splice(this.maxHistoryRecords);
        }

        await this.kv.put(KV_KEYS.jobHistory(jobId), JSON.stringify(history));
    }

    async deleteJobHistory(jobId: string): Promise<void> {
        await this.kv.delete(KV_KEYS.jobHistory(jobId));
    }

    // Get job with status and history
    async getJobWithStatus(jobId: string): Promise<JobWithStatus | null> {
        const [config, status, history] = await Promise.all([
            this.getJobConfig(jobId),
            this.getJobStatus(jobId),
            this.getJobHistory(jobId),
        ]);

        if (!config || !status) {
            return null;
        }

        return {
            config,
            status,
            recentHistory: history.slice(0, 20), // Return last 20 records
        };
    }

    // Get all jobs with status
    async getAllJobsWithStatus(): Promise<JobWithStatus[]> {
        const jobIds = await this.getJobIds();
        const jobs = await Promise.all(
            jobIds.map((id) => this.getJobWithStatus(id))
        );
        return jobs.filter((job): job is JobWithStatus => job !== null);
    }

    // Alert operations
    async getAlerts(limit: number = 50): Promise<Alert[]> {
        const alertIds = await this.kv.get<string[]>(KV_KEYS.alertsIndex(), 'json');
        if (!alertIds || alertIds.length === 0) {
            return [];
        }

        const alertPromises = alertIds
            .slice(0, limit)
            .map((id) => this.kv.get<Alert>(KV_KEYS.alert(id), 'json'));

        const alerts = await Promise.all(alertPromises);
        return alerts.filter((alert): alert is Alert => alert !== null);
    }

    async addAlert(alert: Alert): Promise<void> {
        // Store the alert
        await this.kv.put(KV_KEYS.alert(alert.id), JSON.stringify(alert));

        // Add to index
        const alertIds = (await this.kv.get<string[]>(KV_KEYS.alertsIndex(), 'json')) || [];
        alertIds.unshift(alert.id);

        // Keep only recent alerts (limit to 100)
        if (alertIds.length > 100) {
            const removedIds = alertIds.splice(100);
            // Delete old alerts
            await Promise.all(removedIds.map((id) => this.kv.delete(KV_KEYS.alert(id))));
        }

        await this.kv.put(KV_KEYS.alertsIndex(), JSON.stringify(alertIds));
    }

    // Delete all data for a job
    async deleteJob(jobId: string): Promise<void> {
        await Promise.all([
            this.deleteJobConfig(jobId),
            this.deleteJobStatus(jobId),
            this.deleteJobHistory(jobId),
        ]);
    }
}

export function createStorage(env: Env): Storage {
    return new Storage(env.CRONPULSE_KV, env.MAX_HISTORY_RECORDS);
}
