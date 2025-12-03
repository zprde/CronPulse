import { useState, useEffect, type FormEvent } from 'react';
import type { CreateJobRequest, JobConfig } from '../utils/api';

interface JobFormProps {
    onSubmit: (data: CreateJobRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: JobConfig; // For edit mode
}

export default function JobForm({ onSubmit, onCancel, isLoading, initialData }: JobFormProps) {
    const [formData, setFormData] = useState<CreateJobRequest>({
        name: '',
        description: '',
        expectedInterval: 3600, // 1 hour default
        alertThreshold: 300, // 5 minutes default
        tags: [],
    });

    // Pre-fill form when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                expectedInterval: initialData.expectedInterval,
                alertThreshold: initialData.alertThreshold,
                tags: initialData.tags || [],
            });
        }
    }, [initialData]);

    const isEditMode = !!initialData;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="job-form">
            <h3>{isEditMode ? 'Edit Job' : 'Add New Job'}</h3>

            <div className="form-group">
                <label htmlFor="name">Job Name *</label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Database Backup"
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Daily backup of production database"
                    rows={3}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="interval">Expected Interval (seconds) *</label>
                    <input
                        type="number"
                        id="interval"
                        value={formData.expectedInterval}
                        onChange={(e) =>
                            setFormData({ ...formData, expectedInterval: parseInt(e.target.value) })
                        }
                        required
                        min="1"
                    />
                    <small className="text-muted">
                        How often this job runs (e.g., 3600 = 1 hour)
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="threshold">Alert Threshold (seconds)</label>
                    <input
                        type="number"
                        id="threshold"
                        value={formData.alertThreshold}
                        onChange={(e) =>
                            setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })
                        }
                        min="0"
                    />
                    <small className="text-muted">Grace period before alerting (default: 300)</small>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Job' : 'Create Job')}
                </button>
            </div>

            <style>{`
				.job-form {
					padding: 0.5rem 0;
				}

				.form-group {
					margin-bottom: 1.5rem;
				}

				.form-row {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 1rem;
				}

				.form-group small {
					display: block;
					margin-top: 0.375rem;
					font-size: 0.75rem;
				}

				.form-actions {
					display: flex;
					gap: 1rem;
					justify-content: flex-end;
					margin-top: 2rem;
					padding-top: 1.5rem;
					border-top: 1px solid var(--border-color);
				}

				@media (max-width: 768px) {
					.form-row {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
        </form>
    );
}
