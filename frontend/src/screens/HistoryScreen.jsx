import React, { useState, useEffect } from 'react';

export default function HistoryScreen({ onNavigate, API_URL, token }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payouts/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setBatches(data);
      } else {
        setError(data.detail || 'Failed to retrieve disbursement history log.');
      }
    } catch (e) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="container anim-fade" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            Disbursement Audit Logs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Complete historical audit trail of all parsed, approved, and executed payout lists.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('DASHBOARD')}>
          &larr; Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="card flex flex-col justify-center align-center" style={{ height: '260px', gap: '12px' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Retrieving logs...</span>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '12px' }}>Error Loading History</h3>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-light)' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '18px', fontWeight: '600' }}>No Batches Executed</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '14px' }}>
            There are no past disbursements logged in your database history. Initiate a new list parsing to start payouts.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('UPLOAD')}>
            Create Payout Batch
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch Reference</th>
                <th>Title</th>
                <th>Debit Amount</th>
                <th>Initiated By</th>
                <th>Created Date</th>
                <th>Status</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{batch.reference}</td>
                  <td style={{ fontWeight: '600' }}>{batch.title}</td>
                  <td style={{ fontWeight: '700' }}>{formatCurrency(batch.total_amount)}</td>
                  <td>{batch.created_by}</td>
                  <td>{new Date(batch.created_at).toLocaleString('en-NG')}</td>
                  <td>
                    <span className={`badge ${
                      batch.status === 'COMPLETED' ? 'badge-success' : 
                      ['PROCESSING', 'PENDING_OTP'].includes(batch.status) ? 'badge-primary' : 
                      batch.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline w-full" 
                      style={{ padding: '6px 12px', minHeight: '32px', fontSize: '12.5px' }}
                      onClick={() => onNavigate(`STATUS:${batch.id}`)}
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
