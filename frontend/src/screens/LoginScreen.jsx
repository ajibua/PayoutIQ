import React, { useState } from 'react';

export default function LoginScreen({ onLogin, onNavigateToSignup, API_URL }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = response.json();
      
      const payload = await data;
      if (response.ok) {
        onLogin(payload);
      } else {
        setError(payload.detail || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    setLoading(true);
    // Pass current origin as state parameter so backend can redirect back here
    const currentOrigin = window.location.origin;
    window.location.href = `${API_URL}/api/auth/${provider}/login?state=${encodeURIComponent(currentOrigin)}`;
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setMessage('Forgot password link clicked! Instructions sent to registered email.');
  };

  return (
    <div className="container flex justify-center align-center anim-fade" style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 16px' }}>
      <div className="card w-full" style={{ maxWidth: '440px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Sign in to manage your business payouts
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: '13px', margin: '0 0 20px 0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="alert alert-success" style={{ fontSize: '13px', margin: '0 0 20px 0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>{message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="example@yourbusiness.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <a 
              href="#forgot" 
              onClick={handleForgotPassword} 
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
            >
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: '#ffffff' }}></div> : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-light)', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          <span style={{ padding: '0 12px', fontWeight: '500' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary w-full" 
            style={{ fontSize: '13.5px', justifyContent: 'center' }} 
            onClick={() => handleOAuth('google')}
            disabled={loading}
          >
            {/* Custom Google Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13.5px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <a 
            href="#signup" 
            onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }} 
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
