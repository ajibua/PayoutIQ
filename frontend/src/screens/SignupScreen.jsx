import React, { useState } from 'react';

export default function SignupScreen({ onSignupSuccess, onNavigateToLogin, API_URL }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      organization_name: organizationName || null,
      email: email,
      password: password,
      confirm_password: confirmPassword
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = response.json();
      const resData = await data;

      if (response.ok) {
        onSignupSuccess(resData);
      } else {
        setError(resData.detail || 'Signup failed. Please verify your details.');
      }
    } catch (err) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center align-center anim-fade" style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 16px' }}>
      <div className="card w-full" style={{ maxWidth: '520px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Set up your organization payout profile
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                className="form-input"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="middleName">Middle Name</label>
              <input
                id="middleName"
                type="text"
                className="form-input"
                placeholder="Optional"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="orgName">Organization</label>
              <input
                id="orgName"
                type="text"
                className="form-input"
                placeholder="e.g. Acme Corp"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Choose password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Verify password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
            style={{ padding: '12px 24px', fontSize: '15px', marginTop: '12px' }}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: '#ffffff' }}></div> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13.5px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <a 
            href="#login" 
            onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} 
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
