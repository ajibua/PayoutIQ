import React, { useState } from 'react';

export default function OtpScreen({ batchId, onOtpVerified, onCancel, API_URL, token }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payouts/batches/${batchId}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });
      const data = response.json();
      const res = await data;

      if (response.ok) {
        onOtpVerified();
      } else {
        setError(res.detail || 'Invalid OTP. Please check the code and try again.');
      }
    } catch (err) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center align-center anim-fade" style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 16px' }}>
      <div className="card w-full" style={{ maxWidth: '440px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Custom SVG Shield / Lock */}
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>
            OTP Security Verification
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Monnify requires a payout authorization code. We have simulated sending an OTP to your business email.
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
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="otp">Enter 6-Digit Code</label>
            <input
              id="otp"
              type="text"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.3em', fontFamily: 'monospace', fontWeight: '700', height: '48px' }}
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', textAlign: 'center', display: 'block' }}>
              For Demo Sandbox simulation, enter <strong style={{ color: 'var(--text-muted)' }}>123456</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn btn-secondary w-full" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={loading || otp.length < 4}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: '#ffffff' }}></div>
              ) : (
                'Submit Code'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
