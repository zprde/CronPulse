import { useState, useEffect } from 'react';
import './App.css';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import JobDetail from './components/JobDetail';
import Login from './components/Login';
import { jobsApi, type JobWithStatus, type CreateJobRequest } from './utils/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Fetch jobs on mount and refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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

  const handleUpdateJob = async (data: CreateJobRequest) => {
    if (!editingJobId) return;

    const response = await jobsApi.update(editingJobId, data);
    if (response.success) {
      await fetchJobs();
      setShowForm(false);
      setSelectedJobId(editingJobId); // 返回到编辑的 job 详情页
      setEditingJobId(null);
    }
  };

  const handleEditJob = (jobId: string) => {
    setEditingJobId(jobId);
    setShowForm(true);
    setSelectedJobId(null);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setJobs([]); // Clear jobs on logout
    setSelectedJobId(null); // Clear selected job on logout
    setShowForm(false); // Hide form on logout
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleCancelForm = () => {
    if (editingJobId) {
      // 如果是编辑模式，返回到详情页
      setSelectedJobId(editingJobId);
    }
    setShowForm(false);
    setEditingJobId(null);
  };

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.config.id === selectedJobId)
    : null;

  const editingJob = editingJobId
    ? jobs.find((j) => j.config.id === editingJobId)
    : null;

  // Calculate stats
  const healthyCount = jobs.filter((j) => j.status.status === 'healthy').length;
  const warningCount = jobs.filter((j) => j.status.status === 'warning').length;
  const criticalCount = jobs.filter((j) => j.status.status === 'critical').length;

  if (isAuthenticated === null) {
    return (
      <div className="app">
        <main className="container main-content">
          <div className="loading-state">Loading authentication status...</div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>⚡ CronPulse</h1>
              <p className="tagline">Monitor your cron jobs with heartbeat alerts</p>
            </div>
            <div className="header-actions">
              {!selectedJob && !showForm && (
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                  + Add Job
                </button>
              )}
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
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
              onSubmit={editingJobId ? handleUpdateJob : handleCreateJob}
              onCancel={handleCancelForm}
              initialData={editingJob?.config}
            />
          </div>
        )}

        {selectedJob && (
          <JobDetail
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
            onEdit={() => handleEditJob(selectedJob.config.id)}
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
