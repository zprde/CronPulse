import { useState, useEffect } from 'react';
import './App.css';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import JobDetail from './components/JobDetail';
import { jobsApi, type JobWithStatus, type CreateJobRequest } from './utils/api';

function App() {
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch jobs on mount and refresh every 30 seconds
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    const response = await jobsApi.getAll();
    if (response.success && response.data) {
      setJobs(response.data);
    }
    setIsLoading(false);
  };

  const handleCreateJob = async (data: CreateJobRequest) => {
    const response = await jobsApi.create(data);
    if (response.success) {
      await fetchJobs();
      setShowForm(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const response = await jobsApi.delete(jobId);
    if (response.success) {
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }
      await fetchJobs();
    }
  };

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.config.id === selectedJobId)
    : null;

  // Calculate stats
  const healthyCount = jobs.filter((j) => j.status.status === 'healthy').length;
  const warningCount = jobs.filter((j) => j.status.status === 'warning').length;
  const criticalCount = jobs.filter((j) => j.status.status === 'critical').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>⚡ CronPulse</h1>
              <p className="tagline">Monitor your cron jobs with heartbeat alerts</p>
            </div>
            {!selectedJob && !showForm && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                + Add Job
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container main-content">
        {!selectedJob && !showForm && (
          <>
            <div className="stats-grid">
              <div className="stat-card card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-number">{jobs.length}</div>
                  <div className="stat-label">Total Jobs</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <div className="stat-number">{healthyCount}</div>
                  <div className="stat-label">Healthy</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <div className="stat-number">{warningCount}</div>
                  <div className="stat-label">Warning</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-icon">🔴</div>
                <div className="stat-info">
                  <div className="stat-number">{criticalCount}</div>
                  <div className="stat-label">Critical</div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state">Loading jobs...</div>
            ) : (
              <JobList
                jobs={jobs}
                onSelectJob={setSelectedJobId}
                onDeleteJob={handleDeleteJob}
              />
            )}
          </>
        )}

        {showForm && (
          <div className="card">
            <JobForm
              onSubmit={handleCreateJob}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {selectedJob && (
          <JobDetail
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="text-muted text-sm">
            CronPulse • Powered by Cloudflare Workers
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

