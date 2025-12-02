// Environment bindings
export interface Env {
    CRONPULSE_KV: KVNamespace;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    MAX_HISTORY_RECORDS: number;
}

// Job configuration stored in KV
export interface JobConfig {
    id: string;
    name: string;
    description?: string;
    expectedInterval: number; // in seconds
    alertThreshold: number; // grace period in seconds
    createdAt: string;
    updatedAt: string;
    tags?: string[];
}

// Job status tracking
export interface JobStatus {
    jobId: string;
    lastPingTime: string;
    status: 'healthy' | 'warning' | 'critical';
    consecutiveMisses: number;
    totalPings: number;
}

// Historical ping record
export interface PingRecord {
    timestamp: string;
    status: 'success';
    metadata?: Record<string, unknown>;
}

// Alert record
export interface Alert {
    id: string;
    jobId: string;
    jobName: string;
    timestamp: string;
    type: 'missed_heartbeat';
    message: string;
    severity: 'warning' | 'critical';
}

// API request types
export interface CreateJobRequest {
    name: string;
    description?: string;
    expectedInterval: number;
    alertThreshold?: number;
    tags?: string[];
}

export interface UpdateJobRequest {
    name?: string;
    description?: string;
    expectedInterval?: number;
    alertThreshold?: number;
    tags?: string[];
}

export interface HeartbeatRequest {
    metadata?: Record<string, unknown>;
}

// API response types
export interface JobWithStatus {
    config: JobConfig;
    status: JobStatus;
    recentHistory?: PingRecord[];
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// KV key patterns
export const KV_KEYS = {
    jobsIndex: () => 'jobs:index',
    jobConfig: (jobId: string) => `job:${jobId}:config`,
    jobStatus: (jobId: string) => `job:${jobId}:status`,
    jobHistory: (jobId: string) => `job:${jobId}:history`,
    alertsIndex: () => 'alerts:index',
    alert: (alertId: string) => `alert:${alertId}`,
} as const;
