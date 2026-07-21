import React, { useState, useEffect } from 'react';

export default function ReviewScreen({ extractedPayees, onConfirmBatch, onBack, API_URL, token }) {
  const [payees, setPayees] = useState([]);
  const [title, setTitle] = useState('');
  const [narration, setNarration] = useState('PayoutIQ bulk pay');
  const [banks, setBanks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // Local temporary states for row editing
  const [editName, setEditName] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editBankCode, setEditBankCode] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [savingRowId, setSavingRowId] = useState(null);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
    setTitle(`Disbursement Batch - ${dateStr}`);
    
    // Assign local temporary IDs for list mapping
    const items = extractedPayees.map((p, idx) => ({
      ...p,
      temp_id: `temp-${idx}-${Date.now()}`
    }));
    setPayees(items);
    fetchBanks();
  }, [extractedPayees]);

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payouts/banks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBanks(data.banks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (tempId) => {
    const updated = payees.filter(p => p.temp_id !== tempId);
    setPayees(recalculateDuplicates(updated));
  };

  const handleStartEdit = (payee) => {
    setEditingId(payee.temp_id);
    setEditName(payee.name);
    setEditAccount(payee.account_number);
    setEditBankCode(payee.bank_code);
    setEditAmount(payee.amount.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveRow = async (tempId) => {
    if (!editName || !editAccount || !editBankCode || !editAmount) return;
    setSavingRowId(tempId);

    const selectedBank = banks.find(b => b.code === editBankCode);
    const bankName = selectedBank ? selectedBank.name : 'Unknown Bank';

    try {
      // Re-run account verification for this specific row using FastAPI
      const response = await fetch(`${API_URL}/api/payouts/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          account_number: editAccount,
          bank_code: editBankCode
        })
      });
      
      const res = await response.json();
      
      if (response.ok) {
        // Update local state
        const updated = payees.map(p => {
          if (p.temp_id === tempId) {
            return {
              ...p,
              name: editName,
              account_number: editAccount,
              bank_code: editBankCode,
              bank_name: bankName,
              amount: parseFloat(editAmount) || 0.0,
              verified_name: res.verified_name,
              status: res.status,
              warning_details: res.warning_details
            };
          }
          return p;
        });

        // Re-evaluate duplicates and update
        setPayees(recalculateDuplicates(updated));
        setEditingId(null);
      } else {
        alert(res.detail || 'Failed to verify account number details.');
      }
    } catch (err) {
      alert('Network error. Failed to connect to verification API.');
    } finally {
      setSavingRowId(null);
    }
  };

  // Pre-count occurrences of each account number to recheck duplicates
  const recalculateDuplicates = (list) => {
    const accountCounts = {};
    list.forEach(p => {
      accountCounts[p.account_number] = (accountCounts[p.account_number] || 0) + 1;
    });

    return list.map(p => {
      const isDuplicate = accountCounts[p.account_number] > 1;
      let status = p.status;
      let warning = p.warning_details || '';

      if (isDuplicate) {
        if (status === 'VERIFIED') {
          status = 'FLAGGED';
        }
        if (!warning.includes('DUPLICATE_ACCOUNT')) {
          warning = warning 
            ? `${warning} | DUPLICATE_ACCOUNT: This account number appears multiple times in this batch.` 
            : 'DUPLICATE_ACCOUNT: This account number appears multiple times in this batch.';
        }
      } else {
        // Remove duplicate warning if it was resolved
        if (warning.includes('DUPLICATE_ACCOUNT')) {
          warning = warning.replace(/DUPLICATE_ACCOUNT:.*?(\||$)/g, '').trim();
          if (warning.endsWith('|')) warning = warning.slice(0, -1).trim();
          if (!warning) {
            status = p.verified_name ? 'VERIFIED' : status;
          }
        }
      }

      return {
        ...p,
        status,
        warning_details: warning || null
      };
    });
  };

  // Calculations
  const totalAmount = payees.reduce((sum, p) => sum + p.amount, 0);
  const totalCount = payees.length;
  const invalidCount = payees.filter(p => p.status === 'INVALID').length;
  const flaggedCount = payees.filter(p => p.status === 'FLAGGED').length;

  const handleConfirm = () => {
    if (invalidCount > 0) return;
    onConfirmBatch({
      title,
      narration,
      payees: payees.map(p => ({
        name: p.name,
        account_number: p.account_number,
        bank_name: p.bank_name,
        bank_code: p.bank_code,
        amount: p.amount
      }))
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="container anim-fade" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            Review Payout Batch
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Verify recipient bank information and edit any anomalies before authorizing funds transfer.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          &larr; Back to Upload
        </button>
      </div>

      {/* Batch details form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="batchTitle">Batch Title *</label>
            <input
              id="batchTitle"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="batchNarration">Disbursement Narration</label>
            <input
              id="batchNarration"
              type="text"
              className="form-input"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
          </div>
        </div>

        {/* Batch summary metrics */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '16px', padding: '16px 0 0 0', borderTop: '1px solid var(--border)', fontSize: '14px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Payees:</span>{' '}
            <strong style={{ color: 'var(--text-main)' }}>{totalCount} recipients</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Batch Amount:</span>{' '}
            <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{formatCurrency(totalAmount)}</strong>
          </div>
          {flaggedCount > 0 && (
            <div style={{ color: 'var(--warning-text)', fontWeight: '600' }}>
              ⚠️ {flaggedCount} Flags Need Review
            </div>
          )}
          {invalidCount > 0 && (
            <div style={{ color: 'var(--danger-text)', fontWeight: '700' }}>
              ❌ {invalidCount} Invalid Accounts Must Be Resolved / Deleted
            </div>
          )}
        </div>
      </div>

      {/* Large Summary Alerts */}
      {invalidCount > 0 && (
        <div className="alert alert-danger" style={{ fontSize: '13.5px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <div>
            <strong>Action Required:</strong> The batch contains {invalidCount} invalid bank accounts. You must edit or delete them before you can submit the payouts.
          </div>
        </div>
      )}

      {flaggedCount > 0 && invalidCount === 0 && (
        <div className="alert alert-warning" style={{ fontSize: '13.5px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <strong>Warnings Flagged:</strong> Some rows have duplicate accounts or name mismatch warnings. Verify that they are correct before continuing.
          </div>
        </div>
      )}

      {/* Table container for desktop */}
      <div className="table-container" style={{ marginBottom: '28px' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S/N</th>
              <th>Recipient (Extracted)</th>
              <th>Bank Name</th>
              <th>Account Number</th>
              <th>Verified Account Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payees.map((payee, index) => {
              const isEditing = editingId === payee.temp_id;
              return (
                <React.Fragment key={payee.temp_id}>
                  <tr style={{ 
                    backgroundColor: payee.status === 'INVALID' ? 'rgba(225, 29, 72, 0.02)' : 
                                     payee.status === 'FLAGGED' ? 'rgba(217, 119, 6, 0.02)' : 'inherit'
                  }}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{index + 1}</td>
                    
                    {/* Name Cell */}
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ minHeight: '34px', padding: '4px 8px' }}
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                        />
                      ) : (
                        <span style={{ fontWeight: '500' }}>{payee.name}</span>
                      )}
                    </td>

                    {/* Bank Cell */}
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-input" 
                          style={{ minHeight: '34px', padding: '4px 8px' }}
                          value={editBankCode} 
                          onChange={(e) => setEditBankCode(e.target.value)}
                        >
                          {banks.map(b => (
                            <option key={b.code} value={b.code}>{b.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{payee.bank_name}</span>
                      )}
                    </td>

                    {/* Account Cell */}
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ minHeight: '34px', padding: '4px 8px', fontFamily: 'monospace' }}
                          value={editAccount} 
                          onChange={(e) => setEditAccount(e.target.value)} 
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace' }}>{payee.account_number}</span>
                      )}
                    </td>

                    {/* Verified Name Cell */}
                    <td>
                      <span style={{ fontWeight: '600', color: payee.verified_name ? 'var(--text-main)' : 'var(--text-light)' }}>
                        {payee.verified_name || '(Unverified)'}
                      </span>
                    </td>

                    {/* Amount Cell */}
                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ minHeight: '34px', padding: '4px 8px' }}
                          value={editAmount} 
                          onChange={(e) => setEditAmount(e.target.value)} 
                        />
                      ) : (
                        <span style={{ fontWeight: '700' }}>{formatCurrency(payee.amount)}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge ${
                        payee.status === 'VERIFIED' ? 'badge-success' : 
                        payee.status === 'FLAGGED' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {payee.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button 
                              className="btn btn-primary" 
                              style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11.5px' }}
                              onClick={() => handleSaveRow(payee.temp_id)}
                              disabled={savingRowId === payee.temp_id}
                            >
                              {savingRowId === payee.temp_id ? 'Validating...' : 'Save'}
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11.5px' }}
                              onClick={handleCancelEdit}
                              disabled={savingRowId === payee.temp_id}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11.5px' }}
                              onClick={() => handleStartEdit(payee)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11.5px' }}
                              onClick={() => handleDelete(payee.temp_id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Warning message drop-down sub-row */}
                  {payee.warning_details && (
                    <tr style={{ backgroundColor: payee.status === 'INVALID' ? 'rgba(225, 29, 72, 0.01)' : 'rgba(217, 119, 6, 0.01)' }}>
                      <td colSpan="8" style={{ padding: '8px 18px 14px 18px', borderTop: 'none' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: payee.status === 'INVALID' ? 'var(--danger-text)' : 'var(--warning-text)', 
                          backgroundColor: payee.status === 'INVALID' ? 'var(--danger-light)' : 'var(--warning-light)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: `1px solid ${payee.status === 'INVALID' ? 'rgba(225,29,72,0.1)' : 'rgba(217,119,6,0.1)'}`
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          <span>{payee.warning_details}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action panel */}
      <div className="flex justify-between align-center card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Review the list carefully. Click "Confirm Payout" when you are ready to disburse funds.
        </div>
        <button 
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '15px', minWidth: '180px' }}
          onClick={handleConfirm}
          disabled={invalidCount > 0 || payees.length === 0}
        >
          Confirm Payout
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
