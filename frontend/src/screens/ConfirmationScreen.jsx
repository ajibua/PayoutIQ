import React, { useState } from 'react';

export default function ConfirmationScreen({ batchDetails, onConfirmComplete, onCancel, API_URL, token }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendPayments = async () => {
    if (!checked || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payouts/batches/${batchDetails.batch_id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.json();
      const res = await data;

      if (response.ok) {
        onConfirmComplete({
          status: res.status, // PROCESSING or PENDING_OTP
          batch_id: batchDetails.batch_id,
          message: res.message
        });
      } else {
        setError(res.detail || 'Authorization failed. Transaction rejected by Monnify Sandbox.');
      }
    } catch (err) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="container flex justify-center align-center anim-fade" style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 16px' }}>
      <div className="card w-full" style={{ maxWidth: '520px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Custom SVG Warning */}
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px auto', color: 'var(--warning)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>
            Authorize Disbursement
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginTop: '4px' }}>
            One final check before real money moves from your wallet
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: '13px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>{error}</div>
          </div>
        )}

        {/* Summary sheet details list */}
        <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Batch Title:</span>
              <strong style={{ color: 'var(--text-main)' }}>{batchDetails.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Payees:</span>
              <strong style={{ color: 'var(--text-main)' }}>{batchDetails.total_count || batchDetails.payees?.length} recipients</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Disbursement Source:</span>
              <span style={{ fontWeight: '600' }}>Monnify Sandbox Wallet</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Total Debit Amount:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '18px' }}>{formatCurrency(batchDetails.total_amount)}</strong>
            </div>
          </div>
        </div>

        {/* Safety Agreement Checkbox */}
        <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', userSelect: 'none' }}>
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => setChecked(e.target.checked)} 
            disabled={loading}
            style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
          />
          <span>
            I confirm that I have verified the payee list. I authorize PayoutIQ to execute these bank transfers from our organization's sandbox wallet.
          </span>
        </label>

        {/* Action Panel */}
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
            type="button" 
            className="btn btn-primary w-full"
            disabled={!checked || loading}
            onClick={handleSendPayments}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: '#ffffff' }}></div>
            ) : (
              'Yes, Send Payments'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
