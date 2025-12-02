import type { JobWithStatus } from '../utils/api';
import { formatRelativeTime, formatDuration } from '../utils/formatters';

interface JobListProps {
    jobs: JobWithStatus[];
    onSelectJob: (jobId: string) => void;
    onDeleteJob: (jobId: string) => void;
}

export default function JobList({ jobs, onSelectJob, onDeleteJob }: JobListProps) {
    if (jobs.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Jobs Yet</h3>
                <p>Create your first cron job to start monitoring</p>
            </div>
        );
    }

    return (
        <div className="job-list">
            {jobs.map((job) => (
                <div key={job.config.id} className="job-card card fade-in">
                    <div className="job-header">
                        <div className="job-info">
                            <h3>{job.config.name}</h3>
                            {job.config.description && (
                                <p className="text-muted text-sm">{job.config.description}</p>
                            )}
                        </div>
                        <span className={`status-badge status-${job.status.status}`}>
                            {job.status.status}
                        </span>
                    </div>

                    <div className="job-stats">
                        <div className="stat">
                            <span className="stat-label">Last Ping</span>
                            <span className="stat-value">{formatRelativeTime(job.status.lastPingTime)}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Interval</span>
                            <span className="stat-value">{formatDuration(job.config.expectedInterval)}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Total Pings</span>
                            <span className="stat-value">{job.status.totalPings.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="job-actions">
                        <button onClick={() => onSelectJob(job.config.id)} className="btn btn-secondary btn-sm">
                            View Details
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete job "${job.config.name}"?`)) {
                                    onDeleteJob(job.config.id);
                                }
                            }}
                            className="btn btn-danger btn-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}

            <style>{`
				.job-list {
					display: grid;
					gap: 1rem;
				}

				.job-card {
					cursor: pointer;
					transition: all var(--transition-base);
				}

				.job-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 1.25rem;
					gap: 1rem;
				}

				.job-info {
					flex: 1;
					min-width: 0;
				}

				.job-info h3 {
					font-size: 1.125rem;
					margin-bottom: 0.25rem;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.job-stats {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 1.5rem;
					margin-bottom: 1.25rem;
					padding: 1rem;
					background: var(--bg-secondary);
					border-radius: var(--radius-sm);
				}

				.stat {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.stat-label {
					font-size: 0.75rem;
					text-transform: uppercase;
					letter-spacing: 0.05em;
					color: var(--text-muted);
					font-weight: 600;
				}

				.stat-value {
					font-size: 1.125rem;
					font-weight: 600;
					color: var(--text-primary);
				}

				.job-actions {
					display: flex;
					gap: 0.75rem;
					justify-content: flex-end;
				}

				.btn-sm {
					padding: 0.5rem 1rem;
					font-size: 0.8125rem;
				}

				.empty-state {
					text-align: center;
					padding: 4rem 2rem;
				}

				.empty-icon {
					font-size: 4rem;
					margin-bottom: 1rem;
				}

				.empty-state h3 {
					margin-bottom: 0.5rem;
					color: var(--text-primary);
				}

				.empty-state p {
					color: var(--text-muted);
				}

				@media (max-width: 768px) {
					.job-stats {
						grid-template-columns: 1fr;
						gap: 1rem;
					}

					.job-actions {
						flex-direction: column;
					}

					.btn-sm {
						width: 100%;
					}
				}
			`}</style>
        </div>
    );
}
