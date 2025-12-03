import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateJobRequest, JobConfig } from '../utils/api';

interface JobFormProps {
    onSubmit: (data: CreateJobRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: JobConfig; // For edit mode
}

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

const TIME_MULTIPLIERS: Record<TimeUnit, number> = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
};

const toSeconds = (value: number, unit: TimeUnit): number => {
    return value * TIME_MULTIPLIERS[unit];
};

const fromSeconds = (seconds: number): { value: number; unit: TimeUnit } => {
    if (seconds === 0) return { value: 0, unit: 'seconds' };

    if (seconds % 86400 === 0) return { value: seconds / 86400, unit: 'days' };
    if (seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hours' };
    if (seconds % 60 === 0) return { value: seconds / 60, unit: 'minutes' };

    return { value: seconds, unit: 'seconds' };
};

export default function JobForm({ onSubmit, onCancel, isLoading, initialData }: JobFormProps) {
    const { t } = useTranslation();

    // Internal state for form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Time fields state
    const [intervalValue, setIntervalValue] = useState<number>(1);
    const [intervalUnit, setIntervalUnit] = useState<TimeUnit>('hours');

    const [thresholdValue, setThresholdValue] = useState<number>(5);
    const [thresholdUnit, setThresholdUnit] = useState<TimeUnit>('minutes');

    // Pre-fill form when editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setTags(initialData.tags || []);

            const interval = fromSeconds(initialData.expectedInterval);
            setIntervalValue(interval.value);
            setIntervalUnit(interval.unit);

            const threshold = fromSeconds(initialData.alertThreshold);
            setThresholdValue(threshold.value);
            setThresholdUnit(threshold.unit);
        }
    }, [initialData]);

    const isEditMode = !!initialData;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const formData: CreateJobRequest = {
            name,
            description,
            tags,
            expectedInterval: toSeconds(intervalValue, intervalUnit),
            alertThreshold: toSeconds(thresholdValue, thresholdUnit),
        };

        onSubmit(formData);
    };

    const renderTimeUnitOptions = () => (
        <>
            <option value="seconds">{t('timeUnits.seconds')}</option>
            <option value="minutes">{t('timeUnits.minutes')}</option>
            <option value="hours">{t('timeUnits.hours')}</option>
            <option value="days">{t('timeUnits.days')}</option>
        </>
    );

    return (
        <form onSubmit={handleSubmit} className="job-form">
            <h3>{isEditMode ? t('jobForm.editTitle') : t('jobForm.addTitle')}</h3>

            <div className="form-group">
                <label htmlFor="name">{t('jobForm.nameLabel')}</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t('jobForm.namePlaceholder')}
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">{t('jobForm.descriptionLabel')}</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('jobForm.descriptionPlaceholder')}
                    rows={3}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="interval">{t('jobForm.intervalLabel')}</label>
                    <div className="input-group">
                        <input
                            type="number"
                            id="interval"
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 0))}
                            required
                            min="1"
                        />
                        <select
                            value={intervalUnit}
                            onChange={(e) => setIntervalUnit(e.target.value as TimeUnit)}
                            className="unit-select"
                        >
                            {renderTimeUnitOptions()}
                        </select>
                    </div>
                    <small className="text-muted">
                        {t('jobForm.intervalHelp')}
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="threshold">{t('jobForm.thresholdLabel')}</label>
                    <div className="input-group">
                        <input
                            type="number"
                            id="threshold"
                            value={thresholdValue}
                            onChange={(e) => setThresholdValue(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                        />
                        <select
                            value={thresholdUnit}
                            onChange={(e) => setThresholdUnit(e.target.value as TimeUnit)}
                            className="unit-select"
                        >
                            {renderTimeUnitOptions()}
                        </select>
                    </div>
                    <small className="text-muted">{t('jobForm.thresholdHelp')}</small>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                    {t('jobForm.cancelButton')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (isEditMode ? t('jobForm.updating') : t('jobForm.creating')) : (isEditMode ? t('jobForm.updateButton') : t('jobForm.createButton'))}
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

                .input-group {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .input-group input {
                    flex: 2;
                }
                
                .input-group select {
                    flex: 1;
                    min-width: 80px;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background-color: var(--bg-color);
                    color: var(--text-color);
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
