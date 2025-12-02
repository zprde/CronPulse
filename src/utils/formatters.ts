/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string): string {
    const now = Date.now();
    const past = new Date(timestamp).getTime();
    const diff = now - past;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else if (seconds > 0) {
        return `${seconds}s ago`;
    } else {
        return 'just now';
    }
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Format absolute timestamp
 */
export function formatAbsoluteTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}

/**
 * Generate integration URL for heartbeat endpoint
 */
export function getHeartbeatUrl(jobId: string): string {
    const origin = window.location.origin;
    return `${origin}/api/heartbeat/${jobId}`;
}

/**
 * Generate curl command example
 */
export function getCurlCommand(jobId: string): string {
    const url = getHeartbeatUrl(jobId);
    return `curl -X POST ${url}`;
}
