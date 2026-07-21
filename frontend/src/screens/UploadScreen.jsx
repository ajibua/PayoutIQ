import React, { useState } from 'react';

export default function UploadScreen({ onExtractionComplete, onCancel, API_URL, token }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleMessyText = (
    "Hi Admin, please process the salary payouts for our contract staff this week:\n\n" +
    "1. Adeola Balogun - 0123456780 - GTBank - 75,000 Naira\n" +
    "2. Pay Chinedu Okafor 120,000 Naira. Access Bank account 0123456782\n" +
    "3. Salary for Nneka Ezechi is 45,000. Send to her Access Bank account 0123456782 as well.\n" +
    "4. For UBA account 0123456783 (Oluwaseun Balogun), disburse 95,000.\n" +
    "5. Zenith Bank supplies: send 150k to account 0123456787 (Note: list owner name as Zenith Bank Supplier)\n" +
    "6. Lastly, refund 3,500 to OPay account 9000000001 (marked as Refund Client)"
  );

  const handleLoadSample = () => {
    setText(sampleMessyText);
    setError(null);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payouts/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = response.json();
      const payload = await data;

      if (response.ok) {
        onExtractionComplete(payload.payees);
      } else {
        setError(payload.detail || 'Failed to extract payout data. Please check your input.');
      }
    } catch (err) {
      setError('Connection refused. Please check if your FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // A simple reader to load CSV text and paste it into the textarea
    const reader = new FileReader();
    reader.onload = (evt) => {
      const fileText = evt.target.result;
      setText(fileText);
    };
    reader.readAsText(file);
  };

  return (
    <div className="container anim-fade" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
          Create Payout Batch
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
          Paste raw payout list notes, WhatsApp logs, or drop a CSV file below. Our AI structures it, then checks account numbers dynamically.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Text entry */}
        <div className="card">
          <form onSubmit={handleTextSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="rawText" style={{ margin: 0 }}>Payout Instructions / Raw List</label>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ minHeight: '30px', padding: '4px 10px', fontSize: '12px' }}
                  onClick={handleLoadSample}
                >
                  Load Sample Messy Text
                </button>
              </div>
              
              <textarea
                id="rawText"
                className="form-input"
                style={{ minHeight: '260px', fontFamily: 'monospace', resize: 'vertical', padding: '14px', lineHeight: '1.5' }}
                placeholder="Paste lists here. E.g.:&#10;John Doe - 100,000 Naira - GTBank - 0123456789&#10;Pay Jane 50k to Zenith account 0987654321..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={loading}
              />
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

            <div className="flex justify-between align-center" style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !text.trim()}
                style={{ padding: '10px 28px', minWidth: '160px' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#ffffff', marginRight: '8px' }}></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue to Review
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Drop Zone CSV & Instructions info */}
        <div className="flex flex-col gap-3">
          {/* File Upload card */}
          <div className="card" style={{ borderStyle: 'dashed', borderWidth: '2px', textAlign: 'center', padding: '36px 24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-light)', margin: '0 auto 12px auto' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Import CSV File</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Format: name, bank_name, account, amount</p>
            <label className="btn btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer', margin: 0, minHeight: '36px' }}>
              Browse Files
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Quick instructions tips */}
          <div className="card">
            <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '15.5px', fontWeight: '700', marginBottom: '12px' }}>Formatting Guidelines</h4>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>&bull;</span>
                <span>The AI is highly flexible; write in bullets, tables, or normal text.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>&bull;</span>
                <span>Ensure each line has an **amount**, a **10-digit account number**, and a **bank name** (formal or initials).</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>&bull;</span>
                <span>Names will be checked directly against official bank registry records on the next screen.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
