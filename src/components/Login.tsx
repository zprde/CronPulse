import { useState, type FormEvent } from 'react';

interface LoginProps {
    onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                onLoginSuccess();
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <h1>⚡ CronPulse</h1>
                    <p className="login-subtitle">Dashboard Authentication</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            🔒 {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">Admin Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={isLoading || !password}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-muted text-sm">
                        Access restricted to authorized users only
                    </p>
                </div>
            </div>

            <style>{`
				.login-container {
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem;
					background: var(--bg-primary);
				}

				.login-card {
					max-width: 400px;
					width: 100%;
					padding: 2.5rem;
					animation: fadeIn 0.3s ease-out;
				}

				.login-header {
					text-align: center;
					margin-bottom: 2rem;
				}

				.login-header h1 {
					margin-bottom: 0.5rem;
				}

				.login-subtitle {
					color: var(--text-muted);
					font-size: 0.875rem;
				}

				.login-form {
					margin-bottom: 1.5rem;
				}

				.error-message {
					background: rgba(239, 68, 68, 0.1);
					border: 1px solid rgba(239, 68, 68, 0.3);
					color: var(--critical);
					padding: 0.875rem 1rem;
					border-radius: var(--radius-sm);
					margin-bottom: 1.5rem;
					font-size: 0.875rem;
					animation: fadeIn 0.2s ease-out;
				}

				.btn-block {
					width: 100%;
					justify-content: center;
				}

				.btn-primary:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.login-footer {
					text-align: center;
					padding-top: 1.5rem;
					border-top: 1px solid var(--border-color);
				}

				@media (max-width: 640px) {
					.login-card {
						padding: 2rem 1.5rem;
					}
				}
			`}</style>
        </div>
    );
}
