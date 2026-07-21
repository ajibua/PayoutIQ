import React, { useState, useEffect } from 'react';

export default function HistoryScreen({ onNavigate, API_URL, token }) {
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // 1. Calculate Analytics Metrics from History
  const completedBatches = batches.filter(b => b.status === 'COMPLETED');
  const totalDisbursed = completedBatches.reduce((sum, b) => sum + b.total_amount, 0);
  const successRate = batches.length > 0 
    ? Math.round((completedBatches.length / batches.length) * 100) 
    : 100;
  
  const pendingBatches = batches.filter(b => ['PROCESSING', 'PENDING_OTP', 'PENDING_APPROVAL'].includes(b.status)).length;
  const failedBatchesCount = batches.filter(b => b.status === 'FAILED').length;

  // 2. Filter batches by search query
  const filteredBatches = batches.filter(b => 
    b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container anim-fade" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            Treasury Dashboard & Audit Logs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Monitor cash disbursement metrics and review the historical audit trails of all payroll batches.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('UPLOAD')}>
          + New Payout Batch
        </button>
      </div>

      {loading ? (
        <div className="card flex flex-col justify-center align-center" style={{ height: '300px', gap: '12px' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Retrieving dashboard data...</span>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '12px' }}>Error Loading Dashboard</h3>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            {/* Card 1: Total Volume */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Volume Disbursed
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
                {formatCurrency(totalDisbursed)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--success-text)' }}>
                Successfully processed payouts
              </div>
            </div>

            {/* Card 2: Total Batches */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #A78BFA' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Payout Batches
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
                {batches.length} batches
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Created in workspace history
              </div>
            </div>

            {/* Card 3: Success Rate */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Batch Success Rate
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>
                {successRate}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {completedBatches.length} of {batches.length} completed
              </div>
            </div>

            {/* Card 4: Operations Pending */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `4px solid ${pendingBatches > 0 ? 'var(--warning)' : 'var(--border)'}` }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending / Processing
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: pendingBatches > 0 ? 'var(--warning-text)' : 'var(--text-main)' }}>
                {pendingBatches} active
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {failedBatchesCount} batches failed execution
              </div>
            </div>

          </div>

          {/* Audit Logs and Search */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
                Execution Audit Trail
              </h3>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <input
                  type="text"
                  placeholder="Search by reference or title..."
                  className="form-input"
                  style={{ paddingRight: '36px', minHeight: '38px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No batch matches your search query. Try another term.
              </div>
            ) : (
              <div className="table-container">
                <table className="table" style={{ margin: 0 }}>
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
                    {filteredBatches.map((batch) => (
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
        </>
      )}
    </div>
  );
}
