import React, { useState, useEffect, useRef } from 'react';

export default function StatusScreen({ batchId, onFinished, API_URL, token }) {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payouts/batches/${batchId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      
      if (response.ok) {
        setBatch(res);
        setLoading(false);
        
        // Stop polling if batch is completed or failed
        if (['COMPLETED', 'FAILED'].includes(res.status)) {
          clearInterval(pollingRef.current);
        }
      } else {
        setError(res.detail || 'Failed to fetch batch progress.');
        clearInterval(pollingRef.current);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Set up polling interval every 1.5 seconds
    pollingRef.current = setInterval(fetchStatus, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [batchId]);

  const handleExportCSV = () => {
    if (!batch || !batch.payees) return;

    // Build CSV content
    const headers = ['Recipient Name', 'Account Number', 'Bank Name', 'Amount (NGN)', 'Status', 'Failure Reason', 'Reference'];
    const rows = batch.payees.map(p => [
      `"${p.name}"`,
      `="${p.account_number}"`, // prefix with = to prevent excel dropping leading zeros
      `"${p.bank_name}"`,
      p.amount,
      p.status,
      `"${p.failure_reason || ''}"`,
      p.reference
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payout_Report_${batch.reference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  if (loading && !batch) {
    return (
      <div className="container flex flex-col justify-center align-center anim-fade" style={{ minHeight: '360px', gap: '16px' }}>
        <div className="spinner"></div>
        <div style={{ color: 'var(--text-muted)' }}>Loading live status logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container anim-fade" style={{ padding: '40px 16px', maxWidth: '600px' }}>
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '12px' }}>Failed to Load Status</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
          <button className="btn btn-primary" onClick={onFinished}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const progressPercent = batch.total_count > 0 
    ? Math.round(((batch.completed_count + batch.failed_count) / batch.total_count) * 100) 
    : 0;

  const isFinished = ['COMPLETED', 'FAILED'].includes(batch.status);

  return (
    <div className="container anim-fade" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            Payout Batch Execution Status
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Ref: <strong style={{ color: 'var(--text-main)' }}>{batch.reference}</strong> &bull; {batch.title}
          </p>
        </div>
        <span className={`badge ${
          batch.status === 'COMPLETED' ? 'badge-success' : 
          batch.status === 'FAILED' ? 'badge-danger' : 'badge-primary'
        }`} style={{ fontSize: '14px', padding: '6px 14px' }}>
          {batch.status}
        </span>
      </div>

      {/* Progress Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="flex justify-between align-center" style={{ marginBottom: '12px' }}>
          <strong style={{ fontSize: '16px' }}>
            {isFinished ? 'Execution Finished' : 'Processing Transactions...'}
          </strong>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
            {batch.completed_count + batch.failed_count} of {batch.total_count} processed ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar wrapper */}
        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-app)', borderRadius: '999px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            backgroundColor: batch.status === 'FAILED' ? 'var(--danger)' : 'var(--primary)', 
            transition: 'width 0.4s ease-out',
            borderRadius: '999px'
          }}></div>
        </div>

        {/* Status statistics logs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL AMOUNT</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>{formatCurrency(batch.total_amount)}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: '600' }}>SUCCESSFUL</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)', marginTop: '4px' }}>{batch.completed_count}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--danger-text)', fontWeight: '600' }}>FAILED</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', marginTop: '4px' }}>{batch.failed_count}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PENDING</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>
              {batch.total_count - (batch.completed_count + batch.failed_count)}
            </div>
          </div>
        </div>
      </div>

      {/* Payee status logs list table */}
      <div className="table-container" style={{ marginBottom: '28px' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S/N</th>
              <th>Recipient Name</th>
              <th>Bank Name</th>
              <th>Account Number</th>
              <th>Amount</th>
              <th>Disbursement Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {batch.payees.map((payee, index) => (
              <React.Fragment key={payee.id}>
                <tr>
                  <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ fontWeight: '600' }}>{payee.name}</td>
                  <td>{payee.bank_name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{payee.account_number}</td>
                  <td style={{ fontWeight: '700' }}>{formatCurrency(payee.amount)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-muted)' }}>{payee.reference}</td>
                  <td>
                    <span className={`badge ${
                      payee.status === 'SUCCESS' ? 'badge-success' : 
                      payee.status === 'FAILED' ? 'badge-danger' : 'badge-primary'
                    }`}>
                      {payee.status}
                    </span>
                  </td>
                </tr>
                {payee.failure_reason && (
                  <tr>
                    <td colSpan="7" style={{ padding: '8px 18px 12px 18px', borderTop: 'none', backgroundColor: 'var(--danger-light)' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span><strong>Failure Reason:</strong> {payee.failure_reason}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="flex justify-between align-center card" style={{ padding: '20px 24px' }}>
        <button 
          className="btn btn-secondary"
          onClick={handleExportCSV}
          disabled={batch.total_count === 0}
        >
          {/* Custom SVG Download */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Payout Audit Report (CSV)
        </button>
        
        <button 
          className="btn btn-primary"
          onClick={onFinished}
          style={{ padding: '12px 28px' }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
