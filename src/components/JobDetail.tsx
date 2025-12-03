import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JobWithStatus } from '../utils/api';
import { formatRelativeTime, formatAbsoluteTime, formatDuration, getHeartbeatUrl, getCurlCommand } from '../utils/formatters';

interface JobDetailProps {
    job: JobWithStatus;
    onClose: () => void;
    onEdit: () => void;
}

export default function JobDetail({ job, onClose, onEdit }: JobDetailProps) {
    const { t } = useTranslation();
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    return (
        <div className="job-detail">
            <div className="detail-header">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <h2>{job.config.name}</h2>
                        <span className={`status-badge status-${job.status.status}`}>
                            {t(`status.${job.status.status}`)}
                        </span>
                    </div>
                    {job.config.description && <p className="text-muted">{job.config.description}</p>}
                </div>
                <div className="detail-header-actions">
                    <button onClick={onEdit} className="btn btn-primary btn-sm">
                        {t('jobDetail.edit')}
                    </button>
                    <button onClick={onClose} className="btn btn-secondary">
                        {t('jobDetail.backToList')}
                    </button>
                </div>
            </div>

            <div className="detail-grid">
                <div className="card">
                    <h3>{t('jobDetail.configuration')}</h3>
                    <div className="config-list">
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.expectedInterval')}</span>
                            <span className="config-value">{formatDuration(job.config.expectedInterval)}</span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.alertThreshold')}</span>
                            <span className="config-value">{formatDuration(job.config.alertThreshold)}</span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.created')}</span>
                            <span className="config-value">{formatAbsoluteTime(job.config.createdAt)}</span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.updated')}</span>
                            <span className="config-value">{formatAbsoluteTime(job.config.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3>{t('jobDetail.status')}</h3>
                    <div className="config-list">
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.lastPing')}</span>
                            <span className="config-value">{formatRelativeTime(job.status.lastPingTime)}</span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.totalPings')}</span>
                            <span className="config-value">{job.status.totalPings.toLocaleString()}</span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">{t('jobDetail.consecutiveMisses')}</span>
                            <span className="config-value">{job.status.consecutiveMisses}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>{t('jobDetail.integration')}</h3>
                <p className="text-muted mb-4">{t('jobDetail.integrationDescription')}</p>

                <div className="integration-box">
                    <label>{t('jobDetail.heartbeatUrl')}</label>
                    <div className="code-block">
                        <code>{getHeartbeatUrl(job.config.id)}</code>
                        <button
                            onClick={() => copyToClipboard(getHeartbeatUrl(job.config.id))}
                            className="copy-btn"
                            aria-label={t('jobDetail.copyUrl')}
                        >
                            {showCopyFeedback ? '✓' : '📋'}
                        </button>
                    </div>
                </div>

                <div className="integration-box">
                    <label>{t('jobDetail.curlExample')}</label>
                    <div className="code-block">
                        <code>{getCurlCommand(job.config.id)}</code>
                        <button
                            onClick={() => copyToClipboard(getCurlCommand(job.config.id))}
                            className="copy-btn"
                            aria-label={t('jobDetail.copyCommand')}
                        >
                            {showCopyFeedback ? '✓' : '📋'}
                        </button>
                    </div>
                </div>

                <div className="integration-box">
                    <label>{t('jobDetail.bashExample')}</label>
                    <div className="code-block">
                        <code>
                            {`#!/bin/bash
${t('jobDetail.bashComment1')}
${t('jobDetail.bashComment2')}

${t('jobDetail.bashComment3')}
${getCurlCommand(job.config.id)}`}
                        </code>
                        <button
                            onClick={() => copyToClipboard(`#!/bin/bash\n${t('jobDetail.bashComment1')}\n${t('jobDetail.bashComment2')}\n\n${t('jobDetail.bashComment3')}\n${getCurlCommand(job.config.id)}`)}
                            className="copy-btn"
                            aria-label={t('jobDetail.copyScript')}
                        >
                            {showCopyFeedback ? '✓' : '📋'}
                        </button>
                    </div>
                </div>
            </div>

            {job.recentHistory && job.recentHistory.length > 0 && (
                <div className="card">
                    <h3>Recent History</h3>
                    <div className="history-list">
                        {job.recentHistory.map((ping, idx) => (
                            <div key={idx} className="history-item">
                                <span className="history-time">{formatRelativeTime(ping.timestamp)}</span>
                                <span className="history-status">✓ Success</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
				.job-detail {
					animation: fadeIn 0.3s ease-out;
				}

				.detail-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 2rem;
				gap: 2rem;
			}

			.detail-header-actions {
				display: flex;
				gap: 0.75rem;
			}
				.detail-grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 1rem;
					margin-bottom: 1rem;
				}

				.config-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
					margin-top: 1rem;
				}

				.config-item {
					display: flex;
					justify-content: space-between;
					padding-bottom: 0.75rem;
					border-bottom: 1px solid var(--border-color);
				}

				.config-item:last-child {
					border-bottom: none;
					padding-bottom: 0;
				}

				.config-label {
					font-size: 0.875rem;
					color: var(--text-muted);
					font-weight: 500;
				}

				.config-value {
					font-weight: 600;
					color: var(--text-primary);
				}

				.integration-box {
					margin-bottom: 1.5rem;
				}

				.integration-box:last-child {
					margin-bottom: 0;
				}

				.integration-box label {
					display: block;
					margin-bottom: 0.5rem;
					font-size: 0.875rem;
					font-weight: 600;
					color: var(--text-secondary);
				}

				.code-block {
					position: relative;
					background: var(--bg-secondary);
					border: 1px solid var(--border-color);
					border-radius: var(--radius-sm);
					padding: 1rem;
					font-family: 'Monaco', 'Courier New', monospace;
					font-size: 0.8125rem;
				}

				.code-block code {
					color: var(--accent-primary);
					white-space: pre-wrap;
					word-break: break-all;
				}

				.copy-btn {
					position: absolute;
					top: 0.75rem;
					right: 0.75rem;
					background: var(--bg-card);
					border: 1px solid var(--border-color);
					border-radius: var(--radius-sm);
					padding: 0.375rem 0.75rem;
					cursor: pointer;
					transition: all var(--transition-base);
					font-size: 1rem;
				}

				.copy-btn:hover {
					background: var(--accent-primary);
					border-color: var(--accent-primary);
				}

				.history-list {
					margin-top: 1rem;
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				.history-item {
					display: flex;
					justify-content: space-between;
					padding: 0.75rem 1rem;
					background: var(--bg-secondary);
					border-radius: var(--radius-sm);
				}

				.history-time {
					color: var(--text-secondary);
					font-size: 0.875rem;
				}

				.history-status {
					color: var(--success);
					font-weight: 600;
					font-size: 0.875rem;
				}

				@media (max-width: 768px) {
					.detail-header {
						flex-direction: column;
					}

					.detail-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
        </div>
    );
}
