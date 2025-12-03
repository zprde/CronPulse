// API Types (matching backend)
export interface JobConfig {
    id: string;
    name: string;
    description?: string;
    expectedInterval: number;
    alertThreshold: number;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
}

export interface JobStatus {
    jobId: string;
    lastPingTime: string;
    status: 'healthy' | 'warning' | 'critical';
    consecutiveMisses: number;
    totalPings: number;
}

export interface PingRecord {
    timestamp: string;
    status: 'success';
    metadata?: Record<string, unknown>;
}

export interface JobWithStatus {
    config: JobConfig;
    status: JobStatus;
    recentHistory?: PingRecord[];
}

export interface Alert {
    id: string;
    jobId: string;
    jobName: string;
    timestamp: string;
    type: 'missed_heartbeat';
    message: string;
    severity: 'warning' | 'critical';
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

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

// API Base URL
const API_BASE = '/api';

// Helper function for API calls
async function apiCall<T>(
    path: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    return await response.json();
}

// Job API
export const jobsApi = {
    getAll: () => apiCall<JobWithStatus[]>('/jobs'),

    get: (id: string) => apiCall<JobWithStatus>(`/jobs/${id}`),

    create: (data: CreateJobRequest) =>
        apiCall<{ config: JobConfig; status: JobStatus }>('/jobs', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateJobRequest) =>
        apiCall<JobConfig>(`/jobs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiCall<{ deleted: string }>(`/jobs/${id}`, {
            method: 'DELETE',
        }),

    sendTestNotification: (id: string) =>
        apiCall<{ sent: boolean }>(`/jobs/${id}/test-notification`, {
            method: 'POST',
        }),
};

// Alerts API
export const alertsApi = {
    getAll: () => apiCall<Alert[]>('/alerts'),
};
